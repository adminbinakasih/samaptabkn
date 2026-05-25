'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
      active ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
             : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'}`}>
    {children}
  </button>
);

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [inactive, setInactive] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [inactiveDays, setInactiveDays] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (tab === 'users') {
      api.get(classFilter ? `/admin/users?class=${classFilter}` : '/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
    } else if (tab === 'activities') {
      api.get('/admin/activities').then(r => setActivities(r.data)).finally(() => setLoading(false));
    } else {
      api.get(`/admin/inactive?days=${inactiveDays}`).then(r => setInactive(r.data.students)).finally(() => setLoading(false));
    }
  }, [tab, classFilter, inactiveDays]);

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-[#080c14]">
        <div className="fixed top-0 right-0 w-72 h-72 rounded-full bg-orange-600/5 blur-[100px] pointer-events-none" />
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-6">
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-2xl md:text-3xl font-black text-white">Panel Admin</h1>
          </div>

          <div className="flex gap-2 mb-5 flex-wrap">
            <TabBtn active={tab==='users'} onClick={() => setTab('users')}>Siswa</TabBtn>
            <TabBtn active={tab==='activities'} onClick={() => setTab('activities')}>Aktivitas</TabBtn>
            <TabBtn active={tab==='inactive'} onClick={() => setTab('inactive')}>Tidak Aktif</TabBtn>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">

            {tab === 'users' && (
              <>
                <div className="p-4 border-b border-white/5">
                  <input type="text" placeholder="Filter kelas (contoh: X-VOLTA)"
                    className="w-full sm:max-w-xs bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder-white/20"
                    value={classFilter} onChange={e => setClassFilter(e.target.value)} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/5">
                      {['Nama','Email','Kelas','Bergabung'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-white/60 text-xs font-semibold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.03]">
                          <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                          <td className="px-4 py-3 text-white/60 text-xs">{u.email}</td>
                          <td className="px-4 py-3">{u.class ? <span className="bg-orange-500/10 text-orange-400 text-xs px-2 py-0.5 rounded-lg border border-orange-500/20">{u.class}</span> : <span className="text-white/30">-</span>}</td>
                          <td className="px-4 py-3 text-white/50 text-xs">{new Date(u.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!loading && users.length === 0 && <div className="text-center py-12 text-white/20"><p className="text-sm">Belum ada siswa</p></div>}
                </div>
              </>
            )}

            {tab === 'activities' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Siswa','Kelas','Tipe','Jarak/Rep','Durasi','Pace','Tanggal'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-white/60 text-xs font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map(a => (
                      <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.03]">
                        <td className="px-4 py-3 font-medium text-white">{a.user?.name}</td>
                        <td className="px-4 py-3">{a.user?.class ? <span className="bg-orange-500/10 text-orange-400 text-xs px-2 py-0.5 rounded-lg border border-orange-500/20">{a.user.class}</span> : <span className="text-white/20">-</span>}</td>
                        <td className="px-4 py-3">
                          <span className={'text-xs px-2 py-0.5 rounded-lg border font-semibold ' + (
                            a.type === 'pushup' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            a.type === 'pullup' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-green-500/10 text-green-400 border-green-500/20'
                          )}>
                            {a.type === 'pushup' ? 'Push Up' : a.type === 'pullup' ? 'Pull Up' : 'Lari'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-orange-400">
                          {(!a.type || a.type === 'running') ? a.distance + ' km' : (a.reps || 0) + ' rep'}
                        </td>
                        <td className="px-4 py-3 text-white/60">{a.duration} mnt</td>
                        <td className="px-4 py-3 text-white/40 text-xs">{(!a.type || a.type === 'running') ? parseFloat(a.pace).toFixed(2) + ' min/km' : '-'}</td>
                        <td className="px-4 py-3 text-white/30 text-xs">{new Date(a.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && activities.length === 0 && <div className="text-center py-12 text-white/20"><p className="text-sm">Belum ada aktivitas</p></div>}
              </div>
            )}

            {tab === 'inactive' && (
              <>
                <div className="p-4 border-b border-white/5 flex items-center gap-3 flex-wrap">
                  <span className="text-white/60 text-sm">Tidak aktif selama</span>
                  <input type="number" min="1"
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm w-16 outline-none text-white text-center"
                    value={inactiveDays} onChange={e => setInactiveDays(e.target.value)} />
                  <span className="text-white/60 text-sm">hari</span>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {inactive.map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-4 py-3">
                      <div>
                        <p className="font-semibold text-white text-sm">{u.name}</p>
                        <p className="text-white/30 text-xs">{u.email}</p>
                      </div>
                      {u.class && <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2.5 py-1 rounded-lg border border-yellow-500/20">{u.class}</span>}
                    </div>
                  ))}
                  {!loading && inactive.length === 0 && <div className="text-center py-10 text-green-400/60"><p className="text-3xl mb-2">✅</p><p className="text-sm">Semua siswa aktif</p></div>}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
