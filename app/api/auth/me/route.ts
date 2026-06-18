import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('siddeeq_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { success: false, error: 'Belum terautentikasi.' },
        { status: 401 }
      );
    }

    try {
      const user = JSON.parse(sessionCookie.value);
      return NextResponse.json({
        success: true,
        user
      });
    } catch (parseError) {
      // Clear malformed cookie
      cookieStore.set('siddeeq_session', '', { maxAge: 0 });
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid.' },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.error('Me API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat mengecek sesi: ' + error.message },
      { status: 500 }
    );
  }
}
