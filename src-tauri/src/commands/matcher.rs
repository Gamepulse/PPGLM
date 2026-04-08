use tauri::State;

use crate::commands::igdb::{get_igdb_credentials_from_db, get_igdb_token};
use crate::db::Database;
use crate::models::igdb::IgdbCover;
use crate::models::scan_result::{MatchCandidate, MatchConfidence, ScanResult};
use crate::utils::{format_cover_url, levenshtein};

/// Match folder names with IGDB database
/// Returns results with cover images
#[tauri::command]
pub async fn match_folder_names(
    results: Vec<ScanResult>,
    db: State<'_, Database>,
) -> Result<Vec<ScanResult>, String> {
    let token = get_igdb_token(&db).await?;
    let creds = get_igdb_credentials_from_db(&db)?
        .ok_or_else(|| "IGDB credentials not configured. Please configure in Settings.".to_string())?;

    let mut matched_results = Vec::new();
    let mut unmatched_results = Vec::new();

    for mut result in results {
        let display_lower = result.display_name.to_lowercase();
        let folder_lower = result.folder_name.to_lowercase();

        // Rate limiting: 4 requests per second max
        tokio::time::sleep(std::time::Duration::from_millis(250)).await;

        // Search IGDB with cover
        let client = reqwest::Client::new();
        let response = client
            .post("https://api.igdb.com/v4/games")
            .header("Client-ID", &creds.client_id)
            .header("Authorization", format!("Bearer {}", token))
            .body(format!(
                "search \"{}\"; fields id,name,cover.url; limit 5;",
                display_lower
            ))
            .send()
            .await;

        if let Ok(resp) = response {
            if let Ok(igdb_results) = resp.json::<Vec<IgdbGameWithCover>>().await {
                if let Some(best_match) = igdb_results.first() {
                    let igdb_name_lower = best_match.name.to_lowercase();
                    
                    // Calculate distances using both folder_name and display_name
                    let distance_display = levenshtein(&display_lower, &igdb_name_lower);
                    let distance_folder = levenshtein(&folder_lower, &igdb_name_lower);
                    
                    // Use the best (minimum) distance of the two
                    let best_distance = std::cmp::min(distance_display, distance_folder);
                    
                    // Track which name was used for the match
                    let name_used = if distance_folder <= distance_display {
                        "folder_name"
                    } else {
                        "display_name"
                    };

                    // Build candidates list with covers
                    let candidates: Vec<MatchCandidate> = igdb_results
                        .iter()
                        .map(|g| {
                            let igdb_lower = g.name.to_lowercase();
                            let d_display = levenshtein(&display_lower, &igdb_lower);
                            let d_folder = levenshtein(&folder_lower, &igdb_lower);
                            MatchCandidate {
                                id: g.id,
                                name: g.name.clone(),
                                distance: std::cmp::min(d_display, d_folder),
                                cover_url: g.cover.as_ref().map(|c| format_cover_url(&c.url)),
                            }
                        })
                        .collect();

                    if best_distance == 0 {
                        // Exact match
                        result.igdb_id = Some(best_match.id);
                        result.match_confidence = MatchConfidence::Exact;
                        result.match_source = format!("igdb_exact_{}", name_used);
                        result.candidates = candidates.clone();
                        result.cover_url = best_match.cover.as_ref().map(|c| format_cover_url(&c.url));
                        matched_results.push(result);
                    } else if best_distance <= 2 {
                        // Fuzzy match
                        result.igdb_id = Some(best_match.id);
                        result.match_confidence = MatchConfidence::Fuzzy;
                        result.match_source = format!("igdb_fuzzy_{}", name_used);
                        result.candidates = candidates.clone();
                        result.cover_url = best_match.cover.as_ref().map(|c| format_cover_url(&c.url));
                        matched_results.push(result);
                    } else {
                        // Distance > 2, consider as non-match
                        result.match_confidence = MatchConfidence::None;
                        result.match_source = "no_match".to_string();
                        result.candidates = candidates;
                        result.cover_url = None;
                        unmatched_results.push(result);
                    }
                } else {
                    // No IGDB results at all
                    result.match_confidence = MatchConfidence::None;
                    result.match_source = "no_match".to_string();
                    unmatched_results.push(result);
                }
            } else {
                // Parse error, treat as non-match
                result.match_confidence = MatchConfidence::None;
                result.match_source = "no_match".to_string();
                unmatched_results.push(result);
            }
        } else {
            // Request failed, treat as non-match
            result.match_confidence = MatchConfidence::None;
            result.match_source = "no_match".to_string();
            unmatched_results.push(result);
        }
    }

    // Combine results: matches first (sorted by confidence), then non-matches
    // Sort matched results: Exact first, then Fuzzy
    matched_results.sort_by(|a, b| {
        let a_score = match a.match_confidence {
            MatchConfidence::Exact => 0,
            MatchConfidence::Fuzzy => 1,
            _ => 2,
        };
        let b_score = match b.match_confidence {
            MatchConfidence::Exact => 0,
            MatchConfidence::Fuzzy => 1,
            _ => 2,
        };
        a_score.cmp(&b_score)
    });

    // Append non-matches at the end
    matched_results.extend(unmatched_results);

    Ok(matched_results)
}

/// IGDB Game with cover
#[derive(Debug, serde::Deserialize)]
struct IgdbGameWithCover {
    pub id: i64,
    pub name: String,
    pub cover: Option<IgdbCover>,
}


