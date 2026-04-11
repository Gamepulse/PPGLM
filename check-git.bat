@echo off
cd /d C:\Coding\Pascal
echo === Git Status ===
git status
echo.
echo === Git Branch ===
git branch --show-current
echo.
echo === Recent Commits ===
git log --oneline -5
echo.
pause
