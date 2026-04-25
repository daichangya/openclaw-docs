---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібен ключ API або потік автентифікації OAuth
summary: Налаштування Google Gemini (ключ API + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T20:39:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 990a2567790673261f7b018816ee3fb81fe03e662a78769248ee91311ff5d2fc
    source_path: providers/google.md
    workflow: 15
---

Плагін Google надає доступ до моделей Gemini через Google AI Studio, а також до
генерації зображень, розуміння медіа (зображення/аудіо/відео), перетворення тексту на мовлення та вебпошуку через
Gemini Grounding.

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Опція середовища виконання: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  повторно використовує OAuth Gemini CLI, зберігаючи канонічні посилання на моделі як `google/*`.

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key">
    **Найкраще для:** стандартного доступу до Gemini API через Google AI Studio.

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Встановіть модель за замовчуванням">
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
      <Step title="Переконайтеся, що модель доступна">
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
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого ключа API.

    <Warning>
    Провайдер `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження акаунта при такому використанні OAuth. Використовуйте на власний ризик.
    </Warning>

    <Steps>
      <Step title="Встановіть Gemini CLI">
        Локальна команда `gemini` має бути доступна в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw підтримує як встановлення через Homebrew, так і глобальні встановлення через npm, включно з
        поширеними Windows/npm-макетами.
      </Step>
      <Step title="Увійдіть через OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Модель за замовчуванням: `google/gemini-3.1-pro-preview`
    - Середовище виконання: `google-gemini-cli`
    - Псевдонім: `gemini-cli`

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Або варіанти `GEMINI_CLI_*`.)

    <Note>
    Якщо запити OAuth Gemini CLI не вдаються після входу, встановіть `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід завершується невдачею ще до запуску потоку в браузері, переконайтеся, що локальна команда `gemini`
    встановлена та доступна в `PATH`.
    </Note>

    Посилання на моделі `google-gemini-cli/*` є застарілими псевдонімами сумісності. У нових
    конфігураціях слід використовувати посилання на моделі `google/*` плюс середовище виконання `google-gemini-cli`,
    коли потрібне локальне виконання Gemini CLI.

  </Tab>
</Tabs>

## Можливості

| Можливість            | Підтримка                      |
| --------------------- | ------------------------------ |
| Завершення чату       | Так                            |
| Генерація зображень   | Так                            |
| Генерація музики      | Так                            |
| Перетворення тексту на мовлення | Так                 |
| Голос у реальному часі | Так (Google Live API)         |
| Розуміння зображень   | Так                            |
| Транскрипція аудіо    | Так                            |
| Розуміння відео       | Так                            |
| Вебпошук (Grounding)  | Так                            |
| Мислення/міркування   | Так (Gemini 2.5+ / Gemini 3+)  |
| Моделі Gemma 4        | Так                            |

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
керування міркуванням для Gemini 3, Gemini 3.1 і псевдонімів `gemini-*-latest` з
`thinkingLevel`, щоб типові запуски та запуски з низькою затримкою не надсилали вимкнені
значення `thinkingBudget`.

`/think adaptive` зберігає семантику динамічного мислення Google замість вибору
фіксованого рівня OpenClaw. Gemini 3 і Gemini 3.1 не задають фіксований `thinkingLevel`, тому
Google може вибрати рівень; Gemini 2.5 надсилає динамічний sentinel Google
`thinkingBudget: -1`.

Моделі Gemma 4 (наприклад, `gemma-4-26b-a4b-it`) підтримують режим мислення. OpenClaw
перезаписує `thinkingBudget` у підтримуваний Google `thinkingLevel` для Gemma 4.
Установлення мислення в `off` зберігає вимкнений стан мислення замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Вбудований провайдер генерації зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнено, до 5 вхідних зображень
- Керування геометрією: `size`, `aspectRatio` і `resolution`

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

<Note>
Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Генерація відео

Вбудований Plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video та потоки з посиланням на одне відео
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

<Note>
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Генерація музики

Вбудований Plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування промптом: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` для `google/lyria-3-pro-preview`
- Вхідні дані-посилання: до 10 зображень
- Запуски з підтримкою сесій від’єднуються через спільний потік завдань/статусу, включно з `action: "status"`

Щоб використовувати Google як провайдера музики за замовчуванням:

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
Див. [Генерація музики](/uk/tools/music-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Перетворення тексту на мовлення

Вбудований мовленнєвий провайдер `google` використовує шлях Gemini API TTS з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних TTS-вкладень, Opus для цілей голосових нотаток, PCM для Talk/телефонії
- Вивід голосових нотаток: Google PCM обгортається у WAV і транскодується в 48 кГц Opus за допомогою `ffmpeg`

Щоб використовувати Google як TTS-провайдера за замовчуванням:

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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS використовує промпти природною мовою для керування стилем. Установіть
`audioProfile`, щоб додавати багаторазовий стильовий промпт перед озвученим текстом. Установіть
`speakerName`, якщо текст вашого промпта посилається на іменованого мовця.

Gemini API TTS також приймає виразні квадратні аудіотеги в тексті,
наприклад `[whispers]` або `[laughs]`. Щоб не показувати теги у видимій відповіді чату,
але надсилати їх у TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Ось чистий текст відповіді.

[[tts:text]][whispers] Ось озвучена версія.[[/tts:text]]
```

<Note>
Ключ API Google Cloud Console, обмежений Gemini API, є дійсним для цього
провайдера. Це не окремий шлях Cloud Text-to-Speech API.
</Note>

## Голос у реальному часі

Вбудований Plugin `google` реєструє провайдера голосу в реальному часі на базі
Gemini Live API для бекендових аудіомостів, таких як Voice Call і Google Meet.

| Параметр              | Шлях конфігурації                                                   | Значення за замовчуванням                                                              |
| --------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Модель                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                        |
| Голос                 | `...google.voice`                                                   | `Kore`                                                                                 |
| Temperature           | `...google.temperature`                                             | (не встановлено)                                                                       |
| Чутливість початку VAD | `...google.startSensitivity`                                       | (не встановлено)                                                                       |
| Чутливість завершення VAD | `...google.endSensitivity`                                      | (не встановлено)                                                                       |
| Тривалість тиші       | `...google.silenceDurationMs`                                       | (не встановлено)                                                                       |
| Ключ API              | `...google.apiKey`                                                  | Використовує `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY` як резервне значення |

Приклад конфігурації Voice Call у реальному часі:

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
Google Live API використовує двобічне аудіо та виклик функцій через WebSocket.
OpenClaw адаптує аудіо телефонії/мосту Meet до PCM-потоку Gemini Live API і
зберігає виклики інструментів у спільному контракті голосу в реальному часі. Залишайте `temperature`
не встановленим, якщо вам не потрібні зміни семплювання; OpenClaw пропускає недодатні значення,
оскільки Google Live може повертати транскрипти без аудіо для `temperature: 0`.
Транскрипцію Gemini API увімкнено без `languageCodes`; поточний SDK Google
відхиляє підказки кодів мов на цьому шляху API.
</Note>

<Note>
Сеанси браузера Talk у Control UI, як і раніше, потребують провайдера голосу в реальному часі з
реалізацією браузерного сеансу WebRTC. Наразі цей шлях — OpenAI Realtime; провайдер
Google призначений для бекендових мостів реального часу.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Безпосереднє повторне використання кешу Gemini">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` у запити Gemini.

    - Налаштовуйте параметри для окремих моделей або глобально за допомогою
      `cachedContent` або застарілого `cached_content`
    - Якщо присутні обидва, пріоритет має `cachedContent`
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання Gemini cache-hit нормалізується в OpenClaw як `cacheRead` з
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
    Під час використання OAuth-провайдера `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI таким чином:

    - Текст відповіді береться з поля CLI JSON `response`.
    - Використання бере `stats` як резервне значення, якщо CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw як `cacheRead`.
    - Якщо `stats.input` відсутній, OpenClaw виводить вхідні токени з
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Налаштування середовища та демона">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `GEMINI_API_KEY`
    доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри відеоінструмента та вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри музичного інструмента та вибір провайдера.
  </Card>
</CardGroup>
