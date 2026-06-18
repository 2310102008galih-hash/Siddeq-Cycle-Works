import { NextResponse } from 'next/server';
import { salesDb } from '../../../../lib/salesDb';

export async function GET() {
  try {
    const products = await salesDb.getProducts();
    const sales = await salesDb.getSales();
    const journals = await salesDb.getJournals();

    return NextResponse.json({
      success: true,
      products,
      sales,
      journals
    });
  } catch (error: any) {
    console.error('Data Sync API error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mensinkronisasikan data dari database: ' + error.message },
      { status: 500 }
    );
  }
}
