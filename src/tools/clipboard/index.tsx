import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/services/api';

const LANGUAGES = ['plaintext', 'javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'sql', 'go', 'rust', 'java', 'c', 'cpp'];

export default function Clipboard() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [isPublic, setIsPublic] = useState(true);
  const [expiresIn, setExpiresIn] = useState<'never' | '1h' | '1d' | '7d' | '30d'>('never');
  const [created, setCreated] = useState<{ id: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const computeExpiry = (): string | undefined => {
    if (expiresIn === 'never') return undefined;
    const now = new Date();
    const map = { '1h': 1, '1d': 24, '7d': 24 * 7, '30d': 24 * 30 } as const;
    now.setHours(now.getHours() + map[expiresIn]);
    return now.toISOString();
  };

  const create = async () => {
    if (!content.trim()) { toast('Content required', 'error'); return; }
    setBusy(true);
    try {
      const res = await api<{ id: string; url: string }>('/api/share/paste', {
        method: 'POST',
        body: JSON.stringify({ title, content, language, isPublic, expiresAt: computeExpiry() }),
      });
      setCreated(res);
      toast('Paste created', 'success');
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const fullUrl = created ? `${window.location.origin}${created.url}` : '';

  return (
    <div className="space-y-4 max-w-3xl">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Paste title (optional)"
        className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />

      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16}
        placeholder="Paste your code or text here…"
        className="w-full p-4 rounded-xl border border-border bg-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-sm">
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="block mt-1 w-full p-2 rounded-lg border border-border bg-surface">
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Expires
          <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value as any)}
            className="block mt-1 w-full p-2 rounded-lg border border-border bg-surface">
            <option value="never">Never</option>
            <option value="1h">1 hour</option>
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        </label>
        <label className="flex items-end gap-2 text-sm pb-2">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-primary" />
          Public
        </label>
      </div>

      <Button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create paste'}</Button>

      {created && (
        <div className="p-4 rounded-xl border border-border bg-surface-muted space-y-2">
          <p className="text-sm text-text-muted">Your paste URL</p>
          <a href={created.url} target="_blank" rel="noreferrer" className="text-primary font-mono text-sm break-all">{fullUrl}</a>
          <div>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(fullUrl); toast('Copied', 'success'); }}>Copy link</Button>
          </div>
        </div>
      )}
    </div>
  );
}
