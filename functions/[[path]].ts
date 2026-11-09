import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = { DB: D1Database; JWT_SECRET: string };
const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// --- Share Engine: Paste ---
app.post('/api/share/paste', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{ title?: string; content: string; isPublic: boolean; expiresAt?: string }>();
  if (!body.content || body.content.length > 500_000) {
    return c.json({ error: 'Content required (max 500KB)' }, 400);
  }
  const id = crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();
  const expires = body.expiresAt || null;
  await db.prepare(
    `INSERT INTO pastes (id, title, content, is_public, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, body.title || 'Untitled', body.content, body.isPublic ? 1 : 0, expires, now).run();
  return c.json({ id, url: `/p/${id}` }, 201);
});

app.get('/api/share/paste/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await db.prepare(
    `SELECT id, title, content, is_public, expires_at FROM pastes WHERE id = ?`
  ).bind(id).first<{ id: string; title: string; content: string; is_public: number; expires_at: string | null }>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return c.json({ error: 'Paste has expired' }, 410);
  }
  if (!row.is_public) {
    // Stage 2: check auth ownership; for now reject private pastes
    return c.json({ error: 'This paste is private' }, 403);
  }
  return c.json({ id: row.id, title: row.title, content: row.content });
});

// Placeholder routes for future stages
app.post('/api/share/note', (c) => c.json({ error: 'Coming in Stage 3' }, 501));
app.post('/api/share/link', (c) => c.json({ error: 'Coming in Stage 2' }, 501));
app.post('/api/share/bio', (c) => c.json({ error: 'Coming in Stage 2' }, 501));

export const onRequest = app.fetch;
