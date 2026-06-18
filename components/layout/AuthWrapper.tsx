"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'KASIR' | 'ADMIN_AKUNTANSI' | 'MANAJER_OWNER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch current session from server on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Define route protection
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        // Redirect to their default page based on role
        if (user.role === 'ADMIN_AKUNTANSI') {
          router.push('/accounting');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, loading, pathname, router]);

  // Determine if current route is authorized for user's role
  const isAuthorized = (): { authorized: boolean; reason?: string } => {
    if (!user) return { authorized: false };

    // Owner/Manager can access everything
    if (user.role === 'MANAJER_OWNER') {
      return { authorized: true };
    }

    if (pathname === '/') {
      // Kasir and Owner
      if (user.role === 'KASIR') return { authorized: true };
      return { authorized: false, reason: 'Halaman POS Kasir hanya dapat diakses oleh Kasir atau Manajer/Owner.' };
    }

    if (pathname === '/inventory') {
      // Owner only
      return { authorized: false, reason: 'Manajemen Inventaris (Stock Opname) hanya dapat diakses oleh Manajer/Owner.' };
    }

    if (pathname === '/accounting') {
      // Admin Akuntansi and Owner
      if (user.role === 'ADMIN_AKUNTANSI') return { authorized: true };
      return { authorized: false, reason: 'Laporan Keuangan & Buku Jurnal hanya dapat diakses oleh Admin Akuntansi atau Manajer/Owner.' };
    }

    if (pathname === '/settings') {
      // Owner only
      return { authorized: false, reason: 'Pengaturan Kemitraan & Cabang Baru hanya dapat diakses oleh Manajer/Owner.' };
    }

    return { authorized: true };
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#F8F9FA',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(28, 77, 50, 0.1)',
          borderTopColor: '#1C4D32',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 'var(--spacing-4)'
        }}></div>
        <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
          Memuat Siddeeq Cycle Works...
        </span>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not logged in and trying to access app, redirecting (handled in useEffect)
  if (!user && pathname !== '/login') {
    return null;
  }

  // If logged in, check role authorization
  if (user && pathname !== '/login') {
    const authStatus = isAuthorized();
    if (!authStatus.authorized) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#F8F9FA',
          padding: '2rem',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            padding: '2.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
            textAlign: 'center',
            borderTop: '5px solid #EF4444'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 1.5rem auto',
              fontSize: '2rem'
            }}>
              🚫
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
              Akses Ditolak
            </h1>
            <p style={{ color: '#4B5563', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {authStatus.reason || 'Anda tidak memiliki wewenang untuk mengakses halaman ini.'}
            </p>
            <div style={{
              backgroundColor: '#F3F4F6',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              color: '#6B7280',
              marginBottom: '2rem',
              display: 'inline-flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <span>Pengguna Aktif: <strong>{user.username}</strong></span>
              <span>Hak Akses Anda: <strong style={{ color: '#1C4D32' }}>{user.role}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  if (user.role === 'ADMIN_AKUNTANSI') {
                    router.push('/accounting');
                  } else {
                    router.push('/');
                  }
                }}
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: '#1C4D32',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Kembali ke Beranda Anda
              </button>
              <button
                onClick={logout}
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#EF4444',
                  backgroundColor: 'transparent',
                  border: '1px solid #EF4444',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Logout Sesi
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
