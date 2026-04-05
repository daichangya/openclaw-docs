---
read_when:
    - Vous devez appeler des assistants du cœur depuis un plugin (TTS, STT, génération d’image, recherche web, sous-agent)
    - Vous souhaitez comprendre ce que `api.runtime` expose
    - Vous accédez à des assistants de configuration, d’agent ou de médias depuis le code du plugin
sidebarTitle: Runtime Helpers
summary: api.runtime -- les assistants runtime injectés disponibles pour les plugins
title: Assistants runtime des plugins
x-i18n:
    generated_at: "2026-04-05T12:50:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667edff734fd30f9b05d55eae6360830a45ae8f3012159f88a37b5e05404e666
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Assistants runtime des plugins

Référence pour l’objet `api.runtime` injecté dans chaque plugin pendant
l’enregistrement. Utilisez ces assistants au lieu d’importer directement les internes de l’hôte.

<Tip>
  **Vous cherchez une procédure guidée ?** Consultez [Plugins de canal](/plugins/sdk-channel-plugins)
  ou [Plugins de fournisseur](/plugins/sdk-provider-plugins) pour des guides pas à pas
  qui montrent ces assistants en contexte.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Espaces de noms runtime

### `api.runtime.agent`

Identité de l’agent, répertoires et gestion de session.

```typescript
// Résoudre le répertoire de travail de l’agent
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Résoudre le workspace de l’agent
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Obtenir l’identité de l’agent
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Obtenir le niveau de réflexion par défaut
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Obtenir le délai d’expiration de l’agent
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// S’assurer que le workspace existe
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Exécuter un agent Pi intégré
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Résumer les dernières modifications",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

Les **assistants de magasin de session** se trouvent sous `api.runtime.agent.session` :

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Constantes de modèle et de fournisseur par défaut :

```typescript
const model = api.runtime.agent.defaults.model; // ex. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // ex. "anthropic"
```

### `api.runtime.subagent`

Lancer et gérer des exécutions de sous-agent en arrière-plan.

```typescript
// Démarrer une exécution de sous-agent
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Développer cette requête en recherches de suivi ciblées.",
  provider: "openai", // remplacement facultatif
  model: "gpt-4.1-mini", // remplacement facultatif
  deliver: false,
});

// Attendre la fin
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Lire les messages de session
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Supprimer une session
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Les remplacements de modèle (`provider`/`model`) nécessitent une adhésion explicite
  de l’opérateur via `plugins.entries.<id>.subagent.allowModelOverride: true` dans la configuration.
  Les plugins non approuvés peuvent toujours exécuter des sous-agents, mais les demandes de remplacement sont rejetées.
</Warning>

### `api.runtime.taskFlow`

Lier un runtime Task Flow à une clé de session OpenClaw existante ou à un contexte d’outil approuvé, puis créer et gérer des Task Flows sans passer un propriétaire à chaque appel.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Examiner les nouvelles pull requests",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Examiner la PR #123",
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
clé de session OpenClaw approuvée issue de votre propre couche de liaison. Ne liez pas depuis une entrée utilisateur brute.

### `api.runtime.tts`

Synthèse vocale.

```typescript
// TTS standard
const clip = await api.runtime.tts.textToSpeech({
  text: "Bonjour depuis OpenClaw",
  cfg: api.config,
});

// TTS optimisé pour la téléphonie
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Bonjour depuis OpenClaw",
  cfg: api.config,
});

// Lister les voix disponibles
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Utilise la configuration centrale `messages.tts` et la sélection du fournisseur. Renvoie un
tampon audio PCM + fréquence d’échantillonnage.

### `api.runtime.mediaUnderstanding`

Analyse d’images, d’audio et de vidéo.

```typescript
// Décrire une image
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transcrire de l’audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // facultatif, lorsque le MIME ne peut pas être déduit
});

// Décrire une vidéo
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Analyse générique de fichier
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Renvoie `{ text: undefined }` lorsqu’aucune sortie n’est produite (par ex. entrée ignorée).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité
  pour `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Génération d’images.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Un robot peignant un coucher de soleil",
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

Utilitaires médias de bas niveau.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

Chargement et écriture de configuration.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Utilitaires de niveau système.

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

Résolution d’authentification des modèles et fournisseurs.

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

Fabriques d’outils memory et CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Assistants runtime spécifiques aux canaux (disponibles lorsqu’un plugin de canal est chargé).

## Stocker des références runtime

Utilisez `createPluginRuntimeStore` pour stocker la référence runtime afin de l’utiliser en dehors
du callback `register` :

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// Dans votre point d’entrée
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Exemple",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// Dans d’autres fichiers
export function getRuntime() {
  return store.getRuntime(); // lève une erreur si non initialisé
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // renvoie null si non initialisé
}
```

## Autres champs `api` de niveau supérieur

Au-delà de `api.runtime`, l’objet API fournit également :

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage du plugin                                                                   |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané runtime actif en mémoire lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au plugin depuis `plugins.entries.<id>.config`                         |
| `api.logger`             | `PluginLogger`            | Logger limité (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relatif à la racine du plugin                                            |

## Lié

- [Vue d’ensemble du SDK](/plugins/sdk-overview) -- référence des sous-chemins
- [Points d’entrée SDK](/plugins/sdk-entrypoints) -- options de `definePluginEntry`
- [Internals des plugins](/plugins/architecture) -- modèle de capacités et registre
