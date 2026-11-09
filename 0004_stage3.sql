-- Enrich notes with HTML + JSON (for Tiptap) alongside plain content
ALTER TABLE notes ADD COLUMN content_html TEXT;
ALTER TABLE notes ADD COLUMN content_json TEXT;
ALTER TABLE notes ADD COLUMN language TEXT DEFAULT 'plaintext';

-- Pastes already have language; ensure index for public listing
CREATE INDEX IF NOT EXISTS idx_notes_public_created ON notes(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pastes_public_created ON pastes(is_public, created_at DESC);
