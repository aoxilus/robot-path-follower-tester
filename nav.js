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
        BUILD_LIMIT,
        MAX_SPEED,
        MAX_OMEGA,
        PASS_CLEAR_MARGIN,
        WP_ACCEPT_RADIUS,
    } = ctx;

    const sensorConfig = { lidar: 1, ultrasonic: 1, ir: 1 };
    const OA_BR_LOOKAHEAD = 5.00;
    const OA_MARGIN_MAX = 1.50;
    const ROSE_AREA_RADIUS = 1.50;
    const ROSE_MIN_CIRCUIT = 4.00;

    class SensorSuite {
        constructor(robotObj, staticObstacles) {
            this.robot = robotObj;
            this.staticObstacles = staticObstacles;
            this.dynamicObstacles = [];
            this.ray = new THREE.Raycaster();
            this.origin = new THREE.Vector3();
            this.robotBoxCache = new THREE.Box3();
            this.obsBoxes = staticObstacles.map((obs) => new THREE.Box3().setFromObject(obs));
            this.lidarBins = 36;
        }

        addDynamicObstacle(mesh) { this.dynamicObstacles.push(mesh); }
        removeDynamicObstacle(mesh) {
            const idx = this.dynamicObstacles.indexOf(mesh);
            if (idx >= 0) this.dynamicObstacles.splice(idx, 1);
        }

        allTargets() {
            return [...this.staticObstacles, ...this.dynamicObstacles];
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
            this.ray.far = maxDist;
            this.ray.set(origin, dir.clone().normalize());
            const hits = this.ray.intersectObjects(this.allTargets(), true);
            return hits.length > 0 ? hits[0].distance : Infinity;
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
                polar: null,
                forwardClear: Infinity,
                minObstacleDist: Infinity,
                blocked: 0,
                steerHint: 0,
                sensorVotes: 0,
                sensorWeight: 0,
            };

            if (sensorConfig.lidar) {
                const dists = new Float32Array(this.lidarBins);
                for (let i = 0; i < this.lidarBins; i++) {
                    const angle = (i / this.lidarBins) * Math.PI * 2;
                    const worldDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).applyMatrix4(rot).normalize();
                    dists[i] = this.cast(this.origin, worldDir, LIDAR_RANGE);
                }
                out.lidar = dists;
                out.polar = dists;
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

            // Sensor consensus: an individual reading is noise or a grazing
            // hit; 2 of the 3 independent sensor systems must agree before
            // navigation enters obstacle avoidance. The weight is retained
            // for telemetry so every decision can be audited.
            let lidarVote = 0;
            let ultrasonicVote = 0;
            let irVote = 0;

            if (out.lidar) {
                let lidarFront = Infinity;
                for (let i = -3; i <= 3; i++) {
                    const index = (i + this.lidarBins) % this.lidarBins;
                    lidarFront = Math.min(lidarFront, out.lidar[index]);
                }
                if (lidarFront < 2.50) lidarVote = 1;
            }

            if (out.ultrasonic) {
                let ultrasonicFront = Infinity;
                for (let i = 0; i < out.ultrasonic.length; i++) {
                    ultrasonicFront = Math.min(ultrasonicFront, out.ultrasonic[i]);
                }
                if (ultrasonicFront < 2.50) ultrasonicVote = 1;
            }

            if (out.ir) {
                let irFront = Infinity;
                for (let i = 0; i < out.ir.length; i++) {
                    irFront = Math.min(irFront, out.ir[i]);
                }
                if (irFront < 1.50) irVote = 1;
            }

            out.sensorVotes = lidarVote + ultrasonicVote + irVote;
            out.sensorWeight = lidarVote * 0.50
                + ultrasonicVote * 0.30
                + irVote * 0.20;
            out.blocked = out.sensorVotes >= 2 ? 1 : 0;

            return out;
        }

        isPhysicalCollision() {
            getRobotCollisionBox(this.robotBoxCache);
            for (const obs of this.obsBoxes) {
                if (this.robotBoxCache.intersectsBox(obs)) return true;
            }
            for (const mesh of this.dynamicObstacles) {
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
                const dist = reading.lidar[Math.min(i * step, reading.lidar.length - 1)];
                const angle = -Math.PI / 2 + (Math.PI / (scanRaysCount - 1)) * i;
                line.material.opacity = 0.55;
                line.material.color.setHex(dist < 1.5 ? 0xff4444 : 0x00ff88);
                line.geometry.setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(Math.sin(angle) * dist, 0, Math.cos(angle) * dist),
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

    // Go around the obstacle on one committed side. Never sit still spinning
    // (that skipped reachable waypoints). Drive while turning; reverse only
    // when overlapping or translation already failed.
    function dontbeWebon(reading, navState) {
        const side = navState.roseSide < 0 ? -1 : 1;
        const probe = 0.55;
        const yaw = robot.rotation.y;
        const fx = robot.position.x + Math.sin(yaw) * probe;
        const fz = robot.position.z + Math.cos(yaw) * probe;
        const frontHit = queryPose(fx, fz, yaw);
        const nowHit = queryPose(robot.position.x, robot.position.z, yaw);
        const frontClear = Math.min(reading.forwardClear, polarClearance(reading, 0));
        const wallClear = polarClearance(reading, -side * 1.22);

        if (nowHit.clear === 0) {
            return {
                v: -MAX_SPEED * 0.35,
                omega: side * MAX_OMEGA * 0.80,
                skip: 0,
                webon: 1,
            };
        }
        if (navState.forceRose && (frontHit.clear === 0 || frontClear < 1.10)) {
            return {
                v: -MAX_SPEED * 0.28,
                omega: side * MAX_OMEGA * 0.85,
                skip: 0,
                webon: 1,
            };
        }
        if (frontHit.clear === 0 || frontClear < 1.10) {
            return {
                v: MAX_SPEED * 0.32,
                omega: side * MAX_OMEGA * 0.90,
                skip: 0,
                webon: 1,
            };
        }

        let omega = side * MAX_OMEGA * 0.40;
        if (wallClear < 0.90) {
            omega = side * MAX_OMEGA * 0.55;
        }
        return {
            v: MAX_SPEED * 0.72,
            omega: Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, omega)),
            skip: 0,
            webon: 1,
        };
    }

    function safetyCommand(headingErr, reading, navState) {
        const step = 0.80;
        const gx = robot.position.x + Math.sin(robot.rotation.y + headingErr) * step;
        const gz = robot.position.z + Math.cos(robot.rotation.y + headingErr) * step;
        const goalHit = queryPose(gx, gz, robot.rotation.y + headingErr);
        const nowHit = queryPose(robot.position.x, robot.position.z, robot.rotation.y);
        const choke = reading.blocked
            || navState.forceRose
            || goalHit.clear === 0
            || nowHit.clear === 0
            || reading.forwardClear < 1.50;

        if (!choke) {
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

        return dontbeWebon(reading, navState);
    }

    function computeNavCommand(activeAlgo, target, reading, navState, missionStart) {
        const goalAngle = goalHeading(target);
        const headingErr = normalizeAngle(goalAngle - robot.rotation.y);
        const blocked = reading.blocked;
        const clear = reading.forwardClear;
        const safe = safetyCommand(headingErr, reading, navState);
        if (safe) return safe;

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
            const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, headingErr * 2));
            const v = clear < 3 ? MAX_SPEED * Math.max(0.25, clear / 3) : MAX_SPEED;
            return { v, omega };
        }

        if (activeAlgo === 'bug2') {
            if (navState.mode === 'BUG_FOLLOW') {
                const side = navState.bugSide;
                let omega = side * MAX_OMEGA * 0.55;
                let v = MAX_SPEED * 0.55;
                if (reading.minObstacleDist < 0.9) omega = side * MAX_OMEGA * 0.9;
                const closerOnMline = mLineDist(target, missionStart) < 0.4
                    && distToGoal(target) < navState.bugStartDist - 0.3;
                const frontOpen = reading.forwardClear > 1.8 && !blocked;
                if (closerOnMline && frontOpen) navState.mode = 'TRACK';
                return { v, omega };
            }
            if (blocked && clear < 1.5) {
                navState.mode = 'BUG_FOLLOW';
                navState.bugSide = reading.steerHint || 1;
                navState.bugStartDist = distToGoal(target);
                return { v: MAX_SPEED * 0.35, omega: navState.bugSide * MAX_OMEGA * 0.7 };
            }
            navState.mode = 'TRACK';
            const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, headingErr * 2.2));
            const v = clear < 2.5 ? MAX_SPEED * 0.5 : MAX_SPEED;
            return { v, omega };
        }

        if (activeAlgo === 'dwa') {
            const polar = reading.polar;
            // Sample the shared sensor histogram in the direction a candidate
            // heading would take us — same angle convention as SensorSuite.read()
            // (bin 0 = current forward, positive = turning right). Without this,
            // "clearance" used to be a single global value added to every
            // candidate's score, so it never actually influenced which (v, ω)
            // won — DWA was blind to which direction was actually open.
            const clearanceForTurn = (turnAngle) => {
                if (!polar) return reading.forwardClear;
                const bins = polar.length;
                let idx = Math.round((turnAngle / (Math.PI * 2)) * bins) % bins;
                if (idx < 0) idx += bins;
                return polar[idx];
            };

            let best = { v: 0, omega: 0, score: -Infinity };
            for (let vi = 0; vi <= 4; vi++) {
                const v = (vi / 4) * MAX_SPEED;
                for (let wi = -4; wi <= 4; wi++) {
                    const omega = (wi / 4) * MAX_OMEGA;
                    const simT = 0.6;
                    const turnAngle = omega * simT;
                    const futureAngle = robot.rotation.y + turnAngle;
                    const nx = robot.position.x + Math.sin(futureAngle) * v * simT;
                    const nz = robot.position.z + Math.cos(futureAngle) * v * simT;
                    if (Math.abs(nx) > BUILD_LIMIT || Math.abs(nz) > BUILD_LIMIT) continue;

                    const toGoal = normalizeAngle(goalAngle - futureAngle);
                    const clearance = clearanceForTurn(turnAngle);
                    if (v > MAX_SPEED * 0.25 && clearance < ROBOT_WIDTH * 0.7 + v * simT) continue;

                    const score = v * 1.2 - Math.abs(toGoal) * 2 + Math.min(clearance, LIDAR_RANGE) * 0.4;
                    if (score > best.score) best = { v, omega, score };
                }
            }
            if (best.score === -Infinity) {
                return { v: MAX_SPEED * 0.2, omega: (reading.steerHint || 1) * MAX_OMEGA * 0.6 };
            }
            return { v: best.v, omega: best.omega };
        }

        if (activeAlgo === 'vfh') {
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
                const cost = histogram[s] * 3 + diff * 0.4;
                if (cost < bestCost) { bestCost = cost; bestS = s; }
            }
            const chosenAngle = (bestS / sectors) * Math.PI * 2 - Math.PI;
            const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, chosenAngle * 1.8));
            const v = histogram[bestS] > 0.6 ? MAX_SPEED * 0.35 : MAX_SPEED * 0.85;
            return { v, omega };
        }

        // potential_field
        let repX = 0;
        let repZ = 0;
        let repCount = 0;
        if (reading.polar) {
            for (let i = 0; i < reading.polar.length; i++) {
                const d = reading.polar[i];
                if (d > 2.5) continue;
                const angle = (i / reading.polar.length) * Math.PI * 2;
                const force = (1 / Math.max(d, 0.3)) - (1 / 2.5);
                repX += -Math.sin(angle) * force;
                repZ += -Math.cos(angle) * force;
                repCount++;
            }
        }
        if (reading.ir) {
            reading.ir.forEach((d, i) => {
                if (d > IR_RANGE * 0.9) return;
                repX += -(i - 1) * 0.5 * (1 / Math.max(d, 0.2));
                repZ += -(1 / Math.max(d, 0.2));
            });
        }
        const fx = Math.sin(headingErr) * 2 + repX * (repCount ? 1.2 : 0.5);
        const fz = Math.cos(headingErr) * 2 + repZ * (repCount ? 1.2 : 0.5);
        const desired = Math.atan2(fx, fz);
        const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, desired * 2));
        const v = blocked ? MAX_SPEED * 0.35 : MAX_SPEED * Math.min(1, Math.hypot(fx, fz) / 3);
        return { v, omega };
    }

    return {
        sensorConfig,
        sensorSuite,
        computeNavCommand,
        setCustomRunner,
        WP_ACCEPT_RADIUS,
    };
}
