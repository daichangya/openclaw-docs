---
read_when:
    - Ви хочете використовувати моделі Mistral в OpenClaw
    - Вам потрібна транскрипція в реальному часі Voxtral для Voice Call
    - Вам потрібні онбординг API key Mistral і посилання на моделі
summary: Використовуйте моделі Mistral і транскрипцію Voxtral з OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T06:46:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw підтримує Mistral як для маршрутизації текстових/візуальних моделей (`mistral/...`), так і
для аудіотранскрипції через Voxtral у media understanding.
Mistral також можна використовувати для memory embeddings (`memorySearch.provider = "mistral"`).

- Провайдер: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Початок роботи

<Steps>
  <Step title="Отримайте свій API key">
    Створіть API key у [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Або передайте key безпосередньо:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Задайте стандартну модель">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Вбудований каталог LLM

Наразі OpenClaw постачається з таким вбудованим каталогом Mistral:

| Посилання на модель              | Вхід        | Контекст | Макс. вивід | Примітки                                                        |
| -------------------------------- | ----------- | -------- | ----------- | --------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384      | Стандартна модель                                               |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192       | Mistral Medium 3.1                                              |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384      | Mistral Small 4; налаштовуваний reasoning через API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768      | Pixtral                                                         |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096       | Кодування                                                       |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768      | Devstral 2                                                      |
| `mistral/magistral-small`        | text        | 128,000  | 40,000      | З увімкненим reasoning                                          |

## Аудіотранскрипція (Voxtral)

Використовуйте Voxtral для пакетної аудіотранскрипції через конвеєр
media understanding.

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
Шлях media transcription використовує `/v1/audio/transcriptions`. Стандартна аудіомодель для Mistral — `voxtral-mini-latest`.
</Tip>

## Потоковий STT для Voice Call

Вбудований plugin `mistral` реєструє Voxtral Realtime як провайдер потокового
STT для Voice Call.

| Параметр      | Шлях конфігурації                                                    | Стандартно                              |
| ------------- | -------------------------------------------------------------------- | --------------------------------------- |
| API key       | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Резервне значення з `MISTRAL_API_KEY`   |
| Модель        | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602` |
| Кодування     | `...mistral.encoding`                                                | `pcm_mulaw`                             |
| Частота дискретизації | `...mistral.sampleRate`                                       | `8000`                                  |
| Цільова затримка | `...mistral.targetStreamingDelayMs`                               | `800`                                   |

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
За замовчуванням OpenClaw використовує для потокового STT Mistral `pcm_mulaw` на 8 кГц, щоб Voice Call
міг напряму пересилати медіакадри Twilio. Використовуйте `encoding: "pcm_s16le"` і
відповідний `sampleRate` лише якщо ваш вхідний потік уже є raw PCM.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Налаштовуваний reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` відповідає Mistral Small 4 і підтримує [adjustable reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) у Chat Completions API через `reasoning_effort` (`none` мінімізує додаткове мислення у виводі; `high` показує повні сліди мислення перед остаточною відповіддю).

    OpenClaw зіставляє рівень **thinking** сесії з API Mistral:

    | Рівень thinking в OpenClaw                     | `reasoning_effort` у Mistral |
    | ---------------------------------------------- | ---------------------------- |
    | **off** / **minimal**                          | `none`                       |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Інші моделі у вбудованому каталозі Mistral не використовують цей параметр. Продовжуйте використовувати моделі `magistral-*`, якщо вам потрібна нативна поведінка Mistral з пріоритетом reasoning.
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral може надавати memory embeddings через `/v1/embeddings` (стандартна модель: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth і base URL">
    - Для auth Mistral використовується `MISTRAL_API_KEY`.
    - Base URL провайдера за замовчуванням: `https://api.mistral.ai/v1`.
    - Стандартна модель онбордингу — `mistral/mistral-large-latest`.
    - Z.AI використовує Bearer auth із вашим API key.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Media understanding" href="/uk/nodes/media-understanding" icon="microphone">
    Налаштування аудіотранскрипції та вибір провайдера.
  </Card>
</CardGroup>
