-- Migration 007: Add scan_files setting
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default value (false = don't scan files by default)
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('scan_files', 'false');
