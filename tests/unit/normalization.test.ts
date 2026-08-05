import { describe, expect, test } from "vitest";

import { normalizeMarketData } from "../../lib/market-data/normalizer";
import type { RawMarketDataBundle } from "../../lib/market-data/provider";

const instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchange: "NASDAQ",
  currency: "USD",
  region: "United States",
} as const;

function statement(rows: Record<string, unknown>[], annualReports: Record<string, unknown>[] = []) {
  return { quarterlyReports: rows, annualReports, raw: { quarterlyReports: rows, annualReports } };
}

function bundle(overrides: Partial<RawMarketDataBundle> = {}): RawMarketDataBundle {
  const quarter = {
    fiscalDateEnding: "2026-06-30",
    reportedCurrency: "usd",
    totalRevenue: "100",
    grossProfit: "60",
    operatingIncome: "20",
    netIncome: "10",
    dilutedEPS: "2",
    dilutedAverageShares: "10",
  };
  return {
    instrument,
    quote: { symbol: "AAPL", price: 200, latestTradingDay: "2026-08-05", volume: 1000 },
    overview: { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "USD", country: "United States", assetType: "Common Stock", raw: {} },
    incomeStatement: statement([quarter, { ...quarter, fiscalDateEnding: "2026-12-31", totalRevenue: "future" }, { ...quarter, fiscalDateEnding: "2026-06-30", totalRevenue: "999" }]),
    balanceSheet: statement([{ fiscalDateEnding: "2026-06-30", reportedCurrency: "USD", totalAssets: "1000", totalLiabilities: "400", totalShareholderEquity: "600", totalCurrentAssets: "200", totalCurrentLiabilities: "100", commonSharesOutstanding: "10" }]),
    cashFlow: statement([{ fiscalDateEnding: "2026-06-30", reportedCurrency: "USD", operatingCashflow: "30", capitalExpenditures: "-10" }]),
    ...overrides,
  };
}

describe("market data normalization", () => {
  test("parses finite values, excludes future rows, sorts and deduplicates periods", async () => {
    const snapshot = await normalizeMarketData(bundle());

    expect(snapshot.financials.income).toHaveLength(1);
    expect(snapshot.financials.income[0]).toMatchObject({
      periodEnd: "2026-06-30",
      periodType: "quarterly",
      currency: "USD",
    });
    expect(snapshot.financials.income[0].values.totalRevenue).toBe(100);
    expect(snapshot.financials.cashFlow[0].values.capitalExpenditures).toBe(10);
    expect(snapshot.evidence).toHaveLength(4);
    expect(snapshot.prices[0].evidenceId).toHaveLength(64);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.financials.income[0].values)).toBe(true);
  });

  test("turns placeholders and non-finite values into null without creating NaN or Infinity", async () => {
    const input = bundle({
      incomeStatement: statement([{ fiscalDateEnding: "2026-06-30", reportedCurrency: "USD", totalRevenue: "N/A", grossProfit: "Infinity", netIncome: "--" }]),
    });
    const snapshot = await normalizeMarketData(input);
    expect(snapshot.financials.income[0].values).toMatchObject({ totalRevenue: null, grossProfit: null, netIncome: null });
    expect(JSON.stringify(snapshot)).not.toMatch(/NaN|Infinity/);
  });

  test("keeps evidence IDs stable for equivalent raw objects with different key order", async () => {
    const first = await normalizeMarketData(bundle());
    const second = await normalizeMarketData(bundle({
      incomeStatement: statement([{ dilutedEPS: "2", netIncome: "10", operatingIncome: "20", grossProfit: "60", totalRevenue: "100", fiscalDateEnding: "2026-06-30", reportedCurrency: "usd", dilutedAverageShares: "10" }]),
    }));

    expect(second.evidence.map((item) => item.id)).toEqual(first.evidence.map((item) => item.id));
    expect(second.financials.income[0].evidenceId).toBe(first.financials.income[0].evidenceId);
  });

  test("normalizes compact daily prices and excludes prices after the quote date", async () => {
    const snapshot = await normalizeMarketData(bundle({
      historicalPrices: {
        symbol: "AAPL",
        raw: {},
        prices: [
          { date: "2026-08-05", close: 202.5 },
          { date: "2026-08-04", close: 201.5 },
          { date: "2026-08-06", close: 203 },
        ],
      },
    }));
    expect(snapshot.prices.map((point) => point.date)).toEqual(["2026-08-05", "2026-08-04"]);
    expect(snapshot.prices[0].close).toBe(200);
    expect(snapshot.prices[1].close).toBe(201.5);
  });
});
