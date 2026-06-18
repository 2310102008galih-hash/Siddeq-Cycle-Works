"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthWrapper';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  // Role visibility checks
  const canAccessPOS = user.role === 'KASIR' || user.role === 'MANAJER_OWNER';
  const canAccessInventory = user.role === 'MANAJER_OWNER';
  const canAccessAccounting = user.role === 'ADMIN_AKUNTANSI' || user.role === 'MANAJER_OWNER';
  const canAccessSettings = user.role === 'MANAJER_OWNER';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        Siddeeq Cycle Works
      </div>
      
      <nav className={styles.nav}>
        {canAccessPOS && (
          <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
            🛒 POS Kasir
          </Link>
        )}
        {canAccessInventory && (
          <Link href="/inventory" className={`${styles.navItem} ${pathname === '/inventory' ? styles.active : ''}`}>
            📦 Inventory
          </Link>
        )}
        {canAccessAccounting && (
          <Link href="/accounting" className={`${styles.navItem} ${pathname === '/accounting' ? styles.active : ''}`}>
            📊 Akuntansi Syariah
          </Link>
        )}
        {canAccessSettings && (
          <Link href="/settings" className={`${styles.navItem} ${pathname === '/settings' ? styles.active : ''}`}>
            ⚙️ Pengaturan
          </Link>
        )}
      </nav>

      {/* User Profile Info Card */}
      <div style={{
        padding: 'var(--spacing-4)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            color: '#FFFFFF', 
            fontSize: '0.85rem', 
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            👤 {user.username}
          </span>
          <span style={{ 
            color: 'var(--color-secondary)', 
            fontSize: '0.7rem', 
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginTop: '2px'
          }}>
            {user.role.replace('_', ' ')}
          </span>
        </div>
        <button
          onClick={logout}
          style={{
            marginTop: 'var(--spacing-2)',
            padding: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#F87171',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#F87171';
          }}
        >
          Keluar Sesi ↩
        </button>
      </div>
    </aside>
  );
}
