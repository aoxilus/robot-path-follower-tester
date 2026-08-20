# API — `nav.js`

← [Home](Home.md) · [Architecture](Architecture.md)

Exports one factory: **`createNavSystem(ctx)`**. Internally defines `SensorSuite` and the path algorithms.

---

## `createNavSystem(ctx)`

Builds sensors + navigation. Returns:

```js
{
  sensorConfig,      // { lidar, ultrasonic, ir } mutable 0/1
  sensorSuite,       // SensorSuite instance
  computeNavCommand, // main planner entry
  setCustomRunner,   // plug Custom loop
  WP_ACCEPT_RADIUS,
}
```

---

## Class: `SensorSuite`

| Method | Role |
|--------|------|
| `constructor(robotObj, staticObstacles)` | Raycaster + cached obstacle boxes; `lidarBins = 36` |
| `addDynamicObstacle(mesh)` | Track physics prop for ray hits |
| `removeDynamicObstacle(mesh)` | Untrack prop |
| `allTargets()` | Static + dynamic meshes |
| `cast(origin, dir, maxDist)` | Raycast; returns hit distance or **`Infinity`** if clear |
| `read()` | Fuse enabled sensors into one reading object |
| `isPhysicalCollision()` | AABB overlap robot vs obstacles |
| `updateLidarVisuals(reading)` | Update scan-ray lengths/colors |

### `read()` output shape

| Field | Type | Meaning |
|-------|------|---------|
| `lidar` | `Float32Array(36)` or null | Full 360° distances |
| `ultrasonic` | `[L,C,R]` or null | Front cone |
| `ir` | `[L,C,R]` or null | Short bumper |
| `polar` | `Float32Array(36)` or null | Fused polar map for planners |
| `forwardClear` | number | Min clear distance ahead |
| `minObstacleDist` | number | Nearest hit |
| `blocked` | 0/1 | Front sector considered blocked |
| `steerHint` | −1 / 0 / 1 | Prefer turn side |
| `sensorVotes` / `sensorWeight` | number | Multi-sensor agreement |

**Important:** clear cast = `Infinity`, not `maxDist` (avoids false “always blocked” when short-range sensors see nothing).

---

## Helpers (inside factory)

| Function | Role |
|----------|------|
| `setCustomRunner(fn)` | Custom algo runner; non-function → file fallback |
| `normalizeAngle(a)` | Wrap to (−π, π] |
| `goalHeading(target)` | Bearing to waypoint |
| `distToGoal(target)` | Distance to waypoint |
| `mLineDist(target, start)` | Distance to Bug2 M-line |
| `polarClearance(reading, localAngle)` | Clearance at body-relative angle |
| `chooseFreestHeading(goalError, reading)` | Best free offset toward goal |
| `pickRoseSide(headingErr, reading)` | Side for go-around (−1 left / +1 right) |
| `dontbeWebon(reading, navState)` | Local choke response (back / turn / wall follow) |
| `safetyCommand(headingErr, reading, navState)` | Rose go-around state; may return `{ skip: 1 }` after 2 circuits |

---

## `computeNavCommand(activeAlgo, target, reading, navState, missionStart)`

1. Run `safetyCommand` — if it returns a command, use it (go-around / skip).
2. Else dispatch by `activeAlgo`:

| `activeAlgo` | Behavior |
|--------------|----------|
| `custom` | `customRunner(ctx)` or `defaultCustomCommand` |
| `pure_pursuit` | `omega ∝ headingErr`; slow if `forwardClear` tight |
| `bug2` | `TRACK` along M-line; `BUG_FOLLOW` along boundary until re-acquire |
| `dwa` | Grid of `(v, ω)`; score progress + clearance |
| `vfh` | Histogram sectors; pick lowest cost toward goal |
| `potential_field` (default) | Attractive force to WP + repulsive from polar/IR hits |

Returns at least `{ v, omega }`. Safety may also set `skip` / `webon`.

---

## `defaultCustomCommand(ctx)` (inside `createNavSystem`)

Default Custom when no valid saved loop is compiled: `v = 0.6·MAX_SPEED`, `omega = clamp(headingErr·2)`.

---

## `navState` fields (owned by `main.js`, mutated here)

Typical fields: `mode` (`IDLE` / `TRACK` / `BUG_FOLLOW`), `bugSide`, `bugStartDist`, `roseMode`, `roseDistance`, `roseStartX/Z`, `roseLastX/Z`, `forceRose`, `roseCircuits`, `roseLeftStart`.
