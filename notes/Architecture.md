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
  · Waypoints, props, terrain-relief drawing, pointer input
  · Relief mesh + CANNON trimesh + invisible sensor walls
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
| `ROBOT_COLLISION` | 2.8×3 m footprint | Full body + wheels (excludes radar visuals) |
| `ROBOT_WIDTH` | 2.8 | Full physical width (m) |
| `LIDAR_RANGE` | 6 | Twice the largest rover footprint dimension (m) |
| `ULTRASONIC_RANGE` | 4 | Ultrasonic max (m) |
| `IR_RANGE` | 0.6 | Contact-zone IR max (m) |
| `FLOOR_IR_RANGE` | 3 | Depression-edge IR range (m) |
| `MAX_SPEED` | 4 | Cap linear speed (m/s) |
| `MAX_OMEGA` | 2.5 | Cap yaw rate (rad/s) |
| `PASS_CLEAR_MARGIN` | 0.3 | Extra clearance for “passable” poses |
| `STAMP_HEIGHT_MIN/MAX` | −5 / +5 | Depression / mountain limits |
| `STAMP_FLAT_EPS` | 0.08 | Near-zero stamp remains non-blocking |
| `MOTION_SWEEP_STEP` | 0.08 | Maximum translation between hit-tests |
| `ROTATION_SWEEP_STEP` | 0.05 | Maximum rotation between hit-tests |

Collision is fixed in world-space meters (`hitInsetMeters() = 0`), never derived from camera pixels. `applyMotion` checks every swept substep before accepting it, which prevents tunneling and visible object overlap.

## Terrain relief as choke

An extruded terrain stamp has three synchronized forms: visible Three.js relief, static CANNON triangle mesh, and invisible perimeter walls registered with `SensorSuite`. Raised walls are normal obstacle targets. Sunken walls belong to `floorTargets()` and become choke only while Floor IR is enabled; when disabled, `queryPose` also ignores negative stamps so the rover can descend. At `0 m`, the flat preview is not registered and does not block.

`stuckRecoveryCommand` is shared by every algorithm. Staying within `0.08 m` for `1.5 s` triggers reverse, a turn toward `chooseFreestHeading`, then a forward escape before normal navigation resumes.

Sensor modules are independently authoritative. LIDAR caches a 36-bin 360° scan for `0.18 s`; five parallel rays per heading form a `3 m` clearance corridor around the rover. Ultrasonic remains a forward cone, IR is limited to `0.6 m`, and the visible hit-test bumper compresses without overriding planner commands.

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
