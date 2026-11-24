@echo off
echo ========================================================
echo    PROJECT ECHO - Starting FastAPI Backend Server
echo ========================================================
cd /d "%~dp0\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
