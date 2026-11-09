import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';

interface Bio { username: string; displayName: string | null; bio: string | null; theme: string; }
interface BioLink { id: string; label: string; url: string; }

export default function BioView() {
  const { username } = useParams<{ username: string }>();
  const [page, setPage] = useState<Bio | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    api<{ page: Bio; links: BioLink[] }>(`/api/bio/${username}`)
      .then((data) => { setPage(data.page); setLinks(data.links); document.title = `${data.page.displayName ?? data.page.username} — Bio`; })
      .catch(() => setError('Bio page not found.'));
  }, [username]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!page) return <div className="text-center py-20">Loading…</div>;

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center text-4xl">👤</div>
      <div>
        <h1 className="text-2xl font-bold">{page.displayName ?? page.username}</h1>
        <p className="text-text-muted text-sm mt-1">@{page.username}</p>
        {page.bio && <p className="mt-3 text-text-muted">{page.bio}</p>}
      </div>
      <div className="space-y-2">
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
            className="block w-full p-3 rounded-xl border border-border hover:bg-surface-muted transition font-medium">
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
