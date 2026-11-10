---
title: "Analisis Studi Kasus Etika Profesi TI: Integritas dan Kerahasiaan Data dalam Lingkungan PKL"
date: 2026-11-09
author: "Mahasiswa PKL"
topik: "Integritas Informasi, Manipulasi Hasil Kerja, dan Kerahasiaan Akses Sistem"
---

# Analisis Kasus Etika Profesi TI: Integritas dan Kerahasiaan Data pada Lingkungan Praktik Kerja Lapangan (PKL)

Dokumen ini disusun untuk menganalisis situasi potensial yang berkaitan dengan etika profesi teknologi informasi, khususnya mengenai integritas data, kejujuran hasil pelaporan kerja, dan akuntabilitas pengelolaan sistem di lingkungan instansi/perusahaan tempat pelaksanaan PKL.

---

### a. Fakta dan Situasi Potensial yang Berpotensi Terjadi (Bobot: 4 Poin)

**Situasi Potensial yang Diangkat:**
> **"Godaan Memanipulasi / Merekayasa Data Kosong dan Anomali Nilai (*Data Smoothing / Fabrication*) demi Mempercantik Tampilan Laporan Visualisasi Sistem saat Evaluasi Kinerja."**

**Uraian Fakta dan Dinamika Kasus:**
1. **Adanya Data Mentah yang Belum Lengkap / Cacat (*Missing / Incomplete Data*):**
   Dalam proses pengembangan modul pelaporan atau antarmuka pemantauan data (*dashboard analytics*), mahasiswa sering kali menerima kumpulan data riil dari sistem internal perusahaan yang belum terisi lengkap, memiliki nilai kosong (*null*), atau memiliki anomali nilai (*outlier*).
2. **Kendala Tampilan Antarmuka (*UI Rendering Glitches*):**
   Ketiadaan data pada beberapa parameter menyebabkan komponen grafik, diagram matriks, atau tabel ringkasan terlihat tidak seimbang, terpotong, atau menampilkan pesan eror visual yang dapat dipersepsikan sebagai kelemahan fungsi sistem yang dibangun.
3. **Tekanan Waktu dan Ekspektasi Hasil Kerja:**
   Menjelang jadwal peninjauan (*progress review*) atau demonstrasi di hadapan pembimbing lapangan dan pimpinan, muncul dorongan/godaan bagi mahasiswa untuk memasukkan angka rekaan (*dummy values*) yang tampak wajar secara sepihak ke basis data produksi/laporan akhir tanpa konfirmasi, semata-mata agar grafik tampak penuh, rapi, dan memberikan kesan bahwa seluruh fungsi dan data telah terintegrasi sempurna.

---

### b. Pihak yang Terdampak dan Dampaknya (Bobot: 4 Poin)

| Pihak Terdampak | Peran dalam Ekosistem | Dampak yang Ditimbulkan |
| :--- | :--- | :--- |
| **1. Pihak Manajemen / Pengambil Keputusan** | Pengguna akhir laporan dan data analitis | **Keputusan Strategis yang Keliru:** Laporan yang dipercantik secara artifisial memberikan gambaran kinerja yang semu. Manajemen dapat mengambil langkah bisnis, operasional, atau pengalokasian sumber daya yang keliru karena mendasarkan analisis pada angka yang tidak mencerminkan kenyataan. |
| **2. Perusahaan / Instansi Tempat PKL** | Pemilik sistem dan aset informasi | **Penurunan Kredibilitas dan Reputasi:** Jika ketidaksesuaian data terdeteksi pada audit operasional atau digunakan oleh pihak eksternal/klien, reputasi profesional dan integritas instansi di mata publik akan tercoreng. |
| **3. Tim Pengembang / Rekan Kerja Selanjutnya** | Pengelola sistem jangka panjang | **Beban Utang Teknis (*Technical Debt*):** Data rekayasa yang tidak terdokumentasi menciptakan inkonsistensi data (*silent data corruption*). Ketika sistem memasuki tahap rilis penuh atau integrasi berkala, tim teknis akan kesulitan melacak sumber anomali. |
| **4. Mahasiswa PKL & Institusi Pendidikan** | Pelaksana tugas dan almamater | **Sanksi Moral dan Akademis:** Pelanggaran integritas data mencoreng rekam jejak profesional mahasiswa, berpotensi membatalkan kelulusan evaluasi PKL, serta merusak kemitraan antara perguruan tinggi dan instansi tempat magang. |

---

### c. Prinsip Kode Etik Profesi TI yang Relevan atau Berisiko Dilanggar (Bobot: 4 Poin)

Situasi ini bersinggungan langsung dengan prinsip-prinsip baku kode etik profesi teknologi informasi:

1. **Prinsip Kejujuran dan Kepercayaan (*Honesty and Trustworthiness - ACM Code of Ethics Section 1.3*):**
   Praktisi TI berkewajiban untuk selalu jujur mengenai kemampuan sistem, keabsahan data, dan keterbatasan informasi yang disajikan. Memanipulasi angka agar laporan terlihat memuaskan merupakan pelanggaran langsung terhadap integritas intelektual.
2. **Prinsip Mencegah Kerugian (*Avoid Harm - ACM Code of Ethics Section 1.2*):**
   Penyajian data yang salah berpotensi menimbulkan kerugian nyata (*harm*), baik berupa kerugian finansial, kesalahan alokasi logistik, maupun kegagalan evaluasi kinerja organisasi.
3. **Prinsip Transparansi dan Batasan Desain (*IEEE Code of Ethics Section I.1*):**
   Profesional TI berkewajiban untuk menyatakan secara terbuka batasan operasional sistem dan tidak menyembunyikan kekurangan data di balik manipulasi visual.
4. **Kode Etik Ikatan Profesi Informatika Indonesia (IPKIN):**
   Prinsip **Tanggung Jawab Profesi**, di mana setiap anggota wajib menjunjung tinggi kebenaran data dan dilarang memalsukan informasi atau memanfaatkan celah sistem untuk mengelabui pengguna.

---

### d. Risiko yang Dapat Timbul Jika Situasi Tidak Ditangani dengan Benar (Bobot: 4 Poin)

1. **Kegagalan Keputusan Berbasis Data (*Flawed Data-Driven Decisions*):**
   Sistem informasi yang kehilangan akurasi akan menghasilkan keluaran yang menyesatkan. Keputusan bisnis atau kebijakan operasional yang diambil menjadi tidak efektif karena berpijak pada asumsi palsu.
2. **Risiko Pelanggaran Kepatuhan dan Regulasi Internal (*Compliance Liability*):**
   Memodifikasi data sistem tanpa otorisasi melanggar tata kelola data perusahaan (*data governance policy*) serta aturan hukum terkait integritas informasi elektronik (seperti manipulasi rekaman elektronik).
3. **Kerusakan Integritas Basis Data (*Data Inconsistency*):**
   Penyisipan nilai fiktif yang tidak melalui prosedur verifikasi formal merusak keterhubungan relasi data, menyebabkan laporan turunan berikutnya menjadi tidak sinkron.
4. **Erosi Budaya Kerja dan Standar Moral (*Ethical Fading*):**
   Membiarkan manipulasi minor demi kelancaran presentasi menumbuhkan kebiasaan kompromi etis, yang lambat laun berpotensi melahirkan pelanggaran profesional yang jauh lebih fatal di masa depan.

---

### e. Tindakan Etis yang Seharusnya Dilakukan oleh Mahasiswa PKL (Bobot: 4 Poin)

Sebagai mahasiswa yang memegang teguh profesionalisme dan etika rekayasa perangkat lunak, langkah-langkah yang semestinya diambil adalah:

1. **Menyajikan Ketiadaan Data secara Transparan pada Antarmuka (*Honest UI Handling*):**
   Alih-alih mengarang nilai buatan, mahasiswa harus mengadaptasi logika antarmuka agar mampu menangani kondisi kosong secara elegan, misalnya menampilkan status visual *"Data Belum Tersedia / N/A"* atau menyertakan penanda visual bahwa indikator tersebut masih menunggu sinkronisasi resmi.
2. **Menyertakan Catatan Kaki dan Dokumentasi Keterbatasan (*Data Disclaimer*):**
   Mencantumkan catatan metodologi pada laporan kerja atau dokumen teknis yang menjelaskan bahwa terdapat parameter tertentu yang belum terisi pada dataset saat ini, lengkap dengan tanggal pembaruan terakhir.
3. **Mengomunikasikan Kendala secara Terbuka kepada Pembimbing Lapangan (*Proactive Communication*):**
   Melaporkan kesenjangan data kepada mentor industri secara objektif, menanyakan prosedur standar organisasi dalam menangani *missing values* (apakah dibiarkan kosong atau menggunakan formula estimasi resmi yang disetujui), serta meminta arahan teknis yang valid.
4. **Menjaga Kerahasiaan Kredensial dan Batasan Otoritas Akses:**
   Hanya mengakses dan mengolah data yang menjadi lingkup tugasnya, tidak membagikan berkas sistem internal atau kredensial akses ke ruang publik, serta memastikan dokumen kerja internal tidak diunggah ke repositori terbuka tanpa persetujuan instansi.
