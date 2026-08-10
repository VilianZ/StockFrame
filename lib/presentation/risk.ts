import type { ProfileRecommendation, Rating, RiskProfile } from "../domain";

export const RISK_PROFILE_LABELS: Record<RiskProfile, string> = {
  conservative: "Konservatif",
  moderate: "Moderat",
  aggressive: "Agresif",
};

export const RISK_PROFILE_DESCRIPTIONS: Record<RiskProfile, string> = {
  conservative: "Menekankan daya tahan, keterbatasan downside, dan margin keamanan.",
  moderate: "Menimbang kualitas bisnis, valuasi, dan risiko secara seimbang.",
  aggressive: "Lebih menerima fluktuasi dengan fokus pada ruang pertumbuhan dan risiko yang menyertainya.",
};

export const RATING_LABELS: Record<Rating, string> = {
  positive: "Positif",
  neutral: "Netral",
  negative: "Negatif",
};

export function presentRiskProfile(profile: RiskProfile, recommendation: ProfileRecommendation) {
  return {
    id: profile,
    label: RISK_PROFILE_LABELS[profile],
    description: RISK_PROFILE_DESCRIPTIONS[profile],
    ratingLabel: RATING_LABELS[recommendation.rating],
    confidence: recommendation.confidence,
    confidenceLabel: "Keyakinan model",
    thesis: recommendation.thesis,
    considerations: recommendation.considerations,
  };
}
