---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso a la Tailnet sin túneles SSH
summary: UI de control basada en navegador para el Gateway (chat, nodes, configuración)
title: UI de control
x-i18n:
    generated_at: "2026-04-25T13:59:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

La UI de control es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Se comunica **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se proporciona durante el handshake del WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del dashboard conserva un token para la sesión de pestaña actual del navegador
y la URL seleccionada del gateway; las contraseñas no se guardan. La incorporación normalmente
genera un token del gateway para autenticación con secreto compartido en la primera conexión, pero la autenticación por
contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento del dispositivo (primera conexión)

Cuando te conectas a la UI de control desde un navegador o dispositivo nuevo, el Gateway
requiere una **aprobación de emparejamiento de una sola vez** — incluso si estás en la misma Tailnet
con `gateway.auth.allowTailscale: true`. Esta es una medida de seguridad para evitar
accesos no autorizados.

**Lo que verás:** "disconnected (1008): pairing required"

**Para aprobar el dispositivo:**

```bash
# Listar solicitudes pendientes
openclaw devices list

# Aprobar por ID de solicitud
openclaw devices approve <requestId>
```

Si el navegador vuelve a intentar el emparejamiento con detalles de autenticación modificados (rol/alcances/clave
pública), la solicitud pendiente anterior queda sustituida y se crea un nuevo `requestId`.
Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y cambias su acceso de lectura a
acceso de escritura/admin, esto se trata como una ampliación de aprobación, no como una
reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión
con permisos ampliados y te pide que apruebes explícitamente el nuevo conjunto de alcances.

Una vez aprobado, el dispositivo se recuerda y no requerirá una nueva aprobación a menos
que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta
[Devices CLI](/es/cli/devices) para la rotación y revocación de tokens.

**Notas:**

- Las conexiones directas del navegador local por loopback (`127.0.0.1` / `localhost`) se
  aprueban automáticamente.
- Las conexiones del navegador por Tailnet y LAN siguen requiriendo aprobación explícita, incluso cuando
  se originan desde la misma máquina.
- Cada perfil del navegador genera un ID de dispositivo único, por lo que cambiar de navegador o
  borrar los datos del navegador requerirá volver a emparejar.

## Identidad personal (local del navegador)

La UI de control admite una identidad personal por navegador (nombre para mostrar y
avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Se
guarda en el almacenamiento del navegador, está limitada al perfil actual del navegador y no
se sincroniza con otros dispositivos ni se conserva del lado del servidor más allá de los metadatos normales
de autoría en el historial de mensajes que realmente envías. Borrar los datos del sitio o
cambiar de navegador la restablece a vacío.

## Endpoint de configuración en tiempo de ejecución

La UI de control obtiene su configuración en tiempo de ejecución desde
`/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma
autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden
obtenerlo, y una obtención correcta requiere un token/contraseña de gateway ya válidos,
identidad de Tailscale Serve o una identidad de proxy de confianza.

## Compatibilidad con idiomas

La UI de control puede localizarse en la primera carga según la configuración regional de tu navegador.
Para cambiarla más tarde, abre **Overview -> Gateway Access -> Language**. El
selector de idioma está en la tarjeta Gateway Access, no en Appearance.

- Idiomas compatibles: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Las traducciones no inglesas se cargan de forma diferida en el navegador.
- El idioma seleccionado se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción que falten vuelven al inglés.

## Lo que puede hacer (hoy)

- Chatear con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Hablar con OpenAI Realtime directamente desde el navegador mediante WebRTC. El Gateway
  genera un secreto de cliente Realtime de corta duración con `talk.realtime.session`; el
  navegador envía audio del micrófono directamente a OpenAI y retransmite las
  llamadas a herramientas `openclaw_agent_consult` a través de `chat.send` para el modelo de OpenClaw
  más grande configurado.
- Transmitir llamadas a herramientas + tarjetas de salida de herramientas en vivo en Chat (eventos del agente)
- Channels: estado de canales integrados más canales de plugin incluidos/externos, inicio de sesión con QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`)
- Instancias: lista de presencia + actualización (`system-presence`)
- Sesiones: lista + anulaciones por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: estado de Dreaming, alternancia habilitar/deshabilitar y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Tareas Cron: listar/agregar/editar/ejecutar/habilitar/deshabilitar + historial de ejecuciones (`cron.*`)
- Skills: estado, habilitar/deshabilitar, instalar, actualizaciones de API key (`skills.*`)
- Nodes: lista + capacidades (`node.list`)
- Aprobaciones de exec: editar listas permitidas del gateway o node + política de solicitud para `exec host=gateway/node` (`exec.approvals.*`)
- Configuración: ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuración: aplicar + reiniciar con validación (`config.apply`) y despertar la última sesión activa
- Las escrituras de configuración incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes
- Las escrituras de configuración (`config.set`/`config.apply`/`config.patch`) también realizan previamente la resolución activa de SecretRef para referencias en la carga útil de configuración enviada; las referencias activas enviadas sin resolver se rechazan antes de la escritura
- Esquema de configuración + renderizado de formularios (`config.schema` / `config.schema.lookup`,
  incluidos `title` / `description` del campo, sugerencias de UI coincidentes, resúmenes
  inmediatos de elementos hijos, metadatos de documentación en nodos anidados de objeto/comodín/array/composición,
  además de esquemas de plugin + channel cuando estén disponibles); el editor Raw JSON solo
  está disponible cuando el snapshot tiene un recorrido de ida y vuelta seguro del contenido sin procesar
- Si un snapshot no puede hacer un recorrido de ida y vuelta seguro del texto sin procesar, la UI de control fuerza el modo Form y desactiva el modo Raw para ese snapshot
- "Reset to saved" del editor Raw JSON preserva la forma escrita en bruto (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar un snapshot aplanado, para que las ediciones externas sobrevivan a un restablecimiento cuando el snapshot pueda hacer un recorrido de ida y vuelta seguro
- Los valores de objeto SecretRef estructurados se muestran como solo lectura en las entradas de texto del formulario para evitar corrupción accidental de objeto a cadena
- Depuración: snapshots de estado/health/models + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`)
- Registros: seguimiento en vivo de los archivos de registro del gateway con filtro/exportación (`logs.tail`)
- Actualización: ejecutar una actualización de paquete/git + reinicio (`update.run`) con un informe de reinicio

Notas del panel de tareas Cron:

- Para tareas aisladas, la entrega usa por defecto anuncio de resumen. Puedes cambiarla a none si quieres ejecuciones solo internas.
- Los campos de channel/target aparecen cuando se selecciona announce.
- El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL Webhook HTTP(S) válida.
- Para las tareas de sesión principal, están disponibles los modos de entrega webhook y none.
- Los controles avanzados de edición incluyen delete-after-run, clear agent override, opciones exact/stagger de cron,
  anulaciones de modelo/thinking del agente y alternancias de entrega de mejor esfuerzo.
- La validación del formulario es en línea con errores por campo; los valores no válidos desactivan el botón de guardar hasta que se corrijan.
- Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
- Respaldo obsoleto: las tareas heredadas almacenadas con `notify: true` todavía pueden usar `cron.webhook` hasta que se migren.

## Comportamiento del chat

- `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`.
- Reenviar con la misma `idempotencyKey` devuelve `{ status: "in_flight" }` mientras se está ejecutando, y `{ status: "ok" }` después de completarse.
- Las respuestas de `chat.history` están limitadas en tamaño por seguridad de la UI. Cuando las entradas del historial son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y reemplazar mensajes sobredimensionados por un marcador (`[chat.history omitted: message too large]`).
- Las imágenes del asistente/generadas se conservan como referencias de medios gestionados y se sirven de vuelta mediante URL de medios autenticadas de Gateway, para que las recargas no dependan de que las cargas útiles de imagen base64 sin procesar sigan en la respuesta del historial del chat.
- `chat.history` también elimina de la parte visible del texto del asistente las etiquetas de directivas incrustadas solo de visualización (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), las cargas útiles XML de llamadas a herramientas en texto sin formato (incluyendo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y los tokens de control del modelo filtrados en ASCII/ancho completo, y omite entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply`.
- Durante un envío activo y la actualización final del historial, la vista del chat mantiene visibles los mensajes locales optimistas de usuario/asistente si `chat.history` devuelve brevemente un snapshot más antiguo; el historial canónico reemplaza esos mensajes locales una vez que el historial del Gateway se pone al día.
- `chat.inject` agrega una nota del asistente al historial de la sesión y emite un evento `chat` para actualizaciones solo de UI (sin ejecución de agente, sin entrega a channel).
- Los selectores de modelo y thinking del encabezado del chat modifican inmediatamente la sesión activa mediante `sessions.patch`; son anulaciones persistentes de la sesión, no opciones de envío de un solo turno.
- Cuando los informes recientes de uso de sesión del Gateway muestran alta presión de contexto, el área del editor del chat muestra un aviso de contexto y, en niveles de compactación recomendados, un botón de compactación que ejecuta la ruta normal de Compaction de la sesión. Los snapshots de tokens obsoletos se ocultan hasta que el Gateway vuelva a informar uso reciente.
- El modo Talk usa un proveedor de voz realtime registrado que admite sesiones WebRTC del navegador. Configura OpenAI con `talk.provider: "openai"` más `talk.providers.openai.apiKey`, o reutiliza la configuración del proveedor realtime de Voice Call. El navegador nunca recibe la API key estándar de OpenAI; recibe solo el secreto efímero del cliente Realtime. La voz realtime de Google Live es compatible con Voice Call del backend y con puentes de Google Meet, pero todavía no con esta ruta WebRTC del navegador. El prompt de la sesión Realtime lo ensambla el Gateway; `talk.realtime.session` no acepta anulaciones de instrucciones proporcionadas por quien llama.
- En el editor del Chat, el control Talk es el botón de ondas junto al
  botón de dictado por micrófono. Cuando Talk comienza, la fila de estado del editor muestra
  `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o
  `Asking OpenClaw...` mientras una llamada a herramienta realtime consulta el
  modelo configurado de mayor tamaño a través de `chat.send`.
- Detener:
  - Haz clic en **Stop** (llama a `chat.abort`)
  - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Steer** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
  - Escribe `/stop` (o frases de cancelación independientes como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para cancelar fuera de banda
  - `chat.abort` admite `{ sessionKey }` (sin `runId`) para cancelar todas las ejecuciones activas de esa sesión
- Conservación parcial tras cancelación:
  - Cuando una ejecución se cancela, el texto parcial del asistente puede seguir mostrándose en la UI
  - Gateway conserva en el historial el texto parcial del asistente cancelado cuando existe salida en búfer
  - Las entradas conservadas incluyen metadatos de cancelación para que los consumidores del historial puedan distinguir los parciales cancelados de la salida normal completada

## Instalación PWA y web push

La UI de control incluye un `manifest.webmanifest` y un service worker, por lo que
los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite que el
Gateway reactive la PWA instalada con notificaciones incluso cuando la pestaña o la
ventana del navegador no está abierta.

| Superficie                                            | Qué hace                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifiesto PWA. Los navegadores ofrecen "Instalar app" una vez que es accesible. |
| `ui/public/sw.js`                                     | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (bajo el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente que se usa para firmar cargas útiles de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de suscripción del navegador conservados.                |

Anula el par de claves VAPID mediante variables de entorno en el proceso Gateway cuando
quieras fijar las claves (para despliegues con varios hosts, rotación de secretos o
pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predeterminado: `mailto:openclaw@localhost`)

La UI de control usa estos métodos del Gateway limitados por alcance para registrar y
probar suscripciones del navegador:

- `push.web.vapidPublicKey` — obtiene la clave pública VAPID activa.
- `push.web.subscribe` — registra un `endpoint` junto con `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — elimina un endpoint registrado.
- `push.web.test` — envía una notificación de prueba a la suscripción del llamador.

Web Push es independiente de la ruta de relay APNS de iOS
(consulta [Configuration](/es/gateway/configuration) para push respaldado por relay) y
del método existente `push.test`, que apunta al emparejamiento móvil nativo.

## Embeds alojados

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`.
La política de sandbox del iframe está controlada por
`gateway.controlUi.embedSandbox`:

- `strict`: desactiva la ejecución de scripts dentro de los embeds alojados
- `scripts`: permite embeds interactivos manteniendo el aislamiento de origen; este es
  el valor predeterminado y normalmente es suficiente para juegos/widgets de navegador autocontenidos
- `trusted`: agrega `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio
  que intencionadamente necesitan privilegios más amplios

Ejemplo:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Usa `trusted` solo cuando el documento embebido realmente necesite comportamiento
de mismo origen. Para la mayoría de juegos generados por agentes y canvas interactivos, `scripts` es
la opción más segura.

Las URL de embed externas absolutas `http(s)` siguen bloqueadas por defecto. Si
intencionadamente quieres que `[embed url="https://..."]` cargue páginas de terceros, establece
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Acceso a Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantén el Gateway en loopback y deja que Tailscale Serve le haga proxy con HTTPS:

```bash
openclaw gateway --tailscale serve
```

Abre:

- `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

Por defecto, las solicitudes de Control UI/WebSocket Serve pueden autenticarse mediante encabezados de identidad de Tailscale
(`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw
verifica la identidad resolviendo la dirección `x-forwarded-for` con
`tailscale whois` y comparándola con el encabezado, y solo las acepta cuando la
solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Establece
`gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas con secreto compartido
incluso para tráfico de Serve. Luego usa `gateway.auth.mode: "token"` o
`"password"`.
Para esa ruta asíncrona de identidad de Serve, los intentos fallidos de autenticación para la misma IP cliente
y el mismo alcance de autenticación se serializan antes de las escrituras del límite de tasa.
Las repeticiones concurrentes incorrectas desde el mismo navegador pueden, por tanto, mostrar `retry later` en la segunda solicitud
en lugar de dos discrepancias simples compitiendo en paralelo.
La autenticación de Serve sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, exige autenticación con token/contraseña.

### Vincular a tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Luego abre:

- `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

Pega el secreto compartido correspondiente en la configuración de la UI (enviado como
`connect.params.auth.token` o `connect.params.auth.password`).

## HTTP inseguro

Si abres el dashboard mediante HTTP simple (`http://<lan-ip>` o `http://<tailscale-ip>`),
el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. Por defecto,
OpenClaw **bloquea** las conexiones de la UI de control sin identidad del dispositivo.

Excepciones documentadas:

- compatibilidad con HTTP inseguro solo en localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación correcta del operador en la UI de control mediante `gateway.auth.mode: "trusted-proxy"`
- modo de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Solución recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del gateway)

**Comportamiento de la opción de autenticación insegura:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` es solo una opción de compatibilidad local:

- Permite que las sesiones de la UI de control en localhost continúen sin identidad de dispositivo en
  contextos HTTP no seguros.
- No omite las comprobaciones de emparejamiento.
- No relaja los requisitos de identidad de dispositivo remotos (que no sean localhost).

**Solo para emergencia:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad del dispositivo de la UI de control y supone una
grave degradación de seguridad. Revierte el cambio rápidamente después del uso de emergencia.

Nota sobre trusted-proxy:

- una autenticación correcta de trusted-proxy puede admitir sesiones de la UI de control de **operador** sin
  identidad de dispositivo
- esto **no** se extiende a sesiones de la UI de control con rol node
- los proxies inversos loopback en el mismo host siguen sin satisfacer la autenticación trusted-proxy; consulta
  [Trusted proxy auth](/es/gateway/trusted-proxy-auth)

Consulta [Tailscale](/es/gateway/tailscale) para la guía de configuración de HTTPS.

## Política de seguridad de contenido

La UI de control se entrega con una política `img-src` estricta: solo se permiten
recursos de **mismo origen**, URL `data:` y URL `blob:` generadas localmente. Las URL de imagen remotas `http(s)` y relativas al protocolo son rechazadas por el navegador y no emiten solicitudes de red.

Qué significa esto en la práctica:

- Los avatares e imágenes servidos en rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatar autenticadas que la UI obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` en línea siguen renderizándose (útil para cargas útiles dentro del protocolo).
- Las URL `blob:` locales creadas por la UI de control siguen renderizándose.
- Las URL de avatar remotas emitidas por metadatos de channel se eliminan en los helpers de avatar de la UI de control y se reemplazan con el logotipo/insignia integrado, de modo que un channel comprometido o malicioso no pueda forzar recuperaciones arbitrarias de imágenes remotas desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: está siempre activado y no es configurable.

## Autenticación de la ruta de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de la UI de control requiere el mismo token del gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las dos rutas son rechazadas (igual que la ruta hermana de medios del asistente). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que por lo demás están protegidos.
- La propia UI de control reenvía el token del gateway como encabezado bearer al obtener avatares, y usa URL `blob:` autenticadas para que la imagen siga renderizándose en los dashboards.

Si desactivas la autenticación del gateway (no recomendado en hosts compartidos), la ruta de avatar también pasa a ser no autenticada, en línea con el resto del gateway.

## Compilar la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```

Base absoluta opcional (cuando quieres URL de recursos fijas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desarrollo local (servidor de desarrollo separado):

```bash
pnpm ui:dev
```

Luego apunta la UI a la URL WS de tu Gateway (por ejemplo `ws://127.0.0.1:18789`).

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La UI de control son archivos estáticos; el objetivo WebSocket es configurable y puede ser
distinto del origen HTTP. Esto es útil cuando quieres el servidor de desarrollo de Vite
localmente pero el Gateway se ejecuta en otra parte.

1. Inicia el servidor de desarrollo de la UI: `pnpm ui:dev`
2. Abre una URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticación opcional de una sola vez (si hace falta):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notas:

- `gatewayUrl` se guarda en localStorage después de la carga y se elimina de la URL.
- `token` debe pasarse mediante el fragmento de URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y Referer. Los parámetros heredados `?token=` de consulta siguen importándose una vez por compatibilidad, pero solo como respaldo, y se eliminan inmediatamente después del arranque.
- `password` se mantiene solo en memoria.
- Cuando `gatewayUrl` está configurado, la UI no recurre a credenciales de configuración ni del entorno.
  Proporciona `token` (o `password`) explícitamente. La ausencia de credenciales explícitas es un error.
- Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` solo se acepta en una ventana de nivel superior (no embebida) para evitar clickjacking.
- Los despliegues de Control UI fuera de loopback deben establecer `gateway.controlUi.allowedOrigins`
  explícitamente (orígenes completos). Esto incluye configuraciones remotas de desarrollo.
- No uses `gateway.controlUi.allowedOrigins: ["*"]` salvo en pruebas locales estrictamente controladas.
  Significa permitir cualquier origen del navegador, no “coincidir con cualquier host que esté
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  el modo de respaldo de origen mediante encabezado Host, pero es un modo de seguridad peligroso.

Ejemplo:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detalles de configuración de acceso remoto: [Remote access](/es/gateway/remote).

## Relacionado

- [Dashboard](/es/web/dashboard) — dashboard del gateway
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [Health Checks](/es/gateway/health) — supervisión del estado del gateway
