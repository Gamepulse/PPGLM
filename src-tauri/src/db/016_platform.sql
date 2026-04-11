-- Migration 016: Add platform field to games table
ALTER TABLE games ADD COLUMN platform TEXT;
