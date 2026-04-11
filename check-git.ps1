cd C:\Coding\Pascal
Write-Host "=== Git Status ===" -ForegroundColor Green
git status
Write-Host "`n=== Git Branch ===" -ForegroundColor Green
git branch --show-current
Write-Host "`n=== Recent Commits ===" -ForegroundColor Green
git log --oneline -5
