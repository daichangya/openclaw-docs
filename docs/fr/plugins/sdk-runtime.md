---
read_when:
    - Vous devez appeler des helpers du cœur depuis un Plugin (TTS, STT, génération d’image, recherche web, sous-agent, Nodes)
    - Vous voulez comprendre ce que api.runtime expose
    - Vous accédez à des helpers de configuration, d’agent ou de média depuis du code de Plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- les helpers d’exécution injectés disponibles pour les Plugins
title: Helpers d’exécution de Plugin
x-i18n:
    generated_at: "2026-04-24T07:24:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2327bdabc0dc1e05000ff83e507007fadff2698cceaae0d4a3e7bc4885440c55
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Référence de l’objet `api.runtime` injecté dans chaque Plugin pendant
l’enregistrement. Utilisez ces helpers au lieu d’importer directement les internals de l’hôte.

<Tip>
  **Vous cherchez un guide pas à pas ?** Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  ou [Plugins de provider](/fr/plugins/sdk-provider-plugins) pour des guides étape par étape
  qui montrent ces helpers en contexte.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Espaces de noms runtime

### `api.runtime.agent`

Identité d’agent, répertoires et gestion de session.

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

`runEmbeddedAgent(...)` est le helper neutre pour démarrer un tour d’agent OpenClaw
normal depuis le code du Plugin. Il utilise la même résolution provider/modèle et
la même sélection de harnais d’agent que les réponses déclenchées par canal.

`runEmbeddedPiAgent(...)` reste comme alias de compatibilité.

**Les helpers de magasin de session** se trouvent sous `api.runtime.agent.session` :

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Constantes de modèle et de provider par défaut :

```typescript
const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
```

### `api.runtime.subagent`

Lancez et gérez des exécutions de sous-agent en arrière-plan.

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
  Les surcharges de modèle (`provider`/`model`) nécessitent un opt-in opérateur via
  `plugins.entries.<id>.subagent.allowModelOverride: true` dans la configuration.
  Les Plugins non fiables peuvent toujours exécuter des sous-agents, mais les demandes de surcharge sont rejetées.
</Warning>

### `api.runtime.nodes`

Listez les Nodes connectés et invoquez une commande hébergée sur un Node depuis le code de Plugin chargé par le Gateway. Utilisez ceci lorsqu’un Plugin possède du travail local sur un appareil appairé, par exemple un
browser ou un pont audio sur un autre Mac.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Ce runtime n’est disponible qu’à l’intérieur du Gateway. Les commandes Node passent toujours
par l’appairage normal des Nodes du Gateway, les listes d’autorisation de commandes, et la gestion locale des commandes sur le Node.

### `api.runtime.taskFlow`

Liez un runtime TaskFlow à une clé de session OpenClaw existante ou à un contexte d’outil de confiance, puis créez et gérez des TaskFlow sans transmettre de propriétaire à chaque appel.

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

Utilisez `bindSession({ sessionKey, requesterOrigin })` lorsque vous avez déjà une
clé de session OpenClaw de confiance provenant de votre propre couche de liaison. Ne liez pas à partir d’une entrée utilisateur brute.

### `api.runtime.tts`

Synthèse texte-parole.

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

Utilise la configuration cœur `messages.tts` et la sélection de provider. Renvoie un
buffer audio PCM + la fréquence d’échantillonnage.

### `api.runtime.mediaUnderstanding`

Analyse d’images, d’audio et de vidéo.

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

Renvoie `{ text: undefined }` lorsqu’aucune sortie n’est produite (par ex. entrée ignorée).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité
  pour `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Génération d’images.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Recherche web.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Utilitaires média de bas niveau.

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

Chargement et écriture de configuration.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utilitaires système de bas niveau.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Abonnements aux événements.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Journalisation.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Résolution de l’authentification des modèles et providers.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Résolution du répertoire d’état.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Fabriques d’outils mémoire et CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helpers d’exécution spécifiques aux canaux (disponibles lorsqu’un Plugin de canal est chargé).

`api.runtime.channel.mentions` est la surface partagée de politique de mention entrante pour
les Plugins de canal intégrés qui utilisent l’injection runtime :

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

Helpers de mention disponibles :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` n’expose volontairement pas les anciens helpers de compatibilité `resolveMentionGating*`. Préférez le chemin normalisé
`{ facts, policy }`.

## Stocker des références runtime

Utilisez `createPluginRuntimeStore` pour stocker la référence runtime à utiliser en dehors
du callback `register` :

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

Préférez `pluginId` pour l’identité du runtime-store. La forme `key` de niveau inférieur est
réservée aux cas rares où un Plugin a volontairement besoin de plus d’un emplacement runtime.

## Autres champs `api` de niveau supérieur

Au-delà de `api.runtime`, l’objet API fournit aussi :

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du Plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage du Plugin                                                                   |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané actif en mémoire à l’exécution lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration spécifique au Plugin depuis `plugins.entries.<id>.config`                     |
| `api.logger`             | `PluginLogger`            | Logger à portée limitée (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relatif à la racine du Plugin                                            |

## Lié

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) -- référence des sous-chemins
- [Points d’entrée du SDK](/fr/plugins/sdk-entrypoints) -- options de `definePluginEntry`
- [Internals des Plugins](/fr/plugins/architecture) -- modèle de capacités et registre
