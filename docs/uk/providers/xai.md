---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте auth xAI або id моделей
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T23:06:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw постачається з вбудованим provider plugin `xai` для моделей Grok.

## Початок роботи

<Steps>
  <Step title="Створіть API key">
    Створіть API key у [консолі xAI](https://console.x.ai/).
  </Step>
  <Step title="Задайте API key">
    Установіть `XAI_API_KEY` або виконайте:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Виберіть модель">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw використовує API xAI Responses як вбудований транспорт xAI. Той самий
`XAI_API_KEY` також може забезпечувати `web_search` на базі Grok, first-class `x_search`
і віддалене `code_execution`.
Якщо ви зберігаєте ключ xAI в `plugins.entries.xai.config.webSearch.apiKey`,
вбудований провайдер моделей xAI також повторно використовує цей ключ як резервний варіант.
Налаштування `code_execution` розміщено в `plugins.entries.xai.config.codeExecution`.
</Note>

## Вбудований каталог

OpenClaw містить ці сімейства моделей xAI одразу з коробки:

| Сімейство      | Id моделей                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin також виконує forward-resolve новіших id `grok-4*` і `grok-code-fast*`, коли
вони дотримуються тієї самої форми API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*` — це
поточні ref Grok із підтримкою зображень у вбудованому каталозі.
</Tip>

## Покриття можливостей OpenClaw

Вбудований Plugin зіставляє поточну публічну поверхню API xAI зі спільними
контрактами провайдерів та інструментів OpenClaw. Можливості, які не вписуються у спільний контракт
(наприклад, streaming TTS і голос у реальному часі), не експонуються — див. таблицю
нижче.

| Можливість xAI             | Поверхня OpenClaw                         | Статус                                                               |
| -------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| Chat / Responses           | Провайдер моделі `xai/<model>`            | Так                                                                  |
| Server-side web search     | Провайдер `web_search` `grok`             | Так                                                                  |
| Server-side X search       | Інструмент `x_search`                     | Так                                                                  |
| Server-side code execution | Інструмент `code_execution`               | Так                                                                  |
| Зображення                 | `image_generate`                          | Так                                                                  |
| Відео                      | `video_generate`                          | Так                                                                  |
| Пакетне text-to-speech     | `messages.tts.provider: "xai"` / `tts`    | Так                                                                  |
| Streaming TTS              | —                                         | Не експонується; контракт TTS в OpenClaw повертає завершені аудіобуфери |
| Пакетне speech-to-text     | `tools.media.audio` / розуміння медіа     | Так                                                                  |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`    | Так                                                                  |
| Голос у реальному часі     | —                                         | Ще не експонується; інший контракт сесії/WebSocket                   |
| Файли / batches            | Лише сумісність загального API моделей    | Не є first-class інструментом OpenClaw                               |

<Note>
OpenClaw використовує REST API xAI для зображень/відео/TTS/STT для генерації медіа,
мовлення та пакетного транскрибування, потоковий WebSocket STT xAI для live
транскрибування голосових викликів, а також API Responses для моделей, пошуку та
інструментів виконання коду. Можливості, які потребують інших контрактів OpenClaw, як-от
сесії голосу в реальному часі, документуються тут як можливості upstream, а не як
прихована поведінка Plugin.
</Note>

### Зіставлення fast-mode

`/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
переписують нативні запити xAI так:

| Вихідна модель | Ціль fast-mode     |
| -------------- | ------------------ |
| `grok-3`       | `grok-3-fast`      |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`      |
| `grok-4-0709`  | `grok-4-fast`      |

### Застарілі псевдоніми сумісності

Застарілі псевдоніми все ще нормалізуються до канонічних вбудованих id:

| Застарілий псевдонім       | Канонічний id                         |
| -------------------------- | ------------------------------------ |
| `grok-4-fast-reasoning`    | `grok-4-fast`                        |
| `grok-4-1-fast-reasoning`  | `grok-4-1-fast`                      |
| `grok-4.20-reasoning`      | `grok-4.20-beta-latest-reasoning`    |
| `grok-4.20-non-reasoning`  | `grok-4.20-beta-latest-non-reasoning` |

## Можливості

<AccordionGroup>
  <Accordion title="Вебпошук">
    Вбудований провайдер вебпошуку `grok` також використовує `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Генерація відео">
    Вбудований Plugin `xai` реєструє генерацію відео через спільний
    інструмент `video_generate`.

    - Стандартна відеомодель: `xai/grok-imagine-video`
    - Режими: text-to-video, image-to-video, віддалене редагування відео та віддалене
      подовження відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільні здатності: `480P`, `720P`
    - Тривалість: 1-15 секунд для generation/image-to-video, 2-10 секунд для
      подовження

    <Warning>
    Локальні буфери відео не приймаються. Для входів
    редагування/подовження відео використовуйте віддалені URL `http(s)`.
    Image-to-video приймає локальні буфери зображень, оскільки
    OpenClaw може кодувати їх як data URL для xAI.
    </Warning>

    Щоб використовувати xAI як провайдера відео за замовчуванням:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента,
    вибору провайдера та поведінки failover.
    </Note>

  </Accordion>

  <Accordion title="Генерація зображень">
    Вбудований Plugin `xai` реєструє генерацію зображень через спільний
    інструмент `image_generate`.

    - Стандартна модель зображень: `xai/grok-imagine-image`
    - Додаткова модель: `xai/grok-imagine-image-pro`
    - Режими: text-to-image і редагування за еталонним зображенням
    - Еталонні входи: одне `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільні здатності: `1K`, `2K`
    - Кількість: до 4 зображень

    OpenClaw запитує в xAI відповіді зображень у форматі `b64_json`, щоб згенеровані медіа можна було
    зберігати й доставляти через звичайний шлях вкладень каналу. Локальні
    еталонні зображення перетворюються на data URL; віддалені посилання `http(s)`
    передаються без змін.

    Щоб використовувати xAI як стандартного провайдера зображень:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI також документує `quality`, `mask`, `user` і додаткові нативні співвідношення
    сторін, як-от `1:2`, `2:1`, `9:20` і `20:9`. OpenClaw наразі передає лише
    спільні міжпровайдерні параметри керування зображеннями; непідтримувані нативні параметри
    навмисно не експонуються через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Вбудований Plugin `xai` реєструє text-to-speech через спільну
    поверхню провайдера `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Стандартний голос: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: нативне перевизначення швидкості провайдера
    - Нативний формат голосових повідомлень Opus не підтримується

    Щоб використовувати xAI як стандартного провайдера TTS:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw використовує пакетний endpoint xAI `/v1/tts`. xAI також пропонує streaming TTS
    через WebSocket, але контракт speech provider в OpenClaw наразі очікує
    повний аудіобуфер до доставлення відповіді.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `xai` також реєструє пакетне speech-to-text через поверхню
    транскрибування розуміння медіа OpenClaw.

    - Стандартна модель: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Вхідний шлях: multipart-завантаження аудіофайла
    - Підтримується в OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і
      аудіовкладення каналів

    Щоб примусово використовувати xAI для транскрибування вхідного аудіо:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Мову можна передавати через спільну конфігурацію аудіомедіа або через запит
    транскрибування для конкретного виклику. Підказки prompt приймаються спільною поверхнею OpenClaw,
    але REST-інтеграція STT xAI передає лише файл, модель і
    мову, оскільки саме вони чисто зіставляються з поточним публічним endpoint xAI.

  </Accordion>

  <Accordion title="Потокове speech-to-text">
    Вбудований Plugin `xai` також реєструє провайдера транскрибування в реальному часі
    для live-аудіо голосових викликів.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Стандартне кодування: `mulaw`
    - Стандартна частота дискретизації: `8000`
    - Стандартне endpointing: `800ms`
    - Проміжні транскрипти: увімкнено за замовчуванням

    Медіапотік Twilio у Voice Call надсилає аудіокадри G.711 µ-law, тому
    провайдер xAI може пересилати ці кадри напряму без перекодування:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Конфігурація, що належить провайдеру, розміщується в
    `plugins.entries.voice-call.config.streaming.providers.xai`. Підтримувані
    ключі: `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` або
    `alaw`), `interimResults`, `endpointingMs` і `language`.

    <Note>
    Цей потоковий провайдер призначений для шляху транскрибування в реальному часі Voice Call.
    Голос у Discord наразі записує короткі сегменти й замість цього використовує пакетний
    шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація x_search">
    Вбудований Plugin xAI експонує `x_search` як інструмент OpenClaw для пошуку
    контенту в X (раніше Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ               | Тип     | За замовчуванням   | Опис                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Увімкнути або вимкнути x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Модель для запитів x_search          |
    | `inlineCitations`  | boolean | —                  | Включати вбудовані цитати в результати |
    | `maxTurns`         | number  | —                  | Максимальна кількість turn діалогу   |
    | `timeoutSeconds`   | number  | —                  | Тайм-аут запиту в секундах           |
    | `cacheTtlMinutes`  | number  | —                  | Час життя кешу в хвилинах            |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Конфігурація виконання коду">
    Вбудований Plugin xAI експонує `code_execution` як інструмент OpenClaw для
    віддаленого виконання коду в середовищі sandbox xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | За замовчуванням          | Опис                                   |
    | ----------------- | ------- | ------------------------- | -------------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути виконання коду |
    | `model`           | string  | `grok-4-1-fast`           | Модель для запитів виконання коду      |
    | `maxTurns`        | number  | —                         | Максимальна кількість turn діалогу     |
    | `timeoutSeconds`  | number  | —                         | Тайм-аут запиту в секундах             |

    <Note>
    Це віддалене виконання в sandbox xAI, а не локальний [`exec`](/uk/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Відомі обмеження">
    - Наразі auth підтримується лише через API key. У
      OpenClaw ще немає потоку xAI OAuth або device-code.
    - `grok-4.20-multi-agent-experimental-beta-0304` не підтримується на
      звичайному шляху провайдера xAI, оскільки він потребує іншої поверхні API upstream,
      ніж стандартний транспорт xAI в OpenClaw.
    - Голос xAI Realtime ще не зареєстровано як провайдера OpenClaw. Йому
      потрібен інший двонапрямний контракт голосової сесії, ніж для пакетного STT або
      потокового транскрибування.
    - `quality` зображень xAI, `mask` зображень і додаткові нативні співвідношення сторін
      не експонуються, доки спільний інструмент `image_generate` не отримає відповідні
      міжпровайдерні параметри керування.
  </Accordion>

  <Accordion title="Додаткові примітки">
    - OpenClaw автоматично застосовує виправлення сумісності схем інструментів і викликів інструментів, специфічні для xAI,
      на спільному шляху runner.
    - Нативні запити xAI за замовчуванням використовують `tool_stream: true`. Установіть
      `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
      вимкнути це.
    - Вбудована обгортка xAI прибирає непідтримувані прапорці strict tool-schema та
      ключі payload reasoning перед надсиланням нативних запитів xAI.
    - `web_search`, `x_search` і `code_execution` експонуються як інструменти OpenClaw.
      OpenClaw вмикає конкретну вбудовану можливість xAI, яка потрібна в кожному запиті інструмента,
      замість того щоб прикріплювати всі нативні інструменти до кожного turn чату.
    - `x_search` і `code_execution` належать вбудованому Plugin xAI, а не
      жорстко закодовані в core runtime моделей.
    - `code_execution` — це віддалене виконання в sandbox xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Live-тестування

Шляхи медіа xAI покриті unit-тестами та live-наборами, що вмикаються за бажанням. Команди
live завантажують секрети з вашої оболонки входу, зокрема з `~/.profile`, перш ніж
перевіряти `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Специфічний для провайдера live-файл синтезує звичайний TTS, придатний для телефонії PCM
TTS, транскрибує аудіо через пакетний STT xAI, потоково передає той самий PCM через
realtime STT xAI, генерує вивід text-to-image і редагує еталонне зображення. Спільний
live-файл зображень перевіряє того самого провайдера xAI через
вибір runtime в OpenClaw, failover, нормалізацію та шлях вкладення медіа.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Усі провайдери" href="/uk/providers/index" icon="grid-2">
    Ширший огляд провайдерів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
