-- Track individual clicks for analytics
CREATE TABLE IF NOT EXISTS click_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id TEXT NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
  referrer TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_bio_pages_username ON bio_pages(username);
CREATE INDEX IF NOT EXISTS idx_pastes_user ON pastes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_public ON notes(is_public);
CREATE INDEX IF NOT EXISTS idx_click_events_link ON click_events(link_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
