---
read_when:
    - Implementar o actualizar clientes WS de Gateway
    - Depurar incompatibilidades de protocolo o fallos de conexión
    - Regenerar el esquema/los modelos del protocolo
summary: 'Protocolo WebSocket de Gateway: protocolo de enlace, tramas, control de versiones'
title: Protocolo de Gateway
x-i18n:
    generated_at: "2026-04-22T04:22:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocolo de Gateway (WebSocket)

El protocolo WS de Gateway es el **plano de control único + transporte de nodos** para
OpenClaw. Todos los clientes (CLI, interfaz web, aplicación de macOS, nodos iOS/Android, nodos sin interfaz)
se conectan mediante WebSocket y declaran su **rol** + **alcance** en el momento del
protocolo de enlace.

## Transporte

- WebSocket, tramas de texto con cargas útiles JSON.
- La primera trama **debe** ser una solicitud `connect`.

## Protocolo de enlace (connect)

Gateway → Cliente (desafío previo a la conexión):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Cliente → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Cliente:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` y `policy` son obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` es opcional. `auth`
informa el rol/alcances negociados cuando están disponibles, e incluye `deviceToken`
cuando el gateway emite uno.

Cuando no se emite ningún token de dispositivo, `hello-ok.auth` todavía puede informar los
permisos negociados:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Cuando se emite un token de dispositivo, `hello-ok` también incluye:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Durante la transferencia de bootstrap de confianza, `hello-ok.auth` también puede incluir entradas
adicionales de rol acotado en `deviceTokens`:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Para el flujo integrado de bootstrap de node/operator, el token principal del nodo mantiene
`scopes: []` y cualquier token de operador transferido permanece acotado a la lista de permitidos
del operador de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de alcance de bootstrap siguen
con prefijo de rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles
que no son operador todavía necesitan alcances bajo su propio prefijo de rol.

### Ejemplo de nodo

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Enmarcado

- **Solicitud**: `{type:"req", id, method, params}`
- **Respuesta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

Los métodos con efectos secundarios requieren **claves de idempotencia** (consulta el esquema).

## Roles + alcances

### Roles

- `operator` = cliente del plano de control (CLI/UI/automatización).
- `node` = host de capacidades (camera/screen/canvas/system.run).

### Alcances (operator)

Alcances habituales:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` requiere `operator.talk.secrets`
(o `operator.admin`).

Los métodos RPC de Gateway registrados por Plugin pueden solicitar su propio alcance de operador, pero
los prefijos de administración principales reservados (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven a `operator.admin`.

El alcance del método es solo la primera restricción. Algunos comandos de barra diagonal alcanzados mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando además de eso. Por ejemplo, las escrituras
persistentes de `/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación adicional de alcance en el momento de la aprobación además del
alcance base del método:

- solicitudes sin comando: `operator.pairing`
- solicitudes con comandos de nodo que no son exec: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Los nodos declaran reclamaciones de capacidades en el momento de `connect`:

- `caps`: categorías de capacidades de alto nivel.
- `commands`: lista de permitidos de comandos para invoke.
- `permissions`: interruptores granulares (por ejemplo `screen.record`, `camera.capture`).

Gateway los trata como **reclamaciones** y aplica listas de permitidos del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad del dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las UI puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operator** y **node** a la vez.

## Restricción de alcances en eventos broadcast

Los eventos broadcast de WebSocket enviados por el servidor están restringidos por alcance para que las sesiones con alcance de emparejamiento o solo de nodo no reciban contenido de sesión de forma pasiva.

- Las **tramas de chat, agente y resultados de herramientas** (incluidos los eventos `agent` transmitidos y los resultados de llamadas de herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten por completo estas tramas.
- Los **broadcast `plugin.*` definidos por Plugin** están restringidos a `operator.write` o `operator.admin`, según cómo los haya registrado el Plugin.
- Los **eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) siguen sin restricciones para que el estado del transporte siga siendo observable para toda sesión autenticada.
- Las **familias desconocidas de eventos broadcast** están restringidas por alcance de forma predeterminada (fail-closed), salvo que un controlador registrado las flexibilice explícitamente.

Cada conexión de cliente mantiene su propio número de secuencia por cliente para que los broadcast conserven el orden monotónico en ese socket incluso cuando distintos clientes vean subconjuntos filtrados por alcance del flujo de eventos.

## Familias comunes de métodos RPC

Esta página no es un volcado completo generado, pero la superficie WS pública es más amplia
que los ejemplos anteriores de protocolo de enlace/autenticación. Estas son las principales familias de métodos que
Gateway expone actualmente.

`hello-ok.features.methods` es una lista conservadora de descubrimiento construida a partir de
`src/gateway/server-methods-list.ts` más las exportaciones de métodos de plugins/canales cargados.
Trátala como descubrimiento de funciones, no como un volcado generado de todos los ayudantes invocables
implementados en `src/gateway/server-methods/*.ts`.

### Sistema e identidad

- `health` devuelve la instantánea de estado del gateway almacenada en caché o sondeada recientemente.
- `status` devuelve el resumen del gateway estilo `/status`; los campos sensibles solo se
  incluyen para clientes operator con alcance de administrador.
- `gateway.identity.get` devuelve la identidad del dispositivo del gateway usada por relay y
  flujos de emparejamiento.
- `system-presence` devuelve la instantánea de presencia actual para dispositivos
  operator/node conectados.
- `system-event` agrega un evento del sistema y puede actualizar/difundir el
  contexto de presencia.
- `last-heartbeat` devuelve el evento Heartbeat persistido más reciente.
- `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el gateway.

### Modelos y uso

- `models.list` devuelve el catálogo de modelos permitido en tiempo de ejecución.
- `usage.status` devuelve resúmenes de ventanas de uso del proveedor/cuota restante.
- `usage.cost` devuelve resúmenes agregados de uso de costos para un intervalo de fechas.
- `doctor.memory.status` devuelve el estado de preparación de memoria vectorial/embeddings para el
  espacio de trabajo activo del agente predeterminado.
- `sessions.usage` devuelve resúmenes de uso por sesión.
- `sessions.usage.timeseries` devuelve series temporales de uso para una sesión.
- `sessions.usage.logs` devuelve entradas del registro de uso para una sesión.

### Canales y ayudantes de inicio de sesión

- `channels.status` devuelve resúmenes de estado de canales/plugins integrados y empaquetados.
- `channels.logout` cierra sesión en un canal/cuenta específico donde el canal
  admite cierre de sesión.
- `web.login.start` inicia un flujo de inicio de sesión web/QR para el proveedor de
  canal web con capacidad QR actual.
- `web.login.wait` espera a que se complete ese flujo de inicio de sesión web/QR e inicia el
  canal si se completa correctamente.
- `push.test` envía una notificación push de prueba de APNs a un nodo iOS registrado.
- `voicewake.get` devuelve los disparadores de palabra de activación almacenados.
- `voicewake.set` actualiza los disparadores de palabra de activación y difunde el cambio.

### Mensajería y registros

- `send` es el RPC directo de entrega saliente para
  envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
- `logs.tail` devuelve el final del registro de archivos configurado del gateway con cursor/límite y
  controles de bytes máximos.

### Talk y TTS

- `talk.config` devuelve la carga útil efectiva de configuración de Talk; `includeSecrets`
  requiere `operator.talk.secrets` (o `operator.admin`).
- `talk.mode` establece/difunde el estado actual del modo Talk para clientes de WebChat/Control UI.
- `talk.speak` sintetiza voz mediante el proveedor de voz activo de Talk.
- `tts.status` devuelve el estado de activación de TTS, el proveedor activo, los proveedores de respaldo
  y el estado de configuración del proveedor.
- `tts.providers` devuelve el inventario visible de proveedores de TTS.
- `tts.enable` y `tts.disable` activan o desactivan el estado de preferencias de TTS.
- `tts.setProvider` actualiza el proveedor preferido de TTS.
- `tts.convert` ejecuta una conversión puntual de texto a voz.

### Secrets, configuración, actualización y asistente

- `secrets.reload` vuelve a resolver los SecretRef activos e intercambia el estado secreto en tiempo de ejecución
  solo si todo tiene éxito.
- `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un conjunto específico
  de comando/destino.
- `config.get` devuelve la instantánea y el hash de la configuración actual.
- `config.set` escribe una carga útil de configuración validada.
- `config.patch` fusiona una actualización parcial de la configuración.
- `config.apply` valida y reemplaza la carga útil completa de configuración.
- `config.schema` devuelve la carga útil del esquema de configuración en vivo usada por Control UI y
  herramientas de CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos
  metadatos de esquema de plugins + canales cuando el tiempo de ejecución puede cargarlos. El esquema
  incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas
  y texto de ayuda usados por la UI, incluidos objeto anidado, wildcard, elemento de matriz
  y ramas de composición `anyOf` / `oneOf` / `allOf` cuando existe la documentación de campo
  correspondiente.
- `config.schema.lookup` devuelve una carga útil de búsqueda acotada a una ruta para una ruta de configuración:
  ruta normalizada, un nodo de esquema superficial, `hint` coincidente + `hintPath`, y
  resúmenes inmediatos de hijos para exploración en UI/CLI.
  - Los nodos de esquema de búsqueda conservan la documentación orientada al usuario y los campos comunes de validación:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    límites numéricos/de cadenas/de matrices/de objetos y banderas booleanas como
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`,
    `hasChildren`, además de `hint` / `hintPath` coincidentes.
- `update.run` ejecuta el flujo de actualización del gateway y programa un reinicio solo cuando
  la propia actualización se completó correctamente.
- `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el
  asistente de incorporación mediante WS RPC.

### Familias principales existentes

#### Agente y ayudantes de espacio de trabajo

- `agents.list` devuelve las entradas de agentes configuradas.
- `agents.create`, `agents.update` y `agents.delete` gestionan los registros de agentes y
  la conexión del espacio de trabajo.
- `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los
  archivos del espacio de trabajo de bootstrap expuestos para un agente.
- `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o
  sesión.
- `agent.wait` espera a que termine una ejecución y devuelve la instantánea terminal cuando
  está disponible.

#### Control de sesiones

- `sessions.list` devuelve el índice actual de sesiones.
- `sessions.subscribe` y `sessions.unsubscribe` activan o desactivan las suscripciones a eventos
  de cambio de sesión para el cliente WS actual.
- `sessions.messages.subscribe` y `sessions.messages.unsubscribe` activan o desactivan
  las suscripciones a eventos de transcripción/mensajes para una sesión.
- `sessions.preview` devuelve vistas previas acotadas de transcripciones para claves
  de sesión específicas.
- `sessions.resolve` resuelve o canoniza un destino de sesión.
- `sessions.create` crea una nueva entrada de sesión.
- `sessions.send` envía un mensaje a una sesión existente.
- `sessions.steer` es la variante de interrumpir y redirigir para una sesión activa.
- `sessions.abort` aborta el trabajo activo de una sesión.
- `sessions.patch` actualiza metadatos/reemplazos de una sesión.
- `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento
  de sesiones.
- `sessions.get` devuelve la fila completa almacenada de la sesión.
- la ejecución de chat sigue usando `chat.history`, `chat.send`, `chat.abort` y
  `chat.inject`.
- `chat.history` está normalizado para visualización en clientes de UI: las etiquetas de directivas en línea
  se eliminan del texto visible, las cargas XML de llamadas de herramientas en texto plano (incluidas
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y
  bloques truncados de llamadas de herramientas) y los tokens de control del modelo filtrados en ASCII/de ancho completo
  se eliminan, las filas puras del asistente con tokens silenciosos como `NO_REPLY` /
  `no_reply` exactos se omiten, y las filas sobredimensionadas pueden reemplazarse por marcadores de posición.

#### Emparejamiento de dispositivos y tokens de dispositivo

- `device.pair.list` devuelve dispositivos emparejados pendientes y aprobados.
- `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan
  registros de emparejamiento de dispositivos.
- `device.token.rotate` rota un token de dispositivo emparejado dentro de sus límites aprobados
  de rol y alcance.
- `device.token.revoke` revoca un token de dispositivo emparejado.

#### Emparejamiento de nodos, invoke y trabajo pendiente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` y `node.pair.verify` cubren el emparejamiento de nodos y la
  verificación de bootstrap.
- `node.list` y `node.describe` devuelven el estado conocido/conectado del nodo.
- `node.rename` actualiza la etiqueta de un nodo emparejado.
- `node.invoke` reenvía un comando a un nodo conectado.
- `node.invoke.result` devuelve el resultado de una solicitud invoke.
- `node.event` transporta eventos originados por nodos de vuelta al gateway.
- `node.canvas.capability.refresh` actualiza tokens de capacidad de canvas con alcance.
- `node.pending.pull` y `node.pending.ack` son las API de cola para nodos conectados.
- `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero
  para nodos sin conexión/desconectados.

#### Familias de aprobación

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y
  `exec.approval.resolve` cubren solicitudes puntuales de aprobación de exec más
  búsqueda/repetición de aprobaciones pendientes.
- `exec.approval.waitDecision` espera una aprobación pendiente de exec y devuelve
  la decisión final (o `null` por tiempo de espera).
- `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de la política
  de aprobaciones de exec del gateway.
- `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política local de exec
  del nodo mediante comandos de relay del nodo.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren
  flujos de aprobación definidos por Plugin.

#### Otras familias principales

- automatización:
  - `wake` programa una inyección de texto wake inmediata o para el siguiente Heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Familias comunes de eventos

- `chat`: actualizaciones de chat de UI como `chat.inject` y otros eventos
  de chat solo de transcripción.
- `session.message` y `session.tool`: actualizaciones de transcripción/flujo de eventos para una
  sesión suscrita.
- `sessions.changed`: cambió el índice de sesiones o sus metadatos.
- `presence`: actualizaciones de instantánea de presencia del sistema.
- `tick`: evento periódico de keepalive / actividad.
- `health`: actualización de instantánea de estado del gateway.
- `heartbeat`: actualización de flujo de eventos Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de Cron.
- `shutdown`: notificación de apagado del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida de emparejamiento de nodos.
- `node.invoke.request`: difusión de solicitud invoke de nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparejado.
- `voicewake.changed`: cambió la configuración de disparadores de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de
  aprobación de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación
  de Plugin.

### Métodos auxiliares de nodos

- Los nodos pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills
  para comprobaciones automáticas de permitidos.

### Métodos auxiliares de operator

- Los operator pueden llamar a `commands.list` (`operator.read`) para obtener el inventario de comandos
  en tiempo de ejecución para un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token principal del comando de texto sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos adaptados al proveedor
      cuando están disponibles
  - `textAliases` contiene alias exactos con barra como `/model` y `/m`.
  - `nativeName` contiene el nombre nativo adaptado al proveedor cuando existe.
  - `provider` es opcional y solo afecta el nombre nativo y la disponibilidad de comandos nativos
    de Plugin.
  - `includeArgs=false` omite del resultado los metadatos serializados de argumentos.
- Los operator pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas en tiempo de ejecución de un
  agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del Plugin cuando `source="plugin"`
  - `optional`: si una herramienta de Plugin es opcional
- Los operator pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario efectivo
  de herramientas en tiempo de ejecución para una sesión.
  - `sessionKey` es obligatorio.
  - El gateway deriva el contexto de tiempo de ejecución confiable del lado del servidor a partir de la sesión, en lugar de aceptar
    autenticación o contexto de entrega proporcionados por el llamante.
  - La respuesta tiene alcance de sesión y refleja lo que la conversación activa puede usar en este momento,
    incluidas herramientas de core, Plugin y canal.
- Los operator pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible
  de Skills para un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - La respuesta incluye elegibilidad, requisitos faltantes, comprobaciones de configuración y
    opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operator pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para obtener
  metadatos de descubrimiento de ClawHub.
- Los operator pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de Skill en el directorio `skills/` del espacio de trabajo del agente predeterminado.
  - Modo instalador de gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    ejecuta una acción declarada `metadata.openclaw.install` en el host del gateway.
- Los operator pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones de ClawHub rastreadas en
    el espacio de trabajo del agente predeterminado.
  - El modo de configuración aplica parches a valores de `skills.entries.<skillKey>` como `enabled`,
    `apiKey` y `env`.

## Aprobaciones de exec

- Cuando una solicitud de exec necesita aprobación, el gateway difunde `exec.approval.requested`.
- Los clientes operator resuelven llamando a `exec.approval.resolve` (requiere el alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes sin `systemRunPlan` se rechazan.
- Después de la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese
  `systemRunPlan` canónico como contexto autoritativo de comando/cwd/sesión.
- Si un llamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre prepare y el reenvío final aprobado de `system.run`, el
  gateway rechaza la ejecución en lugar de confiar en la carga útil modificada.

## Respaldo de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para solicitar entrega saliente.
- `bestEffortDeliver=false` mantiene el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando no se puede resolver ninguna ruta externa entregable (por ejemplo, sesiones internas/webchat o configuraciones ambiguas de varios canales).

## Control de versiones

- `PROTOCOL_VERSION` está en `src/gateway/protocol/schema/protocol-schemas.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza incompatibilidades.
- Los esquemas + modelos se generan a partir de definiciones TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores
son estables en el protocolo v3 y son la línea base esperada para clientes de terceros.

| Constante                                  | Predeterminado                                       | Fuente                                                     |
| ------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Tiempo de espera de solicitud (por RPC)    | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Tiempo de espera de preauth / connect-challenge | `10_000` ms                                     | `src/gateway/handshake-timeouts.ts` (límite `250`–`10_000`) |
| Backoff inicial de reconexión              | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff máximo de reconexión               | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Límite de reintento rápido tras cierre por token de dispositivo | `250` ms                         | `src/gateway/client.ts`                                    |
| Gracia de parada forzada antes de `terminate()` | `250` ms                                        | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Tiempo de espera predeterminado de `stopAndWait()` | `1_000` ms                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo predeterminado de tick (antes de `hello-ok`) | `30_000` ms                                 | `src/gateway/client.ts`                                    |
| Cierre por tiempo de espera de tick        | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                             |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`, `policy.maxPayload`
y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores
en lugar de los valores predeterminados anteriores al protocolo de enlace.

## Autenticación

- La autenticación del gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos con identidad, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  fuera de loopback, satisfacen la comprobación de autenticación de connect desde
  los encabezados de la solicitud en lugar de `connect.params.auth.*`.
- El modo de ingreso privado `gateway.auth.mode: "none"` omite por completo la autenticación
  de connect con secreto compartido; no expongas ese modo en un ingreso público/no confiable.
- Después del emparejamiento, Gateway emite un **token de dispositivo** con alcance para el
  rol + alcances de la conexión. Se devuelve en `hello-ok.auth.deviceToken` y el cliente
  debe persistirlo para conexiones futuras.
- Los clientes deben persistir el `hello-ok.auth.deviceToken` principal después de cualquier
  conexión correcta.
- Al reconectarse con ese token de dispositivo **almacenado**, también debe reutilizarse el conjunto
  aprobado de alcances almacenado para ese token. Esto preserva el acceso de lectura/sondeo/estado
  que ya se había concedido y evita reducir silenciosamente las reconexiones a un
  alcance implícito más estrecho de solo administrador.
- Ensamblaje de autenticación de connect del lado del cliente (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está configurado.
  - `auth.token` se completa en este orden de prioridad: primero el token compartido explícito,
    luego un `deviceToken` explícito, y después un token almacenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando ninguno de los anteriores resolvió un
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La promoción automática de un token de dispositivo almacenado en el reintento único de
    `AUTH_TOKEN_MISMATCH` está restringida a **endpoints confiables únicamente**:
    loopback, o `wss://` con `tlsFingerprint` fijado. `wss://` público
    sin fijación no cumple.
- Las entradas adicionales `hello-ok.auth.deviceTokens` son tokens de transferencia de bootstrap.
  Persístelos solo cuando la conexión haya usado autenticación bootstrap sobre un transporte confiable
  como `wss://` o emparejamiento loopback/local.
- Si un cliente proporciona un `deviceToken` **explícito** o `scopes` explícitos, ese
  conjunto de alcances solicitado por el llamante sigue siendo autoritativo; los alcances en caché solo
  se reutilizan cuando el cliente está reutilizando el token almacenado por dispositivo.
- Los tokens de dispositivo pueden rotarse/revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere el alcance `operator.pairing`).
- La emisión/rotación de tokens sigue limitada al conjunto aprobado de roles registrado en
  la entrada de emparejamiento de ese dispositivo; rotar un token no puede expandir el dispositivo a un
  rol que la aprobación de emparejamiento nunca concedió.
- Para sesiones con token de dispositivo emparejado, la gestión del dispositivo tiene alcance propio salvo que el
  llamante también tenga `operator.admin`: los llamantes no administradores solo pueden eliminar/revocar/rotar
  su **propia** entrada de dispositivo.
- `device.token.rotate` también comprueba el conjunto solicitado de alcances de operador frente a los
  alcances de la sesión actual del llamante. Los llamantes no administradores no pueden rotar un token a
  un conjunto más amplio de alcances de operador del que ya poseen.
- Los fallos de autenticación incluyen `error.details.code` más pistas de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un único reintento acotado con un token en caché por dispositivo.
  - Si ese reintento falla, los clientes deben detener los bucles automáticos de reconexión y mostrar instrucciones de acción al operador.

## Identidad del dispositivo + emparejamiento

- Los nodos deben incluir una identidad de dispositivo estable (`device.id`) derivada de la
  huella digital de un par de claves.
- Los gateways emiten tokens por dispositivo + rol.
- Se requieren aprobaciones de emparejamiento para nuevos ID de dispositivo salvo que esté habilitada
  la autoaprobación local.
- La autoaprobación de emparejamiento se centra en conexiones directas locales por local loopback.
- OpenClaw también tiene una ruta estrecha de autoconexión local de backend/contenedor para
  flujos auxiliares confiables con secreto compartido.
- Las conexiones en la misma tailnet o LAN del host siguen tratándose como remotas para el emparejamiento y
  requieren aprobación.
- Todos los clientes WS deben incluir identidad `device` durante `connect` (operator + node).
  Control UI solo puede omitirla en estos modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad con HTTP inseguro solo en localhost.
  - autenticación correcta de operator Control UI con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (solo emergencia, degradación grave de seguridad).
- Todas las conexiones deben firmar el nonce de `connect.challenge` proporcionado por el servidor.

### Diagnóstico de migración de autenticación de dispositivo

Para clientes heredados que todavía usan el comportamiento de firma previo al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un `error.details.reason` estable.

Fallos habituales de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                           |
| --------------------------- | -------------------------------- | ------------------------ | ----------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió vacío).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto.    |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de la firma no coincide con la v2.      |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera del desfase permitido. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/la canonización de la clave pública. |

Objetivo de la migración:

- Espera siempre `connect.challenge`.
- Firma la carga útil v2 que incluye el nonce del servidor.
- Envía el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos device/client/role/scopes/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación de metadatos
  del dispositivo emparejado sigue controlando la política de comandos al reconectar.

## TLS + fijación

- TLS es compatible con conexiones WS.
- Los clientes pueden fijar opcionalmente la huella digital del certificado del gateway (consulta la
  configuración `gateway.tls` más `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Alcance

Este protocolo expone la **API completa del gateway** (estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones, etc.). La superficie exacta está definida por los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.
