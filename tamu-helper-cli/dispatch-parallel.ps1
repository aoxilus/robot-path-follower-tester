<#
.SYNOPSIS
Launch selected TAMU tasks in parallel (disjoint files) using GPT-5.5.
#>
param(
    [string[]]$TaskIds = @("smoke-script", "readme-algos", "drop-dat-gui"),
    [string]$Model = "protected.gpt-5.5"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$cli = $PSScriptRoot
$tasksFile = Join-Path $cli "tasks.json"
$logDir = Join-Path $cli "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

$cfg = Get-Content $tasksFile -Raw | ConvertFrom-Json
$projectPath = (Resolve-Path (Join-Path $cli $cfg.project_path)).Path
$helper = Join-Path $cli "tamu_helper.ps1"

foreach ($id in $TaskIds) {
    $task = $cfg.tasks | Where-Object { $_.id -eq $id } | Select-Object -First 1
    if (-not $task) { throw "Unknown task id: $id" }

    $promptPath = Join-Path $logDir ("prompt_" + $id + ".txt")
    $outPath = Join-Path $logDir ("tamu_" + $id + ".log")
    $errPath = Join-Path $logDir ("tamu_" + $id + "_err.log")
    [System.IO.File]::WriteAllText($promptPath, [string]$task.prompt, [System.Text.Encoding]::UTF8)

    Write-Host "Dispatch TAMU $id ($($task.title)) model=$Model" -ForegroundColor Cyan
    $arg = "-NoProfile -ExecutionPolicy Bypass -File `"$helper`" -NoPrompt -ProjectPath `"$projectPath`" -Model `"$Model`" -PromptFile `"$promptPath`""
    Start-Process -FilePath "powershell.exe" -ArgumentList $arg `
        -RedirectStandardOutput $outPath -RedirectStandardError $errPath -WindowStyle Hidden
}

Write-Host "Launched $($TaskIds.Count) TAMU GPT-5.5 jobs. Logs: $logDir"
