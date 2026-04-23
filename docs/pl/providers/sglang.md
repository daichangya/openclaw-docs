---
read_when:
    - Chcesz uruchomić OpenClaw względem lokalnego serwera SGLang
    - Chcesz używać endpointów `/v1` zgodnych z OpenAI z własnymi modelami
summary: Uruchamiaj OpenClaw z SGLang (samohostowany serwer zgodny z OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T10:08:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang może udostępniać modele open source przez **zgodne z OpenAI** API HTTP.
OpenClaw może łączyć się z SGLang przy użyciu API `openai-completions`.

OpenClaw może też **automatycznie wykrywać** dostępne modele z SGLang, gdy wykonasz
opt-in przez `SGLANG_API_KEY` (dowolna wartość działa, jeśli Twój serwer nie wymusza auth)
i nie zdefiniujesz jawnego wpisu `models.providers.sglang`.

OpenClaw traktuje `sglang` jako lokalnego providera zgodnego z OpenAI, który obsługuje
strumieniowe rozliczanie użycia, więc liczby tokenów statusu/kontekstu mogą aktualizować się na podstawie
odpowiedzi `stream_options.include_usage`.

## Pierwsze kroki

<Steps>
  <Step title="Uruchom SGLang">
    Uruchom SGLang z serwerem zgodnym z OpenAI. Twój base URL powinien udostępniać
    endpointy `/v1` (na przykład `/v1/models`, `/v1/chat/completions`). SGLang
    często działa pod adresem:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Ustaw klucz API">
    Dowolna wartość działa, jeśli na Twoim serwerze nie skonfigurowano auth:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Uruchom onboarding albo ustaw model bezpośrednio">
    ```bash
    openclaw onboard
    ```

    Albo skonfiguruj model ręcznie:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Wykrywanie modeli (niejawny provider)

Gdy ustawione jest `SGLANG_API_KEY` (albo istnieje profil auth) i **nie**
zdefiniujesz `models.providers.sglang`, OpenClaw wykona zapytanie do:

- `GET http://127.0.0.1:30000/v1/models`

i przekształci zwrócone identyfikatory w wpisy modeli.

<Note>
Jeśli ustawisz `models.providers.sglang` jawnie, automatyczne wykrywanie jest pomijane i
musisz zdefiniować modele ręcznie.
</Note>

## Jawna konfiguracja (ręczne modele)

Użyj jawnej konfiguracji, gdy:

- SGLang działa na innym hoście/porcie.
- Chcesz przypiąć wartości `contextWindow`/`maxTokens`.
- Twój serwer wymaga prawdziwego klucza API (albo chcesz kontrolować nagłówki).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie w stylu proxy">
    SGLang jest traktowany jako backend `/v1` zgodny z OpenAI w stylu proxy, a nie jako
    natywny endpoint OpenAI.

    | Zachowanie | SGLang |
    |----------|--------|
    | Kształtowanie żądań wyłącznie dla OpenAI | Nie jest stosowane |
    | `service_tier`, `store` dla Responses, wskazówki cache promptu | Nie są wysyłane |
    | Kształtowanie payloadu zgodności reasoning | Nie jest stosowane |
    | Ukryte nagłówki atrybucji (`originator`, `version`, `User-Agent`) | Nie są wstrzykiwane przy niestandardowych adresach base URL SGLang |

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    **Serwer jest nieosiągalny**

    Sprawdź, czy serwer działa i odpowiada:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Błędy auth**

    Jeśli żądania kończą się błędami auth, ustaw prawdziwe `SGLANG_API_KEY`, które pasuje
    do konfiguracji Twojego serwera, albo skonfiguruj providera jawnie pod
    `models.providers.sglang`.

    <Tip>
    Jeśli uruchamiasz SGLang bez uwierzytelniania, do wykonania opt-in do wykrywania modeli
    wystarczy dowolna niepusta wartość `SGLANG_API_KEY`.
    </Tip>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym wpisy providerów.
  </Card>
</CardGroup>
