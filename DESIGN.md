<!-- F0 contract: Black Frame / Lime Signal. The introduction persuades; the report operates. -->
---
name: StockFrame
description: Riset saham yang mengubah evidence menjadi narasi yang dapat dibaca dan ditelusuri.
---

# Design System: StockFrame

## Arah visual

**Black Frame / Lime Signal** adalah bahasa visual StockFrame. Mekanismenya digambarkan sebagai satu garis sinyal lime yang melewati tiga lapisan: data sumber, hasil kalkulasi engine, lalu interpretasi AI. Frame hitam memberi batas dan fokus; lime menandai sinyal, bukan sentimen pasar.

StockFrame memiliki dua mode yang sengaja berbeda:

- **Persuade — pengantar:** bold, ekspresif, dan berani. Lime boleh menjadi bidang besar untuk memperkenalkan cara kerja produk dan mengundang pengguna masuk ke riset.
- **Operate — laporan:** tenang, padat, dan mudah dipindai. Lime dibatasi untuk primary action, selection aktif, quality state, serta key signal. Data, engine, dan AI harus terlihat sebagai lapisan yang berbeda.

Landing page tidak boleh dimulai dengan form analisis, mockup dashboard generik, pricing cards, atau klaim performa. Dashboard/report tidak boleh menyerupai brokerage, portfolio tracker, trading terminal, atau admin template.

## Palet

| Token | Nilai | Peran |
| --- | --- | --- |
| Signal Lime | `#C6FF00` | Bidang hero/manifesto, primary action, active selection, quality state, key signal |
| Near Black | `#080A08` | Frame utama, shell operasional, teks dominan |
| Deep Forest | `#132510` | Surface gelap sekunder dan lapisan evidence |
| Warm White | `#F5F5EE` | Lembar pembacaan dan surface interpretasi AI |
| Muted Gray | `#A4AA9E` | Metadata, copy sekunder, inactive state |

Lime tidak boleh dipakai sebagai glow dekoratif atau dibentangkan merata pada dashboard. Warna positif, caution, dan negatif adalah semantic color terpisah; masing-masing wajib disertai label atau teks, bukan warna saja.

## Material dan komposisi

- **Frame:** garis batas tipis, sudut tegas, dan bidang hitam yang memberi fokus pada evidence.
- **Signal line:** satu garis lime kontinu yang menghubungkan data → engine → interpretasi; jangan diulang sebagai ornamen pada setiap komponen.
- **Evidence layers:** lembar bertumpuk boleh dipakai pada hero sebagai demonstrasi mekanisme, tetapi tidak boleh tampak seperti browser chrome atau dashboard screenshot.
- **Persuade layout:** satu komposisi dominan per viewport, field lime berskala halaman, headline besar, dan whitespace yang memberi jeda.
- **Operate layout:** container terukur, section navigation lokal, surface datar, label provenance, status, tanggal efektif, warning, dan limitation selalu terbaca.
- **Responsive order:** identity → quality/conclusion → historical price → metrics → risk profiles → findings → corporate actions → evidence/limitations.

## Tipografi

- **Brand surface:** bold neo-grotesk dengan tracking rapat dan ukuran besar; dipakai untuk nama produk, thesis, dan manifesto.
- **Product UI:** sans-serif workhorse yang compact dan mudah dibaca untuk label, controls, body copy, dan status.
- **Data voice:** angka, ticker, tanggal, formula ID, dan evidence ID menggunakan wajah mono yang terbaca.
- Jangan memakai serif editorial, italic display, gradient text, atau AI sparkle sebagai pengganti hierarchy.

## Provenance dan copy

Setiap surface menyatakan lapisannya secara eksplisit:

- **Data sumber:** profil, laporan keuangan, harga penutupan, dan Corporate Actions terstruktur.
- **Hasil engine:** 16 metric deterministik, unit, status, warning, formula ID, dan evidence ID.
- **Interpretasi AI:** summary, strengths, risks, uncertainties, dan tiga risk profile dengan metric IDs.
- **Batasan:** quality decision, tanggal `asOf`, missing data, unavailable enrichment, dan disclaimer edukasi.

Gunakan Bahasa Indonesia. Jangan menampilkan instruksi beli/jual, target harga, proyeksi, jaminan, atau total shareholder return yang tidak ada di kontrak. Corporate Actions adalah event terstruktur, bukan berita atau artikel.

## Aturan visualisasi F0

- Grafik historis yang diwajibkan hanya harga penutupan sekitar satu tahun.
- Jangan membuat historical series untuk metric engine dan jangan meminta AI mengarang titik data.
- ROA, ROE, dan net margin boleh menjadi horizontal bar chart hanya ketika ketiganya tersedia, unitnya sama-sama rasio, dan formula/periode kompatibel.
- Margin lain hanya boleh dibandingkan setelah compatibility policy membuktikan denominator dan periodenya konsisten.
- Capital structure hanya divisualisasikan jika debt/liabilities dan equity terbaru valid dalam currency yang sama; jika tidak, tampilkan scalar metric.
- DER, P/E, PBV, EPS, BVPS, currency values, dan unit yang tidak kompatibel tidak boleh berbagi satu axis.
- Rasio tak berbatas tidak boleh memakai progress bar. Radar chart dan gauge untuk kumpulan unit berbeda dilarang.
- Setiap grafik current-period memakai label: **`Periode terbaru · bukan data historis`** dan memiliki text equivalent.
- Jika input visualisasi kurang, fallback deterministik ke scalar metric dengan status dan warning tetap terlihat.

## Accessibility dan states

- Warna bukan satu-satunya pembeda status, rating, atau profile.
- Semua chart memiliki text equivalent, tanggal, unit, dan state `available`, `sparse`, atau `unavailable`.
- Loading tidak boleh mengklaim progress provider yang tidak diketahui.
- Error code memiliki judul, penjelasan, dan recovery action yang konsisten.
- Ambiguous instrument menampilkan kandidat dari response; provider/AI detail internal tidak pernah ditampilkan.
- Focus ring, keyboard order, reduced motion, empty state, degraded state, dan unavailable state adalah bagian dari komponen, bukan polish belakangan.

## Dependency decision F0

F0 tidak menambahkan dependency. Presentation layer cukup menggunakan TypeScript, `Intl`, schema domain yang sudah ada, dan native HTML/CSS pada milestone berikutnya. Bklit, Motion, Kokonut UI, dan shadcn/ui ditunda sampai kebutuhan chart, motion, atau primitive accessibility terbukti dan dapat dievaluasi berdasarkan bundle impact, text equivalent, serta custom styling.

## Anti-goals

- Cyberpunk glow, HUD, grid-pattern palsu, glassmorphism berlebihan, dan dekorasi teknis tanpa evidence.
- Generic SaaS hero, browser-window mockup, equal feature-card grid, testimonial, logo strip, pricing, login, signup, watchlist, atau portfolio language.
- Harga masa depan, target price, transaction CTA, personal position sizing, dan klaim keuntungan.
- Menyamakan prose AI dengan angka canonical atau menyembunyikan provenance di balik satu kartu netral.
