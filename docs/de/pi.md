---
read_when:
    - Das Design der Pi-SDK-Integration in OpenClaw verstehen
    - Sitzungslebenszyklus, Tooling oder Provider-Wiring für Pi ändern
summary: Architektur der eingebetteten Pi-Agent-Integration und des Sitzungslebenszyklus
title: Pi-Integrationsarchitektur
x-i18n:
    generated_at: "2026-04-24T06:46:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

Dieses Dokument beschreibt, wie OpenClaw mit [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) und dessen Schwesterpaketen (`pi-ai`, `pi-agent-core`, `pi-tui`) integriert ist, um seine KI-Agent-Fähigkeiten bereitzustellen.

## Überblick

OpenClaw verwendet das pi SDK, um einen KI-Coding-Agenten in seine Messaging-Gateway-Architektur einzubetten. Anstatt pi als Subprozess zu starten oder den RPC-Modus zu verwenden, importiert und instanziiert OpenClaw direkt `AgentSession` von pi über `createAgentSession()`. Dieser eingebettete Ansatz bietet:

- Volle Kontrolle über Sitzungslebenszyklus und Event-Handling
- Benutzerdefinierte Tool-Injektion (Messaging, Sandbox, kanalspezifische Aktionen)
- Anpassung des System-Prompts pro Kanal/Kontext
- Sitzungspersistenz mit Unterstützung für Branching/Compaction
- Rotation mehrerer Auth-Profile pro Konto mit Failover
- Providerunabhängiges Umschalten von Modellen

## Paketabhängigkeiten

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Paket             | Zweck                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Zentrale LLM-Abstraktionen: `Model`, `streamSimple`, Nachrichtentypen, Provider-APIs                  |
| `pi-agent-core`   | Agent-Schleife, Tool-Ausführung, Typen für `AgentMessage`                                              |
| `pi-coding-agent` | High-Level-SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, eingebaute Tools |
| `pi-tui`          | Terminal-UI-Komponenten (werden im lokalen TUI-Modus von OpenClaw verwendet)                          |

## Dateistruktur

```
src/agents/
├── pi-embedded-runner.ts          # Re-Exports aus pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Haupteinstieg: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logik für einen einzelnen Versuch mit Sitzungseinrichtung
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Antwortnutzlasten aus Laufergebnissen erstellen
│   │   ├── images.ts              # Bildinjektion für Vision-Modelle
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Erkennung von Abbruchfehlern
│   ├── cache-ttl.ts               # Cache-TTL-Tracking für Context Pruning
│   ├── compact.ts                 # Logik für manuelle/automatische Compaction
│   ├── extensions.ts              # pi-Erweiterungen für eingebettete Läufe laden
│   ├── extra-params.ts            # Providerspezifische Stream-Parameter
│   ├── google.ts                  # Korrekturen für Turn-Reihenfolge bei Google/Gemini
│   ├── history.ts                 # Begrenzung des Verlaufs (DM vs. Gruppe)
│   ├── lanes.ts                   # Sitzungs-/globale Command Lanes
│   ├── logger.ts                  # Logger für das Subsystem
│   ├── model.ts                   # Modellauflösung über ModelRegistry
│   ├── runs.ts                    # Tracking aktiver Läufe, Abbruch, Queue
│   ├── sandbox-info.ts            # Sandbox-Info für den System-Prompt
│   ├── session-manager-cache.ts   # Caching von SessionManager-Instanzen
│   ├── session-manager-init.ts    # Initialisierung von Sitzungsdateien
│   ├── system-prompt.ts           # Builder für den System-Prompt
│   ├── tool-split.ts              # Tools in builtIn vs custom aufteilen
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel-Zuordnung, Fehlerbeschreibung
├── pi-embedded-subscribe.ts       # Abonnement/Dispatch von Sitzungs-Events
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory für Event-Handler
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking von Streaming-Blockantworten
├── pi-embedded-messaging.ts       # Tracking gesendeter Messaging-Tools
├── pi-embedded-helpers.ts         # Fehlerklassifikation, Turn-Validierung
├── pi-embedded-helpers/           # Helper-Module
├── pi-embedded-utils.ts           # Formatierungs-Utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal-Wrapping für Tools
├── pi-tools.policy.ts             # Tool-Allowlist-/Denylist-Richtlinie
├── pi-tools.read.ts               # Anpassungen für das Read-Tool
├── pi-tools.schema.ts             # Normalisierung von Tool-Schemas
├── pi-tools.types.ts              # Type-Alias AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter von AgentTool -> ToolDefinition
├── pi-settings.ts                 # Settings-Überschreibungen
├── pi-hooks/                      # Benutzerdefinierte pi-Hooks
│   ├── compaction-safeguard.ts    # Safeguard-Erweiterung
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Erweiterung für Cache-TTL-Context-Pruning
│   └── context-pruning/
├── model-auth.ts                  # Auflösung von Auth-Profilen
├── auth-profiles.ts               # Profile Store, Cooldown, Failover
├── model-selection.ts             # Auflösung des Standardmodells
├── models-config.ts               # Generierung von models.json
├── model-catalog.ts               # Cache des Modellkatalogs
├── context-window-guard.ts        # Validierung des Kontextfensters
├── failover-error.ts              # Klasse FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Auflösung der Parameter für den System-Prompt
├── system-prompt-report.ts        # Generierung von Debug-Berichten
├── tool-summaries.ts              # Zusammenfassungen von Tools
├── tool-policy.ts                 # Auflösung von Tool-Richtlinien
├── transcript-policy.ts           # Richtlinie für Transcript-Validierung
├── skills.ts                      # Snapshot-/Prompt-Erstellung für Skills
├── skills/                        # Subsystem für Skills
├── sandbox.ts                     # Auflösung des Sandbox-Kontexts
├── sandbox/                       # Subsystem für Sandbox
├── channel-tools.ts               # Injektion kanalspezifischer Tools
├── openclaw-tools.ts              # OpenClaw-spezifische Tools
├── bash-tools.ts                  # exec-/process-Tools
├── apply-patch.ts                 # apply_patch-Tool (OpenAI)
├── tools/                         # Einzelne Tool-Implementierungen
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

Runtimes für kanalspezifische Nachrichtenaktionen leben jetzt in den erweiterungseigenen Plugin-
Verzeichnissen statt unter `src/agents/tools`, zum Beispiel:

- die Runtime-Dateien für Aktionen des Discord-Plugins
- die Runtime-Datei für Aktionen des Slack-Plugins
- die Runtime-Datei für Aktionen des Telegram-Plugins
- die Runtime-Datei für Aktionen des WhatsApp-Plugins

## Zentraler Integrationsfluss

### 1. Einen eingebetteten Agenten ausführen

Der Haupteinstiegspunkt ist `runEmbeddedPiAgent()` in `pi-embedded-runner/run.ts`:

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

### 2. Erstellung der Sitzung

Innerhalb von `runEmbeddedAttempt()` (aufgerufen von `runEmbeddedPiAgent()`) wird das pi SDK verwendet:

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

### 3. Event-Abonnement

`subscribeEmbeddedPiSession()` abonniert Events von `AgentSession` aus pi:

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

Behandelte Events umfassen:

- `message_start` / `message_end` / `message_update` (Streaming von Text/Thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Nach dem Setup wird die Sitzung gepromptet:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Das SDK übernimmt die vollständige Agent-Schleife: Senden an das LLM, Ausführen von Tool-Aufrufen, Streamen von Antworten.

Bildinjektion ist promptlokal: OpenClaw lädt Bildreferenzen aus dem aktuellen Prompt und
übergibt sie nur für diesen Turn über `images`. Ältere Verlaufsturns werden nicht erneut gescannt,
um Bildnutzlasten erneut zu injizieren.

## Tool-Architektur

### Tool-Pipeline

1. **Basis-Tools**: `codingTools` von pi (read, bash, edit, write)
2. **Benutzerdefinierte Ersetzungen**: OpenClaw ersetzt bash durch `exec`/`process`, passt read/edit/write für die Sandbox an
3. **OpenClaw-Tools**: Messaging, Browser, Canvas, Sitzungen, Cron, Gateway usw.
4. **Channel-Tools**: Discord-/Telegram-/Slack-/WhatsApp-spezifische Aktionstools
5. **Policy-Filterung**: Tools werden nach Profil-, Provider-, Agent-, Gruppen- und Sandbox-Richtlinien gefiltert
6. **Schema-Normalisierung**: Schemas werden für Eigenheiten von Gemini/OpenAI bereinigt
7. **AbortSignal-Wrapping**: Tools werden so verpackt, dass sie Abort-Signale respektieren

### Adapter für Tool-Definitionen

`AgentTool` aus pi-agent-core hat eine andere `execute`-Signatur als `ToolDefinition` aus pi-coding-agent. Der Adapter in `pi-tool-definition-adapter.ts` überbrückt dies:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // Die Signatur von pi-coding-agent unterscheidet sich von der von pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategie zur Aufteilung von Tools

`splitSdkTools()` übergibt alle Tools über `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Leer. Wir überschreiben alles
    customTools: toToolDefinitions(options.tools),
  };
}
```

Dadurch wird sichergestellt, dass Policy-Filterung, Sandbox-Integration und der erweiterte Tool-Satz von OpenClaw über alle Provider hinweg konsistent bleiben.

## Aufbau des System-Prompts

Der System-Prompt wird in `buildAgentSystemPrompt()` (`system-prompt.ts`) erstellt. Er setzt einen vollständigen Prompt mit Abschnitten wie Tooling, Tool-Call-Stil, Safety-Guardrails, OpenClaw-CLI-Referenz, Skills, Doku, Workspace, Sandbox, Messaging, Reply-Tags, Voice, Silent Replies, Heartbeats, Runtime-Metadaten sowie Memory und Reactions zusammen, wenn diese aktiviert sind, plus optionalen Kontextdateien und zusätzlichem Inhalt für den System-Prompt. Abschnitte werden für den minimalen Prompt-Modus, der von Subagenten verwendet wird, gekürzt.

Der Prompt wird nach Erstellung der Sitzung über `applySystemPromptOverrideToSession()` angewendet:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Sitzungsverwaltung

### Sitzungsdateien

Sitzungen sind JSONL-Dateien mit Baumstruktur (Verknüpfung über id/parentId). `SessionManager` von Pi übernimmt die Persistierung:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw kapselt dies mit `guardSessionManager()` für Sicherheit bei Tool-Ergebnissen.

### Sitzungs-Caching

`session-manager-cache.ts` cached SessionManager-Instanzen, um wiederholtes Parsen von Dateien zu vermeiden:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Begrenzung des Verlaufs

`limitHistoryTurns()` kürzt den Gesprächsverlauf basierend auf Kanaltyp (DM vs. Gruppe).

### Compaction

Automatische Compaction wird bei Kontextüberlauf ausgelöst. Häufige Signaturen für Überläufe
sind `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` und `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` übernimmt manuelle
Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentifizierung & Modellauflösung

### Auth-Profile

OpenClaw verwaltet einen Auth-Profile-Store mit mehreren API-Keys pro Provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile rotieren bei Fehlern mit Cooldown-Tracking:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Modellauflösung

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Verwendet Pi's ModelRegistry und AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` löst einen Modell-Fallback aus, wenn dies konfiguriert ist:

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

## Pi-Erweiterungen

OpenClaw lädt benutzerdefinierte Pi-Erweiterungen für spezialisiertes Verhalten:

### Compaction Safeguard

`src/agents/pi-hooks/compaction-safeguard.ts` fügt Guardrails für Compaction hinzu, einschließlich adaptiver Token-Budgetierung sowie Zusammenfassungen von Tool-Fehlern und Dateivorgängen:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` implementiert Context Pruning auf Basis von Cache-TTL:

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

## Streaming & Blockantworten

### Block-Chunking

`EmbeddedBlockChunker` verwaltet Streaming-Text in diskreten Antwortblöcken:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Entfernen von Thinking-/Final-Tags

Streaming-Ausgabe wird verarbeitet, um Blöcke `<think>`/`<thinking>` zu entfernen und den Inhalt von `<final>` zu extrahieren:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Inhalt von <think>...</think> entfernen
  // Wenn enforceFinalTag gesetzt ist, nur Inhalt von <final>...</final> zurückgeben
};
```

### Reply-Direktiven

Reply-Direktiven wie `[[media:url]]`, `[[voice]]`, `[[reply:id]]` werden geparst und extrahiert:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Fehlerbehandlung

### Fehlerklassifikation

`pi-embedded-helpers.ts` klassifiziert Fehler für eine passende Behandlung:

```typescript
isContextOverflowError(errorText)     // Kontext zu groß
isCompactionFailureError(errorText)   // Compaction fehlgeschlagen
isAuthAssistantError(lastAssistant)   // Authentifizierungsfehler
isRateLimitAssistantError(...)        // Rate-limitiert
isFailoverAssistantError(...)         // Sollte Failover auslösen
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback für Thinking-Level

Wenn eine Thinking-Stufe nicht unterstützt wird, wird auf eine andere zurückgefallen:

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

## Sandbox-Integration

Wenn der Sandbox-Modus aktiviert ist, werden Tools und Pfade eingeschränkt:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Verwende sandboxed Read/Edit/Write-Tools
  // Exec läuft im Container
  // Browser verwendet Bridge-URL
}
```

## Providerspezifische Behandlung

### Anthropic

- Bereinigung von Refusal-Magic-Strings
- Turn-Validierung für aufeinanderfolgende Rollen
- Strikte Upstream-Validierung von Tool-Parametern in Pi

### Google/Gemini

- Bereinigung von Tool-Schemas im Besitz des Plugins

### OpenAI

- Tool `apply_patch` für Codex-Modelle
- Handling für Downgrade des Thinking-Levels

## TUI-Integration

OpenClaw hat außerdem einen lokalen TUI-Modus, der Komponenten aus pi-tui direkt verwendet:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Dies bietet die interaktive Terminal-Erfahrung ähnlich zum nativen Modus von Pi.

## Wichtige Unterschiede zur Pi-CLI

| Aspekt          | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Aufruf          | `pi`-Befehl / RPC       | SDK über `createAgentSession()`                                                                |
| Tools           | Standard-Coding-Tools   | Benutzerdefinierte OpenClaw-Tool-Suite                                                         |
| System-Prompt   | AGENTS.md + Prompts     | Dynamisch pro Kanal/Kontext                                                                    |
| Sitzungsspeicher | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oder `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Einzelne Zugangsdaten   | Mehrere Profile mit Rotation                                                                   |
| Erweiterungen   | Von der Festplatte geladen | Programmatisch + Pfade auf Festplatte                                                       |
| Event-Handling  | TUI-Rendering           | Callback-basiert (onBlockReply usw.)                                                           |

## Überlegungen für die Zukunft

Bereiche für mögliche Überarbeitungen:

1. **Ausrichtung der Tool-Signaturen**: Derzeit Anpassung zwischen Signaturen von pi-agent-core und pi-coding-agent
2. **Wrapping des Session Managers**: `guardSessionManager` erhöht die Sicherheit, aber auch die Komplexität
3. **Laden von Erweiterungen**: Könnte `ResourceLoader` von Pi direkter verwenden
4. **Komplexität des Streaming-Handlers**: `subscribeEmbeddedPiSession` ist groß geworden
5. **Provider-Eigenheiten**: Viele providerspezifische Codepfade, die Pi potenziell selbst übernehmen könnte

## Tests

Die Abdeckung der Pi-Integration erstreckt sich über diese Suites:

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

Live/Opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (aktivieren mit `OPENCLAW_LIVE_TEST=1`)

Aktuelle Laufbefehle finden Sie unter [Pi Development Workflow](/de/pi-dev).

## Verwandt

- [Pi development workflow](/de/pi-dev)
- [Installationsübersicht](/de/install)
