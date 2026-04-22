---
read_when:
    - Quieres trabajo en segundo plano/paralelo mediante el agente
    - Estás cambiando `sessions_spawn` o la política de herramientas de subagentes
    - Estás implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
summary: 'Subagentes: generar ejecuciones aisladas de agentes que anuncian los resultados de vuelta al chat solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-22T04:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Subagentes

Los subagentes son ejecuciones de agentes en segundo plano generadas desde una ejecución existente de un agente. Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y, cuando terminan, **anuncian** su resultado de vuelta al canal de chat del solicitante. Cada ejecución de subagente se registra como una [tarea en segundo plano](/es/automation/tasks).

## Comando slash

Usa `/subagents` para inspeccionar o controlar ejecuciones de subagentes para la **sesión actual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de enlace de hilos:

Estos comandos funcionan en canales que admiten enlaces persistentes de hilos. Consulta **Canales compatibles con hilos** abajo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` muestra metadatos de la ejecución (estado, marcas de tiempo, id de sesión, ruta de transcripción, limpieza).
Usa `sessions_history` para una vista acotada y filtrada por seguridad del historial; inspecciona la
ruta de la transcripción en disco cuando necesites la transcripción completa sin procesar.

### Comportamiento de generación

`/subagents spawn` inicia un subagente en segundo plano como un comando de usuario, no como un relay interno, y envía una actualización final de finalización de vuelta al chat solicitante cuando termina la ejecución.

- El comando spawn no bloquea; devuelve inmediatamente un id de ejecución.
- Al completarse, el subagente anuncia un mensaje de resumen/resultado de vuelta al canal de chat del solicitante.
- La entrega de finalización está basada en push. Una vez generado, no hagas polling en bucle de `/subagents list`,
  `sessions_list` ni `sessions_history` solo para esperar a que termine;
  inspecciona el estado solo bajo demanda para depuración o intervención.
- Al completarse, OpenClaw intenta en el mejor esfuerzo cerrar pestañas/procesos de navegador rastreados abiertos por esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.
- Para generaciones manuales, la entrega es resiliente:
  - OpenClaw primero intenta entrega directa `agent` con una clave de idempotencia estable.
  - Si la entrega directa falla, recurre al enrutamiento por cola.
  - Si el enrutamiento por cola sigue sin estar disponible, el anuncio se reintenta con un backoff exponencial corto antes del abandono final.
- La entrega de finalización conserva la ruta resuelta del solicitante:
  - las rutas de finalización vinculadas a hilos o conversaciones tienen prioridad cuando están disponibles
  - si el origen de la finalización solo proporciona un canal, OpenClaw rellena el target/account faltante a partir de la ruta resuelta de la sesión del solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando
- La transferencia de finalización a la sesión del solicitante es contexto interno generado en tiempo de ejecución (no texto escrito por el usuario) e incluye:
  - `Result` (el texto visible más reciente de respuesta `assistant`, o en su defecto el texto saneado más reciente de `tool`/`toolResult`; las ejecuciones fallidas terminales no reutilizan texto de respuesta capturado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estadísticas compactas de tiempo de ejecución/tokens
  - una instrucción de entrega que indica al agente solicitante que reescriba en voz normal de asistente (no que reenvíe metadatos internos sin procesar)
- `--model` y `--thinking` sobrescriben los valores predeterminados para esa ejecución específica.
- Usa `info`/`log` para inspeccionar detalles y salida después de la finalización.
- `/subagents spawn` es modo de una sola ejecución (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
- Para sesiones de arnés ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` y consulta [Agentes ACP](/es/tools/acp-agents), especialmente el [modelo de entrega ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles agente a agente.

Objetivos principales:

- Paralelizar trabajo de “investigación / tarea larga / herramienta lenta” sin bloquear la ejecución principal.
- Mantener los subagentes aislados por defecto (separación de sesión + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar mal: los subagentes **no** obtienen herramientas de sesión por defecto.
- Admitir profundidad de anidamiento configurable para patrones de orquestación.

Nota de coste: cada subagente tiene su **propio** contexto y uso de tokens. Para tareas pesadas o repetitivas,
configura un modelo más barato para subagentes y mantén tu agente principal en un modelo de mayor calidad.
Puedes configurarlo mediante `agents.defaults.subagents.model` o sobrescrituras por agente.

## Herramienta

Usa `sessions_spawn`:

- Inicia una ejecución de subagente (`deliver: false`, carril global: `subagent`)
- Luego ejecuta un paso de anuncio y publica la respuesta del anuncio en el canal de chat del solicitante
- Modelo predeterminado: hereda del llamador salvo que configures `agents.defaults.subagents.model` (o por agente `agents.list[].subagents.model`); un `sessions_spawn.model` explícito sigue teniendo prioridad.
- Thinking predeterminado: hereda del llamador salvo que configures `agents.defaults.subagents.thinking` (o por agente `agents.list[].subagents.thinking`); un `sessions_spawn.thinking` explícito sigue teniendo prioridad.
- Tiempo de espera predeterminado de ejecución: si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; de lo contrario recurre a `0` (sin tiempo de espera).

Parámetros de herramienta:

- `task` (obligatorio)
- `label?` (opcional)
- `agentId?` (opcional; generar bajo otro id de agente si está permitido)
- `model?` (opcional; sobrescribe el modelo del subagente; los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado con una advertencia en el resultado de la herramienta)
- `thinking?` (opcional; sobrescribe el nivel de thinking para la ejecución del subagente)
- `runTimeoutSeconds?` (por defecto `agents.defaults.subagents.runTimeoutSeconds` cuando está configurado; si no `0`; cuando se configura, la ejecución del subagente se aborta después de N segundos)
- `thread?` (predeterminado `false`; cuando es `true`, solicita enlace de hilo de canal para esta sesión de subagente)
- `mode?` (`run|session`)
  - el valor predeterminado es `run`
  - si `thread: true` y se omite `mode`, el valor predeterminado pasa a ser `session`
  - `mode: "session"` requiere `thread: true`
- `cleanup?` (`delete|keep`, predeterminado `keep`)
- `sandbox?` (`inherit|require`, predeterminado `inherit`; `require` rechaza la generación salvo que el runtime hijo objetivo esté en sandbox)
- `sessions_spawn` **no** acepta parámetros de entrega de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para la entrega, usa `message`/`sessions_send` desde la ejecución generada.

## Sesiones vinculadas a hilos

Cuando los enlaces de hilos están habilitados para un canal, un subagente puede permanecer vinculado a un hilo para que los mensajes posteriores del usuario en ese hilo sigan enrutándose a la misma sesión de subagente.

### Canales compatibles con hilos

- Discord (actualmente el único canal compatible): admite sesiones persistentes de subagentes vinculadas a hilos (`sessions_spawn` con `thread: true`), controles manuales de hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) y claves de adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` y `channels.discord.threadBindings.spawnSubagentSessions`.

Flujo rápido:

1. Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"`).
2. OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
3. Las respuestas y mensajes posteriores en ese hilo se enrutan a la sesión vinculada.
4. Usa `/session idle` para inspeccionar/actualizar el desenfoque automático por inactividad y `/session max-age` para controlar el límite estricto.
5. Usa `/unfocus` para desvincular manualmente.

Controles manuales:

- `/focus <target>` vincula el hilo actual (o crea uno) a un destino de subagente/sesión.
- `/unfocus` elimina el vínculo del hilo actualmente vinculado.
- `/agents` enumera ejecuciones activas y el estado del vínculo (`thread:<id>` o `unbound`).
- `/session idle` y `/session max-age` solo funcionan para hilos vinculados con foco.

Interruptores de configuración:

- Valor global predeterminado: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Las claves de sobrescritura por canal y de autoenlace en spawn son específicas del adaptador. Consulta **Canales compatibles con hilos** arriba.

Consulta [Referencia de configuración](/es/gateway/configuration-reference) y [Comandos slash](/es/tools/slash-commands) para ver los detalles actuales del adaptador.

Lista de permitidos:

- `agents.list[].subagents.allowAgents`: lista de ids de agente a los que se puede apuntar mediante `agentId` (`["*"]` para permitir cualquiera). Predeterminado: solo el agente solicitante.
- `agents.defaults.subagents.allowAgents`: lista de permitidos predeterminada de agentes objetivo usada cuando el agente solicitante no define su propia `subagents.allowAgents`.
- Protección de herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza destinos que se ejecutarían fuera de sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: cuando es true, bloquea llamadas a `sessions_spawn` que omiten `agentId` (fuerza selección explícita de perfil). Predeterminado: false.

Descubrimiento:

- Usa `agents_list` para ver qué ids de agente están actualmente permitidos para `sessions_spawn`.

Archivado automático:

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (predeterminado: 60).
- El archivado usa `sessions.delete` y renombra la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (aun así conserva la transcripción mediante renombrado).
- El archivado automático es en el mejor esfuerzo; los temporizadores pendientes se pierden si el gateway se reinicia.
- `runTimeoutSeconds` **no** archiva automáticamente; solo detiene la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivado: pestañas/procesos de navegador rastreados se cierran en el mejor esfuerzo cuando termina la ejecución, incluso si se conserva el registro de transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden generar sus propios subagentes (`maxSpawnDepth: 1`). Puedes habilitar un nivel de anidamiento configurando `maxSpawnDepth: 2`, lo que permite el **patrón de orquestador**: principal → subagente orquestador → sub-subagentes trabajadores.

### Cómo habilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes generen hijos (predeterminado: 1)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (predeterminado: 5)
        maxConcurrent: 8, // límite global de concurrencia del carril (predeterminado: 8)
        runTimeoutSeconds: 900, // tiempo de espera predeterminado para sessions_spawn cuando se omite (0 = sin tiempo de espera)
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de la clave de sesión                   | Rol                                           | ¿Puede generar?               |
| ----------- | --------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0           | `agent:<id>:main`                             | Agente principal                              | Siempre                       |
| 1           | `agent:<id>:subagent:<uuid>`                  | Subagente (u orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2           | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | Sub-subagente (trabajador hoja)               | Nunca                         |

### Cadena de anuncios

Los resultados fluyen de vuelta por la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1)
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza resultados, termina → anuncia al principal
3. El agente principal recibe el anuncio y lo entrega al usuario

Cada nivel solo ve anuncios de sus hijos directos.

Guía operativa:

- Inicia el trabajo hijo una vez y espera a los eventos de finalización en lugar de construir
  bucles de polling alrededor de `sessions_list`, `sessions_history`, `/subagents list` o
  comandos `exec` con sleep.
- Si llega un evento de finalización hijo después de que ya enviaste la respuesta final,
  la respuesta correcta de seguimiento es el token silencioso exacto `NO_REPLY` / `no_reply`.

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de la sesión en el momento de la generación. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`)**: obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gestionar sus hijos. Otras herramientas de sesión/sistema siguen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`)**: sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja)**: sin herramientas de sesión — `sessions_spawn` siempre se deniega en profundidad 2. No puede generar más hijos.

### Límite de generación por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent` (predeterminado: 5) hijos activos al mismo tiempo. Esto evita una expansión descontrolada desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente a todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga.

## Autenticación

La autenticación de subagentes se resuelve por **id de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se combinan como **respaldo**; los perfiles del agente sobrescriben los perfiles del principal en caso de conflicto.

Nota: la combinación es aditiva, así que los perfiles del principal siempre están disponibles como respaldo. Aún no se admite autenticación completamente aislada por agente.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no de la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`,
  la salida del anuncio se suprime aunque haya existido progreso visible anterior.
- En caso contrario, la entrega depende de la profundidad del solicitante:
  - las sesiones solicitantes de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`)
  - las sesiones de subagente solicitantes anidadas reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar resultados hijos dentro de la sesión
  - si una sesión de subagente solicitante anidada ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible
- Para las sesiones solicitantes de nivel superior, la entrega directa en modo finalización primero resuelve cualquier ruta vinculada de conversación/hilo y sobrescritura de hook, luego rellena los campos faltantes de target de canal desde la ruta almacenada de la sesión del solicitante. Esto mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de la finalización solo identifica el canal.
- La agregación de finalización hija se limita a la ejecución actual del solicitante al construir hallazgos de finalización anidados, evitando que salidas antiguas de hijos de ejecuciones previas se filtren al anuncio actual.
- Las respuestas de anuncio conservan el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.
- El contexto del anuncio se normaliza a un bloque estable de evento interno:
  - origen (`subagent` o `cron`)
  - clave/id de sesión hija
  - tipo de anuncio + etiqueta de tarea
  - línea de estado derivada del resultado del tiempo de ejecución (`success`, `error`, `timeout` o `unknown`)
  - contenido del resultado seleccionado del texto visible más reciente del asistente o, en su defecto, del texto saneado más reciente de `tool`/`toolResult`; las ejecuciones fallidas terminales informan del estado de fallo sin reproducir texto de respuesta capturado
  - una instrucción de seguimiento que describe cuándo responder frente a cuándo permanecer en silencio
- `Status` no se infiere de la salida del modelo; proviene de señales del resultado del tiempo de ejecución.
- En tiempo de espera, si el hijo solo llegó a llamadas de herramientas, el anuncio puede contraer ese historial en un breve resumen de progreso parcial en lugar de reproducir la salida sin procesar de las herramientas.

Las cargas de anuncio incluyen una línea de estadísticas al final (incluso cuando van envueltas):

- Tiempo de ejecución (por ejemplo `runtime 5m12s`)
- Uso de tokens (entrada/salida/total)
- Coste estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` y ruta de transcripción (para que el agente principal pueda recuperar historial mediante `sessions_history` o inspeccionar el archivo en disco)
- Los metadatos internos están pensados solo para orquestación; las respuestas de cara al usuario deben reescribirse con voz normal de asistente.

`sessions_history` es la ruta de orquestación más segura:

- el historial del asistente se normaliza primero:
  - se eliminan etiquetas de thinking
  - se eliminan bloques de andamiaje `<relevant-memories>` / `<relevant_memories>`
  - se eliminan bloques XML de carga útil de llamada de herramientas en texto plano como `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y
    `<function_calls>...</function_calls>`, incluidas cargas truncadas
    que nunca se cierran limpiamente
  - se eliminan andamiajes degradados de llamada/resultado de herramienta y marcadores de contexto histórico
  - se eliminan tokens de control del modelo filtrados como `<|assistant|>`, otros tokens ASCII
    `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML mal formado de llamadas de herramientas de MiniMax
- el texto similar a credenciales/tokens se redacta
- los bloques largos pueden truncarse
- historiales muy grandes pueden eliminar filas antiguas o sustituir una fila sobredimensionada por
  `[sessions_history omitted: message too large]`
- la inspección sin procesar de la transcripción en disco es el respaldo cuando necesitas la transcripción completa byte a byte

## Política de herramientas (herramientas de subagentes)

De forma predeterminada, los subagentes obtienen **todas las herramientas excepto las herramientas de sesión** y las herramientas del sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` sigue siendo también aquí una vista acotada y saneada del historial; no es
un volcado sin procesar de la transcripción.

Cuando `maxSpawnDepth >= 2`, los subagentes orquestadores de profundidad 1 reciben además `sessions_spawn`, `subagents`, `sessions_list` y `sessions_history` para poder gestionar a sus hijos.

Sobrescribe mediante configuración:

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
        // si se configura allow, pasa a ser solo permitidos (deny sigue ganando)
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

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución activa de subagente generada desde ella, propagándose a hijos anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.

## Limitaciones

- El anuncio de subagente es **de mejor esfuerzo**. Si el gateway se reinicia, se pierde el trabajo pendiente de “anunciar de vuelta”.
- Los subagentes siguen compartiendo los mismos recursos del proceso del gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve inmediatamente `{ status: "accepted", runId, childSessionKey }`.
- El contexto de subagente solo inyecta `AGENTS.md` + `TOOLS.md` (sin `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidamiento es 5 (`maxSpawnDepth` rango: 1–5). Se recomienda profundidad 2 para la mayoría de casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (predeterminado: 5, rango: 1–20).
