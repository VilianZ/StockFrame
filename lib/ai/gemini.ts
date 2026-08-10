import "server-only";

import { getServerEnv } from "../server/env";
import {
  AiError,
  type AiAnalysisRequest,
  type AiAnalysisResult,
  type AiFailureTelemetry,
  type AiModelAdapter,
  type AiUsage,
  type AiValidationReason,
} from "./contracts";
import { buildAnalysisPrompt } from "./prompt";
import { buildAliasedEvidencePacket, mapEvidenceAliasesToCanonical } from "./evidence-aliases";
import { buildInterpretationGeminiSchema, FlatGeminiValidationError, normalizeFlatGeminiReport } from "./gemini-schema";
import { buildDeterministicReport } from "./deterministic-report";
import { validateModelInterpretation, validateModelReport, validationReasonForCategory, type ModelValidationFailureCategory } from "./validation";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_TOKENS = 8_192;

type FetchFunction = typeof fetch;

export interface GeminiConfig {
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxTokens?: number;
  fetchFn?: FetchFunction;
  validationLogger?: (event: {
    requestId: string;
    category: ModelValidationFailureCategory;
    reason: AiValidationReason;
    finishReason?: string;
  }) => void;
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
    finishReason?: unknown;
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
const GEMINI_FINISH_REASONS = new Set([
  "FINISH_REASON_UNSPECIFIED",
  "STOP",
  "MAX_TOKENS",
  "SAFETY",
  "RECITATION",
  "LANGUAGE",
  "OTHER",
  "BLOCKLIST",
  "PROHIBITED_CONTENT",
  "SPII",
  "MALFORMED_FUNCTION_CALL",
  "IMAGE_SAFETY",
]);

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

function safeFinishReason(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return GEMINI_FINISH_REASONS.has(value) ? value : "OTHER";
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

function normalizeMetricIds(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall through to the delimited form.
    }
  }
  return trimmed.split(/[\s,;]+/).filter(Boolean);
}

function normalizeInterpretationMetricIds(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const root = input as Record<string, unknown>;
  const profiles = root.profiles;
  if (!profiles || typeof profiles !== "object" || Array.isArray(profiles)) return input;
  return {
    ...root,
    profiles: Object.fromEntries(Object.entries(profiles as Record<string, unknown>).map(([profileName, profile]) => {
      if (!profile || typeof profile !== "object" || Array.isArray(profile)) return [profileName, profile];
      const profileRecord = profile as Record<string, unknown>;
      const thesis = profileRecord.thesis;
      const considerations = profileRecord.considerations;
      return [profileName, {
        ...profileRecord,
        thesis: thesis && typeof thesis === "object" && !Array.isArray(thesis)
          ? { ...(thesis as Record<string, unknown>), metricIds: normalizeMetricIds((thesis as Record<string, unknown>).metricIds) }
          : thesis,
        considerations: Array.isArray(considerations)
          ? considerations.map((consideration) => consideration && typeof consideration === "object" && !Array.isArray(consideration)
            ? { ...(consideration as Record<string, unknown>), metricIds: normalizeMetricIds((consideration as Record<string, unknown>).metricIds) }
            : consideration)
          : considerations,
      }];
    })),
  };
}

function parseModelJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced?.[1] ?? trimmed);
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
      const requestUrl = endpoint(this.baseUrl, this.modelId);
      const requestHeaders = {
        "x-goog-api-key": this.apiKey,
        "Content-Type": "application/json",
      };
      const requestBody = {
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: "user", parts: [{ text: prompt.user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: "low" },
          responseSchema: buildInterpretationGeminiSchema(
            evidenceContext.packet.metrics
              .filter((metric) => metric.status === "available")
              .map((metric) => metric.id),
            input.packet.quality.decision === "degraded" ? 0.7 : 0.85,
          ),
          maxOutputTokens: this.maxTokens,
        },
      };
      let response = await this.fetchFn(requestUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        let providerError = await parseProviderError(response, this.apiKey);
        this.statusLogger?.({
          requestId: input.requestId,
          modelId: modelForTelemetry,
          status: response.status,
          providerErrorCode: providerError.code,
          providerErrorMessage: providerError.message,
        });

        if (response.status === 400 && providerError.code === "INVALID_ARGUMENT") {
          response = await this.fetchFn(requestUrl, {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify({
              ...requestBody,
              generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: this.maxTokens,
              },
            }),
            signal: controller.signal,
          });
          if (!response.ok) {
            providerError = await parseProviderError(response, this.apiKey);
            this.statusLogger?.({
              requestId: input.requestId,
              modelId: modelForTelemetry,
              status: response.status,
              providerErrorCode: providerError.code,
              providerErrorMessage: providerError.message,
            });
          }
        }

        if (!response.ok) {
          providerFailure = {
            providerStatus: response.status,
            providerErrorCode: providerError.code,
            providerErrorMessage: providerError.message,
          };
          throw new AiError(
            "AI_UNAVAILABLE",
            "Gemini did not return a successful response",
            response.status === 408 || response.status === 429 || response.status >= 500,
          );
        }
      }

      let payload: GeminiResponse;
      try {
        payload = (await response.json()) as GeminiResponse;
      } catch {
        this.validationLogger?.({
          requestId: input.requestId,
          category: "contract mismatch",
          reason: "invalid_json",
        });
        throw new AiError("AI_INVALID_RESPONSE", "Gemini returned invalid JSON", false);
      }
      usage = parseUsage(payload.usageMetadata);
      const finishReasons = (payload.candidates ?? [])
        .map((candidate) => safeFinishReason(candidate.finishReason))
        .filter((reason): reason is string => reason !== undefined);
      const finishReason = finishReasons.find((reason) => reason === "MAX_TOKENS") ?? finishReasons[0];
      const logContractFailure = (reason: AiValidationReason) => {
        this.validationLogger?.({
          requestId: input.requestId,
          category: "contract mismatch",
          reason,
          ...(finishReason ? { finishReason } : {}),
        });
      };
      if (finishReason === "MAX_TOKENS") {
        logContractFailure("output_truncated");
        throw new AiError("AI_INVALID_RESPONSE", "Gemini output was truncated", false);
      }
      const content = payload.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text)
        .filter((text): text is string => typeof text === "string")
        .join("");
      if (!content || content.trim().length === 0) {
        logContractFailure("missing_content");
        throw new AiError("AI_INVALID_RESPONSE", "Gemini response has no report content", false);
      }

      let rawReport: unknown;
      try {
        rawReport = parseModelJson(content);
      } catch {
        logContractFailure("invalid_json");
        throw new AiError("AI_INVALID_RESPONSE", "Gemini content is not valid JSON", false);
      }
      const normalizedReport = normalizeInterpretationMetricIds(mapEvidenceAliasesToCanonical(rawReport, evidenceContext.aliases));
      const report = Array.isArray(rawReport) || (rawReport && typeof rawReport === "object" && !Array.isArray(rawReport) && "items" in rawReport)
        ? (() => {
            try {
              const legacyReport = normalizeFlatGeminiReport(rawReport, {
                availableMetricIds: evidenceContext.packet.metrics.filter((metric) => metric.status === "available").map((metric) => metric.id),
                corporateActionEvidenceAliases: evidenceContext.packet.corporateActions?.events.map((event) => event.evidenceId) ?? [],
                evidenceAliases: evidenceContext.aliases,
              });
              return validateModelReport(legacyReport, input.packet, (category) => {
                this.validationLogger?.({ requestId: input.requestId, category, reason: validationReasonForCategory(category), ...(finishReason ? { finishReason } : {}) });
              });
            } catch (error) {
              if (error instanceof FlatGeminiValidationError) {
                this.validationLogger?.({ requestId: input.requestId, category: "contract mismatch", reason: error.reason, ...(finishReason ? { finishReason } : {}) });
              }
              throw error;
            }
          })()
        : normalizedReport && typeof normalizedReport === "object" && !Array.isArray(normalizedReport)
        && "profiles" in normalizedReport && !("schemaVersion" in normalizedReport)
        ? validateModelReport(
            buildDeterministicReport(
              input.packet,
              validateModelInterpretation(normalizedReport, input.packet, (category) => {
                this.validationLogger?.({
                  requestId: input.requestId,
                  category,
                  reason: validationReasonForCategory(category),
                });
              }),
            ),
            input.packet,
            (category) => {
              this.validationLogger?.({
                requestId: input.requestId,
                category,
                reason: validationReasonForCategory(category),
              });
            },
          )
        : validateModelReport(normalizedReport, input.packet, (category) => {
            this.validationLogger?.({
              requestId: input.requestId,
              category,
              reason: validationReasonForCategory(category),
            });
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
