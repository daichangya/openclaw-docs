---
read_when:
    - Necesitas un recorrido exacto del bucle del agente o de los eventos del ciclo de vida
    - Estás cambiando la puesta en cola de sesiones, las escrituras de transcripciones o el comportamiento del bloqueo de escritura de sesiones
summary: Ciclo de vida del bucle del agente, streams y semántica de espera
title: Bucle del agente
x-i18n:
    generated_at: "2026-04-25T13:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

Un bucle agéntico es la ejecución completa “real” de un agente: entrada → ensamblaje de contexto → inferencia del modelo →
ejecución de herramientas → respuestas en streaming → persistencia. Es la ruta autorizada que convierte un mensaje
en acciones y una respuesta final, mientras mantiene consistente el estado de la sesión.

En OpenClaw, un bucle es una sola ejecución serializada por sesión que emite eventos de ciclo de vida y de stream
mientras el modelo piensa, llama herramientas y transmite salida en streaming. Este documento explica cómo está
conectado ese bucle auténtico de extremo a extremo.

## Puntos de entrada

- RPC de Gateway: `agent` y `agent.wait`.
- CLI: comando `agent`.

## Cómo funciona (alto nivel)

1. El RPC `agent` valida los parámetros, resuelve la sesión (`sessionKey`/`sessionId`), persiste los metadatos de la sesión y devuelve `{ runId, acceptedAt }` inmediatamente.
2. `agentCommand` ejecuta el agente:
   - resuelve los valores predeterminados de modelo + thinking/verbose/trace
   - carga la instantánea de Skills
   - llama a `runEmbeddedPiAgent` (tiempo de ejecución de `pi-agent-core`)
   - emite **lifecycle end/error** si el bucle embebido no emite uno
3. `runEmbeddedPiAgent`:
   - serializa ejecuciones mediante colas por sesión y globales
   - resuelve el modelo + perfil de autenticación y construye la sesión de Pi
   - se suscribe a eventos de Pi y transmite deltas de asistente/herramienta
   - aplica el tiempo de espera -> aborta la ejecución si se supera
   - devuelve cargas útiles + metadatos de uso
4. `subscribeEmbeddedPiSession` conecta los eventos de `pi-agent-core` con el stream `agent` de OpenClaw:
   - eventos de herramientas => `stream: "tool"`
   - deltas del asistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera a **lifecycle end/error** para `runId`
   - devuelve `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Puesta en cola + concurrencia

- Las ejecuciones se serializan por clave de sesión (carril de sesión) y opcionalmente mediante un carril global.
- Esto evita carreras de herramientas/sesión y mantiene consistente el historial de la sesión.
- Los canales de mensajería pueden elegir modos de cola (collect/steer/followup) que alimentan este sistema de carriles.
  Consulta [Cola de comandos](/es/concepts/queue).
- Las escrituras de transcripciones también están protegidas por un bloqueo de escritura de sesión en el archivo de sesión. El bloqueo
  es consciente del proceso y está basado en archivos, por lo que detecta escritores que omiten la cola en proceso o provienen de
  otro proceso.
- Los bloqueos de escritura de sesión no son reentrantes de forma predeterminada. Si un helper anida intencionalmente la adquisición del
  mismo bloqueo mientras preserva un único escritor lógico, debe habilitarlo explícitamente con
  `allowReentrant: true`.

## Preparación de sesión + espacio de trabajo

- El espacio de trabajo se resuelve y se crea; las ejecuciones en sandbox pueden redirigirse a una raíz de espacio de trabajo en sandbox.
- Se cargan Skills (o se reutilizan desde una instantánea) y se inyectan en el entorno y el prompt.
- Los archivos de bootstrap/contexto se resuelven y se inyectan en el informe del prompt del sistema.
- Se adquiere un bloqueo de escritura de sesión; `SessionManager` se abre y se prepara antes del streaming. Cualquier
  ruta posterior de reescritura, Compaction o truncamiento de transcripción debe tomar el mismo bloqueo antes de abrir o
  mutar el archivo de transcripción.

## Ensamblaje del prompt + prompt del sistema

- El prompt del sistema se construye a partir del prompt base de OpenClaw, prompt de Skills, contexto bootstrap y sobrescrituras por ejecución.
- Se aplican límites específicos del modelo y tokens de reserva de Compaction.
- Consulta [Prompt del sistema](/es/concepts/system-prompt) para ver qué ve el modelo.

## Puntos de hook (dónde puedes interceptar)

OpenClaw tiene dos sistemas de hooks:

- **Hooks internos** (hooks de Gateway): scripts impulsados por eventos para comandos y eventos de ciclo de vida.
- **Hooks de Plugin**: puntos de extensión dentro del ciclo de vida del agente/herramienta y de la canalización de Gateway.

### Hooks internos (hooks de Gateway)

- **`agent:bootstrap`**: se ejecuta mientras se construyen archivos bootstrap antes de que el prompt del sistema se finalice.
  Úsalo para añadir/eliminar archivos de contexto bootstrap.
- **Hooks de comandos**: `/new`, `/reset`, `/stop` y otros eventos de comandos (consulta el documento de Hooks).

Consulta [Hooks](/es/automation/hooks) para ver configuración y ejemplos.

### Hooks de Plugin (ciclo de vida del agente + Gateway)

Estos se ejecutan dentro del bucle del agente o de la canalización de Gateway:

- **`before_model_resolve`**: se ejecuta antes de la sesión (sin `messages`) para sobrescribir de forma determinista provider/model antes de la resolución del modelo.
- **`before_prompt_build`**: se ejecuta después de cargar la sesión (con `messages`) para inyectar `prependContext`, `systemPrompt`, `prependSystemContext` o `appendSystemContext` antes del envío del prompt. Usa `prependContext` para texto dinámico por turno y los campos de contexto del sistema para orientación estable que deba ubicarse en el espacio del prompt del sistema.
- **`before_agent_start`**: hook heredado de compatibilidad que puede ejecutarse en cualquiera de las fases; prefiere los hooks explícitos anteriores.
- **`before_agent_reply`**: se ejecuta después de las acciones inline y antes de la llamada al LLM, permitiendo a un plugin reclamar el turno y devolver una respuesta sintética o silenciar el turno por completo.
- **`agent_end`**: inspecciona la lista final de mensajes y los metadatos de ejecución después de completarse.
- **`before_compaction` / `after_compaction`**: observan o anotan ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: interceptan parámetros/resultados de herramientas.
- **`before_install`**: inspecciona hallazgos integrados del escaneo y opcionalmente bloquea instalaciones de Skills o plugins.
- **`tool_result_persist`**: transforma sincrónicamente los resultados de herramientas antes de que se escriban en una transcripción de sesión propiedad de OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensajes entrantes + salientes.
- **`session_start` / `session_end`**: límites del ciclo de vida de la sesión.
- **`gateway_start` / `gateway_stop`**: eventos del ciclo de vida de Gateway.

Reglas de decisión de hooks para guardas de salida/herramientas:

- `before_tool_call`: `{ block: true }` es terminal y detiene manejadores de menor prioridad.
- `before_tool_call`: `{ block: false }` no hace nada y no borra un bloqueo previo.
- `before_install`: `{ block: true }` es terminal y detiene manejadores de menor prioridad.
- `before_install`: `{ block: false }` no hace nada y no borra un bloqueo previo.
- `message_sending`: `{ cancel: true }` es terminal y detiene manejadores de menor prioridad.
- `message_sending`: `{ cancel: false }` no hace nada y no borra una cancelación previa.

Consulta [hooks de Plugin](/es/plugins/hooks) para ver la API y los detalles de registro.

Los harnesses pueden adaptar estos hooks de forma distinta. El harness app-server de Codex mantiene
los hooks de Plugin de OpenClaw como contrato de compatibilidad para superficies reflejadas documentadas,
mientras que los hooks nativos de Codex siguen siendo un mecanismo separado de menor nivel de Codex.

## Streaming + respuestas parciales

- Los deltas del asistente se transmiten desde `pi-agent-core` y se emiten como eventos `assistant`.
- El block streaming puede emitir respuestas parciales ya sea en `text_end` o `message_end`.
- El streaming de razonamiento puede emitirse como un stream independiente o como respuestas de bloque.
- Consulta [Streaming](/es/concepts/streaming) para ver el comportamiento de fragmentación y respuestas de bloque.

## Ejecución de herramientas + herramientas de mensajería

- Los eventos de inicio/actualización/fin de herramientas se emiten en el stream `tool`.
- Los resultados de herramientas se sanean por tamaño y cargas útiles de imagen antes de registrarse/emitirse.
- Los envíos de herramientas de mensajería se rastrean para suprimir confirmaciones duplicadas del asistente.

## Modelado de la respuesta + supresión

- Las cargas útiles finales se ensamblan a partir de:
  - texto del asistente (y razonamiento opcional)
  - resúmenes inline de herramientas (cuando verbose + permitido)
  - texto de error del asistente cuando el modelo falla
- El token silencioso exacto `NO_REPLY` / `no_reply` se filtra de las
  cargas útiles salientes.
- Los duplicados de herramientas de mensajería se eliminan de la lista final de cargas útiles.
- Si no quedan cargas útiles renderizables y una herramienta falló, se emite
  una respuesta de respaldo de error de herramienta (a menos que una herramienta de mensajería ya haya enviado una respuesta visible para el usuario).

## Compaction + reintentos

- La Compaction automática emite eventos de stream `compaction` y puede activar un reintento.
- En un reintento, los búferes en memoria y los resúmenes de herramientas se reinician para evitar salida duplicada.
- Consulta [Compaction](/es/concepts/compaction) para ver la canalización de Compaction.

## Streams de eventos (hoy)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (y como respaldo por `agentCommand`)
- `assistant`: deltas en streaming desde `pi-agent-core`
- `tool`: eventos de herramientas en streaming desde `pi-agent-core`

## Manejo de canales de chat

- Los deltas del asistente se almacenan en búfer en mensajes de chat `delta`.
- Se emite un chat `final` en **lifecycle end/error**.

## Tiempos de espera

- Valor predeterminado de `agent.wait`: 30 s (solo la espera). El parámetro `timeoutMs` lo sobrescribe.
- Tiempo de ejecución del agente: valor predeterminado `agents.defaults.timeoutSeconds` de 172800 s (48 horas); aplicado en el temporizador de aborto de `runEmbeddedPiAgent`.
- Tiempo de espera inactivo del LLM: `agents.defaults.llm.idleTimeoutSeconds` aborta una solicitud al modelo cuando no llegan fragmentos de respuesta antes de la ventana de inactividad. Configúralo explícitamente para modelos locales lentos o providers de razonamiento/llamadas a herramientas; configúralo en 0 para desactivarlo. Si no está configurado, OpenClaw usa `agents.defaults.timeoutSeconds` cuando está configurado; de lo contrario, 120 s. Las ejecuciones activadas por cron sin tiempo de espera explícito de LLM o del agente desactivan el watchdog de inactividad y dependen del tiempo de espera externo de cron.

## Dónde pueden terminar antes de tiempo

- Tiempo de espera del agente (aborto)
- AbortSignal (cancelación)
- Desconexión de Gateway o tiempo de espera de RPC
- Tiempo de espera de `agent.wait` (solo espera, no detiene el agente)

## Relacionado

- [Herramientas](/es/tools) — herramientas del agente disponibles
- [Hooks](/es/automation/hooks) — scripts impulsados por eventos activados por eventos del ciclo de vida del agente
- [Compaction](/es/concepts/compaction) — cómo se resumen las conversaciones largas
- [Aprobaciones de Exec](/es/tools/exec-approvals) — puertas de aprobación para comandos de shell
- [Thinking](/es/tools/thinking) — configuración del nivel de thinking/razonamiento
