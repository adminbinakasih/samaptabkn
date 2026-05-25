'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';

function WeeklyChart({ data }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.distance), 1);
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 mb-4">
      <p className="text-white/60 text-xs uppercase tracking-widest mb-4">Jarak 7 Hari Terakhir</p>
      <div className="flex items-end gap-1.5 h-20">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-white text-[10px] font-medium">{d.distance > 0 ? d.distance.toFixed(1) : ''}</span>
            <div className="w-full rounded-t-lg transition-all duration-500"
              style={{
                height: `${Math.max((d.distance / max) * 60, d.distance > 0 ? 6 : 2)}px`,
                background: d.distance > 0 ? 'linear-gradient(to top,#f97316,#f59e0b)' : 'rgba(255,255,255,0.05)',
              }} />
            <span className="text-white text-[10px] font-medium">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recent, setRecent] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    setUser(getUser());
    api.get('/user/profile').then(r => setProfile(r.data));
    api.get('/activity').then(r => setRecent(r.data.slice(0, 3)));
    api.get('/stats/weekly').then(r => setWeekly(r.data));
    api.get('/stats/streak').then(r => setStreak(r.data));
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080c14]">
        <div className="fixed top-0 right-0 w-72 h-72 md:w-[500px] md:h-[500px] rounded-full bg-orange-600/8 blur-[100px] pointer-events-none" />
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Greeting */}
          <div className="mb-5">
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-black text-white">Halo, {user?.name?.split(' ')[0]}</h1>
            {user?.class && <p className="text-white/30 text-sm mt-1">Kelas {user.class}</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total Jarak', value: profile?.total_distance || '0.00', unit: 'km', color: 'text-orange-400' },
              { label: 'Total Lari', value: profile?.total_runs || 0, unit: 'kali', color: 'text-amber-400' },
              { label: 'Streak', value: streak.current, unit: 'hari', color: 'text-green-400' },
              { label: 'Terpanjang', value: streak.longest, unit: 'hari', color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-white text-xs uppercase tracking-wider mt-0.5 font-semibold">{s.unit}</p>
                <p className="text-white/70 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <WeeklyChart data={weekly} />

          {/* CTA */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href="/input-activity"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-2xl hover:-translate-y-0.5 transition-all shadow-lg shadow-orange-500/20 text-sm">
              Catat Lari
            </Link>
            <Link href="/achievements"
              className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-semibold py-3.5 rounded-2xl hover:bg-white/10 transition-all text-sm">
              Achievements
            </Link>
          </div>

          {/* Kesamaptaan */}
          <div className="mb-6">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Kesamaptaan Jasmani</p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/pushup"
                className="flex items-center justify-center gap-2 bg-white/5 border border-orange-500/20 text-white font-semibold py-3.5 rounded-2xl hover:bg-orange-500/10 transition-all text-sm">
                Push Up              </Link>
              <Link href="/pullup"
                className="flex items-center justify-center gap-2 bg-white/5 border border-blue-500/20 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-500/10 transition-all text-sm">
                Pull Up
              </Link>
            </div>
          </div>

          {/* Recent */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-sm">Aktivitas Terakhir</h2>
            <Link href="/history" className="text-orange-400 text-xs hover:text-orange-300">Lihat semua</Link>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-white/30 text-sm">Belum ada aktivitas. Yuk mulai berlari!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3.5 hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{a.distance} <span className="text-orange-400 text-xs">km</span></p>
                      <p className="text-white/50 text-xs">{new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm">{a.duration} mnt</p>
                    <p className="text-white/50 text-xs">{parseFloat(a.pace).toFixed(2)} min/km</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
