import { describe, expect, it } from "vitest";
import { sufficientAnalyzeFixture } from "../../lib/fixtures/analyze-success";
import {
  ANALYSIS_CANCEL_ANNOUNCEMENT,
  ANALYSIS_LOADING_ANNOUNCEMENT,
  canSubmitAnalysis,
  candidateResubmissionQuery,
  getAnalysisRecoveryMode,
  parseAnalysisApiResult,
  prepareAnalysisRequest,
} from "../../lib/presentation/analysis-state";

const requestId = "00000000-0000-4000-8000-000000000201";
const candidate = {
  instrument: sufficientAnalyzeFixture.instrument,
  score: 0.82,
};

describe("frontend analysis state", () => {
  it("normalizes valid query and optional focus", () => {
    expect(prepareAnalysisRequest("  AAPL  ", "  profitabilitas  ")).toEqual({
      request: { query: "AAPL", focus: "profitabilitas" },
      errors: {},
    });
  });

  it("rejects missing and overlong fields before submission", () => {
    expect(prepareAnalysisRequest("", "").errors.query).toBeTruthy();
    expect(prepareAnalysisRequest("AAPL", "x".repeat(501)).errors.focus).toBe("Maksimal 500 karakter.");
    expect(prepareAnalysisRequest("x".repeat(101), "").errors.query).toBe("Maksimal 100 karakter.");
  });

  it("parses a successful response using the canonical schema", () => {
    const result = parseAnalysisApiResult(sufficientAnalyzeFixture, true);

    expect(result.kind).toBe("success");
    if (result.kind === "success") expect(result.data.instrument.symbol).toBe("CTN");
  });

  it("keeps ambiguous candidates for explicit selection", () => {
    const result = parseAnalysisApiResult({
      requestId,
      error: {
        code: "AMBIGUOUS_INSTRUMENT",
        message: "Instrumen belum cukup spesifik.",
        retryable: false,
        candidates: [candidate],
      },
    }, false);

    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      expect(result.requestId).toBe(requestId);
      expect(result.candidates[0]?.instrument.symbol).toBe("CTN");
    }
  });

  it("falls back to a safe internal error for malformed provider response", () => {
    const result = parseAnalysisApiResult({ nope: true }, false);

    expect(result).toEqual({
      kind: "error",
      error: {
        code: "INTERNAL_ERROR",
        message: "Respons analisis tidak dapat dibaca.",
        retryable: false,
      },
    });
  });

  it("models interaction guards, preserved values, and cancellation copy", () => {
    const submitting = { status: "submitting" as const, query: "AAPL", focus: "valuasi" };
    const error = {
      status: "error" as const,
      query: submitting.query,
      focus: submitting.focus,
      error: { code: "AI_UNAVAILABLE" as const, message: "generic", retryable: true },
    };

    expect(canSubmitAnalysis(submitting)).toBe(false);
    expect(canSubmitAnalysis(error)).toBe(true);
    expect({ query: error.query, focus: error.focus }).toEqual({ query: "AAPL", focus: "valuasi" });
    expect(ANALYSIS_LOADING_ANNOUNCEMENT).toContain("tetap tersimpan");
    expect(ANALYSIS_CANCEL_ANNOUNCEMENT).toContain("Input tetap tersimpan");
  });

  it("uses recovery actions that match the error source", () => {
    expect(getAnalysisRecoveryMode({ code: "INVALID_REQUEST", message: "", retryable: false })).toBe("edit");
    expect(getAnalysisRecoveryMode({ code: "INSTRUMENT_NOT_FOUND", message: "", retryable: false })).toBe("edit");
    expect(getAnalysisRecoveryMode({ code: "PROVIDER_UNAVAILABLE", message: "", retryable: false })).toBe("none");
    expect(getAnalysisRecoveryMode({ code: "AI_UNAVAILABLE", message: "", retryable: true })).toBe("retry");
  });

  it("resubmits the canonical candidate symbol and ignores surrounding whitespace", () => {
    expect(candidateResubmissionQuery("  NASDAQ:AAPL  ")).toBe("NASDAQ:AAPL");
  });
});
