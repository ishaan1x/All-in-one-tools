// ---------- Notes ----------
app.get('/api/notes', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await c.env.DB.prepare(
    `SELECT id, title, content_html as contentHtml, content_json as contentJson,
            language, is_public as isPublic, expires_at as expiresAt,
            created_at as createdAt, updated_at as updatedAt
     FROM notes WHERE user_id = ? ORDER BY updated_at DESC`
  ).bind(user.id).all();
  return c.json({ notes: rows.results });
});

app.post('/api/notes', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{
    title?: string; contentHtml: string; contentJson?: string;
    language?: string; isPublic: boolean; expiresAt?: string;
  }>();
  if (!body.contentHtml || body.contentHtml.length > 1_000_000) {
    return c.json({ error: 'Content required (max 1MB)' }, 400);
  }
  const id = generateId(10);
  await c.env.DB.prepare(
    `INSERT INTO notes (id, user_id, title, content, content_html, content_json, language, is_public, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, user?.id ?? null,
    body.title || 'Untitled',
    body.contentHtml.replace(/<[^>]+>/g, ''), // plain fallback
    body.contentHtml,
    body.contentJson ?? null,
    body.language ?? 'plaintext',
    body.isPublic ? 1 : 0,
    body.expiresAt ?? null
  ).run();
  return c.json({ id, url: `/n/${id}` }, 201);
});

app.put('/api/notes/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(`SELECT user_id FROM notes WHERE id = ?`).bind(id).first<{ user_id: string | null }>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  if (row.user_id !== user.id && user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

  const body = await c.req.json<{
    title?: string; contentHtml?: string; contentJson?: string;
    language?: string; isPublic?: boolean; expiresAt?: string | null;
  }>();
  await c.env.DB.prepare(
    `UPDATE notes SET
       title = COALESCE(?, title),
       content_html = COALESCE(?, content_html),
       content_json = COALESCE(?, content_json),
       content = COALESCE(?, content),
       language = COALESCE(?, language),
       is_public = COALESCE(?, is_public),
       expires_at = COALESCE(?, expires_at),
       updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    body.title ?? null,
    body.contentHtml ?? null,
    body.contentJson ?? null,
    body.contentHtml?.replace(/<[^>]+>/g, '') ?? null,
    body.language ?? null,
    body.isPublic === undefined ? null : (body.isPublic ? 1 : 0),
    body.expiresAt === undefined ? null : body.expiresAt,
    id
  ).run();
  return c.json({ ok: true });
});

app.delete('/api/notes/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(`SELECT user_id FROM notes WHERE id = ?`).bind(id).first<{ user_id: string | null }>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  if (row.user_id !== user.id && user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  await c.env.DB.prepare(`DELETE FROM notes WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

app.get('/api/share/note/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(
    `SELECT id, title, content_html as contentHtml, content_json as contentJson,
            language, is_public, expires_at
     FROM notes WHERE id = ?`
  ).bind(id).first<{
    id: string; title: string; contentHtml: string | null; contentJson: string | null;
    language: string; is_public: number; expires_at: string | null;
  }>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return c.json({ error: 'Note has expired' }, 410);
  }
  if (!row.is_public) return c.json({ error: 'This note is private' }, 403);
  return c.json({
    id: row.id, title: row.title,
    contentHtml: row.contentHtml, contentJson: row.contentJson,
    language: row.language,
  });
});
