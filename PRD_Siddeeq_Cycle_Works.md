# Product Requirements Document (PRD)
## Siddeeq Cycle Works — Platform Kasir Terintegrasi dengan Akuntansi Syariah

---

**Dokumen:** PRD v1.0  
**Penulis:** Galih Febianto  
**Tanggal:** 1 Mei 2026  
**Status:** Draft  

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Tujuan](#2-latar-belakang--tujuan)
3. [Ruang Lingkup Produk](#3-ruang-lingkup-produk)
4. [Pengguna & Pemangku Kepentingan](#4-pengguna--pemangku-kepentingan)
5. [Arsitektur Alur Data](#5-arsitektur-alur-data)
6. [Fitur & Persyaratan Fungsional](#6-fitur--persyaratan-fungsional)
7. [Struktur Database](#7-struktur-database)
8. [Persyaratan Non-Fungsional](#8-persyaratan-non-fungsional)
9. [Rencana Laporan Keuangan](#9-rencana-laporan-keuangan)
10. [Roadmap Pengembangan](#10-roadmap-pengembangan)
11. [Kriteria Keberhasilan](#11-kriteria-keberhasilan)
12. [Risiko & Mitigasi](#12-risiko--mitigasi)
13. [Asumsi & Dependensi](#13-asumsi--dependensi)

---

## 1. Ringkasan Eksekutif

**Siddeeq Cycle Works** adalah platform kasir (Point of Sale) yang terintegrasi secara penuh dengan mesin akuntansi berbasis prinsip syariah. Produk ini dirancang untuk usaha bengkel/spare part sepeda motor yang membutuhkan pencatatan keuangan transparan, akuntabel, dan sesuai kaidah akuntansi syariah (termasuk akad Murabahah).

Setiap transaksi penjualan yang dilakukan di kasir akan secara otomatis menghasilkan jurnal akuntansi double-entry, memperbarui stok inventaris secara real-time, dan mengalimentasi laporan keuangan (Laba Rugi, Neraca, dan Arus Kas) tanpa memerlukan input ulang dari tim keuangan.

---

## 2. Latar Belakang & Tujuan

### 2.1 Masalah yang Diselesaikan

- Pencatatan keuangan masih dilakukan manual dan terpisah dari sistem kasir, menyebabkan potensi kesalahan dan keterlambatan laporan.
- Tidak adanya mekanisme pencatatan akad syariah (Murabahah) yang terintegrasi dalam sistem transaksi.
- Stok barang tidak terbarui secara real-time setelah setiap transaksi penjualan.
- Tidak ada transparansi margin kepada pembeli sesuai prinsip syariah.

### 2.2 Tujuan Produk

| Tujuan | Indikator Keberhasilan |
|---|---|
| Mengotomasi penjurnalan akuntansi dari setiap transaksi | 100% transaksi tercatat di buku jurnal tanpa input manual |
| Memastikan kepatuhan terhadap prinsip akuntansi syariah | Laporan syariah tersedia dan akad Murabahah terdokumentasi |
| Memperbarui stok secara real-time | Stok berkurang otomatis setiap kali transaksi selesai |
| Menyediakan laporan keuangan akurat dan instan | Laporan Laba Rugi, Neraca, dan Arus Kas tersedia kapan saja |

---

## 3. Ruang Lingkup Produk

### 3.1 Dalam Lingkup (In Scope)

- Modul Point of Sale (POS) / Kasir
- Modul Manajemen Inventaris (Inventory)
- Modul Pencatatan Biaya Operasional (Expense)
- Mesin Akuntansi Otomatis (Automated Journaling Engine)
- Modul Transaksi Syariah (Murabahah, Penerimaan & Pengeluaran Kas)
- Modul Laporan Keuangan (Laba Rugi, Neraca, Arus Kas, Laporan Syariah)
- Log Audit Syariah
- Integrasi pengiriman struk via WhatsApp (Fonnte)
- Dashboard KPI berbasis Vercel

### 3.2 Di Luar Lingkup (Out of Scope)

- Modul penggajian karyawan (Payroll)
- Integrasi dengan platform e-commerce eksternal
- Aplikasi mobile native (iOS/Android)
- Fitur multi-cabang (dipertimbangkan di versi berikutnya)

---

## 4. Pengguna & Pemangku Kepentingan

| Peran | Deskripsi | Kebutuhan Utama |
|---|---|---|
| **Kasir** | Staf yang melayani transaksi penjualan harian | Input cepat, pencarian part mudah, cetak/kirim struk |
| **Admin Gudang** | Pengelola stok dan penerimaan barang | Update stok masuk, laporan stok sisa |
| **Manajer / Pemilik** | Pemantau kinerja bisnis | Dashboard KPI, laporan laba rugi, neraca |
| **Tim Keuangan** | Verifikasi dan pelaporan akuntansi | Jurnal otomatis, laporan bulanan, log audit |
| **Pembeli** | Pelanggan bengkel | Struk digital transparan, akad terdokumentasi |

---

## 5. Arsitektur Alur Data

Alur data dirancang mengikuti kaidah akuntansi double-entry agar setiap transaksi langsung menghasilkan laporan keuangan yang valid:

```
Transaksi (Sales / Purchase)
        │
        ▼
Jurnal Otomatis (Auto-Journaling Engine)
        │
        ▼
Buku Besar (General Ledger)
        │
        ▼
Neraca & Laporan Laba Rugi
```

### 5.1 Modul Input (Front-End)

| Modul | Fungsi |
|---|---|
| **POS (Kasir)** | Kasir menginput barang yang terjual, memilih akad, dan menyelesaikan transaksi |
| **Inventory** | Memperbarui stok secara real-time saat barang masuk (pembelian) dan keluar (penjualan) |
| **Expense** | Penginputan biaya operasional seperti listrik, gaji, sewa, keperluan dapur, dan biaya lainnya |

### 5.2 Engine Akuntansi (Back-End Logic)

Setiap kali tombol **"Selesaikan Jual-Beli"** diklik, sistem secara otomatis membuat entri jurnal double-entry sebagai berikut:

**Untuk Transaksi Penjualan:**

| Posisi | Akun | Keterangan |
|---|---|---|
| Debet | Kas / Piutang | Uang diterima atau piutang terbentuk |
| Kredit | Pendapatan Penjualan | Pendapatan diakui |
| Debet | Harga Pokok Penjualan (HPP) | Biaya barang yang terjual |
| Kredit | Persediaan Barang | Stok berkurang |

---

## 6. Fitur & Persyaratan Fungsional

### 6.1 Modul POS (Kasir)

| ID | Fitur | Prioritas | Deskripsi |
|---|---|---|---|
| POS-01 | Input Transaksi | Tinggi | Kasir dapat memilih produk, menentukan jumlah, dan menyelesaikan transaksi |
| POS-02 | Pencarian Part Cepat | Tinggi | Fitur pencarian berdasarkan nama part atau SKU dengan respons cepat |
| POS-03 | Pemilihan Akad | Tinggi | Kasir dapat memilih jenis akad (tunai / Murabahah) saat transaksi |
| POS-04 | Struk Digital via WhatsApp | Sedang | Struk dikirim otomatis ke nomor WhatsApp pembeli menggunakan integrasi Fonnte |
| POS-05 | Tanda Tangan Digital Akad | Sedang | Pembeli menyepakati harga di awal dengan tanda tangan digital |
| POS-06 | Resend Akad Online | Rendah | Akad dapat dikirim ulang via saluran online jika diperlukan |

### 6.2 Modul Inventory

| ID | Fitur | Prioritas | Deskripsi |
|---|---|---|---|
| INV-01 | Pemotongan Stok Otomatis | Tinggi | Stok berkurang secara real-time setiap transaksi penjualan selesai |
| INV-02 | Penambahan Stok (Barang Masuk) | Tinggi | Admin dapat menginput penerimaan barang untuk menambah stok |
| INV-03 | Manajemen Data Produk | Tinggi | Tambah, ubah, hapus data produk termasuk SKU, harga beli (HPP), dan harga jual |
| INV-04 | Laporan Stok Tersisa | Sedang | Menampilkan sisa stok seluruh produk secara real-time |

### 6.3 Modul Expense (Biaya Operasional)

| ID | Fitur | Prioritas | Deskripsi |
|---|---|---|---|
| EXP-01 | Input Biaya Operasional | Tinggi | Pengguna dapat mencatat pengeluaran seperti listrik, gaji, sewa, dsb. |
| EXP-02 | Kategorisasi Biaya | Sedang | Biaya dikategorikan sesuai Chart of Accounts |
| EXP-03 | Jurnal Otomatis Biaya | Tinggi | Setiap input biaya langsung dicatat ke jurnal sebagai entri debet biaya / kredit kas |

### 6.4 Modul Transaksi Syariah

| ID | Fitur | Prioritas | Deskripsi |
|---|---|---|---|
| SYR-01 | Akad Murabahah | Tinggi | Sistem mendukung pencatatan akad Murabahah dengan kepastian harga di awal |
| SYR-02 | Transparansi Margin | Tinggi | Margin keuntungan dapat ditampilkan kepada pembeli jika diminta |
| SYR-03 | Penerimaan Kas | Tinggi | Pencatatan penerimaan kas dari berbagai sumber |
| SYR-04 | Pengeluaran Kas | Tinggi | Pencatatan pengeluaran kas termasuk pembiayaan dan biaya operasional |
| SYR-05 | Jurnal Umum Manual | Sedang | Fitur untuk input jurnal umum secara manual jika diperlukan |

### 6.5 Log Audit Syariah

Log audit wajib mencatat setiap elemen kepatuhan syariah berikut:

- **Kepastian Harga di Awal** — Setiap transaksi Murabahah mencatat harga yang telah disepakati sebelum akad berlangsung.
- **Transparansi Margin Keuntungan** — Sistem mencatat dan dapat menampilkan margin kepada pembeli jika diperlukan.
- **Tanda Tangan Digital** — Persetujuan harga terdokumentasi secara digital.
- **Resend Akad** — Sistem dapat mengirim ulang akad melalui saluran online.

---

## 7. Struktur Database

### 7.1 Tabel Utama

| Kategori | Nama Tabel | Fungsi Utama |
|---|---|---|
| **Produk** | `m_products` | Menyimpan nama part, SKU, harga beli (untuk HPP), dan harga jual |
| **Transaksi** | `t_sales` | Header transaksi: ID, tanggal, total, jenis akad |
| **Detail Transaksi** | `t_sales_detail` | Rincian barang yang terjual per transaksi |
| **Keuangan** | `m_chart_of_accounts` | Daftar akun: Kas, Persediaan, Penjualan, Biaya, dll. |
| **Jurnal** | `t_jurnal` | Catatan double-entry dari setiap pergerakan uang |

### 7.2 Skema Relasi (Entity Relationship)

```
m_products
    └──< t_sales_detail >──┐
                           t_sales
                               └──< t_jurnal
                               └── m_chart_of_accounts
```

### 7.3 Kolom Penting per Tabel

**`m_products`**
- `product_id` (PK)
- `sku`
- `name`
- `buy_price` *(digunakan sebagai HPP)*
- `sell_price`
- `stock_qty`
- `created_at`, `updated_at`

**`t_sales`**
- `sale_id` (PK)
- `sale_date`
- `total_amount`
- `akad_type` *(tunai / murabahah)*
- `customer_phone` *(untuk pengiriman struk WhatsApp)*
- `digital_signature`
- `created_by`

**`t_sales_detail`**
- `detail_id` (PK)
- `sale_id` (FK → t_sales)
- `product_id` (FK → m_products)
- `qty`
- `unit_price`
- `subtotal`

**`m_chart_of_accounts`**
- `account_id` (PK)
- `account_code`
- `account_name`
- `account_type` *(aset, kewajiban, ekuitas, pendapatan, biaya)*

**`t_jurnal`**
- `jurnal_id` (PK)
- `ref_id` *(referensi ke t_sales atau t_expense)*
- `ref_type`
- `account_id` (FK → m_chart_of_accounts)
- `debet`
- `kredit`
- `description`
- `jurnal_date`

---

## 8. Persyaratan Non-Fungsional

| Kategori | Persyaratan |
|---|---|
| **Performa** | Pencarian produk merespons dalam < 500ms; penjurnalan otomatis selesai dalam < 2 detik setelah transaksi dikonfirmasi |
| **Ketersediaan** | Sistem tersedia minimal 99,5% uptime (kecuali maintenance terjadwal) |
| **Keamanan** | Otentikasi berbasis role (kasir, admin, manajer); log akses pengguna |
| **Skalabilitas** | Arsitektur mampu menangani penambahan produk hingga 10.000 SKU tanpa degradasi performa |
| **Integrasi** | API endpoint tersedia untuk integrasi Fonnte (WhatsApp) dan dashboard Vercel |
| **Kepatuhan Syariah** | Setiap transaksi harus menyimpan metadata akad sesuai standar akuntansi syariah PSAK Syariah |
| **Auditabilitas** | Semua entri jurnal tidak dapat dihapus; hanya dapat dikoreksi dengan jurnal pembalik |

---

## 9. Rencana Laporan Keuangan

### 9.1 Laporan Laba Rugi (Profit & Loss)

Menampilkan komponen:
- **Pendapatan Penjualan** — total omset penjualan dalam periode tertentu
- **Harga Pokok Penjualan (HPP)** — dikurangkan dari pendapatan
- **Laba Kotor** — Pendapatan − HPP
- **Biaya Operasional** — listrik, gaji, sewa, dsb.
- **Laba Bersih Sebelum Zakat**
- **Alokasi Zakat Mal (2,5%)** *(fitur khusus syariah)*
- **Laba Bersih Setelah Zakat**

> ⚑ **Catatan Syariah:** Baris alokasi Zakat Mal (2,5%) ditampilkan di bawah Laba Bersih sebelum pajak sebagai bentuk komitmen terhadap prinsip syariah.

### 9.2 Laporan Posisi Keuangan (Neraca)

Menampilkan:
- **Aset** — Kas + Sisa Stok Barang (dinilai berdasarkan harga beli / HPP)
- **Kewajiban** — Utang (jika ada)
- **Ekuitas / Modal** — Aset − Kewajiban

> Neraca harus selalu seimbang: **Total Aset = Total Kewajiban + Ekuitas**

### 9.3 Laporan Arus Kas (Cash Flow)

Menampilkan pergerakan kas:
- **Arus Kas Operasional** — dari penjualan dan biaya operasional
- **Arus Kas Investasi** — pembelian aset/stok
- **Arus Kas Pendanaan** — penambahan modal

### 9.4 Log Audit Syariah

Laporan khusus yang menampilkan:
- Daftar seluruh transaksi beserta jenis akad
- Status transparansi margin per transaksi
- Catatan tanda tangan digital dan timestamp kesepakatan harga
- Riwayat resend akad

---

## 10. Roadmap Pengembangan

### Fase 1: Core Inventory & POS *(Jangka Pendek)*

**Target:** Sistem kasir operasional dengan manajemen stok real-time.

| Task | Deskripsi |
|---|---|
| Implementasi modul POS | Kasir dapat menginput dan menyelesaikan transaksi |
| Pemotongan stok otomatis | Stok berkurang di database setiap transaksi selesai |
| Fitur pencarian part cepat | Pencarian berdasarkan nama/SKU dengan performa tinggi |
| Manajemen data produk | CRUD produk dengan SKU, harga beli, dan harga jual |

### Fase 2: Automated Journaling *(Jangka Menengah)*

**Target:** Setiap transaksi penjualan otomatis tercatat ke jurnal akuntansi tanpa input manual.

| Task | Deskripsi |
|---|---|
| Engine penjurnalan otomatis | Logic back-end yang menulis ke `t_jurnal` setiap transaksi selesai |
| Chart of Accounts | Setup akun-akun standar akuntansi syariah |
| Modul Expense | Input dan penjurnalan biaya operasional |
| Modul transaksi syariah | Pencatatan akad Murabahah, transparansi margin, tanda tangan digital |
| Log Audit Syariah | Pencatatan lengkap seluruh metadata kepatuhan syariah |

### Fase 3: Financial Dashboard *(Jangka Panjang)*

**Target:** Visualisasi KPI dan laporan keuangan lengkap terintegrasi di dashboard.

| Task | Deskripsi |
|---|---|
| Laporan Laba Rugi | Dihasilkan otomatis dari data jurnal dengan alokasi Zakat Mal |
| Laporan Neraca | Tampilan posisi keuangan real-time |
| Laporan Arus Kas | Ringkasan pergerakan kas per periode |
| Dashboard KPI di Vercel | Integrasi visualisasi langsung di platform Vercel |
| Integrasi Fonnte (WhatsApp) | Pengiriman struk otomatis ke WhatsApp pembeli |

---

## 11. Kriteria Keberhasilan

| Metrik | Target |
|---|---|
| Akurasi jurnal otomatis | 100% transaksi menghasilkan jurnal double-entry yang balance |
| Kecepatan pemotongan stok | Stok terbarui dalam < 2 detik setelah transaksi selesai |
| Kepatuhan akad syariah | Seluruh transaksi Murabahah memiliki rekam jejak akad lengkap di log audit |
| Pengiriman struk WhatsApp | > 95% struk terkirim berhasil dalam < 30 detik setelah transaksi |
| Laporan keuangan | Laporan Laba Rugi dan Neraca tersedia instan tanpa input tambahan dari tim keuangan |
| Kepuasan pengguna kasir | Waktu rata-rata input transaksi < 1 menit per transaksi |

---

## 12. Risiko & Mitigasi

| Risiko | Tingkat | Mitigasi |
|---|---|---|
| Kegagalan engine penjurnalan menyebabkan data tidak balance | Tinggi | Unit test wajib untuk setiap skenario transaksi; validasi balance di layer aplikasi sebelum commit ke database |
| Integrasi Fonnte gagal mengirim struk | Sedang | Mekanisme retry otomatis; notifikasi error ke admin; fallback cetak struk manual |
| Data stok tidak sinkron akibat transaksi concurrent | Sedang | Implementasi database transaction (locking) untuk operasi stok |
| Ketidaksesuaian interpretasi akad syariah | Sedang | Konsultasi dengan ahli akuntansi syariah sebelum implementasi modul syariah |
| Kehilangan data jurnal akibat bug | Tinggi | Jurnal bersifat immutable; backup database otomatis harian |

---

## 13. Asumsi & Dependensi

### 13.1 Asumsi

- Pengguna utama (kasir dan admin) memiliki kemampuan dasar mengoperasikan aplikasi web.
- Koneksi internet tersedia di lokasi operasional untuk pengiriman struk via WhatsApp.
- Standar akuntansi yang digunakan mengacu pada PSAK Syariah Indonesia.
- Satu instance aplikasi digunakan untuk satu lokasi usaha (single-branch).

### 13.2 Dependensi Eksternal

| Dependensi | Tujuan | Keterangan |
|---|---|---|
| **Fonnte API** | Pengiriman struk digital via WhatsApp | Memerlukan akun Fonnte aktif dan nomor WhatsApp terdaftar |
| **Vercel** | Hosting platform dan dashboard KPI | Infrastruktur deployment front-end dan visualisasi data |
| **Database** | Penyimpanan data transaksi dan jurnal | Kompatibel dengan MySQL / PostgreSQL |

---

*Dokumen ini adalah PRD versi awal dan dapat diperbarui seiring perkembangan proyek. Setiap perubahan signifikan pada ruang lingkup atau fitur harus didokumentasikan sebagai revisi dengan nomor versi baru.*
