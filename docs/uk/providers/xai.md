---
read_when:
    - Ви хочете використовувати моделі Grok в OpenClaw
    - Ви налаштовуєте автентифікацію xAI або ідентифікатори моделі
summary: Використовуйте моделі xAI Grok в OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T00:39:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw постачається з вбудованим Plugin провайдера `xai` для моделей Grok.

## Початок роботи

<Steps>
  <Step title="Створіть API-ключ">
    Створіть API-ключ у [консолі xAI](https://console.x.ai/).
  </Step>
  <Step title="Установіть свій API-ключ">
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
OpenClaw використовує xAI Responses API як вбудований транспорт xAI. Той самий
`XAI_API_KEY` також може забезпечувати Grok-підтримувані `web_search`, нативний `x_search`
і віддалений `code_execution`.
Якщо ви зберігаєте ключ xAI у `plugins.entries.xai.config.webSearch.apiKey`,
вбудований провайдер моделей xAI також повторно використовує цей ключ як запасний варіант.
Налаштування `code_execution` розміщено в `plugins.entries.xai.config.codeExecution`.
</Note>

## Каталог вбудованих моделей

OpenClaw містить такі сімейства моделей xAI з коробки:

| Сімейство      | Ідентифікатори моделей                                                   |
| --------------- | ------------------------------------------------------------------------ |
| Grok 3          | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4          | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast     | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast   | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta  | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code       | `grok-code-fast-1`                                                       |

Plugin також переспрямовує новіші ідентифікатори `grok-4*` і `grok-code-fast*`,
коли вони відповідають тій самій формі API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` і варіанти `grok-4.20-beta-*` —
це поточні посилання Grok з підтримкою зображень у вбудованому каталозі.
</Tip>

## Покриття функцій OpenClaw

Вбудований Plugin відображає поточну публічну поверхню API xAI на спільні
контракти провайдера й інструментів OpenClaw там, де така поведінка природно вписується.

| Можливість xAI              | Поверхня OpenClaw                         | Статус                                                               |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| Chat / Responses            | провайдер моделей `xai/<model>`           | Так                                                                  |
| Пошук у вебі на стороні сервера     | провайдер `web_search` `grok`             | Так                                                                  |
| Пошук X на стороні сервера         | інструмент `x_search`                     | Так                                                                  |
| Виконання коду на стороні сервера  | інструмент `code_execution`               | Так                                                                  |
| Зображення                  | `image_generate`                          | Так                                                                  |
| Відео                       | `video_generate`                          | Так                                                                  |
| Пакетний синтез мовлення    | `messages.tts.provider: "xai"` / `tts`    | Так                                                                  |
| Потоковий TTS               | —                                         | Не надається; контракт TTS OpenClaw повертає завершені аудіобуфери   |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа | Так                                                                  |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "xai"` | Так                                                                  |
| Голос у реальному часі      | —                                         | Ще не надається; інший контракт сесії/WebSocket                      |
| Файли / пакети              | Лише сумісність із загальним API моделей  | Не є нативним інструментом OpenClaw                                  |

<Note>
OpenClaw використовує REST API xAI для зображень/відео/TTS/STT для генерації медіа,
мовлення та пакетної транскрипції, потоковий STT WebSocket xAI для живої
транскрипції голосових дзвінків і Responses API для інструментів моделі, пошуку
та виконання коду. Функції, що потребують інших контрактів OpenClaw, як-от
голосові сесії Realtime, документуються тут як можливості на стороні платформи,
а не як прихована поведінка Plugin.
</Note>

### Відображення Fast-режиму

`/fast on` або `agents.defaults.models["xai/<model>"].params.fastMode: true`
перезаписує нативні запити xAI так:

| Вихідна модель | Ціль Fast-режиму |
| -------------- | ---------------- |
| `grok-3`       | `grok-3-fast`    |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`    |
| `grok-4-0709`  | `grok-4-fast`    |

### Псевдоніми для зворотної сумісності

Застарілі псевдоніми, як і раніше, нормалізуються до канонічних вбудованих ідентифікаторів:

| Застарілий псевдонім        | Канонічний ідентифікатор             |
| --------------------------- | ------------------------------------ |
| `grok-4-fast-reasoning`     | `grok-4-fast`                        |
| `grok-4-1-fast-reasoning`   | `grok-4-1-fast`                      |
| `grok-4.20-reasoning`       | `grok-4.20-beta-latest-reasoning`    |
| `grok-4.20-non-reasoning`   | `grok-4.20-beta-latest-non-reasoning` |

## Функції

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

    - Модель відео за замовчуванням: `xai/grok-imagine-video`
    - Режими: текст у відео, зображення у відео, віддалене редагування відео та віддалене
      розширення відео
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Роздільні здатності: `480P`, `720P`
    - Тривалість: 1–15 секунд для генерації/зображення у відео, 2–10 секунд для
      розширення

    <Warning>
    Локальні відеобуфери не підтримуються. Для
    вхідних даних редагування/розширення відео використовуйте віддалені URL `http(s)`.
    Режим зображення у відео приймає локальні буфери зображень, оскільки
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
    Перегляньте [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента,
    вибір провайдера та поведінку перемикання при збоях.
    </Note>

  </Accordion>

  <Accordion title="Генерація зображень">
    Вбудований Plugin `xai` реєструє генерацію зображень через спільний
    інструмент `image_generate`.

    - Модель зображень за замовчуванням: `xai/grok-imagine-image`
    - Додаткова модель: `xai/grok-imagine-image-pro`
    - Режими: текст у зображення та редагування еталонного зображення
    - Еталонні вхідні дані: одне `image` або до п’яти `images`
    - Співвідношення сторін: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Роздільні здатності: `1K`, `2K`
    - Кількість: до 4 зображень

    OpenClaw запитує в xAI відповіді зображень у форматі `b64_json`, щоб згенеровані медіа можна було
    зберігати й доставляти через звичайний шлях вкладень каналу. Локальні
    еталонні зображення перетворюються на data URL; віддалені посилання `http(s)`
    передаються без змін.

    Щоб використовувати xAI як провайдера зображень за замовчуванням:

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
    сторін, такі як `1:2`, `2:1`, `9:20` і `20:9`. Сьогодні OpenClaw передає лише
    спільні міжпровайдерні елементи керування зображеннями; непідтримувані нативні параметри
    навмисно не надаються через `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Синтез мовлення з тексту">
    Вбудований Plugin `xai` реєструє синтез мовлення з тексту через спільну поверхню
    провайдера `tts`.

    - Голоси: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Голос за замовчуванням: `eve`
    - Формати: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Мова: код BCP-47 або `auto`
    - Швидкість: нативне для провайдера перевизначення швидкості
    - Нативний формат голосових нотаток Opus не підтримується

    Щоб використовувати xAI як провайдера TTS за замовчуванням:

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
    OpenClaw використовує пакетну кінцеву точку xAI `/v1/tts`. xAI також пропонує потоковий TTS
    через WebSocket, але контракт провайдера мовлення OpenClaw наразі очікує
    повний аудіобуфер перед доставкою відповіді.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `xai` реєструє пакетне перетворення мовлення на текст через поверхню
    транскрипції розуміння медіа OpenClaw.

    - Модель за замовчуванням: `grok-stt`
    - Кінцева точка: xAI REST `/v1/stt`
    - Шлях введення: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, включно з сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати xAI для транскрипції вхідного аудіо:

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

    Мову можна вказати через спільну конфігурацію аудіомедіа або в окремому запиті
    на транскрипцію. Підказки prompt приймаються спільною поверхнею OpenClaw,
    але інтеграція xAI REST STT передає лише файл, модель і
    мову, оскільки саме вони природно відповідають поточній публічній кінцевій точці xAI.

  </Accordion>

  <Accordion title="Потокове перетворення мовлення на текст">
    Вбудований Plugin `xai` також реєструє провайдера транскрипції в реальному часі
    для аудіо живих голосових дзвінків.

    - Кінцева точка: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Кодування за замовчуванням: `mulaw`
    - Частота дискретизації за замовчуванням: `8000`
    - Сегментація за замовчуванням: `800ms`
    - Проміжні транскрипції: увімкнено за замовчуванням

    Медіапотік Twilio для Voice Call надсилає аудіокадри G.711 µ-law, тому
    провайдер xAI може передавати ці кадри напряму без транскодування:

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

    Конфігурація, що належить провайдеру, розміщена в
    `plugins.entries.voice-call.config.streaming.providers.xai`. Підтримувані
    ключі: `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` або
    `alaw`), `interimResults`, `endpointingMs` і `language`.

    <Note>
    Цей потоковий провайдер призначений для шляху транскрипції Voice Call у реальному часі.
    Голос Discord зараз записує короткі сегменти й натомість використовує пакетний
    шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Конфігурація x_search">
    Вбудований Plugin xAI надає `x_search` як інструмент OpenClaw для пошуку
    контенту X (раніше Twitter) через Grok.

    Шлях конфігурації: `plugins.entries.xai.config.xSearch`

    | Ключ              | Тип     | За замовчуванням   | Опис                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Увімкнути або вимкнути x_search      |
    | `model`            | string  | `grok-4-1-fast`    | Модель, що використовується для запитів x_search |
    | `inlineCitations`  | boolean | —                  | Додавати вбудовані цитати до результатів |
    | `maxTurns`         | number  | —                  | Максимальна кількість ходів розмови  |
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

  <Accordion title="Конфігурація code_execution">
    Вбудований Plugin xAI надає `code_execution` як інструмент OpenClaw для
    віддаленого виконання коду в ізольованому середовищі xAI.

    Шлях конфігурації: `plugins.entries.xai.config.codeExecution`

    | Ключ              | Тип     | За замовчуванням          | Опис                                     |
    | ----------------- | ------- | ------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true` (якщо ключ доступний) | Увімкнути або вимкнути виконання коду |
    | `model`           | string  | `grok-4-1-fast`           | Модель, що використовується для запитів виконання коду |
    | `maxTurns`        | number  | —                         | Максимальна кількість ходів розмови      |
    | `timeoutSeconds`  | number  | —                         | Тайм-аут запиту в секундах               |

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
    - Наразі автентифікація підтримує лише API-ключ. У
      OpenClaw поки що немає потоку xAI OAuth або device-code.
    - `grok-4.20-multi-agent-experimental-beta-0304` не підтримується на
      звичайному шляху провайдера xAI, оскільки він потребує іншої поверхні API
      на стороні платформи, ніж стандартний транспорт xAI в OpenClaw.
    - Голос xAI Realtime ще не зареєстрований як провайдер OpenClaw. Для нього
      потрібен інший двонапрямлений контракт голосової сесії, ніж для пакетного STT або
      потокової транскрипції.
    - `quality` зображень xAI, `mask` зображень і додаткові нативні співвідношення сторін
      не надаються, доки спільний інструмент `image_generate` не отримає
      відповідні міжпровайдерні елементи керування.
  </Accordion>

  <Accordion title="Додаткові примітки">
    - OpenClaw автоматично застосовує виправлення сумісності схем інструментів і викликів інструментів, специфічні для xAI,
      на спільному шляху виконання.
    - Нативні запити xAI за замовчуванням використовують `tool_stream: true`. Установіть
      `agents.defaults.models["xai/<model>"].params.tool_stream` у `false`, щоб
      вимкнути це.
    - Вбудована обгортка xAI видаляє непідтримувані прапорці strict для схем інструментів і
      ключі payload reasoning перед надсиланням нативних запитів xAI.
    - `web_search`, `x_search` і `code_execution` надаються як інструменти OpenClaw.
      OpenClaw вмикає конкретний вбудований механізм xAI, який потрібен у межах кожного запиту інструмента,
      замість того щоб додавати всі нативні інструменти до кожного ходу чату.
    - `x_search` і `code_execution` належать вбудованому Plugin xAI,
      а не жорстко закодовані в основному runtime моделей.
    - `code_execution` — це віддалене виконання в sandbox xAI, а не локальний
      [`exec`](/uk/tools/exec).
  </Accordion>
</AccordionGroup>

## Живе тестування

Медіашляхи xAI покриваються модульними тестами та live-наборами, що вмикаються за потреби. Live-команди
завантажують секрети з вашої оболонки входу, зокрема `~/.profile`, перед
перевіркою `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Спеціалізований live-файл провайдера синтезує звичайний TTS, PCM TTS,
зручний для телефонії, транскрибує аудіо через пакетний STT xAI, передає той самий PCM через
STT xAI в реальному часі, генерує результат text-to-image і редагує еталонне зображення. Спільний
live-файл для зображень перевіряє того самого провайдера xAI через
вибір runtime OpenClaw, fallback, нормалізацію та шлях медіавкладень.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки fallback.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Усі провайдери" href="/uk/providers/index" icon="grid-2">
    Ширший огляд провайдерів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх усунення.
  </Card>
</CardGroup>
