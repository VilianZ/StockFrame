import type { Instrument } from "../domain";

export const MARKET_DATA_ERROR_CODES = [
  "INVALID_KEY",
  "RATE_LIMITED",
  "TIMEOUT",
  "MALFORMED_RESPONSE",
  "NOT_FOUND",
  "UNSUPPORTED_INSTRUMENT",
  "UPSTREAM_FAILURE",
  "NETWORK_FAILURE",
] as const;

export type MarketDataErrorCode = (typeof MARKET_DATA_ERROR_CODES)[number];

export class MarketDataError extends Error {
  readonly code: MarketDataErrorCode;
  readonly retryable: boolean;

  constructor(
    code: MarketDataErrorCode,
    message: string,
    retryable: boolean,
  ) {
    super(message);
    this.name = "MarketDataError";
    this.code = code;
    this.retryable = retryable;
  }
}

export interface MarketDataLogEvent {
  operation:
    | "symbol-search"
    | "quote"
    | "overview"
    | "daily-prices"
    | "income-statement"
    | "balance-sheet"
    | "cash-flow";
  attempt: number;
  status?: number;
  code?: MarketDataErrorCode;
}

export type MarketDataLogger = (event: MarketDataLogEvent) => void;

export interface InstrumentCandidate {
  instrument: Instrument;
  score: number;
}

export type InstrumentResolution =
  | { kind: "resolved"; instrument: Instrument; score: number }
  | { kind: "ambiguous"; candidates: InstrumentCandidate[] }
  | { kind: "not_found" };

export interface QuoteRecord {
  symbol: string;
  price: number;
  latestTradingDay: string;
  volume: number | null;
}

export interface HistoricalPriceRecord {
  symbol: string;
  prices: { date: string; close: number }[];
  raw: Record<string, unknown>;
}

export interface CompanyOverviewRecord {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  country: string;
  assetType: string;
  raw: Record<string, unknown>;
}

export interface FinancialStatementRecord {
  annualReports: Record<string, unknown>[];
  quarterlyReports: Record<string, unknown>[];
  raw: Record<string, unknown>;
}

export interface RawMarketDataBundle {
  instrument: Instrument;
  quote: QuoteRecord;
  historicalPrices?: HistoricalPriceRecord;
  overview: CompanyOverviewRecord;
  incomeStatement: FinancialStatementRecord;
  balanceSheet: FinancialStatementRecord;
  cashFlow: FinancialStatementRecord;
}

export interface MarketDataProvider {
  resolveInstrument(query: string): Promise<InstrumentResolution>;
  fetchMarketData(instrument: Instrument): Promise<RawMarketDataBundle>;
}
