CREATE INDEX idx_short_links_alias ON short_links(alias);
CREATE INDEX idx_short_links_user ON short_links(user_id);
CREATE INDEX idx_pastes_id ON pastes(id);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_tool_usage_slug ON tool_usage(tool_slug);
