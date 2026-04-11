use tauri::State;
use crate::db::Database;
use crate::models::musicbrainz::*;
use reqwest;
use log;

/// Search for video game soundtracks on MusicBrainz
#[tauri::command]
pub async fn search_musicbrainz_soundtracks(
    game_name: String,
) -> Result<Vec<MusicBrainzRelease>, String> {
    // Construct search query with video game tag filter
    let query = format!(
        "release:{} AND (tag:video\\ game\\ music OR tag:vgm OR tag:game\\ soundtrack)",
        urlencoding::encode(&game_name)
    );
    
    let search_url = format!(
        "https://musicbrainz.org/ws/2/release/?query={}&fmt=json&limit=10",
        query
    );
    
    log::info!("Searching MusicBrainz for: '{}'", game_name);
    log::info!("URL: {}", search_url);
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;
    
    // MusicBrainz requires a User-Agent header
    let response = client
        .get(&search_url)
        .header("User-Agent", "PascalGameManager/0.4.1 (your@email.com)")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| {
            log::error!("Failed to fetch MusicBrainz: {}", e);
            format!("Failed to fetch MusicBrainz: {}", e)
        })?;
    
    let status = response.status();
    log::info!("MusicBrainz response status: {}", status);
    
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        log::error!("MusicBrainz error: {} - {}", status, body);
        return Err(format!("MusicBrainz returned status: {} - {}", status, body));
    }
    
    let response_text = response
        .text()
        .await
        .map_err(|e| {
            log::error!("Failed to read response: {}", e);
            format!("Failed to read response: {}", e)
        })?;
    
    log::debug!("MusicBrainz response: {}", &response_text[..response_text.len().min(500)]);
    
    // Parse the response
    let mb_response: MusicBrainzSearchResponse = serde_json::from_str(&response_text)
        .map_err(|e| {
            log::error!("Failed to parse MusicBrainz response: {}", e);
            format!("Failed to parse response: {}", e)
        })?;
    
    let releases = mb_response
        .releases
        .map(|api_releases| {
            api_releases
                .iter()
                .map(convert_mb_release)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    
    log::info!("Found {} releases from MusicBrainz", releases.len());
    
    // Try to fetch cover art URLs for each release
    let mut releases_with_covers = Vec::new();
    for release in releases.iter().take(5) {
        let mut release_with_cover = release.clone();
        
        // Try to get cover art - but don't wait too long
        if let Ok(cover_url) = get_cover_art_url(&release.id).await {
            release_with_cover.cover_url = Some(cover_url);
        }
        
        releases_with_covers.push(release_with_cover);
    }
    
    Ok(releases_with_covers)
}

/// Search MusicBrainz without tag restrictions (broader search)
#[tauri::command]
pub async fn search_musicbrainz_broad(
    query: String,
) -> Result<Vec<MusicBrainzRelease>, String> {
    let encoded_query = urlencoding::encode(&query);
    
    let search_url = format!(
        "https://musicbrainz.org/ws/2/release/?query=release:{}&fmt=json&limit=10",
        encoded_query
    );
    
    log::info!("Broad MusicBrainz search for: '{}'", query);
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;
    
    let response = client
        .get(&search_url)
        .header("User-Agent", "PascalGameManager/0.4.1 (your@email.com)")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| {
            log::error!("Failed to fetch MusicBrainz: {}", e);
            format!("Failed to fetch MusicBrainz: {}", e)
        })?;
    
    let status = response.status();
    
    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    if !status.is_success() {
        return Err(format!("MusicBrainz returned status: {} - {}", status, response_text));
    }
    
    let mb_response: MusicBrainzSearchResponse = serde_json::from_str(&response_text)
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    let releases = mb_response
        .releases
        .map(|api_releases| {
            api_releases
                .iter()
                .map(convert_mb_release)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    
    // Fetch cover arts
    let mut releases_with_covers = Vec::new();
    for release in releases.iter().take(5) {
        let mut release_with_cover = release.clone();
        if let Ok(cover_url) = get_cover_art_url(&release.id).await {
            release_with_cover.cover_url = Some(cover_url);
        }
        releases_with_covers.push(release_with_cover);
    }
    
    Ok(releases_with_covers)
}

/// Try to get cover art URL from Cover Art Archive
async fn get_cover_art_url(release_id: &str) -> Result<String, String> {
    let url = format!("https://coverartarchive.org/release/{}/front-250", release_id);
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;
    
    let response = client
        .head(&url)
        .header("User-Agent", "PascalGameManager/0.4.1")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    if response.status().is_success() {
        // Return the original URL - the redirect will be followed
        Ok(format!("https://coverartarchive.org/release/{}/front", release_id))
    } else {
        Err("No cover art available".to_string())
    }
}

/// Get release details from MusicBrainz
#[tauri::command]
pub async fn get_musicbrainz_release_details(
    release_id: String,
) -> Result<MusicBrainzRelease, String> {
    let url = format!(
        "https://musicbrainz.org/ws/2/release/{}?inc=artists&fmt=json",
        release_id
    );
    
    log::info!("Fetching MusicBrainz release details for: {}", release_id);
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;
    
    let response = client
        .get(&url)
        .header("User-Agent", "PascalGameManager/0.4.1 (your@email.com)")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch release: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Release not found: {}", response.status()));
    }
    
    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    // Parse as a single release
    let api_release: MusicBrainzReleaseApi = serde_json::from_str(&response_text)
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    let mut release = convert_mb_release(&api_release);
    
    // Try to get cover art
    if let Ok(cover_url) = get_cover_art_url(&release_id).await {
        release.cover_url = Some(cover_url);
    }
    
    Ok(release)
}

/// Lookup ListenBrainz metadata to get streaming links
/// First tries a simple search which often works better than lookup
async fn lookup_listenbrainz_for_links(
    title: &str,
    artist: &str,
) -> (Option<String>, Option<String>, Option<String>) {
    // Try search first (often more effective for albums)
    let search_query = format!("{} {}", artist, title);
    let search_url = format!(
        "https://api.listenbrainz.org/1/search/?query={}",
        urlencoding::encode(&search_query)
    );
    
    log::info!("Searching ListenBrainz for: {}", search_query);
    
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build() {
        Ok(c) => c,
        Err(e) => {
            log::error!("Failed to create client: {}", e);
            return (None, None, None);
        }
    };
    
    // Try search endpoint first
    let _search_response = match client
        .get(&search_url)
        .header("User-Agent", "PascalGameManager/0.4.1")
        .send()
        .await {
        Ok(r) => {
            if r.status().is_success() {
                if let Ok(text) = r.text().await {
                    log::debug!("ListenBrainz search response: {}", &text[..text.len().min(500)]);
                    // Parse search results if needed
                }
            }
            // Continue to lookup
        },
        Err(e) => {
            log::warn!("ListenBrainz search failed: {}", e);
        }
    };
    
    // Now try lookup endpoint
    let query = format!(
        "https://api.listenbrainz.org/1/metadata/lookup/?recording_name={}&artist_name={}&metadata=true",
        urlencoding::encode(title),
        urlencoding::encode(artist)
    );
    
    log::info!("Looking up ListenBrainz for: {} - {}", artist, title);
    log::info!("Query URL: {}", query);
    
    let response = match client
        .get(&query)
        .header("User-Agent", "PascalGameManager/0.4.1")
        .send()
        .await {
        Ok(r) => r,
        Err(e) => {
            log::warn!("Failed to fetch ListenBrainz: {}", e);
            return (None, None, None);
        }
    };
    
    log::info!("ListenBrainz response status: {}", response.status());
    
    if !response.status().is_success() {
        log::warn!("ListenBrainz returned status: {}", response.status());
        return (None, None, None);
    }
    
    let response_text = match response.text().await {
        Ok(t) => t,
        Err(e) => {
            log::warn!("Failed to read response: {}", e);
            return (None, None, None);
        }
    };
    
    log::info!("ListenBrainz raw response: {}", &response_text[..response_text.len().min(2000)]);
    
    let metadata: crate::models::listenbrainz::ListenBrainzMetadataResponse = match serde_json::from_str(&response_text) {
        Ok(m) => m,
        Err(e) => {
            log::warn!("Failed to parse response: {}", e);
            return (None, None, None);
        }
    };
    
    // Extract links from additional_info
    let mut spotify_url = None;
    let mut youtube_url = None;
    let mut spotify_uri = None;
    
    log::info!("Metadata received: recording_name={:?}, artist={:?}, release={:?}", 
        metadata.recording_name, metadata.artist_credit_name, metadata.release_name);
    
    if let Some(ref additional_info) = metadata.additional_info {
        log::info!("Additional info found");
        
        // Spotify
        if let Some(ref spotify_id) = additional_info.spotify_id {
            log::info!("Spotify ID found: {}", spotify_id);
            if spotify_id.starts_with("http") {
                spotify_url = Some(spotify_id.clone());
                if let Some(id) = spotify_id.split('/').last() {
                    spotify_uri = Some(format!("spotify:track:{}", id));
                }
            } else {
                spotify_uri = Some(format!("spotify:track:{}", spotify_id));
                spotify_url = Some(format!("https://open.spotify.com/track/{}", spotify_id));
            }
        }
        
        // YouTube
        if let Some(ref origin_url) = additional_info.origin_url {
            log::info!("Origin URL found: {}", origin_url);
            if origin_url.contains("youtube.com") || origin_url.contains("youtu.be") {
                youtube_url = Some(origin_url.clone());
            }
        }
        
        // Also check youtube field
        if youtube_url.is_none() {
            if let Some(ref youtube) = additional_info.youtube {
                log::info!("YouTube field found: {}", youtube);
                if youtube.starts_with("http") {
                    youtube_url = Some(youtube.clone());
                }
            }
        }
    } else {
        log::info!("No additional_info in metadata");
    }
    
    log::info!(
        "ListenBrainz final result - Spotify: {:?}, YouTube: {:?}",
        spotify_url.is_some(),
        youtube_url.is_some()
    );
    
    (spotify_url, spotify_uri, youtube_url)
}

/// Save a MusicBrainz release as a soundtrack with auto-fetched ListenBrainz links
#[tauri::command]
pub async fn save_musicbrainz_soundtrack(
    game_id: i64,
    mb_release_id: String,
    title: String,
    artist: Option<String>,
    date: Option<String>,
    cover_url: Option<String>,
    track_count: Option<i32>,
    db: State<'_, Database>,
) -> Result<i64, String> {
    // First, lookup ListenBrainz for streaming links (before acquiring DB lock)
    let (spotify_url, spotify_uri, youtube_url) = if let Some(ref artist_name) = artist {
        lookup_listenbrainz_for_links(&title, artist_name).await
    } else {
        (None, None, None)
    };
    
    // Now acquire DB lock
    let conn = db.lock_conn()?;
    
    // Check if already exists
    let mb_url_pattern = format!("%musicbrainz.org/release/{}", mb_release_id);
    let existing_id: Option<i64> = conn.query_row(
        "SELECT id FROM game_soundtracks WHERE game_id = ? AND vgmdb_url LIKE ?",
        rusqlite::params![game_id, mb_url_pattern],
        |row| row.get(0),
    ).ok();
    
    let mb_url = format!("https://musicbrainz.org/release/{}", mb_release_id);
    
    let id = if let Some(id) = existing_id {
        // Update existing
        conn.execute(
            "UPDATE game_soundtracks 
             SET album_title = ?, album_artist = ?, release_date = ?, 
                 cover_url = ?, track_count = ?, spotify_url = ?, spotify_uri = ?, youtube_url = ?, 
                 updated_at = datetime('now')
             WHERE id = ?",
            rusqlite::params![
                title, artist, date, cover_url, track_count, 
                spotify_url, spotify_uri, youtube_url,
                id
            ],
        ).map_err(|e| e.to_string())?;
        id
    } else {
        // Insert new - using vgmdb_url column to store MusicBrainz URL
        conn.execute(
            "INSERT INTO game_soundtracks 
             (game_id, vgmdb_album_id, vgmdb_url, album_title, album_artist, 
              release_date, cover_url, track_count, spotify_url, spotify_uri, youtube_url)
             VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rusqlite::params![
                game_id, mb_url, title, artist, date, cover_url, track_count,
                spotify_url, spotify_uri, youtube_url
            ],
        ).map_err(|e| e.to_string())?;
        conn.last_insert_rowid()
    };
    
    // Update game has_soundtrack flag
    conn.execute(
        "UPDATE games SET has_soundtrack = 1, soundtrack_fetched_at = datetime('now') WHERE id = ?",
        [game_id],
    ).map_err(|e| e.to_string())?;
    
    log::info!(
        "Saved MusicBrainz soundtrack {} with Spotify: {}, YouTube: {}",
        id,
        spotify_url.is_some(),
        youtube_url.is_some()
    );
    
    Ok(id)
}

/// Auto-fetch soundtracks from MusicBrainz
#[tauri::command]
pub async fn auto_fetch_musicbrainz_soundtracks(
    _game_id: i64,
    game_name: String,
) -> Result<Vec<MusicBrainzRelease>, String> {
    log::info!("Auto-fetching MusicBrainz soundtracks for: {}", game_name);
    
    // Try tagged search first
    let mut releases = search_musicbrainz_soundtracks(game_name.clone()).await?;
    
    // If no results, try broad search
    if releases.is_empty() {
        log::info!("No tagged results, trying broad search for: {}", game_name);
        releases = search_musicbrainz_broad(game_name).await?;
    }
    
    log::info!("Found {} releases from MusicBrainz", releases.len());
    Ok(releases)
}
