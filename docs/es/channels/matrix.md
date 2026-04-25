---
read_when:
    - Configurar Matrix en OpenClaw
    - Configurar Matrix E2EE y la verificación
summary: estado de compatibilidad de Matrix, configuración inicial y ejemplos de configuración
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix es un plugin de canal incluido para OpenClaw.
Usa el `matrix-js-sdk` oficial y admite DM, salas, hilos, contenido multimedia, reacciones, encuestas, ubicación y E2EE.

## Plugin incluido

Matrix se incluye como plugin integrado en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación separada.

Si estás en una compilación más antigua o en una instalación personalizada que excluye Matrix, instálalo manualmente:

Instalar desde npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar desde una copia local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulta [Plugins](/es/tools/plugin) para conocer el comportamiento de los plugins y las reglas de instalación.

## Configuración inicial

1. Asegúrate de que el plugin de Matrix esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas o personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Crea una cuenta de Matrix en tu homeserver.
3. Configura `channels.matrix` con una de estas opciones:
   - `homeserver` + `accessToken`, o
   - `homeserver` + `userId` + `password`.
4. Reinicia el Gateway.
5. Inicia un DM con el bot o invítalo a una sala.
   - Las invitaciones nuevas de Matrix solo funcionan cuando `channels.matrix.autoJoin` las permite.

Rutas de configuración interactiva:

```bash
openclaw channels add
openclaw configure --section channels
```

El asistente de Matrix solicita:

- URL del homeserver
- método de autenticación: token de acceso o contraseña
- ID de usuario (solo autenticación por contraseña)
- nombre opcional del dispositivo
- si se debe habilitar E2EE
- si se debe configurar el acceso a salas y la unión automática por invitación

Comportamientos clave del asistente:

- Si ya existen variables de entorno de autenticación de Matrix y esa cuenta todavía no tiene autenticación guardada en la configuración, el asistente ofrece un atajo de entorno para mantener la autenticación en variables de entorno.
- Los nombres de cuenta se normalizan al ID de cuenta. Por ejemplo, `Ops Bot` pasa a ser `ops-bot`.
- Las entradas de lista de permitidos para DM aceptan `@user:server` directamente; los nombres visibles solo funcionan cuando la búsqueda en el directorio en vivo encuentra una coincidencia exacta.
- Las entradas de lista de permitidos para salas aceptan directamente IDs y alias de sala. Prefiere `!room:server` o `#alias:server`; los nombres no resueltos se ignoran en tiempo de ejecución durante la resolución de la lista de permitidos.
- En el modo de lista de permitidos para unión automática por invitación, usa solo destinos de invitación estables: `!roomId:server`, `#alias:server` o `*`. Los nombres simples de sala se rechazan.
- Para resolver nombres de sala antes de guardar, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` usa `off` de forma predeterminada.

Si lo dejas sin configurar, el bot no se unirá a salas invitadas ni a invitaciones nuevas de estilo DM, por lo que no aparecerá en grupos nuevos ni en DM invitados a menos que te unas manualmente primero.

Configura `autoJoin: "allowlist"` junto con `autoJoinAllowlist` para restringir qué invitaciones acepta, o configura `autoJoin: "always"` si quieres que se una a todas las invitaciones.

En modo `allowlist`, `autoJoinAllowlist` solo acepta `!roomId:server`, `#alias:server` o `*`.
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

Configuración basada en contraseña (el token se almacena en caché tras iniciar sesión):

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
Cuando allí existen credenciales en caché, OpenClaw considera Matrix como configurado para la configuración inicial, `doctor` y la detección del estado de canales, incluso si la autenticación actual no está configurada directamente en la configuración.

Equivalentes en variables de entorno (se usan cuando la clave de configuración no está establecida):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Para cuentas no predeterminadas, usa variables de entorno específicas de la cuenta:

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

Matrix escapa la puntuación en los ID de cuenta para evitar colisiones en las variables de entorno con ámbito.
Por ejemplo, `-` se convierte en `_X2D_`, por lo que `ops-prod` se asigna a `MATRIX_OPS_X2D_PROD_*`.

El asistente interactivo solo ofrece el atajo de variables de entorno cuando esas variables de autenticación ya están presentes y la cuenta seleccionada todavía no tiene autenticación de Matrix guardada en la configuración.

`MATRIX_HOMESERVER` no puede establecerse desde un `.env` del espacio de trabajo; consulta [archivos `.env` del espacio de trabajo](/es/gateway/security).

## Ejemplo de configuración

Esta es una configuración base práctica con emparejamiento de DM, lista de permitidos para salas y E2EE habilitado:

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

`autoJoin` se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de estilo DM. OpenClaw no puede clasificar de forma fiable una sala invitada como DM o grupo en el momento de la invitación, por lo que todas las invitaciones pasan primero por `autoJoin`. `dm.policy` se aplica después de que el bot se haya unido y la sala se haya clasificado como DM.

## Vistas previas en streaming

El streaming de respuestas en Matrix es opcional.

Configura `channels.matrix.streaming` como `"partial"` cuando quieras que OpenClaw envíe una única respuesta de vista previa en vivo, edite esa vista previa en su lugar mientras el modelo genera texto y luego la finalice cuando la respuesta termine:

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
- `streaming: "partial"` crea un mensaje de vista previa editable para el bloque actual del asistente usando mensajes de texto normales de Matrix. Esto conserva el comportamiento heredado de notificación primero por vista previa de Matrix, por lo que los clientes estándar pueden notificar con el primer texto de vista previa transmitido en lugar del bloque terminado.
- `streaming: "quiet"` crea un aviso silencioso editable para el bloque actual del asistente. Úsalo solo cuando también configures reglas push del destinatario para las ediciones finalizadas de la vista previa.
- `blockStreaming: true` habilita mensajes de progreso de Matrix separados. Con el streaming de vista previa habilitado, Matrix mantiene el borrador en vivo del bloque actual y conserva los bloques completados como mensajes separados.
- Cuando el streaming de vista previa está activado y `blockStreaming` está desactivado, Matrix edita el borrador en vivo en su lugar y finaliza ese mismo evento cuando termina el bloque o el turno.
- Si la vista previa ya no cabe en un solo evento de Matrix, OpenClaw detiene el streaming de vista previa y vuelve a la entrega final normal.
- Las respuestas con contenido multimedia siguen enviando archivos adjuntos de forma normal. Si una vista previa obsoleta ya no puede reutilizarse con seguridad, OpenClaw la redacta antes de enviar la respuesta final con contenido multimedia.
- Las ediciones de vista previa consumen llamadas adicionales a la API de Matrix. Deja el streaming desactivado si quieres el comportamiento más conservador respecto a límites de tasa.

`blockStreaming` no habilita por sí solo las vistas previas de borrador.
Usa `streaming: "partial"` o `streaming: "quiet"` para las ediciones de vista previa; luego añade `blockStreaming: true` solo si también quieres que los bloques completados del asistente sigan siendo visibles como mensajes de progreso separados.

Si necesitas notificaciones estándar de Matrix sin reglas push personalizadas, usa `streaming: "partial"` para el comportamiento primero por vista previa o deja `streaming` desactivado para entrega solo final. Con `streaming: "off"`:

- `blockStreaming: true` envía cada bloque terminado como un mensaje normal de Matrix con notificación.
- `blockStreaming: false` envía solo la respuesta final completada como un mensaje normal de Matrix con notificación.

### Reglas push autoalojadas para vistas previas silenciosas finalizadas

El streaming silencioso (`streaming: "quiet"`) solo notifica a los destinatarios cuando se finaliza un bloque o un turno: una regla push por usuario debe coincidir con el marcador de vista previa finalizada. Consulta [reglas push de Matrix para vistas previas silenciosas](/es/channels/matrix-push-rules) para ver la configuración completa (token del destinatario, comprobación del pusher, instalación de la regla y notas por homeserver).

## Salas de bot a bot

De forma predeterminada, los mensajes de Matrix de otras cuentas de Matrix de OpenClaw configuradas se ignoran.

Usa `allowBots` cuando quieras intencionalmente tráfico de Matrix entre agentes:

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

- `allowBots: true` acepta mensajes de otras cuentas de bot de Matrix configuradas en salas y DM permitidos.
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas. Los DM siguen estando permitidos.
- `groups.<room>.allowBots` anula la configuración a nivel de cuenta para una sala.
- OpenClaw sigue ignorando mensajes del mismo ID de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no expone aquí una marca nativa de bot; OpenClaw trata “creado por bot” como “enviado por otra cuenta de Matrix configurada en este Gateway de OpenClaw”.

Usa listas estrictas de salas permitidas y requisitos de mención cuando habilites tráfico de bot a bot en salas compartidas.

## Cifrado y verificación

En salas cifradas (E2EE), los eventos salientes de imagen usan `thumbnail_file` para que las vistas previas de imagen se cifren junto con el archivo adjunto completo. Las salas sin cifrar siguen usando `thumbnail_url` sin cifrar. No se necesita ninguna configuración: el plugin detecta automáticamente el estado de E2EE.

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

Comandos de verificación (todos aceptan `--verbose` para diagnósticos y `--json` para salida legible por máquinas):

```bash
openclaw matrix verify status
```

Estado detallado (diagnósticos completos):

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

Diagnósticos detallados de bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forzar un restablecimiento nuevo de la identidad de firma cruzada antes del bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verificar este dispositivo con una clave de recuperación:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Este comando informa de tres estados separados:

- `Recovery key accepted`: Matrix aceptó la clave de recuperación para el almacenamiento de secretos o la confianza del dispositivo.
- `Backup usable`: la copia de seguridad de claves de sala puede cargarse con material de recuperación confiable.
- `Device verified by owner`: el dispositivo actual de OpenClaw tiene confianza completa en la identidad de firma cruzada de Matrix.

`Signed by owner` en la salida detallada o JSON es solo diagnóstico. OpenClaw no lo considera suficiente a menos que `Cross-signing verified` también sea `yes`.

El comando sigue terminando con un código distinto de cero cuando la confianza completa de identidad de Matrix está incompleta, incluso si la clave de recuperación puede desbloquear material de copia de seguridad. En ese caso, completa la autoverificación desde otro cliente de Matrix:

```bash
openclaw matrix verify self
```

Acepta la solicitud en otro cliente de Matrix, compara los emoji o decimales SAS,
y escribe `yes` solo cuando coincidan. El comando espera a que Matrix informe
`Cross-signing verified: yes` antes de finalizar correctamente.

Usa `verify bootstrap --force-reset-cross-signing` solo cuando quieras
reemplazar intencionadamente la identidad actual de firma cruzada.

Detalles detallados de verificación del dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Comprobar el estado de la copia de seguridad de claves de sala:

```bash
openclaw matrix verify backup status
```

Diagnósticos detallados del estado de la copia de seguridad:

```bash
openclaw matrix verify backup status --verbose
```

Restaurar claves de sala desde la copia de seguridad del servidor:

```bash
openclaw matrix verify backup restore
```

Flujo interactivo de autoverificación:

```bash
openclaw matrix verify self
```

Para solicitudes de verificación de nivel más bajo o entrantes, usa:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Usa `openclaw matrix verify cancel <id>` para cancelar una solicitud.

Diagnósticos detallados de restauración:

```bash
openclaw matrix verify backup restore --verbose
```

Eliminar la copia de seguridad actual del servidor y crear una nueva base de copia de seguridad. Si la clave de copia de seguridad almacenada
no puede cargarse correctamente, este restablecimiento también puede recrear el almacenamiento de secretos para que
los futuros arranques en frío puedan cargar la nueva clave de copia de seguridad:

```bash
openclaw matrix verify backup reset --yes
```

Todos los comandos `verify` son concisos de forma predeterminada (incluido el registro interno silencioso del SDK) y muestran diagnósticos detallados solo con `--verbose`.
Usa `--json` para obtener una salida completa legible por máquinas al crear scripts.

En configuraciones de varias cuentas, los comandos CLI de Matrix usan la cuenta predeterminada implícita de Matrix a menos que pases `--account <id>`.
Si configuras varias cuentas con nombre, primero establece `channels.matrix.defaultAccount` o esas operaciones implícitas de CLI se detendrán y te pedirán que elijas una cuenta explícitamente.
Usa `--account` siempre que quieras que las operaciones de verificación o de dispositivo apunten explícitamente a una cuenta con nombre:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Cuando el cifrado está deshabilitado o no disponible para una cuenta con nombre, las advertencias de Matrix y los errores de verificación apuntan a la clave de configuración de esa cuenta, por ejemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Qué significa verificado">
    OpenClaw considera que un dispositivo está verificado solo cuando tu propia identidad de firma cruzada lo firma. `verify status --verbose` expone tres señales de confianza:

    - `Locally trusted`: confiado solo por este cliente
    - `Cross-signing verified`: el SDK informa verificación mediante firma cruzada
    - `Signed by owner`: firmado por tu propia clave de autofirma

    `Verified by owner` pasa a ser `yes` solo cuando la verificación por firma cruzada está presente.
    La confianza local o una firma del propietario por sí solas no bastan para que OpenClaw trate
    el dispositivo como completamente verificado.

  </Accordion>

  <Accordion title="Qué hace bootstrap">
    `verify bootstrap` es el comando de reparación y configuración para cuentas cifradas. En orden, hace lo siguiente:

    - inicializa el almacenamiento de secretos, reutilizando una clave de recuperación existente cuando es posible
    - inicializa la firma cruzada y sube las claves públicas de firma cruzada que falten
    - marca y firma de forma cruzada el dispositivo actual
    - crea una copia de seguridad de claves de sala en el servidor si todavía no existe una

    Si el homeserver requiere UIA para subir claves de firma cruzada, OpenClaw primero intenta sin autenticación, luego `m.login.dummy` y después `m.login.password` (requiere `channels.matrix.password`). Usa `--force-reset-cross-signing` solo cuando quieras descartar intencionadamente la identidad actual.

  </Accordion>

  <Accordion title="Nueva base de copia de seguridad">
    Si quieres mantener funcionando los futuros mensajes cifrados y aceptas perder historial antiguo irrecuperable:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Añade `--account <id>` para apuntar a una cuenta con nombre. Esto también puede recrear el almacenamiento de secretos si el secreto actual de copia de seguridad no puede cargarse con seguridad.

  </Accordion>

  <Accordion title="Comportamiento al iniciar">
    Con `encryption: true`, `startupVerification` usa `"if-unverified"` de forma predeterminada. Al iniciar, un dispositivo no verificado solicita autoverificación en otro cliente de Matrix, omitiendo duplicados y aplicando un enfriamiento. Ajusta esto con `startupVerificationCooldownHours` o desactívalo con `startupVerification: "off"`.

    El inicio también ejecuta una pasada conservadora de bootstrap criptográfico que reutiliza el almacenamiento de secretos y la identidad actual de firma cruzada. Si el estado de bootstrap está dañado, OpenClaw intenta una reparación protegida incluso sin `channels.matrix.password`; si el homeserver requiere UIA con contraseña, el inicio registra una advertencia y sigue sin ser fatal. Los dispositivos ya firmados por el propietario se conservan.

    Consulta [Migración de Matrix](/es/install/migrating-matrix) para ver el flujo completo de actualización.

  </Accordion>

  <Accordion title="Avisos de verificación">
    Matrix publica avisos del ciclo de vida de la verificación en la sala estricta de verificación por DM como mensajes `m.notice`: solicitud, listo (con guía de "Verificar por emoji"), inicio/finalización y detalles SAS (emoji/decimal) cuando están disponibles.

    Las solicitudes entrantes desde otro cliente de Matrix se rastrean y se aceptan automáticamente. Para la autoverificación, OpenClaw inicia automáticamente el flujo SAS y confirma su propio lado una vez que la verificación por emoji está disponible; aun así, debes comparar y confirmar "They match" en tu cliente de Matrix.

    Los avisos del sistema de verificación no se reenvían a la canalización de chat del agente.

  </Accordion>

  <Accordion title="Higiene de dispositivos">
    Los dispositivos antiguos gestionados por OpenClaw pueden acumularse. Enuméralos y depúralos:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Almacén criptográfico">
    Matrix E2EE usa la ruta criptográfica Rust oficial de `matrix-js-sdk` con `fake-indexeddb` como shim de IndexedDB. El estado criptográfico persiste en `crypto-idb-snapshot.json` (permisos de archivo restrictivos).

    El estado cifrado en tiempo de ejecución vive en `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e incluye el almacén de sincronización, el almacén criptográfico, la clave de recuperación, la instantánea de IDB, las asociaciones de hilos y el estado de verificación al iniciar. Cuando el token cambia pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor raíz existente para que el estado previo siga siendo visible.

  </Accordion>
</AccordionGroup>

## Gestión del perfil

Actualiza el perfil propio de Matrix para la cuenta seleccionada con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Añade `--account <id>` cuando quieras apuntar explícitamente a una cuenta de Matrix con nombre.

Matrix acepta directamente URL de avatar `mxc://`. Cuando pasas una URL de avatar `http://` o `https://`, OpenClaw primero la sube a Matrix y almacena la URL `mxc://` resuelta de vuelta en `channels.matrix.avatarUrl` (o en la anulación de la cuenta seleccionada).

## Hilos

Matrix admite hilos nativos de Matrix tanto para respuestas automáticas como para envíos de herramientas de mensajes.

- `dm.sessionScope: "per-user"` (predeterminado) mantiene el enrutamiento de DM de Matrix con ámbito del remitente, por lo que varias salas de DM pueden compartir una sesión cuando se resuelven al mismo par.
- `dm.sessionScope: "per-room"` aísla cada sala de DM de Matrix en su propia clave de sesión mientras sigue usando comprobaciones normales de autenticación y lista de permitidos de DM.
- Las asociaciones explícitas de conversaciones de Matrix siguen teniendo prioridad sobre `dm.sessionScope`, por lo que las salas e hilos asociados mantienen su sesión de destino elegida.
- `threadReplies: "off"` mantiene las respuestas en el nivel superior y conserva los mensajes entrantes en hilo en la sesión principal.
- `threadReplies: "inbound"` responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `threadReplies: "always"` mantiene las respuestas de la sala en un hilo con raíz en el mensaje que lo activó y enruta esa conversación mediante la sesión con ámbito de hilo correspondiente desde el primer mensaje activador.
- `dm.threadReplies` anula la configuración de nivel superior solo para los DM. Por ejemplo, puedes mantener aislados los hilos de salas mientras mantienes los DM planos.
- Los mensajes entrantes en hilo incluyen el mensaje raíz del hilo como contexto adicional para el agente.
- Los envíos de herramientas de mensajes heredan automáticamente el hilo actual de Matrix cuando el destino es la misma sala, o el mismo destino de usuario de DM, a menos que se proporcione un `threadId` explícito.
- La reutilización del destino de usuario de DM de la misma sesión solo se activa cuando los metadatos de la sesión actual prueban el mismo par de DM en la misma cuenta de Matrix; de lo contrario, OpenClaw vuelve al enrutamiento normal con ámbito de usuario.
- Cuando OpenClaw detecta que una sala de DM de Matrix entra en conflicto con otra sala de DM en la misma sesión de DM compartida de Matrix, publica un `m.notice` único en esa sala con la vía de escape `/focus` cuando las asociaciones de hilo están habilitadas y la sugerencia `dm.sessionScope`.
- Las asociaciones de hilos en tiempo de ejecución son compatibles con Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` con asociación de hilo funcionan en salas y DM de Matrix.
- `/focus` de nivel superior en una sala/DM de Matrix crea un nuevo hilo de Matrix y lo asocia a la sesión de destino cuando `threadBindings.spawnSubagentSessions=true`.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo de Matrix existente asocia ese hilo actual en su lugar.

## Asociaciones de conversación de ACP

Las salas, los DM y los hilos existentes de Matrix pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la superficie de chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del DM, sala o hilo existente de Matrix que quieras seguir usando.
- En un DM o sala de Matrix de nivel superior, el DM/sala actual sigue siendo la superficie de chat y los mensajes futuros se enrutan a la sesión ACP creada.
- Dentro de un hilo de Matrix existente, `--bind here` asocia ese hilo actual en su lugar.
- `/new` y `/reset` restablecen la misma sesión ACP asociada en su lugar.
- `/acp close` cierra la sesión ACP y elimina la asociación.

Notas:

- `--bind here` no crea un hilo hijo de Matrix.
- `threadBindings.spawnAcpSessions` solo es necesario para `/acp spawn --thread auto|here`, donde OpenClaw necesita crear o asociar un hilo hijo de Matrix.

### Configuración de asociación de hilos

Matrix hereda los valores predeterminados globales de `session.threadBindings`, y también admite anulaciones por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Las banderas de creación asociada a hilos de Matrix son opcionales:

- Configura `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nivel superior cree y asocie nuevos hilos de Matrix.
- Configura `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` asocie sesiones ACP a hilos de Matrix.

## Reacciones

Matrix admite acciones de reacción salientes, notificaciones de reacción entrantes y reacciones de confirmación entrantes.

- Las herramientas de reacción saliente están controladas por `channels["matrix"].actions.reactions`.
- `react` añade una reacción a un evento específico de Matrix.
- `reactions` enumera el resumen actual de reacciones de un evento específico de Matrix.
- `emoji=""` elimina las propias reacciones de la cuenta del bot en ese evento.
- `remove: true` elimina solo la reacción del emoji especificado de la cuenta del bot.

El ámbito de las reacciones de confirmación se resuelve en este orden estándar de OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- emoji de respaldo de identidad del agente

El ámbito de la reacción de confirmación se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

El modo de notificación de reacciones se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- valor predeterminado: `own`

Comportamiento:

- `reactionNotifications: "own"` reenvía eventos `m.reaction` añadidos cuando apuntan a mensajes de Matrix creados por el bot.
- `reactionNotifications: "off"` desactiva los eventos del sistema de reacciones.
- Las eliminaciones de reacciones no se sintetizan en eventos del sistema porque Matrix las expone como redacciones, no como eliminaciones independientes de `m.reaction`.

## Contexto del historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de la sala se incluyen como `InboundHistory` cuando un mensaje de sala de Matrix activa al agente. Recurre a `messages.groupChat.historyLimit`; si ambos no están configurados, el valor predeterminado efectivo es `0`. Configura `0` para desactivarlo.
- El historial de salas de Matrix es solo de sala. Los DM siguen usando el historial normal de sesión.
- El historial de salas de Matrix es solo pendiente: OpenClaw almacena en búfer los mensajes de sala que aún no activaron una respuesta y luego toma una instantánea de esa ventana cuando llega una mención u otro activador.
- El mensaje activador actual no se incluye en `InboundHistory`; permanece en el cuerpo principal entrante para ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la instantánea original del historial en lugar de desplazarse hacia adelante a mensajes más nuevos de la sala.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para contexto suplementario de la sala, como texto de respuesta obtenido, raíces de hilos e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto suplementario se conserva tal como se recibe.
- `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes permitidos por las comprobaciones activas de lista de permitidos de sala/usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero sigue conservando una respuesta citada explícita.

Esta configuración afecta la visibilidad del contexto suplementario, no si el propio mensaje entrante puede activar una respuesta.
La autorización del activador sigue viniendo de `groupPolicy`, `groups`, `groupAllowFrom` y la configuración de políticas de DM.

## Política de DM y salas

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

Consulta [Groups](/es/channels/groups) para el comportamiento de control por menciones y lista de permitidos.

Ejemplo de emparejamiento para DM de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviándote mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede volver a enviar una respuesta recordatoria tras un breve enfriamiento en lugar de generar un código nuevo.

Consulta [Pairing](/es/channels/pairing) para el flujo compartido de emparejamiento de DM y la disposición del almacenamiento.

## Reparación directa de salas

Si el estado de mensajes directos se desincroniza, OpenClaw puede terminar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar del DM activo. Inspecciona la asignación actual para un par con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárala con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

El flujo de reparación:

- prefiere un DM estricto 1:1 que ya esté asignado en `m.direct`
- recurre a cualquier DM estricto 1:1 actualmente unido con ese usuario
- crea una sala directa nueva y reescribe `m.direct` si no existe un DM en buen estado

El flujo de reparación no elimina automáticamente las salas antiguas. Solo elige el DM en buen estado y actualiza la asignación para que los nuevos envíos de Matrix, los avisos de verificación y otros flujos de mensajes directos vuelvan a dirigirse a la sala correcta.

## Aprobaciones de exec

Matrix puede actuar como cliente nativo de aprobación para una cuenta de Matrix. Los controles nativos
de enrutamiento de DM/canal siguen estando en la configuración de aprobación de exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; recurre a `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Los aprobadores deben ser ID de usuario de Matrix como `@owner:example.org`. Matrix habilita automáticamente las aprobaciones nativas cuando `enabled` no está configurado o es `"auto"` y al menos se puede resolver un aprobador. Las aprobaciones de exec usan primero `execApprovals.approvers` y pueden recurrir a `channels.matrix.dm.allowFrom`. Las aprobaciones de Plugin autorizan mediante `channels.matrix.dm.allowFrom`. Configura `enabled: false` para desactivar explícitamente Matrix como cliente nativo de aprobación. En caso contrario, las solicitudes de aprobación recurren a otras rutas de aprobación configuradas o a la política de respaldo de aprobación.

El enrutamiento nativo de Matrix admite ambos tipos de aprobación:

- `channels.matrix.execApprovals.*` controla el modo nativo de distribución DM/canal para los avisos de aprobación de Matrix.
- Las aprobaciones de exec usan el conjunto de aprobadores de exec de `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Las aprobaciones de Plugin usan la lista de permitidos de DM de Matrix de `channels.matrix.dm.allowFrom`.
- Los atajos de reacción y las actualizaciones de mensajes de Matrix se aplican tanto a aprobaciones de exec como de plugins.

Reglas de entrega:

- `target: "dm"` envía los avisos de aprobación a los DM de los aprobadores
- `target: "channel"` devuelve el aviso a la sala o DM de Matrix de origen
- `target: "both"` envía a los DM de los aprobadores y a la sala o DM de Matrix de origen

Los avisos de aprobación de Matrix siembran atajos de reacción en el mensaje principal de aprobación:

- `✅` = permitir una vez
- `❌` = denegar
- `♾️` = permitir siempre cuando esa decisión esté permitida por la política efectiva de exec

Los aprobadores pueden reaccionar en ese mensaje o usar los comandos con barra de respaldo: `/approve <id> allow-once`, `/approve <id> allow-always` o `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. Para aprobaciones de exec, la entrega al canal incluye el texto del comando, así que habilita `channel` o `both` solo en salas de confianza.

Anulación por cuenta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentación relacionada: [Aprobaciones de exec](/es/tools/exec-approvals)

## Comandos con barra

Los comandos con barra de Matrix (por ejemplo `/new`, `/reset`, `/model`) funcionan directamente en DM. En salas, OpenClaw también reconoce comandos con barra prefijados con la propia mención de Matrix del bot, así que `@bot:server /new` activa la ruta del comando sin necesitar una expresión regular de mención personalizada. Esto mantiene al bot respondiendo a publicaciones de estilo sala `@mention /command` que emiten Element y clientes similares cuando un usuario completa con tabulación el bot antes de escribir el comando.

Las reglas de autorización siguen aplicándose: los remitentes de comandos deben cumplir las políticas de propietario o de lista de permitidos de DM o sala igual que los mensajes normales.

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

Los valores de nivel superior de `channels.matrix` actúan como predeterminados para las cuentas con nombre, a menos que una cuenta los anule.
Puedes limitar las entradas heredadas de sala a una cuenta de Matrix con `groups.<room>.account`.
Las entradas sin `account` permanecen compartidas entre todas las cuentas de Matrix, y las entradas con `account: "default"` siguen funcionando cuando la cuenta predeterminada está configurada directamente en `channels.matrix.*` de nivel superior.
Los valores predeterminados parciales compartidos de autenticación no crean por sí solos una cuenta predeterminada implícita separada. OpenClaw solo sintetiza la cuenta `default` de nivel superior cuando ese valor predeterminado tiene autenticación reciente (`homeserver` más `accessToken`, o `homeserver` más `userId` y `password`); las cuentas con nombre aún pueden seguir siendo detectables desde `homeserver` más `userId` cuando las credenciales en caché satisfacen la autenticación más adelante.
Si Matrix ya tiene exactamente una cuenta con nombre, o `defaultAccount` apunta a una clave existente de cuenta con nombre, la promoción de reparación/configuración de una sola cuenta a varias cuentas conserva esa cuenta en lugar de crear una entrada nueva `accounts.default`. Solo las claves de autenticación/bootstrap de Matrix se trasladan a esa cuenta promovida; las claves compartidas de política de entrega permanecen en el nivel superior.
Configura `defaultAccount` cuando quieras que OpenClaw prefiera una cuenta de Matrix con nombre para enrutamiento implícito, sondeos y operaciones de CLI.
Si hay varias cuentas de Matrix configuradas y un ID de cuenta es `default`, OpenClaw usa esa cuenta implícitamente incluso cuando `defaultAccount` no está configurado.
Si configuras varias cuentas con nombre, configura `defaultAccount` o pasa `--account <id>` para los comandos de CLI que dependan de la selección implícita de cuenta.
Pasa `--account <id>` a `openclaw matrix verify ...` y `openclaw matrix devices ...` cuando quieras anular esa selección implícita para un comando.

Consulta [Referencia de configuración](/es/gateway/config-channels#multi-account-all-channels) para el patrón compartido de varias cuentas.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea los homeservers privados/internos de Matrix para protección SSRF, a menos que
lo habilites explícitamente por cuenta.

Si tu homeserver se ejecuta en localhost, una IP de LAN/Tailscale o un nombre de host interno, habilita
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

Esta habilitación solo permite destinos privados/internos de confianza. Los homeservers públicos en texto claro, como
`http://matrix.example.org:8008`, siguen bloqueados. Prefiere `https://` siempre que sea posible.

## Uso de proxy para el tráfico de Matrix

Si tu despliegue de Matrix necesita un proxy HTTP(S) saliente explícito, configura `channels.matrix.proxy`:

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

Las cuentas con nombre pueden anular el valor predeterminado de nivel superior con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la misma configuración de proxy para el tráfico de Matrix en tiempo de ejecución y para los sondeos de estado de la cuenta.

## Resolución de destinos

Matrix acepta estos formatos de destino en cualquier lugar donde OpenClaw te pida un destino de sala o usuario:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

La búsqueda en el directorio en vivo usa la cuenta de Matrix con la sesión iniciada:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese homeserver.
- Las búsquedas de salas aceptan directamente ID y alias explícitos de sala, y luego recurren a buscar nombres de salas unidas para esa cuenta.
- La búsqueda por nombre de salas unidas es de mejor esfuerzo. Si un nombre de sala no puede resolverse a un ID o alias, se ignora en la resolución de listas de permitidos en tiempo de ejecución.

## Referencia de configuración

- `enabled`: habilita o deshabilita el canal.
- `name`: etiqueta opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferido cuando hay varias cuentas de Matrix configuradas.
- `homeserver`: URL del homeserver, por ejemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta de Matrix se conecte a homeservers privados/internos. Habilítalo cuando el homeserver se resuelva a `localhost`, una IP de LAN/Tailscale o un host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para el tráfico de Matrix. Las cuentas con nombre pueden anular el valor predeterminado de nivel superior con su propio `proxy`.
- `userId`: ID de usuario completo de Matrix, por ejemplo `@bot:example.org`.
- `accessToken`: token de acceso para autenticación basada en token. Se admiten valores en texto claro y valores SecretRef para `channels.matrix.accessToken` y `channels.matrix.accounts.<id>.accessToken` en proveedores de entorno/archivo/exec. Consulta [Gestión de secretos](/es/gateway/secrets).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto claro y valores SecretRef.
- `deviceId`: ID explícito del dispositivo de Matrix.
- `deviceName`: nombre visible del dispositivo para inicio de sesión con contraseña.
- `avatarUrl`: URL almacenada del avatar propio para sincronización de perfil y actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos obtenidos durante la sincronización de inicio.
- `encryption`: habilita E2EE.
- `allowlistOnly`: cuando es `true`, actualiza la política de sala `open` a `allowlist`, y fuerza todas las políticas activas de DM excepto `disabled` (incluidas `pairing` y `open`) a `allowlist`. No afecta a las políticas `disabled`.
- `allowBots`: permite mensajes de otras cuentas de Matrix de OpenClaw configuradas (`true` o `"mentions"`).
- `groupPolicy`: `open`, `allowlist` o `disabled`.
- `contextVisibility`: modo de visibilidad de contexto suplementario de sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista de permitidos de ID de usuario para tráfico de salas. Los ID completos de usuario de Matrix son la opción más segura; las coincidencias exactas de directorio se resuelven al iniciar y cuando la lista de permitidos cambia mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `historyLimit`: número máximo de mensajes de sala que se incluirán como contexto de historial de grupo. Recurre a `messages.groupChat.historyLimit`; si ambos no están configurados, el valor predeterminado efectivo es `0`. Configura `0` para desactivarlo.
- `replyToMode`: `off`, `first`, `all` o `batched`.
- `markdown`: configuración opcional de representación de Markdown para texto saliente de Matrix.
- `streaming`: `off` (predeterminado), `"partial"`, `"quiet"`, `true` o `false`. `"partial"` y `true` habilitan actualizaciones de borrador primero por vista previa con mensajes de texto normales de Matrix. `"quiet"` usa avisos de vista previa sin notificación para configuraciones autoalojadas con reglas push. `false` equivale a `"off"`.
- `blockStreaming`: `true` habilita mensajes de progreso separados para bloques completados del asistente mientras el streaming de borrador de vista previa está activo.
- `threadReplies`: `off`, `inbound` o `always`.
- `threadBindings`: anulaciones por canal para enrutamiento y ciclo de vida de sesiones asociadas a hilos.
- `startupVerification`: modo automático de solicitud de autoverificación al iniciar (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: enfriamiento antes de reintentar solicitudes automáticas de verificación al iniciar.
- `textChunkLimit`: tamaño de fragmento del mensaje saliente en caracteres (se aplica cuando `chunkMode` es `length`).
- `chunkMode`: `length` divide mensajes por número de caracteres; `newline` divide en límites de línea.
- `responsePrefix`: cadena opcional antepuesta a todas las respuestas salientes de este canal.
- `ackReaction`: anulación opcional de reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: anulación opcional del ámbito de reacción de confirmación (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificación de reacciones entrantes (`own`, `off`).
- `mediaMaxMb`: límite de tamaño de contenido multimedia en MB para envíos salientes y procesamiento de contenido multimedia entrante.
- `autoJoin`: política de unión automática por invitación (`always`, `allowlist`, `off`). Predeterminado: `off`. Se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de estilo DM.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `allowlist`. Las entradas de alias se resuelven a ID de sala durante la gestión de invitaciones; OpenClaw no confía en el estado del alias declarado por la sala invitada.
- `dm`: bloque de política de DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla el acceso a DM después de que OpenClaw se haya unido a la sala y la haya clasificado como DM. No cambia si una invitación se une automáticamente.
- `dm.allowFrom`: lista de permitidos de ID de usuario para tráfico de DM. Los ID completos de usuario de Matrix son la opción más segura; las coincidencias exactas de directorio se resuelven al iniciar y cuando la lista de permitidos cambia mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `dm.sessionScope`: `per-user` (predeterminado) o `per-room`. Usa `per-room` cuando quieras que cada sala DM de Matrix mantenga contexto separado incluso si el par es el mismo.
- `dm.threadReplies`: anulación de política de hilos solo para DM (`off`, `inbound`, `always`). Anula la configuración `threadReplies` de nivel superior tanto para la ubicación de la respuesta como para el aislamiento de sesión en DM.
- `execApprovals`: entrega nativa de aprobaciones de exec de Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID de usuario de Matrix autorizados para aprobar solicitudes de exec. Opcional cuando `dm.allowFrom` ya identifica a los aprobadores.
- `execApprovals.target`: `dm | channel | both` (predeterminado: `dm`).
- `accounts`: anulaciones con nombre por cuenta. Los valores de nivel superior de `channels.matrix` actúan como predeterminados para estas entradas.
- `groups`: mapa de políticas por sala. Prefiere ID o alias de sala; los nombres de sala no resueltos se ignoran en tiempo de ejecución. La identidad de sesión/grupo usa el ID de sala estable tras la resolución.
- `groups.<room>.account`: restringe una entrada heredada de sala a una cuenta específica de Matrix en configuraciones de varias cuentas.
- `groups.<room>.allowBots`: anulación a nivel de sala para remitentes bot configurados (`true` o `"mentions"`).
- `groups.<room>.users`: lista de permitidos de remitentes por sala.
- `groups.<room>.tools`: anulaciones por sala de permitir/denegar herramientas.
- `groups.<room>.autoReply`: anulación a nivel de sala para control por menciones. `true` desactiva los requisitos de mención para esa sala; `false` los vuelve a forzar.
- `groups.<room>.skills`: filtro opcional de Skills a nivel de sala.
- `groups.<room>.systemPrompt`: fragmento opcional de prompt del sistema a nivel de sala.
- `rooms`: alias heredado de `groups`.
- `actions`: control por acción de herramientas (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Groups](/es/channels/groups) — comportamiento de chat de grupo y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
