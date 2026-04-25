---
read_when:
    - Cambiar la ejecución de respuesta automática o la concurrencia
summary: Diseño de la cola de comandos que serializa las ejecuciones de respuesta automática entrantes
title: Cola de comandos
x-i18n:
    generated_at: "2026-04-25T13:45:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

Serializamos las ejecuciones de respuesta automática entrantes (todos los canales) mediante una pequeña cola en proceso para evitar que varias ejecuciones del agente colisionen, al tiempo que permitimos paralelismo seguro entre sesiones.

## Por qué

- Las ejecuciones de respuesta automática pueden ser costosas (llamadas al LLM) y pueden colisionar cuando llegan varios mensajes entrantes con poca diferencia de tiempo.
- La serialización evita competir por recursos compartidos (archivos de sesión, registros, stdin de CLI) y reduce la probabilidad de límites de tasa ascendentes.

## Cómo funciona

- Una cola FIFO con conocimiento de carriles vacía cada carril con un límite de concurrencia configurable (predeterminado 1 para carriles no configurados; `main` usa 4 por defecto y `subagent` 8).
- `runEmbeddedPiAgent` pone en cola por **clave de sesión** (carril `session:<key>`) para garantizar que solo haya una ejecución activa por sesión.
- Cada ejecución de sesión se pone después en cola en un **carril global** (`main` por defecto) para que el paralelismo general quede limitado por `agents.defaults.maxConcurrent`.
- Cuando el registro detallado está habilitado, las ejecuciones en cola emiten un aviso corto si esperaron más de ~2 s antes de comenzar.
- Los indicadores de escritura siguen activándose inmediatamente al poner en cola (cuando el canal los admite), de modo que la experiencia del usuario no cambia mientras esperamos el turno.

## Modos de cola (por canal)

Los mensajes entrantes pueden dirigir la ejecución actual, esperar un turno de seguimiento o hacer ambas cosas:

- `steer`: inyectar inmediatamente en la ejecución actual (cancela llamadas a herramientas pendientes después del siguiente límite de herramienta). Si no está transmitiendo en streaming, recurre a followup.
- `followup`: poner en cola para el siguiente turno del agente después de que termine la ejecución actual.
- `collect`: fusionar todos los mensajes en cola en un **único** turno de seguimiento (predeterminado). Si los mensajes apuntan a distintos canales/hilos, se vacían individualmente para preservar el enrutamiento.
- `steer-backlog` (también `steer+backlog`): dirigir ahora **y** conservar el mensaje para un turno de seguimiento.
- `interrupt` (heredado): abortar la ejecución activa de esa sesión y luego ejecutar el mensaje más reciente.
- `queue` (alias heredado): igual que `steer`.

Steer-backlog significa que puedes obtener una respuesta de seguimiento después de la ejecución dirigida, por lo que
las superficies de streaming pueden parecer duplicados. Prefiere `collect`/`steer` si quieres
una respuesta por mensaje entrante.
Envía `/queue collect` como comando independiente (por sesión) o configura `messages.queue.byChannel.discord: "collect"`.

Valores predeterminados (cuando no se configuran):

- Todas las superficies → `collect`

Configura globalmente o por canal mediante `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opciones de cola

Las opciones se aplican a `followup`, `collect` y `steer-backlog` (y a `steer` cuando recurre a followup):

- `debounceMs`: esperar un periodo de calma antes de iniciar un turno de seguimiento (evita “continue, continue”).
- `cap`: máximo de mensajes en cola por sesión.
- `drop`: política de desbordamiento (`old`, `new`, `summarize`).

Summarize conserva una breve lista con viñetas de los mensajes descartados y la inyecta como prompt sintético de seguimiento.
Valores predeterminados: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Sobrescrituras por sesión

- Envía `/queue <mode>` como comando independiente para almacenar el modo de la sesión actual.
- Las opciones pueden combinarse: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` o `/queue reset` borra la sobrescritura de la sesión.

## Alcance y garantías

- Se aplica a las ejecuciones del agente de respuesta automática en todos los canales entrantes que usan la canalización de respuesta de Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- El carril predeterminado (`main`) es de todo el proceso para entrada + Heartbeat principales; configura `agents.defaults.maxConcurrent` para permitir varias sesiones en paralelo.
- Pueden existir carriles adicionales (por ejemplo, `cron`, `subagent`) para que los trabajos en segundo plano se ejecuten en paralelo sin bloquear respuestas entrantes. Estas ejecuciones desacopladas se rastrean como [tareas en segundo plano](/es/automation/tasks).
- Los carriles por sesión garantizan que solo una ejecución del agente toque una sesión determinada a la vez.
- Sin dependencias externas ni hilos de trabajo en segundo plano; TypeScript puro + promesas.

## Solución de problemas

- Si los comandos parecen atascados, habilita los registros detallados y busca líneas “queued for …ms” para confirmar que la cola se está vaciando.
- Si necesitas profundidad de cola, habilita los registros detallados y observa las líneas de temporización de la cola.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Política de reintentos](/es/concepts/retry)
