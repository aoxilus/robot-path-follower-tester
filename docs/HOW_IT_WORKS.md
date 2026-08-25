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
| **Right** | Drag spheres / cubes / cylinders, **✏️ draw terrain**, telemetry log |

---

## Mission loop / Ciclo de misión

1. Place waypoints on the floor (rover pose = start).
2. Pick an algorithm. Optionally enable LIDAR, ultrasonic, and/or 3× IR.
3. **Start** — the rover drives waypoint to waypoint.
4. A waypoint counts as **passed** when the rover center is within ~1.5 m (`WP_ACCEPT_RADIUS`), or — with **Spring bumper / hit test on** — when any part of the rover footprint touches the waypoint (center tip not required).
5. If a waypoint cannot be reached after two go-around circuits, it is **skipped** (purple) and the mission continues.

1. Coloca waypoints en el suelo (la pose del rover es el inicio).
2. Elige un algoritmo. Activa LIDAR, ultrasónico y/o 3× IR si quieres.
3. **Iniciar** — el rover recorre waypoint por waypoint.
4. Un waypoint se **pasa** si el centro entra al radio (~1.5 m), o — con **hit test / parachoques on** — si cualquier parte del footprint toca el punto (no hace falta la punta central).
5. Si no se puede alcanzar tras dos rodeos, se **omite** (morado) y la misión sigue.

**Interaction / Interacción**

- **Waypoints** — short click on the floor to add; hold+drag the rover to move it.
- **Objects** — drag from the right palette onto the scene. Click a prop to select it; **Weight** and **Scale** sliders edit the selection (or set defaults for the next drop).
- **Move objects** — checkbox: camera orbit/zoom locked; drag cones and props only.
- **Draw shape (✏️)** — right panel. Drag on the floor to outline a polygon (concave loops are kept). It sits **flat** in the plane. Select it, then use **Extrude**: **↑ raises a mountain** and **↓ sinks a depression** that follows your outline.

### Terrain relief as a choke object / Relieve como objeto de bloqueo

Once its Extrude value is different from `0`, a drawn terrain shape follows the same navigation rules as scene obstacles:

- Raised-shape perimeter walls participate in **LIDAR, ultrasonic, and IR raycasts**; sunken walls are reserved for Floor IR.
- The fused reading can set `blocked = 1`, activating `safetyCommand` / `dontbeWebon`.
- **Hit test** and `queryPose` treat polygon overlap as a collision.
- `applyMotion` cannot cross the relief boundary; the rover must plan around it.
- At `0 m` the stamp is only a flat editing preview and does **not** block navigation.

Cuando Extrude es diferente de `0`, la forma dibujada usa las mismas reglas de navegación que los obstáculos:

- El perímetro de una forma elevada participa en **LIDAR, ultrasónico e IR**; el perímetro hundido queda reservado para IR de piso.
- La lectura fusionada puede activar `blocked = 1` y la maniobra de rodeo.
- **Hit test** y `queryPose` detectan el solape con el polígono.
- `applyMotion` no cruza el borde; el rover debe rodear la forma.
- En `0 m` es solo una previsualización plana y no bloquea.

---

## Sensors / Sensores

Algorithms share one fused reading in `nav.js`. If a ray sensor is off, that channel is ignored.

Los algoritmos comparten una lectura fusionada en `nav.js`. Si un sensor de rayos está apagado, ese canal no cuenta.

| Sensor | Range | Role / Rol |
|--------|-------|------------|
| **LIDAR** | 6 m | Slower 360° scan (36 bins, refreshed every 0.18 s). Range is twice the rover’s largest 3 m footprint dimension; each heading checks a 3 m-wide hull corridor |
| **Ultrasonic** | 4 m | Low-cost front cone (−0.35, 0, +0.35 rad) |
| **IR ×3** | 0.6 m | Very short contact-zone rays left / center / right |
| **Floor IR ×3** | 3 m | **Off by default** (4×4 into holes). **On:** detect depression edges and route around. |
| **Spring bumper** | contact | Visible orange front bar compresses on hit. Navigation keeps escape control. **Off:** push light props. |

Verified in-sim: path algorithms + go-around work with hit test on; with hit test off the rover can shove boxes/spheres/cylinders.

Comprobado en el sim: los algoritmos y el rodear funcionan con hit test on; con hit test off el rover empuja objetos ligeros.

Every checkbox is an independent module: LIDAR alone, ultrasonic alone, IR alone, or Floor IR alone can request avoidance. No sensor needs a second sensor vote to be obeyed.

**Floor IR / IR de piso:** encendido detecta el borde de una depresión hundida y la convierte en choke; apagado permite que el rover entre y baje dentro del hueco.

### Stuck recovery / Recuperación de atasco

Navigation watches rover displacement in world meters. If it remains within `0.08 m` of the same position for `1.5 s`, every algorithm temporarily runs:

1. **Reverse** for `0.75 s`.
2. **Look** by turning toward the clearest direction from the fused polar scan.
3. **Escape** forward on that side, then resume the selected path algorithm.

La recuperación reemplaza el umbral visual de “±5 px” por un umbral estable de `0.08 m`, independiente de cámara o resolución.

---

## Algorithms / Algoritmos

Three mainstream built-in modes plus Custom live in **`nav.js`**. There is no `algorithms/` folder.

Tres modos mainstream y Custom viven en **`nav.js`**. No hay carpeta `algorithms/`.

Each algorithm row has a **?** button (GUI English): opens a popup with a short explanation and simplified code from `nav.js`.

Cada algoritmo tiene un botón **?** (la GUI del popup está en inglés): abre explicación corta y código simplificado de `nav.js`.

Every mode first hits a **local safety layer** (`safetyCommand` / `dontbeWebon`): if the path ahead is choked, the rover backs off or turns and **goes around** instead of spinning in place. Then the selected algorithm commands `v` (m/s) and `omega` (rad/s).

Todos pasan primero por una **capa de seguridad local**: si el frente está tapado, el rover retrocede o gira y **rodea** el obstáculo. Después el algoritmo manda `v` y `omega`.

| Mode | Id | Idea | Sensors (primary) |
|------|-----|------|-------------------|
| Pure Pursuit | `pure_pursuit` | Steer toward the waypoint; slow if the front is tight | `forwardClear` (any enabled) + shared safety |
| Bug2 | `bug2` | Follow the M-line; trace the boundary when blocked | `blocked`, `forwardClear`, `steerHint`, `minObstacleDist` |
| VFH | `vfh` | Steer through the clearest polar-histogram sector | **polar** (LIDAR); IR×3 fallback |
| Custom | `custom` | Your `loop()` in the JS pad — [CUSTOM_JS.md](CUSTOM_JS.md) | Whatever you read: `lidar` / `ultrasonic` / `ir` / `floorIr` |

Click **?** next to each algorithm (GUI English) for explanation, sensors used, and simplified code.

Pulsa **?** junto a cada algoritmo (popup en inglés) para ver explicación, sensores y código.

| Modo | Id | Idea | Sensores (principal) |
|------|-----|------|----------------------|
| Pure Pursuit | `pure_pursuit` | Apunta al waypoint; frena si el frente está corto | `forwardClear` + seguridad compartida |
| Bug2 | `bug2` | Línea-M; contorno si hay bloqueo | `blocked`, `forwardClear`, `steerHint` |
| VFH | `vfh` | Histograma polar → sector más libre | **polar**; IR×3 de respaldo |
| Custom | `custom` | Tu `loop()` — [CUSTOM_JS.md](CUSTOM_JS.md) | Los que leas en el pad |

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

- **Rover** — kinematic: `applyMotion` integrates `v` / `omega`, refuses obstacle overlap, and follows drawn terrain height.
- **Full hit-test** — world-space footprint includes wheels; it never shrinks according to camera pixels.
- **Swept motion** — each frame is divided into ≤ 0.08 m / ≤ 0.05 rad checks to prevent tunneling through thin objects.
- **Dropped props** — dynamic `cannon-es` bodies the rover can push; terrain relief uses static triangle meshes.
- Teaching sandbox, not a validated differential-drive plant model.

- **Rover** — cinemático: `applyMotion` integra `v` / `omega`, evita solapes y trata el relieve extruido como choke.
- **Hit-test completo** — la huella incluye las ruedas y nunca cambia por píxeles de cámara.
- **Movimiento barrido** — cada frame se divide en chequeos ≤ 0.08 m / ≤ 0.05 rad para no atravesar objetos.
- **Objetos soltados** — cuerpos dinámicos `cannon-es`; el relieve usa mallas triangulares estáticas.
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
