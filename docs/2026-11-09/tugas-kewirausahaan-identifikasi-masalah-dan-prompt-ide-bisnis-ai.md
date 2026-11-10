---
title: "Tugas Kewirausahaan: Identifikasi Masalah Nyata Tempat PKL, Peluang Bisnis, dan Rekayasa Prompt AI"
date: 2026-11-09
mata_kuliah: "Kewirausahaan"
program_studi: "D4 Teknologi Rekayasa Perangkat Lunak (TRPL)"
author: "Mahasiswa D4 TRPL"
topik: "Problem Elicitation: Ketiadaan Dokumen PRD/SRS Klien dan Peluang Software Requirements Tooling"
---

# Analisis Peluang Usaha Berbasis Kasus Nyata di Tempat PKL: Ketiadaan Dokumen Spesifikasi Kebutuhan Perangkat Lunak (PRD/SRS)

Dokumen ini merevisi analisis tugas kewirausahaan dengan mengangkat masalah riil yang dihadapi langsung di tempat pelaksanaan Praktik Kerja Lapangan (PKL), merumuskan peluang bisnisnya, serta menyusun rekayasa *prompt* AI untuk melahirkan ide bisnis perangkat lunak yang solutif.

---

### a. Penjelasan Masalah Nyata di Lingkungan Tempat PKL

#### 1. Apa Masalahnya?
> **"Ketiadaan Dokumen Spesifikasi Kebutuhan Produk (*Product Requirement Document / PRD*) atau Spesifikasi Kebutuhan Perangkat Lunak (*Software Requirement Specification / SRS*) yang Jelas dari Pihak Klien/Pemangku Kepentingan."**

Dalam proses pengerjaan proyek perangkat lunak di tempat PKL, tim pengembang sering kali diminta membangun sistem/aplikasi hanya berdasarkan instruksi lisan, catatan percakapan informal, atau gambaran umum yang sangat abstrak dari pihak klien. Masalah nyata yang timbul meliputi:
* **Ketidakjelasan Ruang Lingkup dan Logika Bisnis (*Vague Requirements*):** Pengembang tidak memiliki acuan baku mengenai batasan fitur, alur validasi data, skema peran pengguna (*user role*), dan kriteria penerimaan (*acceptance criteria*).
* **Fenomena Perubahan Lingkup Liar (*Scope Creep*):** Karena tidak ada dokumen hitam di atas putih yang disepakati di awal, klien kerap mengubah-ubah alur kerja aplikasi di tengah jalan setiap kali melihat prototipe antarmuka.
* **Kerja Ulang yang Menguras Energi (*Costly Rework*):** Kode program dan tampilan antarmuka yang sudah susah payah dibangun terpaksa dirombak berulang kali karena *"bukan seperti ini yang dibayangkan klien"*, sehingga estimasi waktu pengerjaan menjadi molor drastis.

#### 2. Siapa yang Mengalami?
1. **Tim Pengembang Perangkat Lunak (Termasuk Mahasiswa PKL & Programmer):** Mengalami kebingungan teknis, stres akibat revisi berulang yang tidak terstruktur, dan pemborosan jam kerja (*wasted engineering man-hours*).
2. **Klien / Pemilik Proyek (Pihak Non-Teknis):** Sering kali sebenarnya mereka memiliki visi bisnis yang jelas, namun **tidak memiliki keahlian teknis (*lack of technical literacy*)** untuk menuangkannya ke dalam format dokumen spesifikasi rekayasa perangkat lunak standar industri.
3. **Manajer Proyek / Instansi Penyedia Jasa:** Menghadapi risiko pembengkakan biaya operasional proyek, molornya tenggat waktu peluncuran, dan ketegangan relasi kerja sama dengan klien.

#### 3. Mengapa Masalah Ini Penting untuk Diselesaikan?
* **Penyebab Utama Kegagalan Proyek TI:** Berbagai riset industri perangkat lunak (seperti *Standish Group Chaos Report*) membuktikan bahwa kegagalan penentuan kebutuhan di awal (*poor requirements engineering*) merupakan faktor nomor satu kegagalan proyek perangkat lunak di dunia.
* **Biaya Perbaikan yang Berlipat Ganda:** Memperbaiki kesalahan logika sistem di fase pengodean (*coding*) atau rilis membutuhkan biaya dan waktu 10 hingga 50 kali lipat lebih besar dibanding merumuskannya secara benar di fase analisis kebutuhan.

---

### b. Rumusan Peluang Bisnis (Masalah > Kebutuhan > Peluang)

```
┌──────────────────────────────────────────────┐
│                   MASALAH                    │
│ • Klien non-teknis tidak bisa buat PRD/SRS   │
│ • Developer bingung batasan fitur & alur     │
│ • Revisi tiada akhir & scope creep liar      │
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│                  KEBUTUHAN                   │
│ • Jembatan penerjemah ide bisnis non-teknis  │
│   menjadi dokumen spesifikasi teknis formal  │
│ • Proses perumusan kebutuhan yang interaktif,│
│   terpandu, cepat, dan mudah dipahami klien  │
└──────────────────────┬───────────────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│                PELUANG BISNIS                │
│ Platform SaaS Berbasis AI untuk Otomatisasi  │
│ Pembuatan PRD, SRS, User Stories, & Flowchart│
│ dari Wawancara / Deskripsi Ide Informal      │
└──────────────────────────────────────────────┘
```

1. **Masalah (*Pain Point*):**
   Klien non-teknis kesulitan menyusun dokumen PRD/SRS yang terstandarisasi, sementara tim pengembang tidak bisa bekerja secara presisi tanpa dokumen acuan tersebut, memicu revisi massal dan keterlambatan proyek.
2. **Kebutuhan (*Customer Needs*):**
   Alat atau instrumen yang mampu memandu klien non-teknis melalui serangkaian pertanyaan terarah (kebutuhan pengguna, alur proses, batasan sistem) dan secara instan merangkumnya menjadi dokumen spesifikasi teknis siap pakai bagi developer.
3. **Peluang Bisnis (*Business Opportunity*):**
   Penyediaan **Platform Asisten Spesifikasi Rekayasa Kebutuhan Berbasis AI (*AI-Powered Requirements & PRD Engineering Tool*)**. Alat ini menargetkan agensi digital, konsultan IT, *software house*, dan tim produk *startup* yang ingin mempercepat fase *discovery* proyek dari hitungan minggu menjadi hitungan jam. Model monetisasinya berupa langganan bulanan (*B2B SaaS Subscription*) per lisensi tim proyek.

---

### c. Perancangan Prompt AI dan Ide Bisnis Teknologi yang Dihasilkan

#### 1. Contoh Prompt AI (Pola: Konteks + Target + Tugas + Format)

```text
[KONTEKS]:
Saya adalah mahasiswa D4 Teknologi Rekayasa Perangkat Lunak (TRPL) yang sedang menjalani PKL di industri pengembangan perangkat lunak. Masalah nyata paling kritis yang sering saya temui di tempat kerja adalah pihak klien (kebanyakan non-teknis) tidak menyediakan dokumen Product Requirement Document (PRD) atau Software Requirement Specification (SRS). Akibatnya, pengembang bekerja hanya berdasarkan asumsi dan instruksi lisan, yang memicu revisi berulang kali, perubahan ruang lingkup yang liar (scope creep), dan molornya tenggat waktu proyek.

[TARGET]:
Menghasilkan konsep ide bisnis rintisan berbasis teknologi (SaaS/B2B Software Tool) yang mampu menjembatani pemikiran bisnis klien non-teknis dengan kebutuhan teknis tim programmer melalui otomatisasi pembuatan PRD/SRS berbasis kecerdasan buatan (AI).

[TUGAS]:
1. Analisis alur interaksi antara klien non-teknis dan AI untuk menggali kebutuhan sistem secara terpandu (guided elicitation).
2. Rumuskan 1 konsep ide bisnis teknologi yang paling realistis dan memiliki nilai komersial tinggi bagi agensi perangkat lunak dan freelancer.
3. Jabarkan ide tersebut mencakup: nama produk, masalah inti yang diselesaikan, arsitektur solusi teknologi, serta proposisi nilai bagi klien maupun tim developer.

[FORMAT KELUARAN]:
- Nama Ide Bisnis
- Masalah yang Diselesaikan
- Deskripsi Solusi Teknologi (Fitur Utama & Mekanisme Kerja)
- Nilai / Manfaat Utama bagi Pengguna (Developer & Klien)
- Model Monetisasi / Pendapatan Bisnis
```

---

#### 2. Satu Ide Bisnis Berbasis Teknologi yang Dihasilkan

* **Nama Ide Bisnis:**
  **`SpecCraft AI — Guided PRD/SRS Generator & Interactive Scope Aligner`**

* **Masalah yang Diselesaikan:**
  Menghilangkan jurang pemisah komunikasi (*communication gap*) antara ide bisnis klien non-teknis dan kebutuhan spesifikasi teknis tim pengembang perangkat lunak, memangkas waktu penyusunan PRD/SRS dari 2–3 minggu menjadi kurang dari 1 jam.

* **Deskripsi Solusi Teknologi (Mekanisme Kerja):**
  1. **Wawancara Cerdas Terpandu (*AI Guided Elicitation Bot*):**
     * Klien tidak disuruh menulis dokumen teknis kosong. Sebagai gantinya, antarmuka web interaktif mengajukan serangkaian pertanyaan berbasis percakapan ramah (*conversational interview*), seperti: *"Siapa pengguna utama aplikasi ini?", "Apa tindakan utama yang mereka lakukan?", "Data apa saja yang perlu disimpan?", "Bagaimana alur jika ada kesalahan transaksi?"*
  2. **Generator Dokumen PRD & SRS Lengkap Otomatis:**
     * Mesin AI memproses rekaman percakapan atau transkrip rapat tersebut dan secara otomatis menyusun:
       - Dokumen PRD eksekutif (tujuan bisnis, persona pengguna, dan metrik keberhasilan).
       - Dokumen SRS teknis (spesifikasi kebutuhan fungsional & non-fungsional berstandar IEEE 830).
       - Daftar *User Stories* lengkap dengan *Acceptance Criteria* (format *Given-When-Then*).
       - Diagram alur sistem sederhana (*System Flowchart / Mermaid.js Diagram*).
  3. **Persetujuan Ruang Lingkup Digital (*Digital Scope Sign-Off*):**
     * Sistem menyediakan tombol persetujuan digital di mana klien dan developer menandatangani batasan fitur yang disepakati sebelum pengodean dimulai, mengunci batasan proyek (*freeze scope*) untuk mencegah revisi liar di tengah jalan.

* **Nilai dan Manfaat bagi Pengguna:**
  * **Bagi Tim Pengembang / Mahasiswa Magang:**
    * Memiliki acuan cetak biru (*blueprint*) yang jelas, tegas, dan berstruktur sejak hari pertama bekerja.
    * Terlindung dari tuduhan revisi sepihak karena setiap fitur memiliki batas kesepakatan tertulis.
  * **Bagi Klien Non-Teknis:**
    * Merasa terbantu menuangkan ide abstraknya ke format profesional tanpa perlu menguasai istilah teknis pemrograman.
    * Memperoleh kepastian estimasi biaya dan waktu penyelesaian proyek yang jauh lebih akurat dari vendor.
  * **Bagi Manajemen / Perusahaan *Software House*:**
    * Memangkas fase *requirement gathering* hingga 75%, meningkatkan kapasitas pengerjaan proyek tahunan, dan menekan angka pembengkakan anggaran (*budget overrun*).
