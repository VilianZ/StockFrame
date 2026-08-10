import { AnalyzeResponseSchema, MetricSchema, type AnalyzeResponse } from "../domain";
import { sufficientAnalyzeFixture } from "./analyze-success";

export const degradedAnalyzeFixture: AnalyzeResponse = AnalyzeResponseSchema.parse({
  ...sufficientAnalyzeFixture,
  requestId: "00000000-0000-4000-8000-000000000102",
  snapshot: {
    ...sufficientAnalyzeFixture.snapshot,
    evidence: sufficientAnalyzeFixture.snapshot.evidence.filter((evidence) => evidence.source !== "fixture-corporate-action"),
    price: null,
    prices: [sufficientAnalyzeFixture.snapshot.prices.at(-1)!],
    corporateActions: { status: "empty", events: [], warnings: [] },
  },
  metrics: sufficientAnalyzeFixture.metrics.map((metric) => metric.id === "free_cash_flow"
    ? MetricSchema.parse({ ...metric, status: "not_available", value: null, warnings: ["Data contoh tidak lengkap."] })
    : metric),
  quality: {
    score: 68,
    decision: "degraded",
    flags: ["missing_market_data", "partial_ttm"],
    aiEligible: true,
    notes: ["Data contoh terbatas; hasil perlu dibaca bersama keterbatasan."],
  },
  report: {
    ...sufficientAnalyzeFixture.report,
    corporateActionClaims: [],
  },
});

export const unavailableMetricFixture: AnalyzeResponse = AnalyzeResponseSchema.parse({
  ...sufficientAnalyzeFixture,
  requestId: "00000000-0000-4000-8000-000000000103",
  metrics: sufficientAnalyzeFixture.metrics.map((metric) => metric.id === "free_cash_flow"
    ? MetricSchema.parse({ ...metric, status: "not_available", value: null, warnings: ["Input belum tersedia."] })
    : metric),
});

export const notMeaningfulMetricFixture: AnalyzeResponse = AnalyzeResponseSchema.parse({
  ...sufficientAnalyzeFixture,
  requestId: "00000000-0000-4000-8000-000000000104",
  metrics: sufficientAnalyzeFixture.metrics.map((metric) => metric.id === "pe"
    ? MetricSchema.parse({ ...metric, status: "not_meaningful", value: null, warnings: ["EPS negatif pada data contoh."] })
    : metric),
});
