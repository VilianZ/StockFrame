# M3 — One-model analysis pipeline

- [x] Gunakan satu model Gemini GA yang dikonfigurasi melalui environment server-only.
- [x] Bangun prompt contract berversi dengan user focus dan evidence packet yang dibatasi serta diberi delimiter.
- [x] Definisikan response schema JSON terstruktur untuk report dan tiga profil risiko.
- [x] Validasi report model menggunakan schema domain, exact profiles, rating, confidence, dan evidence IDs.
- [x] Tolak output malformed, profile hilang/mismatch, evidence asing, instruksi trading personal, dan confidence degraded yang terlalu tinggi.
- [x] Pastikan quality insufficient tidak memanggil model dan tidak ada automatic repair call.
- [x] Sediakan telemetry request ID, model ID, latency, dan token usage tanpa secret atau raw response.
- [x] Tambahkan fake adapter tests untuk success, one-call behavior, malformed JSON, invalid output, prompt bounds, dan quality gate.
- [x] Lulus lint, strict type-check, unit test, dan production build tanpa Gemini live call.
- [x] Menutup acceptance gap: instruksi trading Bahasa Indonesia, prompt delimiter injection, evidence minimum, failure telemetry, dan integration gate M2→M3.
- [x] Menyatakan canonical metrics tetap terpisah dari prose report AI dan melakukan full re-index knowledge graph setelah perubahan.
- [x] Memastikan token usage tetap masuk failure telemetry ketika envelope valid tetapi content model malformed.
- [x] Migrasi adapter M3 ke satu model Gemini GA melalui environment server-only dengan structured JSON schema Gemini dan telemetry yang tetap tervalidasi.
- [x] Menambahkan logging kategori kegagalan validator tanpa raw output dan menyelaraskan schema Gemini dengan evidence IDs serta batas confidence final.
- [x] Menggunakan alias evidence pendek deterministik (`E1`, `E2`, dan seterusnya), mapping balik ke canonical SHA, serta pin profile per cabang pada Gemini schema.
- [x] Menjaga frasa disclaimer dan istilah fundamental netral tetap lolos filter unsafe language, sambil tetap menolak instruksi trading eksplisit.
