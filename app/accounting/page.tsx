"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopHeader } from '../../components/layout/TopHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getSupabaseClient } from '../../lib/supabaseClient';

interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  account: string;
  position: 'DEBET' | 'KREDIT';
  amount: number;
  description: string;
  status: 'COMMITTED' | 'PENDING_APPROVAL' | 'VOID';
}

const INITIAL_JOURNALS: JournalEntry[] = [
  { id: 'J-001', date: '2026-05-22', ref: 'INV/20260522/0001', account: '101 - Kas Utama (Tunai)', position: 'DEBET', amount: 175000, description: 'Penjualan Ban Swallow', status: 'COMMITTED' },
  { id: 'J-002', date: '2026-05-22', ref: 'INV/20260522/0001', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 175000, description: 'Penjualan Ban Swallow', status: 'COMMITTED' },
  { id: 'J-002-H1', date: '2026-05-22', ref: 'INV/20260522/0001', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 120000, description: 'HPP Penjualan Ban Swallow', status: 'COMMITTED' },
  { id: 'J-002-H2', date: '2026-05-22', ref: 'INV/20260522/0001', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 120000, description: 'HPP Penjualan Ban Swallow', status: 'COMMITTED' },
  { id: 'J-003', date: '2026-05-22', ref: 'EXP-0021', account: '502 - Biaya Listrik & Air', position: 'DEBET', amount: 350000, description: 'Pembayaran Listrik Mei', status: 'PENDING_APPROVAL' },
  { id: 'J-004', date: '2026-05-22', ref: 'EXP-0021', account: '101 - Kas Utama (Tunai)', position: 'KREDIT', amount: 350000, description: 'Pembayaran Listrik Mei', status: 'PENDING_APPROVAL' },
];

export default function AccountingPage() {
  // Chart of accounts mock
  const coa = [
    { code: '101.01', name: 'Kas Utama (Tunai)', type: 'ASET' },
    { code: '101.02', name: 'Bank Syariah (Transfer)', type: 'ASET' },
    { code: '101.03', name: 'E-Wallet Clearing (QRIS)', type: 'ASET' },
    { code: '102', name: 'Persediaan Suku Cadang', type: 'ASET' },
    { code: '103', name: 'Piutang Murabahah', type: 'ASET' },
    { code: '401', name: 'Pendapatan Penjualan', type: 'PENDAPATAN' },
    { code: '501', name: 'Harga Pokok Penjualan (HPP)', type: 'BIAYA' },
    { code: '502', name: 'Biaya Listrik & Air', type: 'BIAYA' },
    { code: '503', name: 'Biaya Sewa Bengkel', type: 'BIAYA' },
    { code: '504', name: 'Biaya Gaji Karyawan', type: 'BIAYA' },
  ];

  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);

  // Form states for Expense
  const [selectedCoa, setSelectedCoa] = useState('502');
  const [nominal, setNominal] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);

  // Load journals on mount from database or local fallback
  useEffect(() => {
    async function syncJournals() {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          // Fetch transactions from Supabase
          const { data: dbTransactions, error } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: true }); // older first to match sequence

          if (error) throw new Error(error.message);

          const generatedJournals: JournalEntry[] = [];
          let journalCounter = 1;

          // Retrieve expenses from localStorage or INITIAL_JOURNALS if not present
          const savedJournalsStr = localStorage.getItem('siddeeq_journals');
          let expenseJournals: JournalEntry[] = [];
          if (savedJournalsStr) {
            try {
              const parsed = JSON.parse(savedJournalsStr);
              expenseJournals = parsed.filter((j: any) => j.ref && j.ref.startsWith('EXP-'));
            } catch (e) {
              console.error(e);
            }
          }
          if (expenseJournals.length === 0) {
            expenseJournals = INITIAL_JOURNALS.filter(j => j.ref && j.ref.startsWith('EXP-'));
          }

          dbTransactions.forEach((t: any) => {
            const dateStr = t.transaction_date.split('T')[0];
            const refStr = t.invoice_number;
            const amount = Number(t.total_amount);
            const profit = amount * 0.3; // 30% estimated profit margin
            const hpp = amount - profit;

            let debitAccount = '101.01 - Kas Utama (Tunai)';
            if (t.payment_method === 'TRANSFER') debitAccount = '101.02 - Bank Syariah (Transfer)';
            else if (t.payment_method === 'QRIS') debitAccount = '101.03 - E-Wallet Clearing (QRIS)';
            else if (t.payment_method === 'MURABAHAH') debitAccount = '103 - Piutang Murabahah';

            // 1. Debet Kas/Bank/Piutang
            generatedJournals.push({
              id: `J-TRX-${journalCounter++}`,
              date: dateStr,
              ref: refStr,
              account: debitAccount,
              position: 'DEBET',
              amount: amount,
              description: `Penerimaan penjualan via ${t.payment_method} - ${refStr}`,
              status: 'COMMITTED'
            });

            // 2. Kredit Pendapatan Penjualan
            generatedJournals.push({
              id: `J-TRX-${journalCounter++}`,
              date: dateStr,
              ref: refStr,
              account: '401 - Pendapatan Penjualan',
              position: 'KREDIT',
              amount: amount,
              description: `Penjualan POS via ${t.payment_method} - ${refStr}`,
              status: 'COMMITTED'
            });

            // 3. Debet HPP
            generatedJournals.push({
              id: `J-TRX-${journalCounter++}`,
              date: dateStr,
              ref: refStr,
              account: '501 - Harga Pokok Penjualan (HPP)',
              position: 'DEBET',
              amount: hpp,
              description: `HPP Penjualan POS - ${refStr}`,
              status: 'COMMITTED'
            });

            // 4. Kredit Persediaan Suku Cadang
            generatedJournals.push({
              id: `J-TRX-${journalCounter++}`,
              date: dateStr,
              ref: refStr,
              account: '102 - Persediaan Suku Cadang',
              position: 'KREDIT',
              amount: hpp,
              description: `Persediaan keluar POS - ${refStr}`,
              status: 'COMMITTED'
            });
          });

          // Combine expense entries and dynamically generated transaction entries
          const allJournals = [...expenseJournals, ...generatedJournals];
          setJournals(allJournals);
          localStorage.setItem('siddeeq_journals', JSON.stringify(allJournals));
          return;
        }

        const response = await fetch('/api/v1/sync');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.journals) {
            const formatted = data.journals.map((j: any) => ({
              id: `J-${j.id}`,
              date: j.journal_date.split('T')[0],
              ref: j.sales_id ? `TX-${j.sales_id}` : 'EXP-MOCK',
              account: `${j.account_code} - ${
                j.account_code === '101.01' ? 'Kas Utama (Tunai)' : 
                j.account_code === '101.02' ? 'Bank Syariah (Transfer)' :
                j.account_code === '101.03' ? 'E-Wallet Clearing (QRIS)' :
                j.account_code === '103' ? 'Piutang Murabahah' :
                j.account_code === '102' ? 'Persediaan Suku Cadang' :
                j.account_code === '401' ? 'Pendapatan Penjualan' :
                j.account_code === '501' ? 'Harga Pokok Penjualan (HPP)' : 'Akun Keuangan'
              }`,
              position: j.position,
              amount: j.amount,
              description: j.sales_id ? `Penerimaan penjualan via POS` : `Pengeluaran Operasional`,
              status: 'COMMITTED'
            }));
            setJournals(formatted);
            localStorage.setItem('siddeeq_journals', JSON.stringify(formatted));
            return;
          }
        }
      } catch (err) {
        console.warn('Backend sync failed, falling back to localStorage journals cache:', err);
      }

      // Fallback
      const saved = localStorage.getItem('siddeeq_journals');
      if (saved) {
        try {
          setJournals(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse journals from localStorage", e);
        }
      } else {
        localStorage.setItem('siddeeq_journals', JSON.stringify(INITIAL_JOURNALS));
      }
    }

    syncJournals();
  }, []);

  // Dynamic Laba Rugi calculations
  const totalRevenue = journals
    .filter(j => j.account.startsWith('401') && j.status === 'COMMITTED' && j.position === 'KREDIT')
    .reduce((sum, j) => sum + j.amount, 0);

  const totalHpp = journals
    .filter(j => j.account.startsWith('501') && j.status === 'COMMITTED' && j.position === 'DEBET')
    .reduce((sum, j) => sum + j.amount, 0);

  const grossProfit = totalRevenue - totalHpp;

  const totalExpenses = journals
    .filter(j => j.account.startsWith('5') && !j.account.startsWith('501') && j.status !== 'VOID' && j.position === 'DEBET')
    .reduce((sum, j) => sum + j.amount, 0);

  const netProfitBeforeZakat = grossProfit - totalExpenses;
  const zakatMal = netProfitBeforeZakat > 0 ? netProfitBeforeZakat * 0.025 : 0;
  const netProfitAfterZakat = netProfitBeforeZakat - zakatMal;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || !receiptDate) return;

    setIsSubmitting(true);

    // Simulate database write
    setTimeout(() => {
      const coaObj = coa.find(c => c.code === selectedCoa);
      const desc = `Pengeluaran ${coaObj?.name || 'Operasional'}`;
      
      const saved = localStorage.getItem('siddeeq_journals');
      const currentJournals = saved ? JSON.parse(saved) : journals;

      const newDebet: JournalEntry = {
        id: `J-00${currentJournals.length + 1}`,
        date: receiptDate,
        ref: `EXP-00${Math.floor(Math.random() * 90) + 10}`,
        account: `${selectedCoa} - ${coaObj?.name}`,
        position: 'DEBET',
        amount: parseFloat(nominal),
        description: desc,
        status: 'PENDING_APPROVAL',
      };

      const newKredit: JournalEntry = {
        id: `J-00${currentJournals.length + 2}`,
        date: receiptDate,
        ref: newDebet.ref,
        account: '101 - Kas Utama (Tunai)',
        position: 'KREDIT',
        amount: parseFloat(nominal),
        description: desc,
        status: 'PENDING_APPROVAL',
      };

      const updated = [...currentJournals, newDebet, newKredit];
      setJournals(updated);
      localStorage.setItem('siddeeq_journals', JSON.stringify(updated));

      setNominal('');
      setReceiptDate('');
      setOcrStatus(null);
      setIsSubmitting(false);
    }, 1500); // 1.5s delay to show spinner & disabled states
  };

  const handleOcrSimulate = () => {
    setOcrStatus('Membaca struk nota menggunakan AI...');
    setTimeout(() => {
      // Mocking successful AI extraction
      setNominal('250000');
      setReceiptDate('2026-05-22');
      setSelectedCoa('502'); // Listrik
      setOcrStatus('Berhasil! Nominal Rp 250.000 terdeteksi untuk Listrik.');
    }, 2000);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'COMMITTED':
        return 'status-committed';
      case 'PENDING_APPROVAL':
        return 'status-pending';
      case 'VOID':
        return 'status-void';
      default:
        return '';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '260px' }}>
        <TopHeader title="Akuntansi Syariah & Jurnal Otomatis" />
        
        <div style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--spacing-6)' }}>
            
            {/* Left Column: Ledger / Jurnal List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
              <Card>
                <CardHeader 
                  title="Buku Jurnal Umum (Immutable Ledger)" 
                  description="Catatan akuntansi double-entry yang dihasilkan secara otomatis" 
                />
                <CardBody style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>ID Jurnal</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>Tanggal</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>Akun CoA</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600 }}>Posisi</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'right' }}>Jumlah (Rp)</th>
                          <th style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {journals.map((j) => (
                          <tr key={j.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {j.id}
                            </td>
                            <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                              {j.date}
                            </td>
                            <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 500 }}>
                              {j.account}
                            </td>
                            <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: 'var(--spacing-1) var(--spacing-2)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: j.position === 'DEBET' ? 'rgba(28, 77, 50, 0.08)' : 'rgba(234, 168, 18, 0.08)',
                                color: j.position === 'DEBET' ? 'var(--color-primary)' : 'var(--color-secondary)'
                              }}>
                                {j.position}
                              </span>
                            </td>
                            <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'right', fontWeight: 600 }}>
                              {j.amount.toLocaleString('id-ID')}
                            </td>
                            <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'center' }}>
                              <span className={`status-badge ${getStatusClass(j.status)}`}>
                                {j.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>

              {/* Laporan Laba Rugi Syariah */}
              <Card>
                <CardHeader 
                  title="Simulasi Laporan Laba Rugi Syariah" 
                  description="Dilengkapi alokasi Zakat Mal 2.5% secara otomatis" 
                />
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-2)' }}>
                      <span style={{ fontWeight: 500 }}>Total Pendapatan Penjualan</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Rp {totalRevenue.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-2)' }}>
                      <span>Harga Pokok Penjualan (HPP)</span>
                      <span style={{ color: 'var(--color-danger)' }}>- Rp {totalHpp.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-2)', fontWeight: 600 }}>
                      <span>Laba Kotor</span>
                      <span>Rp {grossProfit.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                      <span>Total Biaya Operasional</span>
                      <span style={{ color: 'var(--color-danger)' }}>- Rp {totalExpenses.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-2)', fontWeight: 700 }}>
                      <span>Laba Bersih Sebelum Zakat</span>
                      <span>Rp {netProfitBeforeZakat.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--spacing-2)', borderBottom: '2px solid var(--color-secondary)', color: 'var(--color-secondary-hover)', fontWeight: 600 }}>
                      <span>Alokasi Zakat Mal (2,5%) ⚑</span>
                      <span>- Rp {zakatMal.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--spacing-2)', fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                      <span>Laba Bersih Setelah Zakat</span>
                      <span>Rp {netProfitAfterZakat.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Right Column: Expense Form */}
            <div>
              <Card>
                <CardHeader 
                  title="Formulir Biaya (Expense Form)" 
                  description="Catat pengeluaran operasional non-penjualan" 
                />
                <form onSubmit={handleAddExpense}>
                  <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        Pilih Kode Akun Biaya (CoA)
                      </label>
                      <select 
                        value={selectedCoa}
                        onChange={(e) => setSelectedCoa(e.target.value)}
                        style={{
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          fontSize: '0.875rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          backgroundColor: '#FFFFFF',
                          outline: 'none'
                        }}
                      >
                        {coa.filter(c => c.type === 'BIAYA').map(c => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Input 
                      label="Nominal Biaya (Rp)" 
                      type="number" 
                      placeholder="Masukkan Nominal" 
                      value={nominal}
                      onChange={(e) => setNominal(e.target.value)}
                      required
                    />

                    <Input 
                      label="Tanggal Kwitansi" 
                      type="date" 
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      required
                    />

                    {/* Drag and Drop Zone for OCR */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        Unggah Bukti Struk/Nota (OCR AI Vision)
                      </label>
                      <div 
                        onClick={handleOcrSimulate}
                        style={{
                          border: '2px dashed var(--border-color)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 'var(--spacing-6)',
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: 'var(--bg-main)',
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.backgroundColor = 'rgba(28, 77, 50, 0.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                        }}
                      >
                        <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-2)' }}>📸</div>
                        <span style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                          Klik untuk mensimulasikan OCR Vision Nota
                        </span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--spacing-1)' }}>
                          Format: PNG, JPG, PDF (Max. 5MB)
                        </p>
                      </div>
                      {ocrStatus && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: ocrStatus.includes('Gagal') ? 'var(--color-void-text)' : 'var(--color-primary)',
                          padding: 'var(--spacing-2)',
                          backgroundColor: ocrStatus.includes('Gagal') ? 'var(--color-void-bg)' : 'var(--color-committed-bg)',
                          borderRadius: 'var(--radius-sm)',
                          marginTop: 'var(--spacing-1)',
                          fontWeight: 500
                        }}>
                          {ocrStatus}
                        </div>
                      )}
                    </div>

                  </CardBody>
                  <CardFooter style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outline" 
                      type="button" 
                      disabled={isSubmitting}
                      onClick={() => {
                        setNominal('');
                        setReceiptDate('');
                        setOcrStatus(null);
                      }}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          <span className="spinner" style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTopColor: '#FFFFFF',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite'
                          }}></span>
                          Menyimpan...
                        </div>
                      ) : 'Simpan Biaya'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>

          </div>
        </div>

        {/* Global spinner animation keyframes definition */}
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    </div>
  );
}
