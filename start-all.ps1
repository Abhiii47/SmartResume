# SmartResume - Start Both Servers
Write-Host "Starting SmartResume..." -ForegroundColor Cyan

# Kill existing processes on ports 8000 and 3000
@(8000, 3000) | ForEach-Object {
    $port = $_
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        Write-Host "Stopping processes on port $port..." -ForegroundColor Yellow
        $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    }
}

Start-Sleep -Seconds 1

# Start backend
Write-Host "Starting Backend (port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 1

# Start frontend
Write-Host "Starting Frontend (port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm start"

Write-Host "`n✅ Servers starting in separate windows" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Yellow
