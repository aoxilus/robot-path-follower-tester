# TAMU OpenCode Bootstrapper

Copia local para **Robot Path Follower Tester**.

- **Cómo dar órdenes:** [../docs/TAMU_AI_ORDENES.md](../docs/TAMU_AI_ORDENES.md)
- **Orquestación secuencial:** [../docs/TAMU_ORCHESTRATION.md](../docs/TAMU_ORCHESTRATION.md)

Origen: `../TAMU AI/tamu-helper-cli/` · el módulo de orquestación (`orchestrate.ps1` / `verify-task.ps1`) sigue el mismo patrón que `../comfyUI/tamu-helper-cli/`.

This folder contains an automated setup script that connects Texas A&M University (TAMU) students and staff to a professional AI coding assistant using the official TAMUS AI Chat API.

Rather than building an AI script from scratch, this tool automatically installs and configures **OpenCode**, a world-class AI coding terminal.

## What this does
When you run the script, it will:
1. Ensure your TAMU API Key is securely loaded.
2. Install the OpenCode CLI (if not already installed).
3. Generate the hidden `opencode.json` configuration file, wiring it up to the `https://chat-api.tamu.ai/api` endpoint.
4. Pre-load all 33+ `protected.` TAMU models (Claude Opus, GPT-5, Gemini, etc.) into the OpenCode menu.
5. Create the `auth.json` file so OpenCode never rejects your connection with a Bearer token error.
6. Launch the OpenCode interactive terminal for you.

## Getting Started

### 1. Run the bootstrapper
Open a PowerShell terminal in this directory and run:

```powershell
.\tamu_helper.ps1
```

If it is your first time running the script, it will prompt you to paste your **TAMU AI API Key**. (You can get this from the TAMUS AI Chat web interface).

### 2. Connect in OpenCode
Once the script launches OpenCode, type:

```text
/connect
```
- Select **TAMU Chat API** from the provider list.
- Select your preferred model (e.g., `Claude Opus 4.6` or `GPT-5.4`).

### 3. Start Coding
You can now ask OpenCode to generate entire projects, debug code, or build websites. It will autonomously read and write files in this directory.

*Note: TAMU imposes a daily $10.00 quota. If you hit this limit, the AI will stop working until 6:00 PM Central Time. Use smaller models (like Claude Haiku) for long coding sessions to save tokens!*

## Orchestration (same as ComfyUI)

```powershell
.\orchestrate.ps1              # sequential tasks from tasks.json
.\verify-task.ps1 -TaskId smoke-script
.\orchestrate.ps1 -DryRun
```

From the repo root:

```bat
run-tamu-orchestrate.bat
```

---
*For more information on why we built this wrapper instead of a custom agent, see [lessons_learned.md](lessons_learned.md).*
