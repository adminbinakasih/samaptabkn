'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

const TYPE_LABEL = { running: 'Lari', pushup: 'Push Up', pullup: 'Pull Up', chinning: 'Chinning', situp: 'Sit Up' };
const TYPE_COLOR = { running: 'text-orange-400', pushup: 'text-green-400', pullup: 'text-blue-400', chinning: 'text-purple-400', situp: 'text-amber-400' };
const TYPE_BG = {
  running: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  pushup: 'bg-green-500/10 border-green-500/20 text-green-400',
  pullup: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  chinning: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  situp: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
};
const TYPE_ICON = { running: '🏃', pushup: '💪', pullup: '🔝', chinning: '🏋️', situp: '🤸' };

function formatDistance(km) {
  const d = parseFloat(km) || 0;
  if (d < 1) return `${(d * 1000).toFixed(0)} m`;
  return `${d.toFixed(2)} km`;
}

function formatDuration(minutes) {
  const m = parseFloat(minutes) || 0;
  if (m < 1) {
    const secs = Math.round(m * 60);
    return `${secs} dtk`;
  }
  const h = Math.floor(m / 60);
  const mins = Math.floor(m % 60);
  const secs = Math.round((m % 1) * 60);
  if (h > 0) return `${h}j ${String(mins).padStart(2,'0')}m`;
  if (secs > 0 && mins < 10) return `${mins}m ${String(secs).padStart(2,'0')}d`;
  return `${mins} mnt`;
}

function formatPace(pace) {
  const p = parseFloat(pace) || 0;
  if (p <= 0 || p > 60) return '-';
  const mins = Math.floor(p);
  const secs = Math.round((p - mins) * 60);
  return `${mins}:${String(secs).padStart(2,'0')} /km`;
}

export default function HistoryPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/activity').then(r => setActivities(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);

  const totalRuns = activities.filter(a => a.type === 'running').length;
  const totalDist = activities.filter(a => a.type === 'running').reduce((s, a) => s + (a.distance || 0), 0).toFixed(2);
  const totalPushup = activities.filter(a => a.type === 'pushup').reduce((s, a) => s + (a.reps || 0), 0);
  const totalPullup = activities.filter(a => a.type === 'pullup').reduce((s, a) => s + (a.reps || 0), 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080c14]">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[120px] pointer-events-none" />
        <Navbar />

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">Rekap</p>
            <h1 className="text-2xl md:text-3xl font-black text-white">Riwayat Aktivitas</h1>
          </div>

          {/* Summary stats */}
          {!loading && activities.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                <p className="text-xl font-black text-orange-400">{totalDist}</p>
                <p className="text-white/60 text-xs mt-0.5">km</p>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mt-1">Total Lari</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                <p className="text-xl font-black text-green-400">{totalPushup}</p>
                <p className="text-white/60 text-xs mt-0.5">reps</p>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mt-1">Push Up</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                <p className="text-xl font-black text-blue-400">{totalPullup}</p>
                <p className="text-white/60 text-xs mt-0.5">reps</p>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mt-1">Pull Up</p>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          {!loading && activities.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all', 'running', 'pushup', 'situp', 'pullup', 'chinning'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-white/[0.05] text-white/40 hover:text-white/70'}`}>
                  {f === 'all' ? 'Semua' : TYPE_LABEL[f]}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-white/20">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Memuat data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
              <p className="text-4xl mb-3">🏃</p>
              <p className="text-white/30 text-sm">Belum ada aktivitas tercatat</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((a, i) => (
                <div key={a.id}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm shrink-0 ${TYPE_BG[a.type] || TYPE_BG.running}`}>
                      {TYPE_ICON[a.type] || '🏃'}
                    </div>
                    <div>
                      <p className="font-bold text-white">
                        {a.type === 'running'
                          ? <>{formatDistance(a.distance)}</>
                          : <>{a.reps} <span className={`text-sm font-semibold ${TYPE_COLOR[a.type]}`}>reps {TYPE_LABEL[a.type]}</span></>
                        }
                      </p>
                      <p className="text-white/50 text-xs">{new Date(a.created_at).toLocaleString('id-ID', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm font-medium">{formatDuration(a.duration)}</p>
                    {a.type === 'running' && <p className="text-white/50 text-xs">{formatPace(a.pace)}</p>}
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
