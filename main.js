// 🥑 Robot Path Follower Tester
// 🛞 Fast browser sandbox to simulate follow algorithms on a 4-wheel robot.
// 🌍 EN/ES UI · 🤖 Three.js scene · 📡 sensors · 🧠 Bug0 / avoidance / wander

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNavSystem } from './nav.js';

// 🌍 i18n — bilingual UI strings (English + Español)
const translations = {
    en: {
        pageTitle: 'Robot Path Follower Tester',
        title: 'Robot Path Follower Tester',
        futureNote: 'Future: program your own algorithms in Python or JavaScript',
        langLabel: 'Language:',
        algorithmLabel: 'Path Algorithm:',
        algoPurePursuit: 'Pure Pursuit (path tracking)',
        algoBug2: 'Bug2 (M-line boundary follow)',
        algoDwa: 'DWA (dynamic window)',
        algoVfh: 'VFH (vector field histogram)',
        algoPotential: 'Potential Field (attract/repel)',
        sectionSensors: 'Sensors',
        sensorHint: 'Enable sensors — algorithms use what is active',
        sensorLidar: 'LIDAR (360° scan, 5 m)',
        sensorUltrasonic: 'Ultrasonic (front cone, 4 m)',
        sensorIr: '3× IR front (short range, 2 m)',
        sensorStatusNone: 'No sensors — blind drive (physical collision only)',
        sensorStatusActive: 'Active: {list}',
        arenaHint: 'Arena 30×30 m · robot 2×3 m · waypoints snap to grid',
        startBtn: 'Start Mission',
        resetBtn: 'Reset',
        waypointHint: 'Click the floor to set waypoints (Green start, Yellow via, Red end). Robot passes within 1.5 m like ArduCopter.',
        pathFlowHint: 'Glow line shows your path — click the floor (short click, don\'t drag the camera)',
        modeSetWaypoints: 'Current Mode: Set Waypoints',
        waypointsSet: 'Waypoints Set: {count}',
        telemetryLog: 'Telemetry Log',
        alertNeedWaypoints: 'Please set at least two waypoints first (start and end)!',
        logInit: 'INIT: {algo} · {sensors} · {count} waypoints · accept radius {radius}m',
        logPassed: 'PASSED: Waypoint {index} (within {dist}m)',
        logDone: 'DONE: Mission complete. Passed {passed}/{total} waypoints.',
        logAvoid: 'AVOID: Obstacle at {dist}m — {action}',
        logBug2: 'BUG2: Following boundary ({side})',
        logDwa: 'DWA: v={v} ω={w}',
        algoNamePurePursuit: 'Pure Pursuit',
        algoNameBug2: 'Bug2',
        algoNameDwa: 'DWA',
        algoNameVfh: 'VFH',
        algoNamePotential: 'Potential Field',
        interactionModeLabel: 'Interaction Mode:',
        modeWaypoints: 'Set Waypoints',
        modeObjects: 'Place Physics Objects',
        objectTypeLabel: 'Object Type:',
        objSphere: 'Sphere',
        objBox: 'Cube',
        objCylinder: 'Cylinder',
        objectMassLabel: 'Weight (kg):',
        clearObjectsBtn: 'Clear Objects',
        objectHint: 'Drag from the palette to place objects. Click a scene object to select it, then drag to move.',
        objectMoveHint: 'Selected — drag to reposition on the floor',
        logObjectMoved: 'OBJECT: Moved {type} to [{x}, {z}]',
        modePlaceObjects: 'Current Mode: Place Objects',
        logObjectPlaced: 'OBJECT: Placed {type} ({mass} kg) at [{x}, {z}]',
        sectionNav: 'Navigation',
        sectionMode: 'Interaction',
        sectionDrag: 'Drag & Drop',
        dragPaletteLabel: 'Drag onto the scene:',
        dragSphereHint: 'Rolls when pushed',
        dragBoxHint: 'Stackable block',
        dragCylinderHint: 'Tips over easily',
        dropHere: 'Drop here',
    },
    es: {
        pageTitle: 'Robot Path Follower Tester',
        title: 'Probador de Seguidor de Ruta Robot',
        futureNote: 'Futuro: programa tus propios algoritmos en Python o JavaScript',
        langLabel: 'Idioma:',
        algorithmLabel: 'Algoritmo de ruta:',
        algoPurePursuit: 'Pure Pursuit (seguimiento)',
        algoBug2: 'Bug2 (línea-M + contorno)',
        algoDwa: 'DWA (ventana dinámica)',
        algoVfh: 'VFH (histograma vectorial)',
        algoPotential: 'Campo potencial',
        sectionSensors: 'Sensores',
        sensorHint: 'Activa sensores — el algoritmo usa los disponibles',
        sensorLidar: 'LIDAR (360°, 5 m)',
        sensorUltrasonic: 'Ultrasónico (cono frontal, 4 m)',
        sensorIr: '3× IR frontal (corto alcance, 2 m)',
        sensorStatusNone: 'Sin sensores — conducción a ciegas (solo colisión física)',
        sensorStatusActive: 'Activos: {list}',
        arenaHint: 'Arena 30×30 m · robot 2×3 m · waypoints en rejilla',
        startBtn: 'Iniciar misión',
        resetBtn: 'Reiniciar',
        waypointHint: 'Clic en el suelo para waypoints (verde inicio, amarillo vía, rojo fin). Pasa a 1.5 m estilo ArduCopter.',
        pathFlowHint: 'La línea brillante muestra la ruta — clic corto en el suelo (sin arrastrar la cámara)',
        modeSetWaypoints: 'Modo actual: Colocar waypoints',
        waypointsSet: 'Waypoints colocados: {count}',
        telemetryLog: 'Registro de Telemetría',
        alertNeedWaypoints: '¡Coloca al menos dos waypoints primero (inicio y fin)!',
        logInit: 'INICIO: {algo} · {sensors} · {count} waypoints · radio {radius}m',
        logPassed: 'PASADO: Waypoint {index} (a {dist}m)',
        logDone: 'FIN: Misión completa. Pasados {passed}/{total} waypoints.',
        logAvoid: 'EVITAR: Obstáculo a {dist}m — {action}',
        logBug2: 'BUG2: Siguiendo contorno ({side})',
        logDwa: 'DWA: v={v} ω={w}',
        algoNamePurePursuit: 'Pure Pursuit',
        algoNameBug2: 'Bug2',
        algoNameDwa: 'DWA',
        algoNameVfh: 'VFH',
        algoNamePotential: 'Campo Potencial',
        interactionModeLabel: 'Modo de interacción:',
        modeWaypoints: 'Colocar waypoints',
        modeObjects: 'Colocar objetos físicos',
        objectTypeLabel: 'Tipo de objeto:',
        objSphere: 'Esfera',
        objBox: 'Cubo',
        objCylinder: 'Cilindro',
        objectMassLabel: 'Peso (kg):',
        clearObjectsBtn: 'Quitar objetos',
        objectHint: 'Arrastra del panel para colocar. Clic en un objeto del escenario para seleccionarlo y arrástralo para moverlo.',
        objectMoveHint: 'Seleccionado — arrastra para reposicionar en el suelo',
        logObjectMoved: 'OBJETO: {type} movido a [{x}, {z}]',
        modePlaceObjects: 'Modo actual: Colocar objetos',
        logObjectPlaced: 'OBJETO: {type} ({mass} kg) en [{x}, {z}]',
        sectionNav: 'Navegación',
        sectionMode: 'Interacción',
        sectionDrag: 'Arrastrar y soltar',
        dragPaletteLabel: 'Arrastra al escenario:',
        dragSphereHint: 'Rueda al empujarla',
        dragBoxHint: 'Bloque apilable',
        dragCylinderHint: 'Se tumba fácil',
        dropHere: 'Soltar aquí',
    },
};

let currentLang = localStorage.getItem('lang')
    || (navigator.language.startsWith('es') ? 'es' : 'en');

function t(key, params = {}) {
    let text = translations[currentLang][key] ?? translations.en[key] ?? key;
    for (const [param, value] of Object.entries(params)) {
        text = text.replace(`{${param}}`, value);
    }
    return text;
}

function algoDisplayName(algo) {
    const names = {
        pure_pursuit: t('algoNamePurePursuit'),
        bug2: t('algoNameBug2'),
        dwa: t('algoNameDwa'),
        vfh: t('algoNameVfh'),
        potential_field: t('algoNamePotential'),
    };
    return names[algo] ?? algo;
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(el.dataset.i18n);
    });

    document.title = t('pageTitle');

    if (typeof viewport !== 'undefined') {
        viewport.dataset.dropLabel = t('dropHere');
    }

    if (typeof statusEl !== 'undefined' && typeof updateModeUi === 'function') {
        updateModeUi();
    }
    if (typeof updateSensorStatus === 'function') {
        updateSensorStatus();
    }
}

// 🎬 Scene setup — camera, renderer, orbit controls
const viewport = document.getElementById('viewport');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(0, 15, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
viewport.appendChild(renderer.domElement);

function resizeViewport() {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
}

resizeViewport();
new ResizeObserver(resizeViewport).observe(viewport);
window.addEventListener('resize', resizeViewport);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// 🎨 Procedural textures for floor, wheels, and body
function createGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#2b5876');
    gradient.addColorStop(1, '#4e4376');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
}

function createStripeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#333333';
    context.fillRect(0, 0, 32, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
}

function createSquareTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = '#eeba30';
    context.fillRect(0, 0, 128, 128);
    context.strokeStyle = '#d4a017';
    context.lineWidth = 10;
    context.strokeRect(0,0,128,128);
    return new THREE.CanvasTexture(canvas);
}

// 🗺️ Environment — 30×30 m arena (±15 m), robot 2×3 m footprint
const PLANE_SIZE = 30;
const PLANE_HALF = PLANE_SIZE / 2;
const BUILD_MARGIN = 1.5; // keep props/obstacles inside playable area
const BUILD_LIMIT = PLANE_HALF - BUILD_MARGIN;
const WP_ACCEPT_RADIUS = 1.5; // ArduCopter-style — pass within radius, don't stop

const planeGeo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
const planeMat = new THREE.MeshStandardMaterial({ 
    map: createGradientTexture(),
    roughness: 0.8
});
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// Grid helper
const gridHelper = new THREE.GridHelper(PLANE_SIZE, PLANE_SIZE, 0x00ffcc, 0x000000);
gridHelper.position.y = 0.01;
gridHelper.material.opacity = 0.2;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// 🛞 4-wheel robot — yellow body + 4 cylindrical wheels (differential-drive style)
const robot = new THREE.Group();
const carHeight = 1;

// Tight collision hull — body footprint only (excludes radar / scan visuals).
// Do NOT use setFromObject(robot): radar rings and scan lines inflate the box.
const ROBOT_COLLISION = {
    halfWidth: 1.0,   // body 2 m wide
    halfHeight: 0.5,
    halfLength: 1.5,  // body 3 m long
    centerY: carHeight / 2 + 0.5,
};
const ROBOT_WIDTH = ROBOT_COLLISION.halfWidth * 2;
const LIDAR_RANGE = 5;
const ULTRASONIC_RANGE = 4;
const IR_RANGE = 2;
const SENSOR_RANGE = LIDAR_RANGE;
const PASS_CLEAR_MARGIN = 0.3;
const MAX_SPEED = 4;
const MAX_OMEGA = 2.5;

const robotCollider = new THREE.Object3D();
robotCollider.position.set(0, ROBOT_COLLISION.centerY, 0);
robot.add(robotCollider);

// Body
const bodyGeo = new THREE.BoxGeometry(2, carHeight, 3);
const bodyMat = new THREE.MeshStandardMaterial({ map: createSquareTexture() });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = carHeight / 2 + 0.5;
body.castShadow = true;
robot.add(body);

// Wheels
const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
const wheelMat = new THREE.MeshStandardMaterial({ map: createStripeTexture() });
const wheels = [];

const wheelPositions = [
    [-1.2, 0.5, 1],
    [1.2, 0.5, 1],
    [-1.2, 0.5, -1],
    [1.2, 0.5, -1]
];

wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...pos);
    wheel.castShadow = true;
    wheels.push(wheel);
    robot.add(wheel);
});

scene.add(robot);

// Glow ring — pulses when placing waypoints
const robotGlowRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 2.0, 48),
    new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
    }),
);
robotGlowRing.rotation.x = -Math.PI / 2;
robotGlowRing.position.y = 0.08;
robot.add(robotGlowRing);

// 🧱 Static obstacles — fixed red cones the robot must avoid
const obstacles = [];
const obsGeo = new THREE.CylinderGeometry(1, 1.5, carHeight + 0.5, 32); // oval-ish base by scaling later
const obsMat = new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.6 });

for (let i = 0; i < 2; i++) {
    const obs = new THREE.Mesh(obsGeo, obsMat);
    obs.position.y = (carHeight + 0.5) / 2;
    obs.scale.set(1, 1, 0.5); // make it oval
    obs.castShadow = true;
    obs.receiveShadow = true;
    scene.add(obs);
    obstacles.push(obs);
}
obstacles[0].position.set(-3, (carHeight + 0.5) / 2, -2);
obstacles[1].position.set(4, (carHeight + 0.5) / 2, 3);

// ⚙️ Physics (cannon-es) — stackable props the robot pushes on contact
const physicsWorld = new CANNON.World();
physicsWorld.gravity.set(0, -15, 0);
physicsWorld.broadphase = new CANNON.NaiveBroadphase();
physicsWorld.allowSleep = true;
physicsWorld.solver.iterations = 12;

const groundMaterial = new CANNON.Material('ground');
const propMaterial = new CANNON.Material('prop');
const robotMaterial = new CANNON.Material('robot');

physicsWorld.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, propMaterial, {
    friction: 0.55,
    restitution: 0.25,
}));
physicsWorld.addContactMaterial(new CANNON.ContactMaterial(propMaterial, propMaterial, {
    friction: 0.45,
    restitution: 0.2,
}));
physicsWorld.addContactMaterial(new CANNON.ContactMaterial(robotMaterial, propMaterial, {
    friction: 0.35,
    restitution: 0.15,
}));

const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physicsWorld.addBody(groundBody);

const staticObstacleBodies = [];
obstacles.forEach((obs) => {
    const obsHeight = carHeight + 0.5;
    const body = new CANNON.Body({ mass: 0, material: groundMaterial });
    const cylShape = new CANNON.Cylinder(1, 1.5, obsHeight, 10);
    const cylQuat = new CANNON.Quaternion();
    cylQuat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    body.addShape(cylShape, new CANNON.Vec3(), cylQuat);
    body.position.set(obs.position.x, obs.position.y, obs.position.z);
    body.quaternion.setFromEuler(0, obs.rotation.y, 0);
    physicsWorld.addBody(body);
    staticObstacleBodies.push(body);
});

const robotBody = new CANNON.Body({
    mass: 0,
    type: CANNON.Body.KINEMATIC,
    material: robotMaterial,
});
robotBody.addShape(
    new CANNON.Box(new CANNON.Vec3(
        ROBOT_COLLISION.halfWidth,
        ROBOT_COLLISION.halfHeight,
        ROBOT_COLLISION.halfLength,
    )),
    new CANNON.Vec3(0, ROBOT_COLLISION.centerY, 0),
);
physicsWorld.addBody(robotBody);

const physicsProps = [];
const PROP_COLORS = { sphere: 0x44aaff, box: 0xffaa44, cylinder: 0xaa44ff };
const PROP_HALF_HEIGHT = { sphere: 0.5, box: 0.5, cylinder: 0.5 };

function propTypeLabel(type) {
    const keys = { sphere: 'objSphere', box: 'objBox', cylinder: 'objCylinder' };
    return t(keys[type] ?? type);
}

function createPhysicsProp(type, x, y, z, mass) {
    let mesh;
    let shape;
    const bodyMass = Math.max(0.5, mass);
    const body = new CANNON.Body({
        mass: bodyMass,
        material: propMaterial,
        linearDamping: 0.08,
        angularDamping: 0.25,
    });

    if (type === 'sphere') {
        const radius = 0.5;
        mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 24, 16),
            new THREE.MeshStandardMaterial({ color: PROP_COLORS.sphere, roughness: 0.45, metalness: 0.1 }),
        );
        shape = new CANNON.Sphere(radius);
        body.addShape(shape);
    } else if (type === 'box') {
        mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: PROP_COLORS.box, roughness: 0.45, metalness: 0.05 }),
        );
        shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        body.addShape(shape);
    } else {
        mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
            new THREE.MeshStandardMaterial({ color: PROP_COLORS.cylinder, roughness: 0.45, metalness: 0.05 }),
        );
        shape = new CANNON.Cylinder(0.5, 0.5, 1, 12);
        const cylQuat = new CANNON.Quaternion();
        cylQuat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        body.addShape(shape, new CANNON.Vec3(), cylQuat);
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, y, z);
    body.position.set(x, y, z);

    physicsWorld.addBody(body);
    scene.add(mesh);
    const entry = { mesh, body, type, mass: bodyMass };
    mesh.userData.physicsProp = entry;
    physicsProps.push(entry);
    if (typeof collisionSys !== 'undefined') {
        collisionSys.addDynamicObstacle(mesh);
    }
    return entry;
}

function clearPhysicsProps() {
    deselectProp();
    physicsProps.forEach(({ mesh, body }) => {
        physicsWorld.removeBody(body);
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        collisionSys.removeDynamicObstacle(mesh);
    });
    physicsProps.length = 0;
}

function syncRobotPhysicsBody() {
    robotBody.position.set(robot.position.x, 0, robot.position.z);
    robotBody.quaternion.setFromEuler(0, robot.rotation.y, 0);
}

function stepPhysics(dt) {
    syncRobotPhysicsBody();
    physicsWorld.step(Math.min(dt, 1 / 30), dt, 5);
    physicsProps.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    });
}

function getRobotCollisionBox(target = new THREE.Box3()) {
    // Axis-aligned box on the yellow body — matches what the user sees
    const center = new THREE.Vector3();
    robotCollider.getWorldPosition(center);
    target.setFromCenterAndSize(
        center,
        new THREE.Vector3(
            ROBOT_COLLISION.halfWidth * 2,
            ROBOT_COLLISION.halfHeight * 2,
            ROBOT_COLLISION.halfLength * 2,
        ),
    );
    return target;
}

function getRobotSensorOrigin(target = new THREE.Vector3()) {
    // Rays start at the front bumper, not at the ground pivot
    target.set(0, ROBOT_COLLISION.centerY, ROBOT_COLLISION.halfLength);
    target.applyMatrix4(robot.matrixWorld);
    return target;
}

function applyRobotPushImpulse(dt) {
    if (dt <= 0 || !animating) return;
    const robotBox = getRobotCollisionBox();
    const forward = new THREE.Vector3(0, 0, 1)
        .applyMatrix4(new THREE.Matrix4().extractRotation(robot.matrixWorld))
        .normalize();
    const pushSpeed = 4;

    physicsProps.forEach(({ mesh, body, mass }) => {
        const propBox = new THREE.Box3().setFromObject(mesh);
        if (!robotBox.intersectsBox(propBox)) return;

        const impulse = pushSpeed * (8 / Math.sqrt(mass));
        body.velocity.x += forward.x * impulse * dt * 3;
        body.velocity.z += forward.z * impulse * dt * 3;
        body.velocity.y += impulse * dt * 0.8;
        body.angularVelocity.x += (Math.random() - 0.5) * impulse * dt * 2;
        body.angularVelocity.z += (Math.random() - 0.5) * impulse * dt * 2;
        body.wakeUp();
    });
}

// 📡 Radar arcs — pulsing sensor rings on the robot front (visual only, not in hit tests)
const radarGroup = new THREE.Group();
radarGroup.userData.sensorVisual = true;
robot.add(radarGroup);
radarGroup.position.set(0, -carHeight/2 + 0.1, 1); // Front of robot
const radarArcs = [];
for (let i = 0; i < 3; i++) {
    // 120 degree arc
    const geo = new THREE.RingGeometry(0.9, 1.0, 32, 1, 0, Math.PI * 2 / 3); 
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const arc = new THREE.Mesh(geo, mat);
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = -Math.PI / 3; // Center the arc forward
    arc.userData.time = i * 0.4;
    radarGroup.add(arc);
    radarArcs.push(arc);
}

// 🔦 Laser scan fan — 180° ray sweep to pick a clear sub-goal after collision
const scanLinesGroup = new THREE.Group();
scanLinesGroup.userData.sensorVisual = true;
robot.add(scanLinesGroup);
scanLinesGroup.position.set(0, 0, 1.0); 
const scanRaysCount = 13; // 13 Rays fan out during scan
const scanRays = [];
for (let i = 0; i < scanRaysCount; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    scanLinesGroup.add(line);
    scanRays.push(line);
}

// 💥 Collision marker — red X on impact point
const collisionMarkers = [];
function markCollision(position) {
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(0.8, 0.1, 0.2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const b1 = new THREE.Mesh(geo, mat);
    b1.rotation.y = Math.PI / 4;
    const b2 = new THREE.Mesh(geo, mat);
    b2.rotation.y = -Math.PI / 4;
    group.add(b1, b2);
    group.position.copy(position);
    group.position.y = 0.2; // Slightly above ground
    scene.add(group);
    collisionMarkers.push(group);
}


// 🎯 Interaction — click floor for waypoints or place physics objects
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let waypoints = [];
let waypointMarkers = [];
let pathFlowLine = null;
let pathGlowLine = null;
let mode = 'waypoints';
let animating = false;

const CLICK_DRAG_THRESHOLD = 8;
let pointerDownPos = null;
let pointerDownProp = null;
let isDraggingProp = false;
let dragProp = null;
let selectedProp = null;
let activePointerId = null;

// Move handle — bobs above selected / dragged object
const moveHandle = new THREE.Group();
moveHandle.visible = false;
scene.add(moveHandle);

(function buildMoveHandle() {
    const mat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 4), mat);
    ring.rotation.x = -Math.PI / 2;
    moveHandle.add(ring);

    const armGeo = new THREE.BoxGeometry(0.12, 0.12, 0.55);
    [[0, 0, 0.45], [0, 0, -0.45], [0.45, 0, 0], [-0.45, 0, 0]].forEach(([x, y, z]) => {
        const arm = new THREE.Mesh(armGeo, mat);
        arm.position.set(x, y, z);
        if (z === 0) arm.rotation.y = Math.PI / 2;
        moveHandle.add(arm);
    });

    const tipGeo = new THREE.ConeGeometry(0.18, 0.28, 4);
    [
        { pos: [0, 0, 0.72], rot: [Math.PI / 2, 0, 0] },
        { pos: [0, 0, -0.72], rot: [-Math.PI / 2, 0, 0] },
        { pos: [0.72, 0, 0], rot: [0, 0, -Math.PI / 2] },
        { pos: [-0.72, 0, 0], rot: [0, 0, Math.PI / 2] },
    ].forEach(({ pos, rot }) => {
        const tip = new THREE.Mesh(tipGeo, mat);
        tip.position.set(...pos);
        tip.rotation.set(...rot);
        moveHandle.add(tip);
    });
})();

function findPropFromMesh(object) {
    let node = object;
    while (node) {
        if (node.userData?.physicsProp) return node.userData.physicsProp;
        node = node.parent;
    }
    return null;
}

function raycastPropAt(clientX, clientY) {
    pointerToNdc(clientX, clientY);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(physicsProps.map((p) => p.mesh), false);
    if (!hits.length) return null;
    return findPropFromMesh(hits[0].object);
}

function setPropHighlight(prop, on) {
    if (!prop?.mesh?.material) return;
    const mat = prop.mesh.material;
    if (on) {
        if (prop._savedEmissive === undefined) {
            prop._savedEmissive = mat.emissive?.getHex?.() ?? 0x000000;
            prop._savedEmissiveIntensity = mat.emissiveIntensity ?? 0;
        }
        mat.emissive.setHex(0x115544);
        mat.emissiveIntensity = 0.55;
    } else if (prop._savedEmissive !== undefined) {
        mat.emissive.setHex(prop._savedEmissive);
        mat.emissiveIntensity = prop._savedEmissiveIntensity;
        prop._savedEmissive = undefined;
    }
}

function selectProp(prop) {
    if (selectedProp === prop) return;
    if (selectedProp) setPropHighlight(selectedProp, false);
    selectedProp = prop;
    if (prop) {
        setPropHighlight(prop, true);
        moveHandle.visible = true;
        if (mode === 'objects' && !animating) {
            statusEl.textContent = t('objectMoveHint');
        }
    } else {
        moveHandle.visible = false;
        updateModeUi();
    }
}

function deselectProp() {
    selectProp(null);
}

function beginPropDrag(prop) {
    dragProp = prop;
    prop.body.type = CANNON.Body.KINEMATIC;
    prop.body.velocity.set(0, 0, 0);
    prop.body.angularVelocity.set(0, 0, 0);
    controls.enabled = false;
    viewport.classList.add('dragging-prop');
    selectProp(prop);
}

function endPropDrag(clientX, clientY) {
    if (!dragProp) return;
    movePropToScreen(dragProp, clientX, clientY);
    dragProp.body.type = CANNON.Body.DYNAMIC;
    dragProp.body.velocity.set(0, 0, 0);
    dragProp.body.angularVelocity.set(0, 0, 0);
    addLog(t('logObjectMoved', {
        type: propTypeLabel(dragProp.type),
        x: dragProp.mesh.position.x.toFixed(1),
        z: dragProp.mesh.position.z.toFixed(1),
    }));
    dragProp = null;
    controls.enabled = true;
    viewport.classList.remove('dragging-prop');
}

function movePropToScreen(prop, clientX, clientY) {
    pointerToNdc(clientX, clientY);
    raycaster.setFromCamera(mouse, camera);
    const others = physicsProps.filter((p) => p !== prop).map((p) => p.mesh);
    const hits = raycaster.intersectObjects([plane, ...others, ...obstacles], false);
    if (!hits.length) return;

    const hit = hits[0];
    const halfH = PROP_HALF_HEIGHT[prop.type];
    const clamped = clampToArena(
        Math.round(hit.point.x * 2) / 2,
        Math.round(hit.point.z * 2) / 2,
    );
    const y = hit.point.y + halfH + 0.02;

    prop.mesh.position.set(clamped.x, y, clamped.z);
    prop.body.position.set(clamped.x, y, clamped.z);
    prop.body.velocity.set(0, 0, 0);
    prop.body.angularVelocity.set(0, 0, 0);
}

function updateMoveHandle(time) {
    if (!selectedProp && !dragProp) {
        moveHandle.visible = false;
        return;
    }
    const prop = dragProp || selectedProp;
    moveHandle.visible = true;
    prop.mesh.getWorldPosition(moveHandle.position);
    moveHandle.position.y += PROP_HALF_HEIGHT[prop.type] + 0.85 + Math.sin(time * 5) * 0.1;
    moveHandle.rotation.y = time * 2.2;
}

function updatePropHoverCursor(clientX, clientY) {
    if (isDraggingProp) {
        viewport.style.cursor = 'grabbing';
        return;
    }
    const prop = raycastPropAt(clientX, clientY);
    viewport.style.cursor = prop ? 'grab' : '';
}

const statusEl = document.getElementById('status');
const waypointHintEl = document.querySelector('.hint-waypoints');

function pointerToNdc(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

function updateModeUi() {
    document.querySelectorAll('#modeGroup .toggle-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    if (waypointHintEl) {
        waypointHintEl.classList.toggle('dimmed', mode === 'objects');
    }
    if (typeof statusEl === 'undefined') return;
    if (animating) return;
    if (mode === 'objects') {
        statusEl.textContent = t('modePlaceObjects');
    } else if (waypoints.length === 0) {
        statusEl.textContent = t('modeSetWaypoints');
    } else {
        statusEl.textContent = t('waypointsSet', { count: waypoints.length });
    }
}

function placeObjectAtScreen(clientX, clientY, objectType) {
    pointerToNdc(clientX, clientY);
    raycaster.setFromCamera(mouse, camera);

    const mass = parseFloat(document.getElementById('objectMass').value);
    const placementTargets = [plane, ...physicsProps.map((p) => p.mesh), ...obstacles];
    const hits = raycaster.intersectObjects(placementTargets, false);
    if (hits.length === 0) return false;

    const hit = hits[0];
    const halfH = PROP_HALF_HEIGHT[objectType];
    const rawX = Math.round(hit.point.x * 2) / 2;
    const rawZ = Math.round(hit.point.z * 2) / 2;
    const clamped = clampToArena(rawX, rawZ);
    const x = clamped.x;
    const z = clamped.z;
    const y = hit.point.y + halfH + 0.02;

    createPhysicsProp(objectType, x, y, z, mass);
    addLog(t('logObjectPlaced', {
        type: propTypeLabel(objectType),
        mass: mass.toFixed(1),
        x: x.toFixed(1),
        z: z.toFixed(1),
    }));
    return true;
}

function clampToArena(x, z) {
    return {
        x: Math.max(-BUILD_LIMIT, Math.min(BUILD_LIMIT, x)),
        z: Math.max(-BUILD_LIMIT, Math.min(BUILD_LIMIT, z)),
    };
}

function clampRobotPosition() {
    const c = clampToArena(robot.position.x, robot.position.z);
    robot.position.x = c.x;
    robot.position.z = c.z;
}
function disposePathLines() {
    [pathFlowLine, pathGlowLine].forEach((line) => {
        if (!line) return;
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
    });
    pathFlowLine = null;
    pathGlowLine = null;
}

function updatePathFlow() {
    disposePathLines();
    if (waypoints.length < 2) return;

    const points = waypoints.map((wp) => new THREE.Vector3(wp.x, 0.18, wp.z));

    pathGlowLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
            color: 0x00ffcc,
            transparent: true,
            opacity: 0.22,
        }),
    );
    scene.add(pathGlowLine);

    pathFlowLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
            color: 0x00ffcc,
            transparent: true,
            opacity: 0.95,
        }),
    );
    scene.add(pathFlowLine);
}

function addWaypointAtScreen(clientX, clientY) {
    if (mode !== 'waypoints' || animating) return false;

    pointerToNdc(clientX, clientY);
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObject(plane, false);
    if (hits.length === 0) return false;

    const point = hits[0].point;
    const clamped = clampToArena(Math.round(point.x), Math.round(point.z));

    waypoints.push({ x: clamped.x, z: clamped.z });
    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.32),
        new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    );
    marker.position.set(clamped.x, 0.5, clamped.z);
    scene.add(marker);
    waypointMarkers.push(marker);

    if (waypoints.length === 1) {
        robot.position.set(clamped.x, 0, clamped.z);
        syncRobotPhysicsBody();
    }

    updateWaypointColors();
    updatePathFlow();
    statusEl.textContent = t('waypointsSet', { count: waypoints.length });
    return true;
}

function updateWaypointColors() {
    waypointMarkers.forEach((marker, index) => {
        if (index === 0) {
            marker.material.color.setHex(0x00ff00);
        } else if (index === waypointMarkers.length - 1) {
            marker.material.color.setHex(0xff0000);
        } else {
            marker.material.color.setHex(0xffff00);
        }
    });
}

viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    pointerDownPos = { x: e.clientX, y: e.clientY };
    pointerDownProp = raycastPropAt(e.clientX, e.clientY);
    activePointerId = e.pointerId;
    if (pointerDownProp) {
        selectProp(pointerDownProp);
        e.preventDefault();
    }
});

viewport.addEventListener('pointermove', (e) => {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;

    if (pointerDownProp && pointerDownPos && !isDraggingProp) {
        const dx = e.clientX - pointerDownPos.x;
        const dy = e.clientY - pointerDownPos.y;
        if (Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD) {
            isDraggingProp = true;
            beginPropDrag(pointerDownProp);
        }
    }

    if (isDraggingProp && dragProp) {
        movePropToScreen(dragProp, e.clientX, e.clientY);
        e.preventDefault();
        return;
    }

    if (!pointerDownPos) {
        updatePropHoverCursor(e.clientX, e.clientY);
    }
});

viewport.addEventListener('pointerup', (e) => {
    if (e.button !== 0 || e.pointerId !== activePointerId) return;

    const dx = pointerDownPos ? e.clientX - pointerDownPos.x : 0;
    const dy = pointerDownPos ? e.clientY - pointerDownPos.y : 0;
    const shortClick = pointerDownPos && Math.hypot(dx, dy) <= CLICK_DRAG_THRESHOLD;

    if (isDraggingProp) {
        endPropDrag(e.clientX, e.clientY);
    } else if (shortClick && !pointerDownProp && mode === 'waypoints') {
        addWaypointAtScreen(e.clientX, e.clientY);
    } else if (shortClick && !pointerDownProp && mode === 'objects') {
        deselectProp();
    }

    pointerDownPos = null;
    pointerDownProp = null;
    isDraggingProp = false;
    activePointerId = null;
    viewport.style.cursor = '';
});

viewport.addEventListener('pointercancel', (e) => {
    if (isDraggingProp) endPropDrag(e.clientX, e.clientY);
    pointerDownPos = null;
    pointerDownProp = null;
    isDraggingProp = false;
    activePointerId = null;
    controls.enabled = true;
    viewport.classList.remove('dragging-prop');
    viewport.style.cursor = '';
});

renderer.domElement.style.touchAction = 'none';

// 🧠 Navigation — sensors + 5 algorithms (see nav.js)
let activeAlgo = 'pure_pursuit';
let navState = { mode: 'IDLE', bugSide: 1, bugStartDist: 0, lastLogAt: 0 };
let waypointsPassed = [];

const nav = createNavSystem({
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
});

const { sensorConfig, sensorSuite, computeNavCommand } = nav;
const collisionSys = sensorSuite;

const sensorStatusEl = document.getElementById('sensorStatus');

function sensorListLabel() {
    const parts = [];
    if (sensorConfig.lidar) parts.push('LIDAR');
    if (sensorConfig.ultrasonic) parts.push('US');
    if (sensorConfig.ir) parts.push('IR×3');
    return parts.join(', ');
}

function updateSensorStatus() {
    if (!sensorStatusEl) return;
    const list = sensorListLabel();
    sensorStatusEl.textContent = list
        ? t('sensorStatusActive', { list })
        : t('sensorStatusNone');
}

function applyMotion(v, omega, dt) {
    robot.rotation.y += omega * dt;
    const forward = new THREE.Vector3(0, 0, 1)
        .applyMatrix4(new THREE.Matrix4().extractRotation(robot.matrixWorld));
    robot.position.add(forward.multiplyScalar(v * dt));
    clampRobotPosition();
    const wheelSpin = v * dt * 2;
    if (Math.abs(omega) > 0.01) {
        wheels[0].rotation.x -= wheelSpin;
        wheels[2].rotation.x -= wheelSpin;
        wheels[1].rotation.x += wheelSpin;
        wheels[3].rotation.x += wheelSpin;
    } else {
        wheels.forEach((w) => { w.rotation.x -= wheelSpin; });
    }
}

function distToGoal(target) {
    return Math.hypot(target.x - robot.position.x, target.z - robot.position.z);
}

function checkWaypointMission() {
    if (pathIndex >= waypoints.length) return false;
    const target = waypoints[pathIndex];
    const dist = distToGoal(target);
    if (dist <= WP_ACCEPT_RADIUS) {
        if (!waypointsPassed[pathIndex]) {
            waypointsPassed[pathIndex] = true;
            addLog(t('logPassed', { index: pathIndex, dist: dist.toFixed(1) }));
            if (waypointMarkers[pathIndex]) {
                waypointMarkers[pathIndex].material.color.setHex(0x00ffcc);
            }
        }
        pathIndex++;
        if (pathIndex >= waypoints.length) {
            animating = false;
            navState.mode = 'IDLE';
            const passed = waypointsPassed.filter(Boolean).length;
            addLog(t('logDone', { passed, total: waypoints.length }));
            return false;
        }
    }
    return true;
}

// 📋 Telemetry log
const robotLog = [];
const logList = document.getElementById('logList');
function addLog(message) {
    const time = clock.getElapsedTime().toFixed(1);
    const pos = `[${robot.position.x.toFixed(1)}, ${robot.position.z.toFixed(1)}]`;
    const fullMessage = `${time}s ${pos}: ${message}`;
    robotLog.push({ time, pos, message });
    
    const li = document.createElement('li');
    li.innerText = fullMessage;
    logList.appendChild(li);
    logList.parentElement.scrollTop = logList.parentElement.scrollHeight;
    console.log(`[ROBOT LOG] ${fullMessage}`);
}

// 🎛️ UI wiring — start, reset, language, object panel
document.getElementById('startBtn').addEventListener('click', () => {
    if (waypoints.length < 2) {
        alert(t('alertNeedWaypoints'));
        return;
    }
    animating = true;
    pathIndex = 1;
    navState = { mode: 'TRACK', bugSide: 1, bugStartDist: 0, lastLogAt: 0 };
    waypointsPassed = new Array(waypoints.length).fill(false);
    waypointsPassed[0] = true;
    clock.start();
    logList.innerHTML = '';
    robotLog.length = 0;
    addLog(t('logInit', {
        algo: algoDisplayName(activeAlgo),
        sensors: sensorListLabel() || 'none',
        count: waypoints.length,
        radius: WP_ACCEPT_RADIUS,
    }));
});

document.getElementById('resetBtn').addEventListener('click', () => {
    waypointMarkers.forEach((m) => scene.remove(m));
    collisionMarkers.forEach((m) => scene.remove(m));
    waypointMarkers = [];
    collisionMarkers.length = 0;
    waypoints = [];
    waypointsPassed = [];
    disposePathLines();
    clearPhysicsProps();
    dragProp = null;
    isDraggingProp = false;
    pointerDownPos = null;
    pointerDownProp = null;
    activePointerId = null;
    controls.enabled = true;
    viewport.classList.remove('dragging-prop');
    viewport.style.cursor = '';
    animating = false;
    navState.mode = 'IDLE';
    mode = 'waypoints';
    statusEl.textContent = t('modeSetWaypoints');
    updateModeUi();
    robot.position.set(0, 0, 0);
    robot.rotation.set(0, 0, 0);
    syncRobotPhysicsBody();
});

const clock = new THREE.Clock();
let pathIndex = 1;
let selectedObjectType = 'sphere';

['sensorLidar', 'sensorUltrasonic', 'sensorIr'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const keyMap = { sensorlidar: 'lidar', sensorultrasonic: 'ultrasonic', sensorir: 'ir' };
    const key = keyMap[id.toLowerCase()];
    el.checked = sensorConfig[key];
    el.addEventListener('change', () => {
        sensorConfig[key] = el.checked;
        updateSensorStatus();
    });
});

document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-btn').forEach((b) => {
            b.classList.toggle('active', b === btn);
        });
        applyLanguage(btn.dataset.lang);
        updateSensorStatus();
    });
});

document.querySelectorAll('#algoGroup .toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        activeAlgo = btn.dataset.algo;
        document.querySelectorAll('#algoGroup .toggle-btn').forEach((b) => {
            b.classList.toggle('active', b === btn);
        });
    });
});

document.querySelectorAll('#modeGroup .toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        mode = btn.dataset.mode;
        updateModeUi();
    });
});

document.querySelectorAll('.drag-item').forEach((item) => {
    item.addEventListener('dragstart', (e) => {
        selectedObjectType = item.dataset.type;
        e.dataTransfer.setData('application/x-prop-type', item.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
        item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        viewport.classList.remove('drop-active');
    });
});

viewport.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    viewport.classList.add('drop-active');
});

viewport.addEventListener('dragleave', (e) => {
    if (!viewport.contains(e.relatedTarget)) {
        viewport.classList.remove('drop-active');
    }
});

viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    viewport.classList.remove('drop-active');
    const objectType = e.dataTransfer.getData('application/x-prop-type') || selectedObjectType;
    if (!objectType) return;
    if (placeObjectAtScreen(e.clientX, e.clientY, objectType)) {
        updateModeUi();
    }
});

const massSlider = document.getElementById('objectMass');
const massValueEl = document.getElementById('massValue');

massSlider.addEventListener('input', (e) => {
    massValueEl.textContent = parseFloat(e.target.value).toFixed(1);
});

document.getElementById('clearObjectsBtn').addEventListener('click', () => {
    clearPhysicsProps();
});

applyLanguage(currentLang);
updateModeUi();
updateSensorStatus();
syncRobotPhysicsBody();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    const dt = Math.min(clock.getDelta(), 0.05);

    stepPhysics(dt);
    applyRobotPushImpulse(dt);

    radarArcs.forEach((arc) => {
        if (!sensorConfig.ultrasonic && !sensorConfig.ir) {
            arc.material.opacity = 0;
            return;
        }
        arc.userData.time += dt;
        const localT = (arc.userData.time % 1.2) / 1.2;
        arc.scale.setScalar(1 + localT * 2);
        arc.material.opacity = (1 - localT) * 0.6;
    });

    const placingPath = mode === 'waypoints' && !animating;
    robotGlowRing.visible = placingPath;
    if (placingPath) {
        robotGlowRing.material.opacity = 0.25 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
    }
    if (pathFlowLine && placingPath) {
        pathFlowLine.material.opacity = 0.7 + Math.sin(clock.getElapsedTime() * 3) * 0.25;
    }

    if (animating && waypoints.length > 1) {
        checkWaypointMission();
    }

    if (animating && waypoints.length > 1 && pathIndex < waypoints.length) {
        const target = waypoints[pathIndex];
        const reading = sensorSuite.read();
        sensorSuite.updateLidarVisuals(reading);

        if (sensorSuite.isPhysicalCollision()) {
            markCollision(robot.position.clone());
        }

        const cmd = computeNavCommand(
            activeAlgo,
            target,
            reading,
            navState,
            waypoints[0],
        );
        applyMotion(cmd.v, cmd.omega, dt);

        if (activeAlgo === 'bug2' && navState.mode === 'BUG_FOLLOW') {
            const now = clock.getElapsedTime();
            if (now - navState.lastLogAt > 2) {
                navState.lastLogAt = now;
                addLog(t('logBug2', { side: navState.bugSide > 0 ? 'R' : 'L' }));
            }
        }
    } else if (!animating) {
        scanRays.forEach((r) => { r.material.opacity = 0; });
        clock.getDelta();
    }

    updateMoveHandle(clock.getElapsedTime());

    renderer.render(scene, camera);
}

animate();
