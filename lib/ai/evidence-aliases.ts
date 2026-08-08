import type { EvidencePacket } from "../quality";

export interface EvidenceAlias {
  alias: string;
  canonicalId: string;
}

export interface AliasedEvidencePacket {
  packet: EvidencePacket;
  aliases: EvidenceAlias[];
}

export function buildAliasedEvidencePacket(input: EvidencePacket): AliasedEvidencePacket {
  const aliases = input.evidence.map((evidence, index) => ({
    alias: `E${index + 1}`,
    canonicalId: evidence.id,
  }));
  const aliasByCanonicalId = new Map(aliases.map((item) => [item.canonicalId, item.alias]));
  const mapEvidenceIds = (evidenceIds: string[]) => evidenceIds.map((id) => aliasByCanonicalId.get(id) ?? id);
  const corporateActions = input.corporateActions
    ? {
        ...input.corporateActions,
        events: input.corporateActions.events.map((event) => ({
          ...event,
          evidenceId: aliasByCanonicalId.get(event.evidenceId) ?? event.evidenceId,
        })),
      }
    : undefined;

  return {
    aliases,
    packet: {
      ...input,
      metrics: input.metrics.map((metric) => ({ ...metric, evidenceIds: mapEvidenceIds(metric.evidenceIds) })),
      evidence: input.evidence.map((evidence, index) => ({ ...evidence, id: aliases[index].alias })),
      ...(corporateActions ? { corporateActions } : {}),
    },
  };
}

export function mapEvidenceAliasesToCanonical(input: unknown, aliases: readonly EvidenceAlias[]): unknown {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return input;
  const canonicalByAlias = new Map(aliases.map((item) => [item.alias, item.canonicalId]));
  const corporateActionClaims = (input as Record<string, unknown>).corporateActionClaims;
  const mappedCorporateActionClaims = Array.isArray(corporateActionClaims)
    ? corporateActionClaims.map((claim) => {
        if (typeof claim !== "object" || claim === null || Array.isArray(claim)) return claim;
        const evidenceId = (claim as Record<string, unknown>).evidenceId;
        return {
          ...claim,
          evidenceId: typeof evidenceId === "string" ? canonicalByAlias.get(evidenceId) ?? evidenceId : evidenceId,
        };
      })
    : corporateActionClaims;
  return {
    ...input,
    ...(Array.isArray(corporateActionClaims) ? { corporateActionClaims: mappedCorporateActionClaims } : {}),
  };
}
