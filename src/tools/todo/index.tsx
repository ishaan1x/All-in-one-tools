import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

interface Task {
  id: string; title: string; notes: string | null; priority: 'low' | 'medium' | 'high';
  category: string | null; dueDate: string | null; completed: number; createdAt: string;
}

type Filter = 'all' | 'active' | 'completed';
const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  low: 'bg-green-500/10 text-green-600 border-green-500/30',
};

export default function Todo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    try {
      const d = await api<{ tasks: Task[] }>('/api/tasks');
      setTasks(d.tasks);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user]);

  if (!user) return (
    <div className="p-8 rounded-xl border border-border text-center">
      <p className="mb-4">Sign in to use the To-Do List.</p>
      <Link to="/login"><Button>Sign in</Button></Link>
    </div>
  );

  const create = async () => {
    if (!title.trim()) return;
    try {
      await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title, priority,
          category: category || undefined,
          dueDate: dueDate || undefined,
        }),
      });
      setTitle(''); setCategory(''); setDueDate(''); setPriority('medium');
      await load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const toggle = async (t: Task) => {
    await api(`/api/tasks/${t.id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: !t.completed }),
    });
    load();
  };

  const remove = async (id: string) => {
    await api(`/api/tasks/${id}`, { method: 'DELETE' });
    load();
  };

  const categories = useMemo(
    () => [...new Set(tasks.map((t) => t.category).filter(Boolean) as string[])],
    [tasks]
  );

  const visible = tasks.filter((t) => {
    if (filter === 'active' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.completed).length,
    active: tasks.filter((t) => !t.completed).length,
    overdue: tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length,
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[['Total', stats.total, ''], ['Active', stats.active, 'text-primary'], ['Done', stats.done, 'text-green-600'], ['Overdue', stats.overdue, 'text-red-500']].map(([l, v, c]: any) => (
          <div key={l} className="p-3 rounded-lg border border-border text-center">
            <p className="text-xs text-text-muted">{l}</p>
            <p className={`text-xl font-bold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-border space-y-2">
        <div className="flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="New task…"
            className="flex-1 p-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary" />
          <Button onClick={create}>Add</Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="p-2 rounded-lg border border-border bg-surface text-sm">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="p-2 rounded-lg border border-border bg-surface text-sm" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="p-2 rounded-lg border border-border bg-surface text-sm" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {(['all', 'active', 'completed'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-sm ${filter === f ? 'bg-primary text-white' : 'border border-border hover:bg-surface-muted'}`}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="ml-auto p-1.5 rounded-lg border border-border bg-surface text-sm">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
          className="p-1.5 rounded-lg border border-border bg-surface text-sm w-40" />
      </div>

      {loading ? <p>Loading…</p> : visible.length === 0 ? (
        <p className="text-center text-text-muted py-8">No tasks match your filters.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => (
            <div key={t.id} className="p-3 rounded-lg border border-border flex items-center gap-3">
              <input type="checkbox" checked={!!t.completed} onChange={() => toggle(t)} className="w-5 h-5 accent-primary" />
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${t.completed ? 'line-through text-text-muted' : ''} truncate`}>{t.title}</p>
                <div className="flex gap-2 text-xs mt-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                  {t.category && <span className="px-2 py-0.5 rounded-full bg-surface-muted">{t.category}</span>}
                  {t.dueDate && (
                    <span className={new Date(t.dueDate) < new Date() && !t.completed ? 'text-red-500' : 'text-text-muted'}>
                      📅 {t.dueDate}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" onClick={() => remove(t.id)}>×</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
