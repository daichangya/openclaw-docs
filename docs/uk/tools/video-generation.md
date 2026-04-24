---
read_when:
    - Генерація відео через агента
    - Налаштування provider і моделей для генерації відео
    - Розуміння параметрів інструмента `video_generate`
summary: Генеруйте відео з тексту, зображень або наявних відео за допомогою 14 backend provider
title: Генерація відео
x-i18n:
    generated_at: "2026-04-24T03:50:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ddefd4fcde2b22be6631c160ed6e128a97b0800d32c65fb5fe36227ce4f368
    source_path: tools/video-generation.md
    workflow: 15
---

Агенти OpenClaw можуть генерувати відео з текстових prompt, еталонних зображень або наявних відео. Підтримуються чотирнадцять backend provider, кожен із різними варіантами моделей, режимами введення та наборами можливостей. Агент автоматично вибирає потрібного provider на основі вашої конфігурації та доступних API keys.

<Note>
Інструмент `video_generate` з’являється лише тоді, коли доступний принаймні один provider генерації відео. Якщо ви не бачите його серед інструментів агента, задайте API key provider або налаштуйте `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw розглядає генерацію відео як три режими runtime:

- `generate` для запитів text-to-video без еталонних медіа
- `imageToVideo`, коли запит містить одне або кілька еталонних зображень
- `videoToVideo`, коли запит містить одне або кілька еталонних відео

Providers можуть підтримувати будь-яку підмножину цих режимів. Інструмент перевіряє активний
режим перед надсиланням і повідомляє підтримувані режими в `action=list`.

## Швидкий старт

1. Задайте API key для будь-якого підтримуваного provider:

```bash
export GEMINI_API_KEY="your-key"
```

2. За бажанням закріпіть типову модель:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Попросіть агента:

> Згенеруй 5-секундне кінематографічне відео дружнього омара, який серфить на заході сонця.

Агент автоматично викликає `video_generate`. Додавати інструмент до allowlist не потрібно.

## Що відбувається, коли ви генеруєте відео

Генерація відео є асинхронною. Коли агент викликає `video_generate` у сесії:

1. OpenClaw надсилає запит provider і одразу повертає ID завдання.
2. Provider обробляє завдання у фоновому режимі (зазвичай від 30 секунд до 5 хвилин залежно від provider і роздільної здатності).
3. Коли відео готове, OpenClaw пробуджує ту саму сесію внутрішньою подією завершення.
4. Агент публікує готове відео назад в оригінальну розмову.

Поки завдання виконується, дубльовані виклики `video_generate` у тій самій сесії повертають поточний статус завдання замість запуску нової генерації. Використовуйте `openclaw tasks list` або `openclaw tasks show <taskId>`, щоб перевірити прогрес через CLI.

Поза запусками агента, прив’язаними до сесії (наприклад, під час прямих викликів інструмента), інструмент переходить до inline-генерації та повертає кінцевий шлях до медіа в тому ж ході.

### Життєвий цикл завдання

Кожен запит `video_generate` проходить через чотири стани:

1. **queued** -- завдання створено, очікує, поки provider його прийме.
2. **running** -- provider виконує обробку (зазвичай від 30 секунд до 5 хвилин залежно від provider і роздільної здатності).
3. **succeeded** -- відео готове; агент прокидається й публікує його в розмову.
4. **failed** -- помилка provider або тайм-аут; агент прокидається з деталями помилки.

Перевірка статусу через CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Захист від дублікатів: якщо для поточної сесії вже є відеозавдання у стані `queued` або `running`, `video_generate` повертає статус наявного завдання замість запуску нового. Використовуйте `action: "status"`, щоб явно перевірити стан без запуску нової генерації.

## Підтримувані providers

| Provider              | Типова модель                  | Текст | Еталонне зображення                                  | Еталонне відео   | API key                                  |
| --------------------- | ------------------------------ | ----- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                   | Так   | Так (віддалений URL)                                 | Так (віддалений URL) | `MODELSTUDIO_API_KEY`                 |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`      | Так   | До 2 зображень (лише моделі I2V; перший і останній кадр) | Ні           | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      | Так   | До 2 зображень (перший і останній кадр через role)   | Ні               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` | Так   | До 9 еталонних зображень                             | До 3 відео       | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                     | Так   | 1 зображення                                         | Ні               | `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live` | Так   | 1 зображення                                         | Ні               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview`| Так   | 1 зображення                                         | 1 відео          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`           | Так   | 1 зображення                                         | Ні               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                       | Так   | 1 зображення                                         | 1 відео          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                   | Так   | Так (віддалений URL)                                 | Так (віддалений URL) | `QWEN_API_KEY`                        |
| Runway                | `gen4.5`                       | Так   | 1 зображення                                         | 1 відео          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`       | Так   | 1 зображення                                         | Ні               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                         | Так   | 1 зображення (`kling`)                               | Ні               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`           | Так   | 1 зображення                                         | 1 відео          | `XAI_API_KEY`                            |

Деякі providers приймають додаткові або альтернативні env vars для API key. Докладніше див. на окремих [сторінках provider](#related).

Запустіть `video_generate action=list`, щоб під час runtime переглянути доступних providers, моделі та
режими runtime.

### Матриця заявлених можливостей

Це явний контракт режимів, який використовується `video_generate`, contract tests
і спільним live sweep.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Спільні live lanes сьогодні                                                                                                             |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Так        | Так            | Так            | `generate`, `imageToVideo`; `videoToVideo` пропущено, бо цьому provider потрібні віддалені `http(s)` URL відео                         |
| BytePlus | Так        | Так            | Ні             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Так        | Так            | Ні             | Не входить до спільного sweep; покриття, специфічне для workflow, живе разом із тестами Comfy                                          |
| fal      | Так        | Так            | Ні             | `generate`, `imageToVideo`                                                                                                               |
| Google   | Так        | Так            | Так            | `generate`, `imageToVideo`; спільний `videoToVideo` пропущено, бо поточний buffer-backed sweep Gemini/Veo не приймає такий ввід       |
| MiniMax  | Так        | Так            | Ні             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Так        | Так            | Так            | `generate`, `imageToVideo`; спільний `videoToVideo` пропущено, бо цей org/input path наразі потребує доступу provider-side inpaint/remix |
| Qwen     | Так        | Так            | Так            | `generate`, `imageToVideo`; `videoToVideo` пропущено, бо цьому provider потрібні віддалені `http(s)` URL відео                         |
| Runway   | Так        | Так            | Так            | `generate`, `imageToVideo`; `videoToVideo` запускається лише тоді, коли вибрана модель — `runway/gen4_aleph`                           |
| Together | Так        | Так            | Ні             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Так        | Так            | Ні             | `generate`; спільний `imageToVideo` пропущено, бо вбудований `veo3` підтримує лише текст, а вбудований `kling` вимагає віддалений URL зображення |
| xAI      | Так        | Так            | Так            | `generate`, `imageToVideo`; `videoToVideo` пропущено, бо цьому provider наразі потрібен віддалений URL MP4                             |

## Параметри інструмента

### Обов’язкові

| Параметр | Тип    | Опис                                                                              |
| -------- | ------ | --------------------------------------------------------------------------------- |
| `prompt` | string | Текстовий опис відео для генерації (обов’язковий для `action: "generate"`)       |

### Входи контенту

| Параметр    | Тип      | Опис                                                                                                                                    |
| ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `image`     | string   | Одне еталонне зображення (шлях або URL)                                                                                                 |
| `images`    | string[] | Кілька еталонних зображень (до 9)                                                                                                       |
| `imageRoles`| string[] | Необов’язкові підказки role для кожної позиції, паралельні до об’єднаного списку зображень. Канонічні значення: `first_frame`, `last_frame`, `reference_image` |
| `video`     | string   | Одне еталонне відео (шлях або URL)                                                                                                      |
| `videos`    | string[] | Кілька еталонних відео (до 4)                                                                                                           |
| `videoRoles`| string[] | Необов’язкові підказки role для кожної позиції, паралельні до об’єднаного списку відео. Канонічне значення: `reference_video`         |
| `audioRef`  | string   | Одне еталонне аудіо (шлях або URL). Використовується, наприклад, для фонової музики або еталона голосу, коли provider підтримує аудіовходи |
| `audioRefs` | string[] | Кілька еталонних аудіо (до 3)                                                                                                           |
| `audioRoles`| string[] | Необов’язкові підказки role для кожної позиції, паралельні до об’єднаного списку аудіо. Канонічне значення: `reference_audio`         |

Підказки role передаються provider як є. Канонічні значення походять із
union `VideoGenerationAssetRole`, але providers можуть приймати додаткові
рядки role. Масиви `*Roles` не повинні містити більше записів, ніж
відповідний список еталонів; помилки зі зсувом на один елемент завершуються зрозумілою помилкою.
Використовуйте порожній рядок, щоб залишити слот незаданим.

### Керування стилем

| Параметр          | Тип     | Опис                                                                                     |
| ----------------- | ------- | ---------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` або `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P` або `1080P`                                                       |
| `durationSeconds` | number  | Цільова тривалість у секундах (округлюється до найближчого значення, яке підтримує provider) |
| `size`            | string  | Підказка розміру, коли provider це підтримує                                             |
| `audio`           | boolean | Увімкнути згенероване аудіо у виході, якщо підтримується. Відрізняється від `audioRef*` (входи) |
| `watermark`       | boolean | Перемикання watermark provider, якщо підтримується                                       |

`adaptive` — це sentinel, специфічний для provider: він передається як є
providers, які декларують `adaptive` у своїх можливостях (наприклад, BytePlus
Seedance використовує його для автоматичного визначення співвідношення сторін за
розмірами вхідного зображення). Providers, які цього не декларують, показують це значення через
`details.ignoredOverrides` у результаті інструмента, щоб відкидання було помітним.

### Розширені

| Параметр          | Тип    | Опис                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (типово), `"status"` або `"list"`                                                                                                                                                                                                                                                                                                       |
| `model`           | string | Перевизначення provider/model (наприклад, `runway/gen4.5`)                                                                                                                                                                                                                                                                                           |
| `filename`        | string | Підказка імені вихідного файлу                                                                                                                                                                                                                                                                                                                        |
| `timeoutMs`       | number | Необов’язковий тайм-аут запиту до provider в мілісекундах                                                                                                                                                                                                                                                                                            |
| `providerOptions` | object | Опції, специфічні для provider, як JSON-об’єкт (наприклад, `{"seed": 42, "draft": true}`). Providers, які декларують типізовану схему, перевіряють ключі та типи; невідомі ключі або невідповідності пропускають кандидата під час failover. Providers без оголошеної схеми отримують опції як є. Запустіть `video_generate action=list`, щоб побачити, що приймає кожен provider |

Не всі providers підтримують усі параметри. OpenClaw вже нормалізує тривалість до найближчого значення, яке підтримує provider, а також перетворює перекладені підказки геометрії, наприклад size-to-aspect-ratio, коли резервний provider має іншу поверхню керування. Справді непідтримувані перевизначення ігноруються в межах best-effort і повідомляються як попередження в результаті інструмента. Жорсткі обмеження можливостей (наприклад, занадто багато еталонних входів) завершуються помилкою ще до надсилання.

Результати інструмента повідомляють про застосовані налаштування. Коли OpenClaw перетворює тривалість або геометрію під час failover provider, повернуті значення `durationSeconds`, `size`, `aspectRatio` і `resolution` відображають те, що було фактично надіслано, а `details.normalization` фіксує перетворення із запитаного в застосоване.

Еталонні входи також визначають режим runtime:

- Без еталонних медіа: `generate`
- Будь-яке еталонне зображення: `imageToVideo`
- Будь-яке еталонне відео: `videoToVideo`
- Еталонні аудіовходи не змінюють визначений режим; вони застосовуються поверх режиму, який визначають посилання на зображення/відео, і працюють лише з providers, які декларують `maxInputAudios`

Змішані посилання на зображення й відео не є стабільною спільною поверхнею можливостей.
Краще використовувати один тип еталонів на запит.

#### Failover і типізовані опції

Деякі перевірки можливостей застосовуються на рівні failover, а не на межі
інструмента, щоб запит, який перевищує ліміти основного provider,
усе ще міг виконатися на придатному резервному варіанті:

- Якщо активний кандидат не декларує `maxInputAudios` (або декларує його як
  `0`), він пропускається, коли запит містить аудіопосилання, і
  перевіряється наступний кандидат.
- Якщо `maxDurationSeconds` активного кандидата менше за запитане
  `durationSeconds`, а кандидат не декларує список
  `supportedDurationSeconds`, він пропускається.
- Якщо запит містить `providerOptions`, а активний кандидат
  явно декларує типізовану схему `providerOptions`, кандидат
  пропускається, якщо передані ключі відсутні в схемі або типи значень
  не збігаються. Providers, які ще не декларували схему, отримують
  опції як є (зворотно сумісна передача). Provider може
  явно відмовитися від усіх provider options, задекларувавши порожню схему
  (`capabilities.providerOptions: {}`), що спричиняє той самий пропуск, як і
  невідповідність типу.

Перша причина пропуску в запиті логуються на рівні `warn`, щоб оператори бачили,
коли їхній основний provider було пропущено; наступні пропуски логуються на
рівні `debug`, щоб довгі ланцюжки failover не створювали зайвого шуму. Якщо кожного кандидата пропущено,
агрегована помилка містить причину пропуску для кожного з них.

## Дії

- **generate** (типово) -- створити відео із заданого prompt і необов’язкових еталонних входів.
- **status** -- перевірити стан поточного відеозавдання для цієї сесії без запуску нової генерації.
- **list** -- показати доступних providers, моделі та їхні можливості.

## Вибір моделі

Під час генерації відео OpenClaw визначає модель у такому порядку:

1. **Параметр інструмента `model`** -- якщо агент указує його у виклику.
2. **`videoGenerationModel.primary`** -- із конфігурації.
3. **`videoGenerationModel.fallbacks`** -- перевіряються по черзі.
4. **Автовизначення** -- використовує providers з валідною автентифікацією, починаючи з поточного типового provider, потім решту providers в алфавітному порядку.

Якщо provider завершується помилкою, автоматично перевіряється наступний кандидат. Якщо всі кандидати завершуються помилкою, помилка містить подробиці кожної спроби.

Установіть `agents.defaults.mediaGenerationAutoProviderFallback: false`, якщо ви хочете,
щоб генерація відео використовувала лише явно задані записи `model`, `primary` і `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Примітки щодо provider

<AccordionGroup>
  <Accordion title="Alibaba">
    Використовує асинхронний endpoint DashScope / Model Studio. Еталонні зображення й відео мають бути віддаленими URL `http(s)`.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    ID provider: `byteplus`.

    Моделі: `seedance-1-0-pro-250528` (типова), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Моделі T2V (`*-t2v-*`) не приймають входи зображень; моделі I2V і загальні моделі `*-pro-*` підтримують одне еталонне зображення (перший кадр). Передавайте зображення позиційно або задайте `role: "first_frame"`. ID моделей T2V автоматично перемикаються на відповідний варіант I2V, коли надається зображення.

    Підтримувані ключі `providerOptions`: `seed` (number), `draft` (boolean — примусово 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Потребує Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID provider: `byteplus-seedance15`. Модель: `seedance-1-5-pro-251215`.

    Використовує уніфікований API `content[]`. Підтримує максимум 2 вхідні зображення (`first_frame` + `last_frame`). Усі входи мають бути віддаленими URL `https://`. Задайте `role: "first_frame"` / `"last_frame"` для кожного зображення або передавайте зображення позиційно.

    `aspectRatio: "adaptive"` автоматично визначає співвідношення сторін із вхідного зображення. `audio: true` перетворюється на `generate_audio`. `providerOptions.seed` (number) передається далі.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Потребує Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID provider: `byteplus-seedance2`. Моделі: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Використовує уніфікований API `content[]`. Підтримує до 9 еталонних зображень, 3 еталонних відео та 3 еталонних аудіо. Усі входи мають бути віддаленими URL `https://`. Задайте `role` для кожного ресурсу — підтримувані значення: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` автоматично визначає співвідношення сторін із вхідного зображення. `audio: true` перетворюється на `generate_audio`. `providerOptions.seed` (number) передається далі.

  </Accordion>

  <Accordion title="ComfyUI">
    Локальне або хмарне виконання, кероване workflow. Підтримує text-to-video й image-to-video через налаштований graph.
  </Accordion>

  <Accordion title="fal">
    Використовує queue-backed flow для довготривалих завдань. Лише одне еталонне зображення.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Підтримує одне еталонне зображення або одне еталонне відео.
  </Accordion>

  <Accordion title="MiniMax">
    Лише одне еталонне зображення.
  </Accordion>

  <Accordion title="OpenAI">
    Передається лише перевизначення `size`. Інші перевизначення стилю (`aspectRatio`, `resolution`, `audio`, `watermark`) ігноруються з попередженням.
  </Accordion>

  <Accordion title="Qwen">
    Той самий backend DashScope, що й Alibaba. Еталонні входи мають бути віддаленими URL `http(s)`; локальні файли одразу відхиляються.
  </Accordion>

  <Accordion title="Runway">
    Підтримує локальні файли через data URI. Для video-to-video потрібен `runway/gen4_aleph`. Запуски лише з текстом підтримують співвідношення сторін `16:9` і `9:16`.
  </Accordion>

  <Accordion title="Together">
    Лише одне еталонне зображення.
  </Accordion>

  <Accordion title="Vydra">
    Використовує `https://www.vydra.ai/api/v1` напряму, щоб уникнути перенаправлень, які скидають автентифікацію. `veo3` у вбудованому варіанті підтримує лише text-to-video; `kling` вимагає віддалений URL зображення.
  </Accordion>

  <Accordion title="xAI">
    Підтримує text-to-video, image-to-video та віддалені потоки редагування/розширення відео.
  </Accordion>
</AccordionGroup>

## Режими можливостей provider

Спільний контракт генерації відео тепер дозволяє providers декларувати можливості,
специфічні для режиму, замість лише пласких агрегованих лімітів. Нові реалізації
provider мають віддавати перевагу явним блокам режимів:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Пласких агрегованих полів на кшталт `maxInputImages` і `maxInputVideos`
недостатньо, щоб заявити підтримку режимів трансформації. Providers мають явно декларувати
`generate`, `imageToVideo` і `videoToVideo`, щоб live tests,
contract tests і спільний інструмент `video_generate` могли детерміновано перевіряти підтримку режимів.

## Live-тести

Live-покриття з явним увімкненням для спільних вбудованих provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Обгортка репозиторію:

```bash
pnpm test:live:media video
```

Цей live-файл завантажує відсутні env vars provider з `~/.profile`, типово віддає перевагу
API keys з live/env над збереженими auth profile і типово виконує release-safe smoke:

- `generate` для кожного provider у sweep, крім FAL
- односекундний prompt про омара
- ліміт операцій для кожного provider з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` типово)

FAL вмикається окремо, оскільки затримка черги на боці provider може домінувати в часі релізу:

```bash
pnpm test:live:media video --video-providers fal
```

Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати заявлені режими трансформації,
які спільний sweep може безпечно перевіряти з локальними медіа:

- `imageToVideo`, коли `capabilities.imageToVideo.enabled`
- `videoToVideo`, коли `capabilities.videoToVideo.enabled` і provider/model
  приймає buffer-backed локальний відеоввід у спільному sweep

Сьогодні спільний live-lane `videoToVideo` охоплює:

- `runway` лише тоді, коли ви вибираєте `runway/gen4_aleph`

## Конфігурація

Задайте типову модель генерації відео у своїй конфігурації OpenClaw:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Або через CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Пов’язане

- [Огляд Tools](/uk/tools)
- [Фонові завдання](/uk/automation/tasks) -- відстеження завдань для асинхронної генерації відео
- [Alibaba Model Studio](/uk/providers/alibaba)
- [BytePlus](/uk/concepts/model-providers#byteplus-international)
- [ComfyUI](/uk/providers/comfy)
- [fal](/uk/providers/fal)
- [Google (Gemini)](/uk/providers/google)
- [MiniMax](/uk/providers/minimax)
- [OpenAI](/uk/providers/openai)
- [Qwen](/uk/providers/qwen)
- [Runway](/uk/providers/runway)
- [Together AI](/uk/providers/together)
- [Vydra](/uk/providers/vydra)
- [xAI](/uk/providers/xai)
- [Довідник конфігурації](/uk/gateway/config-agents#agent-defaults)
- [Моделі](/uk/concepts/models)
