-- IGDB credentials storage
CREATE TABLE IF NOT EXISTS igdb_credentials (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    client_id     TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- IGDB OAuth token cache
CREATE TABLE IF NOT EXISTS igdb_token_cache (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    access_token TEXT NOT NULL,
    expires_at   TEXT NOT NULL
);

-- IGDB game data cache
CREATE TABLE IF NOT EXISTS igdb_cache (
    igdb_id      INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    data         TEXT NOT NULL,
    fetched_at   TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at   TEXT NOT NULL
);

-- IGDB games list for fast matching
CREATE TABLE IF NOT EXISTS igdb_games_cache (
    igdb_id      INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    fetched_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_igdb_games_name ON igdb_games_cache(name);
