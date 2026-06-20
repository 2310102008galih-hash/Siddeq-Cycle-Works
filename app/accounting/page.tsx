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

const INITIAL_JOURNALS: JournalEntry[] = [];

export default function AccountingPage() {
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);
  const [coaExpenses, setCoaExpenses] = useState<COAAccount[]>(INITIAL_COA_EXPENSES);
  const [expandedGroupRef, setExpandedGroupRef] = useState<string | null>(null);

  const [selectedCoa, setSelectedCoa] = useState('');
  const [paymentSource, setPaymentSource] = useState('101.01 - Kas Utama (Tunai)'); 
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

  const handleAddNewCOA = () => {
    const codeInput = prompt("Masukkan Kode COA Biaya Baru (Kepala 5, contoh: 506):");
    if (!codeInput || !codeInput.startsWith('5') || codeInput.length !== 3) {
      alert("Kode akun biaya wajib diawali kepala 5 dan berjumlah 3 digit angka!");
      return;
    }
    const nameInput = prompt("Masukkan Nama Akun Biaya Baru:");
    if (!nameInput) return;

    const updatedCOA = [...coaExpenses, { code: codeInput, name: nameInput.trim() }];
    setCoaExpenses(updatedCOA);
    localStorage.setItem('siddeeq_coa_expenses', JSON.stringify(updatedCOA));
    setSelectedCoa(codeInput); 
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoa || !expenseAmount || !expenseDesc || !expenseDate) return;

    const amountNum = parseFloat(expenseAmount);
    const targetCoaObj = coaExpenses.find(c => c.code === selectedCoa);
    const coaName = targetCoaObj ? targetCoaObj.name : "Biaya Operasional";
    const uniqueRef = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;

    const debetEntry: JournalEntry = { id: `J-EXP-${Date.now()}-D`, date: expenseDate, ref: uniqueRef, account: `${selectedCoa} - ${coaName}`, position: 'DEBET', amount: amountNum, description: expenseDesc, status: 'COMMITTED' };
    const kreditEntry: JournalEntry = { id: `J-EXP-${Date.now()}-K`, date: expenseDate, ref: uniqueRef, account: paymentSource, position: 'KREDIT', amount: amountNum, description: expenseDesc, status: 'COMMITTED' };

    const updatedJournals = [debetEntry, kreditEntry, ...journals];
    setJournals(updatedJournals);
    localStorage.setItem('siddeeq_journals', JSON.stringify(updatedJournals));
    setExpenseAmount('');
    setExpenseDescription('');
    alert(`Pengeluaran ${uniqueRef} berhasil dibukukan!`);
  };

  const groupedJournals = journals.reduce((groups: Record<string, { ref: string; date: string; description: string; totalAmount: number; status: string; entries: JournalEntry[] }>, item) => {
    const groupKey = item.ref || item.id;
    if (!groups[groupKey]) {
      groups[groupKey] = { ref: groupKey, date: item.date, description: groupKey.startsWith('EXP') ? item.description : 'Penerimaan penjualan - ' + groupKey, totalAmount: 0, status: item.status, entries: [] };
    }
    groups[groupKey].entries.push(item);
    if (item.position === 'DEBET') {
      groups[groupKey].totalAmount += item.amount;
    }
    return groups;
  }, {});

  const groupedList = Object.values(groupedJournals);

  // Perhitungan Laba Rugi Berdasarkan COA Bersih POS Kasir
  const totalPendapatan = journals
    .filter(j => (j.status === 'COMMITTED' || j.status === 'PENDING_APPROVAL') && j.account.startsWith('401'))
    .reduce((sum, j) => sum + j.amount, 0);

  const totalHPP = journals
    .filter(j => (j.status === 'COMMITTED' || j.status === 'PENDING_APPROVAL') && j.account.startsWith('501'))
    .reduce((sum, j) => sum + j.amount, 0);

  const labaKotor = totalPendapatan - totalHPP;

  const totalBiayaOperasional = journals
    .filter(j => (j.status === 'COMMITTED' || j.status === 'PENDING_APPROVAL') && j.position === 'DEBET' && j.account.startsWith('5') && !j.account.startsWith('501'))
    .reduce((sum, j) => sum + j.amount, 0);

  const labaBersihSebelumZakat = labaKotor - totalBiayaOperasional;
  const alokasiZakat = labaBersihSebelumZakat > 0 ? labaBersihSebelumZakat * 0.025 : 0;
  const labaBersihSetelahZakat = labaBersihSebelumZakat - alokasiZakat;

  // Perhitungan Saldo Neraca Mutlak Berdasarkan COA Depan
  const getAccountBalance = (accountCode: string, initialBalance = 0) => {
    return journals
      .filter(j => (j.status === 'COMMITTED' || j.status === 'PENDING_APPROVAL') && j.account.startsWith(accountCode))
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
          
          {/* TABEL BUKU JURNAL */}
          <Card>
            <div style={{ padding: 'var(--spacing-4) var(--spacing-4) 0 var(--spacing-4)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Buku Jurnal Umum Terpadu</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Log transaksi otomatis terintegrasi penuh dari modul POS Kasir Utama</p>
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
                    {groupedList.length > 0 ? (
                      groupedList.map((group) => (
                        <React.Fragment key={group.ref}>
                          <tr onClick={() => setExpandedGroupRef(expandedGroupRef === group.ref ? null : group.ref)} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                            <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>{expandedGroupRef === group.ref ? '▼' : '▶'}</td>
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{group.ref}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{group.date}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 500 }}>{group.description}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>Rp {group.totalAmount.toLocaleString('id-ID')}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, backgroundColor: group.status === 'COMMITTED' ? 'var(--color-committed-bg)' : 'rgba(234, 168, 18, 0.1)', color: group.status === 'COMMITTED' ? 'var(--color-committed-text)' : '#D97706' }}>{group.status}</span>
                            </td>
                          </tr>
                          {expandedGroupRef === group.ref && (
                            <tr>
                              <td colSpan={6} style={{ padding: '12px 24px', backgroundColor: '#F8F9FA' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '16px' }}>
                                  {group.entries.map((entry, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                      <div>
                                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: entry.position === 'DEBET' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: entry.position === 'DEBET' ? '#3B82F6' : '#D97706', marginRight: '8px' }}>{entry.position}</span>
                                        <span style={{ fontWeight: 600, paddingLeft: entry.position === 'KREDIT' ? '20px' : '0' }}>{entry.account}</span>
                                      </div>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>Rp {entry.amount.toLocaleString('id-ID')}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Belum ada data jurnal berjalan. Silakan lakukan transaksi di POS Kasir.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {/* SIMULASI LABA RUGI & NERACA LAJUR */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
            <Card>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Simulasi Laporan Laba Rugi Syariah</h3>
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
                  <span>Total Biaya Operasional Bengkel</span>
                  <strong style={{ color: 'var(--color-danger)' }}>- Rp {totalBiayaOperasional.toLocaleString('id-ID')}</strong>
                </div>
                <hr style={{ border: 0, borderTop: '2px double var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Laba Bersih Sebelum Zakat</span>
                  <span>Rp {labaBersihSebelumZakat.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706' }}>
                  <span>Alokasi Zakat Mal (2,5%) 🏷️</span>
                  <span>- Rp {alokasiZakat.toLocaleString('id-ID')}</span>
                </div>
                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--color-primary)' }}>
                  <span>Laba Bersih Setelah Zakat</span>
                  <span>Rp {labaBersihSetelahZakat.toLocaleString('id-ID')}</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Laporan Neraca Keuangan Syariah</h3>
              </div>
              <CardBody style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'block', fontSize: '0.75rem' }}>ASET / AKTIVA</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>101.01 - Kas Utama (Tunai)</span>
                      <span>Rp {saldoKas.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>101.02 - Bank Syariah (Transfer)</span>
                      <span>Rp {saldoBank.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>102 - Persediaan Suku Cadang</span>
                      <span>Rp {saldoPersediaan.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>103 - Piutang Murabahah</span>
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
                  <span style={{ fontWeight: 700, color: 'var(--color-secondary-hover)', display: 'block', fontSize: '0.75rem' }}>KEWAJIBAN & EKUITAS / PASIVA</span>
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

                <div style={{ marginTop: '4px', padding: '6px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem', backgroundColor: 'var(--color-committed-bg)', color: 'var(--color-committed-text)' }}>
                  ⚖️ STATUS NERACA: SEIMBANG (BALANCED)
                </div>
              </CardBody>
            </Card>
          </div>

          {/* INPUT BIAYA OPERASIONAL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-6)' }}>
            <Card style={{ borderLeft: '4px solid #D97706' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Pencatatan Pengeluaran Operasional & Biaya</h3>
                </div>
                <button type="button" onClick={handleAddNewCOA} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#F3F4F6', color: 'var(--color-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>➕ Tambah Kategori COA Biaya</button>
              </div>
              <form onSubmit={handleExpenseSubmit}>
                <CardBody style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <select value={selectedCoa} onChange={(e) => setSelectedCoa(e.target.value)} required style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <option value="">-- Pilih Kategori COA Biaya --</option>
                      {coaExpenses.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                    <select value={paymentSource} onChange={(e) => setPaymentSource(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <option value="101.01 - Kas Utama (Tunai)">101.01 - Kas Utama (Tunai)</option>
                      <option value="101.02 - Bank Syariah (Transfer)">101.02 - Bank Syariah (Transfer)</option>
                    </select>
                    <Input label="Tanggal" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Input label="Nominal (Rp)" type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required />
                    <textarea placeholder="Deskripsi Keterangan..." value={expenseDesc} onChange={(e) => setExpenseDescription(e.target.value)} required rows={3} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'none' }} />
                  </div>
                </CardBody>
                <CardFooter style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 16px 16px' }}>
                  <Button type="submit" style={{ backgroundColor: '#D97706', color: '#FFFFFF' }}>✍ Bukukan Jurnal Pengeluaran</Button>
                </CardFooter>
              </form>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}