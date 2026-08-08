import { describe, expect, test } from "vitest";

import { MarketSnapshotSchema, MARKET_SNAPSHOT_VERSION, type Metric } from "../../lib/domain";
import { buildAliasedEvidencePacket } from "../../lib/ai";
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

  test("includes at most twenty newest corporate actions and their evidence", () => {
    const events = Array.from({ length: 25 }, (_, index) => ({
      date: `2026-${String(25 - Math.floor(index / 2)).padStart(2, "0")}-${String((index % 2) + 1).padStart(2, "0")}`,
      ticker: "AAPL",
      kind: "dividend" as const,
      rawAction: "dividend",
      value: index,
      relatedTicker: null,
      relatedName: null,
      notes: null,
      evidenceId: `ca-${index}`,
    }));
    const snapshot = MarketSnapshotSchema.parse({
      schemaVersion: MARKET_SNAPSHOT_VERSION,
      instrument: { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "USD", region: "United States" },
      asOf: "2026-08-05", currency: "USD", price: 200,
      facts: {}, evidence: events.map((event) => ({ id: event.evidenceId, source: "corporate-action", effectiveDate: event.date, valueReference: "corporate-action.dividend" })),
      prices: [], financials: { income: [], balanceSheet: [], cashFlow: [] },
      corporateActions: { status: "available", events, warnings: [] },
    });
    const packet = buildEvidencePacket(snapshot, [], { score: 90, decision: "degraded", flags: [], aiEligible: true, notes: ["Fixture"] });
    expect(packet.corporateActions?.events).toHaveLength(20);
    expect(packet.evidence).toHaveLength(20);
    expect(packet.corporateActions?.events[0]?.evidenceId).toBe("ca-0");
  });

  test("reserves evidence slots for corporate actions when price evidence exceeds the packet bound", () => {
    const corporateEvents = Array.from({ length: 20 }, (_, index) => ({
      date: "2026-06-15",
      ticker: "AAPL",
      kind: "dividend" as const,
      rawAction: "dividend",
      value: index,
      relatedTicker: null,
      relatedName: null,
      notes: null,
      evidenceId: `ca-${index}`,
    }));
    const priceEvidence = Array.from({ length: 140 }, (_, index) => ({
      id: `price-${index}`,
      source: "market-data.prices",
      effectiveDate: "2026-08-05",
      valueReference: "price.close",
    }));
    const snapshot = MarketSnapshotSchema.parse({
      schemaVersion: MARKET_SNAPSHOT_VERSION,
      instrument: { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "USD", region: "United States" },
      asOf: "2026-08-05", currency: "USD", price: 200, facts: {},
      evidence: [
        ...corporateEvents.map((event) => ({ id: event.evidenceId, source: "corporate-action", effectiveDate: event.date, valueReference: "corporate-action.dividend" })),
        ...priceEvidence,
      ],
      prices: [], financials: { income: [], balanceSheet: [], cashFlow: [] },
      corporateActions: { status: "available", events: corporateEvents, warnings: [] },
    });
    const packet = buildEvidencePacket(snapshot, [metric("price_return", priceEvidence.map((item) => item.id))], { score: 90, decision: "degraded", flags: [], aiEligible: true, notes: ["Fixture"] });
    const corporateIds = packet.corporateActions?.events.map((event) => event.evidenceId) ?? [];
    expect(corporateIds).toHaveLength(20);
    expect(corporateIds.every((id) => packet.evidence.some((item) => item.id === id))).toBe(true);
    const aliased = buildAliasedEvidencePacket(packet);
    expect(aliased.packet.corporateActions?.events.every((event) => /^E\d+$/.test(event.evidenceId))).toBe(true);
  });
});
