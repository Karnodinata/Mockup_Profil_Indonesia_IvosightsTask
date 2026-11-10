---
title: "Tugas Kewirausahaan: Analisis Segmentasi Pasar, Potensi Pasar (TAM-SAM-SOM), dan Kelayakan Bisnis SpecCraft AI"
date: 2026-11-09
mata_kuliah: "Kewirausahaan"
program_studi: "D4 Teknologi Rekayasa Perangkat Lunak (TRPL)"
author: "Mahasiswa D4 TRPL"
topik: "Analisis Kelayakan Bisnis SaaS: SpecCraft AI (Guided PRD/SRS Generator)"
---

# Analisis Target Pasar, Potensi Pasar, dan Kelayakan Bisnis: `SpecCraft AI`

Dokumen ini merupakan kelanjutan dari perancangan ide bisnis **`SpecCraft AI`** (Platform B2B SaaS untuk otomatisasi pembuatan dokumen PRD/SRS dan penguncian ruang lingkup proyek perangkat lunak dari wawancara terpandu klien non-teknis). Dokumen ini memuat analisis segmentasi pasar, estimasi pasar (TAM, SAM, SOM), studi kelayakan 4 aspek, serta analisis risiko dan mitigasi solusinya.

---

### a. Target Pasar Berdasarkan 4 Kategori Customer Segment

Untuk memastikan produk tepat sasaran, target pasar **SpecCraft AI** dipetakan ke dalam 4 kategori segmentasi konsumen:

| Kategori Segmentasi | Profil Target Pasar SpecCraft AI |
| :--- | :--- |
| **1. Demografis** | • **Usia:** 22 – 45 tahun (usia produktif profesional teknologi dan wirausaha digital).<br>• **Pekerjaan/Peran:** *Freelance Software Developer*, *Technical Lead*, *Project Manager (PM)*, *Product Manager*, pemilik *Software House* mikro/kecil, serta *Non-Technical Startup Founder*.<br>• **Skala Organisasi:** Tim mandiri (*solopreneur / freelancer*) hingga agensi pengembang perangkat lunak berukuran 1 – 25 orang. |
| **2. Geografis** | • **Pasar Primer:** Wilayah perkotaan dengan konsentrasi industri teknologi, agensi kreatif digital, dan *startup* tertinggi di Indonesia (Jabodetabek, Bandung, Yogyakarta, Surabaya, Malang, dan Bali).<br>• **Pasar Sekunder:** Pasar regional Asia Tenggara (Singapura, Malaysia, Filipina) yang memiliki ekosistem agensi perangkat lunak *outsource* berbahasa Inggris yang sangat masif. |
| **3. Psikografis** | • **Gaya Hidup & Nilai:** Berorientasi tinggi pada efisiensi kerja, disiplin terhadap tenggat waktu (*time-conscious*), serta sangat terbuka mengadopsi alat bantu kecerdasan buatan (*AI early adopters*).<br>• **Titik Frustrasi (*Pain Points*):** Sangat tertekan oleh revisi liar tanpa akhir (*scope creep*), lelah menyusun dokumen formal berlembar-lembar dari nol, dan cemas proyek merugi akibat ekspektasi klien yang berubah-ubah di tengah jalan. |
| **4. Perilaku (*Behavioral*)** | • **Pola Kerja:** Bekerja menggunakan ekosistem kolaborasi digital modern (Notion, Trello, Jira, GitHub, Figma, Slack, Google Docs).<br>• **Pola Pembelian:** Terbiasa dan bersedia membayar biaya langganan perangkat lunak berbasis langganan bulanan (*recurring B2B SaaS*) jika alat tersebut terbukti nyata mampu menghemat waktu kerja atau menghindarkan mereka dari konflik sengketa kontrak dengan klien. |

---

### b. Penjelasan Sederhana Potensi Pasar (TAM, SAM, SOM)

Potensi pasar SpecCraft AI digambarkan menggunakan piramida ukuran pasar:

```
┌────────────────────────────────────────────────────────┐
│             TAM (Total Addressable Market)             │
│   Pasar Global Perangkat Lunak Manajemen Kebutuhan     │
│       & Software Scoping Tool (~$2,5 Miliar USD)       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│          SAM (Serviceable Available Market)            │
│  Agensi Software House & Freelance Developer di        │
│          Indonesia (~25.000 Entitas Bisnis)            │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│          SOM (Serviceable Obtainable Market)           │
│ Target Realistis Tahap Awal (Tahun 1–2):               │
│ 350 Software House Agensi + 1.200 Freelancer Aktif     │
└────────────────────────────────────────────────────────┘
```

1. **TAM (*Total Addressable Market*) — Total Peluang Pasar Keseluruhan:**
   Total potensi pasar global untuk perangkat lunak rekayasa kebutuhan (*requirements engineering*), kolaborasi spesifikasi perangkat lunak, dan manajemen ruang lingkup proyek TI. Berdasarkan laporan riset pasar industri pengembang perangkat lunak global, ceruk pasar alat bantu produktivitas *software development lifecycle* (SDLC) bernilai lebih dari **$2,5 Miliar USD**.
2. **SAM (*Serviceable Available Market*) — Pasar yang Dapat Dilayani:**
   Segmen pasar yang secara realistis sesuai dengan fokus geografis dan bahasa SpecCraft AI di fase awal, yaitu ekosistem agensi digital, studio *software house* skala kecil-menengah, serta *freelancer* pengembang aplikasi di Indonesia. Diperkirakan terdapat sekitar **20.000 – 25.000 agensi software/digital studio** dan lebih dari **60.000 *freelance developer*** aktif di platform kerja lepas lokal maupun global di Indonesia.
3. **SOM (*Serviceable Obtainable Market*) — Target Pasar Realistis Awal:**
   Target pangsa pasar yang secara realistis dapat diakuisisi oleh tim perintis dalam 1–2 tahun pertama peluncuran produk:
   * **350 studio *software house* / agensi digital mikro** di kota-kota kreatif utama (Jakarta, Bandung, Yogyakarta, Surabaya).
   * **1.200 *freelancer* pengembang perangkat lunak** yang dijangkau melalui pemasaran komunitas pengembang (seperti komunitas developer kampus, forum Discord/Telegram programmer, dan media sosial LinkedIn/X).

---

### c. Analisis Kelayakan Awal pada 4 Aspek Utama

#### 1. Aspek Pasar (*Market Feasibility*)
* **Temuan Analisis:** **Sangat Layak (*High Demand*).**
  Tingginya angka kegagalan dan sengketa proyek perangkat lunak akibat *scope creep* menciptakan kebutuhan mendesak (*urgent pain point*). Dari observasi lapangan, lebih dari 75% pengembang agensi menghabiskan waktu 1–2 minggu hanya untuk rapat awal dan menyusun proposal teknis yang sering kali tidak dibayar oleh calon klien jika proyek batal. SpecCraft AI menawarkan pemangkasan waktu tersebut menjadi di bawah 1 jam.

#### 2. Aspek Produk (*Product / Technical Feasibility*)
* **Temuan Analisis:** **Layak dan Terbukti Secara Teknis (*Technically Feasible*).**
  Kemajuan teknologi pemrosesan bahasa alami (*Large Language Models*) dan teknik *prompt chaining* saat ini sangat matang untuk memproses masukan teks/audio wawancara tidak terstruktur menjadi dokumen JSON terstruktur berstandar industri (format IEEE 830, *User Stories*, diagram Mermaid.js). Produk MVP berbasis web dapat dibangun oleh mahasiswa TRPL menggunakan *tech stack* modern (Next.js, Tailwind CSS, FastAPI/Node.js, dan Supabase) dalam waktu 4–8 minggu.

#### 3. Aspek Operasional (*Operational Feasibility*)
* **Temuan Analisis:** **Sangat Efisien & Ramping (*Lean Operations*).**
  Bisnis ini tidak memerlukan kantor fisik, gudang logistik, atau persediaan barang berwujud. Seluruh infrastruktur berjalan di atas komputasi awan (*cloud platform*) seperti Vercel, Railway, dan penyedia API model AI. Kebutuhan tim awal sangat minimalis:
  - 1 Mahasiswa TRPL sebagai *Fullstack Developer / Tech Lead*.
  - 1 Rekan mahasiswa sebagai *UI/UX Designer & Product Researcher*.
  - 1 Rekan mahasiswa sebagai *Marketing & Customer Acquisition*.

#### 4. Aspek Keuangan (*Financial Feasibility*)
* **Perkiraan Modal Awal (*Initial Capital*):**
  * Pembelian Nama Domain Komersial (`.com` / `.ai`): **Rp 250.000 – Rp 500.000**
  * Layanan *Cloud Database* & Hosting Tingkat Awal (1 Tahun): **Rp 1.200.000**
  * Alokasi Kredit API LLM untuk Pengembangan Prototipe & Uji Coba: **Rp 1.500.000**
  * Biaya Registrasi Akun Integrasi *Payment Gateway* Digital: **Rp 300.000**
  * **Total Modal Awal yang Diperlukan:** **± Rp 3.250.000 – Rp 4.500.000** *(Sangat terjangkau bagi kelompok mahasiswa)*.

* **Perkiraan Biaya Operasional Bulanan (*Monthly Operational Cost*):**
  * Biaya Konsumsi Token API AI (berdasarkan jumlah generasi dokumen): **± Rp 600.000 – Rp 1.200.000 / bulan**
  * Pemeliharaan Server Cloud & Domain: **± Rp 250.000 / bulan**
  * **Total Biaya Operasional:** **± Rp 850.000 – Rp 1.450.000 / bulan**.

* **Struktur Harga Jual (*Pricing Model*):**
  * **Paket Freelancer:** **Rp 99.000 / bulan** (Hingga 5 proyek PRD/SRS lengkap per bulan + ekspor PDF & Markdown).
  * **Paket Agensi / Software House:** **Rp 299.000 / bulan** (Proyek tanpa batas, akses multi-pengguna tim 5 orang, kustomisasi logo agensi pada dokumen, dan fitur tanda tangan digital *Scope Sign-Off*).

* **Analisis Titik Impas (*Break-Even Point / BEP*):**
  * Dengan biaya operasional rata-rata Rp 1.200.000 per bulan, bisnis ini sudah mencapai titik impas hanya dengan memiliki **4–5 pelanggan Paket Agensi** atau **12–13 pelanggan Paket Freelancer** aktif setiap bulannya. Pendapatan di atas jumlah pelanggan tersebut sepenuhnya merupakan margin laba kotor (*gross margin > 70%*).

---

### d. Kesimpulan Kelayakan, Risiko Utama, dan Solusi Mitigasi

#### 1. Kesimpulan Kelayakan
> **KESIMPULAN: IDE BISNIS `SpecCraft AI` SANGAT LAYAK UNTUK DILANJUTKAN (*HIGHLY FEASIBLE TO PURSUE*).**
> 
> *Alasan Pokok:*
> 1. Memecahkan masalah nyata yang bernilai uang tinggi (*high-value pain point*) bagi industri software house dan freelancer.
> 2. Kebutuhan modal awal sangat kecil (< Rp 5 juta) dengan risiko finansial yang minim bagi mahasiswa D4 TRPL.
> 3. Skalabilitas produk perangkat lunak (SaaS) sangat tinggi dengan potensi margin laba bersih di atas 60% setelah mencapai titik impas.

#### 2. Risiko / Kendala Utama
* **Risiko Halusinasi & Spesifikasi Terlalu Umum (*AI Generic Hallucination*):**
  AI generatif berisiko menghasilkan dokumen spesifikasi yang terlalu klise, generik, atau tidak realistis dengan arsitektur teknis nyata yang akan dibangun oleh developer. Jika dokumen yang dihasilkan terlalu dangkal, developer tetap harus menulis ulang dokumen secara manual, sehingga nilai jual produk akan turun.

#### 3. Solusi Mitigasi (*Mitigation Strategy*)
* **Penerapan *Constraint-Based Prompt Engineering* & Format Standar Baku:**
  Sistem AI tidak dibiarkan mengarang bebas, melainkan diarahkan menggunakan kerangka kuesioner terstruktur dengan batasan ketat (*guardrails*), misalnya mewajibkan pengisian arsitektur *tech stack* (misal: React, Laravel, PostgreSQL), aturan validasi data bisnis, dan pemetaan *acceptance criteria* berstandar IEEE 830.
* **Fitur *Interactive In-Line Editor (Human-in-the-Loop)*:**
  Dokumen hasil generasi AI tidak langsung dikunci, melainkan disajikan dalam editor interaktif di mana tim developer dan klien dapat bersama-sama mengoreksi poin-poin spesifik, menambahkan diagram alur, dan menyepakati revisi sebelum dokumen akhir ditandatangani secara digital (*Digital Scope Sign-Off*).

