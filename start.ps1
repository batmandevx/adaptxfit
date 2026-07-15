# start.ps1 — start the unified AdaptiFit app (the single merged project).
#
# This is the ONLY script you need to run. It installs dependencies on first
# run, prepares the local database, and starts the app at http://localhost:3000.
#
#   ./start.ps1
#
# Stop it again with ./stop.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$app  = Join-Path $root 'hi'

Set-Location $app

# 1. Install dependencies on first run (React 19 needs --legacy-peer-deps).
if (-not (Test-Path (Join-Path $app 'node_modules'))) {
  Write-Host '==> Installing dependencies (first run, this can take a minute)...' -ForegroundColor Cyan
  npm install --legacy-peer-deps
}

# 2. Generate the Prisma client and sync the local SQLite schema.
Write-Host '==> Preparing local database...' -ForegroundColor Cyan
npx prisma generate | Out-Null
npx prisma db push --skip-generate | Out-Null

# 3. Start the dev server (Next.js, port 3000).
Write-Host '==> Starting AdaptiFit at http://localhost:3000' -ForegroundColor Green
npx next dev -p 3000
