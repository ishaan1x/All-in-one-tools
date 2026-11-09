import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

interface NoteRow {
  id: string; title: string; contentHtml: string; contentJson: string;
  isPublic: boolean; updatedAt: string;
}

export default function Notes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, LinkExtension.configure({ openOnClick: false })],
    content: '<p></p>',
    editorProps: { attributes: { class: 'prose max-w-none min-h-[300px] p-4 focus:outline-none' } },
  });

  // Load own notes
  useEffect(() => {
    if (!user) return;
    api<{ notes: NoteRow[] }>('/api/notes').then((d) => setNotes(d.notes)).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="p-8 rounded-xl border border-border text-center">
        <p className="mb-4">Sign in to create notes.</p>
        <Link to="/login"><Button>Sign in</Button></Link>
      </div>
    );
  }

  const loadNote = (n: NoteRow) => {
    setActiveId(n.id);
    setTitle(n.title);
    setIsPublic(n.isPublic);
    editor?.commands.setContent(n.contentHtml || '<p></p>');
  };

  const newNote = () => {
    setActiveId(null);
    setTitle('');
    setIsPublic(false);
    editor?.commands.setContent('<p></p>');
  };

  const save = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const contentHtml = editor.getHTML();
      const contentJson = JSON.stringify(editor.getJSON());
      if (activeId) {
        await api(`/api/notes/${activeId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, contentHtml, contentJson, isPublic }),
        });
      } else {
        const res = await api<{ id: string }>('/api/notes', {
          method: 'POST',
          body: JSON.stringify({ title, contentHtml, contentJson, isPublic }),
        });
        setActiveId(res.id);
      }
      const refreshed = await api<{ notes: NoteRow[] }>('/api/notes');
      setNotes(refreshed.notes);
      toast('Saved', 'success');
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await api(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes((p) => p.filter((n) => n.id !== id));
    if (activeId === id) newNote();
  };

  const shareUrl = activeId && isPublic ? `${window.location.origin}/n/${activeId}` : null;

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-3">
        <Button onClick={newNote} className="w-full">+ New note</Button>
        <div className="space-y-1">
          {notes.map((n) => (
            <button key={n.id} onClick={() => loadNote(n)}
              className={`w-full text-left p-2 rounded-lg text-sm truncate ${activeId === n.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-muted'}`}>
              {n.title || 'Untitled'}
              {n.isPublic && <span className="ml-1 text-xs opacity-70">🌐</span>}
            </button>
          ))}
          {notes.length === 0 && <p className="text-xs text-text-muted p-2">No notes yet.</p>}
        </div>
      </aside>

      <div className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title"
          className="w-full p-3 rounded-lg border border-border bg-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary" />

        <div className="flex flex-wrap gap-1 p-2 rounded-lg border border-border bg-surface-muted">
          {[
            ['Bold', () => editor?.chain().focus().toggleBold().run(), editor?.isActive('bold')],
            ['Italic', () => editor?.chain().focus().toggleItalic().run(), editor?.isActive('italic')],
            ['H1', () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), editor?.isActive('heading', { level: 1 })],
            ['H2', () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), editor?.isActive('heading', { level: 2 })],
            ['• List', () => editor?.chain().focus().toggleBulletList().run(), editor?.isActive('bulletList')],
            ['1. List', () => editor?.chain().focus().toggleOrderedList().run(), editor?.isActive('orderedList')],
            ['Code', () => editor?.chain().focus().toggleCodeBlock().run(), editor?.isActive('codeBlock')],
          ].map(([label, fn, active]: any) => (
            <button key={label} onClick={fn}
              className={`px-2 py-1 rounded text-sm ${active ? 'bg-primary text-white' : 'hover:bg-surface'}`}>{label}</button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <EditorContent editor={editor} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-primary" />
            Publish publicly
          </label>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          {activeId && <Button variant="outline" onClick={() => remove(activeId)}>Delete</Button>}
        </div>

        {shareUrl && (
          <div className="p-3 rounded-lg bg-surface-muted text-sm">
            Public URL:{' '}
            <a href={`/n/${activeId}`} target="_blank" rel="noreferrer" className="text-primary font-mono">{shareUrl}</a>
            <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(shareUrl); toast('Copied', 'success'); }}>Copy</Button>
          </div>
        )}
      </div>
    </div>
  );
}
