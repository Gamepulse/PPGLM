@echo off
chcp 65001 >nul
echo ==========================================
echo  Commit des icônes corrigées
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/3] Ajout des fichiers modifiés...
git add src-tauri/icons/
echo.

echo [2/3] Création du commit...
git commit -m "fix: convert icons to RGBA format for cross-platform builds" -m "- All PNG icons now use RGBA color mode with alpha channel" -m "- Required for Tauri builds on macOS and Linux" -m "- Fixes build error: icon is not RGBA"
echo.

echo [3/3] Push vers origin/Dev...
git push origin Dev
echo.

echo ==========================================
echo  Commit et push terminés!
echo ==========================================

pause
