---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен потік автентифікації за ключем API
summary: Налаштування Google Gemini (ключ API, генерація зображень, розуміння медіа, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T22:23:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0dc6413ca67e0fe274c7fc1182cf220252aae31266a72e0b251a319d4dd286e
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Плагін Google надає доступ до моделей Gemini через Google AI Studio, а також до
генерації зображень, розуміння медіа (зображення/аудіо/відео) і вебпошуку через
Gemini Grounding.

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API

## Швидкий старт

1. Установіть ключ API:

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
| Транскрибування аудіо  | Так               |
| Розуміння відео        | Так               |
| Вебпошук (Grounding)   | Так               |
| Мислення/міркування    | Так (Gemini 3.1+) |

## Пряме повторне використання кешу Gemini

Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw тепер
передає налаштований дескриптор `cachedContent` у запити Gemini.

- Налаштуйте параметри для окремої моделі або глобально, використовуючи
  `cachedContent` або застарілий `cached_content`
- Якщо присутні обидва, пріоритет має `cachedContent`
- Приклад значення: `cachedContents/prebuilt-context`
- Використання Gemini cache-hit нормалізується в OpenClaw як `cacheRead` з
  вихідного `cachedContentTokenCount`

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

Вбудований провайдер генерації зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнено, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

Генерація зображень, розуміння медіа та Gemini Grounding усі залишаються на
ідентифікаторі провайдера `google`.

Щоб використовувати Google як провайдера зображень за замовчуванням:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів
інструмента, вибору провайдера та поведінки резервного перемикання.

## Генерація відео

Вбудований плагін `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video і потоки з посиланням на одне відео
- Підтримує `aspectRatio`, `resolution` і `audio`
- Поточне обмеження тривалості: **від 4 до 8 секунд**

Щоб використовувати Google як провайдера відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів
інструмента, вибору провайдера та поведінки резервного перемикання.

## Примітка про середовище

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
