# Dokumen Perencanaan Teknis: Integrasi Bedah (Surgical Merge) Fase 2 & Fase 4 dari Branch Rekan

**Tanggal:** 28 Oktober 2026  
**Folder Arsip:** `docs/281026/`  
**Sumber Branch:** `myorigin/feat/investasi-sektor-bkpm` (Commit: `956a4e3` oleh `qeylaaar`)  
**Target Integrasi:** Workspace Lokal `c:\laragon\www\PKL\mockup\` $\rightarrow$ `main`  
**Status:** Draf Perencanaan Siap Dieksekusi  

---

## 1. Latar Belakang & Analisis Situasi

Rekan tim (`qeylaaar`) telah mengunggah branch baru bernama `feat/investasi-sektor-bkpm`. Berdasarkan audit commit `956a4e3`, branch tersebut ternyata memuat penyelesaian untuk dua fase sekaligus:
1. **Fase 2:** Chart 1.0 (Realisasi Investasi Sektor Usaha PMA/PMDN 2025 dari BKPM).
2. **Fase 4:** 
   - Chart 9.0 (Konektivitas Udara & Bandara)
   - Chart 10.0 (Status Darurat & Sebaran Bencana BNPB 2025)
   - Chart 14.0 (Kemantapan Jalan Kabupaten/Kota PUPR)

Sementara itu, pada branch lokal Anda (`HEAD` / commit `a31368a`), kita memiliki:
1. **Perbaikan Spasial Peta Utama:** Persistensi 514 poligon GeoJSON pada zoom-out (`assets/js/core/Map.js`).
2. **Perbaikan Spasial Dossier:** Peta Kotabaru & algoritma 4-tier flexible matching batas wilayah/perairan (`assets/js/core/Profil.js` & `region-boundaries.js`).
3. **Fase 1:** Indikator IPM, Pendidikan, dan Layanan Dasar (`renderRadarIpm`, `renderUhhBenchmark`, `renderLollipopGap`, `renderLayananDasar`).

> [!CAUTION]
> **Risiko Blind Merge:** Jika dilakukan `git merge` mentah secara langsung, Git akan memicu bentrokan (*merge conflict*) besar pada `Profil.js`, `profil.html`, dan `styles.css`. Selain itu, kode rekan Anda yang berpijak pada commit lama berpotensi menghapus perbaikan Kotabaru dan batas wilayah kita.
> 
> **Solusi Aman:** Menggunakan **Surgical Integration (Integrasi Bedah Lokal)**, yaitu mengambil file data baru secara selektif dan menyuntikkan kode fungsi render chart ke file lokal secara presisi tanpa menyentuh Vercel / remote `main` sampai pengujian lokal 100% tuntas.

---

## 2. Inventarisasi File yang Akan Diambil (*Extracted Assets*)

Berikut adalah file-file mandiri dari branch `myorigin/feat/investasi-sektor-bkpm` yang akan diambil langsung ke lokal:

### 2.1 File Dataset JavaScript & JSON
| File | Ukuran / Baris | Kegunaan |
|---|---|---|
| `assets/js/data/investasi-sektor-data.js` | 1 baris (bundle) | Dataset Chart 1.0 Realisasi Investasi BKPM |
| `data/json/investasi-sektor-data.json` | 134.595 baris | Master data JSON Investasi BKPM |
| `assets/js/data/bandara-data.js` | 1 baris (bundle) | Dataset Chart 9.0 Bandara |
| `assets/js/data/darurat-data.js` | 1 baris (bundle) | Dataset Chart 10.0 Bencana BNPB |
| `assets/js/data/jalan-data.js` | 8.226 baris | Dataset Chart 14.0 Kemantapan Jalan PUPR |
| `data/json/jalan-data.json` | 8.226 baris | Master data JSON Jalan PUPR |

### 2.2 Data Mentah & Skrip ETL
| File | Kegunaan |
|---|---|
| `data-mentah/bandara.csv` & `ourairports.csv` | Data mentah bandara |
| `data-mentah/darurat.csv` & `keadaan-darurat.csv` | Data mentah SK darurat BNPB |
| `data-mentah/bkpm/Nilai_PMA_dan_PMDN_Tahun_2025.csv` | Data mentah investasi BKPM |
| `scripts/build_investasi_sektor_data.py` | Generator dataset investasi |
| `scripts/build_jalan_data.py` | Generator dataset jalan |

---

## 3. Matriks Penyatuan Tiga File Kritis (*Surgical Merge Matrix*)

Tiga file di bawah ini diedit bersamaan di kedua branch, sehingga memerlukan penggabungan bedah:

```
                  ┌──────────────────────────────────────────────┐
                  │                 profil.html                  │
                  ├──────────────────────┬───────────────────────┤
                  │     KODE LOKAL       │       KODE REKAN      │
                  │  (Tetap Pertahankan) │       (Suntikkan)     │
                  ├──────────────────────┼───────────────────────┤
                  │ • Navigasi Tab Profil│ • Section #secBandara │
                  │ • Container Wilayah  │ • Section #secDarurat │
                  │ • Script boundaries  │ • Section #secJalan   │
                  │ • Script Fase 1      │ • Container Investasi │
                  │                      │ • Script loader baru  │
                  └──────────────────────┴───────────────────────┘

                  ┌──────────────────────────────────────────────┐
                  │           assets/js/core/Profil.js           │
                  ├──────────────────────┬───────────────────────┤
                  │     KODE LOKAL       │       KODE REKAN      │
                  │  (PROTEKSI MUTLAK)   │       (Suntikkan)     │
                  ├──────────────────────┼───────────────────────┤
                  │ • Baris 1 - 800:     │ • renderInvestasiSektor()
                  │   - Init Map Kotabaru│ • renderBandara()     │
                  │   - 4-Tier Match     │ • renderDarurat()     │
                  │   - Ocean Boundaries │ • renderJalan()       │
                  │ • renderRadarIpm()   │ • Event listener tab  │
                  │ • renderUhh()        │   terkait             │
                  │ • renderLayananDasar │                       │
                  └──────────────────────┴───────────────────────┘

                  ┌──────────────────────────────────────────────┐
                  │            assets/css/styles.css             │
                  ├──────────────────────┬───────────────────────┤
                  │     KODE LOKAL       │       KODE REKAN      │
                  │  (Tetap Pertahankan) │       (Suntikkan)     │
                  ├──────────────────────┼───────────────────────┤
                  │ • Dark Mode Map      │ • .darurat-heatmap    │
                  │ • Leaflet HUD Tooltip│ • .bandara-card       │
                  │ • Cursor Grab/Pointer│ • .jalan-progress-bar │
                  │                      │ • .bkpm-tooltip       │
                  └──────────────────────┴───────────────────────┘
```

---

## 4. Rencana Langkah Eksekusi Bertahap

### Langkah 1: Checkout File Mandiri Rekan
Mengambil seluruh file `.js`, `.json`, `.csv`, dan skrip `.py` baru langsung dari branch `myorigin/feat/investasi-sektor-bkpm` ke workspace lokal:
```bash
git checkout myorigin/feat/investasi-sektor-bkpm -- assets/js/data/investasi-sektor-data.js assets/js/data/bandara-data.js assets/js/data/darurat-data.js assets/js/data/jalan-data.js data/json/investasi-sektor-data.json data/json/jalan-data.json data-mentah/ scripts/build_investasi_sektor_data.py scripts/build_jalan_data.py
```

### Langkah 2: Suntikkan Elemen HTML ke `profil.html`
1. Tambahkan tag script loader di bagian bawah `profil.html`:
   ```html
   <script src="assets/js/data/bandara-data.js"></script>
   <script src="assets/js/data/darurat-data.js"></script>
   <script src="assets/js/data/jalan-data.js"></script>
   <script src="assets/js/data/investasi-sektor-data.js"></script>
   ```
2. Tambahkan kontainer UI untuk Chart 1 (Investasi Sektor), Chart 9 (Bandara), Chart 10 (Heatmap Darurat Bencana BNPB), dan Chart 14 (Kemantapan Jalan PUPR).
3. Tambahkan elemen tooltip `<div id="bkpmTooltip" class="bkpm-floating-tooltip"></div>`.

### Langkah 3: Suntikkan CSS ke `assets/css/styles.css`
Tambahkan blok CSS styling baru milik rekan Anda di akhir file `styles.css` tanpa mengubah styling peta dark mode kita.

### Langkah 4: Suntikkan Logika Render ke `assets/js/core/Profil.js`
1. Pastikan logika baris 1 s/d 800 (Inisialisasi Peta Kotabaru, 4-tier flexible matching, dan perairan) **tidak disentuh**.
2. Masukkan 4 fungsi render baru:
   - `renderInvestasiSektor(r)`
   - `renderBandara(r)`
   - `renderDarurat(r)`
   - `renderJalan(r)`
3. Pasang pemicu eksekusi pada fungsi `renderProfile()` atau saat tab terkait diklik.

---

## 5. Rencana Pengujian & Validasi Lokal (Quality Gate)

Pengujian dilakukan sepenuhnya di server lokal `http://localhost:3000/`:

| No | Komponen yang Diuji | Parameter Keberhasilan |
|---|---|---|
| **TC-01** | Tab Wilayah & Perairan Kotabaru | Peta Kotabaru terbuka normal, batas darat & perairan (Selat Laut, Selat Makassar) terdeteksi lengkap. |
| **TC-02** | Peta Utama `index.html` | Filter Banten $\rightarrow$ Kota Serang $\rightarrow$ zoom out: seluruh nusantara tetap terarsir utuh. |
| **TC-03** | Chart 1.0 (Investasi BKPM) | Grafik batang PMA/PMDN muncul di tab Ekonomi/Investasi dengan tooltip melayang. |
| **TC-04** | Chart 9.0 (Bandara) | Kartu informasi bandara terdekat/wilayah tampil dengan rincian operasional. |
| **TC-05** | Chart 10.0 (Bencana BNPB) | Heatmap 12 bulan (Jan-Des) terarsir sesuai frekuensi bencana, daftar SK darurat dapat diklik. |
| **TC-06** | Chart 14.0 (Jalan PUPR) | Rasio jalan mantap vs tidak mantap tampil dengan progress bar proporsional. |
| **TC-07** | Konsol Browser | Tidak ada error JavaScript (`Uncaught TypeError` atau `is not defined`). |

---

## 6. Prosedur Rilis ke GitHub & Vercel

Setelah seluruh pengujian TC-01 s/d TC-07 lulus:
1. `git add .`
2. `git commit -m "feat: surgically integrate phase 2 (investasi bkpm) and phase 4 (infrastruktur & bencana) widgets"`
3. `git push myorigin main`
4. Vercel akan otomatis melakukan *build production* dan website publik Anda langsung aktif dengan 15+ widget lengkap tanpa satupun regresi atau error.
