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
| You want to compare Bug0 vs basic avoidance vs random wander | Switch algorithms in one click |
| Teaching or prototyping a 4-wheel differential-drive bot | Visual telemetry + collision log |

**Future / Futuro:** plug in your own algorithms in **Python** or **JavaScript**.

---

## ⚡ Quick start

```bash
git clone <repo-url>
cd robot-path-follower-tester
npm install
npm run dev
```

Open **http://localhost:5173/** · toggle **English / Español** in the UI.

---

## 🎮 How to use

**Layout:** left panel = settings · **center** = 3D robot scene · **right** = drag & drop objects + telemetry log.

1. **Click the center scene** → set waypoints (🟢 start · 🟡 middle · 🔴 end)
2. **Pick an algorithm** → Basic Avoidance · Bug 0 · Random Wander
3. **Start Exploration** → watch the robot follow the path and dodge obstacles
4. **Drag objects** from the right panel onto the scene → stack boxes/spheres/cylinders; the robot pushes them on contact

---

## 🛞 Built-in algorithms

| Algorithm | What it does |
|-----------|--------------|
| **Basic Avoidance** | Reverse, scan 180°, inject sub-goal, resume |
| **Bug 0** | Go to goal; on hit, turn and follow obstacle boundary |
| **Random Wander** | Chaotic turns when blocked — good stress test |

---

## 🧱 Stack

- **Three.js** — 3D scene, robot mesh, sensors, radar arcs
- **cannon-es** — physics props the robot can push
- **Vite** — fast dev server
- **i18n** — English + Spanish UI

---

## 📂 Project layout

```
docs/screenshot.png   # README preview image
index.html            # 3-column UI (settings | viewport | drag-drop)
main.js               # scene, 4-wheel robot, sensors, path-following AI
style.css             # full-width panel layout
```

---

## 🚀 Roadmap

- [ ] Custom algorithm hook (JS module / Python bridge)
- [ ] Export telemetry as JSON/CSV
- [x] GitHub README screenshot
- [ ] GitHub Pages live demo

---

## 📜 License

MIT — use it, break it, improve it.

Made with 🥑
