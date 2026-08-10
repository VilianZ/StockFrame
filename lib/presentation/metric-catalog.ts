import { METRIC_IDS, type MetricId } from "../ai/metric-policy";

export type { MetricId } from "../ai/metric-policy";

export type PresentationMetricGroup =
  | "financial_health"
  | "profitability"
  | "valuation"
  | "cash_flow_capital_return"
  | "market_performance_risk";

export const PRESENTATION_METRIC_GROUPS: readonly PresentationMetricGroup[] = [
  "financial_health",
  "profitability",
  "valuation",
  "cash_flow_capital_return",
  "market_performance_risk",
];

export type MetricDisplayKind = "percentage" | "multiple" | "currency" | "currency_per_share";

export interface MetricCatalogEntry {
  id: MetricId;
  label: string;
  shortLabel: string;
  group: PresentationMetricGroup;
  groupLabel: string;
  description: string;
  displayKind: MetricDisplayKind;
  defaultUnit: string;
}

export const METRIC_CATALOG = [
  { id: "der", label: "Debt to Equity Ratio", shortLabel: "DER", group: "financial_health", groupLabel: "Kesehatan finansial", description: "Perbandingan liabilitas terhadap ekuitas.", displayKind: "multiple", defaultUnit: "ratio" },
  { id: "current_ratio", label: "Rasio Lancar", shortLabel: "Current ratio", group: "financial_health", groupLabel: "Kesehatan finansial", description: "Kemampuan aset lancar menutup liabilitas lancar.", displayKind: "multiple", defaultUnit: "ratio" },
  { id: "roa", label: "Return on Assets", shortLabel: "ROA", group: "profitability", groupLabel: "Profitabilitas", description: "Laba terhadap rata-rata aset.", displayKind: "percentage", defaultUnit: "ratio" },
  { id: "roe", label: "Return on Equity", shortLabel: "ROE", group: "profitability", groupLabel: "Profitabilitas", description: "Laba terhadap rata-rata ekuitas.", displayKind: "percentage", defaultUnit: "ratio" },
  { id: "eps_ttm", label: "Earnings per Share TTM", shortLabel: "EPS TTM", group: "valuation", groupLabel: "Valuasi", description: "Laba per saham berdasarkan empat kuartal terbaru yang berurutan.", displayKind: "currency_per_share", defaultUnit: "currency_per_share" },
  { id: "pe", label: "Price to Earnings", shortLabel: "P/E", group: "valuation", groupLabel: "Valuasi", description: "Harga terhadap EPS TTM.", displayKind: "multiple", defaultUnit: "ratio" },
  { id: "book_value_per_share", label: "Book Value per Share", shortLabel: "BVPS", group: "valuation", groupLabel: "Valuasi", description: "Ekuitas per saham.", displayKind: "currency_per_share", defaultUnit: "currency_per_share" },
  { id: "pbv", label: "Price to Book Value", shortLabel: "PBV", group: "valuation", groupLabel: "Valuasi", description: "Harga terhadap book value per share.", displayKind: "multiple", defaultUnit: "ratio" },
  { id: "gross_margin", label: "Margin Laba Kotor", shortLabel: "Gross margin", group: "profitability", groupLabel: "Profitabilitas", description: "Laba kotor terhadap pendapatan TTM.", displayKind: "percentage", defaultUnit: "ratio" },
  { id: "operating_margin", label: "Margin Operasi", shortLabel: "Operating margin", group: "profitability", groupLabel: "Profitabilitas", description: "Laba operasi terhadap pendapatan TTM.", displayKind: "percentage", defaultUnit: "ratio" },
  { id: "net_margin", label: "Margin Bersih", shortLabel: "Net margin", group: "profitability", groupLabel: "Profitabilitas", description: "Laba bersih terhadap pendapatan TTM.", displayKind: "percentage", defaultUnit: "ratio" },
  { id: "free_cash_flow", label: "Arus Kas Bebas", shortLabel: "FCF", group: "cash_flow_capital_return", groupLabel: "Arus kas & return modal", description: "Arus kas operasi setelah belanja modal TTM.", displayKind: "currency", defaultUnit: "currency" },
  { id: "fcf_margin", label: "Margin Arus Kas Bebas", shortLabel: "FCF margin", group: "cash_flow_capital_return", groupLabel: "Arus kas & return modal", description: "Arus kas bebas terhadap pendapatan TTM.", displayKind: "percentage", defaultUnit: "ratio" },
  { id: "roic", label: "Return on Invested Capital", shortLabel: "ROIC", group: "cash_flow_capital_return", groupLabel: "Arus kas & return modal", description: "NOPAT terhadap rata-rata operating invested capital.", displayKind: "percentage", defaultUnit: "ratio" },
  { id: "price_return", label: "Imbal Hasil Harga", shortLabel: "Price return", group: "market_performance_risk", groupLabel: "Performa & risiko pasar", description: "Perubahan harga penutupan dalam rentang historis yang tersedia.", displayKind: "percentage", defaultUnit: "ratio" },
  { id: "volatility", label: "Volatilitas Harga", shortLabel: "Volatilitas", group: "market_performance_risk", groupLabel: "Performa & risiko pasar", description: "Volatilitas tahunan dari return harga harian yang tersedia.", displayKind: "percentage", defaultUnit: "ratio" },
] as const satisfies readonly MetricCatalogEntry[];

const catalogById = Object.fromEntries(METRIC_CATALOG.map((entry) => [entry.id, entry])) as Record<MetricId, MetricCatalogEntry>;

export function getMetricCatalogEntry(id: string): MetricCatalogEntry | undefined {
  return (METRIC_IDS as readonly string[]).includes(id) ? catalogById[id as MetricId] : undefined;
}

export function getMetricGroupEntries(group: PresentationMetricGroup): readonly MetricCatalogEntry[] {
  return METRIC_CATALOG.filter((entry) => entry.group === group);
}

export function getMetricGroups(): readonly PresentationMetricGroup[] {
  return PRESENTATION_METRIC_GROUPS;
}
