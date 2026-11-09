import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/services/api';

export default function NoteView() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ title: string; contentHtml: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api<{ title: string; contentHtml: string }>(`/api/share/note/${id}`)
      .then((d) => {
        setData(d);
        document.title = `${d.title} — Note`;
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!data) return <div className="text-center py-20">Loading…</div>;

  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{data.title}</h1>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.contentHtml }} />
    </article>
  );
}
