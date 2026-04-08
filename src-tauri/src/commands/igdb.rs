use tauri::State;
use crate::db::Database;
use crate::commands::database::save_game_metadata;
use crate::models::igdb::*;
use crate::models::scan_result::{IgdbGenreSimple, MatchCandidate, ScanResult};
use crate::models::igdb::IgdbGame;
use crate::utils::{format_cover_url, levenshtein};

/// Internal helper to get IGDB credentials from a Database reference
pub fn get_igdb_credentials_from_db(db: &Database) -> Result<Option<IgdbCredentials>, String> {
    let conn = db.lock_conn()?;

    let result = conn.query_row(
        "SELECT client_id, client_secret FROM igdb_credentials WHERE id = 1",
        [],
        |row| Ok(IgdbCredentials {
            client_id: row.get(0)?,
            client_secret: row.get(1)?,
        }),
    );

    match result {
        Ok(creds) => Ok(Some(creds)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn get_igdb_credentials(
    db: State<'_, Database>,
) -> Result<Option<IgdbCredentials>, String> {
    get_igdb_credentials_from_db(&db)
}

#[tauri::command]
pub fn save_igdb_credentials(
    client_id: String,
    client_secret: String,
    db: State<'_, Database>,
) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    conn.execute(
        "INSERT OR REPLACE INTO igdb_credentials (id, client_id, client_secret, updated_at) 
         VALUES (1, ?1, ?2, datetime('now'))",
        rusqlite::params![client_id, client_secret],
    ).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub async fn test_igdb_connection(
    client_id: String,
    client_secret: String,
) -> Result<bool, String> {
    let url = format!(
        "https://id.twitch.tv/oauth2/token?client_id={}&client_secret={}&grant_type=client_credentials",
        client_id, client_secret
    );

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if response.status().is_success() {
        Ok(true)
    } else {
        Err("Invalid credentials".to_string())
    }
}

pub async fn get_igdb_token(db: &Database) -> Result<String, String> {
    // Check cache first
    {
        let conn = db.lock_conn()?;
        let cached: Result<(String, String), rusqlite::Error> = conn.query_row(
            "SELECT access_token, expires_at FROM igdb_token_cache WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        );

        if let Ok((token, expires_at)) = cached {
            let now = chrono::Utc::now().naive_utc().to_string();
            if expires_at > now {
                return Ok(token);
            }
        }
    }

    // Fetch new token
    let (client_id, client_secret) = {
        let conn = db.lock_conn()?;
        let creds: (String, String) = conn.query_row(
            "SELECT client_id, client_secret FROM igdb_credentials WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).map_err(|_| "IGDB credentials not configured".to_string())?;
        creds
    };

    let url = format!(
        "https://id.twitch.tv/oauth2/token?client_id={}&client_secret={}&grant_type=client_credentials",
        client_id, client_secret
    );

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .send()
        .await
        .map_err(|e| format!("Token request failed: {}", e))?;

    let token_data: crate::models::igdb::TwitchTokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Token parse failed: {}", e))?;

    // Cache the token (expire 60s early for safety)
    let expires_at = chrono::Utc::now().naive_utc() + chrono::Duration::seconds(token_data.expires_in - 60);
    {
        let conn = db.lock_conn()?;
        conn.execute(
            "INSERT OR REPLACE INTO igdb_token_cache (id, access_token, expires_at) VALUES (1, ?1, ?2)",
            rusqlite::params![token_data.access_token, expires_at.to_string()],
        ).map_err(|e| format!("Token cache failed: {}", e))?;
    }

    Ok(token_data.access_token)
}

#[tauri::command]
pub async fn search_igdb_games(
    query: String,
    db: State<'_, Database>,
) -> Result<Vec<IgdbSearchResult>, String> {
    let token = get_igdb_token(&db).await?;
    let creds = get_igdb_credentials(db.clone())?.ok_or_else(|| "No credentials".to_string())?;

    // Rate limiting: 4 requests per second max
    tokio::time::sleep(std::time::Duration::from_millis(250)).await;

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.igdb.com/v4/games")
        .header("Client-ID", &creds.client_id)
        .header("Authorization", format!("Bearer {}", token))
        .body(format!("search \"{}\"; fields id,name; limit 10;", query))
        .send()
        .await
        .map_err(|e| format!("IGDB search failed: {}", e))?;

    let results: Vec<IgdbSearchResult> = response
        .json()
        .await
        .map_err(|e| format!("Parse failed: {}", e))?;

    Ok(results)
}

/// Search IGDB with full game data (cover, etc.) for manual game addition
#[tauri::command]
pub async fn search_igdb_games_full(
    query: String,
    db: State<'_, Database>,
) -> Result<Vec<IgdbGame>, String> {
    let token = get_igdb_token(&db).await?;
    let creds = get_igdb_credentials(db.clone())?.ok_or_else(|| "No credentials".to_string())?;

    tokio::time::sleep(std::time::Duration::from_millis(250)).await;

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.igdb.com/v4/games")
        .header("Client-ID", &creds.client_id)
        .header("Authorization", format!("Bearer {}", token))
        .body(format!(
            "search \"{}\"; fields id,name,cover.url; limit 10;",
            query
        ))
        .send()
        .await
        .map_err(|e| format!("IGDB search failed: {}", e))?;

    let results: Vec<IgdbGame> = response
        .json()
        .await
        .map_err(|e| format!("Parse failed: {}", e))?;

    Ok(results)
}

#[tauri::command]
pub async fn match_folders_with_igdb(
    results: Vec<ScanResult>,
    db: State<'_, Database>,
) -> Result<Vec<ScanResult>, String> {
    let token = get_igdb_token(&db).await?;
    let creds = get_igdb_credentials(db.clone())?.ok_or_else(|| "No credentials".to_string())?;

    let mut matched_results = Vec::new();

    for mut result in results {
        let display_lower = result.display_name.to_lowercase();

        // Rate limiting
        tokio::time::sleep(std::time::Duration::from_millis(250)).await;

        // Search IGDB
        let client = reqwest::Client::new();
        let response = client
            .post("https://api.igdb.com/v4/games")
            .header("Client-ID", &creds.client_id)
            .header("Authorization", format!("Bearer {}", token))
            .body(format!(
                "search \"{}\"; fields id,name,slug; limit 5;",
                display_lower
            ))
            .send()
            .await;

        if let Ok(resp) = response {
            if let Ok(igdb_results) = resp.json::<Vec<IgdbSearchResult>>().await {
                if let Some(best_match) = igdb_results.first() {
                    let distance = levenshtein(&display_lower, &best_match.name.to_lowercase());
                    
                    if distance <= 2 {
                        result.igdb_id = Some(best_match.id);
                        result.igdb_slug = best_match.slug.clone();
                        result.match_source = if distance == 0 {
                            "igdb_exact".to_string()
                        } else {
                            "igdb_fuzzy".to_string()
                        };
                        result.candidates = igdb_results
                            .iter()
                            .map(|g| MatchCandidate {
                                id: g.id,
                                name: g.name.clone(),
                                distance: levenshtein(&display_lower, &g.name.to_lowercase()),
                                cover_url: None,
                                slug: g.slug.clone(),
                            })
                            .collect();
                    }
                }
            }
        }

        // If no IGDB match, try Steam fallback
        if result.igdb_id.is_none() {
            // Call existing Steam matcher logic here
            // For now, keep as heuristic
            result.match_source = "heuristic".to_string();
        }

        matched_results.push(result);
    }

    Ok(matched_results)
}



/// Clear IGDB cache - removes all cached data but keeps credentials
#[tauri::command]
pub fn clear_igdb_cache(db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    println!("[clear_igdb_cache] Clearing IGDB cache...");
    
    // Clear token cache (will force re-authentication)
    conn.execute("DELETE FROM igdb_token_cache", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear token cache: {}", e))?;
    println!("[clear_igdb_cache] Cleared token cache");
    
    // Clear search cache
    conn.execute("DELETE FROM igdb_cache", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear search cache: {}", e))?;
    println!("[clear_igdb_cache] Cleared search cache");
    
    // Clear games cache
    conn.execute("DELETE FROM igdb_games_cache", [])
        .map_err(|e: rusqlite::Error| format!("Failed to clear games cache: {}", e))?;
    println!("[clear_igdb_cache] Cleared games cache");
    
    println!("[clear_igdb_cache] IGDB cache cleared successfully!");
    Ok(true)
}

/// Refresh game data from IGDB - fetches full details and updates the database
#[tauri::command]
pub async fn refresh_game_from_igdb(
    game_id: i64,
    db: State<'_, Database>,
) -> Result<bool, String> {
    let igdb_id: i64 = {
        let conn = db.lock_conn()?;
        conn.query_row(
            "SELECT igdb_id FROM games WHERE id = ?1",
            rusqlite::params![game_id],
            |row| row.get(0),
        )
        .map_err(|_| format!("Game {} not found or has no IGDB ID", game_id))?
    };
    
    let token = get_igdb_token(&db).await?;
    let creds = get_igdb_credentials(db.clone())?.ok_or_else(|| "IGDB credentials not configured".to_string())?;
    
    // Rate limiting
    tokio::time::sleep(std::time::Duration::from_millis(250)).await;
    
    let client = reqwest::Client::new();
    let response = client
        .post("https://api.igdb.com/v4/games")
        .header("Client-ID", &creds.client_id)
        .header("Authorization", format!("Bearer {}", token))
        .body(format!(
            "fields id,name,cover.url,rating,summary,genres,game_modes,player_perspectives,themes,first_release_date; where id = {};",
            igdb_id
        ))
        .send()
        .await
        .map_err(|e| format!("IGDB request failed: {}", e))?;
    
    let mut igdb_games: Vec<IgdbGame> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse IGDB response: {}", e))?;
    
    if igdb_games.is_empty() {
        return Err("Game not found on IGDB".to_string());
    }
    
    let igdb_game = igdb_games.remove(0);
    
    // Format release date
    let release_date = igdb_game.first_release_date
        .map(|ts| {
            chrono::DateTime::from_timestamp(ts, 0)
                .map(|dt| dt.format("%Y-%m-%d").to_string())
                .unwrap_or_default()
        });
    
    // Format cover URL
    let cover_url = igdb_game.cover.as_ref().map(|c| format_cover_url(&c.url));
    
    // Update game in database
    let conn = db.lock_conn()?;
    
    conn.execute(
        "UPDATE games SET cover_url = ?1, synopsis = ?2, release_date = ?3, igdb_rating = ?4, updated_at = datetime('now') WHERE id = ?5",
        rusqlite::params![
            cover_url,
            igdb_game.summary,
            release_date,
            igdb_rating_from_igdb(&igdb_game),
            game_id,
        ],
    ).map_err(|e| format!("Failed to update game: {}", e))?;
    
    // Clear existing metadata
    conn.execute("DELETE FROM game_genres WHERE game_id = ?1", rusqlite::params![game_id])
        .map_err(|e| format!("Failed to clear genres: {}", e))?;
    conn.execute("DELETE FROM game_game_modes WHERE game_id = ?1", rusqlite::params![game_id])
        .map_err(|e| format!("Failed to clear game modes: {}", e))?;
    conn.execute("DELETE FROM game_player_perspectives WHERE game_id = ?1", rusqlite::params![game_id])
        .map_err(|e| format!("Failed to clear player perspectives: {}", e))?;
    conn.execute("DELETE FROM game_themes WHERE game_id = ?1", rusqlite::params![game_id])
        .map_err(|e| format!("Failed to clear themes: {}", e))?;
    
    // Save new metadata
    let genres = igdb_game.genres.unwrap_or_default()
        .into_iter()
        .map(|g| IgdbGenreSimple { id: g.id, name: g.name })
        .collect::<Vec<_>>();
    let game_modes = igdb_game.game_modes.unwrap_or_default()
        .into_iter()
        .map(|g| IgdbGenreSimple { id: g.id, name: g.name })
        .collect::<Vec<_>>();
    let player_perspectives = igdb_game.player_perspectives.unwrap_or_default()
        .into_iter()
        .map(|g| IgdbGenreSimple { id: g.id, name: g.name })
        .collect::<Vec<_>>();
    let themes = igdb_game.themes.unwrap_or_default()
        .into_iter()
        .map(|g| IgdbGenreSimple { id: g.id, name: g.name })
        .collect::<Vec<_>>();
    
    save_game_metadata(&conn, game_id, &genres, &game_modes, &player_perspectives, &themes)?;
    
    println!("[refresh_game_from_igdb] Successfully refreshed game {} from IGDB", game_id);
    Ok(true)
}

/// Extract rating from IGDB game (handles null values)
fn igdb_rating_from_igdb(game: &IgdbGame) -> Option<f64> {
    game.rating
}
