---
read_when:
    - Trabajar en el comportamiento del canal de WhatsApp/web o en el enrutamiento de la bandeja de entrada
summary: Compatibilidad del canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

Estado: listo para producción mediante WhatsApp Web (Baileys). Gateway gestiona las sesiones vinculadas.

## Instalación (bajo demanda)

- El onboarding (`openclaw onboard`) y `openclaw channels add --channel whatsapp`
  solicitan instalar el plugin de WhatsApp la primera vez que lo seleccionas.
- `openclaw channels login --channel whatsapp` también ofrece el flujo de instalación cuando
  el plugin todavía no está presente.
- Canal de desarrollo + checkout de git: usa por defecto la ruta del plugin local.
- Estable/Beta: usa por defecto el paquete npm `@openclaw/whatsapp`.

La instalación manual sigue estando disponible:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada para MD de remitentes desconocidos es emparejamiento.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnósticos entre canales y guías de reparación.
  </Card>
  <Card title="Configuración de Gateway" icon="settings" href="/es/gateway/configuration">
    Patrones y ejemplos completos de configuración de canales.
  </Card>
</CardGroup>

## Configuración rápida

<Steps>
  <Step title="Configura la política de acceso de WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Vincula WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Para una cuenta específica:

```bash
openclaw channels login --channel whatsapp --account work
```

    Para adjuntar un directorio de autenticación de WhatsApp Web existente/personalizado antes de iniciar sesión:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Inicia Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprueba la primera solicitud de emparejamiento (si usas el modo de emparejamiento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de emparejamiento caducan después de 1 hora. Las solicitudes pendientes están limitadas a 3 por canal.

  </Step>
</Steps>

<Note>
OpenClaw recomienda usar WhatsApp con un número separado cuando sea posible. (Los metadatos del canal y el flujo de configuración están optimizados para esa configuración, pero también se admiten configuraciones con número personal).
</Note>

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este es el modo operativo más limpio:

    - identidad de WhatsApp separada para OpenClaw
    - listas de permitidos de MD y límites de enrutamiento más claros
    - menor probabilidad de confusión con el chat propio

    Patrón mínimo de política:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Alternativa con número personal">
    El onboarding admite el modo de número personal y escribe una base amigable para el chat propio:

    - `dmPolicy: "allowlist"`
    - `allowFrom` incluye tu número personal
    - `selfChatMode: true`

    En tiempo de ejecución, las protecciones de chat propio dependen del número propio vinculado y de `allowFrom`.

  </Accordion>

  <Accordion title="Alcance de canal solo de WhatsApp Web">
    El canal de la plataforma de mensajería se basa en WhatsApp Web (`Baileys`) en la arquitectura actual de canales de OpenClaw.

    No hay un canal separado de mensajería de WhatsApp de Twilio en el registro integrado de canales de chat.

  </Accordion>
</AccordionGroup>

## Modelo de tiempo de ejecución

- Gateway gestiona el socket de WhatsApp y el bucle de reconexión.
- Los envíos salientes requieren un listener de WhatsApp activo para la cuenta de destino.
- Los chats de estado y de difusión se ignoran (`@status`, `@broadcast`).
- Los chats directos usan reglas de sesión de MD (`session.dmScope`; el valor predeterminado `main` consolida los MD en la sesión principal del agente).
- Las sesiones de grupo están aisladas (`agent:<agentId>:whatsapp:group:<jid>`).
- El transporte de WhatsApp Web respeta las variables de entorno estándar de proxy en el host de Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` y variantes en minúsculas). Prefiere la configuración de proxy a nivel de host en lugar de ajustes de proxy específicos de WhatsApp en el canal.

## Hooks de Plugin y privacidad

Los mensajes entrantes de WhatsApp pueden contener contenido personal de mensajes, números de teléfono,
identificadores de grupos, nombres de remitentes y campos de correlación de sesión. Por esa razón,
WhatsApp no difunde las cargas útiles entrantes del hook `message_received` a los plugins
a menos que lo habilites explícitamente:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Puedes limitar la habilitación a una cuenta:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Habilítalo solo para plugins en los que confíes para recibir contenido
e identificadores de mensajes entrantes de WhatsApp.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de MD">
    `channels.whatsapp.dmPolicy` controla el acceso a chats directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `allowFrom` acepta números con formato E.164 (normalizados internamente).

    Sobrescritura multicuenta: `channels.whatsapp.accounts.<id>.dmPolicy` (y `allowFrom`) tienen prioridad sobre los valores predeterminados a nivel de canal para esa cuenta.

    Detalles del comportamiento en tiempo de ejecución:

    - los emparejamientos se persisten en el almacén de permitidos del canal y se combinan con `allowFrom` configurado
    - si no hay una lista de permitidos configurada, el número propio vinculado está permitido de forma predeterminada
    - OpenClaw nunca empareja automáticamente MD salientes `fromMe` (mensajes que te envías a ti mismo desde el dispositivo vinculado)

  </Tab>

  <Tab title="Política de grupos + listas de permitidos">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de pertenencia a grupos** (`channels.whatsapp.groups`)
       - si se omite `groups`, todos los grupos son aptos
       - si `groups` está presente, actúa como lista de permitidos de grupos (se permite `"*"`)

    2. **Política de remitentes de grupos** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: se omite la lista de permitidos de remitentes
       - `allowlist`: el remitente debe coincidir con `groupAllowFrom` (o `*`)
       - `disabled`: bloquea toda entrada de grupos

    Respaldo de la lista de permitidos de remitentes:

    - si `groupAllowFrom` no está configurado, el tiempo de ejecución recurre a `allowFrom` cuando está disponible
    - las listas de permitidos de remitentes se evalúan antes de la activación por mención/respuesta

    Nota: si no existe ningún bloque `channels.whatsapp`, el respaldo de la política de grupos en tiempo de ejecución es `allowlist` (con un registro de advertencia), incluso si `channels.defaults.groupPolicy` está configurado.

  </Tab>

  <Tab title="Menciones + /activation">
    Las respuestas en grupos requieren una mención de forma predeterminada.

    La detección de menciones incluye:

    - menciones explícitas de WhatsApp a la identidad del bot
    - patrones regex de mención configurados (`agents.list[].groupChat.mentionPatterns`, con respaldo en `messages.groupChat.mentionPatterns`)
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Nota de seguridad:

    - citar/responder solo satisface la restricción por mención; **no** concede autorización al remitente
    - con `groupPolicy: "allowlist"`, los remitentes que no están en la lista de permitidos siguen bloqueados incluso si responden al mensaje de un usuario autorizado

    Comando de activación a nivel de sesión:

    - `/activation mention`
    - `/activation always`

    `activation` actualiza el estado de la sesión (no la configuración global). Está restringido al propietario.

  </Tab>
</Tabs>

## Comportamiento de número personal y chat propio

Cuando el número propio vinculado también está presente en `allowFrom`, se activan las protecciones de chat propio de WhatsApp:

- omitir confirmaciones de lectura en turnos de chat propio
- ignorar el comportamiento de activación automática por mention-JID que de otro modo te haría ping a ti mismo
- si `messages.responsePrefix` no está configurado, las respuestas de chat propio usan por defecto `[{identity.name}]` o `[openclaw]`

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Envoltorio entrante + contexto de respuesta">
    Los mensajes entrantes de WhatsApp se envuelven en el envoltorio compartido de entrada.

    Si existe una respuesta citada, el contexto se añade con este formato:

    ```text
    [Respondiendo a <sender> id:<stanzaId>]
    <cuerpo citado o marcador de posición de medios>
    [/Respondiendo]
    ```

    Los campos de metadatos de respuesta también se completan cuando están disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, remitente JID/E.164).

  </Accordion>

  <Accordion title="Marcadores de posición de medios y extracción de ubicación/contacto">
    Los mensajes entrantes que solo contienen medios se normalizan con marcadores de posición como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Los cuerpos de ubicación usan texto breve de coordenadas. Las etiquetas/comentarios de ubicación y los detalles de contacto/vCard se representan como metadatos no confiables delimitados, no como texto de prompt en línea.

  </Accordion>

  <Accordion title="Inyección de historial pendiente de grupos">
    En grupos, los mensajes no procesados pueden almacenarse en búfer e inyectarse como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`
    - respaldo: `messages.groupChat.historyLimit`
    - `0` desactiva

    Marcadores de inyección:

    - `[Mensajes del chat desde tu última respuesta - para contexto]`
    - `[Mensaje actual - responde a este]`

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Las confirmaciones de lectura están habilitadas de forma predeterminada para mensajes entrantes de WhatsApp aceptados.

    Desactivar globalmente:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Sobrescritura por cuenta:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Los turnos de chat propio omiten las confirmaciones de lectura incluso cuando están habilitadas globalmente.

  </Accordion>
</AccordionGroup>

## Entrega, fragmentación y medios

<AccordionGroup>
  <Accordion title="Fragmentación de texto">
    - límite predeterminado de fragmento: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - el modo `newline` prioriza los límites de párrafo (líneas en blanco), y luego recurre a fragmentación segura por longitud
  </Accordion>

  <Accordion title="Comportamiento de medios salientes">
    - admite cargas útiles de imagen, video, audio (nota de voz PTT) y documento
    - las cargas útiles de respuesta conservan `audioAsVoice`; WhatsApp envía medios de audio como notas de voz PTT de Baileys
    - el audio no Ogg, incluida la salida MP3/WebM de TTS de Microsoft Edge, se transcodifica a Ogg/Opus antes de la entrega PTT
    - el audio nativo Ogg/Opus se envía con `audio/ogg; codecs=opus` para compatibilidad con notas de voz
    - la reproducción de GIF animados se admite mediante `gifPlayback: true` en envíos de video
    - los subtítulos se aplican al primer elemento multimedia al enviar cargas útiles de respuesta con varios medios
    - la fuente de medios puede ser HTTP(S), `file://` o rutas locales
  </Accordion>

  <Accordion title="Límites de tamaño de medios y comportamiento de respaldo">
    - límite de guardado de medios entrantes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - límite de envío de medios salientes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - las sobrescrituras por cuenta usan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (redimensionado/barrido de calidad) para ajustarse a los límites
    - ante un fallo al enviar medios, el respaldo del primer elemento envía una advertencia de texto en lugar de descartar la respuesta silenciosamente
  </Accordion>
</AccordionGroup>

## Citas de respuesta

WhatsApp admite citas nativas de respuesta, donde las respuestas salientes citan visiblemente el mensaje entrante. Contrólalo con `channels.whatsapp.replyToMode`.

| Valor       | Comportamiento                                                           |
| ----------- | ------------------------------------------------------------------------ |
| `"off"`     | Nunca citar; enviar como mensaje simple                                  |
| `"first"`   | Citar solo el primer fragmento de respuesta saliente                     |
| `"all"`     | Citar cada fragmento de respuesta saliente                               |
| `"batched"` | Citar respuestas agrupadas en cola y dejar sin citar las respuestas inmediatas |

El valor predeterminado es `"off"`. Las sobrescrituras por cuenta usan `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Nivel de reacción

`channels.whatsapp.reactionLevel` controla hasta qué punto el agente usa reacciones con emoji en WhatsApp:

| Nivel         | Reacciones de acuse | Reacciones iniciadas por el agente | Descripción                                      |
| ------------- | ------------------- | ---------------------------------- | ------------------------------------------------ |
| `"off"`       | No                  | No                                 | Sin reacciones en absoluto                       |
| `"ack"`       | Sí                  | No                                 | Solo reacciones de acuse (acuse previo a la respuesta) |
| `"minimal"`   | Sí                  | Sí (conservador)                   | Acuse + reacciones del agente con orientación conservadora |
| `"extensive"` | Sí                  | Sí (fomentado)                     | Acuse + reacciones del agente con orientación fomentada |

Valor predeterminado: `"minimal"`.

Las sobrescrituras por cuenta usan `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reacciones de acuse

WhatsApp admite reacciones inmediatas de acuse al recibir mensajes entrantes mediante `channels.whatsapp.ackReaction`.
Las reacciones de acuse están controladas por `reactionLevel`: se suprimen cuando `reactionLevel` es `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Notas de comportamiento:

- se envían inmediatamente después de aceptar el mensaje entrante (antes de responder)
- los fallos se registran, pero no bloquean la entrega normal de la respuesta
- el modo de grupo `mentions` reacciona en turnos activados por mención; la activación de grupo `always` actúa como omisión de esta comprobación
- WhatsApp usa `channels.whatsapp.ackReaction` (aquí no se usa el heredado `messages.ackReaction`)

## Varias cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuenta y valores predeterminados">
    - los ID de cuenta provienen de `channels.whatsapp.accounts`
    - selección de cuenta predeterminada: `default` si está presente; de lo contrario, el primer ID de cuenta configurado (ordenado)
    - los ID de cuenta se normalizan internamente para su búsqueda
  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta de autenticación actual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - archivo de copia de seguridad: `creds.json.bak`
    - la autenticación predeterminada heredada en `~/.openclaw/credentials/` sigue reconociéndose/migrándose para los flujos de cuenta predeterminada
  </Accordion>

  <Accordion title="Comportamiento de cierre de sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp para esa cuenta.

    En directorios de autenticación heredados, `oauth.json` se conserva mientras se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad de herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Puertas de acciones:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Las escrituras de configuración iniciadas por el canal están habilitadas de forma predeterminada (desactívalas con `channels.whatsapp.configWrites=false`).

## Solución de problemas

<AccordionGroup>
  <Accordion title="No vinculado (se requiere QR)">
    Síntoma: el estado del canal informa que no está vinculado.

    Solución:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Vinculado pero desconectado / bucle de reconexión">
    Síntoma: cuenta vinculada con desconexiones repetidas o intentos de reconexión.

    Solución:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Si es necesario, vuelve a vincular con `channels login`.

  </Accordion>

  <Accordion title="No hay listener activo al enviar">
    Los envíos salientes fallan de inmediato cuando no existe ningún listener activo de Gateway para la cuenta de destino.

    Asegúrate de que Gateway esté en ejecución y de que la cuenta esté vinculada.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Comprueba en este orden:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de lista de permitidos de `groups`
    - restricción por mención (`requireMention` + patrones de mención)
    - claves duplicadas en `openclaw.json` (JSON5): las entradas posteriores sobrescriben a las anteriores, así que mantén un solo `groupPolicy` por ámbito

  </Accordion>

  <Accordion title="Advertencia del tiempo de ejecución de Bun">
    El tiempo de ejecución de Gateway para WhatsApp debe usar Node. Bun está marcado como incompatible para el funcionamiento estable de Gateway con WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema al estilo de Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Jerarquía de resolución para mensajes de grupo:

Primero se determina el mapa `groups` efectivo: si la cuenta define su propio `groups`, reemplaza por completo el mapa `groups` raíz (sin fusión profunda). La búsqueda del prompt se ejecuta después sobre el único mapa resultante:

1. **Prompt del sistema específico del grupo** (`groups["<groupId>"].systemPrompt`): se usa cuando la entrada específica del grupo existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín del grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo no existe en absoluto en el mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

Jerarquía de resolución para mensajes directos:

Primero se determina el mapa `direct` efectivo: si la cuenta define su propio `direct`, reemplaza por completo el mapa `direct` raíz (sin fusión profunda). La búsqueda del prompt se ejecuta después sobre el único mapa resultante:

1. **Prompt del sistema específico del chat directo** (`direct["<peerId>"].systemPrompt`): se usa cuando la entrada específica del par existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema.
2. **Prompt del sistema comodín del chat directo** (`direct["*"].systemPrompt`): se usa cuando la entrada específica del par no existe en absoluto en el mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

Nota: `dms` sigue siendo el contenedor ligero de sobrescrituras de historial por MD (`dms.<id>.historyLimit`); las sobrescrituras de prompt viven en `direct`.

**Diferencia con el comportamiento multicuenta de Telegram:** En Telegram, `groups` raíz se suprime intencionalmente para todas las cuentas en una configuración multicuenta —incluso para cuentas que no definen su propio `groups`— para evitar que un bot reciba mensajes de grupos a los que no pertenece. WhatsApp no aplica esta protección: `groups` raíz y `direct` raíz siempre se heredan en las cuentas que no definen una sobrescritura a nivel de cuenta, independientemente de cuántas cuentas estén configuradas. En una configuración multicuenta de WhatsApp, si quieres prompts por cuenta para grupos o chats directos, define el mapa completo explícitamente bajo cada cuenta en lugar de depender de los valores predeterminados a nivel raíz.

Comportamiento importante:

- `channels.whatsapp.groups` es a la vez un mapa de configuración por grupo y la lista de permitidos de grupos a nivel de chat. Ya sea en el ámbito raíz o en el de cuenta, `groups["*"]` significa "se admiten todos los grupos" para ese ámbito.
- Solo añade un `systemPrompt` de grupo comodín cuando ya quieras que ese ámbito admita todos los grupos. Si aun así quieres que solo un conjunto fijo de ID de grupo sea apto, no uses `groups["*"]` como valor predeterminado del prompt. En su lugar, repite el prompt en cada entrada de grupo incluida explícitamente en la lista de permitidos.
- La admisión al grupo y la autorización del remitente son comprobaciones independientes. `groups["*"]` amplía el conjunto de grupos que pueden llegar al manejo de grupos, pero por sí solo no autoriza a todos los remitentes de esos grupos. El acceso del remitente sigue controlándose por separado mediante `channels.whatsapp.groupPolicy` y `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` no tiene el mismo efecto secundario para los MD. `direct["*"]` solo proporciona una configuración predeterminada de chat directo después de que un MD ya haya sido admitido por `dmPolicy` junto con `allowFrom` o las reglas del almacén de emparejamientos.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Úsalo solo si todos los grupos deben admitirse en el ámbito raíz.
        // Se aplica a todas las cuentas que no definen su propio mapa groups.
        "*": { systemPrompt: "Prompt predeterminado para todos los grupos." },
      },
      direct: {
        // Se aplica a todas las cuentas que no definen su propio mapa direct.
        "*": { systemPrompt: "Prompt predeterminado para todos los chats directos." },
      },
      accounts: {
        work: {
          groups: {
            // Esta cuenta define su propio groups, así que groups raíz se
            // reemplaza por completo. Para mantener un comodín, define "*" aquí también.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Céntrate en la gestión de proyectos.",
            },
            // Úsalo solo si todos los grupos deben admitirse en esta cuenta.
            "*": { systemPrompt: "Prompt predeterminado para grupos de trabajo." },
          },
          direct: {
            // Esta cuenta define su propio direct, así que las entradas direct raíz se
            // reemplazan por completo. Para mantener un comodín, define "*" aquí también.
            "+15551234567": { systemPrompt: "Prompt para un chat directo de trabajo específico." },
            "*": { systemPrompt: "Prompt predeterminado para chats directos de trabajo." },
          },
        },
      },
    },
  },
}
```

## Punteros de referencia de configuración

Referencia principal:

- [Referencia de configuración - WhatsApp](/es/gateway/config-channels#whatsapp)

Campos de WhatsApp de alta relevancia:

- acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- varias cuentas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, sobrescrituras a nivel de cuenta
- operaciones: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamiento de sesión: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento multagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
