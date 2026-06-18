Berikut adalah file dokumen **`SECURITY.md`** yang telah dibuat secara lengkap dan siap disalin dalam satu kali tindakan (*copy-paste*). Dokumen ini disusun secara komprehensif sebagai panduan operasional infrastruktur, mitigasi risiko siber, strategi pemulihan data (*disaster recovery*), serta *Runbook* taktis yang ditujukan bagi **Tim Developer** dan **DevOps Engineer**.

[file-tag: code-generated-file-0-1778835034347162291]

```markdown
# Security, Incident Response, & DevOps Infrastructure Runbook — Gravel Tamasya (Siddeeq Cycle Works)

Dokumen ini ditujukan bagi **Tim Developer** dan **DevOps Engineer** sebagai acuan teknik mutlak dalam mengonfigurasi sistem keamanan, manajemen insiden gawat darurat, strategi pencadangan data (*backup*), serta prosedur pemulihan bencana (*disaster recovery*) pada platform **Gravel Tamasya**.

---

## DAFTAR ISI
1. [Kebijakan Keamanan Sistem (Security Policy)](#1-kebijakan-keamanan-sistem-security-policy)
2. [Prosedur Penanganan Insiden (Incident Response Procedure)](#2-prosedur-penanganan-insiden-incident-response-procedure)
3. [Strategi Pencadangan & Pemulihan (Backup & Recovery Strategy)](#3-strategi-pencadangan--pemulihan-backup-recovery-strategy)
4. [Pemantauan & Sistem Peringatan (Monitoring & Alerting)](#4-pemantauan--sistem-peringatan-monitoring-alerting)
5. [Infrastruktur Runbook Gawat Darurat (Infrastructure Runbook)](#5-infrastruktur-runbook-gawat-darurat-infrastructure-runbook)

---

## 1. KEBIJAKAN KEAMANAN SISTEM (SECURITY POLICY)

Seluruh lapisan arsitektur aplikasi wajib dilindungi dari potensi kerentanan keamanan siber (*cybersecurity vulnerabilities*) guna menjaga kerahasiaan data transaksi syariah dan data pribadi pelanggan (KTP/WhatsApp).

### 1.1 Keamanan Pengiriman Data & Token Manajemen
* **Enkripsi Transit:** Semua lalu lintas data HTTP wajib dialihkan secara otomatis ke **HTTPS menggunakan protokol TLS 1.3** yang dikonfigurasi pada level Vercel Edge Network.
* **Manajemen Variabel Lingkungan (Secret Keys):** Kredensial sensitif seperti `DATABASE_URL`, `FONNTE_API_TOKEN`, dan API keys penyedia layanan LLM/OCR dilarang keras dimasukkan ke dalam kode sumber Git (*hardcoded*). Kredensial wajib dienkripsi dan disimpan pada panel *Environment Variables* Vercel.
* **Keamanan Database:** Akses port PostgreSQL/MySQL tidak boleh dibuka untuk publik (`0.0.0.0/0`). Koneksi dari Vercel ke database wajib dilindungi menggunakan *Connection Pooling* terenkripsi (SSL mode `require`).

### 1.2 Perlindungan Terhadap Kerentanan Aplikasi (OWASP Top 10)
* **SQL Injection Prevention:** Seluruh interaksi database wajib menggunakan objek query terparameter yang disediakan bawaan oleh Prisma ORM (`prisma.t_sales.findUnique()`). Penggunaan raw SQL query manual dilarang kecuali melalui sanitasi input yang ketat.
* **Cross-Site Scripting (XSS):** Data masukan dari form kasir (seperti nama pelanggan atau nomor telepon) wajib melewati proses sanitasi sebelum direndering oleh Next.js untuk mencegah eksekusi skrip berbahaya.

---

## 2. PROSEDUR PENANGANAN INSIDEN (INCIDENT RESPONSE PROCEDURE)

Siklus penanganan ketika terjadi anomali atau serangan siber di dalam sistem mengikuti tahapan standar operasi baku berikut:

### 2.1 Fase Penanganan Insiden Keamanan
1. **Deteksi & Analisis:** Identifikasi anomali transaksi atau lonjakan lalu lintas data yang mencurigakan melalui dashboard pemantauan.
2. **Penahanan (Containment):** Isolasi komponen yang terdampak. Jika token API Fonnte bocor, segera lakukan mencabut hak akses (*revoke token*) melalui dasbor Fonnte dan ganti dengan token baru di lingkungan Vercel.
3. **Pembasmian & Pemulihan:** Perbaiki celah keamanan yang dieksploitasi, bersihkan log, dan kembalikan status sistem ke kondisi normal yang stabil via deployment ulang cadangan kode terakhir yang aman.
4. **Evaluasi Pasca-Insiden (Post-Mortem):** Dokumentasikan kronologi insiden, estimasi kerugian data, dan langkah preventif agar masalah serupa tidak terulang di masa depan.

---

## 3. STRATEGI PENCADANGAN & PEMULIHAN (BACKUP & RECOVERY STRATEGY)

Integritas data pembukuan berpasangan (`t_jurnal`) bersifat krusial bagi keberlangsungan usaha. Kehilangan data finansial dikategorikan sebagai kegagalan sistem tingkat fatal.

### 3.1 Parameter Target Pemulihan Data
* **Recovery Point Objective (RPO):** Maksimal **24 jam**. Kehilangan data akibat bencana fisik atau kegagalan server database tidak boleh melebihi rekam data transaksi satu hari terakhir.
* **Recovery Time Objective (RTO):** Maksimal **2 jam**. Sistem harus dapat beroperasi normal kembali di lingkungan baru dalam kurun waktu kurang dari 2 jam setelah kegagalan terjadi.

### 3.2 Jadwal & Kebijakan Backup Otomatis
* **Snapshot Harian (Daily Backup):** Engine database (PostgreSQL/MySQL) dikonfigurasi untuk melakukan *automated backup snapshot* setiap hari pada pukul **02.00 WIB** (waktu operasional bengkel libur).
* **Penyimpanan Terisolasi (Off-site Storage):** Berkas cadangan dump dialokasikan secara otomatis ke *Cloud Object Storage* yang terpisah secara fisik dari server database utama, dilengkapi dengan retensi penyimpanan selama **30 hari** sebelum dihapus otomatis.

---

## 4. PEMANTAUAN & SISTEM PERINGATAN (MONITORING & ALERTING)

Visibilitas kondisi server dan performa kode Next.js dipantau secara real-time menggunakan layanan analitik internal Vercel dan monitoring log database.

### 4.1 Ambang Batas Peringatan Kritis (Metrics & Thresholds)
Sistem otomatis mengirimkan peringatan gawat darurat ke kanal komunikasi internal tim DevOps jika parameter berikut terpenuhi:
* **API Error Rate:** Lebih dari 5% dari total request dalam jendela waktu 5 menit menghasilkan status HTTP 5xx.
* **Database Connection Pool Exhaustion:** Penggunaan pooling koneksi database mencapai angka 90% dari batas maksimal kapasitas instans.
* **Fonnte API Failures:** Gagal mengirim struk WhatsApp berturut-turut sebanyak 5 kali transaksi (indikasi kehabisan kuota kupon pesan atau API Fonnte mengalami *downtime*).

---

## 5. INFRASTRUKTUR RUNBOOK GAWAT DARURAT (INFRASTRUCTURE RUNBOOK)

Panduan operasional taktis langkah demi langkah bagi tim DevOps saat menangani kendala teknis kritikal di lapangan.

### 5.1 RUNBOOK A: Menangani Kegagalan Sinkronisasi Stok Akibat Transaksi Bersamaan (*Concurrent Sales*)
* **Gejala:** Terjadi deviasi perhitungan sisa stok barang di tabel `m_products` saat kasir melayani transaksi dalam waktu yang bersamaan.
* **Solusi Perbaikan:**
  1. Periksa log error database pada Vercel Runtime Logs.
  2. Pastikan transaksi database telah menerapkan tingkat isolasi yang aman (*Serializable Isolation* atau pemanfaatan klausa `SELECT ... FOR UPDATE` pada baris stok).
  3. Lakukan deploy ulang hotfix penanganan *race condition* jika perbaikan logika telah di-commit pada branch `main`.

### 5.2 RUNBOOK B: Pemulihan Database dari Berkas Cadangan (*Database Restoration*)
Jika database utama mengalami kerusakan struktural atau korupsi data:
1. Matikan lalu lintas masuk sementara dengan mengaktifkan halaman *Maintenance Mode* di Vercel Dashboard guna mencegah input transaksi baru yang parsial.
2. Unduh berkas dump database stabil terakhir (`.sql` atau format kompresi biner) dari *secure backup storage*.
3. Jalankan perintah restorasi pada instance database baru/kosong:
   ```bash
   # Contoh perintah restorasi PostgreSQL
   pg_restore -U db_user -d db_gravel_tamasya -v /path/to/backup_file.dump