---
read_when:
    - Chcesz jednego klucza API dla wielu LLM-ów
    - Chcesz uruchamiać modele przez OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
summary: Używaj zunifikowanego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-26T11:39:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter udostępnia **zunifikowane API**, które kieruje żądania do wielu modeli za jednym
punktem końcowym i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie base URL.

## Pierwsze kroki

<Steps>
  <Step title="Pobierz klucz API">
    Utwórz klucz API na [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcjonalnie) Przełącz na konkretny model">
    Onboarding domyślnie ustawia `openrouter/auto`. Później możesz wybrać konkretny model:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Przykład konfiguracji

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Odwołania do modeli

<Note>
Odwołania do modeli używają wzorca `openrouter/<provider>/<model>`. Pełną listę
dostępnych dostawców i modeli znajdziesz na [/concepts/model-providers](/pl/concepts/model-providers).
</Note>

Przykłady dołączonego mechanizmu rezerwowego:

| Odwołanie do modelu                  | Uwagi                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | Automatyczne routowanie OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 przez MoonshotAI    |
| `openrouter/openrouter/healer-alpha` | Trasa OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Trasa OpenRouter Hunter Alpha |

## Generowanie obrazów

OpenRouter może również obsługiwać narzędzie `image_generate`. Użyj modelu obrazów OpenRouter w `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw wysyła żądania obrazów do API obrazów chat completions OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter. Użyj `agents.defaults.imageGenerationModel.timeoutMs` dla wolniejszych modeli obrazów OpenRouter; parametr `timeoutMs` dla pojedynczego wywołania narzędzia `image_generate` nadal ma pierwszeństwo.

## Zamiana tekstu na mowę

OpenRouter może być również używany jako dostawca TTS przez zgodny z OpenAI
punkt końcowy `/audio/speech`.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Jeśli `messages.tts.providers.openrouter.apiKey` jest pominięte, TTS ponownie używa
`models.providers.openrouter.apiKey`, a następnie `OPENROUTER_API_KEY`.

## Uwierzytelnianie i nagłówki

OpenRouter używa pod spodem tokenu Bearer z Twoim kluczem API.

W przypadku rzeczywistych żądań OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje również
udokumentowane przez OpenRouter nagłówki atrybucji aplikacji:

| Nagłówek                 | Wartość               |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`          |

<Warning>
Jeśli przestawisz dostawcę OpenRouter na inny serwer proxy lub base URL, OpenClaw
**nie** wstrzykuje tych nagłówków specyficznych dla OpenRouter ani znaczników pamięci podręcznej Anthropic.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Znaczniki pamięci podręcznej Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    specyficzne dla OpenRouter znaczniki Anthropic `cache_control`, których OpenClaw używa do
    lepszego ponownego użycia pamięci podręcznej promptów dla bloków promptów system/developer.
  </Accordion>

  <Accordion title="Wstrzykiwanie Thinking / reasoning">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom Thinking na
    ładunki proxy reasoning OpenRouter. Nieobsługiwane wskazówki modeli oraz
    `openrouter/auto` pomijają to wstrzykiwanie reasoning.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal działa przez ścieżkę zgodną z OpenAI w stylu proxy, więc
    natywne kształtowanie żądań wyłącznie dla OpenAI, takie jak `serviceTier`, `store` w Responses,
    ładunki zgodności reasoning OpenAI i wskazówki pamięci podręcznej promptów, nie są przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje tam
    sanityzację thought-signature Gemini, ale nie włącza natywnej walidacji powtórzeń Gemini
    ani przepisań bootstrap.
  </Accordion>

  <Accordion title="Metadane routowania dostawcy">
    Jeśli przekażesz routowanie dostawcy OpenRouter w parametrach modelu, OpenClaw przekaże
    je jako metadane routowania OpenRouter, zanim uruchomią się współdzielone wrappery strumienia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji dla agentów, modeli i dostawców.
  </Card>
</CardGroup>
