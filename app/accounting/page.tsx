"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopHeader } from '../../components/layout/TopHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

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
  { id: 'J-TRX-28', date: '2026-05-23', ref: 'INV/20260523/1001', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 122500, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-29', date: '2026-06-05', ref: 'INV/20260605/1002', account: '101.02 - Bank Syariah (Transfer)', position: 'DEBET', amount: 350000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-30', date: '2026-06-05', ref: 'INV/20260605/1002', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 350000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-31', date: '2026-06-05', ref: 'INV/20260605/1002', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 245000, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-32', date: '2026-06-05', ref: 'INV/20260605/1002', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 245000, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-33', date: '2026-06-05', ref: 'INV/20260605/1003', account: '101.01 - Kas Utama (Tunai)', position: 'DEBET', amount: 240000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-34', date: '2026-06-05', ref: 'INV/20260605/1003', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 240000, description: 'Penjualan Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-35', date: '2026-06-05', ref: 'INV/20260605/1003', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 168000, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-36', date: '2026-06-05', ref: 'INV/20260605/1003', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 168000, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-37', date: '2026-06-13', ref: 'INV/20260613/1032', account: '101.02 - Bank Syariah (Transfer)', position: 'DEBET', amount: 875000, description: 'Penjualan Sepeda/Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-38', date: '2026-06-13', ref: 'INV/20260613/1032', account: '401 - Pendapatan Penjualan', position: 'KREDIT', amount: 875000, description: 'Penjualan Sepeda/Suku Cadang', status: 'COMMITTED' },
  { id: 'J-TRX-39', date: '2026-06-13', ref: 'INV/20260613/1032', account: '501 - Harga Pokok Penjualan (HPP)', position: 'DEBET', amount: 612500, description: 'HPP Penjualan', status: 'COMMITTED' },
  { id: 'J-TRX-40', date: '2026-06-13', ref: 'INV/20260613/1032', account: '102 - Persediaan Suku Cadang', position: 'KREDIT', amount: 612500, description: 'HPP Penjualan', status: 'COMMITTED' },
];

export default function AccountingPage() {
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);

  // Load data jurnal dari localStorage jika tersedia dari modul kasir
  useEffect(() => {
    const savedJournals = localStorage.getItem('siddeeq_journals');
    if (savedJournals) {
      try {
        setJournals(JSON.parse(savedJournals));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem('siddeeq_journals', JSON.stringify(INITIAL_JOURNALS));
    }
  }, []);

  // ==========================================
  // 1. KALKULASI LAPORAN LABA RUGI SYARIAH
  // ==========================================
  const totalPendapatan = journals
    .filter(j => j.status === 'COMMITTED' && j.account.includes('401'))
    .reduce((sum, j) => sum + j.amount, 0);

  const totalHPP = journals
    .filter(j => j.status === 'COMMITTED' && j.account.includes('501'))
    .reduce((sum, j) => sum + j.amount, 0);

  const labaKotor = totalPendapatan - totalHPP;
  
  // Simulasi Biaya Operasional (Sesuai data konseptual gambar Anda)
  const totalBiayaOperasional = 350000; 

  const labaBersihSebelumZakat = labaKotor - totalBiayaOperasional;
  const alokasiZakat = labaBersihSebelumZakat > 0 ? labaBersihSebelumZakat * 0.025 : 0;
  const labaBersihSetelahZakat = labaBersihSebelumZakat - alokasiZakat;

  // ==========================================
  // 2. KALKULASI NERACA (BALANCE SHEET) UTOMATIS
  // ==========================================
  // Ambil saldo akun neraca dengan menghitung akumulasi Debet dikurangi Kredit
  const getAccountBalance = (accountCode: string, initialBalance = 0) => {
    return journals
      .filter(j => j.status === 'COMMITTED' && j.account.includes(accountCode))
      .reduce((balance, j) => {
        if (j.position === 'DEBET') return balance + j.amount;
        return balance - j.amount;
      }, initialBalance);
  };

  // Saldo Aset dinamis dari mutasi jurnal + estimasi saldo awal gudang/modal
  const saldoKas = getAccountBalance('101.01', 500000); // Saldo awal kas Rp 500k
  const saldoBank = getAccountBalance('101.02', 2000000); // Saldo awal bank Rp 2jt
  const saldoPersediaan = getAccountBalance('102', 15000000); // Saldo awal inventory Rp 15jt
  const saldoPiutang = getAccountBalance('103', 0);

  const totalAset = saldoKas + saldoBank + saldoPersediaan + saldoPiutang;

  // Pasiva (Kewajiban & Ekuitas)
  const saldoUtang = 0; 
  const modalAwal = 17150000; // Penyeimbang modal investasi awal pendirian bengkel
  const totalKewajibanDanEkuitas = saldoUtang + modalAwal + labaBersihSetelahZakat;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '260px' }}>
        <TopHeader title="Akuntansi Syariah & Jurnal Otomatis" />
        
        <div style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* TABEL JURNAL OTOMATIS */}
          <Card>
            <CardBody style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                      <th style={{ padding: '10px 16px', fontWeight: 600 }}>Ref Jurnal</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600 }}>Tanggal</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600 }}>Akun Keuangan</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'center' }}>Posisi</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Jumlah Saldo</th>
                      <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.map((j) => (
                      <tr key={j.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)' }}>{j.id}</td>
                        <td style={{ padding: '10px 16px' }}>{j.date}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 500 }}>{j.account}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700,
                            backgroundColor: j.position === 'DEBET' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                            color: j.position === 'DEBET' ? '#3B82F6' : '#F59E0B'
                          }}>
                            {j.position}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>
                          Rp {j.amount.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--color-committed-bg)', color: 'var(--color-committed-text)', fontWeight: 600 }}>
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

          {/* GRID DUA LAPORAN KEUANGAN UTAMA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
            
            {/* PANEL KIRI: PENYEMPURNAAN LAPORAN LABA RUGI SYARIAH */}
            <Card>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Simulasi Laporan Laba Rugi Syariah</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dilengkapi alokasi Zakat Mal 2.5% secara otomatis</p>
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

            {/* PANEL KANAN: TAMBAHAN BARU LAPORAN NERACA (BALANCE SHEET) */}
            <Card>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>Laporan Neraca Keuangan Syariah</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Keseimbangan Posisi Keuangan Gudang & Kas</p>
              </div>
              <CardBody style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* BLOK AKTIVA (ASET) */}
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

                {/* BLOK PASIVA (KEWAJIBAN & EKUITAS) */}
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

                {/* VALIDATOR KESEIMBANGAN AKUNTANSI (CHECK BALANCED) */}
                <div style={{
                  marginTop: '4px', padding: '6px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem',
                  backgroundColor: totalAset === totalKewajibanDanEkuitas ? 'var(--color-committed-bg)' : 'var(--color-void-bg)',
                  color: totalAset === totalKewajibanDanEkuitas ? 'var(--color-committed-text)' : 'var(--color-void-text)'
                }}>
                  {totalAset === totalKewajibanDanEkuitas ? '⚖️ STATUS NERACA: SEIMBANG (BALANCED)' : '⚠️ STATUS NERACA: TIDAK SEIMBANG'}
                </div>

              </CardBody>
            </Card>

          </div>

        </div>
      </main>
    </div>
  );
}