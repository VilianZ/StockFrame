import "server-only";

import { getServerEnv } from "../server/env";
import {
  AiError,
  type AiAnalysisRequest,
  type AiAnalysisResult,
  type AiFailureTelemetry,
  type AiModelAdapter,
  type AiUsage,
} from "./contracts";
import { buildAnalysisPrompt } from "./prompt";
import { buildAliasedEvidencePacket, mapEvidenceAliasesToCanonical } from "./evidence-aliases";
import { buildFinalReportGeminiSchema } from "./gemini-schema";
import { validateModelReport, type ModelValidationFailureCategory } from "./validation";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_TOKENS = 4_000;

type FetchFunction = typeof fetch;

export interface GeminiConfig {
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxTokens?: number;
  fetchFn?: FetchFunction;
  validationLogger?: (event: { requestId: string; category: ModelValidationFailureCategory }) => void;
  statusLogger?: (event: {
    requestId: string;
    modelId: string;
    status: number;
    providerErrorCode?: string;
    providerErrorMessage?: string;
  }) => void;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: unknown }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: unknown;
    candidatesTokenCount?: unknown;
    totalTokenCount?: unknown;
  };
}

interface GeminiProviderError {
  code?: string;
  message?: string;
}

interface ProviderFailureTelemetry {
  providerStatus: number;
  providerErrorCode?: string;
  providerErrorMessage?: string;
}

const MAX_PROVIDER_ERROR_CODE_LENGTH = 64;
const MAX_PROVIDER_ERROR_MESSAGE_LENGTH = 160;

function optionalFinite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseUsage(value: GeminiResponse["usageMetadata"]): AiUsage | undefined {
  if (!value) return undefined;
  const usage = {
    promptTokens: optionalFinite(value.promptTokenCount),
    completionTokens: optionalFinite(value.candidatesTokenCount),
    totalTokens: optionalFinite(value.totalTokenCount),
  };
  return Object.values(usage).some((item) => item !== undefined) ? usage : undefined;
}

function endpoint(baseUrl: string, modelId: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(modelId)}:generateContent`;
}

function sanitizeProviderText(value: unknown, maxLength: number, apiKey?: string): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  let sanitized = String(value);
  if (apiKey) sanitized = sanitized.split(apiKey).join("[redacted]");
  sanitized = sanitized
    .replace(/(?:x-goog-api-key|api[-_ ]?key|token|secret|password)\s*[:=]\s*[^\s,;]+/gi, "[redacted]")
    .replace(/authorization\s*[:=]\s*(?:bearer\s+)?[^\s,;]+/gi, "[redacted]")
    .replace(/\bbearer\s+[^\s,;]+/gi, "[redacted]")
    .replace(/https?:\/\/[^\s]+/gi, "[url redacted]")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!sanitized) return undefined;
  return sanitized.slice(0, maxLength);
}

function parseProviderErrorCode(value: unknown, apiKey?: string): string | undefined {
  return sanitizeProviderText(value, MAX_PROVIDER_ERROR_CODE_LENGTH, apiKey)
    ?.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function providerErrorFromPayload(payload: unknown, apiKey?: string): GeminiProviderError {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const candidate = root.error && typeof root.error === "object"
    ? root.error as Record<string, unknown>
    : root;
  const code = parseProviderErrorCode(candidate.status ?? candidate.code, apiKey);
  const message = sanitizeProviderText(candidate.message ?? (typeof root.error === "string" ? root.error : undefined), MAX_PROVIDER_ERROR_MESSAGE_LENGTH, apiKey);
  return { code, message };
}

async function parseProviderError(response: Response, apiKey?: string): Promise<GeminiProviderError> {
  try {
    return providerErrorFromPayload(await response.json(), apiKey);
  } catch {
    return {};
  }
}

export class GeminiAdapter implements AiModelAdapter {
  private readonly apiKey: string | undefined;
  private readonly modelId: string | undefined;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxTokens: number;
  private readonly fetchFn: FetchFunction;
  private readonly validationLogger: GeminiConfig["validationLogger"];
  private readonly statusLogger: GeminiConfig["statusLogger"];

  constructor(config: GeminiConfig = {}) {
    const env = getServerEnv();
    this.apiKey = config.apiKey ?? env.GEMINI_API_KEY;
    this.modelId = config.modelId ?? env.GEMINI_MODEL_ID;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.validationLogger = config.validationLogger;
    this.statusLogger = config.statusLogger;
  }

  async generateReport(input: AiAnalysisRequest, externalSignal?: AbortSignal): Promise<AiAnalysisResult> {
    const startedAt = performance.now();
    const modelForTelemetry = this.modelId ?? "unconfigured";
    let providerFailure: ProviderFailureTelemetry | undefined;
    const failureTelemetry = (usage?: AiUsage): AiFailureTelemetry => ({
      requestId: input.requestId,
      modelId: modelForTelemetry,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      usage,
      ...providerFailure,
    });

    if (!input.packet.quality.aiEligible) {
      const error = new AiError("AI_INSUFFICIENT_DATA", "Data quality does not permit model analysis", false);
      error.telemetry = failureTelemetry();
      throw error;
    }
    if (!this.apiKey || !this.modelId) {
      const error = new AiError("AI_CONFIGURATION", "Gemini configuration is unavailable", false);
      error.telemetry = failureTelemetry();
      throw error;
    }

    const prompt = buildAnalysisPrompt(input);
    const evidenceContext = buildAliasedEvidencePacket(input.packet);
    const controller = new AbortController();
    const abortFromParent = () => controller.abort(externalSignal?.reason);
    if (externalSignal?.aborted) {
      abortFromParent();
    } else {
      externalSignal?.addEventListener("abort", abortFromParent, { once: true });
    }
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    let usage: AiUsage | undefined;

    try {
      const response = await this.fetchFn(endpoint(this.baseUrl, this.modelId), {
        method: "POST",
        headers: {
          "x-goog-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: prompt.system }] },
          contents: [{ role: "user", parts: [{ text: prompt.user }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: buildFinalReportGeminiSchema(
              evidenceContext.packet.metrics
                .filter((metric) => metric.status === "available")
                .map((metric) => metric.id),
              input.packet.quality.decision === "degraded" ? 0.7 : 0.85,
              evidenceContext.packet.corporateActions?.events.map((event) => event.evidenceId) ?? [],
            ),
            maxOutputTokens: this.maxTokens,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const providerError = await parseProviderError(response, this.apiKey);
        providerFailure = {
          providerStatus: response.status,
          providerErrorCode: providerError.code,
          providerErrorMessage: providerError.message,
        };
        this.statusLogger?.({
          requestId: input.requestId,
          modelId: modelForTelemetry,
          status: response.status,
          providerErrorCode: providerError.code,
          providerErrorMessage: providerError.message,
        });
        throw new AiError(
          "AI_UNAVAILABLE",
          "Gemini did not return a successful response",
          response.status === 408 || response.status === 429 || response.status >= 500,
        );
      }

      let payload: GeminiResponse;
      try {
        payload = (await response.json()) as GeminiResponse;
      } catch {
        throw new AiError("AI_INVALID_RESPONSE", "Gemini returned invalid JSON", false);
      }
      usage = parseUsage(payload.usageMetadata);
      const content = payload.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text)
        .filter((text): text is string => typeof text === "string")
        .join("");
      if (!content || content.trim().length === 0) {
        throw new AiError("AI_INVALID_RESPONSE", "Gemini response has no report content", false);
      }

      let rawReport: unknown;
      try {
        rawReport = JSON.parse(content);
      } catch {
        throw new AiError("AI_INVALID_RESPONSE", "Gemini content is not valid JSON", false);
      }
      const canonicalReport = mapEvidenceAliasesToCanonical(rawReport, evidenceContext.aliases);
      const report = validateModelReport(canonicalReport, input.packet, (category) => {
        this.validationLogger?.({ requestId: input.requestId, category });
      });
      return {
        report,
        telemetry: {
          requestId: input.requestId,
          modelId: this.modelId,
          latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
          usage,
        },
      };
    } catch (error) {
      if (error instanceof AiError) {
        error.telemetry = failureTelemetry(usage);
        throw error;
      }
      const mapped = new AiError(
        "AI_UNAVAILABLE",
        controller.signal.aborted ? "Gemini request timed out" : "Gemini request failed",
        true,
      );
      mapped.telemetry = failureTelemetry(usage);
      throw mapped;
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", abortFromParent);
    }
  }
}
