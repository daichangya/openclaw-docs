---
read_when:
    - Trabajando en funciones o webhooks de Telegram
summary: Estado de compatibilidad, capacidades y configuración del bot de Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-25T13:42:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24c32a83e86358afb662c9c354a1b538c90693d07dcc048eaf047dabd6822f7e
    source_path: channels/telegram.md
    workflow: 15
---

Listo para producción para mensajes directos del bot y grupos mediante grammY. El sondeo largo es el modo predeterminado; el modo webhook es opcional.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos para Telegram es el emparejamiento.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico multicanal y guías de reparación.
  </Card>
  <Card title="Configuración del Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Crea el token del bot en BotFather">
    Abre Telegram y chatea con **@BotFather** (confirma que el identificador sea exactamente `@BotFather`).

    Ejecuta `/newbot`, sigue las indicaciones y guarda el token.

  </Step>

  <Step title="Configura el token y la política de mensajes directos">

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

    Respaldo por variable de entorno: `TELEGRAM_BOT_TOKEN=...` (solo para la cuenta predeterminada).
    Telegram **no** usa `openclaw channels login telegram`; configura el token en la configuración o en el entorno y luego inicia el Gateway.

  </Step>

  <Step title="Inicia el Gateway y aprueba el primer mensaje directo">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Los códigos de emparejamiento caducan después de 1 hora.

  </Step>

  <Step title="Añade el bot a un grupo">
    Añade el bot a tu grupo y luego configura `channels.telegram.groups` y `groupPolicy` para que coincidan con tu modelo de acceso.
  </Step>
</Steps>

<Note>
El orden de resolución del token tiene en cuenta la cuenta. En la práctica, los valores de configuración prevalecen sobre el respaldo por variable de entorno, y `TELEGRAM_BOT_TOKEN` solo se aplica a la cuenta predeterminada.
</Note>

## Configuración del lado de Telegram

<AccordionGroup>
  <Accordion title="Modo de privacidad y visibilidad en grupos">
    Los bots de Telegram usan por defecto el **Modo de privacidad**, que limita qué mensajes de grupo reciben.

    Si el bot debe ver todos los mensajes del grupo, haz una de estas dos cosas:

    - desactiva el modo de privacidad mediante `/setprivacy`, o
    - convierte al bot en administrador del grupo.

    Al cambiar el modo de privacidad, elimina y vuelve a añadir el bot en cada grupo para que Telegram aplique el cambio.

  </Accordion>

  <Accordion title="Permisos de grupo">
    El estado de administrador se controla en la configuración del grupo de Telegram.

    Los bots administradores reciben todos los mensajes del grupo, lo cual es útil para un comportamiento de grupo siempre activo.

  </Accordion>

  <Accordion title="Opciones útiles de BotFather">

    - `/setjoingroups` para permitir o denegar que se añada a grupos
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
    `dmPolicy: "allowlist"` con `allowFrom` vacío bloquea todos los mensajes directos y la validación de configuración lo rechaza.
    La configuración solicita solo ID numéricos de usuario.
    Si has actualizado y tu configuración contiene entradas `@username` en la lista de permitidos, ejecuta `openclaw doctor --fix` para resolverlas (mejor esfuerzo; requiere un token de bot de Telegram).
    Si antes dependías de archivos de lista de permitidos del almacén de emparejamiento, `openclaw doctor --fix` puede recuperar entradas en `channels.telegram.allowFrom` en flujos de lista de permitidos (por ejemplo, cuando `dmPolicy: "allowlist"` aún no tiene ID explícitos).

    Para bots de un solo propietario, prefiere `dmPolicy: "allowlist"` con ID numéricos explícitos en `allowFrom` para mantener una política de acceso duradera en la configuración (en lugar de depender de aprobaciones de emparejamiento anteriores).

    Confusión habitual: aprobar el emparejamiento de mensajes directos no significa “este remitente está autorizado en todas partes”.
    El emparejamiento otorga acceso solo a mensajes directos. La autorización del remitente en grupos sigue viniendo de listas de permitidos explícitas en la configuración.
    Si quieres “estoy autorizado una vez y funcionan tanto los mensajes directos como los comandos de grupo”, añade tu ID numérico de usuario de Telegram en `channels.telegram.allowFrom`.

    ### Cómo encontrar tu ID de usuario de Telegram

    Más seguro (sin bots de terceros):

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
         - con `groupPolicy: "open"`: cualquier grupo puede pasar las comprobaciones de ID de grupo
         - con `groupPolicy: "allowlist"` (predeterminado): los grupos se bloquean hasta que añadas entradas en `groups` (o `"*"`)
       - `groups` configurado: actúa como lista de permitidos (ID explícitos o `"*"`)

    2. **Qué remitentes están permitidos en los grupos** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predeterminado)
       - `disabled`

    `groupAllowFrom` se usa para filtrar remitentes en grupos. Si no está configurado, Telegram usa `allowFrom` como respaldo.
    Las entradas de `groupAllowFrom` deben ser ID numéricos de usuario de Telegram (los prefijos `telegram:` / `tg:` se normalizan).
    No pongas ID de chat de grupo o supergrupo de Telegram en `groupAllowFrom`. Los ID de chat negativos van en `channels.telegram.groups`.
    Las entradas no numéricas se ignoran para la autorización del remitente.
    Límite de seguridad (`2026.2.25+`): la autorización del remitente en grupos **no** hereda aprobaciones de mensajes directos del almacén de emparejamiento.
    El emparejamiento sigue siendo solo para mensajes directos. Para grupos, configura `groupAllowFrom` o `allowFrom` por grupo/tema.
    Si `groupAllowFrom` no está configurado, Telegram usa `allowFrom` de la configuración como respaldo, no el almacén de emparejamiento.
    Patrón práctico para bots de un solo propietario: configura tu ID de usuario en `channels.telegram.allowFrom`, deja `groupAllowFrom` sin configurar y permite los grupos objetivo en `channels.telegram.groups`.
    Nota de ejecución: si falta por completo `channels.telegram`, los valores predeterminados en ejecución usan fail-closed con `groupPolicy="allowlist"` salvo que `channels.defaults.groupPolicy` esté configurado explícitamente.

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
      Error habitual: `groupAllowFrom` no es una lista de permitidos de grupos de Telegram.

      - Pon los ID negativos de grupo o supergrupo de Telegram como `-1001234567890` en `channels.telegram.groups`.
      - Pon los ID de usuario de Telegram como `8734062810` en `groupAllowFrom` cuando quieras limitar qué personas dentro de un grupo permitido pueden activar el bot.
      - Usa `groupAllowFrom: ["*"]` solo cuando quieras que cualquier miembro de un grupo permitido pueda hablar con el bot.
    </Warning>

  </Tab>

  <Tab title="Comportamiento de mención">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La mención puede venir de:

    - mención nativa `@botusername`, o
    - patrones de mención en:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Alternancias de comandos a nivel de sesión:

    - `/activation always`
    - `/activation mention`

    Estos actualizan solo el estado de la sesión. Usa la configuración para que persista.

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

    Cómo obtener el ID del chat de grupo:

    - reenvía un mensaje de grupo a `@userinfobot` / `@getidsbot`
    - o lee `chat.id` en `openclaw logs --follow`
    - o inspecciona `getUpdates` de la API de bots

  </Tab>
</Tabs>

## Comportamiento en ejecución

- Telegram es propiedad del proceso Gateway.
- El enrutamiento es determinista: las respuestas entrantes de Telegram vuelven a Telegram (el modelo no elige canales).
- Los mensajes entrantes se normalizan en el contenedor de canal compartido con metadatos de respuesta y marcadores de posición de archivos multimedia.
- Las sesiones de grupo se aíslan por ID de grupo. Los temas del foro añaden `:topic:<threadId>` para mantener los temas aislados.
- Los mensajes directos pueden incluir `message_thread_id`; OpenClaw los enruta con claves de sesión compatibles con hilos y conserva el ID del hilo para las respuestas.
- El sondeo largo usa el runner de grammY con secuenciación por chat y por hilo. La concurrencia general del sink del runner usa `agents.defaults.maxConcurrent`.
- El sondeo largo está protegido dentro de cada proceso Gateway para que solo un sondeador activo pueda usar un token de bot a la vez. Si aún ves conflictos 409 de `getUpdates`, es probable que otro Gateway de OpenClaw, script o sondeador externo esté usando el mismo token.
- Los reinicios del watchdog de sondeo largo se activan después de 120 segundos sin actividad completada de `getUpdates` de forma predeterminada. Aumenta `channels.telegram.pollingStallThresholdMs` solo si tu despliegue sigue viendo reinicios falsos por bloqueo de sondeo durante trabajos de larga duración. El valor está en milisegundos y se permite entre `30000` y `600000`; se admiten anulaciones por cuenta.
- La API de bots de Telegram no tiene soporte para confirmaciones de lectura (`sendReadReceipts` no se aplica).

## Referencia de funciones

<AccordionGroup>
  <Accordion title="Vista previa de transmisión en vivo (ediciones de mensajes)">
    OpenClaw puede transmitir respuestas parciales en tiempo real:

    - chats directos: mensaje de vista previa + `editMessageText`
    - grupos/temas: mensaje de vista previa + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` es `off | partial | block | progress` (predeterminado: `partial`)
    - `progress` se asigna a `partial` en Telegram (compatibilidad con la nomenclatura multicanal)
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramienta/progreso reutilizan el mismo mensaje de vista previa editado (predeterminado: `true` cuando la transmisión de vista previa está activa)
    - se detectan los valores heredados `channels.telegram.streamMode` y booleanos `streaming`; ejecuta `openclaw doctor --fix` para migrarlos a `channels.telegram.streaming.mode`

    Las actualizaciones de vista previa de progreso de herramientas son las líneas cortas de “Working...” que se muestran mientras se ejecutan herramientas, por ejemplo, ejecución de comandos, lecturas de archivos, actualizaciones de planificación o resúmenes de parches. Telegram las mantiene habilitadas de forma predeterminada para coincidir con el comportamiento publicado de OpenClaw desde `v2026.4.22` en adelante. Para conservar la vista previa editada para el texto de la respuesta pero ocultar las líneas de progreso de herramientas, configura:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Usa `streaming.mode: "off"` solo cuando quieras desactivar por completo las ediciones de vista previa de Telegram. Usa `streaming.preview.toolProgress: false` cuando solo quieras desactivar las líneas de estado de progreso de herramientas.

    Para respuestas de solo texto:

    - mensaje directo: OpenClaw conserva el mismo mensaje de vista previa y realiza una edición final en el mismo lugar (sin segundo mensaje)
    - grupo/tema: OpenClaw conserva el mismo mensaje de vista previa y realiza una edición final en el mismo lugar (sin segundo mensaje)

    Para respuestas complejas (por ejemplo, cargas multimedia), OpenClaw recurre a la entrega final normal y luego limpia el mensaje de vista previa.

    La transmisión de vista previa es independiente de la transmisión por bloques. Cuando la transmisión por bloques está habilitada explícitamente para Telegram, OpenClaw omite la transmisión de vista previa para evitar una doble transmisión.

    Si el transporte de borrador nativo no está disponible o es rechazado, OpenClaw recurre automáticamente a `sendMessage` + `editMessageText`.

    Flujo de razonamiento solo para Telegram:

    - `/reasoning stream` envía el razonamiento a la vista previa en vivo mientras se genera
    - la respuesta final se envía sin texto de razonamiento

  </Accordion>

  <Accordion title="Formato y respaldo HTML">
    El texto saliente usa `parse_mode: "HTML"`.

    - El texto de estilo Markdown se representa como HTML seguro para Telegram.
    - El HTML sin procesar del modelo se escapa para reducir errores de análisis de Telegram.
    - Si Telegram rechaza el HTML analizado, OpenClaw vuelve a intentarlo como texto sin formato.

    Las vistas previas de enlaces están habilitadas de forma predeterminada y pueden deshabilitarse con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandos nativos y comandos personalizados">
    El registro del menú de comandos de Telegram se gestiona al iniciar con `setMyCommands`.

    Valores predeterminados de comandos nativos:

    - `commands.native: "auto"` habilita los comandos nativos para Telegram

    Añade entradas personalizadas al menú de comandos:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Copia de seguridad de Git" },
        { command: "generate", description: "Crear una imagen" },
      ],
    },
  },
}
```

    Reglas:

    - los nombres se normalizan (se elimina la `/` inicial, en minúsculas)
    - patrón válido: `a-z`, `0-9`, `_`, longitud `1..32`
    - los comandos personalizados no pueden sobrescribir los comandos nativos
    - los conflictos y duplicados se omiten y se registran

    Notas:

    - los comandos personalizados son solo entradas de menú; no implementan comportamiento automáticamente
    - los comandos de Plugin/Skills pueden seguir funcionando cuando se escriben, aunque no se muestren en el menú de Telegram

    Si los comandos nativos están deshabilitados, se eliminan los integrados. Los comandos personalizados/de Plugin pueden seguir registrándose si están configurados.

    Errores comunes de configuración:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú de Telegram siguió desbordándose después del recorte; reduce los comandos de Plugin/Skills/personalizados o deshabilita `channels.telegram.commands.native`.
    - `setMyCommands failed` con errores de red/fetch normalmente significa que el DNS/HTTPS saliente hacia `api.telegram.org` está bloqueado.

    ### Comandos de emparejamiento de dispositivos (Plugin `device-pair`)

    Cuando el Plugin `device-pair` está instalado:

    1. `/pair` genera un código de configuración
    2. pega el código en la app de iOS
    3. `/pair pending` muestra las solicitudes pendientes (incluidos rol/ámbitos)
    4. aprueba la solicitud:
       - `/pair approve <requestId>` para aprobación explícita
       - `/pair approve` cuando solo hay una solicitud pendiente
       - `/pair approve latest` para la más reciente

    El código de configuración incluye un token bootstrap de corta duración. La transferencia bootstrap integrada mantiene el token principal del node en `scopes: []`; cualquier token `operator` transferido sigue limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` y `operator.write`. Las comprobaciones de ámbitos bootstrap usan prefijos por rol, por lo que esa lista de permitidos de operator solo satisface solicitudes de operator; los roles que no son operator siguen necesitando ámbitos bajo su propio prefijo de rol.

    Si un dispositivo vuelve a intentarlo con detalles de autenticación modificados (por ejemplo rol/ámbitos/clave pública), la solicitud pendiente anterior se reemplaza y la nueva solicitud usa un `requestId` distinto. Vuelve a ejecutar `/pair pending` antes de aprobar.

    Más detalles: [Emparejamiento](/es/channels/pairing#pair-via-telegram-recommended-for-ios).

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
  message: "Elige una opción:",
  buttons: [
    [
      { text: "Sí", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancelar", callback_data: "cancel" }],
  ],
}
```

    Los clics en callbacks se pasan al agente como texto:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Acciones de mensajes de Telegram para agentes y automatización">
    Las acciones de herramientas de Telegram incluyen:

    - `sendMessage` (`to`, `content`, opcional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opcional `iconColor`, `iconCustomEmojiId`)

    Las acciones de mensajes del canal exponen alias ergonómicos (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controles de restricción:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predeterminado: deshabilitado)

    Nota: `edit` y `topic-create` están actualmente habilitados de forma predeterminada y no tienen alternancias `channels.telegram.actions.*` independientes.
    Los envíos en tiempo de ejecución usan la instantánea activa de configuración/secretos (inicio/recarga), por lo que las rutas de acción no realizan una nueva resolución ad hoc de SecretRef en cada envío.

    Semántica de eliminación de reacciones: [/tools/reactions](/es/tools/reactions)

  </Accordion>

  <Accordion title="Etiquetas de encadenamiento de respuestas">
    Telegram admite etiquetas explícitas de encadenamiento de respuestas en la salida generada:

    - `[[reply_to_current]]` responde al mensaje que activó la acción
    - `[[reply_to:<id>]]` responde a un ID de mensaje específico de Telegram

    `channels.telegram.replyToMode` controla el manejo:

    - `off` (predeterminado)
    - `first`
    - `all`

    Nota: `off` deshabilita el encadenamiento implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` siguen respetándose.

  </Accordion>

  <Accordion title="Temas de foros y comportamiento de hilos">
    Supergrupos de foros:

    - las claves de sesión de temas añaden `:topic:<threadId>`
    - las respuestas y el indicador de escritura se dirigen al hilo del tema
    - ruta de configuración del tema:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso especial del tema general (`threadId=1`):

    - los envíos de mensajes omiten `message_thread_id` (Telegram rechaza `sendMessage(...thread_id=1)`)
    - las acciones de escritura siguen incluyendo `message_thread_id`

    Herencia de temas: las entradas de temas heredan la configuración del grupo salvo que se anulen (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` es exclusivo del tema y no se hereda de los valores predeterminados del grupo.

    **Enrutamiento de agentes por tema**: cada tema puede enrutar a un agente diferente configurando `agentId` en la configuración del tema. Esto da a cada tema su propio espacio de trabajo, memoria y sesión aislados. Ejemplo:

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

    **Vinculación persistente de ACP por tema**: Los temas de foros pueden fijar sesiones de arnés ACP mediante vinculaciones ACP tipadas de nivel superior (`bindings[]` con `type: "acp"` y `match.channel: "telegram"`, `peer.kind: "group"` y un ID calificado por tema como `-1001234567890:topic:42`). Actualmente está limitado a temas de foros en grupos/supergrupos. Consulta [ACP Agents](/es/tools/acp-agents).

    **Inicio de ACP vinculado a hilo desde el chat**: `/acp spawn <agent> --thread here|auto` vincula el tema actual a una nueva sesión ACP; los mensajes posteriores se enrutan directamente allí. OpenClaw fija la confirmación de inicio dentro del tema. Requiere `channels.telegram.threadBindings.spawnAcpSessions=true`.

    El contexto de plantilla expone `MessageThreadId` e `IsForum`. Los chats de mensajes directos con `message_thread_id` mantienen el enrutamiento de mensajes directos, pero usan claves de sesión compatibles con hilos.

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

    - WEBP estático: se descarga y procesa (marcador `<media:sticker>`)
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

    Los stickers se describen una vez (cuando es posible) y se almacenan en caché para reducir llamadas repetidas a visión.

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
  query: "gato saludando",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notificaciones de reacciones">
    Las reacciones de Telegram llegan como actualizaciones `message_reaction` (separadas de las cargas de mensajes).

    Cuando está habilitado, OpenClaw encola eventos del sistema como:

    - `Reacción de Telegram añadida: 👍 por Alice (@alice) en el mensaje 42`

    Configuración:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predeterminado: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predeterminado: `minimal`)

    Notas:

    - `own` significa solo reacciones de usuarios a mensajes enviados por el bot (mejor esfuerzo mediante caché de mensajes enviados).
    - Los eventos de reacción siguen respetando los controles de acceso de Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); los remitentes no autorizados se descartan.
    - Telegram no proporciona ID de hilo en las actualizaciones de reacciones.
      - los grupos sin foro se enrutan a la sesión del chat grupal
      - los grupos con foro se enrutan a la sesión del tema general del grupo (`:topic:1`), no al tema exacto de origen

    `allowed_updates` para sondeo/webhook incluye `message_reaction` automáticamente.

  </Accordion>

  <Accordion title="Reacciones de acuse">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - respaldo con el emoji de identidad del agente (`agents.list[].identity.emoji`, o "👀" si no existe)

    Notas:

    - Telegram espera emoji Unicode (por ejemplo, "👀").
    - Usa `""` para deshabilitar la reacción en un canal o cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración desde eventos y comandos de Telegram">
    Las escrituras de configuración del canal están habilitadas de forma predeterminada (`configWrites !== false`).

    Las escrituras activadas desde Telegram incluyen:

    - eventos de migración de grupo (`migrate_to_chat_id`) para actualizar `channels.telegram.groups`
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

  <Accordion title="Sondeo largo frente a webhook">
    El valor predeterminado es el sondeo largo. Para el modo webhook, configura `channels.telegram.webhookUrl` y `channels.telegram.webhookSecret`; opcionalmente `webhookPath`, `webhookHost`, `webhookPort` (predeterminados `/telegram-webhook`, `127.0.0.1`, `8787`).

    El listener local se vincula a `127.0.0.1:8787`. Para ingreso público, coloca un proxy inverso delante del puerto local o configura `webhookHost: "0.0.0.0"` de forma intencionada.

    El modo webhook valida las protecciones de la solicitud, el token secreto de Telegram y el cuerpo JSON antes de devolver `200` a Telegram.
    Luego, OpenClaw procesa la actualización de forma asíncrona a través de las mismas rutas del bot por chat/tema que usa el sondeo largo, para que los turnos lentos del agente no retengan el ACK de entrega de Telegram.

  </Accordion>

  <Accordion title="Límites, reintentos y destinos de CLI">
    - `channels.telegram.textChunkLimit` tiene como valor predeterminado 4000.
    - `channels.telegram.chunkMode="newline"` prioriza los límites de párrafo (líneas en blanco) antes de dividir por longitud.
    - `channels.telegram.mediaMaxMb` (predeterminado 100) limita el tamaño de los archivos multimedia entrantes y salientes de Telegram.
    - `channels.telegram.timeoutSeconds` anula el tiempo de espera del cliente de la API de Telegram (si no se configura, se aplica el valor predeterminado de grammY).
    - `channels.telegram.pollingStallThresholdMs` tiene como valor predeterminado `120000`; ajústalo entre `30000` y `600000` solo para reinicios por bloqueo de sondeo falsos positivos.
    - el historial de contexto de grupo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predeterminado 50); `0` lo desactiva.
    - el contexto suplementario de respuesta/cita/reenvío se transmite actualmente tal como se recibe.
    - las listas de permitidos de Telegram controlan principalmente quién puede activar el agente, no un límite completo de redacción de contexto suplementario.
    - controles de historial de mensajes directos:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configuración `channels.telegram.retry` se aplica a los helpers de envío de Telegram (CLI/herramientas/acciones) para errores recuperables de la API saliente.

    El destino de envío de la CLI puede ser un ID de chat numérico o un nombre de usuario:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Los sondeos de Telegram usan `openclaw message poll` y admiten temas de foros:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Indicadores de encuestas solo para Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` para temas de foros (o usa un destino `:topic:`)

    El envío de Telegram también admite:

    - `--presentation` con bloques `buttons` para teclados en línea cuando `channels.telegram.capabilities.inlineButtons` lo permite
    - `--pin` o `--delivery '{"pin":true}'` para solicitar entrega fijada cuando el bot puede fijar en ese chat
    - `--force-document` para enviar imágenes y GIF salientes como documentos en lugar de cargas comprimidas de foto o multimedia animado

    Restricción de acciones:

    - `channels.telegram.actions.sendMessage=false` desactiva los mensajes salientes de Telegram, incluidas las encuestas
    - `channels.telegram.actions.poll=false` desactiva la creación de encuestas de Telegram mientras deja habilitados los envíos normales

  </Accordion>

  <Accordion title="Aprobaciones de exec en Telegram">
    Telegram admite aprobaciones de exec en los mensajes directos de los aprobadores y puede opcionalmente publicar solicitudes en el chat o tema de origen. Los aprobadores deben ser ID numéricos de usuario de Telegram.

    Ruta de configuración:

    - `channels.telegram.execApprovals.enabled` (se habilita automáticamente cuando se puede resolver al menos un aprobador)
    - `channels.telegram.execApprovals.approvers` (usa como respaldo los ID numéricos del propietario de `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (predeterminado) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    La entrega en el canal muestra el texto del comando en el chat; habilita `channel` o `both` solo en grupos/temas de confianza. Cuando la solicitud llega a un tema de foro, OpenClaw conserva el tema para la solicitud de aprobación y el seguimiento. Las aprobaciones de exec caducan después de 30 minutos de forma predeterminada.

    Los botones de aprobación en línea también requieren que `channels.telegram.capabilities.inlineButtons` permita la superficie de destino (`dm`, `group` o `all`). Los ID de aprobación con prefijo `plugin:` se resuelven mediante aprobaciones del Plugin; los demás se resuelven primero mediante aprobaciones de exec.

    Consulta [Exec approvals](/es/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controles de respuesta de error

Cuando el agente encuentra un error de entrega o del proveedor, Telegram puede responder con el texto del error o suprimirlo. Dos claves de configuración controlan este comportamiento:

| Key                                 | Valores           | Predeterminado | Descripción                                                                                     |
| ----------------------------------- | ----------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`        | `reply` envía un mensaje de error amigable al chat. `silent` suprime por completo las respuestas de error. |
| `channels.telegram.errorCooldownMs` | número (ms)       | `60000`        | Tiempo mínimo entre respuestas de error al mismo chat. Evita spam de errores durante interrupciones. |

Se admiten anulaciones por cuenta, por grupo y por tema (misma herencia que otras claves de configuración de Telegram).

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
      - BotFather: `/setprivacy` -> Disable
      - luego elimina y vuelve a añadir el bot al grupo
    - `openclaw channels status` advierte cuando la configuración espera mensajes de grupo sin mención.
    - `openclaw channels status --probe` puede comprobar ID numéricos explícitos de grupo; el comodín `"*"` no permite comprobar membresía.
    - prueba rápida de sesión: `/activation always`.

  </Accordion>

  <Accordion title="El bot no ve en absoluto los mensajes de grupo">

    - cuando existe `channels.telegram.groups`, el grupo debe aparecer en la lista (o incluir `"*"`)
    - verifica que el bot pertenezca al grupo
    - revisa los registros: `openclaw logs --follow` para ver los motivos de omisión

  </Accordion>

  <Accordion title="Los comandos funcionan parcialmente o no funcionan">

    - autoriza la identidad de tu remitente (emparejamiento y/o `allowFrom` numérico)
    - la autorización de comandos sigue aplicándose incluso cuando la política de grupo es `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa que el menú nativo tiene demasiadas entradas; reduce los comandos de Plugin/Skills/personalizados o deshabilita los menús nativos
    - `setMyCommands failed` con errores de red/fetch normalmente indica problemas de alcance DNS/HTTPS hacia `api.telegram.org`

  </Accordion>

  <Accordion title="Inestabilidad de sondeo o de red">

    - Node 22+ + fetch/proxy personalizado puede activar un comportamiento de aborto inmediato si los tipos de AbortSignal no coinciden.
    - Algunos hosts resuelven `api.telegram.org` a IPv6 primero; una salida IPv6 defectuosa puede provocar fallos intermitentes de la API de Telegram.
    - Si los registros incluyen `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ahora reintenta estos casos como errores de red recuperables.
    - Si los registros incluyen `Polling stall detected`, OpenClaw reinicia el sondeo y reconstruye el transporte de Telegram después de 120 segundos sin actividad completada del sondeo largo de forma predeterminada.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo cuando las llamadas largas de `getUpdates` estén sanas pero tu host siga informando reinicios falsos por bloqueo de sondeo. Los bloqueos persistentes suelen indicar problemas de proxy, DNS, IPv6 o salida TLS entre el host y `api.telegram.org`.
    - En hosts VPS con salida directa/TLS inestable, enruta las llamadas a la API de Telegram mediante `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa de forma predeterminada `autoSelectFamily=true` (excepto WSL2) y `dnsResultOrder=ipv4first`.
    - Si tu host es WSL2 o funciona explícitamente mejor con comportamiento solo IPv4, fuerza la selección de familia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Las respuestas del rango de referencia RFC 2544 (`198.18.0.0/15`) ya están permitidas
      de forma predeterminada para las descargas de archivos multimedia de Telegram. Si una IP falsa de confianza o un
      proxy transparente reescribe `api.telegram.org` a alguna otra
      dirección privada/interna/de uso especial durante las descargas de archivos multimedia, puedes habilitar
      opcionalmente la omisión solo para Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La misma opción está disponible por cuenta en
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Si tu proxy resuelve hosts multimedia de Telegram en `198.18.x.x`, deja primero
      desactivada la opción peligrosa. Los archivos multimedia de Telegram ya permiten el rango de referencia RFC 2544
      de forma predeterminada.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` debilita las protecciones SSRF de los
      archivos multimedia de Telegram. Úsalo solo en entornos de proxy de confianza controlados por el operador
      como enrutamiento de IP falsa de Clash, Mihomo o Surge cuando
      sintetizan respuestas privadas o de uso especial fuera del rango de referencia RFC 2544. Déjalo desactivado para el acceso normal a Telegram por internet pública.
    </Warning>

    - Anulaciones por variable de entorno (temporales):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valida las respuestas DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Más ayuda: [Solución de problemas de canales](/es/channels/troubleshooting).

## Referencia de configuración

Referencia principal: [Referencia de configuración - Telegram](/es/gateway/config-channels#telegram).

<Accordion title="Campos de Telegram de alta señal">

- inicio/autenticación: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` debe apuntar a un archivo normal; se rechazan los enlaces simbólicos)
- control de acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` de nivel superior (`type: "acp"`)
- aprobaciones de exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menú: `commands.native`, `commands.nativeSkills`, `customCommands`
- hilos/respuestas: `replyToMode`
- streaming: `streaming` (vista previa), `streaming.preview.toolProgress`, `blockStreaming`
- formato/entrega: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- multimedia/red: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- acciones/capacidades: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reacciones: `reactionNotifications`, `reactionLevel`
- errores: `errorPolicy`, `errorCooldownMs`
- escrituras/historial: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedencia de varias cuentas: cuando se configuran dos o más ID de cuenta, establece `channels.telegram.defaultAccount` (o incluye `channels.telegram.accounts.default`) para que el enrutamiento predeterminado sea explícito. De lo contrario, OpenClaw usa como respaldo el primer ID de cuenta normalizado y `openclaw doctor` emite una advertencia. Las cuentas con nombre heredan `channels.telegram.allowFrom` / `groupAllowFrom`, pero no los valores de `accounts.default.*`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Emparejar un usuario de Telegram con el Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/es/channels/groups">
    Comportamiento de la lista de permitidos de grupos y temas.
  </Card>
  <Card title="Enrutamiento de canales" icon="route" href="/es/channels/channel-routing">
    Enrutar mensajes entrantes a agentes.
  </Card>
  <Card title="Security" icon="shield" href="/es/gateway/security">
    Modelo de amenazas y refuerzo de seguridad.
  </Card>
  <Card title="Enrutamiento de varios agentes" icon="sitemap" href="/es/concepts/multi-agent">
    Asignar grupos y temas a agentes.
  </Card>
  <Card title="Solución de problemas" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico multicanal.
  </Card>
</CardGroup>
