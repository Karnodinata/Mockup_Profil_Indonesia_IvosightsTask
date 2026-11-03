# Dokumen Perencanaan Teknis: Sinkronisasi & Penyesuaian Sidebar Kanan (Sliding Drawer) Antar-Mode

| **Atribut** | **Detail** |
|---|---|
| **Tanggal Pembuatan** | 14 Oktober 2026 |
| **Status** | ✅ Disetujui Pengguna (Pilihan: Opsi 1 - Auto-Close Sederhana & Reset Total) |
| **Target Berkas** | `potensi.js`, `Map.js` |
| **Dokumen Acuan** | `docs/PLANNING_FIX_MODE_SWITCH_DAN_DYNAMIC_SEMANTIC_ZOOM.md`, `docs/PLANNING_FITUR_TABEL_PETA_POTENSI_DAN_KONTRAK_POI.md` |
| **Bukti Masalah** | Tangkapan Layar 1 (Profil Sukamara tertinggal di Peta Potensi) & Tangkapan Layar 2 (POI Mall Subang tertinggal di Profil Daerah) |

---

## 1. Identifikasi Masalah & Akar Penyebab Teknis

### 1.1 Kondisi Teramati (Visual Evidence)
Berdasarkan dua tangkapan layar yang dilampirkan:

1. **Kasus 1 — Kebocoran Profil Wilayah ke Peta Potensi (Gambar 1):**
   * Mode aktif pada navbar adalah **Peta Potensi** (tombol *Peta Potensi* aktif, sidebar kiri menampilkan *Indikasi Potensi Nasional*, *Filter Kategori POI*, dan agregat 7 wilayah).
   * Namun, sidebar kanan (`#regionPanel`) tetap terbuka dan menampilkan data statistik BPS **Kabupaten Sukamara, Kalimantan Tengah** (Kepadatan Penduduk 77 jiwa/km², Bupati H. Masduki, S.T., Penduduk, Luas, IPM, PDRB, dan tombol *"Buka Profil Lengkap & Sektoral"*).
   * Data ini tidak relevan dengan mode Peta Potensi Pajak (PAD360).

2. **Kasus 2 — Kebocoran Objek Pajak/POI ke Profil Daerah (Gambar 2):**
   * Mode aktif pada navbar adalah **Peta Interaktif / Profil Daerah** (tombol *Peta Interaktif* aktif, sidebar kiri menampilkan *Indikator Tematik Kepadatan Penduduk*, peta menampilkan choropleth BPS).
   * Namun, sidebar kanan (`#regionPanel`) tetap terbuka dan menampilkan detail operasional **POI Mall & Pusat Belanja: Lifestyle Mall & Hypermarket Subang 3** (Estimasi Pajak Rp 310.000.000/tahun, Masa Kontrak 363 Hari, tombol *"Hubungi Pengelola"* via WhatsApp, spesifikasi luas 3.150 m², dll.).
   * Data operasional komersial ini tidak relevan dengan visualisasi tematik BPS.

---

### 1.2 Akar Masalah Teknis ([High confidence])
1. **Single Shared DOM Container:**
   Sidebar kanan menggunakan kontainer bersama `<aside class="region-panel" id="regionPanel">` dengan satu elemen `<div id="rpContent"></div>`.
   * Saat `Map.js` memilih wilayah (`selectRegion`), `rpContent.innerHTML` diisi statistik BPS dan drawer dibuka.
   * Saat `potensi.js` memilih POI (`renderDetailPanel`), `rpContent.innerHTML` diisi detail POI PAD360 dan drawer dibuka.
2. **Ketiadaan Handler Reset pada `setMode()`:**
   Fungsi `setMode(mode)` di [`potensi.js`](file:///c:/laragon/www/PKL/mockup/potensi.js) mengatur navbar, filter kiri, status strip, dan layer Leaflet, namun **sama sekali tidak menutup atau mereset `#regionPanel`**, sehingga data yang dibuka pada mode sebelumnya tetap terpampang di layar.

---

## 2. Pilihan Pendekatan yang Disetujui: Opsi 1 (Auto-Close Sederhana & Reset Total)

Pengguna memilih **Opsi 1**:
Setiap kali terjadi perpindahan mode (Profil $\leftrightarrow$ Potensi) maupun pergantian view (Peta $\leftrightarrow$ Tabel):
1. Drawer sidebar kanan (`#regionPanel`) langsung ditutup dengan membuang class `.open`.
2. Animasi CSS slide-out (`transform: translateX(440px)` / durasi 350ms) dibiarkan berjalan halus.
3. Setelah animasi selesai (360ms), isi konten `#rpContent` dibersihkan (`innerHTML = ''`) agar tidak ada data usang atau *content flashing*.
4. Variabel pelacak seleksi aktif dibersihkan:
   * Pada `Map.js`: `selectedRegion = null`
   * Pada `potensi.js`: `this.state.selectedObject = null`
5. Ketika pengguna mengklik objek baru pada mode yang sedang aktif, drawer akan membuka kembali dengan data yang 100% segar dan relevan.

---

## 3. Rencana Tindakan Teknis (Action Plan)

### 3.1 Modifikasi pada `Map.js`
1. Ekspos fungsi penutup panel ke lingkup global:
   ```javascript
   window.closeProfilePanel = function() {
       closePanel();
   };
   ```
2. Pastikan pembersihan variabel seleksi dan koordinasi dengan tombol `#rpClose`.

### 3.2 Modifikasi pada `potensi.js`
1. Tambahkan method helper penutup drawer pada class `PotensiEngine`:
   ```javascript
   closeDetailPanel(immediateClear = false) {
       if (this.regionPanel) {
           this.regionPanel.classList.remove('open');
       }
       this.state.selectedObject = null;
       if (this._rpClearTimer) clearTimeout(this._rpClearTimer);
       if (immediateClear) {
           if (this.rpContent) this.rpContent.innerHTML = '';
       } else {
           this._rpClearTimer = setTimeout(() => {
               if (this.regionPanel && !this.regionPanel.classList.contains('open') && this.rpContent) {
                   this.rpContent.innerHTML = '';
               }
           }, 360);
       }
   }
   ```
2. Batalkan timer pembersihan saat membuka objek baru:
   Di `renderDetailPanel(obj)` dan `renderCheckpointDetail()`:
   ```javascript
   if (this._rpClearTimer) clearTimeout(this._rpClearTimer);
   this.state.selectedObject = obj;
   ```
3. Panggil pembersihan drawer di dalam `setMode(mode)`:
   * Saat `setMode('potensi')`: panggil `this.closeDetailPanel()` dan `window.closeProfilePanel?.()`.
   * Saat `setMode('profil')`: panggil `this.closeDetailPanel()` dan `window.closeProfilePanel?.()`.
4. Pastikan klik tombol view switcher (`btnViewTable` dan `btnViewMap`) juga memicu penutupan drawer secara konsisten.

---

## 4. Kriteria Keberhasilan (Definition of Done)

* [ ] Pengguna membuka Kabupaten Sukamara di Mode Profil Daerah $\rightarrow$ klik tombol *Peta Potensi* $\rightarrow$ drawer kanan langsung menutup rapi, tidak ada profil Sukamara yang tertinggal.
* [ ] Pengguna membuka POI Lifestyle Mall Subang di Mode Peta Potensi $\rightarrow$ klik tombol *Profil Daerah* / *Peta Interaktif* $\rightarrow$ drawer kanan langsung menutup rapi, tidak ada detail Mall yang tertinggal.
* [ ] Saat drawer meluncur keluar (slide-out), animasi berjalan mulus tanpa kedip (*no content glitch*).
* [ ] Mengklik marker POI baru di Peta Potensi atau mengklik poligon wilayah baru di Profil Daerah membuka drawer dengan data segar secara presisi.
* [ ] Tombol close `#rpClose` dan tombol keyboard `ESC` tetap berfungsi menutup panel seperti biasa.
