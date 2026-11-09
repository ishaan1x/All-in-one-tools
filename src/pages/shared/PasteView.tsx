import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getShare } from '@/services/shareEngine';

export default function PasteView() {
  const { id } = useParams<{ id: string }>();
  const [paste, setPaste] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getShare('paste', id)
      .then((data) => {
        setPaste(data);
        document.title = `${data.title || 'Paste'} — AllInOne Tools`;
      })
      .catch(() => setError('Paste not found or has expired.'));
  }, [id]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!paste) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{paste.title || 'Untitled Paste'}</h1>
      <pre className="p-6 rounded-xl border border-border bg-surface-muted overflow-auto text-sm font-mono whitespace-pre-wrap">
        {paste.content}
      </pre>
    </div>
  );
}
