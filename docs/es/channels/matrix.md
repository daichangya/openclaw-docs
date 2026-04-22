---
read_when:
    - Configuración de Matrix en OpenClaw
    - Configuración de E2EE y verificación de Matrix
summary: Estado de compatibilidad, configuración inicial y ejemplos de configuración de Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-22T04:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e78d85096ea84361951935a0daf34966c575d822f8581277eb384276c7c706a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix es un plugin de canal incluido para OpenClaw.
Usa el `matrix-js-sdk` oficial y admite mensajes directos, salas, hilos, multimedia, reacciones, encuestas, ubicación y E2EE.

## Plugin incluido

Matrix se incluye como plugin en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación independiente.

Si usas una compilación antigua o una instalación personalizada que excluye Matrix, instálalo manualmente:

Instalar desde npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar desde una copia local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulta [Plugins](/es/tools/plugin) para ver el comportamiento de los plugins y las reglas de instalación.

## Configuración inicial

1. Asegúrate de que el plugin de Matrix esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas o personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Crea una cuenta de Matrix en tu homeserver.
3. Configura `channels.matrix` con una de estas opciones:
   - `homeserver` + `accessToken`, o
   - `homeserver` + `userId` + `password`.
4. Reinicia el Gateway.
5. Inicia un mensaje directo con el bot o invítalo a una sala.
   - Las invitaciones nuevas de Matrix solo funcionan cuando `channels.matrix.autoJoin` las permite.

Rutas de configuración interactiva:

```bash
openclaw channels add
openclaw configure --section channels
```

El asistente de Matrix solicita:

- URL del homeserver
- método de autenticación: token de acceso o contraseña
- ID de usuario (solo autenticación con contraseña)
- nombre de dispositivo opcional
- si se debe habilitar E2EE
- si se debe configurar el acceso a salas y la unión automática por invitación

Comportamientos clave del asistente:

- Si las variables de entorno de autenticación de Matrix ya existen y esa cuenta todavía no tiene autenticación guardada en la configuración, el asistente ofrece un acceso directo con variables de entorno para mantener la autenticación en variables de entorno.
- Los nombres de cuenta se normalizan al ID de la cuenta. Por ejemplo, `Ops Bot` pasa a ser `ops-bot`.
- Las entradas de lista de permitidos para mensajes directos aceptan `@user:server` directamente; los nombres visibles solo funcionan cuando la búsqueda en vivo del directorio encuentra una coincidencia exacta.
- Las entradas de lista de permitidos para salas aceptan directamente IDs y alias de sala. Se prefiere `!room:server` o `#alias:server`; los nombres sin resolver se ignoran en tiempo de ejecución durante la resolución de la lista de permitidos.
- En el modo de lista de permitidos para unión automática por invitación, usa solo destinos de invitación estables: `!roomId:server`, `#alias:server` o `*`. Los nombres de sala simples se rechazan.
- Para resolver nombres de sala antes de guardar, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` tiene como valor predeterminado `off`.

Si lo dejas sin configurar, el bot no se unirá a salas invitadas ni a invitaciones nuevas de tipo mensaje directo, por lo que no aparecerá en grupos nuevos ni en mensajes directos por invitación a menos que primero te unas manualmente.

Configura `autoJoin: "allowlist"` junto con `autoJoinAllowlist` para restringir qué invitaciones acepta, o configura `autoJoin: "always"` si quieres que se una a todas las invitaciones.

En el modo `allowlist`, `autoJoinAllowlist` solo acepta `!roomId:server`, `#alias:server` o `*`.
</Warning>

Ejemplo de lista de permitidos:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Unirse a todas las invitaciones:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Configuración mínima basada en token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Configuración basada en contraseña (el token se almacena en caché después del inicio de sesión):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix almacena las credenciales en caché en `~/.openclaw/credentials/matrix/`.
La cuenta predeterminada usa `credentials.json`; las cuentas con nombre usan `credentials-<account>.json`.
Cuando existen credenciales en caché allí, OpenClaw considera que Matrix está configurado para la configuración inicial, doctor y la detección de estado del canal, incluso si la autenticación actual no está configurada directamente en la configuración.

Equivalentes en variables de entorno (se usan cuando la clave de configuración no está definida):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Para cuentas no predeterminadas, usa variables de entorno con ámbito por cuenta:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Ejemplo para la cuenta `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Para el ID de cuenta normalizado `ops-bot`, usa:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix escapa la puntuación en los IDs de cuenta para mantener las variables de entorno con ámbito libres de colisiones.
Por ejemplo, `-` se convierte en `_X2D_`, por lo que `ops-prod` se convierte en `MATRIX_OPS_X2D_PROD_*`.

El asistente interactivo solo ofrece el acceso directo con variables de entorno cuando esas variables de autenticación ya están presentes y la cuenta seleccionada todavía no tiene autenticación de Matrix guardada en la configuración.

## Ejemplo de configuración

Esta es una configuración base práctica con emparejamiento de mensajes directos, lista de permitidos de salas y E2EE habilitado:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de tipo mensaje directo. OpenClaw no puede clasificar de forma fiable una sala invitada como mensaje directo o grupo en el momento de la invitación, por lo que todas las invitaciones pasan primero por `autoJoin`. `dm.policy` se aplica después de que el bot se haya unido y la sala se clasifique como un mensaje directo.

## Vistas previas de streaming

El streaming de respuestas en Matrix es opcional.

Configura `channels.matrix.streaming` como `"partial"` cuando quieras que OpenClaw envíe una única respuesta de vista previa en vivo, edite esa vista previa en el mismo lugar mientras el modelo genera texto y luego la finalice cuando la respuesta termine:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` es el valor predeterminado. OpenClaw espera la respuesta final y la envía una sola vez.
- `streaming: "partial"` crea un mensaje de vista previa editable para el bloque actual del asistente usando mensajes de texto normales de Matrix. Esto conserva el comportamiento heredado de Matrix de notificación primero sobre la vista previa, por lo que los clientes estándar pueden notificar sobre el primer texto transmitido de la vista previa en lugar del bloque finalizado.
- `streaming: "quiet"` crea un aviso silencioso de vista previa editable para el bloque actual del asistente. Usa esto solo cuando también configures reglas push del destinatario para ediciones finalizadas de la vista previa.
- `blockStreaming: true` habilita mensajes de progreso separados de Matrix. Con el streaming de vista previa habilitado, Matrix mantiene el borrador en vivo del bloque actual y conserva los bloques completados como mensajes separados.
- Cuando el streaming de vista previa está activado y `blockStreaming` está desactivado, Matrix edita el borrador en vivo en el mismo lugar y finaliza ese mismo evento cuando termina el bloque o el turno.
- Si la vista previa ya no cabe en un solo evento de Matrix, OpenClaw detiene el streaming de vista previa y vuelve a la entrega final normal.
- Las respuestas multimedia siguen enviando los archivos adjuntos con normalidad. Si una vista previa obsoleta ya no puede reutilizarse de forma segura, OpenClaw la elimina antes de enviar la respuesta multimedia final.
- Las ediciones de vista previa generan llamadas adicionales a la API de Matrix. Deja el streaming desactivado si quieres el comportamiento más conservador respecto a límites de velocidad.

`blockStreaming` no habilita por sí solo las vistas previas de borrador.
Usa `streaming: "partial"` o `streaming: "quiet"` para las ediciones de vista previa; después, añade `blockStreaming: true` solo si también quieres que los bloques completados del asistente sigan visibles como mensajes de progreso separados.

Si necesitas notificaciones estándar de Matrix sin reglas push personalizadas, usa `streaming: "partial"` para el comportamiento de vista previa primero o deja `streaming` desactivado para entrega solo final. Con `streaming: "off"`:

- `blockStreaming: true` envía cada bloque terminado como un mensaje normal de Matrix con notificación.
- `blockStreaming: false` envía solo la respuesta final completada como un mensaje normal de Matrix con notificación.

### Reglas push autohospedadas para vistas previas silenciosas finalizadas

Si ejecutas tu propia infraestructura de Matrix y quieres que las vistas previas silenciosas notifiquen solo cuando un bloque o la respuesta final haya terminado, configura `streaming: "quiet"` y añade una regla push por usuario para las ediciones finalizadas de la vista previa.

Normalmente esta es una configuración del usuario destinatario, no un cambio de configuración global del homeserver:

Mapa rápido antes de empezar:

- usuario destinatario = la persona que debe recibir la notificación
- usuario bot = la cuenta de Matrix de OpenClaw que envía la respuesta
- usa el token de acceso del usuario destinatario para las llamadas a la API a continuación
- haz coincidir `sender` en la regla push con el MXID completo del usuario bot

1. Configura OpenClaw para usar vistas previas silenciosas:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Asegúrate de que la cuenta del destinatario ya reciba notificaciones push normales de Matrix. Las reglas de vista previa silenciosa solo funcionan si ese usuario ya tiene pushers/dispositivos en funcionamiento.

3. Obtén el token de acceso del usuario destinatario.
   - Usa el token del usuario receptor, no el token del bot.
   - Reutilizar un token de sesión existente del cliente suele ser lo más sencillo.
   - Si necesitas generar un token nuevo, puedes iniciar sesión mediante la API estándar Client-Server de Matrix:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Verifica que la cuenta del destinatario ya tenga pushers:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Si esto no devuelve pushers/dispositivos activos, primero corrige las notificaciones normales de Matrix antes de añadir la siguiente regla de OpenClaw.

OpenClaw marca las ediciones finalizadas de vista previa solo de texto con:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Crea una regla push de anulación para cada cuenta destinataria que deba recibir estas notificaciones:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Sustituye estos valores antes de ejecutar el comando:

- `https://matrix.example.org`: la URL base de tu homeserver
- `$USER_ACCESS_TOKEN`: el token de acceso del usuario receptor
- `openclaw-finalized-preview-botname`: un ID de regla único para este bot para este usuario receptor
- `@bot:example.org`: el MXID de tu bot de Matrix de OpenClaw, no el MXID del usuario receptor

Importante para configuraciones con varios bots:

- Las reglas push se indexan por `ruleId`. Volver a ejecutar `PUT` sobre el mismo ID de regla actualiza esa misma regla.
- Si un mismo usuario receptor debe recibir notificaciones de varias cuentas de bot de Matrix de OpenClaw, crea una regla por bot con un ID de regla único para cada coincidencia de remitente.
- Un patrón sencillo es `openclaw-finalized-preview-<botname>`, por ejemplo `openclaw-finalized-preview-ops` o `openclaw-finalized-preview-support`.

La regla se evalúa con respecto al remitente del evento:

- autentícate con el token del usuario receptor
- haz coincidir `sender` con el MXID del bot de OpenClaw

6. Verifica que la regla exista:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Prueba una respuesta transmitida. En modo silencioso, la sala debería mostrar un borrador silencioso de vista previa y la edición final en el mismo lugar debería notificar una vez que termine el bloque o el turno.

Si más adelante necesitas eliminar la regla, borra ese mismo ID de regla con el token del usuario receptor:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Notas:

- Crea la regla con el token de acceso del usuario receptor, no con el del bot.
- Las nuevas reglas `override` definidas por el usuario se insertan antes de las reglas predeterminadas de supresión, así que no se necesita ningún parámetro adicional de orden.
- Esto solo afecta a las ediciones de vista previa de solo texto que OpenClaw puede finalizar de forma segura en el mismo lugar. Los respaldos para multimedia y para vistas previas obsoletas siguen usando la entrega normal de Matrix.
- Si `GET /_matrix/client/v3/pushers` no muestra pushers, el usuario todavía no tiene una entrega push de Matrix funcional para esta cuenta o dispositivo.

#### Synapse

Para Synapse, la configuración anterior suele ser suficiente por sí sola:

- No se requiere ningún cambio especial en `homeserver.yaml` para las notificaciones de vista previa finalizada de OpenClaw.
- Si tu implementación de Synapse ya envía notificaciones push normales de Matrix, el token de usuario + la llamada a `pushrules` anterior es el paso principal de configuración.
- Si ejecutas Synapse detrás de un proxy inverso o de workers, asegúrate de que `/_matrix/client/.../pushrules/` llegue correctamente a Synapse.
- Si ejecutas workers de Synapse, asegúrate de que los pushers estén en buen estado. La entrega push la gestiona el proceso principal o `synapse.app.pusher` / los workers de pusher configurados.

#### Tuwunel

Para Tuwunel, usa el mismo flujo de configuración y la misma llamada a la API `pushrules` mostrados arriba:

- No se requiere ninguna configuración específica de Tuwunel para el marcador de vista previa finalizada en sí.
- Si las notificaciones normales de Matrix ya funcionan para ese usuario, el token de usuario + la llamada a `pushrules` anterior es el paso principal de configuración.
- Si parece que las notificaciones desaparecen mientras el usuario está activo en otro dispositivo, comprueba si `suppress_push_when_active` está habilitado. Tuwunel añadió esta opción en Tuwunel 1.4.2 el 12 de septiembre de 2025, y puede suprimir intencionadamente los envíos push a otros dispositivos mientras uno está activo.

## Salas de bot a bot

De forma predeterminada, se ignoran los mensajes de otras cuentas configuradas de Matrix de OpenClaw.

Usa `allowBots` cuando quieras permitir intencionadamente tráfico de Matrix entre agentes:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` acepta mensajes de otras cuentas configuradas de bot de Matrix en salas y mensajes directos permitidos.
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas. Los mensajes directos siguen permitidos.
- `groups.<room>.allowBots` sobrescribe la configuración de nivel de cuenta para una sala.
- OpenClaw sigue ignorando los mensajes del mismo ID de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no expone aquí una marca nativa de bot; OpenClaw trata “escrito por bot” como “enviado por otra cuenta de Matrix configurada en este Gateway de OpenClaw”.

Usa listas estrictas de salas permitidas y requisitos de mención al habilitar tráfico de bot a bot en salas compartidas.

## Cifrado y verificación

En salas cifradas (E2EE), los eventos salientes de imágenes usan `thumbnail_file` para que las vistas previas de imágenes se cifren junto con el archivo adjunto completo. Las salas no cifradas siguen usando `thumbnail_url` sin cifrar. No se necesita configuración: el plugin detecta automáticamente el estado de E2EE.

Habilitar cifrado:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Comprobar el estado de verificación:

```bash
openclaw matrix verify status
```

Estado detallado (diagnóstico completo):

```bash
openclaw matrix verify status --verbose
```

Incluir la clave de recuperación almacenada en la salida legible por máquinas:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inicializar el estado de firma cruzada y verificación:

```bash
openclaw matrix verify bootstrap
```

Diagnóstico detallado de bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forzar un reinicio nuevo de la identidad de firma cruzada antes de hacer bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verificar este dispositivo con una clave de recuperación:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Detalles detallados de verificación del dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Comprobar el estado de la copia de seguridad de claves de sala:

```bash
openclaw matrix verify backup status
```

Diagnóstico detallado del estado de la copia de seguridad:

```bash
openclaw matrix verify backup status --verbose
```

Restaurar claves de sala desde la copia de seguridad del servidor:

```bash
openclaw matrix verify backup restore
```

Diagnóstico detallado de restauración:

```bash
openclaw matrix verify backup restore --verbose
```

Eliminar la copia de seguridad actual del servidor y crear una base nueva de copia de seguridad. Si la clave de copia de seguridad almacenada no puede cargarse correctamente, este reinicio también puede recrear el almacenamiento de secretos para que futuros inicios en frío puedan cargar la nueva clave de copia de seguridad:

```bash
openclaw matrix verify backup reset --yes
```

Todos los comandos `verify` son concisos de forma predeterminada (incluido el registro interno silencioso del SDK) y muestran diagnósticos detallados solo con `--verbose`.
Usa `--json` para obtener salida completa legible por máquinas al automatizar scripts.

En configuraciones con varias cuentas, los comandos CLI de Matrix usan la cuenta predeterminada implícita de Matrix, a menos que pases `--account <id>`.
Si configuras varias cuentas con nombre, establece primero `channels.matrix.defaultAccount` o esas operaciones implícitas de CLI se detendrán y te pedirán que elijas una cuenta explícitamente.
Usa `--account` siempre que quieras que las operaciones de verificación o de dispositivo apunten explícitamente a una cuenta con nombre:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Cuando el cifrado está deshabilitado o no disponible para una cuenta con nombre, las advertencias de Matrix y los errores de verificación señalan la clave de configuración de esa cuenta, por ejemplo `channels.matrix.accounts.assistant.encryption`.

### Qué significa “verificado”

OpenClaw trata este dispositivo de Matrix como verificado solo cuando está verificado por tu propia identidad de firma cruzada.
En la práctica, `openclaw matrix verify status --verbose` expone tres señales de confianza:

- `Locally trusted`: este dispositivo solo es de confianza para el cliente actual
- `Cross-signing verified`: el SDK informa que el dispositivo está verificado mediante firma cruzada
- `Signed by owner`: el dispositivo está firmado por tu propia clave de autofirma

`Verified by owner` pasa a ser `yes` solo cuando existe verificación por firma cruzada o firma del propietario.
La confianza local por sí sola no basta para que OpenClaw trate el dispositivo como completamente verificado.

### Qué hace bootstrap

`openclaw matrix verify bootstrap` es el comando de reparación y configuración para cuentas de Matrix cifradas.
Hace todo lo siguiente en este orden:

- inicializa el almacenamiento de secretos, reutilizando una clave de recuperación existente cuando es posible
- inicializa la firma cruzada y sube las claves públicas de firma cruzada que falten
- intenta marcar y firmar cruzadamente el dispositivo actual
- crea una nueva copia de seguridad de claves de sala en el servidor si todavía no existe una

Si el homeserver requiere autenticación interactiva para subir claves de firma cruzada, OpenClaw intenta primero la subida sin autenticación, luego con `m.login.dummy` y después con `m.login.password` cuando `channels.matrix.password` está configurado.

Usa `--force-reset-cross-signing` solo cuando quieras descartar intencionadamente la identidad actual de firma cruzada y crear una nueva.

Si quieres descartar intencionadamente la copia de seguridad actual de claves de sala y empezar una nueva base de copia de seguridad para mensajes futuros, usa `openclaw matrix verify backup reset --yes`.
Haz esto solo cuando aceptes que el historial cifrado antiguo que no pueda recuperarse seguirá sin estar disponible y que OpenClaw podría recrear el almacenamiento de secretos si el secreto actual de la copia de seguridad no puede cargarse de forma segura.

### Base nueva de copia de seguridad

Si quieres mantener funcionando los futuros mensajes cifrados y aceptas perder el historial antiguo que no pueda recuperarse, ejecuta estos comandos en orden:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Añade `--account <id>` a cada comando cuando quieras apuntar explícitamente a una cuenta de Matrix con nombre.

### Comportamiento de inicio

Cuando `encryption: true`, Matrix establece por defecto `startupVerification` en `"if-unverified"`.
Al iniciar, si este dispositivo sigue sin verificar, Matrix solicitará la autoverificación en otro cliente de Matrix, omitirá solicitudes duplicadas mientras ya haya una pendiente y aplicará un período local de espera antes de volver a intentarlo tras reinicios.
Los intentos fallidos de solicitud vuelven a intentarse antes que la creación correcta de solicitudes, de forma predeterminada.
Establece `startupVerification: "off"` para desactivar las solicitudes automáticas al inicio, o ajusta `startupVerificationCooldownHours` si quieres una ventana de reintento más corta o más larga.

El inicio también realiza automáticamente una fase conservadora de bootstrap criptográfico.
Esa fase intenta reutilizar primero el almacenamiento de secretos actual y la identidad actual de firma cruzada, y evita reiniciar la firma cruzada a menos que ejecutes un flujo explícito de reparación de bootstrap.

Si durante el inicio todavía se detecta un estado roto de bootstrap, OpenClaw puede intentar una ruta de reparación protegida incluso cuando `channels.matrix.password` no está configurado.
Si el homeserver requiere UIA basada en contraseña para esa reparación, OpenClaw registra una advertencia y mantiene el inicio como no fatal en lugar de abortar el bot.
Si el dispositivo actual ya está firmado por el propietario, OpenClaw conserva esa identidad en lugar de reiniciarla automáticamente.

Consulta [Migración de Matrix](/es/install/migrating-matrix) para ver el flujo completo de actualización, límites, comandos de recuperación y mensajes comunes de migración.

### Avisos de verificación

Matrix publica avisos del ciclo de vida de la verificación directamente en la sala estricta de verificación por mensaje directo como mensajes `m.notice`.
Eso incluye:

- avisos de solicitud de verificación
- avisos de verificación lista (con orientación explícita de “Verificar con emoji”)
- avisos de inicio y finalización de verificación
- detalles SAS (emoji y decimal) cuando estén disponibles

Las solicitudes entrantes de verificación desde otro cliente de Matrix se rastrean y OpenClaw las acepta automáticamente.
En los flujos de autoverificación, OpenClaw también inicia automáticamente el flujo SAS cuando la verificación por emoji está disponible y confirma su propio lado.
Para solicitudes de verificación desde otro usuario o dispositivo de Matrix, OpenClaw acepta automáticamente la solicitud y luego espera a que el flujo SAS continúe con normalidad.
Aun así, necesitas comparar el SAS en emoji o decimal en tu cliente de Matrix y confirmar allí “Coinciden” para completar la verificación.

OpenClaw no acepta automáticamente a ciegas flujos duplicados iniciados por sí mismo. En el inicio se omite crear una nueva solicitud cuando ya hay pendiente una solicitud de autoverificación.

Los avisos del sistema o protocolo de verificación no se reenvían a la canalización de chat del agente, por lo que no producen `NO_REPLY`.

### Higiene de dispositivos

Los dispositivos antiguos de Matrix gestionados por OpenClaw pueden acumularse en la cuenta y hacer que la confianza en salas cifradas sea más difícil de interpretar.
Haz una lista de ellos con:

```bash
openclaw matrix devices list
```

Elimina los dispositivos obsoletos gestionados por OpenClaw con:

```bash
openclaw matrix devices prune-stale
```

### Almacén criptográfico

Matrix E2EE usa la ruta criptográfica Rust oficial de `matrix-js-sdk` en Node, con `fake-indexeddb` como shim de IndexedDB. El estado criptográfico se conserva en un archivo de instantánea (`crypto-idb-snapshot.json`) y se restaura al iniciar. El archivo de instantánea es un estado de ejecución sensible almacenado con permisos de archivo restrictivos.

El estado de ejecución cifrado reside bajo raíces por cuenta, por usuario y por hash de token en
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ese directorio contiene el almacén de sincronización (`bot-storage.json`), el almacén criptográfico (`crypto/`),
el archivo de clave de recuperación (`recovery-key.json`), la instantánea de IndexedDB (`crypto-idb-snapshot.json`),
los enlaces de hilos (`thread-bindings.json`) y el estado de verificación de inicio (`startup-verification.json`).
Cuando el token cambia pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor
raíz existente para esa tupla de cuenta/homeserver/usuario, de modo que el estado de sincronización anterior, el estado criptográfico, los enlaces de hilos
y el estado de verificación de inicio sigan siendo visibles.

## Gestión de perfil

Actualiza el perfil propio de Matrix para la cuenta seleccionada con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Añade `--account <id>` cuando quieras apuntar explícitamente a una cuenta de Matrix con nombre.

Matrix acepta URLs de avatar `mxc://` directamente. Cuando pasas una URL de avatar `http://` o `https://`, OpenClaw primero la sube a Matrix y guarda la URL `mxc://` resultante de vuelta en `channels.matrix.avatarUrl` (o en la sobrescritura de cuenta seleccionada).

## Hilos

Matrix admite hilos nativos de Matrix tanto para respuestas automáticas como para envíos con herramientas de mensajes.

- `dm.sessionScope: "per-user"` (predeterminado) mantiene el enrutamiento de mensajes directos de Matrix con alcance por remitente, por lo que varias salas de mensajes directos pueden compartir una sesión cuando se resuelven al mismo par.
- `dm.sessionScope: "per-room"` aísla cada sala de mensajes directos de Matrix en su propia clave de sesión, mientras sigue usando autenticación normal de mensajes directos y comprobaciones de lista de permitidos.
- Los enlaces explícitos de conversación de Matrix siguen teniendo prioridad sobre `dm.sessionScope`, por lo que las salas e hilos enlazados conservan su sesión de destino elegida.
- `threadReplies: "off"` mantiene las respuestas en el nivel superior y conserva los mensajes entrantes en hilo en la sesión principal.
- `threadReplies: "inbound"` responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `threadReplies: "always"` mantiene las respuestas de sala en un hilo con raíz en el mensaje que las activó y enruta esa conversación mediante la sesión correspondiente con alcance de hilo desde el primer mensaje activador.
- `dm.threadReplies` sobrescribe la configuración de nivel superior solo para mensajes directos. Por ejemplo, puedes mantener aislados los hilos de sala mientras mantienes planos los mensajes directos.
- Los mensajes entrantes en hilo incluyen el mensaje raíz del hilo como contexto adicional para el agente.
- Los envíos con herramientas de mensajes heredan automáticamente el hilo actual de Matrix cuando el destino es la misma sala o el mismo destino de usuario de mensaje directo, a menos que se proporcione un `threadId` explícito.
- La reutilización del destino de usuario de mensaje directo de la misma sesión solo se activa cuando los metadatos de la sesión actual demuestran el mismo par de mensaje directo en la misma cuenta de Matrix; de lo contrario, OpenClaw recurre al enrutamiento normal con alcance por usuario.
- Cuando OpenClaw detecta que una sala de mensaje directo de Matrix entra en conflicto con otra sala de mensaje directo en la misma sesión compartida de mensaje directo de Matrix, publica un `m.notice` de una sola vez en esa sala con la vía de escape `/focus` cuando los enlaces de hilos están habilitados y la sugerencia `dm.sessionScope`.
- Se admiten enlaces de hilos en tiempo de ejecución para Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` enlazado a hilo funcionan en salas y mensajes directos de Matrix.
- `/focus` de nivel superior en sala o mensaje directo de Matrix crea un nuevo hilo de Matrix y lo enlaza a la sesión de destino cuando `threadBindings.spawnSubagentSessions=true`.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo de Matrix existente enlaza ese hilo actual en su lugar.

## Enlaces de conversación de ACP

Las salas, mensajes directos e hilos existentes de Matrix pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la superficie de chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del mensaje directo, sala o hilo existente de Matrix que quieras seguir usando.
- En un mensaje directo o sala de Matrix de nivel superior, el mensaje directo o sala actual sigue siendo la superficie de chat y los mensajes futuros se enrutan a la sesión ACP generada.
- Dentro de un hilo existente de Matrix, `--bind here` enlaza ese hilo actual en su lugar.
- `/new` y `/reset` reinician en su lugar la misma sesión ACP enlazada.
- `/acp close` cierra la sesión ACP y elimina el enlace.

Notas:

- `--bind here` no crea un hilo hijo de Matrix.
- `threadBindings.spawnAcpSessions` solo es necesario para `/acp spawn --thread auto|here`, cuando OpenClaw necesita crear o enlazar un hilo hijo de Matrix.

### Configuración de enlaces de hilos

Matrix hereda los valores globales predeterminados de `session.threadBindings` y también admite sobrescrituras por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Las banderas de generación enlazada a hilos de Matrix son opcionales:

- Configura `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nivel superior cree y enlace nuevos hilos de Matrix.
- Configura `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` enlace sesiones ACP a hilos de Matrix.

## Reacciones

Matrix admite acciones salientes de reacción, notificaciones entrantes de reacción y reacciones entrantes de confirmación.

- Las herramientas salientes de reacción están controladas por `channels["matrix"].actions.reactions`.
- `react` añade una reacción a un evento específico de Matrix.
- `reactions` enumera el resumen actual de reacciones para un evento específico de Matrix.
- `emoji=""` elimina las reacciones de la propia cuenta del bot en ese evento.
- `remove: true` elimina solo la reacción del emoji especificado de la cuenta del bot.

El alcance de las reacciones de confirmación se resuelve en este orden estándar de OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- emoji de respaldo de la identidad del agente

El alcance de la reacción de confirmación se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

El modo de notificación de reacciones se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predeterminado: `own`

Comportamiento:

- `reactionNotifications: "own"` reenvía eventos `m.reaction` añadidos cuando apuntan a mensajes de Matrix escritos por el bot.
- `reactionNotifications: "off"` desactiva los eventos del sistema de reacciones.
- Las eliminaciones de reacciones no se sintetizan en eventos del sistema porque Matrix las muestra como redacciones, no como eliminaciones independientes de `m.reaction`.

## Contexto del historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de sala se incluyen como `InboundHistory` cuando un mensaje de sala de Matrix activa al agente. Recurre a `messages.groupChat.historyLimit`; si ambos no están definidos, el valor efectivo predeterminado es `0`. Configura `0` para desactivar.
- El historial de salas de Matrix es solo de sala. Los mensajes directos siguen usando el historial normal de sesión.
- El historial de salas de Matrix es solo pendiente: OpenClaw almacena en búfer los mensajes de sala que todavía no activaron una respuesta y luego toma una instantánea de esa ventana cuando llega una mención u otro activador.
- El mensaje activador actual no se incluye en `InboundHistory`; permanece en el cuerpo principal entrante para ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la instantánea original del historial en lugar de desplazarse hacia mensajes más recientes de la sala.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para contexto adicional de sala, como texto de respuesta recuperado, raíces de hilos e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto adicional se conserva tal como se recibe.
- `contextVisibility: "allowlist"` filtra el contexto adicional a remitentes permitidos por las comprobaciones activas de lista de permitidos de sala o usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero sigue conservando una respuesta citada explícita.

Esta configuración afecta la visibilidad del contexto adicional, no si el propio mensaje entrante puede activar una respuesta.
La autorización de activación sigue viniendo de la configuración de `groupPolicy`, `groups`, `groupAllowFrom` y las opciones de política de mensajes directos.

## Política de mensajes directos y salas

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Consulta [Groups](/es/channels/groups) para conocer el comportamiento de filtrado por mención y lista de permitidos.

Ejemplo de emparejamiento para mensajes directos de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviándote mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede volver a enviar una respuesta de recordatorio después de un breve período de espera en lugar de generar un código nuevo.

Consulta [Pairing](/es/channels/pairing) para ver el flujo compartido de emparejamiento de mensajes directos y el diseño de almacenamiento.

## Reparación de sala directa

Si el estado del mensaje directo se desincroniza, OpenClaw puede acabar con asignaciones obsoletas de `m.direct` que apuntan a salas individuales antiguas en lugar del mensaje directo activo. Inspecciona la asignación actual para un par con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárala con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

El flujo de reparación:

- prefiere un mensaje directo estricto 1:1 que ya esté asignado en `m.direct`
- recurre a cualquier mensaje directo estricto 1:1 unido actualmente con ese usuario
- crea una nueva sala directa y reescribe `m.direct` si no existe un mensaje directo sano

El flujo de reparación no elimina automáticamente las salas antiguas. Solo elige el mensaje directo sano y actualiza la asignación para que los nuevos envíos de Matrix, los avisos de verificación y otros flujos de mensajes directos vuelvan a dirigirse a la sala correcta.

## Aprobaciones de ejecución

Matrix puede actuar como un cliente nativo de aprobación para una cuenta de Matrix. Los controles nativos
de enrutamiento de mensajes directos/canales siguen estando en la configuración de aprobación de ejecución:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; recurre a `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Los aprobadores deben ser IDs de usuario de Matrix como `@owner:example.org`. Matrix habilita automáticamente las aprobaciones nativas cuando `enabled` no está definido o es `"auto"` y se puede resolver al menos un aprobador. Las aprobaciones de ejecución usan primero `execApprovals.approvers` y pueden recurrir a `channels.matrix.dm.allowFrom`. Las aprobaciones de plugins autorizan mediante `channels.matrix.dm.allowFrom`. Configura `enabled: false` para desactivar explícitamente Matrix como cliente nativo de aprobación. De lo contrario, las solicitudes de aprobación recurren a otras rutas de aprobación configuradas o a la política de respaldo de aprobación.

El enrutamiento nativo de Matrix admite ambos tipos de aprobación:

- `channels.matrix.execApprovals.*` controla el modo nativo de difusión a mensajes directos/canales para solicitudes de aprobación de Matrix.
- Las aprobaciones de ejecución usan el conjunto de aprobadores de ejecución de `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Las aprobaciones de plugins usan la lista de permitidos de mensajes directos de Matrix de `channels.matrix.dm.allowFrom`.
- Los atajos mediante reacciones de Matrix y las actualizaciones de mensajes se aplican tanto a aprobaciones de ejecución como de plugins.

Reglas de entrega:

- `target: "dm"` envía las solicitudes de aprobación a los mensajes directos de los aprobadores
- `target: "channel"` envía la solicitud de vuelta a la sala o mensaje directo original de Matrix
- `target: "both"` envía a los mensajes directos de los aprobadores y a la sala o mensaje directo original de Matrix

Las solicitudes de aprobación de Matrix inicializan atajos de reacción en el mensaje principal de aprobación:

- `✅` = permitir una vez
- `❌` = denegar
- `♾️` = permitir siempre cuando esa decisión esté permitida por la política efectiva de ejecución

Los aprobadores pueden reaccionar en ese mensaje o usar los comandos slash de respaldo: `/approve <id> allow-once`, `/approve <id> allow-always` o `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. Para aprobaciones de ejecución, la entrega por canal incluye el texto del comando, así que habilita `channel` o `both` solo en salas de confianza.

Sobrescritura por cuenta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentación relacionada: [Aprobaciones de ejecución](/es/tools/exec-approvals)

## Comandos slash

Los comandos slash de Matrix (por ejemplo `/new`, `/reset`, `/model`) funcionan directamente en mensajes directos. En salas, OpenClaw también reconoce comandos slash precedidos por la propia mención de Matrix del bot, de modo que `@bot:server /new` activa la ruta del comando sin necesitar una expresión regular de mención personalizada. Esto mantiene al bot receptivo a publicaciones de estilo sala con `@mención /comando` que emiten Element y clientes similares cuando un usuario autocompleta el bot antes de escribir el comando.

Las reglas de autorización siguen aplicándose: los remitentes de comandos deben cumplir las políticas de lista de permitidos o de propietario para mensajes directos o salas igual que con los mensajes normales.

## Varias cuentas

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Los valores de nivel superior de `channels.matrix` actúan como predeterminados para las cuentas con nombre, salvo que una cuenta los sobrescriba.
Puedes limitar entradas de sala heredadas a una cuenta de Matrix con `groups.<room>.account`.
Las entradas sin `account` permanecen compartidas entre todas las cuentas de Matrix, y las entradas con `account: "default"` siguen funcionando cuando la cuenta predeterminada está configurada directamente en `channels.matrix.*` de nivel superior.
Los valores predeterminados parciales compartidos de autenticación no crean por sí solos una cuenta predeterminada implícita independiente. OpenClaw solo sintetiza la cuenta `default` de nivel superior cuando ese valor predeterminado tiene autenticación nueva (`homeserver` más `accessToken`, o `homeserver` más `userId` y `password`); las cuentas con nombre pueden seguir siendo detectables desde `homeserver` más `userId` cuando las credenciales en caché satisfacen la autenticación más adelante.
Si Matrix ya tiene exactamente una cuenta con nombre, o `defaultAccount` apunta a una clave de cuenta con nombre existente, la promoción de reparación/configuración de una sola cuenta a varias cuentas conserva esa cuenta en lugar de crear una entrada nueva `accounts.default`. Solo las claves de autenticación/bootstrap de Matrix se mueven a esa cuenta promovida; las claves compartidas de política de entrega permanecen en el nivel superior.
Configura `defaultAccount` cuando quieras que OpenClaw prefiera una cuenta de Matrix con nombre para el enrutamiento implícito, el sondeo y las operaciones de CLI.
Si hay varias cuentas de Matrix configuradas y un ID de cuenta es `default`, OpenClaw usa esa cuenta implícitamente incluso cuando `defaultAccount` no está configurado.
Si configuras varias cuentas con nombre, establece `defaultAccount` o pasa `--account <id>` para comandos de CLI que dependan de la selección implícita de cuenta.
Pasa `--account <id>` a `openclaw matrix verify ...` y `openclaw matrix devices ...` cuando quieras sobrescribir esa selección implícita para un comando.

Consulta [Referencia de configuración](/es/gateway/configuration-reference#multi-account-all-channels) para ver el patrón compartido de varias cuentas.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea homeservers de Matrix privados/internos como protección SSRF, a menos que
optes explícitamente por permitirlos por cuenta.

Si tu homeserver se ejecuta en localhost, en una IP de LAN/Tailscale o en un nombre de host interno, habilita
`network.dangerouslyAllowPrivateNetwork` para esa cuenta de Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Ejemplo de configuración por CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Esta opción solo permite destinos privados/internos de confianza. Los homeservers públicos sin cifrado, como
`http://matrix.example.org:8008`, siguen bloqueados. Siempre que sea posible, prefiere `https://`.

## Uso de proxy para el tráfico de Matrix

Si tu implementación de Matrix necesita un proxy HTTP(S) saliente explícito, configura `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Las cuentas con nombre pueden sobrescribir el valor predeterminado de nivel superior con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la misma configuración de proxy tanto para el tráfico de Matrix en tiempo de ejecución como para los sondeos de estado de la cuenta.

## Resolución de destino

Matrix acepta estas formas de destino en cualquier lugar donde OpenClaw te pida un objetivo de sala o usuario:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

La búsqueda en el directorio en vivo usa la cuenta de Matrix con sesión iniciada:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese homeserver.
- Las búsquedas de salas aceptan directamente IDs y alias de sala explícitos y luego recurren a buscar nombres de salas unidas para esa cuenta.
- La búsqueda por nombre de sala unida es de mejor esfuerzo. Si un nombre de sala no puede resolverse a un ID o alias, se ignora en la resolución de la lista de permitidos en tiempo de ejecución.

## Referencia de configuración

- `enabled`: habilita o deshabilita el canal.
- `name`: etiqueta opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferido cuando hay varias cuentas de Matrix configuradas.
- `homeserver`: URL del homeserver, por ejemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta de Matrix se conecte a homeservers privados/internos. Habilítalo cuando el homeserver se resuelva a `localhost`, una IP de LAN/Tailscale o un host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para el tráfico de Matrix. Las cuentas con nombre pueden sobrescribir el valor predeterminado de nivel superior con su propio `proxy`.
- `userId`: ID completo de usuario de Matrix, por ejemplo `@bot:example.org`.
- `accessToken`: token de acceso para autenticación basada en token. Se admiten valores en texto plano y valores SecretRef para `channels.matrix.accessToken` y `channels.matrix.accounts.<id>.accessToken` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto plano y valores SecretRef.
- `deviceId`: ID explícito de dispositivo de Matrix.
- `deviceName`: nombre visible del dispositivo para inicio de sesión con contraseña.
- `avatarUrl`: URL del avatar propio almacenada para sincronización del perfil y actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos recuperados durante la sincronización de inicio.
- `encryption`: habilita E2EE.
- `allowlistOnly`: cuando es `true`, actualiza la política de sala `open` a `allowlist` y fuerza todas las políticas activas de mensajes directos excepto `disabled` (incluidas `pairing` y `open`) a `allowlist`. No afecta a las políticas `disabled`.
- `allowBots`: permite mensajes de otras cuentas configuradas de Matrix de OpenClaw (`true` o `"mentions"`).
- `groupPolicy`: `open`, `allowlist` o `disabled`.
- `contextVisibility`: modo de visibilidad del contexto adicional de sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista de permitidos de IDs de usuario para tráfico de sala. Los IDs completos de usuario de Matrix son los más seguros; las coincidencias exactas del directorio se resuelven al inicio y cuando cambia la lista de permitidos mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `historyLimit`: máximo de mensajes de sala que se incluirán como contexto de historial de grupo. Recurre a `messages.groupChat.historyLimit`; si ambos no están definidos, el valor efectivo predeterminado es `0`. Configura `0` para desactivar.
- `replyToMode`: `off`, `first`, `all` o `batched`.
- `markdown`: configuración opcional de renderizado Markdown para texto saliente de Matrix.
- `streaming`: `off` (predeterminado), `"partial"`, `"quiet"`, `true` o `false`. `"partial"` y `true` habilitan actualizaciones de borrador con vista previa primero usando mensajes de texto normales de Matrix. `"quiet"` usa avisos de vista previa sin notificación para configuraciones autohospedadas con reglas push. `false` equivale a `"off"`.
- `blockStreaming`: `true` habilita mensajes de progreso separados para bloques completados del asistente mientras el streaming de borrador de vista previa está activo.
- `threadReplies`: `off`, `inbound` o `always`.
- `threadBindings`: sobrescrituras por canal para el enrutamiento y ciclo de vida de sesiones enlazadas a hilos.
- `startupVerification`: modo automático de solicitud de autoverificación al inicio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: período de espera antes de volver a intentar solicitudes automáticas de verificación al inicio.
- `textChunkLimit`: tamaño del fragmento de mensaje saliente en caracteres (se aplica cuando `chunkMode` es `length`).
- `chunkMode`: `length` divide los mensajes por número de caracteres; `newline` los divide por saltos de línea.
- `responsePrefix`: cadena opcional añadida al principio de todas las respuestas salientes para este canal.
- `ackReaction`: sobrescritura opcional de reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: sobrescritura opcional del alcance de la reacción de confirmación (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificación de reacciones entrantes (`own`, `off`).
- `mediaMaxMb`: límite de tamaño multimedia en MB para envíos salientes y procesamiento multimedia entrante.
- `autoJoin`: política de unión automática por invitación (`always`, `allowlist`, `off`). Predeterminado: `off`. Se aplica a todas las invitaciones de Matrix, incluidas las de tipo mensaje directo.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `allowlist`. Las entradas de alias se resuelven a IDs de sala durante el manejo de la invitación; OpenClaw no confía en el estado de alias declarado por la sala invitada.
- `dm`: bloque de política de mensajes directos (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla el acceso a mensajes directos después de que OpenClaw se haya unido a la sala y la haya clasificado como mensaje directo. No cambia si una invitación se une automáticamente.
- `dm.allowFrom`: lista de permitidos de IDs de usuario para tráfico de mensajes directos. Los IDs completos de usuario de Matrix son los más seguros; las coincidencias exactas del directorio se resuelven al inicio y cuando cambia la lista de permitidos mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `dm.sessionScope`: `per-user` (predeterminado) o `per-room`. Usa `per-room` cuando quieras que cada sala de mensaje directo de Matrix mantenga contexto separado aunque el par sea el mismo.
- `dm.threadReplies`: sobrescritura de política de hilos solo para mensajes directos (`off`, `inbound`, `always`). Sobrescribe la configuración de nivel superior `threadReplies` tanto para la ubicación de respuestas como para el aislamiento de sesión en mensajes directos.
- `execApprovals`: entrega nativa de aprobaciones de ejecución de Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: IDs de usuario de Matrix autorizados para aprobar solicitudes de ejecución. Opcional cuando `dm.allowFrom` ya identifica a los aprobadores.
- `execApprovals.target`: `dm | channel | both` (predeterminado: `dm`).
- `accounts`: sobrescrituras nombradas por cuenta. Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para estas entradas.
- `groups`: mapa de políticas por sala. Se prefieren IDs o alias de sala; los nombres de sala no resueltos se ignoran en tiempo de ejecución. La identidad de sesión/grupo usa el ID de sala estable después de la resolución.
- `groups.<room>.account`: restringe una entrada de sala heredada a una cuenta específica de Matrix en configuraciones de varias cuentas.
- `groups.<room>.allowBots`: sobrescritura a nivel de sala para remitentes configurados como bots (`true` o `"mentions"`).
- `groups.<room>.users`: lista de permitidos de remitentes por sala.
- `groups.<room>.tools`: sobrescrituras de permitir/denegar herramientas por sala.
- `groups.<room>.autoReply`: sobrescritura a nivel de sala para el filtrado por mención. `true` desactiva los requisitos de mención para esa sala; `false` los vuelve a forzar.
- `groups.<room>.skills`: filtro opcional de Skills a nivel de sala.
- `groups.<room>.systemPrompt`: fragmento opcional de prompt de sistema a nivel de sala.
- `rooms`: alias heredado de `groups`.
- `actions`: control de herramientas por acción (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Groups](/es/channels/groups) — comportamiento del chat grupal y filtrado por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
