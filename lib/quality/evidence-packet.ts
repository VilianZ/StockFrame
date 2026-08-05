import type {
  Evidence,
  MarketSnapshot,
  Metric,
  QualityAssessment,
} from "../domain";

export interface EvidencePacket {
  instrument: MarketSnapshot["instrument"];
  asOf: string;
  facts: Record<string, number | null>;
  metrics: Metric[];
  quality: QualityAssessment;
  evidence: Evidence[];
}

const MAX_FACTS = 64;
const MAX_METRICS = 32;
const MAX_EVIDENCE = 128;

export function buildEvidencePacket(
  snapshot: MarketSnapshot,
  metrics: Metric[],
  quality: QualityAssessment,
): EvidencePacket {
  const facts = Object.fromEntries(
    Object.entries(snapshot.facts).sort(([left], [right]) => left.localeCompare(right)).slice(0, MAX_FACTS),
  );
  const selectedMetrics = [...metrics]
    .sort((left, right) => left.id.localeCompare(right.id))
    .slice(0, MAX_METRICS);
  const referencedIds = new Set(selectedMetrics.flatMap((metric) => metric.evidenceIds));
  const evidence = snapshot.evidence
    .filter((item) => referencedIds.has(item.id))
    .sort((left, right) => left.id.localeCompare(right.id))
    .slice(0, MAX_EVIDENCE);

  return {
    instrument: snapshot.instrument,
    asOf: snapshot.asOf,
    facts,
    metrics: selectedMetrics,
    quality,
    evidence,
  };
}
