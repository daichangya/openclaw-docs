---
read_when:
    - Quieres trabajo en segundo plano/en paralelo mediante el agente
    - Estás cambiando `sessions_spawn` o la política de herramientas de subagentes
    - Estás implementando o solucionando problemas de sesiones de subagentes vinculadas a hilos
summary: 'Subagentes: iniciar ejecuciones aisladas de agentes que anuncian los resultados de vuelta en el chat solicitante'
title: Subagentes
x-i18n:
    generated_at: "2026-04-25T13:59:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b262edf46b9c823dcf0ad6514e560d2d1a718e9081015ea8bb5c081206b88fce
    source_path: tools/subagents.md
    workflow: 15
---

Los subagentes son ejecuciones de agentes en segundo plano iniciadas desde una ejecución existente de agente. Se ejecutan en su propia sesión (`agent:<agentId>:subagent:<uuid>`) y, cuando terminan, **anuncian** su resultado de vuelta en el canal de chat solicitante. Cada ejecución de subagente se rastrea como una [tarea en segundo plano](/es/automation/tasks).

## Comando slash

Usa `/subagents` para inspeccionar o controlar ejecuciones de subagentes de la **sesión actual**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Controles de vinculación de hilos:

Estos comandos funcionan en canales que admiten vinculaciones persistentes de hilos. Consulta **Canales compatibles con hilos** más abajo.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` muestra metadatos de la ejecución (estado, marcas temporales, ID de sesión, ruta de transcripción, limpieza).
Usa `sessions_history` para una vista de recuperación acotada y filtrada por seguridad; inspecciona la ruta de la transcripción en disco cuando necesites la transcripción completa sin procesar.

### Comportamiento de spawn

`/subagents spawn` inicia un subagente en segundo plano como un comando de usuario, no como un reenvío interno, y envía una actualización final de finalización de vuelta al chat solicitante cuando termina la ejecución.

- El comando de spawn no bloquea; devuelve un ID de ejecución de inmediato.
- Al finalizar, el subagente anuncia un mensaje de resumen/resultado de vuelta en el canal de chat solicitante.
- La entrega al finalizar se basa en push. Una vez iniciado, no hagas polling de `/subagents list`,
  `sessions_list` ni `sessions_history` en bucle solo para esperar a que termine; inspecciona el estado solo bajo demanda para depuración o intervención.
- Al finalizar, OpenClaw intenta cerrar, como best-effort, pestañas/procesos de navegador rastreados abiertos por esa sesión de subagente antes de que continúe el flujo de limpieza del anuncio.
- Para spawns manuales, la entrega es resiliente:
  - OpenClaw intenta primero la entrega directa con `agent` usando una clave de idempotencia estable.
  - Si la entrega directa falla, recurre al enrutamiento por cola.
  - Si el enrutamiento por cola sigue sin estar disponible, el anuncio se reintenta con un backoff exponencial corto antes de desistir definitivamente.
- La entrega de finalización conserva la ruta resuelta del solicitante:
  - las rutas de finalización vinculadas a hilo o vinculadas a conversación prevalecen cuando están disponibles
  - si el origen de finalización solo proporciona un canal, OpenClaw completa el destino/cuenta faltante a partir de la ruta resuelta de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa siga funcionando
- La transferencia de finalización a la sesión solicitante es contexto interno generado en tiempo de ejecución (no texto redactado por el usuario) e incluye:
  - `Result` (el texto más reciente de respuesta visible de `assistant`; en caso contrario, el texto saneado más reciente de tool/toolResult; las ejecuciones fallidas terminales no reutilizan texto de respuesta capturado)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - estadísticas compactas de tiempo de ejecución/tokens
  - una instrucción de entrega que indica al agente solicitante que reescriba en voz normal de asistente (no reenviar metadatos internos sin procesar)
- `--model` y `--thinking` sobrescriben los valores predeterminados para esa ejecución concreta.
- Usa `info`/`log` para inspeccionar detalles y salida después de finalizar.
- `/subagents spawn` es el modo de una sola ejecución (`mode: "run"`). Para sesiones persistentes vinculadas a hilos, usa `sessions_spawn` con `thread: true` y `mode: "session"`.
- Para sesiones de harness ACP (Codex, Claude Code, Gemini CLI), usa `sessions_spawn` con `runtime: "acp"` y consulta [ACP Agents](/es/tools/acp-agents), especialmente el [modelo de entrega de ACP](/es/tools/acp-agents#delivery-model) al depurar finalizaciones o bucles agente a agente.

Objetivos principales:

- Paralelizar trabajo de “investigación / tarea larga / herramienta lenta” sin bloquear la ejecución principal.
- Mantener los subagentes aislados de forma predeterminada (separación de sesión + sandboxing opcional).
- Mantener la superficie de herramientas difícil de usar incorrectamente: los subagentes **no** reciben herramientas de sesión de forma predeterminada.
- Admitir profundidad de anidamiento configurable para patrones de orquestación.

Nota de coste: cada subagente tiene su **propio** contexto y uso de tokens de forma predeterminada. Para tareas pesadas o repetitivas, establece un modelo más económico para los subagentes y mantén tu agente principal en un modelo de mayor calidad. Puedes configurarlo mediante `agents.defaults.subagents.model` o con overrides por agente. Cuando un hijo realmente necesite la transcripción actual del solicitante, el agente puede solicitar `context: "fork"` en ese spawn concreto.

## Modos de contexto

Los subagentes nativos se inician aislados a menos que el llamador solicite explícitamente bifurcar la transcripción actual.

| Modo       | Cuándo usarlo                                                                                                                         | Comportamiento                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `isolated` | Investigación nueva, implementación independiente, trabajo con herramientas lentas o cualquier cosa que pueda describirse brevemente en el texto de la tarea | Crea una transcripción hija limpia. Este es el valor predeterminado y mantiene menor el uso de tokens. |
| `fork`     | Trabajo que depende de la conversación actual, resultados previos de herramientas o instrucciones matizadas ya presentes en la transcripción del solicitante | Bifurca la transcripción del solicitante en la sesión hija antes de que el hijo comience. |

Usa `fork` con moderación. Es para delegación sensible al contexto, no un sustituto de escribir un prompt de tarea claro.

## Herramienta

Usa `sessions_spawn`:

- Inicia una ejecución de subagente (`deliver: false`, carril global: `subagent`)
- Luego ejecuta un paso de anuncio y publica la respuesta de anuncio en el canal de chat solicitante
- Modelo predeterminado: hereda el del llamador a menos que establezcas `agents.defaults.subagents.model` (o `agents.list[].subagents.model` por agente); un `sessions_spawn.model` explícito sigue prevaleciendo.
- Thinking predeterminado: hereda el del llamador a menos que establezcas `agents.defaults.subagents.thinking` (o `agents.list[].subagents.thinking` por agente); un `sessions_spawn.thinking` explícito sigue prevaleciendo.
- Timeout predeterminado de ejecución: si se omite `sessions_spawn.runTimeoutSeconds`, OpenClaw usa `agents.defaults.subagents.runTimeoutSeconds` cuando está establecido; en caso contrario, recurre a `0` (sin timeout).

Parámetros de la herramienta:

- `task` (obligatorio)
- `label?` (opcional)
- `agentId?` (opcional; iniciar bajo otro ID de agente si está permitido)
- `model?` (opcional; sobrescribe el modelo del subagente; los valores no válidos se omiten y el subagente se ejecuta con el modelo predeterminado con una advertencia en el resultado de la herramienta)
- `thinking?` (opcional; sobrescribe el nivel de thinking para la ejecución del subagente)
- `runTimeoutSeconds?` (predeterminado a `agents.defaults.subagents.runTimeoutSeconds` cuando está establecido; en caso contrario `0`; cuando se establece, la ejecución del subagente se aborta después de N segundos)
- `thread?` (predeterminado `false`; cuando es `true`, solicita vinculación de hilo del canal para esta sesión de subagente)
- `mode?` (`run|session`)
  - el predeterminado es `run`
  - si `thread: true` y `mode` se omite, el valor predeterminado pasa a ser `session`
  - `mode: "session"` requiere `thread: true`
- `cleanup?` (`delete|keep`, predeterminado `keep`)
- `sandbox?` (`inherit|require`, predeterminado `inherit`; `require` rechaza el spawn salvo que el tiempo de ejecución hijo de destino esté en sandbox)
- `context?` (`isolated|fork`, predeterminado `isolated`; solo subagentes nativos)
  - `isolated` crea una transcripción hija limpia y es el valor predeterminado.
  - `fork` bifurca la transcripción actual del solicitante en la sesión hija para que el hijo comience con el mismo contexto de conversación.
  - Usa `fork` solo cuando el hijo necesite la transcripción actual. Para trabajo delimitado, omite `context`.
- `sessions_spawn` **no** acepta parámetros de entrega de canal (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Para la entrega, usa `message`/`sessions_send` desde la ejecución iniciada.

## Sesiones vinculadas a hilos

Cuando las vinculaciones de hilos están habilitadas para un canal, un subagente puede seguir vinculado a un hilo para que los mensajes posteriores del usuario en ese hilo sigan enrutándose a la misma sesión de subagente.

### Canales compatibles con hilos

- Discord (actualmente el único canal compatible): admite sesiones persistentes de subagentes vinculadas a hilos (`sessions_spawn` con `thread: true`), controles manuales de hilos (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) y claves de adaptador `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` y `channels.discord.threadBindings.spawnSubagentSessions`.

Flujo rápido:

1. Inicia con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"`).
2. OpenClaw crea o vincula un hilo a ese destino de sesión en el canal activo.
3. Las respuestas y mensajes de seguimiento en ese hilo se enrutan a la sesión vinculada.
4. Usa `/session idle` para inspeccionar/actualizar el desenfoque automático por inactividad y `/session max-age` para controlar el límite estricto.
5. Usa `/unfocus` para desvincular manualmente.

Controles manuales:

- `/focus <target>` vincula el hilo actual (o crea uno) a un destino de subagente/sesión.
- `/unfocus` elimina la vinculación del hilo vinculado actual.
- `/agents` lista las ejecuciones activas y el estado de vinculación (`thread:<id>` o `unbound`).
- `/session idle` y `/session max-age` solo funcionan para hilos vinculados enfocados.

Interruptores de configuración:

- Valor global predeterminado: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Las claves de sobrescritura de canal y de vinculación automática al spawn son específicas del adaptador. Consulta **Canales compatibles con hilos** más arriba.

Consulta [Referencia de configuración](/es/gateway/configuration-reference) y [Comandos slash](/es/tools/slash-commands) para ver los detalles actuales del adaptador.

Lista de permitidos:

- `agents.list[].subagents.allowAgents`: lista de ID de agentes a los que se puede apuntar mediante `agentId` (`["*"]` para permitir cualquiera). Predeterminado: solo el agente solicitante.
- `agents.defaults.subagents.allowAgents`: lista predeterminada de agentes objetivo usada cuando el agente solicitante no establece su propio `subagents.allowAgents`.
- Protección de herencia de sandbox: si la sesión solicitante está en sandbox, `sessions_spawn` rechaza objetivos que se ejecutarían sin sandbox.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: cuando es `true`, bloquea llamadas a `sessions_spawn` que omitan `agentId` (obliga a una selección explícita de perfil). Predeterminado: false.

Descubrimiento:

- Usa `agents_list` para ver qué ID de agentes están actualmente permitidos para `sessions_spawn`.

Archivado automático:

- Las sesiones de subagentes se archivan automáticamente después de `agents.defaults.subagents.archiveAfterMinutes` (predeterminado: 60).
- El archivado usa `sessions.delete` y renombra la transcripción a `*.deleted.<timestamp>` (misma carpeta).
- `cleanup: "delete"` archiva inmediatamente después del anuncio (sigue conservando la transcripción mediante renombrado).
- El archivado automático es best-effort; los temporizadores pendientes se pierden si el gateway se reinicia.
- `runTimeoutSeconds` **no** archiva automáticamente; solo detiene la ejecución. La sesión permanece hasta el archivado automático.
- El archivado automático se aplica por igual a sesiones de profundidad 1 y de profundidad 2.
- La limpieza del navegador es independiente de la limpieza de archivado: las pestañas/procesos de navegador rastreados se intentan cerrar como best-effort cuando termina la ejecución, incluso si se conserva el registro de transcripción/sesión.

## Subagentes anidados

De forma predeterminada, los subagentes no pueden iniciar sus propios subagentes (`maxSpawnDepth: 1`). Puedes habilitar un nivel de anidamiento estableciendo `maxSpawnDepth: 2`, lo que permite el **patrón de orquestador**: principal → subagente orquestador → subsubagentes trabajadores.

### Cómo habilitarlo

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // permitir que los subagentes inicien hijos (predeterminado: 1)
        maxChildrenPerAgent: 5, // máximo de hijos activos por sesión de agente (predeterminado: 5)
        maxConcurrent: 8, // límite global de concurrencia del carril (predeterminado: 8)
        runTimeoutSeconds: 900, // timeout predeterminado para sessions_spawn cuando se omite (0 = sin timeout)
      },
    },
  },
}
```

### Niveles de profundidad

| Profundidad | Forma de la clave de sesión                 | Rol                                           | ¿Puede iniciar otros?         |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agente principal                              | Siempre                      |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagente (orquestador cuando se permite profundidad 2) | Solo si `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagente (trabajador hoja)                | Nunca                        |

### Cadena de anuncios

Los resultados fluyen de vuelta por la cadena:

1. El trabajador de profundidad 2 termina → anuncia a su padre (orquestador de profundidad 1)
2. El orquestador de profundidad 1 recibe el anuncio, sintetiza resultados, termina → anuncia al principal
3. El agente principal recibe el anuncio y lo entrega al usuario

Cada nivel solo ve anuncios de sus hijos directos.

Guía operativa:

- Inicia el trabajo hijo una vez y espera eventos de finalización en lugar de crear bucles de polling alrededor de `sessions_list`, `sessions_history`, `/subagents list` o comandos `exec` con `sleep`.
- `sessions_list` y `/subagents list` mantienen las relaciones de sesiones hijas centradas en trabajo en vivo: los hijos activos siguen adjuntos, los hijos terminados permanecen visibles durante una ventana reciente breve y los vínculos hijos obsoletos solo en el almacén se ignoran después de su ventana de vigencia. Esto evita que metadatos antiguos de `spawnedBy` / `parentSessionKey` resuciten hijos fantasma tras un reinicio.
- Si llega un evento de finalización de un hijo después de que ya hayas enviado la respuesta final, el seguimiento correcto es el token silencioso exacto `NO_REPLY` / `no_reply`.

### Política de herramientas por profundidad

- El rol y el alcance de control se escriben en los metadatos de la sesión en el momento del spawn. Eso evita que claves de sesión planas o restauradas recuperen accidentalmente privilegios de orquestador.
- **Profundidad 1 (orquestador, cuando `maxSpawnDepth >= 2`)**: obtiene `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` para poder gestionar a sus hijos. Otras herramientas de sesión/sistema siguen denegadas.
- **Profundidad 1 (hoja, cuando `maxSpawnDepth == 1`)**: sin herramientas de sesión (comportamiento predeterminado actual).
- **Profundidad 2 (trabajador hoja)**: sin herramientas de sesión; `sessions_spawn` siempre está denegado en profundidad 2. No puede iniciar más hijos.

### Límite de spawns por agente

Cada sesión de agente (a cualquier profundidad) puede tener como máximo `maxChildrenPerAgent` (predeterminado: 5) hijos activos al mismo tiempo. Esto evita una expansión descontrolada desde un único orquestador.

### Detención en cascada

Detener un orquestador de profundidad 1 detiene automáticamente a todos sus hijos de profundidad 2:

- `/stop` en el chat principal detiene todos los agentes de profundidad 1 y se propaga a sus hijos de profundidad 2.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.
- `/subagents kill all` detiene todos los subagentes del solicitante y se propaga.

## Autenticación

La autenticación del subagente se resuelve por **ID de agente**, no por tipo de sesión:

- La clave de sesión del subagente es `agent:<agentId>:subagent:<uuid>`.
- El almacén de autenticación se carga desde el `agentDir` de ese agente.
- Los perfiles de autenticación del agente principal se fusionan como **fallback**; los perfiles del agente sobrescriben los perfiles principales en caso de conflicto.

Nota: la fusión es aditiva, por lo que los perfiles principales siempre están disponibles como fallback. La autenticación completamente aislada por agente todavía no es compatible.

## Anuncio

Los subagentes informan de vuelta mediante un paso de anuncio:

- El paso de anuncio se ejecuta dentro de la sesión del subagente (no en la sesión del solicitante).
- Si el subagente responde exactamente `ANNOUNCE_SKIP`, no se publica nada.
- Si el texto más reciente del asistente es el token silencioso exacto `NO_REPLY` / `no_reply`, la salida del anuncio se suprime incluso si hubo progreso visible anterior.
- En caso contrario, la entrega depende de la profundidad del solicitante:
  - las sesiones solicitantes de nivel superior usan una llamada de seguimiento `agent` con entrega externa (`deliver=true`)
  - las sesiones anidadas de subagentes solicitantes reciben una inyección interna de seguimiento (`deliver=false`) para que el orquestador pueda sintetizar resultados hijos dentro de la sesión
  - si una sesión anidada de subagente solicitante ya no existe, OpenClaw recurre al solicitante de esa sesión cuando está disponible
- Para las sesiones solicitantes de nivel superior, la entrega directa en modo finalización primero resuelve cualquier ruta de conversación/hilo vinculada y cualquier override de hook, y luego completa los campos faltantes del destino del canal a partir de la ruta almacenada de la sesión solicitante. Esto mantiene las finalizaciones en el chat/tema correcto incluso cuando el origen de finalización solo identifica el canal.
- La agregación de finalización de hijos se limita a la ejecución solicitante actual al construir hallazgos de finalización anidados, lo que evita que salidas antiguas de hijos de ejecuciones anteriores se filtren en el anuncio actual.
- Las respuestas de anuncio preservan el enrutamiento de hilo/tema cuando está disponible en los adaptadores de canal.
- El contexto de anuncio se normaliza a un bloque estable de evento interno:
  - origen (`subagent` o `cron`)
  - clave/ID de sesión hija
  - tipo de anuncio + etiqueta de tarea
  - línea de estado derivada del resultado en tiempo de ejecución (`success`, `error`, `timeout` o `unknown`)
  - contenido de resultado seleccionado a partir del último texto visible del asistente; en caso contrario, texto saneado más reciente de tool/toolResult; las ejecuciones terminales fallidas informan estado de fallo sin reproducir texto de respuesta capturado
  - una instrucción de seguimiento que describe cuándo responder frente a cuándo permanecer en silencio
- `Status` no se infiere de la salida del modelo; proviene de señales del resultado en tiempo de ejecución.
- En caso de timeout, si el hijo solo llegó a llamadas a herramientas, el anuncio puede colapsar ese historial en un breve resumen de progreso parcial en lugar de reproducir la salida sin procesar de herramientas.

Los payloads de anuncio incluyen una línea de estadísticas al final (incluso cuando están envueltos):

- Tiempo de ejecución (por ejemplo, `runtime 5m12s`)
- Uso de tokens (entrada/salida/total)
- Coste estimado cuando el precio del modelo está configurado (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` y ruta de transcripción (para que el agente principal pueda obtener historial mediante `sessions_history` o inspeccionar el archivo en disco)
- Los metadatos internos están pensados solo para la orquestación; las respuestas orientadas al usuario deben reescribirse con una voz normal de asistente.

`sessions_history` es la ruta de orquestación más segura:

- la recuperación del asistente se normaliza primero:
  - se eliminan las etiquetas de thinking
  - se eliminan los bloques de andamiaje `<relevant-memories>` / `<relevant_memories>`
  - se eliminan bloques de payload XML de llamadas a herramientas en texto plano como `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` y `<function_calls>...</function_calls>`, incluidos payloads truncados que nunca se cierran limpiamente
  - se eliminan el andamiaje degradado de llamadas/resultados de herramientas y los marcadores de contexto histórico
  - se eliminan tokens de control del modelo filtrados como `<|assistant|>`, otros tokens ASCII `<|...|>` y variantes de ancho completo `<｜...｜>`
  - se elimina XML malformado de llamadas a herramientas de MiniMax
- se redacta el texto similar a credenciales/tokens
- los bloques largos pueden truncarse
- los historiales muy grandes pueden eliminar filas antiguas o reemplazar una fila sobredimensionada por `[sessions_history omitted: message too large]`
- la inspección de la transcripción sin procesar en disco es el fallback cuando necesitas la transcripción completa byte por byte

## Política de herramientas (herramientas de subagente)

De forma predeterminada, los subagentes obtienen **todas las herramientas excepto las herramientas de sesión** y las herramientas del sistema:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` sigue siendo aquí también una vista de recuperación acotada y saneada; no es un volcado sin procesar de la transcripción.

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrencia

Los subagentes usan un carril de cola dedicado en proceso:

- Nombre del carril: `subagent`
- Concurrencia: `agents.defaults.subagents.maxConcurrent` (predeterminado `8`)

## Vitalidad y recuperación

OpenClaw no trata la ausencia de `endedAt` como prueba permanente de que un subagente siga vivo. Las ejecuciones no terminadas más antiguas que la ventana de ejecuciones obsoletas dejan de contar como activas/pendientes en `/subagents list`, resúmenes de estado, control de finalización de descendientes y comprobaciones de concurrencia por sesión.

Después de un reinicio del gateway, las ejecuciones restauradas obsoletas no terminadas se podan salvo que su sesión hija esté marcada como `abortedLastRun: true`. Esas sesiones hijas abortadas por reinicio siguen siendo recuperables mediante el flujo de recuperación de huérfanos de subagentes, que envía un mensaje sintético de reanudación antes de borrar el marcador de aborto.

## Detención

- Enviar `/stop` en el chat solicitante aborta la sesión solicitante y detiene cualquier ejecución activa de subagente iniciada desde ella, propagándose a hijos anidados.
- `/subagents kill <id>` detiene un subagente específico y se propaga a sus hijos.

## Limitaciones

- El anuncio del subagente es **best-effort**. Si el gateway se reinicia, se pierde el trabajo pendiente de “anunciar de vuelta”.
- Los subagentes siguen compartiendo los mismos recursos del proceso gateway; trata `maxConcurrent` como una válvula de seguridad.
- `sessions_spawn` siempre es no bloqueante: devuelve `{ status: "accepted", runId, childSessionKey }` de inmediato.
- El contexto del subagente solo inyecta `AGENTS.md` + `TOOLS.md` (no `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ni `BOOTSTRAP.md`).
- La profundidad máxima de anidamiento es 5 (rango de `maxSpawnDepth`: 1–5). La profundidad 2 se recomienda para la mayoría de los casos de uso.
- `maxChildrenPerAgent` limita los hijos activos por sesión (predeterminado: 5, rango: 1–20).

## Relacionado

- [Agentes ACP](/es/tools/acp-agents)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [Agent Send](/es/tools/agent-send)
