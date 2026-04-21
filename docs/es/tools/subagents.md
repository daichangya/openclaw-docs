---
read_when:
    - Quieres trabajo en segundo plano/en paralelo mediante el agente
    - Estás cambiando la política de la herramienta `sessions_spawn` o de subagentes
    - Estás implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
summary: 'Subagentes: ejecución de agentes aislados que anuncian los resultados de vuelta al chat del solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-21T19:20:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# Subagentes

Los subagentes son ejecuciones de agentes en segundo plano generadas desde una ejecución de agente existente. Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y, cuando terminan, **anuncian** su resultado de vuelta al canal de chat del solicitante. Cada ejecución de subagente se rastrea como una [tarea en segundo plano](/es/automation/tasks).

## Comando de barra

Usa `/subagents` para inspeccionar o controlar las ejecuciones de subagentes de la **sesión actual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de vinculación a hilo:

Estos comandos funcionan en canales que admiten vinculaciones persistentes a hilos. Consulta **Canales compatibles con hilos** más abajo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` muestra metadatos de la ejecución (estado, marcas de tiempo, id de sesión, ruta de la transcripción, limpieza).
Usa `sessions_history` para una vista de recuperación acotada y filtrada por seguridad; inspecciona la ruta de la transcripción en disco cuando necesites la transcripción completa en bruto.

### Comportamiento de creación

`/subagents spawn` inicia un subagente en segundo plano como un comando de usuario, no como un relé interno, y envía una única actualización final de finalización de vuelta al chat del solicitante cuando la ejecución termina.

- El comando de creación no bloquea; devuelve un id de ejecución de inmediato.
- Al completarse, el subagente anuncia un mensaje de resumen/resultado de vuelta al canal de chat del solicitante.
- La entrega de finalización es basada en push. Una vez creado, no hagas sondeos en bucle de `/subagents list`, `sessions_list` o `sessions_history` solo para esperar a que termine; inspecciona el estado solo bajo demanda para depuración o intervención.
- Al completarse, OpenClaw cierra en el mejor de los casos las pestañas/procesos del navegador rastreados que haya abierto esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.
- Para creaciones manuales, la entrega es resiliente:
  - OpenClaw intenta primero la entrega directa de `agent` con una clave de idempotencia estable.
  - Si la entrega directa falla, recurre al enrutamiento por cola.
  - Si el enrutamiento por cola sigue sin estar disponible, el anuncio se reintenta con un breve retroceso exponencial antes de desistir definitivamente.
- La entrega de finalización mantiene la ruta resuelta del solicitante:
  - las rutas de finalización vinculadas a hilo o a conversación tienen prioridad cuando están disponibles
  - si el origen de la finalización solo proporciona un canal, OpenClaw completa el destino/la cuenta faltantes a partir de la ruta resuelta de la sesión del solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando
- La transferencia de finalización a la sesión del solicitante es contexto interno generado en tiempo de ejecución (no texto escrito por el usuario) e incluye:
  - `Result` (el texto más reciente visible de la respuesta `assistant`, o bien el texto más reciente saneado de tool/toolResult; las ejecuciones fallidas terminales no reutilizan el texto de respuesta capturado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estadísticas compactas de runtime/tokens
  - una instrucción de entrega que le indica al agente solicitante que reescriba en voz normal de asistente (sin reenviar metadatos internos en bruto)
- `--model` y `--thinking` reemplazan los valores predeterminados para esa ejecución específica.
- Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
- `/subagents spawn` es modo de un solo uso (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
- Para sesiones del arnés ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` y consulta [Agentes ACP](/es/tools/acp-agents).

Objetivos principales:

- Paralelizar trabajo de "investigación / tarea larga / herramienta lenta" sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesiones + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar mal: los subagentes **no** reciben herramientas de sesión de forma predeterminada.
- Admitir profundidad de anidación configurable para patrones de orquestación.

Nota de costo: cada subagente tiene su **propio** contexto y uso de tokens. Para tareas pesadas o repetitivas, establece un modelo más barato para los subagentes y mantén tu agente principal en un modelo de mayor calidad.
Puedes configurarlo mediante `agents.defaults.subagents.model` o con reemplazos por agente.

## Herramienta

Usa `sessions_spawn`:

- Inicia una ejecución de subagente (`deliver: false`, carril global: `subagent`)
- Luego ejecuta un paso de anuncio y publica la respuesta del anuncio en el canal de chat del solicitante
- Modelo predeterminado: hereda del llamador, a menos que establezcas `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente); un `sessions_spawn.model` explícito sigue teniendo prioridad.
- Pensamiento predeterminado: hereda del llamador, a menos que establezcas `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente); un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- Tiempo de espera predeterminado de la ejecución: si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando esté establecido; en caso contrario, recurre a `0` (sin tiempo de espera).

Parámetros de la herramienta:

- `task` (obligatorio)
- `label?` (opcional)
- `agentId?` (opcional; crear bajo otro id de agente si está permitido)
- `model?` (opcional; reemplaza el modelo del subagente; los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado con una advertencia en el resultado de la herramienta)
- `thinking?` (opcional; reemplaza el nivel de pensamiento para la ejecución del subagente)
- `runTimeoutSeconds?` (usa como valor predeterminado `agents.defaults.subagents.runTimeoutSeconds` cuando esté establecido; en caso contrario `0`; cuando se establece, la ejecución del subagente se aborta después de N segundos)
- `thread?` (predeterminado `false`; cuando es `true`, solicita vinculación del hilo del canal para esta sesión de subagente)
- `mode?` (`run|session`)
  - el valor predeterminado es `run`
  - si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`
  - `mode: "session"` requiere `thread: true`
- `cleanup?` (`delete|keep`, predeterminado `keep`)
- `sandbox?` (`inherit|require`, predeterminado `inherit`; `require` rechaza la creación a menos que el runtime hijo de destino esté en sandbox)
- `sessions_spawn` **no** acepta parámetros de entrega por canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para la entrega, usa `message`/`sessions_send` desde la ejecución generada.

## Sesiones vinculadas a hilos

Cuando las vinculaciones a hilos están habilitadas para un canal, un subagente puede permanecer vinculado a un hilo para que los mensajes posteriores del usuario en ese hilo sigan enroutándose a la misma sesión de subagente.

### Canales compatibles con hilos

- Discord (actualmente el único canal compatible): admite sesiones persistentes de subagentes vinculadas a hilos (`sessions_spawn` con `thread: true`), controles manuales de hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), y las claves del adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, y `channels.discord.threadBindings.spawnSubagentSessions`.

Flujo rápido:

1. Crea con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"`).
2. OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
3. Las respuestas y mensajes de seguimiento en ese hilo se enrutan a la sesión vinculada.
4. Usa `/session idle` para inspeccionar/actualizar el desenfoque automático por inactividad y `/session max-age` para controlar el límite máximo estricto.
5. Usa `/unfocus` para desvincular manualmente.

Controles manuales:

- `/focus <target>` vincula el hilo actual (o crea uno) a un destino de subagente/sesión.
- `/unfocus` elimina la vinculación del hilo actualmente vinculado.
- `/agents` lista las ejecuciones activas y el estado de vinculación (`thread:<id>` o `unbound`).
- `/session idle` y `/session max-age` solo funcionan para hilos vinculados enfocados.

Interruptores de configuración:

- Predeterminado global: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Los reemplazos por canal y las claves de vinculación automática al crear son específicos del adaptador. Consulta **Canales compatibles con hilos** más arriba.

Consulta [Referencia de configuración](/es/gateway/configuration-reference) y [Comandos de barra](/es/tools/slash-commands) para conocer los detalles actuales del adaptador.

Lista de permitidos:

- `agents.list[].subagents.allowAgents`: lista de ids de agentes a los que se puede apuntar mediante `agentId` (`["*"]` para permitir cualquiera). Predeterminado: solo el agente solicitante.
- `agents.defaults.subagents.allowAgents`: lista de permitidos predeterminada de agentes de destino usada cuando el agente solicitante no establece su propio `subagents.allowAgents`.
- Protección de herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos que se ejecutarían sin sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: cuando es true, bloquea las llamadas a `sessions_spawn` que omiten `agentId` (fuerza la selección explícita de perfil). Predeterminado: false.

Descubrimiento:

- Usa `agents_list` para ver qué ids de agentes están actualmente permitidos para `sessions_spawn`.

Archivado automático:

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (predeterminado: 60).
- El archivado usa `sessions.delete` y renombra la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante cambio de nombre).
- El archivado automático es en el mejor de los casos; los temporizadores pendientes se pierden si el Gateway se reinicia.
- `runTimeoutSeconds` **no** archiva automáticamente; solo detiene la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza por archivado: las pestañas/procesos del navegador rastreados se cierran en el mejor de los casos cuando la ejecución termina, aunque se conserve el registro de la sesión/transcripción.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden crear sus propios subagentes (`maxSpawnDepth: 1`). Puedes habilitar un nivel de anidación estableciendo `maxSpawnDepth: 2`, lo que permite el **patrón de orquestación**: principal → subagente orquestador → sub-subagentes trabajadores.

### Cómo habilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes creen hijos (predeterminado: 1)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (predeterminado: 5)
        maxConcurrent: 8, // límite global de concurrencia del carril (predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn cuando se omite (0 = sin tiempo de espera)
      },
    },
  },
}
```

### Niveles de profundidad

| Depth | Forma de la clave de sesión                  | Rol                                           | ¿Puede crear?               |
| ----- | -------------------------------------------- | --------------------------------------------- | --------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                              | Siempre                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagente (trabajador hoja)               | Nunca                       |

### Cadena de anuncios

Los resultados fluyen de vuelta hacia arriba en la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1)
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza resultados, termina → anuncia al principal
3. El agente principal recibe el anuncio y lo entrega al usuario

Cada nivel solo ve los anuncios de sus hijos directos.

Guía operativa:

- Inicia el trabajo hijo una vez y espera a los eventos de finalización en lugar de construir bucles de sondeo alrededor de `sessions_list`, `sessions_history`, `/subagents list` o comandos `exec` de espera.
- Si llega un evento de finalización hijo después de que ya enviaste la respuesta final, la continuación correcta es el token silencioso exacto `NO_REPLY` / `no_reply`.

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de la sesión en el momento de la creación. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestación.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`)**: Recibe `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gestionar a sus hijos. Las demás herramientas de sesión/sistema siguen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`)**: Sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja)**: Sin herramientas de sesión — `sessions_spawn` siempre está denegado en profundidad 2. No puede crear más hijos.

### Límite de creación por agente

Cada sesión de agente (en cualquier profundidad) puede tener como máximo `maxChildrenPerAgent` (predeterminado: 5) hijos activos al mismo tiempo. Esto evita una expansión descontrolada desde un solo orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente a todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene a todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga.

## Autenticación

La autenticación de subagentes se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **respaldo**; los perfiles del agente reemplazan a los perfiles principales en caso de conflicto.

Nota: la fusión es aditiva, así que los perfiles principales siempre están disponibles como respaldo. La autenticación totalmente aislada por agente aún no es compatible.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida del anuncio se suprime aunque haya habido progreso visible anterior.
- En caso contrario, la entrega depende de la profundidad del solicitante:
  - las sesiones solicitantes de nivel superior usan una llamada de seguimiento a `agent` con entrega externa (`deliver=true`)
  - las sesiones solicitantes de subagentes anidados reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar los resultados hijos dentro de la sesión
  - si una sesión solicitante de subagente anidado ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible
- Para las sesiones solicitantes de nivel superior, la entrega directa en modo de finalización primero resuelve cualquier ruta vinculada de conversación/hilo y la anulación del hook, luego completa los campos faltantes del destino del canal a partir de la ruta almacenada de la sesión solicitante. Eso mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización solo identifica el canal.
- La agregación de finalización hija se limita a la ejecución solicitante actual al construir los hallazgos de finalización anidada, lo que evita que salidas hijas obsoletas de ejecuciones anteriores se filtren al anuncio actual.
- Las respuestas de anuncio conservan el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.
- El contexto del anuncio se normaliza a un bloque estable de evento interno:
  - origen (`subagent` o `cron`)
  - clave/id de sesión hija
  - tipo de anuncio + etiqueta de tarea
  - línea de estado derivada del resultado del runtime (`success`, `error`, `timeout`, o `unknown`)
  - contenido del resultado seleccionado a partir del último texto visible del asistente, o en su defecto del texto saneado más reciente de tool/toolResult; las ejecuciones fallidas terminales informan el estado de error sin reproducir el texto de respuesta capturado
  - una instrucción de seguimiento que describe cuándo responder frente a cuándo permanecer en silencio
- `Status` no se infiere de la salida del modelo; proviene de señales del resultado del runtime.
- En caso de tiempo de espera, si el hijo solo llegó a realizar llamadas a herramientas, el anuncio puede contraer ese historial en un breve resumen de progreso parcial en lugar de reproducir la salida bruta de las herramientas.

Las cargas útiles del anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltas):

- Runtime (por ejemplo, `runtime 5m12s`)
- Uso de tokens (entrada/salida/total)
- Costo estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` y la ruta de la transcripción (para que el agente principal pueda recuperar el historial mediante `sessions_history` o inspeccionar el archivo en disco)
- Los metadatos internos están pensados solo para orquestación; las respuestas orientadas al usuario deben reescribirse con voz normal de asistente.

`sessions_history` es la ruta de orquestación más segura:

- la recuperación del asistente se normaliza primero:
  - se eliminan las etiquetas de pensamiento
  - se eliminan los bloques de andamiaje `<relevant-memories>` / `<relevant_memories>`
  - se eliminan los bloques de carga útil XML de llamadas a herramientas en texto plano como `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y `<function_calls>...</function_calls>`, incluidas las cargas truncadas que nunca se cierran correctamente
  - se eliminan el andamiaje degradado de llamadas/resultados de herramientas y los marcadores de contexto histórico
  - se eliminan los tokens de control del modelo filtrados, como `<|assistant|>`, otros tokens ASCII `<|...|>`, y las variantes de ancho completo `<｜...｜>`
  - se elimina el XML malformado de llamadas a herramientas de MiniMax
- se redacta el texto similar a credenciales/tokens
- los bloques largos pueden truncarse
- los historiales muy grandes pueden omitir filas antiguas o reemplazar una fila sobredimensionada por `[sessions_history omitted: message too large]`
- la inspección de la transcripción bruta en disco es la alternativa cuando necesitas la transcripción completa byte por byte

## Política de herramientas (herramientas de subagentes)

De forma predeterminada, los subagentes reciben **todas las herramientas excepto las herramientas de sesión** y las herramientas de sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` aquí también sigue siendo una vista de recuperación acotada y saneada; no es un volcado bruto de la transcripción.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para poder gestionar a sus hijos.

Anulación mediante configuración:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny gana
        deny: ["gateway", "cron"],
        // si se establece allow, pasa a ser solo allow (deny sigue ganando)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrencia

Los subagentes usan un carril de cola dedicado dentro del proceso:

- Nombre del carril: `subagent`
- Concurrencia: `agents.defaults.subagents.maxConcurrent` (predeterminado `8`)

## Detención

- Enviar `/stop` en el chat del solicitante aborta la sesión del solicitante y detiene cualquier ejecución activa de subagente creada desde ella, propagándose a hijos anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.

## Limitaciones

- El anuncio de subagente es **en el mejor de los casos**. Si el Gateway se reinicia, se pierde el trabajo pendiente de "anunciar de vuelta".
- Los subagentes siguen compartiendo los mismos recursos del proceso Gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` de inmediato.
- El contexto del subagente solo inyecta `AGENTS.md` + `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidación es 5 (rango de `maxSpawnDepth`: 1–5). Se recomienda profundidad 2 para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (predeterminado: 5, rango: 1–20).
