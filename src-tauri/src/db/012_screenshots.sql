-- Migration 012: Create screenshots table

-- Screenshots table for storing game screenshots
CREATE TABLE IF NOT EXISTS screenshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    caption TEXT,
    is_cover INTEGER DEFAULT 0, -- Can use screenshot as cover image
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_screenshots_game_id ON screenshots(game_id);
