---
read_when:
    - Configurar la compatibilidad con iMessage
    - Depurar el envío/la recepción de iMessage
summary: Compatibilidad heredada con iMessage mediante imsg (JSON-RPC sobre stdio). Las configuraciones nuevas deben usar BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-22T04:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9cc5a0bd4fbc7ff6f792e737bc4302a67f9ab6aa8231ff6f751fe6d732ca5d
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (heredado: imsg)

<Warning>
Para las nuevas implementaciones de iMessage, usa <a href="/es/channels/bluebubbles">BlueBubbles</a>.

La integración `imsg` es heredada y puede eliminarse en una versión futura.
</Warning>

Estado: integración heredada de CLI externa. Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC sobre stdio (sin daemon/puerto independiente).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recomendado)" icon="message-circle" href="/es/channels/bluebubbles">
    Ruta preferida de iMessage para configuraciones nuevas.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de iMessage usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Referencia de configuración" icon="settings" href="/es/gateway/configuration-reference#imessage">
    Referencia completa de campos de iMessage.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Mac local (ruta rápida)">
    <Steps>
      <Step title="Instala y verifica imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Inicia Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Aprueba el primer emparejamiento de mensaje directo (`dmPolicy` predeterminado)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Las solicitudes de emparejamiento vencen después de 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto por SSH">
    OpenClaw solo requiere un `cliPath` compatible con stdio, por lo que puedes hacer que `cliPath` apunte a un script contenedor que use SSH hacia un Mac remoto y ejecute `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuración recomendada cuando los adjuntos están habilitados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // usado para recuperar adjuntos con SCP
      includeAttachments: true,
      // Opcional: reemplaza las raíces de adjuntos permitidas.
      // Los valores predeterminados incluyen /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` no está configurado, OpenClaw intenta detectarlo automáticamente analizando el script contenedor SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones de SSH).
    OpenClaw usa verificación estricta de clave de host para SCP, por lo que la clave de host del relay ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de adjuntos se validan frente a las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Messages debe haber iniciado sesión en el Mac que ejecuta `imsg`.
- Se requiere Acceso total al disco para el contexto de proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Messages).
- Se requiere permiso de Automatización para enviar mensajes mediante Messages.app.

<Tip>
Los permisos se conceden por contexto de proceso. Si Gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecuta un comando interactivo una sola vez en ese mismo contexto para activar las solicitudes:

```bash
imsg chats --limit 1
# o
imsg send <handle> "test"
```

</Tip>

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos pueden ser identificadores o destinos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupos + menciones">
    `channels.imessage.groupPolicy` controla el manejo de grupos:

    - `allowlist` (predeterminado cuando está configurado)
    - `open`
    - `disabled`

    Lista de permitidos de remitentes de grupo: `channels.imessage.groupAllowFrom`.

    Reserva en tiempo de ejecución: si `groupAllowFrom` no está configurado, las comprobaciones de remitentes de grupos de iMessage recurren a `allowFrom` cuando está disponible.
    Nota de tiempo de ejecución: si `channels.imessage` falta por completo, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté configurado).

    Restricción por menciones para grupos:

    - iMessage no tiene metadatos nativos de menciones
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, con reserva en `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, no se puede aplicar la restricción por menciones

    Los comandos de control de remitentes autorizados pueden omitir la restricción por menciones en grupos.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los mensajes directos usan enrutamiento directo; los grupos usan enrutamiento de grupo.
    - Con el valor predeterminado `session.dmScope=main`, los mensajes directos de iMessage se agrupan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando los metadatos del canal/destino de origen.

    Comportamiento de hilos tipo grupo:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente en `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (restricción de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Enlaces de conversación de ACP

Los chats heredados de iMessage también pueden vincularse a sesiones de ACP.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del mensaje directo o del chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión de ACP creada.
- `/new` y `/reset` restablecen en el lugar la misma sesión de ACP vinculada.
- `/acp close` cierra la sesión de ACP y elimina el vínculo.

Se admiten vínculos persistentes configurados mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- identificador de mensaje directo normalizado como `+15555550123` o `user@example.com`
- `chat_id:<id>` (recomendado para vínculos de grupo estables)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

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
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Consulta [ACP Agents](/es/tools/acp-agents) para ver el comportamiento compartido de los vínculos de ACP.

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Usuario dedicado de bot en macOS (identidad de iMessage separada)">
    Usa un Apple ID y un usuario de macOS dedicados para que el tráfico del bot quede aislado de tu perfil personal de Messages.

    Flujo típico:

    1. Crea o inicia sesión en un usuario dedicado de macOS.
    2. Inicia sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un contenedor SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Haz que `channels.imessage.accounts.<id>.cliPath` y `.dbPath` apunten al perfil de ese usuario.

    La primera ejecución puede requerir aprobaciones en la interfaz gráfica (Automatización + Acceso total al disco) en la sesión de ese usuario del bot.

  </Accordion>

  <Accordion title="Mac remoto por Tailscale (ejemplo)">
    Topología habitual:

    - Gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecuta en un Mac dentro de tu tailnet
    - el contenedor `cliPath` usa SSH para ejecutar `imsg`
    - `remoteHost` permite recuperar adjuntos con SCP

    Ejemplo:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Usa claves SSH para que tanto SSH como SCP no sean interactivos.
    Asegúrate de que primero se confíe en la clave del host (por ejemplo `ssh bot@mac-mini.tailnet-1234.ts.net`) para que se complete `known_hosts`.

  </Accordion>

  <Accordion title="Patrón de varias cuentas">
    iMessage admite configuración por cuenta en `channels.imessage.accounts`.

    Cada cuenta puede reemplazar campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ajustes de historial y listas de permitidos de raíces de adjuntos.

  </Accordion>
</AccordionGroup>

## Multimedia, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Adjuntos y multimedia">
    - la ingesta de adjuntos entrantes es opcional: `channels.imessage.includeAttachments`
    - las rutas de adjuntos remotos pueden recuperarse mediante SCP cuando `remoteHost` está configurado
    - las rutas de adjuntos deben coincidir con las raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - patrón de raíz predeterminado: `/Users/*/Library/Messages/Attachments`
    - SCP usa verificación estricta de clave de host (`StrictHostKeyChecking=yes`)
    - el tamaño de multimedia saliente usa `channels.imessage.mediaMaxMb` (predeterminado: 16 MB)
  </Accordion>

  <Accordion title="Fragmentación saliente">
    - límite de fragmento de texto: `channels.imessage.textChunkLimit` (predeterminado: 4000)
    - modo de fragmentación: `channels.imessage.chunkMode`
      - `length` (predeterminado)
      - `newline` (división priorizando párrafos)
  </Accordion>

  <Accordion title="Formatos de direccionamiento">
    Destinos explícitos preferidos:

    - `chat_id:123` (recomendado para un enrutamiento estable)
    - `chat_guid:...`
    - `chat_identifier:...`

    También se admiten destinos por identificador:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Escrituras de configuración

iMessage permite por defecto escrituras de configuración iniciadas por el canal (para `/config set|unset` cuando `commands.config: true`).

Desactivar:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Resolución de problemas

<AccordionGroup>
  <Accordion title="No se encuentra imsg o RPC no es compatible">
    Valida el binario y la compatibilidad con RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Si la sonda informa que RPC no es compatible, actualiza `imsg`.

  </Accordion>

  <Accordion title="Se ignoran los mensajes directos">
    Comprueba:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de emparejamiento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Se ignoran los mensajes de grupo">
    Comprueba:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamiento de lista de permitidos de `channels.imessage.groups`
    - configuración del patrón de menciones (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Fallan los adjuntos remotos">
    Comprueba:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación por clave SSH/SCP desde el host de Gateway
    - la clave del host existe en `~/.ssh/known_hosts` en el host de Gateway
    - legibilidad de la ruta remota en el Mac que ejecuta Messages

  </Accordion>

  <Accordion title="Se omitieron las solicitudes de permisos de macOS">
    Vuelve a ejecutar en una terminal GUI interactiva en el mismo contexto de usuario/sesión y aprueba las solicitudes:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirma que Acceso total al disco + Automatización estén concedidos al contexto de proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Punteros a la referencia de configuración

- [Referencia de configuración - iMessage](/es/gateway/configuration-reference#imessage)
- [Configuración de Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)
- [BlueBubbles](/es/channels/bluebubbles)

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat de grupo y restricción por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
