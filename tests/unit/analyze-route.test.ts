import { describe, expect, test } from "vitest";

import {
  AiError,
  type AiAnalysisRequest,
  type AiAnalysisResult,
  type AiModelAdapter,
} from "../../lib/ai";
import { REPORT_SCHEMA_VERSION } from "../../lib/domain";
import { createAnalyzeHandler } from "../../app/api/analyze/route";
import { MarketDataError, type MarketDataProvider, type RawMarketDataBundle } from "../../lib/market-data";
import { InMemoryRateLimiter } from "../../lib/server/rate-limit";

const instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchange: "NASDAQ",
  currency: "USD",
  region: "United States",
} as const;

function statement(rows: Record<string, unknown>[]) {
  return { quarterlyReports: rows, annualReports: [], raw: { quarterlyReports: rows } };
}

function completeBundle(): RawMarketDataBundle {
  const dates = ["2026-06-30", "2026-03-31", "2025-12-31", "2025-09-30"];
  const incomeRows = dates.map((date) => ({
    fiscalDateEnding: date,
    reportedCurrency: "USD",
    totalRevenue: "100",
    grossProfit: "60",
    operatingIncome: "20",
    netIncome: "10",
    dilutedEPS: "2",
    dilutedAverageShares: "10",
    ebit: "20",
    incomeBeforeTax: "20",
    incomeTaxExpense: "4",
  }));
  const balanceRows = ["2026-06-30", "2026-03-31"].map((date, index) => ({
    fiscalDateEnding: date,
    reportedCurrency: "USD",
    totalAssets: String(100 - index * 10),
    totalLiabilities: String(40 - index * 5),
    totalShareholderEquity: String(60 - index * 5),
    totalCurrentAssets: String(20 - index * 2),
    totalCurrentLiabilities: String(10 - index),
    commonSharesOutstanding: "10",
  }));
  const cashRows = dates.map((date) => ({
    fiscalDateEnding: date,
    reportedCurrency: "USD",
    operatingCashflow: "10",
    capitalExpenditures: "2",
  }));

  return {
    instrument,
    quote: { symbol: "AAPL", price: 200, latestTradingDay: "2026-08-05", volume: 1000 },
    historicalPrices: {
      symbol: "AAPL",
      prices: [
        { date: "2026-08-05", close: 200 },
        { date: "2026-08-04", close: 198 },
        { date: "2026-08-03", close: 201 },
      ],
      raw: {},
    },
    overview: {
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "NASDAQ",
      currency: "USD",
      country: "United States",
      assetType: "Common Stock",
      raw: {},
    },
    incomeStatement: statement(incomeRows),
    balanceSheet: statement(balanceRows),
    cashFlow: statement(cashRows),
    corporateActions: {
      status: "available",
      events: [{
        date: "2026-06-15",
        ticker: "AAPL",
        kind: "dividend",
        rawAction: "dividend",
        value: 0.25,
        relatedTicker: null,
        relatedName: null,
        notes: "Fixture event",
      }],
      warnings: [],
    },
  };
}

class FakeProvider implements MarketDataProvider {
  resolveCalls = 0;
  fetchCalls = 0;
  constructor(
    private readonly resolution: Awaited<ReturnType<MarketDataProvider["resolveInstrument"]>> = {
      kind: "resolved",
      instrument,
      score: 1,
    },
    private readonly bundle: RawMarketDataBundle = completeBundle(),
  ) {}

  async resolveInstrument(): Promise<Awaited<ReturnType<MarketDataProvider["resolveInstrument"]>>> {
    this.resolveCalls += 1;
    return this.resolution;
  }

  async fetchMarketData(): Promise<RawMarketDataBundle> {
    this.fetchCalls += 1;
    return this.bundle;
  }
}

class FakeAi implements AiModelAdapter {
  calls = 0;
  constructor(private readonly behavior: (input: AiAnalysisRequest) => AiAnalysisResult) {}

  async generateReport(input: AiAnalysisRequest): Promise<AiAnalysisResult> {
    this.calls += 1;
    return this.behavior(input);
  }
}

function reportFor(input: AiAnalysisRequest): AiAnalysisResult {
  const metricId = input.packet.metrics.find((metric) => metric.status === "available")?.id ?? "eps_ttm";
  const profile = (name: "conservative" | "moderate" | "aggressive") => ({
    profile: name,
    rating: "neutral" as const,
    confidence: 0.7,
    thesis: { text: "Interpretasi berbasis data yang tersedia.", metricIds: [metricId] },
    considerations: [{ text: "Perlu memantau perubahan data berikutnya.", metricIds: [metricId] }],
  });

  return {
    report: {
      schemaVersion: REPORT_SCHEMA_VERSION,
      summary: { text: "Ringkasan analisis berbasis evidence packet.", metricIds: [metricId] },
      strengths: [{ text: "Data keuangan tersedia.", metricIds: [metricId] }],
      risks: [{ text: "Data pasar dapat berubah.", metricIds: [metricId] }],
      uncertainties: [{ text: "Prospek masa depan tidak dipastikan oleh snapshot.", metricIds: [metricId] }],
      limitations: ["Analisis ini bukan nasihat investasi."],
      corporateActionClaims: [],
      profiles: {
        conservative: profile("conservative"),
        moderate: profile("moderate"),
        aggressive: profile("aggressive"),
      },
      disclaimer: "Bukan nasihat investasi.",
    },
    telemetry: { requestId: "fixture", modelId: "fixture-model", latencyMs: 1 },
  };
}

function request(body: unknown, ip = "198.51.100.1"): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

function dependencies(provider: MarketDataProvider, ai: AiModelAdapter, requestDeadlineMs = 1000) {
  return { marketDataProvider: provider, aiAdapter: ai, requestDeadlineMs };
}

describe("POST /api/analyze", () => {
  test("runs the fixture-backed M2 to M3 pipeline and returns the public contract", async () => {
    const provider = new FakeProvider();
    const ai = new FakeAi(reportFor);
    const handler = createAnalyzeHandler(dependencies(provider, ai));

    const response = await handler(request({ query: "AAPL", focus: "Kualitas arus kas" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.instrument.symbol).toBe("AAPL");
    expect(body.metrics.length).toBeGreaterThan(0);
    expect(body.quality.aiEligible).toBe(true);
    expect(body.report.profiles).toHaveProperty("conservative");
    expect(body.snapshot.corporateActions.events[0]).toMatchObject({ kind: "dividend", ticker: "AAPL" });
    expect(provider.resolveCalls).toBe(1);
    expect(provider.fetchCalls).toBe(1);
    expect(ai.calls).toBe(1);
    expect(JSON.stringify(body)).not.toMatch(/GEMINI_API_KEY|x-goog-api-key|Authorization|USER_FOCUS_JSON/);
  });

  test("rejects invalid content type, malformed JSON, and oversized bodies", async () => {
    const provider = new FakeProvider();
    const ai = new FakeAi(reportFor);
    const handler = createAnalyzeHandler(dependencies(provider, ai), { maxBodyBytes: 32 });

    const wrongType = await handler(new Request("http://localhost/api/analyze", { method: "POST", body: "{}" }));
    expect(wrongType.status).toBe(400);

    const malformed = await handler(new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.2" },
      body: "{",
    }));
    expect(malformed.status).toBe(400);

    const oversized = await handler(request({ query: "AAPL", focus: "x".repeat(100) }, "198.51.100.3"));
    expect(oversized.status).toBe(413);
    expect(ai.calls).toBe(0);
  });

  test("returns stable ambiguity and not-found errors without fetching data", async () => {
    const secondCandidate = {
      instrument: { ...instrument, symbol: "APLE", name: "Example Apple Holdings" },
      score: 0.8,
    };
    const ambiguousProvider = new FakeProvider({
      kind: "ambiguous",
      candidates: [
        { instrument, score: 0.9 },
        secondCandidate,
      ],
    });
    const ambiguousAi = new FakeAi(reportFor);
    const ambiguous = createAnalyzeHandler(dependencies(ambiguousProvider, ambiguousAi));
    const ambiguousResponse = await ambiguous(request({ query: "Apple" }));
    expect(ambiguousResponse.status).toBe(409);
    const ambiguousBody = await ambiguousResponse.json();
    expect(ambiguousBody.error.code).toBe("AMBIGUOUS_INSTRUMENT");
    expect(ambiguousBody.error.candidates).toHaveLength(2);
    expect(ambiguousBody.error.candidates[1].instrument.symbol).toBe("APLE");
    expect(ambiguousProvider.fetchCalls).toBe(0);
    expect(ambiguousAi.calls).toBe(0);

    const missingProvider = new FakeProvider({ kind: "not_found" });
    const missing = createAnalyzeHandler(dependencies(missingProvider, new FakeAi(reportFor)));
    const missingResponse = await missing(request({ query: "UNKNOWN" }, "198.51.100.4"));
    expect(missingResponse.status).toBe(404);
    expect((await missingResponse.json()).error.code).toBe("INSTRUMENT_NOT_FOUND");
  });

  test("stops before AI when quality is insufficient", async () => {
    const incomplete = completeBundle();
    incomplete.historicalPrices = undefined;
    incomplete.incomeStatement = statement([incomplete.incomeStatement.quarterlyReports[0]!]);
    incomplete.balanceSheet = statement([incomplete.balanceSheet.quarterlyReports[0]!]);
    incomplete.cashFlow = statement([]);
    const ai = new FakeAi(reportFor);
    const handler = createAnalyzeHandler(dependencies(new FakeProvider({ kind: "resolved", instrument, score: 1 }, incomplete), ai));

    const response = await handler(request({ query: "AAPL" }));
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("INSUFFICIENT_DATA");
    expect(ai.calls).toBe(0);
  });

  test("maps provider limit, timeout, model failure, and invalid model output safely", async () => {
    const limitedAi = new FakeAi(reportFor);
    const limitedHandler = createAnalyzeHandler(dependencies({
      resolveInstrument: async () => { throw new MarketDataError("RATE_LIMITED", "secret provider detail", false); },
      fetchMarketData: async () => completeBundle(),
    }, limitedAi));
    expect((await limitedHandler(request({ query: "AAPL" }))).status).toBe(429);

    let aborted = false;
    const slowProvider: MarketDataProvider = {
      resolveInstrument: async (_query, signal) => new Promise((resolve) => {
        const timeout = setTimeout(() => resolve({ kind: "resolved", instrument, score: 1 }), 50);
        signal?.addEventListener("abort", () => {
          aborted = true;
          clearTimeout(timeout);
          resolve({ kind: "resolved", instrument, score: 1 });
        }, { once: true });
      }),
      fetchMarketData: async () => completeBundle(),
    };
    const timeoutHandler = createAnalyzeHandler(dependencies(slowProvider, new FakeAi(reportFor), 5));
    const timeoutResponse = await timeoutHandler(request({ query: "AAPL" }, "198.51.100.5"));
    expect(timeoutResponse.status).toBe(504);
    expect((await timeoutResponse.json()).error.code).toBe("ANALYSIS_TIMEOUT");
    expect(aborted).toBe(true);

    let slowAiAborted = false;
    const slowAi: AiModelAdapter = {
      generateReport: async (_input, signal) => new Promise((_, reject) => {
        signal?.addEventListener("abort", () => {
          slowAiAborted = true;
          reject(new AiError("AI_UNAVAILABLE", "cancelled", true));
        }, { once: true });
      }),
    };
    const slowAiHandler = createAnalyzeHandler(dependencies(new FakeProvider(), slowAi, 100));
    const slowAiResponse = await slowAiHandler(request({ query: "AAPL" }, "198.51.100.8"));
    expect(slowAiResponse.status).toBe(504);
    expect((await slowAiResponse.json()).error.code).toBe("ANALYSIS_TIMEOUT");
    expect(slowAiAborted).toBe(true);

    const modelFailure = new FakeAi(() => {
      throw new AiError("AI_UNAVAILABLE", "raw model failure", true);
    });
    const failureResponse = await createAnalyzeHandler(dependencies(new FakeProvider(), modelFailure))(request({ query: "AAPL" }, "198.51.100.6"));
    expect(failureResponse.status).toBe(502);
    const failureBody = await failureResponse.json();
    expect(failureBody.error.code).toBe("AI_UNAVAILABLE");
    expect(failureBody.error.message).toBe("Layanan analisis model sedang tidak tersedia.");
    expect(failureBody.error.message).not.toContain("raw model failure");

    const invalidModel = new FakeAi(() => ({ report: { invalid: true } as never, telemetry: { requestId: "fixture", modelId: "fixture", latencyMs: 1 } }));
    const invalidResponse = await createAnalyzeHandler(dependencies(new FakeProvider(), invalidModel))(request({ query: "AAPL" }, "198.51.100.7"));
    expect(invalidResponse.status).toBe(502);
    expect((await invalidResponse.json()).error.code).toBe("AI_INVALID_RESPONSE");
  });

  test("throttles accidental repeats per key", async () => {
    const limiter = new InMemoryRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    const handler = createAnalyzeHandler(dependencies(new FakeProvider(), new FakeAi(reportFor)), { rateLimiter: limiter });

    expect((await handler(request({ query: "AAPL" }, "203.0.113.1"))).status).toBe(200);
    const repeated = await handler(request({ query: "AAPL" }, "203.0.113.1"));
    expect(repeated.status).toBe(429);
    expect((await repeated.json()).error.code).toBe("REQUEST_RATE_LIMITED");
  });
});
