import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { userDb } from '../../../../lib/userDb';
import { verifyPassword } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, isSupabaseVerified, userProfile } = body;

    if (isSupabaseVerified && userProfile) {
      const sessionData = {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        role: userProfile.role
      };

      const cookieStore = await cookies();
      cookieStore.set('siddeeq_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/'
      });

      return NextResponse.json({
        success: true,
        message: 'Login berhasil via Supabase.',
        user: sessionData
      });
    }

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Username/email dan password wajib diisi.' },
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
        { success: false, error: 'Username atau password salah.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah.' },
        { status: 401 }
      );
    }

    // Verify email status
    if (!user.is_email_verified) {
      return NextResponse.json({
        success: false,
        needsVerification: true,
        error: 'Akun Anda belum terverifikasi. Silakan verifikasi OTP terlebih dahulu.',
        username: user.username,
        email: user.email
      }, { status: 403 });
    }

    // Create session cookie
    const sessionData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const cookieStore = await cookies();
    cookieStore.set('siddeeq_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: sessionData
    });

  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat login: ' + error.message },
      { status: 500 }
    );
  }
}
