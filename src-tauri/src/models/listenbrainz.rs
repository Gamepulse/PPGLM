use serde::{Deserialize, Serialize};

/// Represents a ListenBrainz metadata response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListenBrainzMetadataResponse {
    #[serde(rename = "recording_mbid")]
    pub recording_mbid: Option<String>,
    #[serde(rename = "recording_name")]
    pub recording_name: Option<String>,
    #[serde(rename = "artist_credit_name")]
    pub artist_credit_name: Option<String>,
    #[serde(rename = "artist_mbids")]
    pub artist_mbids: Option<Vec<String>>,
    #[serde(rename = "release_mbid")]
    pub release_mbid: Option<String>,
    #[serde(rename = "release_name")]
    pub release_name: Option<String>,
    #[serde(rename = "additional_info")]
    pub additional_info: Option<ListenBrainzAdditionalInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListenBrainzAdditionalInfo {
    pub youtube: Option<String>,
    #[serde(rename = "origin_url")]
    pub origin_url: Option<String>,
    #[serde(rename = "spotify_id")]
    pub spotify_id: Option<String>,
}

/// YouTube video info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubeVideoInfo {
    pub video_id: String,
    pub title: String,
    pub thumbnail_url: String,
    pub embed_url: String,
    pub watch_url: String,
}

impl YouTubeVideoInfo {
    /// Create from a YouTube URL or video ID
    pub fn from_url_or_id(url_or_id: &str) -> Option<Self> {
        // Extract video ID from various YouTube URL formats
        let video_id = if url_or_id.len() == 11 && !url_or_id.contains("/") {
            // It's already a video ID
            url_or_id.to_string()
        } else if let Some(id) = Self::extract_video_id(url_or_id) {
            id
        } else {
            return None;
        };

        Some(Self {
            video_id: video_id.clone(),
            title: String::new(),
            thumbnail_url: format!("https://img.youtube.com/vi/{}/mqdefault.jpg", video_id),
            embed_url: format!("https://www.youtube.com/embed/{}", video_id),
            watch_url: format!("https://www.youtube.com/watch?v={}", video_id),
        })
    }

    fn extract_video_id(url: &str) -> Option<String> {
        // youtube.com/watch?v=VIDEO_ID
        if let Some(pos) = url.find("v=") {
            let start = pos + 2;
            let end = url[start..].find('&').map(|i| start + i).unwrap_or(url.len());
            return Some(url[start..end].to_string());
        }
        
        // youtu.be/VIDEO_ID
        if let Some(pos) = url.find("youtu.be/") {
            let start = pos + 9;
            let end = url[start..].find('?').map(|i| start + i).unwrap_or(url.len());
            return Some(url[start..end].to_string());
        }
        
        // youtube.com/embed/VIDEO_ID
        if let Some(pos) = url.find("embed/") {
            let start = pos + 6;
            let end = url[start..].find('?').map(|i| start + i).unwrap_or(url.len());
            return Some(url[start..end].to_string());
        }
        
        None
    }
}
