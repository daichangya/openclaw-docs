---
read_when:
    - Zmieniasz osadzone środowisko wykonawcze agenta lub rejestr harnessów
    - Rejestrujesz harness agenta z dołączonego lub zaufanego Plugin
    - Musisz zrozumieć, jak Plugin Codex odnosi się do dostawców modeli
sidebarTitle: Agent Harness
summary: Eksperymentalna powierzchnia SDK dla Plugin, które zastępują niskopoziomowy executor osadzonego agenta
title: Plugin harnessu agenta
x-i18n:
    generated_at: "2026-04-25T13:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**Harness agenta** to niskopoziomowy executor jednej przygotowanej tury agenta OpenClaw.
Nie jest dostawcą modeli, nie jest kanałem i nie jest rejestrem narzędzi.
Model pojęciowy dla użytkownika znajdziesz w [Środowiskach wykonawczych agentów](/pl/concepts/agent-runtimes).

Używaj tej powierzchni tylko dla dołączonych lub zaufanych natywnych Plugin. Kontrakt
jest nadal eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają bieżący
osadzony runner.

## Kiedy używać harnessu

Zarejestruj harness agenta, gdy rodzina modeli ma własne natywne środowisko
wykonawcze sesji, a zwykły transport dostawcy OpenClaw jest złą abstrakcją.

Przykłady:

- natywny serwer coding-agent, który sam zarządza wątkami i Compaction
- lokalne CLI lub daemon, które musi strumieniować natywne zdarzenia plan/reasoning/tool
- środowisko wykonawcze modelu, które potrzebuje własnego identyfikatora wznowienia oprócz transkryptu
  sesji OpenClaw

**Nie** rejestruj harnessu tylko po to, aby dodać nowe API LLM. Dla zwykłych
HTTP lub WebSocket API modeli zbuduj [Plugin dostawcy](/pl/plugins/sdk-provider-plugins).

## Czym nadal zarządza core

Zanim harness zostanie wybrany, OpenClaw już rozstrzygnął:

- dostawcę i model
- stan autoryzacji środowiska wykonawczego
- poziom thinking i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- przestrzeń roboczą, piaskownicę i politykę narzędzi
- callbacki odpowiedzi kanału i callbacki streamingu
- fallback modelu i politykę aktywnego przełączania modelu

Ten podział jest zamierzony. Harness uruchamia przygotowaną próbę; nie wybiera
dostawców, nie zastępuje dostarczania kanału ani nie przełącza modeli po cichu.

## Zarejestruj harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mój natywny harness agenta",

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
  description: "Uruchamia wybrane modele przez natywny daemon agenta.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Polityka wyboru

OpenClaw wybiera harness po rozstrzygnięciu dostawcy/modelu:

1. Zapisany identyfikator harnessu istniejącej sesji wygrywa, więc zmiany config/env nie
   przełączają na gorąco tego transkryptu na inne środowisko wykonawcze.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowany harness o tym identyfikatorze dla
   sesji, które nie są jeszcze przypięte.
3. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowany harness PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowane harnessy, czy obsługują
   rozstrzygniętego dostawcę/model.
5. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa PI, chyba że fallback PI
   jest wyłączony.

Awarie Plugin harness są ujawniane jako awarie uruchomienia. W trybie `auto` fallback PI jest
używany tylko wtedy, gdy żaden zarejestrowany Plugin harness nie obsługuje rozstrzygniętego
dostawcy/modelu. Gdy Plugin harness już przejął uruchomienie, OpenClaw nie
odtwarza tej samej tury przez PI, ponieważ może to zmienić semantykę auth/runtime
albo spowodować duplikację skutków ubocznych.

Wybrany identyfikator harnessu jest utrwalany z identyfikatorem sesji po osadzonym uruchomieniu.
Starsze sesje utworzone przed przypięciami harnessów są traktowane jako przypięte do PI, gdy tylko
mają historię transkryptu. Użyj nowej/zresetowanej sesji podczas przełączania między PI a
natywnym Plugin harness. `/status` pokazuje identyfikatory harnessów innych niż domyślny, takie jak `codex`,
obok `Fast`; PI pozostaje ukryte, ponieważ jest domyślną ścieżką zgodności.
Jeśli wybrany harness jest zaskakujący, włącz logowanie debug `agents/harness` i
sprawdź ustrukturyzowany rekord gateway `agent harness selected`. Zawiera on
wybrany identyfikator harnessu, powód wyboru, politykę runtime/fallback oraz, w trybie
`auto`, wynik obsługi każdego kandydata Plugin.

Dołączony Plugin Codex rejestruje `codex` jako swój identyfikator harnessu. Core traktuje to
jak zwykły identyfikator Plugin harness; aliasy specyficzne dla Codex należą do Plugin
albo konfiguracji operatora, a nie do współdzielonego selektora runtime.

## Parowanie dostawcy i harnessu

Większość harnessów powinna także rejestrować dostawcę. Dostawca udostępnia
reszcie OpenClaw referencje modeli, status autoryzacji, metadane modeli i wybór `/model`.
Harness następnie przejmuje tego dostawcę w `supports(...)`.

Dołączony Plugin Codex stosuje ten wzorzec:

- preferowane referencje modeli użytkownika: `openai/gpt-5.5` plus
  `embeddedHarness.runtime: "codex"`
- referencje zgodności: starsze referencje `codex/gpt-*` są nadal akceptowane, ale nowe
  konfiguracje nie powinny używać ich jako zwykłych referencji dostawcy/modelu
- identyfikator harnessu: `codex`
- auth: syntetyczna dostępność dostawcy, ponieważ harness Codex zarządza
  natywnym logowaniem/sesją Codex
- żądanie app-server: OpenClaw wysyła do Codex sam identyfikator modelu i pozwala
  harnessowi mówić z natywnym protokołem app-server

Plugin Codex jest addytywny. Zwykłe referencje `openai/gpt-*` nadal używają
normalnej ścieżki dostawcy OpenClaw, chyba że wymusisz harness Codex przez
`embeddedHarness.runtime: "codex"`. Starsze referencje `codex/gpt-*` nadal wybierają
dostawcę i harness Codex dla zachowania zgodności.

Konfigurację operatora, przykłady prefiksów modeli i konfiguracje tylko dla Codex znajdziesz w
[Harnessie Codex](/pl/plugins/codex-harness).

OpenClaw wymaga app-server Codex `0.118.0` lub nowszego. Plugin Codex sprawdza
handshake initialize app-server i blokuje starsze lub niewersjonowane serwery, aby
OpenClaw działał tylko względem powierzchni protokołu, z którą był testowany.

### Middleware wyników narzędzi

Dołączone Plugin mogą dołączać niezależne od runtime middleware wyników narzędzi przez
`api.registerAgentToolResultMiddleware(...)`, gdy ich manifest deklaruje
docelowe identyfikatory runtime w `contracts.agentToolResultMiddleware`. Ta zaufana
warstwa jest przeznaczona dla asynchronicznych transformacji wyników narzędzi, które muszą
uruchomić się przed tym, jak PI lub Codex zwróci wynik narzędzia do modelu.

Starsze dołączone Plugin nadal mogą używać
`api.registerCodexAppServerExtensionFactory(...)` dla middleware tylko dla app-server Codex,
ale nowe transformacje wyników powinny używać niezależnego od runtime API.
Hook tylko dla Pi `api.registerEmbeddedExtensionFactory(...)` został usunięty;
transformacje wyników narzędzi Pi muszą używać middleware niezależnego od runtime.

### Natywny tryb harnessu Codex

Dołączony harness `codex` jest natywnym trybem Codex dla osadzonych tur agenta OpenClaw.
Najpierw włącz dołączony Plugin `codex` i uwzględnij `codex` w
`plugins.allow`, jeśli konfiguracja używa restrykcyjnej listy dozwolonych. Natywne konfiguracje
app-server powinny używać `openai/gpt-*` z `embeddedHarness.runtime: "codex"`.
Dla OAuth Codex przez PI używaj zamiast tego `openai-codex/*`. Starsze referencje modeli `codex/*`
pozostają aliasami zgodności dla natywnego harnessu.

Gdy ten tryb działa, Codex zarządza natywnym identyfikatorem wątku, zachowaniem wznowienia,
Compaction i wykonaniem app-server. OpenClaw nadal zarządza kanałem czatu,
widoczną kopią transkryptu, polityką narzędzi, zatwierdzeniami, dostarczaniem multimediów i wyborem
sesji. Użyj `embeddedHarness.runtime: "codex"` bez nadpisania `fallback`,
gdy musisz udowodnić, że tylko ścieżka app-server Codex może przejąć uruchomienie.
Jawne runtime Plugin już domyślnie działają w trybie fail closed. Ustaw `fallback: "pi"`
tylko wtedy, gdy celowo chcesz, by brak wyboru harnessu obsługiwał PI. Awarie
app-server Codex już kończą się bezpośrednio błędem zamiast ponawiania przez PI.

## Wyłącz fallback PI

Domyślnie OpenClaw uruchamia osadzonych agentów z `agents.defaults.embeddedHarness`
ustawionym na `{ runtime: "auto", fallback: "pi" }`. W trybie `auto` zarejestrowane Plugin
harness mogą przejmować parę dostawca/model. Jeśli żaden nie pasuje, OpenClaw wraca do PI.

W trybie `auto` ustaw `fallback: "none"`, gdy wybór brakującego Plugin harnessu
ma kończyć się błędem zamiast używać PI. Jawne runtime Plugin, takie jak
`runtime: "codex"`, już domyślnie działają w trybie fail closed, chyba że `fallback: "pi"` jest
ustawione w tym samym zakresie konfiguracji lub nadpisania środowiskowego. Awarie wybranego Plugin harness
zawsze kończą się twardym błędem. To nie blokuje jawnego `runtime: "pi"` ani
`OPENCLAW_AGENT_RUNTIME=pi`.

Dla osadzonych uruchomień tylko Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

Jeśli chcesz, aby dowolny zarejestrowany Plugin harness przejmował pasujące modele, ale nigdy
nie chcesz, aby OpenClaw po cichu wracał do PI, zachowaj `runtime: "auto"` i wyłącz
fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
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
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` nadal nadpisuje skonfigurowane runtime. Użyj
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby wyłączyć fallback PI z
poziomu środowiska.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallback sesja kończy się wcześnie błędem, gdy żądany harness nie jest
zarejestrowany, nie obsługuje rozstrzygniętego dostawcy/modelu albo kończy się błędem przed
wyprodukowaniem skutków ubocznych tury. To jest zamierzone dla wdrożeń tylko Codex i
dla testów live, które muszą udowodnić, że ścieżka app-server Codex jest rzeczywiście używana.

To ustawienie kontroluje tylko osadzony harness agenta. Nie wyłącza
routingu modeli specyficznego dla dostawców dla image, video, music, TTS, PDF ani innych.

## Natywne sesje i kopia transkryptu

Harness może utrzymywać natywny identyfikator sesji, identyfikator wątku albo token wznowienia po stronie daemona.
Utrzymuj to powiązanie jawnie skojarzone z sesją OpenClaw i nadal
kopiuj widoczne dla użytkownika wyjście asystenta/narzędzi do transkryptu OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- widocznej w kanale historii sesji
- wyszukiwania i indeksowania transkryptów
- przełączania z powrotem do wbudowanego harnessu PI w późniejszej turze
- ogólnych zachowań `/new`, `/reset` i usuwania sesji

Jeśli harness przechowuje powiązanie sidecar, zaimplementuj `reset(...)`, aby OpenClaw mógł
je wyczyścić przy resecie właścicielskiej sesji OpenClaw.

## Wyniki narzędzi i mediów

Core konstruuje listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby.
Gdy harness wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia z powrotem przez
kształt wyniku harnessu zamiast samodzielnie wysyłać multimedia kanału.

Dzięki temu wyjścia tekstowe, obrazowe, wideo, muzyczne, TTS, zatwierdzeń i narzędzi wiadomości
pozostają na tej samej ścieżce dostarczania co uruchomienia oparte na PI.

## Bieżące ograniczenia

- Publiczna ścieżka importu jest ogólna, ale niektóre aliasy typów prób/wyników nadal
  zawierają nazwy `Pi` dla zachowania zgodności.
- Instalacja harnessów zewnętrznych jest eksperymentalna. Preferuj Plugin dostawców,
  dopóki nie potrzebujesz natywnego runtime sesji.
- Przełączanie harnessów jest obsługiwane między turami. Nie przełączaj harnessów w
  środku tury po rozpoczęciu natywnych narzędzi, zatwierdzeń, tekstu asystenta lub wysyłania wiadomości.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview)
- [Pomocniki runtime](/pl/plugins/sdk-runtime)
- [Plugin dostawców](/pl/plugins/sdk-provider-plugins)
- [Harness Codex](/pl/plugins/codex-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
