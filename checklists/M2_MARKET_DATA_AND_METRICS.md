# M2 — Normalisasi, metrik, evidence, dan quality gate

- [x] Parse angka, tanggal, mata uang, dan tipe periode provider.
- [x] Ubah placeholder/angka non-finite menjadi `null` tanpa silent zero.
- [x] Filter future rows, sort, deduplicate, dan pilih periode valid terbaru.
- [x] Bangun `MarketSnapshot` immutable dengan schema validation.
- [x] Tetapkan evidence ID dan effective date yang stabil secara deterministik.
- [x] Implementasikan 16 metrik prioritas dengan unit, formula ID, status, warning, dan evidence ID.
- [x] Tangani denominator nol, ekuitas negatif, EPS negatif, partial TTM, harga tidak tersedia, dan mismatch mata uang.
- [x] Implementasikan quality assessment deterministik untuk insufficient, degraded, dan sufficient.
- [x] Bangun evidence packet bounded tanpa raw provider payload.
- [x] Tambahkan fixture hand-calculated dan test untuk stabilitas, invalid status, future rows, NaN/Infinity, quality boundary, serta bounded packet.
- [x] Lulus lint, strict type-check, unit test, dan production build tanpa AI/provider live call.
- [x] Menutup regression P1/P2: PBV tanpa harga, mismatch mata uang, coverage quality gate, evidence ROA/ROE, TTM continuity, dan historical prices.
- [x] Menetapkan ROIC v2 sebagai NOPAT dibagi rata-rata operating invested capital (`total assets - total current liabilities`).
