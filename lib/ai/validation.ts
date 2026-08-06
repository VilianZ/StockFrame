import { FinalReportSchema, type FinalReport } from "../domain";
import type { EvidencePacket } from "../quality";
import { AiError } from "./contracts";

const DEGRADED_CONFIDENCE_CAP = 0.7;
const UNSAFE_ACTION_PATTERNS = [
  /^\s*(?:buy|sell|hold|beli|jual|tahan)\b/i,
  /\b(?:buy|sell|hold)\s+(?:now|sekarang|this|that|the|it|shares?|stock|position|saham)\b/i,
  /\b(?:beli|jual|tahan)\s+(?:saham|ini|sekarang|segera|posisi|instrumen|portofolio)\b/i,
  /\balokasikan\b/i,
  /\b(?:position\s+size|shares?|lots?|ambil\s+posisi|stop[- ]?loss|take[- ]?profit|all[- ]?in)\b/i,
  /\b(?:guaranteed?|guarantee|jamin(?:an)?)\s+(?:untung|return|naik)\b/i,
  /\bpasti\s+(?:untung|naik)\b/i,
  /\bmodal(?:kan)?\s+sekarang\b/i,
];
const SAFE_DISCLAIMER = /\b(?:bukan|tidak|tanpa)\b[^.!?\n]{0,100}\b(?:rekomendasi|anjuran|saran|nasihat)\b/i;

export const MODEL_VALIDATION_FAILURE_CATEGORIES = [
  "contract mismatch",
  "unknown evidence",
  "unsafe language",
  "confidence violation",
] as const;

export type ModelValidationFailureCategory = (typeof MODEL_VALIDATION_FAILURE_CATEGORIES)[number];
export type ModelValidationFailureLogger = (category: ModelValidationFailureCategory) => void;

function reportText(report: FinalReport): string {
  return [
    report.summary,
    ...report.strengths,
    ...report.risks,
    ...report.uncertainties,
    ...report.limitations,
    report.disclaimer,
    ...Object.values(report.profiles).flatMap((profile) => [
      profile.thesis,
      ...profile.considerations,
    ]),
  ].join("\n");
}

function containsUnsafeTradingLanguage(text: string): boolean {
  return text.split(/[.!?\n]+/).some((sentence) => {
    const normalized = sentence.trim();
    if (!normalized || SAFE_DISCLAIMER.test(normalized)) return false;
    return UNSAFE_ACTION_PATTERNS.some((pattern) => pattern.test(normalized));
  });
}

function hasOutOfRangeConfidence(input: unknown): boolean {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return false;
  const profiles = (input as Record<string, unknown>).profiles;
  if (typeof profiles !== "object" || profiles === null || Array.isArray(profiles)) return false;
  return Object.values(profiles).some((profile) => {
    if (typeof profile !== "object" || profile === null || Array.isArray(profile)) return false;
    const confidence = (profile as Record<string, unknown>).confidence;
    return typeof confidence === "number" && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1);
  });
}

function rejectValidation(
  category: ModelValidationFailureCategory,
  message: string,
  onFailure?: ModelValidationFailureLogger,
): never {
  onFailure?.(category);
  throw new AiError("AI_INVALID_RESPONSE", message, false);
}

export function validateModelReport(
  input: unknown,
  packet: EvidencePacket,
  onFailure?: ModelValidationFailureLogger,
): FinalReport {
  if (hasOutOfRangeConfidence(input)) {
    rejectValidation("confidence violation", "Model output contained an out-of-range confidence", onFailure);
  }
  const parsed = FinalReportSchema.safeParse(input);
  if (!parsed.success) {
    rejectValidation("contract mismatch", "Model output did not match the report contract", onFailure);
  }

  const allowedEvidence = new Set(packet.evidence.map((evidence) => evidence.id));
  const referencedEvidence = Object.values(parsed.data.profiles).flatMap((profile) => profile.evidenceIds);
  if (referencedEvidence.some((id) => !allowedEvidence.has(id))) {
    rejectValidation("unknown evidence", "Model output referenced unknown evidence", onFailure);
  }
  if (containsUnsafeTradingLanguage(reportText(parsed.data))) {
    rejectValidation("unsafe language", "Model output contained disallowed trading instructions", onFailure);
  }
  if (packet.quality.decision === "degraded") {
    const exceedsCap = Object.values(parsed.data.profiles).some(
      (profile) => profile.confidence > DEGRADED_CONFIDENCE_CAP,
    );
    if (exceedsCap) rejectValidation("confidence violation", "Degraded quality confidence cap was not preserved", onFailure);
    if (parsed.data.limitations.length === 0) rejectValidation("contract mismatch", "Degraded quality limitations were not preserved", onFailure);
  }
  return parsed.data;
}
