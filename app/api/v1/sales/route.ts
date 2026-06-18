import { NextResponse } from 'next/server';
import { salesDb } from '../../../../lib/salesDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cart, paymentMethod, customerPhone, transferReference, signatureUrl } = body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keranjang belanja tidak boleh kosong.' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Metode pembayaran wajib dipilih.' },
        { status: 400 }
      );
    }

    const validMethods = ['TUNAI', 'MURABAHAH', 'QRIS', 'TRANSFER'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Metode pembayaran tidak valid.' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'MURABAHAH' && !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp pelanggan wajib diisi untuk Akad Murabahah.' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'TRANSFER' && !transferReference) {
      return NextResponse.json(
        { success: false, error: 'Nomor referensi atau nama pengirim transfer wajib diisi.' },
        { status: 400 }
      );
    }

    // Execute atomic transactional checkout via DAL
    const result = await salesDb.executeCheckout({
      cart,
      paymentMethod,
      customerPhone,
      transferReference,
      signatureUrl
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan internal server saat memproses checkout.' },
      { status: 500 }
    );
  }
}
