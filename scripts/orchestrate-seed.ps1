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

# 1) Drop schema and disable seed-on-boot
Set-EnvFlag -Path $EnvPath -Pairs @{ 
  'DB_DROP_SCHEMA'='true';
  'DB_SYNCHRONIZE'='true';
  'SEED_ON_BOOT'='false';
  'FIRST_USER_SUPERADMIN'='false'
}

Write-Host "Step 1: DB drop & sync" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:db-sync
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:db-sync failed (step 1)" }
Pop-Location

# 2) Sync with seed on boot to prime base data if app uses it
Set-EnvFlag -Path $EnvPath -Pairs @{ 
  'DB_DROP_SCHEMA'='false';
  'DB_SYNCHRONIZE'='true';
  'SEED_ON_BOOT'='true';
  'FIRST_USER_SUPERADMIN'='true'
}

Write-Host "Step 2: Sync with SEED_ON_BOOT=true" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:db-sync
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:db-sync failed (step 2)" }
Pop-Location

# 3) Ensure the requested user exists (this script respects FIRST_USER_SUPERADMIN if it's the first user)
Write-Host "Step 3: Create specific user (considering FIRST_USER_SUPERADMIN)" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:user:specific
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:user:specific failed" }
Pop-Location

# 4) Turn off SEED_ON_BOOT and run explicit seeders in order
Set-EnvFlag -Path $EnvPath -Pairs @{ 
  'DB_DROP_SCHEMA'='false';
  'DB_SYNCHRONIZE'='true';
  'SEED_ON_BOOT'='false';
  'FIRST_USER_SUPERADMIN'='false'
}

Write-Host "Step 4: Run seeded scripts" -ForegroundColor Cyan
Push-Location $repoRoot
npm run -s seed:users; if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:users failed" }
npm run -s seed:challenge-templates; if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:challenge-templates failed" }
npm run -s seed:challenges:real; if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:challenges:real failed" }
npm run -s seed:broker-accounts:real; if ($LASTEXITCODE -ne 0) { Pop-Location; throw "seed:broker-accounts:real failed" }
Pop-Location

Write-Host "✅ Orchestration finished" -ForegroundColor Green
