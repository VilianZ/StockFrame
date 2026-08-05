import { MarketSnapshotSchema, type MarketSnapshot } from "../domain";
import { sha256Hex } from "../domain/hashing";
import { canonicalSerialize } from "../domain/serialization";
import { MARKET_SNAPSHOT_VERSION } from "../domain/versions";
import type {
  FinancialStatementRecord,
  RawMarketDataBundle,
} from "./provider";

const PLACEHOLDERS = new Set(["", "none", "n/a", "na", "null", "-", "--"]);

const INCOME_FIELDS = {
  totalRevenue: "totalRevenue",
  grossProfit: "grossProfit",
  operatingIncome: "operatingIncome",
  netIncome: "netIncome",
  dilutedEPS: "dilutedEPS",
  dilutedAverageShares: "dilutedAverageShares",
  ebit: "ebit",
  incomeBeforeTax: "incomeBeforeTax",
  incomeTaxExpense: "incomeTaxExpense",
} as const;

const BALANCE_FIELDS = {
  totalAssets: "totalAssets",
  totalLiabilities: "totalLiabilities",
  totalShareholderEquity: "totalShareholderEquity",
  totalCurrentAssets: "totalCurrentAssets",
  totalCurrentLiabilities: "totalCurrentLiabilities",
  commonSharesOutstanding: "commonSharesOutstanding",
} as const;

const CASH_FLOW_FIELDS = {
  operatingCashflow: "operatingCashflow",
  capitalExpenditures: "capitalExpenditures",
} as const;

type StatementKind = "income" | "balanceSheet" | "cashFlow";

function finiteValue(value: unknown, absolute = false): number | null {
  if (typeof value === "string" && PLACEHOLDERS.has(value.trim().toLowerCase())) {
    return null;
  }
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return absolute ? Math.abs(parsed) : parsed;
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : null;
}

function rowKey(row: Record<string, unknown>): string {
  return canonicalSerialize(row);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return value;
}

function sourceRows(statement: FinancialStatementRecord) {
  return [
    ...statement.quarterlyReports.map((row) => ({ row, periodType: "quarterly" as const })),
    ...statement.annualReports.map((row) => ({ row, periodType: "annual" as const })),
  ];
}

function isOnOrBefore(date: string, asOf: string): boolean {
  return date <= asOf;
}

function selectRows(statement: FinancialStatementRecord, asOf: string) {
  const candidates = sourceRows(statement)
    .filter(({ row }) => validDate(row.fiscalDateEnding) && isOnOrBefore(row.fiscalDateEnding, asOf))
    .sort((left, right) => {
      const leftDate = left.row.fiscalDateEnding as string;
      const rightDate = right.row.fiscalDateEnding as string;
      if (leftDate !== rightDate) return rightDate.localeCompare(leftDate);
      if (left.periodType !== right.periodType) return left.periodType === "quarterly" ? -1 : 1;
      return rowKey(left.row).localeCompare(rowKey(right.row));
    });

  const seen = new Set<string>();
  return candidates.filter(({ row }) => {
    const date = row.fiscalDateEnding as string;
    if (seen.has(date)) return false;
    seen.add(date);
    return true;
  });
}

function valuesFromRow(
  row: Record<string, unknown>,
  fields: Record<string, string>,
): Record<string, number | null> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, rawKey]) => [
      key,
      finiteValue(row[rawKey], key === "capitalExpenditures"),
    ]),
  );
}

async function normalizeStatement(
  statement: FinancialStatementRecord,
  kind: StatementKind,
  fields: Record<string, string>,
  asOf: string,
  symbol: string,
) {
  const rows = selectRows(statement, asOf);
  return Promise.all(
    rows.map(async ({ row, periodType }) => {
      const periodEnd = row.fiscalDateEnding as string;
      const currency = normalizeCurrency(row.reportedCurrency);
      const values = valuesFromRow(row, fields);
      const evidenceId = await sha256Hex({
        symbol,
        source: `alpha-vantage.${kind}`,
        periodEnd,
        periodType,
        currency,
        values,
      });
      return { periodEnd, periodType, currency, values, evidenceId };
    }),
  );
}

export async function normalizeMarketData(bundle: RawMarketDataBundle): Promise<MarketSnapshot> {
  const asOf = bundle.quote.latestTradingDay;
  if (!validDate(asOf)) {
    throw new TypeError("Quote latest trading day must be a valid date");
  }

  const quoteEvidenceId = await sha256Hex({
    symbol: bundle.instrument.symbol,
    source: "alpha-vantage.global-quote",
    effectiveDate: asOf,
    value: bundle.quote.price,
  });
  const pricesByDate = new Map(
    (bundle.historicalPrices?.prices ?? []).map((point) => [point.date, point.close]),
  );
  pricesByDate.set(asOf, bundle.quote.price);
  const prices = await Promise.all(
    [...pricesByDate.entries()]
      .filter(([date, close]) => validDate(date) && isOnOrBefore(date, asOf) && Number.isFinite(close))
      .sort(([left], [right]) => right.localeCompare(left))
      .map(async ([date, close]) => {
        const evidenceId = date === asOf
          ? quoteEvidenceId
          : await sha256Hex({
              symbol: bundle.instrument.symbol,
              source: "alpha-vantage.time-series-daily",
              effectiveDate: date,
              close,
            });
        return { date, close, evidenceId };
      }),
  );
  const [income, balanceSheet, cashFlow] = await Promise.all([
    normalizeStatement(bundle.incomeStatement, "income", INCOME_FIELDS, asOf, bundle.instrument.symbol),
    normalizeStatement(bundle.balanceSheet, "balanceSheet", BALANCE_FIELDS, asOf, bundle.instrument.symbol),
    normalizeStatement(bundle.cashFlow, "cashFlow", CASH_FLOW_FIELDS, asOf, bundle.instrument.symbol),
  ]);

  const facts = Object.fromEntries(
    [
      ["income", income],
      ["balanceSheet", balanceSheet],
      ["cashFlow", cashFlow],
    ].flatMap(([kind, rows]) =>
      ((rows as typeof income)[0]?.values
        ? Object.entries((rows as typeof income)[0].values).map(([key, value]) => [`${kind}.${key}`, value])
        : [])),
  );
  const evidence = [
    {
      id: quoteEvidenceId,
      source: "alpha-vantage.global-quote",
      effectiveDate: asOf,
      valueReference: "quote.close",
    },
    ...prices
      .filter((point) => point.evidenceId !== quoteEvidenceId)
      .map((point) => ({
        id: point.evidenceId,
        source: "alpha-vantage.time-series-daily",
        effectiveDate: point.date,
        valueReference: "price.close",
      })),
    ...[
      ["income", income],
      ["balanceSheet", balanceSheet],
      ["cashFlow", cashFlow],
    ].flatMap(([kind, rows]) =>
      (rows as typeof income).map((row) => ({
        id: row.evidenceId,
        source: `alpha-vantage.${kind}`,
        effectiveDate: row.periodEnd,
        valueReference: `${kind}.${row.periodType}`,
      })),
    ),
  ];

  const snapshot = MarketSnapshotSchema.parse({
    schemaVersion: MARKET_SNAPSHOT_VERSION,
    instrument: bundle.instrument,
    asOf,
    currency: bundle.instrument.currency,
    price: finiteValue(bundle.quote.price),
    facts,
    evidence,
    prices,
    financials: { income, balanceSheet, cashFlow },
  });
  return deepFreeze(snapshot);
}
