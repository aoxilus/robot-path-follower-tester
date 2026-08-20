# Cómo dar órdenes a TAMU AI

Guía para usar **TAMUS AI Chat** + **OpenCode** en este repo (`robot-path-planning-sim`).

TAMU **escribe código** en el proyecto. Un agente local (Cursor u otro) **verifica** con `verify-task.ps1`. Si TAMU falla, se **reporta** — no se corrige en silencio salvo que tú lo pidas.

**Filosofía del repo:** portabilidad primero — núcleo `main.js` + `nav.js`, sin micromódulos. Ver [DISENO_PORTABILIDAD.md](DISENO_PORTABILIDAD.md). No pidas a TAMU “modularizar” salvo que tú lo quieras explícitamente.

---

## 1. Requisitos (una sola vez)

| Paso | Qué hacer |
|------|-----------|
| API key | Copia tu key de [TAMUS AI Chat](https://chat.tamu.ai) |
| Archivo `.env` | En `tamu-helper-cli/.env`: `TAMU_API_KEY=tu_key` (plantilla: `.env.example`) |
| OpenCode | `tamu_helper.ps1` lo instala con winget si falta |

```powershell
cd tamu-helper-cli
copy .env.example .env
# Edita .env y pega tu key
.\tamu_helper.ps1
```

La primera vez puede pedir la key en consola. **No subas `.env` a GitHub.**

---

## 2. Tres formas de dar órdenes

### A) Modo chat (interactivo)

Para explorar, depurar o una tarea suelta sin cola.

```powershell
cd tamu-helper-cli
.\tamu_helper.ps1 -ProjectPath ".."
```

Dentro de OpenCode:

1. Escribe `/connect`
2. Elige **TAMUS AI Chat API**
3. Elige modelo (p. ej. `Claude Sonnet 4.6` para código; `Haiku` para ahorrar cuota)
4. Escribe tu orden en lenguaje natural

**Ejemplo de orden (chat):**

```text
En nav.js, corrige el algoritmo DWA para que no reduzca v cuando forwardClear es Infinity.
No cambies los otros algoritmos ni main.js salvo imports necesarios.
```

---

### B) Una orden desde PowerShell (sin abrir chat)

Útil para scripts o una tarea concreta.

```powershell
cd tamu-helper-cli
.\tamu_helper.ps1 `
  -ProjectPath ".." `
  -Prompt "Crea scripts/smoke_sim.mjs que valide package.json, main.js y nav.js. Solo stdlib de Node. Exit 0 si todo OK."
```

**Parámetros útiles:**

| Parámetro | Para qué |
|-----------|----------|
| `-ProjectPath ".."` | Carpeta donde OpenCode lee/escribe (raíz del sim) |
| `-Prompt "..."` | La orden completa |
| `-NoPrompt` | No preguntar la API key (obligatorio en orquestación) |
| `-AsJob` | Corre en segundo plano (PowerShell job) |
| `-CheckIntervalMinutes 5` | Cuánto esperar antes de revisar el job |
| `-ReturnDataAs "json"` | Pide salida en JSON |
| `-ReturnDataAs "report.md"` | Pide que escriba un archivo con ese nombre |

**Ejemplo en background:**

```powershell
.\tamu_helper.ps1 `
  -ProjectPath ".." `
  -Prompt "Documenta los 5 algoritmos en README.md" `
  -AsJob `
  -CheckIntervalMinutes 3
```

---

### C) Cola automática (orquestación)

Para **varias tareas en serie**, con verificación después de cada una.

```bat
run-tamu-orchestrate.bat
```

O:

```powershell
cd tamu-helper-cli
.\orchestrate.ps1
```

La cola vive en `tamu-helper-cli/tasks.json`. Cada entrada tiene:

- `id` — identificador (debe coincidir con `verify-task.ps1`)
- `title` — nombre legible
- `prompt` — **la orden que recibe TAMU**
- `verify` — chequeo post-TAMU

**Reanudar** desde una tarea:

```powershell
.\orchestrate.ps1 -FromTask telemetry-export
```

**Probar la cola sin gastar API:**

```powershell
.\orchestrate.ps1 -DryRun
```

**Reporte:** `tamu-helper-cli/logs/orchestration-report.json`

---

## 3. Cómo escribir buenas órdenes (este proyecto)

El sim usa **Vite + Three.js + cannon-es**. Archivos clave:

| Archivo | Rol |
|---------|-----|
| `main.js` | escena, UI, telemetría, física |
| `nav.js` | sensores + 5 algoritmos (`pure_pursuit`, `bug2`, `dwa`, `vfh`, `potential_field`) |
| `index.html` | layout 3 columnas, botones algoritmo |
| `style.css` | estilos |

### Plantilla de prompt (copiar y adaptar)

```text
Contexto: Robot Path Follower Tester — sim 3D en navegador (main.js + nav.js).

Tarea: [QUÉ HACER EN UNA FRASE]

Archivos permitidos: [lista]
Archivos prohibidos: [lista]

Criterios de éxito:
1. [comportamiento observable]
2. [no romper X]
3. [mantener i18n EN/ES si tocas UI]

No agregar dependencias npm salvo que se pida explícitamente.
```

### Ejemplo — orden bien acotada

```text
En main.js agrega botones Export JSON y Export CSV en la sección de telemetría.
Serializa missionTelemetry existente. Archivos de descarga: robot-telemetry.json y robot-telemetry.csv.
Añade claves i18n en STRINGS en y es. No cambies nav.js ni la tasa de muestreo de addTelemetrySample.
```

### Evitar

- Órdenes vagas: *“mejora el robot”*
- Pedir muchas features en un solo prompt (gasta cuota y confunde)
- Refactors grandes sin listar archivos tocables
- Pedir Python/ROS si el cambio es solo frontend JS
- Pedir “extraer módulos” / `src/` / un archivo por algoritmo — rompe portabilidad ([DISENO_PORTABILIDAD.md](DISENO_PORTABILIDAD.md))

---

## 4. Agregar una tarea nueva a la cola

1. **Escribe el prompt** en `tamu-helper-cli/tasks.json`:

```json
{
  "id": "mi-tarea",
  "title": "Descripción corta",
  "prompt": "Tu orden detallada para OpenCode...",
  "verify": "mi-tarea"
}
```

2. **Añade el chequeo** en `tamu-helper-cli/verify-task.ps1` (bloque `switch`):

```powershell
"mi-tarea" {
    $js = Read-ProjectFile "main.js"
    if ($js -notmatch "lo-que-debe-existir") { Fail "..." }
    Pass "mi-tarea OK"
}
```

3. **Prueba solo la verificación** (antes o después de TAMU):

```powershell
.\verify-task.ps1 -TaskId mi-tarea
```

4. **Corre la cola** (o solo desde esa tarea):

```powershell
.\orchestrate.ps1 -FromTask mi-tarea
```

---

## 5. Después de que TAMU termina

| Acción | Comando |
|--------|---------|
| Ver si pasó | `Get-Content tamu-helper-cli\logs\orchestration-report.json` |
| Log de una tarea | `tamu-helper-cli\logs\tamu_<id>.log` |
| Verificar a mano | `.\verify-task.ps1 -TaskId smoke-script` |
| Probar el sim | `npm run dev` → http://localhost:5173 |

Si `verify_status` es `fail`: revisa el log, ajusta el prompt en `tasks.json` o pide a Cursor que **reporte** (no que rehaga el trabajo de TAMU, salvo que tú lo indiques).

---

## 6. Cuota y modelos

- Presupuesto aproximado: **~$10/día** por usuario TAMU.
- Reset habitual: **~18:00 hora Central**.
- Si ves `Budget Exceeded`: espera al reset; no insistas en la API.
- Para sesiones largas: modelos **Haiku / Flash** en `/connect`.
- Para cambios difíciles: **Sonnet / Opus** en prompts cortos y acotados.

---

## 7. Referencia rápida

```powershell
# Chat interactivo en este repo
cd tamu-helper-cli
.\tamu_helper.ps1 -ProjectPath ".."

# Una orden
.\tamu_helper.ps1 -ProjectPath ".." -Prompt "tu orden aquí"

# Cola completa
cd ..
.\run-tamu-orchestrate.bat

# Verificación
cd tamu-helper-cli
.\verify-task.ps1 -TaskId smoke-script
```

Más detalle del flujo secuencial: [TAMU_ORCHESTRATION.md](TAMU_ORCHESTRATION.md)
