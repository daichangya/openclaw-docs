---
read_when:
    - Usar o configurar comandos de chat
    - Depurar el enrutamiento de comandos o los permisos
summary: 'Comandos slash: texto frente a nativo, configuración y comandos compatibles'
title: Comandos slash
x-i18n:
    generated_at: "2026-04-06T03:13:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 417e35b9ddd87f25f6c019111b55b741046ea11039dde89210948185ced5696d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos slash

Los comandos son gestionados por el Gateway. La mayoría de los comandos deben enviarse como un mensaje **independiente** que empiece con `/`.
El comando de chat bash solo para host usa `! <cmd>` (con `/bash <cmd>` como alias).

Hay dos sistemas relacionados:

- **Comandos**: mensajes independientes `/...`.
- **Directivas**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Las directivas se eliminan del mensaje antes de que el modelo lo vea.
  - En mensajes de chat normales (no solo de directivas), se tratan como “pistas inline” y **no** conservan la configuración de la sesión.
  - En mensajes que contienen solo directivas (el mensaje contiene únicamente directivas), se conservan en la sesión y responden con una confirmación.
  - Las directivas solo se aplican a **remitentes autorizados**. Si `commands.allowFrom` está configurado, es la única
    allowlist usada; de lo contrario, la autorización proviene de las allowlists/vinculación del canal más `commands.useAccessGroups`.
    Los remitentes no autorizados ven las directivas tratadas como texto sin formato.

También hay algunos **atajos inline** (solo remitentes autorizados/en allowlist): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Se ejecutan inmediatamente, se eliminan antes de que el modelo vea el mensaje y el texto restante continúa por el flujo normal.

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
    restart: false,
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
  - Auto: activado para Discord/Telegram; desactivado para Slack (hasta que añadas comandos slash); ignorado para proveedores sin compatibilidad nativa.
  - Establece `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` para anularlo por proveedor (bool o `"auto"`).
  - `false` borra los comandos registrados anteriormente en Discord/Telegram al iniciar. Los comandos de Slack se gestionan en la app de Slack y no se eliminan automáticamente.
- `commands.nativeSkills` (predeterminado `"auto"`) registra comandos nativos de **Skills** cuando se admite.
  - Auto: activado para Discord/Telegram; desactivado para Slack (Slack requiere crear un comando slash por Skill).
  - Establece `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` para anularlo por proveedor (bool o `"auto"`).
- `commands.bash` (predeterminado `false`) habilita `! <cmd>` para ejecutar comandos de shell del host (`/bash <cmd>` es un alias; requiere allowlists de `tools.elevated`).
- `commands.bashForegroundMs` (predeterminado `2000`) controla cuánto espera bash antes de cambiar a modo en segundo plano (`0` lo manda inmediatamente a segundo plano).
- `commands.config` (predeterminado `false`) habilita `/config` (lee/escribe `openclaw.json`).
- `commands.mcp` (predeterminado `false`) habilita `/mcp` (lee/escribe la configuración MCP gestionada por OpenClaw en `mcp.servers`).
- `commands.plugins` (predeterminado `false`) habilita `/plugins` (detección/estado de plugins más controles de instalación y activación/desactivación).
- `commands.debug` (predeterminado `false`) habilita `/debug` (anulaciones solo de runtime).
- `commands.allowFrom` (opcional) establece una allowlist por proveedor para la autorización de comandos. Cuando está configurada, es la
  única fuente de autorización para comandos y directivas (las allowlists/vinculación del canal y `commands.useAccessGroups`
  se ignoran). Usa `"*"` como valor predeterminado global; las claves específicas por proveedor lo sustituyen.
- `commands.useAccessGroups` (predeterminado `true`) aplica allowlists/políticas para comandos cuando `commands.allowFrom` no está configurado.

## Lista de comandos

Texto + nativo (cuando está habilitado):

- `/help`
- `/commands`
- `/tools [compact|verbose]` (muestra lo que el agente actual puede usar ahora mismo; `verbose` añade descripciones)
- `/skill <name> [input]` (ejecuta una Skill por nombre)
- `/status` (muestra el estado actual; incluye uso/cuota del proveedor para el proveedor del modelo actual cuando está disponible)
- `/tasks` (lista las tareas en segundo plano para la sesión actual; muestra detalles de tareas activas y recientes con recuentos locales de respaldo por agente)
- `/allowlist` (listar/añadir/eliminar entradas de la allowlist)
- `/approve <id> <decision>` (resuelve solicitudes de aprobación de exec; usa el mensaje de aprobación pendiente para ver las decisiones disponibles)
- `/context [list|detail|json]` (explica el “contexto”; `detail` muestra tamaño por archivo + por herramienta + por Skill + del prompt del sistema)
- `/btw <question>` (hace una pregunta secundaria efímera sobre la sesión actual sin cambiar el contexto futuro de la sesión; consulta [/tools/btw](/es/tools/btw))
- `/export-session [path]` (alias: `/export`) (exporta la sesión actual a HTML con el prompt completo del sistema)
- `/whoami` (muestra tu sender id; alias: `/id`)
- `/session idle <duration|off>` (gestiona la desvinculación automática por inactividad para thread bindings enfocados)
- `/session max-age <duration|off>` (gestiona la desvinculación automática por antigüedad máxima estricta para thread bindings enfocados)
- `/subagents list|kill|log|info|send|steer|spawn` (inspecciona, controla o crea ejecuciones de subagentes para la sesión actual)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (inspecciona y controla sesiones de runtime ACP)
- `/agents` (lista los agentes vinculados a hilos para esta sesión)
- `/focus <target>` (Discord: vincula este hilo, o un hilo nuevo, a un destino de sesión/subagente)
- `/unfocus` (Discord: elimina la vinculación actual del hilo)
- `/kill <id|#|all>` (aborta inmediatamente uno o todos los subagentes en ejecución para esta sesión; sin mensaje de confirmación)
- `/steer <id|#> <message>` (redirige inmediatamente un subagente en ejecución: dentro de la ejecución cuando sea posible; en caso contrario, aborta el trabajo actual y reinicia con el mensaje de redirección)
- `/tell <id|#> <message>` (alias de `/steer`)
- `/config show|get|set|unset` (persiste la configuración en disco, solo propietario; requiere `commands.config: true`)
- `/mcp show|get|set|unset` (gestiona la configuración del servidor MCP de OpenClaw, solo propietario; requiere `commands.mcp: true`)
- `/plugins list|show|get|install|enable|disable` (inspecciona plugins detectados, instala nuevos y activa/desactiva su uso; solo propietario para escrituras; requiere `commands.plugins: true`)
  - `/plugin` es un alias de `/plugins`.
  - `/plugin install <spec>` acepta las mismas especificaciones de plugin que `openclaw plugins install`: ruta/archivo local, paquete npm o `clawhub:<pkg>`.
  - Las escrituras de activar/desactivar siguen respondiendo con una sugerencia de reinicio. En un gateway en primer plano con vigilancia, OpenClaw puede realizar ese reinicio automáticamente justo después de la escritura.
- `/debug show|set|unset|reset` (anulaciones de runtime, solo propietario; requiere `commands.debug: true`)
- `/usage off|tokens|full|cost` (pie de uso por respuesta o resumen local de costos)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (controla TTS; consulta [/tts](/es/tools/tts))
  - Discord: el comando nativo es `/voice` (Discord reserva `/tts`); el texto `/tts` sigue funcionando.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (cambia las respuestas a Telegram)
- `/dock-discord` (alias: `/dock_discord`) (cambia las respuestas a Discord)
- `/dock-slack` (alias: `/dock_slack`) (cambia las respuestas a Slack)
- `/activation mention|always` (solo grupos)
- `/send on|off|inherit` (solo propietario)
- `/reset` o `/new [model]` (pista de modelo opcional; el resto se pasa tal cual)
- `/think <off|minimal|low|medium|high|xhigh>` (opciones dinámicas por modelo/proveedor; alias: `/thinking`, `/t`)
- `/fast status|on|off` (si omites el argumento, muestra el estado efectivo actual del modo rápido)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; cuando está activado, envía un mensaje separado con el prefijo `Reasoning:`; `stream` = solo borrador de Telegram)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` omite las aprobaciones de exec)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (envía `/exec` para mostrar el valor actual)
- `/model <name>` (alias: `/models`; o `/<alias>` desde `agents.defaults.models.*.alias`)
- `/queue <mode>` (más opciones como `debounce:2s cap:25 drop:summarize`; envía `/queue` para ver la configuración actual)
- `/bash <command>` (solo host; alias de `! <command>`; requiere `commands.bash: true` + allowlists de `tools.elevated`)
- `/dreaming [on|off|status|help]` (activa/desactiva dreaming global o muestra el estado; consulta [Dreaming](/concepts/dreaming))

Solo texto:

- `/compact [instructions]` (consulta [/concepts/compaction](/es/concepts/compaction))
- `! <command>` (solo host; uno a la vez; usa `!poll` + `!stop` para trabajos de larga duración)
- `!poll` (comprueba salida/estado; acepta `sessionId` opcional; `/bash poll` también funciona)
- `!stop` (detiene el trabajo bash en ejecución; acepta `sessionId` opcional; `/bash stop` también funciona)

Notas:

- Los comandos aceptan un `:` opcional entre el comando y los argumentos (por ejemplo `/think: high`, `/send: on`, `/help:`).
- `/new <model>` acepta un alias de modelo, `provider/model` o un nombre de proveedor (coincidencia difusa); si no hay coincidencia, el texto se trata como cuerpo del mensaje.
- Para ver el desglose completo del uso por proveedor, usa `openclaw status --usage`.
- `/allowlist add|remove` requiere `commands.config=true` y respeta `configWrites` del canal.
- En canales con varias cuentas, `/allowlist --account <id>` orientado a configuración y `/config set channels.<provider>.accounts.<id>...` también respetan `configWrites` de la cuenta de destino.
- `/usage` controla el pie de uso por respuesta; `/usage cost` imprime un resumen local de costos a partir de los registros de sesión de OpenClaw.
- `/restart` está habilitado por defecto; establece `commands.restart: false` para desactivarlo.
- Comando nativo exclusivo de Discord: `/vc join|leave|status` controla canales de voz (requiere `channels.discord.voice` y comandos nativos; no está disponible como texto).
- Los comandos de vinculación de hilos de Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requieren que los thread bindings efectivos estén habilitados (`session.threadBindings.enabled` y/o `channels.discord.threadBindings.enabled`).
- Referencia de comandos ACP y comportamiento del runtime: [Agentes ACP](/es/tools/acp-agents).
- `/verbose` está pensado para depuración y visibilidad adicional; mantenlo **desactivado** en uso normal.
- `/fast on|off` conserva una anulación de sesión. Usa la opción `inherit` de la UI de sesiones para borrarla y volver a los valores predeterminados de configuración.
- `/fast` es específico del proveedor: OpenAI/OpenAI Codex lo asignan a `service_tier=priority` en endpoints nativos de Responses, mientras que las solicitudes públicas directas a Anthropic, incluido el tráfico autenticado por OAuth enviado a `api.anthropic.com`, lo asignan a `service_tier=auto` o `standard_only`. Consulta [OpenAI](/es/providers/openai) y [Anthropic](/es/providers/anthropic).
- Los resúmenes de fallo de herramientas siguen mostrándose cuando corresponde, pero el texto detallado del fallo solo se incluye cuando `/verbose` está en `on` o `full`.
- `/reasoning` (y `/verbose`) son arriesgados en entornos de grupo: pueden revelar razonamiento interno o salida de herramientas que no pretendías exponer. Es preferible dejarlos desactivados, especialmente en chats grupales.
- `/model` conserva inmediatamente el nuevo modelo de la sesión.
- Si el agente está inactivo, la siguiente ejecución lo usa de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto de reintento limpio.
- Si ya ha empezado la actividad de herramientas o la salida de respuesta, el cambio pendiente puede quedar en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- **Ruta rápida:** los mensajes solo de comando de remitentes en allowlist se manejan inmediatamente (omiten cola + modelo).
- **Control de menciones en grupos:** los mensajes solo de comando de remitentes en allowlist omiten los requisitos de mención.
- **Atajos inline (solo remitentes en allowlist):** ciertos comandos también funcionan cuando están incrustados en un mensaje normal y se eliminan antes de que el modelo vea el resto del texto.
  - Ejemplo: `hey /status` activa una respuesta de estado, y el texto restante continúa por el flujo normal.
- Actualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Los mensajes solo de comando no autorizados se ignoran silenciosamente y los tokens inline `/...` se tratan como texto sin formato.
- **Comandos de Skills:** las Skills `user-invocable` se exponen como comandos slash. Los nombres se sanean a `a-z0-9_` (máx. 32 caracteres); las colisiones reciben sufijos numéricos (por ejemplo `_2`).
  - `/skill <name> [input]` ejecuta una Skill por nombre (útil cuando los límites de comandos nativos impiden tener un comando por Skill).
  - Por defecto, los comandos de Skills se reenvían al modelo como una solicitud normal.
  - Las Skills pueden declarar opcionalmente `command-dispatch: tool` para enrutar el comando directamente a una herramienta (determinista, sin modelo).
  - Ejemplo: `/prose` (plugin OpenProse) — consulta [OpenProse](/es/prose).
- **Argumentos de comandos nativos:** Discord usa autocompletado para opciones dinámicas (y menús de botones cuando omites argumentos obligatorios). Telegram y Slack muestran un menú de botones cuando un comando admite opciones y omites el argumento.

## `/tools`

`/tools` responde a una pregunta de runtime, no de configuración: **qué puede usar este agente ahora mismo en
esta conversación**.

- `/tools` por defecto es compacto y está optimizado para lectura rápida.
- `/tools verbose` añade descripciones breves.
- Las superficies de comandos nativos que admiten argumentos exponen el mismo cambio de modo `compact|verbose`.
- Los resultados tienen alcance de sesión, por lo que cambiar el agente, canal, hilo, autorización del remitente o modelo puede
  cambiar la salida.
- `/tools` incluye herramientas realmente accesibles en runtime, incluidas herramientas del núcleo, herramientas
  de plugins conectados y herramientas propiedad del canal.

Para editar perfiles y anulaciones, usa el panel de herramientas de la UI de control o las superficies de configuración/catálogo en lugar de
tratar `/tools` como un catálogo estático.

## Superficies de uso (qué se muestra y dónde)

- **Uso/cuota del proveedor** (ejemplo: “Claude 80% left”) aparece en `/status` para el proveedor del modelo actual cuando el seguimiento de uso está habilitado. OpenClaw normaliza las ventanas del proveedor a `% left`; para MiniMax, los campos de porcentaje de solo restante se invierten antes de mostrarse, y las respuestas `model_remains` prefieren la entrada del modelo de chat más una etiqueta de plan con marca de modelo.
- **Líneas de tokens/caché** en `/status` pueden usar como fallback la última entrada de uso de la transcripción cuando el snapshot de sesión en vivo es escaso. Los valores en vivo no nulos existentes siguen teniendo prioridad, y el fallback de transcripción también puede recuperar la etiqueta del modelo activo de runtime más un total mayor orientado al prompt cuando faltan los totales almacenados o son menores.
- **Tokens/costo por respuesta** se controla con `/usage off|tokens|full` (se añade a las respuestas normales).
- `/model status` trata sobre **modelos/auth/endpoints**, no sobre uso.

## Selección de modelo (`/model`)

`/model` está implementado como una directiva.

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

- `/model` y `/model list` muestran un selector compacto numerado (familia de modelos + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de Submit.
- `/model <#>` selecciona a partir de ese selector (y prefiere el proveedor actual cuando es posible).
- `/model status` muestra la vista detallada, incluido el endpoint configurado del proveedor (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

## Anulaciones de depuración

`/debug` te permite establecer anulaciones de configuración **solo de runtime** (memoria, no disco). Solo propietario. Desactivado por defecto; actívalo con `commands.debug: true`.

Ejemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notas:

- Las anulaciones se aplican inmediatamente a las nuevas lecturas de configuración, pero **no** escriben en `openclaw.json`.
- Usa `/debug reset` para borrar todas las anulaciones y volver a la configuración en disco.

## Actualizaciones de configuración

`/config` escribe en tu configuración en disco (`openclaw.json`). Solo propietario. Desactivado por defecto; actívalo con `commands.config: true`.

Ejemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Notas:

- La configuración se valida antes de escribir; los cambios no válidos se rechazan.
- Las actualizaciones de `/config` persisten tras reinicios.

## Actualizaciones MCP

`/mcp` escribe definiciones de servidores MCP gestionadas por OpenClaw en `mcp.servers`. Solo propietario. Desactivado por defecto; actívalo con `commands.mcp: true`.

Ejemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notas:

- `/mcp` almacena configuración en la configuración de OpenClaw, no en ajustes de proyecto propiedad de Pi.
- Los adaptadores de runtime deciden qué transportes son realmente ejecutables.

## Actualizaciones de plugins

`/plugins` permite a los operadores inspeccionar los plugins detectados y alternar su activación en la configuración. Los flujos de solo lectura pueden usar `/plugin` como alias. Desactivado por defecto; actívalo con `commands.plugins: true`.

Ejemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notas:

- `/plugins list` y `/plugins show` usan detección real de plugins contra el espacio de trabajo actual más la configuración en disco.
- `/plugins enable|disable` actualiza solo la configuración del plugin; no instala ni desinstala plugins.
- Después de cambios de activación/desactivación, reinicia el gateway para aplicarlos.

## Notas de superficie

- **Comandos de texto** se ejecutan en la sesión normal de chat (los mensajes directos comparten `main`, los grupos tienen su propia sesión).
- **Comandos nativos** usan sesiones aisladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefijo configurable mediante `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (apunta a la sesión del chat mediante `CommandTargetSessionKey`)
- **`/stop`** apunta a la sesión de chat activa para poder abortar la ejecución actual.
- **Slack:** `channels.slack.slashCommand` sigue siendo compatible para un único comando tipo `/openclaw`. Si habilitas `commands.native`, debes crear un comando slash de Slack por cada comando integrado (mismos nombres que `/help`). Los menús de argumentos de comandos para Slack se entregan como botones efímeros de Block Kit.
  - Excepción nativa de Slack: registra `/agentstatus` (no `/status`) porque Slack reserva `/status`. El texto `/status` sigue funcionando en mensajes de Slack.

## Preguntas secundarias BTW

`/btw` es una **pregunta secundaria** rápida sobre la sesión actual.

A diferencia del chat normal:

- usa la sesión actual como contexto de fondo,
- se ejecuta como una llamada independiente **sin herramientas** y de una sola vez,
- no cambia el contexto futuro de la sesión,
- no se escribe en el historial de transcripción,
- se entrega como un resultado secundario en vivo en lugar de como un mensaje normal del asistente.

Eso hace que `/btw` sea útil cuando quieres una aclaración temporal mientras la
tarea principal sigue en marcha.

Ejemplo:

```text
/btw what are we doing right now?
```

Consulta [Preguntas secundarias BTW](/es/tools/btw) para ver el comportamiento completo y
los detalles de UX del cliente.
