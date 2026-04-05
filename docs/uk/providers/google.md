---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен потік auth через API key
summary: Налаштування Google Gemini (API key, генерація зображень, media understanding, web search)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T18:14:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0df5bcbd98e2c1dafea3e9919e9793533ba785120b24f1db12e8e35b1ad23083
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Plugin Google надає доступ до моделей Gemini через Google AI Studio, а також до
генерації зображень, media understanding (зображення/аудіо/відео) і web search через
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API

## Швидкий старт

1. Установіть API key:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Установіть модель за замовчуванням:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## Можливості

| Можливість             | Підтримується     |
| ---------------------- | ----------------- |
| Завершення чату        | Так               |
| Генерація зображень    | Так               |
| Розуміння зображень    | Так               |
| Транскрипція аудіо     | Так               |
| Розуміння відео        | Так               |
| Web search (Grounding) | Так               |
| Thinking/reasoning     | Так (Gemini 3.1+) |

## Пряме повторне використання кешу Gemini

Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw тепер
передає налаштований дескриптор `cachedContent` у запити Gemini.

- Налаштовуйте для окремої моделі або глобально через параметри
  `cachedContent` або застарілий `cached_content`
- Якщо присутні обидва, пріоритет має `cachedContent`
- Приклад значення: `cachedContents/prebuilt-context`
- Використання під час влучання в кеш Gemini нормалізується в OpenClaw як `cacheRead` з
  вхідного `cachedContentTokenCount`

Приклад:

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## Генерація зображень

Вбудований provider генерації зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень за запит
- Режим редагування: увімкнено, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

Генерація зображень, media understanding і Gemini Grounding усі залишаються на
ID provider `google`.

## Примітка щодо середовища

Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
