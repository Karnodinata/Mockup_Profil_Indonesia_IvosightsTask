# Rencana Integrasi Data Sosial (Pendidikan & Kesehatan)

**Dokumen Perencanaan Teknis & Arsitektur Data**  
*Tanggal: 12 Oktober 2026*  
*Target: Tab 8 (Sosial) — Portal Data Profil Kabupaten & Kota Indonesia*

---

## 1. Latar Belakang & Masalah

Saat ini, **Tab 8: Sosial** pada controller `Profil.js` masih berstatus **100% dummy (hardcoded)**:
- **Sarana Pendidikan:** Nilai grafik dipatok statis untuk semua wilayah (SD 480, SMP 210, SMA 110, SMK 95, Perguruan Tinggi 28).
- **Sarana Kesehatan:** Nilai fasilitas dipatok statis (Rumah Sakit 24, Puskesmas 38).
- **KPI Card (`#sosKpis`):** Kontainer kartu ringkasan atas masih kosong.
- Tidak ada hubungan data dengan ID daerah yang sedang aktif.

Di sisi lain, telah tersedia dataset riil yang sangat kaya di folder `data-mentah/xlsx/pendidikan/` dan `data-mentah/xlsx/kesehatan/`. Dokumen ini merancang pipeline ETL (Extract, Transform, Load) untuk mengubah data mentah tersebut menjadi basis data teragregasi yang ringan, presisi, dan siap ditampilkan di antarmuka web.

---

## 2. Inventarisasi & Audit Data Mentah

### A. Sektor Pendidikan (`data-mentah/xlsx/pendidikan/`)
1. **`Data_Sekolah_Indonesia_Master.xlsx` (126.1 MB):**
   - **Volume:** **491.064 baris** (seluruh sekolah di Indonesia).
   - **Tingkat Kecocokan:** **99.9%** terhadap 514 daerah BPS kita.
   - **Atribut Utama:**
     - `provinsi`, `kabupaten`, `kecamatan`
     - `bentuk_pendidikan`: `SD`, `SMP`, `SMA`, `SMK`, `SLB`, `MI`, `MTs`, `MA`, `TK`, `PAUDQ`, `KB`, `TPA`, `SPS`, `PKBM`, `SKB`, dll.
     - `status_sekolah`: `Negeri` / `Swasta`.
     - `akreditasi`: `A`, `B`, `C`, `Belum Terakreditasi`.
     - `siswa_jml_pd`: Jumlah siswa/peserta didik riil.
     - `guru_laki`, `guru_perempuan`: Jumlah tenaga pendidik riil.
     - `lintang`, `bujur`: Koordinat geografis.
2. **`Perguruan Tinggi/pddikti_final_lengkap.xlsx` (3.0 MB):**
   - **Volume:** **6.765 baris** (seluruh perguruan tinggi PDDIKTI Kemendikbudristek).
   - **Atribut Utama:** `info_provinsi_pt`, `info_kab_kota_pt`, `info_nama_pt`, `info_status_pt` (Aktif, Pembinaan, Alih Bentuk), `info_akreditasi`.
3. **`kemendikdasmen/data_dikmas_detail.xlsx` (8.0 MB):**
   - **Volume:** Data pendidikan masyarakat (Kursus, TBM, PKBM, SKB, Pondok Pesantren) per Kabupaten/Kota.

### B. Sektor Kesehatan (`data-mentah/xlsx/kesehatan/`)
1. **`Puskesmas/puskesmas.xlsx` (398.5 KB):**
   - **Volume:** **6.117 baris** (Puskesmas seluruh Indonesia).
   - **Atribut Utama:** `nama`, `kota` (Kabupaten/Kota), `telepon`, `email`, `lat`, `lon`.
2. **`Rumah Sakit/data_rumah_sakit_kemenkes_complete.xlsx` (23.4 KB):**
   - **Volume:** **1.000 baris** Rumah Sakit rujukan Kemenkes resmi.
   - **Atribut Utama:** Nama Rumah Sakit, Provinsi, Alamat lengkap (mengandung nama Kab/Kota), nomor telepon, email, website resmi, kontak WA.
3. **`Rumah Sakit/data_dokter_kemenkes_cleaned.xlsx` (517.8 KB):**
   - Profil dokter spesialis Kemenkes dan lokasi rumah sakit bertugas.
4. **`Klinik/klinik_satusehat.xlsx` (431.8 KB):**
   - **Volume:** **5.955 baris** klinik terdaftar di platform SatuSehat Kemenkes.

---

## 3. Desain Skema Data Teragregasi (`sosial-data.json` & `sosial-data.js`)

Agar performa web browser tetap instan (< 50ms) dan tidak membebani memori dengan membaca file 126 MB, skrip ETL akan mengagregasi data mentah ke dalam format JSON terstruktur untuk 514 daerah:

```json
{
  "1": {
    "id": 1,
    "kabkota": "BIREUEN",
    "provinsi": "ACEH",
    "has_data": true,
    "ringkasan": {
      "total_sekolah": 724,
      "total_siswa": 68420,
      "total_guru": 5410,
      "total_kampus": 6,
      "total_faskes": 26,
      "total_puskesmas": 20,
      "total_rs": 4,
      "total_klinik": 2
    },
    "pendidikan": {
      "rekap_jenjang": {
        "sd_mi": { "total": 279, "negeri": 240, "swasta": 39, "siswa": 31200, "guru": 2100 },
        "smp_mts": { "total": 120, "negeri": 92, "swasta": 28, "siswa": 18400, "guru": 1450 },
        "sma_ma": { "total": 53, "negeri": 38, "swasta": 15, "siswa": 12100, "guru": 1050 },
        "smk": { "total": 16, "negeri": 11, "swasta": 5, "siswa": 4800, "guru": 420 },
        "paud_tk": { "total": 252, "negeri": 15, "swasta": 237, "siswa": 1920, "guru": 390 },
        "slb": { "total": 4, "negeri": 2, "swasta": 2, "siswa": 180, "guru": 45 },
        "dikmas": { "total": 42, "pkbm": 28, "skb": 2, "kursus": 12 }
      },
      "akreditasi": { "a": 128, "b": 392, "c": 140, "belum": 64 },
      "daftar_perguruan_tinggi": [
        { "nama": "Universitas Almuslim", "status": "Aktif", "akreditasi": "B" },
        { "nama": "IAI Al-Aziziyah Samalanga", "status": "Aktif", "akreditasi": "Baik Sekali" }
      ]
    },
    "kesehatan": {
      "puskesmas": [
        { "nama": "Puskesmas Peusangan", "telepon": "0644-...", "email": "..." }
      ],
      "rumah_sakit": [
        { "nama": "RSUD dr. Fauziah Bireuen", "alamat": "Jl. Mayjen T. Hamzah Bendahara", "telepon": "..." }
      ],
      "klinik": [
        { "nama": "Klinik Pratama ...", "telepon": "..." }
      ]
    }
  }
}
```

---

## 4. Pipeline ETL (`scripts/build_sosial_data.py`)

Skrip ETL akan memproses data dengan prinsip berikut:
1. **Streaming & Memory Efficient:**
   - Membaca `Data_Sekolah_Indonesia_Master.xlsx` (126 MB) menggunakan mode `read_only=True` pada `openpyxl` sehingga RAM yang digunakan sangat hemat (< 200 MB).
2. **Kamus Alias Daerah (Fuzzy & Alias Matching):**
   - Menyelaraskan nama daerah yang berbeda gaya penulisan:
     - `Kab. Toba Samosir` -> `TOBA`
     - `Kab. Pangkajene Kepulauan` -> `PANGKAJENE DAN KEPULAUAN`
     - `Kota Adm. Jakarta Selatan` -> `JAKARTA SELATAN`
     - `Kab. Adm. Kep. Seribu` -> `KEPULAUAN SERIBU`
     - `Kab. Marowali` -> `MOROWALI`
     - `Kab. Pasir` -> `PASER`
     - `Kab. Yapen Waropen` -> `KEPULAUAN YAPEN`
     - `Kab. Kepulauan Sitaro` -> `KEPULAUAN SIAU TAGULANDANG BIARO`
3. **Output Dual-Format:**
   - `sosial-data.json`: Format JSON murni untuk konsumsi data API / backend.
   - `sosial-data.js`: Berisi `window.SOSIAL_DATA = { ... };` untuk pemuatan langsung dan cepat pada aplikasi browser mockup tanpa dependensi server fetch.

---

## 5. Rencana Pembaruan UI & Interaksi (Tab 8 Sosial)

Setelah data siap, tampilan Tab 8 di `profil.html` dan `Profil.js` akan di-upgrade:

1. **4 Kartu Ringkasan KPI Atas (`#sosKpis`):**
   - **Total Satuan Pendidikan:** Jumlah seluruh sekolah & kampus.
   - **Peserta Didik & Guru:** Total siswa terdaftar & rasio terhadap guru.
   - **Perguruan Tinggi:** Jumlah kampus aktif di wilayah tersebut.
   - **Fasilitas Kesehatan:** Total Puskesmas, Rumah Sakit, dan Klinik.
2. **Visualisasi Grafik Pendidikan Dinamis (`#eduBar`):**
   - Menampilkan perbandingan riil: SD/MI, SMP/MTs, SMA/MA, SMK, PAUD/TK, dan Perguruan Tinggi.
   - Warna batang harmonis dengan label data aktual daerah.
3. **Kartu Status & Akreditasi Sekolah:**
   - Menampilkan persentase Sekolah Negeri vs Swasta.
   - Distribusi Akreditasi (A, B, C, Belum Akreditasi).
4. **Fasilitas Kesehatan Terinci (`#healthGrid`):**
   - Kartu metrik: Jumlah Rumah Sakit, Puskesmas, dan Klinik.
   - Tombol interaktif **"Lihat Daftar Fasilitas Kesehatan"** yang menampilkan modal tabel berisi nama RS/Puskesmas, alamat, dan nomor kontak resmi di daerah tersebut.
5. **Tombol "Lihat Semua Kampus":**
   - Menampilkan daftar perguruan tinggi di daerah tersebut beserta akreditasinya.

---

## 6. Jadwal & Tahapan Eksekusi

| Tahap | Tindakan | Output |
|---|---|---|
| **Tahap 1** | Pembuatan skrip ETL `scripts/build_sosial_data.py` | Skrip parser otomatis |
| **Tahap 2** | Ekstraksi & kompilasi data mentah ke JSON/JS | `sosial-data.json` & `sosial-data.js` |
| **Tahap 3** | Validasi integritas data 514 daerah | Laporan audit coverage 514 daerah |
| **Tahap 4** | Integrasi script di `profil.html` & rewrite `renderSosial()` di `Profil.js` | Tampilan UI Tab Sosial dinamis & riil |
| **Tahap 5** | Verifikasi browser di berbagai daerah & commit bersih | Tab Sosial siap produksi |

---

*Dokumen ini dibuat sebagai panduan sebelum implementasi dijalankan.*
