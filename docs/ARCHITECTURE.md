# Architecture

← [Docs home](README.md) · [How it works](HOW_IT_WORKS.md)

Keep the sim **portable**: few files, `npm install && npm run dev`. Core is `index.html` + `main.js` + `nav.js` + `style.css`. Do not add an `algorithms/` folder — Custom’s default command is `defaultCustomCommand` inside `nav.js`.

Mantén el sim **portable**: pocos archivos. El núcleo es `index.html` + `main.js` + `nav.js` + `style.css`. No uses carpeta `algorithms/` — el Custom por defecto está en `nav.js`.

---

## Data flow / Flujo

```
index.html  (sensors, algo buttons, Custom pad, telemetry)
    │
    ▼
main.js
  · Three.js scene + OrbitControls
  · Rover mesh + collision footprint (queryPose)
  · Waypoints, props, terrain relief, pointer / drag-drop
  · Relief polygon → visual mesh + CANNON trimesh + sensor walls
  · animate → sensors → computeNavCommand → applyMotion
  · Telemetry + Custom JS checker / compiler
    │
    │  createNavSystem(ctx)
    ▼
nav.js
  · SensorSuite.read()     fused LIDAR / US / IR
  · safetyCommand()        choke → dontbeWebon go-around
  · computeNavCommand()    { v, omega [, skip] }
    │
    │  activeAlgo === 'custom'
    ▼
setCustomRunner(runCustomLoop)   // saved loop from localStorage
        or
defaultCustomCommand()           // built-in fallback in nav.js
```

---

## Key constants (`main.js`)

| Name | Value | Meaning |
|------|-------|---------|
| Arena | 30×30 m | Floor plane |
| `BUILD_LIMIT` | 13.5 | Playable half-extent (m) |
| `WP_ACCEPT_RADIUS` | 1.5 | Waypoint pass distance (m) |
| Rover hull | 2.8 m wide × 3 m long | Full body + wheel footprint (not radar visuals) |
| `LIDAR_RANGE` | 6 | Twice the rover’s largest footprint dimension (m) |
| `ULTRASONIC_RANGE` | 4 | Ultrasonic max (m) |
| `IR_RANGE` | 0.6 | Contact-zone IR max (m) |
| `FLOOR_IR_RANGE` | 3 | Sunken-terrain edge detection range (m) |
| `MAX_SPEED` | 4 | Cap linear speed (m/s) |
| `MAX_OMEGA` | 2.5 | Cap yaw rate (rad/s) |
| `HEAVY_PROP_KG` | 25 | With hit test **off**, props below this mass are pushable |
| `STAMP_HEIGHT_MIN/MAX` | −5 / +5 | Depression / mountain relief limits (m) |
| `STAMP_FLAT_EPS` | 0.08 | Values near zero remain a non-blocking flat preview |
| `MOTION_SWEEP_STEP` | 0.08 m | Maximum translation per collision check |
| `ROTATION_SWEEP_STEP` | 0.05 rad | Maximum rotation per collision check |

`hitInsetMeters()` now always returns `0`: collision dimensions are fixed in world meters and never depend on screen pixels. `applyMotion()` advances through swept substeps and accepts only clear intermediate poses, preventing thin props or terrain boundaries from being crossed between frames.

## Terrain relief collision flow / Flujo de colisión

`createTerrainStamp` stores the freehand polygon. `setStampHeight` rebuilds three representations:

1. **Three.js relief mesh** — visible mountain/depression with vertex color, wire grid, lighting, and shadows.
2. **CANNON trimesh** — static contact surface for dropped physics props.
3. **Invisible perimeter sensor walls** — registered through `SensorSuite.addTerrainMesh`.

Raised terrain walls are included in normal LIDAR/US/IR obstacle targets. Sunken walls are isolated in `floorTargets()` and sampled by Floor IR. `isPhysicalCollision()` checks negative walls only while Floor IR is enabled. `queryPose()` follows the same rule, so disabling Floor IR allows the rover to enter and descend into a depression. A stamp at `0 m` has no sensor walls and does not block.

`sensorConfig`: `{ lidar, ultrasonic, ir, floorIr, hitTest }` (each `0`/`1`). Hit test off removes bumper pose probes and lets `applyMotion` overlap light props; any enabled distance sensor can still invoke `safetyCommand` / `dontbeWebon`.

Sensors are independently authoritative (`sensorVotes >= 1`). LIDAR samples 36 headings every `0.18 s`; `castCorridor()` expands each heading to the rover clearance diameter (`3 m`) and reports distance from the hull rather than only from its center. Ultrasonic remains a low-cost forward cone and IR is restricted to the `0.6 m` contact zone. The visible spring bumper compresses on a blocked swept-motion step; the planner retains control of escape motion.

`stuckRecoveryCommand()` runs before `safetyCommand()` for every path algorithm. If displacement remains within `0.08 m` for `1.5 s`, it executes `reverse → look → escape`; `chooseFreestHeading()` selects the escape side from fused polar clearance.

`createNavSystem` receives `robot`, `obstacles`, `queryPose`, sensor origins, scan rays, and those constants. It returns `sensorConfig`, `sensorSuite`, `computeNavCommand`, `setCustomRunner`.

---

## Persistence

| Key | Where | Content |
|-----|--------|---------|
| `lang` | `localStorage` | `en` / `es` |
| `customLoopJs` | `localStorage` | Saved Custom `loop()` source |

---

## What stays off GitHub

| Path | Why |
|------|-----|
| `tamu-helper-cli/` | Local TAMU helper + API key |
| `docs/TAMU_*.md`, `CRITICA_TAMU.md`, `CURSOR-AGENTS.md` | Private agent notes |
| `.cursor/`, `AGENTS.md` | Local AI preferences |
