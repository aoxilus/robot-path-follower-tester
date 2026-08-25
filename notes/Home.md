# Wiki — Robot Path Follower Tester

Public project documentation also lives in **[docs/HOW_IT_WORKS.md](../docs/HOW_IT_WORKS.md)**. This `notes/` wiki is extra API detail. Local TAMU / agent files under `docs/TAMU_*.md` stay gitignored.

## Contents

| Page | What it covers |
|------|----------------|
| [Physics](Physics.md) | cannon-es traps: gravity, rolling, why knocks looked robotic |
| [How to use](How-to-use.md) | Quick start, UI, mission loop, sensors, algorithms |
| [Architecture](Architecture.md) | File map, constants, data flow |
| [API — main.js](API-main.md) | Scene, physics, input, mission, Custom pad, telemetry |
| [API — nav.js](API-nav.md) | `SensorSuite`, safety layer, all path algorithms |
| [Custom JS](Custom-JS.md) | Writable `loop()`, allowed vars, checker rules |

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:5173/**

## Core files

```
index.html              UI (3 columns, Custom pad, telemetry)
main.js                 Scene, rover, mission, telemetry, Custom checker
nav.js                  Sensors + algorithms + local go-around
style.css               Layout
scripts/smoke_sim.mjs   Smoke test
notes/                  This wiki (public)
docs/                   Local-only AI / TAMU notes (not on GitHub)
```
