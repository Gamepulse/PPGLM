use std::path::Path;
use std::sync::{Arc, Mutex as StdMutex};
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;
use tauri::{AppHandle, Emitter, State};

use crate::commands::database::get_exclusion_patterns;
use crate::commands::igdb::{get_igdb_credentials_from_db, get_igdb_token};
use crate::db::Database;
use crate::models::igdb::IgdbCover;
use crate::models::scan_result::{IgdbGenreSimple, MatchCandidate, MatchConfidence, ScanResult};
use crate::utils::{clean_folder_name, format_cover_url, levenshtein, should_skip_folder, SYSTEM_FOLDERS, SKIP_FOLDER_PATTERNS};

/// Default recursion depth (can be overridden via scan_depth setting)
const DEFAULT_MAX_DEPTH: usize = 3;
const MAX_DEPTH: usize = 3;

/// Progress event emitted during scanning
#[derive(Clone, serde::Serialize)]
pub struct ScanProgress {
    pub folders_scanned: usize,
    pub games_found: usize,
    pub current_path: String,
    pub operation: String,
}

/// Console log event for frontend display
#[derive(Clone, serde::Serialize)]
pub struct ConsoleLog {
    pub timestamp: String,
    pub level: String,
    pub message: String,
}

/// Scan result with game found
#[derive(Clone, serde::Serialize)]
pub struct ScanResultEvent {
    pub result: ScanResult,
    pub total_found: usize,
}

/// Event emitted when a folder is excluded during scanning
#[derive(Clone, serde::Serialize)]
pub struct ExcludedFolderEvent {
    pub folder_name: String,
    pub folder_path: String,
    pub reason: String,
}

/// Event emitted when a folder has no IGDB match
#[derive(Clone, serde::Serialize)]
pub struct NoMatchFolderEvent {
    pub folder_name: String,
    pub folder_path: String,
    pub display_name: String,
}

/// Event emitted when a match is rejected (distance too high)
#[derive(Clone, serde::Serialize)]
pub struct RejectedMatchEvent {
    pub folder_name: String,
    pub folder_path: String,
    pub display_name: String,
    pub best_candidate_name: String,
    pub best_distance: usize,
    pub threshold: usize,
    pub candidates: Vec<MatchCandidate>,
}

/// Event emitted when a folder is scanned but has no match (intermediate folder, not at max depth)
#[derive(Clone, serde::Serialize)]
pub struct ScannedParentFolderEvent {
    pub folder_name: String,
    pub folder_path: String,
    pub display_name: String,
    pub depth: usize,
}



/// IGDB response with cover for smart scan matching
#[derive(Debug, serde::Deserialize)]
struct IgdbGameWithCover {
    pub id: i64,
    pub name: String,
    pub slug: Option<String>,
    pub cover: Option<IgdbCover>,
    pub rating: Option<f64>,
    pub summary: Option<String>,
    pub first_release_date: Option<i64>,
    pub genres: Option<Vec<IgdbGenreSimple>>,
    pub game_modes: Option<Vec<IgdbGenreSimple>>,
    pub player_perspectives: Option<Vec<IgdbGenreSimple>>,
    pub themes: Option<Vec<IgdbGenreSimple>>,
    pub platforms: Option<Vec<IgdbGenreSimple>>,
}



/// Check if folder name matches exclusion patterns
fn check_folder_excluded(folder_name: &str, exclusions: &[String]) -> bool {
    let lower = folder_name.to_lowercase();
    
    // Check system folders
    if SYSTEM_FOLDERS.iter().any(|sf| sf.eq_ignore_ascii_case(folder_name))
        || folder_name.starts_with('.')
    {
        return true;
    }

    // Check common non-game patterns
    for pattern in SKIP_FOLDER_PATTERNS {
        if lower.contains(pattern) {
            return true;
        }
    }

    // Check custom exclusions from database
    for pattern in exclusions {
        if lower.contains(&pattern.to_lowercase()) {
            return true;
        }
    }

    // Skip folders with version numbers only (like "1.0.0", "v2.1")
    if regex::Regex::new(r"^v?\d+(\.\d+)*$")
        .unwrap()
        .is_match(folder_name)
    {
        return true;
    }

    // Skip very short names (less than 2 chars)
    if folder_name.len() < 2 {
        return true;
    }

    false
}

/// Try to match a folder name with IGDB
/// Returns Some(ScanResult) if match found, None otherwise
/// Sets is_excluded flag based on exclusion patterns
async fn try_match_folder(
    folder_name: &str,
    folder_path: &str,
    client_id: &str,
    token: &str,
    match_threshold: usize,
    _app_handle: &AppHandle,
    exclusions: &[String],
) -> Option<ScanResult> {
    let display_name = clean_folder_name(folder_name);
    let display_lower = display_name.to_lowercase();
    let folder_lower = folder_name.to_lowercase();

    // Search IGDB with full game data
    let client = reqwest::Client::new();
    let response = client
        .post("https://api.igdb.com/v4/games")
        .header("Client-ID", client_id)
        .header("Authorization", format!("Bearer {}", token))
        .body(format!(
            "search \"{}\"; fields id,name,slug,cover.url,rating,summary,genres.name,game_modes.name,player_perspectives.name,themes.name,platforms.name,first_release_date; limit 20;",
            display_lower
        ))
        .send()
        .await;

    if let Ok(resp) = response {
        if let Ok(igdb_results) = resp.json::<Vec<IgdbGameWithCover>>().await {
            // Debug: log how many results and what they are
            if !igdb_results.is_empty() {
                let names: Vec<String> = igdb_results.iter().map(|g| g.name.clone()).collect();
                println!("[DEBUG] IGDB search for '{}' returned {} results: {:?}", display_lower, igdb_results.len(), names);
            } else {
                println!("[DEBUG] IGDB search for '{}' returned 0 results", display_lower);
            }
            
            // Find the best match among ALL results, not just the first one
            let normalize_for_compare = |s: &str| -> String {
                s.replace("'", "").replace("-", " ").replace("_", " ").replace("  ", " ").trim().to_string()
            };
            let display_normalized = normalize_for_compare(&display_lower);
            let folder_normalized = normalize_for_compare(&folder_lower);
            
            // Search for the best match in all results
            let mut best_match: Option<&IgdbGameWithCover> = None;
            let mut best_distance = usize::MAX;
            
            for game in &igdb_results {
                let igdb_name_lower = game.name.to_lowercase();
                let igdb_normalized = normalize_for_compare(&igdb_name_lower);
                
                let distance_display = levenshtein(&display_lower, &igdb_name_lower);
                let distance_folder = levenshtein(&folder_lower, &igdb_name_lower);
                let distance_display_norm = levenshtein(&display_normalized, &igdb_normalized);
                let distance_folder_norm = levenshtein(&folder_normalized, &igdb_normalized);
                
                let game_best_distance = std::cmp::min(
                    std::cmp::min(distance_display, distance_folder),
                    std::cmp::min(distance_display_norm, distance_folder_norm)
                );
                
                if game_best_distance < best_distance {
                    best_distance = game_best_distance;
                    best_match = Some(game);
                }
            }
            
            if let Some(best_match) = best_match {
                let igdb_name_lower = best_match.name.to_lowercase();
                let _igdb_normalized = normalize_for_compare(&igdb_name_lower);
                println!("[DEBUG] Best match found: '{}' with distance {}", igdb_name_lower, best_distance);
                
                // Track which name was used for the match
                let distance_display = levenshtein(&display_lower, &igdb_name_lower);
                let distance_folder = levenshtein(&folder_lower, &igdb_name_lower);
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
                        let igdb_norm = normalize_for_compare(&igdb_lower);
                        let d_display = std::cmp::min(
                            levenshtein(&display_lower, &igdb_lower),
                            levenshtein(&display_normalized, &igdb_norm)
                        );
                        let d_folder = std::cmp::min(
                            levenshtein(&folder_lower, &igdb_lower),
                            levenshtein(&folder_normalized, &igdb_norm)
                        );
                        MatchCandidate {
                            id: g.id,
                            name: g.name.clone(),
                            distance: std::cmp::min(d_display, d_folder),
                            cover_url: g.cover.as_ref().map(|c| format_cover_url(&c.url)),
                            slug: g.slug.clone(),
                        }
                    })
                    .collect();

                if best_distance <= match_threshold {
                    // It's a match!
                    println!("[DEBUG] ✓ MATCH ACCEPTED: distance {} <= threshold {}", best_distance, match_threshold);
                    let match_confidence = if best_distance == 0 {
                        MatchConfidence::Exact
                    } else {
                        MatchConfidence::Fuzzy
                    };
                    
                    let match_source = if best_distance == 0 {
                        format!("igdb_exact_{}", name_used)
                    } else {
                        format!("igdb_fuzzy_{}", name_used)
                    };

                    // Format release date from timestamp
                    let release_date = best_match.first_release_date
                        .map(|ts| {
                            chrono::DateTime::from_timestamp(ts, 0)
                                .map(|dt| dt.format("%Y-%m-%d").to_string())
                                .unwrap_or_default()
                        });

                    // Check if this folder matches exclusion patterns
                    let is_excluded = check_folder_excluded(folder_name, exclusions);
                    
                    return Some(ScanResult {
                        folder_name: folder_name.to_string(),
                        folder_path: folder_path.to_string(),
                        display_name,
                        match_confidence,
                        candidates,
                        igdb_id: Some(best_match.id),
                        igdb_slug: best_match.slug.clone(),
                        match_source,
                        cover_url: best_match.cover.as_ref().map(|c| format_cover_url(&c.url)),
                        synopsis: best_match.summary.clone(),
                        release_date,
                        igdb_rating: best_match.rating,
                        genres: best_match.genres.clone().unwrap_or_default(),
                        game_modes: best_match.game_modes.clone().unwrap_or_default(),
                        player_perspectives: best_match.player_perspectives.clone().unwrap_or_default(),
                        themes: best_match.themes.clone().unwrap_or_default(),
                        platforms: best_match.platforms.clone().unwrap_or_default(),
                        platform: None,
                        is_excluded,
                        is_rejected: false,
                        is_parent: false,
                    });
                } else {
                    // Match rejected - distance too high, but return as a rejectable result
                    // User can still accept it if they want
                    println!("[DEBUG] ✗ MATCH REJECTED (but includable): distance {} > threshold {}", best_distance, match_threshold);
                    
                    // Check if excluded
                    let is_excluded = check_folder_excluded(folder_name, exclusions);
                    
                    // Format release date from timestamp
                    let release_date = best_match.first_release_date
                        .map(|ts| {
                            chrono::DateTime::from_timestamp(ts, 0)
                                .map(|dt| dt.format("%Y-%m-%d").to_string())
                                .unwrap_or_default()
                        });
                    
                    // Return as a rejected result that user can still accept
                    return Some(ScanResult {
                        folder_name: folder_name.to_string(),
                        folder_path: folder_path.to_string(),
                        display_name: display_name.clone(),
                        match_confidence: MatchConfidence::None, // Mark as None initially
                        candidates,
                        igdb_id: Some(best_match.id),
                        igdb_slug: best_match.slug.clone(),
                        match_source: format!("rejected_distance_{}", best_distance),
                        cover_url: best_match.cover.as_ref().map(|c| format_cover_url(&c.url)),
                        synopsis: best_match.summary.clone(),
                        release_date,
                        igdb_rating: best_match.rating,
                        genres: best_match.genres.clone().unwrap_or_default(),
                        game_modes: best_match.game_modes.clone().unwrap_or_default(),
                        player_perspectives: best_match.player_perspectives.clone().unwrap_or_default(),
                        themes: best_match.themes.clone().unwrap_or_default(),
                        platforms: best_match.platforms.clone().unwrap_or_default(),
                        platform: None,
                        is_excluded,
                        is_rejected: true, // Mark as rejected - needs user confirmation
                        is_parent: false,
                    });
                }
            }
        }
    }

    None
}

/// Stop the current scan operation
#[tauri::command]
pub fn stop_scan(cancel_token: State<'_, StdMutex<CancellationToken>>) -> Result<bool, String> {
    cancel_token.lock().unwrap().cancel();
    Ok(true)
}

/// Smart scan with early exit - only descends if no match found
#[tauri::command]
pub async fn scan_folders_smart(
    paths: Vec<String>,
    db: State<'_, Database>,
    cancel_token: State<'_, StdMutex<CancellationToken>>,
    app_handle: AppHandle,
) -> Result<(), String> {
    // Create a fresh CancellationToken for this scan and store it in state
    let scan_token = {
        let new_token = CancellationToken::new();
        let mut guard = cancel_token.lock().unwrap();
        *guard = new_token.clone();
        new_token
    };
    
    log_to_console(&app_handle, "INFO", "Starting smart scan with early exit...");
    log_to_console(&app_handle, "INFO", "Tip: Click 'Stop Scan' to cancel at any time");
    
    // Get IGDB credentials
    let token = get_igdb_token(&db).await?;
    let creds = get_igdb_credentials_from_db(&db)?
        .ok_or_else(|| "IGDB credentials not configured. Please configure in Settings.".to_string())?;

    let existing_paths: Vec<String> = {
        let conn = db.lock_conn()?;
        let mut stmt = conn
            .prepare("SELECT folder_path FROM games")
            .map_err(|e: rusqlite::Error| e.to_string())?;
        let rows: Result<Vec<String>, rusqlite::Error> = stmt
            .query_map([], |row: &rusqlite::Row<'_>| row.get(0))
            .map(|iter| iter.filter_map(|r: Result<String, rusqlite::Error>| r.ok()).collect());
        rows.map_err(|e| e.to_string())?
    };
    
    // Load custom exclusions from database
    let custom_exclusions = get_exclusion_patterns(&db)?;
    
    // Load scan_files setting
    let scan_files = {
        let conn = db.lock_conn()?;
        let result: Option<String> = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'scan_files'",
                [],
                |row| row.get(0),
            )
            .ok();
        result.as_deref() == Some("true")
    };
    
    // Load match_threshold setting (default 15)
    let match_threshold: usize = {
        let conn = db.lock_conn()?;
        let result: Option<String> = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'match_threshold'",
                [],
                |row| row.get(0),
            )
            .ok();
        result.and_then(|s| s.parse().ok()).unwrap_or(15)
    };
    
    // Load scan_depth setting (default 3)
    let max_depth: usize = {
        let conn = db.lock_conn()?;
        let result: Option<String> = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'scan_depth'",
                [],
                |row| row.get(0),
            )
            .ok();
        result.and_then(|s| s.parse().ok()).unwrap_or(DEFAULT_MAX_DEPTH)
    };
    
    // Load continue_scan_after_match setting (default false)
    let continue_scan_after_match: bool = {
        let conn = db.lock_conn()?;
        let result: Option<String> = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'continue_scan_after_match'",
                [],
                |row| row.get(0),
            )
            .ok();
        result.map(|s| s == "true").unwrap_or(false)
    };
    
    log_to_console(&app_handle, "INFO", &format!("Found {} existing games in database", existing_paths.len()));
    log_to_console(&app_handle, "INFO", &format!("Loaded {} custom exclusion patterns", custom_exclusions.len()));
    log_to_console(&app_handle, "INFO", &format!("Match threshold set to {}", match_threshold));
    log_to_console(&app_handle, "INFO", &format!("Scan depth set to {}", max_depth));
    if scan_files {
        log_to_console(&app_handle, "INFO", "File scanning enabled - will also scan individual files");
    }

    let existing_paths = Arc::new(existing_paths);
    let custom_exclusions = Arc::new(custom_exclusions);
    let games_found = Arc::new(Mutex::new(0usize));
    let folders_scanned = Arc::new(Mutex::new(0usize));
    let scan_files = Arc::new(scan_files);

    // Process each root path
    for path_str in &paths {
        // Check for cancellation at start of each folder
        if scan_token.is_cancelled() {
            log_to_console(&app_handle, "WARN", "Scan cancelled by user");
            let _ = app_handle.emit("scan:cancelled", ());
            break;
        }
        
        let path = Path::new(path_str);
        if !path.is_dir() {
            log_to_console(&app_handle, "WARN", &format!("Path is not a directory: {}", path_str));
            continue;
        }
        
        log_to_console(&app_handle, "INFO", &format!("Scanning root folder: {}", path_str));

        // Emit initial progress
        let _ = app_handle.emit("scan:progress", ScanProgress {
            folders_scanned: 0,
            games_found: 0,
            current_path: path_str.clone(),
            operation: "scanning".to_string(),
        });

        // Scan with smart early-exit logic
        scan_directory_smart(
            path,
            0,
            Arc::clone(&existing_paths),
            Arc::clone(&custom_exclusions),
            Arc::clone(&games_found),
            Arc::clone(&folders_scanned),
            Arc::clone(&scan_files),
            &app_handle,
            &creds.client_id,
            &token,
            scan_token.clone(),
            match_threshold,
            max_depth,
            continue_scan_after_match,
        ).await?;
        
        // Check for cancellation after each root path
        if scan_token.is_cancelled() {
            log_to_console(&app_handle, "WARN", "Scan cancelled by user");
            let _ = app_handle.emit("scan:cancelled", ());
            break;
        }
    }
    
    let final_count = *games_found.lock().await;
    
    if scan_token.is_cancelled() {
        log_to_console(&app_handle, "INFO", &format!("Scan stopped. Found {} games before cancellation", final_count));
    } else {
        log_to_console(&app_handle, "INFO", &format!("Smart scan complete! Found {} games", final_count));
    }
    
    // Emit completion event
    let _ = app_handle.emit("scan:complete", final_count);

    Ok(())
}

/// Scan directory with smart early-exit logic
/// If a folder matches with IGDB, it's considered a game and we don't scan its children (unless continue_scan_after_match is true)
/// If no match, we recursively scan its subdirectories
async fn scan_directory_smart(
    parent: &Path,
    depth: usize,
    existing_paths: Arc<Vec<String>>,
    custom_exclusions: Arc<Vec<String>>,
    games_found: Arc<Mutex<usize>>,
    folders_scanned: Arc<Mutex<usize>>,
    scan_files: Arc<bool>,
    app_handle: &AppHandle,
    client_id: &str,
    token: &str,
    cancel_token: CancellationToken,
    match_threshold: usize,
    max_depth: usize,
    continue_scan_after_match: bool,
) -> Result<(), String> {
    if depth > max_depth {
        log_to_console(app_handle, "DEBUG", &format!("Max depth reached for: {}", parent.display()));
        return Ok(());
    }

    let entries = match std::fs::read_dir(parent) {
        Ok(e) => e,
        Err(e) => {
            log_to_console(app_handle, "ERROR", &format!("Cannot read directory {}: {}", parent.display(), e));
            return Ok(());
        }
    };

    // Collect all subdirectories and optionally files
    let mut subdirs: Vec<(std::path::PathBuf, String)> = Vec::new();
    let mut files: Vec<(std::path::PathBuf, String)> = Vec::new();
    
    for entry in entries.filter_map(|e| e.ok()) {
        // Check for cancellation at start of each entry
        if cancel_token.is_cancelled() {
            return Ok(());
        }
        let entry_path = entry.path();

        if entry_path.is_dir() {
            // Process directory
            let folder_name = match entry_path.file_name().and_then(|n| n.to_str()) {
                Some(name) => name.to_string(),
                None => continue,
            };

            // Only skip system folders - let custom exclusions be processed and marked in results
            let _lower = folder_name.to_lowercase();
            let is_system_folder = SYSTEM_FOLDERS.iter().any(|sf| sf.eq_ignore_ascii_case(&folder_name))
                || folder_name.starts_with('.');
            
            if is_system_folder {
                log_to_console(app_handle, "DEBUG", &format!("Skipping system folder: {}", folder_name));
                continue;
            }

            subdirs.push((entry_path, folder_name));
        } else if *scan_files && entry_path.is_file() {
            // Process file (if scan_files enabled)
            let file_name = match entry_path.file_stem().and_then(|n| n.to_str()) {
                Some(name) => name.to_string(),
                None => continue,
            };

            // Only skip system folders - let custom exclusions be processed and marked in results
            let is_system_file = file_name.starts_with('.');
            
            if is_system_file {
                continue;
            }

            files.push((entry_path, file_name));
        }
    }

    // Process files first (if any)
    for (entry_path, file_name) in files {
        // Check for cancellation
        if cancel_token.is_cancelled() {
            return Ok(());
        }
        
        let file_path_str = entry_path.to_string_lossy().to_string();
        
        // Skip if already in database
        if existing_paths.contains(&file_path_str) {
            log_to_console(app_handle, "DEBUG", &format!("Skipping file already in db: {}", file_name));
            continue;
        }
        
        let display_name = clean_folder_name(&file_name);
        
        log_to_console(app_handle, "INFO", &format!("Found file: {}", display_name));
        
        // Try to match this file with IGDB (treat it like a folder)
        match try_match_folder(&file_name, &file_path_str, client_id, token, match_threshold, app_handle, &custom_exclusions).await {
            Some(result) => {
                // MATCH FOUND! This is a game
                log_to_console(app_handle, "SUCCESS", &format!("✓ Matched file: {} → {} (confidence: {:?})", 
                    display_name, 
                    result.candidates.first().map(|c| c.name.clone()).unwrap_or_default(),
                    result.match_confidence
                ));

                // Increment counter
                let mut count = games_found.lock().await;
                *count += 1;
                let total = *count;
                drop(count);

                // Emit result immediately
                let _ = app_handle.emit("scan:result", ScanResultEvent {
                    result,
                    total_found: total,
                });

                // Update progress
                let folders = *folders_scanned.lock().await;
                let _ = app_handle.emit("scan:progress", ScanProgress {
                    folders_scanned: folders,
                    games_found: total,
                    current_path: display_name.clone(),
                    operation: "matched_file".to_string(),
                });
            }
            None => {
                // No match for this file
                log_to_console(app_handle, "DEBUG", &format!("No match for file: {}", display_name));
            }
        }
    }

    // Process each subdirectory
    for (entry_path, folder_name) in subdirs {
        // Check for cancellation
        if cancel_token.is_cancelled() {
            return Ok(());
        }
        
        let folder_path_str = entry_path.to_string_lossy().to_string();
        let display_name = clean_folder_name(&folder_name);
        
        // Rate limiting for API calls
        tokio::time::sleep(std::time::Duration::from_millis(250)).await;
        
        // Check for cancellation after rate limiting
        if cancel_token.is_cancelled() {
            return Ok(());
        }
        
        log_to_console(app_handle, "INFO", &format!("Trying to match: {}", display_name));

        // Check for cancellation before API call
        if cancel_token.is_cancelled() {
            return Ok(());
        }

        // Try to match this folder with IGDB
        match try_match_folder(&folder_name, &folder_path_str, client_id, token, match_threshold, app_handle, &custom_exclusions).await {
            Some(result) => {
                // MATCH FOUND! This is a game, don't scan its children
                log_to_console(app_handle, "SUCCESS", &format!("✓ Matched: {} → {} (confidence: {:?})", 
                    display_name, 
                    result.candidates.first().map(|c| c.name.clone()).unwrap_or_default(),
                    result.match_confidence
                ));

                // Increment counters
                let mut count = games_found.lock().await;
                *count += 1;
                let total = *count;
                drop(count);
                
                // Increment folders scanned counter too
                let mut folders = folders_scanned.lock().await;
                *folders += 1;
                let folders_count = *folders;
                drop(folders);

                // Emit result immediately
                let _ = app_handle.emit("scan:result", ScanResultEvent {
                    result,
                    total_found: total,
                });

                // Update progress
                let _ = app_handle.emit("scan:progress", ScanProgress {
                    folders_scanned: folders_count,
                    games_found: total,
                    current_path: display_name.clone(),
                    operation: "matched".to_string(),
                });
                
                // EARLY EXIT: Don't scan children of this folder (unless deep scan is enabled)
                if !continue_scan_after_match {
                    continue;
                }
                // If deep scan enabled, fall through to scan subdirectories even after finding a match
            }
            None => {
                // NO MATCH - Descend into subdirectories (if not at max depth)
                log_to_console(app_handle, "DEBUG", &format!("No match for: {}, scanning deeper...", display_name));
                
                // Check if we're at max depth (won't scan deeper)
                let at_max_depth = depth + 1 >= max_depth;
                
                // If at max depth, emit no_match event since we won't find anything deeper
                if at_max_depth {
                    let _ = app_handle.emit("scan:no_match", NoMatchFolderEvent {
                        folder_name: folder_name.clone(),
                        folder_path: folder_path_str.clone(),
                        display_name: display_name.clone(),
                    });
                } else {
                    // Not at max depth - this is a parent folder that was scanned but had no match
                    // Emit as a result that user can accept if they want (e.g., if it actually IS a game)
                    let is_excluded = check_folder_excluded(&folder_name, &custom_exclusions);
                    
                    let parent_result = ScanResult {
                        folder_name: folder_name.clone(),
                        folder_path: folder_path_str.clone(),
                        display_name: display_name.clone(),
                        match_confidence: MatchConfidence::None,
                        candidates: Vec::new(),
                        igdb_id: None,
                        igdb_slug: None,
                        match_source: "parent_folder".to_string(),
                        cover_url: None,
                        synopsis: None,
                        release_date: None,
                        igdb_rating: None,
                        genres: Vec::new(),
                        game_modes: Vec::new(),
                        player_perspectives: Vec::new(),
                        themes: Vec::new(),
                        platforms: Vec::new(),
                        platform: None,
                        is_excluded,
                        is_rejected: false,
                        is_parent: true, // Mark as parent folder
                    };
                    
                    // Emit as a result that can be accepted
                    let _ = app_handle.emit("scan:result", ScanResultEvent {
                        result: parent_result,
                        total_found: *games_found.lock().await,
                    });
                }
                
                // Increment folders scanned counter
                let mut folders = folders_scanned.lock().await;
                *folders += 1;
                let folders_count = *folders;
                drop(folders);
                
                // Emit progress
                let games = *games_found.lock().await;
                let _ = app_handle.emit("scan:progress", ScanProgress {
                    folders_scanned: folders_count,
                    games_found: games,
                    current_path: display_name.clone(),
                    operation: "scanning".to_string(),
                });

                // Recurse into this subdirectory
                Box::pin(scan_directory_smart(
                    &entry_path,
                    depth + 1,
                    Arc::clone(&existing_paths),
                    Arc::clone(&custom_exclusions),
                    Arc::clone(&games_found),
                    Arc::clone(&folders_scanned),
                    Arc::clone(&scan_files),
                    app_handle,
                    client_id,
                    token,
                    cancel_token.clone(),
                    match_threshold,
                    max_depth,
                    continue_scan_after_match,
                )).await?;
            }
        }
        
        // Yield to keep UI responsive
        tokio::task::yield_now().await;
    }

    Ok(())
}

fn log_to_console(app_handle: &AppHandle, level: &str, message: &str) {
    let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();
    let log = ConsoleLog {
        timestamp,
        level: level.to_string(),
        message: message.to_string(),
    };
    let _ = app_handle.emit("console:log", log);
    println!("[{}] {}: {}", chrono::Local::now().format("%H:%M:%S"), level, message);
}



// Legacy synchronous version - simplified for folder names only
#[tauri::command]
pub fn scan_folders(
    paths: Vec<String>,
    db: State<'_, Database>,
    app_handle: AppHandle,
) -> Result<Vec<ScanResult>, String> {
    let mut all_results = Vec::new();
    
    let existing_paths: Vec<String> = {
        let conn = db.lock_conn()?;
        let mut stmt = conn
            .prepare("SELECT folder_path FROM games")
            .map_err(|e: rusqlite::Error| e.to_string())?;
        let rows: Result<Vec<String>, rusqlite::Error> = stmt
            .query_map([], |row: &rusqlite::Row<'_>| row.get(0))
            .map(|iter| iter.filter_map(|r: Result<String, rusqlite::Error>| r.ok()).collect());
        rows.map_err(|e| e.to_string())?
    };

    // Load custom exclusions from database
    let custom_exclusions = get_exclusion_patterns(&db)?;

    let existing_paths = Arc::new(existing_paths);
    let custom_exclusions = Arc::new(custom_exclusions);

    for path_str in &paths {
        let path = Path::new(path_str);
        if !path.is_dir() { continue; }

        scan_subdirectories_blocking(
            path,
            0,
            Arc::clone(&existing_paths),
            Arc::clone(&custom_exclusions),
            &mut all_results,
            &app_handle,
        )?;
    }

    Ok(all_results)
}

fn scan_subdirectories_blocking(
    parent: &Path,
    depth: usize,
    existing_paths: Arc<Vec<String>>,
    custom_exclusions: Arc<Vec<String>>,
    results: &mut Vec<ScanResult>,
    app_handle: &AppHandle,
) -> Result<(), String> {
    if depth > MAX_DEPTH { return Ok(()); }

    let entries = match std::fs::read_dir(parent) {
        Ok(e) => e,
        Err(_) => return Ok(()),
    };

    for entry in entries.filter_map(|e| e.ok()) {
        let entry_path = entry.path();
        if !entry_path.is_dir() { continue; }

        let folder_name = match entry_path.file_name().and_then(|n| n.to_str()) {
            Some(name) => name.to_string(),
            None => continue,
        };

        // Skip if should be ignored
        if should_skip_folder(&folder_name, &custom_exclusions) {
            continue;
        }

        let folder_path_str = entry_path.to_string_lossy().to_string();

        if existing_paths.contains(&folder_path_str) { continue; }

        // Every folder is a potential game
        let display_name = clean_folder_name(&folder_name);
        
        log_to_console(app_handle, "SUCCESS", &format!("Found: {}", display_name));

        results.push(ScanResult {
            folder_name: folder_name.clone(),
            folder_path: folder_path_str.clone(),
            display_name,
            match_confidence: MatchConfidence::None,
            candidates: Vec::new(),
            igdb_id: None,
            igdb_slug: None,
            match_source: "heuristic".to_string(),
            cover_url: None,
            synopsis: None,
            release_date: None,
            igdb_rating: None,
            genres: Vec::new(),
            game_modes: Vec::new(),
            player_perspectives: Vec::new(),
            themes: Vec::new(),
            platforms: Vec::new(),
            platform: None,
            is_excluded: false,
            is_rejected: false,
            is_parent: false,
        });

        // Scan deeper
        scan_subdirectories_blocking(
            &entry_path,
            depth + 1,
            Arc::clone(&existing_paths),
            Arc::clone(&custom_exclusions),
            results,
            app_handle,
        )?;
    }

    Ok(())
}
