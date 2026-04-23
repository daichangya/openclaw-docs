---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude przez klucze API lub Claude CLI w OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T10:06:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie ścieżki auth:

- **Klucz API** — bezpośredni dostęp do API Anthropic z rozliczaniem zależnym od użycia (modele `anthropic/*`)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude CLI na tym samym hoście

<Warning>
Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc
OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone, chyba że
Anthropic opublikuje nową politykę.

Dla długowiecznych hostów Gateway klucze API Anthropic nadal są najjaśniejszą i
najbardziej przewidywalną ścieżką produkcyjną.

Obecna publiczna dokumentacja Anthropic:

- [Dokumentacja CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Przegląd Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Używanie Claude Code z planem Pro lub Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Używanie Claude Code z planem Team lub Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze dla:** standardowego dostępu do API i rozliczania zależnego od użycia.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz klucz API w [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        # wybierz: Anthropic API key
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Przykład konfiguracji

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Najlepsze dla:** ponownego użycia istniejącego logowania Claude CLI bez osobnego klucza API.

    <Steps>
      <Step title="Upewnij się, że Claude CLI jest zainstalowane i zalogowane">
        Sprawdź poleceniem:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        # wybierz: Claude CLI
        ```

        OpenClaw wykrywa i ponownie używa istniejących poświadczeń Claude CLI.
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Szczegóły konfiguracji i runtime dla backendu Claude CLI znajdują się w [CLI Backends](/pl/gateway/cli-backends).
    </Note>

    <Tip>
    Jeśli chcesz najjaśniejszej ścieżki rozliczania, użyj klucza API Anthropic. OpenClaw obsługuje też opcje w stylu subskrypcyjnym z [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Domyślne ustawienia myślenia (Claude 4.6)

Modele Claude 4.6 domyślnie używają w OpenClaw trybu myślenia `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.

Nadpisz to per wiadomość przez `/think:<level>` albo w parametrach modelu:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Powiązana dokumentacja Anthropic:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Cache promptów

OpenClaw obsługuje funkcję cache promptów Anthropic dla auth opartego na kluczu API.

| Wartość             | Czas cache     | Opis                                       |
| ------------------- | -------------- | ------------------------------------------ |
| `"short"` (domyślne) | 5 minut       | Stosowane automatycznie dla auth z kluczem API |
| `"long"`            | 1 godzina      | Rozszerzony cache                          |
| `"none"`            | Brak cache     | Wyłącza cache promptów                     |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Nadpisania cache per agent">
    Używaj parametrów na poziomie modelu jako bazowego ustawienia, a następnie nadpisuj konkretne agenty przez `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Kolejność scalania konfiguracji:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (pasujące `id`, nadpisanie per klucz)

    Dzięki temu jeden agent może zachować długowieczny cache, podczas gdy inny agent na tym samym modelu wyłącza cache dla skokowego ruchu o niskim ponownym użyciu.

  </Accordion>

  <Accordion title="Uwagi o Bedrock Claude">
    - Modele Anthropic Claude na Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazywane `cacheRetention`, gdy są skonfigurowane.
    - Modele Bedrock inne niż Anthropic są wymuszane w runtime na `cacheRetention: "none"`.
    - Inteligentne ustawienia domyślne dla klucza API ustawiają też `cacheRetention: "short"` dla referencji Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.
  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Tryb fast">
    Współdzielony przełącznik `/fast` OpenClaw obsługuje bezpośredni ruch Anthropic (klucz API i OAuth do `api.anthropic.com`).

    | Polecenie | Mapuje na |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Wstrzykiwane tylko dla bezpośrednich żądań do `api.anthropic.com`. Trasy proxy pozostawiają `service_tier` bez zmian.
    - Jawne parametry `serviceTier` lub `service_tier` mają pierwszeństwo przed `/fast`, gdy ustawione są oba.
    - Na kontach bez pojemności Priority Tier `service_tier: "auto"` może zostać rozwiązane do `standard`.
    </Note>

  </Accordion>

  <Accordion title="Rozumienie multimediów (obrazy i PDF)">
    Dołączony Plugin Anthropic rejestruje rozumienie obrazów i PDF. OpenClaw
    automatycznie rozwiązuje możliwości multimedialne ze skonfigurowanego auth Anthropic — nie
    jest potrzebna żadna dodatkowa konfiguracja.

    | Właściwość       | Wartość              |
    | -------------- | -------------------- |
    | Model domyślny  | `claude-opus-4-6`    |
    | Obsługiwane wejście | Obrazy, dokumenty PDF |

    Gdy do rozmowy zostanie dołączony obraz lub PDF, OpenClaw automatycznie
    kieruje go przez providera rozumienia multimediów Anthropic.

  </Accordion>

  <Accordion title="Okno kontekstu 1M (beta)">
    Okno kontekstu 1M Anthropic jest objęte bramkowaniem beta. Włącz je per model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw mapuje to na `anthropic-beta: context-1m-2025-08-07` w żądaniach.

    <Warning>
    Wymaga dostępu do long-context dla Twojego poświadczenia Anthropic. Starszy auth oparty na tokenie (`sk-ant-oat-*`) jest odrzucany dla żądań kontekstu 1M — OpenClaw zapisuje ostrzeżenie i wraca do standardowego okna kontekstu.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 z kontekstem 1M">
    `anthropic/claude-opus-4.7` i jego wariant `claude-cli` mają domyślnie okno
    kontekstu 1M — nie potrzeba `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle nieprawidłowy">
    Auth tokenem Anthropic może wygasnąć albo zostać cofnięty. W nowych konfiguracjach przejdź na klucz API Anthropic.
  </Accordion>

  <Accordion title='Nie znaleziono klucza API dla providera "anthropic"'>
    Auth jest **per agent**. Nowi agenci nie dziedziczą kluczy głównego agenta. Uruchom onboarding ponownie dla tego agenta albo skonfiguruj klucz API na hoście gateway, a następnie sprawdź przez `openclaw models status`.
  </Accordion>

  <Accordion title='Nie znaleziono poświadczeń dla profilu "anthropic:default"'>
    Uruchom `openclaw models status`, aby zobaczyć, który profil auth jest aktywny. Uruchom onboarding ponownie albo skonfiguruj klucz API dla ścieżki tego profilu.
  </Accordion>

  <Accordion title="Brak dostępnego profilu auth (wszystkie w cooldownie)">
    Sprawdź `openclaw models status --json` pod kątem `auth.unusableProfiles`. Cooldowny limitu szybkości Anthropic mogą być zależne od modelu, więc model pokrewny Anthropic może nadal nadawać się do użycia. Dodaj kolejny profil Anthropic albo poczekaj na koniec cooldownu.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="CLI Backends" href="/pl/gateway/cli-backends" icon="terminal">
    Szczegóły konfiguracji i runtime backendu Claude CLI.
  </Card>
  <Card title="Cache promptów" href="/pl/reference/prompt-caching" icon="database">
    Jak działa cache promptów u różnych providerów.
  </Card>
  <Card title="OAuth i auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
