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

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
python -m pip install -r backend/requirements.txt

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..

# Start Backend
Write-Host "🚀 Starting Backend on Port 8000..." -ForegroundColor Green
$backendProcess = Start-Process python -ArgumentList "-m uvicorn main:app --reload --port 8000" -WorkingDirectory "backend" -PassThru -WindowStyle Hidden

# Start Frontend
Write-Host "🚀 Starting Frontend on Port 5173..." -ForegroundColor Green
Set-Location frontend
$frontendProcess = Start-Process npm -ArgumentList "run dev" -PassThru -WindowStyle Hidden
Set-Location ..

# Save PIDs
$backendProcess.Id | Out-File -FilePath ".pids" -Encoding utf8
$frontendProcess.Id | Add-Content -Path ".pids"

Write-Host ""
Write-Host "✅ FinStream Pro is starting..." -ForegroundColor Cyan
Write-Host "📡 Backend API: http://localhost:8000"
Write-Host "🖥️  Frontend:    http://localhost:5173"
Write-Host "📋 API Docs:    http://localhost:8000/docs"
Write-Host ""
Write-Host "To stop the servers, run: ./stop.ps1"
