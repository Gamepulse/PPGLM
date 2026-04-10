@echo off
chcp 65001 >nul
echo ==========================================
echo  Pascal - Fix Commits and Release v0.5.0
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/6] Resetting last commit to unstage files...
git reset --soft HEAD~1
echo.

echo [2/6] Creating atomic commits...
echo.

echo Commit 1: App title update
git add src/components/Layout/Logo.tsx index.html
git commit -m "feat: update app title to Pascal's Personal Game Manager" -m "- Update Logo.tsx title and subtitle" -m "- Update index.html window title" -m "- Change from 'Pascal Game Manager' to 'Pascal' s Personal Game Manager'"
echo.

echo Commit 2: Filter persistence between pages
git add src/App.tsx src/components/Library/GameList.tsx
git commit -m "fix: persist filters when navigating between pages" -m "- Lift filter state to App.tsx level" -m "- Pass filters as props to GameList component" -m "- Export ActiveFilter interface from GameList" -m "- Maintain backward compatibility with internal state"
echo.

echo Commit 3: Fix scan result duplication
git add src/components/Scanner/FolderPicker.tsx
git commit -m "fix: prevent scan result duplication when toggling folder menu" -m "- Store event listeners in useRef to persist across re-renders" -m "- Clean up listeners before registering new ones" -m "- Add loadedRef to prevent duplicate data loading in StrictMode" -m "- Deduplicate folders by path on load"
echo.

echo Commit 4: Fix thumbnail background in light themes
git add src/components/Library/GameCard.tsx
git commit -m "fix: improve thumbnail visibility in light themes" -m "- Change thumbnail container background to bg-gray-800" -m "- Add keys to img elements for proper React reconciliation" -m "- Ensures good contrast for all game covers regardless of theme"
echo.

echo Commit 5: Backend metadata loading for filters
git add src-tauri/src/commands/database.rs
git commit -m "feat: load game metadata in get_games for client-side filtering" -m "- Add metadata loading (tags, genres, modes, perspectives, themes)" -m "- Previously returned empty arrays, breaking client-side filter logic" -m "- Queries join tables to populate all metadata fields"
echo.

echo Commit 6: Fix duplicate scan folder title + remaining files
git add src/components/Scanner/FolderList.tsx
git add src/components/Scanner/ScanResults.tsx
git add src/components/Scanner/FolderPicker.tsx
git add src/components/Library/GameDetail.tsx
git add src/components/Library/GameDetailTags.tsx
git add src/components/Library/QuickAddModal.tsx
git add src/components/Library/StatisticsDashboard.tsx
git add src/components/Layout/Header.tsx
git add src/components/Settings/ApiConfig.tsx
git add src/components/Settings/DatabaseMaintenance.tsx
git add src/components/Settings/FolderExclusions.tsx
git add src/components/Settings/ScanFilesToggle.tsx
git add src/hooks/useGames.ts
git add src/i18n/translations.ts
git add src/theme/ThemeContext.tsx
git add src/types/index.ts
git add src-tauri/src/commands/launcher.rs
git add src-tauri/src/main.rs
git add src-tauri/src/models/game.rs
git add src/App.tsx
git add release-notes.md
git add MICROSOFT_STORE_PUBLISHING_GUIDE.md
git add RELEASE_NOTES_v0.4.1.md
git add RELEASE_NOTES_v0.4.1_updated.md
git add commit-and-release.bat
git add fix-commits.bat
git commit -m "ui: fix duplicate 'Dossiers de scan' title and additional improvements" -m "- Change header from t('scanFolders') to t('scanner')" -m "- Prevents confusion with the folder list title below" -m "- Include additional UI improvements and documentation"
echo.

echo [3/6] Pushing to origin/Dev...
git push origin Dev
echo.

echo [4/6] Creating GitHub release...
echo.

REM Check if gh CLI is available
where gh >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: GitHub CLI (gh) not found!
    echo Please install it: https://cli.github.com/
    echo.
    echo Or create the release manually at:
    echo https://github.com/Gamepulse/PPGLM/releases/new
    goto :end
)

echo Creating release v0.5.0...
gh release create v0.5.0 --title "Pascal's Personal Game Manager v0.5.0" --notes-file release-notes.md --target Dev

echo.
echo ==========================================
echo  All done! Release v0.5.0 created.
echo ==========================================

:end
pause
