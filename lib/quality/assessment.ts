import {
  QualityAssessmentSchema,
  type MarketSnapshot,
  type Metric,
  type QualityAssessment,
  type QualityFlag,
} from "../domain";

const FLAG_PENALTIES: Record<QualityFlag, number> = {
  missing_market_data: 30,
  missing_financial_data: 35,
  partial_ttm: 10,
  currency_mismatch: 25,
  inconsistent_statements: 15,
  insufficient_evidence: 10,
  stale_data: 10,
};

const CORE_METRIC_IDS = [
  "der",
  "current_ratio",
  "roa",
  "roe",
  "eps_ttm",
  "pe",
  "book_value_per_share",
  "pbv",
  "gross_margin",
  "operating_margin",
  "net_margin",
  "free_cash_flow",
  "fcf_margin",
  "roic",
] as const;

function daysBetween(start: string, end: string): number {
  return Math.abs(Date.parse(end) - Date.parse(start)) / 86_400_000;
}

function latestPeriod(rows: { periodEnd: string }[]): string | null {
  return rows.length ? rows.map((row) => row.periodEnd).sort().at(-1) ?? null : null;
}

function pushFlag(flags: QualityFlag[], flag: QualityFlag): void {
  if (!flags.includes(flag)) flags.push(flag);
}

export function assessDataQuality(
  snapshot: MarketSnapshot,
  metrics: Metric[],
  options: { referenceDate?: string } = {},
): QualityAssessment {
  const flags: QualityFlag[] = [];
  const notes: string[] = [];
  const financialRows = [
    ...snapshot.financials.income,
    ...snapshot.financials.balanceSheet,
    ...snapshot.financials.cashFlow,
  ];

  if (snapshot.price === null || snapshot.prices.length === 0) {
    pushFlag(flags, "missing_market_data");
    notes.push("Harga pasar efektif tidak tersedia.");
  }
  const hasMinimumFinancialCoverage =
    snapshot.financials.income.filter((row) => row.periodType === "quarterly").length >= 4 &&
    snapshot.financials.balanceSheet.length >= 2 &&
    snapshot.financials.cashFlow.filter((row) => row.periodType === "quarterly").length >= 4;
  const hasCoreMetrics = CORE_METRIC_IDS.every((id) => {
    const metric = metrics.find((item) => item.id === id);
    return metric !== undefined && metric.status !== "not_available";
  });
  if (!hasMinimumFinancialCoverage || !hasCoreMetrics) {
    pushFlag(flags, "missing_financial_data");
    notes.push("Data belum memenuhi coverage minimum statement dan metrik fundamental inti.");
  }
  if (metrics.some((metric) => metric.warnings.some((warning) => warning.includes("partial_ttm") || warning.includes("partial")))) {
    pushFlag(flags, "partial_ttm");
    notes.push("Sebagian metrik TTM belum memiliki empat periode kuartal valid.");
  }
  if (financialRows.some((row) => row.currency !== null && row.currency !== snapshot.currency)) {
    pushFlag(flags, "currency_mismatch");
    notes.push("Sebagian laporan menggunakan mata uang berbeda dari instrumen.");
  }

  const latestDates = [
    latestPeriod(snapshot.financials.income),
    latestPeriod(snapshot.financials.balanceSheet),
    latestPeriod(snapshot.financials.cashFlow),
  ].filter((date): date is string => date !== null);
  if (latestDates.length > 1 && Math.max(...latestDates.map((date) => daysBetween(date, latestDates[0]))) > 120) {
    pushFlag(flags, "inconsistent_statements");
    notes.push("Tanggal laporan terbaru antar-statement terlalu berjauhan.");
  }

  if (
    snapshot.evidence.length === 0 ||
    metrics.some((metric) => metric.status === "available" && metric.evidenceIds.length === 0)
  ) {
    pushFlag(flags, "insufficient_evidence");
    notes.push("Sebagian data atau metrik tidak memiliki evidence ID.");
  }
  if (options.referenceDate && daysBetween(snapshot.asOf, options.referenceDate) > 7) {
    pushFlag(flags, "stale_data");
    notes.push("Snapshot lebih lama dari batas kesegaran tujuh hari.");
  }

  const score = Math.max(0, 100 - flags.reduce((total, flag) => total + FLAG_PENALTIES[flag], 0));
  const decision = score < 60 || flags.includes("missing_market_data") || flags.includes("missing_financial_data") || flags.includes("currency_mismatch")
    ? "insufficient"
    : flags.length > 0 || score < 85
      ? "degraded"
      : "sufficient";

  return QualityAssessmentSchema.parse({
    score,
    decision,
    flags,
    aiEligible: decision !== "insufficient",
    notes: notes.length ? notes : ["Data pasar dan keuangan memenuhi quality gate dasar."],
  });
}
