import { AiInterpretationSchema, RATINGS, REPORT_SCHEMA_VERSION, RISK_PROFILES, type FinalReport, type Rating, type RiskProfile } from "../domain";
import type { EvidenceAlias } from "./evidence-aliases";
import { AiError, type AiValidationReason } from "./contracts";

function metricClaimSchema() {
  return {
    type: "OBJECT",
    properties: {
      text: { type: "STRING" },
      metricIds: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: ["text", "metricIds"],
  };
}

function profileConsiderationSchema() {
  return {
    type: "OBJECT",
    properties: {
      text: { type: "STRING" },
      // A flat string keeps this nested provider schema portable across Gemini models.
      metricIds: { type: "STRING" },
    },
    required: ["text", "metricIds"],
  };
}

function profileSchema() {
  return {
    type: "OBJECT",
    properties: {
      profile: { type: "STRING" },
      rating: { type: "STRING" },
      confidence: { type: "NUMBER" },
      thesis: metricClaimSchema(),
      considerations: {
        type: "ARRAY",
        items: profileConsiderationSchema(),
        minItems: 1,
        maxItems: 16,
      },
    },
    required: ["profile", "rating", "confidence", "thesis", "considerations"],
  };
}

export function buildInterpretationGeminiSchema(
  _allowedMetricIds: readonly string[],
  confidenceMaximum = 0.85,
): Record<string, unknown> {
  void confidenceMaximum;
  return {
    type: "OBJECT",
    properties: {
      profiles: {
        type: "OBJECT",
        properties: {
          conservative: profileSchema(),
          moderate: profileSchema(),
          aggressive: profileSchema(),
        },
        required: ["conservative", "moderate", "aggressive"],
      },
    },
    required: ["profiles"],
  };
}

export const INTERPRETATION_GEMINI_SCHEMA = buildInterpretationGeminiSchema([]);
export { AiInterpretationSchema };

// Backward-compatible parser for fixtures and older cached model responses.
// It is intentionally not used in the provider schema or prompt.
export type FlatGeminiKind = "summary" | "strength" | "risk" | "uncertainty" | "limitation" | "disclaimer" | "profile_thesis" | "profile_consideration" | "corporate_action";

interface FlatGeminiItem {
  kind: string;
  profile: string;
  rating: string;
  confidence: number;
  text: string;
  referenceIds: string[];
}

interface FlatGeminiReport {
  items: FlatGeminiItem[];
}

export class FlatGeminiValidationError extends AiError {
  readonly reason: AiValidationReason;

  constructor(reason: AiValidationReason, message: string) {
    super("AI_INVALID_RESPONSE", message, false);
    this.name = "FlatGeminiValidationError";
    this.reason = reason;
  }
}

function flatInvalid(reason: AiValidationReason, message: string): never {
  throw new FlatGeminiValidationError(reason, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseFlatGeminiReport(input: unknown): FlatGeminiReport {
  const rawItems = Array.isArray(input)
    ? input
    : isRecord(input) && Array.isArray(input.items)
      ? input.items
      : undefined;
  if (!rawItems) flatInvalid("flat_envelope", "Gemini flat report envelope is invalid");
  const items = rawItems.map((item): FlatGeminiItem => {
    if (!isRecord(item)
      || typeof item.kind !== "string"
      || typeof item.profile !== "string"
      || typeof item.rating !== "string"
      || typeof item.confidence !== "number"
      || !Number.isFinite(item.confidence)
      || typeof item.text !== "string"
      || !Array.isArray(item.referenceIds)
      || item.referenceIds.some((referenceId) => typeof referenceId !== "string")) {
      flatInvalid("invalid_flat_item", "Gemini flat report item is invalid");
    }
    return {
      kind: item.kind,
      profile: item.profile,
      rating: item.rating,
      confidence: item.confidence,
      text: item.text,
      referenceIds: item.referenceIds,
    };
  });
  return { items };
}

function flatExactlyOne<T>(items: T[], label: string): T {
  if (items.length !== 1) flatInvalid("missing_section", `Gemini flat report requires exactly one ${label}`);
  return items[0]!;
}

function flatText(item: FlatGeminiItem): string {
  if (item.text.trim().length === 0) flatInvalid("empty_text", "Gemini flat report contains empty text");
  return item.text;
}

function flatMetricReferences(item: FlatGeminiItem): string[] {
  if (item.referenceIds.length < 1 || item.referenceIds.some((id) => id.trim().length === 0)) {
    flatInvalid("reference_mismatch", "Gemini flat report requires a metric reference");
  }
  return item.referenceIds;
}

function flatProfileName(item: FlatGeminiItem): void {
  if (!(RISK_PROFILES as readonly string[]).includes(item.profile)) flatInvalid("profile_mismatch", "Gemini flat report contains an invalid profile field");
}

function flatProfileFields(item: FlatGeminiItem): void {
  flatProfileName(item);
  if (!(RATINGS as readonly string[]).includes(item.rating) || item.confidence < 0.4 || item.confidence > 0.85) {
    flatInvalid("profile_mismatch", "Gemini flat report contains an invalid profile field");
  }
  flatMetricReferences(item);
}

export function normalizeFlatGeminiReport(input: unknown, options: {
  availableMetricIds: readonly string[];
  corporateActionEvidenceAliases: readonly string[];
  evidenceAliases: readonly EvidenceAlias[];
}): FinalReport {
  const parsed = parseFlatGeminiReport(input);
  void options.availableMetricIds;
  void options.corporateActionEvidenceAliases;
  const canonicalByAlias = new Map(options.evidenceAliases.map((item) => [item.alias, item.canonicalId]));
  const byKind = (kind: FlatGeminiKind) => parsed.items.filter((item) => item.kind === kind);
  const claim = (item: FlatGeminiItem) => ({ text: flatText(item), metricIds: flatMetricReferences(item) });
  for (const item of parsed.items) {
    if (!(Object.keys({ summary: 1, strength: 1, risk: 1, uncertainty: 1, limitation: 1, disclaimer: 1, profile_thesis: 1, profile_consideration: 1, corporate_action: 1 }) as string[]).includes(item.kind)) flatInvalid("unknown_kind", "Gemini flat report contains an unknown kind");
    if (item.kind === "profile_thesis") flatProfileFields(item);
    else if (item.kind === "profile_consideration") { flatProfileName(item); flatMetricReferences(item); }
    else if (item.kind === "corporate_action") { if (item.referenceIds.length !== 1) flatInvalid("reference_mismatch", "Gemini flat report referenced invalid corporate-action evidence"); }
    else if (item.kind === "limitation" || item.kind === "disclaimer") { if (item.referenceIds.length !== 0) flatInvalid("reference_mismatch", "Gemini flat report limitation/disclaimer cannot cite metrics"); }
    else flatMetricReferences(item);
  }
  const summary = flatExactlyOne(byKind("summary"), "summary");
  const disclaimer = flatExactlyOne(byKind("disclaimer"), "disclaimer");
  const strengths = byKind("strength");
  const risks = byKind("risk");
  const uncertainties = byKind("uncertainty");
  const limitations = byKind("limitation");
  if (strengths.length < 1 || risks.length < 1 || uncertainties.length < 1 || limitations.length < 1) flatInvalid("missing_section", "Gemini flat report is missing a required section");
  const profiles = Object.fromEntries(RISK_PROFILES.map((profile) => {
    const thesis = byKind("profile_thesis").filter((item) => item.profile === profile);
    const considerations = byKind("profile_consideration").filter((item) => item.profile === profile);
    const thesisItem = flatExactlyOne(thesis, `${profile} profile thesis`);
    if (considerations.length < 1) flatInvalid("missing_section", `Gemini flat report is missing ${profile} considerations`);
    flatProfileFields(thesisItem);
    return [profile, { profile, rating: thesisItem.rating as Rating, confidence: thesisItem.confidence, thesis: claim(thesisItem), considerations: considerations.map(claim) }];
  })) as Record<RiskProfile, unknown>;
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    summary: claim(summary),
    strengths: strengths.map(claim),
    risks: risks.map(claim),
    uncertainties: uncertainties.map(claim),
    limitations: limitations.map(flatText),
    corporateActionClaims: byKind("corporate_action").map((item) => ({ evidenceId: canonicalByAlias.get(item.referenceIds[0]!) ?? item.referenceIds[0]!, claim: flatText(item) })),
    profiles: profiles as FinalReport["profiles"],
    disclaimer: flatText(disclaimer),
  };
}
