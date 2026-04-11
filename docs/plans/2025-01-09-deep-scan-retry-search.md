# Deep Scan & Retry Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Continue scanning after match" setting and allow retrying IGDB search for unmatched games with modified names

**Architecture:** 
1. Add `continue_scan_after_match` boolean setting stored in SQLite, read during scan to disable early-exit optimization
2. Add `retry_igdb_search` command that takes a modified name and returns new match candidates
3. Frontend toggle in Settings page and "Retry Search" button in unmatched game cards

**Tech Stack:** Rust (Tauri), TypeScript/React, SQLite, IGDB API

---

## Task 1: Add Database Migration for New Setting

**Files:**
- Create: `src-tauri/src/db/014_deep_scan_setting.sql`

**Step 1: Write migration**

```sql
-- Add continue_scan_after_match setting
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('continue_scan_after_match', 'false');
```

**Step 2: Register migration in migrations.rs**

Modify: `src-tauri/src/db/migrations.rs`

Add to the migrations list:
```rust
include_str!("014_deep_scan_setting.sql"),
```

**Step 3: Commit**

```bash
git add src-tauri/src/db/014_deep_scan_setting.sql src-tauri/src/db/migrations.rs
git commit -m "feat: add continue_scan_after_match database migration"
```

---

## Task 2: Add Backend Setting Support

**Files:**
- Modify: `src-tauri/src/commands/scanner.rs:231-360` (scan_folders_smart function)

**Step 1: Load the new setting**

After loading other settings (around line 290-304), add:

```rust
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
```

**Step 2: Pass setting to scan function**

Change the scan_directory_smart call (around line 346-360) to include the new parameter:

```rust
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
    continue_scan_after_match, // NEW PARAMETER
).await?;
```

**Step 3: Commit**

```bash
git add src-tauri/src/commands/scanner.rs
git commit -m "feat: load continue_scan_after_match setting in scanner"
```

---

## Task 3: Modify Scanner Logic to Respect Deep Scan Setting

**Files:**
- Modify: `src-tauri/src/commands/scanner.rs:387-609` (scan_directory_smart function signature and early-exit logic)

**Step 1: Update function signature**

Change function signature (around line 387-401):

```rust
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
    continue_scan_after_match: bool, // NEW PARAMETER
) -> Result<(), String> {
```

**Step 2: Modify early-exit logic**

Around line 562-564, change:

```rust
// EARLY EXIT: Don't scan children of this folder
continue;
```

To:

```rust
// EARLY EXIT: Don't scan children of this folder (unless deep scan is enabled)
if !continue_scan_after_match {
    continue;
}
// If deep scan enabled, continue to scan subdirectories even after finding a match
```

**Step 3: Pass parameter in recursive call**

Around line 586-600, add the parameter to the recursive call:

```rust
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
    continue_scan_after_match, // NEW PARAMETER
)).await?;
```

**Step 4: Commit**

```bash
git add src-tauri/src/commands/scanner.rs
git commit -m "feat: implement deep scan logic with continue_scan_after_match setting"
```

---

## Task 4: Add retry_igdb_search Command

**Files:**
- Modify: `src-tauri/src/commands/matcher.rs` (add new command)

**Step 1: Add the new command**

Add at the end of the file (after line 155):

```rust
/// Retry IGDB search with a modified name for an unmatched game
#[tauri::command]
pub async fn retry_igdb_search(
    folder_name: String,
    modified_name: String,
    db: State<'_, Database>,
) -> Result<Option<ScanResult>, String> {
    let token = get_igdb_token(&db).await?;
    let creds = get_igdb_credentials_from_db(&db)?
        .ok_or_else(|| "IGDB credentials not configured".to_string())?;
    
    // Load match threshold
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

    // Try to match with the modified name
    let display_name = clean_folder_name(&modified_name);
    let display_lower = display_name.to_lowercase();
    let folder_lower = folder_name.to_lowercase();

    // Search IGDB with modified name
    tokio::time::sleep(std::time::Duration::from_millis(250)).await;
    
    let client = reqwest::Client::new();
    let response = client
        .post("https://api.igdb.com/v4/games")
        .header("Client-ID", &creds.client_id)
        .header("Authorization", format!("Bearer {}", token))
        .body(format!(
            "search \"{}\"; fields id,name,slug,cover.url; limit 5;",
            display_lower
        ))
        .send()
        .await;

    if let Ok(resp) = response {
        if let Ok(igdb_results) = resp.json::<Vec<IgdbGameWithCover>>().await {
            if let Some(best_match) = igdb_results.first() {
                let igdb_name_lower = best_match.name.to_lowercase();
                
                let distance_display = levenshtein(&display_lower, &igdb_name_lower);
                let distance_folder = levenshtein(&folder_lower, &igdb_name_lower);
                let best_distance = std::cmp::min(distance_display, distance_folder);
                
                let name_used = if distance_folder <= distance_display {
                    "folder_name"
                } else {
                    "modified_name"
                };

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
                            slug: g.slug.clone(),
                        }
                    })
                    .collect();

                if best_distance <= match_threshold {
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

                    return Ok(Some(ScanResult {
                        folder_name: folder_name.clone(),
                        folder_path: String::new(), // Will be set by caller
                        display_name: best_match.name.clone(),
                        match_confidence,
                        candidates,
                        igdb_id: Some(best_match.id),
                        igdb_slug: best_match.slug.clone(),
                        match_source,
                        cover_url: best_match.cover.as_ref().map(|c| format_cover_url(&c.url)),
                        synopsis: None,
                        release_date: None,
                        igdb_rating: None,
                        genres: vec![],
                        game_modes: vec![],
                        player_perspectives: vec![],
                        themes: vec![],
                        platforms: vec![],
                        platform: None,
                    }));
                }
            }
        }
    }

    Ok(None)
}
```

**Step 2: Add imports and register command**

Add imports at top of file:
```rust
use crate::utils::clean_folder_name;
```

Register in main.rs commands list (you'll need to add `retry_igdb_search` to the generate_handler! macro).

**Step 3: Commit**

```bash
git add src-tauri/src/commands/matcher.rs
git commit -m "feat: add retry_igdb_search command for manual name retry"
```

---

## Task 5: Add Frontend Hook for Deep Scan Setting

**Files:**
- Modify: `src/hooks/useSettings.ts`

**Step 1: Add state and load/save functions**

Add after `scanFiles` state (around line 30):

```typescript
const [continueScanAfterMatch, setContinueScanAfterMatchState] = useState<boolean>(false);
```

Add loading function after `loadScanFilesSetting` (around line 44-51):

```typescript
const loadContinueScanAfterMatchSetting = useCallback(async () => {
  try {
    const value = await invoke<string | null>("get_setting", { key: "continue_scan_after_match" });
    setContinueScanAfterMatchState(value === "true");
  } catch (e) {
    console.error("Failed to load continue_scan_after_match setting:", e);
  }
}, []);
```

Add to useEffect dependencies (around line 36-42):
```typescript
loadContinueScanAfterMatchSetting();
```

Add setter function after `setScanFiles` (around line 67-82):

```typescript
const setContinueScanAfterMatch = useCallback(async (value: boolean) => {
  setLoading(true);
  try {
    await invoke("set_setting", { 
      key: "continue_scan_after_match", 
      value: value ? "true" : "false" 
    });
    setContinueScanAfterMatchState(value);
    return true;
  } catch (e) {
    console.error("Failed to save continue_scan_after_match setting:", e);
    return false;
  } finally {
    setLoading(false);
  }
}, []);
```

**Step 2: Export the new functions**

Add to return object (around line 170-182):

```typescript
return {
  // ... existing exports ...
  continueScanAfterMatch,
  setContinueScanAfterMatch,
  // ...
};
```

**Step 3: Commit**

```bash
git add src/hooks/useSettings.ts
git commit -m "feat: add continueScanAfterMatch setting to useSettings hook"
```

---

## Task 6: Add Deep Scan Toggle to Settings UI

**Files:**
- Modify: `src/components/Settings/SettingsPage.tsx`

**Step 1: Import the new setting**

Add to the useSettings destructuring (around line 15-25):

```typescript
const { 
  // ... existing ...
  continueScanAfterMatch, 
  setContinueScanAfterMatch 
} = useSettings();
```

**Step 2: Add the toggle component**

Add after the ScanFilesToggle (around line 80-100):

```tsx
{/* Deep Scan Toggle */}
<div className="flex items-center justify-between py-4 border-b border-gray-700">
  <div>
    <h3 className="text-lg font-medium theme-text-primary">
      {t('deepScan') || "Deep Scan"}
    </h3>
    <p className="text-sm theme-text-secondary mt-1">
      {t('deepScanDescription') || "Continue scanning subdirectories even after finding a game match. Useful for detecting multiple games in nested folders."}
    </p>
  </div>
  <button
    onClick={() => setContinueScanAfterMatch(!continueScanAfterMatch)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      continueScanAfterMatch ? 'bg-indigo-600' : 'bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        continueScanAfterMatch ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
</div>
```

**Step 3: Add translations**

Add to `src/i18n/translations.ts` in both en and fr objects:

```typescript
deepScan: "Deep Scan",
deepScanDescription: "Continue scanning subdirectories even after finding a game match. Useful for detecting multiple games in nested folders.",
```

**Step 4: Commit**

```bash
git add src/components/Settings/SettingsPage.tsx src/i18n/translations.ts
git commit -m "feat: add deep scan toggle to settings UI"
```

---

## Task 7: Add Retry Search Button to ResultCard

**Files:**
- Modify: `src/components/Scanner/ResultCard.tsx` (or create if doesn't exist)

**Step 1: Add retry button for non-matches**

Find where ResultCard renders non-match state, add a "Retry IGDB Search" button:

```tsx
{isNonMatch && (
  <div className="flex gap-2 mt-2">
    <button
      onClick={() => onRetrySearch?.(result.folder_name, result.display_name)}
      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
      disabled={isRetrying}
    >
      {isRetrying ? t('searching') || "Searching..." : t('retrySearch') || "Retry IGDB Search"}
    </button>
  </div>
)}
```

**Step 2: Add retry handler in ScanResults**

Modify: `src/components/Scanner/ScanResults.tsx`

Add state:
```typescript
const [retryingId, setRetryingId] = useState<string | null>(null);
```

Add handler:
```typescript
const handleRetrySearch = useCallback(async (folderPath: string, modifiedName: string) => {
  setRetryingId(folderPath);
  try {
    const result = await invoke<ScanResult | null>("retry_igdb_search", {
      folderName: editableResults.find(r => r.folder_path === folderPath)?.folder_name || "",
      modifiedName: modifiedName,
    });
    
    if (result) {
      // Update the result with new match data
      setEditableResults(prev => prev.map(r => 
        r.folder_path === folderPath 
          ? { ...r, ...result, folder_path: folderPath }
          : r
      ));
    } else {
      alert(t('noMatchFound') || "No match found with the modified name");
    }
  } catch (e) {
    alert(t('searchFailed') || "Search failed: " + e);
  } finally {
    setRetryingId(null);
  }
}, [editableResults]);
```

**Step 3: Pass handler to ResultCard**

```tsx
<ResultCard 
  // ... existing props ...
  onRetrySearch={handleRetrySearch}
  isRetrying={retryingId === r.folder_path}
/>
```

**Step 4: Add translations**

Add to translations:
```typescript
retrySearch: "Retry IGDB Search",
searching: "Searching...",
noMatchFound: "No match found with the modified name",
searchFailed: "Search failed",
```

**Step 5: Commit**

```bash
git add src/components/Scanner/ResultCard.tsx src/components/Scanner/ScanResults.tsx src/i18n/translations.ts
git commit -m "feat: add retry IGDB search button for unmatched games"
```

---

## Task 8: Register New Command in Main

**Files:**
- Modify: `src-tauri/src/main.rs` (find the generate_handler! macro)

**Step 1: Add command to handler**

Find the `generate_handler!` macro and add `retry_igdb_search` to the list.

**Step 2: Commit**

```bash
git add src-tauri/src/main.rs
git commit -m "feat: register retry_igdb_search command in tauri handler"
```

---

## Task 9: Test the Implementation

**Step 1: Run Rust tests**

```bash
cd src-tauri && cargo test
cd ..
```

**Step 2: Test deep scan setting**
1. Open app, go to Settings
2. Enable "Deep Scan" toggle
3. Run a scan on a folder with nested game directories
4. Verify it scans subdirectories even after finding matches

**Step 3: Test retry search**
1. Run a scan that produces some non-matches
2. Click on a non-match to expand it
3. Modify the display name
4. Click "Retry IGDB Search"
5. Verify new candidates appear or game gets matched

**Step 4: Commit**

```bash
git commit -m "test: verify deep scan and retry search features"
```

---

## Summary

This implementation adds:
1. **Deep Scan option** - Database migration + backend logic + frontend toggle
2. **Retry IGDB Search** - New command + UI button for unmatched games

Total files modified: ~8 files
Estimated time: 2-3 hours
