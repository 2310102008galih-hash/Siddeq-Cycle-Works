import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

export interface Product {
  id: number;
  sku: string;
  name: string;
  purchase_price: number;
  sale_price: number;
  stock_qty: number;
}

export interface SaleDetail {
  id: number;
  sales_id: number;
  product_id: number;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  transaction_date: Date;
  total_amount: number;
  payment_method: 'TUNAI' | 'MURABAHAH' | 'QRIS' | 'TRANSFER';
  customer_phone?: string | null;
  digital_signature?: string | null;
  transfer_reference?: string | null;
  details?: SaleDetail[];
}

export interface Journal {
  id: number;
  sales_id?: number | null;
  journal_date: Date;
  account_code: string;
  position: 'DEBET' | 'KREDIT';
  amount: number;
}

const isTest = process.env.NODE_ENV === 'test';
const PRODUCTS_DB_PATH = path.join(process.cwd(), 'prisma', isTest ? 'mock_products_db_test.json' : 'mock_products_db.json');
const SALES_DB_PATH = path.join(process.cwd(), 'prisma', isTest ? 'mock_sales_db_test.json' : 'mock_sales_db.json');
const JOURNALS_DB_PATH = path.join(process.cwd(), 'prisma', isTest ? 'mock_journals_db_test.json' : 'mock_journals_db.json');

// Initial Mock data helpers
function getLocalProducts(): Product[] {
  if (!fs.existsSync(PRODUCTS_DB_PATH)) {
    const initial = [
      { id: 1, sku: 'SC-BAN-001', name: 'Ban Luar Swallow Gravel 700x38c', purchase_price: 120000, sale_price: 175000, stock_qty: 15 },
      { id: 2, sku: 'SC-RAN-002', name: 'Rantai Shimano HG-54 10 Speed', purchase_price: 180000, sale_price: 240000, stock_qty: 8 },
      { id: 3, sku: 'SC-BRA-003', name: 'Kampas Rem Hidrolik Shimano B01S', purchase_price: 45000, sale_price: 75000, stock_qty: 22 },
      { id: 4, sku: 'SC-CRK-004', name: 'Crankset Litepro Hollowtech II', purchase_price: 350000, sale_price: 490000, stock_qty: 3 },
    ];
    fs.writeFileSync(PRODUCTS_DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  return JSON.parse(fs.readFileSync(PRODUCTS_DB_PATH, 'utf-8'));
}

function saveLocalProducts(products: Product[]) {
  fs.writeFileSync(PRODUCTS_DB_PATH, JSON.stringify(products, null, 2), 'utf-8');
}

function getLocalSales(): Sale[] {
  if (!fs.existsSync(SALES_DB_PATH)) {
    fs.writeFileSync(SALES_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  return JSON.parse(fs.readFileSync(SALES_DB_PATH, 'utf-8'));
}

function saveLocalSales(sales: Sale[]) {
  fs.writeFileSync(SALES_DB_PATH, JSON.stringify(sales, null, 2), 'utf-8');
}

function getLocalJournals(): Journal[] {
  if (!fs.existsSync(JOURNALS_DB_PATH)) {
    const initial = [
      { id: 1, sales_id: null, journal_date: new Date('2026-05-22'), account_code: '101.01', position: 'DEBET', amount: 175000 },
      { id: 2, sales_id: null, journal_date: new Date('2026-05-22'), account_code: '401', position: 'KREDIT', amount: 175000 },
      { id: 3, sales_id: null, journal_date: new Date('2026-05-22'), account_code: '501', position: 'DEBET', amount: 120000 },
      { id: 4, sales_id: null, journal_date: new Date('2026-05-22'), account_code: '102', position: 'KREDIT', amount: 120000 },
      { id: 5, sales_id: null, journal_date: new Date('2026-05-22'), account_code: '502', position: 'DEBET', amount: 350000 },
      { id: 6, sales_id: null, journal_date: new Date('2026-05-22'), account_code: '101.01', position: 'KREDIT', amount: 350000 },
    ];
    fs.writeFileSync(JOURNALS_DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial as any[];
  }
  return JSON.parse(fs.readFileSync(JOURNALS_DB_PATH, 'utf-8'));
}

function saveLocalJournals(journals: Journal[]) {
  fs.writeFileSync(JOURNALS_DB_PATH, JSON.stringify(journals, null, 2), 'utf-8');
}

async function isDbReady(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }
  try {
    await prisma.m_products.count();
    return true;
  } catch (e) {
    return false;
  }
}

export const salesDb = {
  async getProducts(): Promise<Product[]> {
    const ready = await isDbReady();
    if (ready) {
      const dbProducts = await prisma.m_products.findMany({
        orderBy: { id: 'asc' }
      });
      return dbProducts.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        purchase_price: Number(p.purchase_price),
        sale_price: Number(p.sale_price),
        stock_qty: p.stock_qty
      }));
    } else {
      return getLocalProducts();
    }
  },

  async createProduct(product: {
    sku: string;
    name: string;
    purchase_price: number;
    sale_price: number;
    stock_qty: number;
  }): Promise<Product> {
    const ready = await isDbReady();
    if (ready) {
      const created = await prisma.m_products.create({
        data: {
          sku: product.sku,
          name: product.name,
          purchase_price: product.purchase_price,
          sale_price: product.sale_price,
          stock_qty: product.stock_qty
        }
      });
      return {
        id: created.id,
        sku: created.sku,
        name: created.name,
        purchase_price: Number(created.purchase_price),
        sale_price: Number(created.sale_price),
        stock_qty: created.stock_qty
      };
    } else {
      const products = getLocalProducts();
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      const newProd: Product = {
        id: newId,
        sku: product.sku,
        name: product.name,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        stock_qty: product.stock_qty
      };
      products.push(newProd);
      saveLocalProducts(products);
      return newProd;
    }
  },

  async getSales(): Promise<Sale[]> {
    const ready = await isDbReady();
    if (ready) {
      const dbSales = await prisma.t_sales.findMany({
        include: { details: true },
        orderBy: { transaction_date: 'desc' }
      });
      return dbSales.map(s => ({
        id: s.id,
        invoice_number: s.invoice_number,
        transaction_date: s.transaction_date,
        total_amount: Number(s.total_amount),
        payment_method: s.payment_method as any,
        customer_phone: s.customer_phone,
        digital_signature: s.digital_signature,
        transfer_reference: s.transfer_reference,
        details: s.details.map(d => ({
          id: d.id,
          sales_id: d.sales_id,
          product_id: d.product_id,
          qty: d.qty,
          price: Number(d.price),
          subtotal: Number(d.subtotal)
        }))
      }));
    } else {
      return getLocalSales();
    }
  },

  async getJournals(): Promise<Journal[]> {
    const ready = await isDbReady();
    if (ready) {
      const dbJournals = await prisma.t_jurnal.findMany({
        orderBy: { id: 'desc' }
      });
      return dbJournals.map(j => ({
        id: j.id,
        sales_id: j.sales_id,
        journal_date: j.journal_date,
        account_code: j.account_code,
        position: j.position as any,
        amount: Number(j.amount)
      }));
    } else {
      return getLocalJournals();
    }
  },

  async executeCheckout(payload: {
    cart: Array<{ product_id: number; qty: number }>;
    paymentMethod: 'TUNAI' | 'MURABAHAH' | 'QRIS' | 'TRANSFER';
    customerPhone?: string;
    transferReference?: string;
    signatureUrl?: string;
  }): Promise<{ success: boolean; sale: Sale; products: Product[]; journals: Journal[] }> {
    
    const ready = await isDbReady();

    if (ready) {
      // Execute PostgreSQL Transaction with Atomic Locks
      return await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        let totalHpp = 0;

        // 1. Lock rows and check stock
        const lockedItems = [];
        for (const item of payload.cart) {
          // PostgreSQL SELECT ... FOR UPDATE row lock to prevent race conditions
          const [dbProduct] = await tx.$queryRawUnsafe<any[]>(
            `SELECT id, sku, name, purchase_price, sale_price, stock_qty FROM m_products WHERE id = $1 FOR UPDATE`,
            item.product_id
          );

          if (!dbProduct) {
            throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan.`);
          }

          if (dbProduct.stock_qty < item.qty) {
            throw new Error(`Stok tidak mencukupi untuk item: ${dbProduct.name}. Sisa stok: ${dbProduct.stock_qty}`);
          }

          totalAmount += Number(dbProduct.sale_price) * item.qty;
          totalHpp += Number(dbProduct.purchase_price) * item.qty;

          lockedItems.push({
            product: dbProduct,
            qty: item.qty,
            subtotal: Number(dbProduct.sale_price) * item.qty
          });
        }

        // 2. Decrement stock
        for (const item of lockedItems) {
          await tx.m_products.update({
            where: { id: item.product.id },
            data: { stock_qty: { decrement: item.qty } }
          });
        }

        // 3. Generate invoice number
        const dateNow = new Date();
        const dateStr = dateNow.toISOString().split('T')[0].replace(/-/g, '');
        const uniqueNum = Math.floor(Math.random() * 9000) + 1000;
        const invoiceNum = `INV/${dateStr}/${uniqueNum}`;

        // 4. Create Sale Header
        const sale = await tx.t_sales.create({
          data: {
            invoice_number: invoiceNum,
            total_amount: totalAmount,
            payment_method: payload.paymentMethod,
            customer_phone: payload.customerPhone || null,
            digital_signature: payload.signatureUrl || null,
            transfer_reference: payload.transferReference || null,
            transaction_date: dateNow
          }
        });

        // 5. Create Sale Details
        for (const item of lockedItems) {
          await tx.t_sales_detail.create({
            data: {
              sales_id: sale.id,
              product_id: item.product.id,
              qty: item.qty,
              price: item.product.sale_price,
              subtotal: item.subtotal
            }
          });
        }

        // 6. Account Mapping logic
        let debitAccount = '';
        if (payload.paymentMethod === 'TUNAI') debitAccount = '101.01';
        else if (payload.paymentMethod === 'TRANSFER') debitAccount = '101.02';
        else if (payload.paymentMethod === 'QRIS') debitAccount = '101.03';
        else if (payload.paymentMethod === 'MURABAHAH') debitAccount = '103';

        // 7. Write Double Entry Journals
        // Journal entry 1: Debet Kas/Piutang
        await tx.t_jurnal.create({
          data: {
            sales_id: sale.id,
            account_code: debitAccount,
            position: 'DEBET',
            amount: totalAmount,
            journal_date: dateNow
          }
        });

        // Journal entry 2: Kredit Pendapatan Penjualan
        await tx.t_jurnal.create({
          data: {
            sales_id: sale.id,
            account_code: '401',
            position: 'KREDIT',
            amount: totalAmount,
            journal_date: dateNow
          }
        });

        // Journal entry 3: Debet Harga Pokok Penjualan (HPP)
        await tx.t_jurnal.create({
          data: {
            sales_id: sale.id,
            account_code: '501',
            position: 'DEBET',
            amount: totalHpp,
            journal_date: dateNow
          }
        });

        // Journal entry 4: Kredit Persediaan Barang
        await tx.t_jurnal.create({
          data: {
            sales_id: sale.id,
            account_code: '102',
            position: 'KREDIT',
            amount: totalHpp,
            journal_date: dateNow
          }
        });

        return {
          success: true,
          sale: {
            ...sale,
            total_amount: Number(sale.total_amount),
            payment_method: sale.payment_method as any
          },
          products: await this.getProducts(),
          journals: await this.getJournals()
        };
      });

    } else {
      // Fallback JSON DB Atomicity (simulate in local JSON files)
      const products = getLocalProducts();
      const sales = getLocalSales();
      const journals = getLocalJournals();

      let totalAmount = 0;
      let totalHpp = 0;
      const lockedItems = [];

      for (const item of payload.cart) {
        const prod = products.find(p => p.id === item.product_id);
        if (!prod) {
          throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan.`);
        }
        if (prod.stock_qty < item.qty) {
          throw new Error(`Stok tidak mencukupi untuk item: ${prod.name}. Sisa stok: ${prod.stock_qty}`);
        }
        totalAmount += prod.sale_price * item.qty;
        totalHpp += prod.purchase_price * item.qty;
        lockedItems.push({ prod, qty: item.qty, subtotal: prod.sale_price * item.qty });
      }

      // Deduct stock
      for (const item of lockedItems) {
        item.prod.stock_qty -= item.qty;
      }

      const dateNow = new Date();
      const dateStr = dateNow.toISOString().split('T')[0].replace(/-/g, '');
      const uniqueNum = Math.floor(Math.random() * 9000) + 1000;
      const invoiceNum = `INV/${dateStr}/${uniqueNum}`;

      const newSaleId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
      const details: SaleDetail[] = lockedItems.map((item, idx) => ({
        id: Date.now() + idx,
        sales_id: newSaleId,
        product_id: item.prod.id,
        qty: item.qty,
        price: item.prod.sale_price,
        subtotal: item.subtotal
      }));

      const newSale: Sale = {
        id: newSaleId,
        invoice_number: invoiceNum,
        transaction_date: dateNow,
        total_amount: totalAmount,
        payment_method: payload.paymentMethod,
        customer_phone: payload.customerPhone || null,
        digital_signature: payload.signatureUrl || null,
        transfer_reference: payload.transferReference || null,
        details
      };

      // Auto journal account mapping
      let debitAccount = '';
      if (payload.paymentMethod === 'TUNAI') debitAccount = '101.01';
      else if (payload.paymentMethod === 'TRANSFER') debitAccount = '101.02';
      else if (payload.paymentMethod === 'QRIS') debitAccount = '101.03';
      else if (payload.paymentMethod === 'MURABAHAH') debitAccount = '103';

      const startJournalId = journals.length > 0 ? Math.max(...journals.map(j => j.id)) + 1 : 1;
      const newJournals: Journal[] = [
        { id: startJournalId, sales_id: newSaleId, journal_date: dateNow, account_code: debitAccount, position: 'DEBET', amount: totalAmount },
        { id: startJournalId + 1, sales_id: newSaleId, journal_date: dateNow, account_code: '401', position: 'KREDIT', amount: totalAmount },
        { id: startJournalId + 2, sales_id: newSaleId, journal_date: dateNow, account_code: '501', position: 'DEBET', amount: totalHpp },
        { id: startJournalId + 3, sales_id: newSaleId, journal_date: dateNow, account_code: '102', position: 'KREDIT', amount: totalHpp }
      ];

      sales.unshift(newSale);
      journals.unshift(...newJournals);

      saveLocalProducts(products);
      saveLocalSales(sales);
      saveLocalJournals(journals);

      return {
        success: true,
        sale: newSale,
        products,
        journals
      };
    }
  }
};
