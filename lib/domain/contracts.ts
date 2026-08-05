import type { z } from "zod";

import type {
  AnalysisRequestSchema,
  AnalyzeErrorResponseSchema,
  AnalyzeResponseSchema,
  EvidenceSchema,
  FinalReportSchema,
  FinancialPeriodSchema,
  InstrumentSchema,
  MarketSnapshotSchema,
  MetricSchema,
  PricePointSchema,
  ProfileRecommendationSchema,
  QualityAssessmentSchema,
  QualityDecisionSchema,
} from "./schemas";

export const RISK_PROFILES = [
  "conservative",
  "moderate",
  "aggressive",
] as const;
export type RiskProfile = (typeof RISK_PROFILES)[number];

export const RATINGS = ["positive", "neutral", "negative"] as const;
export type Rating = (typeof RATINGS)[number];

export const METRIC_STATUSES = [
  "available",
  "not_available",
  "not_meaningful",
] as const;
export type MetricStatus = (typeof METRIC_STATUSES)[number];

export const QUALITY_FLAGS = [
  "stale_data",
  "missing_market_data",
  "missing_financial_data",
  "partial_ttm",
  "inconsistent_statements",
  "insufficient_evidence",
  "currency_mismatch",
] as const;
export type QualityFlag = (typeof QUALITY_FLAGS)[number];

export const ERROR_CODES = [
  "INVALID_REQUEST",
  "INSTRUMENT_NOT_FOUND",
  "AMBIGUOUS_INSTRUMENT",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_INVALID_KEY",
  "PROVIDER_TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "MALFORMED_PROVIDER_RESPONSE",
  "INSUFFICIENT_DATA",
  "AI_UNAVAILABLE",
  "AI_INVALID_RESPONSE",
  "INTERNAL_ERROR",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export type Instrument = z.infer<typeof InstrumentSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type MarketSnapshot = z.infer<typeof MarketSnapshotSchema>;
export type FinancialPeriod = z.infer<typeof FinancialPeriodSchema>;
export type PricePoint = z.infer<typeof PricePointSchema>;
export type QualityAssessment = z.infer<typeof QualityAssessmentSchema>;
export type QualityDecision = z.infer<typeof QualityDecisionSchema>;
export type ProfileRecommendation = z.infer<
  typeof ProfileRecommendationSchema
>;
export type FinalReport = z.infer<typeof FinalReportSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type AnalyzeErrorResponse = z.infer<typeof AnalyzeErrorResponseSchema>;
