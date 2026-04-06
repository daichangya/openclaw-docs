---
read_when:
    - Configurar Matrix en OpenClaw
    - Configurar Matrix E2EE y la verificación
summary: Estado de compatibilidad de Matrix, configuración y ejemplos de configuración
title: Matrix
x-i18n:
    generated_at: "2026-04-06T03:07:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e2d84c08d7d5b96db14b914e54f08d25334401cdd92eb890bc8dfb37b0ca2dc
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix es el plugin de canal empaquetado de Matrix para OpenClaw.
Usa el `matrix-js-sdk` oficial y admite MD, salas, hilos, medios, reacciones, encuestas, ubicación y E2EE.

## Plugin empaquetado

Matrix se incluye como plugin empaquetado en las versiones actuales de OpenClaw, por lo que las
compilaciones empaquetadas normales no necesitan una instalación separada.

Si estás en una compilación anterior o una instalación personalizada que excluye Matrix, instálalo
manualmente:

Instalar desde npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar desde una copia local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulta [Plugins](/es/tools/plugin) para conocer el comportamiento del plugin y las reglas de instalación.

## Configuración

1. Asegúrate de que el plugin de Matrix esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones anteriores/personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Crea una cuenta de Matrix en tu homeserver.
3. Configura `channels.matrix` con una de estas opciones:
   - `homeserver` + `accessToken`, o
   - `homeserver` + `userId` + `password`.
4. Reinicia la gateway.
5. Inicia una MD con el bot o invítalo a una sala.

Rutas de configuración interactiva:

```bash
openclaw channels add
openclaw configure --section channels
```

Lo que realmente pregunta el asistente de Matrix:

- URL del homeserver
- método de autenticación: token de acceso o contraseña
- ID de usuario solo cuando eliges autenticación con contraseña
- nombre de dispositivo opcional
- si se debe habilitar E2EE
- si se debe configurar ahora el acceso a salas de Matrix

Comportamiento del asistente que importa:

- Si las variables de entorno de autenticación de Matrix ya existen para la cuenta seleccionada, y esa cuenta todavía no tiene autenticación guardada en la configuración, el asistente ofrece un atajo de entorno y solo escribe `enabled: true` para esa cuenta.
- Cuando añades otra cuenta de Matrix de forma interactiva, el nombre de cuenta introducido se normaliza en el ID de cuenta usado en la configuración y en las variables de entorno. Por ejemplo, `Ops Bot` se convierte en `ops-bot`.
- Las indicaciones de lista de permitidos de MD aceptan valores completos `@user:server` de inmediato. Los nombres para mostrar solo funcionan cuando la búsqueda activa en el directorio encuentra una coincidencia exacta; de lo contrario, el asistente te pide que vuelvas a intentarlo con un ID completo de Matrix.
- Las indicaciones de lista de permitidos de salas aceptan IDs y alias de sala directamente. También pueden resolver en vivo nombres de salas unidas, pero los nombres no resueltos solo se conservan tal como se escribieron durante la configuración y después se ignoran en la resolución de lista de permitidos en tiempo de ejecución. Prefiere `!room:server` o `#alias:server`.
- La identidad de sala/sesión en tiempo de ejecución usa el ID estable de sala de Matrix. Los alias declarados en la sala solo se usan como entradas de búsqueda, no como clave de sesión a largo plazo ni como identidad estable del grupo.
- Para resolver nombres de salas antes de guardarlos, usa `openclaw channels resolve --channel matrix "Project Room"`.

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
Cuando existen credenciales en caché allí, OpenClaw trata Matrix como configurado para configuración, doctor y detección del estado del canal, incluso si la autenticación actual no está establecida directamente en la configuración.

Equivalentes en variables de entorno (se usan cuando la clave de configuración no está definida):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Para cuentas no predeterminadas, usa variables de entorno con alcance de cuenta:

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

Matrix escapa la puntuación en los IDs de cuenta para evitar colisiones en las variables de entorno con alcance.
Por ejemplo, `-` se convierte en `_X2D_`, por lo que `ops-prod` se asigna a `MATRIX_OPS_X2D_PROD_*`.

El asistente interactivo solo ofrece el atajo de variable de entorno cuando esas variables de autenticación ya están presentes y la cuenta seleccionada todavía no tiene autenticación de Matrix guardada en la configuración.

## Ejemplo de configuración

Esta es una configuración base práctica con emparejamiento de MD, lista de permitidos de salas y E2EE habilitado:

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

## Vistas previas en streaming

El streaming de respuestas de Matrix es opcional.

Establece `channels.matrix.streaming` en `"partial"` cuando quieras que OpenClaw envíe una sola vista previa
en vivo, edite esa vista previa en su lugar mientras el modelo genera texto y luego la finalice cuando la
respuesta termine:

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
- `streaming: "partial"` crea un mensaje de vista previa editable para el bloque actual del asistente usando mensajes de texto normales de Matrix. Esto preserva el comportamiento heredado de Matrix de notificación primero por vista previa, por lo que los clientes estándar pueden notificar sobre el primer texto transmitido en streaming en lugar del bloque terminado.
- `streaming: "quiet"` crea un aviso silencioso de vista previa editable para el bloque actual del asistente. Úsalo solo cuando también configures reglas push del destinatario para las ediciones finalizadas de la vista previa.
- `blockStreaming: true` habilita mensajes de progreso de Matrix separados. Con la vista previa por streaming habilitada, Matrix mantiene el borrador en vivo para el bloque actual y conserva los bloques completados como mensajes separados.
- Cuando la vista previa por streaming está activada y `blockStreaming` está desactivado, Matrix edita el borrador en vivo en su lugar y finaliza ese mismo evento cuando termina el bloque o el turno.
- Si la vista previa ya no cabe en un solo evento de Matrix, OpenClaw detiene la vista previa por streaming y vuelve a la entrega final normal.
- Las respuestas con medios siguen enviando los adjuntos normalmente. Si una vista previa obsoleta ya no puede reutilizarse de forma segura, OpenClaw la redacta antes de enviar la respuesta final con medios.
- Las ediciones de vista previa generan llamadas adicionales a la API de Matrix. Deja el streaming desactivado si quieres el comportamiento más conservador respecto a límites de tasa.

`blockStreaming` no habilita por sí solo las vistas previas de borrador.
Usa `streaming: "partial"` o `streaming: "quiet"` para las ediciones de vista previa; luego añade `blockStreaming: true` solo si también quieres que los bloques completados del asistente sigan visibles como mensajes de progreso separados.

Si necesitas notificaciones estándar de Matrix sin reglas push personalizadas, usa `streaming: "partial"` para el comportamiento de vista previa primero o deja `streaming` desactivado para entrega solo final. Con `streaming: "off"`:

- `blockStreaming: true` envía cada bloque terminado como un mensaje normal de Matrix con notificación.
- `blockStreaming: false` envía solo la respuesta final completada como un mensaje normal de Matrix con notificación.

### Reglas push autoalojadas para vistas previas silenciosas finalizadas

Si ejecutas tu propia infraestructura de Matrix y quieres que las vistas previas silenciosas notifiquen solo cuando un bloque o
la respuesta final estén terminados, establece `streaming: "quiet"` y añade una regla push por usuario para las ediciones finalizadas de la vista previa.

Normalmente esto se configura por usuario destinatario, no como un cambio global del homeserver:

Mapa rápido antes de empezar:

- usuario destinatario = la persona que debe recibir la notificación
- usuario bot = la cuenta de Matrix de OpenClaw que envía la respuesta
- usa el token de acceso del usuario destinatario para las llamadas a la API de abajo
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

2. Asegúrate de que la cuenta del destinatario ya reciba notificaciones push normales de Matrix. Las
   reglas de vista previa silenciosa solo funcionan si ese usuario ya tiene pushers/dispositivos funcionando.

3. Obtén el token de acceso del usuario destinatario.
   - Usa el token del usuario receptor, no el del bot.
   - Reutilizar un token de una sesión de cliente existente suele ser lo más sencillo.
   - Si necesitas emitir un token nuevo, puedes iniciar sesión mediante la API estándar Client-Server de Matrix:

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

Si esto no devuelve pushers/dispositivos activos, primero corrige las notificaciones normales de Matrix antes de añadir la
regla de OpenClaw de abajo.

OpenClaw marca las ediciones finalizadas de vista previa de solo texto con:

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

- Las reglas push se indexan por `ruleId`. Volver a ejecutar `PUT` con el mismo ID de regla actualiza esa regla.
- Si un usuario receptor debe recibir notificaciones de varias cuentas de bot de Matrix de OpenClaw, crea una regla por bot con un ID de regla único para cada coincidencia de remitente.
- Un patrón sencillo es `openclaw-finalized-preview-<botname>`, como `openclaw-finalized-preview-ops` o `openclaw-finalized-preview-support`.

La regla se evalúa contra el remitente del evento:

- autentícate con el token del usuario receptor
- haz coincidir `sender` con el MXID del bot de OpenClaw

6. Verifica que la regla existe:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Prueba una respuesta transmitida por streaming. En modo silencioso, la sala debe mostrar una vista previa silenciosa de borrador y la
   edición final en su lugar debe notificar una vez que termine el bloque o el turno.

Si necesitas eliminar la regla más adelante, borra ese mismo ID de regla con el token del usuario receptor:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Notas:

- Crea la regla con el token de acceso del usuario receptor, no con el del bot.
- Las nuevas reglas `override` definidas por el usuario se insertan antes de las reglas predeterminadas de supresión, por lo que no se necesita ningún parámetro adicional de orden.
- Esto solo afecta a las ediciones de vista previa de solo texto que OpenClaw puede finalizar de forma segura en su lugar. Los reemplazos para medios y las recuperaciones por vista previa obsoleta siguen usando la entrega normal de Matrix.
- Si `GET /_matrix/client/v3/pushers` no muestra pushers, ese usuario todavía no tiene entrega push de Matrix funcionando para esta cuenta/dispositivo.

#### Synapse

Para Synapse, la configuración anterior normalmente es suficiente por sí sola:

- No se requiere ningún cambio especial en `homeserver.yaml` para las notificaciones de vista previa finalizada de OpenClaw.
- Si tu despliegue de Synapse ya envía notificaciones push normales de Matrix, el token del usuario + la llamada `pushrules` anterior es el paso principal de configuración.
- Si ejecutas Synapse detrás de un proxy inverso o workers, asegúrate de que `/_matrix/client/.../pushrules/` llegue a Synapse correctamente.
- Si ejecutas workers de Synapse, asegúrate de que los pushers estén en buen estado. La entrega push la gestiona el proceso principal o `synapse.app.pusher` / los workers de pusher configurados.

#### Tuwunel

Para Tuwunel, usa el mismo flujo de configuración y la misma llamada a la API `pushrules` mostrada arriba:

- No se requiere ninguna configuración específica de Tuwunel para el propio marcador de vista previa finalizada.
- Si las notificaciones normales de Matrix ya funcionan para ese usuario, el token del usuario + la llamada `pushrules` anterior es el paso principal de configuración.
- Si parece que las notificaciones desaparecen mientras el usuario está activo en otro dispositivo, comprueba si `suppress_push_when_active` está habilitado. Tuwunel añadió esta opción en Tuwunel 1.4.2 el 12 de septiembre de 2025, y puede suprimir intencionadamente las notificaciones push hacia otros dispositivos mientras uno está activo.

## Cifrado y verificación

En las salas cifradas (E2EE), los eventos salientes de imagen usan `thumbnail_file` para que las vistas previas de imagen se cifren junto con el adjunto completo. Las salas no cifradas siguen usando `thumbnail_url` sin cifrar. No se necesita ninguna configuración: el plugin detecta automáticamente el estado de E2EE.

### Salas bot a bot

De forma predeterminada, los mensajes de otras cuentas configuradas de Matrix de OpenClaw se ignoran.

Usa `allowBots` cuando quieras intencionadamente tráfico de Matrix entre agentes:

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

- `allowBots: true` acepta mensajes de otras cuentas de bot de Matrix configuradas en salas permitidas y MD.
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas. Las MD siguen estando permitidas.
- `groups.<room>.allowBots` sustituye la configuración a nivel de cuenta para una sala.
- OpenClaw sigue ignorando los mensajes del mismo ID de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no expone aquí una marca nativa de bot; OpenClaw trata “creado por bot” como “enviado por otra cuenta de Matrix configurada en esta gateway de OpenClaw”.

Usa listas de permitidos estrictas de salas y requisitos de mención cuando habilites tráfico bot a bot en salas compartidas.

Habilitar el cifrado:

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

Incluir la clave de recuperación almacenada en la salida legible por máquina:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inicializar el estado de cross-signing y verificación:

```bash
openclaw matrix verify bootstrap
```

Compatibilidad con múltiples cuentas: usa `channels.matrix.accounts` con credenciales por cuenta y `name` opcional. Consulta [Referencia de configuración](/es/gateway/configuration-reference#multi-account-all-channels) para el patrón compartido.

Diagnóstico detallado del bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forzar un restablecimiento nuevo de identidad de cross-signing antes del bootstrap:

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

Comprobar el estado de salud de la copia de seguridad de claves de sala:

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

Diagnóstico detallado de la restauración:

```bash
openclaw matrix verify backup restore --verbose
```

Eliminar la copia de seguridad actual del servidor y crear una nueva base de copia de seguridad. Si la
clave de copia de seguridad almacenada no puede cargarse limpiamente, este restablecimiento también puede recrear el almacenamiento secreto para que
los futuros arranques en frío puedan cargar la nueva clave de copia de seguridad:

```bash
openclaw matrix verify backup reset --yes
```

Todos los comandos `verify` son concisos de forma predeterminada (incluido el registro interno silencioso del SDK) y solo muestran diagnósticos detallados con `--verbose`.
Usa `--json` para una salida completa legible por máquina al crear scripts.

En configuraciones de múltiples cuentas, los comandos CLI de Matrix usan la cuenta predeterminada implícita de Matrix salvo que pases `--account <id>`.
Si configuras varias cuentas con nombre, establece primero `channels.matrix.defaultAccount` o esas operaciones implícitas de CLI se detendrán y te pedirán que elijas una cuenta explícitamente.
Usa `--account` siempre que quieras que las operaciones de verificación o de dispositivo apunten explícitamente a una cuenta con nombre:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Cuando el cifrado está deshabilitado o no disponible para una cuenta con nombre, las advertencias y errores de verificación de Matrix apuntan a la clave de configuración de esa cuenta, por ejemplo `channels.matrix.accounts.assistant.encryption`.

### Qué significa "verified"

OpenClaw trata este dispositivo de Matrix como verificado solo cuando está verificado por tu propia identidad de cross-signing.
En la práctica, `openclaw matrix verify status --verbose` expone tres señales de confianza:

- `Locally trusted`: este dispositivo es de confianza solo para el cliente actual
- `Cross-signing verified`: el SDK informa que el dispositivo está verificado mediante cross-signing
- `Signed by owner`: el dispositivo está firmado por tu propia clave de autofirma

`Verified by owner` pasa a ser `yes` solo cuando existe verificación por cross-signing o firma del propietario.
La confianza local por sí sola no es suficiente para que OpenClaw trate el dispositivo como completamente verificado.

### Qué hace bootstrap

`openclaw matrix verify bootstrap` es el comando de reparación y configuración para cuentas cifradas de Matrix.
Hace todo lo siguiente en este orden:

- inicializa el almacenamiento secreto, reutilizando una clave de recuperación existente cuando sea posible
- inicializa el cross-signing y sube las claves públicas de cross-signing que falten
- intenta marcar y firmar con cross-signing el dispositivo actual
- crea una nueva copia de seguridad de claves de sala en el servidor si todavía no existe

Si el homeserver requiere autenticación interactiva para subir claves de cross-signing, OpenClaw intenta primero la subida sin autenticación, luego con `m.login.dummy` y después con `m.login.password` cuando `channels.matrix.password` está configurado.

Usa `--force-reset-cross-signing` solo cuando realmente quieras descartar la identidad actual de cross-signing y crear una nueva.

Si intencionadamente quieres descartar la copia de seguridad actual de claves de sala y empezar una nueva
base de copia de seguridad para mensajes futuros, usa `openclaw matrix verify backup reset --yes`.
Hazlo solo si aceptas que el historial cifrado antiguo irrecuperable seguirá
sin estar disponible y que OpenClaw puede recrear el almacenamiento secreto si el secreto actual de copia de seguridad
no puede cargarse de forma segura.

### Nueva base de copia de seguridad

Si quieres mantener funcionando los futuros mensajes cifrados y aceptas perder el historial antiguo irrecuperable, ejecuta estos comandos en orden:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Añade `--account <id>` a cada comando cuando quieras apuntar explícitamente a una cuenta de Matrix con nombre.

### Comportamiento al inicio

Cuando `encryption: true`, Matrix establece `startupVerification` de forma predeterminada en `"if-unverified"`.
Al iniciarse, si este dispositivo sigue sin verificarse, Matrix solicitará la autoverificación en otro cliente de Matrix,
omitirá solicitudes duplicadas mientras ya haya una pendiente y aplicará un enfriamiento local antes de volver a intentarlo tras reinicios.
Los intentos fallidos de solicitud vuelven a intentarse antes que la creación exitosa de solicitudes, de forma predeterminada.
Establece `startupVerification: "off"` para deshabilitar las solicitudes automáticas al inicio, o ajusta `startupVerificationCooldownHours`
si quieres una ventana de reintento más corta o más larga.

El inicio también realiza automáticamente una pasada conservadora de bootstrap criptográfico.
Esa pasada intenta reutilizar primero el almacenamiento secreto actual y la identidad actual de cross-signing, y evita restablecer el cross-signing salvo que ejecutes un flujo explícito de reparación de bootstrap.

Si durante el inicio se detecta un estado de bootstrap roto y `channels.matrix.password` está configurado, OpenClaw puede intentar una ruta de reparación más estricta.
Si el dispositivo actual ya está firmado por el propietario, OpenClaw preserva esa identidad en lugar de restablecerla automáticamente.

Actualización desde el plugin público anterior de Matrix:

- OpenClaw reutiliza automáticamente la misma cuenta de Matrix, token de acceso e identidad de dispositivo cuando es posible.
- Antes de ejecutar cualquier cambio de migración de Matrix que requiera acción, OpenClaw crea o reutiliza una instantánea de recuperación en `~/Backups/openclaw-migrations/`.
- Si usas varias cuentas de Matrix, establece `channels.matrix.defaultAccount` antes de actualizar desde el diseño anterior de almacenamiento plano para que OpenClaw sepa qué cuenta debe recibir ese estado heredado compartido.
- Si el plugin anterior almacenaba localmente una clave de descifrado de copia de seguridad de claves de sala de Matrix, el inicio o `openclaw doctor --fix` la importarán automáticamente al nuevo flujo de clave de recuperación.
- Si el token de acceso de Matrix cambió después de preparar la migración, el inicio ahora explora raíces de almacenamiento hermanas por hash de token en busca de estado heredado pendiente de restauración antes de abandonar la restauración automática de la copia de seguridad.
- Si el token de acceso de Matrix cambia más adelante para la misma cuenta, homeserver y usuario, OpenClaw ahora prefiere reutilizar la raíz de almacenamiento por hash de token existente más completa en lugar de empezar desde un directorio de estado de Matrix vacío.
- En el siguiente inicio de la gateway, las claves de sala respaldadas se restauran automáticamente en el nuevo almacén criptográfico.
- Si el plugin anterior tenía claves de sala solo locales que nunca se respaldaron, OpenClaw mostrará una advertencia clara. Esas claves no se pueden exportar automáticamente desde el almacén criptográfico Rust anterior, por lo que parte del historial cifrado antiguo puede seguir sin estar disponible hasta recuperarse manualmente.
- Consulta [Migración de Matrix](/es/install/migrating-matrix) para ver el flujo completo de actualización, límites, comandos de recuperación y mensajes comunes de migración.

El estado cifrado en tiempo de ejecución se organiza bajo raíces por cuenta, usuario y hash de token en
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ese directorio contiene el almacén de sincronización (`bot-storage.json`), el almacén criptográfico (`crypto/`),
el archivo de clave de recuperación (`recovery-key.json`), la instantánea de IndexedDB (`crypto-idb-snapshot.json`),
los enlaces de hilos (`thread-bindings.json`) y el estado de verificación al inicio (`startup-verification.json`)
cuando esas funciones están en uso.
Cuando el token cambia pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor
raíz existente para esa tupla cuenta/homeserver/usuario, de modo que el estado previo de sincronización, estado criptográfico, enlaces de hilos
y estado de verificación al inicio sigan visibles.

### Modelo de almacén criptográfico de Node

Matrix E2EE en este plugin usa la ruta oficial de criptografía Rust de `matrix-js-sdk` en Node.
Esa ruta espera persistencia basada en IndexedDB cuando quieres que el estado criptográfico sobreviva a los reinicios.

OpenClaw actualmente lo proporciona en Node mediante:

- usar `fake-indexeddb` como la capa de API IndexedDB esperada por el SDK
- restaurar el contenido de IndexedDB del cifrado Rust desde `crypto-idb-snapshot.json` antes de `initRustCrypto`
- persistir el contenido actualizado de IndexedDB de nuevo en `crypto-idb-snapshot.json` después de la inicialización y durante la ejecución
- serializar la restauración y persistencia de la instantánea frente a `crypto-idb-snapshot.json` con un bloqueo de archivo consultivo para que la persistencia en tiempo de ejecución de la gateway y el mantenimiento de CLI no compitan sobre el mismo archivo de instantánea

Esto es compatibilidad/infraestructura de almacenamiento, no una implementación criptográfica personalizada.
El archivo de instantánea es estado sensible en tiempo de ejecución y se almacena con permisos de archivo restrictivos.
Según el modelo de seguridad de OpenClaw, el host de la gateway y el directorio de estado local de OpenClaw ya están dentro del límite de confianza del operador, por lo que esto es principalmente una cuestión operativa de durabilidad y no un límite de confianza remoto separado.

Mejora planificada:

- añadir compatibilidad con SecretRef para material persistente de claves de Matrix, de modo que las claves de recuperación y secretos relacionados de cifrado del almacén puedan obtenerse de proveedores de secretos de OpenClaw en lugar de solo de archivos locales

## Gestión del perfil

Actualiza el perfil propio de Matrix para la cuenta seleccionada con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Añade `--account <id>` cuando quieras apuntar explícitamente a una cuenta de Matrix con nombre.

Matrix acepta directamente URL de avatar `mxc://`. Cuando pasas una URL de avatar `http://` o `https://`, OpenClaw la sube primero a Matrix y almacena la URL `mxc://` resuelta de nuevo en `channels.matrix.avatarUrl` (o en la sustitución de la cuenta seleccionada).

## Avisos automáticos de verificación

Ahora Matrix publica avisos del ciclo de vida de verificación directamente en la sala estricta de MD de verificación como mensajes `m.notice`.
Eso incluye:

- avisos de solicitud de verificación
- avisos de verificación lista (con guía explícita de "Verify by emoji")
- avisos de inicio y finalización de verificación
- detalles SAS (emoji y decimal) cuando estén disponibles

Las solicitudes de verificación entrantes desde otro cliente de Matrix se rastrean y OpenClaw las acepta automáticamente.
Para los flujos de autoverificación, OpenClaw también inicia automáticamente el flujo SAS cuando la verificación por emoji está disponible y confirma su propio lado.
Para solicitudes de verificación desde otro usuario/dispositivo de Matrix, OpenClaw acepta automáticamente la solicitud y luego espera a que el flujo SAS continúe con normalidad.
Aun así, necesitas comparar el SAS de emoji o decimal en tu cliente de Matrix y confirmar allí "They match" para completar la verificación.

OpenClaw no acepta automáticamente a ciegas flujos duplicados iniciados por sí mismo. El inicio omite crear una nueva solicitud cuando ya hay una solicitud de autoverificación pendiente.

Los avisos de protocolo/sistema de verificación no se reenvían a la canalización de chat del agente, por lo que no producen `NO_REPLY`.

### Higiene de dispositivos

Los dispositivos antiguos de Matrix gestionados por OpenClaw pueden acumularse en la cuenta y dificultar el razonamiento sobre la confianza en salas cifradas.
Haz una lista con:

```bash
openclaw matrix devices list
```

Elimina dispositivos obsoletos gestionados por OpenClaw con:

```bash
openclaw matrix devices prune-stale
```

### Reparación de sala directa

Si el estado del mensaje directo se desincroniza, OpenClaw puede terminar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar de a la MD activa. Inspecciona la asignación actual de un par con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárala con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

La reparación mantiene la lógica específica de Matrix dentro del plugin:

- prefiere una MD estricta 1:1 que ya esté asignada en `m.direct`
- de lo contrario, recurre a cualquier MD estricta 1:1 actualmente unida con ese usuario
- si no existe una MD en buen estado, crea una nueva sala directa y reescribe `m.direct` para que apunte a ella

El flujo de reparación no elimina automáticamente las salas antiguas. Solo elige la MD en buen estado y actualiza la asignación para que los nuevos envíos de Matrix, avisos de verificación y otros flujos de mensaje directo vuelvan a apuntar a la sala correcta.

## Hilos

Matrix admite hilos nativos de Matrix tanto para respuestas automáticas como para envíos de herramientas de mensajes.

- `dm.sessionScope: "per-user"` (predeterminado) mantiene el enrutamiento de MD de Matrix con ámbito del remitente, por lo que varias salas de MD pueden compartir una sesión cuando se resuelven al mismo par.
- `dm.sessionScope: "per-room"` aísla cada sala de MD de Matrix en su propia clave de sesión mientras sigue usando comprobaciones normales de autenticación de MD y lista de permitidos.
- Los enlaces explícitos de conversación de Matrix siguen teniendo prioridad sobre `dm.sessionScope`, por lo que las salas e hilos enlazados conservan su sesión de destino elegida.
- `threadReplies: "off"` mantiene las respuestas al nivel superior y conserva los mensajes entrantes en hilo en la sesión padre.
- `threadReplies: "inbound"` responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `threadReplies: "always"` mantiene las respuestas de sala en un hilo enraizado en el mensaje activador y enruta esa conversación a través de la sesión con ámbito de hilo correspondiente desde el primer mensaje activador.
- `dm.threadReplies` sustituye la configuración de nivel superior solo para las MD. Por ejemplo, puedes mantener aislados los hilos de sala mientras mantienes planas las MD.
- Los mensajes entrantes en hilo incluyen el mensaje raíz del hilo como contexto adicional del agente.
- Los envíos de herramientas de mensajes ahora heredan automáticamente el hilo actual de Matrix cuando el destino es la misma sala, o el mismo destino de usuario de MD, salvo que se proporcione un `threadId` explícito.
- La reutilización del destino de usuario de MD de la misma sesión solo se activa cuando los metadatos de la sesión actual demuestran el mismo par de MD en la misma cuenta de Matrix; en caso contrario, OpenClaw vuelve al enrutamiento normal con ámbito de usuario.
- Cuando OpenClaw detecta que una sala de MD de Matrix colisiona con otra sala de MD en la misma sesión compartida de MD de Matrix, publica un único `m.notice` en esa sala con la vía de escape `/focus` cuando los enlaces de hilos están habilitados y con la sugerencia `dm.sessionScope`.
- Los enlaces de hilos en tiempo de ejecución son compatibles con Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` enlazado a hilo ahora funcionan en salas y MD de Matrix.
- `/focus` de sala/MD de Matrix al nivel superior crea un nuevo hilo de Matrix y lo enlaza con la sesión de destino cuando `threadBindings.spawnSubagentSessions=true`.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo de Matrix existente enlaza ese hilo actual en su lugar.

## Enlaces de conversación ACP

Las salas, MD e hilos existentes de Matrix pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la superficie de chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro de la MD, sala o hilo existente de Matrix que quieras seguir usando.
- En una MD o sala de Matrix de nivel superior, la MD/sala actual permanece como superficie de chat y los mensajes futuros se enrutan a la sesión ACP generada.
- Dentro de un hilo existente de Matrix, `--bind here` enlaza ese hilo actual en su lugar.
- `/new` y `/reset` restablecen la misma sesión ACP enlazada en su lugar.
- `/acp close` cierra la sesión ACP y elimina el enlace.

Notas:

- `--bind here` no crea un hilo hijo de Matrix.
- `threadBindings.spawnAcpSessions` solo se requiere para `/acp spawn --thread auto|here`, donde OpenClaw necesita crear o enlazar un hilo hijo de Matrix.

### Configuración de enlace de hilos

Matrix hereda valores globales predeterminados de `session.threadBindings`, y también admite sustituciones por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Las marcas de generación enlazada a hilos de Matrix son opcionales:

- Establece `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nivel superior cree y enlace nuevos hilos de Matrix.
- Establece `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` enlace sesiones ACP a hilos de Matrix.

## Reacciones

Matrix admite acciones de reacción salientes, notificaciones de reacción entrantes y reacciones de confirmación entrantes.

- Las herramientas de reacción saliente están controladas por `channels["matrix"].actions.reactions`.
- `react` añade una reacción a un evento específico de Matrix.
- `reactions` enumera el resumen actual de reacciones de un evento específico de Matrix.
- `emoji=""` elimina las propias reacciones de la cuenta del bot sobre ese evento.
- `remove: true` elimina solo la reacción de emoji especificada de la cuenta del bot.

El alcance de las reacciones de confirmación se resuelve en este orden estándar de OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- alternativa con emoji de identidad del agente

El alcance de la reacción de confirmación se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

El modo de notificación de reacciones se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predeterminado: `own`

Comportamiento actual:

- `reactionNotifications: "own"` reenvía eventos `m.reaction` añadidos cuando apuntan a mensajes de Matrix creados por el bot.
- `reactionNotifications: "off"` deshabilita los eventos del sistema de reacciones.
- Las eliminaciones de reacciones todavía no se sintetizan en eventos del sistema porque Matrix las presenta como redacciones, no como eliminaciones independientes de `m.reaction`.

## Contexto del historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de sala se incluyen como `InboundHistory` cuando un mensaje de sala de Matrix activa al agente.
- Recurre a `messages.groupChat.historyLimit`. Establece `0` para deshabilitarlo.
- El historial de salas de Matrix es solo de sala. Las MD siguen usando el historial normal de sesión.
- El historial de salas de Matrix es solo pendiente: OpenClaw almacena en búfer los mensajes de sala que todavía no activaron una respuesta y luego toma una instantánea de esa ventana cuando llega una mención u otro activador.
- El mensaje activador actual no se incluye en `InboundHistory`; permanece en el cuerpo principal entrante para ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la instantánea original del historial en lugar de desviarse hacia mensajes más nuevos de la sala.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para contexto suplementario de sala, como texto de respuesta recuperado, raíces de hilo e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto suplementario se conserva tal como se recibió.
- `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes permitidos por las comprobaciones activas de lista de permitidos de sala/usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero sigue conservando una respuesta citada explícita.

Esta configuración afecta a la visibilidad del contexto suplementario, no a si el propio mensaje entrante puede activar una respuesta.
La autorización del activador sigue proviniendo de `groupPolicy`, `groups`, `groupAllowFrom` y de la configuración de la política de MD.

## Ejemplo de política de MD y salas

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

Consulta [Groups](/es/channels/groups) para el comportamiento de mención obligatoria y lista de permitidos.

Ejemplo de emparejamiento para MD de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviándote mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede volver a enviar una respuesta de recordatorio tras un breve enfriamiento en lugar de generar un código nuevo.

Consulta [Pairing](/es/channels/pairing) para el flujo compartido de emparejamiento de MD y el diseño de almacenamiento.

## Aprobaciones de exec

Matrix puede actuar como cliente de aprobación de exec para una cuenta de Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; recurre a `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Los aprobadores deben ser IDs de usuario de Matrix como `@owner:example.org`. Matrix habilita automáticamente las aprobaciones nativas de exec cuando `enabled` no está definido o es `"auto"` y al menos puede resolverse un aprobador, ya sea desde `execApprovals.approvers` o desde `channels.matrix.dm.allowFrom`. Establece `enabled: false` para deshabilitar explícitamente Matrix como cliente nativo de aprobación. En caso contrario, las solicitudes de aprobación recurren a otras rutas de aprobación configuradas o a la política de respaldo de aprobación de exec.

Actualmente, el enrutamiento nativo de Matrix es solo para exec:

- `channels.matrix.execApprovals.*` controla el enrutamiento nativo de MD/canal solo para aprobaciones de exec.
- Las aprobaciones del plugin siguen usando `/approve` compartido en el mismo chat más cualquier reenvío configurado en `approvals.plugin`.
- Matrix todavía puede reutilizar `channels.matrix.dm.allowFrom` para la autorización de aprobaciones del plugin cuando puede inferir aprobadores de forma segura, pero no expone una ruta nativa separada de distribución por MD/canal para aprobaciones del plugin.

Reglas de entrega:

- `target: "dm"` envía solicitudes de aprobación a las MD de los aprobadores
- `target: "channel"` envía la solicitud de vuelta a la sala o MD de Matrix de origen
- `target: "both"` envía a las MD de los aprobadores y a la sala o MD de Matrix de origen

Las solicitudes de aprobación de Matrix siembran atajos de reacción en el mensaje principal de aprobación:

- `✅` = permitir una vez
- `❌` = denegar
- `♾️` = permitir siempre cuando esa decisión esté permitida por la política efectiva de exec

Los aprobadores pueden reaccionar a ese mensaje o usar los comandos slash alternativos: `/approve <id> allow-once`, `/approve <id> allow-always` o `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. La entrega por canal incluye el texto del comando, así que solo habilita `channel` o `both` en salas de confianza.

Las solicitudes de aprobación de Matrix reutilizan el planificador compartido de aprobaciones del núcleo. La superficie nativa específica de Matrix es solo de transporte para aprobaciones de exec: enrutamiento de sala/MD y comportamiento de envío/actualización/eliminación de mensajes.

Sustitución por cuenta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentación relacionada: [Aprobaciones de exec](/es/tools/exec-approvals)

## Ejemplo de múltiples cuentas

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

Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para las cuentas con nombre salvo que una cuenta los sustituya.
Puedes aplicar entradas de sala heredadas a una cuenta de Matrix con `groups.<room>.account` (o el heredado `rooms.<room>.account`).
Las entradas sin `account` permanecen compartidas entre todas las cuentas de Matrix, y las entradas con `account: "default"` siguen funcionando cuando la cuenta predeterminada está configurada directamente en `channels.matrix.*` de nivel superior.
Los valores predeterminados compartidos de autenticación parcial no crean por sí solos una cuenta predeterminada implícita separada. OpenClaw solo sintetiza la cuenta `default` de nivel superior cuando ese valor predeterminado tiene autenticación nueva (`homeserver` más `accessToken`, o `homeserver` más `userId` y `password`); las cuentas con nombre pueden seguir siendo detectables desde `homeserver` más `userId` cuando las credenciales en caché satisfacen la autenticación más adelante.
Si Matrix ya tiene exactamente una cuenta con nombre, o `defaultAccount` apunta a una clave de cuenta con nombre existente, la promoción de reparación/configuración de cuenta única a múltiples cuentas preserva esa cuenta en lugar de crear una nueva entrada `accounts.default`. Solo las claves de autenticación/bootstrap de Matrix se mueven a esa cuenta promocionada; las claves compartidas de política de entrega permanecen en el nivel superior.
Establece `defaultAccount` cuando quieras que OpenClaw prefiera una cuenta de Matrix con nombre para enrutamiento implícito, sondeo y operaciones de CLI.
Si configuras varias cuentas con nombre, establece `defaultAccount` o pasa `--account <id>` para comandos de CLI que dependen de la selección implícita de cuenta.
Pasa `--account <id>` a `openclaw matrix verify ...` y `openclaw matrix devices ...` cuando quieras sustituir esa selección implícita para un solo comando.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea los homeservers privados/internos de Matrix para proteger contra SSRF salvo que
los habilites explícitamente por cuenta.

Si tu homeserver se ejecuta en localhost, una IP de LAN/Tailscale o un nombre de host interno, habilita
`allowPrivateNetwork` para esa cuenta de Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
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

Esta habilitación explícita solo permite destinos privados/internos de confianza. Los homeservers públicos en texto claro, como
`http://matrix.example.org:8008`, siguen bloqueados. Prefiere `https://` siempre que sea posible.

## Uso de proxy para tráfico de Matrix

Si tu despliegue de Matrix necesita un proxy HTTP(S) saliente explícito, establece `channels.matrix.proxy`:

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

Las cuentas con nombre pueden sustituir el valor predeterminado de nivel superior con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la misma configuración de proxy para el tráfico de Matrix en tiempo de ejecución y para los sondeos de estado de cuenta.

## Resolución de destino

Matrix acepta estas formas de destino en cualquier lugar donde OpenClaw te pida un objetivo de sala o usuario:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

La búsqueda activa en directorio usa la cuenta de Matrix que ha iniciado sesión:

- Las búsquedas de usuario consultan el directorio de usuarios de Matrix en ese homeserver.
- Las búsquedas de sala aceptan directamente IDs y alias explícitos de sala, y luego recurren a buscar nombres de salas unidas para esa cuenta.
- La búsqueda por nombre de sala unida es de mejor esfuerzo. Si un nombre de sala no puede resolverse a un ID o alias, se ignora en la resolución de lista de permitidos en tiempo de ejecución.

## Referencia de configuración

- `enabled`: habilita o deshabilita el canal.
- `name`: etiqueta opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferido cuando hay varias cuentas de Matrix configuradas.
- `homeserver`: URL del homeserver, por ejemplo `https://matrix.example.org`.
- `allowPrivateNetwork`: permite que esta cuenta de Matrix se conecte a homeservers privados/internos. Habilítalo cuando el homeserver se resuelva a `localhost`, una IP de LAN/Tailscale o un host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para tráfico de Matrix. Las cuentas con nombre pueden sustituir el valor predeterminado de nivel superior con su propio `proxy`.
- `userId`: ID completo de usuario de Matrix, por ejemplo `@bot:example.org`.
- `accessToken`: token de acceso para autenticación basada en token. Se admiten valores en texto sin formato y valores SecretRef para `channels.matrix.accessToken` y `channels.matrix.accounts.<id>.accessToken` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto sin formato y valores SecretRef.
- `deviceId`: ID explícito de dispositivo de Matrix.
- `deviceName`: nombre para mostrar del dispositivo para inicio de sesión con contraseña.
- `avatarUrl`: URL almacenada del avatar propio para sincronización de perfil y actualizaciones de `set-profile`.
- `initialSyncLimit`: límite de eventos de sincronización al inicio.
- `encryption`: habilita E2EE.
- `allowlistOnly`: fuerza el comportamiento solo de lista de permitidos para MD y salas.
- `allowBots`: permite mensajes de otras cuentas configuradas de Matrix de OpenClaw (`true` o `"mentions"`).
- `groupPolicy`: `open`, `allowlist` o `disabled`.
- `contextVisibility`: modo de visibilidad del contexto suplementario de sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista de permitidos de IDs de usuario para tráfico de salas.
- Las entradas de `groupAllowFrom` deben ser IDs completos de usuario de Matrix. Los nombres no resueltos se ignoran en tiempo de ejecución.
- `historyLimit`: máximo de mensajes de sala que se incluirán como contexto de historial de grupo. Recurre a `messages.groupChat.historyLimit`. Establece `0` para deshabilitarlo.
- `replyToMode`: `off`, `first` o `all`.
- `markdown`: configuración opcional de renderizado Markdown para texto saliente de Matrix.
- `streaming`: `off` (predeterminado), `partial`, `quiet`, `true` o `false`. `partial` y `true` habilitan actualizaciones de borrador con vista previa primero usando mensajes de texto normales de Matrix. `quiet` usa avisos de vista previa sin notificación para configuraciones autoalojadas con reglas push.
- `blockStreaming`: `true` habilita mensajes de progreso separados para bloques completados del asistente mientras está activo el streaming de vista previa de borrador.
- `threadReplies`: `off`, `inbound` o `always`.
- `threadBindings`: sustituciones por canal para enrutamiento y ciclo de vida de sesión enlazada a hilos.
- `startupVerification`: modo de solicitud automática de autoverificación al inicio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: enfriamiento antes de volver a intentar solicitudes automáticas de verificación al inicio.
- `textChunkLimit`: tamaño de fragmento de mensaje saliente.
- `chunkMode`: `length` o `newline`.
- `responsePrefix`: prefijo opcional de mensaje para respuestas salientes.
- `ackReaction`: sustitución opcional de reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: sustitución opcional del alcance de reacción de confirmación (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificación de reacción entrante (`own`, `off`).
- `mediaMaxMb`: límite de tamaño de medios en MB para el manejo de medios de Matrix. Se aplica a envíos salientes y al procesamiento de medios entrantes.
- `autoJoin`: política de unión automática por invitación (`always`, `allowlist`, `off`). Predeterminado: `off`.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `allowlist`. Las entradas de alias se resuelven a IDs de sala durante el manejo de invitaciones; OpenClaw no confía en el estado de alias declarado por la sala invitante.
- `dm`: bloque de política de MD (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- Las entradas `dm.allowFrom` deben ser IDs completos de usuario de Matrix salvo que ya las hayas resuelto mediante búsqueda activa en el directorio.
- `dm.sessionScope`: `per-user` (predeterminado) o `per-room`. Usa `per-room` cuando quieras que cada sala de MD de Matrix mantenga contexto separado aunque el par sea el mismo.
- `dm.threadReplies`: sustitución de política de hilos solo para MD (`off`, `inbound`, `always`). Sustituye la configuración `threadReplies` de nivel superior tanto para la colocación de respuestas como para el aislamiento de sesión en MD.
- `execApprovals`: entrega nativa de aprobaciones de exec de Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: IDs de usuario de Matrix autorizados para aprobar solicitudes de exec. Es opcional cuando `dm.allowFrom` ya identifica a los aprobadores.
- `execApprovals.target`: `dm | channel | both` (predeterminado: `dm`).
- `accounts`: sustituciones con nombre por cuenta. Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para estas entradas.
- `groups`: mapa de políticas por sala. Prefiere IDs o alias de sala; los nombres de sala no resueltos se ignoran en tiempo de ejecución. La identidad de sesión/grupo usa el ID estable de sala tras la resolución, mientras que las etiquetas legibles para humanos siguen viniendo de los nombres de sala.
- `groups.<room>.account`: restringe una entrada de sala heredada a una cuenta específica de Matrix en configuraciones de múltiples cuentas.
- `groups.<room>.allowBots`: sustitución a nivel de sala para remitentes bot configurados (`true` o `"mentions"`).
- `groups.<room>.users`: lista de permitidos de remitentes por sala.
- `groups.<room>.tools`: sustituciones por sala de permitir/denegar herramientas.
- `groups.<room>.autoReply`: sustitución a nivel de sala para obligatoriedad de mención. `true` deshabilita el requisito de mención para esa sala; `false` lo vuelve a forzar.
- `groups.<room>.skills`: filtro opcional de Skills a nivel de sala.
- `groups.<room>.systemPrompt`: fragmento opcional de system prompt a nivel de sala.
- `rooms`: alias heredado de `groups`.
- `actions`: control por acción de herramientas (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Groups](/es/channels/groups) — comportamiento del chat grupal y obligatoriedad de mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
