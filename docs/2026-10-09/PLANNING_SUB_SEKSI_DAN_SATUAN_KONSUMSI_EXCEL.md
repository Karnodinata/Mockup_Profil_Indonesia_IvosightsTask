# Master Plan: Penataan Sub-Seksi & Satuan Komoditas Konsumsi BPS Berdasarkan Header Excel

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Lokasi File** | `docs/PLANNING_SUB_SEKSI_DAN_SATUAN_KONSUMSI_EXCEL.md` |
| **Sumber Data Mentah** | `data-mentah/xlsx/Merge Konsumsi 2023.xlsx` (Susenas BPS 2023) |
| **Modul Terdampak** | Profil Wilayah (`profil.html`), Script ETL (`scripts/build_konsumsi_data.py`), Controller (`Profil.js`), Dataset (`konsumsi-data.json` & `konsumsi-data.js`) |
| **Tanggal Penyusunan** | 09 Oktober 2026 |
| **Status** | Draf Perencanaan Teknis Siap Eksekusi (Opsi B: 1 Kartu Multi Sub-Seksi) |

---

## 1. Latar Belakang & Identifikasi Masalah

Berdasarkan tinjauan data dan masukan supervisor/atasan:
> *"itu keterangan satuannya ada di header yaa ga"*  
> *"itu yang di dalem kurung gaa"*

### Akar Masalah pada Data Saat Ini
1. **Kurung Ganda di Header Excel:**
   Pada sheet `Padi Padian`, kolom `Beras(Beras Lokal, Kualitas Unggul, Impor) (Ton) Tahunan` memiliki dua set tanda kurung. Script parser regex awal keliru menangkap kurung pertama (`Beras Lokal, Kualitas Unggul, Impor`) sebagai satuan, bukan kurung kedua `(Ton)`.
2. **Komoditas Campuran dengan Satuan Berbeda dalam Satu Sheet:**
   Beberapa sheet BPS menggabungkan komoditas berbeda jenis dalam 1 kategori (misalnya: **Telur & Susu**, **Minyak & Kelapa**, **Rokok & Tembakau**).
   * **Telur:** Menggunakan satuan `(Butir)`
   * **Susu:** Menggunakan satuan `(Kotak Kecil 250 Ml)`, `(Kaleng 397 Gr)`, dan `(Ton)`
   Jika dipaksakan menjadi satu angka total volume tunggal (misal `39,4 Jt Butir/th`), data konsumsi susu menjadi terabaikan atau salah satuan.

### Solusi yang Disepakati (Opsi B)
Mempertahankan format **14 Kelompok Kartu Komoditas Standar Susenas**, namun untuk kartu yang memiliki satuan campuran, kartu tersebut dibagi menjadi **Sub-Seksi Terpisah** di mana setiap item dan sub-header menampilkan satuan persis sesuai tanda kurung di header Excel.

---

## 2. Audit Lengkap Satuan per Sheet di `Merge Konsumsi 2023.xlsx`

Berikut hasil audit 185 kolom komoditas dari 14 sheet Susenas:

### A. Kategori Campuran / Heterogen (Wajib Sub-Seksi)

#### 1. Sheet `Telur & Susu` (9 Kolom Komoditas)
* **Sub-Seksi 1: Telur** *(Header Excel bertanda kurung `(Butir)`)*:
  * `Telur Ayam Ras (Butir) Tahunan` &rarr; Satuan: **Butir**
  * `Telur Ayam Kampung (Butir) Tahunan` &rarr; Satuan: **Butir**
  * `Telur Itik/Telur Itik Manila (Butir) Tahunan` &rarr; Satuan: **Butir**
  * `Telur Lainnya (Telur Puyuh, Telur Asin, dll.) (Butir) Tahunan` &rarr; Satuan: **Butir**
  * *Sub-Total Volume:* `... Juta Butir/tahun`
* **Sub-Seksi 2: Susu & Produk Olahan** *(Header Excel bertanda kurung `(Kotak)`, `(Kaleng)`, `(Ton)`)*:
  * `Susu Cair Pabrik (Kotak Kecil 250 Ml) Tahunan` &rarr; Satuan: **Kotak**
  * `Susu Kental Manis (Kaleng 397 Gr) Tahunan` &rarr; Satuan: **Kaleng**
  * `Susu Bubuk (Ton) Tahunan` &rarr; Satuan: **Ton**
  * `Susu Bubuk Bayi (Ton) Tahunan` &rarr; Satuan: **Ton**
  * `Susu Lainnya Dan Hasil Dari Susu (Ton) Tahunan` &rarr; Satuan: **Ton**

#### 2. Sheet `Minyak` (4 Kolom Komoditas)
* **Sub-Seksi 1: Minyak Goreng & Nabati** *(Header Excel bertanda kurung `(Liter)`)*:
  * `Minyak Goreng (Kelapa Sawit, Bunga Matahari) (Liter) Tahunan` &rarr; Satuan: **Liter**
  * `Minyak Kelapa (Liter) Tahunan` &rarr; Satuan: **Liter**
  * *Sub-Total Volume:* `... Liter/tahun`
* **Sub-Seksi 2: Kelapa Butiran & Lainnya**:
  * `Kelapa (Tidak Termasuk Santan Instan) (Butir) Tahunan` &rarr; Satuan: **Butir**
  * `Minyak Dan Kelapa Lainnya Tahunan` &rarr; Satuan: **Ton**

#### 3. Sheet `Sayur` (26 Kolom Komoditas)
* **Sub-Seksi 1: Sayuran Segar** *(Header Excel bertanda kurung `(Ton)`)*:
  * 24 komoditas (Bayam, Kangkung, Kol, Wortel, Cabe Merah, Bawang Merah, dll.) &rarr; Satuan: **Ton**
  * *Sub-Total Volume:* `... Ton/tahun`
* **Sub-Seksi 2: Bahan Racikan Sayur Siap Masak** *(Header Excel bertanda kurung `(Paket) (Bungkus)`)*:
  * `Bahan Sayur Asam Lodeh (Paket) (Bungkus) Tahunan` &rarr; Satuan: **Paket/Bungkus**
  * `Bahan Sayur Sop/Cap Cay/Kimlo (Paket) (Bungkus) Tahunan` &rarr; Satuan: **Paket/Bungkus**

#### 4. Sheet `Rokok` (5 Kolom Komoditas)
* **Sub-Seksi 1: Rokok Konsumsi Jadi** *(Header Excel bertanda kurung `(Batang)`)*:
  * `Rokok Kretek Filter (Batang) Tahunan` &rarr; Satuan: **Juta Batang**
  * `Rokok Kretek Tanpa Filter (Batang) Tahunan` &rarr; Satuan: **Juta Batang**
  * `Rokok Putih (Batang) Tahunan` &rarr; Satuan: **Juta Batang**
  * *Sub-Total Volume:* `... Juta Batang/tahun`
* **Sub-Seksi 2: Tembakau Mentah / Lainnya**:
  * `Tembakau (Ton) Tahunan` &rarr; Satuan: **Ton**
  * `Rokok Dan Tembakau Lainnya Tahunan` &rarr; Satuan: **Ton**

#### 5. Sheet `Bhn Makanan` (3 Kolom Komoditas)
* `Mie Instan (Bungkus 80 Gr) Tahunan` &rarr; Satuan: **Bungkus**
* `Kerupuk (Ton) Tahunan` &rarr; Satuan: **Ton**
* `Bubur Bayi (Kotak Kecil 150 Gr) Tahunan` &rarr; Satuan: **Kotak**

#### 6. Sheet `Bhn Minuman` (7 Kolom Komoditas)
* **Bahan Pokok (Ton):** `Gula Pasir (Ton)`, `Gula Merah (Ton)`, `Teh Bubuk (Ton)`, `Kopi Bubuk (Ton)`
* **Kemasan Sachet:** `Teh Celup (Sachet) (2 Gram)`, `Kopi Instan (Sachet) (20 Gram)`

---

### B. Kategori Homogen (Satuan Konsisten `Ton/th`)
Kelompok-kelompok berikut seluruh kolomnya konsisten bersatuan **Ton**, sehingga tetap menggunakan format 1 kartu dengan 1 total volume standar:
1. **🌾 Padi-Padian** (6 komoditas: Beras, Jagung, Tepung Terigu, Ketan, dll.)
2. **🥔 Umbi-Umbian** (7 komoditas: Singkong, Ubi Jalar, Kentang, Talas, Sagu, dll.)
3. **🐟 Ikan-Ikanan** (40 komoditas: Ekor Kuning, Tongkol, Bandeng, Udang, dll.)
4. **🥩 Daging** (9 komoditas: Sapi, Ayam Ras, Ayam Kampung, Kambing, dll.)
5. **🥜 Kacang-Kacangan** (7 komoditas: Tempe, Tahu, Kacang Tanah, Kedelai, dll.)
6. **🍎 Buah-Buahan** (15 komoditas: Jeruk, Salak, Mangga, Pisang, Apel, dll.)
7. **🌶️ Bumbu-Bumbuan** (15 komoditas: Garam, Kemiri, Merica, Jahe, Kunyit, dll.)

---

## 3. Rencana Arsitektur Skema Data (JSON Structure)

Di file `konsumsi-data.json`, setiap grup yang memiliki sub-seksi akan diperkaya dengan properti `sub_groups`:

```json
{
  "Telur & Susu": {
    "id": "telur_susu",
    "label": "Telur & Susu",
    "icon": "🥚",
    "has_subgroups": true,
    "all_items_count": 9,
    "sub_groups": [
      {
        "sub_id": "telur",
        "sub_label": "Telur",
        "sub_icon": "🥚",
        "unit": "Butir/th",
        "total_volume": 39435429.0,
        "items": [
          { "name": "Telur Ayam Ras", "val": 34890440.0, "unit": "Butir" },
          { "name": "Telur Lainnya", "val": 2814130.0, "unit": "Butir" },
          { "name": "Telur Itik", "val": 1015402.0, "unit": "Butir" },
          { "name": "Telur Ayam Kampung", "val": 715457.0, "unit": "Butir" }
        ]
      },
      {
        "sub_id": "susu",
        "sub_label": "Susu & Olahan",
        "sub_icon": "🥛",
        "unit": "Kotak / Kaleng / Ton",
        "total_volume": null,
        "items": [
          { "name": "Susu Cair Pabrik", "val": 787012.0, "unit": "Kotak" },
          { "name": "Susu Kental Manis", "val": 321954.0, "unit": "Kaleng" },
          { "name": "Susu Bubuk & Lainnya", "val": 834.7, "unit": "Ton" }
        ]
      }
    ]
  }
}
```

---

## 4. Rencana Desain Antarmuka Visual (UI Component Mockup)

Komponen card pada Tab Konsumsi `profil.html` dirancang fleksibel:

### A. Tampilan Kartu dengan Sub-Seksi (Contoh: Telur & Susu)
```text
┌────────────────────────────────────────────────────────┐
│ 🥚 Telur & Susu                                 9 item │
│                                                        │
│  🥚 Telur                               39,4 Jt Butir  │
│  ├─ Telur Ayam Ras .................... 34,9 Jt Butir   │
│  ├─ Telur Lainnya .....................  2,8 Jt Butir   │
│  └─ Telur Itik ........................  1,0 Jt Butir   │
│ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ │
│  🥛 Susu & Olahan                         Produk Dairy │
│  ├─ Susu Cair Pabrik .................. 787 rb Kotak   │
│  ├─ Susu Kental Manis ................. 322 rb Kaleng  │
│  └─ Susu Bubuk & Bayi .................     835 Ton    │
└────────────────────────────────────────────────────────┘
```

### B. Styling CSS yang Ditambahkan
* `.gc-sub-header`: Pembatas tipis dengan icon dan sub-judul berwarna tematik.
* `.gc-sub-vol`: Teks angka tebal dengan satuan berukuran kecil (`font-size: 10px; font-family: var(--mono)`).
* `.gc-sub-item`: Format baris flexbox rata kiri (nama) dan rata kanan (angka + satuan).

---

## 5. Rencana Eksekusi Bertahap (Action Plan)

1. **Tahap 1: Ekstensi Skema ETL di `scripts/build_konsumsi_data.py`**
   * Tambahkan aturan pemecahan sub-seksi untuk sheet `Telur & Susu`, `Minyak`, `Rokok`, `Sayur`, `Bhn Makanan`, dan `Bhn Minuman`.
   * Ekstrak teks kurung satuan secara presisi dari header kolom.
2. **Tahap 2: Eksekusi Build Data**
   * Jalankan `python scripts/build_konsumsi_data.py`.
   * Validasi integritas JSON untuk seluruh 514 kabupaten & kota.
3. **Tahap 3: Modifikasi Renderer di `Profil.js` & `profil.html`**
   * Perbarui template generator pada `renderKonsumsi()`.
   * Tambahkan penanganan dinamis: jika `grpData.has_subgroups == true`, render layout sub-seksi; jika tidak, render layout standar single volume.
4. **Tahap 4: Verifikasi & Uji Tampilan**
   * Cek langsung di browser pada Kabupaten Bireuen dan beberapa daerah lain untuk memastikan visual bersih, responsif, dan akurat 100%.
