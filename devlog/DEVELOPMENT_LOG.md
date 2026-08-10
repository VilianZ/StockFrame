# StockFrame — Planning Backend dan Frontend

## Timestamp: 2026-08-05 16:42:10 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Menyusun fondasi backend StockFrame agar kontrak domain, sumber data, metric engine, quality gate, evidence, dan error handling memiliki batas yang jelas.
- **TLDR AI agents done:** Menyepakati backend sebagai sumber kebenaran untuk data canonical, perhitungan deterministik, provenance, dan response publik; AI hanya menjadi lapisan interpretasi.
- **Milestone:** Planning Backend — Fondasi dan kontrak
- **Files changed:** Tidak ada; sesi planning.
- **Validation:** Review kontrak dan batas scope secara konseptual.
- **Decisions / blockers:** Provider detail, credential, dan raw payload tetap server-only; tidak ada live provider call pada tahap planning.

## Timestamp: 2026-08-05 17:05:26 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Mematangkan rencana backend untuk Business Quant, metric TTM, quality gate, corporate actions, cache, timeout, retry, evidence packet, dan typed error.
- **TLDR AI agents done:** Menetapkan alur resolution → market data → normalizer → metric engine → quality gate → evidence → Gemini → FinalReport, termasuk batas call provider dan enrichment yang tidak memblokir analisis utama.
- **Milestone:** Planning Backend — Market data, engine, dan API runner
- **Files changed:** Tidak ada; sesi planning.
- **Validation:** Pemeriksaan konsistensi alur dan acceptance boundary.
- **Decisions / blockers:** Formula metric dan quality gate tidak boleh diubah oleh AI; provider failure harus tetap typed dan aman untuk client.

## Timestamp: 2026-08-05 17:20:18 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Menyusun arah frontend StockFrame dari identitas visual sampai pengalaman membaca data, engine, dan interpretasi AI.
- **TLDR AI agents done:** Menetapkan Black Frame / Lime Signal, alur Data → Engine → Interpretasi, responsive behavior, focus state, reduced motion, loading, empty state, dan custom scrollbar sebagai fondasi F0–F1.
- **Milestone:** Planning Frontend — Identitas dan pengantar
- **Files changed:** Tidak ada; sesi planning.
- **Validation:** Review hierarchy, provenance, accessibility, dan copy produk.
- **Decisions / blockers:** Angka ilustratif harus jujur; landing tidak boleh menyerupai terminal trading atau menjanjikan prediksi harga.

## Timestamp: 2026-08-05 17:24:44 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Menyusun rencana frontend F2–F3 untuk form riset, lifecycle request, report renderer, chart harga, metric, corporate actions, evidence, dan tiga profile risiko.
- **TLDR AI agents done:** Menetapkan F2 sebagai controlled query dan request lifecycle, sedangkan F3 sebagai renderer report yang membaca response backend tanpa menghitung ulang atau mengarang data.
- **Milestone:** Planning Frontend — Research desk dan report renderer
- **Files changed:** Tidak ada; sesi planning.
- **Validation:** Review acceptance path desktop/mobile, interaction states, tooltip chart, unit compatibility, dan provenance.
- **Decisions / blockers:** Chart hanya memakai closing price EOD; domain sumbu, grid, label, tanggal, dan tooltip harus mengikuti dataset yang sama.

## Prinsip lintas lapisan

- Tidak ada live provider call dalam unit test.
- Credential, raw provider payload, prompt penuh, dan response sensitif tidak boleh masuk client maupun log.
- Milestone ditutup setelah implementasi, regression test, lint, typecheck, test, build, dan review visual yang relevan selesai.

---

## Timestamp: 2026-08-05 17:33:47 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Memulai Milestone 0 revisi AI Trading Research dengan fondasi Next.js dan kontrak TypeScript.
- **TLDR AI agents done:** Membuat fondasi Next.js App Router dengan TypeScript strict, kontrak dan schema domain M0, serialisasi kanonik, hashing SHA-256, batas environment server-only, serta unit test tanpa integrasi provider.
- **Milestone:** M0 — Baseline dan domain
- **Files changed:**
  - `package.json`, `package-lock.json`, `.nvmrc`, `.node-version`, `.gitignore`, `.env.example`
  - `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`
  - `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
  - `lib/domain/*`, `lib/server/env.ts`, `lib/market-data/.gitkeep`, `lib/metrics/.gitkeep`, `lib/quality/.gitkeep`, `lib/ai/.gitkeep`
  - `tests/unit/domain.test.ts`, `M0_IMPLEMENTATION_PLAN.md`
- **Validation:**
  - `node --version; npm --version`: Node `22.16.0`, npm `10.9.2`.
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 1 berkas dan 8 test.
  - `npm run build`: Lulus; halaman statis `/` dan `/_not-found` berhasil dibuat.
  - Pemeriksaan lockfile/versi dan pemindaian secret source: Lulus; tidak ada assignment secret inline atau variabel `NEXT_PUBLIC_`.
- **Decisions / blockers:**
  - React `19.2.7` dipin karena diterima oleh peer requirement Next.js `16.2.9`; React `19.3.0` menimbulkan konflik saat instalasi.
  - `.venv` dan artefak Python lama tetap tidak disentuh dan tidak diimpor. Smoke test dev-server melalui proses latar terhalang kebijakan shell; production build dan script berhasil.
- **Checklist:** `checklists/M0_BASELINE_AND_DOMAIN.md`
  - [x] M0 revisi aktif — fondasi Next.js dan kontrak selesai serta tervalidasi.

## Timestamp: 2026-08-05 17:48:36 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Memperketat MetricSchema dan merapikan lokasi dokumen kontrak serta development log.
- **TLDR AI agents done:** MetricSchema sekarang memakai discriminated union berbasis status; dokumentasi backend dipindahkan ke `docs/` dan development log dipindahkan ke `devlog/`.
- **Milestone:** M0 — Baseline dan domain
- **Files changed:**
  - `lib/domain/schemas.ts`, `tests/unit/domain.test.ts`
  - `M0_IMPLEMENTATION_PLAN.md`, `checklists/M0_BASELINE_AND_DOMAIN.md`
  - `docs/BACKEND_SPEC.md`, `docs/BACKEND_IMPLEMENTATION_PLAN.md`, `docs/PROPOSAL_DRAFT.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 1 berkas dan 9 test.
  - `npm run build`: Lulus; halaman statis `/` dan `/_not-found` berhasil dibuat.
  - Pemeriksaan layout path: Lulus; tidak ada lagi path dokumen/log lama di root.
- **Decisions / blockers:** Status dan value metric sekarang saling dibatasi: `available` wajib memakai angka finite; `not_available` dan `not_meaningful` wajib memakai `null`. Tidak ada hambatan.
- **Checklist:** `checklists/M0_BASELINE_AND_DOMAIN.md`
  - [x] Koherensi status/value MetricSchema ditambahkan dan tervalidasi.

## Timestamp: 2026-08-05 18:06:54 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Melanjutkan development AI Trading Research ke Milestone 1 revisi dengan tetap memakai satu project Next.js App Router + TypeScript di Vercel, tanpa Python, FastAPI, database, queue, worker, backend terpisah, atau integrasi OpenRouter pada tahap ini. Menggunakan `docs/BACKEND_SPEC.md`, `docs/BACKEND_IMPLEMENTATION_PLAN.md`, dan instruksi aktif sebagai kontrak; implementasi M1 dibatasi pada abstraksi provider data pasar dan resolusi instrumen. Alpha Vantage hanya boleh dipanggil dari server-side melalui `fetch`, dengan API key dari environment server-only, endpoint provider yang tetap, timeout AbortController, paling banyak satu retry untuk gangguan sementara, klasifikasi error yang aman, serta logging yang tidak membocorkan key, URL sensitif, atau query mentah. Resolver harus mempertahankan ticker yang masuk akal, memverifikasi ticker terhadap provider, mencari nama perusahaan melalui `SYMBOL_SEARCH`, menyaring hanya common equity yang terdaftar di Amerika Serikat, mengembalikan kandidat saat ambigu, dan tidak menebak pilihan. Menambahkan raw record untuk quote, overview, income statement, balance sheet, dan cash flow; memakai fixture tersanitasi serta fake fetch untuk seluruh test tanpa live network. Tidak mengerjakan normalisasi, formula metrik, quality gate, OpenRouter, `/api/analyze`, deployment, atau frontend final. Hasil dicatat sebagai paraphrase lengkap yang tetap merangkum maksud prompt asli tanpa menyalin mentah seluruhnya.
- **TLDR AI agents done:** Menambahkan `MarketDataProvider`, parser payload mentah, adapter Alpha Vantage server-only, resolver ticker/nama perusahaan, retry/timeout/error mapping, logging aman, fixture tersanitasi, dan test M1.
- **Milestone:** M1 — Data pasar dan resolusi instrumen
- **Files changed:**
  - `lib/market-data/provider.ts`, `lib/market-data/parsers.ts`, `lib/market-data/alpha-vantage.ts`, `lib/market-data/index.ts`
  - `tests/fixtures/alpha-vantage/*.json`, `tests/unit/market-data.test.ts`, `tests/server-only-shim.ts`, `vitest.config.ts`
  - `checklists/M1_SUPABASE_AND_AUTH.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 2 berkas dan 21 test.
  - `npm run build`: Lulus; halaman statis `/` dan `/_not-found` berhasil dibuat.
  - Test provider berbasis fixture: Lulus tanpa akses network live.
- **Decisions / blockers:** Deteksi ticker dibatasi maksimal lima karakter agar nama perusahaan biasa tidak dianggap ticker; hasil pencarian ambigu selalu mengembalikan kandidat. Shim `server-only` yang hanya dipakai Vitest tidak mengubah boundary production. Tidak ada hambatan.
- **Checklist:** `checklists/M1_SUPABASE_AND_AUTH.md`
  - [x] M1 revisi aktif — adapter data pasar dan resolusi instrumen selesai serta tervalidasi.

## Timestamp: 2026-08-05 18:19:15 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Menindaklanjuti review M1 yang menyatakan milestone belum aman dianggap selesai walaupun lint, type-check, test, dan build sudah lulus. Memperbaiki resolver agar semua input, termasuk nama perusahaan pendek, melewati `SYMBOL_SEARCH`; exact-symbol match harus diprioritaskan dan hasil non-exact harus memakai kebijakan threshold serta score gap yang eksplisit. Memperbaiki urutan penanganan HTTP agar status 429, 401/403, dan 5xx diklasifikasikan sebelum parsing body sehingga respons 5xx non-JSON tetap dapat di-retry satu kali. Menambahkan validasi bahwa simbol quote dan overview sama dengan instrument yang diminta, fixture serta test regresi untuk semua temuan, dan mencatat caching durable sebagai pekerjaan wajib sebelum deployment publik. Menyelaraskan instruksi repository dan format prompt log agar lokasi log tetap `devlog/`, narasi berbahasa Indonesia, dan prompt dicatat sebagai paraphrase yang lengkap tetapi tidak menyalin prompt asli.
- **TLDR AI agents done:** Memperbaiki kebijakan resolusi instrumen, HTTP error handling dan retry, validasi lintas simbol, fixture regresi, instruksi logging repository, serta checklist M1.
- **Milestone:** M1 — Data pasar dan resolusi instrumen
- **Files changed:**
  - `lib/market-data/alpha-vantage.ts`, `tests/unit/market-data.test.ts`, `tests/fixtures/alpha-vantage/symbol-search-strong-gap.json`
  - `checklists/M1_SUPABASE_AND_AUTH.md`, `AGENTS.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 2 berkas dan 23 test.
  - `npm run build`: Lulus; halaman statis `/` dan `/_not-found` berhasil dibuat.
  - Test regresi: nama perusahaan pendek, exact-symbol/score-gap, 5xx non-JSON retry, dan quote cross-symbol validation semuanya lulus.
- **Decisions / blockers:** Resolver kini memakai satu `SYMBOL_SEARCH` sebagai langkah resolusi dan tidak lagi melakukan dua request direct-ticker sebelum bundle. Threshold strong match adalah `0.8` dengan score gap minimum `0.1`; caching durable tetap ditunda sampai sebelum deployment publik. Tidak ada hambatan.
- **Checklist:** `checklists/M1_SUPABASE_AND_AUTH.md`
  - [x] Temuan review M1 diperbaiki dan seluruh validasi diulang.

## Timestamp: 2026-08-05 18:41:30 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Melanjutkan Milestone 2 AI Trading Research untuk mengubah raw market data menjadi snapshot yang tervalidasi, metrik fundamental deterministik, evidence terbatas, dan keputusan kualitas data sebelum tahap AI.
- **TLDR AI agents done:** Menambahkan normalisasi periode dan angka provider, snapshot immutable dengan evidence ID stabil, 16 formula metrik murni, quality gate tiga tingkat, evidence packet bounded, serta fixture dan test regresi untuk kasus valid maupun invalid.
- **Milestone:** M2 — Normalisasi, metrik, evidence, dan quality gate
- **Files changed:**
  - `lib/domain/schemas.ts`, `lib/domain/contracts.ts`
  - `lib/market-data/normalizer.ts`, `lib/market-data/index.ts`
  - `lib/metrics/calculations.ts`, `lib/metrics/index.ts`
  - `lib/quality/assessment.ts`, `lib/quality/evidence-packet.ts`, `lib/quality/index.ts`
  - `tests/unit/normalization.test.ts`, `tests/unit/metrics.test.ts`, `tests/unit/quality.test.ts`, `tests/unit/evidence-packet.test.ts`
  - `checklists/M2_MARKET_DATA_AND_METRICS.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 6 berkas dan 33 test.
  - `npm run build`: Lulus; halaman Next.js statis berhasil dibuat.
  - Provider/AI live call: Tidak dilakukan; seluruh verifikasi memakai fixture dan data sintetis.
- **Decisions / blockers:** Capex dinormalisasi sebagai nilai positif agar formula FCF konsisten memakai OCF dikurangi capex; partial TTM dan mismatch mata uang tidak dipaksa menjadi angka. Tidak ada hambatan.
- **Checklist:** `checklists/M2_MARKET_DATA_AND_METRICS.md`
  - [x] Normalisasi, snapshot immutable, formula metrik, quality gate, evidence packet, dan validasi M2 selesai.

## Timestamp: 2026-08-05 18:56:39 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Menindaklanjuti review M2 yang menemukan bug PBV tanpa harga, pencampuran currency, quality gate terlalu longgar, evidence ROA/ROE tidak lengkap, TTM tanpa pemeriksaan kuartal berurutan, serta belum adanya histori harga pada alur provider nyata.
- **TLDR AI agents done:** Memperbaiki PBV menjadi `not_available` ketika harga kosong, menolak kalkulasi saat currency mismatch, memperketat coverage statement dan metrik inti, menggabungkan seluruh evidence input, memvalidasi kontinuitas empat kuartal, menambahkan compact daily prices ke adapter/provider-normalizer, dan menetapkan ROIC operating invested capital v2.
- **Milestone:** M2 — Normalisasi, metrik, evidence, dan quality gate
- **Files changed:**
  - `lib/market-data/provider.ts`, `lib/market-data/parsers.ts`, `lib/market-data/alpha-vantage.ts`, `lib/market-data/normalizer.ts`
  - `lib/metrics/calculations.ts`, `lib/quality/assessment.ts`
  - `docs/BACKEND_SPEC.md`
  - `tests/fixtures/alpha-vantage/time-series-daily.json`, `tests/unit/market-data.test.ts`, `tests/unit/normalization.test.ts`, `tests/unit/metrics.test.ts`, `tests/unit/quality.test.ts`
  - `checklists/M2_MARKET_DATA_AND_METRICS.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 6 berkas dan 38 test.
  - `npm run build`: Lulus; production build Next.js berhasil.
  - Provider/AI live call: Tidak dilakukan; daily-price flow dibuktikan dengan fixture compact.
- **Decisions / blockers:** Currency mismatch dan coverage fundamental yang tidak cukup sekarang menghentikan eligibility analisis. ROIC memakai operating invested capital `total assets - total current liabilities` dengan formula ID v2. Tidak ada hambatan.
- **Checklist:** `checklists/M2_MARKET_DATA_AND_METRICS.md`
  - [x] Seluruh temuan review P1/P2 yang ditargetkan diperbaiki dan tervalidasi.

## Timestamp: 2026-08-05 19:28:46 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Melanjutkan Milestone 3 untuk membangun pipeline analisis satu model yang memakai konfigurasi OpenRouter server-only, evidence packet bounded, prompt contract berversi, report terstruktur dengan tiga profil risiko, validasi output ketat, dan pengujian fixture tanpa panggilan model live.
- **TLDR AI agents done:** Menambahkan kontrak adapter AI, prompt Indonesian dengan delimiter user/evidence, JSON Schema FinalReport untuk structured output OpenRouter, validator evidence/profile/confidence/bahasa trading, adapter HTTP satu-call dengan timeout dan telemetry, serta fake-response tests.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/domain/versions.ts`
  - `lib/ai/contracts.ts`, `lib/ai/prompt.ts`, `lib/ai/report-schema.ts`, `lib/ai/validation.ts`, `lib/ai/openrouter.ts`, `lib/ai/index.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 7 berkas dan 44 test.
  - `npm run build`: Lulus; production build Next.js berhasil.
  - OpenRouter live call: Tidak dilakukan; adapter diuji melalui fake fetch.
- **Decisions / blockers:** Tidak ada automatic repair call atau retry model. Quality `insufficient` berhenti sebelum request; quality `degraded` membatasi confidence maksimum 0.7 dan mewajibkan limitations. Tidak ada hambatan.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] One-model prompt, structured output, validator, telemetry, dan regression tests M3 selesai.

## Timestamp: 2026-08-05 20:03:53 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Menutup acceptance gap review M3: tambahkan larangan instruksi trading Bahasa Indonesia, amankan delimiter prompt terhadap focus injection, wajibkan evidence pada setiap profile, uji penuh alur M2 menuju M3, dan lengkapi telemetry untuk kegagalan model.
- **TLDR AI agents done:** Memperluas validator Indonesia, meng-encode focus sebagai JSON, memperketat evidence ID profile, menambahkan failure telemetry pada AiError, menambahkan integration-style M2→M3 test dengan 16 metric aktual, dan menegaskan canonical metrics tetap terpisah dari report prose.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/domain/schemas.ts`, `lib/ai/contracts.ts`, `lib/ai/prompt.ts`, `lib/ai/validation.ts`, `lib/ai/openrouter.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 7 berkas dan 46 test.
  - `npm run build`: Lulus; production build Next.js berhasil.
  - Full codebase-memory re-index: Lulus; project menjadi 523 nodes dan 872 edges, status ready.
  - OpenRouter live call: Tidak dilakukan.
- **Decisions / blockers:** Failure telemetry diselesaikan di M3. Canonical metrics tidak dimasukkan ke report model; aplikasi mempertahankan metrics sebagai data terpisah dan report hanya interpretasi. Tidak ada commit Git karena tidak diminta dan workspace tidak menyediakan repository Git aktif.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Seluruh acceptance gap yang ditargetkan diperbaiki, diuji, dan indeks knowledge graph diperbarui.

## Timestamp: 2026-08-05 20:11:57 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Menutup gap telemetry terakhir M3 agar token usage dari envelope OpenRouter tetap tercatat saat content report malformed, sekaligus menyelaraskan JSON Schema evidence profile dengan schema domain dan mengoreksi catatan status Git.
- **TLDR AI agents done:** Memindahkan parsing usage sebelum parsing content, menambahkan assertion failure telemetry `totalTokens: 30`, menambahkan constraint JSON Schema evidence, menjalankan validasi penuh, dan melakukan full re-index graph.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/openrouter.ts`, `lib/ai/report-schema.ts`, `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 7 berkas dan 46 test.
  - `npm run build`: Lulus; production build Next.js berhasil.
  - Full codebase-memory re-index: Lulus; 523 nodes dan 872 edges, status ready.
  - `git status --short --branch`: Repository aktif, branch `master` terdeteksi.
- **Decisions / blockers:** Token usage sekarang dipertahankan pada semua failure setelah envelope JSON valid. Catatan sebelumnya tentang repository Git tidak aktif dikoreksi oleh status aktual; tidak ada commit yang dibuat. Tidak ada hambatan.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Telemetry usage pada malformed model content diperbaiki dan tervalidasi.

## Timestamp: 2026-08-05 20:26:44 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Melanjutkan M4 untuk menghubungkan pipeline riset dari resolusi instrumen sampai report AI melalui service analisis dan endpoint `POST /api/analyze`, dengan validasi request, throttling, deadline, error aman, serta pengujian acceptance fixture-backed.
- **TLDR AI agents done:** Menambahkan service orkestrasi M4, pemetaan error publik, throttling in-memory, batas body, request ID, deadline dengan AbortSignal, Route Handler Node.js, serta contract tests untuk alur sukses dan seluruh kategori kegagalan utama.
- **Milestone:** M4 — Analysis service dan Route Handler
- **Files changed:**
  - `lib/server/analyze.ts`, `lib/server/errors.ts`, `lib/server/rate-limit.ts`
  - `app/api/analyze/route.ts`
  - `lib/market-data/provider.ts`, `lib/market-data/alpha-vantage.ts`, `lib/ai/contracts.ts`, `lib/ai/openrouter.ts`
  - `tests/unit/analyze-route.test.ts`
  - `checklists/M4_API_AND_RUNNER.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 8 berkas dan 52 test.
  - `npm run build`: Lulus; route `/api/analyze` terdeteksi sebagai dynamic Node.js route.
  - OpenRouter dan provider live call: Tidak dilakukan; semua alur memakai fixture/fake adapter.
- **Decisions / blockers:** Response publik hanya memakai kontrak aman dan tidak mengembalikan detail exception, secret, header authorization, prompt, atau stack trace. Deadline aplikasi 55 detik dan request body maksimum 16 KiB; tidak ada polling, job ID, atau background loop. Tidak ada hambatan.
- **Checklist:** `checklists/M4_API_AND_RUNNER.md`
  - [x] Service analisis, Route Handler, error mapping, throttling, deadline, dan acceptance tests M4 selesai serta tervalidasi.

## Timestamp: 2026-08-05 20:46:32 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Memperbaiki acceptance gap M4 agar response ambiguity mengembalikan kandidat, throttle lokal memiliki kode error sendiri, overall deadline tidak disalahartikan sebagai timeout provider, dan slow-AI abort diuji.
- **TLDR AI agents done:** Menambahkan kandidat bounded pada error contract, `REQUEST_RATE_LIMITED` dan `ANALYSIS_TIMEOUT`, memperbarui mapping status/pesan publik, melakukan pruning entry limiter kedaluwarsa, serta menambah regression test ambiguity, provider quota versus local throttle, dan slow AI dengan AbortSignal.
- **Milestone:** M4 — Analysis service dan Route Handler
- **Files changed:**
  - `lib/domain/contracts.ts`, `lib/domain/schemas.ts`
  - `lib/server/analyze.ts`, `lib/server/errors.ts`, `lib/server/rate-limit.ts`, `app/api/analyze/route.ts`
  - `docs/BACKEND_SPEC.md`, `tests/unit/analyze-route.test.ts`
  - `checklists/M4_API_AND_RUNNER.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 8 berkas dan 52 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic Node.js route.
  - OpenRouter dan provider live call: Tidak dilakukan; seluruh regression test memakai fake/fixture.
- **Decisions / blockers:** Kandidat hanya dikembalikan untuk `AMBIGUOUS_INSTRUMENT`; detail provider tetap tidak bocor. `PROVIDER_TIMEOUT` dipakai untuk timeout Alpha Vantage, sedangkan deadline orchestration memakai `ANALYSIS_TIMEOUT`. Tidak ada hambatan.
- **Checklist:** `checklists/M4_API_AND_RUNNER.md`
  - [x] Tiga acceptance gap M4 dan hardening pruning limiter diperbaiki serta tervalidasi.

## Timestamp: 2026-08-05 21:08:21 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Migrasikan adapter AI dari OpenRouter ke Gemini API direct dengan satu model Gemini GA dari environment server-only, structured JSON output, timeout, AbortSignal, telemetry, typed error, one-call behavior, dan tanpa mengubah kontrak service, response publik, metrics, quality gate, evidence packet, atau frontend.
- **TLDR AI agents done:** Mengganti `OpenRouterAdapter` dengan `GeminiAdapter` berbasis REST `generateContent`, menggunakan `x-goog-api-key`, `responseMimeType` JSON, schema Gemini-native, parsing `usageMetadata`, validasi final report yang sama, serta menghapus adapter/schema/env/test OpenRouter yang tidak terpakai.
- **Milestone:** M3/M4 — Gemini AI adapter migration
- **Files changed:**
  - `lib/ai/gemini.ts`, `lib/ai/gemini-schema.ts`, `lib/ai/index.ts`
  - `lib/ai/openrouter.ts` dihapus, `lib/ai/report-schema.ts` dihapus
  - `lib/server/env.ts`, `app/api/analyze/route.ts`, `.env.example`
  - `tests/unit/ai.test.ts`, `tests/unit/analyze-route.test.ts`
  - `docs/BACKEND_SPEC.md`, `docs/BACKEND_IMPLEMENTATION_PLAN.md`, `docs/PROPOSAL_DRAFT.md`
  - `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa peringatan.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 8 berkas dan 54 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic Node.js route.
  - Gemini live call: Tidak dilakukan; seluruh test memakai fake fetch, fixture, dan fake credentials.
- **Decisions / blockers:** Model ID Gemini tidak di-hardcode dan wajib disediakan melalui `GEMINI_MODEL_ID`; key melalui `GEMINI_API_KEY`. Tidak ada automatic repair call. Metrics, quality gate, evidence packet, analysis service contract, response publik, dan frontend tidak diubah. Tidak ada blocker.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Migrasi Gemini, regression tests, dan validasi penuh selesai.

## Timestamp: 2026-08-06 12:31:32 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Migrasikan provider market-data dari Alpha Vantage ke Business Quant tanpa mengubah public API, formula metrics, quality gate, pipeline Gemini, atau frontend; gunakan parser tervalidasi, cache, batas call, error handling, dan fixture tanpa live API.
- **TLDR AI agents done:** Menambahkan `BusinessQuantProvider` dengan universe equity cache 24 jam, profile, IS/BS/CF quarterly paralel, harga EOD tervalidasi, nested slug mapping berbasis `reportedValue.raw`, deduplikasi OHLC aman, TTL cache bounded, retry transient sekali tanpa retry 429, serta menghapus runtime dan fixture Alpha Vantage setelah test Business Quant lulus.
- **Milestone:** M2/M4 — Market data migration dan API runner
- **Files changed:**
  - `lib/market-data/business-quant.ts`, `lib/market-data/business-quant-parsers.ts`, `lib/market-data/provider.ts`, `lib/market-data/normalizer.ts`, `lib/market-data/index.ts`
  - `lib/server/env.ts`, `app/api/analyze/route.ts`, `.env.example`
  - `tests/unit/business-quant.test.ts`, `tests/fixtures/business-quant/*`
  - `lib/market-data/alpha-vantage.ts`, `lib/market-data/parsers.ts`, test dan fixture Alpha Vantage dihapus
  - `docs/BACKEND_SPEC.md`, `docs/BACKEND_IMPLEMENTATION_PLAN.md`, `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M4_API_AND_RUNNER.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa error atau warning.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 8 berkas dan 48 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic Node.js route.
  - Live Business Quant/Gemini call: Tidak dilakukan; seluruh test memakai fake fetch, fixture minimal, dan key palsu.
- **Decisions / blockers:** Context7 tidak menyediakan dokumentasi Business Quant yang valid, sehingga kontrak endpoint diverifikasi melalui dokumentasi resmi Business Quant. Tidak ada key rotation, raw payload tidak diteruskan ke Gemini, dan tidak ada blocker.
- **Checklist:** `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Adapter Business Quant, parser, validasi EOD, cache, quota call count, regression test, dan wiring route selesai serta tervalidasi.

## Timestamp: 2026-08-06 12:54:29 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Perketat migrasi Business Quant dengan menolak nilai finansial null atau blank, memverifikasi identitas ticker dan jenis statement, melengkapi regression test adapter, membersihkan proposal dari Alpha Vantage, lalu menyiapkan controlled live test AAPL.
- **TLDR AI agents done:** Parser kini menolak `null`, `undefined`, string kosong, dan whitespace sebelum konversi angka; provider memvalidasi `metadata.ticker`, `metadata.statement`, serta profile equity. Test ditambah untuk API key hilang, HTTP 401/403/404/500, retry tunggal, invalid JSON, raw value kosong, mismatch metadata, dan profile non-equity. Proposal diperbarui ke Business Quant.
- **Milestone:** M2/M4 — Hardening provider Business Quant dan dokumentasi migrasi
- **Files changed:**
  - `lib/market-data/business-quant-parsers.ts`, `lib/market-data/business-quant.ts`
  - `tests/unit/business-quant.test.ts`
  - `docs/PROPOSAL_DRAFT.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa error atau warning.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run test`: Lulus, 8 berkas dan 61 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic Node.js route.
  - Controlled live test AAPL: Dilewati sebelum request karena `BUSINESS_QUANT_API_KEY` tidak tersedia; tidak ada live API call.
- **Decisions / blockers:** Tidak mencatat credential, URL lengkap, payload, atau raw provider error. Controlled live test tetap perlu dijalankan setelah environment menyediakan key Business Quant; tidak ada blocker pada code atau test lokal.
- **Checklist:** `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] P1 parser/provider, regression coverage, dan pembersihan referensi Alpha Vantage pada proposal selesai serta tervalidasi.
  - [ ] Controlled live test AAPL masih menunggu `BUSINESS_QUANT_API_KEY` tersedia.

## Timestamp: 2026-08-06 13:34:26 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Perbaiki parser universe Business Quant agar row equity yang tidak lengkap tidak menggagalkan pencarian AAPL, tambahkan regression test, lalu ulangi validasi lokal dan controlled live test.
- **TLDR AI agents done:** Parser memvalidasi struktur utama universe, melewati row equity tanpa ticker, nama, atau exchange, tetap menolak universe tanpa kandidat valid, dan mempertahankan kandidat AAPL yang valid. Fixture serta test campuran row valid dan exchange kosong ditambahkan.
- **Milestone:** M2/M4 — Hardening parser universe dan verifikasi live
- **Files changed:**
  - `lib/market-data/business-quant-parsers.ts`
  - `tests/fixtures/business-quant/universe.json`
  - `tests/unit/business-quant.test.ts`
  - `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M4_API_AND_RUNNER.md`
- **Validation:**
  - `npm run test`: Lulus, 8 berkas dan 62 test.
  - `npm run lint`: Lulus tanpa error atau warning.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic Node.js route.
  - Controlled live test AAPL: Belum lulus; production route merespons HTTP 502 `MALFORMED_PROVIDER_RESPONSE`, lalu diagnostic provider mengalami `NETWORK_FAILURE` tanpa mencatat payload atau credential.
- **Decisions / blockers:** Row invalid tidak lagi menggagalkan seluruh universe. Acceptance live tetap terbuka sampai provider mengembalikan respons yang berhasil dan stabil; tidak mencatat credential, URL lengkap, payload, atau raw provider error.
- **Checklist:** `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Regression row universe tidak lengkap selesai dan tervalidasi.
  - [ ] Controlled live analysis AAPL masih terblokir oleh respons provider yang belum stabil.

## Timestamp: 2026-08-06 13:46:32 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Tangani duplicate EOD Business Quant dengan aturan aman untuk record identik dan konflik close, tetap tolak konflik open/high/low, tambahkan regression test, lalu verifikasi ulang alur AAPL.
- **TLDR AI agents done:** Parser memilih volume terbesar untuk duplicate OHLC identik dan konflik close terbatas ketika open/high/low sama, menambahkan warning, serta tetap menolak konflik OHLC utama. Test mencakup ketiga kondisi tersebut.
- **Milestone:** M2/M4 — Hardening EOD parser dan verifikasi live
- **Files changed:**
  - `lib/market-data/business-quant-parsers.ts`
  - `tests/unit/business-quant.test.ts`
  - `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M4_API_AND_RUNNER.md`
- **Validation:**
  - `npx vitest run tests/unit/business-quant.test.ts`: Lulus, 23 test.
  - `npm run test`: Lulus, 8 berkas dan 62 test.
  - `npm run lint`: Lulus tanpa error atau warning.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic Node.js route.
  - Controlled live AAPL: Business Quant melewati alur provider, tetapi endpoint berakhir HTTP 502 `AI_UNAVAILABLE`; Gemini belum menghasilkan analisis end-to-end.
- **Decisions / blockers:** Konflik close terbatas dianggap aman hanya jika open/high/low identik; konflik lainnya tetap malformed. Acceptance end-to-end masih menunggu Gemini tersedia; tidak mencatat credential, URL lengkap, payload, atau raw provider error.
- **Checklist:** `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Regression EOD identik, close-only conflict, dan OHLC conflict selesai serta tervalidasi.
  - [ ] Controlled live AAPL end-to-end masih terblokir pada Gemini.

## Timestamp: 2026-08-06 14:02:47 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Tambahkan logging server-side yang hanya mencatat kategori kegagalan validasi output Gemini, gunakan hasil diagnosis live untuk memperketat evidence IDs dan batas schema, lalu ulangi validasi dan controlled test AAPL.
- **TLDR AI agents done:** Validator kini mengklasifikasikan kegagalan sebagai `contract mismatch`, `unknown evidence`, `unsafe language`, atau `confidence violation`. Route Gemini mencatat request ID dan kategori tanpa raw output. Prompt dan structured schema Gemini sekarang mengirim daftar evidence ID packet yang valid serta batas confidence dan jumlah evidence yang selaras dengan kontrak final.
- **Milestone:** M3/M4 — Diagnosis validator output dan hardening Gemini schema
- **Files changed:**
  - `lib/ai/validation.ts`, `lib/ai/gemini.ts`, `lib/ai/gemini-schema.ts`, `lib/ai/prompt.ts`
  - `app/api/analyze/route.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
- **Validation:**
  - `npm run test`: Lulus, 8 berkas dan 64 test.
  - `npm run lint`: Lulus tanpa error atau warning.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic Node.js route.
  - Controlled live AAPL sebelum patch: HTTP 502 `AI_INVALID_RESPONSE`, kategori `unknown evidence`.
  - Controlled live AAPL sesudah patch: HTTP 502 `AI_UNAVAILABLE`, tanpa kategori validator; provider Business Quant tetap melewati pipeline.
- **Decisions / blockers:** Unknown evidence diperketat melalui enum evidence ID dinamis dan instruksi prompt eksplisit. Acceptance end-to-end masih terblokir oleh availability Gemini; tidak mencatat credential, URL lengkap, payload, atau raw output model.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Logging kategori validator, schema evidence dinamis, batas confidence, regression test, dan validasi lokal selesai.
  - [ ] Controlled live AAPL end-to-end masih terblokir pada Gemini.

## Timestamp: 2026-08-06 14:12:07 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Ganti enum canonical SHA evidence yang terlalu besar dengan alias pendek, kirim alias ke Gemini, map kembali ke canonical ID sebelum validasi final, pin profile schema, dan log status HTTP Gemini secara aman.
- **TLDR AI agents done:** Menambahkan alias evidence deterministik `E1`, `E2`, dan seterusnya pada packet AI; hasil model dipetakan kembali ke SHA canonical sebelum `validateModelReport`. Schema Gemini kini memakai enum alias pendek dan profile enum spesifik per cabang. Status HTTP Gemini dicatat tanpa body respons.
- **Milestone:** M3/M4 — Optimasi structured output Gemini dan acceptance live
- **Files changed:**
  - `lib/ai/evidence-aliases.ts`, `lib/ai/gemini-schema.ts`, `lib/ai/gemini.ts`, `lib/ai/prompt.ts`, `lib/ai/index.ts`
  - `app/api/analyze/route.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
- **Validation:**
  - `npm run test`: Lulus, 8 berkas dan 65 test.
  - `npm run lint`: Lulus tanpa error atau warning.
  - `npm run typecheck`: Lulus dalam mode strict.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic Node.js route.
  - Controlled live AAPL: Lulus HTTP 200; Gemini HTTP 200; tidak mencatat body respons atau credential.
- **Decisions / blockers:** Schema tidak lagi mengirim canonical SHA sebagai enum berulang. Alias hanya digunakan pada kontrak AI dan selalu dikembalikan ke canonical ID sebelum validasi. Tidak ada blocker tersisa pada acceptance live.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Alias evidence, mapping canonical, profile pinning, HTTP status logging, regression test, dan live AAPL selesai.

## Timestamp: 2026-08-06 14:25:02 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Persempit filter unsafe language agar frasa disclaimer dan istilah fundamental netral tidak ditolak secara keliru, lalu pastikan pipeline stabil melalui beberapa live test AAPL berturut-turut.
- **TLDR AI agents done:** Mengganti deteksi kata trading yang terlalu luas menjadi deteksi frasa aksi eksplisit, mempertahankan penolakan instruksi trading langsung, dan menambahkan regression test untuk kalimat netral seperti disclaimer, alokasi modal, serta daya tahan bisnis.
- **Milestone:** M3/M4 — Hardening validator dan stabilisasi live pipeline
- **Files changed:**
  - `lib/ai/validation.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `checklists/M4_API_AND_RUNNER.md`
- **Validation:**
  - `npx vitest run tests/unit/ai.test.ts`: Lulus, 14/14 test.
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 66 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - Tiga controlled live AAPL berturut-turut: semuanya HTTP 200, report hadir, Gemini HTTP 200, dan tidak ada kategori rejection validator.
- **Decisions / blockers:** Filter hanya menolak aksi trading eksplisit atau klaim jaminan; istilah yang muncul dalam konteks disclaimer atau analisis fundamental netral dibiarkan. Tidak ada blocker; raw report dan credential tidak dicatat.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Filter bahasa dan regression test diperketat.
- [x] Tiga consecutive live test AAPL berhasil tanpa rejection `unsafe language`.

## Timestamp: 2026-08-06 19:41:16 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Tambahkan Corporate Actions Business Quant sebagai extension terkontrol pada pipeline M2–M4 StockFrame, dengan parser event tervalidasi, enrichment yang tidak memblokir analisis utama, evidence bounded, dan dukungan response publik.
- **TLDR AI agents done:** Menambahkan endpoint Corporate Actions sebagai call keenam uncached ticker, parser canonical kind dan raw action, filter ticker, bounded notes, deterministic deduplication, status `available/empty/unavailable`, stable evidence IDs, evidence packet maksimal 20 event, prompt event terstruktur, warning split tanpa mengubah historical prices, serta response snapshot yang dapat dipakai marker grafik.
- **Milestone:** M2/M3/M4 — Corporate Actions enrichment
- **Files changed:**
  - `lib/domain/contracts.ts`, `lib/domain/schemas.ts`, `lib/domain/versions.ts`
  - `lib/market-data/provider.ts`, `lib/market-data/business-quant.ts`, `lib/market-data/business-quant-parsers.ts`, `lib/market-data/normalizer.ts`
  - `lib/quality/evidence-packet.ts`, `lib/metrics/calculations.ts`, `lib/ai/evidence-aliases.ts`, `lib/ai/prompt.ts`
  - `tests/fixtures/business-quant/corporate-actions.json`
  - `tests/unit/business-quant.test.ts`, `tests/unit/normalization.test.ts`, `tests/unit/evidence-packet.test.ts`, `tests/unit/metrics.test.ts`, `tests/unit/ai.test.ts`, `tests/unit/analyze-route.test.ts`
  - `PRODUCT.md`, `docs/BACKEND_SPEC.md`, `docs/BACKEND_IMPLEMENTATION_PLAN.md`
  - `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 85 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - Tidak ada live Business Quant atau Gemini call; seluruh test memakai fixture dan fake fetch/adapter.
- **Decisions / blockers:** Corporate Actions adalah enrichment opsional; 429, timeout, 5xx setelah retry, atau payload tidak tersedia menghasilkan status unavailable dan warning aman tanpa menghentikan lima sumber utama. `notes` diperlakukan sebagai teks provider tidak tepercaya, bukan berita. Tidak ada blocker.
- **Checklist:** `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Call keenam, parser, normalisasi, evidence bounded, prompt, warning split, public snapshot, fixture, dan regression test selesai.

## Timestamp: 2026-08-06 20:17:15 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Tutup gap review Corporate Actions dengan memastikan evidence event tidak terpotong, klaim corporate action wajib memiliki provenance, dan event setelah batas waktu snapshot tidak masuk ke analisis.
- **TLDR AI agents done:** Evidence packet kini mencadangkan slot untuk evidence corporate action, schema Gemini dan report menyediakan `corporateActionClaims` ber-evidence, alias dipetakan kembali ke SHA canonical, prose bebas dari klaim event, dan normalizer menyaring event setelah `snapshot.asOf` dengan warning aman.
- **Milestone:** M2/M3/M4 — Corporate Actions acceptance hardening
- **Files changed:**
  - `lib/quality/evidence-packet.ts`, `lib/domain/schemas.ts`, `lib/domain/contracts.ts`
  - `lib/ai/gemini-schema.ts`, `lib/ai/evidence-aliases.ts`, `lib/ai/validation.ts`, `lib/ai/prompt.ts`
  - `lib/market-data/normalizer.ts`
  - `tests/unit/ai.test.ts`, `tests/unit/evidence-packet.test.ts`, `tests/unit/normalization.test.ts`, `tests/unit/analyze-route.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 89 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - `git diff --check`: Lulus.
  - Tidak ada live Business Quant atau Gemini call.
- **Decisions / blockers:** Corporate-action event hanya dapat disebut melalui `corporateActionClaims` dengan evidence event yang tersedia; event setelah `asOf` diabaikan dan diberi warning. Tidak ada blocker.
- **Checklist:** `checklists/M2_MARKET_DATA_AND_METRICS.md`, `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
- [x] Gap truncation evidence, provenance klaim, dan temporal boundary selesai serta tervalidasi.

## Timestamp: 2026-08-06 20:57:19 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Perbaiki sisa gap Corporate Actions pada safety validation, enum evidence Gemini, deteksi prose yang terlalu luas, dan versioning prompt/report contract.
- **TLDR AI agents done:** Safety validation kini mencakup teks claim tanpa mencampurkannya dengan pemeriksaan provenance, Gemini memakai enum khusus alias corporate action, deteksi event membutuhkan konteks, dan versi kontrak dinaikkan ke prompt `m3.ai-prompt.2` serta report `m0.report.2`.
- **Milestone:** M3/M4 — Corporate Actions AI contract hardening
- **Files changed:**
  - `lib/ai/validation.ts`, `lib/ai/gemini-schema.ts`, `lib/ai/gemini.ts`, `lib/domain/versions.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 90 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - `git diff --check`: Lulus.
  - Tidak ada live Business Quant atau Gemini call.
- **Decisions / blockers:** Kata umum seperti ticker, dividend, dan split tidak lagi otomatis memblokir prose tanpa konteks event. Tidak ada blocker.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Safety claim, enum evidence khusus corporate action, contextual event detection, dan contract versioning selesai serta tervalidasi.

## Timestamp: 2026-08-07 07:29:28 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Tutup dua edge case terakhir Corporate Actions: cegah claim saat tidak ada evidence dan jangan menolak prose status normal seperti perusahaan terdaftar atau dividend yield.
- **TLDR AI agents done:** Schema Gemini kini menetapkan `corporateActionClaims.maxItems` menjadi 0 tanpa event, sementara pola deteksi event diperketat agar status listing dan istilah valuasi netral tetap lolos. Regression test ditambahkan.
- **Milestone:** M3/M4 — Corporate Actions edge-case hardening
- **Files changed:**
  - `lib/ai/gemini-schema.ts`, `lib/ai/validation.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`, `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 91 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - `git diff --check`: Lulus.
  - Tidak ada live Business Quant atau Gemini call.
- **Decisions / blockers:** Packet tanpa corporate-action evidence tidak dapat menghasilkan claim melalui schema maupun validator; prose status normal tidak dianggap event. Tidak ada blocker.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Edge case empty evidence dan contextual prose selesai serta tervalidasi.

## Timestamp: 2026-08-07 08:41:08 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Lanjutkan hardening backend StockFrame agar setiap respons Gemini memiliki grounding semantic granular berbasis metric ID, mematuhi kebijakan kategori, confidence rubric, dan provenance Corporate Action.
- **TLDR AI agents done:** Report contract diubah menjadi claim `{ text, metricIds }`, schema Gemini dibatasi pada metric yang tersedia, metric policy dan validasi klaim eksternal ditambahkan, serta alias Corporate Action tetap dipisahkan dari grounding metric. Prompt, versioning, test, dokumentasi, dan consumer contract diperbarui.
- **Milestone:** M3/M4 — Semantic grounding respons Gemini
- **Files changed:**
  - `lib/domain/schemas.ts`, `lib/domain/contracts.ts`, `lib/domain/versions.ts`
  - `lib/ai/metric-policy.ts`, `lib/ai/gemini-schema.ts`, `lib/ai/gemini.ts`, `lib/ai/prompt.ts`, `lib/ai/validation.ts`, `lib/ai/evidence-aliases.ts`
  - `tests/unit/ai.test.ts`, `tests/unit/analyze-route.test.ts`, `tests/unit/domain.test.ts`
  - `docs/BACKEND_SPEC.md`, `docs/BACKEND_IMPLEMENTATION_PLAN.md`, `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa warning.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 94 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - `git diff --check`: Lulus.
  - Full re-index codebase-memory: selesai; tidak ada live Business Quant atau Gemini call.
- **Decisions / blockers:** Metric ID menjadi referensi utama untuk klaim biasa; evidence SHA/alias hanya digunakan untuk Corporate Action claim. Confidence absolut maksimum 0,85 dan degraded maksimum 0,70. Frontend belum diubah, tetapi harus membaca `text` dan `metricIds` pada claim report baru. Tidak ada blocker.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`, `checklists/M4_API_AND_RUNNER.md`
  - [x] Semantic grounding, metric policy, confidence boundary, schema dynamic, regression test, dokumentasi, dan re-index selesai serta tervalidasi.

## Timestamp: 2026-08-07 09:07:07 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Tutup gap semantic grounding berupa validasi angka terhadap metric canonical, policy EPS, provenance Corporate Action pada grounded prose, dan false positive kata `shares`.
- **TLDR AI agents done:** Validator kini membandingkan angka dengan nilai serta unit metric yang dikutip, menambahkan kelompok earnings untuk `eps_ttm`, memblokir istilah Corporate Action pada grounded claim dan mengizinkan disclosure di limitations, serta membatasi deteksi `shares` pada konteks ukuran posisi. Prompt, versi policy/AI, test, dan dokumentasi diperbarui.
- **Milestone:** M3/M4 — Semantic grounding hardening lanjutan
- **Files changed:**
  - `lib/ai/metric-policy.ts`, `lib/ai/validation.ts`, `lib/ai/prompt.ts`, `lib/domain/versions.ts`
  - `tests/unit/ai.test.ts`
  - `docs/BACKEND_SPEC.md`, `docs/BACKEND_IMPLEMENTATION_PLAN.md`, `checklists/M3_AGENTS_AND_PROFILES.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa warning.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 96 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - `git diff --check`: Lulus.
  - Tidak ada live Business Quant atau Gemini call.
- **Decisions / blockers:** Angka boleh ditulis model hanya jika cocok dengan metric canonical dalam toleransi pembulatan dan konversi persen ratio yang eksplisit. Istilah Corporate Action dipindahkan ke claim terstruktur atau limitations. Tidak ada blocker.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Numeric grounding, earnings policy, Corporate Action prose provenance, dan unsafe-language regression selesai serta tervalidasi.

## Timestamp: 2026-08-08 10:55:13 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Tutup edge case semantic grounding untuk angka natural Gemini yang memakai separator atau suffix skala, abaikan tahun/tanggal, dan blokir narasi `ticker_change` di grounded prose.
- **TLDR AI agents done:** Parser numeric claim kini menormalisasi format ribuan/desimal, suffix `K/M/B/T` dan `ribu/juta/miliar`, mengabaikan tanggal serta tahun, dan validator mengenali variasi ticker change. Regression test, prompt, versioning, dokumentasi, dan checklist diperbarui.
- **Milestone:** M3/M4 — Semantic grounding format dan Corporate Action hardening
- **Files changed:**
  - `lib/ai/metric-policy.ts`, `lib/ai/validation.ts`, `lib/ai/prompt.ts`, `lib/domain/versions.ts`
  - `tests/unit/ai.test.ts`
  - `docs/BACKEND_SPEC.md`, `docs/BACKEND_IMPLEMENTATION_PLAN.md`, `checklists/M3_AGENTS_AND_PROFILES.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa warning.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 97 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - `git diff --check`: Lulus.
  - Tidak ada live Business Quant atau Gemini call.
- **Decisions / blockers:** Tahun dan tanggal tidak dianggap sebagai nilai metric; angka berskala harus eksplisit dan ekuivalen secara matematis. `ticker_change` hanya boleh muncul melalui claim Corporate Action terstruktur atau limitations. Tidak ada blocker.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Natural numeric format, date/year exclusion, ticker-change provenance, regression test, dan dokumentasi selesai serta tervalidasi.

## Timestamp: 2026-08-08 11:07:41 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Perbaiki parsing angka campuran agar format `1,000.50` dan `1.000,50` dipahami sebagai 1000,50 dan tambahkan regression test.
- **TLDR AI agents done:** Parser kini mengenali separator terakhir sebagai desimal ketika bagian pecahannya 1–2 digit, tanpa merusak format ribuan penuh. Dua regression test format campuran ditambahkan.
- **Milestone:** M3/M4 — Semantic grounding numeric parser hardening
- **Files changed:**
  - `lib/ai/metric-policy.ts`
  - `tests/unit/ai.test.ts`
- **Validation:**
  - `npm run lint`: Lulus tanpa warning.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 98 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - `git diff --check`: Lulus.
  - Tidak ada live Business Quant atau Gemini call.
- **Decisions / blockers:** Separator campuran diperlakukan sebagai angka desimal hanya bila bagian terakhir memiliki 1–2 digit; tidak ada blocker.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Parsing separator ribuan/desimal campuran dan regression test selesai serta tervalidasi.

## Timestamp: 2026-08-08 11:22:00 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Perbaiki observability kegagalan HTTP Gemini agar telemetry server-side memuat identitas request, model, status, serta error provider yang telah disanitasi, tanpa membocorkan secret atau mengubah response publik.
- **TLDR AI agents done:** Telemetry failure Gemini kini menyimpan status HTTP dan kode/pesan provider yang dibatasi serta disanitasi; logger route hanya menerima field aman. Regression test mencakup status 400, 401, 403, 429, 500, 503, redaksi secret, dan response client generik.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/contracts.ts`, `lib/ai/gemini.ts`, `app/api/analyze/route.ts`
  - `tests/unit/ai.test.ts`, `tests/unit/analyze-route.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
- **Validation:**
  - Test terfokus adapter Gemini dan route: Lulus, 38 test.
  - Full lint, typecheck, test, build, dan `git diff --check`: akan dijalankan setelah perubahan dokumentasi ini.
  - Tidak ada live provider call pada test.
- **Decisions / blockers:** Error provider hanya diekstrak dari field code/status/message yang dipilih, dibatasi panjangnya, dan dirahasiakan dari client. Tidak ada blocker.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Safe failure telemetry Gemini dan regression test redaksi secret selesai.

## Timestamp: 2026-08-08 20:54:13 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Mulai Milestone F0 frontend StockFrame dengan membekukan arah Black Frame / Lime Signal, memetakan kontrak response ke presentation layer, menetapkan policy visualisasi deterministik, dan menyiapkan fixture serta test tanpa mengubah backend atau melakukan live call.
- **TLDR AI agents done:** DESIGN.md diperbarui untuk mode Persuade/Operate dan palet lime/black. Presentation layer pure TypeScript kini mencakup catalog 16 metric, label/group/unit formatter, quality, risk, Corporate Actions, error copy, historical-price presentation, dan visualization policy dengan scalar fallback. Fixture contract-valid untuk success, degraded, error, enrichment, metric status, serta chart eligibility ditambahkan; injection Impeccable sementara dihapus dari layout.
- **Milestone:** F0 — Freeze Presentation Contracts and Reset Direction
- **Files changed:**
  - `DESIGN.md`, `app/layout.tsx`
  - `lib/presentation/metric-catalog.ts`, `formatters.ts`, `quality.ts`, `risk.ts`, `corporate-actions.ts`, `error-copy.ts`, `historical-price.ts`, `visualization-policy.ts`, `index.ts`
  - `lib/fixtures/analyze-success.ts`, `analyze-degraded.ts`, `analyze-errors.ts`, `presentation.ts`, `index.ts`
  - `tests/unit/presentation.test.ts`, `checklists/F0_PRESENTATION_CONTRACTS.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa error atau warning.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 114 test.
  - `npm run build`: Lulus; `/api/analyze` tetap dynamic server route.
  - `git diff --check`: Lulus.
  - Impeccable detector pada `app/layout.tsx`: tidak menemukan temuan.
  - Tidak ada live Business Quant atau Gemini call.
- **Decisions / blockers:** Tidak menambah dependency pada F0; native TypeScript, `Intl`, dan schema production sudah cukup. F0 berhenti pada presentation contracts dan tidak mengimplementasikan UI F1. Tidak ada blocker.
- **Checklist:** `checklists/F0_PRESENTATION_CONTRACTS.md`
  - [x] Arah visual, presentation mappings, visualization policy, fixtures, tests, dependency decision, dan full validation selesai.

## Timestamp: 2026-08-08 18:32:19 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Buat tampilan live StockFrame agar arah desain frontend dapat dilihat langsung, dengan halaman pengenalan bergaya SaaS yang berlanjut ke contoh workspace analisis saham, menggunakan data fixture yang transparan dan tetap membedakan data pasar, hasil kalkulasi engine, serta interpretasi AI.
- **TLDR AI agents done:** Baseline visual “Signal Ledger” diimplementasikan sebagai landing page dan workspace analisis responsif. Tampilan mencakup form riset, pratinjau hasil, grafik historis satu tahun, metrik utama, tiga profil risiko, temuan, corporate actions, disclaimer, serta konfigurasi Impeccable Live untuk iterasi visual langsung.
- **Milestone:** F0 — Frontend visual foundation
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `app/layout.tsx`
  - `DESIGN.md`
  - `.impeccable/live/config.json`
- **Validation:**
  - `npm run lint`: Lulus tanpa warning.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 8 berkas dan 103 test.
  - `npm run build`: Lulus; halaman `/` statis dan `/api/analyze` tetap dynamic.
  - `git diff --check`: Lulus.
  - Pemeriksaan visual desktop 1440×1000 dan mobile 390×844: Komposisi utama tampil responsif dan Impeccable Live terhubung.
- **Decisions / blockers:** Nilai AAPL pada halaman adalah fixture yang diberi label sebagai pratinjau data contoh; integrasi form dengan `/api/analyze` belum dilakukan pada tahap visual foundation. Tidak ada blocker.
- **Checklist:** Tidak ada checklist milestone lama yang diperbarui; task ini memulai fondasi frontend terpisah dari M0–M4.

## Timestamp: 2026-08-09 07:13:46 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Perbaiki gap kontrak F0 sebelum melanjutkan F1: pisahkan grouping metrik presentation dari policy backend, validasi currency pada visualisasi capital structure, selaraskan fixture Corporate Actions yang kosong, dan buat ringkasan harga historis menyertakan mata uang.
- **TLDR AI agents done:** Mapping lima kelompok riset frontend dibuat eksplisit dan independen dari policy AI. Capital structure kini menolak currency mismatch. Fixture degraded dan empty Corporate Actions tidak lagi membawa claim atau evidence event. Text equivalent harga memakai formatter currency-aware.
- **Milestone:** F0 — Frontend visual foundation
- **Files changed:**
  - `lib/presentation/metric-catalog.ts`
  - `lib/presentation/visualization-policy.ts`
  - `lib/presentation/historical-price.ts`
  - `lib/fixtures/analyze-success.ts`
  - `lib/fixtures/analyze-degraded.ts`
  - `tests/unit/presentation.test.ts`
  - `checklists/F0_PRESENTATION_CONTRACTS.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Grouping presentation tidak memakai tipe policy AI. Entry lama yang posisinya tidak kronologis tidak dipindah atau ditulis ulang; entry ini ditambahkan di akhir untuk mempertahankan append-only. Tidak ada blocker.
- **Checklist:** `checklists/F0_PRESENTATION_CONTRACTS.md`
  - [x] Review hardening F0 selesai dan tidak melanjutkan implementasi F1.
## Timestamp: 2026-08-09 07:33:40 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Lanjutkan F1 frontend StockFrame dengan arah visual Black Frame / Lime Signal seperti referensi: hero identitas yang kuat, manifesto lime, alur metode yang jelas, reading guide berbasis evidence, dan transisi menuju meja riset.
- **TLDR AI agents done:** Baseline homepage diganti menjadi pengantar F1 yang responsif. Header minimal, layered evidence artifact, signal line, manifesto, narrative Data → Engine → Interpretasi, reading guide, research desk transition, focus ring, skip link, dan reduced-motion support sudah dibuat.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `app/layout.tsx`
  - `checklists/F1_IDENTITY_AND_INTRO.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
  - Review visual desktop: Lulus; tidak ada overflow atau mechanical detector finding yang tersisa setelah perbaikan logo.
- **Decisions / blockers:** F1 berhenti pada identity dan introduction. Submit API, ambiguity, loading/error state, dan report renderer tetap menjadi F2/F3. Tidak ada live provider call dan tidak ada blocker.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Identity, hero, manifesto, methodology, reading guide, research transition, dan responsive rules selesai.
  - [ ] Interaksi analisis dan report renderer belum termasuk F1.
## Timestamp: 2026-08-09 11:34:53 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Tutup acceptance gap F1 dengan memberi label pada seluruh angka ilustratif, menghapus affordance research desk yang belum berfungsi, menyelaraskan checklist dengan hasil detector, dan mencatat keterbatasan review mobile.
- **TLDR AI agents done:** Artifact hero, contoh methodology, dan reading guide kini menampilkan penanda `Ilustrasi · bukan data live`. Research desk diberi status `Pratinjau F1`, shortcut yang tidak berfungsi dihapus, dan CTA `Susun analisis` menjadi state non-interaktif yang jujur sampai F2.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `checklists/F1_IDENTITY_AND_INTRO.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
  - Impeccable detector: 0 temuan.
- **Decisions / blockers:** Review mobile independen pada viewport 390px belum dapat dibuktikan karena kontrol viewport browser tidak tersedia pada sesi ini; responsive CSS tetap dipertahankan dan status dicentang terpisah di checklist. Belum ada live provider call atau commit Git.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Label ilustrasi, placeholder CTA, dan detector status diselaraskan.
  - [ ] Review viewport mobile 390px tetap terbuka.
## Timestamp: 2026-08-09 12:22:44 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Hilangkan istilah milestone internal dari label, aria-label, dan status research desk agar copy F1 mudah dipahami pengguna umum.
- **TLDR AI agents done:** Copy research desk kini memakai `Meja riset`, `Pratinjau meja riset`, dan `Form analisis segera tersedia` tanpa menyebut F1 atau F2.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus dengan warning normal line-ending Git.
  - Impeccable detector: 0 temuan.
- **Decisions / blockers:** Review mobile independen pada viewport 390px masih terbuka karena kontrol viewport browser belum tersedia; perubahan belum di-commit.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Copy publik research desk bebas dari istilah milestone internal.
  - [ ] Review viewport mobile 390px tetap terbuka.

## Timestamp: 2026-08-09 13:48:57 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Perbaiki build error Unterminated regexp literal setelah sesi Impeccable Live dan pastikan halaman F1 kembali valid.
- **TLDR AI agents done:** Memulihkan source `app/page.tsx` dari source map build F1 terakhir yang valid, menghapus kerusakan JSX sisa cleanup Live, dan mempertahankan copy publik F1 yang sudah disepakati.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Varian Impeccable Live tidak dipersistenkan karena sesi cleanup merusak JSX; source dipulihkan dari artefak build lokal yang tervalidasi. Review mobile 390px masih terbuka dan perubahan belum di-commit.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Build regression akibat JSX rusak dipulihkan dan divalidasi.
  - [ ] Review viewport mobile 390px tetap terbuka.

## Timestamp: 2026-08-09 17:20:40 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Sesuaikan komposisi hero berdasarkan referensi: hapus semua label ilustrasi, hilangkan bidang putih tanpa menghapus isi Interpretasi AI, perbesar grafik, dan cegah label Interpretasi bertumpuk dengan konten lain.
- **TLDR AI agents done:** Menghapus seluruh copy ilustrasi, menghilangkan bidang putih, mengembalikan Interpretasi AI sebagai teks bebas tanpa background, memperbesar grafik utama, dan memindahkan label Interpretasi agar terpisah dari kartu metrik.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Impeccable detector: 0 temuan.
  - Review browser lokal: grafik besar, tanpa bidang putih, dan Interpretasi AI tidak bertumpuk.
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Interpretasi AI tetap dipertahankan sebagai teks bebas sesuai klarifikasi pengguna; review viewport mobile 390px penuh dan commit Git masih terbuka.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Komposisi hero diselaraskan dengan referensi visual terbaru.
  - [ ] Review viewport mobile 390px tetap terbuka.

## Timestamp: 2026-08-09 17:24:39 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Koreksi komposisi hero agar kartu putih Interpretasi AI tetap ada, garis kotak abu-abu yang mengganggu dihapus, grafik tetap besar, dan label Interpretasi tidak bertumpuk dengan kartu.
- **TLDR AI agents done:** Menghapus dua elemen orbit abu-abu, mengembalikan kartu putih Interpretasi AI, menempatkannya di atas area grafik dengan ukuran terbatas, dan memisahkan label Interpretasi dari kartu.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Impeccable detector: 0 temuan.
  - Review browser lokal: kartu putih Interpretasi AI terlihat, garis orbit abu-abu hilang, grafik tetap dominan, dan label terpisah.
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Kartu putih dipertahankan sesuai klarifikasi pengguna; review viewport mobile 390px penuh dan commit Git masih terbuka.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Kartu Interpretasi AI dan grafik disusun tanpa dekorasi orbit yang mengganggu.
  - [ ] Review viewport mobile 390px tetap terbuka.

## Timestamp: 2026-08-09 17:30:30 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Atur ulang hero agar grafik berada di atas dan kartu putih Interpretasi AI berada di bawahnya, lalu hapus box lime bertuliskan Interpretasi.
- **TLDR AI agents done:** Menaikkan posisi grafik, menurunkan kartu putih Interpretasi AI ke bawah grafik, dan menghapus label lime Interpretasi tanpa mengubah isi kartu atau data sumber.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Impeccable detector: 0 temuan.
  - Review browser lokal: grafik berada di atas kartu Interpretasi AI dan label lime Interpretasi sudah hilang.
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Kartu putih Interpretasi AI dipertahankan sesuai arahan terbaru; review viewport mobile 390px penuh dan commit Git masih terbuka.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Hierarki grafik dan kartu Interpretasi AI disusun ulang.
  - [ ] Review viewport mobile 390px tetap terbuka.

## Timestamp: 2026-08-09 17:33:10 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Ubah grafik agar tidak tampak melayang, tetapi menjadi garis besar yang menempel dari bawah kiri dan naik melintasi hero seperti referensi coretan biru.
- **TLDR AI agents done:** Mengikat grafik ke bagian bawah hero, memperbesar tinggi dan rentang visualnya, serta mempertahankan kartu putih Interpretasi AI di bawah jalur grafik.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/globals.css`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Impeccable detector: 0 temuan.
  - Review browser lokal: grafik menempel dari bawah kiri dan naik melintasi area hero.
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Kartu putih Interpretasi AI tetap berada di bawah grafik; review viewport mobile 390px penuh dan commit Git masih terbuka.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Grafik hero dibuat besar dan terikat ke bagian bawah komposisi.
  - [ ] Review viewport mobile 390px tetap terbuka.

## Timestamp: 2026-08-09 14:13:43 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Terapkan penyempurnaan visual artifact hero agar hanya memakai satu grafik yang jelas, tidak tertutup Interpretasi AI, dan tidak menampilkan kotak lime maupun label Kalkulasi yang mengganggu.
- **TLDR AI agents done:** Menghapus frame lime dan grafik mini kedua, memperbesar keterbacaan grafik utama, menurunkan serta mengecilkan lembar Interpretasi AI, mempertahankan label ilustrasi untuk kejujuran data, dan memperbaiki karakter mojibake pada copy F1.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Impeccable detector: 0 temuan.
  - Review browser lokal: grafik tunggal terlihat dan tidak tertutup panel Interpretasi AI.
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Label `Ilustrasi · bukan data live` dipertahankan karena angka contoh masih ditampilkan; review viewport 390px penuh dan commit Git masih terbuka.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Artifact hero memakai satu grafik utama tanpa frame lime dan label Kalkulasi.
  - [ ] Review viewport mobile 390px tetap terbuka.

## Timestamp: 2026-08-09 17:40:37 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Perbaiki posisi panah hijau pada alur metodologi agar tidak menabrak nomor dan label langkah berikutnya di desktop maupun mobile.
- **TLDR AI agents done:** Memusatkan dan memperpendek separator panah di ruang antar-kolom, serta memberi inset tambahan pada layout mobile agar jaraknya tetap aman.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/globals.css`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Impeccable detector: 0 temuan.
  - Review browser lokal desktop dan mobile: panah tidak lagi menyentuh nomor atau label langkah berikutnya.
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Review viewport mobile 390px penuh dan commit Git masih terbuka.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Separator panah metodologi tidak overlap dengan langkah berikutnya.
  - [ ] Review viewport mobile 390px tetap terbuka.

## Timestamp: 2026-08-09 17:47:25 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Pindahkan panah hijau dari area nomor dan label langkah ke sela antara paragraf penjelasan dan kartu contoh seperti pada referensi visual.
- **TLDR AI agents done:** Menurunkan kedua panah separator ke area transisi sebelum kartu contoh pada desktop, menjaga aturan mobile, dan menyelesaikan review viewport 390px.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/globals.css`
  - `checklists/F1_IDENTITY_AND_INTRO.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Impeccable detector: 0 temuan.
  - Review browser lokal desktop: panah berada di sela paragraf dan kartu contoh.
  - Review browser lokal viewport 390px: alur mobile tetap rapi dan tidak overlap.
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 9 berkas dan 115 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Commit Git masih terbuka.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Panah metodologi dipindahkan ke area transisi sebelum kartu contoh.
  - [x] Review viewport mobile 390px selesai.

## Timestamp: 2026-08-09 18:01:36 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Naikkan posisi panah metodologi sedikit dan geser sedikit ke kiri dari posisi sebelumnya.
- **TLDR AI agents done:** Menggeser separator panah ke atas 25px dan ke kiri 8px pada layout desktop, sementara aturan mobile tetap dipertahankan.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/globals.css`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Impeccable detector: 0 temuan.
  - Review browser lokal desktop: panah berada sedikit lebih tinggi dan ke kiri sesuai referensi.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Commit Git masih terbuka.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Posisi separator panah disesuaikan dengan referensi visual.

## Timestamp: 2026-08-09 20:15:18 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Ganti headline utama menjadi “Riset saham. Pahami perusahaannya.” dan perbaiki copy panduan agar lebih masuk akal.
- **TLDR AI agents done:** Mengubah headline hero serta judul reading guide menjadi “Pahami hasilnya. Telusuri buktinya.”, lalu menyelaraskan contoh tagline pada frontend spec.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `docs/FRONTEND_SPEC.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Impeccable detector: 0 temuan.
  - `npm run lint`: Lulus pada validasi perubahan headline.
  - `npm run typecheck`: Lulus pada validasi perubahan headline.
  - `npm run test`: Lulus, 115/115 pada validasi perubahan headline.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - Copy lama tidak lagi ditemukan pada app maupun dokumentasi frontend.
  - `git diff --check`: Lulus.
- **Decisions / blockers:** Commit Git masih terbuka.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Headline dan reading guide memakai copy produk yang lebih jelas.

## Timestamp: 2026-08-09 20:27:01 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Lanjutkan F2 dengan membangun meja riset interaktif, pengiriman request analisis, serta state loading, ambiguity, success, dan error yang konsisten dengan kontrak backend.
- **TLDR AI agents done:** Menambahkan research desk sebagai client boundary terfokus dengan input terkontrol, validasi request, submit ke `/api/analyze`, pembatalan request, pencegahan duplicate submit, status aksesibel, pemilihan kandidat instrumen ambigu, dan handoff success tanpa mengubah response publik backend.
- **Milestone:** F2 — Research Desk dan Request State
- **Files changed:**
  - `app/page.tsx`
  - `app/research-desk.tsx`
  - `app/globals.css`
  - `lib/presentation/analysis-state.ts`
  - `tests/unit/frontend-state.test.ts`
  - `checklists/F2_RESEARCH_DESK_AND_REQUEST_STATE.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 10 berkas dan 120 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - Impeccable detector: 0 temuan.
  - `git diff --check`: Lulus.
- **Decisions / blockers:**
  - Report renderer dan workspace laporan lengkap tetap menjadi scope F3.
  - Tidak ada live call ke Business Quant atau Gemini; seluruh validasi memakai fixture dan kontrak lokal.
  - Commit Git masih terbuka.
- **Checklist:** `checklists/F2_RESEARCH_DESK_AND_REQUEST_STATE.md`
  - [x] Research desk dan request state selesai serta tervalidasi.
  - [x] Regression test state request dan response API ditambahkan.
  - [ ] Report renderer dan workspace laporan lengkap menunggu F3.

## Timestamp: 2026-08-09 20:44:54 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Tutup gap acceptance F2 pada recovery error, ambiguity, dan interaction testing, lalu rapikan hero mobile serta metafora visual agar tidak menyerupai prediksi harga.
- **TLDR AI agents done:** Membedakan recovery retry/edit/tanpa tombol sesuai sumber error, menambahkan aksi `Ubah pencarian` untuk ambiguity, menguji interaction contract untuk duplicate submit, cancel, preserved values, loading, candidate resubmission, dan recovery visibility, serta mengganti garis hero menjadi alur Data–Engine–Interpretasi dengan layout mobile yang tidak memotong konten.
- **Milestone:** F2 — Research Desk dan Request State
- **Files changed:**
  - `app/research-desk.tsx`
  - `app/page.tsx`
  - `app/globals.css`
  - `lib/presentation/analysis-state.ts`
  - `tests/unit/frontend-state.test.ts`
  - `checklists/F1_IDENTITY_AND_INTRO.md`
  - `checklists/F2_RESEARCH_DESK_AND_REQUEST_STATE.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 10 berkas dan 123 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - Impeccable detector: 0 temuan.
  - `git diff --check`: Lulus.
- **Decisions / blockers:**
  - Tidak ada live provider/Gemini call.
  - Visual review manual viewport 390px perlu dilakukan ulang setelah perubahan hero; checklist F1 sengaja belum mencentangnya.
  - Report renderer tetap menjadi scope F3 dan commit Git masih terbuka.
- **Checklist:** `checklists/F2_RESEARCH_DESK_AND_REQUEST_STATE.md`
  - [x] Recovery action, ambiguity recovery, dan interaction contract diperketat.
  - [x] Regression test bertambah menjadi 123 test.
  - [ ] Report renderer dan workspace laporan lengkap menunggu F3.

## Timestamp: 2026-08-09 21:00:11 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Ringkas schema structured output Gemini yang terlalu kompleks agar model `gemini-3.1-flash-lite` dapat menerima kontrak report tanpa mengubah API publik, validasi domain, atau perilaku one-call.
- **TLDR AI agents done:** Mengganti schema provider menjadi `responseJsonSchema` ringkas dengan `$defs` reusable, metric ID dan evidence alias sebagai string yang divalidasi lokal, profil sebagai array tiga item, serta normalisasi deterministik kembali ke kontrak profil publik. Prompt, dokumentasi, test adapter, checklist M3, dan validasi tanpa live call diperbarui.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/gemini-schema.ts`
  - `lib/ai/gemini.ts`
  - `lib/ai/prompt.ts`
  - `tests/unit/ai.test.ts`
  - `docs/BACKEND_SPEC.md`
  - `docs/BACKEND_IMPLEMENTATION_PLAN.md`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 10 berkas dan 123 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
- **Decisions / blockers:**
  - Tidak ada live Gemini/provider call; diagnosis 400 tetap harus dikonfirmasi pada controlled live test berikutnya.
  - Kontrak report publik tetap memakai object profil `conservative`, `moderate`, dan `aggressive`; hanya wire format provider yang memakai array.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
- [x] Schema provider Gemini dipadatkan dengan `$defs` dan normalisasi array profil.
- [x] Regression test schema compact dan one-call tetap lulus.

## Timestamp: 2026-08-09 21:25:30 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Ganti schema structured output Gemini yang masih ditolak menjadi satu protocol flat berbasis array item, pertahankan satu panggilan, validasi lokal, kontrak API, dan lakukan live smoke test AAPL.
- **TLDR AI agents done:** Mengganti schema nested menjadi `items[]` dengan tipe dasar saja, menambahkan parser dan normalizer flat untuk cardinality section, profil, rating, confidence, metric reference, serta corporate-action alias, menaikkan prompt ke `m3.ai-prompt.6`, memperbarui dokumentasi dan regression test, lalu menjalankan live smoke test.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/gemini-schema.ts`
  - `lib/ai/gemini.ts`
  - `lib/ai/prompt.ts`
  - `lib/domain/versions.ts`
  - `tests/unit/ai.test.ts`
  - `docs/BACKEND_SPEC.md`
  - `docs/BACKEND_IMPLEMENTATION_PLAN.md`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: Lulus tanpa warning.
  - `npm run typecheck`: Lulus.
  - `npm run test`: Lulus, 10 berkas dan 134 test.
  - `npm run build`: Lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: Lulus.
  - Live AAPL: HTTP 502 `AI_INVALID_RESPONSE`; schema request diterima tetapi report model belum lolos validasi lokal.
- **Decisions / blockers:**
  - Tetap satu panggilan Gemini dan tidak menambahkan repair/retry AI.
  - Kontrak API/frontend dan `FinalReportSchema` tidak berubah.
  - Controlled live test belum selesai karena output flat dari model masih ditolak; raw output tidak disimpan atau dicatat.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Parser flat, grouping section/profil, alias corporate action, dan regression test ditambahkan.
  - [ ] Live AAPL berhasil menghasilkan report tervalidasi.

## Timestamp: 2026-08-10 05:28:13 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Perinci observability kegagalan Gemini setelah flat schema berhasil, bedakan penyebab normalisasi dengan reason code aman, dan longgarkan kontrak consideration agar hanya memakai placeholder yang ditentukan.
- **TLDR AI agents done:** Menambahkan tipe reason telemetry terbatas, error normalisasi bertipe dengan kategori `flat_envelope`, `unknown_kind`, `placeholder_mismatch`, `missing_section`, `profile_mismatch`, dan `reference_mismatch`, memisahkan validasi thesis dari consideration, serta mencatat telemetry server-side hanya sebagai request ID, kategori, dan reason.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/contracts.ts`
  - `lib/ai/gemini-schema.ts`
  - `lib/ai/gemini.ts`
  - `lib/ai/validation.ts`
  - `app/api/analyze/route.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm test -- --run tests/unit/ai.test.ts`: Lulus, 49/49 test.
  - `npm run typecheck`: Lulus.
  - Live route check: halaman lokal merespons, tetapi `POST /api/analyze` mengembalikan 404 sehingga belum menghasilkan telemetry Gemini.
- **Decisions / blockers:**
  - Tidak mencatat raw output Gemini, prompt, provider body, secret, atau credential.
  - Verifikasi live AAPL tetap terbuka sampai route lokal tersedia dan menghasilkan response dari Gemini.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Reason code telemetry dan placeholder consideration ditambahkan serta diuji.
  - [x] Controlled live AAPL dengan telemetry reason terbaru.

- **Final verification update:** Controlled live AAPL mencapai Gemini dan menghasilkan `AI_INVALID_RESPONSE` dengan telemetry aman `category: contract mismatch` serta `reason: flat_envelope`; tidak ada raw output atau secret yang dicatat.
- **Validasi final tambahan:** `npm run lint`, `npm run typecheck`, `npm run test` (140/140), `npm run build`, dan `git diff --check` lulus.

## Timestamp: 2026-08-10 05:43:55 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Bersihkan grafik hero dengan menghapus label DATA dan ENGINE yang tampil di sepanjang garis sinyal, tanpa menghilangkan kartu data sumber, metrik engine, atau interpretasi AI.
- **TLDR AI agents done:** Menghapus seluruh teks label stage dari SVG grafik hero dan mengganti label aksesibilitasnya menjadi deskripsi garis sinyal visual yang netral.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `checklists/F1_IDENTITY_AND_INTRO.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Detector Impeccable akan dijalankan setelah perubahan UI selesai.
  - Visual target: grafik tetap memiliki garis, rule, dan titik sinyal; label DATA/ENGINE/INTERPRETASI tidak lagi dirender.
- **Decisions / blockers:**
  - Kartu `Data sumber`, `Metrik engine`, dan `Interpretasi AI` dipertahankan karena merupakan artefak utama hero.
  - Review mobile 390px masih terbuka dari pekerjaan F1 sebelumnya.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Menghapus label stage dari grafik hero.
  - [ ] Review visual mobile 390px.

## Timestamp: 2026-08-10 05:50:53 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Ubah grafik hero agar menyerupai garis biru zig-zag yang naik seperti referensi pengguna, serta buat scrollbar halaman custom supaya tidak mengganggu tampilan.
- **TLDR AI agents done:** Mengganti garis lime datar menjadi satu polyline biru yang lebih panjang dan berzig-zag, menghapus rule/marker grafik, menempatkannya lebih rendah di hero, serta menambahkan scrollbar tipis dengan warna tema StockFrame dan state hover.
- **Milestone:** F1 — Identity and Introduction
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `checklists/F1_IDENTITY_AND_INTRO.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Detector Impeccable: akan dijalankan setelah perubahan UI final.
  - `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, dan `git diff --check` dijalankan setelah patch.
- **Decisions / blockers:**
  - Garis biru diperlakukan sebagai visual abstrak, bukan data harga atau prediksi.
  - Review visual mobile 390px tetap menjadi item terbuka dari F1.
- **Checklist:** `checklists/F1_IDENTITY_AND_INTRO.md`
  - [x] Grafik lime zig-zag dan scrollbar custom diterapkan.
  - [ ] Review visual mobile 390px.

- **Final correction:** Bentuk zig-zag dipertahankan, tetapi warna grafik dikembalikan ke Signal Lime agar konsisten dengan identitas visual StockFrame.
- **Final visual correction:** Grafik hero kini memiliki dua lapisan seperti referensi lama: signal line lime, line grafik biru yang naik/zig-zag, serta tiga garis bantu dash abu-abu.
- **Scrollbar correction:** Track dan sudut scrollbar dibuat transparan, panah scrollbar dihilangkan, dan hanya thumb lime yang terlihat agar menyatu dengan halaman.
- **Validation final:** Lint, type-check, 140 test, build, detector Impeccable (0 temuan), dan `git diff --check` lulus.
- **Graph correction:** Menghapus signal line lime terpisah; kini hanya ada satu garis grafik zig-zag naik dengan bentuk referensi lama dan warna lime, sementara dash abu-abu tetap dipertahankan.
- **Graph realism correction:** Mengganti ritme zig-zag berulang dengan fluktuasi titik yang lebih organik, pullback kecil, dan glow lebih halus agar terbaca sebagai grafik saham ilustratif.
- **Validation final:** Lint, type-check, 140 test, build, detector Impeccable (0 temuan), dan `git diff --check` lulus; halaman lokal merespons HTTP 200.

## Timestamp: 2026-08-10 07:13:10 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Pisahkan kegagalan flat Gemini menjadi JSON invalid, envelope flat yang tidak sesuai, dan output terpotong; hilangkan versi internal dari payload model serta catat `finishReason` secara aman.
- **TLDR AI agents done:** Menghapus `schemaVersion` dari kontrak provider dan schema Gemini, menetapkan `REPORT_SCHEMA_VERSION` hanya saat server membentuk report final, menambahkan reason code telemetry `invalid_json`, `flat_envelope`, dan `output_truncated`, serta mendeteksi `MAX_TOKENS` tanpa mencatat content model.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/contracts.ts`
  - `lib/ai/gemini-schema.ts`
  - `lib/ai/gemini.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npx vitest run tests/unit/ai.test.ts`: 50/50 lulus.
  - Gate penuh akan dijalankan setelah pencatatan perubahan ini.
- **Decisions / blockers:**
  - `finishReason` dibatasi ke enum Gemini yang aman; raw content, prompt, credential, dan body provider tidak dicatat.
  - `REPORT_SCHEMA_VERSION` tetap menjadi tanggung jawab server.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Reason telemetry flat dibedakan dan schema provider tidak lagi memercayai versi report dari model.
- **Validasi final:** `npm run lint`, `npm run typecheck`, `npm run test` (141/141 lulus), `npm run build`, dan `git diff --check` lulus.

## Timestamp: 2026-08-10 09:42:54 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Mengurangi risiko output Gemini terpotong dengan thinking level rendah, batas token lebih longgar, dan instruksi prompt yang membatasi jumlah serta panjang item report.
- **TLDR AI agents done:** Menaikkan batas output default Gemini menjadi 8.192 token, menambahkan `thinkingConfig.thinkingLevel: low`, memperketat instruksi cardinality dan panjang teks pada prompt, menaikkan versi prompt ke `m3.ai-prompt.7`, serta menambahkan regression assertion untuk konfigurasi tersebut.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/gemini.ts`
  - `lib/ai/prompt.ts`
  - `lib/domain/versions.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npx vitest run tests/unit/ai.test.ts`: 50/50 lulus.
  - `npm run lint`: lulus.
  - `npm run typecheck`: lulus.
  - `npm run test`: 141/141 lulus.
  - `npm run build`: lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: lulus.
  - Controlled live AAPL setelah restart: `AI_INVALID_RESPONSE` pada percobaan pertama, lalu `AI_UNAVAILABLE` pada percobaan berikutnya; tidak ada dasar aman untuk menaikkan cap ke 12.288 pada task ini.
- **Decisions / blockers:**
  - `thinkingLevel: low` dan 8.192 token dipertahankan sebagai konfigurasi awal; tidak mengubah schema provider atau melakukan repair call.
  - Live provider masih belum menghasilkan report sukses; percobaan terakhir bukan `output_truncated`, sehingga diagnosis berikutnya memerlukan telemetry provider yang tersanitasi.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Batas output dan thinking Gemini dikendalikan untuk mengurangi risiko truncation.

## Timestamp: 2026-08-10 09:53:17 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Menghindari kegagalan report akibat ketidakpatuhan pada field profile, rating, dan confidence yang hanya berfungsi sebagai placeholder pada output Gemini.
- **TLDR AI agents done:** Normalizer kini tetap ketat pada profile thesis, hanya memeriksa profile dan metric references pada consideration, serta mengabaikan metadata placeholder pada item non-profile; regression test ditambahkan untuk membuktikan report tetap valid.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/gemini-schema.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npx vitest run tests/unit/ai.test.ts`: 50/50 lulus.
  - `npm run lint`: lulus.
  - `npm run typecheck`: lulus.
  - `npm run test`: 141/141 lulus.
  - `npm run build`: lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: lulus.
  - Controlled live AAPL: HTTP 502 `AI_INVALID_RESPONSE`, request ID `7948c5c7-7aee-4894-aea8-761f3f9e3c07`; response publik tetap generic dan raw model output tidak dicatat.
- **Decisions / blockers:**
  - Field placeholder tidak dijadikan alasan penolakan karena server membentuk nilai canonical dari struktur yang tervalidasi.
  - Live request masih belum sukses; reason server-side tidak terbaca dari wrapper live saat ini, sehingga penyebab lanjutan perlu diperiksa melalui telemetry aman yang berjalan di proses server.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Placeholder consideration dan item non-profile tidak lagi menggagalkan normalisasi report.

## Timestamp: 2026-08-10 10:01:17 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Memisahkan penyebab kegagalan output flat Gemini agar content kosong, root envelope salah, item tidak valid, dan text kosong memiliki telemetry reason yang berbeda tanpa mengubah schema provider.
- **TLDR AI agents done:** Menambahkan reason code telemetry baru, memetakan setiap cabang parser dan adapter ke kategori yang spesifik, serta menambahkan regression test tanpa mencatat raw output atau secret.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/contracts.ts`
  - `lib/ai/gemini.ts`
  - `lib/ai/gemini-schema.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npx vitest run tests/unit/ai.test.ts`: 53/53 lulus.
  - `npm run lint`: lulus.
  - `npm run typecheck`: lulus.
  - `npm run test`: 144/144 lulus.
  - `npm run build`: lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: lulus.
- **Decisions / blockers:**
  - Provider schema Gemini tidak diubah; root invalid tetap `flat_envelope`, item invalid menjadi `invalid_flat_item`, text kosong menjadi `empty_text`, dan content tidak tersedia menjadi `missing_content`.
  - Live provider tidak dipanggil ulang pada task ini; tidak ada raw response atau credential yang dicatat.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Reason telemetry flat response dipisahkan dan diuji.

## Timestamp: 2026-08-10 10:10:31 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Mengganti kontrak provider Gemini dari wrapper `{ items }` menjadi satu JSON array top-level, tetap menerima format lama di parser, memperbarui prompt, lalu melakukan controlled live test.
- **TLDR AI agents done:** Schema Gemini kini berupa array berisi entry report; parser menerima array baru maupun wrapper lama; prompt meminta tepat satu JSON array; versi prompt internal dinaikkan tanpa menambah reason telemetry.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/gemini-schema.ts`
  - `lib/ai/prompt.ts`
  - `lib/domain/versions.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: lulus.
  - `npm run typecheck`: lulus.
  - `npm test`: 145/145 lulus.
  - `npm run build`: lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: lulus.
  - Controlled live AAPL: HTTP 502 `AI_INVALID_RESPONSE`, request ID `f29140b4-a468-4562-9e1b-a29a56e81e4d`; tidak ada report.
- **Decisions / blockers:**
  - Public `FinalReport` tidak berubah dan reason telemetry tidak ditambah.
  - Provider menerima schema array, tetapi live response masih gagal pada validasi lokal; investigasi berikutnya perlu memakai telemetry reason yang sudah ada, bukan memperluas kontrak lagi.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Kontrak provider array top-level dan kompatibilitas parser diuji.

## Timestamp: 2026-08-10 10:46:23 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Mengadopsi arsitektur Gemini profile-only seperti implementasi referensi: model hanya mengembalikan interpretasi tiga profil risiko, sedangkan backend membangun bagian laporan lain secara deterministik. Parser fence JSON, validasi lokal, fallback JSON mode satu kali, dan kontrak `FinalReport` publik harus tetap kompatibel.
- **TLDR AI agents done:** Mengubah alur provider Gemini menjadi profile-only, menambahkan normalisasi interpretasi dan pembentukan report deterministik, mempertahankan parser flat lama untuk kompatibilitas, serta menyelaraskan structured schema dengan format Gemini-native `responseSchema`.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/domain/schemas.ts`
  - `lib/domain/contracts.ts`
  - `lib/ai/gemini-schema.ts`
  - `lib/ai/deterministic-report.ts`
  - `lib/ai/prompt.ts`
  - `lib/ai/validation.ts`
  - `lib/ai/gemini.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: lulus.
  - `npm run typecheck`: lulus.
  - `npm test -- --run`: 147/147 test lulus.
  - `npm run build`: lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: lulus.
  - Controlled live AAPL: route tetap mengembalikan HTTP 502 `AI_UNAVAILABLE`; probe provider tersanitasi menunjukkan HTTP 429 `RESOURCE_EXHAUSTED` karena quota Gemini habis, sehingga report live belum dapat diverifikasi.
- **Decisions / blockers:**
  - Gemini hanya dipercaya untuk tiga interpretasi profil risiko; summary, strengths, risks, uncertainties, limitations, corporate-action claims, dan disclaimer dibuat backend.
  - Schema provider memakai `responseSchema` Gemini-native; fallback JSON mode satu kali untuk `400 INVALID_ARGUMENT` tetap dipertahankan.
  - Public error response tetap generic dan tidak ada raw prompt, body provider, atau credential yang dicatat.
  - Blocker tersisa adalah quota Gemini live (`429 RESOURCE_EXHAUSTED`), bukan kegagalan kontrak lokal.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Menggunakan kontrak profile-only dan report deterministik untuk mengurangi kompleksitas structured output Gemini.

## Timestamp: 2026-08-10 11:12:38 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Menyamakan pipeline Gemini profile-only dengan implementasi referensi agar schema native, instruksi metric ID, validasi corporate-action prose, dan reason telemetry tidak saling bertentangan. Perubahan diuji lokal tanpa live request baru.
- **TLDR AI agents done:** Membetulkan tipe provider `ARRAY`, mewajibkan setiap thesis dan consideration memiliki metric ID, mengizinkan corporate-action wording yang grounded pada interpretasi profil, serta memisahkan reason `contract_mismatch` dari `flat_envelope`.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/gemini-schema.ts`
  - `lib/ai/prompt.ts`
  - `lib/ai/validation.ts`
  - `lib/ai/contracts.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: lulus.
  - `npm run typecheck`: lulus.
  - `npm test -- --run`: 148/148 test lulus.
  - `npm run build`: lulus; `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: lulus.
  - Tidak ada live API call baru.
- **Decisions / blockers:**
  - Parser flat tetap hanya untuk kompatibilitas legacy; alur aktif tetap profile-only.
  - Corporate-action terms pada profile interpretation tidak lagi ditolak otomatis; provenance corporate action pada FinalReport tetap divalidasi.
  - Reason contract umum kini `contract_mismatch`; `flat_envelope` dicadangkan untuk envelope flat legacy.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Menyamakan schema, prompt, validasi profile-only, dan klasifikasi reason telemetry.

## Timestamp: 2026-08-10 10:59:20 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Mengadopsi tampilan frontend dari salinan StockFrame milik rekan ke workspace utama, dengan tetap mempertahankan Route Handler, metrics engine, dan pipeline AI yang sudah ada.
- **TLDR AI agents done:** Mengganti halaman dan styling utama dengan Research Score Sheet hitam-lime beserta workspace laporan bertab, memperbarui metadata halaman, dan mengecualikan script live-development lokal milik sumber.
- **Milestone:** F2 — Research Desk dan Request State
- **Files changed:**
  - `app/page.tsx`
  - `app/globals.css`
  - `app/layout.tsx`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: lulus tanpa warning.
  - `npm run typecheck`: lulus setelah regenerasi tipe Next.js yang stale.
  - `npm run test`: 147/147 test lulus.
  - `npm run build`: lulus; route `/` static dan `/api/analyze` dynamic.
  - `git diff --check`: lulus.
  - Visual review `http://localhost:3000/`: halaman Research Score Sheet hitam-lime tampil sesuai sumber.
- **Decisions / blockers:**
  - Backend, kontrak API, metrics engine, dan pipeline Gemini tidak disalin dari repository sumber.
  - Script `impeccable live` yang menunjuk localhost sumber tidak disalin.
  - Kriteria lama F1/F2 belum dicentang ulang karena baseline pilihan baru menempatkan form analisis pada viewport pertama dan menyederhanakan request state.
- **Checklist:** Tidak ada item checklist yang diubah pada task ini.

## Timestamp: 2026-08-10 11:33:40 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Periksa response Gemini yang ditolak dan sesuaikan kontrak prompt dengan pasangan istilah klaim serta metric ID yang benar.
- **TLDR AI agents done:** Menjalankan controlled inspection tanpa menyimpan raw response; ditemukan struktur profile-only valid, tetapi dua consideration memakai `eps_ttm` untuk bahasa profitabilitas. Prompt diperketat agar istilah EPS, profitabilitas, valuasi, leverage, likuiditas, dan arus kas selalu selaras dengan metric ID yang dirujuk.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/prompt.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - Controlled Gemini inspection: HTTP 200, `STOP`, root `profiles` valid; rejection teridentifikasi sebagai `Claim requires profitability metrics`.
  - Temporary inspection harness: lulus dan dihapus setelah diagnosis.
  - Full lint, typecheck, test, dan build belum dijalankan setelah patch prompt.
- **Decisions / blockers:**
  - Validator tetap ketat; perbaikan diarahkan ke instruksi semantic grounding agar model menghasilkan klaim yang kompatibel.
  - Tidak mencatat raw response, credential, atau secret. Live request berikutnya perlu dilakukan setelah gate lokal lulus.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Mempertegas pasangan bahasa klaim dan metric ID pada prompt profile-only.

## Timestamp: 2026-08-10 11:43:21 WIB

- **Model used:** GPT5.6 Luna High
- **Human Prompt:** Longgarkan sementara validator semantic grounding agar hasil analisis Gemini yang struktur, evidence, dan angka-nya valid dapat diterima untuk kebutuhan darurat.
- **TLDR AI agents done:** Menonaktifkan sementara penolakan berdasarkan kecocokan bahasa dengan kelompok metric, sambil mempertahankan validasi metric tersedia, evidence, angka canonical, confidence, struktur profil, dan larangan klaim eksternal maupun instruksi transaksi.
- **Milestone:** M3 — One-model analysis pipeline
- **Files changed:**
  - `lib/ai/metric-policy.ts`
  - `tests/unit/ai.test.ts`
  - `checklists/M3_AGENTS_AND_PROFILES.md`
  - `devlog/DEVELOPMENT_LOG.md`
- **Validation:**
  - `npm run lint`: lulus.
  - `npm run typecheck`: lulus.
  - `npm test -- --run`: 148/148 lulus.
  - `npm run build`: lulus.
  - `git diff --check`: lulus.
  - Controlled live AAPL request setelah restart: HTTP 200, report tersedia.
- **Decisions / blockers:**
  - Mode kompatibilitas semantic grounding bersifat sementara dan perlu diperketat kembali setelah output Gemini stabil.
  - Validasi keamanan dasar dan provenance tetap aktif; tidak mencatat raw response atau credential.
- **Checklist:** `checklists/M3_AGENTS_AND_PROFILES.md`
  - [x] Menandai mode kompatibilitas sementara untuk menerima wording Gemini yang tidak selaras sempurna dengan kelompok metric.
