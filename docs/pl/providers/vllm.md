---
read_when:
    - Chcesz uruchamiać OpenClaw względem lokalnego serwera vLLM
    - Chcesz korzystać z endpointów /v1 zgodnych z OpenAI z własnymi modelami
summary: Uruchamianie OpenClaw z vLLM (lokalny serwer zgodny z OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-23T10:08:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6c4ceeb59cc10079630e45263485747eadfc66a66267d27579f466d0c0a91a1
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM może udostępniać modele open source (oraz niektóre niestandardowe) przez **HTTP API zgodne z OpenAI**. OpenClaw łączy się z vLLM za pomocą API `openai-completions`.

OpenClaw może też **automatycznie wykrywać** dostępne modele z vLLM, gdy włączysz to przez `VLLM_API_KEY` (dowolna wartość działa, jeśli Twój serwer nie wymusza auth) i nie zdefiniujesz jawnego wpisu `models.providers.vllm`.

OpenClaw traktuje `vllm` jako lokalnego providera zgodnego z OpenAI, który obsługuje
rozliczanie usage w streamie, więc liczniki tokenów statusu/kontekstu mogą być aktualizowane na podstawie
odpowiedzi `stream_options.include_usage`.

| Właściwość      | Wartość                                  |
| --------------- | ---------------------------------------- |
| ID providera    | `vllm`                                   |
| API             | `openai-completions` (zgodne z OpenAI)   |
| Auth            | zmienna środowiskowa `VLLM_API_KEY`      |
| Domyślny base URL | `http://127.0.0.1:8000/v1`             |

## Pierwsze kroki

<Steps>
  <Step title="Uruchom vLLM z serwerem zgodnym z OpenAI">
    Twój base URL powinien wystawiać endpointy `/v1` (np. `/v1/models`, `/v1/chat/completions`). vLLM zwykle działa pod adresem:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Ustaw zmienną środowiskową klucza API">
    Dowolna wartość działa, jeśli Twój serwer nie wymusza auth:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Wybierz model">
    Zastąp to jednym z ID modeli vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Wykrywanie modeli (provider niejawny)

Gdy ustawiono `VLLM_API_KEY` (lub istnieje profil auth) i **nie** zdefiniowano `models.providers.vllm`, OpenClaw odpytuje:

```
GET http://127.0.0.1:8000/v1/models
```

i konwertuje zwrócone ID na wpisy modeli.

<Note>
Jeśli jawnie ustawisz `models.providers.vllm`, automatyczne wykrywanie zostanie pominięte i musisz zdefiniować modele ręcznie.
</Note>

## Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- vLLM działa na innym hoście lub porcie
- Chcesz przypiąć wartości `contextWindow` lub `maxTokens`
- Twój serwer wymaga prawdziwego klucza API (albo chcesz kontrolować nagłówki)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Lokalny model vLLM",
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

## Zaawansowane uwagi

<AccordionGroup>
  <Accordion title="Zachowanie typu proxy">
    vLLM jest traktowany jako backend `/v1` zgodny z OpenAI typu proxy, a nie natywny
    endpoint OpenAI. Oznacza to:

    | Zachowanie | Stosowane? |
    |----------|----------|
    | Natywne kształtowanie żądań OpenAI | Nie |
    | `service_tier` | Nie jest wysyłane |
    | Odpowiedzi `store` | Nie jest wysyłane |
    | Podpowiedzi prompt-cache | Nie są wysyłane |
    | Kształtowanie payloadu zgodności reasoning OpenAI | Nie jest stosowane |
    | Ukryte nagłówki atrybucji OpenClaw | Nie są wstrzykiwane przy niestandardowych base URL |

  </Accordion>

  <Accordion title="Niestandardowy base URL">
    Jeśli Twój serwer vLLM działa na niestandardowym hoście lub porcie, ustaw `baseUrl` w jawnej konfiguracji providera:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Zdalny model vLLM",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Serwer jest nieosiągalny">
    Sprawdź, czy serwer vLLM działa i jest dostępny:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jeśli widzisz błąd połączenia, sprawdź host, port oraz czy vLLM uruchomiono w trybie serwera zgodnego z OpenAI.

  </Accordion>

  <Accordion title="Błędy auth przy żądaniach">
    Jeśli żądania kończą się błędami auth, ustaw prawdziwe `VLLM_API_KEY` zgodne z konfiguracją Twojego serwera albo skonfiguruj providera jawnie w `models.providers.vllm`.

    <Tip>
    Jeśli Twój serwer vLLM nie wymusza auth, dowolna niepusta wartość `VLLM_API_KEY` działa jako sygnał włączenia dla OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nie wykryto modeli">
    Automatyczne wykrywanie wymaga ustawionego `VLLM_API_KEY` **oraz** braku jawnego wpisu konfiguracji `models.providers.vllm`. Jeśli zdefiniowałeś providera ręcznie, OpenClaw pomija wykrywanie i używa tylko zadeklarowanych modeli.
  </Accordion>
</AccordionGroup>

<Warning>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="OpenAI" href="/pl/providers/openai" icon="bolt">
    Natywny provider OpenAI i zachowanie tras zgodnych z OpenAI.
  </Card>
  <Card title="OAuth i auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i reguły ponownego użycia poświadczeń.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązania.
  </Card>
</CardGroup>
