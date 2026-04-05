---
read_when:
    - Ви хочете використовувати генерацію зображень fal в OpenClaw
    - Вам потрібен потік автентифікації FAL_KEY
    - Ви хочете використовувати типові значення fal для image_generate або video_generate
summary: налаштування генерації зображень і відео fal в OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-05T22:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f136abdc36826812c9f1930483df308247de07be2dacab4d4c6c1b32d951602c
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw постачається з вбудованим провайдером `fal` для хостингової генерації зображень і відео.

- Провайдер: `fal`
- Автентифікація: `FAL_KEY`
- API: кінцеві точки моделей fal

## Швидкий початок

1. Установіть API-ключ:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Установіть типову модель зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Генерація зображень

Вбудований провайдер генерації зображень `fal` типово використовує
`fal/fal-ai/flux/dev`.

- Генерація: до 4 зображень на запит
- Режим редагування: увімкнено, 1 еталонне зображення
- Підтримує `size`, `aspectRatio` і `resolution`
- Поточне обмеження редагування: кінцева точка редагування зображень fal **не** підтримує
  перевизначення `aspectRatio`

Щоб використовувати fal як типовий провайдер зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Генерація відео

Вбудований провайдер генерації відео `fal` типово використовує
`fal/fal-ai/minimax/video-01-live`.

- Режими: text-to-video і потоки з одним еталонним зображенням

Щоб використовувати fal як типовий провайдер відео:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/minimax/video-01-live",
      },
    },
  },
}
```

## Пов’язане

- [Генерація зображень](/uk/tools/image-generation)
- [Генерація відео](/uk/tools/video-generation)
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults)
