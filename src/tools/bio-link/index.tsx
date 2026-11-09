import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

interface BioPage { id: string; username: string; displayName: string | null; bio: string | null; theme: string; background: string | null; }
interface BioLink { id: string; label: string; url: string; }

export default function BioLink() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState<BioPage | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [label, setLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await api<{ page: BioPage | null; links: BioLink[] }>('/api/bio/me');
      setPage(data.page);
      setLinks(data.links ?? []);
      if (data.page) {
        setDisplayName(data.page.displayName ?? '');
        setBio(data.page.bio ?? '');
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user]);

  if (!user) {
    return (
      <div className="p-8 rounded-xl border border-border text-center">
        <p className="mb-4">You need an account to create a bio page.</p>
        <Link to="/login"><Button>Sign in</Button></Link>
      </div>
    );
  }

  if (loading) return <p>Loading…</p>;

  const createPage = async () => {
    try {
      await api('/api/bio', { method: 'POST', body: JSON.stringify({ username, displayName, bio }) });
      toast('Bio page created', 'success');
      load();
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const savePage = async () => {
    try {
      await api('/api/bio', { method: 'PUT', body: JSON.stringify({ displayName, bio }) });
      toast('Saved', 'success');
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const addLink = async () => {
    try {
      await api('/api/bio/links', { method: 'POST', body: JSON.stringify({ label, url: linkUrl }) });
      setLabel(''); setLinkUrl('');
      toast('Link added', 'success');
      load();
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const removeLink = async (id: string) => {
    await api(`/api/bio/links/${id}`, { method: 'DELETE' });
    load();
  };

  if (!page) {
    return (
      <div className="max-w-md space-y-4">
        <input placeholder="username (for /b/username)" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())}
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <textarea placeholder="Short bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <Button onClick={createPage}>Create bio page</Button>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/b/${page.username}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="p-4 rounded-xl border border-border bg-surface-muted">
        <p className="text-sm text-text-muted">Your public page</p>
        <div className="flex items-center gap-2">
          <a href={`/b/${page.username}`} target="_blank" rel="noreferrer" className="text-primary font-mono">{publicUrl}</a>
          <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(publicUrl); toast('Copied', 'success'); }}>Copy</Button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border space-y-3">
        <h3 className="font-semibold">Profile</h3>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name"
          className="w-full p-2 rounded-lg border border-border bg-surface" />
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Bio"
          className="w-full p-2 rounded-lg border border-border bg-surface" />
        <Button onClick={savePage}>Save profile</Button>
      </div>

      <div className="p-4 rounded-xl border border-border space-y-3">
        <h3 className="font-semibold">Links ({links.length})</h3>
        {links.map((l) => (
          <div key={l.id} className="flex items-center gap-2 text-sm border-b border-border py-2">
            <span className="font-medium">{l.label}</span>
            <span className="text-text-muted truncate flex-1">{l.url}</span>
            <Button variant="ghost" onClick={() => removeLink(l.id)}>×</Button>
          </div>
        ))}
        <div className="flex gap-2">
          <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-border bg-surface" />
          <input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-border bg-surface" />
          <Button onClick={addLink}>Add</Button>
        </div>
      </div>
    </div>
  );
}
