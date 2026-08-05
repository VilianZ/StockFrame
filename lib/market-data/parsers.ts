import { z } from "zod";

import type {
  CompanyOverviewRecord,
  FinancialStatementRecord,
  HistoricalPriceRecord,
  QuoteRecord,
} from "./provider";
import { MarketDataError } from "./provider";

const recordSchema = z.record(z.string(), z.unknown());

function malformed(message: string): never {
  throw new MarketDataError("MALFORMED_RESPONSE", message, false);
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  const result = recordSchema.safeParse(value);
  if (!result.success) {
    return malformed(message);
  }
  return result.data;
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return malformed(message);
  }
  return value.trim();
}

function finiteNumber(
  value: unknown,
  key: string,
  message: string,
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return malformed(`${message}: ${key}`);
  }
  return parsed;
}

export interface SymbolSearchMatch {
  symbol: string;
  name: string;
  assetType: string;
  region: string;
  currency: string;
  matchScore: number;
}

export function parseSymbolSearchResponse(input: unknown): SymbolSearchMatch[] {
  const root = asRecord(input, "Symbol search payload is not an object");
  if (!Array.isArray(root.bestMatches)) {
    return malformed("Symbol search payload has no bestMatches array");
  }

  return root.bestMatches.map((candidate) => {
    const row = asRecord(candidate, "Symbol search candidate is malformed");
    return {
      symbol: requiredString(row, "1. symbol", "Symbol search symbol is missing"),
      name: requiredString(row, "2. name", "Symbol search name is missing"),
      assetType: requiredString(
        row,
        "3. type",
        "Symbol search asset type is missing",
      ),
      region: requiredString(row, "4. region", "Symbol search region is missing"),
      currency: requiredString(
        row,
        "8. currency",
        "Symbol search currency is missing",
      ),
      matchScore: finiteNumber(
        row["9. matchScore"],
        "9. matchScore",
        "Symbol search score is invalid",
      ),
    };
  });
}

export function parseQuoteResponse(input: unknown): QuoteRecord {
  const root = asRecord(input, "Quote payload is not an object");
  const quote = asRecord(root["Global Quote"], "Quote payload is malformed");
  return {
    symbol: requiredString(quote, "01. symbol", "Quote symbol is missing"),
    price: finiteNumber(quote["05. price"], "05. price", "Quote price is invalid"),
    latestTradingDay: requiredString(
      quote,
      "07. latest trading day",
      "Quote trading day is missing",
    ),
    volume:
      quote["06. volume"] === undefined || quote["06. volume"] === ""
        ? null
        : finiteNumber(quote["06. volume"], "06. volume", "Quote volume is invalid"),
  };
}

export function parseDailyPricesResponse(input: unknown, symbol: string): HistoricalPriceRecord {
  const raw = asRecord(input, "Daily prices payload is not an object");
  const series = raw["Time Series (Daily)"];
  if (series === undefined) {
    return malformed("Daily prices payload has no time series");
  }
  const rows = asRecord(series, "Daily prices time series is malformed");
  const prices = Object.entries(rows).map(([date, value]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return malformed("Daily prices contains an invalid date");
    }
    const row = asRecord(value, "Daily prices row is malformed");
    return { date, close: finiteNumber(row["4. close"], "4. close", "Daily close is invalid") };
  });
  return { symbol, prices, raw };
}

export function parseOverviewResponse(input: unknown): CompanyOverviewRecord {
  const raw = asRecord(input, "Overview payload is not an object");
  return {
    symbol: requiredString(raw, "Symbol", "Overview symbol is missing"),
    name: requiredString(raw, "Name", "Overview name is missing"),
    exchange: requiredString(raw, "Exchange", "Overview exchange is missing"),
    currency: requiredString(raw, "Currency", "Overview currency is missing"),
    country: requiredString(raw, "Country", "Overview country is missing"),
    assetType: requiredString(raw, "AssetType", "Overview asset type is missing"),
    raw,
  };
}

export function parseFinancialStatementResponse(
  input: unknown,
): FinancialStatementRecord {
  const raw = asRecord(input, "Financial statement payload is not an object");
  if (!Array.isArray(raw.annualReports) || !Array.isArray(raw.quarterlyReports)) {
    return malformed(
      "Financial statement payload must contain annualReports and quarterlyReports arrays",
    );
  }

  const reports = [...raw.annualReports, ...raw.quarterlyReports];
  if (reports.some((report) => !recordSchema.safeParse(report).success)) {
    return malformed("Financial statement report row is malformed");
  }

  return {
    annualReports: raw.annualReports as Record<string, unknown>[],
    quarterlyReports: raw.quarterlyReports as Record<string, unknown>[],
    raw,
  };
}

export function isSupportedEquity(
  assetType: string,
  region: string,
  currency: string,
): boolean {
  const normalizedAssetType = assetType.trim().toLowerCase();
  return (
    (normalizedAssetType === "equity" || normalizedAssetType === "common stock") &&
    region.trim().toLowerCase() === "united states" &&
    currency.trim().toUpperCase() === "USD"
  );
}
