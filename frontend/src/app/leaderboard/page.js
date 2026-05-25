'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

const medals = [
  { bg: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '🥇' },
  { bg: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400/30', text: 'text-slate-300', icon: '🥈' },
  { bg: 'from-orange-700/20 to-orange-800/10', border: 'border-orange-700/30', text: 'text-orange-600', icon: '🥉' },
];

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    setMe(getUser());
    api.get('/leaderboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const myRank = data.find(d => d.user_id === me?.id);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080c14]">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[120px] pointer-events-none" />
        <Navbar />

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">Kompetisi</p>
            <h1 className="text-2xl md:text-3xl font-black text-white">Leaderboard</h1>
          </div>

          {/* My rank card */}
          {myRank && (
            <div className="mb-6 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black">
                  #{myRank.rank}
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">Posisi Kamu</p>
                  <p className="text-white font-bold">{myRank.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-black text-lg">{myRank.total_distance} km</p>
                <p className="text-white/50 text-xs">{myRank.total_runs}x lari</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-white/20">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Memuat data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-white/30 text-sm">Belum ada data leaderboard</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.map((entry) => {
                const medal = medals[entry.rank - 1];
                const isMe = entry.user_id === me?.id;
                return (
                  <div key={entry.user_id}
                    className={`flex items-center gap-4 rounded-2xl border px-5 py-4 transition-colors ${
                      medal
                        ? `bg-gradient-to-r ${medal.bg} ${medal.border}`
                        : isMe
                          ? 'border-orange-500/20 bg-orange-500/5'
                          : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.05]'
                    }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      medal ? `${medal.text} bg-white/10` : 'text-white/40 bg-white/5'
                    }`}>
                      {medal ? medal.icon : entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isMe ? 'text-orange-400' : 'text-white'}`}>
                        {entry.name} {isMe && <span className="text-xs text-orange-400/60">(kamu)</span>}
                      </p>
                      <p className="text-white/50 text-xs">Kelas {entry.class || '-'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black ${medal ? medal.text : 'text-white/80'}`}>{entry.total_distance} <span className="text-xs font-normal text-white/50">km</span></p>
                      <p className="text-white/50 text-xs">{entry.total_runs}x lari</p>
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
