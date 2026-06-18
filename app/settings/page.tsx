"use client";

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopHeader } from '../../components/layout/TopHeader';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Branch {
  id: number;
  name: string;
  location: string;
  isMosqueAffiliated: boolean;
  mosqueName?: string;
  status: 'ACTIVE' | 'PROPOSED';
}

export default function SettingsPage() {
  const [branches, setBranches] = useState<Branch[]>([
    { id: 1, name: 'Siddeeq Cycle - Pusat Gede', location: '-6.2088, 106.8456', isMosqueAffiliated: false, status: 'ACTIVE' },
    { id: 2, name: 'Kemitraan UMKM Al-Barokah', location: '-6.2234, 106.8123', isMosqueAffiliated: true, mosqueName: 'Masjid Al-Barokah Kuningan', status: 'ACTIVE' },
  ]);

  // Form states for Branch Verification
  const [branchName, setBranchName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isMosqueAffiliated, setIsMosqueAffiliated] = useState(false);
  const [mosqueName, setMosqueName] = useState('');
  const [takmirPhone, setTakmirPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const handleGetLocation = () => {
    setGpsStatus('Mengakses GPS satelit...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
          setGpsStatus('Koordinat berhasil didapatkan.');
        },
        (error) => {
          // Fallback if browser geo blocked / unavailable
          setLatitude('-6.208800');
          setLongitude('106.845600');
          setGpsStatus('GPS ditolak. Menggunakan koordinat default (Jakarta).');
        }
      );
    } else {
      setGpsStatus('Browser Anda tidak mendukung GPS.');
    }
  };

  const handleRegisterBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || !latitude || !longitude) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newBranch: Branch = {
        id: branches.length + 1,
        name: branchName,
        location: `${latitude}, ${longitude}`,
        isMosqueAffiliated,
        mosqueName: isMosqueAffiliated ? mosqueName : undefined,
        status: 'PROPOSED',
      };

      setBranches([...branches, newBranch]);
      setBranchName('');
      setLatitude('');
      setLongitude('');
      setIsMosqueAffiliated(false);
      setMosqueName('');
      setTakmirPhone('');
      setGpsStatus(null);
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '260px' }}>
        <TopHeader title="Pengaturan & Verifikasi Kemitraan" />
        
        <div style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--spacing-6)' }}>
            
            {/* Left Column: Branch Verification Form */}
            <div>
              <Card>
                <CardHeader 
                  title="Formulir Verifikasi Cabang / Masjid" 
                  description="Daftarkan titik operasional unit usaha kemitraan baru" 
                />
                <form onSubmit={handleRegisterBranch}>
                  <CardBody style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    
                    <Input 
                      label="Nama Cabang / Mitra" 
                      placeholder="Contoh: Kemitraan Al-Jihad"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      required
                    />

                    {/* Geolocation Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        Koordinat GPS
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                        <Input 
                          placeholder="Latitude" 
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          required
                        />
                        <Input 
                          placeholder="Longitude" 
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          required
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGetLocation}
                        style={{ width: '100%' }}
                      >
                        📍 Ambil Lokasi Saat Ini
                      </Button>
                      {gpsStatus && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-1)' }}>
                          {gpsStatus}
                        </span>
                      )}
                    </div>

                    {/* Mosque Affiliation Toggle */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'between',
                      padding: 'var(--spacing-3)',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Terintegrasi Binaan Masjid?</span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cabang berbasis komunitas masjid</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isMosqueAffiliated}
                        onChange={(e) => setIsMosqueAffiliated(e.target.checked)}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: 'var(--color-primary)',
                          cursor: 'pointer'
                        }}
                      />
                    </div>

                    {/* Conditional Fields based on Toggle */}
                    {isMosqueAffiliated && (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 'var(--spacing-4)',
                        padding: 'var(--spacing-4)',
                        borderLeft: '3px solid var(--color-secondary)',
                        backgroundColor: 'rgba(234, 168, 18, 0.03)',
                        borderRadius: '0 var(--radius-md) var(--radius-md) 0'
                      }}>
                        <Input 
                          label="Nama Masjid Afiliasi" 
                          placeholder="Contoh: Masjid Al-Jihad BSD"
                          value={mosqueName}
                          onChange={(e) => setMosqueName(e.target.value)}
                          required={isMosqueAffiliated}
                        />
                        <Input 
                          label="No. WhatsApp Pengurus/Takmir (Notifikasi Saksi)" 
                          placeholder="Contoh: 08123456789"
                          value={takmirPhone}
                          onChange={(e) => setTakmirPhone(e.target.value)}
                          required={isMosqueAffiliated}
                        />
                      </div>
                    )}

                  </CardBody>
                  <CardFooter style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outline" 
                      type="button" 
                      disabled={isSubmitting}
                      onClick={() => {
                        setBranchName('');
                        setLatitude('');
                        setLongitude('');
                        setIsMosqueAffiliated(false);
                        setMosqueName('');
                        setTakmirPhone('');
                        setGpsStatus(null);
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
                          Mendaftarkan...
                        </div>
                      ) : 'Simpan Kemitraan'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>

            {/* Right Column: Registered Branches */}
            <div>
              <Card>
                <CardHeader 
                  title="Daftar Cabang & Mitra Terdaftar" 
                  description="Daftar cabang aktif dan pengajuan proposed kemitraan" 
                />
                <CardBody style={{ padding: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {branches.map((branch) => (
                      <div key={branch.id} style={{ 
                        padding: 'var(--spacing-4)', 
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{branch.name}</span>
                            {branch.isMosqueAffiliated && (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                backgroundColor: 'rgba(234, 168, 18, 0.12)', 
                                color: 'var(--color-secondary-hover)', 
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600
                              }}>
                                Binaan Masjid
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                            📍 Koordinat: {branch.location}
                          </span>
                          {branch.mosqueName && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'block', fontWeight: 500 }}>
                              🕌 Afiliasi: {branch.mosqueName}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className={`status-badge ${branch.status === 'ACTIVE' ? 'status-committed' : 'status-pending'}`}>
                            {branch.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
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
