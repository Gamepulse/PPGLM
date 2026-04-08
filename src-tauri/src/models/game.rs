use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub id: i64,
    pub folder_name: String,
    pub folder_path: String,
    pub display_name: String,
    pub igdb_id: Option<i64>,
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
}

