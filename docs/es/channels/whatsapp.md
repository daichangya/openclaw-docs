---
read_when:
    - Trabajando en el comportamiento del canal de WhatsApp/web o en el enrutamiento de la bandeja de entrada
summary: Compatibilidad del canal de WhatsApp, controles de acceso, comportamiento de entrega y operaciones
title: WhatsApp
x-i18n:
    generated_at: "2026-04-22T04:20:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c527b9f7f58f4bb7272a6d1c0f9a435d7d46a9b99790243594afb5c305606b3
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (canal Web)

Estado: listo para producción mediante WhatsApp Web (Baileys). El Gateway controla las sesiones enlazadas.

## Instalación (bajo demanda)

- El onboarding (`openclaw onboard`) y `openclaw channels add --channel whatsapp`
  muestran una opción para instalar el Plugin de WhatsApp la primera vez que lo seleccionas.
- `openclaw channels login --channel whatsapp` también ofrece el flujo de instalación cuando
  el Plugin todavía no está presente.
- Canal de desarrollo + copia de trabajo git: usa de forma predeterminada la ruta del Plugin local.
- Estable/Beta: usa de forma predeterminada el paquete npm `@openclaw/whatsapp`.

La instalación manual sigue disponible:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    La política predeterminada de mensajes directos es emparejamiento para remitentes desconocidos.
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
  <Step title="Configurar la política de acceso de WhatsApp">

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

  <Step title="Enlazar WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Para una cuenta específica:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Iniciar el gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Aprobar la primera solicitud de emparejamiento (si usas el modo de emparejamiento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Las solicitudes de emparejamiento caducan después de 1 hora. Las solicitudes pendientes se limitan a 3 por canal.

  </Step>
</Steps>

<Note>
OpenClaw recomienda ejecutar WhatsApp en un número separado cuando sea posible. (Los metadatos del canal y el flujo de configuración están optimizados para esa configuración, pero también se admiten configuraciones con número personal).
</Note>

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Número dedicado (recomendado)">
    Este es el modo operativo más limpio:

    - identidad de WhatsApp independiente para OpenClaw
    - listas de permitidos de mensajes directos y límites de enrutamiento más claros
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
    El onboarding admite el modo de número personal y escribe una línea base compatible con el chat propio:

    - `dmPolicy: "allowlist"`
    - `allowFrom` incluye tu número personal
    - `selfChatMode: true`

    En tiempo de ejecución, las protecciones de chat propio dependen del número propio enlazado y de `allowFrom`.

  </Accordion>

  <Accordion title="Ámbito del canal solo de WhatsApp Web">
    El canal de la plataforma de mensajería se basa en WhatsApp Web (`Baileys`) en la arquitectura actual de canales de OpenClaw.

    No existe un canal de mensajería de WhatsApp de Twilio separado en el registro integrado de canales de chat.

  </Accordion>
</AccordionGroup>

## Modelo de tiempo de ejecución

- El Gateway controla el socket de WhatsApp y el bucle de reconexión.
- Los envíos salientes requieren un listener activo de WhatsApp para la cuenta de destino.
- Los chats de estado y difusión se ignoran (`@status`, `@broadcast`).
- Los chats directos usan reglas de sesión de mensajes directos (`session.dmScope`; `main` de forma predeterminada agrupa los mensajes directos en la sesión principal del agente).
- Las sesiones de grupo están aisladas (`agent:<agentId>:whatsapp:group:<jid>`).
- El transporte de WhatsApp Web respeta las variables de entorno estándar de proxy en el host del gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` y variantes en minúsculas). Prefiere la configuración de proxy a nivel de host en lugar de configuraciones de proxy de WhatsApp específicas del canal.

## Control de acceso y activación

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.whatsapp.dmPolicy` controla el acceso a chats directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    `allowFrom` acepta números con formato tipo E.164 (normalizados internamente).

    Anulación para varias cuentas: `channels.whatsapp.accounts.<id>.dmPolicy` (y `allowFrom`) tienen prioridad sobre los valores predeterminados a nivel del canal para esa cuenta.

    Detalles del comportamiento en tiempo de ejecución:

    - los emparejamientos se conservan en el almacén de permitidos del canal y se combinan con `allowFrom` configurado
    - si no hay ninguna lista de permitidos configurada, el número propio enlazado se permite de forma predeterminada
    - los mensajes directos salientes `fromMe` nunca se emparejan automáticamente

  </Tab>

  <Tab title="Política de grupos + listas de permitidos">
    El acceso a grupos tiene dos capas:

    1. **Lista de permitidos de pertenencia al grupo** (`channels.whatsapp.groups`)
       - si se omite `groups`, todos los grupos son elegibles
       - si `groups` está presente, actúa como lista de permitidos de grupos (se permite `"*"`)

    2. **Política de remitentes del grupo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: se omite la lista de permitidos de remitentes
       - `allowlist`: el remitente debe coincidir con `groupAllowFrom` (o `*`)
       - `disabled`: bloquea toda la entrada de grupos

    Reserva para la lista de permitidos de remitentes:

    - si `groupAllowFrom` no está configurado, el tiempo de ejecución recurre a `allowFrom` cuando está disponible
    - las listas de permitidos de remitentes se evalúan antes de la activación por mención/respuesta

    Nota: si no existe ningún bloque `channels.whatsapp`, la reserva de política de grupo en tiempo de ejecución es `allowlist` (con un registro de advertencia), incluso si `channels.defaults.groupPolicy` está configurado.

  </Tab>

  <Tab title="Menciones + /activation">
    Las respuestas en grupos requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - menciones explícitas en WhatsApp de la identidad del bot
    - patrones regex de mención configurados (`agents.list[].groupChat.mentionPatterns`, con reserva en `messages.groupChat.mentionPatterns`)
    - detección implícita de respuesta al bot (el remitente de la respuesta coincide con la identidad del bot)

    Nota de seguridad:

    - citar/responder solo satisface la restricción por mención; **no** concede autorización al remitente
    - con `groupPolicy: "allowlist"`, los remitentes que no estén en la lista de permitidos siguen bloqueados aunque respondan al mensaje de un usuario incluido en la lista

    Comando de activación a nivel de sesión:

    - `/activation mention`
    - `/activation always`

    `activation` actualiza el estado de la sesión (no la configuración global). Está restringido al propietario.

  </Tab>
</Tabs>

## Comportamiento con número personal y chat propio

Cuando el número propio enlazado también está presente en `allowFrom`, se activan las protecciones de chat propio de WhatsApp:

- omitir confirmaciones de lectura en turnos de chat propio
- ignorar el comportamiento de activación automática por JID de mención que, de otro modo, te haría ping a ti mismo
- si `messages.responsePrefix` no está configurado, las respuestas de chat propio usan de forma predeterminada `[{identity.name}]` o `[openclaw]`

## Normalización de mensajes y contexto

<AccordionGroup>
  <Accordion title="Sobre de entrada + contexto de respuesta">
    Los mensajes entrantes de WhatsApp se envuelven en el sobre compartido de entrada.

    Si existe una respuesta citada, se añade contexto con esta forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Los campos de metadatos de respuesta también se completan cuando están disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, remitente JID/E.164).

  </Accordion>

  <Accordion title="Marcadores de posición de medios y extracción de ubicación/contacto">
    Los mensajes entrantes solo de medios se normalizan con marcadores de posición como:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Las cargas útiles de ubicación y contacto se normalizan en contexto textual antes del enrutamiento.

  </Accordion>

  <Accordion title="Inyección del historial pendiente de grupos">
    En grupos, los mensajes no procesados se pueden almacenar en búfer e inyectarse como contexto cuando finalmente se activa el bot.

    - límite predeterminado: `50`
    - configuración: `channels.whatsapp.historyLimit`
    - reserva: `messages.groupChat.historyLimit`
    - `0` deshabilita

    Marcadores de inyección:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Confirmaciones de lectura">
    Las confirmaciones de lectura están habilitadas de forma predeterminada para los mensajes entrantes de WhatsApp aceptados.

    Deshabilitar globalmente:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Anulación por cuenta:

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
    - límite predeterminado por fragmento: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - el modo `newline` prefiere límites de párrafo (líneas en blanco) y luego recurre a una fragmentación segura por longitud
  </Accordion>

  <Accordion title="Comportamiento de medios salientes">
    - admite cargas útiles de imagen, video, audio (nota de voz PTT) y documento
    - `audio/ogg` se reescribe como `audio/ogg; codecs=opus` para compatibilidad con notas de voz
    - la reproducción de GIF animados se admite mediante `gifPlayback: true` en envíos de video
    - los subtítulos se aplican al primer elemento multimedia al enviar cargas útiles de respuesta con varios medios
    - la fuente de medios puede ser HTTP(S), `file://` o rutas locales
  </Accordion>

  <Accordion title="Límites de tamaño de medios y comportamiento de reserva">
    - límite de guardado de medios entrantes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - límite de envío de medios salientes: `channels.whatsapp.mediaMaxMb` (predeterminado `50`)
    - las anulaciones por cuenta usan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - las imágenes se optimizan automáticamente (barrido de tamaño/calidad) para ajustarse a los límites
    - si falla el envío de medios, la reserva del primer elemento envía una advertencia de texto en lugar de descartar la respuesta silenciosamente
  </Accordion>
</AccordionGroup>

## Nivel de reacciones

`channels.whatsapp.reactionLevel` controla qué tan ampliamente usa el agente las reacciones emoji en WhatsApp:

| Nivel         | Reacciones de acuse | Reacciones iniciadas por el agente | Descripción                                        |
| ------------- | ------------------- | ---------------------------------- | -------------------------------------------------- |
| `"off"`       | No                  | No                                 | Sin reacciones                                     |
| `"ack"`       | Sí                  | No                                 | Solo reacciones de acuse (acuse previo a respuesta) |
| `"minimal"`   | Sí                  | Sí (conservadoras)                 | Acuse + reacciones del agente con orientación conservadora |
| `"extensive"` | Sí                  | Sí (fomentadas)                    | Acuse + reacciones del agente con orientación fomentada |

Predeterminado: `"minimal"`.

Las anulaciones por cuenta usan `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp admite reacciones de acuse inmediatas al recibir un mensaje entrante mediante `channels.whatsapp.ackReaction`.
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

- se envían inmediatamente después de aceptar la entrada (antes de la respuesta)
- los fallos se registran, pero no bloquean la entrega normal de la respuesta
- el modo de grupo `mentions` reacciona en turnos activados por mención; la activación de grupo `always` actúa como omisión de esta comprobación
- WhatsApp usa `channels.whatsapp.ackReaction` (aquí no se usa el heredado `messages.ackReaction`)

## Varias cuentas y credenciales

<AccordionGroup>
  <Accordion title="Selección de cuenta y valores predeterminados">
    - los ID de cuenta provienen de `channels.whatsapp.accounts`
    - selección de cuenta predeterminada: `default` si existe; en caso contrario, el primer ID de cuenta configurado (ordenado)
    - los ID de cuenta se normalizan internamente para la búsqueda
  </Accordion>

  <Accordion title="Rutas de credenciales y compatibilidad heredada">
    - ruta de autenticación actual: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - archivo de respaldo: `creds.json.bak`
    - la autenticación heredada predeterminada en `~/.openclaw/credentials/` sigue reconociéndose/migrándose para flujos de cuenta predeterminada
  </Accordion>

  <Accordion title="Comportamiento de cierre de sesión">
    `openclaw channels logout --channel whatsapp [--account <id>]` borra el estado de autenticación de WhatsApp de esa cuenta.

    En directorios de autenticación heredados, se conserva `oauth.json` mientras que se eliminan los archivos de autenticación de Baileys.

  </Accordion>
</AccordionGroup>

## Herramientas, acciones y escrituras de configuración

- La compatibilidad con herramientas del agente incluye la acción de reacción de WhatsApp (`react`).
- Controles de acciones:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Las escrituras de configuración iniciadas por el canal están habilitadas de forma predeterminada (deshabilitar mediante `channels.whatsapp.configWrites=false`).

## Solución de problemas

<AccordionGroup>
  <Accordion title="No enlazado (se requiere QR)">
    Síntoma: el estado del canal informa que no está enlazado.

    Solución:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Enlazado pero desconectado / bucle de reconexión">
    Síntoma: cuenta enlazada con desconexiones repetidas o intentos de reconexión.

    Solución:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Si es necesario, vuelve a enlazar con `channels login`.

  </Accordion>

  <Accordion title="No hay listener activo al enviar">
    Los envíos salientes fallan rápidamente cuando no existe un listener activo del gateway para la cuenta de destino.

    Asegúrate de que el gateway esté en ejecución y de que la cuenta esté enlazada.

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran inesperadamente">
    Comprueba en este orden:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entradas de la lista de permitidos de `groups`
    - restricción por mención (`requireMention` + patrones de mención)
    - claves duplicadas en `openclaw.json` (JSON5): las entradas posteriores sobrescriben las anteriores, así que mantén un único `groupPolicy` por ámbito

  </Accordion>

  <Accordion title="Advertencia del tiempo de ejecución de Bun">
    El tiempo de ejecución del gateway de WhatsApp debe usar Node. Bun está marcado como incompatible para una operación estable del gateway de WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts del sistema

WhatsApp admite prompts del sistema de estilo Telegram para grupos y chats directos mediante los mapas `groups` y `direct`.

Jerarquía de resolución para mensajes de grupo:

Primero se determina el mapa `groups` efectivo: si la cuenta define su propio `groups`, reemplaza por completo el mapa raíz `groups` (sin fusión profunda). Luego, la búsqueda del prompt se ejecuta sobre ese único mapa resultante:

1. **Prompt del sistema específico del grupo** (`groups["<groupId>"].systemPrompt`): se usa si la entrada del grupo específico define un `systemPrompt`.
2. **Prompt del sistema comodín del grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada del grupo específico no existe o no define `systemPrompt`.

Jerarquía de resolución para mensajes directos:

Primero se determina el mapa `direct` efectivo: si la cuenta define su propio `direct`, reemplaza por completo el mapa raíz `direct` (sin fusión profunda). Luego, la búsqueda del prompt se ejecuta sobre ese único mapa resultante:

1. **Prompt del sistema específico del directo** (`direct["<peerId>"].systemPrompt`): se usa si la entrada del destinatario específico define un `systemPrompt`.
2. **Prompt del sistema comodín del directo** (`direct["*"].systemPrompt`): se usa cuando la entrada del destinatario específico no existe o no define `systemPrompt`.

Nota: `dms` sigue siendo el contenedor ligero de anulaciones del historial por DM (`dms.<id>.historyLimit`); las anulaciones de prompt viven en `direct`.

**Diferencia con el comportamiento de varias cuentas en Telegram:** en Telegram, el `groups` raíz se suprime intencionadamente para todas las cuentas en una configuración de varias cuentas —incluso para cuentas que no definen su propio `groups`— para evitar que un bot reciba mensajes de grupo de grupos a los que no pertenece. WhatsApp no aplica esta protección: `groups` raíz y `direct` raíz siempre son heredados por las cuentas que no definen una anulación a nivel de cuenta, sin importar cuántas cuentas estén configuradas. En una configuración de WhatsApp con varias cuentas, si quieres prompts de grupo o directos por cuenta, define el mapa completo explícitamente en cada cuenta en lugar de depender de valores predeterminados a nivel raíz.

Comportamiento importante:

- `channels.whatsapp.groups` es tanto un mapa de configuración por grupo como la lista de permitidos de grupos a nivel de chat. En el ámbito raíz o de cuenta, `groups["*"]` significa "todos los grupos están admitidos" para ese ámbito.
- Solo añade un `systemPrompt` comodín de grupo cuando ya quieras que ese ámbito admita todos los grupos. Si aun así quieres que solo un conjunto fijo de ID de grupo sea elegible, no uses `groups["*"]` como valor predeterminado del prompt. En su lugar, repite el prompt en cada entrada de grupo explícitamente incluida en la lista de permitidos.
- La admisión del grupo y la autorización del remitente son comprobaciones separadas. `groups["*"]` amplía el conjunto de grupos que pueden llegar al manejo de grupos, pero por sí solo no autoriza a todos los remitentes de esos grupos. El acceso del remitente sigue controlándose por separado mediante `channels.whatsapp.groupPolicy` y `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` no tiene el mismo efecto secundario para los mensajes directos. `direct["*"]` solo proporciona una configuración predeterminada de chat directo después de que un DM ya haya sido admitido por `dmPolicy` más las reglas de `allowFrom` o del almacén de emparejamiento.

Ejemplo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Úsalo solo si todos los grupos deben admitirse en el ámbito raíz.
        // Se aplica a todas las cuentas que no definan su propio mapa groups.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Se aplica a todas las cuentas que no definan su propio mapa direct.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // Esta cuenta define su propio groups, por lo que el groups raíz se
            // reemplaza por completo. Para conservar un comodín, define "*" explícitamente aquí también.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Úsalo solo si todos los grupos deben admitirse en esta cuenta.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // Esta cuenta define su propio mapa direct, por lo que las entradas direct raíz
            // se reemplazan por completo. Para conservar un comodín, define "*" explícitamente aquí también.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Punteros de referencia de configuración

Referencia principal:

- [Referencia de configuración - WhatsApp](/es/gateway/configuration-reference#whatsapp)

Campos de WhatsApp de alta relevancia:

- acceso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- varias cuentas: `accounts.<id>.enabled`, `accounts.<id>.authDir`, anulaciones a nivel de cuenta
- operaciones: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamiento de sesión: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Seguridad](/es/gateway/security)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Enrutamiento de varios agentes](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
