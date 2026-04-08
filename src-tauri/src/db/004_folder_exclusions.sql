-- Migration 004: Folder name exclusions
CREATE TABLE IF NOT EXISTS folder_exclusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL UNIQUE,
    is_regex BOOLEAN NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default exclusions
INSERT OR IGNORE INTO folder_exclusions (pattern, is_regex) VALUES
    ('content', 0),
    ('bin', 0),
    ('obj', 0),
    ('lib', 0),
    ('include', 0),
    ('src', 0),
    ('source', 0),
    ('assets', 0),
    ('resources', 0),
    ('data', 0),
    ('media', 0),
    ('common', 0),
    ('shared', 0),
    ('engine', 0),
    ('core', 0),
    ('plugins', 0),
    ('mods', 0),
    ('workshop', 0),
    ('download', 0),
    ('downloads', 0),
    ('backup', 0),
    ('backups', 0),
    ('old', 0),
    ('archive', 0),
    ('archives', 0);
