---
read_when:
    - Configuración del canal BlueBubbles
    - Solución de problemas del emparejamiento de Webhook
    - Configuración de iMessage en macOS
summary: iMessage a través del servidor BlueBubbles para macOS (envío/recepción REST, escritura, reacciones, emparejamiento, acciones avanzadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-22T04:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST de macOS)

Estado: plugin incluido que se comunica con el servidor BlueBubbles de macOS mediante HTTP. **Recomendado para la integración con iMessage** debido a su API más completa y a una configuración más sencilla en comparación con el canal imsg heredado.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen BlueBubbles, por lo que las compilaciones empaquetadas normales no necesitan un paso separado de `openclaw plugins install`.

## Descripción general

- Se ejecuta en macOS mediante la aplicación auxiliar de BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/probado: macOS Sequoia (15). macOS Tahoe (26) funciona; actualmente la edición está rota en Tahoe, y las actualizaciones del icono del grupo pueden informar éxito pero no sincronizarse.
- OpenClaw se comunica con él a través de su API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Los mensajes entrantes llegan mediante Webhooks; las respuestas salientes, los indicadores de escritura, los acuses de lectura y los tapbacks son llamadas REST.
- Los adjuntos y stickers se incorporan como contenido multimedia entrante (y se muestran al agente cuando es posible).
- El emparejamiento/lista de permitidos funciona igual que en otros canales (`/channels/pairing`, etc.) con `channels.bluebubbles.allowFrom` + códigos de emparejamiento.
- Las reacciones se muestran como eventos del sistema, igual que en Slack/Telegram, para que los agentes puedan "mencionarlas" antes de responder.
- Funciones avanzadas: editar, retirar, respuestas en hilo, efectos de mensaje, gestión de grupos.

## Inicio rápido

1. Instala el servidor BlueBubbles en tu Mac (sigue las instrucciones en [bluebubbles.app/install](https://bluebubbles.app/install)).
2. En la configuración de BlueBubbles, habilita la API web y establece una contraseña.
3. Ejecuta `openclaw onboard` y selecciona BlueBubbles, o configúralo manualmente:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Apunta los Webhooks de BlueBubbles a tu Gateway (ejemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Inicia el Gateway; registrará el controlador del Webhook y comenzará el emparejamiento.

Nota de seguridad:

- Establece siempre una contraseña para el Webhook.
- La autenticación del Webhook siempre es obligatoria. OpenClaw rechaza las solicitudes de Webhook de BlueBubbles a menos que incluyan una contraseña/guid que coincida con `channels.bluebubbles.password` (por ejemplo `?password=<password>` o `x-password`), independientemente de la topología de loopback/proxy.
- La autenticación por contraseña se comprueba antes de leer/analizar cuerpos completos de Webhook.

## Mantener Messages.app activa (VM / configuraciones sin pantalla)

Algunas configuraciones de VM de macOS / siempre activas pueden hacer que Messages.app quede “inactiva” (los eventos entrantes se detienen hasta que se abre o se pone en primer plano la aplicación). Una solución sencilla es **activar Messages cada 5 minutos** usando un AppleScript + LaunchAgent.

### 1) Guardar el AppleScript

Guárdalo como:

- `~/Scripts/poke-messages.scpt`

Script de ejemplo (no interactivo; no roba el foco):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Instalar un LaunchAgent

Guárdalo como:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Notas:

- Esto se ejecuta **cada 300 segundos** y **al iniciar sesión**.
- La primera ejecución puede activar avisos de **Automatización** de macOS (`osascript` → Messages). Apruébalos en la misma sesión de usuario que ejecuta el LaunchAgent.

Cárgalo:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Incorporación

BlueBubbles está disponible en la incorporación interactiva:

```
openclaw onboard
```

El asistente solicita:

- **URL del servidor** (obligatorio): dirección del servidor BlueBubbles (por ejemplo, `http://192.168.1.100:1234`)
- **Contraseña** (obligatorio): contraseña de la API en la configuración de BlueBubbles Server
- **Ruta del Webhook** (opcional): el valor predeterminado es `/bluebubbles-webhook`
- **Política de MD**: pairing, allowlist, open o disabled
- **Lista de permitidos**: números de teléfono, correos electrónicos o destinos de chat

También puedes añadir BlueBubbles mediante la CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Control de acceso (MD + grupos)

MD:

- Predeterminado: `channels.bluebubbles.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta su aprobación (los códigos caducan después de 1 hora).
- Aprueba mediante:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predeterminado: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quién puede activar en grupos cuando se establece `allowlist`.

### Enriquecimiento de nombres de contacto (macOS, opcional)

Los Webhooks de grupo de BlueBubbles a menudo solo incluyen direcciones sin procesar de los participantes. Si quieres que el contexto `GroupMembers` muestre en su lugar nombres de contactos locales, puedes habilitar opcionalmente el enriquecimiento desde Contactos locales en macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita la búsqueda. Predeterminado: `false`.
- Las búsquedas solo se ejecutan después de que el acceso al grupo, la autorización de comandos y el filtrado por mención hayan permitido el paso del mensaje.
- Solo se enriquecen los participantes telefónicos sin nombre.
- Los números de teléfono sin procesar siguen siendo el valor de respaldo cuando no se encuentra una coincidencia local.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Filtrado por mención (grupos)

BlueBubbles admite filtrado por mención para chats de grupo, en línea con el comportamiento de iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`) para detectar menciones.
- Cuando `requireMention` está habilitado para un grupo, el agente solo responde cuando se le menciona.
- Los comandos de control de remitentes autorizados omiten el filtrado por mención.

Configuración por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // valor predeterminado para todos los grupos
        "iMessage;-;chat123": { requireMention: false }, // anulación para un grupo específico
      },
    },
  },
}
```

### Filtrado de comandos

- Los comandos de control (por ejemplo, `/config`, `/model`) requieren autorización.
- Usa `allowFrom` y `groupAllowFrom` para determinar la autorización de comandos.
- Los remitentes autorizados pueden ejecutar comandos de control incluso sin mencionar en grupos.

### Prompt del sistema por grupo

Cada entrada en `channels.bluebubbles.groups.*` acepta una cadena `systemPrompt` opcional. El valor se inyecta en el prompt del sistema del agente en cada turno que maneja un mensaje en ese grupo, de modo que puedas establecer reglas de personalidad o comportamiento por grupo sin editar los prompts del agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Mantén las respuestas por debajo de 3 frases. Refleja el tono informal del grupo.",
        },
      },
    },
  },
}
```

La clave coincide con lo que BlueBubbles informa como `chatGuid` / `chatIdentifier` / `chatId` numérico para el grupo, y una entrada comodín `"*"` proporciona un valor predeterminado para cada grupo sin coincidencia exacta (el mismo patrón usado por `requireMention` y las políticas de herramientas por grupo). Las coincidencias exactas siempre prevalecen sobre el comodín. Los MD ignoran este campo; usa en su lugar la personalización del prompt a nivel de agente o de cuenta.

#### Ejemplo práctico: respuestas en hilo y reacciones tapback (API privada)

Con la API privada de BlueBubbles habilitada, los mensajes entrantes llegan con identificadores de mensaje cortos (por ejemplo, `[[reply_to:5]]`) y el agente puede llamar a `action=reply` para responder en hilo a un mensaje específico o `action=react` para dejar un tapback. Un `systemPrompt` por grupo es una forma fiable de hacer que el agente elija la herramienta correcta:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Al responder en este grupo, llama siempre a action=reply con el",
            "messageId [[reply_to:N]] del contexto para que tu respuesta quede en hilo",
            "bajo el mensaje que la activó. Nunca envíes un mensaje nuevo sin vincular.",
            "",
            "Para acuses breves ('ok', 'entendido', 'voy a ello'), usa",
            "action=react con un emoji tapback apropiado (❤️, 👍, 😂, ‼️, ❓)",
            "en lugar de enviar una respuesta de texto.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tanto las reacciones tapback como las respuestas en hilo requieren la API privada de BlueBubbles; consulta [Acciones avanzadas](#advanced-actions) e [IDs de mensaje](#message-ids-short-vs-full) para ver la mecánica subyacente.

## Vinculaciones de conversaciones ACP

Los chats de BlueBubbles pueden convertirse en espacios de trabajo ACP persistentes sin cambiar la capa de transporte.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del chat MD o del grupo permitido.
- Los mensajes futuros en esa misma conversación de BlueBubbles se enrutan a la sesión ACP creada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Las vinculaciones persistentes configuradas también se admiten mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "bluebubbles"`.

`match.peer.id` puede usar cualquier forma de destino BlueBubbles admitida:

- identificador de MD normalizado, como `+15555550123` o `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para vinculaciones estables de grupos, prefiere `chat_id:*` o `chat_identifier:*`.

Ejemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Consulta [Agentes ACP](/es/tools/acp-agents) para conocer el comportamiento compartido de las vinculaciones ACP.

## Escritura + acuses de lectura

- **Indicadores de escritura**: se envían automáticamente antes y durante la generación de la respuesta.
- **Acuses de lectura**: controlados por `channels.bluebubbles.sendReadReceipts` (predeterminado: `true`).
- **Indicadores de escritura**: OpenClaw envía eventos de inicio de escritura; BlueBubbles borra la escritura automáticamente al enviar o por tiempo de espera (la detención manual mediante DELETE no es fiable).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desactiva los acuses de lectura
    },
  },
}
```

## Acciones avanzadas

BlueBubbles admite acciones avanzadas de mensaje cuando están habilitadas en la configuración:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

Acciones disponibles:

- **react**: Añadir/quitar reacciones tapback (`messageId`, `emoji`, `remove`). El conjunto nativo de tapback de iMessage es `love`, `like`, `dislike`, `laugh`, `emphasize` y `question`. Cuando un agente elige un emoji fuera de ese conjunto (por ejemplo `👀`), la herramienta de reacciones usa `love` como alternativa para que el tapback siga mostrándose en lugar de fallar toda la solicitud. Las reacciones de acuse configuradas siguen validándose estrictamente y producen un error con valores desconocidos.
- **edit**: Editar un mensaje enviado (`messageId`, `text`)
- **unsend**: Retirar un mensaje (`messageId`)
- **reply**: Responder a un mensaje específico (`messageId`, `text`, `to`)
- **sendWithEffect**: Enviar con efecto de iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Cambiar el nombre de un chat de grupo (`chatGuid`, `displayName`)
- **setGroupIcon**: Establecer el icono/foto de un chat de grupo (`chatGuid`, `media`) — poco fiable en macOS 26 Tahoe (la API puede devolver éxito, pero el icono no se sincroniza).
- **addParticipant**: Añadir a alguien a un grupo (`chatGuid`, `address`)
- **removeParticipant**: Quitar a alguien de un grupo (`chatGuid`, `address`)
- **leaveGroup**: Salir de un chat de grupo (`chatGuid`)
- **upload-file**: Enviar contenido multimedia/archivos (`to`, `buffer`, `filename`, `asVoice`)
  - Notas de voz: establece `asVoice: true` con audio **MP3** o **CAF** para enviar como mensaje de voz de iMessage. BlueBubbles convierte MP3 → CAF al enviar notas de voz.
- Alias heredado: `sendAttachment` sigue funcionando, pero `upload-file` es el nombre canónico de la acción.

### IDs de mensaje (corto frente a completo)

OpenClaw puede mostrar IDs de mensaje _cortos_ (por ejemplo, `1`, `2`) para ahorrar tokens.

- `MessageSid` / `ReplyToId` pueden ser IDs cortos.
- `MessageSidFull` / `ReplyToIdFull` contienen los IDs completos del proveedor.
- Los IDs cortos están en memoria; pueden caducar al reiniciar o al vaciar la caché.
- Las acciones aceptan `messageId` corto o completo, pero los IDs cortos producirán un error si ya no están disponibles.

Usa IDs completos para automatizaciones y almacenamiento persistentes:

- Plantillas: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` en las cargas útiles entrantes

Consulta [Configuración](/es/gateway/configuration) para ver las variables de plantilla.

## Coalescencia de MD con envíos divididos (comando + URL en una sola redacción)

Cuando un usuario escribe un comando y una URL juntos en iMessage — por ejemplo `Dump https://example.com/article` — Apple divide el envío en **dos entregas de Webhook separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Los dos Webhooks llegan a OpenClaw con una separación aproximada de 0,8-2,0 s en la mayoría de las configuraciones. Sin coalescencia, el agente recibe el comando solo en el turno 1, responde (a menudo "envíame la URL") y solo ve la URL en el turno 2, momento en el que el contexto del comando ya se ha perdido.

`channels.bluebubbles.coalesceSameSenderDms` permite que una MD combine Webhooks consecutivos del mismo remitente en un único turno del agente. Los chats de grupo siguen usando una clave por mensaje para preservar la estructura de turnos de varios usuarios.

### Cuándo habilitarlo

Habilítalo cuando:

- Distribuyes Skills que esperan `comando + carga útil` en un solo mensaje (dump, paste, save, queue, etc.).
- Tus usuarios pegan URL, imágenes o contenido largo junto con comandos.
- Puedes aceptar la latencia adicional del turno de MD (consulta más abajo).

Déjalo deshabilitado cuando:

- Necesitas la latencia mínima de comandos para activadores de MD de una sola palabra.
- Todos tus flujos son comandos de un solo paso sin cargas útiles posteriores.

### Habilitación

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // opt in (default: false)
    },
  },
}
```

Con la marca activada y sin `messages.inbound.byChannel.bluebubbles` explícito, la ventana de antirrebote se amplía a **2500 ms** (el valor predeterminado sin coalescencia es 500 ms). La ventana más amplia es necesaria: la cadencia de envío dividido de Apple, de 0,8-2,0 s, no cabe en el valor predeterminado más ajustado.

Para ajustar la ventana manualmente:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
        // or under memory pressure (observed gap can stretch past 2 s then).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Compensaciones

- **Latencia añadida para comandos de control en MD.** Con la marca activada, los mensajes de comandos de control en MD (como `Dump`, `Save`, etc.) ahora esperan hasta la ventana de antirrebote antes del envío, por si llega un Webhook de carga útil. Los comandos en chats de grupo mantienen el envío instantáneo.
- **La salida combinada está acotada**: el texto combinado se limita a 4000 caracteres con un marcador explícito `…[truncated]`; los adjuntos se limitan a 20; las entradas de origen se limitan a 10 (se conserva la primera y la más reciente por encima de ese límite). Cada `messageId` de origen sigue llegando a la deduplicación de entrada, por lo que una reproducción posterior de MessagePoller de cualquier evento individual se reconoce como duplicada.
- **Activación opcional, por canal.** Otros canales (Telegram, WhatsApp, Slack, …) no se ven afectados.

### Escenarios y lo que ve el agente

| Lo que redacta el usuario                                         | Lo que entrega Apple       | Marca desactivada (predeterminado)      | Marca activada + ventana de 2500 ms                                       |
| ----------------------------------------------------------------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (un solo envío)                        | 2 Webhooks con ~1 s de gap | Dos turnos del agente: "Dump" solo, luego URL | Un turno: texto combinado `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (adjunto + texto)                 | 2 Webhooks                 | Dos turnos                              | Un turno: texto + imagen                                                  |
| `/status` (comando independiente)                                 | 1 Webhook                  | Envío instantáneo                       | **Espera hasta la ventana y luego envía**                                 |
| URL pegada sola                                                   | 1 Webhook                  | Envío instantáneo                       | Envío instantáneo (solo una entrada en el bloque)                         |
| Texto + URL enviados como dos mensajes deliberadamente separados, con minutos de diferencia | 2 Webhooks fuera de la ventana | Dos turnos                      | Dos turnos (la ventana caduca entre ellos)                                |
| Ráfaga rápida (>10 MD pequeñas dentro de la ventana)              | N Webhooks                 | N turnos                                | Un turno, salida acotada (primera + más reciente, con límites de texto/adjuntos aplicados) |

### Solución de problemas de la coalescencia de envíos divididos

Si la marca está activada y los envíos divididos siguen llegando como dos turnos, revisa cada capa:

1. **La configuración realmente se cargó.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Después `openclaw gateway restart`: la marca se lee al crear el registro de antirrebote.

2. **La ventana de antirrebote es lo bastante amplia para tu configuración.** Mira el registro del servidor BlueBubbles en `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Mide la separación entre el envío de texto tipo `"Dump"` y el envío posterior de `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` para cubrir con margen esa separación.

3. **Las marcas de tiempo de JSONL de la sesión ≠ llegada del Webhook.** Las marcas de tiempo de los eventos de sesión (`~/.openclaw/agents/<id>/sessions/*.jsonl`) reflejan cuándo el Gateway entrega un mensaje al agente, **no** cuándo llegó el Webhook. Un segundo mensaje en cola etiquetado `[Queued messages while agent was busy]` significa que el primer turno seguía en ejecución cuando llegó el segundo Webhook: el bloque de coalescencia ya se había vaciado. Ajusta la ventana según el registro del servidor BB, no según el registro de sesión.

4. **La presión de memoria ralentiza el envío de la respuesta.** En máquinas más pequeñas (8 GB), los turnos del agente pueden tardar lo suficiente como para que el bloque de coalescencia se vacíe antes de que se complete la respuesta, y la URL llegue como un segundo turno en cola. Revisa `memory_pressure` y `ps -o rss -p $(pgrep openclaw-gateway)`; si el Gateway supera ~500 MB de RSS y el compresor está activo, cierra otros procesos pesados o cambia a un host más grande.

5. **Los envíos con cita de respuesta siguen una ruta distinta.** Si el usuario tocó `Dump` como una **respuesta** a un globo de URL existente (iMessage muestra una insignia "1 Reply" en el globo de Dump), la URL está en `replyToBody`, no en un segundo Webhook. La coalescencia no se aplica: es un tema de Skill/prompt, no del antirrebote.

## Streaming por bloques

Controla si las respuestas se envían como un solo mensaje o se transmiten en bloques:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Multimedia + límites

- Los adjuntos entrantes se descargan y almacenan en la caché multimedia.
- Límite multimedia mediante `channels.bluebubbles.mediaMaxMb` para contenido multimedia entrante y saliente (predeterminado: 8 MB).
- El texto saliente se divide en bloques según `channels.bluebubbles.textChunkLimit` (predeterminado: 4000 caracteres).

## Referencia de configuración

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.bluebubbles.enabled`: Habilita/deshabilita el canal.
- `channels.bluebubbles.serverUrl`: URL base de la API REST de BlueBubbles.
- `channels.bluebubbles.password`: Contraseña de la API.
- `channels.bluebubbles.webhookPath`: Ruta del endpoint del Webhook (predeterminado: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).
- `channels.bluebubbles.allowFrom`: Lista de permitidos de MD (identificadores, correos electrónicos, números E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predeterminado: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Lista de permitidos de remitentes de grupo.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: En macOS, enriquece opcionalmente desde Contactos locales a los participantes de grupo sin nombre después de que pase el filtrado. Predeterminado: `false`.
- `channels.bluebubbles.groups`: Configuración por grupo (`requireMention`, etc.).
- `channels.bluebubbles.sendReadReceipts`: Envía acuses de lectura (predeterminado: `true`).
- `channels.bluebubbles.blockStreaming`: Habilita el streaming por bloques (predeterminado: `false`; obligatorio para respuestas con streaming).
- `channels.bluebubbles.textChunkLimit`: Tamaño de bloque saliente en caracteres (predeterminado: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Tiempo de espera por solicitud en ms para envíos de texto salientes mediante `/api/v1/message/text` (predeterminado: 30000). Auméntalo en configuraciones de macOS 26 donde los envíos de iMessage de la API privada pueden quedarse bloqueados durante más de 60 segundos dentro del framework de iMessage; por ejemplo `45000` o `60000`. Los sondeos, búsquedas de chat, reacciones, ediciones y comprobaciones de estado actualmente mantienen el valor predeterminado más corto de 10 s; ampliar la cobertura a reacciones y ediciones está previsto como seguimiento. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (predeterminado) divide solo cuando se supera `textChunkLimit`; `newline` divide por líneas en blanco (límites de párrafo) antes de la fragmentación por longitud.
- `channels.bluebubbles.mediaMaxMb`: Límite de contenido multimedia entrante/saliente en MB (predeterminado: 8).
- `channels.bluebubbles.mediaLocalRoots`: Lista de permitidos explícita de directorios locales absolutos autorizados para rutas de contenido multimedia local saliente. Los envíos de rutas locales se deniegan de forma predeterminada a menos que esto esté configurado. Anulación por cuenta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Combina Webhooks consecutivos de MD del mismo remitente en un solo turno del agente para que el envío dividido de texto+URL de Apple llegue como un único mensaje (predeterminado: `false`). Consulta [Coalescencia de MD con envíos divididos](#coalescing-split-send-dms-command--url-in-one-composition) para ver escenarios, ajuste de ventana y compensaciones. Amplía la ventana predeterminada de antirrebote de entrada de 500 ms a 2500 ms cuando se habilita sin un `messages.inbound.byChannel.bluebubbles` explícito.
- `channels.bluebubbles.historyLimit`: Número máximo de mensajes de grupo para contexto (0 desactiva).
- `channels.bluebubbles.dmHistoryLimit`: Límite del historial de MD.
- `channels.bluebubbles.actions`: Habilita/deshabilita acciones específicas.
- `channels.bluebubbles.accounts`: Configuración de varias cuentas.

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (o `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Direccionamiento / destinos de entrega

Prefiere `chat_guid` para un enrutamiento estable:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Identificadores directos: `+15555550123`, `user@example.com`
  - Si un identificador directo no tiene un chat de MD existente, OpenClaw creará uno mediante `POST /api/v1/chat/new`. Esto requiere que la API privada de BlueBubbles esté habilitada.

### Enrutamiento de iMessage frente a SMS

Cuando el mismo identificador tiene tanto un chat de iMessage como uno de SMS en la Mac (por ejemplo, un número de teléfono registrado en iMessage pero que también ha recibido reversiones de globo verde), OpenClaw prefiere el chat de iMessage y nunca degrada silenciosamente a SMS. Para forzar el chat de SMS, usa un prefijo de destino `sms:` explícito (por ejemplo `sms:+15555550123`). Los identificadores sin un chat de iMessage coincidente siguen enviándose a través del chat que informe BlueBubbles.

## Seguridad

- Las solicitudes de Webhook se autentican comparando los parámetros de consulta o encabezados `guid`/`password` con `channels.bluebubbles.password`.
- Mantén en secreto la contraseña de la API y el endpoint del Webhook (trátalos como credenciales).
- No hay omisión para localhost en la autenticación del Webhook de BlueBubbles. Si haces proxy del tráfico del Webhook, mantén la contraseña de BlueBubbles en la solicitud de extremo a extremo. `gateway.trustedProxies` no sustituye a `channels.bluebubbles.password` aquí. Consulta [Seguridad del Gateway](/es/gateway/security#reverse-proxy-configuration).
- Habilita HTTPS + reglas de firewall en el servidor BlueBubbles si lo expones fuera de tu LAN.

## Solución de problemas

- Si los eventos de escritura/lectura dejan de funcionar, revisa los registros del Webhook de BlueBubbles y verifica que la ruta del Gateway coincida con `channels.bluebubbles.webhookPath`.
- Los códigos de emparejamiento caducan después de una hora; usa `openclaw pairing list bluebubbles` y `openclaw pairing approve bluebubbles <code>`.
- Las reacciones requieren la API privada de BlueBubbles (`POST /api/v1/message/react`); asegúrate de que la versión del servidor la expone.
- Editar/retirar requiere macOS 13+ y una versión compatible del servidor BlueBubbles. En macOS 26 (Tahoe), la edición está actualmente rota debido a cambios en la API privada.
- Las actualizaciones del icono del grupo pueden ser poco fiables en macOS 26 (Tahoe): la API puede devolver éxito, pero el icono nuevo no se sincroniza.
- OpenClaw oculta automáticamente las acciones conocidas como rotas según la versión de macOS del servidor BlueBubbles. Si editar sigue apareciendo en macOS 26 (Tahoe), desactívalo manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` está habilitado, pero los envíos divididos (por ejemplo `Dump` + URL) siguen llegando como dos turnos: consulta la lista de verificación de [solución de problemas de la coalescencia de envíos divididos](#split-send-coalescing-troubleshooting); las causas habituales son una ventana de antirrebote demasiado estrecha, interpretar erróneamente las marcas de tiempo del registro de sesión como llegada del Webhook, o un envío con cita de respuesta (que usa `replyToBody`, no un segundo Webhook).
- Para información de estado/salud: `openclaw status --all` o `openclaw status --deep`.

Para una referencia general del flujo de trabajo de canales, consulta [Canales](/es/channels) y la guía de [Plugins](/es/tools/plugin).

## Relacionado

- [Descripción general de Canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats de grupo y filtrado por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
