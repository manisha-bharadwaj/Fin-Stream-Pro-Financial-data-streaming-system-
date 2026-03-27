# Check for Python and Node
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Warning "Python is not installed or not in PATH."
}
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Warning "Node is not installed or not in PATH."
}

# Create data directory
New-Item -ItemType Directory -Force -Path "backend/data" | Out-Null

# Virtual environment check
if (Test-Path ".venv") {
    Write-Host "🐍 Using virtual environment (.venv)..." -ForegroundColor Cyan
    $env:PATH = "$(Get-Location)\.venv\Scripts;$(Get-Location)\.venv\bin;$env:PATH"
}

# Cleanup old .pids if they are dead
if (Test-Path ".pids") {
    $existingPids = Get-Content ".pids"
    foreach ($p in $existingPids) {
        if ($p -and (Get-Process -Id $p -ErrorAction SilentlyContinue)) {
            Write-Warning "⚠️ Process $p is still running. You might want to run ./stop.ps1 first."
        }
    }
}

# Check ports
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($port8000) {
    $pidToKill = $port8000[0].OwningProcess
    Write-Warning "⚠️ Port 8000 is already in use by PID $pidToKill. Force killing it..."
    taskkill /F /T /PID $pidToKill 2>$null
    $port8000 = $null
    Start-Sleep -Seconds 1
}
if ($port5173) {
    $pidToKill = $port5173[0].OwningProcess
    Write-Warning "⚠️ Port 5173 is already in use by PID $pidToKill. Force killing it..."
    taskkill /F /T /PID $pidToKill 2>$null
    $port5173 = $null
    Start-Sleep -Seconds 1
}

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
python -m pip install -r backend/requirements.txt

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..

# Start Backend
Write-Host "--- Starting Backend on Port 8000 ---" -ForegroundColor Green
if (-not $port8000) {
    $backendProcess = Start-Process python -ArgumentList "-m uvicorn backend.main:app --reload --port 8000" -PassThru -WindowStyle Hidden
    $backendProcess.Id | Out-File -FilePath ".pids" -Encoding utf8
} else {
    Write-Host "Using existing backend process." -ForegroundColor Yellow
    $port8000.OwningProcess[0] | Out-File -FilePath ".pids" -Encoding utf8
}

# Start Frontend
Write-Host "--- Starting Frontend on Port 5173 ---" -ForegroundColor Green
if (-not $port5173) {
    # Run frontend in the background like the backend
    $frontendProcess = Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"npm run dev`"" -WorkingDirectory "$PWD\frontend" -PassThru -WindowStyle Hidden
    $frontendProcess.Id | Add-Content -Path ".pids"
} else {
    Write-Host "Using existing frontend process." -ForegroundColor Yellow
    $port5173.OwningProcess[0] | Add-Content -Path ".pids"
}

Write-Host ""
Write-Host "FinStream Pro is starting in the background..." -ForegroundColor Cyan
Write-Host "Backend API:   http://127.0.0.1:8000"
Write-Host "Frontend:      http://127.0.0.1:5173"
Write-Host "API Docs:      http://127.0.0.1:8000/docs"
Write-Host ""
Write-Host "To stop the servers, run: ./stop.ps1"
