# Business Rules & Logic Registry — Gravel Tamasya (Siddeeq Cycle Works)

Dokumen ini ditujukan bagi **Tim Developer** dan **Product Owner** sebagai acuan mutlak mengenai seluruh aturan bisnis, alur kerja otorisasi (*approval workflow*), manajemen peran (*roles & permissions*), batas ambang transaksi (*thresholds*), alur program POS-Akuntansi Syariah, serta mekanisme verifikasi kemitraan berbasis komunitas/masjid pada platform **Gravel Tamasya**.

---

## DAFTAR ISI
1. [Manajemen Peran & Hak Akses (Roles & Permissions)](#1-manajemen-peran--hak-akses-roles--permissions)
2. [Alur Kerja Otomatisasi & Persetujuan (Approval Workflow)](#2-alur-kerja-otomatisasi--persetujuan-approval-workflow)
3. [Batas Ambang Transaksi & Risiko (Transaction Thresholds)](#3-batas-ambang-transaksi--risiko-transaction-thresholds)
4. [Alur Program Inti (Core Program Logic Flows)](#4-alur-program-inti-core-program-logic-flows)
5. [Alur Verifikasi Komunitas/Masjid (Mosque/Branch Verification Flow)](#5-alur-verifikasi-komunitasmasjid-mosquebranch-verification-flow)

---

## 1. MANAJEMEN PERAN & HAK AKSES (ROLES & PERMISSIONS)

Sistem menerapkan kontrol akses berbasis peran (*Role-Based Access Control / RBAC*) yang ketat untuk mengamankan data transaksi finansial dan memisahkan tugas operasional secara akuntabel.

| Hak Akses / Fitur | KASIR | ADMIN AKUNTANSI | MANAJER / OWNER |
| :--- | :---: | :---: | :---: |
| Mengoperasikan POS Penjualan (`t_sales`) | ✅ Ya | ❌ Tidak | ✅ Ya |
| Menginput Biaya Operasional / Struk Kas (`Expense`) | ✅ Ya | ✅ Ya | ✅ Ya |
| Melakukan Koreksi Jurnal Keuangan (`t_jurnal`) | ❌ Tidak | 📝 Draf Saja | ✅ Ya (Otorisasi Penuh) |
| Melakukan *Stock Opname* Manual (`m_products`) | ❌ Tidak | ❌ Tidak | ✅ Ya |
| Mengubah Parameter Akad & Plafon Murabahah | ❌ Tidak | ❌ Tidak | ✅ Ya |
| Menyetujui Pendaftaran Mitra Cabang Baru | ❌ Tidak | ❌ Tidak | ✅ Ya |

---

## 2. ALUR KERJA OTOMATISASI & PERSETUJUAN (APPROVAL WORKFLOW)

Sesuai dengan prinsip kendali internal *Four-Eyes Rules*, setiap transaksi kritis atau perubahan data masa lalu tidak boleh langsung dieksekusi tanpa adanya otorisasi bertingkat.

### 2.1 Alur Pengajuan & Koreksi Jurnal Akuntansi
Apabila terjadi kesalahan input nominal akun atau kode Chart of Accounts (CoA) oleh tim Admin Akuntansi:
1. **Inisiasi:** Admin Akuntansi membuat entri Koreksi Jurnal di dalam sistem. Status data di-set menjadi `PENDING_APPROVAL`.
2. **Immutability Protection:** Jurnal asli tidak boleh dihapus atau diubah langsung secara *harddelete*.
3. **Review Manajer:** Manajer menerima notifikasi di dasbor persetujuan.
4. **Keputusan (State Machine):**
   * **APPROVED:** Sistem otomatis menerbitkan **Jurnal Pembalik (Reversal Journal)** untuk mengeliminasi dampak entri lama, kemudian menerbitkan entri jurnal baru yang valid secara berpasangan. Status berubah menjadi `COMMITTED`.
   * **REJECTED:** Status berubah menjadi `VOID`. Draf pengajuan diarsipkan tanpa mengubah Buku Besar.

---

## 3. BATAS AMBANG TRANSAKSI & RISIKO (TRANSACTION THRESHOLDS)

Batas ambang (*thresholds*) diterapkan untuk memitigasi risiko fraud internal, kesalahan input kasir, serta mematuhi batas pengelolaan risiko piutang macet pada Akad Murabahah.

* **Batas Transaksi Kasir Tanpa Otorisasi:** Maksimal **Rp 5.000.000,-** per invoice untuk transaksi tunai. Transaksi di atas nilai ini wajib meminta input PIN verifikasi Manajer di layar POS sebelum struk terbit.
* **Plafon Piutang Murabahah Maksimal Pelanggan:** Batas maksimal sisa saldo outstanding piutang per pelanggan (KYC NIK terdaftar) adalah **Rp 15.000.000,-**. Jika pelanggan memiliki cicilan berjalan yang belum lunas dan mencoba mengajukan akad baru hingga melewati batas plafon, sistem otomatis memblokir transaksi hingga dilakukan pelunasan atau kenaikan limit oleh Owner.
* **Ambang Batas Kas Kecil Bengkel (Petty Cash):** Pengeluaran biaya operasional harian fisik (*cash expense*) oleh kasir dibatasi maksimal **Rp 1.000.000,-** per pengajuan nota.

---

## 4. ALUR PROGRAM INTI (CORE PROGRAM LOGIC FLOWS)

### 4.1 Alur Transaksi POS & Automated Journaling Engine
Setiap kali kasir menekan tombol "Selesaikan Jual-Beli", sistem wajib menjalankan rangkaian fungsi logika terstruktur (*Atomic Transaction Pipelines*) sebagai berikut:
---

## 5. ALUR VERIFIKASI KOMUNITAS/MASJID (MOSQUE/BRANCH VERIFICATION FLOW)

Untuk mendukung model bisnis inklusif berbasis komunitas umat dan kemitraan UMKM binaan masjid terdekat, pendaftaran cabang atau mitra usaha baru wajib melalui alur validasi berikut:

1. **Pengisian Formulir Kemitraan:** Calon pengelola unit usaha menginput data legalitas, nama penanggung jawab, alamat fisik, beserta titik koordinat GPS lokasi usaha.
2. **Pencatatan Afiliasi Masjid:** Menginput nama masjid terintegrasi serta kontak nomor WhatsApp Takmir/Pengurus Masjid yang bertindak sebagai saksi moral kepatuhan muamalah syariah setempat.
3. **Verifikasi Geofencing:** Sistem memvalidasi kesesuaian data koordinat GPS yang dimasukkan dengan radius operasional logistik guna menghindari pencatatan cabang fiktif.
4. **Persetujuan Akhir:** Owner/Super Admin mengkaji kelayakan dokumen secara digital, mengubah status kemitraan dari `PROPOSED` menjadi `ACTIVE`, dan membuka hak akses sistem bagi kasir di cabang baru tersebut.