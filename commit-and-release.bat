@echo off
chcp 65001 >nul
echo ==========================================
echo  Pascal - Git Commit and Release Script
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/5] Checking git status...
git status
echo.

echo [2/5] Adding all changes...
git add -A
echo.

echo [3/5] Creating commits...
echo.

echo Commit 1: App title update
git commit -m "feat: update app title to Pascal's Personal Game Manager" --author="Sisyphus <clio-agent@sisyphuslabs.ai>" -m "- Update Logo.tsx title and subtitle" -m "- Update index.html window title" -m "- Change from 'Pascal Game Manager' to 'Pascal's Personal Game Manager'"
echo.

echo Commit 2: Filter persistence between pages
git commit -m "fix: persist filters when navigating between pages" --author="Sisyphus <clio-agent@sisyphuslabs.ai>" -m "- Lift filter state to App.tsx level" -m "- Pass filters as props to GameList component" -m "- Export ActiveFilter interface from GameList" -m "- Maintain backward compatibility with internal state"
echo.

echo Commit 3: Fix scan result duplication
git commit -m "fix: prevent scan result duplication when toggling folder menu" --author="Sisyphus <clio-agent@sisyphuslabs.ai>" -m "- Store event listeners in useRef to persist across re-renders" -m "- Clean up listeners before registering new ones" -m "- Add loadedRef to prevent duplicate data loading in StrictMode" -m "- Deduplicate folders by path on load"
echo.

echo Commit 4: Fix thumbnail background in light themes
git commit -m "fix: improve thumbnail visibility in light themes" --author="Sisyphus <clio-agent@sisyphuslabs.ai>" -m "- Change thumbnail container background to bg-gray-800" -m "- Add keys to img elements for proper React reconciliation" -m "- Ensures good contrast for all game covers regardless of theme"
echo.

echo Commit 5: Backend metadata loading for filters
git commit -m "feat: load game metadata in get_games for client-side filtering" --author="Sisyphus <clio-agent@sisyphuslabs.ai>" -m "- Add metadata loading (tags, genres, modes, perspectives, themes)" -m "- Previously returned empty arrays, breaking client-side filter logic" -m "- Queries join tables to populate all metadata fields"
echo.

echo Commit 6: Fix duplicate scan folder title
git commit -m "ui: fix duplicate 'Dossiers de scan' title" --author="Sisyphus <clio-agent@sisyphuslabs.ai>" -m "- Change header from t('scanFolders') to t('scanner')" -m "- Prevents confusion with the folder list title below"
echo.

echo [4/5] Pushing to origin...
git push origin main
echo.

echo [5/5] Creating GitHub release...
echo.

REM Check if gh CLI is available
where gh >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: GitHub CLI (gh) not found!
    echo Please install it: https://cli.github.com/
    echo.
    echo Or create the release manually at:
    echo https://github.com/IVONNENI
echo Pascal/releases/new
    goto :end
)

echo Creating release v0.5.0...
gh release create v0.5.0 --title "Pascal's Personal Game Manager v0.5.0" --notes-file release-notes.md

echo.
echo ==========================================
echo  All done! Release v0.5.0 created.
echo ==========================================

:end
pause
