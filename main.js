// 🥑 Robot Path Follower Tester
// 🛞 Fast browser sandbox to simulate follow algorithms on a 4-wheel robot.
// 🌍 EN/ES UI · 🤖 Three.js scene · 📡 sensors · 🧠 Bug0 / avoidance / wander

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNavSystem } from './nav.js';

const BUILD_STAMP = '08192026 740';

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
        algoCustom: 'Custom (JS pad)',
        customPadTitle: 'Custom JS',
        customSetupLabel: 'void setup — robot API (read-only)',
        customLoopLabel: 'loop() — assign v and omega',
        customCheckBtn: 'Check',
        customSaveBtn: 'Save',
        customPadClose: 'Close',
        customCheckOk: 'Check OK — robot vars + Math + draw',
        customCheckFail: 'Check failed: {msg}',
        customSaved: 'Saved',
        customSetupCopied: 'Copied',
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
        waypointHint: 'Floor: drag = rotate/zoom camera · short click = add waypoint. Rover/objects: click+hold+drag to move.',
        pathFlowHint: 'Green glow = rover start · cyan line = path to waypoints',
        modeSetWaypoints: 'Current Mode: Set Waypoints',
        waypointsSet: 'Waypoints Set: {count}',
        telemetryLog: 'Telemetry Log',
        copyLogBtn: 'Copy',
        exportTelemetryJson: 'Export JSON',
        exportTelemetryCsv: 'Export CSV',
        logCopied: 'Copied',
        alertNeedWaypoints: 'Place at least one waypoint on the floor (rover position = start).',
        logInit: 'INIT: {algo} · {sensors} · {count} waypoints · accept radius {radius}m',
        logPassed: 'PASSED: Waypoint {index} (within {dist}m)',
        logSkipped: 'SKIPPED: Waypoint {index} unreachable (purple) — continuing',
        logDone: 'DONE: Mission complete. Passed {passed}/{total} · skipped {skipped}',
        logAvoid: 'AVOID: Obstacle at {dist}m — {action}',
        logBug2: 'BUG2: Following boundary ({side})',
        logDwa: 'DWA: v={v} ω={w}',
        algoNamePurePursuit: 'Pure Pursuit',
        algoNameBug2: 'Bug2',
        algoNameDwa: 'DWA',
        algoNameVfh: 'VFH',
        algoNamePotential: 'Potential Field',
        algoNameCustom: 'Custom (JS hook)',
        interactionModeLabel: 'Interaction Mode:',
        modeWaypoints: 'Set Waypoints',
        modeObjects: 'Place Physics Objects',
        objectTypeLabel: 'Object Type:',
        objSphere: 'Sphere',
        objBox: 'Cube',
        objCylinder: 'Cylinder',
        objectMassLabel: 'Weight (kg):',
        clearObjectsBtn: 'Clear Objects',
        moveObjectsLabel: 'Move objects (hold+drag)',
        moveObjectsHint: 'When on: drag scene objects only. Rover and waypoints disabled.',
        modeMoveObjects: 'Move objects mode — drag props in the scene',
        objectHint: 'Drag from palette to place. Enable move mode to reposition objects.',
        objectMoveHint: 'Hold and drag to move — release to drop',
        roverSelectedHint: 'Rover selected — hold+drag to move, then short-click floor for waypoints',
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
        algoCustom: 'Custom (gancho JS)',
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
        waypointHint: 'Suelo: arrastrar = girar/zoom · clic corto = waypoint. Rover/objetos: mantén clic y arrastra.',
        pathFlowHint: 'Brillo verde = inicio del rover · línea cyan = ruta a waypoints',
        modeSetWaypoints: 'Modo actual: Colocar waypoints',
        waypointsSet: 'Waypoints colocados: {count}',
        telemetryLog: 'Registro de Telemetría',
        copyLogBtn: 'Copiar',
        exportTelemetryJson: 'Exportar JSON',
        exportTelemetryCsv: 'Exportar CSV',
        logCopied: 'Copiado',
        alertNeedWaypoints: 'Coloca al menos un waypoint en el suelo (posición del rover = inicio).',
        logInit: 'INICIO: {algo} · {sensors} · {count} waypoints · radio {radius}m',
        logPassed: 'PASADO: Waypoint {index} (a {dist}m)',
        logSkipped: 'OMITIDO: Waypoint {index} inalcanzable (morado) — continúa',
        logDone: 'FIN: Misión completa. Pasados {passed}/{total} · omitidos {skipped}',
        logAvoid: 'EVITAR: Obstáculo a {dist}m — {action}',
        logBug2: 'BUG2: Siguiendo contorno ({side})',
        logDwa: 'DWA: v={v} ω={w}',
        algoNamePurePursuit: 'Pure Pursuit',
        algoNameBug2: 'Bug2',
        algoNameDwa: 'DWA',
        algoNameVfh: 'VFH',
        algoNamePotential: 'Campo Potencial',
        algoNameCustom: 'Custom (gancho JS)',
        interactionModeLabel: 'Modo de interacción:',
        modeWaypoints: 'Colocar waypoints',
        modeObjects: 'Colocar objetos físicos',
        objectTypeLabel: 'Tipo de objeto:',
        objSphere: 'Esfera',
        objBox: 'Cubo',
        objCylinder: 'Cilindro',
        objectMassLabel: 'Peso (kg):',
        clearObjectsBtn: 'Quitar objetos',
        moveObjectsLabel: 'Mover objetos (mantén+arrastra)',
        moveObjectsHint: 'Activo: solo arrastrar objetos. Rover y waypoints desactivados.',
        modeMoveObjects: 'Modo mover objetos — arrastra props en escena',
        objectHint: 'Arrastra del panel para colocar. Activa mover para reposicionar objetos.',
        objectMoveHint: 'Mantén y arrastra — suelta para soltar',
        roverSelectedHint: 'Rover seleccionado — mantén+arrastra para mover, luego clic corto en suelo para waypoints',
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
        custom: t('algoNameCustom'),
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
const WP_ACCEPT_RADIUS = 1.5;

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
physicsWorld.addContactMaterial(new CANNON.ContactMaterial(robotMaterial, groundMaterial, {
    friction: 0.40,
    restitution: 0,
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
        1.20,
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

const HIT_PIXELS = 5;
let lastHitTest = { clear: 1, object: null };

function hitInsetMeters() {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width < 2) return 0.08;
    const origin = new THREE.Vector3(robot.position.x, 0.50, robot.position.z);
    origin.project(camera);
    const ndc = (HIT_PIXELS * 2) / rect.width;
    const shifted = origin.clone();
    shifted.x += ndc;
    shifted.unproject(camera);
    origin.unproject(camera);
    const meters = Math.hypot(shifted.x - origin.x, shifted.z - origin.z);
    if (meters < 0.04) return 0.04;
    if (meters > 0.25) return 0.25;
    return meters;
}

function roverFootprintCorners(x, z, rotY, inset) {
    const hw = 1.20 - inset;
    const hl = ROBOT_COLLISION.halfLength - inset;
    const rightX = Math.cos(rotY);
    const rightZ = -Math.sin(rotY);
    const fwdX = Math.sin(rotY);
    const fwdZ = Math.cos(rotY);
    const sx = [1, 1, -1, -1];
    const sz = [1, -1, -1, 1];
    const corners = [];
    for (let i = 0; i < 4; i++) {
        corners.push({
            x: x + rightX * hw * sx[i] + fwdX * hl * sz[i],
            z: z + rightZ * hw * sx[i] + fwdZ * hl * sz[i],
        });
    }
    return corners;
}

function boxCorners2d(box) {
    return [
        { x: box.min.x, z: box.min.z },
        { x: box.max.x, z: box.min.z },
        { x: box.max.x, z: box.max.z },
        { x: box.min.x, z: box.max.z },
    ];
}

function projectSpan(corners, ax, az) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < corners.length; i++) {
        const p = corners[i].x * ax + corners[i].z * az;
        if (p < min) min = p;
        if (p > max) max = p;
    }
    return { min, max };
}

function polygonsOverlap(a, b) {
    const axes = [
        { x: a[1].x - a[0].x, z: a[1].z - a[0].z },
        { x: a[3].x - a[0].x, z: a[3].z - a[0].z },
        { x: b[1].x - b[0].x, z: b[1].z - b[0].z },
        { x: b[3].x - b[0].x, z: b[3].z - b[0].z },
    ];
    for (let i = 0; i < axes.length; i++) {
        const len = Math.hypot(axes[i].x, axes[i].z) || 1;
        const ax = axes[i].x / len;
        const az = axes[i].z / len;
        const pa = projectSpan(a, ax, az);
        const pb = projectSpan(b, ax, az);
        if (pa.max < pb.min || pb.max < pa.min) return 0;
    }
    return 1;
}

function getRobotCollisionBox(target = new THREE.Box3()) {
    const inset = hitInsetMeters();
    const c = roverFootprintCorners(robot.position.x, robot.position.z, robot.rotation.y, inset);
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < c.length; i++) {
        if (c[i].x < minX) minX = c[i].x;
        if (c[i].x > maxX) maxX = c[i].x;
        if (c[i].z < minZ) minZ = c[i].z;
        if (c[i].z > maxZ) maxZ = c[i].z;
    }
    target.min.set(minX, 0, minZ);
    target.max.set(maxX, ROBOT_COLLISION.centerY + ROBOT_COLLISION.halfHeight, maxZ);
    return target;
}

function queryPose(x, z, rotY) {
    const inset = hitInsetMeters();
    const rover = roverFootprintCorners(x, z, rotY, inset);
    const box = new THREE.Box3();

    for (let i = 0; i < obstacles.length; i++) {
        box.setFromObject(obstacles[i]);
        if (polygonsOverlap(rover, boxCorners2d(box))) {
            lastHitTest = {
                clear: 0,
                kind: 'cone',
                id: i,
                x: Number(obstacles[i].position.x.toFixed(2)),
                z: Number(obstacles[i].position.z.toFixed(2)),
            };
            return lastHitTest;
        }
    }
    for (let i = 0; i < physicsProps.length; i++) {
        const prop = physicsProps[i];
        box.setFromObject(prop.mesh);
        if (polygonsOverlap(rover, boxCorners2d(box))) {
            lastHitTest = {
                clear: 0,
                kind: prop.type,
                id: i,
                x: Number(prop.mesh.position.x.toFixed(2)),
                z: Number(prop.mesh.position.z.toFixed(2)),
            };
            return lastHitTest;
        }
    }
    lastHitTest = { clear: 1, kind: null, id: -1, x: null, z: null };
    return lastHitTest;
}

function robotIntersectsObstaclesAt(x, z, rotY) {
    return queryPose(x, z, rotY).clear === 0;
}

function depenetrateRobot() {
    const hit = queryPose(robot.position.x, robot.position.z, robot.rotation.y);
    if (hit.clear) return 0;
    const step = hitInsetMeters();
    const dx = robot.position.x - (hit.x ?? robot.position.x);
    const dz = robot.position.z - (hit.z ?? robot.position.z);
    const mag = Math.hypot(dx, dz) || 1;
    for (let n = 1; n <= 8; n++) {
        const nx = robot.position.x + (dx / mag) * step * n;
        const nz = robot.position.z + (dz / mag) * step * n;
        if (queryPose(nx, nz, robot.rotation.y).clear) {
            robot.position.x = nx;
            robot.position.z = nz;
            clampRobotPosition();
            syncRobotPhysicsBody();
            return 1;
        }
    }
    return 1;
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

// 📡 Sensor drawing — LIDAR on top, IR bumper rectangle, ultrasonic conoid
const radarGroup = new THREE.Group();
radarGroup.userData.sensorVisual = true;
robot.add(radarGroup);
radarGroup.position.set(0, 0.08, 0);
const radarArcs = [];

const irBand = new THREE.Mesh(
    new THREE.BoxGeometry(2.00, 0.04, 2.00),
    new THREE.MeshBasicMaterial({
        color: 0xffcc44,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
    }),
);
irBand.position.set(0, 0.06, 2.50);
radarGroup.add(irBand);

const usCone = new THREE.Mesh(
    new THREE.ConeGeometry(1.40, 4.00, 24, 1, true),
    new THREE.MeshBasicMaterial({
        color: 0x44ddff,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        side: THREE.DoubleSide,
    }),
);
usCone.rotation.x = Math.PI / 2;
usCone.position.set(0, 0.20, 3.50);
radarGroup.add(usCone);

const scanLinesGroup = new THREE.Group();
scanLinesGroup.userData.sensorVisual = true;
robot.add(scanLinesGroup);
scanLinesGroup.position.set(0, 1.35, 0);
const scanRaysCount = 13;
const scanRays = [];
for (let i = 0; i < scanRaysCount; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0),
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
let animating = 0;
let pathIndex = 0;
let moveObjectsMode = 0;

const CLICK_DRAG_THRESHOLD = 12;
let pointerDownPos = null;
let gestureTarget = null; // 'floor' | 'prop' | 'robot' | null
let gestureProp = null;
let isDraggingProp = 0;
let isDraggingRobot = 0;
let dragProp = null;
let selectedProp = null;
let robotSelected = 0;
let activePointerId = null;
let dragGrabOffset = null;
let dragPlaneY = 0;

const interactionCanvas = () => renderer.domElement;

// Called synchronously inside the same pointerdown/pointerup handler that
// owns pointerId, so the capture/release call is always valid — no
// try/catch needed to swallow an exception that shouldn't occur here.
function capturePointerSafe(pointerId) {
    interactionCanvas().setPointerCapture(pointerId);
}

function releasePointerSafe(pointerId) {
    const canvas = interactionCanvas();
    if (canvas.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId);
    }
}

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

function pickSceneTarget(clientX, clientY) {
    pointerToNdc(clientX, clientY);
    raycaster.setFromCamera(mouse, camera);

    if (physicsProps.length > 0) {
        const propHits = raycaster.intersectObjects(physicsProps.map((p) => p.mesh), false);
        if (propHits.length > 0) {
            return {
                type: 'prop',
                prop: findPropFromMesh(propHits[0].object),
                point: propHits[0].point,
            };
        }
    }

    if (!moveObjectsMode) {
        const robotHits = raycaster.intersectObject(robot, true);
        if (robotHits.length > 0) {
            return { type: 'robot', point: robotHits[0].point };
        }
    }

    const floorHits = raycaster.intersectObject(plane, false);
    if (floorHits.length > 0) {
        return { type: 'floor', point: floorHits[0].point };
    }

    return { type: 'none' };
}

function raycastWaypointHit(clientX, clientY) {
    pointerToNdc(clientX, clientY);
    raycaster.setFromCamera(mouse, camera);
    const targets = [
        ...physicsProps.map((p) => p.mesh),
        ...obstacles,
        plane,
    ];
    const hits = raycaster.intersectObjects(targets, false);
    return hits.length > 0 ? hits[0] : null;
}

function raycastPropAt(clientX, clientY) {
    const pick = pickSceneTarget(clientX, clientY);
    return pick.type === 'prop' ? pick.prop : null;
}

function raycastRobotAt(clientX, clientY) {
    return pickSceneTarget(clientX, clientY).type === 'robot';
}

function setRobotSelected(on) {
    robotSelected = on;
    if (robotSelected && mode === 'waypoints' && !animating) {
        statusEl.textContent = t('roverSelectedHint');
    } else if (!robotSelected) {
        updateModeUi();
    }
}

function raycastDragPlane(clientX, clientY, planeY, target = new THREE.Vector3()) {
    pointerToNdc(clientX, clientY);
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
    return raycaster.ray.intersectPlane(plane, target) ? target : null;
}

function computeGrabOffset(clientX, clientY, objX, objZ, planeY) {
    const hit = raycastDragPlane(clientX, clientY, planeY);
    if (!hit) return new THREE.Vector3();
    return new THREE.Vector3(objX - hit.x, 0, objZ - hit.z);
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

function beginPropDrag(prop, clientX, clientY, pointerId) {
    dragProp = prop;
    dragPlaneY = prop.mesh.position.y;
    dragGrabOffset = computeGrabOffset(
        clientX,
        clientY,
        prop.mesh.position.x,
        prop.mesh.position.z,
        dragPlaneY,
    );
    prop.body.type = CANNON.Body.KINEMATIC;
    prop.body.velocity.set(0, 0, 0);
    prop.body.angularVelocity.set(0, 0, 0);
    controls.enabled = false;
    viewport.classList.add('dragging-prop');
    selectProp(prop);
    capturePointerSafe(pointerId);
}

function beginRobotDrag(clientX, clientY, pointerId) {
    isDraggingRobot = 1;
    dragPlaneY = robot.position.y;
    dragGrabOffset = computeGrabOffset(
        clientX,
        clientY,
        robot.position.x,
        robot.position.z,
        dragPlaneY,
    );
    controls.enabled = false;
    viewport.classList.add('dragging-prop');
    capturePointerSafe(pointerId);
}

function endPropDrag(clientX, clientY, snapGrid = true) {
    if (!dragProp) return;
    movePropOnPlane(dragProp, clientX, clientY, snapGrid);
    dragProp.body.type = CANNON.Body.DYNAMIC;
    dragProp.body.velocity.set(0, 0, 0);
    dragProp.body.angularVelocity.set(0, 0, 0);
    addLog(t('logObjectMoved', {
        type: propTypeLabel(dragProp.type),
        x: dragProp.mesh.position.x.toFixed(1),
        z: dragProp.mesh.position.z.toFixed(1),
    }));
    dragProp = null;
    dragGrabOffset = null;
    controls.enabled = true;
    viewport.classList.remove('dragging-prop');
}

function endRobotDrag(clientX, clientY, snapGrid = true) {
    if (!isDraggingRobot) return;
    moveRobotOnPlane(clientX, clientY, snapGrid);
    syncRobotPhysicsBody();
    isDraggingRobot = 0;
    dragGrabOffset = null;
    controls.enabled = true;
    viewport.classList.remove('dragging-prop');
}

function movePropOnPlane(prop, clientX, clientY, snapGrid = false) {
    const hit = raycastDragPlane(clientX, clientY, dragPlaneY);
    if (!hit) return;

    const offset = dragGrabOffset || new THREE.Vector3();
    let x = hit.x + offset.x;
    let z = hit.z + offset.z;
    if (snapGrid) {
        x = Math.round(x * 2) / 2;
        z = Math.round(z * 2) / 2;
    }
    const clamped = clampToArena(x, z);
    const y = prop.mesh.position.y;

    prop.mesh.position.set(clamped.x, y, clamped.z);
    prop.body.position.set(clamped.x, y, clamped.z);
    prop.body.velocity.set(0, 0, 0);
    prop.body.angularVelocity.set(0, 0, 0);
}

function moveRobotOnPlane(clientX, clientY, snapGrid = false) {
    const hit = raycastDragPlane(clientX, clientY, dragPlaneY);
    if (!hit) return;

    const offset = dragGrabOffset || new THREE.Vector3();
    let x = hit.x + offset.x;
    let z = hit.z + offset.z;
    if (snapGrid) {
        x = Math.round(x);
        z = Math.round(z);
    }
    const clamped = clampToArena(x, z);
    robot.position.set(clamped.x, robot.position.y, clamped.z);
}

function movePropToScreen(prop, clientX, clientY) {
    movePropOnPlane(prop, clientX, clientY, false);
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
    if (moveObjectsMode) {
        statusEl.textContent = t('modeMoveObjects');
    } else if (mode === 'objects') {
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
    if (waypoints.length < 1) return;

    const points = [
        new THREE.Vector3(robot.position.x, 0.18, robot.position.z),
        ...waypoints.map((wp) => new THREE.Vector3(wp.x, 0.18, wp.z)),
    ];

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
    if (moveObjectsMode || mode !== 'waypoints' || animating) return false;

    const hit = raycastWaypointHit(clientX, clientY);
    if (!hit) return false;

    const prop = findPropFromMesh(hit.object);
    const onObstacle = prop || obstacles.includes(hit.object);
    let wx = hit.point.x;
    let wz = hit.point.z;
    let wy = 0.5;

    if (onObstacle) {
        _obsBoxProbe.setFromObject(hit.object);
        wy = _obsBoxProbe.max.y + 0.35;
        wx = Math.round(wx * 2) / 2;
        wz = Math.round(wz * 2) / 2;
    } else {
        wx = Math.round(wx);
        wz = Math.round(wz);
    }

    const clamped = clampToArena(wx, wz);

    waypoints.push({ x: clamped.x, z: clamped.z });
    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.32),
        new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    );
    marker.position.set(clamped.x, wy, clamped.z);
    scene.add(marker);
    waypointMarkers.push(marker);

    updateWaypointColors();
    updatePathFlow();
    statusEl.textContent = t('waypointsSet', { count: waypoints.length });
    return true;
}

function updateWaypointColors() {
    waypointMarkers.forEach((marker, index) => {
        if (index === waypointMarkers.length - 1) {
            marker.material.color.setHex(0xff0000);
        } else {
            marker.material.color.setHex(0xffff00);
        }
    });
}

function resetGestureState() {
    pointerDownPos = null;
    gestureTarget = null;
    gestureProp = null;
    isDraggingProp = 0;
    isDraggingRobot = 0;
    activePointerId = null;
    dragGrabOffset = null;
    controls.enabled = true;
    interactionCanvas().style.cursor = '';
    viewport.classList.remove('dragging-prop');
}

function onPointerDown(e) {
    if (e.button !== 0 || animating) return;

    pointerDownPos = { x: e.clientX, y: e.clientY };
    activePointerId = e.pointerId;

    if (moveObjectsMode) {
        const prop = raycastPropAt(e.clientX, e.clientY);
        if (prop) {
            gestureTarget = 'prop';
            gestureProp = prop;
            selectProp(prop);
            controls.enabled = false;
            e.preventDefault();
            e.stopPropagation();
        } else {
            gestureTarget = 'floor';
            gestureProp = null;
            controls.enabled = true;
        }
        return;
    }

    const pick = pickSceneTarget(e.clientX, e.clientY);
    gestureTarget = pick.type;
    gestureProp = pick.prop ?? null;

    if (pick.type === 'prop') {
        selectProp(pick.prop);
        setRobotSelected(0);
        controls.enabled = false;
        e.preventDefault();
        e.stopPropagation();
    } else if (pick.type === 'robot') {
        deselectProp();
        setRobotSelected(1);
        controls.enabled = false;
        e.preventDefault();
        e.stopPropagation();
    } else if (pick.type === 'floor') {
        controls.enabled = true;
    }
}

function onPointerMove(e) {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;

    if (gestureTarget === 'prop' && gestureProp && pointerDownPos && !isDraggingProp) {
        const dx = e.clientX - pointerDownPos.x;
        const dy = e.clientY - pointerDownPos.y;
        if (Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD) {
            isDraggingProp = 1;
            beginPropDrag(gestureProp, e.clientX, e.clientY, e.pointerId);
        }
    } else if (!moveObjectsMode && gestureTarget === 'robot' && pointerDownPos && !isDraggingRobot) {
        const dx = e.clientX - pointerDownPos.x;
        const dy = e.clientY - pointerDownPos.y;
        if (Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD) {
            beginRobotDrag(e.clientX, e.clientY, e.pointerId);
        }
    }

    if (isDraggingProp && dragProp) {
        movePropOnPlane(dragProp, e.clientX, e.clientY, false);
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    if (isDraggingRobot) {
        moveRobotOnPlane(e.clientX, e.clientY, false);
        updatePathFlow();
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    if (!pointerDownPos) {
        updateHoverCursor(e.clientX, e.clientY);
    }
}

function onPointerUp(e) {
    if (e.button !== 0 || e.pointerId !== activePointerId) return;

    const dx = pointerDownPos ? e.clientX - pointerDownPos.x : 0;
    const dy = pointerDownPos ? e.clientY - pointerDownPos.y : 0;
    const wasDrag = Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD;
    const shortClick = pointerDownPos && !wasDrag;

    releasePointerSafe(e.pointerId);

    if (isDraggingProp) {
        endPropDrag(e.clientX, e.clientY, true);
    } else if (isDraggingRobot) {
        endRobotDrag(e.clientX, e.clientY, true);
        updatePathFlow();
    } else if (shortClick && !moveObjectsMode && gestureTarget === 'floor' && mode === 'waypoints') {
        addWaypointAtScreen(e.clientX, e.clientY);
    } else if (shortClick && !moveObjectsMode && gestureTarget === 'floor' && mode === 'objects') {
        deselectProp();
        setRobotSelected(0);
    } else if (shortClick && !moveObjectsMode && gestureTarget === 'prop') {
        selectProp(gestureProp);
    } else if (shortClick && !moveObjectsMode && gestureTarget === 'robot') {
        setRobotSelected(1);
    }

    resetGestureState();
}

function onPointerCancel(e) {
    releasePointerSafe(e.pointerId);
    if (isDraggingProp) endPropDrag(e.clientX, e.clientY, true);
    if (isDraggingRobot) {
        endRobotDrag(e.clientX, e.clientY, true);
        updatePathFlow();
    }
    dragProp = null;
    resetGestureState();
}

function updateHoverCursor(clientX, clientY) {
    if (isDraggingProp || isDraggingRobot) {
        interactionCanvas().style.cursor = 'grabbing';
        return;
    }
    if (moveObjectsMode) {
        interactionCanvas().style.cursor = raycastPropAt(clientX, clientY) ? 'grab' : '';
        return;
    }
    const pick = pickSceneTarget(clientX, clientY);
    if (pick.type === 'prop' || pick.type === 'robot') {
        interactionCanvas().style.cursor = 'grab';
    } else {
        interactionCanvas().style.cursor = '';
    }
}

interactionCanvas().addEventListener('pointerdown', onPointerDown, true);
interactionCanvas().addEventListener('pointermove', onPointerMove);
interactionCanvas().addEventListener('pointerup', onPointerUp);
interactionCanvas().addEventListener('pointercancel', onPointerCancel);
interactionCanvas().style.touchAction = 'none';

// 🧠 Navigation — sensors + 5 algorithms (see nav.js)
let activeAlgo = 'pure_pursuit';
let navState = {
    mode: 'IDLE',
    bugSide: 1,
    bugStartDist: 0,
    lastLogAt: 0,
    roseMode: 0,
    roseSide: 1,
    roseStartX: 0,
    roseStartZ: 0,
    roseLastX: 0,
    roseLastZ: 0,
    roseDistance: 0,
    forceRose: 0,
    roseCircuits: 0,
    roseLeftStart: 0,
};
let waypointsPassed = [];
let missionStart = { x: 0, z: 0 };

const nav = createNavSystem({
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
    const rot0 = robot.rotation.y;
    const rot1 = rot0 + omega * dt;
    const x0 = robot.position.x;
    const z0 = robot.position.z;
    const fwdX = Math.sin(rot1);
    const fwdZ = Math.cos(rot1);
    const xFull = x0 + fwdX * v * dt;
    const zFull = z0 + fwdZ * v * dt;

    robot.rotation.y = rot1;

    if (queryPose(xFull, zFull, rot1).clear) {
        robot.position.x = xFull;
        robot.position.z = zFull;
    } else {
        depenetrateRobot();
    }
    clampRobotPosition();
    syncRobotPhysicsBody();

    const wheelSpin = v * dt * 2;
    if (Math.abs(omega) > 0.01) {
        wheels[0].rotation.x -= wheelSpin;
        wheels[2].rotation.x -= wheelSpin;
        wheels[1].rotation.x += wheelSpin;
        wheels[3].rotation.x += wheelSpin;
    } else {
        wheels.forEach((w) => { w.rotation.x -= wheelSpin; });
    }

    const requestedDistance = Math.abs(v * dt);
    const actualDistance = Math.hypot(robot.position.x - x0, robot.position.z - z0);
    if (requestedDistance > 0.01 && actualDistance < requestedDistance * 0.10) return 1;
    return 0;
}

function distToGoal(target) {
    return Math.hypot(target.x - robot.position.x, target.z - robot.position.z);
}

function resetNavForWaypoint() {
    navState.mode = 'TRACK';
    navState.bugStartDist = 0;
    navState.roseMode = 0;
    navState.roseDistance = 0;
    navState.roseStartX = robot.position.x;
    navState.roseStartZ = robot.position.z;
    navState.roseLastX = robot.position.x;
    navState.roseLastZ = robot.position.z;
    navState.forceRose = 0;
    navState.roseCircuits = 0;
    navState.roseLeftStart = 0;
}

function skipUnreachableWaypoint() {
    const idx = pathIndex;
    if (waypointMarkers[idx]) {
        waypointMarkers[idx].material.color.setHex(0xaa44ff);
    }
    waypointsPassed[idx] = 'skipped';
    addLog(t('logSkipped', { index: idx }));
    pathIndex++;
    resetNavForWaypoint();
    if (pathIndex >= waypoints.length) {
        animating = 0;
        navState.mode = 'IDLE';
        const passed = waypointsPassed.filter((v) => v === 1).length;
        const skipped = waypointsPassed.filter((v) => v === 'skipped').length;
        addLog(t('logDone', { passed, skipped, total: waypoints.length }));
    }
}

function checkWaypointMission() {
    if (pathIndex >= waypoints.length) return false;
    const target = waypoints[pathIndex];
    const dist = distToGoal(target);
    if (dist <= WP_ACCEPT_RADIUS) {
        if (!waypointsPassed[pathIndex]) {
            waypointsPassed[pathIndex] = 1;
            addLog(t('logPassed', { index: pathIndex, dist: dist.toFixed(2) }));
            if (waypointMarkers[pathIndex]) {
                waypointMarkers[pathIndex].material.color.setHex(0x00ffcc);
            }
        }
        pathIndex++;
        resetNavForWaypoint();
        if (pathIndex >= waypoints.length) {
            animating = 0;
            navState.mode = 'IDLE';
            const passed = waypointsPassed.filter((v) => v === 1).length;
            const skipped = waypointsPassed.filter((v) => v === 'skipped').length;
            addLog(t('logDone', { passed, skipped, total: waypoints.length }));
            return false;
        }
    }
    return true;
}

// 📋 Telemetry log
const robotLog = [];
const missionTelemetry = [];
let lastTelemetryAt = -2.00;
window.missionTelemetry = missionTelemetry;
const logList = document.getElementById('logList');

function collectTelemetryObjects() {
    const list = [];
    for (let i = 0; i < obstacles.length; i++) {
        list.push({
            kind: 'cone',
            id: i,
            x: telemetryNumber(obstacles[i].position.x),
            z: telemetryNumber(obstacles[i].position.z),
            blocking: lastHitTest.clear === 0 && lastHitTest.kind === 'cone' && lastHitTest.id === i ? 1 : 0,
        });
    }
    for (let i = 0; i < physicsProps.length; i++) {
        const p = physicsProps[i];
        list.push({
            kind: p.type,
            id: i,
            x: telemetryNumber(p.mesh.position.x),
            z: telemetryNumber(p.mesh.position.z),
            blocking: lastHitTest.clear === 0 && lastHitTest.kind === p.type && lastHitTest.id === i ? 1 : 0,
        });
    }
    return list;
}

function telemetryNumber(value) {
    if (!Number.isFinite(value)) return null;
    return Number(value.toFixed(2));
}

function telemetryDistances(values) {
    if (!values) return [];
    const out = [];
    for (let i = 0; i < values.length; i++) {
        out.push(telemetryNumber(values[i]));
    }
    return out;
}

function addLog(message) {
    const time = clock.getElapsedTime().toFixed(1);
    const pos = `[${robot.position.x.toFixed(1)}, ${robot.position.z.toFixed(1)}]`;
    const fullMessage = `${time}s ${pos}: ${message}`;
    robotLog.push({ time, pos, message });
    
    const li = document.createElement('li');
    li.innerText = fullMessage;
    logList.appendChild(li);
    if (logList) logList.scrollTop = logList.scrollHeight;
    console.log(`[ROBOT LOG] ${fullMessage}`);
}

function flashCopyBtn() {
    const btn = document.getElementById('copyLogBtn');
    if (!btn) return;
    btn.textContent = t('logCopied');
    window.setTimeout(() => {
        btn.textContent = t('copyLogBtn');
    }, 1500);
}

function copyTelemetryLog() {
    const lines = [];
    for (let i = 0; i < robotLog.length; i++) {
        const row = robotLog[i];
        lines.push(row.time + 's ' + row.pos + ': ' + row.message);
    }
    const text = lines.join('\n');
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(flashCopyBtn);
    }
}

const TELEMETRY_CSV_HEADER = 't,algorithm,wp_index,wp_x,wp_z,wp_distance,robot_x,robot_z,heading,v,omega,blocked,forwardClear,nearest';

function telemetryRows() {
    if (Array.isArray(window.missionTelemetry)) return window.missionTelemetry;
    return missionTelemetry;
}

function csvCell(value) {
    if (value === null || typeof value === 'undefined') return '';
    const text = String(value);
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return '"' + text.replaceAll('"', '""') + '"';
    }
    return text;
}

function telemetryCsvRow(sample) {
    const cells = [
        sample?.t,
        sample?.algorithm,
        sample?.waypoint?.index,
        sample?.waypoint?.x,
        sample?.waypoint?.z,
        sample?.waypoint?.distance,
        sample?.robot?.x,
        sample?.robot?.z,
        sample?.robot?.heading,
        sample?.command?.v,
        sample?.command?.omega,
        sample?.sensors?.blocked,
        sample?.sensors?.forwardClear,
        sample?.sensors?.nearest,
    ];
    const out = [];
    for (let i = 0; i < cells.length; i++) {
        out.push(csvCell(cells[i]));
    }
    return out.join(',');
}

function downloadTelemetryFile(filename, mimeType, content) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function exportTelemetryJson() {
    downloadTelemetryFile(
        'robot-telemetry.json',
        'application/json;charset=utf-8',
        JSON.stringify(telemetryRows(), null, 2),
    );
}

function exportTelemetryCsv() {
    const rows = telemetryRows();
    const lines = [TELEMETRY_CSV_HEADER];
    for (let i = 0; i < rows.length; i++) {
        lines.push(telemetryCsvRow(rows[i]));
    }
    downloadTelemetryFile(
        'robot-telemetry.csv',
        'text/csv;charset=utf-8',
        lines.join('\n'),
    );
}

const copyLogBtn = document.getElementById('copyLogBtn');
if (copyLogBtn) copyLogBtn.addEventListener('click', copyTelemetryLog);
const exportTelemetryJsonBtn = document.getElementById('exportTelemetryJson');
if (exportTelemetryJsonBtn) exportTelemetryJsonBtn.addEventListener('click', exportTelemetryJson);
const exportTelemetryCsvBtn = document.getElementById('exportTelemetryCsv');
if (exportTelemetryCsvBtn) exportTelemetryCsvBtn.addEventListener('click', exportTelemetryCsv);

function addTelemetrySample(reading, cmd) {
    const now = clock.getElapsedTime();
    if (now - lastTelemetryAt < 2.00) return;
    if (pathIndex >= waypoints.length) return;

    const waypoint = waypoints[pathIndex];
    const sample = {
        type: 'telemetry',
        t: telemetryNumber(now),
        algorithm: activeAlgo,
        waypoint: {
            index: pathIndex,
            x: telemetryNumber(waypoint.x),
            z: telemetryNumber(waypoint.z),
            distance: telemetryNumber(distToGoal(waypoint)),
        },
        robot: {
            x: telemetryNumber(robot.position.x),
            z: telemetryNumber(robot.position.z),
            heading: telemetryNumber(robot.rotation.y),
        },
        stuckPose: navState.forceRose ? {
            x: telemetryNumber(robot.position.x),
            z: telemetryNumber(robot.position.z),
            heading: telemetryNumber(robot.rotation.y),
        } : null,
        hitTest: {
            clear: lastHitTest.clear,
            kind: lastHitTest.kind,
            id: lastHitTest.id,
            x: lastHitTest.x,
            z: lastHitTest.z,
            inset: telemetryNumber(hitInsetMeters()),
        },
        objects: collectTelemetryObjects(),
        command: {
            v: telemetryNumber(cmd.v),
            omega: telemetryNumber(cmd.omega),
        },
        navigation: {
            rose: navState.roseMode,
            roseDistance: telemetryNumber(navState.roseDistance),
            forceRose: navState.forceRose,
            circuits: navState.roseCircuits,
            side: navState.roseSide,
            webon: cmd.webon ? 1 : 0,
            bugMode: navState.mode,
        },
        sensors: {
            blocked: reading.blocked ? 1 : 0,
            votes: reading.sensorVotes,
            weight: telemetryNumber(reading.sensorWeight),
            forwardClear: telemetryNumber(reading.forwardClear),
            nearest: telemetryNumber(reading.minObstacleDist),
            ultrasonic: telemetryDistances(reading.ultrasonic),
            ir: telemetryDistances(reading.ir),
        },
    };

    lastTelemetryAt = now;
    missionTelemetry.push(sample);
    addLog(JSON.stringify(sample));
}

// 🎛️ UI wiring — start, reset, language, object panel
document.getElementById('startBtn').addEventListener('click', () => {
    if (waypoints.length < 1) {
        alert(t('alertNeedWaypoints'));
        return;
    }
    missionStart = { x: robot.position.x, z: robot.position.z };
    pathIndex = 0;
    navState = {
        mode: 'TRACK',
        bugSide: 1,
        bugStartDist: 0,
        lastLogAt: 0,
        roseMode: 0,
        roseSide: 1,
        roseStartX: robot.position.x,
        roseStartZ: robot.position.z,
        roseLastX: robot.position.x,
        roseLastZ: robot.position.z,
        roseDistance: 0,
        forceRose: 0,
        roseCircuits: 0,
        roseLeftStart: 0,
    };
    waypointsPassed = new Array(waypoints.length).fill(0);
    setRobotSelected(0);
    clock.start();
    logList.innerHTML = '';
    robotLog.length = 0;
    missionTelemetry.length = 0;
    lastTelemetryAt = -2.00;
    addLog(t('logInit', {
        algo: algoDisplayName(activeAlgo),
        sensors: sensorListLabel() || 'none',
        count: waypoints.length,
        radius: WP_ACCEPT_RADIUS,
    }));
    animating = 1;
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
    isDraggingProp = 0;
    isDraggingRobot = 0;
    resetGestureState();
    setRobotSelected(0);
    animating = 0;
    navState.mode = 'IDLE';
    mode = 'waypoints';
    statusEl.textContent = t('modeSetWaypoints');
    updateModeUi();
    robot.position.set(0, 0, 0);
    robot.rotation.set(0, 0, 0);
    syncRobotPhysicsBody();
});

const clock = new THREE.Clock();
let selectedObjectType = 'sphere';

['sensorLidar', 'sensorUltrasonic', 'sensorIr'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const keyMap = { sensorlidar: 'lidar', sensorultrasonic: 'ultrasonic', sensorir: 'ir' };
    const key = keyMap[id.toLowerCase()];
    el.checked = sensorConfig[key] === 1;
    el.addEventListener('change', () => {
        sensorConfig[key] = el.checked ? 1 : 0;
        updateSensorStatus();
    });
});

const moveObjectsEl = document.getElementById('moveObjectsMode');
if (moveObjectsEl) {
    moveObjectsEl.addEventListener('change', () => {
        moveObjectsMode = moveObjectsEl.checked ? 1 : 0;
        if (moveObjectsMode) {
            setRobotSelected(0);
            deselectProp();
        }
        updateModeUi();
    });
}

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
const buildStampEl = document.getElementById('buildStamp');
if (buildStampEl) buildStampEl.textContent = `build ${BUILD_STAMP}`;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    const dt = Math.min(clock.getDelta(), 0.05);

    stepPhysics(dt);
    applyRobotPushImpulse(dt);

    irBand.visible = sensorConfig.ir ? true : false;
    usCone.visible = sensorConfig.ultrasonic ? true : false;
    irBand.material.opacity = sensorConfig.ir ? 0.22 : 0;
    usCone.material.opacity = sensorConfig.ultrasonic ? 0.18 : 0;

    const placingPath = mode === 'waypoints' && !animating;
    robotGlowRing.visible = placingPath;
    if (placingPath) {
        const pulse = 0.25 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
        robotGlowRing.material.opacity = robotSelected ? pulse + 0.35 : pulse;
    }
    if (pathFlowLine && placingPath) {
        pathFlowLine.material.opacity = 0.7 + Math.sin(clock.getElapsedTime() * 3) * 0.25;
    }

    if (animating && waypoints.length >= 1) {
        checkWaypointMission();
    }

    if (animating && waypoints.length >= 1 && pathIndex < waypoints.length) {
        const target = waypoints[pathIndex];
        depenetrateRobot();
        const reading = sensorSuite.read();
        if (sensorSuite.isPhysicalCollision()) {
            reading.blocked = 1;
            reading.forwardClear = Math.min(reading.forwardClear, 0.4);
            reading.minObstacleDist = Math.min(reading.minObstacleDist, 0.4);
        }

        sensorSuite.updateLidarVisuals(reading);

        if (sensorSuite.isPhysicalCollision()) {
            markCollision(robot.position.clone());
        }

        let cmd = computeNavCommand(
            activeAlgo,
            target,
            reading,
            navState,
            missionStart,
        );

        if (cmd.skip) {
            skipUnreachableWaypoint();
        }
        if (!cmd.skip) {
            addTelemetrySample(reading, cmd);
            const motionBlocked = applyMotion(cmd.v, cmd.omega, dt);
            navState.forceRose = motionBlocked;
        }

        if (!cmd.skip && activeAlgo === 'bug2' && navState.mode === 'BUG_FOLLOW') {
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
