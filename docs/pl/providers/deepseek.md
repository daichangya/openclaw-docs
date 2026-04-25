---
read_when:
    - Chcesz używać DeepSeek z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub opcji uwierzytelniania w CLI
summary: Konfiguracja DeepSeek (uwierzytelnianie + wybór modelu)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:56:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) udostępnia zaawansowane modele AI z interfejsem API zgodnym z OpenAI.

| Właściwość | Wartość                   |
| -------- | -------------------------- |
| Dostawca | `deepseek`                 |
| Uwierzytelnianie | `DEEPSEEK_API_KEY`         |
| API      | Zgodne z OpenAI            |
| Base URL | `https://api.deepseek.com` |

## Pierwsze kroki

<Steps>
  <Step title="Pobierz klucz API">
    Utwórz klucz API na [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    To poprosi o podanie klucza API i ustawi `deepseek/deepseek-v4-flash` jako model domyślny.

  </Step>
  <Step title="Sprawdź, czy modele są dostępne">
    ```bash
    openclaw models list --provider deepseek
    ```

    Aby sprawdzić wbudowany katalog statyczny bez wymagania działającego Gateway,
    użyj:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Konfiguracja nieinteraktywna">
    W przypadku instalacji skryptowych lub bezobsługowych przekaż wszystkie flagi bezpośrednio:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `DEEPSEEK_API_KEY`
jest dostępne dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`).
</Warning>

## Wbudowany katalog

| Odniesienie modelu           | Nazwa             | Wejście | Kontekst  | Maks. wyjście | Uwagi                                      |
| ---------------------------- | ----------------- | ------- | --------- | ------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000       | Model domyślny; powierzchnia V4 z obsługą myślenia |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000       | Powierzchnia V4 z obsługą myślenia         |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072   | 8,192         | Powierzchnia bez myślenia DeepSeek V3.2    |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072   | 65,536        | Powierzchnia V3.2 z włączonym rozumowaniem |

<Tip>
Modele V4 obsługują kontrolkę `thinking` DeepSeek. OpenClaw odtwarza również
`reasoning_content` DeepSeek w turach uzupełniających, dzięki czemu sesje myślenia z wywołaniami narzędzi
mogą być kontynuowane.
</Tip>

## Myślenie i narzędzia

Sesje myślenia DeepSeek V4 mają bardziej rygorystyczny kontrakt replay niż większość
dostawców zgodnych z OpenAI: gdy wiadomość asystenta z włączonym myśleniem zawiera
wywołania narzędzi, DeepSeek oczekuje, że wcześniejsze `reasoning_content` asystenta zostanie
odesłane w kolejnym żądaniu. OpenClaw obsługuje to wewnątrz Pluginu DeepSeek,
więc normalne użycie narzędzi w wielu turach działa z `deepseek/deepseek-v4-flash` i
`deepseek/deepseek-v4-pro`.

Jeśli przełączysz istniejącą sesję z innego dostawcy zgodnego z OpenAI na
model DeepSeek V4, starsze tury wywołań narzędzi asystenta mogą nie mieć natywnego
`reasoning_content` DeepSeek. OpenClaw uzupełnia to brakujące pole dla żądań myślenia DeepSeek V4,
aby dostawca mógł zaakceptować odtwarzaną historię wywołań narzędzi
bez wymagania `/new`.

Gdy myślenie jest wyłączone w OpenClaw (w tym wybór **None** w interfejsie),
OpenClaw wysyła DeepSeek `thinking: { type: "disabled" }` i usuwa odtwarzane
`reasoning_content` z wychodzącej historii. Dzięki temu sesje z wyłączonym myśleniem
pozostają na ścieżce DeepSeek bez myślenia.

Używaj `deepseek/deepseek-v4-flash` jako domyślnej szybkiej ścieżki. Używaj
`deepseek/deepseek-v4-pro`, gdy chcesz mocniejszego modelu V4 i akceptujesz
wyższy koszt lub większe opóźnienie.

## Testowanie na żywo

Bezpośredni zestaw modeli live obejmuje DeepSeek V4 w nowoczesnym zestawie modeli. Aby
uruchomić tylko bezpośrednie testy modeli DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Ten test live weryfikuje, że oba modele V4 mogą zakończyć działanie oraz że tury
uzupełniające myślenia/narzędzi zachowują ładunek replay wymagany przez DeepSeek.

## Przykład konfiguracji

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odniesień modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji dla agentów, modeli i dostawców.
  </Card>
</CardGroup>
