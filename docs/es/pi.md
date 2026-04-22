---
read_when:
    - Comprender el diseño de integración del SDK de Pi en OpenClaw
    - Modificar el ciclo de vida de la sesión del agente, las herramientas o la conexión con el proveedor para Pi
summary: Arquitectura de la integración del agente Pi integrado de OpenClaw y ciclo de vida de la sesión
title: Arquitectura de integración de Pi
x-i18n:
    generated_at: "2026-04-22T04:23:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# Arquitectura de integración de Pi

Este documento describe cómo OpenClaw se integra con [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) y sus paquetes hermanos (`pi-ai`, `pi-agent-core`, `pi-tui`) para impulsar sus capacidades de agente de IA.

## Resumen

OpenClaw usa el SDK de Pi para integrar un agente de programación con IA dentro de su arquitectura de gateway de mensajería. En lugar de iniciar Pi como un subproceso o usar modo RPC, OpenClaw importa e instancia directamente el `AgentSession` de Pi mediante `createAgentSession()`. Este enfoque integrado proporciona:

- Control total sobre el ciclo de vida de la sesión y el manejo de eventos
- Inyección de herramientas personalizadas (mensajería, sandbox, acciones específicas del canal)
- Personalización del prompt del sistema por canal/contexto
- Persistencia de sesión con soporte de branching/Compaction
- Rotación de perfiles de autenticación multicuenta con failover
- Cambio de modelo independiente del proveedor

## Dependencias de paquetes

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Paquete          | Propósito                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`          | Abstracciones principales de LLM: `Model`, `streamSimple`, tipos de mensaje, API de proveedores       |
| `pi-agent-core`  | Bucle del agente, ejecución de herramientas, tipos `AgentMessage`                                      |
| `pi-coding-agent` | SDK de alto nivel: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, herramientas integradas |
| `pi-tui`         | Componentes de interfaz de terminal (usados en el modo TUI local de OpenClaw)                          |

## Estructura de archivos

```
src/agents/
├── pi-embedded-runner.ts          # Reexportaciones de pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Punto de entrada principal: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Lógica de intento único con configuración de sesión
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Construir cargas útiles de respuesta a partir de resultados de ejecución
│   │   ├── images.ts              # Inyección de imágenes del modelo de visión
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Detección de errores de cancelación
│   ├── cache-ttl.ts               # Seguimiento de TTL de caché para poda de contexto
│   ├── compact.ts                 # Lógica manual/automática de Compaction
│   ├── extensions.ts              # Cargar extensiones de Pi para ejecuciones integradas
│   ├── extra-params.ts            # Parámetros de streaming específicos del proveedor
│   ├── google.ts                  # Correcciones de orden de turnos de Google/Gemini
│   ├── history.ts                 # Limitación de historial (DM frente a grupo)
│   ├── lanes.ts                   # Carriles de comandos de sesión/globales
│   ├── logger.ts                  # Logger del subsistema
│   ├── model.ts                   # Resolución de modelo mediante ModelRegistry
│   ├── runs.ts                    # Seguimiento de ejecuciones activas, cancelación, cola
│   ├── sandbox-info.ts            # Información de sandbox para el prompt del sistema
│   ├── session-manager-cache.ts   # Almacenamiento en caché de instancias SessionManager
│   ├── session-manager-init.ts    # Inicialización de archivos de sesión
│   ├── system-prompt.ts           # Constructor del prompt del sistema
│   ├── tool-split.ts              # Dividir herramientas en builtIn y custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapeo de ThinkLevel, descripción de errores
├── pi-embedded-subscribe.ts       # Suscripción/despacho de eventos de sesión
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fábrica de manejadores de eventos
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Fragmentación de respuestas por bloques en streaming
├── pi-embedded-messaging.ts       # Seguimiento de envíos de la herramienta de mensajería
├── pi-embedded-helpers.ts         # Clasificación de errores, validación de turnos
├── pi-embedded-helpers/           # Módulos auxiliares
├── pi-embedded-utils.ts           # Utilidades de formato
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Envoltura de AbortSignal para herramientas
├── pi-tools.policy.ts             # Política de allowlist/denylist de herramientas
├── pi-tools.read.ts               # Personalizaciones de la herramienta de lectura
├── pi-tools.schema.ts             # Normalización de esquemas de herramientas
├── pi-tools.types.ts              # Alias de tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptador de AgentTool -> ToolDefinition
├── pi-settings.ts                 # Sobrescrituras de configuración
├── pi-hooks/                      # Hooks personalizados de Pi
│   ├── compaction-safeguard.ts    # Extensión de protección
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extensión de poda de contexto por TTL de caché
│   └── context-pruning/
├── model-auth.ts                  # Resolución de perfiles de autenticación
├── auth-profiles.ts               # Almacén de perfiles, enfriamiento, failover
├── model-selection.ts             # Resolución de modelo predeterminado
├── models-config.ts               # Generación de models.json
├── model-catalog.ts               # Caché del catálogo de modelos
├── context-window-guard.ts        # Validación de ventana de contexto
├── failover-error.ts              # Clase FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolución de parámetros del prompt del sistema
├── system-prompt-report.ts        # Generación de informes de depuración
├── tool-summaries.ts              # Resúmenes de descripciones de herramientas
├── tool-policy.ts                 # Resolución de política de herramientas
├── transcript-policy.ts           # Política de validación de transcripción
├── skills.ts                      # Construcción de instantáneas/prompts de Skills
├── skills/                        # Subsistema de Skills
├── sandbox.ts                     # Resolución de contexto de sandbox
├── sandbox/                       # Subsistema de sandbox
├── channel-tools.ts               # Inyección de herramientas específicas del canal
├── openclaw-tools.ts              # Herramientas específicas de OpenClaw
├── bash-tools.ts                  # Herramientas de exec/proceso
├── apply-patch.ts                 # Herramienta apply_patch (OpenAI)
├── tools/                         # Implementaciones de herramientas individuales
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Los runtimes de acciones de mensajes específicas del canal ahora viven en los directorios de extensiones propiedad del Plugin, en lugar de estar bajo `src/agents/tools`, por ejemplo:

- los archivos de runtime de acciones del Plugin de Discord
- el archivo de runtime de acciones del Plugin de Slack
- el archivo de runtime de acciones del Plugin de Telegram
- el archivo de runtime de acciones del Plugin de WhatsApp

## Flujo principal de integración

### 1. Ejecutar un agente integrado

El punto de entrada principal es `runEmbeddedPiAgent()` en `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Creación de sesión

Dentro de `runEmbeddedAttempt()` (llamado por `runEmbeddedPiAgent()`), se usa el SDK de Pi:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Suscripción a eventos

`subscribeEmbeddedPiSession()` se suscribe a los eventos `AgentSession` de Pi:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Los eventos gestionados incluyen:

- `message_start` / `message_end` / `message_update` (texto/pensamiento en streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Después de la configuración, se envía el prompt a la sesión:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

El SDK gestiona el bucle completo del agente: envío al LLM, ejecución de llamadas a herramientas y streaming de respuestas.

La inyección de imágenes es local al prompt: OpenClaw carga referencias de imágenes del prompt actual y las pasa mediante `images` solo para ese turno. No vuelve a analizar turnos anteriores del historial para reinyectar cargas útiles de imagen.

## Arquitectura de herramientas

### Canalización de herramientas

1. **Herramientas base**: `codingTools` de Pi (`read`, `bash`, `edit`, `write`)
2. **Reemplazos personalizados**: OpenClaw reemplaza `bash` con `exec`/`process`, personaliza `read`/`edit`/`write` para sandbox
3. **Herramientas de OpenClaw**: mensajería, navegador, canvas, sesiones, Cron, Gateway, etc.
4. **Herramientas de canal**: herramientas de acción específicas de Discord/Telegram/Slack/WhatsApp
5. **Filtrado por políticas**: herramientas filtradas por perfil, proveedor, agente, grupo y políticas de sandbox
6. **Normalización de esquema**: esquemas limpiados para peculiaridades de Gemini/OpenAI
7. **Envoltura de AbortSignal**: herramientas envueltas para respetar señales de cancelación

### Adaptador de definición de herramientas

El `AgentTool` de pi-agent-core tiene una firma `execute` diferente de la `ToolDefinition` de pi-coding-agent. El adaptador en `pi-tool-definition-adapter.ts` conecta ambos:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Estrategia de división de herramientas

`splitSdkTools()` pasa todas las herramientas mediante `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Esto garantiza que el filtrado por políticas de OpenClaw, la integración con sandbox y el conjunto ampliado de herramientas se mantengan consistentes entre proveedores.

## Construcción del prompt del sistema

El prompt del sistema se construye en `buildAgentSystemPrompt()` (`system-prompt.ts`). Ensambla un prompt completo con secciones que incluyen Tooling, estilo de llamadas a herramientas, barandillas de seguridad, referencia de CLI de OpenClaw, Skills, docs, espacio de trabajo, sandbox, mensajería, etiquetas de respuesta, voz, respuestas silenciosas, Heartbeats, metadatos de runtime, además de Memory y Reactions cuando están activados, y archivos de contexto opcionales y contenido adicional del prompt del sistema. Las secciones se recortan para el modo de prompt mínimo usado por subagentes.

El prompt se aplica después de la creación de la sesión mediante `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestión de sesiones

### Archivos de sesión

Las sesiones son archivos JSONL con estructura de árbol (enlace `id`/`parentId`). El `SessionManager` de Pi maneja la persistencia:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw envuelve esto con `guardSessionManager()` para seguridad en los resultados de herramientas.

### Caché de sesiones

`session-manager-cache.ts` almacena en caché instancias de SessionManager para evitar analizar archivos repetidamente:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitación del historial

`limitHistoryTurns()` recorta el historial de conversación según el tipo de canal (DM frente a grupo).

### Compaction

La Compaction automática se activa cuando hay desbordamiento de contexto. Las firmas comunes de desbordamiento incluyen `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` y `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` maneja la Compaction manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticación y resolución de modelos

### Perfiles de autenticación

OpenClaw mantiene un almacén de perfiles de autenticación con múltiples claves API por proveedor:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Los perfiles rotan ante fallos con seguimiento de enfriamiento:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolución de modelos

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` activa el fallback de modelo cuando está configurado:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Extensiones de Pi

OpenClaw carga extensiones personalizadas de Pi para comportamientos especializados:

### Protección de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` añade barandillas a Compaction, incluido presupuesto adaptativo de tokens más resúmenes de fallos de herramientas y operaciones sobre archivos:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Poda de contexto

`src/agents/pi-hooks/context-pruning.ts` implementa poda de contexto basada en TTL de caché:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Streaming y respuestas por bloques

### Fragmentación de bloques

`EmbeddedBlockChunker` gestiona el texto en streaming en bloques de respuesta discretos:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Eliminación de etiquetas de pensamiento/final

La salida en streaming se procesa para eliminar bloques `<think>`/`<thinking>` y extraer contenido `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Directivas de respuesta

Las directivas de respuesta como `[[media:url]]`, `[[voice]]`, `[[reply:id]]` se analizan y extraen:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Manejo de errores

### Clasificación de errores

`pi-embedded-helpers.ts` clasifica los errores para su manejo adecuado:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback de nivel de pensamiento

Si un nivel de pensamiento no es compatible, se usa un fallback:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Integración con sandbox

Cuando el modo sandbox está activado, las herramientas y rutas se restringen:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## Manejo específico por proveedor

### Anthropic

- Limpieza de cadenas mágicas de rechazo
- Validación de turnos para roles consecutivos
- Validación estricta ascendente de parámetros de herramientas de Pi

### Google/Gemini

- Saneamiento de esquemas de herramientas propiedad del Plugin

### OpenAI

- Herramienta `apply_patch` para modelos Codex
- Manejo de degradación del nivel de pensamiento

## Integración con TUI

OpenClaw también tiene un modo TUI local que usa directamente componentes de pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Esto proporciona una experiencia interactiva de terminal similar al modo nativo de Pi.

## Diferencias clave frente a Pi CLI

| Aspecto         | Pi CLI                  | OpenClaw integrado                                                                                |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Invocación      | Comando `pi` / RPC      | SDK mediante `createAgentSession()`                                                               |
| Herramientas    | Herramientas de programación predeterminadas | Suite de herramientas personalizadas de OpenClaw                                      |
| Prompt del sistema | `AGENTS.md` + prompts | Dinámico por canal/contexto                                                                       |
| Almacenamiento de sesiones | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (o `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticación   | Credencial única        | Multiperfil con rotación                                                                          |
| Extensiones     | Cargadas desde disco    | Programáticas + rutas en disco                                                                    |
| Manejo de eventos | Renderizado TUI       | Basado en callbacks (`onBlockReply`, etc.)                                                        |

## Consideraciones futuras

Áreas para posible retrabajo:

1. **Alineación de firmas de herramientas**: actualmente se adaptan firmas entre pi-agent-core y pi-coding-agent
2. **Envoltura de session manager**: `guardSessionManager` añade seguridad pero incrementa la complejidad
3. **Carga de extensiones**: podría usar `ResourceLoader` de Pi más directamente
4. **Complejidad del manejador de streaming**: `subscribeEmbeddedPiSession` ha crecido mucho
5. **Particularidades de proveedores**: hay muchas rutas de código específicas por proveedor que Pi podría manejar potencialmente

## Pruebas

La cobertura de integración de Pi abarca estas suites:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

En vivo/opcional:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (activar `OPENCLAW_LIVE_TEST=1`)

Para los comandos de ejecución actuales, consulta [Flujo de desarrollo de Pi](/es/pi-dev).
