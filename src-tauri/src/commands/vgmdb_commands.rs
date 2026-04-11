use tauri::State;
use crate::db::Database;
use crate::models::vgmdb::*;
use reqwest;
use regex::Regex;
use log;

/// Search for soundtracks on VGMdb by game name (direct scraping)
#[tauri::command]
pub async fn search_vgmdb_soundtracks(game_name: String) -> Result<Vec<VgmdbAlbum>, String> {
    let search_url = VgmdbAlbum::build_search_url(&game_name);
    
    log::info!("Searching VGMdb for: '{}' at URL: {}", game_name, search_url);
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;
    
    let response = client
        .get(&search_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
        .header("Accept-Language", "en-US,en;q=0.5")
        .header("Accept-Encoding", "gzip, deflate, br")
        .header("DNT", "1")
        .header("Connection", "keep-alive")
        .send()
        .await
        .map_err(|e| {
            log::error!("Failed to fetch VGMdb: {}", e);
            format!("Failed to fetch VGMdb: {}", e)
        })?;
    
    let status = response.status();
    log::info!("VGMdb response status: {}", status);
    
    if !status.is_success() {
        return Err(format!("VGMdb returned status: {}", status));
    }
    
    let html = response
        .text()
        .await
        .map_err(|e| {
            log::error!("Failed to read response: {}", e);
            format!("Failed to read response: {}", e)
        })?;
    
    log::debug!("VGMdb HTML length: {} bytes", html.len());
    
    let albums = parse_vgmdb_search_html(&html);
    log::info!("Found {} albums in search results", albums.len());
    
    if albums.is_empty() {
        // Debug: log a snippet of the HTML to understand the structure
        let snippet = if html.len() > 500 {
            &html[..500]
        } else {
            &html
        };
        log::warn!("No albums found. HTML snippet: {}", snippet);
    }
    
    // Enrich with details
    let mut enriched_albums = Vec::new();
    for album in albums.iter().take(5) {
        match get_vgmdb_album_details(album.id).await {
            Ok(detailed) => enriched_albums.push(detailed),
            Err(e) => {
                log::warn!("Failed to get details for album {}: {}", album.id, e);
                enriched_albums.push(album.clone());
            }
        }
    }
    
    Ok(enriched_albums)
}

/// Parse search results from VGMdb HTML - multiple pattern attempts
fn parse_vgmdb_search_html(html: &str) -> Vec<VgmdbAlbum> {
    let mut albums = Vec::new();
    let mut seen_ids = std::collections::HashSet::new();
    
    // Pattern 1: Look for album links in href="/album/XXXX" format with text
    // This catches: <a href="/album/1234">Game Soundtrack</a>
    let patterns = [
        // Pattern 1: Direct album links
        r#"href=["']?/album/(\d+)["']?[^>]*>([^<]{3,})"#,
        // Pattern 2: Album links with additional attributes
        r#"<a[^>]*href=["']?/album/(\d+)["']?[^>]*>([^<]{3,})"#,
        // Pattern 3: Album in list items
        r#"<li[^>]*>.*?<a[^>]*href=["']?/album/(\d+)["']?[^>]*>([^<]{3,})"#,
        // Pattern 4: Album in table cells
        r#"<td[^>]*>.*?<a[^>]*href=["']?/album/(\d+)["']?[^>]*>([^<]{3,})"#,
        // Pattern 5: Album in div containers
        r#"<div[^>]*>.*?<a[^>]*href=["']?/album/(\d+)["']?[^>]*>([^<]{3,})"#,
    ];
    
    for pattern in &patterns {
        if let Ok(re) = Regex::new(pattern) {
            for cap in re.captures_iter(html) {
                if let (Some(id_match), Some(title_match)) = (cap.get(1), cap.get(2)) {
                    if let Ok(id) = id_match.as_str().parse::<i64>() {
                        let title = title_match.as_str().trim().to_string();
                        
                        // Filter out invalid titles
                        if title.len() < 3 { continue; }
                        if title.to_lowercase().contains("album") && title.len() < 10 { continue; }
                        if title.starts_with("<") || title.contains("javascript") { continue; }
                        
                        if seen_ids.insert(id) {
                            log::debug!("Found album {}: {}", id, title);
                            albums.push(VgmdbAlbum {
                                id,
                                title,
                                url: VgmdbAlbum::build_url(id),
                                cover_url: None,
                                artists: Vec::new(),
                                release_date: None,
                                track_count: None,
                                catalog_number: None,
                            });
                        }
                    }
                }
            }
        }
    }
    
    // Also try to find album links that might be in JSON or data attributes
    // Some sites load data dynamically
    let json_pattern = r#""album":\s*{[^}]*"id":\s*(\d+)[^}]*"name":\s*"([^"]+)""#;
    if let Ok(re) = Regex::new(json_pattern) {
        for cap in re.captures_iter(html) {
            if let (Some(id_match), Some(title_match)) = (cap.get(1), cap.get(2)) {
                if let Ok(id) = id_match.as_str().parse::<i64>() {
                    let title = title_match.as_str().to_string();
                    if seen_ids.insert(id) && title.len() > 2 {
                        albums.push(VgmdbAlbum {
                            id,
                            title,
                            url: VgmdbAlbum::build_url(id),
                            cover_url: None,
                            artists: Vec::new(),
                            release_date: None,
                            track_count: None,
                            catalog_number: None,
                        });
                    }
                }
            }
        }
    }
    
    albums
}

/// Get soundtrack details by VGMdb album ID (direct scraping)
#[tauri::command]
pub async fn get_vgmdb_album_details(album_id: i64) -> Result<VgmdbAlbum, String> {
    let url = VgmdbAlbum::build_url(album_id);
    
    log::info!("Fetching VGMdb album details for ID: {} at {}", album_id, url);
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;
    
    let response = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
        .header("Accept-Language", "en-US,en;q=0.5")
        .send()
        .await
        .map_err(|e| {
            log::error!("Failed to fetch album {}: {}", album_id, e);
            format!("Failed to fetch album: {}", e)
        })?;
    
    let status = response.status();
    if !status.is_success() {
        return Err(format!("Album not found or error: {}", status));
    }
    
    let html = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    parse_vgmdb_album_html(&html, album_id)
        .ok_or_else(|| {
            log::error!("Failed to parse album {} HTML", album_id);
            "Failed to parse album data".to_string()
        })
}

/// Parse album details from VGMdb HTML
fn parse_vgmdb_album_html(html: &str, album_id: i64) -> Option<VgmdbAlbum> {
    // Try multiple methods to extract the title
    let mut title = None;
    
    // Method 1: Look in <title> tag
    let title_regex = Regex::new(r#"<title>([^<]+)</title>"#).ok()?;
    if let Some(cap) = title_regex.captures(html) {
        if let Some(title_match) = cap.get(1) {
            let raw_title = title_match.as_str();
            // Remove " - VGMdb" suffix
            if let Some(idx) = raw_title.rfind(" - VGMdb") {
                let cleaned = raw_title[..idx].trim();
                if !cleaned.is_empty() {
                    title = Some(cleaned.to_string());
                }
            }
        }
    }
    
    // Method 2: Look for albumtitle class
    if title.is_none() {
        let patterns = [
            r#"class=["']albumtitle["'][^>]*>([^<]+)"#,
            r#"class=["']albumtitle["'][^>]*>([^<]+)<"#,
            r#"<span[^>]*class=["']albumtitle["'][^>]*>([^<]+)"#,
            r#"<h1[^>]*>([^<]+)"#,
        ];
        
        for pattern in &patterns {
            if let Ok(re) = Regex::new(pattern) {
                if let Some(cap) = re.captures(html) {
                    if let Some(title_match) = cap.get(1) {
                        let cleaned = title_match.as_str().trim();
                        if !cleaned.is_empty() && cleaned.len() > 2 {
                            title = Some(cleaned.to_string());
                            break;
                        }
                    }
                }
            }
        }
    }
    
    let title = title.unwrap_or_else(|| format!("Album {}", album_id));
    
    // Try to extract cover image
    let mut cover_url = None;
    let cover_patterns = [
        r#"<img[^>]*class=["']cover["'][^>]*src=["']([^"']+)"#,
        r#"<img[^>]*src=["']([^"']*/album/[^"']*)["']"#,
        r#"<img[^>]*src=["']([^"']*cover[^"']*)["']"#,
        r#"href=["'][^"']*large/[^"']*["'][^>]*>\s*<img[^>]*src=["']([^"']+)"#,
    ];
    
    for pattern in &cover_patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(cap) = re.captures(html) {
                if let Some(src_match) = cap.get(1) {
                    let src = src_match.as_str();
                    let full_url = if src.starts_with("http") {
                        src.to_string()
                    } else if src.starts_with("//") {
                        format!("https:{}", src)
                    } else {
                        format!("https://vgmdb.net{}", src)
                    };
                    cover_url = Some(full_url);
                    break;
                }
            }
        }
    }
    
    // Try to extract artists
    let mut artists = Vec::new();
    let artist_patterns = [
        r#"href=["']/artist/(\d+)["'][^>]*>([^<]+)"#,
        r#"href=["']/composer/(\d+)["'][^>]*>([^<]+)"#,
        r#"Composer[s]?[:\s]*<[^>]*>([^<]+)"#,
    ];
    
    for pattern in &artist_patterns {
        if let Ok(re) = Regex::new(pattern) {
            for cap in re.captures_iter(html) {
                let name = if cap.len() > 2 {
                    cap.get(2).map(|m| m.as_str().trim().to_string())
                } else {
                    cap.get(1).map(|m| m.as_str().trim().to_string())
                };
                
                if let Some(name) = name {
                    if !name.is_empty() && !artists.contains(&name) && name.len() > 1 && name.len() < 100 {
                        artists.push(name);
                    }
                }
            }
        }
    }
    
    // Try to extract release date
    let mut release_date = None;
    let date_patterns = [
        r#"(?:Release|Date|Published)[:\s]*<[^>]*>\s*([\d]{4}[\-\/][\d]{2}[\-\/][\d]{2})"#,
        r#"(?:Release|Date|Published)[:\s]*([\d]{4}[\-\/][\d]{2}[\-\/][\d]{2})"#,
        r#"([\d]{4}[\-\/][\d]{2}[\-\/][\d]{2})"#,
        r#"([\d]{4})"#,
    ];
    
    for pattern in &date_patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(cap) = re.captures(html) {
                if let Some(date_match) = cap.get(1) {
                    let date_str = date_match.as_str();
                    if date_str.len() >= 4 {
                        release_date = Some(date_str.to_string());
                        break;
                    }
                }
            }
        }
    }
    
    // Try to extract track count
    let mut track_count = None;
    // (?i) makes it case-insensitive inline
    let track_regex = Regex::new(r#"(?i)(\d+)\s*tracks?"#).ok();
    if let Some(re) = track_regex {
        if let Some(cap) = re.captures(html) {
            if let Some(count_match) = cap.get(1) {
                if let Ok(count) = count_match.as_str().parse::<i32>() {
                    if count > 0 && count < 500 { // Sanity check
                        track_count = Some(count);
                    }
                }
            }
        }
    }
    
    // Try to extract catalog number
    let mut catalog_number = None;
    let catalog_patterns = [
        r#"(?:Catalog|Catalogue)[:\s#]*([A-Z0-9\-]+)"#,
        r#"Catalog(?:ue)?[:\s#]*([A-Z][A-Z0-9\-]{2,})"#,
    ];
    
    for pattern in &catalog_patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(cap) = re.captures(html) {
                if let Some(catalog_match) = cap.get(1) {
                    let cat = catalog_match.as_str().trim();
                    if !cat.is_empty() && cat.len() > 2 && cat.len() < 30 {
                        catalog_number = Some(cat.to_string());
                        break;
                    }
                }
            }
        }
    }
    
    log::debug!("Parsed album {}: title='{}', artists={:?}, date={:?}, tracks={:?}", 
                album_id, title, artists, release_date, track_count);
    
    Some(VgmdbAlbum {
        id: album_id,
        title,
        url: VgmdbAlbum::build_url(album_id),
        cover_url,
        artists,
        release_date,
        track_count,
        catalog_number,
    })
}

/// Get soundtracks for a game from the database
#[tauri::command]
pub fn get_game_soundtracks(
    game_id: i64,
    db: State<'_, Database>,
) -> Result<Vec<GameSoundtrack>, String> {
    let conn = db.lock_conn()?;
    
    let mut stmt = conn
        .prepare(
            "SELECT id, game_id, vgmdb_album_id, vgmdb_url, album_title, 
                    album_artist, release_date, cover_url, spotify_uri, 
                    spotify_url, youtube_url, track_count, created_at, updated_at
             FROM game_soundtracks 
             WHERE game_id = ?
             ORDER BY created_at DESC"
        )
        .map_err(|e| e.to_string())?;
    
    let soundtracks = stmt
        .query_map([game_id], |row| {
            Ok(GameSoundtrack {
                id: row.get(0)?,
                game_id: row.get(1)?,
                vgmdb_album_id: row.get(2)?,
                vgmdb_url: row.get(3)?,
                album_title: row.get(4)?,
                album_artist: row.get(5)?,
                release_date: row.get(6)?,
                cover_url: row.get(7)?,
                spotify_uri: row.get(8)?,
                spotify_url: row.get(9)?,
                youtube_url: row.get(10)?,
                track_count: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(soundtracks)
}

/// Add or update a soundtrack for a game
#[tauri::command]
pub fn save_game_soundtrack(
    game_id: i64,
    vgmdb_album_id: Option<i64>,
    vgmdb_url: Option<String>,
    album_title: Option<String>,
    album_artist: Option<String>,
    release_date: Option<String>,
    cover_url: Option<String>,
    spotify_uri: Option<String>,
    spotify_url: Option<String>,
    youtube_url: Option<String>,
    track_count: Option<i32>,
    db: State<'_, Database>,
) -> Result<i64, String> {
    let conn = db.lock_conn()?;
    
    // Check if soundtrack already exists for this game with same VGMdb ID
    let existing_id: Option<i64> = if let Some(vgmdb_id) = vgmdb_album_id {
        conn.query_row(
            "SELECT id FROM game_soundtracks WHERE game_id = ? AND vgmdb_album_id = ?",
            [game_id, vgmdb_id],
            |row| row.get(0),
        ).ok()
    } else {
        None
    };
    
    let id = if let Some(id) = existing_id {
        // Update existing
        conn.execute(
            "UPDATE game_soundtracks 
             SET vgmdb_url = ?, album_title = ?, album_artist = ?, 
                 release_date = ?, cover_url = ?, spotify_uri = ?, 
                 spotify_url = ?, youtube_url = ?, track_count = ?, updated_at = datetime('now')
             WHERE id = ?",
            rusqlite::params![
                vgmdb_url, album_title, album_artist, release_date, 
                cover_url, spotify_uri, spotify_url, youtube_url, track_count, id
            ],
        ).map_err(|e| e.to_string())?;
        id
    } else {
        // Insert new
        conn.execute(
            "INSERT INTO game_soundtracks 
             (game_id, vgmdb_album_id, vgmdb_url, album_title, album_artist, 
              release_date, cover_url, spotify_uri, spotify_url, youtube_url, track_count)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                game_id, vgmdb_album_id, vgmdb_url, album_title, album_artist,
                release_date, cover_url, spotify_uri, spotify_url, youtube_url, track_count
            ],
        ).map_err(|e| e.to_string())?;
        conn.last_insert_rowid()
    };
    
    // Update game has_soundtrack flag
    conn.execute(
        "UPDATE games SET has_soundtrack = 1, soundtrack_fetched_at = datetime('now') WHERE id = ?",
        [game_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(id)
}

/// Delete a soundtrack entry
#[tauri::command]
pub fn delete_game_soundtrack(
    soundtrack_id: i64,
    db: State<'_, Database>,
) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    conn.execute(
        "DELETE FROM game_soundtracks WHERE id = ?",
        [soundtrack_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(true)
}

/// Update Spotify link for a soundtrack
#[tauri::command]
pub fn update_soundtrack_spotify_link(
    soundtrack_id: i64,
    spotify_uri: Option<String>,
    spotify_url: Option<String>,
    db: State<'_, Database>,
) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    conn.execute(
        "UPDATE game_soundtracks 
         SET spotify_uri = ?, spotify_url = ?, updated_at = datetime('now')
         WHERE id = ?",
        rusqlite::params![spotify_uri, spotify_url, soundtrack_id],
    ).map_err(|e| e.to_string())?;
    
    Ok(true)
}

/// Auto-search and save soundtracks for a game
#[tauri::command]
pub async fn auto_fetch_soundtracks(
    game_id: i64,
    game_name: String,
    db: State<'_, Database>,
) -> Result<Vec<GameSoundtrack>, String> {
    log::info!("Auto-fetching soundtracks for game {}: '{}'", game_id, game_name);
    
    // Search VGMdb
    let albums: Vec<VgmdbAlbum> = search_vgmdb_soundtracks(game_name.clone()).await?;
    log::info!("Found {} albums for '{}', saving up to 3", albums.len(), game_name);
    
    let mut saved = Vec::new();
    
    for album in albums.iter().take(3) {
        log::info!("Saving soundtrack: {} (ID: {})", album.title, album.id);
        
        // Save each soundtrack
        let id = save_game_soundtrack(
            game_id,
            Some(album.id),
            Some(album.url.clone()),
            Some(album.title.clone()),
            Some(album.artists.join(", ")),
            album.release_date.clone(),
            album.cover_url.clone(),
            None, // spotify_uri
            None, // spotify_url
            None, // youtube_url
            album.track_count,
            db.clone(),
        )?;
        
        // Fetch the saved soundtrack
        if let Ok(soundtrack) = get_single_soundtrack(id, &db) {
            saved.push(soundtrack);
        }
    }
    
    log::info!("Saved {} soundtracks for game {}", saved.len(), game_id);
    Ok(saved)
}

fn get_single_soundtrack(id: i64, db: &Database) -> Result<GameSoundtrack, String> {
    let conn = db.lock_conn()?;
    
    conn.query_row(
        "SELECT id, game_id, vgmdb_album_id, vgmdb_url, album_title, 
                album_artist, release_date, cover_url, spotify_uri, 
                spotify_url, youtube_url, track_count, created_at, updated_at
         FROM game_soundtracks 
         WHERE id = ?",
        [id],
        |row| {
            Ok(GameSoundtrack {
                id: row.get(0)?,
                game_id: row.get(1)?,
                vgmdb_album_id: row.get(2)?,
                vgmdb_url: row.get(3)?,
                album_title: row.get(4)?,
                album_artist: row.get(5)?,
                release_date: row.get(6)?,
                cover_url: row.get(7)?,
                spotify_uri: row.get(8)?,
                spotify_url: row.get(9)?,
                youtube_url: row.get(10)?,
                track_count: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        },
    ).map_err(|e| e.to_string())
}
