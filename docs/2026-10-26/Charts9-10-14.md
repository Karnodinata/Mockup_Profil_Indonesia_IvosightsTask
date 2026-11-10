# PRD & Panduan Teknis Implementasi Fase 4: Infrastruktur, Konektivitas, & Kebencanaan

Dokumen ini disusun sebagai **Product Requirement Document (PRD) dan Spesifikasi Teknis Lengkap** untuk pengerjaan **Fase 4** integrasi 15 widget analitis kabupaten/kota. Dokumen ini dapat diserahkan langsung kepada rekan pengembang (*peer developer*) sebagai panduan implementasi mandiri dengan referensi utama [`Referensi/Widget Kab_Kota.xlsx`](file:///c:/laragon/www/PKL/mockup/Referensi/Widget%20Kab_Kota.xlsx).

---

## 1. Analisis Kritis & Kelemahan Potensial (Wajib Dipahami Dulu)

Sebelum mengeksekusi kode, pengembang wajib memperhatikan 4 potensi jebakan (*pitfalls*) teknis pada Fase 4:

1. **Jebakan Ketiadaan Bandara Lokal (Chart 9.0)** `[High confidence]`
   - Dari 514 kabupaten/kota di Indonesia, lebih dari 200 daerah tidak memiliki bandara di dalam batas administratifnya.
   - **Kelemahan desain fatal**: Jika filter peta hanya mencari `kabkota === currentKabkota`, peta akan kosong (*empty state* buntu).
   - **Solusi**: Terapkan logika *Dual-Scope Fallback*. Jika daerah memiliki bandara, jadikan *primary focus*. Jika tidak, tampilkan bandara terdekat (*Nearest Airport Hub*) dalam radius jangkauan atau bandara se-provinsi beserta estimasi jaraknya (km).

2. **Ketiadaan Data Mentah di Excel untuk Kondisi Jalan (Chart 14.0)** `[High confidence]`
   - Pada [`Referensi/Widget Kab_Kota.xlsx`](file:///c:/laragon/www/PKL/mockup/Referensi/Widget%20Kab_Kota.xlsx) kolom sumber tercatat: *"data tdk ditemukan"*.
   - **Kelemahan eksekusi**: Pengembang bisa terhambat (*blocking*) mencari data yang belum ada.
   - **Solusi**: Gunakan rujukan resmi BPS Publikasi *Statistik Transportasi Darat* / data Ditjen Bina Marga Kementerian PUPR (atau format data BPS *Kabupaten/Kota Dalam Angka - Tabel Panjang Jalan Menurut Kondisi*). Sediakan format skema terstandarisasi di berkas `jalan-data.js`.

3. **Kepadatan Data Mikro BNPB (Chart 10.0)** `[Medium confidence]`
   - File mentah `data-mikro-status-keadaan-darurat-bencana-2025.xlsx` dari BNPB berukuran besar jika dimuat mentah ke client side.
   - **Solusi**: Jangan muat berkas Excel mentah ke runtime browser! Lakukan pra-agregasi menjadi JSON/JS terstruktur (`bnpb-darurat-data.js`) berisi rekap matriks bulan x jenis bencana dan array SK per daerah.

4. **Harmonisasi Skema Warna & Standar Antislop UI** `[High confidence]`
   - Halaman profil bertema terang (**100% white/light theme**). Jangan gunakan background gelap pada card/kontainer widget.
   - Hanya peta yang boleh menggunakan basemap dark mode slate.
   - Palet warna chart harus menggunakan tokens yang telah ada di [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css):
     - Teal (`#0FB5A0`), Sky Blue (`#2E9BD6`), Sand/Amber (`#D9962B`), Coral/Rose (`#EF4444`).

---

## 2. Rincian Spesifikasi 3 Widget Fase 4

```
FASE 4: Infrastruktur, Konektivitas, & Kebencanaan
  ├── Widget 13 (Chart 9.0)  : Peta Interaktif & Karakteristik Sebaran Bandara (Konektivitas Udara)
  ├── Widget 14 (Chart 10.0) : Heatmap Matriks Kejadian & Status Darurat Bencana (BNPB)
  └── Widget 15 (Chart 14.0) : 100% Stacked Bar Chart Kualitas Kondisi Jalan (Infrastruktur Darat)
```

---

### A. Widget 13 (Chart 9.0): Sebaran & Karakteristik Bandara Udara

#### 1. Tujuan & Nilai Bisnis
Menampilkan konektivitas udara dan aksesibilitas wilayah untuk membantu pemangku kepentingan dan investor mengukur kemudahan logistik penumpang dan kargo.

#### 2. Penempatan UI
- **Halaman**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html)
- **Tab**: **Tab Profil Wilayah** (`#tab-wilayah`)
- **Seksi**: Sub-seksi baru *"Konektivitas & Transportasi Udara"* (di bawah kartu peta utama).

#### 3. Variabel Data yang Dibutuhkan
| Variabel | Tipe | Contoh Nilai | Keterangan |
|:---|:---|:---|:---|
| `nama_bandara` | String | `"Bandara Gusti Sjamsir Alam"` | Nama resmi bandara |
| `kode_iata` | String (3 char) | `"KBU"` | Kode IATA penerbangan |
| `kode_icao` | String (4 char) | `"WAOK"` | Kode ICAO internasional |
| `kabkota` | String | `"KABUPATEN KOTABARU"` | Lokasi administratif |
| `prov` | String | `"KALIMANTAN SELATAN"` | Provinsi |
| `lat` | Float | `-3.2986` | Latitude koordinat bandara |
| `lng` | Float | `116.1647` | Longitude koordinat bandara |
| `kelas_bandara` | String | `"Kelas II"` / `"Kelas I Utama"` | Klasifikasi Ditjen Hubud |
| `pengelola` | String | `"UPT Ditjen Perhubungan Udara"` | Badan pengelola |
| `tipe_layanan` | String | `"Domestik"` / `"Internasional"` | Penggunaan penerbangan |
| `status_tkbn` | String | `"Ya"` / `"Tidak"` | Tempat Pendaratan Helikopter/Khusus |
| `panjang_runway` | Integer | `1650` (meter) | Dimensi landasan pacu |
| `jarak_ke_pusat` | Float | `12.4` (km) | Jarak ke pusat kota/kabupaten |

#### 4. Bentuk Visual & Interaktivitas
1. **Layout Berdampingan**:
   - Kolom Kiri (60%): Mini Interactive Map (Leaflet) yang memetakan pin bandara dengan icon pesawat (`✈️`).
   - Kolom Kanan (40%): Detail Dossier Bandara (Card KPI + badge status).
2. **Logika Filter & Penanganan Edge Case**:
   - Jika daerah memiliki bandara $\rightarrow$ Map otomatis memusatkan pin ke bandara tersebut, badge `"Bandara Lokal Aktif"`.
   - Jika daerah tidak memiliki bandara $\rightarrow$ Tampilkan notifikasi: `"Wilayah ini dilayani oleh bandara terdekat di provinsi yang sama"`, peta menampilkan rute/jarak ke bandara terdekat, dan pin bandara tetangga tersorot.
3. **Interaktivitas**:
   - Klik pin bandara membuka popup ringkasan.
   - Tombol eksternal: `[Buka di Google Maps ↗]` mengarah ke `https://www.google.com/maps/search/?api=1&query={lat},{lng}`.

---

### B. Widget 14 (Chart 10.0): Heatmap Matriks Kejadian & Status Darurat Bencana (BNPB)

#### 1. Tujuan & Nilai Bisnis
Menampilkan pola temporal musiman kejadian bencana dan rekaman penetapan status keadaan darurat resmi oleh BNPB/Pemerintah Daerah untuk memitigasi risiko investasi dan mengukur resiliensi wilayah.

#### 2. Penempatan UI
- **Halaman**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html)
- **Tab**: **Tab Profil Wilayah** (`#tab-wilayah`)
- **Seksi**: Sub-seksi baru *"Matriks Kejadian & Status Darurat Bencana"* (di samping data iklim/curah hujan).

#### 3. Variabel Data yang Dibutuhkan
| Variabel | Tipe | Contoh Nilai | Keterangan |
|:---|:---|:---|:---|
| `jenis_bencana` | String | `"Banjir"`, `"Karhutla"`, `"Tanah Longsor"`, `"Puting Beliung"`, `"Gempa Bumi"`, `"Kekeringan"` | Kategori bencana resmi BNPB |
| `bulan` | Integer (1–12) | `1` s.d. `12` | Bulan kejadian/penetapan (Jan–Des) |
| `jumlah_kejadian` | Integer | `5` | Frekuensi kejadian pada bulan tsb |
| `status_darurat` | String | `"Siaga Darurat"`, `"Tanggap Darurat"`, `"Transisi ke Pemulihan"` | Status legal SK |
| `no_sk` | String | `"SK.BUP/360/45/2025"` | Nomor Surat Keputusan resmi |
| `skala_bencana` | String | `"Kabupaten/Kota"` / `"Provinsi"` | Tingkatan komando darurat |
| `tgl_mulai` | String (YYYY-MM-DD) | `"2025-01-05"` | Tanggal mulai berlaku SK |
| `tgl_berakhir` | String (YYYY-MM-DD) | `"2025-01-19"` | Tanggal berakhir masa status |
| `keterangan` | String | `"Luapan Sungai Sampanahan"` | Narasi singkat penyebab |

#### 4. Bentuk Visual & Interaktivitas
1. **Heatmap Matriks (Apache ECharts)**:
   - Sumbu X: 12 Bulan (`Jan`, `Feb`, `Mar`, `Apr`, `Mei`, `Jun`, `Jul`, `Agu`, `Sep`, `Okt`, `Nov`, `Des`).
   - Sumbu Y: 6–8 Jenis Bencana.
   - Nilai Sel: Jumlah kejadian/SK darurat.
   - Skala Warna:
     - `0`: `#F8FAFC` (Netral / Abu sangat terang)
     - `1–2`: `#FED7AA` (Rendah / Jingga muda)
     - `3–5`: `#F97316` (Sedang / Oranye)
     - `> 5`: `#DC2626` (Tinggi / Merah menyala)
2. **Ringkasan Indikator (KPI Cards di atas Heatmap)**:
   - Total Penetapan Status Darurat (Tahun Berjalan)
   - Bencana Paling Sering Terjadi (*Most Frequent Disaster*)
   - Bulan dengan Frekuensi Tertinggi (*Peak Month*)
3. **Drilldown Modal Interaktif**:
   - Pengguna mengeklik salah satu sel heatmap (misal: "Banjir" di bulan "Desember").
   - Muncul panel slide/modal yang menampilkan tabel rincian SK:
     - Nomor SK, Tanggal Berlaku, Status Keadaan Darurat, Skala, dan Keterangan Resmi.

---

### C. Widget 15 (Chart 14.0): 100% Stacked Bar Chart Kualitas Kondisi Jalan

#### 1. Tujuan & Nilai Bisnis
Menampilkan proporsi kualitas jalan (kondisi Baik, Sedang, dan Rusak) di kabupaten/kota terpilih untuk mengukur kesiapan infrastruktur logistik darat serta mengidentifikasi prioritas perbaikan jalan.

#### 2. Penempatan UI
- **Halaman**: [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html)
- **Tab**: **Tab Profil Wilayah** (`#tab-wilayah`) atau **Tab Deck Investasi** (Pilar P2: Infrastruktur & Spasial).

#### 3. Variabel Data yang Dibutuhkan
| Variabel | Tipe | Contoh Nilai | Keterangan |
|:---|:---|:---|:---|
| `kabkota` | String | `"KABUPATEN KOTABARU"` | Identitas daerah |
| `kewenangan` | String | `"Jalan Kabupaten"` / `"Jalan Provinsi"` | Klasifikasi status jalan |
| `panjang_baik_km` | Float | `412.5` | Panjang jalan kondisi baik (km) |
| `panjang_sedang_km` | Float | `230.1` | Panjang jalan kondisi sedang (km) |
| `panjang_rusak_km` | Float | `185.4` | Panjang jalan kondisi rusak (km) |
| `total_panjang_km` | Float | `828.0` | Total panjang jaringan jalan (km) |
| `persen_mantap` | Float | `77.6%` | Jalan mantap = (Baik + Sedang) / Total |

#### 4. Bentuk Visual & Interaktivitas
1. **100% Stacked Bar Chart Horizontal (Apache ECharts)**:
   - 3 Segmen Warna Standar PUPR / Perhubungan:
     - Hijau Emerald (`#10B981`): Kondisi Baik
     - Kuning Amber (`#F59E0B`): Kondisi Sedang
     - Merah Coral (`#EF4444`): Kondisi Rusak (Rusak Ringan + Rusak Berat)
   - Batang 1: Daerah Terpilih (100%)
   - Batang 2: Rata-rata Provinsi (sebagai benchmark pembanding)
   - Batang 3: Rata-rata Nasional (opsional benchmark)
2. **KPI Header**:
   - Tingkat Kemantapan Jalan (Persentase Mantap %)
   - Total Panjang Jalan (km)
3. **Tooltip Informatif**:
   - Saat kursor diarahkan ke segmen warna: menampilkan panjang riil (km) dan persentase kontribusi terhadap total jalan daerah.

---

## 3. Rencana Arsitektur Berkas & Modularisasi Data

Untuk mencegah berkas utama `Profil.js` membengkak (*monolithic anti-pattern*), seluruh data dan visualisasi Fase 4 dibagi ke dalam modul terpisah:

```
mockup/
├── assets/
│   ├── js/
│   │   ├── data/
│   │   │   ├── bandara-data.js        # Dataset Geo & Atribut Bandara se-Indonesia (~280 bandara)
│   │   │   ├── bnpb-darurat-data.js   # Dataset Matriks Rekap Status Darurat BNPB 2025
│   │   │   └── jalan-data.js          # Dataset Kondisi Jalan Kab/Kota (Baik, Sedang, Rusak)
│   │   └── core/
│   │       ├── Profil.js              # Integrasi controller pemanggil fungsi render
│   │       └── ProfilFase4.js         # (Opsional) Modul fungsi render khusus Fase 4
```

### Contoh Format Skema Berkas Data

#### 1. `assets/js/data/bandara-data.js`
```javascript
window.AIRPORT_DATA = [
  {
    id: "KBU",
    nama: "Bandara Gusti Sjamsir Alam",
    iata: "KBU",
    icao: "WAOK",
    kabkota: "KABUPATEN KOTABARU",
    prov: "KALIMANTAN SELATAN",
    lat: -3.2986,
    lng: 116.1647,
    kelas: "Kelas II",
    pengelola: "UPT Ditjen Perhubungan Udara",
    layanan: "Domestik",
    tkbn: "Ya",
    runway: "1650 x 30 m"
  },
  {
    id: "BDJ",
    nama: "Bandara Internasional Syamsudin Noor",
    iata: "BDJ",
    icao: "WAOO",
    kabkota: "KOTA BANJARBARU",
    prov: "KALIMANTAN SELATAN",
    lat: -3.4422,
    lng: 114.7578,
    kelas: "Kelas I Utama",
    pengelola: "PT Angkasa Pura Indonesia",
    layanan: "Domestik & Internasional",
    tkbn: "Ya",
    runway: "2500 x 45 m"
  }
];
```

#### 2. `assets/js/data/bnpb-darurat-data.js`
```javascript
window.BNPB_DISASTER_DATA = {
  "346": {
    kabkota: "KOTABARU",
    total_sk: 3,
    bencana_utama: "Banjir & Gelombang Pasang",
    bulan_kritis: "Desember",
    // Matriks: [x_bulan (0=Jan..11=Des), y_jenis (0..5), frekuensi]
    matrix: [
      [0, 0, 2], [5, 2, 1], [11, 0, 3], [11, 4, 1]
    ],
    sk_records: [
      {
        no_sk: "SK.BUP/360/12/2025",
        jenis: "Banjir",
        bulan: 12,
        status: "Tanggap Darurat",
        skala: "Kabupaten/Kota",
        tgl_mulai: "2025-12-10",
        tgl_berakhir: "2025-12-24",
        keterangan: "Banjir rob dan luapan DAS Sampanahan"
      }
    ]
  }
};
```

#### 3. `assets/js/data/jalan-data.js`
```javascript
window.ROAD_QUALITY_DATA = {
  "346": {
    kabkota: "KOTABARU",
    total_km: 842.6,
    baik_km: 450.2,
    sedang_km: 212.4,
    rusak_km: 180.0,
    mantap_persen: 78.6,
    benchmark_prov_mantap: 74.2
  }
};
```

---

## 4. Rencana Kerja Bertahap (Sprint Checkpoint Fase 4)

| Checkpoint | Target Komponen | Deliverable & Output | Estimasi |
|:---|:---|:---|:---:|
| **CP-F4-01** | Penyiapan Skema Dataset | Pembuatan berkas `bandara-data.js`, `bnpb-darurat-data.js`, `jalan-data.js` dari referensi Kemenhub, BNPB, dan BPS. | 1 Hari |
| **CP-F4-02** | Widget 13: Peta Sebaran Bandara | Mini interactive map Leaflet dengan pin bandara + kartu metadata teknis bandara di Tab Profil Wilayah. | 1.5 Hari |
| **CP-F4-03** | Widget 14: Heatmap Bencana BNPB | Chart ECharts Heatmap 12 Bulan x Jenis Bencana + modal popup detail SK Darurat BNPB. | 1.5 Hari |
| **CP-F4-04** | Widget 15: 100% Stacked Bar Jalan | Visualisasi kondisi jalan (Baik, Sedang, Rusak) + KPI kemantapan jalan daerah vs benchmark provinsi. | 1 Hari |
| **CP-F4-05** | Integrasi UI & Responsivitas | Penataan layout responsif di desktop, tablet, dan smartphone pada Tab Wilayah [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html). | 0.5 Hari |
| **CP-F4-06** | Browser Subagent Testing | Pengujian fungsionalitas tombol, hover tooltip, bebas regresi, dan validasi console error. | 0.5 Hari |

---

## 5. Kriteria Penerimaan (*Acceptance Criteria* / DoD)

Widget Fase 4 dinyatakan **SELESAI (DONE)** bila memenuhi syarat berikut:
1. **Zero Console Error**: Tidak ada error JS atau warning saat tab Profil Wilayah dibuka di browser.
2. **Kesesuaian Tema (Antislop UI)**: Kontainer kartu widget 100% mengikuti latar belakang putih (`#FFFFFF`) dan permukaan abu muda (`var(--surface)` / `#f8fafc`).
3. **Data Tooltip Presisi**: Format mata uang, jarak (km), dan angka statistik menggunakan pemisah ribuan standar Indonesia (`id-ID`).
4. **Fallback Handling**: Daerah tanpa bandara tidak merusak tampilan (*graceful degradation* menampilkan bandara hub terdekat).
5. **Responsif**: Tampilan grid tidak pecah (*overflow*) pada viewport layar 1366px, 1536px, maupun mobile 375px.
