Write-Host "🛑 Stopping FinStream Pro..." -ForegroundColor Red

# Kill PIDs from .pids file
if (Test-Path ".pids") {
    Get-Content ".pids" | ForEach-Object {
        $pidToKill = $_.Trim()
        if ($pidToKill) {
            Write-Host "Killing process tree for PID $pidToKill..."
            taskkill /F /T /PID $pidToKill 2>$null
        }
    }
    Remove-Item ".pids" -ErrorAction SilentlyContinue
} else {
    Write-Warning "No .pids file found. Scanning for orphaned processes on ports 8000 and 5173..."
}

# Explicitly kill any remaining processes on port 8000 (Backend)
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    foreach ($conn in $port8000) {
        $pidToKill = $conn.OwningProcess
        if ($pidToKill -and $pidToKill -ne 0) {
            Write-Host "Killing orphaned backend process on port 8000 (PID $pidToKill)..."
            taskkill /F /T /PID $pidToKill 2>$null
        }
    }
}

# Explicitly kill any remaining processes on port 5173 (Frontend)
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    foreach ($conn in $port5173) {
        $pidToKill = $conn.OwningProcess
        if ($pidToKill -and $pidToKill -ne 0) {
            Write-Host "Killing orphaned frontend process on port 5173 (PID $pidToKill)..."
            taskkill /F /T /PID $pidToKill 2>$null
        }
    }
}

Write-Host "🛑 FinStream Pro completely stopped." -ForegroundColor Red
