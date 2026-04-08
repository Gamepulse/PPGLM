use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub folder_name: String,
    pub folder_path: String,
    pub display_name: String,
    pub match_confidence: MatchConfidence,
    pub candidates: Vec<MatchCandidate>,
    pub igdb_id: Option<i64>,
    pub match_source: String,
    pub cover_url: Option<String>,
    pub synopsis: Option<String>,
    pub release_date: Option<String>,
    // Additional IGDB fields for full game details
    pub igdb_rating: Option<f64>,
    pub genres: Vec<IgdbGenreSimple>,
    pub game_modes: Vec<IgdbGenreSimple>,
    pub player_perspectives: Vec<IgdbGenreSimple>,
    pub themes: Vec<IgdbGenreSimple>,
}

/// Simplified genre/mode/etc structure for scan results (matches frontend types)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IgdbGenreSimple {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MatchConfidence {
    Exact,
    Fuzzy,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchCandidate {
    pub id: i64,
    pub name: String,
    pub distance: usize,
    pub cover_url: Option<String>,
}
