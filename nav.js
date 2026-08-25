// Navigation sensors + 5 path algorithms (imported by main.js)
import * as THREE from 'three';

export function createNavSystem(ctx) {
    const {
        robot,
        obstacles,
        getRobotCollisionBox,
        getRobotSensorOrigin,
        queryPose,
        scanRays,
        scanRaysCount,
        ROBOT_COLLISION,
        ROBOT_WIDTH,
        LIDAR_RANGE,
        ULTRASONIC_RANGE,
        IR_RANGE,
        FLOOR_IR_RANGE,
        MAX_SPEED,
        MAX_OMEGA,
        PASS_CLEAR_MARGIN,
        WP_ACCEPT_RADIUS,
    } = ctx;

    const sensorConfig = {
        lidar: 1,
        ultrasonic: 1,
        ir: 1,
        floorIr: 0, // off = 4x4 into depressions; on = avoid holes
        hitTest: 1,
    };
    const OA_BR_LOOKAHEAD = 5.00;
    const OA_MARGIN_MAX = 1.50;
    const ROSE_AREA_RADIUS = 1.50;
    const ROSE_MIN_CIRCUIT = 4.00;
    const LIDAR_UPDATE_INTERVAL = 0.18;
    // Sense a corridor about as wide as the rover body — not the full length.
    const LIDAR_CLEARANCE_RADIUS = ROBOT_COLLISION.halfWidth;
    const BUMPER_PROBE = 0.24;

    class SensorSuite {
        constructor(robotObj, staticObstacles) {
            this.robot = robotObj;
            this.staticObstacles = staticObstacles;
            this.dynamicObstacles = [];
            this.terrainMeshes = [];
            this.ray = new THREE.Raycaster();
            this.origin = new THREE.Vector3();
            this.robotBoxCache = new THREE.Box3();
            this.obsBoxes = staticObstacles.map((obs) => new THREE.Box3().setFromObject(obs));
            this.lidarBins = 36;
            this.lidarCache = null;
            this.lidarNextAt = 0;
        }

        addDynamicObstacle(mesh) { this.dynamicObstacles.push(mesh); }
        removeDynamicObstacle(mesh) {
            const idx = this.dynamicObstacles.indexOf(mesh);
            if (idx >= 0) this.dynamicObstacles.splice(idx, 1);
        }

        addTerrainMesh(mesh) {
            if (this.terrainMeshes.indexOf(mesh) < 0) this.terrainMeshes.push(mesh);
        }
        removeTerrainMesh(mesh) {
            const idx = this.terrainMeshes.indexOf(mesh);
            if (idx >= 0) this.terrainMeshes.splice(idx, 1);
        }

        allTargets() {
            const raisedTerrain = this.terrainMeshes.filter(
                (mesh) => (mesh.userData?.terrainHeight ?? 0) > 0,
            );
            return [...this.staticObstacles, ...this.dynamicObstacles, ...raisedTerrain];
        }

        floorTargets() {
            return this.terrainMeshes.filter(
                (mesh) => (mesh.userData?.terrainHeight ?? 0) < 0,
            );
        }

        castTargets(origin, dir, maxDist, targets) {
            this.ray.far = maxDist;
            this.ray.set(origin, dir.clone().normalize());
            const hits = this.ray.intersectObjects(targets, true);
            return hits.length > 0 ? hits[0].distance : Infinity;
        }

        // Returns Infinity — not maxDist — when nothing is hit. Returning
        // maxDist for "no obstacle" is indistinguishable from "an obstacle
        // sits exactly at the sensor's range limit", which poisoned every
        // downstream Math.min() combining multiple sensors: as soon as ANY
        // enabled sensor (most commonly the short 2m IR) found nothing, its
        // "clear" reading looked identical to a close hit and permanently
        // capped forwardClear at that sensor's range — even in open space,
        // even with LIDAR reporting 5m clear on the same heading. That made
        // every algorithm think it was almost always blocked.
        cast(origin, dir, maxDist) {
            return this.castTargets(origin, dir, maxDist, this.allTargets());
        }

        castCorridor(origin, dir, maxDist, halfSpan) {
            // Parallel rays across the rover footprint. Report true obstacle
            // distance (not hull-subtracted) so LIDAR alone can steer early.
            const perpendicular = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
            const offsets = [-1, -0.5, 0, 0.5, 1];
            let nearest = Infinity;
            for (const offset of offsets) {
                const rayOrigin = origin.clone().addScaledVector(
                    perpendicular,
                    halfSpan * offset,
                );
                nearest = Math.min(nearest, this.cast(rayOrigin, dir, maxDist));
            }
            return nearest;
        }

        read() {
            getRobotSensorOrigin(this.origin);
            const rot = new THREE.Matrix4().extractRotation(this.robot.matrixWorld);
            const forward = new THREE.Vector3(0, 0, 1).applyMatrix4(rot).normalize();
            const right = new THREE.Vector3(1, 0, 0).applyMatrix4(rot).normalize();

            const out = {
                lidar: null,
                ultrasonic: null,
                ir: null,
                floorIr: null,
                polar: null,
                forwardClear: Infinity,
                minObstacleDist: Infinity,
                blocked: 0,
                steerHint: 0,
                sensorVotes: 0,
                sensorWeight: 0,
            };

            if (sensorConfig.lidar) {
                const now = Date.now() / 1000;
                if (!this.lidarCache || now >= this.lidarNextAt) {
                    const dists = new Float32Array(this.lidarBins);
                    for (let i = 0; i < this.lidarBins; i++) {
                        const angle = (i / this.lidarBins) * Math.PI * 2;
                        const worldDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle))
                            .applyMatrix4(rot)
                            .normalize();
                        dists[i] = this.castCorridor(
                            this.origin,
                            worldDir,
                            LIDAR_RANGE,
                            LIDAR_CLEARANCE_RADIUS,
                        );
                    }
                    this.lidarCache = dists;
                    this.lidarNextAt = now + LIDAR_UPDATE_INTERVAL;
                }
                out.lidar = this.lidarCache;
                out.polar = new Float32Array(this.lidarCache);
            }

            if (sensorConfig.ultrasonic) {
                const coneAngles = [-0.35, 0, 0.35];
                const us = coneAngles.map((a) => {
                    const world = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)).applyMatrix4(rot).normalize();
                    return this.cast(this.origin, world, ULTRASONIC_RANGE);
                });
                out.ultrasonic = us;
                // Same angle convention as the LIDAR loop above (angle 0 = forward,
                // dir = sin/cos with no extra offset). Always use lidarBins-sized
                // array so downstream front-sector math (±3 bins around index 0)
                // works whether or not LIDAR itself is enabled.
                if (!out.polar) {
                    out.polar = new Float32Array(this.lidarBins).fill(LIDAR_RANGE);
                }
                coneAngles.forEach((a, i) => {
                    let bin = Math.round((a / (Math.PI * 2)) * this.lidarBins) % this.lidarBins;
                    if (bin < 0) bin += this.lidarBins;
                    out.polar[bin] = Math.min(out.polar[bin], us[i]);
                });
            }

            if (sensorConfig.ir) {
                const leftO = this.origin.clone().addScaledVector(right, -ROBOT_COLLISION.halfWidth);
                const centerO = this.origin.clone();
                const rightO = this.origin.clone().addScaledVector(right, ROBOT_COLLISION.halfWidth);
                const ir = [
                    this.cast(leftO, forward, IR_RANGE),
                    this.cast(centerO, forward, IR_RANGE),
                    this.cast(rightO, forward, IR_RANGE),
                ];
                out.ir = ir;
                out.forwardClear = Math.min(out.forwardClear, ir[1]);
                const narrow = ir[0] < ROBOT_WIDTH + PASS_CLEAR_MARGIN
                    && ir[2] < ROBOT_WIDTH + PASS_CLEAR_MARGIN;
                if (ir[1] < IR_RANGE * 0.85 || narrow) {
                    out.blocked = 1;
                    out.steerHint = ir[0] > ir[2] ? -1 : (ir[2] > ir[0] ? 1 : -1);
                }
                out.minObstacleDist = Math.min(out.minObstacleDist, ...ir);

                // Fuse the three bumper IR sensors into the same polar map
                // used by the path selector. Previously IR only changed
                // forwardClear, so the rover could see a near obstacle in
                // telemetry yet choose the exact same blocked direction.
                if (!out.polar) {
                    out.polar = new Float32Array(this.lidarBins).fill(Infinity);
                }
                const irBins = [-2, 0, 2];
                for (let i = 0; i < ir.length; i++) {
                    let bin = irBins[i] % this.lidarBins;
                    if (bin < 0) bin += this.lidarBins;
                    out.polar[bin] = Math.min(out.polar[bin], ir[i]);
                }
            }

            if (sensorConfig.floorIr) {
                const floorAngles = [-0.32, 0, 0.32];
                const floorTargets = this.floorTargets();
                const floorIr = floorAngles.map((a) => {
                    const world = new THREE.Vector3(Math.sin(a), 0, Math.cos(a))
                        .applyMatrix4(rot)
                        .normalize();
                    return this.castTargets(this.origin, world, FLOOR_IR_RANGE, floorTargets);
                });
                out.floorIr = floorIr;
                out.forwardClear = Math.min(out.forwardClear, floorIr[1]);
                out.minObstacleDist = Math.min(out.minObstacleDist, ...floorIr);
                if (!out.polar) {
                    out.polar = new Float32Array(this.lidarBins).fill(Infinity);
                }
                const floorBins = [-2, 0, 2];
                for (let i = 0; i < floorIr.length; i++) {
                    let bin = floorBins[i] % this.lidarBins;
                    if (bin < 0) bin += this.lidarBins;
                    out.polar[bin] = Math.min(out.polar[bin], floorIr[i]);
                }
                if (Math.min(...floorIr) < FLOOR_IR_RANGE * 0.95) {
                    out.blocked = 1;
                    out.steerHint = floorIr[0] > floorIr[2] ? -1 : 1;
                }
            }

            if (out.polar) {
                const centerIdx = 0; // bin 0 = robot forward (+Z)
                const front = [];
                for (let i = -3; i <= 3; i++) {
                    front.push(out.polar[(centerIdx + i + this.lidarBins) % this.lidarBins]);
                }
                out.forwardClear = Math.min(out.forwardClear, ...front);
                out.minObstacleDist = Math.min(out.minObstacleDist, ...out.polar);
                const leftIdx = (centerIdx + 3) % this.lidarBins;
                const rightIdx = (centerIdx - 3 + this.lidarBins) % this.lidarBins;
                if (out.polar[centerIdx] < 1.2
                    || (out.polar[leftIdx] < ROBOT_WIDTH && out.polar[rightIdx] < ROBOT_WIDTH)) {
                    out.blocked = 1;
                    if (out.polar[leftIdx] > out.polar[rightIdx]) out.steerHint = -1;
                    else if (out.polar[rightIdx] > out.polar[leftIdx]) out.steerHint = 1;
                }
            }

            if (out.ultrasonic && !sensorConfig.ir && out.ultrasonic[1] < 1.0) {
                out.steerHint = out.ultrasonic[0] > out.ultrasonic[2] ? -1 : 1;
            }

            // Each sensor is a complete optional module. Any enabled sensor
            // can independently request avoidance; combining sensors improves
            // coverage but is never required for a single module to work.
            let lidarVote = 0;
            let ultrasonicVote = 0;
            let irVote = 0;
            let floorIrVote = 0;

            if (out.lidar) {
                let lidarFront = Infinity;
                for (let i = -3; i <= 3; i++) {
                    const index = (i + this.lidarBins) % this.lidarBins;
                    lidarFront = Math.min(lidarFront, out.lidar[index]);
                }
                if (lidarFront < 1.80) lidarVote = 1;
            }

            if (out.ultrasonic) {
                let ultrasonicFront = Infinity;
                for (let i = 0; i < out.ultrasonic.length; i++) {
                    ultrasonicFront = Math.min(ultrasonicFront, out.ultrasonic[i]);
                }
                if (ultrasonicFront < 2.00) ultrasonicVote = 1;
            }

            if (out.ir) {
                let irFront = Infinity;
                for (let i = 0; i < out.ir.length; i++) {
                    irFront = Math.min(irFront, out.ir[i]);
                }
                if (irFront < IR_RANGE * 0.95) irVote = 1;
            }

            if (out.floorIr && Math.min(...out.floorIr) < FLOOR_IR_RANGE * 0.95) {
                floorIrVote = 1;
            }

            out.sensorVotes = lidarVote + ultrasonicVote + irVote + floorIrVote;
            out.sensorWeight = lidarVote * 0.50
                + ultrasonicVote * 0.30
                + irVote * 0.20
                + floorIrVote * 0.50;
            out.blocked = out.sensorVotes >= 1 ? 1 : 0;

            return out;
        }

        isPhysicalCollision() {
            getRobotCollisionBox(this.robotBoxCache);
            for (let i = 0; i < this.staticObstacles.length; i++) {
                // Refresh each frame — stage cones can be repositioned in edit mode.
                if (!this.obsBoxes[i]) this.obsBoxes[i] = new THREE.Box3();
                this.obsBoxes[i].setFromObject(this.staticObstacles[i]);
                if (this.robotBoxCache.intersectsBox(this.obsBoxes[i])) return true;
            }
            for (const mesh of this.dynamicObstacles) {
                const box = new THREE.Box3().setFromObject(mesh);
                if (this.robotBoxCache.intersectsBox(box)) return true;
            }
            for (const mesh of this.terrainMeshes) {
                if ((mesh.userData?.terrainHeight ?? 0) < 0 && !sensorConfig.floorIr) continue;
                const box = new THREE.Box3().setFromObject(mesh);
                if (this.robotBoxCache.intersectsBox(box)) return true;
            }
            return false;
        }

        updateLidarVisuals(reading) {
            if (!sensorConfig.lidar || !reading.lidar) {
                scanRays.forEach((r) => { r.material.opacity = 0; });
                return;
            }
            const step = Math.max(1, Math.floor(reading.lidar.length / scanRaysCount));
            for (let i = 0; i < scanRaysCount; i++) {
                const line = scanRays[i];
                const sourceIndex = Math.min(i * step, reading.lidar.length - 1);
                const dist = reading.lidar[sourceIndex];
                const visualDist = Number.isFinite(dist) ? Math.min(dist, LIDAR_RANGE) : LIDAR_RANGE;
                const angle = (sourceIndex / reading.lidar.length) * Math.PI * 2;
                line.material.opacity = 0.55;
                line.material.color.setHex(dist < 1.5 ? 0xff4444 : 0x00ff88);
                line.geometry.setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(Math.sin(angle) * visualDist, 0, Math.cos(angle) * visualDist),
                ]);
            }
        }
    }

    const sensorSuite = new SensorSuite(robot, obstacles);

    function defaultCustomCommand(ctx) {
        const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, ctx.headingErr * 2));
        return { v: MAX_SPEED * 0.60, omega };
    }

    let customRunner = defaultCustomCommand;

    function setCustomRunner(fn) {
        if (typeof fn === 'function') customRunner = fn;
        if (typeof fn !== 'function') customRunner = defaultCustomCommand;
    }

    function normalizeAngle(a) {
        while (a < -Math.PI) a += Math.PI * 2;
        while (a > Math.PI) a -= Math.PI * 2;
        return a;
    }

    function goalHeading(target) {
        return Math.atan2(target.x - robot.position.x, target.z - robot.position.z);
    }

    function distToGoal(target) {
        return Math.hypot(target.x - robot.position.x, target.z - robot.position.z);
    }

    function mLineDist(target, start) {
        const dx = target.x - start.x;
        const dz = target.z - start.z;
        const len = Math.hypot(dx, dz) || 1;
        const px = robot.position.x - start.x;
        const pz = robot.position.z - start.z;
        return Math.abs(px * dz - pz * dx) / len;
    }

    // ArduPilot-style horizontal BendyRuler local planner: every enabled
    // sensor contributes to reading.polar; choose the open heading that best
    // balances waypoint progress and the configured obstacle margin.
    function polarClearance(reading, localAngle) {
        if (!reading.polar) return reading.forwardClear;
        const bins = reading.polar.length;
        let idx = Math.round((localAngle / (Math.PI * 2)) * bins) % bins;
        if (idx < 0) idx += bins;
        return reading.polar[idx];
    }

    function chooseFreestHeading(goalError, reading) {
        const offsets = [0, 0.79, -0.79, 1.57, -1.57, 2.36, -2.36, 3.14];
        let bestAngle = goalError;
        let bestClearance = 0;
        let bestScore = -Infinity;

        for (let i = 0; i < offsets.length; i++) {
            const local = offsets[i];
            const world = robot.rotation.y + local;
            const probe = 0.40;
            const nx = robot.position.x + Math.sin(world) * probe;
            const nz = robot.position.z + Math.cos(world) * probe;
            const hit = queryPose(nx, nz, world);
            if (hit.clear === 0) continue;

            const clearance = polarClearance(reading, local);
            const score = Math.min(clearance, LIDAR_RANGE) * 0.80
                - Math.abs(normalizeAngle(local - goalError)) * 1.40
                - Math.abs(local) * 0.20;
            if (score > bestScore) {
                bestScore = score;
                bestAngle = local;
                bestClearance = clearance;
            }
        }
        return { angle: bestAngle, clearance: bestClearance, found: bestScore > -Infinity ? 1 : 0 };
    }

    function stuckRecoveryCommand(headingErr, reading, navState) {
        const now = Date.now() / 1000;
        const threshold = 0.12;
        const stuckWindow = 1.80;

        if (navState.recoveryPhase) {
            if (now >= navState.recoveryUntil) {
                if (navState.recoveryPhase === 'reverse') {
                    navState.recoveryPhase = 'look';
                    navState.recoveryUntil = now + 0.70;
                } else if (navState.recoveryPhase === 'look') {
                    navState.recoveryPhase = 'escape';
                    navState.recoveryUntil = now + 1.80;
                } else {
                    // Hand control back to go-around on the freest side.
                    navState.recoveryPhase = '';
                    navState.recoveryCooldownUntil = now + 2.50;
                    navState.forceRose = 0;
                    navState.roseMode = 1;
                    navState.roseSide = navState.recoverySide;
                    navState.stuckX = robot.position.x;
                    navState.stuckZ = robot.position.z;
                    navState.stuckSince = now;
                    return null;
                }
            }

            const side = navState.recoverySide < 0 ? -1 : 1;
            if (navState.recoveryPhase === 'reverse') {
                return {
                    v: -MAX_SPEED * 0.50,
                    omega: side * MAX_OMEGA * 0.55,
                    recovery: 'reverse',
                };
            }
            if (navState.recoveryPhase === 'look') {
                return {
                    v: MAX_SPEED * 0.12,
                    omega: side * MAX_OMEGA * 0.90,
                    recovery: 'look',
                };
            }
            return {
                v: MAX_SPEED * 0.70,
                omega: side * MAX_OMEGA * 0.45,
                recovery: 'escape',
            };
        }

        if (now < (navState.recoveryCooldownUntil || 0)) return null;

        if (!Number.isFinite(navState.stuckSince)) {
            navState.stuckX = robot.position.x;
            navState.stuckZ = robot.position.z;
            navState.stuckSince = now;
            return null;
        }

        const moved = Math.hypot(
            robot.position.x - navState.stuckX,
            robot.position.z - navState.stuckZ,
        );
        if (moved > threshold) {
            navState.stuckX = robot.position.x;
            navState.stuckZ = robot.position.z;
            navState.stuckSince = now;
            return null;
        }
        if (now - navState.stuckSince < stuckWindow) return null;

        const free = chooseFreestHeading(headingErr, reading);
        const angle = free.found ? free.angle : (reading.steerHint || 1) * 0.79;
        let side = Math.abs(angle) < 0.15
            ? (reading.steerHint || 1)
            : (angle < 0 ? -1 : 1);
        // Flip side if the previous recovery attempt failed in the same pocket.
        if (navState.lastRecoverySide && navState.lastRecoverySide === side) {
            side = -side;
        }
        navState.recoverySide = side;
        navState.lastRecoverySide = side;
        navState.roseSide = side;
        navState.recoveryPhase = 'reverse';
        navState.recoveryUntil = now + 0.70;
        return {
            v: -MAX_SPEED * 0.50,
            omega: side * MAX_OMEGA * 0.55,
            recovery: 'reverse',
        };
    }

    function pickRoseSide(headingErr, reading) {
        const left = polarClearance(reading, -0.79);
        const right = polarClearance(reading, 0.79);
        const free = chooseFreestHeading(headingErr, reading);
        if (reading.steerHint < 0) return -1;
        if (reading.steerHint > 0) return 1;
        if (free.found && Math.abs(free.angle) > 0.20) {
            if (free.angle < 0) return -1;
            return 1;
        }
        if (left > right + 0.20) return -1;
        if (right > left + 0.20) return 1;
        if (headingErr < 0) return -1;
        return 1;
    }

    // Go around on the freest heading biased toward the goal.
    function dontbeWebon(reading, navState, headingErr) {
        const side = navState.roseSide < 0 ? -1 : 1;
        const yaw = robot.rotation.y;
        const free = chooseFreestHeading(headingErr || 0, reading);
        const turn = free.found ? free.angle : side * 0.90;
        const world = yaw + turn;
        const probe = 0.80;
        const fx = robot.position.x + Math.sin(world) * probe;
        const fz = robot.position.z + Math.cos(world) * probe;
        const frontHit = sensorConfig.hitTest ? queryPose(fx, fz, world) : { clear: 1 };
        const nowHit = sensorConfig.hitTest
            ? queryPose(robot.position.x, robot.position.z, yaw)
            : { clear: 1 };
        const laneClear = polarClearance(reading, turn);

        if (nowHit.clear === 0) {
            return {
                v: -MAX_SPEED * 0.40,
                omega: side * MAX_OMEGA * 0.85,
                skip: 0,
                webon: 1,
            };
        }

        if (navState.forceRose) {
            return {
                v: frontHit.clear ? MAX_SPEED * 0.50 : -MAX_SPEED * 0.22,
                omega: Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, turn * 1.90)),
                skip: 0,
                webon: 1,
            };
        }

        if (frontHit.clear === 0 || laneClear < 0.90) {
            return {
                v: MAX_SPEED * 0.40,
                omega: side * MAX_OMEGA * 0.95,
                skip: 0,
                webon: 1,
            };
        }

        return {
            v: MAX_SPEED * 0.85,
            omega: Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, turn * 1.35)),
            skip: 0,
            webon: 1,
        };
    }

    function safetyCommand(headingErr, reading, navState) {
        const step = 1.20;
        const goalYaw = robot.rotation.y + headingErr;
        const gx = robot.position.x + Math.sin(goalYaw) * step;
        const gz = robot.position.z + Math.cos(goalYaw) * step;
        const goalHit = sensorConfig.hitTest
            ? queryPose(gx, gz, goalYaw)
            : { clear: 1 };
        const nowHit = sensorConfig.hitTest
            ? queryPose(robot.position.x, robot.position.z, robot.rotation.y)
            : { clear: 1 };
        const goalClear = polarClearance(reading, headingErr);
        // Goal lane open → resume tracking even if the current nose sees a side hit.
        const goalOpen = goalHit.clear === 1 && goalClear > 1.40 && nowHit.clear === 1;
        if (goalOpen) {
            navState.roseMode = 0;
            navState.forceRose = 0;
            return null;
        }

        const choke = nowHit.clear === 0
            || goalHit.clear === 0
            || (reading.blocked && goalClear < 1.20)
            || (Number.isFinite(reading.forwardClear)
                && reading.forwardClear < 0.70
                && goalClear < 1.20);

        if (!choke && !navState.forceRose) {
            navState.roseMode = 0;
            return null;
        }

        if (!navState.roseMode) {
            navState.roseMode = 1;
            navState.roseStartX = robot.position.x;
            navState.roseStartZ = robot.position.z;
            navState.roseLastX = robot.position.x;
            navState.roseLastZ = robot.position.z;
            navState.roseDistance = 0;
            navState.roseCircuits = 0;
            navState.roseLeftStart = 0;
            navState.roseSide = pickRoseSide(headingErr, reading);
        }

        navState.roseDistance += Math.hypot(
            robot.position.x - navState.roseLastX,
            robot.position.z - navState.roseLastZ,
        );
        navState.roseLastX = robot.position.x;
        navState.roseLastZ = robot.position.z;

        const fromStart = Math.hypot(
            robot.position.x - navState.roseStartX,
            robot.position.z - navState.roseStartZ,
        );
        if (fromStart > ROSE_AREA_RADIUS) navState.roseLeftStart = 1;
        if (navState.roseLeftStart
            && fromStart <= ROSE_AREA_RADIUS
            && navState.roseDistance >= ROSE_MIN_CIRCUIT) {
            navState.roseCircuits += 1;
            navState.roseLeftStart = 0;
            navState.roseDistance = 0;
        }
        if (navState.roseCircuits >= 2) {
            navState.roseMode = 0;
            return { v: 0, omega: 0, skip: 1, webon: 0 };
        }

        return dontbeWebon(reading, navState, headingErr);
    }

    function computeNavCommand(activeAlgo, target, reading, navState, missionStart) {
        const goalAngle = goalHeading(target);
        const headingErr = normalizeAngle(goalAngle - robot.rotation.y);
        const blocked = reading.blocked;
        const clear = reading.forwardClear;
        const recovery = stuckRecoveryCommand(headingErr, reading, navState);
        if (recovery) return recovery;
        // Bug2 owns boundary follow — shared rose go-around steals the wheel
        // and leaves the rover circling forever while mode stays BUG_FOLLOW.
        if (navState.mode !== 'BUG_FOLLOW') {
            const safe = safetyCommand(headingErr, reading, navState);
            if (safe) return safe;
        }

        if (activeAlgo === 'custom') {
            return customRunner({
                robot,
                target,
                headingErr,
                blocked,
                clear,
                reading,
                MAX_SPEED,
                MAX_OMEGA,
            });
        }

        if (activeAlgo === 'pure_pursuit') {
            // Nudge away from the blocked side when the nose is tight.
            let err = headingErr;
            if (clear < 2.2 && reading.steerHint) {
                err = headingErr + reading.steerHint * 0.45;
            }
            const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, err * 2.1));
            const v = clear < 3 ? MAX_SPEED * Math.max(0.30, clear / 3) : MAX_SPEED;
            return { v, omega };
        }

        if (activeAlgo === 'bug2') {
            const clearOk = !Number.isFinite(clear) || clear > 1.50;
            const goalClear = polarClearance(reading, headingErr);
            const goalLaneOpen = goalClear > 1.85 && !blocked && clearOk;

            if (navState.mode === 'BUG_FOLLOW') {
                const side = navState.bugSide < 0 ? -1 : 1;
                if (!Number.isFinite(navState.bugLastX)) {
                    navState.bugLastX = robot.position.x;
                    navState.bugLastZ = robot.position.z;
                    navState.bugFollowDist = 0;
                }
                navState.bugFollowDist = (navState.bugFollowDist || 0) + Math.hypot(
                    robot.position.x - navState.bugLastX,
                    robot.position.z - navState.bugLastZ,
                );
                navState.bugLastX = robot.position.x;
                navState.bugLastZ = robot.position.z;

                const dGoal = distToGoal(target);
                const onMline = mLineDist(target, missionStart) < 1.35;
                const closer = dGoal < (navState.bugStartDist || dGoal) - 0.12;
                const frontOpen = clearOk && !blocked;
                const aimGoal = goalLaneOpen && Math.abs(headingErr) < 0.95;

                if ((onMline && closer && frontOpen) || aimGoal) {
                    navState.mode = 'TRACK';
                    navState.bugFollowDist = 0;
                    navState.bugFlipped = 0;
                } else if ((navState.bugFollowDist || 0) > 12) {
                    if (!navState.bugFlipped) {
                        navState.bugSide = -side;
                        navState.bugFlipped = 1;
                        navState.bugFollowDist = 0;
                    } else {
                        // Second loop — break out and drive toward the goal.
                        navState.mode = 'TRACK';
                        navState.bugFollowDist = 0;
                        navState.bugFlipped = 0;
                    }
                }

                if (navState.mode === 'BUG_FOLLOW') {
                    let omega = side * MAX_OMEGA * 0.55;
                    let v = MAX_SPEED * 0.55;
                    const sideClear = polarClearance(reading, side * 0.90);
                    if (reading.minObstacleDist < 0.85) {
                        omega = side * MAX_OMEGA * 0.95;
                        v = MAX_SPEED * 0.40;
                    } else if (Number.isFinite(sideClear) && sideClear > 2.8) {
                        // Drift back toward the wall so we can re-hit the M-line.
                        omega = side * MAX_OMEGA * 0.28;
                    }
                    return { v, omega };
                }
            }

            const noseTight = blocked && Number.isFinite(clear) && clear < 1.70;
            if (noseTight || (blocked && goalClear < 1.50)) {
                navState.mode = 'BUG_FOLLOW';
                navState.bugSide = reading.steerHint || pickRoseSide(headingErr, reading);
                navState.bugStartDist = distToGoal(target);
                navState.bugFollowDist = 0;
                navState.bugFlipped = 0;
                navState.bugLastX = robot.position.x;
                navState.bugLastZ = robot.position.z;
                return {
                    v: MAX_SPEED * 0.35,
                    omega: navState.bugSide * MAX_OMEGA * 0.80,
                };
            }

            navState.mode = 'TRACK';
            const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, headingErr * 2.2));
            const v = (!Number.isFinite(clear) || clear >= 2.5)
                ? MAX_SPEED
                : MAX_SPEED * 0.55;
            return { v, omega };
        }

        // VFH is the third built-in mode; also the fallback for unknown ids.
        if (activeAlgo === 'vfh' || (activeAlgo !== 'pure_pursuit' && activeAlgo !== 'bug2' && activeAlgo !== 'custom')) {
            const sectors = 16;
            const histogram = new Float32Array(sectors).fill(0);
            if (reading.polar) {
                for (let i = 0; i < reading.polar.length; i++) {
                    if (reading.polar[i] > LIDAR_RANGE * 0.95) continue;
                    const angle = (i / reading.polar.length) * Math.PI * 2;
                    const sector = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * sectors) % sectors;
                    histogram[sector] += (LIDAR_RANGE - reading.polar[i]) / LIDAR_RANGE;
                }
            } else if (reading.ir) {
                if (reading.ir[1] < IR_RANGE) histogram[8] += 1;
                if (reading.ir[0] < IR_RANGE) histogram[6] += 0.8;
                if (reading.ir[2] < IR_RANGE) histogram[10] += 0.8;
            }
            const goalSector = Math.round(((headingErr + Math.PI) / (Math.PI * 2)) * sectors) % sectors;
            let bestS = goalSector;
            let bestCost = Infinity;
            for (let s = 0; s < sectors; s++) {
                const diff = Math.min(Math.abs(s - goalSector), sectors - Math.abs(s - goalSector));
                // Prefer open sectors near the goal; reject packed sectors harder.
                const cost = histogram[s] * 4.0 + diff * 0.35;
                if (cost < bestCost) { bestCost = cost; bestS = s; }
            }
            const chosenAngle = (bestS / sectors) * Math.PI * 2 - Math.PI;
            const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, chosenAngle * 2.0));
            const v = histogram[bestS] > 0.55 ? MAX_SPEED * 0.40 : MAX_SPEED * 0.90;
            return { v, omega };
        }
    }

    return {
        sensorConfig,
        sensorSuite,
        computeNavCommand,
        setCustomRunner,
        WP_ACCEPT_RADIUS,
    };
}
