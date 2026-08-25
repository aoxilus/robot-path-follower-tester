# 🤖 Robot Path Follower Tester

EN / ES · Vite + Three.js

![Robot Path Follower Tester — 3-column UI with 4-wheel robot, waypoints, and physics objects](docs/screenshot.png)

> **Many times we need to fast-simulate follow algorithms on a 4-wheel robot — that's why we made this app.**
>
> **Muchas veces necesitamos simular rápido algoritmos de seguimiento en un robot de 4 ruedas — por eso hicimos esta app.**

Drop waypoints, pick an algorithm, watch a **4-wheel robot** navigate in 3D — no ROS install, no Gazebo wait, no hardware required. Just open the browser and test your idea in seconds.

Coloca waypoints, elige un algoritmo y mira un **robot de 4 ruedas** navegar en 3D — sin instalar ROS, sin esperar Gazebo, sin hardware. Abre el navegador y prueba tu idea en segundos.

---

## 🥑 Why this exists / Por qué existe

| Problem | This app |
|---------|----------|
| Path-following ideas are slow to validate on real hardware | Instant 3D sandbox in the browser |
| ROS/Gazebo setup takes forever for a quick test | `npm install && npm run dev` — done |
| You want to compare Pure Pursuit, Bug2, and VFH | Switch algorithms in one click |
| Teaching or prototyping a 4-wheel differential-drive bot | Visual telemetry + collision log |

**Future / Futuro:** plug in your own algorithms in **Python** or **JavaScript**.

---

## ⚡ Quick start

```bash
git clone <repo-url>
cd robot-path-planning-sim
npm install
npm run dev
```

Open **http://localhost:5173/** · toggle **English / Español** in the UI.

---

## 🎮 How to use

**Layout:** left panel = settings · **center** = 3D robot scene · **right** = drag & drop objects + telemetry log.

1. **Click the center scene** → set waypoints (🟢 start · 🟡 middle · 🔴 end)
2. **Pick an algorithm** → Pure Pursuit · Bug2 · VFH · Custom
3. **Start Exploration** → watch the robot follow the path and dodge obstacles
4. **Drag objects** from the right panel onto the scene → stack boxes/spheres/cylinders; the robot pushes them on contact
5. **✏️ Draw shape** on the right panel → outline a polygon on the floor, then **Extrude** ↑ (mountain) or ↓ (depression)

Extruded terrain is a **choke obstacle**: LIDAR/ultrasonic/IR detect its perimeter, hit-test blocks overlap, and path algorithms route around it. At `0 m`, the flat preview does not block.

Sensors are modular and independently authoritative. LIDAR alone scans 360° on a slower cycle and evaluates a **3 m-wide rover corridor** per heading; ultrasonic alone covers the inexpensive front cone, and IR is a short **0.6 m** contact-zone sensor.

The default hit-test uses the rover’s complete **2.8×3 m body-and-wheel footprint** in world meters. Its visible spring bumper compresses and springs back without overriding navigation, while swept substeps prevent tunneling through thin objects.

**Floor IR** defaults **off** (rover drives into holes like a 4×4). Enable it to detect depression edges and route around them. If movement stays within `0.12 m` for `1.8 s`, shared recovery reverses, looks toward the clearest path, escapes, then resumes with a cooldown.

---

## 🛞 Built-in algorithms

| Algorithm | What it does |
|-----------|--------------|
| **Pure Pursuit** (`pure_pursuit`) | Tracks the waypoint path using a lookahead target |
| **Bug2** (`bug2`) | Follows the M-line to the goal and traces obstacles when blocked |
| **VFH** (`vfh`) | Builds a local steering choice from obstacle sectors |
| **Custom** (`custom`) | JS pad: copy the robot API, paste a `loop()` that sets `v` and `omega` |

---

## 🧱 Stack

- **Three.js** — 3D scene, robot mesh, sensors, radar arcs
- **cannon-es** — physics props the robot can push
- **Vite** — fast dev server
- **i18n** — English + Spanish UI

**Physics note / Nota de física:** `cannon-es` is used for visual props and kinematic rover motion (`applyMotion` + kinematic body). This is not a validated differential-drive dynamics simulator.

**Nota de física / Physics note:** `cannon-es` se usa para objetos visuales y movimiento cinemático del rover (`applyMotion` + cuerpo cinemático). No es un simulador validado de dinámica diferencial.

---

## 📂 Project layout

```
index.html              # 3-column UI + Custom JS pad
main.js                 # scene, rover, mission, telemetry, Custom checker
nav.js                  # sensors + algorithms
style.css               # layout
scripts/smoke_sim.mjs   # smoke test
docs/HOW_IT_WORKS.md    # how the sim works
docs/ARCHITECTURE.md    # files + data flow
docs/CUSTOM_JS.md       # Custom pad
docs/screenshot.png     # README preview
notes/                  # extra API wiki
```

Walkthrough: **[docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md)** (sensors, algorithms, Custom pad, telemetry, physics).

---

## 🚀 Roadmap

- [x] Custom JS pad (copy setup → AI → check/save loop)
- [x] Export telemetry as JSON/CSV
- [x] Hit test toggle (avoid vs push light props)
- [x] Prop mass / scale inspector
- [x] GitHub README screenshot
- [ ] GitHub Pages live demo

---

## 📜 License

CC BY-NC-SA 4.0 — see [LICENSE](LICENSE).

Made with 🥑 by [aoxilus](https://github.com/aoxilus)
