---
read_when:
    - Usar o configurar comandos de chat
    - Depurar el enrutamiento o los permisos de comandos
summary: 'Comandos de barra diagonal: texto frente a nativo, configuración y comandos compatibles'
title: Comandos de barra diagonal
x-i18n:
    generated_at: "2026-04-22T04:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos de barra diagonal

Los comandos los gestiona Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que empiece con `/`.
El comando de chat bash solo para host usa `! <cmd>` (con `/bash <cmd>` como alias).

Hay dos sistemas relacionados:

- **Commands**: mensajes independientes `/...`.
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Las directivas se eliminan del mensaje antes de que lo vea el modelo.
  - En mensajes normales de chat (no solo de directivas), se tratan como “sugerencias en línea” y **no** persisten la configuración de la sesión.
  - En mensajes solo de directivas (el mensaje contiene solo directivas), persisten en la sesión y responden con una confirmación.
  - Las directivas solo se aplican a **remitentes autorizados**. Si `commands.allowFrom` está configurado, es la única
    lista de permitidos usada; en caso contrario, la autorización proviene de las listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`.
    Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

También hay algunos **atajos en línea** (solo remitentes en allowlist/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Se ejecutan de inmediato, se eliminan antes de que el modelo vea el mensaje, y el texto restante sigue por el flujo normal.

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

- `commands.text` (predeterminado `true`) habilita el análisis de `/...` en mensajes de chat.
  - En superficies sin comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), los comandos de texto siguen funcionando aunque establezcas esto en `false`.
- `commands.native` (predeterminado `"auto"`) registra comandos nativos.
  - Auto: activado para Discord/Telegram; desactivado para Slack (hasta que agregues comandos de barra diagonal); ignorado para proveedores sin compatibilidad nativa.
  - Configura `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para reemplazar por proveedor (booleano o `"auto"`).
  - `false` borra en el inicio los comandos registrados previamente en Discord/Telegram. Los comandos de Slack se gestionan en la aplicación de Slack y no se eliminan automáticamente.
- `commands.nativeSkills` (predeterminado `"auto"`) registra comandos de **Skills** de forma nativa cuando es compatible.
  - Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un comando de barra diagonal por Skill).
  - Configura `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para reemplazar por proveedor (booleano o `"auto"`).
- `commands.bash` (predeterminado `false`) habilita `! <cmd>` para ejecutar comandos del shell del host (`/bash <cmd>` es un alias; requiere listas de permitidos `tools.elevated`).
- `commands.bashForegroundMs` (predeterminado `2000`) controla cuánto espera bash antes de pasar al modo en segundo plano (`0` lo pasa a segundo plano de inmediato).
- `commands.config` (predeterminado `false`) habilita `/config` (lee/escribe `openclaw.json`).
- `commands.mcp` (predeterminado `false`) habilita `/mcp` (lee/escribe la configuración MCP gestionada por OpenClaw bajo `mcp.servers`).
- `commands.plugins` (predeterminado `false`) habilita `/plugins` (descubrimiento/estado de plugins más controles de instalación + habilitación/deshabilitación).
- `commands.debug` (predeterminado `false`) habilita `/debug` (reemplazos solo de tiempo de ejecución).
- `commands.restart` (predeterminado `true`) habilita `/restart` más acciones de tools de reinicio del gateway.
- `commands.ownerAllowFrom` (opcional) establece la lista explícita de permitidos del propietario para superficies de comandos/tools solo de propietario. Esto es independiente de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` por canal (opcional, predeterminado `false`) hace que los comandos solo de propietario requieran **identidad de propietario** para ejecutarse en esa superficie. Cuando es `true`, el remitente debe coincidir con un candidato resuelto de propietario (por ejemplo una entrada en `commands.ownerAllowFrom` o metadatos nativos de propietario del proveedor) o tener alcance interno `operator.admin` en un canal de mensajes interno. Una entrada comodín en `allowFrom` del canal, o una lista vacía/sin resolver de candidatos de propietario, **no** es suficiente: los comandos solo de propietario fallan en cerrado en ese canal. Déjalo desactivado si quieres que los comandos solo de propietario estén restringidos solo por `ownerAllowFrom` y las listas de permitidos estándar de comandos.
- `commands.ownerDisplay` controla cómo aparecen los id de propietario en el prompt del sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` establece opcionalmente el secreto HMAC usado cuando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) establece una lista de permitidos por proveedor para autorización de comandos. Cuando está configurado, es la
  única fuente de autorización para comandos y directivas (las listas de permitidos/emparejamiento del canal y `commands.useAccessGroups`
  se ignoran). Usa `"*"` para un valor global predeterminado; las claves específicas del proveedor lo reemplazan.
- `commands.useAccessGroups` (predeterminado `true`) aplica listas de permitidos/políticas para comandos cuando `commands.allowFrom` no está configurado.

## Lista de comandos

Fuente actual de verdad:

- los integrados del core vienen de `src/auto-reply/commands-registry.shared.ts`
- los comandos dock generados vienen de `src/auto-reply/commands-registry.data.ts`
- los comandos de Plugin vienen de llamadas `registerCommand()` del Plugin
- la disponibilidad real en tu gateway sigue dependiendo de flags de configuración, superficie del canal y plugins instalados/habilitados

### Comandos integrados del core

Comandos integrados disponibles hoy:

- `/new [model]` inicia una nueva sesión; `/reset` es el alias de reinicio.
- `/reset soft [message]` conserva la transcripción actual, elimina id de sesión reutilizados del backend CLI y vuelve a ejecutar la carga del prompt de inicio/sistema en el lugar.
- `/compact [instructions]` compacta el contexto de la sesión. Consulta [/concepts/compaction](/es/concepts/compaction).
- `/stop` aborta la ejecución actual.
- `/session idle <duration|off>` y `/session max-age <duration|off>` gestionan el vencimiento del enlace de hilo.
- `/think <level>` establece el nivel de thinking. Las opciones provienen del perfil del proveedor del modelo activo; los niveles habituales son `off`, `minimal`, `low`, `medium` y `high`, con niveles personalizados como `xhigh`, `adaptive`, `max` o solo binario `on` donde sea compatible. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` alterna la salida detallada. Alias: `/v`.
- `/trace on|off` alterna la salida de rastreo de Plugin para la sesión actual.
- `/fast [status|on|off]` muestra o establece el modo rápido.
- `/reasoning [on|off|stream]` alterna la visibilidad del razonamiento. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna el modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` muestra o establece los valores predeterminados de exec.
- `/model [name|#|status]` muestra o establece el modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` enumera proveedores o modelos de un proveedor.
- `/queue <mode>` gestiona el comportamiento de la cola (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) más opciones como `debounce:2s cap:25 drop:summarize`.
- `/help` muestra el resumen corto de ayuda.
- `/commands` muestra el catálogo generado de comandos.
- `/tools [compact|verbose]` muestra lo que el agente actual puede usar en este momento.
- `/status` muestra el estado de tiempo de ejecución, incluido uso/cuota del proveedor cuando está disponible.
- `/tasks` enumera tareas activas/recientes en segundo plano para la sesión actual.
- `/context [list|detail|json]` explica cómo se ensambla el contexto.
- `/export-session [path]` exporta la sesión actual a HTML. Alias: `/export`.
- `/whoami` muestra tu id de remitente. Alias: `/id`.
- `/skill <name> [input]` ejecuta una Skill por nombre.
- `/allowlist [list|add|remove] ...` gestiona entradas de allowlist. Solo texto.
- `/approve <id> <decision>` resuelve avisos de aprobación de exec.
- `/btw <question>` hace una pregunta lateral sin cambiar el contexto futuro de la sesión. Consulta [/tools/btw](/es/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestiona ejecuciones de subagentes para la sesión actual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestiona sesiones ACP y opciones de tiempo de ejecución.
- `/focus <target>` enlaza el hilo actual de Discord o el tema/conversación de Telegram a un destino de sesión.
- `/unfocus` elimina el enlace actual.
- `/agents` enumera agentes enlazados al hilo para la sesión actual.
- `/kill <id|#|all>` aborta uno o todos los subagentes en ejecución.
- `/steer <id|#> <message>` envía una redirección a un subagente en ejecución. Alias: `/tell`.
- `/config show|get|set|unset` lee o escribe `openclaw.json`. Solo propietario. Requiere `commands.config: true`.
- `/mcp show|get|set|unset` lee o escribe configuración de servidor MCP gestionada por OpenClaw bajo `mcp.servers`. Solo propietario. Requiere `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecciona o modifica el estado de Plugin. `/plugin` es un alias. Solo propietario para escrituras. Requiere `commands.plugins: true`.
- `/debug show|set|unset|reset` gestiona reemplazos de configuración solo de tiempo de ejecución. Solo propietario. Requiere `commands.debug: true`.
- `/usage off|tokens|full|cost` controla el pie de uso por respuesta o imprime un resumen local de costes.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulta [/tools/tts](/es/tools/tts).
- `/restart` reinicia OpenClaw cuando está habilitado. Predeterminado: habilitado; establece `commands.restart: false` para deshabilitarlo.
- `/activation mention|always` establece el modo de activación de grupo.
- `/send on|off|inherit` establece la política de envío. Solo propietario.
- `/bash <command>` ejecuta un comando del shell del host. Solo texto. Alias: `! <command>`. Requiere `commands.bash: true` más listas de permitidos `tools.elevated`.
- `!poll [sessionId]` comprueba un trabajo bash en segundo plano.
- `!stop [sessionId]` detiene un trabajo bash en segundo plano.

### Comandos dock generados

Los comandos dock se generan a partir de plugins de canal con compatibilidad con comandos nativos. Conjunto empaquetado actual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins empaquetados

Los plugins empaquetados pueden añadir más comandos de barra diagonal. Comandos empaquetados actuales en este repositorio:

- `/dreaming [on|off|status|help]` alterna Dreaming de memory. Consulta [Dreaming](/es/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestiona el flujo de emparejamiento/configuración de dispositivos. Consulta [Emparejamiento](/es/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporalmente comandos de nodo telefónico de alto riesgo.
- `/voice status|list [limit]|set <voiceId|name>` gestiona la configuración de voz de Talk. En Discord, el nombre del comando nativo es `/talkvoice`.
- `/card ...` envía preajustes de tarjetas enriquecidas de LINE. Consulta [LINE](/es/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecciona y controla el harness empaquetado de app-server de Codex. Consulta [Codex Harness](/es/plugins/codex-harness).
- Comandos solo de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinámicos de Skills

Las Skills invocables por el usuario también se exponen como comandos de barra diagonal:

- `/skill <name> [input]` siempre funciona como punto de entrada genérico.
- las Skills también pueden aparecer como comandos directos como `/prose` cuando la Skill/el Plugin los registra.
- el registro nativo de comandos de Skill está controlado por `commands.nativeSkills` y `channels.<provider>.commands.nativeSkills`.

Notas:

- Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo `/think: high`, `/send: on`, `/help:`).
- `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como el cuerpo del mensaje.
- Para ver el desglose completo del uso del proveedor, usa `openclaw status --usage`.
- `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
- En canales con varias cuentas, `/allowlist --account <id>` dirigido a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
- `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costes a partir de los registros de sesión de OpenClaw.
- `/restart` está habilitado de forma predeterminada; establece `commands.restart: false` para deshabilitarlo.
- `/plugins install <spec>` acepta las mismas especificaciones de Plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
- `/plugins enable|disable` actualiza la configuración del Plugin y puede solicitar un reinicio.
- Comando nativo solo de Discord: `/vc join|leave|status` controla los canales de voz (requiere `channels.discord.voice` y comandos nativos; no está disponible como texto).
- Los comandos de enlace de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que los enlaces efectivos de hilo estén habilitados (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
- Referencia de comandos ACP y comportamiento en tiempo de ejecución: [ACP Agents](/es/tools/acp-agents).
- `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en uso normal.
- `/trace` es más limitado que `/verbose`: solo revela líneas de rastreo/depuración propiedad de Plugin y mantiene desactivado el ruido normal detallado de tools.
- `/fast on|off` persiste un reemplazo de sesión. Usa la opción `inherit` de la UI de Sessions para borrarlo y volver a los valores predeterminados de configuración.
- `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes públicas directas a Anthropic, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
- Los resúmenes de fallos de tools se siguen mostrando cuando corresponde, pero el texto detallado del fallo solo se incluye cuando `/verbose` está en `on` o `full`.
- `/reasoning`, `/verbose` y `/trace` son arriesgados en entornos de grupo: pueden revelar razonamiento interno, salida de tools o diagnósticos de Plugin que no pretendías exponer. Es preferible dejarlos desactivados, especialmente en chats de grupo.
- `/model` persiste inmediatamente el nuevo modelo de sesión.
- Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
- Si la actividad de tools o la salida de respuesta ya ha comenzado, el cambio pendiente puede permanecer en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- **Ruta rápida:** los mensajes solo de comando de remitentes en allowlist se gestionan de inmediato (omiten cola + modelo).
- **Restricción por menciones en grupos:** los mensajes solo de comando de remitentes en allowlist omiten los requisitos de mención.
- **Atajos en línea (solo remitentes en allowlist):** ciertos comandos también funcionan cuando se insertan en un mensaje normal y se eliminan antes de que el modelo vea el texto restante.
  - Ejemplo: `hey /status` activa una respuesta de estado y el texto restante sigue por el flujo normal.
- Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Los mensajes solo de comando no autorizados se ignoran silenciosamente, y los tokens `/...` en línea se tratan como texto sin formato.
- **Comandos de Skills:** las Skills `user-invocable` se exponen como comandos de barra diagonal. Los nombres se sanean a `a-z0-9_` (máx. 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo `_2`).
  - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden comandos por Skill).
  - De forma predeterminada, los comandos de Skill se reenvían al modelo como una solicitud normal.
  - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una tool (determinista, sin modelo).
  - Ejemplo: `/prose` (Plugin OpenProse) — consulta [OpenProse](/es/prose).
- **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos requeridos). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento.

## `/tools`

`/tools` responde a una pregunta de tiempo de ejecución, no a una pregunta de configuración: **qué puede usar este agente ahora mismo en
esta conversación**.

- `/tools` predeterminado es compacto y está optimizado para un escaneo rápido.
- `/tools verbose` añade descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo selector de modo `compact|verbose`.
- Los resultados tienen alcance de sesión, por lo que cambiar agente, canal, hilo, autorización del remitente o modelo puede
  cambiar la salida.
- `/tools` incluye tools realmente accesibles en tiempo de ejecución, incluidas tools del core, tools de Plugin conectadas y tools propiedad del canal.

Para editar perfiles y reemplazos, usa el panel Tools de Control UI o las superficies de configuración/catálogo en lugar de
tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra dónde)

- **Uso/cuota del proveedor** (ejemplo: “Claude 80% left”) aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% left`; para MiniMax, los campos porcentuales de solo restante se invierten antes de mostrarse, y las respuestas `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan marcada por modelo.
- Las **líneas de tokens/caché** en `/status` pueden recurrir a la última entrada de uso de la transcripción cuando la instantánea de sesión en vivo es escasa. Los valores en vivo distintos de cero siguen teniendo prioridad, y el fallback de transcripción también puede recuperar la etiqueta del modelo activo de tiempo de ejecución más un total orientado al prompt mayor cuando faltan los totales almacenados o son menores.
- **Tokens/coste por respuesta** se controla con `/usage off|tokens|full` (se agrega a las respuestas normales).
- `/model status` trata sobre **modelos/autenticación/endpoints**, no sobre uso.

## Selección de modelo (`/model`)

`/model` está implementado como una directiva.

Ejemplos:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Notas:

- `/model` y `/model list` muestran un selector compacto numerado (familia de modelos + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de envío.
- `/model <#>` selecciona desde ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint configurado del proveedor (`baseUrl`) y el modo API (`api`) cuando están disponibles.

## Reemplazos de depuración

`/debug` te permite establecer reemplazos de configuración **solo de tiempo de ejecución** (memory, no disco). Solo propietario. Deshabilitado de forma predeterminada; actívalo con `commands.debug: true`.

Ejemplos:

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- Los reemplazos se aplican de inmediato a nuevas lecturas de configuración, pero **no** escriben en `openclaw.json`.
- Usa `/debug reset` para borrar todos los reemplazos y volver a la configuración en disco.

## Salida de rastreo de Plugin

`/trace` te permite alternar **líneas de rastreo/depuración de Plugin con alcance de sesión** sin activar el modo detallado completo.

Ejemplos:

```text
/trace
/trace on
/trace off
```

Notas:

- `/trace` sin argumento muestra el estado actual de rastreo de la sesión.
- `/trace on` habilita líneas de rastreo de Plugin para la sesión actual.
- `/trace off` las deshabilita de nuevo.
- Las líneas de rastreo de Plugin pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.
- `/trace` no sustituye a `/debug`; `/debug` sigue gestionando reemplazos de configuración solo de tiempo de ejecución.
- `/trace` no sustituye a `/verbose`; la salida detallada normal de tools/estado sigue perteneciendo a `/verbose`.

## Actualizaciones de configuración

`/config` escribe en tu configuración en disco (`openclaw.json`). Solo propietario. Deshabilitado de forma predeterminada; actívalo con `commands.config: true`.

Ejemplos:

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Notas:

- La configuración se valida antes de escribir; los cambios no válidos se rechazan.
- Las actualizaciones de `/config` persisten tras los reinicios.

## Actualizaciones de MCP

`/mcp` escribe definiciones de servidor MCP gestionadas por OpenClaw bajo `mcp.servers`. Solo propietario. Deshabilitado de forma predeterminada; actívalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notas:

- `/mcp` almacena la configuración en la configuración de OpenClaw, no en ajustes de proyecto propiedad de Pi.
- Los adaptadores de tiempo de ejecución deciden qué transportes son realmente ejecutables.

## Actualizaciones de Plugin

`/plugins` permite a los operadores inspeccionar los plugins descubiertos y alternar la habilitación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Deshabilitado de forma predeterminada; actívalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notas:

- `/plugins list` y `/plugins show` usan descubrimiento real de plugins contra el espacio de trabajo actual más la configuración en disco.
- `/plugins enable|disable` actualiza solo la configuración del Plugin; no instala ni desinstala plugins.
- Después de cambios de habilitar/deshabilitar, reinicia el gateway para aplicarlos.

## Notas de superficie

- **Los comandos de texto** se ejecutan en la sesión normal de chat (los mensajes directos comparten `main`, los grupos tienen su propia sesión).
- **Los comandos nativos** usan sesiones aisladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (apunta a la sesión de chat mediante `CommandTargetSessionKey`)
- **`/stop`** apunta a la sesión de chat activa para poder abortar la ejecución actual.
- **Slack:** `channels.slack.slashCommand` sigue siendo compatible para un único comando estilo `/openclaw`. Si habilitas `commands.native`, debes crear un comando de barra diagonal de Slack por cada comando integrado (con los mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.
  - Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

## Preguntas laterales BTW

`/btw` es una **pregunta lateral** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada puntual independiente **sin tools**,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de la transcripción,
- se entrega como un resultado lateral en vivo en lugar de un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la tarea
principal sigue en curso.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [BTW Side Questions](/es/tools/btw) para ver el comportamiento completo y los detalles de UX
del cliente.
