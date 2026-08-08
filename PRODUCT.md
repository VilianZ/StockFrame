# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Mahasiswa yang mempelajari analisis fundamental dan cara membaca data perusahaan.
- Investor pemula yang membutuhkan rangkuman terstruktur sebelum melakukan riset lanjutan.
- Financial advisor yang membutuhkan alat bantu riset untuk meninjau data, metrik, dan perspektif risiko; hasil StockFrame tidak menggantikan penilaian profesional.

## Product Purpose

StockFrame adalah alat bantu riset dan edukasi saham berbahasa Indonesia. Pengguna memasukkan perusahaan atau ticker dan fokus riset, lalu menerima rangkuman kondisi perusahaan berdasarkan data pasar, metrik finansial yang dihitung engine, dan analisis AI untuk profil risiko konservatif, moderat, dan agresif.

Keberhasilan produk berarti pengguna dapat memahami perkembangan perusahaan selama satu tahun terakhir, alasan suatu saham terlihat kuat atau berisiko, serta perbedaan kesimpulan untuk setiap profil risiko tanpa harus membaca data finansial mentah dari banyak sumber.

## Positioning

StockFrame memisahkan perhitungan finansial dari interpretasi AI. Data Business Quant dinormalisasi dan metrik dihitung secara deterministik oleh engine TypeScript. AI hanya menginterpretasikan data dan evidence yang telah diproses, lalu menyusun satu laporan dengan tiga perspektif risiko.

## Operating Context

Pengguna menjalankan satu analisis aktif dalam satu halaman web:

1. Mencari perusahaan berdasarkan nama atau ticker.
2. Menentukan fokus riset.
3. Menunggu pengambilan data, kalkulasi metrik, quality gate, dan analisis AI.
4. Membaca perkembangan harga satu tahun terakhir dalam grafik.
5. Meninjau metrik hasil engine melalui visualisasi yang sesuai.
6. Membaca rangkuman, kekuatan, risiko, keterbatasan, dan tiga perspektif profil risiko.

## Capabilities and Constraints

- Aplikasi menggunakan satu halaman tanpa login, akun pengguna, database, watchlist, atau riwayat analisis.
- Frontend dan Route Handler berjalan dalam satu project Next.js yang ditujukan untuk Vercel.
- Data pasar dan laporan keuangan berasal dari Business Quant melalui server-side Route Handler.
- Grafik perkembangan harga menggunakan data closing price sekitar satu tahun terakhir.
- Engine menyediakan 16 metrik deterministik yang mencakup leverage, likuiditas, profitabilitas, valuasi, arus kas, return, dan volatilitas.
- Satu model Gemini menghasilkan analisis dengan tepat tiga profil risiko: konservatif, moderat, dan agresif.
- AI tidak menjadi sumber angka finansial utama dan tidak boleh mengarang data yang tidak tersedia.
- Data yang tidak cukup harus ditampilkan sebagai keterbatasan dan dapat menghentikan analisis AI melalui quality gate.
- Produk tidak melakukan transaksi dan tidak memberikan nasihat investasi personal.
- Proyeksi harga atau valuasi masa depan bukan bagian dari cakupan yang telah dikonfirmasi.

## Brand Commitments

- Nama produk: StockFrame.
- Bahasa utama antarmuka dan laporan: Bahasa Indonesia.
- Posisi produk: alat bantu riset dan edukasi saham.
- Istilah dan copy harus membedakan data aktual, hasil perhitungan engine, dan interpretasi AI.
- Kesimpulan tidak boleh dipresentasikan sebagai kepastian, jaminan keuntungan, atau instruksi transaksi personal.

## Evidence on Hand

- Data profil perusahaan, laporan keuangan kuartalan, dan harga pasar dari Business Quant.
- Enrichment Corporate Actions terstruktur dari Business Quant, termasuk dividend, split, merger, acquisition, dan perubahan listing/ticker bila tersedia.
- Riwayat closing price sekitar satu tahun.
- Enam belas metrik finansial dengan formula ID, status, warning, dan evidence ID.
- Quality assessment untuk menandai data sufficient, degraded, atau insufficient.
- Laporan AI terstruktur berisi rangkuman, kekuatan, risiko, ketidakpastian, keterbatasan, dan tiga profil risiko.
- Belum ada testimonial, data pengguna, klaim performa investasi, atau aset merek final yang boleh difabrikasi oleh antarmuka.

## Product Principles

1. Data dan perhitungan harus dapat dibedakan dengan jelas dari interpretasi AI.
2. Informasi finansial disajikan bertahap agar tetap dapat dipahami pengguna pemula tanpa menghilangkan detail untuk pengguna profesional.
3. Visualisasi harus memperjelas perkembangan dan hubungan data, bukan memberi kesan prediksi yang tidak tersedia.
4. Kualitas, tanggal efektif, warning, evidence, dan keterbatasan data harus tetap terlihat.
5. Tiga perspektif risiko harus berasal dari dataset yang sama dan mudah dibandingkan.

## Accessibility & Inclusion

- Antarmuka harus responsif pada desktop dan perangkat mobile.
- Warna tidak boleh menjadi satu-satunya pembeda rating, status, atau profil risiko.
- Istilah finansial penting harus memiliki label atau penjelasan yang dapat dipahami pengguna pemula.
- Loading, error, data tidak tersedia, dan hasil degraded harus dijelaskan dalam Bahasa Indonesia yang jelas.
