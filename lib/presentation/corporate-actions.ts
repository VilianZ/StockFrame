import type { CorporateAction, CorporateActionKind, CorporateActionStatus, CorporateActionEnrichment } from "../domain";
import { formatDateId, formatCurrency } from "./formatters";

export const CORPORATE_ACTION_KIND_LABELS: Record<CorporateActionKind, string> = {
  dividend: "Dividen",
  split: "Stock split",
  merger: "Merger",
  acquisition: "Akuisisi",
  spinoff: "Spinoff",
  bankruptcy: "Kebangkrutan",
  delisting: "Delisting",
  listing: "Listing",
  ticker_change: "Perubahan ticker",
  other: "Peristiwa lain",
};

export const CORPORATE_ACTION_STATUS_PRESENTATION: Record<CorporateActionStatus, { label: string; tone: "positive" | "neutral" | "caution"; explanation: string }> = {
  available: { label: "Peristiwa tersedia", tone: "positive", explanation: "Event terstruktur dari sumber data dan dapat ditelusuri melalui evidence." },
  empty: { label: "Tidak ada peristiwa", tone: "neutral", explanation: "Tidak ada corporate action yang tersedia untuk periode snapshot." },
  unavailable: { label: "Peristiwa tidak tersedia", tone: "caution", explanation: "Enrichment corporate action tidak tersedia; ini tidak berarti tidak ada peristiwa." },
};

export function getCorporateActionKindLabel(kind: CorporateActionKind): string {
  return CORPORATE_ACTION_KIND_LABELS[kind];
}

export function presentCorporateActionStatus(status: CorporateActionStatus) {
  return CORPORATE_ACTION_STATUS_PRESENTATION[status];
}

export function presentCorporateAction(event: CorporateAction, currency = "USD") {
  return {
    ...event,
    kindLabel: getCorporateActionKindLabel(event.kind),
    dateLabel: formatDateId(event.date),
    valueLabel: event.value === null ? undefined : formatCurrency(event.value, currency),
    provenanceLabel: `Evidence ${event.evidenceId}`,
  };
}

export function presentCorporateActions(enrichment: CorporateActionEnrichment, currency = "USD") {
  return {
    status: presentCorporateActionStatus(enrichment.status),
    events: enrichment.events.map((event) => presentCorporateAction(event, currency)),
    warnings: enrichment.warnings,
  };
}
