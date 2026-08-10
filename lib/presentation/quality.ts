import type { QualityAssessment, QualityDecision, QualityFlag } from "../domain";

export interface QualityPresentation {
  label: string;
  tone: "positive" | "caution" | "negative";
  explanation: string;
  scoreLabel: string;
  flags: Array<{ id: QualityFlag; label: string }>;
  notes: readonly string[];
}

export const QUALITY_DECISION_PRESENTATION: Record<QualityDecision, Omit<QualityPresentation, "scoreLabel" | "flags" | "notes">> = {
  sufficient: { label: "Data memadai", tone: "positive", explanation: "Evidence cukup untuk membaca hasil dengan konteks yang tersedia." },
  degraded: { label: "Data terbatas", tone: "caution", explanation: "Analisis dapat dibaca, tetapi beberapa keterbatasan perlu diperhatikan." },
  insufficient: { label: "Data belum cukup", tone: "negative", explanation: "Evidence belum cukup untuk menghasilkan analisis yang aman." },
};

export const QUALITY_FLAG_LABELS: Record<QualityFlag, string> = {
  stale_data: "Data sudah cukup lama",
  missing_market_data: "Data pasar tidak lengkap",
  missing_financial_data: "Data keuangan tidak lengkap",
  partial_ttm: "TTM belum lengkap",
  inconsistent_statements: "Laporan tidak konsisten",
  insufficient_evidence: "Evidence terbatas",
  currency_mismatch: "Mata uang laporan berbeda",
};

export function presentQuality(quality: QualityAssessment): QualityPresentation {
  const decision = QUALITY_DECISION_PRESENTATION[quality.decision];
  return {
    ...decision,
    scoreLabel: `Skor kualitas ${Math.round(quality.score)}/100`,
    flags: quality.flags.map((id) => ({ id, label: QUALITY_FLAG_LABELS[id] })),
    notes: quality.notes,
  };
}
