<#
.SYNOPSIS
Verificacion objetiva post-TAMU. Agente local corre esto; NO arregla codigo si falla.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$TaskId,
    [string]$ProjectRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($ProjectRoot -eq "") {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ProjectRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
}

function Fail([string]$msg) {
    Write-Host "[VERIFY FAIL] $msg" -ForegroundColor Red
    exit 1
}

function Pass([string]$msg) {
    Write-Host "[VERIFY OK] $msg" -ForegroundColor Green
    exit 0
}

function Read-ProjectFile([string]$rel) {
    $file = Join-Path $ProjectRoot $rel
    if (-not (Test-Path $file)) { Fail "Missing $rel" }
    return Get-Content $file -Raw
}

switch ($TaskId) {
    "smoke-script" {
        $script = Join-Path $ProjectRoot "scripts\smoke_sim.mjs"
        if (-not (Test-Path $script)) { Fail "Missing scripts/smoke_sim.mjs" }
        $bytes = (Get-Item $script).Length
        if ($bytes -lt 200) { Fail "smoke_sim.mjs too small: $bytes bytes" }
        $node = Get-Command node -ErrorAction SilentlyContinue
        if (-not $node) { Fail "node not found on PATH" }
        & node $script
        $code = $LASTEXITCODE
        if ($code -ne 0) { Fail "smoke_sim.mjs exited with code $code" }
        Pass "scripts/smoke_sim.mjs exists and exit 0 ($bytes bytes)"
    }
    "telemetry-export" {
        $html = Read-ProjectFile "index.html"
        if ($html -notmatch "exportTelemetryJson") { Fail "exportTelemetryJson not in index.html" }
        if ($html -notmatch "exportTelemetryCsv") { Fail "exportTelemetryCsv not in index.html" }
        $js = Read-ProjectFile "main.js"
        if ($js -notmatch "exportTelemetryJson") { Fail "exportTelemetryJson not wired in main.js" }
        if ($js -notmatch "exportTelemetryCsv") { Fail "exportTelemetryCsv not wired in main.js" }
        if ($js -notmatch "robot-telemetry\.json") { Fail "robot-telemetry.json download name missing in main.js" }
        if ($js -notmatch "robot-telemetry\.csv") { Fail "robot-telemetry.csv download name missing in main.js" }
        if ($js -notmatch "missionTelemetry") { Fail "missionTelemetry missing from main.js" }
        Pass "telemetry JSON/CSV export buttons and download names present"
    }
    "readme-algos" {
        $readme = Read-ProjectFile "README.md"
        foreach ($name in @("Pure Pursuit", "Bug2", "DWA", "VFH", "Potential Field")) {
            if ($readme -notmatch [regex]::Escape($name)) { Fail "README.md missing algorithm: $name" }
        }
        if ($readme -notmatch "nav\.js") { Fail "README.md does not mention nav.js" }
        if ($readme -match "Random Wander") { Fail "README.md still lists Random Wander" }
        if ($readme -notmatch "robot-path-planning-sim") { Fail "README.md missing folder name robot-path-planning-sim" }
        Pass "README.md documents the five live algorithms and nav.js"
    }
    "drop-dat-gui" {
        $pkg = Read-ProjectFile "package.json"
        if ($pkg -match '"dat\.gui"') { Fail "package.json still lists dat.gui" }
        $lock = Join-Path $ProjectRoot "package-lock.json"
        if (Test-Path $lock) {
            $lockText = Get-Content $lock -Raw
            if ($lockText -match '"node_modules/dat\.gui"') { Fail "package-lock.json still contains node_modules/dat.gui" }
        }
        Pass "dat.gui removed from package.json"
    }
    "stuck-recovery-dead" {
        $js = Read-ProjectFile "main.js"
        if ($js -match "function handleStuckRecovery") { Fail "handleStuckRecovery still defined in main.js" }
        if ($js -match "const recovery = 'nav'") { Fail "animate() still hardcodes recovery = nav" }
        if ($js -notmatch "computeNavCommand") { Fail "computeNavCommand missing from main.js" }
        Pass "dead stuck recovery removed; nav command path remains"
    }
    "custom-algo-stub" {
        $custom = Join-Path $ProjectRoot "algorithms\custom.js"
        if (-not (Test-Path $custom)) { Fail "Missing algorithms/custom.js" }
        $customJs = Get-Content $custom -Raw
        if ($customJs -notmatch "computeCustomCommand") { Fail "computeCustomCommand not in algorithms/custom.js" }
        $nav = Read-ProjectFile "nav.js"
        if ($nav -notmatch "algorithms/custom") { Fail "nav.js does not import algorithms/custom.js" }
        if ($nav -notmatch "computeCustomCommand") { Fail "nav.js does not call computeCustomCommand" }
        if ($nav -notmatch "activeAlgo === 'custom'") { Fail "nav.js has no custom algorithm branch" }
        $html = Read-ProjectFile "index.html"
        if ($html -notmatch 'data-algo="custom"') { Fail "index.html missing custom algorithm button" }
        $js = Read-ProjectFile "main.js"
        if ($js -notmatch "algoCustom") { Fail "main.js missing algoCustom i18n key" }
        Pass "custom.js hook wired in nav.js, index.html, and main.js"
    }
    default { Fail "Unknown task id: $TaskId" }
}
