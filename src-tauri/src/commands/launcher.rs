use std::process::Command;
use tauri::State;
use crate::db::Database;

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
