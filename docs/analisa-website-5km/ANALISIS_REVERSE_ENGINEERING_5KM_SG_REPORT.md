# Analisis Reverse Engineering: 5km.sg.report ("ID Radius 5Km")

**URL Analisis**: `https://5km.sg.report/#nasional`  
**Tanggal Ekstraksi**: 2026-10-28  
**Metode Analisis**: Decompilasi bundle JavaScript klien (`index-B499fS4a.js`), inspeksi style CSS (`index-Dp2bypcy.css`), inspeksi network stream, dan analisis struktur payload GeoJSON/JSON.

---

## 1. Executive Summary

Situs **"ID Radius 5Km"** (`5km.sg.report`) menyajikan peta visualisasi radius 5 km per kecamatan di seluruh Indonesia, berpusat pada desa/kelurahan dengan jumlah penduduk terbanyak.

Secara teknis, situs ini merupakan **Single Page Application (SPA) berbasis Jamstack murni (zero-backend dynamic runtime)**. Situs ini memanfaatkan komputasi di sisi klien (browser) untuk kalkulasi trigonometri bola dan rendering peta berbasis WebGL, dengan data statis yang di-cache di CDN Cloudflare.

---

## 2. Kelemahan & Trade-off Arsitektural (Critical Evaluation)

Sebelum mengadopsi pola dari situs ini ke dalam project mockup profil/peta internal, terdapat beberapa kelemahan kritis yang perlu diperhatikan:

1. **Overhead CPU & Memori Klien pada Wilayah Padat [High confidence]**:
   - Poligon lingkaran 5 km **tidak disimpan sebagai Vector Tiles pre-rendered**, melainkan dikalkulasi secara realtime di thread JavaScript klien lalu disuntikkan ke MapLibre via `map.getSource('circles').setData()`.
   - Pada provinsi dengan ribuan kecamatan (contoh: Jawa Timur dengan 1.705 lingkaran atau Jawa Barat dengan 1.398 lingkaran), browser harus memproses $1.700 \times 72 = 122.400$ titik koordinat poligon. Pada perangkat mobile berdaya rendah, ini memicu stutter dan frame drop signifikan.
2. **Hack Filter Raster OSM untuk Dark Mode [High confidence]**:
   - Peta tidak menggunakan vector tiles gelap native (seperti Carto Dark atau Protomaps), melainkan memanipulasi raster tile OSM publik standar menggunakan shader filter MapLibre (`raster-saturation: -0.9`, `raster-brightness-min: 0.86`, `raster-brightness-max: 0.13`).
   - *Dampaknya:* Semua label teks jalan dan nama geografis bawaan OSM terbalik warnanya, menjadi kabur di layar High-DPI (Retina), dan berisiko melanggar *Tile Usage Policy* OpenStreetMap jika diterapkan pada aplikasi publik bervolume tinggi.
3. **Bias Heuristik "Radius 5 Km" Terhadap Luas Riil Kecamatan [Medium confidence]**:
   - Kecamatan di luar Pulau Jawa (Papua, Kalimantan, Maluku) memiliki luas ratusan hingga ribuan kilometer persegi.
   - Mengambil radius 5 km hanya pada desa terpadat mengabaikan 70–85% area dan populasi pedalaman di kecamatan yang sama. Penggunaan multi-lingkaran (`ncirc` pada data) bersifat perkiraan manual/heuristik, bukan analisis isochrone/aksesibilitas jalan riil.

---

## 3. Technology Stack Breakdown

| Komponen | Teknologi | Keterangan & Bukti Decompilasi |
| :--- | :--- | :--- |
| **Peta Renderer** | **MapLibre GL JS v4.x** | Rendering berbasis WebGL dengan dedicated worker script (`maplibre-gl-worker-CMkqA50c.mjs`). Tidak membutuhkan API key berbayar. |
| **Frontend Framework** | **React SPA** | Dibundle menggunakan **Vite**. Routing menggunakan Hash mode (`#nasional`, `#jawa-barat`, `#dki-jakarta`) sehingga tidak membutuhkan konfigurasi server rewrite. |
| **Styling** | **Tailwind CSS** | Skema warna dark mode: slate/zinc background, glassmorphism (`backdrop-blur`), border aksen teal (`#2dd4bf`) dan amber (`#fbbf24`). |
| **Typography** | **Red Hat Display** | Diimpor langsung via Google Fonts (weights: 400, 500, 700, 900). |
| **Excel Export** | **SheetJS (xlsx)** | Code-splitting dynamic import (`import('./xlsx-Sx6neS5-.js')`). Data diekspor langsung di memori browser tanpa server backend. |
| **Hosting & Infra** | **Cloudflare Pages / CDN** | Cloudflare Insights Beacon terpasang. Seluruh data disajikan sebagai static asset JSON. |

---

## 4. Arsitektur Data & Pipeline Slicing

Aplikasi tidak menggunakan database MySQL/PostgreSQL saat runtime. Seluruh data diproses sebelumnya (*pre-computed batch*) dan dibagi menjadi potongan JSON hierarkis:

```
public/
├── data/
│   ├── index.json                  # Metadata nasional & daftar 38 provinsi
│   ├── aceh.json                   # Agregasi data kecamatan di Aceh
│   ├── jawa-barat.json             # Agregasi data kecamatan di Jawa Barat
│   └── ...                         # (1 file per provinsi)
└── geo/
    ├── prov.json                   # Batas administrasi 38 provinsi
    ├── kab-{kodeProv}.json         # Batas kabupaten per provinsi (misal: kab-32.json)
    ├── kec-{kodeKab}.json          # Batas kecamatan per kabupaten
    └── desa-{kodeKec}.json         # Batas desa detail (lazy-loaded saat kecamatan dipilih)
```

### Metadata Sumber Data (Berdasarkan `/data/index.json`):
1. **Hierarki Wilayah**: Direktori Wilayah Indonesia BPS 2022.
2. **Kependudukan**: Jumlah Penduduk dan Keluarga per Desa/Kelurahan BPS.
3. **Sosial & Geografi**: Klasifikasi Penduduk Desa (Desil 1 & 2 Regsosek/DTKS, Elevasi SRTM dlm mdpl, Curah Hujan mm/minggu).
4. **Ekonomi**: Sumber Penghasilan Utama dan Produk Unggulan Desa di Indonesia.

---

## 5. Implementasi Matematis & Algoritma Geodesi

Untuk meminimalkan ukuran bundle, pengembang **tidak menggunakan `@turf/circle`**, melainkan menulis formula proyeksi trigonometri bola langsung.

### A. Algoritma Pembentukan Lingkaran 5 Km (Forward Geodesic Projection)

Fungsi asli yang diekstrak dari bundle klien:

```javascript
const EARTH_RADIUS_KM = 6371; // aL dalam bundle terkompresi

/**
 * Menghitung koordinat poligon lingkaran geodesi
 * @param {number} lat - Latitude pusat
 * @param {number} lng - Longitude pusat
 * @param {number} radiusKm - Jarak radius dalam km (5 km)
 * @param {number} steps - Resolusi segmen (72 titik, atau 32 titik jika data > 3000)
 * @returns {Array<[number, number]>} Array pasangan [lng, lat] poligon tertutup
 */
function generateGeodesicCircle(lat, lng, radiusKm = 5, steps = 72) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const angularDist = radiusKm / EARTH_RADIUS_KM;
  const coordinates = [];

  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI;

    // Hitung latitude titik busur lingkaran
    const latPoint = Math.asin(
      Math.sin(latRad) * Math.cos(angularDist) +
      Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearing)
    );

    // Hitung longitude titik busur lingkaran
    const lngPoint = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDist) * Math.cos(latRad),
      Math.cos(angularDist) - Math.sin(latRad) * Math.sin(latPoint)
    );

    coordinates.push([
      (lngPoint * 180) / Math.PI,
      (latPoint * 180) / Math.PI
    ]);
  }

  return coordinates;
}
```

### B. Adaptive Level of Detail (LOD)
Untuk menjaga performa rendering WebGL:
```javascript
// Jika jumlah lingkaran yang dirender > 3000, turunkan ke 32 titik.
const steps = features.length > 3000 ? 32 : 72;
```

### C. Kalkulasi Bounding Box Otomatis (`fitBounds`)
Menghitung batas zoom kamera peta dengan memperhitungkan jarak buffer radius:
```javascript
function calculateBoundingBox(items) {
  if (!items.length) return null;
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;

  for (const item of items) {
    const latDelta = 5 / 111;
    const lngDelta = 5 / (111 * Math.max(0.2, Math.cos((item.lat * Math.PI) / 180)));

    minLng = Math.min(minLng, item.lng - lngDelta);
    maxLng = Math.max(maxLng, item.lng + lngDelta);
    minLat = Math.min(minLat, item.lat - latDelta);
    maxLat = Math.max(maxLat, item.lat + latDelta);
  }

  return [[minLng, minLat], [maxLng, maxLat]];
}
```

---

## 6. Spesifikasi Layer & Visual Styling MapLibre

### A. Trik Basemap Gelap Bebas Token
```javascript
const darkOSMStyle = {
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'base',
      paint: {
        'raster-brightness-min': 0.86,
        'raster-brightness-max': 0.13,
        'raster-saturation': -0.9,
        'raster-contrast': 0.05
      }
    }
  ]
};
```

### B. Konfigurasi Warna Layer (Design System Palet)
1. **Batas Kabupaten (`boundc-line`)**: `#e2e8f0` (slate-200), opacity `0.42`, width `1.1px`.
2. **Batas Provinsi (`boundp-line`)**: `#fbbf24` (amber-400), opacity `0.85`, width `2.0px`.
3. **Fill Lingkaran (`circle-fill`)**: `#2dd4bf` (teal-400), opacity normal `0.035`, hover `0.20`, selected `0.16`.
4. **Outline Lingkaran (`circle-line`)**: Warna `#2dd4bf` transisi ke `#5eead4` pada state hover, tebal `0.8px` (normal) hingga `2.4px` (hover).
5. **Kecamatan Aktif Terpilih (`kec-line`)**: `#fbbf24`, width `2.4px`, dasharray `[2, 1.5]`.
6. **Titik Pusat Desa Terpadat (`center-dot`)**: Circle layer dengan radius dinamis bergantung zoom:
   ```javascript
   "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 1.6, 9, 3.2, 13, 5],
   "circle-color": "#5eead4",
   "circle-stroke-color": "#0b1112",
   "circle-stroke-width": 1
   ```

---

## 7. Rekomendasi Penerapan pada Mockup PKL

Jika ingin mengadopsi tampilan dan interaktivitas peta ini ke dalam project `mockup`:

1. **Adopsi Formula Geodesi & Palet Warna**:
   - Gunakan formula `generateGeodesicCircle` untuk kebutuhan visualisasi radius coverage atau POI buffer tanpa membebani library eksternal.
   - Gunakan skema warna Teal (`#2dd4bf`) dan Amber (`#fbbf24`) di atas latar dark slate agar visualisasi data terlihat modern dan berkelas.
2. **Perbaikan Terhadap Kelemahan Asli**:
   - **Gunakan Vector Basemap Native**: Alih-alih melakukan hack filter raster OSM (yang membuat teks kabur dan berpotensi kena rate limit), gunakan Carto Dark Matter (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) atau Protomaps PMTiles untuk hasil teks tajam dan lisensi legal.
   - **Gunakan PMTiles atau FlatGeobuf**: Jika data wilayah mencakup puluhan ribu titik/desa, hindari penyimpanan puluhan file JSON GeoJSON terpisah; gunakan PMTiles agar hanya byte rentang koordinat aktif yang diambil browser.
