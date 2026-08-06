import { randomUUID } from "node:crypto";

import {
  AnalysisRequestSchema,
  AnalyzeResponseSchema,
  type AnalyzeResponse,
  type AnalysisRequest,
  type Instrument,
} from "../domain";
import {
  AiError,
  type AiModelAdapter,
  validateModelReport,
} from "../ai";
import {
  MarketDataError,
  type MarketDataProvider,
} from "../market-data";
import { normalizeMarketData } from "../market-data";
import { calculateMetrics } from "../metrics";
import { assessDataQuality, buildEvidencePacket } from "../quality";
import { AnalyzeServiceError } from "./errors";

export interface AnalyzeDependencies {
  marketDataProvider: MarketDataProvider;
  aiAdapter: AiModelAdapter;
  now?: () => number;
  requestDeadlineMs?: number;
}

export interface AnalyzeOptions {
  requestId?: string;
}

const DEFAULT_REQUEST_DEADLINE_MS = 55_000;

function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function mapMarketDataError(error: MarketDataError): AnalyzeServiceError {
  switch (error.code) {
    case "INVALID_KEY":
      return new AnalyzeServiceError("PROVIDER_INVALID_KEY", false);
    case "RATE_LIMITED":
      return new AnalyzeServiceError("PROVIDER_RATE_LIMITED", false);
    case "TIMEOUT":
      return new AnalyzeServiceError("PROVIDER_TIMEOUT", true);
    case "MALFORMED_RESPONSE":
      return new AnalyzeServiceError("MALFORMED_PROVIDER_RESPONSE", false);
    case "NOT_FOUND":
    case "UNSUPPORTED_INSTRUMENT":
      return new AnalyzeServiceError("INSTRUMENT_NOT_FOUND", false);
    case "UPSTREAM_FAILURE":
    case "NETWORK_FAILURE":
      return new AnalyzeServiceError("PROVIDER_UNAVAILABLE", error.retryable);
  }
}

function mapAiError(error: AiError): AnalyzeServiceError {
  switch (error.code) {
    case "AI_CONFIGURATION":
      return new AnalyzeServiceError("AI_UNAVAILABLE", false);
    case "AI_INSUFFICIENT_DATA":
      return new AnalyzeServiceError("INSUFFICIENT_DATA", false);
    case "AI_UNAVAILABLE":
      return new AnalyzeServiceError("AI_UNAVAILABLE", error.retryable);
    case "AI_INVALID_RESPONSE":
      return new AnalyzeServiceError("AI_INVALID_RESPONSE", false);
  }
}

async function runAnalysis(
  input: AnalysisRequest,
  requestId: string,
  dependencies: AnalyzeDependencies,
  signal: AbortSignal,
): Promise<AnalyzeResponse> {
  let instrument: Instrument;
  try {
    const resolution = await dependencies.marketDataProvider.resolveInstrument(input.query, signal);
    if (resolution.kind === "not_found") {
      throw new AnalyzeServiceError("INSTRUMENT_NOT_FOUND", false);
    }
    if (resolution.kind === "ambiguous") {
      throw new AnalyzeServiceError("AMBIGUOUS_INSTRUMENT", false, resolution.candidates);
    }
    instrument = resolution.instrument;

    const bundle = await dependencies.marketDataProvider.fetchMarketData(instrument, signal);
    const snapshot = await normalizeMarketData(bundle);
    const metrics = calculateMetrics(snapshot);
    const quality = assessDataQuality(snapshot, metrics, {
      referenceDate: isoDate((dependencies.now ?? Date.now)()),
    });
    const packet = buildEvidencePacket(snapshot, metrics, quality);

    if (!quality.aiEligible) {
      throw new AnalyzeServiceError("INSUFFICIENT_DATA", false);
    }

    const aiResult = await dependencies.aiAdapter.generateReport({
      requestId,
      packet,
      focus: input.focus,
    }, signal);
    const report = validateModelReport(aiResult.report, packet);

    return AnalyzeResponseSchema.parse({
      requestId,
      instrument: snapshot.instrument,
      snapshot,
      metrics,
      quality,
      report,
    });
  } catch (error) {
    if (error instanceof AnalyzeServiceError) {
      throw error;
    }
    if (error instanceof MarketDataError) {
      throw mapMarketDataError(error);
    }
    if (error instanceof AiError) {
      throw mapAiError(error);
    }
    throw new AnalyzeServiceError("INTERNAL_ERROR", false);
  }
}

export async function analyze(
  input: unknown,
  dependencies: AnalyzeDependencies,
  options: AnalyzeOptions = {},
): Promise<AnalyzeResponse> {
  const requestId = options.requestId ?? randomUUID();
  const parsed = AnalysisRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new AnalyzeServiceError("INVALID_REQUEST", false);
  }

  const deadlineMs = dependencies.requestDeadlineMs ?? DEFAULT_REQUEST_DEADLINE_MS;
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new AnalyzeServiceError("ANALYSIS_TIMEOUT", true));
    }, deadlineMs);
  });

  try {
    return await Promise.race([
      runAnalysis(parsed.data, requestId, dependencies, controller.signal),
      timeout,
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
