import "server-only";

import { InstrumentSchema, type Instrument } from "../domain";
import { getServerEnv } from "../server/env";
import {
  isSupportedEquity,
  parseDailyPricesResponse,
  parseFinancialStatementResponse,
  parseOverviewResponse,
  parseQuoteResponse,
  parseSymbolSearchResponse,
} from "./parsers";
import {
  MarketDataError,
  type CompanyOverviewRecord,
  type FinancialStatementRecord,
  type HistoricalPriceRecord,
  type InstrumentCandidate,
  type InstrumentResolution,
  type MarketDataLogEvent,
  type MarketDataLogger,
  type MarketDataProvider,
  type QuoteRecord,
  type RawMarketDataBundle,
} from "./provider";

const DEFAULT_BASE_URL = "https://www.alphavantage.co/query";
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 2;
const STRONG_MATCH_THRESHOLD = 0.8;
const STRONG_MATCH_GAP = 0.1;

type AlphaVantageOperation = MarketDataLogEvent["operation"];
type FetchFunction = typeof fetch;

export interface AlphaVantageConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchFn?: FetchFunction;
  logger?: MarketDataLogger;
  includeDailyPrices?: boolean;
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function isTransientStatus(status: number): boolean {
  return status >= 500 && status <= 599;
}

function providerMessage(input: unknown): string {
  if (typeof input !== "object" || input === null) {
    return "";
  }
  const record = input as Record<string, unknown>;
  return [record.Note, record.Information, record["Error Message"]]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

function classifyProviderMessage(input: unknown): MarketDataError | null {
  const message = providerMessage(input);
  if (!message) {
    return null;
  }

  const lower = message.toLowerCase();
  if (
    lower.includes("invalid api key") ||
    lower.includes("api key") ||
    lower.includes("apikey")
  ) {
    return new MarketDataError("INVALID_KEY", "Alpha Vantage credentials were rejected", false);
  }
  if (
    lower.includes("frequency") ||
    lower.includes("rate limit") ||
    lower.includes("call frequency") ||
    lower.includes("premium")
  ) {
    return new MarketDataError("RATE_LIMITED", "Alpha Vantage request quota is unavailable", false);
  }
  if (
    lower.includes("invalid api call") ||
    lower.includes("symbol") ||
    lower.includes("no data")
  ) {
    return new MarketDataError("NOT_FOUND", "The requested instrument was not found", false);
  }
  return new MarketDataError("UPSTREAM_FAILURE", "Alpha Vantage returned an upstream error", true);
}

function asInstrument(overview: CompanyOverviewRecord): Instrument {
  if (!isSupportedEquity(overview.assetType, overview.country, overview.currency)) {
    throw new MarketDataError(
      "UNSUPPORTED_INSTRUMENT",
      "The resolved instrument is not a supported US equity",
      false,
    );
  }

  return InstrumentSchema.parse({
    symbol: overview.symbol,
    name: overview.name,
    exchange: overview.exchange,
    currency: overview.currency.toUpperCase(),
    region: overview.country,
  });
}

function candidateFromSearch(
  match: ReturnType<typeof parseSymbolSearchResponse>[number],
): InstrumentCandidate | null {
  if (!isSupportedEquity(match.assetType, match.region, match.currency)) {
    return null;
  }
  return {
    instrument: InstrumentSchema.parse({
      symbol: match.symbol,
      name: match.name,
      exchange: "UNKNOWN",
      currency: match.currency.toUpperCase(),
      region: match.region,
    }),
    score: match.matchScore,
  };
}

export class AlphaVantageProvider implements MarketDataProvider {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchFunction;
  private readonly logger: MarketDataLogger | undefined;
  private readonly includeDailyPrices: boolean;

  constructor(config: AlphaVantageConfig = {}) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.logger = config.logger;
    this.includeDailyPrices = config.includeDailyPrices ?? true;
  }

  async resolveInstrument(query: string): Promise<InstrumentResolution> {
    const normalized = normalizeQuery(query);
    const matches = await this.requestSymbolSearch(normalized);
    const candidates = matches
      .map(candidateFromSearch)
      .filter((candidate): candidate is InstrumentCandidate => candidate !== null)
      .sort((left, right) => right.score - left.score);

    if (matches.length > 0 && candidates.length === 0) {
      throw new MarketDataError(
        "UNSUPPORTED_INSTRUMENT",
        "Search results did not contain a supported US equity",
        false,
      );
    }
    if (candidates.length === 0) {
      return { kind: "not_found" };
    }

    const exactSymbol = candidates.find(
      (candidate) => candidate.instrument.symbol.toUpperCase() === normalized.toUpperCase(),
    );
    if (exactSymbol) {
      return { kind: "resolved", instrument: exactSymbol.instrument, score: exactSymbol.score };
    }

    const top = candidates[0];
    const second = candidates[1];
    const scoreGap = second ? top.score - second.score : 1;
    if (top.score >= STRONG_MATCH_THRESHOLD && scoreGap >= STRONG_MATCH_GAP) {
      return { kind: "resolved", instrument: top.instrument, score: top.score };
    }
    if (candidates.length > 1) {
      return { kind: "ambiguous", candidates };
    }
    return { kind: "ambiguous", candidates };
  }

  async fetchMarketData(instrument: Instrument): Promise<RawMarketDataBundle> {
    const [quote, overview, incomeStatement, balanceSheet, cashFlow, historicalPrices] = await Promise.all([
      this.requestQuote(instrument.symbol),
      this.requestOverview(instrument.symbol),
      this.requestFinancialStatement(instrument.symbol, "INCOME_STATEMENT"),
      this.requestFinancialStatement(instrument.symbol, "BALANCE_SHEET"),
      this.requestFinancialStatement(instrument.symbol, "CASH_FLOW"),
      this.includeDailyPrices
        ? this.requestDailyPrices(instrument.symbol)
        : Promise.resolve(undefined),
    ]);

    const verifiedInstrument = asInstrument(overview);
    if (
      verifiedInstrument.symbol.toUpperCase() !== instrument.symbol.toUpperCase() ||
      quote.symbol.toUpperCase() !== instrument.symbol.toUpperCase()
    ) {
      throw new MarketDataError("NOT_FOUND", "Provider returned a different instrument", false);
    }

    return {
      instrument: verifiedInstrument,
      quote,
      historicalPrices,
      overview,
      incomeStatement,
      balanceSheet,
      cashFlow,
    };
  }

  private async requestSymbolSearch(query: string) {
    const response = await this.request("symbol-search", "SYMBOL_SEARCH", {
      keywords: query,
    });
    return parseSymbolSearchResponse(response);
  }

  private async requestQuote(symbol: string): Promise<QuoteRecord> {
    const response = await this.request("quote", "GLOBAL_QUOTE", { symbol });
    return parseQuoteResponse(response);
  }

  private async requestOverview(symbol: string): Promise<CompanyOverviewRecord> {
    const response = await this.request("overview", "OVERVIEW", { symbol });
    return parseOverviewResponse(response);
  }

  private async requestFinancialStatement(
    symbol: string,
    operation: "INCOME_STATEMENT" | "BALANCE_SHEET" | "CASH_FLOW",
  ): Promise<FinancialStatementRecord> {
    const logOperation: AlphaVantageOperation =
      operation === "INCOME_STATEMENT"
        ? "income-statement"
        : operation === "BALANCE_SHEET"
          ? "balance-sheet"
          : "cash-flow";
    const response = await this.request(logOperation, operation, { symbol });
    return parseFinancialStatementResponse(response);
  }

  private async requestDailyPrices(symbol: string): Promise<HistoricalPriceRecord> {
    const response = await this.request("daily-prices", "TIME_SERIES_DAILY", { symbol });
    return parseDailyPricesResponse(response, symbol);
  }

  private async request(
    operation: AlphaVantageOperation,
    providerFunction: string,
    parameters: Record<string, string>,
  ): Promise<unknown> {
    if (!this.apiKey) {
      this.emit({ operation, attempt: 0, code: "INVALID_KEY" });
      throw new MarketDataError("INVALID_KEY", "Alpha Vantage credentials are not configured", false);
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set("function", providerFunction);
    for (const [key, value] of Object.entries(parameters)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set("apikey", this.apiKey);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
      this.emit({ operation, attempt });

      try {
        const response = await this.fetchFn(url, {
          signal: controller.signal,
          cache: "no-store",
        });
        this.emit({ operation, attempt, status: response.status });

        if (response.status === 429) {
          const error = new MarketDataError(
            "RATE_LIMITED",
            "Alpha Vantage request quota is unavailable",
            false,
          );
          this.emit({ operation, attempt, status: response.status, code: error.code });
          throw error;
        }
        if (response.status === 401 || response.status === 403) {
          const error = new MarketDataError(
            "INVALID_KEY",
            "Alpha Vantage credentials were rejected",
            false,
          );
          this.emit({ operation, attempt, status: response.status, code: error.code });
          throw error;
        }
        if (isTransientStatus(response.status)) {
          const error = new MarketDataError(
            "UPSTREAM_FAILURE",
            "Alpha Vantage request failed upstream",
            true,
          );
          this.emit({ operation, attempt, status: response.status, code: error.code });
          if (attempt < MAX_ATTEMPTS - 1) {
            continue;
          }
          throw error;
        }
        if (response.status === 404) {
          const error = new MarketDataError(
            "NOT_FOUND",
            "The requested provider resource was not found",
            false,
          );
          this.emit({ operation, attempt, status: response.status, code: error.code });
          throw error;
        }
        if (!response.ok) {
          const error = new MarketDataError(
            "NETWORK_FAILURE",
            "Alpha Vantage request failed",
            false,
          );
          this.emit({ operation, attempt, status: response.status, code: error.code });
          throw error;
        }

        const bodyText = await response.text();
        let body: unknown;
        try {
          body = JSON.parse(bodyText);
        } catch {
          throw new MarketDataError("MALFORMED_RESPONSE", "Provider returned invalid JSON", false);
        }

        const providerError = classifyProviderMessage(body);
        if (providerError) {
          this.emit({ operation, attempt, status: response.status, code: providerError.code });
          if (providerError.retryable && attempt < MAX_ATTEMPTS - 1) {
            continue;
          }
          throw providerError;
        }
        return body;
      } catch (error) {
        if (error instanceof MarketDataError) {
          if (error.retryable && attempt < MAX_ATTEMPTS - 1) {
            continue;
          }
          throw error;
        }
        const timedOut = controller.signal.aborted;
        const mapped = new MarketDataError(
          timedOut ? "TIMEOUT" : "NETWORK_FAILURE",
          timedOut ? "Alpha Vantage request timed out" : "Alpha Vantage network request failed",
          true,
        );
        this.emit({ operation, attempt, code: mapped.code });
        if (attempt < MAX_ATTEMPTS - 1) {
          continue;
        }
        throw mapped;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new MarketDataError("UPSTREAM_FAILURE", "Alpha Vantage request failed", true);
  }

  private emit(event: MarketDataLogEvent): void {
    this.logger?.(event);
  }
}

export function createServerAlphaVantageProvider(
  config: Omit<AlphaVantageConfig, "apiKey"> = {},
): AlphaVantageProvider {
  return new AlphaVantageProvider({
    ...config,
    apiKey: getServerEnv().ALPHA_VANTAGE_API_KEY,
  });
}
