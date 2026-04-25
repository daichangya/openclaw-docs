---
read_when:
    - Chcesz używać jednego klucza API dla wielu LLMów
    - Chcesz uruchamiać modele przez OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
summary: Użyj ujednoliconego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T13:56:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter udostępnia **ujednolicone API**, które kieruje żądania do wielu modeli za pośrednictwem jednego
endpointu i jednego klucza API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego URL.

## Pierwsze kroki

<Steps>
  <Step title="Pobierz swój klucz API">
    Utwórz klucz API na [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcjonalnie) Przełącz na konkretny model">
    Onboarding domyślnie ustawia `openrouter/auto`. Później wybierz konkretny model:

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
Odwołania do modeli mają postać `openrouter/<provider>/<model>`. Pełną listę
dostępnych dostawców i modeli znajdziesz w [/concepts/model-providers](/pl/concepts/model-providers).
</Note>

Przykłady dołączonego failoveru:

| Model ref                            | Uwagi                               |
| ------------------------------------ | ----------------------------------- |
| `openrouter/auto`                    | Automatyczny routing OpenRouter     |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 przez MoonshotAI          |
| `openrouter/openrouter/healer-alpha` | Trasa OpenRouter Healer Alpha       |
| `openrouter/openrouter/hunter-alpha` | Trasa OpenRouter Hunter Alpha       |

## Generowanie obrazów

OpenRouter może też obsługiwać narzędzie `image_generate`. Użyj modelu obrazów OpenRouter w `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw wysyła żądania obrazów do API obrazów chat completions OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter.

## Zamiana tekstu na mowę

OpenRouter może być też używany jako dostawca TTS przez zgodny z OpenAI
endpoint `/audio/speech`.

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

Jeśli `messages.tts.providers.openrouter.apiKey` zostanie pominięte, TTS użyje ponownie
`models.providers.openrouter.apiKey`, a następnie `OPENROUTER_API_KEY`.

## Uwierzytelnianie i nagłówki

OpenRouter wewnętrznie używa tokenu Bearer z Twoim kluczem API.

W przypadku rzeczywistych żądań OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje także
udokumentowane przez OpenRouter nagłówki atrybucji aplikacji:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Jeśli przekierujesz dostawcę OpenRouter na inny proxy lub bazowy URL, OpenClaw
**nie** wstrzykuje tych specyficznych dla OpenRouter nagłówków ani znaczników cache Anthropic.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Znaczniki cache Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    specyficzne dla OpenRouter znaczniki Anthropic `cache_control`, których OpenClaw używa
    do lepszego ponownego wykorzystania cache promptów w blokach promptów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Wstrzykiwanie Thinking / reasoning">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom Thinking na
    ładunki proxy reasoning OpenRouter. Nieobsługiwane wskazówki modeli oraz
    `openrouter/auto` pomijają to wstrzykiwanie reasoning.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal działa przez ścieżkę proxy zgodną z OpenAI, więc
    natywne kształtowanie żądań tylko dla OpenAI, takie jak `serviceTier`, Responses `store`,
    ładunki zgodności reasoning OpenAI oraz wskazówki cache promptów, nie są przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje tam
    sanityzację thought-signature Gemini, ale nie włącza natywnej walidacji
    replay Gemini ani przepisania bootstrapu.
  </Accordion>

  <Accordion title="Metadane routingu dostawcy">
    Jeśli przekażesz routing dostawcy OpenRouter w parametrach modelu, OpenClaw przekaże
    go jako metadane routingu OpenRouter, zanim uruchomią się wspólne wrappery strumieni.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
