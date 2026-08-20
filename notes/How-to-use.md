# How to use

← [Home](Home.md)

Robot Path Follower Tester is a **browser sandbox** for 4-wheel path following. No ROS, no Gazebo.

## Start

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build
node scripts/smoke_sim.mjs
```

Toggle **EN / ES** at the top of the left panel.

## Layout

| Panel | Role |
|-------|------|
| **Left** | Sensors, algorithm, Start / Reset, waypoint vs object mode |
| **Center** | 3D arena (30×30 m). Short floor click = waypoint. Drag = camera |
| **Right** | Drag spheres / cubes / cylinders + telemetry log |

## Mission loop

1. Place waypoints on the floor (rover pose = start).
2. Pick an algorithm. Optionally enable LIDAR, ultrasonic, and/or 3× IR.
3. **Start** — the rover drives waypoint to waypoint.
4. A waypoint counts as **passed** within ~1.5 m (`WP_ACCEPT_RADIUS`).
5. If unreachable after ~2 go-around circuits, it is **skipped** (purple) and the mission continues.

## Sensors

| Sensor | Range | Role |
|--------|-------|------|
| **LIDAR** | 5 m | 360° scan (36 bins), drawn as rays |
| **Ultrasonic** | 4 m | Front cone (−0.35, 0, +0.35 rad) |
| **IR ×3** | 2 m | Short bumper rays L / C / R |
| **Hit test** | hull | On: avoid/stop + go-around. Off: push light props; cones and ≥25 kg still block |

## Interaction

- **Waypoints** — short click floor; hold+drag rover.
- **Props** — click to select; Weight / Scale sliders edit selection (or defaults for next drop).
- **Move objects** — camera locked; drag cones and props.

## Algorithms

All modes first pass a **local safety layer** (`dontbeWebon` / `safetyCommand`): if the path ahead is choked, the rover backs off or turns and goes around. Then the selected algorithm commands `v` (m/s) and `omega` (rad/s).

| Mode | Id | Idea |
|------|-----|------|
| Pure Pursuit | `pure_pursuit` | Steer toward waypoint; slow if front is tight |
| Bug2 | `bug2` | M-line to goal; boundary follow when blocked |
| DWA | `dwa` | Sample short `(v, ω)` candidates |
| VFH | `vfh` | Clearest sector of the polar histogram |
| Potential Field | `potential_field` | Attract to waypoint, repel from hits |
| Custom | `custom` | Your `loop()` in the JS pad — see [Custom JS](Custom-JS.md) |

## Telemetry

Every ~2 s the log records pose, waypoint, command, sensors, and nearby objects.

- **Copy** — visible log text
- **Export JSON** → `robot-telemetry.json`
- **Export CSV** → `robot-telemetry.csv`
- Console: `window.missionTelemetry`

## Physics note

- **Rover** — kinematic (`applyMotion`). Hit test on: no overlap. Hit test off: pushes light props; cones / heavy props still stop it.
- **Dropped props** — dynamic `cannon-es` bodies the rover can push.
- Teaching sandbox, not a validated differential-drive plant model.
