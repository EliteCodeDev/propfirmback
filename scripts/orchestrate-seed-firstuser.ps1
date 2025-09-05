# scripts/orchestrate-seed-firstuser.ps1
Param(
  [string]$EnvPath = "$PSScriptRoot/../.env"
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path "$PSScriptRoot/.."

function Set-EnvFlag {
  param(
    [string]$Path,
    [hashtable]$Pairs
  )
  $text = Get-Content -Raw -Path $Path
  foreach ($k in $Pairs.Keys) {
    $v = $Pairs[$k]
    $pattern = "(?m)^$k\s*=.*$"
    if ($text -match $pattern) {
      $text = [regex]::Replace($text, $pattern, "$k=$v")
    } else {
      $text += "`n$k=$v"
    }
  }
  Set-Content -Path $Path -Value $text -NoNewline
}

Write-Host "Using repo at $repoRoot"
Write-Host "Using .env at $EnvPath"

# Step 1: Reset DB (drop + sync) without seeds and without superadmin
Set-EnvFlag -Path $EnvPath -Pairs @{
  'DB_DROP_SCHEMA'      = 'true';
  'DB_SYNCHRONIZE'      = 'true';
  'SEED_ON_BOOT'        = 'false';
  'FIRST_USER_SUPERADMIN' = 'false'
}

Write-Host "Step 1: DB drop & sync (no seeds)" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:db-sync
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:db-sync failed (step 1)" }
Pop-Location

# Step 2: Sync with seed-on-boot true and FIRST_USER_SUPERADMIN true
Set-EnvFlag -Path $EnvPath -Pairs @{
  'DB_DROP_SCHEMA'      = 'false';
  'DB_SYNCHRONIZE'      = 'true';
  'SEED_ON_BOOT'        = 'true';
  'FIRST_USER_SUPERADMIN' = 'true'
}

Write-Host "Step 2: Sync with SEED_ON_BOOT=true and FIRST_USER_SUPERADMIN=true" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:db-sync
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:db-sync failed (step 2)" }
Pop-Location

# Step 3: Create the first user (elitecode) with the same credentials as in original orchestration
Write-Host "Step 3: Create first user (elitecode)" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:user:specific
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:user:specific failed" }
Pop-Location

# Step 4: Seed users (admin, demo y user01..user30)
# Desactiva tareas/cron para evitar mapper/pedidos externos durante el seed
$env:DISABLE_TASKS = "true"
Write-Host "Step 4: Seed users (admin, demo y user01..user30)" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:users
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:users failed" }
Pop-Location

# Step 4: Restore final env flags (no further seed on next boots)
Set-EnvFlag -Path $EnvPath -Pairs @{
  'DB_DROP_SCHEMA'      = 'false';
  'DB_SYNCHRONIZE'      = 'true';
  'SEED_ON_BOOT'        = 'false';
  'FIRST_USER_SUPERADMIN' = 'false'
}

Write-Host "✅ Minimal orchestration finished (DB reset + base seed-on-boot + first user)" -ForegroundColor Green
Write-Host "Final .env flags set to: DB_DROP_SCHEMA=false, DB_SYNCHRONIZE=true, SEED_ON_BOOT=false, FIRST_USER_SUPERADMIN=false" -ForegroundColor Yellow

# Step 6: Seed challenge templates
Write-Host "Step 6: Seed challenge templates" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:challenge-templates
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:challenge-templates failed" }
Pop-Location

# Step 7: Seed real challenges
Write-Host "Step 7: Seed real challenges" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:challenges:real
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:challenges:real failed" }
Pop-Location

# Step 8: Seed real broker accounts
Write-Host "Step 8: Seed real broker accounts" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:broker-accounts:real
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:broker-accounts:real failed" }
Pop-Location

# Step 9: Seed withdrawals (al final, tras brokers)
$env:DISABLE_TASKS = "true"
Write-Host "Step 9: Seed withdrawals (wipe + 30 MIXED, requireChallenge)" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:withdrawals -- --wipe --count=30 --status=MIXED --requireChallenge
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:withdrawals failed" }
Pop-Location