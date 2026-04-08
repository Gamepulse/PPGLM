-- Migration 006: Add release_date field to games table
ALTER TABLE games ADD COLUMN release_date TEXT;
