Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   PROJECT ECHO - Starting Vite React Frontend Server" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
npm run dev
