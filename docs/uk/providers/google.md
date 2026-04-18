---
read_when:
    - Ви хочете використовувати моделі Google Gemini з OpenClaw
    - Вам потрібні API key або потік автентифікації OAuth
summary: Налаштування Google Gemini (API key + OAuth, генерація зображень, розуміння медіа, TTS, вебпошук)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-18T18:25:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Plugin Google надає доступ до моделей Gemini через Google AI Studio, а також до
генерації зображень, розуміння медіа (зображення/аудіо/відео), перетворення тексту на мовлення та вебпошуку через
Gemini Grounding.

- Провайдер: `google`
- Автентифікація: `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- API: Google Gemini API
- Альтернативний провайдер: `google-gemini-cli` (OAuth)

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

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
      <Step title="Установіть модель за замовчуванням">
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
    **Найкраще для:** повторного використання наявного входу Gemini CLI через PKCE OAuth замість окремого API key.

    <Warning>
    Провайдер `google-gemini-cli` є неофіційною інтеграцією. Деякі користувачі
    повідомляють про обмеження акаунта при використанні OAuth у такий спосіб. Використовуйте на власний ризик.
    </Warning>

    <Steps>
      <Step title="Установіть Gemini CLI">
        Локальна команда `gemini` має бути доступною в `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw підтримує як встановлення через Homebrew, так і глобальні встановлення через npm, зокрема
        типові схеми розміщення Windows/npm.
      </Step>
      <Step title="Увійдіть через OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Модель за замовчуванням: `google-gemini-cli/gemini-3-flash-preview`
    - Псевдонім: `gemini-cli`

    **Змінні середовища:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Або варіанти `GEMINI_CLI_*`.)

    <Note>
    Якщо OAuth-запити Gemini CLI не вдаються після входу, установіть `GOOGLE_CLOUD_PROJECT` або
    `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway і повторіть спробу.
    </Note>

    <Note>
    Якщо вхід не вдається до запуску браузерного потоку, переконайтеся, що локальна команда `gemini`
    встановлена й доступна в `PATH`.
    </Note>

    Провайдер `google-gemini-cli`, який працює лише через OAuth, є окремою поверхнею
    текстового виведення. Генерація зображень, розуміння медіа та Gemini Grounding залишаються на
    ідентифікаторі провайдера `google`.

  </Tab>
</Tabs>

## Можливості

| Можливість             | Підтримка                      |
| ---------------------- | ------------------------------ |
| Генерація відповідей у чаті | Так                        |
| Генерація зображень    | Так                            |
| Генерація музики       | Так                            |
| Перетворення тексту на мовлення | Так                    |
| Розуміння зображень    | Так                            |
| Транскрибування аудіо  | Так                            |
| Розуміння відео        | Так                            |
| Вебпошук (Grounding)   | Так                            |
| Thinking/reasoning     | Так (Gemini 2.5+ / Gemini 3+)  |
| Моделі Gemma 4         | Так                            |

<Tip>
Моделі Gemini 3 використовують `thinkingLevel` замість `thinkingBudget`. OpenClaw зіставляє
елементи керування міркуванням для псевдонімів Gemini 3, Gemini 3.1 і `gemini-*-latest` з
`thinkingLevel`, щоб стандартні запуски або запуски з низькою затримкою не надсилали вимкнені
значення `thinkingBudget`.

Моделі Gemma 4 (наприклад, `gemma-4-26b-a4b-it`) підтримують режим thinking. OpenClaw
перезаписує `thinkingBudget` у підтримуваний Google `thinkingLevel` для Gemma 4.
Установлення thinking у `off` зберігає вимкнений thinking замість зіставлення з
`MINIMAL`.
</Tip>

## Генерація зображень

Убудований провайдер генерації зображень `google` за замовчуванням використовує
`google/gemini-3.1-flash-image-preview`.

- Також підтримує `google/gemini-3-pro-image-preview`
- Генерація: до 4 зображень на запит
- Режим редагування: увімкнений, до 5 вхідних зображень
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
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку перемикання при збої.
</Note>

## Генерація відео

Убудований Plugin `google` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `google/veo-3.1-fast-generate-preview`
- Режими: text-to-video, image-to-video та потоки з одним еталонним відео
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
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку перемикання при збої.
</Note>

## Генерація музики

Убудований Plugin `google` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Модель музики за замовчуванням: `google/lyria-3-clip-preview`
- Також підтримує `google/lyria-3-pro-preview`
- Керування підказкою: `lyrics` і `instrumental`
- Формат виводу: `mp3` за замовчуванням, а також `wav` у `google/lyria-3-pro-preview`
- Еталонні вхідні дані: до 10 зображень
- Запуски з підтримкою сесій відокремлюються через спільний потік завдань/стану, зокрема `action: "status"`

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
Див. [Генерація музики](/uk/tools/music-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку перемикання при збої.
</Note>

## Перетворення тексту на мовлення

Убудований мовленнєвий провайдер `google` використовує шлях TTS Gemini API з
`gemini-3.1-flash-tts-preview`.

- Голос за замовчуванням: `Kore`
- Автентифікація: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` або `GOOGLE_API_KEY`
- Вивід: WAV для звичайних вкладень TTS, PCM для Talk/телефонії
- Нативний вивід голосових нотаток: не підтримується на цьому шляху Gemini API, оскільки API повертає PCM, а не Opus

Щоб використовувати Google як провайдера TTS за замовчуванням:

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
        },
      },
    },
  },
}
```

TTS Gemini API приймає виразні аудіотеги у квадратних дужках у тексті, наприклад
`[whispers]` або `[laughs]`. Щоб теги не потрапляли у видиму відповідь чату, але
надсилалися до TTS, помістіть їх у блок `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
API key Google Cloud Console, обмежений Gemini API, є дійсним для цього
провайдера. Це не окремий шлях API Cloud Text-to-Speech.
</Note>

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Пряме повторне використання кешу Gemini">
    Для прямих запусків Gemini API (`api: "google-generative-ai"`) OpenClaw
    передає налаштований дескриптор `cachedContent` у запити Gemini.

    - Налаштовуйте параметри для кожної моделі або глобально за допомогою
      `cachedContent` або застарілого `cached_content`
    - Якщо присутні обидва, `cachedContent` має пріоритет
    - Приклад значення: `cachedContents/prebuilt-context`
    - Використання cache-hit Gemini нормалізується в OpenClaw `cacheRead` з
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

  <Accordion title="Примітки щодо використання JSON у Gemini CLI">
    Під час використання OAuth-провайдера `google-gemini-cli` OpenClaw нормалізує
    JSON-вивід CLI таким чином:

    - Текст відповіді береться з поля CLI JSON `response`.
    - Дані використання беруться з `stats`, якщо CLI залишає `usage` порожнім.
    - `stats.cached` нормалізується в OpenClaw `cacheRead`.
    - Якщо `stats.input` відсутній, OpenClaw обчислює вхідні токени з
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
    Вибір провайдерів, посилань на моделі та поведінки перемикання при збої.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики та вибір провайдера.
  </Card>
</CardGroup>
