# aculion-platform/start-dev.ps1
# Run this script from the aculion-platform directory to start both services.
# Usage: .\start-dev.ps1

param(
    [switch]$FrontendOnly,
    [switch]$BackendOnly
)

$root = $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "       ACULION PLATFORM - Dev Launcher" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ─── FRONTEND ────────────────────────────────────────────────────────────────
function Start-Frontend {
    $webDir = Join-Path $root "apps\web"

    if (-not (Test-Path (Join-Path $webDir "node_modules"))) {
        Write-Host "[FRONTEND] node_modules not found. Running npm install..." -ForegroundColor Yellow
        Push-Location $webDir
        npm install
        Pop-Location
    }

    Write-Host "[FRONTEND] Starting Vite dev server at http://localhost:5173 ..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$webDir'; npm run dev" -WindowStyle Normal
}

# ─── BACKEND ─────────────────────────────────────────────────────────────────
function Start-Backend {
    $backendDir = Join-Path $root "services\location-service"
    $venvPath   = Join-Path $backendDir ".venv"
    $venvActivate = Join-Path $venvPath "Scripts\Activate.ps1"

    # Create venv if it doesn't exist
    if (-not (Test-Path $venvPath)) {
        Write-Host "[BACKEND] Virtual environment not found. Creating .venv..." -ForegroundColor Yellow
        python -m venv "$venvPath"
        Write-Host "[BACKEND] .venv created." -ForegroundColor Green
    }

    # Install dependencies if not already installed
    $uvicornCheck = Join-Path $venvPath "Scripts\uvicorn.exe"
    if (-not (Test-Path $uvicornCheck)) {
        Write-Host "[BACKEND] Installing Python dependencies..." -ForegroundColor Yellow
        & "$venvPath\Scripts\pip.exe" install -r "$backendDir\requirements.txt"
        Write-Host "[BACKEND] Dependencies installed." -ForegroundColor Green
    }

    Write-Host "[BACKEND] Starting FastAPI server at http://localhost:8000 ..." -ForegroundColor Magenta
    Start-Process powershell -ArgumentList "-NoExit", "-Command", `
        "& '$venvActivate'; cd '$backendDir'; uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload" `
        -WindowStyle Normal
}

# ─── LAUNCH ──────────────────────────────────────────────────────────────────
if ($FrontendOnly) {
    Start-Frontend
} elseif ($BackendOnly) {
    Start-Backend
} else {
    Start-Frontend
    Start-Backend
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Services launching in separate windows." -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000/docs" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Cyan
