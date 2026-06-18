"use client";

import React, { useState, useEffect } from 'react';
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

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || !buyPrice || !sellPrice || !stockQty) return;

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Insert product directly into Supabase
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
        
        setSku('');
        setName('');
        setBuyPrice('');
        setSellPrice('');
        setStockQty('');
        setIsSubmitting(false);
        return;
      }

      // Fallback
      const response = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          name,
          buyPrice,
          sellPrice,
          stockQty
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.product) {
          const newProd: Product = {
            id: result.product.id,
            sku: result.product.sku,
            name: result.product.name,
            buyPrice: result.product.purchase_price,
            sellPrice: result.product.sale_price,
            stockQty: result.product.stock_qty
          };
          const updated = [...products, newProd];
          setProducts(updated);
          localStorage.setItem('siddeeq_products', JSON.stringify(updated));
          
          setSku('');
          setName('');
          setBuyPrice('');
          setSellPrice('');
          setStockQty('');
          setIsSubmitting(false);
          return;
        }
      }
      throw new Error("Gagal menyimpan produk ke backend.");
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

      setSku('');
      setName('');
      setBuyPrice('');
      setSellPrice('');
      setStockQty('');
      setIsSubmitting(false);
    }
  };

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
                <CardHeader 
                  title="Daftar Suku Cadang Bengkel" 
                  description="Informasi stok aktif, harga beli (HPP), dan harga jual" 
                />
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
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Right Column: Add Product Form */}
            <div>
              <Card>
                <CardHeader title="Tambah Produk Baru" description="Registrasikan SKU baru ke gudang" />
                <form onSubmit={handleAddProduct}>
                  <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    <Input 
                      label="Kode SKU" 
                      placeholder="Contoh: SC-BAN-005" 
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      required
                    />
                    <Input 
                      label="Nama Suku Cadang" 
                      placeholder="Contoh: Ban Dalam Swallow 26" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
                      <Input 
                        label="HPP (Beli)" 
                        type="number" 
                        placeholder="Harga Beli"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                        required
                      />
                      <Input 
                        label="Harga Jual" 
                        type="number" 
                        placeholder="Harga Jual"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                        required
                      />
                    </div>
                    <Input 
                      label="Stok Awal" 
                      type="number" 
                      placeholder="Jumlah Unit"
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
                      onClick={() => {
                        setSku('');
                        setName('');
                        setBuyPrice('');
                        setSellPrice('');
                        setStockQty('');
                      }}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          <span className="spinner" style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTopColor: '#FFFFFF',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite'
                          }}></span>
                          Menyimpan...
                        </div>
                      ) : 'Simpan Suku Cadang'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>

          </div>
        </div>
        
        {/* Global spinner animation keyframes definition */}
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </div>
  );
}
