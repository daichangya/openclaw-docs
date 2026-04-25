---
read_when:
    - Implementar o actualizar clientes WS del gateway
    - Depurar desajustes de protocolo o fallos de conexión
    - Regenerar el esquema/modelos del protocolo
summary: 'Protocolo WebSocket del Gateway: protocolo de enlace, tramas y versionado'
title: protocolo del Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

El protocolo WS del Gateway es el **único plano de control + transporte de nodos** para
OpenClaw. Todos los clientes (CLI, interfaz web, app de macOS, nodos iOS/Android, nodos
sin interfaz) se conectan por WebSocket y declaran su **rol** + **alcance** en el momento
del protocolo de enlace.

## Transporte

- WebSocket, tramas de texto con carga útil JSON.
- La primera trama **debe** ser una solicitud `connect`.
- Las tramas previas a la conexión están limitadas a 64 KiB. Tras un protocolo de enlace correcto, los clientes
  deben respetar los límites `hello-ok.policy.maxPayload` y
  `hello-ok.policy.maxBufferedBytes`. Con los diagnósticos habilitados,
  las tramas entrantes sobredimensionadas y los búferes salientes lentos emiten eventos `payload.large`
  antes de que el gateway cierre o descarte la trama afectada. Estos eventos conservan
  tamaños, límites, superficies y códigos de razón seguros. No conservan el cuerpo del mensaje,
  el contenido de archivos adjuntos, el cuerpo sin procesar de la trama, tokens, cookies ni valores secretos.

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

`server`, `features`, `snapshot` y `policy` son todos obligatorios según el esquema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` es opcional. `auth`
informa del rol/alcances negociados cuando están disponibles, e incluye `deviceToken`
cuando el gateway emite uno.

Cuando no se emite ningún token de dispositivo, `hello-ok.auth` aún puede informar los
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
adicionales de roles acotados en `deviceTokens`:

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

Para el flujo integrado de bootstrap nodo/operador, el token principal del nodo mantiene
`scopes: []` y cualquier token de operador transferido sigue acotado a la lista de permitidos del operador de bootstrap
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Las comprobaciones de alcance de bootstrap siguen
con prefijo de rol: las entradas de operador solo satisfacen solicitudes de operador, y los roles
que no son operador siguen necesitando alcances bajo su propio prefijo de rol.

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

## Tramas

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

Los métodos RPC del Gateway registrados por plugins pueden solicitar su propio alcance de operador, pero
los prefijos reservados de administración del núcleo (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) siempre se resuelven a `operator.admin`.

El alcance del método es solo la primera barrera. Algunos comandos con barra alcanzados mediante
`chat.send` aplican comprobaciones más estrictas a nivel de comando. Por ejemplo, las escrituras persistentes
de `/config set` y `/config unset` requieren `operator.admin`.

`node.pair.approve` también tiene una comprobación adicional de alcance en tiempo de aprobación además del
alcance base del método:

- solicitudes sin comando: `operator.pairing`
- solicitudes con comandos de nodo que no sean exec: `operator.pairing` + `operator.write`
- solicitudes que incluyen `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Los nodos declaran reclamaciones de capacidades en el momento de conectarse:

- `caps`: categorías de capacidad de alto nivel.
- `commands`: lista de permitidos de comandos para invoke.
- `permissions`: conmutadores granulares (por ejemplo, `screen.record`, `camera.capture`).

El Gateway trata estas como **reclamaciones** y aplica listas de permitidos del lado del servidor.

## Presencia

- `system-presence` devuelve entradas indexadas por identidad del dispositivo.
- Las entradas de presencia incluyen `deviceId`, `roles` y `scopes` para que las IU puedan mostrar una sola fila por dispositivo
  incluso cuando se conecta como **operator** y **node** al mismo tiempo.

## Limitación por alcance de eventos broadcast

Los eventos broadcast enviados por el servidor a través de WebSocket están limitados por alcance para que las sesiones con alcance de emparejamiento o solo de nodo no reciban pasivamente contenido de sesión.

- **Las tramas de chat, agente y resultados de herramientas** (incluidos los eventos `agent` transmitidos y los resultados de llamadas a herramientas) requieren al menos `operator.read`. Las sesiones sin `operator.read` omiten estas tramas por completo.
- **Los broadcasts `plugin.*` definidos por plugins** se limitan a `operator.write` o `operator.admin`, según cómo los haya registrado el plugin.
- **Los eventos de estado y transporte** (`heartbeat`, `presence`, `tick`, ciclo de vida de conexión/desconexión, etc.) siguen sin restricciones para que el estado del transporte siga siendo observable para toda sesión autenticada.
- **Las familias desconocidas de eventos broadcast** se limitan por alcance de forma predeterminada (fallo cerrado), salvo que un controlador registrado las relaje explícitamente.

Cada conexión cliente mantiene su propio número de secuencia por cliente para que los broadcasts preserven el orden monótono en ese socket incluso cuando distintos clientes ven distintos subconjuntos filtrados por alcance del flujo de eventos.

## Familias habituales de métodos RPC

La superficie pública de WS es más amplia que los ejemplos de protocolo de enlace/autenticación anteriores. Esto
no es un volcado generado: `hello-ok.features.methods` es una lista conservadora
de descubrimiento construida a partir de `src/gateway/server-methods-list.ts` más los
métodos exportados por plugins/canales cargados. Trátala como descubrimiento de funciones, no como una enumeración completa de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identidad">
    - `health` devuelve la instantánea de estado del gateway almacenada en caché o recién sondeada.
    - `diagnostics.stability` devuelve el registrador de estabilidad de diagnóstico acotado reciente. Conserva metadatos operativos como nombres de eventos, recuentos, tamaños en bytes, lecturas de memoria, estado de colas/sesiones, nombres de canal/plugin e ID de sesión. No conserva texto de chat, cuerpos de Webhook, salidas de herramientas, cuerpos sin procesar de solicitudes o respuestas, tokens, cookies ni valores secretos. Requiere alcance de lectura de operador.
    - `status` devuelve el resumen del gateway al estilo de `/status`; los campos sensibles solo se incluyen para clientes operador con alcance de administrador.
    - `gateway.identity.get` devuelve la identidad del dispositivo del gateway usada por los flujos de retransmisión y emparejamiento.
    - `system-presence` devuelve la instantánea actual de presencia para los dispositivos operator/node conectados.
    - `system-event` agrega un evento del sistema y puede actualizar/transmitir contexto de presencia.
    - `last-heartbeat` devuelve el último evento Heartbeat persistido.
    - `set-heartbeats` activa o desactiva el procesamiento de Heartbeat en el gateway.
  </Accordion>

  <Accordion title="Modelos y uso">
    - `models.list` devuelve el catálogo de modelos permitidos en tiempo de ejecución.
    - `usage.status` devuelve resúmenes de ventanas de uso de proveedores/cuota restante.
    - `usage.cost` devuelve resúmenes agregados de costes de uso para un intervalo de fechas.
    - `doctor.memory.status` devuelve el estado de preparación de vector-memory / embeddings para el espacio de trabajo activo del agente predeterminado.
    - `sessions.usage` devuelve resúmenes de uso por sesión.
    - `sessions.usage.timeseries` devuelve series temporales de uso para una sesión.
    - `sessions.usage.logs` devuelve entradas del registro de uso para una sesión.
  </Accordion>

  <Accordion title="Canales y asistentes de inicio de sesión">
    - `channels.status` devuelve resúmenes de estado de canales/plugins integrados y empaquetados.
    - `channels.logout` cierra la sesión de un canal/cuenta específica cuando el canal admite cierre de sesión.
    - `web.login.start` inicia un flujo de inicio de sesión por QR/web para el proveedor actual de canal web compatible con QR.
    - `web.login.wait` espera a que ese flujo de inicio de sesión por QR/web se complete e inicia el canal si tiene éxito.
    - `push.test` envía una notificación push APNs de prueba a un nodo iOS registrado.
    - `voicewake.get` devuelve los activadores almacenados de palabras de activación.
    - `voicewake.set` actualiza los activadores de palabras de activación y transmite el cambio.
  </Accordion>

  <Accordion title="Mensajería y registros">
    - `send` es el RPC de entrega directa saliente para envíos dirigidos a canal/cuenta/hilo fuera del ejecutor de chat.
    - `logs.tail` devuelve el final configurado del registro de archivos del gateway con controles de cursor/límite y bytes máximos.
  </Accordion>

  <Accordion title="Talk y TTS">
    - `talk.config` devuelve la carga útil efectiva de configuración de Talk; `includeSecrets` requiere `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` establece/transmite el estado actual del modo Talk para clientes de WebChat/UI de Control.
    - `talk.speak` sintetiza voz mediante el proveedor de voz Talk activo.
    - `tts.status` devuelve el estado de TTS habilitado, el proveedor activo, los proveedores de respaldo y el estado de configuración del proveedor.
    - `tts.providers` devuelve el inventario visible de proveedores TTS.
    - `tts.enable` y `tts.disable` activan o desactivan el estado de preferencias de TTS.
    - `tts.setProvider` actualiza el proveedor TTS preferido.
    - `tts.convert` ejecuta una conversión puntual de texto a voz.
  </Accordion>

  <Accordion title="Secrets, configuración, actualizaciones y asistente">
    - `secrets.reload` vuelve a resolver los SecretRef activos e intercambia el estado secreto en tiempo de ejecución solo cuando todo se completa correctamente.
    - `secrets.resolve` resuelve asignaciones de secretos dirigidas a comandos para un conjunto específico de comando/objetivo.
    - `config.get` devuelve la instantánea actual de configuración y su hash.
    - `config.set` escribe una carga útil de configuración validada.
    - `config.patch` fusiona una actualización parcial de configuración.
    - `config.apply` valida y reemplaza la carga útil completa de configuración.
    - `config.schema` devuelve la carga útil del esquema de configuración en vivo usada por la IU de Control y las herramientas de CLI: esquema, `uiHints`, versión y metadatos de generación, incluidos metadatos de esquema de plugins y canales cuando el tiempo de ejecución puede cargarlos. El esquema incluye metadatos de campo `title` / `description` derivados de las mismas etiquetas y texto de ayuda usados por la IU, incluidas ramas de composición de objetos anidados, comodines, elementos de matriz y `anyOf` / `oneOf` / `allOf` cuando existe documentación de campo coincidente.
    - `config.schema.lookup` devuelve una carga útil de búsqueda limitada a una ruta para una ruta de configuración: ruta normalizada, nodo superficial del esquema, `hint` coincidente + `hintPath`, y resúmenes inmediatos de hijos para exploración en profundidad en UI/CLI. Los nodos de esquema de búsqueda conservan la documentación visible para el usuario y los campos comunes de validación (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, límites numéricos/de cadena/de matriz/de objeto, y marcas como `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Los resúmenes de hijos exponen `key`, `path` normalizada, `type`, `required`, `hasChildren`, además de `hint` / `hintPath` coincidentes.
    - `update.run` ejecuta el flujo de actualización del gateway y programa un reinicio solo cuando la propia actualización se completó correctamente.
    - `wizard.start`, `wizard.next`, `wizard.status` y `wizard.cancel` exponen el asistente de incorporación mediante WS RPC.
  </Accordion>

  <Accordion title="Asistentes de agente y espacio de trabajo">
    - `agents.list` devuelve las entradas de agente configuradas.
    - `agents.create`, `agents.update` y `agents.delete` gestionan registros de agentes y la conexión del espacio de trabajo.
    - `agents.files.list`, `agents.files.get` y `agents.files.set` gestionan los archivos del espacio de trabajo de bootstrap expuestos para un agente.
    - `agent.identity.get` devuelve la identidad efectiva del asistente para un agente o sesión.
    - `agent.wait` espera a que finalice una ejecución y devuelve la instantánea terminal cuando está disponible.
  </Accordion>

  <Accordion title="Control de sesiones">
    - `sessions.list` devuelve el índice actual de sesiones.
    - `sessions.subscribe` y `sessions.unsubscribe` activan o desactivan las suscripciones a eventos de cambio de sesión para el cliente WS actual.
    - `sessions.messages.subscribe` y `sessions.messages.unsubscribe` activan o desactivan las suscripciones a eventos de transcripción/mensajes para una sesión.
    - `sessions.preview` devuelve vistas previas acotadas de la transcripción para claves de sesión específicas.
    - `sessions.resolve` resuelve o canoniza un destino de sesión.
    - `sessions.create` crea una nueva entrada de sesión.
    - `sessions.send` envía un mensaje a una sesión existente.
    - `sessions.steer` es la variante de interrumpir y redirigir para una sesión activa.
    - `sessions.abort` aborta el trabajo activo de una sesión.
    - `sessions.patch` actualiza metadatos/anulaciones de sesión.
    - `sessions.reset`, `sessions.delete` y `sessions.compact` realizan mantenimiento de sesiones.
    - `sessions.get` devuelve la fila completa almacenada de la sesión.
    - La ejecución del chat sigue usando `chat.history`, `chat.send`, `chat.abort` y `chat.inject`. `chat.history` está normalizado para visualización en clientes UI: las etiquetas de directivas en línea se eliminan del texto visible, las cargas útiles XML de llamadas a herramientas en texto sin formato (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control del modelo filtrados en ASCII/ancho completo se eliminan, las filas del asistente compuestas solo por tokens silenciosos como `NO_REPLY` / `no_reply` exactos se omiten, y las filas sobredimensionadas pueden reemplazarse por marcadores de posición.
  </Accordion>

  <Accordion title="Emparejamiento de dispositivos y tokens de dispositivo">
    - `device.pair.list` devuelve los dispositivos emparejados pendientes y aprobados.
    - `device.pair.approve`, `device.pair.reject` y `device.pair.remove` gestionan los registros de emparejamiento de dispositivos.
    - `device.token.rotate` rota un token de dispositivo emparejado dentro de los límites aprobados de su rol y alcance.
    - `device.token.revoke` revoca un token de dispositivo emparejado.
  </Accordion>

  <Accordion title="Emparejamiento de nodos, invoke y trabajo pendiente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` y `node.pair.verify` cubren el emparejamiento de nodos y la verificación de bootstrap.
    - `node.list` y `node.describe` devuelven el estado de nodos conocidos/conectados.
    - `node.rename` actualiza la etiqueta de un nodo emparejado.
    - `node.invoke` reenvía un comando a un nodo conectado.
    - `node.invoke.result` devuelve el resultado de una solicitud invoke.
    - `node.event` transporta eventos originados en el nodo de vuelta al gateway.
    - `node.canvas.capability.refresh` actualiza tokens limitados por alcance de capacidad de canvas.
    - `node.pending.pull` y `node.pending.ack` son las API de cola para nodos conectados.
    - `node.pending.enqueue` y `node.pending.drain` gestionan trabajo pendiente duradero para nodos desconectados/fuera de línea.
  </Accordion>

  <Accordion title="Familias de aprobaciones">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` y `exec.approval.resolve` cubren solicitudes puntuales de aprobación de exec más la búsqueda/repetición de aprobaciones pendientes.
    - `exec.approval.waitDecision` espera una aprobación de exec pendiente y devuelve la decisión final (o `null` si agota el tiempo de espera).
    - `exec.approvals.get` y `exec.approvals.set` gestionan instantáneas de la política de aprobaciones de exec del gateway.
    - `exec.approvals.node.get` y `exec.approvals.node.set` gestionan la política local de aprobaciones de exec del nodo mediante comandos de retransmisión del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` y `plugin.approval.resolve` cubren flujos de aprobación definidos por Plugin.
  </Accordion>

  <Accordion title="Automatización, Skills y herramientas">
    - Automatización: `wake` programa una inyección inmediata o en el siguiente Heartbeat de texto de activación; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestionan el trabajo programado.
    - Skills y herramientas: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Familias habituales de eventos

- `chat`: actualizaciones de chat de la UI como `chat.inject` y otros eventos
  de chat solo de transcripción.
- `session.message` y `session.tool`: actualizaciones del flujo de
  transcripción/eventos para una sesión suscrita.
- `sessions.changed`: el índice o los metadatos de la sesión cambiaron.
- `presence`: actualizaciones de la instantánea de presencia del sistema.
- `tick`: evento periódico de keepalive / vivacidad.
- `health`: actualización de la instantánea de estado del gateway.
- `heartbeat`: actualización del flujo de eventos de Heartbeat.
- `cron`: evento de cambio de ejecución/trabajo de cron.
- `shutdown`: notificación de apagado del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo de vida del emparejamiento de nodos.
- `node.invoke.request`: broadcast de solicitud invoke de nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo de vida de dispositivo emparejado.
- `voicewake.changed`: cambió la configuración del activador de palabra de activación.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo de vida de aprobación de exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo de vida de aprobación de plugins.

### Métodos auxiliares de nodo

- Los nodos pueden llamar a `skills.bins` para obtener la lista actual de ejecutables de Skills
  para comprobaciones de permiso automático.

### Métodos auxiliares de operador

- Los operadores pueden llamar a `commands.list` (`operator.read`) para obtener el inventario de comandos
  en tiempo de ejecución de un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - `scope` controla a qué superficie apunta el `name` principal:
    - `text` devuelve el token principal de comando de texto sin la `/` inicial
    - `native` y la ruta predeterminada `both` devuelven nombres nativos sensibles al proveedor
      cuando están disponibles
  - `textAliases` contiene alias exactos con barra como `/model` y `/m`.
  - `nativeName` contiene el nombre nativo del comando según el proveedor cuando existe.
  - `provider` es opcional y solo afecta el nombre nativo y la disponibilidad de comandos nativos de plugins.
  - `includeArgs=false` omite metadatos serializados de argumentos en la respuesta.
- Los operadores pueden llamar a `tools.catalog` (`operator.read`) para obtener el catálogo de herramientas en tiempo de ejecución de un
  agente. La respuesta incluye herramientas agrupadas y metadatos de procedencia:
  - `source`: `core` o `plugin`
  - `pluginId`: propietario del plugin cuando `source="plugin"`
  - `optional`: si una herramienta de plugin es opcional
- Los operadores pueden llamar a `tools.effective` (`operator.read`) para obtener el inventario efectivo de herramientas en tiempo de ejecución
  para una sesión.
  - `sessionKey` es obligatorio.
  - El gateway deriva del lado del servidor el contexto de tiempo de ejecución de confianza a partir de la sesión, en lugar de aceptar
    autenticación o contexto de entrega proporcionados por el llamante.
  - La respuesta tiene ámbito de sesión y refleja lo que la conversación activa puede usar ahora mismo,
    incluidas herramientas de núcleo, plugins y canales.
- Los operadores pueden llamar a `skills.status` (`operator.read`) para obtener el inventario visible
  de Skills para un agente.
  - `agentId` es opcional; omítelo para leer el espacio de trabajo del agente predeterminado.
  - La respuesta incluye elegibilidad, requisitos ausentes, comprobaciones de configuración y
    opciones de instalación saneadas sin exponer valores secretos sin procesar.
- Los operadores pueden llamar a `skills.search` y `skills.detail` (`operator.read`) para
  metadatos de descubrimiento de ClawHub.
- Los operadores pueden llamar a `skills.install` (`operator.admin`) en dos modos:
  - Modo ClawHub: `{ source: "clawhub", slug, version?, force? }` instala una
    carpeta de skill en el directorio `skills/` del espacio de trabajo del agente predeterminado.
  - Modo instalador del gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    ejecuta una acción declarada `metadata.openclaw.install` en el host del gateway.
- Los operadores pueden llamar a `skills.update` (`operator.admin`) en dos modos:
  - El modo ClawHub actualiza un slug rastreado o todas las instalaciones rastreadas de ClawHub en
    el espacio de trabajo del agente predeterminado.
  - El modo Config parchea valores `skills.entries.<skillKey>` como `enabled`,
    `apiKey` y `env`.

## Aprobaciones de exec

- Cuando una solicitud de exec necesita aprobación, el gateway transmite `exec.approval.requested`.
- Los clientes operador resuelven llamando a `exec.approval.resolve` (requiere alcance `operator.approvals`).
- Para `host=node`, `exec.approval.request` debe incluir `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadatos de sesión canónicos). Las solicitudes sin `systemRunPlan` se rechazan.
- Tras la aprobación, las llamadas reenviadas `node.invoke system.run` reutilizan ese
  `systemRunPlan` canónico como contexto autoritativo de comando/cwd/sesión.
- Si un llamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` entre la preparación y el reenvío final aprobado de `system.run`, el
  gateway rechaza la ejecución en lugar de confiar en la carga útil modificada.

## Respaldo de entrega del agente

- Las solicitudes `agent` pueden incluir `deliver=true` para pedir entrega saliente.
- `bestEffortDeliver=false` mantiene el comportamiento estricto: los destinos de entrega no resueltos o solo internos devuelven `INVALID_REQUEST`.
- `bestEffortDeliver=true` permite recurrir a ejecución solo de sesión cuando no puede resolverse ninguna ruta entregable externa (por ejemplo sesiones internas/webchat o configuraciones ambiguas de varios canales).

## Versionado

- `PROTOCOL_VERSION` vive en `src/gateway/protocol/schema/protocol-schemas.ts`.
- Los clientes envían `minProtocol` + `maxProtocol`; el servidor rechaza desajustes.
- Los esquemas + modelos se generan a partir de definiciones TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes del cliente

El cliente de referencia en `src/gateway/client.ts` usa estos valores predeterminados. Los valores son
estables en todo el protocolo v3 y son la base esperada para clientes de terceros.

| Constante                                  | Predeterminado                                               | Origen                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Tiempo de espera de solicitud (por RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Tiempo de espera de preautenticación / desafío de conexión       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (límite `250`–`10_000`) |
| Retroceso inicial de reconexión                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Retroceso máximo de reconexión                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Límite de reintento rápido tras cierre de token de dispositivo | `250` ms                                              | `src/gateway/client.ts`                                    |
| Gracia de parada forzada antes de `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Tiempo de espera predeterminado de `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalo de tick predeterminado (antes de `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Cierre por tiempo de espera de tick                        | código `4000` cuando el silencio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

El servidor anuncia los valores efectivos de `policy.tickIntervalMs`, `policy.maxPayload`
y `policy.maxBufferedBytes` en `hello-ok`; los clientes deben respetar esos valores
en lugar de los valores predeterminados previos al protocolo de enlace.

## Autenticación

- La autenticación del gateway con secreto compartido usa `connect.params.auth.token` o
  `connect.params.auth.password`, según el modo de autenticación configurado.
- Los modos con identidad, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` fuera de loopback,
  satisfacen la comprobación de autenticación de conexión a partir de
  encabezados de solicitud en lugar de `connect.params.auth.*`.
- El ingreso privado con `gateway.auth.mode: "none"` omite por completo la autenticación de conexión con secreto compartido;
  no expongas ese modo en ingresos públicos/no confiables.
- Después del emparejamiento, el Gateway emite un **token de dispositivo** limitado al
  rol + alcances de la conexión. Se devuelve en `hello-ok.auth.deviceToken` y el
  cliente debe conservarlo para futuras conexiones.
- Los clientes deben conservar el `hello-ok.auth.deviceToken` principal después de cualquier
  conexión correcta.
- La reconexión con ese token de dispositivo **almacenado** también debe reutilizar el conjunto
  de alcances aprobados almacenado para ese token. Esto conserva el acceso de lectura/sondeo/estado
  que ya había sido concedido y evita reducir silenciosamente las reconexiones a un
  alcance implícito más estrecho solo de administrador.
- Ensamblaje del lado del cliente de la autenticación de conexión (`selectConnectAuth` en
  `src/gateway/client.ts`):
  - `auth.password` es ortogonal y siempre se reenvía cuando está configurado.
  - `auth.token` se completa en este orden de prioridad: primero token compartido explícito,
    luego `deviceToken` explícito, luego un token almacenado por dispositivo (indexado por
    `deviceId` + `role`).
  - `auth.bootstrapToken` se envía solo cuando ninguna de las opciones anteriores resolvió un
    `auth.token`. Un token compartido o cualquier token de dispositivo resuelto lo suprime.
  - La autopromoción de un token de dispositivo almacenado en el reintento puntual
    `AUTH_TOKEN_MISMATCH` está limitada a **endpoints confiables únicamente**:
    loopback, o `wss://` con `tlsFingerprint` fijado. El `wss://` público
    sin fijación no cumple ese requisito.
- Las entradas adicionales `hello-ok.auth.deviceTokens` son tokens de transferencia de bootstrap.
  Consérvalos solo cuando la conexión haya usado autenticación de bootstrap sobre un transporte confiable
  como `wss://` o loopback/emparejamiento local.
- Si un cliente proporciona un `deviceToken` **explícito** o `scopes` explícitos, ese
  conjunto de alcances solicitado por el llamante sigue siendo autoritativo; los alcances almacenados en caché solo
  se reutilizan cuando el cliente está reutilizando el token almacenado por dispositivo.
- Los tokens de dispositivo pueden rotarse/revocarse mediante `device.token.rotate` y
  `device.token.revoke` (requiere alcance `operator.pairing`).
- La emisión/rotación de tokens sigue limitada al conjunto de roles aprobados registrado en
  la entrada de emparejamiento de ese dispositivo; rotar un token no puede expandir el dispositivo a un
  rol que la aprobación del emparejamiento nunca concedió.
- Para sesiones de tokens de dispositivo emparejado, la gestión de dispositivos está limitada al propio dispositivo salvo que el
  llamante también tenga `operator.admin`: los llamantes sin administración solo pueden eliminar/revocar/rotar
  su **propia** entrada de dispositivo.
- `device.token.rotate` también comprueba el conjunto solicitado de alcances de operador frente a los
  alcances actuales de la sesión del llamante. Los llamantes sin administración no pueden rotar un token a
  un conjunto más amplio de alcances de operador del que ya tienen.
- Los fallos de autenticación incluyen `error.details.code` más sugerencias de recuperación:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamiento del cliente para `AUTH_TOKEN_MISMATCH`:
  - Los clientes confiables pueden intentar un reintento limitado con un token almacenado por dispositivo.
  - Si ese reintento falla, los clientes deben detener los bucles automáticos de reconexión y mostrar orientación de acción al operador.

## Identidad del dispositivo + emparejamiento

- Los nodos deben incluir una identidad de dispositivo estable (`device.id`) derivada de la huella digital
  de un par de claves.
- Los Gateways emiten tokens por dispositivo + rol.
- Las aprobaciones de emparejamiento son obligatorias para nuevos ID de dispositivo, salvo que la aprobación local automática
  esté habilitada.
- La aprobación automática de emparejamiento se centra en conexiones directas locales por loopback.
- OpenClaw también tiene una ruta estrecha de autoconexión local de backend/contenedor para
  flujos auxiliares confiables con secreto compartido.
- Las conexiones del mismo host por tailnet o LAN siguen tratándose como remotas para el emparejamiento y
  requieren aprobación.
- Todos los clientes WS deben incluir identidad `device` durante `connect` (operator + node).
  La IU de Control puede omitirla solo en estos modos:
  - `gateway.controlUi.allowInsecureAuth=true` para compatibilidad localhost-only con HTTP inseguro.
  - autenticación correcta de operador de IU de Control con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (mecanismo de emergencia, degradación severa de seguridad).
- Todas las conexiones deben firmar el nonce `connect.challenge` proporcionado por el servidor.

### Diagnósticos de migración de autenticación de dispositivo

Para clientes heredados que todavía usan comportamiento de firma previo al desafío, `connect` ahora devuelve
códigos de detalle `DEVICE_AUTH_*` en `error.details.code` con un `error.details.reason` estable.

Fallos habituales de migración:

| Mensaje                     | details.code                     | details.reason           | Significado                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | El cliente omitió `device.nonce` (o lo envió vacío).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | El cliente firmó con un nonce obsoleto/incorrecto.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La carga útil de la firma no coincide con la carga útil v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | La marca de tiempo firmada está fuera de la desviación permitida.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` no coincide con la huella digital de la clave pública. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Falló el formato/canonización de la clave pública.         |

Objetivo de la migración:

- Esperar siempre a `connect.challenge`.
- Firmar la carga útil v2 que incluye el nonce del servidor.
- Enviar el mismo nonce en `connect.params.device.nonce`.
- La carga útil de firma preferida es `v3`, que vincula `platform` y `deviceFamily`
  además de los campos device/client/role/scopes/token/nonce.
- Las firmas heredadas `v2` siguen aceptándose por compatibilidad, pero la fijación de metadatos
  de dispositivo emparejado sigue controlando la política de comandos al reconectar.

## TLS + fijación

- TLS es compatible para conexiones WS.
- Los clientes pueden fijar opcionalmente la huella digital del certificado del gateway (consulta la configuración `gateway.tls`
  más `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Alcance

Este protocolo expone la **API completa del gateway** (estado, canales, modelos, chat,
agente, sesiones, nodos, aprobaciones, etc.). La superficie exacta está definida por los
esquemas TypeBox en `src/gateway/protocol/schema.ts`.

## Relacionado

- [Protocolo de puente](/es/gateway/bridge-protocol)
- [Guía operativa del Gateway](/es/gateway)
