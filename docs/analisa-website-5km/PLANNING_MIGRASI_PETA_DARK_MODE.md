# Planning: Penerapan Peta Gelap (Scoped Dark Map) & Floating Cursor Tooltip

**Status Dokumen**: APPROVED REVISION (SCOPED DARK MAP ONLY)  
**Tanggal**: 2026-10-28  
**Prinsip Batasan Utama**:
> **HANYA ELEMEN PETA YANG GELAP**.  
> Seluruh halaman, background dashboard, kartu profil daerah, sidebar, header, dan teks di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) serta [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html) **TETAP 100% PUTIH/TERANG (LIGHT THEME ASLINYA)**. Tidak ada perubahan warna pada tema umum aplikasi.

---

## 1. Lingkup Pekerjaan & Batasan Area (Scope Boundary)

```
┌──────────────────────────────────────────────────────────────┐
│  Dashboard Umum (profil.html & index.html)                    │
│  Latar Belakang: #f1f5f9 (Putih/Slate Terang - TIDAK BERUBAH)│
│  Kartu-kartu UI: #ffffff (Putih Bersih - TIDAK BERUBAH)      │
│  Teks & Komponen: Slate Gelap - TIDAK BERUBAH                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🎯 AREA YANG DIUBAH: HANYA DALAM KOTAK PETA (#map)     │  │
│  │ 1. Basemap: CartoDB Dark Matter (Gelap Elegan)          │  │
│  │ 2. Poligon Wilayah: Teal Menyala (#2dd4bf / #5eead4)   │  │
│  │ 3. Tooltip Hover: Dark HUD Card Mengikuti Kursor (Gbr 2)│  │
│  │ 4. Auto-Zoom Kamera: Zoom ke daerah saat diklik       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

| Komponen | Status Perubahan | Keterangan |
| :--- | :--- | :--- |
| **Halaman Profil (`profil.html`)** | **TIDAK BERUBAH** | Kartu pimpinan, KPI, demografi, tab, dan teks tetap putih/terang seperti semula. |
| **Background Aplikasi** | **TIDAK BERUBAH** | Canvas tetap `#f1f5f9` (soft off-white). |
| **Sidebar / Drawer Kanan** | **TIDAK BERUBAH** | Tetap putih bersih dengan teks slate gelap. |
| **Kotak Peta (`#map`)** | **DIUBAH KE DARK** | Diisi tile CartoDB Dark Matter, border halus, background canvas `#0f172a`. |
| **Poligon Arsiran Wilayah** | **DIUBAH KE TEAL** | Fill `#2dd4bf`, border `#5eead4` (kontras menyala di peta gelap). |
| **Tooltip Kursor (Gambar 2)** | **DIUBAH KE DARK HUD** | Mengikuti kursor mouse (`sticky: true`), tanpa panah putih runcing. |
| **Kamera Peta** | **AUTO-ZOOM AKTIF** | Zoom in mulus ke kabupaten saat dipilih di Mode Profil Daerah (`index.html`). |

---

## 2. Analisis Kritis & Keamanan Arsitektur

1. **Keuntungan Pendekatan Scoped Dark Map [High confidence]**:
   - Mempertahankan konsistensi identitas portal data instansi yang bersih (*light clean dashboard*) sekaligus memberikan kesan instrumen visual analitis modern (Command Center GIS) khusus pada area petanya.
   - Risiko regresi visual pada halaman profil menjadi **0%** karena tidak ada variabel global tema (`data-theme`) yang diutak-atik.
2. **Kamera Asimetris saat Drawer Terbuka (`index.html`) [High confidence]**:
   - Saat kabupaten diklik di Mode Profil Daerah, drawer sidebar selebar 380px akan muncul di sisi kanan.
   - Auto-zoom kamera harus menggunakan offset kanan 440px (`paddingBottomRight: [440, 60]`) agar wilayah kabupaten berada di tengah area peta yang bebas, tidak tertindih oleh drawer.

---

## 3. Rencana Eksekusi Bertahap (3 Modul Terfokus)

### Modul 1: Pembaruan Tile Basemap Peta Gelap
**Target File**:
- [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L128-L132)
- [`assets/js/core/Map.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js#L160-L164)

Ubah dari OSM HOT ke CartoDB Dark Matter pada kedua peta:
```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
}).addTo(map);
```

---

### Modul 2: Refactor Poligon Wilayah & Sticky Cursor Tooltip (Gambar 2)
**Target File**:
- [`assets/js/core/Map.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js#L980-L991)
- [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L137-L144)

#### A. Tooltip Melayang Mengikuti Kursor di [`Map.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js):
Ganti tooltip default di baris 980 menjadi:
```javascript
layer.bindTooltip(`
    <div class="map-hud-tooltip">
        <div class="hud-eyebrow">PROVINSI ${escapeHtml(provName)}</div>
        <div class="hud-title">${escapeHtml(fullName)}</div>
        <div class="hud-stat-primary">
            <span class="hud-metric-label">${m.label}</span>
            <span class="hud-metric-val">${valDisplay}</span>
        </div>
        ${classification ? `
            <div class="hud-badge-row">
                <span class="hud-badge">${classification}</span>
            </div>
        ` : ''}
        <div class="hud-divider"></div>
        <div class="hud-meta-list">
            <div class="hud-meta-item">
                <span class="hud-meta-label">Total Penduduk</span>
                <span class="hud-meta-val">${regData ? formatNumber(regData.penduduk) + ' jiwa' : '–'}</span>
            </div>
            <div class="hud-meta-item">
                <span class="hud-meta-label">Capaian IPM</span>
                <span class="hud-meta-val">${regData && regData.ipm_total ? regData.ipm_total : '–'}</span>
            </div>
        </div>
    </div>
`, {
    sticky: true,                    // Tooltip selalu menempel & melayang mengikuti kursor
    direction: 'auto',
    offset: [15, 12],                // Melayang 15px di samping kursor
    opacity: 1,
    className: 'leaflet-dark-hud'    // Hilangkan panah putih segitiga
});
```

#### B. Poligon Wilayah di [`Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js):
```javascript
mainRegionLayer = L.geoJSON(matchedFeatures, {
    style: {
        fillColor: '#2dd4bf',      // Teal cerah menyala
        weight: 2.2,
        opacity: 0.95,
        color: '#5eead4',          // Garis batas neon
        fillOpacity: 0.32
    },
    // ...
});
```

---

### Modul 3: Auto-Zoom Kamera Cerdas di [`Map.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js)
**Target File**: [`assets/js/core/Map.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js#L1317) di dalam `function selectRegion(region)`

Tambahkan logika kamera asimetris:
```javascript
if (region) {
    let targetBounds = null;
    if (geojsonLayerGroup) {
        geojsonLayerGroup.eachLayer(l => {
            if (typeof l.eachLayer === 'function') {
                l.eachLayer(sub => {
                    const p = sub.feature?.properties || {};
                    const matchName = (p.NAME_1 || '').trim().toLowerCase();
                    const targetName = (region.kabkota || '').trim().toLowerCase();
                    if (targetName.includes(matchName) || matchName.includes(targetName.replace(/^(kabupaten|kota)\s+/i, ''))) {
                        targetBounds = sub.getBounds();
                    }
                });
            }
        });
    }

    // Offset 440px di sisi kanan agar poligon tidak tertutup oleh sidebar informasi 380px
    const drawerPadding = {
        paddingTopLeft: [60, 60],
        paddingBottomRight: [440, 60],
        maxZoom: 10,
        duration: 1.1
    };

    if (targetBounds && targetBounds.isValid()) {
        map.flyToBounds(targetBounds, drawerPadding);
    } else if (typeof region.lat === 'number' && typeof region.lng === 'number') {
        const ptBounds = L.latLngBounds(
            [region.lat - 0.05, region.lng - 0.05],
            [region.lat + 0.05, region.lng + 0.05]
        );
        map.flyToBounds(ptBounds, drawerPadding);
    }
}
```

---

### Modul 4: CSS Scoped (Hanya untuk Tooltip Peta & Container Peta)
**Target File**: [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css)

Hanya menambahkan class tooltip kursor melayang dan background dasar kotak peta, **tanpa mengubah styling halaman umum**:
```css
/* ============================================================
   Scoped Dark Map Tooltip (Inspirasi 5km.sg.report)
   ============================================================ */
.leaflet-dark-hud {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
}

/* Hilangkan panah segitiga default Leaflet */
.leaflet-dark-hud.leaflet-tooltip-top:before,
.leaflet-dark-hud.leaflet-tooltip-bottom:before,
.leaflet-dark-hud.leaflet-tooltip-left:before,
.leaflet-dark-hud.leaflet-tooltip-right:before {
    display: none !important;
}

.map-hud-tooltip {
    width: 280px;
    background: rgba(15, 23, 42, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.7);
    color: #f8fafc;
    font-family: var(--font-sans);
    pointer-events: none;
}

.map-hud-tooltip .hud-eyebrow {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #94a3b8;
    font-weight: 600;
}

.map-hud-tooltip .hud-title {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    margin-top: 2px;
    line-height: 1.25;
}

.map-hud-tooltip .hud-stat-primary {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
}

.map-hud-tooltip .hud-metric-label {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
}

.map-hud-tooltip .hud-metric-val {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 700;
    color: #2dd4bf;
    margin-top: 2px;
}

.map-hud-tooltip .hud-badge-row {
    margin-top: 6px;
}

.map-hud-tooltip .hud-badge {
    display: inline-block;
    font-size: 10.5px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 99px;
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.35);
}

.map-hud-tooltip .hud-divider {
    height: 1px;
    background: rgba(148, 163, 184, 0.18);
    margin: 10px 0;
}

.map-hud-tooltip .hud-meta-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.map-hud-tooltip .hud-meta-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11.5px;
}

.map-hud-tooltip .hud-meta-label {
    color: #94a3b8;
}

.map-hud-tooltip .hud-meta-val {
    font-family: var(--font-mono);
    font-weight: 600;
    color: #e2e8f0;
}
```

---

## 4. Checklist Eksekusi Ringkas

- [ ] Modul 1: Ganti tile layer ke CartoDB Dark Matter di `Map.js` dan `Profil.js`.
- [ ] Modul 2: Pasang `sticky: true` pada tooltip di `Map.js` & update warna poligon ke Teal `#2dd4bf` di `Profil.js`.
- [ ] Modul 3: Pasang `map.flyToBounds(..., drawerPadding)` saat `selectRegion(region)` di `Map.js`.
- [ ] Modul 4: Tambahkan CSS `.leaflet-dark-hud` dan `.map-hud-tooltip` di `styles.css`.
- [ ] Verifikasi browser: Halaman dashboard tetap putih bersih, kotak peta gelap menyala, tooltip melayang mulus di samping kursor, dan auto-zoom bekerja presisi tanpa tertutup sidebar.
