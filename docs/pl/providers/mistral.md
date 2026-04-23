---
read_when:
    - Chcesz używać modeli Mistral w OpenClaw
    - Chcesz używać transkrypcji realtime Voxtral dla Voice Call
    - Potrzebujesz onboardingu klucza API Mistral i model refs
summary: Używanie modeli Mistral i transkrypcji Voxtral z OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T10:07:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw obsługuje Mistral zarówno do routingu modeli tekstowych / obrazowych (`mistral/...`), jak i
do transkrypcji audio przez Voxtral w rozumieniu mediów.
Mistral może być także używany do embeddingów pamięci (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Uwierzytelnianie: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Pierwsze kroki

<Steps>
  <Step title="Pobierz swój klucz API">
    Utwórz klucz API w [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Lub przekaż klucz bezpośrednio:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Ustaw model domyślny">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Wbudowany katalog LLM

OpenClaw obecnie dostarcza ten dołączony katalog Mistral:

| Model ref                        | Wejście      | Kontekst | Maks. wyjście | Uwagi                                                           |
| -------------------------------- | ------------ | -------- | ------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image  | 262,144  | 16,384        | Model domyślny                                                   |
| `mistral/mistral-medium-2508`    | text, image  | 262,144  | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image  | 128,000  | 16,384        | Mistral Small 4; regulowane rozumowanie przez API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image  | 128,000  | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`       | text         | 256,000  | 4,096         | Kodowanie                                                        |
| `mistral/devstral-medium-latest` | text         | 262,144  | 32,768        | Devstral 2                                                       |
| `mistral/magistral-small`        | text         | 128,000  | 40,000        | Z włączonym rozumowaniem                                         |

## Transkrypcja audio (Voxtral)

Użyj Voxtral do batch transkrypcji audio przez pipeline rozumienia mediów.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Ścieżka transkrypcji mediów używa `/v1/audio/transcriptions`. Domyślny model audio dla Mistral to `voxtral-mini-latest`.
</Tip>

## Strumieniowe STT dla Voice Call

Dołączony plugin `mistral` rejestruje Voxtral Realtime jako providera
strumieniowego STT dla Voice Call.

| Ustawienie    | Ścieżka konfiguracji                                                   | Domyślnie                               |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| Klucz API     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Awaryjnie używa `MISTRAL_API_KEY`       |
| Model         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Kodowanie     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Sample rate   | `...mistral.sampleRate`                                                | `8000`                                  |
| Docelowe opóźnienie | `...mistral.targetStreamingDelayMs`                              | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw domyślnie ustawia realtime STT Mistral na `pcm_mulaw` przy 8 kHz, aby Voice Call
mógł bezpośrednio przekazywać dalej ramki mediów Twilio. Używaj `encoding: "pcm_s16le"` oraz
pasującego `sampleRate` tylko wtedy, gdy Twój strumień upstream już jest surowym PCM.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Regulowane rozumowanie (mistral-small-latest)">
    `mistral/mistral-small-latest` mapuje się do Mistral Small 4 i obsługuje [regulowane rozumowanie](https://docs.mistral.ai/capabilities/reasoning/adjustable) w API Chat Completions przez `reasoning_effort` (`none` minimalizuje dodatkowe rozumowanie w wyjściu; `high` ujawnia pełne ślady rozumowania przed końcową odpowiedzią).

    OpenClaw mapuje poziom sesyjnego **thinking** do API Mistral:

    | Poziom thinking OpenClaw                         | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Inne dołączone modele katalogu Mistral nie używają tego parametru. Nadal używaj modeli `magistral-*`, gdy chcesz natywnego zachowania Mistral z rozumowaniem jako pierwszym etapem.
    </Note>

  </Accordion>

  <Accordion title="Embeddingi pamięci">
    Mistral może obsługiwać embeddingi pamięci przez `/v1/embeddings` (domyślny model: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Uwierzytelnianie i base URL">
    - Uwierzytelnianie Mistral używa `MISTRAL_API_KEY`.
    - Domyślny `baseUrl` providera to `https://api.mistral.ai/v1`.
    - Domyślny model onboardingowy to `mistral/mistral-large-latest`.
    - Z.AI używa uwierzytelniania Bearer z Twoim kluczem API.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, model refs i zachowania failover.
  </Card>
  <Card title="Rozumienie mediów" href="/pl/nodes/media-understanding" icon="microphone">
    Konfiguracja transkrypcji audio i wybór providera.
  </Card>
</CardGroup>
