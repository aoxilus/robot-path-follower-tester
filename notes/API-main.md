# API — `main.js`

← [Home](Home.md) · [Architecture](Architecture.md)

Script module (not class-based). Owns scene, input, mission, Custom pad, telemetry. Imports `createNavSystem` from `nav.js`.

---

## i18n

| Function | Role |
|----------|------|
| `t(key, params)` | Lookup string in `translations[currentLang]`; replaces `{name}` |
| `algoDisplayName(algo)` | Localized algorithm label |
| `applyLanguage(lang)` | Switch EN/ES, update DOM `[data-i18n]`, persist `lang` |

---

## Viewport / visuals

| Function | Role |
|----------|------|
| `resizeViewport()` | Fit Three.js renderer to `#viewport` |
| `createGradientTexture()` | Floor procedural texture |
| `createStripeTexture()` | Wheel stripe texture |
| `createSquareTexture()` | Body panel texture |

---

## Physics props (`cannon-es`)

| Function | Role |
|----------|------|
| `propTypeLabel(type)` | i18n label for sphere/box/cylinder |
| `createPhysicsProp(type, x, y, z, mass)` | Mesh + CANNON body; registers with sensors |
| `clearPhysicsProps()` | Remove all dynamic props |
| `syncRobotPhysicsBody()` | Copy rover pose → kinematic CANNON body |
| `stepPhysics(dt)` | Mission playing: hull → impulse → `world.step` → meshes; else freeze bodies |
| `setPropMass(prop, mass)` | 0.5–80 kg; ≥25 kg skips hull shove |
| `applyRobotPushImpulse(dt)` | If rover speed ≥ 0.35 m/s, applyImpulse on overlapping light bodies (then `world.step`) |

---

## Collision / pose queries

| Function | Role |
|----------|------|
| `hitInsetMeters()` | Returns `0`; collision never shrinks from screen pixels |
| `roverFootprintCorners(x, z, rotY, inset)` | 4 ground corners of rover hull |
| `boxCorners2d(box)` | Obstacle box projected to XZ |
| `projectSpan(corners, ax, az)` | SAT projection helper |
| `polygonsOverlap(a, b)` | 2D polygon overlap (SAT) |
| `getRobotCollisionBox(target)` | Axis-aligned body box (no radar inflate) |
| `queryPose(x, z, rotY)` | `{ clear, minPenetration }` vs static + dynamic obstacles |
| `robotIntersectsObstaclesAt(x, z, rotY)` | Boolean overlap |
| `depenetrateRobot()` | Nudge rover out of penetration |
| `getRobotSensorOrigin(target)` | World point for raycasts (sensor height) |
| `clampToArena(x, z)` / `clampRobotPosition()` | Keep inside `BUILD_LIMIT` |
| `createTerrainStamp(points)` | Flat polygon stamp on the floor (✏️ tool) |
| `setStampHeight(stamp, h)` | Extrude `h>0` mountain / `h<0` depression |
| `terrainHeightAt(x, z)` | Relief height under a point |
| `applyRoverTerrain(dt)` | Gravity / stick rover to stamped terrain |
| `buildReliefGeometry(points, h)` | Triangulated visible mountain/depression |
| `addReliefSensorWalls(stamp)` | Raised obstacle targets or sunken Floor-IR targets |
| `polygonsIntersectGeneral(a, b)` | General polygon overlap, including concave stamps |
| `terrainStampOverlap(rover)` | Find extruded stamp overlapping rover footprint |
| `markCollision(position)` | Visual/log helper for hits |
| `triggerSpringBumper()` | Compress visible bumper without overriding navigation |
| `updateSpringBumper(dt)` | Spring-return animation and toggle visibility |

---

## Pointer / selection / drag

| Function | Role |
|----------|------|
| `interactionCanvas()` | `renderer.domElement` |
| `capturePointerSafe` / `releasePointerSafe` | Pointer capture helpers |
| `findPropFromMesh(object)` | Walk up mesh → prop record |
| `pickSceneTarget(clientX, clientY)` | Ray pick: prop / robot / terrain stamp / floor |
| `raycastWaypointHit` / `raycastPropAt` / `raycastRobotAt` | Specific hits |
| `setRobotSelected(on)` | Selection highlight |
| `raycastDragPlane` / `computeGrabOffset` | Drag on Y-plane |
| `setPropHighlight` / `selectProp` / `deselectProp` | Prop selection UI |
| `beginPropDrag` / `endPropDrag` / `movePropOnPlane` | Prop drag lifecycle |
| `beginRobotDrag` / `endRobotDrag` / `moveRobotOnPlane` | Rover drag lifecycle |
| `movePropToScreen` | Place prop under cursor |
| `updateMoveHandle(time)` | Animated move handle |
| `pointerToNdc` | Screen → NDC |
| `updateModeUi()` | Status text for waypoint/object/move modes |
| `placeObjectAtScreen` | Drop palette item at cursor |
| `onPointerDown` / `Move` / `Up` / `Cancel` | Gesture state machine |
| `updateHoverCursor` | Cursor feedback |
| `resetGestureState()` | Clear drag/select state |
| `addWaypointAtScreen` | Snap waypoint to grid + marker |
| `updateWaypointColors` | Green / yellow / red / purple |
| `disposePathLines` / `updatePathFlow` | Cyan path glow lines |

---

## Custom JS pad

See also [Custom JS](Custom-JS.md).

| Function | Role |
|----------|------|
| `customSetupText()` | Read-only API blurb (EN/ES) for the setup pane |
| `refreshCustomPadI18n()` | Refresh setup textarea |
| `setCustomPadOpen(on)` | Show/hide `#customPad` |
| `clearCustomDraw()` | Remove floor marks from `draw()` |
| `customDrawMark(x, z)` | Add cyan sphere mark (max 20) |
| `stripCustomNoise(src)` | Strip comments/strings for static checks |
| `customBracesOk(src)` | Balance `()` / `[]` (objects `{}` forbidden) |
| `checkCustomJs(src)` | Whitelist names + banned tokens |
| `wrapCustomLoop(src)` | Wrap user code into a callable runner |
| `compileCustomLoop(src)` | `new Function` compile; returns runner or null |
| `finiteOrZero(n)` | Sanitize numbers |
| `runCustomLoop(ctx)` | Execute compiled loop; clamp `v`/`omega` |
| `computeCustomFileFallback(ctx)` | Default Custom: `v = 0.6·MAX_SPEED`, `omega = clamp(headingErr·2)` |
| `showCustomCheck(ok, msg)` | Check status line |
| `saveCustomLoop()` / `loadCustomLoop()` | `localStorage` persist |
| `copyCustomSetup()` | Copy setup text to clipboard |

---

## Mission / motion

| Function | Role |
|----------|------|
| `sensorListLabel()` / `updateSensorStatus()` | Left-panel sensor summary |
| `applyMotion(v, omega, dt)` | Swept integration; reject collisions, animate differential wheel speeds, trigger bumper. Returns `1` if stalled |
| `distToGoal(target)` | Horizontal distance to waypoint |
| `resetNavForWaypoint()` | Clear rose/Bug2 state for next WP |
| `skipUnreachableWaypoint()` | Mark purple, advance index |
| `checkWaypointMission()` | Pass / skip / done logic each frame |

---

## Telemetry

| Function | Role |
|----------|------|
| `collectTelemetryObjects()` | Nearby prop summaries |
| `telemetryNumber` / `telemetryDistances` | Format helpers |
| `addLog(message)` | Append to `#log` |
| `flashCopyBtn()` | Brief “Copied” feedback |
| `copyTelemetryLog()` | Clipboard of visible log |
| `telemetryRows()` | In-memory sample array |
| `csvCell` / `telemetryCsvRow` | CSV escaping |
| `downloadTelemetryFile` | Trigger browser download |
| `exportTelemetryJson` / `exportTelemetryCsv` | File exports |
| `addTelemetrySample(reading, cmd)` | Push timed sample (~2 s) |

Samples also exposed as `window.missionTelemetry`.

---

## Render loop

| Function | Role |
|----------|------|
| `animate()` | `requestAnimationFrame`: physics → sensors → `computeNavCommand` → `applyMotion` → visuals → telemetry |

---

## Notable globals (module scope)

| Name | Role |
|------|------|
| `scene`, `camera`, `renderer`, `controls` | Three.js stack |
| `robot`, `wheels`, `obstacles` | Rover + static cones |
| `waypoints`, `waypointMarkers`, `pathIndex` | Mission path |
| `navState` | Bug2 / rose-around state machine |
| `animating` | Mission running flag |
| `paused` | Mission freeze (rover + physics) |
| `preMissionMap` | Snapshot taken at Start; Reset restores it |
| `physicsWorld`, `physicsProps` | cannon-es |
| `sensorConfig`, `sensorSuite`, `computeNavCommand`, `setCustomRunner` | From `createNavSystem` |
