import type { Metric, MetricStatus } from "../domain";
import { getMetricCatalogEntry, type MetricDisplayKind } from "./metric-catalog";

const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const currencyFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

export interface MetricStatusPresentation {
  label: string;
  tone: "positive" | "caution" | "neutral";
  explanation: string;
}

export interface MetricValuePresentation extends MetricStatusPresentation {
  value: string;
  unit: string;
  accessibleValue: string;
}

const STATUS_PRESENTATION: Record<MetricStatus, MetricStatusPresentation> = {
  available: { label: "Tersedia", tone: "positive", explanation: "Nilai dihitung engine dari data yang tersedia." },
  not_available: { label: "Tidak tersedia", tone: "neutral", explanation: "Input yang dibutuhkan belum tersedia atau tidak lolos validasi." },
  not_meaningful: { label: "Tidak bermakna", tone: "caution", explanation: "Input tersedia, tetapi hasil tidak bermakna untuk interpretasi ini." },
};

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercentage(value: number): string {
  return `${formatNumber(value * 100)}%`;
}

export function formatMultiple(value: number): string {
  return `${formatNumber(value)}×`;
}

export function formatCurrency(value: number, currency: string): string {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  return `${code} ${currencyFormatter.format(value)}`;
}

export function formatDateId(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function formatAvailableValue(value: number, displayKind: MetricDisplayKind, currency: string): string {
  switch (displayKind) {
    case "percentage":
      return formatPercentage(value);
    case "multiple":
      return formatMultiple(value);
    case "currency":
      return formatCurrency(value, currency);
    case "currency_per_share":
      return `${formatCurrency(value, currency)} / saham`;
  }
}

export function getMetricStatusPresentation(status: MetricStatus): MetricStatusPresentation {
  return STATUS_PRESENTATION[status];
}

export function formatMetricValue(metric: Metric, currency = "USD"): MetricValuePresentation {
  const status = getMetricStatusPresentation(metric.status);
  const catalog = getMetricCatalogEntry(metric.id);
  const value = metric.status === "available" && metric.value !== null && catalog
    ? formatAvailableValue(metric.value, catalog.displayKind, currency)
    : status.label;
  return {
    ...status,
    value,
    unit: catalog?.defaultUnit ?? metric.unit,
    accessibleValue: `${catalog?.label ?? metric.id}: ${value}. Status: ${status.label}.`,
  };
}

export function formatConfidence(value: number): string {
  return formatPercentage(value);
}
