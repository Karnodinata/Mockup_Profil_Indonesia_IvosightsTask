---
title: "Perencanaan Detail Fase 3: Integrasi Widget Analitis PDRB, Industri KBLI, Kemiskinan P1, Ekosistem Bisnis, & Rasio Tenaga Kesehatan"
date: 2026-10-29
status: Draft
---

# Perencanaan Detail Fase 3: Integrasi Widget Analitis PDRB, Industri KBLI, Kemiskinan P1, Ekosistem Bisnis, & Rasio Tenaga Kesehatan

Dokumen ini merupakan spesifikasi perencanaan teknis (*Product Requirements & Technical Architecture Document*) untuk **Fase 3** dari integrasi widget analitis Kabupaten/Kota berdasarkan rujukan utama [`Referensi/Widget Kab_Kota.xlsx`](file:///c:/laragon/www/PKL/mockup/Referensi/Widget%20Kab_Kota.xlsx) dan roadmap induk [`PLANNING_INTEGRASI_15_WIDGET_ANALITIS_KABKOTA.md`](file:///c:/laragon/www/PKL/mockup/docs/261026/PLANNING_INTEGRASI_15_WIDGET_ANALITIS_KABKOTA.md).

---

## 1. Konteks & Tujuan (Objective)

1. **Sinkronisasi Kerja Paralel Tanpa Konflik (*Zero-Conflict Parallel Workflow*)**:
   - Saat ini anggota tim lain sedang menyelesaikan sisa **Fase 2** (Chart 2.0 Kuadran PMA/PMDN, Chart 3.0 Ranking Investasi, dan Chart 4.0 Bubble UMK vs TPT) yang menyentuh [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) dan [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js).
   - Fase 3 dirancang menggunakan **arsitektur modul terisolasi** (`assets/js/data/fase3-ekonomi-data.js` dan controller mandiri `assets/js/core/ProfilFase3.js`) agar tidak menimbulkan *merge conflict* saat digabungkan ke branch `main`.
2. **Cakupan Widget Fase 3 (PIC: Zifa & Lisha)**:
   - **Widget 9 (Chart 11.0)**: Scatter Plot 4-Kuadran Prioritas Penanganan Kemiskinan (`% Penduduk Miskin` vs `Indeks Kedalaman Kemiskinan / P1`) + Panel Detail Insight Pemda.
   - **Widget 10 (Chart 13.0)**: Paired Bar Chart Perkembangan PDRB ADHB Menurut 17 Lapangan Usaha (`2024 vs 2025`) + 3 KPI Card Pertumbuhan Sektor.
   - **Widget 11 (Chart 21.0)**: Horizontal Bar Chart & Panel Rincian Industri Besar dan Sedang berdasarkan Kelompok KBLI 2-Digit (`Output`, `Biaya Input`, `Nilai Tambah`).
   - **Widget 12 (Chart 16 & 17)**: Treemap Interaktif Ekosistem Industri & Perdagangan (7 Kategori Fasilitas) + Filter Tahun (`2021–2025`) + KPI Wisatawan.
   - **Widget Tambahan Teridentifikasi di Excel (Chart 19.0 — Kondisional)**: Dumbbell Plot Kapasitas Layanan Kesehatan (Perbandingan Rasio Dokter, Perawat, Bidan, dan Apoteker per 10.000 Penduduk antara Kab/Kota vs Provinsi).

---

## 2. Ruang Lingkup & Arsitektur (Scope & Architecture)

### 2.1. Analisis Kritis Ketersediaan Data & Strategi Skema Data (`fase3-ekonomi-data.js`)

Berdasarkan audit terhadap [`Referensi/Widget Kab_Kota.xlsx`](file:///c:/laragon/www/PKL/mockup/Referensi/Widget%20Kab_Kota.xlsx), [`Data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/Data.js), dan direktori `data-mentah/`:

| Nomor Chart | Indikator yang Dibutuhkan | Sumber Resmi di Excel | Status Ketersediaan di Repo Lokal | Strategi Penyediaan Data |
| :--- | :--- | :--- | :--- | :--- |
| **Chart 11.0** | • `% Penduduk Miskin`<br>• `Indeks Kedalaman Kemiskinan (P1)`<br>• `Median Provinsi` (X & Y) | • BPS Kab/Kota Dalam Angka 2026<br>• BPS: `Indeks Kedalaman Kemiskinan (P1) Menurut Kabupaten_Kota, 2025.xlsx` | • `persentase_miskin`, `penduduk_miskin_ribu`, `garis_kemiskinan` **SUDAH ADA** di [`Data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/Data.js).<br>• File `P1 2025.xlsx` **BELUM ADA** di `data-mentah/`. | Integrasikan file BPS P1 2025 ke `fase3-ekonomi-data.js`. Median provinsi dihitung dinamis saat *runtime* dari seluruh Kab/Kota valid dalam provinsi terpilih. |
| **Chart 13.0** | • Nilai PDRB ADHB 17 Sektor Tahun `2024`<br>• Nilai PDRB ADHB 17 Sektor Tahun `2025`<br>• `% Pertumbuhan` per sektor | • BPS Kab/Kota Dalam Angka 2025 & 2026 | • PDRB ADHB 17 Sektor tahun berjalan (`sek_a_pertanian` s.d. `sek_rstu_jasalain`) **SUDAH ADA** di [`Data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/Data.js).<br>• Seri tahun pembanding (`2024`) **BELUM ADA** di `data-mentah/`. | Sediakan objek `pdrb_2024` & `pdrb_2025` per 17 sektor di `fase3-ekonomi-data.js`. Jika data 2024 suatu sektor bernilai `null`, tampilkan status *"Data 2024 Belum Tersedia"* tanpa fabrikasi angka. |
| **Chart 16 & 17** | • Periode Tahun (`2021–2025`)<br>• KPI `Wisatawan`<br>• 7 Unit Usaha: `Restoran`, `Minimarket`, `Industri`, `Hotel` (+`Kamar`), `Koperasi`, `Pasar`, `Bank` | • BPS Kab/Kota Dalam Angka 2025 & 2026 | • Baru tersedia sampel ekstraksi sebagian di `data-mentah/xlsx/Extrack/`. Belum terkompilasi untuk 514 Kab/Kota. | Sediakan skema multi-tahun `ekosistem_usaha[tahun]` di `fase3-ekonomi-data.js` dengan dukungan *graceful empty state* apabila tahun tertentu belum dipublikasikan BPS. |
| **Chart 21.0** | • 20 Klasifikasi KBLI (Kode 10 s.d. 32) dikelompokkan ke 5 Kelompok Industri<br>• `Perusahaan`, `Nilai Output`, `Biaya Input`, `Nilai Tambah` | • BPS Kab/Kota Dalam Angka 2025 & 2026 (Statistik Industri Besar & Sedang) | • Belum ada file mentah KBLI nasional di `data-mentah/`. | Sediakan skema `industri_kbli` per Kab/Kota & Tahun di `fase3-ekonomi-data.js`, mendukung pengelompokan 5 grup utama KBLI maupun tampilan seluruh KBLI. |
| **Chart 19.0** *(Kondisional)* | • Jumlah `Dokter`, `Perawat`, `Bidan`, `Apoteker`<br>• `Jumlah Penduduk` (Kab/Kota & Provinsi)<br>• Rasio per `10.000` penduduk | • BPS Provinsi Dalam Angka 2025 & 2026 | • `penduduk` sudah ada di [`Data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/Data.js).<br>• Rekap 4 nakes per Kab/Kota belum masuk ke [`sosial-data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/sosial-data.js). | Tambahkan objek `nakes_rasio` di modul data Fase 3 jika disepakati masuk ke ruang lingkup Fase 3. |

---

### 2.2. Spesifikasi Visual & Teknis Per Widget

#### A. Widget 9 (Chart 11.0): Peta Kondisi Kemiskinan Kabupaten/Kota (4-Quadrant Scatter Plot)
* **Rujukan Ilustrasi**: [`docs/261026/ilustrasi/chart_11_kedalaman_kemiskinan_detail.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_11_kedalaman_kemiskinan_detail.png)
* **Lokasi Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Ekonomi (`#tab-ekonomi`)**, tepat di bawah kartu ringkasan Kemiskinan & Gini Ratio.
* **Struktur Tata Letak (Grid 2 Kolom: 65% Grafik Kiri, 35% Panel Detail Kanan)**:
  ```
  +-----------------------------------------------------------------------------------+
  | Peta Kondisi Kemiskinan Kabupaten/Kota (Se-Provinsi)                              |
  +---------------------------------------------------+-------------------------------+
  | [Kab/Kota Dianalisis] [Median % Miskin] [Med P1]  | Detail Wilayah Terpilih   [X] |
  | +-----------------------+-----------------------+ | Nama Kab/Kota                 |
  | | Kuadran II (Merah Md) | Kuadran I (Kuning/Amb)| | [Badge: Kuadran & Kategori]   |
  | | Miskin rendah,        | Miskin tinggi,        | | +------------+ +------------+ |
  | | P1 tinggi             | P1 tinggi             | | | % Miskin   | | Indeks P1  | |
  | +-----------------------+-----------------------+ | +------------+ +------------+ |
  | | Kuadran III (Hijau Md)| Kuadran IV (Biru Muda)| | [💡 Insight untuk Pemda     ] |
  | | Miskin rendah,        | Miskin tinggi,        | | [🎯 Arah Kebijakan          ] |
  | | P1 rendah             | P1 rendah             | | [Informasi Tambahan Tabel   ] |
  | +-----------------------+-----------------------+ |                               |
  +---------------------------------------------------+-------------------------------+
  ```
* **Logika Kuadran & Rekomendasi Kebijakan (Sesuai [`Widget Kab_Kota.xlsx`](file:///c:/laragon/www/PKL/mockup/Referensi/Widget%20Kab_Kota.xlsx) Baris 19)**:
  1. **Kuadran I (`% Miskin > Median` & `P1 > Median` — Kanan Atas / Amber)**:
     - *Insight*: Persentase penduduk miskin dan kedalaman kemiskinan sama-sama relatif tinggi dibanding rata-rata provinsi.
     - *Arah Kebijakan*: Prioritaskan penanganan melalui perlindungan sosial terpadu, pemberdayaan ekonomi, dan perluasan kesempatan kerja.
  2. **Kuadran II (`% Miskin <= Median` & `P1 > Median` — Kiri Atas / Merah Muda)**:
     - *Insight*: Persentase penduduk miskin relatif rendah, tetapi kedalaman kemiskinan masih tinggi (penduduk miskin yang tersisa memiliki kesenjangan pengeluaran besar terhadap Garis Kemiskinan).
     - *Arah Kebijakan*: Prioritaskan bantuan yang lebih intensif dan tepat sasaran bagi rumah tangga miskin ekstrem untuk menutup jarak pengeluaran terhadap GK.
  3. **Kuadran III (`% Miskin <= Median` & `P1 <= Median` — Kiri Bawah / Hijau Muda)**:
     - *Insight*: Persentase penduduk miskin dan indeks kedalaman kemiskinan relatif rendah dibanding wilayah lain di provinsi yang sama.
     - *Arah Kebijakan*: Pertahankan capaian pengentasan kemiskinan dan perkuat jaring pengaman agar kelompok rentan tidak jatuh miskin.
  4. **Kuadran IV (`% Miskin > Median` & `P1 <= Median` — Kanan Bawah / Biru Muda)**:
     - *Insight*: Persentase penduduk miskin relatif tinggi, tetapi kedalaman kemiskinan rendah (rata-rata pengeluaran penduduk miskin sudah dekat dengan Garis Kemiskinan).
     - *Arah Kebijakan*: Perluas jangkauan program pemberdayaan ekonomi dan peningkatan pendapatan agar kelompok miskin yang dekat GK dapat segera dientaskan.
* **Interaksi**:
  - Secara default, titik Kab/Kota yang sedang aktif di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) disorot (*highlighted ring* lebih besar) dan datanya dimuat di **Panel Detail Wilayah Terpilih**.
  - Mengklik titik Kab/Kota lain di dalam scatter plot memperbarui **Panel Detail Wilayah Terpilih** di sebelah kanan secara instan.

---

#### B. Widget 10 (Chart 13.0): Perkembangan PDRB ADHB menurut Lapangan Usaha (2024 vs 2025)
* **Rujukan Ilustrasi**: [`docs/261026/ilustrasi/chart_11_kedalaman_kemiskinan.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_11_kedalaman_kemiskinan.png) *(catatan: file gambar di folder ilustrasi tertukar namanya dengan Chart 13)*
* **Lokasi Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Ekonomi (`#tab-ekonomi`)**, berdekatan dengan seksi Struktur PDRB 17 Sektor.
* **Struktur Tata Letak**:
  1. **Baris 3 KPI Card Ringkasan Pertumbuhan**:
     - **Pertumbuhan Tertinggi**: Ikon tren naik hijau, Nama Sektor tertinggi, pill badge `+XX,XX%` *(dari tahun 2024 ke 2025)*.
     - **Rata-rata Pertumbuhan Sektor**: Ikon bar biru, nilai rata-rata pertumbuhan seluruh sektor `+X,XX%`.
     - **Pertumbuhan Terendah**: Ikon tren turun merah, Nama Sektor terendah/kontraksi, pill badge `-X,XX%` atau `+X,XX%`.
  2. **Paired Vertical Bar Chart (ECharts)**:
     - **Sumbu X**: Kategori Sektor Lapangan Usaha (menampilkan 9 sektor terbesar + grup ke-10 `Lainnya (8 sektor)` sesuai ilustrasi mockup, dilengkapi tombol toggle `[9 Sektor Utama + Lainnya]` vs `[Semua 17 Sektor]`).
     - **Sumbu Y**: Nilai PDRB ADHB dalam satuan Miliar/Triliun Rupiah.
     - **2 Batang per Sektor**:
       - Batang Kiri (`Tahun 2024`): Biru Muda `#93C5FD` / `#A5B4FC`.
       - Batang Kanan (`Tahun 2025`): Biru Tua `#1D4ED8` / `#1E40AF`.
     - **Label Pertumbuhan di Atas Pasangan Batang**: Badge persentase perubahan $\Delta\% = \frac{\text{PDRB}_{2025} - \text{PDRB}_{2024}}{\text{PDRB}_{2024}} \times 100\%$.
     - **Tombol `Unduh Data` (CSV)**: Mengekspor tabel perbandingan 17 sektor 2024 vs 2025 untuk daerah terpilih.

---

#### C. Widget 11 (Chart 21.0): Analisis Nilai Tambah Industri Besar dan Sedang (KBLI 2-Digit)
* **Rujukan Ilustrasi**: [`docs/261026/ilustrasi/chart_21_kbli_tenaga_kerja.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_21_kbli_tenaga_kerja.png)
* **Lokasi Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Ekonomi (`#tab-ekonomi`)**.
* **Struktur Tata Letak**:
  1. **Header & Filter Tahun**: Judul *"Industri Besar dan Sedang"* + subjudul jumlah klasifikasi KBLI + dropdown `Tahun`.
  2. **3 Kartu KPI Skala Industri**:
     - **Total Nilai Output** (`Rp ...` — Nilai bruto output seluruh klasifikasi industri).
     - **Total Biaya Input** (`Rp ...` — Total biaya input produksi).
     - **Total Nilai Tambah** (`Rp ...` — Nilai tambah menurut harga pasar BPS).
  3. **Body Utama (2 Kolom: Horizontal Bar Chart Kiri + Kartu Rincian KBLI Kanan)**:
     - **Toggle View**: Pill `[Top 5 Kelompok]` vs `[Semua Klasifikasi KBLI]`.
     - **5 Kelompok Agregasi KBLI Standar**:
       1. *Makanan dan Minuman* (`KBLI 10, 11`) — Warna Ungu `#8B5CF6`
       2. *Tekstil, Pakaian, dan Kulit* (`KBLI 13, 14, 15`) — Warna Toska `#14B8A6`
       3. *Kayu, Kertas, Percetakan, dan Furnitur* (`KBLI 16, 17, 18, 31`) — Warna Biru `#3B82F6`
       4. *Kimia, Farmasi, Karet, dan Mineral Nonlogam* (`KBLI 20, 21, 22, 23`) — Warna Oranye `#F59E0B`
       5. *Logam, Elektronik, Mesin, dan Industri Lainnya* (`KBLI 24, 25, 26, 27, 28, 29, 30, 32`) — Warna Slate Biru `#475569`
     - **Panel Kanan (Popover / Detail Card Kelompok Terpilih)**: Menampilkan daftar kode KBLI 2-digit yang tercakup beserta rincian *Total Nilai Output*, *Total Biaya Input*, dan *Total Nilai Tambah* khusus kelompok tersebut.

---

#### D. Widget 12 (Chart 16 & 17): Ekosistem Industri & Perdagangan (Treemap & KPI Wisatawan)
* **Rujukan Ilustrasi**: [`docs/261026/ilustrasi/chart_16_17_sarana_kesehatan.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_16_17_sarana_kesehatan.png) *(catatan: file gambar di folder ilustrasi bernama sarana kesehatan namun isinya adalah Treemap Ekosistem Industri & Perdagangan)*
* **Lokasi Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Ekonomi (`#tab-ekonomi`)**.
* **Struktur Tata Letak**:
  1. **Baris Kontrol & KPI Atas**:
     - Kiri: Dropdown **`Pilih Tahun`** (`2025`, `2024`, `2023`, `2022`, `2021`).
     - Kanan (sejajar): Kartu KPI **`Wisatawan`** (menampilkan jumlah wisatawan pada tahun terpilih).
  2. **ECharts Treemap (7 Kategori Unit Usaha)**:
     - Luas persegi panjang proporsional terhadap jumlah unit masing-masing fasilitas:
       - `Restoran` (`#F4C7B3`)
       - `Minimarket` (`#B4D4F9`)
       - `Industri` (`#CCC9F8`)
       - `Hotel` (`#9BE0C8`) — **Khusus Tooltip Hotel**: wajib menyertakan variabel **`Jumlah Kamar`** sesuai instruksi Excel baris 23–24.
       - `Koperasi` (`#BCE29E`)
       - `Pasar` (`#F8C978`)
       - `Bank` (`#F4B8CE`)
  3. **Custom Legend di Bawah Treemap**: Menampilkan 7 indikator warna beserta catatan khusus `Hotel (tooltip: jumlah kamar)`.

---

#### E. Widget Kondisional (Chart 19.0): Kapasitas Layanan Kesehatan (Dumbbell Plot Rasio Nakes)
* **Rujukan Ilustrasi**: [`docs/261026/ilustrasi/chart_19_tenaga_medis_dokter.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_19_tenaga_medis_dokter.png)
* **Lokasi Penempatan**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) $\rightarrow$ **Tab Sosial (`#tab-sosial`)**, pada seksi Fasilitas & Tenaga Kesehatan.
* **Struktur Visual**:
  - **Dumbbell Plot Horizontal 4 Baris**: `Dokter`, `Perawat`, `Bidan`, dan `Apoteker`.
  - **Sumbu X**: Rasio tenaga kesehatan per 10.000 penduduk ($\text{Rasio} = \frac{\text{Jumlah Nakes}}{\text{Jumlah Penduduk}} \times 10.000$).
  - **2 Titik per Baris**:
    - Titik Hijau Toska (`#00B894`): Rasio Kabupaten/Kota terpilih.
    - Titik Biru Tua (`#102A43`): Rasio Provinsi pembanding.
    - Garis penghubung abu-abu yang memperlihatkan gap/selisih ketersediaan tenaga kesehatan.

---

## 3. Daftar File yang Terdampak (Affected Files)

Untuk menghindari *merge conflict* dengan pengerjaan Fase 2 oleh rekan tim:

- `[ Buat Baru ]` `assets/js/data/fase3-ekonomi-data.js` — Menyimpan struktur data terpadu Fase 3 (Indeks P1 Kemiskinan, PDRB 2024 vs 2025, KBLI Industri Besar & Sedang, Ekosistem Usaha & Wisatawan 2021–2025, serta Rasio Nakes).
- `[ Buat Baru ]` `assets/js/core/ProfilFase3.js` — Modul controller mandiri yang menangani seluruh logika render, ECharts instance lifecycle, resize listener, dan interaksi klik untuk seluruh widget Fase 3 tanpa membebani file [`Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js).
- `[ Buat Baru ]` `assets/css/fase3-widgets.css` — Stylesheet terisolasi untuk tata letak grid, kartu KPI, pill pertumbuhan, dan panel detail Fase 3 (mendukung penuh *Light Mode* & *Dark Mode* `var(--panel)`).
- `[ Modifikasi Minimal ]` [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) — Menambahkan link `<link rel="stylesheet" href="assets/css/fase3-widgets.css">`, mount container `#fase3-ekonomi-container` di dalam `#tab-ekonomi`, serta tag `<script>` untuk `fase3-ekonomi-data.js` dan `ProfilFase3.js`.
- `[ Modifikasi Minimal ]` [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) — Menambahkan **1 baris hook** `if (window.renderFase3Widgets) window.renderFase3Widgets(d);` di dalam `renderProfil(d)` dan resize hook pada `switchTab()`.

---

## 4. Langkah Eksekusi Bertahap (Actionable Checkpoints)

- [ ] **Tahap 1 (CP-F3-01) — Audit & Kompilasi Dataset `fase3-ekonomi-data.js`**:
  - Mengumpulkan dan memvalidasi sumber data mentah untuk ke-4 (atau ke-5) widget Fase 3.
  - Membangun skema JSON `window.FASE3_DATA` yang diindeks berdasarkan `id` (1 s.d. 514 Kab/Kota) agar 100% kompatibel dengan [`Data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/Data.js).
- [ ] **Tahap 2 (CP-F3-02) — Implementasi Widget 9 (Chart 11.0: Scatter Plot 4-Kuadran Kemiskinan vs P1)**:
  - Membangun kalkulator median provinsi dinamis (`% Miskin` dan `P1`).
  - Merender ECharts Scatter Plot dengan 4 area `markArea` kuadran berwarna lembut dan garis `markLine` median putus-putus.
  - Menghubungkan event klik titik scatter ke komponen **Panel Detail Wilayah Terpilih** (Insight Pemda & Arah Kebijakan).
- [ ] **Tahap 3 (CP-F3-03) — Implementasi Widget 10 (Chart 13.0: Paired Bar Chart PDRB 2024 vs 2025)**:
  - Menghitung pertumbuhan tiap sektor ($\Delta\%$), mencari sektor *Top Growth*, rata-rata pertumbuhan, dan sektor terendah/kontraksi untuk 3 KPI Card atas.
  - Merender Paired Bar Chart dengan label pill persentase pertumbuhan di atas tiap grup batang dan fitur ekspor CSV.
- [ ] **Tahap 4 (CP-F3-04) — Implementasi Widget 11 (Chart 21.0: Nilai Tambah Industri KBLI)**:
  - Merender 3 KPI Card (Total Nilai Output, Biaya Input, Nilai Tambah).
  - Merender Horizontal Bar Chart 5 Kelompok KBLI dengan toggle `[Top 5]` / `[Semua]` dan panel rincian sub-KBLI 2-digit di sisi kanan.
- [ ] **Tahap 5 (CP-F3-05) — Implementasi Widget 12 (Chart 16 & 17: Treemap Ekosistem Usaha & Wisatawan)**:
  - Membangun filter dropdown tahun (`2021–2025`) yang terhubung ke KPI Card Wisatawan dan ECharts Treemap 7 kategori usaha (dengan tooltip khusus jumlah kamar pada blok `Hotel`).
- [ ] **Tahap 6 (CP-F3-06) — Implementasi Chart 19.0 (Opsional: Dumbbell Plot Rasio Tenaga Kesehatan)**:
  - Merender perbandingan rasio Dokter, Perawat, Bidan, dan Apoteker per 10.000 penduduk di `#tab-sosial`.
- [ ] **Tahap 7 (CP-F3-07) — Pengujian Lintas Tab, Dark Mode, & Responsivitas**:
  - Memastikan seluruh grafik ECharts merespons peralihan tab (`#tab-ekonomi` & `#tab-sosial`) tanpa bug ukuran `0px`.
  - Memastikan tampilan bebas tumpukan teks (*anti-slop UI*) pada layar desktop maupun mobile.

---

## 5. Batasan, Risiko & Catatan Tambahan (Constraints & Edge Cases)

1. **Penanganan Wilayah Tanpa Data (*Zero Fabrication Rule*)**:
   - Apabila suatu Kabupaten/Kota belum memiliki data `P1`, `PDRB 2024`, atau `KBLI Industri`, dilarang keras mengisi dengan angka `0` palsu yang akan mendistorsi nilai median provinsi atau persentase pertumbuhan.
   - Wilayah dengan nilai `null` harus dikeluarkan dari perhitungan median kuadran dan ditampilkan melalui badge informasi *"Data belum tersedia pada publikasi BPS periode ini"*.
2. **Kasus Pembagi Nol pada Pertumbuhan PDRB (Chart 13.0)**:
   - Jika suatu sektor memiliki nilai PDRB `0` pada tahun 2024 (misal sektor Pertambangan atau Listrik di daerah tertentu), perhitungan $\Delta\%$ harus dicegah agar tidak menghasilkan `Infinity%` atau `NaN%`.
3. **Sinkronisasi Git dengan Fase 2**:
   - Seluruh pengembangan Fase 3 wajib dilakukan tanpa memodifikasi fungsi-fungsi milik Fase 2 (`renderInvestasiSektorWidget`, kuadran PMA/PMDN, maupun UMK vs TPT).
   - Sebelum melakukan *commit/push*, jalankan `git pull --rebase` dan pastikan hook di [`Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) tetap bersih.

