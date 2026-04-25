---
read_when:
    - Zrozumienie projektu integracji Pi SDK w OpenClaw.
    - Modyfikowanie cyklu życia sesji agenta, narzędzi lub połączeń dostawców dla Pi.
summary: Architektura osadzonej integracji agenta Pi w OpenClaw i cykl życia sesji
title: Architektura integracji Pi
x-i18n:
    generated_at: "2026-04-25T13:51:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

Ten dokument opisuje, jak OpenClaw integruje się z [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) i powiązanymi pakietami (`pi-ai`, `pi-agent-core`, `pi-tui`), aby zapewnić możliwości agenta AI.

## Przegląd

OpenClaw używa SDK pi do osadzenia agenta kodującego AI w swojej architekturze gateway komunikacyjnego. Zamiast uruchamiać pi jako podproces lub używać trybu RPC, OpenClaw bezpośrednio importuje i tworzy instancję `AgentSession` pi przez `createAgentSession()`. To osadzone podejście zapewnia:

- pełną kontrolę nad cyklem życia sesji i obsługą zdarzeń
- własne wstrzykiwanie narzędzi (wiadomości, sandbox, działania specyficzne dla kanału)
- dostosowanie system prompta dla każdego kanału/kontekstu
- trwałość sesji z obsługą branching/Compaction
- rotację wielu profili auth kont z failoverem
- przełączanie modeli niezależne od dostawcy

## Zależności pakietów

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Pakiet            | Cel                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Podstawowe abstrakcje LLM: `Model`, `streamSimple`, typy wiadomości, API dostawców                   |
| `pi-agent-core`   | Pętla agenta, wykonywanie narzędzi, typy `AgentMessage`                                               |
| `pi-coding-agent` | SDK wyższego poziomu: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, wbudowane narzędzia |
| `pi-tui`          | Komponenty terminalowego UI (używane w lokalnym trybie TUI OpenClaw)                                  |

## Struktura plików

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports z pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Główne wejście: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika pojedynczej próby z konfiguracją sesji
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Budowanie payloadów odpowiedzi z wyników uruchomienia
│   │   ├── images.ts              # Wstrzykiwanie obrazów dla modelu vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Wykrywanie błędów przerwania
│   ├── cache-ttl.ts               # Śledzenie cache TTL dla przycinania kontekstu
│   ├── compact.ts                 # Ręczna/automatyczna logika Compaction
│   ├── extensions.ts              # Ładowanie rozszerzeń pi dla uruchomień osadzonych
│   ├── extra-params.ts            # Parametry streamingu specyficzne dla dostawcy
│   ├── google.ts                  # Poprawki kolejności tur Google/Gemini
│   ├── history.ts                 # Ograniczanie historii (DM vs grupa)
│   ├── lanes.ts                   # Ścieżki poleceń sesji/globalne
│   ├── logger.ts                  # Logger podsystemu
│   ├── model.ts                   # Rozwiązywanie modelu przez ModelRegistry
│   ├── runs.ts                    # Śledzenie aktywnych uruchomień, przerwanie, kolejka
│   ├── sandbox-info.ts            # Informacje o sandboxie dla system prompta
│   ├── session-manager-cache.ts   # Cache instancji SessionManager
│   ├── session-manager-init.ts    # Inicjalizacja pliku sesji
│   ├── system-prompt.ts           # Budowniczy system prompta
│   ├── tool-split.ts              # Podział narzędzi na builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapowanie ThinkLevel, opis błędów
├── pi-embedded-subscribe.ts       # Subskrypcja/wysyłka zdarzeń sesji
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fabryka handlerów zdarzeń
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Dzielenie strumieniowanych odpowiedzi blokowych
├── pi-embedded-messaging.ts       # Śledzenie wysłanych wiadomości przez narzędzie wiadomości
├── pi-embedded-helpers.ts         # Klasyfikacja błędów, walidacja tur
├── pi-embedded-helpers/           # Moduły pomocnicze
├── pi-embedded-utils.ts           # Narzędzia formatowania
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Owijanie AbortSignal dla narzędzi
├── pi-tools.policy.ts             # Polityka allowlist/denylist narzędzi
├── pi-tools.read.ts               # Dostosowania narzędzia read
├── pi-tools.schema.ts             # Normalizacja schematów narzędzi
├── pi-tools.types.ts              # Alias typu AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Nadpisania ustawień
├── pi-hooks/                      # Własne hooki pi
│   ├── compaction-safeguard.ts    # Rozszerzenie ochronne
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Rozszerzenie przycinania kontekstu cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Rozwiązywanie profili auth
├── auth-profiles.ts               # Magazyn profili, cooldown, failover
├── model-selection.ts             # Rozwiązywanie modelu domyślnego
├── models-config.ts               # Generowanie models.json
├── model-catalog.ts               # Cache katalogu modeli
├── context-window-guard.ts        # Walidacja okna kontekstu
├── failover-error.ts              # Klasa FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Rozwiązywanie parametrów system prompta
├── system-prompt-report.ts        # Generowanie raportu debug
├── tool-summaries.ts              # Podsumowania opisów narzędzi
├── tool-policy.ts                 # Rozwiązywanie polityki narzędzi
├── transcript-policy.ts           # Polityka walidacji transkryptu
├── skills.ts                      # Migawka/build prompta Skills
├── skills/                        # Podsystem Skills
├── sandbox.ts                     # Rozwiązywanie kontekstu sandboxa
├── sandbox/                       # Podsystem sandboxa
├── channel-tools.ts               # Wstrzykiwanie narzędzi specyficznych dla kanału
├── openclaw-tools.ts              # Narzędzia specyficzne dla OpenClaw
├── bash-tools.ts                  # Narzędzia exec/process
├── apply-patch.ts                 # Narzędzie apply_patch (OpenAI)
├── tools/                         # Implementacje poszczególnych narzędzi
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

Runtime’y działań wiadomości specyficzne dla kanału znajdują się teraz w katalogach
rozszerzeń należących do Pluginów zamiast pod `src/agents/tools`, na przykład:

- pliki runtime działań Pluginu Discord
- plik runtime działań Pluginu Slack
- plik runtime działań Pluginu Telegram
- plik runtime działań Pluginu WhatsApp

## Główny przepływ integracji

### 1. Uruchamianie osadzonego agenta

Głównym punktem wejścia jest `runEmbeddedPiAgent()` w `pi-embedded-runner/run.ts`:

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

### 2. Tworzenie sesji

Wewnątrz `runEmbeddedAttempt()` (wywoływanego przez `runEmbeddedPiAgent()`) używane jest SDK pi:

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

### 3. Subskrypcja zdarzeń

`subscribeEmbeddedPiSession()` subskrybuje zdarzenia `AgentSession` pi:

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

Obsługiwane zdarzenia obejmują:

- `message_start` / `message_end` / `message_update` (strumieniowanie tekstu/myślenia)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Promptowanie

Po konfiguracji sesja otrzymuje prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK obsługuje pełną pętlę agenta: wysyłanie do LLM, wykonywanie wywołań narzędzi, strumieniowanie odpowiedzi.

Wstrzykiwanie obrazów jest lokalne dla prompta: OpenClaw ładuje referencje obrazów z bieżącego prompta i
przekazuje je przez `images` tylko dla tej tury. Nie skanuje ponownie starszych tur historii,
aby ponownie wstrzyknąć payloady obrazów.

## Architektura narzędzi

### Pipeline narzędzi

1. **Narzędzia bazowe**: `codingTools` pi (`read`, `bash`, `edit`, `write`)
2. **Własne zamienniki**: OpenClaw zastępuje bash przez `exec`/`process`, dostosowuje read/edit/write do sandboxa
3. **Narzędzia OpenClaw**: wiadomości, browser, canvas, sesje, cron, gateway itd.
4. **Narzędzia kanałów**: narzędzia działań specyficzne dla Discord/Telegram/Slack/WhatsApp
5. **Filtrowanie polityką**: narzędzia filtrowane według profilu, dostawcy, agenta, grupy, polityk sandboxa
6. **Normalizacja schematów**: schematy czyszczone pod osobliwości Gemini/OpenAI
7. **Owijanie AbortSignal**: narzędzia owijane, aby respektowały sygnały przerwania

### Adapter definicji narzędzi

`AgentTool` z pi-agent-core ma inny podpis `execute` niż `ToolDefinition` z pi-coding-agent. Adapter w `pi-tool-definition-adapter.ts` łączy te dwa światy:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // podpis pi-coding-agent różni się od pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Strategia podziału narzędzi

`splitSdkTools()` przekazuje wszystkie narzędzia przez `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Puste. Nadpisujemy wszystko
    customTools: toToolDefinitions(options.tools),
  };
}
```

Dzięki temu filtrowanie polityk OpenClaw, integracja z sandboxem i rozszerzony zestaw narzędzi pozostają spójne u wszystkich dostawców.

## Budowanie system prompta

System prompt jest budowany w `buildAgentSystemPrompt()` (`system-prompt.ts`). Składa pełny prompt z sekcjami obejmującymi Tooling, Tool Call Style, Safety guardrails, dokumentację CLI OpenClaw, Skills, dokumentację, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, metadane runtime’u, a także Memory i Reactions, gdy są włączone, oraz opcjonalne pliki kontekstowe i dodatkową zawartość system prompta. Sekcje są przycinane dla minimalnego trybu prompta używanego przez subagentów.

Prompt jest stosowany po utworzeniu sesji przez `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Zarządzanie sesją

### Pliki sesji

Sesje to pliki JSONL o strukturze drzewa (łączenie przez `id`/`parentId`). Trwałością zarządza `SessionManager` z Pi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw opakowuje to przez `guardSessionManager()` dla bezpieczeństwa wyników narzędzi.

### Cache sesji

`session-manager-cache.ts` przechowuje instancje SessionManager w cache, aby uniknąć wielokrotnego parsowania plików:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Ograniczanie historii

`limitHistoryTurns()` przycina historię konwersacji zależnie od typu kanału (DM vs grupa).

### Compaction

Automatyczny Compaction uruchamia się przy przepełnieniu kontekstu. Typowe sygnatury przepełnienia obejmują
`request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` oraz `ollama error: context
length exceeded`. Ręczny
Compaction obsługuje `compactEmbeddedPiSessionDirect()`:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Uwierzytelnianie i rozwiązywanie modeli

### Profile auth

OpenClaw utrzymuje magazyn profili auth z wieloma kluczami API dla każdego dostawcy:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile rotują przy błędach z uwzględnieniem śledzenia cooldownów:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Rozwiązywanie modeli

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Używa ModelRegistry i AuthStorage z Pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` uruchamia fallback modelu, gdy jest skonfigurowany:

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

## Rozszerzenia Pi

OpenClaw ładuje własne rozszerzenia Pi do wyspecjalizowanych zachowań:

### Ochrona Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` dodaje zabezpieczenia do Compaction, w tym adaptacyjne budżetowanie tokenów oraz podsumowania błędów narzędzi i operacji na plikach:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Przycinanie kontekstu

`src/agents/pi-hooks/context-pruning.ts` implementuje przycinanie kontekstu oparte na cache-TTL:

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

## Streamowanie i odpowiedzi blokowe

### Dzielenie bloków

`EmbeddedBlockChunker` zarządza dzieleniem tekstu strumieniowanego na oddzielne bloki odpowiedzi:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Usuwanie tagów myślenia/końcowych

Wyjście streamingu jest przetwarzane w celu usunięcia bloków `<think>`/`<thinking>` i wyodrębnienia treści `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Dyrektywy odpowiedzi

Dyrektywy odpowiedzi, takie jak `[[media:url]]`, `[[voice]]`, `[[reply:id]]`, są parsowane i wyodrębniane:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Obsługa błędów

### Klasyfikacja błędów

`pi-embedded-helpers.ts` klasyfikuje błędy do odpowiedniej obsługi:

```typescript
isContextOverflowError(errorText)     // Kontekst jest zbyt duży
isCompactionFailureError(errorText)   // Compaction nie powiódł się
isAuthAssistantError(lastAssistant)   // Błąd auth
isRateLimitAssistantError(...)        // Osiągnięto limit szybkości
isFailoverAssistantError(...)         // Należy wykonać failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback poziomu myślenia

Jeśli poziom myślenia nie jest obsługiwany, następuje fallback:

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

## Integracja z sandboxem

Gdy tryb sandbox jest włączony, narzędzia i ścieżki są ograniczane:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Używaj narzędzi read/edit/write w sandboxie
  // Exec działa w kontenerze
  // Browser używa bridge URL
}
```

## Obsługa specyficzna dla dostawcy

### Anthropic

- usuwanie magicznego ciągu odmowy
- walidacja tury dla kolejnych ról
- ścisła walidacja parametrów narzędzi upstream Pi

### Google/Gemini

- sanityzacja schematów narzędzi należących do Pluginu

### OpenAI

- narzędzie `apply_patch` dla modeli Codex
- obsługa obniżania poziomu myślenia

## Integracja z TUI

OpenClaw ma też lokalny tryb TUI, który bezpośrednio używa komponentów pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Zapewnia to interaktywne doświadczenie terminalowe podobne do natywnego trybu Pi.

## Kluczowe różnice względem Pi CLI

| Aspekt          | Pi CLI                  | Osadzony OpenClaw                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Wywołanie       | polecenie `pi` / RPC    | SDK przez `createAgentSession()`                                                               |
| Narzędzia       | Domyślne narzędzia coding | Własny zestaw narzędzi OpenClaw                                                              |
| System prompt   | AGENTS.md + prompty     | Dynamiczny dla każdego kanału/kontekstu                                                        |
| Przechowywanie sesji | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (lub `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Jedne dane uwierzytelniające | Wiele profili z rotacją                                                                    |
| Rozszerzenia    | Ładowane z dysku        | Ścieżki programowe + dyskowe                                                                    |
| Obsługa zdarzeń | Renderowanie TUI        | Oparte na callbackach (`onBlockReply` itd.)                                                    |

## Przyszłe kwestie do rozważenia

Obszary potencjalnych przeróbek:

1. **Wyrównanie podpisów narzędzi**: obecnie adaptacja między podpisami pi-agent-core i pi-coding-agent
2. **Opakowanie session managera**: `guardSessionManager` zwiększa bezpieczeństwo, ale też złożoność
3. **Ładowanie rozszerzeń**: mogłoby bardziej bezpośrednio używać `ResourceLoader` z Pi
4. **Złożoność handlera streamingu**: `subscribeEmbeddedPiSession` znacznie się rozrósł
5. **Osobliwości dostawców**: wiele ścieżek kodu specyficznych dla dostawców, które Pi mogłoby potencjalnie obsługiwać

## Testy

Pokrycie integracji Pi obejmuje te zestawy:

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

Na żywo/opcjonalnie:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (włącz przez `OPENCLAW_LIVE_TEST=1`)

Aktualne polecenia uruchamiania znajdziesz w [Workflow development Pi](/pl/pi-dev).

## Powiązane

- [Workflow development Pi](/pl/pi-dev)
- [Przegląd instalacji](/pl/install)
