import { sufficientAnalyzeFixture } from "./analyze-success";

export const profitabilityChartEligibleFixture = sufficientAnalyzeFixture.metrics.filter((metric) => ["roa", "roe", "net_margin"].includes(metric.id));
export const profitabilityChartIneligibleFixture = profitabilityChartEligibleFixture.slice(0, 2);
export const capitalStructureEligibleFixture = sufficientAnalyzeFixture.snapshot;
export const capitalStructureFallbackFixture = {
  ...sufficientAnalyzeFixture.snapshot,
  financials: {
    ...sufficientAnalyzeFixture.snapshot.financials,
    balanceSheet: [{ ...sufficientAnalyzeFixture.snapshot.financials.balanceSheet[0]!, values: { totalLiabilities: null, totalShareholderEquity: null } }],
  },
};
