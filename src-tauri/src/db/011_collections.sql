-- Migration 011: Create collections table

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_system INTEGER DEFAULT 0, -- 1 for system collections like Favorites, Wishlist
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Game-Collection relationship table
CREATE TABLE IF NOT EXISTS game_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    UNIQUE(game_id, collection_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_collections_game_id ON game_collections(game_id);
CREATE INDEX IF NOT EXISTS idx_game_collections_collection_id ON game_collections(collection_id);

-- Insert default system collections
INSERT OR IGNORE INTO collections (name, description, is_system, color) VALUES 
    ('Favorites', 'Your favorite games', 1, '#FFD700'),
    ('Currently Playing', 'Games you are currently playing', 1, '#00BFFF'),
    ('Backlog', 'Games you plan to play', 1, '#FF6B6B'),
    ('Wishlist', 'Games you want to buy', 1, '#9B59B6'),
    ('Completed', 'Games you have finished', 1, '#2ECC71');
