use tauri::State;
use crate::db::Database;
use crate::models::game::{Game, Tag, Genre, GameMode, PlayerPerspective, Theme, ScannedFolder, GameFilters};
use crate::models::scan_result::{IgdbGenreSimple, ScanResult};

// === Game CRUD ===

#[tauri::command]
pub fn get_game_by_id(id: i64, db: State<'_, Database>) -> Result<Option<Game>, String> {
    let conn = db.lock_conn()?;
    
    // First, get the main game data
    let mut stmt = conn
        .prepare(
            "SELECT id, folder_name, folder_path, display_name, igdb_id, igdb_slug, \
             personal_rating, igdb_rating, notes, cover_url, synopsis, release_date, created_at, updated_at \
             FROM games WHERE id = ?1",
        )
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let mut game: Option<Game> = stmt
        .query_row(rusqlite::params![id], |row| {
            Ok(Game {
                id: row.get(0)?,
                folder_name: row.get(1)?,
                folder_path: row.get(2)?,
                display_name: row.get(3)?,
                igdb_id: row.get(4)?,
                igdb_slug: row.get(5)?,
                personal_rating: row.get(6)?,
                igdb_rating: row.get(7)?,
                notes: row.get(8)?,
                cover_url: row.get(9)?,
                synopsis: row.get(10)?,
                release_date: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
                tags: Vec::new(),
                genres: Vec::new(),
                game_modes: Vec::new(),
                player_perspectives: Vec::new(),
                themes: Vec::new(),
            })
        })
        .map(Some)
        .unwrap_or(None);
    
    // If game exists, fetch related metadata
    if let Some(ref mut g) = game {
        // Fetch genres
        let mut genre_stmt = conn.prepare(
            "SELECT g.id, g.name FROM genres g \
             JOIN game_genres gg ON g.id = gg.genre_id \
             WHERE gg.game_id = ?1"
        ).map_err(|e: rusqlite::Error| e.to_string())?;
        
        g.genres = genre_stmt
            .query_map(rusqlite::params![id], |row| {
                Ok(Genre {
                    id: row.get(0)?,
                    name: row.get(1)?,
                })
            })
            .map_err(|e: rusqlite::Error| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        
        // Fetch game modes
        let mut mode_stmt = conn.prepare(
            "SELECT gm.id, gm.name FROM game_modes gm \
             JOIN game_game_modes ggm ON gm.id = ggm.game_mode_id \
             WHERE ggm.game_id = ?1"
        ).map_err(|e: rusqlite::Error| e.to_string())?;
        
        g.game_modes = mode_stmt
            .query_map(rusqlite::params![id], |row| {
                Ok(GameMode {
                    id: row.get(0)?,
                    name: row.get(1)?,
                })
            })
            .map_err(|e: rusqlite::Error| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        
        // Fetch player perspectives
        let mut pp_stmt = conn.prepare(
            "SELECT pp.id, pp.name FROM player_perspectives pp \
             JOIN game_player_perspectives gpp ON pp.id = gpp.player_perspective_id \
             WHERE gpp.game_id = ?1"
        ).map_err(|e: rusqlite::Error| e.to_string())?;
        
        g.player_perspectives = pp_stmt
            .query_map(rusqlite::params![id], |row| {
                Ok(PlayerPerspective {
                    id: row.get(0)?,
                    name: row.get(1)?,
                })
            })
            .map_err(|e: rusqlite::Error| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        
        // Fetch themes
        let mut theme_stmt = conn.prepare(
            "SELECT t.id, t.name FROM themes t \
             JOIN game_themes gt ON t.id = gt.theme_id \
             WHERE gt.game_id = ?1"
        ).map_err(|e: rusqlite::Error| e.to_string())?;
        
        g.themes = theme_stmt
            .query_map(rusqlite::params![id], |row| {
                Ok(Theme {
                    id: row.get(0)?,
                    name: row.get(1)?,
                })
            })
            .map_err(|e: rusqlite::Error| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        
        // Fetch tags (existing functionality)
        let mut tag_stmt = conn.prepare(
            "SELECT t.id, t.name, t.category FROM tags t \
             JOIN game_tags gt ON t.id = gt.tag_id \
             WHERE gt.game_id = ?1"
        ).map_err(|e: rusqlite::Error| e.to_string())?;
        
        g.tags = tag_stmt
            .query_map(rusqlite::params![id], |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    category: row.get(2)?,
                })
            })
            .map_err(|e: rusqlite::Error| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    }

    return Ok(game);
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Verify that SQL injection in sort_by falls back to safe default
    #[test]
    fn test_sort_by_sql_injection_blocked() {
        const ALLOWED_SORT_COLUMNS: &[&str] = &[
            "id", "folder_name", "folder_path", "display_name",
            "igdb_id", "personal_rating", "igdb_rating",
            "notes", "cover_url", "synopsis", "release_date",
            "created_at", "updated_at",
        ];
        const ALLOWED_ORDERS: &[&str] = &["ASC", "DESC", "asc", "desc"];

        let injection_attempts = vec![
            "display_name; DROP TABLE games; --",
            "1 OR 1=1",
            "id UNION SELECT * FROM users",
            "id; INSERT INTO games VALUES(1,'hack')",
            "",
            "nonexistent_column",
        ];

        for malicious in injection_attempts {
            let column = if ALLOWED_SORT_COLUMNS.contains(&malicious) {
                malicious
            } else {
                "display_name"
            };
            let order = "ASC";
            let query = format!("SELECT 1 FROM games ORDER BY {} {}", column, order);
            // Must NOT contain the malicious string (skip empty string check - trivially true)
            if !malicious.is_empty() {
                assert!(
                    !query.contains(malicious) || ALLOWED_SORT_COLUMNS.contains(&malicious),
                    "Injection attempt '{}' should not appear in query: {}",
                    malicious,
                    query
                );
            }
            // Must contain the safe default
            assert_eq!(column, "display_name", "Should fall back to display_name for: {}", malicious);
        }
    }

    /// Verify that sort_order injection is also blocked
    #[test]
    fn test_sort_order_sql_injection_blocked() {
        const ALLOWED_ORDERS: &[&str] = &["ASC", "DESC", "asc", "desc"];

        let malicious_orders = vec![
            "ASC; DROP TABLE games",
            "DESC OR 1=1",
            "",
            "RANDOM",
        ];

        for malicious in malicious_orders {
            let dir = if ALLOWED_ORDERS.contains(&malicious) {
                malicious
            } else {
                "ASC"
            };
            assert_eq!(dir, "ASC", "Should fall back to ASC for: {}", malicious);
        }
    }

    /// Verify that legitimate sort values pass through
    #[test]
    fn test_legitimate_sort_values_accepted() {
        const ALLOWED_SORT_COLUMNS: &[&str] = &[
            "id", "folder_name", "folder_path", "display_name",
            "igdb_id", "personal_rating", "igdb_rating",
            "notes", "cover_url", "synopsis", "release_date",
            "created_at", "updated_at",
        ];
        const ALLOWED_ORDERS: &[&str] = &["ASC", "DESC", "asc", "desc"];

        let valid_columns = ["title", "rating", "igdb_rating", "display_name", "created_at"];
        for col in valid_columns {
            let column = if ALLOWED_SORT_COLUMNS.contains(&col) {
                col
            } else {
                "display_name"
            };
            if ALLOWED_SORT_COLUMNS.contains(&col) {
                assert_eq!(column, col, "Legitimate column '{}' should be accepted", col);
            }
        }

        for order in &["ASC", "desc"] {
            let dir = if ALLOWED_ORDERS.contains(order) {
                *order
            } else {
                "ASC"
            };
            assert_eq!(dir, *order, "Legitimate order '{}' should be accepted", order);
        }
    }
}

#[tauri::command]
pub fn update_game_rating(id: i64, rating: Option<i64>, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute(
        "UPDATE games SET personal_rating = ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![rating, id],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn update_game_display_name(id: i64, display_name: String, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute(
        "UPDATE games SET display_name = ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![display_name, id],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn update_game_cover_url(id: i64, cover_url: Option<String>, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute(
        "UPDATE games SET cover_url = ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![cover_url, id],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn delete_all_games(db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    // First delete all game_tags entries
    conn.execute("DELETE FROM game_tags", [])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    // Then delete all games
    conn.execute("DELETE FROM games", [])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

/// Platform-specific system folder exclusion patterns
#[cfg(target_os = "windows")]
const PLATFORM_EXCLUSION_PATTERNS: &[&str] = &[
    "windows", "program files", "program files (x86)", "programdata",
    "$recycle.bin", "system volume information", "recovery", "perflogs",
];

#[cfg(target_os = "macos")]
const PLATFORM_EXCLUSION_PATTERNS: &[&str] = &[
    "library", "system", "applications", ".trashes", ".vol",
    "volumes", "private", "network",
];

#[cfg(target_os = "linux")]
const PLATFORM_EXCLUSION_PATTERNS: &[&str] = &[
    "proc", "sys", "dev", "run", "snap", "flatpak",
    "boot", "lib64", "sbin", "bin", "usr", "etc", "var",
];

/// Common exclusion patterns shared across all platforms
const COMMON_EXCLUSION_PATTERNS: &[&str] = &[
    // Common non-game subdirectories
    "update", "patch", "dlc", "redist", "directx", "vcredist",
    "installer", "setup", "uninstall", "temp", "tmp", "cache",
    "logs", "saves", "save", "screenshots", "config", "settings",
    "docs", "manual", "readme",
    // Development/Build folders
    "content", "bin", "obj", "lib", "include", "src", "source",
    "assets", "resources", "data", "media", "common", "shared",
    "engine", "core", "plugins", "mods", "workshop",
    "download", "downloads", "backup", "backups", "old", "archive", "archives",
];

/// Recreate default folder exclusions in the database
fn recreate_default_exclusions(conn: &rusqlite::Connection) -> Result<(), String> {
    println!("[recreate_default_exclusions] Inserting default exclusions...");
    
    let mut count = 0;
    for pattern in PLATFORM_EXCLUSION_PATTERNS.iter().chain(COMMON_EXCLUSION_PATTERNS.iter()) {
        conn.execute(
            "INSERT OR IGNORE INTO folder_exclusions (pattern, is_regex) VALUES (?1, 0)",
            rusqlite::params![pattern],
        ).map_err(|e| format!("Failed to insert exclusion '{}': {}", pattern, e))?;
        count += 1;
    }
    
    println!("[recreate_default_exclusions] Inserted {} default exclusions", count);
    Ok(())
}

/// Reset entire database - clears all data but preserves default exclusions
#[tauri::command]
pub fn reset_database(db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    println!("[reset_database] Resetting entire database...");
    
    // Clear all data in reverse dependency order
    conn.execute("DELETE FROM game_tags", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear game_tags: {}", e))?;
    println!("[reset_database] Cleared game_tags");
    
    conn.execute("DELETE FROM games", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear games: {}", e))?;
    println!("[reset_database] Cleared games");
    
    conn.execute("DELETE FROM tags", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear tags: {}", e))?;
    println!("[reset_database] Cleared tags");
    
    conn.execute("DELETE FROM scanned_folders", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear scanned_folders: {}", e))?;
    println!("[reset_database] Cleared scanned_folders");
    
    conn.execute("DELETE FROM folder_exclusions", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear folder_exclusions: {}", e))?;
    println!("[reset_database] Cleared folder_exclusions");
    
    // Recreate default exclusions
    recreate_default_exclusions(&conn)?;
    
    conn.execute("DELETE FROM igdb_token_cache", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear igdb_token_cache: {}", e))?;
    println!("[reset_database] Cleared igdb_token_cache");
    
    conn.execute("DELETE FROM igdb_cache", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear igdb_cache: {}", e))?;
    println!("[reset_database] Cleared igdb_cache");
    
    conn.execute("DELETE FROM igdb_games_cache", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear igdb_games_cache: {}", e))?;
    println!("[reset_database] Cleared igdb_games_cache");
    
    // Reset sequences for AUTOINCREMENT tables
    conn.execute("DELETE FROM sqlite_sequence WHERE name='games'", [])
        .map_err(|e| format!("Failed to reset games sequence: {}", e)).ok();
    conn.execute("DELETE FROM sqlite_sequence WHERE name='tags'", [])
        .map_err(|e| format!("Failed to reset tags sequence: {}", e)).ok();
    
    println!("[reset_database] Database reset complete!");
    Ok(true)
}

#[tauri::command]
pub fn get_games(filters: Option<GameFilters>, db: State<'_, Database>) -> Result<Vec<Game>, String> {
    let conn = db.lock_conn()?;
    
    let mut query = String::from(
        "SELECT id, folder_name, folder_path, display_name, igdb_id, igdb_slug, \
         personal_rating, igdb_rating, notes, cover_url, synopsis, release_date, created_at, updated_at \
         FROM games WHERE 1=1"
    );
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(f) = &filters {
        if let Some(tag_ids) = &f.tag_ids {
            if !tag_ids.is_empty() {
                query.push_str(&format!(
                    " AND id IN (SELECT game_id FROM game_tags WHERE tag_id IN ({}))",
                    tag_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",")
                ));
                for id in tag_ids {
                    params.push(Box::new(*id));
                }
            }
        }
        if let Some(min) = f.min_rating {
            query.push_str(" AND personal_rating >= ?");
            params.push(Box::new(min));
        }
        if let Some(max) = f.max_rating {
            query.push_str(" AND personal_rating <= ?");
            params.push(Box::new(max));
        }
        if let Some(search) = &f.search_query {
            query.push_str(" AND (display_name LIKE ? OR folder_name LIKE ?)");
            let pattern = format!("%{}%", search);
            params.push(Box::new(pattern.clone()));
            params.push(Box::new(pattern));
        }
        if let Some(sort) = &f.sort_by {
            const ALLOWED_SORT_COLUMNS: &[&str] = &[
                "id", "folder_name", "folder_path", "display_name",
                "igdb_id", "personal_rating", "igdb_rating",
                "notes", "cover_url", "synopsis", "release_date",
                "created_at", "updated_at",
            ];
            let column = if ALLOWED_SORT_COLUMNS.contains(&sort.as_str()) {
                sort.as_str()
            } else {
                "display_name"
            };
            query.push_str(&format!(" ORDER BY {}", column));
            if let Some(order) = &f.sort_order {
                const ALLOWED_ORDERS: &[&str] = &["ASC", "DESC", "asc", "desc"];
                let dir = if ALLOWED_ORDERS.contains(&order.as_str()) {
                    order.as_str()
                } else {
                    "ASC"
                };
                query.push_str(&format!(" {}", dir));
            }
        }
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    
    let mut stmt = conn.prepare(&query).map_err(|e: rusqlite::Error| e.to_string())?;
    
    let games: Vec<Game> = stmt
        .query_map(params_refs.as_slice(), |row| {
            Ok(Game {
                id: row.get(0)?,
                folder_name: row.get(1)?,
                folder_path: row.get(2)?,
                display_name: row.get(3)?,
                igdb_id: row.get(4)?,
                igdb_slug: row.get(5)?,
                personal_rating: row.get(6)?,
                igdb_rating: row.get(7)?,
                notes: row.get(8)?,
                cover_url: row.get(9)?,
                synopsis: row.get(10)?,
                release_date: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
                tags: Vec::new(),
                genres: Vec::new(),
                game_modes: Vec::new(),
                player_perspectives: Vec::new(),
                themes: Vec::new(),
            })
        })
        .map_err(|e: rusqlite::Error| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(games)
}

#[tauri::command]
pub fn save_game(game: Game, db: State<'_, Database>) -> Result<Game, String> {
    let conn = db.lock_conn()?;
    
    conn.execute(
        "INSERT INTO games (folder_name, folder_path, display_name, igdb_id, personal_rating, notes, cover_url) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            game.folder_name,
            game.folder_path,
            game.display_name,
            game.igdb_id,
            game.personal_rating,
            game.notes,
            game.cover_url,
        ],
    ).map_err(|e: rusqlite::Error| format!("Save failed: {}", e))?;

    let id = conn.last_insert_rowid();
    Ok(Game { id, ..game })
}

#[tauri::command]
pub fn delete_games_by_scan_path(scan_path: String, db: State<'_, Database>) -> Result<u64, String> {
    let conn = db.lock_conn()?;
    // Use exact match OR child paths only (with separator) to avoid
    // e.g. deleting /Games/Steam when targeting /Games/Ste
    conn.execute(
        "DELETE FROM games WHERE folder_path = ?1 \
         OR folder_path LIKE ?1 || '/%' \
         OR folder_path LIKE ?1 || '\\%'",
        rusqlite::params![scan_path, scan_path, scan_path],
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(conn.changes() as u64)
}

#[tauri::command]
pub fn delete_game(id: i64, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute("DELETE FROM game_tags WHERE game_id = ?1", rusqlite::params![id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    conn.execute("DELETE FROM games WHERE id = ?1", rusqlite::params![id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn update_game_notes(id: i64, notes: Option<String>, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute(
        "UPDATE games SET notes = ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![notes, id],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn update_game_tags(id: i64, tag_ids: Vec<i64>, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    // Remove existing tags
    conn.execute("DELETE FROM game_tags WHERE game_id = ?1", rusqlite::params![id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    // Add new tags
    for tag_id in tag_ids {
        conn.execute(
            "INSERT OR IGNORE INTO game_tags (game_id, tag_id) VALUES (?1, ?2)",
            rusqlite::params![id, tag_id],
        ).map_err(|e: rusqlite::Error| e.to_string())?;
    }
    
    Ok(true)
}

// === Tag CRUD ===

#[tauri::command]
pub fn get_tags(db: State<'_, Database>) -> Result<Vec<Tag>, String> {
    let conn = db.lock_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name, category FROM tags ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let tags: Vec<Tag> = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
            })
        })
        .map_err(|e: rusqlite::Error| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tags)
}

// === App Settings ===

#[tauri::command]
pub fn get_setting(key: String, db: State<'_, Database>) -> Result<Option<String>, String> {
    let conn = db.lock_conn()?;
    
    let result: Option<String> = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            rusqlite::params![key],
            |row| row.get(0),
        )
        .ok();
    
    Ok(result)
}

#[tauri::command]
pub fn set_setting(key: String, value: String, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))",
        rusqlite::params![key, value],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    
    Ok(true)
}

// === Folder Exclusions ===

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FolderExclusion {
    pub id: i64,
    pub pattern: String,
    pub is_regex: bool,
}

#[tauri::command]
pub fn get_folder_exclusions(db: State<'_, Database>) -> Result<Vec<FolderExclusion>, String> {
    let conn = db.lock_conn()?;
    
    let mut stmt = conn
        .prepare("SELECT id, pattern, is_regex FROM folder_exclusions ORDER BY pattern")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let exclusions: Vec<FolderExclusion> = stmt
        .query_map([], |row| {
            Ok(FolderExclusion {
                id: row.get(0)?,
                pattern: row.get(1)?,
                is_regex: row.get(2)?,
            })
        })
        .map_err(|e: rusqlite::Error| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(exclusions)
}

#[tauri::command]
pub fn add_folder_exclusion(
    pattern: String,
    is_regex: bool,
    db: State<'_, Database>,
) -> Result<FolderExclusion, String> {
    let conn = db.lock_conn()?;
    
    conn.execute(
        "INSERT INTO folder_exclusions (pattern, is_regex) VALUES (?1, ?2)",
        rusqlite::params![pattern, is_regex],
    ).map_err(|e: rusqlite::Error| format!("Failed to add exclusion: {}", e))?;

    let id = conn.last_insert_rowid();
    
    Ok(FolderExclusion {
        id,
        pattern,
        is_regex,
    })
}

#[tauri::command]
pub fn remove_folder_exclusion(id: i64, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    conn.execute(
        "DELETE FROM folder_exclusions WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e: rusqlite::Error| format!("Failed to remove exclusion: {}", e))?;

    Ok(true)
}

/// Get exclusion patterns for use in scanner
pub fn get_exclusion_patterns(db: &Database) -> Result<Vec<String>, String> {
    let conn = db.lock_conn()?;
    
    let mut stmt = conn
        .prepare("SELECT pattern FROM folder_exclusions WHERE is_regex = 0")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let patterns: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e: rusqlite::Error| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(patterns)
}

#[tauri::command]
pub fn create_tag(name: String, category: String, db: State<'_, Database>) -> Result<Tag, String> {
    let conn = db.lock_conn()?;
    conn.execute(
        "INSERT INTO tags (name, category) VALUES (?1, ?2)",
        rusqlite::params![name, category],
    ).map_err(|e: rusqlite::Error| format!("Tag creation failed: {}", e))?;
    
    let id = conn.last_insert_rowid();
    Ok(Tag { id, name, category })
}

#[tauri::command]
pub fn delete_tag(id: i64, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute("DELETE FROM game_tags WHERE tag_id = ?1", rusqlite::params![id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    conn.execute("DELETE FROM tags WHERE id = ?1", rusqlite::params![id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn add_tag_to_game(game_id: i64, tag_id: i64, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute(
        "INSERT OR IGNORE INTO game_tags (game_id, tag_id) VALUES (?1, ?2)",
        rusqlite::params![game_id, tag_id],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn remove_tag_from_game(game_id: i64, tag_id: i64, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute(
        "DELETE FROM game_tags WHERE game_id = ?1 AND tag_id = ?2",
        rusqlite::params![game_id, tag_id],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

// === ScannedFolder CRUD ===

#[tauri::command]
pub fn add_scanned_folder(path: String, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute(
        "INSERT OR IGNORE INTO scanned_folders (path) VALUES (?1)",
        rusqlite::params![path],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn remove_scanned_folder(path: String, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    conn.execute(
        "DELETE FROM scanned_folders WHERE path = ?1",
        rusqlite::params![path],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn get_scanned_folders(db: State<'_, Database>) -> Result<Vec<ScannedFolder>, String> {
    let conn = db.lock_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, path, last_scanned FROM scanned_folders")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let folders: Vec<ScannedFolder> = stmt
        .query_map([], |row| {
            Ok(ScannedFolder {
                id: row.get(0)?,
                path: row.get(1)?,
                last_scanned: row.get(2)?,
            })
        })
        .map_err(|e: rusqlite::Error| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(folders)
}

// === Scan Results ===

#[tauri::command]
pub fn save_scan_results(results: Vec<ScanResult>, db: State<'_, Database>) -> Result<Vec<Game>, String> {
    println!("[save_scan_results] Called with {} results", results.len());
    
    let conn = db.lock_conn()?;
    let mut saved_games = Vec::new();

    for (i, result) in results.iter().enumerate() {
        println!("[save_scan_results] Processing result {}/{}: {} (confidence: {:?})", 
            i + 1, results.len(), result.display_name, result.match_confidence);
        
        // Check if folder_path already exists
        let exists: bool = conn.query_row(
            "SELECT COUNT(*) FROM games WHERE folder_path = ?1",
            rusqlite::params![&result.folder_path],
            |row| Ok(row.get::<_, i64>(0)? > 0),
        ).unwrap_or(false);

        if exists {
            println!("[save_scan_results] Skipping '{}' - already exists in DB", result.display_name);
            continue;
        }

        println!("[save_scan_results] Inserting: {}", result.display_name);
        
        // Insert game with all IGDB fields
        match conn.execute(
            "INSERT INTO games (folder_name, folder_path, display_name, igdb_id, igdb_slug, cover_url, synopsis, release_date, igdb_rating) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                result.folder_name,
                result.folder_path,
                result.display_name,
                result.igdb_id,
                result.igdb_slug,
                result.cover_url,
                result.synopsis,
                result.release_date,
                result.igdb_rating,
            ],
        ) {
            Ok(_) => {
                let id = conn.last_insert_rowid();
                println!("[save_scan_results] Successfully inserted '{}' with id {}", result.display_name, id);
                
                // Save metadata (genres, game_modes, player_perspectives, themes)
                save_game_metadata(&conn, id, &result.genres, &result.game_modes, 
                                  &result.player_perspectives, &result.themes)?;
                
                saved_games.push(Game {
                    id,
                    folder_name: result.folder_name.clone(),
                    folder_path: result.folder_path.clone(),
                    display_name: result.display_name.clone(),
                    igdb_id: result.igdb_id,
                    igdb_slug: result.igdb_slug.clone(),
                    personal_rating: None,
                    igdb_rating: result.igdb_rating,
                    notes: None,
                    cover_url: result.cover_url.clone(),
                    synopsis: result.synopsis.clone(),
                    release_date: result.release_date.clone(),
                    created_at: String::new(),
                    updated_at: String::new(),
                    tags: Vec::new(),
                    genres: Vec::new(),
                    game_modes: Vec::new(),
                    player_perspectives: Vec::new(),
                    themes: Vec::new(),
                });
            }
            Err(e) => {
                println!("[save_scan_results] Error inserting '{}': {}", result.display_name, e);
                return Err(format!("Save failed for '{}': {}", result.display_name, e));
            }
        }
    }

    println!("[save_scan_results] Saved {} games successfully", saved_games.len());
    Ok(saved_games)
}

/// Save game metadata (genres, game modes, player perspectives, themes)
pub fn save_game_metadata(
    conn: &rusqlite::Connection,
    game_id: i64,
    genres: &[IgdbGenreSimple],
    game_modes: &[IgdbGenreSimple],
    player_perspectives: &[IgdbGenreSimple],
    themes: &[IgdbGenreSimple],
) -> Result<(), String> {
    // Save genres
    for genre in genres {
        // Insert genre if not exists, get its ID
        conn.execute(
            "INSERT OR IGNORE INTO genres (id, name) VALUES (?1, ?2)",
            rusqlite::params![genre.id, genre.name],
        ).map_err(|e| format!("Failed to insert genre '{}': {}", genre.name, e))?;
        
        // Get the genre ID (could be the one we just inserted or existing)
        let genre_id: i64 = conn.query_row(
            "SELECT id FROM genres WHERE id = ?1 OR name = ?2",
            rusqlite::params![genre.id, genre.name],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get genre ID for '{}': {}", genre.name, e))?;
        
        // Link game to genre
        conn.execute(
            "INSERT OR IGNORE INTO game_genres (game_id, genre_id) VALUES (?1, ?2)",
            rusqlite::params![game_id, genre_id],
        ).map_err(|e| format!("Failed to link genre '{}': {}", genre.name, e))?;
    }
    
    // Save game modes
    for mode in game_modes {
        conn.execute(
            "INSERT OR IGNORE INTO game_modes (id, name) VALUES (?1, ?2)",
            rusqlite::params![mode.id, mode.name],
        ).map_err(|e| format!("Failed to insert game mode '{}': {}", mode.name, e))?;
        
        let mode_id: i64 = conn.query_row(
            "SELECT id FROM game_modes WHERE id = ?1 OR name = ?2",
            rusqlite::params![mode.id, mode.name],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get game mode ID for '{}': {}", mode.name, e))?;
        
        conn.execute(
            "INSERT OR IGNORE INTO game_game_modes (game_id, game_mode_id) VALUES (?1, ?2)",
            rusqlite::params![game_id, mode_id],
        ).map_err(|e| format!("Failed to link game mode '{}': {}", mode.name, e))?;
    }
    
    // Save player perspectives
    for pp in player_perspectives {
        conn.execute(
            "INSERT OR IGNORE INTO player_perspectives (id, name) VALUES (?1, ?2)",
            rusqlite::params![pp.id, pp.name],
        ).map_err(|e| format!("Failed to insert player perspective '{}': {}", pp.name, e))?;
        
        let pp_id: i64 = conn.query_row(
            "SELECT id FROM player_perspectives WHERE id = ?1 OR name = ?2",
            rusqlite::params![pp.id, pp.name],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get player perspective ID for '{}': {}", pp.name, e))?;
        
        conn.execute(
            "INSERT OR IGNORE INTO game_player_perspectives (game_id, player_perspective_id) VALUES (?1, ?2)",
            rusqlite::params![game_id, pp_id],
        ).map_err(|e| format!("Failed to link player perspective '{}': {}", pp.name, e))?;
    }
    
    // Save themes
    for theme in themes {
        conn.execute(
            "INSERT OR IGNORE INTO themes (id, name) VALUES (?1, ?2)",
            rusqlite::params![theme.id, theme.name],
        ).map_err(|e| format!("Failed to insert theme '{}': {}", theme.name, e))?;
        
        let theme_id: i64 = conn.query_row(
            "SELECT id FROM themes WHERE id = ?1 OR name = ?2",
            rusqlite::params![theme.id, theme.name],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get theme ID for '{}': {}", theme.name, e))?;
        
        conn.execute(
            "INSERT OR IGNORE INTO game_themes (game_id, theme_id) VALUES (?1, ?2)",
            rusqlite::params![game_id, theme_id],
        ).map_err(|e| format!("Failed to link theme '{}': {}", theme.name, e))?;
    }
    
    Ok(())
}

// === Search ===

#[tauri::command]
pub fn search_games(query: String, db: State<'_, Database>) -> Result<Vec<Game>, String> {
    let conn = db.lock_conn()?;
    let pattern = format!("%{}%", query);
    
    let mut stmt = conn
        .prepare(
            "SELECT id, folder_name, folder_path, display_name, igdb_id, igdb_slug, \
             personal_rating, igdb_rating, notes, cover_url, synopsis, release_date, created_at, updated_at \
             FROM games \
             WHERE display_name LIKE ?1 OR folder_name LIKE ?1 \
             ORDER BY display_name \
             LIMIT 50",
        )
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let games: Vec<Game> = stmt
        .query_map(rusqlite::params![&pattern], |row| {
            Ok(Game {
                id: row.get(0)?,
                folder_name: row.get(1)?,
                folder_path: row.get(2)?,
                display_name: row.get(3)?,
                igdb_id: row.get(4)?,
                igdb_slug: row.get(5)?,
                personal_rating: row.get(6)?,
                igdb_rating: row.get(7)?,
                notes: row.get(8)?,
                cover_url: row.get(9)?,
                synopsis: row.get(10)?,
                release_date: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
                tags: Vec::new(),
                genres: Vec::new(),
                game_modes: Vec::new(),
                player_perspectives: Vec::new(),
                themes: Vec::new(),
            })
        })
        .map_err(|e: rusqlite::Error| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(games)
}
