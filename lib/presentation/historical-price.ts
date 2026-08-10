import type { Metric, PricePoint } from "../domain";
import { formatCurrency, formatDateId, formatMetricValue } from "./formatters";

export type HistoricalPriceState = "available" | "sparse" | "unavailable";

export interface HistoricalPricePresentation {
  state: HistoricalPriceState;
  points: PricePoint[];
  start?: PricePoint;
  latest?: PricePoint;
  periodChangeLabel?: string;
  textEquivalent: string;
}

export function sortHistoricalPrices(prices: readonly PricePoint[]): PricePoint[] {
  return [...prices].sort((left, right) => left.date.localeCompare(right.date));
}

export function presentHistoricalPrices(
  prices: readonly PricePoint[],
  priceReturnMetric?: Metric,
  currency = "USD",
  asOf?: string,
): HistoricalPricePresentation {
  const sorted = sortHistoricalPrices(prices.filter((point) => !asOf || point.date <= asOf));
  const state: HistoricalPriceState = sorted.length === 0 ? "unavailable" : sorted.length === 1 ? "sparse" : "available";
  const start = sorted[0];
  const latest = sorted.at(-1);
  const periodChangeLabel = priceReturnMetric?.status === "available"
    ? formatMetricValue(priceReturnMetric).value
    : undefined;
  const textEquivalent = !start || !latest
    ? "Data harga historis belum tersedia."
    : `${formatDateId(start.date)} sampai ${formatDateId(latest.date)}; harga awal ${formatCurrency(start.close, currency)}, harga terbaru ${formatCurrency(latest.close, currency)}${periodChangeLabel ? `, perubahan periode ${periodChangeLabel}` : "."}`;
  return { state, points: sorted, start, latest, periodChangeLabel, textEquivalent };
}
