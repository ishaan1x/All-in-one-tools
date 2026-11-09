import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import Button from '@/components/ui/Button';

export default function Admin() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<'stats' | 'users'>('stats');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api<Record<string, number>>('/api/admin/stats').then(setStats).catch(() => {});
    api<{ users: any[] }>('/api/admin/users').then((d) => setUsers(d.users)).catch(() => {});
  }, [user]);

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <div className="text-center py-20 text-red-500">Access denied — admin only.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>
      <div className="flex gap-2 border-b border-border">
        {(['stats', 'users'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-text-muted'}`}>{t}</button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="p-4 rounded-xl border border-border">
              <p className="text-sm text-text-muted capitalize">{k}</p>
              <p className="text-3xl font-bold mt-1">{v}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="p-3 rounded-lg border border-border flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium">{u.displayName ?? u.email}</p>
                <p className="text-xs text-text-muted">{u.email}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-muted'}`}>{u.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
