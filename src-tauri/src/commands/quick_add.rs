use tauri::State;
use crate::db::Database;
use crate::commands::database::save_game_metadata;
use crate::commands::igdb::{get_igdb_credentials_from_db, get_igdb_token};
use crate::models::game::{Game, Genre, GameMode, PlayerPerspective, Theme};
use crate::models::scan_result::IgdbGenreSimple;
use crate::utils::format_cover_url;

/// Check if a game already exists at the given path
fn check_game_exists(db: &Database, path: &str) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    let exists: bool = conn.query_row(
        "SELECT COUNT(*) FROM games WHERE folder_path = ?1",
        rusqlite::params![path],
        |row| Ok(row.get::<_, i64>(0)? > 0),
    ).unwrap_or(false);
    Ok(exists)
}

/// Quick add a game manually without scanning
#[tauri::command]
pub async fn quick_add_game(
    display_name: String,
    folder_path: Option<String>,
    executable_path: Option<String>,
    igdb_id: Option<i64>,
    db: State<'_, Database>,
) -> Result<Game, String> {
    // Check if game already exists at this path
    if let Some(ref path) = &folder_path {
        if check_game_exists(&db, path)? {
            return Err("A game already exists at this path".to_string());
        }
    }
    
    let folder_name = folder_path.as_ref()
        .and_then(|p| std::path::Path::new(p).file_name())
        .and_then(|n| n.to_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| display_name.clone());
    
    // If IGDB ID is provided, fetch game data (async - no connection held)
    let (cover_url, synopsis, release_date, igdb_rating, genres, game_modes, player_perspectives, themes) = 
        if let Some(id) = igdb_id {
            match fetch_igdb_game_data(id, &db).await {
                Ok(data) => data,
                Err(_) => (None, None, None, None, Vec::new(), Vec::new(), Vec::new(), Vec::new()),
            }
        } else {
            (None, None, None, None, Vec::new(), Vec::new(), Vec::new(), Vec::new())
        };
    
    // Re-acquire connection for database operations
    let conn = db.lock_conn()?;
    
    // Insert the game
    conn.execute(
        "INSERT INTO games (folder_name, folder_path, display_name, igdb_id, cover_url, synopsis, release_date, igdb_rating, executable_path) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![
            folder_name,
            folder_path,
            display_name,
            igdb_id,
            cover_url,
            synopsis,
            release_date,
            igdb_rating,
            executable_path,
        ],
    ).map_err(|e| format!("Failed to add game: {}", e))?;
    
    let id = conn.last_insert_rowid();
    
    // Save metadata
    save_game_metadata(&conn, id, &genres, &game_modes, &player_perspectives, &themes)?;
    
    Ok(Game {
        id,
        folder_name: folder_name.clone(),
        folder_path: folder_path.unwrap_or_default(),
        display_name,
        igdb_id,
        igdb_slug: None,
        personal_rating: None,
        igdb_rating,
        notes: None,
        cover_url,
        synopsis,
        release_date,
        created_at: String::new(),
        updated_at: String::new(),
        tags: Vec::new(),
        genres: genres.into_iter().map(|g| Genre { id: g.id, name: g.name }).collect(),
        game_modes: game_modes.into_iter().map(|g| GameMode { id: g.id, name: g.name }).collect(),
        player_perspectives: player_perspectives.into_iter().map(|g| PlayerPerspective { id: g.id, name: g.name }).collect(),
        themes: themes.into_iter().map(|g| Theme { id: g.id, name: g.name }).collect(),
        play_time: Some(0.0),
        completion_status: Some("not_started".to_string()),
        is_favorite: Some(false),
        last_played: None,
        executable_path,
        store_links: None,
    })
}

/// Fetch game data from IGDB by ID
async fn fetch_igdb_game_data(
    igdb_id: i64,
    db: &Database,
) -> Result<(Option<String>, Option<String>, Option<String>, Option<f64>, Vec<IgdbGenreSimple>, Vec<IgdbGenreSimple>, Vec<IgdbGenreSimple>, Vec<IgdbGenreSimple>), String> {
    let token = get_igdb_token(db).await?;
    let creds = get_igdb_credentials_from_db(db)?.ok_or_else(|| "IGDB not configured".to_string())?;
    
    tokio::time::sleep(std::time::Duration::from_millis(250)).await;
    
    let client = reqwest::Client::new();
    let response = client
        .post("https://api.igdb.com/v4/games")
        .header("Client-ID", &creds.client_id)
        .header("Authorization", format!("Bearer {}", token))
        .body(format!(
            "fields id,name,cover.url,rating,summary,genres.name,game_modes.name,player_perspectives.name,themes.name,first_release_date; where id = {};",
            igdb_id
        ))
        .send()
        .await
        .map_err(|e| format!("IGDB request failed: {}", e))?;
    
    #[derive(Debug, serde::Deserialize)]
    struct IgdbGameFull {
        id: i64,
        name: String,
        cover: Option<crate::models::igdb::IgdbCover>,
        rating: Option<f64>,
        summary: Option<String>,
        first_release_date: Option<i64>,
        genres: Option<Vec<IgdbGenreSimple>>,
        game_modes: Option<Vec<IgdbGenreSimple>>,
        player_perspectives: Option<Vec<IgdbGenreSimple>>,
        themes: Option<Vec<IgdbGenreSimple>>,
    }
    
    let games: Vec<IgdbGameFull> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse IGDB response: {}", e))?;
    
    if let Some(game) = games.into_iter().next() {
        let cover_url = game.cover.as_ref().map(|c| format_cover_url(&c.url));
        let release_date = game.first_release_date.map(|ts| {
            chrono::DateTime::from_timestamp(ts, 0)
                .map(|dt| dt.format("%Y-%m-%d").to_string())
                .unwrap_or_default()
        });
        
        Ok((
            cover_url,
            game.summary,
            release_date,
            game.rating,
            game.genres.unwrap_or_default(),
            game.game_modes.unwrap_or_default(),
            game.player_perspectives.unwrap_or_default(),
            game.themes.unwrap_or_default(),
        ))
    } else {
        Err("Game not found on IGDB".to_string())
    }
}

/// Export collection to CSV format
#[tauri::command]
pub fn export_collection_csv(
    export_path: String,
    game_ids: Option<Vec<i64>>,
    db: State<'_, Database>
) -> Result<String, String> {
    let conn = db.lock_conn()?;
    
    // Build query based on whether game_ids is provided
    let (query, params): (String, Vec<i64>) = match game_ids {
        Some(ids) if !ids.is_empty() => {
            let placeholders: Vec<String> = ids.iter().map(|_| "?".to_string()).collect();
            let query = format!(
                "SELECT id, folder_name, display_name, personal_rating, igdb_rating, notes, \
                 release_date, play_time, completion_status, is_favorite, last_played \
                 FROM games \
                 WHERE id IN ({}) \
                 ORDER BY display_name",
                placeholders.join(", ")
            );
            (query, ids)
        }
        _ => {
            // Get all games if no specific IDs provided
            let query = "SELECT id, folder_name, display_name, personal_rating, igdb_rating, notes, \
                 release_date, play_time, completion_status, is_favorite, last_played \
                 FROM games ORDER BY display_name".to_string();
            (query, vec![])
        }
    };
    
    let mut stmt = conn.prepare(&query).map_err(|e: rusqlite::Error| e.to_string())?;
    
    let mut csv_content = String::from("ID,Name,Personal Rating,IGDB Rating,Notes,Release Date,Play Time (hours),Status,Favorite,Last Played\n");
    
    // Execute query with or without params
    let games: Vec<_> = if params.is_empty() {
        stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, Option<i64>>(3)?,
                    row.get::<_, Option<f64>>(4)?,
                    row.get::<_, Option<String>>(5)?,
                    row.get::<_, Option<String>>(6)?,
                    row.get::<_, Option<f64>>(7)?,
                    row.get::<_, Option<String>>(8)?,
                    row.get::<_, Option<i64>>(9)?,
                    row.get::<_, Option<String>>(10)?,
                ))
            })
            .map_err(|e: rusqlite::Error| e.to_string())?
            .filter_map(|r| r.ok())
            .collect()
    } else {
        // Convert params to Vec of references to i64
        let param_refs: Vec<&i64> = params.iter().collect();
        // Create dynamic params
        let dyn_params: Vec<&dyn rusqlite::ToSql> = param_refs.iter().map(|&id| id as &dyn rusqlite::ToSql).collect();
        stmt
            .query_map(rusqlite::params_from_iter(dyn_params), |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, Option<i64>>(3)?,
                    row.get::<_, Option<f64>>(4)?,
                    row.get::<_, Option<String>>(5)?,
                    row.get::<_, Option<String>>(6)?,
                    row.get::<_, Option<f64>>(7)?,
                    row.get::<_, Option<String>>(8)?,
                    row.get::<_, Option<i64>>(9)?,
                    row.get::<_, Option<String>>(10)?,
                ))
            })
            .map_err(|e: rusqlite::Error| e.to_string())?
            .filter_map(|r| r.ok())
            .collect()
    };
    
    for game in games {
        let (id, _folder_name, display_name, rating, igdb_rating, notes, release_date, play_time, status, is_fav, last_played) = game;
        let rating_str = rating.map(|r| r.to_string()).unwrap_or_default();
        let igdb_str = igdb_rating.map(|r| format!("{:.1}", r)).unwrap_or_default();
        let notes_str = notes.map(|n| format!("\"{}\"", n.replace('"', "\"\""))).unwrap_or_default();
        let release_str = release_date.unwrap_or_default();
        let play_time_str = play_time.map(|t| format!("{:.1}", t)).unwrap_or_default();
        let status_str = status.unwrap_or_else(|| "not_started".to_string());
        let fav_str = if is_fav.map(|v| v != 0).unwrap_or(false) { "Yes" } else { "No" };
        let last_played_str = last_played.unwrap_or_default();
        
        csv_content.push_str(&format!(
            "{},\"{}\",{},{},{},{},{},{},{},{}\n",
            id, display_name, rating_str, igdb_str, notes_str, release_str, play_time_str, status_str, fav_str, last_played_str
        ));
    }
    
    std::fs::write(&export_path, csv_content).map_err(|e| e.to_string())?;
    
    Ok(export_path)
}
