---
read_when:
    - Chcesz używać DeepSeek z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub opcji uwierzytelniania w CLI
summary: Konfiguracja DeepSeek (uwierzytelnianie + wybór modelu)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:22:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) udostępnia zaawansowane modele AI z API zgodnym z OpenAI.

| Właściwość | Wartość                    |
| -------- | -------------------------- |
| Dostawca | `deepseek`                 |
| Uwierzytelnianie     | `DEEPSEEK_API_KEY`         |
| API      | zgodne z OpenAI          |
| Bazowy URL | `https://api.deepseek.com` |

## Pierwsze kroki

<Steps>
  <Step title="Pobierz swój klucz API">
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
jest dostępne dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
`env.shellEnv`).
</Warning>

## Wbudowany katalog

| Odniesienie modelu                    | Nazwa              | Wejście | Kontekst   | Maks. wyjście | Uwagi                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | Model domyślny; powierzchnia V4 z obsługą myślenia |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | Powierzchnia V4 z obsługą myślenia                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | Powierzchnia DeepSeek V3.2 bez myślenia         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | Powierzchnia V3.2 z włączonym rozumowaniem             |

<Tip>
Modele V4 obsługują kontrolkę `thinking` DeepSeek. OpenClaw odtwarza też
`reasoning_content` DeepSeek w kolejnych turach, dzięki czemu sesje myślenia z wywołaniami narzędzi
mogą być kontynuowane.
</Tip>

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
    Wybór dostawców, odniesień modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
