---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію за підпискою Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T19:09:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 640db14eaeec4197a44b8447df545ea34fba18cafede35fd12a3a3f78fff669e
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API key** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex з доступом за підпискою (моделі `openai-codex/*`)
- **Codex app-server harness** — нативне виконання через Codex app-server (`openai/*` моделі плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI прямо підтримує використання OAuth за підпискою у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

Провайдер, модель, runtime і канал — це окремі шари. Якщо ці позначення
плутаються між собою, прочитайте [Середовища виконання агентів](/uk/concepts/agent-runtimes) перед
зміною конфігурації.

## Швидкий вибір

| Ціль                                          | Використовуйте                                         | Примітки                                                                      |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Пряме тарифікування за API-ключем             | `openai/gpt-5.5`                                       | Установіть `OPENAI_API_KEY` або виконайте онбординг API-ключа OpenAI.         |
| GPT-5.5 з автентифікацією за підпискою ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Типовий маршрут PI для Codex OAuth. Найкращий перший вибір для конфігурацій із підпискою. |
| GPT-5.5 з нативною поведінкою Codex app-server | `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"` | Примусово вмикає Codex app-server harness для цього посилання на модель.      |
| Генерація або редагування зображень           | `openai/gpt-image-2`                                   | Працює як з `OPENAI_API_KEY`, так і з OpenAI Codex OAuth.                     |
| Зображення з прозорим фоном                   | `openai/gpt-image-1.5`                                 | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

<Note>
GPT-5.5 доступна як через прямий доступ до OpenAI Platform API за API-ключем,
так і через маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для
прямого трафіку через `OPENAI_API_KEY`, `openai-codex/gpt-5.5` для Codex OAuth через PI, або
`openai/gpt-5.5` з `embeddedHarness.runtime: "codex"` для нативного
Codex app-server harness.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
вмикає вбудований Plugin Codex app-server. OpenClaw вмикає цей Plugin лише
коли ви явно вибираєте нативний Codex harness за допомогою
`embeddedHarness.runtime: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                          | Статус                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | провайдер моделей `openai/<model>`                         | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`              | Так                                                    |
| Codex app-server harness  | `openai/<model>` з `embeddedHarness.runtime: codex`        | Так                                                    |
| Server-side web search    | нативний інструмент OpenAI Responses                       | Так, коли увімкнено web search і не зафіксовано провайдера |
| Зображення                | `image_generate`                                           | Так                                                    |
| Відео                     | `video_generate`                                           | Так                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | Так                                                    |
| Пакетне speech-to-text    | `tools.media.audio` / розуміння медіа                      | Так                                                    |
| Потокове speech-to-text   | Voice Call `streaming.provider: "openai"`                  | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Talk у Control UI | Так                                                 |
| Embeddings                | провайдер embedding для пам’яті                            | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та тарифікації за використання.

    <Steps>
      <Step title="Отримайте API key">
        Створіть або скопіюйте API key з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
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
    |-----------|-------|------|
    | `openai/gpt-5.5` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI API-key, якщо ви явно не примусите
    Codex app-server harness. Використовуйте `openai-codex/*` для Codex OAuth через
    типовий виконавець PI, або використовуйте `openai/gpt-5.5` з
    `embeddedHarness.runtime: "codex"` для нативного виконання через Codex app-server.
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
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Хмарний Codex потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несумісних із callback конфігурацій додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback браузера на localhost:

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

    ### Зведення маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | автентифікація Codex app-server |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд
    автентифікації/профілю. Префікс моделі `openai-codex/*` також є явним PI-маршрутом для Codex OAuth.
    Він не вибирає і не вмикає автоматично вбудований Codex app-server harness.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через OAuth у браузері (типово) або через наведений вище потік коду пристрою — OpenClaw зберігає отримані облікові дані у власному сховищі автентифікації агента.
    </Note>

    ### Індикатор статусу

    Chat `/status` показує, яке runtime моделі активне для поточної сесії.
    Типовий PI harness відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудований Codex app-server harness, `/status` показує
    `Runtime: OpenAI Codex`. Існуючі сесії зберігають записаний для них ідентифікатор harness, тому використайте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту runtime як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативне `contextWindow`: `1000000`
    - Типове обмеження runtime `contextTokens`: `272000`

    Менше типове обмеження на практиці забезпечує кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

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
    Використовуйте `contextWindow` для оголошення нативних метаданих моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту runtime.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує метадані каталогу Codex з upstream для `gpt-5.5`, коли вони
    доступні. Якщо під час живого виявлення Codex рядок `openai-codex/gpt-5.5`
    відсутній, але обліковий запис автентифіковано, OpenClaw синтезує цей рядок OAuth-моделі, щоб
    Cron, субагент і запуски з налаштованою моделлю за замовчуванням не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI за API-ключем, так і генерацію
зображень через Codex OAuth за тим самим посиланням на модель `openai/gpt-image-2`.

| Можливість                | API key OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                  | бекенд Codex Responses               |
| Макс. зображень на запит  | 4                                  | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API | Відображається у підтримуваний розмір, коли це безпечно |

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
Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

`gpt-image-2` є типовим варіантом як для генерації текст-у-зображення OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються доступними як
явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
з прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту на прозорий фон агенти повинні викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` та
`openai.background: "transparent"`. OpenClaw також захищає публічні маршрути OpenAI і
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і користувацькі OpenAI-сумісні кінцеві точки
зберігають свої налаштовані назви deployment/моделей.

Те саме налаштування доступне для headless запусків CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --openai-background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Використовуйте ті самі прапорці `--output-format` і `--openai-background` з
`openclaw infer image edit`, коли починаєте з вхідного файла.

Для інсталяцій із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано профіль OAuth `openai-codex`, OpenClaw визначає цей збережений OAuth-токен доступу
і надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихий fallback до API-ключа для цього
запиту. Налаштуйте `models.providers.openai` явно з API-ключем,
користувацькою базовою URL-адресою або кінцевою точкою Azure, якщо ви хочете маршрут
через прямий OpenAI Images API.
Якщо ця користувацька кінцева точка зображень розміщена в довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw продовжує
блокувати приватні/внутрішні OpenAI-сумісні кінцеві точки зображень, якщо немає цієї явної згоди.

Згенерувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Згенерувати прозорий PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png openai='{"background":"transparent"}'
```

Редагувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Типова модель    | `openai/sora-2`                                                                   |
| Режими           | Текст-у-відео, зображення-у-відео, редагування одного відео                       |
| Еталонні входи   | 1 зображення або 1 відео                                                          |
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
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тож `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Вбудований нативний Codex harness використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції розробника Codex app-server, тому сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі рекомендації щодо доведення справи до кінця та проактивного Heartbeat, хоча рештою промпта harness володіє Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей і тихих повідомлень, специфічна для каналів, залишається в спільному системному промпті OpenClaw і політиці вихідної доставки. Налаштування GPT-5 завжди ввімкнено для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| --------------------- | ------------------------------------------ |
| `"friendly"` (типово) | Увімкнути шар дружнього стилю взаємодії    |
| `"on"`                | Псевдонім для `"friendly"`                 |
| `"off"`               | Вимкнути лише шар дружнього стилю          |

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
Значення під час виконання не чутливі до регістру, тому і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще читається як сумісний fallback, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових повідомлень, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Fallback до `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS без впливу на кінцеву точку chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `openai` реєструє пакетне speech-to-text через
    поверхню транскрипції медіарозуміння OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: multipart-завантаження аудіофайла
    - Підтримується в OpenClaw всюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, включно з сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати OpenAI для транскрипції вхідного аудіо:

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

    Підказки мови та промпта передаються до OpenAI, коли їх надає
    спільна конфігурація аудіомедіа або запит транскрипції для окремого виклику.

  </Accordion>

  <Accordion title="Транскрипція в реальному часі">
    Вбудований Plugin `openai` реєструє транскрипцію в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Fallback до `OPENAI_API_KEY` |

    <Note>
    Використовує з’єднання WebSocket з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрипції в реальному часі у Voice Call; голос Discord наразі записує короткі сегменти та натомість використовує шлях пакетної транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Fallback до `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двобічний виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може націлюватися на ресурс Azure OpenAI для
генерації зображень через перевизначення базової URL-адреси. На шляху генерації зображень OpenClaw
визначає імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
формат запитів Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech) для його параметрів Azure.
</Note>

Використовуйте Azure OpenAI, якщо:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібна регіональна резидентність даних або засоби відповідності, які надає Azure
- Ви хочете зберігати трафік у межах наявного tenancy Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого провайдера `openai` вкажіть
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
- Використовує шляхи, прив’язані до deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші base URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Попередні версії трактують будь-який користувацький
`openai.baseUrl` як публічну кінцеву точку OpenAI і завершуються помилкою при роботі з deployment зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не встановлено.

### Назви моделей — це назви deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою deployment Azure**, яку ви налаштували в порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило щодо назв deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment, а також підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які публічний OpenAI дозволяє (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише в певних версіях
моделі. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримує ваш конкретний deployment і версія API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути vs OpenAI-compatible
маршрути** у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (поза генерацією зображень) використовуйте
потік онбордингу або окрему конфігурацію провайдера Azure — одного лише `openai.baseUrl`
недостатньо, щоб увімкнути формат API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; див.
акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket vs SSE)">
    OpenClaw використовує спочатку WebSocket з fallback на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE протягом періоду охолодження
    - Додає стабільні заголовки ідентифікації сесії та ходу для повторів і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, fallback на SSE |
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

    Коли його ввімкнено, OpenClaw відображає швидкий режим у пріоритетну обробку OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в інтерфейсі Sessions повертає сесію до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Налаштуйте її для кожної моделі в OpenClaw:

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
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого провайдера через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness Plugin OpenAI автоматично вмикає Server-side compaction:

    - Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо він недоступний)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, що використовуються в embedded запусках. Нативний Codex app-server harness керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явне ввімкнення">
        Корисно для сумісних кінцевих точок, таких як Azure OpenAI Responses:

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
      <Tab title="Користувацький поріг">
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
    `responsesServerCompaction` керує лише вставкою `context_management`. Прямі моделі OpenAI Responses усе одно примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Строгий агентний режим GPT">
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

    З `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія через інструмент
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Обмежено лише OpenAI і Codex запусками сімейства GPT-5. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути vs OpenAI-compatible маршрути">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI порівняно з загальними OpenAI-compatible проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI-значення effort `none`
    - Не додають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають форму запиту, специфічну для OpenAI (`service_tier`, `store`, reasoning-compat, підказки prompt cache)

    **Proxy/compatible маршрути:**
    - Використовують м’якшу сумісну поведінку
    - Видаляють Completions `store` з ненативних payload `openai-completions`
    - Приймають передавання JSON `params.extra_body`/`params.extraBody` для OpenAI-compatible проксі Completions
    - Не примушують строгі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує приховані заголовки атрибуції.

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
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
