# stop.ps1 — stop the unified AdaptiFit app started by start.ps1.
#
#   ./stop.ps1
#
# Stops whatever process is listening on port 3000 (the Next.js dev server).

$port = 3000

try {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
  $pids  = $conns | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $pids) {
    try {
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "==> Stopped process $procId on port $port." -ForegroundColor Green
    } catch {
      Write-Host "==> Could not stop process $procId: $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
} catch {
  Write-Host "==> Nothing is listening on port $port. AdaptiFit is not running." -ForegroundColor Yellow
}
