---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T22:38:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 524f07dbe30a78a5a4e2ddc373dc6600c07eae4381a1e1b38b8999e27ed932e2
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API-ключ** — прямий доступ до OpenAI Platform з білінгом за використання (`openai/*` моделі)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (`openai-codex/*` моделі)
- **Обв’язка сервера застосунку Codex** — нативне виконання через сервер застосунку Codex (`openai/*` моделі плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI прямо підтримує використання OAuth-підписки в зовнішніх інструментах і робочих процесах, як-от OpenClaw.

Провайдер, модель, середовище виконання й канал — це окремі рівні. Якщо ці позначення
плутаються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes), перш ніж
змінювати конфігурацію.

## Швидкий вибір

| Ціль                                          | Використовуйте                                          | Примітки                                                                     |
| --------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Прямий білінг через API-ключ                  | `openai/gpt-5.5`                                        | Встановіть `OPENAI_API_KEY` або запустіть онбординг OpenAI API-ключа.        |
| GPT-5.5 з автентифікацією через підписку ChatGPT/Codex | `openai-codex/gpt-5.5`                                  | Типовий маршрут PI для Codex OAuth. Найкращий перший вибір для конфігурацій із підпискою. |
| GPT-5.5 з нативною поведінкою сервера застосунку Codex | `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"` | Примусово вмикає обв’язку сервера застосунку Codex для цього посилання на модель. |
| Генерація або редагування зображень           | `openai/gpt-image-2`                                    | Працює як з `OPENAI_API_KEY`, так і з OpenAI Codex OAuth.                    |
| Зображення з прозорим фоном                   | `openai/gpt-image-1.5`                                  | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

<Note>
GPT-5.5 доступна як через прямий доступ до OpenAI Platform за API-ключем, так і
через маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку
через `OPENAI_API_KEY`, `openai-codex/gpt-5.5` для Codex OAuth через PI, або
`openai/gpt-5.5` з `embeddedHarness.runtime: "codex"` для нативної обв’язки
сервера застосунку Codex.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований Plugin сервера застосунку Codex. OpenClaw вмикає цей Plugin лише
коли ви явно вибираєте нативну обв’язку Codex через
`embeddedHarness.runtime: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI          | Поверхня OpenClaw                                         | Статус                                                 |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses           | провайдер моделей `openai/<model>`                        | Так                                                    |
| Моделі підписки Codex      | `openai-codex/<model>` з OAuth `openai-codex`             | Так                                                    |
| Обв’язка сервера застосунку Codex | `openai/<model>` з `embeddedHarness.runtime: codex` | Так                                                    |
| Пошук у вебі на боці сервера | нативний інструмент OpenAI Responses                    | Так, коли вебпошук увімкнено і провайдера не закріплено |
| Зображення                 | `image_generate`                                          | Так                                                    |
| Відео                      | `video_generate`                                          | Так                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`            | Так                                                    |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа        | Так                                                    |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"`     | Так                                                    |
| Голос у реальному часі     | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
| Embeddings                 | провайдер embedding для пам’яті                           | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та білінгу за використання.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ у [панелі керування OpenAI Platform](https://platform.openai.com/api-keys).
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

    ### Зведення маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai/gpt-5.5` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI за API-ключем, якщо ви явно не примусите
    обв’язку сервера застосунку Codex. Використовуйте `openai-codex/*` для Codex OAuth через
    типовий виконавець PI, або використовуйте `openai/gpt-5.5` з
    `embeddedHarness.runtime: "codex"` для нативного виконання через сервер застосунку Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API-ключа. Хмарний Codex вимагає входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для безголових або несумісних зі зворотним викликом конфігурацій додайте `--device-code`, щоб увійти за допомогою потоку коду пристрою ChatGPT замість callback через браузер localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть типову модель">
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

    ### Зведення маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Обв’язка сервера застосунку Codex | Автентифікація сервера застосунку Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд автентифікації/профілю. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає й не автовмикає вбудовану обв’язку сервера застосунку Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth із `~/.codex`. Увійдіть через OAuth у браузері (типово) або через потік коду пристрою вище — OpenClaw зберігає отримані облікові дані у власному сховищі автентифікації агента.
    </Note>

    ### Індикатор стану

    У Chat команда `/status` показує, яке середовище виконання моделі активне для поточної сесії.
    Типова обв’язка PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудовану обв’язку сервера застосунку Codex, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сесії зберігають записаний для них ідентифікатор обв’язки, тож використайте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Типове обмеження `contextTokens` середовища виконання: `272000`

    Менше типове обмеження на практиці має кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

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

    OpenClaw використовує метадані вищестоящого каталогу Codex для `gpt-5.5`, коли вони
    присутні. Якщо живе виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, тоді як
    обліковий запис автентифіковано, OpenClaw синтезує цей рядок OAuth-моделі, щоб
    виконання Cron, субагента та налаштованої типової моделі не завершувались помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI за API-ключем, так і генерацію зображень
через Codex OAuth з тим самим посиланням на модель `openai/gpt-image-2`.

| Можливість                | API-ключ OpenAI                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | Вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                  | бекенд Codex Responses               |
| Макс. кількість зображень на запит | 4                         | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, зокрема розміри 2K/4K | Підтримується, зокрема розміри 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API | За потреби зіставляється з підтримуваним розміром |

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
Перегляньте [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку резервного перемикання.
</Note>

`gpt-image-2` є типовим як для генерації зображень із тексту OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
із прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту на прозорий фон агенти повинні викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
також досі приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи стандартні прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і власні OpenAI-сумісні ендпойнти зберігають
налаштовані назви deployment/model.

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
`--openai-background` також лишається доступним як специфічний для OpenAI псевдонім.

Для інсталяцій із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw визначає цей збережений OAuth-
токен доступу та надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихий перехід до API-ключа для цього
запиту. Явно налаштуйте `models.providers.openai` з API-ключем,
власним базовим URL або ендпойнтом Azure, якщо хочете використовувати прямий маршрут
OpenAI Images API.
Якщо цей власний ендпойнт зображень розташований у довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw і надалі
блокує приватні/внутрішні OpenAI-сумісні ендпойнти зображень, якщо цього явного дозволу немає.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Згенерувати прозорий PNG:

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
| Типова модель    | `openai/sora-2`                                                                   |
| Режими           | Текст у відео, зображення у відео, редагування одного відео                       |
| Еталонні вхідні дані | 1 зображення або 1 відео                                                      |
| Перевизначення розміру | Підтримується                                                               |
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
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку резервного перемикання.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий накладений шар. Старіші моделі GPT-4.x — ні.

Вбудована нативна обв’язка Codex використовує ту саму поведінку GPT-5 і той самий накладений шар Heartbeat через інструкції розробника сервера застосунку Codex, тож сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ту саму поведінку доведення дій до кінця та проактивні вказівки Heartbeat, навіть попри те, що Codex керує рештою промпта обв’язки.

Внесок GPT-5 додає контракт поведінки з тегами для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповіді та тихих повідомлень лишається у спільному системному промпті OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Рівень дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| --------------------- | ------------------------------------------ |
| `"friendly"` (типово) | Увімкнути рівень дружнього стилю взаємодії |
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
Застарілий параметр `plugins.entries.openai.config.personality` і далі зчитується як сумісний резервний варіант, якщо спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не встановлено.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не встановлено) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не встановлено, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |
    | Базовий URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS без впливу на ендпойнт Chat API.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування для розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Ендпойнт: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: багаточастинне завантаження аудіофайла
    - Підтримується в OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і
      аудіовкладення каналів

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

    Підказки мови та промпта передаються до OpenAI, коли їх указано в
    спільній конфігурації аудіомедіа або в запиті транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не встановлено) |
    | Промпт | `...openai.prompt` | (не встановлено) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрибування в реальному часі у Voice Call; голос Discord наразі записує короткі сегменти й замість цього використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонапрямлений виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Ендпойнти Azure OpenAI

Вбудований провайдер `openai` може працювати з ресурсом Azure OpenAI для
генерації зображень, якщо перевизначити базовий URL. На шляху генерації
зображень OpenClaw виявляє хости Azure в `models.providers.openai.baseUrl` і
автоматично перемикається на формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech), щоб
ознайомитися з його параметрами Azure.
</Note>

Використовуйте Azure OpenAI, якщо:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібна регіональна локалізація даних або засоби контролю відповідності, які надає Azure
- Ви хочете зберегти трафік у межах наявного тенанту Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого провайдера `openai` укажіть
`models.providers.openai.baseUrl` для вашого ресурсу Azure та встановіть `apiKey` як
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
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремого виклику все ще перевизначають цей типовий параметр.

Інші базові URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` вимагає
OpenClaw 2026.4.22 або новішої версії. Раніші версії обробляють будь-який власний
`openai.baseUrl` як публічний ендпойнт OpenAI і не працюватимуть із deployment
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати певну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не встановлено.

### Імена моделей — це імена deployment```

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою deployment Azure**, яку ви налаштували в порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:
__OC_I18N_900023__
Те саме правило назви deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`) або надавати їх лише для конкретних
версій моделі. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримується вашим конкретним deployment і версією API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (окрім генерації зображень) використовуйте
потік онбордингу або окрему конфігурацію провайдера Azure — одного лише
`openai.baseUrl` недостатньо, щоб увімкнути формат API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; див.
акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket чи SSE)">
    OpenClaw використовує спочатку WebSocket із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторів і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, резервний перехід на SSE |
    | `"sse"` | Примусово лише SSE |
    | `"websocket"` | Примусово лише WebSocket |
__OC_I18N_900024__
    Пов’язана документація OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw типово вмикає прогрів WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.
__OC_I18N_900025__
  </Accordion>

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*` і `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.
__OC_I18N_900026__
    <Note>
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Установлюйте її для кожної моделі в OpenClaw:
__OC_I18N_900027__
    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передається лише нативним ендпойнтам OpenAI (`api.openai.com`) і нативним ендпойнтам Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-який із провайдерів через проксі, OpenClaw не змінює `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness у Plugin OpenAI автоматично вмикає Server-side compaction:

    - Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо воно недоступне)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, що використовуються у вбудованих запусках. Нативна обв’язка сервера застосунку Codex керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних ендпойнтів, як-от Azure OpenAI Responses:
__OC_I18N_900028__      </Tab>
      <Tab title="Власний поріг">__OC_I18N_900029__      </Tab>
      <Tab title="Вимкнути">__OC_I18N_900030__      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` керує лише вставкою `context_management`. Прямі моделі OpenAI Responses усе одно примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший вбудований контракт виконання:
__OC_I18N_900031__
    З `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, якщо доступна дія інструмента
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками сімейства GPT-5 OpenAI та Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі ендпойнти OpenAI, Codex і Azure OpenAI та загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, що підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу сумісну поведінку
    - Видаляють `store` Completions із ненативних payload `openai-completions`
    - Приймають передавання JSON через `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Не примушують строгі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладно про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
