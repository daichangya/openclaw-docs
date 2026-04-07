---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен API-ключ або потік автентифікації OAuth
summary: Налаштування Google Gemini (API-ключ + OAuth, генерація зображень, розуміння медіа, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-07T09:37:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9e558f5ce35c853e0240350be9a1890460c5f7f7fd30b05813a656497dee516
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
- Альтернативний провайдер: `google-gemini-cli` (OAuth)

## Швидкий старт

1. Установіть API-ключ:

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

## OAuth (Gemini CLI)

Альтернативний провайдер `google-gemini-cli` використовує PKCE OAuth замість API-ключа.
Це неофіційна інтеграція; деякі користувачі повідомляють про обмеження
облікового запису. Використовуйте на власний ризик.

- Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`
- Аліас: `gemini-cli`
- Необхідна умова для встановлення: локальний Gemini CLI доступний як `gemini`
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

Якщо запити Gemini CLI OAuth не вдаються після входу, установіть
`GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості шлюзу й
повторіть спробу.

Якщо вхід не вдається до запуску потоку в браузері, переконайтеся, що локальна команда `gemini`
установлена та доступна в `PATH`. OpenClaw підтримує як установлення через Homebrew,
так і глобальні встановлення через npm, включно з поширеними макетами Windows/npm.

Нотатки щодо використання JSON у Gemini CLI:

- Текст відповіді береться з поля CLI JSON `response`.
- Використання повертається до `stats`, якщо CLI залишає `usage` порожнім.
- `stats.cached` нормалізується в OpenClaw `cacheRead`.
- Якщо `stats.input` відсутній, OpenClaw виводить кількість вхідних токенів із
  `stats.input_tokens - stats.cached`.

## Можливості

| Можливість             | Підтримується     |
| ---------------------- | ----------------- |
| Завершення чату        | Так               |
| Генерація зображень    | Так               |
| Генерація музики       | Так               |
| Розуміння зображень    | Так               |
| Транскрибування аудіо  | Так               |
| Розуміння відео        | Так               |
| Вебпошук (Grounding)   | Так               |
| Thinking/reasoning     | Так (Gemini 3.1+) |

## Пряме повторне використання кешу Gemini

Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw тепер
передає налаштований дескриптор `cachedContent` у запити Gemini.

- Налаштовуйте параметри для моделі або глобальні параметри через
  `cachedContent` або застарілий `cached_content`
- Якщо присутні обидва, пріоритет має `cachedContent`
- Приклад значення: `cachedContents/prebuilt-context`
- Використання при влучанні в кеш Gemini нормалізується в OpenClaw `cacheRead` із
  висхідного `cachedContentTokenCount`

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

Провайдер `google-gemini-cli`, що працює лише через OAuth, є окремою поверхнею
текстового виведення. Генерація зображень, розуміння медіа та Gemini Grounding залишаються на
ідентифікаторі провайдера `google`.

Щоб використовувати Google як провайдер зображень за замовчуванням:

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

Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні
параметри інструмента, вибір провайдера та поведінку перемикання при збої.

## Генерація відео

Вбудований плагін `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video та потоки з одним референсним відео
- Підтримує `aspectRatio`, `resolution` і `audio`
- Поточне обмеження тривалості: **від 4 до 8 секунд**

Щоб використовувати Google як провайдер відео за замовчуванням:

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

Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні
параметри інструмента, вибір провайдера та поведінку перемикання при збої.

## Генерація музики

Вбудований плагін `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування підказкою: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` у `google/lyria-3-pro-preview`
- Референсні входи: до 10 зображень
- Запуски з підтримкою сесій від'єднуються через спільний потік завдань/статусу, включно з `action: "status"`

Щоб використовувати Google як музичний провайдер за замовчуванням:

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

Див. [Генерація музики](/uk/tools/music-generation), щоб дізнатися про спільні
параметри інструмента, вибір провайдера та поведінку перемикання при збої.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
