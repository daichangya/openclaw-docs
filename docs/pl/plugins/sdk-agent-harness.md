---
read_when:
    - Zmieniasz osadzony runtime agenta lub rejestr harnessu
    - Rejestrujesz harness agenta z dołączonego lub zaufanego Pluginu
    - Musisz zrozumieć, jak Plugin Codex jest powiązany z providerami modeli
sidebarTitle: Agent Harness
summary: Eksperymentalna powierzchnia SDK dla Pluginów, które zastępują niskopoziomowy osadzony executor agenta
title: Pluginy harnessu agenta
x-i18n:
    generated_at: "2026-04-23T10:04:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Pluginy harnessu agenta

**Harness agenta** to niskopoziomowy executor jednego przygotowanego obrotu agenta OpenClaw.
Nie jest providerem modeli, nie jest kanałem i nie jest rejestrem narzędzi.

Używaj tej powierzchni tylko dla dołączonych lub zaufanych natywnych Pluginów. Kontrakt
jest nadal eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają obecny
osadzony runner.

## Kiedy używać harnessu

Zarejestruj harness agenta, gdy rodzina modeli ma własne natywne środowisko
sesji, a zwykły transport providera OpenClaw jest złą abstrakcją.

Przykłady:

- natywny serwer agenta kodującego, który sam zarządza wątkami i Compaction
- lokalne CLI lub daemon, które musi strumieniować natywne zdarzenia planu/rozumowania/narzędzi
- runtime modelu, które oprócz transkryptu sesji OpenClaw potrzebuje własnego resume id

**Nie** rejestruj harnessu tylko po to, aby dodać nowe API LLM. Dla zwykłych HTTP- lub
WebSocket-owych API modeli buduj [Plugin providera](/pl/plugins/sdk-provider-plugins).

## Czym nadal zarządza core

Zanim harness zostanie wybrany, OpenClaw rozstrzygnął już:

- providera i model
- stan uwierzytelniania runtime
- poziom thinking i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- obszar roboczy, sandbox i politykę narzędzi
- callbacki odpowiedzi kanału i callbacki strumieniowania
- politykę fallbacku modeli i przełączania aktywnego modelu

Ten podział jest celowy. Harness uruchamia przygotowaną próbę; nie wybiera
providerów, nie zastępuje dostarczania kanałowego i nie przełącza modeli po cichu.

## Rejestrowanie harnessu

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

OpenClaw wybiera harness po rozstrzygnięciu providera/modelu:

1. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowany harness o tym identyfikatorze.
2. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowany harness PI.
3. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowane harnessy, czy obsługują
   rozstrzygnięty provider/model.
4. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa PI, chyba że fallback PI
   jest wyłączony.

Błędy harnessów Pluginów są raportowane jako błędy uruchomienia. W trybie `auto` fallback do PI
jest używany tylko wtedy, gdy żaden zarejestrowany harness Pluginu nie obsługuje rozstrzygniętego
providera/modelu. Gdy harness Pluginu już przejmie uruchomienie, OpenClaw nie
odtwarza tej samej tury przez PI, ponieważ mogłoby to zmienić semantykę auth/runtime
albo zduplikować efekty uboczne.

Dołączony Plugin Codex rejestruje `codex` jako identyfikator swojego harnessu. Core traktuje to
jak zwykły identyfikator harnessu Pluginu; aliasy specyficzne dla Codex należą do Pluginu
albo konfiguracji operatora, a nie do współdzielonego selektora runtime.

## Parowanie providera i harnessu

Większość harnessów powinna także zarejestrować providera. Provider udostępnia referencje modeli,
stan auth, metadane modeli i wybór `/model` reszcie
OpenClaw. Harness następnie przejmuje tego providera w `supports(...)`.

Dołączony Plugin Codex stosuje ten wzorzec:

- identyfikator providera: `codex`
- referencje modeli użytkownika: `codex/gpt-5.4`, `codex/gpt-5.2` lub inny model zwrócony
  przez serwer aplikacji Codex
- identyfikator harnessu: `codex`
- auth: syntetyczna dostępność providera, ponieważ harness Codex zarządza
  natywnym logowaniem/sesją Codex
- żądanie do serwera aplikacji: OpenClaw wysyła do Codex sam identyfikator modelu i pozwala
  harnessowi mówić natywnym protokołem app-server

Plugin Codex jest addytywny. Zwykłe referencje `openai/gpt-*` pozostają referencjami providera OpenAI
i nadal używają zwykłej ścieżki providera OpenClaw. Wybierz `codex/gpt-*`,
gdy chcesz auth zarządzane przez Codex, wykrywanie modeli Codex, natywne wątki i
wykonanie przez app-server Codex. `/model` może przełączać się między modelami Codex zwracanymi
przez serwer aplikacji Codex bez potrzeby posiadania poświadczeń providera OpenAI.

Aby poznać konfigurację operatora, przykłady prefiksów modeli i konfiguracje wyłącznie dla Codex, zobacz
[Harness Codex](/pl/plugins/codex-harness).

OpenClaw wymaga app-server Codex `0.118.0` lub nowszego. Plugin Codex sprawdza
handshake inicjalizacyjny app-server i blokuje starsze lub nieoznaczone wersją serwery, aby
OpenClaw działał tylko z powierzchnią protokołu, z którą był testowany.

### Middleware wyników narzędzi app-server Codex

Dołączone Pluginy mogą także dołączać middleware `tool_result` specyficzne dla app-server Codex przez
`api.registerCodexAppServerExtensionFactory(...)`, gdy ich manifest deklaruje
`contracts.embeddedExtensionFactories: ["codex-app-server"]`.
To interfejs dla zaufanych Pluginów do asynchronicznych transformacji wyników narzędzi, które muszą
działać wewnątrz natywnego harnessu Codex, zanim wynik narzędzia zostanie odwzorowany z powrotem
do transkryptu OpenClaw.

### Natywny tryb harnessu Codex

Dołączony harness `codex` to natywny tryb Codex dla osadzonych tur agenta OpenClaw.
Najpierw włącz dołączony Plugin `codex` i dodaj `codex` do
`plugins.allow`, jeśli Twoja konfiguracja używa restrykcyjnej allowlisty. Różni się on od `openai-codex/*`:

- `openai-codex/*` używa OAuth ChatGPT/Codex przez zwykłą ścieżkę providera OpenClaw.
- `codex/*` używa dołączonego providera Codex i kieruje turę przez
  app-server Codex.

Gdy ten tryb działa, Codex zarządza natywnym identyfikatorem wątku, zachowaniem resume,
Compaction i wykonaniem app-server. OpenClaw nadal zarządza kanałem czatu,
widocznym lustrem transkryptu, polityką narzędzi, zatwierdzeniami, dostarczaniem mediów i wyborem sesji.
Użyj `embeddedHarness.runtime: "codex"` z
`embeddedHarness.fallback: "none"`, gdy musisz udowodnić, że tylko ścieżka
app-server Codex może przejąć uruchomienie. Ta konfiguracja jest tylko zabezpieczeniem wyboru:
błędy app-server Codex i tak kończą się bezpośrednią porażką zamiast ponawiania przez PI.

## Wyłącz fallback do PI

Domyślnie OpenClaw uruchamia osadzonych agentów z `agents.defaults.embeddedHarness`
ustawionym na `{ runtime: "auto", fallback: "pi" }`. W trybie `auto` zarejestrowane harnessy Pluginów
mogą przejąć parę provider/model. Jeśli żaden nie pasuje, OpenClaw wraca do PI.

Ustaw `fallback: "none"`, gdy chcesz, aby brak wyboru harnessu Pluginu kończył się
błędem zamiast użycia PI. Błędy wybranego harnessu Pluginu i tak kończą się twardą porażką. To
nie blokuje jawnego `runtime: "pi"` ani `OPENCLAW_AGENT_RUNTIME=pi`.

Dla osadzonych uruchomień wyłącznie Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Jeśli chcesz, aby dowolny zarejestrowany harness Pluginu przejmował pasujące modele, ale nigdy
nie chcesz, by OpenClaw po cichu wracał do PI, pozostaw `runtime: "auto"` i wyłącz fallback:

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
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` nadal nadpisuje skonfigurowany runtime. Użyj
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby wyłączyć fallback do PI z poziomu
środowiska.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallback sesja kończy się wcześnie błędem, gdy żądany harness nie jest
zarejestrowany, nie obsługuje rozstrzygniętego providera/modelu albo kończy się błędem przed
wytworzeniem efektów ubocznych tury. Jest to celowe dla wdrożeń wyłącznie Codex i
dla testów live, które muszą udowodnić, że ścieżka app-server Codex jest rzeczywiście używana.

To ustawienie kontroluje tylko osadzony harness agenta. Nie wyłącza
routingu modeli specyficznych dla providerów dla obrazów, wideo, muzyki, TTS, PDF ani innych funkcji.

## Sesje natywne i lustro transkryptu

Harness może utrzymywać natywny identyfikator sesji, identyfikator wątku lub token wznowienia po stronie daemon.
Utrzymuj to powiązanie jawnie skojarzone z sesją OpenClaw i
nadal odzwierciedlaj widoczny dla użytkownika wynik asystenta/narzędzi w transkrypcie OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- historii sesji widocznej w kanałach
- wyszukiwania i indeksowania transkryptów
- późniejszego przełączenia z powrotem na wbudowany harness PI
- ogólnego zachowania `/new`, `/reset` i usuwania sesji

Jeśli harness przechowuje powiązanie sidecar, zaimplementuj `reset(...)`, aby OpenClaw mógł
je wyczyścić po resecie właścicielskiej sesji OpenClaw.

## Wyniki narzędzi i mediów

Core buduje listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby.
Gdy harness wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia z powrotem przez
kształt wyniku harnessu zamiast samodzielnie wysyłać media kanałowe.

Dzięki temu wyniki tekstowe, obrazowe, wideo, muzyczne, TTS, zatwierdzeń i narzędzi wiadomości
pozostają na tej samej ścieżce dostarczania co uruchomienia oparte na PI.

## Obecne ograniczenia

- Publiczna ścieżka importu jest ogólna, ale niektóre aliasy typów prób/wyników nadal
  noszą nazwy `Pi` ze względu na zgodność.
- Instalacja zewnętrznych harnessów jest eksperymentalna. Preferuj Pluginy providerów,
  dopóki nie potrzebujesz natywnego runtime sesji.
- Przełączanie harnessów jest obsługiwane między turami. Nie przełączaj harnessów w trakcie
  tury po rozpoczęciu natywnych narzędzi, zatwierdzeń, tekstu asystenta lub wysyłki wiadomości.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview)
- [Helpery runtime](/pl/plugins/sdk-runtime)
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins)
- [Harness Codex](/pl/plugins/codex-harness)
- [Providerzy modeli](/pl/concepts/model-providers)
