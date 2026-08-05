import { describe, expect, test } from "vitest";

import { MarketSnapshotSchema, MARKET_SNAPSHOT_VERSION } from "../../lib/domain";
import { calculateMetrics } from "../../lib/metrics";
import { assessDataQuality } from "../../lib/quality";

function snapshot() {
  const incomeDates = ["2026-06-30", "2026-03-31", "2025-12-31", "2025-09-30"];
  const income = incomeDates.map((periodEnd, index) => ({ periodEnd, periodType: "quarterly" as const, currency: "USD", values: { totalRevenue: 100, grossProfit: 60, operatingIncome: 20, netIncome: 10, dilutedEPS: 2, dilutedAverageShares: 10, ebit: 20, incomeBeforeTax: 20, incomeTaxExpense: 4 }, evidenceId: `income-${index}` }));
  const balanceSheet = [
    { periodEnd: "2026-06-30", periodType: "quarterly" as const, currency: "USD", values: { totalAssets: 100, totalLiabilities: 40, totalShareholderEquity: 60, totalCurrentAssets: 20, totalCurrentLiabilities: 10, commonSharesOutstanding: 10 }, evidenceId: "balance-0" },
    { periodEnd: "2026-03-31", periodType: "quarterly" as const, currency: "USD", values: { totalAssets: 90, totalLiabilities: 35, totalShareholderEquity: 55, totalCurrentAssets: 18, totalCurrentLiabilities: 9, commonSharesOutstanding: 10 }, evidenceId: "balance-1" },
  ];
  const cashFlow = incomeDates.map((periodEnd, index) => ({ periodEnd, periodType: "quarterly" as const, currency: "USD", values: { operatingCashflow: 10, capitalExpenditures: 2 }, evidenceId: `cash-${index}` }));
  const financialRows = [...income, ...balanceSheet, ...cashFlow];
  return MarketSnapshotSchema.parse({
    schemaVersion: MARKET_SNAPSHOT_VERSION,
    instrument: { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "USD", region: "United States" },
    asOf: "2026-08-05", currency: "USD", price: 200, facts: { revenue: 100 },
    evidence: [{ id: "e1", source: "fixture", effectiveDate: "2026-08-05", valueReference: "quote.close" }, ...financialRows.map((row) => ({ id: row.evidenceId, source: "fixture", effectiveDate: row.periodEnd, valueReference: "fixture" }))],
    prices: [{ date: "2026-08-05", close: 200, evidenceId: "e1" }],
    financials: {
      income,
      balanceSheet,
      cashFlow,
    },
  });
}

describe("data quality gate", () => {
  test("is deterministic at sufficient, degraded and insufficient boundaries", () => {
    const complete = snapshot();
    const completeMetrics = calculateMetrics(complete);
    const sufficient = assessDataQuality(complete, completeMetrics);
    expect(sufficient).toMatchObject({ score: 100, decision: "sufficient", aiEligible: true, flags: [] });

    const degraded = assessDataQuality(complete, completeMetrics.map((metric) => metric.id === "eps_ttm" ? { ...metric, warnings: ["partial_ttm"] } : metric));
    expect(degraded).toMatchObject({ score: 90, decision: "degraded", aiEligible: true, flags: ["partial_ttm"] });

    const insufficient = assessDataQuality({ ...complete, price: null, prices: [], financials: { income: complete.financials.income.slice(0, 1), balanceSheet: complete.financials.balanceSheet.slice(0, 1), cashFlow: [] } }, []);
    expect(insufficient).toMatchObject({ score: 35, decision: "insufficient", aiEligible: false });
    expect(insufficient.flags).toEqual(["missing_market_data", "missing_financial_data"]);
  });

  test("detects currency mismatch and stale snapshots", () => {
    const base = snapshot();
    const mismatched = { ...base, financials: { ...base.financials, income: base.financials.income.map((row) => ({ ...row, currency: "EUR" })) } };
    const quality = assessDataQuality(mismatched, calculateMetrics(mismatched), { referenceDate: "2026-08-20" });
    expect(quality.flags).toContain("currency_mismatch");
    expect(quality.flags).toContain("stale_data");
    expect(quality.decision).toBe("insufficient");
  });

  test("quality can consume real metric output without AI calls", () => {
    const quality = assessDataQuality(snapshot(), calculateMetrics(snapshot()));
    expect(quality.decision).toBe("sufficient");
  });
});
