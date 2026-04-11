use crate::models::listenbrainz::*;
use reqwest;
use log;

/// Lookup metadata from ListenBrainz to get YouTube links
#[tauri::command]
pub async fn lookup_listenbrainz_metadata(
    recording_name: String,
    artist_name: String,
) -> Result<ListenBrainzMetadataResponse, String> {
    let query = format!(
        "https://api.listenbrainz.org/1/metadata/lookup/?recording_name={}&artist_name={}&metadata=true",
        urlencoding::encode(&recording_name),
        urlencoding::encode(&artist_name)
    );
    
    log::info!("Looking up ListenBrainz metadata for: {} - {}", artist_name, recording_name);
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    
    let response = client
        .get(&query)
        .header("User-Agent", "PascalGameManager/0.4.1")
        .send()
        .await
        .map_err(|e| {
            log::error!("Failed to fetch ListenBrainz: {}", e);
            format!("Failed to fetch ListenBrainz: {}", e)
        })?;
    
    if !response.status().is_success() {
        return Err(format!("ListenBrainz returned status: {}", response.status()));
    }
    
    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    let metadata: ListenBrainzMetadataResponse = serde_json::from_str(&response_text)
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    Ok(metadata)
}

/// Search for a track on YouTube
#[tauri::command]
pub async fn search_youtube_video(
    query: String,
) -> Result<Vec<YouTubeVideoInfo>, String> {
    // For now, return empty - YouTube API requires an API key
    // In the future, this could use YouTube Data API v3
    log::info!("YouTube search not implemented yet. Query: {}", query);
    Ok(Vec::new())
}

/// Extract YouTube info from a URL
#[tauri::command]
pub fn extract_youtube_info(url: String) -> Result<YouTubeVideoInfo, String> {
    YouTubeVideoInfo::from_url_or_id(&url)
        .ok_or_else(|| "Invalid YouTube URL or video ID".to_string())
}

/// Get YouTube videos for an album from MusicBrainz recordings
#[tauri::command]
pub async fn get_youtube_videos_for_album(
    album_title: String,
    artist_name: String,
) -> Result<Vec<YouTubeVideoInfo>, String> {
    // This would search YouTube for tracks from the album
    // For now, return empty as it requires YouTube API key
    log::info!("YouTube album search not implemented yet. Album: {} - Artist: {}", album_title, artist_name);
    Ok(Vec::new())
}
