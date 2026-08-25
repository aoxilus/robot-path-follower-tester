# 🥑 Robot Path Follower Tester

**EN / ES** · Vite + Three.js · 4-wheel rover · by [aoxilus](https://github.com/aoxilus)

![Robot Path Follower Tester — 3-column UI, rover, waypoints, props, mountain/hole terrain](docs/screenshot.png)

> **EN:** Fast-simulate follow algorithms on a 4-wheel robot — no ROS, no Gazebo, no hardware. 🤖  
> **ES:** Simula rápido algoritmos de seguimiento en un robot de 4 ruedas — sin ROS, sin Gazebo, sin hardware. 🚗

---

## 🥑 Why this exists / Por qué existe

| EN | ES |
|----|-----|
| Path ideas are slow to try on real hardware | Probar rutas en hardware real es lento |
| ROS / Gazebo takes forever for a quick test | ROS / Gazebo tarda demasiado para un test rápido |
| Compare Bug2, Pure Pursuit, VFH, Custom in one click | Compara Bug2, Pure Pursuit, VFH y Custom en un clic |
| Teach or prototype a differential-drive rover | Enseña o prototipa un rover diferencial |

**EN:** Open the browser and test in seconds.  
**ES:** Abre el navegador y prueba en segundos.

---

## ⚡ Quick start / Arranque

```bash
git clone https://github.com/aoxilus/robot-path-follower-tester.git
cd robot-path-follower-tester
npm install
npm run dev
```

**EN:** Open http://localhost:5173/ — toggle **EN / ES** at the top of the left panel.  
**ES:** Abre http://localhost:5173/ — cambia **EN / ES** arriba del panel izquierdo.

---

## 🎮 How to use / Cómo usarlo

**EN — layout:** left = sensors & mission · center = 3D arena · right = props & terrain.  
**ES — layout:** izquierda = sensores y misión · centro = arena 3D · derecha = props y terreno.

| Step | EN | ES |
|------|----|-----|
| 1 | Short-click the floor → waypoints | Clic corto en el piso → waypoints |
| 2 | Pick an algorithm (Bug2 default) | Elige algoritmo (Bug2 por defecto) |
| 3 | **Start Mission** — snapshot, then drive. **Pause** freezes. **Reset** restores the snapshot (does not wipe the map) | **Iniciar misión** — snapshot, luego conduce. **Pausa** congela. **Reset** restaura el snapshot (no borra el mapa) |
| 4 | Drag sphere / cube / cylinder. **Weight (kg)** = how much they move on hit (light flies, ≥25 kg barely moves) | Arrastra esfera / cubo / cilindro. **Peso (kg)** = cuánto se mueven al golpe (liviano vuela, ≥25 kg casi no se mueve) |
| 5 | **Draw shape** → **Extrude ↑** mountain or **↓** hole | **Dibujar forma** → **Extruir ↑** montaña o **↓** hoyo |
| 6 | **Error Report** → Copy / JSON / CSV | **Reporte de error** → Copiar / JSON / CSV |

**EN:** Physics (gravity, knock) runs only while a mission is playing — stack props while editing. **Clear Objects** empties props.  
**ES:** La física (gravedad, golpes) corre solo con la misión en marcha — apila props en edición. **Quitar objetos** vacía los props.

**EN — Floor IR** defaults off (drive into holes like a 4×4). Turn it on to route around the rim. The rover **tilts** on hills and holes.  
**ES — IR de piso** viene apagado (entra a hoyos como un 4×4). Actívalo para rodear el borde. El rover **se inclina** en colinas y hoyos.

Full walkthrough + FAQ: **[wiki/index.html](wiki/index.html)** (EN/ES)

---

## 🤖🚗🛸 Algorithms / Algoritmos

| Id | EN | ES |
|----|----|-----|
| `bug2` | M-line to the goal; follow the obstacle when blocked *(default)* | M-line a la meta; sigue el obstáculo si está bloqueado *(default)* |
| `pure_pursuit` | Steer toward a lookahead point on the path | Apunta a un punto de lookahead en la ruta |
| `vfh` | Pick a clear sector from a local histogram | Elige un sector libre del histograma local |
| `custom` | Your `loop()` sets `v` and `omega` | Tu `loop()` asigna `v` y `omega` |

---

## 🧱 Stack

- **Three.js** — 3D scene / escena 3D
- **cannon-es** — props the rover can push / props que el rover empuja
- **Vite** — dev server
- **i18n** — English + Español

**EN:** Teaching sandbox, not a validated differential-drive plant model.  
**ES:** Sandbox didáctico, no un modelo validado de planta diferencial.

---

## 📂 Layout / Archivos

```
index.html              UI (3 columns, Custom pad)
main.js                 Scene, rover, mission, maps, Error Report
nav.js                  Sensors + algorithms
style.css               Layout
scripts/smoke_sim.mjs   Smoke test
wiki/index.html         Wiki EN/ES + FAQ
docs/HOW_IT_WORKS.md    How the sim works (EN/ES)
docs/screenshot.png     README preview
notes/                  Extra API wiki
```

---

## 📜 License / Licencia

[CC BY-NC-SA 4.0](LICENSE)

Made with 🥑 by [aoxilus](https://github.com/aoxilus)
