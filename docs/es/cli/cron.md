---
read_when:
    - Quieres trabajos programados y activaciones programadas
    - Estás depurando la ejecución y los logs de Cron
summary: Referencia de la CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:43:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Administra trabajos de Cron para el programador del Gateway.

Relacionado:

- Trabajos de Cron: [Trabajos de Cron](/es/automation/cron-jobs)

Consejo: ejecuta `openclaw cron --help` para ver toda la superficie del comando.

Nota: `openclaw cron list` y `openclaw cron show <job-id>` muestran una vista previa de la
ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la
ruta se resolvió desde la sesión principal/actual o si fallará de forma cerrada.

Nota: los trabajos aislados de `cron add` usan por defecto la entrega `--announce`. Usa `--no-deliver` para mantener
la salida interna. `--deliver` sigue disponible como alias obsoleto de `--announce`.

Nota: la entrega de chat de Cron aislado es compartida. `--announce` es la entrega de respaldo del
runner para la respuesta final; `--no-deliver` desactiva ese respaldo, pero no
elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Nota: los trabajos de una sola ejecución (`--at`) se eliminan después del éxito por defecto. Usa `--keep-after-run` para conservarlos.

Nota: `--session` admite `main`, `isolated`, `current` y `session:<id>`.
Usa `current` para vincularlo a la sesión activa en el momento de la creación, o `session:<id>` para
una clave de sesión persistente explícita.

Nota: `--session isolated` crea una transcripción/id de sesión nueva para cada ejecución.
Las preferencias seguras y las sobrescrituras explícitas de modelo/autenticación seleccionadas por el usuario pueden mantenerse, pero
el contexto ambiental de la conversación no: el enrutamiento de canal/grupo, la política de envío/cola,
la elevación, el origen y el enlace de runtime de ACP se restablecen para la nueva ejecución aislada.

Nota: para trabajos CLI de una sola ejecución, las fechas y horas `--at` sin desplazamiento se tratan como UTC a menos que también pases
`--tz <iana>`, que interpreta esa hora local de pared en la zona horaria indicada.

Nota: los trabajos recurrentes ahora usan retroceso exponencial de reintentos tras errores consecutivos (30s → 1m → 5m → 15m → 60m), y luego vuelven a la programación normal después de la siguiente ejecución exitosa.

Nota: `openclaw cron run` ahora devuelve en cuanto la ejecución manual queda encolada para ejecutarse. Las respuestas exitosas incluyen `{ ok: true, enqueued: true, runId }`; usa `openclaw cron runs --id <job-id>` para seguir el resultado final.

Nota: `openclaw cron run <job-id>` fuerza la ejecución por defecto. Usa `--due` para conservar el
comportamiento anterior de “ejecutar solo si corresponde”.

Nota: los turnos aislados de Cron suprimen respuestas obsoletas que solo reconocen el mensaje. Si el
primer resultado es solo una actualización provisional de estado y ninguna ejecución descendiente de subagente es
responsable de la respuesta final, Cron vuelve a solicitar una vez el resultado real
antes de entregarlo.

Nota: si una ejecución aislada de Cron devuelve solo el token silencioso (`NO_REPLY` /
`no_reply`), Cron suprime tanto la entrega saliente directa como la ruta de resumen
en cola de respaldo, por lo que no se publica nada de vuelta al chat.

Nota: `cron add|edit --model ...` usa ese modelo permitido seleccionado para el trabajo.
Si el modelo no está permitido, Cron avisa y recurre en su lugar a la selección de
modelo del agente/predeterminado del trabajo. Las cadenas de fallback configuradas siguen aplicándose, pero una simple
sobrescritura de modelo sin una lista explícita de fallback por trabajo ya no agrega el
modelo principal del agente como objetivo adicional oculto de reintento.

Nota: la precedencia de modelo de Cron aislado es: primero la sobrescritura de hook de Gmail, luego
`--model` por trabajo, luego cualquier sobrescritura de modelo de sesión de Cron almacenada seleccionada por el usuario, y después la
selección normal de agente/predeterminado.

Nota: el modo rápido de Cron aislado sigue la selección de modelo live resuelta. La configuración del
modelo `params.fastMode` se aplica por defecto, pero una sobrescritura `fastMode` de sesión almacenada sigue teniendo prioridad sobre la configuración.

Nota: si una ejecución aislada lanza `LiveSessionModelSwitchError`, Cron conserva el
proveedor/modelo cambiado (y la sobrescritura cambiada del perfil de autenticación cuando existe) para
la ejecución activa antes de reintentar. El bucle externo de reintentos está acotado a 2 reintentos de cambio
después del intento inicial, y luego aborta en lugar de entrar en un bucle infinito.

Nota: las notificaciones de error usan primero `delivery.failureDestination`, luego
`cron.failureDestination` global y, por último, recurren al destino principal de
anuncio del trabajo cuando no se configura un destino de error explícito.

Nota: la retención/poda se controla en la configuración:

- `cron.sessionRetention` (por defecto `24h`) poda las sesiones aisladas completadas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan `~/.openclaw/cron/runs/<jobId>.jsonl`.

Nota de actualización: si tienes trabajos de Cron antiguos de antes del formato actual de entrega/almacenamiento, ejecuta
`openclaw doctor --fix`. Doctor ahora normaliza campos heredados de Cron (`jobId`, `schedule.cron`,
campos de entrega de nivel superior, incluido `threadId` heredado, alias de entrega `provider` en payload) y migra trabajos simples
de fallback de Webhook con `notify: true` a entrega explícita por Webhook cuando `cron.webhook` está
configurado.

## Ediciones comunes

Actualizar la configuración de entrega sin cambiar el mensaje:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desactivar la entrega para un trabajo aislado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Habilitar contexto bootstrap ligero para un trabajo aislado:

```bash
openclaw cron edit <job-id> --light-context
```

Anunciar en un canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crear un trabajo aislado con contexto bootstrap ligero:

```bash
openclaw cron add \
  --name "Resumen matutino ligero" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Resume las novedades de la noche." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica solo a trabajos aislados de turnos del agente. Para las ejecuciones de Cron, el modo ligero mantiene vacío el contexto bootstrap en lugar de inyectar el conjunto completo de bootstrap del espacio de trabajo.

Nota sobre la propiedad de la entrega:

- La entrega de chat de Cron aislado es compartida. El agente puede enviar directamente con la
  herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega por respaldo la respuesta final solo cuando el agente no envió
  directamente al destino resuelto. `webhook` publica el payload finalizado en una URL.
  `none` desactiva la entrega de respaldo del runner.

## Comandos comunes de administración

Ejecución manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino previsto de Cron,
el destino resuelto, envíos de la herramienta message, uso de respaldo y estado de entrega.

Redirección de agente/sesión:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ajustes de entrega:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Nota sobre entrega en errores:

- `delivery.failureDestination` es compatible con trabajos aislados.
- Los trabajos de sesión principal solo pueden usar `delivery.failureDestination` cuando el modo principal
  de entrega es `webhook`.
- Si no configuras ningún destino de error y el trabajo ya anuncia en un
  canal, las notificaciones de error reutilizan ese mismo destino de anuncio.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Tareas programadas](/es/automation/cron-jobs)
