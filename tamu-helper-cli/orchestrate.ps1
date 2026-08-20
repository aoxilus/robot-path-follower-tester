<#
.SYNOPSIS
Orquestador secuencial: TAMU OpenCode ejecuta cada tarea; verificacion despues de cada una.
Si falla, solo reportar en orchestration-report.json — no parchear codigo del producto.
#>
param(
    [string]$TasksFile = (Join-Path $PSScriptRoot "tasks.json"),
    [int]$TimeoutMinutes = 15,
    [string]$FromTask = "",
    [string]$Model = "protected.gpt-5.5",
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$LogDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

$ReportPath = Join-Path $LogDir "orchestration-report.json"
$RunLog = Join-Path $LogDir ("orchestrate_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".log")
$HelperPath = Join-Path $PSScriptRoot "tamu_helper.ps1"
$VerifyScript = Join-Path $PSScriptRoot "verify-task.ps1"

function Write-RunLog([string]$msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $RunLog -Value $line
    Write-Host $line
}

function Invoke-TamuTask([string]$ProjectPath, [string]$Prompt, [string]$TamuLog, [string]$TamuErr, [int]$TimeoutMin) {
    $promptPath = Join-Path $LogDir ("prompt_live_" + [guid]::NewGuid().ToString("n") + ".txt")
    [System.IO.File]::WriteAllText($promptPath, $Prompt, [System.Text.Encoding]::UTF8)
    $arg = "-NoProfile -ExecutionPolicy Bypass -File `"$HelperPath`" -NoPrompt -ProjectPath `"$ProjectPath`" -Model `"$Model`" -PromptFile `"$promptPath`""
    $proc = Start-Process -FilePath "powershell.exe" -ArgumentList $arg `
        -RedirectStandardOutput $TamuLog -RedirectStandardError $TamuErr `
        -NoNewWindow -PassThru

    $deadline = (Get-Date).AddMinutes($TimeoutMin)
    while (-not $proc.HasExited) {
        if ((Get-Date) -gt $deadline) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            return "timeout"
        }
        Start-Sleep -Seconds 5
    }
    if ($proc.ExitCode -eq 0) { return "completed" }
    return "failed_exit_$($proc.ExitCode)"
}

function Invoke-VerifyTask([string]$TaskId, [string]$ProjectPath, [string]$VerifyOut) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $VerifyScript -TaskId $TaskId -ProjectRoot $ProjectPath *> $VerifyOut
    return $LASTEXITCODE
}

if (-not (Test-Path $TasksFile)) { throw "Missing $TasksFile" }
$config = Get-Content $TasksFile -Raw | ConvertFrom-Json
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot $config.project_path)).Path
$resultsList = [System.Collections.ArrayList]@()

Write-RunLog "=== TAMU orchestration start ==="
Write-RunLog "Project: $projectPath"
Write-RunLog "Tasks: $($config.tasks.Count)"

$startIndex = 0
if ($FromTask -ne "") {
    for ($i = 0; $i -lt $config.tasks.Count; $i++) {
        if ($config.tasks[$i].id -eq $FromTask) { $startIndex = $i; break }
    }
}

for ($i = $startIndex; $i -lt $config.tasks.Count; $i++) {
    $task = $config.tasks[$i]
    $tid = $task.id
    Write-RunLog "--- Task $($i + 1)/$($config.tasks.Count): $tid - $($task.title) ---"

    $entry = @{
        id            = $tid
        title         = $task.title
        tamu_status   = "skipped"
        verify_status = "skipped"
        tamu_log      = ""
        verify_detail = ""
        finished_at   = $null
    }

    if ($DryRun) {
        $preview = $task.prompt.Substring(0, [Math]::Min(80, $task.prompt.Length))
        Write-RunLog "[DRY RUN] Would prompt: $preview..."
        $entry.tamu_status = "dry_run"
        [void]$resultsList.Add($entry)
        continue
    }

    $tamuLog = Join-Path $LogDir ("tamu_" + $tid + ".log")
    $tamuErr = Join-Path $LogDir ("tamu_" + $tid + "_err.log")
    Write-RunLog "Dispatching to TAMU OpenCode (timeout ${TimeoutMinutes}m)..."

    $entry.tamu_status = Invoke-TamuTask -ProjectPath $projectPath -Prompt $task.prompt -TamuLog $tamuLog -TamuErr $tamuErr -TimeoutMin $TimeoutMinutes
    $entry.tamu_log = $tamuLog
    Write-RunLog "TAMU status: $($entry.tamu_status) for $tid"

    Write-RunLog "Running verify-task.ps1 -TaskId $tid ..."
    $verifyOut = Join-Path $LogDir ("verify_" + $tid + ".log")
    $verifyCode = Invoke-VerifyTask -TaskId $tid -ProjectPath $projectPath -VerifyOut $verifyOut

    if (Test-Path $verifyOut) { $entry.verify_detail = Get-Content $verifyOut -Raw }
    $entry.verify_status = if ($verifyCode -eq 0) { "pass" } else { "fail" }
    Write-RunLog "VERIFY $($entry.verify_status.ToUpper()): $tid"

    $entry.finished_at = (Get-Date).ToString("o")
    [void]$resultsList.Add($entry)

    @{
        started_at = (Get-Date).ToString("o")
        project    = $config.project
        rules      = $config.rules
        results    = $resultsList
    } | ConvertTo-Json -Depth 6 | Set-Content -Path $ReportPath -Encoding UTF8
}

$passed = @($resultsList | Where-Object { $_.verify_status -eq "pass" }).Count
$failed = @($resultsList | Where-Object { $_.verify_status -eq "fail" }).Count
$summary = "pass=$passed fail=$failed total=$($resultsList.Count)"

@{
    started_at  = (Get-Date).ToString("o")
    finished_at = (Get-Date).ToString("o")
    project     = $config.project
    rules       = $config.rules
    summary     = $summary
    results     = $resultsList
} | ConvertTo-Json -Depth 6 | Set-Content -Path $ReportPath -Encoding UTF8

Write-RunLog "=== Done. Report: $ReportPath ==="
Write-RunLog $summary
