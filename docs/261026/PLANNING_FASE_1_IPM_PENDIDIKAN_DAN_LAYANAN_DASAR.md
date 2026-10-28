# Perencanaan Teknis Terperinci: FASE 1 — IPM, Pendidikan, & Layanan Dasar Permukiman

Dokumen ini memuat arsitektur teknis spesifik, rancangan skema basis data, metodologi statistik resmi BPS, desain antarmuka sesuai prinsip [`/antislop-ui`](file:///c:/laragon/www/PKL/mockup/docs/PLANNING_AUDIT_DAN_PERBAIKAN_UI_ANTISLOP.md), serta rencana eksekusi bertahap (*actionable checkpoint plan*) khusus untuk **Fase 1** dari berkas referensi [`Widget Kab_Kota.xlsx`](file:///c:/laragon/www/PKL/mockup/Referensi/Widget%20Kab_Kota.xlsx) (PIC: **Nada**).

---

## 1. Lingkup Pekerjaan & Identifikasi Komponen Fase 1

Fase 1 mencakup 4 widget visualisasi dan indikator analitis yang saling terhubung:

1. **Widget 5.0 (Radar Chart Dimensi Penyusun IPM)** $\rightarrow$ Ditempatkan pada **Tab Penduduk & SDM** di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).
2. **Widget 6.0 (Lollipop Chart Kesenjangan Pendidikan HLS vs RLS)** $\rightarrow$ Ditempatkan pada **Tab Sosial** di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).
3. **Widget 7.0 (Benchmark Umur Harapan Hidup UHH)** $\rightarrow$ Ditempatkan pada **Tab Penduduk & SDM** di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).
4. **Widget 8 & 15.0 (Indikator Akses Layanan Dasar Permukiman)** $\rightarrow$ Ditempatkan pada **Tab Profil Wilayah** di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).

---

## 2. Metodologi Statistik & Formula Perhitungan BPS

Agar metrik yang disajikan tidak bersifat fiktif atau keliru interpretasi, seluruh kalkulasi menggunakan rumus resmi **BPS Metode Baru**:

### 2.1. Formula Normalisasi 4 Dimensi IPM (Untuk Radar Chart)
BPS menghitung IPM dari 3 dimensi (4 indikator) dengan batas minimum dan maksimum absolut (*goalposts*):
* **Dimensi Kesehatan (UHH)**:
  $$\text{Indeks Kesehatan} = \frac{\text{UHH} - 20}{85 - 20} \times 100$$
  *(Batas min: 20 tahun, max: 85 tahun)*
* **Dimensi Pendidikan 1 (HLS)**:
  $$\text{Indeks HLS} = \frac{\text{HLS} - 0}{18 - 0} \times 100$$
  *(Batas min: 0 tahun, max: 18 tahun)*
* **Dimensi Pendidikan 2 (RLS)**:
  $$\text{Indeks RLS} = \frac{\text{RLS} - 0}{15 - 0} \times 100$$
  *(Batas min: 0 tahun, max: 15 tahun)*
* **Dimensi Standar Hidup Layak (Pengeluaran Riil per Kapita Disesuaikan / PPP)**:
  $$\text{Indeks Pengeluaran} = \frac{\ln(\text{Pengeluaran}) - \ln(1.007.000)}{\ln(26.572.000) - \ln(1.007.000)} \times 100$$
  *(Batas min: Rp 1.007.000, max: Rp 26.572.000)*

> **Manfaat**: Dengan konversi ke skala indeks `0 s.d. 100`, Radar Chart dapat menampilkan keempat pilar penyusun IPM secara adil dan proporsional dalam satu tampilan tanpa distorsi skala.

---

### 2.2. Formula Kesenjangan Pendidikan (*Education Gap*)
* **Definisi**: Selisih antara ekspektasi lama sekolah anak usia 7 tahun ke atas (HLS) dengan realisasi lama sekolah penduduk usia 25 tahun ke atas (RLS).
  $$\text{Gap Pendidikan} = \text{HLS} - \text{RLS}$$
* **Interpretasi**:
  - *Gap Rendah (< 3 tahun)*: Akses pendidikan antargenerasi relatif merata.
  - *Gap Sedang (3 – 5 tahun)*: Generasi muda memiliki peluang sekolah jauh lebih tinggi dibanding generasi pendahulu.
  - *Gap Tinggi (> 5 tahun)*: Akselerasi pembangunan sekolah baru/program beasiswa sedang berlangsung pesat untuk mengejar ketertinggalan pendidikan masa lalu.

---

### 2.3. Formula Benchmark UHH
* **Metrik Komparasi**:
  - Nilai UHH Kabupaten/Kota terpilih.
  - Rata-rata UHH Provinsi bersangkutan.
  - Rata-rata UHH Nasional (**74,39 tahun** rujukan Long Form SP2020 BPS).
  $$\text{Deviasi Nasional} = \text{UHH Daerah} - 74,39$$

---

## 3. Skema Data & Pipeline Penyusunan Data

Data Fase 1 akan dikompilasi secara modular ke dalam:
* `data/json/fase1-layanan-data.json`
* `assets/js/data/fase1-layanan-data.js` (variabel global `window.FASE1_DATA`)

### 3.1. Struktur JSON per Wilayah
```json
{
  "174": {
    "id": 174,
    "kabkota": "KABUPATEN INDRAMAYU",
    "provinsi": "JAWA BARAT",
    "ipm": {
      "skor_total": 68.45,
      "kategori": "Sedang",
      "uhh": 72.15,
      "hls": 12.40,
      "rls": 6.80,
      "pengeluaran_ppp": 10540000,
      "indeks_kesehatan": 80.23,
      "indeks_hls": 68.89,
      "indeks_rls": 45.33,
      "indeks_pengeluaran": 67.45
    },
    "pendidikan_gap": {
      "hls": 12.40,
      "rls": 6.80,
      "gap": 5.60,
      "kategori_gap": "Kesenjangan Sedang"
    },
    "uhh_benchmark": {
      "uhh_daerah": 72.15,
      "uhh_provinsi": 73.80,
      "uhh_nasional": 74.39,
      "selisih_nasional": -2.24
    },
    "layanan_dasar": {
      "sanitasi_layak_pct": 82.50,
      "air_minum_layak_pct": 89.20,
      "listrik_pct": 99.85,
      "internet_pct": 76.40
    }
  }
}
```

### 3.2. Skrip Pembangun Data (`scripts/build_fase1_data.py`)
Skrip akan menggabungkan:
1. Data dasar wilayah dari [`data/json/data.json`](file:///c:/laragon/www/PKL/mockup/data/json/data.json).
2. Data IPM, UHH, HLS, RLS, Sanitasi, Air Minum, Listrik, dan Internet resmi BPS 2023/2024.
3. Otomatisasi kalkulasi keempat indeks normalisasi dan selisih benchmark untuk **514 kabupaten & kota** tanpa nilai `null`.

---

## 4. Desain Visual & Tata Letak Antarmuka (Ergonomi `/antislop-ui`)

### 4.1. Tab Penduduk & SDM
* **Seksi Baru**: *Struktur Pembangunan Manusia & Kualitas Hidup (BPS 2023/2024)*
* **Layout Grid 2 Kolom**:
  * **Kolom Kiri (Widget 5.0)**: **Radar Chart Dimensi IPM**
    * Kartu berlatar `var(--panel-2)` dengan canvas ECharts.
    * Titik pusat menampilkan skor total IPM (misal `68,45`) dengan badge status (`Sedang / Tinggi`).
    * 4 sudut radar: UHH (Kesehatan), HLS (Harapan Sekolah), RLS (Realisasi Sekolah), dan PPP (Standar Hidup).
    * Tooltip detail menampilkan angka riil dan skor indeks normalisasi.
  * **Kolom Kanan (Widget 7.0)**: **Benchmark Umur Harapan Hidup (UHH)**
    * Kartu KPI UHH utama dengan satuan tahun.
    * Horizontal Bar Chart 3 tingkat: Daerah terpilih vs Rata-rata Provinsi vs Rata-rata Nasional.
    * Indikator chip deviasi: berwarna hijau jika di atas nasional, amber jika di bawah nasional.

### 4.2. Tab Sosial (Seksi Pendidikan)
* **Penempatan (Widget 6.0)**: Diposisikan tepat di bawah grafik sarana sekolah eksisting.
* **Layout**: **Lollipop Chart Kesenjangan Pendidikan (HLS vs RLS)**
  * Sumbu X: Lama pendidikan dalam tahun (skala 0 s.d. 18 tahun).
  * Batang garis halus dengan dua pin/bulatan:
    * Pin Teal `#0FB5A0`: Capaian RLS (Rata-rata Lama Sekolah).
    * Pin Oranye `#D9962B`: Ekspektasi HLS (Harapan Lama Sekolah).
  * Di atas garis terdapat teks indikator selisih: *"Kesenjangan: 5,6 Tahun"*.
  * Dilengkapi penjelasan ringkas tentang makna kesenjangan pendidikan antargenerasi.

### 4.3. Tab Profil Wilayah (Seksi Infrastruktur Dasar)
* **Penempatan (Widget 8 & 15.0)**: Diposisikan di bawah blok Geografis / Topografi.
* **Layout**: **4 Kartu KPI Akses Layanan Dasar Permukiman**
  * Grid 4 kolom (responsif 2 kolom di tablet, 1 kolom di HP).
  * Masing-masing kartu memiliki:
    1. 🚽 **Sanitasi Layak**: Persentase jamban sehat & tangki septik (SDG 6.2.1) + Progress Bar hijau.
    2. 🚰 **Air Minum Layak**: Persentase akses air bersih terlindung (SDG 6.1.1) + Progress Bar biru.
    3. ⚡ **Elektrifikasi Listrik**: Persentase pengguna listrik PLN/Non-PLN + Progress Bar kuning.
    4. 🌐 **Akses Internet**: Persentase penduduk terhubung internet + Progress Bar ungu.
  * Catatan kaki resmi BPS Susenas & PODES 2024.

---

## 5. Mesin Visualisasi & Penanganan Lifecycle Tab

### 5.1. Integrasi Apache ECharts
* Menggunakan berkas distribusi `echarts.min.js` yang dimuat secara defer/asynchronous di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).
* Menghindari penggunaan library berat yang tidak perlu. ECharts hanya diinisialisasi saat kontainer widget berstatus aktif.

### 5.2. Penanganan Resize & Tab Tersembunyi (Tab Lifecycle Trap)
* **Kelemahan Klasik ECharts pada Tab Web**: Jika chart diinisialisasi saat tab dalam keadaan `display: none` atau `hidden`, canvas akan memiliki lebar 0px (*0x0 zero dimension glitch*).
* **Solusi Terencana**:
  1. Chart instance disimpan di variabel referensi (misal `window.chartIpmRadar`, `window.chartEduLollipop`).
  2. Saat pengguna mengklik tab melalui fungsi `switchTab(idx)` di [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js), sistem memanggil `.resize()` setelah jeda microtask (50ms).
  3. Menambahkan listener global `window.addEventListener('resize', ...)` agar seluruh chart otomatis menyesuaikan lebar saat ukuran jendela browser diubah.

---

## 6. Matriks Checkpoint Eksekusi (CP-F1)

| Checkpoint | Target Komponen | File Terkait | Rincian Aksi & Deliverable |
|:---|:---|:---|:---|
| **CP-F1-01** | **Pembuatan Dataset Fase 1** | `scripts/build_fase1_data.py`<br>`data/json/fase1-layanan-data.json`<br>`assets/js/data/fase1-layanan-data.js` | Bangun skrip kompilasi data UHH, HLS, RLS, Sanitasi, Air, Listrik, Internet untuk 514 kabupaten/kota dan ekspor ke JSON dan JS global. |
| **CP-F1-02** | **Integrasi Engine ECharts** | [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) | Tambahkan script loader `echarts.min.js` dan pastikan kompatibel dengan CSS portal. |
| **CP-F1-03** | **Markup Wadah Widget** | [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) | Tambahkan kontainer HTML untuk Radar IPM & Benchmark UHH di Tab SDM, Lollipop di Tab Sosial, dan 4 Kartu Layanan Dasar di Tab Wilayah. |
| **CP-F1-04** | **Controller Widget 5 & 7 (Tab SDM)** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Buat fungsi render ECharts Radar IPM dan Horizontal Bar Benchmark UHH dengan tooltip bilingual BPS. |
| **CP-F1-05** | **Controller Widget 6 (Tab Sosial)** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Buat fungsi render Lollipop Chart HLS vs RLS dan kartu interpretasi gap pendidikan. |
| **CP-F1-06** | **Controller Widget 8 & 15 (Tab Wilayah)** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Render 4 kartu KPI akses layanan dasar permukiman lengkap dengan progress bar dan metadata. |
| **CP-F1-07** | **Sinkronisasi Tab Switch & Resize** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Hubungkan pemanggilan `.resize()` pada fungsi `switchTab(idx)` dan event resize jendela browser. |
| **CP-F1-08** | **Validasi Browser & Bebas Error** | Browser Testing | Uji visual di berbagai kabupaten (Indramayu, Sintang, Aceh Singkil, Depok), pastikan 0 error console dan tampilan responsif. |

---

## 7. Kriteria Keberhasilan (Definition of Done)

1. **Kelengkapan Fitur**:
   - Radar Chart IPM tampil dinamis sesuai profil daerah yang dibuka.
   - Lollipop Chart pendidikan menampilkan titik HLS dan RLS serta angka selisih gap secara akurat.
   - Benchmark UHH menampilkan posisi daerah terhadap rata-rata provinsi dan nasional.
   - 4 Kartu Layanan Dasar tampil rapi di Tab Profil Wilayah.
2. **Kualitas Tampilan (`/antislop-ui`)**:
   - Tidak ada grafik yang terpotong atau memiliki dimensi 0px saat berpindah-pindah tab.
   - Angka berformat standar Indonesia (`id-ID`).
   - Tooltip informatif dan tidak berkedip.
3. **Integritas Sistem**:
   - Seluruh perubahan diuji di lokal dan tidak di-push ke GitHub sebelum verifikasi pengguna.
