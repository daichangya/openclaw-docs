---
read_when:
    - Zmieniasz osadzone środowisko uruchomieniowe agenta lub rejestr harness agenta
    - Rejestrujesz agent harness z wbudowanego lub zaufanego pluginu
    - Musisz zrozumieć, jak plugin Codex odnosi się do providerów modeli
sidebarTitle: Agent Harness
summary: Eksperymentalna powierzchnia SDK dla pluginów, które zastępują niskopoziomowy osadzony executor agenta
title: Pluginy Agent Harness
x-i18n:
    generated_at: "2026-04-11T02:46:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43c1f2c087230398b0162ed98449f239c8db1e822e51c7dcd40c54fa6c3374e1
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Pluginy Agent Harness

**Agent harness** to niskopoziomowy executor dla jednej przygotowanej tury agenta OpenClaw. Nie jest providerem modeli, nie jest kanałem i nie jest rejestrem narzędzi.

Używaj tej powierzchni tylko dla wbudowanych lub zaufanych natywnych pluginów. Kontrakt jest nadal eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają bieżący osadzony runner.

## Kiedy używać harness

Zarejestruj agent harness, gdy rodzina modeli ma własne natywne środowisko uruchomieniowe sesji, a zwykły transport providera OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer coding-agent, który zarządza wątkami i kompaktacją
- lokalny CLI lub demon, który musi strumieniować natywne zdarzenia planu/rozumowania/narzędzi
- środowisko uruchomieniowe modelu, które oprócz transkryptu sesji OpenClaw potrzebuje własnego resume id

**Nie** rejestruj harness tylko po to, aby dodać nowe API LLM. Dla zwykłych interfejsów modeli HTTP lub WebSocket zbuduj [provider plugin](/pl/plugins/sdk-provider-plugins).

## Czym nadal zarządza core

Zanim harness zostanie wybrany, OpenClaw już ustalił:

- providera i model
- stan auth runtime
- poziom rozumowania i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- workspace, sandbox i politykę narzędzi
- callbacki odpowiedzi kanału i callbacki streamingu
- politykę fallbacku modelu i przełączania modeli na żywo

Ten podział jest celowy. Harness uruchamia przygotowaną próbę; nie wybiera providerów, nie zastępuje dostarczania kanałowego i nie przełącza po cichu modeli.

## Rejestracja harness

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

## Zasady wyboru

OpenClaw wybiera harness po rozstrzygnięciu providera/modelu:

1. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowany harness o tym id.
2. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowany harness PI.
3. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowane harnessy, czy obsługują rozstrzygnięty provider/model.
4. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa PI, chyba że fallback PI jest wyłączony.

Błędy wymuszonego plugin harness są zgłaszane jako błędy uruchomienia. W trybie `auto` OpenClaw może wrócić do PI, gdy wybrany plugin harness zakończy się błędem, zanim tura wywoła skutki uboczne. Ustaw `OPENCLAW_AGENT_HARNESS_FALLBACK=none` lub `embeddedHarness.fallback: "none"`, aby taki fallback był twardym błędem.

Dołączony plugin Codex rejestruje `codex` jako id swojego harness. Core traktuje to jak zwykłe id plugin harness; aliasy specyficzne dla Codex powinny należeć do pluginu albo konfiguracji operatora, a nie do wspólnego selektora runtime.

## Parowanie provider plus harness

Większość harnessów powinna także rejestrować providera. Provider udostępnia odwołania do modeli, stan auth, metadane modeli i wybór `/model` pozostałej części OpenClaw. Harness następnie zgłasza tego providera w `supports(...)`.

Dołączony plugin Codex stosuje ten wzorzec:

- id providera: `codex`
- odwołania do modeli użytkownika: `codex/gpt-5.4`, `codex/gpt-5.2` albo inny model zwrócony przez serwer aplikacji Codex
- id harness: `codex`
- auth: syntetyczna dostępność providera, ponieważ harness Codex zarządza natywnym logowaniem/sesją Codex
- żądanie app-servera: OpenClaw wysyła do Codex samo id modelu i pozwala harnessowi rozmawiać z natywnym protokołem app-servera

Plugin Codex jest dodatkiem. Zwykłe odwołania `openai/gpt-*` pozostają odwołaniami providera OpenAI i nadal używają normalnej ścieżki providera OpenClaw. Wybierz `codex/gpt-*`, gdy chcesz auth zarządzanego przez Codex, wykrywania modeli Codex, natywnych wątków i wykonywania przez app-server Codex. `/model` może przełączać się między modelami Codex zwróconymi przez serwer aplikacji Codex bez konieczności posiadania poświadczeń providera OpenAI.

Informacje o konfiguracji operatora, przykłady prefiksów modeli i konfiguracje tylko dla Codex znajdziesz w [Codex Harness](/pl/plugins/codex-harness).

OpenClaw wymaga app-servera Codex `0.118.0` lub nowszego. Plugin Codex sprawdza handshake inicjalizacji app-servera i blokuje starsze lub niezwersjonowane serwery, aby OpenClaw działał tylko z powierzchnią protokołu, na której został przetestowany.

## Wyłącz fallback PI

Domyślnie OpenClaw uruchamia osadzonych agentów z `agents.defaults.embeddedHarness` ustawionym na `{ runtime: "auto", fallback: "pi" }`. W trybie `auto` zarejestrowane plugin harnessy mogą przejąć parę provider/model. Jeśli żaden nie pasuje albo jeśli automatycznie wybrany plugin harness zakończy się błędem przed wygenerowaniem danych wyjściowych, OpenClaw wraca do PI.

Ustaw `fallback: "none"`, gdy musisz udowodnić, że plugin harness jest jedynym używanym runtime. To wyłącza automatyczny fallback PI; nie blokuje jawnego `runtime: "pi"` ani `OPENCLAW_AGENT_RUNTIME=pi`.

Dla osadzonych uruchomień tylko z Codex:

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

Jeśli chcesz, aby dowolny zarejestrowany plugin harness przejmował pasujące modele, ale nigdy nie chcesz, aby OpenClaw po cichu wracał do PI, pozostaw `runtime: "auto"` i wyłącz fallback:

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

Nadpisania dla konkretnych agentów mają ten sam kształt:

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

`OPENCLAW_AGENT_RUNTIME` nadal nadpisuje skonfigurowany runtime. Użyj `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby wyłączyć fallback PI z poziomu środowiska.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallbacku sesja kończy się błędem wcześnie, gdy żądany harness nie jest zarejestrowany, nie obsługuje rozstrzygniętego providera/modelu albo kończy się błędem przed wygenerowaniem skutków ubocznych tury. Jest to celowe dla wdrożeń tylko z Codex i dla testów live, które muszą potwierdzić, że faktycznie używana jest ścieżka app-servera Codex.

To ustawienie kontroluje tylko osadzony agent harness. Nie wyłącza routingu modeli specyficznych dla providerów dla obrazów, wideo, muzyki, TTS, PDF ani innych typów.

## Natywne sesje i lustro transkryptu

Harness może przechowywać natywne id sesji, id wątku albo token wznowienia po stronie demona. Powiąż to jawnie z sesją OpenClaw i nadal odzwierciedlaj widoczne dla użytkownika dane wyjściowe asystenta/narzędzi w transkrypcie OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- historii sesji widocznej w kanałach
- wyszukiwania i indeksowania transkryptów
- późniejszego przełączenia z powrotem na wbudowany harness PI
- ogólnego zachowania `/new`, `/reset` i usuwania sesji

Jeśli harness przechowuje powiązanie sidecar, zaimplementuj `reset(...)`, aby OpenClaw mógł je wyczyścić przy resetowaniu powiązanej sesji OpenClaw.

## Wyniki narzędzi i mediów

Core tworzy listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby. Gdy harness wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia przez kształt wyniku harness zamiast samodzielnie wysyłać media kanałowe.

Dzięki temu wyjścia tekstowe, obrazów, wideo, muzyki, TTS, zatwierdzeń i narzędzi wiadomości pozostają na tej samej ścieżce dostarczania co uruchomienia oparte na PI.

## Bieżące ograniczenia

- Publiczna ścieżka importu jest ogólna, ale niektóre aliasy typów prób/wyników nadal zawierają nazwy `Pi` ze względu na zgodność.
- Instalacja harnessów firm trzecich jest eksperymentalna. Preferuj provider pluginy, dopóki nie potrzebujesz natywnego środowiska uruchomieniowego sesji.
- Przełączanie harnessów między turami jest obsługiwane. Nie przełączaj harnessów w środku tury po rozpoczęciu natywnych narzędzi, zatwierdzeń, tekstu asystenta lub wysyłania wiadomości.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview)
- [Runtime Helpers](/pl/plugins/sdk-runtime)
- [Provider Plugins](/pl/plugins/sdk-provider-plugins)
- [Codex Harness](/pl/plugins/codex-harness)
- [Providery modeli](/pl/concepts/model-providers)
