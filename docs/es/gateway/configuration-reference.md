---
read_when:
    - Necesitas la semántica exacta o los valores predeterminados de la configuración a nivel de campo
    - Estás validando bloques de configuración de canal, modelo, Gateway o herramienta
summary: Referencia de configuración del Gateway para las claves principales de OpenClaw, valores predeterminados y enlaces a referencias dedicadas de subsistemas
title: Referencia de configuración
x-i18n:
    generated_at: "2026-04-25T13:45:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Referencia principal de configuración para `~/.openclaw/openclaw.json`. Para una visión general orientada a tareas, consulta [Configuración](/es/gateway/configuration).

Cubre las principales superficies de configuración de OpenClaw y enlaza hacia fuera cuando un subsistema tiene su propia referencia más profunda. Los catálogos de comandos propiedad de canales y Plugins, así como los controles profundos de memoria/QMD, se encuentran en sus propias páginas y no en esta.

Fuente de verdad del código:

- `openclaw config schema` imprime el esquema JSON en vivo usado para la validación y la UI de Control, con metadatos combinados de incluidos/Plugins/canales cuando están disponibles
- `config.schema.lookup` devuelve un nodo de esquema acotado por ruta para herramientas de exploración detallada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validan el hash de línea base de docs de configuración frente a la superficie de esquema actual

Referencias profundas dedicadas:

- [Referencia de configuración de memoria](/es/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` y la configuración de Dreaming en `plugins.entries.memory-core.config.dreaming`
- [Comandos de barra](/es/tools/slash-commands) para el catálogo actual de comandos integrados + incluidos
- páginas del canal/Plugin propietario para superficies de comandos específicas del canal

El formato de configuración es **JSON5** (se permiten comentarios + comas finales). Todos los campos son opcionales: OpenClaw usa valores predeterminados seguros cuando se omiten.

---

## Canales

Las claves de configuración por canal se movieron a una página dedicada: consulta
[Configuración — canales](/es/gateway/config-channels) para `channels.*`,
incluidos Slack, Discord, Telegram, WhatsApp, Matrix, iMessage y otros
canales incluidos (autenticación, control de acceso, multicuenta, restricción por menciones).

## Valores predeterminados de agentes, multiagente, sesiones y mensajes

Se movió a una página dedicada: consulta
[Configuración — agentes](/es/gateway/config-agents) para:

- `agents.defaults.*` (espacio de trabajo, modelo, razonamiento, Heartbeat, memoria, multimedia, Skills, sandbox)
- `multiAgent.*` (enrutamiento y vinculaciones multiagente)
- `session.*` (ciclo de vida de la sesión, Compaction, poda)
- `messages.*` (entrega de mensajes, TTS, renderizado Markdown)
- `talk.*` (modo Talk)
  - `talk.silenceTimeoutMs`: cuando no está establecido, Talk mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms en macOS y Android, 900 ms en iOS`)

## Herramientas y proveedores personalizados

La política de herramientas, los interruptores experimentales, la configuración de herramientas respaldadas por proveedor y la configuración de proveedor personalizado / URL base se movieron a una página dedicada: consulta
[Configuración — herramientas y proveedores personalizados](/es/gateway/config-tools).

## MCP

Las definiciones de servidores MCP gestionadas por OpenClaw viven en `mcp.servers` y son
consumidas por Pi integrado y otros adaptadores de runtime. Los comandos `openclaw mcp list`,
`show`, `set` y `unset` gestionan este bloque sin conectarse al
servidor de destino durante las ediciones de configuración.

```json5
{
  mcp: {
    // Opcional. Predeterminado: 600000 ms (10 minutos). Establece 0 para desactivar la expulsión por inactividad.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: definiciones con nombre de servidores MCP stdio o remotos para runtimes que
  exponen herramientas MCP configuradas.
- `mcp.sessionIdleTtlMs`: TTL de inactividad para runtimes MCP incluidos acotados por sesión.
  Las ejecuciones integradas de un solo uso solicitan limpieza al final de la ejecución; este TTL es el respaldo para
  sesiones de larga duración y futuros llamadores.
- Los cambios bajo `mcp.*` se aplican en caliente eliminando los runtimes MCP de sesión almacenados en caché.
  El siguiente descubrimiento/uso de herramienta los recrea a partir de la nueva configuración, por lo que las entradas eliminadas de
  `mcp.servers` se recogen inmediatamente en lugar de esperar al TTL de inactividad.

Consulta [MCP](/es/cli/mcp#openclaw-as-an-mcp-client-registry) y
[Backends CLI](/es/gateway/cli-backends#bundle-mcp-overlays) para el comportamiento en runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // o cadena en texto sin formato
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: lista de permitidos opcional solo para Skills incluidos (los Skills gestionados/del espacio de trabajo no se ven afectados).
- `load.extraDirs`: raíces compartidas adicionales de Skills (precedencia más baja).
- `install.preferBrew`: cuando es true, prefiere instaladores Homebrew cuando `brew` está
  disponible antes de recurrir a otros tipos de instalador.
- `install.nodeManager`: preferencia de instalador Node para especificaciones `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desactiva un Skill aunque esté incluido/instalado.
- `entries.<skillKey>.apiKey`: campo de conveniencia para Skills que declaran una variable de entorno principal (cadena en texto sin formato u objeto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Cargados desde `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, además de `plugins.load.paths`.
- El descubrimiento acepta Plugins nativos de OpenClaw, además de bundles compatibles de Codex y Claude, incluidos bundles de Claude sin manifiesto con diseño predeterminado.
- **Los cambios de configuración requieren un reinicio del Gateway.**
- `allow`: lista de permitidos opcional (solo se cargan los Plugins enumerados). `deny` tiene prioridad.
- `plugins.entries.<id>.apiKey`: campo de conveniencia de clave API a nivel de Plugin (cuando el Plugin lo admite).
- `plugins.entries.<id>.env`: mapa de variables de entorno con ámbito de Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: cuando es `false`, el núcleo bloquea `before_prompt_build` e ignora los campos que mutan prompts de `before_agent_start` heredado, mientras preserva `modelOverride` y `providerOverride` heredados. Se aplica a hooks de Plugins nativos y a directorios de hooks proporcionados por bundles compatibles.
- `plugins.entries.<id>.hooks.allowConversationAccess`: cuando es `true`, los Plugins de confianza no incluidos pueden leer contenido de conversación sin procesar desde hooks tipados como `llm_input`, `llm_output` y `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: confía explícitamente en este Plugin para solicitar reemplazos por ejecución de `provider` y `model` para ejecuciones de subagentes en segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: lista de permitidos opcional de destinos canónicos `provider/model` para reemplazos confiables de subagentes. Usa `"*"` solo cuando realmente quieras permitir cualquier modelo.
- `plugins.entries.<id>.config`: objeto de configuración definido por el Plugin (validado por el esquema nativo del Plugin de OpenClaw cuando está disponible).
- Los ajustes de cuenta/runtime de Plugins de canal viven bajo `channels.<id>` y deben describirse mediante los metadatos `channelConfigs` del manifiesto del Plugin propietario, no mediante un registro central de opciones de OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: configuración del proveedor de captura web de Firecrawl.
  - `apiKey`: clave API de Firecrawl (acepta SecretRef). Recurre a `plugins.entries.firecrawl.config.webSearch.apiKey`, al heredado `tools.web.fetch.firecrawl.apiKey` o a la variable de entorno `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base de la API de Firecrawl (predeterminada: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrae solo el contenido principal de las páginas (predeterminado: `true`).
  - `maxAgeMs`: antigüedad máxima de caché en milisegundos (predeterminado: `172800000` / 2 días).
  - `timeoutSeconds`: tiempo de espera de la solicitud de scraping en segundos (predeterminado: `60`).
- `plugins.entries.xai.config.xSearch`: configuración de xAI X Search (búsqueda web de Grok).
  - `enabled`: habilita el proveedor X Search.
  - `model`: modelo Grok que se usará para la búsqueda (por ejemplo `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configuración de Dreaming de memoria. Consulta [Dreaming](/es/concepts/dreaming) para fases y umbrales.
  - `enabled`: interruptor maestro de Dreaming (predeterminado `false`).
  - `frequency`: cadencia Cron para cada barrido completo de Dreaming (predeterminado `"0 3 * * *"`).
  - la política de fases y los umbrales son detalles de implementación (no son claves de configuración orientadas al usuario).
- La configuración completa de memoria vive en [Referencia de configuración de memoria](/es/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Los Plugins de bundle de Claude habilitados también pueden aportar valores predeterminados integrados de Pi desde `settings.json`; OpenClaw los aplica como ajustes de agente saneados, no como parches sin procesar de configuración de OpenClaw.
- `plugins.slots.memory`: elige el id del Plugin de memoria activo, o `"none"` para desactivar los Plugins de memoria.
- `plugins.slots.contextEngine`: elige el id del Plugin de motor de contexto activo; el valor predeterminado es `"legacy"` a menos que instales y selecciones otro motor.
- `plugins.installs`: metadatos de instalación gestionados por CLI usados por `openclaw plugins update`.
  - Incluye `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trata `plugins.installs.*` como estado gestionado; prefiere los comandos CLI en lugar de ediciones manuales.

Consulta [Plugins](/es/tools/plugin).

---

## Navegador

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilítalo explícitamente solo para acceso confiable a red privada
      // allowPrivateNetwork: true, // alias heredado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` desactiva `act:evaluate` y `wait --fn`.
- `tabCleanup` recupera las pestañas principales del agente rastreadas tras un tiempo de inactividad o cuando una
  sesión supera su límite. Establece `idleMinutes: 0` o `maxTabsPerSession: 0` para
  desactivar esos modos de limpieza individuales.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado cuando no se establece, por lo que la navegación del navegador sigue siendo estricta de forma predeterminada.
- Establece `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo cuando confíes intencionadamente en la navegación del navegador por red privada.
- En modo estricto, los endpoints de perfiles CDP remotos (`profiles.*.cdpUrl`) están sujetos al mismo bloqueo de red privada durante las comprobaciones de accesibilidad/detección.
- `ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- En modo estricto, usa `ssrfPolicy.hostnameAllowlist` y `ssrfPolicy.allowedHostnames` para excepciones explícitas.
- Los perfiles remotos son solo de conexión adjunta (inicio/detención/restablecimiento desactivados).
- `profiles.*.cdpUrl` acepta `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) cuando quieras que OpenClaw detecte `/json/version`; usa WS(S)
  cuando tu proveedor te dé una URL directa de WebSocket DevTools.
- Los perfiles `existing-session` usan Chrome MCP en lugar de CDP y pueden adjuntarse en
  el host seleccionado o a través de un Node de navegador conectado.
- Los perfiles `existing-session` pueden establecer `userDataDir` para dirigirse a un perfil específico
  de navegador basado en Chromium como Brave o Edge.
- Los perfiles `existing-session` mantienen los límites actuales de la ruta Chrome MCP:
  acciones guiadas por snapshot/ref en lugar de direccionamiento por selector CSS, hooks de carga de un solo archivo,
  sin reemplazos de tiempo de espera de diálogos, sin `wait --load networkidle`, y sin
  `responsebody`, exportación a PDF, interceptación de descargas ni acciones por lotes.
- Los perfiles `openclaw` locales gestionados asignan automáticamente `cdpPort` y `cdpUrl`; solo
  establece `cdpUrl` explícitamente para CDP remoto.
- Los perfiles locales gestionados pueden establecer `executablePath` para reemplazar el valor global
  `browser.executablePath` para ese perfil. Úsalo para ejecutar un perfil en
  Chrome y otro en Brave.
- Los perfiles locales gestionados usan `browser.localLaunchTimeoutMs` para la detección HTTP de Chrome CDP
  tras el inicio del proceso y `browser.localCdpReadyTimeoutMs` para la
  disponibilidad del WebSocket CDP tras el arranque. Auméntalos en hosts más lentos donde Chrome
  arranca correctamente pero las comprobaciones de disponibilidad se adelantan al inicio.
- Orden de detección automática: navegador predeterminado si está basado en Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` acepta `~` para el directorio personal de tu sistema operativo.
- Servicio de control: solo loopback (puerto derivado de `gateway.port`, predeterminado `18791`).
- `extraArgs` añade indicadores extra de arranque al inicio local de Chromium (por ejemplo
  `--disable-gpu`, tamaño de ventana o indicadores de depuración).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, texto corto, URL de imagen o URI de datos
    },
  },
}
```

- `seamColor`: color de acento para el chrome de la UI de la app nativa (tinte de la burbuja del modo Talk, etc.).
- `assistant`: reemplazo de identidad de la UI de Control. Recurre a la identidad del agente activo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // o OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // para mode=trusted-proxy; consulta /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // peligroso: permitir URLs absolutas externas http(s) embebidas
      // allowedOrigins: ["https://control.example.com"], // obligatorio para UI de Control no loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modo peligroso de respaldo de origen Host-header
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Opcional. Predeterminado false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Opcional. Predeterminado no establecido/desactivado.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Denegaciones HTTP adicionales de /tools/invoke
      deny: ["browser"],
      // Elimina herramientas de la lista predeterminada de denegación HTTP
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detalles de campos del Gateway">

- `mode`: `local` (ejecutar gateway) o `remote` (conectarse a un gateway remoto). El Gateway se niega a iniciarse salvo que sea `local`.
- `port`: puerto multiplexado único para WS + HTTP. Precedencia: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predeterminado), `lan` (`0.0.0.0`), `tailnet` (solo IP de Tailscale), o `custom`.
- **Aliases heredados de bind**: usa valores de modo bind en `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), no aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota sobre Docker**: el bind predeterminado `loopback` escucha en `127.0.0.1` dentro del contenedor. Con redes bridge de Docker (`-p 18789:18789`), el tráfico llega por `eth0`, por lo que el gateway no es accesible. Usa `--network host`, o establece `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) para escuchar en todas las interfaces.
- **Autenticación**: obligatoria de forma predeterminada. Los bind que no son loopback requieren autenticación del Gateway. En la práctica, eso significa un token/contraseña compartidos o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`. El asistente de onboarding genera un token de forma predeterminada.
- Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` (incluidos SecretRefs), establece `gateway.auth.mode` explícitamente en `token` o `password`. El inicio y los flujos de instalación/reparación del servicio fallan cuando ambos están configurados y el modo no está establecido.
- `gateway.auth.mode: "none"`: modo explícito sin autenticación. Úsalo solo para configuraciones confiables de loopback local; intencionadamente no se ofrece en los prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega la autenticación a un proxy inverso con reconocimiento de identidad y confía en los encabezados de identidad de `gateway.trustedProxies` (consulta [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth)). Este modo espera un origen de proxy **que no sea loopback**; los proxies inversos loopback en el mismo host no satisfacen la autenticación trusted-proxy.
- `gateway.auth.allowTailscale`: cuando es `true`, los encabezados de identidad de Tailscale Serve pueden satisfacer la autenticación de UI de Control/WebSocket (verificado mediante `tailscale whois`). Los endpoints de API HTTP **no** usan esa autenticación por encabezado de Tailscale; siguen el modo normal de autenticación HTTP del gateway. Este flujo sin token asume que el host del gateway es confiable. El valor predeterminado es `true` cuando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de autenticación fallida. Se aplica por IP cliente y por ámbito de autenticación (secreto compartido y token de dispositivo se rastrean de forma independiente). Los intentos bloqueados devuelven `429` + `Retry-After`.
  - En la ruta asíncrona de UI de Control de Tailscale Serve, los intentos fallidos para el mismo `{scope, clientIp}` se serializan antes de escribir el fallo. Por tanto, intentos erróneos concurrentes del mismo cliente pueden activar el limitador en la segunda solicitud en lugar de que ambos pasen compitiendo como simples discrepancias.
  - `gateway.auth.rateLimit.exemptLoopback` tiene como valor predeterminado `true`; establece `false` cuando intencionadamente quieras limitar también el tráfico localhost (para configuraciones de prueba o despliegues estrictos con proxy).
- Los intentos de autenticación WS de origen navegador siempre se limitan con la exención de loopback desactivada (defensa en profundidad contra fuerza bruta basada en navegador en localhost).
- En loopback, esos bloqueos de origen navegador se aíslan por valor `Origin`
  normalizado, de modo que los fallos repetidos desde un origen localhost no
  bloquean automáticamente a un origen distinto.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) o `funnel` (público, requiere autenticación).
- `controlUi.allowedOrigins`: lista explícita de permitidos de orígenes de navegador para conexiones WebSocket del Gateway. Obligatoria cuando se esperan clientes de navegador desde orígenes que no son loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo peligroso que habilita el respaldo de origen mediante encabezado Host para despliegues que dependen intencionadamente de la política de origen del encabezado Host.
- `remote.transport`: `ssh` (predeterminado) o `direct` (ws/wss). Para `direct`, `remote.url` debe ser `ws://` o `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: anulación de emergencia del
  entorno de proceso del lado cliente que permite `ws://` en texto plano hacia IPs
  de red privada de confianza; el valor predeterminado sigue siendo solo loopback para texto plano. No existe equivalente en `openclaw.json`,
  y la configuración de red privada del navegador como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` no afecta a los clientes
  WebSocket del Gateway.
- `gateway.remote.token` / `.password` son campos de credenciales de cliente remoto. No configuran por sí solos la autenticación del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base para el relay APNs externo usado por las compilaciones oficiales/TestFlight de iOS después de que publiquen registros respaldados por relay en el gateway. Esta URL debe coincidir con la URL del relay compilada en la compilación de iOS.
- `gateway.push.apns.relay.timeoutMs`: tiempo de espera de envío de gateway a relay en milisegundos. El valor predeterminado es `10000`.
- Los registros respaldados por relay se delegan a una identidad específica del gateway. La app iOS emparejada obtiene `gateway.identity.get`, incluye esa identidad en el registro del relay y reenvía al gateway una concesión de envío con ámbito del registro. Otro gateway no puede reutilizar ese registro almacenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: anulaciones temporales mediante entorno para la configuración de relay anterior.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: vía de escape solo para desarrollo para URLs de relay HTTP loopback. Las URLs de relay de producción deben mantenerse en HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo del monitor de salud de canales en minutos. Establece `0` para desactivar globalmente los reinicios del monitor de salud. Predeterminado: `5`.
- `gateway.channelStaleEventThresholdMinutes`: umbral de socket obsoleto en minutos. Mantén este valor mayor o igual que `gateway.channelHealthCheckMinutes`. Predeterminado: `30`.
- `gateway.channelMaxRestartsPerHour`: número máximo de reinicios del monitor de salud por canal/cuenta en una hora móvil. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: exclusión opcional por canal de los reinicios del monitor de salud manteniendo habilitado el monitor global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación por cuenta para canales multicuenta. Cuando está establecido, tiene prioridad sobre la anulación a nivel de canal.
- Las rutas de llamada de gateway local pueden usar `gateway.remote.*` como respaldo solo cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no puede resolverse, la resolución falla de forma cerrada (sin enmascaramiento por respaldo remoto).
- `trustedProxies`: IPs de proxies inversos que terminan TLS o inyectan encabezados de cliente reenviado. Enumera solo proxies que controles. Las entradas loopback siguen siendo válidas para configuraciones de detección local/proxy en el mismo host (por ejemplo Tailscale Serve o un proxy inverso local), pero **no** hacen que las solicitudes loopback sean aptas para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: cuando es `true`, el gateway acepta `X-Real-IP` si falta `X-Forwarded-For`. Predeterminado `false` para comportamiento de fallo cerrado.
- `gateway.nodes.pairing.autoApproveCidrs`: lista opcional de permitidos CIDR/IP para aprobar automáticamente el emparejamiento inicial de dispositivos node sin ámbitos solicitados. Está desactivada cuando no se establece. Esto no aprueba automáticamente el emparejamiento de operador/navegador/UI de Control/WebChat, ni aprueba automáticamente mejoras de rol, ámbito, metadatos o clave pública.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modelado global de permisos/denegaciones para comandos declarados de node después del emparejamiento y la evaluación de listas de permitidos.
- `gateway.tools.deny`: nombres adicionales de herramientas bloqueadas para HTTP `POST /tools/invoke` (amplía la lista predeterminada de denegación).
- `gateway.tools.allow`: elimina nombres de herramientas de la lista predeterminada de denegación HTTP.

</Accordion>

### Endpoints compatibles con OpenAI

- Chat Completions: desactivado de forma predeterminada. Habilítalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Refuerzo de seguridad de entrada por URL en Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Las listas de permitidos vacías se tratan como no establecidas; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    y/o `gateway.http.endpoints.responses.images.allowUrl=false` para desactivar la obtención por URL.
- Encabezado opcional de refuerzo de seguridad de respuestas:
  - `gateway.http.securityHeaders.strictTransportSecurity` (establécelo solo para orígenes HTTPS que controles; consulta [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Aislamiento de múltiples instancias

Ejecuta varios gateways en un solo host con puertos y directorios de estado únicos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Indicadores de conveniencia: `--dev` (usa `~/.openclaw-dev` + puerto `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulta [Múltiples Gateways](/es/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: habilita la terminación TLS en el listener del gateway (HTTPS/WSS) (predeterminado: `false`).
- `autoGenerate`: genera automáticamente un par local de certificado/clave autofirmados cuando no hay archivos explícitos configurados; solo para uso local/desarrollo.
- `certPath`: ruta del sistema de archivos al archivo de certificado TLS.
- `keyPath`: ruta del sistema de archivos a la clave privada TLS; mantén permisos restringidos.
- `caPath`: ruta opcional al paquete CA para verificación de clientes o cadenas de confianza personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: controla cómo se aplican en runtime las ediciones de configuración.
  - `"off"`: ignora ediciones en vivo; los cambios requieren un reinicio explícito.
  - `"restart"`: siempre reinicia el proceso del gateway ante cambios de configuración.
  - `"hot"`: aplica cambios en proceso sin reiniciar.
  - `"hybrid"` (predeterminado): intenta primero una recarga en caliente; recurre a reinicio si es necesario.
- `debounceMs`: ventana de debounce en ms antes de aplicar cambios de configuración (entero no negativo).
- `deferralTimeoutMs`: tiempo máximo opcional en ms para esperar a que terminen las operaciones en curso antes de forzar un reinicio. Omítelo o establece `0` para esperar indefinidamente y registrar advertencias periódicas de operaciones aún pendientes.

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Autenticación: `Authorization: Bearer <token>` o `x-openclaw-token: <token>`.
Se rechazan los tokens de hook en la cadena de consulta.

Notas de validación y seguridad:

- `hooks.enabled=true` requiere un `hooks.token` no vacío.
- `hooks.token` debe ser **distinto** de `gateway.auth.token`; se rechaza reutilizar el token del Gateway.
- `hooks.path` no puede ser `/`; usa una subruta dedicada como `/hooks`.
- Si `hooks.allowRequestSessionKey=true`, restringe `hooks.allowedSessionKeyPrefixes` (por ejemplo `["hook:"]`).
- Si una asignación o preset usa un `sessionKey` con plantilla, establece `hooks.allowedSessionKeyPrefixes` y `hooks.allowRequestSessionKey=true`. Las claves estáticas de asignación no requieren esa aceptación explícita.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` desde la carga útil de la solicitud se acepta solo cuando `hooks.allowRequestSessionKey=true` (predeterminado: `false`).
- `POST /hooks/<name>` → se resuelve mediante `hooks.mappings`
  - Los valores `sessionKey` renderizados por plantilla en asignaciones se tratan como suministrados externamente y también requieren `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalles de asignación">

- `match.path` coincide con la subruta después de `/hooks` (por ejemplo `/hooks/gmail` → `gmail`).
- `match.source` coincide con un campo de la carga útil para rutas genéricas.
- Las plantillas como `{{messages[0].subject}}` leen de la carga útil.
- `transform` puede apuntar a un módulo JS/TS que devuelve una acción de hook.
  - `transform.module` debe ser una ruta relativa y permanecer dentro de `hooks.transformsDir` (se rechazan rutas absolutas y recorridos).
- `agentId` enruta a un agente específico; los IDs desconocidos recurren al valor predeterminado.
- `allowedAgentIds`: restringe el enrutamiento explícito (`*` u omitido = permitir todos, `[]` = denegar todos).
- `defaultSessionKey`: clave de sesión fija opcional para ejecuciones de agentes de hook sin `sessionKey` explícito.
- `allowRequestSessionKey`: permite a los llamadores de `/hooks/agent` y a las claves de sesión de asignación controladas por plantillas establecer `sessionKey` (predeterminado: `false`).
- `allowedSessionKeyPrefixes`: lista de permitidos opcional de prefijos para valores explícitos de `sessionKey` (solicitud + asignación), por ejemplo `["hook:"]`. Pasa a ser obligatoria cuando alguna asignación o preset usa un `sessionKey` con plantilla.
- `deliver: true` envía la respuesta final a un canal; `channel` usa por defecto `last`.
- `model` reemplaza el LLM para esta ejecución de hook (debe estar permitido si el catálogo de modelos está establecido).

</Accordion>

### Integración de Gmail

- El preset integrado de Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Si mantienes ese enrutamiento por mensaje, establece `hooks.allowRequestSessionKey: true` y restringe `hooks.allowedSessionKeyPrefixes` para que coincida con el espacio de nombres de Gmail, por ejemplo `["hook:", "hook:gmail:"]`.
- Si necesitas `hooks.allowRequestSessionKey: false`, reemplaza el preset con un `sessionKey` estático en lugar del valor predeterminado con plantilla.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- El Gateway inicia automáticamente `gog gmail watch serve` al arrancar cuando está configurado. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.
- No ejecutes un `gog gmail watch serve` separado junto al Gateway.

---

## Host de Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // o OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Sirve HTML/CSS/JS editable por agentes y A2UI por HTTP bajo el puerto del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo local: mantén `gateway.bind: "loopback"` (predeterminado).
- Binds que no son loopback: las rutas de canvas requieren autenticación del Gateway (token/contraseña/trusted-proxy), igual que otras superficies HTTP del Gateway.
- Los WebViews de Node normalmente no envían encabezados de autenticación; después de que un node se empareja y conecta, el Gateway anuncia URLs de capacidad con ámbito de node para acceso a canvas/A2UI.
- Las URLs de capacidad están vinculadas a la sesión WS activa del node y vencen rápidamente. No se usa respaldo basado en IP.
- Inyecta cliente de live reload en el HTML servido.
- Crea automáticamente un `index.html` inicial cuando está vacío.
- También sirve A2UI en `/__openclaw__/a2ui/`.
- Los cambios requieren un reinicio del gateway.
- Desactiva live reload para directorios grandes o errores `EMFILE`.

---

## Detección

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (predeterminado): omite `cliPath` + `sshPort` de los registros TXT.
- `full`: incluye `cliPath` + `sshPort`.
- El nombre de host usa por defecto `openclaw`. Reemplázalo con `OPENCLAW_MDNS_HOSTNAME`.

### Área amplia (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Escribe una zona DNS-SD unicast en `~/.openclaw/dns/`. Para detección entre redes, combínala con un servidor DNS (se recomienda CoreDNS) + split DNS de Tailscale.

Configuración: `openclaw dns setup --apply`.

---

## Entorno

### `env` (variables de entorno en línea)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Las variables de entorno en línea solo se aplican si al entorno del proceso le falta la clave.
- Archivos `.env`: `.env` del directorio de trabajo actual + `~/.openclaw/.env` (ninguno reemplaza variables existentes).
- `shellEnv`: importa las claves esperadas que falten desde el perfil de shell de inicio de sesión.
- Consulta [Entorno](/es/help/environment) para ver la precedencia completa.

### Sustitución de variables de entorno

Haz referencia a variables de entorno en cualquier cadena de configuración con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Solo coinciden nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`.
- Las variables faltantes/vacías generan un error al cargar la configuración.
- Escapa con `$${VAR}` para un literal `${VAR}`.
- Funciona con `$include`.

---

## Secretos

Las referencias de secretos son aditivas: los valores en texto sin formato siguen funcionando.

### `SecretRef`

Usa una única forma de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validación:

- patrón de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- patrón de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: puntero JSON absoluto (por ejemplo `"/providers/openai/apiKey"`)
- patrón de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- Los ids de `source: "exec"` no deben contener segmentos de ruta delimitados por barra `.` o `..` (por ejemplo se rechaza `a/../b`)

### Superficie de credenciales compatible

- Matriz canónica: [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface)
- `secrets apply` se dirige a rutas de credenciales compatibles de `openclaw.json`.
- Las refs de `auth-profiles.json` se incluyen en la resolución en runtime y en la cobertura de auditoría.

### Configuración de proveedores de secretos

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // proveedor env explícito opcional
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Notas:

- El proveedor `file` admite `mode: "json"` y `mode: "singleValue"` (el `id` debe ser `"value"` en modo singleValue).
- Las rutas de proveedores file y exec fallan de forma cerrada cuando la verificación ACL de Windows no está disponible. Establece `allowInsecurePath: true` solo para rutas de confianza que no se puedan verificar.
- El proveedor `exec` requiere una ruta `command` absoluta y usa cargas útiles de protocolo en stdin/stdout.
- De forma predeterminada, se rechazan las rutas de comando con symlink. Establece `allowSymlinkCommand: true` para permitir rutas con symlink mientras se valida la ruta de destino resuelta.
- Si `trustedDirs` está configurado, la comprobación de directorio de confianza se aplica a la ruta de destino resuelta.
- El entorno hijo de `exec` es mínimo de forma predeterminada; pasa explícitamente las variables requeridas con `passEnv`.
- Las referencias de secretos se resuelven en el momento de activación en una instantánea en memoria; después, las rutas de solicitud solo leen esa instantánea.
- El filtrado de superficies activas se aplica durante la activación: las refs no resueltas en superficies habilitadas hacen fallar el inicio/la recarga, mientras que las superficies inactivas se omiten con diagnósticos.

---

## Almacenamiento de autenticación

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Los perfiles por agente se almacenan en `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` admite refs a nivel de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credenciales estáticos.
- Los perfiles en modo OAuth (`auth.profiles.<id>.mode = "oauth"`) no admiten credenciales de perfil de autenticación respaldadas por SecretRef.
- Las credenciales estáticas de runtime proceden de instantáneas resueltas en memoria; las entradas heredadas estáticas de `auth.json` se limpian cuando se detectan.
- Las importaciones heredadas de OAuth proceden de `~/.openclaw/credentials/oauth.json`.
- Consulta [OAuth](/es/concepts/oauth).
- Comportamiento en runtime de secretos y herramientas `audit/configure/apply`: [Gestión de secretos](/es/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: retroceso base en horas cuando un perfil falla por errores reales de
  facturación/crédito insuficiente (predeterminado: `5`). El texto explícito de facturación puede
  seguir llegando aquí incluso en respuestas `401`/`403`, pero los comparadores de texto específicos del proveedor
  siguen limitados al proveedor que les corresponde (por ejemplo OpenRouter
  `Key limit exceeded`). Los mensajes reintentables `402` de ventana de uso o
  de límite de gasto de organización/espacio de trabajo permanecen en la ruta `rate_limit`
  en su lugar.
- `billingBackoffHoursByProvider`: reemplazos opcionales por proveedor para las horas de retroceso de facturación.
- `billingMaxHours`: límite en horas para el crecimiento exponencial del retroceso de facturación (predeterminado: `24`).
- `authPermanentBackoffMinutes`: retroceso base en minutos para fallos `auth_permanent` de alta confianza (predeterminado: `10`).
- `authPermanentMaxMinutes`: límite en minutos para el crecimiento del retroceso de `auth_permanent` (predeterminado: `60`).
- `failureWindowHours`: ventana móvil en horas usada para contadores de retroceso (predeterminado: `24`).
- `overloadedProfileRotations`: rotaciones máximas de perfiles de autenticación del mismo proveedor para errores de sobrecarga antes de cambiar al respaldo de modelo (predeterminado: `1`). Las formas de proveedor ocupado como `ModelNotReadyException` entran aquí.
- `overloadedBackoffMs`: retraso fijo antes de reintentar una rotación de proveedor/perfil sobrecargado (predeterminado: `0`).
- `rateLimitedProfileRotations`: rotaciones máximas de perfiles de autenticación del mismo proveedor para errores de límite de tasa antes de cambiar al respaldo de modelo (predeterminado: `1`). Ese bucket de límite de tasa incluye texto con forma de proveedor como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` y `resource exhausted`.

---

## Registro

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Archivo de registro predeterminado: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Establece `logging.file` para una ruta estable.
- `consoleLevel` sube a `debug` cuando se usa `--verbose`.
- `maxFileBytes`: tamaño máximo del archivo de registro en bytes antes de que se supriman las escrituras (entero positivo; predeterminado: `524288000` = 500 MB). Usa rotación externa de registros para despliegues de producción.

---

## Diagnóstico

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: interruptor maestro para la salida de instrumentación (predeterminado: `true`).
- `flags`: arreglo de cadenas de indicadores que habilitan salida de registro segmentada (admite comodines como `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: umbral de antigüedad en ms para emitir advertencias de sesión atascada mientras una sesión permanece en estado de procesamiento.
- `otel.enabled`: habilita la canalización de exportación OpenTelemetry (predeterminado: `false`).
- `otel.endpoint`: URL del colector para la exportación OTel.
- `otel.protocol`: `"http/protobuf"` (predeterminado) o `"grpc"`.
- `otel.headers`: encabezados de metadatos HTTP/gRPC adicionales enviados con las solicitudes de exportación OTel.
- `otel.serviceName`: nombre del servicio para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: habilitan exportación de trazas, métricas o registros.
- `otel.sampleRate`: tasa de muestreo de trazas `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico de vaciado de telemetría en ms.
- `otel.captureContent`: captura opcional de contenido sin procesar para atributos de span de OTEL. Desactivado por defecto. El booleano `true` captura contenido de mensajes/herramientas no del sistema; la forma de objeto permite habilitar explícitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` y `systemPrompt`.
- `OPENCLAW_OTEL_PRELOADED=1`: interruptor de entorno para hosts que ya registraron un SDK global de OpenTelemetry. OpenClaw omite entonces el inicio/apagado del SDK propiedad del Plugin mientras mantiene activos los listeners de diagnóstico.
- `cacheTrace.enabled`: registra instantáneas de rastreo de caché para ejecuciones integradas (predeterminado: `false`).
- `cacheTrace.filePath`: ruta de salida para JSONL de rastreo de caché (predeterminado: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlan qué se incluye en la salida de rastreo de caché (todos predeterminados: `true`).

---

## Actualización

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canal de publicación para instalaciones npm/git — `"stable"`, `"beta"` o `"dev"`.
- `checkOnStart`: comprueba actualizaciones npm al iniciar el gateway (predeterminado: `true`).
- `auto.enabled`: habilita actualización automática en segundo plano para instalaciones de paquete (predeterminado: `false`).
- `auto.stableDelayHours`: retraso mínimo en horas antes de aplicar automáticamente el canal estable (predeterminado: `6`; máximo: `168`).
- `auto.stableJitterHours`: ventana adicional en horas para escalonar el despliegue del canal estable (predeterminado: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: frecuencia en horas de las comprobaciones del canal beta (predeterminado: `1`; máximo: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: compuerta global de la funcionalidad ACP (predeterminado: `false`).
- `dispatch.enabled`: compuerta independiente para el despacho de turnos de sesión ACP (predeterminado: `true`). Establece `false` para mantener disponibles los comandos ACP mientras bloqueas la ejecución.
- `backend`: id del backend de runtime ACP predeterminado (debe coincidir con un Plugin de runtime ACP registrado).
- `defaultAgent`: id del agente ACP de respaldo cuando las creaciones no especifican un destino explícito.
- `allowedAgents`: lista de permitidos de ids de agentes permitidos para sesiones de runtime ACP; vacío significa sin restricción adicional.
- `maxConcurrentSessions`: máximo de sesiones ACP activas simultáneamente.
- `stream.coalesceIdleMs`: ventana de vaciado por inactividad en ms para texto en streaming.
- `stream.maxChunkChars`: tamaño máximo de fragmento antes de dividir la proyección del bloque en streaming.
- `stream.repeatSuppression`: suprime líneas repetidas de estado/herramienta por turno (predeterminado: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` almacena en búfer hasta los eventos terminales del turno.
- `stream.hiddenBoundarySeparator`: separador antes del texto visible tras eventos de herramientas ocultos (predeterminado: `"paragraph"`).
- `stream.maxOutputChars`: máximo de caracteres de salida del asistente proyectados por turno ACP.
- `stream.maxSessionUpdateChars`: máximo de caracteres para líneas proyectadas de estado/actualización ACP.
- `stream.tagVisibility`: registro de nombres de etiquetas a reemplazos booleanos de visibilidad para eventos en streaming.
- `runtime.ttlMinutes`: TTL de inactividad en minutos para workers de sesión ACP antes de ser aptos para limpieza.
- `runtime.installCommand`: comando de instalación opcional que se ejecuta al inicializar un entorno de runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controla el estilo de la leyenda del banner:
  - `"random"` (predeterminado): leyendas rotativas divertidas/estacionales.
  - `"default"`: leyenda neutra fija (`All your chats, one OpenClaw.`).
  - `"off"`: sin texto de leyenda (el título/versión del banner siguen mostrándose).
- Para ocultar todo el banner (no solo las leyendas), establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

---

## Asistente

Metadatos escritos por los flujos de configuración guiada de la CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identidad

Consulta los campos de identidad de `agents.list` en [Valores predeterminados de agentes](/es/gateway/config-agents#agent-defaults).

---

## Bridge (heredado, eliminado)

Las compilaciones actuales ya no incluyen el bridge TCP. Los Nodes se conectan mediante el WebSocket del Gateway. Las claves `bridge.*` ya no forman parte del esquema de configuración (la validación falla hasta que se eliminen; `openclaw doctor --fix` puede quitar claves desconocidas).

<Accordion title="Configuración heredada de bridge (referencia histórica)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // respaldo heredado en desuso para trabajos almacenados con notify:true
    webhookToken: "replace-with-dedicated-token", // token bearer opcional para autenticación saliente de Webhook
    sessionRetention: "24h", // cadena de duración o false
    runLog: {
      maxBytes: "2mb", // predeterminado 2_000_000 bytes
      keepLines: 2000, // predeterminado 2000
    },
  },
}
```

- `sessionRetention`: cuánto tiempo mantener las sesiones aisladas completadas de ejecuciones Cron antes de podarlas de `sessions.json`. También controla la limpieza de transcripciones archivadas eliminadas de Cron. Predeterminado: `24h`; establece `false` para desactivar.
- `runLog.maxBytes`: tamaño máximo por archivo de registro de ejecución (`cron/runs/<jobId>.jsonl`) antes de la poda. Predeterminado: `2_000_000` bytes.
- `runLog.keepLines`: líneas más recientes conservadas cuando se activa la poda del registro de ejecución. Predeterminado: `2000`.
- `webhookToken`: token bearer usado para la entrega POST del Webhook de Cron (`delivery.mode = "webhook"`); si se omite, no se envía encabezado de autenticación.
- `webhook`: URL fallback heredada en desuso de Webhook (http/https) usada solo para trabajos almacenados que todavía tienen `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: máximo de reintentos para trabajos de una sola ejecución ante errores transitorios (predeterminado: `3`; rango: `0`–`10`).
- `backoffMs`: arreglo de retrasos de retroceso en ms para cada intento de reintento (predeterminado: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de error que activan reintentos: `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omítelo para reintentar todos los tipos transitorios.

Se aplica solo a trabajos Cron de una sola ejecución. Los trabajos recurrentes usan un manejo de fallos independiente.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: habilita alertas de fallo para trabajos Cron (predeterminado: `false`).
- `after`: fallos consecutivos antes de que se dispare una alerta (entero positivo, mín.: `1`).
- `cooldownMs`: milisegundos mínimos entre alertas repetidas para el mismo trabajo (entero no negativo).
- `mode`: modo de entrega — `"announce"` envía mediante un mensaje de canal; `"webhook"` publica en el Webhook configurado.
- `accountId`: id opcional de cuenta o canal para delimitar la entrega de alertas.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destino predeterminado para notificaciones de fallo de Cron en todos los trabajos.
- `mode`: `"announce"` o `"webhook"`; usa por defecto `"announce"` cuando existen suficientes datos de destino.
- `channel`: reemplazo de canal para entrega announce. `"last"` reutiliza el último canal de entrega conocido.
- `to`: destino announce explícito o URL de Webhook. Obligatorio en modo webhook.
- `accountId`: reemplazo opcional de cuenta para la entrega.
- `delivery.failureDestination` por trabajo reemplaza este valor predeterminado global.
- Cuando no hay destino de fallo global ni por trabajo, los trabajos que ya entregan mediante `announce` recurren en caso de fallo a ese destino principal de announce.
- `delivery.failureDestination` solo es compatible para trabajos `sessionTarget="isolated"` salvo que el `delivery.mode` principal del trabajo sea `"webhook"`.

Consulta [Trabajos Cron](/es/automation/cron-jobs). Las ejecuciones aisladas de Cron se rastrean como [tareas en segundo plano](/es/automation/tasks).

---

## Variables de plantilla de modelos multimedia

Marcadores de plantilla expandidos en `tools.media.models[].args`:

| Variable           | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Cuerpo completo del mensaje entrante              |
| `{{RawBody}}`      | Cuerpo sin procesar (sin envoltorios de historial/remitente) |
| `{{BodyStripped}}` | Cuerpo con las menciones de grupo eliminadas      |
| `{{From}}`         | Identificador del remitente                       |
| `{{To}}`           | Identificador del destino                         |
| `{{MessageSid}}`   | Id de mensaje del canal                           |
| `{{SessionId}}`    | UUID de la sesión actual                          |
| `{{IsNewSession}}` | `"true"` cuando se crea una nueva sesión          |
| `{{MediaUrl}}`     | Pseudo-URL de multimedia entrante                 |
| `{{MediaPath}}`    | Ruta local de multimedia                          |
| `{{MediaType}}`    | Tipo de multimedia (imagen/audio/documento/…)     |
| `{{Transcript}}`   | Transcripción de audio                            |
| `{{Prompt}}`       | Prompt multimedia resuelto para entradas CLI      |
| `{{MaxChars}}`     | Máximo de caracteres de salida resuelto para entradas CLI |
| `{{ChatType}}`     | `"direct"` o `"group"`                            |
| `{{GroupSubject}}` | Asunto del grupo (best-effort)                    |
| `{{GroupMembers}}` | Vista previa de miembros del grupo (best-effort)  |
| `{{SenderName}}`   | Nombre visible del remitente (best-effort)        |
| `{{SenderE164}}`   | Número de teléfono del remitente (best-effort)    |
| `{{Provider}}`     | Indicio de proveedor (whatsapp, telegram, discord, etc.) |

---

## Inclusiones de configuración (`$include`)

Divide la configuración en varios archivos:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamiento de fusión:**

- Archivo único: reemplaza el objeto contenedor.
- Arreglo de archivos: fusión profunda en orden (los posteriores reemplazan a los anteriores).
- Claves hermanas: se fusionan después de las inclusiones (reemplazan los valores incluidos).
- Inclusiones anidadas: hasta 10 niveles de profundidad.
- Rutas: se resuelven en relación con el archivo que incluye, pero deben permanecer dentro del directorio de configuración de nivel superior (`dirname` de `openclaw.json`). Las formas absolutas/`../` solo se permiten cuando igualmente se resuelven dentro de ese límite.
- Las escrituras gestionadas por OpenClaw que cambian solo una sección de nivel superior respaldada por una inclusión de archivo único escriben directamente en ese archivo incluido. Por ejemplo, `plugins install` actualiza `plugins: { $include: "./plugins.json5" }` en `plugins.json5` y deja intacto `openclaw.json`.
- Las inclusiones raíz, los arreglos de inclusiones y las inclusiones con reemplazos de claves hermanas son de solo lectura para las escrituras gestionadas por OpenClaw; esas escrituras fallan de forma cerrada en lugar de aplanar la configuración.
- Errores: mensajes claros para archivos faltantes, errores de análisis e inclusiones circulares.

---

_Relacionado: [Configuración](/es/gateway/configuration) · [Ejemplos de configuración](/es/gateway/configuration-examples) · [Doctor](/es/gateway/doctor)_

## Relacionado

- [Configuración](/es/gateway/configuration)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
