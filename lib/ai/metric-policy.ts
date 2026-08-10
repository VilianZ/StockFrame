import type { Metric } from "../domain";

export const METRIC_POLICY = {
  valuation: ["pe", "pbv", "book_value_per_share"],
  leverage: ["der"],
  liquidity: ["current_ratio"],
  earnings: ["eps_ttm"],
  profitability: ["roa", "roe", "roic", "gross_margin", "operating_margin", "net_margin"],
  cash_flow: ["free_cash_flow", "fcf_margin"],
  market_risk: ["volatility", "price_return"],
} as const;

export const METRIC_IDS = [
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
  "price_return",
  "volatility",
] as const;

export type MetricId = (typeof METRIC_IDS)[number];
export type MetricPolicyGroup = keyof typeof METRIC_POLICY;

const UNSUPPORTED_EXTERNAL_PATTERNS = [
  /\b(?:market saturation|saturasi pasar|market share|pangsa pasar)\b/i,
  /\b(?:innovation strategy|strategi inovasi|inovasi perusahaan|company strategy|strategi perusahaan)\b/i,
  /\b(?:macroeconomic|makroekonomi|consumer spending|belanja konsumen)\b/i,
  /\b(?:competition|kompetisi|regulation|regulasi|sentiment|sentimen|news|berita)\b/i,
];

export function validateMetricClaimPolicy(text: string, _metricIds: readonly string[]): string | undefined {
  void _metricIds;
  if (UNSUPPORTED_EXTERNAL_PATTERNS.some((pattern) => pattern.test(text))) {
    return "Claim contains external or unsupported information";
  }

  // Temporary compatibility mode: semantic wording is accepted when the
  // referenced IDs and numeric values pass the canonical validators.
  return undefined;
}

const NUMERIC_LITERAL_PATTERN = /(?<![A-Za-z])[-+]?(?:\d{1,3}(?:(?:[.,]\d{3})+)[.,]\d{1,2}|\d{1,3}(?:(?:[.,]\d{3})+)|\d+(?:[.,]\d+)?|\.\d+)\s*(?:%|thousand|million|billion|trillion|miliar|triliun|ribu|juta|bn|k|m|b|t)?(?!\d|[A-Za-z]|[.,]\d)/gi;
const ISO_DATE_PATTERN = /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g;
const SCALE_FACTORS: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  ribu: 1e3,
  m: 1e6,
  million: 1e6,
  juta: 1e6,
  b: 1e9,
  bn: 1e9,
  billion: 1e9,
  miliar: 1e9,
  t: 1e12,
  trillion: 1e12,
  triliun: 1e12,
};

function parseNumericLiteral(raw: string): { value: number; percent: boolean } | undefined {
  const suffix = raw.trim().match(/(?:%|[A-Za-z]+)$/i)?.[0].toLowerCase() ?? "";
  const percent = suffix === "%";
  const scale = SCALE_FACTORS[suffix] ?? 1;
  let normalized = raw.replace(/%|[A-Za-z]+/gi, "").replace(/\s/g, "");
  const separators = normalized.match(/[.,]/g) ?? [];
  const lastSeparator = Math.max(normalized.lastIndexOf("."), normalized.lastIndexOf(","));
  const fractionalDigits = lastSeparator >= 0 ? normalized.length - lastSeparator - 1 : 0;
  const mixedDecimal = separators.length > 1 && fractionalDigits >= 1 && fractionalDigits <= 2;
  const grouped = separators.length > 1 && separators.every((separator, index) => {
    const parts = normalized.split(/[.,]/);
    return index === 0 ? parts[0].length <= 3 : parts[index].length === 3;
  });
  if (mixedDecimal) {
    const integerPart = normalized.slice(0, lastSeparator).replace(/[.,]/g, "");
    const decimalPart = normalized.slice(lastSeparator + 1);
    normalized = `${integerPart}.${decimalPart}`;
  } else if (grouped) normalized = normalized.replace(/[.,]/g, "");
  else if (normalized.includes(",") && normalized.includes(".")) normalized = normalized.replace(/,/g, "");
  else normalized = normalized.replace(",", ".");
  const value = Number(normalized) * scale;
  return Number.isFinite(value) ? { value, percent } : undefined;
}

function numericMatchesMetric(observed: { value: number; percent: boolean }, metric: Metric): boolean {
  if (metric.status !== "available" || metric.value === null) return false;
  const expected = metric.unit === "ratio" && observed.percent ? metric.value * 100 : metric.value;
  const tolerance = observed.percent
    ? Math.max(0.5, Math.abs(expected) * 0.01)
    : Math.max(0.000001, Math.abs(expected) * 0.01);
  return Math.abs(observed.value - expected) <= tolerance;
}

export function validateMetricClaimNumbers(
  text: string,
  metricIds: readonly string[],
  metrics: readonly Metric[],
): string | undefined {
  const textWithoutDates = text.replace(ISO_DATE_PATTERN, " ");
  const literals = [...textWithoutDates.matchAll(NUMERIC_LITERAL_PATTERN)]
    .map((match) => parseNumericLiteral(match[0]))
    .filter((value): value is { value: number; percent: boolean } => value !== undefined);
  const yearLiterals = literals.filter((literal) => Number.isInteger(literal.value) && literal.value >= 1900 && literal.value <= 2100);
  const meaningfulLiterals = literals.filter((literal) => !yearLiterals.includes(literal));
  if (meaningfulLiterals.length === 0) return undefined;

  const citedMetrics = metrics.filter((metric) => metricIds.includes(metric.id) && metric.status === "available");
  if (meaningfulLiterals.some((literal) => !citedMetrics.some((metric) => numericMatchesMetric(literal, metric)))) {
    return "Claim contains a numeric value that does not match its cited canonical metric";
  }
  return undefined;
}
