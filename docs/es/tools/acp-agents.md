---
read_when:
    - Ejecución de arneses de coding mediante ACP
    - Configuración de sesiones ACP vinculadas a conversaciones en canales de mensajería
    - Vinculación de una conversación de un canal de mensajería a una sesión ACP persistente
    - Solución de problemas del backend de ACP y del cableado del Plugin
    - Depuración de la entrega de finalización de ACP o de los bucles entre agentes
    - Uso de comandos `/acp` desde el chat
summary: Usa sesiones de runtime de ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP y otros agentes con arnés
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-22T04:27:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permiten que OpenClaw ejecute arneses externos de coding (por ejemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI y otros arneses ACPX compatibles) mediante un plugin de backend ACP.

Si le pides a OpenClaw en lenguaje natural "ejecuta esto en Codex" o "inicia Claude Code en un hilo", OpenClaw debe enrutar esa solicitud al runtime de ACP (no al runtime nativo de subagentes). Cada creación de sesión ACP se registra como una [tarea en segundo plano](/es/automation/tasks).

Si quieres que Codex o Claude Code se conecten como un cliente MCP externo directamente
a conversaciones de canal existentes de OpenClaw, usa
[`openclaw mcp serve`](/cli/mcp) en lugar de ACP.

## ¿Qué página quiero?

Hay tres superficies cercanas que es fácil confundir:

| Quieres...                                                                     | Usa esto                              | Notas                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Ejecutar Codex, Claude Code, Gemini CLI u otro arnés externo _a través de_ OpenClaw | Esta página: agentes ACP                 | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de runtime |
| Exponer una sesión de OpenClaw Gateway _como_ un servidor ACP para un editor o cliente      | [`openclaw acp`](/cli/acp)            | Modo puente. El IDE/cliente habla ACP con OpenClaw por stdio/WebSocket                                          |
| Reutilizar una CLI local de IA como modelo alternativo solo de texto                                 | [CLI Backends](/es/gateway/cli-backends) | No es ACP. Sin herramientas de OpenClaw, sin controles ACP, sin runtime de arnés                                             |

## ¿Funciona esto nada más instalarlo?

Normalmente, sí.

- Las instalaciones nuevas ahora incluyen el plugin de runtime `acpx` habilitado de forma predeterminada.
- El plugin incluido `acpx` prefiere su binario `acpx` fijado local al plugin.
- Al iniciar, OpenClaw sondea ese binario y lo autorrepara si hace falta.
- Empieza con `/acp doctor` si quieres una comprobación rápida de disponibilidad.

Lo que todavía puede ocurrir en el primer uso:

- Un adaptador de arnés de destino puede descargarse bajo demanda con `npx` la primera vez que uses ese arnés.
- La autenticación del proveedor debe seguir existiendo en el host para ese arnés.
- Si el host no tiene acceso a npm/red, las descargas del adaptador en la primera ejecución pueden fallar hasta que las cachés se precalienten o el adaptador se instale de otra forma.

Ejemplos:

- `/acp spawn codex`: OpenClaw debería estar listo para arrancar `acpx`, pero el adaptador ACP de Codex puede seguir necesitando una descarga en la primera ejecución.
- `/acp spawn claude`: igual para el adaptador ACP de Claude, además de la autenticación del lado de Claude en ese host.

## Flujo rápido para operadores

Usa esto cuando quieras un manual práctico de `/acp`:

1. Crea una sesión:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabaja en la conversación o hilo vinculado (o apunta explícitamente a esa clave de sesión).
3. Comprueba el estado del runtime:
   - `/acp status`
4. Ajusta las opciones del runtime según sea necesario:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Empuja una sesión activa sin reemplazar el contexto:
   - `/acp steer tighten logging and continue`
6. Detén el trabajo:
   - `/acp cancel` (detener el turno actual), o
   - `/acp close` (cerrar sesión + eliminar vinculaciones)

## Inicio rápido para personas

Ejemplos de solicitudes naturales:

- "Vincula este canal de Discord a Codex."
- "Inicia una sesión persistente de Codex en un hilo aquí y mantenla enfocada."
- "Ejecuta esto como una sesión ACP de Claude Code de una sola vez y resume el resultado."
- "Vincula este chat de iMessage a Codex y mantén los seguimientos en el mismo workspace."
- "Usa Gemini CLI para esta tarea en un hilo y luego mantén los seguimientos en ese mismo hilo."

Qué debería hacer OpenClaw:

1. Elegir `runtime: "acp"`.
2. Resolver el destino de arnés solicitado (`agentId`, por ejemplo `codex`).
3. Si se solicita vinculación a la conversación actual y el canal activo la admite, vincular la sesión ACP a esa conversación.
4. En caso contrario, si se solicita vinculación a hilo y el canal actual la admite, vincular la sesión ACP al hilo.
5. Enrutar los mensajes vinculados de seguimiento a esa misma sesión ACP hasta que se desenfoque/cierre/caduque.

## ACP frente a subagentes

Usa ACP cuando quieras un runtime de arnés externo. Usa subagentes cuando quieras ejecuciones delegadas nativas de OpenClaw.

| Área          | Sesión ACP                           | Ejecución de subagente                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin de backend ACP (por ejemplo acpx) | Runtime nativo de subagentes de OpenClaw  |
| Clave de sesión   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandos principales | `/acp ...`                            | `/subagents ...`                   |
| Herramienta de creación    | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predeterminado) |

Consulta también [Sub-agents](/es/tools/subagents).

## Cómo ACP ejecuta Claude Code

Para Claude Code a través de ACP, la pila es:

1. Plano de control de sesión ACP de OpenClaw
2. plugin de runtime incluido `acpx`
3. Adaptador ACP de Claude
4. Runtime/maquinaria de sesión del lado de Claude

Distinción importante:

- Claude mediante ACP es una sesión de arnés con controles ACP, reanudación de sesión, seguimiento de tareas en segundo plano y vinculación opcional a conversación/hilo.
- Los backends de CLI son runtimes alternativos locales separados solo de texto. Consulta [CLI Backends](/es/gateway/cli-backends).

Para operadores, la regla práctica es:

- si quieres `/acp spawn`, sesiones vinculables, controles de runtime o trabajo persistente con arnés: usa ACP
- si quieres un simple respaldo local de texto mediante la CLI sin procesar: usa CLI Backends

## Sesiones vinculadas

### Vinculaciones a la conversación actual

Usa `/acp spawn <harness> --bind here` cuando quieras que la conversación actual se convierta en un workspace ACP duradero sin crear un hilo secundario.

Comportamiento:

- OpenClaw sigue siendo propietario del transporte del canal, la autenticación, la seguridad y la entrega.
- La conversación actual queda fijada a la clave de sesión ACP creada.
- Los mensajes de seguimiento en esa conversación se enrutan a la misma sesión ACP.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión y elimina la vinculación de la conversación actual.

Qué significa esto en la práctica:

- `--bind here` mantiene la misma superficie de chat. En Discord, el canal actual sigue siendo el canal actual.
- `--bind here` aún puede crear una nueva sesión ACP si estás iniciando trabajo nuevo. La vinculación adjunta esa sesión a la conversación actual.
- `--bind here` no crea por sí mismo un hilo secundario de Discord ni un tema de Telegram.
- El runtime ACP aún puede tener su propio directorio de trabajo (`cwd`) o workspace en disco administrado por backend. Ese workspace de runtime está separado de la superficie de chat y no implica un nuevo hilo de mensajería.
- Si creas una sesión para un agente ACP distinto y no pasas `--cwd`, OpenClaw hereda por defecto el workspace del **agente de destino**, no del solicitante.
- Si esa ruta de workspace heredada no existe (`ENOENT`/`ENOTDIR`), OpenClaw recurre al `cwd` predeterminado del backend en lugar de reutilizar silenciosamente el árbol incorrecto.
- Si el workspace heredado existe pero no se puede acceder a él (por ejemplo `EACCES`), la creación devuelve el error real de acceso en lugar de descartar `cwd`.

Modelo mental:

- superficie de chat: donde la gente sigue hablando (`canal de Discord`, `tema de Telegram`, `chat de iMessage`)
- sesión ACP: el estado duradero del runtime de Codex/Claude/Gemini al que OpenClaw enruta
- hilo/tema secundario: una superficie extra opcional de mensajería creada solo por `--thread ...`
- workspace de runtime: la ubicación del sistema de archivos donde se ejecuta el arnés (`cwd`, checkout del repo, workspace del backend)

Ejemplos:

- `/acp spawn codex --bind here`: mantener este chat, crear o adjuntar una sesión ACP de Codex y enrutar futuros mensajes aquí hacia ella
- `/acp spawn codex --thread auto`: OpenClaw puede crear un hilo/tema secundario y vincular allí la sesión ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: misma vinculación de chat que arriba, pero Codex se ejecuta en `/workspace/repo`

Compatibilidad de vinculación a conversación actual:

- Los canales de chat/mensajes que anuncian compatibilidad con vinculación a conversación actual pueden usar `--bind here` mediante la ruta compartida de vinculación de conversaciones.
- Los canales con semántica personalizada de hilo/tema aún pueden proporcionar canonicalización específica del canal detrás de la misma interfaz compartida.
- `--bind here` siempre significa "vincular la conversación actual en su lugar".
- Las vinculaciones genéricas a la conversación actual usan el almacén compartido de vinculaciones de OpenClaw y sobreviven a reinicios normales del Gateway.

Notas:

- `--bind here` y `--thread ...` son mutuamente excluyentes en `/acp spawn`.
- En Discord, `--bind here` vincula el canal o hilo actual en su lugar. `spawnAcpSessions` solo es necesario cuando OpenClaw tiene que crear un hilo secundario para `--thread auto|here`.
- Si el canal activo no expone vinculaciones ACP a la conversación actual, OpenClaw devuelve un mensaje claro de no compatible.
- `resume` y las preguntas sobre "sesión nueva" son cuestiones de sesión ACP, no del canal. Puedes reutilizar o reemplazar el estado del runtime sin cambiar la superficie actual de chat.

### Sesiones vinculadas a hilo

Cuando las vinculaciones a hilo están habilitadas para un adaptador de canal, las sesiones ACP pueden vincularse a hilos:

- OpenClaw vincula un hilo a una sesión ACP de destino.
- Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
- La salida de ACP se entrega de vuelta al mismo hilo.
- Desenfoque/cierre/archivo/tiempo de espera por inactividad o caducidad por edad máxima elimina la vinculación.

La compatibilidad de vinculación a hilo depende del adaptador. Si el adaptador de canal activo no admite vinculaciones a hilo, OpenClaw devuelve un mensaje claro de no compatible/no disponible.

Flags de función necesarios para ACP vinculado a hilo:

- `acp.enabled=true`
- `acp.dispatch.enabled` está activado de forma predeterminada (establece `false` para pausar el despacho ACP)
- Flag de creación de hilos ACP del adaptador de canal habilitada (específica del adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canales compatibles con hilos

- Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
- Compatibilidad integrada actual:
  - Hilos/canales de Discord
  - Temas de Telegram (temas de foro en grupos/supergrupos y temas de MD)
- Los canales de plugin pueden añadir compatibilidad mediante la misma interfaz de vinculación.

## Configuración específica del canal

Para flujos no efímeros, configura vinculaciones ACP persistentes en entradas `bindings[]` de nivel superior.

### Modelo de vinculación

- `bindings[].type="acp"` marca una vinculación persistente de conversación ACP.
- `bindings[].match` identifica la conversación de destino:
  - Canal o hilo de Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Tema de foro de Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat de MD/grupo de BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:* >"`
    Prefiere `chat_id:*` o `chat_identifier:*` para vinculaciones estables de grupos.
  - Chat de MD/grupo de iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:* >"`
    Prefiere `chat_id:*` para vinculaciones estables de grupos.
- `bindings[].agentId` es el ID del agente OpenClaw propietario.
- Las anulaciones ACP opcionales viven en `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valores predeterminados de runtime por agente

Usa `agents.list[].runtime` para definir valores predeterminados de ACP una vez por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID del arnés, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedencia de anulación para sesiones ACP vinculadas:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valores predeterminados globales de ACP (por ejemplo `acp.backend`)

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
- En conversaciones vinculadas, `/new` y `/reset` restablecen la misma clave de sesión ACP en su lugar.
- Las vinculaciones temporales de runtime (por ejemplo las creadas por flujos de enfoque de hilos) siguen aplicándose donde existan.
- Para creaciones ACP entre agentes sin `cwd` explícito, OpenClaw hereda el workspace del agente de destino desde la configuración del agente.
- Las rutas heredadas de workspace que faltan recurren al `cwd` predeterminado del backend; los fallos de acceso en rutas existentes aparecen como errores de creación.

## Iniciar sesiones ACP (interfaces)

### Desde `sessions_spawn`

Usa `runtime: "acp"` para iniciar una sesión ACP desde un turno de agente o una llamada de herramienta.

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
- `mode: "session"` requiere `thread: true` para mantener una conversación persistente vinculada.

Detalles de la interfaz:

- `task` (obligatorio): prompt inicial enviado a la sesión ACP.
- `runtime` (obligatorio para ACP): debe ser `"acp"`.
- `agentId` (opcional): ID del arnés ACP de destino. Recurre a `acp.defaultAgent` si está establecido.
- `thread` (opcional, predeterminado `false`): solicita flujo de vinculación a hilo donde sea compatible.
- `mode` (opcional): `run` (una sola vez) o `session` (persistente).
  - el valor predeterminado es `run`
  - si `thread: true` y se omite el modo, OpenClaw puede usar comportamiento persistente por defecto según la ruta de runtime
  - `mode: "session"` requiere `thread: true`
- `cwd` (opcional): directorio de trabajo solicitado para el runtime (validado por la política del backend/runtime). Si se omite, la creación ACP hereda el workspace del agente de destino cuando está configurado; las rutas heredadas que faltan recurren a los valores predeterminados del backend, mientras que los errores reales de acceso se devuelven.
- `label` (opcional): etiqueta visible para el operador usada en el texto de sesión/banner.
- `resumeSessionId` (opcional): reanuda una sesión ACP existente en lugar de crear una nueva. El agente reproduce su historial de conversación mediante `session/load`. Requiere `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resúmenes del progreso de la ejecución ACP inicial de vuelta a la sesión solicitante como eventos del sistema.
  - Cuando está disponible, las respuestas aceptadas incluyen `streamLogPath` apuntando a un registro JSONL con alcance de sesión (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo de retransmisión.

## Modelo de entrega

Las sesiones ACP pueden ser workspaces interactivos o trabajo en segundo plano propiedad del padre. La ruta de entrega depende de esa forma.

### Sesiones ACP interactivas

Las sesiones interactivas están pensadas para seguir hablando en una superficie visible de chat:

- `/acp spawn ... --bind here` vincula la conversación actual a la sesión ACP.
- `/acp spawn ... --thread ...` vincula un hilo/tema del canal a la sesión ACP.
- Las `bindings[].type="acp"` persistentes configuradas enrutan las conversaciones coincidentes a la misma sesión ACP.

Los mensajes de seguimiento en la conversación vinculada se enrutan directamente a la sesión ACP, y la salida ACP se entrega de vuelta a ese mismo canal/hilo/tema.

### Sesiones ACP de una sola vez propiedad del padre

Las sesiones ACP de una sola vez creadas por otra ejecución de agente son hijas en segundo plano, similares a los subagentes:

- El padre solicita trabajo con `sessions_spawn({ runtime: "acp", mode: "run" })`.
- La hija se ejecuta en su propia sesión de arnés ACP.
- La finalización se informa de vuelta mediante la ruta interna de anuncio de finalización de tareas.
- El padre reescribe el resultado de la hija con voz normal de asistente cuando resulta útil una respuesta visible para el usuario.

No trates esta ruta como un chat entre iguales entre padre e hija. La hija ya tiene un canal de finalización de vuelta al padre.

### `sessions_send` y entrega A2A

`sessions_send` puede dirigirse a otra sesión después de la creación. Para sesiones normales entre iguales, OpenClaw usa una ruta de seguimiento agent-to-agent (A2A) después de inyectar el mensaje:

- espera la respuesta de la sesión de destino
- opcionalmente permite que solicitante y destino intercambien un número acotado de turnos de seguimiento
- pide al destino que produzca un mensaje de anuncio
- entrega ese anuncio al canal o hilo visible

Esa ruta A2A es un respaldo para envíos entre iguales donde el remitente necesita un seguimiento visible. Sigue habilitada cuando una sesión no relacionada puede ver y enviar mensajes a un destino ACP, por ejemplo bajo ajustes amplios de `tools.sessions.visibility`.

OpenClaw omite el seguimiento A2A solo cuando el solicitante es el padre de su propia hija ACP de una sola vez propiedad del padre. En ese caso, ejecutar A2A además de la finalización de tarea puede despertar al padre con el resultado de la hija, reenviar la respuesta del padre de nuevo a la hija y crear un bucle de eco padre/hija. El resultado de `sessions_send` informa `delivery.status="skipped"` para ese caso de hija propia porque la ruta de finalización ya es responsable del resultado.

### Reanudar una sesión existente

Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de empezar desde cero. El agente reproduce su historial de conversación mediante `session/load`, por lo que retoma el trabajo con todo el contexto previo.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso habituales:

- Entregar una sesión de Codex de tu portátil a tu teléfono: dile a tu agente que continúe donde lo dejaste
- Continuar una sesión de coding que empezaste interactivamente en la CLI, ahora sin interfaz mediante tu agente
- Retomar trabajo que fue interrumpido por un reinicio del Gateway o un tiempo de espera por inactividad

Notas:

- `resumeSessionId` requiere `runtime: "acp"`; devuelve un error si se usa con el runtime de subagente.
- `resumeSessionId` restaura el historial de conversación ACP upstream; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, por lo que `mode: "session"` sigue requiriendo `thread: true`.
- El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
- Si no se encuentra el ID de sesión, la creación falla con un error claro; no hay respaldo silencioso a una sesión nueva.

### Prueba de humo para operadores

Usa esto después de desplegar un Gateway cuando quieras una comprobación rápida en vivo de que la creación ACP
realmente funciona de extremo a extremo, no solo que supera pruebas unitarias.

Puerta recomendada:

1. Verifica la versión/commit del Gateway desplegado en el host de destino.
2. Confirma que el código fuente desplegado incluye la aceptación de linaje ACP en
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abre una sesión puente ACPX temporal a un agente en vivo (por ejemplo
   `razor(main)` en `jpclawhq`).
4. Pide a ese agente que llame a `sessions_spawn` con:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tarea: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifica que el agente informe:
   - `accepted=yes`
   - una `childSessionKey` real
   - sin error de validador
6. Limpia la sesión puente ACPX temporal.

Prompt de ejemplo para el agente en vivo:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notas:

- Mantén esta prueba de humo en `mode: "run"` salvo que estés probando
  intencionadamente sesiones ACP persistentes vinculadas a hilo.
- No exijas `streamTo: "parent"` para la comprobación básica. Esa ruta depende de
  las capacidades del solicitante/sesión y es una comprobación de integración aparte.
- Trata la prueba de `mode: "session"` vinculado a hilo como una segunda pasada
  de integración más completa desde un hilo real de Discord o un tema de Telegram.

## Compatibilidad con sandbox

Las sesiones ACP actualmente se ejecutan en el runtime del host, no dentro del sandbox de OpenClaw.

Limitaciones actuales:

- Si la sesión solicitante está en sandbox, las creaciones ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` no admite `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` cuando necesites ejecución impuesta por sandbox.

### Desde el comando `/acp`

Usa `/acp spawn` para un control explícito del operador desde el chat cuando sea necesario.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Flags principales:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Consulta [Comandos slash](/es/tools/slash-commands).

## Resolución de destino de sesión

La mayoría de las acciones `/acp` aceptan un destino de sesión opcional (`session-key`, `session-id` o `session-label`).

Orden de resolución:

1. Argumento de destino explícito (o `--session` para `/acp steer`)
   - intenta por clave
   - luego por ID de sesión con forma UUID
   - luego por etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculada a una sesión ACP)
3. Respaldo a la sesión actual del solicitante

Tanto las vinculaciones a la conversación actual como las vinculaciones a hilo participan en el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro (`Unable to resolve session target: ...`).

## Modos de vinculación en la creación

`/acp spawn` admite `--bind here|off`.

| Modo   | Comportamiento                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | Vincula la conversación activa actual en su lugar; falla si no hay ninguna activa. |
| `off`  | No crea una vinculación a la conversación actual.                          |

Notas:

- `--bind here` es la ruta más sencilla para operadores para "hacer que este canal o chat esté respaldado por Codex".
- `--bind here` no crea un hilo secundario.
- `--bind here` solo está disponible en canales que exponen compatibilidad con vinculación a la conversación actual.
- `--bind` y `--thread` no pueden combinarse en la misma llamada a `/acp spawn`.

## Modos de hilo en la creación

`/acp spawn` admite `--thread auto|here|off`.

| Modo   | Comportamiento                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo secundario cuando sea compatible. |
| `here` | Requiere el hilo activo actual; falla si no estás en uno.                                                  |
| `off`  | Sin vinculación. La sesión se inicia sin vincular.                                                                 |

Notas:

- En superficies sin vinculación a hilos, el comportamiento predeterminado es efectivamente `off`.
- La creación de sesiones vinculadas a hilo requiere compatibilidad con la política del canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo secundario.

## Controles ACP

Familia de comandos disponibles:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` muestra las opciones efectivas del runtime y, cuando están disponibles, tanto los identificadores de sesión a nivel de runtime como a nivel de backend.

Algunos controles dependen de las capacidades del backend. Si un backend no admite un control, OpenClaw devuelve un error claro de control no compatible.

## Recetario de comandos ACP

| Comando              | Qué hace                                              | Ejemplo                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación opcional a conversación actual o hilo. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso de la sesión de destino.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de guía a una sesión en ejecución.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula los destinos de hilo.                  | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de runtime y capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo de runtime para la sesión de destino.                      | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opción de configuración de runtime.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece la anulación del directorio de trabajo del runtime.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de política de aprobación.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del runtime (segundos).                            | `/acp timeout 120`                                            |
| `/acp model`         | Establece la anulación del modelo de runtime.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las anulaciones de opciones de runtime de la sesión.                  | `/acp reset-options`                                          |
| `/acp sessions`      | Lista sesiones ACP recientes del almacén.                      | `/acp sessions`                                               |
| `/acp doctor`        | Estado del backend, capacidades y correcciones accionables.           | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación.             | `/acp install`                                                |

`/acp sessions` lee el almacén para la sesión actual vinculada o del solicitante. Los comandos que aceptan tokens `session-key`, `session-id` o `session-label` resuelven destinos mediante el descubrimiento de sesiones del Gateway, incluidas raíces personalizadas `session.store` por agente.

## Asignación de opciones de runtime

`/acp` tiene comandos de conveniencia y un setter genérico.

Operaciones equivalentes:

- `/acp model <id>` se asigna a la clave de configuración de runtime `model`.
- `/acp permissions <profile>` se asigna a la clave de configuración de runtime `approval_policy`.
- `/acp timeout <seconds>` se asigna a la clave de configuración de runtime `timeout`.
- `/acp cwd <path>` actualiza directamente la anulación de `cwd` del runtime.
- `/acp set <key> <value>` es la ruta genérica.
  - Caso especial: `key=cwd` usa la ruta de anulación de `cwd`.
- `/acp reset-options` borra todas las anulaciones de runtime de la sesión de destino.

## Compatibilidad actual de arneses acpx

Alias integrados actuales de arneses acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Cuando OpenClaw usa el backend acpx, prefiere estos valores para `agentId` salvo que tu configuración de acpx defina alias personalizados de agentes.
Si tu instalación local de Cursor aún expone ACP como `agent acp`, reemplaza el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede dirigirse a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape sin procesar es una función de la CLI de acpx (no la ruta normal `agentId` de OpenClaw).

## Configuración obligatoria

Base ACP del core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configuración de vinculación a hilo es específica del adaptador de canal. Ejemplo para Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Si la creación ACP vinculada a hilo no funciona, verifica primero la flag de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Las vinculaciones a la conversación actual no requieren creación de hilo secundario. Requieren un contexto activo de conversación y un adaptador de canal que exponga vinculaciones de conversación ACP.

Consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del Plugin para el backend acpx

Las instalaciones nuevas incluyen el plugin de runtime `acpx` habilitado de forma predeterminada, por lo que ACP
normalmente funciona sin un paso manual de instalación del plugin.

Empieza con:

```text
/acp doctor
```

Si deshabilitaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres
cambiar a un checkout local de desarrollo, usa la ruta explícita del plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalación local del workspace durante el desarrollo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Luego verifica el estado del backend:

```text
/acp doctor
```

### Configuración de comando y versión de acpx

De forma predeterminada, el plugin incluido del backend acpx (`acpx`) usa el binario fijado local al plugin:

1. El comando usa por defecto `node_modules/.bin/acpx` local al plugin dentro del paquete del plugin ACPX.
2. La versión esperada usa por defecto el pin de la extensión.
3. El inicio registra inmediatamente el backend ACP como no listo.
4. Un trabajo de aseguramiento en segundo plano verifica `acpx --version`.
5. Si el binario local al plugin falta o no coincide, ejecuta:
   `npm install --omit=dev --no-save acpx@<pinned>` y vuelve a verificar.

Puedes reemplazar el comando/la versión en la configuración del plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Notas:

- `command` acepta una ruta absoluta, una ruta relativa o un nombre de comando (`acpx`).
- Las rutas relativas se resuelven desde el directorio del workspace de OpenClaw.
- `expectedVersion: "any"` deshabilita la coincidencia estricta de versión.
- Cuando `command` apunta a un binario/ruta personalizada, la autoinstalación local al plugin se deshabilita.
- El inicio de OpenClaw sigue siendo no bloqueante mientras se ejecuta la comprobación de estado del backend.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las dependencias de runtime de acpx
(binarios específicos de plataforma) se instalan automáticamente
mediante un hook postinstall. Si la instalación automática falla, el Gateway sigue iniciándose
con normalidad e informa de la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de Plugin

De forma predeterminada, las sesiones ACPX **no** exponen herramientas registradas por plugins de OpenClaw al
arnés ACP.

Si quieres que agentes ACP como Codex o Claude Code llamen a herramientas instaladas
de plugins de OpenClaw como recuperación/almacenamiento de memory, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en el bootstrap
  de la sesión ACPX.
- Expone herramientas de plugins ya registradas por plugins de OpenClaw instalados y habilitados.
- Mantiene la función explícita y desactivada por defecto.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del arnés ACP.
- Los agentes ACP obtienen acceso solo a herramientas de plugins ya activas en el Gateway.
- Trata esto como el mismo límite de confianza que permitir que esos plugins se ejecuten en
  el propio OpenClaw.
- Revisa los plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de plugins es una
comodidad adicional de activación opcional, no un reemplazo de la configuración genérica de servidor MCP.

### Configuración del tiempo de espera del runtime

El plugin incluido `acpx` establece por defecto los turnos del runtime integrado con un
tiempo de espera de 120 segundos. Esto da a arneses más lentos como Gemini CLI tiempo suficiente para completar
el inicio e inicialización de ACP. Reemplázalo si tu host necesita un
límite distinto de runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Reinicia el Gateway después de cambiar este valor.

### Configuración del agente de sonda de estado

El plugin incluido `acpx` sondea un agente de arnés mientras decide si el
backend de runtime integrado está listo. El valor predeterminado es `codex`. Si tu despliegue
usa un agente ACP predeterminado distinto, establece el agente de sonda con el mismo ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Reinicia el Gateway después de cambiar este valor.

## Configuración de permisos

Las sesiones ACP se ejecutan sin interacción: no hay TTY para aprobar o denegar prompts de permisos de escritura de archivos y ejecución de shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos de arnés ACPX son independientes de las aprobaciones de ejecución de OpenClaw y de flags de omisión del proveedor en CLI Backends, como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia a nivel de arnés para sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente del arnés sin pedir confirmación.

| Valor           | Comportamiento                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos de shell.          |
| `approve-reads` | Aprueba automáticamente solo las lecturas; las escrituras y la ejecución requieren prompts. |
| `deny-all`      | Deniega todos los prompts de permisos.                              |

### `nonInteractivePermissions`

Controla qué ocurre cuando se mostraría un prompt de permisos pero no hay un TTY interactivo disponible (que es siempre el caso en las sesiones ACP).

| Valor  | Comportamiento                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Aborta la sesión con `AcpRuntimeError`. **(predeterminado)**           |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación elegante). |

### Configuración

Configúralo mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia el Gateway después de cambiar estos valores.

> **Importante:** OpenClaw actualmente usa como valores predeterminados `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active un prompt de permisos puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden con elegancia en lugar de fallar.

## Solución de problemas

| Síntoma                                                                     | Causa probable                                                                    | Corrección                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Falta el plugin de backend o está deshabilitado.                                             | Instala y habilita el plugin de backend, y luego ejecuta `/acp doctor`.                                                                                                        |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP está deshabilitado globalmente.                                                          | Establece `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | El despacho desde mensajes normales del hilo está deshabilitado.                                  | Establece `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | El agente no está en la lista de permitidos.                                                         | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                              |
| `Unable to resolve session target: ...`                                     | Token de clave/id/etiqueta incorrecto.                                                         | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` se usó sin una conversación activa que se pueda vincular.                     | Muévete al chat/canal de destino y vuelve a intentarlo, o usa una creación sin vinculación.                                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | El adaptador no tiene capacidad de vinculación ACP a la conversación actual.                      | Usa `/acp spawn ... --thread ...` donde sea compatible, configura `bindings[]` de nivel superior, o cambia a un canal compatible.                                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` se usó fuera de un contexto de hilo.                                  | Muévete al hilo de destino o usa `--thread auto`/`off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Otro usuario es propietario del destino de vinculación activo.                                    | Vuelve a vincular como propietario o usa otra conversación o hilo.                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | El adaptador no tiene capacidad de vinculación a hilos.                                        | Usa `--thread off` o cambia a un adaptador/canal compatible.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | El runtime de ACP está en el host; la sesión solicitante está en sandbox.                       | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la creación ACP desde una sesión sin sandbox.                                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Se solicitó `sandbox="require"` para runtime ACP.                                  | Usa `runtime="subagent"` para sandbox obligatorio, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                               |
| Faltan metadatos ACP para la sesión vinculada                                      | Metadatos ACP obsoletos/eliminados de la sesión.                                             | Vuelve a crearla con `/acp spawn`, y luego vuelve a vincular/enfocar el hilo.                                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloquea escrituras/ejecución en una sesión ACP no interactiva.             | Establece `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia el Gateway. Consulta [Configuración de permisos](#permission-configuration).                 |
| La sesión ACP falla pronto y con poca salida                                  | Los prompts de permisos están bloqueados por `permissionMode`/`nonInteractivePermissions`. | Revisa los registros del Gateway para ver `AcpRuntimeError`. Para permisos completos, establece `permissionMode=approve-all`; para una degradación elegante, establece `nonInteractivePermissions=deny`. |
| La sesión ACP se queda bloqueada indefinidamente tras completar el trabajo                       | El proceso del arnés terminó, pero la sesión ACP no informó de la finalización.             | Supervísalo con `ps aux \| grep acpx`; mata manualmente los procesos obsoletos.                                                                                                |
