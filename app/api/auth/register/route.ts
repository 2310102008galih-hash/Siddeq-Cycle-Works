import { NextResponse } from 'next/server';
import { userDb } from '../../../../lib/userDb';
import { hashPassword } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, role } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, email, dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const validRoles = ['KASIR', 'ADMIN_AKUNTANSI', 'MANAJER_OWNER'];
    const userRole = role && validRoles.includes(role) ? role : 'KASIR';

    // Check if user already exists using userDb
    const existingUser = await userDb.findFirst({
      OR: [
        { username: username.trim() },
        { email: email.trim().toLowerCase() }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username atau email sudah digunakan.' },
        { status: 400 }
      );
    }

    // Generate random 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15); // Valid for 15 mins

    // Create user using userDb
    const passwordHash = hashPassword(password);
    const newUser = await userDb.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      role: userRole,
      is_email_verified: false,
      verification_token: verificationCode,
      token_expires_at: tokenExpiresAt
    });

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil. Silakan verifikasi OTP yang dikirim.',
      // Return verification code in response for testing/development simulation convenience
      verificationCode, 
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat registrasi: ' + error.message },
      { status: 500 }
    );
  }
}
