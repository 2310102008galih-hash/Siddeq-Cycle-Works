"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopHeader } from '../../components/layout/TopHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getSupabaseClient } from '../../lib/supabaseClient';

interface Product {
  id: number;
  sku: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  stockQty: number;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, sku: 'SC-BAN-001', name: 'Ban Luar Swallow Gravel 700x38c', buyPrice: 120000, sellPrice: 175000, stockQty: 15 },
  { id: 2, sku: 'SC-RAN-002', name: 'Rantai Shimano HG-54 10 Speed', buyPrice: 180000, sellPrice: 240000, stockQty: 8 },
  { id: 3, sku: 'SC-BRA-003', name: 'Kampas Rem Hidrolik Shimano B01S', buyPrice: 45000, sellPrice: 75000, stockQty: 22 },
  { id: 4, sku: 'SC-CRK-004', name: 'Crankset Litepro Hollowtech II', buyPrice: 350000, sellPrice: 490000, stockQty: 3 },
];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  // State pencarian tabel kiri
  const [searchTerm, setSearchTerm] = useState('');

  // Form states (kanan)
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-complete suggestions states
  const [suggestions, setFilteredSuggestions] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement | null>(null);

  // Load from database with localStorage fallback
  useEffect(() => {
    async function fetchProducts() {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: dbProducts, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });
          
          if (error) throw new Error(error.message);
          
          const mapped = dbProducts.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            buyPrice: Number(p.purchase_price),
            sellPrice: Number(p.sale_price),
            stockQty: p.stock_qty
          }));
          setProducts(mapped);
          localStorage.setItem('siddeeq_products', JSON.stringify(mapped));
          return;
        }

        const response = await fetch('/api/v1/sync');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.products) {
            const mapped = data.products.map((p: any) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              buyPrice: p.purchase_price,
              sellPrice: p.sale_price,
              stockQty: p.stock_qty
            }));
            setProducts(mapped);
            localStorage.setItem('siddeeq_products', JSON.stringify(mapped));
            return;
          }
        }
      } catch (err) {
        console.error("Failed to sync products from API, using fallback", err);
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('siddeeq_products');
      if (saved) {
        try {
          setProducts(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse products from localStorage", e);
        }
      } else {
        localStorage.setItem('siddeeq_products', JSON.stringify(INITIAL_PRODUCTS));
      }
    }
    fetchProducts();
  }, []);

  // Menutup auto-complete dropdown jika klik di luar area form
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger pencarian saat mengetik nama produk di form kanan
  const handleNameChange = (val: string) => {
    setName(val);
    if (selectedProductId) {
      // Jika user mengubah nama setelah memilih produk lama, reset mode ke produk baru
      setSelectedProductId(null);
    }

    if (val.trim() === '') {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    } else {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(val.toLowerCase()) || 
        p.sku.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  // Fungsi saat user memilih salah satu produk lama dari dropdown saran pencarian
  const handleSelectSuggestion = (prod: Product) => {
    setSelectedProductId(prod.id);
    setName(prod.name);
    setSku(prod.sku);
    setBuyPrice(prod.buyPrice.toString());
    setSellPrice(prod.sellPrice.toString());
    setStockQty(''); // Dikosongkan agar user fokus mengisi kuantitas tambahan saja
    setShowSuggestions(false);
  };

  // Fungsi standalone tombol "+ Stok" di tabel kiri
  const handleUpdateExistingStock = async (productId: number, currentStock: number, productName: string, qtyInput?: number) => {
    let qtyToAdd = qtyInput;
    
    if (!qtyToAdd) {
      const inputQty = prompt(`Masukkan jumlah unit baru yang ingin ditambahkan untuk:\n"${productName}"`);
      if (inputQty === null) return;
      qtyToAdd = parseInt(inputQty);
    }
    
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      alert("Harap masukkan angka jumlah penambahan unit yang valid dan di atas 0!");
      return;
    }

    const calculatedNewStock = currentStock + qtyToAdd;

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('products')
          .update({ stock_qty: calculatedNewStock })
          .eq('id', productId);

        if (error) throw new Error(error.message);
      }

      const updatedProducts = products.map((prod) => {
        if (prod.id === productId) {
          return { ...prod, stockQty: calculatedNewStock };
        }
        return prod;
      });

      setProducts(updatedProducts);
      localStorage.setItem('siddeeq_products', JSON.stringify(updatedProducts));
      return true;

    } catch (err: any) {
      console.warn("Gagal memperbarui database cloud, beralih ke local cache:", err.message);
      const updatedProducts = products.map((prod) => {
        if (prod.id === productId) {
          return { ...prod, stockQty: calculatedNewStock };
        }
        return prod;
      });
      setProducts(updatedProducts);
      localStorage.setItem('siddeeq_products', JSON.stringify(updatedProducts));
      return true;
    }
  };

  // Handler utama saat tombol form kanan diklik (Simpan Suku Cadang)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || !buyPrice || !sellPrice || !stockQty) return;

    setIsSubmitting(true);

    // MODE A: Update Stok Barang Lama jika ID Terdeteksi
    if (selectedProductId !== null) {
      const targetProd = products.find(p => p.id === selectedProductId);
      if (targetProd) {
        const success = await handleUpdateExistingStock(selectedProductId, targetProd.stockQty, targetProd.name, parseInt(stockQty));
        if (success) {
          alert(`Alhamdulillah, Berhasil menambahkan +${stockQty} unit ke stok barang lama "${targetProd.name}"!`);
          handleResetForm();
        }
      }
      setIsSubmitting(false);
      return;
    }

    // MODE B: Tambah Suku Cadang Baru yang Belum Terdaftar
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: newProd, error } = await supabase
          .from('products')
          .insert([{
            sku: sku.trim().toUpperCase(),
            name: name.trim(),
            purchase_price: parseFloat(buyPrice),
            sale_price: parseFloat(sellPrice),
            stock_qty: parseInt(stockQty)
          }])
          .select()
          .single();

        if (error) throw new Error(error.message);

        const mappedProd: Product = {
          id: newProd.id,
          sku: newProd.sku,
          name: newProd.name,
          buyPrice: Number(newProd.purchase_price),
          sellPrice: Number(newProd.sale_price),
          stockQty: newProd.stock_qty
        };

        const updated = [...products, mappedProd];
        setProducts(updated);
        localStorage.setItem('siddeeq_products', JSON.stringify(updated));
        alert(`Alhamdulillah, Suku cadang baru "${name}" berhasil didaftarkan ke gudang!`);
        handleResetForm();
        setIsSubmitting(false);
        return;
      }
    } catch (error: any) {
      console.error(error);
      const saved = localStorage.getItem('siddeeq_products');
      const currentProducts = saved ? JSON.parse(saved) : products;

      const newProduct: Product = {
        id: currentProducts.length > 0 ? Math.max(...currentProducts.map((p: Product) => p.id)) + 1 : 1,
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        buyPrice: parseFloat(buyPrice),
        sellPrice: parseFloat(sellPrice),
        stockQty: parseInt(stockQty),
      };

      const updatedProducts = [...currentProducts, newProduct];
      setProducts(updatedProducts);
      localStorage.setItem('siddeeq_products', JSON.stringify(updatedProducts));
      alert(`[Mode Offline] Suku cadang baru "${name}" disimpan di cache lokal.`);
      handleResetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSku('');
    setName('');
    setBuyPrice('');
    setSellPrice('');
    setStockQty('');
    setSelectedProductId(null);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
  };

  const filteredProductsTable = products.filter((p) => {
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.sku.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '260px' }}>
        <TopHeader title="Manajemen Inventaris (Inventory)" />
        
        <div style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
            
            {/* Left Column: Product Table */}
            <div>
              <Card>
                <div style={{ padding: 'var(--spacing-4) var(--spacing-4) 0 var(--spacing-4)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Daftar Suku Cadang Bengkel</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
                    Informasi stok aktif, harga beli (HPP), dan harga jual
                  </p>

                  <div style={{ maxWidth: '380px', marginBottom: 'var(--spacing-2)' }}>
                    <input 
                      type="text"
                      placeholder="🔍 Cari berdasarkan nama atau kode SKU suku cadang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <CardBody style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>SKU</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>Nama Suku Cadang</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'right' }}>Harga Beli (HPP)</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'right' }}>Harga Jual</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'center' }}>Stok</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProductsTable.length > 0 ? (
                          filteredProductsTable.map((product) => (
                            <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {product.sku}
                              </td>
                              <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 500 }}>
                                {product.name}
                              </td>
                              <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'right' }}>
                                Rp {product.buyPrice.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                                Rp {product.sellPrice.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'center' }}>
                                <span style={{
                                  padding: 'var(--spacing-1) var(--spacing-2)',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: product.stockQty <= 5 ? 'var(--color-void-bg)' : 'var(--color-committed-bg)',
                                  color: product.stockQty <= 5 ? 'var(--color-void-text)' : 'var(--color-committed-text)',
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}>
                                  {product.stockQty} Unit
                                </span>
                              </td>
                              <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateExistingStock(product.id, product.stockQty, product.name)}
                                  style={{
                                    padding: '4px 8px', fontSize: '0.75rem', backgroundColor: 'var(--color-primary)',
                                    color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600
                                  }}
                                >
                                  + Stok
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                              Suku cadang tidak ditemukan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Right Column: SMART MULTIFUNCTIONAL ADD PRODUCT FORM */}
            <div ref={suggestionRef} style={{ position: 'relative' }}>
              <Card style={{ borderTop: selectedProductId !== null ? '5px solid var(--color-secondary)' : '1px solid var(--border-color)' }}>
                <CardHeader 
                  title={selectedProductId !== null ? "Tambah Stok Barang Lama" : "Tambah Produk Baru"} 
                  description={selectedProductId !== null ? "Menambahkan kuantitas logistik suku cadang terdaftar" : "Registrasikan SKU baru ke gudang"} 
                />
                
                {/* Indikator badge pintar jika mode barang terdaftar aktif */}
                {selectedProductId !== null && (
                  <div style={{ margin: '0 var(--spacing-4)', padding: '6px 12px', backgroundColor: 'rgba(234, 168, 18, 0.1)', color: 'var(--color-secondary-hover)', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 'bold' }}>
                    📢 Mode Sinkronisasi Suku Cadang Terdaftar Aktif
                  </div>
                )}

                <form onSubmit={handleFormSubmit}>
                  <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', position: 'relative' }}>
                    
                    {/* INPUT NAMA: INTEGRATED WITH AUTO-COMPLETE SEARCH SUGGESTIONS */}
                    <div style={{ position: 'relative' }}>
                      <Input 
                        label="Nama Suku Cadang" 
                        placeholder="Ketik untuk cari barang lama / masukkan nama barang baru..." 
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                        autoComplete="off"
                      />
                      
                      {/* Dropdown Floating List Hasil Rekomendasi Barang Gudang */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                          maxHeight: '180px', overflowY: 'auto', zIndex: 999, marginTop: '2px'
                        }}>
                          <div style={{ padding: '5px 10px', fontSize: '0.65rem', color: 'var(--text-secondary)', backgroundColor: '#F8F9FA', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>
                            PRODUK LAMA TERDETEKSI (KLIK UNTUK TAMBAH STOK):
                          </div>
                          {suggestions.map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() => handleSelectSuggestion(prod)}
                              style={{
                                padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex',
                                justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0Fdf4'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                            >
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.name}</span>
                              <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>{prod.sku} (Sisa: {prod.stockQty})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Input 
                      label="Kode SKU" 
                      placeholder="Contoh: SC-BAN-005" 
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      required
                      disabled={selectedProductId !== null} // SKU dikunci jika barang lama biar tidak duplikat cacat
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
                      <Input 
                        label="HPP (Beli)" 
                        type="number" 
                        placeholder="Harga Beli"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                        required
                        disabled={selectedProductId !== null} // Harga beli terkunci otomatis
                      />
                      <Input 
                        label="Harga Jual" 
                        type="number" 
                        placeholder="Harga Jual"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        required
                        disabled={selectedProductId !== null} // Harga jual terkunci otomatis
                      />
                    </div>

                    <Input 
                      label={selectedProductId !== null ? "Jumlah Tambah Stok" : "Stok Awal"} 
                      type="number" 
                      placeholder={selectedProductId !== null ? "Masukkan nominal tambah unit..." : "Jumlah Unit"}
                      value={stockQty}
                      onChange={(e) => setStockQty(e.target.value)}
                      required
                    />
                  </CardBody>
                  
                  <CardFooter style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outline" 
                      type="button" 
                      disabled={isSubmitting}
                      onClick={handleResetForm}
                    >
                      {selectedProductId !== null ? 'Reset Mode' : 'Batal'}
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: selectedProductId !== null ? 'var(--color-secondary)' : 'var(--color-primary)'
                      }}
                    >
                      {isSubmitting ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255, 255, 255, 0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></span>
                          Menyimpan...
                        </div>
                      ) : selectedProductId !== null ? '✓ Tambah Stok' : 'Simpan Suku Cadang'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>

          </div>
        </div>
        
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </div>
  );
}