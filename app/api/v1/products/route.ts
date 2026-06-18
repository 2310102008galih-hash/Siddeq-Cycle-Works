import { NextResponse } from 'next/server';
import { salesDb } from '../../../../lib/salesDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sku, name, buyPrice, sellPrice, stockQty } = body;

    if (!sku || !name || buyPrice === undefined || sellPrice === undefined || stockQty === undefined) {
      return NextResponse.json(
        { success: false, error: 'Semua field (SKU, Nama, Harga Beli, Harga Jual, Stok) wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await salesDb.createProduct({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      purchase_price: Number(buyPrice),
      sale_price: Number(sellPrice),
      stock_qty: Number(stockQty)
    });

    return NextResponse.json({
      success: true,
      product: created
    });

  } catch (error: any) {
    console.error('Create Product API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan internal server saat menyimpan produk.' },
      { status: 500 }
    );
  }
}
