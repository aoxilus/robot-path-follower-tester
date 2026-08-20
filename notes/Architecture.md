# Architecture

← [Home](Home.md)

## Design rule

Keep the sim **portable**: few files, `npm run dev` and done. Core is `main.js` + `nav.js` + `index.html` + `style.css`. Split into many modules only if asked.

## Data flow

```
index.html (UI buttons / sensors / Custom pad)
    │
    ▼
main.js
  · Three.js scene + OrbitControls
  · Rover mesh + collision footprint
  · Waypoints, props, pointer input
  · Mission loop (animate → sensors → nav → applyMotion)
  · Telemetry + Custom JS checker
    │
    │  createNavSystem(ctx)
    ▼
nav.js
  · SensorSuite.read()  → fused reading
  · safetyCommand()     → go-around / skip
  · computeNavCommand() → { v, omega }
    │
    │  (algo === 'custom')
    ▼
nav.js defaultCustomCommand  OR  compiled loop from localStorage
```

## Key constants (`main.js`)

| Name | Value | Meaning |
|------|-------|---------|
| `PLANE_SIZE` | 30 | Arena side length (m) |
| `BUILD_LIMIT` | 13.5 | Playable half-extent (±) |
| `WP_ACCEPT_RADIUS` | 1.5 | Waypoint pass distance (m) |
| `ROBOT_COLLISION` | 2×3 m footprint | Body hull (excludes radar visuals) |
| `ROBOT_WIDTH` | 2 | Full body width (m) |
| `LIDAR_RANGE` | 5 | LIDAR max (m) |
| `ULTRASONIC_RANGE` | 4 | Ultrasonic max (m) |
| `IR_RANGE` | 2 | IR max (m) |
| `MAX_SPEED` | 4 | Cap linear speed (m/s) |
| `MAX_OMEGA` | 2.5 | Cap yaw rate (rad/s) |
| `PASS_CLEAR_MARGIN` | 0.3 | Extra clearance for “passable” poses |

## Context passed into `createNavSystem`

`main.js` injects: `robot`, `obstacles`, `getRobotCollisionBox`, `getRobotSensorOrigin`, `queryPose`, `scanRays`, `scanRaysCount`, collision/sensor constants, `MAX_SPEED`, `MAX_OMEGA`, `PASS_CLEAR_MARGIN`, `WP_ACCEPT_RADIUS`.

## What `createNavSystem` returns

| Export | Role |
|--------|------|
| `sensorConfig` | `{ lidar, ultrasonic, ir }` toggles (0/1) |
| `sensorSuite` | `SensorSuite` instance |
| `computeNavCommand` | `(algo, target, reading, navState, missionStart) → { v, omega, … }` |
| `setCustomRunner` | Register Custom loop runner |
| `WP_ACCEPT_RADIUS` | Echo of accept radius |

## Persistence

| Key | Storage | Content |
|-----|---------|---------|
| `lang` | `localStorage` | `en` / `es` |
| `customLoopJs` | `localStorage` | Saved Custom `loop()` source |

## Public vs private docs

| Folder | GitHub? | Purpose |
|--------|---------|---------|
| `notes/` | Yes | This wiki — how to use + API |
| `docs/` | No (gitignored) | Cursor / TAMU / private agent notes |
| `AGENTS.md`, `.cursor/` | No | Local AI agent instructions |
| `tamu-helper-cli/` | No | Local TAMU orchestration |
