---
read_when:
    - Hai bisogno di chiamare helper core da un Plugin (TTS, STT, generazione immagini, ricerca web, sottoagente, node)
    - Vuoi capire cosa espone api.runtime
    - Stai accedendo a helper di configurazione, agente o contenuti multimediali dal codice del Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- gli helper di runtime iniettati disponibili ai Plugin
title: Helper di runtime dei Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Riferimento per l'oggetto `api.runtime` iniettato in ogni Plugin durante la registrazione. Usa questi helper invece di importare direttamente gli elementi interni dell'host.

<CardGroup cols={2}>
  <Card title="Plugin di canale" href="/it/plugins/sdk-channel-plugins">
    Guida passo passo che usa questi helper nel contesto dei plugin di canale.
  </Card>
  <Card title="Plugin provider" href="/it/plugins/sdk-provider-plugins">
    Guida passo passo che usa questi helper nel contesto dei plugin provider.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Namespace del runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identità dell'agente, directory e gestione delle sessioni.

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

    `runEmbeddedAgent(...)` è l'helper neutro per avviare un normale turno agente di OpenClaw dal codice del Plugin. Usa la stessa risoluzione di provider/modello e la stessa selezione dell'agent harness delle risposte attivate dal canale.

    `runEmbeddedPiAgent(...)` rimane come alias di compatibilità.

    Gli **helper del session store** si trovano in `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Costanti predefinite per modello e provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Avvia e gestisci esecuzioni di subagent in background.

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
    Le sostituzioni del modello (`provider`/`model`) richiedono il consenso esplicito dell'operatore tramite `plugins.entries.<id>.subagent.allowModelOverride: true` nella configurazione. I plugin non attendibili possono comunque eseguire subagent, ma le richieste di sostituzione vengono rifiutate.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Elenca i Node connessi e invoca un comando ospitato dal Node dal codice del Plugin caricato dal Gateway o dai comandi CLI del Plugin. Usalo quando un plugin possiede lavoro locale su un dispositivo associato, ad esempio un bridge del browser o audio su un altro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    All'interno del Gateway questo runtime è in-process. Nei comandi CLI del Plugin richiama il Gateway configurato tramite RPC, quindi comandi come `openclaw googlemeet recover-tab` possono ispezionare i Node associati dal terminale. I comandi Node continuano comunque a passare attraverso il normale pairing dei Node del Gateway, le allowlist dei comandi e la gestione dei comandi locali al Node.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Associa un runtime TaskFlow a una chiave di sessione OpenClaw esistente o a un contesto di tool attendibile, quindi crea e gestisci i TaskFlow senza passare un owner a ogni chiamata.

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

    Usa `bindSession({ sessionKey, requesterOrigin })` quando hai già una chiave di sessione OpenClaw attendibile dal tuo livello di binding. Non effettuare il bind a partire da input utente grezzo.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sintesi vocale.

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

    Usa la configurazione core `messages.tts` e la selezione del provider. Restituisce buffer audio PCM + sample rate.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analisi di immagini, audio e video.

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

    Restituisce `{ text: undefined }` quando non viene prodotto alcun output, ad esempio in caso di input saltato.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` rimane come alias di compatibilità per `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Generazione di immagini.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Ricerca web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Utility multimediali di basso livello.

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
    Caricamento e scrittura della configurazione.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    Utility a livello di sistema.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    Sottoscrizioni agli eventi.

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
    Logging.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Risoluzione dell'autenticazione di modello e provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Risoluzione della directory di stato.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

  </Accordion>
  <Accordion title="api.runtime.tools">
    Factory di tool di memoria e CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Helper runtime specifici del canale (disponibili quando è caricato un plugin di canale).

    `api.runtime.channel.mentions` è la superficie condivisa della policy per le menzioni in ingresso per i plugin di canale inclusi che usano l'iniezione runtime:

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

    Helper per le menzioni disponibili:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` intenzionalmente non espone i vecchi helper di compatibilità `resolveMentionGating*`. Preferisci il percorso normalizzato `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Archiviazione dei riferimenti runtime

Usa `createPluginRuntimeStore` per archiviare il riferimento runtime da usare al di fuori della callback `register`:

<Steps>
  <Step title="Crea lo store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Collega al punto di ingresso">
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
  <Step title="Accedi da altri file">
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
Preferisci `pluginId` per l'identità del runtime-store. La forma di livello inferiore `key` è per casi non comuni in cui un plugin ha intenzionalmente bisogno di più di uno slot runtime.
</Note>

## Altri campi `api` di primo livello

Oltre a `api.runtime`, l'oggetto API fornisce anche:

<ParamField path="api.id" type="string">
  ID del Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nome visualizzato del Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configurazione specifica del Plugin da `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger con ambito (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/configurazione prima dell'inizializzazione completa dell'entry.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Risolve un percorso relativo alla radice del Plugin.
</ParamField>

## Correlati

- [Elementi interni del Plugin](/it/plugins/architecture) — modello di capacità e registry
- [Punti di ingresso SDK](/it/plugins/sdk-entrypoints) — opzioni di `definePluginEntry`
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento ai sottopercorsi
