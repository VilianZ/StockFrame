import type { MarketSnapshot, Metric } from "../domain";
import { getMetricCatalogEntry, type MetricId } from "./metric-catalog";

export const CURRENT_PERIOD_GRAPH_LABEL = "Periode terbaru · bukan data historis";
export const PROFITABILITY_BAR_METRIC_IDS = ["roa", "roe", "net_margin"] as const satisfies readonly MetricId[];

export type MetricVisualizationKind = "scalar" | "profitability_bar";

export interface MetricVisualizationDecision {
  kind: MetricVisualizationKind;
  eligible: boolean;
  metricIds: readonly MetricId[];
  label: string;
  reason: string;
}

export interface CapitalStructureDecision {
  kind: "capital_structure" | "scalar_fallback";
  eligible: boolean;
  label: string;
  reason: string;
  inputs: Array<{ id: "debt" | "equity"; label: string; value: number; currency: string }>;
}

export interface SharedAxisDecision {
  eligible: boolean;
  metricIds: MetricId[];
  reason: string;
}

const PROFITABILITY_FORMULAS: Record<(typeof PROFITABILITY_BAR_METRIC_IDS)[number], string> = {
  roa: "roa-ttm-average-assets-v1",
  roe: "roe-ttm-average-equity-v1",
  net_margin: "net-margin-ttm-v1",
};

export function decideSharedMetricAxis(metrics: readonly Metric[]): SharedAxisDecision {
  const metricIds = metrics.map((metric) => metric.id as MetricId);
  const compatible = metrics.length >= 2
    && metrics.every((metric) => {
      const id = metric.id as (typeof PROFITABILITY_BAR_METRIC_IDS)[number];
      return PROFITABILITY_BAR_METRIC_IDS.includes(id)
        && metric.status === "available"
        && metric.value !== null
        && Number.isFinite(metric.value)
        && metric.unit === "ratio"
        && metric.formulaId === PROFITABILITY_FORMULAS[id];
    });
  return {
    eligible: compatible,
    metricIds,
    reason: compatible
      ? "Semua metric memiliki unit rasio dan periode TTM yang kompatibel."
      : "Metric dengan unit berbeda, status tidak tersedia, atau formula tidak sebanding tidak boleh berbagi axis.",
  };
}

export function decideProfitabilityBars(metrics: readonly Metric[]): MetricVisualizationDecision {
  const selected = PROFITABILITY_BAR_METRIC_IDS.map((id) => metrics.find((metric) => metric.id === id));
  const eligible = selected.every((metric, index) => {
    const id = PROFITABILITY_BAR_METRIC_IDS[index];
    return metric?.status === "available"
      && metric.value !== null
      && Number.isFinite(metric.value)
      && metric.unit === "ratio"
      && metric.formulaId === PROFITABILITY_FORMULAS[id];
  });
  return {
    kind: eligible ? "profitability_bar" : "scalar",
    eligible,
    metricIds: eligible ? PROFITABILITY_BAR_METRIC_IDS : [],
    label: CURRENT_PERIOD_GRAPH_LABEL,
    reason: eligible
      ? "ROA, ROE, dan net margin memiliki unit rasio serta periode TTM yang kompatibel."
      : "Gunakan scalar metric karena input profitabilitas tidak lengkap atau periodenya tidak kompatibel.",
  };
}

export function decideMetricVisualization(metric: Metric): MetricVisualizationDecision {
  const catalog = getMetricCatalogEntry(metric.id);
  const isProfitabilityBarMetric = PROFITABILITY_BAR_METRIC_IDS.includes(metric.id as (typeof PROFITABILITY_BAR_METRIC_IDS)[number]);
  return {
    kind: "scalar",
    eligible: metric.status === "available" && !isProfitabilityBarMetric,
    metricIds: catalog ? [catalog.id] : [],
    label: CURRENT_PERIOD_GRAPH_LABEL,
    reason: isProfitabilityBarMetric
      ? "Metric ini hanya masuk grafik jika dibandingkan bersama ROA, ROE, dan net margin yang kompatibel."
      : "Metric ditampilkan sebagai nilai scalar karena unit atau sifatnya tidak kompatibel untuk axis bersama.",
  };
}

export function decideCapitalStructure(snapshot: MarketSnapshot): CapitalStructureDecision {
  const latest = snapshot.financials.balanceSheet[0];
  const debt = latest?.values.totalLiabilities;
  const equity = latest?.values.totalShareholderEquity;
  const currencyMatches = latest?.currency === snapshot.currency;
  const valid = currencyMatches
    && typeof debt === "number" && Number.isFinite(debt) && debt >= 0
    && typeof equity === "number" && Number.isFinite(equity) && equity > 0;
  return {
    kind: valid ? "capital_structure" : "scalar_fallback",
    eligible: valid,
    label: CURRENT_PERIOD_GRAPH_LABEL,
    reason: valid
      ? "Liabilitas dan ekuitas terbaru tersedia dalam mata uang snapshot yang sama."
      : currencyMatches
        ? "Tampilkan DER dan metric terkait sebagai scalar karena debt atau equity belum valid."
        : "Tampilkan DER dan metric terkait sebagai scalar karena mata uang periode terbaru berbeda dari snapshot.",
    inputs: valid
      ? [
          { id: "debt", label: "Liabilitas", value: debt, currency: snapshot.currency },
          { id: "equity", label: "Ekuitas", value: equity, currency: snapshot.currency },
        ]
      : [],
  };
}
