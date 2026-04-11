use serde::{Deserialize, Serialize};

/// Represents a MusicBrainz release (album/soundtrack)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicBrainzRelease {
    pub id: String,
    pub title: String,
    pub artist_credit: Vec<MusicBrainzArtist>,
    pub date: Option<String>,
    pub country: Option<String>,
    pub track_count: Option<i32>,
    pub cover_url: Option<String>,
    pub disambiguation: Option<String>,
}

/// Represents a MusicBrainz artist
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicBrainzArtist {
    pub id: String,
    pub name: String,
}

/// MusicBrainz API response for release search
#[derive(Debug, Clone, Deserialize)]
pub struct MusicBrainzSearchResponse {
    pub releases: Option<Vec<MusicBrainzReleaseApi>>,
    pub count: Option<i32>,
}

/// Internal API representation of a release
#[derive(Debug, Clone, Deserialize)]
pub struct MusicBrainzReleaseApi {
    pub id: String,
    pub title: String,
    #[serde(rename = "artist-credit")]
    pub artist_credit: Option<Vec<MusicBrainzArtistCreditApi>>,
    pub date: Option<String>,
    pub country: Option<String>,
    #[serde(rename = "track-count")]
    pub track_count: Option<i32>,
    pub disambiguation: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MusicBrainzArtistCreditApi {
    pub artist: MusicBrainzArtistApi,
    pub name: Option<String>,
    pub joinphrase: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MusicBrainzArtistApi {
    pub id: String,
    pub name: String,
}

impl MusicBrainzRelease {
    /// Build the MusicBrainz URL for this release
    pub fn build_url(&self) -> String {
        format!("https://musicbrainz.org/release/{}", self.id)
    }
    
    /// Try to build Cover Art Archive URL
    pub fn build_cover_art_url(&self) -> Option<String> {
        Some(format!(
            "https://coverartarchive.org/release/{}/front",
            self.id
        ))
    }
}

/// Convert API response to our model
pub fn convert_mb_release(api: &MusicBrainzReleaseApi) -> MusicBrainzRelease {
    let artist_credit = api
        .artist_credit
        .as_ref()
        .map(|credits| {
            credits
                .iter()
                .map(|credit| MusicBrainzArtist {
                    id: credit.artist.id.clone(),
                    name: credit.name.clone().unwrap_or_else(|| credit.artist.name.clone()),
                })
                .collect()
        })
        .unwrap_or_default();

    MusicBrainzRelease {
        id: api.id.clone(),
        title: api.title.clone(),
        artist_credit,
        date: api.date.clone(),
        country: api.country.clone(),
        track_count: api.track_count,
        cover_url: None, // Will be populated after checking Cover Art Archive
        disambiguation: api.disambiguation.clone(),
    }
}
