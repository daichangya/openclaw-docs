---
read_when:
    - Chcesz kierować OpenClaw przez proxy LiteLLM
    - Potrzebujesz śledzenia kosztów, logowania lub routingu modeli przez LiteLLM
summary: Uruchamiaj OpenClaw przez LiteLLM Proxy, aby uzyskać ujednolicony dostęp do modeli i śledzenie kosztów
title: LiteLLM
x-i18n:
    generated_at: "2026-04-23T10:07:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f9665b204126861a7dbbd426b26a624e60fd219a44756cec6a023df73848cef
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) to bramka LLM typu open source, która zapewnia ujednolicone API dla ponad 100 providerów modeli. Kieruj OpenClaw przez LiteLLM, aby uzyskać scentralizowane śledzenie kosztów, logowanie i elastyczność przełączania backendów bez zmiany konfiguracji OpenClaw.

<Tip>
**Dlaczego warto używać LiteLLM z OpenClaw?**

- **Śledzenie kosztów** — zobacz dokładnie, ile OpenClaw wydaje na wszystkie modele
- **Routing modeli** — przełączaj między Claude, GPT-4, Gemini, Bedrock bez zmian w konfiguracji
- **Klucze wirtualne** — twórz klucze z limitami wydatków dla OpenClaw
- **Logowanie** — pełne logi żądań/odpowiedzi do debugowania
- **Fallbacki** — automatyczny failover, jeśli Twój główny provider nie działa

</Tip>

## Szybki start

<Tabs>
  <Tab title="Onboarding (zalecane)">
    **Najlepsze dla:** najszybszej ścieżki do działającej konfiguracji LiteLLM.

    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Konfiguracja ręczna">
    **Najlepsze dla:** pełnej kontroli nad instalacją i konfiguracją.

    <Steps>
      <Step title="Uruchom LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Skieruj OpenClaw do LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        To wszystko. OpenClaw kieruje teraz ruch przez LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguracja

### Zmienne środowiskowe

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Plik konfiguracji

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Tematy zaawansowane

<AccordionGroup>
  <Accordion title="Klucze wirtualne">
    Utwórz dedykowany klucz dla OpenClaw z limitami wydatków:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Użyj wygenerowanego klucza jako `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Routing modeli">
    LiteLLM może kierować żądania modeli do różnych backendów. Skonfiguruj to w `config.yaml` LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw nadal wysyła żądania do `claude-opus-4-6` — routing obsługuje LiteLLM.

  </Accordion>

  <Accordion title="Podgląd użycia">
    Sprawdź dashboard albo API LiteLLM:

    ```bash
    # Informacje o kluczu
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Logi wydatków
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Uwagi o zachowaniu proxy">
    - LiteLLM domyślnie działa na `http://localhost:4000`
    - OpenClaw łączy się przez zgodny z OpenAI endpoint `/v1` w stylu proxy LiteLLM
    - Natywne kształtowanie żądań wyłącznie dla OpenAI nie ma zastosowania przez LiteLLM:
      brak `service_tier`, brak `store` dla Responses, brak wskazówek cache promptu i brak
      kształtowania payloadu zgodności reasoning OpenAI
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
      nie są wstrzykiwane przy niestandardowych adresach base URL LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Ogólne informacje o konfiguracji providerów i zachowaniu failover znajdziesz w [Model Providers](/pl/concepts/model-providers).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dokumentacja LiteLLM" href="https://docs.litellm.ai" icon="book">
    Oficjalna dokumentacja LiteLLM i dokumentacja API.
  </Card>
  <Card title="Providerzy modeli" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
</CardGroup>
