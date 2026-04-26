---
read_when:
    - Musisz wywołać pomocniki rdzenia z pluginu (TTS, STT, generowanie obrazów, wyszukiwanie w sieci, subagent, Node)
    - Chcesz zrozumieć, co udostępnia api.runtime
    - Uzyskujesz dostęp do helperów konfiguracji, agenta lub multimediów z kodu pluginu
sidebarTitle: Runtime helpers
summary: api.runtime — wstrzyknięte pomocniki środowiska uruchomieniowego dostępne dla pluginów
title: Pomocniki środowiska uruchomieniowego pluginów
x-i18n:
    generated_at: "2026-04-26T11:37:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Odniesienie do obiektu `api.runtime` wstrzykiwanego do każdego pluginu podczas rejestracji. Używaj tych helperów zamiast bezpośrednio importować elementy wewnętrzne hosta.

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" href="/pl/plugins/sdk-channel-plugins">
    Przewodnik krok po kroku, który używa tych helperów w kontekście pluginów kanałów.
  </Card>
  <Card title="Pluginy dostawców" href="/pl/plugins/sdk-provider-plugins">
    Przewodnik krok po kroku, który używa tych helperów w kontekście pluginów dostawców.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Przestrzenie nazw środowiska uruchomieniowego

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Tożsamość agenta, katalogi i zarządzanie sesjami.

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

    `runEmbeddedAgent(...)` to neutralny helper do uruchamiania zwykłej tury agenta OpenClaw z kodu pluginu. Używa tego samego rozwiązywania dostawcy/modelu i tego samego wyboru harnessu agenta co odpowiedzi wyzwalane przez kanał.

    `runEmbeddedPiAgent(...)` pozostaje aliasem zgodności.

    **Helpery magazynu sesji** znajdują się pod `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Domyślne stałe modelu i dostawcy:

    ```typescript
    const model = api.runtime.agent.defaults.model; // np. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // np. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Uruchamianie i zarządzanie przebiegami subagenta w tle.

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
    Zastąpienia modelu (`provider`/`model`) wymagają zgody operatora przez `plugins.entries.<id>.subagent.allowModelOverride: true` w konfiguracji. Niezaufane pluginy nadal mogą uruchamiać subagentów, ale żądania zastąpienia są odrzucane.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Wyświetlanie listy podłączonych Node i wywoływanie polecenia hostowanego na Node z kodu pluginu załadowanego przez Gateway lub z poleceń CLI pluginu. Używaj tego, gdy plugin obsługuje lokalną pracę na sparowanym urządzeniu, na przykład przeglądarkę lub most audio na innym Macu.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Wewnątrz Gateway to środowisko uruchomieniowe działa w procesie. W poleceniach CLI pluginu wywołuje skonfigurowany Gateway przez RPC, więc polecenia takie jak `openclaw googlemeet recover-tab` mogą sprawdzać sparowane Node z terminala. Polecenia Node nadal przechodzą przez normalne parowanie Node z Gateway, listy dozwolonych poleceń i lokalną obsługę poleceń po stronie Node.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Powiąż środowisko uruchomieniowe TaskFlow z istniejącym kluczem sesji OpenClaw lub zaufanym kontekstem narzędzia, a następnie twórz i zarządzaj TaskFlow bez przekazywania właściciela przy każdym wywołaniu.

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

    Użyj `bindSession({ sessionKey, requesterOrigin })`, gdy masz już zaufany klucz sesji OpenClaw z własnej warstwy powiązania. Nie powiązuj na podstawie surowych danych wejściowych użytkownika.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Synteza mowy z tekstu.

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

    Używa konfiguracji `messages.tts` rdzenia i wyboru dostawcy. Zwraca bufor audio PCM + częstotliwość próbkowania.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analiza obrazów, dźwięku i wideo.

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

    Zwraca `{ text: undefined }`, gdy nie zostanie wygenerowane żadne wyjście (np. pominięte wejście).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności dla `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Generowanie obrazów.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Wyszukiwanie w sieci.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Niskopoziomowe narzędzia multimedialne.

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

  </Accordion>
  <Accordion title="api.runtime.config">
    Wczytywanie i zapisywanie konfiguracji.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    Narzędzia na poziomie systemu.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    Subskrypcje zdarzeń.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Logowanie.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Rozwiązywanie uwierzytelniania modelu i dostawcy.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Rozwiązywanie katalogu stanu.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

  </Accordion>
  <Accordion title="api.runtime.tools">
    Fabryki narzędzi pamięci i CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Pomocniki środowiska uruchomieniowego specyficzne dla kanału (dostępne, gdy załadowany jest plugin kanału).

    `api.runtime.channel.mentions` to współdzielona powierzchnia polityki wzmianek przychodzących dla dołączonych pluginów kanałów, które używają wstrzykiwania środowiska uruchomieniowego:

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

    Dostępne helpery wzmianek:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` celowo nie udostępnia starszych helperów zgodności `resolveMentionGating*`. Preferuj znormalizowaną ścieżkę `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Przechowywanie odwołań do środowiska uruchomieniowego

Użyj `createPluginRuntimeStore`, aby przechowywać odwołanie do środowiska uruchomieniowego do użycia poza callbackiem `register`:

<Steps>
  <Step title="Utwórz magazyn">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Podłącz do punktu wejścia">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Uzyskaj dostęp z innych plików">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Preferuj `pluginId` jako tożsamość runtime-store. Niższopoziomowa forma `key` jest przeznaczona do rzadkich przypadków, gdy jeden plugin celowo potrzebuje więcej niż jednego slotu środowiska uruchomieniowego.
</Note>

## Inne pola najwyższego poziomu `api`

Poza `api.runtime` obiekt API udostępnia także:

<ParamField path="api.id" type="string">
  Identyfikator pluginu.
</ParamField>
<ParamField path="api.name" type="string">
  Wyświetlana nazwa pluginu.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Bieżący snapshot konfiguracji (aktywny snapshot środowiska uruchomieniowego w pamięci, gdy jest dostępny).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger ograniczony zakresem (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym uruchomieniem wpisu.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Rozwiąż ścieżkę względem katalogu głównego pluginu.
</ParamField>

## Powiązane

- [Wewnętrzne elementy Plugin](/pl/plugins/architecture) — model możliwości i rejestr
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry`
- [Przegląd SDK](/pl/plugins/sdk-overview) — odniesienie do podścieżek
