---
read_when:
    - Necesitas inspeccionar la salida sin procesar del modelo para detectar filtración de razonamiento
    - Quieres ejecutar el Gateway en modo watch mientras iteras
    - Necesitas un flujo de trabajo de depuración repetible
summary: 'Herramientas de depuración: modo watch, flujos sin procesar del modelo y rastreo de filtración de razonamiento'
title: Depuración
x-i18n:
    generated_at: "2026-04-06T03:07:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bc72e8d6cad3a1acaad066f381c82309583fabf304c589e63885f2685dc704e
    source_path: help/debugging.md
    workflow: 15
---

# Depuración

Esta página cubre utilidades de depuración para la salida en streaming, especialmente cuando un
proveedor mezcla razonamiento dentro del texto normal.

## Anulaciones de depuración en tiempo de ejecución

Usa `/debug` en el chat para establecer anulaciones de configuración **solo en tiempo de ejecución** (memoria, no disco).
`/debug` está desactivado de forma predeterminada; habilítalo con `commands.debug: true`.
Esto es útil cuando necesitas alternar configuraciones poco comunes sin editar `openclaw.json`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` borra todas las anulaciones y vuelve a la configuración en disco.

## Modo watch del Gateway

Para una iteración rápida, ejecuta el gateway bajo el observador de archivos:

```bash
pnpm gateway:watch
```

Esto corresponde a:

```bash
node scripts/watch-node.mjs gateway --force
```

El observador se reinicia ante archivos relevantes para la compilación en `src/`, archivos fuente de extensiones,
metadatos de extensiones en `package.json` y `openclaw.plugin.json`, `tsconfig.json`,
`package.json` y `tsdown.config.ts`. Los cambios de metadatos de extensiones reinician el
gateway sin forzar una recompilación de `tsdown`; los cambios de fuente y configuración siguen
reconstruyendo `dist` primero.

Agrega cualquier flag de CLI del gateway después de `gateway:watch` y se pasarán en
cada reinicio. Volver a ejecutar el mismo comando watch para el mismo conjunto de repositorio/flags ahora
reemplaza el observador anterior en lugar de dejar procesos padre duplicados.

## Perfil de desarrollo + gateway de desarrollo (`--dev`)

Usa el perfil de desarrollo para aislar el estado y levantar una configuración segura y desechable para
depuración. Hay **dos** flags `--dev`:

- **`--dev` global (perfil):** aísla el estado en `~/.openclaw-dev` y
  establece por defecto el puerto del gateway en `19001` (los puertos derivados se desplazan con él).
- **`gateway --dev`:** indica al Gateway que cree automáticamente una configuración +
  espacio de trabajo predeterminados cuando falten (y omita `BOOTSTRAP.md`).

Flujo recomendado (perfil de desarrollo + bootstrap de desarrollo):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Si todavía no tienes una instalación global, ejecuta la CLI mediante `pnpm openclaw ...`.

Qué hace esto:

1. **Aislamiento del perfil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas se ajustan en consecuencia)

2. **Bootstrap de desarrollo** (`gateway --dev`)
   - Escribe una configuración mínima si falta (`gateway.mode=local`, bind loopback).
   - Establece `agent.workspace` en el espacio de trabajo de desarrollo.
   - Establece `agent.skipBootstrap=true` (sin `BOOTSTRAP.md`).
   - Inicializa los archivos del espacio de trabajo si faltan:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identidad predeterminada: **C3‑PO** (droide de protocolo).
   - Omite los proveedores de canal en modo de desarrollo (`OPENCLAW_SKIP_CHANNELS=1`).

Flujo de restablecimiento (inicio limpio):

```bash
pnpm gateway:dev:reset
```

Nota: `--dev` es una flag de perfil **global** y algunos ejecutores la consumen.
Si necesitas escribirla explícitamente, usa la forma con variable de entorno:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` borra configuración, credenciales, sesiones y el espacio de trabajo de desarrollo (usando
`trash`, no `rm`), y luego recrea la configuración predeterminada de desarrollo.

Consejo: si ya hay un gateway no de desarrollo ejecutándose (launchd/systemd), deténlo primero:

```bash
openclaw gateway stop
```

## Registro del flujo sin procesar (OpenClaw)

OpenClaw puede registrar el **flujo sin procesar del asistente** antes de cualquier filtrado/formateo.
Esta es la mejor manera de ver si el razonamiento llega como deltas de texto plano
(o como bloques de pensamiento separados).

Habilítalo mediante la CLI:

```bash
pnpm gateway:watch --raw-stream
```

Anulación opcional de ruta:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variables de entorno equivalentes:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Archivo predeterminado:

`~/.openclaw/logs/raw-stream.jsonl`

## Registro de chunks sin procesar (pi-mono)

Para capturar **chunks sin procesar compatibles con OpenAI** antes de que se analicen en bloques,
pi-mono expone un registrador separado:

```bash
PI_RAW_STREAM=1
```

Ruta opcional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Archivo predeterminado:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Nota: esto solo lo emiten los procesos que usan el
> proveedor `openai-completions` de pi-mono.

## Notas de seguridad

- Los registros de flujo sin procesar pueden incluir prompts completos, salida de herramientas y datos del usuario.
- Mantén los registros en local y elimínalos después de depurar.
- Si compartes registros, elimina primero secretos y PII.
