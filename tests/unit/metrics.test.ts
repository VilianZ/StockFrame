import { describe, expect, test } from "vitest";

import { MARKET_SNAPSHOT_VERSION, type MarketSnapshot } from "../../lib/domain";
import { calculateMetrics } from "../../lib/metrics";

function period(periodEnd: string, values: Record<string, number | null>, evidenceId: string, periodType: "quarterly" | "annual" = "quarterly") {
  return { periodEnd, periodType, currency: "USD", values, evidenceId };
}

function snapshot(overrides: Partial<MarketSnapshot> = {}): MarketSnapshot {
  const income = ["2026-06-30", "2026-03-31", "2025-12-31", "2025-09-30"].map((date, index) => period(date, {
    totalRevenue: 100, grossProfit: 60, operatingIncome: 20, netIncome: 10, dilutedEPS: 2, dilutedAverageShares: 10, ebit: 20, incomeBeforeTax: 20, incomeTaxExpense: 4,
  }, `income-${index}`));
  const balanceSheet = [
    period("2026-06-30", { totalAssets: 1000, totalLiabilities: 400, totalShareholderEquity: 600, totalCurrentAssets: 200, totalCurrentLiabilities: 100, commonSharesOutstanding: 10 }, "balance-0"),
    period("2026-03-31", { totalAssets: 900, totalLiabilities: 350, totalShareholderEquity: 550, totalCurrentAssets: 180, totalCurrentLiabilities: 90, commonSharesOutstanding: 10 }, "balance-1"),
  ];
  const cashFlow = ["2026-06-30", "2026-03-31", "2025-12-31", "2025-09-30"].map((date, index) => period(date, { operatingCashflow: 30, capitalExpenditures: 10 }, `cash-${index}`));
  return {
    schemaVersion: MARKET_SNAPSHOT_VERSION,
    instrument: { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "USD", region: "United States" },
    asOf: "2026-08-05",
    currency: "USD",
    price: 200,
    facts: {},
    evidence: [...income, ...balanceSheet, ...cashFlow].map((row) => ({ id: row.evidenceId, source: "fixture", effectiveDate: row.periodEnd, valueReference: "fixture" })),
    prices: [{ date: "2026-08-05", close: 200, evidenceId: "price-0" }, { date: "2026-08-04", close: 180, evidenceId: "price-1" }, { date: "2026-08-01", close: 160, evidenceId: "price-2" }],
    financials: { income, balanceSheet, cashFlow },
    corporateActions: { status: "empty", events: [], warnings: [] },
    ...overrides,
  };
}

function byId(metrics: ReturnType<typeof calculateMetrics>, id: string) {
  return metrics.find((metric) => metric.id === id)!;
}

describe("pure financial metrics", () => {
  test("matches hand-calculated TTM and balance-sheet formulas", () => {
    const metrics = calculateMetrics(snapshot());
    expect(byId(metrics, "der").value).toBeCloseTo(400 / 600);
    expect(byId(metrics, "current_ratio").value).toBeCloseTo(2);
    expect(byId(metrics, "eps_ttm").value).toBeCloseTo(8);
    expect(byId(metrics, "pe").value).toBeCloseTo(25);
    expect(byId(metrics, "book_value_per_share").value).toBeCloseTo(60);
    expect(byId(metrics, "pbv").value).toBeCloseTo(200 / 60);
    expect(byId(metrics, "gross_margin").value).toBeCloseTo(0.6);
    expect(byId(metrics, "operating_margin").value).toBeCloseTo(0.2);
    expect(byId(metrics, "net_margin").value).toBeCloseTo(0.1);
    expect(byId(metrics, "free_cash_flow").value).toBeCloseTo(80);
    expect(byId(metrics, "fcf_margin").value).toBeCloseTo(0.2);
    expect(byId(metrics, "roa").value).toBeCloseTo(40 / 950);
    expect(byId(metrics, "roe").value).toBeCloseTo(40 / 575);
    expect(byId(metrics, "roic").value).toBeCloseTo(64 / 855);
    expect(byId(metrics, "roa").evidenceIds).toHaveLength(6);
    expect(byId(metrics, "roe").evidenceIds).toHaveLength(6);
    expect(byId(metrics, "price_return").value).toBeCloseTo(0.25);
    expect(metrics).toHaveLength(16);
    expect(JSON.stringify(metrics)).not.toMatch(/NaN|Infinity/);
  });

  test("uses explicit statuses for negative equity, negative EPS and zero denominators", () => {
    const invalid = snapshot({
      financials: {
        ...snapshot().financials,
        income: snapshot().financials.income.map((row) => ({ ...row, values: { ...row.values, dilutedEPS: -2 } })),
        balanceSheet: snapshot().financials.balanceSheet.map((row) => ({ ...row, values: { ...row.values, totalShareholderEquity: -600, totalCurrentLiabilities: 0 } })),
      },
    });
    const metrics = calculateMetrics(invalid);
    expect(byId(metrics, "pe").status).toBe("not_meaningful");
    expect(byId(metrics, "der").status).toBe("not_meaningful");
    expect(byId(metrics, "pbv").status).toBe("not_meaningful");
    expect(byId(metrics, "current_ratio").status).toBe("not_meaningful");
  });

  test("does not silently zero partial TTM or insufficient price history", () => {
    const base = snapshot();
    const partial = snapshot({
      financials: { ...base.financials, income: base.financials.income.slice(0, 2), cashFlow: base.financials.cashFlow.slice(0, 2) },
      prices: [base.prices[0]],
    });
    const metrics = calculateMetrics(partial);
    expect(byId(metrics, "eps_ttm")).toMatchObject({ status: "not_available", value: null });
    expect(byId(metrics, "free_cash_flow")).toMatchObject({ status: "not_available", value: null });
    expect(byId(metrics, "price_return")).toMatchObject({ status: "not_available", value: null });
  });

  test("does not mark PBV available when price is missing", () => {
    const metrics = calculateMetrics(snapshot({ price: null }));
    expect(byId(metrics, "pbv")).toMatchObject({ status: "not_available", value: null });
    expect(byId(metrics, "pbv").warnings).toContain("Harga efektif tidak tersedia");
  });

  test("rejects all metric calculations when statement currencies differ", () => {
    const base = snapshot();
    const mismatched = snapshot({
      financials: {
        ...base.financials,
        income: base.financials.income.map((row) => ({ ...row, currency: "EUR" })),
      },
    });
    const metrics = calculateMetrics(mismatched);
    expect(metrics).toHaveLength(16);
    expect(metrics.every((metric) => metric.status === "not_available" && metric.value === null)).toBe(true);
    expect(metrics.every((metric) => metric.warnings[0].includes("Currency mismatch"))).toBe(true);
  });

  test("rejects four quarterly values when the periods are not consecutive", () => {
    const base = snapshot();
    const nonConsecutive = snapshot({
      financials: {
        ...base.financials,
        income: base.financials.income.map((row, index) =>
          index === 2 ? { ...row, periodEnd: "2025-06-30" } : index === 3 ? { ...row, periodEnd: "2025-03-31" } : row,
        ),
      },
    });
    const metrics = calculateMetrics(nonConsecutive);
    expect(byId(metrics, "eps_ttm")).toMatchObject({ status: "not_available", value: null });
    expect(byId(metrics, "eps_ttm").warnings[0]).toContain("partial_ttm");
  });

  test("warns price metrics when a split exists without adjusted-price verification", () => {
    const metrics = calculateMetrics(snapshot({
      corporateActions: {
        status: "available",
        events: [{
          date: "2026-06-15",
          ticker: "AAPL",
          kind: "split",
          rawAction: "split",
          value: 4,
          relatedTicker: null,
          relatedName: null,
          notes: null,
          evidenceId: "corporate-action-1",
        }],
        warnings: [],
      },
    }));
    expect(byId(metrics, "price_return").warnings).toContain("Corporate action split terdeteksi; status adjusted-price belum terverifikasi");
    expect(byId(metrics, "volatility").warnings).toContain("Corporate action split terdeteksi; status adjusted-price belum terverifikasi");
  });
});
