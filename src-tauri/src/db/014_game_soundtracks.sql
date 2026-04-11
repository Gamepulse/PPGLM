-- Migration 014: Add game soundtracks support
-- Stores VGMdb links and Spotify URIs for game soundtracks

CREATE TABLE IF NOT EXISTS game_soundtracks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    vgmdb_album_id  INTEGER,
    vgmdb_url       TEXT,
    album_title     TEXT,
    album_artist    TEXT,
    release_date    TEXT,
    cover_url       TEXT,
    spotify_uri     TEXT,
    spotify_url     TEXT,
    track_count     INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_soundtracks_game_id ON game_soundtracks(game_id);
CREATE INDEX IF NOT EXISTS idx_soundtracks_vgmdb_id ON game_soundtracks(vgmdb_album_id);

-- Add soundtrack-related columns to games table for quick access
ALTER TABLE games ADD COLUMN has_soundtrack INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN soundtrack_fetched_at TEXT;
