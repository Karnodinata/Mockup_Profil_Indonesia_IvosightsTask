# Perencanaan Teknis: Integrasi Bertahap 15 Widget Analitis Baru Kabupaten & Kota

Dokumen ini memuat arsitektur teknis, analisis kritis ketersediaan data, kajian ergonomi visual antarmuka ([`/antislop-ui`](file:///c:/laragon/www/PKL/mockup/docs/PLANNING_AUDIT_DAN_PERBAIKAN_UI_ANTISLOP.md)), serta rencana eksekusi modular satu-per-satu (*incremental checkpoint plan*) untuk mengintegrasikan 15 widget analitis dari berkas referensi [`Widget Kab_Kota.xlsx`](file:///c:/laragon/www/PKL/mockup/Referensi/Widget%20Kab_Kota.xlsx) ke dalam portal web [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) dan [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html).

---

## 1. Analisis Kritis & Identifikasi Hambatan Awal

Sebelum implementasi dimulai, ada tiga temuan mendasar yang menjadi prasyarat keberhasilan proyek:

### 1.1. Hambatan Ketersediaan & Struktur Data (Data Availability Gaps)
1. **Data yang Dinyatakan Hilang / Belum Ada**:
   - **Chart 14 (Kualitas Kondisi Jalan)**: Sel data di Excel bertuliskan *"data tdk ditemukan"*. Jika dipaksakan dibuat tanpa data valid, widget akan kosong (*dead state*). Widget ini diposisikan pada fase akhir sembari mencari data resmi BPS (Pusat Statistik/PUPR) atau BPS Podes.
   - **Chart 8 & 15 (Akses Internet)**: Belum mencantumkan URL sumber data definitif.
2. **Kebutuhan Data Mikro Multi-Tahun (2024–2026)**:
   - Chart 13 membutuhkan data PDRB per sektor untuk dua tahun berurutan (**2024 dan 2025**).
   - Chart 16 & 17 membutuhkan data deret waktu wisatawan (**2021 s.d. 2025**).
   - Chart 1, 2, 3, 4, 10, 11 membutuhkan rilis data tahun **2025** (BKPM, Permenaker UMK, BNPB, BPS P1).
   - *Solusi Arsitektur*: Untuk setiap fase pengerjaan, dibuatkan file data modular di folder `assets/js/data/` (misal `investasi-data.js`, `ipm-detail-data.js`, `bencana-data.js`, `industri-data.js`) dengan skema JSON terstruktur agar tidak membebani file utama `Data.js`.

### 1.2. Penyelarasan Prototipe Streamlit ke Web Murni
- Catatan pada Chart 16 & 17 menyebut penggunaan dropdown filter `st.selectbox`, yang menandakan rancangan visual awal dibuat dengan prototipe **Streamlit (Python)**.
- Seluruh widget akan dibangun dengan standar arsitektur web produksi: **HTML5 semantik + CSS modern responsif + Vanilla JavaScript ES6+**, sehingga terintegrasi mulus ke dalam tata letak tab [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) yang sudah ada.

### 1.3. Pilihan Mesin Visualisasi (Chart Engine Strategy)
- Widget-widget baru ini memiliki kompleksitas visual tinggi:
  - *Scatter Plot 4-Kuadran* dengan garis median dinamis (Investasi & Kemiskinan).
  - *Bubble Chart 4-Kuadran* dengan penskalaan ukuran titik proporsional (UMK vs TPT).
  - *Radar Chart* multi-dimensi (Komponen IPM).
  - *Treemap* bertingkat (Ekosistem Usaha).
  - *Heatmap Matriks* bulanan (Bencana Alam BNPB).
  - *Dumbbell Plot* komparasi kabupaten vs provinsi (Tenaga Kesehatan).
  - *Lollipop Chart* (Gap Harapan vs Realisasi Lama Sekolah).
- **Keputusan Rekomendasi**:
  Mengintegrasikan **Apache ECharts** via CDN lokal/ringan (`echarts.min.js`). ECharts dipilih karena:
  1. Memiliki komponen bawaan lengkap untuk Radar, Treemap, Heatmap, Scatter Kuadran, dan Dumbbell.
  2. Performa berbasis HTML5 Canvas yang sangat cepat dan hemat memori pada perangkat mobile.
  3. Mendukung sistem pewarnaan kustom yang 100% selaras dengan *design tokens* portal kita (Merah-Putih, Teal `#0FB5A0`, Dark Mode slate).

---

## 2. Strategi Pengerjaan Bertahap (Roadmap 4 Fase)

Agar pengerjaan terukur, mudah diuji, dan tidak menimbulkan regresi (*breaking changes*), 15 widget dikelompokkan ke dalam 4 fase berbasis keterkaitan topik dan kesiapan data:

```
[FASE 1: IPM, Pendidikan, & Layanan Dasar] (Nada)
  ├── Chart 5.0   : Radar Chart Dimensi Penyusun IPM
  ├── Chart 6.0   : Lollipop Chart Kesenjangan Pendidikan (HLS vs RLS)
  ├── Chart 7.0   : Bar Chart & KPI Benchmark Umur Harapan Hidup (UHH)
  └── Chart 8 & 15: KPI Akses Layanan Dasar (Sanitasi, Air Minum, Listrik, Internet)
           │
           ▼
[FASE 2: Pasar Tenaga Kerja & Investasi] (Argado)
  ├── Chart 1.0   : Bar Chart Realisasi Investasi Sektor Usaha (PMA, PMDN, Total)
  ├── Chart 2.0   : 4-Quadrant Scatter Plot Proporsi PMA vs Total Investasi
  ├── Chart 3.0   : Ranking List Realisasi Investasi Kab/Kota Se-Provinsi
  └── Chart 4.0   : Bubble Chart 4 Kuadran Pasar Kerja (UMK vs TPT)
           │
           ▼
[FASE 3: PDRB, Industri, Kemiskinan, & Bisnis] (Zifa & Lisha)
  ├── Chart 11.0  : 4-Quadrant Scatter Plot Prioritas Kemiskinan (% Miskin vs P1)
  ├── Chart 13.0  : Paired Bar Chart Pertumbuhan PDRB 17 Sektor (2024 vs 2025)
  ├── Chart 21.0  : Bar Chart Nilai Tambah Industri Besar & Sedang (KBLI)
  └── Chart 16 & 17: Treemap Ekosistem Usaha & KPI Wisatawan
           │
           ▼
[FASE 4: Infrastruktur, Konektivitas, & Kebencanaan] (Zifa & Lisha)
  ├── Chart 9.0   : Peta Interaktif & Karakteristik Sebaran Bandara
  ├── Chart 10.0  : Heatmap Matriks Kejadian & Status Darurat Bencana (BNPB)
  └── Chart 14.0  : 100% Stacked Bar Chart Kualitas Kondisi Jalan (Kondisional Data)
```

---

## 3. Matriks Detail Spesifikasi 15 Widget

### FASE 1: IPM, Pendidikan, & Layanan Dasar (PIC: Nada)

#### Widget 1 (Chart 5.0): Radar Chart Dimensi Penyusun IPM
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Penduduk & SDM** (sebelah kartu IPM).
* **Bentuk Visual**: Radar Chart (Spider Chart) dengan 4 sumbu indikator:
  1. *Kesehatan*: Umur Harapan Hidup (UHH) dinormalisasi (indeks 0–100).
  2. *Pendidikan 1*: Harapan Lama Sekolah (HLS) dinormalisasi.
  3. *Pendidikan 2*: Rata-rata Lama Sekolah (RLS) dinormalisasi.
  4. *Standar Hidup*: Pengeluaran per kapita disesuaikan dinormalisasi.
* **Fitur Interaktif**: Tooltip rincian nilai capaian aktual vs batas rujukan nasional BPS.

#### Widget 2 (Chart 6.0): Lollipop Chart Kesenjangan Pendidikan (HLS vs RLS)
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Sosial** (Seksi Pendidikan).
* **Bentuk Visual**: Lollipop Chart horizontal ganda:
  - Titik pertama: Nilai riil Rata-rata Lama Sekolah (RLS).
  - Titik kedua: Nilai Harapan Lama Sekolah (HLS).
  - Garis penghubung: Menunjukkan *Education Gap* (kesenjangan antara ekspektasi dan realisasi).
* **Fitur Interaktif**: Label selisih tahun (*gap*) dan kategori status pemenuhan wajib belajar.

#### Widget 3 (Chart 7.0): Benchmark Umur Harapan Hidup (UHH)
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Penduduk & SDM**.
* **Bentuk Visual**: Kartu KPI komparasi dan Bar Chart horizontal:
  - UHH Kabupaten/Kota terpilih.
  - Rata-rata UHH Provinsi.
  - Rata-rata UHH Nasional (Rujukan BPS SP2020 Long Form).
* **Fitur Interaktif**: Status deviasi selisih tahun (+/- tahun dibanding rata-rata nasional).

#### Widget 4 (Chart 8 & 15): Indikator Akses Layanan Dasar Permukiman
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Profil Wilayah** (Seksi Infrastruktur Dasar).
* **Bentuk Visual**: 4 Kartu KPI Modern berprogres persentase (*progress ring/bar*):
  1. *Sanitasi Layak*: % rumah tangga dengan jamban leher angsa & tangki septik (SDG 6.2.1).
  2. *Air Minum Layak*: % rumah tangga berakses sumber air terlindung/perpipaan (SDG 6.1.1).
  3. *Elektrifikasi Listrik*: % rumah tangga berlistrik PLN/non-PLN.
  4. *Konektivitas Internet*: % penduduk/rumah tangga berakses internet.
* **Fitur Interaktif**: Keterangan metodologi acuan BPS / Susenas.

---

### FASE 2: Pasar Tenaga Kerja & Realisasi Investasi (PIC: Argado)

#### Widget 5 (Chart 1.0): Bar Chart Realisasi Investasi Sektor Usaha
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Deck Investasi** & **Tab Ekonomi**.
* **Bentuk Visual**: Horizontal Bar Chart berurutan dari sektor investasi terbesar ke terkecil.
* **Variabel**: Sektor usaha BKPM, nilai PMA, nilai PMDN, dan Total Investasi (Rupiah).
* **Filter**: 3 tombol toggle: `[Semua (Total)]` `[PMA]` `[PMDN]`.

#### Widget 6 (Chart 2.0): Scatter Plot 4-Kuadran Karakteristik Investasi
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Deck Investasi** (Sub-seksi Komparasi Provinsi).
* **Bentuk Visual**: Scatter Plot 4 Kuadran se-provinsi:
  - Sumbu X: Proporsi Modal Asing / % PMA (0% s.d. 100%, garis vertikal pembatas 50%).
  - Sumbu Y: Total Realisasi Investasi (PMA + PMDN), garis horizontal pembatas median provinsi.
  - 4 Kuadran:
    - *Kuadran I*: Investasi Tinggi, Dominan Modal Asing (PMA > 50%).
    - *Kuadran II*: Investasi Tinggi, Dominan Modal Domestik (PMDN > 50%).
    - *Kuadran III*: Investasi Rendah, Dominan Modal Domestik.
    - *Kuadran IV*: Investasi Rendah, Dominan Modal Asing.

#### Widget 7 (Chart 3.0): Ranking List Realisasi Investasi Kab/Kota
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Deck Investasi**.
* **Bentuk Visual**: Leaderboard / Tabel peringkat scrollable:
  - Menampilkan posisi peringkat kabupaten/kota terpilih di antara seluruh daerah dalam provinsi yang sama.
  - Opsi sortir filter: Total Investasi, Khusus PMA, atau Khusus PMDN.

#### Widget 8 (Chart 4.0): Bubble Chart 4-Kuadran Pasar Tenaga Kerja (UMK vs TPT)
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Penduduk & SDM** (Seksi Ketenagakerjaan).
* **Bentuk Visual**: Bubble Chart 4 Kuadran se-provinsi:
  - Sumbu X: Nilai Upah Minimum (UMK/UMP) dalam juta Rupiah.
  - Sumbu Y: Tingkat Pengangguran Terbuka (TPT) dalam persen.
  - Ukuran Bubble: Proporsional terhadap jumlah total angkatan kerja daerah.
  - Garis Pembatas: Median UMK dan Median TPT provinsi terpilih.
  - Kuadran: Evaluasi upah tinggi/rendah terhadap penyerapan pengangguran tinggi/rendah.

---

### FASE 3: PDRB, Industri, Kemiskinan, & Bisnis (PIC: Zifa & Lisha)

#### Widget 9 (Chart 11.0): Scatter Plot 4-Kuadran Prioritas Penanganan Kemiskinan
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Ekonomi** / Seksi Kesejahteraan.
* **Bentuk Visual**: Scatter Plot 4 Kuadran:
  - Sumbu X: Persentase Penduduk Miskin (%).
  - Sumbu Y: Indeks Kedalaman Kemiskinan / Poverty Gap Index (P1).
  - Garis Pembatas: Median % Miskin dan Median P1 se-provinsi.
  - Interpretasi Rekomendasi: Perlindungan sosial intensif vs pemberdayaan ekonomi kerja.

#### Widget 10 (Chart 13.0): Paired Bar Chart Pertumbuhan PDRB 17 Sektor Lapangan Usaha
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Ekonomi**.
* **Bentuk Visual**: Bar Chart Ganda Berdampingan (2024 vs 2025):
  - Menampilkan nilai PDRB ADHB per sektor untuk tahun 2024 dan 2025.
  - Kartu ringkasan atas: Sektor dengan pertumbuhan tertinggi (*Top Growth*) dan kontraksi terberat.

#### Widget 11 (Chart 21.0): Analisis Nilai Tambah Industri Besar & Sedang (KBLI)
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Ekonomi**.
* **Bentuk Visual**: Kartu Ringkasan Triliun Rp (Output Bruto, Biaya Input, Nilai Tambah) + Horizontal Bar Chart per kelompok KBLI 2-digit.
* **Interaksi**: Toggle *Top 5 Kelompok Industri* vs *Tampilkan Seluruh Industri*.

#### Widget 12 (Chart 16 & 17): Treemap Ekosistem Usaha & Kesiapan Pasar
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Ekonomi** / **Tab Deck Investasi**.
* **Bentuk Visual**:
  - Kartu KPI: Jumlah Wisatawan per tahun terpilih.
  - Treemap Interaktif: Ukuran blok merepresentasikan jumlah fasilitas (Restoran, Minimarket, Hotel/Kamar, Pasar Tradisional, Bank, Koperasi, Unit Industri).
  - Filter Tahun: Dropdown tahun (2021 s.d. 2025).

---

### FASE 4: Infrastruktur, Konektivitas, & Kebencanaan (PIC: Zifa & Lisha)

> 📘 **Dokumen PRD & Panduan Eksekusi Lengkap**: [PLANNING_FASE_4_INFRASTRUKTUR_DAN_KEBENCANAAN.md](file:///c:/laragon/www/PKL/mockup/docs/261026/PLANNING_FASE_4_INFRASTRUKTUR_DAN_KEBENCANAAN.md) *(Gunakan berkas ini sebagai referensi mandiri untuk pengerjaan Fase 4)*.

#### Widget 13 (Chart 9.0): Sebaran & Karakteristik Bandara Udara
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Profil Wilayah** (Seksi Transportasi).
* **Bentuk Visual**: Peta interaktif Leaflet mini dengan penanda bandara (`✈️`) + Kartu detail (Kode IATA/ICAO, rute domestik/internasional, kelas bandara, pengelola, link navigasi Google Maps).
* **Mitigasi Edge Case**: Logika *Dual-Scope Fallback* untuk 200+ daerah tanpa bandara (menampilkan bandara hub terdekat se-provinsi + jarak km).

#### Widget 14 (Chart 10.0): Heatmap Matriks Kebencanaan & Status Darurat BNPB
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Profil Wilayah** (Seksi Risiko Bencana).
* **Bentuk Visual**: Heatmap Matriks 12 Bulan (Jan–Des) x 8 Kategori Bencana (Banjir, Longsor, Karhutla, Puting Beliung, Gempa, Erupsi, Kekeringan, Gelombang Pasang).
* **Interaksi**: Mengklik sel matriks membuka drilldown modal daftar penetapan status darurat resmi BNPB (No SK, masa berlaku, skala bencana, narasi penyebab).

#### Widget 15 (Chart 14.0): 100% Stacked Bar Chart Kualitas Jalan
* **Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Profil Wilayah** / **Tab Deck Investasi** (P2 Infrastruktur).
* **Bentuk Visual**: 100% Horizontal Stacked Bar Chart (Kondisi Baik `#10B981`, Sedang `#F59E0B`, Rusak `#EF4444`) per kilometer jalan kabupaten/kota + KPI Persentase Kemantapan Jalan vs Benchmark Provinsi.
* **Mitigasi Data**: Mengacu pada format data resmi BPS *Statistik Transportasi Darat* / Tabel BPS KDA *Panjang Jalan Menurut Kondisi*.

---

## 4. Matriks Rencana Checkpoint Eksekusi (CP)

| Checkpoint | Target Komponen | File Terkait | Rincian Aksi & Deliverable |
|:---|:---|:---|:---|
| **CP-F1-01** | Integrasi Apache ECharts CDN | [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) | Muat `echarts.min.js` lokal/CDN secara efisien tanpa memperlambat first paint. |
| **CP-F1-02** | Modul Data Fase 1 (IPM & Layanan Dasar) | `assets/js/data/fase1-layanan-data.js` | Strukturkan data UHH, HLS, RLS, sanitasi, air, listrik, internet untuk 514 daerah. |
| **CP-F1-03** | Widget 5: Radar Chart IPM | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Bangun visualisasi Radar Chart 4 dimensi di Tab Penduduk & SDM. |
| **CP-F1-04** | Widget 6: Lollipop Chart Gap Pendidikan | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Bangun Lollipop Chart HLS vs RLS di Tab Sosial. |
| **CP-F1-05** | Widget 7: Benchmark UHH | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Bangun Bar Chart horizontal komparasi UHH daerah vs prov vs nasional. |
| **CP-F1-06** | Widget 8 & 15: Akses Layanan Dasar | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Bangun 4 kartu KPI progres akses permukiman di Tab Wilayah. |
| **CP-F1-07** | Pengujian Browser & Validasi Fase 1 | Browser Testing | Uji visual dan fungsionalitas di browser lokal, pastikan responsif dan bebas error konsol. |
| **CP-F2-01** | Modul Data Investasi & UMK (Fase 2) | `assets/js/data/investasi-tenagakerja.js` | Siapkan data sektor PMA/PMDN BKPM 2025 dan UMK 2025. |
| **CP-F2-02** | Widget 1, 2, 3: Rangkaian Investasi | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Bangun Bar Chart Sektor, Kuadran PMA vs PMDN, dan Ranking List di Tab Deck Investasi. |
| **CP-F2-03** | Widget 4: Bubble Kuadran UMK vs TPT | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Bangun Bubble Chart 4 kuadran pasar tenaga kerja se-provinsi di Tab SDM. |
| **CP-F3-01** | Widget 11, 13, 21, 16-17 (Fase 3) | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Bangun Kuadran Kemiskinan P1, Paired Bar PDRB 2024-2025, Industri KBLI, & Treemap Bisnis. |
| **CP-F4-01** | Penyiapan Skema Dataset Fase 4 | `assets/js/data/{bandara,bnpb,jalan}-data.js` | Strukturkan data bandara Kemenhub, rekap darurat BNPB 2025, dan kondisi jalan BPS. |
| **CP-F4-02** | Widget 13: Peta Sebaran Bandara | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Mini interactive Leaflet map bandara + kartu teknis + direct Google Maps link. |
| **CP-F4-03** | Widget 14: Heatmap Bencana BNPB | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | ECharts Heatmap 12 Bulan x Kategori Bencana + drilldown modal nomor SK darurat. |
| **CP-F4-04** | Widget 15: 100% Stacked Bar Jalan | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | 100% Horizontal Stacked Bar (Baik, Sedang, Rusak) + benchmark kemantapan provinsi. |
| **CP-F4-05** | Integrasi & Uji Browser Fase 4 | Browser Subagent Testing | Pengujian interaksi klik, modal drilldown, fallback daerah non-bandara, dan responsivitas. |

---

## 5. Kriteria Keberhasilan (Definition of Done)

1. **Modular & Ringan**: Penambahan widget tidak merusak fitur eksisting (retensi tab, filter berjenjang, peta potensi tetap aman).
2. **Kesesuaian Desain (`/antislop-ui`)**: Grafik memiliki palet warna harmonis, tooltip informatif, angka berformat lokal (`id-ID`), dan tidak ada tumpukan label teks.
3. **Penyimpanan Lokal**: Seluruh kode diuji di lokal terlebih dahulu tanpa di-push ke GitHub sebelum verifikasi pengguna.
