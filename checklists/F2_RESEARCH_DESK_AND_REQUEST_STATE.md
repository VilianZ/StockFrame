# F2 — Research Desk dan Request State

- [x] Research desk menjadi client boundary terfokus untuk alur riset.
- [x] Input perusahaan/ticker dan fokus riset memakai state terkontrol dengan batas kontrak backend.
- [x] Submit mengirim `POST /api/analyze` dengan payload JSON yang tervalidasi.
- [x] Duplicate submit dicegah dan request aktif dapat dibatalkan dengan `AbortController`.
- [x] Nilai query dan fokus dipertahankan saat loading, ambiguity, maupun error.
- [x] Loading memakai status netral dan diumumkan melalui `aria-live`.
- [x] Error typed dari API dipetakan ke copy pemulihan Bahasa Indonesia tanpa membocorkan detail provider.
- [x] Recovery action dibedakan antara retry, edit pencarian, dan status tanpa tombol berdasarkan sumber error.
- [x] Ambiguous instrument menampilkan kandidat, resubmission ticker kanonis, dan aksi `Ubah pencarian`.
- [x] Success state menyiapkan handoff data analisis ke workspace laporan.
- [x] Parser request/response dan interaction contract memiliki regression test untuk success, ambiguity, invalid input, malformed response, duplicate submit, cancel, preserved values, dan recovery visibility.
- [x] Test lokal tidak melakukan live call ke Business Quant atau Gemini.
- [x] Jalur `HomePage` memakai parser response canonical dan menampilkan kandidat ambiguity tanpa mengaktifkan cancel atau workflow recovery kompleks.
- [ ] Report renderer dan workspace laporan lengkap dikerjakan pada F3.
