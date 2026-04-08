CREATE TABLE IF NOT EXISTS steam_cache (
    appid       INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    data        TEXT NOT NULL,
    fetched_at  TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS steam_applist_cache (
    appid       INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    fetched_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_steam_applist_name ON steam_applist_cache(name);
