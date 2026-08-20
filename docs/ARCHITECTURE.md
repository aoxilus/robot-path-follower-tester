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
  · Waypoints, props, pointer / drag-drop
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
| Rover hull | 2 m wide × 3 m long | Body footprint (not radar visuals) |
| `LIDAR_RANGE` | 5 | LIDAR max (m) |
| `ULTRASONIC_RANGE` | 4 | Ultrasonic max (m) |
| `IR_RANGE` | 2 | IR max (m) |
| `MAX_SPEED` | 4 | Cap linear speed (m/s) |
| `MAX_OMEGA` | 2.5 | Cap yaw rate (rad/s) |
| `HEAVY_PROP_KG` | 25 | With hit test **off**, props below this mass are pushable |

`sensorConfig`: `{ lidar, ultrasonic, ir, hitTest }` (each `0`/`1`). Hit test off skips `safetyCommand` / `dontbeWebon` and lets `applyMotion` overlap light props.

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
