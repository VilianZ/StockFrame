import type { CorporateActionKind, Instrument } from "../domain";

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
    | "universe"
    | "quote"
    | "overview"
    | "profile"
    | "daily-prices"
    | "prices"
    | "income-statement"
    | "balance-sheet"
    | "cash-flow"
    | "corporate-actions";
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
  warnings?: string[];
  raw: Record<string, unknown>;
}

export interface CompanyOverviewRecord {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  country: string;
  assetType: string;
  sector?: string;
  industry?: string;
  description?: string;
  raw: Record<string, unknown>;
}

export interface FinancialStatementRecord {
  annualReports: Record<string, unknown>[];
  quarterlyReports: Record<string, unknown>[];
  raw: Record<string, unknown>;
}

export interface CorporateActionInput {
  date: string;
  ticker: string;
  kind: CorporateActionKind;
  rawAction: string;
  value: number | null;
  relatedTicker: string | null;
  relatedName: string | null;
  notes: string | null;
}

export interface CorporateActionEnrichmentInput {
  status: "available" | "empty" | "unavailable";
  events: CorporateActionInput[];
  warnings: string[];
}

export interface RawMarketDataBundle {
  instrument: Instrument;
  quote: QuoteRecord;
  historicalPrices?: HistoricalPriceRecord;
  overview: CompanyOverviewRecord;
  incomeStatement: FinancialStatementRecord;
  balanceSheet: FinancialStatementRecord;
  cashFlow: FinancialStatementRecord;
  corporateActions?: CorporateActionEnrichmentInput;
  warnings?: string[];
}

export interface MarketDataProvider {
  resolveInstrument(query: string, signal?: AbortSignal): Promise<InstrumentResolution>;
  fetchMarketData(instrument: Instrument, signal?: AbortSignal): Promise<RawMarketDataBundle>;
}
