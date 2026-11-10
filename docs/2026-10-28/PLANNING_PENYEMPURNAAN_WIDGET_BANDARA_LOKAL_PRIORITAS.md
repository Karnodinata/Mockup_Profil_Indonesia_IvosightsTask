# Rencana Teknis & Spesifikasi Penyempurnaan Widget Bandara (Chart 9.0)
**Tanggal**: 28 Oktober 2026  
**Dokumen Rujukan**: [`docs/261026/Charts9-10-14.md`](file:///c:/laragon/www/PKL/mockup/docs/261026/Charts9-10-14.md) & [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L3185-L3410)  
**Target File**:
1. [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js)
2. [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html)
3. [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css)

---

## 1. Analisis Kritis & Masalah Saat Ini

### Kelemahan Eksisting:
1. **Seleksi Array Buta (`filtered[0]`)** `[High confidence]`
   - Pada baris 3388-3390 di [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L3388-L3390):
     ```javascript
     if (filtered[0]) {
         selectBandara(filtered[0], null);
     }
     ```
   - Akibatnya, saat pengguna membuka profil **Kabupaten Kotabaru** (Kalsel), panel detail kanan otomatis menampilkan **Bandara Syamsudin Noor (Kota Banjarbaru)** hanya karena Banjarbaru berada di indeks pertama daftar array. Padahal Kotabaru memiliki bandaranya sendiri yaitu **Bandara Gusti Sjamsir Alam (KBU)**.
2. **Ketiadaan Label Konteks Hubungan Wilayah** `[High confidence]`
   - Pengguna tidak diberi tahu apakah bandara yang terpilih itu berada di dalam wilayah kabupaten aktifnya sendiri atau merupakan bandara transit/tetangga di luar daerah.
3. **Ketiadaan Logika "Nearest Hub" untuk Daerah Tanpa Bandara** `[Medium confidence]`
   - Untuk 267 kabupaten/kota yang tidak memiliki bandara (misal: *Kabupaten Banjar* atau *Kota Banda Aceh*), sistem memilih bandara pertama di provinsi tanpa memperhitungkan mana bandara yang secara geografis paling dekat dengan daerah tersebut.

---

## 2. Solusi Teknis & Algoritma Seleksi Pintar

### A. Algoritma 2-Tingkat Seleksi Default (*Smart Local-First Selection*)
Ketika provinsi aktif dimuat dalam fungsi `updateBandaraView(chosenProv)`:

```mermaid
flowchart TD
    Start[Load Bandara se-Provinsi] --> CheckLocal{Apakah ada bandara di Kab/Kota aktif?}
    CheckLocal -- Ya --> SelectLocal[Pilih Bandara Lokal Aktif]
    SelectLocal --> BadgeLocal[Badge: 'Bandara Wilayah Ini']
    CheckLocal -- Tidak --> CalcDistance[Hitung Jarak Haversine ke Semua Bandara Provinsi]
    CalcDistance --> SelectNearest[Pilih Bandara dengan Jarak Terdekat / Minimum]
    SelectNearest --> BadgeNearest[Badge: 'Bandara Akses Terdekat (~XX km)']
    BadgeLocal --> RenderUI[Render Panel Detail & Sorot Pin di Peta]
    BadgeNearest --> RenderUI
```

#### Detail Logika Pencocokan Lokal:
1. Normalisasi nama kabupaten/kota profil aktif:
   ```javascript
   const cleanTargetKab = (r.kabkota || '')
       .toUpperCase()
       .replace(/^(KABUPATEN|KOTA)\s+/, '')
       .trim();
   ```
2. Cari bandara yang kolom `kabupaten`-nya cocok:
   ```javascript
   let targetBandara = filtered.find(b => {
       const bKab = (b.kabupaten || '').toUpperCase().replace(/^(KABUPATEN|KOTA)\s+/, '').trim();
       return bKab === cleanTargetKab || bKab.includes(cleanTargetKab) || cleanTargetKab.includes(bKab);
   });
   let isLocal = !!targetBandara;
   ```
3. Jika tidak ditemukan (`!targetBandara`):
   ```javascript
   // Cari bandara dengan jarak haversine terdekat terhadap r.lat & r.lng
   if (r.lat && r.lng) {
       let minDist = Infinity;
       filtered.forEach(b => {
           if (typeof b.lat === 'number' && typeof b.lng === 'number') {
               const d = haversineDistance(b.lat, b.lng, r.lat, r.lng);
               if (d < minDist) {
                   minDist = d;
                   targetBandara = b;
               }
           }
       });
   }
   if (!targetBandara) targetBandara = filtered[0];
   ```

---

## 3. Penyempurnaan Visual & UI Antislop

### A. Penambahan Status Badge di Panel Kanan
Di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) pada `#bandaraDetailContent`:
Tambahkan elemen badge:
```html
<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
  <span id="bdScopeBadge" class="status-pill" style="font-size:10px;padding:3px 9px;font-weight:700">Bandara Lokal</span>
</div>
```
- **Jika Bandara Lokal**: Badge hijau/teal (`#ecfdf5`, border `#a7f3d0`, text `#065f46`), label: `✓ Bandara Wilayah Ini`.
- **Jika Bandara Regional**: Badge biru/slate soft (`#eff6ff`, border `#bfdbfe`, text `#1e40af`), label: `✈ Bandara Akses Terdekat (~XX.X km)`.

### B. Keterangan Kontekstual Dinamis
Jika wilayah tidak punya bandara sendiri, teks deskripsi di kartu detail menambahkan kalimat:
> *"Wilayah [Nama Kab/Kota] tidak memiliki bandara komersial sendiri. Akses penerbangan udara utama dilayani melalui [Nama Bandara] di [Kabupaten Lokasi]."*

### C. Penandaan Visual Pin di Peta Leaflet
- Pin bandara lokal diberi warna teal tua (`#0d9488`) atau ring emas, sedangkan bandara lain tetap biru (`#2563eb`).
- Marker pin lokal otomatis disorot saat peta pertama kali dibuka.

---

## 4. Rencana Eksekusi Bertahap

| No | Langkah | Target File | Output |
|:---|:---|:---|:---|
| 1 | Tambah elemen `#bdScopeBadge` pada detail panel | [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) | Struktur HTML siap menampung badge status |
| 2 | Tambah styling CSS token antislop untuk badge | [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css) | `.bandara-badge-local` & `.bandara-badge-nearest` |
| 3 | Perbarui fungsi `selectBandara` dan `updateBandaraView` | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | Logika Local-First & Nearest Fallback aktif |
| 4 | Verifikasi Browser Subagent pada 3 Skenario Kasus | Browser | Kotabaru (lokal), Barito Utara (lokal), Banjar (nearest) |

---

## 5. Matriks Kasus Uji Verifikasi

1. **Kasus A: Daerah Memiliki Bandara Lokal**
   - **Target**: `id=346` (*Kabupaten Kotabaru, Kalimantan Selatan*)
   - **Ekspektasi**: Peta otomatis memilih dan membuka detail **Bandara Gusti Sjamsir Alam (KBU)** dengan badge hijau `✓ Bandara Wilayah Ini`.
2. **Kasus B: Daerah Lain Memiliki Bandara Lokal**
   - **Target**: `id=335` (*Kabupaten Barito Utara, Kalimantan Tengah*)
   - **Ekspektasi**: Peta otomatis memilih dan membuka detail **Bandara Haji Muhammad Sidik (HMS)** dengan badge hijau `✓ Bandara Wilayah Ini`.
3. **Kasus C: Daerah TIDAK Memiliki Bandara Lokal**
   - **Target**: `id=340` (*Kabupaten Banjar, Kalimantan Selatan*)
   - **Ekspektasi**: Peta otomatis memilih **Bandara Syamsudin Noor (BDJ)** di Banjarbaru sebagai bandara terdekat dengan badge biru `✈ Bandara Akses Terdekat (~XX km)`.
