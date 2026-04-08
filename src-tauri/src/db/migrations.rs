use rusqlite::Connection;

pub fn run(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    // Create migrations tracking table if not exists
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            id TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );"
    )?;

    // Migration 001: Initial schema (idempotent - uses IF NOT EXISTS)
    if !is_migration_applied(conn, "001_init")? {
        conn.execute_batch(include_str!("001_init.sql"))
            .map_err(|e| format!("Migration 001_init failed: {}", e))?;
        mark_migration_applied(conn, "001_init")?;
    }

    // Migration 003: IGDB integration (creates IGDB tables)
    if !is_migration_applied(conn, "003_igdb_integration")? {
        conn.execute_batch(include_str!("003_igdb_integration.sql"))
            .map_err(|e| format!("Migration 003_igdb_integration failed: {}", e))?;
        mark_migration_applied(conn, "003_igdb_integration")?;
        
        // Also ensure igdb_id column exists in games table
        ensure_column_exists(conn, "games", "igdb_id", "INTEGER")?;
    }

    // Migration 004: Folder name exclusions
    if !is_migration_applied(conn, "004_folder_exclusions")? {
        conn.execute_batch(include_str!("004_folder_exclusions.sql"))
            .map_err(|e| format!("Migration 004_folder_exclusions failed: {}", e))?;
        mark_migration_applied(conn, "004_folder_exclusions")?;
    }

    // Migration 005: Add synopsis field to games
    if !is_migration_applied(conn, "005_synopsis")? {
        ensure_column_exists(conn, "games", "synopsis", "TEXT")?;
        mark_migration_applied(conn, "005_synopsis")?;
    }

    // Migration 006: Add release_date field to games
    if !is_migration_applied(conn, "006_release_date")? {
        ensure_column_exists(conn, "games", "release_date", "TEXT")?;
        mark_migration_applied(conn, "006_release_date")?;
    }

    // Migration 007: Add scan_files setting
    if !is_migration_applied(conn, "007_scan_files_setting")? {
        conn.execute_batch(include_str!("007_scan_files_setting.sql"))
            .map_err(|e| format!("Migration 007_scan_files_setting failed: {}", e))?;
        mark_migration_applied(conn, "007_scan_files_setting")?;
    }

    // Migration 008: Add game metadata tables (genres, game_modes, player_perspectives, themes)
    if !is_migration_applied(conn, "008_game_metadata")? {
        conn.execute_batch(include_str!("008_game_metadata.sql"))
            .map_err(|e| format!("Migration 008_game_metadata failed: {}", e))?;
        mark_migration_applied(conn, "008_game_metadata")?;
    }

    Ok(())
}

fn is_migration_applied(conn: &Connection, name: &str) -> Result<bool, Box<dyn std::error::Error>> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM _migrations WHERE id = ?",
        [name],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

fn mark_migration_applied(conn: &Connection, name: &str) -> Result<(), Box<dyn std::error::Error>> {
    conn.execute(
        "INSERT OR IGNORE INTO _migrations (id) VALUES (?)",
        [name],
    )?;
    Ok(())
}

fn ensure_column_exists(conn: &Connection, table: &str, column: &str, def: &str) -> Result<(), Box<dyn std::error::Error>> {
    let columns: Vec<String> = conn
        .prepare(&format!("PRAGMA table_info({})", table))?
        .query_map([], |row| row.get(1))?
        .filter_map(|r| r.ok())
        .collect();

    if !columns.iter().any(|c| c == column) {
        conn.execute(&format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, def), [])?;
    }

    Ok(())
}
