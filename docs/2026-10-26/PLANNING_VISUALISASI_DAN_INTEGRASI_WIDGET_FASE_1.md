# Perencanaan Detail: Desain Visualisasi & Integrasi Widget Fase 1

Dokumen ini merumuskan panduan teknis implementasi visual antarmuka, tata letak CSS, integrasi pustaka grafik, penanganan ergonomi tampilan sesuai panduan `/antislop-ui`, dan pembagian modul controller JavaScript untuk 4 widget analitis Fase 1:
1. **Widget 5.0**: Radar Chart Dimensi IPM
2. **Widget 6.0**: Lollipop Chart Kesenjangan Pendidikan (HLS vs RLS)
3. **Widget 7.0**: Benchmark Umur Harapan Hidup (UHH)
4. **Widget 8 & 15**: Indikator Akses Layanan Dasar Permukiman

Semua desain visual mengacu langsung pada ilustrasi resmi yang tersimpan di [`docs/261026/ilustrasi/`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/).

---

## 1. Analisis Kritis & Kelemahan Teknis yang Wajib Dimitigasi

Sebelum menulis kode integrasi, 3 kelemahan teknis berikut harus diantisipasi:

1. **Masalah Lebar Nol ECharts pada Tab Tersembunyi (*Hidden Tab 0px Width*)** [High confidence]
   * **Masalah**: Tab di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) menggunakan atribut `hidden` / `display: none`. Jika grafik ECharts (Radar atau Bar) diinisialisasi saat tab sedang tidak aktif, browser menghitung lebar container sebesar `0px`, menyebabkan grafik gepeng atau tidak muncul saat tab dibuka.
   * **Mitigasi**: Panggil instance `.resize()` otomatis pada event listener peralihan tab di `switchTab(tabId)`, dan gunakan inisialisasi *lazy-render* (hanya render saat tab pertama kali dibuka atau diperbarui).
2. **Penanganan Tampilan Data Kosong (*Null Handling*) pada Listrik & Internet** [High confidence]
   * **Masalah**: Karena `listrik_pct` dan `internet_pct` bernilai `null` (sesuai prinsip zero data fiktif), UI tidak boleh menampilkan `NaN%`, angka `0%` yang menyesatkan, atau batang progress rusak.
   * **Mitigasi**: Buat fungsi format khusus: jika nilai `null`, tampilkan tanda strip (`—`) dengan badge status abu-abu netral: *"Belum Tersedia di BPS Nasional"*, dan batang progress menggunakan gaya arsir garis lembut (*striped disabled pattern*).
3. **Ergonomi Skala Normalisasi Radar Chart (0–100 vs Angka Asli)** [Medium confidence]
   * **Masalah**: Radar chart menggunakan 4 variabel dengan satuan berbeda (tahun untuk UHH/HLS/RLS, dan Rupiah untuk Pengeluaran PPP). Jika digabung dalam satu skala tanpa normalisasi, angka pengeluaran (jutaan) akan menenggelamkan angka usia (puluhan).
   * **Mitigasi**: Mengikuti petunjuk ilustrasi [`chart_5_radar_ipm.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_5_radar_ipm.png): sumbu radar menggunakan skor normalisasi BPS 0–100, sementara 4 kotak di sebelah kanan menampilkan angka riil lengkap dengan satuannya.

---

## 2. Spesifikasi Detail Desain 4 Widget Fase 1

### 2.1. Widget 5.0: Radar Chart Dimensi IPM
* **Penempatan**: **Tab Penduduk & SDM** (`#tab-penduduk`) di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).
* **Mockup Rujukan**: [`docs/261026/ilustrasi/chart_5_radar_ipm.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_5_radar_ipm.png).
* **Komponen & Tata Letak Grid**:
  ```
  +-----------------------------------------------------------+
  |  Struktur Pembangunan Manusia (Dimensi IPM BPS)           |
  +-----------------------------+-----------------------------+
  |                             | [ Kartu UHH: 75,16 tahun  ] |
  |      RADAR ECHARTS          | [ Kartu HLS: 12,58 tahun  ] |
  |   (4 Sumbu Normalisasi)     | [ Kartu RLS:  7,06 tahun  ] |
  |                             | [ Kartu IPM Total: 75,60  ] |
  +-----------------------------+-----------------------------+
  | Catatan: Skala radar dinormalisasi 0–100 (BPS Goalposts)  |
  +-----------------------------------------------------------+
  ```
* **Spesifikasi Visual**:
  * 4 Sumbu: Atas (UHH), Kanan (HLS), Bawah (RLS), Kiri (IPM / Pengeluaran PPP).
  * Layer 1 (Daerah Terpilih): Garis Teal solid `#0FB5A0` dengan area transparan `rgba(15, 181, 160, 0.35)`.
  * Layer 2 (Rata-rata Provinsi): Garis Abu-abu/Mint `#94A3B8` dengan arsiran halus sebagai pembanding.
  * 4 Kotak Nilai di Kanan: Berlatar `var(--panel-2)`, angka tebal ukuran 20px berfont mono, label uppercase 11px.

---

### 2.2. Widget 6.0: Lollipop Chart Kesenjangan Pendidikan (HLS vs RLS)
* **Penempatan**: **Tab Sosial** (`#tab-sosial`), tepat di bawah kartu Sarana Pendidikan.
* **Mockup Rujukan**: [`docs/261026/ilustrasi/chart_6_lollipop_gap_pendidikan.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_6_lollipop_gap_pendidikan.png).
* **Komponen & Tata Letak**:
  * Judul: *Kesenjangan Pendidikan: Capaian Aktual (RLS) vs Ekspektasi Generasi Muda (HLS)*.
  * Sumbu X: Rentang lama sekolah 0 s.d. 18 tahun.
  * 5 Baris Data Horisontal:
    1. Baris 1: Daerah Terpilih (diberi highlight khusus).
    2. Baris 2–5: 4 Daerah Tetangga (*Peers*) dalam provinsi yang sama untuk konteks perbandingan.
  * Dua Pin Warna per Baris:
    * **Pin Biru Solid `#3B82F6`**: Rata-rata Lama Sekolah (RLS).
    * **Pin Ungu Solid `#8B5CF6`**: Harapan Lama Sekolah (HLS).
    * **Garis Penghubung Ungu Halus**: Jarak antar pin merepresentasikan besaran *gap* antargenerasi (dalam tahun).
  * Legend di Bawah: Tombol pill `[ RLS ]` biru, `[ HLS ]` ungu, teks `Satuan: tahun sekolah`.
  * Tooltip: *"Kab. Indramayu: RLS 7,06 th | HLS 12,58 th (Gap: 5,52 tahun — Kesenjangan Sedang)"*.

---

### 2.3. Widget 7.0: Benchmark Umur Harapan Hidup (UHH)
* **Penempatan**: **Tab Penduduk & SDM** (`#tab-penduduk`), bersanding dalam grid analitis dengan Radar IPM.
* **Mockup Rujukan**: [`docs/261026/ilustrasi/chart_7_benchmark_uhh.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_7_benchmark_uhh.png).
* **Komponen & Tata Letak**:
  1. **3 Kartu KPI di Bagian Atas**:
     * **UHH KAB/KOTA**: Angka besar toska (misal `75,16 tahun`, sublabel: *BPS 2024*).
     * **RATA-RATA PROVINSI**: Angka pembanding (misal `75,53 tahun`).
     * **GAP DEVIASI**: Chip dinamis; hijau jika positif (misal `+0,77 tahun di atas nasional`), amber jika di bawah nasional.
  2. **Bar Chart Horisontal di Bagian Bawah**:
     * Batang 1: Daerah Terpilih (Warna Teal `#0FB5A0`).
     * Batang 2–4: 3 Daerah *Peers* di provinsi yang sama (Warna Teal muda).
     * Batang 5: Rata-rata Provinsi (Warna Slate Gray `#64748B`).
     * Batang 6: Rata-rata Nasional (Warna Amber/Emas `#D97706`, patokan 74,39 tahun).

---

### 2.4. Widget 8 & 15: Layanan Dasar Permukiman
* **Penempatan**: **Tab Profil Wilayah** (`#tab-wilayah`), diletakkan sebelum seksi Elevasi & Curah Hujan.
* **Mockup Rujukan**: [`docs/261026/ilustrasi/chart_8_15_layanan_dasar.png`](file:///c:/laragon/www/PKL/mockup/docs/261026/ilustrasi/chart_8_15_layanan_dasar.png).
* **Komponen & Tata Letak**:
  1. **4 Kartu KPI Atas**:
     * **LISTRIK**: Angka `—` | Badge: *"Belum Tersedia di BPS"* (Warna abu-abu/biru).
     * **AIR MINUM LAYAK**: Angka riil `XX,X%` (Warna Toska `#0D9488`).
     * **INTERNET**: Angka `—` | Badge: *"Belum Tersedia di BPS"* (Warna abu-abu/ungu).
     * **SANITASI LAYAK**: Angka riil `YY,Y%` (Warna Hijau `#16A34A`).
  2. **4 Batang Progress Horisontal Bawah**:
     * Batang 1: **Akses listrik** $\rightarrow$ Status bar terarsir abu-abu netral.
     * Batang 2: **Air minum layak** $\rightarrow$ Bar terisi toska sesuai nilai resmi BPS (misal Indramayu: `98.04%`).
     * Batang 3: **Sanitasi layak** $\rightarrow$ Bar terisi hijau sesuai nilai resmi BPS (misal Indramayu: `93.41%`).
     * Batang 4: **Akses internet** $\rightarrow$ Status bar terarsir abu-abu netral.

---

## 3. Rencana Arsitektur & Perubahan Berkas

### 3.1. Penambahan Script di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html)
Tambahkan pustaka ECharts dan berkas data Fase 1 sebelum `Profil.js`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/echarts/5.5.0/echarts.min.js"></script>
<script src="assets/js/data/fase1-layanan-data.js"></script>
<script src="assets/js/core/Profil.js?v=5.1"></script>
```

### 3.2. Penambahan Gaya CSS (Design System `/antislop-ui`)
Tambahkan aturan CSS scoped untuk widget Fase 1:
* `.fase1-section`: Wrapper kartu dengan padding 18px dan border halus `var(--line)`.
* `.fase1-grid-2`: Layout 2 kolom fleksibel `grid-template-columns: 1fr 1fr; gap: 14px;`.
* `.fase1-kpi-grid-4`: Grid 4 kolom untuk kartu layanan dasar (`repeat(4, 1fr)` di desktop, `repeat(2, 1fr)` di mobile).
* `.fase1-radar-box`: Canvas container ECharts dengan tinggi 340px.
* `.fase1-metric-badge`: Chip badge indikator status (Hijau/Toska/Amber/Netral).
* `.fase1-progress-row`: Layout baris batang progress dengan label kiri, track tengah, dan angka tabular kanan.

### 3.3. Penambahan Modul Controller di [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js)
Tambahkan fungsi-fungsi controller terisolasi:
1. `renderRadarIpm(regionId)`: Membaca `window.FASE1_DATA[id].ipm`, inisialisasi instance ECharts Radar.
2. `renderLollipopGap(regionId)`: Membaca data HLS vs RLS daerah terpilih + 4 daerah *peers* dalam provinsi yang sama, render ECharts Dumbbell / Lollipop.
3. `renderUhhBenchmark(regionId)`: Membaca `window.FASE1_DATA[id].uhh_benchmark`, isi 3 kartu KPI, dan render Horizontal Bar ECharts.
4. `renderLayananDasar(regionId)`: Membaca `window.FASE1_DATA[id].layanan_dasar`, isi 4 kartu KPI dan render 4 progress bar horisontal.
5. `hookFase1TabResize()`: Mendengarkan klik tab untuk memanggil `chartInstance.resize()` saat tab dibuka.

---

## 4. Rencana Kerja Eksekusi Bertahap (*Actionable Checkpoints*)

| Checkpoint | Target Pekerjaan | Kriteria Selesai (*Exit Criteria*) |
| :--- | :--- | :--- |
| **CP-V1** | Include ECharts & `fase1-layanan-data.js` di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) | Berkas ter-load tanpa error di console browser |
| **CP-V2** | Susun HTML Container & CSS untuk 4 Widget di 3 Tab | Struktur layout kartu siap dan responsif di mobile/desktop |
| **CP-V3** | Integrasi Widget 5.0 (Radar IPM) & Widget 7.0 (Benchmark UHH) di Tab Penduduk | Radar chart dan perbandingan UHH tampil dinamis saat ganti wilayah |
| **CP-V4** | Integrasi Widget 6.0 (Lollipop Gap Pendidikan) di Tab Sosial | Grafik lollipop HLS vs RLS tampil membandingkan 5 kabupaten/kota |
| **CP-V5** | Integrasi Widget 8 & 15 (Layanan Dasar) di Tab Profil Wilayah | 4 Kartu KPI dan 4 progress bar terisi data resmi BPS (listrik & internet `—`) |
| **CP-V6** | Uji Coba Lintas Wilayah & Validasi Tab Switching | Uji pada Indramayu, Simeulue, dan Surabaya; chart me-resize sempurna |
