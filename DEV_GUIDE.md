Berikut adalah file dokumen **`DEV_GUIDE.md`** yang telah dibuat secara lengkap dan siap disalin dalam satu kali tindakan (*copy-paste*). Dokumen ini disusun terstruktur sebagai panduan teknis rekayasa perangkat lunak bagi **Tim Developer**, yang mencakup aturan standarisasi penulisan kode (*Coding Standards*), alur kerja repositori (*Git Workflow*), strategi pengujian (*Testing Strategy*), serta panduan rilis produk (*Deployment Guide*).

[file-tag: code-generated-file-0-1778834738338776893]

```markdown
# Developer Onboarding & Engineering Guide — Gravel Tamasya (Siddeeq Cycle Works)

Dokumen ini ditujukan untuk **Tim Developer / Software Engineer** sebagai acuan standar penulisan kode, alur kerja repositori (Git), strategi pengujian, serta prosedur deployment pada platform **Gravel Tamasya**.

---

## DAFTAR ISI
1. [Standar Penulisan Kode (Coding Standards)](#1-standar-penulisan-kode-coding-standards)
2. [Alur Kerja Git (Git Workflow)](#2-alur-kerja-git-git-workflow)
3. [Strategi Pengujian (Testing Strategy)](#3-strategi-pengujian-testing-strategy)
4. [Panduan Deployment (Deployment Guide)](#4-panduan-deployment-deployment-guide)

---

## 1. STANDAR PENULISAN KODE (CODING STANDARDS)

Untuk menjaga konsistensi pangkalan kode (*codebase*) Next.js dan Prisma ORM, setiap developer wajib mengikuti aturan penulisan berikut:

### 1.1 Konvensi Penamaan (Naming Conventions)
* **Komponen Frontend (React/Next.js):** Menggunakan *PascalCase* (Contoh: `FormTransaction.tsx`, `ButtonSubmit.tsx`).
* **Fungsi & Variabel:** Menggunakan *camelCase* (Contoh: `calculateZakatMal()`, `totalAmount`).
* **File API Route:** Menggunakan *kebab-case* atau folder terstruktur sesuai App Router Next.js (Contoh: `app/api/v1/sales/route.ts`).
* **Kode Akuntansi (CoA):** Wajib merujuk pada kode string/angka mutlak (Contoh: `101` untuk Kas, `102` untuk Persediaan).

### 1.2 Penanganan Transaksi Database (Atomic Sharia Transaction)
Setiap mutasi yang melibatkan pemotongan stok (`m_products`) dan penjurnalan otomatis (`t_jurnal`) **WAJIB** dibungkus dalam mekanisme database transaction (`$transaction` pada Prisma) untuk menghindari kondisi *partial error* atau ketidakseimbangan neraca.

```typescript
// Contoh implementasi transaksi atomik pada Prisma ORM
const result = await prisma.$transaction(async (tx) => {
  // 1. Potong stok produk
  const product = await tx.m_products.update({
    where: { id: productId },
    data: { stock_qty: { decrement: qty } }
  });

  if (product.stock_qty < 0) {
    throw new Error(`Stok tidak mencukupi untuk SKU: ${product.sku}`);
  }

  // 2. Simpan Transaksi Penjualan
  const sale = await tx.t_sales.create({
    data: { total_amount: total, contract_type: 'MURABAHAH', customer_phone: phone }
  });

  // 3. Masukkan ke Jurnal Akuntansi (Debet Kas/Piutang)
  await tx.t_jurnal.create({
    data: { sales_id: sale.id, account_code: '101', position: 'DEBET', amount: total }
  });

  return sale;
});