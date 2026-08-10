import {
  AnalysisRequestSchema,
  AnalyzeErrorResponseSchema,
  AnalyzeResponseSchema,
  type AnalysisRequest,
  type AnalyzeErrorResponse,
  type AnalyzeResponse,
} from "../domain";

export type AnalysisUiState =
  | { status: "idle" }
  | { status: "submitting"; query: string; focus?: string }
  | {
      status: "ambiguous";
      requestId: string;
      candidates: NonNullable<AnalyzeErrorResponse["error"]["candidates"]>;
      query: string;
      focus?: string;
    }
  | { status: "success"; data: AnalyzeResponse }
  | {
      status: "error";
      requestId?: string;
      error: AnalyzeErrorResponse["error"];
      query: string;
      focus?: string;
    };

export interface AnalysisFieldErrors {
  query?: string;
  focus?: string;
}

export const ANALYSIS_LOADING_ANNOUNCEMENT =
  "Analisis sedang disusun. Data dan fokus riset tetap tersimpan.";
export const ANALYSIS_CANCEL_ANNOUNCEMENT =
  "Analisis dibatalkan. Input tetap tersimpan.";

export type AnalysisRecoveryMode = "retry" | "edit" | "none";

const EDITABLE_ERROR_CODES = new Set([
  "INVALID_REQUEST",
  "INSTRUMENT_NOT_FOUND",
  "INSUFFICIENT_DATA",
]);

export function canSubmitAnalysis(state: AnalysisUiState): boolean {
  return state.status !== "submitting";
}

export function getAnalysisRecoveryMode(
  error: AnalyzeErrorResponse["error"],
): AnalysisRecoveryMode {
  if (error.retryable) return "retry";
  if (EDITABLE_ERROR_CODES.has(error.code)) return "edit";
  return "none";
}

export function candidateResubmissionQuery(symbol: string): string {
  return symbol.trim();
}

export type AnalysisApiResult =
  | { kind: "success"; data: AnalyzeResponse }
  | {
      kind: "ambiguous";
      requestId: string;
      candidates: NonNullable<AnalyzeErrorResponse["error"]["candidates"]>;
    }
  | {
      kind: "error";
      requestId?: string;
      error: AnalyzeErrorResponse["error"];
    };

const INTERNAL_ERROR: AnalyzeErrorResponse["error"] = {
  code: "INTERNAL_ERROR",
  message: "Respons analisis tidak dapat dibaca.",
  retryable: false,
};

export function prepareAnalysisRequest(
  query: string,
  focus: string,
): { request?: AnalysisRequest; errors: AnalysisFieldErrors } {
  const normalizedQuery = query.trim();
  const normalizedFocus = focus.trim();
  const errors: AnalysisFieldErrors = {};

  if (!normalizedQuery) errors.query = "Masukkan nama perusahaan atau ticker.";
  else if (normalizedQuery.length > 100) errors.query = "Maksimal 100 karakter.";

  if (normalizedFocus.length > 500) errors.focus = "Maksimal 500 karakter.";

  if (Object.keys(errors).length > 0) return { errors };

  const parsed = AnalysisRequestSchema.safeParse({
    query: normalizedQuery,
    ...(normalizedFocus ? { focus: normalizedFocus } : {}),
  });

  return parsed.success
    ? { request: parsed.data, errors: {} }
    : { errors: { query: "Periksa kembali input analisis." } };
}

export function parseAnalysisApiResult(
  payload: unknown,
  ok: boolean,
): AnalysisApiResult {
  if (ok) {
    const response = AnalyzeResponseSchema.safeParse(payload);
    return response.success
      ? { kind: "success", data: response.data }
      : { kind: "error", error: INTERNAL_ERROR };
  }

  const response = AnalyzeErrorResponseSchema.safeParse(payload);
  if (!response.success) return { kind: "error", error: INTERNAL_ERROR };

  if (
    response.data.error.code === "AMBIGUOUS_INSTRUMENT"
    && response.data.error.candidates
  ) {
    return {
      kind: "ambiguous",
      requestId: response.data.requestId,
      candidates: response.data.error.candidates,
    };
  }

  return {
    kind: "error",
    requestId: response.data.requestId,
    error: response.data.error,
  };
}
