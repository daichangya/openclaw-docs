---
read_when:
    - Ви хочете використовувати генерацію відео Runway в OpenClaw
    - Вам потрібне налаштування ключа API / змінної середовища для Runway
    - Ви хочете зробити Runway типовим провайдером відео
summary: Налаштування генерації відео Runway в OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-06T00:19:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87092da3f1a3cb137b0a3dffe1241a5a3d84eb29fa7c3a6b1df9c2871f1c80b6
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw постачається з вбудованим провайдером `runway` для хостингової генерації відео.

- Провайдер: `runway`
- Автентифікація: `RUNWAYML_API_SECRET` (канонічний; `RUNWAY_API_KEY` також працює)
- API: API генерації відео Runway на основі завдань

## Швидкий старт

1. Установіть ключ API:

```bash
openclaw onboard --auth-choice runway-api-key
```

2. Установіть типову модель відео:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Генерація відео

Вбудований провайдер генерації відео `runway` типово використовує `runway/gen4.5`.

- Режими: text-to-video, single-image image-to-video та single-video video-to-video
- Виконання: асинхронне надсилання завдання + опитування через `GET /v1/tasks/{id}`
- Сесії агента: `video_generate` запускає фонове завдання, а пізніші виклики в межах тієї самої сесії тепер повертають статус активного завдання замість створення дубльованого запуску
- Перевірка статусу: `video_generate action=status`
- Локальні посилання на зображення/відео: підтримуються через data URI
- Поточне застереження для video-to-video: OpenClaw наразі вимагає `runway/gen4_aleph` для відеовходів
- Поточне застереження для text-to-video: OpenClaw наразі надає `16:9` і `9:16` для запусків лише з текстом

Щоб використовувати Runway як типовий провайдер відео:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Пов’язане

- [Генерація відео](/uk/tools/video-generation)
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults)
