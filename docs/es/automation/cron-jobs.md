---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conectar desencadenadores externos (Webhooks, Gmail) con OpenClaw
    - Decidir entre Heartbeat y Cron para las tareas programadas
summary: Trabajos programados, Webhooks y desencadenadores de PubSub de Gmail para el programador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-04-25T13:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron es el programador integrado del Gateway. Conserva los trabajos, activa el agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o a un endpoint de Webhook.

## Inicio rápido

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## Cómo funciona cron

- Cron se ejecuta **dentro del proceso Gateway** (no dentro del modelo).
- Las definiciones de trabajos se conservan en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no hacen que se pierdan las programaciones.
- El estado de ejecución en tiempo de ejecución se conserva junto a él en `~/.openclaw/cron/jobs-state.json`. Si haces seguimiento de las definiciones de cron en git, haz seguimiento de `jobs.json` y agrega `jobs-state.json` a `.gitignore`.
- Después de la separación, las versiones antiguas de OpenClaw pueden leer `jobs.json`, pero podrían tratar los trabajos como nuevos porque los campos de tiempo de ejecución ahora están en `jobs-state.json`.
- Todas las ejecuciones de cron crean registros de [tareas en segundo plano](/es/automation/tasks).
- Los trabajos de una sola vez (`--at`) se eliminan automáticamente después de ejecutarse con éxito de forma predeterminada.
- Las ejecuciones aisladas de cron cierran, en el mejor de los casos, las pestañas/procesos de navegador rastreados para su sesión `cron:<jobId>` cuando finaliza la ejecución, para que la automatización desacoplada del navegador no deje procesos huérfanos.
- Las ejecuciones aisladas de cron también protegen contra respuestas de acuse de recibo obsoletas. Si el
  primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything
together` y pistas similares) y ninguna ejecución descendiente de subagente sigue
  siendo responsable de la respuesta final, OpenClaw vuelve a hacer la solicitud una vez para obtener el resultado
  real antes de entregarlo.

<a id="maintenance"></a>

La conciliación de tareas para cron pertenece al tiempo de ejecución: una tarea de cron activa permanece activa mientras el
tiempo de ejecución de cron siga rastreando ese trabajo como en ejecución, incluso si todavía existe una fila antigua de sesión hija.
Una vez que el tiempo de ejecución deja de ser propietario del trabajo y expira el período de gracia de 5 minutos, el mantenimiento puede
marcar la tarea como `lost`.

## Tipos de programación

| Tipo    | Opción de CLI | Descripción                                              |
| ------- | ------------- | -------------------------------------------------------- |
| `at`    | `--at`        | Marca de tiempo de una sola vez (ISO 8601 o relativa como `20m`) |
| `every` | `--every`     | Intervalo fijo                                           |
| `cron`  | `--cron`      | Expresión cron de 5 o 6 campos con `--tz` opcional       |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para una programación según la hora local.

Las expresiones recurrentes en punto se escalonan automáticamente hasta 5 minutos para reducir los picos de carga. Usa `--exact` para forzar una temporización precisa o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando tanto los campos de día del mes como de día de la semana no son comodines, croner hace coincidir cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se ejecuta ~5–6 veces por mes en lugar de 0–1 veces por mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador `+` de día de la semana de Croner (`0 9 15 * +1`) o programa según un campo y valida el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo          | Valor de `--session` | Se ejecuta en             | Ideal para                     |
| --------------- | -------------------- | ------------------------- | ------------------------------ |
| Sesión principal | `main`              | Siguiente turno de Heartbeat | Recordatorios, eventos del sistema |
| Aislado         | `isolated`           | `cron:<jobId>` dedicado   | Informes, tareas en segundo plano |
| Sesión actual   | `current`            | Vinculada al momento de creación | Trabajo recurrente con contexto |
| Sesión personalizada | `session:custom-id` | Sesión nombrada persistente | Flujos de trabajo que se basan en el historial |

Los trabajos de **sesión principal** ponen en cola un evento del sistema y pueden activar opcionalmente el Heartbeat (`--wake now` o `--wake next-heartbeat`). Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como resúmenes diarios que se basan en resúmenes anteriores.

Para los trabajos aislados, “sesión nueva” significa un nuevo id de transcripción/sesión para cada ejecución. OpenClaw puede conservar preferencias seguras como la configuración de thinking/fast/verbose, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario, pero no hereda el contexto ambiental de la conversación de una fila de cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación de tiempo de ejecución de ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.

Para los trabajos aislados, el desmontaje del tiempo de ejecución ahora incluye, en el mejor de los casos, la limpieza del navegador para esa sesión de cron. Los fallos de limpieza se ignoran para que el resultado real de cron siga prevaleciendo.

Las ejecuciones aisladas de cron también eliminan cualquier instancia de tiempo de ejecución de MCP incluida creada para el trabajo mediante la ruta compartida de limpieza del tiempo de ejecución. Esto coincide con cómo se desmontan los clientes MCP de sesión principal y de sesión personalizada, para que los trabajos aislados de cron no filtren procesos hijo stdio ni conexiones MCP de larga duración entre ejecuciones.

Cuando las ejecuciones aisladas de cron coordinan subagentes, la entrega también prefiere la
salida final descendiente frente al texto provisional obsoleto del padre. Si los descendientes aún se están
ejecutando, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

Para los destinos de anuncio de Discord solo de texto, OpenClaw envía el texto final
canónico del asistente una sola vez en lugar de reproducir tanto las cargas útiles de texto transmitidas/intermedias
como la respuesta final. Las cargas útiles multimedia y estructuradas de Discord siguen entregándose
como cargas útiles independientes para que no se pierdan los adjuntos ni los componentes.

### Opciones de carga útil para trabajos aislados

- `--message`: texto del prompt (obligatorio para aislado)
- `--model` / `--thinking`: anulaciones del modelo y del nivel de thinking
- `--light-context`: omitir la inyección del archivo de arranque del espacio de trabajo
- `--tools exec,read`: restringir qué herramientas puede usar el trabajo

`--model` usa el modelo permitido seleccionado para ese trabajo. Si el modelo solicitado
no está permitido, cron registra una advertencia y vuelve a la selección de modelo
predeterminada/del agente para ese trabajo. Las cadenas de respaldo configuradas siguen aplicándose, pero una simple
anulación de modelo sin una lista explícita de respaldo por trabajo ya no agrega el principal del
agente como un objetivo adicional oculto de reintento.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo del hook de Gmail (cuando la ejecución vino de Gmail y esa anulación está permitida)
2. `model` de la carga útil por trabajo
3. Anulación almacenada del modelo de sesión de cron seleccionada por el usuario
4. Selección del modelo predeterminado/del agente

El modo rápido también sigue la selección activa resuelta. Si la configuración del modelo seleccionado
tiene `params.fastMode`, el cron aislado usa eso de forma predeterminada. Una anulación almacenada de sesión
`fastMode` sigue prevaleciendo sobre la configuración en cualquier dirección.

Si una ejecución aislada alcanza una transferencia activa de cambio de modelo, cron vuelve a intentar con el
proveedor/modelo cambiado y conserva esa selección activa para la ejecución en curso
antes de volver a intentar. Cuando el cambio también incluye un nuevo perfil de autenticación, cron conserva
también esa anulación del perfil de autenticación para la ejecución en curso. Los reintentos están limitados: después del
intento inicial más 2 reintentos por cambio, cron aborta en lugar de entrar en un bucle
infinito.

## Entrega y salida

| Modo       | Qué sucede                                                         |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Entrega como respaldo el texto final al destino si el agente no envió |
| `webhook`  | Hace POST de la carga útil del evento finalizado a una URL         |
| `none`     | Sin entrega de respaldo del ejecutor                               |

Usa `--announce --channel telegram --to "-1001234567890"` para la entrega a canales. Para temas de foros de Telegram, usa `-1001234567890:topic:123`. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`).

Para los trabajos aislados, la entrega al chat es compartida. Si hay una ruta de chat disponible, el
agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el
agente envía al destino configurado/actual, OpenClaw omite el anuncio de respaldo.
En caso contrario, `announce`, `webhook` y `none` solo controlan lo que el ejecutor hace con la respuesta final después del turno del agente.

Las notificaciones de fallos siguen una ruta de destino independiente:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallos.
- `job.delivery.failureDestination` lo anula por trabajo.
- Si ninguno está configurado y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino principal de anuncio.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"` a menos que el modo principal de entrega sea `webhook`.

## Ejemplos de CLI

Recordatorio de una sola vez (sesión principal):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Trabajo aislado recurrente con entrega:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Trabajo aislado con anulación de modelo y thinking:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhooks

Gateway puede exponer endpoints HTTP de Webhook para desencadenadores externos. Habilítalo en la configuración:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autenticación

Cada solicitud debe incluir el token del hook mediante un encabezado:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Los tokens en la cadena de consulta se rechazan.

### POST /hooks/wake

Pone en cola un evento del sistema para la sesión principal:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (obligatorio): descripción del evento
- `mode` (opcional): `now` (predeterminado) o `next-heartbeat`

### POST /hooks/agent

Ejecuta un turno de agente aislado:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Campos: `message` (obligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hooks mapeados (POST /hooks/\<name\>)

Los nombres de hooks personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.

### Seguridad

- Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.
- Usa un token de hook dedicado; no reutilices tokens de autenticación del Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Establece `hooks.allowedAgentIds` para limitar el enrutamiento explícito de `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` a menos que necesites sesiones seleccionadas por la persona que llama.
- Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas útiles del hook se encapsulan con límites de seguridad de forma predeterminada.

## Integración de Gmail PubSub

Conecta desencadenadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

**Requisitos previos**: CLI de `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.

### Configuración con asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el ajuste preestablecido de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático del Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está configurado, el Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.

### Configuración manual única

1. Selecciona el proyecto de GCP que posee el cliente OAuth usado por `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Crea el tema y concede a Gmail acceso push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Inicia la vigilancia:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Anulación de modelo de Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Gestionar trabajos

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Nota sobre la anulación de modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución
  del agente aislado.
- Si no está permitido, cron muestra una advertencia y vuelve a la selección de modelo
  predeterminada/del agente para el trabajo.
- Las cadenas de respaldo configuradas siguen aplicándose, pero una simple anulación
  `--model` sin una lista de respaldo explícita por trabajo ya no recurre al modelo
  principal del agente como un objetivo adicional silencioso de reintento.

## Configuración

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

El archivo lateral del estado de ejecución se deriva de `cron.store`: un almacén `.json` como
`~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén
sin sufijo `.json` agrega `-state.json`.

Desactiva cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

**Reintento de una sola vez**: los errores transitorios (límite de velocidad, sobrecarga, red, error del servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se desactivan de inmediato.

**Reintento recurrente**: retroceso exponencial (de 30 s a 60 min) entre reintentos. El retroceso se restablece después de la siguiente ejecución correcta.

**Mantenimiento**: `cron.sessionRetention` (predeterminado `24h`) elimina las entradas de sesión de ejecuciones aisladas. `cron.runLog.maxBytes` / `cron.runLog.keepLines` recortan automáticamente los archivos del registro de ejecución.

## Solución de problemas

### Secuencia de comandos

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron no se ejecuta

- Verifica `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
- Confirma que el Gateway esté ejecutándose continuamente.
- Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
- `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que el trabajo aún no vencía.

### Cron se ejecutó pero no hubo entrega

- El modo de entrega `none` significa que no se espera ningún envío de respaldo del ejecutor. El agente
  todavía puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
- Si falta o no es válido el destino de entrega (`channel`/`to`), se omitió la salida.
- Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por las credenciales.
- Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`),
  OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen
  en cola de respaldo, por lo que no se publica nada de vuelta en el chat.
- Si el agente debe enviar un mensaje al usuario por sí mismo, verifica que el trabajo tenga una
  ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

### Particularidades de la zona horaria

- Cron sin `--tz` usa la zona horaria del host del Gateway.
- Las programaciones `at` sin zona horaria se tratan como UTC.
- `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
