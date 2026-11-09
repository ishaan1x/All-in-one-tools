import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Link } from 'react-router-dom';

interface MyLink { id: string; originalUrl: string; alias: string | null; clicks: number; createdAt: string; }

export default function LinkShortener() {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [shortId, setShortId] = useState<string | null>(null);
  const [links, setLinks] = useState<MyLink[]>([]);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fullShortUrl = shortId ? `${window.location.origin}/s/${shortId}` : '';

  const loadLinks = async () => {
    if (!user) return;
    try {
      const data = await api<{ links: MyLink[] }>('/api/links');
      setLinks(data.links);
    } catch { /* ignore */ }
  };
  useEffect(() => { loadLinks(); }, [user]);

  const create = async () => {
    setBusy(true);
    try {
      const res = await api<{ id: string; alias: string | null }>('/api/links', {
        method: 'POST',
        body: JSON.stringify({ url, alias: alias || undefined }),
      });
      setShortId(res.alias ?? res.id);
      setUrl(''); setAlias('');
      await loadLinks();
      toast('Short link created', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(fullShortUrl);
    toast('Copied!', 'success');
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    try {
      await api(`/api/links/${id}`, { method: 'DELETE' });
      await loadLinks();
      toast('Deleted', 'success');
    } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="p-6 rounded-xl border border-border space-y-4">
        <input placeholder="https://example.com/very/long/url" value={url} onChange={(e) => setUrl(e.target.value)}
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <input placeholder="Custom alias (optional)" value={alias} onChange={(e) => setAlias(e.target.value)}
          className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        <Button onClick={create} disabled={busy || !url}>{busy ? 'Creating…' : 'Shorten'}</Button>
      </div>

      {shortId && (
        <div className="p-6 rounded-xl border border-border bg-surface-muted flex flex-col sm:flex-row gap-6 items-center">
          <div className="bg-white p-3 rounded-lg">
            <QRCodeSVG value={fullShortUrl} size={120} level="M" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-text-muted">Your short link</p>
            <a href={`/s/${shortId}`} target="_blank" rel="noreferrer" className="text-primary font-mono break-all">{fullShortUrl}</a>
            <div>
              <Button variant="outline" onClick={copy}>Copy link</Button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div>
          <h2 className="font-semibold mb-3">My links</h2>
          {links.length === 0 ? (
            <p className="text-text-muted text-sm">No links yet.</p>
          ) : (
            <div className="space-y-2">
              {links.map((l) => (
                <div key={l.id} className="p-3 rounded-lg border border-border flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <a href={`/s/${l.alias ?? l.id}`} target="_blank" rel="noreferrer" className="text-primary font-mono text-sm">/s/{l.alias ?? l.id}</a>
                    <p className="text-xs text-text-muted truncate">{l.originalUrl}</p>
                  </div>
                  <span className="text-sm text-text-muted">{l.clicks} clicks</span>
                  <Button variant="ghost" onClick={() => remove(l.id)}>Delete</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
