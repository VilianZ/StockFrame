import { describe, expect, test } from "vitest";

import {
  AnalyzeErrorResponseSchema,
  AnalyzeResponseSchema,
  MetricSchema,
} from "../../lib/domain";
import { METRIC_IDS } from "../../lib/ai/metric-policy";
import {
  analyzeErrorFixtures,
  capitalStructureEligibleFixture,
  capitalStructureFallbackFixture,
  corporateActionsEmptyFixture,
  corporateActionsUnavailableFixture,
  degradedAnalyzeFixture,
  notMeaningfulMetricFixture,
  profitabilityChartEligibleFixture,
  profitabilityChartIneligibleFixture,
  sufficientAnalyzeFixture,
  unavailableMetricFixture,
} from "../../lib/fixtures";
import {
  CORPORATE_ACTION_KIND_LABELS,
  ERROR_COPY,
  METRIC_CATALOG,
  QUALITY_FLAG_LABELS,
  RATING_LABELS,
  RISK_PROFILE_LABELS,
  decideCapitalStructure,
  decideMetricVisualization,
  decideProfitabilityBars,
  decideSharedMetricAxis,
  formatMetricValue,
  getMetricGroupEntries,
  getMetricGroups,
  presentAnalyzeError,
  presentCorporateActions,
  presentHistoricalPrices,
  presentQuality,
  sortHistoricalPrices,
} from "../../lib/presentation";

describe("F0 presentation contracts", () => {
  test("registers every metric ID exactly once", () => {
    const catalogIds = METRIC_CATALOG.map((entry) => entry.id);
    expect(catalogIds).toHaveLength(16);
    expect(new Set(catalogIds).size).toBe(catalogIds.length);
    expect([...catalogIds].sort()).toEqual([...METRIC_IDS].sort());
  });

  test("groups metrics deterministically by presentation purpose", () => {
    expect(getMetricGroups()).toEqual([
      "financial_health",
      "profitability",
      "valuation",
      "cash_flow_capital_return",
      "market_performance_risk",
    ]);
    expect(getMetricGroupEntries("financial_health").map((entry) => entry.id)).toEqual([
      "der", "current_ratio",
    ]);
    expect(getMetricGroupEntries("profitability").map((entry) => entry.id)).toEqual([
      "roa", "roe", "gross_margin", "operating_margin", "net_margin",
    ]);
    expect(getMetricGroupEntries("valuation").map((entry) => entry.id)).toEqual([
      "eps_ttm", "pe", "book_value_per_share", "pbv",
    ]);
    expect(getMetricGroupEntries("cash_flow_capital_return").map((entry) => entry.id)).toEqual([
      "free_cash_flow", "fcf_margin", "roic",
    ]);
    expect(getMetricGroupEntries("market_performance_risk").map((entry) => entry.id)).toEqual([
      "price_return", "volatility",
    ]);
    expect(METRIC_CATALOG.every((entry) => entry.groupLabel.length > 0 && entry.description.length > 0)).toBe(true);
  });

  test("formats metric units and availability states in Bahasa Indonesia", () => {
    const roe = sufficientAnalyzeFixture.metrics.find((metric) => metric.id === "roe")!;
    const der = sufficientAnalyzeFixture.metrics.find((metric) => metric.id === "der")!;
    const fcf = sufficientAnalyzeFixture.metrics.find((metric) => metric.id === "free_cash_flow")!;
    expect(formatMetricValue(roe).value).toBe("28%");
    expect(formatMetricValue(der).value).toBe("0,72×");
    expect(formatMetricValue(fcf).value).toBe("USD 136.680.000.000");
    expect(formatMetricValue({ ...roe, status: "not_available", value: null }).value).toBe("Tidak tersedia");
    expect(formatMetricValue({ ...roe, status: "not_meaningful", value: null }).value).toBe("Tidak bermakna");
  });

  test("presents quality decisions and all quality flags", () => {
    const presentation = presentQuality({
      ...degradedAnalyzeFixture.quality,
      flags: Object.keys(QUALITY_FLAG_LABELS) as Array<keyof typeof QUALITY_FLAG_LABELS>,
    });
    expect(presentation.label).toBe("Data terbatas");
    expect(presentation.scoreLabel).toBe("Skor kualitas 68/100");
    expect(presentation.flags).toHaveLength(Object.keys(QUALITY_FLAG_LABELS).length);
  });

  test("maps every API error code to copy and recovery behavior", () => {
    const codes = Object.keys(analyzeErrorFixtures) as Array<keyof typeof ERROR_COPY>;
    expect(codes).toHaveLength(14);
    for (const code of codes) {
      expect(ERROR_COPY[code].title.length).toBeGreaterThan(0);
      expect(ERROR_COPY[code].explanation.length).toBeGreaterThan(0);
      expect(ERROR_COPY[code].recoveryAction.length).toBeGreaterThan(0);
      expect(presentAnalyzeError(analyzeErrorFixtures[code]).code).toBe(code);
    }
    expect(presentAnalyzeError(analyzeErrorFixtures.AMBIGUOUS_INSTRUMENT).candidates).toHaveLength(2);
  });

  test("maps risk profiles and ratings without changing report data", () => {
    expect(RISK_PROFILE_LABELS).toEqual({ conservative: "Konservatif", moderate: "Moderat", aggressive: "Agresif" });
    expect(RATING_LABELS).toEqual({ positive: "Positif", neutral: "Netral", negative: "Negatif" });
  });

  test("maps corporate-action kinds and all enrichment states", () => {
    expect(Object.keys(CORPORATE_ACTION_KIND_LABELS)).toHaveLength(10);
    expect(presentCorporateActions(sufficientAnalyzeFixture.snapshot.corporateActions).status.label).toBe("Peristiwa tersedia");
    expect(presentCorporateActions(corporateActionsEmptyFixture.snapshot.corporateActions).status.label).toBe("Tidak ada peristiwa");
    expect(presentCorporateActions(corporateActionsUnavailableFixture.snapshot.corporateActions).status.label).toBe("Peristiwa tidak tersedia");
    expect(presentCorporateActions(sufficientAnalyzeFixture.snapshot.corporateActions).events[0]?.kindLabel).toBe("Dividen");
  });

  test("sorts historical prices without mutating the response and excludes future points", () => {
    const prices = [...sufficientAnalyzeFixture.snapshot.prices].reverse();
    const originalOrder = prices.map((point) => point.date);
    const sorted = sortHistoricalPrices(prices);
    const presentation = presentHistoricalPrices(prices, sufficientAnalyzeFixture.metrics.find((metric) => metric.id === "price_return"), "USD", "2026-02-05");
    expect(prices.map((point) => point.date)).toEqual(originalOrder);
    expect(sorted.map((point) => point.date)).toEqual(["2025-08-05", "2026-02-05", "2026-08-05"]);
    expect(presentation.points.map((point) => point.date)).toEqual(["2025-08-05", "2026-02-05"]);
    expect(presentation.state).toBe("available");
    expect(presentation.textEquivalent).toContain("harga awal USD 182");
    expect(presentation.textEquivalent).toContain("harga terbaru USD 205");
  });

  test("allows only compatible profitability bars and rejects mixed-unit axes", () => {
    expect(decideProfitabilityBars(profitabilityChartEligibleFixture).eligible).toBe(true);
    expect(decideProfitabilityBars(profitabilityChartIneligibleFixture).kind).toBe("scalar");
    const mixedUnit = [
      ...profitabilityChartEligibleFixture.slice(0, 2),
      MetricSchema.parse({ ...sufficientAnalyzeFixture.metrics.find((metric) => metric.id === "net_margin"), unit: "currency" }),
    ];
    expect(decideSharedMetricAxis(mixedUnit).eligible).toBe(false);
    expect(decideMetricVisualization(sufficientAnalyzeFixture.metrics.find((metric) => metric.id === "pe")!).kind).toBe("scalar");
    expect(decideMetricVisualization(sufficientAnalyzeFixture.metrics.find((metric) => metric.id === "free_cash_flow")!).kind).toBe("scalar");
  });

  test("uses capital-structure chart only with valid debt and equity inputs", () => {
    const eligible = decideCapitalStructure(capitalStructureEligibleFixture);
    const fallback = decideCapitalStructure(capitalStructureFallbackFixture);
    expect(eligible).toMatchObject({ kind: "capital_structure", eligible: true, inputs: [{ id: "debt" }, { id: "equity" }] });
    expect(fallback).toMatchObject({ kind: "scalar_fallback", eligible: false, inputs: [] });
    const currencyMismatch = {
      ...capitalStructureEligibleFixture,
      financials: {
        ...capitalStructureEligibleFixture.financials,
        balanceSheet: [{ ...capitalStructureEligibleFixture.financials.balanceSheet[0]!, currency: "EUR" }],
      },
    };
    expect(decideCapitalStructure(currencyMismatch)).toMatchObject({ kind: "scalar_fallback", eligible: false, inputs: [] });
  });

  test("keeps empty corporate-action fixture states coherent", () => {
    expect(degradedAnalyzeFixture.snapshot.corporateActions).toMatchObject({ status: "empty", events: [] });
    expect(degradedAnalyzeFixture.report.corporateActionClaims).toEqual([]);
    expect(degradedAnalyzeFixture.snapshot.evidence.some((evidence) => evidence.source === "fixture-corporate-action")).toBe(false);
    expect(corporateActionsEmptyFixture.snapshot.evidence.some((evidence) => evidence.source === "fixture-corporate-action")).toBe(false);
  });

  test("parses every success and error fixture using production schemas", () => {
    const successes = [sufficientAnalyzeFixture, degradedAnalyzeFixture, corporateActionsEmptyFixture, corporateActionsUnavailableFixture, unavailableMetricFixture, notMeaningfulMetricFixture];
    for (const fixture of successes) expect(AnalyzeResponseSchema.parse(fixture)).toEqual(fixture);
    for (const fixture of Object.values(analyzeErrorFixtures)) expect(AnalyzeErrorResponseSchema.parse(fixture)).toEqual(fixture);
    expect(unavailableMetricFixture.metrics.find((metric) => metric.id === "free_cash_flow")?.status).toBe("not_available");
    expect(notMeaningfulMetricFixture.metrics.find((metric) => metric.id === "pe")?.status).toBe("not_meaningful");
  });
});
