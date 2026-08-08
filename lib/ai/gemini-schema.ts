import { REPORT_SCHEMA_VERSION } from "../domain";

type ProfileName = "conservative" | "moderate" | "aggressive";

function metricClaimSchema(allowedMetricIds: readonly string[]) {
  const metricItems = {
    type: "STRING" as const,
    ...(allowedMetricIds.length > 0 ? { enum: [...allowedMetricIds] } : {}),
  };

  return {
    type: "OBJECT",
    properties: {
      // Text length is enforced by FinalReportSchema; keep this provider
      // schema within Gemini's portable structured-output subset.
      text: { type: "STRING" },
      metricIds: {
        type: "ARRAY",
        items: metricItems,
        minItems: allowedMetricIds.length > 0 ? 1 : 0,
        maxItems: allowedMetricIds.length > 0 ? 16 : 0,
      },
    },
    required: ["text", "metricIds"],
  };
}

function profileSchema(profileName: ProfileName, allowedMetricIds: readonly string[], confidenceMaximum: number) {

  return {
  type: "OBJECT",
  properties: {
    profile: { type: "STRING", enum: [profileName] },
    rating: { type: "STRING", enum: ["positive", "neutral", "negative"] },
    confidence: { type: "NUMBER", minimum: 0.4, maximum: confidenceMaximum },
    thesis: metricClaimSchema(allowedMetricIds),
    considerations: { type: "ARRAY", items: metricClaimSchema(allowedMetricIds), minItems: 1, maxItems: 16 },
  },
  required: ["profile", "rating", "confidence", "thesis", "considerations"],
  };
}

function corporateActionClaimSchema(allowedEvidenceIds: readonly string[]) {
  return {
    type: "OBJECT",
    properties: {
      evidenceId: {
        type: "STRING" as const,
        ...(allowedEvidenceIds.length > 0 ? { enum: [...allowedEvidenceIds] } : {}),
      },
      claim: { type: "STRING" },
    },
    required: ["evidenceId", "claim"],
  };
}

export function buildFinalReportGeminiSchema(
  allowedMetricIds: readonly string[],
  confidenceMaximum = 0.85,
  allowedCorporateActionEvidenceIds: readonly string[] = [],
) {
  return {
  type: "OBJECT",
  properties: {
    schemaVersion: { type: "STRING", enum: [REPORT_SCHEMA_VERSION] },
    summary: metricClaimSchema(allowedMetricIds),
    strengths: { type: "ARRAY", items: metricClaimSchema(allowedMetricIds), minItems: 1, maxItems: 16 },
    risks: { type: "ARRAY", items: metricClaimSchema(allowedMetricIds), minItems: 1, maxItems: 16 },
    uncertainties: { type: "ARRAY", items: metricClaimSchema(allowedMetricIds), minItems: 1, maxItems: 16 },
    limitations: { type: "ARRAY", items: { type: "STRING" } },
    corporateActionClaims: {
      type: "ARRAY",
      items: corporateActionClaimSchema(allowedCorporateActionEvidenceIds),
      maxItems: allowedCorporateActionEvidenceIds.length > 0 ? 20 : 0,
    },
    profiles: {
      type: "OBJECT",
      properties: {
        conservative: profileSchema("conservative", allowedMetricIds, confidenceMaximum),
        moderate: profileSchema("moderate", allowedMetricIds, confidenceMaximum),
        aggressive: profileSchema("aggressive", allowedMetricIds, confidenceMaximum),
      },
      required: ["conservative", "moderate", "aggressive"],
    },
    disclaimer: { type: "STRING" },
  },
  required: ["schemaVersion", "summary", "strengths", "risks", "uncertainties", "limitations", "corporateActionClaims", "profiles", "disclaimer"],
  };
}

export const FINAL_REPORT_GEMINI_SCHEMA = buildFinalReportGeminiSchema([]);
