import type { FinalReport } from "../domain";
import type { EvidencePacket } from "../quality";

export type AiFailureCode =
  | "AI_CONFIGURATION"
  | "AI_INSUFFICIENT_DATA"
  | "AI_UNAVAILABLE"
  | "AI_INVALID_RESPONSE";

export const AI_VALIDATION_REASON_CODES = [
  "invalid_json",
  "flat_envelope",
  "missing_content",
  "invalid_flat_item",
  "empty_text",
  "output_truncated",
  "unknown_kind",
  "placeholder_mismatch",
  "contract_mismatch",
  "missing_section",
  "profile_mismatch",
  "reference_mismatch",
] as const;

export type AiValidationReason = (typeof AI_VALIDATION_REASON_CODES)[number];

export interface AiFailureTelemetry {
  requestId: string;
  modelId: string;
  latencyMs: number;
  usage?: AiUsage;
  providerStatus?: number;
  providerErrorCode?: string;
  providerErrorMessage?: string;
}

export class AiError extends Error {
  readonly code: AiFailureCode;
  readonly retryable: boolean;
  telemetry?: AiFailureTelemetry;

  constructor(code: AiFailureCode, message: string, retryable: boolean) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.retryable = retryable;
  }
}

export interface AiAnalysisRequest {
  requestId: string;
  packet: EvidencePacket;
  focus?: string;
}

export interface AiUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiTelemetry {
  requestId: string;
  modelId: string;
  latencyMs: number;
  usage?: AiUsage;
}

export interface AiAnalysisResult {
  report: FinalReport;
  telemetry: AiTelemetry;
}

export interface AiModelAdapter {
  generateReport(input: AiAnalysisRequest, signal?: AbortSignal): Promise<AiAnalysisResult>;
}
