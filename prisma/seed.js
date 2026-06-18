const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean up existing records in correct order to avoid foreign key errors
  await prisma.t_jurnal.deleteMany({});
  await prisma.t_sales_detail.deleteMany({});
  await prisma.t_sales.deleteMany({});
  await prisma.m_chart_of_accounts.deleteMany({});
  await prisma.m_products.deleteMany({});

  console.log('Database cleaned.');

  // Seed Chart of Accounts
  const accounts = [
    { account_code: '101.01', account_name: 'Kas Utama (Tunai)', account_type: 'ASET' },
    { account_code: '101.02', account_name: 'Bank Syariah (Transfer)', account_type: 'ASET' },
    { account_code: '101.03', account_name: 'E-Wallet Clearing (QRIS)', account_type: 'ASET' },
    { account_code: '102', account_name: 'Persediaan Suku Cadang', account_type: 'ASET' },
    { account_code: '103', account_name: 'Piutang Murabahah', account_type: 'ASET' },
    { account_code: '401', account_name: 'Pendapatan Penjualan', account_type: 'PENDAPATAN' },
    { account_code: '501', account_name: 'Harga Pokok Penjualan (HPP)', account_type: 'BIAYA' },
    { account_code: '502', account_name: 'Biaya Listrik & Air', account_type: 'BIAYA' },
    { account_code: '503', account_name: 'Biaya Sewa Bengkel', account_type: 'BIAYA' },
    { account_code: '504', account_name: 'Biaya Gaji Karyawan', account_type: 'BIAYA' },
  ];

  for (const acc of accounts) {
    await prisma.m_chart_of_accounts.create({
      data: acc,
    });
  }
  console.log('Chart of Accounts seeded.');

  // Seed Products
  const products = [
    { id: 1, sku: 'SC-BAN-001', name: 'Ban Luar Swallow Gravel 700x38c', purchase_price: 120000, sale_price: 175000, stock_qty: 15 },
    { id: 2, sku: 'SC-RAN-002', name: 'Rantai Shimano HG-54 10 Speed', purchase_price: 180000, sale_price: 240000, stock_qty: 8 },
    { id: 3, sku: 'SC-BRA-003', name: 'Kampas Rem Hidrolik Shimano B01S', purchase_price: 45000, sale_price: 75000, stock_qty: 22 },
    { id: 4, sku: 'SC-CRK-004', name: 'Crankset Litepro Hollowtech II', purchase_price: 350000, sale_price: 490000, stock_qty: 3 },
  ];

  for (const prod of products) {
    await prisma.m_products.create({
      data: prod,
    });
  }
  console.log('Products seeded.');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
