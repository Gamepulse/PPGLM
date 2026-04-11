use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub folder_name: String,
    pub folder_path: String,
    pub display_name: String,
    pub match_confidence: MatchConfidence,
    pub candidates: Vec<MatchCandidate>,
    pub igdb_id: Option<i64>,
    pub igdb_slug: Option<String>,
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
    pub platforms: Vec<IgdbGenreSimple>,
    // User-selected platform (optional, set before saving)
    pub platform: Option<String>,
    // Whether this folder matches exclusion patterns
    pub is_excluded: bool,
    // Whether this match was rejected (distance too high) but can be accepted by user
    pub is_rejected: bool,
    // Whether this is a parent folder scanned but not matched (intermediate folder)
    pub is_parent: bool,
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
    pub slug: Option<String>,
}
