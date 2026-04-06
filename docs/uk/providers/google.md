---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен потік автентифікації через API-ключ або OAuth
summary: Налаштування Google Gemini (API-ключ + OAuth, генерація зображень, розуміння медіа, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-06T12:44:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36cc7c7d8d19f6d4a3fb223af36c8402364fc309d14ffe922bd004203ceb1754
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Плагін Google надає доступ до моделей Gemini через Google AI Studio, а також
до генерації зображень, розуміння медіа (зображення/аудіо/відео) і вебпошуку через
Gemini Grounding.

- Постачальник: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Альтернативний постачальник: `google-gemini-cli` (OAuth)

## Швидкий старт

1. Задайте API-ключ:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Задайте типову модель:

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

## OAuth (Gemini CLI)

Альтернативний постачальник `google-gemini-cli` використовує PKCE OAuth замість API-
ключа. Це неофіційна інтеграція; деякі користувачі повідомляють про обмеження
облікового запису. Використовуйте на власний ризик.

- Типова модель: `google-gemini-cli/gemini-3.1-pro-preview`
- Псевдонім: `gemini-cli`
- Обов'язкова передумова для встановлення: локальний Gemini CLI, доступний як `gemini`
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Вхід:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Змінні середовища:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Або варіанти `GEMINI_CLI_*`.)

Якщо запити Gemini CLI OAuth не працюють після входу, задайте
`GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на gateway host і
повторіть спробу.

Якщо вхід завершується помилкою до початку потоку в браузері, переконайтеся, що локальна команда `gemini`
встановлена й присутня в `PATH`. OpenClaw підтримує як встановлення через Homebrew,
так і глобальні встановлення npm, зокрема поширені Windows/npm-схеми.

Примітки щодо використання Gemini CLI JSON:

- Текст відповіді береться з поля CLI JSON `response`.
- Дані використання резервно беруться з `stats`, коли CLI залишає `usage` порожнім.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
  `stats.input_tokens - stats.cached`.

## Можливості

| Можливість             | Підтримується     |
| ---------------------- | ----------------- |
| Завершення чату        | Так               |
| Генерація зображень    | Так               |
| Генерація музики       | Так               |
| Розуміння зображень    | Так               |
| Транскрипція аудіо     | Так               |
| Розуміння відео        | Так               |
| Вебпошук (Grounding)   | Так               |
| Thinking/reasoning     | Так (Gemini 3.1+) |

## Пряме повторне використання кешу Gemini

Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw тепер
передає налаштований дескриптор `cachedContent` у запити Gemini.

- Налаштуйте параметри для окремої моделі або глобально через
  `cachedContent` або застарілий `cached_content`
- Якщо присутні обидва, пріоритет має `cachedContent`
- Приклад значення: `cachedContents/prebuilt-context`
- Використання потрапляння в кеш Gemini нормалізується в OpenClaw `cacheRead` з
  upstream `cachedContentTokenCount`

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

Вбудований постачальник генерації зображень `google` типово використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень за запит
- Режим редагування: увімкнено, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

Постачальник `google-gemini-cli`, доступний лише через OAuth, — це окрема
поверхня текстового inference. Генерація зображень, розуміння медіа та Gemini Grounding залишаються
на ідентифікаторі постачальника `google`.

Щоб використовувати Google як типовий постачальник зображень:

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

Див. [Image Generation](/uk/tools/image-generation) щодо спільних параметрів
інструмента, вибору постачальника та поведінки резервного перемикання.

## Генерація відео

Вбудований плагін `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Типова відеомодель: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video і потоки з одним референсним відео
- Підтримує `aspectRatio`, `resolution` і `audio`
- Поточне обмеження тривалості: **від 4 до 8 секунд**

Щоб використовувати Google як типовий постачальник відео:

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

Див. [Video Generation](/uk/tools/video-generation) щодо спільних параметрів
інструмента, вибору постачальника та поведінки резервного перемикання.

## Генерація музики

Вбудований плагін `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Типова музична модель: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування промптом: `lyrics` і `instrumental`
- Формат виводу: типово `mp3`, а також `wav` для `google/lyria-3-pro-preview`
- Референсні входи: до 10 зображень
- Запуски з підтримкою сесії від'єднуються через спільний потік завдання/статусу, включно з `action: "status"`

Щоб використовувати Google як типовий постачальник музики:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

Див. [Music Generation](/uk/tools/music-generation) щодо спільних параметрів
інструмента, вибору постачальника та поведінки резервного перемикання.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
