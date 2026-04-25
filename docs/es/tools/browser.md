---
read_when:
    - Agregar automatización del navegador controlada por el agente
    - Depurar por qué openclaw está interfiriendo con tu propio Chrome
    - Implementar la configuración y el ciclo de vida del navegador en la app de macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-04-25T13:57:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** que el agente controla.
Está aislado de tu navegador personal y se gestiona mediante un pequeño
servicio de control local dentro del Gateway (solo loopback).

Vista para principiantes:

- Piénsalo como un **navegador separado, solo para el agente**.
- El perfil `openclaw` **no** toca tu perfil personal del navegador.
- El agente puede **abrir pestañas, leer páginas, hacer clic y escribir** en un entorno seguro.
- El perfil integrado `user` se conecta a tu sesión real iniciada de Chrome mediante Chrome MCP.

## Qué obtienes

- Un perfil de navegador independiente llamado **openclaw** (con acento naranja por defecto).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (clic/escritura/arrastrar/seleccionar), snapshots, capturas de pantalla, PDF.
- Una skill `browser-automation` incluida que enseña a los agentes el bucle de recuperación de snapshot,
  pestaña estable, referencia obsoleta y bloqueador manual cuando el plugin del navegador está habilitado.
- Compatibilidad opcional con múltiples perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** es tu navegador principal diario. Es una superficie segura y aislada para
automatización y verificación por parte del agente.

## Inicio rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si aparece “Browser disabled”, habilítalo en la configuración (consulta abajo) y reinicia el
Gateway.

Si falta por completo `openclaw browser`, o el agente dice que la herramienta del navegador
no está disponible, ve a [Comando o herramienta de navegador ausente](/es/tools/browser#missing-browser-command-or-tool).

## Control del Plugin

La herramienta `browser` predeterminada es un Plugin incluido. Desactívala para reemplazarla por otro plugin que registre el mismo nombre de herramienta `browser`:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Los valores predeterminados necesitan tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Desactivar solo el plugin elimina como una sola unidad la CLI `openclaw browser`, el método Gateway `browser.request`, la herramienta del agente y el servicio de control; tu configuración `browser.*` se mantiene intacta para un reemplazo.

Los cambios de configuración del navegador requieren reiniciar el Gateway para que el plugin pueda volver a registrar su servicio.

## Guía para el agente

El plugin del navegador incluye dos niveles de guía para el agente:

- La descripción de la herramienta `browser` contiene el contrato compacto siempre activo: elegir
  el perfil correcto, mantener las referencias en la misma pestaña, usar `tabId`/etiquetas para
  apuntar a pestañas, y cargar la skill del navegador para trabajo de varios pasos.
- La skill incluida `browser-automation` contiene el bucle operativo más largo:
  comprobar primero el estado/pestañas, etiquetar las pestañas de tarea, tomar un snapshot antes de actuar, volver a tomar snapshot
  después de cambios en la UI, recuperar una referencia obsoleta una vez, e informar los bloqueos de inicio de sesión/2FA/captcha o
  cámara/micrófono como acción manual en lugar de adivinar.

Las Skills incluidas por el plugin se listan en las skills disponibles del agente cuando el
plugin está habilitado. Las instrucciones completas de la skill se cargan bajo demanda, por lo que los
turnos rutinarios no pagan el costo completo de tokens.

## Comando o herramienta de navegador ausente

Si `openclaw browser` es desconocido después de una actualización, falta `browser.request`, o el agente informa que la herramienta del navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser`. Agrégalo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` y `tools.alsoAllow: ["browser"]` no sustituyen la pertenencia a la lista permitida: la lista permitida controla la carga del plugin, y la política de herramientas solo se ejecuta después de la carga. Eliminar `plugins.allow` por completo también restaura el valor predeterminado.

## Perfiles: `openclaw` frente a `user`

- `openclaw`: navegador gestionado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión Chrome MCP para tu sesión **real iniciada en Chrome**.

Para las llamadas a la herramienta del navegador del agente:

- Predeterminado: usar el navegador aislado `openclaw`.
- Preferir `profile="user"` cuando importen las sesiones ya iniciadas y el usuario
  esté en el ordenador para hacer clic/aprobar cualquier solicitud de conexión.
- `profile` es la anulación explícita cuando quieres un modo de navegador específico.

Establece `browser.defaultProfile: "openclaw"` si quieres el modo gestionado como predeterminado.

## Configuración

La configuración del navegador se encuentra en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // predeterminado: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // actívalo solo para acceso confiable a redes privadas
      // allowPrivateNetwork: true, // alias heredado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // anulación heredada para un solo perfil
    remoteCdpTimeoutMs: 1500, // tiempo de espera HTTP de CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tiempo de espera del handshake WebSocket de CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // tiempo de espera de detección de Chrome gestionado localmente (ms)
    localCdpReadyTimeoutMs: 8000, // tiempo de espera local de preparación de CDP después del arranque (ms)
    actionTimeoutMs: 60000, // tiempo de espera predeterminado para acciones del navegador (ms)
    tabCleanup: {
      enabled: true, // predeterminado: true
      idleMinutes: 120, // establece 0 para desactivar la limpieza por inactividad
      maxTabsPerSession: 8, // establece 0 para desactivar el límite por sesión
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Puertos y accesibilidad">

- El servicio de control se vincula a loopback en un puerto derivado de `gateway.port` (predeterminado `18791` = gateway + 2). Reemplazar `gateway.port` o `OPENCLAW_GATEWAY_PORT` desplaza los puertos derivados dentro de la misma familia.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl`; establécelos solo para CDP remoto. `cdpUrl` usa por defecto el puerto CDP local gestionado cuando no se establece.
- `remoteCdpTimeoutMs` se aplica a las comprobaciones de accesibilidad HTTP de CDP remoto (sin loopback); `remoteCdpHandshakeTimeoutMs` se aplica a los handshakes WebSocket de CDP remoto.
- `localLaunchTimeoutMs` es el presupuesto para que un proceso Chrome gestionado lanzado localmente
  exponga su endpoint HTTP de CDP. `localCdpReadyTimeoutMs` es el
  presupuesto de seguimiento para la preparación del websocket CDP después de descubrir el proceso.
  Auméntalos en Raspberry Pi, VPS de gama baja o hardware antiguo donde Chromium
  se inicie lentamente. Los valores tienen un límite máximo de 120000 ms.
- `actionTimeoutMs` es el presupuesto predeterminado para las solicitudes `act` del navegador cuando quien llama no pasa `timeoutMs`. El transporte del cliente añade un pequeño margen para que las esperas largas puedan terminar en lugar de agotar el tiempo en el límite HTTP.
- `tabCleanup` es una limpieza de mejor esfuerzo para las pestañas abiertas por sesiones del navegador del agente principal. La limpieza del ciclo de vida de subagentes, Cron y ACP sigue cerrando sus pestañas rastreadas explícitamente al final de la sesión; las sesiones principales mantienen las pestañas activas reutilizables y luego cierran en segundo plano las pestañas rastreadas inactivas o excesivas.

</Accordion>

<Accordion title="Política SSRF">

- La navegación del navegador y open-tab están protegidas contra SSRF antes de navegar y se vuelven a comprobar, en la medida de lo posible, en la URL final `http(s)` después.
- En el modo SSRF estricto, la detección de endpoints CDP remotos y las sondas `/json/version` (`cdpUrl`) también se comprueban.
- Las variables de entorno `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y `NO_PROXY` de Gateway/proveedor no aplican automáticamente proxy al navegador gestionado por OpenClaw. Chrome gestionado se inicia directamente por defecto para que la configuración de proxy del proveedor no debilite las comprobaciones SSRF del navegador.
- Para aplicar proxy al propio navegador gestionado, pasa flags de proxy de Chrome explícitas mediante `browser.extraArgs`, como `--proxy-server=...` o `--proxy-pac-url=...`. El modo SSRF estricto bloquea el enrutamiento explícito del proxy del navegador salvo que el acceso del navegador a redes privadas esté habilitado intencionadamente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado por defecto; actívalo solo cuando el acceso del navegador a redes privadas sea intencionadamente de confianza.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.

</Accordion>

<Accordion title="Comportamiento del perfil">

- `attachOnly: true` significa no iniciar nunca un navegador local; solo conectarse si ya hay uno en ejecución.
- `headless` puede establecerse globalmente o por perfil gestionado local. Los valores por perfil reemplazan `browser.headless`, por lo que un perfil iniciado localmente puede permanecer en modo headless mientras otro sigue visible.
- `POST /start?headless=true` y `openclaw browser start --headless` solicitan un
  inicio headless de una sola vez para perfiles gestionados locales sin reescribir
  `browser.headless` ni la configuración del perfil. Los perfiles de sesión existente, solo conexión y
  CDP remoto rechazan la anulación porque OpenClaw no inicia esos
  procesos del navegador.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles gestionados locales
  usan por defecto headless automáticamente cuando ni el entorno ni la configuración del perfil/global
  eligen explícitamente el modo con interfaz. `openclaw browser status --json`
  informa `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` fuerza los inicios gestionados locales en modo headless para el
  proceso actual. `OPENCLAW_BROWSER_HEADLESS=0` fuerza el modo con interfaz para inicios normales
  y devuelve un error accionable en hosts Linux sin servidor de pantalla;
  una solicitud explícita `start --headless` sigue teniendo prioridad para ese único inicio.
- `executablePath` puede establecerse globalmente o por perfil gestionado local. Los valores por perfil reemplazan `browser.executablePath`, de modo que distintos perfiles gestionados pueden iniciar distintos navegadores basados en Chromium.
- `color` (de nivel superior y por perfil) tiñe la UI del navegador para que puedas ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (gestionado e independiente). Usa `defaultProfile: "user"` para optar por el navegador del usuario con sesión iniciada.
- Orden de autodetección: navegador predeterminado del sistema si está basado en Chromium; en caso contrario Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin procesar. No configures `cdpUrl` para ese driver.
- Establece `browser.profiles.<name>.userDataDir` cuando un perfil de sesión existente deba conectarse a un perfil de usuario de Chromium no predeterminado (Brave, Edge, etc.).

</Accordion>

</AccordionGroup>

## Usar Brave (u otro navegador basado en Chromium)

Si tu navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc),
OpenClaw lo usa automáticamente. Establece `browser.executablePath` para reemplazar
la autodetección. `~` se expande a tu directorio personal del sistema operativo:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

O configúralo, por plataforma:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` por perfil solo afecta a los perfiles gestionados locales que OpenClaw
inicia. Los perfiles `existing-session` se conectan en su lugar a un navegador
ya en ejecución, y los perfiles CDP remotos usan el navegador que está detrás de `cdpUrl`.

## Control local frente a remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control loopback y puede iniciar un navegador local.
- **Control remoto (host node):** ejecuta un host node en la máquina que tiene el navegador; el Gateway enruta por proxy las acciones del navegador hacia él.
- **CDP remoto:** establece `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  conectarte a un navegador remoto basado en Chromium. En este caso, OpenClaw no iniciará un navegador local.
- `headless` solo afecta a los perfiles gestionados locales que OpenClaw inicia. No reinicia ni cambia navegadores de sesión existente ni de CDP remoto.
- `executablePath` sigue la misma regla de perfil gestionado local. Cambiarlo en un
  perfil gestionado local en ejecución marca ese perfil para reinicio/reconciliación, de modo que el
  siguiente inicio use el nuevo binario.

El comportamiento al detenerse difiere según el modo de perfil:

- perfiles gestionados locales: `openclaw browser stop` detiene el proceso del navegador que
  OpenClaw inició
- perfiles de solo conexión y CDP remoto: `openclaw browser stop` cierra la
  sesión de control activa y libera las anulaciones de emulación de Playwright/CDP (viewport,
  esquema de color, idioma, zona horaria, modo sin conexión y estado similar), aunque
  OpenClaw no haya iniciado ningún proceso del navegador

Las URL CDP remotas pueden incluir autenticación:

- Tokens de consulta (por ejemplo, `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (por ejemplo, `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a los endpoints `/json/*` y al conectarse
al WebSocket de CDP. Prefiere variables de entorno o gestores de secretos para los
tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador node (predeterminado sin configuración)

Si ejecutas un **host node** en la máquina que tiene tu navegador, OpenClaw puede
enrutar automáticamente las llamadas a herramientas del navegador a ese node sin ninguna configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host node expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles provienen de la propia configuración `browser.profiles` del node (igual que en local).
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjalo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles a través del proxy, incluidas las rutas de creación/eliminación de perfiles.
- Si estableces `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo: solo se puede apuntar a perfiles incluidos en la lista permitida, y las rutas persistentes de creación/eliminación de perfiles se bloquean en la superficie del proxy.
- Desactívalo si no lo quieres:
  - En el node: `nodeHost.browserProxy.enabled=false`
  - En el gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio Chromium alojado que expone
URL de conexión CDP mediante HTTPS y WebSocket. OpenClaw puede usar cualquiera de las dos formas, pero
para un perfil de navegador remoto la opción más sencilla es la URL WebSocket directa
de la documentación de conexión de Browserless.

Ejemplo:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Notas:

- Sustituye `<BROWSERLESS_API_KEY>` por tu token real de Browserless.
- Elige el endpoint regional que corresponda a tu cuenta de Browserless (consulta su documentación).
- Si Browserless te da una URL base HTTPS, puedes convertirla a
  `wss://` para una conexión CDP directa o mantener la URL HTTPS y dejar que OpenClaw
  descubra `/json/version`.

## Proveedores CDP WebSocket directos

Algunos servicios de navegador alojados exponen un endpoint **WebSocket directo** en lugar de
la detección CDP estándar basada en HTTP (`/json/version`). OpenClaw acepta tres
formas de URL CDP y elige automáticamente la estrategia de conexión correcta:

- **Detección HTTP(S)** — `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para descubrir la URL del depurador WebSocket y luego
  se conecta. No hay respaldo WebSocket.
- **Endpoints WebSocket directos** — `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un handshake WebSocket y omite
  `/json/version` por completo.
- **Raíces WebSocket simples** — `ws://host[:port]` o `wss://host[:port]` sin
  ruta `/devtools/...` (por ejemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw primero intenta la detección HTTP
  `/json/version` (normalizando el esquema a `http`/`https`);
  si la detección devuelve un `webSocketDebuggerUrl`, se utiliza; de lo contrario, OpenClaw
  recurre a un handshake WebSocket directo en la raíz simple. Esto permite que una
  `ws://` simple apuntando a un Chrome local siga conectándose, ya que Chrome solo
  acepta actualizaciones WebSocket en la ruta específica por destino desde
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores headless con resolución de CAPTCHA integrada, modo sigiloso y proxies
residenciales.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Notas:

- [Regístrate](https://www.browserbase.com/sign-up) y copia tu **API Key**
  desde el [panel Overview](https://www.browserbase.com/overview).
- Sustituye `<BROWSERBASE_API_KEY>` por tu API key real de Browserbase.
- Browserbase crea automáticamente una sesión del navegador al conectar por WebSocket, así que no
  se necesita ningún paso manual de creación de sesión.
- El plan gratuito permite una sesión concurrente y una hora de navegador al mes.
  Consulta [pricing](https://www.browserbase.com/pricing) para los límites de los planes de pago.
- Consulta la [documentación de Browserbase](https://docs.browserbase.com) para la referencia completa de la API,
  guías del SDK y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo por loopback; el acceso fluye a través de la autenticación del Gateway o el emparejamiento del node.
- La API HTTP independiente del navegador loopback usa **solo autenticación con secreto compartido**:
  autenticación bearer con token del gateway, `x-openclaw-password`, o autenticación HTTP Basic con la
  contraseña configurada del gateway.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` **no**
  autentican esta API independiente del navegador loopback.
- Si el control del navegador está habilitado y no hay una autenticación con secreto compartido configurada, OpenClaw
  genera automáticamente `gateway.auth.token` al iniciarse y lo guarda en la configuración.
- OpenClaw **no** genera automáticamente ese token cuando `gateway.auth.mode` ya es
  `password`, `none` o `trusted-proxy`.
- Mantén el Gateway y cualquier host node en una red privada (Tailscale); evita la exposición pública.
- Trata las URL/tokens CDP remotos como secretos; prefiere variables de entorno o un gestor de secretos.

Consejos para CDP remoto:

- Prefiere endpoints cifrados (HTTPS o WSS) y tokens de corta duración siempre que sea posible.
- Evita incrustar tokens de larga duración directamente en archivos de configuración.

## Perfiles (multinavegador)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **gestionado por openclaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remoto**: una URL CDP explícita (navegador basado en Chromium ejecutándose en otro lugar)
- **sesión existente**: tu perfil existente de Chrome mediante conexión automática con Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está integrado para la conexión de sesión existente de Chrome MCP.
- Los perfiles de sesión existente son opcionales más allá de `user`; créalos con `--driver existing-session`.
- Los puertos CDP locales se asignan del **18800 al 18899** por defecto.
- Al eliminar un perfil, su directorio de datos local se mueve a la Papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede conectarse a un perfil de navegador basado en Chromium en ejecución mediante el
servidor oficial Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
ya abiertos en ese perfil de navegador.

Referencias oficiales de contexto y configuración:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crea tu propio perfil personalizado de sesión existente si quieres un
nombre, color o directorio de datos del navegador diferente.

Comportamiento predeterminado:

- El perfil integrado `user` usa conexión automática con Chrome MCP, que apunta al
  perfil local predeterminado de Google Chrome.

Usa `userDataDir` para Brave, Edge, Chromium o un perfil no predeterminado de Chrome:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Luego, en el navegador correspondiente:

1. Abre la página de inspección de ese navegador para la depuración remota.
2. Habilita la depuración remota.
3. Mantén el navegador en ejecución y aprueba la solicitud de conexión cuando OpenClaw se conecte.

Páginas de inspección habituales:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Prueba básica de conexión en vivo:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Qué aspecto tiene el éxito:

- `status` muestra `driver: existing-session`
- `status` muestra `transport: chrome-mcp`
- `status` muestra `running: true`
- `tabs` lista las pestañas del navegador que ya tienes abiertas
- `snapshot` devuelve referencias de la pestaña en vivo seleccionada

Qué comprobar si la conexión no funciona:

- el navegador basado en Chromium de destino es la versión `144+`
- la depuración remota está habilitada en la página de inspección de ese navegador
- el navegador mostró la solicitud de consentimiento de conexión y la aceptaste
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para los perfiles predeterminados de conexión automática, pero no puede
  habilitar por ti la depuración remota en el lado del navegador

Uso por parte del agente:

- Usa `profile="user"` cuando necesites el estado del navegador del usuario con sesión iniciada.
- Si usas un perfil personalizado de sesión existente, pasa ese nombre de perfil explícito.
- Elige este modo solo cuando el usuario esté en el ordenador para aprobar la
  solicitud de conexión.
- el Gateway o el host node pueden iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Esta ruta tiene más riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de tu sesión iniciada del navegador.
- OpenClaw no inicia el navegador para este driver; solo se conecta.
- OpenClaw usa aquí el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` está configurado, se transmite para apuntar a ese directorio de datos de usuario.
- La sesión existente puede conectarse en el host seleccionado o mediante un
  node de navegador conectado. Si Chrome está en otra parte y no hay ningún browser node conectado, usa
  CDP remoto o un host node en su lugar.

### Inicio personalizado de Chrome MCP

Anula por perfil el servidor Chrome DevTools MCP iniciado cuando el flujo predeterminado
`npx chrome-devtools-mcp@latest` no es lo que quieres (hosts sin conexión,
versiones fijadas, binarios incluidos):

| Campo        | Qué hace                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ejecutable que se inicia en lugar de `npx`. Se resuelve tal cual; las rutas absolutas se respetan.                      |
| `mcpArgs`    | Matriz de argumentos pasada literalmente a `mcpCommand`. Reemplaza los argumentos predeterminados `chrome-devtools-mcp@latest --autoConnect`. |

Cuando `cdpUrl` está configurado en un perfil de sesión existente, OpenClaw omite
`--autoConnect` y reenvía automáticamente el endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de detección HTTP de DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP directo).

Los flags de endpoint y `userDataDir` no pueden combinarse: cuando `cdpUrl` está configurado,
`userDataDir` se ignora para el inicio de Chrome MCP, ya que Chrome MCP se conecta al
navegador en ejecución detrás del endpoint en lugar de abrir un directorio
de perfil.

<Accordion title="Limitaciones de funciones de sesión existente">

En comparación con el perfil gestionado `openclaw`, los drivers de sesión existente tienen más restricciones:

- **Capturas de pantalla** — las capturas de página y las capturas de elementos con `--ref` funcionan; los selectores CSS `--element` no. `--full-page` no puede combinarse con `--ref` ni con `--element`. No se requiere Playwright para capturas de página o de elementos basadas en referencias.
- **Acciones** — `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren referencias de snapshot (sin selectores CSS). `click-coords` hace clic en coordenadas visibles del viewport y no requiere una referencia de snapshot. `click` es solo con el botón izquierdo. `type` no admite `slowly=true`; usa `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no admiten tiempos de espera por llamada. `select` acepta un único valor.
- **Wait / upload / dialog** — `wait --url` admite patrones exactos, de subcadena y glob; `wait --load networkidle` no es compatible. Los hooks de carga requieren `ref` o `inputRef`, un archivo a la vez, sin `element` CSS. Los hooks de diálogo no admiten anulaciones de tiempo de espera.
- **Funciones solo gestionadas** — acciones por lotes, exportación a PDF, interceptación de descargas y `responsebody` siguen requiriendo la ruta de navegador gestionado.

</Accordion>

## Garantías de aislamiento

- **Directorio de datos de usuario dedicado**: nunca toca tu perfil personal del navegador.
- **Puertos dedicados**: evita `9222` para prevenir colisiones con flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: `tabs` devuelve primero `suggestedTargetId`, luego
  identificadores estables `tabId` como `t1`, etiquetas opcionales y el `targetId` sin procesar.
  Los agentes deben reutilizar `suggestedTargetId`; los IDs sin procesar siguen disponibles para
  depuración y compatibilidad.

## Selección del navegador

Al iniciarse localmente, OpenClaw elige el primero disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puedes reemplazarlo con `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: comprueba ubicaciones comunes de Chrome/Brave/Edge/Chromium en `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` y
  `/usr/lib/chromium-browser`.
- Windows: comprueba ubicaciones de instalación habituales.

## API de control (opcional)

Para scripting y depuración, el Gateway expone una pequeña **API HTTP de control
solo loopback** junto con una CLI `openclaw browser` correspondiente (snapshots, refs, mejoras de
wait, salida JSON, flujos de trabajo de depuración). Consulta
[Browser control API](/es/tools/browser-control) para la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente Chromium en snap), consulta
[Browser troubleshooting](/es/tools/browser-linux-troubleshooting).

Para configuraciones de host dividido WSL2 Gateway + Windows Chrome, consulta
[WSL2 + Windows + remote Chrome CDP troubleshooting](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Error de inicio de CDP frente a bloqueo SSRF de navegación

Estas son clases de error diferentes y apuntan a rutas de código distintas.

- **Error de inicio o preparación de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté en buen estado.
- **Bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero un destino de navegación de página es rechazado por la política.

Ejemplos habituales:

- Error de inicio o preparación de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueo SSRF de navegación:
  - Los flujos `open`, `navigate`, snapshot o apertura de pestañas fallan con un error de política de navegador/red mientras `start` y `tabs` siguen funcionando

Usa esta secuencia mínima para separar ambos casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, primero soluciona la preparación de CDP.
- Si `start` tiene éxito pero `tabs` falla, el plano de control sigue sin estar en buen estado. Trátalo como un problema de accesibilidad de CDP, no como un problema de navegación de página.
- Si `start` y `tabs` tienen éxito pero `open` o `navigate` fallan, el plano de control del navegador está activo y el error está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` tienen éxito, la ruta básica de control del navegador gestionado está en buen estado.

Detalles importantes del comportamiento:

- La configuración del navegador usa por defecto un objeto de política SSRF de fallo cerrado incluso cuando no configuras `browser.ssrfPolicy`.
- Para el perfil gestionado local loopback `openclaw`, las comprobaciones de estado de CDP omiten intencionadamente la aplicación de accesibilidad SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Un resultado exitoso de `start` o `tabs` no significa que un destino posterior de `open` o `navigate` esté permitido.

Guía de seguridad:

- **No** relajes la política SSRF del navegador por defecto.
- Prefiere excepciones de host específicas como `hostnameAllowlist` o `allowedHostnames` en lugar de acceso amplio a redes privadas.
- Usa `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionadamente confiables donde el acceso del navegador a redes privadas sea necesario y haya sido revisado.

## Herramientas del agente + cómo funciona el control

El agente obtiene **una herramienta** para la automatización del navegador:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se corresponde:

- `browser snapshot` devuelve un árbol de UI estable (AI o ARIA).
- `browser act` usa los ID `ref` del snapshot para hacer clic/escribir/arrastrar/seleccionar.
- `browser screenshot` captura píxeles (página completa, elemento o referencias etiquetadas).
- `browser doctor` comprueba Gateway, Plugin, perfil, navegador y preparación de pestañas.
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde vive el navegador.
  - En sesiones en sandbox, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones en sandbox usan por defecto `sandbox`, las sesiones sin sandbox usan por defecto `host`.
  - Si hay un node con capacidad de navegador conectado, la herramienta puede autoenrutarse hacia él a menos que fijes `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Tools Overview](/es/tools) — todas las herramientas de agente disponibles
- [Sandboxing](/es/gateway/sandboxing) — control del navegador en entornos sandbox
- [Security](/es/gateway/security) — riesgos y endurecimiento del control del navegador
