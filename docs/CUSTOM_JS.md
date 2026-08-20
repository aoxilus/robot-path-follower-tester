# Custom JS pad

← [Docs home](README.md) · [How it works](HOW_IT_WORKS.md)

Choosing **Custom** opens `#customPad` over the 3D view (two stacked editors).

Al elegir **Custom** se abre el textpad sobre la vista 3D (dos editores).

---

## Panes / Paneles

1. **`void setup` (read-only)** — robot API and expected loop shape. **Copy** and paste this to an AI so it can write a loop. Not editable.
2. **`loop()` (editable)** — assign `v` and `omega`. **Check** then **Save**.

Saved source: `localStorage.customLoopJs`.

---

## Allowed inputs (read-only)

| Name | Meaning |
|------|---------|
| `robotX`, `robotZ` | Rover position (m) |
| `heading` | Yaw (rad) |
| `waypointX`, `waypointZ` | Current target |
| `waypointDist` | Distance to target (m) |
| `headingErr` | Signed heading error to the target |
| `blocked` | Front blocked (`0` / `1`) |
| `forwardClear` | Clear distance ahead (m) |
| `nearest` | Nearest obstacle (m) |
| `lidar` | 36 bins (or empty) |
| `ultrasonic` | 3 values |
| `ir` | 3 values |
| `MAX_SPEED`, `MAX_OMEGA` | Caps |

**Math:** `sin`, `cos`, `atan2`, `hypot`, `abs`, `max`, `min`, `PI`, and other whitelisted `Math` names.

**draw(x, z)** — cyan mark on the floor (max 20 per command).

---

## Example loop

```js
v = MAX_SPEED * 0.60
omega = headingErr * 2.00
draw(robotX, robotZ)
```

After the loop, `v` and `omega` are clamped to `±MAX_SPEED` / `±MAX_OMEGA`.

---

## Forbidden / Prohibido

The fast checker (`checkCustomJs` in `main.js`) rejects:

- `alert`, `new`, object literals `{ key: … }`, `function`, `return`
- `document`, `window`, `fetch`, `eval`, classes
- Unknown identifiers (must be on the whitelist or declared with `let` / `const` / `var`)

Only robot variables, math, and `draw`. No new objects, no DOM, no network.

Solo variables del robot, matemáticas y `draw`. Sin objetos nuevos, sin DOM, sin red.

---

## Pipeline

```
loadCustomLoop()
  → checkCustomJs
  → wrapCustomLoop (injects robotX, Math, draw, let v / omega)
  → compileCustomLoop
  → setCustomRunner(runCustomLoop)

computeNavCommand('custom', …)
  → runCustomLoop(ctx)
  → if nothing compiled: defaultCustomCommand in nav.js
```

There is **no** `algorithms/custom.js` file. The default is three lines in `nav.js`.
