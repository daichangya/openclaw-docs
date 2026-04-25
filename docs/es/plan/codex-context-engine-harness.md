---
read_when:
    - Estás integrando el comportamiento del ciclo de vida del motor de contexto en el arnés Codex
    - Necesitas que `lossless-claw` u otro Plugin del motor de contexto funcione con sesiones `codex/*` del arnés integrado
    - Estás comparando el comportamiento del contexto entre Pi integrado y el servidor de la app Codex
summary: Especificación para hacer que el arnés incluido del servidor de la app Codex respete los Plugins del motor de contexto de OpenClaw
title: Port del motor de contexto del arnés Codex
x-i18n:
    generated_at: "2026-04-25T13:50:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## Estado

Borrador de especificación de implementación.

## Objetivo

Hacer que el arnés incluido del servidor de la app Codex respete el mismo contrato
de ciclo de vida del motor de contexto de OpenClaw que ya respetan los turnos de Pi integrado.

Una sesión que use `agents.defaults.embeddedHarness.runtime: "codex"` o un
modelo `codex/*` debe seguir permitiendo que el Plugin del motor de contexto seleccionado, como
`lossless-claw`, controle el ensamblado del contexto, la ingesta posterior al turno, el mantenimiento y
la política de Compaction a nivel de OpenClaw en la medida en que lo permita el límite del servidor de la app Codex.

## No objetivos

- No reimplementar los componentes internos del servidor de la app Codex.
- No hacer que la compacción nativa de hilos de Codex produzca un resumen lossless-claw.
- No requerir que los modelos no Codex usen el arnés Codex.
- No cambiar el comportamiento de sesiones ACP/acpx. Esta especificación es para la
  ruta de arnés de agente integrado no ACP únicamente.
- No hacer que Plugins de terceros registren fábricas de extensiones del servidor de la app Codex;
  el límite de confianza existente del Plugin incluido permanece sin cambios.

## Arquitectura actual

El bucle de ejecución integrado resuelve el motor de contexto configurado una vez por ejecución antes de
seleccionar un arnés concreto de bajo nivel:

- `src/agents/pi-embedded-runner/run.ts`
  - inicializa Plugins del motor de contexto
  - llama a `resolveContextEngine(params.config)`
  - pasa `contextEngine` y `contextTokenBudget` a
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega al arnés de agente seleccionado:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

El arnés del servidor de la app Codex está registrado por el Plugin Codex incluido:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

La implementación del arnés Codex recibe los mismos `EmbeddedRunAttemptParams`
que los intentos respaldados por Pi:

- `extensions/codex/src/app-server/run-attempt.ts`

Eso significa que el punto de hook requerido está en código controlado por OpenClaw. El límite
externo es el propio protocolo del servidor de la app Codex: OpenClaw puede controlar lo que
envía a `thread/start`, `thread/resume` y `turn/start`, y puede observar
notificaciones, pero no puede cambiar el almacén interno de hilos de Codex ni su compactador nativo.

## Brecha actual

Los intentos de Pi integrado llaman directamente al ciclo de vida del motor de contexto:

- bootstrap/mantenimiento antes del intento
- assemble antes de la llamada al modelo
- afterTurn o ingest después del intento
- mantenimiento después de un turno exitoso
- Compaction del motor de contexto para motores que son propietarios de la compacción

Código relevante de Pi:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Actualmente, los intentos del servidor de la app Codex ejecutan hooks genéricos del arnés de agente y reflejan
la transcripción, pero no llaman a `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` ni
`params.contextEngine.maintain`.

Código relevante de Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamiento deseado

Para los turnos del arnés Codex, OpenClaw debe preservar este ciclo de vida:

1. Leer la transcripción reflejada de la sesión de OpenClaw.
2. Hacer bootstrap del motor de contexto activo cuando exista un archivo de sesión previo.
3. Ejecutar mantenimiento de bootstrap cuando esté disponible.
4. Ensamblar el contexto usando el motor de contexto activo.
5. Convertir el contexto ensamblado en entradas compatibles con Codex.
6. Iniciar o reanudar el hilo de Codex con instrucciones de developer que incluyan cualquier
   `systemPromptAddition` del motor de contexto.
7. Iniciar el turno de Codex con el prompt orientado al usuario ya ensamblado.
8. Reflejar el resultado de Codex de vuelta en la transcripción de OpenClaw.
9. Llamar a `afterTurn` si está implementado; de lo contrario, `ingestBatch`/`ingest`, usando la instantánea de transcripción reflejada.
10. Ejecutar mantenimiento del turno después de turnos exitosos no abortados.
11. Preservar las señales de compacción nativas de Codex y los hooks de Compaction de OpenClaw.

## Restricciones de diseño

### El servidor de la app Codex sigue siendo canónico para el estado nativo del hilo

Codex es propietario de su hilo nativo y de cualquier historial interno ampliado. OpenClaw no debe
intentar mutar el historial interno del servidor de la app excepto mediante llamadas de protocolo compatibles.

La transcripción reflejada de OpenClaw sigue siendo la fuente para las funciones de OpenClaw:

- historial del chat
- búsqueda
- contabilidad de `/new` y `/reset`
- futuro cambio de modelo o arnés
- estado del Plugin del motor de contexto

### El ensamblado del motor de contexto debe proyectarse en entradas de Codex

La interfaz del motor de contexto devuelve `AgentMessage[]` de OpenClaw, no un parche de hilo de Codex. `turn/start` del servidor de la app Codex acepta una entrada de usuario actual, mientras que
`thread/start` y `thread/resume` aceptan instrucciones de developer.

Por lo tanto, la implementación necesita una capa de proyección. La primera versión segura
debe evitar fingir que puede reemplazar el historial interno de Codex. Debe inyectar el
contexto ensamblado como material determinista de prompt/instrucciones de developer alrededor
del turno actual.

### La estabilidad de la caché de prompts importa

Para motores como lossless-claw, el contexto ensamblado debe ser determinista cuando las entradas no cambian. No agregues marcas de tiempo, ids aleatorios ni ordenamientos no deterministas al texto de contexto generado.

### La semántica de fallback de Pi no cambia

La selección de arnés permanece como está:

- `runtime: "pi"` fuerza Pi
- `runtime: "codex"` selecciona el arnés Codex registrado
- `runtime: "auto"` permite que los arneses de Plugins reclamen proveedores compatibles
- `fallback: "none"` desactiva el fallback a Pi cuando ningún arnés de Plugin coincide

Este trabajo cambia lo que ocurre después de seleccionar el arnés Codex.

## Plan de implementación

### 1. Exportar o reubicar helpers reutilizables del intento del motor de contexto

Hoy, los helpers reutilizables del ciclo de vida viven bajo el runner de Pi:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex no debería importar desde una ruta de implementación cuyo nombre implique Pi si
podemos evitarlo.

Crea un módulo neutral al arnés, por ejemplo:

- `src/agents/harness/context-engine-lifecycle.ts`

Mueve o reexporta:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un pequeño wrapper alrededor de `runContextEngineMaintenance`

Mantén funcionando las importaciones de Pi ya sea reexportando desde los archivos antiguos o actualizando los call sites de Pi en el mismo PR.

Los nombres neutrales de los helpers no deben mencionar Pi.

Nombres sugeridos:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Agregar un helper de proyección de contexto de Codex

Agrega un nuevo módulo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilidades:

- Aceptar `AgentMessage[]` ensamblados, el historial reflejado original y el
  prompt actual.
- Determinar qué contexto pertenece a instrucciones de developer frente a la entrada actual del usuario.
- Preservar el prompt actual del usuario como la solicitud accionable final.
- Renderizar mensajes previos en un formato estable y explícito.
- Evitar metadatos volátiles.

API propuesta:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Primera proyección recomendada:

- Poner `systemPromptAddition` en instrucciones de developer.
- Poner el contexto de transcripción ensamblado antes del prompt actual en `promptText`.
- Etiquetarlo claramente como contexto ensamblado por OpenClaw.
- Mantener el prompt actual al final.
- Excluir el prompt actual del usuario si está duplicado al final.

Forma de prompt de ejemplo:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Esto es menos elegante que una cirugía nativa del historial de Codex, pero es implementable
dentro de OpenClaw y preserva la semántica del motor de contexto.

Mejora futura: si el servidor de la app Codex expone un protocolo para reemplazar o
suplementar el historial del hilo, intercambia esta capa de proyección para usar esa API.

### 3. Integrar bootstrap antes del inicio del hilo Codex

En `extensions/codex/src/app-server/run-attempt.ts`:

- Leer el historial reflejado de la sesión como hoy.
- Determinar si el archivo de sesión existía antes de esta ejecución. Preferiblemente mediante un helper
  que compruebe `fs.stat(params.sessionFile)` antes de las escrituras de reflejo.
- Abrir un `SessionManager` o usar un adaptador reducido de session manager si el helper lo
  requiere.
- Llamar al helper neutral de bootstrap cuando exista `params.contextEngine`.

Pseudoflujo:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Usa la misma convención de `sessionKey` que el puente de herramientas Codex y el reflejo de transcripción. Hoy Codex calcula `sandboxSessionKey` a partir de `params.sessionKey` o
`params.sessionId`; úsalo de forma consistente, a menos que haya una razón para preservar el valor bruto de `params.sessionKey`.

### 4. Integrar assemble antes de `thread/start` / `thread/resume` y `turn/start`

En `runCodexAppServerAttempt`:

1. Construir primero las herramientas dinámicas, para que el motor de contexto vea los nombres reales de herramientas disponibles.
2. Leer el historial reflejado de la sesión.
3. Ejecutar `assemble(...)` del motor de contexto cuando exista `params.contextEngine`.
4. Proyectar el resultado ensamblado en:
   - adición de instrucciones de developer
   - texto del prompt para `turn/start`

La llamada de hook existente:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

debe volverse consciente del contexto:

1. calcular instrucciones base de developer con `buildDeveloperInstructions(params)`
2. aplicar ensamblado/proyección del motor de contexto
3. ejecutar `before_prompt_build` con el prompt/instrucciones de developer proyectados

Este orden permite que los hooks genéricos de prompt vean el mismo prompt que recibirá Codex. Si
necesitamos paridad estricta con Pi, ejecuta el ensamblado del motor de contexto antes de la composición de hooks,
porque Pi aplica `systemPromptAddition` del motor de contexto al prompt final del sistema después de su pipeline de prompts. La invariante importante es que tanto el motor de contexto como los hooks obtengan un orden determinista y documentado.

Orden recomendado para la primera implementación:

1. `buildDeveloperInstructions(params)`
2. `assemble()` del motor de contexto
3. anexar/anteponer `systemPromptAddition` a las instrucciones de developer
4. proyectar mensajes ensamblados en el texto del prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. pasar las instrucciones finales de developer a `startOrResumeThread(...)`
7. pasar el texto final del prompt a `buildTurnStartParams(...)`

La especificación debe codificarse en tests para que futuros cambios no reordenen esto por accidente.

### 5. Preservar formato estable para la caché de prompts

El helper de proyección debe producir salida estable a nivel de bytes para entradas idénticas:

- orden estable de mensajes
- etiquetas de rol estables
- sin marcas de tiempo generadas
- sin fugas del orden de claves de objetos
- sin delimitadores aleatorios
- sin ids por ejecución

Usa delimitadores fijos y secciones explícitas.

### 6. Integrar el post-turno después del reflejo de la transcripción

`CodexAppServerEventProjector` de Codex construye una `messagesSnapshot` local para el
turno actual. `mirrorTranscriptBestEffort(...)` escribe esa instantánea en el reflejo de transcripción de OpenClaw.

Después de que el reflejo tenga éxito o falle, llama al finalizador del motor de contexto con la
mejor instantánea de mensajes disponible:

- Prefiere el contexto completo de la sesión reflejada después de la escritura, porque `afterTurn`
  espera la instantánea de la sesión, no solo el turno actual.
- Usa como respaldo `historyMessages + result.messagesSnapshot` si el archivo de sesión
  no puede volver a abrirse.

Pseudoflujo:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Si el reflejo falla, aun así llama a `afterTurn` con la instantánea de respaldo, pero registra
que el motor de contexto está ingiriendo desde datos de turno de respaldo.

### 7. Normalizar uso y contexto de runtime de caché de prompts

Los resultados de Codex incluyen uso normalizado desde notificaciones de tokens del servidor de la app cuando
está disponible. Pasa ese uso al contexto de runtime del motor de contexto.

Si el servidor de la app Codex finalmente expone detalles de lectura/escritura de caché, mapéalos a
`ContextEnginePromptCacheInfo`. Hasta entonces, omite `promptCache` en lugar de
inventar ceros.

### 8. Política de Compaction

Hay dos sistemas de compacción:

1. `compact()` del motor de contexto de OpenClaw
2. `thread/compact/start` nativo del servidor de la app Codex

No los mezcles silenciosamente.

#### `/compact` y Compaction explícita de OpenClaw

Cuando el motor de contexto seleccionado tiene `info.ownsCompaction === true`, la
Compaction explícita de OpenClaw debe preferir el resultado de `compact()` del motor de contexto para
el reflejo de transcripción y el estado del Plugin de OpenClaw.

Cuando el arnés Codex seleccionado tiene un enlace nativo de hilo, además podemos
solicitar la compacción nativa de Codex para mantener saludable el hilo del servidor de la app, pero esto
debe informarse como una acción de backend separada en detalles.

Comportamiento recomendado:

- Si `contextEngine.info.ownsCompaction === true`:
  - llama primero a `compact()` del motor de contexto
  - luego llama en modo best-effort a la compacción nativa de Codex cuando exista un enlace de hilo
  - devuelve el resultado del motor de contexto como resultado primario
  - incluye el estado de compacción nativa de Codex en `details.codexNativeCompaction`
- Si el motor de contexto activo no es propietario de la Compaction:
  - conserva el comportamiento actual de compacción nativa de Codex

Esto probablemente requiera cambiar `extensions/codex/src/app-server/compact.ts` o
envolverlo desde la ruta genérica de Compaction, según dónde se invoque
`maybeCompactAgentHarnessSession(...)`.

#### Eventos nativos `contextCompaction` de Codex dentro del turno

Codex puede emitir eventos de elemento `contextCompaction` durante un turno. Conserva la
emisión actual de hooks antes/después de la compacción en `event-projector.ts`, pero no trates
eso como una compacción completada del motor de contexto.

Para motores que son propietarios de la Compaction, emite un diagnóstico explícito cuando
Codex realice compacción nativa de todos modos:

- nombre de stream/evento: el stream existente `compaction` es aceptable
- detalles: `{ backend: "codex-app-server", ownsCompaction: true }`

Esto hace que la separación sea auditable.

### 9. Comportamiento de reinicio y enlace de sesión

El `reset(...)` existente del arnés Codex limpia el enlace del servidor de la app Codex del
archivo de sesión de OpenClaw. Conserva ese comportamiento.

Asegúrate también de que la limpieza del estado del motor de contexto siga ocurriendo mediante las rutas existentes del ciclo de vida de sesión de OpenClaw. No agregues limpieza específica de Codex a menos que el
ciclo de vida actual del motor de contexto omita eventos de reset/delete para todos los arneses.

### 10. Manejo de errores

Sigue la semántica de Pi:

- los fallos de bootstrap advierten y continúan
- los fallos de assemble advierten y usan como respaldo mensajes/prompts de la canalización no ensamblada
- los fallos de afterTurn/ingest advierten y marcan la finalización posterior al turno como fallida
- el mantenimiento se ejecuta solo después de turnos exitosos, no abortados y sin yield
- los errores de Compaction no deben reintentarse como prompts nuevos

Adiciones específicas de Codex:

- Si falla la proyección de contexto, advierte y usa como respaldo el prompt original.
- Si falla el reflejo de transcripción, intenta igualmente la finalización del motor de contexto con
  mensajes de respaldo.
- Si la compacción nativa de Codex falla después de que la compacción del motor de contexto tenga éxito,
  no falles toda la Compaction de OpenClaw cuando el motor de contexto sea primario.

## Plan de pruebas

### Pruebas unitarias

Agrega pruebas en `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex llama a `bootstrap` cuando existe un archivo de sesión.
   - Codex llama a `assemble` con mensajes reflejados, presupuesto de tokens, nombres de herramientas,
     modo de citas, id del modelo y prompt.
   - `systemPromptAddition` se incluye en las instrucciones de developer.
   - Los mensajes ensamblados se proyectan en el prompt antes de la solicitud actual.
   - Codex llama a `afterTurn` después del reflejo de la transcripción.
   - Sin `afterTurn`, Codex llama a `ingestBatch` o a `ingest` por mensaje.
   - El mantenimiento del turno se ejecuta después de turnos exitosos.
   - El mantenimiento del turno no se ejecuta en error de prompt, aborto o aborto por yield.

2. `context-engine-projection.test.ts`
   - salida estable para entradas idénticas
   - sin prompt actual duplicado cuando el historial ensamblado lo incluye
   - maneja historial vacío
   - preserva el orden de roles
   - incluye la adición de prompt del sistema solo en instrucciones de developer

3. `compact.context-engine.test.ts`
   - el resultado primario del motor de contexto propietario tiene prioridad
   - el estado de compacción nativa de Codex aparece en detalles cuando también se intenta
   - un fallo nativo de Codex no hace fallar la compacción del motor de contexto propietario
   - un motor de contexto no propietario conserva el comportamiento actual de compacción nativa

### Pruebas existentes a actualizar

- `extensions/codex/src/app-server/run-attempt.test.ts` si existe; de lo contrario,
  las pruebas de ejecución del servidor de la app Codex más cercanas.
- `extensions/codex/src/app-server/event-projector.test.ts` solo si cambian los
  detalles de los eventos de compacción.
- `src/agents/harness/selection.test.ts` no debería necesitar cambios a menos que cambie el
  comportamiento de configuración; debería permanecer estable.
- Las pruebas del motor de contexto de Pi deben seguir pasando sin cambios.

### Pruebas de integración / en vivo

Agrega o amplía pruebas smoke en vivo del arnés Codex:

- configura `plugins.slots.contextEngine` en un motor de prueba
- configura `agents.defaults.model` en un modelo `codex/*`
- configura `agents.defaults.embeddedHarness.runtime = "codex"`
- afirma que el motor de prueba observó:
  - bootstrap
  - assemble
  - afterTurn o ingest
  - mantenimiento

Evita requerir `lossless-claw` en las pruebas del núcleo de OpenClaw. Usa un motor de contexto falso pequeño dentro del repositorio.

## Observabilidad

Agrega logs de depuración alrededor de las llamadas del ciclo de vida del motor de contexto de Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` con motivo
- `codex native compaction completed alongside context-engine compaction`

Evita registrar prompts completos o contenidos de transcripción.

Agrega campos estructurados cuando sea útil:

- `sessionId`
- `sessionKey` redactado u omitido según la práctica actual de logging
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migración / compatibilidad

Esto debe ser compatible hacia atrás:

- Si no hay motor de contexto configurado, el comportamiento heredado del motor de contexto debe ser
  equivalente al comportamiento actual del arnés Codex.
- Si falla `assemble` del motor de contexto, Codex debe continuar con la ruta original
  del prompt.
- Los enlaces de hilos Codex existentes deben seguir siendo válidos.
- El fingerprinting dinámico de herramientas no debe incluir salida del motor de contexto; de lo contrario,
  cada cambio de contexto podría forzar un nuevo hilo Codex. Solo el catálogo de herramientas
  debe afectar la huella dinámica de herramientas.

## Preguntas abiertas

1. ¿Debe inyectarse el contexto ensamblado completamente en el prompt del usuario, completamente
   en instrucciones de developer o dividido?

   Recomendación: dividido. Pon `systemPromptAddition` en instrucciones de developer;
   pon el contexto de transcripción ensamblado en el wrapper del prompt del usuario. Esto coincide mejor
   con el protocolo actual de Codex sin mutar el historial nativo del hilo.

2. ¿Debe deshabilitarse la compacción nativa de Codex cuando un motor de contexto es propietario de la
   Compaction?

   Recomendación: no, al menos inicialmente. La compacción nativa de Codex aún puede ser
   necesaria para mantener vivo el hilo del servidor de la app. Pero debe informarse como
   compacción nativa de Codex, no como compacción del motor de contexto.

3. ¿Debe ejecutarse `before_prompt_build` antes o después del ensamblado del motor de contexto?

   Recomendación: después de la proyección del motor de contexto para Codex, para que los hooks
   genéricos del arnés vean el prompt/instrucciones de developer reales que recibirá Codex. Si la paridad con Pi
   requiere lo contrario, codifica el orden elegido en pruebas y documéntalo
   aquí.

4. ¿Puede el servidor de la app Codex aceptar en el futuro una sobrescritura estructurada de contexto/historial?

   Desconocido. Si puede, reemplaza la capa de proyección de texto por ese protocolo y
   mantén sin cambios las llamadas del ciclo de vida.

## Criterios de aceptación

- Un turno de arnés integrado `codex/*` invoca el ciclo de vida `assemble`
  del motor de contexto seleccionado.
- Un `systemPromptAddition` del motor de contexto afecta las instrucciones de developer de Codex.
- El contexto ensamblado afecta la entrada del turno de Codex de forma determinista.
- Los turnos exitosos de Codex llaman a `afterTurn` o al respaldo de ingest.
- Los turnos exitosos de Codex ejecutan mantenimiento de turno del motor de contexto.
- Los turnos fallidos/abortados/abortados por yield no ejecutan mantenimiento de turno.
- La Compaction propiedad del motor de contexto sigue siendo primaria para el estado de OpenClaw/Plugin.
- La compacción nativa de Codex sigue siendo auditable como comportamiento nativo de Codex.
- El comportamiento existente del motor de contexto de Pi no cambia.
- El comportamiento existente del arnés Codex no cambia cuando no se selecciona un motor de contexto no heredado
  o cuando falla el ensamblado.
