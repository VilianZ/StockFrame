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
  corporateActions?: MarketSnapshot["corporateActions"];
}

const MAX_FACTS = 64;
const MAX_METRICS = 32;
const MAX_EVIDENCE = 128;
const MAX_CORPORATE_ACTIONS = 20;

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
  const corporateActions = {
    ...snapshot.corporateActions,
    events: snapshot.corporateActions.events.slice(0, MAX_CORPORATE_ACTIONS),
  };
  for (const event of corporateActions.events) referencedIds.add(event.evidenceId);
  const referencedEvidence = snapshot.evidence
    .filter((item) => referencedIds.has(item.id))
    .sort((left, right) => left.id.localeCompare(right.id));
  const corporateEvidenceIds = new Set(corporateActions.events.map((event) => event.evidenceId));
  const corporateEvidence = referencedEvidence.filter((item) => corporateEvidenceIds.has(item.id));
  const otherEvidence = referencedEvidence.filter((item) => !corporateEvidenceIds.has(item.id));
  const evidence = [
    ...corporateEvidence,
    ...otherEvidence.slice(0, Math.max(0, MAX_EVIDENCE - corporateEvidence.length)),
  ];
  const evidenceIds = new Set(evidence.map((item) => item.id));
  const boundedCorporateActions = {
    ...corporateActions,
    events: corporateActions.events.filter((event) => evidenceIds.has(event.evidenceId)),
  };

  return {
    instrument: snapshot.instrument,
    asOf: snapshot.asOf,
    facts,
    metrics: selectedMetrics,
    quality,
    evidence,
    corporateActions: boundedCorporateActions,
  };
}
