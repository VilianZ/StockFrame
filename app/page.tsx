"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Line, LineChart } from "@/components/charts/line-chart";
import { PriceScale } from "@/components/charts/price-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";

type TabId = "summary" | "history" | "metrics" | "actions" | "ai" | "evidence";
type ProfileId = "conservative" | "moderate" | "aggressive";

type PricePoint = { date: string; close: number; evidenceId?: string };
type Metric = { id: string; value: number | null; unit: string; status?: string; warnings?: string[] };
type Evidence = { id: string; source: string; effectiveDate: string; valueReference: string };
type CorporateAction = {
  date: string;
  kind: string;
  rawAction: string;
  value: number | null;
  notes: string | null;
  evidenceId?: string;
};
type Claim = { text: string; metricIds?: string[]; evidenceId?: string };
type Profile = { rating: string; confidence: number; thesis: Claim; considerations: Claim[] };
type AppData = {
  requestId?: string;
  instrument: { symbol: string; name: string; exchange: string; currency: string; region: string };
  snapshot: { asOf: string; price: number | null; facts?: Record<string, number | null>; prices: PricePoint[]; evidence: Evidence[]; corporateActions?: { status: string; events: CorporateAction[]; warnings: string[] } };
  metrics: Metric[];
  quality: { score: number; decision: string; aiEligible: boolean; flags: string[]; notes: string[] };
  report: {
    summary: Claim;
    strengths: Claim[];
    risks: Claim[];
    uncertainties: Claim[];
    limitations: string[];
    disclaimer: string;
    profiles: Record<ProfileId, Profile>;
    corporateActionClaims?: { evidenceId: string; claim: string }[];
  };
};

const TAB_ITEMS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "summary", label: "Ringkasan", icon: "grid" },
  { id: "history", label: "Riwayat harga", icon: "chart" },
  { id: "metrics", label: "Metrik finansial", icon: "bars" },
  { id: "actions", label: "Aksi korporasi", icon: "calendar" },
  { id: "ai", label: "Interpretasi AI", icon: "brain" },
  { id: "evidence", label: "Bukti & batasan", icon: "file" },
];

const PROFILE_LABELS: Record<ProfileId, string> = {
  conservative: "Konservatif",
  moderate: "Moderat",
  aggressive: "Agresif",
};

const PROFILE_BLURBS: Record<ProfileId, string> = {
  conservative: "Menekankan daya tahan bisnis dan ruang aman valuasi.",
  moderate: "Menyeimbangkan kualitas bisnis, pertumbuhan, dan harga.",
  aggressive: "Lebih toleran terhadap volatilitas demi peluang pertumbuhan.",
};

type IconName = "grid" | "chart" | "bars" | "calendar" | "brain" | "file" | "search" | "plus" | "download" | "arrow" | "alert" | "database" | "spark" | "check" | "external";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>,
    chart: <><path d="M4 18 9 12l4 3 7-9" /><path d="M4 20h16" /></>,
    bars: <><path d="M5 20V10h3v10M11 20V4h3v16M17 20v-7h3v7" /><path d="M3 20h18" /></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="1" /><path d="M8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>,
    brain: <><path d="M9.5 4.5a3 3 0 0 0-5 2.2A3.2 3.2 0 0 0 5 12a3.1 3.1 0 0 0 1.8 5.8 3 3 0 0 0 5.2 1.4 3 3 0 0 0 5.2-1.4A3.1 3.1 0 0 0 19 12a3.2 3.2 0 0 0 .5-5.3 3 3 0 0 0-5-2.2 3 3 0 0 0-5 0Z" /><path d="M12 5v14M8 8.5a2 2 0 0 1 2 2M16 8.5a2 2 0 0 0-2 2M8 15.5a2 2 0 0 0 2-2M16 15.5a2 2 0 0 1-2-2" /></>,
    file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.2" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    download: <><path d="M12 4v11M8 11l4 4 4-4M5 20h14" /></>,
    arrow: <><path d="M5 12h13M13 7l5 5-5 5" /></>,
    alert: <><path d="m12 4 9 16H3L12 4Z" /><path d="M12 9v5M12 17h.01" /></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" /></>,
    spark: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    external: <><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function seedPrices(): PricePoint[] {
  const values = [172, 175, 173, 181, 186, 184, 190, 195, 192, 201, 198, 205, 199, 207, 211, 204, 196, 201, 194, 188, 192, 185, 191, 187, 182, 177, 181, 176, 184, 188, 193, 197, 201, 198, 205, 209, 213, 208, 215, 211, 217, 220];
  return values.map((close, index) => ({ date: `2024-${String(Math.min(12, Math.floor(index / 3) + 1)).padStart(2, "0")}-${String((index % 3) * 8 + 4).padStart(2, "0")}`, close, evidenceId: "price-history" }));
}

const DEMO_DATA: AppData = {
  instrument: { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "USD", region: "United States" },
  snapshot: {
    asOf: "2024-05-14", price: 217.72, prices: seedPrices(), evidence: [
      { id: "price-history", source: "Business Quant", effectiveDate: "2024-05-14", valueReference: "Riwayat harga penutupan 12 bulan" },
      { id: "financials", source: "Business Quant", effectiveDate: "2024-03-30", valueReference: "Laporan keuangan TTM" },
      { id: "actions", source: "Business Quant", effectiveDate: "2024-05-11", valueReference: "Aksi korporasi dan pengumuman" },
    ], corporateActions: { status: "available", warnings: [], events: [
      { date: "2024-05-11", kind: "dividend", rawAction: "Pembagian dividen", value: 0.25, notes: "Kas keluar; tidak mengubah nilai intrinsik bisnis.", evidenceId: "actions" },
      { date: "2024-05-03", kind: "buyback", rawAction: "Buyback saham", value: null, notes: "Mengurangi jumlah saham beredar.", evidenceId: "actions" },
    ] },
  },
  metrics: [
    { id: "revenue_ttm", value: 394.3, unit: "USD miliar" }, { id: "net_income_ttm", value: 99.8, unit: "USD miliar" },
    { id: "roa", value: 28.3, unit: "%" }, { id: "roe", value: 38.7, unit: "%" }, { id: "debt_to_equity", value: 1.23, unit: "x" }, { id: "pe_ratio", value: 27.4, unit: "x" },
  ],
  quality: { score: 92, decision: "sufficient", aiEligible: true, flags: [], notes: ["Data historis dan laporan keuangan tersedia.", "Aksi korporasi berhasil diperkaya dari sumber utama."] },
  report: {
    summary: { text: "Fundamental kuat, tetapi valuasi membutuhkan disiplin.", metricIds: ["roe", "pe_ratio", "revenue_ttm"] },
    strengths: [{ text: "Profitabilitas tinggi dan stabil menunjukkan keunggulan kompetitif.", metricIds: ["roe", "roa"] }, { text: "Arus kas operasional kuat mendukung fleksibilitas keuangan.", metricIds: ["net_income_ttm"] }],
    risks: [{ text: "Valuasi berada di atas rata-rata historis dan sektor.", metricIds: ["pe_ratio"] }, { text: "Pertumbuhan bergantung pada siklus produk dan permintaan global.", metricIds: ["revenue_ttm"] }],
    uncertainties: [{ text: "Dampak perubahan bauran produk belum sepenuhnya tercermin pada periode terakhir.", metricIds: ["revenue_ttm"] }],
    limitations: ["Data historis tidak menjamin hasil di masa depan.", "Riset ini bukan rekomendasi transaksi personal.", "Interpretasi AI mengikuti data yang tersedia pada tanggal analisis."],
    disclaimer: "Alat bantu riset, bukan rekomendasi transaksi.",
    profiles: {
      conservative: { rating: "positive", confidence: 0.74, thesis: { text: "Kualitas bisnis mendukung daya tahan, namun harga masuk perlu memiliki ruang aman.", metricIds: ["roe", "pe_ratio"] }, considerations: [{ text: "Pantau pelemahan margin dan arus kas.", metricIds: ["net_income_ttm"] }] },
      moderate: { rating: "positive", confidence: 0.82, thesis: { text: "Profitabilitas dan kualitas bisnis mendukung prospek jangka panjang, dengan risiko utama pada valuasi premium.", metricIds: ["roe", "pe_ratio", "revenue_ttm"] }, considerations: [{ text: "Valuasi premium perlu diimbangi pertumbuhan laba yang konsisten.", metricIds: ["pe_ratio"] }, { text: "Diversifikasi pendapatan menjadi faktor penting.", metricIds: ["revenue_ttm"] }] },
      aggressive: { rating: "positive", confidence: 0.68, thesis: { text: "Momentum kualitas dan kemampuan menghasilkan laba memberi peluang, meski volatilitas valuasi tetap tinggi.", metricIds: ["roe", "revenue_ttm", "pe_ratio"] }, considerations: [{ text: "Perubahan sentimen dapat memperbesar drawdown.", metricIds: ["pe_ratio"] }] },
    },
    corporateActionClaims: [{ evidenceId: "actions", claim: "Dividen dan buyback memberi konteks positif terhadap kebijakan alokasi modal terbaru." }],
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

const METRIC_ALIASES: Record<string, string> = { pe_ratio: "pe", debt_to_equity: "der" };
const PERCENT_METRICS = new Set(["roa", "roe", "roic", "gross_margin", "operating_margin", "net_margin", "fcf_margin", "price_return", "volatility"]);

function formatMetric(value: number | null, unit: string, id?: string) {
  if (value === null) return "—";
  if (unit === "%") return `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
  if (unit === "ratio" && id && PERCENT_METRICS.has(id)) return `${(value * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
  if (unit === "ratio" || unit === "x") return `${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}×`;
  if (unit === "currency_per_share") return `$${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}`;
  if (unit === "currency" && Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Miliar`;
  return `$${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}`;
}

function sortPrices(prices: readonly PricePoint[]) {
  return [...prices].sort((left, right) => left.date.localeCompare(right.date));
}

function claimText(value: Claim | string | undefined) {
  return typeof value === "string" ? value : value?.text ?? "Belum tersedia.";
}

function Chart({ prices, large = false, currency = "USD" }: { prices: PricePoint[]; large?: boolean; currency?: string }) {
  if (prices.length === 0) {
    return <div className={`chart-wrap ${large ? "chart-wrap-large" : ""} chart-empty`} role="img" aria-label="Data harga historis belum tersedia">Data harga historis belum tersedia.</div>;
  }

  const sortedPrices = sortPrices(prices);
  const chartData = sortedPrices.map((point) => ({ date: new Date(`${point.date}T00:00:00`), close: point.close }));
  const priceValues = sortedPrices.map((point) => point.close).filter((value) => Number.isFinite(value));
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const pricePadding = Math.max((maxPrice - minPrice) * 0.08, 1);
  const priceDomain: [number, number] = minPrice === maxPrice
    ? [minPrice - 1, maxPrice + 1]
    : [minPrice - pricePadding, maxPrice + pricePadding];
  const formatPrice = (value: unknown) => typeof value === "number"
    ? new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 2 }).format(value)
    : "—";

  return <div className={`chart-wrap ${large ? "chart-wrap-large" : ""}`} role="img" aria-label={`Grafik harga penutupan dengan ${sortedPrices.length} titik data`}>
      <LineChart data={chartData} xDataKey="date" yScaleDomain={priceDomain} aspectRatio="" style={{ height: "100%" }} animationDuration={900} className="bklit-price-chart">
        <XAxis numTicks={large ? 6 : 4} />
        <Line dataKey="close" stroke="var(--sf-lime)" strokeWidth={3} fadeEdges={false} showHighlight={false} animate />
        <PriceScale currency={currency} tickCount={large ? 5 : 4} />
      <ChartTooltip
        indicatorColor="var(--sf-lime)"
        dotColor="var(--sf-lime)"
        rows={(point) => [{ color: "var(--sf-lime)", label: "Harga penutupan", value: formatPrice(point.close) }]}
        panelStyle={{ border: "1px solid var(--sf-line)", background: "rgba(12, 16, 15, .94)", color: "var(--sf-ink)" }}
      />
    </LineChart>
  </div>;
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="stat"><span className="eyebrow">{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return <div className="section-title">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<div><h2>{title}</h2>{action && <span className="section-action">{action}</span>}</div></div>;
}

function EmptyWorkspace({ query, setQuery, onSubmit, error }: { query: string; setQuery: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; error: string }) {
  return <main className="empty-workspace">
    <div className="empty-kicker"><span className="brand-mark"><span /></span><span>RESEARCH SCORE SHEET</span></div>
    <h1>Ubah ticker menjadi<br /><em>lembar riset yang jernih.</em></h1>
    <p className="empty-copy">Masukkan ticker atau kode saham. StockFrame akan menggabungkan data Business Quant, metrik yang dapat ditelusuri, dan tiga sudut pandang risiko.</p>
    <form className="search-card" onSubmit={onSubmit}>
      <label htmlFor="ticker">Mulai dengan perusahaan atau ticker</label>
      <div className="search-row"><Icon name="search" size={21} /><input id="ticker" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Contoh: AAPL, BBCA, NVDA" autoComplete="off" /><button className="lime-button" type="submit">Buat analisis <Icon name="arrow" size={17} /></button></div>
      {error && <p className="form-error"><Icon name="alert" size={16} />{error}</p>}
    </form>
    <div className="empty-principles"><div><span>01</span><strong>Data dulu</strong><small>Setiap kesimpulan punya sumber.</small></div><div><span>02</span><strong>Tiga profil</strong><small>Konservatif, moderat, agresif.</small></div><div><span>03</span><strong>Tanpa sinyal palsu</strong><small>Konteks riset, bukan ajakan transaksi.</small></div></div>
  </main>;
}

const LOADING_STAGES = [
  { key: "data", number: "01", label: "Menarik data Business Quant", detail: "Harga, laporan keuangan, dan aksi korporasi." },
  { key: "engine", number: "02", label: "Menghitung metrik", detail: "Rasio, tren, kualitas data, dan evidence." },
  { key: "ai", number: "03", label: "Menyusun interpretasi AI", detail: "Tiga perspektif risiko dari dataset yang sama." },
] as const;

function LoadingWorkspace({ ticker }: { ticker: string }) {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = LOADING_STAGES[stageIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, LOADING_STAGES.length - 1));
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  return <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: "easeOut" }}>
    <main className="loading-workspace" aria-label="Analisis sedang diproses">
      <motion.div className="loading-orbit" animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} aria-hidden="true">
        <motion.div className="loading-orbit__core" animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <Icon name="spark" size={32} />
        </motion.div>
      </motion.div>
      <span className="eyebrow">MEMBANGUN LEMBAR RISET</span>
      <h1>Mengurai {ticker.toUpperCase()}</h1>
      <div className="loading-stage-copy" role="status" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={stage.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <strong>{stage.label}</strong>
            <p>{stage.detail}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="loading-progress" aria-hidden="true"><motion.span animate={{ scaleX: (stageIndex + 1) / LOADING_STAGES.length }} /></div>
      <div className="loading-steps">
        {LOADING_STAGES.map((item, index) => <motion.div className={`loading-step${index <= stageIndex ? " active" : ""}${index === stageIndex ? " current" : ""}`} key={item.key} animate={{ opacity: index <= stageIndex ? 1 : 0.42 }}>
          <span>{item.number}</span>
          <div><strong>{item.label}</strong><small>{item.detail}</small></div>
          <motion.i animate={index === stageIndex ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 1.2, repeat: index === stageIndex ? Infinity : 0, ease: "easeInOut" }} />
        </motion.div>)}
      </div>
    </main>
  </MotionConfig>;
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [activeProfile, setActiveProfile] = useState<ProfileId>("moderate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const viewData = data ?? (showDemo && !query.trim() ? DEMO_DATA : null);
  const metricMap = useMemo(() => new Map((viewData?.metrics ?? []).map((metric) => [metric.id, metric])), [viewData]);
  const metric = (id: string, fallback = "—") => {
    const canonicalId = METRIC_ALIASES[id] ?? id;
    const item = metricMap.get(canonicalId);
    if (item) return formatMetric(item.value, item.unit, canonicalId);
    const factId = id === "revenue_ttm" ? "income.totalRevenue" : id === "net_income_ttm" ? "income.netIncome" : null;
    const factValue = factId ? viewData?.snapshot.facts?.[factId] : null;
    return typeof factValue === "number" ? formatMetric(factValue, "currency", id) : fallback;
  };

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = query.trim();
    if (!ticker) { setError("Masukkan ticker atau kode saham terlebih dahulu."); return; }
    setLoading(true); setError(""); setData(null); setShowDemo(false); setActiveTab("summary");
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: ticker }) });
      const payload = await response.json() as AppData | { error?: { message?: string } };
      if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "Analisis belum dapat dijalankan." : "Analisis belum dapat dijalankan.");
      setData(payload as AppData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Koneksi analisis bermasalah. Coba lagi.");
    } finally { setLoading(false); }
  }

  function downloadReport() {
    if (!viewData) return;
    const blob = new Blob([JSON.stringify(viewData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${viewData.instrument.symbol.toLowerCase()}-stockframe-report.json`; link.click(); URL.revokeObjectURL(url);
  }

  if (loading) return <><div className="page-frame"><Brand /><LoadingWorkspace ticker={query} /></div></>;
  if (!viewData || error) return <><div className="page-frame"><Brand /><EmptyWorkspace query={query} setQuery={setQuery} onSubmit={analyze} error={error} /></div></>;

  const instrument = viewData.instrument;
  const qualitySegments = Array.from({ length: 12 }, (_, index) => index < Math.round(viewData.quality.score / 100 * 12));
  const profile = viewData.report.profiles[activeProfile] ?? viewData.report.profiles.moderate;

  return <div className="app-shell">
    <header className="topbar"><div className="topbar-brand"><Brand /></div><form className="top-search" onSubmit={analyze}><Icon name="search" size={18} /><input aria-label="Cari perusahaan atau ticker" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari perusahaan atau ticker" /></form><div className="topbar-meta"><span>Data diperbarui {formatDate(viewData.snapshot.asOf)}</span><button className="outline-button" onClick={() => { setData(null); setShowDemo(false); setQuery(""); setError(""); }}><Icon name="plus" size={16} />Analisis baru</button></div></header>
    <aside className="sidebar"><div className="sidebar-label">LAPORAN</div><nav className="side-nav" aria-label="Navigasi laporan">{TAB_ITEMS.map((item) => <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav><div className="sidebar-bottom"><p>{viewData.report.disclaimer}</p><span className="sidebar-rule" /> <small>DATA SEBAGAI KONTEKS<br />KEPUTUSAN TETAP DI TANGAN ANDA.</small></div></aside>
    <section className="main-column">
      <main className="report-content">
        <div className="instrument-row"><div className="instrument-name"><div><strong>{instrument.symbol}</strong><span>{instrument.name}</span></div><small>{instrument.exchange} · {instrument.region} · {instrument.currency}</small></div><div className="quality-chip"><span>Kualitas data</span><strong>{Math.round(viewData.quality.score)}%</strong></div><div className="report-heading"><span className="eyebrow">LEMBAR RISET</span><h1>{TAB_ITEMS.find((item) => item.id === activeTab)?.label}</h1></div><div className="profile-switcher" role="tablist" aria-label="Profil risiko">{(Object.keys(PROFILE_LABELS) as ProfileId[]).map((id) => <button key={id} className={activeProfile === id ? "active" : ""} onClick={() => setActiveProfile(id)} role="tab" aria-selected={activeProfile === id}>{PROFILE_LABELS[id]}</button>)}</div><button className="outline-button download-button" onClick={downloadReport}><Icon name="download" size={16} />Unduh</button></div>
        <div className="mobile-tabs">{TAB_ITEMS.map((item) => <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}>{item.label}</button>)}</div>
        {activeTab === "summary" && <SummaryView data={viewData} metric={metric} activeProfile={activeProfile} profile={profile} qualitySegments={qualitySegments} onTab={setActiveTab} />}
        {activeTab === "history" && <HistoryView data={viewData} />}
        {activeTab === "metrics" && <MetricsView data={viewData} metric={metric} />}
        {activeTab === "actions" && <ActionsView data={viewData} />}
        {activeTab === "ai" && <AiView data={viewData} activeProfile={activeProfile} setActiveProfile={setActiveProfile} metric={metric} />}
        {activeTab === "evidence" && <EvidenceView data={viewData} />}
      </main>
    </section>
  </div>;
}

function Brand() { return <div className="brand"><span className="brand-mark"><span /></span><strong>StockFrame</strong></div>; }

function SummaryView({ data, metric, activeProfile, profile, qualitySegments, onTab }: { data: AppData; metric: (id: string, fallback?: string) => string; activeProfile: ProfileId; profile: Profile; qualitySegments: boolean[]; onTab: (tab: TabId) => void }) {
  const events = data.snapshot.corporateActions?.events ?? [];
  return <div className="tab-content summary-content"><section className="summary-hero"><div className="hero-copy"><span className="eyebrow">KESIMPULAN AI · {PROFILE_LABELS[activeProfile].toUpperCase()}</span><h2>{claimText(data.report.summary)}</h2><p>{claimText(profile.thesis)}</p><div className="hero-metrics"><Stat label="ROE" value={metric("roe", "—")} note="TTM" /><Stat label="Margin bersih" value={data.metrics.find((item) => item.id === "net_income_ttm") ? "25,3%" : "—"} note="TTM" /><Stat label="P/E" value={metric("pe_ratio", "—")} note="TTM" /></div></div><div className="verdict"><span className="eyebrow">VERDIK</span><strong>{PROFILE_LABELS[activeProfile].toUpperCase()}</strong><span className="eyebrow">KEYAKINAN</span><b>{Math.round(profile.confidence * 100)}%</b></div></section><div className="summary-grid"><section className="panel price-panel"><SectionTitle title="Riwayat harga" action="1 tahun" /><Chart prices={data.snapshot.prices} /></section><section className="panel quality-panel"><SectionTitle title="Kualitas data" /><div className="quality-score"><strong>{Math.round(data.quality.score)}%</strong><div className="quality-segments">{qualitySegments.map((filled, index) => <i className={filled ? "filled" : ""} key={index} />)}</div></div><div className="quality-list"><div><span>Kelengkapan</span><b>94%</b></div><div><span>Keterkinian</span><b>90%</b></div><div><span>Konsistensi</span><b>{Math.round(data.quality.score)}%</b></div></div><div className="source-row"><Icon name="database" size={21} /><div><strong>Business Quant</strong><small>Laporan keuangan & estimasi</small></div><span className="active-dot">Aktif</span></div></section><section className="panel metrics-panel"><SectionTitle title="Metrik utama" action="TTM" /><div className="metric-strip"><Stat label="Pendapatan" value={metric("revenue_ttm")} /><Stat label="Laba bersih" value={metric("net_income_ttm")} /><Stat label="ROA" value={metric("roa")} /><Stat label="ROE" value={metric("roe")} /><Stat label="Debt to equity" value={metric("debt_to_equity")} /><Stat label="P/E" value={metric("pe_ratio")} /></div></section><section className="panel actions-panel"><SectionTitle title="Aksi korporasi terbaru" action="Lihat semua" /><ActionList events={events.slice(0, 2)} /><button className="text-button" onClick={() => onTab("actions")}>Lihat semua aksi korporasi <Icon name="arrow" size={14} /></button></section><section className="panel why-panel"><SectionTitle title="Mengapa kesimpulan ini?" action="Bukti" /><ol className="reason-list">{data.report.strengths.slice(0, 3).map((claim, index) => <li key={index}><span>{index + 1}</span><p>{claimText(claim)}</p><small>Business Quant</small></li>)}</ol><button className="text-button" onClick={() => onTab("evidence")}>Lihat semua bukti <Icon name="arrow" size={14} /></button></section></div><Disclaimer text={data.report.disclaimer} /></div>;
}

function HistoryView({ data }: { data: AppData }) {
  const sortedPrices = sortPrices(data.snapshot.prices); const first = sortedPrices[0]?.close ?? null; const last = sortedPrices.at(-1)?.close ?? null; const change = first && last ? ((last - first) / first) * 100 : 0;
  return <div className="tab-content history-content"><div className="tab-intro"><div><span className="eyebrow">PRICE LEDGER · 12 BULAN</span><h2>Pergerakan harga dalam konteks.</h2><p>Baca ritme harga bersama rentang waktu dan titik data yang menjadi dasar chart.</p></div><div className="intro-stat"><span>Perubahan periode</span><strong className={change >= 0 ? "positive" : "negative"}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</strong></div></div><section className="panel large-chart-panel"><SectionTitle title="Riwayat harga penutupan" action={`${data.snapshot.prices.length} titik data`} /><Chart prices={data.snapshot.prices} large /><div className="chart-foot"><span><i className="legend-line" />Harga penutupan</span><span>Terendah {first ? `$${Math.min(...data.snapshot.prices.map((point) => point.close)).toFixed(2)}` : "—"}</span><span>Tertinggi {last ? `$${Math.max(...data.snapshot.prices.map((point) => point.close)).toFixed(2)}` : "—"}</span></div></section><div className="two-column"><section className="panel"><SectionTitle title="Snapshot harga" /><div className="big-number">{data.snapshot.price ? `$${data.snapshot.price.toFixed(2)}` : "—"}<small>Harga terakhir · {formatDate(data.snapshot.asOf)}</small></div><div className="mini-stats"><Stat label="Awal periode" value={first ? `$${first.toFixed(2)}` : "—"} /><Stat label="Median" value={data.snapshot.prices.length ? `$${(data.snapshot.prices.map((point) => point.close).sort((a, b) => a - b)[Math.floor(data.snapshot.prices.length / 2)]).toFixed(2)}` : "—"} /><Stat label="Akhir periode" value={last ? `$${last.toFixed(2)}` : "—"} /></div></section><section className="panel"><SectionTitle title="Cara membaca" /><div className="note-list"><div><span>01</span><p>Tren harga bukan pengganti analisis fundamental.</p></div><div><span>02</span><p>Perubahan periode dihitung dari titik yang tersedia.</p></div><div><span>03</span><p>Gunakan chart sebagai konteks volatilitas.</p></div></div></section></div><Disclaimer text="Harga historis bukan jaminan hasil di masa depan." /></div>;
}

function MetricsView({ data, metric }: { data: AppData; metric: (id: string, fallback?: string) => string }) {
  const descriptions: Record<string, string> = { der: "Proporsi pembiayaan liabilitas terhadap ekuitas.", current_ratio: "Kemampuan aset lancar menutup liabilitas lancar.", roa: "Efisiensi aset menghasilkan laba.", roe: "Pengembalian modal pemegang saham.", eps_ttm: "Laba per saham pada periode TTM.", pe: "Harga relatif terhadap laba per saham.", pbv: "Harga relatif terhadap nilai buku per saham.", gross_margin: "Laba kotor sebagai proporsi pendapatan.", operating_margin: "Laba operasi sebagai proporsi pendapatan.", net_margin: "Laba bersih sebagai proporsi pendapatan.", free_cash_flow: "Arus kas operasi setelah belanja modal.", fcf_margin: "Arus kas bebas sebagai proporsi pendapatan.", roic: "Imbal hasil atas modal operasi yang diinvestasikan.", price_return: "Perubahan harga pada rentang data tersedia.", volatility: "Volatilitas tahunan dari return harian." };
  return <div className="tab-content metrics-content"><div className="tab-intro"><div><span className="eyebrow">METRIC REGISTER · TTM</span><h2>Angka, rumus, dan maknanya.</h2><p>Setiap metrik tampil sebagai unit riset yang dapat ditelusuri kembali ke data sumber.</p></div><div className="intro-stamp"><Icon name="check" size={18} /><span>{data.metrics.length} metrik<br />tersedia</span></div></div><div className="metric-table panel"><div className="metric-table-head"><span>Metrik</span><span>Nilai</span><span>Status & konteks</span></div>{data.metrics.map((item) => <div className="metric-table-row" key={item.id}><div><strong>{item.id.replaceAll("_", " ")}</strong><small>Business Quant · {item.unit}</small></div><strong>{metric(item.id)}</strong><div><span className="status-pill">{item.status === "not_meaningful" ? "Tidak bermakna" : item.status === "not_available" ? "Tidak tersedia" : "Tersedia"}</span><small>{descriptions[item.id] ?? "Metrik finansial terstandardisasi."}</small></div></div>)}</div><section className="panel formula-panel"><SectionTitle title="Catatan interpretasi" /><div className="formula-grid"><div><span>RASIO</span><strong>Bandingkan, jangan berdiri sendiri.</strong><p>Rasio perlu dibaca bersama tren, sektor, dan kualitas data.</p></div><div><span>PERIODE</span><strong>TTM menjaga konteks tetap mutakhir.</strong><p>Periode trailing membantu mengurangi bias dari satu kuartal.</p></div><div><span>STATUS</span><strong>Null bukan berarti nol.</strong><p>Nilai yang tidak tersedia tetap ditampilkan sebagai batasan.</p></div></div></section></div>;
}

function ActionsView({ data }: { data: AppData }) {
  const events = data.snapshot.corporateActions?.events ?? [];
  return <div className="tab-content actions-content"><div className="tab-intro"><div><span className="eyebrow">CORPORATE ACTIONS · EVENT LOG</span><h2>Peristiwa yang mengubah konteks saham.</h2><p>Riwayat dividen, buyback, dan aksi lain disajikan sebagai log dengan tanggal dan sumber.</p></div><div className="intro-stamp"><Icon name="calendar" size={18} /><span>{events.length} event<br />terverifikasi</span></div></div><section className="panel event-ledger"><div className="ledger-head"><span>Tanggal</span><span>Peristiwa</span><span>Dampak riset</span><span>Sumber</span></div>{events.length ? events.map((event, index) => <div className="event-row" key={`${event.date}-${index}`}><time>{formatDate(event.date)}</time><div className="event-name"><span className={`event-icon event-${event.kind}`}><Icon name={event.kind === "dividend" ? "spark" : "bars"} size={18} /></span><div><strong>{event.rawAction}</strong><small>{event.kind === "dividend" ? "Alokasi modal" : "Struktur saham"}</small></div></div><p>{event.notes ?? "Tidak ada catatan tambahan dari sumber."}</p><span className="source-badge">{event.evidenceId ? "Business Quant" : "Sumber tidak tersedia"}</span></div>) : <div className="empty-table"><Icon name="calendar" size={22} /><p>Belum ada aksi korporasi yang tersedia untuk periode ini.</p></div>}</section><div className="two-column"><section className="panel"><SectionTitle title="Ringkasan aksi" /><div className="action-summary"><strong>{events.length}</strong><span>event yang masuk ke snapshot</span><small>{data.snapshot.corporateActions?.status === "available" ? "Enrichment tersedia" : "Enrichment terbatas"}</small></div></section><section className="panel"><SectionTitle title="Batas pembacaan" /><div className="note-list"><div><span>01</span><p>Aksi korporasi bukan sinyal transaksi otomatis.</p></div><div><span>02</span><p>Dampak ekonomi perlu dibaca bersama laporan keuangan.</p></div></div></section></div></div>;
}

function AiView({ data, activeProfile, setActiveProfile, metric }: { data: AppData; activeProfile: ProfileId; setActiveProfile: (profile: ProfileId) => void; metric: (id: string, fallback?: string) => string }) {
  const profile = data.report.profiles[activeProfile];
  return <div className="tab-content ai-content"><div className="tab-intro"><div><span className="eyebrow">INTERPRETASI AI · THREE LENSES</span><h2>Satu data, tiga cara membaca risiko.</h2><p>Perbedaan profil bukan rekomendasi personal; ini cara menguji sensitivitas kesimpulan terhadap toleransi risiko.</p></div><div className="confidence-card"><span>Keyakinan profil</span><strong>{Math.round(profile.confidence * 100)}%</strong></div></div><div className="profile-cards">{(Object.keys(PROFILE_LABELS) as ProfileId[]).map((id) => <button key={id} className={`profile-card ${activeProfile === id ? "active" : ""}`} onClick={() => setActiveProfile(id)}><span className="profile-number">0{Object.keys(PROFILE_LABELS).indexOf(id) + 1}</span><span className="eyebrow">PROFIL</span><h3>{PROFILE_LABELS[id]}</h3><p>{PROFILE_BLURBS[id]}</p><span className="profile-rating">{data.report.profiles[id]?.rating === "positive" ? "Cenderung positif" : data.report.profiles[id]?.rating === "negative" ? "Cenderung negatif" : "Netral"}</span></button>)}</div><section className="interpretation-panel"><div className="interpretation-main"><span className="eyebrow">KESIMPULAN · {PROFILE_LABELS[activeProfile].toUpperCase()}</span><h2>{claimText(profile.thesis)}</h2><div className="linked-metrics">{profile.thesis.metricIds?.map((id) => <span key={id}>{id.replaceAll("_", " ")} <b>{metric(id)}</b></span>)}</div></div><div className="interpretation-side"><span className="eyebrow">HAL YANG PERLU DIPANTAU</span>{profile.considerations.map((claim, index) => <div className="consideration" key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{claimText(claim)}</p></div>)}</div></section><Disclaimer text="Interpretasi AI membantu merangkum data yang tersedia, bukan menggantikan penilaian pengguna." /></div>;
}

/* function EvidenceView({ data }: { data: AppData }) {
  const claims = [...data.report.strengths.slice(0, 3), ...data.report.risks.slice(0, 2)];
  return <div className="tab-content evidence-content"><div className="tab-intro"><div><span className="eyebrow">EVIDENCE LEDGER · TRACEABILITY</span><h2>Kesimpulan yang meninggalkan jejak.</h2><p>Telusuri asal data, batas interpretasi, dan alasan mengapa kualitas analisis mendapat skornya.</p></div><div className="intro-stamp quality-stamp"><strong>{Math.round(data.quality.score)}%</strong><span>kualitas<br />data</span></div></div><div className="evidence-grid"><section className="panel claim-ledger"><SectionTitle title="Peta bukti kesimpulan" action={`${claims.length} klaim`} />{claims.map((claim, index) => <div className="claim-row" key={index}><span className={index < 3 ? "claim-number lime" : "claim-number">{String(index + 1).padStart(2, "0")}</span><div><p>{claimText(claim)}</p><small>{claim.metricIds?.join(" · ") || "Konteks laporan"}</small></div><span className="source-badge">Business Quant <Icon name="external" size={12} /></span></div>)}</section><section className="panel source-ledger"><SectionTitle title="Sumber utama" /><div className="source-card"><Icon name="database" size={22} /><div><strong>Business Quant</strong><p>Harga, laporan keuangan, metrik, dan aksi korporasi.</p></div><span className="active-dot">Aktif</span></div><div className="source-card"><Icon name="brain" size={22} /><div><strong>Gemini</strong><p>Interpretasi profil risiko dengan kontrak output terstruktur.</p></div><span className={data.quality.aiEligible ? "active-dot" : "muted-dot"}>{data.quality.aiEligible ? "Aktif" : "Terbatas"}</span></div><div className="quality-breakdown"><span>Kelengkapan <b>94%</b></span><span>Keterkinian <b>90%</b></span><span>Konsistensi <b>{Math.round(data.quality.score)}%</b></span></div></section></div><section className="panel limitations-panel"><SectionTitle title="Bukti batasan" action="Baca sebelum memakai" /><div className="limitation-list">{data.report.limitations.map((limitation, index) => <div key={index}><Icon name="alert" size={17} /><p>{limitation}</p></div>)}</div></section></div>;
}

}
*/

function EvidenceView({ data }: { data: AppData }) {
  const claims = [...data.report.strengths.slice(0, 3), ...data.report.risks.slice(0, 2)];
  return <div className="tab-content evidence-content"><div className="tab-intro"><div><span className="eyebrow">EVIDENCE LEDGER · TRACEABILITY</span><h2>Kesimpulan yang meninggalkan jejak.</h2><p>Telusuri asal data, batas interpretasi, dan alasan mengapa kualitas analisis mendapat skornya.</p></div><div className="intro-stamp quality-stamp"><strong>{Math.round(data.quality.score)}%</strong><span>kualitas<br />data</span></div></div><div className="evidence-grid"><section className="panel claim-ledger"><SectionTitle title="Peta bukti kesimpulan" action={`${claims.length} klaim`} />{claims.map((claim, index) => <div className="claim-row" key={index}><span className={index < 3 ? "claim-number lime" : "claim-number"}>{String(index + 1).padStart(2, "0")}</span><div><p>{claimText(claim)}</p><small>{claim.metricIds?.join(" · ") || "Konteks laporan"}</small></div><span className="source-badge">Business Quant <Icon name="external" size={12} /></span></div>)}</section><section className="panel source-ledger"><SectionTitle title="Sumber utama" /><div className="source-card"><Icon name="database" size={22} /><div><strong>Business Quant</strong><p>Harga, laporan keuangan, metrik, dan aksi korporasi.</p></div><span className="active-dot">Aktif</span></div><div className="source-card"><Icon name="brain" size={22} /><div><strong>Gemini</strong><p>Interpretasi profil risiko dengan kontrak output terstruktur.</p></div><span className={data.quality.aiEligible ? "active-dot" : "muted-dot"}>{data.quality.aiEligible ? "Aktif" : "Terbatas"}</span></div><div className="quality-breakdown"><span>Kelengkapan <b>94%</b></span><span>Keterkinian <b>90%</b></span><span>Konsistensi <b>{Math.round(data.quality.score)}%</b></span></div></section></div><section className="panel limitations-panel"><SectionTitle title="Bukti batasan" action="Baca sebelum memakai" /><div className="limitation-list">{data.report.limitations.map((limitation, index) => <div key={index}><Icon name="alert" size={17} /><p>{limitation}</p></div>)}</div></section></div>;
}

function ActionList({ events }: { events: CorporateAction[] }) { return <div className="action-list">{events.length ? events.map((event, index) => <div className="action-item" key={`${event.date}-${index}`}><span className="action-icon"><Icon name={event.kind === "dividend" ? "spark" : "bars"} size={17} /></span><div><strong>{event.rawAction}</strong><small>{formatDate(event.date)}</small></div><p>{event.notes ?? "Aksi korporasi tercatat pada sumber utama."}</p><Icon name="arrow" size={15} /></div>) : <p className="muted-copy">Belum ada aksi korporasi.</p>}</div>; }

function Disclaimer({ text }: { text: string }) { return <div className="disclaimer"><Icon name="alert" size={18} /><span>{text}</span></div>; }
