---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен API-ключ або потік автентифікації OAuth
summary: Налаштування Google Gemini (API-ключ + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-26T07:50:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

Plugin Google надає доступ до моделей Gemini через Google AI Studio, а також до
генерації зображень, розуміння медіа (зображення/аудіо/відео), text-to-speech і вебпошуку через
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Параметр runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  повторно використовує OAuth Gemini CLI, зберігаючи canonical refs моделей як `google/*`.

## Початок роботи

Виберіть бажаний спосіб автентифікації й виконайте кроки налаштування.

<Tabs>
  <Tab title="API-ключ">
    **Найкраще для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Установіть типову model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Перевірте, що model доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Змінні середовища `GEMINI_API_KEY` і `GOOGLE_API_KEY` обидві підтримуються. Використовуйте ту, яка у вас уже налаштована.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого API-ключа.

    <Warning>
    Provider `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження акаунтів при використанні OAuth у такий спосіб. Використовуйте на власний ризик.
    </Warning>

    <Steps>
      <Step title="Установіть Gemini CLI">
        Локальна команда `gemini` має бути доступною в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # або npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw підтримує як інсталяції через Homebrew, так і глобальні інсталяції npm, зокрема
        типові схеми Windows/npm.
      </Step>
      <Step title="Увійдіть через OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Перевірте, що model доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Типова model: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Псевдонім: `gemini-cli`

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Або варіанти `GEMINI_CLI_*`.)

    <Note>
    Якщо запити Gemini CLI OAuth після входу завершуються помилкою, установіть `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід завершується помилкою ще до запуску потоку в браузері, переконайтеся, що локальну команду `gemini`
    встановлено й вона є в `PATH`.
    </Note>

    Посилання на model `google-gemini-cli/*` — це застарілі сумісні псевдоніми. Нові
    конфігурації мають використовувати посилання на model `google/*` плюс runtime `google-gemini-cli`,
    якщо потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість            | Підтримка                      |
| --------------------- | ------------------------------ |
| Доповнення чату       | Так                            |
| Генерація зображень   | Так                            |
| Генерація музики      | Так                            |
| Text-to-speech        | Так                            |
| Голос у realtime      | Так (Google Live API)          |
| Розуміння зображень   | Так                            |
| Транскрипція аудіо    | Так                            |
| Розуміння відео       | Так                            |
| Вебпошук (Grounding)  | Так                            |
| Thinking/reasoning    | Так (Gemini 2.5+ / Gemini 3+)  |
| Моделі Gemma 4        | Так                            |

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
елементи керування reasoning для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` з
`thinkingLevel`, щоб типові/низьколатентні запуски не надсилали вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає семантику динамічного thinking Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 не надсилають фіксований `thinkingLevel`, тож
Google може сам вибрати рівень; Gemini 2.5 надсилає динамічний sentinel Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад, `gemma-4-26b-a4b-it`) підтримують режим thinking. OpenClaw
переписує `thinkingBudget` у підтримуваний Google `thinkingLevel` для Gemma 4.
Установлення thinking у `off` зберігає вимкнений стан thinking замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Вбудований provider генерації зображень `google` типово використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнено, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

Щоб використовувати Google як типовий provider зображень:

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

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри tools, вибір provider і поведінку failover.
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
tool `video_generate`.

- Типова відеомодель: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video і потоки з одним опорним відео
- Підтримує `aspectRatio`, `resolution` і `audio`
- Поточне обмеження тривалості: **від 4 до 8 секунд**

Щоб використовувати Google як типовий відеопровайдер:

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

<Note>
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри tools, вибір provider і поведінку failover.
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
tool `music_generate`.

- Типова музична model: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування prompt: `lyrics` і `instrumental`
- Формат виводу: типово `mp3`, а також `wav` у `google/lyria-3-pro-preview`
- Опорні входи: до 10 зображень
- Запуски з підтримкою sessions відокремлюються через спільний потік task/status, зокрема `action: "status"`

Щоб використовувати Google як типовий музичний provider:

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

<Note>
Див. [Генерація музики](/uk/tools/music-generation), щоб дізнатися про спільні параметри tools, вибір provider і поведінку failover.
</Note>

## Text-to-speech

Вбудований speech provider `google` використовує шлях Gemini API TTS з
`gemini-3.1-flash-tts-preview`.

- Типовий голос: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, Opus для цілей voice-note, PCM для Talk/телефонії
- Вивід voice-note: Google PCM обгортається у WAV і перекодовується в 48 kHz Opus за допомогою `ffmpeg`

Щоб використовувати Google як типовий TTS provider:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Говоріть професійно й спокійним тоном.",
        },
      },
    },
  },
}
```

Gemini API TTS використовує підказки природною мовою для керування стилем. Установіть
`audioProfile`, щоб додавати багаторазово використовуваний стильовий prompt перед озвучуваним текстом. Установіть
`speakerName`, коли текст вашого prompt посилається на іменованого мовця.

Gemini API TTS також приймає виразні квадратні audio-теги в тексті,
наприклад `[whispers]` або `[laughs]`. Щоб приховати теги з видимої відповіді чату,
але передати їх у TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Ось чистий текст відповіді.

[[tts:text]][whispers] Ось озвучена версія.[[/tts:text]]
```

<Note>
API-ключ Google Cloud Console, обмежений Gemini API, є валідним для цього
provider. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у realtime

Вбудований Plugin `google` реєструє provider голосу в realtime на основі
Gemini Live API для серверних аудіомостів, таких як Voice Call і Google Meet.

| Параметр              | Шлях конфігурації                                                   | Типове значення                                                                      |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| Голос                 | `...google.voice`                                                   | `Kore`                                                                               |
| Temperature           | `...google.temperature`                                             | (не встановлено)                                                                     |
| Чутливість початку VAD| `...google.startSensitivity`                                        | (не встановлено)                                                                     |
| Чутливість кінця VAD  | `...google.endSensitivity`                                          | (не встановлено)                                                                     |
| Тривалість тиші       | `...google.silenceDurationMs`                                       | (не встановлено)                                                                     |
| API-ключ              | `...google.apiKey`                                                  | Використовує `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` |

Приклад конфігурації realtime для Voice Call:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
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
Google Live API використовує двонапрямлений audio і function calling через WebSocket.
OpenClaw адаптує audio телефонії/мосту Meet до потоку Gemini PCM Live API і
зберігає виклики tools у межах спільного контракту голосу в realtime. Залишайте `temperature`
не встановленим, якщо вам не потрібно змінювати семплювання; OpenClaw не надсилає недодатні значення,
оскільки Google Live може повертати транскрипти без audio для `temperature: 0`.
Транскрипція Gemini API вмикається без `languageCodes`; поточний SDK Google
відхиляє підказки кодів мов на цьому шляху API.
</Note>

<Note>
Сеанси browser Talk у Control UI все ще вимагають provider голосу в realtime з
реалізацією browser-сеансу WebRTC. Наразі цей шлях — OpenAI Realtime; provider
Google призначений для серверних мостів у realtime.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Пряме повторне використання кешу Gemini">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` безпосередньо в запити Gemini.

    - Налаштуйте параметри для кожної model або глобально за допомогою
      `cachedContent` або застарілого `cached_content`
    - Якщо присутні обидва, пріоритет має `cachedContent`
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання збігів кешу Gemini нормалізується в OpenClaw як `cacheRead` з
      вихідного `cachedContentTokenCount`

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

  </Accordion>

  <Accordion title="Примітки щодо використання JSON Gemini CLI">
    Під час використання OAuth provider `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI таким чином:

    - Текст відповіді береться з поля CLI JSON `response`.
    - Використання повертається до `stats`, якщо CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw як `cacheRead`.
    - Якщо `stats.input` відсутнє, OpenClaw виводить вхідні токени з
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Налаштування середовища та daemon">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір model" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, refs моделей і поведінка failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри tool для зображень і вибір provider.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри tool для відео і вибір provider.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри tool для музики і вибір provider.
  </Card>
</CardGroup>
