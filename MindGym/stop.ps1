<#
  MindGym - stop script
  --------------------------------------------------------------------------
  Cleanly stops the backend and frontend started by start.ps1, using the
  process IDs saved in data\mindgym.pids.json.

  Usage:   .\stop.ps1
#>

$ErrorActionPreference = 'SilentlyContinue'
$root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root 'data\mindgym.pids.json'

if (-not (Test-Path $pidFile)) {
    Write-Host "No running MindGym found (no pid file). Nothing to stop." -ForegroundColor Yellow
    return
}

$pids = Get-Content $pidFile -Raw | ConvertFrom-Json

function Stop-Tree($processId, $label) {
    if (-not $processId) { return }
    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if (-not $proc) {
        Write-Host "  $label (PID $processId) was not running." -ForegroundColor DarkGray
        return
    }
    # Stop any child processes first (e.g. esbuild spawned by vite), then the parent.
    Get-CimInstance Win32_Process -Filter "ParentProcessId=$processId" -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "  Stopped $label (PID $processId)." -ForegroundColor Green
}

Write-Host "==> Stopping MindGym…" -ForegroundColor Cyan
Stop-Tree $pids.frontend 'frontend'
Stop-Tree $pids.backend  'backend'

Remove-Item $pidFile -ErrorAction SilentlyContinue
Write-Host "MindGym stopped." -ForegroundColor Green
