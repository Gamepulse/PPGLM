use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IgdbCredentials {
    pub client_id: String,
    pub client_secret: String,
}

#[derive(Debug, Deserialize)]
pub struct TwitchTokenResponse {
    pub access_token: String,
    pub expires_in: i64,
    pub token_type: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbGame {
    pub id: i64,
    pub name: String,
    pub slug: Option<String>,
    pub summary: Option<String>,
    pub storyline: Option<String>,
    pub first_release_date: Option<i64>,
    pub rating: Option<f64>,
    pub rating_count: Option<i64>,
    pub aggregated_rating: Option<f64>,
    pub aggregated_rating_count: Option<i64>,
    pub cover: Option<IgdbCover>,
    pub artworks: Option<Vec<IgdbArtwork>>,
    pub screenshots: Option<Vec<IgdbScreenshot>>,
    pub videos: Option<Vec<IgdbVideo>>,
    pub genres: Option<Vec<IgdbGenre>>,
    pub themes: Option<Vec<IgdbTheme>>,
    pub game_modes: Option<Vec<IgdbGameMode>>,
    pub player_perspectives: Option<Vec<IgdbPlayerPerspective>>,
    pub platforms: Option<Vec<IgdbPlatform>>,
    pub involved_companies: Option<Vec<i64>>,
    pub franchises: Option<Vec<IgdbFranchise>>,
    pub collection: Option<IgdbCollection>,
    pub url: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbCover {
    pub id: i64,
    pub url: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbArtwork {
    pub id: i64,
    pub url: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbScreenshot {
    pub id: i64,
    pub url: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbVideo {
    pub id: i64,
    pub name: String,
    pub video_id: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IgdbGenre {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IgdbTheme {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IgdbGameMode {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IgdbPlayerPerspective {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IgdbPlatform {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbFranchise {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbCollection {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbSearchResult {
    pub id: i64,
    pub name: String,
    pub slug: Option<String>,
    pub cover: Option<IgdbCover>,
    pub rating: Option<f64>,
    pub summary: Option<String>,
    pub first_release_date: Option<i64>,
    pub genres: Option<Vec<IgdbGenre>>,
    pub themes: Option<Vec<IgdbTheme>>,
    pub game_modes: Option<Vec<IgdbGameMode>>,
    pub player_perspectives: Option<Vec<IgdbPlayerPerspective>>,
    pub platforms: Option<Vec<IgdbPlatform>>,
}
