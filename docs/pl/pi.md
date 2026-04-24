---
read_when:
    - Zrozumienie projektu integracji SDK Pi w OpenClaw
    - Modyfikowanie cyklu życia sesji agenta, narzędzi lub połączeń dostawcy dla Pi
summary: Architektura integracji osadzonego agenta Pi w OpenClaw oraz cykl życia sesji
title: Architektura integracji Pi
x-i18n:
    generated_at: "2026-04-24T15:22:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

Ten dokument opisuje, jak OpenClaw integruje się z [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) oraz jego pakietami pokrewnymi (`pi-ai`, `pi-agent-core`, `pi-tui`), aby zapewnić możliwości agenta AI.

## Przegląd

OpenClaw używa SDK pi do osadzenia agenta kodującego AI w swojej architekturze bramki komunikacyjnej. Zamiast uruchamiać pi jako podproces lub używać trybu RPC, OpenClaw bezpośrednio importuje i tworzy instancję `AgentSession` za pomocą `createAgentSession()`. To osadzone podejście zapewnia:

- Pełną kontrolę nad cyklem życia sesji i obsługą zdarzeń
- Wstrzykiwanie niestandardowych narzędzi (komunikacja, sandbox, działania specyficzne dla kanału)
- Dostosowanie promptu systemowego dla każdego kanału/kontekstu
- Trwałość sesji z obsługą rozgałęziania/Compaction
- Rotację profili uwierzytelniania dla wielu kont z mechanizmem failover
- Niezależne od dostawcy przełączanie modeli

## Zależności pakietów

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Pakiet            | Przeznaczenie                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Podstawowe abstrakcje LLM: `Model`, `streamSimple`, typy wiadomości, API dostawców                    |
| `pi-agent-core`   | Pętla agenta, wykonywanie narzędzi, typy `AgentMessage`                                                |
| `pi-coding-agent` | SDK wysokiego poziomu: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, wbudowane narzędzia |
| `pi-tui`          | Komponenty terminalowego interfejsu użytkownika (używane w lokalnym trybie TUI OpenClaw)              |

## Struktura plików

```
src/agents/
├── pi-embedded-runner.ts          # Re-eksporty z pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Główne wejście: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logika pojedynczej próby z konfiguracją sesji
│   │   ├── params.ts              # Typ RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Budowanie ładunków odpowiedzi z wyników uruchomienia
│   │   ├── images.ts              # Wstrzykiwanie obrazów do modelu Vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Wykrywanie błędów przerwania
│   ├── cache-ttl.ts               # Śledzenie TTL pamięci podręcznej do przycinania kontekstu
│   ├── compact.ts                 # Logika ręcznej/automatycznej Compaction
│   ├── extensions.ts              # Ładowanie rozszerzeń pi dla osadzonych uruchomień
│   ├── extra-params.ts            # Parametry strumienia specyficzne dla dostawcy
│   ├── google.ts                  # Poprawki kolejności tur dla Google/Gemini
│   ├── history.ts                 # Ograniczanie historii (DM vs grupa)
│   ├── lanes.ts                   # Ścieżki poleceń sesji/globalne
│   ├── logger.ts                  # Logger podsystemu
│   ├── model.ts                   # Rozwiązywanie modelu przez ModelRegistry
│   ├── runs.ts                    # Śledzenie aktywnych uruchomień, przerwanie, kolejka
│   ├── sandbox-info.ts            # Informacje o sandboxie do promptu systemowego
│   ├── session-manager-cache.ts   # Buforowanie instancji SessionManager
│   ├── session-manager-init.ts    # Inicjalizacja pliku sesji
│   ├── system-prompt.ts           # Konstruktor promptu systemowego
│   ├── tool-split.ts              # Podział narzędzi na builtIn i custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapowanie ThinkLevel, opis błędów
├── pi-embedded-subscribe.ts       # Subskrypcja/rozsyłanie zdarzeń sesji
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fabryka obsługi zdarzeń
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Dzielenie strumieniowanych odpowiedzi blokowych na fragmenty
├── pi-embedded-messaging.ts       # Śledzenie wysłanych przez narzędzie wiadomości
├── pi-embedded-helpers.ts         # Klasyfikacja błędów, walidacja tur
├── pi-embedded-helpers/           # Moduły pomocnicze
├── pi-embedded-utils.ts           # Narzędzia formatowania
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Opakowanie AbortSignal dla narzędzi
├── pi-tools.policy.ts             # Polityka listy dozwolonych/zabronionych narzędzi
├── pi-tools.read.ts               # Dostosowania narzędzia odczytu
├── pi-tools.schema.ts             # Normalizacja schematu narzędzi
├── pi-tools.types.ts              # Alias typu AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Nadpisania ustawień
├── pi-hooks/                      # Niestandardowe hooki pi
│   ├── compaction-safeguard.ts    # Rozszerzenie ochronne
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Rozszerzenie przycinania kontekstu z TTL pamięci podręcznej
│   └── context-pruning/
├── model-auth.ts                  # Rozwiązywanie profilu uwierzytelniania
├── auth-profiles.ts               # Magazyn profili, cooldown, failover
├── model-selection.ts             # Rozwiązywanie domyślnego modelu
├── models-config.ts               # Generowanie models.json
├── model-catalog.ts               # Pamięć podręczna katalogu modeli
├── context-window-guard.ts        # Walidacja okna kontekstu
├── failover-error.ts              # Klasa FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Rozwiązywanie parametrów promptu systemowego
├── system-prompt-report.ts        # Generowanie raportu debugowania
├── tool-summaries.ts              # Podsumowania opisów narzędzi
├── tool-policy.ts                 # Rozwiązywanie polityki narzędzi
├── transcript-policy.ts           # Polityka walidacji transkryptu
├── skills.ts                      # Budowanie migawki/promptu Skills
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

Środowiska uruchomieniowe działań wiadomości specyficznych dla kanału znajdują się teraz w należących do pluginów katalogach rozszerzeń zamiast w `src/agents/tools`, na przykład:

- pliki środowiska uruchomieniowego działań pluginu Discord
- plik środowiska uruchomieniowego działań pluginu Slack
- plik środowiska uruchomieniowego działań pluginu Telegram
- plik środowiska uruchomieniowego działań pluginu WhatsApp

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

`subscribeEmbeddedPiSession()` subskrybuje zdarzenia `AgentSession` z pi:

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

- `message_start` / `message_end` / `message_update` (strumieniowany tekst/myślenie)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Wysyłanie promptu

Po konfiguracji do sesji wysyłany jest prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK obsługuje pełną pętlę agenta: wysyłanie do LLM, wykonywanie wywołań narzędzi, strumieniowanie odpowiedzi.

Wstrzykiwanie obrazów jest lokalne dla promptu: OpenClaw ładuje odwołania do obrazów z bieżącego promptu i przekazuje je przez `images` tylko dla tej tury. Nie skanuje ponownie starszych tur historii, aby ponownie wstrzykiwać ładunki obrazów.

## Architektura narzędzi

### Potok narzędzi

1. **Narzędzia bazowe**: `codingTools` z pi (`read`, `bash`, `edit`, `write`)
2. **Niestandardowe zamienniki**: OpenClaw zastępuje bash przez `exec`/`process`, dostosowuje read/edit/write do sandboxa
3. **Narzędzia OpenClaw**: komunikacja, przeglądarka, canvas, sesje, Cron, Gateway itd.
4. **Narzędzia kanałów**: narzędzia działań specyficzne dla Discord/Telegram/Slack/WhatsApp
5. **Filtrowanie politykami**: narzędzia filtrowane według polityk profilu, dostawcy, agenta, grupy i sandboxa
6. **Normalizacja schematu**: schematy czyszczone pod kątem specyfiki Gemini/OpenAI
7. **Opakowanie AbortSignal**: narzędzia opakowywane tak, aby respektowały sygnały przerwania

### Adapter definicji narzędzi

`AgentTool` z pi-agent-core ma inną sygnaturę `execute` niż `ToolDefinition` z pi-coding-agent. Adapter w `pi-tool-definition-adapter.ts` łączy te dwa interfejsy:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // sygnatura pi-coding-agent różni się od pi-agent-core
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

Zapewnia to spójność filtrowania polityk, integracji sandboxa i rozszerzonego zestawu narzędzi OpenClaw u wszystkich dostawców.

## Budowanie promptu systemowego

Prompt systemowy jest budowany w `buildAgentSystemPrompt()` (`system-prompt.ts`). Składa on pełny prompt z sekcjami obejmującymi Tooling, Tool Call Style, zabezpieczenia Safety, dokumentację referencyjną CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, metadane środowiska uruchomieniowego, a także Memory i Reactions, gdy są włączone, oraz opcjonalne pliki kontekstowe i dodatkową zawartość promptu systemowego. Sekcje są przycinane dla minimalnego trybu promptu używanego przez subagentów.

Prompt jest stosowany po utworzeniu sesji przez `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Zarządzanie sesjami

### Pliki sesji

Sesje to pliki JSONL o strukturze drzewa (powiązanie przez id/parentId). Za trwałość odpowiada `SessionManager` z Pi:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw opakowuje to za pomocą `guardSessionManager()` dla bezpieczeństwa wyników narzędzi.

### Buforowanie sesji

`session-manager-cache.ts` buforuje instancje SessionManager, aby uniknąć wielokrotnego parsowania plików:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Ograniczanie historii

`limitHistoryTurns()` przycina historię rozmowy zależnie od typu kanału (DM vs grupa).

### Compaction

Automatyczna Compaction uruchamia się przy przepełnieniu kontekstu. Typowe sygnatury przepełnienia obejmują
`request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` oraz `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` obsługuje ręczną
Compaction:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Uwierzytelnianie i rozwiązywanie modeli

### Profile uwierzytelniania

OpenClaw utrzymuje magazyn profili uwierzytelniania z wieloma kluczami API dla każdego dostawcy:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profile są rotowane po błędach z użyciem śledzenia cooldown:

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

`FailoverError` wyzwala przełączenie na model zapasowy, gdy jest skonfigurowane:

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

OpenClaw ładuje niestandardowe rozszerzenia Pi dla wyspecjalizowanych zachowań:

### Ochrona Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` dodaje zabezpieczenia do Compaction, w tym adaptacyjne budżetowanie tokenów oraz podsumowania błędów narzędzi i operacji na plikach:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Przycinanie kontekstu

`src/agents/pi-hooks/context-pruning.ts` implementuje przycinanie kontekstu oparte na TTL pamięci podręcznej:

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

## Strumieniowanie i odpowiedzi blokowe

### Dzielenie na bloki

`EmbeddedBlockChunker` zarządza dzieleniem strumieniowanego tekstu na odrębne bloki odpowiedzi:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Usuwanie tagów myślenia/finału

Wyjście strumieniowane jest przetwarzane w celu usunięcia bloków `<think>`/`<thinking>` i wyodrębnienia zawartości `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Usuń zawartość <think>...</think>
  // Jeśli enforceFinalTag, zwróć tylko zawartość <final>...</final>
};
```

### Dyrektywy odpowiedzi

Dyrektywy odpowiedzi takie jak `[[media:url]]`, `[[voice]]`, `[[reply:id]]` są parsowane i wyodrębniane:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Obsługa błędów

### Klasyfikacja błędów

`pi-embedded-helpers.ts` klasyfikuje błędy w celu odpowiedniej obsługi:

```typescript
isContextOverflowError(errorText)     // Zbyt duży kontekst
isCompactionFailureError(errorText)   // Compaction nie powiodła się
isAuthAssistantError(lastAssistant)   // Błąd uwierzytelniania
isRateLimitAssistantError(...)        // Ograniczenie szybkości
isFailoverAssistantError(...)         // Należy wykonać failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Awaryjny poziom myślenia

Jeśli poziom myślenia nie jest obsługiwany, następuje przełączenie awaryjne:

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

## Integracja sandboxa

Gdy tryb sandboxa jest włączony, narzędzia i ścieżki są ograniczane:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Używaj narzędzi read/edit/write w sandboxie
  // Exec działa w kontenerze
  // Browser używa adresu URL mostka
}
```

## Obsługa specyficzna dla dostawcy

### Anthropic

- Usuwanie magicznego ciągu odmowy
- Walidacja tur dla kolejnych ról
- Ścisła walidacja parametrów narzędzi Pi po stronie upstream

### Google/Gemini

- Oczyszczanie schematu narzędzi należących do pluginów

### OpenAI

- Narzędzie `apply_patch` dla modeli Codex
- Obsługa obniżenia poziomu myślenia

## Integracja TUI

OpenClaw ma także lokalny tryb TUI, który bezpośrednio używa komponentów pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Zapewnia to interaktywne środowisko terminalowe podobne do natywnego trybu Pi.

## Kluczowe różnice względem CLI Pi

| Aspekt          | CLI Pi                  | Osadzony OpenClaw                                                                                |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Wywołanie       | polecenie `pi` / RPC    | SDK przez `createAgentSession()`                                                                 |
| Narzędzia       | Domyślne narzędzia kodowania | Niestandardowy zestaw narzędzi OpenClaw                                                     |
| Prompt systemowy| AGENTS.md + prompty     | Dynamiczny dla kanału/kontekstu                                                                  |
| Przechowywanie sesji | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (lub `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Uwierzytelnianie| Pojedyncze poświadczenie | Wiele profili z rotacją                                                                         |
| Rozszerzenia    | Ładowane z dysku        | Programowo + ścieżki dyskowe                                                                     |
| Obsługa zdarzeń | Renderowanie TUI        | Oparta na callbackach (`onBlockReply` itd.)                                                      |

## Przyszłe rozważania

Obszary potencjalnej przebudowy:

1. **Dopasowanie sygnatur narzędzi**: Obecnie trwa adaptacja między sygnaturami pi-agent-core i pi-coding-agent
2. **Opakowanie menedżera sesji**: `guardSessionManager` zwiększa bezpieczeństwo, ale podnosi złożoność
3. **Ładowanie rozszerzeń**: Można byłoby bardziej bezpośrednio używać `ResourceLoader` z Pi
4. **Złożoność obsługi strumieniowania**: `subscribeEmbeddedPiSession` znacznie się rozrosło
5. **Specyfika dostawców**: Wiele ścieżek kodu specyficznych dla dostawcy, które Pi mogłoby potencjalnie obsługiwać

## Testy

Pokrycie integracji Pi obejmuje następujące zestawy:

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (włącz `OPENCLAW_LIVE_TEST=1`)

Aktualne polecenia uruchamiania znajdziesz w [Przepływ pracy programistycznej Pi](/pl/pi-dev).

## Powiązane

- [Przepływ pracy programistycznej Pi](/pl/pi-dev)
- [Przegląd instalacji](/pl/install)
