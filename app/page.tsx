"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getSupabaseClient } from '../lib/supabaseClient';

interface Product {
  id: number;
  sku: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  stockQty: number;
}

interface CartItem {
  product: Product;
  qty: number;
  error?: string;
}

interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  totalAmount: number;
  profitAmount: number;
  akadType: 'TUNAI' | 'MURABAHAH' | 'QRIS' | 'TRANSFER';
  customerPhone?: string;
  signatureUrl?: string;
  items: {
    productId: number;
    productName: string;
    sku: string;
    qty: number;
    price: number;
  }[];
}

interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  account: string;
  position: 'DEBET' | 'KREDIT';
  amount: number;
  description: string;
  status: 'COMMITTED' | 'PENDING_APPROVAL' | 'VOID';
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, sku: 'SC-BAN-001', name: 'Ban Luar Swallow Gravel 700x38c', buyPrice: 120000, sellPrice: 175000, stockQty: 15 },
  { id: 2, sku: 'SC-RAN-002', name: 'Rantai Shimano HG-54 10 Speed', buyPrice: 180000, sellPrice: 240000, stockQty: 8 },
  { id: 3, sku: 'SC-BRA-003', name: 'Kampas Rem Hidrolik Shimano B01S', buyPrice: 45000, sellPrice: 75000, stockQty: 22 },
  { id: 4, sku: 'SC-CRK-004', name: 'Crankset Litepro Hollowtech II', buyPrice: 350000, sellPrice: 490000, stockQty: 3 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-001',
    invoiceNumber: 'INV/20260517/0001',
    date: '2026-05-17T10:00:00.000Z',
    totalAmount: 175000,
    profitAmount: 55000,
    akadType: 'TUNAI',
    customerPhone: '08123456789',
    items: [{ productId: 1, productName: 'Ban Luar Swallow Gravel 700x38c', sku: 'SC-BAN-001', qty: 1, price: 175000 }]
  },
  {
    id: 'TX-002',
    invoiceNumber: 'INV/20260518/0001',
    date: '2026-05-18T14:20:00.000Z',
    totalAmount: 240000,
    profitAmount: 60000,
    akadType: 'MURABAHAH',
    customerPhone: '08571234567',
    signatureUrl: 'mock_signature_data_url',
    items: [{ productId: 2, productName: 'Rantai Shimano HG-54 10 Speed', sku: 'SC-RAN-002', qty: 1, price: 240000 }]
  },
  {
    id: 'TX-003',
    invoiceNumber: 'INV/20260519/0001',
    date: '2026-05-19T09:15:00.000Z',
    totalAmount: 75000,
    profitAmount: 30000,
    akadType: 'TUNAI',
    customerPhone: '08129999888',
    items: [{ productId: 3, productName: 'Kampas Rem Hidrolik Shimano B01S', sku: 'SC-BRA-003', qty: 1, price: 75000 }]
  },
  {
    id: 'TX-004',
    invoiceNumber: 'INV/20260520/0001',
    date: '2026-05-20T11:45:00.000Z',
    totalAmount: 490000,
    profitAmount: 140000,
    akadType: 'TUNAI',
    customerPhone: '08781234567',
    items: [{ productId: 4, productName: 'Crankset Litepro Hollowtech II', sku: 'SC-CRK-004', qty: 1, price: 490000 }]
  },
  {
    id: 'TX-005',
    invoiceNumber: 'INV/20260521/0001',
    date: '2026-05-21T16:30:00.000Z',
    totalAmount: 175000,
    profitAmount: 55000,
    akadType: 'MURABAHAH',
    customerPhone: '08111222333',
    signatureUrl: 'mock_signature_data_url',
    items: [{ productId: 1, productName: 'Ban Luar Swallow Gravel 700x38c', sku: 'SC-BAN-001', qty: 1, price: 175000 }]
  },
  {
    id: 'TX-006',
    invoiceNumber: 'INV/20260522/0001',
    date: '2026-05-22T13:00:00.000Z',
    totalAmount: 150000,
    profitAmount: 60000,
    akadType: 'TUNAI',
    customerPhone: '08122334455',
    items: [{ productId: 3, productName: 'Kampas Rem Hidrolik Shimano B01S', sku: 'SC-BRA-003', qty: 2, price: 75000 }]
  },
  {
    id: 'TX-007',
    invoiceNumber: 'INV/20260523/0001',
    date: '2026-05-23T08:00:00.000Z',
    totalAmount: 175000,
    profitAmount: 55000,
    akadType: 'TUNAI',
    customerPhone: '08133445566',
    items: [{ productId: 1, productName: 'Ban Luar Swallow Gravel 700x38c', sku: 'SC-BAN-001', qty: 1, price: 175000 }]
  }
];

const INITIAL_JOURNALS: JournalEntry[] = [
  { id: 'J-001', date: '2026-05-22', ref: 'INV/20260522/0001', account: '101 - Kas Utama (Tunai)', position: 'DEBET', amount: 175000, description: 'Penjualan Ban Swallow', status: 'COMMITTED' },
  { id: 'J-002', date: '2026-05-22', ref: 'INV/20260522/0001', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 175000, description: 'Penjualan Ban Swallow', status: 'COMMITTED' },
  { id: 'J-002-H1', date: '2026-05-22', ref: 'INV/20260522/0001', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 120000, description: 'HPP Penjualan Ban Swallow', status: 'COMMITTED' },
  { id: 'J-002-H2', date: '2026-05-22', ref: 'INV/20260522/0001', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 120000, description: 'HPP Penjualan Ban Swallow', status: 'COMMITTED' },
  { id: 'J-003', date: '2026-05-22', ref: 'EXP-0021', account: '502 - Biaya Listrik & Air', position: 'DEBET', amount: 350000, description: 'Pembayaran Listrik Mei', status: 'PENDING_APPROVAL' },
  { id: 'J-004', date: '2026-05-22', ref: 'EXP-0021', account: '101 - Kas Utama (Tunai)', position: 'KREDIT', amount: 350000, description: 'Pembayaran Listrik Mei', status: 'PENDING_APPROVAL' },
];

export default function Home() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos'>('dashboard');

  // Shared state synchronized via localStorage
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Time filter for Dashboard metrics
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');

  // POS State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [akadType, setAkadType] = useState<'TUNAI' | 'MURABAHAH' | 'QRIS' | 'TRANSFER'>('TUNAI');
  const [transferReference, setTransferReference] = useState('');
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Canvas drawing state for digital signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Hover state for interactive SVG Line Chart tooltip
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; omset: number; profit: number } | null>(null);

  // Accordion state for transaction logs
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // State for quick-restocking inputs in Dashboard
  const [restockInputs, setRestockInputs] = useState<Record<number, string>>({});

  // Sync data on mount from backend API with local cache fallback
  useEffect(() => {
    async function syncData() {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          // Fetch products directly from Supabase
          const { data: dbProducts, error: prodErr } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });

          if (prodErr) throw new Error(prodErr.message);

          // Fetch transactions directly from Supabase
          const { data: dbTransactions, error: txErr } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: false });

          if (txErr) throw new Error(txErr.message);

          const mappedProducts = dbProducts.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            buyPrice: Number(p.purchase_price),
            sellPrice: Number(p.sale_price),
            stockQty: p.stock_qty
          }));

          const mappedTransactions = dbTransactions.map((t: any) => ({
            id: `TX-${t.id}`,
            invoiceNumber: t.invoice_number,
            date: t.transaction_date,
            totalAmount: Number(t.total_amount),
            profitAmount: Number(t.total_amount) * 0.3, // 30% estimated sharia margin
            akadType: t.payment_method,
            customerPhone: t.customer_phone || undefined,
            signatureUrl: t.digital_signature || undefined,
            transferReference: t.transfer_reference || undefined,
            items: t.items || []
          }));

          setProducts(mappedProducts);
          setTransactions(mappedTransactions);

          localStorage.setItem('siddeeq_products', JSON.stringify(mappedProducts));
          localStorage.setItem('siddeeq_transactions', JSON.stringify(mappedTransactions));
          return;
        }

        const response = await fetch('/api/v1/sync');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProducts(data.products.map((p: any) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              buyPrice: p.purchase_price,
              sellPrice: p.sale_price,
              stockQty: p.stock_qty
            })));

            setTransactions(data.sales.map((s: any) => ({
              id: `TX-${s.id}`,
              invoiceNumber: s.invoice_number,
              date: s.transaction_date,
              totalAmount: s.total_amount,
              profitAmount: s.total_amount * 0.3,
              akadType: s.payment_method,
              customerPhone: s.customer_phone || undefined,
              signatureUrl: s.digital_signature || undefined,
              transferReference: s.transfer_reference || undefined,
              items: s.details?.map((d: any) => ({
                productId: d.product_id,
                productName: `Product ID: ${d.product_id}`,
                sku: 'SKU',
                qty: d.qty,
                price: d.price
              })) || []
            })));

            localStorage.setItem('siddeeq_products', JSON.stringify(data.products.map((p: any) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              buyPrice: p.purchase_price,
              sellPrice: p.sale_price,
              stockQty: p.stock_qty
            }))));
            localStorage.setItem('siddeeq_transactions', JSON.stringify(data.sales.map((s: any) => ({
              id: `TX-${s.id}`,
              invoiceNumber: s.invoice_number,
              date: s.transaction_date,
              totalAmount: s.total_amount,
              profitAmount: s.total_amount * 0.3,
              akadType: s.payment_method,
              customerPhone: s.customer_phone || undefined,
              signatureUrl: s.digital_signature || undefined,
              transferReference: s.transfer_reference || undefined,
              items: []
            }))));
            return;
          }
        }
      } catch (err) {
        console.warn('Backend sync failed, falling back to localStorage cache:', err);
      }

      // Fallback
      const savedProducts = localStorage.getItem('siddeeq_products');
      if (savedProducts) {
        try { setProducts(JSON.parse(savedProducts)); } catch (e) { console.error(e); }
      } else {
        localStorage.setItem('siddeeq_products', JSON.stringify(INITIAL_PRODUCTS));
      }

      const savedTx = localStorage.getItem('siddeeq_transactions');
      if (savedTx) {
        try { setTransactions(JSON.parse(savedTx)); } catch (e) { console.error(e); }
      } else {
        localStorage.setItem('siddeeq_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
      }
    }

    syncData();
  }, []);

  // Filter products on query change
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) => p.sku.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Digital Signature Canvas initialization
  useEffect(() => {
    if (akadType === 'MURABAHAH' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1C4D32';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
      }
    }
  }, [akadType, activeTab]);

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const newQty = cart[existingIndex].qty + 1;
      const updatedCart = [...cart];
      
      if (newQty > product.stockQty) {
        updatedCart[existingIndex].error = `Stok tidak mencukupi, sisa stok: ${product.stockQty}`;
      } else {
        updatedCart[existingIndex].qty = newQty;
        updatedCart[existingIndex].error = undefined;
      }
      setCart(updatedCart);
    } else {
      if (product.stockQty < 1) {
        alert(`Stok untuk ${product.name} kosong!`);
        return;
      }
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  // Adjust Qty in Cart
  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updatedCart = [...cart];
    const item = updatedCart[index];

    if (newQty > item.product.stockQty) {
      item.error = `Stok tidak mencukupi, sisa stok: ${item.product.stockQty}`;
    } else {
      item.qty = newQty;
      item.error = undefined;
    }
    setCart(updatedCart);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.product.sellPrice * item.qty, 0);

  // Execute emergency client-side backup checkout if database is down
  const executeBackupCheckout = () => {
    // Calculate profit margin: (Sell - Buy) * Qty
    const profitMargin = cart.reduce(
      (acc, item) => acc + (item.product.sellPrice - item.product.buyPrice) * item.qty,
      0
    );

    // 1. Deduct stock in localStorage
    const savedProducts = localStorage.getItem('siddeeq_products');
    const currentProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : products;

    const updatedProducts = currentProducts.map((prod) => {
      const cartMatch = cart.find((c) => c.product.id === prod.id);
      if (cartMatch) {
        return { ...prod, stockQty: prod.stockQty - cartMatch.qty };
      }
      return prod;
    });

    setProducts(updatedProducts);
    localStorage.setItem('siddeeq_products', JSON.stringify(updatedProducts));

    // 2. Generate invoice number and transaction record
    const dateNow = new Date();
    const dateStr = dateNow.toISOString().split('T')[0].replace(/-/g, '');
    const uniqueNum = Math.floor(Math.random() * 9000) + 1000;
    const invoiceNum = `INV/${dateStr}/${uniqueNum}`;

    let signatureUrl = undefined;
    if (akadType === 'MURABAHAH' && canvasRef.current) {
      signatureUrl = canvasRef.current.toDataURL();
    }

    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      invoiceNumber: invoiceNum,
      date: dateNow.toISOString(),
      totalAmount,
      profitAmount: profitMargin,
      akadType,
      customerPhone: customerPhone || undefined,
      signatureUrl,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        qty: item.qty,
        price: item.product.sellPrice
      }))
    };

    const savedTx = localStorage.getItem('siddeeq_transactions');
    const currentTx: Transaction[] = savedTx ? JSON.parse(savedTx) : transactions;
    const updatedTx = [newTx, ...currentTx];
    setTransactions(updatedTx);
    localStorage.setItem('siddeeq_transactions', JSON.stringify(updatedTx));

    // 3. Automated Journaling using new syariah accounts
    const savedJournals = localStorage.getItem('siddeeq_journals');
    const currentJournals: JournalEntry[] = savedJournals ? JSON.parse(savedJournals) : INITIAL_JOURNALS;

    let debitAccount = '101.01 - Kas Utama (Tunai)';
    if (akadType === 'TRANSFER') debitAccount = '101.02 - Bank Syariah (Transfer)';
    else if (akadType === 'QRIS') debitAccount = '101.03 - E-Wallet Clearing (QRIS)';
    else if (akadType === 'MURABAHAH') debitAccount = '103 - Piutang Murabahah';

    const newJournalDebet: JournalEntry = {
      id: `J-${Date.now()}-1`,
      date: dateNow.toISOString().split('T')[0],
      ref: invoiceNum,
      account: debitAccount,
      position: 'DEBET',
      amount: totalAmount,
      description: `Penjualan POS - ${akadType}`,
      status: 'COMMITTED'
    };

    const newJournalKredit: JournalEntry = {
      id: `J-${Date.now()}-2`,
      date: dateNow.toISOString().split('T')[0],
      ref: invoiceNum,
      account: '401 - Pendapatan Penjualan',
      position: 'KREDIT',
      amount: totalAmount,
      description: `Penjualan POS - ${akadType}`,
      status: 'COMMITTED'
    };

    const newJournalHppDebet: JournalEntry = {
      id: `J-${Date.now()}-3`,
      date: dateNow.toISOString().split('T')[0],
      ref: invoiceNum,
      account: '501 - Harga Pokok Penjualan (HPP)',
      position: 'DEBET',
      amount: totalAmount - profitMargin,
      description: `HPP Penjualan POS - ${akadType}`,
      status: 'COMMITTED'
    };

    const newJournalPersediaanKredit: JournalEntry = {
      id: `J-${Date.now()}-4`,
      date: dateNow.toISOString().split('T')[0],
      ref: invoiceNum,
      account: '102 - Persediaan Suku Cadang',
      position: 'KREDIT',
      amount: totalAmount - profitMargin,
      description: `HPP Penjualan POS - ${akadType}`,
      status: 'COMMITTED'
    };

    const updatedJournals = [
      ...currentJournals,
      newJournalDebet,
      newJournalKredit,
      newJournalHppDebet,
      newJournalPersediaanKredit
    ];
    localStorage.setItem('siddeeq_journals', JSON.stringify(updatedJournals));

    setSuccessMessage(
      `[Darurat Offline] Transaksi ${invoiceNum} berhasil disimpan di localStorage cache! ` +
      `Silakan konfigurasikan DATABASE_URL jika ingin menyimpan ke database PostgreSQL.`
    );

    // Reset states
    setCart([]);
    setCustomerPhone('');
    setAkadType('TUNAI');
    setTransferReference('');
    setSearchQuery('');
    setShowQrisModal(false);
    setActiveTab('dashboard');
  };

  // Submit checkout transaction to Next.js API endpoint (with atomicity locks)
  const submitCheckout = async () => {
    if (cart.length === 0) return;

    if (akadType === 'MURABAHAH' && !customerPhone) {
      alert("WhatsApp Pelanggan wajib diisi untuk Akad Murabahah.");
      return;
    }

    if (akadType === 'TRANSFER' && !transferReference) {
      alert("Nomor referensi atau nama pengirim bank wajib diisi untuk Transfer.");
      return;
    }

    setIsSubmitting(true);

    // Prepare signature URL
    let signatureUrl = undefined;
    if (akadType === 'MURABAHAH' && canvasRef.current) {
      signatureUrl = canvasRef.current.toDataURL();
    }

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // 1. Generate unique invoice number
        const dateNow = new Date();
        const dateStr = dateNow.toISOString().split('T')[0].replace(/-/g, '');
        const uniqueNum = Math.floor(Math.random() * 9000) + 1000;
        const invoiceNum = `INV/${dateStr}/${uniqueNum}`;

        // 2. Perform checkout: Insert transaction into Supabase transactions table
        const { data: newTx, error: txErr } = await supabase
          .from('transactions')
          .insert([{
            invoice_number: invoiceNum,
            transaction_date: dateNow.toISOString(),
            total_amount: totalAmount,
            payment_method: akadType,
            customer_phone: customerPhone || null,
            transfer_reference: transferReference || null,
            digital_signature: signatureUrl || null,
            items: cart.map(item => ({
              productId: item.product.id,
              productName: item.product.name,
              sku: item.product.sku,
              qty: item.qty,
              price: item.product.sellPrice
            }))
          }])
          .select()
          .single();

        if (txErr) {
          throw new Error(txErr.message);
        }

        // 3. Decrement stock in Supabase products table
        for (const item of cart) {
          const newStock = item.product.stockQty - item.qty;
          const { error: stockErr } = await supabase
            .from('products')
            .update({ stock_qty: newStock })
            .eq('id', item.product.id);
          
          if (stockErr) {
            console.error(`Gagal memotong stok Supabase untuk produk ${item.product.name}:`, stockErr);
          }
        }

        // 4. Reload products and transactions from Supabase
        const { data: dbProducts } = await supabase.from('products').select('*').order('id', { ascending: true });
        const { data: dbTransactions } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });

        if (dbProducts) {
          const mappedProducts = dbProducts.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            buyPrice: Number(p.purchase_price),
            sellPrice: Number(p.sale_price),
            stockQty: p.stock_qty
          }));
          setProducts(mappedProducts);
          localStorage.setItem('siddeeq_products', JSON.stringify(mappedProducts));
        }

        if (dbTransactions) {
          const mappedTransactions = dbTransactions.map((t: any) => ({
            id: `TX-${t.id}`,
            invoiceNumber: t.invoice_number,
            date: t.transaction_date,
            totalAmount: Number(t.total_amount),
            profitAmount: Number(t.total_amount) * 0.3,
            akadType: t.payment_method,
            customerPhone: t.customer_phone || undefined,
            signatureUrl: t.digital_signature || undefined,
            transferReference: t.transfer_reference || undefined,
            items: t.items || []
          }));
          setTransactions(mappedTransactions);
          localStorage.setItem('siddeeq_transactions', JSON.stringify(mappedTransactions));
        }

        setSuccessMessage(
          `Transaksi ${invoiceNum} senilai Rp ${totalAmount.toLocaleString('id-ID')} berhasil disimpan ke Supabase cloud!`
        );

        // Reset cart and settings
        setCart([]);
        setCustomerPhone('');
        setAkadType('TUNAI');
        setTransferReference('');
        setSearchQuery('');
        setShowQrisModal(false);

        // Switch to dashboard to see results
        setActiveTab('dashboard');
      } else {
        // Fallback
        const response = await fetch('/api/v1/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: cart.map(item => ({ product_id: item.product.id, qty: item.qty })),
            paymentMethod: akadType,
            customerPhone: customerPhone || undefined,
            transferReference: transferReference || undefined,
            signatureUrl
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setProducts(data.products.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            buyPrice: p.purchase_price,
            sellPrice: p.sale_price,
            stockQty: p.stock_qty
          })));

          setTransactions(data.sales.map((s: any) => ({
            id: `TX-${s.id}`,
            invoiceNumber: s.invoice_number,
            date: s.transaction_date,
            totalAmount: s.total_amount,
            profitAmount: s.total_amount * 0.3,
            akadType: s.payment_method,
            customerPhone: s.customer_phone || undefined,
            signatureUrl: s.digital_signature || undefined,
            transferReference: s.transfer_reference || undefined,
            items: s.details?.map((d: any) => ({
              productId: d.product_id,
              productName: `Product ID: ${d.product_id}`,
              sku: 'SKU',
              qty: d.qty,
              price: d.price
            })) || []
          })));

          localStorage.setItem('siddeeq_products', JSON.stringify(data.products.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            buyPrice: p.purchase_price,
            sellPrice: p.sale_price,
            stockQty: p.stock_qty
          }))));
          
          localStorage.setItem('siddeeq_transactions', JSON.stringify(data.sales.map((s: any) => ({
            id: `TX-${s.id}`,
            invoiceNumber: s.invoice_number,
            date: s.transaction_date,
            totalAmount: s.total_amount,
            profitAmount: s.total_amount * 0.3,
            akadType: s.payment_method,
            customerPhone: s.customer_phone || undefined,
            signatureUrl: s.digital_signature || undefined,
            transferReference: s.transfer_reference || undefined,
            items: []
          }))));

          setSuccessMessage(
            `Transaksi ${data.sale.invoice_number} senilai Rp ${totalAmount.toLocaleString('id-ID')} berhasil disimpan ke PostgreSQL!`
          );

          setCart([]);
          setCustomerPhone('');
          setAkadType('TUNAI');
          setTransferReference('');
          setSearchQuery('');
          setShowQrisModal(false);
          setActiveTab('dashboard');
        } else {
          alert(`Checkout gagal: ${data.error || 'Terjadi kesalahan'}`);
        }
      }
    } catch (err: any) {
      console.warn("Koneksi API/Supabase gagal, menggunakan checkout darurat offline:", err);
      executeBackupCheckout();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const hasErrors = cart.some(item => item.error);
    if (hasErrors) {
      alert("Harap perbaiki jumlah item yang melebihi batas stok terlebih dahulu!");
      return;
    }

    if (akadType === 'QRIS') {
      setShowQrisModal(true);
    } else {
      submitCheckout();
    }
  };

  // Dashboard filtering & calculations
  const getFilteredTransactions = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (timeFilter === 'today') {
        return txDate >= startOfToday;
      } else if (timeFilter === 'week') {
        return txDate >= startOfWeek;
      } else {
        return txDate >= startOfMonth;
      }
    });
  };

  const filteredTx = getFilteredTransactions();

  const totalOmset = filteredTx.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalMargin = filteredTx.reduce((sum, tx) => sum + tx.profitAmount, 0);
  const totalTransactionsCount = filteredTx.length;
  const criticalStockCount = products.filter((p) => p.stockQty <= 5).length;

  // SVG Line Chart Coordinate Generator
  const getLast7DaysData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      
      const dayTxs = transactions.filter(tx => tx.date.split('T')[0] === dateStr);
      const omset = dayTxs.reduce((sum, tx) => sum + tx.totalAmount, 0);
      const profit = dayTxs.reduce((sum, tx) => sum + tx.profitAmount, 0);
      
      data.push({ dateStr, label, omset, profit });
    }
    return data;
  };

  const last7DaysData = getLast7DaysData();
  const maxOmset = Math.max(...last7DaysData.map(d => d.omset), 100000);

  const points = last7DaysData.map((d, i) => {
    const x = 50 + (i / 6) * 450;
    const y = 20 + 130 - (d.omset / maxOmset) * 130;
    const yProfit = 20 + 130 - (d.profit / maxOmset) * 130;
    return { ...d, x, y, yProfit };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

  const profitLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yProfit}`).join(' ');

  // Donut Chart calculations
  const tunaiCount = filteredTx.filter(tx => tx.akadType === 'TUNAI').length;
  const murabahahCount = filteredTx.filter(tx => tx.akadType === 'MURABAHAH').length;
  const totalCount = tunaiCount + murabahahCount || 1;

  const tunaiPercent = Math.round((tunaiCount / totalCount) * 100);
  const murabahahPercent = Math.round((murabahahCount / totalCount) * 100);

  const radius = 35;
  const circ = 2 * Math.PI * radius;
  const tunaiStroke = (tunaiCount / totalCount) * circ;
  const murabahahStroke = (murabahahCount / totalCount) * circ;
  const murabahahOffset = -tunaiStroke;

  // Handle Quick Restock in Dashboard
  const handleQuickRestock = (productId: number) => {
    const qtyStr = restockInputs[productId];
    if (!qtyStr) return;
    const qtyToAdd = parseInt(qtyStr);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) return;

    const savedProducts = localStorage.getItem('siddeeq_products');
    const currentProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : products;

    const updated = currentProducts.map(p => {
      if (p.id === productId) {
        return { ...p, stockQty: p.stockQty + qtyToAdd };
      }
      return p;
    });

    setProducts(updated);
    localStorage.setItem('siddeeq_products', JSON.stringify(updated));

    // Clear input
    setRestockInputs(prev => ({ ...prev, [productId]: '' }));
    
    // Add restock transaction journals (Debet: Persediaan, Kredit: Kas)
    const savedJournals = localStorage.getItem('siddeeq_journals');
    const currentJournals: JournalEntry[] = savedJournals ? JSON.parse(savedJournals) : INITIAL_JOURNALS;
    const targetProduct = currentProducts.find(p => p.id === productId);
    if (targetProduct) {
      const restockCost = targetProduct.buyPrice * qtyToAdd;
      const refNum = `RST-${Date.now()}`;
      const dateNowStr = new Date().toISOString().split('T')[0];

      const debetEntry: JournalEntry = {
        id: `J-${Date.now()}-R1`,
        date: dateNowStr,
        ref: refNum,
        account: '102 - Persediaan Suku Cadang',
        position: 'DEBET',
        amount: restockCost,
        description: `Restok ${qtyToAdd}x ${targetProduct.name}`,
        status: 'COMMITTED'
      };
      
      const kreditEntry: JournalEntry = {
        id: `J-${Date.now()}-R2`,
        date: dateNowStr,
        ref: refNum,
        account: '101 - Kas Utama (Tunai)',
        position: 'KREDIT',
        amount: restockCost,
        description: `Restok ${qtyToAdd}x ${targetProduct.name}`,
        status: 'COMMITTED'
      };

      localStorage.setItem('siddeeq_journals', JSON.stringify([...currentJournals, debetEntry, kreditEntry]));
    }

    alert(`Berhasil menambah stok sebanyak ${qtyToAdd} unit! Buku Jurnal Persediaan diperbarui.`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '260px' }}>
        <TopHeader title="Platform Kasir & Bisnis Terpadu" />
        
        <div style={{ padding: 'var(--spacing-6)' }}>

          {/* Success Message Banner */}
          {successMessage && (
            <div style={{
              backgroundColor: 'var(--color-committed-bg)',
              color: 'var(--color-committed-text)',
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-6)',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: '4px solid var(--color-primary)'
            }}>
              <span>{successMessage}</span>
              <button 
                onClick={() => setSuccessMessage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Tab Navigation Menu (UI.md) */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-4)', 
            marginBottom: 'var(--spacing-6)', 
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '2px'
          }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="tab-button"
              style={{
                padding: 'var(--spacing-3) var(--spacing-4)',
                fontSize: '0.95rem',
                fontWeight: 600,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'dashboard' ? '3px solid var(--color-secondary)' : '3px solid transparent',
                color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              📊 Ringkasan Bisnis (Dashboard)
            </button>
            <button
              onClick={() => setActiveTab('pos')}
              className="tab-button"
              style={{
                padding: 'var(--spacing-3) var(--spacing-4)',
                fontSize: '0.95rem',
                fontWeight: 600,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'pos' ? '3px solid var(--color-secondary)' : '3px solid transparent',
                color: activeTab === 'pos' ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              🛒 POS Kasir Utama
            </button>
          </div>

          {/* ACTIVE TAB: DASHBOARD RINGKASAN */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
              
              {/* Header Title with Time Filter buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>Dashboard Kinerja Bengkel</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monitoring omset, margin syariah, dan stok kritis secara real-time</p>
                </div>
                <div style={{
                  display: 'inline-flex',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2px'
                }}>
                  {(['today', 'week', 'month'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: timeFilter === filter ? 'var(--color-primary)' : 'transparent',
                        color: timeFilter === filter ? '#FFFFFF' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {filter === 'today' ? 'Hari Ini' : filter === 'week' ? '7 Hari Terakhir' : '30 Hari Terakhir'}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-6)' }}>
                <Card style={{ borderLeft: '4px solid var(--color-primary)', transition: 'transform 0.2s', cursor: 'default' }}>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Omset Penjualan</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--spacing-1)' }}>
                      Rp {totalOmset.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      ✓ Terintegrasi Buku Jurnal
                    </span>
                  </CardBody>
                </Card>

                <Card style={{ borderLeft: '4px solid var(--color-secondary)' }}>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Margin Keuntungan</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--spacing-1)' }}>
                      Rp {totalMargin.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary-hover)', fontWeight: 600 }}>
                      🕌 Bersih & Transparan (HPP Terjaga)
                    </span>
                  </CardBody>
                </Card>

                <Card style={{ borderLeft: '4px solid var(--color-committed-text)' }}>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transaksi Sukses</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--spacing-1)' }}>
                      {totalTransactionsCount} Transaksi
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-committed-text)', fontWeight: 600 }}>
                      100% Notifikasi WhatsApp Terkirim
                    </span>
                  </CardBody>
                </Card>

                <Card style={{ borderLeft: '4px solid var(--color-danger)' }}>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Suku Cadang Kritis</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: 'var(--spacing-1)' }}>
                      {criticalStockCount} Item
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Stok gudang di bawah 5 unit
                    </span>
                  </CardBody>
                </Card>
              </div>

              {/* Charts Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--spacing-6)' }}>
                
                {/* SVG Area/Line Chart - Tren Omset */}
                <Card>
                  <CardHeader title="Tren Omset & Profit Margin (7 Hari Terakhir)" description="Grafik garis visualisasi harian omset vs profit syariah" />
                  <CardBody style={{ position: 'relative', padding: 'var(--spacing-4)' }}>
                    <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                      <svg viewBox="0 0 520 180" width="100%" height="180" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="gradient-omset" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                          const y = 20 + ratio * 130;
                          const gridVal = Math.round(maxOmset - ratio * maxOmset);
                          return (
                            <g key={idx}>
                              <line x1="50" y1={y} x2="500" y2={y} stroke="var(--border-color)" strokeDasharray="3 3"/>
                              <text x="40" y={y + 4} textAnchor="end" fill="var(--text-secondary)" style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                                {gridVal >= 1000000 ? `${(gridVal/1000000).toFixed(1)}M` : gridVal >= 1000 ? `${Math.round(gridVal/1000)}k` : gridVal}
                              </text>
                            </g>
                          );
                        })}

                        {/* X Axis Labels */}
                        {points.map((p, i) => (
                          <text key={i} x={p.x} y="168" textAnchor="middle" fill="var(--text-secondary)" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                            {p.label}
                          </text>
                        ))}

                        {/* Omset Gradient Area */}
                        <path d={areaPath} fill="url(#gradient-omset)"/>

                        {/* Omset Line */}
                        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>

                        {/* Profit Line */}
                        <path d={profitLinePath} fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round"/>

                        {/* Points for Hover */}
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="5" 
                              fill="var(--color-primary)" 
                              stroke="#FFFFFF" 
                              strokeWidth="2" 
                              style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                              onMouseEnter={() => setHoveredPoint(p)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                            <circle 
                              cx={p.x} 
                              cy={p.yProfit} 
                              r="4" 
                              fill="var(--color-secondary)" 
                              stroke="#FFFFFF" 
                              strokeWidth="1.5" 
                              style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                              onMouseEnter={() => setHoveredPoint(p)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        ))}
                      </svg>

                      {/* Line Chart Tooltip */}
                      {hoveredPoint && (
                        <div style={{
                          position: 'absolute',
                          left: `${hoveredPoint.x - 70}px`,
                          top: `${hoveredPoint.y - 70}px`,
                          backgroundColor: '#1E293B',
                          color: '#FFFFFF',
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-lg)',
                          fontSize: '0.75rem',
                          zIndex: 50,
                          pointerEvents: 'none',
                          border: '1px solid var(--color-secondary)',
                          whiteSpace: 'nowrap'
                        }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '3px' }}>{hoveredPoint.label}</div>
                          <div>Omset: <strong>Rp {hoveredPoint.omset.toLocaleString('id-ID')}</strong></div>
                          <div>Margin: <strong style={{ color: '#FCD34D' }}>Rp {hoveredPoint.profit.toLocaleString('id-ID')}</strong></div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center', marginTop: 'var(--spacing-2)', fontSize: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '3px', backgroundColor: 'var(--color-primary)' }}></span>
                        Total Omset
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-secondary-hover)', fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '3px', backgroundColor: 'var(--color-secondary)', borderStyle: 'dashed' }}></span>
                        Margin Profit Syariah
                      </span>
                    </div>
                  </CardBody>
                </Card>

                {/* SVG Donut Chart - Distribusi Akad */}
                <Card>
                  <CardHeader title="Sebaran Akad Jual Beli" description="Persentase transaksi Tunai vs Murabahah" />
                  <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-6)' }}>
                    <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                      <svg viewBox="0 0 100 100" width="100%" height="100%">
                        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#E2E8F0" strokeWidth="12" />
                        
                        {/* Tunai segment */}
                        {tunaiCount > 0 && (
                          <circle 
                            cx="50" 
                            cy="50" 
                            r={radius} 
                            fill="transparent" 
                            stroke="var(--color-primary)" 
                            strokeWidth="12" 
                            strokeDasharray={`${tunaiStroke} ${circ}`} 
                            strokeDashoffset={tunaiStroke}
                            transform="rotate(-90 50 50)"
                          />
                        )}

                        {/* Murabahah segment */}
                        {murabahahCount > 0 && (
                          <circle 
                            cx="50" 
                            cy="50" 
                            r={radius} 
                            fill="transparent" 
                            stroke="var(--color-secondary)" 
                            strokeWidth="12" 
                            strokeDasharray={`${murabahahStroke} ${circ}`} 
                            strokeDashoffset={murabahahStroke + murabahahOffset}
                            transform="rotate(-90 50 50)"
                          />
                        )}
                      </svg>
                      {/* Center labels */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                      }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1 }}>{totalTransactionsCount}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Akad</span>
                      </div>
                    </div>

                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', marginTop: 'var(--spacing-6)' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginRight: '4px' }}></span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tunai</span>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-primary)', marginTop: '2px' }}>{tunaiPercent}% ({tunaiCount})</strong>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', marginRight: '4px' }}></span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Murabahah</span>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-secondary-hover)', marginTop: '2px' }}>{murabahahPercent}% ({murabahahCount})</strong>
                      </div>
                    </div>
                  </CardBody>
                </Card>

              </div>

              {/* Transactions List & Stock Alert Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--spacing-6)' }}>
                
                {/* Recent Transaction Log (Clickable to Expand Accordion) */}
                <Card>
                  <CardHeader title="Log Transaksi Terakhir" description="Klik pada baris transaksi untuk melihat struk & tanda tangan akad" />
                  <CardBody style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                            <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>No Invoice</th>
                            <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>Tanggal</th>
                            <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>Akad</th>
                            <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'right' }}>Total Bayar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTx.map((tx) => (
                            <React.Fragment key={tx.id}>
                              <tr 
                                onClick={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                                style={{ 
                                  borderBottom: '1px solid var(--border-color)', 
                                  cursor: 'pointer',
                                  backgroundColor: expandedTxId === tx.id ? 'var(--bg-surface-hover)' : 'transparent',
                                  transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={(e) => { if (expandedTxId !== tx.id) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.01)'; }}
                                onMouseLeave={(e) => { if (expandedTxId !== tx.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                                  {tx.invoiceNumber}
                                </td>
                                <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                  {new Date(tx.date).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                    fontWeight: 700,
                                    backgroundColor: tx.akadType === 'TUNAI' ? 'rgba(28, 77, 50, 0.08)' : 'rgba(234, 168, 18, 0.08)',
                                    color: tx.akadType === 'TUNAI' ? 'var(--color-primary)' : 'var(--color-secondary-hover)'
                                  }}>
                                    {tx.akadType}
                                  </span>
                                </td>
                                <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'right', fontWeight: 600 }}>
                                  Rp {tx.totalAmount.toLocaleString('id-ID')}
                                </td>
                              </tr>
                              {expandedTxId === tx.id && (
                                <tr>
                                  <td colSpan={4} style={{ padding: 'var(--spacing-4)', backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        <span><strong>Pelanggan WA:</strong> {tx.customerPhone || 'Umum/Tunai (Tanpa Kontak)'}</span>
                                        <span>Status Notifikasi: <span style={{ color: 'var(--color-committed-text)', fontWeight: 600 }}>✓ Sent via Fonnte</span></span>
                                      </div>
                                      <div style={{ backgroundColor: '#FFFFFF', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Daftar Pembelian Item:</div>
                                        {tx.items.map((item, idx) => (
                                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', margin: '2px 0' }}>
                                            <span>{item.productName} (x{item.qty})</span>
                                            <span style={{ fontWeight: 600 }}>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                                          </div>
                                        ))}
                                      </div>

                                      {tx.akadType === 'MURABAHAH' && (
                                        <div style={{ marginTop: 'var(--spacing-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary-hover)' }}>Tanda Tangan Akad Pelanggan:</span>
                                          {tx.signatureUrl ? (
                                            tx.signatureUrl.startsWith('data:') ? (
                                              <img 
                                                src={tx.signatureUrl} 
                                                alt="Tanda tangan Akad" 
                                                style={{
                                                  border: '1px solid var(--border-color)',
                                                  borderRadius: 'var(--radius-sm)',
                                                  backgroundColor: '#FFFFFF',
                                                  height: '50px',
                                                  width: '150px',
                                                  objectFit: 'contain'
                                                }}
                                              />
                                            ) : (
                                              <div style={{ padding: '4px 10px', fontSize: '0.7rem', display: 'inline-block', backgroundColor: 'var(--color-committed-bg)', color: 'var(--color-committed-text)', borderRadius: '4px', fontWeight: 600, width: 'fit-content' }}>
                                                ✓ Akad Tersepakati Digital
                                              </div>
                                            )
                                          ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>⚠ Tanda tangan hilang/tidak terekam</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardBody>
                </Card>

                {/* Critical Stock & Quick Restock Card */}
                <Card>
                  <CardHeader title="Stok Hampir Habis" description="Daftar suku cadang kritis di bawah 5 unit. Restok langsung di sini." />
                  <CardBody style={{ padding: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {products.filter(p => p.stockQty <= 5).length > 0 ? (
                        products.filter(p => p.stockQty <= 5).map((prod) => (
                          <div key={prod.id} style={{
                            padding: 'var(--spacing-3) var(--spacing-4)',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.825rem', display: 'block' }}>{prod.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>SKU: {prod.sku} | Sisa: <strong style={{ color: 'var(--color-danger)' }}>{prod.stockQty} Unit</strong></span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
                              <input 
                                type="number" 
                                placeholder="Qty"
                                value={restockInputs[prod.id] || ''}
                                onChange={(e) => setRestockInputs({ ...restockInputs, [prod.id]: e.target.value })}
                                style={{
                                  width: '45px',
                                  padding: '4px 6px',
                                  fontSize: '0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-color)',
                                  outline: 'none'
                                }}
                              />
                              <Button 
                                size="sm" 
                                style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                                onClick={() => handleQuickRestock(prod.id)}
                              >
                                Restok
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--color-committed-text)', backgroundColor: 'var(--color-committed-bg)', fontSize: '0.8rem', fontWeight: 600 }}>
                          ✓ Seluruh stok barang dalam batas aman.
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>

            </div>
          )}

          {/* ACTIVE TAB: POS KASIR */}
          {activeTab === 'pos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--spacing-6)' }}>
              
              {/* Left Column: Product Search & Auto-complete list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <Card>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Pencarian Suku Cadang Gudang
                      </label>
                      <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                        <Input 
                          placeholder="Masukkan Kode SKU atau Nama Suku Cadang (contoh: SC-BAN-001)..." 
                          style={{ flex: 1 }}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <Button 
                            variant="outline" 
                            onClick={() => setSearchQuery('')}
                            type="button"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader 
                    title="Hasil Pencarian Gudang" 
                    description="Ketik kode barang atau nama barang di atas. Data disinkronkan secara real-time dari Inventory." 
                  />
                  <CardBody style={{ minHeight: '220px', padding: 0 }}>
                    {filteredProducts.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                              <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>SKU</th>
                              <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>Nama Item</th>
                              <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'right' }}>Harga</th>
                              <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'center' }}>Stok</th>
                              <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'center' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map((prod) => (
                              <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontFamily: 'monospace', fontWeight: 600 }}>
                                  {prod.sku}
                                </td>
                                <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 500 }}>
                                  {prod.name}
                                </td>
                                <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                                  Rp {prod.sellPrice.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'center' }}>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: prod.stockQty <= 5 ? 'var(--color-void-bg)' : 'var(--color-committed-bg)',
                                    color: prod.stockQty <= 5 ? 'var(--color-void-text)' : 'var(--color-committed-text)',
                                    fontWeight: 600
                                  }}>
                                    {prod.stockQty} Unit
                                  </span>
                                </td>
                                <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'center' }}>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleAddToCart(prod)}
                                    disabled={prod.stockQty < 1}
                                  >
                                    + Pilih
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        {searchQuery.trim() !== '' 
                          ? 'Tidak ada produk yang cocok dengan kata kunci tersebut di database Inventory.' 
                          : 'Silakan ketikkan kode SKU atau nama barang pada kotak pencarian di atas.'
                        }
                        <div style={{ marginTop: 'var(--spacing-4)', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: 'var(--spacing-3)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', display: 'inline-block', backgroundColor: '#FFF' }}>
                          <strong>💡 Tips Pencarian Kode SKU:</strong><br />
                          {products.map(p => p.sku).join(', ')}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* Right Column: Checkout Cart & Akad Type Selection */}
              <div>
                <Card>
                  <CardHeader title="Form Keranjang Kasir" description="Kelola kuantitas dan lakukan tanda tangan akad" />
                  <form onSubmit={handleCheckout}>
                    
                    <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', minHeight: '300px' }}>
                      
                      {/* Cart Items List */}
                      {cart.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                          {cart.map((item, index) => (
                            <div key={item.product.id} style={{
                              padding: 'var(--spacing-3)',
                              borderRadius: 'var(--radius-md)',
                              border: `1px solid ${item.error ? 'var(--color-danger)' : 'var(--border-color)'}`,
                              backgroundColor: item.error ? 'var(--color-void-bg)' : '#FFFFFF'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.product.name}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                                    SKU: {item.product.sku} | Rp {item.product.sellPrice.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveItem(index)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-danger)',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    padding: '0 var(--spacing-1)'
                                  }}
                                >
                                  ×
                                </button>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                  <button 
                                    type="button" 
                                    onClick={() => handleUpdateQty(index, item.qty - 1)}
                                    style={{
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '4px',
                                      width: '24px',
                                      height: '24px',
                                      cursor: 'pointer',
                                      backgroundColor: '#FFFFFF'
                                    }}
                                  >
                                    -
                                  </button>
                                  <span style={{ fontSize: '0.875rem', fontWeight: 600, width: '20px', textAlign: 'center' }}>
                                    {item.qty}
                                  </span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleUpdateQty(index, item.qty + 1)}
                                    style={{
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '4px',
                                      width: '24px',
                                      height: '24px',
                                      cursor: 'pointer',
                                      backgroundColor: '#FFFFFF'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                                  Rp {(item.product.sellPrice * item.qty).toLocaleString('id-ID')}
                                </span>
                              </div>
                              
                              {item.error && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, display: 'block', marginTop: 'var(--spacing-1)' }}>
                                  ⚠ {item.error}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--spacing-8) 0' }}>
                          Keranjang masih kosong.<br />Pilih suku cadang pada pencarian di kiri.
                        </div>
                      )}

                      <hr style={{ border: 0, borderTop: '1px solid var(--border-color)' }} />

                      {/* Customer WhatsApp */}
                      <Input 
                        label="WhatsApp Pelanggan (Notifikasi WhatsApp Fonnte)" 
                        placeholder="Contoh: 08123456789" 
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required={akadType === 'MURABAHAH'}
                      />

                      {/* Sharia Akad / Metode Pembayaran Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          Metode Pembayaran / Akad Syariah
                        </label>
                        <select 
                          value={akadType}
                          onChange={(e) => setAkadType(e.target.value as any)}
                          style={{
                            padding: 'var(--spacing-2) var(--spacing-3)',
                            fontSize: '0.875rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#FFFFFF',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="TUNAI">Tunai (Cash / Al-Bai' Bithaman Ajil)</option>
                          <option value="TRANSFER">Transfer Bank (Bank Syariah)</option>
                          <option value="QRIS">QRIS (E-Wallet Clearing)</option>
                          <option value="MURABAHAH">Murabahah (Cicil/Kredit dengan Margin)</option>
                        </select>
                      </div>

                      {/* Conditional Field: Bank Transfer Reference */}
                      {akadType === 'TRANSFER' && (
                        <Input 
                          label="Nomor Referensi Bank / Nama Pengirim" 
                          placeholder="Contoh: BSI-123456 / A.N. Siddeeq" 
                          value={transferReference}
                          onChange={(e) => setTransferReference(e.target.value)}
                          required={akadType === 'TRANSFER'}
                        />
                      )}

                      {/* Digital Signature Canvas (Conditional for Murabahah) */}
                      {akadType === 'MURABAHAH' && (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 'var(--spacing-1)',
                          padding: 'var(--spacing-3)',
                          border: '1px solid var(--color-secondary)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(234, 168, 18, 0.02)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-secondary-hover)' }}>
                              Tanda Tangan Digital Akad Pembeli ✍
                            </span>
                            <button 
                              type="button" 
                              onClick={clearSignature}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                          <canvas
                            ref={canvasRef}
                            width={280}
                            height={100}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            style={{
                              border: '1px solid var(--border-color)',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '4px',
                              cursor: 'crosshair',
                              marginTop: 'var(--spacing-1)'
                            }}
                          />
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                            Goreskan mouse/touchpad pada area di atas sebagai bukti akad serah-terima jual beli sepeda.
                          </span>
                        </div>
                      )}

                    </CardBody>

                    <CardFooter style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontWeight: 700, fontSize: '1rem' }}>
                        <span>Total Bayar</span>
                        <span style={{ color: 'var(--color-primary)' }}>Rp {totalAmount.toLocaleString('id-ID')}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--spacing-2)', width: '100%' }}>
                        <Button 
                          variant="outline" 
                          fullWidth 
                          type="button"
                          disabled={isSubmitting || cart.length === 0}
                          onClick={() => {
                            setCart([]);
                            setCustomerPhone('');
                            setAkadType('TUNAI');
                          }}
                        >
                          Batal
                        </Button>
                        <Button 
                          fullWidth 
                          type="submit"
                          disabled={isSubmitting || cart.length === 0}
                        >
                          {isSubmitting ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', justifyContent: 'center' }}>
                              <span className="spinner" style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderTopColor: '#FFFFFF',
                                borderRadius: '50%',
                                animation: 'spin 0.6s linear infinite'
                              }}></span>
                              Memproses...
                            </div>
                          ) : `Bayar (${akadType})`}
                        </Button>
                      </div>
                    </CardFooter>
                  </form>
                </Card>
              </div>

            </div>
          )}
        </div>

        {/* QRIS POP-UP DIALOG MODAL */}
        {showQrisModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              maxWidth: '380px',
              width: '90%',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-6)',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              borderTop: '5px solid var(--color-primary)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                Pindai Pembayaran QRIS
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
                Siddeeq Cycle Works - Merchant ID: SCW-88719
              </p>

              {/* Simulated QR Code SVG */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-4)',
                padding: 'var(--spacing-4)',
                backgroundColor: '#F8F9FA',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <svg width="180" height="180" viewBox="0 0 100 100" style={{ shapeRendering: 'crispEdges' }}>
                  <rect width="100" height="100" fill="#FFFFFF"/>
                  {/* Position Finders */}
                  <rect x="5" y="5" width="22" height="22" fill="var(--color-primary)"/>
                  <rect x="8" y="8" width="16" height="16" fill="#FFFFFF"/>
                  <rect x="11" y="11" width="10" height="10" fill="var(--color-primary)"/>

                  <rect x="73" y="5" width="22" height="22" fill="var(--color-primary)"/>
                  <rect x="76" y="8" width="16" height="16" fill="#FFFFFF"/>
                  <rect x="79" y="11" width="10" height="10" fill="var(--color-primary)"/>

                  <rect x="5" y="73" width="22" height="22" fill="var(--color-primary)"/>
                  <rect x="8" y="76" width="16" height="16" fill="#FFFFFF"/>
                  <rect x="11" y="79" width="10" height="10" fill="var(--color-primary)"/>

                  {/* Random pixels */}
                  <rect x="30" y="10" width="8" height="20" fill="var(--color-primary)"/>
                  <rect x="45" y="5" width="15" height="4" fill="var(--color-primary)"/>
                  <rect x="55" y="15" width="10" height="10" fill="var(--color-primary)"/>
                  <rect x="35" y="30" width="30" height="6" fill="var(--color-primary)"/>
                  <rect x="10" y="35" width="15" height="15" fill="var(--color-primary)"/>
                  <rect x="15" y="40" width="5" height="5" fill="#FFFFFF"/>
                  <rect x="30" y="45" width="35" height="5" fill="var(--color-primary)"/>
                  <rect x="35" y="55" width="15" height="10" fill="var(--color-primary)"/>
                  <rect x="55" y="50" width="15" height="20" fill="var(--color-primary)"/>
                  <rect x="75" y="35" width="20" height="15" fill="var(--color-primary)"/>
                  <rect x="80" y="55" width="12" height="12" fill="var(--color-primary)"/>
                  <rect x="30" y="75" width="12" height="20" fill="var(--color-primary)"/>
                  <rect x="45" y="80" width="20" height="15" fill="var(--color-primary)"/>
                  <rect x="75" y="75" width="20" height="20" fill="var(--color-primary)"/>
                </svg>
              </div>

              <div style={{
                backgroundColor: 'rgba(234, 168, 18, 0.1)',
                color: 'var(--color-secondary-hover)',
                padding: 'var(--spacing-2) var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: 'var(--spacing-3)',
                border: '1px solid rgba(234, 168, 18, 0.2)',
                display: 'inline-block'
              }}>
                Nominal: Rp {totalAmount.toLocaleString('id-ID')}
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-5)', lineHeight: '1.4' }}>
                <strong>⚠️ Peringatan:</strong> Pastikan kasir telah melakukan pemeriksaan dana masuk pada sistem e-wallet clearing sebelum menekan tombol verifikasi.
              </p>

              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <button
                  type="button"
                  onClick={() => setShowQrisModal(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => submitCheckout()}
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: 'var(--color-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSubmitting ? (
                    <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255, 255, 255, 0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></span>
                  ) : '✓ Verifikasi Dana Masuk'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local spinner animation keyframes */}
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </div>
  );
}
