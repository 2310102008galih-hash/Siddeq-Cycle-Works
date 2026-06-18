import React from 'react';
import styles from './TopHeader.module.css';

interface TopHeaderProps {
  title: string;
}

export function TopHeader({ title }: TopHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.actions}>
        <div className={styles.user}>
          <div className={styles.avatar}>A</div>
          <span>Admin Bengkel</span>
        </div>
      </div>
    </header>
  );
}
