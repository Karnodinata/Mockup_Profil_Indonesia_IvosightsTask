# Dokumen Perencanaan Teknis: Perbaikan Filter Header Wilayah & Persistensi Poligon Peta Choropleth

**Tanggal:** 28 Oktober 2026  
**Folder Arsip:** `docs/281026/`  
**Target Modul:** `assets/js/core/Map.js` & `index.html` (Mode Profil Statistik Daerah)  
**Status:** SELESAI DIIMPLEMENTASIKAN & TERVERIFIKASI (Testing TC-01 s/d TC-06 Lulus)  

---

## 1. Latar Belakang & Pernyataan Masalah

### 1.1 Masalah yang Ditemukan
Pada antarmuka utama (`index.html`) mode **Profil Daerah**, terdapat dua kontrol navigasi wilayah:
1. **Kotak Pencarian (`#searchInput`)**: Pengguna mencari nama kabupaten/kota secara langsung (misal: "Kota Serang"). Kamera peta melakukan `flyToBounds` ke Kota Serang dengan padding drawer kanan, dan drawer rincian daerah terbuka. **Ketika pengguna melakukan zoom out, seluruh poligon/arsiran kabupaten/kota lain di seluruh Indonesia tetap utuh dan berwarna.**
2. **Filter Header Cascading (`#profilProvSelect` & `#profilCitySelect`)**: Pengguna memilih Provinsi "BANTEN", lalu memilih Kab/Kota "KOTA SERANG". Kamera peta melakukan zoom ke Kota Serang dengan benar. **Namun, ketika pengguna melakukan zoom out, seluruh poligon kabupaten/kota lain di luar Provinsi Banten lenyap (hilang dari peta), menyisakan kanvas basemap kosong.**

### 1.2 Dampak UX
- Pengalaman pengguna menjadi terfragmentasi dan inkonsisten antara fitur Search dan Filter Dropdown.
- Pengguna kehilangan konteks spasial nasional saat mengeksplorasi wilayah melalui dropdown.
- Peta terlihat "rusak" atau tidak lengkap ketika pengguna melakukan zoom out setelah memilih daerah via dropdown.

---

## 2. Root Cause Analysis (Analisis Akar Masalah Teknis)

> [!IMPORTANT]
> **Tingkat Kepastian Temuan:** [High confidence - Terverifikasi langsung pada kode sumber `assets/js/core/Map.js` baris 941–945 dan baris 1576–1598].

### 2.1 Pemotongan Array Fitur GeoJSON di `createOrUpdateMarkers()`
Di dalam `assets/js/core/Map.js` baris 941–945:
```javascript
// --- RENDER POLIGON KABUPATEN/KOTA (GEOJSON AVAILABLE) ---
if (allGeoJsonFeatures.length > 0) {
    const displayFeatures = filterProv
        ? allGeoJsonFeatures.filter(f => f.properties && sameProvName(f.properties.COUNTRY, filterProv))
        : allGeoJsonFeatures;
```

Ketika pengguna memilih Provinsi (contoh: "Banten"):
1. Dropdown memicu event listener `profilProvSelect.addEventListener('change')` ([Map.js:478](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js#L478)).
2. Variabel `filterProv = 'BANTEN'` di-set, lalu memanggil `applyFilters()`.
3. `applyFilters()` memanggil `createOrUpdateMarkers()`.
4. Di awal fungsi, `geojsonLayerGroup.clearLayers()` menghapus seluruh poligon yang ada di peta.
5. Karena `filterProv` bernilai `'BANTEN'`, variabel `displayFeatures` memotong array `allGeoJsonFeatures` (514 kabupaten/kota) menjadi hanya ~8 kabupaten/kota yang berada di Banten.
6. Sebanyak **506 poligon daerah lain di 37 provinsi seluruh nusantara dibuang dari layer peta**.
7. Ketika pengguna memilih "Kota Serang" via `#profilCitySelect`, kamera zoom ke Serang. Namun ketika pengguna memutar scroll wheel untuk zoom out, layer Leaflet memang hanya memiliki poligon Provinsi Banten saja.

### 2.2 Mengapa Fitur Search Tidak Mengalami Bug Ini?
Pada event click hasil pencarian ([Map.js:1576–1598](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js#L1576-L1598)):
```javascript
focusRegionMap(target);
selectRegion(target);
```
Di dalam fungsi `selectRegion(target)` ([Map.js:1340–1343](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js#L1340-L1343)):
```javascript
if (region.prov && profilProvSelect) {
    profilProvSelect.value = region.prov;
    syncHeaderFilterCities(region.prov, regId);
}
```
Fungsi `selectRegion` menyelaraskan teks pada dropdown `#profilProvSelect` dan `#profilCitySelect`, **tetapi tidak mengubah variabel `filterProv` dan tidak memanggil `applyFilters()` atau `createOrUpdateMarkers()`**. Oleh sebab itu, 514 poligon tetap ter-mount utuh di Leaflet.

---

## 3. Analisis Kritis & Konsekuensi Arsitektur (Gotchas)

> [!WARNING]
> Sebelum menerapkan solusi, beberapa kelemahan arsitektur berikut wajib diantisipasi agar tidak memicu regresi:

### 3.1 Perangkap Bounding Box Otomatis (Baris 1032–1034)
Di dalam `createOrUpdateMarkers()` baris 1032:
```javascript
if (filterProv) {
    map.flyToBounds(geoLayer.getBounds(), { padding: [40, 40], duration: 1.0 });
}
```
- **Kelemahan Kritis:** Jika `displayFeatures` diubah menjadi seluruh 514 poligon, maka `geoLayer.getBounds()` akan menjadi batas **SELURUH INDONESIA**.
- Jika baris ini tidak dihapus, maka setiap kali metrik diganti atau filter diaktifkan, peta akan terpental zoom out ke seluruh Indonesia alih-alih fokus ke provinsi terkait.
- **Solusi:** Hapus auto-fly dari dalam `createOrUpdateMarkers()`. Pergerakan kamera harus murni diatur oleh event handler interaksi pengguna (`change` pada dropdown atau `click` pada opsi).

### 3.2 Pemisahan Peran: Analitik vs Geospasial
- Nilai `filterProv` tetap diperlukan untuk menyaring:
  1. **Leaderboard Top/Bottom 5** (`updateLeaderboard(getFilteredData())`): hanya menampilkan peringkat kab/kota dalam provinsi terpilih.
  2. **Context Summary Strip** (`updateNationalSummary(getFilteredData())`): menampilkan teks "Provinsi Banten • 8 Wilayah" dan benchmark rata-rata provinsi.
  3. **Tabel Data BPS** (`renderTable()`): menyaring baris tabel jika user beralih ke mode tabel.
- Oleh karena itu, logika analitis pada `getFilteredData()` **TIDAK BOLEH DIRUSAK**. Yang disesuaikan hanyalah suplai poligon ke Leaflet di `createOrUpdateMarkers()`.

### 3.3 Logika Reset dan Navigasi Dua Arah
- **Skenario 1:** Pengguna memilih Provinsi Banten $\rightarrow$ Kamera terbang ke batas Provinsi Banten. Dropdown Kab/Kota menampilkan "Semua Kab/Kota (8)". Seluruh Indonesia tetap memiliki poligon.
- **Skenario 2:** Pengguna memilih Kota Serang $\rightarrow$ Kamera terbang ke Kota Serang dengan padding drawer (`focusRegionMap(target)`), dan detail drawer terbuka (`selectRegion(target)`).
- **Skenario 3:** Pengguna mengembalikan dropdown Kab/Kota ke "Semua Kab/Kota" $\rightarrow$ Kamera terbang kembali ke batas Provinsi Banten, dan drawer ditutup/di-reset.
- **Skenario 4:** Pengguna mengembalikan dropdown Provinsi ke "Semua Provinsi (38)" $\rightarrow$ Kamera terbang kembali ke skala nasional `[-1.2, 117.5], zoom 5`, dropdown Kab/Kota kembali disabled.

---

## 4. Solusi Teknis & Rencana Perubahan Kode

### 4.1 Modifikasi 1: Persistensi Seluruh Poligon di `createOrUpdateMarkers()`
Lokasi: `assets/js/core/Map.js` (sekitar baris 940–968)
```javascript
// SEBELUM:
const displayFeatures = filterProv
    ? allGeoJsonFeatures.filter(f => f.properties && sameProvName(f.properties.COUNTRY, filterProv))
    : allGeoJsonFeatures;

// SESUDAH:
// Selalu render seluruh 514 fitur GeoJSON agar zoom-out tidak pernah menampilkan kanvas kosong
const displayFeatures = allGeoJsonFeatures;
```

Dan hapus pemanggilan fly bounds otomatis di baris 1032–1034:
```javascript
// HAPUS ATAU KOMENTARI:
// if (filterProv) {
//     map.flyToBounds(geoLayer.getBounds(), { padding: [40, 40], duration: 1.0 });
// }
```

### 4.2 Modifikasi 2: Penyempurnaan Event Listener `#profilProvSelect`
Lokasi: `assets/js/core/Map.js` (sekitar baris 478–498)
```javascript
profilProvSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    filterProv = val;
    if (provFilter) provFilter.value = val;
    if (provSelectLabel) {
        provSelectLabel.textContent = val ? `Provinsi ${val}` : 'Semua Provinsi (Nasional)';
    }
    syncHeaderFilterCities(val);
    applyFilters();

    if (val && allGeoJsonFeatures.length > 0) {
        const provFeatures = allGeoJsonFeatures.filter(f => f.properties && sameProvName(f.properties.COUNTRY, val));
        if (provFeatures.length > 0) {
            const tempLayer = L.geoJSON(provFeatures);
            map.flyToBounds(tempLayer.getBounds(), { padding: [40, 40], duration: 1.0 });
        }
    } else if (!val) {
        map.flyTo([-1.2, 117.5], 5, { duration: 1.0 });
    }
});
```

### 4.3 Modifikasi 3: Penanganan Dropdown `#profilCitySelect`
Lokasi: `assets/js/core/Map.js` (sekitar baris 500–512)
```javascript
if (profilCitySelect) {
    profilCitySelect.addEventListener('change', (e) => {
        const cityId = e.target.value;
        if (!cityId) {
            // User memilih "Semua Kab/Kota": kembalikan kamera ke batas provinsi aktif
            if (filterProv && allGeoJsonFeatures.length > 0) {
                const provFeatures = allGeoJsonFeatures.filter(f => f.properties && sameProvName(f.properties.COUNTRY, filterProv));
                if (provFeatures.length > 0) {
                    const tempLayer = L.geoJSON(provFeatures);
                    map.flyToBounds(tempLayer.getBounds(), { padding: [40, 40], duration: 1.0 });
                }
            }
            return;
        }
        const target = REGION_DATA.find(d => String(d.id || d.no) === String(cityId));
        if (target) {
            const sInp = document.getElementById('searchInput');
            if (sInp) sInp.value = target.kabkota || '';
            focusRegionMap(target);
            selectRegion(target);
        }
    });
}
```

---

## 5. Rencana Pengujian (Test & Verification Plan)

| ID | Kasus Uji | Langkah Aksi | Hasil yang Diharapkan |
|---|---|---|---|
| **TC-01** | Filter Provinsi & Zoom Out | Pilih Provinsi "BANTEN" pada dropdown header. Tunggu kamera zoom ke Banten. Lalu scroll zoom out peta. | Poligon Jawa Barat, DKI Jakarta, Jawa Tengah, Lampung, dan seluruh provinsi lain tetap tampil dengan warna metrik choropleth lengkap dan tidak hilang. |
| **TC-02** | Filter Kab/Kota & Zoom Out | Pilih Provinsi "BANTEN" $\rightarrow$ pilih "KOTA SERANG". Kamera zoom ke Serang dan drawer kanan terbuka. Lalu scroll zoom out peta. | Seluruh nusantara tetap memiliki arsiran poligon dan tooltip HUD yang aktif saat di-hover. |
| **TC-03** | Reset ke "Semua Kab/Kota" | Dalam posisi terpilih Kota Serang, ubah dropdown Kab/Kota kembali ke "Semua Kab/Kota (8)". | Kamera melakukan animasi `flyToBounds` kembali membingkai seluruh Provinsi Banten secara proporsional. |
| **TC-04** | Reset ke "Semua Provinsi" | Ubah dropdown Provinsi kembali ke "Semua Provinsi (38)". | Kamera kembali ke koordinat nasional `[-1.2, 117.5], zoom 5`, dropdown Kab/Kota disabled, Leaderboard menampilkan Top 5 Nasional. |
| **TC-05** | Perubahan Metrik Aktif | Dalam kondisi Provinsi Banten aktif, ganti metrik di sidebar (misal ke "Tingkat Kemiskinan"). | Peta memperbarui warna poligon seluruh Indonesia tanpa merusak atau mereset posisi viewport kamera. |
| **TC-06** | Paritas dengan Search Bar | Cari "Kota Serang" via Search Bar $\rightarrow$ zoom out $\rightarrow$ bandingkan dengan hasil filter dropdown. | Tampilan visual peta, ketebalan border, dan saturasi warna identik 100%. |

---

## 6. Hasil Eksekusi & Verifikasi Browser

Perbaikan telah berhasil diterapkan dan diverifikasi secara langsung melalui pengujian otomatis browser:
1. **Penerapan Kode:**
   - [Map.js](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js): `displayFeatures` diubah menjadi `allGeoJsonFeatures` secara konsisten (seluruh 514 poligon dipertahankan).
   - [Map.js](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js): Hapus perangkap bounding box `map.flyToBounds(geoLayer.getBounds())` di baris render poligon.
   - [Map.js](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js): Tambahkan handling fallback reset pada `#profilCitySelect` dan `#provFilter` agar dapat zoom kembali ke level provinsi saat opsi "Semua Kab/Kota" dipilih.
   - [index.html](file:///c:/laragon/www/PKL/mockup/index.html): Menambahkan cache-buster query string `Map.js?v=281026`.
2. **Hasil Pengujian Browser (TC-01 s/d TC-06):**
   - Pemilihan Provinsi "BANTEN" $\rightarrow$ kamera terbang membingkai Provinsi Banten.
   - Pemilihan "KOTA SERANG" $\rightarrow$ kamera zoom fokus ke Kota Serang dengan padding drawer kanan, dan panel informasi profil daerah terbuka.
   - **Zoom Out Peta:** Seluruh wilayah di luar Banten (DKI Jakarta, Jawa Barat, Jawa Tengah, Jawa Timur, Sumatera/Lampung, dll.) **tetap terarsir lengkap dengan styling choropleth dan tooltip HUD yang berfungsi normal**, 100% konsisten dengan fitur Search Bar.
   - Screenshot bukti pengujian: `zoomed_out_all_regions_1793179104991.png`.
