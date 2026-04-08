-- Migration 008: Add genres, game_modes, player_perspectives, themes tables
-- and their relationships with games

-- Table for genres
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Table for game modes
CREATE TABLE IF NOT EXISTS game_modes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Table for player perspectives
CREATE TABLE IF NOT EXISTS player_perspectives (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Table for themes
CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Junction table: games <-> genres
CREATE TABLE IF NOT EXISTS game_genres (
    game_id INTEGER NOT NULL,
    genre_id INTEGER NOT NULL,
    PRIMARY KEY (game_id, genre_id),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Junction table: games <-> game_modes
CREATE TABLE IF NOT EXISTS game_game_modes (
    game_id INTEGER NOT NULL,
    game_mode_id INTEGER NOT NULL,
    PRIMARY KEY (game_id, game_mode_id),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (game_mode_id) REFERENCES game_modes(id) ON DELETE CASCADE
);

-- Junction table: games <-> player_perspectives
CREATE TABLE IF NOT EXISTS game_player_perspectives (
    game_id INTEGER NOT NULL,
    player_perspective_id INTEGER NOT NULL,
    PRIMARY KEY (game_id, player_perspective_id),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_perspective_id) REFERENCES player_perspectives(id) ON DELETE CASCADE
);

-- Junction table: games <-> themes
CREATE TABLE IF NOT EXISTS game_themes (
    game_id INTEGER NOT NULL,
    theme_id INTEGER NOT NULL,
    PRIMARY KEY (game_id, theme_id),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);

-- Add igdb_rating column to games (the rating from IGDB, different from personal_rating)
ALTER TABLE games ADD COLUMN igdb_rating REAL;

-- Insert some default genres
INSERT OR IGNORE INTO genres (id, name) VALUES 
    (1, 'Shooter'), (2, 'Adventure'), (3, 'RPG'), (4, 'Strategy'), 
    (5, 'Simulation'), (6, 'Sports'), (7, 'Racing'), (8, 'Puzzle'),
    (9, 'Platform'), (10, 'Fighting'), (11, 'Action'), (12, 'Indie');

-- Insert some default game modes
INSERT OR IGNORE INTO game_modes (id, name) VALUES 
    (1, 'Single player'), (2, 'Multiplayer'), (3, 'Co-operative'), 
    (4, 'Split screen'), (5, 'Massively Multiplayer Online (MMO)');

-- Insert some default player perspectives
INSERT OR IGNORE INTO player_perspectives (id, name) VALUES 
    (1, 'First person'), (2, 'Third person'), (3, 'Side view'), 
    (4, 'Bird view / Isometric'), (5, 'Text'), (6, 'Virtual Reality');

-- Insert some default themes
INSERT OR IGNORE INTO themes (id, name) VALUES 
    (1, 'Fantasy'), (2, 'Sci-Fi'), (3, 'Horror'), (4, 'Historical'),
    (5, 'Military'), (6, 'Stealth'), (7, 'Survival'), (8, 'Comedy');
