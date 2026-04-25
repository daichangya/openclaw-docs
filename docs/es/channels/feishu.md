---
read_when:
    - Quieres conectar un bot de Feishu/Lark
    - Estás configurando el canal de Feishu
summary: Descripción general, funciones y configuración del bot de Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-25T13:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark es una plataforma de colaboración todo en uno donde los equipos chatean, comparten documentos, administran calendarios y trabajan juntos.

**Estado:** listo para producción para mensajes directos del bot y chats grupales. WebSocket es el modo predeterminado; el modo webhook es opcional.

---

## Inicio rápido

> **Requiere OpenClaw 2026.4.25 o superior.** Ejecuta `openclaw --version` para comprobarlo. Actualiza con `openclaw update`.

<Steps>
  <Step title="Ejecuta el asistente de configuración del canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Escanea el código QR con tu aplicación móvil de Feishu/Lark para crear automáticamente un bot de Feishu/Lark.
  </Step>
  
  <Step title="Cuando termine la configuración, reinicia el Gateway para aplicar los cambios">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Control de acceso

### Mensajes directos

Configura `dmPolicy` para controlar quién puede enviar mensajes directos al bot:

- `"pairing"` — los usuarios desconocidos reciben un código de emparejamiento; apruébalo mediante la CLI
- `"allowlist"` — solo los usuarios incluidos en `allowFrom` pueden chatear (predeterminado: solo el propietario del bot)
- `"open"` — permitir todos los usuarios
- `"disabled"` — desactivar todos los mensajes directos

**Aprobar una solicitud de emparejamiento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats grupales

**Política de grupo** (`channels.feishu.groupPolicy`):

| Value         | Comportamiento                             |
| ------------- | ------------------------------------------ |
| `"open"`      | Responder a todos los mensajes en grupos   |
| `"allowlist"` | Responder solo a los grupos en `groupAllowFrom` |
| `"disabled"`  | Desactivar todos los mensajes de grupo     |

Predeterminado: `allowlist`

**Requisito de mención** (`channels.feishu.requireMention`):

- `true` — requiere @mención (predeterminado)
- `false` — responder sin @mención
- Anulación por grupo: `channels.feishu.groups.<chat_id>.requireMention`

---

## Ejemplos de configuración de grupos

### Permitir todos los grupos, sin requerir @mención

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Permitir todos los grupos, pero seguir requiriendo @mención

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Permitir solo grupos específicos

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Los ID de grupo se ven así: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Restringir remitentes dentro de un grupo

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Los open_id de usuario se ven así: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Obtener ID de grupo/usuario

### ID de grupo (`chat_id`, formato: `oc_xxx`)

Abre el grupo en Feishu/Lark, haz clic en el icono de menú en la esquina superior derecha y ve a **Settings**. El ID de grupo (`chat_id`) aparece en la página de configuración.

![Get Group ID](/images/feishu-get-group-id.png)

### ID de usuario (`open_id`, formato: `ou_xxx`)

Inicia el Gateway, envía un mensaje directo al bot y luego revisa los registros:

```bash
openclaw logs --follow
```

Busca `open_id` en la salida del registro. También puedes revisar las solicitudes de emparejamiento pendientes:

```bash
openclaw pairing list feishu
```

---

## Comandos comunes

| Command   | Descripción                    |
| --------- | ------------------------------ |
| `/status` | Mostrar el estado del bot      |
| `/reset`  | Restablecer la sesión actual   |
| `/model`  | Mostrar o cambiar el modelo de IA |

> Feishu/Lark no admite menús nativos de comandos con barra, así que envía estos comandos como mensajes de texto sin formato.

---

## Solución de problemas

### El bot no responde en los chats grupales

1. Asegúrate de que el bot esté añadido al grupo
2. Asegúrate de mencionar al bot con @ (obligatorio de forma predeterminada)
3. Verifica que `groupPolicy` no sea `"disabled"`
4. Revisa los registros: `openclaw logs --follow`

### El bot no recibe mensajes

1. Asegúrate de que el bot esté publicado y aprobado en Feishu Open Platform / Lark Developer
2. Asegúrate de que la suscripción a eventos incluya `im.message.receive_v1`
3. Asegúrate de que esté seleccionada la **conexión persistente** (WebSocket)
4. Asegúrate de que se hayan concedido todos los ámbitos de permisos requeridos
5. Asegúrate de que el Gateway esté en ejecución: `openclaw gateway status`
6. Revisa los registros: `openclaw logs --follow`

### Se filtró el App Secret

1. Restablece el App Secret en Feishu Open Platform / Lark Developer
2. Actualiza el valor en tu configuración
3. Reinicia el Gateway: `openclaw gateway restart`

---

## Configuración avanzada

### Varias cuentas

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Bot principal",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot de respaldo",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controla qué cuenta se usa cuando las API salientes no especifican un `accountId`.

### Límites de mensajes

- `textChunkLimit` — tamaño de bloque de texto saliente (predeterminado: `2000` caracteres)
- `mediaMaxMb` — límite de carga/descarga de archivos multimedia (predeterminado: `30` MB)

### Streaming

Feishu/Lark admite respuestas en streaming mediante tarjetas interactivas. Cuando está habilitado, el bot actualiza la tarjeta en tiempo real a medida que genera texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // habilitar salida en streaming en tarjetas (predeterminado: true)
      blockStreaming: true, // habilitar streaming a nivel de bloque (predeterminado: true)
    },
  },
}
```

Establece `streaming: false` para enviar la respuesta completa en un solo mensaje.

### Optimización de cuota

Reduce la cantidad de llamadas a la API de Feishu/Lark con dos indicadores opcionales:

- `typingIndicator` (predeterminado `true`): establece `false` para omitir las llamadas de reacción de escritura
- `resolveSenderNames` (predeterminado `true`): establece `false` para omitir las búsquedas del perfil del remitente

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sesiones ACP

Feishu/Lark admite ACP para mensajes directos y mensajes de hilos de grupo. El ACP de Feishu/Lark se controla con comandos de texto: no hay menús nativos de comandos con barra, así que usa mensajes `/acp ...` directamente en la conversación.

#### Vinculación persistente de ACP

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
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Iniciar ACP desde el chat

En un mensaje directo o hilo de Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para mensajes directos y mensajes de hilos de Feishu/Lark. Los mensajes de seguimiento en la conversación vinculada se enrutan directamente a esa sesión de ACP.

### Enrutamiento de varios agentes

Usa `bindings` para enrutar mensajes directos o grupos de Feishu/Lark a distintos agentes.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Campos de enrutamiento:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (mensaje directo) o `"group"` (chat grupal)
- `match.peer.id`: Open ID de usuario (`ou_xxx`) o ID de grupo (`oc_xxx`)

Consulta [Obtener ID de grupo/usuario](#get-groupuser-ids) para ver consejos de búsqueda.

---

## Referencia de configuración

Configuración completa: [Configuración del Gateway](/es/gateway/configuration)

| Setting                                           | Descripción                                | Predeterminado   |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Habilitar/deshabilitar el canal            | `true`           |
| `channels.feishu.domain`                          | Dominio de API (`feishu` o `lark`)         | `feishu`         |
| `channels.feishu.connectionMode`                  | Transporte de eventos (`websocket` o `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Cuenta predeterminada para el enrutamiento saliente | `default`        |
| `channels.feishu.verificationToken`               | Obligatorio para el modo webhook           | —                |
| `channels.feishu.encryptKey`                      | Obligatorio para el modo webhook           | —                |
| `channels.feishu.webhookPath`                     | Ruta del webhook                           | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host de enlace del webhook                 | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Puerto de enlace del webhook               | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID de la aplicación                        | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Anulación de dominio por cuenta            | `feishu`         |
| `channels.feishu.dmPolicy`                        | Política de mensajes directos              | `allowlist`      |
| `channels.feishu.allowFrom`                       | Lista de permitidos para mensajes directos (lista de `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Política de grupo                          | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Lista de grupos permitidos                 | —                |
| `channels.feishu.requireMention`                  | Requerir @mención en grupos                | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Anulación de @mención por grupo            | heredado         |
| `channels.feishu.groups.<chat_id>.enabled`        | Habilitar/deshabilitar un grupo específico | `true`           |
| `channels.feishu.textChunkLimit`                  | Tamaño del bloque de mensaje               | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Límite de tamaño de archivos multimedia    | `30`             |
| `channels.feishu.streaming`                       | Salida en streaming en tarjetas            | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming a nivel de bloque                | `true`           |
| `channels.feishu.typingIndicator`                 | Enviar reacciones de escritura             | `true`           |
| `channels.feishu.resolveSenderNames`              | Resolver nombres visibles del remitente    | `true`           |

---

## Tipos de mensajes compatibles

### Recepción

- ✅ Texto
- ✅ Texto enriquecido (post)
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Video/multimedia
- ✅ Stickers

### Envío

- ✅ Texto
- ✅ Imágenes
- ✅ Archivos
- ✅ Audio
- ✅ Video/multimedia
- ✅ Tarjetas interactivas (incluidas actualizaciones en streaming)
- ⚠️ Texto enriquecido (formato estilo post; no admite todas las capacidades de creación de Feishu/Lark)

Las burbujas de audio nativas de Feishu/Lark usan el tipo de mensaje `audio` de Feishu y requieren cargar contenido multimedia Ogg/Opus (`file_type: "opus"`). Los archivos multimedia `.opus` y `.ogg` existentes se envían directamente como audio nativo. Los formatos MP3/WAV/M4A y otros formatos de audio probables se transcodifican a Ogg/Opus a 48 kHz con `ffmpeg` solo cuando la respuesta solicita entrega por voz (`audioAsVoice` / herramienta de mensajes `asVoice`, incluidas las respuestas de notas de voz TTS). Los archivos adjuntos MP3 normales siguen siendo archivos normales. Si falta `ffmpeg` o falla la conversión, OpenClaw recurre a un archivo adjunto y registra el motivo.

### Hilos y respuestas

- ✅ Respuestas en línea
- ✅ Respuestas en hilos
- ✅ Las respuestas multimedia siguen siendo compatibles con hilos al responder a un mensaje de hilo

Para `groupSessionScope: "group_topic"` y `"group_topic_sender"`, los grupos de temas nativos de Feishu/Lark usan el `thread_id` (`omt_*`) del evento como clave canónica de sesión del tema. Las respuestas normales de grupo que OpenClaw convierte en hilos siguen usando el ID del mensaje raíz de la respuesta (`om_*`) para que el primer turno y el turno de seguimiento permanezcan en la misma sesión.

---

## Relacionado

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por mensaje directo y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
