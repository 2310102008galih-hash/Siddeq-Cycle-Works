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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos'>('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  
  // SINKRONISASI COA: Default Kas Utama Baku
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

  useEffect(() => {
    async function syncData() {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: dbProducts, error: prodErr } = await supabase.from('products').select('*').order('id', { ascending: true });
          if (prodErr) throw new Error(prodErr.message);

          const { data: dbTransactions, error: txErr } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
          if (txErr) throw new Error(txErr.message);

          const mappedProducts = dbProducts.map((p: any) => ({ id: p.id, sku: p.sku, name: p.name, buyPrice: Number(p.purchase_price), sellPrice: Number(p.sale_price), stockQty: p.stock_qty }));
          const mappedTransactions = dbTransactions.map((t: any) => ({ id: `TX-${t.id}`, invoiceNumber: t.invoice_number, date: t.transaction_date, totalAmount: Number(t.total_amount), profitAmount: Number(t.total_amount) * 0.3, akadType: t.payment_method, customerPhone: t.customer_phone || undefined, signatureUrl: t.digital_signature || undefined, transferReference: t.transfer_reference || undefined, items: t.items || [] }));

          setProducts(mappedProducts);
          setTransactions(mappedTransactions);
          localStorage.setItem('siddeeq_products', JSON.stringify(mappedProducts));
          localStorage.setItem('siddeeq_transactions', JSON.stringify(mappedTransactions));
          return;
        }
      } catch (err) { console.warn(err); }

      const savedProducts = localStorage.getItem('siddeeq_products');
      if (savedProducts) { try { setProducts(JSON.parse(savedProducts)); } catch (e) { console.error(e); } }
      const savedTx = localStorage.getItem('siddeeq_transactions');
      if (savedTx) { try { setTransactions(JSON.parse(savedTx)); } catch (e) { console.error(e); } }
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

  useEffect(() => {
    if (akadType.includes('103') && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.strokeStyle = '#1C4D32'; ctx.lineWidth = 3; ctx.lineCap = 'round'; }
    }
  }, [akadType, activeTab]);

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
        updatedCart[existingIndex].error = `Stok tidak mencukupi, sisa stok: ${product.stockQty}`;
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

  // Solusi Checkout Otomatis Berbasis COA Sinkron 100%
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
    if (akadType.includes('103') && canvasRef.current) { signatureUrl = canvasRef.current.toDataURL(); }

    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      invoiceNumber: invoiceNum,
      date: dateNow.toISOString(),
      totalAmount,
      profitAmount: profitMargin,
      akadType,
      customerPhone: customerPhone || undefined,
      signatureUrl,
      items: cart.map(item => ({ productId: item.product.id, productName: item.product.name, sku: item.product.sku, qty: item.qty, price: item.product.sellPrice }))
    };

    const savedTx = localStorage.getItem('siddeeq_transactions');
    const currentTx: Transaction[] = savedTx ? JSON.parse(savedTx) : transactions;
    const updatedTx = [newTx, ...currentTx];
    setTransactions(updatedTx);
    localStorage.setItem('siddeeq_transactions', JSON.stringify(updatedTx));

    // Pembuatan Jurnal COA Baku Otomatis
    const savedJournals = localStorage.getItem('siddeeq_journals');
    const currentJournals: JournalEntry[] = savedJournals ? JSON.parse(savedJournals) : [];

    const newJournalDebet: JournalEntry = { id: `J-${Date.now()}-1`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: akadType, position: 'DEBET', amount: totalAmount, description: `Penjualan POS - ${invoiceNum}`, status: 'COMMITTED' };
    const newJournalKredit: JournalEntry = { id: `J-${Date.now()}-2`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: totalAmount, description: `Penjualan POS - ${invoiceNum}`, status: 'COMMITTED' };
    const newJournalHppDebet: JournalEntry = { id: `J-${Date.now()}-3`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: totalAmount - profitMargin, description: `HPP POS - ${invoiceNum}`, status: 'COMMITTED' };
    const newJournalPersediaanKredit: JournalEntry = { id: `J-${Date.now()}-4`, date: dateNow.toISOString().split('T')[0], ref: invoiceNum, account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: totalAmount - profitMargin, description: `HPP POS - ${invoiceNum}`, status: 'COMMITTED' };

    localStorage.setItem('siddeeq_journals', JSON.stringify([...currentJournals, newJournalDebet, newJournalKredit, newJournalHppDebet, newJournalPersediaanKredit]));

    setSuccessMessage(`Berhasil membukukan transaksi ${invoiceNum}!`);
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
    if (cart.some(item => item.error)) { alert("Perbaiki kesalahan stok!"); return; }
    if (showQrisModal) { submitCheckout(); } else { submitCheckout(); }
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (timeFilter === 'today') return transactions.filter(tx => new Date(tx.date) >= startOfToday);
    if (timeFilter === 'week') return transactions.filter(tx => new Date(tx.date) >= startOfWeek);
    return transactions.filter(tx => new Date(tx.date) >= new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000));
  };

  const filteredTx = getFilteredTransactions();
  const totalOmset = filteredTx.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalMargin = filteredTx.reduce((sum, tx) => sum + tx.profitAmount, 0);
  const totalTransactionsCount = filteredTx.length;
  const criticalStockCount = products.filter((p) => p.stockQty <= 5).length;

  const last7DaysData = [0,1,2,3,4,5,6].map(i => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    const dayTxs = transactions.filter(tx => new Date(tx.date).toDateString() === d.toDateString());
    return { label, omset: dayTxs.reduce((sum, tx) => sum + tx.totalAmount, 0), profit: dayTxs.reduce((sum, tx) => sum + tx.profitAmount, 0) };
  });

  const maxOmset = Math.max(...last7DaysData.map(d => d.omset), 100000);
  const points = last7DaysData.map((d, i) => ({ ...d, x: 50 + (i / 6) * 450, y: 150 - (d.omset / maxOmset) * 130, yProfit: 150 - (d.profit / maxOmset) * 130 }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;
  const profitLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yProfit}`).join(' ');

  const tunaiCount = filteredTx.filter(tx => tx.akadType.includes('101.01')).length;
  const murabahahCount = filteredTx.filter(tx => tx.akadType.includes('103')).length;
  const totalCount = filteredTx.length || 1;
  const tunaiPercent = Math.round((tunaiCount / totalCount) * 100);
  const murabahahPercent = Math.round((murabahahCount / totalCount) * 100);
  const tunaiStroke = (tunaiCount / totalCount) * 220; const murabahahStroke = (murabahahCount / totalCount) * 220;

  const handleQuickRestock = (productId: number) => {
    const qtyStr = restockInputs[productId]; if (!qtyStr) return;
    const qtyToAdd = parseInt(qtyStr); if (isNaN(qtyToAdd) || qtyToAdd <= 0) return;

    const savedProducts = localStorage.getItem('siddeeq_products');
    const currentProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : products;

    const updated = currentProducts.map(p => p.id === productId ? { ...p, stockQty: p.stockQty + qtyToAdd } : p);
    setProducts(updated); localStorage.setItem('siddeeq_products', JSON.stringify(updated));
    setRestockInputs(prev => ({ ...prev, [productId]: '' }));

    const savedJournals = localStorage.getItem('siddeeq_journals');
    const currentJournals: JournalEntry[] = savedJournals ? JSON.parse(savedJournals) : [];
    const targetProduct = currentProducts.find(p => p.id === productId);
    
    if (targetProduct) {
      const restockCost = targetProduct.buyPrice * qtyToAdd;
      const refNum = `RST-${Date.now()}`;
      const dateNowStr = new Date().toISOString().split('T')[0];

      const debetEntry: JournalEntry = { id: `J-${Date.now()}-R1`, date: dateNowStr, ref: refNum, account: '102 - Persediaan Suku Cadang', position: 'DEBET', amount: restockCost, description: `Restok ${qtyToAdd}x ${targetProduct.name}`, status: 'COMMITTED' };
      const kreditEntry: JournalEntry = { id: `J-${Date.now()}-R2`, date: dateNowStr, ref: refNum, account: '101.01 - Kas Utama (Tunai)', position: 'KREDIT', amount: restockCost, description: `Restok ${qtyToAdd}x ${targetProduct.name}`, status: 'COMMITTED' };

      localStorage.setItem('siddeeq_journals', JSON.stringify([...currentJournals, debetEntry, kreditEntry]));
    }
    alert(`Berhasil restok ${qtyToAdd} unit!`);
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

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)' }}>
            <button onClick={() => setActiveTab('dashboard')} style={{ padding: '12px', fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab === 'dashboard' ? '3px solid var(--color-secondary)' : '3px solid transparent', color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>📊 Ringkasan Bisnis (Dashboard)</button>
            <button onClick={() => setActiveTab('pos')} style={{ padding: '12px', fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab === 'pos' ? '3px solid var(--color-secondary)' : '3px solid transparent', color: activeTab === 'pos' ? 'var(--color-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>🛒 POS Kasir Utama</button>
          </div>

          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>Dashboard Kinerja Bengkel</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monitoring omset, margin syariah, dan stok kritis secara real-time</p>
                </div>
                <div style={{ display: 'inline-flex', backgroundColor: '#FFFFFF', padding: '2px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  {(['today', 'week', 'month'] as const).map(filter => (
                    <button key={filter} onClick={() => setTimeFilter(filter)} style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', backgroundColor: timeFilter === filter ? 'var(--color-primary)' : 'transparent', color: timeFilter === filter ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer' }}>{filter === 'today' ? 'Hari Ini' : filter === 'week' ? '7 Hari' : '30 Hari'}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <Card style={{ borderLeft: '4px solid var(--color-primary)' }}><CardBody><div>Omset</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rp {totalOmset.toLocaleString('id-ID')}</div></CardBody></Card>
                <Card style={{ borderLeft: '4px solid var(--color-secondary)' }}><CardBody><div>Margin</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rp {totalMargin.toLocaleString('id-ID')}</div></CardBody></Card>
                <Card style={{ borderLeft: '4px solid var(--color-committed-text)' }}><CardBody><div>Sukses</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalTransactionsCount} Trx</div></CardBody></Card>
                <Card style={{ borderLeft: '4px solid var(--color-danger)' }}><CardBody><div>Kritis</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)' }}>{criticalStockCount} Item</div></CardBody></Card>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
                <Card>
                  <CardBody>
                    <svg viewBox="0 0 520 180" width="100%" height="150" style={{ overflow: 'visible' }}>
                      <path d={areaPath} fill="url(#gradient-omset)"/>
                      <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3"/>
                      <path d={profitLinePath} fill="none" stroke="var(--color-secondary)" strokeWidth="2" strokeDasharray="4 2"/>
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="var(--color-primary)" onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}/>
                          <circle cx={p.x} cy={p.yProfit} r="3" fill="var(--color-secondary)"/>
                        </g>
                      ))}
                    </svg>
                    {hoveredPoint && (
                      <div style={{ position: 'absolute', backgroundColor: '#1E293B', color: '#white', padding: '8px', borderRadius: '4px', fontSize: '0.75rem', zIndex: 99 }}>
                        <strong>{hoveredPoint.label}</strong>
                        <div>Omset: Rp {hoveredPoint.omset.toLocaleString('id-ID')}</div>
                      </div>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                      <svg viewBox="0 0 100 100" width="100%">
                        <circle cx="50" cy="50" r="35" fill="transparent" stroke="#E2E8F0" strokeWidth="10" />
                        {tunaiCount > 0 && <circle cx="50" cy="50" r="35" fill="transparent" stroke="var(--color-primary)" strokeWidth="10" strokeDasharray={`${tunaiStroke} 220`} strokeDashoffset="220" transform="rotate(-90 50 50)" />}
                        {murabahahCount > 0 && <circle cx="50" cy="50" r="35" fill="transparent" stroke="var(--color-secondary)" strokeWidth="10" strokeDasharray={`${murabahahStroke} 220`} strokeDashoffset={220 + murabahahOffset} transform="rotate(-90 50 50)" />}
                      </svg>
                      <div style={{ position: 'absolute', top: '40%', left: '42%', textAlign: 'center' }}><span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{totalTransactionsCount}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.75rem' }}>
                      <div><span style={{ color: 'var(--color-primary)' }}>●</span> Tunai: {tunaiPercent}%</div>
                      <div><span style={{ color: 'var(--color-secondary)' }}>●</span> Murabahah: {murabahahPercent}%</div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
                <Card>
                  <CardBody>
                    <table style={{ width: '100%', fontSize: '0.8rem' }}>
                      <thead><tr style={{ textAlign: 'left' }}><th>Invoice</th><th>Tanggal</th><th>Metode COA</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                      <tbody>
                        {filteredTx.map(tx => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>{tx.invoiceNumber}</td>
                            <td>{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                            <td style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{tx.akadType}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>Rp {tx.totalAmount.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody style={{ padding: '8px' }}>
                    {products.filter(p => p.stockQty <= 5).map(prod => (
                      <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div>{prod.name} (Sisa: {prod.stockQty})</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="number" placeholder="Qty" value={restockInputs[prod.id] || ''} onChange={(e) => setRestockInputs({ ...restockInputs, [prod.id]: e.target.value })} style={{ width: '40px' }} />
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
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Card><CardBody><label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Cari Suku Cadang Gudang</label><Input placeholder="Ketik SKU / Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></CardBody></Card>
                <Card>
                  <CardBody style={{ padding: 0 }}>
                    {filteredProducts.length > 0 && (
                      <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead><tr style={{ backgroundColor: 'var(--bg-main)' }}><th style={{ padding: '8px' }}>SKU</th><th>Nama</th><th>Harga</th><th style={{ textAlign: 'center' }}>Pilih</th></tr></thead>
                        <tbody>
                          {filteredProducts.map(prod => (
                            <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px', fontFamily: 'monospace' }}>{prod.sku}</td>
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
                    <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {cart.map((item, index) => (
                        <div key={item.product.id} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span>{item.product.name}</span><button type="button" onClick={() => handleRemoveItem(index)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>×</button></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}><input type="number" value={item.qty} onChange={(e) => handleUpdateQty(index, parseInt(e.target.value) || 1)} style={{ width: '45px' }} /><span style={{ fontWeight: 600 }}>Rp {(item.product.sellPrice * item.qty).toLocaleString('id-ID')}</span></div>
                        </div>
                      ))}
                      <Input label="WhatsApp Pelanggan" placeholder="08123..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                      
                      {/* DROPDOWN UTAMA METODE PEMBAYARAN AKUN COA BAKU */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Metode Pembayaran / Akad Syariah</label>
                        <select value={akadType} onChange={(e) => setAkadType(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>
                          <option value="101.01 - Kas Utama (Tunai)">Tunai (Cash / Al-Bai' Bithaman Ajil)</option>
                          <option value="101.02 - Bank Syariah (Transfer)">Transfer Bank (Bank Syariah)</option>
                          <option value="101.02 - Bank Syariah (Transfer)">QRIS (E-Wallet Clearing)</option>
                          <option value="103 - Piutang Murabahah">Murabahah (Cicil/Kredit dengan Margin)</option>
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
                    <CardFooter>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontWeight: 700, marginBottom: '8px' }}><span>Total Bayar</span><span>Rp {totalAmount.toLocaleString('id-ID')}</span></div>
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