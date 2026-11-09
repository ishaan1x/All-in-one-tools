import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { api } from '@/services/api';

export default function PasteView() {
  const { id } = useParams<{ id: string }>();
  const [paste, setPaste] = useState<{ title: string; content: string; language: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api<{ title: string; content: string; language: string }>(`/api/share/paste/${id}`)
      .then((d) => {
        setPaste(d);
        document.title = `${d.title || 'Paste'} — Pastebin`;
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!paste) return <div className="text-center py-20">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{paste.title || 'Untitled Paste'}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(paste.content)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-surface-muted"
          >Copy</button>
          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(paste.content)}`}
            download={`paste-${id}.txt`}
            className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-surface-muted"
          >Download</a>
        </div>
      </div>
      <SyntaxHighlighter
        language={paste.language || 'plaintext'}
        style={oneDark}
        customStyle={{ borderRadius: '0.75rem', margin: 0, fontSize: '0.875rem' }}
        wrapLongLines
      >
        {paste.content}
      </SyntaxHighlighter>
    </div>
  );
}
