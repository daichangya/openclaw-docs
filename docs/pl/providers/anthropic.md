---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude przez klucze API lub Claude CLI w OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-25T13:55:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie ścieżki uwierzytelniania:

- **Klucz API** — bezpośredni dostęp do API Anthropic z rozliczaniem zależnym od użycia (modele `anthropic/*`)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude CLI na tym samym hoście

<Warning>
Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc
OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako dozwolone, chyba że
Anthropic opublikuje nową politykę.

W przypadku długotrwale działających hostów Gateway klucze API Anthropic nadal są najjaśniejszą i
najbardziej przewidywalną ścieżką produkcyjną.

Aktualna publiczna dokumentacja Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze do:** standardowego dostępu do API i rozliczania zależnego od użycia.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz klucz API w [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        # wybierz: klucz API Anthropic
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
    **Najlepsze do:** ponownego użycia istniejącego logowania Claude CLI bez osobnego klucza API.

    <Steps>
      <Step title="Upewnij się, że Claude CLI jest zainstalowane i zalogowane">
        Zweryfikuj poleceniem:

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
    Szczegóły konfiguracji i runtime backendu Claude CLI znajdują się w [CLI Backends](/pl/gateway/cli-backends).
    </Note>

    <Tip>
    Jeśli chcesz najjaśniejszej ścieżki rozliczania, użyj zamiast tego klucza API Anthropic. OpenClaw obsługuje także opcje subskrypcyjne z [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Domyślne ustawienia thinking (Claude 4.6)

Modele Claude 4.6 domyślnie używają `adaptive` thinking w OpenClaw, jeśli nie ustawiono jawnego poziomu thinking.

Nadpisz to dla pojedynczej wiadomości za pomocą `/think:<level>` albo w parametrach modelu:

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

OpenClaw obsługuje funkcję cache promptów Anthropic dla uwierzytelniania kluczem API.

| Wartość             | Czas trwania cache | Opis                                      |
| ------------------- | ------------------ | ----------------------------------------- |
| `"short"` (domyślne) | 5 minut            | Stosowane automatycznie dla uwierzytelniania kluczem API |
| `"long"`            | 1 godzina          | Rozszerzony cache                         |
| `"none"`            | Bez cache          | Wyłącza cache promptów                    |

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
  <Accordion title="Nadpisania cache dla agenta">
    Użyj parametrów na poziomie modelu jako bazowych, a następnie nadpisz konkretne agenty przez `agents.list[].params`:

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
    2. `agents.list[].params` (dopasowane `id`, nadpisuje według klucza)

    Dzięki temu jeden agent może zachować długotrwały cache, podczas gdy inny agent na tym samym modelu wyłącza cache dla ruchu skokowego/o niskim ponownym użyciu.

  </Accordion>

  <Accordion title="Uwagi dotyczące Bedrock Claude">
    - Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazanie `cacheRetention`, jeśli jest skonfigurowane.
    - Modele Bedrock inne niż Anthropic mają w runtime wymuszane `cacheRetention: "none"`.
    - Inteligentne ustawienia domyślne dla klucza API ustawiają też `cacheRetention: "short"` dla odwołań do Claude-on-Bedrock, jeśli nie ustawiono jawnej wartości.
  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Tryb szybki">
    Wspólny przełącznik `/fast` OpenClaw obsługuje bezpośredni ruch Anthropic (klucz API i OAuth do `api.anthropic.com`).

    | Polecenie | Mapowane na |
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
    - Wstrzykiwane tylko dla bezpośrednich żądań do `api.anthropic.com`. Trasy przez proxy pozostawiają `service_tier` bez zmian.
    - Jawne parametry `serviceTier` lub `service_tier` mają pierwszeństwo przed `/fast`, gdy ustawione są oba.
    - Na kontach bez pojemności Priority Tier parametr `service_tier: "auto"` może zostać rozwiązany do `standard`.
    </Note>

  </Accordion>

  <Accordion title="Rozumienie mediów (obrazy i PDF)">
    Wbudowany plugin Anthropic rejestruje rozumienie obrazów i plików PDF. OpenClaw
    automatycznie rozwiązuje capability mediów na podstawie skonfigurowanego uwierzytelniania Anthropic — nie
    jest wymagana dodatkowa konfiguracja.

    | Właściwość      | Wartość              |
    | --------------- | -------------------- |
    | Model domyślny  | `claude-opus-4-6`    |
    | Obsługiwane wejście | Obrazy, dokumenty PDF |

    Gdy do konwersacji dołączony jest obraz lub PDF, OpenClaw automatycznie
    kieruje go przez dostawcę rozumienia mediów Anthropic.

  </Accordion>

  <Accordion title="Okno kontekstu 1M (beta)">
    Okno kontekstu 1M Anthropic jest objęte dostępem beta. Włącz je dla konkretnego modelu:

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

    OpenClaw mapuje to w żądaniach na `anthropic-beta: context-1m-2025-08-07`.

    <Warning>
    Wymaga dostępu do długiego kontekstu dla Twoich poświadczeń Anthropic. Starsze uwierzytelnianie tokenem (`sk-ant-oat-*`) jest odrzucane dla żądań kontekstu 1M — OpenClaw zapisuje ostrzeżenie w logach i wraca do standardowego okna kontekstu.
    </Warning>

  </Accordion>

  <Accordion title="Kontekst 1M dla Claude Opus 4.7">
    `anthropic/claude-opus-4.7` i jego wariant `claude-cli` mają domyślnie okno kontekstu 1M —
    nie jest potrzebne `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle nieprawidłowy">
    Uwierzytelnianie tokenem Anthropic wygasa i może zostać cofnięte. W nowych konfiguracjach używaj zamiast tego klucza API Anthropic.
  </Accordion>

  <Accordion title='Nie znaleziono klucza API dla dostawcy "anthropic"'>
    Uwierzytelnianie Anthropic jest **na agenta** — nowe agenty nie dziedziczą kluczy głównego agenta. Uruchom onboarding ponownie dla tego agenta (albo skonfiguruj klucz API na hoście Gateway), a następnie zweryfikuj za pomocą `openclaw models status`.
  </Accordion>

  <Accordion title='Nie znaleziono poświadczeń dla profilu "anthropic:default"'>
    Uruchom `openclaw models status`, aby sprawdzić, który profil uwierzytelniania jest aktywny. Uruchom onboarding ponownie albo skonfiguruj klucz API dla ścieżki tego profilu.
  </Accordion>

  <Accordion title="Brak dostępnego profilu uwierzytelniania (wszystkie w cooldown)">
    Sprawdź `openclaw models status --json` dla `auth.unusableProfiles`. Cooldowny limitów szybkości Anthropic mogą być ograniczone do konkretnego modelu, więc pokrewny model Anthropic może nadal być używalny. Dodaj kolejny profil Anthropic lub poczekaj na koniec cooldownu.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Troubleshooting](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Backendy CLI" href="/pl/gateway/cli-backends" icon="terminal">
    Szczegóły konfiguracji i runtime backendu Claude CLI.
  </Card>
  <Card title="Cache promptów" href="/pl/reference/prompt-caching" icon="database">
    Jak działa cache promptów u różnych dostawców.
  </Card>
  <Card title="OAuth i auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
