-- Migration 005: Add synopsis field to games table
ALTER TABLE games ADD COLUMN synopsis TEXT;
