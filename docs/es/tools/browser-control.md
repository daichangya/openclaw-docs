---
read_when:
    - Crear scripts o depurar el navegador del agente mediante la API de control local
    - Buscas la referencia de CLI `openclaw browser`
    - Agregar automatización personalizada del navegador con instantáneas y referencias
summary: API de control del navegador de OpenClaw, referencia de CLI y acciones de scripting
title: API de control del navegador
x-i18n:
    generated_at: "2026-04-25T13:57:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1515ca1e31e6fd8fd3e0f34f17ce309c52202e26ed3b79e24a460380efab040d
    source_path: tools/browser-control.md
    workflow: 15
---

Para la configuración, la instalación y la solución de problemas, consulta [Navegador](/es/tools/browser).
Esta página es la referencia de la API HTTP local de control, la CLI `openclaw browser`
y los patrones de scripting (instantáneas, referencias, esperas, flujos de depuración).

## API de control (opcional)

Solo para integraciones locales, Gateway expone una pequeña API HTTP en loopback:

- Estado/iniciar/detener: `GET /`, `POST /start`, `POST /stop`
- Pestañas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Instantánea/captura de pantalla: `GET /snapshot`, `POST /screenshot`
- Acciones: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Descargas: `POST /download`, `POST /wait/download`
- Depuración: `GET /console`, `POST /pdf`
- Depuración: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Red: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Configuración: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos los endpoints aceptan `?profile=<name>`. `POST /start?headless=true` solicita un
inicio sin interfaz puntual para perfiles locales administrados sin cambiar la
configuración persistida del navegador; los perfiles solo de conexión, CDP remoto y sesión existente rechazan
esa sobrescritura porque OpenClaw no inicia esos procesos del navegador.

Si la autenticación de Gateway con secreto compartido está configurada, las rutas HTTP del navegador también requieren autenticación:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticación HTTP Basic con esa contraseña

Notas:

- Esta API independiente de navegador en loopback **no** consume proxy confiable ni
  encabezados de identidad de Tailscale Serve.
- Si `gateway.auth.mode` es `none` o `trusted-proxy`, estas rutas de navegador en loopback
  no heredan esos modos con identidad; mantenlas solo en loopback.

### Contrato de error de `/act`

`POST /act` usa una respuesta de error estructurada para validación a nivel de ruta y
fallos de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores actuales de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): falta `kind` o no se reconoce.
- `ACT_INVALID_REQUEST` (HTTP 400): la carga de la acción falló al normalizarse o validarse.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): se usó `selector` con un tipo de acción no compatible.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) está deshabilitado por configuración.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nivel superior o por lotes entra en conflicto con el destino de la solicitud.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): la acción no es compatible con perfiles de sesión existente.

Otros fallos en tiempo de ejecución aún pueden devolver `{ "error": "<message>" }` sin un
campo `code`.

### Requisito de Playwright

Algunas funciones (navigate/act/AI snapshot/role snapshot, capturas de elementos,
PDF) requieren Playwright. Si Playwright no está instalado, esos endpoints devuelven
un error 501 claro.

Lo que sigue funcionando sin Playwright:

- Instantáneas ARIA
- Capturas de pantalla de página para el navegador `openclaw` administrado cuando hay un WebSocket
  CDP por pestaña disponible
- Capturas de pantalla de página para perfiles `existing-session` / Chrome MCP
- Capturas de pantalla basadas en referencias (`--ref`) de `existing-session` a partir de la salida de instantáneas

Lo que aún requiere Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Capturas de elementos con selector CSS (`--element`)
- Exportación completa de PDF del navegador

Las capturas de elementos también rechazan `--full-page`; la ruta devuelve `fullPage is
not supported for element screenshots`.

Si ves `Playwright is not available in this gateway build`, repara las
dependencias de tiempo de ejecución del Plugin de navegador incluido para que `playwright-core` esté instalado,
y luego reinicia el gateway. Para instalaciones empaquetadas, ejecuta `openclaw doctor --fix`.
Para Docker, instala también los binarios del navegador Chromium como se muestra abajo.

#### Instalación de Playwright en Docker

Si tu Gateway se ejecuta en Docker, evita `npx playwright` (conflictos de sobrescritura de npm).
Usa la CLI incluida en su lugar:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para conservar las descargas del navegador, configura `PLAYWRIGHT_BROWSERS_PATH` (por ejemplo,
`/home/node/.cache/ms-playwright`) y asegúrate de que `/home/node` se conserve mediante
`OPENCLAW_HOME_VOLUME` o un bind mount. Consulta [Docker](/es/install/docker).

## Cómo funciona (interno)

Un pequeño servidor de control en loopback acepta solicitudes HTTP y se conecta a navegadores basados en Chromium mediante CDP. Las acciones avanzadas (clic/escritura/instantánea/PDF) pasan por Playwright sobre CDP; cuando falta Playwright, solo están disponibles las operaciones que no dependen de Playwright. El agente ve una única interfaz estable mientras los navegadores y perfiles locales/remotos se intercambian libremente por debajo.

## Referencia rápida de la CLI

Todos los comandos aceptan `--browser-profile <name>` para apuntar a un perfil específico, y `--json` para salida legible por máquina.

<AccordionGroup>

<Accordion title="Conceptos básicos: estado, pestañas, abrir/enfocar/cerrar">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # inicio sin interfaz puntual local administrado
openclaw browser stop            # también borra la emulación en perfiles solo de conexión/CDP remoto
openclaw browser tabs
openclaw browser tab             # atajo para la pestaña actual
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspección: captura de pantalla, instantánea, consola, errores, solicitudes">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Acciones: navegar, hacer clic, escribir, arrastrar, esperar, evaluar">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Estado: cookies, almacenamiento, sin conexión, encabezados, geo, dispositivo">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Notas:

- `upload` y `dialog` son llamadas de **preparación**; ejecútalas antes del clic o pulsación que active el selector de archivos o el diálogo.
- `click`/`type`/etc. requieren una `ref` de `snapshot` (numérica `12`, referencia de rol `e12` o referencia ARIA accionable `ax12`). Los selectores CSS no son compatibles intencionalmente para acciones. Usa `click-coords` cuando la posición visible de la ventana gráfica sea el único destino fiable.
- Las rutas de descarga, traza y carga están restringidas a las raíces temporales de OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (respaldo: `${os.tmpdir()}/openclaw/...`).
- `upload` también puede establecer entradas de archivo directamente mediante `--input-ref` o `--element`.

Resumen de flags de instantánea:

- `--format ai` (predeterminado con Playwright): instantánea de IA con referencias numéricas (`aria-ref="<n>"`).
- `--format aria`: árbol de accesibilidad con referencias `axN`. Cuando Playwright está disponible, OpenClaw vincula referencias con id de DOM de backend a la página activa para que las acciones de seguimiento puedan usarlas; de lo contrario, trata la salida solo como de inspección.
- `--efficient` (o `--mode efficient`): ajuste preestablecido compacto de instantánea de roles. Configura `browser.snapshotDefaults.mode: "efficient"` para convertirlo en el predeterminado (consulta [Configuración de Gateway](/es/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` fuerzan una instantánea de roles con referencias `ref=e12`. `--frame "<iframe>"` limita las instantáneas de roles a un iframe.
- `--labels` agrega una captura de pantalla solo de la ventana gráfica con etiquetas de referencia superpuestas (imprime `MEDIA:<path>`).
- `--urls` agrega destinos de enlaces detectados a las instantáneas de IA.

## Instantáneas y referencias

OpenClaw admite dos estilos de “instantánea”:

- **Instantánea de IA (referencias numéricas)**: `openclaw browser snapshot` (predeterminada; `--format ai`)
  - Salida: una instantánea de texto que incluye referencias numéricas.
  - Acciones: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, la referencia se resuelve mediante `aria-ref` de Playwright.

- **Instantánea de roles (referencias de rol como `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Salida: una lista/árbol basado en roles con `[ref=e12]` (y opcionalmente `[nth=1]`).
  - Acciones: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, la referencia se resuelve mediante `getByRole(...)` (más `nth()` para duplicados).
  - Agrega `--labels` para incluir una captura de pantalla de la ventana gráfica con etiquetas `e12` superpuestas.
  - Agrega `--urls` cuando el texto del enlace sea ambiguo y el agente necesite
    destinos de navegación concretos.

- **Instantánea ARIA (referencias ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Salida: el árbol de accesibilidad como nodos estructurados.
  - Acciones: `openclaw browser click ax12` funciona cuando la ruta de instantánea puede vincular
    la referencia mediante Playwright e id de DOM de backend de Chrome.
  - Si Playwright no está disponible, las instantáneas ARIA aún pueden ser útiles para
    inspección, pero las referencias pueden no ser accionables. Vuelve a tomar una instantánea con `--format ai`
    o `--interactive` cuando necesites referencias accionables.

Comportamiento de las referencias:

- Las referencias **no son estables entre navegaciones**; si algo falla, vuelve a ejecutar `snapshot` y usa una referencia nueva.
- Si la instantánea de roles se tomó con `--frame`, las referencias de roles quedan limitadas a ese iframe hasta la siguiente instantánea de roles.
- Las referencias `axN` desconocidas o obsoletas fallan de inmediato en lugar de pasar a
  `aria-ref` de Playwright. Ejecuta una instantánea nueva en la misma pestaña cuando
  eso ocurra.

## Mejoras para espera

Puedes esperar algo más que tiempo o texto:

- Esperar una URL (se admiten glob patterns de Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar un estado de carga:
  - `openclaw browser wait --load networkidle`
- Esperar una condición JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar que un selector se vuelva visible:
  - `openclaw browser wait "#main"`

Estas opciones pueden combinarse:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flujos de depuración

Cuando una acción falla (por ejemplo, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (prefiere referencias de rol en modo interactivo)
3. Si sigue fallando: `openclaw browser highlight <ref>` para ver a qué apunta Playwright
4. Si la página se comporta de forma extraña:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuración profunda: graba una traza:
   - `openclaw browser trace start`
   - reproduce el problema
   - `openclaw browser trace stop` (imprime `TRACE:<path>`)

## Salida JSON

`--json` es para scripting y herramientas estructuradas.

Ejemplos:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Las instantáneas de roles en JSON incluyen `refs` además de un pequeño bloque `stats` (líneas/caracteres/referencias/interactivo) para que las herramientas puedan razonar sobre el tamaño y la densidad de la carga útil.

## Controles de estado y entorno

Estos son útiles para flujos del tipo “haz que el sitio se comporte como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Almacenamiento: `storage local|session get|set|clear`
- Sin conexión: `set offline on|off`
- Encabezados: `set headers --headers-json '{"X-Debug":"1"}'` (el heredado `set headers --json '{"X-Debug":"1"}'` sigue siendo compatible)
- Autenticación HTTP Basic: `set credentials user pass` (o `--clear`)
- Geolocalización: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Medios: `set media dark|light|no-preference|none`
- Zona horaria / configuración regional: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (ajustes preestablecidos de dispositivos de Playwright)
  - `set viewport 1280 720`

## Seguridad y privacidad

- El perfil de navegador de openclaw puede contener sesiones con inicio de sesión; trátalo como información sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` y `wait --fn`
  ejecutan JavaScript arbitrario en el contexto de la página. La inyección de prompts puede dirigir
  esto. Desactívalo con `browser.evaluateEnabled=false` si no lo necesitas.
- Para inicios de sesión y notas sobre antibots (X/Twitter, etc.), consulta [Inicio de sesión en el navegador + publicación en X/Twitter](/es/tools/browser-login).
- Mantén privado el host del Gateway/nodo (solo loopback o tailnet).
- Los endpoints CDP remotos son potentes; protégelos con túneles y controles.

Ejemplo de modo estricto (bloquear destinos privados/internos de forma predeterminada):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // allow exact optional
    },
  },
}
```

## Relacionado

- [Navegador](/es/tools/browser) — descripción general, configuración, perfiles, seguridad
- [Inicio de sesión en el navegador](/es/tools/browser-login) — iniciar sesión en sitios
- [Solución de problemas del navegador en Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas del navegador WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
