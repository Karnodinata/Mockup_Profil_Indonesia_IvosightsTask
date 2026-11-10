---
title: "Tugas Kewirausahaan: Penyusunan Business Model Canvas (BMC) SpecCraft AI dan Analisis Keterkaitan Trinitas Nilai"
date: 2026-11-09
mata_kuliah: "Kewirausahaan"
program_studi: "D4 Teknologi Rekayasa Perangkat Lunak (TRPL)"
author: "Mahasiswa D4 TRPL"
topik: "Business Model Canvas (BMC) 9 Blok: SpecCraft AI"
---

# Business Model Canvas (BMC): `SpecCraft AI`
### *Platform B2B SaaS untuk Otomatisasi Spesifikasi Kebutuhan Perangkat Lunak (PRD/SRS) & Penguncian Ruang Lingkup Proyek*

Dokumen ini menyusun model bisnis komprehensif untuk **SpecCraft AI** menggunakan kerangka kerja 9 blok *Business Model Canvas* (Osterwalder & Pigneur), serta menguraikan keterkaitan erat antara segmen pelanggan, proposisi nilai, dan aliran pendapatan.

---

### a. Matriks Business Model Canvas (9 Blok)

```
┌──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│  KEY PARTNERSHIPS    │    KEY ACTIVITIES    │ VALUE PROPOSITIONS   │ CUSTOMER             │  CUSTOMER SEGMENTS   │
│                      │                      │                      │ RELATIONSHIPS        │                      │
│ • Penyedia Model AI  │ • Pengembangan modul │ • Otomatisasi PRD/   │ • Self-service       │ • Software House &   │
│   (OpenAI, Anthropic,│   Web & Editor teks  │   SRS standar IEEE   │   onboarding mandiri │   Agensi Digital     │
│   Google Cloud)      │ • Optimasi prompt &  │   dalam hitungan jam │ • Dukungan chat &    │   skala mikro/kecil  │
│ • Cloud Hosting      │   guardrail anti-    │ • Penguncian ruang   │   tiket bantuan      │   (1–25 orang tim)   │
│   (Vercel, Supabase) │   halusinasi AI      │   lingkup digital    │ • Komunitas template │ • Freelance Software │
│ • Payment Gateway    │ • Pemasaran konten & │   (Scope Sign-Off)   │   dan praktik terbaik│   Developer          │
│   (Midtrans/Xendit)  │   akuisisi agensi    │   cegah scope creep  │   manajemen proyek   │ • Non-Technical      │
│ • Komunitas Software │                      │ • Jembatan bahasa    │                      │   Startup Founder /  │
│   Developer & Kampus │                      │   bisnis non-teknis  │                      │   Pemilik Usaha      │
├──────────────────────┼──────────────────────┤   ke teknis koding   ├──────────────────────┤                      │
│    KEY RESOURCES     │                      │                      │       CHANNELS       │                      │
│                      │                      │                      │                      │                      │
│ • Prompt Engine &    │                      │                      │ • Aplikasi Web &     │                      │
│   Template IEEE 830  │                      │                      │   Landing Page resmi │                      │
│ • Infrastruktur Cloud│                      │                      │ • Komunitas Devs     │                      │
│   & Basis Data       │                      │                      │   (Discord/Telegram) │                      │
│ • Talenta Mahasiswa  │                      │                      │ • Content Marketing  │                      │
│   TRPL (Fullstack &  │                      │                      │   (LinkedIn, X, blog)│                      │
│   Product Design)    │                      │                      │ • Event Hackathon &  │                      │
│                      │                      │                      │   Inkubator Kampus   │                      │
├──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┤
│                COST STRUCTURE                │                   REVENUE STREAMS                 │
│                                              │                                                   │
│ • Biaya pemakaian token API AI (pay-per-use) │ • Langganan bulanan Paket Freelancer (Rp 99.000)  │
│ • Biaya sewa server cloud, domain, & database│ • Langganan bulanan Paket Agensi (Rp 299.000)     │
│ • Biaya MDR transaksi Payment Gateway        │ • Pembelian kredit per proyek untuk pengguna lepas│
│ • Biaya promosi & materi konten komunitas    │   (Pay-per-export: Rp 35.000 / dokumen lengkap)   │
└──────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

---

### Rincian 9 Blok Business Model Canvas

#### 1. Customer Segments (Segmen Pelanggan)
* **Software House & Agensi Digital Mikro/Kecil (Tim 1–25 orang):** Agensi yang sering menangani banyak proyek kustom klien sekaligus dan kewalahan menyusun dokumen spesifikasi di fase awal penawaran (*discovery phase*).
* **Freelance Software Developer:** Pengembang independen yang membutuhkan perlindungan kontrak tertulis dari revisi liar klien, namun tidak punya waktu menyusun dokumen formal berlembar-lembar.
* **Non-Technical Startup Founder / Pemilik Bisnis:** Klien awam yang memiliki ide produk digital tetapi bingung menerjemahkannya ke dalam bahasa teknis sebelum menyewa jasa *programmer*.

#### 2. Value Propositions (Proposisi Nilai)
* **Pencegahan *Scope Creep* & Revisi Liar Tanpa Bayaran:** Menyediakan mekanisme tanda tangan persetujuan ruang lingkup digital (*Digital Scope Sign-Off*) yang mengunci batasan fitur yang disepakati sebelum penulisan kode dimulai.
* **Pemangkasan Waktu *Requirement Gathering* hingga 80%:** Mengubah proses penentuan kebutuhan dari wawancara manual 2–3 minggu menjadi kuesioner interaktif terpandu yang menghasilkan draf PRD, SRS standar IEEE 830, *User Stories*, dan diagram alur sistem dalam hitungan menit.
* **Penerjemah Bahasa Bisnis ke Bahasa Teknis:** Menghilangkan jurang komunikasi antara klien non-teknis dan developer sehingga hasil aplikasi sesuai dengan ekspektasi kedua belah pihak sejak hari pertama.

#### 3. Channels (Saluran Distribusi & Pemasaran)
* **Web Platform Langsung (*Direct Self-Service Web App*):** Akses langsung melalui situs web resmi tanpa proses instalasi yang rumit.
* **Komunitas Pengembang (*Developer Communities*):** Promosi organik dan pembagian template gratis di forum pengembang (Discord programmer, grup Telegram developer, forum Reddit/Dev.to, dan GitHub).
* **Pemasaran Konten (*Content Marketing & Social Selling*):** Studi kasus seputar tips menghindari *scope creep* dan cara membuat PRD yang baik di LinkedIn dan media sosial profesional.

#### 4. Customer Relationships (Hubungan Pelanggan)
* **Otomatisasi Mandiri (*Automated Self-Service Onboarding*):** Pengguna dapat langsung mencoba membuat 1 dokumen contoh dengan panduan interaktif di dalam aplikasi (*product tour*).
* **Dukungan Pelanggan Terintegrasi (*In-App Chat & Help Center*):** Menyediakan bot panduan pembuatan prompt dan tiket bantuan cepat untuk kendala teknis.
* **Komunitas Praktik Terbaik (*User Community*):** Membangun grup pengguna untuk saling bertukar template PRD dan praktik terbaik manajemen proyek perangkat lunak.

#### 5. Revenue Streams (Arus Pendapatan)
* **Langganan Berulang Paket Freelancer (*Recurring SaaS*):** **Rp 99.000 / bulan** (Hingga 5 dokumen PRD/SRS lengkap + ekspor format Markdown & PDF).
* **Langganan Berulang Paket Agensi (*B2B SaaS*):** **Rp 299.000 / bulan** (Dokumen tanpa batas, kolaborasi 5 anggota tim, kustomisasi logo agensi, dan integrasi persetujuan digital *Sign-Off*).
* **Pembelian Kredit Kasual (*Pay-Per-Project*):** **Rp 35.000 per ekspor** dokumen lengkap untuk pengguna musiman yang tidak ingin berlangganan bulanan.

#### 6. Key Resources (Sumber Daya Kunci)
* **Kekayaan Intelektual Prompt Engine & Template Formal:** Struktur instruksi AI terarah (*prompt engineering framework*) yang dilatih untuk memetakan teks wawancara menjadi format standar IEEE 830 dan *Agile User Stories*.
* **Infrastruktur Komputasi Awan (*Cloud Stack*):** Server hosting web responsif (Vercel), basis data terkelola (Supabase), dan akses API model bahasa besar (LLM).
* **Keahlian Teknis Tim Mahasiswa TRPL:** Kemampuan rekayasa perangkat lunak *Fullstack* (React/Next.js) dan kepekaan desain antarmuka pengguna (*UI/UX*).

#### 7. Key Activities (Aktivitas Kunci)
* **Pengembangan & Pemeliharaan Perangkat Lunak:** Pembaruan kode antarmuka, penambahan integrasi ekspor (Notion, Jira, Trello), dan perbaikan performa sistem.
* **Penyempurnaan Prompt AI & Mitigasi Halusinasi:** Melakukan evaluasi rutin agar spesifikasi teknis yang dihasilkan AI tetap realistis, akurat, dan tidak generik.
* **Pemasaran & Edukasi Pasar:** Membuat konten edukasi mengenai manajemen kebutuhan perangkat lunak dan menjaring calon pelanggan dari kalangan agensi.

#### 8. Key Partnerships (Kemitraan Kunci)
* **Penyedia Layanan API Model AI & Cloud:** Kemitraan teknis dengan penyedia fondasi kecerdasan buatan (OpenAI, Anthropic, Google Cloud) dan infrastruktur *cloud* terkelola.
* **Penyedia Layanan *Payment Gateway* Digital:** Kemitraan dengan Midtrans atau Xendit untuk memproses pembayaran langganan otomatis via QRIS, Virtual Account, dan kartu kredit.
* **Inkubator Kampus & Komunitas IT Mahasiswa:** Sebagai kanal pengujian awal (*beta testing*) dan validasi umpan balik dari sesama pengembang muda.

#### 9. Cost Structure (Struktur Biaya)
* **Biaya Penggunaan API AI (*Variable API Token Costs*):** Biaya pemrosesan kata/token setiap kali dokumen dihasilkan oleh sistem AI.
* **Biaya Infrastruktur Server & Domain (*Fixed Hosting Costs*):** Biaya sewa server web, basis data, dan perpanjangan domain tahunan (± Rp 250.000/bulan).
* **Biaya Transaksi Pembayaran (*Payment Gateway Merchant Fee*):** Potongan biaya per transaksi pembayaran langganan dari gerbang pembayaran (± 1,5% – 2%).
* **Biaya Pemasaran Digital & Konten:** Alokasi anggaran promosi komunitas dan materi publikasi digital (± Rp 200.000 – Rp 400.000/bulan).

---

### b. Keterkaitan antara Customer Segments, Value Propositions, dan Revenue Streams

Dalam arsitektur bisnis **SpecCraft AI**, hubungan antara **Customer Segments**, **Value Propositions**, dan **Revenue Streams** membentuk **Trinitas Nilai (*The Core Value-Revenue Engine*)** yang saling mengunci dan logis:

```
┌─────────────────────────────────┐
│        CUSTOMER SEGMENTS        │
│  Software House & Freelancer    │
│  Terbebani Scope Creep & Revisi │
└────────────────┬────────────────┘
                 │ Mengalami Masalah Nyata
                 ▼
┌─────────────────────────────────┐
│       VALUE PROPOSITIONS        │
│  Otomatisasi PRD/SRS Instan &   │
│  Penguncian Scope Sign-Off      │
└────────────────┬────────────────┘
                 │ Menghemat Waktu & Uang
                 ▼
┌─────────────────────────────────┐
│         REVENUE STREAMS         │
│  Biaya Langganan SaaS Bulanan   │
│  (Rp 99.000 / Rp 299.000 / bln) │
└─────────────────────────────────┘
```

1. **Masalah Nyata Segmen Pelanggan (*Customer Segments Pain Points*):**
   * Target pelanggan utama—yakni pemilik *Software House* dan *Freelance Developer*—menghadapi masalah terbesar berupa **waktu 1–2 minggu yang habis di sesi *discovery meeting*** dan **kerugian finansial akibat *scope creep* (revisi liar tanpa tambahan bayaran)** dari klien non-teknis.
   
2. **Solusi yang Ditawarkan Proposisi Nilai (*Value Propositions Delivery*):**
   * SpecCraft AI menjawab kepedihan (*pain point*) tersebut secara langsung dengan memberikan solusi: memangkas proses pembuatan dokumen kebutuhan menjadi hitungan jam melalui wawancara AI terpandu, sekaligus mengunci batasan fitur melalui fitur *Digital Scope Sign-Off*.
   * Nilai ini secara langsung menyelamatkan jam kerja produktif tim developer (*billable hours*) senilai jutaan rupiah per proyek.

3. **Kesiapan Membayar Aliran Pendapatan (*Revenue Streams Justification*):**
   * Karena nilai yang diterima (*value received*) jauh lebih besar daripada biaya yang dikeluarkan (menghemat waktu bernilai jutaan rupiah hanya dengan membayar langganan **Rp 99.000** atau **Rp 299.000** per bulan), pelanggan di segmen ini **memiliki kesediaan membayar (*willingness to pay*) yang sangat tinggi**.
   * Model pendapatan berbasis langganan bulanan (*recurring subscription*) menjadi adil dan berkelanjutan: developer membayar biaya kecil yang dapat dimasukkan sebagai komponen biaya operasional proyek mereka, sementara SpecCraft AI menikmati arus kas masuk berulang yang stabil dan dapat diprediksi (*predictable MRR - Monthly Recurring Revenue*).

