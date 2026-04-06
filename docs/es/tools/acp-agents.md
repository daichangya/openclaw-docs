---
read_when:
    - Ejecutar harnesses de programación a través de ACP
    - Configurar sesiones ACP vinculadas a conversaciones en canales de mensajería
    - Vincular una conversación de un canal de mensajes a una sesión ACP persistente
    - Solucionar problemas del backend ACP y del cableado de plugins
    - Operar comandos `/acp` desde el chat
summary: Usa sesiones de tiempo de ejecución ACP para Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP y otros agentes de harness
title: Agentes ACP
x-i18n:
    generated_at: "2026-04-06T03:13:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 302f3fe25b1ffe0576592b6e0ad9e8a5781fa5702b31d508d9ba8908f7df33bd
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agentes ACP

Las sesiones de [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permiten que OpenClaw ejecute harnesses de programación externos (por ejemplo Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI y otros harnesses ACPX compatibles) a través de un plugin backend ACP.

Si le pides a OpenClaw en lenguaje natural que “ejecute esto en Codex” o “inicie Claude Code en un hilo”, OpenClaw debería enrutar esa solicitud al tiempo de ejecución ACP (no al tiempo de ejecución nativo de subagentes). Cada creación de sesión ACP se registra como una [tarea en segundo plano](/es/automation/tasks).

Si quieres que Codex o Claude Code se conecten como cliente MCP externo directamente
a conversaciones de canal existentes de OpenClaw, usa [`openclaw mcp serve`](/cli/mcp)
en lugar de ACP.

## ¿Qué página quiero?

Hay tres superficies cercanas que es fácil confundir:

| Quieres...                                                                        | Usa esto                  | Notas                                                                                                            |
| --------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Ejecutar Codex, Claude Code, Gemini CLI u otro harness externo _a través de_ OpenClaw | Esta página: agentes ACP | Sesiones vinculadas al chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tareas en segundo plano, controles de tiempo de ejecución |
| Exponer una sesión de OpenClaw Gateway _como_ un servidor ACP para un editor o cliente | [`openclaw acp`](/cli/acp) | Modo puente. El IDE/cliente habla ACP con OpenClaw por stdio/WebSocket                                         |

## ¿Funciona de inmediato?

Normalmente sí.

- Las instalaciones nuevas ahora incluyen el plugin de tiempo de ejecución empaquetado `acpx` habilitado de forma predeterminada.
- El plugin empaquetado `acpx` prefiere su binario `acpx` fijado localmente en el plugin.
- Al iniciar, OpenClaw sondea ese binario y lo autorrepara si es necesario.
- Empieza con `/acp doctor` si quieres una comprobación rápida de disponibilidad.

Lo que todavía puede pasar en el primer uso:

- Un adaptador de harness de destino puede obtenerse bajo demanda con `npx` la primera vez que uses ese harness.
- La autenticación del proveedor todavía tiene que existir en el host para ese harness.
- Si el host no tiene acceso a npm/red, las obtenciones del adaptador en la primera ejecución pueden fallar hasta que las cachés se precalienten o el adaptador se instale de otra forma.

Ejemplos:

- `/acp spawn codex`: OpenClaw debería estar listo para inicializar `acpx`, pero el adaptador ACP de Codex todavía puede necesitar una obtención en la primera ejecución.
- `/acp spawn claude`: lo mismo para el adaptador ACP de Claude, más la autenticación del lado de Claude en ese host.

## Flujo rápido para operadores

Usa esto si quieres una guía práctica de `/acp`:

1. Crea una sesión:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Trabaja en la conversación o hilo vinculado (o apunta explícitamente a esa clave de sesión).
3. Comprueba el estado del tiempo de ejecución:
   - `/acp status`
4. Ajusta las opciones de tiempo de ejecución según sea necesario:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Da una indicación a una sesión activa sin reemplazar el contexto:
   - `/acp steer tighten logging and continue`
6. Detén el trabajo:
   - `/acp cancel` (detener el turno actual), o
   - `/acp close` (cerrar la sesión + eliminar vínculos)

## Inicio rápido para personas

Ejemplos de solicitudes naturales:

- "Vincula este canal de Discord a Codex."
- "Inicia una sesión persistente de Codex en un hilo aquí y mantenla enfocada."
- "Ejecuta esto como una sesión ACP de Claude Code de una sola vez y resume el resultado."
- "Vincula este chat de iMessage a Codex y mantén los seguimientos en el mismo workspace."
- "Usa Gemini CLI para esta tarea en un hilo y luego mantén los seguimientos en ese mismo hilo."

Lo que OpenClaw debería hacer:

1. Elegir `runtime: "acp"`.
2. Resolver el destino del harness solicitado (`agentId`, por ejemplo `codex`).
3. Si se solicita la vinculación a la conversación actual y el canal activo lo admite, vincular la sesión ACP a esa conversación.
4. En caso contrario, si se solicita vinculación a hilo y el canal actual lo admite, vincular la sesión ACP al hilo.
5. Enrutar los mensajes de seguimiento vinculados a esa misma sesión ACP hasta que se desfocalice/cierre/expire.

## ACP frente a subagentes

Usa ACP cuando quieras un tiempo de ejecución de harness externo. Usa subagentes cuando quieras ejecuciones delegadas nativas de OpenClaw.

| Área           | Sesión ACP                            | Ejecución de subagente               |
| -------------- | ------------------------------------- | ------------------------------------ |
| Tiempo de ejecución | Plugin backend ACP (por ejemplo acpx) | Tiempo de ejecución nativo de subagente de OpenClaw |
| Clave de sesión | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`    |
| Comandos principales | `/acp ...`                       | `/subagents ...`                     |
| Herramienta de creación | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (tiempo de ejecución predeterminado) |

Consulta también [Subagentes](/es/tools/subagents).

## Cómo ACP ejecuta Claude Code

Para Claude Code a través de ACP, la pila es:

1. Plano de control de sesión ACP de OpenClaw
2. plugin de tiempo de ejecución empaquetado `acpx`
3. adaptador ACP de Claude
4. maquinaria de tiempo de ejecución/sesión del lado de Claude

Diferencia importante:

- Claude en ACP es una sesión de harness con controles ACP, reanudación de sesión, seguimiento de tareas en segundo plano y vinculación opcional a conversación/hilo.
  Para operadores, la regla práctica es:

- si quieres `/acp spawn`, sesiones vinculables, controles de tiempo de ejecución o trabajo persistente de harness: usa ACP

## Sesiones vinculadas

### Vínculos a la conversación actual

Usa `/acp spawn <harness> --bind here` cuando quieras que la conversación actual se convierta en un workspace ACP duradero sin crear un hilo hijo.

Comportamiento:

- OpenClaw sigue siendo propietario del transporte del canal, la autenticación, la seguridad y la entrega.
- La conversación actual se fija a la clave de sesión ACP creada.
- Los mensajes de seguimiento en esa conversación se enrutan a la misma sesión ACP.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión y elimina el vínculo de la conversación actual.

Qué significa esto en la práctica:

- `--bind here` mantiene la misma superficie de chat. En Discord, el canal actual sigue siendo el canal actual.
- `--bind here` todavía puede crear una nueva sesión ACP si estás iniciando trabajo nuevo. El vínculo adjunta esa sesión a la conversación actual.
- `--bind here` no crea por sí mismo un hilo hijo de Discord ni un tema de Telegram.
- El tiempo de ejecución ACP todavía puede tener su propio directorio de trabajo (`cwd`) o workspace en disco gestionado por el backend. Ese workspace de tiempo de ejecución es independiente de la superficie del chat y no implica un nuevo hilo de mensajería.
- Si creas una sesión para un agente ACP distinto y no pasas `--cwd`, OpenClaw hereda por defecto el workspace del **agente de destino**, no el del solicitante.
- Si falta la ruta de ese workspace heredado (`ENOENT`/`ENOTDIR`), OpenClaw recurre al `cwd` predeterminado del backend en lugar de reutilizar silenciosamente el árbol equivocado.
- Si el workspace heredado existe pero no se puede acceder a él (por ejemplo `EACCES`), la creación devuelve el error real de acceso en lugar de descartar `cwd`.

Modelo mental:

- superficie de chat: donde la gente sigue hablando (`canal de Discord`, `tema de Telegram`, `chat de iMessage`)
- sesión ACP: el estado duradero del tiempo de ejecución de Codex/Claude/Gemini al que OpenClaw enruta
- hilo/tema hijo: una superficie adicional opcional de mensajería creada solo por `--thread ...`
- workspace de tiempo de ejecución: la ubicación del sistema de archivos donde se ejecuta el harness (`cwd`, checkout del repositorio, workspace del backend)

Ejemplos:

- `/acp spawn codex --bind here`: mantener este chat, crear o adjuntar una sesión ACP de Codex y enrutar aquí los mensajes futuros hacia ella
- `/acp spawn codex --thread auto`: OpenClaw puede crear un hilo/tema hijo y vincular allí la sesión ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: misma vinculación al chat que arriba, pero Codex se ejecuta en `/workspace/repo`

Compatibilidad con vinculación a la conversación actual:

- Los canales de chat/mensajería que anuncian compatibilidad con vinculación ACP a la conversación actual pueden usar `--bind here` mediante la ruta compartida de vinculación de conversaciones.
- Los canales con semántica personalizada de hilos/temas todavía pueden proporcionar canonicalización específica del canal detrás de la misma interfaz compartida.
- `--bind here` siempre significa “vincular la conversación actual en su sitio”.
- Los vínculos genéricos a la conversación actual usan el almacén compartido de vínculos de OpenClaw y sobreviven a reinicios normales de la gateway.

Notas:

- `--bind here` y `--thread ...` son mutuamente excluyentes en `/acp spawn`.
- En Discord, `--bind here` vincula el canal o hilo actual en su sitio. `spawnAcpSessions` solo es necesario cuando OpenClaw necesita crear un hilo hijo para `--thread auto|here`.
- Si el canal activo no expone vínculos ACP a la conversación actual, OpenClaw devuelve un mensaje claro de no compatibilidad.
- `resume` y las preguntas de “nueva sesión” son cuestiones de sesión ACP, no del canal. Puedes reutilizar o reemplazar el estado del tiempo de ejecución sin cambiar la superficie actual del chat.

### Sesiones vinculadas a hilos

Cuando los vínculos de hilos están habilitados para un adaptador de canal, las sesiones ACP pueden vincularse a hilos:

- OpenClaw vincula un hilo a una sesión ACP de destino.
- Los mensajes de seguimiento en ese hilo se enrutan a la sesión ACP vinculada.
- La salida de ACP se entrega de vuelta al mismo hilo.
- Desfocalizar/cerrar/archivar/expiración por tiempo de inactividad o edad máxima elimina el vínculo.

La compatibilidad con vínculos de hilos depende del adaptador. Si el adaptador de canal activo no admite vínculos de hilos, OpenClaw devuelve un mensaje claro de no compatible/no disponible.

Flags de función requeridas para ACP vinculado a hilos:

- `acp.enabled=true`
- `acp.dispatch.enabled` está activado de forma predeterminada (ponlo en `false` para pausar el despacho ACP)
- Flag de creación de hilo ACP del adaptador de canal habilitada (específica del adaptador)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canales que admiten hilos

- Cualquier adaptador de canal que exponga capacidad de vinculación de sesión/hilo.
- Compatibilidad integrada actual:
  - hilos/canales de Discord
  - temas de Telegram (temas de foro en grupos/supergrupos y temas de MD)
- Los plugins de canal pueden añadir compatibilidad mediante la misma interfaz de vinculación.

## Configuración específica del canal

Para flujos no efímeros, configura vínculos ACP persistentes en entradas `bindings[]` de nivel superior.

### Modelo de vinculación

- `bindings[].type="acp"` marca un vínculo persistente de conversación ACP.
- `bindings[].match` identifica la conversación de destino:
  - canal o hilo de Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - tema de foro de Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - chat MD/grupal de BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Prefiere `chat_id:*` o `chat_identifier:*` para vínculos de grupo estables.
  - chat MD/grupal de iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`.
    Prefiere `chat_id:*` para vínculos de grupo estables.
- `bindings[].agentId` es el id del agente propietario de OpenClaw.
- Las sustituciones ACP opcionales viven en `bindings[].acp`:
  - `mode` (`persistent` u `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valores predeterminados de tiempo de ejecución por agente

Usa `agents.list[].runtime` para definir una vez los valores predeterminados de ACP por agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id del harness, por ejemplo `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedencia de sustitución para sesiones ACP vinculadas:

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
- En conversaciones vinculadas, `/new` y `/reset` restablecen en su lugar la misma clave de sesión ACP.
- Los vínculos temporales de tiempo de ejecución (por ejemplo creados por flujos de enfoque de hilos) siguen aplicándose cuando existen.
- Para creaciones ACP entre agentes sin un `cwd` explícito, OpenClaw hereda el workspace del agente de destino desde la configuración del agente.
- Las rutas faltantes de workspace heredado recurren al `cwd` predeterminado del backend; los fallos reales de acceso en rutas existentes aparecen como errores de creación.

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
- `agentId` (opcional): id del harness ACP de destino. Recurre a `acp.defaultAgent` si está configurado.
- `thread` (opcional, predeterminado `false`): solicita el flujo de vinculación a hilo donde se admita.
- `mode` (opcional): `run` (una sola vez) o `session` (persistente).
  - el valor predeterminado es `run`
  - si `thread: true` y se omite el modo, OpenClaw puede usar comportamiento persistente por defecto según la ruta de tiempo de ejecución
  - `mode: "session"` requiere `thread: true`
- `cwd` (opcional): directorio de trabajo solicitado para el tiempo de ejecución (validado por la política del backend/tiempo de ejecución). Si se omite, la creación ACP hereda el workspace del agente de destino cuando está configurado; las rutas heredadas faltantes recurren a los valores predeterminados del backend, mientras que los errores reales de acceso se devuelven.
- `label` (opcional): etiqueta orientada al operador usada en el texto de sesión/banner.
- `resumeSessionId` (opcional): reanuda una sesión ACP existente en lugar de crear una nueva. El agente vuelve a cargar su historial de conversación mediante `session/load`. Requiere `runtime: "acp"`.
- `streamTo` (opcional): `"parent"` transmite resúmenes del progreso de la ejecución ACP inicial de vuelta a la sesión solicitante como eventos del sistema.
  - Cuando está disponible, las respuestas aceptadas incluyen `streamLogPath`, que apunta a un registro JSONL con ámbito de sesión (`<sessionId>.acp-stream.jsonl`) que puedes seguir para ver el historial completo de retransmisión.

### Reanudar una sesión existente

Usa `resumeSessionId` para continuar una sesión ACP anterior en lugar de empezar desde cero. El agente vuelve a cargar su historial de conversación mediante `session/load`, por lo que retoma el trabajo con todo el contexto anterior.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casos de uso comunes:

- Transferir una sesión de Codex desde tu portátil al teléfono: dile a tu agente que retome donde lo dejaste
- Continuar una sesión de programación que iniciaste interactivamente en la CLI, ahora sin interfaz a través de tu agente
- Retomar trabajo interrumpido por un reinicio de la gateway o un tiempo de inactividad agotado

Notas:

- `resumeSessionId` requiere `runtime: "acp"`; devuelve un error si se usa con el tiempo de ejecución de subagentes.
- `resumeSessionId` restaura el historial de conversación ACP ascendente; `thread` y `mode` siguen aplicándose normalmente a la nueva sesión de OpenClaw que estás creando, por lo que `mode: "session"` sigue requiriendo `thread: true`.
- El agente de destino debe admitir `session/load` (Codex y Claude Code lo hacen).
- Si no se encuentra el id de sesión, la creación falla con un error claro; no hay fallback silencioso a una sesión nueva.

### Prueba de humo para operadores

Usa esto después de un despliegue de la gateway cuando quieras una comprobación rápida en vivo de que la creación de ACP
realmente funciona de extremo a extremo, no solo que pasa pruebas unitarias.

Puerta recomendada:

1. Verifica la versión/commit desplegado de la gateway en el host de destino.
2. Confirma que el código fuente desplegado incluye la aceptación de linaje ACP en
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Abre una sesión de puente ACPX temporal hacia un agente en vivo (por ejemplo
   `razor(main)` en `jpclawhq`).
4. Pídele a ese agente que llame a `sessions_spawn` con:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - tarea: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifica que el agente informe:
   - `accepted=yes`
   - una `childSessionKey` real
   - ningún error de validación
6. Limpia la sesión temporal de puente ACPX.

Prompt de ejemplo para el agente en vivo:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notas:

- Mantén esta prueba de humo en `mode: "run"` salvo que estés probando intencionadamente
  sesiones ACP persistentes vinculadas a hilos.
- No exijas `streamTo: "parent"` para la puerta básica. Esa ruta depende de las
  capacidades de solicitante/sesión y es una comprobación de integración aparte.
- Trata la prueba de `mode: "session"` vinculada a hilos como una segunda pasada de integración
  más rica desde un hilo real de Discord o un tema de Telegram.

## Compatibilidad con sandbox

Las sesiones ACP actualmente se ejecutan en el tiempo de ejecución del host, no dentro del sandbox de OpenClaw.

Limitaciones actuales:

- Si la sesión solicitante está aislada en sandbox, las creaciones ACP se bloquean tanto para `sessions_spawn({ runtime: "acp" })` como para `/acp spawn`.
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

Flags clave:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Consulta [Comandos slash](/es/tools/slash-commands).

## Resolución de destino de sesión

La mayoría de las acciones `/acp` aceptan un destino de sesión opcional (`session-key`, `session-id` o `session-label`).

Orden de resolución:

1. Argumento explícito de destino (o `--session` para `/acp steer`)
   - primero intenta la clave
   - luego un id de sesión con forma UUID
   - luego la etiqueta
2. Vinculación del hilo actual (si esta conversación/hilo está vinculado a una sesión ACP)
3. Fallback a la sesión actual del solicitante

Los vínculos tanto a la conversación actual como a hilos participan en el paso 2.

Si no se resuelve ningún destino, OpenClaw devuelve un error claro (`Unable to resolve session target: ...`).

## Modos de vinculación al crear sesiones

`/acp spawn` admite `--bind here|off`.

| Modo   | Comportamiento                                                          |
| ------ | ----------------------------------------------------------------------- |
| `here` | Vincular la conversación activa actual en su sitio; fallar si no hay ninguna activa. |
| `off`  | No crear una vinculación a la conversación actual.                      |

Notas:

- `--bind here` es la ruta más sencilla para operadores cuando quieren “hacer que este canal o chat esté respaldado por Codex”.
- `--bind here` no crea un hilo hijo.
- `--bind here` solo está disponible en canales que exponen compatibilidad con vinculación a la conversación actual.
- `--bind` y `--thread` no pueden combinarse en la misma llamada a `/acp spawn`.

## Modos de hilos al crear sesiones

`/acp spawn` admite `--thread auto|here|off`.

| Modo   | Comportamiento                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------ |
| `auto` | En un hilo activo: vincula ese hilo. Fuera de un hilo: crea/vincula un hilo hijo cuando se admita.   |
| `here` | Requiere un hilo activo actual; falla si no estás dentro de uno.                                      |
| `off`  | Sin vinculación. La sesión se inicia sin vincular.                                                     |

Notas:

- En superficies sin compatibilidad con vinculación a hilos, el comportamiento predeterminado es efectivamente `off`.
- La creación vinculada a hilos requiere compatibilidad con la política del canal:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` cuando quieras fijar la conversación actual sin crear un hilo hijo.

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

`/acp status` muestra las opciones efectivas del tiempo de ejecución y, cuando está disponible, tanto los identificadores de sesión a nivel de tiempo de ejecución como a nivel de backend.

Algunos controles dependen de las capacidades del backend. Si un backend no admite un control, OpenClaw devuelve un error claro de control no compatible.

## Recetario de comandos ACP

| Comando              | Qué hace                                                    | Ejemplo                                                       |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sesión ACP; vinculación opcional a la conversación actual o a hilo. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Cancela el turno en curso para la sesión de destino.        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Envía una instrucción de guía a la sesión en ejecución.     | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Cierra la sesión y desvincula los destinos de hilo.         | `/acp close`                                                  |
| `/acp status`        | Muestra backend, modo, estado, opciones de tiempo de ejecución y capacidades. | `/acp status`                                                 |
| `/acp set-mode`      | Establece el modo de tiempo de ejecución para la sesión de destino. | `/acp set-mode plan`                                          |
| `/acp set`           | Escritura genérica de opción de configuración de tiempo de ejecución. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Establece una sustitución del directorio de trabajo en tiempo de ejecución. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Establece el perfil de política de aprobación.              | `/acp permissions strict`                                     |
| `/acp timeout`       | Establece el tiempo de espera del tiempo de ejecución (segundos). | `/acp timeout 120`                                            |
| `/acp model`         | Establece una sustitución de modelo en tiempo de ejecución. | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Elimina las sustituciones de opciones de tiempo de ejecución de la sesión. | `/acp reset-options`                                          |
| `/acp sessions`      | Enumera las sesiones ACP recientes del almacén.             | `/acp sessions`                                               |
| `/acp doctor`        | Estado del backend, capacidades y correcciones accionables. | `/acp doctor`                                                 |
| `/acp install`       | Imprime pasos deterministas de instalación y habilitación.  | `/acp install`                                                |

`/acp sessions` lee el almacén de la sesión actual vinculada o de la sesión solicitante. Los comandos que aceptan tokens `session-key`, `session-id` o `session-label` resuelven destinos mediante el descubrimiento de sesiones de la gateway, incluidas raíces personalizadas `session.store` por agente.

## Mapeo de opciones de tiempo de ejecución

`/acp` tiene comandos de conveniencia y un setter genérico.

Operaciones equivalentes:

- `/acp model <id>` se asigna a la clave de configuración de tiempo de ejecución `model`.
- `/acp permissions <profile>` se asigna a la clave de configuración de tiempo de ejecución `approval_policy`.
- `/acp timeout <seconds>` se asigna a la clave de configuración de tiempo de ejecución `timeout`.
- `/acp cwd <path>` actualiza directamente la sustitución de `cwd` en tiempo de ejecución.
- `/acp set <key> <value>` es la ruta genérica.
  - Caso especial: `key=cwd` usa la ruta de sustitución de `cwd`.
- `/acp reset-options` limpia todas las sustituciones de tiempo de ejecución para la sesión de destino.

## Compatibilidad actual de harnesses de acpx

Alias integrados actuales de harnesses de acpx:

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
Si tu instalación local de Cursor todavía expone ACP como `agent acp`, sustituye el comando del agente `cursor` en tu configuración de acpx en lugar de cambiar el valor predeterminado integrado.

El uso directo de la CLI de acpx también puede apuntar a adaptadores arbitrarios mediante `--agent <command>`, pero esa vía de escape en bruto es una función de la CLI de acpx (no la ruta normal de `agentId` de OpenClaw).

## Configuración necesaria

Base de ACP del núcleo:

```json5
{
  acp: {
    enabled: true,
    // Opcional. El valor predeterminado es true; ponlo en false para pausar el despacho ACP manteniendo los controles /acp.
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

La configuración de vinculación a hilos es específica del adaptador de canal. Ejemplo para Discord:

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

Si la creación ACP vinculada a hilos no funciona, verifica primero la flag de función del adaptador:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Los vínculos a la conversación actual no requieren la creación de un hilo hijo. Requieren un contexto de conversación activo y un adaptador de canal que exponga vínculos ACP de conversación.

Consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Configuración del plugin para el backend acpx

Las instalaciones nuevas incluyen el plugin de tiempo de ejecución empaquetado `acpx` habilitado de forma predeterminada, así que ACP
normalmente funciona sin un paso manual de instalación del plugin.

Empieza con:

```text
/acp doctor
```

Si deshabilitaste `acpx`, lo denegaste mediante `plugins.allow` / `plugins.deny`, o quieres
cambiar a una copia local de desarrollo, usa la ruta explícita del plugin:

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

De forma predeterminada, el plugin backend empaquetado de acpx (`acpx`) usa el binario fijado localmente en el plugin:

1. El comando usa por defecto `node_modules/.bin/acpx` local al plugin dentro del paquete del plugin ACPX.
2. La versión esperada usa por defecto el pin de la extensión.
3. El inicio registra inmediatamente el backend ACP como no listo.
4. Un trabajo en segundo plano de garantía verifica `acpx --version`.
5. Si falta el binario local al plugin o no coincide, ejecuta:
   `npm install --omit=dev --no-save acpx@<pinned>` y vuelve a verificar.

Puedes sustituir comando/versión en la configuración del plugin:

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

- `command` acepta una ruta absoluta, ruta relativa o nombre de comando (`acpx`).
- Las rutas relativas se resuelven desde el directorio del workspace de OpenClaw.
- `expectedVersion: "any"` deshabilita la coincidencia estricta de versión.
- Cuando `command` apunta a un binario/ruta personalizada, la instalación automática local al plugin se deshabilita.
- El inicio de OpenClaw sigue siendo no bloqueante mientras se ejecuta la comprobación de estado del backend.

Consulta [Plugins](/es/tools/plugin).

### Instalación automática de dependencias

Cuando instalas OpenClaw globalmente con `npm install -g openclaw`, las dependencias del tiempo de ejecución de acpx
(binarios específicos de la plataforma) se instalan automáticamente
mediante un hook de postinstall. Si la instalación automática falla, la gateway sigue iniciándose
normalmente e informa de la dependencia faltante mediante `openclaw acp doctor`.

### Puente MCP de herramientas de plugins

De forma predeterminada, las sesiones ACPX **no** exponen herramientas registradas por plugins de OpenClaw al
harness ACP.

Si quieres que agentes ACP como Codex o Claude Code puedan llamar a herramientas instaladas
de plugins de OpenClaw como recuperación/almacenamiento de memoria, habilita el puente dedicado:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Qué hace esto:

- Inyecta un servidor MCP integrado llamado `openclaw-plugin-tools` en la
  inicialización de la sesión ACPX.
- Expone herramientas de plugins ya registradas por plugins instalados y habilitados de OpenClaw.
- Mantiene la función explícita y desactivada por defecto.

Notas de seguridad y confianza:

- Esto amplía la superficie de herramientas del harness ACP.
- Los agentes ACP obtienen acceso solo a herramientas de plugins ya activas en la gateway.
- Trátalo como el mismo límite de confianza que permitir que esos plugins se ejecuten en
  OpenClaw.
- Revisa los plugins instalados antes de habilitarlo.

Los `mcpServers` personalizados siguen funcionando como antes. El puente integrado de herramientas de plugins es una
comodidad adicional opcional, no un reemplazo de la configuración genérica de servidores MCP.

## Configuración de permisos

Las sesiones ACP se ejecutan sin interacción: no hay TTY para aprobar o denegar solicitudes de permiso de escritura de archivos y ejecución de shell. El plugin acpx proporciona dos claves de configuración que controlan cómo se gestionan los permisos:

Estos permisos de harness ACPX son independientes de las aprobaciones de exec de OpenClaw y de flags de bypass del proveedor del backend CLI como Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` es el interruptor de emergencia a nivel de harness para sesiones ACP.

### `permissionMode`

Controla qué operaciones puede realizar el agente del harness sin pedir confirmación.

| Valor           | Comportamiento                                             |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Aprueba automáticamente todas las escrituras de archivos y comandos de shell. |
| `approve-reads` | Aprueba automáticamente solo lecturas; las escrituras y ejecuciones requieren solicitudes. |
| `deny-all`      | Deniega todas las solicitudes de permiso.                  |

### `nonInteractivePermissions`

Controla qué ocurre cuando debería mostrarse una solicitud de permiso pero no hay un TTY interactivo disponible (lo que siempre ocurre en sesiones ACP).

| Valor  | Comportamiento                                                       |
| ------ | -------------------------------------------------------------------- |
| `fail` | Aborta la sesión con `AcpRuntimeError`. **(predeterminado)**         |
| `deny` | Deniega silenciosamente el permiso y continúa (degradación elegante). |

### Configuración

Configúralo mediante la configuración del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Reinicia la gateway después de cambiar estos valores.

> **Importante:** OpenClaw actualmente usa por defecto `permissionMode=approve-reads` y `nonInteractivePermissions=fail`. En sesiones ACP no interactivas, cualquier escritura o ejecución que active una solicitud de permiso puede fallar con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Si necesitas restringir permisos, establece `nonInteractivePermissions` en `deny` para que las sesiones se degraden con elegancia en lugar de fallar.

## Solución de problemas

| Síntoma                                                                     | Causa probable                                                                   | Solución                                                                                                                                                            |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Falta el plugin backend o está deshabilitado.                                    | Instala y habilita el plugin backend, luego ejecuta `/acp doctor`.                                                                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP está deshabilitado globalmente.                                              | Establece `acp.enabled=true`.                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | El despacho desde mensajes normales del hilo está deshabilitado.                 | Establece `acp.dispatch.enabled=true`.                                                                                                                               |
| `ACP agent "<id>" is not allowed by policy`                                 | El agente no está en la lista de permitidos.                                     | Usa un `agentId` permitido o actualiza `acp.allowedAgents`.                                                                                                        |
| `Unable to resolve session target: ...`                                     | Token de clave/id/etiqueta incorrecto.                                           | Ejecuta `/acp sessions`, copia la clave/etiqueta exacta y vuelve a intentarlo.                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` se usó sin una conversación vinculable activa.                     | Muévete al chat/canal de destino y vuelve a intentarlo, o usa una creación sin vínculo.                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | El adaptador no tiene capacidad de vinculación ACP a la conversación actual.     | Usa `/acp spawn ... --thread ...` donde se admita, configura `bindings[]` de nivel superior o muévete a un canal compatible.                                      |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` se usó fuera de un contexto de hilo.                             | Muévete al hilo de destino o usa `--thread auto`/`off`.                                                                                                            |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Otro usuario es propietario del destino de vinculación activo.                   | Vuelve a vincular como propietario o usa otra conversación o hilo.                                                                                                 |
| `Thread bindings are unavailable for <channel>.`                            | El adaptador no tiene capacidad de vinculación a hilos.                          | Usa `--thread off` o muévete a un adaptador/canal compatible.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | El tiempo de ejecución ACP está del lado del host; la sesión solicitante está en sandbox. | Usa `runtime="subagent"` desde sesiones en sandbox, o ejecuta la creación ACP desde una sesión sin sandbox.                                                |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Se solicitó `sandbox="require"` para el tiempo de ejecución ACP.                 | Usa `runtime="subagent"` para exigir sandbox, o usa ACP con `sandbox="inherit"` desde una sesión sin sandbox.                                                     |
| Faltan metadatos ACP para la sesión vinculada                               | Metadatos ACP obsoletos/eliminados de la sesión.                                 | Vuelve a crear con `/acp spawn`, luego vuelve a vincular/enfocar el hilo.                                                                                          |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` bloquea escrituras/exec en una sesión ACP no interactiva.       | Establece `plugins.entries.acpx.config.permissionMode` en `approve-all` y reinicia la gateway. Consulta [Configuración de permisos](#permission-configuration).   |
| La sesión ACP falla pronto con poca salida                                  | Las solicitudes de permiso están bloqueadas por `permissionMode`/`nonInteractivePermissions`. | Comprueba los registros de la gateway para ver `AcpRuntimeError`. Para permisos completos, establece `permissionMode=approve-all`; para degradación elegante, establece `nonInteractivePermissions=deny`. |
| La sesión ACP se queda bloqueada indefinidamente tras completar el trabajo  | El proceso del harness terminó pero la sesión ACP no informó de finalización.    | Supervisa con `ps aux \| grep acpx`; mata manualmente los procesos obsoletos.                                                                                      |
