---
read_when:
    - Chcesz kierować OpenClaw przez proxy LiteLLM.
    - Potrzebujesz śledzenia kosztów, rejestrowania lub routingu modeli przez LiteLLM.
summary: Uruchamiaj OpenClaw przez LiteLLM Proxy, aby uzyskać ujednolicony dostęp do modeli i śledzenie kosztów.
title: LiteLLM
x-i18n:
    generated_at: "2026-04-26T11:39:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) to brama LLM typu open source, która zapewnia ujednolicone API dla ponad 100 dostawców modeli. Kieruj OpenClaw przez LiteLLM, aby uzyskać scentralizowane śledzenie kosztów, rejestrowanie oraz elastyczność przełączania backendów bez zmiany konfiguracji OpenClaw.

<Tip>
**Dlaczego warto używać LiteLLM z OpenClaw?**

- **Śledzenie kosztów** — Zobacz dokładnie, ile OpenClaw wydaje na wszystkie modele
- **Routing modeli** — Przełączaj się między Claude, GPT-4, Gemini, Bedrock bez zmian w konfiguracji
- **Klucze wirtualne** — Twórz klucze z limitami wydatków dla OpenClaw
- **Rejestrowanie** — Pełne logi żądań/odpowiedzi do debugowania
- **Mechanizmy zapasowe** — Automatyczne przełączenie awaryjne, jeśli główny dostawca jest niedostępny

</Tip>

## Szybki start

<Tabs>
  <Tab title="Onboarding (zalecane)">
    **Najlepsze dla:** najszybszej drogi do działającej konfiguracji LiteLLM.

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

        To wszystko. OpenClaw teraz kieruje ruch przez LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguracja

### Zmienne środowiskowe

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Plik konfiguracyjny

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

## Konfiguracja zaawansowana

### Generowanie obrazów

LiteLLM może również obsługiwać narzędzie `image_generate` przez zgodne z OpenAI
trasy `/images/generations` i `/images/edits`. Skonfiguruj model obrazów LiteLLM
w `agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Adresy URL local loopback LiteLLM, takie jak `http://localhost:4000`, działają bez globalnego
nadpisania dla sieci prywatnej. W przypadku proxy hostowanego w sieci LAN ustaw
`models.providers.litellm.request.allowPrivateNetwork: true`, ponieważ klucz API
zostanie wysłany do skonfigurowanego hosta proxy.

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
    LiteLLM może kierować żądania modeli do różnych backendów. Skonfiguruj to w swoim pliku `config.yaml` LiteLLM:

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

    OpenClaw nadal wysyła żądania do `claude-opus-4-6` — LiteLLM obsługuje routing.

  </Accordion>

  <Accordion title="Wyświetlanie użycia">
    Sprawdź panel LiteLLM lub API:

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
    - LiteLLM domyślnie działa pod adresem `http://localhost:4000`
    - OpenClaw łączy się przez zgodny z OpenAI punkt końcowy `/v1` proxy LiteLLM
    - Natywne kształtowanie żądań wyłącznie dla OpenAI nie ma zastosowania przez LiteLLM:
      brak `service_tier`, brak Responses `store`, brak podpowiedzi dotyczących pamięci podręcznej promptów oraz brak
      kształtowania ładunku zgodności z rozumowaniem OpenAI
    - Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
      nie są wstrzykiwane przy niestandardowych adresach URL bazowych LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
Informacje o ogólnej konfiguracji dostawców i zachowaniu przełączania awaryjnego znajdziesz w sekcji [Dostawcy modeli](/pl/concepts/model-providers).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dokumentacja LiteLLM" href="https://docs.litellm.ai" icon="book">
    Oficjalna dokumentacja LiteLLM i dokumentacja referencyjna API.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja referencyjna konfiguracji.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
</CardGroup>
