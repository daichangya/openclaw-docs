---
read_when:
    - Trabajando en las funciones del canal de Discord
summary: Estado de compatibilidad del bot de Discord, capacidades y configuración
title: Discord
x-i18n:
    generated_at: "2026-04-22T04:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613ae39bc4b8c5661cbaab4f70a57af584f296581c3ce54ddaef0feab44e7e42
    source_path: channels/discord.md
    workflow: 15
---

# Discord (API de bot)

Estado: listo para mensajes directos y canales de servidor mediante el gateway oficial de Discord.

<CardGroup cols={3}>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Los mensajes directos de Discord usan el modo de vinculación de forma predeterminada.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/es/tools/slash-commands">
    Comportamiento nativo de comandos y catálogo de comandos.
  </Card>
  <Card title="Solución de problemas de canales" icon="wrench" href="/es/channels/troubleshooting">
    Diagnóstico entre canales y flujo de reparación.
  </Card>
</CardGroup>

## Configuración rápida

Necesitarás crear una nueva aplicación con un bot, añadir el bot a tu servidor y vincularlo con OpenClaw. Recomendamos añadir tu bot a tu propio servidor privado. Si todavía no tienes uno, [crea uno primero](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (elige **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crear una aplicación y un bot de Discord">
    Ve al [Portal para desarrolladores de Discord](https://discord.com/developers/applications) y haz clic en **New Application**. Ponle un nombre como "OpenClaw".

    Haz clic en **Bot** en la barra lateral. Establece el **Username** con el nombre que uses para tu agente de OpenClaw.

  </Step>

  <Step title="Habilitar intents privilegiados">
    Todavía en la página **Bot**, desplázate hacia abajo hasta **Privileged Gateway Intents** y habilita:

    - **Message Content Intent** (obligatorio)
    - **Server Members Intent** (recomendado; obligatorio para listas de permitidos de roles y coincidencia de nombre a ID)
    - **Presence Intent** (opcional; solo necesario para actualizaciones de presencia)

  </Step>

  <Step title="Copiar el token de tu bot">
    Desplázate de nuevo hacia arriba en la página **Bot** y haz clic en **Reset Token**.

    <Note>
    A pesar del nombre, esto genera tu primer token; no se está “restableciendo” nada.
    </Note>

    Copia el token y guárdalo en algún lugar. Este es tu **Bot Token** y lo necesitarás en breve.

  </Step>

  <Step title="Generar una URL de invitación y añadir el bot a tu servidor">
    Haz clic en **OAuth2** en la barra lateral. Vas a generar una URL de invitación con los permisos correctos para añadir el bot a tu servidor.

    Desplázate hacia abajo hasta **OAuth2 URL Generator** y habilita:

    - `bot`
    - `applications.commands`

    Aparecerá una sección **Bot Permissions** debajo. Habilita:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcional)

    Copia la URL generada al final, pégala en tu navegador, selecciona tu servidor y haz clic en **Continue** para conectarlo. Ahora deberías ver tu bot en el servidor de Discord.

  </Step>

  <Step title="Habilitar el modo de desarrollador y recopilar tus ID">
    De vuelta en la app de Discord, necesitas habilitar el modo de desarrollador para poder copiar los ID internos.

    1. Haz clic en **User Settings** (icono de engranaje junto a tu avatar) → **Advanced** → activa **Developer Mode**
    2. Haz clic derecho en el **icono de tu servidor** en la barra lateral → **Copy Server ID**
    3. Haz clic derecho en **tu propio avatar** → **Copy User ID**

    Guarda tu **Server ID** y tu **User ID** junto con tu Bot Token; enviarás los tres a OpenClaw en el siguiente paso.

  </Step>

  <Step title="Permitir mensajes directos de miembros del servidor">
    Para que la vinculación funcione, Discord necesita permitir que tu bot te envíe mensajes directos. Haz clic derecho en el **icono de tu servidor** → **Privacy Settings** → activa **Direct Messages**.

    Esto permite que los miembros del servidor (incluidos los bots) te envíen mensajes directos. Mantén esto habilitado si quieres usar los mensajes directos de Discord con OpenClaw. Si solo planeas usar canales de servidor, puedes desactivar los mensajes directos después de la vinculación.

  </Step>

  <Step title="Configurar de forma segura el token de tu bot (no lo envíes por chat)">
    El token de tu bot de Discord es un secreto (como una contraseña). Configúralo en la máquina que ejecuta OpenClaw antes de enviar mensajes a tu agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Si OpenClaw ya se está ejecutando como un servicio en segundo plano, reinícialo mediante la app de OpenClaw para Mac o deteniendo y reiniciando el proceso `openclaw gateway run`.

  </Step>

  <Step title="Configurar OpenClaw y vincular">

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        Chatea con tu agente de OpenClaw en cualquier canal existente (por ejemplo, Telegram) y díselo. Si Discord es tu primer canal, usa la pestaña de CLI / config en su lugar.

        > "Ya configuré el token de mi bot de Discord en la configuración. Por favor, termina la configuración de Discord con el User ID `<user_id>` y el Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Si prefieres una configuración basada en archivos, establece:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Respaldo por variable de entorno para la cuenta predeterminada:

```bash
DISCORD_BOT_TOKEN=...
```

        Se admiten valores `token` en texto plano. También se admiten valores SecretRef para `channels.discord.token` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Aprobar la primera vinculación por mensaje directo">
    Espera hasta que el gateway esté en ejecución y luego envía un mensaje directo a tu bot en Discord. Responderá con un código de vinculación.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        Envía el código de vinculación a tu agente en tu canal existente:

        > "Aprueba este código de vinculación de Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Los códigos de vinculación caducan después de 1 hora.

    Ahora deberías poder chatear con tu agente en Discord mediante mensaje directo.

  </Step>
</Steps>

<Note>
La resolución de tokens tiene en cuenta la cuenta. Los valores de token de la configuración tienen prioridad sobre el respaldo por variable de entorno. `DISCORD_BOT_TOKEN` solo se usa para la cuenta predeterminada.
Para llamadas salientes avanzadas (acciones de canal/herramienta de mensajes), se usa un `token` explícito por llamada para esa llamada. Esto se aplica a acciones de envío y de lectura/sondeo (por ejemplo, read/search/fetch/thread/pins/permissions). La política de cuenta y la configuración de reintentos siguen viniendo de la cuenta seleccionada en la instantánea activa del runtime.
</Note>

## Recomendado: configurar un espacio de trabajo de servidor

Una vez que los mensajes directos funcionen, puedes configurar tu servidor de Discord como un espacio de trabajo completo donde cada canal tenga su propia sesión de agente con su propio contexto. Esto se recomienda para servidores privados donde solo están tú y tu bot.

<Steps>
  <Step title="Añadir tu servidor a la lista de permitidos de servidores">
    Esto permite que tu agente responda en cualquier canal de tu servidor, no solo en mensajes directos.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        > "Añade mi Server ID de Discord `<server_id>` a la lista de permitidos de servidores"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Permitir respuestas sin @mention">
    De forma predeterminada, tu agente solo responde en canales de servidor cuando se le menciona con @. En un servidor privado, probablemente querrás que responda a todos los mensajes.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        > "Permite que mi agente responda en este servidor sin tener que mencionarlo con @"
      </Tab>
      <Tab title="Config">
        Establece `requireMention: false` en la configuración de tu servidor:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Planificar la memoria en los canales de servidor">
    De forma predeterminada, la memoria a largo plazo (`MEMORY.md`) solo se carga en sesiones de mensajes directos. Los canales de servidor no cargan automáticamente `MEMORY.md`.

    <Tabs>
      <Tab title="Pregúntale a tu agente">
        > "Cuando haga preguntas en canales de Discord, usa memory_search o memory_get si necesitas contexto a largo plazo de `MEMORY.md`."
      </Tab>
      <Tab title="Manual">
        Si necesitas contexto compartido en todos los canales, coloca las instrucciones estables en `AGENTS.md` o `USER.md` (se inyectan en cada sesión). Mantén las notas a largo plazo en `MEMORY.md` y accede a ellas cuando sea necesario con las herramientas de memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ahora crea algunos canales en tu servidor de Discord y empieza a chatear. Tu agente puede ver el nombre del canal, y cada canal tiene su propia sesión aislada, así que puedes configurar `#coding`, `#home`, `#research` o lo que mejor se adapte a tu flujo de trabajo.

## Modelo de runtime

- El Gateway es propietario de la conexión de Discord.
- El enrutamiento de respuestas es determinista: las respuestas entrantes de Discord vuelven a Discord.
- De forma predeterminada (`session.dmScope=main`), los chats directos comparten la sesión principal del agente (`agent:main:main`).
- Los canales de servidor son claves de sesión aisladas (`agent:<agentId>:discord:channel:<channelId>`).
- Los mensajes directos grupales se ignoran de forma predeterminada (`channels.discord.dm.groupEnabled=false`).
- Los comandos slash nativos se ejecutan en sesiones de comandos aisladas (`agent:<agentId>:discord:slash:<userId>`), mientras siguen transportando `CommandTargetSessionKey` a la sesión de conversación enrutada.

## Canales de foro

Los canales de foro y multimedia de Discord solo aceptan publicaciones en hilos. OpenClaw admite dos formas de crearlos:

- Envía un mensaje al padre del foro (`channel:<forumId>`) para crear automáticamente un hilo. El título del hilo usa la primera línea no vacía de tu mensaje.
- Usa `openclaw message thread create` para crear un hilo directamente. No pases `--message-id` para canales de foro.

Ejemplo: enviar al padre del foro para crear un hilo

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Ejemplo: crear explícitamente un hilo de foro

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Los padres de foro no aceptan componentes de Discord. Si necesitas componentes, envía al propio hilo (`channel:<threadId>`).

## Componentes interactivos

OpenClaw admite contenedores de componentes v2 de Discord para mensajes del agente. Usa la herramienta de mensajes con una carga útil `components`. Los resultados de interacción se enrutan de vuelta al agente como mensajes entrantes normales y siguen la configuración existente de Discord `replyToMode`.

Bloques compatibles:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Las filas de acciones permiten hasta 5 botones o un único menú de selección
- Tipos de selección: `string`, `user`, `role`, `mentionable`, `channel`

De forma predeterminada, los componentes son de un solo uso. Establece `components.reusable=true` para permitir que botones, selectores y formularios se usen varias veces hasta que caduquen.

Para restringir quién puede hacer clic en un botón, establece `allowedUsers` en ese botón (ID de usuario de Discord, etiquetas o `*`). Cuando está configurado, los usuarios que no coincidan reciben una denegación efímera.

Los comandos slash `/model` y `/models` abren un selector interactivo de modelos con menús desplegables de proveedor y modelo, además de un paso de envío. La respuesta del selector es efímera y solo el usuario que lo invoca puede usarla.

Archivos adjuntos:

- Los bloques `file` deben apuntar a una referencia de adjunto (`attachment://<filename>`)
- Proporciona el adjunto mediante `media`/`path`/`filePath` (archivo único); usa `media-gallery` para varios archivos
- Usa `filename` para reemplazar el nombre de carga cuando deba coincidir con la referencia de adjunto

Formularios modales:

- Añade `components.modal` con hasta 5 campos
- Tipos de campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw añade automáticamente un botón activador

Ejemplo:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Texto alternativo opcional",
  components: {
    reusable: true,
    text: "Elige una ruta",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Aprobar",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Rechazar", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Elige una opción",
          options: [
            { label: "Opción A", value: "a" },
            { label: "Opción B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Detalles",
      triggerLabel: "Abrir formulario",
      fields: [
        { type: "text", label: "Solicitante" },
        {
          type: "select",
          label: "Prioridad",
          options: [
            { label: "Baja", value: "low" },
            { label: "Alta", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.discord.dmPolicy` controla el acceso a mensajes directos (heredado: `channels.discord.dm.policy`):

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `channels.discord.allowFrom` incluya `"*"`; heredado: `channels.discord.dm.allowFrom`)
    - `disabled`

    Si la política de mensajes directos no está abierta, los usuarios desconocidos se bloquean (o se les solicita vinculación en modo `pairing`).

    Precedencia de múltiples cuentas:

    - `channels.discord.accounts.default.allowFrom` se aplica solo a la cuenta `default`.
    - Las cuentas con nombre heredan `channels.discord.allowFrom` cuando su propio `allowFrom` no está configurado.
    - Las cuentas con nombre no heredan `channels.discord.accounts.default.allowFrom`.

    Formato de destino de mensajes directos para la entrega:

    - `user:<id>`
    - mención `<@id>`

    Los ID numéricos sin prefijo son ambiguos y se rechazan a menos que se proporcione un tipo de destino de usuario/canal explícito.

  </Tab>

  <Tab title="Política de servidor">
    El manejo de servidores se controla con `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La base segura cuando existe `channels.discord` es `allowlist`.

    Comportamiento de `allowlist`:

    - el servidor debe coincidir con `channels.discord.guilds` (se prefiere `id`, se acepta slug)
    - listas de remitentes opcionales: `users` (se recomiendan ID estables) y `roles` (solo ID de rol); si se configura cualquiera de las dos, los remitentes están permitidos cuando coinciden con `users` O `roles`
    - la coincidencia directa por nombre/etiqueta está desactivada de forma predeterminada; habilita `channels.discord.dangerouslyAllowNameMatching: true` solo como modo de compatibilidad de emergencia
    - se admiten nombres/etiquetas para `users`, pero los ID son más seguros; `openclaw security audit` avisa cuando se usan entradas de nombre/etiqueta
    - si un servidor tiene `channels` configurado, los canales no listados se deniegan
    - si un servidor no tiene un bloque `channels`, se permiten todos los canales de ese servidor incluido en la lista de permitidos

    Ejemplo:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Si solo configuras `DISCORD_BOT_TOKEN` y no creas un bloque `channels.discord`, el valor de respaldo en runtime es `groupPolicy="allowlist"` (con una advertencia en los registros), incluso si `channels.defaults.groupPolicy` es `open`.

  </Tab>

  <Tab title="Menciones y mensajes directos grupales">
    Los mensajes de servidor requieren mención de forma predeterminada.

    La detección de menciones incluye:

    - mención explícita del bot
    - patrones de mención configurados (`agents.list[].groupChat.mentionPatterns`, con respaldo en `messages.groupChat.mentionPatterns`)
    - comportamiento implícito de responder al bot en los casos compatibles

    `requireMention` se configura por servidor/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` opcionalmente descarta mensajes que mencionan a otro usuario/rol pero no al bot (excluyendo @everyone/@here).

    Mensajes directos grupales:

    - predeterminado: ignorados (`dm.groupEnabled=false`)
    - lista de permitidos opcional mediante `dm.groupChannels` (ID de canal o slugs)

  </Tab>
</Tabs>

### Enrutamiento de agentes basado en roles

Usa `bindings[].match.roles` para enrutar miembros de servidores de Discord a distintos agentes por ID de rol. Los bindings basados en roles aceptan solo ID de rol y se evalúan después de los bindings de peer o parent-peer y antes de los bindings solo de servidor. Si un binding también establece otros campos de coincidencia (por ejemplo `peer` + `guildId` + `roles`), todos los campos configurados deben coincidir.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Configuración del Portal para desarrolladores

<AccordionGroup>
  <Accordion title="Crear aplicación y bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copia el token del bot

  </Accordion>

  <Accordion title="Intents privilegiados">
    En **Bot -> Privileged Gateway Intents**, habilita:

    - Message Content Intent
    - Server Members Intent (recomendado)

    Presence Intent es opcional y solo se requiere si quieres recibir actualizaciones de presencia. Configurar la presencia del bot (`setPresence`) no requiere habilitar actualizaciones de presencia para miembros.

  </Accordion>

  <Accordion title="Scopes de OAuth y permisos base">
    Generador de URL de OAuth:

    - scopes: `bot`, `applications.commands`

    Permisos base típicos:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opcional)

    Evita `Administrator` a menos que sea explícitamente necesario.

  </Accordion>

  <Accordion title="Copiar ID">
    Habilita el modo de desarrollador de Discord y luego copia:

    - ID del servidor
    - ID del canal
    - ID del usuario

    Prefiere ID numéricos en la configuración de OpenClaw para auditorías y sondeos fiables.

  </Accordion>
</AccordionGroup>

## Comandos nativos y autenticación de comandos

- `commands.native` usa `"auto"` de forma predeterminada y está habilitado para Discord.
- Anulación por canal: `channels.discord.commands.native`.
- `commands.native=false` borra explícitamente los comandos nativos de Discord registrados anteriormente.
- La autenticación de comandos nativos usa las mismas listas de permitidos/políticas de Discord que el manejo normal de mensajes.
- Los comandos pueden seguir siendo visibles en la interfaz de Discord para usuarios no autorizados; la ejecución sigue aplicando la autenticación de OpenClaw y devuelve "no autorizado".

Consulta [Comandos slash](/es/tools/slash-commands) para ver el catálogo y el comportamiento de los comandos.

Configuración predeterminada de comandos slash:

- `ephemeral: true`

## Detalles de las funciones

<AccordionGroup>
  <Accordion title="Etiquetas de respuesta y respuestas nativas">
    Discord admite etiquetas de respuesta en la salida del agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controlado por `channels.discord.replyToMode`:

    - `off` (predeterminado)
    - `first`
    - `all`
    - `batched`

    Nota: `off` desactiva el encadenamiento implícito de respuestas. Las etiquetas explícitas `[[reply_to_*]]` siguen respetándose.
    `first` siempre adjunta la referencia implícita de respuesta nativa al primer mensaje saliente de Discord del turno.
    `batched` solo adjunta la referencia implícita de respuesta nativa de Discord cuando el
    turno entrante fue un lote con debounce de varios mensajes. Esto es útil
    cuando quieres respuestas nativas principalmente para chats ambiguos con ráfagas, no para cada
    turno de un solo mensaje.

    Los ID de mensajes aparecen en el contexto/historial para que los agentes puedan apuntar a mensajes específicos.

  </Accordion>

  <Accordion title="Vista previa de transmisión en vivo">
    OpenClaw puede transmitir respuestas en borrador enviando un mensaje temporal y editándolo a medida que llega el texto.

    - `channels.discord.streaming` controla la transmisión de vista previa (`off` | `partial` | `block` | `progress`, predeterminado: `off`).
    - El valor predeterminado sigue siendo `off` porque las ediciones de vista previa de Discord pueden alcanzar rápidamente los límites de velocidad, especialmente cuando varios bots o gateways comparten la misma cuenta o el mismo tráfico de servidor.
    - `progress` se acepta para mantener la consistencia entre canales y se asigna a `partial` en Discord.
    - `channels.discord.streamMode` es un alias heredado y se migra automáticamente.
    - `partial` edita un único mensaje de vista previa a medida que llegan tokens.
    - `block` emite fragmentos del tamaño del borrador (usa `draftChunk` para ajustar tamaño y puntos de corte).
    - Los mensajes multimedia, de error y las respuestas finales explícitas cancelan las ediciones pendientes de vista previa sin vaciar un borrador temporal antes de la entrega normal.
    - `streaming.preview.toolProgress` controla si las actualizaciones de herramientas/progreso reutilizan el mismo mensaje de vista previa del borrador (predeterminado: `true`). Establece `false` para mantener mensajes separados de herramientas/progreso.

    Ejemplo:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Valores predeterminados de fragmentación en modo `block` (limitados a `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    La transmisión de vista previa es solo para texto; las respuestas multimedia vuelven a la entrega normal.

    Nota: la transmisión de vista previa es independiente de la transmisión por bloques. Cuando la transmisión por bloques está explícitamente
    habilitada para Discord, OpenClaw omite la transmisión de vista previa para evitar una doble transmisión.

  </Accordion>

  <Accordion title="Historial, contexto y comportamiento de hilos">
    Contexto del historial de servidores:

    - `channels.discord.historyLimit` predeterminado `20`
    - respaldo: `messages.groupChat.historyLimit`
    - `0` lo desactiva

    Controles del historial de mensajes directos:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamiento de hilos:

    - Los hilos de Discord se enrutan como sesiones de canal
    - Los metadatos del hilo padre se pueden usar para la vinculación con la sesión padre
    - La configuración del hilo hereda la configuración del canal padre a menos que exista una entrada específica para el hilo

    Los temas de canal se inyectan como contexto **no confiable** (no como prompt del sistema).
    El contexto de respuestas y mensajes citados actualmente permanece tal como se recibe.
    Las listas de permitidos de Discord controlan principalmente quién puede activar al agente, no son un límite completo de redacción de contexto suplementario.

  </Accordion>

  <Accordion title="Sesiones vinculadas a hilos para subagentes">
    Discord puede vincular un hilo a un destino de sesión para que los mensajes posteriores en ese hilo sigan enrutándose a la misma sesión (incluidas las sesiones de subagentes).

    Comandos:

    - `/focus <target>` vincula el hilo actual/nuevo a un destino de subagente/sesión
    - `/unfocus` elimina la vinculación actual del hilo
    - `/agents` muestra ejecuciones activas y el estado de vinculación
    - `/session idle <duration|off>` inspecciona/actualiza la desvinculación automática por inactividad para bindings enfocados
    - `/session max-age <duration|off>` inspecciona/actualiza la antigüedad máxima estricta para bindings enfocados

    Configuración:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Notas:

    - `session.threadBindings.*` establece valores predeterminados globales.
    - `channels.discord.threadBindings.*` reemplaza el comportamiento de Discord.
    - `spawnSubagentSessions` debe ser true para crear/vincular automáticamente hilos para `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` debe ser true para crear/vincular automáticamente hilos para ACP (`/acp spawn ... --thread ...` o `sessions_spawn({ runtime: "acp", thread: true })`).
    - Si los bindings de hilo están desactivados para una cuenta, `/focus` y las operaciones relacionadas de vinculación de hilos no están disponibles.

    Consulta [Subagentes](/es/tools/subagents), [Agentes ACP](/es/tools/acp-agents) y [Referencia de configuración](/es/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Bindings persistentes de canal ACP">
    Para espacios de trabajo ACP estables y "siempre activos", configura bindings ACP tipados de nivel superior dirigidos a conversaciones de Discord.

    Ruta de configuración:

    - `bindings[]` con `type: "acp"` y `match.channel: "discord"`

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
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Notas:

    - `/acp spawn codex --bind here` vincula el canal o hilo actual de Discord en el lugar y mantiene los mensajes futuros enrutados a la misma sesión ACP.
    - Eso aún puede significar "iniciar una sesión ACP nueva de Codex", pero no crea por sí solo un nuevo hilo de Discord. El canal existente sigue siendo la superficie de chat.
    - Codex aún puede ejecutarse en su propio `cwd` o espacio de trabajo backend en disco. Ese espacio de trabajo es estado de runtime, no un hilo de Discord.
    - Los mensajes de hilo pueden heredar el binding ACP del canal padre.
    - En un canal o hilo vinculado, `/new` y `/reset` restablecen la misma sesión ACP en el lugar.
    - Los bindings temporales de hilo siguen funcionando y pueden reemplazar la resolución de destino mientras están activos.
    - `spawnAcpSessions` solo es obligatorio cuando OpenClaw necesita crear/vincular un hilo hijo mediante `--thread auto|here`. No es obligatorio para `/acp spawn ... --bind here` en el canal actual.

    Consulta [Agentes ACP](/es/tools/acp-agents) para ver los detalles del comportamiento de bindings.

  </Accordion>

  <Accordion title="Notificaciones de reacciones">
    Modo de notificación de reacciones por servidor:

    - `off`
    - `own` (predeterminado)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Los eventos de reacción se convierten en eventos del sistema y se adjuntan a la sesión de Discord enrutada.

  </Accordion>

  <Accordion title="Reacciones de confirmación">
    `ackReaction` envía un emoji de confirmación mientras OpenClaw procesa un mensaje entrante.

    Orden de resolución:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - emoji de respaldo de la identidad del agente (`agents.list[].identity.emoji`, o "👀" en caso contrario)

    Notas:

    - Discord acepta emoji Unicode o nombres de emoji personalizados.
    - Usa `""` para desactivar la reacción en un canal o cuenta.

  </Accordion>

  <Accordion title="Escrituras de configuración">
    Las escrituras de configuración iniciadas desde el canal están habilitadas de forma predeterminada.

    Esto afecta a los flujos `/config set|unset` (cuando las funciones de comandos están habilitadas).

    Desactivar:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy del Gateway">
    Enruta el tráfico WebSocket del gateway de Discord y las búsquedas REST de inicio (ID de aplicación + resolución de lista de permitidos) a través de un proxy HTTP(S) con `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Reemplazo por cuenta:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Compatibilidad con PluralKit">
    Habilita la resolución de PluralKit para asignar mensajes enviados mediante proxy a la identidad del miembro del sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // opcional; necesario para sistemas privados
      },
    },
  },
}
```

    Notas:

    - las listas de permitidos pueden usar `pk:<memberId>`
    - los nombres para mostrar de los miembros se comparan por nombre/slug solo cuando `channels.discord.dangerouslyAllowNameMatching: true`
    - las búsquedas usan el ID del mensaje original y están limitadas por ventana de tiempo
    - si la búsqueda falla, los mensajes enviados mediante proxy se tratan como mensajes de bot y se descartan a menos que `allowBots=true`

  </Accordion>

  <Accordion title="Configuración de presencia">
    Las actualizaciones de presencia se aplican cuando estableces un campo de estado o actividad, o cuando habilitas la presencia automática.

    Ejemplo solo con estado:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Ejemplo de actividad (el estado personalizado es el tipo de actividad predeterminado):

```json5
{
  channels: {
    discord: {
      activity: "Tiempo de concentración",
      activityType: 4,
    },
  },
}
```

    Ejemplo de transmisión:

```json5
{
  channels: {
    discord: {
      activity: "Programación en vivo",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mapa de tipos de actividad:

    - 0: Playing
    - 1: Streaming (requiere `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (usa el texto de la actividad como estado; el emoji es opcional)
    - 5: Competing

    Ejemplo de presencia automática (señal de estado del runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token agotado",
      },
    },
  },
}
```

    La presencia automática asigna la disponibilidad del runtime al estado de Discord: healthy => online, degraded o unknown => idle, exhausted o unavailable => dnd. Reemplazos de texto opcionales:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (admite el marcador `{reason}`)

  </Accordion>

  <Accordion title="Aprobaciones en Discord">
    Discord admite el manejo de aprobaciones mediante botones en mensajes directos y opcionalmente puede publicar solicitudes de aprobación en el canal de origen.

    Ruta de configuración:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opcional; usa `commands.ownerAllowFrom` como respaldo cuando sea posible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord habilita automáticamente las aprobaciones nativas de ejecución cuando `enabled` no está configurado o es `"auto"` y se puede resolver al menos un aprobador, ya sea desde `execApprovals.approvers` o desde `commands.ownerAllowFrom`. Discord no infiere aprobadores de ejecución a partir de `allowFrom` del canal, `dm.allowFrom` heredado o `defaultTo` de mensaje directo. Establece `enabled: false` para desactivar Discord explícitamente como cliente nativo de aprobaciones.

    Cuando `target` es `channel` o `both`, la solicitud de aprobación es visible en el canal. Solo los aprobadores resueltos pueden usar los botones; los demás usuarios reciben una denegación efímera. Las solicitudes de aprobación incluyen el texto del comando, así que habilita la entrega en canal solo en canales de confianza. Si no se puede derivar el ID del canal a partir de la clave de sesión, OpenClaw usa mensajes directos como respaldo.

    Discord también muestra los botones de aprobación compartidos usados por otros canales de chat. El adaptador nativo de Discord añade principalmente el enrutamiento de mensajes directos a aprobadores y la difusión a canales.
    Cuando esos botones están presentes, son la experiencia principal de aprobación; OpenClaw
    solo debe incluir un comando manual `/approve` cuando el resultado de la herramienta diga
    que las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta.

    La autenticación del Gateway para este manejador usa el mismo contrato compartido de resolución de credenciales que otros clientes del Gateway:

    - autenticación local con prioridad para entorno (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` y luego `gateway.auth.*`)
    - en modo local, `gateway.remote.*` puede usarse como respaldo solo cuando `gateway.auth.*` no está configurado; los SecretRef locales configurados pero no resueltos fallan de forma cerrada
    - compatibilidad con modo remoto mediante `gateway.remote.*` cuando corresponda
    - los reemplazos de URL son seguros respecto a reemplazos: los reemplazos de CLI no reutilizan credenciales implícitas, y los reemplazos de entorno usan solo credenciales del entorno

    Comportamiento de resolución de aprobaciones:

    - Los ID con prefijo `plugin:` se resuelven mediante `plugin.approval.resolve`.
    - Los demás ID se resuelven mediante `exec.approval.resolve`.
    - Discord no hace aquí un salto adicional de respaldo de exec a plugin; el
      prefijo del ID decide qué método del gateway llama.

    Las aprobaciones de ejecución caducan después de 30 minutos de forma predeterminada. Si las aprobaciones fallan con
    ID de aprobación desconocidos, verifica la resolución de aprobadores, la habilitación de funciones y
    que el tipo de ID de aprobación entregado coincida con la solicitud pendiente.

    Documentación relacionada: [Aprobaciones de ejecución](/es/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Herramientas y controles de acciones

Las acciones de mensajes de Discord incluyen mensajería, administración de canales, moderación, presencia y acciones de metadatos.

Ejemplos principales:

- mensajería: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reacciones: `react`, `reactions`, `emojiList`
- moderación: `timeout`, `kick`, `ban`
- presencia: `setPresence`

La acción `event-create` acepta un parámetro `image` opcional (URL o ruta de archivo local) para establecer la imagen de portada del evento programado.

Los controles de acciones están en `channels.discord.actions.*`.

Comportamiento predeterminado de los controles:

| Grupo de acciones                                                                                                                                                         | Predeterminado |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | habilitado     |
| roles                                                                                                                                                                    | deshabilitado  |
| moderation                                                                                                                                                               | deshabilitado  |
| presence                                                                                                                                                                 | deshabilitado  |

## UI de componentes v2

OpenClaw usa componentes v2 de Discord para aprobaciones de ejecución y marcadores entre contextos. Las acciones de mensajes de Discord también pueden aceptar `components` para UI personalizada (avanzado; requiere construir una carga útil de componentes mediante la herramienta de Discord), mientras que los `embeds` heredados siguen disponibles pero no se recomiendan.

- `channels.discord.ui.components.accentColor` establece el color de acento usado por los contenedores de componentes de Discord (hex).
- Configúralo por cuenta con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` se ignora cuando hay componentes v2 presentes.

Ejemplo:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Canales de voz

OpenClaw puede unirse a canales de voz de Discord para conversaciones continuas en tiempo real. Esto es independiente de los archivos adjuntos de mensajes de voz.

Requisitos:

- Habilita los comandos nativos (`commands.native` o `channels.discord.commands.native`).
- Configura `channels.discord.voice`.
- El bot necesita permisos de Connect + Speak en el canal de voz de destino.

Usa el comando nativo exclusivo de Discord `/vc join|leave|status` para controlar las sesiones. El comando usa el agente predeterminado de la cuenta y sigue las mismas reglas de lista de permitidos y política de grupo que otros comandos de Discord.

Ejemplo de unión automática:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Notas:

- `voice.tts` reemplaza a `messages.tts` solo para la reproducción de voz.
- Los turnos de transcripción de voz derivan el estado de propietario a partir de Discord `allowFrom` (o `dm.allowFrom`); los hablantes que no sean propietarios no pueden acceder a herramientas exclusivas para propietarios (por ejemplo `gateway` y `cron`).
- La voz está habilitada de forma predeterminada; establece `channels.discord.voice.enabled=false` para desactivarla.
- `voice.daveEncryption` y `voice.decryptionFailureTolerance` se transfieren a las opciones de unión de `@discordjs/voice`.
- Los valores predeterminados de `@discordjs/voice` son `daveEncryption=true` y `decryptionFailureTolerance=24` si no se configuran.
- OpenClaw también supervisa fallos de descifrado de recepción y se recupera automáticamente saliendo y volviendo a unirse al canal de voz después de fallos repetidos en una ventana corta.
- Si los registros de recepción muestran repetidamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, esto puede ser el error de recepción ascendente de `@discordjs/voice` registrado en [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Mensajes de voz

Los mensajes de voz de Discord muestran una vista previa de forma de onda y requieren audio OGG/Opus más metadatos. OpenClaw genera automáticamente la forma de onda, pero necesita que `ffmpeg` y `ffprobe` estén disponibles en el host del gateway para inspeccionar y convertir archivos de audio.

Requisitos y restricciones:

- Proporciona una **ruta de archivo local** (las URL se rechazan).
- Omite el contenido de texto (Discord no permite texto + mensaje de voz en la misma carga útil).
- Se acepta cualquier formato de audio; OpenClaw lo convierte a OGG/Opus cuando es necesario.

Ejemplo:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="Se usaron intents no permitidos o el bot no ve mensajes del servidor">

    - habilita Message Content Intent
    - habilita Server Members Intent cuando dependas de la resolución de usuario/miembro
    - reinicia el gateway después de cambiar los intents

  </Accordion>

  <Accordion title="Mensajes del servidor bloqueados inesperadamente">

    - verifica `groupPolicy`
    - verifica la lista de permitidos del servidor en `channels.discord.guilds`
    - si existe el mapa `channels` del servidor, solo se permiten los canales listados
    - verifica el comportamiento de `requireMention` y los patrones de mención

    Comprobaciones útiles:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention es false pero sigue bloqueado">
    Causas comunes:

    - `groupPolicy="allowlist"` sin una lista de permitidos coincidente de servidor/canal
    - `requireMention` configurado en el lugar equivocado (debe estar en `channels.discord.guilds` o en la entrada del canal)
    - remitente bloqueado por la lista de permitidos `users` del servidor/canal

  </Accordion>

  <Accordion title="Los manejadores de larga duración expiran o duplican respuestas">

    Registros típicos:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Control de presupuesto del listener:

    - cuenta única: `channels.discord.eventQueue.listenerTimeout`
    - múltiples cuentas: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Control de tiempo de espera de ejecución del worker:

    - cuenta única: `channels.discord.inboundWorker.runTimeoutMs`
    - múltiples cuentas: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - predeterminado: `1800000` (30 minutos); establece `0` para desactivar

    Base recomendada:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Usa `eventQueue.listenerTimeout` para la configuración lenta del listener y `inboundWorker.runTimeoutMs`
    solo si quieres una válvula de seguridad separada para turnos de agente en cola.

  </Accordion>

  <Accordion title="Desajustes en la auditoría de permisos">
    Las comprobaciones de permisos de `channels status --probe` solo funcionan para ID numéricos de canal.

    Si usas claves slug, la coincidencia en runtime aún puede funcionar, pero el sondeo no puede verificar completamente los permisos.

  </Accordion>

  <Accordion title="Problemas de mensajes directos y vinculación">

    - mensajes directos desactivados: `channels.discord.dm.enabled=false`
    - política de mensajes directos desactivada: `channels.discord.dmPolicy="disabled"` (heredado: `channels.discord.dm.policy`)
    - esperando aprobación de vinculación en modo `pairing`

  </Accordion>

  <Accordion title="Bucles de bot a bot">
    De forma predeterminada, los mensajes creados por bots se ignoran.

    Si configuras `channels.discord.allowBots=true`, usa reglas estrictas de mención y lista de permitidos para evitar comportamiento en bucle.
    Prefiere `channels.discord.allowBots="mentions"` para aceptar solo mensajes de bots que mencionen al bot.

  </Accordion>

  <Accordion title="La voz STT se pierde con DecryptionFailed(...)">

    - mantén OpenClaw actualizado (`openclaw update`) para que esté presente la lógica de recuperación de recepción de voz de Discord
    - confirma `channels.discord.voice.daveEncryption=true` (predeterminado)
    - comienza con `channels.discord.voice.decryptionFailureTolerance=24` (predeterminado ascendente) y ajusta solo si es necesario
    - vigila los registros en busca de:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si los fallos continúan después de volver a unirse automáticamente, recopila los registros y compáralos con [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Punteros de referencia de configuración

Referencia principal:

- [Referencia de configuración - Discord](/es/gateway/configuration-reference#discord)

Campos de Discord de alta señal:

- inicio/autenticación: `enabled`, `token`, `accounts.*`, `allowBots`
- política: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- cola de eventos: `eventQueue.listenerTimeout` (presupuesto del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker entrante: `inboundWorker.runTimeoutMs`
- respuesta/historial: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- transmisión: `streaming` (alias heredado: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- multimedia/reintento: `mediaMaxMb`, `retry`
  - `mediaMaxMb` limita las subidas salientes a Discord (predeterminado: `100MB`)
- acciones: `actions.*`
- presencia: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funciones: `threadBindings`, `bindings[]` de nivel superior (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Seguridad y operaciones

- Trata los tokens del bot como secretos (`DISCORD_BOT_TOKEN` preferido en entornos supervisados).
- Otorga los permisos mínimos necesarios en Discord.
- Si el estado o despliegue de comandos está obsoleto, reinicia el gateway y vuelve a comprobar con `openclaw channels status --probe`.

## Relacionado

- [Vinculación](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Seguridad](/es/gateway/security)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Solución de problemas](/es/channels/troubleshooting)
- [Comandos slash](/es/tools/slash-commands)
