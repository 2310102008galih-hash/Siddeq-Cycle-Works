import { NextResponse } from 'next/server';
import { userDb } from '../../../../lib/userDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, otp } = body; // identifier can be username or email

    if (!identifier || !otp) {
      return NextResponse.json(
        { success: false, error: 'Identitas pengguna dan kode OTP wajib diisi.' },
        { status: 400 }
      );
    }

    // Find user using userDb
    const user = await userDb.findFirst({
      OR: [
        { username: identifier.trim() },
        { email: identifier.trim().toLowerCase() }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (user.is_email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Akun Anda sudah terverifikasi sebelumnya.'
      });
    }

    // Verify OTP code
    if (user.verification_token !== otp.trim()) {
      return NextResponse.json(
        { success: false, error: 'Kode OTP yang dimasukkan salah.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (user.token_expires_at && new Date() > new Date(user.token_expires_at)) {
      return NextResponse.json(
        { success: false, error: 'Kode OTP telah kedaluwarsa. Silakan registrasi ulang.' },
        { status: 400 }
      );
    }

    // Update user using userDb
    await userDb.update(user.id, {
      is_email_verified: true,
      verification_token: null,
      token_expires_at: null
    });

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil diverifikasi. Silakan login untuk melanjutkan.'
    });

  } catch (error: any) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat verifikasi: ' + error.message },
      { status: 500 }
    );
  }
}
