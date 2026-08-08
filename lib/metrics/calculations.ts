import {
  MetricSchema,
  type FinancialPeriod,
  type MarketSnapshot,
  type Metric,
} from "../domain";

const SQRT_252 = Math.sqrt(252);

type PeriodField = string;

function uniqueEvidence(...ids: string[][]): string[] {
  return [...new Set(ids.flat())].sort();
}

function available(
  id: string,
  value: number,
  unit: string,
  formulaId: string,
  warnings: string[],
  evidenceIds: string[],
): Metric {
  if (!Number.isFinite(value)) {
    return notAvailable(id, unit, formulaId, ["Perhitungan menghasilkan nilai non-finite"], evidenceIds);
  }
  return MetricSchema.parse({ id, value, unit, formulaId, status: "available", warnings, evidenceIds });
}

function notAvailable(
  id: string,
  unit: string,
  formulaId: string,
  warnings: string[],
  evidenceIds: string[] = [],
): Metric {
  return MetricSchema.parse({ id, value: null, unit, formulaId, status: "not_available", warnings, evidenceIds });
}

function notMeaningful(
  id: string,
  unit: string,
  formulaId: string,
  warning: string,
  evidenceIds: string[] = [],
): Metric {
  return MetricSchema.parse({ id, value: null, unit, formulaId, status: "not_meaningful", warnings: [warning], evidenceIds });
}

function validValues(rows: FinancialPeriod[], field: PeriodField): FinancialPeriod[] {
  return rows.filter((row) => row.values[field] !== null && row.values[field] !== undefined);
}

function value(row: FinancialPeriod | undefined, field: PeriodField): number | null {
  const candidate = row?.values[field];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
}

function latest(rows: FinancialPeriod[], field: PeriodField): { rows: FinancialPeriod[]; value: number | null } {
  const row = validValues(rows, field)[0];
  return { rows: row ? [row] : [], value: value(row, field) };
}

function averageLatestTwo(rows: FinancialPeriod[], field: PeriodField): { rows: FinancialPeriod[]; value: number | null } {
  const selected = validValues(rows, field).slice(0, 2);
  if (selected.length < 2) return { rows: selected, value: null };
  return {
    rows: selected,
    value: (value(selected[0], field)! + value(selected[1], field)!) / 2,
  };
}

function quarterIndex(periodEnd: string): number {
  const date = new Date(`${periodEnd}T00:00:00Z`);
  return date.getUTCFullYear() * 4 + Math.floor(date.getUTCMonth() / 3);
}

function ttm(rows: FinancialPeriod[], field: PeriodField): { rows: FinancialPeriod[]; value: number | null; partial: boolean } {
  const selected = rows.filter((row) => row.periodType === "quarterly" && value(row, field) !== null).slice(0, 4);
  const contiguous = selected.every((row, index) => index === 0 || quarterIndex(selected[index - 1].periodEnd) - quarterIndex(row.periodEnd) === 1);
  if (selected.length < 4 || !contiguous) return { rows: selected, value: null, partial: selected.length > 0 };
  return { rows: selected, value: selected.reduce((sum, row) => sum + value(row, field)!, 0), partial: false };
}

function ttmWarning(partial: boolean): string[] {
  return [partial ? "partial_ttm: empat periode kuartal valid belum tersedia" : "TTM membutuhkan empat periode kuartal valid"];
}

function ratioMetric(
  id: string,
  numerator: { value: number | null; rows: FinancialPeriod[] },
  denominator: { value: number | null; rows: FinancialPeriod[] },
  unit: string,
  formulaId: string,
  warning: string,
  negativeDenominatorWarning?: string,
): Metric {
  const evidenceIds = uniqueEvidence(
    numerator.rows.map((row) => row.evidenceId),
    denominator.rows.map((row) => row.evidenceId),
  );
  if (numerator.value === null || denominator.value === null) {
    return notAvailable(id, unit, formulaId, [warning], evidenceIds);
  }
  if (denominator.value === 0) return notMeaningful(id, unit, formulaId, "Denominator bernilai nol", evidenceIds);
  if (denominator.value < 0 && negativeDenominatorWarning) {
    return notMeaningful(id, unit, formulaId, negativeDenominatorWarning, evidenceIds);
  }
  return available(id, numerator.value / denominator.value, unit, formulaId, [], evidenceIds);
}

const METRIC_CONTRACTS = [
  ["der", "ratio", "der-v1"],
  ["current_ratio", "ratio", "current-ratio-v1"],
  ["roa", "ratio", "roa-ttm-average-assets-v1"],
  ["roe", "ratio", "roe-ttm-average-equity-v1"],
  ["eps_ttm", "currency_per_share", "eps-ttm-v1"],
  ["pe", "ratio", "pe-ttm-v1"],
  ["book_value_per_share", "currency_per_share", "book-value-per-share-v1"],
  ["pbv", "ratio", "pbv-v1"],
  ["gross_margin", "ratio", "gross-margin-ttm-v1"],
  ["operating_margin", "ratio", "operating-margin-ttm-v1"],
  ["net_margin", "ratio", "net-margin-ttm-v1"],
  ["free_cash_flow", "currency", "fcf-ttm-v1"],
  ["fcf_margin", "ratio", "fcf-margin-ttm-v1"],
  ["roic", "ratio", "roic-ttm-average-operating-invested-capital-v2"],
  ["price_return", "ratio", "price-return-v1"],
  ["volatility", "ratio", "volatility-annualized-v1"],
] as const;

function currencyMismatch(snapshot: MarketSnapshot): boolean {
  return [
    ...snapshot.financials.income,
    ...snapshot.financials.balanceSheet,
    ...snapshot.financials.cashFlow,
  ].some((row) => row.currency !== null && row.currency !== snapshot.currency);
}

export function calculateMetrics(snapshot: MarketSnapshot): Metric[] {
  if (currencyMismatch(snapshot)) {
    return METRIC_CONTRACTS.map(([id, unit, formulaId]) =>
      notAvailable(id, unit, formulaId, ["Currency mismatch: kalkulasi ditolak karena laporan tidak sejenis"]),
    );
  }
  const income = snapshot.financials.income;
  const balance = snapshot.financials.balanceSheet;
  const cashFlow = snapshot.financials.cashFlow;
  const priceEvidence = snapshot.prices.map((point) => point.evidenceId);

  const revenue = ttm(income, "totalRevenue");
  const grossProfit = ttm(income, "grossProfit");
  const operatingIncome = ttm(income, "operatingIncome");
  const netIncome = ttm(income, "netIncome");
  const eps = ttm(income, "dilutedEPS");
  const operatingCashflow = ttm(cashFlow, "operatingCashflow");
  const capex = ttm(cashFlow, "capitalExpenditures");
  const currentAssets = latest(balance, "totalCurrentAssets");
  const currentLiabilities = latest(balance, "totalCurrentLiabilities");
  const liabilities = latest(balance, "totalLiabilities");
  const equity = latest(balance, "totalShareholderEquity");
  const assetsAverage = averageLatestTwo(balance, "totalAssets");
  const equityAverage = averageLatestTwo(balance, "totalShareholderEquity");
  const shares = latest(income, "dilutedAverageShares").value === null
    ? latest(balance, "commonSharesOutstanding")
    : latest(income, "dilutedAverageShares");
  const bvps = equity.value !== null && equity.value < 0
    ? notMeaningful("book_value_per_share", "currency_per_share", "book-value-per-share-v1", "Ekuitas negatif membuat book value per share tidak bermakna", equity.rows.map((row) => row.evidenceId))
    : ratioMetric(
        "book_value_per_share",
        equity,
        shares,
        "currency_per_share",
        "book-value-per-share-v1",
        "Ekuitas atau diluted shares belum tersedia",
      );

  const der = ratioMetric(
    "der",
    liabilities,
    equity,
    "ratio",
    "der-v1",
    "Liabilitas atau ekuitas terbaru belum tersedia",
    "Ekuitas negatif membuat DER tidak bermakna",
  );
  const currentRatio = ratioMetric(
    "current_ratio",
    currentAssets,
    currentLiabilities,
    "ratio",
    "current-ratio-v1",
    "Aset lancar atau liabilitas lancar terbaru belum tersedia",
  );
  const roa = ratioMetric(
    "roa",
    { value: netIncome.value, rows: netIncome.rows },
    assetsAverage,
    "ratio",
    "roa-ttm-average-assets-v1",
    "TTM net income atau rata-rata aset belum tersedia",
  );
  const roe = ratioMetric(
    "roe",
    { value: netIncome.value, rows: netIncome.rows },
    equityAverage,
    "ratio",
    "roe-ttm-average-equity-v1",
    "TTM net income atau rata-rata ekuitas belum tersedia",
    "Ekuitas negatif membuat ROE tidak bermakna",
  );

  const peEvidence = uniqueEvidence(eps.rows.map((row) => row.evidenceId), priceEvidence);
  const pe = eps.value === null || snapshot.price === null
    ? notAvailable("pe", "ratio", "pe-ttm-v1", ttmWarning(eps.partial).concat(snapshot.price === null ? ["Harga efektif tidak tersedia"] : []), peEvidence)
    : eps.value < 0
      ? notMeaningful("pe", "ratio", "pe-ttm-v1", "EPS TTM negatif membuat P/E tidak bermakna", peEvidence)
      : eps.value === 0
        ? notMeaningful("pe", "ratio", "pe-ttm-v1", "EPS TTM bernilai nol", peEvidence)
        : available("pe", snapshot.price / eps.value, "ratio", "pe-ttm-v1", eps.partial ? ["partial_ttm"] : [], peEvidence);

  const pbvEvidence = uniqueEvidence(bvps.evidenceIds, priceEvidence);
  const pbv = snapshot.price === null
    ? notAvailable("pbv", "ratio", "pbv-v1", ["Harga efektif tidak tersedia"], bvps.evidenceIds)
    : bvps.status !== "available"
      ? MetricSchema.parse({ ...bvps, id: "pbv", unit: "ratio", formulaId: "pbv-v1", evidenceIds: pbvEvidence })
    : available("pbv", snapshot.price / bvps.value, "ratio", "pbv-v1", [], pbvEvidence);

  const margin = (id: string, numerator: typeof revenue, formulaId: string): Metric => {
    const evidenceIds = uniqueEvidence(numerator.rows.map((row) => row.evidenceId), revenue.rows.map((row) => row.evidenceId));
    if (revenue.value === null || numerator.value === null) return notAvailable(id, "ratio", formulaId, ttmWarning(numerator.partial || revenue.partial), evidenceIds);
    if (revenue.value === 0) return notMeaningful(id, "ratio", formulaId, "Pendapatan TTM bernilai nol", evidenceIds);
    return available(id, numerator.value / revenue.value, "ratio", formulaId, numerator.partial || revenue.partial ? ["partial_ttm"] : [], evidenceIds);
  };

  const fcfEvidence = uniqueEvidence(operatingCashflow.rows.map((row) => row.evidenceId), capex.rows.map((row) => row.evidenceId));
  const fcf = operatingCashflow.value === null || capex.value === null
    ? notAvailable("free_cash_flow", "currency", "fcf-ttm-v1", ttmWarning(operatingCashflow.partial || capex.partial), fcfEvidence)
    : available("free_cash_flow", operatingCashflow.value - capex.value, "currency", "fcf-ttm-v1", operatingCashflow.partial || capex.partial ? ["partial_ttm"] : [], fcfEvidence);
  const fcfMargin = fcf.status !== "available"
    ? MetricSchema.parse({ ...fcf, id: "fcf_margin", unit: "ratio", formulaId: "fcf-margin-ttm-v1", evidenceIds: uniqueEvidence(fcf.evidenceIds, revenue.rows.map((row) => row.evidenceId)) })
    : revenue.value === null
      ? notAvailable("fcf_margin", "ratio", "fcf-margin-ttm-v1", ttmWarning(revenue.partial), uniqueEvidence(fcf.evidenceIds, revenue.rows.map((row) => row.evidenceId)))
      : revenue.value === 0
        ? notMeaningful("fcf_margin", "ratio", "fcf-margin-ttm-v1", "Pendapatan TTM bernilai nol", uniqueEvidence(fcf.evidenceIds, revenue.rows.map((row) => row.evidenceId)))
        : available("fcf_margin", fcf.value / revenue.value, "ratio", "fcf-margin-ttm-v1", [], uniqueEvidence(fcf.evidenceIds, revenue.rows.map((row) => row.evidenceId)));

  const ebit = ttm(income, "ebit");
  const taxExpense = ttm(income, "incomeTaxExpense");
  const pretax = ttm(income, "incomeBeforeTax");
  const investedCapitalRows = balance.filter((row) => value(row, "totalAssets") !== null && value(row, "totalCurrentLiabilities") !== null).slice(0, 2);
  const investedCapital = investedCapitalRows.length === 2
    ? investedCapitalRows.map((row) => value(row, "totalAssets")! - value(row, "totalCurrentLiabilities")!).reduce((sum, current) => sum + current, 0) / 2
    : null;
  const roicEvidence = uniqueEvidence(ebit.rows.map((row) => row.evidenceId), taxExpense.rows.map((row) => row.evidenceId), pretax.rows.map((row) => row.evidenceId), investedCapitalRows.map((row) => row.evidenceId));
  const roic = ebit.value === null || taxExpense.value === null || pretax.value === null || investedCapital === null
    ? notAvailable("roic", "ratio", "roic-ttm-average-operating-invested-capital-v2", ttmWarning(ebit.partial || taxExpense.partial || pretax.partial), roicEvidence)
    : pretax.value === 0
      ? notMeaningful("roic", "ratio", "roic-ttm-average-operating-invested-capital-v2", "Pretax income TTM bernilai nol", roicEvidence)
    : investedCapital <= 0
      ? notMeaningful("roic", "ratio", "roic-ttm-average-operating-invested-capital-v2", "Invested capital tidak positif", roicEvidence)
      : available("roic", (ebit.value * (1 - taxExpense.value / pretax.value)) / investedCapital, "ratio", "roic-ttm-average-operating-invested-capital-v2", [], roicEvidence);

  const prices = [...snapshot.prices].sort((left, right) => right.date.localeCompare(left.date));
  const splitWarning = snapshot.corporateActions.status === "available"
    && snapshot.corporateActions.events.some((event) => event.kind === "split")
    ? ["Corporate action split terdeteksi; status adjusted-price belum terverifikasi"]
    : [];
  const priceReturn = prices.length < 2
    ? notAvailable("price_return", "ratio", "price-return-v1", ["Minimal dua harga efektif diperlukan", ...splitWarning], priceEvidence)
    : available("price_return", prices[0].close / prices[prices.length - 1].close - 1, "ratio", "price-return-v1", splitWarning, prices.map((point) => point.evidenceId));
  const dailyReturns = prices.slice(0, -1).map((point, index) => point.close / prices[index + 1].close - 1).reverse();
  const mean = dailyReturns.length ? dailyReturns.reduce((sum, current) => sum + current, 0) / dailyReturns.length : null;
  const volatility = dailyReturns.length < 2 || mean === null
    ? notAvailable("volatility", "ratio", "volatility-annualized-v1", ["Minimal tiga harga efektif diperlukan untuk volatilitas", ...splitWarning], prices.map((point) => point.evidenceId))
    : available("volatility", Math.sqrt(dailyReturns.reduce((sum, current) => sum + (current - mean) ** 2, 0) / dailyReturns.length) * SQRT_252, "ratio", "volatility-annualized-v1", splitWarning, prices.map((point) => point.evidenceId));

  return [
    der,
    currentRatio,
    roa,
    roe,
    eps.value === null ? notAvailable("eps_ttm", "currency_per_share", "eps-ttm-v1", ttmWarning(eps.partial), eps.rows.map((row) => row.evidenceId)) : available("eps_ttm", eps.value, "currency_per_share", "eps-ttm-v1", [], eps.rows.map((row) => row.evidenceId)),
    pe,
    bvps,
    pbv,
    margin("gross_margin", grossProfit, "gross-margin-ttm-v1"),
    margin("operating_margin", operatingIncome, "operating-margin-ttm-v1"),
    margin("net_margin", netIncome, "net-margin-ttm-v1"),
    fcf,
    fcfMargin,
    roic,
    priceReturn,
    volatility,
  ];
}
