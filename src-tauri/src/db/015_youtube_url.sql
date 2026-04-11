-- Migration 015: Add YouTube URL support for soundtracks
ALTER TABLE game_soundtracks ADD COLUMN youtube_url TEXT;
