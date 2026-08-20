# How the sim works / Cómo funciona

Robot Path Follower Tester is a **browser sandbox** for 4-wheel path following. No ROS, no Gazebo.

Este proyecto es un **sandbox en el navegador** para seguimiento de ruta en un robot de 4 ruedas. Sin ROS ni Gazebo.

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build
node scripts/smoke_sim.mjs
```

Toggle **EN / ES** at the top of the left panel.

More detail: [Architecture](ARCHITECTURE.md) · [Custom JS](CUSTOM_JS.md)

---

## Layout / Interfaz

Three columns / Tres columnas:

| Panel | What it does / Qué hace |
|-------|-------------------------|
| **Left** | Sensors, path algorithm, Start / Reset, waypoint vs object mode |
| **Center** | 3D arena (30×30 m). Short floor click = waypoint. Drag = camera |
| **Right** | Drag spheres / cubes / cylinders + telemetry log |

---

## Mission loop / Ciclo de misión

1. Place waypoints on the floor (rover pose = start).
2. Pick an algorithm. Optionally enable LIDAR, ultrasonic, and/or 3× IR.
3. **Start** — the rover drives waypoint to waypoint.
4. A waypoint counts as **passed** when the rover is within ~1.5 m (`WP_ACCEPT_RADIUS`).
5. If a waypoint cannot be reached after two go-around circuits, it is **skipped** (purple) and the mission continues.

1. Coloca waypoints en el suelo (la pose del rover es el inicio).
2. Elige un algoritmo. Activa LIDAR, ultrasónico y/o 3× IR si quieres.
3. **Iniciar** — el rover recorre waypoint por waypoint.
4. Un waypoint se **pasa** si el rover entra al radio de aceptación (~1.5 m).
5. Si no se puede alcanzar tras dos rodeos, se **omite** (morado) y la misión sigue.

**Interaction / Interacción**

- **Waypoints** — short click on the floor to add; hold+drag the rover to move it.
- **Objects** — drag from the right palette onto the scene.
- **Move objects** — checkbox: drag props only (rover and waypoints disabled).

---

## Sensors / Sensores

Algorithms share one fused reading in `nav.js`. If a sensor is off, that channel is ignored. Physical collision still uses the rover footprint (`queryPose`), not only rays.

Los algoritmos comparten una lectura fusionada en `nav.js`. Si un sensor está apagado, ese canal no cuenta. La colisión física sigue usando la huella del rover (`queryPose`).

| Sensor | Range | Role / Rol |
|--------|-------|------------|
| **LIDAR** | 5 m | 360° scan (36 bins), rays on top of the rover |
| **Ultrasonic** | 4 m | Front cone (−0.35, 0, +0.35 rad) |
| **IR ×3** | 2 m | Short bumper rays left / center / right |

---

## Algorithms / Algoritmos

All five built-in modes plus Custom live in **`nav.js`**. There is no `algorithms/` folder.

Los cinco modos y Custom viven en **`nav.js`**. No hay carpeta `algorithms/`.

Every mode first hits a **local safety layer** (`safetyCommand` / `dontbeWebon`): if the path ahead is choked, the rover backs off or turns and **goes around** instead of spinning in place. Then the selected algorithm commands `v` (m/s) and `omega` (rad/s).

Todos pasan primero por una **capa de seguridad local**: si el frente está tapado, el rover retrocede o gira y **rodea** el obstáculo. Después el algoritmo manda `v` y `omega`.

| Mode | Id | Idea |
|------|-----|------|
| Pure Pursuit | `pure_pursuit` | Steer toward the waypoint; slow if the front is tight |
| Bug2 | `bug2` | Follow the M-line to the goal; trace the boundary when blocked |
| DWA | `dwa` | Sample short `(v, ω)` candidates and pick a safe command |
| VFH | `vfh` | Steer through the clearest polar-histogram sector |
| Potential Field | `potential_field` | Attract to the waypoint, repel from nearby hits |
| Custom | `custom` | Your `loop()` in the JS pad — [CUSTOM_JS.md](CUSTOM_JS.md) |

If Custom has no saved loop, `nav.js` uses `defaultCustomCommand` (`v = 0.60 · MAX_SPEED`, `omega` from heading error).

---

## Telemetry / Telemetría

Every ~2 s the log records pose, waypoint, command, sensors, and nearby objects.

Cada ~2 s el log guarda pose, waypoint, comando, sensores y objetos cercanos.

- **Copy** — visible log text
- **Export JSON** → `robot-telemetry.json`
- **Export CSV** → `robot-telemetry.csv`
- Browser console: `window.missionTelemetry`

---

## Physics / Física

- **Rover** — kinematic: `applyMotion` integrates `v` / `omega` and refuses translation that overlaps an obstacle.
- **Dropped props** — dynamic `cannon-es` bodies the rover can push.
- Teaching sandbox, not a validated differential-drive plant model.

- **Rover** — cinemático: `applyMotion` integra `v` / `omega` y no traduce si hay solape.
- **Objetos soltados** — cuerpos dinámicos `cannon-es`.
- Sandbox didáctico, no un modelo validado de planta diferencial.

---

## Source map / Archivos

```
index.html              UI (3 columns, Custom pad, telemetry)
main.js                 Scene, rover, input, i18n, mission, telemetry, Custom checker
nav.js                  Sensors + all algorithms + go-around
style.css               Layout
scripts/smoke_sim.mjs   Smoke test (file presence + algorithm ids)
docs/                   This documentation + README screenshot
notes/                  Extra public wiki (API pages)
```

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build
node scripts/smoke_sim.mjs
```
