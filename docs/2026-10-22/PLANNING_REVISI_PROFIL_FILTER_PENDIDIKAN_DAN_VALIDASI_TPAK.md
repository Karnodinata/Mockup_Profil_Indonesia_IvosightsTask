# Perencanaan Teknis: Revisi Filter Berjenjang, Validasi TPAK, Penataan SLB, dan Angka Riil Pertanian

Dokumen ini memuat analisis kritis (*evidence-aware*), kajian ergonomi antarmuka sesuai prinsip `/antislop-ui`, dan rencana aksi eksekusi teknis bertahap untuk menindaklanjuti 5 masukan lanjutan dari pengguna dan klien pada sistem Profil Wilayah ([`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html)) dan Portal Peta Wilayah ([`index.html`](file:///c:/laragon/www/PKL/mockup/index.html)).

---

## 1. Analisis Kritis & Investigasi Masalah (Evidence-Aware)

### Poin 1: Penempatan SLB di Paling Atas (Di Atas PAUD & TK) Sesuai Permintaan Klien
* **Konteks & Arahan Klien**:
  - Klien pengguna meminta agar **Sekolah Luar Biasa (SLB)** dipindahkan posisinya ke urutan nomor 1 (paling atas, sebelum PAUD & TK) pada grafik sarana pendidikan di Tab Sosial.
* **Analisis Teknis & Mitigasi Tampilan (`/antislop-ui`)**:
  - Secara default sistem sebelumnya, SLB berada di urutan ke-9 (penutup rumpun pendidikan dasar & menengah).
  - Dengan menempatkan SLB di paling atas, susunan array jenjang pendidikan di [`Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) menjadi:
    `1. SLB` $\rightarrow$ `2. PAUD & TK` $\rightarrow$ `3. SD` $\rightarrow$ `4. MI` $\rightarrow$ `5. SMP` $\rightarrow$ `6. MTs` $\rightarrow$ `7. SMA` $\rightarrow$ `8. MA` $\rightarrow$ `9. SMK` $\rightarrow$ `10. Perguruan Tinggi (PT)`.
  - **Mitigasi Visual**: Karena jumlah SLB umumnya jauh lebih sedikit dibandingkan SD/TK (misal di Indramayu SLB = 7 vs TK = 1.147), batang SVG SLB dengan nilai kecil harus tetap memiliki garis dasar dan angka yang terbaca tegas tanpa merusak proporsi batang lainnya.

---

### Poin 2: Angka Riil Pertanian Penuh (Tanpa Singkatan `Jt` & `Rb`) & Penyesuaian UI
* **Kelemahan Format Eksisting**:
  - Fungsi `fmtVol` dan `fmtItemVal` di [`Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L1571-L1617) saat ini memotong nilai dengan membagi $1.000.000$ menjadi `1,4 Jt Ton` atau $1.000$ menjadi `141,9 Rb Ton`.
  - Hal ini menghilangkan presisi data resmi BPS (misalnya $1.423.890$ ton dibulatkan menjadi $1,4$ Jt, membuang $23.890$ ton).
* **Solusi Terencana**:
  - Ubah fungsi format angka agar mengembalikan bilangan riil penuh dengan format pemisah ribuan standar Indonesia: `Number(v).toLocaleString('id-ID')`.
  - Contoh transformasi:
    - `1,42 Jt Ton` $\rightarrow$ **`1.423.890 Ton`**
    - `141,9 Rb Ton` $\rightarrow$ **`141.920 Ton`**
    - `1,28 Jt Ekor` $\rightarrow$ **`1.284.500 Ekor`**
* **Penyesuaian Antarmuka (`/antislop-ui`)**:
  - Digit panjang pada kartu KPI atas dan baris komoditas berisiko terjadi *text clipping* atau penurunan baris tak beraturan (*awkward word-wrapping*).
  - Terapkan `font-variant-numeric: tabular-nums` dan font mono yang konsisten.
  - Berikan `min-width` yang memadai pada kolom angka komoditas (`.gc-sub-item b`) dan `white-space: nowrap` agar angka dan satuan (Ton / Ekor / Kg) selalu menyatu rapi dalam satu baris.

---

### Poin 3: Integrasi Modul Filter Berjenjang (Search + Provinsi + Kab/Kota)
* **Kebutuhan**:
  - Di [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html): Gantikan kotak pencarian dan tombol picker daerah lama di pojok kanan atas dengan modul filter berjenjang (Input Cari Nama + Dropdown Pilih Provinsi + Dropdown Pilih Kab/Kota).
  - Di [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html) (Mode Peta Profil Daerah): Tambahkan filter berjenjang serupa pada header navbar utama agar konsisten dengan Mode Peta Potensi.
* **Arsitektur Filter Berjenjang**:
  1. **Input Cari Bebas**: Mengetik kata kunci (nama kabupaten, kota, atau provinsi) memicu *search dropdown autocomplete*.
  2. **Dropdown Provinsi**: Memuat 38 provinsi di Indonesia secara alfabetis.
  3. **Dropdown Kab/Kota**: Terkunci (*disabled*) sebelum provinsi dipilih. Setelah provinsi dipilih, dropdown ini memuat seluruh kabupaten/kota di provinsi bersangkutan.
  4. **Interaksi Pemilihan**: Begitu daerah dipilih dari dropdown maupun hasil pencarian:
     - Di `profil.html`: Halaman langsung memuat daerah baru dengan tetap mempertahankan tab aktif.
     - Di `index.html`: Peta melakukan *flyToBounds* / zoom ke daerah tersebut dan membuka sidebar profil daerah.

---

### Poin 4: Investigasi & Perbaikan Anomali Data TPAK (`2.973,8%`) & Metadata Konsumsi
* **Temuan Akar Masalah TPAK 2.973,8% di Gambar Pengguna**:
  - Berdasarkan audit data langsung, nilai ekstrim **`2.973,8%`** terjadi di **Kabupaten Aceh Singkil (`id: 5`)**.
  - **Penyebab**: Di file dataset mentah [`data/json/data.json`](file:///c:/laragon/www/PKL/mockup/data/json/data.json) dan [`assets/js/data/Data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/Data.js), kolom `angkatan_kerja` Aceh Singkil secara keliru terisi **`2.714.515`** jiwa (ini merupakan angka total seluruh Provinsi Aceh), padahal jumlah total penduduk Aceh Singkil hanya **`140.432`** jiwa!
  - Hal serupa ditemukan di **Pidie Jaya (`id: 18`)** di mana `angkatan_kerja = 733.783` dengan penduduk hanya `170.580`.
* **Kelemahan Rumus Perhitungan TPAK di [`Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js#L992)**:
  - Rumus lama menggunakan pembagi perkiraan kasar `r.penduduk * 0.65`.
  - Di wilayah normal seperti Tasikmalaya, rumus kasar ini memunculkan angka **`95,4%`**, padahal data piramida kelompok usia BPS riil mencatat usia kerja 15+ di Tasikmalaya adalah $1.514.118$ jiwa sehingga TPAK riil adalah **`79,7%`**.
* **Solusi Perbaikan**:
  1. **Koreksi Data Anomali**: Perbaiki baris data Aceh Singkil dan Pidie Jaya di `data.json` dan `Data.js` ke angka proporsional Sakernas BPS yang valid.
  2. **Penyempurnaan Formula TPAK**:
     - Hitung jumlah penduduk usia kerja riil (15 tahun ke atas) dari data kelompok usia BPS:  
       $$\text{Usia Kerja (15+)} = \text{penduduk} - (u_{04} + u_{59} + u_{1014})$$
     - TPAK resmi = $(\text{Angkatan Kerja} / \text{Usia Kerja}) \times 100\%$.
     - Tampilkan dengan format **2 angka di belakang koma menggunakan pemisah koma khas Indonesia** (contoh: **`68,45%`** dan **`5,60%`**).
     - Pasang validasi matematis: jika data angkatan kerja tidak valid ($> \text{usia kerja}$), gunakan batas rasio wajar BPS ($65\% - 75\%$).
  3. **Metadata Tab Konsumsi**:
     - Tambahkan badge penanda rilis resmi `Data Resmi BPS (Susenas 2023/2024)` pada kartu ringkasan KPI Tab Konsumsi agar tampak eksplisit dan seragam dengan Tab Pertanian.

---

### Poin 5: Retensi Tab Aktif Saat Berganti Wilayah (*Preserve Active Tab*)
* **Masalah**:
  - Saat ini, setiap kali pengguna memilih daerah baru, halaman mereload ke URL default dan memanggil `switchTab(1)` (Profil Wilayah).
* **Solusi**:
  1. Setiap kali pengguna beralih tab, simpan ID tab ke `sessionStorage.setItem('active_profil_tab', tabId)` dan sinkronkan ke URL hash/query: `?id=174&tab=pertanian`.
  2. Saat fungsi navigasi / filter memilih daerah baru, teruskan parameter tab aktif: `profil.html?id=${targetId}&slug=${targetSlug}&tab=${activeTabId}`.
  3. Pada saat halaman selesai dimuat, controller memeriksa parameter URL atau `sessionStorage`. Jika ditemukan tab tersimpan, controller langsung membuka tab tersebut secara otomatis.

---

## 2. Rencana Aksi Eksekusi Bertahap (Actionable Checkpoints)

| Checkpoint | Target Komponen | File Terkait | Rincian Pekerjaan |
|:---|:---|:---|:---|
| **CP-16** | **Koreksi Anomali Data Ketenagakerjaan** | [`data/json/data.json`](file:///c:/laragon/www/PKL/mockup/data/json/data.json)<br>[`assets/js/data/Data.js`](file:///c:/laragon/www/PKL/mockup/assets/js/data/Data.js) | • Perbaiki nilai `angkatan_kerja`, `bekerja`, dan `pengangguran` pada Aceh Singkil (`id:5`) dan Pidie Jaya (`id:18`) menjadi angka riil proporsional Sakernas BPS.<br>• Pastikan tidak ada daerah dengan $\text{angkatan kerja} > \text{penduduk}$. |
| **CP-17** | **Penyempurnaan Rumus & Tampilan TPAK** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | • Ubah pembagi rumus TPAK menjadi populasi usia 15+ tahun riil dari piramida BPS.<br>• Batasi TPAK dalam rentang persentase valid dengan format 2 angka di belakang koma menggunakan koma Indonesia (`xx,xx%`, contoh: `68,45%`).<br>• Tambahkan penanda tahun rilis `Data Resmi BPS (Susenas 2023/2024)` pada KPI Tab Konsumsi. |
| **CP-18** | **Pemindahan Urutan SLB ke Paling Atas** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | • Pindahkan objek `Sekolah Luar Biasa (SLB)` ke indeks pertama (urutan paling atas) pada array sarana pendidikan `E`.<br>• Pastikan tinggi dan rendering SVG `#eduBar` tetap proporsional dan tidak bergeser. |
| **CP-19** | **Konversi Angka Riil Pertanian & Perapian UI** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js)<br>[`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) | • Ganti `fmtVol` dan `fmtItemVal` agar mengembalikan angka murni lengkap (`toLocaleString('id-ID')`) tanpa singkatan `Jt` atau `Rb`.<br>• Sesuaikan CSS `.gc-sub-item` dengan `tabular-nums`, `min-width`, dan `nowrap` agar angka digit panjang tampil rapi dan tidak meluap. |
| **CP-20** | **Implementasi Filter Berjenjang di Profil.html** | [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html)<br>[`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | • Pasang komponen filter (Input Cari + Select Provinsi 38 + Select Kab/Kota) di header kanan `profil.html`.<br>• Bangun event listener filter berjenjang: ganti provinsi mengisi kab/kota, pilih kab/kota me-redirect ke profil daerah bersangkutan. |
| **CP-21** | **Implementasi Filter Berjenjang di Index.html (Mode Profil)** | [`index.html`](file:///c:/laragon/www/PKL/mockup/index.html)<br>[`assets/js/core/potensi.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/potensi.js)<br>[`assets/js/core/Map.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Map.js) | • Tampilkan filter berjenjang di header utama saat berada di mode Profil Daerah.<br>• Hubungkan aksi filter ke pemilihan poligon peta dan aktivasi sidebar profil daerah. |
| **CP-22** | **Retensi Tab Aktif Lintas Pergantian Wilayah** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | • Simpan tab aktif ke `sessionStorage` dan URL query param `&tab=...`.<br>• Pada fungsi inisialisasi halaman, buka tab tersimpan alih-alih memaksa selalu buka tab wilayah. |
| **CP-23** | **Pengujian Browser, Validasi Antislop, & Git Commit Lokal** | Browser Agent & Local Git | • Uji interaktif di browser: cek Indramayu, Aceh Singkil, Tasikmalaya, dan Sintang.<br>• Pastikan 0 JavaScript error di konsol.<br>• Simpan ke commit Git lokal (**dilarang keras push ke GitHub sebelum instruksi pengguna**). |

---

## 3. Kriteria Keberhasilan (Definition of Done)

1. **Pendidikan (Tab Sosial)**:
   - Sekolah Luar Biasa (SLB) tampil sebagai baris pertama (paling atas) pada grafik sarana pendidikan, disusul PAUD/TK, SD, dst.
2. **Pertanian**:
   - Seluruh angka produksi komoditas dan KPI tanaman pangan, perkebunan, hortikultura, dan peternakan menyajikan angka bilangan riil presisi penuh (contoh: `1.423.890 Ton`, bukan `1,4 Jt Ton`).
   - Tampilan angka panjang rapi, tidak bertumpuk, dan memenuhi standar `/antislop-ui`.
3. **Filter Berjenjang**:
   - Header `profil.html` dan `index.html` memiliki modul filter pencarian + dropdown Provinsi (38) + dropdown Kab/Kota yang berfungsi mulus.
4. **Validasi TPAK & Konsumsi**:
   - TPAK di Aceh Singkil, Pidie Jaya, dan Tasikmalaya tampil dalam rentang persentase realistis ($60\% - 85\%$) dengan format 2 angka di belakang koma menggunakan koma khas Indonesia (`xx,xx%`). Tidak ada lagi nilai anomali ribuan persen (`2.973,8%`).
   - Kartu KPI Tab Konsumsi memiliki penanda tahun rilis resmi yang jelas.
5. **Retensi Tab**:
   - Saat pengguna berada di Tab Pertanian lalu mengganti daerah melalui filter, halaman baru langsung membuka Tab Pertanian secara otomatis.
6. **Integritas Sistem**:
   - Seluruh pengujian lolos di browser tanpa error di konsol.
   - Komit tersimpan rapi di lokal Git tanpa push ke GitHub.
