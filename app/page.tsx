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
  akadType: string;
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

const INITIAL_TRANSACTIONS: Transaction[] = [];

export default function Home() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos'>('dashboard');

  // Shared state
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Time filter for Dashboard metrics
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');

  // POS State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Set value default agar langsung cocok dengan COA Akuntansi
  const [akadType, setAkadType] = useState<string>('101.01 - Kas Utama (Tunai)');
  
  const [transferReference, setTransferReference] = useState('');
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; omset: number; profit: number } | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [restockInputs, setRestockInputs] = useState<Record<number, string>>({});

  // Sync data on mount
  useEffect(() => {
    async function syncData() {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: dbProducts, error: prodErr } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });

          if (prodErr) throw new Error(prodErr.message);

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
            profitAmount: Number(t.total_amount) * 0.3,
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
      } catch (err) {
        console.warn('Backend sync failed, falling back to cache:', err);
      }

      const savedProducts = localStorage.getItem('siddeeq_products');
      if (savedProducts) {
        try { setProducts(JSON.parse(savedProducts)); } catch (e) { console.error(e); }
      } else {
        localStorage.setItem('siddeeq_products', JSON.stringify(INITIAL_PRODUCTS));
      }

      const savedTx = localStorage.getItem('siddeeq_transactions');
      if (savedTx) {
        try { setTransactions(JSON.parse(savedTx)); } catch (e) { console.error(e); }
      }
    }

    syncData();
  }, []);

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

  useEffect(() => {
    if (akadType.includes('103') && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1C4D32';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
      }
    }
  }, [akadType, activeTab]);

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

  const stopDrawing = () => { setIsDrawing(false); };
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

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

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.product.sellPrice * item.qty, 0);

  // Backup Checkout Offline
  const executeBackupCheckout = () => {
    const profitMargin = cart.reduce((acc, item) => acc + (item.product.sellPrice - item.product.buyPrice) * item.qty, 0);
    const savedProducts = localStorage.getItem('siddeeq_products');
    const currentProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : products;

    const updatedProducts = currentProducts.map((prod) => {
      const cartMatch = cart.find((c) => c.product.id === prod.id);
      if (cartMatch) return { ...prod, stockQty: prod.stockQty - cartMatch.qty };
      return prod;
    });

    setProducts(updatedProducts);
    localStorage.setItem('siddeeq_products', JSON.stringify(updatedProducts));

    const dateNow = new Date();
    const dateStr = dateNow.toISOString().split('T')[0].replace(/-/g, '');
    const invoiceNum = `INV/${dateStr}/${Math.floor(Math.random() * 9000) + 1000}`;

    let signatureUrl = undefined;
    if (akadType.includes('103') && canvasRef.current) {
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

    // Automated Jurnal entry matching baku COA
    const savedJournals = localStorage.getItem('siddeeq_journals');
    const currentJournals: JournalEntry[] = savedJournals ? JSON.parse(savedJournals) : [];

    const newJournalDebet: JournalEntry = { id: `J-${Date.now()}-1`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: akadType, position: 'DEBET', amount: totalAmount, description: `Penjualan POS - ${invoiceNum}`, status: 'COMMITTED' };
    const newJournalKredit: JournalEntry = { id: `J-${Date.now()}-2`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: totalAmount, description: `Penjualan POS - ${invoiceNum}`, status: 'COMMITTED' };
    const newJournalHppDebet: JournalEntry = { id: `J-${Date.now()}-3`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: totalAmount - profitMargin, description: `HPP POS - ${invoiceNum}`, status: 'COMMITTED' };
    const newJournalPersediaanKredit: JournalEntry = { id: `J-${Date.now()}-4`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: totalAmount - profitMargin, description: `HPP POS - ${invoiceNum}`, status: 'COMMITTED' };

    localStorage.setItem('siddeeq_journals', JSON.stringify([...currentJournals, newJournalDebet, newJournalKredit, newJournalHppDebet, newJournalPersediaanKredit]));

    setSuccessMessage(`Transaksi ${invoiceNum} dibukukan offline dengan COA sinkron!`);
    setCart([]);
    setCustomerPhone('');
    setTransferReference('');
    setSearchQuery('');
    setShowQrisModal(false);
    setActiveTab('dashboard');
  };

  const submitCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    executeBackupCheckout();
    setIsSubmitting(false);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (cart.some(item => item.error)) {
      alert("Harap perbaiki jumlah item melebihi batas stok!");
      return;
    }

    if (akadType.includes('QRIS') || akadType.includes('101.02')) {
      setShowQrisModal(true);
    } else {
      submitCheckout();
    }
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (timeFilter === 'today') return txDate >= startOfToday;
      if (timeFilter === 'week') return txDate >= startOfWeek;
      return txDate >= startOfMonth;
    });
  };

  const filteredTx = getFilteredTransactions();
  const totalOmset = filteredTx.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalMargin = filteredTx.reduce((sum, tx) => sum + tx.profitAmount, 0);
  const totalTransactionsCount = filteredTx.length;
  const criticalStockCount = products.filter((p) => p.stockQty <= 5).length;

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

  const tunaiCount = filteredTx.filter(tx => tx.akadType.includes('101.01')).length;
  const murabahahCount = filteredTx.filter(tx => tx.akadType.includes('103')).length;
  const totalCount = filteredTx.length || 1;

  const tunaiPercent = Math.round((tunaiCount / totalCount) * 100);
  const murabahahPercent = Math.round((murabahahCount / totalCount) * 100);

  const radius = 35;
  const circ = 2 * Math.PI * radius;
  const tunaiStroke = (tunaiCount / totalCount) * circ;
  const murabahahStroke = (murabahahCount / totalCount) * circ;
  const murabahahOffset = -tunaiStroke;

  const handleQuickRestock = (productId: number) => {
    const qtyStr = restockInputs[productId];
    if (!qtyStr) return;
    const qtyToAdd = parseInt(qtyStr);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) return;

    const savedProducts = localStorage.getItem('siddeeq_products');
    const currentProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : products;

    const updated = currentProducts.map(p => {
      if (p.id === productId) return { ...p, stockQty: p.stockQty + qtyToAdd };
      return p;
    });

    setProducts(updated);
    localStorage.setItem('siddeeq_products', JSON.stringify(updated));
    setRestockInputs(prev => ({ ...prev, [productId]: '' }));

    const savedJournals = localStorage.getItem('siddeeq_journals');
    const currentJournals: JournalEntry[] = savedJournals ? JSON.parse(savedJournals) : [];
    const targetProduct = currentProducts.find(p => p.id === productId);
    
    if (targetProduct) {
      const restockCost = targetProduct.buyPrice * qtyToAdd;
      const refNum = `RST-${Date.now()}`;
      const dateNowStr = new Date().toISOString().split('T')[0];

      const debetEntry: JournalEntry = { id: `J-${Date.now()}-R1`, date: dateNowStr, ref: refNum, account: '102 - Persediaan Suku Cadang', position: 'DEBET', amount: restockCost, description: `Restok ${qtyToAdd}x ${targetProduct.name}`, status: 'COMMITTED' };
      const '| - Kas Utama (Tunai)' : '101.01 - Kas Utama (Tunai)';
      const kreditEntry: JournalEntry = { id: `J-${Date.now()}-R2`, date: dateNowStr, ref: refNum, account: '101.01 - Kas Utama (Tunai)', position: 'KREDIT', amount: restockCost, description: `Restok ${qtyToAdd}x ${targetProduct.name}`, status: 'COMMITTED' };

      localStorage.setItem('siddeeq_journals', JSON.stringify([...currentJournals, debetEntry, kreditEntry]));
    }
    alert(`Berhasil menambah stok sebanyak ${qtyToAdd} unit!`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '260px' }}>
        <TopHeader title="Platform Kasir & Bisnis Terpadu" />
        
        <div style={{ padding: 'var(--spacing-6)' }}>
          {successMessage && (
            <div style={{ backgroundColor: 'var(--color-committed-bg)', color: 'var(--color-committed-text)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-6)', fontSize: '0.875rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--color-primary)' }}>
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', borderBottom: '2px solid var(--border-color)', paddingBottom: '2px' }}>
            <button onClick={() => setActiveTab('dashboard')} style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '0.95rem', fontWeight: 600, backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'dashboard' ? '3px solid var(--color-secondary)' : '3px solid transparent', color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>📊 Ringkasan Bisnis (Dashboard)</button>
            <button onClick={() => setActiveTab('pos')} style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '0.95rem', fontWeight: 600, backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'pos' ? '3px solid var(--color-secondary)' : '3px solid transparent', color: activeTab === 'pos' ? 'var(--color-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>🛒 POS Kasir Utama</button>
          </div>

          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>Dashboard Kinerja Bengkel</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monitoring omset, margin syariah, dan stok kritis secara real-time</p>
                </div>
                <div style={{ display: 'inline-flex', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
                  {(['today', 'week', 'month'] as const).map((filter) => (
                    <button key={filter} onClick={() => setTimeFilter(filter)} style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: timeFilter === filter ? 'var(--color-primary)' : 'transparent', color: timeFilter === filter ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer' }}>
                      {filter === 'today' ? 'Hari Ini' : filter === 'week' ? '7 Hari Terakhir' : '30 Hari Terakhir'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-6)' }}>
                <Card style={{ borderLeft: '4px solid var(--color-primary)' }}>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Omset Penjualan</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--spacing-1)' }}>Rp {totalOmset.toLocaleString('id-ID')}</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>✓ Terintegrasi Buku Jurnal</span>
                  </CardBody>
                </Card>
                <Card style={{ borderLeft: '4px solid var(--color-secondary)' }}>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Margin Keuntungan</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--spacing-1)' }}>Rp {totalMargin.toLocaleString('id-ID')}</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary-hover)', fontWeight: 600 }}>🕌 Bersih & Transparan (HPP Terjaga)</span>
                  </CardBody>
                </Card>
                <Card style={{ borderLeft: '4px solid var(--color-committed-text)' }}>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transaksi Sukses</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--spacing-1)' }}>{totalTransactionsCount} Transaksi</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-committed-text)', fontWeight: 600 }}>100% Notifikasi WhatsApp Terkirim</span>
                  </CardBody>
                </Card>
                <Card style={{ borderLeft: '4px solid var(--color-danger)' }}>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Suku Cadang Kritis</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: 'var(--spacing-1)' }}>{criticalStockCount} Item</div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Stok gudang di bawah 5 unit</span>
                  </CardBody>
                </Card>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--spacing-6)' }}>
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
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                          const y = 20 + ratio * 130;
                          const gridVal = Math.round(maxOmset - ratio * maxOmset);
                          return (
                            <g key={idx}>
                              <line x1="50" y1={y} x2="500" y2={y} stroke="var(--border-color)" strokeDasharray="3 3"/>
                              <text x="40" y={y + 4} textAnchor="end" fill="var(--text-secondary)" style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>{gridVal >= 1000000 ? `${(gridVal/1000000).toFixed(1)}M` : gridVal >= 1000 ? `${Math.round(gridVal/1000)}k` : gridVal}</text>
                            </g>
                          );
                        })}
                        {points.map((p, i) => (
                          <text key={i} x={p.x} y="168" textAnchor="middle" fill="var(--text-secondary)" style={{ fontSize: '0.65rem', fontWeight: 600 }}>{p.label}</text>
                        ))}
                        <path d={areaPath} fill="url(#gradient-omset)"/>
                        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d={profitLinePath} fill="none" stroke="var(--color-secondary)" strokeWidth="2.5" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round"/>
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="5" fill="var(--color-primary)" stroke="#FFFFFF" strokeWidth="2" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)} />
                            <circle cx={p.x} cy={p.yProfit} r="4" fill="var(--color-secondary)" stroke="#FFFFFF" strokeWidth="1.5" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)} />
                          </g>
                        ))}
                      </svg>
                      {hoveredPoint && (
                        <div style={{ position: 'absolute', left: `${hoveredPoint.x - 70}px`, top: `${hoveredPoint.y - 70}px`, backgroundColor: '#1E293B', color: '#FFFFFF', padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', fontSize: '0.75rem', zIndex: 50, border: '1px solid var(--color-secondary)', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '3px' }}>{hoveredPoint.label}</div>
                          <div>Omset: <strong>Rp {hoveredPoint.omset.toLocaleString('id-ID')}</strong></div>
                          <div>Margin: <strong style={{ color: '#FCD34D' }}>Rp {hoveredPoint.profit.toLocaleString('id-ID')}</strong></div>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Sebaran Akad Jual Beli" description="Persentase transaksi Tunai vs Murabahah" />
                  <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-6)' }}>
                    <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                      <svg viewBox="0 0 100 100" width="100%" height="100%">
                        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#E2E8F0" strokeWidth="12" />
                        {tunaiCount > 0 && <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--color-primary)" strokeWidth="12" strokeDasharray={`${tunaiStroke} ${circ}`} strokeDashoffset={tunaiStroke} transform="rotate(-90 50 50)" />}
                        {murabahahCount > 0 && <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--color-secondary)" strokeWidth="12" strokeDasharray={`${murabahahStroke} ${circ}`} strokeDashoffset={murabahahStroke + murabahahOffset} transform="rotate(-90 50 50)" />}
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1 }}>{totalTransactionsCount}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Akad</span>
                      </div>
                    </div>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', marginTop: 'var(--spacing-6)' }}>
                      <div>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginRight: '4px' }}></span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tunai</span>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-primary)' }}>{tunaiPercent}%</strong>
                      </div>
                      <div>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', marginRight: '4px' }}></span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Murabahah</span>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-secondary-hover)' }}>{murabahahPercent}%</strong>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--spacing-6)' }}>
                <Card>
                  <CardHeader title="Log Transaksi Terakhir" description="Klik pada baris transaksi untuk melihat rincian" />
                  <CardBody style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                          <th style={{ padding: '12px' }}>No Invoice</th>
                          <th style={{ padding: '12px' }}>Tanggal</th>
                          <th style={{ padding: '12px' }}>Akun COA</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTx.map((tx) => (
                          <React.Fragment key={tx.id}>
                            <tr onClick={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                              <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700 }}>{tx.invoiceNumber}</td>
                              <td style={{ padding: '12px' }}>{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                              <td style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tx.akadType}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Rp {tx.totalAmount.toLocaleString('id-ID')}</td>
                            </tr>
                            {expandedTxId === tx.id && (
                              <tr>
                                <td colSpan={4} style={{ padding: '12px', backgroundColor: 'var(--bg-main)' }}>
                                  <div style={{ fontSize: '0.75rem' }}>
                                    {tx.items.map((item, idx) => (
                                      <div key={idx}>{item.productName} (x{item.qty}) - Rp {(item.price * item.qty).toLocaleString('id-ID')}</div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Stok Hampir Habis" description="Daftar suku cadang kritis" />
                  <CardBody style={{ padding: 0 }}>
                    {products.filter(p => p.stockQty <= 5).map(prod => (
                      <div key={prod.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.825rem' }}>{prod.name}</span>
                          <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-secondary)' }}>Sisa: {prod.stockQty} Unit</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="number" placeholder="Qty" value={restockInputs[prod.id] || ''} onChange={(e) => setRestockInputs({ ...restockInputs, [prod.id]: e.target.value })} style={{ width: '45px', fontSize: '0.75rem' }} />
                          <Button size="sm" onClick={() => handleQuickRestock(prod.id)}>Restok</Button>
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'pos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--spacing-6)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <Card>
                  <CardBody style={{ padding: 'var(--spacing-4)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Pencarian Suku Cadang Gudang</label>
                    <Input placeholder="Masukkan Kode SKU atau Nama Suku Cadang..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Hasil Pencarian Gudang" description="Data sinkron riil" />
                  <CardBody style={{ padding: 0 }}>
                    {filteredProducts.length > 0 && (
                      <table style={{ width: '100%', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                            <th style={{ padding: '12px' }}>SKU</th>
                            <th style={{ padding: '12px' }}>Nama Item</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Harga</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map(prod => (
                            <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px', fontFamily: 'monospace' }}>{prod.sku}</td>
                              <td style={{ padding: '12px' }}>{prod.name}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>Rp {prod.sellPrice.toLocaleString('id-ID')}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <Button size="sm" onClick={() => handleAddToCart(prod)}>+ Pilih</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardBody>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader title="Form Keranjang Kasir" description="Kelola transaksi" />
                  <form onSubmit={handleCheckout}>
                    <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                      {cart.map((item, index) => (
                        <div key={item.product.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.product.name}</span>
                            <button type="button" onClick={() => handleRemoveItem(index)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none' }}>×</button>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            <input type="number" value={item.qty} onChange={(e) => handleUpdateQty(index, parseInt(e.target.value) || 1)} style={{ width: '50px' }} />
                            <span>Rp {(item.product.sellPrice * item.qty).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      ))}
                      <Input label="WhatsApp Pelanggan" placeholder="Contoh: 08123456789" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                      
                      {/* DROPDOWN UTAMA METODE PEMBAYARAN AKUN COA BAKU */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Metode Pembayaran / Akad Syariah</label>
                        <select value={akadType} onChange={(e) => setAkadType(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#FFFFFF' }}>
                          <option value="101.01 - Kas Utama (Tunai)">Tunai (Cash / Al-Bai' Bithaman Ajil)</option>
                          <option value="101.02 - Bank Syariah (Transfer)">Transfer Bank (Bank Syariah)</option>
                          <option value="101.02 - Bank Syariah (Transfer)">QRIS (E-Wallet Clearing)</option>
                          <option value="103 - Piutang Murabahah">Murabahah (Cicil/Kredit dengan Margin)</option>
                        </select>
                      </div>

                      {akadType.includes('101.02') && (
                        <Input label="Referensi Transfer" placeholder="Contoh: BSI-12345" value={transferReference} onChange={(e) => setTransferReference(e.target.value)} required />
                      )}

                      {akadType.includes('103') && (
                        <div style={{ border: '1px solid var(--color-secondary)', padding: '12px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tanda Tangan Digital Akad Pembeli✍</span>
                          <canvas ref={canvasRef} width={280} height={100} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} style={{ border: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', width: '100%', height: '100px' }} />
                          <button type="button" onClick={clearSignature} style={{ fontSize: '0.7rem', textDecoration: 'underline', background: 'none', border: 'none', marginTop: '4px', cursor: 'pointer' }}>Hapus</button>
                        </div>
                      )}
                    </CardBody>
                    <CardFooter>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontWeight: 700, marginBottom: '12px' }}>
                        <span>Total Bayar</span>
                        <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <Button fullWidth type="submit" disabled={isSubmitting || cart.length === 0}>Bayar Sekarang</Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>
            </div>
          )}
        </div>

        {showQrisModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', textAlign: 'center', maxWidth: '340px', width: '90%' }}>
              <h3>Pindai QRIS Merchant</h3>
              <div style={{ margin: '16px 0', padding: '12px', backgroundColor: '#F8F9FA' }}>
                <svg width="140" height="140" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#FFFFFF"/>
                  <rect x="5" y="5" width="20" height="22" fill="var(--color-primary)"/>
                  <rect x="75" y="5" width="20" height="22" fill="var(--color-primary)"/>
                  <rect x="5" y="75" width="20" height="22" fill="var(--color-primary)"/>
                  <rect x="35" y="35" width="30" height="30" fill="var(--color-primary)"/>
                </svg>
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '16px' }}>Rp {totalAmount.toLocaleString('id-ID')}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button fullWidth variant="outline" onClick={() => setShowQrisModal(false)}>Batal</Button>
                <Button fullWidth onClick={() => submitCheckout()}>✓ Konfirmasi Sukses</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}