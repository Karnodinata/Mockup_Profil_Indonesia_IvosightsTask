# Rencana Perbaikan: Mouse Wheel Scroll & Rendering Peta Leaflet pada Profil Wilayah

Dokumen ini memuat analisis akar penyebab teknis (*root cause analysis*), perumusan solusi presisi, dan rencana aksi (*checkpoint execution plan*) untuk menyelesaikan dua masalah yang terjadi pada [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html):
1. **Mouse wheel scroll tidak berfungsi** (halaman hanya bisa digulir dengan menggeser *scrollbar* di sisi kanan).
2. **Peta Leaflet acak-acakan** (tile gambar bertumpuk ganjil/terpotong dan menampilkan peringatan HTTP 403 *"Access Blocked"*).

---

## 1. Analisis Akar Penyebab (Root Cause Analysis)

### Masalah A: Mengapa Mouse Wheel Scroll Mati pada `profil.html`?
**[High Confidence]** — *Diverifikasi langsung melalui inspeksi computed styles, W3C CSS Overscroll Behavior Spec, dan pengujian browser.*

1. **Global Overscroll Containment Trap pada CSS**:
   Pada [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css#L396-L409):
   ```css
   html,
   body,
   .sidebar,
   .table-view-wrap, ... {
       scroll-behavior: auto;
       -webkit-overflow-scrolling: touch;
       overscroll-behavior: contain; /* <-- PENYEBAB UTAMA */
   }
   ```
   Aturan ini menetapkan `overscroll-behavior: contain` secara global pada elemen `html` dan `body`.
2. **Dual-Container Scroll Collision pada `profil.html`**:
   Pada [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html#L40-L48):
   ```css
   html {
       height: auto;
       min-height: 100%;
       overflow-y: auto;
   }
   body {
       height: auto;
       min-height: 100vh;
       overflow-x: hidden;
       overflow-y: auto; /* <-- MEMBUAT INNER SCROLL CONTAINER */
   }
   ```
   - Karena `body` memiliki `overflow-y: auto`, browser memperlakukan `<body>` sebagai wadah gulir mandiri (*scroll container*).
   - Namun, karena `body` memiliki `height: auto`, tinggi elemen `body` melar mengikuti seluruh panjang konten dokumen (misal ~3.200px). Akibatnya, `body.scrollHeight === body.clientHeight` (rentang gulir internal bernilai 0).
   - Di saat yang sama, elemen `<html>` memiliki tinggi sebesar *viewport* (misal ~850px) dengan `overflow-y: auto`, sehingga overflow dokumen sebenarnya berada pada tingkat `<html>`.
3. **Mekanisme Pemutusan Scroll Chaining**:
   - Berdasarkan spesifikasi W3C CSS Overscroll Behavior Level 1, nilai `contain` memerintahkan browser untuk:
     > *"Prevent scroll chaining. An ancestor scroll container will never receive scroll events initiated within this element."*
   - Ketika pengguna meletakkan kursor di tengah layar (di atas kartu, teks, tabel, atau kontainer manapun) dan memutar *mouse wheel*:
     1. Target event adalah anak dari `<body>`.
     2. Event berusaha melakukan gulir pada `<body>`.
     3. `<body>` tidak bisa bergulir karena rentang gulirnya 0 (konten tidak melebihi tinggi `body` itu sendiri).
     4. Browser mencoba meneruskan (*chaining*) delta gulir ke elemen induknya (`<html>`).
     5. Karena `body` memiliki `overscroll-behavior: contain`, browser **menolak meneruskan event gulir ke `<html>`**.
     6. **Delta putaran roda mouse dibuang begitu saja (dropped)**, sehingga halaman tidak bergerak sedikit pun.
4. **Mengapa Drag Scrollbar di Sebelah Kanan Tetap Berfungsi?**
   - Scrollbar vertikal yang terlihat di layar adalah milik elemen `<html>` (*root viewport*).
   - Ketika pengguna mengklik atau menyeret (*drag*) *thumb* scrollbar tersebut secara langsung menggunakan mouse, interaksi dilakukan langsung terhadap DOM `documentElement.scrollTop` tanpa melewati proses *wheel event dispatching* atau *scroll chaining* `<body>`.

---

### Masalah B: Mengapa Peta Leaflet Berantakan & Acak-Acakan?
**[High Confidence]** — *Diverifikasi melalui perbandingan referensi index.html vs profil.html dan bukti inspeksi visual.*

1. **Leaflet CSS Tidak Dimuat Sama Sekali di `profil.html`**:
   - Di [`index.html:13`](file:///c:/laragon/www/PKL/mockup/index.html#L13), terdapat:
     ```html
     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
     ```
   - Namun di `<head>` [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html#L1-L15), **file `leaflet.min.css` sama sekali tidak dipanggil!**
   - Leaflet JS dimuat di bagian bawah ([`profil.html:738`](file:///c:/laragon/www/PKL/mockup/profil.html#L738)), namun tanpa stylesheet Leaflet:
     - Rule `.leaflet-pane, .leaflet-tile { position: absolute; left: 0; top: 0; }` tidak diterapkan.
     - Rule `.leaflet-container { overflow: hidden; position: relative; }` tidak diterapkan.
     - Akibatnya, elemen `<img>` potongan peta (*tile* berukuran 256×256px) mengalir seperti elemen `inline`/`block` biasa dalam aliran dokumen, berantakan ke samping dan ke bawah, menciptakan kotak-kotak acak dan spasi kosong.
2. **Tabrakan Box-Sizing & Image Max-Width**:
   - CSS reset pada [`assets/css/styles.css:60-64`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css#L60-L64) menerapkan `*, *::before, *::after { box-sizing: border-box; }`.
   - Leaflet mewajibkan aturan baku:
     ```css
     .leaflet-container img {
         max-width: none !important;
         max-height: none !important;
     }
     ```
   - Tanpa rule ini, perhitungan koordinat tile pixel Leaflet terdistorsi.
3. **Error HTTP 403 (Access Blocked) dari Server Tile OpenStreetMap**:
   - Pada [`assets/js/core/Profil.js:128`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L128):
     ```javascript
     L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { ... })
     ```
   - Server sukarelawan OpenStreetMap (`tile.openstreetmap.org`) memberlakukan kebijakan *Tile Usage Policy* ketat terhadap request unconfigured/localhost. Ketika diakses berulang dari localhost tanpa custom User-Agent, OSM memblokir request dan mengembalikan gambar peringatan:
     > *"403 Access blocked - App is not following the tile usage policy of OpenStreetMap's volunteer-run servers: osm.wiki/Blocked"*
   - Gambar garis hitam-kuning dan kaca pembesar yang terlihat di screenshot pengguna adalah tile resmi dari OSM yang menandakan akses terblokir.

---

## 2. Rencana Solusi & Perbaikan

| No | Komponen | Tindakan Korektif |
|:---|:---|:---|
| **1** | **Scroll Chain Restoration** | Hapus `html, body,` dari rule `overscroll-behavior: contain` pada [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css). Batasi `overscroll-behavior: contain` hanya untuk dropdown, modal body, dan panel laci (*drawer*) internal. |
| **2** | **Scroll Container Normalization** | Pada [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html), atur `html { overflow-y: auto; overscroll-behavior-y: auto; }` dan `body { overflow-y: visible; }`. Pastikan hanya ada satu *scroll root* tunggal di level *viewport*. |
| **3** | **Leaflet CSS Inclusion** | Tambahkan `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">` pada `<head>` [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html). |
| **4** | **Leaflet Image Reset & Anti-Distortion** | Tambahkan rule proteksi `.leaflet-container img { max-width: none !important; max-height: none !important; }` pada stylesheet. |
| **5** | **Reliable Basemap Tile Provider** | Ubah tileLayer di [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) (dan [`assets/js/core/Map.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js)) menggunakan CartoDB Voyager / Positron (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`) yang bebas blokir 403, andal untuk localhost, cepat, dan senada dengan desain antarmuka. |
| **6** | **Map Dimensions Invalidation** | Pastikan `map.invalidateSize()` dipanggil tepat saat rendering selesai dan saat tab "Profil Wilayah" aktif agar ukuran kontainer Leaflet selalu presisi. |

---

## 3. Matriks Checkpoint Pelaksanaan

### Checkpoint CP-01: Perbaikan Scroll Trap pada `styles.css` & `profil.html`
- [ ] Ubah selektor di [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css#L396) agar `html` dan `body` tidak dibebani `overscroll-behavior: contain`.
- [ ] Ubah style inline di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) agar `body` memiliki `overflow-y: visible` dan tidak menciptakan perangkap gulir ganda.
- [ ] Verifikasi scroll roda mouse (*mouse wheel*) di seluruh area halaman [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).

### Checkpoint CP-02: Integrasi Leaflet CSS & Reset Styling
- [ ] Tambahkan `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">` ke `<head>` [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).
- [ ] Tambahkan rule proteksi kontainer Leaflet di CSS (`.leaflet-container img { max-width: none !important; }`).
- [ ] Pastikan `#map` memiliki dimensi kontainer yang stabil dan terhindar dari tata letak berantakan.

### Checkpoint CP-03: Migrasi TileLayer ke CartoDB & Siklus InvalidateSize
- [ ] Perbarui `L.tileLayer` pada [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) menggunakan CartoDB Voyager Tile Service.
- [ ] Tambahkan pemanggilan `map.invalidateSize()` yang kokoh setelah GeoJSON poligon dimuat.
- [ ] Verifikasi peta pada tab "Profil Wilayah" (Kutai Barat / Kota Cimahi) tampil bersih, mulus, poligon terpasang sempurna tanpa tile 403 *"Access Blocked"*.

### Checkpoint CP-04: Pengujian Lintas Halaman & Validasi Akhir
- [ ] Uji navigasi bolak-balik antara [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html) dan [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html).
- [ ] Pastikan perilaku gulir pada [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html) (mode peta potensi & mode profil) tetap normal dan sidebar tetap dapat di-scroll secara independen.
- [ ] Pastikan **TIDAK MELAKUKAN PUSH KE GITHUB** sesuai instruksi eksplisit pengguna.

---

## 4. Kriteria Keberhasilan (Definition of Done)
1. Halaman [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) dapat digulir secara mulus menggunakan *mouse wheel* di posisi kursor mana pun (atas, tengah kartu, bawah).
2. Peta pada kartu *"Peta Lokasi & Batas Wilayah Spasial"* tertata rapi, potongan peta (*tiles*) tersusun sempurna tanpa celah kosong atau pergeseran posisi.
3. Tidak ada lagi pesan error/gambar HTTP 403 *"Access blocked"* pada tile peta.
4. Poligon GeoJSON batas wilayah utama dan batas tetangga (misal Kutai Barat, Kapuas Hulu, Murung Raya, dll) dapat di-klik dan disorot dengan responsif.
5. Seluruh perubahan tersimpan secara lokal dan **tidak di-push ke remote GitHub**.
