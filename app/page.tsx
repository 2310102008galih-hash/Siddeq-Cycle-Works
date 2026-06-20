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
  date: string; 
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
  { id: 1, sku: 'SC-BAN-001', name: 'Crankset Litepro Hollowtech II', buyPrice: 350000, sellPrice: 490000, stockQty: 2 },
  { id: 2, sku: 'SC-BYC-005', name: 'Sepeda Gravel Polygon Bend R2', buyPrice: 8000000, sellPrice: 11000000, stockQty: 4 },
  { id: 3, sku: 'SC-BYC-006', name: 'Sepeda Lipat United Trifold 3S Single Speed', buyPrice: 4500000, sellPrice: 6000000, stockQty: 5 },
  { id: 4, sku: 'SC-BYC-007', name: 'Sepeda MTB Genio M-341 XC 27.5', buyPrice: 1800000, sellPrice: 2500000, stockQty: 5 },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos'>('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [akadType, setAkadType] = useState<string>('101.01 - Kas Utama (Tunai Bengkel)');
  
  const [transferReference, setTransferReference] = useState('');
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // State Tooltip untuk Interactive Line Chart
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  
  // State Accordion untuk Log Tabel Transaksi
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [restockInputs, setRestockInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    async function syncData() {
      // Load data riwayat transaksi simulasi bawaan jika cache kosong
      const savedTx = localStorage.getItem('siddeeq_transactions');
      if (savedTx) {
        try { setTransactions(JSON.parse(savedTx)); } catch (e) { console.error(e); }
      } else {
        const dummyTx: Transaction[] = [
          { id: 'TX-1', invoiceNumber: 'INV/20260620/9295', date: '2026-06-20T10:00:00.000Z', totalAmount: 175000, profitAmount: 55000, akadType: '101.02 - Bank Syariah (Rekening Utama)', items: [{ productId: 1, productName: 'Ban Luar Gravel', sku: 'SKU-1', qty: 1, price: 175000 }] },
          { id: 'TX-2', invoiceNumber: 'INV/20260620/1920', date: '2026-06-20T11:15:00.000Z', totalAmount: 350000, profitAmount: 110000, akadType: '101.01 - Kas Utama (Tunai Bengkel)', items: [{ productId: 1, productName: 'Jasa Service Excel', sku: 'SKU-2', qty: 1, price: 350000 }] },
          { id: 'TX-3', invoiceNumber: 'INV/20260620/4882', date: '2026-06-20T13:40:00.000Z', totalAmount: 2100000, profitAmount: 630000, akadType: '101.01 - Kas Utama (Tunai Bengkel)', items: [{ productId: 4, productName: 'Sparepart Upgrade', sku: 'SKU-4', qty: 1, price: 2100000 }] },
          { id: 'TX-4', invoiceNumber: 'INV/20260620/2051', date: '2026-06-20T15:20:00.000Z', totalAmount: 490000, profitAmount: 140000, akadType: '101.02 - Bank Syariah (Rekening Utama)', items: [{ productId: 1, productName: 'Crankset Litepro', sku: 'SC-BAN-001', qty: 1, price: 490000 }] },
          { id: 'TX-5', invoiceNumber: 'INV/20260620/8559', date: '2026-06-20T16:30:00.000Z', totalAmount: 415000, profitAmount: 125000, akadType: '101.01 - Kas Utama (Tunai Bengkel)', items: [{ productId: 1, productName: 'Suku Cadang Rem', sku: 'SKU-5', qty: 1, price: 415000 }] },
          { id: 'TX-6', invoiceNumber: 'INV/20260613/1032', date: '2026-06-13T09:00:00.000Z', totalAmount: 875000, profitAmount: 262500, akadType: '101.02 - Bank Syariah (Rekening Utama)', items: [{ productId: 1, productName: 'Ban Swallow Gravel', sku: 'SKU-1', qty: 5, price: 175000 }] },
        ];
        setTransactions(dummyTx);
        localStorage.setItem('siddeeq_transactions', JSON.stringify(dummyTx));
      }

      const savedProducts = localStorage.getItem('siddeeq_products');
      if (savedProducts) {
        try { setProducts(JSON.parse(savedProducts)); } catch (e) { console.error(e); }
      } else {
        localStorage.setItem('siddeeq_products', JSON.stringify(INITIAL_PRODUCTS));
      }
    }
    syncData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(products.filter(p => p.sku.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)));
    }
  }, [searchQuery, products]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top); setIsDrawing(true);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect(); ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
  };
  const stopDrawing = () => { setIsDrawing(false); };
  const clearSignature = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const newQty = cart[existingIndex].qty + 1;
      const updatedCart = [...cart];
      if (newQty > product.stockQty) {
        updatedCart[existingIndex].error = `Stok tidak mencukupi!`;
      } else {
        updatedCart[existingIndex].qty = newQty; updatedCart[existingIndex].error = undefined;
      }
      setCart(updatedCart);
    } else {
      if (product.stockQty < 1) { alert("Stok kosong!"); return; }
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updatedCart = [...cart];
    const item = updatedCart[index];
    if (newQty > item.product.stockQty) {
      item.error = `Sisa stok: ${item.product.stockQty}`;
    } else {
      item.qty = newQty; item.error = undefined;
    }
    setCart(updatedCart);
  };

  const handleRemoveItem = (index: number) => { setCart(cart.filter((_, i) => i !== index)); };
  const totalAmount = cart.reduce((acc, item) => acc + item.product.sellPrice * item.qty, 0);

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

    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      invoiceNumber: invoiceNum,
      date: dateNow.toISOString(),
      totalAmount,
      profitAmount: profitMargin,
      akadType,
      customerPhone: customerPhone || undefined,
      items: cart.map(item => ({ productId: item.product.id, productName: item.product.name, sku: item.product.sku, qty: item.qty, price: item.product.sellPrice }))
    };

    const savedTx = localStorage.getItem('siddeeq_transactions');
    const currentTx: Transaction[] = savedTx ? JSON.parse(savedTx) : transactions;
    const updatedTx = [newTx, ...currentTx];
    setTransactions(updatedTx);
    localStorage.setItem('siddeeq_transactions', JSON.stringify(updatedTx));

    const savedJournals = localStorage.getItem('siddeeq_journals');
    const currentJournals: JournalEntry[] = savedJournals ? JSON.parse(savedJournals) : [];

    const newJournalDebet: JournalEntry = { id: `J-${Date.now()}-1`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: akadType, position: 'DEBET', amount: totalAmount, description: `Penjualan POS - ${invoiceNum}`, status: 'COMMITTED' };
    const newJournalKredit: JournalEntry = { id: `J-${Date.now()}-2`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: totalAmount, description: `Penjualan POS - ${invoiceNum}`, status: 'COMMITTED' };
    const newJournalHppDebet: JournalEntry = { id: `J-${Date.now()}-3`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: totalAmount - profitMargin, description: `HPP POS - ${invoiceNum}`, status: 'COMMITTED' };
    const newJournalPersediaanKredit: JournalEntry = { id: `J-${Date.now()}-4`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: '102 - Persediaan Suku Cadang Gudang', position: 'KREDIT', amount: totalAmount - profitMargin, description: `HPP POS - ${invoiceNum}`, status: 'COMMITTED' };

    localStorage.setItem('siddeeq_journals', JSON.stringify([...currentJournals, newJournalDebet, newJournalKredit, newJournalHppDebet, newJournalPersediaanKredit]));

    setSuccessMessage(`Alhamdulillah! Transaksi ${invoiceNum} sukses disimpan.`);
    setCart([]); setCustomerPhone(''); setTransferReference(''); setSearchQuery(''); setShowQrisModal(false); setActiveTab('dashboard');
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
    submitCheckout();
  };

  // Logika Filter Rentang Waktu Dashboard
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

  // Logika Pemetaan Data Garis Tren 7 Hari Terakhir
  const last7DaysData = [6, 5, 4, 3, 2, 1, 0].map(i => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric' });
    const dayTxs = transactions.filter(tx => new Date(tx.date).toDateString() === d.toDateString());
    return {
      label,
      omset: dayTxs.reduce((sum, tx) => sum + tx.totalAmount, 0),
      profit: dayTxs.reduce((sum, tx) => sum + tx.profitAmount, 0)
    };
  });

  const maxOmset = Math.max(...last7DaysData.map(d => d.omset), 500000);
  
  // Koordinat Plotting SVG Graph
  const points = last7DaysData.map((d, i) => ({
    ...d,
    x: 40 + (i / 6) * 440,
    y: 150 - (d.omset / maxOmset) * 110,
    yProfit: 150 - (d.profit / maxOmset) * 110
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z` : '';
  const profitLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yProfit}`).join(' ');

  // Perbaikan Rumus Donut Chart Menggunakan String COA Riil
  const tunaiCount = filteredTx.filter(tx => tx.akadType.includes('101.01')).length;
  const murabahahCount = filteredTx.filter(tx => tx.akadType.includes('103')).length;
  
  const tunaiPercent = totalTransactionsCount > 0 ? Math.round((tunaiCount / totalTransactionsCount) * 100) : 0;
  const murabahahPercent = totalTransactionsCount > 0 ? Math.round((murabahahCount / totalTransactionsCount) * 100) : 0;

  const strokeCircumference = 2 * Math.PI * radius; // 220
  const tunaiStroke = totalTransactionsCount > 0 ? (tunaiCount / totalTransactionsCount) * strokeCircumference : 0;
  const murabahahStroke = totalTransactionsCount > 0 ? (murabahahCount / totalTransactionsCount) * strokeCircumference : 0;

  const handleQuickRestock = (productId: number) => {
    const qtyStr = restockInputs[productId]; if (!qtyStr) return;
    const qtyToAdd = parseInt(qtyStr); if (isNaN(qtyToAdd) || qtyToAdd <= 0) return;

    const savedProducts = localStorage.getItem('siddeeq_products');
    const currentProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : products;

    const updated = currentProducts.map(p => p.id === productId ? { ...p, stockQty: p.stockQty + qtyToAdd } : p);
    setProducts(updated); localStorage.setItem('siddeeq_products', JSON.stringify(updated));
    setRestockInputs(prev => ({ ...prev, [productId]: '' }));
    alert(`Stok berhasil ditambahkan.`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '260px' }}>
        <TopHeader title="Platform Kasir & Bisnis Terpadu" />
        <div style={{ padding: 'var(--spacing-6)' }}>
          
          {successMessage && (
            <div style={{ backgroundColor: 'var(--color-committed-bg)', color: 'var(--color-committed-text)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
            </div>
          )}

          {/* Tab Menu Navigation */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)' }}>
            <button onClick={() => setActiveTab('dashboard')} style={{ padding: '12px', fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab === 'dashboard' ? '3px solid var(--color-secondary)' : '3px solid transparent', color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>📊 Ringkasan Bisnis (Dashboard)</button>
            <button onClick={() => setActiveTab('pos')} style={{ padding: '12px', fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab === 'pos' ? '3px solid var(--color-secondary)' : '3px solid transparent', color: activeTab === 'pos' ? 'var(--color-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>🛒 POS Kasir Utama</button>
          </div>

          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Dashboard Control Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>Dashboard Kinerja Bengkel</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monitoring omset, margin syariah, dan stok kritis secara real-time</p>
                </div>
                <div style={{ display: 'inline-flex', backgroundColor: '#FFFFFF', padding: '2px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  {(['today', 'week', 'month'] as const).map(filter => (
                    <button key={filter} onClick={() => setTimeFilter(filter)} style={{ padding: '6px 14px', fontSize: '0.8rem', border: 'none', borderRadius: '4px', backgroundColor: timeFilter === filter ? 'var(--color-primary)' : 'transparent', color: timeFilter === filter ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                      {filter === 'today' ? 'Hari Ini' : filter === 'week' ? '7 Hari' : '30 Hari'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Summary Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <Card style={{ borderLeft: '4px solid var(--color-primary)' }}><CardBody style={{ padding: '16px' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Omset</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rp {totalOmset.toLocaleString('id-ID')}</div></CardBody></Card>
                <Card style={{ borderLeft: '4px solid var(--color-secondary)' }}><CardBody style={{ padding: '16px' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Margin</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rp {totalMargin.toLocaleString('id-ID')}</div></CardBody></Card>
                <Card style={{ borderLeft: '4px solid var(--color-committed-text)' }}><CardBody style={{ padding: '16px' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sukses</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalTransactionsCount} Trx</div></CardBody></Card>
                <Card style={{ borderLeft: '4px solid var(--color-danger)' }}><CardBody style={{ padding: '16px' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kritis</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)' }}>{criticalStockCount} Item</div></CardBody></Card>
              </div>

              {/* Charts Segment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
                
                {/* INTERACTIVE LINE CHART WITH TOOLTIP HOVER */}
                <Card style={{ position: 'relative' }}>
                  <CardBody style={{ padding: '16px' }}>
                    <svg viewBox="0 0 520 180" width="100%" height="180" style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="gradient-omset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15"/>
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = 40 + ratio * 110;
                        const gridVal = Math.round(maxOmset - ratio * maxOmset);
                        return (
                          <g key={idx}>
                            <line x1="40" y1={y} x2="500" y2={y} stroke="var(--border-color)" strokeDasharray="3 3"/>
                            <text x="32" y={y + 4} textAnchor="end" fill="var(--text-secondary)" style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                              {gridVal >= 1000000 ? `${(gridVal/1000000).toFixed(1)}M` : `${Math.round(gridVal/1000)}k`}
                            </text>
                          </g>
                        );
                      })}
                      {points.map((p, i) => (
                        <text key={i} x={p.x} y="165" textAnchor="middle" fill="var(--text-secondary)" style={{ fontSize: '0.65rem', fontWeight: 600 }}>{p.label}</text>
                      ))}
                      <path d={areaPath} fill="url(#gradient-omset)"/>
                      <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round"/>
                      <path d={profitLinePath} fill="none" stroke="var(--color-secondary)" strokeWidth="2" strokeDasharray="4 2"/>
                      
                      {/* Titk Pemicu Mouse Hover */}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="5" fill="var(--color-primary)" stroke="#FFFFFF" strokeWidth="2" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}/>
                          <circle cx={p.x} cy={p.yProfit} r="4" fill="var(--color-secondary)" stroke="#FFFFFF" strokeWidth="1.5"/>
                        </g>
                      ))}
                    </svg>
                    
                    {/* Live Float Tooltip */}
                    {hoveredPoint && (
                      <div style={{ position: 'absolute', backgroundColor: '#1E293B', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', left: `${hoveredPoint.x - 30}px`, top: `${hoveredPoint.y - 50}px`, boxShadow: 'var(--shadow-lg)', zIndex: 99, border: '1px solid var(--color-secondary)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>Tanggal {hoveredPoint.label}</div>
                        <div>Omset: <strong>Rp {hoveredPoint.omset.toLocaleString('id-ID')}</strong></div>
                        <div>Profit: <strong style={{ color: '#FCD34D' }}>Rp {hoveredPoint.profit.toLocaleString('id-ID')}</strong></div>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* DYNAMIC DONUT CHART SEBARAN AKAD */}
                <Card>
                  <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ position: 'relative', width: '110px', height: '120px' }}>
                      <svg viewBox="0 0 100 100" width="100%">
                        <circle cx="50" cy="50" r="35" fill="transparent" stroke="#E2E8F0" strokeWidth="10" />
                        {tunaiCount > 0 && <circle cx="50" cy="50" r="35" fill="transparent" stroke="var(--color-primary)" strokeWidth="10" strokeDasharray={`${tunaiStroke} 220`} strokeDashoffset="220" transform="rotate(-90 50 50)" />}
                        {murabahahCount > 0 && <circle cx="50" cy="50" r="35" fill="transparent" stroke="var(--color-secondary)" strokeWidth="10" strokeDasharray={`${murabahahStroke} 220`} strokeDashoffset={220 - tunaiStroke} transform="rotate(-90 50 50)" />}
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{totalTransactionsCount}</span>
                        <span style={{ fontSize: '0.55rem', display: 'block', color: 'var(--text-secondary)' }}>AKAD</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.75rem', width: '100%', justifyContent: 'space-around' }}>
                      <div><span style={{ color: 'var(--color-primary)' }}>●</span> Tunai: <strong>{tunaiPercent}%</strong></div>
                      <div><span style={{ color: 'var(--color-secondary)' }}>●</span> Murabahah: <strong>{murabahahPercent}%</strong></div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Data Table Log & Critical Stock Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
                
                {/* TABLE INTERACTIVE ACCORDION ROW */}
                <Card>
                  <CardBody style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '12px' }}>No Invoice</th>
                          <th>Tanggal</th>
                          <th>Metode COA</th>
                          <th style={{ textAlign: 'right', paddingRight: '12px' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTx.map(tx => (
                          <React.Fragment key={tx.id}>
                            <tr 
                              onClick={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)} 
                              style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: expandedTxId === tx.id ? 'rgba(28, 77, 50, 0.02)' : 'transparent' }}
                            >
                              <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{tx.invoiceNumber}</td>
                              <td>{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                              <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tx.akadType.split(' - ')[1] || tx.akadType}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, paddingRight: '12px' }}>Rp {tx.totalAmount.toLocaleString('id-ID')}</td>
                            </tr>
                            {expandedTxId === tx.id && (
                              <tr style={{ backgroundColor: '#F8F9FA' }}>
                                <td colSpan={4} style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)' }}>
                                  <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '12px', fontSize: '0.75rem' }}>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>Rincian Item Keranjang Pembelian:</strong>
                                    {tx.items.map((item, idx) => (
                                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                                        <span>• {item.productName} (x{item.qty})</span>
                                        <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                                      </div>
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

                {/* CRITICAL STOCK Restok Card */}
                <Card>
                  <CardBody style={{ padding: '8px' }}>
                    {products.filter(p => p.stockQty <= 5).map(prod => (
                      <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 8px', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 600, display: 'block' }}>{prod.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sisa Stok: <strong style={{ color: 'var(--color-danger)' }}>{prod.stockQty} Unit</strong></span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="number" placeholder="Qty" value={restockInputs[prod.id] || ''} onChange={(e) => setRestockInputs({ ...restockInputs, [prod.id]: e.target.value })} style={{ width: '45px', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', outline: 'none' }} />
                          <Button size="sm" onClick={() => handleQuickRestock(prod.id)}>Restok</Button>
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>

              </div>
            </div>
          )}

          {/* POS Tab view */}
          {activeTab === 'pos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Card><CardBody style={{ padding: '16px' }}><label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Cari Suku Cadang Gudang</label><Input placeholder="Ketik SKU / Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></CardBody></Card>
                <Card>
                  <CardBody style={{ padding: 0 }}>
                    {filteredProducts.length > 0 && (
                      <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ backgroundColor: 'var(--bg-main)' }}><th style={{ padding: '10px' }}>SKU</th><th>Nama</th><th>Harga</th><th style={{ textAlign: 'center' }}>Pilih</th></tr></thead>
                        <tbody>
                          {filteredProducts.map(prod => (
                            <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '10px', fontFamily: 'monospace' }}>{prod.sku}</td>
                              <td>{prod.name}</td>
                              <td>Rp {prod.sellPrice.toLocaleString('id-ID')}</td>
                              <td style={{ textAlign: 'center' }}><Button size="sm" onClick={() => handleAddToCart(prod)}>+ Pilih</Button></td>
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
                  <CardHeader title="Form Keranjang Kasir" />
                  <form onSubmit={handleCheckout}>
                    <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
                      {cart.map((item, index) => (
                        <div key={item.product.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span>{item.product.name}</span><button type="button" onClick={() => handleRemoveItem(index)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}><input type="number" value={item.qty} onChange={(e) => handleUpdateQty(index, parseInt(e.target.value) || 1)} style={{ width: '45px' }} /><span style={{ fontWeight: 600 }}>Rp {(item.product.sellPrice * item.qty).toLocaleString('id-ID')}</span></div>
                        </div>
                      ))}
                      <Input label="WhatsApp Pelanggan" placeholder="08123..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Metode Pembayaran / Akad Syariah</label>
                        <select value={akadType} onChange={(e) => setAkadType(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none' }}>
                          <option value="101.01 - Kas Utama (Tunai Bengkel)">Tunai (Cash / Al-Bai' Bithaman Ajil)</option>
                          <option value="101.02 - Bank Syariah (Rekening Utama)">Transfer Bank (Bank Syariah)</option>
                          <option value="101.02 - Bank Syariah (Rekening Utama)">QRIS (E-Wallet Clearing)</option>
                          <option value="103 - Piutang Pembayaran Murabahah">Murabahah (Cicil/Kredit dengan Margin)</option>
                        </select>
                      </div>

                      {akadType.includes('101.02') && <Input label="Referensi Transfer" placeholder="Referensi..." value={transferReference} onChange={(e) => setTransferReference(e.target.value)} required />}
                      
                      {akadType.includes('103') && (
                        <div style={{ border: '1px solid var(--color-secondary)', padding: '8px', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tanda Tangan Digital Akad Pembeli ✍</span>
                          <canvas ref={canvasRef} width={280} height={100} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} style={{ border: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', width: '100%', height: '100px', cursor: 'crosshair' }} />
                          <button type="button" onClick={clearSignature} style={{ fontSize: '0.7rem', textDecoration: 'underline', background: 'none', border: 'none', marginTop: '4px', cursor: 'pointer' }}>Hapus</button>
                        </div>
                      )}
                    </CardBody>
                    <CardFooter style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontWeight: 700, marginBottom: '12px' }}><span>Total Bayar</span><span>Rp {totalAmount.toLocaleString('id-ID')}</span></div>
                      <Button fullWidth type="submit" disabled={isSubmitting || cart.length === 0}>Bayar Sekarang</Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}