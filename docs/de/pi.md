---
read_when:
    - Das Design der Pi-SDK-Integration in OpenClaw verstehen
    - Den Sitzungslebenszyklus, die Tools oder die Provider-Anbindung für Pi ändern
summary: Architektur der eingebetteten Pi-Agent-Integration von OpenClaw und des Sitzungslebenszyklus
title: Architektur der Pi-Integration
x-i18n:
    generated_at: "2026-04-05T12:50:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 596de5fbb1430008698079f211db200e02ca8485547550fd81571a459c4c83c7
    source_path: pi.md
    workflow: 15
---

# Architektur der Pi-Integration

Dieses Dokument beschreibt, wie OpenClaw mit [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) und den zugehörigen Paketen (`pi-ai`, `pi-agent-core`, `pi-tui`) integriert wird, um seine KI-Agent-Funktionen bereitzustellen.

## Überblick

OpenClaw verwendet das pi SDK, um einen KI-Coding-Agenten in seine Messaging-Gateway-Architektur einzubetten. Anstatt pi als Unterprozess zu starten oder den RPC-Modus zu verwenden, importiert und instanziiert OpenClaw direkt die `AgentSession` von pi über `createAgentSession()`. Dieser eingebettete Ansatz bietet:

- Volle Kontrolle über Sitzungslebenszyklus und Ereignisverarbeitung
- Benutzerdefinierte Tool-Injektion (Messaging, Sandbox, kanalspezifische Aktionen)
- Anpassung des System-Prompts pro Kanal/Kontext
- Sitzungspersistenz mit Unterstützung für Verzweigung/Kompaktierung
- Rotation von Auth-Profilen für mehrere Konten mit Failover
- Provider-agnostisches Modellwechseln

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
| `pi-ai`           | Kernabstraktionen für LLMs: `Model`, `streamSimple`, Nachrichtentypen, Provider-APIs                  |
| `pi-agent-core`   | Agent-Schleife, Tool-Ausführung, `AgentMessage`-Typen                                                  |
| `pi-coding-agent` | High-Level-SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, integrierte Tools |
| `pi-tui`          | Terminal-UI-Komponenten (werden im lokalen TUI-Modus von OpenClaw verwendet)                           |

## Dateistruktur

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports aus pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Haupteinstieg: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logik für einen einzelnen Versuch mit Sitzungseinrichtung
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Antwort-Payloads aus Laufergebnissen erstellen
│   │   ├── images.ts              # Bildeinfügung für Vision-Modelle
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Erkennung von Abbruchfehlern
│   ├── cache-ttl.ts               # Cache-TTL-Verfolgung für Kontextbeschneidung
│   ├── compact.ts                 # Logik für manuelle/automatische Kompaktierung
│   ├── extensions.ts              # Pi-Erweiterungen für eingebettete Läufe laden
│   ├── extra-params.ts            # Provider-spezifische Stream-Parameter
│   ├── google.ts                  # Korrekturen der Zugreihenfolge für Google/Gemini
│   ├── history.ts                 # Begrenzung des Verlaufs (DM vs. Gruppe)
│   ├── lanes.ts                   # Sitzungs-/globale Befehlsbahnen
│   ├── logger.ts                  # Subsystem-Logger
│   ├── model.ts                   # Modellauflösung über ModelRegistry
│   ├── runs.ts                    # Verfolgung aktiver Läufe, Abbruch, Warteschlange
│   ├── sandbox-info.ts            # Sandbox-Informationen für den System-Prompt
│   ├── session-manager-cache.ts   # Caching von SessionManager-Instanzen
│   ├── session-manager-init.ts    # Initialisierung von Sitzungsdateien
│   ├── system-prompt.ts           # Builder für den System-Prompt
│   ├── tool-split.ts              # Aufteilen von Tools in builtIn vs. custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel-Zuordnung, Fehlerbeschreibung
├── pi-embedded-subscribe.ts       # Abonnement/Weiterleitung von Sitzungsereignissen
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory für Event-Handler
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking gestreamter Blockantworten
├── pi-embedded-messaging.ts       # Verfolgung gesendeter Messaging-Tools
├── pi-embedded-helpers.ts         # Fehlerklassifizierung, Zugvalidierung
├── pi-embedded-helpers/           # Hilfsmodule
├── pi-embedded-utils.ts           # Formatierungs-Hilfsfunktionen
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal-Wrapper für Tools
├── pi-tools.policy.ts             # Allowlist-/Denylist-Richtlinie für Tools
├── pi-tools.read.ts               # Anpassungen für das Read-Tool
├── pi-tools.schema.ts             # Normalisierung des Tool-Schemas
├── pi-tools.types.ts              # Typalias AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter von AgentTool -> ToolDefinition
├── pi-settings.ts                 # Einstellungsüberschreibungen
├── pi-hooks/                      # Benutzerdefinierte Pi-Hooks
│   ├── compaction-safeguard.ts    # Schutz-Erweiterung
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL-basierte Kontextbeschneidungs-Erweiterung
│   └── context-pruning/
├── model-auth.ts                  # Auflösung von Auth-Profilen
├── auth-profiles.ts               # Profilspeicher, Cooldown, Failover
├── model-selection.ts             # Auflösung des Standardmodells
├── models-config.ts               # Generierung von models.json
├── model-catalog.ts               # Cache für den Modellkatalog
├── context-window-guard.ts        # Validierung des Kontextfensters
├── failover-error.ts              # Klasse FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Auflösung der Parameter des System-Prompts
├── system-prompt-report.ts        # Generierung von Debug-Berichten
├── tool-summaries.ts              # Zusammenfassungen von Tool-Beschreibungen
├── tool-policy.ts                 # Auflösung der Tool-Richtlinie
├── transcript-policy.ts           # Richtlinie zur Transkriptvalidierung
├── skills.ts                      # Snapshot-/Prompt-Erstellung für Skills
├── skills/                        # Skills-Subsystem
├── sandbox.ts                     # Auflösung des Sandbox-Kontexts
├── sandbox/                       # Sandbox-Subsystem
├── channel-tools.ts               # Injektion kanalspezifischer Tools
├── openclaw-tools.ts              # OpenClaw-spezifische Tools
├── bash-tools.ts                  # exec-/process-Tools
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

Laufzeiten für kanalspezifische Nachrichtenaktionen befinden sich jetzt in den plugin-eigenen Erweiterungsverzeichnissen statt unter `src/agents/tools`, zum Beispiel:

- die Laufzeitdateien für Discord-Plugin-Aktionen
- die Laufzeitdatei für Slack-Plugin-Aktionen
- die Laufzeitdatei für Telegram-Plugin-Aktionen
- die Laufzeitdatei für WhatsApp-Plugin-Aktionen

## Kernintegrationsablauf

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

Verarbeitete Ereignisse umfassen:

- `message_start` / `message_end` / `message_update` (gestreamter Text/Thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Prompting

Nach der Einrichtung wird die Sitzung gepromptet:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Das SDK verarbeitet die vollständige Agent-Schleife: an das LLM senden, Tool-Aufrufe ausführen, Antworten streamen.

Die Bildeinfügung ist prompt-lokal: OpenClaw lädt Bildreferenzen aus dem aktuellen Prompt und
übergibt sie nur für diesen Zug über `images`. Ältere Verlaufszüge werden nicht erneut gescannt,
um Bild-Payloads erneut einzufügen.

## Tool-Architektur

### Tool-Pipeline

1. **Basistools**: die `codingTools` von pi (read, bash, edit, write)
2. **Benutzerdefinierte Ersetzungen**: OpenClaw ersetzt bash durch `exec`/`process` und passt read/edit/write für die Sandbox an
3. **OpenClaw-Tools**: Messaging, Browser, Canvas, Sitzungen, Cron, Gateway usw.
4. **Kanal-Tools**: Discord-/Telegram-/Slack-/WhatsApp-spezifische Aktionstools
5. **Richtlinienfilterung**: Tools werden nach Profil-, Provider-, Agent-, Gruppen- und Sandbox-Richtlinien gefiltert
6. **Schema-Normalisierung**: Schemata werden für Eigenheiten von Gemini/OpenAI bereinigt
7. **AbortSignal-Wrapper**: Tools werden so umschlossen, dass sie Abort-Signale berücksichtigen

### Adapter für Tool-Definitionen

Das `AgentTool` von pi-agent-core hat eine andere `execute`-Signatur als die `ToolDefinition` von pi-coding-agent. Der Adapter in `pi-tool-definition-adapter.ts` überbrückt dies:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // Die Signatur von pi-coding-agent unterscheidet sich von pi-agent-core
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

Dadurch bleiben die Richtlinienfilterung, die Sandbox-Integration und der erweiterte Tool-Satz von OpenClaw providerübergreifend konsistent.

## Erstellung des System-Prompts

Der System-Prompt wird in `buildAgentSystemPrompt()` (`system-prompt.ts`) erstellt. Er setzt einen vollständigen Prompt mit Abschnitten wie Tooling, Tool-Aufrufstil, Sicherheitsleitplanken, OpenClaw-CLI-Referenz, Skills, Dokumentation, Workspace, Sandbox, Messaging, Antwort-Tags, Sprache, stille Antworten, Heartbeats, Laufzeitmetadaten sowie bei Aktivierung Speicher und Reaktionen zusammen, zusätzlich zu optionalen Kontextdateien und weiterem Inhalt für den System-Prompt. Für den minimalen Prompt-Modus, der von Unteragenten verwendet wird, werden Abschnitte gekürzt.

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

OpenClaw umschließt dies mit `guardSessionManager()` für die Sicherheit von Tool-Ergebnissen.

### Sitzungs-Caching

`session-manager-cache.ts` cached `SessionManager`-Instanzen, um wiederholtes Parsen von Dateien zu vermeiden:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Verlaufsbegrenzung

`limitHistoryTurns()` kürzt den Gesprächsverlauf je nach Kanaltyp (DM vs. Gruppe).

### Kompaktierung

Die automatische Kompaktierung wird bei Kontextüberlauf ausgelöst. Gängige Überlaufsignaturen
umfassen `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` und `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` verarbeitet die manuelle
Kompaktierung:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentifizierung und Modellauflösung

### Auth-Profile

OpenClaw verwaltet einen Speicher für Auth-Profile mit mehreren API-Schlüsseln pro Provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile werden bei Fehlern mit Cooldown-Verfolgung rotiert:

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

// Verwendet das ModelRegistry und AuthStorage von pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` löst einen Modell-Fallback aus, wenn er konfiguriert ist:

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

### Schutz bei Kompaktierung

`src/agents/pi-hooks/compaction-safeguard.ts` fügt Leitplanken für die Kompaktierung hinzu, einschließlich adaptiver Token-Budgetierung sowie Zusammenfassungen von Tool-Fehlern und Dateivorgängen:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Kontextbeschneidung

`src/agents/pi-hooks/context-pruning.ts` implementiert eine Cache-TTL-basierte Kontextbeschneidung:

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

`EmbeddedBlockChunker` verwaltet das Streaming von Text in diskrete Antwortblöcke:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Entfernen von Thinking-/Final-Tags

Die Streaming-Ausgabe wird verarbeitet, um `<think>`-/`<thinking>`-Blöcke zu entfernen und den Inhalt von `<final>` zu extrahieren:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Inhalt von <think>...</think> entfernen
  // Wenn enforceFinalTag aktiv ist, nur Inhalt von <final>...</final> zurückgeben
};
```

### Antwortdirektiven

Antwortdirektiven wie `[[media:url]]`, `[[voice]]`, `[[reply:id]]` werden geparst und extrahiert:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Fehlerbehandlung

### Fehlerklassifizierung

`pi-embedded-helpers.ts` klassifiziert Fehler für eine passende Behandlung:

```typescript
isContextOverflowError(errorText)     // Kontext zu groß
isCompactionFailureError(errorText)   // Kompaktierung fehlgeschlagen
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
  // Sandboxed read/edit/write-Tools verwenden
  // Exec wird im Container ausgeführt
  // Browser verwendet die Bridge-URL
}
```

## Provider-spezifische Behandlung

### Anthropic

- Bereinigung des magischen Strings für Verweigerungen
- Zugvalidierung für aufeinanderfolgende Rollen
- Kompatibilität von Claude-Code-Parametern

### Google/Gemini

- Plugin-eigene Tool-Schema-Bereinigung

### OpenAI

- `apply_patch`-Tool für Codex-Modelle
- Behandlung der Herabstufung des Thinking-Levels

## TUI-Integration

OpenClaw hat auch einen lokalen TUI-Modus, der pi-tui-Komponenten direkt verwendet:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Dies bietet ein interaktives Terminal-Erlebnis ähnlich dem nativen Modus von pi.

## Wichtige Unterschiede zur Pi-CLI

| Aspekt          | Pi-CLI                  | OpenClaw Embedded                                                                                 |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Aufruf          | `pi`-Befehl / RPC       | SDK über `createAgentSession()`                                                                   |
| Tools           | Standard-Coding-Tools   | Benutzerdefinierte OpenClaw-Tool-Suite                                                            |
| System-Prompt   | AGENTS.md + Prompts     | Dynamisch pro Kanal/Kontext                                                                       |
| Sitzungsspeicher | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oder `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Einzelne Anmeldedaten   | Mehrere Profile mit Rotation                                                                       |
| Erweiterungen   | Von Datenträger geladen | Programmatisch + Datenträgerpfade                                                                 |
| Ereignisverarbeitung | TUI-Rendering      | Callback-basiert (onBlockReply usw.)                                                              |

## Zukünftige Überlegungen

Bereiche für mögliche Überarbeitungen:

1. **Abgleich der Tool-Signaturen**: Derzeit Anpassung zwischen den Signaturen von pi-agent-core und pi-coding-agent
2. **Wrapping des Session-Managers**: `guardSessionManager` sorgt für Sicherheit, erhöht aber die Komplexität
3. **Laden von Erweiterungen**: Könnte den `ResourceLoader` von pi direkter verwenden
4. **Komplexität des Streaming-Handlers**: `subscribeEmbeddedPiSession` ist umfangreich geworden
5. **Provider-Eigenheiten**: Viele provider-spezifische Codepfade, die pi möglicherweise selbst behandeln könnte

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

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (mit `OPENCLAW_LIVE_TEST=1` aktivieren)

Aktuelle Ausführungsbefehle finden Sie unter [Pi Development Workflow](/de/pi-dev).
