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

  return {
    aliases,
    packet: {
      ...input,
      metrics: input.metrics.map((metric) => ({ ...metric, evidenceIds: mapEvidenceIds(metric.evidenceIds) })),
      evidence: input.evidence.map((evidence, index) => ({ ...evidence, id: aliases[index].alias })),
    },
  };
}

export function mapEvidenceAliasesToCanonical(input: unknown, aliases: readonly EvidenceAlias[]): unknown {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return input;
  const profiles = (input as Record<string, unknown>).profiles;
  if (typeof profiles !== "object" || profiles === null || Array.isArray(profiles)) return input;
  const canonicalByAlias = new Map(aliases.map((item) => [item.alias, item.canonicalId]));
  const mappedProfiles = Object.fromEntries(Object.entries(profiles).map(([name, profile]) => {
    if (typeof profile !== "object" || profile === null || Array.isArray(profile)) return [name, profile];
    const evidenceIds = (profile as Record<string, unknown>).evidenceIds;
    if (!Array.isArray(evidenceIds)) return [name, profile];
    return [name, {
      ...profile,
      evidenceIds: evidenceIds.map((id) => typeof id === "string" ? canonicalByAlias.get(id) ?? id : id),
    }];
  }));
  return { ...input, profiles: mappedProfiles };
}
