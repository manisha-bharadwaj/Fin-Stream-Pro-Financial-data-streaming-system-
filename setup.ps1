function Install-Dependencies {
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location backend
    pip install -r requirements.txt
    Set-Location ..

    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location frontend
    npm install
    Set-Location ..
}

function Start-Dev {
    Write-Host "Starting backend and frontend in parallel..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
}

function Docker-Up {
    Write-Host "Starting Docker containers..." -ForegroundColor Cyan
    docker compose up --build
}

function Clean-Project {
    Write-Host "Cleaning temporary files..." -ForegroundColor Cyan
    Get-ChildItem -Path . -Include __pycache__ -Recurse | Remove-Item -Force -Recurse
    Get-ChildItem -Path . -Filter "*.pyc" -Recurse | Remove-Item -Force
    if (Test-Path "backend/data/*.db") { Remove-Item "backend/data/*.db" -Force }
    if (Test-Path "frontend/dist") { Remove-Item "frontend/dist" -Force -Recurse }
    if (Test-Path "frontend/node_modules") { Remove-Item "frontend/node_modules" -Force -Recurse }
}

$action = $args[0]

switch ($action) {
    "install" { Install-Dependencies }
    "dev" { Start-Dev }
    "docker" { Docker-Up }
    "clean" { Clean-Project }
    default { 
        Write-Host "Usage: .\setup.ps1 [install|dev|docker|clean]" -ForegroundColor Yellow
    }
}
