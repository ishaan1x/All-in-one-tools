-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- Sessions / tokens (Stage 2)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Shortened links (Stage 2)
CREATE TABLE short_links (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  original_url TEXT NOT NULL,
  alias TEXT UNIQUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bio pages (Stage 2)
CREATE TABLE bio_pages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  theme TEXT DEFAULT 'default',
  background TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE bio_links (
  id TEXT PRIMARY KEY,
  bio_page_id TEXT NOT NULL REFERENCES bio_pages(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Notes (Stage 3)
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pastes (Stage 1: Create & Share example)
CREATE TABLE pastes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'plaintext',
  is_public INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tool usage analytics
CREATE TABLE tool_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_slug TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- App settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
