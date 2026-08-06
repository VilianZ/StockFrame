import { z } from "zod";

import {
  ERROR_CODES,
  METRIC_STATUSES,
  QUALITY_FLAGS,
  RATINGS,
  RISK_PROFILES,
} from "./contracts";
import {
  MARKET_SNAPSHOT_VERSION,
  REPORT_SCHEMA_VERSION,
} from "./versions";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const finiteNumber = z.number().finite();

export const RiskProfileSchema = z.enum(RISK_PROFILES);
export const RatingSchema = z.enum(RATINGS);
export const MetricStatusSchema = z.enum(METRIC_STATUSES);
export const QualityFlagSchema = z.enum(QUALITY_FLAGS);
export const ErrorCodeSchema = z.enum(ERROR_CODES);
export const QualityDecisionSchema = z.enum([
  "insufficient",
  "degraded",
  "sufficient",
]);

export const AnalysisRequestSchema = z.strictObject({
  query: z.string().trim().min(1).max(100),
  focus: z.string().trim().max(500).optional(),
});

export const InstrumentSchema = z.strictObject({
  symbol: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(200),
  exchange: z.string().trim().min(1).max(50),
  currency: z.string().trim().length(3),
  region: z.string().trim().min(2).max(80),
});

export const InstrumentCandidateSchema = z.strictObject({
  instrument: InstrumentSchema,
  score: finiteNumber,
});

export const EvidenceSchema = z.strictObject({
  id: z.string().trim().min(1).max(100),
  source: z.string().trim().min(1).max(100),
  effectiveDate: dateString,
  valueReference: z.string().trim().min(1).max(200),
});

export const PricePointSchema = z.strictObject({
  date: dateString,
  close: finiteNumber,
  evidenceId: z.string().trim().min(1).max(100),
});

export const FinancialPeriodSchema = z.strictObject({
  periodEnd: dateString,
  periodType: z.enum(["quarterly", "annual"]),
  currency: z.string().trim().length(3).nullable(),
  values: z.record(z.string().trim().min(1), finiteNumber.nullable()),
  evidenceId: z.string().trim().min(1).max(100),
});

const metricFields = {
  id: z.string().trim().min(1).max(100),
  unit: z.string().trim().min(1).max(40),
  formulaId: z.string().trim().min(1).max(100),
  warnings: z.array(z.string().trim().min(1).max(200)),
  evidenceIds: z.array(z.string().trim().min(1).max(100)),
};

export const MetricSchema = z.discriminatedUnion("status", [
  z.strictObject({
    ...metricFields,
    status: z.literal("available"),
    value: finiteNumber,
  }),
  z.strictObject({
    ...metricFields,
    status: z.literal("not_available"),
    value: z.null(),
  }),
  z.strictObject({
    ...metricFields,
    status: z.literal("not_meaningful"),
    value: z.null(),
  }),
]);

export const MarketSnapshotSchema = z.strictObject({
  schemaVersion: z.literal(MARKET_SNAPSHOT_VERSION),
  instrument: InstrumentSchema,
  asOf: dateString,
  currency: z.string().trim().length(3),
  price: finiteNumber.nullable(),
  facts: z.record(z.string().trim().min(1), finiteNumber.nullable()),
  evidence: z.array(EvidenceSchema),
  prices: z.array(PricePointSchema),
  financials: z.strictObject({
    income: z.array(FinancialPeriodSchema),
    balanceSheet: z.array(FinancialPeriodSchema),
    cashFlow: z.array(FinancialPeriodSchema),
  }),
});

export const QualityAssessmentSchema = z.strictObject({
  score: finiteNumber.min(0).max(100),
  decision: QualityDecisionSchema,
  flags: z.array(QualityFlagSchema),
  aiEligible: z.boolean(),
  notes: z.array(z.string().trim().min(1).max(300)),
});

export const ProfileRecommendationSchema = z.strictObject({
  profile: RiskProfileSchema,
  rating: RatingSchema,
  confidence: finiteNumber.min(0).max(1),
  thesis: z.string().trim().min(1).max(2000),
  considerations: z.array(z.string().trim().min(1).max(500)),
  evidenceIds: z
    .array(z.string().trim().min(1).max(100))
    .min(1)
    .max(64)
    .refine((ids) => new Set(ids).size === ids.length, "Evidence IDs must be unique"),
});

const profilesSchema = z.strictObject({
  conservative: ProfileRecommendationSchema,
  moderate: ProfileRecommendationSchema,
  aggressive: ProfileRecommendationSchema,
});

export const FinalReportSchema = z
  .strictObject({
    schemaVersion: z.literal(REPORT_SCHEMA_VERSION),
    summary: z.string().trim().min(1).max(4000),
    strengths: z.array(z.string().trim().min(1).max(500)),
    risks: z.array(z.string().trim().min(1).max(500)),
    uncertainties: z.array(z.string().trim().min(1).max(500)),
    limitations: z.array(z.string().trim().min(1).max(500)),
    profiles: profilesSchema,
    disclaimer: z.string().trim().min(1).max(1000),
  })
  .superRefine((report, context) => {
    for (const profile of RISK_PROFILES) {
      if (report.profiles[profile].profile !== profile) {
        context.addIssue({
          code: "custom",
          path: ["profiles", profile, "profile"],
          message: `Profile must be ${profile}`,
        });
      }
    }
  });

export const AnalyzeResponseSchema = z.strictObject({
  requestId: z.string().uuid(),
  instrument: InstrumentSchema,
  snapshot: MarketSnapshotSchema,
  metrics: z.array(MetricSchema),
  quality: QualityAssessmentSchema,
  report: FinalReportSchema,
});

export const AnalyzeErrorResponseSchema = z.strictObject({
  requestId: z.string().uuid(),
  error: z.strictObject({
    code: ErrorCodeSchema,
    message: z.string().trim().min(1).max(500),
    retryable: z.boolean(),
    candidates: z.array(InstrumentCandidateSchema).min(1).max(16).optional(),
  }),
});
