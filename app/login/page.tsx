"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/layout/AuthWrapper';
import { getSupabaseClient, verifyPasswordBrowser, hashPasswordBrowser } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Tab State: 'login' | 'register' | 'otp'
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');

  // Input fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'KASIR' | 'ADMIN_AKUNTANSI' | 'MANAJER_OWNER'>('KASIR');
  const [otp, setOtp] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email/Username used for login

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Mock WhatsApp Notification system for OTP Simulation
  const [mockNotification, setMockNotification] = useState<{ show: boolean; otp: string } | null>(null);

  // Auto-hide notification after 15 seconds
  useEffect(() => {
    if (mockNotification?.show) {
      const timer = setTimeout(() => {
        setMockNotification(prev => prev ? { ...prev, show: false } : null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [mockNotification]);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Query users table in Supabase REST API via SDK
        const { data: users, error: dbErr } = await supabase
          .from('users')
          .select('*')
          .or(`username.eq."${identifier.trim()}",email.eq."${identifier.trim().toLowerCase()}"`);

        if (dbErr) {
          throw new Error(dbErr.message);
        }

        const user = users && users.length > 0 ? users[0] : null;

        if (!user) {
          setErrorMsg('Username atau password salah.');
          setLoading(false);
          return;
        }

        // Verify password hash in browser (Web Crypto API PBKDF2 SHA-512)
        const isPasswordValid = await verifyPasswordBrowser(password, user.password_hash);
        if (!isPasswordValid) {
          setErrorMsg('Username atau password salah.');
          setLoading(false);
          return;
        }

        // Verify email status
        if (!user.is_email_verified) {
          setUsername(user.username);
          setErrorMsg('Akun Anda belum terverifikasi. Silakan verifikasi OTP terlebih dahulu.');
          setTimeout(() => {
            setMode('otp');
            setErrorMsg(null);
          }, 2000);
          setLoading(false);
          return;
        }

        // Call backend API /api/auth/login with pre-verified session flag to establish the HTTPOnly session cookie
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            password,
            isSupabaseVerified: true,
            userProfile: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
            }
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          login(data.user);
          setSuccessMsg('Login sukses via Supabase! Mengarahkan...');
          setTimeout(() => {
            if (data.user.role === 'ADMIN_AKUNTANSI') {
              router.push('/accounting');
            } else {
              router.push('/');
            }
          }, 1000);
        } else {
          setErrorMsg(data.error || 'Gagal menyimpan sesi login.');
        }
      } else {
        // Fallback to local database
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          login(data.user);
          setSuccessMsg('Login sukses! Mengarahkan...');
          setTimeout(() => {
            if (data.user.role === 'ADMIN_AKUNTANSI') {
              router.push('/accounting');
            } else {
              router.push('/');
            }
          }, 1000);
        } else if (response.status === 403 && data.needsVerification) {
          setUsername(data.username);
          setErrorMsg(data.error);
          setTimeout(() => {
            setMode('otp');
            setErrorMsg(null);
          }, 2000);
        } else {
          setErrorMsg(data.error || 'Identitas atau password salah.');
        }
      }
    } catch (err: any) {
      setErrorMsg('Gagal menyambung ke Supabase/Server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Check if username/email already taken in Supabase
        const { data: existingUsers, error: checkErr } = await supabase
          .from('users')
          .select('id')
          .or(`username.eq."${username.trim()}",email.eq."${email.trim().toLowerCase()}"`);

        if (checkErr) {
          throw new Error(checkErr.message);
        }

        if (existingUsers && existingUsers.length > 0) {
          setErrorMsg('Username atau email sudah digunakan.');
          setLoading(false);
          return;
        }

        // Hash password client-side using Web Crypto
        const passwordHash = await hashPasswordBrowser(password);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        // Insert new user into Supabase users table
        const { error: regErr } = await supabase
          .from('users')
          .insert([{
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password_hash: passwordHash,
            role,
            is_email_verified: false,
            verification_token: verificationToken,
            token_expires_at: tokenExpiresAt
          }]);

        if (regErr) {
          throw new Error(regErr.message);
        }

        setSuccessMsg('Registrasi berhasil di Supabase! Kode verifikasi telah dikirim.');
        setMockNotification({ show: true, otp: verificationToken });
        setTimeout(() => {
          setMode('otp');
          setSuccessMsg(null);
        }, 1500);
      } else {
        // Fallback
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, role }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setSuccessMsg(data.message);
          if (data.verificationCode) {
            setMockNotification({ show: true, otp: data.verificationCode });
          }
          setTimeout(() => {
            setMode('otp');
            setSuccessMsg(null);
          }, 1500);
        } else {
          setErrorMsg(data.error || 'Pendaftaran gagal.');
        }
      }
    } catch (err: any) {
      setErrorMsg('Gagal menyambung ke Supabase/Server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetIdentifier = username || identifier || email;

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Query user in Supabase
        const { data: users, error: findErr } = await supabase
          .from('users')
          .select('*')
          .or(`username.eq."${targetIdentifier.trim()}",email.eq."${targetIdentifier.trim().toLowerCase()}"`);

        if (findErr) {
          throw new Error(findErr.message);
        }

        const user = users && users.length > 0 ? users[0] : null;
        if (!user) {
          setErrorMsg('Pengguna tidak ditemukan.');
          setLoading(false);
          return;
        }

        if (user.verification_token !== otp) {
          setErrorMsg('Kode OTP salah.');
          setLoading(false);
          return;
        }

        if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) {
          setErrorMsg('Kode OTP telah kedaluwarsa.');
          setLoading(false);
          return;
        }

        // Update verification status in Supabase users table
        const { error: updErr } = await supabase
          .from('users')
          .update({
            is_email_verified: true,
            verification_token: null,
            token_expires_at: null
          })
          .eq('id', user.id);

        if (updErr) {
          throw new Error(updErr.message);
        }

        setSuccessMsg('Verifikasi akun Supabase berhasil! Silakan masuk.');
        setMockNotification(null);
        setTimeout(() => {
          setMode('login');
          setOtp('');
          setIdentifier(user.username);
          setPassword('');
          setSuccessMsg(null);
        }, 2000);
      } else {
        // Fallback
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: targetIdentifier, otp }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setSuccessMsg(data.message);
          setMockNotification(null);
          setTimeout(() => {
            setMode('login');
            setOtp('');
            setIdentifier(targetIdentifier);
            setPassword('');
            setSuccessMsg(null);
          }, 2000);
        } else {
          setErrorMsg(data.error || 'Verifikasi OTP gagal.');
        }
      }
    } catch (err: any) {
      setErrorMsg('Gagal memproses verifikasi OTP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      
      {/* MOCK WHATSAPP NOTIFICATION SLIDER */}
      {mockNotification?.show && (
        <div className="mock-wa-notification">
          <div className="mock-wa-header">
            <span className="mock-wa-logo">💬</span>
            <div className="mock-wa-title-container">
              <strong className="mock-wa-title">Siddeeq Bot (Fonnte API)</strong>
              <span className="mock-wa-subtitle">Baru saja</span>
            </div>
            <button 
              onClick={() => setMockNotification(prev => prev ? { ...prev, show: false } : null)}
              className="mock-wa-close"
            >
              ×
            </button>
          </div>
          <div className="mock-wa-body">
            Assalamu'alaikum. Kode OTP verifikasi Anda adalah: <strong className="highlight-otp">{mockNotification.otp}</strong>. Kode ini berlaku selama 15 menit. Jangan bagikan kode ini kepada siapapun!
          </div>
        </div>
      )}

      {/* BACKGROUND GRAPHICS */}
      <div className="bg-glow bg-glow-green"></div>
      <div className="bg-glow bg-glow-gold"></div>

      <div className="glass-card">
        {/* BRANDING LOGO */}
        <div className="brand-header">
          <div className="brand-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <img 
              src="/logo.png" 
              alt="Siddeeq Cycle Works Logo" 
              style={{ 
                width: '80px', 
                height: '80px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(234, 168, 18, 0.15))'
              }} 
            />
          </div>
          <h1 className="brand-name">Siddeeq Cycle Works</h1>
          <p className="brand-tagline">Kasir & Akuntansi Keuangan Syariah</p>
        </div>

        {/* TAB CONTROLS (Only show when not in OTP mode) */}
        {mode !== 'otp' && (
          <div className="tab-buttons">
            <button 
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            >
              Masuk
            </button>
            <button 
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
            >
              Daftar Karyawan
            </button>
          </div>
        )}

        {/* MESSAGE BANNERS */}
        {successMsg && <div className="alert alert-success">✓ {successMsg}</div>}
        {errorMsg && <div className="alert alert-danger">⚠ {errorMsg}</div>}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Username / Email</label>
              <input 
                type="text" 
                placeholder="Masukkan username atau email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Kata Sandi</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Masuk ke Platform'}
            </button>
          </form>
        )}

        {/* MODE: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="username_baru"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Email Resmi</label>
              <input 
                type="email" 
                placeholder="nama@siddeeqcycle.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Kata Sandi</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Peran / Role Otoritas</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
                disabled={loading}
              >
                <option value="KASIR">Kasir (Operasional POS)</option>
                <option value="ADMIN_AKUNTANSI">Admin Akuntansi (Buku Besar/Jurnal)</option>
                <option value="MANAJER_OWNER">Manajer / Owner (Akses Penuh)</option>
              </select>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Daftarkan Pengguna'}
            </button>
          </form>
        )}

        {/* MODE: OTP VERIFICATION */}
        {mode === 'otp' && (
          <div className="otp-container">
            <h2 className="otp-title">Verifikasi OTP</h2>
            <p className="otp-description">
              Kode OTP 6-digit simulasi telah dikirimkan. Silakan periksa notifikasi WhatsApp di atas.
            </p>
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="form-group">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="0 0 0 0 0 0"
                  className="otp-input-field"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Verifikasi Akun'}
              </button>
              <button 
                type="button" 
                className="btn-back-login"
                onClick={() => setMode('login')}
                disabled={loading}
              >
                Kembali ke Login
              </button>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #0d2216 0%, #17181c 100%);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          padding: 1.5rem;
        }

        /* Ambient Glow Backgrounds */
        .bg-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          z-index: 1;
          pointer-events: none;
        }
        .bg-glow-green {
          top: -100px;
          left: -100px;
          background-color: var(--color-primary, #1C4D32);
        }
        .bg-glow-gold {
          bottom: -100px;
          right: -100px;
          background-color: var(--color-secondary, #EAA812);
        }

        /* Glassmorphism Card Card */
        .glass-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.25rem;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        /* Brand Title styling */
        .brand-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .brand-logo {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          display: inline-block;
          animation: float 3s ease-in-out infinite;
        }
        .brand-name {
          color: #FFFFFF;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        .brand-tagline {
          color: var(--text-tertiary, #9CA3AF);
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        /* Tab Buttons */
        .tab-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(0, 0, 0, 0.2);
          padding: 4px;
          border-radius: var(--radius-md, 0.5rem);
          margin-bottom: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: #9CA3AF;
          padding: 0.625rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-btn.active {
          background: var(--color-primary, #1C4D32);
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(28, 77, 50, 0.3);
        }

        /* Form styling */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .form-group label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.775rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .form-group input, .form-group select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          color: #FFFFFF;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .form-group input::placeholder {
          color: #6B7280;
        }
        .form-group input:focus, .form-group select:focus {
          outline: none;
          border-color: var(--color-secondary, #EAA812);
          box-shadow: 0 0 0 2px rgba(234, 168, 18, 0.15);
          background: rgba(0, 0, 0, 0.4);
        }
        .form-group select option {
          background: #17181c;
          color: #FFFFFF;
        }

        /* Buttons and Spinners */
        .btn-submit {
          background: linear-gradient(135deg, var(--color-primary, #1C4D32) 0%, #143724 100%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
          padding: 0.875rem;
          font-size: 0.9rem;
          font-weight: 700;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          margin-top: 0.5rem;
        }
        .btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(28, 77, 50, 0.4);
          background: linear-gradient(135deg, #225c3c 0%, #19462e 100%);
        }
        .btn-submit:active {
          transform: translateY(1px);
        }

        .btn-back-login {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #9CA3AF;
          padding: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 0.5rem;
          cursor: pointer;
          margin-top: 0.25rem;
          transition: all 0.2s;
        }
        .btn-back-login:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.02);
        }

        /* Alerts */
        .alert {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          animation: slideDown 0.3s ease-out;
        }
        .alert-success {
          background-color: rgba(52, 211, 153, 0.1);
          color: #34D399;
          border: 1px solid rgba(52, 211, 153, 0.2);
        }
        .alert-danger {
          background-color: rgba(248, 113, 113, 0.1);
          color: #F87171;
          border: 1px solid rgba(248, 113, 113, 0.2);
        }

        /* OTP Specific */
        .otp-container {
          text-align: center;
          animation: fadeIn 0.4s ease-out;
        }
        .otp-title {
          color: #FFFFFF;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .otp-description {
          color: #9CA3AF;
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        .otp-input-field {
          letter-spacing: 0.75em;
          text-align: center;
          font-size: 1.5rem !important;
          font-weight: 700;
          font-family: monospace;
          max-width: 240px;
          margin: 0 auto;
        }

        /* Mock WhatsApp Notification component */
        .mock-wa-notification {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          left: 1.5rem;
          max-width: 440px;
          margin: 0 auto;
          background: #1f2c34;
          border-left: 4px solid #00a884;
          border-radius: 0.5rem;
          padding: 0.875rem 1.25rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          z-index: 100;
          animation: slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          color: #e9edef;
        }
        .mock-wa-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.375rem;
        }
        .mock-wa-logo {
          font-size: 1.1rem;
        }
        .mock-wa-title-container {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .mock-wa-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #e9edef;
        }
        .mock-wa-subtitle {
          font-size: 0.65rem;
          color: #8696a0;
        }
        .mock-wa-close {
          background: none;
          border: none;
          color: #8696a0;
          font-size: 1.25rem;
          cursor: pointer;
          transition: color 0.2s;
        }
        .mock-wa-close:hover {
          color: #e9edef;
        }
        .mock-wa-body {
          font-size: 0.775rem;
          line-height: 1.4;
          color: #d1d7db;
        }
        .highlight-otp {
          color: var(--color-secondary, #EAA812);
          font-family: monospace;
          font-size: 0.9rem;
          background: rgba(234, 168, 18, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(234, 168, 18, 0.2);
        }

        /* Spinner */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInDown {
          from { transform: translateY(-100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
