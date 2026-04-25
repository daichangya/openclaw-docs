---
read_when:
    - Uso o configuración de comandos de chat
    - Depuración del enrutamiento de comandos o permisos
summary: 'Comandos slash: texto frente a nativos, configuración y comandos compatibles'
title: Comandos slash
x-i18n:
    generated_at: "2026-04-25T13:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

Los comandos se gestionan en el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que comience con `/`.
El comando de chat bash solo para host usa `! <cmd>` (con `/bash <cmd>` como alias).

Hay dos sistemas relacionados:

- **Comandos**: mensajes independientes `/...`.
- **Directivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
  - En mensajes de chat normales (no solo de directivas), se tratan como “pistas inline” y **no** conservan ajustes de sesión.
  - En mensajes que contienen solo directivas (el mensaje contiene únicamente directivas), se conservan en la sesión y responden con una confirmación.
  - Las directivas solo se aplican a **remitentes autorizados**. Si `commands.allowFrom` está configurado, es la única
    lista de permitidos utilizada; de lo contrario, la autorización proviene de las listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`.
    Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

También hay algunos **atajos inline** (solo para remitentes en lista de permitidos/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Se ejecutan inmediatamente, se eliminan antes de que el modelo vea el mensaje, y el texto restante continúa por el flujo normal.

## Configuración

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (valor predeterminado `true`) habilita el análisis de `/...` en mensajes de chat.
  - En superficies sin comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), los comandos de texto siguen funcionando incluso si estableces esto en `false`.
- `commands.native` (valor predeterminado `"auto"`) registra comandos nativos.
  - Auto: activado para Discord/Telegram; desactivado para Slack (hasta que agregues slash commands); ignorado para proveedores sin soporte nativo.
  - Establece `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para sobrescribir por proveedor (bool o `"auto"`).
  - `false` borra los comandos registrados previamente en Discord/Telegram al iniciar. Los comandos de Slack se gestionan en la app de Slack y no se eliminan automáticamente.
- `commands.nativeSkills` (valor predeterminado `"auto"`) registra comandos de **Skills** de forma nativa cuando se admite.
  - Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un slash command por cada Skill).
  - Establece `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para sobrescribir por proveedor (bool o `"auto"`).
- `commands.bash` (valor predeterminado `false`) habilita `! <cmd>` para ejecutar comandos de shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos de `tools.elevated`).
- `commands.bashForegroundMs` (valor predeterminado `2000`) controla cuánto tiempo espera bash antes de cambiar a modo en segundo plano (`0` lo envía a segundo plano inmediatamente).
- `commands.config` (valor predeterminado `false`) habilita `/config` (lee/escribe `openclaw.json`).
- `commands.mcp` (valor predeterminado `false`) habilita `/mcp` (lee/escribe la configuración de MCP gestionada por OpenClaw en `mcp.servers`).
- `commands.plugins` (valor predeterminado `false`) habilita `/plugins` (detección/estado de plugins más controles de instalación y activación/desactivación).
- `commands.debug` (valor predeterminado `false`) habilita `/debug` (sobrescrituras solo en tiempo de ejecución).
- `commands.restart` (valor predeterminado `true`) habilita `/restart` más acciones de herramienta para reiniciar el gateway.
- `commands.ownerAllowFrom` (opcional) establece la lista explícita de permitidos del propietario para superficies de comandos/herramientas solo para propietario. Esto es independiente de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` por canal (opcional, valor predeterminado `false`) hace que los comandos solo para propietario requieran **identidad de propietario** para ejecutarse en esa superficie. Cuando es `true`, el remitente debe coincidir con un candidato de propietario resuelto (por ejemplo, una entrada en `commands.ownerAllowFrom` o metadatos nativos del proveedor para propietario) o tener alcance interno `operator.admin` en un canal de mensajes interno. Una entrada comodín en `allowFrom` del canal, o una lista vacía/no resuelta de candidatos de propietario, **no** es suficiente: los comandos solo para propietario fallan en cerrado en ese canal. Déjalo desactivado si quieres que los comandos solo para propietario estén controlados únicamente por `ownerAllowFrom` y las listas de permitidos estándar de comandos.
- `commands.ownerDisplay` controla cómo aparecen los id del propietario en el prompt del sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` establece opcionalmente el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) establece una lista de permitidos por proveedor para la autorización de comandos. Cuando está configurado, es la
  única fuente de autorización para comandos y directivas (se ignoran las listas de permitidos/emparejamiento del canal y `commands.useAccessGroups`).
  Usa `"*"` como valor global predeterminado; las claves específicas del proveedor lo sobrescriben.
- `commands.useAccessGroups` (valor predeterminado `true`) aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está configurado.

## Lista de comandos

Fuente de verdad actual:

- los integrados del núcleo provienen de `src/auto-reply/commands-registry.shared.ts`
- los comandos de dock generados provienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de plugins provienen de llamadas `registerCommand()` del plugin
- la disponibilidad real en tu gateway sigue dependiendo de las banderas de configuración, la superficie del canal y los plugins instalados/habilitados

### Comandos integrados del núcleo

Comandos integrados disponibles hoy:

- `/new [model]` inicia una sesión nueva; `/reset` es el alias de restablecimiento.
- `/reset soft [message]` mantiene la transcripción actual, elimina los id de sesión reutilizados del backend de CLI y vuelve a ejecutar en el lugar la carga de arranque/del prompt del sistema.
- `/compact [instructions]` compacta el contexto de la sesión. Consulta [/concepts/compaction](/es/concepts/compaction).
- `/stop` aborta la ejecución actual.
- `/session idle <duration|off>` y `/session max-age <duration|off>` gestionan el vencimiento del enlace de hilo.
- `/think <level>` establece el nivel de razonamiento. Las opciones provienen del perfil del proveedor del modelo activo; los niveles comunes son `off`, `minimal`, `low`, `medium` y `high`, con niveles personalizados como `xhigh`, `adaptive`, `max` o solo el binario `on` cuando se admiten. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` alterna la salida detallada. Alias: `/v`.
- `/trace on|off` alterna la salida de rastreo del plugin para la sesión actual.
- `/fast [status|on|off]` muestra o establece el modo rápido.
- `/reasoning [on|off|stream]` alterna la visibilidad del razonamiento. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna el modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece los valores predeterminados de exec.
- `/model [name|#|status]` muestra o establece el modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista proveedores o modelos de un proveedor.
- `/queue <mode>` gestiona el comportamiento de la cola (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) además de opciones como `debounce:2s cap:25 drop:summarize`.
- `/help` muestra el resumen breve de ayuda.
- `/commands` muestra el catálogo generado de comandos.
- `/tools [compact|verbose]` muestra lo que el agente actual puede usar en este momento.
- `/status` muestra el estado de ejecución/runtime, incluidas las etiquetas `Execution`/`Runtime` y el uso/cuota del proveedor cuando está disponible.
- `/crestodian <request>` ejecuta el asistente Crestodian de configuración y reparación desde un DM del propietario.
- `/tasks` lista las tareas en segundo plano activas/recientes de la sesión actual.
- `/context [list|detail|json]` explica cómo se ensambla el contexto.
- `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
- `/export-trajectory [path]` exporta un [trajectory bundle](/es/tools/trajectory) en JSONL para la sesión actual. Alias: `/trajectory`.
- `/whoami` muestra tu id de remitente. Alias: `/id`.
- `/skill <name> [input]` ejecuta una Skill por nombre.
- `/allowlist [list|add|remove] ...` gestiona entradas de lista de permitidos. Solo texto.
- `/approve <id> <decision>` resuelve prompts de aprobación de exec.
- `/btw <question>` hace una pregunta lateral sin cambiar el contexto futuro de la sesión. Consulta [/tools/btw](/es/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestiona ejecuciones de subagentes para la sesión actual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestiona sesiones de ACP y opciones de runtime.
- `/focus <target>` vincula el hilo actual de Discord o el tema/conversación actual de Telegram a un destino de sesión.
- `/unfocus` elimina el vínculo actual.
- `/agents` lista los agentes vinculados al hilo para la sesión actual.
- `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
- `/steer <id|#> <message>` envía instrucciones a un subagente en ejecución. Alias: `/tell`.
- `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo propietario. Requiere `commands.config: true`.
- `/mcp show|get|set|unset` lee o escribe la configuración del servidor MCP gestionada por OpenClaw en `mcp.servers`. Solo propietario. Requiere `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado de los plugins. `/plugin` es un alias. Solo propietario para escrituras. Requiere `commands.plugins: true`.
- `/debug show|set|unset|reset` gestiona sobrescrituras de configuración solo de runtime. Solo propietario. Requiere `commands.debug: true`.
- `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen local de costos.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulta [/tools/tts](/es/tools/tts).
- `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; establece `commands.restart: false` para desactivarlo.
- `/activation mention|always` establece el modo de activación de grupo.
- `/send on|off|inherit` establece la política de envío. Solo propietario.
- `/bash <command>` ejecuta un comando de shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permitidos de `tools.elevated`.
- `!poll [sessionId]` comprueba un trabajo bash en segundo plano.
- `!stop [sessionId]` detiene un trabajo bash en segundo plano.

### Comandos dock generados

Los comandos dock se generan a partir de plugins de canal con soporte de comandos nativos. Conjunto integrado actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins integrados

Los plugins integrados pueden añadir más slash commands. Comandos integrados actuales en este repositorio:

- `/dreaming [on|off|status|help]` alterna el Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestiona el flujo de emparejamiento/configuración de dispositivos. Consulta [Pairing](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` activa temporalmente comandos de node de teléfono de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` gestiona la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecciona y controla el arnés integrado de servidor de aplicaciones Codex. Consulta [Codex Harness](/es/plugins/codex-harness).
- Comandos solo de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de Skills

Las Skills invocables por el usuario también se exponen como slash commands:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- las Skills también pueden aparecer como comandos directos como `/prose` cuando la Skill/plugin los registra.
- el registro nativo de comandos de Skills está controlado por `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.

Notas:

- Los comandos aceptan `:` opcional entre el comando y los argumentos (por ejemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como cuerpo del mensaje.
- Para el desglose completo de uso por proveedor, usa `openclaw status --usage`.
- `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
- En canales con varias cuentas, `/allowlist --account <id>` dirigido a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
- `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costos desde los registros de sesión de OpenClaw.
- `/restart` está habilitado por defecto; establece `commands.restart: false` para desactivarlo.
- `/plugins install <spec>` acepta las mismas especificaciones de plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
- `/plugins enable|disable` actualiza la configuración del plugin y puede solicitar un reinicio.
- Comando nativo solo de Discord: `/vc join|leave|status` controla los canales de voz (no está disponible como texto). `join` requiere un guild y un canal de voz/stage seleccionado. Requiere `channels.discord.voice` y comandos nativos.
- Los comandos de vinculación de hilo de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que las vinculaciones de hilo efectivas estén habilitadas (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
- Referencia de comandos ACP y comportamiento del runtime: [ACP Agents](/es/tools/acp-agents).
- `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en uso normal.
- `/trace` es más limitado que `/verbose`: solo revela líneas de rastreo/depuración propiedad de plugins y mantiene desactivado el ruido normal detallado de herramientas.
- `/fast on|off` conserva una sobrescritura de sesión. Usa la opción `inherit` de la UI de Sessions para borrarla y volver a los valores predeterminados de configuración.
- `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes públicas directas a Anthropic, incluido el tráfico autenticado por OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
- Los resúmenes de fallos de herramientas siguen mostrándose cuando son relevantes, pero el texto detallado del fallo solo se incluye cuando `/verbose` está en `on` o `full`.
- `/reasoning`, `/verbose` y `/trace` son arriesgados en entornos de grupo: pueden revelar razonamiento interno, salida de herramientas o diagnósticos de plugins que no querías exponer. Es preferible dejarlos desactivados, especialmente en chats grupales.
- `/model` conserva el nuevo modelo de sesión inmediatamente.
- Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
- Si la actividad de herramientas o la salida de respuesta ya ha comenzado, el cambio pendiente puede quedar en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- En la TUI local, `/crestodian [request]` vuelve desde la TUI normal del agente a
  Crestodian. Esto es independiente del modo de rescate del canal de mensajes y no
  concede autoridad de configuración remota.
- **Ruta rápida:** los mensajes que contienen solo comandos de remitentes en lista de permitidos se gestionan inmediatamente (omiten cola + modelo).
- **Control por mención en grupos:** los mensajes que contienen solo comandos de remitentes en lista de permitidos omiten los requisitos de mención.
- **Atajos inline (solo remitentes en lista de permitidos):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
  - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
- Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Los mensajes no autorizados que contienen solo comandos se ignoran en silencio, y los tokens inline `/...` se tratan como texto sin formato.
- **Comandos de Skills:** las Skills `user-invocable` se exponen como slash commands. Los nombres se sanitizan a `a-z0-9_` (máximo 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo, `_2`).
  - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden comandos por Skill).
  - De forma predeterminada, los comandos de Skills se reenvían al modelo como una solicitud normal.
  - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
  - Ejemplo: `/prose` (plugin OpenProse) — consulta [OpenProse](/es/prose).
- **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos obligatorios). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento. Las opciones dinámicas se resuelven frente al modelo de la sesión de destino, por lo que las opciones específicas del modelo, como los niveles de `/think`, siguen la sobrescritura `/model` de esa sesión.

## `/tools`

`/tools` responde a una pregunta de runtime, no de configuración: **qué puede usar este agente ahora mismo en
esta conversación**.

- El `/tools` predeterminado es compacto y está optimizado para un escaneo rápido.
- `/tools verbose` añade descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo cambio de modo `compact|verbose`.
- Los resultados están limitados al ámbito de la sesión, así que cambiar el agente, canal, hilo, autorización del remitente o modelo puede
  cambiar la salida.
- `/tools` incluye las herramientas realmente accesibles en runtime, incluidas herramientas del núcleo, herramientas
  de plugins conectados y herramientas propiedad del canal.

Para editar perfiles y sobrescrituras, usa el panel Tools de la UI de Control o las superficies de configuración/catálogo en lugar de
tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra y dónde)

- **Uso/cuota del proveedor** (ejemplo: “Claude 80% left”) aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% left`; para MiniMax, los campos de porcentaje solo de restante se invierten antes de mostrarse, y las respuestas `model_remains` priorizan la entrada del modelo de chat junto con una etiqueta de plan etiquetada por modelo.
- **Líneas de tokens/caché** en `/status` pueden recurrir a la entrada de uso más reciente de la transcripción cuando la instantánea de la sesión en vivo es escasa. Los valores en vivo no nulos existentes siguen teniendo prioridad, y el respaldo en transcripción también puede recuperar la etiqueta del modelo de runtime activo junto con un total orientado al prompt mayor cuando los totales almacenados faltan o son menores.
- **Execution frente a runtime:** `/status` informa `Execution` para la ruta efectiva del sandbox y `Runtime` para quién está ejecutando realmente la sesión: `OpenClaw Pi Default`, `OpenAI Codex`, un backend de CLI o un backend de ACP.
- **Tokens/costo por respuesta** se controla con `/usage off|tokens|full` (se añade a las respuestas normales).
- `/model status` trata sobre **modelos/autenticación/endpoints**, no sobre uso.

## Selección de modelo (`/model`)

`/model` se implementa como una directiva.

Ejemplos:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Notas:

- `/model` y `/model list` muestran un selector compacto numerado (familia de modelo + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de envío.
- `/model <#>` selecciona desde ese selector (y prioriza el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint configurado del proveedor (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

## Sobrescrituras de depuración

`/debug` te permite establecer sobrescrituras de configuración **solo de runtime** (memoria, no disco). Solo propietario. Está deshabilitado por defecto; habilítalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- Las sobrescrituras se aplican inmediatamente a nuevas lecturas de configuración, pero **no** escriben en `openclaw.json`.
- Usa `/debug reset` para borrar todas las sobrescrituras y volver a la configuración en disco.

## Salida de rastreo de plugins

`/trace` te permite alternar **líneas de rastreo/depuración de plugins con alcance de sesión** sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumento muestra el estado actual de rastreo de la sesión.
- `/trace on` habilita líneas de rastreo de plugins para la sesión actual.
- `/trace off` vuelve a deshabilitarlas.
- Las líneas de rastreo de plugins pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.
- `/trace` no sustituye a `/debug`; `/debug` sigue gestionando las sobrescrituras de configuración solo de runtime.
- `/trace` no sustituye a `/verbose`; la salida detallada normal de herramientas/estado sigue correspondiendo a `/verbose`.

## Actualizaciones de configuración

`/config` escribe en tu configuración en disco (`openclaw.json`). Solo propietario. Está deshabilitado por defecto; habilítalo con `commands.config: true`.

Ejemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Notas:

- La configuración se valida antes de escribirse; los cambios no válidos se rechazan.
- Las actualizaciones de `/config` se conservan tras los reinicios.

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidor MCP gestionadas por OpenClaw en `mcp.servers`. Solo propietario. Está deshabilitado por defecto; habilítalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notas:

- `/mcp` guarda la configuración en la configuración de OpenClaw, no en ajustes de proyecto propiedad de Pi.
- Los adaptadores de runtime deciden qué transportes son realmente ejecutables.

## Actualizaciones de plugins

`/plugins` permite a los operadores inspeccionar plugins detectados y alternar su habilitación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Está deshabilitado por defecto; habilítalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notas:

- `/plugins list` y `/plugins show` usan detección real de plugins frente al workspace actual más la configuración en disco.
- `/plugins enable|disable` solo actualiza la configuración del plugin; no instala ni desinstala plugins.
- Después de cambios de activación/desactivación, reinicia el gateway para aplicarlos.

## Notas sobre superficies

- **Comandos de texto** se ejecutan en la sesión normal de chat (los DM comparten `main`, los grupos tienen su propia sesión).
- **Comandos nativos** usan sesiones aisladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (apunta a la sesión del chat mediante `CommandTargetSessionKey`)
- **`/stop`** apunta a la sesión de chat activa para poder abortar la ejecución actual.
- **Slack:** `channels.slack.slashCommand` sigue siendo compatible para un único comando de estilo `/openclaw`. Si habilitas `commands.native`, debes crear un slash command de Slack por cada comando integrado (con los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.
  - Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El `/status` de texto sigue funcionando en mensajes de Slack.

## Preguntas laterales BTW

`/btw` es una **pregunta lateral** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada separada de un solo uso **sin herramientas**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de la transcripción,
- se entrega como resultado lateral en vivo en lugar de como un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la
tarea principal sigue en marcha.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [BTW Side Questions](/es/tools/btw) para el comportamiento completo y los detalles
de UX del cliente.

## Relacionado

- [Skills](/es/tools/skills)
- [Configuración de Skills](/es/tools/skills-config)
- [Creación de Skills](/es/tools/creating-skills)
