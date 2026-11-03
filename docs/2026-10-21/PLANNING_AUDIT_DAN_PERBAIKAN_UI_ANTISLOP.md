# Dokumen Perencanaan Teknis: Audit & Perbaikan UI Berstandar Anti-Slop

| **Atribut** | **Detail** |
|---|---|
| **Kode Dokumen** | `PLAN-ANTISLOP-001` |
| **Lokasi File** | [`docs/PLANNING_AUDIT_DAN_PERBAIKAN_UI_ANTISLOP.md`](file:///c:/laragon/www/PKL/mockup/docs/PLANNING_AUDIT_DAN_PERBAIKAN_UI_ANTISLOP.md) |
| **Dokumen Audit Terkait** | [`anti-slop/audit-001-2026-10-21.md`](file:///c:/laragon/www/PKL/mockup/anti-slop/audit-001-2026-10-21.md) |
| **Tanggal Pembuatan** | 21 Oktober 2026 |
| **Kategori** | Refactoring UI, Aksesibilitas WCAG, Estetika Brand, & Anti-Slop |
| **Status Perencanaan** | 🟢 Selesai & Terverifikasi (Siap Diuji Lokal) |
| **Aturan Tambahan** | ⛔ **DILARANG PUSH KE GITHUB** (Pengujian Lokal Penuh Dahulu) |
| **Target Berkas** | [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html), [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html), [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css), [`assets/js/core/`](file:///c:/laragon/www/PKL/mockup/assets/js/core/) |

---

## 1. Latar Belakang & Tujuan

Proyek ini telah memiliki fungsionalitas peta dan data yang sangat kaya, namun secara visual masih mengandung pola bawaan generator AI (*AI Slop*) yang mengurangi karakter otentik produk. Sesuai panduan **Anti-Slop Mode 2 (AFTER)**:
1. Melakukan audit komprehensif pada seluruh tampilan UI ([`anti-slop/audit-001-2026-10-21.md`](file:///c:/laragon/www/PKL/mockup/anti-slop/audit-001-2026-10-21.md)).
2. Menyusun daftar temuan bernomor dengan prioritas terukur (#1 s/d #11).
3. Mengeksekusi seluruh temuan dengan tahapan ber-checkpoint ketat tanpa melakukan push ke remote GitHub.

---

## 2. Tabel Checkpoint Eksekusi (Milestone Tracking)

| Checkpoint | Target Cakupan | Status | Tanggal / Waktu | Verifikasi |
|---|---|---|---|---|
| **CP-01: Baseline & Planning** | Finalisasi audit 11 temuan dan persetujuan eksekusi lokal | ✅ Selesai | 21 Okt 2026, 11:05 | Dokumen audit & perencanaan tersimpan |
| **CP-02: Hard Gate (Aksesibilitas & Integrity)** | Temuan #1, #2, #3, #4 (Em dash, WCAG 4.5:1, Focus ring, Empty state) | ✅ Selesai | 21 Okt 2026, 11:10 | Test kontras & tab keyboard lolos |
| **CP-03: Purpose Gate (De-Slop Visual)** | Temuan #5, #6, #7, #8 (Glassmorphism, Ground-dot pin, DM Sans typography, Hapus radial orbs) | ✅ Selesai | 21 Okt 2026, 11:13 | Inspeksi visual pin & tipografi lolos |
| **CP-04: Quality Locks & Code Cleanliness** | Temuan #9, #10, #11 (Standarisasi radius, unifikasi desain profil.html, konsolidasi 1.584 baris CSS) | ✅ Selesai | 21 Okt 2026, 11:24 | CSS terpusat & 1.584 baris style inline dipurged |
| **CP-05: Delivery Gate & Pengujian Lokal** | Uji coba interaktif di browser lokal, validasi console, checklist antislop final | ✅ Selesai | 21 Okt 2026, 11:26 | 0 error syntax, UI terintegrasi, **NO PUSH** |

---

## 3. Matriks Rencana Aksi Temuan Rinci

### Fase 1: Temuan Prioritas TINGGI (Hard Gate) — Target CP-02
- [x] **Temuan #1 (R-02 Copywriting)**: Bersihkan karakter em dash (`—`) dari tag `<title>` di [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html) dan [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html), ganti dengan titik dua (`:`).
- [x] **Temuan #2 (R-25 Color Contrast)**: Kalibrasi ulang nilai `--text-low` dan `--muted-2` ke `#475569` agar rasio kontras teks normal mencapai $> 4.5:1$ (lolos WCAG AA).
- [x] **Temuan #3 (R-32 Keyboard Accessibility)**: Ganti semua aturan `outline: none` dengan indikator fokus custom `:focus-visible { outline: 2px solid var(--merah); outline-offset: 2px; }`.
- [x] **Temuan #4 (R-27 UI States)**: Lengkapi pesan penjelas dan tombol aksi pemulihan pada dropdown pencarian dan filter wilayah saat kosong.

### Fase 2: Temuan Prioritas SEDANG (Purpose-Gate) — Target CP-03
- [x] **Temuan #5 (R-10 Glassmorphism)**: Terapkan *dose cap* maksimal 1 elemen aktif untuk `backdrop-filter`. Ubah latar belakang modal tabel dan legenda menjadi solid bersih.
- [x] **Temuan #6 (R-13 Glow Everywhere)**: Hapus 3 lapis cincin berdenyut konsentris pada pin cluster peta; ganti dengan *pin ground-dot* yang bersih dan elegan.
- [x] **Temuan #7 (R-06 Typography)**: Batasi penggunaan font monospace (`Roboto Mono`) hanya untuk data numerik tabular; kembalikan teks tombol dan label peran ke `DM Sans`.
- [x] **Temuan #8 (R-07 Background Radial Orbs)**: Hapus gradien radial kabur raksasa pada latar `profil.html`; ganti dengan kanvas warna `--cream-100`.

### Fase 3: Temuan Prioritas RENDAH (Quality Locks & Arsitektur) — Target CP-04
- [x] **Temuan #9 (R-11 Border Radius)**: Disiplinkan radius: $8\text{px}$ untuk input/tombol, $12\text{px}$ untuk kartu. Bentuk *pill* (`99px`) hanya untuk badge status/kategori.
- [x] **Temuan #10 (R-29 Fragmentasi Desain)**: Hubungkan `profil.html` ke berkas `assets/css/styles.css` agar warna dan token desain seragam di seluruh portal.
- [x] **Temuan #11 (R-05 & Code Cleanliness)**: Rapikan dan bersihkan 1.584 baris tag `<style>` inline yang membengkak di dalam [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html).

---

## 4. Kriteria Kelulusan (Delivery Gate) — Target CP-05

Sebelum dinyatakan selesai:
1. Tidak ada teks yang gagal kontras warna WCAG AA (diuji via script / DevTools).
2. Navigasi penuh via keyboard `Tab` dapat menyorot seluruh kontrol interaktif secara jelas.
3. Tampilan bebas dari efek berdenyut tanpa akhir (*endless loops*) dan gradien radial AI generik.
4. Kode sumber bersih tanpa duplikasi ribuan baris CSS inline.
5. **Konfirmasi ketat**: Perubahan hanya disimpan di Git lokal, sama sekali tidak di-push ke remote GitHub.
