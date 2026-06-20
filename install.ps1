# loadbearing installer (Windows / PowerShell).
#   .\install.ps1 check                -> validate the pack (files present, JSON valid, hook tests pass)
#   .\install.ps1 <project-dir>        -> install loadbearing into a project's .claude/ (Claude Code, project-level)
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmd = if ($args.Count -ge 1) { $args[0] } else { "" }

function Invoke-Check {
  $ok = $true
  foreach ($f in @(".claude-plugin/plugin.json","hooks/hooks.json","hooks/perf-scan.js","hooks/detectors.js","rules/performance.md")) {
    if (Test-Path (Join-Path $Here $f)) { Write-Host "  ok   $f" } else { Write-Host "  MISS $f"; $ok = $false }
  }
  try { node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" (Join-Path $Here ".claude-plugin/plugin.json") | Out-Null; Write-Host "  ok   plugin.json is valid JSON" } catch { Write-Host "  FAIL plugin.json invalid"; $ok = $false }
  node (Join-Path $Here "hooks/test/run-tests.js") | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "  ok   hook detector tests pass" } else { Write-Host "  FAIL hook tests"; $ok = $false }
  Write-Host ""
  if ($ok) { Write-Host "loadbearing: pack is healthy on this clone."; exit 0 } else { Write-Host "loadbearing: pack has problems (see above)."; exit 1 }
}

function Install-Into($target) {
  if (-not (Test-Path $target)) { Write-Host "target dir not found: $target"; exit 1 }
  $cdir = Join-Path $target ".claude"
  foreach ($d in @("skills","commands","agents","loadbearing")) { New-Item -ItemType Directory -Force -Path (Join-Path $cdir $d) | Out-Null }
  Copy-Item (Join-Path $Here "skills/*") (Join-Path $cdir "skills") -Recurse -Force
  Copy-Item (Join-Path $Here "commands/*") (Join-Path $cdir "commands") -Recurse -Force
  Copy-Item (Join-Path $Here "agents/*") (Join-Path $cdir "agents") -Recurse -Force
  Copy-Item (Join-Path $Here "rules"),(Join-Path $Here "hooks") (Join-Path $cdir "loadbearing") -Recurse -Force
  Write-Host "loadbearing content copied into $cdir"
  Write-Host ""
  Write-Host "Last step (safe, manual): add the PostToolUse hook to $cdir\settings.json - see README."
}

switch ($cmd) {
  "check" { Invoke-Check }
  "" { Write-Host "usage: .\install.ps1 check   |   .\install.ps1 <project-dir>"; exit 1 }
  default { Install-Into $cmd }
}
