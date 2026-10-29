---
title: "Perencanaan Teknis: Integrasi Data Riil PODES 2024 (Akses Listrik & Internet) pada Widget 8 & 15"
date: 2026-10-29
status: Completed
---

# Perencanaan Teknis: Integrasi Data Riil PODES 2024 (Akses Listrik & Internet) pada Widget 8 & 15

Dokumen ini merumuskan hasil audit terhadap berkas data mentah [`data-mentah/xlsx/PODES Listrik & Internet.xlsx`](file:///c:/laragon/www/PKL/mockup/data-mentah/xlsx/PODES%20Listrik%20%26%20Internet.xlsx), metodologi agregasi tingkat Desa/Kelurahan menjadi tingkat Kabupaten/Kota (514 wilayah), serta spesifikasi perubahan kode pada [`assets/js/data/fase1-layanan-data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/fase1-layanan-data.js), [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js), dan [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).

---

## 1. Konteks & Tujuan (Objective)

1. **Menggantikan Status Kosong (`—` / Disabled) pada Widget 8 & 15**:
   - Saat ini pada **Tab Profil Wilayah (`#tab-wilayah`)**, komponen **Widget 8 & 15: Indikator Akses Layanan Dasar Permukiman** baru menampilkan 2 indikator aktif (*Akses Sanitasi Layak* dan *Akses Air Minum Layak*), sementara 2 kartu dan 2 progress bar lainnya (*Akses Listrik PLN* dan *Akses Internet RT*) masih berstatus `.disabled` (`—` / *"Data Kab/Kota Belum Ada"*).
2. **Integrasi 100% Data Riil PODES 2024 BPS**:
   - Tim data telah menyediakan berkas [`data-mentah/xlsx/PODES Listrik & Internet.xlsx`](file:///c:/laragon/www/PKL/mockup/data-mentah/xlsx/PODES%20Listrik%20%26%20Internet.xlsx) (`7,8 MB`) yang memuat data sensus Potensi Desa (PODES) 2024 untuk **84.276 Desa/Kelurahan** di seluruh **514 Kabupaten/Kota**.
   - Tujuan implementasi ini adalah mengekstrak, mengagregasi, dan menampilkan persentase capaian **Akses Listrik** dan **Akses Jaringan Internet** untuk seluruh **514 Kabupaten/Kota (100% match)** tanpa menyimpan file Excel mentah berukuran besar ke dalam repositori Git.

---

## 2. Ruang Lingkup, Audit Data, & Metodologi Kalkulasi (Scope & Architecture)

### 2.1. Hasil Audit Struktur [`data-mentah/xlsx/PODES Listrik & Internet.xlsx`](file:///c:/laragon/www/PKL/mockup/data-mentah/xlsx/PODES%20Listrik%20%26%20Internet.xlsx)

Berdasarkan pemindaian seluruh **84.276 baris desa/kelurahan** pada sheet `podes2024_desa_01` (17 kolom):
* **Kecocokan Wilayah terhadap Master [`data/json/data.json`](file:///c:/laragon/www/PKL/mockup/data/json/data.json)**:
  * Terdapat tepat **514 pasangan unik `(NAMA_PROV, NAMA_KAB)`** di file PODES.
  * Tingkat kecocokan (*matching rate*) terhadap 514 Kabupaten/Kota di portal: **514 / 514 (100,0%)**.
* **Rincian Variabel Listrik (`Kolom 11, 12, 13`)**:
  * `Kolom 11`: *Jumlah keluarga pengguna listrik PLN* (Numerik, jumlah KK per desa/kelurahan).
  * `Kolom 12`: *Jumlah keluarga pengguna listrik Non PLN* (Numerik, jumlah KK per desa/kelurahan).
  * `Kolom 13`: *Jumlah keluarga bukan pengguna listrik* (Numerik, jumlah KK per desa/kelurahan).
* **Rincian Variabel Telekomunikasi & Internet (`Kolom 14, 15, 16`)**:
  * `Kolom 14`: *Keberadaan internet untuk warnet, game online, dan fasilitas lainnya di desa/kelurahan* (`Ada`: 29.950 desa, `Tidak ada`: 54.326 desa).
  * `Kolom 15`: *Sinyal telepon seluler/handphone di sebagian besar wilayah desa/kelurahan*:
    - `Sinyal sangat kuat`: 19.008 desa
    - `Sinyal kuat`: 47.385 desa
    - `Sinyal lemah`: 14.766 desa
    - `Tidak ada sinyal`: 3.117 desa
  * `Kolom 16`: *Sinyal internet telepon seluler/handphone di sebagian besar wilayah di desa/kelurahan*:
    - `5G/4G/LTE`: 73.211 desa
    - `3G/H/H+/EVDO`: 4.915 desa
    - `2,5G/E/GPRS`: 2.008 desa
    - `Tidak ada sinyal internet`: 1.025 desa
    - `#N/A` atau Kosong (`3.117` desa): Terverifikasi 100% beririsan dengan `Kolom 15 == "Tidak ada sinyal"` (karena pada kuesioner BPS PODES, jika desa tidak memiliki sinyal telepon seluler sama sekali, pertanyaan sinyal internet dilewati/blankspot).

---

### 2.2. Rumus Agregasi Tingkat Kabupaten/Kota

Sesuai definisi pada [`Referensi/Widget Kab_Kota.xlsx`](file:///c:/laragon/www/PKL/mockup/Referensi/Widget%20Kab_Kota.xlsx) baris 15–16:

#### 1. Indikator Akses Listrik (`listrik_pct`)
Mengukur persentase keluarga di Kabupaten/Kota yang menggunakan listrik (baik PLN maupun Non-PLN) terhadap total seluruh keluarga di Kabupaten/Kota tersebut:

$$\text{listrik\_pct} = \frac{\sum_{i \in \text{Desa}} \left(\text{KK\_PLN}_i + \text{KK\_NonPLN}_i\right)}{\sum_{i \in \text{Desa}} \left(\text{KK\_PLN}_i + \text{KK\_NonPLN}_i + \text{KK\_NonListrik}_i\right)} \times 100\%$$

Selain `listrik_pct` total, disimpan juga metrik pendamping di dalam objek `layanan_dasar`:
- `listrik_pln_pct`: Persentase keluarga pengguna listrik PLN murni ($\frac{\sum \text{KK\_PLN}}{\sum \text{Total\_KK}} \times 100\%$).
- `keluarga_berlistrik`: Total keluarga berlistrik (PLN + Non-PLN).
- `keluarga_tanpa_listrik`: Total keluarga belum berlistrik.

#### 2. Indikator Akses Internet (`internet_pct`)
Mengukur persentase cakupan akses jaringan internet di Kabupaten/Kota berdasarkan data PODES 2024. Terdapat **2 metrik** yang dihitung dan disimpan:
1. **Metrik Utama (`internet_pct` — Berbasis Proporsi Keluarga di Desa Terjangkau Sinyal Internet Seluler `5G/4G/LTE` & `3G/H/H+/EVDO` & `2,5G`)**:
   $$\text{internet\_pct} = \frac{\sum_{i \in \text{Desa Ber-Internet}} \text{Total\_KK}_i}{\sum_{i \in \text{Seluruh Desa}} \text{Total\_KK}_i} \times 100\%$$
   *(Catatan: Membobot dengan jumlah keluarga di tiap desa jauh lebih akurat secara demografis dibandingkan rata-rata desa biasa, karena desa/kelurahan padat penduduk memiliki bobot rumah tangga yang proporsional dengan indikator Sanitasi, Air Minum, dan Listrik).*
2. **Metrik Pendamping (`internet_4g_desa_pct` & `desa_terjangkau_internet`)**:
   - Persentase desa/kelurahan yang sudah terlayani jaringan cepat **`5G/4G/LTE`** ($\frac{\text{Jumlah Desa 4G/5G}}{\text{Total Desa}} \times 100\%$), yang dapat ditampilkan sebagai sub-info/tooltip pada kartu.

---

### 2.3. Desain Visual & Warna pada Widget 8 & 15 (`renderLayananDasar`)

Mengacu pada tangkapan layar UI saat ini dan pedoman [`PLANNING_VISUALISASI_DAN_INTEGRASI_WIDGET_FASE_1.md`](file:///c:/laragon/www/PKL/mockup/docs/261026/PLANNING_VISUALISASI_DAN_INTEGRASI_WIDGET_FASE_1.md):

| Urutan Kartu & Progress Bar | Label Kartu KPI | Label Progress Bar Bawah | Warna Aksen | Badge Sumber di Bawah Angka |
| :--- | :--- | :--- | :--- | :--- |
| **1. Sanitasi** | `Akses Sanitasi Layak` | `Fasilitas Sanitasi Layak` | **Teal (`#0FB5A0`)** | `🟢 BPS RI 2024 · Tersedia` |
| **2. Air Minum** | `Akses Air Minum Layak` | `Sumber Air Minum Layak` | **Biru (`#2E9BD6`)** | `🟢 BPS RI 2024 · Tersedia` |
| **3. Listrik** | `Akses Listrik (PLN & Non-PLN)` | `Penerangan Listrik Rumah Tangga` | **Amber/Emas (`#F59E0B`)** | `🟢 BPS PODES 2024 · Tersedia` |
| **4. Internet** | `Akses Jaringan Internet` | `Jaringan Telekomunikasi & Internet` | **Ungu/Indigo (`#8B5CF6`)** | `🟢 BPS PODES 2024 · Tersedia` |

* **Perubahan Catatan Kaki (`#srcLayananDasar`) di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html#L1341-L1343)**:
  * Teks lama yang menyatakan *"Indikator Akses Listrik dan Internet tingkat Kab/Kota belum dirilis BPS Nasional (tampil strip)"* diperbarui menjadi:
    > **Sumber Data:** BPS RI — Publikasi Indikator Perumahan & Permukiman 2024 (Sanitasi & Air Minum Layak) serta Pendataan Potensi Desa (PODES) 2024 BPS RI (Cakupan Keluarga Pengguna Listrik PLN/Non-PLN & Jangkauan Jaringan Internet Desa/Kelurahan pada 514 Kabupaten/Kota).

---

## 3. Daftar File yang Terdampak (Affected Files)

- `[ Modifikasi ]` [`scripts/local/extract_fase1_data.py`](file:///c:/laragon/www/PKL/mockup/scripts/local/extract_fase1_data.py) *(atau skrip injeksi lokal `scripts/local/inject_podes_listrik_internet.py`)* — Membaca [`data-mentah/xlsx/PODES Listrik & Internet.xlsx`](file:///c:/laragon/www/PKL/mockup/data-mentah/xlsx/PODES%20Listrik%20%26%20Internet.xlsx), mengagregasi 84.276 desa ke 514 Kabupaten/Kota, dan memperbarui `listrik_pct` serta `internet_pct`.
- `[ Modifikasi ]` [`data/json/fase1-layanan-data.json`](file:///c:/laragon/www/PKL/mockup/data/json/fase1-layanan-data.json) — Menyimpan hasil JSON terstruktur 514 wilayah dengan nilai `listrik_pct` dan `internet_pct` terisi penuh.
- `[ Modifikasi ]` [`assets/js/data/fase1-layanan-data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/fase1-layanan-data.js) — Bundle JS runtime (`window.FASE1_DATA`) yang dimuat oleh [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).
- `[ Modifikasi ]` [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L3095-L3195) — Memperbarui fungsi [`renderLayananDasar(r)`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L3095) agar membaca `ld.listrik_pct` dan `ld.internet_pct` secara dinamis, menghapus class `.disabled` dan `.striped`, serta menampilkan progress bar berwarna proporsional.
- `[ Modifikasi ]` [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html#L1332-L1343) — Memperbarui chip sumber `#layananStatusChip` dan catatan metodologi `#srcLayananDasar`.
- `[ Modifikasi ]` [`.gitignore`](file:///c:/laragon/www/PKL/mockup/.gitignore) — Memastikan seluruh folder `data-mentah/` diabaikan oleh Git agar file Excel 7,8 MB tidak ikut ter-push ke repositori.

---

## 4. Langkah Eksekusi (Actionable Steps)

- [x] **Tahap 1 — Ekstraksi & Agregasi Data PODES 2024 (84.276 Desa $\rightarrow$ 514 Kab/Kota)**:
  - Menjalankan skrip agregasi dari [`data-mentah/xlsx/PODES Listrik & Internet.xlsx`](file:///c:/laragon/www/PKL/mockup/data-mentah/xlsx/PODES%20Listrik%20%26%20Internet.xlsx) untuk menghitung `listrik_pct`, `listrik_pln_pct`, `internet_pct`, dan `internet_4g_desa_pct` pada seluruh 514 Kabupaten/Kota.
  - Menyuntikkan hasilnya ke [`data/json/fase1-layanan-data.json`](file:///c:/laragon/www/PKL/mockup/data/json/fase1-layanan-data.json) dan [`assets/js/data/fase1-layanan-data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/fase1-layanan-data.js).
- [x] **Tahap 2 — Pembaruan Komponen UI [`renderLayananDasar(r)`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L3095) di [`Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js)**:
  - Mengubah kartu ke-3 (**Akses Listrik**) dan kartu ke-4 (**Akses Internet**) dari statis `.disabled` menjadi dinamis berbasis `ld.listrik_pct` dan `ld.internet_pct`.
  - Mengaktifkan animasi *progress bar fill* untuk bar ke-3 (`#F59E0B`) dan bar ke-4 (`#8B5CF6`) beserta tooltip/sub-keterangan rinciannya.
  - Memperbarui teks catatan metodologi di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html#L1341-L1343).
- [x] **Tahap 3 — Verifikasi Kualitas Data & Tampilan Lokal**:
  - Memastikan `514 / 514` Kabupaten/Kota memiliki angka valid ($0 \le x \le 100$) tanpa `NaN` atau `undefined`.
  - Mengecek tampilan kartu dan progress bar di browser lokal (termasuk *Light Mode* dan *Dark Mode*).

---

## 5. Batasan, Risiko & Catatan Tambahan (Constraints & Edge Cases)

1. **Penanganan Pembagi Nol**:
   - Apabila ada baris desa/kelurahan dengan total keluarga `0` (misal wilayah hutan/pemekaran khusus), pastikan akumulator Kabupaten/Kota memiliki guard `total_kk > 0` agar tidak memicu *ZeroDivisionError*.
2. **Presisi Pembulatan**:
   - Untuk daerah perkotaan yang seluruh keluarganya berlistrik (`100%`) atau hampir seluruhnya berlistrik (`99,98%`), gunakan pembulatan 2 desimal di JSON (`round(val, 2)`) dan format `fmt1(val)` (`99,9%` atau `100,0%`) di UI agar seragam dengan kartu Sanitasi dan Air Minum.
3. **Kepatuhan Ukuran Repo Git**:
   - File [`data-mentah/xlsx/PODES Listrik & Internet.xlsx`](file:///c:/laragon/www/PKL/mockup/data-mentah/xlsx/PODES%20Listrik%20%26%20Internet.xlsx) (`7,8 MB`) wajib tetap berada di lokal (diabaikan oleh [`.gitignore`](file:///c:/laragon/www/PKL/mockup/.gitignore)), sedangkan perubahan pada [`assets/js/data/fase1-layanan-data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/fase1-layanan-data.js) hanya menambah ukuran sekitar `~15 KB`.

