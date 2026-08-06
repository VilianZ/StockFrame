import { REPORT_SCHEMA_VERSION } from "../domain";

type ProfileName = "conservative" | "moderate" | "aggressive";

function profileSchema(profileName: ProfileName, allowedEvidenceIds: readonly string[], confidenceMaximum: number) {
  const evidenceItems = {
    type: "STRING" as const,
    ...(allowedEvidenceIds.length > 0 ? { enum: [...allowedEvidenceIds] } : {}),
  };

  return {
  type: "OBJECT",
  properties: {
    profile: { type: "STRING", enum: [profileName] },
    rating: { type: "STRING", enum: ["positive", "neutral", "negative"] },
    confidence: { type: "NUMBER", minimum: 0, maximum: confidenceMaximum },
    thesis: { type: "STRING" },
    considerations: { type: "ARRAY", items: { type: "STRING" } },
    evidenceIds: { type: "ARRAY", items: evidenceItems, minItems: 1, maxItems: 64 },
  },
  required: ["profile", "rating", "confidence", "thesis", "considerations", "evidenceIds"],
  };
}

export function buildFinalReportGeminiSchema(
  allowedEvidenceIds: readonly string[],
  confidenceMaximum = 1,
) {
  return {
  type: "OBJECT",
  properties: {
    schemaVersion: { type: "STRING", enum: [REPORT_SCHEMA_VERSION] },
    summary: { type: "STRING" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    risks: { type: "ARRAY", items: { type: "STRING" } },
    uncertainties: { type: "ARRAY", items: { type: "STRING" } },
    limitations: { type: "ARRAY", items: { type: "STRING" } },
    profiles: {
      type: "OBJECT",
      properties: {
        conservative: profileSchema("conservative", allowedEvidenceIds, confidenceMaximum),
        moderate: profileSchema("moderate", allowedEvidenceIds, confidenceMaximum),
        aggressive: profileSchema("aggressive", allowedEvidenceIds, confidenceMaximum),
      },
      required: ["conservative", "moderate", "aggressive"],
    },
    disclaimer: { type: "STRING" },
  },
  required: ["schemaVersion", "summary", "strengths", "risks", "uncertainties", "limitations", "profiles", "disclaimer"],
  };
}

export const FINAL_REPORT_GEMINI_SCHEMA = buildFinalReportGeminiSchema([]);
