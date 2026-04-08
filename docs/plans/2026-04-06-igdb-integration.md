# IGDB Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Steam as primary game matching source with IGDB, requiring user-provided Twitch API credentials

**Architecture:** IGDB API integration with OAuth authentication, local credential storage, cache system similar to Steam, fallback to Steam matching if IGDB fails

**Tech Stack:** Rust (Tauri backend), React/TypeScript (frontend), SQLite (storage), IGDB API v4

---

## Task 1: Database Schema Migration

**Files:** `src-tauri/src/db/003_igdb_integration.sql`

**Step 1: Create migration file**

Create file: `src-tauri/src/db/003_igdb_integration.sql`

```sql
-- IGDB credentials storage
CREATE TABLE IF NOT EXISTS igdb_credentials (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    client_id     TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- IGDB OAuth token cache
CREATE TABLE IF NOT EXISTS igdb_token_cache (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    access_token TEXT NOT NULL,
    expires_at   TEXT NOT NULL
);

-- IGDB game data cache
CREATE TABLE IF NOT EXISTS igdb_cache (
    igdb_id      INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    data         TEXT NOT NULL,
    fetched_at   TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at   TEXT NOT NULL
);

-- IGDB games list for fast matching
CREATE TABLE IF NOT EXISTS igdb_games_cache (
    igdb_id      INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    fetched_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_igdb_games_name ON igdb_games_cache(name);

-- Add IGDB columns to games table
ALTER TABLE games ADD COLUMN igdb_id INTEGER;
ALTER TABLE games ADD COLUMN match_source TEXT DEFAULT 'heuristic';

-- Update existing records to have match_source
UPDATE games SET match_source = 'steam' WHERE steam_appid IS NOT NULL;
```

**Step 2: Update migrations module**

Edit file: `src-tauri/src/db/migrations.rs`

Change line 4 from:
```rust
let migrations: &[&str] = &[
    include_str!("001_init.sql"),
    include_str!("002_steam_data.sql"),
];
```

To:
```rust
let migrations: &[&str] = &[
    include_str!("001_init.sql"),
    include_str!("002_steam_data.sql"),
    include_str!("003_igdb_integration.sql"),
];
```

**Step 3: Test migration**

Run: `cargo build --manifest-path=src-tauri/Cargo.toml`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src-tauri/src/db/003_igdb_integration.sql src-tauri/src/db/migrations.rs
git commit -m "feat(db): add IGDB integration schema migration"
```

---

## Task 2: IGDB Models and Types

**Files:** `src-tauri/src/models/igdb.rs`, `src-tauri/src/models/mod.rs`

**Step 1: Create IGDB models**

Create file: `src-tauri/src/models/igdb.rs`

```rust
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

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbGenre {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbTheme {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IgdbGameMode {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
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

#[derive(Debug, Deserialize)]
pub struct IgdbSearchResult {
    pub id: i64,
    pub name: String,
}
```

**Step 2: Export from models module**

Edit file: `src-tauri/src/models/mod.rs`

Add at end:
```rust
pub mod igdb;
pub use igdb::*;
```

**Step 3: Build to verify**

Run: `cargo build --manifest-path=src-tauri/Cargo.toml`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src-tauri/src/models/igdb.rs src-tauri/src/models/mod.rs
git commit -m "feat(models): add IGDB data structures"
```

---

## Task 3: IGDB Backend Commands

**Files:** `src-tauri/src/commands/igdb.rs`, `src-tauri/src/commands/mod.rs`

**Step 1: Create IGDB commands module**

Create file: `src-tauri/src/commands/igdb.rs`

```rust
use tauri::State;
use crate::db::Database;
use crate::models::igdb::*;
use crate::models::scan_result::{MatchCandidate, MatchConfidence, ScanResult};

#[tauri::command]
pub fn get_igdb_credentials(
    db: State<'_, Database>,
) -> Result<Option<IgdbCredentials>, String> {
    let conn = db.lock_conn()?;
    
    let result = conn.query_row(
        "SELECT client_id, client_secret FROM igdb_credentials WHERE id = 1",
        [],
        |row| Ok(IgdbCredentials {
            client_id: row.get(0)?,
            client_secret: row.get(1)?,
        }),
    );

    match result {
        Ok(creds) => Ok(Some(creds)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn save_igdb_credentials(
    client_id: String,
    client_secret: String,
    db: State<'_, Database>,
) -> Result<bool, String> {
    let conn = db.lock_conn()?;
    
    conn.execute(
        "INSERT OR REPLACE INTO igdb_credentials (id, client_id, client_secret, updated_at) 
         VALUES (1, ?1, ?2, datetime('now'))",
        rusqlite::params![client_id, client_secret],
    ).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub async fn test_igdb_connection(
    client_id: String,
    client_secret: String,
) -> Result<bool, String> {
    let url = format!(
        "https://id.twitch.tv/oauth2/token?client_id={}&client_secret={}&grant_type=client_credentials",
        client_id, client_secret
    );

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    if response.status().is_success() {
        Ok(true)
    } else {
        Err("Invalid credentials".to_string())
    }
}

async fn get_igdb_token(db: &Database) -> Result<String, String> {
    // Check cache first
    {
        let conn = db.lock_conn()?;
        let cached: Result<(String, String), rusqlite::Error> = conn.query_row(
            "SELECT access_token, expires_at FROM igdb_token_cache WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        );

        if let Ok((token, expires_at)) = cached {
            let now = chrono::Utc::now().naive_utc().to_string();
            if expires_at > now {
                return Ok(token);
            }
        }
    }

    // Fetch new token
    let creds = get_igdb_credentials(db.clone())?;
    let creds = creds.ok_or("IGDB credentials not configured")?;

    let url = format!(
        "https://id.twitch.tv/oauth2/token?client_id={}&client_secret={}&grant_type=client_credentials",
        creds.client_id, creds.client_secret
    );

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .send()
        .await
        .map_err(|e| format!("Token fetch failed: {}", e))?;

    let token_data: TwitchTokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Token parse failed: {}", e))?;

    // Cache token
    {
        let conn = db.lock_conn()?;
        let expires_at = chrono::Utc::now().naive_utc() + chrono::Duration::days(55);
        
        conn.execute(
            "INSERT OR REPLACE INTO igdb_token_cache (id, access_token, expires_at) 
             VALUES (1, ?1, ?2)",
            rusqlite::params![token_data.access_token, expires_at.to_string()],
        ).map_err(|e| e.to_string())?;
    }

    Ok(token_data.access_token)
}

#[tauri::command]
pub async fn search_igdb_games(
    query: String,
    db: State<'_, Database>,
) -> Result<Vec<IgdbSearchResult>, String> {
    let token = get_igdb_token(&db).await?;
    let creds = get_igdb_credentials(db.clone())?.ok_or("No credentials")?;

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.igdb.com/v4/games")
        .header("Client-ID", &creds.client_id)
        .header("Authorization", format!("Bearer {}", token))
        .body(format!("search \"{}\"; fields id,name; limit 10;", query))
        .send()
        .await
        .map_err(|e| format!("IGDB search failed: {}", e))?;

    let results: Vec<IgdbSearchResult> = response
        .json()
        .await
        .map_err(|e| format!("Parse failed: {}", e))?;

    Ok(results)
}

#[tauri::command]
pub async fn match_folders_with_igdb(
    results: Vec<ScanResult>,
    db: State<'_, Database>,
) -> Result<Vec<ScanResult>, String> {
    let token = get_igdb_token(&db).await?;
    let creds = get_igdb_credentials(db.clone())?.ok_or("No credentials")?;

    let mut matched_results = Vec::new();

    for mut result in results {
        let display_lower = result.display_name.to_lowercase();

        // Search IGDB
        let client = reqwest::Client::new();
        let response = client
            .post("https://api.igdb.com/v4/games")
            .header("Client-ID", &creds.client_id)
            .header("Authorization", format!("Bearer {}", token))
            .body(format!(
                "search \"{}\"; fields id,name; limit 5;",
                display_lower
            ))
            .send()
            .await;

        if let Ok(resp) = response {
            if let Ok(igdb_results) = resp.json::<Vec<IgdbSearchResult>>().await {
                if let Some(best_match) = igdb_results.first() {
                    let distance = levenshtein(&display_lower, &best_match.name.to_lowercase());
                    
                    if distance <= 2 {
                        result.igdb_id = Some(best_match.id);
                        result.match_source = if distance == 0 {
                            "igdb_exact".to_string()
                        } else {
                            "igdb_fuzzy".to_string()
                        };
                        result.candidates = igdb_results
                            .iter()
                            .map(|g| MatchCandidate {
                                appid: g.id,
                                name: g.name.clone(),
                                distance: levenshtein(&display_lower, &g.name.to_lowercase()),
                            })
                            .collect();
                    }
                }
            }
        }

        // Fallback to Steam if no IGDB match
        if result.igdb_id.is_none() {
            // Call existing Steam matcher logic here
            // For now, mark as heuristic
            result.match_source = "heuristic".to_string();
        }

        matched_results.push(result);
    }

    Ok(matched_results)
}

fn levenshtein(a: &str, b: &str) -> usize {
    let a_len = a.chars().count();
    let b_len = b.chars().count();

    if a_len == 0 {
        return b_len;
    }
    if b_len == 0 {
        return a_len;
    }

    let mut matrix = vec![vec![0; b_len + 1]; a_len + 1];

    for (i, row) in matrix.iter_mut().enumerate() {
        row[0] = i;
    }

    for j in 0..=b_len {
        matrix[0][j] = j;
    }

    for (i, ca) in a.chars().enumerate() {
        for (j, cb) in b.chars().enumerate() {
            let cost = if ca == cb { 0 } else { 1 };
            matrix[i + 1][j + 1] = std::cmp::min(
                std::cmp::min(matrix[i][j + 1] + 1, matrix[i + 1][j] + 1),
                matrix[i][j] + cost,
            );
        }
    }

    matrix[a_len][b_len]
}
```

**Step 2: Export commands module**

Edit file: `src-tauri/src/commands/mod.rs`

Add:
```rust
pub mod igdb;
```

**Step 3: Register commands in main**

Edit file: `src-tauri/src/main.rs`

Find the `.invoke_handler()` section and add the new commands:

```rust
.invoke_handler(tauri::generate_handler![
    commands::database::get_games,
    commands::database::save_game,
    commands::database::delete_game,
    commands::database::get_tags,
    commands::database::add_tag_to_game,
    commands::database::remove_tag_from_game,
    commands::scanner::scan_folders,
    commands::matcher::match_folder_names,
    commands::steam::fetch_steam_applist,
    commands::steam::fetch_app_details,
    commands::steam::link_steam_app,
    commands::igdb::get_igdb_credentials,
    commands::igdb::save_igdb_credentials,
    commands::igdb::test_igdb_connection,
    commands::igdb::search_igdb_games,
    commands::igdb::match_folders_with_igdb,
])
```

**Step 4: Build and verify**

Run: `cargo build --manifest-path=src-tauri/Cargo.toml`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src-tauri/src/commands/igdb.rs src-tauri/src/commands/mod.rs src-tauri/src/main.rs
git commit -m "feat(commands): add IGDB API integration commands"
```

---

## Task 4: Update ScanResult Model

**Files:** `src-tauri/src/models/scan_result.rs`

**Step 1: Add IGDB fields to ScanResult**

Edit file: `src-tauri/src/models/scan_result.rs`

Update the ScanResult struct:

```rust
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
```

**Step 2: Update scanner to initialize new fields**

Edit file: `src-tauri/src/commands/scanner.rs`

Find the `is_game_folder` section where ScanResult is created (around line 174) and update:

```rust
results_lock.push(ScanResult {
    folder_name: folder_name.clone(),
    folder_path: folder_path_str,
    display_name,
    steam_appid: None,
    is_on_steam: false,
    igdb_id: None,
    match_source: "heuristic".to_string(),
    match_confidence: MatchConfidence::None,
    candidates: Vec::new(),
});
```

**Step 3: Build**

Run: `cargo build --manifest-path=src-tauri/Cargo.toml`
Expected: Success

**Step 4: Commit**

```bash
git add src-tauri/src/models/scan_result.rs src-tauri/src/commands/scanner.rs
git commit -m "feat(models): add IGDB fields to ScanResult"
```

---

## Task 5: TypeScript Types

**Files:** `src/types/index.ts`

**Step 1: Add IGDB types**

Edit file: `src/types/index.ts` (create if doesn't exist)

Add/Update:

```typescript
export interface ScanResult {
  folder_name: string;
  folder_path: string;
  display_name: string;
  steam_appid?: number;
  is_on_steam: boolean;
  igdb_id?: number;
  match_source: "igdb_exact" | "igdb_fuzzy" | "steam" | "heuristic";
  match_confidence: "Exact" | "Cleaned" | "Fuzzy" | "None";
  candidates: MatchCandidate[];
}

export interface MatchCandidate {
  appid: number;
  name: string;
  distance: number;
}

export interface IgdbCredentials {
  client_id: string;
  client_secret: string;
}

export interface IgdbGame {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  first_release_date?: number;
  rating?: number;
  cover?: {
    id: number;
    url: string;
  };
  genres?: Array<{ id: number; name: string }>;
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add IGDB TypeScript types"
```

---

## Task 6: Settings Page Component

**Files:** `src/components/Settings/SettingsPage.tsx`, `src/components/Settings/ApiConfig.tsx`

**Step 1: Create API configuration component**

Create file: `src/components/Settings/ApiConfig.tsx`

```tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { IgdbCredentials } from "../../types";

export function ApiConfig() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const creds = await invoke<IgdbCredentials | null>("get_igdb_credentials");
      if (creds) {
        setClientId(creds.client_id);
        setClientSecret(creds.client_secret);
        setIsConfigured(true);
      }
    } catch (error) {
      console.error("Failed to load credentials:", error);
    }
  }

  async function testConnection() {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      await invoke("test_igdb_connection", { clientId, clientSecret });
      setTestResult("success");
    } catch (error) {
      setTestResult("error");
      console.error("Test failed:", error);
    } finally {
      setIsTesting(false);
    }
  }

  async function saveCredentials() {
    setIsSaving(true);
    
    try {
      await invoke("save_igdb_credentials", { clientId, clientSecret });
      setIsConfigured(true);
      setTestResult(null);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">IGDB API Configuration</h2>
        <p className="text-gray-400 text-sm mb-4">
          Configure your Twitch API credentials to enable IGDB game matching.
          <a 
            href="https://dev.twitch.tv/console"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 ml-1"
          >
            Get credentials here →
          </a>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Client ID
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your Twitch Client ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Client Secret
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your Twitch Client Secret"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={testConnection}
            disabled={!clientId || !clientSecret || isTesting}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTesting ? "Testing..." : "Test Connection"}
          </button>

          <button
            onClick={saveCredentials}
            disabled={!clientId || !clientSecret || isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>

          {isConfigured && !testResult && (
            <span className="text-green-400 text-sm">✓ Configured</span>
          )}

          {testResult === "success" && (
            <span className="text-green-400 text-sm">✓ Connection successful</span>
          )}

          {testResult === "error" && (
            <span className="text-red-400 text-sm">✗ Connection failed</span>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-medium text-gray-300 mb-2">How to get credentials:</h3>
        <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
          <li>Go to <span className="text-indigo-400">dev.twitch.tv/console</span></li>
          <li>Log in with your Twitch account</li>
          <li>Click "Register Your Application"</li>
          <li>Enter a name (e.g., "Pascal Game Manager")</li>
          <li>Set OAuth Redirect URI to <code className="bg-gray-900 px-1 rounded">http://localhost</code></li>
          <li>Category: "Application Integration"</li>
          <li>Copy Client ID and generate Client Secret</li>
        </ol>
      </div>
    </div>
  );
}
```

**Step 2: Create main Settings page**

Create file: `src/components/Settings/SettingsPage.tsx`

```tsx
import { ApiConfig } from "./ApiConfig";

export function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      
      <div className="space-y-8">
        <section className="bg-gray-900 rounded-lg p-6">
          <ApiConfig />
        </section>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/Settings/ApiConfig.tsx src/components/Settings/SettingsPage.tsx
git commit -m "feat(ui): add IGDB settings page with credential management"
```

---

## Task 7: Update Scanner Flow

**Files:** `src/components/Scanner/FolderPicker.tsx`, `src/App.tsx`

**Step 1: Add IGDB check to FolderPicker**

Edit file: `src/components/Scanner/FolderPicker.tsx`

Add at top of component:

```tsx
const [igdbConfigured, setIgdbConfigured] = useState(false);

useEffect(() => {
  checkIgdbConfig();
}, []);

async function checkIgdbConfig() {
  try {
    const creds = await invoke<IgdbCredentials | null>("get_igdb_credentials");
    setIgdbConfigured(creds !== null);
  } catch (error) {
    console.error("Failed to check IGDB config:", error);
    setIgdbConfigured(false);
  }
}
```

Update the return JSX to show warning:

```tsx
if (!igdbConfigured) {
  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="text-lg font-semibold text-white">IGDB Not Configured</h3>
          <p className="text-gray-400 text-sm mt-1">
            Configure IGDB API credentials to enable game matching.
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate("/settings")}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Open Settings
      </button>
    </div>
  );
}

// Rest of existing FolderPicker JSX...
```

**Step 2: Add routing to App**

Edit file: `src/App.tsx`

Import SettingsPage:

```tsx
import { SettingsPage } from "./components/Settings/SettingsPage";
```

Add route (if using router) or conditional render:

```tsx
// If using React Router:
<Route path="/settings" element={<SettingsPage />} />

// If using state-based navigation:
{currentView === "settings" && <SettingsPage />}
```

**Step 3: Add navigation link**

Edit file: `src/components/Layout/Header.tsx` or `Sidebar.tsx`

Add Settings button/link:

```tsx
<button
  onClick={() => setCurrentView("settings")}
  className="px-3 py-2 text-gray-300 hover:text-white transition-colors"
>
  ⚙️ Settings
</button>
```

**Step 4: Commit**

```bash
git add src/components/Scanner/FolderPicker.tsx src/App.tsx src/components/Layout/Header.tsx
git commit -m "feat(scanner): add IGDB configuration check before scan"
```

---

## Task 8: Update ScanResults Display

**Files:** `src/components/Scanner/ScanResults.tsx`

**Step 1: Update badge colors**

Edit file: `src/components/Scanner/ScanResults.tsx`

Replace badgeColor function:

```tsx
const badgeColor = (source: string, confidence: string) => {
  if (source === "igdb_exact") return "bg-green-600";
  if (source === "igdb_fuzzy") return "bg-blue-600";
  if (source === "steam") return "bg-yellow-600";
  return "bg-gray-600"; // heuristic
};

const badgeText = (source: string, confidence: string) => {
  if (source === "igdb_exact") return "IGDB (Exact)";
  if (source === "igdb_fuzzy") return "IGDB (Fuzzy)";
  if (source === "steam") return "Steam";
  return "Unmatched";
};
```

**Step 2: Update badge display**

In the JSX, update the badge:

```tsx
<span className={`px-2 py-1 text-xs rounded-full ${badgeColor(r.match_source, r.match_confidence)} text-white`}>
  {badgeText(r.match_source, r.match_confidence)}
</span>
```

**Step 3: Show IGDB ID if available**

Add after display_name:

```tsx
{r.igdb_id && (
  <p className="text-gray-500 text-xs">IGDB ID: {r.igdb_id}</p>
)}
```

**Step 4: Commit**

```bash
git add src/components/Scanner/ScanResults.tsx
git commit -m "feat(ui): update scan results to show IGDB match source"
```

---

## Task 9: Update Main Scan Flow

**Files:** `src/components/Scanner/FolderPicker.tsx` or scan handler

**Step 1: Use IGDB matcher instead of Steam**

Edit file: `src/components/Scanner/FolderPicker.tsx`

Find the scan handler and replace:

```tsx
// OLD:
const matched = await invoke<ScanResult[]>("match_folder_names", { results });

// NEW:
const matched = await invoke<ScanResult[]>("match_folders_with_igdb", { results });
```

**Step 2: Commit**

```bash
git add src/components/Scanner/FolderPicker.tsx
git commit -m "feat(scanner): use IGDB as primary matching source"
```

---

## Task 10: Testing & Verification

**Step 1: Build complete project**

Run: `npm run build`
Expected: Build succeeds

**Step 2: Test migration**

- Delete existing database (or use fresh install)
- Run app
- Check that new tables are created
- Verify no errors in console

**Step 3: Test credential flow**

- Navigate to Settings
- Enter test credentials
- Click "Test Connection" → should show success/error
- Click "Save" → should persist
- Reload app → credentials should still be there

**Step 4: Test scan flow**

- Try to scan without IGDB config → should block with warning
- Configure IGDB
- Scan a folder with games
- Verify results show IGDB matching
- Check database for igdb_id values

**Step 5: Final commit**

```bash
git add .
git commit -m "test: verify IGDB integration works end-to-end"
```

---

## Summary

This implementation:
- ✅ Adds IGDB as primary game matching source
- ✅ Requires user to configure Twitch API credentials
- ✅ Blocks scanning if not configured
- ✅ Provides UI for credential management
- ✅ Falls back to heuristic matching if IGDB fails
- ✅ Caches IGDB tokens and game data
- ✅ Shows match source in scan results

**Total estimated time:** 2-3 hours
**Dependencies:** Twitch Developer account (free)
