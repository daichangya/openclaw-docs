---
read_when:
    - Ви хочете використовувати генерацію відео Runway в OpenClaw
    - Вам потрібне налаштування ключа API/env для Runway
    - Ви хочете зробити Runway типовим провайдером відео
summary: Налаштування генерації відео Runway в OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-06T00:33:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc615d1a26f7a4b890d29461e756690c858ecb05024cf3c4d508218022da6e76
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw постачається зі вбудованим провайдером `runway` для хостингової генерації відео.

- Ідентифікатор провайдера: `runway`
- Автентифікація: `RUNWAYML_API_SECRET` (канонічний) або `RUNWAY_API_KEY`
- API: генерація відео Runway на основі завдань (опитування `GET /v1/tasks/{id}`)

## Швидкий старт

1. Установіть ключ API:

```bash
openclaw onboard --auth-choice runway-api-key
```

2. Установіть Runway як типовий провайдер відео:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
```

3. Попросіть агента згенерувати відео. Runway буде використано автоматично.

## Підтримувані режими

| Режим          | Модель             | Вхідні референси        |
| -------------- | ------------------ | ----------------------- |
| Текст у відео  | `gen4.5` (типово)  | Немає                   |
| Зображення у відео | `gen4.5`       | 1 локальне або віддалене зображення |
| Відео у відео  | `gen4_aleph`       | 1 локальне або віддалене відео |

- Підтримуються посилання на локальні зображення та відео через URI даних.
- Для режиму відео у відео наразі потрібна саме модель `runway/gen4_aleph`.
- Для запусків лише з текстом наразі доступні співвідношення сторін `16:9` і `9:16`.

## Конфігурація

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

- [Генерація відео](/uk/tools/video-generation) -- спільні параметри інструмента, вибір провайдера та асинхронна поведінка
- [Довідник з конфігурації](/uk/gateway/configuration-reference#agent-defaults)
