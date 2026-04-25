---
read_when:
    - Potrzebujesz wywoływać pomocniki core z Plugin (TTS, STT, generowanie obrazów, wyszukiwanie w sieci, subagenty, nodey)
    - Chcesz zrozumieć, co udostępnia `api.runtime`
    - Uzyskujesz dostęp do pomocników config, agenta albo mediów z kodu Plugin
sidebarTitle: Runtime Helpers
summary: '`api.runtime` — wstrzyknięte pomocniki runtime dostępne dla Plugin'
title: Pomocniki runtime Plugin
x-i18n:
    generated_at: "2026-04-25T13:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9f1a56faf33ac18ea7e4b14f70d6f3a73c8b88481aeb0ee77035a17a03f15ce
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Dokumentacja referencyjna obiektu `api.runtime` wstrzykiwanego do każdego Plugin podczas
rejestracji. Używaj tych pomocników zamiast bezpośrednio importować wewnętrzne elementy hosta.

<Tip>
  **Szukasz przewodnika krok po kroku?** Zobacz [Channel Plugins](/pl/plugins/sdk-channel-plugins)
  albo [Provider Plugins](/pl/plugins/sdk-provider-plugins), aby poznać przewodniki krok po kroku,
  które pokazują te pomocniki w kontekście.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Przestrzenie nazw runtime

### `api.runtime.agent`

Tożsamość agenta, katalogi i zarządzanie sesjami.

```typescript
// Rozwiąż katalog roboczy agenta
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Rozwiąż przestrzeń roboczą agenta
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Pobierz tożsamość agenta
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Pobierz domyślny poziom myślenia
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Pobierz limit czasu agenta
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Upewnij się, że przestrzeń robocza istnieje
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Uruchom osadzoną turę agenta
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Podsumuj najnowsze zmiany",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

`runEmbeddedAgent(...)` to neutralny pomocnik do uruchamiania zwykłej tury agenta OpenClaw
z kodu Plugin. Używa tego samego rozwiązywania dostawcy/modelu i
wyboru wiązki agenta co odpowiedzi wywoływane przez kanał.

`runEmbeddedPiAgent(...)` pozostaje aliasem zgodności.

**Pomocniki magazynu sesji** znajdują się pod `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Domyślne stałe modelu i dostawcy:

```typescript
const model = api.runtime.agent.defaults.model; // np. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // np. "anthropic"
```

### `api.runtime.subagent`

Uruchamianie i zarządzanie uruchomieniami subagentów w tle.

```typescript
// Rozpocznij uruchomienie subagenta
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Rozwiń to zapytanie do ukierunkowanych wyszukiwań uzupełniających.",
  provider: "openai", // opcjonalne nadpisanie
  model: "gpt-4.1-mini", // opcjonalne nadpisanie
  deliver: false,
});

// Czekaj na zakończenie
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Odczytaj wiadomości sesji
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Usuń sesję
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Nadpisania modelu (`provider`/`model`) wymagają zgody operatora przez
  `plugins.entries.<id>.subagent.allowModelOverride: true` w config.
  Niezaufane Pluginy nadal mogą uruchamiać subagentów, ale żądania nadpisania są odrzucane.
</Warning>

### `api.runtime.nodes`

Wyświetlanie podłączonych nodeów i wywoływanie polecenia hostowanego przez node z kodu Plugin
załadowanego przez Gateway albo z poleceń CLI Plugin. Używaj tego, gdy Plugin zarządza pracą lokalną na
sparowanym urządzeniu, na przykład mostem przeglądarki albo audio na innym Macu.

```typescript
const { nodes } = await api.runtime.nodes.list({ connected: true });

const result = await api.runtime.nodes.invoke({
  nodeId: "mac-studio",
  command: "my-plugin.command",
  params: { action: "start" },
  timeoutMs: 30000,
});
```

Wewnątrz Gateway ten runtime działa w tym samym procesie. W poleceniach CLI Plugin wywołuje
skonfigurowany Gateway przez RPC, więc polecenia takie jak `openclaw googlemeet
recover-tab` mogą sprawdzać sparowane nodey z terminala. Polecenia node nadal przechodzą
przez zwykłe parowanie node Gateway, listy dozwolonych poleceń i lokalną obsługę poleceń node.

### `api.runtime.taskFlow`

Powiąż runtime TaskFlow z istniejącym kluczem sesji OpenClaw albo zaufanym kontekstem narzędzia,
a następnie twórz i zarządzaj TaskFlow bez przekazywania ownera przy każdym wywołaniu.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

const created = taskFlow.createManaged({
  controllerId: "my-plugin/review-batch",
  goal: "Przejrzyj nowe pull requesty",
});

const child = taskFlow.runTask({
  flowId: created.flowId,
  runtime: "acp",
  childSessionKey: "agent:main:subagent:reviewer",
  task: "Przejrzyj PR #123",
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

Użyj `bindSession({ sessionKey, requesterOrigin })`, gdy masz już
zaufany klucz sesji OpenClaw z własnej warstwy powiązań. Nie wiąż na podstawie surowego
wejścia użytkownika.

### `api.runtime.tts`

Synteza mowy.

```typescript
// Standardowy TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Witaj z OpenClaw",
  cfg: api.config,
});

// TTS zoptymalizowany pod telefonię
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Witaj z OpenClaw",
  cfg: api.config,
});

// Wyświetl dostępne głosy
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Używa podstawowej konfiguracji `messages.tts` i wyboru dostawcy. Zwraca bufor audio PCM
+ częstotliwość próbkowania.

### `api.runtime.mediaUnderstanding`

Analiza obrazów, dźwięku i wideo.

```typescript
// Opisz obraz
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transkrybuj dźwięk
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // opcjonalne, gdy nie można wywnioskować MIME
});

// Opisz wideo
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Ogólna analiza pliku
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Zwraca `{ text: undefined }`, gdy nie powstanie żadne wyjście (np. pominięte wejście).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności
  dla `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Generowanie obrazów.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "Robot malujący zachód słońca",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Wyszukiwanie w sieci.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Niskopoziomowe narzędzia mediów.

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

Wczytywanie i zapisywanie config.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Narzędzia poziomu systemowego.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Subskrypcje zdarzeń.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Logowanie.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Rozwiązywanie auth modelu i dostawcy.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Rozwiązywanie katalogu stanu.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Fabryki narzędzi pamięci i CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Pomocniki runtime specyficzne dla kanału (dostępne, gdy załadowany jest Plugin kanału).

`api.runtime.channel.mentions` to współdzielona powierzchnia zasad przychodzących wzmianek dla
dołączonych Plugin kanałów używających wstrzykiwania runtime:

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

Dostępne pomocniki wzmianek:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`api.runtime.channel.mentions` celowo nie udostępnia starszych pomocników zgodności
`resolveMentionGating*`. Preferuj znormalizowaną
ścieżkę `{ facts, policy }`.

## Przechowywanie referencji runtime

Użyj `createPluginRuntimeStore`, aby zapisać referencję runtime do użycia poza
callbackiem `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "my-plugin",
  errorMessage: "runtime my-plugin nie został zainicjalizowany",
});

// W punkcie wejścia
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Przykład",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// W innych plikach
export function getRuntime() {
  return store.getRuntime(); // rzuca wyjątek, jeśli nie zainicjalizowano
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // zwraca null, jeśli nie zainicjalizowano
}
```

Preferuj `pluginId` jako tożsamość runtime-store. Niższopoziomowa forma `key` jest
przeznaczona dla rzadkich przypadków, gdy jeden Plugin celowo potrzebuje więcej niż jednego slotu runtime.

## Inne pola najwyższego poziomu `api`

Oprócz `api.runtime` obiekt API udostępnia także:

| Pole                     | Typ                       | Opis                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID Plugin                                                                                    |
| `api.name`               | `string`                  | Nazwa wyświetlana Plugin                                                                     |
| `api.config`             | `OpenClawConfig`          | Bieżący snapshot config (aktywny snapshot runtime w pamięci, gdy dostępny)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Config specyficzny dla Plugin z `plugins.entries.<id>.config`                                |
| `api.logger`             | `PluginLogger`            | Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/setup przed pełnym entry |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względnie do katalogu głównego Plugin                                     |

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview) — dokumentacja referencyjna podścieżek
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry`
- [Wnętrze Plugin](/pl/plugins/architecture) — model możliwości i rejestr
