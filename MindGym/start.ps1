<#
  MindGym - start script
  --------------------------------------------------------------------------
  This is the ONLY script you need to run MindGym. It:
    1. Creates a Python virtual environment and installs backend deps (first run)
    2. Installs frontend deps with npm (first run)
    3. Starts the FastAPI backend (port 8000) and Vite frontend (port 5173)
    4. Saves the process IDs so stop.ps1 can shut everything down cleanly

  Usage:   .\start.ps1
  Stop:    .\stop.ps1
#>

$ErrorActionPreference = 'Stop'
$root      = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend   = Join-Path $root 'backend'
$frontend  = Join-Path $root 'frontend'
$dataDir   = Join-Path $root 'data'
$pidFile   = Join-Path $dataDir 'mindgym.pids.json'
$logDir    = Join-Path $dataDir 'logs'

New-Item -ItemType Directory -Force -Path $dataDir, $logDir | Out-Null

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

# --- Already running? ------------------------------------------------------
if (Test-Path $pidFile) {
    $existing = Get-Content $pidFile -Raw | ConvertFrom-Json
    $alive = $false
    foreach ($id in @($existing.backend, $existing.frontend)) {
        if ($id -and (Get-Process -Id $id -ErrorAction SilentlyContinue)) { $alive = $true }
    }
    if ($alive) {
        Write-Host "MindGym already appears to be running. Run .\stop.ps1 first." -ForegroundColor Yellow
        Write-Host "Frontend: http://localhost:5173"
        return
    }
}

# --- Resolve Python --------------------------------------------------------
$pythonCmd = $null
foreach ($c in 'python', 'py') {
    if (Get-Command $c -ErrorAction SilentlyContinue) { $pythonCmd = $c; break }
}
if (-not $pythonCmd) { throw "Python was not found on PATH. Please install Python 3.10+." }
if (-not (Get-Command 'npm' -ErrorAction SilentlyContinue)) { throw "npm was not found on PATH. Please install Node.js 18+." }

# --- Backend setup ---------------------------------------------------------
$venv   = Join-Path $backend '.venv'
$venvPy = Join-Path $venv 'Scripts\python.exe'
if (-not (Test-Path $venvPy)) {
    Write-Step 'Creating Python virtual environment (first run)…'
    & $pythonCmd -m venv $venv
    Write-Step 'Installing backend dependencies…'
    & $venvPy -m pip install --upgrade pip --quiet --disable-pip-version-check
    & $venvPy -m pip install --quiet --disable-pip-version-check -r (Join-Path $backend 'requirements.txt')
} else {
    Write-Step 'Backend dependencies already installed.'
}

# --- Frontend setup --------------------------------------------------------
if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
    Write-Step 'Installing frontend dependencies with npm (first run, may take a minute)…'
    Push-Location $frontend
    try { & npm install } finally { Pop-Location }
} else {
    Write-Step 'Frontend dependencies already installed.'
}

# --- Start backend ---------------------------------------------------------
Write-Step 'Starting backend (http://localhost:8000)…'
$backendProc = Start-Process -FilePath $venvPy `
    -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000') `
    -WorkingDirectory $backend -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir 'backend.out.log') `
    -RedirectStandardError  (Join-Path $logDir 'backend.err.log')

# --- Start frontend --------------------------------------------------------
Write-Step 'Starting frontend (http://localhost:5173)…'
$viteJs = Join-Path $frontend 'node_modules\vite\bin\vite.js'
$frontendProc = Start-Process -FilePath 'node' `
    -ArgumentList @($viteJs, '--port', '5173') `
    -WorkingDirectory $frontend -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir 'frontend.out.log') `
    -RedirectStandardError  (Join-Path $logDir 'frontend.err.log')

@{ backend = $backendProc.Id; frontend = $frontendProc.Id } | ConvertTo-Json | Set-Content $pidFile

# --- Wait for backend health ----------------------------------------------
Write-Step 'Waiting for the backend to be ready…'
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 750
    try {
        $r = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 2
        if ($r.status -eq 'ok') { $ready = $true; break }
    } catch { }
}

Write-Host ''
if ($ready) {
    Write-Host '  MindGym is running!' -ForegroundColor Green
} else {
    Write-Host '  Backend health check timed out - check data\logs\backend.err.log' -ForegroundColor Yellow
}
Write-Host '  ---------------------------------------------'
Write-Host '   Open in your browser:  http://localhost:5173'
Write-Host '   Backend API:           http://localhost:8000/api/health'
Write-Host '   Logs:                  data\logs\'
Write-Host '   To stop everything:    .\stop.ps1'
Write-Host '  ---------------------------------------------'
