use serde::{Deserialize, Serialize};

/// Represents a VGMdb album search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VgmdbAlbum {
    pub id: i64,
    pub title: String,
    pub url: String,
    pub cover_url: Option<String>,
    pub artists: Vec<String>,
    pub release_date: Option<String>,
    pub track_count: Option<i32>,
    pub catalog_number: Option<String>,
}

/// Represents a stored soundtrack entry in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSoundtrack {
    pub id: i64,
    pub game_id: i64,
    pub vgmdb_album_id: Option<i64>,
    pub vgmdb_url: Option<String>,
    pub album_title: Option<String>,
    pub album_artist: Option<String>,
    pub release_date: Option<String>,
    pub cover_url: Option<String>,
    pub spotify_uri: Option<String>,
    pub spotify_url: Option<String>,
    pub youtube_url: Option<String>,
    pub track_count: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

/// Search response from VGMdb
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VgmdbSearchResponse {
    pub results: Vec<VgmdbAlbum>,
    pub total: i32,
}

impl VgmdbAlbum {
    /// Build the full VGMdb URL from album ID
    pub fn build_url(album_id: i64) -> String {
        format!("https://vgmdb.net/album/{}", album_id)
    }

    /// Build the VGMdb info API URL (from vgmdb.info) - kept for compatibility
    pub fn build_api_url(album_id: i64) -> String {
        format!("https://vgmdb.info/album/{}?format=json", album_id)
    }

    /// Build the VGMdb search URL
    pub fn build_search_url(query: &str) -> String {
        format!(
            "https://vgmdb.net/db/collections.php?page=1&perpage=25&search={}",
            urlencoding::encode(query)
        )
    }
}
