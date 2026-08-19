// Navigation sensors + 5 path algorithms (imported by main.js)
import * as THREE from 'three';

export function createNavSystem(ctx) {
    const {
        robot,
        obstacles,
        getRobotCollisionBox,
        getRobotSensorOrigin,
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

    const sensorConfig = { lidar: true, ultrasonic: true, ir: true };

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

        cast(origin, dir, maxDist) {
            this.ray.far = maxDist;
            this.ray.set(origin, dir.clone().normalize());
            const hits = this.ray.intersectObjects(this.allTargets(), true);
            return hits.length > 0 ? hits[0].distance : maxDist;
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
                blocked: false,
                steerHint: 0,
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
                if (!out.polar) {
                    out.polar = new Float32Array(9).fill(ULTRASONIC_RANGE);
                    us.forEach((d, i) => { out.polar[16 + i] = d; });
                } else {
                    coneAngles.forEach((a, i) => {
                        const bin = Math.round(((a + Math.PI) / (Math.PI * 2)) * this.lidarBins) % this.lidarBins;
                        out.polar[bin] = Math.min(out.polar[bin], us[i]);
                    });
                }
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
                    out.blocked = true;
                    out.steerHint = ir[0] > ir[2] ? -1 : (ir[2] > ir[0] ? 1 : -1);
                }
                out.minObstacleDist = Math.min(out.minObstacleDist, ...ir);
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
                    out.blocked = true;
                    if (out.polar[leftIdx] > out.polar[rightIdx]) out.steerHint = -1;
                    else if (out.polar[rightIdx] > out.polar[leftIdx]) out.steerHint = 1;
                }
            }

            if (out.ultrasonic && !sensorConfig.ir && out.ultrasonic[1] < 1.0) {
                out.blocked = true;
                out.steerHint = out.ultrasonic[0] > out.ultrasonic[2] ? -1 : 1;
            }

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

    function computeNavCommand(activeAlgo, target, reading, navState, missionStart) {
        const goalAngle = goalHeading(target);
        const headingErr = normalizeAngle(goalAngle - robot.rotation.y);
        const blocked = reading.blocked || sensorSuite.isPhysicalCollision();
        const clear = reading.forwardClear;

        if (activeAlgo === 'pure_pursuit') {
            const lookahead = Math.max(2, Math.min(5, distToGoal(target) * 0.6));
            const lx = robot.position.x + Math.sin(robot.rotation.y + headingErr) * lookahead;
            const lz = robot.position.z + Math.cos(robot.rotation.y + headingErr) * lookahead;
            const toLook = Math.atan2(target.x - lx, target.z - lz);
            let omega = normalizeAngle(toLook - robot.rotation.y) * 2;
            let v = MAX_SPEED;
            if (blocked && clear < 2) {
                v = MAX_SPEED * 0.25;
                omega = reading.steerHint * MAX_OMEGA * 0.8 + headingErr * 0.3;
            } else if (clear < 3) v = MAX_SPEED * (clear / 3);
            return { v: Math.max(0.5, v), omega: Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, omega)) };
        }

        if (activeAlgo === 'bug2') {
            if (navState.mode === 'BUG_FOLLOW') {
                const side = navState.bugSide;
                let omega = side * MAX_OMEGA * 0.55;
                let v = MAX_SPEED * 0.55;
                if (reading.minObstacleDist < 0.9) omega = side * MAX_OMEGA * 0.9;
                const closerOnMline = mLineDist(target, missionStart) < navState.bugStartDist - 0.3;
                const frontOpen = reading.forwardClear > 1.8 && !blocked;
                if (closerOnMline && frontOpen) navState.mode = 'TRACK';
                return { v, omega };
            }
            if (blocked && clear < 1.5) {
                navState.mode = 'BUG_FOLLOW';
                navState.bugSide = reading.steerHint || 1;
                navState.bugStartDist = mLineDist(target, missionStart);
                return { v: MAX_SPEED * 0.35, omega: navState.bugSide * MAX_OMEGA * 0.7 };
            }
            navState.mode = 'TRACK';
            const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, headingErr * 2.2));
            const v = clear < 2.5 ? MAX_SPEED * 0.5 : MAX_SPEED;
            return { v, omega };
        }

        if (activeAlgo === 'dwa') {
            let best = { v: 0, omega: 0, score: -Infinity };
            for (let vi = 0; vi <= 4; vi++) {
                const v = (vi / 4) * MAX_SPEED;
                for (let wi = -4; wi <= 4; wi++) {
                    const omega = (wi / 4) * MAX_OMEGA;
                    const simT = 0.6;
                    const nx = robot.position.x + Math.sin(robot.rotation.y + omega * simT) * v * simT;
                    const nz = robot.position.z + Math.cos(robot.rotation.y + omega * simT) * v * simT;
                    if (Math.abs(nx) > BUILD_LIMIT || Math.abs(nz) > BUILD_LIMIT) continue;
                    const futureAngle = robot.rotation.y + omega * simT;
                    const toGoal = normalizeAngle(goalAngle - futureAngle);
                    let clearance = reading.forwardClear;
                    if (reading.polar) clearance = Math.min(...reading.polar);
                    if (blocked && v > MAX_SPEED * 0.4 && Math.abs(toGoal) < 0.5) continue;
                    const score = v * 1.2 - Math.abs(toGoal) * 2 + clearance * 0.35;
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
            const goalSector = Math.round(((goalAngle + Math.PI) / (Math.PI * 2)) * sectors) % sectors;
            let bestS = goalSector;
            let bestCost = Infinity;
            for (let s = 0; s < sectors; s++) {
                const diff = Math.min(Math.abs(s - goalSector), sectors - Math.abs(s - goalSector));
                const cost = histogram[s] * 3 + diff * 0.4;
                if (cost < bestCost) { bestCost = cost; bestS = s; }
            }
            const chosenAngle = (bestS / sectors) * Math.PI * 2 - Math.PI;
            const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, normalizeAngle(chosenAngle - robot.rotation.y) * 1.8));
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
        const attX = target.x - robot.position.x;
        const attZ = target.z - robot.position.z;
        const attLen = Math.hypot(attX, attZ) || 1;
        const fx = attX / attLen * 2 + repX * (repCount ? 1.2 : 0.5);
        const fz = attZ / attLen * 2 + repZ * (repCount ? 1.2 : 0.5);
        const desired = Math.atan2(fx, fz);
        const omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, normalizeAngle(desired - robot.rotation.y) * 2));
        const v = blocked ? MAX_SPEED * 0.35 : MAX_SPEED * Math.min(1, Math.hypot(fx, fz) / 3);
        return { v, omega };
    }

    return {
        sensorConfig,
        sensorSuite,
        computeNavCommand,
        WP_ACCEPT_RADIUS,
    };
}
