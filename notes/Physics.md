# Physics — cannon-es (why it looked fake)

← [Home](Home.md) · [How to use](How-to-use.md)

The sim has **two** collision jobs that must stay split:

| Job | Owner | If you mix them |
|-----|--------|-----------------|
| Brain / Bug2 “is this pose blocked?” | 2D footprint + sensors (`queryPose`) | Rover freezes *before* overlap → solver never sees a hit |
| Body / knock, gravity, roll, stacks | `cannon-es` (`physicsWorld.step`) | Scripted `velocity.set` / teleports fight gravity |

The rover hull is **kinematic**. Props and stage cones are **dynamic**. Gravity is `(0, −15, 0)`.

---

## What “robotic” hits were

Not missing ease-in-out. CSS easing is for UI. A rigid pop is what you get when code **overwrites** the integrator:

1. `body.velocity.set(nx * launch, lift, nz * launch)` every ~80 ms  
2. `body.position += sep` (teleport out of the hull)  
3. `angularDamping = 0.88` “hit spin” so a sphere **cannot roll**  
4. Fat AABB knock while the rover is **parked** (3 m hull + 12 cm margin still overlaps a tower in front)

That sequence:

- knocks a ball **off its support** even when nothing is driving  
- **cancels gravity** (`vy` rewritten; ball hangs or jitters)  
- **cancels rolling** (ω damped to death)  
- looks like a stepped animation, not a shove

The fix is the opposite of ease-in-out keyframes: **one `applyImpulse`**, then let `world.step` accelerate, friction-roll, and sleep.

---

## Why ~10 AI retries failed

Agents kept patching the *symptom* (“nothing moves”) with more animation:

| Failed idea | Why it made it worse |
|-------------|----------------------|
| Freeze motion with 2D polygons | Hull never overlaps → no cannon contacts |
| Knock from `world.contacts` only | Kinematic box sat **above the wheels** (`y = 0.5…1.5`); floor balls contacted the *bottom* of the box and were pushed **down**, not out |
| `velocity.set` + bigger launch | Fights gravity; stacks explode or freeze |
| Teleport (`sep`) out of the hull | Instant pop = robotic; next AABB still overlaps → repeat |
| `allowSleep = false` | Towers never rest; look “glued” or noisy |
| Hit-spin `ω` lock + high angular damping | Sphere on a cube will not roll off; it sits or slides |
| Fat AABB while idle | Parked rover continuously “hits” nearby props |

They did not fail because cannon-es is unused. They failed because **scripted motion and the solver were both writing the same bodies**.

---

## Rules that work (do not regress)

1. **Parked rover** (`speed XZ < 0.35 m/s`): no knock. Sleep + gravity own the stack.  
2. **Moving rover**: `applyImpulse` (and a little rolling `ω` on spheres), then `world.step`.  
3. **Stacked extras**: `wakeUp()` only — do not `velocity.set` on the ball on top.  
4. **Hull box includes wheels** (`ROBOT_PHYS`, `y ≈ 0.06…1.5`).  
5. **Tight contact margin** (~3 cm), not 12 cm.  
6. **Cones are dynamic** (~14 kg) and meshes follow bodies.  
7. **Hit Objects off**: robot collision mask drops `FILTER_PROP` (no shove).  
8. **After placing on a support:** give a small downward `vy` and `wakeUp()`. `velocity = 0` + sleep leaves a ball hovering and it will never fall.

---

## Cómo probar

1. **Soporte:** cubo lejos del rover, esfera encima. Debe **quedarse** y, si la empujas, **caer y rodar**.  
2. **Golpe:** Hit Objects on, misión o empuje. El objeto acelera; no salta de pose.  
3. **Idle:** con el rover parado, una torre a 2 m **no** debe salir volando.

---

## Code map

| Symbol | Role |
|--------|------|
| `stepPhysics` | sync kinematic hull → optional impulse → `world.step` → copy meshes |
| `knockPropAway` | `applyImpulse` + sphere roll; no teleport |
| `applyRobotPushImpulse` | skipped unless rover is moving |
| `ROBOT_PHYS` | cannon box including wheels |
| `FILTER_ROBOT` / `FILTER_PROP` | Hit Objects mask |
