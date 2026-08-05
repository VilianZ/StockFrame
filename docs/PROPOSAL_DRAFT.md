# Proposal Bitsmikro Innovative Vibecode 2026

Nama project sementara: **EquiScope AI**  
Tagline: **Riset Saham Berbasis Data untuk Setiap Profil Risiko**

> Nama project, tagline, identitas tim, dan teknologi frontend dapat disesuaikan sebelum proposal final dikirimkan.

## Informasi Tim

- **Nama Tim:** `[Nama tim]`
- **Nama Project:** EquiScope AI
- **Kategori:** Mahasiswa
- **Asal Universitas:** Universitas Mikroskil
- **Anggota 1 (Ketua):** `[Nama]`
- **Anggota 2:** `[Nama]`
- **Anggota 3:** `[Nama, jika ada]`

# BAB I - PENDAHULUAN

## 1.1 Latar Belakang

Perkembangan teknologi finansial telah membuat data pasar modal semakin mudah diperoleh. Namun, kemudahan akses tersebut belum selalu diikuti dengan kemampuan pengguna dalam memahami laporan keuangan, indikator pasar, risiko perusahaan, dan hubungan antarmetrik secara menyeluruh. Informasi mengenai suatu perusahaan sering tersebar dalam berbagai sumber dan disajikan dalam bentuk yang sulit dipahami oleh pengguna pemula.

Di sisi lain, penggunaan kecerdasan buatan untuk analisis finansial memiliki tantangan tersendiri. Model AI dapat memberikan penjelasan yang meyakinkan, tetapi berisiko menghasilkan angka atau kesimpulan yang tidak didukung oleh data. Oleh karena itu, dibutuhkan sistem yang memisahkan proses perhitungan finansial dari proses interpretasi AI.

EquiScope AI dirancang sebagai platform riset saham berbasis web yang menggabungkan data pasar, perhitungan metrik finansial secara deterministik, dan analisis AI terstruktur. Sistem menghitung metrik seperti P/E, DER, ROA, ROE, ROIC, margin laba, free cash flow, price return, dan volatilitas menggunakan TypeScript di sisi server. Satu model AI kemudian menginterpretasikan hasil tersebut dan menyajikannya dalam satu laporan untuk profil konservatif, moderat, dan agresif.

## 1.2 Rumusan Masalah

Berdasarkan latar belakang tersebut, rumusan masalah project ini adalah:

1. Bagaimana membantu pengguna memahami kondisi fundamental dan risiko suatu perusahaan tanpa harus membaca data finansial mentah dari berbagai sumber?
2. Bagaimana memanfaatkan AI untuk menginterpretasikan data saham tanpa menyerahkan perhitungan finansial utama kepada AI?
3. Bagaimana menyajikan hasil riset yang relevan bagi pengguna dengan toleransi risiko konservatif, moderat, dan agresif?

## 1.3 Tujuan Project

Tujuan pengembangan EquiScope AI adalah:

1. Menyediakan platform riset saham yang dapat mengambil, menormalisasi, dan mengolah data perusahaan secara terstruktur.
2. Menghasilkan metrik finansial yang transparan, dapat ditelusuri, dan tidak bergantung pada perhitungan AI.
3. Menggunakan AI untuk menjelaskan data dan menghasilkan laporan riset berdasarkan tiga profil risiko.
4. Membantu pengguna memahami kekuatan, kelemahan, peluang, risiko, dan keterbatasan data perusahaan.

## 1.4 Manfaat Project

1. **Bagi pengguna:** Mempermudah proses memahami kondisi perusahaan melalui laporan yang ringkas, terstruktur, dan berbasis data.
2. **Bagi masyarakat:** Mendukung literasi finansial dan penggunaan AI secara lebih bertanggung jawab dalam bidang investasi.
3. **Bagi pengembang:** Memberikan pengalaman membangun aplikasi full-stack yang mengintegrasikan data finansial, AI, keamanan API, pengujian, dan cloud deployment.

# BAB II - DESKRIPSI PROJECT

## 2.1 Nama Project

- **Nama Project:** EquiScope AI
- **Tagline:** *Riset Saham Berbasis Data untuk Setiap Profil Risiko.*

## 2.2 Deskripsi Singkat Project

EquiScope AI adalah platform riset saham berbasis web yang membantu pengguna memahami kondisi suatu perusahaan melalui data pasar, metrik finansial, dan interpretasi AI. Pengguna cukup memilih perusahaan dan menuliskan aspek yang ingin dianalisis, kemudian sistem menghasilkan laporan terstruktur untuk profil konservatif, moderat, dan agresif.

EquiScope AI tidak melakukan transaksi saham dan tidak memberikan nasihat finansial personal. Hasil yang diberikan bersifat riset dan edukasi.

## 2.3 Gambaran Umum Project

Pengguna memulai analisis dengan mencari nama perusahaan atau ticker saham. Sistem akan menampilkan kandidat yang sesuai agar tidak memilih perusahaan secara ambigu. Setelah perusahaan dipilih, pengguna menuliskan fokus analisis, misalnya valuasi, kemampuan menghasilkan laba, kondisi utang, atau prospek pertumbuhan.

Route Handler Next.js mengambil data pasar dan laporan keuangan melalui Alpha Vantage. Data kemudian dinormalisasi dan digunakan untuk menghitung metrik finansial menggunakan TypeScript. Setiap metrik memiliki formula, status, sumber data, dan peringatan apabila perhitungan tidak dapat dilakukan.

Setelah melewati pemeriksaan kualitas data, sistem mengirimkan paket data terstruktur kepada satu model AI melalui OpenRouter. Satu permintaan AI menghasilkan laporan akhir secara langsung. Perspektif konservatif, moderat, dan agresif merupakan tiga bagian dari laporan yang sama, bukan tiga agen atau tiga permintaan AI terpisah.

Laporan akhir menampilkan ringkasan, analisis fundamental, valuasi, kekuatan perusahaan, risiko, keterbatasan data, tingkat keyakinan, serta rekomendasi untuk tiga profil risiko.

## 2.4 Target Pengguna

Target pengguna EquiScope AI adalah:

- **Mahasiswa dan pelajar:** Pengguna yang ingin mempelajari cara membaca data fundamental perusahaan dan memahami penggunaan AI dalam riset finansial.
- **Investor pemula:** Pengguna yang membutuhkan rangkuman terstruktur sebelum melakukan riset lebih lanjut.
- **Pengajar dan komunitas finansial:** Pihak yang membutuhkan alat bantu edukasi untuk menjelaskan metrik perusahaan dan perbedaan toleransi risiko.

## 2.5 Solusi yang Ditawarkan

EquiScope AI menawarkan satu alur riset terintegrasi:

1. Menyelesaikan nama perusahaan menjadi ticker yang tepat.
2. Mengambil data pasar dan laporan keuangan.
3. Menormalisasi data dari penyedia eksternal.
4. Menghitung metrik finansial menggunakan formula TypeScript.
5. Menilai kelengkapan dan kualitas data.
6. Menggunakan AI untuk menginterpretasikan data yang telah diverifikasi.
7. Menghasilkan laporan untuk tiga profil risiko.
8. Menampilkan sumber data, peringatan, dan keterbatasan analisis.

Pendekatan ini mengurangi risiko AI mengarang angka karena nilai finansial utama dihitung oleh fungsi server-side. AI hanya digunakan untuk menjelaskan hubungan antardata dan menyusun laporan yang lebih mudah dipahami.

## 2.6 Keunggulan dan Inovasi Project

Keunggulan EquiScope AI meliputi:

1. **Pemisahan perhitungan dan interpretasi:** Metrik dihitung secara deterministik oleh TypeScript, sedangkan AI hanya melakukan interpretasi.
2. **Tiga profil risiko dari data yang sama:** Satu penelitian menghasilkan sudut pandang konservatif, moderat, dan agresif tanpa mengambil data berulang kali.
3. **AI pipeline yang sederhana dan terkontrol:** Satu model menghasilkan seluruh laporan dalam satu permintaan normal tanpa debat, review loop, atau tool-calling.
4. **Evidence-based report:** Klaim dan metrik terhubung dengan evidence ID serta tanggal efektif data.
5. **Data-quality gate:** Sistem menghentikan analisis AI jika data tidak mencukupi.
6. **Transparansi keterbatasan:** Data kosong, formula yang tidak bermakna, dan tingkat keyakinan ditampilkan kepada pengguna.

# BAB III - PERANCANGAN SISTEM

## 3.1 Analisis Kebutuhan Sistem

### Kebutuhan Fungsional

- Pengguna dapat mencari perusahaan berdasarkan nama atau ticker.
- Sistem menampilkan kandidat apabila perusahaan ambigu.
- Pengguna dapat menuliskan fokus analisis.
- Sistem mengambil market snapshot terbaru.
- Sistem menghitung metrik finansial.
- Sistem melakukan pemeriksaan kualitas data.
- Sistem menggunakan satu model AI untuk menghasilkan laporan terstruktur.
- Sistem menghasilkan tepat tiga profil rekomendasi.
- Pengguna dapat melihat status proses saat menunggu respons.

### Kebutuhan Non-Fungsional

- API key dan credential tidak boleh dikirim ke browser.
- Semua external call memiliki timeout dan retry terbatas.
- Nilai metrik harus dapat direproduksi dari data sumber.
- Sistem harus menolak output AI yang tidak sesuai schema.
- Sistem harus menampilkan error yang mudah dipahami.
- Data sensitif tidak boleh dicatat dalam log.
- Antarmuka harus responsif pada desktop dan perangkat mobile.

## 3.2 Alur Kerja Sistem

1. Pengguna membuka aplikasi.
2. Pengguna mencari nama perusahaan atau ticker.
3. Sistem menampilkan hasil pencarian yang didukung.
4. Pengguna memilih perusahaan dan menuliskan fokus analisis.
5. Route Handler mengambil market snapshot dari Alpha Vantage.
6. TypeScript menormalisasi data, menghitung metrik, dan memeriksa kualitas data.
7. Satu model AI menghasilkan laporan berdasarkan data yang telah diverifikasi.
8. Server memvalidasi struktur laporan dan evidence ID.
9. Pengguna melihat laporan serta tiga perspektif risiko.

```mermaid
flowchart TD
    A[Buka aplikasi] --> B[Cari perusahaan]
    B --> C[Pilih ticker]
    C --> D[Tulis fokus analisis]
    D --> E[Ambil data pasar]
    E --> F[Hitung metrics]
    F --> G[Periksa kualitas data]
    G --> H[Analisis AI]
    H --> I[Validasi report]
    I --> J[Tampilkan hasil]
```

## 3.3 Arsitektur Sistem

```mermaid
flowchart TD
    B[Browser] --> A[Next.js di Vercel]
    A --> R[Route Handler /api/analyze]
    R --> AV[Alpha Vantage]
    R --> ME[TypeScript Metrics Engine]
    ME --> DQ[Data Quality Gate]
    DQ --> OR[Satu Model via OpenRouter]
    OR --> FR[Structured AI Report]
    FR --> B
```

Frontend dan fungsi server-side berada dalam satu project Next.js. Route Handler menjadi pintu aman untuk mengakses Alpha Vantage dan OpenRouter tanpa mengirim API key ke browser. Perhitungan metrik dilakukan dengan TypeScript, sedangkan satu model AI menyusun interpretasi akhir. Seluruh aplikasi di-hosting pada Vercel tanpa server Python terpisah.

## 3.4 Perancangan Antarmuka

Antarmuka EquiScope AI menggunakan pendekatan dashboard riset yang profesional, tenang, dan mudah dipindai. Informasi ditampilkan secara bertahap agar pengguna tidak langsung dibebani seluruh data finansial.

Prinsip desain:

- Hierarki informasi yang jelas.
- Kontras warna yang mudah dibaca.
- Progressive disclosure untuk metrik detail.
- Status loading dan progress yang informatif.
- Penjelasan untuk istilah finansial.
- Warna rating tidak menjadi satu-satunya pembeda.
- Disclaimer dan keterbatasan data ditampilkan dengan jelas.
- Desain responsif untuk desktop dan mobile.

## 3.5 Tampilan Halaman Aplikasi

Screenshot atau mockup yang disarankan:

1. **Halaman New Analysis**
   - Pencarian perusahaan.
   - Input fokus riset.
   - Tombol mulai analisis.
2. **Status Analysis**
   - Fetching data.
   - Calculating metrics.
   - Analyzing.
   - Completed atau error yang mudah dipahami.
3. **Halaman Research Result**
   - Executive summary.
   - Metrics utama.
   - Strengths dan risks.
   - Conservative, moderate, dan aggressive.
   - Evidence dan data limitations.

## 3.6 Teknologi yang Digunakan

| Kategori | Teknologi | Keterangan |
|---|---|---|
| Full-stack Framework | Next.js, React, dan TypeScript | Frontend serta Route Handler dalam satu project |
| Styling | Tailwind CSS atau CSS framework terpilih | Design system dan responsive layout |
| Server-side API | Next.js Route Handlers | Menjaga API key, mengatur workflow, dan memvalidasi respons |
| Financial Engine | TypeScript | Normalisasi data dan perhitungan metrik deterministik |
| Market Data | Alpha Vantage | Data harga dan laporan keuangan |
| AI/LLM | OpenRouter | Gateway menuju satu model AI |
| Deployment | Vercel | Hosting frontend dan server-side Functions |
| Version Control | Git dan GitHub | Kolaborasi dan penyimpanan source code |
| Testing | Vitest dan test tooling Next.js | Unit, contract, integration, dan Route Handler test |
| AI Development Tool | Codex | Membantu planning, implementasi, testing, dan dokumentasi |

# BAB IV - PENUTUP

## 4.1 Kesimpulan

EquiScope AI merupakan platform riset saham yang menggabungkan pengolahan data finansial secara deterministik dengan kemampuan interpretasi AI. Sistem membantu pengguna memahami kondisi perusahaan tanpa menyerahkan perhitungan finansial utama kepada model AI.

Dengan market snapshot, evidence ID, data-quality gate, dan output terstruktur, EquiScope AI berusaha menghasilkan laporan yang lebih transparan dan dapat ditelusuri. Tiga profil risiko membantu pengguna melihat bagaimana data yang sama dapat menghasilkan pertimbangan berbeda berdasarkan toleransi risiko.

## 4.2 Saran dan Pengembangan Selanjutnya

Pengembangan berikutnya dapat mencakup:

1. Penambahan data berita dan sentimen sebagai evidence opsional.
2. Perbandingan performa perusahaan dalam beberapa periode.
3. Penambahan indikator teknikal.
4. Dukungan terhadap ETF dan bursa lain.
5. Export laporan ke PDF.
6. Watchlist dan perbandingan beberapa perusahaan.
7. Penggunaan model AI kedua sebagai reviewer independen.
8. Pemisahan API dan worker ketika jumlah pengguna meningkat.

# DAFTAR PUSTAKA AWAL

1. Alpha Vantage. *API Documentation*. https://www.alphavantage.co/documentation/
2. OpenRouter. *Documentation*. https://openrouter.ai/docs/
3. Next.js. *Next.js Documentation*. https://nextjs.org/docs
4. Vercel. *Vercel Documentation*. https://vercel.com/docs
5. Tambahkan referensi akademik atau buku untuk formula ROA, ROE, ROIC, DER, dan rasio finansial lainnya.

# LAMPIRAN

## Lampiran 1. Dokumentasi Project

- Screenshot proses development.
- Screenshot pengujian backend dan frontend.
- Screenshot hasil akhir aplikasi.

## Lampiran 2. Link Repository

- **Link:** `[Masukkan link repository public]`
- **Platform:** GitHub
- **Branch utama:** `main`

## Lampiran 3. Link Video Demo Project

- **Link:** `[Masukkan link video]`
- **Platform deployment:** Vercel

## Lampiran 4. Pembagian Tugas Anggota

| No | Nama Anggota | Peran | Tugas Detail |
|---:|---|---|---|
| 1 | `[Ketua]` | Server-side Developer | Domain, Route Handler, market data, metrics, AI pipeline, testing, dan deployment |
| 2 | `[Anggota 2]` | Frontend Developer | Implementasi halaman, API integration, responsive layout, dan frontend testing |
| 3 | `[Anggota 3]` | UI/UX dan Frontend | Design system, user flow, komponen, accessibility, dan dokumentasi visual |

## Lampiran 5. Link Prompting AI

Dokumen ini berisi kumpulan prompt yang digunakan selama proses Vibecoding dan development project.

- **Link:** `[Masukkan link dokumen prompt dan development log]`

## Lampiran 6. Link Postingan Media Sosial Instagram

- **Link:** `[Masukkan link postingan]`
- **Username Instagram:** `@[username]`
