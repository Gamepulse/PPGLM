@echo off
cd /d C:\Coding\Pascal
echo === Git Status ===
git status
echo.
echo === Adding all changes ===
git add .
echo.
echo === Committing ===
git commit -m "UI improvements: filter reset button, tag # prefix, donut chart, stats responsive, scan IGDB data fix"
echo.
echo === Pushing to origin Dev ===
git push origin Dev
echo.
echo === Done ===
pause
