---
read_when:
    - Trabajando en funciones de Telegram o Webhooks
summary: Estado de compatibilidad del bot de Telegram, capacidades y configuración
title: Telegram
x-i18n:
    generated_at: "2026-04-22T04:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (API de bots)

Estado: listo para producción para mensajes directos de bots + grupos mediante grammY. El sondeo largo es el modo predeterminado; el modo Webhook es opcional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos para Telegram es pairing.
  </Card>
  <Card title="Solución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y guías de reparación.
  </Card>
  <Card title="Configuración del Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Crear el token del bot en BotFather">
    Abre Telegram y chatea con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`).

    Ejecuta `/newbot`, sigue las indicaciones y guarda el token.

  </Step>

  <Step title="Configurar el token y la política de mensajes directos">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Respaldo por variable de entorno: `TELEGRAM_BOT_TOKEN=...` (solo cuenta predeterminada).
    Telegram **no** usa `openclaw channels login telegram`; configura el token en la configuración/entorno y luego inicia el Gateway.

  </Step>

  <Step title="Iniciar el Gateway y aprobar el primer mensaje directo">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de pairing vencen después de 1 hora.

  </Step>

  <Step title="Añadir el bot a un grupo">
    Añade el bot a tu grupo y luego establece `channels.telegram.groups` y `groupPolicy` para que coincidan con tu modelo de acceso.
  </Step>
</Steps>

<Note>
El orden de resolución del token distingue entre cuentas. En la práctica, los valores de configuración tienen prioridad sobre el respaldo por variable de entorno, y `TELEGRAM_BOT_TOKEN` solo se aplica a la cuenta predeterminada.
</Note>

## Configuración del lado de Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidad y visibilidad en grupos">
    Los bots de Telegram usan **Modo de privacidad** de forma predeterminada, lo que limita qué mensajes de grupo reciben.

    Si el bot debe ver todos los mensajes del grupo, haz una de estas dos cosas:

    - desactivar el modo de privacidad mediante `/setprivacy`, o
    - convertir el bot en administrador del grupo.

    Al cambiar el modo de privacidad, elimina y vuelve a añadir el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Permisos de grupo">
    El estado de administrador se controla en la configuración del grupo de Telegram.

    Los bots administradores reciben todos los mensajes del grupo, lo que es útil para un comportamiento de grupo siempre activo.

  </Accordion>

  <Accordion title="Opciones útiles de BotFather">

    - `/setjoingroups` para permitir/denegar adiciones a grupos
    - `/setprivacy` para el comportamiento de visibilidad en grupos

  </Accordion>
</AccordionGroup>

## Control de acceso y activación

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.telegram.dmPolicy` controla el acceso a mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos un ID de remitente en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` acepta ID numéricos de usuario de Telegram. Los prefijos `telegram:` / `tg:` se aceptan y se normalizan.
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los mensajes directos y es rechazado por la validación de configuración.
    La configuración solicita solo ID numéricos de usuario.
    Si actualizaste y tu configuración contiene entradas de lista de permitidos con `@username`, ejecuta `openclaw doctor --fix` para resolverlas (mejor esfuerzo; requiere un token de bot de Telegram).
    Si antes dependías de archivos de lista de permitidos en el almacén de pairing, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` en flujos de lista de permitidos (por ejemplo, cuando `dmPolicy: "allowlist"` todavía no tiene ID explícitos).

    Para bots de un solo propietario, prefiere `dmPolicy: "allowlist"` con ID explícitos y numéricos en `allowFrom` para mantener una política de acceso duradera en la configuración (en lugar de depender de aprobaciones previas de pairing).

    Confusión común: aprobar pairing de mensajes directos no significa “este remitente está autorizado en todas partes”.
    Pairing concede acceso solo a mensajes directos. La autorización del remitente en grupos sigue viniendo de listas de permitidos explícitas en la configuración.
    Si quieres “estoy autorizado una vez y tanto los mensajes directos como los comandos de grupo funcionan”, coloca tu ID numérico de usuario de Telegram en `channels.telegram.allowFrom`.

    ### Encontrar tu ID de usuario de Telegram

    Más seguro (sin bot de terceros):

    1. Envía un mensaje directo a tu bot.
    2. Ejecuta `openclaw logs --follow`.
    3. Lee `from.id`.

    Método oficial de la API de bots:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Método de terceros (menos privado): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Política de grupos y listas de permitidos">
    Se aplican juntos dos controles:

    1. **Qué grupos están permitidos** (`channels.telegram.groups`)
       - sin configuración de `groups`:
         - con `groupPolicy: "open"`: cualquier grupo puede superar las comprobaciones de ID de grupo
         - con `groupPolicy: "allowlist"` (predeterminado): los grupos se bloquean hasta que añadas entradas en `groups` (o `"*"`)
       - `groups` configurado: actúa como lista de permitidos (ID explícitos o `"*"`)

    2. **Qué remitentes están permitidos en grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predeterminado)
       - `disabled`

    `groupAllowFrom` se usa para el filtrado de remitentes en grupos. Si no está establecido, Telegram usa `allowFrom` como respaldo.
    Las entradas de `groupAllowFrom` deben ser ID numéricos de usuario de Telegram (los prefijos `telegram:` / `tg:` se normalizan).
    No pongas ID de chats de grupo o supergrupo de Telegram en `groupAllowFrom`. Los ID de chat negativos deben ir en `channels.telegram.groups`.
    Las entradas no numéricas se ignoran para la autorización del remitente.
    Límite de seguridad (`2026.2.25+`): la autenticación del remitente en grupos **no** hereda aprobaciones del almacén de pairing de mensajes directos.
    Pairing sigue siendo solo para mensajes directos. Para grupos, establece `groupAllowFrom` o `allowFrom` por grupo/tema.
    Si `groupAllowFrom` no está establecido, Telegram usa como respaldo `allowFrom` de la configuración, no el almacén de pairing.
    Patrón práctico para bots de un solo propietario: establece tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin establecer y permite los grupos de destino en `channels.telegram.groups`.
    Nota de ejecución: si `channels.telegram` falta por completo, la ejecución usa de forma predeterminada un cierre por error con `groupPolicy="allowlist"`, a menos que `channels.defaults.groupPolicy` esté establecido explícitamente.

    Ejemplo: permitir a cualquier miembro en un grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Ejemplo: permitir solo usuarios específicos dentro de un grupo específico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Error común: `groupAllowFrom` no es una lista de permitidos de grupos de Telegram.

      - Pon los ID negativos de grupos o supergrupos de Telegram como `-1001234567890` en `channels.telegram.groups`.
      - Pon los ID de usuario de Telegram como `8734062810` en `groupAllowFrom` cuando quieras limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo cuando quieras que cualquier miembro de un grupo permitido pueda hablar con el bot.
    </Warning>

  </Tab>

  <Tab title="Comportamiento de menciones">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La mención puede venir de:

    - una mención nativa `@botusername`, o
    - patrones de mención en:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternancias de comandos a nivel de sesión:

    - `/activation always`
    - `/activation mention`

    Estas actualizan solo el estado de la sesión. Usa la configuración para persistencia.

    Ejemplo de configuración persistente:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Obtener el ID del chat grupal:

    - reenviar un mensaje del grupo a `@userinfobot` / `@getidsbot`
    - o leer `chat.id` desde `openclaw logs --follow`
    - o inspeccionar `getUpdates` de la API de bots

  </Tab>
</Tabs>

## Comportamiento en tiempo de ejecución

- Telegram es propiedad del proceso del Gateway.
- El enrutamiento es determinista: las respuestas entrantes de Telegram vuelven a Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el sobre compartido del canal con metadatos de respuesta y marcadores de posición multimedia.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas del foro añaden `:topic:<threadId>` para mantener los temas aislados.
- Los mensajes directos pueden incluir `message_thread_id`; OpenClaw los enruta con claves de sesión con reconocimiento de hilos y conserva el ID del hilo para las respuestas.
- El sondeo largo usa el ejecutor de grammY con secuenciación por chat/por hilo. La concurrencia total del sumidero del ejecutor usa `agents.defaults.maxConcurrent`.
- Los reinicios del watchdog de sondeo largo se activan después de 120 segundos sin actividad completada de `getUpdates` de forma predeterminada. Aumenta `channels.telegram.pollingStallThresholdMs` solo si tu despliegue sigue viendo reinicios falsos por bloqueo de sondeo durante trabajos de larga duración. El valor está en milisegundos y se permite de `30000` a `600000`; se admiten anulaciones por cuenta.
- La API de bots de Telegram no admite confirmación de lectura (`sendReadReceipts` no se aplica).

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Vista previa de transmisión en vivo (ediciones de mensajes)">
    OpenClaw puede transmitir respuestas parciales en tiempo real:

    - chats directos: mensaje de vista previa + `editMessageText`
    - grupos/temas: mensaje de vista previa + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - `progress` se asigna a `partial` en Telegram (compatibilidad con la nomenclatura entre canales)
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramientas/progreso reutilizan el mismo mensaje de vista previa editado (predeterminado: `true`). Establece `false` para mantener mensajes separados de herramientas/progreso.
    - los valores heredados `channels.telegram.streamMode` y `streaming` booleano se asignan automáticamente

    Para respuestas solo de texto:

    - mensaje directo: OpenClaw conserva el mismo mensaje de vista previa y realiza una edición final en el mismo lugar (sin segundo mensaje)
    - grupo/tema: OpenClaw conserva el mismo mensaje de vista previa y realiza una edición final en el mismo lugar (sin segundo mensaje)

    Para respuestas complejas (por ejemplo, cargas multimedia), OpenClaw recurre a la entrega final normal y luego limpia el mensaje de vista previa.

    La transmisión de vista previa es independiente de la transmisión por bloques. Cuando la transmisión por bloques está habilitada explícitamente para Telegram, OpenClaw omite la transmisión de vista previa para evitar la transmisión doble.

    Si el transporte nativo de borradores no está disponible o es rechazado, OpenClaw recurre automáticamente a `sendMessage` + `editMessageText`.

    Flujo de razonamiento solo para Telegram:

    - `/reasoning stream` envía el razonamiento a la vista previa en vivo mientras genera
    - la respuesta final se envía sin el texto de razonamiento

  </Accordion>

  <Accordion title="Formato y respaldo HTML">
    El texto saliente usa Telegram `parse_mode: "HTML"`.

    - El texto con estilo Markdown se representa como HTML seguro para Telegram.
    - El HTML sin procesar del modelo se escapa para reducir errores de análisis de Telegram.
    - Si Telegram rechaza el HTML analizado, OpenClaw lo reintenta como texto sin formato.

    Las vistas previas de enlaces están habilitadas de forma predeterminada y pueden deshabilitarse con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El registro del menú de comandos de Telegram se gestiona al inicio con `setMyCommands`.

    Valores predeterminados de comandos nativos:

    - `commands.native: "auto"` habilita comandos nativos para Telegram

    Añadir entradas personalizadas al menú de comandos:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Respaldo de Git" },
        { command: "generate", description: "Crear una imagen" },
      ],
    },
  },
}
```

    Reglas:

    - los nombres se normalizan (quitar `/` inicial, minúsculas)
    - patrón válido: `a-z`, `0-9`, `_`, longitud `1..32`
    - los comandos personalizados no pueden sobrescribir comandos nativos
    - los conflictos/duplicados se omiten y se registran

    Notas:

    - los comandos personalizados son solo entradas del menú; no implementan comportamiento automáticamente
    - los comandos de Plugin/Skills pueden seguir funcionando cuando se escriben aunque no se muestren en el menú de Telegram

    Si los comandos nativos están deshabilitados, los integrados se eliminan. Los comandos personalizados/de Plugin aún pueden registrarse si están configurados.

    Errores comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú de Telegram siguió desbordándose después de recortarlo; reduce los comandos personalizados/de Plugin/Skills o deshabilita `channels.telegram.commands.native`.
    - `setMyCommands failed` con errores de red/fetch normalmente significa que el DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de emparejamiento de dispositivos (Plugin `device-pair`)

    Cuando el Plugin `device-pair` está instalado:

    1. `/pair` genera un código de configuración
    2. pega el código en la aplicación de iOS
    3. `/pair pending` enumera las solicitudes pendientes (incluidos rol/ámbitos)
    4. aprueba la solicitud:
       - `/pair approve <requestId>` para aprobación explícita
       - `/pair approve` cuando solo hay una solicitud pendiente
       - `/pair approve latest` para la más reciente

    El código de configuración lleva un token bootstrap de corta duración. La transferencia bootstrap integrada mantiene el token del Node primario en `scopes: []`; cualquier token de operador transferido permanece limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`. Las comprobaciones de ámbito bootstrap usan prefijos de rol, por lo que esa lista de permitidos de operador solo satisface solicitudes de operador; los roles que no son de operador siguen necesitando ámbitos bajo su propio prefijo de rol.

    Si un dispositivo vuelve a intentar con detalles de autenticación cambiados (por ejemplo, rol/ámbitos/clave pública), la solicitud pendiente anterior queda reemplazada y la nueva solicitud usa un `requestId` diferente. Vuelve a ejecutar `/pair pending` antes de aprobar.

    Más detalles: [Pairing](/es/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Botones en línea">
    Configura el alcance del teclado en línea:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Anulación por cuenta:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Alcances:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (predeterminado)

    El valor heredado `capabilities: ["inlineButtons"]` se asigna a `inlineButtons: "all"`.

    Ejemplo de acción de mensaje:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Los clics de devolución de llamada se pasan al agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Acciones de mensajes de Telegram para agentes y automatización">
    Las acciones de herramientas de Telegram incluyen:

    - `sendMessage` (`to`, `content`, opcional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcional `iconColor`, `iconCustomEmojiId`)

    Las acciones de mensajes de canal exponen alias ergonómicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de restricción:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predeterminado: deshabilitado)

    Nota: `edit` y `topic-create` están actualmente habilitados de forma predeterminada y no tienen alternancias separadas `channels.telegram.actions.*`.
    Los envíos en tiempo de ejecución usan la instantánea activa de configuración/secretos (inicio/recarga), por lo que las rutas de acción no realizan una nueva resolución ad hoc de SecretRef por cada envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions)

  </Accordion>

  <Accordion title="Etiquetas de hilos de respuesta">
    Telegram admite etiquetas explícitas de hilos de respuesta en la salida generada:

    - `[[reply_to_current]]` responde al mensaje que activó la acción
    - `[[reply_to:<id>]]` responde a un ID específico de mensaje de Telegram

    `channels.telegram.replyToMode` controla el manejo:

    - `off` (predeterminado)
    - `first`
    - `all`

    Nota: `off` deshabilita los hilos implícitos de respuesta. Las etiquetas explícitas `[[reply_to_*]]` siguen respetándose.

  </Accordion>

  <Accordion title="Temas del foro y comportamiento de hilos">
    Supergrupos de foros:

    - las claves de sesión de temas añaden `:topic:<threadId>`
    - las respuestas y la acción de escritura se dirigen al hilo del tema
    - ruta de configuración del tema:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial del tema general (`threadId=1`):

    - los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)`)
    - las acciones de escritura siguen incluyendo `message_thread_id`

    Herencia de temas: las entradas de temas heredan la configuración del grupo salvo que se anule (`requireMention`, `allowFrom`, `Skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` es exclusivo del tema y no se hereda de los valores predeterminados del grupo.

    **Enrutamiento de agentes por tema**: cada tema puede enrutar a un agente diferente estableciendo `agentId` en la configuración del tema. Esto da a cada tema su propio espacio de trabajo, memoria y sesión aislados. Ejemplo:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Tema general → agente principal
                "3": { agentId: "zu" },        // Tema de desarrollo → agente zu
                "5": { agentId: "coder" }      // Revisión de código → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Cada tema tiene entonces su propia clave de sesión: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Vinculación persistente de temas ACP**: los temas del foro pueden fijar sesiones del arnés ACP mediante vinculaciones ACP tipadas de nivel superior:

    - `bindings[]` con `type: "acp"` y `match.channel: "telegram"`

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
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Actualmente esto se limita a temas de foros en grupos y supergrupos.

    **Generación de ACP vinculada a hilos desde el chat**:

    - `/acp spawn <agent> --thread here|auto` puede vincular el tema actual de Telegram a una nueva sesión ACP.
    - Los mensajes posteriores del tema se enrutan directamente a la sesión ACP vinculada (no se requiere `/acp steer`).
    - OpenClaw fija el mensaje de confirmación de generación dentro del tema después de una vinculación correcta.
    - Requiere `channels.telegram.threadBindings.spawnAcpSessions=true`.

    El contexto de plantilla incluye:

    - `MessageThreadId`
    - `IsForum`

    Comportamiento de hilos en mensajes directos:

    - los chats privados con `message_thread_id` mantienen el enrutamiento de mensajes directos, pero usan claves de sesión y destinos de respuesta con reconocimiento de hilos.

  </Accordion>

  <Accordion title="Audio, video y stickers">
    ### Mensajes de audio

    Telegram distingue entre notas de voz y archivos de audio.

    - predeterminado: comportamiento de archivo de audio
    - etiqueta `[[audio_as_voice]]` en la respuesta del agente para forzar el envío como nota de voz

    Ejemplo de acción de mensaje:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Mensajes de video

    Telegram distingue entre archivos de video y notas de video.

    Ejemplo de acción de mensaje:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Las notas de video no admiten subtítulos; el texto del mensaje proporcionado se envía por separado.

    ### Stickers

    Manejo de stickers entrantes:

    - WEBP estático: se descarga y procesa (marcador de posición `<media:sticker>`)
    - TGS animado: se omite
    - WEBM de video: se omite

    Campos de contexto del sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Archivo de caché de stickers:

    - `~/.openclaw/telegram/sticker-cache.json`

    Los stickers se describen una vez (cuando es posible) y se almacenan en caché para reducir llamadas repetidas de visión.

    Habilitar acciones de stickers:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Acción para enviar sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Buscar stickers en caché:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notificaciones de reacciones">
    Las reacciones de Telegram llegan como actualizaciones `message_reaction` (separadas de las cargas de mensajes).

    Cuando están habilitadas, OpenClaw pone en cola eventos del sistema como:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configuración:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predeterminado: `minimal`)

    Notas:

    - `own` significa solo reacciones de usuarios a mensajes enviados por el bot (mejor esfuerzo mediante caché de mensajes enviados).
    - Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); los remitentes no autorizados se descartan.
    - Telegram no proporciona ID de hilo en las actualizaciones de reacciones.
      - los grupos que no son foros se enrutan a la sesión de chat grupal
      - los grupos de foro se enrutan a la sesión del tema general del grupo (`:topic:1`), no al tema exacto de origen

    `allowed_updates` para sondeo/Webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - respaldo al emoji de identidad del agente (`agents.list[].identity.emoji`, si no, "👀")

    Notas:

    - Telegram espera emoji Unicode (por ejemplo "👀").
    - Usa `""` para deshabilitar la reacción para un canal o cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración desde eventos y comandos de Telegram">
    Las escrituras de configuración del canal están habilitadas de forma predeterminada (`configWrites !== false`).

    Las escrituras activadas por Telegram incluyen:

    - eventos de migración de grupos (`migrate_to_chat_id`) para actualizar `channels.telegram.groups`
    - `/config set` y `/config unset` (requiere habilitación de comandos)

    Deshabilitar:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Sondeo largo frente a Webhook">
    Predeterminado: sondeo largo.

    Modo Webhook:

    - establecer `channels.telegram.webhookUrl`
    - establecer `channels.telegram.webhookSecret` (obligatorio cuando se establece la URL del Webhook)
    - opcional `channels.telegram.webhookPath` (predeterminado `/telegram-webhook`)
    - opcional `channels.telegram.webhookHost` (predeterminado `127.0.0.1`)
    - opcional `channels.telegram.webhookPort` (predeterminado `8787`)

    El listener local predeterminado para el modo Webhook se vincula a `127.0.0.1:8787`.

    Si tu endpoint público es diferente, coloca un proxy inverso delante y apunta `webhookUrl` a la URL pública.
    Establece `webhookHost` (por ejemplo `0.0.0.0`) cuando necesites intencionalmente ingreso externo.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de CLI">
    - `channels.telegram.textChunkLimit` tiene como valor predeterminado 4000.
    - `channels.telegram.chunkMode="newline"` prefiere límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (predeterminado 100) limita el tamaño de contenido multimedia entrante y saliente de Telegram.
    - `channels.telegram.timeoutSeconds` anula el tiempo de espera del cliente de la API de Telegram (si no se establece, se aplica el valor predeterminado de grammY).
    - `channels.telegram.pollingStallThresholdMs` tiene como valor predeterminado `120000`; ajústalo entre `30000` y `600000` solo para reinicios falsos positivos por bloqueo del sondeo.
    - el historial de contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predeterminado 50); `0` lo deshabilita.
    - el contexto suplementario de respuesta/cita/reenvío se pasa actualmente tal como se recibe.
    - las listas de permitidos de Telegram sirven principalmente para controlar quién puede activar el agente, no como un límite completo de redacción del contexto suplementario.
    - controles del historial de mensajes directos:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configuración `channels.telegram.retry` se aplica a los asistentes de envío de Telegram (CLI/herramientas/acciones) para errores recuperables de la API saliente.

    El destino de envío de CLI puede ser un ID numérico de chat o un nombre de usuario:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Los sondeos de Telegram usan `openclaw message poll` y admiten temas de foro:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Indicadores de sondeo solo para Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para temas de foro (o usa un destino `:topic:`)

    El envío de Telegram también admite:

    - `--presentation` con bloques `buttons` para teclados en línea cuando `channels.telegram.capabilities.inlineButtons` lo permite
    - `--pin` o `--delivery '{"pin":true}'` para solicitar entrega fijada cuando el bot puede fijar en ese chat
    - `--force-document` para enviar imágenes y GIF salientes como documentos en lugar de cargas comprimidas como foto o multimedia animado

    Restricción de acciones:

    - `channels.telegram.actions.sendMessage=false` deshabilita los mensajes salientes de Telegram, incluidos los sondeos
    - `channels.telegram.actions.poll=false` deshabilita la creación de sondeos de Telegram mientras deja habilitados los envíos normales

  </Accordion>

  <Accordion title="Aprobaciones de exec en Telegram">
    Telegram admite aprobaciones de exec en los mensajes directos de los aprobadores y opcionalmente puede publicar solicitudes de aprobación en el chat o tema de origen.

    Ruta de configuración:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opcional; usa como respaldo ID numéricos de propietarios inferidos desde `allowFrom` y `defaultTo` directo cuando sea posible)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`

    Los aprobadores deben ser ID numéricos de usuario de Telegram. Telegram habilita automáticamente las aprobaciones nativas de exec cuando `enabled` no está establecido o es `"auto"` y se puede resolver al menos un aprobador, ya sea desde `execApprovals.approvers` o desde la configuración numérica de propietario de la cuenta (`allowFrom` y `defaultTo` de mensajes directos). Establece `enabled: false` para deshabilitar explícitamente Telegram como cliente nativo de aprobación. De lo contrario, las solicitudes de aprobación recurren a otras rutas de aprobación configuradas o a la política de respaldo de aprobación de exec.

    Telegram también representa los botones compartidos de aprobación usados por otros canales de chat. El adaptador nativo de Telegram añade principalmente el enrutamiento de mensajes directos de aprobadores, la distribución a canales/temas y las sugerencias de escritura antes de la entrega.
    Cuando esos botones están presentes, son la UX principal de aprobación; OpenClaw
    solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta indique
    que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

    Reglas de entrega:

    - `target: "dm"` envía solicitudes de aprobación solo a mensajes directos de aprobadores resueltos
    - `target: "channel"` devuelve la solicitud al chat/tema de Telegram de origen
    - `target: "both"` envía a los mensajes directos de aprobadores y al chat/tema de origen

    Solo los aprobadores resueltos pueden aprobar o denegar. Los no aprobadores no pueden usar `/approve` ni los botones de aprobación de Telegram.

    Comportamiento de resolución de aprobaciones:

    - los ID con prefijo `plugin:` siempre se resuelven mediante aprobaciones de Plugin.
    - otros ID intentan primero `exec.approval.resolve`.
    - si Telegram también está autorizado para aprobaciones de Plugin y el Gateway dice
      que la aprobación de exec es desconocida o expiró, Telegram reintenta una vez mediante
      `plugin.approval.resolve`.
    - las denegaciones/errores reales de aprobación de exec no pasan silenciosamente a la
      resolución de aprobaciones de Plugin.

    La entrega por canal muestra el texto del comando en el chat, así que habilita `channel` o `both` solo en grupos/temas de confianza. Cuando la solicitud llega a un tema de foro, OpenClaw conserva el tema tanto para la solicitud de aprobación como para el seguimiento posterior a la aprobación. Las aprobaciones de exec vencen después de 30 minutos de forma predeterminada.

    Los botones de aprobación en línea también dependen de que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`).

    Documentación relacionada: [Aprobaciones de exec](/es/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Controles de respuesta de errores

Cuando el agente encuentra un error de entrega o del proveedor, Telegram puede responder con el texto del error o suprimirlo. Dos claves de configuración controlan este comportamiento:

| Clave                               | Valores           | Predeterminado | Descripción                                                                                          |
| ----------------------------------- | ----------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`        | `reply` envía un mensaje de error amigable al chat. `silent` suprime por completo las respuestas de error. |
| `channels.telegram.errorCooldownMs` | número (ms)       | `60000`        | Tiempo mínimo entre respuestas de error al mismo chat. Evita spam de errores durante interrupciones. |

Se admiten anulaciones por cuenta, por grupo y por tema (la misma herencia que otras claves de configuración de Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suprimir errores en este grupo
        },
      },
    },
  },
}
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="El bot no responde a mensajes de grupo sin mención">

    - Si `requireMention=false`, el modo de privacidad de Telegram debe permitir visibilidad completa.
      - BotFather: `/setprivacy` -> Desactivar
      - luego elimina y vuelve a añadir el bot al grupo
    - `openclaw channels status` advierte cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` puede comprobar ID numéricos explícitos de grupo; el comodín `"*"` no puede comprobarse por membresía.
    - prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve mensajes de grupo en absoluto">

    - cuando existe `channels.telegram.groups`, el grupo debe estar listado (o incluir `"*"`)
    - verifica la membresía del bot en el grupo
    - revisa los registros: `openclaw logs --follow` para ver motivos de omisión

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan en absoluto">

    - autoriza tu identidad de remitente (pairing y/o `allowFrom` numérico)
    - la autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce los comandos personalizados/de Plugin/Skills o deshabilita los menús nativos
    - `setMyCommands failed` con errores de red/fetch normalmente indica problemas de alcance DNS/HTTPS hacia `api.telegram.org`

  </Accordion>

  <Accordion title="Inestabilidad de sondeo o red">

    - Node 22+ + fetch/proxy personalizado puede activar comportamiento de cancelación inmediata si los tipos de AbortSignal no coinciden.
    - Algunos hosts resuelven `api.telegram.org` primero a IPv6; una salida IPv6 defectuosa puede causar fallos intermitentes de la API de Telegram.
    - Si los registros incluyen `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ahora los reintenta como errores de red recuperables.
    - Si los registros incluyen `Polling stall detected`, OpenClaw reinicia el sondeo y reconstruye el transporte de Telegram después de 120 segundos sin actividad completada de sondeo largo, de forma predeterminada.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo cuando las llamadas largas de `getUpdates` son sanas pero tu host sigue informando reinicios falsos por bloqueo del sondeo. Los bloqueos persistentes suelen apuntar a problemas de proxy, DNS, IPv6 o salida TLS entre el host y `api.telegram.org`.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas a la API de Telegram mediante `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa de forma predeterminada `autoSelectFamily=true` (excepto WSL2) y `dnsResultOrder=ipv4first`.
    - Si tu host es WSL2 o explícitamente funciona mejor con comportamiento solo IPv4, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas del rango de referencia RFC 2544 (`198.18.0.0/15`) ya están permitidas
      de forma predeterminada para descargas multimedia de Telegram. Si una IP falsa de confianza o un
      proxy transparente reescribe `api.telegram.org` a alguna otra
      dirección privada/interna/de uso especial durante las descargas multimedia, puedes
      habilitar la omisión solo para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma activación opcional está disponible por cuenta en
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si tu proxy resuelve hosts multimedia de Telegram en `198.18.x.x`, deja primero
      desactivada la opción peligrosa. El contenido multimedia de Telegram ya permite el rango de referencia
      RFC 2544 de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las protecciones
      SSRF del contenido multimedia de Telegram. Úsalo solo para entornos de proxy confiables
      controlados por el operador, como enrutamiento con IP falsa de Clash, Mihomo o Surge, cuando
      sinteticen respuestas privadas o de uso especial fuera del rango de referencia RFC 2544.
      Déjalo desactivado para el acceso normal de Telegram en la internet pública.
    </Warning>

    - Anulaciones por variables de entorno (temporales):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Validar respuestas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Más ayuda: [Solución de problemas del canal](/es/channels/troubleshooting).

## Punteros de referencia de configuración de Telegram

Referencia principal:

- `channels.telegram.enabled`: habilitar/deshabilitar el inicio del canal.
- `channels.telegram.botToken`: token del bot (BotFather).
- `channels.telegram.tokenFile`: leer el token desde la ruta de un archivo regular. Se rechazan los enlaces simbólicos.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing).
- `channels.telegram.allowFrom`: lista de permitidos para mensajes directos (ID numéricos de usuario de Telegram). `allowlist` requiere al menos un ID de remitente. `open` requiere `"*"`. `openclaw doctor --fix` puede resolver entradas heredadas `@username` a ID y puede recuperar entradas de lista de permitidos desde archivos del almacén de pairing en flujos de migración de listas de permitidos.
- `channels.telegram.actions.poll`: habilitar o deshabilitar la creación de sondeos de Telegram (predeterminado: habilitado; sigue requiriendo `sendMessage`).
- `channels.telegram.defaultTo`: destino predeterminado de Telegram usado por CLI `--deliver` cuando no se proporciona `--reply-to` explícito.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (predeterminado: allowlist).
- `channels.telegram.groupAllowFrom`: lista de permitidos de remitentes de grupo (ID numéricos de usuario de Telegram). `openclaw doctor --fix` puede resolver entradas heredadas `@username` a ID. Las entradas no numéricas se ignoran en el momento de autenticación. La autenticación de grupo no usa respaldo del almacén de pairing de mensajes directos (`2026.2.25+`).
- Precedencia de varias cuentas:
  - Cuando se configuran dos o más ID de cuenta, establece `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para hacer explícito el enrutamiento predeterminado.
  - Si no se establece ninguno, OpenClaw usa como respaldo el primer ID de cuenta normalizado y `openclaw doctor` emite una advertencia.
  - `channels.telegram.accounts.default.allowFrom` y `channels.telegram.accounts.default.groupAllowFrom` se aplican solo a la cuenta `default`.
  - Las cuentas con nombre heredan `channels.telegram.allowFrom` y `channels.telegram.groupAllowFrom` cuando los valores a nivel de cuenta no están establecidos.
  - Las cuentas con nombre no heredan `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: valores predeterminados por grupo + lista de permitidos (usa `"*"` para valores predeterminados globales).
  - `channels.telegram.groups.<id>.groupPolicy`: anulación por grupo de groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: valor predeterminado de restricción por mención.
  - `channels.telegram.groups.<id>.skills`: filtro de Skills (omitir = todas las Skills, vacío = ninguna).
  - `channels.telegram.groups.<id>.allowFrom`: anulación por grupo de la lista de permitidos de remitentes.
  - `channels.telegram.groups.<id>.systemPrompt`: system prompt adicional para el grupo.
  - `channels.telegram.groups.<id>.enabled`: deshabilitar el grupo cuando es `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: anulaciones por tema (campos de grupo + `agentId` exclusivo del tema).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: enrutar este tema a un agente específico (anula el enrutamiento a nivel de grupo y de binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: anulación por tema de groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: anulación por tema de la restricción por mención.
- `bindings[]` de nivel superior con `type: "acp"` e ID canónico de tema `chatId:topic:topicId` en `match.peer.id`: campos persistentes de vinculación de temas ACP (consulta [agentes ACP](/es/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: enrutar temas de mensajes directos a un agente específico (mismo comportamiento que los temas del foro).
- `channels.telegram.execApprovals.enabled`: habilitar Telegram como cliente de aprobación de exec basado en chat para esta cuenta.
- `channels.telegram.execApprovals.approvers`: ID de usuario de Telegram autorizados para aprobar o denegar solicitudes de exec. Opcional cuando `channels.telegram.allowFrom` o un `channels.telegram.defaultTo` directo ya identifica al propietario.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (predeterminado: `dm`). `channel` y `both` conservan el tema de Telegram de origen cuando está presente.
- `channels.telegram.execApprovals.agentFilter`: filtro opcional de ID de agente para solicitudes de aprobación reenviadas.
- `channels.telegram.execApprovals.sessionFilter`: filtro opcional de clave de sesión (subcadena o regex) para solicitudes de aprobación reenviadas.
- `channels.telegram.accounts.<account>.execApprovals`: anulación por cuenta para el enrutamiento de aprobaciones de exec de Telegram y la autorización de aprobadores.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (predeterminado: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: anulación por cuenta.
- `channels.telegram.commands.nativeSkills`: habilitar/deshabilitar comandos nativos de Skills de Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (predeterminado: `off`).
- `channels.telegram.textChunkLimit`: tamaño de fragmento saliente (caracteres).
- `channels.telegram.chunkMode`: `length` (predeterminado) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de fragmentar por longitud.
- `channels.telegram.linkPreview`: activar/desactivar vistas previas de enlaces para mensajes salientes (predeterminado: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (vista previa de transmisión en vivo; predeterminado: `partial`; `progress` se asigna a `partial`; `block` es compatibilidad heredada con el modo de vista previa). La transmisión de vista previa de Telegram usa un único mensaje de vista previa que se edita en el mismo lugar.
- `channels.telegram.streaming.preview.toolProgress`: reutilizar el mensaje de vista previa en vivo para actualizaciones de herramientas/progreso cuando la transmisión de vista previa está activa (predeterminado: `true`). Establece `false` para mantener mensajes separados de herramientas/progreso.
- `channels.telegram.mediaMaxMb`: límite de contenido multimedia entrante/saliente de Telegram (MB, predeterminado: 100).
- `channels.telegram.retry`: política de reintentos para asistentes de envío de Telegram (CLI/herramientas/acciones) ante errores recuperables de la API saliente (intentos, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: anular autoSelectFamily de Node (true=habilitar, false=deshabilitar). Está habilitado de forma predeterminada en Node 22+, con WSL2 deshabilitado de forma predeterminada.
- `channels.telegram.network.dnsResultOrder`: anular el orden de resultados DNS (`ipv4first` o `verbatim`). El valor predeterminado es `ipv4first` en Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: activación peligrosa opcional para entornos de IP falsa confiables o de proxy transparente en los que las descargas multimedia de Telegram resuelven `api.telegram.org` a direcciones privadas/internas/de uso especial fuera del rango permitido predeterminado de referencia RFC 2544.
- `channels.telegram.proxy`: URL de proxy para llamadas a la API de bots (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: habilitar modo Webhook (requiere `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: secreto del Webhook (obligatorio cuando se establece webhookUrl).
- `channels.telegram.webhookPath`: ruta local del Webhook (predeterminada `/telegram-webhook`).
- `channels.telegram.webhookHost`: host local de enlace del Webhook (predeterminado `127.0.0.1`).
- `channels.telegram.webhookPort`: puerto local de enlace del Webhook (predeterminado `8787`).
- `channels.telegram.actions.reactions`: restringir reacciones de herramientas de Telegram.
- `channels.telegram.actions.sendMessage`: restringir envíos de mensajes de herramientas de Telegram.
- `channels.telegram.actions.deleteMessage`: restringir eliminaciones de mensajes de herramientas de Telegram.
- `channels.telegram.actions.sticker`: restringir acciones de stickers de Telegram — enviar y buscar (predeterminado: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controla qué reacciones activan eventos del sistema (predeterminado: `own` cuando no está establecido).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controla la capacidad de reacción del agente (predeterminado: `minimal` cuando no está establecido).
- `channels.telegram.errorPolicy`: `reply | silent` — controla el comportamiento de respuesta ante errores (predeterminado: `reply`). Se admiten anulaciones por cuenta/grupo/tema.
- `channels.telegram.errorCooldownMs`: ms mínimos entre respuestas de error al mismo chat (predeterminado: `60000`). Evita spam de errores durante interrupciones.

- [Referencia de configuración - Telegram](/es/gateway/configuration-reference#telegram)

Campos específicos de Telegram de alta relevancia:

- inicio/autenticación: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` debe apuntar a un archivo regular; se rechazan los enlaces simbólicos)
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- aprobaciones de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- hilos/respuestas: `replyToMode`
- transmisión: `streaming` (vista previa), `streaming.preview.toolProgress`, `blockStreaming`
- formato/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/red: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Relacionado

- [Pairing](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento de varios agentes](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
