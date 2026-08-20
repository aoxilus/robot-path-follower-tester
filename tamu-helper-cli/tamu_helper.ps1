<#
.SYNOPSIS
Bootstrap script for OpenCode using the TAMUS AI Chat API.

.DESCRIPTION
This script will check if OpenCode is installed, install it via winget if missing,
ensure your API key is in the .env file, configure OpenCode to use the TAMUS AI models,
inject your authentication token, and launch the OpenCode terminal.
#>
param(
    [switch]$NoPrompt = $false,
    [string]$Prompt = "",
    [switch]$AsJob = $false,
    [int]$CheckIntervalMinutes = 5,
    [string]$ProjectPath = "",
    [string]$ReturnDataAs = "",
    [string]$Model = "protected.gpt-5.5",
    [string]$PromptFile = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($PromptFile -ne "" -and (Test-Path $PromptFile)) {
    $Prompt = Get-Content -Path $PromptFile -Raw
}

# ── Logging Setup ─────────────────────────────────────────────────────────────
$LogDir  = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$LogPath = Join-Path $LogDir ("tamu_opencode_bootstrap_" + $PID + ".log")

function Write-Log {
    param([string]$Message, [string]$Level = "Info")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] [$Level] $Message"
    [System.IO.File]::AppendAllText($LogPath, $logLine + [Environment]::NewLine)
}

function Test-TamuCredits {
    param([string]$key)
    Write-Log "Checking TAMU API budget and credits..."
    
    $headers = @{
        "Authorization" = "Bearer $key"
        "Content-Type" = "application/json"
        "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    $body = @{
        model = "protected.Claude Sonnet 4"
        messages = @(
            @{ role = "user"; content = "hi" }
        )
        temperature = 0.1
        max_tokens = 5
    } | ConvertTo-Json
    
    try {
        $res = Invoke-RestMethod -Uri "https://chat-api.tamu.ai/api/v1/chat/completions" -Method Post -Headers $headers -Body $body -ErrorAction Stop
        
        $resText = ""
        if ($res -is [string]) {
            $resText = $res
        } else {
            $resText = ConvertTo-Json $res -Depth 5
        }
        
        if ($resText -like "*Budget Exceeded*" -or $resText -like "*out of credits*" -or $resText -like "*budget*") {
            Write-Host "`n❌ Error: TAMU AI API Budget Exceeded or Out of Credits!" -ForegroundColor Red
            Write-Host "Response details: $resText" -ForegroundColor Yellow
            Write-Log "Budget error found in response: $resText"
            return $false
        }
        
        Write-Log "Credits verified successfully."
        return $true
    } catch {
        $errMsg = $_.Exception.Message
        Write-Log "Error during credit test: $errMsg"
        
        if ($_.Exception.Response -ne $null) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Log "Error response body: $responseBody"
            
            if ($responseBody -like "*Budget Exceeded*" -or $responseBody -like "*out of credits*") {
                Write-Host "`n❌ Error: TAMU AI API Budget Exceeded or Out of Credits!" -ForegroundColor Red
                Write-Host "Response details: $responseBody" -ForegroundColor Yellow
                return $false
            }
        }
        
        Write-Host "⚠️ Warning during credit check: $errMsg" -ForegroundColor Yellow
        return $true
    }
}

Write-Log "Starting TAMU OpenCode Bootstrapper..."
Write-Log "Model: $Model"

# ── Load or Create .env ───────────────────────────────────────────────────────
$envFile = Join-Path $PSScriptRoot ".env"
$apiKey  = $null

if (Test-Path $envFile) {
    Write-Log "Reading .env file."
    $content = Get-Content $envFile
    foreach ($line in $content) {
        if ($line -match "^TAMU_API_KEY=(.*)") {
            $apiKey = $matches[1].Trim()
        }
    }
}

if (-not $apiKey -or $apiKey -eq "your_key_here") {
    if ($NoPrompt) {
        Write-Error "Error: TAMU_API_KEY is missing or invalid, and NoPrompt is set. Exiting."
    }
    Write-Host "Warning: No TAMU AI API Key found." -ForegroundColor Yellow
    $response = Read-Host "Would you like to enter your TAMU AI API key now? (Y/N)"
    if ($response -match "^[Yy]" -or $response -eq "") {
        $newKey = Read-Host "Please paste your TAMU AI API key"
        if ($newKey) {
            $apiKey = $newKey.Trim()
            $defaultContent = @(
                "# TAMU AI API Configuration",
                "TAMU_API_KEY=$apiKey",
                "TAMU_API_BASE=https://chat-api.tamu.ai/api"
            )
            [System.IO.File]::WriteAllText($envFile, ($defaultContent -join "`r`n"), [System.Text.Encoding]::UTF8)
            Write-Host "API key saved to .env file." -ForegroundColor Green
            Write-Log "API key saved successfully."
        } else {
            Write-Error "No API key provided. Exiting."
        }
    } else {
        Write-Error "TAMU_API_KEY is required. Exiting."
    }
}

# ── Verify Credits/Budget ──────────────────────────────────────────────────────
if (-not (Test-TamuCredits -key $apiKey)) {
    Write-Error "Terminating due to credit/budget issues."
}

# ── Check and Install OpenCode ────────────────────────────────────────────────
try {
    $null = Get-Command opencode -ErrorAction Stop
    Write-Host "OpenCode is already installed." -ForegroundColor Green
    Write-Log "OpenCode is installed."
} catch {
    Write-Host "OpenCode is not installed. Installing via winget..." -ForegroundColor Cyan
    Write-Log "Installing OpenCode via winget."
    try {
        Start-Process -FilePath "winget" -ArgumentList "install SST.opencode --accept-package-agreements --accept-source-agreements" -Wait -NoNewWindow
        Write-Host "OpenCode installation complete." -ForegroundColor Green
        # Refresh env so opencode is found
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } catch {
        Write-Error "Failed to install OpenCode. Please install it manually using 'winget install SST.opencode'."
    }
}

# ── Configure OpenCode Directories ────────────────────────────────────────────
Write-Host "Configuring OpenCode for TAMUS AI Chat..." -ForegroundColor Cyan
$configDir = Join-Path $env:USERPROFILE ".config\opencode"
$authDir   = Join-Path $env:USERPROFILE ".local\share\opencode"

if (-not (Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir -Force | Out-Null }
if (-not (Test-Path $authDir))   { New-Item -ItemType Directory -Path $authDir   -Force | Out-Null }

# ── Generate opencode.json ────────────────────────────────────────────────────
$opencodeJsonPath = Join-Path $configDir "opencode.json"
$opencodeJsonContent = @"
{
  "`$schema": "https://opencode.ai/config.json",
  "provider": {
    "chat.tamu.ai": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "TAMUS AI Chat API",
      "options": {
        "baseURL": "https://chat-api.tamu.ai/api"
      },
      "models": {
        "protected.Claude 3.5 Haiku": { "name": "Claude 3.5 Haiku" },
        "protected.Claude Opus 4.1": { "name": "Claude Opus 4.1" },
        "protected.Claude Opus 4.5": { "name": "Claude Opus 4.5" },
        "protected.Claude Opus 4.6": { "name": "Claude Opus 4.6" },
        "protected.Claude Opus 4.7": { "name": "Claude Opus 4.7" },
        "protected.Claude Opus 4.8": { "name": "Claude Opus 4.8" },
        "protected.Claude Sonnet 4": { "name": "Claude Sonnet 4" },
        "protected.Claude Sonnet 4.5": { "name": "Claude Sonnet 4.5" },
        "protected.Claude Sonnet 4.6": { "name": "Claude Sonnet 4.6" },
        "protected.Claude-Haiku-4.5": { "name": "Claude Haiku 4.5" },
        "protected.gemini-2.5-flash": { "name": "Gemini 2.5 Flash" },
        "protected.gemini-2.5-flash-lite": { "name": "Gemini 2.5 Flash Lite" },
        "protected.gemini-2.5-pro": { "name": "Gemini 2.5 Pro" },
        "protected.gemini-3.1-flash-lite": { "name": "Gemini 3.1 Flash Lite" },
        "protected.gemini-3.5-flash": { "name": "Gemini 3.5 Flash" },
        "protected.gpt-4.1": { "name": "GPT-4.1" },
        "protected.gpt-4.1-mini": { "name": "GPT-4.1 Mini" },
        "protected.gpt-4.1-nano": { "name": "GPT-4.1 Nano" },
        "protected.gpt-4o": { "name": "GPT-4o" },
        "protected.gpt-5": { "name": "GPT-5" },
        "protected.gpt-5.1": { "name": "GPT-5.1" },
        "protected.gpt-5.2": { "name": "GPT-5.2" },
        "protected.gpt-5.4": { "name": "GPT-5.4" },
        "protected.gpt-5.4-mini": { "name": "GPT-5.4 Mini" },
        "protected.gpt-5.4-nano": { "name": "GPT-5.4 Nano" },
        "protected.gpt-5.5": { "name": "GPT-5.5" },
        "protected.gpt-5-mini": { "name": "GPT-5 Mini" },
        "protected.gpt-5-nano": { "name": "GPT-5 Nano" },
        "protected.llama3.2": { "name": "Llama 3.2" },
        "protected.o3": { "name": "o3" },
        "protected.o3-mini": { "name": "o3-mini" },
        "protected.o4-mini": { "name": "o4-mini" },
        "protected.text-embedding-3-small": { "name": "Text Embedding 3 Small" }
      }
    }
  },
  "model": "chat.tamu.ai/$Model"
}
"@
[System.IO.File]::WriteAllText($opencodeJsonPath, $opencodeJsonContent, [System.Text.Encoding]::UTF8)

# ── Generate auth.json ────────────────────────────────────────────────────────
$authJsonPath = Join-Path $authDir "auth.json"
$authJsonContent = @"
{
  "chat.tamu.ai": {
    "type": "api",
    "key": "$apiKey"
  }
}
"@
[System.IO.File]::WriteAllText($authJsonPath, $authJsonContent, [System.Text.Encoding]::UTF8)

Write-Host "Configuration written successfully." -ForegroundColor Green
Write-Log "Bootstrapping complete. Launching OpenCode."

if ($ReturnDataAs -and $Prompt) {
    Write-Log "Applying output format constraints: $ReturnDataAs"
    if ($ReturnDataAs -match "\.[a-zA-Z0-9]+$") {
        $Prompt = "$Prompt. Please write the output exactly into a file named '$ReturnDataAs'."
    } else {
        $Prompt = "$Prompt. Please format the output strictly as $ReturnDataAs."
    }
}

# ── Launch OpenCode ───────────────────────────────────────────────────────────
Write-Host "========================================================" -ForegroundColor Magenta
Write-Host "🚀 Launching OpenCode CLI..." -ForegroundColor Magenta
Write-Host "   Type '/connect' to select the TAMU Chat API." -ForegroundColor Cyan
Write-Host "   Then type your prompt!" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Magenta

if ($ProjectPath) {
    if (-not (Test-Path $ProjectPath)) {
        New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
    }
    $ProjectPath = (Get-Item $ProjectPath).FullName
    Write-Log "Target project path configured: $ProjectPath"
}

if ($Prompt) {
    $modelId = $Model
    if ($Model -notlike "chat.tamu.ai/*") {
        $modelId = "chat.tamu.ai/$Model"
    }
    $runArgs = @("run", "-m", $modelId, "--auto")
    if ($ProjectPath) {
        $runArgs += @("--dir", $ProjectPath)
    }
    $runArgs += @("--title", "TAMU GPT-5.5 task")
    $runArgs += @($Prompt)

    if ($AsJob) {
        Write-Host "Launching OpenCode task in the background..." -ForegroundColor Magenta
        Write-Log "Launching background job: opencode run -m $modelId --auto"
        
        $job = Start-Job -ScriptBlock {
            param($argsList)
            & opencode @argsList
        } -ArgumentList @(, $runArgs)
        
        Write-Host "Task is running in parallel. Job ID: $($job.Id)" -ForegroundColor Cyan
        Write-Host "We will check status in $CheckIntervalMinutes minute(s)..." -ForegroundColor Cyan
        
        $totalSeconds = $CheckIntervalMinutes * 60
        $elapsed = 0
        $completed = $false
        
        while ($elapsed -lt $totalSeconds) {
            Start-Sleep -Seconds 10
            $elapsed += 10
            
            $jobState = Get-Job -Id $job.Id
            if ($jobState.State -ne "Running") {
                $completed = $true
                break
            }
            
            $percent = [Math]::Round(($elapsed / $totalSeconds) * 100)
            Write-Host "Checking Job status: $($jobState.State) ($percent% time elapsed... - elapsed $elapsed seconds)" -ForegroundColor Gray
        }
        
        $finalJob = Get-Job -Id $job.Id
        if ($completed -or $finalJob.State -ne "Running") {
            Write-Host "Task finished with state: $($finalJob.State)" -ForegroundColor Green
            $output = Receive-Job -Job $finalJob
            Write-Host "Output details:" -ForegroundColor Cyan
            Write-Host $output
        } else {
            Write-Host "Task is still running after $CheckIntervalMinutes minutes." -ForegroundColor Yellow
            Write-Host "You can query it manually using: Receive-Job -Id $($job.Id)" -ForegroundColor Cyan
        }
    } else {
        Write-Log "Launching: opencode run -m $modelId --auto"
        & opencode @runArgs
    }
} else {
    if ($ProjectPath) {
        opencode $ProjectPath
    } else {
        opencode
    }
}
