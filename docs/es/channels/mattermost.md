---
read_when:
    - Configuración de Mattermost
    - Depuración del enrutamiento de Mattermost
summary: Configuración del bot de Mattermost y configuración de OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T04:19:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Estado: Plugin incluido (token de bot + eventos WebSocket). Se admiten canales, grupos y mensajes directos.
Mattermost es una plataforma de mensajería para equipos autoalojable; consulta el sitio oficial en
[mattermost.com](https://mattermost.com) para conocer detalles del producto y descargas.

## Plugin incluido

Mattermost se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación independiente.

Si usas una compilación más antigua o una instalación personalizada que excluye Mattermost,
instálalo manualmente:

Instalar mediante CLI (registro npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Copia local (al ejecutar desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida

1. Asegúrate de que el Plugin de Mattermost esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas o personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Crea una cuenta de bot de Mattermost y copia el **token del bot**.
3. Copia la **URL base** de Mattermost (por ejemplo, `https://chat.example.com`).
4. Configura OpenClaw e inicia el Gateway.

Configuración mínima:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Comandos slash nativos

Los comandos slash nativos son opcionales. Cuando están habilitados, OpenClaw registra comandos slash `oc_*` mediante
la API de Mattermost y recibe POST de callback en el servidor HTTP del Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Usar cuando Mattermost no puede alcanzar el gateway directamente (proxy inverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Notas:

- `native: "auto"` está deshabilitado de forma predeterminada para Mattermost. Establece `native: true` para habilitarlo.
- Si se omite `callbackUrl`, OpenClaw deriva una a partir del host/puerto del gateway + `callbackPath`.
- Para configuraciones con varias cuentas, `commands` se puede establecer en el nivel superior o en
  `channels.mattermost.accounts.<id>.commands` (los valores de la cuenta sobrescriben los campos del nivel superior).
- Los callbacks de comandos se validan con los tokens por comando devueltos por
  Mattermost cuando OpenClaw registra comandos `oc_*`.
- Los callbacks slash fallan de forma cerrada cuando el registro falló, el inicio fue parcial o
  el token del callback no coincide con uno de los comandos registrados.
- Requisito de accesibilidad: el endpoint de callback debe ser accesible desde el servidor de Mattermost.
  - No establezcas `callbackUrl` en `localhost` a menos que Mattermost se ejecute en el mismo host/espacio de nombres de red que OpenClaw.
  - No establezcas `callbackUrl` en tu URL base de Mattermost a menos que esa URL haga proxy inverso de `/api/channels/mattermost/command` hacia OpenClaw.
  - Una comprobación rápida es `curl https://<gateway-host>/api/channels/mattermost/command`; un GET debe devolver `405 Method Not Allowed` desde OpenClaw, no `404`.
- Requisito de lista de permitidos de salida de Mattermost:
  - Si tu callback apunta a direcciones privadas/tailnet/internas, configura
    `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost para incluir el host/dominio del callback.
  - Usa entradas de host/dominio, no URL completas.
    - Bien: `gateway.tailnet-name.ts.net`
    - Mal: `https://gateway.tailnet-name.ts.net`

## Variables de entorno (cuenta predeterminada)

Configúralas en el host del gateway si prefieres variables de entorno:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Las variables de entorno se aplican solo a la cuenta **predeterminada** (`default`). Las demás cuentas deben usar valores de configuración.

## Modos de chat

Mattermost responde automáticamente a los mensajes directos. El comportamiento en canales se controla con `chatmode`:

- `oncall` (predeterminado): responder solo cuando se le menciona con @ en los canales.
- `onmessage`: responder a cada mensaje del canal.
- `onchar`: responder cuando un mensaje comienza con un prefijo de activación.

Ejemplo de configuración:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Notas:

- `onchar` sigue respondiendo a las menciones explícitas con @.
- `channels.mattermost.requireMention` se respeta para configuraciones heredadas, pero se prefiere `chatmode`.

## Hilos y sesiones

Usa `channels.mattermost.replyToMode` para controlar si las respuestas en canales y grupos se mantienen en el
canal principal o inician un hilo bajo la publicación que las activó.

- `off` (predeterminado): responder en un hilo solo cuando la publicación entrante ya esté en uno.
- `first`: para publicaciones de nivel superior en canales/grupos, iniciar un hilo bajo esa publicación y enrutar la
  conversación a una sesión limitada al hilo.
- `all`: hoy en Mattermost tiene el mismo comportamiento que `first`.
- Los mensajes directos ignoran esta configuración y permanecen sin hilos.

Ejemplo de configuración:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Notas:

- Las sesiones limitadas al hilo usan el id de la publicación que activó la respuesta como raíz del hilo.
- `first` y `all` son actualmente equivalentes porque, una vez que Mattermost tiene una raíz de hilo,
  los fragmentos de seguimiento y los medios continúan en ese mismo hilo.

## Control de acceso (mensajes directos)

- Predeterminado: `channels.mattermost.dmPolicy = "pairing"` (los remitentes desconocidos reciben un código de emparejamiento).
- Aprobar mediante:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Mensajes directos públicos: `channels.mattermost.dmPolicy="open"` más `channels.mattermost.allowFrom=["*"]`.

## Canales (grupos)

- Predeterminado: `channels.mattermost.groupPolicy = "allowlist"` (restringido por mención).
- Añade remitentes a la lista de permitidos con `channels.mattermost.groupAllowFrom` (se recomiendan IDs de usuario).
- Las anulaciones de mención por canal se configuran en `channels.mattermost.groups.<channelId>.requireMention`
  o `channels.mattermost.groups["*"].requireMention` para un valor predeterminado.
- La coincidencia de `@username` es mutable y solo está habilitada cuando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canales abiertos: `channels.mattermost.groupPolicy="open"` (restringido por mención).
- Nota de tiempo de ejecución: si falta por completo `channels.mattermost`, el tiempo de ejecución vuelve a `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está configurado).

Ejemplo:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Destinos para entrega saliente

Usa estos formatos de destino con `openclaw message send` o Cron/Webhooks:

- `channel:<id>` para un canal
- `user:<id>` para un mensaje directo
- `@username` para un mensaje directo (resuelto mediante la API de Mattermost)

Los IDs opacos sin prefijo (como `64ifufp...`) son **ambiguos** en Mattermost (ID de usuario frente a ID de canal).

OpenClaw los resuelve **priorizando usuario**:

- Si el ID existe como usuario (`GET /api/v4/users/<id>` tiene éxito), OpenClaw envía un **mensaje directo** resolviendo el canal directo mediante `/api/v4/channels/direct`.
- En caso contrario, el ID se trata como un **ID de canal**.

Si necesitas un comportamiento determinista, usa siempre los prefijos explícitos (`user:<id>` / `channel:<id>`).

## Reintento del canal de mensajes directos

Cuando OpenClaw envía a un destino de mensaje directo de Mattermost y primero necesita resolver el canal directo,
vuelve a intentarlo en caso de fallos transitorios de creación del canal directo de forma predeterminada.

Usa `channels.mattermost.dmChannelRetry` para ajustar ese comportamiento globalmente para el Plugin de Mattermost,
o `channels.mattermost.accounts.<id>.dmChannelRetry` para una sola cuenta.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Notas:

- Esto se aplica solo a la creación del canal de mensajes directos (`/api/v4/channels/direct`), no a cada llamada a la API de Mattermost.
- Los reintentos se aplican a fallos transitorios como límites de velocidad, respuestas 5xx y errores de red o tiempo de espera.
- Los errores de cliente 4xx distintos de `429` se consideran permanentes y no se reintentan.

## Vista previa en streaming

Mattermost transmite el razonamiento, la actividad de herramientas y el texto parcial de la respuesta en una sola **publicación borrador de vista previa** que se finaliza en el mismo lugar cuando la respuesta final es segura para enviarse. La vista previa se actualiza en el mismo id de publicación en lugar de saturar el canal con mensajes por fragmento. Los finales de medios/error cancelan las ediciones de vista previa pendientes y usan la entrega normal en lugar de vaciar una publicación de vista previa desechable.

Habilítalo mediante `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Notas:

- `partial` es la opción habitual: una publicación de vista previa que se edita a medida que crece la respuesta y luego se finaliza con la respuesta completa.
- `block` usa fragmentos de borrador de estilo anexado dentro de la publicación de vista previa.
- `progress` muestra una vista previa de estado durante la generación y solo publica la respuesta final al completarse.
- `off` deshabilita la vista previa en streaming.
- Si el flujo no puede finalizarse en el mismo lugar (por ejemplo, si la publicación se eliminó a mitad del flujo), OpenClaw vuelve a enviar una nueva publicación final para que la respuesta nunca se pierda.
- Consulta [Streaming](/es/concepts/streaming#preview-streaming-modes) para ver la matriz de correspondencia por canal.

## Reacciones (herramienta de mensajes)

- Usa `message action=react` con `channel=mattermost`.
- `messageId` es el id de la publicación de Mattermost.
- `emoji` acepta nombres como `thumbsup` o `:+1:` (los dos puntos son opcionales).
- Establece `remove=true` (booleano) para eliminar una reacción.
- Los eventos de añadir/eliminar reacciones se reenvían como eventos del sistema a la sesión del agente enrutable.

Ejemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuración:

- `channels.mattermost.actions.reactions`: habilitar/deshabilitar acciones de reacción (predeterminado: true).
- Anulación por cuenta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botones interactivos (herramienta de mensajes)

Envía mensajes con botones en los que se puede hacer clic. Cuando un usuario hace clic en un botón, el agente recibe la
selección y puede responder.

Habilita los botones añadiendo `inlineButtons` a las capacidades del canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Usa `message action=send` con un parámetro `buttons`. Los botones son un arreglo 2D (filas de botones):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campos de los botones:

- `text` (obligatorio): etiqueta visible.
- `callback_data` (obligatorio): valor que se devuelve al hacer clic (se usa como ID de acción).
- `style` (opcional): `"default"`, `"primary"` o `"danger"`.

Cuando un usuario hace clic en un botón:

1. Todos los botones se reemplazan por una línea de confirmación (por ejemplo, "✓ **Yes** selected by @user").
2. El agente recibe la selección como un mensaje entrante y responde.

Notas:

- Los callbacks de botones usan verificación HMAC-SHA256 (automática, sin necesidad de configuración).
- Mattermost elimina los datos de callback de sus respuestas API (medida de seguridad), por lo que todos los botones
  se eliminan al hacer clic; no es posible una eliminación parcial.
- Los ID de acción que contienen guiones o guiones bajos se sanean automáticamente
  (limitación de enrutamiento de Mattermost).

Configuración:

- `channels.mattermost.capabilities`: arreglo de cadenas de capacidades. Añade `"inlineButtons"` para
  habilitar la descripción de la herramienta de botones en el prompt del sistema del agente.
- `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para los
  callbacks de botones (por ejemplo, `https://gateway.example.com`). Usa esto cuando Mattermost no puede
  alcanzar el gateway directamente en su host de enlace.
- En configuraciones con varias cuentas, también puedes establecer el mismo campo en
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Si se omite `interactions.callbackBaseUrl`, OpenClaw deriva la URL de callback a partir de
  `gateway.customBindHost` + `gateway.port`, y luego recurre a `http://localhost:<port>`.
- Regla de accesibilidad: la URL de callback del botón debe ser accesible desde el servidor de Mattermost.
  `localhost` solo funciona cuando Mattermost y OpenClaw se ejecutan en el mismo host/espacio de nombres de red.
- Si tu destino de callback es privado/tailnet/interno, añade su host/dominio a
  `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

### Integración directa con la API (scripts externos)

Los scripts externos y Webhooks pueden publicar botones directamente mediante la API REST de Mattermost
en lugar de pasar por la herramienta `message` del agente. Usa `buildButtonAttachments()` de
la extensión cuando sea posible; si publicas JSON sin procesar, sigue estas reglas:

**Estructura de la carga útil:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // solo alfanumérico — ver abajo
            type: "button", // obligatorio, o los clics se ignoran silenciosamente
            name: "Approve", // etiqueta visible
            style: "primary", // opcional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // debe coincidir con el id del botón (para la búsqueda de nombre)
                action: "approve",
                // ... cualquier campo personalizado ...
                _token: "<hmac>", // consulta la sección HMAC más abajo
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Reglas críticas:**

1. Los adjuntos van en `props.attachments`, no en `attachments` de nivel superior (se ignoran silenciosamente).
2. Cada acción necesita `type: "button"` — sin eso, los clics se descartan silenciosamente.
3. Cada acción necesita un campo `id` — Mattermost ignora las acciones sin ID.
4. El `id` de la acción debe ser **solo alfanumérico** (`[a-zA-Z0-9]`). Los guiones y guiones bajos rompen
   el enrutamiento de acciones del lado del servidor de Mattermost (devuelve 404). Elimínalos antes de usarlo.
5. `context.action_id` debe coincidir con el `id` del botón para que el mensaje de confirmación muestre el
   nombre del botón (por ejemplo, "Approve") en lugar de un ID sin procesar.
6. `context.action_id` es obligatorio — el controlador de interacciones devuelve 400 sin él.

**Generación del token HMAC:**

El gateway verifica los clics de botones con HMAC-SHA256. Los scripts externos deben generar tokens
que coincidan con la lógica de verificación del gateway:

1. Deriva el secreto a partir del token del bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Construye el objeto de contexto con todos los campos **excepto** `_token`.
3. Serializa con **claves ordenadas** y **sin espacios** (el gateway usa `JSON.stringify`
   con claves ordenadas, lo que produce una salida compacta).
4. Firma: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Añade el resumen hexadecimal resultante como `_token` en el contexto.

Ejemplo en Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Errores comunes de HMAC:

- `json.dumps` de Python añade espacios de forma predeterminada (`{"key": "val"}`). Usa
  `separators=(",", ":")` para que coincida con la salida compacta de JavaScript (`{"key":"val"}`).
- Firma siempre **todos** los campos del contexto (menos `_token`). El gateway elimina `_token` y luego
  firma todo lo restante. Firmar un subconjunto provoca un fallo silencioso de verificación.
- Usa `sort_keys=True` — el gateway ordena las claves antes de firmar, y Mattermost puede
  reordenar los campos del contexto al almacenar la carga útil.
- Deriva el secreto a partir del token del bot (determinista), no de bytes aleatorios. El secreto
  debe ser el mismo en el proceso que crea los botones y en el gateway que verifica.

## Adaptador de directorio

El Plugin de Mattermost incluye un adaptador de directorio que resuelve nombres de canales y usuarios
mediante la API de Mattermost. Esto habilita destinos `#channel-name` y `@username` en
`openclaw message send` y entregas de Cron/Webhooks.

No se necesita configuración — el adaptador usa el token del bot de la configuración de la cuenta.

## Varias cuentas

Mattermost admite varias cuentas en `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Solución de problemas

- No hay respuestas en los canales: asegúrate de que el bot esté en el canal y menciónalo (oncall), usa un prefijo de activación (onchar), o establece `chatmode: "onmessage"`.
- Errores de autenticación: comprueba el token del bot, la URL base y si la cuenta está habilitada.
- Problemas con varias cuentas: las variables de entorno solo se aplican a la cuenta `default`.
- Los comandos slash nativos devuelven `Unauthorized: invalid command token.`: OpenClaw
  no aceptó el token del callback. Causas típicas:
  - el registro del comando slash falló o solo se completó parcialmente durante el inicio
  - el callback está llegando al gateway/cuenta incorrectos
  - Mattermost todavía tiene comandos antiguos que apuntan a un destino de callback anterior
  - el gateway se reinició sin reactivar los comandos slash
- Si los comandos slash nativos dejan de funcionar, revisa los registros para ver si aparece
  `mattermost: failed to register slash commands` o
  `mattermost: native slash commands enabled but no commands could be registered`.
- Si se omite `callbackUrl` y los registros advierten que el callback se resolvió como
  `http://127.0.0.1:18789/...`, esa URL probablemente solo sea accesible cuando
  Mattermost se ejecuta en el mismo host/espacio de nombres de red que OpenClaw. Configura una
  `commands.callbackUrl` explícita y accesible externamente.
- Los botones aparecen como cuadros blancos: es posible que el agente esté enviando datos de botones mal formados. Comprueba que cada botón tenga los campos `text` y `callback_data`.
- Los botones se muestran pero los clics no hacen nada: verifica que `AllowedUntrustedInternalConnections` en la configuración del servidor de Mattermost incluya `127.0.0.1 localhost`, y que `EnablePostActionIntegration` sea `true` en ServiceSettings.
- Los botones devuelven 404 al hacer clic: es probable que el `id` del botón contenga guiones o guiones bajos. El enrutador de acciones de Mattermost falla con IDs no alfanuméricos. Usa solo `[a-zA-Z0-9]`.
- El gateway registra `invalid _token`: discrepancia de HMAC. Comprueba que firmas todos los campos del contexto (no un subconjunto), usas claves ordenadas y JSON compacto (sin espacios). Consulta la sección HMAC más arriba.
- El gateway registra `missing _token in context`: el campo `_token` no está en el contexto del botón. Asegúrate de incluirlo al construir la carga útil de integración.
- La confirmación muestra el ID sin procesar en lugar del nombre del botón: `context.action_id` no coincide con el `id` del botón. Establece ambos con el mismo valor saneado.
- El agente no conoce los botones: añade `capabilities: ["inlineButtons"]` a la configuración del canal Mattermost.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat de grupo y restricción por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
