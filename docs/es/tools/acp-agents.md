---
read_when:
    - Ejecutar harnesses de codificación mediante ACP
    - Configurar sesiones de ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de un canal de mensajería a una sesión persistente de ACP
    - Solucionar problemas del backend de ACP y la conexión del Plugin
    - Depurar la entrega de finalización de ACP o los bucles entre agentes
    - Usar comandos `/acp` desde el chat
summary: Usa sesiones de tiempo de ejecución de ACP para Claude Code, Cursor, Gemini CLI, alternativa explícita de ACP de Codex, ACP de OpenClaw y otros agentes de harness
title: Agentes de ACP
x-i18n:
    generated_at: "2026-04-25T13:57:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permiten que OpenClaw ejecute harnesses de codificación externos (por ejemplo Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI y otros harnesses ACPX compatibles) mediante un Plugin de backend de ACP.

Si le pides a OpenClaw en lenguaje natural que vincule o controle Codex en la conversación actual, OpenClaw debe usar el Plugin nativo app-server de Codex (`/codex bind`, `/codex threads`, `/codex resume`). Si pides `/acp`, ACP, acpx o una sesión secundaria en segundo plano de Codex, OpenClaw aún puede enrutar Codex mediante ACP. Cada creación de sesión ACP se registra como una [tarea en segundo plano](/es/automation/tasks).

Si le pides a OpenClaw en lenguaje natural que "inicie Claude Code en un hilo" o que use otro harness externo, OpenClaw debe enrutar esa solicitud al tiempo de ejecución de ACP (no al tiempo de ejecución nativo de subagente).

Si quieres que Codex o Claude Code se conecten como cliente MCP externo directamente
a conversaciones de canal existentes de OpenClaw, usa [`openclaw mcp serve`](/es/cli/mcp)
en lugar de ACP.

## ¿Qué página quiero?

Hay tres superficies cercanas que es fácil confundir:

| Quieres...                                                                                     | Usa esto                              | Notas                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vincular o controlar Codex en la conversación actual                                           | `/codex bind`, `/codex threads`       | Ruta nativa de app-server de Codex; incluye respuestas vinculadas en chat, reenvío de imágenes, controles de modelo/fast/permisos, stop y steer. ACP es una alternativa explícita |
| Ejecutar Claude Code, Gemini CLI, ACP explícito de Codex u otro harness externo _a través de_ OpenClaw | Esta página: agentes de ACP           | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles del tiempo de ejecución              |
| Exponer una sesión de Gateway de OpenClaw _como_ servidor ACP para un editor o cliente         | [`openclaw acp`](/es/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw mediante stdio/WebSocket                                                                                |
| Reutilizar una AI CLI local como modelo alternativo solo de texto                              | [CLI Backends](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles de ACP, sin tiempo de ejecución del harness                                                        |

## ¿Esto funciona listo para usar?

Normalmente, sí. Las instalaciones nuevas incluyen el Plugin de tiempo de ejecución `acpx` empaquetado habilitado de forma predeterminada, con un binario `acpx` fijado local al Plugin que OpenClaw sondea y autorrepara al iniciar. Ejecuta `/acp doctor` para una comprobación de preparación.

Consideraciones del primer uso:

- Los adaptadores de harness de destino (Codex, Claude, etc.) pueden obtenerse bajo demanda con `npx` la primera vez que los uses.
- La autenticación del proveedor todavía tiene que existir en el host para ese harness.
- Si el host no tiene acceso a npm o a la red, la obtención de adaptadores del primer uso falla hasta que las cachés se precalienten o el adaptador se instale de otra manera.

## Runbook del operador

Flujo rápido de `/acp` desde el chat:

1. **Crear** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` o `/acp spawn codex --bind here` explícito
2. **Trabajar** en la conversación o hilo vinculado (o apuntar explícitamente a la clave de sesión).
3. **Comprobar el estado** — `/acp status`
4. **Ajustar** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Orientar** sin reemplazar el contexto — `/acp steer tighten logging and continue`
6. **Detener** — `/acp cancel` (turno actual) o `/acp close` (sesión + vinculaciones)

Activadores en lenguaje natural que deben enrutar al Plugin nativo de Codex:

- "Vincula este canal de Discord a Codex."
- "Adjunta este chat al hilo de Codex `<id>`."
- "Muestra los hilos de Codex y luego vincula este."

La vinculación nativa de conversaciones de Codex es la ruta predeterminada de control por chat. OpenClaw
sigue ejecutando las herramientas dinámicas mediante OpenClaw, mientras que las herramientas nativas de Codex como
shell/apply-patch se ejecutan dentro de Codex. Para los eventos de herramientas nativas de Codex, OpenClaw
inyecta un relay nativo por turno para que los hooks del Plugin puedan bloquear
`before_tool_call`, observar `after_tool_call` y enrutar los eventos
`PermissionRequest` de Codex mediante aprobaciones de OpenClaw. El relay v1 es
deliberadamente conservador: no modifica los argumentos de herramientas nativas de Codex,
no reescribe los registros de hilos de Codex ni bloquea las respuestas finales o los hooks Stop. Usa ACP explícito
solo cuando quieras el modelo de tiempo de ejecución/sesión de ACP. El límite de compatibilidad
del soporte integrado de Codex está documentado en el
[contrato de compatibilidad v1 del harness de Codex](/es/plugins/codex-harness#v1-support-contract).

Activadores en lenguaje natural que deben enrutar al tiempo de ejecución de ACP:

- "Ejecuta esto como una sesión ACP de una sola ejecución de Claude Code y resume el resultado."
- "Usa Gemini CLI para esta tarea en un hilo y luego conserva el seguimiento en ese mismo hilo."
- "Ejecuta Codex mediante ACP en un hilo en segundo plano."

OpenClaw elige `runtime: "acp"`, resuelve el `agentId` del harness, se vincula a la conversación o hilo actual cuando es compatible y enruta los seguimientos a esa sesión hasta el cierre o vencimiento. Codex solo sigue esta ruta cuando ACP es explícito o cuando el tiempo de ejecución en segundo plano solicitado todavía necesita ACP.

## ACP frente a subagentes

Usa ACP cuando quieras un tiempo de ejecución de harness externo. Usa el app-server nativo de Codex para la vinculación/control de conversaciones de Codex. Usa subagentes cuando quieras ejecuciones delegadas nativas de OpenClaw.

| Área          | Sesión ACP                            | Ejecución de subagente              |
| ------------- | ------------------------------------- | ----------------------------------- |
| Tiempo de ejecución | Plugin de backend de ACP (por ejemplo acpx) | Tiempo de ejecución nativo de subagentes de OpenClaw |
| Clave de sesión | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principales | `/acp ...`                            | `/subagents ...`                   |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (tiempo de ejecución predeterminado) |

Consulta también [Sub-agents](/es/tools/subagents).

## Cómo ACP ejecuta Claude Code

Para Claude Code mediante ACP, la pila es:

1. Plano de control de sesiones ACP de OpenClaw
2. Plugin de tiempo de ejecución `acpx` empaquetado
3. Adaptador ACP de Claude
4. Maquinaria de tiempo de ejecución/sesión del lado de Claude

Distinción importante:

- ACP Claude es una sesión de harness con controles de ACP, reanudación de sesión, seguimiento de tareas en segundo plano y vinculación opcional a conversación/hilo.
- Los CLI Backends son tiempos de ejecución alternativos locales separados y solo de texto. Consulta [CLI Backends](/es/gateway/cli-backends).

Para los operadores, la regla práctica es:

- si quieres `/acp spawn`, sesiones vinculables, controles del tiempo de ejecución o trabajo persistente del harness: usa ACP
- si quieres una alternativa local simple de texto mediante la CLI sin procesar: usa CLI Backends

## Sesiones vinculadas

### Vinculaciones de conversación actual

`/acp spawn <harness> --bind here` fija la conversación actual a la sesión ACP creada: sin hilo secundario, en la misma superficie de chat. OpenClaw sigue siendo responsable del transporte, la autenticación, la seguridad y la entrega; los mensajes de seguimiento en esa conversación se enrutan a la misma sesión; `/new` y `/reset` reinician la sesión en su lugar; `/acp close` elimina la vinculación.

Modelo mental:

- **superficie de chat** — donde la gente sigue hablando (canal de Discord, tema de Telegram, chat de iMessage).
- **sesión ACP** — el estado duradero del tiempo de ejecución de Codex/Claude/Gemini al que OpenClaw enruta.
- **hilo/tema secundario** — una superficie de mensajería adicional opcional creada solo por `--thread ...`.
- **workspace del tiempo de ejecución** — la ubicación del sistema de archivos (`cwd`, checkout del repositorio, workspace del backend) donde se ejecuta el harness. Independiente de la superficie de chat.

Ejemplos:

- `/codex bind` — conservar este chat, crear o adjuntar el app-server nativo de Codex y enrutar aquí los mensajes futuros.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — ajustar el hilo nativo vinculado de Codex desde el chat.
- `/codex stop` o `/codex steer focus on the failing tests first` — controlar el turno nativo activo de Codex.
- `/acp spawn codex --bind here` — alternativa ACP explícita para Codex.
- `/acp spawn codex --thread auto` — OpenClaw puede crear un hilo/tema secundario y vincularse allí.
- `/acp spawn codex --bind here --cwd /workspace/repo` — misma vinculación al chat, Codex se ejecuta en `/workspace/repo`.

Notas:

- `--bind here` y `--thread ...` son mutuamente excluyentes.
- `--bind here` solo funciona en canales que anuncian compatibilidad con vinculación a la conversación actual; de lo contrario, OpenClaw devuelve un mensaje claro de incompatibilidad. Las vinculaciones persisten entre reinicios del gateway.
- En Discord, `spawnAcpSessions` solo es necesario cuando OpenClaw necesita crear un hilo secundario para `--thread auto|here`; no para `--bind here`.
- Si creas en un agente ACP diferente sin `--cwd`, OpenClaw hereda de forma predeterminada el workspace del **agente de destino**. Las rutas heredadas faltantes (`ENOENT`/`ENOTDIR`) recurren al valor predeterminado del backend; otros errores de acceso (por ejemplo, `EACCES`) aparecen como errores de creación.

### Sesiones vinculadas a hilos

Cuando las vinculaciones de hilos están habilitadas para un adaptador de canal, las sesiones ACP pueden vincularse a hilos:

- OpenClaw vincula un hilo a una sesión ACP de destino.
- Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
- La salida de ACP se entrega de vuelta al mismo hilo.
- Perder el foco/cerrar/archivar/tiempo de espera por inactividad o vencimiento de antigüedad máxima elimina la vinculación.

La compatibilidad con vinculación a hilos depende del adaptador. Si el adaptador de canal activo no admite vinculaciones a hilos, OpenClaw devuelve un mensaje claro de no compatible/no disponible.

Indicadores de función requeridos para ACP vinculado a hilos:

- `acp.enabled=true`
- `acp.dispatch.enabled` está activado de forma predeterminada (establece `false` para pausar el despacho de ACP)
- Indicador de creación de hilos ACP del adaptador de canal habilitado (específico del adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canales compatibles con hilos

- Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
- Compatibilidad integrada actual:
  - Hilos/canales de Discord
  - Temas de Telegram (temas de foros en grupos/supergrupos y temas de mensajes directos)
- Los canales Plugin pueden añadir compatibilidad mediante la misma interfaz de vinculación.

## Configuración específica por canal

Para flujos de trabajo no efímeros, configura vinculaciones ACP persistentes en entradas de nivel superior `bindings[]`.

### Modelo de vinculación

- `bindings[].type="acp"` marca una vinculación persistente de conversación ACP.
- `bindings[].match` identifica la conversación de destino:
  - Canal o hilo de Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tema de foro de Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat directo/grupal de BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefiere `chat_id:*` o `chat_identifier:*` para vinculaciones estables de grupo.
  - Chat directo/grupal de iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Prefiere `chat_id:*` para vinculaciones estables de grupo.
- `bindings[].agentId` es el id del agente OpenClaw propietario.
- Las sobrescrituras opcionales de ACP viven en `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valores predeterminados del tiempo de ejecución por agente

Usa `agents.list[].runtime` para definir una sola vez los valores predeterminados de ACP por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id del harness, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedencia de sobrescritura para sesiones ACP vinculadas:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valores predeterminados globales de ACP (por ejemplo `acp.backend`)

Ejemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Comportamiento:

- OpenClaw garantiza que la sesión ACP configurada exista antes de usarla.
- Los mensajes en ese canal o tema se enrutan a la sesión ACP configurada.
- En conversaciones vinculadas, `/new` y `/reset` reinician la misma clave de sesión ACP en su lugar.
- Las vinculaciones temporales del tiempo de ejecución (por ejemplo, creadas por flujos de enfoque de hilo) siguen aplicándose cuando están presentes.
- Para creaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el workspace del agente de destino desde la configuración del agente.
- Las rutas heredadas de workspace que faltan recurren al `cwd` predeterminado del backend; los fallos de acceso no debidos a ausencia aparecen como errores de creación.

## Iniciar sesiones ACP (interfaces)

### Desde `sessions_spawn`

Usa `runtime: "acp"` para iniciar una sesión ACP desde un turno del agente o una llamada de herramienta.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notas:

- `runtime` usa `subagent` de forma predeterminada, así que establece `runtime: "acp"` explícitamente para sesiones ACP.
- Si se omite `agentId`, OpenClaw usa `acp.defaultAgent` cuando está configurado.
- `mode: "session"` requiere `thread: true` para mantener una conversación vinculada persistente.

Detalles de la interfaz:

- `task` (obligatorio): prompt inicial enviado a la sesión ACP.
- `runtime` (obligatorio para ACP): debe ser `"acp"`.
- `agentId` (opcional): id del harness ACP de destino. Recurre a `acp.defaultAgent` si está establecido.
- `thread` (opcional, valor predeterminado `false`): solicita el flujo de vinculación a hilo cuando es compatible.
- `mode` (opcional): `run` (una sola ejecución) o `session` (persistente).
  - el valor predeterminado es `run`
  - si `thread: true` y se omite mode, OpenClaw puede usar por defecto comportamiento persistente según la ruta del tiempo de ejecución
  - `mode: "session"` requiere `thread: true`
- `cwd` (opcional): directorio de trabajo solicitado para el tiempo de ejecución (validado por la política del backend/runtime). Si se omite, la creación ACP hereda el workspace del agente de destino cuando está configurado; las rutas heredadas faltantes recurren a los valores predeterminados del backend, mientras que los errores reales de acceso se devuelven.
- `label` (opcional): etiqueta visible para el operador usada en el texto de sesión/banner.
- `resumeSessionId` (opcional): reanuda una sesión ACP existente en lugar de crear una nueva. El agente reproduce su historial de conversación mediante `session/load`. Requiere `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resúmenes del progreso de la ejecución ACP inicial de vuelta a la sesión solicitante como eventos del sistema.
  - Cuando está disponible, las respuestas aceptadas incluyen `streamLogPath`, que apunta a un registro JSONL con alcance de sesión (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo del relay.
- `model` (opcional): sobrescritura explícita del modelo para la sesión secundaria ACP. Se respeta para `runtime: "acp"` para que la sesión secundaria use el modelo solicitado en lugar de recurrir silenciosamente al valor predeterminado del agente de destino.

## Modelo de entrega

Las sesiones ACP pueden ser workspaces interactivos o trabajo en segundo plano propiedad del padre. La ruta de entrega depende de esa forma.

### Sesiones ACP interactivas

Las sesiones interactivas están pensadas para seguir conversando en una superficie visible de chat:

- `/acp spawn ... --bind here` vincula la conversación actual a la sesión ACP.
- `/acp spawn ... --thread ...` vincula un hilo/tema del canal a la sesión ACP.
- Las `bindings[].type="acp"` persistentes y configuradas enrutan las conversaciones coincidentes a la misma sesión ACP.

Los mensajes de seguimiento en la conversación vinculada se enrutan directamente a la sesión ACP, y la salida ACP se entrega de vuelta al mismo canal/hilo/tema.

### Sesiones ACP de una sola ejecución propiedad del padre

Las sesiones ACP de una sola ejecución creadas por otra ejecución de agente son hijas en segundo plano, similares a los subagentes:

- El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
- La hija se ejecuta en su propia sesión de harness ACP.
- La finalización se informa mediante la ruta interna de anuncio de finalización de tareas.
- El padre reescribe el resultado de la hija con una voz normal de asistente cuando conviene una respuesta orientada al usuario.

No trates esta ruta como un chat entre pares entre padre e hija. La hija ya tiene un canal de finalización de vuelta al padre.

### `sessions_send` y entrega A2A

`sessions_send` puede apuntar a otra sesión después de la creación. Para sesiones pares normales, OpenClaw usa una ruta de seguimiento agente a agente (A2A) después de inyectar el mensaje:

- esperar la respuesta de la sesión de destino
- opcionalmente permitir que solicitante y destino intercambien un número limitado de turnos de seguimiento
- pedir al destino que produzca un mensaje de anuncio
- entregar ese anuncio al canal o hilo visible

Esa ruta A2A es una alternativa para envíos entre pares donde el remitente necesita un seguimiento visible. Sigue habilitada cuando una sesión no relacionada puede ver y enviar mensajes a un destino ACP, por ejemplo con configuraciones amplias de `tools.sessions.visibility`.

OpenClaw omite el seguimiento A2A solo cuando el solicitante es el padre de su propia sesión hija ACP de una sola ejecución. En ese caso, ejecutar A2A además de la finalización de tareas puede despertar al padre con el resultado de la hija, reenviar la respuesta del padre de vuelta a la hija y crear un bucle de eco padre/hija. El resultado de `sessions_send` informa `delivery.status="skipped"` para ese caso de hija propia porque la ruta de finalización ya es responsable del resultado.

### Reanudar una sesión existente

Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de empezar desde cero. El agente reproduce su historial de conversación mediante `session/load`, así que retoma con el contexto completo de lo que ocurrió antes.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso habituales:

- Transferir una sesión de Codex desde tu portátil a tu teléfono: dile a tu agente que retome donde lo dejaste
- Continuar una sesión de codificación que iniciaste de forma interactiva en la CLI, ahora sin interfaz mediante tu agente
- Retomar trabajo que se interrumpió por un reinicio del gateway o un tiempo de espera por inactividad

Notas:

- `resumeSessionId` requiere `runtime: "acp"`; devuelve un error si se usa con el tiempo de ejecución de subagente.
- `resumeSessionId` restaura el historial de conversación ACP ascendente; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, así que `mode: "session"` sigue requiriendo `thread: true`.
- El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
- Si no se encuentra el id de sesión, la creación falla con un error claro; no hay alternativa silenciosa a una sesión nueva.

<Accordion title="Prueba rápida posterior al despliegue">

Después de un despliegue del gateway, ejecuta una comprobación activa de extremo a extremo en lugar de confiar en las pruebas unitarias:

1. Verifica la versión y el commit del gateway desplegado en el host de destino.
2. Abre una sesión puente ACPX temporal hacia un agente activo.
3. Pide a ese agente que llame a `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` y la tarea `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Verifica `accepted=yes`, un `childSessionKey` real y ningún error del validador.
5. Limpia la sesión puente temporal.

Mantén la compuerta en `mode: "run"` y omite `streamTo: "parent"`; las rutas de `mode: "session"` vinculadas a hilos y de relay de stream son pasos de integración separados y más ricos.

</Accordion>

## Compatibilidad con sandbox

Las sesiones ACP actualmente se ejecutan en el tiempo de ejecución del host, no dentro del sandbox de OpenClaw.

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, las creaciones ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` cuando necesites ejecución forzada por sandbox.

### Desde el comando `/acp`

Usa `/acp spawn` para control explícito del operador desde el chat cuando sea necesario.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Indicadores clave:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Consulta [Comandos de barra](/es/tools/slash-commands).

## Resolución de destino de sesión

La mayoría de las acciones de `/acp` aceptan un destino de sesión opcional (`session-key`, `session-id` o `session-label`).

Orden de resolución:

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - primero intenta la clave
   - luego el id de sesión con forma de UUID
   - luego la etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculado a una sesión ACP)
3. Alternativa de la sesión solicitante actual

Tanto las vinculaciones de conversación actual como las vinculaciones a hilos participan en el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro (`Unable to resolve session target: ...`).

## Modos de vinculación de creación

`/acp spawn` admite `--bind here|off`.

| Modo   | Comportamiento                                                          |
| ------ | ----------------------------------------------------------------------- |
| `here` | Vincula la conversación activa actual en su lugar; falla si no hay ninguna activa. |
| `off`  | No crea una vinculación a la conversación actual.                       |

Notas:

- `--bind here` es la ruta más simple para el operador para “hacer que este canal o chat esté respaldado por Codex”.
- `--bind here` no crea un hilo secundario.
- `--bind here` solo está disponible en canales que exponen compatibilidad con vinculación a la conversación actual.
- `--bind` y `--thread` no pueden combinarse en la misma llamada a `/acp spawn`.

## Modos de hilo de creación

`/acp spawn` admite `--thread auto|here|off`.

| Modo   | Comportamiento                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------- |
| `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo secundario cuando sea compatible. |
| `here` | Requiere el hilo activo actual; falla si no estás en uno.                                                 |
| `off`  | Sin vinculación. La sesión se inicia sin vincular.                                                        |

Notas:

- En superficies sin vinculación a hilos, el comportamiento predeterminado es, en la práctica, `off`.
- La creación vinculada a hilos requiere compatibilidad con la política del canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo secundario.

## Controles de ACP

| Comando              | Qué hace                                                   | Ejemplo                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación actual opcional o vinculación a hilo. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso de la sesión de destino.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de orientación a la sesión en ejecución. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula los destinos de hilo.        | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones del tiempo de ejecución y capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo de tiempo de ejecución para la sesión de destino. | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opciones de configuración del tiempo de ejecución. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la sobrescritura del directorio de trabajo del tiempo de ejecución. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de política de aprobación.             | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del tiempo de ejecución (segundos). | `/acp timeout 120`                                            |
| `/acp model`         | Establece la sobrescritura del modelo del tiempo de ejecución. | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las sobrescrituras de opciones del tiempo de ejecución de la sesión. | `/acp reset-options`                                          |
| `/acp sessions`      | Enumera sesiones ACP recientes desde el almacén.           | `/acp sessions`                                               |
| `/acp doctor`        | Estado del backend, capacidades y correcciones accionables. | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación. | `/acp install`                                                |

`/acp status` muestra las opciones efectivas del tiempo de ejecución, además de los identificadores de sesión a nivel de tiempo de ejecución y a nivel de backend. Los errores de control no compatible aparecen claramente cuando un backend carece de una capacidad. `/acp sessions` lee el almacén para la sesión vinculada actual o la sesión solicitante; los tokens de destino (`session-key`, `session-id` o `session-label`) se resuelven mediante el descubrimiento de sesiones del gateway, incluidas las raíces personalizadas `session.store` por agente.

## Mapeo de opciones del tiempo de ejecución

`/acp` tiene comandos convenientes y un setter genérico.

Operaciones equivalentes:

- `/acp model <id>` se asigna a la clave de configuración del tiempo de ejecución `model`.
- `/acp permissions <profile>` se asigna a la clave de configuración del tiempo de ejecución `approval_policy`.
- `/acp timeout <seconds>` se asigna a la clave de configuración del tiempo de ejecución `timeout`.
- `/acp cwd <path>` actualiza directamente la sobrescritura de `cwd` del tiempo de ejecución.
- `/acp set <key> <value>` es la ruta genérica.
  - Caso especial: `key=cwd` usa la ruta de sobrescritura de `cwd`.
- `/acp reset-options` borra todas las sobrescrituras del tiempo de ejecución para la sesión de destino.

## Harness acpx, configuración del Plugin y permisos

Para la configuración del harness acpx (alias de Claude Code / Codex / Gemini CLI), los
puentes MCP de plugin-tools y OpenClaw-tools, y los modos de permisos de ACP, consulta
[Agentes de ACP — configuración](/es/tools/acp-agents-setup).

## Solución de problemas

| Síntoma                                                                     | Causa probable                                                                   | Solución                                                                                                                                                                   |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Falta el Plugin de backend o está deshabilitado.                                 | Instala y habilita el Plugin de backend, luego ejecuta `/acp doctor`.                                                                                                      |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP está deshabilitado globalmente.                                              | Establece `acp.enabled=true`.                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | El despacho desde mensajes normales de hilo está deshabilitado.                  | Establece `acp.dispatch.enabled=true`.                                                                                                                                     |
| `ACP agent "<id>" is not allowed by policy`                                 | El agente no está en la lista permitida.                                         | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                                |
| `Unable to resolve session target: ...`                                     | Token de clave/id/etiqueta no válido.                                            | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | Se usó `--bind here` sin una conversación activa que admita vinculación.         | Ve al chat/canal de destino y vuelve a intentarlo, o usa una creación sin vinculación.                                                                                     |
| `Conversation bindings are unavailable for <channel>.`                      | El adaptador no tiene capacidad de vinculación ACP a la conversación actual.     | Usa `/acp spawn ... --thread ...` donde sea compatible, configura `bindings[]` de nivel superior o cambia a un canal compatible.                                         |
| `--thread here requires running /acp spawn inside an active ... thread`     | Se usó `--thread here` fuera del contexto de un hilo.                            | Ve al hilo de destino o usa `--thread auto`/`off`.                                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Otro usuario es propietario del destino de vinculación activo.                   | Vuelve a vincular como propietario o usa otra conversación o hilo.                                                                                                         |
| `Thread bindings are unavailable for <channel>.`                            | El adaptador no tiene capacidad de vinculación a hilos.                          | Usa `--thread off` o cambia a un adaptador/canal compatible.                                                                                                               |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | El tiempo de ejecución de ACP está del lado del host; la sesión solicitante está en sandbox. | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la creación ACP desde una sesión sin sandbox.                                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Se solicitó `sandbox="require"` para el tiempo de ejecución ACP.                 | Usa `runtime="subagent"` para sandbox obligatorio, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                        |
| Missing ACP metadata for bound session                                      | Metadatos de sesión ACP obsoletos/eliminados.                                    | Vuelve a crear con `/acp spawn`, luego vuelve a vincular/enfocar el hilo.                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloquea escrituras/ejecución en una sesión ACP no interactiva.  | Establece `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia el gateway. Consulta [Configuración de permisos](/es/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Las solicitudes de permisos están bloqueadas por `permissionMode`/`nonInteractivePermissions`. | Comprueba los registros del gateway para `AcpRuntimeError`. Para permisos completos, establece `permissionMode=approve-all`; para una degradación elegante, establece `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | El proceso del harness terminó pero la sesión ACP no informó de la finalización. | Supervisa con `ps aux \| grep acpx`; mata manualmente los procesos obsoletos.                                                                                               |

## Relacionado

- [Sub-agents](/es/tools/subagents)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [Envío de agente](/es/tools/agent-send)
