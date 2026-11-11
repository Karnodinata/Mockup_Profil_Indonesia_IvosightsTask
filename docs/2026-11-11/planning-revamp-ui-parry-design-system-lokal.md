---
title: "Eksperimen Revamp UI Peta Potensi Berbasis Parry UI Design System (Lokal)"
date: 2026-11-11
status: In Progress
---

# Eksperimen Revamp UI Peta Potensi Berbasis Parry UI Design System (Lokal)

## 1. Konteks & Tujuan (Objective)
Antarmuka fitur **Peta Potensi Pajak PAD360** saat ini sering mendapatkan catatan evaluasi dari atasan terkait estetika visual dan pengalaman pengguna (UI/UX). Masalah utamanya mencakup:
1. **Tabrakan Tema (*Theme Clash*)**: Basemap peta hitam legam bertabrakan tajam dengan panel sidebar dan modal yang berwarna putih terang (*glare contrast*).
2. **Kepadatan Ruang (*Viewport Congestion*)**: Peta terjepit di tengah (hanya tersisa ~35–40% lebar layar) akibat panel kiri dan modal kanan memakan terlalu banyak ruang tanpa fitur *collapse*.
3. **Placeholder Kasar**: Area foto bukti lapangan berupa kotak hitam polos besar yang menyerupai *broken image*.
4. **Hierarki Data Datar**: Informasi detail objek (pajak, izin, kontrak, dimensi, kontak) ditumpuk tanpa pengelompokan visual yang membedakan data primer vs data sekunder.
5. **AI Slop & Emoji Clutter pada Profil & Dashboard**: Penggunaan simbol/emoticon dekoratif murahan (seperti ★, ❦, ♥ pada 9 tab profil, serta 📊, 🏆, 🌪️, 🌾, 🥔, ⚠️, 🔴 pada data metrik) yang merusak citra profesional aplikasi pemerintahan/korporat dan memberi kesan produk 'AI-generated slop' alih-alih dirancang oleh desainer profesional.

Atasan telah menginstruksikan untuk mempelajari katalog template resmi Ivosight: **[Parry UI Templates](https://parry-ui.vercel.app/templates)**. 

**Tujuan Dokumen:**
Merancang dan mengimplementasikan eksperimen peremajaan antarmuka (*UI revamp*) secara aman di lingkungan lokal menggunakan bahasa visual Parry UI (terinspirasi dari template `dashboard-01`, `report-01`, dan `leads-pipeline-01`), **tanpa merombak arsitektur sistem maupun menyentuh file produksi utama** (`index.html` dan `styles.css` tetap utuh 100%).

---

## 2. Ruang Lingkup & Arsitektur Teknis (Scope & Architecture)

```
+-----------------------------------------------------------------------------------------+
|                  ALUR KERJA TERPADU: STITCH PROTOTYPING -> REVIEW -> IMPLEMENTASI       |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [FASE 1: GENERATE DESAIN IMPROVE DI GOOGLE STITCH]                                     |
|    - MCP Tool: sp_generate(projectId: 16163536889170895948)                            |
|    - Memadukan komponen eksisting (Header, KPI Sidebar, Peta, Drawer Kanan, Tabel)      |
|    - Menerapkan standar Parry UI (Ivosight) + WCAG 2.1 AA Accessibility + Responsive    |
|                                                                                         |
|                                         v                                               |
|  [FASE 2: HUMAN REVIEW DI GOOGLE STITCH WEB]                                            |
|    - User membuka https://stitch.withgoogle.com/projects/16163536889170895948           |
|    - User memeriksa tata letak visual, warna, hierarki card, dan estetika               |
|    - User memberikan masukan revisi atau persetujuan ("Implementasikan")                |
|                                                                                         |
|                                         v                                               |
|  [FASE 3: IMPLEMENTASI KE KODEBASE LOKAL (ZERO-RISK SANDBOX)]                           |
|    - Ekstraksi token warna, layout HTML, dan aturan CSS dari Stitch                      |
|    - Terapkan ke index-v2.html dan assets/css/parry-theme.css                           |
|    - File produksi index.html dan styles.css tetap utuh 100% aman                       |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

### 2.1. Standar Desain Parry UI yang Diadopsi (Design Tokens)
1. **Palet Warna & Permukaan**:
   * Background kanvas: `bg-slate-50` (`#f8fafc`).
   * Permukaan kartu (*card surface*): Putih bersih dengan border tipis `border-slate-200` (`#e2e8f0`).
   * Teks utama: `text-slate-900` (`#0f172a`), label sekunder: `text-slate-500` (`#64748b`).
   * Aksen primer: Deep Emerald / Corporate Teal (`#0d9488` / `#0f766e`).
2. **Sudut Membulat (*Border Radius*)**:
   * Card & Panel: `rounded-xl` (12px) konsisten.
   * Status Pill / Badge: `rounded-full` (kapsul).
3. **Badge Status Berwarna Pastel (Khas Parry UI)**:
   * **Aktif / Terverifikasi:** `bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20`.
   * **Masa Tenggang / Peringatan:** `bg-amber-50 text-amber-700 ring-1 ring-amber-600/20`.
   * **Kadaluarsa / Belum Terdaftar:** `bg-rose-50 text-rose-700 ring-1 ring-rose-600/20`.
4. **Bayangan Halus (*Elevation*)**:
   * `shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`), bebas dari efek *floating* berlebihan.

### 2.3. Eliminasi AI Slop (Pembersihan Emoticon & Simbol Murahan)
Mengacu pada aturan ketat **antislop**:
- **Hapus Seluruh Emoticon Tab di `profil.html`:** Menghapus simbol hati (♥), daun (❦), dan bintang (★) dari 9 tab dossier; menggantinya dengan ikon SVG minimalis (stroke 1.5px) atau teks label murni yang bersih.
- **Purifikasi Data Metrik BPS di `Profil.js`:** Menghilangkan emoji makanan/komoditas (`🌾`, `🥔`, `🐟`, `🥩`, `🥚`), cuaca/bencana (`🌪️`, `🌊`), dan piala (`🏆`); menggantinya dengan label tipografi rapi dan visual data point standar korporat.
- **Standarisasi Status Badge di `potensi.js` & `index.html`:** Mengganti emoji status (`⚠️`, `🔴`, `🟢`, `📅`) pada filter kontrak dan POI menjadi badge pastel Parry UI berbasis ring CSS (misal `bg-amber-50 text-amber-700 ring-1 ring-amber-600/20`).

### 2.2. Empat Modul yang Direvamp
1. **Sidebar Kiri (KPI Stat Cards & Filter Pills - Template `dashboard-01` & `contacts-01`)**:
   * Card metrik `POI Terpetakan`, `Perlu Verifikasi`, dan `Potensi Indikatif` diubah menjadi kartu stat modern dengan icon berlatar warna lembut dan progress bar verifikasi.
   * Filter pill kategori POI ditambahkan angka counter real-time: `Semua (133)`, `Billboard / Reklame (98)`, `Parkir Komersial (35)`.
   * Menambahkan tombol toggle collapse `[ < ]` pada sidebar agar peta leluasa dilihat saat dibutuhkan.
2. **Harmonisasi Basemap Peta**:
   * Mengintegrasikan opsi basemap bernuansa bersih (*CartoDB Positron / Soft Gray*) agar menyatu harmonis dengan panel putih slate Parry UI.
3. **Drawer Detail Objek Kanan (Slide-Over Context Drawer - Template `leads-pipeline-01`)**:
   * Mengganti modal mengambang statis menjadi *Slide-Over Drawer* dari sisi kanan layar.
   * Mengganti kotak hitam foto kosong dengan kartu visual estetik (banner gradien halus dengan icon kamera dan status registrasi).
   * Pengelompokan data menjadi 2 tab terstruktur:
     * **Tab 1: Ringkasan Pajak & Penagihan** (Estimasi pendapatan, status izin, countdown kontrak, tombol WhatsApp resmi).
     * **Tab 2: Spesifikasi Teknis & Log** (Dimensi ukuran, vendor, operator, histori survei Satgas Bapenda).
4. **Mode Tampilan Tabel POI (Template `report-01`)**:
   * Header tabel bernuansa slate-100, baris data dengan efek hover lembut, badge status izin berwarna pastel, dan pagination navigasi modern.

---

## 3. Daftar File yang Terdampak (Affected Files)

1. `[ Buat Baru ]` `docs/2026-11-11/planning-revamp-ui-parry-design-system-lokal.md`
   - Dokumen perencanaan permanen.
2. `[ Buat Baru ]` `index-v2.html`
   - Halaman sandbox eksperimen independen untuk evaluasi *Before vs After*.
3. `[ Buat Baru ]` `assets/css/parry-theme.css`
   - File stylesheet override berbasis token Parry UI tanpa merusak `styles.css`.
4. `[ Penyesuaian Modular ]` `assets/js/core/potensi.js`
   - Penyesuaian markup string template (KPI cards, counter pill, slide-over drawer, dan smart fallback foto) serta pembersihan emoji status.
5. `[ Pembersihan Anti-Slop ]` `profil.html` & `assets/js/core/Profil.js`
   - Pembersihan simbol emoticon murahan (★, ❦, ♥, 📊, 🌾, 🥔, dll) pada tab dossier dan kartu metrik, diganti dengan ikon SVG monokrom atau tipografi bersih.

---

## 4. Langkah Eksekusi (Actionable Steps)

- [x] **Tahap 1: Validasi Rencana & Penyesuaian Alur Kolaborasi Stitch**
  - Mengadopsi workflow: Generate di Stitch $\rightarrow$ Review oleh User $\rightarrow$ Implementasi ke `index-v2.html`.
- [ ] **Tahap 2: Generate Rancangan UI Versi Improve ke Google Stitch (3 Screen Representatif)**
  - Mengirim prompt perancangan ke project Stitch ID `16163536889170895948` secara modular agar tidak sesak (*cluttered*):
    1. **Screen 1 (Dashboard Utama - Map View):** Top bar korporat, left sidebar (KPI summary cards & pill filter kategori PAD360), map viewport mockup dengan floating contextual strip dan custom legend.
    2. **Screen 2 (Slide-Over Detail Drawer):** Panel inspeksi detail saat objek pajak diklik (foto banner SVG, kalkulasi rupiah, countdown izin/kontrak, tombol navigasi/verifikasi).
    3. **Screen 3 (Direktori Tabel Analitik - Report View):** Tampilan tabel POI penuh dengan search bar, filter preset jatuh tempo (≤ 30 hari, kadaluarsa), dan pagination.
  - Memastikan standar WCAG 2.1 AA dan styling Parry UI (Slate-50, border-slate-200, emerald accents).
- [ ] **Tahap 3: Review Desain oleh Pengguna di Web Google Stitch**
  - Pengguna meninjau kanvas visual di `https://stitch.withgoogle.com/projects/16163536889170895948`.
  - Pengguna memeriksa apakah estetika, warna, dan hierarkinya sudah sesuai standar korporat Ivosight.
  - Pengguna memberikan koreksi visual atau persetujuan eksekusi ("Sudah pas, implementasikan").
- [ ] **Tahap 4: Implementasi ke Codebase Lokal (`index-v2.html` & `parry-theme.css`)**
  - Menerjemahkan token visual dari Stitch ke stylesheet lapisan `assets/css/parry-theme.css` dan markup sandbox `index-v2.html`.
  - Menjaga keutuhan logic Leaflet JS dan event handler lokal tanpa menyentuh file `index.html` produksi.
  - Pembersihan total artefak AI-slop (emoticon/emoji murahan pada tab `profil.html`, kartu metrik `Profil.js`, dan status badge `potensi.js`), diganti dengan ikon SVG monokrom atau tipografi profesional.
  - Pengujian visual komparatif di `http://localhost:3000/index-v2.html`.

---

## 5. Batasan, Risiko & Catatan Tambahan (Constraints & Edge Cases)

1. **Jaminan Nol Risiko Produksi (*Zero-Risk Guarantee*)**:
   - File `index.html` dan `assets/css/styles.css` asli **dilarang keras dimodifikasi atau dihapus**. File tersebut menjadi jaring pengaman jika atasan meminta demo versi stabil kapan pun.
2. **Performa Render Peta Leaflet**:
   - Saat panel sidebar kiri atau drawer kanan di-toggle (buka/tutup), panggil `map.invalidateSize()` dengan jeda transisi (`setTimeout`) agar canvas peta Leaflet tidak mengalami distorsi atau area kosong abu-abu.
3. **Penyimpanan Lokal Saja**:
   - Selama fase eksperimen dan pengujian lokal, seluruh file eksperimen **tidak boleh di-push ke repositori remote**.

