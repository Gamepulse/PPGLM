use tauri::{AppHandle, Emitter, Manager};
use crate::db::Database;
use crate::commands::musicbrainz::search_musicbrainz_soundtracks;
use log;

/// Event emitted when soundtracks are found in background
#[derive(Clone, serde::Serialize)]
pub struct SoundtracksFoundEvent {
    pub game_id: i64,
    pub game_name: String,
    pub count: usize,
}

/// Background task to auto-fetch soundtracks for a game
/// This is called when a new game is added to the library
#[tauri::command]
pub async fn background_fetch_soundtracks(
    app: AppHandle,
    game_id: i64,
    game_name: String,
) -> Result<(), String> {
    log::info!("Background fetching soundtracks for game {}: '{}'", game_id, game_name);
    
    // Search MusicBrainz
    let releases = match search_musicbrainz_soundtracks(game_name.clone()).await {
        Ok(releases) => releases,
        Err(e) => {
            log::warn!("Failed to search MusicBrainz for '{}': {}", game_name, e);
            return Ok(()); // Don't fail the background task
        }
    };
    
    if releases.is_empty() {
        log::info!("No soundtracks found for '{}'", game_name);
        return Ok(());
    }
    
    log::info!("Found {} soundtracks for '{}' in background", releases.len(), game_name);
    
    // Emit event to frontend
    let event = SoundtracksFoundEvent {
        game_id,
        game_name: game_name.clone(),
        count: releases.len(),
    };
    
    if let Err(e) = app.emit("soundtracks-found", event) {
        log::error!("Failed to emit soundtracks-found event: {}", e);
    }
    
    // Optionally auto-save the first soundtrack
    // Uncomment if you want automatic saving without user confirmation
    /*
    if let Some(release) = releases.first() {
        let db = app.state::<Database>();
        let _ = crate::commands::musicbrainz::save_musicbrainz_soundtrack(
            game_id,
            release.id.clone(),
            release.title.clone(),
            Some(release.artist_credit.iter().map(|a| a.name.clone()).collect::<Vec<_>>().join(", ")),
            release.date.clone(),
            release.cover_url.clone(),
            release.track_count,
            db,
        );
    }
    */
    
    Ok(())
}

/// Command to fetch and save soundtracks automatically (for user confirmation)
#[tauri::command]
pub async fn auto_fetch_and_save_soundtracks(
    app: AppHandle,
    game_id: i64,
    game_name: String,
) -> Result<usize, String> {
    log::info!("Auto-fetching and saving soundtracks for game {}: '{}'", game_id, game_name);
    
    let db = app.state::<Database>();
    
    // Search MusicBrainz
    let releases = match search_musicbrainz_soundtracks(game_name.clone()).await {
        Ok(releases) => releases,
        Err(e) => {
            log::error!("Failed to search MusicBrainz: {}", e);
            return Err(e);
        }
    };
    
    let mut saved_count = 0;
    
    // Save up to 3 soundtracks
    for release in releases.iter().take(3) {
        let artist = release.artist_credit.iter()
            .map(|a| a.name.clone())
            .collect::<Vec<_>>()
            .join(", ");
        
        match crate::commands::musicbrainz::save_musicbrainz_soundtrack(
            game_id,
            release.id.clone(),
            release.title.clone(),
            Some(artist),
            release.date.clone(),
            release.cover_url.clone(),
            release.track_count,
            db.clone(),
        ).await {
            Ok(_) => {
                saved_count += 1;
                log::info!("Saved soundtrack: {}", release.title);
            }
            Err(e) => {
                log::warn!("Failed to save soundtrack {}: {}", release.title, e);
            }
        }
    }
    
    // Emit refresh event
    if let Err(e) = app.emit("soundtracks-updated", game_id) {
        log::error!("Failed to emit soundtracks-updated event: {}", e);
    }
    
    Ok(saved_count)
}
