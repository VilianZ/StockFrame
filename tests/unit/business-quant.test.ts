import { describe, expect, test, vi } from "vitest";

import universe from "../fixtures/business-quant/universe.json";
import profile from "../fixtures/business-quant/profile.json";
import income from "../fixtures/business-quant/income.json";
import balance from "../fixtures/business-quant/balance.json";
import cashFlow from "../fixtures/business-quant/cashflow.json";
import prices from "../fixtures/business-quant/prices-eod.json";
import {
  BusinessQuantProvider,
  MarketDataError,
  hasFourConsecutiveQuarters,
  parseBusinessQuantProfile,
  parseBusinessQuantPrices,
  parseBusinessQuantStatement,
} from "../../lib/market-data";

const instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchange: "NASDAQ",
  currency: "USD",
  region: "United States",
} as const;

type FixtureValue = { date?: string; normalizedDate?: string; periodType?: string; reportedValue?: Record<string, unknown> };
type StatementFixture = {
  metadata: Record<string, unknown>;
  data: Record<string, { sections: Record<string, { values: FixtureValue[] }> }>;
};
type PriceFixture = { data: Array<Record<string, unknown>> };

function clone<T>(value: T): T {
  return structuredClone(value);
}

function makeFetch(options: {
  statusByPath?: Record<string, number>;
  bodyByPath?: Record<string, unknown>;
  bodyByStatement?: Record<string, unknown>;
  rawByPath?: Record<string, string>;
  waitOnPath?: string;
} = {}) {
  const calls: URL[] = [];
  const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
    calls.push(url);
    if (options.waitOnPath === url.pathname) {
      await new Promise<never>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
      });
    }
    const status = options.statusByPath?.[url.pathname] ?? 200;
    const rawBody = options.rawByPath?.[url.pathname];
    if (rawBody !== undefined) {
      return new Response(rawBody, { status, headers: { "content-type": "application/json" } });
    }
    const statement = url.searchParams.get("statement") ?? "";
    const body = options.bodyByPath?.[url.pathname]
      ?? options.bodyByStatement?.[statement]
      ?? (url.pathname === "/universe" ? universe
        : url.pathname === "/stocks/profile" ? profile
          : url.pathname === "/quotes" ? prices
            : url.searchParams.get("statement") === "IS" ? income
              : url.searchParams.get("statement") === "BS" ? balance
                : cashFlow);
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { calls, fetchFn };
}

function provider(fetchFn: typeof fetch, options: Partial<ConstructorParameters<typeof BusinessQuantProvider>[0]> = {}) {
  return new BusinessQuantProvider({ apiKey: "fake-business-quant-key", fetchFn, ...options });
}

describe("Business Quant parser", () => {
  test("parses nested sections using only reportedValue.raw and keeps twelve quarters", () => {
    const payload = clone(income) as unknown as StatementFixture;
    const section = payload.data["Revenue & cost"].sections.Revenue.values;
    const extraDates = ["2025-06-27", "2025-03-29", "2024-12-28", "2024-09-28", "2024-06-29", "2024-03-30", "2023-12-30", "2023-09-30", "2023-06-24"];
    for (let index = 0; index < extraDates.length; index += 1) {
      section.push({
        date: extraDates[index],
        periodType: "Quarter",
        reportedValue: { raw: 80 - index },
      });
    }
    const parsed = parseBusinessQuantStatement(payload, "IS");
    expect(parsed.quarterlyReports).toHaveLength(12);
    expect(parsed.quarterlyReports[0]).toMatchObject({ fiscalDateEnding: "2026-06-27", totalRevenue: 100 });
    expect(parsed.raw).toEqual({ provider: "business-quant", statement: "IS", template: "general", frequency: "Quarter" });
  });

  test("rejects unsupported templates and missing raw fields", () => {
    const unsupported = clone(income) as unknown as StatementFixture;
    unsupported.metadata.template = "utilities";
    expect(() => parseBusinessQuantStatement(unsupported, "IS")).toThrowError(MarketDataError);
    const missing = clone(income) as unknown as StatementFixture;
    delete missing.metadata.currency;
    expect(() => parseBusinessQuantStatement(missing, "IS")).toThrowError(MarketDataError);
    expect(() => parseBusinessQuantStatement(income, "IS")).not.toThrow();
    const missingRaw = clone(income) as unknown as StatementFixture;
    delete missingRaw.data["Revenue & cost"].sections.Revenue.values[0]!.reportedValue!.raw;
    expect(() => parseBusinessQuantStatement(missingRaw, "IS")).toThrowError(/raw value/);
  });

  test.each([null, "", "   "])("rejects reportedValue.raw %j instead of converting it to zero", (raw) => {
    const payload = clone(income) as unknown as StatementFixture;
    payload.data["Revenue & cost"].sections.Revenue.values[0]!.reportedValue = { raw };
    expect(() => parseBusinessQuantStatement(payload, "IS")).toThrowError(/raw value/);
  });

  test("rejects a statement with mismatched ticker or statement identity", () => {
    const wrongTicker = clone(income) as unknown as StatementFixture;
    wrongTicker.metadata.ticker = "MSFT";
    expect(() => parseBusinessQuantStatement(wrongTicker, "IS", "AAPL")).toThrowError(/ticker/);
    const wrongStatement = clone(income) as unknown as StatementFixture;
    wrongStatement.metadata.statement = "Balance Sheet";
    expect(() => parseBusinessQuantStatement(wrongStatement, "IS", "AAPL")).toThrowError(/identity/);
  });

  test("rejects a non-equity profile", () => {
    const nonEquity = clone(profile) as Record<string, unknown>;
    nonEquity.asset_class = "ETF";
    expect(() => parseBusinessQuantProfile(nonEquity)).toThrowError(/not an equity/);
  });

  test("checks TTM continuity without filling a quarter gap", () => {
    const parsed = parseBusinessQuantStatement(income, "IS");
    expect(hasFourConsecutiveQuarters(parsed)).toBe(true);
    expect(hasFourConsecutiveQuarters({
      ...parsed,
      quarterlyReports: parsed.quarterlyReports.map((row, index) => index === 1 ? { ...row, fiscalDateEnding: "2025-12-27" } : row),
    })).toBe(false);
  });

  test("parses EOD prices, collapses identical duplicates, and keeps max volume", () => {
    const payload = clone(prices) as unknown as PriceFixture;
    payload.data.push({ ...payload.data[0], volume: 70000000 });
    const parsed = parseBusinessQuantPrices(payload);
    expect(parsed.prices).toHaveLength(2);
    expect(parsed.prices[0].volume).toBe(70000000);
    expect(parsed.warnings).toHaveLength(1);
    expect(parsed.historical.raw).not.toHaveProperty("data");
  });

  test("resolves close-only conflicts by volume but rejects open/high/low conflicts", () => {
    const closeConflict = clone(prices) as unknown as PriceFixture;
    closeConflict.data.push({ ...closeConflict.data[0], close: 308, volume: 70000000 });
    const parsed = parseBusinessQuantPrices(closeConflict);
    expect(parsed.prices[0].close).toBe(308);
    expect(parsed.prices[0].volume).toBe(70000000);
    expect(parsed.warnings).toContain("Duplicate EOD record with close conflict resolved by volume for 2026-08-04");

    const ohlcConflict = clone(prices) as unknown as PriceFixture;
    ohlcConflict.data.push({ ...ohlcConflict.data[0], open: 303, volume: 70000000 });
    expect(() => parseBusinessQuantPrices(ohlcConflict)).toThrowError(/conflicting OHLC/);

    const invalid = clone(prices) as unknown as PriceFixture;
    invalid.data[0].high = 300;
    expect(() => parseBusinessQuantPrices(invalid)).toThrowError(/OHLC invariant/);
    const missing = clone(prices) as unknown as PriceFixture;
    delete missing.data[0].close;
    expect(() => parseBusinessQuantPrices(missing)).toThrowError(MarketDataError);
  });
});

describe("Business Quant provider", () => {
  test("fails before any call when the API key is missing", async () => {
    const { fetchFn, calls } = makeFetch();
    const instance = new BusinessQuantProvider({ fetchFn });
    await expect(instance.resolveInstrument("AAPL")).rejects.toMatchObject({ code: "INVALID_KEY", retryable: false });
    expect(calls).toHaveLength(0);
  });

  test.each([
    [401, "INVALID_KEY"],
    [403, "INVALID_KEY"],
    [404, "NOT_FOUND"],
  ] as const)("maps HTTP %s without retry", async (status, code) => {
    const { fetchFn, calls } = makeFetch({ statusByPath: { "/universe": status } });
    const instance = provider(fetchFn);
    await expect(instance.resolveInstrument("AAPL")).rejects.toMatchObject({ code, retryable: false });
    expect(calls).toHaveLength(1);
  });

  test("retries HTTP 500 exactly once", async () => {
    const { fetchFn, calls } = makeFetch({ statusByPath: { "/universe": 500 } });
    const instance = provider(fetchFn);
    await expect(instance.resolveInstrument("AAPL")).rejects.toMatchObject({ code: "UPSTREAM_FAILURE", retryable: true });
    expect(calls).toHaveLength(2);
  });

  test("maps invalid JSON to a safe malformed-response error", async () => {
    const { fetchFn, calls } = makeFetch({ rawByPath: { "/universe": "not-json" } });
    const instance = provider(fetchFn);
    await expect(instance.resolveInstrument("AAPL")).rejects.toMatchObject({ code: "MALFORMED_RESPONSE", retryable: false });
    expect(calls).toHaveLength(1);
  });

  test("resolves equity names from the cached universe and fetches exactly five calls", async () => {
    const { fetchFn, calls } = makeFetch();
    let now = 1_000;
    const instance = provider(fetchFn, { now: () => now });
    await expect(instance.resolveInstrument("Apple")).resolves.toMatchObject({ kind: "resolved", instrument: { symbol: "AAPL" } });
    await expect(instance.resolveInstrument("Apple")).resolves.toMatchObject({ kind: "resolved", instrument: { symbol: "AAPL" } });
    expect(calls.filter((call) => call.pathname === "/universe")).toHaveLength(1);
    const result = await instance.fetchMarketData(instrument);
    expect(result.overview).toMatchObject({ symbol: "AAPL", sector: "Technology", industry: "Consumer Electronics", description: expect.any(String) });
    expect(result.quote.latestTradingDay).toBe("2026-08-04");
    expect(result.incomeStatement.quarterlyReports[0].totalRevenue).toBe(100);
    expect(calls.filter((call) => call.pathname !== "/universe")).toHaveLength(5);
    expect(calls.every((call) => call.searchParams.get("api_key") === "fake-business-quant-key")).toBe(true);
    expect(calls.find((call) => call.pathname === "/quotes")?.searchParams.get("mode")).toBe("eod");
    now += 20 * 60 * 1_000;
    await instance.fetchMarketData(instrument);
    expect(calls.filter((call) => call.pathname === "/quotes")).toHaveLength(2);
  });

  test("keeps valid AAPL when another equity row has no exchange", async () => {
    const { fetchFn } = makeFetch();
    const instance = provider(fetchFn);
    await expect(instance.resolveInstrument("AAPL")).resolves.toMatchObject({
      kind: "resolved",
      instrument: { symbol: "AAPL", exchange: "NASDAQ" },
    });
  });

  test("does not retry 429 and redacts query values from logs", async () => {
    const events: unknown[] = [];
    const { fetchFn, calls } = makeFetch({ statusByPath: { "/universe": 429 } });
    const instance = provider(fetchFn, { logger: (event) => events.push(event) });
    await expect(instance.resolveInstrument("Sensitive Company")).rejects.toMatchObject({ code: "RATE_LIMITED", retryable: false });
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain("fake-business-quant-key");
    expect(JSON.stringify(events)).not.toContain("Sensitive Company");
  });

  test("rejects a statement response for another ticker", async () => {
    const wrongTicker = clone(income) as unknown as StatementFixture;
    wrongTicker.metadata.ticker = "MSFT";
    const { fetchFn } = makeFetch({ bodyByStatement: { IS: wrongTicker } });
    const instance = provider(fetchFn);
    await expect(instance.fetchMarketData(instrument)).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
  });

  test("rejects a non-equity profile from the adapter", async () => {
    const nonEquity = clone(profile) as Record<string, unknown>;
    nonEquity.asset_class = "ETF";
    const { fetchFn } = makeFetch({ bodyByPath: { "/stocks/profile": nonEquity } });
    const instance = provider(fetchFn);
    await expect(instance.fetchMarketData(instrument)).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
  });

  test("aborts and retries a timed-out request at most once", async () => {
    const { fetchFn, calls } = makeFetch({ waitOnPath: "/quotes" });
    const instance = provider(fetchFn, { timeoutMs: 1 });
    await expect(instance.fetchMarketData(instrument)).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(calls.filter((call) => call.pathname === "/quotes")).toHaveLength(2);
  });

  test("expires the universe cache independently from market-data cache", async () => {
    let now = 100;
    const { fetchFn, calls } = makeFetch();
    const instance = provider(fetchFn, { now: () => now, universeTtlMs: 10, marketDataTtlMs: 10 });
    await instance.resolveInstrument("AAPL");
    now += 11;
    await instance.resolveInstrument("AAPL");
    expect(calls.filter((call) => call.pathname === "/universe")).toHaveLength(2);
  });
});
