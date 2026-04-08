use tauri::State;
use crate::db::Database;
use std::fs;
use serde::Serialize;

// === Export/Import ===

#[derive(Debug, Serialize, serde::Deserialize)]
struct ExportData {
    version: String,
    exported_at: String,
    games: Vec<ExportGame>,
    tags: Vec<ExportTag>,
}

#[derive(Debug, Serialize, serde::Deserialize)]
struct ExportGame {
    id: i64,
    folder_name: String,
    folder_path: String,
    display_name: String,
    igdb_id: Option<i64>,
    personal_rating: Option<i64>,
    igdb_rating: Option<f64>,
    notes: Option<String>,
    cover_url: Option<String>,
    synopsis: Option<String>,
    release_date: Option<String>,
    tags: Vec<String>,
    genres: Vec<String>,
    game_modes: Vec<String>,
    player_perspectives: Vec<String>,
    themes: Vec<String>,
}

#[derive(Debug, Serialize, serde::Deserialize)]
struct ExportTag {
    id: i64,
    name: String,
    category: String,
}

#[tauri::command]
pub fn export_collection(export_path: String, db: State<'_, Database>) -> Result<String, String> {
    let conn = db.lock_conn()?;
    
    // Get all games with their metadata
    let mut games_stmt = conn.prepare(
        "SELECT id, folder_name, folder_path, display_name, igdb_id, \
         personal_rating, igdb_rating, notes, cover_url, synopsis, release_date \
         FROM games ORDER BY id"
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    
    let games: Vec<(i64, String, String, String, Option<i64>, Option<i64>, Option<f64>, Option<String>, Option<String>, Option<String>, Option<String>)> = games_stmt
        .query_map([], |row| {
            Ok((
                row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?,
                row.get(5)?, row.get(6)?, row.get(7)?, row.get(8)?, row.get(9)?,
                row.get(10)?,
            ))
        })
        .map_err(|e: rusqlite::Error| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    // Get all tags
    let mut tags_stmt = conn.prepare(
        "SELECT id, name, category FROM tags ORDER BY id"
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    
    let tags: Vec<(i64, String, String)> = tags_stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
        .map_err(|e: rusqlite::Error| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    // Build export data
    let export_data = ExportData {
        version: "1.0".to_string(),
        exported_at: chrono::Local::now().to_rfc3339(),
        games: games.into_iter().map(|(id, folder_name, folder_path, display_name, igdb_id, personal_rating, igdb_rating, notes, cover_url, synopsis, release_date)| {
            // Get tags for this game
            let mut game_tags_stmt = conn.prepare(
                "SELECT t.name FROM tags t \
                 JOIN game_tags gt ON t.id = gt.tag_id \
                 WHERE gt.game_id = ?1"
            ).unwrap();
            let game_tags: Vec<String> = game_tags_stmt
                .query_map([id], |row| row.get(0))
                .unwrap()
                .filter_map(|r| r.ok())
                .collect();
            
            // Get genres
            let mut game_genres_stmt = conn.prepare(
                "SELECT g.name FROM genres g \
                 JOIN game_genres gg ON g.id = gg.genre_id \
                 WHERE gg.game_id = ?1"
            ).unwrap();
            let game_genres: Vec<String> = game_genres_stmt
                .query_map([id], |row| row.get(0))
                .unwrap()
                .filter_map(|r| r.ok())
                .collect();
            
            // Get game modes
            let mut game_modes_stmt = conn.prepare(
                "SELECT gm.name FROM game_modes gm \
                 JOIN game_game_modes ggm ON gm.id = ggm.game_mode_id \
                 WHERE ggm.game_id = ?1"
            ).unwrap();
            let game_modes: Vec<String> = game_modes_stmt
                .query_map([id], |row| row.get(0))
                .unwrap()
                .filter_map(|r| r.ok())
                .collect();
            
            // Get player perspectives
            let mut game_perspectives_stmt = conn.prepare(
                "SELECT pp.name FROM player_perspectives pp \
                 JOIN game_player_perspectives gpp ON pp.id = gpp.player_perspective_id \
                 WHERE gpp.game_id = ?1"
            ).unwrap();
            let game_perspectives: Vec<String> = game_perspectives_stmt
                .query_map([id], |row| row.get(0))
                .unwrap()
                .filter_map(|r| r.ok())
                .collect();
            
            // Get themes
            let mut game_themes_stmt = conn.prepare(
                "SELECT t.name FROM themes t \
                 JOIN game_themes gt ON t.id = gt.theme_id \
                 WHERE gt.game_id = ?1"
            ).unwrap();
            let game_themes: Vec<String> = game_themes_stmt
                .query_map([id], |row| row.get(0))
                .unwrap()
                .filter_map(|r| r.ok())
                .collect();
            
            ExportGame {
                id, folder_name, folder_path, display_name, igdb_id, personal_rating, igdb_rating,
                notes, cover_url, synopsis, release_date,
                tags: game_tags,
                genres: game_genres,
                game_modes,
                player_perspectives: game_perspectives,
                themes: game_themes,
            }
        }).collect(),
        tags: tags.into_iter().map(|(id, name, category)| {
            ExportTag { id, name, category }
        }).collect(),
    };
    
    // Write to file
    let json = serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())?;
    fs::write(&export_path, json).map_err(|e| e.to_string())?;
    
    println!("[export_collection] Exported {} games to {}", export_data.games.len(), export_path);
    Ok(export_path)
}

#[tauri::command]
pub fn import_collection(import_path: String, db: State<'_, Database>) -> Result<usize, String> {
    let conn = db.lock_conn()?;
    
    // Read file
    let json = fs::read_to_string(&import_path).map_err(|e| e.to_string())?;
    let data: ExportData = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    
    let mut count = 0;
    
    // Import tags first
    for tag in &data.tags {
        conn.execute(
            "INSERT OR IGNORE INTO tags (id, name, category) VALUES (?1, ?2, ?3)",
            rusqlite::params![tag.id, tag.name, tag.category],
        ).map_err(|e: rusqlite::Error| e.to_string())?;
    }
    
    // Import games
    for game in &data.games {
        // Check if game already exists by folder_path
        let exists: bool = conn.query_row(
            "SELECT COUNT(*) FROM games WHERE folder_path = ?1",
            rusqlite::params![&game.folder_path],
            |row| Ok(row.get::<_, i64>(0)? > 0),
        ).unwrap_or(false);
        
        if exists {
            println!("[import_collection] Skipping existing game: {}", game.display_name);
            continue;
        }
        
        // Insert game
        conn.execute(
            "INSERT INTO games (folder_name, folder_path, display_name, igdb_id, \
             personal_rating, igdb_rating, notes, cover_url, synopsis, release_date) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                &game.folder_name,
                &game.folder_path,
                &game.display_name,
                game.igdb_id,
                game.personal_rating,
                game.igdb_rating,
                &game.notes,
                &game.cover_url,
                &game.synopsis,
                &game.release_date,
            ],
        ).map_err(|e: rusqlite::Error| e.to_string())?;
        
        let game_id = conn.last_insert_rowid();
        count += 1;
        
        // Insert tag relationships
        for tag_name in &game.tags {
            if let Ok(tag_id) = conn.query_row(
                "SELECT id FROM tags WHERE name = ?1",
                rusqlite::params![tag_name],
                |row| row.get::<_, i64>(0),
            ) {
                conn.execute(
                    "INSERT OR IGNORE INTO game_tags (game_id, tag_id) VALUES (?1, ?2)",
                    rusqlite::params![game_id, tag_id],
                ).ok();
            }
        }
        
        // Insert genre relationships
        for genre_name in &game.genres {
            if let Ok(genre_id) = conn.query_row(
                "SELECT id FROM genres WHERE name = ?1",
                rusqlite::params![genre_name],
                |row| row.get::<_, i64>(0),
            ) {
                conn.execute(
                    "INSERT OR IGNORE INTO game_genres (game_id, genre_id) VALUES (?1, ?2)",
                    rusqlite::params![game_id, genre_id],
                ).ok();
            }
        }
    }
    
    println!("[import_collection] Imported {} games from {}", count, import_path);
    Ok(count)
}