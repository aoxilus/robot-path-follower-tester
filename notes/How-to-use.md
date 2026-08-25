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
| **Left** | Sensors, algorithm, Start / Pause / Reset, waypoint vs object mode |
| **Center** | 3D arena (30×30 m). Short floor click = waypoint. Drag = camera |
| **Right** | Drag spheres / cubes / cylinders, **✏️ draw terrain**, telemetry log |

## Mission loop

1. Place waypoints on the floor (rover pose = start). Stack props while editing — **gravity is off** until Start.
2. Pick an algorithm. Optionally enable LIDAR, ultrasonic, and/or 3× IR.
3. **Start** — snapshot of map / rover / waypoints, then the rover drives. Physics (cannon-es) runs only during the mission.
4. **Pause** — freeze rover and physics. Resume to continue.
5. A waypoint counts as **passed** within ~1.5 m (`WP_ACCEPT_RADIUS`).
6. If unreachable after ~2 go-around circuits, it is **skipped** (purple) and the mission continues.
7. **Reset** — restore the snapshot from the last Start (does **not** wipe the map). Use **Clear Objects** to empty props.

## Sensors

| Sensor | Range | Role |
|--------|-------|------|
| **LIDAR** | 6 m | Slower 360° scan; range is 2× the largest rover dimension |
| **Ultrasonic** | 4 m | Front cone (−0.35, 0, +0.35 rad) |
| **IR ×3** | 0.6 m | Very short contact rays L / C / R |
| **Floor IR ×3** | 3 m | On: detect and route around depression edges. Off: rover may enter and descend |
| **Spring bumper** | contact | Visible bar compresses and briefly reverses. Off: push light props; cones and ≥25 kg still block |

Each sensor works independently. LIDAR alone uses a slower 360° scan and checks a 3 m-wide rover corridor for every candidate direction; ultrasonic alone watches its inexpensive front cone.

## Interaction

- **Waypoints** — short click floor; hold+drag rover.
- **Props** — click to select; Weight / Scale sliders edit selection (or defaults for next drop). Light = flies on hit; **≥25 kg** barely moves.
- **Move objects** — camera locked; drag cones and props.
- **Draw shape (✏️)** — right panel. Drag on the floor to outline a polygon (concave loops kept). Flat in the plane until **Extrude**: **↑ raises a mountain**; **↓ sinks a depression** that follows your outline. Rover tilts on slopes. Floor IR off = drive into holes; on = avoid the rim.

If the rover remains within `0.08 m` for `1.5 s`, shared stuck recovery reverses, turns toward the clearest fused-sensor direction, escapes forward, and resumes the selected algorithm.

## Algorithms

All modes first pass a **local safety layer** (`dontbeWebon` / `safetyCommand`): if the path ahead is choked, the rover backs off or turns and goes around. Then the selected algorithm commands `v` (m/s) and `omega` (rad/s).

| Mode | Id | Idea |
|------|-----|------|
| Pure Pursuit | `pure_pursuit` | Steer toward waypoint; slow if front is tight |
| Bug2 | `bug2` | M-line to goal; boundary follow when blocked |
| VFH | `vfh` | Clearest sector of the polar histogram |
| Custom | `custom` | Your `loop()` in the JS pad — see [Custom JS](Custom-JS.md) |

## Telemetry

Every ~2 s the log records pose, waypoint, command, sensors, and nearby objects.

- **Copy** — visible log text
- **Export JSON** → `robot-telemetry.json`
- **Export CSV** → `robot-telemetry.csv`
- Console: `window.missionTelemetry`

## Physics note

- **Rover** — kinematic (`applyMotion`). Hull collides; **Hit Objects** adds a speed-scaled cannon-es impulse (no teleport).
- **Stacks / spheres** — gravity + friction + sleep. Parked rover does not knock. Balls roll; they are not spin-locked.
- **Weight** — knock impulse scales with kg (light flies, heavy barely moves). **≥25 kg** skips hull shove and blocks like a cone.
- **Dropped props / cones** — dynamic `cannon-es` bodies. Physics steps only while a mission is playing. See [Physics.md](Physics.md) for why fake knocks look robotic.
- Teaching sandbox, not a validated differential-drive plant model.
