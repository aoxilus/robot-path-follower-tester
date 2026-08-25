// 🥑 Robot Path Follower Tester
// 🤖🚗🛸 Fast browser sandbox to simulate follow algorithms on a 4-wheel robot.
// 🌍 EN/ES UI · Three.js scene · sensors · Bug2 / Pure Pursuit / VFH / Custom

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNavSystem } from './nav.js';

const BUILD_STAMP = '08252026 0455';

// 🌍 i18n — bilingual UI strings (English + Español)
const translations = {
    en: {
        pageTitle: 'Robot Path Follower Tester',
        title: 'Robot Path Follower Tester',
        langLabel: 'Language:',
        algorithmLabel: 'Path Algorithm:',
        algoPurePursuit: 'Pure Pursuit',
        algoBug2: 'Bug2 (M-line)',
        algoDwa: 'DWA (dynamic window)',
        algoVfh: 'VFH',
        algoPotential: 'Potential Field (attract/repel)',
        algoCustom: 'Custom (JS)',
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
        copyBtn: 'Copy',
        sectionSensors: 'Sensors',
        sensorHint: 'Enable sensors — algorithms use what is active',
        sensorLidar: 'LIDAR (360° scan, 6 m)',
        sensorUltrasonic: 'Ultrasonic (front cone, 4 m)',
        sensorIr: '3× IR front (contact range, 0.6 m)',
        sensorFloorIr: 'Floor IR (holes; off = 4×4)',
        sensorHitTest: 'Spring bumper (contact hit test)',
        sensorFloorIrHint: 'On: avoid depressions · Off: drive into holes like 4×4',
        sensorStatusNone: 'No sensors — blind drive (bump + physics push)',
        sensorStatusActive: 'Active: {list}',
        arenaHint: 'Arena {side}×{side} m ({area} m²) · robot 2×3 m · waypoints snap to grid',
        startBtn: 'Start Mission',
        pauseBtn: 'Pause',
        resumeBtn: 'Resume',
        resetBtn: 'Reset',
        waypointHint: 'Short-click floor = waypoint · Move Objects = drag props',
        pathFlowHint: 'Glow line shows your path',
        modeSetWaypoints: 'Mode: Set Waypoints',
        waypointsSet: 'Waypoints: {count}',
        exportTelemetryJson: 'JSON',
        exportTelemetryCsv: 'CSV',
        showErrorReportBtn: 'Error Report',
        errorReportTitle: 'Robot Error Report',
        errorReportHint: 'Includes robot state + recent log. Copy and paste in chat.',
        copyErrorReportBtn: 'Copy Report',
        errorReportCopied: 'Report Copied',
        alertNeedWaypoints: 'Place at least one waypoint on the floor (rover position = start).',
        logInit: 'INIT: {algo} · {sensors} · {count} waypoints · accept radius {radius}m',
        logPaused: 'PAUSED',
        logResumed: 'RESUMED',
        logMissionReset: 'RESET: map, rover, and waypoints restored',
        logResetIdle: 'RESET: mission stopped (map kept)',
        logPassed: 'PASSED: Waypoint {index} (within {dist}m)',
        logSkipped: 'SKIPPED: Waypoint {index} unreachable (purple) — continuing',
        logDone: 'DONE: Mission complete. Passed {passed}/{total} · skipped {skipped}',
        logAvoid: 'AVOID: Obstacle at {dist}m — {action}',
        logBug2: 'BUG2: Following boundary ({side})',
        logDwa: 'DWA: v={v} ω={w}',
        logRecovery: 'RECOVERY: {phase} — stuck within 0.08 m',
        algoNamePurePursuit: 'Pure Pursuit',
        algoNameBug2: 'Bug2',
        algoNameDwa: 'DWA',
        algoNameVfh: 'VFH',
        algoNamePotential: 'Potential Field',
        algoNameCustom: 'Custom (JS pad)',
        interactionModeLabel: 'Interaction Mode:',
        modeWaypoints: 'Set Waypoints',
        modeObjects: 'Move Objects',
        objectTypeLabel: 'Object Type:',
        objSphere: 'Sphere',
        objBox: 'Cube',
        objCylinder: 'Cylinder',
        objCone: 'Cone',
        objectMassLabel: 'Weight (kg)',
        objectMassHint: 'Light flies · ≥25 kg barely moves (blocks like a cone)',
        objectScaleLabel: 'Scale',
        terrainSizeLabel: 'Size',
        terrainSizeHint: '10–60 m side',
        drawTerrainLabel: 'Draw shape',
        drawTerrainHint: 'Draw a loop, then extrude',
        stampHeightLabel: 'Extrude',
        stampHeightFlat: '0 m · flat',
        stampHeightCavity: '↑ {m} m mountain',
        stampHeightBowl: '↓ {m} m depression',
        stampHeightDown: '↓ hole',
        stampHeightUp: 'hill ↑',
        stampHeightHint: '↑ hill · ↓ hole',
        clearStampBtn: 'Remove shape',
        modeDrawTerrain: 'Draw terrain — drag on the floor',
        logStampDrawn: 'TERRAIN: Drew a shape ({n} pts)',
        logStampTooSmall: 'TERRAIN: Shape too small — draw a larger loop',
        logStampHeight: 'TERRAIN: {label}',
        logStampRemoved: 'TERRAIN: Removed shape',
        propEditHint: 'Sliders = selected prop, or defaults for next drop',
        clearObjectsBtn: 'Clear Objects',
        hitObjectsLabel: 'Hit Objects',
        hitObjectsHint: 'On: knock scales with weight · Off: no push',
        physicsLevelLabel: 'Physics level',
        physicsLevelHint: '1 soft · 3 default · 5 Angry Birds',
        moveObjectsLabel: 'Move objects (hold+drag)',
        moveObjectsHint: 'Move Objects locks the camera for dragging',
        modeMoveObjects: 'Mode: Move Objects — drag props',
        objectHint: 'Drag icons into the scene',
        objectMoveHint: 'Hold and drag to move — release to drop',
        roverSelectedHint: 'Rover selected — hold+drag to move',
        logObjectMoved: 'OBJECT: Moved {type} to [{x}, {z}]',
        modePlaceObjects: 'Mode: Move Objects',
        logObjectPlaced: 'OBJECT: Placed {type} ({mass} kg) at [{x}, {z}]',
        sectionNav: 'Navigation',
        sectionMode: 'Interaction',
        sectionScene: 'Scene',
        sectionTerrain: 'Terrain',
        sectionProps: 'Props',
        sectionDrag: 'Scene',
        dragPaletteLabel: 'Drag',
        dragSphereHint: 'Flies when hit',
        dragBoxHint: 'Stackable',
        dragCylinderHint: 'Tips easily',
        saveMapBtn: 'Save map',
        loadMapBtn: 'Load map',
        mapSaveHint: 'Each save is dated — Load opens a picker',
        mapPickerTitle: 'Saved maps',
        mapPickerHint: 'Pick a timestamped save to load into the scene.',
        mapPickerEmpty: 'No saves yet — use Save map first',
        mapPickerMeta: '{wp} WP · {props} props · {stamps} terrain',
        mapPickerLoad: 'Load',
        mapPickerDelete: 'Delete',
        logMapSaved: 'MAP: Saved {when}',
        logMapLoaded: 'MAP: Loaded {when}',
        logMapMissing: 'MAP: Nothing saved yet — Save map first',
        logMapBad: 'MAP: Could not load saved data',
        logMapDeleted: 'MAP: Deleted {when}',
        dropHere: 'Drop here',
    },
    es: {
        pageTitle: 'Robot Path Follower Tester',
        title: 'Probador de Seguidor de Ruta Robot',
        langLabel: 'Idioma:',
        algorithmLabel: 'Algoritmo de ruta:',
        algoPurePursuit: 'Pure Pursuit',
        algoBug2: 'Bug2 (línea-M)',
        algoDwa: 'DWA (ventana dinámica)',
        algoVfh: 'VFH',
        algoPotential: 'Campo potencial',
        algoCustom: 'Custom (JS)',
        customPadTitle: 'JS Custom',
        customSetupLabel: 'void setup — API del robot (solo lectura)',
        customLoopLabel: 'loop() — asigna v y omega',
        customCheckBtn: 'Checar',
        customSaveBtn: 'Guardar',
        customPadClose: 'Cerrar',
        customCheckOk: 'Check OK — vars del robot + Math + draw',
        customCheckFail: 'Check falló: {msg}',
        customSaved: 'Guardado',
        customSetupCopied: 'Copiado',
        copyBtn: 'Copiar',
        sectionSensors: 'Sensores',
        sensorHint: 'Activa sensores — el algoritmo usa los disponibles',
        sensorLidar: 'LIDAR (360°, 6 m)',
        sensorUltrasonic: 'Ultrasónico (cono frontal, 4 m)',
        sensorIr: '3× IR frontal (contacto, 0.6 m)',
        sensorFloorIr: 'IR de piso (hoyos; off = 4×4)',
        sensorHitTest: 'Parachoques de resorte (contacto)',
        sensorFloorIrHint: 'On: evita depresiones · Off: entra a hoyos como 4×4',
        sensorStatusNone: 'Sin sensores — a ciegas (choca y empuja con física)',
        sensorStatusActive: 'Activos: {list}',
        arenaHint: 'Arena {side}×{side} m ({area} m²) · robot 2×3 m · waypoints en rejilla',
        startBtn: 'Iniciar misión',
        pauseBtn: 'Pausa',
        resumeBtn: 'Continuar',
        resetBtn: 'Reiniciar',
        waypointHint: 'Clic corto en piso = waypoint · Mover objetos = arrastrar props',
        pathFlowHint: 'La línea muestra tu ruta',
        modeSetWaypoints: 'Modo: Colocar waypoints',
        waypointsSet: 'Waypoints: {count}',
        exportTelemetryJson: 'JSON',
        exportTelemetryCsv: 'CSV',
        showErrorReportBtn: 'Reporte de error',
        errorReportTitle: 'Reporte de error del robot',
        errorReportHint: 'Incluye estado del robot + log reciente. Copia y pégalo en el chat.',
        copyErrorReportBtn: 'Copiar reporte',
        errorReportCopied: 'Reporte copiado',
        alertNeedWaypoints: 'Coloca al menos un waypoint en el suelo (posición del rover = inicio).',
        logInit: 'INICIO: {algo} · {sensors} · {count} waypoints · radio {radius}m',
        logPaused: 'PAUSA',
        logResumed: 'CONTINÚA',
        logMissionReset: 'REINICIO: mapa, rover y waypoints restaurados',
        logResetIdle: 'REINICIO: misión detenida (mapa conservado)',
        logPassed: 'PASADO: Waypoint {index} (a {dist}m)',
        logSkipped: 'OMITIDO: Waypoint {index} inalcanzable (morado) — continúa',
        logDone: 'FIN: Misión completa. Pasados {passed}/{total} · omitidos {skipped}',
        logAvoid: 'EVITAR: Obstáculo a {dist}m — {action}',
        logBug2: 'BUG2: Siguiendo contorno ({side})',
        logDwa: 'DWA: v={v} ω={w}',
        logRecovery: 'RECUPERACIÓN: {phase} — atascado dentro de 0.08 m',
        algoNamePurePursuit: 'Pure Pursuit',
        algoNameBug2: 'Bug2',
        algoNameDwa: 'DWA',
        algoNameVfh: 'VFH',
        algoNamePotential: 'Campo Potencial',
        algoNameCustom: 'Custom (bloc de JS)',
        interactionModeLabel: 'Modo de interacción:',
        modeWaypoints: 'Colocar waypoints',
        modeObjects: 'Mover objetos',
        objectTypeLabel: 'Tipo de objeto:',
        objSphere: 'Esfera',
        objBox: 'Cubo',
        objCylinder: 'Cilindro',
        objCone: 'Cono',
        objectMassLabel: 'Peso (kg)',
        objectMassHint: 'Liviano vuela · ≥25 kg casi no se mueve (bloquea como un cono)',
        objectScaleLabel: 'Escala',
        terrainSizeLabel: 'Tamaño',
        terrainSizeHint: 'Lado 10–60 m',
        drawTerrainLabel: 'Dibujar forma',
        drawTerrainHint: 'Traza un lazo, luego extruye',
        stampHeightLabel: 'Extruir',
        stampHeightFlat: '0 m · plano',
        stampHeightCavity: '↑ {m} m montaña',
        stampHeightBowl: '↓ {m} m depresión',
        stampHeightDown: '↓ hoyo',
        stampHeightUp: 'colina ↑',
        stampHeightHint: '↑ colina · ↓ hoyo',
        clearStampBtn: 'Quitar forma',
        modeDrawTerrain: 'Dibujar terreno — arrastra en el piso',
        logStampDrawn: 'TERRENO: Forma dibujada ({n} pts)',
        logStampTooSmall: 'TERRENO: Forma muy chica — traza un lazo más grande',
        logStampHeight: 'TERRENO: {label}',
        logStampRemoved: 'TERRENO: Forma quitada',
        propEditHint: 'Sliders = prop seleccionado, o default del próximo drop',
        clearObjectsBtn: 'Quitar objetos',
        hitObjectsLabel: 'Golpear objetos',
        hitObjectsHint: 'On: el golpe escala con el peso · Off: no empuja',
        physicsLevelLabel: 'Nivel de física',
        physicsLevelHint: '1 suave · 3 normal · 5 Angry Birds',
        moveObjectsLabel: 'Mover objetos (mantén+arrastra)',
        moveObjectsHint: 'Mover objetos bloquea la cámara para arrastrar',
        modeMoveObjects: 'Modo: Mover objetos — arrastra props',
        objectHint: 'Arrastra los iconos a la escena',
        objectMoveHint: 'Mantén y arrastra — suelta para soltar',
        roverSelectedHint: 'Rover seleccionado — mantén+arrastra para mover',
        logObjectMoved: 'OBJETO: {type} movido a [{x}, {z}]',
        modePlaceObjects: 'Modo: Mover objetos',
        logObjectPlaced: 'OBJETO: {type} ({mass} kg) en [{x}, {z}]',
        sectionNav: 'Navegación',
        sectionMode: 'Interacción',
        sectionScene: 'Escena',
        sectionTerrain: 'Terreno',
        sectionProps: 'Props',
        sectionDrag: 'Escena',
        dragPaletteLabel: 'Arrastra',
        dragSphereHint: 'Vuela al golpearla',
        dragBoxHint: 'Apilable',
        dragCylinderHint: 'Se tumba fácil',
        saveMapBtn: 'Guardar mapa',
        loadMapBtn: 'Cargar mapa',
        mapSaveHint: 'Cada guardado tiene fecha — Cargar abre un selector',
        mapPickerTitle: 'Mapas guardados',
        mapPickerHint: 'Elige un guardado con fecha/hora para cargar.',
        mapPickerEmpty: 'Nada guardado — usa Guardar mapa',
        mapPickerMeta: '{wp} WP · {props} props · {stamps} terreno',
        mapPickerLoad: 'Cargar',
        mapPickerDelete: 'Borrar',
        logMapSaved: 'MAPA: Guardado {when}',
        logMapLoaded: 'MAPA: Cargado {when}',
        logMapMissing: 'MAPA: Nada guardado — primero Guardar mapa',
        logMapBad: 'MAPA: No se pudo cargar',
        logMapDeleted: 'MAPA: Borrado {when}',
        dropHere: 'Soltar aquí',
    },
};

const runtimeErrors = [];
function recordRuntimeError(message) {
    runtimeErrors.push(`${new Date().toISOString()} ${message}`);
    if (runtimeErrors.length > 20) runtimeErrors.shift();
}
window.addEventListener('error', (event) => {
    recordRuntimeError(`${event.message} @ ${event.filename}:${event.lineno}`);
});
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.stack || event.reason?.message || String(event.reason);
    recordRuntimeError(`Unhandled promise: ${reason}`);
});

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
        vfh: t('algoNameVfh'),
        custom: t('algoNameCustom'),
    };
    return names[algo] ?? algo;
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        if (el.dataset.i18n === 'arenaHint') {
            el.textContent = arenaHintText();
            return;
        }
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
    if (typeof refreshCustomPadI18n === 'function') {
        refreshCustomPadI18n();
    }
    if (typeof updateTerrainUi === 'function') {
        updateTerrainUi();
    }
    if (typeof updateStampHeightUi === 'function') {
        updateStampHeightUi();
    }
    if (typeof updateMissionButtons === 'function') {
        updateMissionButtons();
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
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.38);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -35;
dirLight.shadow.camera.right = 35;
dirLight.shadow.camera.top = 35;
dirLight.shadow.camera.bottom = -35;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 80;
dirLight.shadow.bias = -0.0008;
dirLight.shadow.normalBias = 0.03;
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

// 🗺️ Environment — scalable arena (±half), robot 2×3 m footprint
const BUILD_MARGIN = 1.5; // keep props/obstacles inside playable area
const WP_ACCEPT_RADIUS = 1.5;
const TERRAIN_MIN = 10;
const TERRAIN_MAX = 60;
const TERRAIN_STEP = 5;
let PLANE_SIZE = 30;
let PLANE_HALF = PLANE_SIZE / 2;
let BUILD_LIMIT = PLANE_HALF - BUILD_MARGIN;

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
let gridHelper = new THREE.GridHelper(PLANE_SIZE, PLANE_SIZE, 0x00ffcc, 0x000000);
gridHelper.position.y = 0.01;
gridHelper.material.opacity = 0.2;
gridHelper.material.transparent = true;
scene.add(gridHelper);

function arenaAreaSqm() {
    return PLANE_SIZE * PLANE_SIZE;
}

function arenaHintText() {
    return t('arenaHint', { side: PLANE_SIZE, area: arenaAreaSqm() });
}

function updateTerrainUi() {
    const valueEl = document.getElementById('terrainValue');
    if (valueEl) {
        valueEl.textContent = `${PLANE_SIZE}×${PLANE_SIZE} m · ${arenaAreaSqm()} m²`;
    }
    const hintEl = document.querySelector('.arena-hint');
    if (hintEl) hintEl.textContent = arenaHintText();
}

function setTerrainSize(size) {
    const next = Math.max(TERRAIN_MIN, Math.min(TERRAIN_MAX, Math.round(size / TERRAIN_STEP) * TERRAIN_STEP));
    if (next === PLANE_SIZE) {
        updateTerrainUi();
        return;
    }
    PLANE_SIZE = next;
    PLANE_HALF = PLANE_SIZE / 2;
    BUILD_LIMIT = PLANE_HALF - BUILD_MARGIN;

    if (typeof rebuildArenaFloor === 'function') {
        rebuildArenaFloor();
    } else {
        plane.geometry.dispose();
        plane.geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
    }

    scene.remove(gridHelper);
    gridHelper.geometry.dispose();
    if (Array.isArray(gridHelper.material)) {
        gridHelper.material.forEach((m) => m.dispose());
    } else {
        gridHelper.material.dispose();
    }
    gridHelper = new THREE.GridHelper(PLANE_SIZE, PLANE_SIZE, 0x00ffcc, 0x000000);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    scene.fog.near = Math.max(8, PLANE_SIZE * 0.35);
    scene.fog.far = Math.max(40, PLANE_SIZE * 1.7);

    clampRobotPosition();
    for (let i = 0; i < physicsProps.length; i++) {
        const prop = physicsProps[i];
        const c = clampToArena(prop.mesh.position.x, prop.mesh.position.z);
        prop.mesh.position.x = c.x;
        prop.mesh.position.z = c.z;
        prop.body.position.x = c.x;
        prop.body.position.z = c.z;
    }
    for (let i = 0; i < stageCones.length; i++) {
        const cone = stageCones[i];
        const c = clampToArena(cone.mesh.position.x, cone.mesh.position.z);
        cone.mesh.position.x = c.x;
        cone.mesh.position.z = c.z;
        cone.body.position.x = c.x;
        cone.body.position.z = c.z;
        if (obstacles[i]) {
            obstacles[i].position.x = c.x;
            obstacles[i].position.z = c.z;
        }
    }
    for (let i = 0; i < waypoints.length; i++) {
        const c = clampToArena(waypoints[i].x, waypoints[i].z);
        waypoints[i].x = c.x;
        waypoints[i].z = c.z;
        if (waypointMarkers[i]) {
            waypointMarkers[i].position.x = c.x;
            waypointMarkers[i].position.z = c.z;
        }
    }
    if (typeof updatePathFlow === 'function') updatePathFlow();
    updateTerrainUi();
}

// 🤖🚗🛸 4-wheel robot — yellow body + 4 cylindrical wheels (differential-drive style)
const robot = new THREE.Group();
robot.rotation.order = 'YXZ'; // yaw (y) · pitch (x) · roll (z) — terrain tilt
const carHeight = 1;
const WHEEL_RADIUS = 0.5;
const WHEEL_AXLE_Y = 0.5;
const ROVER_MAX_TILT = 0.70; // ~40° pitch/roll clamp
const ROVER_TILT_RATE = 14;
const ROVER_SUSP_TRAVEL = 0.55;

// Full physical footprint: body + four wheels. Radar/scan visuals stay excluded.
// Do NOT use setFromObject(robot): sensor graphics would inflate the box.
const ROBOT_COLLISION = {
    halfWidth: 1.4,   // wheels extend total width to 2.8 m
    halfHeight: 0.5,
    halfLength: 1.5,  // wheels/body extend total length to 3 m
    centerY: carHeight / 2 + 0.5,
};
// Cannon hull includes wheels (y≈0.06..1.5). The visual box sat at y=0.5..1.5 and
// missed floor props, so contacts never formed.
const ROBOT_PHYS = {
    halfWidth: ROBOT_COLLISION.halfWidth,
    halfHeight: 0.72,
    halfLength: ROBOT_COLLISION.halfLength,
    centerY: 0.78,
};
const ROBOT_WIDTH = ROBOT_COLLISION.halfWidth * 2;
const ROBOT_LENGTH = ROBOT_COLLISION.halfLength * 2;
const LIDAR_RANGE = Math.max(ROBOT_WIDTH, ROBOT_LENGTH) * 2;
const ULTRASONIC_RANGE = 4;
const IR_RANGE = 0.6;
const FLOOR_IR_RANGE = 3;
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

// Contact hit-test visual: bright front bumper that compresses like a spring.
const bumperBar = new THREE.Mesh(
    new THREE.BoxGeometry(2.75, 0.28, 0.28),
    new THREE.MeshStandardMaterial({
        color: 0xff3b1f,
        emissive: 0x661400,
        metalness: 0.35,
        roughness: 0.40,
    }),
);
bumperBar.position.set(0, 0.55, 1.72);
bumperBar.castShadow = true;
bumperBar.userData.sensorVisual = true;
robot.add(bumperBar);

const bumperSprings = [-0.90, 0.90].map((x) => {
    const spring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.36, 10),
        new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            metalness: 0.85,
            roughness: 0.20,
        }),
    );
    spring.rotation.x = Math.PI / 2;
    spring.position.set(x, 0.55, 1.52);
    spring.userData.sensorVisual = true;
    robot.add(spring);
    return spring;
});
let bumperCompression = 0;

scene.add(robot);

const customDrawGroup = new THREE.Group();
scene.add(customDrawGroup);

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

// 🧱 Stage cones — red ovals; editable (move) but immovable by rover push
const obstacles = [];
const stageCones = [];
const obsGeo = new THREE.CylinderGeometry(1, 1.5, carHeight + 0.5, 32);
const CONE_HALF_H = (carHeight + 0.5) / 2;

for (let i = 0; i < 2; i++) {
    const obs = new THREE.Mesh(
        obsGeo,
        new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.6 }),
    );
    obs.position.y = CONE_HALF_H;
    obs.scale.set(1, 1, 0.5);
    obs.castShadow = true;
    obs.receiveShadow = true;
    scene.add(obs);
    obstacles.push(obs);
}
obstacles[0].position.set(-5, CONE_HALF_H, -4);
obstacles[1].position.set(5, CONE_HALF_H, 4);

// ⚙️ Physics (cannon-es) — stackable props the robot pushes on contact
const physicsWorld = new CANNON.World();
physicsWorld.gravity.set(0, -15, 0);
physicsWorld.broadphase = new CANNON.NaiveBroadphase();
physicsWorld.allowSleep = true; // settled stacks rest; knock / kinematic shove wakes them
physicsWorld.solver.iterations = 18;

const groundMaterial = new CANNON.Material('ground');
const propMaterial = new CANNON.Material('prop');
const robotMaterial = new CANNON.Material('robot');

physicsWorld.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, propMaterial, {
    friction: 0.62,
    restitution: 0.12,
}));
physicsWorld.addContactMaterial(new CANNON.ContactMaterial(propMaterial, propMaterial, {
    friction: 0.48,
    restitution: 0.12,
}));
physicsWorld.addContactMaterial(new CANNON.ContactMaterial(robotMaterial, propMaterial, {
    friction: 0.38,
    restitution: 0.18,
}));
physicsWorld.addContactMaterial(new CANNON.ContactMaterial(robotMaterial, groundMaterial, {
    friction: 0.40,
    restitution: 0,
}));

const FILTER_GROUND = 1;
const FILTER_TERRAIN = 2;
const FILTER_PROP = 4;
const FILTER_ROBOT = 8;
const FILTER_HEAVY = 16;
// ≥ this kg: no hull shove / no knock. Nav still treats them as solid.
const HEAVY_PROP_KG = 25;

const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
groundBody.collisionFilterGroup = FILTER_GROUND;
physicsWorld.addBody(groundBody);

const CONE_MASS = 14;
const staticObstacleBodies = [];
obstacles.forEach((obs) => {
    const obsHeight = carHeight + 0.5;
    const body = new CANNON.Body({
        mass: CONE_MASS,
        material: propMaterial,
        linearDamping: 0.05,
        angularDamping: 0.12,
        collisionFilterGroup: FILTER_PROP,
        collisionFilterMask: -1,
    });
    body.sleepSpeedLimit = 0.18;
    body.sleepTimeLimit = 1.6;
    // cannon-es Cylinder is already Y-up (like Three.js). Do NOT rotate −90° (old cannon.js hack).
    body.addShape(new CANNON.Cylinder(1, 1.5, obsHeight, 10));
    body.position.set(obs.position.x, obs.position.y, obs.position.z);
    body.quaternion.setFromEuler(0, obs.rotation.y, 0);
    physicsWorld.addBody(body);
    staticObstacleBodies.push(body);

    const entry = {
        mesh: obs,
        body,
        type: 'cone',
        mass: CONE_MASS,
        scale: 1,
        isStageCone: 1,
    };
    obs.userData.physicsProp = entry;
    stageCones.push(entry);
});

const robotBody = new CANNON.Body({
    mass: 0,
    type: CANNON.Body.KINEMATIC,
    material: robotMaterial,
    collisionFilterGroup: FILTER_ROBOT,
    collisionFilterMask: FILTER_GROUND | FILTER_TERRAIN | FILTER_PROP,
});
robotBody.addShape(
    new CANNON.Box(new CANNON.Vec3(
        ROBOT_PHYS.halfWidth,
        ROBOT_PHYS.halfHeight,
        ROBOT_PHYS.halfLength,
    )),
    new CANNON.Vec3(0, ROBOT_PHYS.centerY, 0),
);
physicsWorld.addBody(robotBody);

const physicsProps = [];
const PROP_COLORS = { sphere: 0x44aaff, box: 0xffaa44, cylinder: 0xaa44ff };
const PROP_HALF_HEIGHT = { sphere: 0.5, box: 0.5, cylinder: 0.5 };
const DEFAULT_PROP_MASS = 5;
const DEFAULT_PROP_SCALE = 1;

function propTypeLabel(type) {
    const keys = {
        sphere: 'objSphere',
        box: 'objBox',
        cylinder: 'objCylinder',
        cone: 'objCone',
    };
    return t(keys[type] ?? type);
}

function clearBodyShapes(body) {
    while (body.shapes.length > 0) {
        body.removeShape(body.shapes[0]);
    }
}

function addPropShapes(body, type, scale) {
    const s = Math.max(0.25, scale);
    if (type === 'sphere') {
        body.addShape(new CANNON.Sphere(0.5 * s));
    } else if (type === 'box') {
        const h = 0.5 * s;
        body.addShape(new CANNON.Box(new CANNON.Vec3(h, h, h)));
    } else {
        // cannon-es Cylinder axis = Y (matches Three CylinderGeometry). No −90° X rotation.
        const r = 0.5 * s;
        const h = 1 * s;
        body.addShape(new CANNON.Cylinder(r, r, h, 12));
    }
}

function propHalfHeight(prop) {
    if (prop.isStageCone) return CONE_HALF_H;
    return PROP_HALF_HEIGHT[prop.type] * (prop.scale || 1);
}

/** Top surface under (x, z): terrain or the highest prop/cone AABB that covers that point. */
function supportSurfaceY(x, z, exclude = null) {
    let y = terrainHeightAt(x, z);
    const consider = (mesh) => {
        if (!mesh) return;
        const box = new THREE.Box3().setFromObject(mesh);
        const pad = 0.08;
        if (x < box.min.x + pad || x > box.max.x - pad
            || z < box.min.z + pad || z > box.max.z - pad) return;
        y = Math.max(y, box.max.y);
    };
    for (let i = 0; i < physicsProps.length; i++) {
        const prop = physicsProps[i];
        if (prop === exclude) continue;
        consider(prop.mesh);
    }
    for (let i = 0; i < stageCones.length; i++) {
        const cone = stageCones[i];
        if (cone === exclude) continue;
        consider(cone.mesh);
    }
    return y;
}

function restPropOnSupport(prop, x, z) {
    const half = propHalfHeight(prop);
    const y = supportSurfaceY(x, z, prop) + half + 0.02;
    prop.mesh.position.set(x, y, z);
    prop.body.position.set(x, y, z);
    prop.body.angularVelocity.set(0, 0, 0);
    if (typeof missionPhysicsOn === 'function' && missionPhysicsOn()) {
        // Tiny downward speed so cannon-es seats the contact. v=0 + sleep = hover forever.
        prop.body.velocity.set(0, -0.8, 0);
        prop.body.wakeUp();
    } else {
        prop.body.velocity.set(0, 0, 0);
        prop.body.sleep();
    }
}

/** If a body is still above its support, sleep froze it — wake and drop. */
function wakeUnsupportedProps() {
    if (typeof isDraggingProp !== 'undefined' && isDraggingProp) return;
    for (let i = 0; i < physicsProps.length; i++) {
        const prop = physicsProps[i];
        const body = prop.body;
        if (!body || body.type !== CANNON.Body.DYNAMIC || body.mass < 0.05) continue;
        const seat = supportSurfaceY(body.position.x, body.position.z, prop) + propHalfHeight(prop);
        if (body.position.y <= seat + 0.22) continue;
        body.wakeUp();
        if (body.velocity.y > -0.2) body.velocity.y = -0.6;
    }
}

function syncPropCollisionFilter(prop) {
    if (!prop?.body || prop.isStageCone) return;
    const heavy = prop.mass >= HEAVY_PROP_KG;
    prop.body.collisionFilterGroup = heavy ? FILTER_HEAVY : FILTER_PROP;
    // Heavy: stack with other props / ground, but not the kinematic hull.
    prop.body.collisionFilterMask = heavy
        ? (FILTER_GROUND | FILTER_TERRAIN | FILTER_PROP | FILTER_HEAVY)
        : -1;
}

function setPropMass(prop, mass) {
    if (prop.isStageCone) return;
    const bodyMass = Math.max(0.5, Math.min(80, mass));
    prop.mass = bodyMass;
    prop.body.mass = bodyMass;
    prop.body.updateMassProperties();
    syncPropCollisionFilter(prop);
    prop.body.wakeUp();
}

function setPropScale(prop, scale) {
    if (prop.isStageCone) return;
    const s = Math.max(0.25, Math.min(3, scale));
    prop.scale = s;
    prop.mesh.scale.setScalar(s);
    clearBodyShapes(prop.body);
    addPropShapes(prop.body, prop.type, s);
    // Keep resting on the floor / current contact height by half-extent.
    const y = Math.max(propHalfHeight(prop) + 0.02, prop.mesh.position.y);
    prop.mesh.position.y = y;
    prop.body.position.y = y;
    prop.body.velocity.set(0, 0, 0);
    prop.body.angularVelocity.set(0, 0, 0);
    prop.body.wakeUp();
}

function createPhysicsProp(type, x, y, z, mass = DEFAULT_PROP_MASS, scale = DEFAULT_PROP_SCALE) {
    const bodyMass = Math.max(0.5, Math.min(80, mass ?? DEFAULT_PROP_MASS));
    const s = Math.max(0.25, Math.min(3, scale ?? DEFAULT_PROP_SCALE));
    const body = new CANNON.Body({
        mass: bodyMass,
        material: propMaterial,
        linearDamping: type === 'sphere' ? 0.02 : 0.04,
        angularDamping: type === 'sphere' ? 0.04 : 0.10,
        collisionFilterGroup: FILTER_PROP,
        collisionFilterMask: -1,
    });

    let mesh;
    if (type === 'sphere') {
        mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 24, 16),
            new THREE.MeshStandardMaterial({ color: PROP_COLORS.sphere, roughness: 0.45, metalness: 0.1 }),
        );
    } else if (type === 'box') {
        mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: PROP_COLORS.box, roughness: 0.45, metalness: 0.05 }),
        );
    } else {
        mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
            new THREE.MeshStandardMaterial({ color: PROP_COLORS.cylinder, roughness: 0.45, metalness: 0.05 }),
        );
    }

    addPropShapes(body, type, s);
    body.sleepSpeedLimit = 0.18;
    body.sleepTimeLimit = 1.6;
    mesh.scale.setScalar(s);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, y, z);
    body.position.set(x, y, z);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    if (typeof missionPhysicsOn === 'function' && missionPhysicsOn()) {
        body.velocity.set(0, -0.6, 0);
        body.wakeUp();
    } else {
        body.sleep();
    }

    physicsWorld.addBody(body);
    scene.add(mesh);
    const entry = { mesh, body, type, mass: bodyMass, scale: s };
    mesh.userData.physicsProp = entry;
    physicsProps.push(entry);
    syncPropCollisionFilter(entry);
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

function clearAllWaypoints() {
    waypointMarkers.forEach((m) => {
        scene.remove(m);
        m.geometry?.dispose?.();
        m.material?.dispose?.();
    });
    waypointMarkers = [];
    waypoints = [];
    waypointsPassed = [];
    disposePathLines();
}

function clearAllTerrainStamps() {
    while (terrainStamps.length > 0) {
        removeTerrainStamp(terrainStamps[terrainStamps.length - 1]);
    }
    selectedStamp = null;
}

function placeWaypointAt(x, z, y = 0.5) {
    const clamped = clampToArena(x, z);
    waypoints.push({ x: clamped.x, z: clamped.z });
    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.32),
        new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    );
    marker.position.set(clamped.x, y, clamped.z);
    scene.add(marker);
    waypointMarkers.push(marker);
}

const MAP_STORAGE_KEY = 'robot-path-map-v1';
const MAP_LIBRARY_KEY = 'robot-path-maps-v2';
const MAP_LIBRARY_MAX = 20;

function formatMapWhen(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || '');
    return d.toLocaleString(currentLang === 'es' ? 'es-MX' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function mapEntrySummary(map) {
    return {
        wp: Array.isArray(map?.waypoints) ? map.waypoints.length : 0,
        props: Array.isArray(map?.props) ? map.props.length : 0,
        stamps: Array.isArray(map?.stamps) ? map.stamps.length : 0,
    };
}

function readMapLibrary() {
    let list = [];
    try {
        const raw = localStorage.getItem(MAP_LIBRARY_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) list = parsed;
        }
    } catch (_) {
        list = [];
    }

    // Migrate legacy single-slot save once.
    try {
        const legacy = localStorage.getItem(MAP_STORAGE_KEY);
        if (legacy && list.length === 0) {
            const map = JSON.parse(legacy);
            if (map && map.version === 1) {
                list.push({
                    id: map.savedAt || `legacy-${Date.now()}`,
                    savedAt: map.savedAt || new Date().toISOString(),
                    map,
                });
                writeMapLibrary(list);
            }
        }
    } catch (_) { /* ignore */ }

    return list.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
}

function writeMapLibrary(list) {
    localStorage.setItem(MAP_LIBRARY_KEY, JSON.stringify(list.slice(0, MAP_LIBRARY_MAX)));
}

function poseJSON(body) {
    return {
        x: Number(body.position.x.toFixed(3)),
        y: Number(body.position.y.toFixed(3)),
        z: Number(body.position.z.toFixed(3)),
        qx: Number(body.quaternion.x.toFixed(4)),
        qy: Number(body.quaternion.y.toFixed(4)),
        qz: Number(body.quaternion.z.toFixed(4)),
        qw: Number(body.quaternion.w.toFixed(4)),
    };
}

function applyStoredPose(prop, pose) {
    if (!prop?.body || !pose) return;
    const y = Number.isFinite(pose.y) ? pose.y : prop.body.position.y;
    prop.body.position.set(
        Number.isFinite(pose.x) ? pose.x : prop.body.position.x,
        y,
        Number.isFinite(pose.z) ? pose.z : prop.body.position.z,
    );
    if (Number.isFinite(pose.qx) && Number.isFinite(pose.qw)) {
        prop.body.quaternion.set(pose.qx, pose.qy, pose.qz, pose.qw);
    }
    prop.body.velocity.set(0, 0, 0);
    prop.body.angularVelocity.set(0, 0, 0);
    if (prop.mesh) {
        prop.mesh.position.copy(prop.body.position);
        prop.mesh.quaternion.copy(prop.body.quaternion);
    }
}

function serializeMap() {
    return {
        version: 1,
        savedAt: new Date().toISOString(),
        arenaM: PLANE_SIZE,
        robot: {
            x: Number(robot.position.x.toFixed(3)),
            y: Number(robot.position.y.toFixed(3)),
            z: Number(robot.position.z.toFixed(3)),
            heading: Number(robot.rotation.y.toFixed(4)),
        },
        waypoints: waypoints.map((wp) => ({ x: wp.x, z: wp.z })),
        cones: stageCones.map((c) => poseJSON(c.body)),
        props: physicsProps.map((p) => ({
            type: p.type,
            mass: p.mass,
            scale: p.scale,
            ...poseJSON(p.body),
        })),
        stamps: terrainStamps.map((s) => ({
            height: s.height,
            points: (s.points || []).map((pt) => ({
                x: Number(pt.x.toFixed(3)),
                z: Number(pt.z.toFixed(3)),
            })),
        })),
    };
}

function saveMapToLocal() {
    try {
        const map = serializeMap();
        const list = readMapLibrary();
        list.unshift({
            id: map.savedAt,
            savedAt: map.savedAt,
            map,
        });
        writeMapLibrary(list);
        addLog(t('logMapSaved', { when: formatMapWhen(map.savedAt) }));
        return true;
    } catch (err) {
        addLog(t('logMapBad'));
        return false;
    }
}

function applyMapData(data, opts = {}) {
    if (!data || data.version !== 1) {
        addLog(t('logMapBad'));
        return false;
    }

    animating = 0;
    paused = 0;
    navState.mode = 'IDLE';
    deselectProp();
    setDrawTerrainMode(0);
    clearAllWaypoints();
    clearPhysicsProps();
    clearAllTerrainStamps();

    if (Number.isFinite(data.arenaM)) {
        setTerrainSize(data.arenaM);
        const slider = document.getElementById('terrainSize');
        if (slider) slider.value = String(PLANE_SIZE);
        updateTerrainUi();
    }

    if (data.robot) {
        robot.position.set(
            data.robot.x || 0,
            data.robot.y || 0,
            data.robot.z || 0,
        );
        robot.rotation.set(0, data.robot.heading || 0, 0);
        robotVy = 0;
        syncRobotPhysicsBody();
    }

    if (Array.isArray(data.cones)) {
        for (let i = 0; i < stageCones.length && i < data.cones.length; i++) {
            const pose = data.cones[i];
            const c = clampToArena(pose.x, pose.z);
            applyStoredPose(stageCones[i], {
                ...pose,
                x: c.x,
                z: c.z,
                y: Number.isFinite(pose.y) ? pose.y : CONE_HALF_H,
            });
        }
    }

    if (Array.isArray(data.waypoints)) {
        for (let i = 0; i < data.waypoints.length; i++) {
            const wp = data.waypoints[i];
            placeWaypointAt(wp.x, wp.z, 0.5);
        }
        updateWaypointColors();
        updatePathFlow();
    }

    if (Array.isArray(data.props)) {
        for (let i = 0; i < data.props.length; i++) {
            const p = data.props[i];
            if (!p || !PROP_HALF_HEIGHT[p.type]) continue;
            const clamped = clampToArena(p.x, p.z);
            const entry = createPhysicsProp(
                p.type,
                clamped.x,
                Number.isFinite(p.y) ? p.y : (PROP_HALF_HEIGHT[p.type] * (p.scale || 1) + 0.02),
                clamped.z,
                p.mass,
                p.scale,
            );
            applyStoredPose(entry, { ...p, x: clamped.x, z: clamped.z });
        }
    }

    if (Array.isArray(data.stamps)) {
        for (let i = 0; i < data.stamps.length; i++) {
            const s = data.stamps[i];
            if (!s?.points || s.points.length < 3) continue;
            const pts = s.points.map((pt) => ({ x: pt.x, z: pt.z }));
            const stamp = createTerrainStamp(pts);
            if (Number.isFinite(s.height) && s.height !== 0) {
                setStampHeight(stamp, s.height);
            }
        }
        selectedStamp = null;
        updateStampHeightUi();
    }

    updateModeUi();
    if (typeof updateMissionButtons === 'function') updateMissionButtons();
    if (!opts.silent) addLog(t('logMapLoaded', { when: formatMapWhen(data.savedAt) }));
    return true;
}

function loadMapById(id) {
    const list = readMapLibrary();
    const entry = list.find((item) => item.id === id);
    if (!entry?.map) {
        addLog(t('logMapBad'));
        return false;
    }
    return applyMapData(entry.map);
}

function deleteMapById(id) {
    const list = readMapLibrary();
    const entry = list.find((item) => item.id === id);
    const next = list.filter((item) => item.id !== id);
    writeMapLibrary(next);
    if (entry) addLog(t('logMapDeleted', { when: formatMapWhen(entry.savedAt) }));
    return next;
}

function openMapPicker() {
    const dialog = document.getElementById('mapPickerDialog');
    const listEl = document.getElementById('mapPickerList');
    if (!dialog || !listEl) return;

    const list = readMapLibrary();
    listEl.innerHTML = '';

    if (list.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'map-picker-empty';
        empty.textContent = t('mapPickerEmpty');
        listEl.appendChild(empty);
    } else {
        list.forEach((entry) => {
            const li = document.createElement('li');
            li.className = 'map-picker-item';
            const summary = mapEntrySummary(entry.map);
            const when = formatMapWhen(entry.savedAt);
            li.innerHTML = `
              <div class="map-picker-main">
                <strong>${when}</strong>
                <span>${t('mapPickerMeta', summary)}</span>
              </div>
              <div class="map-picker-actions">
                <button type="button" class="btn btn-primary map-load-btn" data-id="${entry.id}">${t('mapPickerLoad')}</button>
                <button type="button" class="btn btn-muted map-del-btn" data-id="${entry.id}">${t('mapPickerDelete')}</button>
              </div>
            `;
            listEl.appendChild(li);
        });
    }

    if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
    } else {
        dialog.setAttribute('open', '');
    }
}

function closeMapPicker() {
    const dialog = document.getElementById('mapPickerDialog');
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
}

function loadMapFromLocal() {
    const list = readMapLibrary();
    if (list.length === 0) {
        addLog(t('logMapMissing'));
        return false;
    }
    openMapPicker();
    return true;
}

const _robotPhysQ = new THREE.Quaternion();
let _robotPhysPrevX = 0;
let _robotPhysPrevY = 0;
let _robotPhysPrevZ = 0;
let _robotPhysPrevYaw = 0;
let _robotPhysPrevT = 0;
function syncRobotPhysicsBody(dt = 0) {
    const px = robot.position.x;
    const py = robot.position.y;
    const pz = robot.position.z;
    // Kinematic bodies only shove dynamics if they carry velocity — teleport alone does nothing.
    if (dt > 1e-4 && _robotPhysPrevT > 0) {
        // Kinematic hull must carry world velocity so cannon-es can shove dynamic props.
        const shove = hitObjects ? (0.95 + physicsLevel * 0.12) : 1;
        robotBody.velocity.set(
            ((px - _robotPhysPrevX) / dt) * shove,
            (py - _robotPhysPrevY) / dt,
            ((pz - _robotPhysPrevZ) / dt) * shove,
        );
        robotBody.angularVelocity.set(0, (robot.rotation.y - (_robotPhysPrevYaw || robot.rotation.y)) / dt, 0);
    } else {
        robotBody.velocity.set(0, 0, 0);
        robotBody.angularVelocity.set(0, 0, 0);
    }
    robotBody.position.set(px, py, pz);
    _robotPhysQ.setFromEuler(robot.rotation);
    robotBody.quaternion.set(_robotPhysQ.x, _robotPhysQ.y, _robotPhysQ.z, _robotPhysQ.w);
    _robotPhysPrevX = px;
    _robotPhysPrevY = py;
    _robotPhysPrevZ = pz;
    _robotPhysPrevYaw = robot.rotation.y;
    _robotPhysPrevT = 1;
}

function missionPhysicsOn() {
    return animating === 1 && paused === 0;
}

function holdBodiesToMeshes() {
    const hold = (prop) => {
        if (!prop?.body || !prop.mesh) return;
        if (prop.body.type === CANNON.Body.KINEMATIC) return;
        const p = prop.mesh.position;
        const q = prop.mesh.quaternion;
        prop.body.position.set(p.x, p.y, p.z);
        prop.body.quaternion.set(q.x, q.y, q.z, q.w);
        prop.body.velocity.set(0, 0, 0);
        prop.body.angularVelocity.set(0, 0, 0);
    };
    physicsProps.forEach(hold);
    stageCones.forEach(hold);
}

function wakeAllDynamics() {
    const wake = (prop) => {
        if (!prop?.body || prop.body.type === CANNON.Body.KINEMATIC) return;
        prop.body.wakeUp();
    };
    physicsProps.forEach(wake);
    stageCones.forEach(wake);
}

function stepPhysics(dt) {
    syncRobotPhysicsBody(dt);
    if (typeof updatePropTerrainMasks === 'function') updatePropTerrainMasks();
    if (!missionPhysicsOn()) {
        holdBodiesToMeshes();
        return;
    }
    applyRobotPushImpulse(dt);
    if (typeof wakeUnsupportedProps === 'function') wakeUnsupportedProps();
    // One internalStep per frame (no accumulator). Passing (dt, dt, 5) skipped
    // gravity whenever the accumulator stayed below the fixed step.
    const h = Math.max(1 / 120, Math.min(dt || 1 / 60, 1 / 30));
    physicsWorld.step(h);
    const syncPhysMesh = ({ mesh, body }) => {
        if (!Number.isFinite(body.position.x) || !Number.isFinite(body.position.y)) {
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
            return;
        }
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    };
    physicsProps.forEach(syncPhysMesh);
    stageCones.forEach(syncPhysMesh);
}

// ✏️ Terrain stamps — draw a polygon, then extrude ↑ mountain / ↓ depression
const STAMP_HEIGHT_MIN = -5;
const STAMP_HEIGHT_MAX = 5;
const STAMP_FLAT_EPS = 0.08;
const STAMP_WALL_THICK = 0.22;
const STAMP_DRAW_STEP = 0.28;
const STAMP_MIN_AREA = 0.8;
const STAMP_MIN_POINTS = 4;
const STAMP_BOWL_STEP = 0.45;
const ROVER_GRAVITY = -15;

const terrainStampGroup = new THREE.Group();
scene.add(terrainStampGroup);
const terrainStamps = [];
let selectedStamp = null;
let drawTerrainMode = 0;
let isDrawingStroke = 0;
let drawStrokePoints = [];
let robotVy = 0;

const stampMats = {
    flat: new THREE.MeshStandardMaterial({
        color: 0x00ffcc, transparent: true, opacity: 0.32, roughness: 0.9,
        depthWrite: false, side: THREE.DoubleSide,
    }),
    relief: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.88,
        metalness: 0,
        vertexColors: true,
        side: THREE.DoubleSide,
    }),
    reliefGrid: new THREE.MeshBasicMaterial({
        color: 0x72b9c9,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
    }),
    sensorWall: new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
        side: THREE.DoubleSide,
    }),
    outline: new THREE.LineBasicMaterial({ color: 0x88ffee }),
    outlineSel: new THREE.LineBasicMaterial({ color: 0xffcc44 }),
};

const drawPreviewLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.95 }),
);
drawPreviewLine.visible = false;
drawPreviewLine.frustumCulled = false;
scene.add(drawPreviewLine);

function pointInPolygon(x, z, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].x;
        const zi = pts[i].z;
        const xj = pts[j].x;
        const zj = pts[j].z;
        const denom = (zj - zi) || 1e-12;
        const hit = ((zi > z) !== (zj > z)) && (x < ((xj - xi) * (z - zi)) / denom + xi);
        if (hit) inside = !inside;
    }
    return inside;
}

function polygonAreaXZ(pts) {
    return Math.abs(polygonSignedAreaXZ(pts));
}

function polygonSignedAreaXZ(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        a += pts[i].x * pts[j].z - pts[j].x * pts[i].z;
    }
    return a * 0.5;
}

function distPointSeg(px, pz, ax, az, bx, bz) {
    const abx = bx - ax;
    const abz = bz - az;
    const den = abx * abx + abz * abz || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (pz - az) * abz) / den));
    return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

function minDistToEdges(x, z, pts) {
    let d = Infinity;
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        d = Math.min(d, distPointSeg(x, z, a.x, a.z, b.x, b.z));
    }
    return d;
}

function maxInteriorEdgeDist(pts) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < pts.length; i++) {
        minX = Math.min(minX, pts[i].x);
        maxX = Math.max(maxX, pts[i].x);
        minZ = Math.min(minZ, pts[i].z);
        maxZ = Math.max(maxZ, pts[i].z);
    }
    let best = 0.3;
    const nx = 10;
    const nz = 10;
    for (let j = 0; j <= nz; j++) {
        for (let i = 0; i <= nx; i++) {
            const x = minX + (i / nx) * (maxX - minX);
            const z = minZ + (j / nz) * (maxZ - minZ);
            if (!pointInPolygon(x, z, pts)) continue;
            best = Math.max(best, minDistToEdges(x, z, pts));
        }
    }
    return best;
}

function stampHeightAtPoint(stamp, x, z) {
    if (!stamp || Math.abs(stamp.height) < STAMP_FLAT_EPS) return 0;
    if (!pointInPolygon(x, z, stamp.points)) return 0;
    const d = minDistToEdges(x, z, stamp.points);
    const maxD = stamp.maxInteriorDist || 0.5;
    const t = Math.min(1, d / Math.max(0.12, maxD * 0.85));
    const s = t * t * (3 - 2 * t);
    return stamp.height * s;
}

function terrainHeightAt(x, z) {
    let y = 0;
    for (let i = 0; i < terrainStamps.length; i++) {
        const h = stampHeightAtPoint(terrainStamps[i], x, z);
        if (Math.abs(h) > Math.abs(y)) y = h;
    }
    return y;
}

function worldWheelXZ(px, pz, yaw, lx, lz) {
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    // Local +Z forward, +X right (matches applyMotion).
    return {
        x: px + lx * cos + lz * sin,
        z: pz - lx * sin + lz * cos,
    };
}

function sampleWheelTerrain(px, pz, yaw) {
    const out = [];
    for (let i = 0; i < wheelPositions.length; i++) {
        const lx = wheelPositions[i][0];
        const lz = wheelPositions[i][2];
        const w = worldWheelXZ(px, pz, yaw, lx, lz);
        out.push({ lx, lz, h: terrainHeightAt(w.x, w.z) });
    }
    return out;
}

function roverTerrainHeight() {
    const samples = sampleWheelTerrain(robot.position.x, robot.position.z, robot.rotation.y);
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i].h;
    return sum / samples.length;
}

function clampRoverTilt(a) {
    return Math.max(-ROVER_MAX_TILT, Math.min(ROVER_MAX_TILT, a));
}

function bodyInTerrainCut(body) {
    if (!body) return 0;
    const x = body.position.x;
    const y = body.position.y;
    const z = body.position.z;
    if (y > 0.45) return 0;
    for (let i = 0; i < terrainStamps.length; i++) {
        const stamp = terrainStamps[i];
        if (stamp.height >= -STAMP_FLAT_EPS) continue;
        if (pointInPolygon(x, z, stamp.points)) return 1;
    }
    return 0;
}

function updatePropTerrainMasks() {
    for (let i = 0; i < physicsProps.length; i++) {
        const prop = physicsProps[i];
        if (prop.isStageCone) continue;
        prop.body.collisionFilterMask = bodyInTerrainCut(prop.body) ? ~FILTER_GROUND : -1;
    }
}

function polygonToShapeXZ(points) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, -points[0].z);
    for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, -points[i].z);
    }
    shape.closePath();
    return shape;
}

function shapeGeometryOnXZ(points, y) {
    const geo = new THREE.ShapeGeometry(polygonToShapeXZ(points));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y, 0);
    return geo;
}

function geometryToTrimesh(geometry) {
    const pos = geometry.attributes.position;
    const vertices = [];
    for (let i = 0; i < pos.count; i++) {
        vertices.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    let indices;
    if (geometry.index) {
        indices = Array.from(geometry.index.array);
    } else {
        indices = [];
        for (let i = 0; i < pos.count; i++) indices.push(i);
    }
    return new CANNON.Trimesh(vertices, indices);
}

function addStampPhysicsMesh(stamp, mesh) {
    stamp.sensorMeshes.push(mesh);
    if (typeof collisionSys !== 'undefined' && collisionSys.addTerrainMesh) {
        collisionSys.addTerrainMesh(mesh);
    }
}

function addReliefSensorWalls(stamp) {
    const pts = stamp.points;
    const wallHeight = Math.max(2.5, Math.abs(stamp.height));
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const len = Math.hypot(dx, dz);
        if (len < 0.08) continue;

        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(0.10, wallHeight, len),
            stampMats.sensorWall,
        );
        wall.position.set(
            (a.x + b.x) * 0.5,
            wallHeight * 0.5,
            (a.z + b.z) * 0.5,
        );
        wall.rotation.y = Math.atan2(dx, dz);
        wall.userData.terrainStamp = stamp;
        wall.userData.terrainHeight = stamp.height;
        wall.userData.sensorOnly = true;
        stamp.group.add(wall);
        wall.updateMatrixWorld(true);
        addStampPhysicsMesh(stamp, wall);
    }
}

function addStampTrimesh(stamp, geometry) {
    try {
        const body = new CANNON.Body({ mass: 0, material: groundMaterial });
        body.collisionFilterGroup = FILTER_TERRAIN;
        body.collisionFilterMask = -1;
        body.addShape(geometryToTrimesh(geometry));
        physicsWorld.addBody(body);
        stamp.bodies.push(body);
    } catch (err) {
        // Trimesh can reject degenerate triangles — skip physics for this piece.
    }
}

function buildReliefGeometry(pts, elevation) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < pts.length; i++) {
        minX = Math.min(minX, pts[i].x);
        maxX = Math.max(maxX, pts[i].x);
        minZ = Math.min(minZ, pts[i].z);
        maxZ = Math.max(maxZ, pts[i].z);
    }
    const maxD = maxInteriorEdgeDist(pts);
    const cols = Math.max(6, Math.ceil((maxX - minX) / STAMP_BOWL_STEP));
    const rows = Math.max(6, Math.ceil((maxZ - minZ) / STAMP_BOWL_STEP));
    const verts = [];
    const colors = [];
    const indices = [];

    function heightAt(x, z) {
        if (!pointInPolygon(x, z, pts)) return 0;
        const t = Math.min(1, minDistToEdges(x, z, pts) / Math.max(0.12, maxD * 0.85));
        const s = t * t * (3 - 2 * t);
        return elevation * s;
    }

    function vert(x, z) {
        const y = heightAt(x, z);
        const i = verts.length / 3;
        verts.push(x, y, z);
        const strength = Math.min(1, Math.abs(y) / Math.max(0.1, Math.abs(elevation)));
        const low = elevation > 0 ? new THREE.Color(0x315b45) : new THREE.Color(0x18243b);
        const high = elevation > 0 ? new THREE.Color(0x9a8154) : new THREE.Color(0x456b88);
        low.lerp(high, strength);
        colors.push(low.r, low.g, low.b);
        return i;
    }

    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const x0 = minX + (i / cols) * (maxX - minX);
            const z0 = minZ + (j / rows) * (maxZ - minZ);
            const x1 = minX + ((i + 1) / cols) * (maxX - minX);
            const z1 = minZ + ((j + 1) / rows) * (maxZ - minZ);
            const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
            let insideN = 0;
            for (let k = 0; k < 4; k++) {
                if (pointInPolygon(corners[k][0], corners[k][1], pts)) insideN += 1;
            }
            if (insideN < 3) continue;
            const a = vert(x0, z0);
            const b = vert(x1, z0);
            const c = vert(x1, z1);
            const d = vert(x0, z1);
            indices.push(a, b, c, a, c, d);
        }
    }
    if (verts.length < 9 || indices.length < 3) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function addPitWalls(stamp, depth) {
    const pts = stamp.points;
    const thick = STAMP_WALL_THICK;
    const inward = polygonSignedAreaXZ(pts) > 0 ? 1 : -1;
    const wallH = depth + 0.10;
    const wallY = -depth * 0.5 + 0.05;
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const len = Math.hypot(dx, dz);
        if (len < 0.08) continue;
        const nx = inward * (-dz / len);
        const nz = inward * (dx / len);
        const midX = (a.x + b.x) * 0.5 + nx * (thick * 0.45);
        const midZ = (a.z + b.z) * 0.5 + nz * (thick * 0.45);
        const angle = Math.atan2(dx, dz);
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(thick, wallH, len),
            stampMats.pitWall,
        );
        mesh.position.set(midX, wallY, midZ);
        mesh.rotation.y = angle;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.terrainStamp = stamp;
        stamp.group.add(mesh);
        addStampPhysicsMesh(stamp, mesh);

        const body = new CANNON.Body({ mass: 0, material: groundMaterial });
        body.collisionFilterGroup = FILTER_TERRAIN;
        body.collisionFilterMask = -1;
        body.addShape(new CANNON.Box(new CANNON.Vec3(thick * 0.5, wallH * 0.5, len * 0.5)));
        body.position.set(midX, wallY, midZ);
        body.quaternion.setFromEuler(0, angle, 0);
        physicsWorld.addBody(body);
        stamp.bodies.push(body);
    }
}

function clearStampVisual(stamp) {
    for (let i = 0; i < stamp.sensorMeshes.length; i++) {
        if (typeof collisionSys !== 'undefined' && collisionSys.removeTerrainMesh) {
            collisionSys.removeTerrainMesh(stamp.sensorMeshes[i]);
        }
    }
    stamp.sensorMeshes.length = 0;
    for (let i = 0; i < stamp.bodies.length; i++) {
        physicsWorld.removeBody(stamp.bodies[i]);
    }
    stamp.bodies.length = 0;
    while (stamp.group.children.length > 0) {
        const ch = stamp.group.children[0];
        stamp.group.remove(ch);
        if (ch.geometry) ch.geometry.dispose();
    }
}

function addStampOutline(stamp) {
    const pts = stamp.points;
    const verts = [];
    for (let i = 0; i < pts.length; i++) {
        verts.push(pts[i].x, 0.05, pts[i].z);
    }
    verts.push(pts[0].x, 0.05, pts[0].z);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    const line = new THREE.Line(geo, selectedStamp === stamp ? stampMats.outlineSel : stampMats.outline);
    line.userData.terrainStamp = stamp;
    stamp.group.add(line);
    stamp.outline = line;
}

function rebuildStampMesh(stamp) {
    clearStampVisual(stamp);
    stamp.maxInteriorDist = maxInteriorEdgeDist(stamp.points);
    const h = stamp.height;
    if (Math.abs(h) < STAMP_FLAT_EPS) {
        const fill = new THREE.Mesh(shapeGeometryOnXZ(stamp.points, 0.03), stampMats.flat);
        fill.receiveShadow = true;
        fill.userData.terrainStamp = stamp;
        stamp.group.add(fill);
        addStampOutline(stamp);
        rebuildArenaFloor();
        return;
    }
    const reliefGeo = buildReliefGeometry(stamp.points, h);
    if (reliefGeo) {
        const relief = new THREE.Mesh(reliefGeo, stampMats.relief);
        relief.receiveShadow = true;
        relief.castShadow = h > 0;
        relief.userData.terrainStamp = stamp;
        stamp.group.add(relief);

        // A terrain-conforming wire grid makes slope and depth readable.
        const reliefGrid = new THREE.Mesh(reliefGeo.clone(), stampMats.reliefGrid);
        reliefGrid.position.y = 0.012;
        reliefGrid.userData.terrainStamp = stamp;
        stamp.group.add(reliefGrid);

        addStampTrimesh(stamp, reliefGeo);
        addReliefSensorWalls(stamp);
    }
    addStampOutline(stamp);
    rebuildArenaFloor();
}

function holePointsForShape(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        const yi = -points[i].z;
        const yj = -points[j].z;
        area += points[i].x * yj - points[j].x * yi;
    }
    return area < 0 ? points : points.slice().reverse();
}

function rebuildArenaFloor() {
    plane.geometry.dispose();
    const holes = terrainStamps.filter((s) => s.height < -STAMP_FLAT_EPS && s.points.length >= 3);
    if (holes.length === 0) {
        plane.geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
        if (gridHelper) gridHelper.visible = true;
        return;
    }
    const h = PLANE_HALF;
    const shape = new THREE.Shape();
    shape.moveTo(-h, -h);
    shape.lineTo(h, -h);
    shape.lineTo(h, h);
    shape.lineTo(-h, h);
    shape.closePath();
    for (let i = 0; i < holes.length; i++) {
        const pts = holePointsForShape(holes[i].points);
        const hole = new THREE.Path();
        hole.moveTo(pts[0].x, -pts[0].z);
        for (let n = 1; n < pts.length; n++) {
            hole.lineTo(pts[n].x, -pts[n].z);
        }
        hole.closePath();
        shape.holes.push(hole);
    }
    try {
        plane.geometry = new THREE.ShapeGeometry(shape);
    } catch (err) {
        plane.geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
    }
    if (gridHelper) {
        gridHelper.visible = holes.length === 0;
    }
}

function stampHeightCaption(h) {
    if (Math.abs(h) < STAMP_FLAT_EPS) return t('stampHeightFlat');
    if (h > 0) return t('stampHeightCavity', { m: Number(h).toFixed(1) });
    return t('stampHeightBowl', { m: Math.abs(h).toFixed(1) });
}

function updateStampHeightUi() {
    const slider = document.getElementById('stampHeight');
    const valueEl = document.getElementById('stampHeightValue');
    const h = selectedStamp ? selectedStamp.height : 0;
    if (slider) {
        slider.disabled = !selectedStamp;
        slider.value = String(h);
    }
    if (valueEl) valueEl.textContent = stampHeightCaption(h);
}

function selectStamp(stamp) {
    if (selectedStamp && selectedStamp.outline) {
        selectedStamp.outline.material = stampMats.outline;
    }
    selectedStamp = stamp;
    if (selectedStamp && selectedStamp.outline) {
        selectedStamp.outline.material = stampMats.outlineSel;
    }
    updateStampHeightUi();
}

function findStampFromMesh(object) {
    let node = object;
    while (node) {
        if (node.userData?.terrainStamp) return node.userData.terrainStamp;
        node = node.parent;
    }
    return null;
}

function terrainStampPickMeshes() {
    const list = [];
    for (let i = 0; i < terrainStamps.length; i++) {
        const g = terrainStamps[i].group;
        for (let n = 0; n < g.children.length; n++) {
            if (!g.children[n].userData?.sensorOnly) list.push(g.children[n]);
        }
    }
    return list;
}

function createTerrainStamp(points) {
    const stamp = {
        points,
        height: 0,
        group: new THREE.Group(),
        bodies: [],
        sensorMeshes: [],
        outline: null,
        maxInteriorDist: maxInteriorEdgeDist(points),
    };
    stamp.group.userData.terrainStamp = stamp;
    terrainStampGroup.add(stamp.group);
    terrainStamps.push(stamp);
    rebuildStampMesh(stamp);
    selectStamp(stamp);
    return stamp;
}

function removeTerrainStamp(stamp) {
    if (!stamp) return;
    clearStampVisual(stamp);
    terrainStampGroup.remove(stamp.group);
    const idx = terrainStamps.indexOf(stamp);
    if (idx >= 0) terrainStamps.splice(idx, 1);
    if (selectedStamp === stamp) selectedStamp = null;
    rebuildArenaFloor();
    updateStampHeightUi();
}

function setStampHeight(stamp, height) {
    if (!stamp) return;
    const next = Math.max(STAMP_HEIGHT_MIN, Math.min(STAMP_HEIGHT_MAX, height));
    stamp.height = Math.abs(next) < STAMP_FLAT_EPS ? 0 : next;
    rebuildStampMesh(stamp);
    updateStampHeightUi();
}

function applyRoverTerrain(dt) {
    const yaw = robot.rotation.y;
    const samples = sampleWheelTerrain(robot.position.x, robot.position.z, yaw);

    let hF = 0;
    let hR = 0;
    let hL = 0;
    let hRt = 0;
    let nF = 0;
    let nR = 0;
    let nL = 0;
    let nRt = 0;
    let hSum = 0;
    for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        hSum += s.h;
        if (s.lz > 0) {
            hF += s.h;
            nF += 1;
        } else {
            hR += s.h;
            nR += 1;
        }
        if (s.lx < 0) {
            hL += s.h;
            nL += 1;
        } else {
            hRt += s.h;
            nRt += 1;
        }
    }
    hF /= Math.max(1, nF);
    hR /= Math.max(1, nR);
    hL /= Math.max(1, nL);
    hRt /= Math.max(1, nRt);
    const supportY = hSum / samples.length;

    const wheelbase = Math.abs(wheelPositions[0][2] - wheelPositions[2][2]);
    const track = Math.abs(wheelPositions[0][0] - wheelPositions[1][0]);
    // Facing +Z, YXZ: +pitch (x) lowers the nose; climb (front higher) → negative x.
    // +roll (z) raises the right side; left higher → negative z.
    const targetPitch = clampRoverTilt(-Math.atan2(hF - hR, wheelbase));
    const targetRoll = clampRoverTilt(Math.atan2(hRt - hL, track));

    if (robot.position.y > supportY + 0.04) {
        robotVy += ROVER_GRAVITY * dt;
        robot.position.y += robotVy * dt;
        if (robot.position.y <= supportY) {
            robot.position.y = supportY;
            robotVy = 0;
        }
    } else {
        robot.position.y = supportY;
        robotVy = 0;
    }

    // Follow terrain attitude while supported (keep last tilt briefly in the air).
    if (robotVy === 0 || robot.position.y <= supportY + 0.06) {
        const k = Math.min(1, ROVER_TILT_RATE * dt);
        robot.rotation.x += (targetPitch - robot.rotation.x) * k;
        robot.rotation.z += (targetRoll - robot.rotation.z) * k;
    }

    // Independent wheel travel so contacts sit on the ground while the body rides the plane.
    const pitch = robot.rotation.x;
    const roll = robot.rotation.z;
    for (let i = 0; i < wheels.length; i++) {
        const s = samples[i];
        const planeY = supportY + s.lx * Math.sin(roll) - s.lz * Math.sin(pitch);
        let travel = s.h - planeY;
        if (travel > ROVER_SUSP_TRAVEL) travel = ROVER_SUSP_TRAVEL;
        if (travel < -ROVER_SUSP_TRAVEL) travel = -ROVER_SUSP_TRAVEL;
        wheels[i].position.y = WHEEL_AXLE_Y + travel;
    }

    robot.updateMatrixWorld();
}

function setDrawTerrainMode(on) {
    drawTerrainMode = on ? 1 : 0;
    if (!drawTerrainMode) cancelTerrainStroke();
    const btn = document.getElementById('drawTerrainBtn');
    if (btn) {
        btn.classList.toggle('active', !!drawTerrainMode);
        btn.setAttribute('aria-pressed', drawTerrainMode ? 'true' : 'false');
    }
    viewport.classList.toggle('drawing-terrain', !!drawTerrainMode);
    if (drawTerrainMode) {
        if (moveObjectsEl) {
            moveObjectsEl.checked = false;
            moveObjectsMode = 0;
        }
        deselectProp();
        setRobotSelected(0);
        if (typeof statusEl !== 'undefined' && statusEl) {
            statusEl.textContent = t('modeDrawTerrain');
        }
    } else if (typeof updateModeUi === 'function') {
        updateModeUi();
    }
    if (typeof syncCameraControls === 'function') syncCameraControls();
}

function beginTerrainStroke(x, z) {
    isDrawingStroke = 1;
    const c = clampToArena(x, z);
    drawStrokePoints = [{ x: c.x, z: c.z }];
    updateDrawPreview();
}

function appendTerrainStroke(x, z) {
    const c = clampToArena(x, z);
    const last = drawStrokePoints[drawStrokePoints.length - 1];
    if (last && Math.hypot(c.x - last.x, c.z - last.z) < STAMP_DRAW_STEP) return;
    drawStrokePoints.push({ x: c.x, z: c.z });
    updateDrawPreview();
}

function updateDrawPreview() {
    const pts = drawStrokePoints;
    if (pts.length < 1) {
        drawPreviewLine.visible = false;
        return;
    }
    const verts = [];
    for (let i = 0; i < pts.length; i++) {
        verts.push(pts[i].x, 0.06, pts[i].z);
    }
    drawPreviewLine.geometry.dispose();
    drawPreviewLine.geometry = new THREE.BufferGeometry();
    drawPreviewLine.geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    drawPreviewLine.visible = true;
}

function cancelTerrainStroke() {
    isDrawingStroke = 0;
    drawStrokePoints = [];
    drawPreviewLine.visible = false;
}

function finishTerrainStroke() {
    const pts = drawStrokePoints.slice();
    cancelTerrainStroke();
    if (pts.length >= 2) {
        const first = pts[0];
        const last = pts[pts.length - 1];
        if (Math.hypot(last.x - first.x, last.z - first.z) < 0.45) pts.pop();
    }
    if (pts.length < STAMP_MIN_POINTS || polygonAreaXZ(pts) < STAMP_MIN_AREA) {
        if (typeof addLog === 'function') addLog(t('logStampTooSmall'));
        if (typeof statusEl !== 'undefined' && statusEl) statusEl.textContent = t('logStampTooSmall');
        return;
    }
    createTerrainStamp(pts);
    setDrawTerrainMode(0);
    if (typeof addLog === 'function') addLog(t('logStampDrawn', { n: pts.length }));
}

const COLLISION_RESOLVE_STEP = 0.08;
const MOTION_SWEEP_STEP = 0.08;
const ROTATION_SWEEP_STEP = 0.05;
let lastHitTest = { clear: 1, object: null };

function hitInsetMeters() {
    // Collision is world-space only: never shrink it according to screen pixels.
    return 0;
}

function roverFootprintCorners(x, z, rotY, inset = 0) {
    const hw = ROBOT_COLLISION.halfWidth - inset;
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

function segmentsIntersect2d(a, b, c, d) {
    const cross = (p, q, r) => (
        (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x)
    );
    const abC = cross(a, b, c);
    const abD = cross(a, b, d);
    const cdA = cross(c, d, a);
    const cdB = cross(c, d, b);
    return ((abC > 0 && abD < 0) || (abC < 0 && abD > 0))
        && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0));
}

function polygonsIntersectGeneral(a, b) {
    for (let i = 0; i < a.length; i++) {
        if (pointInPolygon(a[i].x, a[i].z, b)) return 1;
    }
    for (let i = 0; i < b.length; i++) {
        if (pointInPolygon(b[i].x, b[i].z, a)) return 1;
    }
    for (let i = 0; i < a.length; i++) {
        const aNext = a[(i + 1) % a.length];
        for (let j = 0; j < b.length; j++) {
            const bNext = b[(j + 1) % b.length];
            if (segmentsIntersect2d(a[i], aNext, b[j], bNext)) return 1;
        }
    }
    return 0;
}

function terrainStampOverlap(rover) {
    for (let i = 0; i < terrainStamps.length; i++) {
        const stamp = terrainStamps[i];
        if (Math.abs(stamp.height) < STAMP_FLAT_EPS) continue;
        if (stamp.height < 0 && !sensorConfig.floorIr) continue;
        if (polygonsIntersectGeneral(rover, stamp.points)) return i;
    }
    return -1;
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
    target.min.set(minX, robot.position.y, minZ);
    target.max.set(maxX, robot.position.y + ROBOT_COLLISION.centerY + ROBOT_COLLISION.halfHeight, maxZ);
    return target;
}

/** World AABB for a hypothetical rover pose (for 3D Box3 hit-tests). */
function roverBoxAt(x, z, rotY, target = new THREE.Box3()) {
    const c = roverFootprintCorners(x, z, rotY, 0);
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
    const y0 = robot.position.y;
    target.min.set(minX, y0, minZ);
    target.max.set(maxX, y0 + ROBOT_COLLISION.centerY + ROBOT_COLLISION.halfHeight, maxZ);
    return target;
}

/**
 * Hit-test / pose query.
 * - Default (physics / motion): ALL solids — cones, props, terrain. Sensors never ghost the hull.
 * - options.forNav=1 + Hit Objects: skip light props so Bug2 doesn't treat balls as walls.
 * - options.detect=1: real Three.js Box3∩Box3 contact (bumper visual + knock).
 */
function queryPose(x, z, rotY, options = {}) {
    const detect = options.detect === 1;
    const skipCones = options.skipCones === 1;
    const skipLightProps = detect
        ? false
        : (options.forNav === 1 && (!!hitObjects || options.skipLightProps === 1));
    const box = new THREE.Box3();
    const rover2d = roverFootprintCorners(x, z, rotY, 0);
    const rover3d = detect ? roverBoxAt(x, z, rotY) : null;
    // Tight world contact (~2 cm). Fat margins made stacks look “glued” and multi-hit.
    const CONTACT_MARGIN = 0.02;

    if (!skipCones) {
        for (let i = 0; i < obstacles.length; i++) {
            box.setFromObject(obstacles[i]);
            const hit = detect
                ? rover3d.clone().expandByScalar(CONTACT_MARGIN).intersectsBox(box)
                : polygonsOverlap(rover2d, boxCorners2d(box));
            if (hit) {
                lastHitTest = {
                    clear: 0,
                    kind: 'cone',
                    id: i,
                    x: Number(obstacles[i].position.x.toFixed(2)),
                    z: Number(obstacles[i].position.z.toFixed(2)),
                    pushable: hitObjects ? 1 : 0,
                };
                return lastHitTest;
            }
        }
    }
    for (let i = 0; i < physicsProps.length; i++) {
        const prop = physicsProps[i];
        const light = prop.mass < HEAVY_PROP_KG;
        if (skipLightProps && light) continue;
        box.setFromObject(prop.mesh);
        let hit;
        if (detect) {
            hit = rover3d.clone().expandByScalar(CONTACT_MARGIN).intersectsBox(box);
        } else {
            hit = polygonsOverlap(rover2d, boxCorners2d(box));
        }
        if (hit) {
            lastHitTest = {
                clear: 0,
                kind: prop.type,
                id: i,
                x: Number(prop.mesh.position.x.toFixed(2)),
                z: Number(prop.mesh.position.z.toFixed(2)),
                pushable: light ? 1 : 0,
            };
            return lastHitTest;
        }
    }
    const terrainId = terrainStampOverlap(rover2d);
    if (terrainId >= 0) {
        lastHitTest = {
            clear: 0,
            kind: 'terrain',
            id: terrainId,
            x: Number(x.toFixed(2)),
            z: Number(z.toFixed(2)),
            pushable: 0,
        };
        return lastHitTest;
    }
    lastHitTest = { clear: 1, kind: null, id: -1, x: null, z: null, pushable: 0 };
    return lastHitTest;
}

/** Nav-only pose: may ignore pushable junk when Hit Objects is on. */
function queryPoseForNav(x, z, rotY) {
    return queryPose(x, z, rotY, { forNav: 1 });
}

// Blind mode: only immovable things stop the rover (static cones + heavy props).
// Light props are pushable via cannon-es and must not block applyMotion.

/** Props react to rover graze. Independent from Spring bumper (hitTest). */
let hitObjects = 1;
/** 1 soft … 3 default … 5 Angry Birds launch. */
let physicsLevel = 3;

/**
 * Solid world collision — independent of LIDAR / US / IR / bumper checkboxes.
 * Sensors change what the *brain* sees; the hull always collides with immovables.
 * With Hit Objects on, light props are pushable: do NOT freeze the rover against them
 * (that blocked knock and looked like “nothing moves”).
 */
function poseBlocksMotion(x, z, rotY) {
    // Dynamic cannon bodies (props + stage cones) must overlap the hull so the
    // solver can knock them. Geometric freeze here looked like “no physics”.
    if (hitObjects) {
        return queryPose(x, z, rotY, { forNav: 1, skipCones: 1 }).clear === 0 ? 1 : 0;
    }
    return queryPose(x, z, rotY).clear === 0 ? 1 : 0;
}

function robotIntersectsObstaclesAt(x, z, rotY) {
    return queryPose(x, z, rotY).clear === 0;
}

function depenetrateRobot() {
    // Only resolve against immovable solids. Pushables are knocked by physics, not slid off.
    const hit = queryPose(robot.position.x, robot.position.z, robot.rotation.y);
    if (hit.clear) return 0;
    if (hit.pushable) return 0;
    for (let ring = 1; ring <= 24; ring++) {
        const radius = COLLISION_RESOLVE_STEP * ring;
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const nx = robot.position.x + Math.cos(angle) * radius;
            const nz = robot.position.z + Math.sin(angle) * radius;
            const probe = queryPose(nx, nz, robot.rotation.y);
            if (probe.clear || probe.pushable) {
                robot.position.x = nx;
                robot.position.z = nz;
                clampRobotPosition();
                return 1;
            }
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

const propLaunchCooldown = new WeakMap();

/** Cap cannon speeds so repeated tips don't explode the sim (vy:400 etc.). */
function clampPropSpeed(body, maxLin = 16, maxAng = 20) {
    if (!body) return;
    const v = body.velocity;
    const sp = Math.hypot(v.x, v.y, v.z);
    if (sp > maxLin && sp > 1e-6) {
        const s = maxLin / sp;
        v.x *= s;
        v.y *= s;
        v.z *= s;
    }
    const w = body.angularVelocity;
    const wsp = Math.hypot(w.x, w.y, w.z);
    if (wsp > maxAng && wsp > 1e-6) {
        const s = maxAng / wsp;
        w.x *= s;
        w.y *= s;
        w.z *= s;
    }
}

/** True if `upper` rests on `lower` (XZ overlap + bottom near top). */
function isStackedOn(upper, lower) {
    if (!upper?.mesh || !lower?.mesh || upper === lower) return false;
    if (upper.mesh.position.y <= lower.mesh.position.y + 0.12) return false;
    const ub = new THREE.Box3().setFromObject(upper.mesh);
    const lb = new THREE.Box3().setFromObject(lower.mesh);
    if (ub.max.x < lb.min.x || ub.min.x > lb.max.x
        || ub.max.z < lb.min.z || ub.min.z > lb.max.z) return false;
    return ub.min.y <= lb.max.y + 0.4;
}

function propsStackedOn(base) {
    const out = [];
    for (let i = 0; i < physicsProps.length; i++) {
        const prop = physicsProps[i];
        if (prop.mass >= HEAVY_PROP_KG) continue;
        if (isStackedOn(prop, base)) out.push(prop);
    }
    return out;
}

function findSupportBelow(prop) {
    let best = null;
    let bestY = -Infinity;
    for (let i = 0; i < physicsProps.length; i++) {
        const other = physicsProps[i];
        if (!isStackedOn(prop, other)) continue;
        if (other.mesh.position.y > bestY) {
            bestY = other.mesh.position.y;
            best = other;
        }
    }
    return best;
}

/** Wake sleeping stack neighbors so balls fall when the base is yanked (Angry Birds). */
function wakeNearbyProps(origin, radius = 2.8) {
    if (!origin || !origin.body) return;
    const ox = origin.body.position.x;
    const oy = origin.body.position.y;
    const oz = origin.body.position.z;
    for (let i = 0; i < physicsProps.length; i++) {
        const prop = physicsProps[i];
        if (prop === origin || !prop.body || prop.mass >= HEAVY_PROP_KG) continue;
        const dx = prop.body.position.x - ox;
        const dy = prop.body.position.y - oy;
        const dz = prop.body.position.z - oz;
        if ((dx * dx + dy * dy + dz * dz) <= radius * radius) {
            prop.body.wakeUp();
        }
    }
}

/** Wake stacked pieces so gravity drops them. Scripted vy cancelled rolling and looked robotic. */
function tipStackedProps(base, nx, nz, level, depth = 0) {
    if (!base || depth > 4) return;
    const tops = propsStackedOn(base);
    for (let i = 0; i < tops.length; i++) {
        const top = tops[i];
        if (!top.body) continue;
        top.body.wakeUp();
        tipStackedProps(top, nx, nz, level, depth + 1);
    }
}

function roverSpeedXZ() {
    return Math.hypot(robotBody.velocity.x, robotBody.velocity.z);
}

/**
 * Soft cannon-es shove. Never SET world velocity or teleport — that looked
 * robotic and cancelled gravity / rolling.
 */
function knockPropAway(prop, level, opts = {}) {
    if (!prop || !prop.body) return;
    const tipOnly = opts.tipOnly === 1;
    const dx = prop.body.position.x - robot.position.x;
    const dz = prop.body.position.z - robot.position.z;
    let dist = Math.hypot(dx, dz);
    let nx;
    let nz;
    if (dist < 0.04) {
        const yaw = robot.rotation.y;
        nx = Math.sin(yaw);
        nz = Math.cos(yaw);
        dist = 0.04;
    } else {
        nx = dx / dist;
        nz = dz / dist;
    }

    prop.body.wakeUp();
    if (tipOnly) {
        tipStackedProps(prop, nx, nz, level);
        return;
    }

    const speed = Math.max(roverSpeedXZ(), 0.8);
    // Impulse already /mass in cannon-es. Extra 5/kg so the Weight slider is obvious:
    // 0.5 kg flies, 5 kg default shove, 40 kg barely budges.
    const massScale = 5 / Math.max(prop.mass || DEFAULT_PROP_MASS, 0.5);
    const mag = Math.min(
        14,
        speed * (0.9 + level * 0.35) * massScale,
    );
    const lift = mag * (0.06 + level * 0.02);
    const impulse = new CANNON.Vec3(nx * mag, lift, nz * mag);
    const r = propHalfHeight(prop) * 0.35;
    prop.body.applyImpulse(impulse, new CANNON.Vec3(0, -r, 0));
    if (prop.type === 'sphere') {
        const rad = Math.max(0.2, 0.5 * (prop.scale || 1));
        const roll = speed / rad;
        prop.body.angularVelocity.x += -nz * roll * 0.35;
        prop.body.angularVelocity.z += nx * roll * 0.35;
        prop.body.angularDamping = 0.04;
    }
    clampPropSpeed(prop.body, 10, 14);
    wakeNearbyProps(prop, 1.6);
    tipStackedProps(prop, nx, nz, level);
}

/** All light cannon bodies whose AABB currently touches the rover. */
function collectPushableContacts(x, z, rotY) {
    const CONTACT_MARGIN = 0.03;
    const rover3d = roverBoxAt(x, z, rotY).expandByScalar(CONTACT_MARGIN);
    const box = new THREE.Box3();
    const hits = [];
    const consider = (prop) => {
        if (!prop || !prop.body || prop.mass >= HEAVY_PROP_KG) return;
        box.setFromObject(prop.mesh);
        if (rover3d.intersectsBox(box)) hits.push(prop);
    };
    for (let i = 0; i < physicsProps.length; i++) consider(physicsProps[i]);
    for (let i = 0; i < stageCones.length; i++) consider(stageCones[i]);
    return hits;
}

function syncRobotPropCollisionMask() {
    robotBody.collisionFilterMask = hitObjects
        ? (FILTER_GROUND | FILTER_TERRAIN | FILTER_PROP)
        : (FILTER_GROUND | FILTER_TERRAIN);
}

/** Write cannon-es velocities on overlap. The solver then integrates gravity / stacking. */
function applyRobotPushImpulse(dt) {
    syncRobotPropCollisionMask();
    if (dt <= 0 || !hitObjects) return;
    if (roverSpeedXZ() < 0.35) return;
    const level = Math.max(1, Math.min(5, physicsLevel));
    const now = performance.now();
    const cooldownMs = Math.max(160, 320 - level * 24);
    const hits = collectPushableContacts(
        robot.position.x,
        robot.position.z,
        robot.rotation.y,
    );
    if (hits.length === 0) return;
    hits.sort((a, b) => a.mesh.position.y - b.mesh.position.y);
    for (let i = 0; i < hits.length; i++) {
        const prop = hits[i];
        const last = propLaunchCooldown.get(prop.body) || 0;
        if ((now - last) <= cooldownMs) continue;
        propLaunchCooldown.set(prop.body, now);
        let onAnotherHit = false;
        for (let j = 0; j < i; j++) {
            if (isStackedOn(prop, hits[j])) {
                onAnotherHit = true;
                break;
            }
        }
        knockPropAway(prop, level, { tipOnly: onAnotherHit ? 1 : 0 });
    }
}

// 📡 Sensor drawing — LIDAR hat, IR bulbs, Floor IR bulbs, ultrasonic cone
const radarGroup = new THREE.Group();
radarGroup.userData.sensorVisual = true;
robot.add(radarGroup);
radarGroup.position.set(0, 0.08, 0);

function makeIrBulb(hex, emissiveHex) {
    const g = new THREE.Group();
    g.userData.sensorVisual = true;
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 16, 12),
        new THREE.MeshStandardMaterial({
            color: hex,
            emissive: emissiveHex,
            emissiveIntensity: 1.4,
            metalness: 0.15,
            roughness: 0.30,
        }),
    );
    bulb.castShadow = true;
    const housing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 0.08, 12),
        new THREE.MeshStandardMaterial({
            color: 0x222830,
            metalness: 0.6,
            roughness: 0.35,
        }),
    );
    housing.rotation.x = Math.PI / 2;
    housing.position.z = -0.02;
    const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.07, 16),
        new THREE.MeshBasicMaterial({
            color: hex,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            depthWrite: false,
        }),
    );
    lens.position.z = 0.05;
    // Short glowing stub so the IR “beam” is obvious (not a 1px line)
    const stub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.055, 0.55, 10),
        new THREE.MeshBasicMaterial({
            color: hex,
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
        }),
    );
    stub.rotation.x = Math.PI / 2;
    stub.position.z = 0.32;
    g.add(housing, bulb, lens, stub);
    g.userData.bulbMat = bulb.material;
    g.userData.stub = stub;
    g.userData.lens = lens;
    return g;
}

// 3× IR front — red light bulbs on the bumper (L / C / R)
const IR_BULB_Y = 0.62;
const IR_BULB_Z = 1.88;
const IR_BULB_X = [-0.95, 0, 0.95];
const irBulbs = [];
for (let i = 0; i < 3; i++) {
    const bulb = makeIrBulb(0xff2222, 0xff0000);
    bulb.position.set(IR_BULB_X[i], IR_BULB_Y, IR_BULB_Z);
    robot.add(bulb);
    irBulbs.push(bulb);
}

// Floor IR — amber bulbs under the nose, angled slightly down/out
const FLOOR_BULB_Y = 0.18;
const FLOOR_BULB_Z = 1.55;
const FLOOR_BULB_X = [-0.55, 0, 0.55];
const FLOOR_BULB_YAW = [-0.32, 0, 0.32];
const floorIrBulbs = [];
for (let i = 0; i < 3; i++) {
    const bulb = makeIrBulb(0xffaa22, 0xff7700);
    bulb.position.set(FLOOR_BULB_X[i], FLOOR_BULB_Y, FLOOR_BULB_Z);
    bulb.rotation.y = FLOOR_BULB_YAW[i];
    bulb.rotation.x = 0.55; // aim toward floor ahead
    robot.add(bulb);
    floorIrBulbs.push(bulb);
}

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
usCone.userData.sensorVisual = true;
radarGroup.add(usCone);

const scanLinesGroup = new THREE.Group();
scanLinesGroup.userData.sensorVisual = true;
robot.add(scanLinesGroup);
scanLinesGroup.position.set(0, 1.35, 0);
const scanRaysCount = 36;
const scanRays = [];
for (let i = 0; i < scanRaysCount; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0),
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    scanLinesGroup.add(line);
    scanRays.push(line);
}

// LIDAR unit — small spinning “hat” cylinder on the roof (stereotypical 360° scanner)
const lidarHat = new THREE.Group();
lidarHat.userData.sensorVisual = true;
lidarHat.position.set(0, 1.58, 0);
robot.add(lidarHat);
const lidarHatBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.26, 0.20, 24),
    new THREE.MeshStandardMaterial({
        color: 0x1a1f26,
        metalness: 0.55,
        roughness: 0.35,
        emissive: 0x003322,
        emissiveIntensity: 0.25,
    }),
);
lidarHatBody.castShadow = true;
lidarHat.add(lidarHatBody);
const lidarHatCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, 0.06, 24),
    new THREE.MeshStandardMaterial({
        color: 0x2a333c,
        metalness: 0.4,
        roughness: 0.4,
        emissive: 0x00aa66,
        emissiveIntensity: 0.35,
    }),
);
lidarHatCap.position.y = 0.12;
lidarHat.add(lidarHatCap);
const lidarHatRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.025, 10, 32),
    new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
    }),
);
lidarHatRing.rotation.x = Math.PI / 2;
lidarHatRing.position.y = 0.04;
lidarHat.add(lidarHatRing);

function syncSensorVisuals(reading) {
    // 3× IR front — red bumper bulbs + stubs
    for (let i = 0; i < irBulbs.length; i++) {
        const on = !!sensorConfig.ir;
        irBulbs[i].visible = on;
        if (!on) continue;
        let dist = IR_RANGE;
        if (reading && reading.ir && Number.isFinite(reading.ir[i])) {
            dist = Math.max(0.08, Math.min(reading.ir[i], IR_RANGE));
        }
        const pulse = 1.1 + Math.sin(Date.now() / 180 + i) * 0.35;
        irBulbs[i].userData.bulbMat.emissiveIntensity = pulse;
        const stub = irBulbs[i].userData.stub;
        stub.scale.y = Math.max(0.15, dist / 0.55);
        stub.position.z = 0.08 + stub.scale.y * 0.275;
        stub.material.opacity = dist < IR_RANGE * 0.85 ? 0.65 : 0.40;
    }

    // Floor IR — amber under-nose bulbs
    for (let i = 0; i < floorIrBulbs.length; i++) {
        const on = !!sensorConfig.floorIr;
        floorIrBulbs[i].visible = on;
        if (!on) continue;
        let dist = FLOOR_IR_RANGE;
        if (reading && reading.floorIr && Number.isFinite(reading.floorIr[i])) {
            dist = Math.max(0.15, Math.min(reading.floorIr[i], FLOOR_IR_RANGE));
        }
        const pulse = 1.0 + Math.sin(Date.now() / 200 + i * 1.3) * 0.3;
        floorIrBulbs[i].userData.bulbMat.emissiveIntensity = pulse;
        const stub = floorIrBulbs[i].userData.stub;
        // Longer stub for floor range, still readable
        const len = Math.min(1.4, 0.35 + dist * 0.25);
        stub.scale.y = len / 0.55;
        stub.position.z = 0.08 + stub.scale.y * 0.275;
        stub.material.opacity = 0.42;
    }

    // Ultrasonic cone
    usCone.visible = !!sensorConfig.ultrasonic;
    usCone.material.opacity = sensorConfig.ultrasonic ? 0.18 : 0;

    // LIDAR hat + optional live scan rays (no idle fan — the cylinder is the icon)
    const lidarOn = !!sensorConfig.lidar;
    lidarHat.visible = lidarOn;
    if (lidarOn) {
        lidarHat.rotation.y += 0.04;
        lidarHatRing.material.opacity = 0.45 + Math.sin(Date.now() / 220) * 0.15;
    }
    if (!lidarOn) {
        for (let i = 0; i < scanRays.length; i++) {
            scanRays[i].visible = false;
            scanRays[i].material.opacity = 0;
        }
    } else if (reading && reading.lidar && typeof sensorSuite !== 'undefined' && sensorSuite.updateLidarVisuals) {
        for (let i = 0; i < scanRays.length; i++) scanRays[i].visible = true;
        sensorSuite.updateLidarVisuals(reading);
    } else {
        for (let i = 0; i < scanRays.length; i++) {
            scanRays[i].visible = false;
            scanRays[i].material.opacity = 0;
        }
    }
}

// 💥 Collision marker — red X on impact point
const collisionMarkers = [];
function triggerSpringBumper() {
    if (!sensorConfig.hitTest) return;
    bumperCompression = 1;
}

function updateSpringBumper(dt) {
    bumperCompression = Math.max(0, bumperCompression - dt * 3.5);
    bumperBar.position.z = 1.72 - bumperCompression * 0.28;
    bumperSprings.forEach((spring) => {
        spring.scale.z = Math.max(0.25, 1 - bumperCompression * 0.70);
        spring.position.z = 1.52 - bumperCompression * 0.12;
    });
    const on = sensorConfig.hitTest ? true : false;
    bumperBar.visible = on;
    bumperSprings.forEach((spring) => { spring.visible = on; });
}

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
let paused = 0;
let preMissionMap = null;
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

    const movableMeshes = [
        ...physicsProps.map((p) => p.mesh),
        ...stageCones.map((c) => c.mesh),
    ];
    if (movableMeshes.length > 0) {
        const propHits = raycaster.intersectObjects(movableMeshes, false);
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

    const stampMeshes = terrainStampPickMeshes();
    if (stampMeshes.length > 0) {
        const stampHits = raycaster.intersectObjects(stampMeshes, false);
        if (stampHits.length > 0) {
            const stamp = findStampFromMesh(stampHits[0].object);
            if (stamp) {
                return { type: 'stamp', stamp, point: stampHits[0].point };
            }
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
    if (animating) {
        if (selectedProp) setPropHighlight(selectedProp, false);
        selectedProp = null;
        moveHandle.visible = false;
        return;
    }
    if (selectedProp === prop) {
        if (prop) syncPropInspector(prop);
        return;
    }
    if (selectedProp) setPropHighlight(selectedProp, false);
    selectedProp = prop;
    if (prop) {
        setPropHighlight(prop, true);
        moveHandle.visible = true;
        syncPropInspector(prop);
        if ((mode === 'objects' || moveObjectsMode) && !animating) {
            statusEl.textContent = t('objectMoveHint');
        }
    } else {
        moveHandle.visible = false;
        syncPropInspector(null);
        updateModeUi();
    }
}

function syncPropInspector(prop) {
    const massEl = document.getElementById('objectMass');
    const massVal = document.getElementById('massValue');
    const scaleEl = document.getElementById('objectScale');
    const scaleVal = document.getElementById('scaleValue');
    if (!massEl || !scaleEl) return;
    const cone = prop?.isStageCone ? 1 : 0;
    massEl.disabled = !!cone;
    scaleEl.disabled = !!cone;
    if (prop && !cone) {
        massEl.value = String(prop.mass);
        if (massVal) massVal.textContent = Number(prop.mass).toFixed(1);
        scaleEl.value = String(prop.scale ?? 1);
        if (scaleVal) scaleVal.textContent = Number(prop.scale ?? 1).toFixed(2);
    }
}

function syncCameraControls() {
    // Move-objects / draw-terrain lock orbit so drags sculpt or move props.
    const lock = moveObjectsMode || isDraggingProp || isDraggingRobot || drawTerrainMode || isDrawingStroke;
    controls.enabled = !lock;
}

function clearDraggableAuras() {
    deselectProp();
    setRobotSelected(0);
    moveHandle.visible = false;
    robotGlowRing.visible = false;
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
    syncCameraControls();
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
    syncCameraControls();
    viewport.classList.add('dragging-prop');
    capturePointerSafe(pointerId);
}

function endPropDrag(clientX, clientY, snapGrid = true) {
    if (!dragProp) return;
    movePropOnPlane(dragProp, clientX, clientY, snapGrid);
    // Settle onto floor or on top of whatever sits under this XZ.
    restPropOnSupport(dragProp, dragProp.mesh.position.x, dragProp.mesh.position.z);
    dragProp.body.type = CANNON.Body.DYNAMIC;
    dragProp.body.mass = dragProp.isStageCone
        ? CONE_MASS
        : Math.max(0.5, dragProp.mass || DEFAULT_PROP_MASS);
    dragProp.body.updateMassProperties();
    if (missionPhysicsOn()) {
        dragProp.body.wakeUp();
    } else {
        dragProp.body.velocity.set(0, 0, 0);
        dragProp.body.angularVelocity.set(0, 0, 0);
        dragProp.body.sleep();
    }
    addLog(t('logObjectMoved', {
        type: propTypeLabel(dragProp.type),
        x: dragProp.mesh.position.x.toFixed(1),
        z: dragProp.mesh.position.z.toFixed(1),
    }));
    dragProp = null;
    dragGrabOffset = null;
    isDraggingProp = 0;
    viewport.classList.remove('dragging-prop');
    syncCameraControls();
}

function endRobotDrag(clientX, clientY, snapGrid = true) {
    if (!isDraggingRobot) return;
    moveRobotOnPlane(clientX, clientY, snapGrid);
    syncRobotPhysicsBody();
    isDraggingRobot = 0;
    dragGrabOffset = null;
    viewport.classList.remove('dragging-prop');
    syncCameraControls();
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
    const y = prop.isStageCone ? CONE_HALF_H : prop.mesh.position.y;

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
    robot.position.set(clamped.x, terrainHeightAt(clamped.x, clamped.z), clamped.z);
}

function movePropToScreen(prop, clientX, clientY) {
    movePropOnPlane(prop, clientX, clientY, false);
}

function updateMoveHandle(time) {
    if (animating || (!selectedProp && !dragProp)) {
        moveHandle.visible = false;
        return;
    }
    const prop = dragProp || selectedProp;
    moveHandle.visible = true;
    prop.mesh.getWorldPosition(moveHandle.position);
    moveHandle.position.y += propHalfHeight(prop) + 0.85 + Math.sin(time * 5) * 0.1;
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
    if (drawTerrainMode) {
        statusEl.textContent = t('modeDrawTerrain');
    } else if (moveObjectsMode) {
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
    const massEl = document.getElementById('objectMass');
    const scaleEl = document.getElementById('objectScale');
    const mass = Number.isFinite(parseFloat(massEl?.value))
        ? parseFloat(massEl.value)
        : DEFAULT_PROP_MASS;
    const scale = Number.isFinite(parseFloat(scaleEl?.value))
        ? parseFloat(scaleEl.value)
        : DEFAULT_PROP_SCALE;
    const pose = placementPoseAtScreen(clientX, clientY, objectType, scale);
    if (!pose) return false;

    const entry = createPhysicsProp(objectType, pose.x, pose.y, pose.z, mass, scale);
    restPropOnSupport(entry, pose.x, pose.z);
    selectProp(entry);
    addLog(t('logObjectPlaced', {
        type: propTypeLabel(objectType),
        mass: mass.toFixed(1),
        x: pose.x.toFixed(1),
        z: pose.z.toFixed(1),
    }));
    return true;
}

/** Screen → snapped world pose for a prop type (stacks on objects below). */
function placementPoseAtScreen(clientX, clientY, objectType, scale = DEFAULT_PROP_SCALE) {
    pointerToNdc(clientX, clientY);
    raycaster.setFromCamera(mouse, camera);
    const placementTargets = [
        plane,
        ...terrainStampPickMeshes(),
        ...physicsProps.map((p) => p.mesh),
        ...obstacles,
    ];
    const hits = raycaster.intersectObjects(placementTargets, false);
    if (hits.length === 0) return null;

    const hit = hits[0];
    const s = Math.max(0.25, Math.min(3, scale));
    const halfH = PROP_HALF_HEIGHT[objectType] * s;
    const rawX = Math.round(hit.point.x * 2) / 2;
    const rawZ = Math.round(hit.point.z * 2) / 2;
    const clamped = clampToArena(rawX, rawZ);
    const x = clamped.x;
    const z = clamped.z;
    const y = supportSurfaceY(x, z) + halfH + 0.02;
    return { x, y, z };
}

let paletteDrag = null;

function createPropGhostMesh(type, scale) {
    const s = Math.max(0.25, Math.min(3, scale));
    const mat = new THREE.MeshStandardMaterial({
        color: PROP_COLORS[type] ?? 0xaaaaaa,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        roughness: 0.4,
        metalness: 0.08,
        emissive: PROP_COLORS[type] ?? 0xaaaaaa,
        emissiveIntensity: 0.18,
    });
    let mesh;
    if (type === 'sphere') {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), mat);
    } else if (type === 'box') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    } else {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 20), mat);
    }
    mesh.scale.setScalar(s);
    mesh.renderOrder = 20;
    mesh.frustumCulled = false;
    return mesh;
}

function clearPaletteDrag() {
    if (!paletteDrag) return;
    const { ghost, item } = paletteDrag;
    if (ghost) {
        scene.remove(ghost);
        ghost.geometry?.dispose?.();
        ghost.material?.dispose?.();
    }
    item?.classList.remove('dragging');
    viewport.classList.remove('drop-active', 'palette-placing');
    paletteDrag = null;
}

function beginPaletteDrag(type, item, e) {
    clearPaletteDrag();
    selectedObjectType = type;
    const scaleEl = document.getElementById('objectScale');
    const massEl = document.getElementById('objectMass');
    const scale = Number.isFinite(parseFloat(scaleEl?.value))
        ? parseFloat(scaleEl.value)
        : DEFAULT_PROP_SCALE;
    const mass = Number.isFinite(parseFloat(massEl?.value))
        ? parseFloat(massEl.value)
        : DEFAULT_PROP_MASS;
    const ghost = createPropGhostMesh(type, scale);
    scene.add(ghost);
    paletteDrag = {
        type,
        item,
        ghost,
        scale,
        mass,
        pointerId: e.pointerId,
    };
    item.classList.add('dragging');
    viewport.classList.add('drop-active', 'palette-placing');
    try {
        item.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
    updatePaletteGhost(e.clientX, e.clientY);
}

function updatePaletteGhost(clientX, clientY) {
    if (!paletteDrag?.ghost) return;
    const pose = placementPoseAtScreen(clientX, clientY, paletteDrag.type, paletteDrag.scale);
    if (!pose) {
        paletteDrag.ghost.visible = false;
        return;
    }
    paletteDrag.ghost.visible = true;
    paletteDrag.ghost.position.set(pose.x, pose.y, pose.z);
}

function endPaletteDrag(clientX, clientY) {
    if (!paletteDrag) return;
    const { type, mass, scale } = paletteDrag;
    const over = (() => {
        const r = viewport.getBoundingClientRect();
        return clientX >= r.left && clientX <= r.right
            && clientY >= r.top && clientY <= r.bottom;
    })();
    const pose = over ? placementPoseAtScreen(clientX, clientY, type, scale) : null;
    clearPaletteDrag();
    if (!pose) return;
    const entry = createPhysicsProp(type, pose.x, pose.y, pose.z, mass, scale);
    restPropOnSupport(entry, pose.x, pose.z);
    selectProp(entry);
    addLog(t('logObjectPlaced', {
        type: propTypeLabel(type),
        mass: mass.toFixed(1),
        x: pose.x.toFixed(1),
        z: pose.z.toFixed(1),
    }));
    updateModeUi();
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
    interactionCanvas().style.cursor = '';
    viewport.classList.remove('dragging-prop');
    syncCameraControls();
}

function onPointerDown(e) {
    if (e.button !== 0 || animating) return;

    pointerDownPos = { x: e.clientX, y: e.clientY };
    activePointerId = e.pointerId;

    if (drawTerrainMode) {
        const hit = raycastDragPlane(e.clientX, e.clientY, 0);
        if (!hit) {
            resetGestureState();
            return;
        }
        gestureTarget = 'draw';
        beginTerrainStroke(hit.x, hit.z);
        capturePointerSafe(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        syncCameraControls();
        return;
    }

    if (moveObjectsMode) {
        const prop = raycastPropAt(e.clientX, e.clientY);
        if (prop) {
            gestureTarget = 'prop';
            gestureProp = prop;
            selectProp(prop);
            e.preventDefault();
            e.stopPropagation();
        } else {
            gestureTarget = 'floor';
            gestureProp = null;
        }
        syncCameraControls();
        return;
    }

    const pick = pickSceneTarget(e.clientX, e.clientY);
    gestureTarget = pick.type;
    gestureProp = pick.prop ?? null;

    if (pick.type === 'prop') {
        selectProp(pick.prop);
        setRobotSelected(0);
        e.preventDefault();
        e.stopPropagation();
    } else if (pick.type === 'robot') {
        deselectProp();
        setRobotSelected(1);
        e.preventDefault();
        e.stopPropagation();
    } else if (pick.type === 'stamp') {
        deselectProp();
        setRobotSelected(0);
        selectStamp(pick.stamp);
        e.preventDefault();
        e.stopPropagation();
    }
    syncCameraControls();
}

function onPointerMove(e) {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;

    if (isDrawingStroke) {
        const hit = raycastDragPlane(e.clientX, e.clientY, 0);
        if (hit) appendTerrainStroke(hit.x, hit.z);
        e.preventDefault();
        e.stopPropagation();
        return;
    }

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

    if (isDrawingStroke) {
        finishTerrainStroke();
    } else if (isDraggingProp) {
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
    if (isDrawingStroke) cancelTerrainStroke();
    if (isDraggingProp) endPropDrag(e.clientX, e.clientY, true);
    if (isDraggingRobot) {
        endRobotDrag(e.clientX, e.clientY, true);
        updatePathFlow();
    }
    dragProp = null;
    resetGestureState();
}

function updateHoverCursor(clientX, clientY) {
    if (isDraggingProp || isDraggingRobot || isDrawingStroke) {
        interactionCanvas().style.cursor = isDrawingStroke ? 'crosshair' : 'grabbing';
        return;
    }
    if (drawTerrainMode) {
        interactionCanvas().style.cursor = 'crosshair';
        return;
    }
    if (moveObjectsMode) {
        interactionCanvas().style.cursor = raycastPropAt(clientX, clientY) ? 'grab' : '';
        return;
    }
    const pick = pickSceneTarget(clientX, clientY);
    if (pick.type === 'prop' || pick.type === 'robot') {
        interactionCanvas().style.cursor = 'grab';
    } else if (pick.type === 'stamp') {
        interactionCanvas().style.cursor = 'pointer';
    } else {
        interactionCanvas().style.cursor = '';
    }
}

interactionCanvas().addEventListener('pointerdown', onPointerDown, true);
interactionCanvas().addEventListener('pointermove', onPointerMove);
interactionCanvas().addEventListener('pointerup', onPointerUp);
interactionCanvas().addEventListener('pointercancel', onPointerCancel);
interactionCanvas().style.touchAction = 'none';

// 🧠 Navigation — sensors + 3 algorithms (see nav.js)
let activeAlgo = 'bug2';
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
    queryPose: queryPoseForNav,
    scanRays,
    scanRaysCount,
    ROBOT_COLLISION,
    ROBOT_WIDTH,
    LIDAR_RANGE,
    ULTRASONIC_RANGE,
    IR_RANGE,
    FLOOR_IR_RANGE,
    get BUILD_LIMIT() { return BUILD_LIMIT; },
    MAX_SPEED,
    MAX_OMEGA,
    PASS_CLEAR_MARGIN,
    WP_ACCEPT_RADIUS,
});

const { sensorConfig, sensorSuite, computeNavCommand, setCustomRunner } = nav;
const collisionSys = sensorSuite;

const CUSTOM_LOOP_KEY = 'customLoopJs';
const CUSTOM_LOOP_DEFAULT = 'v = MAX_SPEED * 0.60\nomega = headingErr * 2.00\n';
const CUSTOM_FORBIDDEN = [
    'alert', 'prompt', 'confirm', 'eval', 'Function', 'function', 'return',
    'new', 'class', 'import', 'export', 'document', 'window', 'globalThis',
    'self', 'top', 'parent', 'frames', 'opener', 'fetch', 'XMLHttpRequest',
    'WebSocket', 'Worker', 'SharedWorker', 'localStorage', 'sessionStorage',
    'indexedDB', 'cookie', 'setTimeout', 'setInterval', 'setImmediate',
    'constructor', 'prototype', 'arguments', 'this', 'async', 'await',
    'yield', 'debugger', 'with', 'try', 'catch', 'throw', 'finally',
    'Object', 'Array', 'Date', 'RegExp', 'Error', 'Promise', 'Proxy',
    'Reflect', 'Symbol', 'Map', 'Set', 'WeakMap', 'WeakSet', 'JSON',
    'console', 'process', 'require', 'Deno', 'chrome', 'navigator',
    'location', 'history', 'Blob', 'File', 'URL', 'Image', 'Audio',
    'WebAssembly', 'Atomics', 'postMessage', 'MessageChannel',
];
const CUSTOM_ALLOW = [
    'let', 'const', 'var', 'if', 'else', 'for', 'while', 'do', 'break',
    'continue', 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
    'Math', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'abs',
    'max', 'min', 'hypot', 'floor', 'ceil', 'round', 'sqrt', 'pow', 'PI',
    'E', 'log', 'exp', 'sign', 'parseFloat', 'parseInt', 'isFinite', 'isNaN',
    'Number', 'toFixed', 'length', 'robotX', 'robotZ', 'heading',
    'waypointX', 'waypointZ', 'waypointDist', 'headingErr', 'blocked',
    'forwardClear', 'nearest', 'lidar', 'ultrasonic', 'ir', 'floorIr', 'MAX_SPEED',
    'MAX_OMEGA', 'draw', 'v', 'omega', 'in', 'of',
];
const customPadEl = document.getElementById('customPad');
const customSetupSrc = document.getElementById('customSetupSrc');
const customLoopSrc = document.getElementById('customLoopSrc');
const customCheckMsg = document.getElementById('customCheckMsg');
let customCompiled = null;
let customDrawCount = 0;

function customSetupText() {
    if (currentLang === 'es') {
        return [
            '// void setup — copia esto y pégaselo a una AI',
            '// Ella debe devolver SOLO el loop: asignar v y omega.',
            '//',
            '// Variables del robot (solo lectura):',
            '//   robotX, robotZ, heading',
            '//   waypointX, waypointZ, waypointDist',
            '//   headingErr, blocked, forwardClear, nearest',
            '//   lidar[36], ultrasonic[3], ir[3], floorIr[3]',
            '//   MAX_SPEED, MAX_OMEGA',
            '// Math: sin cos atan2 hypot abs max min PI',
            '// draw(x, z)  — marca un punto en el piso',
            '//',
            '// Prohibido: alert, new, objetos {}, function, return,',
            '//   document, window, fetch, eval, clases',
            '//',
            '// Estructura esperada del loop:',
            '//   v = MAX_SPEED * 0.60',
            '//   omega = headingErr * 2.00',
            '//   draw(robotX, robotZ)',
        ].join('\n');
    }
    return [
        '// void setup — copy this and paste it to an AI',
        '// The AI should return ONLY the loop: assign v and omega.',
        '//',
        '// Robot variables (read-only):',
        '//   robotX, robotZ, heading',
        '//   waypointX, waypointZ, waypointDist',
        '//   headingErr, blocked, forwardClear, nearest',
        '//   lidar[36], ultrasonic[3], ir[3], floorIr[3]',
        '//   MAX_SPEED, MAX_OMEGA',
        '// Math: sin cos atan2 hypot abs max min PI',
        '// draw(x, z)  — mark a point on the floor',
        '//',
        '// Forbidden: alert, new, object literals {}, function, return,',
        '//   document, window, fetch, eval, classes',
        '//',
        '// Expected loop structure:',
        '//   v = MAX_SPEED * 0.60',
        '//   omega = headingErr * 2.00',
        '//   draw(robotX, robotZ)',
    ].join('\n');
}

function refreshCustomPadI18n() {
    if (customSetupSrc) customSetupSrc.value = customSetupText();
}

function setCustomPadOpen(on) {
    if (!customPadEl) return;
    if (on) customPadEl.classList.add('open');
    if (!on) customPadEl.classList.remove('open');
}

function clearCustomDraw() {
    customDrawCount = 0;
    while (customDrawGroup.children.length > 0) {
        const ch = customDrawGroup.children[0];
        customDrawGroup.remove(ch);
        if (ch.geometry) ch.geometry.dispose();
        if (ch.material) ch.material.dispose();
    }
}

function customDrawMark(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    if (customDrawCount >= 20) return;
    customDrawCount += 1;
    const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ffcc }),
    );
    m.position.set(x, 0.12, z);
    customDrawGroup.add(m);
}

function stripCustomNoise(src) {
    let out = '';
    let mode = 'code';
    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        const n = i + 1 < src.length ? src[i + 1] : '';
        if (mode === 'code' && c === '/' && n === '/') {
            mode = 'line';
            i += 1;
        } else if (mode === 'code' && c === '/' && n === '*') {
            mode = 'block';
            i += 1;
        } else if (mode === 'code' && c === '\'') {
            mode = 'squote';
        } else if (mode === 'code' && c === '"') {
            mode = 'dquote';
        } else if (mode === 'code' && c === '`') {
            mode = 'template';
        } else if (mode === 'line' && (c === '\n' || c === '\r')) {
            mode = 'code';
            out += ' ';
        } else if (mode === 'block' && c === '*' && n === '/') {
            mode = 'code';
            i += 1;
        } else if (mode === 'squote' && c === '\'') {
            mode = 'code';
        } else if (mode === 'dquote' && c === '"') {
            mode = 'code';
        } else if (mode === 'template' && c === '`') {
            mode = 'code';
        } else if (mode === 'code') {
            out += c;
        }
    }
    return out;
}

function customBracesOk(src) {
    let curly = 0;
    let round = 0;
    let square = 0;
    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (c === '{') curly += 1;
        if (c === '}') curly -= 1;
        if (c === '(') round += 1;
        if (c === ')') round -= 1;
        if (c === '[') square += 1;
        if (c === ']') square -= 1;
        if (curly < 0 || round < 0 || square < 0) return 0;
    }
    if (curly !== 0 || round !== 0 || square !== 0) return 0;
    return 1;
}

function checkCustomJs(src) {
    if (!src || !src.trim()) return { ok: 0, msg: 'empty' };
    const text = stripCustomNoise(src);
    if (text.indexOf('=>') >= 0) return { ok: 0, msg: 'arrow =>' };
    if (/\{\s*[A-Za-z_$][\w$]*\s*:/.test(text)) return { ok: 0, msg: 'object {}' };
    if (!customBracesOk(text)) return { ok: 0, msg: 'unbalanced () [] {}' };
    const declared = {};
    const declRe = /\b(?:let|const|var)\s+([A-Za-z_$][\w$]*)/g;
    let dm = declRe.exec(text);
    while (dm) {
        declared[dm[1]] = 1;
        dm = declRe.exec(text);
    }
    for (let f = 0; f < CUSTOM_FORBIDDEN.length; f++) {
        const word = CUSTOM_FORBIDDEN[f];
        const re = new RegExp('\\b' + word + '\\b');
        if (re.test(text)) return { ok: 0, msg: word };
    }
    const idRe = /\b[A-Za-z_$][\w$]*\b/g;
    let im = idRe.exec(text);
    while (im) {
        const id = im[0];
        let allowed = declared[id] ? 1 : 0;
        for (let a = 0; a < CUSTOM_ALLOW.length; a++) {
            if (CUSTOM_ALLOW[a] === id) allowed = 1;
        }
        if (!allowed) return { ok: 0, msg: 'unknown ' + id };
        im = idRe.exec(text);
    }
    return { ok: 1, msg: '' };
}

function wrapCustomLoop(src) {
    return '"use strict";\n'
        + 'const robotX = api.robotX;\n'
        + 'const robotZ = api.robotZ;\n'
        + 'const heading = api.heading;\n'
        + 'const waypointX = api.waypointX;\n'
        + 'const waypointZ = api.waypointZ;\n'
        + 'const waypointDist = api.waypointDist;\n'
        + 'const headingErr = api.headingErr;\n'
        + 'const blocked = api.blocked;\n'
        + 'const forwardClear = api.forwardClear;\n'
        + 'const nearest = api.nearest;\n'
        + 'const lidar = api.lidar;\n'
        + 'const ultrasonic = api.ultrasonic;\n'
        + 'const ir = api.ir;\n'
        + 'const floorIr = api.floorIr;\n'
        + 'const MAX_SPEED = api.MAX_SPEED;\n'
        + 'const MAX_OMEGA = api.MAX_OMEGA;\n'
        + 'const Math = api.Math;\n'
        + 'const draw = api.draw;\n'
        + 'let v = 0;\n'
        + 'let omega = 0;\n'
        + src
        + '\nreturn { v: v, omega: omega };\n';
}

function compileCustomLoop(src) {
    const chk = checkCustomJs(src);
    if (chk.ok === 0) return chk;
    const body = wrapCustomLoop(src);
    let fn = null;
    try {
        fn = Function('api', body);
    } catch (err) {
        return { ok: 0, msg: 'syntax' };
    }
    return { ok: 1, msg: '', fn };
}

function finiteOrZero(n) {
    if (Number.isFinite(n)) return n;
    return 0;
}

function runCustomLoop(ctx) {
    clearCustomDraw();
    if (!customCompiled) {
        return computeCustomFileFallback(ctx);
    }
    const lidar = [];
    if (ctx.reading && ctx.reading.lidar) {
        for (let i = 0; i < ctx.reading.lidar.length; i++) {
            lidar.push(ctx.reading.lidar[i]);
        }
    }
    const ultrasonic = [null, null, null];
    if (ctx.reading && ctx.reading.ultrasonic) {
        for (let i = 0; i < 3 && i < ctx.reading.ultrasonic.length; i++) {
            ultrasonic[i] = ctx.reading.ultrasonic[i];
        }
    }
    const ir = [null, null, null];
    if (ctx.reading && ctx.reading.ir) {
        for (let i = 0; i < 3 && i < ctx.reading.ir.length; i++) {
            ir[i] = ctx.reading.ir[i];
        }
    }
    const floorIr = [null, null, null];
    if (ctx.reading && ctx.reading.floorIr) {
        for (let i = 0; i < 3 && i < ctx.reading.floorIr.length; i++) {
            floorIr[i] = ctx.reading.floorIr[i];
        }
    }
    const api = {
        robotX: ctx.robot.position.x,
        robotZ: ctx.robot.position.z,
        heading: ctx.robot.rotation.y,
        waypointX: ctx.target.x,
        waypointZ: ctx.target.z,
        waypointDist: Math.hypot(ctx.target.x - ctx.robot.position.x, ctx.target.z - ctx.robot.position.z),
        headingErr: ctx.headingErr,
        blocked: ctx.blocked ? 1 : 0,
        forwardClear: ctx.clear,
        nearest: ctx.reading ? ctx.reading.minObstacleDist : Infinity,
        lidar,
        ultrasonic,
        ir,
        floorIr,
        MAX_SPEED: ctx.MAX_SPEED,
        MAX_OMEGA: ctx.MAX_OMEGA,
        Math,
        draw: customDrawMark,
    };
    const out = customCompiled(api);
    if (!out) return { v: 0, omega: 0 };
    const v = Math.max(-ctx.MAX_SPEED, Math.min(ctx.MAX_SPEED, finiteOrZero(out.v)));
    const omega = Math.max(-ctx.MAX_OMEGA, Math.min(ctx.MAX_OMEGA, finiteOrZero(out.omega)));
    return { v, omega };
}

function computeCustomFileFallback(ctx) {
    const omega = Math.max(-ctx.MAX_OMEGA, Math.min(ctx.MAX_OMEGA, ctx.headingErr * 2));
    return { v: ctx.MAX_SPEED * 0.60, omega };
}

function showCustomCheck(ok, msg) {
    if (!customCheckMsg) return;
    if (ok) {
        customCheckMsg.textContent = t('customCheckOk');
        customCheckMsg.className = 'custom-check-msg ok';
    }
    if (!ok) {
        customCheckMsg.textContent = t('customCheckFail', { msg });
        customCheckMsg.className = 'custom-check-msg fail';
    }
}

function saveCustomLoop() {
    const src = customLoopSrc ? customLoopSrc.value : '';
    const compiled = compileCustomLoop(src);
    if (compiled.ok === 0) {
        showCustomCheck(0, compiled.msg);
        return 0;
    }
    customCompiled = compiled.fn;
    localStorage.setItem(CUSTOM_LOOP_KEY, src);
    setCustomRunner(runCustomLoop);
    showCustomCheck(1, '');
    if (customCheckMsg) {
        customCheckMsg.textContent = t('customSaved');
        customCheckMsg.className = 'custom-check-msg ok';
    }
    return 1;
}

function loadCustomLoop() {
    const saved = localStorage.getItem(CUSTOM_LOOP_KEY);
    const src = saved && saved.length > 0 ? saved : CUSTOM_LOOP_DEFAULT;
    if (customLoopSrc) customLoopSrc.value = src;
    refreshCustomPadI18n();
    const compiled = compileCustomLoop(src);
    if (compiled.ok === 1) {
        customCompiled = compiled.fn;
        setCustomRunner(runCustomLoop);
        showCustomCheck(1, '');
        return;
    }
    customCompiled = null;
    setCustomRunner(runCustomLoop);
    showCustomCheck(0, compiled.msg);
}

function copyCustomSetup() {
    const text = customSetupSrc ? customSetupSrc.value : '';
    if (!text) return;
    const btn = document.getElementById('customSetupCopy');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            if (!btn) return;
            btn.textContent = t('customSetupCopied');
            window.setTimeout(() => { btn.textContent = t('copyBtn'); }, 1500);
        });
    }
}

const customPadClose = document.getElementById('customPadClose');
if (customPadClose) customPadClose.addEventListener('click', () => setCustomPadOpen(0));
const customSetupCopyBtn = document.getElementById('customSetupCopy');
if (customSetupCopyBtn) customSetupCopyBtn.addEventListener('click', copyCustomSetup);
const customCheckBtn = document.getElementById('customCheckBtn');
if (customCheckBtn) {
    customCheckBtn.addEventListener('click', () => {
        const src = customLoopSrc ? customLoopSrc.value : '';
        const compiled = compileCustomLoop(src);
        showCustomCheck(compiled.ok, compiled.msg);
    });
}
const customSaveBtn = document.getElementById('customSaveBtn');
if (customSaveBtn) customSaveBtn.addEventListener('click', saveCustomLoop);

loadCustomLoop();

const sensorStatusEl = document.getElementById('sensorStatus');

function sensorListLabel() {
    const parts = [];
    if (sensorConfig.lidar) parts.push('LIDAR');
    if (sensorConfig.ultrasonic) parts.push('US');
    if (sensorConfig.ir) parts.push('IR×3');
    if (sensorConfig.floorIr) parts.push('Floor IR');
    if (sensorConfig.hitTest) parts.push('Bumper');
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
    const x0 = robot.position.x;
    const z0 = robot.position.z;
    const yaw0 = robot.rotation.y;
    const requestedDistance = Math.abs(v * dt);
    const requestedRotation = Math.abs(omega * dt);
    const steps = Math.max(
        1,
        Math.ceil(requestedDistance / MOTION_SWEEP_STEP),
        Math.ceil(requestedRotation / ROTATION_SWEEP_STEP),
    );
    const stepDt = dt / steps;
    let blocked = 0;

    for (let i = 0; i < steps; i++) {
        const nextRot = robot.rotation.y + omega * stepDt;
        const nextX = robot.position.x + Math.sin(nextRot) * v * stepDt;
        const nextZ = robot.position.z + Math.cos(nextRot) * v * stepDt;
        if (poseBlocksMotion(nextX, nextZ, nextRot)) {
            blocked = 1;
            break;
        }
        robot.rotation.y = nextRot;
        robot.position.x = nextX;
        robot.position.z = nextZ;
    }
    // Keep yaw in (-π, π] so telemetry/recovery stay readable.
    while (robot.rotation.y > Math.PI) robot.rotation.y -= Math.PI * 2;
    while (robot.rotation.y < -Math.PI) robot.rotation.y += Math.PI * 2;

    if (blocked && !queryPose(
        robot.position.x,
        robot.position.z,
        robot.rotation.y,
    ).clear) {
        depenetrateRobot();
    }
    clampRobotPosition();

    const actualDistance = Math.hypot(robot.position.x - x0, robot.position.z - z0);
    const actualLinear = dt > 0 ? actualDistance * Math.sign(v) / dt : 0;
    const actualOmega = dt > 0 ? (robot.rotation.y - yaw0) / dt : 0;
    const leftLinear = actualLinear + actualOmega * ROBOT_COLLISION.halfWidth;
    const rightLinear = actualLinear - actualOmega * ROBOT_COLLISION.halfWidth;
    wheels[0].rotation.x += leftLinear * dt / WHEEL_RADIUS;
    wheels[2].rotation.x += leftLinear * dt / WHEEL_RADIUS;
    wheels[1].rotation.x += rightLinear * dt / WHEEL_RADIUS;
    wheels[3].rotation.x += rightLinear * dt / WHEEL_RADIUS;

    if (blocked && sensorConfig.hitTest && v > 0) triggerSpringBumper();
    if (requestedDistance > 0.01 && actualDistance < requestedDistance * 0.10) return 1;
    return 0;
}

function distToGoal(target) {
    return Math.hypot(target.x - robot.position.x, target.z - robot.position.z);
}

// Hit-test on: any part of the rover footprint touching the waypoint counts.
// Center tip does not need to sit on the marker.
function waypointTouchedByHitTest(target) {
    const footprint = roverFootprintCorners(
        robot.position.x,
        robot.position.z,
        robot.rotation.y,
        0,
    );
    if (pointInPolygon(target.x, target.z, footprint)) return 1;
    // Marker radius ~0.32 m — count a near graze on the hull edge.
    if (minDistToEdges(target.x, target.z, footprint) <= 0.35) return 1;
    return 0;
}

function waypointReached(target) {
    const dist = distToGoal(target);
    if (dist <= WP_ACCEPT_RADIUS) return { ok: 1, dist };
    if (sensorConfig.hitTest && waypointTouchedByHitTest(target)) {
        return { ok: 1, dist };
    }
    return { ok: 0, dist };
}

function resetNavForWaypoint() {
    // Fresh M-line for this segment (robot pose → next waypoint).
    missionStart = { x: robot.position.x, z: robot.position.z };
    navState.mode = 'TRACK';
    navState.bugStartDist = 0;
    navState.bugFollowDist = 0;
    navState.bugFlipped = 0;
    navState.bugLastX = NaN;
    navState.bugLastZ = NaN;
    navState.roseMode = 0;
    navState.roseDistance = 0;
    navState.roseStartX = robot.position.x;
    navState.roseStartZ = robot.position.z;
    navState.roseLastX = robot.position.x;
    navState.roseLastZ = robot.position.z;
    navState.forceRose = 0;
    navState.roseCircuits = 0;
    navState.roseLeftStart = 0;
    navState.recoveryPhase = '';
    navState.recoveryUntil = 0;
    navState.recoveryCooldownUntil = 0;
    navState.lastRecoverySide = 0;
    navState.stuckSince = NaN;
    navState.lastRecoveryLog = '';
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
        paused = 0;
        navState.mode = 'IDLE';
        const passed = waypointsPassed.filter((v) => v === 1).length;
        const skipped = waypointsPassed.filter((v) => v === 'skipped').length;
        addLog(t('logDone', { passed, skipped, total: waypoints.length }));
        updateMissionButtons();
    }
}

function checkWaypointMission() {
    if (pathIndex >= waypoints.length) return false;
    const target = waypoints[pathIndex];
    const reach = waypointReached(target);
    if (reach.ok) {
        if (!waypointsPassed[pathIndex]) {
            waypointsPassed[pathIndex] = 1;
            recordMissionAttempt('waypoint_passed', `wp${pathIndex}`);
            addLog(t('logPassed', { index: pathIndex, dist: reach.dist.toFixed(2) }));
            if (waypointMarkers[pathIndex]) {
                waypointMarkers[pathIndex].material.color.setHex(0x00ffcc);
            }
        }
        pathIndex++;
        resetNavForWaypoint();
        if (pathIndex >= waypoints.length) {
            animating = 0;
            paused = 0;
            navState.mode = 'IDLE';
            const passed = waypointsPassed.filter((v) => v === 1).length;
            const skipped = waypointsPassed.filter((v) => v === 'skipped').length;
            addLog(t('logDone', { passed, skipped, total: waypoints.length }));
            updateMissionButtons();
            return false;
        }
    }
    return true;
}

// 📋 Telemetry log
const robotLog = [];
const missionTelemetry = [];
const missionAttempts = [];
const poseTrail = [];
let lastTelemetryAt = -2.00;
let lastAttemptMode = '';
window.missionTelemetry = missionTelemetry;

function recordMissionAttempt(kind, detail = '') {
    const t = Number.isFinite(clock?.getElapsedTime?.())
        ? clock.getElapsedTime()
        : 0;
    missionAttempts.push({
        t: Number(t.toFixed(2)),
        kind,
        detail,
        x: Number(robot.position.x.toFixed(2)),
        z: Number(robot.position.z.toFixed(2)),
        wp: pathIndex,
        mode: navState.mode,
    });
    if (missionAttempts.length > 80) missionAttempts.shift();
}

function recordPoseTrail() {
    if (!animating || paused) return;
    const last = poseTrail[poseTrail.length - 1];
    const x = robot.position.x;
    const z = robot.position.z;
    if (last && Math.hypot(x - last.x, z - last.z) < 0.45) return;
    poseTrail.push({
        t: Number(clock.getElapsedTime().toFixed(2)),
        x: Number(x.toFixed(2)),
        z: Number(z.toFixed(2)),
        wp: pathIndex,
        mode: navState.mode,
    });
    if (poseTrail.length > 60) poseTrail.shift();
}

function buildMapSnapshot() {
    return {
        arenaM: PLANE_SIZE,
        waypoints: waypoints.map((wp, i) => ({
            i,
            x: wp.x,
            z: wp.z,
            status: waypointsPassed[i] === 1
                ? 'passed'
                : (waypointsPassed[i] === 'skipped' ? 'skipped'
                    : (i === pathIndex ? 'current' : 'pending')),
        })),
        cones: stageCones.map((c, i) => ({
            i,
            x: Number(c.mesh.position.x.toFixed(2)),
            z: Number(c.mesh.position.z.toFixed(2)),
        })),
        props: physicsProps.map((p, i) => {
            const support = findSupportBelow(p);
            const supportIdx = support ? physicsProps.indexOf(support) : -1;
            const v = p.body?.velocity;
            return {
                i,
                kind: p.type,
                x: Number(p.mesh.position.x.toFixed(2)),
                y: Number(p.mesh.position.y.toFixed(2)),
                z: Number(p.mesh.position.z.toFixed(2)),
                mass: p.mass,
                stackedOn: supportIdx,
                vx: v ? Number(v.x.toFixed(2)) : 0,
                vy: v ? Number(v.y.toFixed(2)) : 0,
                vz: v ? Number(v.z.toFixed(2)) : 0,
            };
        }),
        terrainStamps: terrainStamps.map((s, i) => ({
            i,
            height: s.height,
            points: (s.points || []).length,
        })),
        mLine: {
            start: {
                x: Number(missionStart.x.toFixed(2)),
                z: Number(missionStart.z.toFixed(2)),
            },
            goal: waypoints[pathIndex]
                ? { x: waypoints[pathIndex].x, z: waypoints[pathIndex].z }
                : null,
        },
    };
}
const MAX_ROBOT_LOG = 120;

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
    if (robotLog.length > MAX_ROBOT_LOG) robotLog.shift();
    console.log(`[ROBOT LOG] ${fullMessage}`);
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

const exportTelemetryJsonBtn = document.getElementById('exportTelemetryJson');
if (exportTelemetryJsonBtn) exportTelemetryJsonBtn.addEventListener('click', exportTelemetryJson);
const exportTelemetryCsvBtn = document.getElementById('exportTelemetryCsv');
if (exportTelemetryCsvBtn) exportTelemetryCsvBtn.addEventListener('click', exportTelemetryCsv);

const errorReportDialog = document.getElementById('errorReportDialog');
const errorReportTextEl = document.getElementById('errorReportText');
const copyErrorReportBtn = document.getElementById('copyErrorReportBtn');

function buildErrorReport() {
    const waypoint = waypoints[pathIndex] || null;
    const navDebug = {
        mode: navState.mode,
        bugSide: navState.bugSide,
        bugFollowDist: Number.isFinite(navState.bugFollowDist)
            ? Number(navState.bugFollowDist.toFixed(2))
            : 0,
        bugFlipped: navState.bugFlipped ? 1 : 0,
        roseMode: navState.roseMode,
        forceRose: navState.forceRose,
        recoveryPhase: navState.recoveryPhase || null,
        stuckSeconds: Number.isFinite(navState.stuckSince)
            ? Math.max(0, Date.now() / 1000 - navState.stuckSince).toFixed(2)
            : null,
    };
    const logLines = robotLog.map(
        (row) => `${row.time}s ${row.pos}: ${row.message}`,
    );
    return [
        'ROBOT DEBUG REPORT',
        `Build: ${BUILD_STAMP}`,
        `Algorithm: ${activeAlgo}`,
        `Mission: ${animating ? 'running' : 'stopped'} · waypoint ${pathIndex}/${waypoints.length}`,
        `Robot: x=${robot.position.x.toFixed(3)} y=${robot.position.y.toFixed(3)} z=${robot.position.z.toFixed(3)} heading=${robot.rotation.y.toFixed(3)}`,
        `Target: ${waypoint ? `x=${waypoint.x} z=${waypoint.z}` : 'none'}`,
        `Sensors: ${JSON.stringify(sensorConfig)}`,
        `Hit objects: ${hitObjects ? 'on' : 'off'} · physics level ${physicsLevel}`,
        `Navigation: ${JSON.stringify(navDebug)}`,
        `Map:\n${JSON.stringify(buildMapSnapshot(), null, 2)}`,
        `Attempts (${missionAttempts.length}):\n${JSON.stringify(missionAttempts.slice(-30), null, 2)}`,
        `Pose trail (${poseTrail.length}):\n${JSON.stringify(poseTrail.slice(-40), null, 2)}`,
        `Runtime errors:\n${runtimeErrors.length ? runtimeErrors.join('\n') : 'none'}`,
        `Recent robot log:\n${logLines.length ? logLines.join('\n') : 'none'}`,
        `Recent telemetry:\n${JSON.stringify(missionTelemetry.slice(-3), null, 2)}`,
    ].join('\n\n');
}

function openErrorReport() {
    if (!errorReportDialog || !errorReportTextEl) return;
    errorReportTextEl.value = buildErrorReport();
    if (typeof errorReportDialog.showModal === 'function') {
        if (!errorReportDialog.open) errorReportDialog.showModal();
    } else {
        errorReportDialog.setAttribute('open', '');
    }
}

function closeErrorReport() {
    if (!errorReportDialog) return;
    if (typeof errorReportDialog.close === 'function') errorReportDialog.close();
    else errorReportDialog.removeAttribute('open');
}

function flashErrorReportCopy() {
    if (!copyErrorReportBtn) return;
    copyErrorReportBtn.textContent = t('errorReportCopied');
    window.setTimeout(() => {
        copyErrorReportBtn.textContent = t('copyErrorReportBtn');
    }, 1500);
}

function copyErrorReport() {
    if (!errorReportTextEl) return;
    const text = errorReportTextEl.value;
    const fallback = () => {
        errorReportTextEl.focus();
        errorReportTextEl.select();
        document.execCommand('copy');
        flashErrorReportCopy();
    };
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(flashErrorReportCopy).catch(fallback);
    } else {
        fallback();
    }
}

document.getElementById('showErrorReportBtn')?.addEventListener('click', openErrorReport);
document.getElementById('closeErrorReportBtn')?.addEventListener('click', closeErrorReport);
document.getElementById('closeErrorReportBottomBtn')?.addEventListener('click', closeErrorReport);
copyErrorReportBtn?.addEventListener('click', copyErrorReport);

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
            recovery: cmd.recovery || null,
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
            floorIr: telemetryDistances(reading.floorIr),
        },
    };

    lastTelemetryAt = now;
    missionTelemetry.push(sample);
    addLog(JSON.stringify(sample));
}

function updateMissionButtons() {
    const pauseBtn = document.getElementById('pauseBtn');
    if (!pauseBtn) return;
    pauseBtn.disabled = !animating;
    pauseBtn.textContent = paused ? t('resumeBtn') : t('pauseBtn');
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
}

function capturePreMissionMap() {
    preMissionMap = JSON.parse(JSON.stringify(serializeMap()));
}

function restorePreMissionMap() {
    paused = 0;
    animating = 0;
    navState.mode = 'IDLE';
    dragProp = null;
    isDraggingProp = 0;
    isDraggingRobot = 0;
    resetGestureState();
    setRobotSelected(0);
    setDrawTerrainMode(0);
    collisionMarkers.forEach((m) => scene.remove(m));
    collisionMarkers.length = 0;
    if (preMissionMap) {
        applyMapData(preMissionMap, { silent: 1 });
        addLog(t('logMissionReset'));
    } else {
        addLog(t('logResetIdle'));
        updateMissionButtons();
        updateModeUi();
    }
}

// 🎛️ UI wiring — start, reset, language, object panel
document.getElementById('startBtn').addEventListener('click', () => {
    if (animating && paused) {
        paused = 0;
        addLog(t('logResumed'));
        updateMissionButtons();
        return;
    }
    if (animating) return;
    if (waypoints.length < 1) {
        alert(t('alertNeedWaypoints'));
        return;
    }
    capturePreMissionMap();
    missionStart = { x: robot.position.x, z: robot.position.z };
    pathIndex = 0;
    navState = {
        mode: 'TRACK',
        bugSide: 1,
        bugStartDist: 0,
        bugFollowDist: 0,
        bugFlipped: 0,
        bugLastX: NaN,
        bugLastZ: NaN,
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
    clearDraggableAuras();
    setDrawTerrainMode(0);
    mode = 'waypoints';
    setMoveObjectsMode(0);
    document.querySelectorAll('#modeGroup .toggle-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === 'waypoints');
    });
    syncCameraControls();
    clock.start();
    robotLog.length = 0;
    missionTelemetry.length = 0;
    missionAttempts.length = 0;
    poseTrail.length = 0;
    lastAttemptMode = '';
    lastTelemetryAt = -2.00;
    recordMissionAttempt('mission_start', activeAlgo);
    addLog(t('logInit', {
        algo: algoDisplayName(activeAlgo),
        sensors: sensorListLabel() || 'none',
        count: waypoints.length,
        radius: WP_ACCEPT_RADIUS,
    }));
    paused = 0;
    animating = 1;
    wakeAllDynamics();
    updateMissionButtons();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (!animating) return;
    paused = paused ? 0 : 1;
    if (!paused) wakeAllDynamics();
    addLog(paused ? t('logPaused') : t('logResumed'));
    updateMissionButtons();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    restorePreMissionMap();
    mode = 'waypoints';
    statusEl.textContent = t('modeSetWaypoints');
    updateModeUi();
    document.querySelectorAll('#modeGroup .toggle-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === 'waypoints');
    });
    syncCameraControls();
});

const clock = new THREE.Clock();
let selectedObjectType = 'sphere';

['sensorLidar', 'sensorUltrasonic', 'sensorIr', 'sensorFloorIr', 'sensorHitTest'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const keyMap = {
        sensorlidar: 'lidar',
        sensorultrasonic: 'ultrasonic',
        sensorir: 'ir',
        sensorfloorir: 'floorIr',
        sensorhittest: 'hitTest',
    };
    const key = keyMap[id.toLowerCase()];
    el.checked = sensorConfig[key] === 1;
    el.addEventListener('change', () => {
        sensorConfig[key] = el.checked ? 1 : 0;
        updateSensorStatus();
        if (typeof syncSensorVisuals === 'function') syncSensorVisuals(null);
    });
});

const moveObjectsEl = document.getElementById('moveObjectsMode');
if (moveObjectsEl) {
    moveObjectsEl.addEventListener('change', () => {
        setMoveObjectsMode(moveObjectsEl.checked ? 1 : 0);
        if (moveObjectsMode) {
            mode = 'objects';
        } else if (mode === 'objects') {
            mode = 'waypoints';
        }
        document.querySelectorAll('#modeGroup .toggle-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.mode === mode);
        });
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
        setCustomPadOpen(activeAlgo === 'custom' ? 1 : 0);
    });
});

// GUI stays English: algorithm help popup is always EN.
const ALGO_HELP = {
    pure_pursuit: {
        title: 'Pure Pursuit',
        body: [
            'Simple path tracker. Always steers toward the current waypoint.',
            '',
            'Sensors this mode uses:',
            '• forwardClear — fused front clearance (LIDAR / Ultrasonic / IR / Floor IR if enabled)',
            '• Shared safety layer — any enabled sensor can trigger go-around',
            '• Spring bumper (hit test) — footprint touch for choke / waypoint pass',
            '',
            'Does NOT build its own 360° map. Best with LIDAR or Ultrasonic on so forwardClear is meaningful.',
            '',
            'Idea:',
            '• headingErr = angle from rover nose to waypoint',
            '• omega scales with headingErr',
            '• slow down if forwardClear is tight',
        ].join('\n'),
        code: [
            '// nav.js — pure_pursuit',
            'const omega = clamp(headingErr * 2, -MAX_OMEGA, MAX_OMEGA);',
            'const v = clear < 3',
            '  ? MAX_SPEED * max(0.25, clear / 3)',
            '  : MAX_SPEED;',
            'return { v, omega };',
        ].join('\n'),
    },
    bug2: {
        title: 'Bug2 (M-line)',
        body: [
            'Classic Bug2. Follow the straight M-line to the goal until blocked,',
            'then follow the obstacle boundary until the M-line is re-acquired closer to the goal.',
            '',
            'Sensors this mode uses:',
            '• blocked — from enabled sensors (LIDAR / US / IR / Floor IR votes)',
            '• forwardClear — leave wall-follow when front opens',
            '• minObstacleDist — tighten turn near a wall',
            '• steerHint — choose left/right wall side (often IR or polar)',
            '• Spring bumper (hit test) — shared go-around / footprint',
            '',
            'Enable at least LIDAR or Ultrasonic + IR for stable boundary follow.',
            '',
            'States:',
            '• TRACK — drive toward waypoint',
            '• BUG_FOLLOW — wall-follow on one side (steerHint)',
        ].join('\n'),
        code: [
            '// nav.js — bug2',
            'if (mode === "BUG_FOLLOW") {',
            '  // follow boundary on bugSide',
            '  if (closerOnMline && frontOpen) mode = "TRACK";',
            '  return { v: MAX_SPEED * 0.55, omega: bugSide * MAX_OMEGA * 0.55 };',
            '}',
            'if (blocked && clear < 1.5) {',
            '  mode = "BUG_FOLLOW";',
            '  bugSide = steerHint || 1;',
            '}',
            '// else TRACK toward waypoint',
        ].join('\n'),
    },
    vfh: {
        title: 'VFH (Vector Field Histogram)',
        body: [
            'Builds a polar obstacle histogram, then steers through the cheapest open sector toward the goal.',
            '',
            'Sensors this mode uses:',
            '• polar map — PRIMARY (LIDAR preferred; Ultrasonic fused into polar)',
            '• IR ×3 — fallback histogram if polar is empty (only LIDAR/US off)',
            '• Spring bumper (hit test) — shared safety layer',
            '• Floor IR (if on) — fused into polar as hole edges',
            '',
            'Recommended: LIDAR on for a full 360° histogram.',
        ].join('\n'),
        code: [
            '// nav.js — vfh (simplified)',
            'if (polar) histogram from LIDAR/US polar bins',
            'else if (ir) fill front sectors from IR×3',
            'cost = histogram[s]*4 + distanceToGoalSector(s)*0.35',
            'pick sector with min cost',
            'omega = chosenAngle * 2.0',
        ].join('\n'),
    },
    custom: {
        title: 'Custom (JS pad)',
        body: [
            'Student-written loop() assigns v and omega each frame.',
            '',
            'Sensors available in the pad (only if that checkbox is on):',
            '• lidar[36] — LIDAR 360° distances',
            '• ultrasonic[3] — front cone L/C/R',
            '• ir[3] — short front IR L/C/R',
            '• floorIr[3] — depression edges (when Floor IR enabled)',
            '• blocked, forwardClear, nearest — fused summaries',
            '',
            'Shared safety / stuck recovery still run before your loop.',
            'Spring bumper (hit test) still handles footprint contact.',
            '',
            'Open Custom pad → Check → Save.',
        ].join('\n'),
        code: [
            '// Custom pad example',
            'v = MAX_SPEED * 0.60',
            'omega = headingErr * 2.00',
            'if (forwardClear < 1.5) v = MAX_SPEED * 0.25',
            'draw(robotX, robotZ)',
        ].join('\n'),
    },
};

const algoHelpDialog = document.getElementById('algoHelpDialog');
const algoHelpTitle = document.getElementById('algoHelpTitle');
const algoHelpBody = document.getElementById('algoHelpBody');
const algoHelpCode = document.getElementById('algoHelpCode');

function openAlgoHelp(algoId) {
    const info = ALGO_HELP[algoId];
    if (!info || !algoHelpDialog) return;
    if (algoHelpTitle) algoHelpTitle.textContent = info.title;
    if (algoHelpBody) algoHelpBody.textContent = info.body;
    if (algoHelpCode) algoHelpCode.textContent = info.code;
    if (typeof algoHelpDialog.showModal === 'function') {
        if (!algoHelpDialog.open) algoHelpDialog.showModal();
    } else {
        algoHelpDialog.setAttribute('open', '');
    }
}

function closeAlgoHelp() {
    if (!algoHelpDialog) return;
    if (typeof algoHelpDialog.close === 'function') algoHelpDialog.close();
    else algoHelpDialog.removeAttribute('open');
}

document.querySelectorAll('[data-algo-help]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAlgoHelp(btn.dataset.algoHelp);
    });
});
document.getElementById('closeAlgoHelpBtn')?.addEventListener('click', closeAlgoHelp);
document.getElementById('closeAlgoHelpBottomBtn')?.addEventListener('click', closeAlgoHelp);

function setMoveObjectsMode(on) {
    moveObjectsMode = on ? 1 : 0;
    if (moveObjectsEl) moveObjectsEl.checked = !!on;
    if (moveObjectsMode) {
        setDrawTerrainMode(0);
        setRobotSelected(0);
    } else {
        deselectProp();
    }
    syncCameraControls();
}

document.querySelectorAll('#modeGroup .toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        mode = btn.dataset.mode;
        setDrawTerrainMode(0);
        // Move Objects mode = camera lock + drag props (replaces the old checkbox).
        setMoveObjectsMode(mode === 'objects' ? 1 : 0);
        updateModeUi();
    });
});

document.querySelectorAll('.drag-item').forEach((item) => {
    item.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || animating) return;
        e.preventDefault();
        e.stopPropagation();
        beginPaletteDrag(item.dataset.type, item, e);
    });
    item.addEventListener('pointermove', (e) => {
        if (!paletteDrag || paletteDrag.pointerId !== e.pointerId) return;
        updatePaletteGhost(e.clientX, e.clientY);
        e.preventDefault();
    });
    item.addEventListener('pointerup', (e) => {
        if (!paletteDrag || paletteDrag.pointerId !== e.pointerId) return;
        endPaletteDrag(e.clientX, e.clientY);
        e.preventDefault();
    });
    item.addEventListener('pointercancel', (e) => {
        if (!paletteDrag || paletteDrag.pointerId !== e.pointerId) return;
        clearPaletteDrag();
    });
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && paletteDrag) {
        clearPaletteDrag();
    }
});

const massSlider = document.getElementById('objectMass');
const massValueEl = document.getElementById('massValue');
const scaleSlider = document.getElementById('objectScale');
const scaleValueEl = document.getElementById('scaleValue');
const terrainSlider = document.getElementById('terrainSize');

if (terrainSlider) {
    terrainSlider.value = String(PLANE_SIZE);
    updateTerrainUi();
    terrainSlider.addEventListener('input', (e) => {
        setTerrainSize(parseFloat(e.target.value));
    });
}

if (massSlider) {
    massSlider.value = String(DEFAULT_PROP_MASS);
    if (massValueEl) massValueEl.textContent = DEFAULT_PROP_MASS.toFixed(1);
    massSlider.addEventListener('input', (e) => {
        const mass = parseFloat(e.target.value);
        if (massValueEl) massValueEl.textContent = mass.toFixed(1);
        if (selectedProp) setPropMass(selectedProp, mass);
    });
}

if (scaleSlider) {
    scaleSlider.value = String(DEFAULT_PROP_SCALE);
    if (scaleValueEl) scaleValueEl.textContent = DEFAULT_PROP_SCALE.toFixed(2);
    scaleSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        if (scaleValueEl) scaleValueEl.textContent = scale.toFixed(2);
        if (selectedProp) setPropScale(selectedProp, scale);
    });
}

document.getElementById('clearObjectsBtn').addEventListener('click', () => {
    clearPhysicsProps();
});

const hitObjectsEl = document.getElementById('hitObjects');
if (hitObjectsEl) {
    hitObjectsEl.checked = hitObjects === 1;
    hitObjectsEl.addEventListener('change', () => {
        hitObjects = hitObjectsEl.checked ? 1 : 0;
        syncRobotPropCollisionMask();
    });
}

const physicsLevelEl = document.getElementById('physicsLevel');
const physicsLevelValueEl = document.getElementById('physicsLevelValue');
if (physicsLevelEl) {
    physicsLevelEl.value = String(physicsLevel);
    if (physicsLevelValueEl) physicsLevelValueEl.textContent = String(physicsLevel);
    physicsLevelEl.addEventListener('input', () => {
        physicsLevel = Math.max(1, Math.min(5, parseInt(physicsLevelEl.value, 10) || 3));
        if (physicsLevelValueEl) physicsLevelValueEl.textContent = String(physicsLevel);
    });
}

document.getElementById('saveMapBtn')?.addEventListener('click', () => {
    saveMapToLocal();
});

document.getElementById('loadMapBtn')?.addEventListener('click', () => {
    if (animating) return;
    loadMapFromLocal();
});

document.getElementById('closeMapPickerBtn')?.addEventListener('click', closeMapPicker);
document.getElementById('closeMapPickerBottomBtn')?.addEventListener('click', closeMapPicker);
document.getElementById('mapPickerList')?.addEventListener('click', (e) => {
    const loadBtn = e.target.closest('.map-load-btn');
    const delBtn = e.target.closest('.map-del-btn');
    if (loadBtn) {
        const id = loadBtn.dataset.id;
        if (loadMapById(id)) closeMapPicker();
        return;
    }
    if (delBtn) {
        deleteMapById(delBtn.dataset.id);
        openMapPicker();
    }
});

const drawTerrainBtn = document.getElementById('drawTerrainBtn');
if (drawTerrainBtn) {
    drawTerrainBtn.addEventListener('click', () => {
        if (animating) return;
        setDrawTerrainMode(drawTerrainMode ? 0 : 1);
    });
}

const stampHeightSlider = document.getElementById('stampHeight');
if (stampHeightSlider) {
    stampHeightSlider.addEventListener('input', (e) => {
        if (selectedStamp) setStampHeight(selectedStamp, parseFloat(e.target.value));
    });
    stampHeightSlider.addEventListener('change', () => {
        if (selectedStamp) addLog(t('logStampHeight', { label: stampHeightCaption(selectedStamp.height) }));
    });
}

const clearStampBtn = document.getElementById('clearStampBtn');
if (clearStampBtn) {
    clearStampBtn.addEventListener('click', () => {
        if (!selectedStamp) return;
        removeTerrainStamp(selectedStamp);
        addLog(t('logStampRemoved'));
    });
}

window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isDrawingStroke) {
        cancelTerrainStroke();
        e.preventDefault();
    } else if (drawTerrainMode) {
        setDrawTerrainMode(0);
        e.preventDefault();
    }
});

updateStampHeightUi();

applyLanguage(currentLang);
updateModeUi();
updateSensorStatus();
updateMissionButtons();
syncRobotPhysicsBody();
const buildStampEl = document.getElementById('buildStamp');
if (buildStampEl) buildStampEl.textContent = `build ${BUILD_STAMP}`;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!paused) applyRoverTerrain(dt);
    updateSpringBumper(dt);

    const placingPath = mode === 'waypoints' && !animating;
    robotGlowRing.visible = placingPath;
    if (placingPath) {
        const pulse = 0.25 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
        robotGlowRing.material.opacity = robotSelected ? pulse + 0.35 : pulse;
    }
    if (pathFlowLine && placingPath) {
        pathFlowLine.material.opacity = 0.7 + Math.sin(clock.getElapsedTime() * 3) * 0.25;
    }

    if (animating && !paused && waypoints.length >= 1) {
        checkWaypointMission();
    }

    let frameReading = null;
    if (animating && !paused && waypoints.length >= 1 && pathIndex < waypoints.length) {
        const target = waypoints[pathIndex];
        if (sensorConfig.hitTest) depenetrateRobot();
        const reading = sensorSuite.read();
        frameReading = reading;

        let cmd = computeNavCommand(
            activeAlgo,
            target,
            reading,
            navState,
            missionStart,
        );

        if (navState.mode !== lastAttemptMode) {
            recordMissionAttempt('mode', `${lastAttemptMode || 'none'}→${navState.mode}`);
            lastAttemptMode = navState.mode;
        }
        recordPoseTrail();

        if (cmd.recovery && navState.lastRecoveryLog !== cmd.recovery) {
            navState.lastRecoveryLog = cmd.recovery;
            recordMissionAttempt('recovery', cmd.recovery);
            addLog(t('logRecovery', { phase: cmd.recovery }));
        } else if (!cmd.recovery) {
            navState.lastRecoveryLog = '';
        }

        if (cmd.skip) {
            recordMissionAttempt('skip_waypoint', `wp${pathIndex}`);
            skipUnreachableWaypoint();
        }
        if (!cmd.skip) {
            addTelemetrySample(reading, cmd);
            const beforeX = robot.position.x;
            const beforeZ = robot.position.z;
            const motionBlocked = applyMotion(cmd.v, cmd.omega, dt);
            const progressed = Math.hypot(
                robot.position.x - beforeX,
                robot.position.z - beforeZ,
            ) > 0.06;
            if (progressed) navState.forceRose = 0;
            else if (sensorConfig.hitTest && motionBlocked && cmd.v > 0) {
                navState.forceRose = 1;
            } else {
                navState.forceRose = 0;
            }
        }

        if (!cmd.skip && activeAlgo === 'bug2' && navState.mode === 'BUG_FOLLOW') {
            const now = clock.getElapsedTime();
            if (now - navState.lastLogAt > 2) {
                navState.lastLogAt = now;
                addLog(t('logBug2', { side: navState.bugSide > 0 ? 'R' : 'L' }));
            }
        }
    }

    // Motion first, then cannon-es: kinematic velocity matches this frame's drive.
    stepPhysics(dt);
    if (animating && !paused && sensorConfig.hitTest) {
        const hullHit = queryPose(robot.position.x, robot.position.z, robot.rotation.y, { detect: 1 });
        if (hullHit.clear === 0) {
            triggerSpringBumper();
            markCollision(robot.position.clone());
        }
    }

    syncSensorVisuals(frameReading);

    updateMoveHandle(clock.getElapsedTime());

    renderer.render(scene, camera);
}

animate();

window.__phys = {
    drop(type, x, z, y) {
        const h = y != null ? y : (PROP_HALF_HEIGHT[type] || 0.5);
        const entry = createPhysicsProp(type, x, h, z);
        if (y == null) restPropOnSupport(entry, x, z);
        return entry;
    },
    snapshot() {
        return {
            robot: {
                x: +robot.position.x.toFixed(3),
                y: +robot.position.y.toFixed(3),
                z: +robot.position.z.toFixed(3),
            },
            props: physicsProps.map((p) => ({
                type: p.type,
                x: +p.mesh.position.x.toFixed(3),
                y: +p.mesh.position.y.toFixed(3),
                z: +p.mesh.position.z.toFixed(3),
                vx: +p.body.velocity.x.toFixed(2),
                vy: +p.body.velocity.y.toFixed(2),
                vz: +p.body.velocity.z.toFixed(2),
            })),
            cones: stageCones.map((p) => ({
                x: +p.mesh.position.x.toFixed(3),
                y: +p.mesh.position.y.toFixed(3),
                z: +p.mesh.position.z.toFixed(3),
                vx: +p.body.velocity.x.toFixed(2),
                vz: +p.body.velocity.z.toFixed(2),
            })),
            hitObjects,
        };
    },
    placeWp(x, z) {
        placeWaypointAt(x, z);
        updateModeUi();
        return waypoints.length;
    },
    stamp(points, height) {
        const stamp = createTerrainStamp(points);
        if (Number.isFinite(height) && height !== 0) setStampHeight(stamp, height);
        return { n: terrainStamps.length, height: stamp.height };
    },
    clearStamps() {
        while (terrainStamps.length > 0) {
            removeTerrainStamp(terrainStamps[terrainStamps.length - 1]);
        }
        return terrainStamps.length;
    },
};
