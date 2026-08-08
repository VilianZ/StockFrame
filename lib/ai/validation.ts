import { FinalReportSchema, type FinalReport } from "../domain";
import type { EvidencePacket } from "../quality";
import { AiError } from "./contracts";
import { validateMetricClaimNumbers, validateMetricClaimPolicy } from "./metric-policy";

const DEGRADED_CONFIDENCE_CAP = 0.7;
const UNSAFE_ACTION_PATTERNS = [
  /^\s*(?:buy|sell|hold|beli|jual|tahan)\b/i,
  /\b(?:buy|sell|hold)\s+(?:now|sekarang|this|that|the|it|shares?|stock|position|saham)\b/i,
  /\b(?:beli|jual|tahan)\s+(?:saham|ini|sekarang|segera|posisi|instrumen|portofolio)\b/i,
  /\balokasikan\b/i,
  /\b(?:position\s+size|ambil\s+posisi|stop[- ]?loss|take[- ]?profit|all[- ]?in)\b/i,
  /\b\d+(?:[.,]\d+)?\s+(?:shares?|lots?|saham|lot)\b/i,
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
    report.summary.text,
    ...report.strengths.map((claim) => claim.text),
    ...report.risks.map((claim) => claim.text),
    ...report.uncertainties.map((claim) => claim.text),
    ...report.limitations,
    report.disclaimer,
    ...Object.values(report.profiles).flatMap((profile) => [
      profile.thesis.text,
      ...profile.considerations.map((claim) => claim.text),
    ]),
  ].join("\n");
}

function groundedClaims(report: FinalReport) {
  return [
    report.summary,
    ...report.strengths,
    ...report.risks,
    ...report.uncertainties,
    ...Object.values(report.profiles).flatMap((profile) => [
      profile.thesis,
      ...profile.considerations,
    ]),
  ];
}

function reportSafetyText(report: FinalReport): string {
  return [
    reportText(report),
    ...report.corporateActionClaims.map((claim) => claim.claim),
  ].join("\n");
}

function containsUnsafeTradingLanguage(text: string): boolean {
  return text.split(/[.!?\n]+/).some((sentence) => {
    const normalized = sentence.trim();
    if (!normalized || SAFE_DISCLAIMER.test(normalized)) return false;
    return UNSAFE_ACTION_PATTERNS.some((pattern) => pattern.test(normalized));
  });
}

const CORPORATE_ACTION_TERMS = /\b(?:merger|mergers|acquisition|acquisitions|spinoff|spin[- ]?off|bankruptcy|bankrupt|delisting|delisted|listing|listed|dividend|split|ticker\s+change|ticker\s+changed|perubahan\s+ticker|perubahan\s+simbol|berganti\s+simbol|mengganti\s+simbol|ticker\s+adopted|ticker\s+retired|penggabungan|akuisisi|dividen|pemecahan saham|bangkrut|terdaftar)\b/i;

function containsUnprovenCorporateActionLanguage(text: string): boolean {
  return CORPORATE_ACTION_TERMS.test(text);
}

function groundedReportText(report: FinalReport): string {
  return groundedClaims(report).map((claim) => claim.text).join("\n");
}

function hasOutOfRangeConfidence(input: unknown): boolean {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return false;
  const profiles = (input as Record<string, unknown>).profiles;
  if (typeof profiles !== "object" || profiles === null || Array.isArray(profiles)) return false;
  return Object.values(profiles).some((profile) => {
    if (typeof profile !== "object" || profile === null || Array.isArray(profile)) return false;
    const confidence = (profile as Record<string, unknown>).confidence;
    return typeof confidence === "number" && (!Number.isFinite(confidence) || confidence < 0.4 || confidence > 0.85);
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

  const availableMetricIds = new Set(
    packet.metrics.filter((metric) => metric.status === "available").map((metric) => metric.id),
  );
  for (const claim of groundedClaims(parsed.data)) {
    if (claim.metricIds.some((id) => !availableMetricIds.has(id))) {
      rejectValidation("unknown evidence", "Model output referenced an unknown or unavailable metric", onFailure);
    }
    const policyError = validateMetricClaimPolicy(claim.text, claim.metricIds);
    if (policyError) {
      rejectValidation("contract mismatch", policyError, onFailure);
    }
    const numericError = validateMetricClaimNumbers(claim.text, claim.metricIds, packet.metrics);
    if (numericError) {
      rejectValidation("contract mismatch", numericError, onFailure);
    }
  }
  const allowedCorporateActionEvidence = new Set(
    packet.corporateActions?.events.map((event) => event.evidenceId) ?? [],
  );
  if (parsed.data.corporateActionClaims.some((claim) => !allowedCorporateActionEvidence.has(claim.evidenceId))) {
    rejectValidation("unknown evidence", "Corporate action claim referenced unknown evidence", onFailure);
  }
  if (containsUnsafeTradingLanguage(reportSafetyText(parsed.data))) {
    rejectValidation("unsafe language", "Model output contained disallowed trading instructions", onFailure);
  }
  if (containsUnprovenCorporateActionLanguage(groundedReportText(parsed.data))) {
    rejectValidation("unknown evidence", "Corporate action claims must use corporate-action evidence", onFailure);
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
