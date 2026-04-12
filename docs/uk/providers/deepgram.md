---
read_when:
    - Ви хочете Deepgram speech-to-text для аудіовкладень
    - Вам потрібен швидкий приклад конфігурації Deepgram
summary: Транскрипція Deepgram для вхідних голосових повідомлень
title: Deepgram
x-i18n:
    generated_at: "2026-04-12T10:26:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 091523d6669e3d258f07c035ec756bd587299b6c7025520659232b1b2c1e21a5
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Транскрипція аудіо)

Deepgram — це API speech-to-text. В OpenClaw він використовується для **транскрипції вхідних аудіо/голосових повідомлень** через `tools.media.audio`.

Коли цю функцію ввімкнено, OpenClaw завантажує аудіофайл до Deepgram і вставляє транскрипт
у конвеєр відповіді (`{{Transcript}}` + блок `[Audio]`). Це **не потокова обробка**;
використовується endpoint транскрипції попередньо записаного аудіо.

| Деталь        | Значення                                                   |
| ------------- | ---------------------------------------------------------- |
| Вебсайт       | [deepgram.com](https://deepgram.com)                       |
| Документація  | [developers.deepgram.com](https://developers.deepgram.com) |
| Автентифікація | `DEEPGRAM_API_KEY`                                        |
| Модель за замовчуванням | `nova-3`                                         |

## Початок роботи

<Steps>
  <Step title="Укажіть свій API-ключ">
    Додайте свій API-ключ Deepgram до середовища:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Увімкніть аудіопровайдера">
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
    через Deepgram і вставить транскрипт у конвеєр відповіді.
  </Step>
</Steps>

## Параметри конфігурації

| Параметр         | Шлях                                                        | Опис                                   |
| ---------------- | ----------------------------------------------------------- | -------------------------------------- |
| `model`          | `tools.media.audio.models[].model`                          | ID моделі Deepgram (за замовчуванням: `nova-3`) |
| `language`       | `tools.media.audio.models[].language`                       | Підказка мови (необов’язково)          |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Увімкнути визначення мови (необов’язково) |
| `punctuate`      | `tools.media.audio.providerOptions.deepgram.punctuate`      | Увімкнути пунктуацію (необов’язково)   |
| `smart_format`   | `tools.media.audio.providerOptions.deepgram.smart_format`   | Увімкнути розумне форматування (необов’язково) |

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

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Автентифікація виконується за стандартним порядком автентифікації провайдера. `DEEPGRAM_API_KEY` —
    найпростіший варіант.
  </Accordion>
  <Accordion title="Проксі та користувацькі endpoint-и">
    Замініть endpoint-и або заголовки за допомогою `tools.media.audio.baseUrl` і
    `tools.media.audio.headers`, якщо використовуєте проксі.
  </Accordion>
  <Accordion title="Поведінка виводу">
    Вивід дотримується тих самих правил для аудіо, що й інші провайдери (обмеження розміру, тайм-аути,
    вставка транскрипту).
  </Accordion>
</AccordionGroup>

<Note>
Транскрипція Deepgram підтримує **лише попередньо записане аудіо** (без потокової обробки в реальному часі). OpenClaw
завантажує повний аудіофайл і чекає на повний транскрипт перед тим, як вставити
його в розмову.
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Медіаінструменти" href="/tools/media" icon="photo-film">
    Огляд конвеєра обробки аудіо, зображень і відео.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації, включно з налаштуваннями медіаінструментів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
  <Card title="FAQ" href="/uk/help/faq" icon="circle-question">
    Поширені запитання про налаштування OpenClaw.
  </Card>
</CardGroup>
