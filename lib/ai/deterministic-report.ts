import { FinalReportSchema, REPORT_SCHEMA_VERSION, type ProfileRecommendation } from "../domain";
import type { EvidencePacket } from "../quality";

function availableMetricIds(packet: EvidencePacket): string[] {
  return packet.metrics.filter((metric) => metric.status === "available").map((metric) => metric.id);
}

function firstAvailable(packet: EvidencePacket, preferred: string[]): string {
  const available = new Set(availableMetricIds(packet));
  return preferred.find((id) => available.has(id)) ?? availableMetricIds(packet)[0] ?? "data_quality";
}

function availableIds(packet: EvidencePacket, preferred: string[]): string[] {
  const available = new Set(availableMetricIds(packet));
  const ids = preferred.filter((id) => available.has(id));
  return ids.length ? ids : [firstAvailable(packet, [])];
}

function claim(text: string, metricIds: string[]) {
  return { text, metricIds };
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

export function buildDeterministicReport(
  packet: EvidencePacket,
  profiles: Record<"conservative" | "moderate" | "aggressive", ProfileRecommendation>,
) {
  const profitability = availableIds(packet, ["roe", "roa", "roic", "net_margin", "operating_margin", "gross_margin"]);
  const valuation = availableIds(packet, ["pe", "pbv", "book_value_per_share"]);
  const risk = availableIds(packet, ["volatility", "price_return", "der", "current_ratio"]);
  const primary = firstAvailable(packet, ["roe", "roa", "net_margin", "pe", "der", "volatility"]);
  const limitations = [
    ...packet.quality.notes,
    "Angka dan rasio pada report dihitung deterministik dari snapshot Business Quant.",
    "Interpretasi profil risiko berasal dari model AI dan tetap dibatasi oleh metrik yang tersedia.",
  ].slice(0, 16);
  const corporateActionClaims = (packet.corporateActions?.events ?? []).slice(0, 20).map((event) => ({
    evidenceId: event.evidenceId,
    claim: `Peristiwa terstruktur tercatat pada ${event.date}; rincian tersedia pada tab Aksi korporasi.`,
  }));

  return FinalReportSchema.parse({
    schemaVersion: REPORT_SCHEMA_VERSION,
    summary: claim("Snapshot fundamental dan pasar telah dihitung dari data terstruktur.", [primary]),
    strengths: [claim("Metrik yang tersedia dapat ditelusuri ke data laporan keuangan.", profitability)],
    risks: [claim("Metrik yang tersedia perlu dibaca bersama kualitas data serta periode pengamatan.", unique([...valuation, ...risk]).slice(0, 16))],
    uncertainties: [claim("Data historis dan metrik saat ini tidak memastikan hasil pada periode berikutnya.", risk)],
    limitations,
    corporateActionClaims,
    profiles,
    disclaimer: "Alat bantu riset, bukan rekomendasi transaksi.",
  });
}
