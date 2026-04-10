use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub id: i64,
    pub folder_name: String,
    pub folder_path: String,
    pub display_name: String,
    pub igdb_id: Option<i64>,
    pub igdb_slug: Option<String>,
    pub personal_rating: Option<i64>,
    pub igdb_rating: Option<f64>,
    pub notes: Option<String>,
    pub cover_url: Option<String>,
    pub synopsis: Option<String>,
    pub release_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<Tag>,
    pub genres: Vec<Genre>,
    pub game_modes: Vec<GameMode>,
    pub player_perspectives: Vec<PlayerPerspective>,
    pub themes: Vec<Theme>,
    // New fields for features 1-5
    pub play_time: Option<f64>,           // Hours played
    pub completion_status: Option<String>, // not_started, playing, completed, dropped, wishlist
    pub is_favorite: Option<bool>,
    pub last_played: Option<String>,
    pub executable_path: Option<String>,
    pub store_links: Option<String>,      // JSON string of store links
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_system: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Screenshot {
    pub id: i64,
    pub game_id: i64,
    pub file_path: String,
    pub caption: Option<String>,
    pub is_cover: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Genre {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMode {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerPerspective {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannedFolder {
    pub id: i64,
    pub path: String,
    pub last_scanned: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameFilters {
    pub tag_ids: Option<Vec<i64>>,
    pub min_rating: Option<i64>,
    pub max_rating: Option<i64>,
    pub search_query: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    // New filter fields
    pub completion_status: Option<String>,
    pub is_favorite: Option<bool>,
    pub collection_id: Option<i64>,
    pub min_play_time: Option<f64>,
    pub max_play_time: Option<f64>,
    pub genre: Option<String>,
    pub mode: Option<String>,
    pub perspective: Option<String>,
    pub theme: Option<String>,
    pub tag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchHistoryEntry {
    pub id: i64,
    pub query: String,
    pub filters: Option<String>,
    pub searched_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoreLink {
    pub store: String, // steam, gog, epic, etc.
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameStatistics {
    pub total_games: i64,
    pub total_play_time: f64,
    pub average_rating: f64,
    pub games_by_status: Vec<StatusCount>,
    pub games_by_genre: Vec<GenreCount>,
    pub recently_added: Vec<Game>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenreCount {
    pub genre: String,
    pub count: i64,
}

