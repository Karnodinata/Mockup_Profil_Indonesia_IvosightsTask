---
title: "Perencanaan Teknis: Implementasi Highlight Outline Menyala (Glowing Green Pulsing Backlight) pada Peta Kuadran Kemiskinan & Investasi"
date: 2026-11-02
status: Completed (Revision 2)
---

# Perencanaan Teknis: Highlight Outline Menyala (Glowing Green Pulsing Backlight) pada Peta Kuadran Kemiskinan & Investasi

Dokumen ini merupakan revisi perencanaan visual antarmuka (*UI/UX visual specification*) untuk efek highlight kabupaten/kota terkait pada dua widget grafik scatter/bubble 4-kuadran di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html):
1. **Tab Deck Investasi**: *Peta Posisi Investasi Kabupaten/Kota dalam Provinsi (Kuadran BKPM)*
2. **Tab Ekonomi**: *Peta Kondisi Kemiskinan Kabupaten/Kota (Scatter Plot Kemiskinan vs P1)*

---

## 1. Konteks & Tujuan Revisi (Objective & Design Pivot)

### 1.1. Evaluasi Desain Sebelumnya
* Desain lingkaran coretan spidol (*hand-drawn sketch marker*) terasa kurang modern, kurang menyatu dengan estetika dashboard analitis resmi, dan terkesan mengotori kanvas grafik.

### 1.2. Konsep Desain Baru: Outline Neon / Glowing Backlight (Hijau Emerald / Cyan-Green)
Pengguna menginginkan efek highlight dengan karakteristik:
1. **Bentuk Outline Rapi**: Memeluk bentuk asli titik lingkaran/bubble (bukan coretan asimetris).
2. **Backlight Bersinar / Menyala (Luminescent Glow)**: Memiliki pendaran cahaya lembut di pinggiran luar (*outer ambient glow/backlight*).
3. **Animasi Berdenyut Halus (*Pulsing / Breathing Animation*)**: Efek cahaya berkedip/berdenyut pelan yang dinamis namun **tetap wajar dan elegan (*not distracting / strictly anti-slop*)**.
4. **Warna Aksen**: Menggunakan palet **Hijau Neon / Emerald Cerah (`#10b981` / `#059669` / `#34d399`)** yang kontras di atas latar belakang kuadran, mencerminkan status aktif/indikator terpilih (*selected/live indicator*).

---

## 2. Arsitektur Teknis & Spesifikasi Visual (Visual & Animation Architecture)

### 2.1. Efek Pendaran Backlight SVG Filter (`feGaussianBlur` + `feDropShadow`)
Untuk menghasilkan sinar backlight yang realistis di dalam elemen SVG tanpa membebani browser:
* Di bagian `<defs>` kedua grafik SVG, ditambahkan filter khusus:
  ```xml
  <defs>
    <!-- Filter Neon Glow Hijau -->
    <filter id="neonGlowGreen" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#10b981" flood-opacity="0.85"/>
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#34d399" flood-opacity="0.5"/>
    </filter>
  </defs>
  ```

### 2.2. Struktur Elemen Visual pada Titik Terpilih (*Layering*)
Pada titik/bubble kabupaten/kota yang aktif, dirender 3 lapisan bertumpuk:
1. **Lapisan 1: Pulsing Outer Ring (Backlight Berdenyut)**:
   * Lingkaran luar dengan stroke hijau emerald (`stroke="#10b981"`), `stroke-width="2.5"`, tanpa fill (`fill="none"`).
   * Diberi class CSS `.target-glowing-ring` yang menjalankan animasi CSS keyframes `pulse-glow-ring`.
2. **Lapisan 2: Titik Inti (Core Bubble/Dot)**:
   * **Di Kuadran Investasi**: Bubble tetap mempertahankan warna kuadran aslinya, namun border dipertebal dengan stroke putih solid `stroke-width="3"` dan filter `neonGlowGreen`.
   * **Di Kuadran Kemiskinan**: Titik lingkaran inti diberi warna hijau emerald solid (`fill="#10b981"`) dengan stroke putih bersih.
3. **Lapisan 3: Label Badge Elegan**:
   * Label teks nama wilayah diberi kapsul pill hijau tua/emerald dengan border tipis dan teks putih tebal bertanda pin/bintang: `[ Kabupaten X ★ ]`.

### 2.3. Definisi Animasi CSS (`assets/css/styles.css` atau Scoped SVG `<style>`)
Animasi denyut dibuat halus dengan ritme pernapasan 2 detik (*smooth breathing rhythm*):
```css
@keyframes pulseGlowRing {
  0% {
    r: var(--base-r);
    stroke-opacity: 0.9;
    stroke-width: 2.5px;
    filter: drop-shadow(0 0 3px #10b981);
  }
  50% {
    r: calc(var(--base-r) + 5px);
    stroke-opacity: 0.35;
    stroke-width: 1.5px;
    filter: drop-shadow(0 0 8px #34d399);
  }
  100% {
    r: var(--base-r);
    stroke-opacity: 0.9;
    stroke-width: 2.5px;
    filter: drop-shadow(0 0 3px #10b981);
  }
}

.target-pulse-ring {
  animation: pulseGlowRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  transform-origin: center;
  pointer-events: none;
}
```
* **Kewajaran Animasi (Subtle Constraint)**:
  - Jarak ekspansi radius hanya +4px hingga +6px (tidak membesar berlebihan yang menutupi titik lain).
  - Kecepatan 2.0 detik memberikan sensasi radar/beacon yang tenang dan profesional (*calm executive indicator*).

### 2.4. Kontras terhadap Wilayah Lain (*Dimming Balance*)
* Daerah sekitar (*peer regions*) tetap dirender dengan opacity `0.45` pada fill dan `0.55` pada label teks sehingga titik aktif yang menyala hijau langsung menjadi pusat atensi visual.

---

## 3. Daftar File yang Terdampak (Affected Files)

- `[ Modifikasi ]` [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css):
  - Penambahan class animasi `.target-pulse-ring` dan keyframes `pulseGlowRing`.
- `[ Modifikasi ]` [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js):
  - Modifikasi `renderInvestasiKuadran(r)`: Menghapus coretan sketch oranye, menggantikannya dengan filter `neonGlowGreen`, elemen lingkaran luar beranimasi denyut hijau, dan bubble outline menyala.
  - Modifikasi `renderKemiskinanKuadran(r)`: Menghapus coretan sketch oranye, menggantikannya dengan titik inti hijau emerald, pulsing backlight outer ring, dan badge hijau emerald.

---

## 4. Langkah Eksekusi Bertahap (Actionable Steps)

- [x] **Tahap 1 — Aturan CSS Animasi Glowing Backlight**:
  - Daftarkan keyframes animasi denyut pendaran hijau (`pulseGlowRing` dan `.target-pulse-ring`) di [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css).
- [x] **Tahap 2 — Implementasi pada Peta Posisi Investasi (`renderInvestasiKuadran`)**:
  - Pasang filter pendaran neon `neonGlowGreen` di `<defs>` SVG.
  - Bungkus bubble kabupaten aktif dengan outline bercahaya, ring backlight beranimasi denyut halus, dan badge hijau emerald elegan.
- [x] **Tahap 3 — Implementasi pada Peta Kondisi Kemiskinan (`renderKemiskinanKuadran`)**:
  - Pasang filter pendaran neon `kmNeonGlowGreen` di `<defs>` SVG.
  - Buat titik kabupaten aktif berwarna hijau emerald menyala dengan ring backlight denyut dan badge hijau emerald.
- [x] **Tahap 4 — Validasi & Uji Visual**:
  - Animasi denyut 2.2s berjalan mulus berbasis transform scale & filter glow SVG.
  - Sintaks CSS & JS lolos validasi tanpa error.

---

## 5. Batasan & Kriteria Keberhasilan (Definition of Done)

1. Outline dan pendaran berwarna serasi dengan warna asli titik kuadran (`#10b981` hijau, `#34d399` biru, `#f59e0b` oranye, `#8b5cf6` ungu, `#ef4444` merah) terlihat jelas bersinar di sekeliling titik daerah aktif.
2. Denyut animasi terasa lembut, wajar, dan profesional (bukan kedipan kasar).
3. Titik-titik lain di sekitarnya tidak tertutup oleh pendaran cahaya.

---

## 6. Penyempurnaan Adaptasi Dinamis Warna Highlight (*Dynamic Highlight Palette Adaptation*)

### 6.1. Latar Belakang & Kebutuhan
Sebelumnya efek backlight, outline, dan badge di-hardcode ke warna hijau emerald (`#10b981`). Namun pada kedua kuadran, masing-masing kuadran memiliki kode warna tematik tersendiri:
- **Kuadran Investasi**:
  - Kuadran I (Investasi Tinggi, PMA Dominan): **Hijau** (`#10b981`)
  - Kuadran II (Investasi Tinggi, PMDN Dominan): **Biru** (`#3b82f6`)
  - Kuadran III (Investasi Rendah, PMDN Dominan): **Oranye/Amber** (`#f59e0b`)
  - Kuadran IV (Investasi Rendah, PMA Dominan): **Ungu** (`#8b5cf6`)
- **Kuadran Kemiskinan**:
  - Kuadran Q3 (Miskin Rendah, P1 Rendah): **Hijau** (`#10b981`)
  - Kuadran Q4 (Miskin Tinggi, P1 Rendah): **Biru** (`#3b82f6`)
  - Kuadran Q2 (Miskin Rendah, P1 Tinggi): **Merah** (`#ef4444`)
  - Kuadran Q1 (Miskin Tinggi, P1 Tinggi): **Oranye/Amber** (`#f59e0b`)

### 6.2. Implementasi Palet Dinamis
1. Menambahkan fungsi global `getHighlightPalette(hex)` di [Profil.js](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js):
   - Menghasilkan konfigurasi warna ring, ring sekunder, badge background, badge border, dan ID filter glow yang serasi secara dinamis berdasarkan warna titik kuadran.
2. Menambahkan generator filter neon glow lengkap `getNeonGlowFiltersSvg()` untuk 5 varian (`neonGlow-green`, `neonGlow-blue`, `neonGlow-amber`, `neonGlow-purple`, `neonGlow-red`).
3. Masing-masing titik aktif dan titik yang diklik (*on-click*) langsung mengadopsi pendaran cahaya sesuai warna kuadran aslinya.
4. Menambahkan class `.main-bubble-circle` dan `.main-dot-circle` untuk memastikan event `mouseenter` / `mouseleave` menargetkan lingkaran inti yang tepat tanpa mengganggu lingkaran ring animasi SMIL.

---

## 7. Penanganan Bug Pemetaan Nama Provinsi (*Province Alias Mismatch*)

* **Temuan**: Wilayah DKI Jakarta (`id=156`) dan DI Yogyakarta tidak memicu highlight karena master data menggunakan singkatan `"DKI JAKARTA"`, sedangkan dataset BKPM & BPS menggunakan nama panjang resmi `"Daerah Khusus Ibukota Jakarta"`.
* **Solusi**: Diterapkan helper `matchProvinceName(provList, targetProv)` yang memetakan singkatan akronim umum antar dataset di seluruh 8 widget analitis provinsi.

---

## 8. Penyempurnaan Layering SVG (Top Z-Order), Anti-Collision Label, & Paritas Skala Tab Ekonomi

### 8.1. Masalah yang Ditemukan
1. **Badge Tertumpuk Teks Tetangga**: Di Deck Investasi, badge `[ Bandung ★ ]` tertabrak dan tertimpa teks label tetangga (`Purwakarta`) karena urutan render array dataset digambar secara linear tanpa pemisahan layer Z-order.
2. **Ketimpangan Skala Tab Ekonomi**: Titik di Tab Ekonomi berukuran sangat kecil (5px / 7.5px) sehingga ring pendaran neonnya kerdil dan tidak sebanding dengan Deck Investasi (radius s/d 28px).
3. **Pembersihan Nama Wilayah**: Regex lama menyisakan `"Adm. Jakarta Selatan"` bukannya `"Jakarta Selatan"`.

### 8.2. Solusi yang Diterapkan
1. **Arsitektur Rendering 2-Layer (Top Z-Order Guaranteed)**:
   - Layer 1 (`#quadPlotArea` / `#kmDotsBaseLayer`): Merender seluruh titik non-target.
   - Layer 2 (`#invTopHighlightLayer` / `#kmTopHighlightLayer`): Khusus merender titik target yang sedang aktif, dual pulsing neon rings, dan badge nama wilayah di lapisan teratas SVG. Tidak akan pernah tertutup oleh elemen manapun.
2. **Peredaman Teks Tetangga (*Anti-Collision Dimming*)**:
   - Titik non-target yang berada dalam radius < 42px dari target secara otomatis diredam label teksnya (`opacity="0.1"`) sehingga badge nama target terbaca bersih dan kontras.
3. **Pembalikan Cerdas Badge (*Smart Border Flip*)**:
   - Jika titik berada di dekat tepi kanan (`x + badgeW > svgW - padR`), badge otomatis bergeser ke sisi kiri titik agar tidak terpotong tepi layar.
4. **Paritas Skala Tab Ekonomi**:
   - Titik target di Tab Ekonomi dinaikkan menjadi radius **12px** dengan ring denyut ekspansi 16px $\to$ 24px, serasi dan berbobot setara dengan Deck Investasi.
5. **Diferensiasi Kota vs Kabupaten**:
   - Penambahan deteksi `isKotaA === isKotaB` untuk mencegah tabrakan entitas antara Kabupaten Bandung dan Kota Bandung.

---

## 9. Penanganan Titik Tertutup Badge (*Anti-Occlusion Multi-Direction Placement & Click-Through*)

### 9.1. Masalah yang Ditemukan
* Pada Tab Ekonomi wilayah Jawa Barat, saat memilih **Kabupaten Garut**, posisi badge nama di sebelah kanan (`x = cx + r + 8`) tepat menutupi titik **Kabupaten Subang** (`dx = 24.7px`).
* Akibatnya, titik Subang tersembunyi di balik badge Garut dan tidak dapat diklik oleh pengguna karena kotak badge memblokir pointer event.

### 9.2. Solusi yang Diterapkan
1. **Fungsi Penempatan Bebas Tabrakan (`findCollisionFreeBadgePosition`)**:
   - Algoritma cerdas menguji 6 arah potensial penempatan badge (`Right`, `Top`, `Bottom`, `Left`, `Top-Right`, `Top-Left`).
   - Setiap kandidat dihitung skor tabrakannya terhadap koordinat seluruh titik wilayah lain di dalam kanvas SVG.
   - Posisi dengan skor tabrakan terendah (0 collision) otomatis terpilih. Untuk kasus Garut, badge otomatis ditempatkan di arah **Top**, sehingga titik Subang di sebelah kanan tetap terlihat utuh dan bebas dari halangan.
2. **Atribut `pointer-events: none` pada Elemen Dekoratif**:
   - Elemen `<rect>` dan `<text>` badge serta ring animasi neon SMIL diberi `style="pointer-events: none;"`.
   - Hanya lingkaran target inti (`.main-dot-circle`) yang menerima interaksi klik/hover.
   - Dengan ini, bila kursor berada di atas area badge atau ring pendaran, event klik tetap tembus (*click-through*) 100% ke titik wilayah di bawahnya.

---

## 10. Investigasi Mendalam: Akar Masalah Kerusakan Highlight Tab Ekonomi & Disorientasi Badge (Revisi 2)

### 10.1. Temuan Akar Masalah (Root Cause Analysis)
Berdasarkan analisis mendalam terhadap tangkapan layar `media_1793611599860_ab410ab4.jpg`, dump SVG DOM, dan arsitektur rendering engine browser (Blink/Chromium):

1. **Penyebab Utama 1 — SVG Filter ID Collision Antar-Tab (`display: none` Subtree Shadowing)** [High Confidence - Terverifikasi Spesifikasi W3C SVG & Perilaku Chromium]:
   - Kedua grafik SVG (`#investasiSvg` di tab Deck Investasi dan `#kemiskinanSvg` di tab Ekonomi) menggunakan ID filter SVG yang sama persis: `neonGlow-green`, `neonGlow-blue`, `neonGlow-amber`, `neonGlow-purple`, `neonGlow-red`.
   - Di dokumen HTML, tab Deck Investasi dideklarasikan lebih awal dibanding tab Ekonomi.
   - Ketika pengguna berada di Tab Ekonomi, kontainer Tab Investasi disembunyikan menggunakan gaya CSS `display: none;`.
   - Di browser Chromium/Edge, pemanggilan `filter="url(#neonGlow-green)"` di tab manapun selalu di-resolve ke elemen `<filter>` pertama yang ditemukan di DOM tree. Karena elemen `<filter>` pertama berada di dalam tab Investasi yang sedang `display: none;`, maka rendering engine Chromium menganggap filter tersebut berada di dalam non-rendered subtree.
   - **Dampaknya fatal**: Semua elemen SVG di Tab Ekonomi yang menggunakan `filter="url(#neonGlow-green)"` (lingkaran halo berdenyut `r=16`, ring kedua `r=14`, dan lingkaran inti `r=12`) **gagal dirender (menjadi 100% transparan / hilang)**.
   - Kotak badge (`<rect>`) dan teks nama wilayah tetap muncul karena badge menggunakan CSS functional filter `drop-shadow(...)` inline, bukan `url(#...)`. Itulah mengapa di tangkapan layar hanya tersisa badge `[ Bandung ★ ]` saja yang melayang sendirian!
   - Ini juga menjelaskan secara persis mengapa "pas tab investasi bener, tab ekonomi malah rusak": saat tab investasi aktif (`display: block`), filternya aktif; namun begitu beralih ke tab ekonomi, filter tab investasi menjadi `display: none` dan merusak tab ekonomi.

2. **Penyebab Utama 2 — Disorientasi Spasial Badge Mengambang Bebas (Floating Unconnected Badge)** [High Confidence - Terverifikasi Koordinat Math]:
   - Titik Kabupaten Bandung berada di koordinat `cx = 224.6, cy = 289.8`.
   - Titik-titik di sekitarnya sangat padat: Sukabumi di utara (`cy = 249.5`), Bekasi di timur (`cx = 248.0, cy = 302.7`), dan Banjar di selatan (`cy = 347.9`).
   - Algoritma anti-tabrakan `findCollisionFreeBadgePosition` mengeliminasi arah `right`, `top`, dan `bottom` karena menabrak Bekasi dan Sukabumi.
   - Algoritma akhirnya memilih arah `left`, melempar badge ke `x = 124.15` (berjarak 100 pixel ke kiri dari titik target, tepat di atas koordinat Depok).
   - Tanpa garis penunjuk (*pointer leader line*) dari badge ke titik target, pengguna melihat kotak hijau `[ Bandung ★ ]` mengambang bebas di ruang kosong tanpa korelasi visual dengan titik Bandung.

3. **Penyebab Utama 3 — Tabrakan Normalisasi Nama Kabupaten vs Kota Bandung di `isSameKabKemiskinan`** [High Confidence - Terverifikasi Data Susenas]:
   - Dataset BPS Jawa Barat memiliki 2 entitas: `Kabupaten Bandung` (index 0) dan `Kota Bandung` (index 18) dengan persentase miskin dan P1 yang persis sama (3.9% dan 0.59).
   - Fungsi `isSameKabKemiskinan` menghapus kata "Kabupaten" dan "Kota", sehingga perbandingan "bandung" === "bandung" selalu bernilai `true`.
   - Akibatnya, `Kota Bandung` menimpa `Kabupaten Bandung` sebagai `targetItemObj`. Selain itu, saat event `mouseleave` dievaluasi, pengecekan string yang tidak presisi mengecilkan paksa radius lingkaran menjadi `5.5px`.

### 10.2. Rencana Solusi Komprehensif

1. **Pemisahan Filter ID dengan Namespace Unik (Isolated Tab Scoping)**:
   - Fungsi generator filter neon dan highlight palette diberikan parameter namespace/prefix:
     - Tab Investasi: `invNeonGlow-green`, `invNeonGlow-blue`, dst.
     - Tab Ekonomi: `kmNeonGlow-green`, `kmNeonGlow-blue`, dst.
   - Kedua tab memiliki filter SVG independen sehingga status `display: none` pada salah satu tab tidak akan pernah mengganggu rendering filter di tab lainnya.

2. **Penyambung Visual Leader Line / Pointer Pin untuk Badge Terpencil**:
   - Ketika badge ditempatkan pada posisi terpisah (`left`, `top`, `bottom`, dll.), tambahkan elemen SVG garis penghubung halus:
     - Garis konektor (`stroke="${pal.badgeBorder}"`, `stroke-width="1.5"`, `stroke-dasharray="2,2"`, `pointer-events: none`).
     - Menghubungkan tepi badge langsung ke titik target `(tb.cx, tb.cy)`.
   - Pengguna langsung melihat secara visual ke titik mana badge tersebut tertuju.

3. **Peningkatan Presisi `isSameKabKemiskinan`**:
   - Membedakan tipe `Kota` vs `Kabupaten`. Jika target eksplisit memuat kata "Kota", cocokkan hanya dengan entitas Kota; jika Kabupaten (atau tanpa kata Kota), cocokkan dengan entitas Kabupaten.

4. **Proteksi Titik Target dari Event `mouseleave`**:
   - Titik pada `kmTopHighlightLayer` diproteksi agar radiusnya tidak pernah diubah menjadi `5.5px` oleh handler `mouseleave`.

---

## 11. Rencana Uji Verifikasi (Verification Checklist)
- [x] Uji Tab Switching: Buka Tab Deck Investasi -> Pindah ke Tab Ekonomi -> Pastikan titik highlight menyala hijau terang di Tab Ekonomi.
- [x] Pindah kembali ke Tab Deck Investasi -> Pastikan highlight di Investasi tetap aktif dan bercahaya.
- [x] Cek kasus Kabupaten Bandung: Lingkaran titik di (224.6, 289.8) berdenyut menyala dengan radius 12px dan terkoneksi rapi dengan badge namanya.
- [x] Cek kasus Garut & Subang: Subang tetap dapat diklik tembus (*click-through*).
