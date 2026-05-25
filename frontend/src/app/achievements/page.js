'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

const categoryColors = {
  'Pemula':       { border: 'border-blue-500/20',   bg: 'from-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  'Kesamaptaan':  { border: 'border-orange-500/20', bg: 'from-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  'Jarak':        { border: 'border-yellow-500/20', bg: 'from-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  'Disiplin':     { border: 'border-green-500/20',  bg: 'from-green-500/10',  text: 'text-green-400',  dot: 'bg-green-400' },
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/achievements').then(r => setAchievements(r.data)).finally(() => setLoading(false));
  }, []);

  const unlocked = achievements.filter(a => a.unlocked);
  const categories = [...new Set(achievements.map(a => a.category))];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080c14]">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[120px] pointer-events-none" />
        <Navbar />

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-5">
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">Pencapaian</p>
            <h1 className="text-2xl md:text-3xl font-black text-white">Achievements</h1>
          </div>

          {/* Progress summary */}
          {!loading && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/60 text-sm">{unlocked.length} / {achievements.length} terbuka</span>
                <span className="text-orange-400 font-bold text-sm">{achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                  style={{ width: `${(unlocked.length / achievements.length) * 100}%` }} />
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {categories.map(cat => {
                  const c = categoryColors[cat];
                  const catTotal = achievements.filter(a => a.category === cat).length;
                  const catUnlocked = achievements.filter(a => a.category === cat && a.unlocked).length;
                  return (
                    <div key={cat} className="text-center">
                      <div className={`w-2 h-2 rounded-full ${c.dot} mx-auto mb-1`} />
                      <p className="text-white/30 text-[10px]">{cat}</p>
                      <p className={`text-xs font-bold ${c.text}`}>{catUnlocked}/{catTotal}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-white/20">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {categories.map(cat => {
                const c = categoryColors[cat];
                const items = achievements.filter(a => a.category === cat);
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                      <p className={`text-xs font-bold uppercase tracking-widest ${c.text}`}>{cat}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {items.map(a => (
                        <div key={a.id}
                          className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                            a.unlocked
                              ? `${c.border} bg-gradient-to-br ${c.bg} to-transparent`
                              : 'border-white/10 bg-white/[0.04]'
                          }`}>
                          {a.unlocked && (
                            <div className="absolute top-2 right-2">
                              <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                          <p className="text-3xl mb-2">{a.icon}</p>
                          <p className="font-bold text-sm text-white">{a.title}</p>
                          <p className="text-xs mt-0.5 text-white/60">{a.desc}</p>
                        </div>
                      ))}
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
