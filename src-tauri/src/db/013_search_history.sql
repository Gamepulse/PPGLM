-- Migration 013: Add search history table

-- Search history for quick access
CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    filters TEXT, -- JSON string of applied filters
    searched_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Keep only last 20 searches
CREATE INDEX IF NOT EXISTS idx_search_history_date ON search_history(searched_at);
