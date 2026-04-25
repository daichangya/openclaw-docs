---
read_when:
    - Quieres que un agente de OpenClaw se una a una llamada de Google Meet
    - Quieres que un agente de OpenClaw cree una nueva llamada de Google Meet
    - Estás configurando Chrome, nodo de Chrome o Twilio como transporte de Google Meet
summary: 'Plugin de Google Meet: unirse a URL de Meet explícitas mediante Chrome o Twilio con valores predeterminados de voz en tiempo real'
title: Plugin de Google Meet
x-i18n:
    generated_at: "2026-04-25T13:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

Compatibilidad de participantes de Google Meet para OpenClaw: el Plugin es explícito por diseño:

- Solo se une a una URL explícita `https://meet.google.com/...`.
- Puede crear un nuevo espacio de Meet mediante la API de Google Meet y luego unirse a la
  URL devuelta.
- La voz `realtime` es el modo predeterminado.
- La voz en tiempo real puede volver a llamar al agente completo de OpenClaw cuando se necesite
  razonamiento más profundo o herramientas.
- Los agentes eligen el comportamiento de unión con `mode`: usa `realtime` para escuchar/hablar en vivo,
  o `transcribe` para unirse/controlar el navegador sin el bridge de voz en tiempo real.
- La autenticación comienza como OAuth personal de Google o como un perfil de Chrome ya autenticado.
- No hay anuncio automático de consentimiento.
- El backend de audio predeterminado de Chrome es `BlackHole 2ch`.
- Chrome puede ejecutarse localmente o en un host de nodo vinculado.
- Twilio acepta un número de acceso telefónico más un PIN opcional o una secuencia DTMF.
- El comando CLI es `googlemeet`; `meet` está reservado para flujos más amplios
  de teleconferencia de agentes.

## Inicio rápido

Instala las dependencias de audio locales y configura un proveedor de voz en tiempo real de backend.
OpenAI es el predeterminado; Google Gemini Live también funciona con
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# o
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala el dispositivo de audio virtual `BlackHole 2ch`. El instalador
de Homebrew requiere un reinicio antes de que macOS exponga el dispositivo:

```bash
sudo reboot
```

Después del reinicio, verifica ambas piezas:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Habilita el Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Comprueba la configuración:

```bash
openclaw googlemeet setup
```

La salida de configuración está pensada para ser legible por agentes. Informa del perfil de Chrome,
del bridge de audio, la fijación de nodo, la introducción diferida en tiempo real y, cuando la delegación a Twilio
está configurada, si el Plugin `voice-call` y las credenciales de Twilio están listas.
Trata cualquier comprobación `ok: false` como un bloqueo antes de pedirle a un agente que se una.
Usa `openclaw googlemeet setup --json` para scripts o salida legible por máquina.

Únete a una reunión:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

O deja que un agente se una mediante la herramienta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Crea una nueva reunión y únete a ella:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Crea solo la URL sin unirte:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` tiene dos rutas:

- Creación por API: se usa cuando las credenciales OAuth de Google Meet están configuradas. Esta es
  la ruta más determinista y no depende del estado de la IU del navegador.
- Respaldo del navegador: se usa cuando faltan credenciales OAuth. OpenClaw usa el nodo
  de Chrome fijado, abre `https://meet.google.com/new`, espera a que Google redirija a una
  URL real con código de reunión y luego devuelve esa URL. Esta ruta requiere
  que el perfil de Chrome de OpenClaw en el nodo ya haya iniciado sesión en Google.
  La automatización del navegador maneja la solicitud inicial de micrófono del propio Meet;
  esa solicitud no se trata como un fallo de inicio de sesión de Google.
  Los flujos de unirse y crear también intentan reutilizar una pestaña Meet existente antes de abrir una
  nueva. La coincidencia ignora cadenas de consulta inocuas como `authuser`, por lo que un
  reintento del agente debería enfocar la reunión ya abierta en lugar de crear una segunda
  pestaña de Chrome.

La salida del comando/herramienta incluye un campo `source` (`api` o `browser`) para que los agentes
puedan explicar qué ruta se usó. `create` se une a la nueva reunión de forma predeterminada y
devuelve `joined: true` más la sesión de unión. Para solo acuñar la URL, usa
`create --no-join` en la CLI o pasa `"join": false` a la herramienta.

O dile a un agente: "Crea una Google Meet, únete con voz en tiempo real y envíame
el enlace". El agente debería llamar a `google_meet` con `action: "create"` y
luego compartir el `meetingUri` devuelto.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Para una unión solo de observación/control del navegador, establece `"mode": "transcribe"`. Eso
no inicia el bridge de modelo dúplex en tiempo real, por lo que no responderá con voz dentro de la
reunión.

Durante las sesiones en tiempo real, el estado de `google_meet` incluye el navegador y el estado del
bridge de audio, como `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, marcas temporales de última entrada/salida,
contadores de bytes y estado de cierre del bridge. Si aparece una solicitud segura de la página de Meet,
la automatización del navegador la maneja cuando puede. El inicio de sesión, la admisión por parte del anfitrión y las solicitudes de permisos del navegador/SO se informan como acción manual con un motivo y mensaje para que el agente los retransmita.

Chrome se une como el perfil de Chrome autenticado. En Meet, elige `BlackHole 2ch` para la
ruta de micrófono/altavoz usada por OpenClaw. Para un audio dúplex limpio, usa
dispositivos virtuales separados o un grafo de estilo Loopback; un único dispositivo BlackHole es
suficiente para una primera smoke, pero puede producir eco.

### Gateway local + Chrome en Parallels

**No** necesitas un Gateway completo de OpenClaw ni una clave API de modelo dentro de una VM de macOS
solo para que la VM sea propietaria de Chrome. Ejecuta el Gateway y el agente localmente, y luego ejecuta un
host de nodo en la VM. Habilita el Plugin incluido en la VM una vez para que el nodo
anuncie el comando de Chrome:

Qué se ejecuta dónde:

- Host del Gateway: Gateway de OpenClaw, espacio de trabajo del agente, claves de modelo/API, proveedor
  en tiempo real y configuración del Plugin de Google Meet.
- VM de macOS de Parallels: CLI/host de nodo de OpenClaw, Google Chrome, SoX, BlackHole 2ch
  y un perfil de Chrome autenticado en Google.
- No se necesita en la VM: servicio Gateway, configuración del agente, clave de OpenAI/GPT o configuración
  del proveedor de modelos.

Instala las dependencias de la VM:

```bash
brew install blackhole-2ch sox
```

Reinicia la VM después de instalar BlackHole para que macOS exponga `BlackHole 2ch`:

```bash
sudo reboot
```

Después del reinicio, verifica que la VM pueda ver el dispositivo de audio y los comandos de SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Instala o actualiza OpenClaw en la VM y luego habilita allí el Plugin incluido:

```bash
openclaw plugins enable google-meet
```

Inicia el host de nodo en la VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` es una IP LAN y no estás usando TLS, el nodo rechaza el
WebSocket en texto plano a menos que des tu consentimiento para esa red privada de confianza:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la misma variable de entorno al instalar el nodo como LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` es una variable de entorno del proceso, no una
configuración de `openclaw.json`. `openclaw node install` la almacena en el entorno del LaunchAgent
cuando está presente en el comando de instalación.

Aprueba el nodo desde el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirma que el Gateway ve el nodo y que anuncia tanto `googlemeet.chrome`
como la capacidad de navegador/`browser.proxy`:

```bash
openclaw nodes status
```

Enruta Meet a través de ese nodo en el host del Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Ahora únete normalmente desde el host del Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

o pídele al agente que use la herramienta `google_meet` con `transport: "chrome-node"`.

Para una smoke de un solo comando que cree o reutilice una sesión, pronuncie una frase
conocida e imprima el estado de la sesión:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante la unión, la automatización del navegador de OpenClaw completa el nombre de invitado, hace clic en Join/Ask
to join y acepta la elección inicial de Meet "Use microphone" cuando aparece esa solicitud.
Durante la creación de reuniones solo con navegador, también puede continuar más allá de la
misma solicitud sin micrófono si Meet no expone el botón para usar micrófono.
Si el perfil del navegador no ha iniciado sesión, Meet está esperando la admisión del
anfitrión, Chrome necesita permiso de micrófono/cámara o Meet está atascado en una
solicitud que la automatización no pudo resolver, el resultado de join/test-speech informa
`manualActionRequired: true` con `manualActionReason` y
`manualActionMessage`. Los agentes deben dejar de reintentar la unión,
informar exactamente ese mensaje más `browserUrl`/`browserTitle` actual y reintentar solo después de que se complete la acción manual en el navegador.

Si se omite `chromeNode.node`, OpenClaw selecciona automáticamente solo cuando exactamente un
nodo conectado anuncia tanto `googlemeet.chrome` como control del navegador. Si
hay varios nodos capaces conectados, establece `chromeNode.node` en el ID del nodo,
nombre para mostrar o IP remota.

Comprobaciones comunes de fallos:

- `No connected Google Meet-capable node`: inicia `openclaw node run` en la VM,
  aprueba la vinculación y asegúrate de que `openclaw plugins enable google-meet` y
  `openclaw plugins enable browser` se hayan ejecutado en la VM. Confirma también que el
  host del Gateway permite ambos comandos de nodo con
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: instala `blackhole-2ch`
  en la VM y reiníciala.
- Chrome se abre pero no puede unirse: inicia sesión en el perfil del navegador dentro de la VM, o
  mantén `chrome.guestName` configurado para unión como invitado. La unión automática como invitado usa la
  automatización del navegador de OpenClaw a través del proxy de navegador del nodo; asegúrate de que la
  configuración de navegador del nodo apunte al perfil que quieres, por ejemplo
  `browser.defaultProfile: "user"` o un perfil con nombre de existing-session.
- Pestañas duplicadas de Meet: deja `chrome.reuseExistingTab: true` habilitado. OpenClaw
  activa una pestaña existente para la misma URL de Meet antes de abrir una nueva, y la
  creación de reuniones por navegador reutiliza una pestaña en progreso `https://meet.google.com/new`
  o una pestaña de solicitud de cuenta de Google antes de abrir otra.
- Sin audio: en Meet, enruta micrófono/altavoz a través de la ruta de dispositivo virtual
  usada por OpenClaw; usa dispositivos virtuales separados o enrutamiento de estilo Loopback
  para un audio dúplex limpio.

## Notas de instalación

El valor predeterminado de Chrome en tiempo real usa dos herramientas externas:

- `sox`: utilidad de audio de línea de comandos. El Plugin usa sus comandos `rec` y `play`
  para el bridge de audio predeterminado G.711 mu-law de 8 kHz.
- `blackhole-2ch`: controlador de audio virtual de macOS. Crea el
  dispositivo de audio `BlackHole 2ch` a través del cual Chrome/Meet puede enrutar.

OpenClaw no incluye ni redistribuye ninguno de esos paquetes. La documentación pide a los usuarios
instalarlos como dependencias del host mediante Homebrew. SoX tiene licencia
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole es GPL-3.0. Si construyes un
instalador o dispositivo que incluya BlackHole con OpenClaw, revisa los
términos de licencia upstream de BlackHole o consigue una licencia separada de Existential Audio.

## Transportes

### Chrome

El transporte Chrome abre la URL de Meet en Google Chrome y se une como el perfil de
Chrome autenticado. En macOS, el Plugin comprueba `BlackHole 2ch` antes del lanzamiento.
Si está configurado, también ejecuta un comando de estado del bridge de audio y un comando de inicio
antes de abrir Chrome. Usa `chrome` cuando Chrome/audio vivan en el host del Gateway;
usa `chrome-node` cuando Chrome/audio vivan en un nodo vinculado, como una VM
de macOS de Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Enruta el audio del micrófono y altavoz de Chrome a través del bridge de audio local de OpenClaw. Si `BlackHole 2ch` no está instalado, la unión falla con un error de configuración en lugar de unirse silenciosamente sin una ruta de audio.

### Twilio

El transporte Twilio es un plan de marcación estricto delegado al Plugin Voice Call. No analiza páginas de Meet para extraer números de teléfono.

Úsalo cuando la participación mediante Chrome no esté disponible o quieras un respaldo de acceso telefónico. Google Meet debe exponer un número de acceso telefónico y un PIN para la reunión; OpenClaw no los descubre desde la página de Meet.

Habilita el Plugin Voice Call en el host del Gateway, no en el nodo de Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // o establece "twilio" si Twilio debe ser el valor predeterminado
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Proporciona las credenciales de Twilio mediante variables de entorno o configuración. El entorno mantiene los secretos fuera de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Reinicia o recarga el Gateway después de habilitar `voice-call`; los cambios de configuración del Plugin no aparecen en un proceso del Gateway ya en ejecución hasta que se recarga.

Luego verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Cuando la delegación de Twilio está conectada, `googlemeet setup` incluye comprobaciones exitosas de `twilio-voice-call-plugin` y `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Usa `--dtmf-sequence` cuando la reunión necesite una secuencia personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth y verificaciones previas

OAuth es opcional para crear un enlace de Meet porque `googlemeet create` puede recurrir a la automatización del navegador. Configura OAuth cuando quieras la creación oficial por API, la resolución de espacios o las verificaciones previas de la API de medios de Meet.

El acceso a la API de Google Meet usa OAuth de usuario: crea un cliente OAuth de Google Cloud, solicita los alcances requeridos, autoriza una cuenta de Google y luego almacena el token de actualización resultante en la configuración del Plugin de Google Meet o proporciona las variables de entorno `OPENCLAW_GOOGLE_MEET_*`.

OAuth no reemplaza la ruta de unión de Chrome. Los transportes Chrome y Chrome-node siguen uniéndose a través de un perfil de Chrome autenticado, BlackHole/SoX y un nodo conectado cuando usas participación por navegador. OAuth es solo para la ruta oficial de la API de Google Meet: crear espacios de reunión, resolver espacios y ejecutar verificaciones previas de la API de medios de Meet.

### Crear credenciales de Google

En Google Cloud Console:

1. Crea o selecciona un proyecto de Google Cloud.
2. Habilita **Google Meet REST API** para ese proyecto.
3. Configura la pantalla de consentimiento OAuth.
   - **Internal** es lo más simple para una organización de Google Workspace.
   - **External** funciona para configuraciones personales/de prueba; mientras la app esté en Testing,
     añade cada cuenta de Google que autorizará la app como usuario de prueba.
4. Añade los alcances que solicita OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crea un ID de cliente OAuth.
   - Tipo de aplicación: **Web application**.
   - URI de redirección autorizada:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copia el ID de cliente y el secreto de cliente.

`meetings.space.created` es obligatorio para Google Meet `spaces.create`.
`meetings.space.readonly` permite que OpenClaw resuelva URL/códigos de Meet a espacios.
`meetings.conference.media.readonly` es para verificaciones previas y trabajo de medios de la API de Meet;
Google puede requerir inscripción en Developer Preview para el uso real de la API de medios.
Si solo necesitas uniones por Chrome basadas en navegador, omite OAuth por completo.

### Generar el token de actualización

Configura `oauth.clientId` y opcionalmente `oauth.clientSecret`, o pásalos como variables de entorno, y luego ejecuta:

```bash
openclaw googlemeet auth login --json
```

El comando imprime un bloque de configuración `oauth` con un token de actualización. Usa PKCE,
callback localhost en `http://localhost:8085/oauth2callback` y un flujo manual
de copiar/pegar con `--manual`.

Ejemplos:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Usa el modo manual cuando el navegador no pueda alcanzar el callback local:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

La salida JSON incluye:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Almacena el objeto `oauth` bajo la configuración del Plugin de Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Prefiere variables de entorno cuando no quieras el token de actualización en la configuración.
Si hay valores tanto en la configuración como en el entorno, el Plugin resuelve primero la configuración
y luego usa el entorno como respaldo.

El consentimiento OAuth incluye creación de espacios de Meet, acceso de lectura a espacios de Meet y acceso de lectura a medios de conferencias de Meet. Si te autenticaste antes de que existiera el soporte para creación de reuniones, vuelve a ejecutar `openclaw googlemeet auth login --json` para que el token de actualización tenga el alcance `meetings.space.created`.

### Verificar OAuth con doctor

Ejecuta el doctor de OAuth cuando quieras una comprobación rápida y sin secretos del estado:

```bash
openclaw googlemeet doctor --oauth --json
```

Esto no carga el entorno de ejecución de Chrome ni requiere un nodo de Chrome conectado. Comprueba que exista la configuración OAuth y que el token de actualización pueda generar un token de acceso. El informe JSON incluye solo campos de estado como `ok`, `configured`, `tokenSource`, `expiresAt` y mensajes de comprobación; no imprime el token de acceso, el token de actualización ni el secreto de cliente.

Resultados comunes:

| Comprobación         | Significado                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Están presentes `oauth.clientId` más `oauth.refreshToken`, o un token de acceso en caché. |
| `oauth-token`        | El token de acceso en caché sigue siendo válido, o el token de actualización generó un nuevo token de acceso. |
| `meet-spaces-get`    | La comprobación opcional `--meeting` resolvió un espacio de Meet existente.             |
| `meet-spaces-create` | La comprobación opcional `--create-space` creó un nuevo espacio de Meet.                |

Para demostrar también la habilitación de la API de Google Meet y el alcance `spaces.create`, ejecuta la comprobación de creación con efectos secundarios:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea una URL temporal de Meet. Úsalo cuando necesites confirmar
que el proyecto de Google Cloud tiene habilitada la API de Meet y que la cuenta autorizada tiene el alcance `meetings.space.created`.

Para demostrar acceso de lectura a un espacio de reunión existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` y `resolve-space` demuestran acceso de lectura a un espacio existente al que la cuenta de Google autorizada puede acceder. Un `403` en estas comprobaciones normalmente significa que la Google Meet REST API está deshabilitada, que al token de actualización con consentimiento le falta el alcance requerido o que la cuenta de Google no puede acceder a ese espacio de Meet. Un error de token de actualización significa que debes volver a ejecutar `openclaw googlemeet auth login --json` y almacenar el nuevo bloque `oauth`.

No se necesitan credenciales OAuth para el respaldo del navegador. En ese modo, la autenticación de Google proviene del perfil de Chrome autenticado en el nodo seleccionado, no de la configuración de OpenClaw.

Se aceptan estas variables de entorno como respaldo:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

Resuelve una URL de Meet, un código o `spaces/{id}` mediante `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Ejecuta verificaciones previas antes del trabajo con medios:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Lista artefactos de reunión y asistencia después de que Meet haya creado registros de conferencia:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` y `attendance` usan el registro de conferencia más reciente
de forma predeterminada. Pasa `--all-conference-records` cuando quieras todos los registros retenidos
de esa reunión.

La búsqueda en Calendar puede resolver la URL de la reunión desde Google Calendar antes de leer
los artefactos de Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` busca en el calendario `primary` de hoy un evento de Calendar con un
enlace de Google Meet. Usa `--event <query>` para buscar texto coincidente del evento, y
`--calendar <id>` para un calendario no principal. La búsqueda en Calendar requiere un
nuevo inicio de sesión OAuth que incluya el alcance de solo lectura de eventos de Calendar.
`calendar-events` muestra una vista previa de los eventos de Meet coincidentes y marca el evento que
`latest`, `artifacts`, `attendance` o `export` elegirán.

Si ya conoces el ID del registro de conferencia, dirígete directamente a él:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Escribe un informe legible:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` devuelve metadatos del registro de conferencia más metadatos de recursos de participantes, grabaciones,
transcripciones, entradas de transcripción estructurada y notas inteligentes cuando
Google los expone para la reunión. Usa `--no-transcript-entries` para omitir
la búsqueda de entradas en reuniones grandes. `attendance` expande los participantes a
filas de sesión de participante con horas de primera/última aparición, duración total de la sesión,
marcas de llegada tardía/salida anticipada y recursos duplicados de participante fusionados por usuario autenticado
o nombre para mostrar. Pasa `--no-merge-duplicates` para mantener separados los recursos
de participante sin procesar, `--late-after-minutes` para ajustar la detección de tardanza y
`--early-before-minutes` para ajustar la detección de salida anticipada.

`export` escribe una carpeta que contiene `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` y `manifest.json`.
`manifest.json` registra la entrada elegida, opciones de exportación, registros de conferencia,
archivos de salida, recuentos, origen del token, evento de Calendar cuando se usó y
cualquier advertencia de recuperación parcial. Pasa `--zip` para escribir también un
archivo portátil junto a la carpeta. Pasa `--include-doc-bodies` para exportar
texto de Google Docs de transcripciones enlazadas y notas inteligentes mediante Google Drive `files.export`; esto requiere un
nuevo inicio de sesión OAuth que incluya el alcance readonly de Drive Meet. Sin
`--include-doc-bodies`, las exportaciones incluyen solo metadatos de Meet y entradas de transcripción estructurada. Si Google devuelve un fallo parcial de artefacto, como un error de
listado de nota inteligente, entrada de transcripción o cuerpo de documento de Drive, el resumen y
el manifiesto conservan la advertencia en lugar de hacer fallar toda la exportación.
Usa `--dry-run` para obtener los mismos datos de artefactos/asistencia e imprimir el
JSON del manifiesto sin crear la carpeta ni el ZIP. Esto resulta útil antes de escribir
una exportación grande o cuando un agente solo necesita recuentos, registros seleccionados y
advertencias.

Los agentes también pueden crear el mismo paquete mediante la herramienta `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Establece `"dryRun": true` para devolver solo el manifiesto de exportación y omitir escrituras de archivos.

Ejecuta la smoke en vivo protegida contra una reunión real retenida:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Entorno de smoke en vivo:

- `OPENCLAW_LIVE_TEST=1` habilita pruebas en vivo protegidas.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` apunta a una URL, código o
  `spaces/{id}` de Meet retenido.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` proporciona el ID
  de cliente OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN` proporciona
  el token de actualización.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` y
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usan los mismos nombres de respaldo
  sin el prefijo `OPENCLAW_`.

La smoke base en vivo de artefactos/asistencia necesita
`https://www.googleapis.com/auth/meetings.space.readonly` y
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La
búsqueda en Calendar necesita `https://www.googleapis.com/auth/calendar.events.readonly`. La
exportación del cuerpo de documento de Drive necesita
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un espacio nuevo de Meet:

```bash
openclaw googlemeet create
```

El comando imprime el nuevo `meeting uri`, el origen y la sesión de unión. Con credenciales OAuth usa la API oficial de Google Meet. Sin credenciales OAuth usa como respaldo el perfil del navegador autenticado en el nodo Chrome fijado. Los agentes pueden
usar la herramienta `google_meet` con `action: "create"` para crear y unirse en un
solo paso. Para creación solo de URL, pasa `"join": false`.

Ejemplo de salida JSON del respaldo del navegador:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Si el respaldo del navegador se encuentra con un bloqueo de inicio de sesión de Google o de permisos de Meet antes de poder crear la URL, el método del Gateway devuelve una respuesta fallida y la
herramienta `google_meet` devuelve detalles estructurados en lugar de una cadena plana:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Cuando un agente ve `manualActionRequired: true`, debe informar
`manualActionMessage` más el contexto de nodo/pestaña del navegador y dejar de abrir nuevas
pestañas de Meet hasta que el operador complete el paso en el navegador.

Ejemplo de salida JSON de creación por API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Crear un Meet se une a él de forma predeterminada. El transporte Chrome o Chrome-node sigue
necesitando un perfil autenticado de Google Chrome para unirse a través del navegador. Si el
perfil ha cerrado sesión, OpenClaw informa `manualActionRequired: true` o un
error de respaldo del navegador y pide al operador que termine el inicio de sesión de Google antes de
reintentar.

Establece `preview.enrollmentAcknowledged: true` solo después de confirmar que tu proyecto de Cloud,
principal OAuth y participantes de la reunión están inscritos en el Google
Workspace Developer Preview Program para las API de medios de Meet.

## Configuración

La ruta común en tiempo real de Chrome solo necesita el Plugin habilitado, BlackHole, SoX
y una clave de proveedor de voz en tiempo real de backend. OpenAI es el predeterminado; establece
`realtime.provider: "google"` para usar Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# o
export GEMINI_API_KEY=...
```

Establece la configuración del Plugin en `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Valores predeterminados:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: ID/nombre/IP de nodo opcional para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nombre usado en la pantalla de invitado de Meet sin iniciar sesión
- `chrome.autoJoin: true`: mejor esfuerzo para rellenar el nombre de invitado y hacer clic en Join Now
  mediante automatización del navegador de OpenClaw en `chrome-node`
- `chrome.reuseExistingTab: true`: activa una pestaña existente de Meet en lugar de
  abrir duplicados
- `chrome.waitForInCallMs: 20000`: espera a que la pestaña de Meet informe in-call
  antes de activar la introducción en tiempo real
- `chrome.audioInputCommand`: comando SoX `rec` que escribe audio G.711 mu-law
  de 8 kHz en stdout
- `chrome.audioOutputCommand`: comando SoX `play` que lee audio G.711 mu-law
  de 8 kHz desde stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respuestas habladas breves, con
  `openclaw_agent_consult` para respuestas más profundas
- `realtime.introMessage`: breve comprobación hablada de disponibilidad cuando el bridge en tiempo real
  se conecta; establécelo en `""` para unirte en silencio

Sobrescrituras opcionales:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Configuración solo para Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` usa `true` de forma predeterminada; con transporte Twilio delega la
llamada PSTN real y DTMF al Plugin Voice Call. Si `voice-call` no está
habilitado, Google Meet aún puede validar y registrar el plan de marcación, pero no puede
realizar la llamada de Twilio.

## Herramienta

Los agentes pueden usar la herramienta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Usa `transport: "chrome"` cuando Chrome se ejecute en el host del Gateway. Usa
`transport: "chrome-node"` cuando Chrome se ejecute en un nodo vinculado como una VM
de Parallels. En ambos casos, el modelo en tiempo real y `openclaw_agent_consult` se ejecutan en el
host del Gateway, por lo que las credenciales del modelo permanecen allí.

Usa `action: "status"` para listar sesiones activas o inspeccionar un ID de sesión. Usa
`action: "speak"` con `sessionId` y `message` para hacer que el agente en tiempo real
hable inmediatamente. Usa `action: "test_speech"` para crear o reutilizar la sesión,
activar una frase conocida y devolver el estado `inCall` cuando el host de Chrome pueda
informarlo. Usa `action: "leave"` para marcar una sesión como finalizada.

`status` incluye estado de Chrome cuando está disponible:

- `inCall`: Chrome parece estar dentro de la llamada de Meet
- `micMuted`: estado del micrófono de Meet con mejor esfuerzo
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: el
  perfil del navegador necesita inicio de sesión manual, admisión del anfitrión, permisos o
  reparación del control del navegador antes de que la voz pueda funcionar
- `providerConnected` / `realtimeReady`: estado del bridge de voz en tiempo real
- `lastInputAt` / `lastOutputAt`: último audio visto desde o enviado al bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulta al agente en tiempo real

El modo en tiempo real de Chrome está optimizado para un bucle de voz en vivo. El proveedor de voz
en tiempo real escucha el audio de la reunión y habla a través del bridge de audio configurado.
Cuando el modelo en tiempo real necesita razonamiento más profundo, información actual o herramientas normales de OpenClaw, puede llamar a `openclaw_agent_consult`.

La herramienta de consulta ejecuta el agente normal de OpenClaw entre bastidores con contexto reciente
de la transcripción de la reunión y devuelve una respuesta hablada concisa a la sesión de voz en tiempo real. El modelo de voz puede entonces volver a pronunciar esa respuesta dentro de la reunión.
Usa la misma herramienta compartida de consulta en tiempo real que Voice Call.

`realtime.toolPolicy` controla la ejecución de consulta:

- `safe-read-only`: expone la herramienta de consulta y limita al agente normal a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y
  `memory_get`.
- `owner`: expone la herramienta de consulta y deja que el agente normal use la política
  normal de herramientas del agente.
- `none`: no expone la herramienta de consulta al modelo de voz en tiempo real.

La clave de sesión de consulta está acotada por sesión de Meet, por lo que las llamadas de consulta de seguimiento
pueden reutilizar el contexto anterior durante la misma reunión.

Para forzar una comprobación hablada de disponibilidad después de que Chrome se haya unido completamente a la llamada:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Para la smoke completa de unirse y hablar:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Lista de comprobación de pruebas en vivo

Usa esta secuencia antes de entregar una reunión a un agente no supervisado:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Estado esperado de Chrome-node:

- `googlemeet setup` está completamente en verde.
- `googlemeet setup` incluye `chrome-node-connected` cuando `chrome-node` es el
  transporte predeterminado o hay un nodo fijado.
- `nodes status` muestra el nodo seleccionado como conectado.
- El nodo seleccionado anuncia tanto `googlemeet.chrome` como `browser.proxy`.
- La pestaña de Meet se une a la llamada y `test-speech` devuelve estado de Chrome con
  `inCall: true`.

Para un host remoto de Chrome como una VM de macOS en Parallels, esta es la comprobación
segura más corta después de actualizar el Gateway o la VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Eso demuestra que el Plugin del Gateway está cargado, que el nodo de la VM está conectado con el
token actual y que el bridge de audio de Meet está disponible antes de que un agente abra una
pestaña real de reunión.

Para una smoke de Twilio, usa una reunión que exponga detalles de acceso telefónico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Estado esperado de Twilio:

- `googlemeet setup` incluye comprobaciones verdes de `twilio-voice-call-plugin` y
  `twilio-voice-call-credentials`.
- `voicecall` está disponible en la CLI después de recargar el Gateway.
- La sesión devuelta tiene `transport: "twilio"` y un `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` cuelga la llamada de voz delegada.

## Solución de problemas

### El agente no puede ver la herramienta Google Meet

Confirma que el Plugin está habilitado en la configuración del Gateway y recarga el Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Si acabas de editar `plugins.entries.google-meet`, reinicia o recarga el Gateway.
El agente en ejecución solo ve las herramientas de Plugin registradas por el proceso actual del Gateway.

### No hay ningún nodo compatible con Google Meet conectado

En el host del nodo, ejecuta:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

En el host del Gateway, aprueba el nodo y verifica los comandos:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

El nodo debe estar conectado y listar `googlemeet.chrome` además de `browser.proxy`.
La configuración del Gateway debe permitir esos comandos del nodo:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Si `googlemeet setup` falla en `chrome-node-connected` o el registro del Gateway informa
`gateway token mismatch`, reinstala o reinicia el nodo con el token actual del Gateway.
Para un Gateway en LAN normalmente significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Luego recarga el servicio del nodo y vuelve a ejecutar:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### El navegador se abre pero el agente no puede unirse

Ejecuta `googlemeet test-speech` e inspecciona el estado de Chrome devuelto. Si
informa `manualActionRequired: true`, muestra `manualActionMessage` al operador
y deja de reintentar hasta que se complete la acción en el navegador.

Acciones manuales comunes:

- Iniciar sesión en el perfil de Chrome.
- Admitir al invitado desde la cuenta anfitriona de Meet.
- Conceder permisos de micrófono/cámara a Chrome cuando aparezca la solicitud nativa
  de permisos de Chrome.
- Cerrar o reparar un diálogo de permisos de Meet atascado.

No informes "not signed in" solo porque Meet muestre "Do you want people to
hear you in the meeting?" Esa es la pantalla intermedia de elección de audio de Meet; OpenClaw
hace clic en **Use microphone** mediante automatización del navegador cuando está disponible y sigue
esperando el estado real de la reunión. Para el respaldo del navegador solo de creación, OpenClaw
puede hacer clic en **Continue without microphone** porque crear la URL no necesita
la ruta de audio en tiempo real.

### La creación de la reunión falla

`googlemeet create` usa primero el endpoint `spaces.create` de la API de Google Meet
cuando hay credenciales OAuth configuradas. Sin credenciales OAuth recurre
al navegador del nodo Chrome fijado. Confirma:

- Para creación por API: están configurados `oauth.clientId` y `oauth.refreshToken`,
  o existen variables de entorno `OPENCLAW_GOOGLE_MEET_*` coincidentes.
- Para creación por API: el token de actualización se generó después de que se
  añadiera el soporte de creación. Los tokens antiguos pueden carecer del alcance `meetings.space.created`; vuelve a ejecutar
  `openclaw googlemeet auth login --json` y actualiza la configuración del Plugin.
- Para el respaldo del navegador: `defaultTransport: "chrome-node"` y
  `chromeNode.node` apuntan a un nodo conectado con `browser.proxy` y
  `googlemeet.chrome`.
- Para el respaldo del navegador: el perfil de Chrome de OpenClaw en ese nodo ha iniciado sesión
  en Google y puede abrir `https://meet.google.com/new`.
- Para el respaldo del navegador: los reintentos reutilizan una pestaña existente de `https://meet.google.com/new`
  o de solicitud de cuenta de Google antes de abrir una nueva. Si un agente agota el tiempo,
  vuelve a intentar la llamada a la herramienta en lugar de abrir manualmente otra pestaña de Meet.
- Para el respaldo del navegador: si la herramienta devuelve `manualActionRequired: true`, usa
  `browser.nodeId`, `browser.targetId`, `browserUrl` y
  `manualActionMessage` devueltos para guiar al operador. No reintentes en bucle hasta que esa
  acción esté completa.
- Para el respaldo del navegador: si Meet muestra "Do you want people to hear you in the
  meeting?", deja la pestaña abierta. OpenClaw debería hacer clic en **Use microphone** o, para el
  respaldo solo de creación, en **Continue without microphone** mediante automatización del
  navegador y seguir esperando la URL generada de Meet. Si no puede, el
  error debería mencionar `meet-audio-choice-required`, no `google-login-required`.

### El agente se une pero no habla

Comprueba la ruta en tiempo real:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "realtime"` para escuchar/responder con voz. `mode: "transcribe"` intencionadamente
no inicia el bridge de voz dúplex en tiempo real.

Verifica también:

- Que haya una clave de proveedor en tiempo real disponible en el host del Gateway, como
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- Que `BlackHole 2ch` sea visible en el host de Chrome.
- Que `rec` y `play` existan en el host de Chrome.
- Que el micrófono y altavoz de Meet estén enrutados a través de la ruta de audio virtual usada por
  OpenClaw.

`googlemeet doctor [session-id]` imprime la sesión, nodo, estado in-call,
motivo de acción manual, conexión del proveedor en tiempo real, `realtimeReady`, actividad de
entrada/salida de audio, últimas marcas temporales de audio, contadores de bytes y URL del navegador.
Usa `googlemeet status [session-id]` cuando necesites el JSON sin procesar. Usa
`googlemeet doctor --oauth` cuando necesites verificar la actualización de OAuth de Google Meet
sin exponer tokens; añade `--meeting` o `--create-space` cuando también necesites una
prueba de la API de Google Meet.

Si un agente agotó el tiempo y puedes ver una pestaña de Meet ya abierta, inspecciona esa pestaña
sin abrir otra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

La acción equivalente de la herramienta es `recover_current_tab`. Enfoca e inspecciona una
pestaña existente de Meet en el nodo Chrome configurado. No abre una nueva pestaña ni
crea una nueva sesión; informa del bloqueo actual, como inicio de sesión, admisión,
permisos o estado de elección de audio. El comando CLI habla con el
Gateway configurado, por lo que el Gateway debe estar en ejecución y el nodo Chrome debe estar conectado.

### Las comprobaciones de configuración de Twilio fallan

`twilio-voice-call-plugin` falla cuando `voice-call` no está permitido o no está habilitado.
Añádelo a `plugins.allow`, habilita `plugins.entries.voice-call` y recarga el
Gateway.

`twilio-voice-call-credentials` falla cuando al backend de Twilio le faltan el SID de cuenta,
el token de autenticación o el número del llamante. Establece estos en el host del Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Luego reinicia o recarga el Gateway y ejecuta:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` es solo de disponibilidad de forma predeterminada. Para una ejecución en seco con un número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Añade `--yes` solo cuando quieras intencionadamente realizar una llamada saliente
real de notificación:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La llamada de Twilio empieza pero nunca entra en la reunión

Confirma que el evento de Meet expone detalles de acceso telefónico. Pasa el número exacto
de acceso telefónico y el PIN o una secuencia DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniciales o comas en `--dtmf-sequence` si el proveedor necesita una pausa
antes de introducir el PIN.

## Notas

La API oficial de medios de Google Meet está orientada a la recepción, por lo que hablar dentro de una
llamada de Meet sigue necesitando una ruta de participante. Este Plugin mantiene visible ese límite:
Chrome gestiona la participación del navegador y el enrutamiento de audio local; Twilio gestiona
la participación por acceso telefónico.

El modo en tiempo real de Chrome necesita uno de estos dos:

- `chrome.audioInputCommand` más `chrome.audioOutputCommand`: OpenClaw gestiona el
  bridge de modelo en tiempo real y canaliza audio G.711 mu-law de 8 kHz entre esos
  comandos y el proveedor de voz en tiempo real seleccionado.
- `chrome.audioBridgeCommand`: un comando de bridge externo gestiona toda la ruta de audio local
  y debe salir después de iniciar o validar su daemon.

Para un audio dúplex limpio, enruta la salida de Meet y el micrófono de Meet a través de
dispositivos virtuales separados o un grafo de dispositivos virtuales de estilo Loopback. Un único
dispositivo BlackHole compartido puede devolver el eco de otros participantes a la llamada.

`googlemeet speak` activa el bridge de audio en tiempo real activo para una sesión de
Chrome. `googlemeet leave` detiene ese bridge. Para sesiones de Twilio delegadas
a través del Plugin Voice Call, `leave` también cuelga la llamada de voz subyacente.

## Relacionado

- [Plugin Voice Call](/es/plugins/voice-call)
- [Modo Talk](/es/nodes/talk)
- [Creación de plugins](/es/plugins/building-plugins)
