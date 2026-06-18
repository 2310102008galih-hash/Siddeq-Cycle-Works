# UI Component & Form Specifications — Gravel Tamasya (Siddeeq Cycle Works)

Dokumen ini ditujukan bagi **Front-End Developer** dan **UI/UX Designer** sebagai acuan mutlak dalam implementasi antarmuka pengguna, standarisasi komponen formulir, palet warna, serta state interaksi komponen pada platform **Gravel Tamasya**.

---

## DAFTAR ISI
1. [Sistem Desain & Panduan Gaya (Design System)](#1-sistem-desain--panduan-gaya-design-system)
2. [Spesifikasi Halaman Login (Security Gate)](#2-spesifikasi-halaman-login-security-gate)
3. [Spesifikasi Formulir POS Kasir (Point of Sale Form)](#3-spesifikasi-formulir-pos-kasir-point-of-sale-form)
4. [Spesifikasi Formulir Pengeluaran (Expense Form)](#4-spesifikasi-formulir-pengeluaran-expense-form)
5. [Spesifikasi Formulir Verifikasi Cabang / Masjid](#5-spesifikasi-formulir-verifikasi-cabang--masjid)

---

## 1. SISTEM DESAIN & PANDUAN GAYA (DESIGN SYSTEM)

Untuk menjaga konsistensi visual sistem sesuai dengan *mockup* blueprint, seluruh komponen UI wajib mengimplementasikan token warna dan tipografi berikut:

### 1.1 Palet Warna (Color Tokens)
* **Primary / Brand Color:** `#1C4D32` (Deep Forest Green) - Digunakan untuk latar belakang utama sidebar, tombol aksi primer, dan identitas brand.
* **Secondary / Accent Color:** `#EAA812` (Sharia Gold) - Digunakan untuk aksen pembatas, status *pending*, indikator ringkasan emas, dan komponen visual penting.
* **Background Canvas:** `#F8F9FA` (Off-White) - Latar belakang area kerja utama/dashboard.
* **Text Main:** `#111827` (Charcoal) - Warna teks utama untuk keterbacaan tinggi.

### 1.2 Status Token Visual
* **Status `COMMITTED` / `APPROVED`:** Background `#DEF7EC`, Teks `#03543F` (Hijau).
* **Status `PENDING_APPROVAL`:** Background `#FEF3C7`, Teks `#92400E` (Kuning).
* **Status `VOID` / `REJECTED`:** Background `#FDE8E8`, Teks `#9B1C1C` (Merah).

---

## 2. SPESIFIKASI HALAMAN LOGIN (SECURITY GATE)

Halaman login mengusung tema minimalis terpusat dengan kontainer kartu putih di atas latar belakang hijau hutan (`#1C4D32`).

### 2.1 Komponen UI Login Card
* **Header Teks:** `GRAVEL TAMASYA` (Bold, font sans-serif).
* **Sub-header Teks:** `Memperlancar proses penjualan` (Muted text).
* **Field 1 (ID / EMAIL):** Input teks dengan placeholder "galih".
* **Field 2 (PASSWORD):** Input tipe password tertutup (`••••••`).
* **Tombol Utama:** Warna dasar hijau gelap (`#1C4D32`) dengan teks putih bertuliskan `MASUK DASHBOARD`.
* **Footer Teks:** `SISTEM KEAMANAN TERPADU` (Kecil, abu-abu, posisi tengah bawah kontainer).

---

## 3. SPESIFIKASI FORMULIR POS KASIR (POINT OF SALE FORM)

Komponen utama tempat kasir menginput barang bawaan pelanggan, memilih jenis akad syariah, dan memicu *automated journaling*.

### 3.1 Layout & Bidang Input Formulir POS
Formulir menggunakan pembagian tata letak 2 kolom (*Split Screen Layout*):
* **Kolom Kiri (Pencarian & Keranjang Item):**
  * **Input Cari Produk:** Tipe pencarian interaktif (*Auto-complete Search Input*) terhubung ke API `GET /api/v1/products?search={query}`. Kecepatan respons render disyaratkan < 500ms.
  * **Tabel Item Terpilih:** Menampilkan daftar suku cadang yang dimasukkan, kolom kuantitas (`qty`) yang dapat diubah, harga jual, dan subtotal harga otomatis.
* **Kolom Kanan (Informasi Pelanggan & Akad Syariah):**
  * **Input WhatsApp Pelanggan:** Tipe input angka string untuk pengiriman notifikasi Fonnte (`customer_phone`).
  * **Dropdown Pilihan Akad (`akad_type`):** Opsi wajib pilih: `Tunai` atau `Murabahah`.
  * **Modul Tanda Tangan Digital:** *Canvas Pad Area* interaktif khusus jika akad yang dipilih adalah `Murabahah`, berfungsi untuk menangkap goresan persetujuan harga pelanggan secara digital.

### 3.2 State Validasi POS
* Jika stok produk di database kurang dari jumlah `qty` yang diinput kasir, input *border* berubah menjadi warna merah (Error State) dan memicu teks bantuan: `Stok tidak mencukupi, sisa stok: X`.

---

## 4. SPESIFIKASI FORMULIR PENGELUARAN (EXPENSE FORM)

Formulir internal yang diakses oleh Kasir atau Admin Akuntansi untuk mendokumentasikan biaya operasional non-penjualan.

### 4.1 Bidang Input Formulir Expense
* **Dropdown Kode Akun Biaya (CoA):** Mengambil relasi data dari master Chart of Accounts (`m_chart_of_accounts`). Pilihan wajib berupa kategori akun bertipe `BIAYA` (Contoh: Listrik, Sewa Tempat, Gaji Karyawan, Keperluan Dapur).
* **Input Nominal Biaya:** Bertipe numerik mata uang Rupiah (`Rp`).
* **Input Tanggal Kwitansi:** Pengambilan kalender tanggal pengeluaran fisik.
* **Unggah Bukti Struk/Nota (OCR Component):** Kotak area seret-dan-lepas (*Drag and Drop File Zone*) untuk mengunggah foto struk belanja logistik guna memicu konversi teks otomatis berbasis AI Vision.

---

## 5. SPESIFIKASI FORMULIR VERIFICATION CABANG / MASJID

Formulir tingkat manajerial untuk mendaftarkan titik operasional unit usaha baru atau integrasi komunitas UMKM binaan masjid.

### 4.1 Bidang Input Formulir Kemitraan
* **Input Nama Cabang / Mitra:** Input teks teks standar.
* **Input Titik Koordinat GPS:** Dua bidang input desimal terpisah untuk nilai *Latitude* dan *Longitude*, berdampingan dengan tombol pembuka peta interaktif `Ambil Lokasi Saat Ini`.
* **Input Informasi Afiliasi Masjid:** * Kontrol sakelar (*Toggle Switch*) bertuliskan `Terintegrasi Binaan Masjid?`.
  * Jika sakelar aktif, otomatis memunculkan kolom teks tambahan: `Nama Masjid Afiliasi` dan `No. WhatsApp Pengurus/Takmir` untuk kebutuhan pengiriman pesan saksi/penjamin moral akad.

### 4.2 Aturan Interaksi Tombol Aksi (Action Buttons)
* Setiap formulir di dalam sistem wajib dilengkapi dua tombol utama pada bagian bawah kontainer:
  * **Tombol Batal (Cancel Button):** Tipe *outline/secondary button*, warna teks abu-abu/merah, berfungsi menutup formulir dan melakukan *reset state data*.
  * **Tombol Simpan (Submit Button):** Tipe *solid/primary button*, warna dasar `#1C4D32` dengan teks putih. Saat proses penyimpanan database aktif (*loading state*), tombol wajib menampilkan animasi *spinner* dan berstatus `disabled` untuk mencegah pengiriman data ganda (*double-submit protection*).