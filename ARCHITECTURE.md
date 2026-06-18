# Architecture & Technical Documentation — Gravel Tamasya (Siddeeq Cycle Works)

Dokumen ini ditujukan untuk **Tim Developer** sebagai acuan teknis mengenai arsitektur sistem, skema database, alur data otomatis (*Automated Journaling Engine*), serta ringkasan spesifikasi API platform **Gravel Tamasya**.

---

## DAFTAR ISI
1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Skema Database (Database Schema)](#2-skema-database-database-schema)
3. [Alur Data & Logika Akuntansi (Data Flow)](#3-alur-data--logika-akuntansi-data-flow)
4. [Spesifikasi API Ringkas (API Specification)](#4-spesifikasi-api-ringkas-api-specification)
5. [Ketentuan Teknis & Non-Fungsional](#5-ketentuan-teknis--non-fungsional)

---

## 1. ARSITEKTUR SISTEM

Aplikasi dibangun menggunakan arsitektur modern berbasis komponen monolithic/serverless yang siap dideploy ke platform **Vercel** dengan tumpukan teknologi (*tech stack*) berikut:

* **Front-End & Back-End Framework:** Next.js / Node.js (App Router untuk performa rendering optimal).
* **Database Relasional:** PostgreSQL / MySQL (menyediakan dukungan penuh ACID transaction untuk menjaga konsistensi data stok dan akuntansi).
* **ORM / Database Tools:** Prisma ORM atau SQL native driver.
* **Integrasi Pihak Ketiga:** * **Fonnte API:** Untuk pengiriman notifikasi/struk digital otomatis via WhatsApp.
  * **Digital Signature Engine:** Untuk kebutuhan validasi dan tanda tangan akad Murabahah digital.

---

## 2. SKEMA DATABASE (DATABASE SCHEMA)

Berikut adalah struktur tabel inti relasional yang diimplementasikan dalam database. Semua tabel keuangan saling terhubung untuk mendukung pencatatan *double-entry*.

### 2.1 Tabel Master Produk (`m_products`)
Menyimpan informasi inventory suku cadang/part sepeda.
* `id` (INT, Primary Key, Auto Increment)
* `sku` (VARCHAR, Unique) - Kode unik part/barang.
* `name` (VARCHAR) - Nama suku cadang.
* `purchase_price` (DECIMAL) - Harga beli (digunakan sebagai basis dasar HPP).
* `sale_price` (DECIMAL) - Harga jual ke konsumen.
* `stock_qty` (INT) - Kuantitas stok aktif.

### 2.2 Tabel Transaksi Penjualan (`t_sales`)
Header data transaksi kasir (POS).
* `id` (INT, Primary Key, Auto Increment)
* `invoice_number` (VARCHAR, Unique) - Format: `INV/YYYYMMDD/XXXX`
* `transaction_date` (DATETIME) - Tanggal dan waktu transaksi.
* `total_amount` (DECIMAL) - Total nilai penjualan bersih.
* `contract_type` (ENUM: 'TUNAI', 'MURABAHAH') - Jenis akad transaksi syariah.
* `customer_phone` (VARCHAR) - Nomor WhatsApp tujuan untuk integrasi Fonnte.
* `digital_signature` (TEXT, Nullable) - Data enkripsi/path gambar tanda tangan akad.

### 2.3 Tabel Detail Transaksi (`t_sales_detail`)
Breakdown item yang terjual pada tiap nomor invoice.
* `id` (INT, Primary Key, Auto Increment)
* `sales_id` (INT, Foreign Key -> `t_sales.id`)
* `product_id` (INT, Foreign Key -> `m_products.id`)
* `qty` (INT) - Jumlah barang dibeli.
* `price` (DECIMAL) - Harga jual barang saat transaksi berjalan.
* `subtotal` (DECIMAL) - Rumus: `qty * price`.

### 2.4 Tabel Master Chart of Accounts (`m_chart_of_accounts`)
Master kode akun akuntansi standar syariah.
* `account_code` (VARCHAR, Primary Key) - Contoh: `101` (Kas), `102` (Persediaan), `401` (Pendapatan).
* `account_name` (VARCHAR) - Nama akun.
* `account_type` (ENUM: 'ASET', 'KEWAJIBAN', 'EKUITAS', 'PENDAPATAN', 'BIAYA')

### 2.5 Tabel Jurnal Akuntansi (`t_jurnal`)
Buku besar pencatatan berpasangan otomatis (*immutable ledger*).
* `id` (INT, Primary Key, Auto Increment)
* `sales_id` (INT, Nullable, Foreign Key -> `t_sales.id`)
* `journal_date` (DATETIME) - Waktu pencatatan jurnal.
* `account_code` (VARCHAR, Foreign Key -> `m_chart_of_accounts.account_code`)
* `position` (ENUM: 'DEBET', 'KREDIT')
* `amount` (DECIMAL) - Nilai mutasi keuangan.

---

## 3. ALUR DATA & LOGIKA AKUNTANSI (DATA FLOW)

Setiap siklus jual-beli berinteraksi langsung dengan inventaris dan engine akuntansi secara atomik (*All-or-Nothing Transaction*). 
// Contoh jika menggunakan Prisma ORM
enum PaymentMethod {
  TUNAI
  MURABAHAH
  QRIS
  TRANSFER
}

// Tambahkan kolom ini di model t_sales
model Sales {
  id             Int           @id @default(autoincrement())
  invoice_number String        @unique
  total_amount   Decimal
  payment_method PaymentMethod // Menggunakan enum baru
  // ... kolom lainnya
}