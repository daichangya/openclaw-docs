---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію підписки Codex замість API-ключів
    - Вам потрібні суворіші правила виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T03:02:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c44feb226b92f4067283e6a95fa4c38aeb2b6f6107a2f6c6e788ad1f8a899405
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API-ключ** — прямий доступ до OpenAI Platform з тарифікацією за використання (`openai/*` моделі)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (`openai-codex/*` моделі)
- **Обв’язка app-server Codex** — нативне виконання через app-server Codex (`openai/*` моделі плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI офіційно підтримує використання OAuth підписки у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

Провайдер, модель, середовище виконання та канал — це окремі рівні. Якщо ці позначення
плутаються, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Мета                                          | Використовуйте                                          | Примітки                                                                     |
| --------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Пряма тарифікація за API-ключем               | `openai/gpt-5.5`                                        | Установіть `OPENAI_API_KEY` або запустіть онбординг API-ключа OpenAI.       |
| GPT-5.5 з автентифікацією підписки ChatGPT/Codex | `openai-codex/gpt-5.5`                                  | Маршрут PI за замовчуванням для OAuth Codex. Найкращий перший вибір для конфігурацій із підпискою. |
| GPT-5.5 з нативною поведінкою app-server Codex | `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"` | Примусово використовує обв’язку app-server Codex для цього посилання на модель. |
| Генерація або редагування зображень           | `openai/gpt-image-2`                                    | Працює як з `OPENAI_API_KEY`, так і з OpenAI Codex OAuth.                    |
| Зображення з прозорим фоном                   | `openai/gpt-image-1.5`                                  | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

<Note>
GPT-5.5 доступна як через прямий доступ до OpenAI Platform за API-ключем, так і
через маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку
через `OPENAI_API_KEY`, `openai-codex/gpt-5.5` для Codex OAuth через PI або
`openai/gpt-5.5` з `embeddedHarness.runtime: "codex"` для нативної
обв’язки app-server Codex.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований Plugin app-server Codex. OpenClaw вмикає цей Plugin лише
коли ви явно вибираєте нативну обв’язку Codex за допомогою
`embeddedHarness.runtime: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                         | Статус                                                 |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | провайдер моделі `openai/<model>`                         | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`             | Так                                                    |
| Обв’язка app-server Codex | `openai/<model>` з `embeddedHarness.runtime: codex`       | Так                                                    |
| Пошук у вебі на стороні сервера | нативний інструмент OpenAI Responses                | Так, коли вебпошук увімкнений і жоден провайдер не закріплено |
| Зображення                | `image_generate`                                          | Так                                                    |
| Відео                     | `video_generate`                                          | Так                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                 | Так                                                    |
| Пакетне speech-to-text    | `tools.media.audio` / розуміння медіа                     | Так                                                    |
| Потокове speech-to-text   | Voice Call `streaming.provider: "openai"`                 | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
| Embeddings                | провайдер embedding для пам’яті                           | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та тарифікації за використання.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ на [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai/gpt-5.5` | прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI за API-ключем, якщо ви явно не примусите
    обв’язку app-server Codex. Використовуйте `openai-codex/*` для Codex OAuth через
    PI за замовчуванням або `openai/gpt-5.5` з
    `embeddedHarness.runtime: "codex"` для нативного виконання через app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до OpenAI API відхиляють цю модель, і поточний каталог Codex теж її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API-ключа. Хмарний Codex потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для безголових середовищ або конфігурацій, де колбек незручний, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість колбеку браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | обв’язка app-server Codex | автентифікація app-server Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд автентифікації/профілю. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає і не вмикає автоматично вбудовану обв’язку app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує OAuth-матеріали з `~/.codex`. Увійдіть через OAuth у браузері (типово) або через наведений вище потік device-code — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агентів.
    </Note>

    ### Індикатор статусу

    У чаті `/status` показує, яке середовище виконання моделі активне для поточного сеансу.
    Обв’язка PI за замовчуванням відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудовану обв’язку app-server Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сеанси зберігають записаний для них ідентифікатор обв’язки, тому використайте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Обмеження `contextTokens` у середовищі виконання за замовчуванням: `272000`

    Менше обмеження за замовчуванням на практиці дає кращу затримку та якість. Перевизначте його через `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту середовища виконання.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує метадані каталогу Codex з джерела upstream для `gpt-5.5`, коли вони
    присутні. Якщо живе виявлення Codex не містить рядка `openai-codex/gpt-5.5`, хоча
    обліковий запис автентифікований, OpenClaw синтезує цей рядок OAuth-моделі, щоб
    запуски Cron, субагентів і налаштованої моделі за замовчуванням не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI за API-ключем, так і генерацію
зображень через Codex OAuth через те саме посилання на модель `openai/gpt-image-2`.

| Можливість               | API-ключ OpenAI                    | Codex OAuth                          |
| ------------------------ | ---------------------------------- | ------------------------------------ |
| Посилання на модель      | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація           | `OPENAI_API_KEY`                   | вхід через OpenAI Codex OAuth        |
| Транспорт                | OpenAI Images API                  | бекенд Codex Responses               |
| Максимум зображень на запит | 4                               | 4                                    |
| Режим редагування        | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру   | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API | За можливості зіставляється з підтримуваним розміром |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку перемикання при відмові.
</Note>

`gpt-image-2` є типовим для генерації зображень з тексту OpenAI та редагування зображень.
`gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
з прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту на прозорий фон агенти повинні викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
також і далі підтримується. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи стандартні прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні сумісні з OpenAI кінцеві точки зберігають
налаштовані імена deployment/моделей.

Той самий параметр доступний і для безголових запусків CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Використовуйте ті самі прапорці `--output-format` і `--background` з
`openclaw infer image edit`, коли починаєте з вхідного файла.
`--openai-background` і далі доступний як псевдонім, специфічний для OpenAI.

Для інсталяцій із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw знаходить збережений токен
доступу OAuth і надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не переходить мовчки на API-ключ для цього
запиту. Явно налаштуйте `models.providers.openai` з API-ключем,
власним base URL або кінцевою точкою Azure, якщо хочете використовувати прямий маршрут
OpenAI Images API.
Якщо ця власна кінцева точка зображень розташована в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw і далі
блокує приватні/внутрішні сумісні з OpenAI кінцеві точки зображень, якщо цього явного дозволу немає.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Генерація прозорого PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Модель за замовчуванням | `openai/sora-2`                                                            |
| Режими           | Текст у відео, зображення у відео, редагування одного відео                      |
| Еталонні вхідні дані | 1 зображення або 1 відео                                                      |
| Перевизначення розміру | Підтримується                                                                |
| Інші перевизначення | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з попередженням інструмента |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку перемикання при відмові.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують однаковий оверлей. Старіші моделі GPT-4.x — ні.

Вбудована нативна обв’язка Codex використовує ту саму поведінку GPT-5 і оверлей Heartbeat через інструкції розробника app-server Codex, тому сеанси `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі правила доведення справи до кінця та проактивні вказівки Heartbeat, навіть якщо рештою промпта обв’язки керує Codex.

Внесок GPT-5 додає позначений контракт поведінки для збереження персони, безпеки виконання, дисципліни використання інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналів поведінка відповідей і безшумних повідомлень залишається у спільному системному промпті OpenClaw та політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Рівень дружнього стилю взаємодії є окремим і налаштовується.

| Значення              | Ефект                                      |
| --------------------- | ------------------------------------------ |
| `"friendly"` (за замовчуванням) | Увімкнути рівень дружнього стилю взаємодії |
| `"on"`                | Псевдонім для `"friendly"`                 |
| `"off"`               | Вимкнути лише рівень дружнього стилю       |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Під час виконання значення нечутливі до регістру, тож і `"Off"`, і `"off"` вимикають рівень дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` і далі читається як сумісний запасний варіант, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових повідомлень, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Використовується `OPENAI_API_KEY`, якщо не задано |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити base URL для TTS без впливу на кінцеву точку chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `openai` реєструє пакетне speech-to-text через
    поверхню транскрибування розуміння медіа в OpenClaw.

    - Модель за замовчуванням: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях вхідних даних: multipart-завантаження аудіофайла
    - Підтримується в OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, включно з сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати OpenAI для транскрибування вхідного аудіо:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Підказки для мови та промпта передаються до OpenAI, коли вони задані у
    спільній конфігурації аудіомедіа або в запиті транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Використовується `OPENAI_API_KEY`, якщо не задано |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрибування в реальному часі Plugin Voice Call; голосовий Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Використовується `OPENAI_API_KEY`, якщо не задано |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонапрямлений виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може використовувати ресурс Azure OpenAI для
генерації зображень через перевизначення base URL. На шляху генерації
зображень OpenClaw виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і на нього не впливає `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech) для його параметрів
Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- у вас уже є підписка Azure OpenAI, квота або корпоративна угода
- вам потрібні регіональне зберігання даних або засоби контролю відповідності, які надає Azure
- ви хочете зберегти трафік у межах наявного середовища Azure

### Конфігурація

Для генерації зображень Azure через вбудований провайдер `openai` укажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure і встановіть `apiKey` у
ключ Azure OpenAI (а не ключ OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw розпізнає такі суфікси хостів Azure для маршруту генерації зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи з областю deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує стандартний тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремого виклику все одно перевизначають це значення за замовчуванням.

Інші base URL (публічний OpenAI, сумісні з OpenAI проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Попередні версії трактують будь-який власний
`openai.baseUrl` як публічну кінцеву точку OpenAI і не працюватимуть із deployment генерації
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Якщо змінну не задано, за замовчуванням використовується `2024-12-01-preview`.

### Імена моделей — це імена deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **іменем deployment Azure**, яке ви налаштували в порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило імен deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` у `gpt-image-2`), або надавати їх лише в окремих версіях
моделі. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримується вашим конкретним deployment і версією API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути та маршрути, сумісні з OpenAI**
у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (окрім генерації зображень) використовуйте
потік онбордингу або окрему конфігурацію провайдера Azure — одного лише
`openai.baseUrl` недостатньо, щоб застосувати форму API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket чи SSE)">
    OpenClaw використовує спочатку WebSocket із запасним переходом на SSE (`"auto"`) для `openai/*` і `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентифікації сеансу та ходу для повторів і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (за замовчуванням) | Спочатку WebSocket, потім запасний перехід на SSE |
    | `"sse"` | Примусово лише SSE |
    | `"websocket"` | Примусово лише WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Пов’язана документація OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw типово вмикає прогрів WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути прогрів
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*` і `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` чи `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення сеансу мають пріоритет над конфігурацією. Очищення перевизначення сеансу в UI Sessions повертає сеанс до налаштованого значення за замовчуванням.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Установіть її для кожної моделі в OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-який із цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness Plugin OpenAI автоматично вмикає server-side Compaction:

    - Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Значення `compact_threshold` за замовчуванням: 70% від `contextWindow` (або `80000`, якщо воно недоступне)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, які використовуються у вбудованих запусках. Нативна обв’язка app-server Codex керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних кінцевих точок, як-от Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Власний поріг">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Вимкнути">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` керує лише вставкою `context_management`. Прямі моделі OpenAI Responses однаково примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Із `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія через інструмент
    - Повторює хід із вказівкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний стан блокування, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запуском OpenAI і Codex сімейства GPT-5. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути та маршрути, сумісні з OpenAI">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI та загальні сумісні з OpenAI проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують значення OpenAI `none` для effort
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують суворий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, притаманне лише OpenAI (`service_tier`, `store`, compat reasoning, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу поведінку compat
    - Видаляють Completions `store` із ненативних payload `openai-completions`
    - Приймають JSON passthrough для розширених `params.extra_body`/`params.extraBody` для сумісних із OpenAI проксі Completions
    - Приймають `params.chat_template_kwargs` для сумісних із OpenAI проксі Completions, таких як vLLM
    - Не примушують суворі схеми інструментів чи заголовки, доступні лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і поведінку compat, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання при відмові.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео й вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
