import { describe, expect, test } from "vitest";

import { MarketSnapshotSchema, MARKET_SNAPSHOT_VERSION, type Metric } from "../../lib/domain";
import { buildEvidencePacket } from "../../lib/quality";

function metric(id: string, evidenceIds: string[]): Metric {
  return { id, value: 1, unit: "ratio", formulaId: "test-v1", status: "available", warnings: [], evidenceIds };
}

describe("bounded evidence packet", () => {
  test("is deterministic, bounded, and excludes raw provider payloads", () => {
    const snapshot = MarketSnapshotSchema.parse({
      schemaVersion: MARKET_SNAPSHOT_VERSION,
      instrument: { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "USD", region: "United States" },
      asOf: "2026-08-05", currency: "USD", price: 200,
      facts: Object.fromEntries(Array.from({ length: 70 }, (_, index) => [`fact-${index}`, index])),
      evidence: Array.from({ length: 130 }, (_, index) => ({ id: `e-${index}`, source: "fixture", effectiveDate: "2026-08-05", valueReference: `fact-${index}` })),
      prices: [{ date: "2026-08-05", close: 200, evidenceId: "e-0" }],
      financials: { income: [], balanceSheet: [], cashFlow: [] },
    });
    const quality = { score: 90, decision: "degraded" as const, flags: [], aiEligible: true, notes: ["Fixture"] };
    const metrics = [metric("z", ["e-2"]), metric("a", ["e-1"]), ...Array.from({ length: 40 }, (_, index) => metric(`x-${index}`, [`e-${index + 3}`]))];
    const packet = buildEvidencePacket(snapshot, metrics, quality);

    expect(Object.keys(packet.facts)).toHaveLength(64);
    expect(packet.metrics).toHaveLength(32);
    expect(packet.evidence).toHaveLength(32);
    expect(JSON.stringify(packet)).not.toContain("raw");
    expect(packet.metrics.map((item) => item.id)).toEqual([...packet.metrics].sort((left, right) => left.id.localeCompare(right.id)).map((item) => item.id));
  });
});
