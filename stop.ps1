if (Test-Path ".pids") {
    Write-Host "🛑 Stopping FinStream Pro..." -ForegroundColor Red
    Get-Content ".pids" | ForEach-Object {
        $pidToKill = $_.Trim()
        if ($pidToKill) {
            Stop-Process -Id $pidToKill -ErrorAction SilentlyContinue
        }
    }
    Remove-Item ".pids"
    Write-Host "🛑 FinStream Pro stopped" -ForegroundColor Red
} else {
    Write-Warning "No .pids file found. Is the app running?"
}
