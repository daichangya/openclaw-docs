---
read_when:
    - Tworzysz Plugin, który wymaga `before_tool_call`, `before_agent_reply`, hooków wiadomości lub hooków cyklu życia
    - Musisz blokować, przepisywać lub wymagać zatwierdzenia dla wywołań narzędzi z Plugin
    - Decydujesz między hookami wewnętrznymi a hookami Plugin
summary: 'Hooki Plugin: przechwytują zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Hooki Plugin
x-i18n:
    generated_at: "2026-04-26T11:36:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62d8c21db885abcb70c7aa940e3ce937df09d077587b153015c4c6c5169f4f1d
    source_path: plugins/hooks.md
    workflow: 15
---

Hooki Plugin to punkty rozszerzeń in-process dla pluginów OpenClaw. Używaj ich,
gdy Plugin musi sprawdzać lub zmieniać uruchomienia agenta, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, routowanie subagentów, instalacje lub uruchamianie Gateway.

Zamiast tego użyj [hooków wewnętrznych](/pl/automation/hooks), jeśli chcesz użyć małego
instalowanego przez operatora skryptu `HOOK.md` dla poleceń i zdarzeń Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` lub `gateway:startup`.

## Szybki start

Zarejestruj typowane hooki Plugin za pomocą `api.on(...)` z punktu wejścia pluginu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Handlery hooków działają sekwencyjnie w malejącej kolejności `priority`. Hooki o tym samym priorytecie
zachowują kolejność rejestracji.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy pogrubione w **bold** akceptują
wynik decyzji (blokada, anulowanie, nadpisanie lub wymaganie zatwierdzenia); wszystkie pozostałe
służą tylko do obserwacji.

**Tura agenta**

- `before_model_resolve` — nadpisanie providera lub modelu przed załadowaniem wiadomości sesji
- `before_prompt_build` — dodanie dynamicznego kontekstu lub tekstu system prompt przed wywołaniem modelu
- `before_agent_start` — połączona faza tylko dla zgodności; zamiast niej preferuj dwa hooki powyżej
- **`before_agent_reply`** — skrócenie tury modelu za pomocą syntetycznej odpowiedzi lub ciszy
- **`before_agent_finalize`** — sprawdzenie naturalnej odpowiedzi końcowej i zażądanie jeszcze jednego przebiegu modelu
- `agent_end` — obserwacja końcowych wiadomości, stanu powodzenia i czasu trwania uruchomienia

**Obserwacja konwersacji**

- `model_call_started` / `model_call_ended` — obserwacja oczyszczonych metadanych wywołania providera/modelu, czasu, wyniku oraz ograniczonych hashy request-id bez treści promptu lub odpowiedzi
- `llm_input` — obserwacja wejścia providera (system prompt, prompt, historia)
- `llm_output` — obserwacja wyjścia providera

**Narzędzia**

- **`before_tool_call`** — przepisywanie parametrów narzędzia, blokowanie wykonania lub wymaganie zatwierdzenia
- `after_tool_call` — obserwacja wyników narzędzia, błędów i czasu trwania
- **`tool_result_persist`** — przepisanie wiadomości asystenta wygenerowanej z wyniku narzędzia
- **`before_message_write`** — sprawdzenie lub zablokowanie zapisu wiadomości w toku (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** — przejęcie wiadomości przychodzącej przed routowaniem do agenta (syntetyczne odpowiedzi)
- `message_received` — obserwacja treści przychodzącej, nadawcy, wątku i metadanych
- **`message_sending`** — przepisanie treści wychodzącej lub anulowanie dostarczenia
- `message_sent` — obserwacja powodzenia lub niepowodzenia dostarczenia wychodzącego
- **`before_dispatch`** — sprawdzenie lub przepisanie wychodzącej dyspozycji przed przekazaniem do kanału
- **`reply_dispatch`** — udział w końcowym pipeline dyspozycji odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` — śledzenie granic cyklu życia sesji
- `before_compaction` / `after_compaction` — obserwacja lub adnotowanie cykli Compaction
- `before_reset` — obserwacja zdarzeń resetu sesji (`/reset`, resetów programowych)

**Subagenci**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordynacja routowania subagentów i dostarczania po zakończeniu

**Cykl życia**

- `gateway_start` / `gateway_stop` — uruchamianie lub zatrzymywanie usług należących do pluginu razem z Gateway
- **`before_install`** — sprawdzenie skanów instalacji Skills lub pluginów i opcjonalne zablokowanie

## Polityka wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalnie `event.runId`
- opcjonalnie `event.toolCallId`
- pola kontekstowe takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawiane przy uruchomieniach wyzwalanych przez Cron) oraz diagnostyczne `ctx.trace`

Może zwrócić:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Zasady:

- `block: true` jest końcowe i pomija handlery o niższym priorytecie.
- `block: false` jest traktowane jako brak decyzji.
- `params` przepisuje parametry narzędzia do wykonania.
- `requireApproval` wstrzymuje uruchomienie agenta i pyta użytkownika przez zatwierdzenia pluginu. Polecenie `/approve` może zatwierdzać zarówno exec, jak i zatwierdzenia pluginów.
- `block: true` z hooka o niższym priorytecie nadal może zablokować wykonanie po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozstrzygniętą decyzję zatwierdzenia — `allow-once`,
  `allow-always`, `deny`, `timeout` lub `cancelled`.

### Utrwalanie wyników narzędzi

Wyniki narzędzi mogą zawierać strukturalne `details` do renderowania w UI, diagnostyki,
routowania multimediów lub metadanych należących do pluginu. Traktuj `details` jako metadane środowiska uruchomieniowego,
a nie treść promptu:

- OpenClaw usuwa `toolResult.details` przed ponownym odtworzeniem dla providera i wejściem Compaction, aby metadane nie stawały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Zbyt duże details są
  zastępowane zwartym podsumowaniem oraz `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` działają przed końcowym
  limitem utrwalania. Hooki nadal powinny utrzymywać zwracane `details` małe i unikać
  umieszczania tekstu istotnego dla promptu wyłącznie w `details`; wyjście narzędzia widoczne dla modelu
  umieszczaj w `content`.

## Hooki promptu i modelu

Dla nowych pluginów używaj hooków specyficznych dla fazy:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników. Zwróć `providerOverride` lub `modelOverride`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `systemPrompt`, `prependSystemContext` lub
  `appendSystemContext`.

`before_agent_start` pozostaje dla zgodności. Preferuj jawne hooki powyżej,
aby Plugin nie zależał od starej połączonej fazy.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne uruchomienie. Ta sama wartość jest również dostępna w `ctx.runId`.
Uruchomienia wyzwalane przez Cron udostępniają też `ctx.jobId` (id źródłowego zadania cron), aby
hooki Plugin mogły ograniczać metryki, efekty uboczne lub stan do konkretnego zaplanowanego
zadania.

Używaj `model_call_started` i `model_call_ended` dla telemetrii wywołań providera,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków, treści
żądań ani request ID providera. Te hooki zawierają stabilne metadane takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, końcowe
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony hash request-id providera.

`before_agent_finalize` działa tylko wtedy, gdy harness ma właśnie zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
działa, gdy użytkownik przerwie turę. Zwróć `{ action: "revise", reason }`, aby poprosić
harness o jeszcze jeden przebieg modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, albo pomiń wynik, aby kontynuować.
Natywne hooki `Stop` Codex są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Niebundlowane pluginy, które potrzebują `llm_input`, `llm_output`,
`before_agent_finalize` lub `agent_end`, muszą ustawić:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Hooki modyfikujące prompt można wyłączyć per plugin za pomocą
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hooki wiadomości

Używaj hooków wiadomości do routowania na poziomie kanału i polityki dostarczania:

- `message_received`: obserwacja treści przychodzącej, nadawcy, `threadId`, `messageId`,
  `senderId`, opcjonalnej korelacji uruchomienia/sesji oraz metadanych.
- `message_sending`: przepisanie `content` lub zwrócenie `{ cancel: true }`.
- `message_sent`: obserwacja końcowego powodzenia lub niepowodzenia.

Dla odpowiedzi TTS zawierających tylko audio `content` może zawierać ukrytą transkrypcję mówioną,
nawet jeśli ładunek kanału nie ma widocznego tekstu/podpisu. Przepisanie tego
`content` aktualizuje tylko transkrypcję widoczną dla hooka; nie jest renderowane jako podpis medium.

Konteksty hooków wiadomości udostępniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` i `ctx.callDepth`. Preferuj
te pola pierwszej klasy, zanim sięgniesz po starsze metadane.

Preferuj typowane pola `threadId` i `replyToId` zamiast używania metadanych specyficznych dla kanału.

Zasady decyzyjne:

- `message_sending` z `cancel: true` jest końcowe.
- `message_sending` z `cancel: false` jest traktowane jako brak decyzji.
- Przepisane `content` przechodzi do hooków o niższym priorytecie, chyba że późniejszy hook
  anuluje dostarczenie.

## Hooki instalacji

`before_install` działa po wbudowanym skanowaniu instalacji Skills i pluginów.
Zwróć dodatkowe ustalenia lub `{ block: true, blockReason }`, aby zatrzymać
instalację.

`block: true` jest końcowe. `block: false` jest traktowane jako brak decyzji.

## Cykl życia Gateway

Używaj `gateway_start` dla usług pluginu, które potrzebują stanu należącego do Gateway. Kontekst
udostępnia `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` do
sprawdzania i aktualizowania Cron. Używaj `gateway_stop` do czyszczenia długo działających
zasobów.

Nie polegaj na wewnętrznym hooku `gateway:startup` dla usług środowiska uruchomieniowego należących do pluginu.

## Nadchodzące wycofania

Kilka powierzchni związanych z hookami jest wycofanych, ale nadal obsługiwanych. Zmigruj
przed następnym głównym wydaniem:

- **Plaintext channel envelopes** w handlerach `inbound_claim` i `message_received`.
  Odczytuj `BodyForAgent` i strukturalne bloki kontekstu użytkownika
  zamiast parsować płaski tekst koperty. Zobacz
  [Plaintext channel envelopes → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla zgodności. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej
  fazy.
- **`onResolution` w `before_tool_call`** używa teraz typowanego
  unii `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast dowolnego `string`.

Pełna lista — rejestracja możliwości pamięci, profil myślenia providera, zewnętrzni providerzy uwierzytelniania, typy wykrywania providerów, akcesory środowiska uruchomieniowego zadań oraz zmiana nazwy `command-auth` → `command-status` — znajduje się w
[Plugin SDK migration → Active deprecations](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Plugin SDK migration](/pl/plugins/sdk-migration) — aktywne wycofania i harmonogram usuwania
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia Plugin](/pl/plugins/sdk-entrypoints)
- [Hooki wewnętrzne](/pl/automation/hooks)
- [Wewnętrzna architektura Plugin](/pl/plugins/architecture-internals)
