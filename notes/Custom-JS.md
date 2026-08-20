# Custom JS pad

← [Home](Home.md) · [How to use](How-to-use.md)

When algorithm **Custom** is selected, `#customPad` opens over the 3D view.

## Panes

1. **`void setup` (read-only)** — robot API description. **Copy** and paste to an AI to generate a loop.
2. **`loop()` (editable)** — assign `v` and `omega`. **Check** then **Save**.

Saved source: `localStorage.customLoopJs`.

## Allowed inputs (read-only)

| Name | Meaning |
|------|---------|
| `robotX`, `robotZ` | Rover position (m) |
| `heading` | Yaw (rad) |
| `waypointX`, `waypointZ` | Current target |
| `waypointDist` | Distance to target |
| `headingErr` | Signed heading error to target |
| `blocked` | Front blocked flag |
| `forwardClear` | Clear distance ahead |
| `nearest` | Nearest obstacle distance |
| `lidar` | `Float32Array(36)` or empty |
| `ultrasonic` | length-3 array |
| `ir` | length-3 array |
| `MAX_SPEED`, `MAX_OMEGA` | Caps |

## Allowed APIs

- `Math`: `sin`, `cos`, `atan2`, `hypot`, `abs`, `max`, `min`, `PI` (and similar whitelisted names)
- `draw(x, z)` — mark a cyan point on the floor (max 20 per run)

## Assign

```js
v = MAX_SPEED * 0.60
omega = headingErr * 2.00
draw(robotX, robotZ)
```

`v` / `omega` are clamped to `±MAX_*` after the loop runs.

## Forbidden

Static checker (`checkCustomJs`) blocks among others:

- `alert`, `new`, object literals `{}`, `function`, `return`
- `document`, `window`, `fetch`, `eval`, classes
- Unknown identifiers (must be in the whitelist)

## Pipeline

```
loadCustomLoop() → checkCustomJs → wrapCustomLoop → compileCustomLoop
       → setCustomRunner(fn)
computeNavCommand('custom', …) → runCustomLoop(ctx)  [or file fallback]
```

Fallback: `defaultCustomCommand` in `nav.js` (same formula as `computeCustomFileFallback` in `main.js`).
