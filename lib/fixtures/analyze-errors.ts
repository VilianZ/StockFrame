import { AnalyzeErrorResponseSchema, type AnalyzeErrorResponse } from "../domain";

const candidate = (symbol: string, name: string, score: number) => ({
  instrument: { symbol, name, exchange: "NASDAQ", currency: "USD", region: "United States" },
  score,
});

function errorFixture(code: AnalyzeErrorResponse["error"]["code"], message: string, retryable: boolean, candidates?: AnalyzeErrorResponse["error"]["candidates"]): AnalyzeErrorResponse {
  return AnalyzeErrorResponseSchema.parse({
    requestId: "00000000-0000-4000-8000-000000000201",
    error: { code, message, retryable, ...(candidates ? { candidates } : {}) },
  });
}

export const analyzeErrorFixtures: Record<AnalyzeErrorResponse["error"]["code"], AnalyzeErrorResponse> = {
  INVALID_REQUEST: errorFixture("INVALID_REQUEST", "Permintaan analisis tidak valid.", false),
  INSTRUMENT_NOT_FOUND: errorFixture("INSTRUMENT_NOT_FOUND", "Instrumen tidak ditemukan.", false),
  AMBIGUOUS_INSTRUMENT: errorFixture("AMBIGUOUS_INSTRUMENT", "Instrumen belum cukup spesifik.", false, [candidate("CTN", "Contoh Teknologi Nusantara", 0.91), candidate("CTNA", "Contoh Teknologi Asia", 0.81)]),
  REQUEST_RATE_LIMITED: errorFixture("REQUEST_RATE_LIMITED", "Permintaan terlalu sering.", true),
  PROVIDER_RATE_LIMITED: errorFixture("PROVIDER_RATE_LIMITED", "Data pasar sedang dibatasi provider.", true),
  PROVIDER_INVALID_KEY: errorFixture("PROVIDER_INVALID_KEY", "Data pasar tidak dapat diakses saat ini.", false),
  PROVIDER_TIMEOUT: errorFixture("PROVIDER_TIMEOUT", "Pengambilan data pasar melewati batas waktu.", true),
  ANALYSIS_TIMEOUT: errorFixture("ANALYSIS_TIMEOUT", "Analisis melewati batas waktu.", true),
  PROVIDER_UNAVAILABLE: errorFixture("PROVIDER_UNAVAILABLE", "Data pasar sedang tidak tersedia.", true),
  MALFORMED_PROVIDER_RESPONSE: errorFixture("MALFORMED_PROVIDER_RESPONSE", "Respons data pasar tidak valid.", true),
  INSUFFICIENT_DATA: errorFixture("INSUFFICIENT_DATA", "Data belum cukup untuk analisis yang aman.", false),
  AI_UNAVAILABLE: errorFixture("AI_UNAVAILABLE", "Layanan analisis model sedang tidak tersedia.", true),
  AI_INVALID_RESPONSE: errorFixture("AI_INVALID_RESPONSE", "Hasil analisis model tidak valid.", false),
  INTERNAL_ERROR: errorFixture("INTERNAL_ERROR", "Terjadi kesalahan internal.", false),
};
