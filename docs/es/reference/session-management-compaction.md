---
read_when:
    - Necesitas depurar los ID de sesión, el JSONL de transcripciones o los campos de sessions.json
    - Estás cambiando el comportamiento de autocompactación o añadiendo tareas de mantenimiento de “pre-Compaction”
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis en profundidad: almacén de sesiones + transcripciones, ciclo de vida e internals de Compaction y autocompactación'
title: Análisis en profundidad de la gestión de sesiones
x-i18n:
    generated_at: "2026-04-25T13:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Esta página explica cómo OpenClaw gestiona las sesiones de extremo a extremo:

- **Enrutamiento de sesiones** (cómo los mensajes entrantes se asignan a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compaction** (Compaction manual + autocompactación) y dónde enganchar trabajo previo a la Compaction
- **Mantenimiento silencioso** (por ejemplo, escrituras de memoria que no deberían producir salida visible para el usuario)

Si primero quieres una visión general de más alto nivel, empieza con:

- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Higiene de transcripciones](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado en torno a un único **proceso Gateway** que es dueño del estado de la sesión.

- Las interfaces de usuario (app de macOS, interfaz de usuario web de Control, TUI) deben consultar al Gateway para obtener listas de sesiones y recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; “comprobar tus archivos locales del Mac” no reflejará lo que está usando el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste las sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o eliminar entradas)
   - Rastrea metadatos de sesión (ID de sesión actual, última actividad, toggles, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción append-only con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de Compaction
   - Se usa para reconstruir el contexto del modelo en turnos futuros

---

## Ubicaciones en disco

Por agente, en el host del Gateway:

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de temas de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resuelve esto mediante `src/config/sessions.ts`.

---

## Mantenimiento del almacén y controles de disco

La persistencia de sesiones tiene controles automáticos de mantenimiento (`session.maintenance`) para `sessions.json` y los artefactos de transcripciones:

- `mode`: `warn` (predeterminado) o `enforce`
- `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- `rotateBytes`: rota `sessions.json` cuando es demasiado grande (predeterminado `10mb`)
- `resetArchiveRetention`: retención para archivos de archivo de transcripción `*.reset.<timestamp>` (predeterminado: igual que `pruneAfter`; `false` desactiva la limpieza)
- `maxDiskBytes`: presupuesto opcional del directorio de sesiones
- `highWaterBytes`: objetivo opcional después de la limpieza (predeterminado `80%` de `maxDiskBytes`)

Orden de aplicación para la limpieza del presupuesto de disco (`mode: "enforce"`):

1. Elimina primero los artefactos de transcripción archivados u huérfanos más antiguos.
2. Si aún está por encima del objetivo, expulsa las entradas de sesión más antiguas y sus archivos de transcripción.
3. Sigue hasta que el uso esté en `highWaterBytes` o por debajo.

En `mode: "warn"`, OpenClaw informa de posibles expulsiones, pero no modifica el almacén ni los archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones de Cron y registros de ejecución

Las ejecuciones aisladas de Cron también crean entradas/transcripciones de sesión, y tienen controles de retención específicos:

- `cron.sessionRetention` (predeterminado `24h`) poda las sesiones antiguas de ejecuciones aisladas de Cron del almacén de sesiones (`false` lo desactiva).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan los archivos `~/.openclaw/cron/runs/<jobId>.jsonl` (predeterminados: `2_000_000` bytes y `2000` líneas).

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión previa `cron:<jobId>` antes de escribir la nueva fila. Conserva preferencias seguras como ajustes de thinking/fast/verbose, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario. Elimina contexto ambiental de conversación como enrutamiento de canal/grupo, política de envío o cola, elevación, origen y vínculo de tiempo de ejecución de ACP, para que una nueva ejecución aislada no pueda heredar autoridad obsoleta de entrega o tiempo de ejecución de una ejecución anterior.

---

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica _en qué contenedor de conversación_ estás (enrutamiento + aislamiento).

Patrones habituales:

- Chat principal/directo (por agente): `agent:<agentId>:<mainKey>` (predeterminado `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que se sobrescriba)

Las reglas canónicas están documentadas en [/concepts/session](/es/concepts/session).

---

## ID de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcripción que continúa la conversación).

Reglas generales:

- **Reset** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Reset diario** (predeterminado a las 4:00 a. m., hora local en el host del Gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de reset.
- **Caducidad por inactividad** (`session.reset.idleMinutes` o el heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando se configuran tanto diario como inactividad, prevalece el que expire primero.
- **Protección de bifurcación del padre del hilo** (`session.parentForkMaxTokens`, predeterminado `100000`) omite la bifurcación de la transcripción padre cuando la sesión padre ya es demasiado grande; el nuevo hilo empieza desde cero. Establece `0` para desactivarlo.

Detalle de implementación: la decisión se toma en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivo):

- `sessionId`: ID actual de la transcripción (el nombre del archivo se deriva de esto salvo que se establezca `sessionFile`)
- `updatedAt`: marca temporal de la última actividad
- `sessionFile`: override opcional explícito de la ruta de la transcripción
- `chatType`: `direct | group | room` (ayuda a las interfaces y a la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetado de grupos/canales
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (best-effort / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: con qué frecuencia se completó la autocompactación para esta clave de sesión
- `memoryFlushAt`: marca temporal del último vaciado de memoria previo a la Compaction
- `memoryFlushCompactionCount`: recuento de Compaction cuando se ejecutó el último vaciado

El almacén es seguro de editar, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas a medida que se ejecutan las sesiones.

---

## Estructura de la transcripción (`*.jsonl`)

Las transcripciones son gestionadas por el `SessionManager` de `@mariozechner/pi-coding-agent`.

El archivo es JSONL:

- Primera línea: cabecera de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Después: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacados:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por extensiones que _sí_ entran en el contexto del modelo (pueden ocultarse en la interfaz)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionalmente **no** “corrige” las transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos distintos:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas acumuladas escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto proviene del catálogo de modelos (y puede sobrescribirse mediante configuración).
- `contextTokens` en el almacén es un valor estimado/de informes en tiempo de ejecución; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

Compaction resume la conversación anterior en una entrada persistida `compaction` en la transcripción y mantiene intactos los mensajes recientes.

Después de la Compaction, los turnos futuros ven:

- El resumen de Compaction
- Los mensajes posteriores a `firstKeptEntryId`

La Compaction es **persistente** (a diferencia de la poda de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de Compaction y emparejamiento de herramientas

Cuando OpenClaw divide una transcripción larga en fragmentos de Compaction, mantiene emparejadas las llamadas a herramientas del asistente con sus entradas `toolResult` correspondientes.

- Si la división por proporción de tokens cae entre una llamada a herramienta y su resultado, OpenClaw desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar el par.
- Si un bloque final de resultado de herramienta haría que el fragmento supere el objetivo, OpenClaw conserva ese bloque de herramienta pendiente y mantiene intacta la cola no resumida.
- Los bloques de llamada a herramientas abortados/con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre la autocompactación (tiempo de ejecución de Pi)

En el agente Pi integrado, la autocompactación se activa en dos casos:

1. **Recuperación por desbordamiento**: el modelo devuelve un error de desbordamiento de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` y variantes similares con forma de proveedor) → compactar → reintentar.
2. **Mantenimiento por umbral**: después de un turno satisfactorio, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para prompts + la siguiente salida del modelo

Estas son semánticas del tiempo de ejecución de Pi (OpenClaw consume los eventos, pero Pi decide cuándo compactar).

---

## Ajustes de Compaction (`reserveTokens`, `keepRecentTokens`)

Los ajustes de Compaction de Pi se encuentran en la configuración de Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw también aplica un límite mínimo de seguridad para ejecuciones integradas:

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo incrementa.
- El límite mínimo predeterminado es `20000` tokens.
- Establece `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el límite mínimo.
- Si ya es mayor, OpenClaw lo deja como está.
- `/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens` explícito y conserva el punto de corte de la cola reciente de Pi. Sin un presupuesto explícito de conservación, la Compaction manual sigue siendo un punto de control estricto y el contexto reconstruido comienza desde el nuevo resumen.

Por qué: dejar suficiente margen para “mantenimiento” de varios turnos (como escrituras de memoria) antes de que la Compaction se vuelva inevitable.

Implementación: `ensurePiCompactionReserveTokens()` en `src/agents/pi-settings.ts`
(llamado desde `src/agents/pi-embedded-runner.ts`).

---

## Proveedores de Compaction conectables

Los plugins pueden registrar un proveedor de Compaction mediante `registerCompactionProvider()` en la API del plugin. Cuando `agents.defaults.compaction.provider` se establece en un ID de proveedor registrado, la extensión de protección delega el resumen a ese proveedor en lugar de la canalización integrada `summarizeInStages`.

- `provider`: ID de un plugin de proveedor de Compaction registrado. Déjalo sin establecer para usar el resumen LLM predeterminado.
- Establecer un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada.
- El safeguard sigue preservando el contexto del sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen safeguard integrado vuelve a destilar resúmenes anteriores con mensajes nuevos en lugar de preservar literalmente el resumen previo completo.
- El modo safeguard habilita auditorías de calidad de resúmenes de forma predeterminada; establece `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida malformada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen LLM integrado.
- Las señales de aborto/timeout se relanzan (no se absorben) para respetar la cancelación del llamador.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superficies visibles para el usuario

Puedes observar la Compaction y el estado de la sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de Compaction

---

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos “silenciosos” para tareas en segundo plano en las que el usuario no debería ver salida intermedia.

Convención:

- El asistente comienza su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar “no entregar una respuesta al usuario”.
- OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión del token silencioso exacto no distingue mayúsculas de minúsculas, por lo que `NO_REPLY` y
  `no_reply` cuentan cuando todo el payload es solo el token silencioso.
- Esto es solo para turnos realmente en segundo plano/sin entrega; no es un atajo para
  solicitudes de usuario ordinarias que requieren acción.

Desde `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial comienza con `NO_REPLY`, para que las operaciones silenciosas no filtren salida parcial a mitad del turno.

---

## "Vaciado de memoria" previo a la Compaction (implementado)

Objetivo: antes de que ocurra la autocompactación, ejecutar un turno agéntico silencioso que escriba estado duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la Compaction no pueda borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado antes del umbral**:

1. Supervisar el uso de contexto de la sesión.
2. Cuando cruce un “umbral suave” (por debajo del umbral de Compaction de Pi), ejecutar una directiva silenciosa de “escribir memoria ahora” para el agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje del usuario para el turno de vaciado)
- `systemPrompt` (prompt adicional del sistema añadido para el turno de vaciado)

Notas:

- El prompt/system prompt predeterminado incluye una indicación `NO_REPLY` para suprimir
  la entrega.
- El vaciado se ejecuta una vez por ciclo de Compaction (rastreado en `sessions.json`).
- El vaciado solo se ejecuta para sesiones integradas de Pi (los backends de CLI lo omiten).
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver la disposición de archivos del espacio de trabajo y los patrones de escritura.

Pi también expone un hook `session_before_compact` en la API de extensiones, pero la lógica de vaciado de OpenClaw vive hoy del lado del Gateway.

---

## Lista de comprobación para solución de problemas

- ¿Clave de sesión incorrecta? Empieza con [/concepts/session](/es/concepts/session) y confirma la `sessionKey` en `/status`.
- ¿Desajuste entre almacén y transcripción? Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- ¿Exceso de Compaction? Comprueba:
  - ventana de contexto del modelo (demasiado pequeña)
  - ajustes de Compaction (`reserveTokens` demasiado alto para la ventana del modelo puede causar una Compaction más temprana)
  - exceso de resultados de herramientas: habilita/ajusta la poda de sesiones
- ¿Se filtran turnos silenciosos? Confirma que la respuesta comienza con `NO_REPLY` (token exacto sin distinción entre mayúsculas y minúsculas) y que estás en una compilación que incluye la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
