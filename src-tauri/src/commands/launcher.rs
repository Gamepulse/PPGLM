use std::process::Command;
use std::path::Path;
use tauri::State;
use crate::db::Database;

/// Common executable patterns by platform
#[cfg(target_os = "windows")]
const EXECUTABLE_EXTENSIONS: &[&str] = &["exe", "bat", "cmd", "msi"];

#[cfg(target_os = "macos")]
const EXECUTABLE_EXTENSIONS: &[&str] = &["app", "command", "sh"];

#[cfg(target_os = "linux")]
const EXECUTABLE_EXTENSIONS: &[&str] = &["sh", "x86_64", "x64", "AppImage"];

/// Priority executable names (exact matches get higher score)
const PRIORITY_NAMES: &[&str] = &[
    "start", "launch", "run", "game", "play",
    "steam", "gog", "epic", "origin", "uplay",
];

/// Excluded patterns (files/directories to skip)
const EXCLUDED_PATTERNS: &[&str] = &[
    "unitycrashhandler", "crashhandler", "steam_api", 
    "redist", "directx", "vcredist",
    "uninstall", "setup", "installer",
    "save", "saves", "config", "logs",
];

/// Score an executable based on various criteria
fn score_executable(name: &str, depth: usize, is_direct_child: bool) -> i32 {
    let lower_name = name.to_lowercase();
    let mut score = 0;
    
    // Prefer executables directly in the game folder
    if is_direct_child {
        score += 50;
    }
    
    // Penalize deep nesting
    score -= (depth as i32) * 10;
    
    // Bonus for priority names
    for priority in PRIORITY_NAMES {
        if lower_name.contains(priority) {
            score += 30;
        }
    }
    
    // Penalty for excluded patterns
    for excluded in EXCLUDED_PATTERNS {
        if lower_name.contains(excluded) {
            score -= 100;
        }
    }
    
    // Bonus for having the game name in the executable (would need game name passed in)
    // This is a simplified version
    
    // Prefer shorter names (usually main executable vs helpers)
    if lower_name.len() < 15 {
        score += 10;
    }
    
    score
}

/// Auto-discover the executable path for a game in a given folder
#[tauri::command]
pub fn discover_executable_path(folder_path: String) -> Result<Option<String>, String> {
    let path = Path::new(&folder_path);
    
    if !path.exists() || !path.is_dir() {
        return Err("Invalid folder path".to_string());
    }
    
    let mut candidates: Vec<(String, i32)> = Vec::new();
    
    // Scan the directory recursively (but limit depth)
    fn scan_directory(
        dir: &Path,
        depth: usize,
        candidates: &mut Vec<(String, i32)>,
        is_root: bool,
    ) -> Result<(), String> {
        if depth > 2 {
            return Ok(()); // Limit recursion depth
        }
        
        let entries = std::fs::read_dir(dir)
            .map_err(|e| format!("Failed to read directory: {}", e))?;
        
        for entry in entries {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue,
            };
            
            let path = entry.path();
            let name = path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_string();
            
            if path.is_dir() {
                // On macOS, .app bundles are directories but should be treated as executables
                #[cfg(target_os = "macos")]
                {
                    if path.extension()
                        .and_then(|e| e.to_str())
                        .map(|e| e == "app")
                        .unwrap_or(false)
                    {
                        let score = score_executable(&name, depth, is_root);
                        if score > 0 {
                            candidates.push((path.to_string_lossy().to_string(), score));
                        }
                        continue;
                    }
                }
                
                // Recurse into subdirectories
                if let Err(_) = scan_directory(&path, depth + 1, candidates, false) {
                    continue;
                }
            } else if path.is_file() {
                // Check if file has executable extension
                let ext = path.extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                
                if EXECUTABLE_EXTENSIONS.contains(&ext.as_str()) {
                    let score = score_executable(&name, depth, is_root);
                    if score > 0 {
                        candidates.push((path.to_string_lossy().to_string(), score));
                    }
                }
                
                // On Linux, check for executable permission
                #[cfg(target_os = "linux")]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if let Ok(metadata) = entry.metadata() {
                        let permissions = metadata.permissions();
                        if permissions.mode() & 0o111 != 0 {
                            // File is executable
                            let score = score_executable(&name, depth, is_root) + 20;
                            if score > 0 && !candidates.iter().any(|(p, _)| p == &path.to_string_lossy().to_string()) {
                                candidates.push((path.to_string_lossy().to_string(), score));
                            }
                        }
                    }
                }
            }
        }
        
        Ok(())
    }
    
    scan_directory(path, 0, &mut candidates, true)?;
    
    // Sort by score (descending) and return the best match
    candidates.sort_by(|a, b| b.1.cmp(&a.1));
    
    Ok(candidates.first().map(|(path, _)| path.clone()))
}

/// Auto-discover and save the executable path for a game
#[tauri::command]
pub fn auto_discover_and_save_executable(
    game_id: i64,
    folder_path: String,
    db: State<'_, Database>,
) -> Result<Option<String>, String> {
    // Discover the executable
    let discovered = discover_executable_path(folder_path)?;
    
    if let Some(ref path) = discovered {
        // Save it to the database
        let conn = db.lock_conn()?;
        conn.execute(
            "UPDATE games SET executable_path = ?1 WHERE id = ?2",
            rusqlite::params![path, game_id],
        ).map_err(|e| format!("Failed to save executable path: {}", e))?;
    }
    
    Ok(discovered)
}

/// Launch a game executable
#[tauri::command]
pub fn launch_game(game_id: i64, db: State<'_, Database>) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    // Get the executable path
    let executable_path: Option<String> = conn.query_row(
        "SELECT executable_path FROM games WHERE id = ?1",
        rusqlite::params![game_id],
        |row| row.get(0),
    ).map_err(|e| format!("Failed to get game: {}", e))?;
    
    let path = executable_path.ok_or_else(|| "No executable path configured for this game".to_string())?;
    
    // Update last_played timestamp
    conn.execute(
        "UPDATE games SET last_played = datetime('now') WHERE id = ?1",
        rusqlite::params![game_id],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    
    // Launch the game
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| format!("Failed to launch game: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to launch game: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to launch game: {}", e))?;
    }
    
    Ok(true)
}

/// Open a store link
#[tauri::command]
pub fn open_store_link(url: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| format!("Failed to open link: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open link: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open link: {}", e))?;
    }
    
    Ok(true)
}
