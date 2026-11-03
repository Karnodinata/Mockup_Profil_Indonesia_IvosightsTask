# Perencanaan Teknis: Revisi Lanjutan Profil Wilayah (Pertanian, Pendidikan, & SDM)

Dokumen ini memuat analisis kritis (*evidence-aware*), kajian ergonomi antarmuka sesuai prinsip `/antislop-ui`, dan rencana eksekusi teknis (*actionable checkpoint plan*) untuk merespons masukan lanjutan dari pengguna terhadap halaman [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) (kasus uji utama: Sintang `id=323` dan Barito Selatan `id=334`).

---

## 1. Analisis Kritis Masalah & Kelemahan Desain Eksisting

### Poin 1: Tab Data Pertanian — Kepadatan Komoditas & Ketimpangan Layout 4 Kolom
* **Gejala di Lapangan (Bukti Kasus Sintang `id=323`)**:
  - Kolom **Tanaman Pangan** hanya memiliki **5 komoditas** (tinggi kartu ~240px).
  - Kolom **Perkebunan** memiliki **10 komoditas** (tinggi kartu ~360px).
  - Kolom **Hortikultura** memiliki **56 komoditas** (sangat panjang!). Di dalam kolom sempit (lebar ~25% layar), daftar 56 komoditas terpaksa dikunci pada `max-height: 420px` sehingga muncul *inner scrollbar* yang sempit dan hanya menampilkan ~8 item sekaligus.
  - Kolom **Peternakan** memiliki **23 item** (8 populasi hidup + 15 produk hasil ternak).
  - Antar-item komoditas hanya berjarak `padding: 3px 0` tanpa garis batas (*divider*), sehingga teks nama komoditas dan rincian luas/produktivitas terlihat bertumpuk dan melelahkan untuk dibaca (*visual clutter*).
* **Kelemahan jika Tetap 4 Kolom Sejajar**:
  - Memaksa 4 kartu berdiri sejajar dalam 1 baris menciptakan "ruang kosong kopong" (*dead whitespace*) di bawah kartu Tanaman Pangan dan Perkebunan, sementara kartu Hortikultura tercekik *scrollbar*.
* **Solusi Terencana (Prinsip `/antislop-ui`)**:
  1. **Garis Pemisah Antar-Komoditas**:
     - Setiap baris komoditas (`.gc-sub-item`) diberi garis pemisah halus: `border-bottom: 1px solid var(--line); padding: 7px 0;` (elemen terakhir `border-bottom: none`).
     - Teks nama komoditas dan nilai produksi memiliki kontras dan tipografi yang jelas.
  2. **Restrukturisasi Grid Pertanian (Grid 2 Kolom x 2 Baris)**:
     - Ubah layout `.sektor-grid` dari 1 baris 4 kolom sempit menjadi **2 Baris x 2 Kolom Berimbang**:
       - **Baris 1 (Komoditas Ringkas - Sedang)**:
         - Kartu 1: 🌾 **Tanaman Pangan** (lebar 50% layar)
         - Kartu 2: 🌴 **Perkebunan** (lebar 50% layar)
       - **Baris 2 (Komoditas Padat - Banyak)**:
         - Kartu 3: 🥬 **Hortikultura** (lebar 50% layar)
         - Kartu 4: 🐄 **Peternakan** (lebar 50% layar)
     - **Manfaat**: Dengan lebar 50%, pembacaan nama komoditas menjadi sangat lega.
  3. **Batas Scroll Adaptif Layar (*Viewport-Aware Max-Height*)**:
     - Ketinggian maksimal kontainer scroll diperlebar dari 420px menjadi `max-height: 560px` (atau `min(560px, 60vh)`).
     - Jika komoditas sedikit (seperti Tanaman Pangan 5 item), kartu secara alami pendek dan **tidak ada scrollbar**.
     - Jika komoditas banyak (seperti Hortikultura 56 item), daftar komoditas memanjang menampilkan puluhan item terlebih dahulu, dan *scrollbar* baru aktif saat hampir menyentuh batas bawah layar.

---

### Poin 2: Tab Sosial — Menghilangkan Frasa "Sederajat" & Menampilkan Seluruh Jenjang Termasuk Nilai 0
* **Penyebab Mengapa MI dan MA "Hilang" di Kasus Sintang (`id=323`)**:
  - Di Sintang, data `rekap_jenjang.madrasah` mencatat:
    - `mi: 0`
    - `mts: 11`
    - `ma: 0`
  - Pada implementasi sebelumnya, terdapat filter kode: `.filter(item => item.v > 0)`.
  - Akibatnya, karena MI dan MA bernilai 0, **baris MI dan MA otomatis dihilangkan dari grafik**. Pengguna yang melihat grafik Sintang hanya melihat MTs, dan mengira MI serta MA sengaja disembunyikan atau diabaikan!
* **Kelemahan Label "Sederajat"**:
  - Menuliskan label *"SD / Sederajat"*, *"SMP / Sederajat"*, dan *"SMA / Sederajat"* menimbulkan bias interpretasi: pembaca mengira Madrasah (MI/MTs/MA) sudah dilebur ke dalam angka tersebut. Padahal data BPS/Kemendikbud memisahkan sekolah umum Kemendikbud dan madrasah Kemenag.
* **Solusi Terencana**:
  1. **Hapus Frasa "/ Sederajat"**:
     Gunakan nomenklatur formal dan lugas tanpa ambigu:
     - `PAUD & TK`
     - `Sekolah Dasar (SD)`
     - `Madrasah Ibtidaiyah (MI)`
     - `Sekolah Menengah Pertama (SMP)`
     - `Madrasah Tsanawiyah (MTs)`
     - `Sekolah Menengah Atas (SMA)`
     - `Madrasah Aliyah (MA)`
     - `Sekolah Menengah Kejuruan (SMK)`
     - `Sekolah Luar Biasa (SLB)`
     - `Perguruan Tinggi (PT)`
  2. **Tampilkan Seluruh Jenjang Pendidikan Formal Termasuk Nilai 0**:
     - Jenjang formal utama (PAUD/TK, SD, MI, SMP, MTs, SMA, MA, SMK, PT) **selalu ditampilkan secara permanen** pada diagram batang.
     - Jika suatu jenjang memiliki nilai `0` (seperti MI: 0 dan MA: 0 di Sintang), tetap dimunculkan satu baris dengan label nilai `0` (warna teks muted, panjang batang 0px).
     - **Dampak Positif**: Pengguna dan atasan langsung melihat fakta objektif: *"Di Sintang tercatat 0 unit MI, 11 unit MTs, dan 0 unit MA"*, menghilangkan prasangka bahwa data madrasah disembunyikan.
  3. **Penyesuaian Dimensi SVG `#eduBar`**:
     - Label width diatur `labelW = 185` agar nama panjang seperti `Madrasah Tsanawiyah (MTs)` tidak terpotong.
     - Tinggi SVG menyesuaikan jumlah baris secara dinamis.

---

### Poin 3: Tab Penduduk & SDM — Hapus Persentase pada Pohon Angkatan Kerja, Satuan Murni "Jiwa"
* **Kondisi Eksisting**:
  - Pada kartu `#akTree`, angka dilengkapi porsi persentase: `(100%)`, `(97.6%)`, `(2.4%)`.
  - Pengguna meminta agar persentase ini dihilangkan dan hanya menyajikan angka murni dalam satuan **jiwa**.
* **Solusi Terencana**:
  - Hapus badge persentase di dalam `#akTree`.
  - Format baris menjadi bersih dan tegas:
    - **I. Angkatan Kerja**: `${fmt(ak)} jiwa`
    - **Penduduk Bekerja**: `${fmt(bek)} jiwa`
    - **Pengangguran Terbuka**: `${fmt(nganggur)} jiwa`
  - KPI Card `Angkatan kerja` dan chip `#akTotal` tetap konsisten menggunakan satuan **`jiwa`**.

---

### Poin 4 & 5: Status Sektor Lain yang Telah Disetujui (Aman & Tidak Diubah)
* **Poin 4 (Curah Hujan)**: Label angka mm permanen di atas setiap batang bulanan grafik SVG `#rain` tetap dipertahankan (disetujui pengguna).
* **Poin 5 (Metadata Tahun Rilis)**: Label rilis resmi (Pertanian 2023, Sakernas 2023/2024, Susenas 2023/2024, Dapodik/EMIS 2023/2024, PODES 2024, DEMNAS BIG, dan BMKG 2024) tetap dipertahankan (disetujui pengguna).

---

## 2. Matriks Rencana Aksi (Execution Checkpoints)

| Checkpoint | Target Komponen | File Terkait | Rincian Pekerjaan |
|:---|:---|:---|:---|
| **CP-10** | **CSS Layout Pertanian 2x2 & Divider Line** | [`profil.html`](file:///c:/laragon/www/PKL/mockup/profil.html) | • Ubah `.sektor-grid` menjadi 2 kolom (`grid-template-columns: repeat(2, 1fr)` pada desktop, 1 kolom pada mobile).<br>• Tambahkan border separator `.gc-sub-item { border-bottom: 1px solid var(--line); padding: 7px 0; }`.<br>• Tingkatkan `max-height` sub-list menjadi `540px`. |
| **CP-11** | **Susunan Kartu Pertanian di Profil.js** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | • Urutkan render 4 kartu: Baris 1 = Tanaman Pangan & Perkebunan; Baris 2 = Hortikultura & Peternakan.<br>• Terapkan class separator garis pada markup setiap komoditas. |
| **CP-12** | **Label Pendidikan Lugas & Tampilan Permanen (Termasuk Nilai 0)** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | • Hapus frasa `"/ Sederajat"` dari SD, SMP, SMA.<br>• Seluruh jenjang formal (PAUD/TK s.d. PT) selalu dirender permanen.<br>• Jenjang dengan nilai `0` ditampilkan dengan teks nilai `0` dan batang 0px.<br>• Atur `labelW = 185` dan sesuaikan viewBox SVG. |
| **CP-13** | **Pembersihan Persentase Pohon Tenaga Kerja** | [`assets/js/core/Profil.js`](file:///c:/laragon/www/PKL/mockup/assets/js/core/Profil.js) | • Hapus span persentase `(100%)`, `(xx.x%)` di `#akTree`.<br>• Tampilkan murni angka `${fmt(n)} jiwa`. |
| **CP-14** | **Pengujian Browser & Konsol di Sintang & Barito Selatan** | Browser Validation | • Uji interaktif di Sintang (`id=323`) dan Barito Selatan (`id=334`).<br>• Pastikan layout 2x2 proporsional, divider garis rapi, MI/MTs/MA tampil transparan, dan tidak ada error konsol. |
| **CP-15** | **Git Commit Lokal** | Local Git Repository | • Simpan perubahan ke git commit lokal. **TIDAK ADA PUSH KE GITHUB**. |

---

## 3. Kriteria Keberhasilan (Definition of Done)
1. **Pertanian**:
   - Layout kartu sektor pertanian tertata 2 baris x 2 kolom yang seimbang di layar desktop.
   - Setiap baris komoditas memiliki garis pemisah halus yang rapi, mudah dibaca dan tidak bertumpuk.
   - Kartu dengan komoditas sedikit (Tanaman Pangan) pendek secara wajar; kartu dengan komoditas melimpah (Hortikultura 56 item) memanjang secara lega dan hanya memunculkan scrollbar jika hampir menyentuh batas bawah layar.
2. **Sosial (Pendidikan)**:
   - Tidak ada lagi label berembel-embel "Sederajat" yang membingungkan.
   - MI, MTs, dan MA masing-masing memiliki baris tersendiri.
   - Pada wilayah dengan 0 unit (seperti Sintang dengan MI: 0 dan MA: 0), baris MI dan MA tetap terlihat dengan angka `0`, membuktikan secara objektif bahwa jenjang tersebut memang 0 di wilayah bersangkutan.
3. **Penduduk & SDM**:
   - Pohon kerja `#akTree` menampilkan angka dalam satuan `jiwa` tanpa label persentase `(%)`.
4. **Integritas Sistem**:
   - 0 error JavaScript pada konsol browser.
   - Perubahan hanya tersimpan di lokal git, tanpa ada push ke repositori GitHub sebelum izin pengguna.
