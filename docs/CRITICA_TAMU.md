# Critica tecnica — Robot Path Follower Tester

## Resumen ejecutivo

Robot Path Follower Tester sigue siendo una demo 3D util para docencia y prototipado rapido: permite colocar waypoints, alternar sensores, comparar cinco estrategias de navegacion y empujar objetos fisicos en una arena Three.js/cannon-es. La experiencia principal esta alineada con el objetivo del proyecto y la documentacion publica ya esta mucho mas cerca de la app real que en la revision anterior.

La segunda pasada muestra progreso concreto: `README.md` ya documenta Pure Pursuit, Bug2, DWA, VFH y Potential Field; el quick start ya usa `robot-path-planning-sim`; `package.json` ya no incluye `dat.gui`; `index.html` ya tiene botones de exportacion JSON/CSV; `main.js` implementa `exportTelemetryJson()` y `exportTelemetryCsv()`; y existe `scripts/smoke_sim.mjs` como primera verificacion automatizada. Esos cambios cierran varias observaciones de la critica previa.

La deuda principal sigue siendo arquitectonica **desde una lente de apps grandes**, pero el equipo prioriza **portabilidad** sobre micromódulos. Ver [DISENO_PORTABILIDAD.md](DISENO_PORTABILIDAD.md): `main.js` + `nav.js` como nucleo pocos archivos es **intencional**; partir en `i18n.js`, `telemetry.js`, `nav/` por algoritmo, etc. **no es prioridad** y rompe el objetivo de copiar el sim y correrlo rapido.

Tambien quedan riesgos de producto: no existe carpeta `algorithms/` pese a que el README promete hooks futuros para algoritmos propios; el smoke script no esta expuesto en `package.json`; la exportacion CSV es util pero parcial; la UI no tiene layout responsive; y los algoritmos estan todos interceptados por `safetyCommand()`, lo que mejora robustez visual pero reduce la comparabilidad entre modos.

## Cambios desde la revision anterior

- Corregido: `README.md` ya no describe Basic Avoidance, Bug 0 y Random Wander. En `README.md:54-62` lista los cinco algoritmos actuales: `pure_pursuit`, `bug2`, `dwa`, `vfh` y `potential_field`.
- Corregido: el quick start ya usa la carpeta actual `robot-path-planning-sim` en `README.md:30-37`, en linea con `AGENTS.md`.
- Corregido: `dat.gui` ya no aparece en `package.json`; las dependencias actuales son solo `three` y `cannon-es` mas `vite` como devDependency (`package.json:12-18`).
- Corregido: la UI ya ofrece exportacion de telemetria. `index.html:122-125` agrega `exportTelemetryJson` y `exportTelemetryCsv`, y `main.js:1719-1738` implementa las descargas `robot-telemetry.json` y `robot-telemetry.csv`.
- Corregido parcialmente: ya existe un smoke test en `scripts/smoke_sim.mjs` que valida archivos clave, dependencias y botones `data-algo` (`scripts/smoke_sim.mjs:7-84`). Sigue faltando conectarlo a `package.json` como script `test` o `smoke`.
- Corregido: la logica muerta mencionada antes como `handleStuckRecovery()` ya no aparece en `main.js`; la recuperacion actual se maneja mediante `navState.forceRose`, `safetyCommand()` y `dontbeWebon()` (`main.js:2037-2040`, `nav.js:333-435`).
- Mejorado: `nav.js` ahora documenta arreglos relevantes en sensores y DWA. Por ejemplo, `SensorSuite.cast()` devuelve `Infinity` en ausencia de hit (`nav.js:53-67`) y DWA usa `clearanceForTurn()` para puntuar la direccion candidata (`nav.js:475-508`).
- Sigue abierto: no hay pruebas unitarias ni validacion numerica de geometria, sensores o algoritmos; el smoke test solo comprueba presencia y wiring basico. (Modularizar `main.js`/`nav.js` en muchos archivos **no** es respuesta acordada; ver `DISENO_PORTABILIDAD.md`.)
- Sigue abierto: no existe `algorithms/`. El README mantiene como futuro la extension por Python/JavaScript (`README.md:26`, `README.md:91-96`), pero no hay stub ni contrato de plugin.
- Nuevo/mas visible: la exportacion CSV existe, pero solo incluye un subconjunto fijo de campos (`TELEMETRY_CSV_HEADER` en `main.js:1667`); omite objetos, lecturas IR/ultrasonicas completas, `hitTest` y estado detallado de `navigation`.

## Fortalezas

- La pila es simple y adecuada: Vite, Three.js y cannon-es sin framework adicional (`package.json:7-18`). Esto reduce friccion para clases, demos y prototipos.
- `index.html` mantiene una estructura clara de tres zonas: panel izquierdo para sensores/navegacion/interaccion, viewport central y panel derecho para drag/drop y telemetria (`index.html:11-130`).
- La seleccion de algoritmos esta bien cableada: los botones `data-algo` de `index.html:46-52` coinciden con las ramas de `computeNavCommand()` en `nav.js:437-573`.
- La internacionalizacion EN/ES esta integrada y persistida. `translations`, `t()` y `applyLanguage()` estan en `main.js:12-199`; `applyLanguage()` actualiza `document.documentElement.lang`, `document.title`, textos `data-i18n`, estado de modo y estado de sensores.
- La separacion `main.js`/`nav.js` evita que navegacion manipule el DOM directamente. `main.js:1442-1465` crea el sistema con dependencias explicitas, y `nav.js:4-23` recibe contexto en `createNavSystem(ctx)`.
- El modelo sensorial es mas rico que una demo minima. `SensorSuite.read()` fusiona LIDAR, ultrasonico e IR en `polar`, `forwardClear`, `minObstacleDist`, `sensorVotes` y `sensorWeight` (`nav.js:69-215`).
- La capa de colisiones tiene cuidado practico. `main.js` evita usar `setFromObject(robot)` para el robot porque los visuales de radar inflan la caja (`main.js:313-320`) y usa SAT 2D mediante `roverFootprintCorners()`, `polygonsOverlap()` y `queryPose()` (`main.js:566-675`).
- La telemetria es tecnicamente valiosa. `addTelemetrySample()` captura algoritmo, waypoint, pose, comando, hit-test, objetos, estado de navegacion y sensores (`main.js:1747-1809`).
- La UX de objetos fisicos esta bien lograda para una app ligera: paleta drag/drop, masa configurable, modo de mover objetos y limpieza de props (`index.html:79-117`, `main.js:468-530`, `main.js:1930-1973`).
- La documentacion publica mejoro. `README.md` ahora explica los algoritmos actuales, el layout, la pila y aclara que la fisica no es un simulador dinamico validado (`README.md:43-75`).

## Debilidades y riesgos

- `main.js` es demasiado grande. En 2059 lineas combina inicializacion 3D, texturas, robot, obstaculos, cannon-es, colisiones, input pointer, drag/drop, i18n, logs, exportacion, mision y render loop. Cambios pequenos obligan a navegar un archivo con muchas responsabilidades.
- `nav.js` mejoro respecto a una mezcla DOM/navegacion, pero `createNavSystem()` todavia encapsula demasiadas cosas: `SensorSuite`, fusion sensorial, `safetyCommand()`, `dontbeWebon()` y los cinco algoritmos. No hay modulos independientes para probar Pure Pursuit, DWA o VFH sin instanciar un contexto Three.js.
- No hay carpeta `algorithms/`. Si el objetivo es permitir algoritmos custom, falta un contrato minimo de entrada/salida y un stub cargable. El README lo presenta como futuro, pero el codigo actual no ofrece extension directa.
- `package.json` no expone pruebas. Solo hay `dev`, `build` y `preview` (`package.json:7-10`). `scripts/smoke_sim.mjs` existe, pero el usuario debe saber ejecutarlo manualmente con `node scripts/smoke_sim.mjs`.
- La telemetria exportada en CSV pierde informacion. `addTelemetrySample()` guarda objetos, `hitTest`, `navigation`, IR y ultrasonico completos (`main.js:1773-1803`), pero `TELEMETRY_CSV_HEADER` solo exporta 14 columnas basicas (`main.js:1667-1705`).
- El log visual sigue mezclando eventos humanos y JSON crudo. `addTelemetrySample()` llama `addLog(JSON.stringify(sample))` cada 2 s (`main.js:1747-1809`), lo que es util para debugging pero dificil de leer durante una demo.
- La UI no es responsive. `style.css` fija tres columnas (`style.css:30-37`), `html, body` usan `overflow: hidden` (`style.css:16-22`) y no hay `@media`. En pantallas pequenas o moviles, paneles y viewport pueden quedar inaccesibles.
- La fisica del robot es aproximada. `robotBody` es kinematic con masa 0 (`main.js:444-457`), el movimiento real se integra manualmente en `applyMotion()` (`main.js:1488-1523`) y los props reciben impulsos manuales en `applyRobotPushImpulse()` (`main.js:709-729`). Esto se documenta en README, pero sigue siendo una limitacion tecnica.
- El encabezado de `main.js` sigue historico: menciona "Bug0 / avoidance / wander" (`main.js:1-3`), aunque la app actual usa cinco algoritmos distintos. Es menor, pero crea ruido para mantenimiento.
- La capa comun de seguridad hace que los algoritmos no sean completamente comparables. `computeNavCommand()` llama `safetyCommand()` antes de cualquier rama de algoritmo (`nav.js:437-443`), de modo que Pure Pursuit, Bug2, DWA, VFH y Potential Field pueden comportarse igual ante bloqueos.
- Hay decisiones heuristicas con nombres y umbrales dificiles de auditar. `dontbeWebon()` (`nav.js:333-379`) funciona como recuperacion/contorneo, pero el nombre no comunica su rol tecnico y varios parametros estan hardcodeados.
- Hay costo de garbage collection y raycasting si crecen los props. `SensorSuite.cast()` reconstruye la lista con `allTargets()` y `intersectObjects()` por rayo (`nav.js:49-67`); `SensorSuite.read()` crea muchos `Vector3` por frame (`nav.js:69-152`); `isPhysicalCollision()` crea `new THREE.Box3().setFromObject(mesh)` por obstaculo dinamico (`nav.js:218-227`).

## Filosofia de diseno (respuesta del equipo)

**Monolitico no esta mal aqui.** El objetivo es **maxima portabilidad**: clonar el repo, `npm install && npm run dev`, y tener el sandbox en pocas piezas (`main.js`, `nav.js`, HTML/CSS) sin rastrear diez modulos.

Micromanagement modular (extraer telemetria, i18n, fisica, un archivo por algoritmo) **contradice** ese objetivo: mas imports, mas carpetas, mas friccion en clase o al copiar el proyecto.

La unica separacion que ya tiene sentido es **`nav.js`** (sensores + algoritmos, sin DOM). El resto puede quedarse en `main.js` con secciones claras. Refactors arquitectonicos masivos **no son prioridad** salvo pedido explicito del usuario.

Documento de referencia: [DISENO_PORTABILIDAD.md](DISENO_PORTABILIDAD.md).

## Arquitectura (main.js vs nav.js)

`main.js` funciona como composition root y como implementacion de casi toda la aplicacion. Inicializa renderer/camara/controles (`main.js:201-229`), arena y robot (`main.js:285-395`), cannon-es (`main.js:397-457`), props fisicos (`main.js:459-530`), colisiones (`main.js:547-729`), UI, telemetria (`main.js:1587-1809`) y bucle principal (`main.js:1982-2059`). Esto da una app facil de abrir, pero no facil de probar.

La frontera con `nav.js` es razonable pero incompleta. `main.js` inyecta dependencias concretas como `robot`, `obstacles`, `queryPose()`, `getRobotSensorOrigin()`, constantes de rango y limites (`main.js:1442-1465`). `nav.js` no conoce `document`, lo cual es bueno. Sin embargo, si conoce objetos Three.js vivos (`robot`, `obstacles`, `scanRays`) y muta `navState` recibido desde `main.js`. Por eso no es un modulo puro de algoritmos.

La responsabilidad de colision esta distribuida. `main.js` decide si una pose es valida con `queryPose()` y resuelve penetraciones con `depenetrateRobot()` (`main.js:641-700`). `nav.js` usa `queryPose()` para elegir headings y `SensorSuite.isPhysicalCollision()` para intersecciones AABB (`nav.js:218-227`). Esta duplicidad conceptual es manejable hoy, pero puede producir inconsistencias si se cambia la huella del robot, el margen o el tipo de obstaculo.

La telemetria y exportacion estan en el lugar mas pragmatico, pero no mas mantenible. `main.js` contiene `collectTelemetryObjects()`, serializacion CSV, descarga por `Blob`, handlers de botones y sampling (`main.js:1594-1809`). Extraer `telemetry.js` seria de bajo riesgo y reduciria bastante ruido.

Una modularizacion incremental **solo tiene sentido si el equipo la pide**; por defecto, mantener el nucleo compacto. Mejoras de bajo acoplamiento sin proliferar archivos: comentarios de seccion, funciones puras testeables *dentro* de `nav.js` si hace falta, smoke script en `package.json`.

## Algoritmos de navegacion

`nav.js` implementa cinco modos en `computeNavCommand(activeAlgo, target, reading, navState, missionStart)` (`nav.js:437-573`). Antes de ejecutar cualquier modo, calcula `goalAngle`, `headingErr`, `blocked`, `clear` y delega a `safetyCommand()` (`nav.js:437-443`). Si `safetyCommand()` retorna un comando, el algoritmo seleccionado no corre.

Pure Pursuit (`nav.js:445-449`) es mas un controlador proporcional al waypoint que un Pure Pursuit geometrico. No selecciona un punto lookahead sobre una trayectoria; simplemente convierte `headingErr` en `omega` y escala `v` si `clear < 3`. Es estable y pedagogico, pero el nombre puede sobreprometer.

Bug2 (`nav.js:451-473`) usa `mLineDist()` (`nav.js:266-273`) y `missionStart` para decidir cuando volver de `BUG_FOLLOW` a `TRACK`. Es una aproximacion razonable para docencia, aunque el seguimiento de contorno es un giro heuristico con `bugSide`, no una traza explicita del borde del obstaculo.

DWA (`nav.js:475-515`) mejoro respecto a la critica previa: ahora `clearanceForTurn()` evalua clearance por direccion candidata (`nav.js:483-489`) y evita trayectorias con clearance insuficiente (`nav.js:503-508`). Sigue siendo una version discreta y simplificada: no modela aceleraciones, frenado, huella completa durante todo el rollout ni movimiento futuro de objetos dinamicos.

VFH (`nav.js:517-544`) construye 16 sectores desde `reading.polar` y minimiza una combinacion de ocupacion y distancia al sector objetivo. Es barato y claro, pero necesita pruebas de convenciones angulares. El mapeo `angle -> sector` (`nav.js:523-525`) y `headingErr -> goalSector` (`nav.js:532`) son puntos sensibles a errores de signo.

Potential Field (`nav.js:546-573`) suma atraccion hacia el objetivo y repulsion de `reading.polar`/IR. Sirve para demostrar el concepto, pero conserva riesgos clasicos: minimos locales, oscilacion y mal comportamiento en pasillos. Como `safetyCommand()` puede tomar control antes, el modo real es un hibrido entre campo potencial y recuperacion reactiva.

La fusion sensorial ahora es mas sofisticada. `SensorSuite.read()` no marca `blocked` por una sola lectura: exige consenso de al menos 2 sistemas (`sensorVotes >= 2`) y guarda `sensorWeight` para auditoria (`nav.js:176-214`). Esta mejora reduce falsos positivos, pero tambien significa que con un solo sensor activo se puede reportar `forwardClear` bajo sin entrar en `blocked`, dependiendo de `safetyCommand()` y `queryPose()` para reaccionar.

El mayor riesgo tecnico de algoritmos es la falta de pruebas. Funciones como `normalizeAngle()`, `mLineDist()`, `polarClearance()`, `chooseFreestHeading()`, el mapeo VFH y el scoring DWA son puras o casi puras, pero estan encerradas dentro de `createNavSystem()` y no se exportan para test unitario.

## UX, i18n y telemetria

La UX principal es clara en escritorio. El usuario puede activar sensores (`index.html:23-41`), escoger algoritmo (`index.html:43-58`), alternar modo waypoints/objetos (`index.html:60-69`) y usar la paleta de props (`index.html:79-117`). El viewport central mantiene foco visual y el panel derecho agrupa objetos y telemetria.

La i18n esta bien para una app pequena. `data-i18n` cubre la mayoria de textos visibles y `applyLanguage()` actualiza tambien el label de drop (`main.js:178-199`). La deuda es organizacional: el diccionario grande vive dentro de `main.js`, y agregar pantallas o modales aumentara el ruido del archivo.

La telemetria dio un paso importante: ya no queda solo en memoria/log. `exportTelemetryJson()` descarga el arreglo completo (`main.js:1719-1725`) y `exportTelemetryCsv()` genera un CSV plano (`main.js:1727-1738`). Los botones estan visibles en `index.html:120-126` y traducidos en `main.js:40-42` y `main.js:110-112`.

Lo que falta para que sea un tester real es analisis de corridas. Hoy no hay resumen de tiempo total, distancia recorrida, waypoints omitidos, numero de bloqueos, promedio de clearance, colisiones o comparacion por algoritmo. El log contiene datos suficientes para calcularlo, pero la UI no los presenta.

El CSV es practico pero incompleto. Para analisis externo deberia incluir columnas para `navigation.rose`, `navigation.webon`, `hitTest.kind/id`, `sensors.votes/weight`, y posiblemente serializar objetos como JSON por fila o exportarlos en un archivo separado. Ahora esos campos solo sobreviven en JSON.

Accesibilidad y responsive siguen pendientes. Hay `role="group"` en grupos de botones (`index.html:46`, `index.html:62`) y `aria-live` en `sensorStatus` (`index.html:40`), pero faltan labels mas especificos para grupos, estados `aria-pressed` en toggles y un layout alternativo para pantallas estrechas.

## Rendimiento y fisica

Con la escena actual el rendimiento deberia ser aceptable: dos obstaculos estaticos, 36 bins LIDAR (`nav.js:40`), pocos rayos visuales y un numero limitado de props. El bucle principal limita `dt` a 0.05 (`main.js:1985`) y cannon-es usa `physicsWorld.step(Math.min(dt, 1 / 30), dt, 5)` (`main.js:538-540`).

El riesgo aparece al escalar. Cada lectura sensorial dispara raycasts con `intersectObjects()` sobre la lista de targets (`nav.js:62-67`), y `allTargets()` crea un array nuevo (`nav.js:49-51`). Las ramas de LIDAR, ultrasonico e IR crean vectores y arrays por frame (`nav.js:88-152`). Con decenas de objetos o mas bins, esto puede generar GC y caidas de FPS.

Las consultas de colision tambien se repiten. `queryPose()` crea un `THREE.Box3` y llama `setFromObject()` para obstaculos y props en cada pose candidata (`main.js:641-675`). `chooseFreestHeading()` llama `queryPose()` por offset (`nav.js:286-312`), DWA simula varias combinaciones (`nav.js:491-510`) y `animate()` invoca `sensorSuite.isPhysicalCollision()` dos veces por frame (`main.js:2013-2023`). Hoy no es critico; con mas complejidad conviene cachear cajas por frame.

La fisica es visual y aproximada, no dinamica diferencial. `applyMotion()` mueve la pose directamente si `queryPose()` permite la posicion (`main.js:1488-1508`). `robotBody` se sincroniza con esa pose (`main.js:533-540`) y `applyRobotPushImpulse()` aplica velocidades manuales a props al intersectar (`main.js:709-729`). La aclaracion del README (`README.md:73-75`) es correcta y deberia mantenerse.

El uso de `CANNON.NaiveBroadphase` (`main.js:400`) es suficiente para pocas entidades, pero no escala bien. Si se agregan muchos props o escenarios mas densos, convendria evaluar broadphase mas eficiente o limitar interacciones fisicas activas.

## Sugerencias priorizadas (alta / media / baja)

Alta:

- Agregar scripts en `package.json`: `"smoke": "node scripts/smoke_sim.mjs"` y, si no hay test formal, `"test": "node scripts/smoke_sim.mjs"`.
- ~~Extraer `telemetry.js` / `i18n.js` desde `main.js`~~ — **descartado por diseno** (portabilidad; ver `DISENO_PORTABILIDAD.md`).
- Definir contrato de algoritmos custom **solo cuando el usuario lo pida**; un stub minimo (p. ej. `algorithms/custom.js`) sin proliferar carpetas.
- Pruebas unitarias **opcionales** para funciones puras; no implican partir el repo en modulos.

Media:

- ~~Dividir `nav.js` en archivos por algoritmo~~ — **no prioritario** (portabilidad).
- Mejorar CSV para exportar mas campos o generar dos archivos: `samples.csv` y `objects.csv`. El JSON ya es completo; el CSV deberia servir para analisis en spreadsheet.
- Hacer responsive `style.css` con media queries: en pantallas estrechas, paneles colapsables o layout vertical con viewport minimo usable.
- Cachear por frame la lista de targets y `Box3` de props dinamicos. Reutilizar `Vector3` en `SensorSuite.read()` donde sea sencillo.
- Renombrar `dontbeWebon()` a un nombre tecnico como `computeRecoveryCommand()` o `wallFollowRecovery()` y documentar sus umbrales.
- Mostrar metricas resumidas en UI: distancia al waypoint, comando actual, blocked/votes, colisiones, waypoints pasados/omitidos y tiempo de mision.

Baja:

- Actualizar el encabezado de `main.js:1-3` para remover la referencia historica a Bug0/avoidance/wander.
- Agregar `aria-pressed` a botones toggle de idioma, algoritmo y modo, y labels descriptivos a los grupos.
- Automatizar `BUILD_STAMP` (`main.js:10`, `index.html:74`) desde version/build en lugar de mantenerlo manual.
- Documentar en README como ejecutar el smoke script cuando se agregue a `package.json`.
- Considerar un modo de telemetria "compacto" en el log visual y dejar JSON crudo solo para exportacion o depuracion avanzada.
- Mantener la nota de fisica aproximada y evitar lenguaje que sugiera validacion dinamica real.

## Conclusion

El proyecto avanzo de forma tangible desde la critica anterior. Las inconsistencias mas visibles de README, dependencia no usada, exportacion de telemetria y smoke test basico ya fueron corregidas o parcialmente corregidas. La app esta mas coherente como producto y mas honesta sobre su fisica.

La critica central **revisada**: bajo la filosofia de [DISENO_PORTABILIDAD.md](DISENO_PORTABILIDAD.md), el tamano de `main.js`/`nav.js` es un **tradeoff aceptado** a cambio de portabilidad y una sola entrada mental al sim. Lo que sigue importando: conectar el smoke test a `npm`, mejorar export/analisis de telemetria, responsive si hace falta, y features que el usuario pida — **no** micromódulos por defecto.

Con eso, Robot Path Follower Tester sigue siendo un sandbox visual portable para ensenar y comparar estrategias de navegacion en el navegador.
