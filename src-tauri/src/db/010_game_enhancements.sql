-- Migration 010: Add play time, completion status, and other game enhancements

-- Add play_time field (in hours)
ALTER TABLE games ADD COLUMN play_time REAL DEFAULT 0;

-- Add completion_status field
-- Values: 'not_started', 'playing', 'completed', 'dropped', 'wishlist'
ALTER TABLE games ADD COLUMN completion_status TEXT DEFAULT 'not_started';

-- Add is_favorite flag
ALTER TABLE games ADD COLUMN is_favorite INTEGER DEFAULT 0;

-- Add last_played timestamp
ALTER TABLE games ADD COLUMN last_played TEXT;

-- Add executable_path for launching games
ALTER TABLE games ADD COLUMN executable_path TEXT;

-- Add store_links JSON field for Steam, GOG, Epic, etc.
ALTER TABLE games ADD COLUMN store_links TEXT;

-- Create index for completion_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_games_completion_status ON games(completion_status);

-- Create index for is_favorite
CREATE INDEX IF NOT EXISTS idx_games_is_favorite ON games(is_favorite);

-- Create index for play_time
CREATE INDEX IF NOT EXISTS idx_games_play_time ON games(play_time);
