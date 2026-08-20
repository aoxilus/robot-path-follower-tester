# How the sim works / Cómo funciona

Robot Path Follower Tester is a **browser sandbox** for 4-wheel path following. No ROS, no Gazebo: `npm install && npm run dev`, then open **http://localhost:5173/**.

Este proyecto es un **sandbox en el navegador** para seguimiento de ruta en un robot de 4 ruedas. Sin ROS ni Gazebo: `npm install && npm run dev` y abre **http://localhost:5173/**.

---

## Layout / Interfaz

Three columns / Tres columnas:

| Panel | What it does / Qué hace |
|-------|-------------------------|
| **Left** | Sensors, path algorithm, Start / Reset, waypoint vs object mode |
| **Center** | 3D arena (30×30 m). Floor click = waypoint. Drag = camera |
| **Right** | Drag spheres / cubes / cylinders onto the floor + telemetry log |

Toggle **EN / ES** at the top of the left panel.

---

## Mission loop / Ciclo de misión

1. Place waypoints on the floor (rover pose = start).
2. Pick an algorithm. Optionally enable LIDAR, ultrasonic, and/or 3× IR.
3. **Start** — the rover drives waypoint to waypoint.
4. A waypoint counts as **passed** when the rover is within the accept radius (~1.5 m).
5. If a waypoint cannot be reached after going around twice, it is **skipped** (marked purple) and the mission continues.

1. Coloca waypoints en el suelo (la pose del rover es el inicio).
2. Elige un algoritmo. Activa LIDAR, ultrasónico y/o 3× IR si quieres.
3. **Iniciar** — el rover recorre waypoint por waypoint.
4. Un waypoint se **pasa** si el rover entra al radio de aceptación (~1.5 m).
5. Si no se puede alcanzar tras rodear dos veces, se **omite** (morado) y la misión sigue.

---

## Sensors / Sensores

Algorithms share one fused reading (`nav.js`):

| Sensor | Role / Rol |
|--------|------------|
| **LIDAR** | 360° scan, 5 m. Drawn as rays on top of the rover |
| **Ultrasonic** | Front cone, 4 m |
| **IR ×3** | Short bumper rays (left / center / right), 2 m |

If a sensor is off, that channel is ignored. Collision with cones and props still uses the rover footprint (`queryPose`), not only rays.

Si un sensor está apagado, ese canal no cuenta. La colisión con conos y objetos sigue usando la huella del rover (`queryPose`), no solo los rayos.

---

## Algorithms / Algoritmos

All modes first pass a **local safety layer**: if the path ahead is choked, the rover backs off or turns and **goes around** the obstacle instead of spinning in place. After that, the selected algorithm commands `v` (speed) and `omega` (yaw rate).

Todos los modos pasan primero por una **capa de seguridad local**: si el frente está tapado, el rover retrocede o gira y **rodea** el obstáculo en lugar de girar quieto. Después, el algoritmo elegido manda `v` (velocidad) y `omega` (guiñada).

| Mode | Idea |
|------|------|
| **Pure Pursuit** | Steer toward the current waypoint; slow down if the front is tight |
| **Bug2** | Track the M-line to the goal; follow the obstacle boundary when blocked |
| **DWA** | Sample short `(v, ω)` candidates and pick a safe forward command |
| **VFH** | Steer through the clearest sector of the polar histogram |
| **Potential Field** | Attract to the waypoint, repel from nearby hits |
| **Custom** | Your `loop()` in the JS pad — see below |

---

## Custom JS pad / Bloc Custom

Choosing **Custom** opens two editors on the 3D view:

1. **`void setup` (read-only)** — robot variables and the expected loop shape. **Copy** this and paste it to an AI so it can write a loop.
2. **`loop()` (editable)** — assign `v` and `omega`. **Check** then **Save**.

Allowed: robot inputs (`robotX`, `headingErr`, `lidar`, …), `Math`, and `draw(x, z)` marks on the floor.

Blocked: `alert`, `new`, object literals `{}`, `function` / `return`, `document`, `window`, `eval`, and unknown names.

Saved loops stay in `localStorage` (`customLoopJs`).

---

## Telemetry / Telemetría

Every 2 s the log records pose, waypoint, command, sensors, and nearby objects. You can:

- **Copy** the visible log
- **Export JSON** → `robot-telemetry.json`
- **Export CSV** → `robot-telemetry.csv`

Samples also live on `window.missionTelemetry` in the browser console.

---

## Physics / Física

- **Rover** — kinematic: `applyMotion` integrates `v` / `omega` and refuses translation that overlaps an obstacle.
- **Dropped props** — dynamic `cannon-es` bodies the rover can push.
- This is a **visual / teaching** sandbox, not a validated differential-drive plant model.

- **Rover** — cinemático: `applyMotion` integra `v` / `omega` y no traduce si hay solape.
- **Objetos soltados** — cuerpos dinámicos `cannon-es` que el rover puede empujar.
- Es un sandbox **visual / didáctico**, no un modelo validado de planta diferencial.

---

## Source map / Archivos

```
index.html              UI (3 columns, Custom pad, telemetry buttons)
main.js                 Scene, robot, input, i18n, mission, telemetry, Custom checker
nav.js                  Sensors + algorithms + local go-around
algorithms/custom.js    Default Custom command if no saved loop
style.css               Layout
scripts/smoke_sim.mjs   `node scripts/smoke_sim.mjs` — file / algo id smoke test
docs/screenshot.png     README preview
docs/HOW_IT_WORKS.md    This file
```

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build
node scripts/smoke_sim.mjs
```
