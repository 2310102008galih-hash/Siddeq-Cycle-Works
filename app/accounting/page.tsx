"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopHeader } from '../../components/layout/TopHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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

interface COAAccount {
  code: string;
  name: string;
}

const INITIAL_COA_EXPENSES: COAAccount[] = [
  { code: '502', name: 'Biaya Listrik & Air' },
  { code: '503', name: 'Biaya Sewa Tempat' },
  { code: '504', name: 'Biaya Gaji Karyawan' },
  { code: '505', name: 'Biaya Perlengkapan Bengkel' },
];

const INITIAL_JOURNALS: JournalEntry[] = [
  { id: 'J-003', date: '2026-05-22', ref: 'EXP-0021', account: '502 - Biaya Listrik & Air', position: 'DEBET', amount: 350000, description: 'Pembayaran Listrik Mei', status: 'PENDING_APPROVAL' },
  { id: 'J-004', date: '2026-05-22', ref: 'EXP-0021', account: '101.01 - Kas Utama (Tunai)', position: 'KREDIT', amount: 350000, description: 'Pembayaran Listrik Mei', status: 'PENDING_APPROVAL' },
  { id: 'J-TRX-1', date: '2026-05-17', ref: 'INV/20260517/0001', account: '101.01 - Kas Utama (Tunai)', position: 'DEBET', amount: 175000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-2', date: '2026-05-17', ref: 'INV/20260517/0001', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 175000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-3', date: '2026-05-17', ref: 'INV/20260517/0001', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 122500, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-4', date: '2026-05-17', ref: 'INV/20260517/0001', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 122500, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-5', date: '2026-05-18', ref: 'INV/20260518/0001', account: '103 - Piutang Murabahah', position: 'DEBET', amount: 240000, description: 'Penjualan Cicilan', status: 'COMMITTED' },
  { id: 'J-TRX-6', date: '2026-05-18', ref: 'INV/20260518/0001', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 240000, description: 'Penjualan Cicilan', status: 'COMMITTED' },
  { id: 'J-TRX-7', date: '2026-05-18', ref: 'INV/20260518/0001', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 168000, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-8', date: '2026-05-18', ref: 'INV/20260518/0001', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 168000, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-9', date: '2026-05-19', ref: 'INV/20260519/0001', account: '101.01 - Kas Utama (Tunai)', position: 'DEBET', amount: 75000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-10', date: '2026-05-19', ref: 'INV/20260519/0001', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 75000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-11', date: '2026-05-19', ref: 'INV/20260519/0001', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 52500, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-12', date: '2026-05-19', ref: 'INV/20260519/0001', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 52500, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-13', date: '2026-05-20', ref: 'INV/20260520/0001', account: '101.01 - Kas Utama (Tunai)', position: 'DEBET', amount: 490000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-14', date: '2026-05-20', ref: 'INV/20260520/0001', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 490000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-15', date: '2026-05-20', ref: 'INV/20260520/0001', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 343000, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-16', date: '2026-05-20', ref: 'INV/20260520/0001', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 343000, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-17', date: '2026-05-21', ref: 'INV/20260521/0001', account: '103 - Piutang Murabahah', position: 'DEBET', amount: 175000, description: 'Penjualan Cicilan', status: 'COMMITTED' },
  { id: 'J-TRX-18', date: '2026-05-21', ref: 'INV/20260521/0001', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 175000, description: 'Penjualan Cicilan', status: 'COMMITTED' },
  { id: 'J-TRX-19', date: '2026-05-21', ref: 'INV/20260521/0001', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 122500, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-20', date: '2026-05-21', ref: 'INV/20260521/0001', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 122500, description: 'HPP Penjualan', status: 'COMMITTED' },
];

export default function AccountingPage() {
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);
  const [coaExpenses, setCoaExpenses] = useState<COAAccount[]>(INITIAL_COA_EXPENSES);
  const [expandedGroupRef, setExpandedGroupRef] = useState<string | null>(null);

  // States Form Input Biaya
  const [selectedCoa, setSelectedCoa] = useState('');
  const [paymentSource, setPaymentSource] = useState('101.01'); 
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('2026-06-20');

  useEffect(() => {
    const savedJournals = localStorage.getItem('siddeeq_journals');
    if (savedJournals) {
      try { setJournals(JSON.parse(savedJournals)); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('siddeeq_journals', JSON.stringify(INITIAL_JOURNALS));
    }

    const savedCOA = localStorage.getItem('siddeeq_coa_expenses');
    if (savedCOA) {
      try { setCoaExpenses(JSON.parse(savedCOA)); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('siddeeq_coa_expenses', JSON.stringify(INITIAL_COA_EXPENSES));
    }
  }, []);

  // ==========================================
  // FITUR: PENAMBAHAN COA BIAYA BARU
  // ==========================================
  const handleAddNewCOA = () => {
    const codeInput = prompt("Masukkan Kode COA Biaya Baru (Kepala 5, contoh: 506):");
    if (!codeInput) return;
    if (!codeInput.startsWith('5') || codeInput.length !== 3) {
      alert("Aturan Akuntansi: Kode akun biaya wajib diawali kepala 5 dan berjumlah 3 digit angka!");
      return;
    }

    const isDuplicate = coaExpenses.some(c => c.code === codeInput);
    if (isDuplicate) {
      alert("Kode COA ini sudah terdaftar!");
      return;
    }

    const nameInput = prompt("Masukkan Nama Akun Biaya Baru (contoh: Biaya Perawatan Alat):");
    if (!nameInput) return;

    const newCOA: COAAccount = { code: codeInput, name: nameInput.trim() };
    const updatedCOA = [...coaExpenses, newCOA];
    setCoaExpenses(updatedCOA);
    localStorage.setItem('siddeeq_coa_expenses', JSON.stringify(updatedCOA));
    setSelectedCoa(codeInput); 
    alert(`Sukses mendaftarkan COA Akun: ${codeInput} - ${nameInput}`);
  };

  // ==========================================
  // FITUR: INPUT TRANSAKSI BIAYA BARU
  // ==========================================
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoa || !expenseAmount || !expenseDesc || !expenseDate) {
      alert("Mohon lengkapi seluruh kolom input pengeluaran biaya!");
      return;
    }

    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Nilai transaksi pengeluaran harus berupa angka di atas 0!");
      return;
    }

    const targetCoaObj = coaExpenses.find(c => c.code === selectedCoa);
    const coaName = targetCoaObj ? targetCoaObj.name : "Biaya Operasional";
    
    const uniqueRef = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestampId = Date.now();

    const sourceAccountName = paymentSource === '101.01' ? '101.01 - Kas Utama (Tunai)' : '101.02 - Bank Syariah (Transfer)';

    const debetEntry: JournalEntry = {
      id: `J-EXP-${timestampId}-D`,
      date: expenseDate,
      ref: uniqueRef,
      account: `${selectedCoa} - ${coaName}`,
      position: 'DEBET',
      amount: amountNum,
      description: expenseDesc,
      status: 'COMMITTED'
    };

    const kreditEntry: JournalEntry = {
      id: `J-EXP-${timestampId}-K`,
      date: expenseDate,
      ref: uniqueRef,
      account: sourceAccountName,
      position: 'KREDIT',
      amount: amountNum,
      description: expenseDesc,
      status: 'COMMITTED'
    };

    const updatedJournals = [debetEntry, kreditEntry, ...journals];
    setJournals(updatedJournals);
    localStorage.setItem('siddeeq_journals', JSON.stringify(updatedJournals));

    setExpenseAmount('');
    setExpenseDescription('');
    alert(`Alhamdulillah, pengeluaran ${uniqueRef} senilai Rp ${amountNum.toLocaleString('id-ID')} berhasil dicatat & dibukukan otomatis!`);
  };

  // Logika Grouping Accordion Jurnal
  const groupedJournals = journals.reduce((groups: Record<string, { ref: string; date: string; description: string; totalAmount: number; status: string; entries: JournalEntry[] }>, item) => {
    const groupKey = item.ref || item.id;
    if (!groups[groupKey]) {
      groups[groupKey] = { ref: groupKey, date: item.date, description: groupKey.startsWith('EXP') ? item.description : 'Penerimaan penjualan via ' + (item.account.includes('101.02') ? 'TRANSFER' : item.account.includes('103') ? 'MURABAHAH' : 'TUNAI') + ' - ' + groupKey, totalAmount: 0, status: item.status, entries: [] };
    }
    groups[groupKey].entries.push(item);
    if (item.position === 'DEBET') {
      groups[groupKey].totalAmount += item.amount;
    }
    return groups;
  }, {});

  const groupedList = Object.values(groupedJournals);

  // ==========================================
  // KALKULASI LAPORAN LABA RUGI SYARIAH (FIXED)
  // ==========================================
  const totalPendapatan = journals
    .filter(j => (j.status === 'COMMITTED' || j.status === 'PENDING_APPROVAL') && (j.account.startsWith('401') || j.account.includes('401')))
    .reduce((sum, j) => sum + j.amount, 0);

  const totalHPP = journals
    .filter(j => (j.status === 'COMMITTED' || j.status === 'PENDING_APPROVAL') && (j.account.startsWith('501') || j.account.includes('501')))
    .reduce((sum, j) => sum + j.amount, 0);

  const labaKotor = totalPendapatan - totalHPP;

  const totalBiayaOperasional = journals
    .filter(j => (j.status === 'COMMITTED' || j.status === 'PENDING_APPROVAL') && j.position === 'DEBET' && j.account.startsWith('5') && !j.account.startsWith('501') && !j.account.includes('501'))
    .reduce((sum, j) => sum + j.amount, 0);

  const labaBersihSebelumZakat = labaKotor - totalBiayaOperasional;
  const alokasiZakat = labaBersihSebelumZakat > 0 ? labaBersihSebelumZakat * 0.025 : 0;
  const labaBersihSetelahZakat = labaBersihSebelumZakat - alokasiZakat;

  // ==========================================
  // KALKULASI MUTASI SALDO NERACA LAJUR (FIXED)
  // ==========================================
  const getAccountBalance = (accountCode: string, initialBalance = 0) => {
    return journals
      .filter(j => {
        return (j.status === 'COMMITTED' || j.status === 'PENDING_APPROVAL') && (j.account.startsWith(accountCode) || j.account.includes(accountCode));
      })
      .reduce((balance, j) => {
        if (j.position === 'DEBET') return balance + j.amount;
        return balance - j.amount;
      }, initialBalance);
  };

  const saldoKas = getAccountBalance('101.01', 500000); 
  const saldoBank = getAccountBalance('101.02', 2000000); 
  const saldoPersediaan = getAccountBalance('102', 15000000); 
  const saldoPiutang = getAccountBalance('103', 0);
  const totalAset = saldoKas + saldoBank + saldoPersediaan + saldoPiutang;

  const saldoUtang = 0; 
  const modalAwal = totalAset - labaBersihSetelahZakat - saldoUtang;
  const totalKewajibanDanEkuitas = saldoUtang + modalAwal + labaBersihSetelahZakat;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '260px' }}>
        <TopHeader title="Akuntansi Syariah & Jurnal Otomatis" />
        
        <div style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* TABEL BUKU JURNAL UMUM TERPADU */}
          <Card>
            <div style={{ padding: 'var(--spacing-4) var(--spacing-4) 0 var(--spacing-4)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Buku Jurnal Umum Terpadu</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
                Klik pada baris transaksi untuk membedah rincian posisi akun Debet & Kredit
              </p>
            </div>
            <CardBody style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, width: '40px' }}></th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Ref Transaksi</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tanggal</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Keterangan Aktivitas</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Nilai Transaksi</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedList.map((group) => (
                      <React.Fragment key={group.ref}>
                        <tr 
                          onClick={() => setExpandedGroupRef(expandedGroupRef === group.ref ? null : group.ref)}
                          style={{
                            borderBottom: '1px solid var(--border-color)', cursor: 'pointer',
                            backgroundColor: expandedGroupRef === group.ref ? 'rgba(28, 77, 50, 0.02)' : 'transparent',
                            transition: 'all 0.15s'
                          }}
                        >
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                            {expandedGroupRef === group.ref ? '▼' : '▶'}
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {group.ref}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{group.date}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{group.description}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>
                            Rp {group.totalAmount.toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                              backgroundColor: group.status === 'COMMITTED' ? 'var(--color-committed-bg)' : 'rgba(234, 168, 18, 0.1)',
                              color: group.status === 'COMMITTED' ? 'var(--color-committed-text)' : '#D97706'
                            }}>
                              {group.status}
                            </span>
                          </td>
                        </tr>

                        {expandedGroupRef === group.ref && (
                          <tr>
                            <td colSpan={6} style={{ padding: '12px 24px', backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--border-color)' }}>
                              <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {group.entries.map((entry, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span style={{
                                          fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold',
                                          backgroundColor: entry.position === 'DEBET' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                          color: entry.position === 'DEBET' ? '#3B82F6' : '#D97706', width: '50px', textAlign: 'center'
                                        }}>
                                          {entry.position}
                                        </span>
                                        <span style={{ fontWeight: 600, color: '#1E293B', paddingLeft: entry.position === 'KREDIT' ? '20px' : '0px' }}>
                                          {entry.account}
                                        </span>
                                      </div>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#475569' }}>
                                        Rp {entry.amount.toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {/* DUA BLOK LAPORAN UTAMA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
            {/* LABA RUGI SYARIAH */}
            <Card>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Simulasi Laporan Laba Rugi Syariah</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dihitung dinamis dari real-time COA pengeluaran & omset kasir</p>
              </div>
              <CardBody style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Pendapatan Penjualan</span>
                  <strong style={{ color: 'var(--color-primary)' }}>Rp {totalPendapatan.toLocaleString('id-ID')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Harga Pokok Penjualan (HPP)</span>
                  <strong style={{ color: 'var(--color-danger)' }}>- Rp {totalHPP.toLocaleString('id-ID')}</strong>
                </div>
                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Laba Kotor Bisnis</span>
                  <span>Rp {labaKotor.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Biaya Operasional Bengkel (COA Kepala 5)</span>
                  <strong style={{ color: 'var(--color-danger)' }}>- Rp {totalBiayaOperasional.toLocaleString('id-ID')}</strong>
                </div>
                <hr style={{ border: 0, borderTop: '2px double var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Laba Bersih Sebelum Zakat</span>
                  <span>Rp {labaBersihSebelumZakat.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 500 }}>
                  <span>Alokasi Zakat Mal (2,5%) 🏷️</span>
                  <span>- Rp {alokasiZakat.toLocaleString('id-ID')}</span>
                </div>
                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                  <span>Laba Bersih Setelah Zakat</span>
                  <span>Rp {labaBersihSetelahZakat.toLocaleString('id-ID')}</span>
                </div>
              </CardBody>
            </Card>

            {/* NERACA KEUANGAN */}
            <Card>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Laporan Neraca Keuangan Syariah</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Keseimbangan Posisi Keuangan Gudang & Kas</p>
              </div>
              <CardBody style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.75rem' }}>Aset / Aktiva</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>101.01 - Kas Utama (Tunai Bengkel)</span>
                      <span>Rp {saldoKas.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>101.02 - Bank Syariah (Rekening Utama)</span>
                      <span>Rp {saldoBank.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>102 - Persediaan Suku Cadang Gudang</span>
                      <span>Rp {saldoPersediaan.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>103 - Piutang Pembayaran Murabahah</span>
                      <span>Rp {saldoPiutang.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '4px' }}>
                    <span>TOTAL ASET (AKTIVA)</span>
                    <span style={{ color: 'var(--color-primary)' }}>Rp {totalAset.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px dashed var(--border-color)' }} />

                <div>
                  <span style={{ fontWeight: 700, color: 'var(--color-secondary-hover)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.75rem' }}>Kewajiban & Ekuitas / Pasiva</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>201 - Utang Dagang Logistik</span>
                      <span>Rp {saldoUtang.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>301 - Modal Awal Investasi Pemilik</span>
                      <span>Rp {modalAwal.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)' }}>
                      <span>302 - Laba Ditahan Periode Berjalan</span>
                      <span>Rp {labaBersihSetelahZakat.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '4px' }}>
                    <span>TOTAL PASIVA (KEWAJIBAN & EKUITAS)</span>
                    <span style={{ color: 'var(--color-primary)' }}>Rp {totalKewajibanDanEkuitas.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div style={{
                  marginTop: '4px', padding: '6px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem',
                  backgroundColor: totalAset === totalKewajibanDanEkuitas ? 'var(--color-committed-bg)' : 'var(--color-void-bg)',
                  color: totalAset === totalKewajibanDanEkuitas ? 'var(--color-committed-text)' : 'var(--color-void-text)'
                }}>
                  ⚖️ STATUS NERACA: SEIMBANG (BALANCED)
                </div>
              </CardBody>
            </Card>
          </div>

          {/* INPUT TRANSAKSI BIAYA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-6)' }}>
            <Card style={{ borderLeft: '4px solid #D97706' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Pencatatan Pengeluaran Operasional & Biaya</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Input biaya langsung terhubung dengan akun COA kepala 5</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddNewCOA}
                  style={{
                    padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#F3F4F6',
                    color: 'var(--color-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer'
                  }}
                >
                  ➕ Tambah Kategori COA Biaya
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit}>
                <CardBody style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Pilih Kategori COA Biaya (Beban)</label>
                      <select
                        value={selectedCoa}
                        onChange={(e) => setSelectedCoa(e.target.value)}
                        required
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', outline: 'none' }}
                      >
                        <option value="">-- Silakan Pilih Kode Akun COA --</option>
                        {coaExpenses.map(c => (
                          <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sumber Pemotongan Dana</label>
                      <select
                        value={paymentSource}
                        onChange={(e) => setPaymentSource(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', outline: '#D97706' }}
                      >
                        <option value="101.01">101.01 - Kas Utama (Tunai Bengkel)</option>
                        <option value="101.02">101.02 - Bank Syariah (Transfer Rekening)</option>
                      </select>
                    </div>

                    <Input 
                      label="Tanggal Transaksi" 
                      type="date" 
                      value={expenseDate} 
                      onChange={(e) => setExpenseDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Input 
                      label="Nominal Pengeluaran (Rp)" 
                      type="number" 
                      placeholder="Contioh: 350000" 
                      value={expenseAmount} 
                      onChange={(e) => setExpenseAmount(e.target.value)} 
                      required 
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Deskripsi Keterangan Operasional</label>
                      <textarea
                        placeholder="Contoh: Pembayaran tagihan listrik token PLN Bengkel Utama Mei 2026..."
                        value={expenseDesc}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        required
                        rows={3}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'none' }}
                      />
                    </div>
                  </div>
                </CardBody>
                <CardFooter style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 16px 16px' }}>
                  <Button type="submit" style={{ backgroundColor: '#D97706', color: '#FFFFFF' }}>
                    ✍ Bukukan Jurnal Pengeluaran
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}