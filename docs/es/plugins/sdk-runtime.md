---
read_when:
    - Necesitas llamar a ayudantes del núcleo desde un Plugin (TTS, STT, generación de imágenes, búsqueda web, subagente, Nodes)
    - Quieres entender qué expone `api.runtime`
    - Estás accediendo a ayudantes de configuración, agente o multimedia desde código de Plugin
sidebarTitle: Runtime Helpers
summary: '`api.runtime`: los ayudantes de tiempo de ejecución inyectados disponibles para Plugins'
title: Ayudantes de tiempo de ejecución de Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Referencia del objeto `api.runtime` inyectado en cada Plugin durante el
registro. Usa estos ayudantes en lugar de importar directamente elementos internos del host.

<Tip>
  **¿Buscas una guía paso a paso?** Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins)
  o [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para guías paso a paso
  que muestran estos ayudantes en contexto.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Espacios de nombres de tiempo de ejecución

### `api.runtime.agent`

Identidad del agente, directorios y gestión de sesiones.

```typescript
// Resolve the agent's working directory
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Resolve agent workspace
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Get agent identity
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Get default thinking level
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Get agent timeout
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Ensure workspace exists
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Run an embedded agent turn
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` es el ayudante neutral para iniciar un turno normal de
agente de OpenClaw desde código de Plugin. Usa la misma resolución de proveedor/modelo y
la misma selección de arnés de agente que las respuestas activadas por canal.

`runEmbeddedPiAgent(...)` se mantiene como alias de compatibilidad.

Los **ayudantes del almacén de sesiones** están en `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Constantes predeterminadas de modelo y proveedor:

```typescript
const model = api.runtime.agent.defaults.model; // p. ej. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // p. ej. "anthropic"
```

### `api.runtime.subagent`

Inicia y gestiona ejecuciones de subagentes en segundo plano.

```typescript
// Start a subagent run
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // optional override
  model: "gpt-4.1-mini", // optional override
  deliver: false,
});

// Wait for completion
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Read session messages
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Delete a session
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Las anulaciones de modelo (`provider`/`model`) requieren adhesión del operador mediante
  `plugins.entries.<id>.subagent.allowModelOverride: true` en la configuración.
  Los Plugins no confiables aún pueden ejecutar subagentes, pero las solicitudes de anulación se rechazan.
</Warning>

### `api.runtime.nodes`

Lista los Nodes conectados e invoca un comando de host de Node desde código de Plugin
cargado por Gateway o desde comandos CLI del Plugin. Úsalo cuando un Plugin sea responsable de trabajo local en un
dispositivo emparejado, por ejemplo un puente de navegador o audio en otro Mac.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Dentro del Gateway, este tiempo de ejecución está en proceso. En los comandos CLI del Plugin, llama
al Gateway configurado mediante RPC, de modo que comandos como `openclaw googlemeet
recover-tab` pueden inspeccionar Nodes emparejados desde el terminal. Los comandos de Node siguen pasando
por el emparejamiento normal de Nodes del Gateway, las listas permitidas de comandos y el manejo local de comandos del Node.

### `api.runtime.taskFlow`

Vincula un tiempo de ejecución de TaskFlow a una clave de sesión existente de OpenClaw o a un contexto de herramienta de confianza,
y luego crea y gestiona TaskFlow sin pasar un propietario en cada llamada.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Review new pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Review PR #123",
  status: "running",
  startedAt: Date.now(),
});

const waiting = taskFlow.setWaiting({
  flowId: created.flowId,
  expectedRevision: created.revision,
  currentStep: "await-human-reply",
  waitJson: { kind: "reply", channel: "telegram" },
});
```

Usa `bindSession({ sessionKey, requesterOrigin })` cuando ya tengas una
clave de sesión de OpenClaw de confianza procedente de tu propia capa de vinculación. No la vincules a partir de entrada cruda
de usuario.

### `api.runtime.tts`

Síntesis de texto a voz.

```typescript
// Standard TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Telephony-optimized TTS
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// List available voices
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Usa la configuración central `messages.tts` y la selección de proveedor. Devuelve un
buffer de audio PCM + frecuencia de muestreo.

### `api.runtime.mediaUnderstanding`

Análisis de imagen, audio y vídeo.

```typescript
// Describe an image
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transcribe audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // optional, for when MIME cannot be inferred
});

// Describe a video
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Generic file analysis
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Devuelve `{ text: undefined }` cuando no se produce salida (p. ej., entrada omitida).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` se mantiene como alias de compatibilidad
  de `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Generación de imágenes.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Búsqueda web.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Utilidades multimedia de bajo nivel.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
  scale: 6, // 1-12
  marginModules: 4, // 0-16
});
const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
const tmpRoot = resolvePreferredOpenClawTmpDir();
const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
  tmpRoot,
  dirPrefix: "my-plugin-qr-",
  fileName: "qr.png",
});
```

### `api.runtime.config`

Carga y escritura de configuración.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utilidades a nivel de sistema.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Suscripciones a eventos.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Registro.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Resolución de autenticación de modelo y proveedor.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Resolución del directorio de estado.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Factorías de herramientas de memoria y CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Ayudantes de tiempo de ejecución específicos de canal (disponibles cuando se carga un Plugin de canal).

`api.runtime.channel.mentions` es la superficie compartida de política de menciones entrantes para
Plugins de canal incluidos que usan inyección en tiempo de ejecución:

```typescript
const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
  facts: {
    canDetectMention: true,
    wasMentioned: mentionMatch.matched,
    implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
      "reply_to_bot",
      isReplyToBot,
    ),
  },
  policy: {
    isGroup,
    requireMention,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});
```

Ayudantes de menciones disponibles:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` intencionalmente no expone los antiguos
ayudantes de compatibilidad `resolveMentionGating*`. Prefiere la ruta normalizada
`{ facts, policy }`.

## Almacenamiento de referencias de tiempo de ejecución

Usa `createPluginRuntimeStore` para almacenar la referencia de tiempo de ejecución y usarla fuera
de la devolución de llamada `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// In your entry point
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In other files
export function getRuntime() {
  return store.getRuntime(); // throws if not initialized
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // returns null if not initialized
}
```

Prefiere `pluginId` para la identidad del runtime-store. La forma de nivel inferior `key` es
para casos poco comunes en los que un Plugin necesita intencionadamente más de una ranura de tiempo de ejecución.

## Otros campos de nivel superior de `api`

Además de `api.runtime`, el objeto API también proporciona:

| Campo                    | Tipo                      | Descripción                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del Plugin                                                                               |
| `api.name`               | `string`                  | Nombre visible del Plugin                                                                   |
| `api.config`             | `OpenClawConfig`          | Instantánea de configuración actual (instantánea activa en memoria del tiempo de ejecución cuando está disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuración específica del Plugin desde `plugins.entries.<id>.config`                     |
| `api.logger`             | `PluginLogger`            | Logger con alcance (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modo de carga actual; `"setup-runtime"` es la ventana ligera de inicio/setup previa a la entrada completa |
| `api.resolvePath(input)` | `(string) => string`      | Resuelve una ruta relativa a la raíz del Plugin                                             |

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview) — referencia de subrutas
- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — opciones de `definePluginEntry`
- [Internos de Plugin](/es/plugins/architecture) — modelo de capacidades y registro
