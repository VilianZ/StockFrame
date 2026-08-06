import type { AnalyzeErrorResponse, ErrorCode } from "../domain";
import { AnalyzeErrorResponseSchema } from "../domain";
import type { InstrumentCandidate } from "../market-data";

export class AnalyzeServiceError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly candidates?: InstrumentCandidate[];

  constructor(code: ErrorCode, retryable: boolean, candidates?: InstrumentCandidate[]) {
    super(code);
    this.name = "AnalyzeServiceError";
    this.code = code;
    this.retryable = retryable;
    this.candidates = candidates;
  }
}

const PUBLIC_MESSAGES: Record<ErrorCode, string> = {
  INVALID_REQUEST: "Permintaan analisis tidak valid.",
  INSTRUMENT_NOT_FOUND: "Instrumen tidak ditemukan.",
  AMBIGUOUS_INSTRUMENT: "Instrumen belum cukup spesifik.",
  REQUEST_RATE_LIMITED: "Permintaan terlalu sering. Tunggu sebentar lalu coba lagi.",
  PROVIDER_RATE_LIMITED: "Data pasar sedang dibatasi provider.",
  PROVIDER_INVALID_KEY: "Data pasar tidak dapat diakses saat ini.",
  PROVIDER_TIMEOUT: "Pengambilan data pasar melewati batas waktu.",
  ANALYSIS_TIMEOUT: "Analisis melewati batas waktu.",
  PROVIDER_UNAVAILABLE: "Data pasar sedang tidak tersedia.",
  MALFORMED_PROVIDER_RESPONSE: "Respons data pasar tidak valid.",
  INSUFFICIENT_DATA: "Data belum cukup untuk analisis yang aman.",
  AI_UNAVAILABLE: "Layanan analisis model sedang tidak tersedia.",
  AI_INVALID_RESPONSE: "Hasil analisis model tidak valid.",
  INTERNAL_ERROR: "Terjadi kesalahan internal.",
};

export function toAnalyzeErrorResponse(
  requestId: string,
  error: unknown,
): AnalyzeErrorResponse {
  const serviceError = error instanceof AnalyzeServiceError
    ? error
    : new AnalyzeServiceError("INTERNAL_ERROR", false);

  return AnalyzeErrorResponseSchema.parse({
    requestId,
    error: {
      code: serviceError.code,
      message: PUBLIC_MESSAGES[serviceError.code],
      retryable: serviceError.retryable,
      ...(serviceError.candidates ? { candidates: serviceError.candidates } : {}),
    },
  });
}

export function statusForAnalyzeError(error: unknown): number {
  if (!(error instanceof AnalyzeServiceError)) {
    return 500;
  }

  switch (error.code) {
    case "INVALID_REQUEST":
      return 400;
    case "INSTRUMENT_NOT_FOUND":
      return 404;
    case "AMBIGUOUS_INSTRUMENT":
      return 409;
    case "REQUEST_RATE_LIMITED":
    case "PROVIDER_RATE_LIMITED":
      return 429;
    case "INSUFFICIENT_DATA":
      return 422;
    case "PROVIDER_TIMEOUT":
    case "ANALYSIS_TIMEOUT":
      return 504;
    case "PROVIDER_INVALID_KEY":
    case "PROVIDER_UNAVAILABLE":
    case "MALFORMED_PROVIDER_RESPONSE":
    case "AI_UNAVAILABLE":
    case "AI_INVALID_RESPONSE":
      return 502;
    case "INTERNAL_ERROR":
      return 500;
  }
}
