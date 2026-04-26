---
read_when:
    - Zmieniasz osadzony runtime agenta albo rejestr harnessów
    - Rejestrujesz harness agenta z dołączonego lub zaufanego pluginu
    - Musisz zrozumieć, jak plugin Codex odnosi się do providerów modeli
sidebarTitle: Agent Harness
summary: Eksperymentalna powierzchnia SDK dla pluginów, które zastępują niskopoziomowy osadzony executor agenta
title: Pluginy harnessu agenta
x-i18n:
    generated_at: "2026-04-26T11:36:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**Harness agenta** to niskopoziomowy executor dla jednej przygotowanej tury agenta OpenClaw. Nie jest providerem modelu, nie jest kanałem i nie jest rejestrem narzędzi.
Model mentalny dla użytkownika znajdziesz w [Agent runtimes](/pl/concepts/agent-runtimes).

Używaj tej powierzchni tylko dla dołączonych albo zaufanych natywnych pluginów. Kontrakt
jest nadal eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają bieżący
osadzony runner.

## Kiedy używać harnessu

Rejestruj harness agenta, gdy rodzina modeli ma własny natywny runtime sesji
i zwykły transport providera OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer coding-agent, który zarządza wątkami i Compaction
- lokalny CLI lub daemon, który musi streamować natywne zdarzenia plan/reasoning/tool
- runtime modelu, który oprócz transkryptu sesji OpenClaw potrzebuje własnego resume id

**Nie** rejestruj harnessu tylko po to, by dodać nowe API LLM. Dla zwykłych API modeli HTTP lub
WebSocket zbuduj [plugin providera](/pl/plugins/sdk-provider-plugins).

## Czym nadal zarządza core

Zanim harness zostanie wybrany, OpenClaw już rozwiązał:

- providera i model
- stan uwierzytelniania runtime
- poziom myślenia i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- workspace, sandbox i politykę narzędzi
- callbacki odpowiedzi kanału i callbacki streamingu
- politykę fallback modelu i przełączania modeli na żywo

Ten podział jest zamierzony. Harness uruchamia przygotowaną próbę; nie wybiera
providerów, nie zastępuje dostarczania kanału i nie przełącza modeli po cichu.

Przygotowana próba zawiera też `params.runtimePlan`, pakiet polityk należący do OpenClaw dla decyzji runtime, które muszą pozostać współdzielone między PI a natywnymi harnessami:

- `runtimePlan.tools.normalize(...)` oraz
  `runtimePlan.tools.logDiagnostics(...)` dla polityki schematu narzędzi świadomej providera
- `runtimePlan.transcript.resolvePolicy(...)` dla polityki sanityzacji transkryptu i
  naprawy wywołań narzędzi
- `runtimePlan.delivery.isSilentPayload(...)` dla współdzielonego tłumienia dostarczania `NO_REPLY` i
  mediów
- `runtimePlan.outcome.classifyRunResult(...)` dla klasyfikacji fallback modelu
- `runtimePlan.observability` dla rozwiązanych metadanych providera/modelu/harnessu

Harnessy mogą używać planu do decyzji, które muszą pasować do zachowania PI, ale
nadal powinny traktować go jako stan próby należący do hosta. Nie mutuj go ani nie używaj do
przełączania providerów/modeli w obrębie tury.

## Zarejestruj harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Polityka wyboru

OpenClaw wybiera harness po rozwiązaniu providera/modelu:

1. Zapisany identyfikator harnessu istniejącej sesji wygrywa, więc zmiany config/env nie
   przełączają tego transkryptu na gorąco do innego runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowany harness o tym identyfikatorze dla
   sesji, które nie są już przypięte.
3. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowany harness PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowane harnessy, czy obsługują
   rozwiązany provider/model.
5. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa PI, chyba że fallback do PI jest
   wyłączony.

Błędy harnessów pluginów są pokazywane jako błędy uruchomienia. W trybie `auto` fallback do PI
jest używany tylko wtedy, gdy żaden zarejestrowany harness pluginu nie obsługuje rozwiązanego
providera/modelu. Gdy harness pluginu przejmie uruchomienie, OpenClaw nie
odtwarza tej samej tury przez PI, ponieważ może to zmienić semantykę auth/runtime
albo zduplikować skutki uboczne.

Wybrany identyfikator harnessu jest utrwalany razem z identyfikatorem sesji po osadzonym uruchomieniu.
Starsze sesje utworzone przed przypięciami harnessów są traktowane jako przypięte do PI, gdy tylko
mają historię transkryptu. Użyj nowej/zresetowanej sesji przy przełączaniu między PI a
natywnym harness pluginu. `/status` pokazuje niestandardowe identyfikatory harnessów, takie jak `codex`,
obok `Fast`; PI pozostaje ukryty, ponieważ jest domyślną ścieżką zgodności.
Jeśli wybrany harness jest zaskakujący, włącz logowanie debug `agents/harness` i
sprawdź ustrukturyzowany rekord gateway `agent harness selected`. Zawiera on
wybrany identyfikator harnessu, powód wyboru, politykę runtime/fallback oraz, w trybie
`auto`, wynik wsparcia każdego kandydata pluginu.

Dołączony plugin Codex rejestruje `codex` jako identyfikator swojego harnessu. Core traktuje to
jak zwykły identyfikator harnessu pluginu; aliasy specyficzne dla Codex należą do pluginu
albo konfiguracji operatora, a nie do współdzielonego selektora runtime.

## Parowanie provider + harness

Większość harnessów powinna również rejestrować providera. Provider sprawia, że referencje modeli,
stan auth, metadane modelu i wybór `/model` są widoczne dla reszty
OpenClaw. Harness następnie przejmuje tego providera w `supports(...)`.

Dołączony plugin Codex stosuje ten wzorzec:

- preferowane referencje modeli użytkownika: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- referencje zgodności: starsze referencje `codex/gpt-*` są nadal akceptowane, ale nowe
  konfiguracje nie powinny używać ich jako zwykłych referencji provider/model
- identyfikator harnessu: `codex`
- auth: syntetyczna dostępność providera, ponieważ harness Codex zarządza
  natywnym logowaniem/sesją Codex
- żądanie app-server: OpenClaw wysyła do Codex sam identyfikator modelu i pozwala
  harnessowi mówić protokołem natywnego app-server

Plugin Codex jest addytywny. Zwykłe referencje `openai/gpt-*` nadal używają
normalnej ścieżki providera OpenClaw, chyba że wymusisz harness Codex przez
`agentRuntime.id: "codex"`. Starsze referencje `codex/gpt-*` nadal wybierają
provider i harness Codex dla zgodności.

Konfigurację operatora, przykłady prefiksów modeli i konfiguracje tylko dla Codex znajdziesz w
[Codex Harness](/pl/plugins/codex-harness).

OpenClaw wymaga Codex app-server `0.125.0` lub nowszego. Plugin Codex sprawdza
handshake inicjalizacji app-server i blokuje starsze lub niewersjonowane serwery, aby
OpenClaw działał tylko z powierzchnią protokołu, która została przetestowana. Minimalna wersja
`0.125.0` obejmuje wsparcie ładunku natywnego hooka MCP, które trafiło do
Codex `0.124.0`, jednocześnie przypinając OpenClaw do nowszej, przetestowanej stabilnej linii.

### Middleware wyników narzędzi

Dołączone pluginy mogą dołączać neutralne względem runtime middleware wyników narzędzi przez
`api.registerAgentToolResultMiddleware(...)`, gdy ich manifest deklaruje
docelowe identyfikatory runtime w `contracts.agentToolResultMiddleware`. Ten zaufany
seam służy do asynchronicznych transformacji wyników narzędzi, które muszą uruchamiać się przed tym, zanim PI lub Codex przekażą
wynik narzędzia z powrotem do modelu.

Starsze dołączone pluginy mogą nadal używać
`api.registerCodexAppServerExtensionFactory(...)` dla middleware tylko dla Codex app-server, ale nowe transformacje wyników powinny używać API neutralnego względem runtime.
Hook tylko dla Pi `api.registerEmbeddedExtensionFactory(...)` został usunięty;
transformacje wyników narzędzi Pi muszą używać neutralnego względem runtime middleware.

### Klasyfikacja końcowego wyniku

Natywne harnessy, które posiadają własną projekcję protokołu, mogą używać
`classifyAgentHarnessTerminalOutcome(...)` z
`openclaw/plugin-sdk/agent-harness-runtime`, gdy ukończona tura nie wyprodukowała
widocznego tekstu asystenta. Helper zwraca `empty`, `reasoning-only` albo
`planning-only`, aby polityka fallback OpenClaw mogła zdecydować, czy ponowić próbę na
innym modelu. Celowo pozostawia niesklasyfikowane błędy promptu, tury w toku oraz
celowe ciche odpowiedzi, takie jak `NO_REPLY`.

### Tryb natywnego harnessu Codex

Dołączony harness `codex` to natywny tryb Codex dla osadzonych tur
agenta OpenClaw. Najpierw włącz dołączony plugin `codex` i dodaj `codex` do
`plugins.allow`, jeśli Twoja konfiguracja używa restrykcyjnej listy dozwolonych. Konfiguracje natywnego app-server powinny używać `openai/gpt-*` z `agentRuntime.id: "codex"`.
Używaj zamiast tego `openai-codex/*` dla Codex OAuth przez PI. Starsze referencje modeli `codex/*`
pozostają aliasami zgodności dla natywnego harnessu.

Gdy ten tryb działa, Codex zarządza natywnym identyfikatorem wątku, zachowaniem wznowienia,
Compaction oraz wykonaniem app-server. OpenClaw nadal zarządza kanałem czatu,
widocznym lustrem transkryptu, polityką narzędzi, zatwierdzeniami, dostarczaniem mediów oraz wyborem sesji. Użyj `agentRuntime.id: "codex"` bez nadpisania `fallback`,
gdy musisz udowodnić, że uruchomienie może przejąć tylko ścieżka app-server Codex.
Jawne runtime pluginów już domyślnie kończą się błędem w trybie fail-closed. Ustaw `fallback: "pi"`
tylko wtedy, gdy celowo chcesz, aby brakujący wybór harnessu był obsługiwany przez PI. Błędy
app-server Codex już kończą się bezpośrednio błędem zamiast ponawiać próbę przez PI.

## Wyłącz fallback do PI

Domyślnie OpenClaw uruchamia osadzonych agentów z `agents.defaults.agentRuntime`
ustawionym na `{ id: "auto", fallback: "pi" }`. W trybie `auto` zarejestrowane pluginy
harnessów mogą przejmować parę provider/model. Jeśli żaden nie pasuje, OpenClaw używa fallback do PI.

W trybie `auto` ustaw `fallback: "none"`, gdy potrzebujesz, aby brak wyboru harnessu pluginu
kończył się błędem zamiast użycia PI. Jawne runtime pluginów, takie jak
`runtime: "codex"`, już domyślnie kończą się błędem w trybie fail-closed, chyba że w tym samym zakresie config/env override ustawiono `fallback: "pi"`.
Błędy wybranego harnessu pluginu zawsze kończą się twardym błędem. Nie blokuje to jawnego `runtime: "pi"` ani
`OPENCLAW_AGENT_RUNTIME=pi`.

Dla osadzonych uruchomień tylko z Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Jeśli chcesz, aby dowolny zarejestrowany harness pluginu przejmował pasujące modele, ale nigdy
nie chcesz, aby OpenClaw po cichu używał fallback do PI, pozostaw `runtime: "auto"` i wyłącz fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Nadpisania per agent używają tego samego kształtu:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` nadal nadpisuje skonfigurowany runtime. Użyj
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby wyłączyć fallback do PI z
poziomu środowiska.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallback sesja kończy się wcześnie błędem, gdy żądany harness nie jest
zarejestrowany, nie obsługuje rozwiązanego providera/modelu albo zawodzi przed
wyprodukowaniem skutków ubocznych tury. Jest to zamierzone dla wdrożeń tylko z Codex oraz
dla testów na żywo, które muszą udowodnić, że ścieżka app-server Codex jest faktycznie używana.

To ustawienie kontroluje tylko osadzony harness agenta. Nie wyłącza
routingu specyficznego dla providera/modelu dla obrazów, wideo, muzyki, TTS, PDF ani innych funkcji.

## Sesje natywne i lustro transkryptu

Harness może utrzymywać natywny identyfikator sesji, identyfikator wątku albo token wznowienia po stronie daemona.
Utrzymuj to powiązanie jawnie skojarzone z sesją OpenClaw i nadal
odwzorowuj widoczne dla użytkownika wyjście asystenta/narzędzi do transkryptu OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- historii sesji widocznej w kanałach
- wyszukiwania i indeksowania transkryptu
- późniejszego przełączania z powrotem do wbudowanego harnessu PI
- ogólnego zachowania `/new`, `/reset` i usuwania sesji

Jeśli Twój harness przechowuje powiązanie sidecar, zaimplementuj `reset(...)`, aby OpenClaw mógł
je wyczyścić po zresetowaniu właścicielskiej sesji OpenClaw.

## Wyniki narzędzi i mediów

Core konstruuje listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby.
Gdy harness wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia z powrotem przez
kształt wyniku harnessu zamiast samodzielnie wysyłać media kanału.

Dzięki temu wyjścia tekstowe, obrazowe, wideo, muzyczne, TTS, zatwierdzeń i narzędzi wiadomości
pozostają na tej samej ścieżce dostarczania co uruchomienia wspierane przez PI.

## Bieżące ograniczenia

- Publiczna ścieżka importu jest generyczna, ale niektóre aliasy typów próby/wyniku nadal
  noszą nazwy `Pi` dla zgodności.
- Instalacja harnessów firm trzecich jest eksperymentalna. Preferuj pluginy providerów,
  dopóki nie potrzebujesz natywnego runtime sesji.
- Przełączanie harnessów jest obsługiwane między turami. Nie przełączaj harnessów w
  środku tury po rozpoczęciu natywnych narzędzi, zatwierdzeń, tekstu asystenta lub
  wysyłania wiadomości.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview)
- [Helpery runtime](/pl/plugins/sdk-runtime)
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins)
- [Codex Harness](/pl/plugins/codex-harness)
- [Providerzy modeli](/pl/concepts/model-providers)
