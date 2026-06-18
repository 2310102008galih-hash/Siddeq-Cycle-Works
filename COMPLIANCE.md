# Compliance & Legal Governance Documentation — Gravel Tamasya (Siddeeq Cycle Works)

Dokumen ini ditujukan untuk **Tim Developer** dan **Tim Legal** sebagai panduan kepatuhan operasional, standar auditabilitas syariah, pelindungan data pribadi, dan pengelolaan risiko internal pada platform **Gravel Tamasya**.

---

## DAFTAR ISI
1. [Kebijakan KYC & AML (Know Your Customer & Anti-Money Laundering)](#1-kebijakan-kyc--aml-know-your-customer--anti-money-laundering)
2. [Spesifikasi Jejak Audit (Audit Trail Specification)](#2-spesifikasi-jejak-audit-audit-trail-specification)
3. [Prinsip Multi-Otorisasi (Four-Eyes Rules)](#3-prinsip-multi-otorisasi-four-eyes-rules)
4. [Verifikasi Tempat Usaha & Kemitraan (Mosque/Branch Verification)](#4-verifikasi-tempat-usaha--kemitraan-mosquebranch-verification)
5. [Kebijakan Privasi Data (Privacy Policy)](#5-kebijakan-privasi-data-privacy-policy)
6. [Kebijakan Retensi Data (Data Retention Policy)](#6-kebijakan-retensi-data-data-retention-policy)

---

## 1. KEBIJAKAN KYC & AML (KNOW YOUR CUSTOMER & ANTI-MONEY LAUNDERING)

Untuk memitigasi risiko pencucian uang, pendanaan terorisme, serta memastikan keabsahan transaksi muamalah (terutama pada skema pembiayaan Akad Murabahah/cicilan), sistem wajib menerapkan standardisasi KYC dan AML.

### 1.1 Persyaratan Data KYC Pelanggan (Pembiayaan Murabahah)
Setiap pengajuan transaksi non-tunai (Murabahah) wajib mengumpulkan data valid berikut sebelum akad dapat diterbitkan:
* **Nama Lengkap** sesuai kartu identitas resmi (KTP).
* **Nomor Induk Kependudukan (NIK)** atau NPWP (Nomor Pokok Wajib Pajak).
* **Nomor Telepon/WhatsApp Aktif** (diverifikasi menggunakan OTP via Fonnte).
* **Dokumen Pendukung:** Foto KTP dan foto verifikasi wajah (*selfie* dengan KTP).

### 1.2 Penyaringan AML (Anti-Money Laundering Screening)
* **Pengecekan Otomatis:** Sistem mencocokkan data pelanggan dengan database internal Daftar Terduga Teroris dan Organisasi Teroris (DTTOT) serta Pendanaan Proliferasi Senjata Pemusnah Massal.
* **Indikator Transaksi Mencurigakan (Suspicious Transaction):** Red flag otomatis dipicu oleh sistem jika:
  * Terjadi akumulasi transaksi dalam jumlah tidak wajar dalam rentang waktu < 24 jam.
  * Pelanggan menolak memberikan informasi identitas atau dokumen pendukung yang valid.

---

## 2. SPESIFIKASI JEJAK AUDIT (AUDIT TRAIL SPECIFICATION)

Seluruh aktivitas sistem yang berkaitan dengan manipulasi data keuangan, perubahan stok, dan persetujuan akad wajib direkam secara permanen untuk kebutuhan audit kepatuhan syariah dan finansial.

### 2.1 Karakteristik Data Audit Log
* **Immutability (Tidak Dapat Diubah):** Log disimpan dalam tabel database terisolasi tanpa adanya hak akses fungsi `UPDATE` atau `DELETE`. Setiap entri diberi stempel waktu enkripsi (*cryptographic hashing*).
* **Struktur Skema Log (`t_audit_trail`):**
  * `id` (INT, Primary Key)
  * `user_id` (INT) - Identitas pengguna yang melakukan aksi.
  * `role` (ENUM: 'KASIR', 'ADMIN', 'MANAJER')
  * `action_type` (ENUM: 'CREATE_SALES', 'CORRECT_JOURNAL', 'APPROVE_CREDIT', 'STOCK_ADJUSTMENT')
  * `payload_before` (JSON, Nullable) - Keadaan data sebelum diubah.
  * `payload_after` (JSON) - Keadaan data setelah dieksekusi.
  * `ip_address` (VARCHAR)
  * `created_at` (DATETIME)

### 2.2 Immutability pada Pembukuan Otomatis
Sesuai dengan standardisasi akuntansi keuangan syariah, kesalahan input pada transaksi yang telah sah dibukukan ke tabel `t_jurnal` tidak boleh dihapus secara langsung. Koreksi wajib dilakukan melalui penerbitan **Jurnal Pembalik** (mengeliminasi dampak saldo debet/kredit sebelumnya) untuk menjaga transparansi riwayat pembukuan.

---

## 3. PRINSIP MULTI-OTORISASI (FOUR-EYES RULES)

Untuk mencegah terjadinya fraud internal dan kesalahan fatal dalam eksekusi data keuangan, sistem menerapkan prinsip kendali *Four-Eyes Rules* (minimal dibutuhkan 2 individu dengan level otoritas berbeda untuk mengesahkan aksi kritis).

### 3.1 Transaksi yang Memerlukan Otorisasi Manajer/Super Admin
1. **Koreksi Jurnal Keuangan:** Kasir atau Admin Akuntansi hanya dapat mengajukan draf koreksi jurnal; draf tersebut baru aktif mengubah Buku Besar setelah disetujui (*approved*) oleh Manajer.
2. **Penyesuaian Stok Manual (Stock Opname):** Perubahan angka stok di database tabel `m_products` tanpa melalui transaksi POS penjualan/pembelian resmi wajib mendapatkan verifikasi bertingkat.
3. **Pemberian Plafon Pembiayaan Murabahah:** Persetujuan pemberian jangka waktu cicilan atau nilai limit outstanding piutang untuk transaksi bernilai besar.

### 3.2 Alur State Machine Persetujuan Otorisasi
---

## 4. VERIFIKASI TEMPAT USAHA & KEMITRAAN (MOSQUE/BRANCH VERIFICATION)

Sebagai platform dengan semangat pemberdayaan ekonomi umat berbasis syariah, perlu dilakukan validasi dan integrasi lokasi fisik operasional (baik unit cabang mandiri maupun unit usaha berbasis komunitas/masjid terdekat).

### 4.1 Parameter Verifikasi Cabang/Mitra
Setiap pembukaan pencatatan unit usaha baru di dalam sistem wajib melewati pemenuhan data geolokasi dan legalitas lokal:
* **Pencatatan Koordinat GPS:** Validasi titik lokasi usaha melalui integrasi peta digital untuk mencegah manipulasi data cabang fiktif.
* **Afiliasi Komunitas/Masjid (Opsional):** Jika unit operasional bertindak sebagai unit UMKM binaan masjid, data takmir/pengelola keuangan masjid wajib terdaftar sebagai saksi atau penjamin moral dari kepatuhan akad muamalah setempat.

---

## 5. KEBIJAKAN PRIVASI DATA (PRIVACY POLICY)

Kebijakan ini menjamin platform mematuhi regulasi Pelindungan Data Pribadi (UU PDP) yang berlaku dalam pengolahan data pelanggan dan karyawan.

### 5.1 Prinsip Pengumpulan Data
* **Persetujuan Eksplisit (*Consent*):** Pelanggan harus memberikan persetujuan tertulis atau centang digital (digital check-box) saat nomor WhatsApp mereka dimasukkan untuk pengiriman struk digital via Fonnte atau penandatanganan akad digital.
* **Batasan Tujuan:** Data personal (nama, NIK, nomor telepon) hanya digunakan untuk kelancaran transaksi, penagihan piutah cicilan Murabahah yang sah, serta pelaporan internal zakat mal. Data tidak boleh dijual atau didistribusikan kepada pihak ketiga di luar dependensi sistem (Fonnte/Vercel) tanpa izin tertulis.

---

## 6. KEBIJAKAN RETENSI DATA (DATA RETENTION POLICY)

Pengelolaan siklus hidup data (*data lifecycle*) untuk menyeimbangkan kebutuhan ruang penyimpanan database serta pemenuhan regulasi hukum/audit keuangan nasional.

### 6.1 Durasi Penyimpanan Data Berdasarkan Kategori
* **Data Transaksi & Jurnal Akuntansi (`t_sales`, `t_jurnal`):** Wajib disimpan minimal selama **10 (sepuluh) tahun** sejak tanggal tutup buku tahunan untuk memenuhi ketentuan hukum perpajakan dan audit eksternal.
* **Data Jejak Audit (`t_audit_trail`):** Disimpan minimal selama **5 (lima) tahun** untuk kepentingan pelacakan forensik internal dan manajemen risiko teknis.
* **File Gambar/Enkripsi Tanda Tangan Digital Akad:** Disimpan aktif selama masa tenor pembiayaan berjalan ditambah **3 tahun** setelah piutang dinyatakan lunas oleh pihak manajemen keuangan.

### 6.2 Mekanisme Penghapusan dan Pengarsipan Data Aman
Data yang telah melewati batas retensi wajib dipindahkan dari database operasional utama (*hot storage*) ke penyimpanan arsip terenkripsi jangka panjang (*cold storage*), atau dihancurkan secara permanen dari server database menggunakan algoritma penghapusan aman agar data tidak dapat dipulihkan kembali oleh pihak mana pun.