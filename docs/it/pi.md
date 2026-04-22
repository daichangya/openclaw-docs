---
read_when:
    - Comprendere la progettazione dell'integrazione dell'SDK Pi in OpenClaw
    - Modifica del ciclo di vita della sessione dell'agente, dei tool o del collegamento del provider per Pi
summary: Architettura dell'integrazione dell'agente Pi incorporato di OpenClaw e ciclo di vita della sessione
title: Architettura dell'integrazione Pi
x-i18n:
    generated_at: "2026-04-22T04:23:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# Architettura dell'integrazione Pi

Questo documento descrive come OpenClaw si integra con [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e con i package correlati (`pi-ai`, `pi-agent-core`, `pi-tui`) per alimentare le sue capacità di agente AI.

## Panoramica

OpenClaw usa l'SDK pi per incorporare un agente AI di coding nella propria architettura gateway di messaggistica. Invece di avviare pi come sottoprocesso o usare la modalità RPC, OpenClaw importa e istanzia direttamente `AgentSession` di pi tramite `createAgentSession()`. Questo approccio incorporato offre:

- Controllo completo del ciclo di vita della sessione e della gestione degli eventi
- Iniezione di tool personalizzati (messaggistica, sandbox, azioni specifiche del canale)
- Personalizzazione del system prompt per canale/contesto
- Persistenza della sessione con supporto per branching/Compaction
- Rotazione multi-account dei profili auth con failover
- Cambio modello indipendente dal provider

## Dipendenze dei package

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Package           | Purpose                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Astrazioni LLM di base: `Model`, `streamSimple`, tipi di messaggio, API provider                           |
| `pi-agent-core`   | Loop dell'agente, esecuzione dei tool, tipi `AgentMessage`                                                       |
| `pi-coding-agent` | SDK di alto livello: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, tool integrati |
| `pi-tui`          | Componenti UI terminale (usati nella modalità TUI locale di OpenClaw)                                             |

## Struttura dei file

```
src/agents/
├── pi-embedded-runner.ts          # Re-export da pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entry principale: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logica di singolo tentativo con setup della sessione
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Costruisce i payload di risposta dai risultati di esecuzione
│   │   ├── images.ts              # Iniezione immagini del modello vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Rilevamento errori di interruzione
│   ├── cache-ttl.ts               # Tracciamento Cache TTL per il pruning del contesto
│   ├── compact.ts                 # Logica di Compaction manuale/automatica
│   ├── extensions.ts              # Carica le estensioni pi per le esecuzioni incorporate
│   ├── extra-params.ts            # Parametri di stream specifici del provider
│   ├── google.ts                  # Correzioni dell'ordinamento dei turni Google/Gemini
│   ├── history.ts                 # Limitazione della cronologia (DM vs gruppo)
│   ├── lanes.ts                   # Lane dei comandi session/global
│   ├── logger.ts                  # Logger del sottosistema
│   ├── model.ts                   # Risoluzione del modello tramite ModelRegistry
│   ├── runs.ts                    # Tracciamento esecuzioni attive, interruzione, coda
│   ├── sandbox-info.ts            # Informazioni sandbox per il system prompt
│   ├── session-manager-cache.ts   # Caching delle istanze SessionManager
│   ├── session-manager-init.ts    # Inizializzazione del file di sessione
│   ├── system-prompt.ts           # Builder del system prompt
│   ├── tool-split.ts              # Suddivide i tool in builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mappatura ThinkLevel, descrizione errore
├── pi-embedded-subscribe.ts       # Sottoscrizione/dispatch degli eventi di sessione
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory di handler evento
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Suddivisione in blocchi delle risposte streaming
├── pi-embedded-messaging.ts       # Tracciamento degli invii del tool di messaggistica
├── pi-embedded-helpers.ts         # Classificazione errori, validazione turni
├── pi-embedded-helpers/           # Moduli helper
├── pi-embedded-utils.ts           # Utility di formattazione
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Wrapping AbortSignal per i tool
├── pi-tools.policy.ts             # Policy allowlist/denylist dei tool
├── pi-tools.read.ts               # Personalizzazioni del tool read
├── pi-tools.schema.ts             # Normalizzazione dello schema dei tool
├── pi-tools.types.ts              # Alias di tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Override delle impostazioni
├── pi-hooks/                      # Hook pi personalizzati
│   ├── compaction-safeguard.ts    # Estensione di salvaguardia
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Estensione di pruning del contesto Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Risoluzione del profilo auth
├── auth-profiles.ts               # Store profili, cooldown, failover
├── model-selection.ts             # Risoluzione del modello predefinito
├── models-config.ts               # Generazione di models.json
├── model-catalog.ts               # Cache del catalogo modelli
├── context-window-guard.ts        # Validazione della finestra di contesto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Risoluzione dei parametri del system prompt
├── system-prompt-report.ts        # Generazione report di debug
├── tool-summaries.ts              # Riepiloghi delle descrizioni dei tool
├── tool-policy.ts                 # Risoluzione della policy dei tool
├── transcript-policy.ts           # Policy di validazione del transcript
├── skills.ts                      # Snapshot/building del prompt delle Skills
├── skills/                        # Sottosistema Skills
├── sandbox.ts                     # Risoluzione del contesto sandbox
├── sandbox/                       # Sottosistema sandbox
├── channel-tools.ts               # Iniezione di tool specifici del canale
├── openclaw-tools.ts              # Tool specifici di OpenClaw
├── bash-tools.ts                  # Tool exec/process
├── apply-patch.ts                 # Tool apply_patch (OpenAI)
├── tools/                         # Implementazioni dei singoli tool
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

I runtime delle azioni messaggio specifiche del canale ora si trovano nelle directory
di estensione possedute dal Plugin invece che in `src/agents/tools`, per esempio:

- i file runtime delle azioni del Plugin Discord
- il file runtime delle azioni del Plugin Slack
- il file runtime delle azioni del Plugin Telegram
- il file runtime delle azioni del Plugin WhatsApp

## Flusso di integrazione principale

### 1. Esecuzione di un agente incorporato

L'entry principale è `runEmbeddedPiAgent()` in `pi-embedded-runner/run.ts`:

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

`subscribeEmbeddedPiSession()` si sottoscrive agli eventi di `AgentSession` di pi:

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

- `message_start` / `message_end` / `message_update` (streaming di testo/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Dopo il setup, la sessione riceve il prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

L'SDK gestisce l'intero loop dell'agente: invio all'LLM, esecuzione delle chiamate tool, streaming delle risposte.

L'iniezione delle immagini è locale al prompt: OpenClaw carica i riferimenti immagine dal prompt corrente e
li passa tramite `images` solo per quel turno. Non riesamina i turni di cronologia precedenti
per re-iniettare i payload immagine.

## Architettura dei tool

### Pipeline dei tool

1. **Tool di base**: `codingTools` di pi (`read`, `bash`, `edit`, `write`)
2. **Sostituzioni personalizzate**: OpenClaw sostituisce bash con `exec`/`process`, personalizza read/edit/write per la sandbox
3. **Tool OpenClaw**: messaggistica, browser, canvas, sessioni, Cron, gateway, ecc.
4. **Tool del canale**: tool di azione specifici per Discord/Telegram/Slack/WhatsApp
5. **Filtraggio della policy**: tool filtrati per profilo, provider, agente, gruppo, policy sandbox
6. **Normalizzazione dello schema**: schemi ripuliti per le particolarità di Gemini/OpenAI
7. **Wrapping AbortSignal**: tool incapsulati per rispettare i segnali di interruzione

### Adapter di definizione tool

`AgentTool` di pi-agent-core ha una firma `execute` diversa da `ToolDefinition` di pi-coding-agent. L'adapter in `pi-tool-definition-adapter.ts` colma questa differenza:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // la firma di pi-coding-agent differisce da quella di pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategia di suddivisione dei tool

`splitSdkTools()` passa tutti i tool tramite `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Vuoto. Sovrascriviamo tutto
    customTools: toToolDefinitions(options.tools),
  };
}
```

Questo garantisce che il filtraggio delle policy, l'integrazione sandbox e il set di tool esteso di OpenClaw restino coerenti tra i provider.

## Costruzione del system prompt

Il system prompt viene costruito in `buildAgentSystemPrompt()` (`system-prompt.ts`). Assembla un prompt completo con sezioni che includono Tooling, stile delle chiamate tool, guardrail di sicurezza, riferimento CLI di OpenClaw, Skills, documentazione, workspace, sandbox, messaggistica, Reply Tags, voce, Silent Replies, Heartbeat, metadati di runtime, più Memory e Reactions quando abilitati, oltre a file di contesto facoltativi e contenuto aggiuntivo del system prompt. Le sezioni vengono ridotte per la modalità prompt minima usata dai sottoagenti.

Il prompt viene applicato dopo la creazione della sessione tramite `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestione della sessione

### File di sessione

Le sessioni sono file JSONL con struttura ad albero (collegamento id/parentId). `SessionManager` di Pi gestisce la persistenza:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw lo incapsula con `guardSessionManager()` per la sicurezza dei risultati dei tool.

### Caching della sessione

`session-manager-cache.ts` mette in cache le istanze di SessionManager per evitare il parsing ripetuto dei file:

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

OpenClaw mantiene uno store di profili auth con più API key per provider:

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

// Usa ModelRegistry e AuthStorage di Pi
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

### Salvaguardia della Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` aggiunge guardrail alla Compaction, inclusi budgeting adattivo dei token più riepiloghi degli errori dei tool e delle operazioni sui file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Pruning del contesto

`src/agents/pi-hooks/context-pruning.ts` implementa il pruning del contesto basato su Cache TTL:

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

## Streaming e block reply

### Suddivisione in blocchi

`EmbeddedBlockChunker` gestisce lo streaming del testo in blocchi di risposta discreti:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Rimozione dei tag Thinking/Final

L'output in streaming viene elaborato per rimuovere i blocchi `<think>`/`<thinking>` ed estrarre il contenuto `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Rimuove il contenuto <think>...</think>
  // Se enforceFinalTag è attivo, restituisce solo il contenuto <final>...</final>
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
isContextOverflowError(errorText)     // Contesto troppo grande
isCompactionFailureError(errorText)   // Compaction non riuscita
isAuthAssistantError(lastAssistant)   // Errore di autenticazione
isRateLimitAssistantError(...)        // Rate limit raggiunto
isFailoverAssistantError(...)         // Deve fare failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback del livello di thinking

Se un livello di thinking non è supportato, viene usato un fallback:

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

## Integrazione sandbox

Quando la modalità sandbox è abilitata, tool e percorsi sono vincolati:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Usa tool read/edit/write con sandbox
  // Exec viene eseguito nel container
  // Browser usa l'URL bridge
}
```

## Gestione specifica del provider

### Anthropic

- Rimozione della magic string di rifiuto
- Validazione del turno per ruoli consecutivi
- Validazione rigorosa upstream dei parametri tool di Pi

### Google/Gemini

- Sanitizzazione dello schema dei tool posseduta dal Plugin

### OpenAI

- Tool `apply_patch` per i modelli Codex
- Gestione del downgrade del livello di thinking

## Integrazione TUI

OpenClaw ha anche una modalità TUI locale che usa direttamente i componenti pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Questo fornisce l'esperienza terminale interattiva simile alla modalità nativa di Pi.

## Differenze chiave rispetto alla CLI Pi

| Aspect          | Pi CLI                  | OpenClaw incorporato                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation      | comando `pi` / RPC      | SDK tramite `createAgentSession()`                                                                 |
| Tools           | Tool di coding predefiniti    | Suite di tool OpenClaw personalizzata                                                                     |
| System prompt   | AGENTS.md + prompt     | Dinamico per canale/contesto                                                                    |
| Session storage | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (oppure `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Credenziale singola       | Multi-profile con rotazione                                                                    |
| Extensions      | Caricate da disco        | Percorsi programmatici + su disco                                                                      |
| Event handling  | Rendering TUI           | Basato su callback (`onBlockReply`, ecc.)                                                            |

## Considerazioni future

Aree da poter rivedere in futuro:

1. **Allineamento della firma dei tool**: attualmente viene effettuato l'adattamento tra le firme di pi-agent-core e pi-coding-agent
2. **Wrapping del session manager**: `guardSessionManager` aggiunge sicurezza ma aumenta la complessità
3. **Caricamento delle estensioni**: potrebbe usare `ResourceLoader` di Pi più direttamente
4. **Complessità dell'handler di streaming**: `subscribeEmbeddedPiSession` è diventato grande
5. **Particolarità dei provider**: molti codepath specifici del provider che Pi potrebbe potenzialmente gestire

## Test

La copertura dell'integrazione Pi si estende a queste suite:

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

Per i comandi di esecuzione correnti, vedi [Workflow di sviluppo Pi](/it/pi-dev).
