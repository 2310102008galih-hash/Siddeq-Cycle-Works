import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('siddeeq_session', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: 'Logout berhasil.'
    });
  } catch (error: any) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat logout: ' + error.message },
      { status: 500 }
    );
  }
}
