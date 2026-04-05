---
read_when:
    - Ви хочете використовувати Deepgram для speech-to-text аудіовкладень
    - Вам потрібен швидкий приклад конфігурації Deepgram
summary: Транскрибування Deepgram для вхідних голосових повідомлень
title: Deepgram
x-i18n:
    generated_at: "2026-04-05T18:13:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: dabd1f6942c339fbd744fbf38040b6a663b06ddf4d9c9ee31e3ac034de9e79d9
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (транскрибування аудіо)

Deepgram — це API для speech-to-text. В OpenClaw він використовується для **транскрибування
вхідного аудіо/голосових повідомлень** через `tools.media.audio`.

Коли його ввімкнено, OpenClaw вивантажує аудіофайл до Deepgram і вставляє транскрипт
у конвеєр відповіді (`{{Transcript}}` + блок `[Audio]`). Це **не потоковий режим**;
використовується кінцева точка транскрибування попередньо записаного аудіо.

Вебсайт: [https://deepgram.com](https://deepgram.com)  
Документація: [https://developers.deepgram.com](https://developers.deepgram.com)

## Швидкий старт

1. Встановіть свій API key:

```
DEEPGRAM_API_KEY=dg_...
```

2. Увімкніть провайдера:

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

## Параметри

- `model`: ідентифікатор моделі Deepgram (типово: `nova-3`)
- `language`: підказка мови (необов’язково)
- `tools.media.audio.providerOptions.deepgram.detect_language`: увімкнути визначення мови (необов’язково)
- `tools.media.audio.providerOptions.deepgram.punctuate`: увімкнути пунктуацію (необов’язково)
- `tools.media.audio.providerOptions.deepgram.smart_format`: увімкнути smart formatting (необов’язково)

Приклад із мовою:

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

Приклад із параметрами Deepgram:

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

## Примітки

- Автентифікація виконується за стандартним порядком автентифікації провайдерів; `DEEPGRAM_API_KEY` — найпростіший варіант.
- Перевизначайте кінцеві точки або заголовки через `tools.media.audio.baseUrl` і `tools.media.audio.headers`, якщо використовуєте проксі.
- Вивід дотримується тих самих правил для аудіо, що й інші провайдери (обмеження розміру, тайм-аути, вставлення транскрипту).
