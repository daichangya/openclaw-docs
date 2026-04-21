---
read_when:
    - Das Integrationsdesign des Pi SDK in OpenClaw verstehen
    - Den Sitzungslebenszyklus, das Tooling oder die Anbieteranbindung des Pi ändern
summary: Architektur der eingebetteten Pi-Agent-Integration von OpenClaw und des Sitzungslebenszyklus
title: Architektur der Pi-Integration
x-i18n:
    generated_at: "2026-04-21T06:27:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ece62eb1459e8a861610c8502f2b3bf5172500207df5e78f4abe7a2a416a47fc
    source_path: pi.md
    workflow: 15
---

# Architektur der Pi-Integration

Dieses Dokument beschreibt, wie OpenClaw mit [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) und seinen Schwesterpaketen (`pi-ai`, `pi-agent-core`, `pi-tui`) integriert wird, um seine KI-Agent-Funktionen bereitzustellen.

## Überblick

OpenClaw verwendet das pi SDK, um einen KI-Coding-Agenten in seine Messaging-Gateway-Architektur einzubetten. Statt pi als Subprozess zu starten oder den RPC-Modus zu verwenden, importiert und instanziiert OpenClaw direkt die `AgentSession` von pi über `createAgentSession()`. Dieser eingebettete Ansatz bietet:

- Vollständige Kontrolle über den Sitzungslebenszyklus und die Ereignisbehandlung
- Benutzerdefinierte Tool-Injektion (Messaging, Sandbox, kanalspezifische Aktionen)
- Anpassung des System-Prompts pro Kanal/Kontext
- Sitzungspersistenz mit Unterstützung für Branching/Compaction
- Rotation von Multi-Account-Auth-Profilen mit Failover
- Anbieterunabhängiges Umschalten von Modellen

## Paketabhängigkeiten

```json
{
  "@mariozechner/pi-agent-core": "0.64.0",
  "@mariozechner/pi-ai": "0.64.0",
  "@mariozechner/pi-coding-agent": "0.64.0",
  "@mariozechner/pi-tui": "0.64.0"
}
```

| Paket             | Zweck                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Core-LLM-Abstraktionen: `Model`, `streamSimple`, Nachrichtentypen, Anbieter-APIs                      |
| `pi-agent-core`   | Agentenschleife, Tool-Ausführung, `AgentMessage`-Typen                                                 |
| `pi-coding-agent` | High-Level-SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, eingebaute Tools |
| `pi-tui`          | Terminal-UI-Komponenten (verwendet im lokalen TUI-Modus von OpenClaw)                                 |

## Dateistruktur

```
src/agents/
├── pi-embedded-runner.ts          # Re-Exporte aus pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Haupteinstieg: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logik für einen einzelnen Versuch mit Sitzungseinrichtung
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Antwort-Payloads aus Laufergebnissen erstellen
│   │   ├── images.ts              # Bildinjektion für Vision-Modelle
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Erkennung von Abbruchfehlern
│   ├── cache-ttl.ts               # Nachverfolgung von Cache-TTL für Kontext-Pruning
│   ├── compact.ts                 # Logik für manuelle/automatische Compaction
│   ├── extensions.ts              # Pi-Erweiterungen für eingebettete Läufe laden
│   ├── extra-params.ts            # Anbieterspezifische Stream-Parameter
│   ├── google.ts                  # Korrekturen der Turn-Reihenfolge für Google/Gemini
│   ├── history.ts                 # Begrenzung der Historie (DM vs. Gruppe)
│   ├── lanes.ts                   # Befehls-Lanes für Sitzung/global
│   ├── logger.ts                  # Subsystem-Logger
│   ├── model.ts                   # Modellauflösung über ModelRegistry
│   ├── runs.ts                    # Nachverfolgung aktiver Läufe, Abbruch, Warteschlange
│   ├── sandbox-info.ts            # Sandbox-Informationen für den System-Prompt
│   ├── session-manager-cache.ts   # Caching von SessionManager-Instanzen
│   ├── session-manager-init.ts    # Initialisierung der Sitzungsdatei
│   ├── system-prompt.ts           # Builder für den System-Prompt
│   ├── tool-split.ts              # Aufteilung von Tools in builtIn vs. custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel-Mapping, Fehlerbeschreibung
├── pi-embedded-subscribe.ts       # Abonnement/Dispatch von Sitzungsereignissen
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory für Ereignishandler
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking von Streaming-Blockantworten
├── pi-embedded-messaging.ts       # Nachverfolgung gesendeter Messaging-Tools
├── pi-embedded-helpers.ts         # Fehlerklassifizierung, Turn-Validierung
├── pi-embedded-helpers/           # Hilfsmodule
├── pi-embedded-utils.ts           # Formatierungs-Hilfsfunktionen
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal-Wrapper für Tools
├── pi-tools.policy.ts             # Richtlinie für Tool-Allowlist/Denylist
├── pi-tools.read.ts               # Anpassungen des Read-Tools
├── pi-tools.schema.ts             # Normalisierung des Tool-Schemas
├── pi-tools.types.ts              # Typalias AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Überschreibungen der Einstellungen
├── pi-hooks/                      # Benutzerdefinierte Pi-Hooks
│   ├── compaction-safeguard.ts    # Schutzmechanismus-Erweiterung
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Erweiterung für Cache-TTL-Kontext-Pruning
│   └── context-pruning/
├── model-auth.ts                  # Auflösung von Auth-Profilen
├── auth-profiles.ts               # Profilspeicher, Cooldown, Failover
├── model-selection.ts             # Auflösung des Standardmodells
├── models-config.ts               # Generierung von models.json
├── model-catalog.ts               # Cache des Modellkatalogs
├── context-window-guard.ts        # Validierung des Kontextfensters
├── failover-error.ts              # Klasse FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Auflösung von System-Prompt-Parametern
├── system-prompt-report.ts        # Generierung von Debug-Berichten
├── tool-summaries.ts              # Zusammenfassungen von Tool-Beschreibungen
├── tool-policy.ts                 # Auflösung der Tool-Richtlinie
├── transcript-policy.ts           # Richtlinie für Transcript-Validierung
├── skills.ts                      # Snapshot-/Prompt-Erstellung für Skills
├── skills/                        # Skills-Subsystem
├── sandbox.ts                     # Auflösung des Sandbox-Kontexts
├── sandbox/                       # Sandbox-Subsystem
├── channel-tools.ts               # Injektion kanalspezifischer Tools
├── openclaw-tools.ts              # OpenClaw-spezifische Tools
├── bash-tools.ts                  # Tools für exec/process
├── apply-patch.ts                 # Tool apply_patch (OpenAI)
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

Kanalspezifische Laufzeiten für Nachrichtenaktionen liegen jetzt in den plugin-eigenen Erweiterungsverzeichnissen statt unter `src/agents/tools`, zum Beispiel:

- die Laufzeitdateien für Plugin-Aktionen von Discord
- die Laufzeitdatei für Plugin-Aktionen von Slack
- die Laufzeitdatei für Plugin-Aktionen von Telegram
- die Laufzeitdatei für Plugin-Aktionen von WhatsApp

## Core-Integrationsablauf

### 1. Ausführen eines eingebetteten Agenten

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

### 2. Sitzungserstellung

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

### 3. Ereignisabonnement

`subscribeEmbeddedPiSession()` abonniert die `AgentSession`-Ereignisse von pi:

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

Behandelte Ereignisse umfassen:

- `message_start` / `message_end` / `message_update` (Streaming von Text/Thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Nach der Einrichtung erhält die Sitzung den Prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Das SDK übernimmt die vollständige Agentenschleife: Senden an das LLM, Ausführen von Tool-Aufrufen, Streamen von Antworten.

Die Bildinjektion ist promptlokal: OpenClaw lädt Bildreferenzen aus dem aktuellen Prompt und übergibt sie über `images` nur für diesen Turn. Ältere Historien-Turns werden nicht erneut gescannt, um Bild-Payloads erneut einzuspeisen.

## Tool-Architektur

### Tool-Pipeline

1. **Basis-Tools**: `codingTools` von pi (`read`, `bash`, `edit`, `write`)
2. **Benutzerdefinierte Ersetzungen**: OpenClaw ersetzt bash durch `exec`/`process` und passt read/edit/write für die Sandbox an
3. **OpenClaw-Tools**: Messaging, Browser, Canvas, Sitzungen, Cron, Gateway usw.
4. **Kanal-Tools**: Aktions-Tools für Discord/Telegram/Slack/WhatsApp
5. **Richtlinienfilterung**: Tools werden nach Profil-, Anbieter-, Agent-, Gruppen- und Sandbox-Richtlinien gefiltert
6. **Schema-Normalisierung**: Schemata werden für Gemini-/OpenAI-Eigenheiten bereinigt
7. **AbortSignal-Wrapper**: Tools werden so umhüllt, dass sie Abort-Signale respektieren

### Adapter für Tool-Definitionen

`AgentTool` aus pi-agent-core hat eine andere `execute`-Signatur als `ToolDefinition` aus pi-coding-agent. Der Adapter in `pi-tool-definition-adapter.ts` überbrückt das:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent-Signatur unterscheidet sich von pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategie zur Tool-Aufteilung

`splitSdkTools()` übergibt alle Tools über `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Leer. Wir überschreiben alles
    customTools: toToolDefinitions(options.tools),
  };
}
```

Dadurch wird sichergestellt, dass die Richtlinienfilterung, Sandbox-Integration und der erweiterte Tool-Satz von OpenClaw über alle Anbieter hinweg konsistent bleiben.

## Erstellung des System-Prompts

Der System-Prompt wird in `buildAgentSystemPrompt()` (`system-prompt.ts`) erstellt. Er setzt einen vollständigen Prompt aus Abschnitten zusammen, darunter Tooling, Tool-Aufruf-Stil, Sicherheits-Schutzmechanismen, OpenClaw-CLI-Referenz, Skills, Docs, Workspace, Sandbox, Messaging, Antwort-Tags, Stimme, stille Antworten, Heartbeats, Laufzeitmetadaten sowie Memory und Reactions, wenn aktiviert, und optional Kontextdateien und zusätzlicher Inhalt für den System-Prompt. Für den minimalen Prompt-Modus, der von Subagenten verwendet wird, werden Abschnitte gekürzt.

Der Prompt wird nach der Sitzungserstellung über `applySystemPromptOverrideToSession()` angewendet:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Sitzungsverwaltung

### Sitzungsdateien

Sitzungen sind JSONL-Dateien mit Baumstruktur (Verknüpfung über id/parentId). Der `SessionManager` von Pi übernimmt die Persistenz:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw kapselt dies mit `guardSessionManager()` zur Sicherheit von Tool-Ergebnissen.

### Sitzungs-Caching

`session-manager-cache.ts` cached `SessionManager`-Instanzen, um wiederholtes Parsen von Dateien zu vermeiden:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Begrenzung der Historie

`limitHistoryTurns()` kürzt die Konversationshistorie abhängig vom Kanaltyp (DM vs. Gruppe).

### Compaction

Automatische Compaction wird bei Kontextüberlauf ausgelöst. Häufige Überlauf-Signaturen umfassen `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` und `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` behandelt die manuelle Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentifizierung und Modellauflösung

### Auth-Profile

OpenClaw verwaltet einen Speicher für Auth-Profile mit mehreren API-Schlüsseln pro Anbieter:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile werden bei Fehlern mit Cooldown-Nachverfolgung rotiert:

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

// Verwendet ModelRegistry und AuthStorage von Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` löst einen Modell-Fallback aus, wenn konfiguriert:

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

### Compaction-Schutzmechanismus

`src/agents/pi-hooks/compaction-safeguard.ts` fügt Schutzmechanismen zu Compaction hinzu, einschließlich adaptiver Token-Budgetierung sowie Zusammenfassungen von Tool-Fehlern und Dateioperationen:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Kontext-Pruning

`src/agents/pi-hooks/context-pruning.ts` implementiert Cache-TTL-basiertes Kontext-Pruning:

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

## Streaming und Blockantworten

### Block-Chunking

`EmbeddedBlockChunker` verwaltet Streaming-Text in diskrete Antwortblöcke:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Entfernen von Thinking-/Final-Tags

Die Streaming-Ausgabe wird verarbeitet, um Blöcke `<think>`/`<thinking>` zu entfernen und Inhalt aus `<final>` zu extrahieren:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Inhalt von <think>...</think> entfernen
  // Wenn enforceFinalTag, nur Inhalt von <final>...</final> zurückgeben
};
```

### Antwortdirektiven

Antwortdirektiven wie `[[media:url]]`, `[[voice]]`, `[[reply:id]]` werden geparst und extrahiert:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Fehlerbehandlung

### Fehlerklassifizierung

`pi-embedded-helpers.ts` klassifiziert Fehler zur passenden Behandlung:

```typescript
isContextOverflowError(errorText)     // Kontext zu groß
isCompactionFailureError(errorText)   // Compaction fehlgeschlagen
isAuthAssistantError(lastAssistant)   // Auth-Fehler
isRateLimitAssistantError(...)        // Rate-Limit erreicht
isFailoverAssistantError(...)         // Sollte Failover auslösen
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking-Level-Fallback

Wenn ein Thinking-Level nicht unterstützt wird, wird ein Fallback verwendet:

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
  // Read/Edit/Write-Tools in der Sandbox verwenden
  // Exec läuft im Container
  // Browser verwendet Bridge-URL
}
```

## Anbieterspezifische Behandlung

### Anthropic

- Bereinigung von magischen Refusal-Strings
- Turn-Validierung für aufeinanderfolgende Rollen
- Strikte vorgelagerte Pi-Validierung von Tool-Parametern

### Google/Gemini

- Plugin-eigene Bereinigung des Tool-Schemas

### OpenAI

- Tool `apply_patch` für Codex-Modelle
- Behandlung von Thinking-Level-Downgrades

## TUI-Integration

OpenClaw hat außerdem einen lokalen TUI-Modus, der direkt Komponenten von pi-tui verwendet:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Dies bietet die interaktive Terminal-Erfahrung ähnlich dem nativen Modus von Pi.

## Wichtige Unterschiede zur Pi CLI

| Aspekt          | Pi CLI                  | Eingebettetes OpenClaw                                                                          |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Aufruf          | Befehl `pi` / RPC       | SDK über `createAgentSession()`                                                                 |
| Tools           | Standard-Coding-Tools   | Benutzerdefinierter Tool-Satz von OpenClaw                                                      |
| System-Prompt   | AGENTS.md + Prompts     | Dynamisch pro Kanal/Kontext                                                                     |
| Sitzungsspeicher | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oder `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Einzelne Zugangsdaten   | Mehrere Profile mit Rotation                                                                    |
| Erweiterungen   | Von Festplatte geladen  | Programmatisch + Festplattenpfade                                                               |
| Ereignisbehandlung | TUI-Rendering         | Callback-basiert (`onBlockReply` usw.)                                                          |

## Zukünftige Überlegungen

Bereiche für mögliche Überarbeitungen:

1. **Ausrichtung der Tool-Signaturen**: Derzeit Anpassung zwischen den Signaturen von pi-agent-core und pi-coding-agent
2. **Kapselung des Sitzungsmanagers**: `guardSessionManager` erhöht die Sicherheit, steigert aber auch die Komplexität
3. **Laden von Erweiterungen**: Könnte `ResourceLoader` von Pi direkter verwenden
4. **Komplexität des Streaming-Handlers**: `subscribeEmbeddedPiSession` ist groß geworden
5. **Anbieter-Eigenheiten**: Viele anbieterspezifische Codepfade, die Pi potenziell selbst handhaben könnte

## Tests

Die Abdeckung der Pi-Integration umfasst diese Test-Suiten:

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

Aktuelle Ausführungsbefehle finden Sie unter [Pi Development Workflow](/de/pi-dev).
