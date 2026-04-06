---
read_when:
    - Necesitas depurar ids de sesión, JSONL de transcripts o campos de sessions.json
    - Estás cambiando el comportamiento de compactación automática o agregando tareas de mantenimiento “previas a la compactación”
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis en profundidad: almacén de sesiones + transcripts, ciclo de vida e internals de compactación (automática)'
title: Análisis en profundidad de la gestión de sesiones
x-i18n:
    generated_at: "2026-04-06T03:11:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0d8c2d30be773eac0424f7a4419ab055fdd50daac8bc654e7d250c891f2c3b8
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gestión de sesiones y compactación (análisis en profundidad)

Este documento explica cómo OpenClaw gestiona las sesiones de extremo a extremo:

- **Enrutamiento de sesiones** (cómo los mensajes entrantes se asignan a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripts** (`*.jsonl`) y su estructura
- **Higiene del transcript** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compactación** (compactación manual + automática) y dónde enganchar trabajo previo a la compactación
- **Mantenimiento silencioso** (por ejemplo, escrituras de memoria que no deberían producir salida visible para el usuario)

Si primero quieres una visión más general, empieza con:

- [/concepts/session](/es/concepts/session)
- [/concepts/compaction](/es/concepts/compaction)
- [/concepts/memory](/es/concepts/memory)
- [/concepts/memory-search](/es/concepts/memory-search)
- [/concepts/session-pruning](/es/concepts/session-pruning)
- [/reference/transcript-hygiene](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado en torno a un único **proceso Gateway** que es propietario del estado de las sesiones.

- Las UIs (app de macOS, web Control UI, TUI) deben consultar al Gateway para obtener listas de sesiones y recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; “comprobar tus archivos locales del Mac” no reflejará lo que usa el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste las sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable y seguro de editar (o eliminar entradas)
   - Rastrea metadatos de la sesión (id de sesión actual, última actividad, toggles, contadores de tokens, etc.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Transcript append-only con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de compactación
   - Se usa para reconstruir el contexto del modelo para turnos futuros

---

## Ubicaciones en disco

Por agente, en el host del Gateway:

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de temas de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resuelve estas rutas mediante `src/config/sessions.ts`.

---

## Mantenimiento del almacén y controles de disco

La persistencia de sesiones tiene controles automáticos de mantenimiento (`session.maintenance`) para `sessions.json` y los artefactos de transcript:

- `mode`: `warn` (predeterminado) o `enforce`
- `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- `rotateBytes`: rota `sessions.json` cuando es demasiado grande (predeterminado `10mb`)
- `resetArchiveRetention`: retención para archivos de archivo `*.reset.<timestamp>` del transcript (predeterminado: igual que `pruneAfter`; `false` desactiva la limpieza)
- `maxDiskBytes`: presupuesto opcional del directorio de sesiones
- `highWaterBytes`: objetivo opcional después de la limpieza (predeterminado `80%` de `maxDiskBytes`)

Orden de aplicación para la limpieza por presupuesto de disco (`mode: "enforce"`):

1. Eliminar primero los artefactos de transcript archivados u huérfanos más antiguos.
2. Si aún está por encima del objetivo, expulsar las entradas de sesión más antiguas y sus archivos de transcript.
3. Seguir hasta que el uso esté en o por debajo de `highWaterBytes`.

En `mode: "warn"`, OpenClaw informa de posibles expulsiones, pero no modifica el almacén/los archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones cron y registros de ejecución

Las ejecuciones cron aisladas también crean entradas/transcripts de sesión, y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) elimina sesiones antiguas de ejecuciones cron aisladas del almacén de sesiones (`false` lo desactiva).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan archivos `~/.openclaw/cron/runs/<jobId>.jsonl` (predeterminados: `2_000_000` bytes y `2000` líneas).

---

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica _en qué contenedor de conversación_ estás (enrutamiento + aislamiento).

Patrones comunes:

- Chat principal/directo (por agente): `agent:<agentId>:<mainKey>` (predeterminado `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que se anule)

Las reglas canónicas están documentadas en [/concepts/session](/es/concepts/session).

---

## Ids de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcript que continúa la conversación).

Reglas generales:

- **Reset** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Reset diario** (predeterminado a las 4:00 AM hora local en el host del gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de reinicio.
- **Expiración por inactividad** (`session.reset.idleMinutes` o el heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando se configuran tanto diario como inactividad, gana el que expire primero.
- **Protección de bifurcación del padre del hilo** (`session.parentForkMaxTokens`, predeterminado `100000`) omite la bifurcación del transcript padre cuando la sesión padre ya es demasiado grande; el nuevo hilo empieza desde cero. Establece `0` para desactivarlo.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivos):

- `sessionId`: id actual del transcript (el nombre de archivo deriva de esto salvo que se establezca `sessionFile`)
- `updatedAt`: marca de tiempo de la última actividad
- `sessionFile`: anulación opcional explícita de ruta del transcript
- `chatType`: `direct | group | room` (ayuda a las UIs y a la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetado de grupos/canales
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (anulación por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (best-effort / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó la compactación automática para esta clave de sesión
- `memoryFlushAt`: marca de tiempo del último vaciado de memoria previo a la compactación
- `memoryFlushCompactionCount`: recuento de compactación cuando se ejecutó el último vaciado

El almacén es seguro de editar, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas a medida que se ejecutan las sesiones.

---

## Estructura del transcript (`*.jsonl`)

Los transcripts son gestionados por `@mariozechner/pi-coding-agent` mediante `SessionManager`.

El archivo es JSONL:

- Primera línea: encabezado de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Después: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacados:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por extensiones que _sí_ entran en el contexto del modelo (pueden ocultarse en la UI)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen persistido de compactación con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionalmente **no** “arregla” transcripts; el Gateway usa `SessionManager` para leerlos/escribirlos.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos distintos:

1. **Ventana de contexto del modelo**: límite duro por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas acumuladas escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto proviene del catálogo de modelos (y puede anularse mediante configuración).
- `contextTokens` en el almacén es un valor de estimación/informe en tiempo de ejecución; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compactación: qué es

La compactación resume la conversación anterior en una entrada persistida `compaction` dentro del transcript y mantiene intactos los mensajes recientes.

Después de la compactación, los turnos futuros ven:

- El resumen de compactación
- Los mensajes posteriores a `firstKeptEntryId`

La compactación es **persistente** (a diferencia de la poda de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de compactación y emparejamiento de herramientas

Cuando OpenClaw divide un transcript largo en fragmentos de compactación, mantiene emparejadas
las llamadas a herramientas del asistente con sus entradas `toolResult` correspondientes.

- Si la división por proporción de tokens cae entre una llamada a herramienta y su resultado, OpenClaw
  desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar
  la pareja.
- Si un bloque final de resultado de herramienta empujaría el fragmento por encima del objetivo,
  OpenClaw preserva ese bloque de herramienta pendiente y mantiene intacta la cola
  no resumida.
- Los bloques de llamada a herramienta abortados/con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre la compactación automática (runtime de Pi)

En el agente Pi embebido, la compactación automática se activa en dos casos:

1. **Recuperación por overflow**: el modelo devuelve un error de desbordamiento de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` y variantes similares con forma de proveedor) → compactar → reintentar.
2. **Mantenimiento por umbral**: después de un turno exitoso, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para prompts + la siguiente salida del modelo

Estas son semánticas del runtime de Pi (OpenClaw consume los eventos, pero Pi decide cuándo compactar).

---

## Ajustes de compactación (`reserveTokens`, `keepRecentTokens`)

Los ajustes de compactación de Pi viven en la configuración de Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw también impone un mínimo de seguridad para ejecuciones embebidas:

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo eleva.
- El mínimo predeterminado es `20000` tokens.
- Establece `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el mínimo.
- Si ya es mayor, OpenClaw lo deja como está.

Por qué: dejar suficiente margen para “tareas de mantenimiento” de varios turnos (como escrituras de memoria) antes de que la compactación se vuelva inevitable.

Implementación: `ensurePiCompactionReserveTokens()` en `src/agents/pi-settings.ts`
(llamado desde `src/agents/pi-embedded-runner.ts`).

---

## Superficies visibles para el usuario

Puedes observar la compactación y el estado de la sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de compactación

---

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos “silenciosos” para tareas en segundo plano en las que el usuario no debería ver salida intermedia.

Convención:

- El asistente empieza su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar “no entregar una respuesta al usuario”.
- OpenClaw elimina/suprime esto en la capa de entrega.
- La supresión exacta del token silencioso no distingue mayúsculas de minúsculas, así que `NO_REPLY` y
  `no_reply` cuentan ambos cuando toda la carga es solo el token silencioso.
- Esto es solo para turnos realmente en segundo plano/sin entrega; no es un atajo para
  solicitudes normales del usuario que requieren acción.

Desde `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial comienza con `NO_REPLY`, para que las operaciones silenciosas no filtren salida parcial a mitad del turno.

---

## “Vaciado de memoria” previo a la compactación (implementado)

Objetivo: antes de que ocurra la compactación automática, ejecutar un turno agéntico silencioso que escriba
estado duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la compactación no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado previo al umbral**:

1. Supervisar el uso del contexto de la sesión.
2. Cuando cruza un “umbral suave” (por debajo del umbral de compactación de Pi), ejecutar una directiva silenciosa
   de “escribir memoria ahora” al agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
   nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje de usuario para el turno de vaciado)
- `systemPrompt` (prompt adicional del sistema agregado para el turno de vaciado)

Notas:

- El prompt/system prompt predeterminados incluyen una indicación `NO_REPLY` para suprimir
  la entrega.
- El vaciado se ejecuta una vez por ciclo de compactación (rastreado en `sessions.json`).
- El vaciado solo se ejecuta para sesiones Pi embebidas.
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver la distribución de archivos del espacio de trabajo y los patrones de escritura.

Pi también expone un hook `session_before_compact` en la API de extensiones, pero la lógica de
vaciado de OpenClaw vive hoy en el lado del Gateway.

---

## Lista de comprobación para resolución de problemas

- ¿Clave de sesión incorrecta? Empieza con [/concepts/session](/es/concepts/session) y confirma la `sessionKey` en `/status`.
- ¿Desajuste entre almacén y transcript? Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- ¿Compactación excesiva? Comprueba:
  - ventana de contexto del modelo (demasiado pequeña)
  - ajustes de compactación (`reserveTokens` demasiado alto para la ventana del modelo puede provocar una compactación más temprana)
  - exceso de `tool-result`: habilita/ajusta la poda de sesiones
- ¿Se filtran turnos silenciosos? Confirma que la respuesta empieza con `NO_REPLY` (token exacto sin distinguir mayúsculas/minúsculas) y que estás en una build que incluye la corrección de supresión de streaming.
