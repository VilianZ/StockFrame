import { describe, expect, test } from "vitest";

import {
  AnalysisRequestSchema,
  AnalyzeErrorResponseSchema,
  AnalyzeResponseSchema,
  DOMAIN_SCHEMA_VERSION,
  FinalReportSchema,
  MARKET_SNAPSHOT_VERSION,
  MetricSchema,
  REPORT_SCHEMA_VERSION,
  canonicalSerialize,
  sha256Hex,
} from "../../lib/domain";

const profile = (name: "conservative" | "moderate" | "aggressive") => ({
  profile: name,
  rating: "neutral" as const,
  confidence: 0.5,
  thesis: `Thesis ${name}`,
  considerations: ["Needs more evidence"],
  evidenceIds: ["evidence-1"],
});

const validReport = () => ({
  schemaVersion: REPORT_SCHEMA_VERSION,
  summary: "Ringkasan edukatif.",
  strengths: ["Arus kas perlu ditinjau."],
  risks: ["Data masih terbatas."],
  uncertainties: ["Periode terbaru belum lengkap."],
  limitations: ["Bukan nasihat keuangan personal."],
  profiles: {
    conservative: profile("conservative"),
    moderate: profile("moderate"),
    aggressive: profile("aggressive"),
  },
  disclaimer: "Untuk tujuan edukasi.",
});

describe("M0 domain contracts", () => {
  test("validates and normalizes the analysis request", () => {
    const result = AnalysisRequestSchema.safeParse({
      query: "  AAPL ",
      focus: "  fundamental  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ query: "AAPL", focus: "fundamental" });
    }
  });

  test("rejects empty, oversized, and unknown request fields", () => {
    expect(AnalysisRequestSchema.safeParse({ query: "" }).success).toBe(false);
    expect(
      AnalysisRequestSchema.safeParse({ query: "AAPL", unexpected: true })
        .success,
    ).toBe(false);
    expect(
      AnalysisRequestSchema.safeParse({ query: "AAPL", focus: "x".repeat(501) })
        .success,
    ).toBe(false);
  });

  test("requires the exact three unique risk profiles", () => {
    const result = FinalReportSchema.safeParse(validReport());
    expect(result.success).toBe(true);

    const missing = validReport();
    delete (missing.profiles as Partial<typeof missing.profiles>).aggressive;
    expect(FinalReportSchema.safeParse(missing).success).toBe(false);

    const unknown = validReport() as Record<string, unknown>;
    (unknown.profiles as Record<string, unknown>).speculative = profile(
      "aggressive",
    );
    expect(FinalReportSchema.safeParse(unknown).success).toBe(false);

    const duplicateAsArray = validReport() as Record<string, unknown>;
    duplicateAsArray.profiles = [
      profile("conservative"),
      profile("moderate"),
      profile("moderate"),
    ];
    expect(FinalReportSchema.safeParse(duplicateAsArray).success).toBe(false);
  });

  test("rejects a profile whose value does not match its canonical key", () => {
    const invalid = validReport();
    invalid.profiles.moderate = profile("aggressive");
    expect(FinalReportSchema.safeParse(invalid).success).toBe(false);
  });

  test("exports versioned snapshot and response schemas", () => {
    const instrument = {
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "NASDAQ",
      currency: "USD",
      region: "United States",
    };
    const evidence = {
      id: "evidence-1",
      source: "fixture",
      effectiveDate: "2026-08-05",
      valueReference: "quote.close",
    };
    const response = {
      requestId: "00000000-0000-4000-8000-000000000001",
      instrument,
      snapshot: {
        schemaVersion: MARKET_SNAPSHOT_VERSION,
        instrument,
        asOf: "2026-08-05",
        currency: "USD",
        price: 200,
        facts: { revenue: 1000 },
        evidence: [evidence],
        prices: [
          { date: "2026-08-05", close: 200, evidenceId: "evidence-1" },
        ],
        financials: {
          income: [],
          balanceSheet: [],
          cashFlow: [],
        },
      },
      metrics: [
        {
          id: "pe",
          value: 20,
          unit: "ratio",
          formulaId: "pe-ttm-v1",
          status: "available" as const,
          warnings: [],
          evidenceIds: ["evidence-1"],
        },
      ],
      quality: {
        score: 90,
        decision: "sufficient",
        flags: [],
        aiEligible: true,
        notes: [],
      },
      report: validReport(),
    };

    expect(AnalyzeResponseSchema.safeParse(response).success).toBe(true);
    expect(DOMAIN_SCHEMA_VERSION).toBe("m0.domain.1");
    expect(
      AnalyzeErrorResponseSchema.safeParse({
        requestId: response.requestId,
        error: {
          code: "INVALID_REQUEST",
          message: "Permintaan tidak valid.",
          retryable: false,
        },
      }).success,
    ).toBe(true);
  });

  test("enforces metric value and status coherence", () => {
    const metric = {
      id: "pe",
      unit: "ratio",
      formulaId: "pe-ttm-v1",
      warnings: [],
      evidenceIds: [],
    };

    expect(
      MetricSchema.safeParse({ ...metric, status: "available", value: 20 })
        .success,
    ).toBe(true);
    expect(
      MetricSchema.safeParse({ ...metric, status: "available", value: null })
        .success,
    ).toBe(false);
    expect(
      MetricSchema.safeParse({ ...metric, status: "not_available", value: null })
        .success,
    ).toBe(true);
    expect(
      MetricSchema.safeParse({ ...metric, status: "not_available", value: 0 })
        .success,
    ).toBe(false);
    expect(
      MetricSchema.safeParse({
        ...metric,
        status: "not_meaningful",
        value: null,
      }).success,
    ).toBe(true);
    expect(
      MetricSchema.safeParse({ ...metric, status: "not_meaningful", value: -1 })
        .success,
    ).toBe(false);
  });
});

describe("canonical serialization and hashing", () => {
  test("sorts object keys while preserving array order", () => {
    expect(canonicalSerialize({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(canonicalSerialize({ items: ["b", "a"] })).toBe(
      '{"items":["b","a"]}',
    );
    expect(canonicalSerialize({ value: -0 })).toBe('{"value":0}');
  });

  test("produces the same SHA-256 for equivalent object key order", async () => {
    const first = await sha256Hex({ query: "AAPL", options: { focus: "risk" } });
    const second = await sha256Hex({ options: { focus: "risk" }, query: "AAPL" });

    expect(first).toBe(second);
    expect(first).toBe(
      "9a5414055f71a33acd164ee23eecc7954aaafd8d5372a06acaa3b0cd3cac88c5",
    );
  });

  test("rejects non-finite values", () => {
    expect(() => canonicalSerialize({ value: Number.NaN })).toThrow(
      "non-finite",
    );
  });
});
