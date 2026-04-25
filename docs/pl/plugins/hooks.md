---
read_when:
    - Tworzysz Plugin, który potrzebuje `before_tool_call`, `before_agent_reply`, hooków wiadomości albo hooków cyklu życia
    - Musisz blokować, przepisywać albo wymagać zatwierdzenia dla wywołań narzędzi z Plugin
    - Decydujesz między hookami wewnętrznymi a hookami Plugin
summary: 'Haki Plugin: przechwytywanie zdarzeń cyklu życia agenta, narzędzi, wiadomości, sesji i Gateway'
title: Haki Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

Haki Plugin to punkty rozszerzeń działające w tym samym procesie dla Plugin OpenClaw. Używaj ich,
gdy Plugin musi sprawdzać albo zmieniać uruchomienia agenta, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, routing subagentów, instalacje albo uruchamianie Gateway.

Zamiast tego użyj [hooków wewnętrznych](/pl/automation/hooks), gdy chcesz mały
instalowany przez operatora skrypt `HOOK.md` dla poleceń i zdarzeń Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` albo `gateway:startup`.

## Szybki start

Rejestruj typowane haki Plugin za pomocą `api.on(...)` z punktu wejścia Plugin:

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
            title: "Uruchomić wyszukiwanie w sieci",
            description: `Zezwolić na zapytanie wyszukiwania: ${String(event.params.query ?? "")}`,
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

Handlery hooków działają sekwencyjnie według malejącego `priority`. Hooki o tym samym priorytecie
zachowują kolejność rejestracji.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy pogrubione
(**...**) akceptują wynik decyzyjny (block, cancel, override albo require approval); wszystkie pozostałe służą tylko do obserwacji.

**Tura agenta**

- `before_model_resolve` — nadpisuje dostawcę albo model przed załadowaniem wiadomości sesji
- `before_prompt_build` — dodaje dynamiczny kontekst albo tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` — faza łączona tylko dla zgodności; preferuj dwa powyższe hooki
- **`before_agent_reply`** — skraca turę modelu przez syntetyczną odpowiedź albo ciszę
- `agent_end` — obserwuje końcowe wiadomości, stan powodzenia i czas trwania uruchomienia

**Obserwacja rozmowy**

- `llm_input` — obserwuje wejście dostawcy (prompt systemowy, prompt, historia)
- `llm_output` — obserwuje wyjście dostawcy

**Narzędzia**

- **`before_tool_call`** — przepisuje parametry narzędzia, blokuje wykonanie albo wymaga zatwierdzenia
- `after_tool_call` — obserwuje wyniki narzędzia, błędy i czas trwania
- **`tool_result_persist`** — przepisuje wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** — sprawdza albo blokuje trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** — przejmuje przychodzącą wiadomość przed routingiem agenta (syntetyczne odpowiedzi)
- `message_received` — obserwuje treść przychodzącą, nadawcę, wątek i metadane
- **`message_sending`** — przepisuje treść wychodzącą albo anuluje dostarczenie
- `message_sent` — obserwuje powodzenie albo niepowodzenie dostarczenia wychodzącego
- **`before_dispatch`** — sprawdza albo przepisuje wychodzący dispatch przed przekazaniem do kanału
- **`reply_dispatch`** — uczestniczy w końcowym potoku dispatch odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` — śledzą granice cyklu życia sesji
- `before_compaction` / `after_compaction` — obserwują albo adnotują cykle Compaction
- `before_reset` — obserwuje zdarzenia resetowania sesji (`/reset`, resetowania programowe)

**Subagenci**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordynują routing subagentów i dostarczanie po zakończeniu

**Cykl życia**

- `gateway_start` / `gateway_stop` — uruchamiają albo zatrzymują usługi należące do Plugin wraz z Gateway
- **`before_install`** — sprawdza skanowanie instalacji Skills albo Plugin i opcjonalnie blokuje

## Zasady wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`, oraz
  diagnostyczne `ctx.trace`

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
- `block: false` jest traktowane jak brak decyzji.
- `params` przepisuje parametry narzędzia do wykonania.
- `requireApproval` wstrzymuje uruchomienie agenta i pyta użytkownika przez
  zatwierdzenia Plugin. Polecenie `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i Plugin.
- `block: true` o niższym priorytecie nadal może zablokować po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozstrzygniętą decyzję zatwierdzenia — `allow-once`,
  `allow-always`, `deny`, `timeout` albo `cancelled`.

## Hooki promptu i modelu

Dla nowych Plugin używaj hooków specyficznych dla faz:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane
  załączników. Zwróć `providerOverride` albo `modelOverride`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `systemPrompt`, `prependSystemContext` albo
  `appendSystemContext`.

`before_agent_start` pozostaje dla zgodności. Preferuj powyższe jawne hooki,
aby Plugin nie zależał od starszej fazy łączonej.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne uruchomienie. Ta sama wartość jest też dostępna w `ctx.runId`.

Pluginy niedołączone, które potrzebują `llm_input`, `llm_output` albo `agent_end`, muszą ustawić:

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

Hooki mutujące prompt mogą być wyłączone per Plugin przez
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hooki wiadomości

Używaj hooków wiadomości do routingu na poziomie kanału i zasad dostarczania:

- `message_received`: obserwuje przychodzącą treść, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji i metadane.
- `message_sending`: przepisuje `content` albo zwraca `{ cancel: true }`.
- `message_sent`: obserwuje końcowe powodzenie albo niepowodzenie.

Dla odpowiedzi TTS wyłącznie audio `content` może zawierać ukryty transkrypt mowy
nawet wtedy, gdy ładunek kanału nie ma widocznego tekstu/podpisu. Przepisanie tego
`content` aktualizuje tylko transkrypt widoczny dla hooka; nie jest renderowane jako
podpis mediów.

Konteksty hooków wiadomości udostępniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` i `ctx.callDepth`. Preferuj te pola
pierwszej klasy przed odczytywaniem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed użyciem metadanych specyficznych dla kanału.

Zasady decyzji:

- `message_sending` z `cancel: true` jest końcowe.
- `message_sending` z `cancel: false` jest traktowane jak brak decyzji.
- Przepisane `content` trafia dalej do hooków o niższym priorytecie, chyba że późniejszy hook
  anuluje dostarczenie.

## Hooki instalacji

`before_install` działa po wbudowanym skanowaniu instalacji Skills i Plugin.
Zwróć dodatkowe ustalenia albo `{ block: true, blockReason }`, aby zatrzymać
instalację.

`block: true` jest końcowe. `block: false` jest traktowane jak brak decyzji.

## Cykl życia Gateway

Używaj `gateway_start` dla usług Plugin, które potrzebują stanu należącego do Gateway.
Kontekst udostępnia `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` do
inspekcji i aktualizacji Cron. Używaj `gateway_stop`, aby czyścić długotrwałe
zasoby.

Nie polegaj na wewnętrznym hooku `gateway:startup` dla usług runtime należących do Plugin.

## Nadchodzące przestarzałości

Kilka powierzchni powiązanych z hookami jest przestarzałych, ale nadal obsługiwanych. Zmigruj
przed następnym dużym wydaniem:

- **Plaintext channel envelopes** w handlerach `inbound_claim` i `message_received`.
  Odczytuj `BodyForAgent` i ustrukturyzowane bloki kontekstu użytkownika
  zamiast parsować płaski tekst envelope. Zobacz
  [Plaintext channel envelopes → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla zgodności. Nowe Pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast fazy łączonej.
- **`onResolution` w `before_tool_call`** używa teraz typowanego
  unii `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast dowolnego `string`.

Pełną listę — rejestracja możliwości pamięci, profil myślenia dostawcy,
zewnętrzni dostawcy auth, typy wykrywania dostawców, akcesory runtime zadań
oraz zmianę nazwy `command-auth` → `command-status` — znajdziesz w
[Plugin SDK migration → Active deprecations](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Plugin SDK migration](/pl/plugins/sdk-migration) — aktywne przestarzałości i harmonogram usunięcia
- [Tworzenie Plugin](/pl/plugins/building-plugins)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia Plugin](/pl/plugins/sdk-entrypoints)
- [Hooki wewnętrzne](/pl/automation/hooks)
- [Wewnętrzna architektura Plugin](/pl/plugins/architecture-internals)
