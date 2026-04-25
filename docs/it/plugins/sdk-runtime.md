---
read_when:
    - Devi chiamare gli helper core da un Plugin (TTS, STT, generazione immagini, ricerca web, subagent, Node)
    - Vuoi capire cosa espone `api.runtime`
    - Stai accedendo ad helper di configurazione, agente o media dal codice del Plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- gli helper runtime iniettati disponibili ai Plugin
title: Helper runtime dei Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Riferimento per l'oggetto `api.runtime` iniettato in ogni Plugin durante la
registrazione. Usa questi helper invece di importare direttamente gli interni dell'host.

<Tip>
  **Cerchi una guida pratica?** Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins)
  oppure [Plugin provider](/it/plugins/sdk-provider-plugins) per guide passo passo
  che mostrano questi helper nel loro contesto.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Namespace del runtime

### `api.runtime.agent`

Identità dell'agente, directory e gestione delle sessioni.

```typescript
// Risolvi la directory di lavoro dell'agente
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Risolvi il workspace dell'agente
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Ottieni l'identità dell'agente
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Ottieni il livello di thinking predefinito
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Ottieni il timeout dell'agente
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Assicurati che il workspace esista
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Esegui un turno di agente integrato
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Riassumi le ultime modifiche",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` è l'helper neutrale per avviare un normale
turno agente OpenClaw dal codice del Plugin. Usa la stessa risoluzione provider/modello e
la stessa selezione dell'harness agente dei reply attivati dal canale.

`runEmbeddedPiAgent(...)` resta come alias di compatibilità.

**Gli helper di archiviazione delle sessioni** si trovano sotto `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Costanti predefinite di modello e provider:

```typescript
const model = api.runtime.agent.defaults.model; // ad es. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // ad es. "anthropic"
```

### `api.runtime.subagent`

Avvia e gestisce esecuzioni di subagenti in background.

```typescript
// Avvia un'esecuzione di subagente
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Espandi questa query in ricerche di follow-up mirate.",
  provider: "openai", // override facoltativo
  model: "gpt-4.1-mini", // override facoltativo
  deliver: false,
});

// Attendi il completamento
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Leggi i messaggi della sessione
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Elimina una sessione
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Gli override del modello (`provider`/`model`) richiedono opt-in dell'operatore tramite
  `plugins.entries.<id>.subagent.allowModelOverride: true` nella configurazione.
  I Plugin non attendibili possono comunque eseguire subagenti, ma le richieste di override vengono rifiutate.
</Warning>

### `api.runtime.nodes`

Elenca i Node connessi e invoca un comando host Node dal codice del Plugin caricato da Gateway
o dai comandi CLI del Plugin. Usalo quando un Plugin possiede lavoro locale su un
dispositivo abbinato, ad esempio un bridge browser o audio su un altro Mac.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

All'interno del Gateway questo runtime è in-process. Nei comandi CLI del Plugin chiama
il Gateway configurato tramite RPC, così comandi come `openclaw googlemeet
recover-tab` possono ispezionare Node abbinati dal terminale. I comandi Node passano comunque attraverso il normale abbinamento Node del Gateway, le allowlist dei comandi e la gestione locale dei comandi sul Node.

### `api.runtime.taskFlow`

Collega un runtime TaskFlow a una chiave di sessione OpenClaw esistente o a un contesto di strumento attendibile,
poi crea e gestisce TaskFlow senza passare un owner a ogni chiamata.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Esaminare le nuove pull request",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Esamina PR #123",
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

Usa `bindSession({ sessionKey, requesterOrigin })` quando hai già una
chiave di sessione OpenClaw attendibile dal tuo layer di binding. Non effettuare binding da input utente grezzo.

### `api.runtime.tts`

Sintesi text-to-speech.

```typescript
// TTS standard
const clip = await api.runtime.tts.textToSpeech({
  text: "Ciao da OpenClaw",
  cfg: api.config,
});

// TTS ottimizzato per telefonia
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Ciao da OpenClaw",
  cfg: api.config,
});

// Elenca le voci disponibili
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Usa la configurazione core `messages.tts` e la selezione del provider. Restituisce un buffer audio PCM
più sample rate.

### `api.runtime.mediaUnderstanding`

Analisi di immagini, audio e video.

```typescript
// Descrivi un'immagine
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Trascrivi audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // facoltativo, per quando il MIME non può essere dedotto
});

// Descrivi un video
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Analisi generica di file
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Restituisce `{ text: undefined }` quando non viene prodotto output (ad es. input saltato).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità
  per `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Generazione di immagini.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Un robot che dipinge un tramonto",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Ricerca web.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Utility media di basso livello.

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

Caricamento e scrittura della configurazione.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utility a livello di sistema.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Sottoscrizioni agli eventi.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Logging.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Risoluzione auth di modelli e provider.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Risoluzione della directory di stato.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Factory degli strumenti memory e CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helper runtime specifici del canale (disponibili quando è caricato un Plugin di canale).

`api.runtime.channel.mentions` è la superficie condivisa dei criteri di menzione in ingresso per
i Plugin di canale inclusi che usano l'iniezione del runtime:

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

Helper di menzione disponibili:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` intenzionalmente non espone i vecchi
helper di compatibilità `resolveMentionGating*`. Preferisci il percorso normalizzato
`{ facts, policy }`.

## Memorizzare riferimenti runtime

Usa `createPluginRuntimeStore` per memorizzare il riferimento runtime da usare fuori
dalla callback `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "my-plugin runtime not initialized",
});

// Nel tuo punto di ingresso
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Esempio",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In altri file
export function getRuntime() {
  return store.getRuntime(); // genera un errore se non inizializzato
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // restituisce null se non inizializzato
}
```

Preferisci `pluginId` per l'identità del runtime-store. La forma di livello più basso `key` è
per casi non comuni in cui un Plugin ha intenzionalmente bisogno di più di uno slot runtime.

## Altri campi `api` di primo livello

Oltre a `api.runtime`, l'oggetto API fornisce anche:

| Campo                    | Tipo                      | Descrizione                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id del Plugin                                                                              |
| `api.name`               | `string`                  | Nome visualizzato del Plugin                                                               |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                       |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup prima dell'entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve un percorso relativo alla root del Plugin                                          |

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento ai sottopercorsi
- [Entry point SDK](/it/plugins/sdk-entrypoints) — opzioni `definePluginEntry`
- [Interni dei Plugin](/it/plugins/architecture) — modello di capacità e registry
