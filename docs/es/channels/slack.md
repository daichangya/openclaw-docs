---
read_when:
    - Configurar Slack o depurar el modo socket/HTTP de Slack
summary: Configuración de Slack y comportamiento en tiempo de ejecución (Socket Mode + URL de solicitud HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-22T04:20:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e80b1ff7dfe3124916f9a4334badc9a742a0d0843b37c77838ede9f830920ff7
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Estado: listo para producción para mensajes directos y canales mediante integraciones de aplicaciones de Slack. El modo predeterminado es Socket Mode; también se admiten URL de solicitud HTTP.

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Slack usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Comandos de barra diagonal" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos y catálogo de comandos.
  </Card>
  <Card title="Resolución de problemas del canal" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y guías de reparación.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Socket Mode (predeterminado)">
    <Steps>
      <Step title="Crea una nueva aplicación de Slack">
        En la configuración de aplicaciones de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu aplicación
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) de abajo y continúa con la creación
        - genera un **App-Level Token** (`xapp-...`) con `connections:write`
        - instala la aplicación y copia el **Bot Token** (`xoxb-...`) que se muestra
      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Variable de entorno de respaldo (solo cuenta predeterminada):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Inicia Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL de solicitud HTTP">
    <Steps>
      <Step title="Crea una nueva aplicación de Slack">
        En la configuración de aplicaciones de Slack, pulsa el botón **[Create New App](https://api.slack.com/apps/new)**:

        - elige **from a manifest** y selecciona un espacio de trabajo para tu aplicación
        - pega el [manifiesto de ejemplo](#manifest-and-scope-checklist) y actualiza las URL antes de crear
        - guarda el **Signing Secret** para la verificación de solicitudes
        - instala la aplicación y copia el **Bot Token** (`xoxb-...`) que se muestra

      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Usa rutas de Webhook únicas para HTTP con varias cuentas

        Asigna a cada cuenta un `webhookPath` distinto (predeterminado `/slack/events`) para que los registros no entren en conflicto.
        </Note>

      </Step>

      <Step title="Inicia Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Lista de comprobación de manifiesto y alcances

<Tabs>
  <Tab title="Socket Mode (predeterminado)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Tab>

  <Tab title="URL de solicitud HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Ajustes adicionales del manifiesto

Muestran distintas funciones que amplían los valores predeterminados anteriores.

<AccordionGroup>
  <Accordion title="Comandos de barra diagonal nativos opcionales">

    Se pueden usar varios [comandos de barra diagonal nativos](#commands-and-slash-behavior) en lugar de un único comando configurado, con algunos matices:

    - Usa `/agentstatus` en lugar de `/status` porque el comando `/status` está reservado.
    - No se pueden poner a disposición más de 25 comandos de barra diagonal al mismo tiempo.

    Reemplaza tu sección `features.slash_commands` existente por un subconjunto de [comandos disponibles](/es/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predeterminado)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers or models for a provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="URL de solicitud HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Reset the current session",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Stop the current run",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "List providers or models for a provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Alcances de autoría opcionales (operaciones de escritura)">
    Agrega el alcance de bot `chat:write.customize` si quieres que los mensajes salientes usen la identidad del agente activo (nombre de usuario e icono personalizados) en lugar de la identidad predeterminada de la aplicación de Slack.

    Si usas un icono de emoji, Slack espera la sintaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Alcances opcionales de token de usuario (operaciones de lectura)">
    Si configuras `channels.slack.userToken`, los alcances de lectura habituales son:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (si dependes de lecturas de búsqueda de Slack)

  </Accordion>
</AccordionGroup>

## Modelo de tokens

- `botToken` + `appToken` son obligatorios para Socket Mode.
- El modo HTTP requiere `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` y `userToken` aceptan cadenas
  de texto sin formato u objetos SecretRef.
- Los tokens de configuración reemplazan el respaldo por variable de entorno.
- El respaldo por variable de entorno `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` solo se aplica a la cuenta predeterminada.
- `userToken` (`xoxp-...`) es solo de configuración (sin respaldo por variable de entorno) y usa de forma predeterminada comportamiento de solo lectura (`userTokenReadOnly: true`).

Comportamiento de instantánea de estado:

- La inspección de cuentas de Slack rastrea campos `*Source` y `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- El estado es `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa que la cuenta está configurada mediante SecretRef
  u otra fuente de secreto no insertada directamente, pero la ruta actual de comando/tiempo de ejecución
  no pudo resolver el valor real.
- En modo HTTP, se incluye `signingSecretStatus`; en Socket Mode, el
  par obligatorio es `botTokenStatus` + `appTokenStatus`.

<Tip>
Para acciones/lecturas de directorio, se puede dar preferencia al token de usuario cuando está configurado. Para escrituras, el token de bot sigue siendo el preferido; las escrituras con token de usuario solo se permiten cuando `userTokenReadOnly: false` y el token de bot no está disponible.
</Tip>

## Acciones y restricciones

Las acciones de Slack se controlan con `channels.slack.actions.*`.

Grupos de acciones disponibles en las herramientas actuales de Slack:

| Grupo      | Predeterminado |
| ---------- | -------------- |
| messages   | enabled        |
| reactions  | enabled        |
| pins       | enabled        |
| memberInfo | enabled        |
| emojiList  | enabled        |

Las acciones actuales de mensajes de Slack incluyen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` y `emoji-list`.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.slack.dmPolicy` controla el acceso a mensajes directos (heredado: `channels.slack.dm.policy`):

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.slack.allowFrom` incluya `"*"`; heredado: `channels.slack.dm.allowFrom`)
    - `disabled`

    Indicadores de mensajes directos:

    - `dm.enabled` (predeterminado: true)
    - `channels.slack.allowFrom` (preferido)
    - `dm.allowFrom` (heredado)
    - `dm.groupEnabled` (los mensajes directos de grupo usan false de forma predeterminada)
    - `dm.groupChannels` (lista de permitidos MPIM opcional)

    Precedencia de varias cuentas:

    - `channels.slack.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.slack.allowFrom` cuando su propio `allowFrom` no está configurado.
    - Las cuentas con nombre no heredan `channels.slack.accounts.default.allowFrom`.

    El emparejamiento en mensajes directos usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canales">
    `channels.slack.groupPolicy` controla el manejo de canales:

    - `open`
    - `allowlist`
    - `disabled`

    La lista de permitidos de canales se encuentra en `channels.slack.channels` y debe usar ID de canal estables.

    Nota de tiempo de ejecución: si `channels.slack` falta por completo (configuración solo con variable de entorno), el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté configurado).

    Resolución de nombre/ID:

    - las entradas de la lista de permitidos de canales y de la lista de permitidos de mensajes directos se resuelven al inicio cuando el acceso al token lo permite
    - las entradas no resueltas por nombre de canal se conservan tal como están configuradas, pero se ignoran para el enrutamiento de forma predeterminada
    - la autorización entrante y el enrutamiento de canales usan primero ID de forma predeterminada; la coincidencia directa por nombre de usuario/slug requiere `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menciones y usuarios del canal">
    Los mensajes de canal están restringidos por mención de forma predeterminada.

    Fuentes de mención:

    - mención explícita de la aplicación (`<@botId>`)
    - patrones regex de mención (`agents.list[].groupChat.mentionPatterns`, con reserva en `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de respuesta a hilo del bot (deshabilitado cuando `thread.requireExplicitMention` es `true`)

    Controles por canal (`channels.slack.channels.<id>`; nombres solo mediante resolución al inicio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista de permitidos)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de clave de `toolsBySender`: `id:`, `e164:`, `username:`, `name:` o comodín `"*"`
      (las claves heredadas sin prefijo siguen asignándose solo a `id:`)

  </Tab>
</Tabs>

## Hilos, sesiones y etiquetas de respuesta

- Los mensajes directos se enrutan como `direct`; los canales como `channel`; los MPIM como `group`.
- Con el valor predeterminado `session.dmScope=main`, los mensajes directos de Slack se agrupan en la sesión principal del agente.
- Sesiones de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Las respuestas en hilo pueden crear sufijos de sesión de hilo (`:thread:<threadTs>`) cuando corresponde.
- `channels.slack.thread.historyScope` usa `thread` de forma predeterminada; `thread.inheritParent` usa `false` de forma predeterminada.
- `channels.slack.thread.initialHistoryLimit` controla cuántos mensajes existentes del hilo se recuperan cuando se inicia una nueva sesión de hilo (predeterminado: `20`; usa `0` para deshabilitarlo).
- `channels.slack.thread.requireExplicitMention` (predeterminado `false`): cuando es `true`, suprime las menciones implícitas en hilos para que el bot solo responda a menciones explícitas `@bot` dentro de los hilos, incluso cuando el bot ya participó en el hilo. Sin esto, las respuestas en un hilo con participación del bot omiten la restricción de `requireMention`.

Controles de respuestas en hilo:

- `channels.slack.replyToMode`: `off|first|all|batched` (predeterminado `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- reserva heredada para chats directos: `channels.slack.dm.replyToMode`

Se admiten etiquetas manuales de respuesta:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Nota: `replyToMode="off"` deshabilita **todo** el encadenamiento de respuestas en Slack, incluidas las etiquetas explícitas `[[reply_to_*]]`. Esto difiere de Telegram, donde las etiquetas explícitas siguen respetándose en modo `"off"`. La diferencia refleja los modelos de hilos de cada plataforma: los hilos de Slack ocultan los mensajes del canal, mientras que las respuestas de Telegram siguen siendo visibles en el flujo principal del chat.

## Reacciones de acuse

`ackReaction` envía un emoji de acuse mientras OpenClaw procesa un mensaje entrante.

Orden de resolución:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- reserva por emoji de identidad del agente (`agents.list[].identity.emoji`, o bien `"👀"`)

Notas:

- Slack espera códigos cortos (por ejemplo `"eyes"`).
- Usa `""` para deshabilitar la reacción para la cuenta de Slack o globalmente.

## Transmisión de texto

`channels.slack.streaming` controla el comportamiento de vista previa en vivo:

- `off`: deshabilita la vista previa en vivo.
- `partial` (predeterminado): reemplaza el texto de vista previa con la salida parcial más reciente.
- `block`: agrega actualizaciones de vista previa fragmentadas.
- `progress`: muestra texto de estado de progreso mientras se genera y luego envía el texto final.
- `streaming.preview.toolProgress`: cuando la vista previa de borrador está activa, enruta las actualizaciones de herramienta/progreso al mismo mensaje de vista previa editado (predeterminado: `true`). Usa `false` para mantener mensajes separados de herramienta/progreso.

`channels.slack.streaming.nativeTransport` controla la transmisión nativa de texto de Slack cuando `channels.slack.streaming.mode` es `partial` (predeterminado: `true`).

- Debe haber disponible un hilo de respuesta para que aparezcan la transmisión nativa de texto y el estado nativo de hilo del asistente de Slack. La selección de hilo sigue respetando `replyToMode`.
- Las raíces de canal y chat de grupo todavía pueden usar la vista previa normal de borrador cuando la transmisión nativa no está disponible.
- Los mensajes directos de Slack de nivel superior permanecen fuera de hilo de forma predeterminada, por lo que no muestran la vista previa de estilo hilo; usa respuestas en hilo o `typingReaction` si quieres progreso visible allí.
- Los archivos multimedia y las cargas no textuales recurren a la entrega normal.
- Los finales de multimedia/error cancelan las ediciones de vista previa pendientes sin vaciar un borrador temporal; los finales de texto/bloque aptos solo se vacían cuando pueden editar la vista previa en el lugar.
- Si la transmisión falla a mitad de una respuesta, OpenClaw recurre a la entrega normal para las cargas útiles restantes.

Usa la vista previa de borrador en lugar de la transmisión nativa de texto de Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Claves heredadas:

- `channels.slack.streamMode` (`replace | status_final | append`) se migra automáticamente a `channels.slack.streaming.mode`.
- el booleano `channels.slack.streaming` se migra automáticamente a `channels.slack.streaming.mode` y `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` heredado se migra automáticamente a `channels.slack.streaming.nativeTransport`.

## Respaldo con reacción de escritura

`typingReaction` agrega una reacción temporal al mensaje entrante de Slack mientras OpenClaw procesa una respuesta y luego la elimina cuando finaliza la ejecución. Esto es más útil fuera de las respuestas en hilo, que usan un indicador de estado predeterminado de "is typing...".

Orden de resolución:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Notas:

- Slack espera códigos cortos (por ejemplo `"hourglass_flowing_sand"`).
- La reacción es de mejor esfuerzo y la limpieza se intenta automáticamente después de que se completa la respuesta o la ruta de error.

## Multimedia, fragmentación y entrega

<AccordionGroup>
  <Accordion title="Adjuntos entrantes">
    Los adjuntos de archivos de Slack se descargan desde URL privadas alojadas por Slack (flujo de solicitud autenticada con token) y se escriben en el almacén de multimedia cuando la recuperación se realiza correctamente y los límites de tamaño lo permiten.

    El límite de tamaño entrante en tiempo de ejecución usa `20MB` de forma predeterminada, salvo que se reemplace con `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto y archivos salientes">
    - los fragmentos de texto usan `channels.slack.textChunkLimit` (predeterminado: 4000)
    - `channels.slack.chunkMode="newline"` habilita la división priorizando párrafos
    - los envíos de archivos usan las API de carga de Slack y pueden incluir respuestas en hilo (`thread_ts`)
    - el límite de multimedia saliente sigue `channels.slack.mediaMaxMb` cuando está configurado; de lo contrario, los envíos de canal usan valores predeterminados por tipo MIME del flujo de multimedia
  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferidos:

    - `user:<id>` para mensajes directos
    - `channel:<id>` para canales

    Los mensajes directos de Slack se abren mediante las API de conversación de Slack al enviar a destinos de usuario.

  </Accordion>
</AccordionGroup>

## Comandos y comportamiento de barra diagonal

Los comandos de barra diagonal aparecen en Slack como un único comando configurado o como varios comandos nativos. Configura `channels.slack.slashCommand` para cambiar los valores predeterminados del comando:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Los comandos nativos requieren [ajustes adicionales del manifiesto](#additional-manifest-settings) en tu aplicación de Slack y se habilitan con `channels.slack.commands.native: true` o, en su lugar, con `commands.native: true` en configuraciones globales.

- El modo automático de comandos nativos está **desactivado** para Slack, por lo que `commands.native: "auto"` no habilita los comandos nativos de Slack.

```txt
/help
```

Los menús nativos de argumentos usan una estrategia de renderizado adaptativa que muestra un modal de confirmación antes de enviar un valor de opción seleccionado:

- hasta 5 opciones: bloques de botones
- 6-100 opciones: menú de selección estática
- más de 100 opciones: selección externa con filtrado asíncrono de opciones cuando hay disponibles controladores de opciones de interactividad
- límites de Slack superados: los valores de opción codificados recurren a botones

```txt
/think
```

Las sesiones de barra diagonal usan claves aisladas como `agent:<agentId>:slack:slash:<userId>` y aun así enrutan las ejecuciones de comandos a la sesión de conversación de destino usando `CommandTargetSessionKey`.

## Respuestas interactivas

Slack puede renderizar controles de respuesta interactiva creados por agentes, pero esta función está deshabilitada de forma predeterminada.

Habilítala globalmente:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

O habilítala solo para una cuenta de Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Cuando está habilitada, los agentes pueden emitir directivas de respuesta exclusivas de Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Estas directivas se compilan en Slack Block Kit y enrutan los clics o selecciones de vuelta a través de la ruta existente de eventos de interacción de Slack.

Notas:

- Esta es una interfaz específica de Slack. Otros canales no traducen directivas de Slack Block Kit a sus propios sistemas de botones.
- Los valores de devolución interactiva son tokens opacos generados por OpenClaw, no valores directos creados por el agente.
- Si los bloques interactivos generados exceden los límites de Slack Block Kit, OpenClaw recurre a la respuesta de texto original en lugar de enviar una carga útil de bloques no válida.

## Aprobaciones de exec en Slack

Slack puede actuar como un cliente nativo de aprobaciones con botones e interacciones, en lugar de recurrir a la interfaz web o a la terminal.

- Las aprobaciones de exec usan `channels.slack.execApprovals.*` para el enrutamiento nativo en mensaje directo/canal.
- Las aprobaciones de Plugin aún pueden resolverse mediante la misma superficie nativa de botones de Slack cuando la solicitud ya llega a Slack y el tipo de id de aprobación es `plugin:`.
- La autorización del aprobador sigue aplicándose: solo los usuarios identificados como aprobadores pueden aprobar o denegar solicitudes a través de Slack.

Esto usa la misma superficie compartida de botones de aprobación que otros canales. Cuando `interactivity` está habilitado en la configuración de tu aplicación de Slack, los avisos de aprobación se renderizan como botones de Block Kit directamente en la conversación.
Cuando esos botones están presentes, son la UX principal de aprobación; OpenClaw
solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta diga que las
aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.

Ruta de configuración:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recurre a `commands.ownerAllowFrom` cuando es posible)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `agentFilter`, `sessionFilter`

Slack habilita automáticamente las aprobaciones nativas de exec cuando `enabled` no está configurado o es `"auto"` y se resuelve al menos un
aprobador. Usa `enabled: false` para deshabilitar Slack explícitamente como cliente nativo de aprobación.
Usa `enabled: true` para forzar las aprobaciones nativas cuando se resuelvan aprobadores.

Comportamiento predeterminado sin configuración explícita de aprobación de exec de Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configuración nativa explícita de Slack solo se necesita cuando quieres reemplazar aprobadores, agregar filtros o
activar la entrega en el chat de origen:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

El reenvío compartido `approvals.exec` es independiente. Úsalo solo cuando los avisos de aprobación de exec también deban
enrutarse a otros chats o a destinos explícitos fuera de banda. El reenvío compartido `approvals.plugin` también es
independiente; los botones nativos de Slack aún pueden resolver aprobaciones de Plugin cuando esas solicitudes ya llegan
a Slack.

`/approve` en el mismo chat también funciona en canales y mensajes directos de Slack que ya admiten comandos. Consulta [Exec approvals](/es/tools/exec-approvals) para ver el modelo completo de reenvío de aprobaciones.

## Eventos y comportamiento operativo

- Las ediciones/eliminaciones de mensajes y las difusiones de hilos se asignan a eventos del sistema.
- Los eventos de agregar/quitar reacción se asignan a eventos del sistema.
- Los eventos de entrada/salida de miembros, creación/cambio de nombre de canal y agregar/quitar fijaciones se asignan a eventos del sistema.
- `channel_id_changed` puede migrar claves de configuración de canal cuando `configWrites` está habilitado.
- Los metadatos de tema/propósito del canal se tratan como contexto no confiable y pueden inyectarse en el contexto de enrutamiento.
- El iniciador del hilo y la siembra inicial del contexto del historial del hilo se filtran mediante las listas de permitidos de remitentes configuradas cuando corresponde.
- Las acciones de bloques y las interacciones de modales emiten eventos del sistema estructurados `Slack interaction: ...` con campos de carga útiles enriquecidos:
  - acciones de bloques: valores seleccionados, etiquetas, valores de selector y metadatos `workflow_*`
  - eventos de modal `view_submission` y `view_closed` con metadatos de canal enrutados y entradas de formulario

## Punteros a la referencia de configuración

Referencia principal:

- [Referencia de configuración - Slack](/es/gateway/configuration-reference#slack)

  Campos de Slack de alta señal:
  - modo/autenticación: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - acceso a mensajes directos: `dm.enabled`, `dmPolicy`, `allowFrom` (heredado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - interruptor de compatibilidad: `dangerouslyAllowNameMatching` (solo emergencia; mantenlo desactivado salvo que sea necesario)
  - acceso a canales: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - hilos/historial: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - operaciones/funciones: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Resolución de problemas

<AccordionGroup>
  <Accordion title="No hay respuestas en los canales">
    Comprueba, en este orden:

    - `groupPolicy`
    - lista de permitidos de canales (`channels.slack.channels`)
    - `requireMention`
    - lista de permitidos `users` por canal

    Comandos útiles:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Se ignoran los mensajes directos">
    Comprueba:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (o el heredado `channels.slack.dm.policy`)
    - aprobaciones de emparejamiento / entradas de lista de permitidos

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="El modo Socket no conecta">
    Valida los tokens de bot y aplicación, así como la habilitación de Socket Mode en la configuración de la aplicación de Slack.

    Si `openclaw channels status --probe --json` muestra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, la cuenta de Slack está
    configurada, pero el tiempo de ejecución actual no pudo resolver el
    valor respaldado por SecretRef.

  </Accordion>

  <Accordion title="El modo HTTP no recibe eventos">
    Valida:

    - signing secret
    - ruta de Webhook
    - URL de solicitud de Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` único por cuenta HTTP

    Si `signingSecretStatus: "configured_unavailable"` aparece en las
    instantáneas de cuenta, la cuenta HTTP está configurada, pero el tiempo de ejecución actual no pudo
    resolver el signing secret respaldado por SecretRef.

  </Accordion>

  <Accordion title="Los comandos nativos/de barra diagonal no se activan">
    Verifica si tu intención era:

    - modo de comandos nativos (`channels.slack.commands.native: true`) con los comandos de barra diagonal correspondientes registrados en Slack
    - o modo de comando único de barra diagonal (`channels.slack.slashCommand.enabled: true`)

    Comprueba también `commands.useAccessGroups` y las listas de permitidos de canal/usuario.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Resolución de problemas](/es/channels/troubleshooting)
- [Configuración](/es/gateway/configuration)
- [Comandos de barra diagonal](/es/tools/slash-commands)
