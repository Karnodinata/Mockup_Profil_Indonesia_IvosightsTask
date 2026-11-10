---
title: "Analisis Studi Kasus Etika Profesi TI: Benturan antara Target Tenggat Waktu Instansi dan Kepentingan Pengguna"
date: 2026-11-09
author: "Mahasiswa PKL"
topik: "Trade-off Deadline Proyek, Kualitas Sistem, dan Hak Pengalaman Pengguna (UX)"
---

# Analisis Kasus Etika Profesi TI: Benturan antara Target Waktu Instansi dan Kepentingan Pengguna Sistem

Dokumen ini disusun untuk menganalisis dilema etika profesi teknologi informasi yang timbul akibat benturan kepentingan antara pemenuhan tenggat waktu/target penyelesaian proyek oleh instansi penyedia sistem dan pemenuhan hak atas sistem yang andal, aman, serta ramah pengguna (*user-friendly*) bagi pengguna akhir.

---

### a. Fakta dan Situasi Potensial yang Terjadi di Tempat Kerja/PKL (Bobot: 4 Poin)

**Situasi Potensial yang Diangkat:**
> **"Rilis Sistem Terburu-buru Demi Memenuhi Tenggat Waktu Evaluasi Kontrak / Demo Pimpinan, Mengorbankan Pengujian Kinerja Beban (*Performance Testing*), Responsivitas Perangkat, dan Kemudahan Penggunaan (*Usability*)."**

**Uraian Fakta dan Dinamika Lapangan:**
1. **Jadwal Tenggat Waktu yang Ketat (*Tight Deadline*):**
   Proyek pengembangan sistem antarmuka berbasis data memiliki tanggal batas akhir penyerahan (*milestone deliverable*) yang ketat, di mana keterlambatan penyelesaian modul akan berdampak langsung pada evaluasi kemajuan proyek atau pencairan anggaran termin.
2. **Prioritas pada Tampilan Fisik (*Visual Completeness Over Stability*):**
   Menjelang tenggat waktu, fokus utama tim teknis sering kali terkonsentrasi pada penyelesaian visual fitur utama agar terlihat lengkap saat demonstrasi di hadapan pimpinan atau klien. Akibatnya, tahapan pengujian non-fungsional krusial—seperti pengujian pada koneksi internet lambat, pengujian responsivitas layar berukuran kecil (ponsel/tablet), dan optimasi beban rendering grafik—dipangkas atau dilewati.
3. **Kompromi Kelayakan Rilis:**
   Sistem dipaksakan untuk diluncurkan atau diserahkan ke pengguna dalam kondisi yang belum sepenuhnya matang, dengan asumsi bahwa cacat minor atau keluhan pengguna dapat diperbaiki secara menyusul di masa depan (*post-release patch*).

---

### b. Pengguna/Klien yang Terdampak dan Hak yang Berisiko Diabaikan (Bobot: 4 Poin)

| Aspek Pengguna | Deskripsi Dampak | Hak / Kebutuhan yang Berisiko Diabaikan |
| :--- | :--- | :--- |
| **1. Pengguna Akhir Tingkat Operasional (Staf / Analis)** | Staf yang menggunakan aplikasi setiap hari untuk menyelesaikan pekerjaan rutin atau menyusun laporan. | **Hak atas Efisiensi & Kemudahan Kerja:** Pengguna terbebani oleh antarmuka yang membingungkan (*poor UX*), tombol aksi yang tidak konsisten, atau waktu pemuatan data yang sangat lambat (*lagging*), yang justru menghambat produktivitas kerja harian mereka. |
| **2. Pengguna Eksekutif / Pimpinan Klien** | Pihak pengambil keputusan strategis yang mengakses rangkuman data. | **Hak atas Keandalan dan Ketepatan Akses:** Risiko terhambat saat membuka visualisasi penting dalam pertemuan mendesak akibat *freeze* atau rendering grafik yang berat di perangkat mereka. |
| **3. Pengguna dengan Keterbatasan Aksesibilitas** | Pengguna yang menggunakan perangkat dengan spesifikasi terbatas, jaringan tidak stabil, atau memiliki sensitivitas visual. | **Hak atas Aksesibilitas Digital (*Inclusivity*):** Terabaikannya standar kontras warna, ukuran elemen sentuh (*tap target*), dan kesesuaian lintas browser/perangkat membuat sistem tidak dapat digunakan secara adil oleh seluruh lapisan pengguna. |

---

### c. Kepentingan Instansi yang Menjadi Pertimbangan Utama (Bobot: 4 Poin)

Dalam situasi ini, instansi/perusahaan tempat bekerja berada di bawah tekanan faktor-faktor bisnis dan manajerial yang nyata:

1. **Kepatuhan Jadwal Kontrak dan *Service Level Agreement* (SLA):**
   Instansi terikat perjanjian kerja sama formal. Keterlambatan penyerahan produk dapat dikenakan denda pinalti (*late penalty*), teguran administratif, atau hilangnya penilaian performa vendor (*vendor rating*).
2. **Keterbatasan Anggaran dan Efisiensi Jam Kerja (*Cost & Man-Hours Constraint*):**
   Memperpanjang siklus pengembangan untuk menyempurnakan setiap detail pengalaman pengguna membutuhkan biaya operasional tambahan (*burn rate*) dan alokasi jam kerja teknis (*engineer man-hours*) yang dapat melampaui batas anggaran proyek yang telah ditetapkan.
3. **Pencairan Termin Pembayaran (*Billing & Revenue Milestone*):**
   Arus kas (*cash flow*) instansi sangat bergantung pada serah terima dokumen pekerjaan tepat waktu sesuai jadwal pembayaran kontrak.
4. **Tekanan Reputasi Internal dan Demonstrasi Kemajuan:**
   Kebutuhan manajemen untuk menunjukkan bukti nyata kemajuan proyek (*tangible milestone demo*) kepada pemegang saham atau pimpinan instansi induk guna membuktikan bahwa proyek berjalan sesuai rencana.

---

### d. Dampak Pengabaian Kepentingan Pengguna terhadap Kepercayaan dan Reputasi (Bobot: 4 Poin)

Jika kepentingan pengguna terus dikorbankan demi mengejar target formal instansi:

1. **Rendahnya Tingkat Adopsi Sistem (*Low User Adoption / System Resistance*):**
   Aplikasi yang sulit digunakan dan lambat akan ditinggalkan oleh pengguna akhir. Pengguna cenderung kembali ke cara manual (misalnya menggunakan spreadsheet manual), sehingga investasi pengembangan sistem menjadi sia-sia (*failed software investment*).
2. **Ledakan Keluhan dan Biaya Dukungan Teknis (*High Maintenance & Ticket Backlog*):**
   Rilis yang tidak matang memindahkan beban ke tim dukungan pelanggan (*customer support/helpdesk*). Biaya penanganan insiden darurat, perbaikan *bug* mendadak (*hotfix*), dan revisi berulang justru jauh lebih mahal dibanding melakukan pengujian yang layak sejak awal.
3. **Erosi Kepercayaan Klien Terhadap Profesionalisme Instansi (*Loss of Credibility*):**
   Meskipun target tenggat waktu tercapai, klien akan merasa kecewa karena kualitas produk yang diserahkan jauh di bawah ekspektasi. Hal ini menghancurkan reputasi instansi sebagai mitra teknologi yang andal dan berisiko memutus peluang kontrak perpanjangan di masa mendatang.
4. **Tekanan Mental dan Kelelahan Tim Pengembang (*Developer Burnout*):**
   Siklus kerja terburu-buru yang diikuti oleh rentetan komplain pengguna menciptakan lingkungan kerja yang reaktif dan stres tinggi bagi tim teknis.

---

### e. Keseimbangan Etis yang Seharusnya Diambil oleh Calon Profesional TI (Bobot: 4 Poin)

Sebagai calon profesional TI yang menjunjung tinggi etika profesi rekayasa perangkat lunak (merujuk pada *Software Engineering Code of Ethics and Professional Practice - IEEE/ACM*), keseimbangan antara batas waktu instansi dan hak pengguna harus dikelola melalui strategi berikut:

1. **Penerapan Strategi *Minimum Viable Product* (MVP) yang Beretika:**
   - **Bukan** merilis semua fitur dalam kondisi setengah matang dan penuh cacat, melainkan **merampingkan cakupan fitur (*scope negotiation*)**.
   - Menyelesaikan lebih sedikit fitur inti namun memastikan fitur tersebut berjalan dengan kualitas prima, stabil, dan ramah pengguna, sementara fitur sekunder dijadwalkan secara transparan pada fase rilis berikutnya.
2. **Menetapkan Batas Mutu Minimum yang Tidak Boleh Dikompromikan (*Non-Negotiable Baseline*):**
   - Menetapkan kriteria kelayakan rilis (*Definition of Done*) yang tegas: aspek stabilitas dasar, keamanan data, dan kejelasan navigasi utama tidak boleh ditawar hanya demi mengejar kalender presentasi.
3. **Transparansi Catatan Rilis (*Honest Release Communication & Known Issues*):**
   - Mengomunikasikan status sistem secara jujur kepada pemangku kepentingan melalui catatan rilis (*release notes*). Mengakui secara terbuka batasan yang masih ada dan memberikan panduan alternatif kepada pengguna sementara perbaikan sedang disiapkan.
4. **Mengalokasikan *Sprint* Khusus Pemeliharaan dan Tindak Lanjut Umpan Balik (*Technical Debt Paydown*):**
   - Segera setelah tonggak capaian rilis formal terpenuhi, instansi harus secara etis mendedikasikan waktu kerja untuk menampung keluhan pengguna, memperbaiki isu ergonomi antarmuka, dan mengoptimalkan performa sistem, bukan langsung menelantarkan sistem begitu termin kontrak selesai.
5. **Komunikasi Proaktif dan Berbasis Bukti kepada Manajemen:**
   - Sebagai teknisi, mengemukakan risiko bisnis secara objektif kepada pimpinan instansi: menjelaskan bahwa memaksakan rilis sistem yang cacat akan menimbulkan kerugian reputasi dan biaya perbaikan yang jauh lebih besar di kemudian hari.

