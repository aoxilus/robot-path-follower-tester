# Diseño: portabilidad primero

Este sim **no** apunta a una arquitectura enterprise con muchos módulos. Apunta a ser **muy portable**: clonar, abrir, `npm install && npm run dev`, y tener todo el sandbox en pocas piezas legibles.

---

## Objetivo

| Prioridad | Qué significa |
|-----------|----------------|
| **Portabilidad** | Pocos archivos, dependencias mínimas (Vite + Three.js + cannon-es), fácil de copiar a otro PC o curso |
| **Legibilidad local** | Ver escena + UI + misión en `main.js` y navegación en `nav.js` sin saltar entre 15 imports |
| **Prototipo rápido** | Cambiar algoritmo, sensores o telemetría sin reconfigurar capas ni carpetas |

---

## Por qué el “monolito” es aceptable aquí

- **`main.js` grande** concentra composición de la app (escena, input, i18n, telemetría, bucle). Eso es **intencional**: una sola entrada para entender el sim end-to-end.
- **`nav.js` separado** ya marca la frontera útil: sensores + algoritmos, sin DOM. No hace falta partirlo en `nav/purePursuit.js`, `nav/dwa.js`, etc. salvo que el archivo se vuelva ingobernable.
- **Micromanagement modular** (extraer `i18n.js`, `telemetry.js`, `physics.js`, `collision.js`, `nav/` por algoritmo) **rompe portabilidad**: más archivos, más wiring, más rutas de import, más fricción al copiar el proyecto a otro lado o enseñarlo en una sola sesión.

Críticas tipo “deberían modularizar incrementalmente” aplican a apps de producción a largo plazo. **Este repo es un tester visual en el navegador**, no un framework.

---

## Reglas para agentes IA (Cursor, TAMU, etc.)

**No proponer ni implementar** sin que el usuario lo pida explícitamente:

- Partir `main.js` en muchos módulos pequeños
- Crear árbol `src/` con capas (services, controllers, etc.)
- Extraer cada algoritmo a su propio archivo “por buenas prácticas”
- Refactors arquitectónicos “para escalabilidad” cuando el alcance es demo/portable

**Sí está bien:**

- Mantener **`main.js` + `nav.js` + `index.html` + `style.css`** como núcleo
- Añadir **`scripts/smoke_sim.mjs`**, export telemetría, README, tests de humo
- Un **`algorithms/custom.js`** (o similar) **solo** cuando exista un hook claro y el usuario lo pida — sin proliferar carpetas
- Comentarios y secciones con encabezados dentro de `main.js` / `nav.js` en lugar de nuevos archivos

---

## Cuándo sí dividir

Solo si el usuario lo pide o si un archivo supera un umbral incómodo **y** la extracción no multiplica el setup (p. ej. un solo `algorithms/custom.js` opcional).

---

## Referencia

Respuesta del equipo a [CRITICA_TAMU.md](CRITICA_TAMU.md): la deuda “monolítica” se reevalúa bajo esta filosofía; las sugerencias de modularización masiva **no son prioridad**.
