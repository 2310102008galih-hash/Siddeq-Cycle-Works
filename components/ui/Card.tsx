import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return <div className={`${styles.card} ${className}`} {...props}>{children}</div>;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function CardHeader({ title, description, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`${styles.header} ${className}`} {...props}>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return <div className={`${styles.body} ${className}`} {...props}>{children}</div>;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return <div className={`${styles.footer} ${className}`} {...props}>{children}</div>;
}
