---
read_when:
    - Capire il design di integrazione dell'SDK Pi in OpenClaw
    - Modifica del ciclo di vita della sessione dell'agente, degli strumenti o del collegamento del provider per Pi
summary: Architettura dell'integrazione dell'agente Pi incorporato di OpenClaw e del ciclo di vita della sessione
title: architettura di integrazione Pi
x-i18n:
    generated_at: "2026-04-25T13:50:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

Questo documento descrive come OpenClaw si integra con [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e con i pacchetti correlati (`pi-ai`, `pi-agent-core`, `pi-tui`) per alimentare le sue capacità di agente AI.

## Panoramica

OpenClaw usa l'SDK pi per incorporare un agente AI di coding nella propria architettura gateway di messaggistica. Invece di avviare pi come sottoprocesso o usare la modalità RPC, OpenClaw importa e istanzia direttamente `AgentSession` di pi tramite `createAgentSession()`. Questo approccio incorporato offre:

- Controllo completo sul ciclo di vita della sessione e sulla gestione degli eventi
- Iniezione di strumenti personalizzati (messaggistica, sandbox, azioni specifiche del canale)
- Personalizzazione del system prompt per canale/contesto
- Persistenza della sessione con supporto a branching/Compaction
- Rotazione multi-account dei profili auth con failover
- Cambio di modello indipendente dal provider

## Dipendenze dei pacchetti

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Pacchetto         | Scopo                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Astrazioni LLM core: `Model`, `streamSimple`, tipi di messaggio, API provider                        |
| `pi-agent-core`   | Loop dell'agente, esecuzione degli strumenti, tipi `AgentMessage`                                     |
| `pi-coding-agent` | SDK di alto livello: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, strumenti integrati |
| `pi-tui`          | Componenti UI terminale (usati nella modalità TUI locale di OpenClaw)                                 |

## Struttura dei file

```
src/agents/
├── pi-embedded-runner.ts          # Re-export da pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entry principale: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logica del singolo tentativo con setup della sessione
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Costruisce i payload di risposta dai risultati dell'esecuzione
│   │   ├── images.ts              # Iniezione immagini per il modello vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Rilevamento degli errori di interruzione
│   ├── cache-ttl.ts               # Tracciamento del TTL della cache per il pruning del contesto
│   ├── compact.ts                 # Logica di Compaction manuale/automatica
│   ├── extensions.ts              # Carica le estensioni pi per le esecuzioni incorporate
│   ├── extra-params.ts            # Parametri stream specifici del provider
│   ├── google.ts                  # Correzioni dell'ordinamento dei turni per Google/Gemini
│   ├── history.ts                 # Limitazione della cronologia (DM vs gruppo)
│   ├── lanes.ts                   # Corsie di comando di sessione/globali
│   ├── logger.ts                  # Logger del sottosistema
│   ├── model.ts                   # Risoluzione del modello tramite ModelRegistry
│   ├── runs.ts                    # Tracciamento delle esecuzioni attive, interruzione, coda
│   ├── sandbox-info.ts            # Informazioni sandbox per il system prompt
│   ├── session-manager-cache.ts   # Caching delle istanze SessionManager
│   ├── session-manager-init.ts    # Inizializzazione del file di sessione
│   ├── system-prompt.ts           # Builder del system prompt
│   ├── tool-split.ts              # Divide gli strumenti in builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapping ThinkLevel, descrizione degli errori
├── pi-embedded-subscribe.ts       # Sottoscrizione/dispatch degli eventi della sessione
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory degli handler degli eventi
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking delle risposte a blocchi in streaming
├── pi-embedded-messaging.ts       # Tracciamento degli invii dello strumento di messaggistica
├── pi-embedded-helpers.ts         # Classificazione degli errori, validazione del turno
├── pi-embedded-helpers/           # Moduli helper
├── pi-embedded-utils.ts           # Utilità di formattazione
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Wrapping AbortSignal per gli strumenti
├── pi-tools.policy.ts             # Criteri allowlist/denylist degli strumenti
├── pi-tools.read.ts               # Personalizzazioni dello strumento read
├── pi-tools.schema.ts             # Normalizzazione dello schema degli strumenti
├── pi-tools.types.ts              # Alias di tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter da AgentTool a ToolDefinition
├── pi-settings.ts                 # Override delle impostazioni
├── pi-hooks/                      # Hook pi personalizzati
│   ├── compaction-safeguard.ts    # Estensione di protezione
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Estensione di pruning del contesto con Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Risoluzione del profilo auth
├── auth-profiles.ts               # Store dei profili, cooldown, failover
├── model-selection.ts             # Risoluzione del modello predefinito
├── models-config.ts               # Generazione di models.json
├── model-catalog.ts               # Cache del catalogo modelli
├── context-window-guard.ts        # Validazione della finestra di contesto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Risoluzione dei parametri del system prompt
├── system-prompt-report.ts        # Generazione del report di debug
├── tool-summaries.ts              # Riepiloghi delle descrizioni degli strumenti
├── tool-policy.ts                 # Risoluzione dei criteri degli strumenti
├── transcript-policy.ts           # Criteri di validazione della trascrizione
├── skills.ts                      # Snapshot delle skill / costruzione del prompt
├── skills/                        # Sottosistema skill
├── sandbox.ts                     # Risoluzione del contesto sandbox
├── sandbox/                       # Sottosistema sandbox
├── channel-tools.ts               # Iniezione di strumenti specifici del canale
├── openclaw-tools.ts              # Strumenti specifici di OpenClaw
├── bash-tools.ts                  # Strumenti exec/process
├── apply-patch.ts                 # Strumento apply_patch (OpenAI)
├── tools/                         # Implementazioni dei singoli strumenti
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

I runtime delle azioni sui messaggi specifici del canale ora si trovano nelle directory
delle estensioni gestite dal plugin invece che sotto `src/agents/tools`, per esempio:

- i file runtime delle azioni del plugin Discord
- il file runtime delle azioni del plugin Slack
- il file runtime delle azioni del plugin Telegram
- il file runtime delle azioni del plugin WhatsApp

## Flusso di integrazione core

### 1. Esecuzione di un agente incorporato

Il punto di ingresso principale è `runEmbeddedPiAgent()` in `pi-embedded-runner/run.ts`:

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

### 2. Creazione della sessione

All'interno di `runEmbeddedAttempt()` (chiamato da `runEmbeddedPiAgent()`), viene usato l'SDK pi:

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

### 3. Sottoscrizione agli eventi

`subscribeEmbeddedPiSession()` si sottoscrive agli eventi `AgentSession` di pi:

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

Gli eventi gestiti includono:

- `message_start` / `message_end` / `message_update` (testo/thinking in streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Dopo il setup, la sessione riceve il prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

L'SDK gestisce l'intero loop dell'agente: invio all'LLM, esecuzione delle chiamate agli strumenti, streaming delle risposte.

L'iniezione delle immagini è locale al prompt: OpenClaw carica i riferimenti immagine dal prompt corrente e
li passa tramite `images` solo per quel turno. Non riesegue la scansione dei turni più vecchi della cronologia
per reiniettare i payload delle immagini.

## Architettura degli strumenti

### Pipeline degli strumenti

1. **Strumenti base**: `codingTools` di pi (`read`, `bash`, `edit`, `write`)
2. **Sostituzioni personalizzate**: OpenClaw sostituisce bash con `exec`/`process`, personalizza read/edit/write per la sandbox
3. **Strumenti OpenClaw**: messaggistica, browser, canvas, sessioni, cron, gateway, ecc.
4. **Strumenti di canale**: strumenti di azione specifici per Discord/Telegram/Slack/WhatsApp
5. **Filtraggio tramite criteri**: gli strumenti vengono filtrati in base a criteri di profilo, provider, agente, gruppo, sandbox
6. **Normalizzazione dello schema**: gli schemi vengono ripuliti per le particolarità di Gemini/OpenAI
7. **Wrapping con AbortSignal**: gli strumenti vengono wrappati per rispettare gli abort signal

### Adapter della definizione degli strumenti

`AgentTool` di pi-agent-core ha una firma `execute` diversa da `ToolDefinition` di pi-coding-agent. L'adapter in `pi-tool-definition-adapter.ts` fa da ponte:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategia di suddivisione degli strumenti

`splitSdkTools()` passa tutti gli strumenti tramite `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Questo garantisce che il filtraggio dei criteri di OpenClaw, l'integrazione della sandbox e il set esteso di strumenti restino coerenti tra i provider.

## Costruzione del system prompt

Il system prompt viene costruito in `buildAgentSystemPrompt()` (`system-prompt.ts`). Assembla un prompt completo con sezioni che includono Tooling, Tool Call Style, guardrail di sicurezza, riferimento CLI di OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeat, metadati runtime, oltre a Memory e Reactions quando abilitati, e file di contesto facoltativi e contenuto extra del system prompt. Le sezioni vengono ridotte per la modalità prompt minima usata dai subagent.

Il prompt viene applicato dopo la creazione della sessione tramite `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestione della sessione

### File di sessione

Le sessioni sono file JSONL con struttura ad albero (collegamento id/parentId). Il `SessionManager` di Pi gestisce la persistenza:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw lo avvolge con `guardSessionManager()` per la sicurezza dei risultati degli strumenti.

### Caching della sessione

`session-manager-cache.ts` mette in cache le istanze di SessionManager per evitare parsing ripetuti dei file:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitazione della cronologia

`limitHistoryTurns()` riduce la cronologia della conversazione in base al tipo di canale (DM vs gruppo).

### Compaction

La Compaction automatica si attiva in caso di overflow del contesto. Le firme comuni di overflow
includono `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` e `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` gestisce la
Compaction manuale:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticazione e risoluzione del modello

### Profili auth

OpenClaw mantiene uno store di profili auth con più chiavi API per provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

I profili ruotano in caso di errori con tracciamento del cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Risoluzione del modello

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` attiva il fallback del modello quando configurato:

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

## Estensioni Pi

OpenClaw carica estensioni Pi personalizzate per comportamenti specializzati:

### Protezione Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` aggiunge guardrail alla Compaction, inclusi budgeting adattivo dei token più riepiloghi degli errori degli strumenti e delle operazioni sui file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Pruning del contesto

`src/agents/pi-hooks/context-pruning.ts` implementa il pruning del contesto basato su Cache-TTL:

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

## Streaming e risposte a blocchi

### Chunking dei blocchi

`EmbeddedBlockChunker` gestisce il testo in streaming trasformandolo in blocchi di risposta distinti:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Rimozione dei tag Thinking/Final

L'output in streaming viene elaborato per rimuovere i blocchi `<think>`/`<thinking>` ed estrarre il contenuto `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Direttive di risposta

Le direttive di risposta come `[[media:url]]`, `[[voice]]`, `[[reply:id]]` vengono analizzate ed estratte:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Gestione degli errori

### Classificazione degli errori

`pi-embedded-helpers.ts` classifica gli errori per una gestione appropriata:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback del livello di thinking

Se un livello di thinking non è supportato, viene usato il fallback:

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

## Integrazione della sandbox

Quando la modalità sandbox è abilitata, strumenti e percorsi vengono vincolati:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## Gestione specifica del provider

### Anthropic

- Rimozione della stringa magica di rifiuto
- Validazione del turno per ruoli consecutivi
- Validazione rigorosa upstream dei parametri degli strumenti Pi

### Google/Gemini

- Sanificazione dello schema degli strumenti gestita dal plugin

### OpenAI

- Strumento `apply_patch` per i modelli Codex
- Gestione del downgrade del livello di thinking

## Integrazione TUI

OpenClaw ha anche una modalità TUI locale che usa direttamente i componenti di pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Questo fornisce l'esperienza terminale interattiva simile alla modalità nativa di pi.

## Differenze chiave rispetto alla CLI Pi

| Aspetto         | Pi CLI                  | OpenClaw incorporato                                                                              |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Invocazione     | comando `pi` / RPC      | SDK tramite `createAgentSession()`                                                                |
| Strumenti       | Strumenti di coding predefiniti | Suite di strumenti OpenClaw personalizzata                                                   |
| System prompt   | AGENTS.md + prompt      | Dinamico per canale/contesto                                                                      |
| Archiviazione sessione | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oppure `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Credenziale singola     | Multi-profilo con rotazione                                                                       |
| Estensioni      | Caricate da disco       | Percorsi programmatici + da disco                                                                 |
| Gestione eventi | Rendering TUI           | Basata su callback (`onBlockReply`, ecc.)                                                         |

## Considerazioni future

Aree di possibile revisione:

1. **Allineamento della firma degli strumenti**: attualmente adattamento tra le firme pi-agent-core e pi-coding-agent
2. **Wrapping del session manager**: `guardSessionManager` aggiunge sicurezza ma aumenta la complessità
3. **Caricamento delle estensioni**: potrebbe usare `ResourceLoader` di pi più direttamente
4. **Complessità dell'handler di streaming**: `subscribeEmbeddedPiSession` è cresciuto molto
5. **Particolarità dei provider**: molti codepath specifici del provider che potenzialmente pi potrebbe gestire

## Test

La copertura dell'integrazione Pi comprende queste suite:

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (abilita `OPENCLAW_LIVE_TEST=1`)

Per i comandi di esecuzione correnti, vedi [Pi Development Workflow](/it/pi-dev).

## Correlati

- [Pi development workflow](/it/pi-dev)
- [Panoramica dell'installazione](/it/install)
