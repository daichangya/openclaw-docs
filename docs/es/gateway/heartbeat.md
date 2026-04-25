---
read_when:
    - Ajustar la cadencia o los mensajes de Heartbeat
    - Decidir entre Heartbeat y Cron para las tareas programadas
summary: Mensajes de sondeo de Heartbeat y reglas de notificación
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:46:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **¿Heartbeat o Cron?** Consulta [Automatización y tareas](/es/automation) para orientarte sobre cuándo usar cada uno.

Heartbeat ejecuta **turnos periódicos del agente** en la sesión principal para que el modelo pueda
mostrar cualquier cosa que requiera atención sin llenarte de mensajes.

Heartbeat es un turno programado de la sesión principal: **no** crea registros de [tareas en segundo plano](/es/automation/tasks).
Los registros de tareas son para trabajo desacoplado (ejecuciones de ACP, subagentes, trabajos cron aislados).

Solución de problemas: [Tareas programadas](/es/automation/cron-jobs#troubleshooting)

## Inicio rápido (principiantes)

1. Deja los heartbeats habilitados (el valor predeterminado es `30m`, o `1h` para autenticación OAuth/token de Anthropic, incluida la reutilización de Claude CLI) o establece tu propia cadencia.
2. Crea una pequeña lista de verificación `HEARTBEAT.md` o un bloque `tasks:` en el espacio de trabajo del agente (opcional, pero recomendado).
3. Decide a dónde deben ir los mensajes de heartbeat (`target: "none"` es el valor predeterminado; establece `target: "last"` para enrutar al último contacto).
4. Opcional: habilita la entrega del razonamiento de heartbeat para mayor transparencia.
5. Opcional: usa un contexto de arranque ligero si las ejecuciones de heartbeat solo necesitan `HEARTBEAT.md`.
6. Opcional: habilita sesiones aisladas para evitar enviar todo el historial de conversación en cada heartbeat.
7. Opcional: restringe los heartbeats a las horas activas (hora local).

Ejemplo de configuración:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita al último contacto (el valor predeterminado es "none")
        directPolicy: "allow", // predeterminado: allow direct/DM targets; set "block" to suppress
        lightContext: true, // opcional: solo inyecta HEARTBEAT.md desde los archivos de arranque
        isolatedSession: true, // opcional: sesión nueva en cada ejecución (sin historial de conversación)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: enviar también un mensaje `Reasoning:` por separado
      },
    },
  },
}
```

## Valores predeterminados

- Intervalo: `30m` (o `1h` cuando la autenticación OAuth/token de Anthropic es el modo de autenticación detectado, incluida la reutilización de Claude CLI). Establece `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every`; usa `0m` para desactivar.
- Cuerpo del prompt (configurable mediante `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- El prompt de heartbeat se envía **textualmente** como mensaje del usuario. El
  prompt del sistema incluye una sección “Heartbeat” solo cuando los heartbeats están habilitados para el
  agente predeterminado y la ejecución está marcada internamente.
- Cuando los heartbeats se desactivan con `0m`, las ejecuciones normales también omiten `HEARTBEAT.md`
  del contexto de arranque para que el modelo no vea instrucciones exclusivas de heartbeat.
- Las horas activas (`heartbeat.activeHours`) se comprueban en la zona horaria configurada.
  Fuera de la ventana, los heartbeats se omiten hasta el siguiente tick dentro de la ventana.

## Para qué sirve el prompt de heartbeat

El prompt predeterminado es intencionalmente amplio:

- **Tareas en segundo plano**: “Consider outstanding tasks” anima al agente a revisar
  seguimientos (bandeja de entrada, calendario, recordatorios, trabajo en cola) y mostrar cualquier cosa urgente.
- **Verificación humana**: “Checkup sometimes on your human during day time” anima a
  enviar ocasionalmente un mensaje ligero de “¿necesitas algo?”, pero evita el spam nocturno
  usando tu zona horaria local configurada (consulta [/concepts/timezone](/es/concepts/timezone)).

Heartbeat puede reaccionar a [tareas en segundo plano](/es/automation/tasks) completadas, pero una ejecución de heartbeat no crea por sí sola un registro de tarea.

Si quieres que un heartbeat haga algo muy específico (por ejemplo, “check Gmail PubSub
stats” o “verify gateway health”), establece `agents.defaults.heartbeat.prompt` (o
`agents.list[].heartbeat.prompt`) con un cuerpo personalizado (enviado textualmente).

## Contrato de respuesta

- Si nada necesita atención, responde con **`HEARTBEAT_OK`**.
- Durante las ejecuciones de heartbeat, OpenClaw trata `HEARTBEAT_OK` como un acuse cuando aparece
  al **inicio o al final** de la respuesta. El token se elimina y la respuesta se
  descarta si el contenido restante es **≤ `ackMaxChars`** (predeterminado: 300).
- Si `HEARTBEAT_OK` aparece en la **mitad** de una respuesta, no se trata
  de forma especial.
- Para alertas, **no** incluyas `HEARTBEAT_OK`; devuelve solo el texto de la alerta.

Fuera de los heartbeats, un `HEARTBEAT_OK` aislado al inicio/final de un mensaje se elimina
y se registra; un mensaje que sea solo `HEARTBEAT_OK` se descarta.

## Configuración

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // predeterminado: 30m (0m desactiva)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // predeterminado: false (entrega un mensaje Reasoning: por separado cuando está disponible)
        lightContext: false, // predeterminado: false; true mantiene solo HEARTBEAT.md de los archivos de arranque del espacio de trabajo
        isolatedSession: false, // predeterminado: false; true ejecuta cada heartbeat en una sesión nueva (sin historial de conversación)
        target: "last", // predeterminado: none | opciones: last | none | <channel id> (core o Plugin, p. ej. "bluebubbles")
        to: "+15551234567", // anulación opcional específica del canal
        accountId: "ops-bot", // id opcional de canal multicuenta
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // número máximo de caracteres permitidos después de HEARTBEAT_OK
      },
    },
  },
}
```

### Alcance y precedencia

- `agents.defaults.heartbeat` establece el comportamiento global de heartbeat.
- `agents.list[].heartbeat` se fusiona por encima; si algún agente tiene un bloque `heartbeat`, **solo esos agentes** ejecutan heartbeats.
- `channels.defaults.heartbeat` establece los valores predeterminados de visibilidad para todos los canales.
- `channels.<channel>.heartbeat` anula los valores predeterminados del canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canales multicuenta) anula la configuración por canal.

### Heartbeats por agente

Si alguna entrada `agents.list[]` incluye un bloque `heartbeat`, **solo esos agentes**
ejecutan heartbeats. El bloque por agente se fusiona por encima de `agents.defaults.heartbeat`
(así puedes establecer una vez valores predeterminados compartidos y anular por agente).

Ejemplo: dos agentes, solo el segundo agente ejecuta heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita al último contacto (el valor predeterminado es "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Ejemplo de horas activas

Restringe los heartbeats al horario laboral en una zona horaria específica:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita al último contacto (el valor predeterminado es "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcional; usa userTimezone si está configurado; de lo contrario, usa la zona horaria del host
        },
      },
    },
  },
}
```

Fuera de esta ventana (antes de las 9:00 o después de las 22:00 hora del Este), los heartbeats se omiten. El siguiente tick programado dentro de la ventana se ejecutará normalmente.

### Configuración 24/7

Si quieres que los heartbeats se ejecuten todo el día, usa uno de estos patrones:

- Omite `activeHours` por completo (sin restricción de ventana horaria; este es el comportamiento predeterminado).
- Establece una ventana de día completo: `activeHours: { start: "00:00", end: "24:00" }`.

No establezcas la misma hora en `start` y `end` (por ejemplo `08:00` a `08:00`).
Eso se trata como una ventana de anchura cero, por lo que los heartbeats siempre se omiten.

### Ejemplo multicuenta

Usa `accountId` para apuntar a una cuenta específica en canales multicuenta como Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opcional: enrutar a un tema/hilo específico
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Notas sobre los campos

- `every`: intervalo de heartbeat (cadena de duración; unidad predeterminada = minutos).
- `model`: anulación opcional de modelo para las ejecuciones de heartbeat (`provider/model`).
- `includeReasoning`: cuando está habilitado, también entrega el mensaje `Reasoning:` por separado cuando está disponible (misma forma que `/reasoning on`).
- `lightContext`: cuando es true, las ejecuciones de heartbeat usan un contexto de arranque ligero y conservan solo `HEARTBEAT.md` de los archivos de arranque del espacio de trabajo.
- `isolatedSession`: cuando es true, cada heartbeat se ejecuta en una sesión nueva sin historial previo de conversación. Usa el mismo patrón de aislamiento que cron `sessionTarget: "isolated"`. Reduce drásticamente el costo en tokens por heartbeat. Combínalo con `lightContext: true` para obtener el máximo ahorro. El enrutamiento de entrega sigue usando el contexto de la sesión principal.
- `session`: clave de sesión opcional para las ejecuciones de heartbeat.
  - `main` (predeterminado): sesión principal del agente.
  - Clave de sesión explícita (cópiala de `openclaw sessions --json` o de la [CLI de sesiones](/es/cli/sessions)).
  - Formatos de clave de sesión: consulta [Sesiones](/es/concepts/session) y [Grupos](/es/channels/groups).
- `target`:
  - `last`: entrega al último canal externo usado.
  - canal explícito: cualquier canal configurado o id de Plugin, por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`.
  - `none` (predeterminado): ejecuta el heartbeat pero **no lo entrega** externamente.
- `directPolicy`: controla el comportamiento de entrega directa/DM:
  - `allow` (predeterminado): permite la entrega directa/DM de heartbeat.
  - `block`: suprime la entrega directa/DM (`reason=dm-blocked`).
- `to`: anulación opcional de destinatario (id específico del canal, por ejemplo E.164 para WhatsApp o un id de chat de Telegram). Para temas/hilos de Telegram, usa `<chatId>:topic:<messageThreadId>`.
- `accountId`: id de cuenta opcional para canales multicuenta. Cuando `target: "last"`, el id de cuenta se aplica al último canal resuelto si admite cuentas; de lo contrario, se ignora. Si el id de cuenta no coincide con una cuenta configurada para el canal resuelto, la entrega se omite.
- `prompt`: anula el cuerpo del prompt predeterminado (no se fusiona).
- `ackMaxChars`: número máximo de caracteres permitidos después de `HEARTBEAT_OK` antes de la entrega.
- `suppressToolErrorWarnings`: cuando es true, suprime las cargas útiles de advertencia de error de herramientas durante las ejecuciones de heartbeat.
- `activeHours`: restringe las ejecuciones de heartbeat a una ventana horaria. Objeto con `start` (HH:MM, inclusivo; usa `00:00` para el inicio del día), `end` (HH:MM exclusivo; se permite `24:00` para el final del día) y `timezone` opcional.
  - Omitido o `"user"`: usa tu `agents.defaults.userTimezone` si está configurado; de lo contrario, usa la zona horaria del sistema host.
  - `"local"`: siempre usa la zona horaria del sistema host.
  - Cualquier identificador IANA (por ejemplo `America/New_York`): se usa directamente; si no es válido, se usa como respaldo el comportamiento `"user"` anterior.
  - `start` y `end` no deben ser iguales para una ventana activa; valores iguales se tratan como anchura cero (siempre fuera de la ventana).
  - Fuera de la ventana activa, los heartbeats se omiten hasta el siguiente tick dentro de la ventana.

## Comportamiento de entrega

- Los heartbeats se ejecutan de forma predeterminada en la sesión principal del agente (`agent:<id>:<mainKey>`),
  o en `global` cuando `session.scope = "global"`. Establece `session` para anularlo y usar una
  sesión específica de canal (Discord/WhatsApp/etc.).
- `session` solo afecta al contexto de ejecución; la entrega se controla con `target` y `to`.
- Para entregar a un canal/destinatario específico, establece `target` + `to`. Con
  `target: "last"`, la entrega usa el último canal externo de esa sesión.
- Las entregas de heartbeat permiten destinos directos/DM de forma predeterminada. Establece `directPolicy: "block"` para suprimir los envíos a destinos directos mientras sigue ejecutándose el turno de heartbeat.
- Si la cola principal está ocupada, el heartbeat se omite y se reintenta más tarde.
- Si `target` no se resuelve en ningún destino externo, la ejecución sigue ocurriendo, pero no
  se envía ningún mensaje saliente.
- Si `showOk`, `showAlerts` y `useIndicator` están todos desactivados, la ejecución se omite de entrada como `reason=alerts-disabled`.
- Si solo la entrega de alertas está desactivada, OpenClaw aún puede ejecutar el heartbeat, actualizar las marcas de tiempo de tareas vencidas, restaurar la marca de tiempo de inactividad de la sesión y suprimir la carga útil de alerta saliente.
- Si el destino de heartbeat resuelto admite indicador de escritura, OpenClaw lo muestra mientras
  la ejecución de heartbeat está activa. Esto usa el mismo destino al que el heartbeat
  enviaría la salida del chat y se desactiva con `typingMode: "never"`.
- Las respuestas exclusivas de heartbeat **no** mantienen viva la sesión; se restaura el último `updatedAt`
  para que la caducidad por inactividad se comporte normalmente.
- El historial de Control UI y WebChat oculta los prompts de heartbeat y los acuses
  solo-OK. La transcripción subyacente de la sesión aún puede contener esos
  turnos para auditoría/reproducción.
- Las [tareas en segundo plano](/es/automation/tasks) desacopladas pueden poner en cola un evento del sistema y activar heartbeat cuando la sesión principal debe notar algo rápidamente. Esa activación no convierte la ejecución de heartbeat en una tarea en segundo plano.

## Controles de visibilidad

De forma predeterminada, los acuses `HEARTBEAT_OK` se suprimen mientras que el contenido de alerta sí
se entrega. Puedes ajustar esto por canal o por cuenta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ocultar HEARTBEAT_OK (predeterminado)
      showAlerts: true # Mostrar mensajes de alerta (predeterminado)
      useIndicator: true # Emitir eventos de indicador (predeterminado)
  telegram:
    heartbeat:
      showOk: true # Mostrar acuses OK en Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suprimir la entrega de alertas para esta cuenta
```

Precedencia: por cuenta → por canal → valores predeterminados del canal → valores predeterminados integrados.

### Qué hace cada indicador

- `showOk`: envía un acuse `HEARTBEAT_OK` cuando el modelo devuelve una respuesta solo-OK.
- `showAlerts`: envía el contenido de alerta cuando el modelo devuelve una respuesta no-OK.
- `useIndicator`: emite eventos de indicador para superficies de estado de interfaz.

Si **los tres** son false, OpenClaw omite por completo la ejecución de heartbeat (sin llamada al modelo).

### Ejemplos por canal y por cuenta

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # todas las cuentas de Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suprimir alertas solo para la cuenta ops
  telegram:
    heartbeat:
      showOk: true
```

### Patrones comunes

| Objetivo                                 | Configuración                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamiento predeterminado (OK silenciosos, alertas activas) | _(no se necesita configuración)_                                             |
| Totalmente silencioso (sin mensajes ni indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicador (sin mensajes)            | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK solo en un canal                      | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Si existe un archivo `HEARTBEAT.md` en el espacio de trabajo, el prompt predeterminado indica al
agente que lo lea. Piensa en él como tu “lista de verificación de heartbeat”: pequeña, estable y
segura de incluir cada 30 minutos.

En las ejecuciones normales, `HEARTBEAT.md` solo se inyecta cuando la guía de heartbeat está
habilitada para el agente predeterminado. Desactivar la cadencia de heartbeat con `0m` o
configurar `includeSystemPromptSection: false` lo omite del contexto normal
de arranque.

Si `HEARTBEAT.md` existe pero está prácticamente vacío (solo líneas en blanco y encabezados Markdown
como `# Heading`), OpenClaw omite la ejecución de heartbeat para ahorrar llamadas a la API.
Esa omisión se informa como `reason=empty-heartbeat-file`.
Si falta el archivo, el heartbeat sigue ejecutándose y el modelo decide qué hacer.

Mantenlo pequeño (lista breve de verificación o recordatorios) para evitar inflar el prompt.

Ejemplo de `HEARTBEAT.md`:

```md
# Lista de verificación de heartbeat

- Revisión rápida: ¿hay algo urgente en las bandejas de entrada?
- Si es de día, haz una verificación ligera si no hay nada más pendiente.
- Si una tarea está bloqueada, anota _qué falta_ y pregúntaselo a Peter la próxima vez.
```

### Bloques `tasks:`

`HEARTBEAT.md` también admite un pequeño bloque estructurado `tasks:` para comprobaciones
basadas en intervalos dentro del propio heartbeat.

Ejemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Instrucciones adicionales

- Mantén las alertas breves.
- Si nada necesita atención después de todas las tareas vencidas, responde HEARTBEAT_OK.
```

Comportamiento:

- OpenClaw analiza el bloque `tasks:` y comprueba cada tarea según su propio `interval`.
- Solo las tareas **vencidas** se incluyen en el prompt de heartbeat de ese tick.
- Si no hay tareas vencidas, el heartbeat se omite por completo (`reason=no-tasks-due`) para evitar una llamada al modelo desperdiciada.
- El contenido no relacionado con tareas en `HEARTBEAT.md` se conserva y se agrega como contexto adicional después de la lista de tareas vencidas.
- Las marcas de tiempo de la última ejecución de las tareas se almacenan en el estado de sesión (`heartbeatTaskState`), por lo que los intervalos sobreviven a reinicios normales.
- Las marcas de tiempo de tareas solo avanzan después de que una ejecución de heartbeat complete su ruta normal de respuesta. Las ejecuciones omitidas por `empty-heartbeat-file` / `no-tasks-due` no marcan tareas como completadas.

El modo de tareas es útil cuando quieres que un solo archivo de heartbeat contenga varias comprobaciones periódicas sin pagar por todas en cada tick.

### ¿Puede el agente actualizar HEARTBEAT.md?

Sí, si se lo pides.

`HEARTBEAT.md` es solo un archivo normal en el espacio de trabajo del agente, así que puedes decirle al
agente (en un chat normal) algo como:

- “Actualiza `HEARTBEAT.md` para añadir una revisión diaria del calendario.”
- “Reescribe `HEARTBEAT.md` para que sea más corto y se centre en seguimientos de la bandeja de entrada.”

Si quieres que esto ocurra de forma proactiva, también puedes incluir una línea explícita en
tu prompt de heartbeat como: “If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

Nota de seguridad: no pongas secretos (claves de API, números de teléfono, tokens privados) en
`HEARTBEAT.md`, ya que pasa a formar parte del contexto del prompt.

## Activación manual (bajo demanda)

Puedes poner en cola un evento del sistema y activar un heartbeat inmediato con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Si varios agentes tienen `heartbeat` configurado, una activación manual ejecuta inmediatamente cada uno de esos
heartbeats de agente.

Usa `--mode next-heartbeat` para esperar al siguiente tick programado.

## Entrega de razonamiento (opcional)

De forma predeterminada, los heartbeats entregan solo la carga útil final de la “respuesta”.

Si quieres transparencia, habilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Cuando está habilitado, los heartbeats también entregan un mensaje aparte con el prefijo
`Reasoning:` (misma forma que `/reasoning on`). Esto puede ser útil cuando el agente
gestiona varias sesiones/codexes y quieres ver por qué decidió hacerte ping,
pero también puede revelar más detalle interno del que quieres. Es mejor mantenerlo
desactivado en chats de grupo.

## Consideraciones de costo

Los heartbeats ejecutan turnos completos del agente. Los intervalos más cortos consumen más tokens. Para reducir el costo:

- Usa `isolatedSession: true` para evitar enviar todo el historial de conversación (de ~100K tokens a ~2-5K por ejecución).
- Usa `lightContext: true` para limitar los archivos de arranque a solo `HEARTBEAT.md`.
- Configura un `model` más económico (por ejemplo `ollama/llama3.2:1b`).
- Mantén `HEARTBEAT.md` pequeño.
- Usa `target: "none"` si solo quieres actualizaciones de estado internas.

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — cómo se rastrea el trabajo desacoplado
- [Zona horaria](/es/concepts/timezone) — cómo afecta la zona horaria a la programación de Heartbeat
- [Solución de problemas](/es/automation/cron-jobs#troubleshooting) — depuración de problemas de automatización
