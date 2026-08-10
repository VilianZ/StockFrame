import {
  AnalyzeResponseSchema,
  MARKET_SNAPSHOT_VERSION,
  MetricSchema,
  REPORT_SCHEMA_VERSION,
  type AnalyzeResponse,
  type Metric,
} from "../domain";
import { METRIC_IDS, type MetricId } from "../ai/metric-policy";
import { getMetricCatalogEntry } from "../presentation";

const instrument = {
  symbol: "CTN",
  name: "Contoh Teknologi Nusantara",
  exchange: "NASDAQ",
  currency: "USD",
  region: "United States",
};

const metricValues: Record<MetricId, number> = {
  der: 0.72,
  current_ratio: 1.84,
  roa: 0.16,
  roe: 0.28,
  eps_ttm: 8.4,
  pe: 22.5,
  book_value_per_share: 48.2,
  pbv: 3.1,
  gross_margin: 0.46,
  operating_margin: 0.24,
  net_margin: 0.19,
  free_cash_flow: 136680000000,
  fcf_margin: 0.15,
  roic: 0.21,
  price_return: 0.18,
  volatility: 0.24,
};

const formulaIds: Partial<Record<MetricId, string>> = {
  roa: "roa-ttm-average-assets-v1",
  roe: "roe-ttm-average-equity-v1",
  net_margin: "net-margin-ttm-v1",
};

function availableMetric(id: MetricId): Metric {
  return MetricSchema.parse({
    id,
    value: metricValues[id],
    unit: getMetricCatalogEntry(id)?.defaultUnit ?? "ratio",
    formulaId: formulaIds[id] ?? `${id}-fixture-v1`,
    status: "available",
    warnings: [],
    evidenceIds: [`fixture-metric-${id}`],
  });
}

export const sufficientMetrics = METRIC_IDS.map(availableMetric);

const prices = [
  { date: "2025-08-05", close: 182, evidenceId: "fixture-price-start" },
  { date: "2026-02-05", close: 205, evidenceId: "fixture-price-middle" },
  { date: "2026-08-05", close: 214.76, evidenceId: "fixture-price-latest" },
];

const corporateAction = {
  date: "2026-05-15",
  ticker: "CTN",
  kind: "dividend" as const,
  rawAction: "dividend",
  value: 0.25,
  relatedTicker: null,
  relatedName: null,
  notes: "Data contoh untuk pengujian presentasi.",
  evidenceId: "fixture-corporate-action-dividend",
};

const snapshot = {
  schemaVersion: MARKET_SNAPSHOT_VERSION,
  instrument,
  asOf: "2026-08-05",
  currency: "USD",
  price: 214.76,
  facts: {
    "balanceSheet.totalLiabilities": 400,
    "balanceSheet.totalShareholderEquity": 600,
    "income.totalRevenue": 1000,
  },
  evidence: [
    ...sufficientMetrics.map((metric) => ({ id: metric.evidenceIds[0]!, source: "fixture-engine", effectiveDate: "2026-06-30", valueReference: `metric.${metric.id}` })),
    ...prices.map((point) => ({ id: point.evidenceId, source: "fixture-market", effectiveDate: point.date, valueReference: "price.close" })),
    { id: corporateAction.evidenceId, source: "fixture-corporate-action", effectiveDate: corporateAction.date, valueReference: "corporateAction.dividend" },
  ],
  prices,
  financials: {
    income: [{ periodEnd: "2026-06-30", periodType: "quarterly" as const, currency: "USD", values: { totalRevenue: 1000, netIncome: 190 }, evidenceId: "fixture-income" }],
    balanceSheet: [{ periodEnd: "2026-06-30", periodType: "quarterly" as const, currency: "USD", values: { totalAssets: 1000, totalLiabilities: 400, totalShareholderEquity: 600 }, evidenceId: "fixture-balance" }],
    cashFlow: [{ periodEnd: "2026-06-30", periodType: "quarterly" as const, currency: "USD", values: { operatingCashflow: 180, capitalExpenditures: 44 }, evidenceId: "fixture-cash-flow" }],
  },
  corporateActions: { status: "available" as const, events: [corporateAction], warnings: [] },
};

const snapshotWithoutCorporateActionEvidence = {
  ...snapshot,
  evidence: snapshot.evidence.filter((evidence) => evidence.source !== "fixture-corporate-action"),
};

const claim = (text: string, metricId: MetricId) => ({ text, metricIds: [metricId] });

const report = {
  schemaVersion: REPORT_SCHEMA_VERSION,
  summary: claim("Data contoh menunjukkan profitabilitas yang perlu dibaca bersama valuasi.", "roe"),
  strengths: [claim("Profitabilitas tersedia sebagai hasil engine.", "roa")],
  risks: [claim("Volatilitas tetap perlu diperhatikan.", "volatility")],
  uncertainties: [claim("Snapshot tidak menjelaskan kondisi setelah tanggal efektif.", "price_return")],
  limitations: ["Data contoh untuk pengujian presentation layer; bukan data live dan bukan nasihat investasi personal."],
  corporateActionClaims: [{ evidenceId: corporateAction.evidenceId, claim: "Dividen tercatat pada event terstruktur." }],
  profiles: {
    conservative: { profile: "conservative" as const, rating: "neutral" as const, confidence: 0.62, thesis: claim("Kualitas perlu dibaca dengan margin keamanan.", "roe"), considerations: [claim("Valuasi perlu dikaji bersama profitabilitas.", "pe")] },
    moderate: { profile: "moderate" as const, rating: "positive" as const, confidence: 0.68, thesis: claim("Profitabilitas dan arus kas memberi dasar pembacaan.", "fcf_margin"), considerations: [claim("Risiko harga masih perlu dipantau.", "volatility")] },
    aggressive: { profile: "aggressive" as const, rating: "positive" as const, confidence: 0.64, thesis: claim("Ruang pertumbuhan harus dibaca bersama valuasi.", "price_return"), considerations: [claim("Leverage tetap menjadi konteks penting.", "der")] },
  },
  disclaimer: "StockFrame adalah alat bantu riset dan edukasi, bukan nasihat investasi personal.",
};

export const sufficientAnalyzeFixture: AnalyzeResponse = AnalyzeResponseSchema.parse({
  requestId: "00000000-0000-4000-8000-000000000101",
  instrument,
  snapshot,
  metrics: sufficientMetrics,
  quality: { score: 96, decision: "sufficient", flags: [], aiEligible: true, notes: ["Data contoh untuk pengujian presentasi."] },
  report,
});

export const corporateActionsEmptyFixture: AnalyzeResponse = AnalyzeResponseSchema.parse({
  ...sufficientAnalyzeFixture,
  snapshot: { ...snapshotWithoutCorporateActionEvidence, corporateActions: { status: "empty", events: [], warnings: [] } },
  report: { ...sufficientAnalyzeFixture.report, corporateActionClaims: [] },
});

export const corporateActionsUnavailableFixture: AnalyzeResponse = AnalyzeResponseSchema.parse({
  ...sufficientAnalyzeFixture,
  snapshot: { ...snapshotWithoutCorporateActionEvidence, corporateActions: { status: "unavailable", events: [], warnings: ["Corporate actions enrichment tidak tersedia pada data contoh."] } },
  report: { ...sufficientAnalyzeFixture.report, corporateActionClaims: [] },
});
