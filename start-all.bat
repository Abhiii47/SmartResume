@echo off
echo Starting SmartResume...

REM Kill existing processes
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

timeout /t 1 /nobreak >nul

echo Starting Backend (port 8000)...
start "Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000"

timeout /t 1 /nobreak >nul

echo Starting Frontend (port 3000)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo Servers starting in separate windows
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
pause
