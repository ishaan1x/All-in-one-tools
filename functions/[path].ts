import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  ADMIN_EMAIL?: string;
};

type User = { id: string; email: string; display_name: string | null; role: 'user' | 'admin' };

const app = new Hono<{ Bindings: Bindings; Variables: { user: User | null } }>();

app.use('/api/*', cors());
app.use('/api/*', async (c, next) => {
  c.set('user', await getUserFromRequest(c));
  await next();
});

// ---------- Crypto helpers ----------
const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? enc.encode(data) : data;
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256
  );
  return `${b64url(salt)}:${b64url(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':');
  const salt = b64urlDecode(saltB64);
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256
  );
  return b64url(new Uint8Array(bits)) === hashB64;
}

async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${b64url(new Uint8Array(sig))}`;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), enc.encode(`${header}.${body}`));
  if (!ok) return null;
  try {
    return JSON.parse(dec.decode(b64urlDecode(body)));
  } catch {
    return null;
  }
}

async function getUserFromRequest(c: { req: { header: (n: string) => string | undefined }; env: Bindings }): Promise<User | null> {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const payload = await verifyJWT(auth.slice(7), c.env.JWT_SECRET);
  if (!payload || typeof payload.sub !== 'string') return null;
  const user = await c.env.DB.prepare(
    `SELECT id, email, display_name, role FROM users WHERE id = ? AND deleted_at IS NULL`
  ).bind(payload.sub).first<User>();
  return user ?? null;
}

// ---------- Health ----------
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// ---------- Auth ----------
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string; displayName?: string }>();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  const displayName = body.displayName?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'Invalid email' }, 400);
  if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);

  const existing = await c.env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first();
  if (existing) return c.json({ error: 'Email already registered' }, 409);

  const id = crypto.randomUUID();
  const hash = await hashPassword(password);
  const role = c.env.ADMIN_EMAIL && email === c.env.ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

  await c.env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, email, hash, displayName, role).run();

  const token = await signJWT({ sub: id }, c.env.JWT_SECRET);
  return c.json({ token, user: { id, email, displayName, role } }, 201);
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.password) return c.json({ error: 'Missing credentials' }, 400);

  const row = await c.env.DB.prepare(
    `SELECT id, email, password_hash, display_name, role FROM users WHERE email = ? AND deleted_at IS NULL`
  ).bind(email).first<{ id: string; email: string; password_hash: string; display_name: string | null; role: 'user' | 'admin' }>();

  if (!row || !(await verifyPassword(body.password, row.password_hash))) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const token = await signJWT({ sub: row.id }, c.env.JWT_SECRET);
  return c.json({ token, user: { id: row.id, email: row.email, displayName: row.display_name, role: row.role } });
});

app.get('/api/auth/me', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ id: user.id, email: user.email, displayName: user.display_name, role: user.role });
});

app.delete('/api/auth/account', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  await c.env.DB.prepare(`UPDATE users SET deleted_at = datetime('now') WHERE id = ?`).bind(user.id).run();
  return c.json({ ok: true });
});

// ---------- Short Links ----------
function generateId(len = 7): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function isValidUrl(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === 'http:' || p.protocol === 'https:';
  } catch {
    return false;
  }
}

app.post('/api/links', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ url?: string; alias?: string; expiresAt?: string }>();
  const url = body.url?.trim();
  if (!url || !isValidUrl(url)) return c.json({ error: 'Invalid URL (http/https required)' }, 400);

  let alias: string | null = null;
  if (body.alias) {
    if (!/^[a-zA-Z0-9_-]{2,32}$/.test(body.alias)) return c.json({ error: 'Alias must be 2-32 alphanumeric chars' }, 400);
    const taken = await c.env.DB.prepare(`SELECT id FROM short_links WHERE alias = ? OR id = ?`).bind(body.alias, body.alias).first();
    if (taken) return c.json({ error: 'Alias already taken' }, 409);
    alias = body.alias;
  }

  const id = generateId();
  await c.env.DB.prepare(
    `INSERT INTO short_links (id, user_id, original_url, alias, expires_at) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, user?.id ?? null, url, alias, body.expiresAt ?? null).run();

  const shortId = alias ?? id;
  return c.json({ id, alias, shortUrl: `/s/${shortId}` }, 201);
});

app.get('/api/links', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await c.env.DB.prepare(
    `SELECT id, original_url as originalUrl, alias, clicks, expires_at as expiresAt, created_at as createdAt
     FROM short_links WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(user.id).all();
  return c.json({ links: rows.results });
});

app.delete('/api/links/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const link = await c.env.DB.prepare(`SELECT user_id FROM short_links WHERE id = ?`).bind(id).first<{ user_id: string | null }>();
  if (!link) return c.json({ error: 'Not found' }, 404);
  if (link.user_id !== user.id && user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  await c.env.DB.prepare(`DELETE FROM short_links WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

// Server-side redirect for /s/:id
app.get('/s/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(
    `SELECT id, original_url, expires_at FROM short_links WHERE id = ? OR alias = ?`
  ).bind(id, id).first<{ id: string; original_url: string; expires_at: string | null }>();
  if (!row) return c.text('Short link not found', 404);
  if (row.expires_at && new Date(row.expires_at) < new Date()) return c.text('Link expired', 410);

  try {
    c.executionCtx.waitUntil(
      Promise.all([
        c.env.DB.prepare(`UPDATE short_links SET clicks = clicks + 1 WHERE id = ?`).bind(row.id).run(),
        c.env.DB.prepare(`INSERT INTO click_events (link_id, referrer, user_agent) VALUES (?, ?, ?)`)
          .bind(row.id, c.req.header('Referer') ?? null, c.req.header('User-Agent') ?? null).run(),
      ])
    );
  } catch { /* ignore */ }

  return c.redirect(row.original_url, 302);
});

// ---------- Bio Pages ----------
app.post('/api/bio', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json<{ username?: string; displayName?: string; bio?: string; theme?: string; background?: string }>();
  const username = body.username?.trim().toLowerCase();
  if (!username || !/^[a-z0-9_-]{3,24}$/.test(username)) return c.json({ error: 'Username must be 3-24 alphanumeric chars' }, 400);

  const existing = await c.env.DB.prepare(`SELECT id FROM bio_pages WHERE user_id = ?`).bind(user.id).first();
  if (existing) return c.json({ error: 'You already have a bio page' }, 409);

  const takenUser = await c.env.DB.prepare(`SELECT id FROM bio_pages WHERE username = ?`).bind(username).first();
  if (takenUser) return c.json({ error: 'Username taken' }, 409);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO bio_pages (id, user_id, username, display_name, bio, theme, background) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, username, body.displayName ?? null, body.bio ?? null, body.theme ?? 'default', body.background ?? null).run();

  return c.json({ id, username, url: `/b/${username}` }, 201);
});

app.get('/api/bio/me', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const page = await c.env.DB.prepare(
    `SELECT id, username, display_name as displayName, bio, theme, background FROM bio_pages WHERE user_id = ?`
  ).bind(user.id).first();
  if (!page) return c.json({ page: null });
  const links = await c.env.DB.prepare(
    `SELECT id, label, url, sort_order as sortOrder FROM bio_links WHERE bio_page_id = ? ORDER BY sort_order ASC`
  ).bind((page as any).id).all();
  return c.json({ page, links: links.results });
});

app.put('/api/bio', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json<{ displayName?: string; bio?: string; theme?: string; background?: string }>();
  await c.env.DB.prepare(
    `UPDATE bio_pages SET display_name = COALESCE(?, display_name), bio = COALESCE(?, bio),
     theme = COALESCE(?, theme), background = COALESCE(?, background) WHERE user_id = ?`
  ).bind(body.displayName ?? null, body.bio ?? null, body.theme ?? null, body.background ?? null, user.id).run();
  return c.json({ ok: true });
});

app.get('/api/bio/:username', async (c) => {
  const username = c.req.param('username').toLowerCase();
  const page = await c.env.DB.prepare(
    `SELECT id, username, display_name as displayName, bio, theme, background FROM bio_pages WHERE username = ?`
  ).bind(username).first<{ id: string; username: string; displayName: string | null; bio: string | null; theme: string; background: string | null }>();
  if (!page) return c.json({ error: 'Not found' }, 404);
  const links = await c.env.DB.prepare(
    `SELECT id, label, url FROM bio_links WHERE bio_page_id = ? ORDER BY sort_order ASC`
  ).bind(page.id).all();
  return c.json({ page, links: links.results });
});

app.post('/api/bio/links', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json<{ label?: string; url?: string }>();
  if (!body.label || !body.url || !isValidUrl(body.url)) return c.json({ error: 'Invalid label or URL' }, 400);
  const page = await c.env.DB.prepare(`SELECT id FROM bio_pages WHERE user_id = ?`).bind(user.id).first<{ id: string }>();
  if (!page) return c.json({ error: 'Create a bio page first' }, 400);
  const max = await c.env.DB.prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM bio_links WHERE bio_page_id = ?`).bind(page.id).first<{ next: number }>();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO bio_links (id, bio_page_id, label, url, sort_order) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, page.id, body.label, body.url, max?.next ?? 0).run();
  return c.json({ id }, 201);
});

app.delete('/api/bio/links/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(
    `SELECT bl.id FROM bio_links bl JOIN bio_pages bp ON bl.bio_page_id = bp.id WHERE bl.id = ? AND bp.user_id = ?`
  ).bind(id, user.id).first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  await c.env.DB.prepare(`DELETE FROM bio_links WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

// ---------- Pastes (extend Stage 1) ----------
app.get('/api/pastes', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await c.env.DB.prepare(
    `SELECT id, title, is_public as isPublic, expires_at as expiresAt, created_at as createdAt FROM pastes WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(user.id).all();
  return c.json({ pastes: rows.results });
});

app.post('/api/share/paste', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ title?: string; content: string; isPublic: boolean; expiresAt?: string }>();
  if (!body.content || body.content.length > 500_000) return c.json({ error: 'Content required (max 500KB)' }, 400);
  const id = generateId(8);
  await c.env.DB.prepare(
    `INSERT INTO pastes (id, user_id, title, content, is_public, expires_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, user?.id ?? null, body.title || 'Untitled', body.content, body.isPublic ? 1 : 0, body.expiresAt ?? null).run();
  return c.json({ id, url: `/p/${id}` }, 201);
});

app.get('/api/share/paste/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(
    `SELECT id, title, content, is_public, expires_at FROM pastes WHERE id = ?`
  ).bind(id).first<{ id: string; title: string; content: string; is_public: number; expires_at: string | null }>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  if (row.expires_at && new Date(row.expires_at) < new Date()) return c.json({ error: 'Expired' }, 410);
  if (!row.is_public) return c.json({ error: 'Private paste' }, 403);
  return c.json({ id: row.id, title: row.title, content: row.content });
});

app.delete('/api/pastes/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(`SELECT user_id FROM pastes WHERE id = ?`).bind(id).first<{ user_id: string | null }>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  if (row.user_id !== user.id && user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  await c.env.DB.prepare(`DELETE FROM pastes WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

// ---------- Admin ----------
async function requireAdmin(c: any) {
  const user = c.get('user');
  if (!user || user.role !== 'admin') return false;
  return true;
}

app.get('/api/admin/stats', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: 'Forbidden' }, 403);
  const [users, links, notes, pastes, bios] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM users WHERE deleted_at IS NULL`).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM short_links`).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM notes`).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM pastes`).first<{ n: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM bio_pages`).first<{ n: number }>(),
  ]);
  return c.json({
    users: users?.n ?? 0, links: links?.n ?? 0, notes: notes?.n ?? 0,
    pastes: pastes?.n ?? 0, bios: bios?.n ?? 0,
  });
});

app.get('/api/admin/users', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: 'Forbidden' }, 403);
  const rows = await c.env.DB.prepare(
    `SELECT id, email, display_name as displayName, role, created_at as createdAt FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 200`
  ).all();
  return c.json({ users: rows.results });
});

app.delete('/api/admin/content/:type/:id', async (c) => {
  if (!(await requireAdmin(c))) return c.json({ error: 'Forbidden' }, 403);
  const { type, id } = c.req.param();
  const tables: Record<string, string> = { paste: 'pastes', note: 'notes', link: 'short_links', bio: 'bio_pages' };
  const table = tables[type];
  if (!table) return c.json({ error: 'Unknown type' }, 400);
  await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

// ---------- SPA fallback with API + /s/ passthrough ----------
export const onRequest: PagesFunction<Bindings> = async (ctx) => {
  const url = new URL(ctx.request.url);

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/s/')) {
    return app.fetch(ctx.request, ctx.env, ctx);
  }

  const assetRes = await ctx.env.ASSETS.fetch(ctx.request);
  if (assetRes.status !== 404) return assetRes;

  return ctx.env.ASSETS.fetch(new Request(new URL('/index.html', url), ctx.request));
};
