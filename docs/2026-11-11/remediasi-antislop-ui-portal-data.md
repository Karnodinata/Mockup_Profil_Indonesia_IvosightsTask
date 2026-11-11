---
title: "Remediasi Total AI Slop Menggunakan Aturan antislop-ui pada Portal Data Daerah"
date: 2026-11-11
status: Completed
---

# Remediasi Total AI Slop Menggunakan Aturan antislop-ui pada Portal Data Daerah

## 1. Konteks & Tujuan (Objective)
Berdasarkan evaluasi terhadap hasil eksplorasi eksternal menggunakan Google Stitch, diputuskan untuk **menghentikan seluruh ketergantungan pada Google Stitch**. Alasan teknis dan estetika:
1. Google Stitch memproduksi mock-up SVG generik statis yang mengabaikan binding interaktif lokal (Leaflet 1.9.4, GeoJSON multi-layer, virtualized tables, dan Chart.js/SVG quad charts).
2. Tampilan hasil regenerasi AI eksternal cenderung memperkenalkan *AI-slop* baru: kartu bertumpuk generik, gradien ungu-biru, dan pola bento-grid yang tidak cocok untuk portal data instansi pemerintah / analis ekonomi regional.
3. Kebutuhan riil proyek saat ini bukan merombak struktur layout dari nol, melainkan **membersihkan jejak AI slop (AI-tells)** di dalam kode lokal yang ada agar tampilan menjadi profesional, berstandar enterprise (Parry UI), dan bebas dari elemen dekoratif murahan.

Tujuan utama dokumen perencanaan ini:
- Menjalankan audit menyeluruh dan remediasi *anti-slop* berpedoman ketat pada skill `antislop-ui` (`C:\Users\gigal\.gemini\config\plugins\antislop\skills\antislop-ui\SKILL.md`) dan `antislop` core rules.
- Mengeliminasi 100% dekorasi emoji literal di UI, teks header, tombol, tab bar, dan badge status di seluruh file frontend aktif.
- Menstandarkan sistem ikonografi menggunakan inline SVG monokromatik (stroke 2px, 24x24 viewBox) yang sudah konsisten dipakai di modul chart dan filter.
- Menertibkan status badge (kontrak, kadaluarsa, verifikasi) agar menggunakan semantik label teks berbobot dengan kontras tinggi, bukan kombinasi dot-pulsing atau emoji kapsul.

---

## 2. Ruang Lingkup & Arsitektur (Scope & Architecture)

### 2.1 Kaidah antislop-ui yang Diterapkan
1. **Pembersihan Emoji Dekoratif (`Emoji as Decoration` / R-04)**:
   - *Tell saat ini*: Terdapat lebih dari 80 kemunculan literal emoji (seperti `★`, `❦`, `♥`, `📊`, `📑`, `🏆`, `🌪️`, `🏢`, `🛫`, `🛣️`, `💡`, `📈`, `🔴`, `⚠️`, `🟢`, `🌾`, `🥔`, dll.) di dalam tab navigation, label kartu, dan badge status.
   - *Solusi*: Seluruh emoji dihapus dari teks salinan UI. Komponen yang membutuhkan indikator grafis wajib menggunakan inline SVG presisi atau label teks murni.
2. **Kerapian Badge & Indikator Status (`AI Capsule Badges & Decorative Status Dots` / R-09, R-19, R-31)**:
   - Mengganti teks `🔴 Kadaluarsa (X hari lalu)` menjadi badge terstruktur `<span class="pot-badge pot-badge-expired">Kadaluarsa (Xh lalu)</span>`.
   - Mengganti teks `⚠️ Sisa X Hari` menjadi badge `<span class="pot-badge pot-badge-warning">Sisa X Hari</span>`.
   - Menghapus emoji rating `★` pada popup Leaflet dan menggantinya dengan format tabular numerik terukur (contoh: `4.5 / 5.0`).
3. **Standarisasi Tab Bar Profil Daerah**:
   - Tab navigasi 9 modul pada `profil.html` saat ini memuat simbol geometri acak (`★`, `◔`, `▣`, `◉`, `◆`, `▤`, `❦`, `♥`, `▦`).
   - Solusi: Bersihkan glyph acak tersebut. Gunakan label tipografi bersih yang didukung aksen indikator garis bawah aktif (`var(--teal)`).
4. **Pembatasan Palet Warna & Elevasi (`Palette Cap & Excessive Elevation` / R-12, R-29)**:
   - Menghindari shadow blur yang berlebihan yang membuat kartu tampak "melayang tanpa bobot".
   - Menggunakan border solid berdensitas halus (`1px solid var(--line, #E2E8F0)`) dengan border-radius terukur (6px–8px) sesuai Parry Design System.

---

## 3. Daftar File yang Terdampak (Affected Files)

1. `[ Modifikasi ]` [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html)
   - Membersihkan 9 tab bar icons dari glyph acak (`★`, `❦`, `♥`, dll.).
   - Menghapus dan mengganti emoji di header bagian Investasi, Bandara, Kemiskinan, PDRB, Industri, dan Tanggap Darurat dengan inline SVG bersih.
2. `[ Modifikasi ]` [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js)
   - Membersihkan emoji pada array kategori konsumsi makanan (14 kategori Susenas) dan menggantinya dengan swatch dot warna/label teks bersih.
   - Membersihkan emoji/glyph pada chart gender (`♂`, `♀`) dan notifikasi maritim (`🌊`).
3. `[ Modifikasi ]` [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html)
   - Mengganti emoji filter kontrak di bilah tabel potensi (`⚠️ ≤ 30 Hari`, `📅 31-60 Hari`, `🔴 Kadaluarsa`) menjadi pill badge berbasis teks semantik bersih.
   - Mengganti emoji search `🔍` menjadi inline SVG search icon.
4. `[ Modifikasi ]` [`assets/js/core/potensi.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/potensi.js)
   - Membersihkan string literal emoji pada template badge kontrak (`🔴 Kadaluarsa`, `⚠️ Sisa`, `🟢 Aktif`).
   - Mengganti bintang emoji `★` pada tooltip dan popup dengan skor numerik berbobot.
   - Menghapus emoji `💬`, `👁️`, `📍` pada tombol aksi tabel dan detail POI, digantikan dengan inline SVG atau teks semantik yang jelas.
5. `[ Modifikasi ]` [`assets/css/styles.css`](file:///c:/laragon/www/PKL/mockup/assets/css/styles.css)
   - Menambahkan utilitas badge semantik Parry (`.pot-badge`, `.pot-badge-danger`, `.pot-badge-warning`, `.pot-badge-info`, `.pot-badge-success`) agar rendering status konsisten dan tidak menggunakan inline style bercampur emoji.

---

## 4. Langkah Eksekusi (Actionable Steps)

### Tahap 1: Remediasi Tab Bar & Static Header di `profil.html`
- [x] Buka `profil.html` pada bagian `<nav class="tabbar" id="tabbar">`. Hapus elemen `<span class="tab-i">...</span>` yang memuat glyph acak (`★`, `◔`, `▣`, `◉`, `◆`, `▤`, `❦`, `♥`, `▦`).
- [x] Lakukan penggantian emoji pada header kartu modul:
  - Bagian BKPM: ganti `📊`, `📑`, `🏆`, `🌪️`, `🏢`, `📍` dengan inline SVG linier.
  - Bagian Bandara & Jalan: ganti `✈`, `🛫`, `🛣️` dengan inline SVG transportasi yang presisi.
  - Bagian Kemiskinan & Sosial: ganti `🏢`, `📈`, `👥`, `💡`, `🎯` dengan inline SVG analytics.
  - Bagian Industri & Bencana: ganti `🏭`, `👛`, `⚙️`, `🛡`, `⚡`, `🚨`, `📜` dengan inline SVG.

### Tahap 2: Remediasi Dynamic Template Strings di `assets/js/core/Profil.js`
- [x] Ubah definisi `standardCategories` pada modul konsumsi agar `icon` tidak menggunakan literal emoji makanan (`🌾`, `🥔`, `🐟`, dll.), melainkan diganti dengan indikator swatch dot warna atau kode kelas SVG.
- [x] Bersihkan teks log dan banner maritim dari emoji `🌊`.
- [x] Rapikan label gender pada chart demografi SDM.

### Tahap 3: Remediasi Filter & Table di `index.html` dan `assets/js/core/potensi.js`
- [x] Edit `index.html` pada tombol filter kontrak: ubah teks menjadi label murni tanpa emoji (`≤ 30 Hari`, `31–60 Hari`, `Kadaluarsa`).
- [x] Edit `assets/js/core/potensi.js`:
  - Standarisasi fungsi pembuat status kontrak (baris ~1670 dan ~2316) menjadi format badge HTML semantik tanpa emoji `🔴`, `⚠️`, `📅`, `🟢`.
  - Format ulasan dan rating: ubah perulangan `'★'.repeat(...)` menjadi tampilan badge numerik yang tegas (misal: `Rating: 4.8 / 5.0`).
  - Ganti tombol aksi `💬 Hubungi WA` dan `👁️` menjadi tombol terstruktur dengan ikon SVG atau teks jelas `WhatsApp` dan `Detail`.

### Tahap 4: Verifikasi & Audit Kepatuhan (Delivery Gate antislop-ui)
- [x] Jalankan skrip PowerShell audit regex pencarian unicode emoji `[\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF]` di seluruh file proyek.
- [x] Pastikan tidak ada satupun emoji dekoratif tersisa di area UI publik.
- [x] Pastikan seluruh fungsionalitas interaktif (Leaflet marker, filtering tabel, chart zoom, modal dialog) tetap berjalan 100% tanpa error di console JavaScript.

---

## 5. Batasan, Risiko & Catatan Tambahan (Constraints & Edge Cases)

1. **Integritas Selektor JavaScript**:
   - Sebagian kode JavaScript mungkin memeriksa `textContent` dari sebuah tombol (misal pengecekan filter). Pastikan penggantian emoji hanya menyentuh visual dan tidak merusak `dataset` (`data-contract-filter`, `data-obj-id`, dll.).
2. **Kerapian Rendering Tanpa Font Eksternal Tambahan**:
   - Hindari memasukkan library icon font baru yang berat (seperti FontAwesome 500KB). Cukup manfaatkan inline SVG ringan yang sudah menjadi standar di proyek atau CSS-drawn dots untuk indikator status.
3. **Zero Breaking Changes**:
   - Seluruh endpoint data lokal (`data/peta-potensi/`, `data/profil-daerah/`) dan struktur DOM Leaflet harus tetap kompatibel sepenuhnya.
