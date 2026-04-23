---
read_when:
    - Ви хочете використовувати Deepgram speech-to-text для аудіовкладень
    - Ви хочете потокове транскрибування Deepgram для Voice Call
    - Вам потрібен швидкий приклад конфігурації Deepgram
summary: Транскрибування Deepgram для вхідних голосових повідомлень
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T06:45:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Транскрибування аудіо)

Deepgram — це API speech-to-text. В OpenClaw він використовується для
транскрибування вхідного аудіо/голосових повідомлень через `tools.media.audio` і для
потокового STT у Voice Call через `plugins.entries.voice-call.config.streaming`.

Для пакетного транскрибування OpenClaw завантажує повний аудіофайл у Deepgram
і додає транскрипт у конвеєр відповіді (`{{Transcript}}` +
блок `[Audio]`). Для потокового режиму Voice Call OpenClaw пересилає живі кадри G.711
u-law через WebSocket endpoint `listen` у Deepgram і видає часткові або
фінальні транскрипти, щойно Deepgram їх повертає.

| Деталь        | Значення                                                   |
| ------------- | ---------------------------------------------------------- |
| Вебсайт       | [deepgram.com](https://deepgram.com)                       |
| Документація  | [developers.deepgram.com](https://developers.deepgram.com) |
| Автентифікація | `DEEPGRAM_API_KEY`                                        |
| Типова модель | `nova-3`                                                   |

## Початок роботи

<Steps>
  <Step title="Задайте свій API-ключ">
    Додайте свій API-ключ Deepgram до середовища:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Увімкніть провайдера аудіо">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Надішліть голосове повідомлення">
    Надішліть аудіоповідомлення через будь-який підключений канал. OpenClaw транскрибує його
    через Deepgram і додає транскрипт у конвеєр відповіді.
  </Step>
</Steps>

## Параметри конфігурації

| Параметр          | Шлях                                                         | Опис                                  |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | ідентифікатор моделі Deepgram (типово: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | підказка мови (необов’язково)         |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | увімкнення визначення мови (необов’язково) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | увімкнення пунктуації (необов’язково) |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | увімкнення розумного форматування (необов’язково) |

<Tabs>
  <Tab title="З підказкою мови">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="З параметрами Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Потоковий STT для Voice Call

Вбудований Plugin `deepgram` також реєструє провайдера транскрибування в реальному часі
для Plugin Voice Call.

| Налаштування     | Шлях конфігурації                                                    | Типове значення                 |
| ---------------- | -------------------------------------------------------------------- | ------------------------------- |
| API-ключ         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Використовує `DEEPGRAM_API_KEY` як резервне значення |
| Модель           | `...deepgram.model`                                                  | `nova-3`                        |
| Мова             | `...deepgram.language`                                               | (не задано)                     |
| Кодування        | `...deepgram.encoding`                                               | `mulaw`                         |
| Частота дискретизації | `...deepgram.sampleRate`                                        | `8000`                          |
| Endpointing      | `...deepgram.endpointingMs`                                          | `800`                           |
| Проміжні результати | `...deepgram.interimResults`                                      | `true`                          |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call отримує телефонне аудіо як 8 kHz G.711 u-law. Провайдер
потокового режиму Deepgram типово використовує `encoding: "mulaw"` і `sampleRate: 8000`, тож
медіакадри Twilio можна пересилати напряму.
</Note>

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Автентифікація виконується за стандартним порядком автентифікації провайдера. `DEEPGRAM_API_KEY` —
    найпростіший шлях.
  </Accordion>
  <Accordion title="Проксі та власні endpoint">
    Перевизначайте endpoint або заголовки через `tools.media.audio.baseUrl` і
    `tools.media.audio.headers`, якщо використовуєте проксі.
  </Accordion>
  <Accordion title="Поведінка виводу">
    Вивід дотримується тих самих правил для аудіо, що й в інших провайдерів (обмеження розміру, тайм-аути,
    додавання транскрипту).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Інструменти медіа" href="/uk/tools/media-overview" icon="photo-film">
    Огляд конвеєра обробки аудіо, зображень і відео.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації, включно з налаштуваннями медіаінструментів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
  <Card title="FAQ" href="/uk/help/faq" icon="circle-question">
    Поширені запитання щодо налаштування OpenClaw.
  </Card>
</CardGroup>
