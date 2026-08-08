import "server-only";

import { InstrumentSchema, type Instrument } from "../domain";
import { getServerEnv } from "../server/env";
import {
  parseBusinessQuantPrices,
  parseBusinessQuantCorporateActions,
  parseBusinessQuantProfile,
  parseBusinessQuantStatement,
  parseBusinessQuantUniverse,
  type BusinessQuantUniverseEntry,
} from "./business-quant-parsers";
import {
  MarketDataError,
  type InstrumentCandidate,
  type InstrumentResolution,
  type MarketDataLogEvent,
  type MarketDataLogger,
  type MarketDataProvider,
  type QuoteRecord,
  type RawMarketDataBundle,
  type CorporateActionEnrichmentInput,
} from "./provider";

const BASE_URL = "https://data.businessquant.com";
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_UNIVERSE_TTL_MS = 24 * 60 * 60 * 1_000;
const DEFAULT_MARKET_DATA_TTL_MS = 15 * 60 * 1_000;
const MAX_ATTEMPTS = 2;
const MAX_MARKET_CACHE_ENTRIES = 64;
type FetchFunction = typeof fetch;
type Operation = MarketDataLogEvent["operation"];

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface BusinessQuantConfig {
  apiKey?: string;
  timeoutMs?: number;
  fetchFn?: FetchFunction;
  logger?: MarketDataLogger;
  now?: () => number;
  universeTtlMs?: number;
  marketDataTtlMs?: number;
  maxMarketCacheEntries?: number;
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function searchKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function instrumentFromEntry(entry: BusinessQuantUniverseEntry): Instrument {
  return InstrumentSchema.parse({
    symbol: entry.ticker,
    name: entry.name,
    exchange: entry.exchange,
    currency: "USD",
    region: "United States",
  });
}

function scoreEntry(query: string, entry: BusinessQuantUniverseEntry): number {
  const normalized = searchKey(query);
  const ticker = searchKey(entry.ticker);
  const name = searchKey(entry.name);
  const shortName = searchKey(entry.nameShort);
  if (normalized === ticker) return 1;
  if (normalized === name) return 0.98;
  if (normalized === shortName) return 0.96;
  if (name.includes(normalized) || shortName.includes(normalized)) return 0.9;
  if (normalized.includes(name) || normalized.includes(shortName)) return 0.86;
  const queryTokens = new Set(normalized.split(" ").filter(Boolean));
  const nameTokens = new Set(`${name} ${shortName}`.split(" ").filter(Boolean));
  const overlap = [...queryTokens].filter((token) => nameTokens.has(token)).length;
  return overlap > 0 ? 0.7 + (overlap / Math.max(queryTokens.size, nameTokens.size)) * 0.15 : 0;
}

function transientStatus(status: number): boolean {
  return status >= 500 && status <= 599;
}

export class BusinessQuantProvider implements MarketDataProvider {
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchFunction;
  private readonly logger: MarketDataLogger | undefined;
  private readonly now: () => number;
  private readonly universeTtlMs: number;
  private readonly marketDataTtlMs: number;
  private readonly maxMarketCacheEntries: number;
  private universeCache: CacheEntry<BusinessQuantUniverseEntry[]> | undefined;
  private readonly marketDataCache = new Map<string, CacheEntry<RawMarketDataBundle>>();

  constructor(config: BusinessQuantConfig = {}) {
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.logger = config.logger;
    this.now = config.now ?? Date.now;
    this.universeTtlMs = config.universeTtlMs ?? DEFAULT_UNIVERSE_TTL_MS;
    this.marketDataTtlMs = config.marketDataTtlMs ?? DEFAULT_MARKET_DATA_TTL_MS;
    this.maxMarketCacheEntries = config.maxMarketCacheEntries ?? MAX_MARKET_CACHE_ENTRIES;
  }

  async resolveInstrument(query: string, signal?: AbortSignal): Promise<InstrumentResolution> {
    const normalized = normalizeQuery(query);
    if (!normalized) return { kind: "not_found" };
    const universe = await this.getUniverse(signal);
    const candidates = universe
      .map((entry): InstrumentCandidate => ({ instrument: instrumentFromEntry(entry), score: scoreEntry(normalized, entry) }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || left.instrument.symbol.localeCompare(right.instrument.symbol));
    const exact = candidates.find((candidate) => candidate.instrument.symbol.toUpperCase() === normalized.toUpperCase());
    if (exact) return { kind: "resolved", instrument: exact.instrument, score: exact.score };
    if (candidates.length === 0) return { kind: "not_found" };
    if (candidates.length === 1 || candidates[0].score - (candidates[1]?.score ?? 0) >= 0.1) {
      return { kind: "resolved", instrument: candidates[0].instrument, score: candidates[0].score };
    }
    return { kind: "ambiguous", candidates: candidates.slice(0, 16) };
  }

  async fetchMarketData(instrument: Instrument, signal?: AbortSignal): Promise<RawMarketDataBundle> {
    const cacheKey = instrument.symbol.toUpperCase();
    const cached = this.marketDataCache.get(cacheKey);
    if (cached && cached.expiresAt > this.now()) return cached.value;
    if (cached) this.marketDataCache.delete(cacheKey);

    const [profilePayload, incomePayload, balancePayload, cashFlowPayload, pricesPayload, corporateActions] = await Promise.all([
      this.request("profile", "/stocks/profile", { ticker: cacheKey }, signal),
      this.request("income-statement", "/statements", { ticker: cacheKey, statement: "IS", frequency: "Quarter", period: "all" }, signal),
      this.request("balance-sheet", "/statements", { ticker: cacheKey, statement: "BS", frequency: "Quarter", period: "all" }, signal),
      this.request("cash-flow", "/statements", { ticker: cacheKey, statement: "CF", frequency: "Quarter", period: "all" }, signal),
      this.request("prices", "/quotes", { ticker: cacheKey, mode: "eod", period: "1y", limit: "260" }, signal),
      this.fetchCorporateActions(cacheKey, signal),
    ]);

    const overview = parseBusinessQuantProfile(profilePayload);
    if (overview.symbol !== cacheKey) throw new MarketDataError("NOT_FOUND", "Provider returned a different instrument", false);
    const verifiedInstrument = InstrumentSchema.parse({
      symbol: overview.symbol,
      name: overview.name,
      exchange: overview.exchange,
      currency: overview.currency,
      region: overview.country,
    });
    const incomeStatement = parseBusinessQuantStatement(incomePayload, "IS", cacheKey);
    const balanceSheet = parseBusinessQuantStatement(balancePayload, "BS", cacheKey);
    const cashFlow = parseBusinessQuantStatement(cashFlowPayload, "CF", cacheKey);
    const parsedPrices = parseBusinessQuantPrices(pricesPayload);
    if (parsedPrices.symbol !== cacheKey || parsedPrices.prices.length === 0) {
      throw new MarketDataError("NOT_FOUND", "Provider returned no prices for the instrument", false);
    }
    const latest = parsedPrices.prices[0];
    const quote: QuoteRecord = {
      symbol: cacheKey,
      price: latest.close,
      latestTradingDay: latest.date,
      volume: latest.volume,
    };
    const bundle: RawMarketDataBundle = {
      instrument: verifiedInstrument,
      quote,
      historicalPrices: parsedPrices.historical,
      overview,
      incomeStatement,
      balanceSheet,
      cashFlow,
      corporateActions,
      warnings: parsedPrices.warnings,
    };
    this.marketDataCache.set(cacheKey, { value: bundle, expiresAt: this.now() + this.marketDataTtlMs });
    while (this.marketDataCache.size > this.maxMarketCacheEntries) {
      const oldest = this.marketDataCache.keys().next().value;
      if (oldest === undefined) break;
      this.marketDataCache.delete(oldest);
    }
    return bundle;
  }

  private async fetchCorporateActions(
    ticker: string,
    signal?: AbortSignal,
  ): Promise<CorporateActionEnrichmentInput> {
    try {
      const payload = await this.request("corporate-actions", "/corporate_actions", {
        ticker,
        period: "1y",
        action: "all",
        limit: "100",
      }, signal);
      return parseBusinessQuantCorporateActions(payload, ticker);
    } catch (error) {
      if (error instanceof MarketDataError) {
        return {
          status: "unavailable",
          events: [],
          warnings: ["Corporate actions enrichment tidak tersedia; analisis utama tetap dilanjutkan."],
        };
      }
      return {
        status: "unavailable",
        events: [],
        warnings: ["Corporate actions enrichment tidak tersedia; analisis utama tetap dilanjutkan."],
      };
    }
  }

  private async getUniverse(signal?: AbortSignal): Promise<BusinessQuantUniverseEntry[]> {
    if (this.universeCache && this.universeCache.expiresAt > this.now()) return this.universeCache.value;
    const payload = await this.request("universe", "/universe", { security_type: "Equity" }, signal);
    const entries = parseBusinessQuantUniverse(payload);
    this.universeCache = { value: entries, expiresAt: this.now() + this.universeTtlMs };
    return entries;
  }

  private async request(
    operation: Operation,
    path: string,
    parameters: Record<string, string>,
    externalSignal?: AbortSignal,
  ): Promise<unknown> {
    if (!this.apiKey) {
      this.emit({ operation, attempt: 0, code: "INVALID_KEY" });
      throw new MarketDataError("INVALID_KEY", "Business Quant credentials are not configured", false);
    }
    const url = new URL(path, BASE_URL);
    for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
    url.searchParams.set("api_key", this.apiKey);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const abortFromParent = () => controller.abort(externalSignal?.reason);
      if (externalSignal?.aborted) abortFromParent();
      else externalSignal?.addEventListener("abort", abortFromParent, { once: true });
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
      this.emit({ operation, attempt });
      try {
        const response = await this.fetchFn(url, { signal: controller.signal, cache: "no-store" });
        this.emit({ operation, attempt, status: response.status });
        if (response.status === 429) throw new MarketDataError("RATE_LIMITED", "Business Quant quota is unavailable", false);
        if (response.status === 401 || response.status === 403) throw new MarketDataError("INVALID_KEY", "Business Quant credentials were rejected", false);
        if (response.status === 404) throw new MarketDataError("NOT_FOUND", "The requested instrument was not found", false);
        if (transientStatus(response.status)) {
          const error = new MarketDataError("UPSTREAM_FAILURE", "Business Quant upstream service failed", true);
          if (attempt < MAX_ATTEMPTS - 1) continue;
          throw error;
        }
        if (!response.ok) throw new MarketDataError("MALFORMED_RESPONSE", "Business Quant rejected the request", false);
        let body: unknown;
        try {
          body = JSON.parse(await response.text());
        } catch {
          throw new MarketDataError("MALFORMED_RESPONSE", "Business Quant returned invalid JSON", false);
        }
        return body;
      } catch (error) {
        if (error instanceof MarketDataError) {
          this.emit({ operation, attempt, code: error.code });
          if (error.retryable && attempt < MAX_ATTEMPTS - 1) continue;
          throw error;
        }
        const timedOut = controller.signal.aborted;
        const mapped = new MarketDataError(timedOut ? "TIMEOUT" : "NETWORK_FAILURE", timedOut ? "Business Quant request timed out" : "Business Quant network request failed", true);
        this.emit({ operation, attempt, code: mapped.code });
        if (externalSignal?.aborted || attempt >= MAX_ATTEMPTS - 1) throw mapped;
      } finally {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener("abort", abortFromParent);
      }
    }
    throw new MarketDataError("UPSTREAM_FAILURE", "Business Quant request failed", true);
  }

  private emit(event: MarketDataLogEvent): void {
    this.logger?.(event);
  }
}

export function createServerBusinessQuantProvider(
  config: Omit<BusinessQuantConfig, "apiKey"> = {},
): BusinessQuantProvider {
  return new BusinessQuantProvider({ ...config, apiKey: getServerEnv().BUSINESS_QUANT_API_KEY });
}
