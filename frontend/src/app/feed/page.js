'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function getPaceLabel(pace) {
  if (pace < 4) return { label: 'Sangat Cepat', color: 'text-green-400' };
  if (pace < 5.5) return { label: 'Cepat', color: 'text-blue-400' };
  if (pace < 7) return { label: 'Sedang', color: 'text-orange-400' };
  return { label: 'Santai', color: 'text-white/40' };
}

export default function FeedPage() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const me = getUser();

  useEffect(() => {
    api.get('/feed').then(r => setFeed(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080c14]">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[120px] pointer-events-none" />
        <Navbar />

        <main className="max-w-xl mx-auto px-4 py-6">
          <div className="mb-6">
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">Komunitas</p>
            <h1 className="text-2xl md:text-3xl font-black text-white">Activity Feed</h1>
          </div>

          {loading ? (
            <div className="text-center py-20 text-white/20">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Memuat feed...</p>
            </div>
          ) : feed.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
              <p className="text-4xl mb-3">🏃</p>
              <p className="text-white/30 text-sm">Belum ada aktivitas di feed</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {feed.map(a => {
                const isMe = a.user?.id === me?.id;
                const paceInfo = getPaceLabel(a.pace);
                return (
                  <div key={a.id}
                    className={`rounded-2xl border p-5 transition-colors ${
                      isMe
                        ? 'border-orange-500/20 bg-gradient-to-br from-orange-500/8 to-transparent'
                        : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.05]'
                    }`}>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          isMe ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/60 border border-white/10'
                        }`}>
                          {a.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isMe ? 'text-orange-400' : 'text-white'}`}>
                            {a.user?.name} {isMe && <span className="text-xs text-orange-400/50">(kamu)</span>}
                          </p>
                          <p className="text-white/50 text-xs">Kelas {a.user?.class || '-'}</p>
                        </div>
                      </div>
                      <span className="text-white/50 text-xs">{timeAgo(a.created_at)}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
                        <p className="text-xl font-black text-white">{a.distance}</p>
                        <p className="text-white/60 text-[10px] uppercase tracking-wider">km</p>
                      </div>
                      <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
                        <p className="text-xl font-black text-white">{a.duration}</p>
                        <p className="text-white/60 text-[10px] uppercase tracking-wider">menit</p>
                      </div>
                      <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
                        <p className={`text-xl font-black ${paceInfo.color}`}>{parseFloat(a.pace).toFixed(1)}</p>
                        <p className="text-white/60 text-[10px] uppercase tracking-wider">min/km</p>
                      </div>
                    </div>

                    {/* Pace label */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-xs font-semibold ${paceInfo.color}`}>● {paceInfo.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
