---
title: "Perencanaan Integrasi Data Riil POI Bali ke Fitur Peta Potensi Pajak (PAD360)"
date: 2026-11-10
status: In Progress
---

# Perencanaan Integrasi Data Riil POI Bali ke Fitur Peta Potensi Pajak (PAD360)

## 1. Konteks & Tujuan (Objective)
Saat ini fitur **Peta Potensi Pajak PAD360** pada workspace portal masih menggunakan data sintetis (dummy) dengan total 41 titik POI untuk seluruh Provinsi Bali (rata-rata hanya 4–5 POI per Kabupaten/Kota dari hasil generator template `scripts/build_even_potensi_data.js`).

User telah menyediakan data mentah riil di direktori `data-mentah\xlsx\poi-bali` yang terdiri dari 5 file Excel. Tujuan dari perencanaan ini adalah melakukan audit kualitas data mentah (*data cleansing & validation*), normalisasi skema data POI, dan mengintegrasikan ratusan titik POI riil tersebut ke dalam dataset aktif portal (`data/json/potensi-data.json` dan `assets/js/data/potensi-data.js`) secara presisi tanpa merusak visualisasi peta, clustering Leaflet, dropdown filter kabupaten/kota, maupun perhitungan agregasi potensi PAD.

---

## 2. Hasil Analisis Data Mentah XLSX (`data-mentah/xlsx/poi-bali/`)

Berdasarkan audit komputasi menyeluruh terhadap kelima file Excel, ditemukan fakta-fakta teknis berikut:

### 2.1. `MASTER_POI_ADS_BALI.xlsx` (Dataset Utama Iklan Outdoor)
- **Jumlah Baris Data**: 266 titik POI.
- **Kualitas Koordinat**: 100% lengkap dan valid (Latitude `-8.83` s/d `-8.16`, Longitude `114.43` s/d `115.61`), tepat di daratan Pulau Bali.
- **Sumber Data**: Terkompilasi dari 10 vendor media periklanan resmi (Lestari Ads: 61, Billboard.id: 48, The Bali Gen: 47, IVI Media: 29, EPB Media: 23, Nusaka Bali: 22, Karyaku: 22, Petraco: 9, CV Bali Media: 3, Lokasi Billboard: 2).
- **Distribusi Jenis Media**: Billboard (195), Baliho (37), Videotron (18), LED Billboard (8), Transit Ad (6), Bando Jalan (1), Neon Box (1).
- **Sebaran Kabupaten/Kota**:
  - Kabupaten Badung: 115 titik
  - Kota Denpasar: 91 titik
  - Kabupaten Gianyar: 16 titik
  - Kabupaten Bangli: 7 titik
  - Kabupaten Karangasem: 5 titik
  - Kabupaten Jembrana: 4 titik
  - Kabupaten Tabanan: 3 titik
  - **Bali (Unspecified)**: 25 titik (perlu reverse-mapping ke kabupaten/kota berdasarkan nama jalan/koordinat, misalnya: *Jl. Sunset Road* $\rightarrow$ Badung, *Ketewel* $\rightarrow$ Gianyar, *Bedugul* $\rightarrow$ Tabanan).

### 2.2. `Data_Parkiran_Bali.xlsx` (Dataset Parkir Komersial)
- **Jumlah Baris Data**: 114 titik.
- **Kategori**: Seluruhnya `parkiran`.
- **Temuan Kritis (Outlier Luar Bali)**: Ditemukan **11 titik palsu di luar Pulau Bali** akibat galat algoritma scraping kata kunci (*keyword matching* nama daerah). Contoh outlier:
  - *"Karangasem, Terisi, Indramayu, Jawa Barat"* (Lat: `-6.474`, Lng: `108.172`)
  - *"Karangasem, Kebumen, Jawa Tengah"* (Lat: `-7.653`, Lng: `109.665`)
  - *"Karangasem, Bantarbolang, Pemalang"* (Lat: `-7.035`, Lng: `109.378`)
  - *"Karangasem, Laweyan, Surakarta/Solo"* (Lat: `-7.548`, Lng: `110.778`)
  - *"Dusun Karangasem, Driyorejo, Gresik"* (Lat: `-7.349`, Lng: `112.563`)
  - *"Buleleng, Morowali, Sulawesi Tengah"* (Lat: `-3.028`, Lng: `122.251`)
  - *"Jl. Denpasar, Payakumbuh, Sumatera Barat"* (Lat: `-0.237`, Lng: `100.620`)
  - *"Jl. Bali, Cikarang Barat, Bekasi"* (Lat: `-6.307`, Lng: `107.077`)
- **Titik Riil Bali yang Valid**: **103 titik** mencakup seluruh 9 Kabupaten/Kota di Bali (Denpasar: 38, Karangasem: 18, Badung: 12, Gianyar: 11, Tabanan: 7, Bangli: 6, Buleleng: 5, Jembrana: 3, Klungkung: 3).

### 2.3. `Data_Reklame_Bali.xlsx` (Dataset Toko / Vendor / Biro Reklame)
- **Jumlah Baris Data**: 242 titik.
- **Karakter Data**: Berisi profil entitas badan usaha/toko (Toko Reklame: 133, Biro Iklan: 56, Toko: 11, Kantor Perusahaan: 10, Bengkel/Tukang Las: 4, dll.), bukan titik fisik tiang billboard jalan.
- **Temuan Kritis (Bug Format Koordinat)**:
  - 100% nilai Latitude dan Longitude tersimpan sebagai integer tanpa tanda titik desimal (misal: `-83487304` dan `1146223844` atau `114620792`).
  - Parsing normalisasi desimal membuktikan seluruh titik berada di rentang koordinat Bali yang sah (Lat `-8.82` s/d `-8.08`, Lng `114.53` s/d `115.62`).
  - Terdapat karakter unicode map pin (`\ue0c8`) di depan alamat yang perlu di-*strip*.
  - Terdapat 1 typo alamat: *"Dalung, Kec. Kuta Utara, kabupaten bandung"* yang sebenarnya adalah Kabupaten Badung.

### 2.4. `Data_Videotron_bali.xlsx` (5 baris) & `Hasil_Billboard_bali.xlsx` (2 baris)
- Hasil scraping Google Maps tambahan.
- 4 titik merupakan media iklan outdoor fisik baru (3 titik videotron di Badung/Denpasar, 1 billboard di Dewi Sri Kuta) yang belum tercatat di file Master.
- 3 titik sisanya adalah toko/workshop reklame dan kantor periklanan.

---

## 3. Ruang Lingkup & Arsitektur Teknis (Scope & Architecture)

```
+-----------------------------------------------------------------------------------------+
|                                TAHAP PIPELINE INTEGRASI                                |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [data-mentah/xlsx/poi-bali/]                                                           |
|    |-- MASTER_POI_ADS_BALI.xlsx (266 titik iklan)                                       |
|    |-- Data_Parkiran_Bali.xlsx   (103 titik parkir valid; 11 outlier luar Bali di-drop) |
|    |-- Data_Videotron_bali.xlsx  (3 titik videotron outdoor baru)                       |
|    |-- Hasil_Billboard_bali.xlsx (1 titik billboard baru)                               |
|                                                                                         |
|                                         v                                               |
|                    [scripts/import_bali_poi_data.py] (ETL Script)                       |
|                      1. Sanitasi Bounding Box Bali & Regex Typo                         |
|                      2. Reverse-Mapping 25 Unspecified Regency                          |
|                      3. Injeksi Skema PAD360 (taxType, formula, NSR, potValJt)          |
|                      4. Metadata Kontrak, WhatsApp, Audit Trail Timeline                |
|                                                                                         |
|                                         v                                               |
|               +-------------------------+-------------------------+                     |
|               |                                                   |                     |
|               v                                                   v                     |
|  [data/json/potensi-data.json]                        [assets/js/data/potensi-data.js]  |
|    - Update "objects" Bali (~373 POI riil)              - Mirror window.PotensiData     |
|    - Update "cities" agregat (poi, ver, pot)            - Standby offline/no-fetch      |
|    - Update "provinces" agregat Bali                                                    |
|                                         v                                               |
|                          [assets/js/core/potensi.js]                                    |
|         Peta Potensi Interaktif: Cluster Pin, Filter Kab/Kota, Tabel, Modal Detail      |
+-----------------------------------------------------------------------------------------+
```

### 3.1. Pemetaan Kategori ke PAD360
- **Kategori Reklame (`rek`)**:
  - Jenis: Billboard, Baliho, Videotron, LED Megatron, Neon Box.
  - Tax Type: *Pajak Reklame* / *Pajak Reklame Elektronik*.
  - Formula: Luas $\times$ NSR (Nilai Sewa Reklame) $\times$ Tarif 25%.
- **Kategori Parkir (`pkr`)**:
  - Jenis: Pelataran Parkir, Gedung Parkir Komersial, Off-Street Parking.
  - Tax Type: *PBJT Jasa Parkir*.
  - Formula: Kapasitas Kendaraan $\times$ Omzet Bulanan $\times$ Tarif PBJT 10%.

### 3.2. Sinkronisasi Metrik Agregasi Wilayah
Ketika objek POI di Bali bertambah dari 41 menjadi sekitar **373 titik riil**, metrik berikut wajib diperbarui secara otomatis di level JSON agar kartu ringkasan tidak mengalami desinkronisasi:
1. `cities[...].poi`: Dihitung ulang per kabupaten/kota.
2. `cities[...].ver`: Dihitung ulang (rasio status stage verifikasi/audit).
3. `cities[...].pot`: Akumulasi nilai potensi finansial pajak (dalam Milyar Rupiah).
4. `provinces[id='bali'].poi`: Total POI Provinsi Bali ($\sum$ POI seluruh 9 kabupaten/kota).
5. `provinces[id='bali'].pot`: Total potensi PAD Provinsi Bali.

---

## 4. Daftar File yang Terdampak (Affected Files)

1. `[ Buat Baru ]` `scripts/import_bali_poi_data.py`
   - Script python mandiri untuk mengekstraksi, membersihkan, mentransformasikan, dan menginjeksi data XLSX POI Bali ke format JSON/JS PAD360.
2. `[ Modifikasi ]` `data/json/potensi-data.json`
   - File data master backend yang di-fetch secara asynchronous oleh controller `potensi.js`.
3. `[ Modifikasi ]` `assets/js/data/potensi-data.js`
   - Objek `window.PotensiData` yang berfungsi sebagai sumber data fallback client-side.
4. `[ Verifikasi ]` `assets/js/core/potensi.js`
   - Memastikan clustering Leaflet (`markerClusterGroup`) dan penanganan performa DOM tabel lancar menangani 100+ pin di Denpasar dan Badung tanpa freezing.

---

## 5. Langkah Eksekusi (Actionable Steps)

- [x] **Tahap 1: Validasi Rencana & Konfirmasi Desain dengan User**
  - Mengonfirmasi penanganan data:
    1. Mengintegrasikan 266 titik iklan outdoor dari Master + 4 titik iklan tambahan.
    2. Mengintegrasikan 103 titik parkir valid (membuang 11 titik outlier luar Bali).
    3. Status `Data_Reklame_Bali.xlsx` (242 toko reklame) dipisahkan karena bertipe badan usaha/toko.
- [x] **Tahap 2: Pembuatan Script ETL (`scripts/import_bali_poi_data.py`)**
  - Implementasi fungsi geocoding bounding box Bali (`-8.92` s/d `-8.05`, `114.40` s/d `115.75`).
  - Implementasi resolver 25 titik "Bali (Unspecified)" ke kabupaten yang sesuai berdasarkan kata kunci alamat atau kalkulasi jarak centroid.
  - Normalisasi nama, alamat, nomor kontak, vendor, dan dimensi reklame.
  - Perhitungan estimasi potensi pajak berbasis rumus resmi PAD360.
- [x] **Tahap 3: Eksekusi Transformasi Data & Enrichment**
  - Menjalankan script konversi untuk memperbarui `data/json/potensi-data.json` dan `assets/js/data/potensi-data.js`.
  - Melakukan rekalkulasi otomatis untuk kolom `poi`, `ver`, dan `pot` pada 9 kota di Bali dan Provinsi Bali.
- [ ] **Tahap 4: Pengujian dan Verifikasi Visual Peta Potensi (Lokal)**
  - Uji visualisasi peta: pin marker muncul presisi di wilayah Bali (Denpasar, Badung, Gianyar, Tabanan, Bangli, Karangasem, Jembrana, Buleleng, Klungkung).
  - Uji drilldown: klik cluster dan zoom in/out berfungsi mulus.
  - Uji filter: dropdown Kabupaten/Kota menampilkan jumlah POI riil yang sesuai.
  - Uji mode tabel: tabel POI menampilkan nama, kategori, alamat, status izin, dan nilai potensi.
  - Uji modal detail POI & WhatsApp reminder.

---

## 6. Batasan, Risiko & Catatan Tambahan (Constraints & Edge Cases)

1. **Pencegahan Data Corrupt (Outliers)**:
   - Wajib menerapkan aturan ketat: titik dengan koordinat di luar wilayah administratif Bali **dilarang masuk** ke dataset agar pin tidak terbang ke Jawa Barat, Jawa Tengah, atau Sulawesi.
2. **Kepadatan Titik di Koridor Sunset Road & Denpasar**:
   - Terdapat konsentrasi tinggi titik reklame di sepanjang Jl. Sunset Road, Jl. Bypass Ngurah Rai, dan Jl. Imam Bonjol. Sistem clustering Leaflet harus aktif pada zoom level rendah/menengah agar browser tidak mengalami penurunan frame rate.
3. **Integritas Skema Objek**:
   - Setiap objek POI baru wajib memiliki seluruh atribut wajib (`id`, `name`, `cityId`, `category`, `catName`, `lat`, `lng`, `owner`, `op`, `w`, `h`, `sisi`, `jenis`, `periode`, `regStatus`, `izinUsaha`, `izinRek`, `addr`, `coord`, `taxType`, `estimatedValue`, `potValJt`, `formula`, `stage`, `requested`, `hist`, `related`, `contractEnd`, `contractDaysLeft`, `contractStatus`, `contractBadge`, `contactPerson`, `contactPhone`, `googleMapsUrl`) agar tidak memicu JavaScript runtime exception (`null pointer` / `undefined property`) pada modal detail atau tabel.

