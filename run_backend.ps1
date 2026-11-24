Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   PROJECT ECHO - Starting FastAPI Backend Server" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
