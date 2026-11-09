import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import Button from '@/components/ui/Button';

type Tab = 'overview' | 'links' | 'pastes' | 'account';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({ links: 0, pastes: 0, hasBio: false });
  const [pastes, setPastes] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api<{ links: any[] }>('/api/links').then((d) => d.links.length).catch(() => 0),
      api<{ pastes: any[] }>('/api/pastes').then((d) => { setPastes(d.pastes); return d.pastes.length; }).catch(() => 0),
      api<{ page: any }>('/api/bio/me').then((d) => !!d.page).catch(() => false),
    ]).then(([links, pasteCount, hasBio]) => setStats({ links, pastes: pasteCount, hasBio }));
  }, [user]);

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;

  const deletePaste = async (id: string) => {
    await api(`/api/pastes/${id}`, { method: 'DELETE' });
    setPastes((p) => p.filter((x) => x.id !== id));
  };

  const deleteAccount = async () => {
    await api('/api/auth/account', { method: 'DELETE' });
    logout();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-text-muted">Welcome, {user.displayName ?? user.email}</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(['overview', 'links', 'pastes', 'account'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 transition ${tab === t ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}>
            {t}
          </button>
        ))}
        {user.role === 'admin' && (
          <Link to="/admin" className="px-4 py-2 text-sm text-primary">Admin →</Link>
        )}
      </div>

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Short Links" value={stats.links} link="/tools/link-shortener" />
          <StatCard label="Pastes" value={stats.pastes} link="/tools/clipboard" />
          <StatCard label="Bio Page" value={stats.hasBio ? 'Active' : 'None'} link="/tools/bio-link" />
        </div>
      )}

      {tab === 'links' && (
        <div>
          <Link to="/tools/link-shortener"><Button>Manage links</Button></Link>
        </div>
      )}

      {tab === 'pastes' && (
        <div className="space-y-2">
          {pastes.length === 0 && <p className="text-text-muted">No pastes yet.</p>}
          {pastes.map((p) => (
            <div key={p.id} className="p-3 rounded-lg border border-border flex items-center gap-3">
              <Link to={`/p/${p.id}`} className="font-mono text-primary flex-1 truncate">/p/{p.id}</Link>
              <span className="text-sm text-text-muted">{p.title}</span>
              <Button variant="ghost" onClick={() => deletePaste(p.id)}>Delete</Button>
            </div>
          ))}
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-4 max-w-md">
          <div className="p-4 rounded-lg border border-border space-y-1">
            <p className="text-sm text-text-muted">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div className="p-4 rounded-lg border border-border space-y-1">
            <p className="text-sm text-text-muted">Role</p>
            <p className="font-medium capitalize">{user.role}</p>
          </div>
          <Button variant="outline" onClick={logout}>Sign out</Button>
          <div className="pt-4 border-t border-border">
            {!confirmDelete ? (
              <Button variant="outline" onClick={() => setConfirmDelete(true)}>Delete account</Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-500">This cannot be undone. All content will be unlinked.</p>
                <div className="flex gap-2">
                  <Button onClick={deleteAccount}>Confirm</Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, link }: { label: string; value: any; link: string }) {
  return (
    <Link to={link} className="p-4 rounded-xl border border-border hover:border-primary transition">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </Link>
  );
}
