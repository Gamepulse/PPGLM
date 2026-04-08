use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub folder_name: String,
    pub folder_path: String,
    pub display_name: String,
    pub steam_appid: Option<i64>,
    pub is_on_steam: bool,
    pub igdb_id: Option<i64>,
    pub match_source: String,
    pub match_confidence: MatchConfidence,
    pub candidates: Vec<MatchCandidate>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MatchConfidence {
    Exact,
    Cleaned,
    Fuzzy,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchCandidate {
    pub appid: i64,
    pub name: String,
    pub distance: usize,
}
