# API — `nav.js`

← [Home](Home.md) · [Architecture](Architecture.md)

Exports one factory: **`createNavSystem(ctx)`**. Internally defines `SensorSuite` and the path algorithms.

---

## `createNavSystem(ctx)`

Builds sensors + navigation. Returns:

```js
{
  sensorConfig,      // { lidar, ultrasonic, ir, floorIr, hitTest } mutable 0/1
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
| `addTerrainMesh(mesh)` | Track an extruded stamp perimeter for sensor choke |
| `removeTerrainMesh(mesh)` | Untrack terrain perimeter |
| `allTargets()` | Static + dynamic + raised-terrain meshes |
| `floorTargets()` | Sunken-terrain perimeter meshes for Floor IR |
| `castTargets(origin, dir, range, targets)` | Raycast a specific sensor target set |
| `cast(origin, dir, maxDist)` | Raycast; returns hit distance or **`Infinity`** if clear |
| `castCorridor(origin, dir, range, halfSpan)` | Five parallel LIDAR rays inflated to rover clearance |
| `read()` | Fuse enabled sensors into one reading object |
| `isPhysicalCollision()` | AABB overlap robot vs obstacles and terrain sensor walls |
| `updateLidarVisuals(reading)` | Update scan-ray lengths/colors |

### `read()` output shape

| Field | Type | Meaning |
|-------|------|---------|
| `lidar` | `Float32Array(36)` or null | Cached 360° hull-clearance distances |
| `ultrasonic` | `[L,C,R]` or null | Front cone |
| `ir` | `[L,C,R]` or null | Short bumper |
| `floorIr` | `[L,C,R]` or null | Depression-edge distances |
| `polar` | `Float32Array(36)` or null | Fused polar map for planners |
| `forwardClear` | number | Min clear distance ahead |
| `minObstacleDist` | number | Nearest hit |
| `blocked` | 0/1 | Front sector considered blocked |
| `steerHint` | −1 / 0 / 1 | Prefer turn side |
| `sensorVotes` / `sensorWeight` | number | Active detections / telemetry weight; one vote is authoritative |

**Important:** clear cast = `Infinity`, not `maxDist` (avoids false “always blocked” when short-range sensors see nothing).

---

## Helpers (inside factory)

| Function | Role |
|----------|------|
| `setCustomRunner(fn)` | Custom algo runner; non-function → file fallback |
| `stuckRecoveryCommand(...)` | `reverse → look → escape` after 1.5 s within 0.08 m |
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

1. Run algorithm-independent stuck recovery.
2. Run `safetyCommand` — if it returns a command, use it (go-around / skip).
3. Else dispatch by `activeAlgo`:

| `activeAlgo` | Behavior |
|--------------|----------|
| `custom` | `customRunner(ctx)` or `defaultCustomCommand` |
| `pure_pursuit` | `omega ∝ headingErr`; slow if `forwardClear` tight |
| `bug2` | `TRACK` along M-line; `BUG_FOLLOW` along boundary until re-acquire |
| `vfh` (default fallback) | Histogram sectors; pick lowest cost toward goal |

Returns at least `{ v, omega }`. Safety may also set `skip` / `webon`.

---

## `defaultCustomCommand(ctx)` (inside `createNavSystem`)

Default Custom when no valid saved loop is compiled: `v = 0.6·MAX_SPEED`, `omega = clamp(headingErr·2)`.

---

## `navState` fields (owned by `main.js`, mutated here)

Typical fields: `mode` (`IDLE` / `TRACK` / `BUG_FOLLOW`), `bugSide`, `bugStartDist`, `roseMode`, `roseDistance`, `roseStartX/Z`, `roseLastX/Z`, `forceRose`, `roseCircuits`, `roseLeftStart`.
