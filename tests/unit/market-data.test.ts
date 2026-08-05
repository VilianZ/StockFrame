import { describe, expect, test, vi } from "vitest";

import ambiguousSearch from "../fixtures/alpha-vantage/symbol-search-ambiguous.json";
import invalidKey from "../fixtures/alpha-vantage/invalid-key.json";
import malformed from "../fixtures/alpha-vantage/malformed.json";
import notFound from "../fixtures/alpha-vantage/not-found.json";
import rateLimit from "../fixtures/alpha-vantage/rate-limit.json";
import balanceSheet from "../fixtures/alpha-vantage/balance-sheet.json";
import cashFlow from "../fixtures/alpha-vantage/cash-flow.json";
import incomeStatement from "../fixtures/alpha-vantage/income-statement.json";
import overview from "../fixtures/alpha-vantage/overview.json";
import quote from "../fixtures/alpha-vantage/quote.json";
import supportedSearch from "../fixtures/alpha-vantage/symbol-search-supported.json";
import strongGapSearch from "../fixtures/alpha-vantage/symbol-search-strong-gap.json";
import dailyPrices from "../fixtures/alpha-vantage/time-series-daily.json";
import unsupportedSearch from "../fixtures/alpha-vantage/symbol-search-unsupported.json";
import {
  AlphaVantageProvider,
  MarketDataError,
  type MarketDataLogEvent,
} from "../../lib/market-data";

type FetchPlan =
  | { body: unknown; status?: number }
  | { rawBody: string; status?: number }
  | Error;

function makeFetch(plans: Record<string, FetchPlan | FetchPlan[]>) {
  const calls: URL[] = [];
  const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    calls.push(url);
    const functionName = url.searchParams.get("function") ?? "";
    const configured = plans[functionName];
    if (configured === undefined) {
      throw new Error(`Unexpected provider function: ${functionName}`);
    }
    const queue = Array.isArray(configured) ? configured : [configured];
    const plan = queue[Math.min(callsFor(calls, functionName) - 1, queue.length - 1)];
    if (plan instanceof Error) {
      throw plan;
    }
    const body = "rawBody" in plan ? plan.rawBody : JSON.stringify(plan.body);
    return new Response(body, {
      status: plan.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;

  return { calls, fetchFn };
}

function callsFor(calls: URL[], functionName: string): number {
  return calls.filter((call) => call.searchParams.get("function") === functionName).length;
}

const providerConfig = (fetchFn: typeof fetch, logger?: (event: MarketDataLogEvent) => void) => ({
  apiKey: "fake-alpha-vantage-key",
  fetchFn,
  logger,
  includeDailyPrices: false,
});

describe("Alpha Vantage instrument resolution", () => {
  test("resolves and verifies an exact ticker", async () => {
    const { fetchFn } = makeFetch({ SYMBOL_SEARCH: { body: supportedSearch } });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    await expect(provider.resolveInstrument("AAPL")).resolves.toEqual({
      kind: "resolved",
      score: 1,
      instrument: {
        symbol: "AAPL",
        name: "Apple Inc.",
        exchange: "UNKNOWN",
        currency: "USD",
        region: "United States",
      },
    });
  });

  test("sends short company names through symbol search", async () => {
    const { fetchFn, calls } = makeFetch({ SYMBOL_SEARCH: { body: supportedSearch } });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    await expect(provider.resolveInstrument("Apple")).resolves.toEqual({
      kind: "resolved",
      score: 1,
      instrument: {
        symbol: "AAPL",
        name: "Apple Inc.",
        exchange: "UNKNOWN",
        currency: "USD",
        region: "United States",
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].searchParams.get("function")).toBe("SYMBOL_SEARCH");
  });

  test("resolves a clearly stronger non-exact match", async () => {
    const { fetchFn } = makeFetch({ SYMBOL_SEARCH: { body: strongGapSearch } });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    await expect(provider.resolveInstrument("Apple company")).resolves.toMatchObject({
      kind: "resolved",
      score: 0.95,
      instrument: { symbol: "AAPL" },
    });
  });

  test("returns candidates for an ambiguous company-name search", async () => {
    const { fetchFn } = makeFetch({ SYMBOL_SEARCH: { body: ambiguousSearch } });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    const result = await provider.resolveInstrument("Apple company");

    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      expect(result.candidates).toHaveLength(2);
      expect(result.candidates[0].instrument.symbol).toBe("APPLE");
    }
  });

  test("rejects unsupported instruments instead of guessing", async () => {
    const { fetchFn } = makeFetch({ SYMBOL_SEARCH: { body: unsupportedSearch } });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    await expect(provider.resolveInstrument("Bitcoin")).rejects.toMatchObject({
      code: "UNSUPPORTED_INSTRUMENT",
    });
  });
});

describe("Alpha Vantage raw market-data acquisition", () => {
  test("fetches the minimum raw source set without network access", async () => {
    const { fetchFn, calls } = makeFetch({
      GLOBAL_QUOTE: { body: quote },
      OVERVIEW: { body: overview },
      INCOME_STATEMENT: { body: incomeStatement },
      BALANCE_SHEET: { body: balanceSheet },
      CASH_FLOW: { body: cashFlow },
    });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    const result = await provider.fetchMarketData({
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "NASDAQ",
      currency: "USD",
      region: "United States",
    });

    expect(result.quote.price).toBe(201.5);
    expect(result.incomeStatement.quarterlyReports).toHaveLength(1);
    expect(new Set(calls.map((call) => call.searchParams.get("function")))).toEqual(
      new Set([
        "GLOBAL_QUOTE",
        "OVERVIEW",
        "INCOME_STATEMENT",
        "BALANCE_SHEET",
        "CASH_FLOW",
      ]),
    );
  });

  test("can fetch compact daily prices for return and volatility metrics", async () => {
    const { fetchFn } = makeFetch({
      GLOBAL_QUOTE: { body: quote },
      TIME_SERIES_DAILY: { body: dailyPrices },
      OVERVIEW: { body: overview },
      INCOME_STATEMENT: { body: incomeStatement },
      BALANCE_SHEET: { body: balanceSheet },
      CASH_FLOW: { body: cashFlow },
    });
    const provider = new AlphaVantageProvider({ ...providerConfig(fetchFn), includeDailyPrices: true });

    const result = await provider.fetchMarketData({
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "NASDAQ",
      currency: "USD",
      region: "United States",
    });

    expect(result.historicalPrices?.prices).toHaveLength(4);
    expect(result.historicalPrices?.prices[0]).toEqual({ date: "2026-08-05", close: 202.5 });
  });
});

describe("Alpha Vantage error classification and retry policy", () => {
  test.each([
    ["invalid key", invalidKey, "INVALID_KEY"],
    ["rate limit", rateLimit, "RATE_LIMITED"],
    ["not found", notFound, "NOT_FOUND"],
  ] as const)("maps %s fixture to a stable error", async (_label, body, code) => {
    const { fetchFn } = makeFetch({ SYMBOL_SEARCH: { body } });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    await expect(provider.resolveInstrument("Unknown company")).rejects.toMatchObject({
      code,
      retryable: false,
    });
  });

  test("maps malformed provider payloads", async () => {
    const { fetchFn } = makeFetch({
      GLOBAL_QUOTE: { body: malformed },
      OVERVIEW: { body: overview },
      INCOME_STATEMENT: { body: incomeStatement },
      BALANCE_SHEET: { body: balanceSheet },
      CASH_FLOW: { body: cashFlow },
    });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    await expect(
      provider.fetchMarketData({
        symbol: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        currency: "USD",
        region: "United States",
      }),
    ).rejects.toMatchObject({
      code: "MALFORMED_RESPONSE",
      retryable: false,
    });
  });

  test("retries one transient upstream failure and then succeeds", async () => {
    const { fetchFn, calls } = makeFetch({
      GLOBAL_QUOTE: [
        { rawBody: "<html><body>Service unavailable</body></html>", status: 503 },
        { body: quote },
      ],
      OVERVIEW: { body: overview },
      INCOME_STATEMENT: { body: incomeStatement },
      BALANCE_SHEET: { body: balanceSheet },
      CASH_FLOW: { body: cashFlow },
    });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    await expect(
      provider.fetchMarketData({
        symbol: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        currency: "USD",
        region: "United States",
      }),
    ).resolves.toMatchObject({ quote: { price: 201.5 } });
    expect(calls.filter((call) => call.searchParams.get("function") === "GLOBAL_QUOTE"))
      .toHaveLength(2);
  });

  test("rejects a quote for a different symbol", async () => {
    const wrongQuote = {
      ...quote,
      "Global Quote": { ...quote["Global Quote"], "01. symbol": "MSFT" },
    };
    const { fetchFn } = makeFetch({
      GLOBAL_QUOTE: { body: wrongQuote },
      OVERVIEW: { body: overview },
      INCOME_STATEMENT: { body: incomeStatement },
      BALANCE_SHEET: { body: balanceSheet },
      CASH_FLOW: { body: cashFlow },
    });
    const provider = new AlphaVantageProvider(providerConfig(fetchFn));

    await expect(
      provider.fetchMarketData({
        symbol: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        currency: "USD",
        region: "United States",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("retries a timeout at most once", async () => {
    let attempts = 0;
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url,
      );
      if (url.searchParams.get("function") !== "GLOBAL_QUOTE") {
        const fixtures: Record<string, unknown> = {
          OVERVIEW: overview,
          INCOME_STATEMENT: incomeStatement,
          BALANCE_SHEET: balanceSheet,
          CASH_FLOW: cashFlow,
        };
        return new Response(JSON.stringify(fixtures[url.searchParams.get("function") ?? ""]));
      }
      attempts += 1;
      return await new Promise<never>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("The operation was aborted", "AbortError")),
          { once: true },
        );
      });
    }) as unknown as typeof fetch;
    const provider = new AlphaVantageProvider({
      ...providerConfig(fetchFn),
      timeoutMs: 1,
    });

    await expect(
      provider.fetchMarketData({
        symbol: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        currency: "USD",
        region: "United States",
      }),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(attempts).toBe(2);
  });

  test("safe logs never contain provider keys or query values", async () => {
    const events: MarketDataLogEvent[] = [];
    const { fetchFn } = makeFetch({ SYMBOL_SEARCH: { body: invalidKey } });
    const provider = new AlphaVantageProvider({
      ...providerConfig(fetchFn, (event) => events.push(event)),
      apiKey: "fake-secret-alpha-key",
    });

    await expect(provider.resolveInstrument("Sensitive Company Query")).rejects.toBeInstanceOf(
      MarketDataError,
    );
    const logs = JSON.stringify(events);
    expect(logs).not.toContain("fake-secret-alpha-key");
    expect(logs).not.toContain("Sensitive Company Query");
  });
});
