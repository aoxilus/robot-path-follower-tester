# Lessons Learned: The TAMU AI CLI Journey

This document records the architectural journey of the `tamu-helper-cli` project. We originally set out to build a custom PowerShell script that could act as an autonomous coding agent using the TAMUS AI Chat REST API. We ultimately pivoted to using OpenCode. Here is why.

## 1. The Custom REST Loop Approach
We initially built `tamu_helper.ps1` and `orchestrate_course.ps1` to loop through AI prompts. The idea was to ask the AI to generate HTML, then pass that HTML back to the AI to generate CSS, and finally pass both back to generate JS.

**Why it failed:**
- **Context Management is Hard:** Manually reading file contents (`index.html`) and injecting them into a JSON payload for the next prompt is fragile. If the files get too big, the JSON parsing breaks, or we hit token limits prematurely.
- **Dumb Orchestration:** The PowerShell script didn't understand code. It just blindly passed text. When the AI generated "lame" CSS that didn't match the HTML IDs, the script had no ability to catch the error.

## 2. The API Discovery
By analyzing the TAMU AI Documentation, we discovered two critical constraints:
1. **Model Whitelist:** The endpoint only accepts models prefixed with `protected.` (e.g., `protected.Claude Opus 4.6`).
2. **The $10 Quota:** The university imposes a strict $10/day API budget per user. Heavy "thinking" models processing massive context loops can exhaust this budget in minutes. The API does not currently expose headers to let a script track remaining usage.

## 3. The Pivot to OpenCode
Instead of rebuilding the wheel, we discovered that TAMUS AI Chat exposes a native Anthropic/OpenAI-compatible endpoint (`https://chat-api.tamu.ai/api`). 

This allowed us to pivot our strategy:
- We deleted our custom REST loop logic.
- We transformed `tamu_helper.ps1` into a **bootstrapper script**.
- The script now automatically installs **OpenCode** (a professional, robust AI coding CLI), injects the TAMU models into its configuration, and maps it to the user's API key.

## Conclusion
**Never reinvent the agent.** Building a REST client is easy; building an autonomous coding agent with context management, diff-parsing, and file-tree reading is hard. By wrapping OpenCode, we gained a world-class AI coding assistant perfectly integrated into the Texas A&M infrastructure with zero maintenance overhead.
