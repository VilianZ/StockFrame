import type { CorporateActionKind } from "../domain";
import type {
  CompanyOverviewRecord,
  CorporateActionEnrichmentInput,
  CorporateActionInput,
  FinancialStatementRecord,
  HistoricalPriceRecord,
} from "./provider";
import { MarketDataError } from "./provider";

type JsonRecord = Record<string, unknown>;

export interface BusinessQuantUniverseEntry {
  ticker: string;
  name: string;
  nameShort: string;
  exchange: string;
  sector: string;
  industry: string;
}

export interface BusinessQuantPricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

const INCOME_SLUGS = {
  totalRevenue: ["revenue"],
  grossProfit: ["gross-profit"],
  operatingIncome: ["operating-income"],
  netIncome: [
    "net-income-towards-common-stockholders",
    "consolidated-net-income",
    "profit-after-tax",
  ],
  dilutedEPS: ["eps-diluted"],
  dilutedAverageShares: ["shares-outstanding-diluted", "shares-outstanding"],
  ebit: ["ebit"],
  incomeBeforeTax: ["ebt"],
  incomeTaxExpense: ["tax-provisions"],
} as const;

const BALANCE_SLUGS = {
  totalAssets: ["assets"],
  totalLiabilities: ["total-liabilities"],
  totalShareholderEquity: ["common-equity"],
  totalCurrentAssets: ["current-assets"],
  totalCurrentLiabilities: ["total-current-liabilities"],
  commonSharesOutstanding: ["shares-outstanding"],
} as const;

const CASH_FLOW_SLUGS = {
  operatingCashflow: ["cash-from-operations"],
  capitalExpenditures: ["capital-expenditures"],
} as const;

function malformed(message: string): never {
  throw new MarketDataError("MALFORMED_RESPONSE", message, false);
}

function record(value: unknown, message: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return malformed(message);
  }
  return value as JsonRecord;
}

function requiredString(value: unknown, message: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return malformed(message);
  }
  return value.trim();
}

function finite(value: unknown, message: string): number {
  if (value === null || value === undefined) return malformed(message);
  if (typeof value === "string" && value.trim().length === 0) return malformed(message);
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return malformed(message);
  return parsed;
}

function normalizedStatement(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function statementMatches(value: string, kind: "IS" | "BS" | "CF"): boolean {
  const normalized = normalizedStatement(value);
  return kind === "IS"
    ? normalized === "incomestatement"
    : kind === "BS"
      ? normalized === "balancesheet"
      : normalized === "cashflow" || normalized === "cashflowstatement";
}

function validDate(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function metadata(input: JsonRecord): JsonRecord {
  return record(input.metadata, "Business Quant metadata is missing");
}

function safeProviderRaw(kind: string): JsonRecord {
  return { provider: "business-quant", statement: kind, template: "general", frequency: "Quarter" };
}

export function parseBusinessQuantUniverse(input: unknown): BusinessQuantUniverseEntry[] {
  const root = record(input, "Business Quant universe payload is not an object");
  metadata(root);
  const rows = root.data;
  if (!Array.isArray(rows)) return malformed("Business Quant universe data is missing");

  const entries = rows.flatMap((value): BusinessQuantUniverseEntry[] => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
    const row = value as JsonRecord;
    if (String(row.security_type ?? "").toLowerCase() !== "equity") return [];
    const ticker = typeof row.ticker === "string" ? row.ticker.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const exchange = typeof row.exchange === "string" ? row.exchange.trim() : "";
    if (!ticker || !name || !exchange) return [];
    return [{
      ticker: ticker.toUpperCase(),
      name,
      nameShort: typeof row.name_short === "string" && row.name_short.trim() ? row.name_short.trim() : name,
      exchange,
      sector: typeof row.sector === "string" ? row.sector.trim() : "",
      industry: typeof row.industry === "string" ? row.industry.trim() : "",
    }];
  });
  if (entries.length === 0) return malformed("Business Quant universe contains no valid equity candidates");
  return entries;
}

export function parseBusinessQuantProfile(input: unknown): CompanyOverviewRecord {
  const root = record(input, "Business Quant profile payload is not an object");
  const assetType = requiredString(root.asset_class ?? root.security_type, "Business Quant profile asset class is missing");
  const country = "United States";
  if (assetType.toLowerCase() !== "equity") return malformed("Business Quant profile is not an equity");

  return {
    symbol: requiredString(root.ticker, "Business Quant profile ticker is missing").toUpperCase(),
    name: requiredString(root.name, "Business Quant profile company name is missing"),
    exchange: requiredString(root.exchange, "Business Quant profile exchange is missing"),
    currency: "USD",
    country,
    assetType,
    sector: typeof root.sector === "string" ? root.sector.trim() : undefined,
    industry: typeof root.industry === "string" ? root.industry.trim() : undefined,
    description: typeof root.profile === "string" ? root.profile.trim() : undefined,
    raw: { provider: "business-quant", profile: true },
  };
}

interface Section {
  slug: string;
  values: unknown[];
}

function collectSections(value: unknown, sections: Section[]): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSections(item, sections));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  const object = value as JsonRecord;
  const sectionMetadata = object.metadata;
  if (typeof sectionMetadata === "object" && sectionMetadata !== null && !Array.isArray(sectionMetadata)) {
    const slug = (sectionMetadata as JsonRecord).slug;
    if (typeof slug === "string" && slug.trim() && Array.isArray(object.values)) {
      sections.push({ slug: slug.trim(), values: object.values });
      return;
    }
  }
  Object.values(object).forEach((child) => collectSections(child, sections));
}

function dateBucket(input: unknown, slug: string): { date: string; value: number } {
  const row = record(input, `Business Quant value for ${slug} is malformed`);
  const dateValue = row.normalizedDate ?? row.date;
  if (!validDate(dateValue)) return malformed(`Business Quant value date for ${slug} is invalid`);
  if (String(row.periodType ?? "").toLowerCase() !== "quarter") {
    return malformed(`Business Quant value for ${slug} is not quarterly`);
  }
  const reportedValue = record(row.reportedValue, `Business Quant raw value for ${slug} is missing`);
  return { date: dateValue, value: finite(reportedValue.raw, `Business Quant raw value for ${slug} is invalid`) };
}

function mappedValue(values: Map<string, Map<string, number>>, slugs: readonly string[], date: string): number | undefined {
  for (const slug of slugs) {
    const value = values.get(slug)?.get(date);
    if (value !== undefined) return value;
  }
  return undefined;
}

export function parseBusinessQuantStatement(
  input: unknown,
  kind: "IS" | "BS" | "CF",
  expectedTicker?: string,
): FinancialStatementRecord {
  const root = record(input, "Business Quant statement payload is not an object");
  const meta = metadata(root);
  const ticker = requiredString(meta.ticker, "Business Quant statement ticker is missing").toUpperCase();
  if (expectedTicker && ticker !== expectedTicker.toUpperCase()) {
    return malformed("Business Quant statement ticker does not match the requested instrument");
  }
  const statement = requiredString(meta.statement, "Business Quant statement identity is missing");
  if (!statementMatches(statement, kind)) {
    return malformed("Business Quant statement identity does not match the requested statement");
  }
  if (String(meta.template ?? "").toLowerCase() !== "general") {
    return malformed("Business Quant statement template is unsupported");
  }
  if (String(meta.frequency ?? "").toLowerCase() !== "quarter") {
    return malformed("Business Quant statement frequency is unsupported");
  }
  const currency = requiredString(meta.currency, "Business Quant statement currency is missing").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return malformed("Business Quant statement currency is invalid");
  const data = record(root.data, "Business Quant statement data is missing");
  const sections: Section[] = [];
  collectSections(data, sections);
  if (sections.length === 0) return malformed("Business Quant statement contains no sections");

  const values = new Map<string, Map<string, number>>();
  for (const section of sections) {
    const byDate = values.get(section.slug) ?? new Map<string, number>();
    for (const item of section.values) {
      const parsed = dateBucket(item, section.slug);
      if (byDate.has(parsed.date) && byDate.get(parsed.date) !== parsed.value) {
        return malformed(`Business Quant contains conflicting values for ${section.slug}`);
      }
      byDate.set(parsed.date, parsed.value);
    }
    values.set(section.slug, byDate);
  }

  const dateSet = new Set<string>();
  for (const byDate of values.values()) for (const date of byDate.keys()) dateSet.add(date);
  const dates = [...dateSet].sort((left, right) => right.localeCompare(left)).slice(0, 12);
  if (dates.length === 0) return malformed("Business Quant statement has no quarterly values");

  const mappings = kind === "IS" ? INCOME_SLUGS : kind === "BS" ? BALANCE_SLUGS : CASH_FLOW_SLUGS;
  const quarterlyReports = dates.map((date) => {
    const row: Record<string, unknown> = { fiscalDateEnding: date, reportedCurrency: currency };
    for (const [field, slugs] of Object.entries(mappings)) {
      row[field] = mappedValue(values, slugs, date) ?? null;
    }
    return row;
  });

  return { quarterlyReports, annualReports: [], raw: safeProviderRaw(kind) };
}

function quarterIndex(date: string): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  return year * 4 + Math.floor((month - 1) / 3);
}

export function hasFourConsecutiveQuarters(statement: FinancialStatementRecord): boolean {
  const indices = [...new Set(statement.quarterlyReports
    .map((row) => row.fiscalDateEnding)
    .filter(validDate)
    .map(quarterIndex))].sort((left, right) => left - right);
  let run = 0;
  let previous: number | undefined;
  for (const current of indices) {
    run = previous !== undefined && current === previous + 1 ? run + 1 : 1;
    if (run >= 4) return true;
    previous = current;
  }
  return false;
}

function normalizedPriceDate(value: unknown): string {
  if (typeof value !== "string") return malformed("Business Quant price date is missing");
  const date = value.slice(0, 10);
  if (!validDate(date)) return malformed("Business Quant price date is invalid");
  return date;
}

export function parseBusinessQuantPrices(input: unknown): {
  symbol: string;
  prices: BusinessQuantPricePoint[];
  warnings: string[];
  historical: HistoricalPriceRecord;
} {
  const root = record(input, "Business Quant quotes payload is not an object");
  const meta = metadata(root);
  if (String(meta.mode ?? "").toLowerCase() !== "eod") return malformed("Business Quant quotes must use eod mode");
  const symbol = requiredString(meta.ticker, "Business Quant quotes ticker is missing").toUpperCase();
  if (!Array.isArray(root.data) || root.data.length === 0) return malformed("Business Quant quotes data is missing");
  const byDate = new Map<string, BusinessQuantPricePoint>();
  const warnings: string[] = [];
  for (const item of root.data) {
    const row = record(item, "Business Quant quote row is malformed");
    const point: BusinessQuantPricePoint = {
      date: normalizedPriceDate(row.date),
      open: finite(row.open, "Business Quant open price is invalid"),
      high: finite(row.high, "Business Quant high price is invalid"),
      low: finite(row.low, "Business Quant low price is invalid"),
      close: finite(row.close, "Business Quant close price is invalid"),
      volume: row.volume === null || row.volume === undefined ? null : finite(row.volume, "Business Quant volume is invalid"),
    };
    if ([point.open, point.high, point.low, point.close].some((value) => value <= 0)) {
      return malformed("Business Quant OHLC prices must be positive");
    }
    if (point.volume !== null && point.volume < 0) return malformed("Business Quant volume must be non-negative");
    if (point.high < Math.max(point.open, point.close, point.low) || point.low > Math.min(point.open, point.close, point.high)) {
      return malformed("Business Quant OHLC invariant is invalid");
    }
    const previous = byDate.get(point.date);
    if (!previous) {
      byDate.set(point.date, point);
      continue;
    }
    const sameOpenHighLow = ["open", "high", "low"].every((key) => previous[key as keyof BusinessQuantPricePoint] === point[key as keyof BusinessQuantPricePoint]);
    const sameClose = previous.close === point.close;
    const previousVolume = previous.volume;
    const pointVolume = point.volume;
    const hasUniqueVolumeWinner = previousVolume !== null && pointVolume !== null && previousVolume !== pointVolume;
    if (!sameOpenHighLow || !sameClose) {
      if (!hasUniqueVolumeWinner) {
        return malformed("Business Quant has conflicting OHLC rows for one date without a unique volume winner");
      }
      if (pointVolume > previousVolume) byDate.set(point.date, point);
      warnings.push(
        sameOpenHighLow
          ? `Duplicate EOD record with close conflict resolved by volume for ${point.date}`
          : `Duplicate EOD record with OHLC conflict resolved by larger volume for ${point.date}`,
      );
      continue;
    }
    if (pointVolume !== null && (previousVolume === null || pointVolume > previousVolume)) byDate.set(point.date, point);
    warnings.push(`Duplicate EOD record collapsed for ${point.date}`);
  }
  const prices = [...byDate.values()].sort((left, right) => right.date.localeCompare(left.date));
  const historical: HistoricalPriceRecord = {
    symbol,
    prices: prices.map(({ date, close }) => ({ date, close })),
    warnings,
    raw: { provider: "business-quant", mode: "eod" },
  };
  return { symbol, prices, warnings, historical };
}

const CORPORATE_ACTION_KIND_MAP: Record<string, CorporateActionKind> = {
  dividend: "dividend",
  split: "split",
  merger: "merger",
  merged_into: "merger",
  merged_with: "merger",
  acquisition: "acquisition",
  acquisition_by: "acquisition",
  acquisition_of: "acquisition",
  spinoff: "spinoff",
  spinoff_dividend: "spinoff",
  spinoff_from: "spinoff",
  bankruptcy: "bankruptcy",
  delisting: "delisting",
  delisted: "delisting",
  listing: "listing",
  listed: "listing",
  ticker_change: "ticker_change",
  ticker_adopted: "ticker_change",
  ticker_retired: "ticker_change",
  relation: "other",
};

function sanitizeBoundedText(value: unknown, field: string, maxLength: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return malformed(`Business Quant corporate action ${field} is invalid`);
  const sanitized = value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength);
  return sanitized || null;
}

function nullableFinite(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim().length === 0) return malformed(`Business Quant corporate action ${field} is invalid`);
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return malformed(`Business Quant corporate action ${field} is invalid`);
  return parsed;
}

function canonicalCorporateActionKind(rawAction: string): { kind: CorporateActionKind; known: boolean } {
  const normalized = rawAction.toLowerCase().replace(/\s+/g, "_");
  const kind = CORPORATE_ACTION_KIND_MAP[normalized];
  return kind ? { kind, known: true } : { kind: "other", known: false };
}

export function parseBusinessQuantCorporateActions(
  input: unknown,
  expectedTicker: string,
): CorporateActionEnrichmentInput {
  const root = record(input, "Business Quant corporate actions payload is not an object");
  metadata(root);
  if (!Array.isArray(root.data)) return malformed("Business Quant corporate actions data is missing");
  if (root.data.length === 0) return { status: "empty", events: [], warnings: [] };

  const ticker = expectedTicker.trim().toUpperCase();
  const warnings: string[] = [];
  const events: CorporateActionInput[] = [];
  let excludedOtherTicker = false;
  const rawRows = root.data.slice(0, 100);
  if (root.data.length > 100) warnings.push("Corporate actions dibatasi ke 100 record provider pertama.");

  for (const item of rawRows) {
    const row = record(item, "Business Quant corporate action row is malformed");
    const rowTicker = requiredString(row.ticker, "Business Quant corporate action ticker is missing").toUpperCase();
    if (rowTicker !== ticker) {
      excludedOtherTicker = true;
      continue;
    }
    const date = row.date;
    if (!validDate(date)) return malformed("Business Quant corporate action date is invalid");
    const rawAction = sanitizeBoundedText(row.action ?? row.rawAction, "action", 100);
    if (!rawAction) return malformed("Business Quant corporate action action is missing");
    const { kind, known } = canonicalCorporateActionKind(rawAction);
    if (!known) warnings.push("Corporate action type provider yang belum dikenal dipetakan ke other.");
    events.push({
      date,
      ticker: rowTicker,
      kind,
      rawAction,
      value: nullableFinite(row.value, "value"),
      relatedTicker: sanitizeBoundedText(row.related_ticker, "related ticker", 20),
      relatedName: sanitizeBoundedText(row.related_name, "related name", 200),
      notes: sanitizeBoundedText(row.notes, "notes", 500),
    });
  }

  if (excludedOtherTicker) warnings.push("Corporate action untuk ticker lain diabaikan.");
  const seen = new Set<string>();
  const deduplicated = events.filter((event) => {
    const key = JSON.stringify(event);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date);
    if (dateOrder !== 0) return dateOrder;
    return JSON.stringify(left).localeCompare(JSON.stringify(right));
  });
  if (deduplicated.length !== events.length) warnings.push("Duplicate corporate action record dikonsolidasikan.");
  return {
    status: deduplicated.length === 0 ? "empty" : "available",
    events: deduplicated,
    warnings: [...new Set(warnings)].slice(0, 20),
  };
}
