'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

// Haversine formula — hitung jarak antara 2 koordinat GPS (dalam km)
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const STATUS = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused', DONE: 'done' };

export default function InputActivityPage() {
  const router = useRouter();
  const [status, setStatus] = useState(STATUS.IDLE);
  const [distance, setDistance] = useState(0);       // km
  const [elapsed, setElapsed] = useState(0);          // seconds
  const [pace, setPace] = useState(0);                // min/km
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState({ distance: '', duration: '' });

  const watchId = useRef(null);
  const timerRef = useRef(null);
  const lastPos = useRef(null);
  const distRef = useRef(0);
  const elapsedRef = useRef(0);

  // Timer
  useEffect(() => {
    if (status === STATUS.RUNNING) {
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        // Update pace
        if (distRef.current > 0) {
          setPace((elapsedRef.current / 60) / distRef.current);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const startGPS = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('GPS tidak didukung browser ini');
      return false;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 50) return; // skip jika akurasi buruk
        if (lastPos.current) {
          const d = calcDistance(
            lastPos.current.lat, lastPos.current.lon,
            latitude, longitude
          );
          // Filter noise — hanya tambah jika > 3 meter
          if (d > 0.003) {
            distRef.current += d;
            setDistance(parseFloat(distRef.current.toFixed(3)));
          }
        }
        lastPos.current = { lat: latitude, lon: longitude };
      },
      (err) => {
        if (err.code === 1) setGpsError('Izin GPS ditolak. Aktifkan lokasi di browser.');
        else if (err.code === 2) setGpsError('GPS tidak tersedia. Coba di luar ruangan.');
        else setGpsError('GPS error: ' + err.message);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return true;
  };

  const stopGPS = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    lastPos.current = null;
  };

  const handleStart = () => {
    const ok = startGPS();
    if (ok) setStatus(STATUS.RUNNING);
  };

  const handlePause = () => {
    stopGPS();
    setStatus(STATUS.PAUSED);
  };

  const handleResume = () => {
    const ok = startGPS();
    if (ok) setStatus(STATUS.RUNNING);
  };

  const handleStop = () => {
    stopGPS();
    setStatus(STATUS.DONE);
  };

  const handleSave = async () => {
    if (distRef.current < 0.01) {
      setError('Jarak terlalu pendek untuk disimpan');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const durationMin = elapsedRef.current / 60;
      const paceVal = durationMin / distRef.current;
      await api.post('/activity', {
        distance: parseFloat(distRef.current.toFixed(3)),
        duration: parseFloat(durationMin.toFixed(2)),
        pace: parseFloat(paceVal.toFixed(2)),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    stopGPS();
    distRef.current = 0;
    elapsedRef.current = 0;
    setDistance(0);
    setElapsed(0);
    setPace(0);
    setStatus(STATUS.IDLE);
    setError('');
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/activity', {
        distance: parseFloat(manualForm.distance),
        duration: parseFloat(manualForm.duration),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const manualPace = manualForm.distance && manualForm.duration
    ? (parseFloat(manualForm.duration) / parseFloat(manualForm.distance)).toFixed(2)
    : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080c14]">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[120px] pointer-events-none" />
        <Navbar />

        <main className="max-w-md mx-auto px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">Aktivitas</p>
              <h1 className="text-2xl font-black text-white">Catat Lari</h1>
            </div>
            <button
              onClick={() => { handleDiscard(); setManualMode(!manualMode); }}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${manualMode ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : 'border-white/10 text-white/40 hover:text-white'}`}>
              {manualMode ? '📍 GPS Mode' : '✏️ Manual'}
            </button>
          </div>

          {/* GPS Error */}
          {gpsError && (
            <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl">
              <span className="shrink-0">⚠️</span> {gpsError}
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* MANUAL MODE */}
          {manualMode ? (
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-orange-500/20 via-transparent to-amber-400/10 blur-sm" />
              <form onSubmit={handleManualSave} className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 flex flex-col gap-5">
                <div>
                  <label className="text-white/70 text-[11px] font-semibold uppercase tracking-widest mb-2 block">Jarak (km)</label>
                  <input type="number" step="0.01" min="0.01" placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-4 py-4 text-3xl font-black outline-none text-white placeholder-white/15"
                    value={manualForm.distance} onChange={e => setManualForm({ ...manualForm, distance: e.target.value })} required />
                </div>
                <div>
                  <label className="text-white/70 text-[11px] font-semibold uppercase tracking-widest mb-2 block">Durasi (menit)</label>
                  <input type="number" step="0.1" min="0.1" placeholder="0"
                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl px-4 py-4 text-3xl font-black outline-none text-white placeholder-white/15"
                    value={manualForm.duration} onChange={e => setManualForm({ ...manualForm, duration: e.target.value })} required />
                </div>
                {manualPace && (
                  <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-4 text-center">
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Estimasi Pace</p>
                    <p className="text-4xl font-black text-orange-400">{manualPace}</p>
                    <p className="text-white/60 text-xs mt-1">menit / km</p>
                  </div>
                )}
                <button type="submit" disabled={saving}
                  className="rounded-2xl py-4 font-bold text-white disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                  style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)', boxShadow: '0 8px 32px rgba(249,115,22,0.3)' }}>
                  {saving ? 'Menyimpan...' : '💾 Simpan Aktivitas'}
                </button>
              </form>
            </div>
          ) : (
            /* GPS MODE */
            <div className="flex flex-col gap-4">
              {/* Stats display */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-500/10 blur-2xl" />

                {/* Distance */}
                <div className="text-center mb-6">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Jarak</p>
                  <p className="text-7xl font-black text-white tabular-nums">{distance.toFixed(2)}</p>
                  <p className="text-orange-400 font-semibold">km</p>
                </div>

                {/* Timer + Pace */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-4 text-center">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Waktu</p>
                    <p className="text-2xl font-black text-white tabular-nums">{formatTime(elapsed)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-4 text-center">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Pace</p>
                    <p className="text-2xl font-black text-white tabular-nums">
                      {pace > 0 ? pace.toFixed(2) : '--'}
                    </p>
                    <p className="text-white/30 text-[10px]">min/km</p>
                  </div>
                </div>

                {/* Status indicator */}
                {status === STATUS.RUNNING && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs font-semibold">GPS Aktif — Sedang Merekam</span>
                  </div>
                )}
                {status === STATUS.PAUSED && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-yellow-400 text-xs font-semibold">Dijeda</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              {status === STATUS.IDLE && (
                <button onClick={handleStart}
                  className="w-full py-5 rounded-2xl font-black text-white text-lg transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 8px 32px rgba(34,197,94,0.3)' }}>
                  🏃 Mulai Lari
                </button>
              )}

              {status === STATUS.RUNNING && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handlePause}
                    className="py-4 rounded-2xl font-bold text-white bg-yellow-500/20 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all">
                    ⏸ Jeda
                  </button>
                  <button onClick={handleStop}
                    className="py-4 rounded-2xl font-bold text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all">
                    ⏹ Selesai
                  </button>
                </div>
              )}

              {status === STATUS.PAUSED && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleResume}
                    className="py-4 rounded-2xl font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                    ▶ Lanjut
                  </button>
                  <button onClick={handleStop}
                    className="py-4 rounded-2xl font-bold text-white bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all">
                    ⏹ Selesai
                  </button>
                </div>
              )}

              {status === STATUS.DONE && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                    <p className="text-green-400 font-bold">✅ Lari Selesai!</p>
                    <p className="text-white/50 text-sm mt-1">{distance.toFixed(2)} km dalam {formatTime(elapsed)}</p>
                  </div>
                  <button onClick={handleSave} disabled={saving}
                    className="py-4 rounded-2xl font-bold text-white disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                    style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)', boxShadow: '0 8px 32px rgba(249,115,22,0.3)' }}>
                    {saving ? 'Menyimpan...' : '💾 Simpan Aktivitas'}
                  </button>
                  <button onClick={handleDiscard}
                    className="py-3 rounded-2xl font-semibold text-white/40 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all text-sm">
                    Buang & Ulangi
                  </button>
                </div>
              )}

              {/* GPS tip */}
              {status === STATUS.IDLE && (
                <p className="text-white/25 text-xs text-center">
                  Pastikan GPS aktif dan izin lokasi diberikan di browser.<br/>
                  Gunakan di luar ruangan untuk akurasi terbaik.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
