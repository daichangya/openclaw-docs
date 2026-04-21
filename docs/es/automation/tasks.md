---
read_when:
    - Inspeccionando el trabajo en segundo plano en curso o completado recientemente
    - Depuración de errores de entrega en ejecuciones desacopladas de agentes
    - Comprender cómo las ejecuciones en segundo plano se relacionan con las sesiones, Cron y Heartbeat
summary: Seguimiento de tareas en segundo plano para ejecuciones de ACP, subagentes, trabajos de Cron aislados y operaciones de CLI
title: Tareas en segundo plano
x-i18n:
    generated_at: "2026-04-21T19:20:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd666b3eaffde8df0b5e1533eb337e44a0824824af6f8a240f18a89f71b402
    source_path: automation/tasks.md
    workflow: 15
---

# Tareas en segundo plano

> **¿Buscas programación?** Consulta [Automatización y tareas](/es/automation) para elegir el mecanismo adecuado. Esta página cubre el **seguimiento** del trabajo en segundo plano, no su programación.

Las tareas en segundo plano hacen seguimiento del trabajo que se ejecuta **fuera de tu sesión principal de conversación**:
ejecuciones de ACP, lanzamientos de subagentes, ejecuciones aisladas de trabajos de Cron y operaciones iniciadas por la CLI.

Las tareas **no** reemplazan a las sesiones, los trabajos de Cron ni los Heartbeat — son el **registro de actividad** que deja constancia de qué trabajo desacoplado ocurrió, cuándo y si tuvo éxito.

<Note>
No todas las ejecuciones de agentes crean una tarea. Los turnos de Heartbeat y el chat interactivo normal no lo hacen. Todas las ejecuciones de Cron, los lanzamientos de ACP, los lanzamientos de subagentes y los comandos de agente de la CLI sí lo hacen.
</Note>

## Resumen rápido

- Las tareas son **registros**, no programadores: Cron y Heartbeat deciden _cuándo_ se ejecuta el trabajo; las tareas hacen seguimiento de _qué ocurrió_.
- ACP, los subagentes, todos los trabajos de Cron y las operaciones de CLI crean tareas. Los turnos de Heartbeat no.
- Cada tarea pasa por `queued → running → terminal` (`succeeded`, `failed`, `timed_out`, `cancelled` o `lost`).
- Las tareas de Cron permanecen activas mientras el entorno de ejecución de Cron siga siendo propietario del trabajo; las tareas de CLI respaldadas por chat permanecen activas solo mientras su contexto de ejecución propietario siga activo.
- La finalización se basa en envíos: el trabajo desacoplado puede notificar directamente o despertar la sesión/Heartbeat solicitante cuando termina, por lo que los bucles de sondeo de estado normalmente no son el enfoque adecuado.
- Las ejecuciones aisladas de Cron y las finalizaciones de subagentes limpian, en el mejor de los casos, las pestañas/procesos del navegador rastreados para su sesión hija antes de la contabilidad final de limpieza.
- La entrega de Cron aislado suprime las respuestas intermedias obsoletas del padre mientras el trabajo descendiente del subagente aún se está vaciando, y prioriza la salida final descendiente cuando llega antes de la entrega.
- Las notificaciones de finalización se entregan directamente a un canal o se ponen en cola para el siguiente Heartbeat.
- `openclaw tasks list` muestra todas las tareas; `openclaw tasks audit` muestra los problemas.
- Los registros terminales se conservan durante 7 días y luego se eliminan automáticamente.

## Inicio rápido

```bash
# Lista todas las tareas (las más recientes primero)
openclaw tasks list

# Filtra por entorno de ejecución o estado
openclaw tasks list --runtime acp
openclaw tasks list --status running

# Muestra detalles de una tarea específica (por ID, ID de ejecución o clave de sesión)
openclaw tasks show <lookup>

# Cancela una tarea en ejecución (mata la sesión hija)
openclaw tasks cancel <lookup>

# Cambia la política de notificaciones de una tarea
openclaw tasks notify <lookup> state_changes

# Ejecuta una auditoría de estado
openclaw tasks audit

# Previsualiza o aplica mantenimiento
openclaw tasks maintenance
openclaw tasks maintenance --apply

# Inspecciona el estado de TaskFlow
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Qué crea una tarea

| Origen                 | Tipo de entorno de ejecución | Cuándo se crea un registro de tarea                    | Política de notificación predeterminada |
| ---------------------- | ---------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Ejecuciones en segundo plano de ACP | `acp`        | Al lanzar una sesión hija de ACP                       | `done_only`                             |
| Orquestación de subagentes | `subagent`   | Al lanzar un subagente mediante `sessions_spawn`       | `done_only`                             |
| Trabajos de Cron (todos los tipos)  | `cron`       | En cada ejecución de Cron (sesión principal y aislada) | `silent`                                |
| Operaciones de CLI         | `cli`        | Comandos `openclaw agent` que se ejecutan a través del Gateway | `silent`                         |
| Trabajos multimedia del agente       | `cli`        | Ejecuciones `video_generate` respaldadas por sesión    | `silent`                                |

Las tareas de Cron de la sesión principal usan la política de notificación `silent` de forma predeterminada: crean registros para seguimiento, pero no generan notificaciones. Las tareas de Cron aisladas también usan `silent` de forma predeterminada, pero son más visibles porque se ejecutan en su propia sesión.

Las ejecuciones `video_generate` respaldadas por sesión también usan la política de notificación `silent`. Siguen creando registros de tarea, pero la finalización se devuelve a la sesión original del agente como una activación interna para que el agente pueda escribir el mensaje de seguimiento y adjuntar por sí mismo el video finalizado. Si activas `tools.media.asyncCompletion.directSend`, las finalizaciones asíncronas de `music_generate` y `video_generate` intentan primero la entrega directa al canal antes de recurrir a la ruta de activación de la sesión solicitante.

Mientras una tarea `video_generate` respaldada por sesión siga activa, la herramienta también actúa como protección: las llamadas repetidas a `video_generate` en esa misma sesión devuelven el estado de la tarea activa en lugar de iniciar una segunda generación concurrente. Usa `action: "status"` cuando quieras una consulta explícita de progreso/estado del lado del agente.

**Qué no crea tareas:**

- Turnos de Heartbeat — sesión principal; consulta [Heartbeat](/es/gateway/heartbeat)
- Turnos normales de chat interactivo
- Respuestas directas de `/command`

## Ciclo de vida de la tarea

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent starts
    running --> succeeded : completes ok
    running --> failed : error
    running --> timed_out : timeout exceeded
    running --> cancelled : operator cancels
    queued --> lost : session gone > 5 min
    running --> lost : session gone > 5 min
```

| Estado      | Qué significa                                                              |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | Creada, esperando a que el agente inicie                                   |
| `running`   | El turno del agente se está ejecutando activamente                         |
| `succeeded` | Completada correctamente                                                    |
| `failed`    | Completada con un error                                                     |
| `timed_out` | Superó el tiempo de espera configurado                                     |
| `cancelled` | Detenida por el operador mediante `openclaw tasks cancel`                  |
| `lost`      | El entorno de ejecución perdió el estado de respaldo autoritativo tras un período de gracia de 5 minutos |

Las transiciones ocurren automáticamente: cuando finaliza la ejecución del agente asociada, el estado de la tarea se actualiza para coincidir.

`lost` depende del entorno de ejecución:

- Tareas de ACP: desaparecieron los metadatos de la sesión hija de ACP de respaldo.
- Tareas de subagentes: la sesión hija de respaldo desapareció del almacén del agente de destino.
- Tareas de Cron: el entorno de ejecución de Cron ya no registra el trabajo como activo.
- Tareas de CLI: las tareas aisladas de sesión hija usan la sesión hija; las tareas de CLI respaldadas por chat usan en su lugar el contexto de ejecución en vivo, por lo que las filas persistentes de sesión de canal/grupo/directa no las mantienen activas.

## Entrega y notificaciones

Cuando una tarea alcanza un estado terminal, OpenClaw te notifica. Hay dos rutas de entrega:

**Entrega directa**: si la tarea tiene un destino de canal (el `requesterOrigin`), el mensaje de finalización va directamente a ese canal (Telegram, Discord, Slack, etc.). Para finalizaciones de subagentes, OpenClaw también conserva el enrutamiento vinculado de hilo/tema cuando está disponible y puede completar un `to` o una cuenta faltantes a partir de la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) antes de abandonar la entrega directa.

**Entrega en cola de sesión**: si la entrega directa falla o no se establece ningún origen, la actualización se pone en cola como un evento del sistema en la sesión del solicitante y aparece en el siguiente Heartbeat.

<Tip>
La finalización de la tarea activa un Heartbeat inmediato para que veas el resultado rápidamente; no tienes que esperar al siguiente tick programado de Heartbeat.
</Tip>

Eso significa que el flujo de trabajo habitual se basa en envíos: inicia el trabajo desacoplado una vez y luego deja que el entorno de ejecución te despierte o notifique al completarse. Sondea el estado de la tarea solo cuando necesites depuración, intervención o una auditoría explícita.

### Políticas de notificación

Controla cuánto recibes de cada tarea:

| Política              | Qué se entrega                                                          |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only` (predeterminada) | Solo el estado terminal (`succeeded`, `failed`, etc.) — **esta es la opción predeterminada** |
| `state_changes`       | Cada transición de estado y actualización de progreso                   |
| `silent`              | Nada en absoluto                                                        |

Cambia la política mientras una tarea se está ejecutando:

```bash
openclaw tasks notify <lookup> state_changes
```

## Referencia de CLI

### `tasks list`

```bash
openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
```

Columnas de salida: ID de tarea, tipo, estado, entrega, ID de ejecución, sesión hija, resumen.

### `tasks show`

```bash
openclaw tasks show <lookup>
```

El token de búsqueda acepta un ID de tarea, un ID de ejecución o una clave de sesión. Muestra el registro completo, incluidos el tiempo, el estado de entrega, el error y el resumen terminal.

### `tasks cancel`

```bash
openclaw tasks cancel <lookup>
```

Para tareas de ACP y subagentes, esto mata la sesión hija. Para las tareas seguidas por CLI, la cancelación se registra en el registro de tareas (no existe un identificador independiente del entorno de ejecución hijo). El estado pasa a `cancelled` y se envía una notificación de entrega cuando corresponde.

### `tasks notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

### `tasks audit`

```bash
openclaw tasks audit [--json]
```

Muestra problemas operativos. Los hallazgos también aparecen en `openclaw status` cuando se detectan problemas.

| Hallazgo                   | Severidad | Disparador                                            |
| -------------------------- | --------- | ----------------------------------------------------- |
| `stale_queued`             | warn      | En cola durante más de 10 minutos                     |
| `stale_running`            | error     | En ejecución durante más de 30 minutos                |
| `lost`                     | error     | Desapareció la propiedad de la tarea respaldada por el entorno de ejecución |
| `delivery_failed`          | warn      | La entrega falló y la política de notificación no es `silent` |
| `missing_cleanup`          | warn      | Tarea terminal sin marca temporal de limpieza         |
| `inconsistent_timestamps`  | warn      | Violación de cronología (por ejemplo, terminó antes de comenzar) |

### `tasks maintenance`

```bash
openclaw tasks maintenance [--json]
openclaw tasks maintenance --apply [--json]
```

Úsalo para previsualizar o aplicar reconciliación, marcado de limpieza y eliminación para las tareas y el estado de Task Flow.

La reconciliación depende del entorno de ejecución:

- Las tareas de ACP/subagentes comprueban su sesión hija de respaldo.
- Las tareas de Cron comprueban si el entorno de ejecución de Cron sigue siendo propietario del trabajo.
- Las tareas de CLI respaldadas por chat comprueban el contexto de ejecución en vivo propietario, no solo la fila de la sesión de chat.

La limpieza tras la finalización también depende del entorno de ejecución:

- La finalización de subagentes cierra, en el mejor de los casos, las pestañas/procesos del navegador rastreados para la sesión hija antes de que continúe la limpieza del anuncio.
- La finalización de Cron aislado cierra, en el mejor de los casos, las pestañas/procesos del navegador rastreados para la sesión de Cron antes de que la ejecución se desmonte por completo.
- La entrega de Cron aislado espera, cuando es necesario, el seguimiento descendiente del subagente y suprime el texto obsoleto de confirmación del padre en lugar de anunciarlo.
- La entrega de finalización de subagentes prioriza el texto visible más reciente del asistente; si está vacío, recurre al texto saneado más reciente de tool/toolResult, y las ejecuciones de llamadas de herramientas con solo tiempo de espera pueden reducirse a un breve resumen de progreso parcial. Las ejecuciones terminales fallidas anuncian el estado de fallo sin volver a reproducir el texto de respuesta capturado.
- Los errores de limpieza no ocultan el resultado real de la tarea.

### `tasks flow list|show|cancel`

```bash
openclaw tasks flow list [--status <status>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Úsalos cuando lo que te importe sea el Task Flow de orquestación en lugar de un registro individual de tarea en segundo plano.

## Tablero de tareas del chat (`/tasks`)

Usa `/tasks` en cualquier sesión de chat para ver las tareas en segundo plano vinculadas a esa sesión. El tablero muestra
las tareas activas y completadas recientemente con el entorno de ejecución, el estado, el tiempo y el detalle del progreso o del error.

Cuando la sesión actual no tiene tareas vinculadas visibles, `/tasks` recurre a los recuentos de tareas locales del agente
para que sigas obteniendo una visión general sin filtrar detalles de otras sesiones.

Para el registro completo del operador, usa la CLI: `openclaw tasks list`.

## Integración de estado (presión de tareas)

`openclaw status` incluye un resumen de tareas de un vistazo:

```
Tasks: 3 queued · 2 running · 1 issues
```

El resumen informa:

- **active** — recuento de `queued` + `running`
- **failures** — recuento de `failed` + `timed_out` + `lost`
- **byRuntime** — desglose por `acp`, `subagent`, `cron`, `cli`

Tanto `/status` como la herramienta `session_status` usan una instantánea de tareas con reconocimiento de limpieza: se priorizan las tareas activas,
se ocultan las filas completadas obsoletas y los fallos recientes solo aparecen cuando ya no queda trabajo activo.
Esto mantiene la tarjeta de estado centrada en lo que importa ahora mismo.

## Almacenamiento y mantenimiento

### Dónde viven las tareas

Los registros de tareas persisten en SQLite en:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

El registro se carga en memoria al iniciar el Gateway y sincroniza las escrituras con SQLite para ofrecer durabilidad entre reinicios.

### Mantenimiento automático

Un proceso de barrido se ejecuta cada **60 segundos** y gestiona tres cosas:

1. **Reconciliación** — comprueba si las tareas activas siguen teniendo respaldo autoritativo del entorno de ejecución. Las tareas de ACP/subagentes usan el estado de la sesión hija, las tareas de Cron usan la propiedad activa del trabajo y las tareas de CLI respaldadas por chat usan el contexto de ejecución propietario. Si ese estado de respaldo desaparece durante más de 5 minutos, la tarea se marca como `lost`.
2. **Marcado de limpieza** — establece una marca temporal `cleanupAfter` en las tareas terminales (`endedAt` + 7 días).
3. **Eliminación** — borra los registros que han superado su fecha `cleanupAfter`.

**Retención**: los registros de tareas terminales se conservan durante **7 días** y luego se eliminan automáticamente. No se necesita configuración.

## Cómo se relacionan las tareas con otros sistemas

### Tareas y TaskFlow

[TaskFlow](/es/automation/taskflow) es la capa de orquestación de flujos por encima de las tareas en segundo plano. Un único flujo puede coordinar varias tareas durante su ciclo de vida mediante modos de sincronización gestionados o reflejados. Usa `openclaw tasks` para inspeccionar registros individuales de tareas y `openclaw tasks flow` para inspeccionar el flujo de orquestación.

Consulta [TaskFlow](/es/automation/taskflow) para más detalles.

### Tareas y Cron

La **definición** de un trabajo de Cron vive en `~/.openclaw/cron/jobs.json`; el estado de ejecución en tiempo de ejecución vive junto a él en `~/.openclaw/cron/jobs-state.json`. **Cada** ejecución de Cron crea un registro de tarea, tanto en la sesión principal como en modo aislado. Las tareas de Cron de la sesión principal usan de forma predeterminada la política de notificación `silent`, por lo que hacen seguimiento sin generar notificaciones.

Consulta [Trabajos de Cron](/es/automation/cron-jobs).

### Tareas y Heartbeat

Las ejecuciones de Heartbeat son turnos de la sesión principal: no crean registros de tarea. Cuando una tarea se completa, puede activar un Heartbeat para que veas el resultado rápidamente.

Consulta [Heartbeat](/es/gateway/heartbeat).

### Tareas y sesiones

Una tarea puede hacer referencia a un `childSessionKey` (donde se ejecuta el trabajo) y a un `requesterSessionKey` (quién lo inició). Las sesiones son el contexto de conversación; las tareas son la capa de seguimiento de actividad sobre ese contexto.

### Tareas y ejecuciones de agentes

El `runId` de una tarea enlaza con la ejecución del agente que realiza el trabajo. Los eventos del ciclo de vida del agente (inicio, finalización, error) actualizan automáticamente el estado de la tarea; no necesitas gestionar el ciclo de vida manualmente.

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [TaskFlow](/es/automation/taskflow) — orquestación de flujos por encima de las tareas
- [Tareas programadas](/es/automation/cron-jobs) — programación de trabajo en segundo plano
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [CLI: Tasks](/cli/index#tasks) — referencia de comandos de CLI
