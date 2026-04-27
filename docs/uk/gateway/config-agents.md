---
read_when:
    - Налаштування типових параметрів агента (моделі, мислення, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації кількох агентів і прив’язок
    - Налаштування сесії, доставки повідомлень і поведінки режиму talk
summary: Типові параметри агента, маршрутизація кількох агентів, сесія, повідомлення та конфігурація talk
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-04-27T02:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9de23b65a3344556c16edff64400a551929d5ae80ee5196003dea69320df6c26
    source_path: gateway/config-agents.md
    workflow: 15
---

Ключі конфігурації з областю дії агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, середовища виконання Gateway та інших
ключів верхнього рівня див. [Довідник із конфігурації](/uk/gateway/configuration-reference).

## Типові параметри агента

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, який показується в рядку Runtime системного запиту. Якщо не задано, OpenClaw автоматично визначає його, піднімаючись угору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий типовий список дозволених Skills для агентів, у яких не задано
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює типові значення
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

- Опустіть `agents.defaults.skills`, щоб типово дозволити необмежені Skills.
- Опустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Установіть `agents.list[].skills: []`, щоб не дозволити жодних Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента;
  він не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли робочого простору вставляються в системний запит. Типове значення: `"always"`.

- `"continuation-skip"`: у безпечних ходах продовження (після завершеної відповіді асистента) повторне вставлення bootstrap-файлів робочого простору пропускається, що зменшує розмір запиту. Запуски Heartbeat і повторні спроби після Compaction однаково перебудовують контекст.
- `"never"`: вимикає вставлення bootstrap-файлів робочого простору та файлів контексту на кожному ході. Використовуйте це лише для агентів, які повністю керують власним життєвим циклом запиту (власні рушії контексту, нативні середовища виконання, які будують власний контекст, або спеціалізовані робочі процеси без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають вставлення.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів для кожного bootstrap-файлу робочого простору перед обрізанням. Типове значення: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що вставляються з усіх bootstrap-файлів робочого простору. Типове значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізається.
Типове значення: `"once"`.

- `"off"`: ніколи не вставляти текст попередження в системний запит.
- `"once"`: вставляти попередження один раз для кожного унікального сигнатурного випадку обрізання (рекомендовано).
- `"always"`: вставляти попередження під час кожного запуску, якщо є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта власності бюджетів контексту

OpenClaw має кілька великих бюджетів запиту/контексту, і вони
навмисно розділені за підсистемами, а не проходять через один загальний
параметр.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вставлення bootstrap робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова вступна частина для запусків `/new` і `/reset`, включно з недавніми щоденними
  файлами `memory/*.md`.
- `skills.limits.*`:
  компактний список Skills, що вставляється в системний запит.
- `agents.defaults.contextLimits.*`:
  обмежені уривки під час виконання та вставлені блоки, якими володіє середовище виконання.
- `memory.qmd.limits.*`:
  розміри фрагментів і вставлення для індексованого пошуку в пам’яті.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою вступною частиною першого ходу, що вставляється в простих запусках `/new` і `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Спільні типові значення для обмежених поверхонь контексту середовища виконання.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: типове обмеження уривка `memory_get` перед додаванням
  метаданих обрізання та сповіщення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків для `memory_get`, коли `lines`
  не вказано.
- `toolResultMaxChars`: обмеження результату інструмента під час виконання, яке використовується для збережених результатів і
  відновлення при переповненні.
- `postCompactionMaxChars`: обмеження уривка AGENTS.md, що використовується під час вставлення оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення окремого агента для спільних параметрів `contextLimits`. Пропущені поля успадковуються
з `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Глобальне обмеження для компактного списку Skills, що вставляється в системний запит. Це
не впливає на читання файлів `SKILL.md` на вимогу.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Перевизначення для окремого агента для бюджету запиту Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Максимальний розмір у пікселях для довшої сторони зображення в блоках зображень транскрипту/інструментів перед викликами провайдера.
Типове значення: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір корисного навантаження запиту для сценаріїв із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного запиту (не для часових міток повідомлень). Якщо не задано, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному запиті. Типове значення: `auto` (налаштування ОС).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // глобальні типові параметри провайдера
      agentRuntime: {
        id: "pi", // pi | auto | id зареєстрованого harness, наприклад codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Форма рядка задає лише основну модель.
  - Форма об’єкта задає основну модель і впорядкований список моделей для перемикання при збої.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як конфігурація vision-моделі.
  - Також використовується для резервної маршрутизації, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для прозорого фону у виході OpenAI PNG/WebP.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо параметр пропущено, `image_generate` усе одно може визначити типове значення провайдера з наявною автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку ідентифікаторів провайдерів.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо параметр пропущено, `music_generate` усе одно може визначити типове значення провайдера з наявною автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації музики в порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо параметр пропущено, `video_generate` усе одно може визначити типове значення провайдера з наявною автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації відео в порядку ідентифікаторів провайдерів.
  - Якщо ви вибираєте провайдера/модель напряму, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість до 10 секунд і параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` та `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо параметр пропущено, інструмент PDF спочатку використовує `imageModel`, а потім визначену модель сесії/типову модель.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, що враховується в режимі резервного вилучення в інструменті `pdf`.
- `verboseDefault`: типовий рівень докладності для агентів. Значення: `"off"`, `"on"`, `"full"`. Типове значення: `"off"`.
- `elevatedDefault`: типовий рівень розширеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типове значення: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ або `openai-codex/gpt-5.5` для Codex OAuth). Якщо ви пропускаєте провайдера, OpenClaw спочатку пробує псевдонім, потім унікальний збіг точного ідентифікатора моделі серед налаштованих провайдерів, і лише після цього повертається до типового налаштованого провайдера (застаріла поведінка для сумісності, тому краще явно вказувати `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw перемикається на першу налаштовану пару провайдер/модель, а не показує застаріле типове значення від видаленого провайдера.
- `models`: налаштований каталог моделей і список дозволених значень для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера параметри, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Безпечне редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відмовляється від замін, які видалили б наявні записи зі списку дозволених значень, якщо не передати `--replace`.
  - Потоки налаштування/онбордингу з областю дії провайдера об’єднують вибрані моделі провайдера в цю мапу та зберігають уже налаштованих нерелевантних провайдерів.
  - Для прямих моделей OpenAI Responses автоматично вмикається серверний Compaction. Використовуйте `params.responsesServerCompaction: false`, щоб припинити вставлення `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [Серверний Compaction OpenAI](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), а потім `agents.list[].params` (відповідний `id` агента) перевизначає окремі ключі. Докладніше див. у [Кешування запитів](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений JSON для наскрізної передачі, який зливається з тілами запитів `api: "openai-completions"` для сумісних із OpenAI проксі. Якщо він конфліктує зі згенерованими ключами запиту, перевагу має додаткове тіло; маршрути completions, що не є нативними, після цього все одно відкидають специфічний для OpenAI параметр `store`.
- `params.chat_template_kwargs`: аргументи шаблону чату для vLLM/OpenAI-сумісних систем, які зливаються на верхньому рівні з тілами запитів `api: "openai-completions"`. Для `vllm/nemotron-3-*` з вимкненим мисленням OpenClaw автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають ці типові значення, а `extra_body.chat_template_kwargs` усе одно має остаточний пріоритет.
- `params.preserveThinking`: специфічне для Z.AI необов’язкове ввімкнення збереженого мислення. Коли ввімкнено і мислення активне, OpenClaw надсилає `thinking.clear_thinking: false` і відтворює попередній `reasoning_content`; див. [Мислення та збережене мислення Z.AI](/uk/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: типова політика низькорівневого середовища виконання агента. Якщо `id` пропущено, типово використовується OpenClaw Pi. Використовуйте `id: "pi"`, щоб примусово вибрати вбудований harness PI, `id: "auto"`, щоб дозволити зареєстрованим harness із Plugin перехоплювати підтримувані моделі, зареєстрований `id` harness, як-от `id: "codex"`, або псевдонім підтримуваного CLI-бекенда, як-от `id: "claude-cli"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід на PI. Явні середовища виконання Plugin, як-от `codex`, типово завершуються без резерву, якщо ви не задасте `fallback: "pi"` у тій самій області перевизначення. Зберігайте посилання на моделі в канонічному форматі `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші бекенди виконання через конфігурацію середовища виконання, а не через застарілі префікси провайдера в середовищі виконання. Див. [Середовища виконання агента](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору провайдера/моделі.
- Засоби запису конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` та команди додавання/видалення резервних значень), зберігають канонічну форму об’єкта та, коли можливо, зберігають наявні списки резервних значень.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна окрема сесія все одно серіалізується). Типове значення: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` керує тим, який низькорівневий виконавець обробляє ходи агента. У більшості
розгортань слід залишати типове середовище виконання OpenClaw Pi. Використовуйте його, коли довірений
Plugin надає нативний harness, наприклад вбудований harness сервера застосунку Codex,
або коли вам потрібен підтримуваний CLI-бекенд, як-от Claude CLI. Для розуміння моделі див. [Середовища виконання агента](/uk/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, ідентифікатор зареєстрованого harness Plugin або псевдонім підтримуваного CLI-бекенда. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає CLI-бекенд `claude-cli`.
- `fallback`: `"pi"` або `"none"`. У режимі `id: "auto"` пропущене значення `fallback` типово дорівнює `"pi"`, щоб старі конфігурації могли й далі використовувати PI, якщо жоден harness Plugin не перехоплює запуск. У явному режимі середовища виконання Plugin, наприклад `id: "codex"`, пропущене значення `fallback` типово дорівнює `"none"`, щоб відсутній harness призводив до помилки, а не до тихого використання PI. Перевизначення середовища виконання не успадковують `fallback` із ширшої області; задайте `fallback: "pi"` разом з явним середовищем виконання, якщо вам свідомо потрібна така сумісність. Помилки вибраних harness Plugin завжди показуються напряму.
- Перевизначення через змінні середовища: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` перевизначає `fallback` для цього процесу.
- Для розгортань лише з Codex установіть `model: "openai/gpt-5.5"` і `agentRuntime.id: "codex"`. Ви також можете явно встановити `agentRuntime.fallback: "none"` для наочності; це типове значення для явних середовищ виконання Plugin.
- Для розгортань із Claude CLI віддавайте перевагу `model: "anthropic/claude-opus-4-7"` разом із `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі на кшталт `claude-cli/claude-opus-4-7` усе ще працюють для сумісності, але в новій конфігурації слід залишати вибір провайдера/моделі канонічним, а бекенд виконання вказувати в `agentRuntime.id`.
- Старіші ключі політики середовища виконання переписуються в `agentRuntime` командою `openclaw doctor --fix`.
- Вибір harness фіксується для кожного ідентифікатора сесії після першого вбудованого запуску. Зміни конфігурації/змінних середовища впливають на нові або скинуті сесії, а не на наявний транскрипт. Застарілі сесії з історією транскрипту, але без зафіксованого вибору, вважаються прив’язаними до PI. `/status` показує фактичне середовище виконання, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, vision, PDF, музика, відео та TTS як і раніше використовують власні налаштування провайдера/моделі.

**Вбудовані скорочення-псевдоніми** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Псевдонім           | Модель                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Ваші налаштовані псевдоніми завжди мають перевагу над типовими.

Для моделей Z.AI GLM-4.x режим мислення вмикається автоматично, якщо ви не встановите `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Для моделей Z.AI за замовчуванням увімкнено `tool_stream` для потокової передачі викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 типово використовується мислення `adaptive`, якщо явний рівень мислення не встановлено.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери недоступні.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Або використовуйте systemPromptFileArg, якщо CLI приймає прапорець для файлу запиту.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-бекенди орієнтовані насамперед на текст; інструменти завжди вимкнені.
- Сесії підтримуються, коли задано `sessionArg`.
- Наскрізна передача зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний запит, зібраний OpenClaw, фіксованим рядком. Задається на рівні типових значень (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із запитами.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Незалежні від провайдера накладки запитів, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки між провайдерами; `personality` керує лише шаром дружнього стилю взаємодії.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (типово) і `"on"` вмикають шар дружнього стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений контракт поведінки GPT-5 залишається ввімкненим.
- Застаріле `plugins.entries.openai.config.personality` усе ще зчитується, коли цей спільний параметр не задано.

### `agents.defaults.heartbeat`

Періодичні запуски Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m вимикає
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // типово: true; false прибирає розділ Heartbeat із системного запиту
        lightContext: false, // типово: false; true залишає лише HEARTBEAT.md із bootstrap-файлів робочого простору
        isolatedSession: false, // типово: false; true запускає кожен Heartbeat у свіжій сесії (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (типово) | block
        target: "none", // типово: none | варіанти: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). Типове значення: `30m` (автентифікація через API-ключ) або `1h` (автентифікація через OAuth). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, прибирає розділ Heartbeat із системного запиту та пропускає вставлення `HEARTBEAT.md` у bootstrap-контекст. Типове значення: `true`.
- `suppressToolErrorWarnings`: коли `true`, пригнічує корисні навантаження попереджень про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента Heartbeat до його переривання. Якщо не задано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика доставки напряму/в особисті повідомлення. `allow` (типово) дозволяє доставку напряму до цілі. `block` пригнічує пряму доставку до цілі та генерує `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
- `isolatedSession`: коли `true`, кожен Heartbeat запускається в окремій свіжій сесії без попередньої історії розмови. Та сама схема ізоляції, що й у Cron `sessionTarget: "isolated"`. Зменшує витрати токенів на кожен Heartbeat приблизно зі ~100K до ~2–5K токенів.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, **Heartbeat запускаються лише для цих агентів**.
- Heartbeat запускають повноцінні ходи агента — коротші інтервали спалюють більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id зареєстрованого Plugin провайдера Compaction (необов’язково)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // використовується, коли identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторне вставлення
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для Compaction
        truncateAfterCompaction: true, // після Compaction перейти до меншого наступного JSONL
        maxActiveTranscriptBytes: "20mb", // необов’язковий поріг локального запуску Compaction перед виконанням
        notifyUser: true, // надсилати короткі сповіщення користувачу, коли Compaction починається й завершується (типово: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` або `safeguard` (підсумовування чанками для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin провайдера Compaction. Якщо задано, замість вбудованого підсумовування LLM викликається `summarize()` провайдера. У разі помилки використовується вбудований варіант. Установлення провайдера примусово вмикає `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, після чого OpenClaw її перериває. Типове значення: `900`.
- `keepRecentTokens`: бюджет точки відсікання Pi для збереження найсвіжішого хвоста транскрипту дослівно. Ручна команда `/compact` враховує це, якщо значення явно задано; інакше ручний Compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. Значення `strict` додає вбудовані настанови зі збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст зі збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою при неправильному форматі виводу для підсумків safeguard. У режимі safeguard увімкнено типово; задайте `enabled: false`, щоб пропустити аудит.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторного вставлення після Compaction. Типово: `["Session Startup", "Red Lines"]`; задайте `[]`, щоб вимкнути повторне вставлення. Якщо параметр не задано або явно задано цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основна сесія має залишатися на одній моделі, а підсумки Compaction — виконуватися на іншій; якщо параметр не задано, Compaction використовує основну модель сесії.
- `maxActiveTranscriptBytes`: необов’язковий байтовий поріг (`number` або рядки на кшталт `"20mb"`), який запускає звичайний локальний Compaction перед виконанням, коли активний JSONL виростає понад цей поріг. Потребує `truncateAfterCompaction`, щоб успішний Compaction міг перейти до меншого наступного транскрипту. Вимкнено, якщо параметр не задано або дорівнює `0`.
- `notifyUser`: коли `true`, надсилає користувачу короткі сповіщення, коли Compaction починається й коли завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction працював безшумно.
- `memoryFlush`: тихий агентний хід перед автоматичним Compaction для збереження довготривалих спогадів. Пропускається, якщо робочий простір доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // тривалість (ms/s/m/h), типова одиниця: хвилини
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Поведінка режиму cache-ttl">

- `mode: "cache-ttl"` вмикає проходи обрізання.
- `ttl` керує тим, як часто обрізання може виконуватися повторно (після останнього дотику кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім, якщо потрібно, повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок і кінець та вставляє посередині `...`.

**Повне очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення базуються на кількості символів (наближено), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Докладніше про поведінку див. у [Обрізання сесії](/uk/concepts/session-pruning).

### Потокова передача блоками

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (використовуйте minMs/maxMs)
    },
  },
}
```

- Для каналів, відмінних від Telegram, потрібно явно вказати `*.blockStreaming: true`, щоб увімкнути відповіді блоками.
- Перевизначення для каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Для Signal/Slack/Discord/Google Chat типово використовується `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоками відповіді. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Докладніше про поведінку та чанкування див. у [Потокова передача](/uk/concepts/streaming).

### Індикатори набору тексту

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Типові значення: `instant` для прямих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Індикатори набору тексту](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова ізоляція для вбудованого агента. Повний посібник див. у [Ізоляція](/uk/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Також підтримуються SecretRef / вбудований вміст:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Подробиці sandbox">

**Бекенд:**

- `docker`: локальне середовище виконання Docker (типово)
- `ssh`: універсальне віддалене середовище виконання на базі SSH
- `openshell`: середовище виконання OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для середовища виконання, переносяться до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, який використовується для робочих просторів за областю дії
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, які OpenClaw матеріалізує у тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет SSH-автентифікації:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef визначаються з активного знімка середовища виконання секретів до початку сесії sandbox

**Поведінка SSH-бекенда:**

- один раз ініціалізує віддалений робочий простір після створення або перевідтворення
- далі підтримує віддалений робочий простір SSH як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує браузерні контейнери sandbox

**Доступ до робочого простору:**

- `none`: робочий простір sandbox за областю дії під `~/.openclaw/sandboxes`
- `ro`: робочий простір sandbox у `/workspace`, робочий простір агента монтується лише для читання в `/agent`
- `rw`: робочий простір агента монтується для читання й запису в `/workspace`

**Область дії:**

- `session`: окремий контейнер + робочий простір для кожної сесії
- `agent`: один контейнер + робочий простір для кожного агента (типово)
- `shared`: спільний контейнер і робочий простір (без ізоляції між сесіями)

**Конфігурація Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // необов’язково
          gatewayEndpoint: "https://lab.example", // необов’язково
          policy: "strict", // необов’язковий id політики OpenShell
          providers: ["openai"], // необов’язково
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: перед `exec` ініціалізує віддалений простір із локального, після `exec` синхронізує назад; локальний робочий простір лишається канонічним
- `remote`: один раз ініціалізує віддалений простір під час створення sandbox, далі канонічним лишається віддалений робочий простір

У режимі `remote` локальні редагування на хості, зроблені поза OpenClaw, не синхронізуються в sandbox автоматично після кроку ініціалізації.
Транспортом є SSH до sandbox OpenShell, але Plugin керує життєвим циклом sandbox і необов’язковою синхронізацією mirror.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потрібні вихід у мережу, доступний для запису корінь і користувач root.

**Для контейнерів типово використовується `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний варіант).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки й прив’язки для окремого агента об’єднуються.

**Браузер у sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний запит. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача через noVNC типово використовує автентифікацію VNC, і OpenClaw видає короткоживучий URL із токеном (замість показу пароля у спільному URL).

- `allowHostControl: false` (типово) блокує спрямування сесій sandbox на браузер хоста.
- `network` типово дорівнює `openclaw-sandbox-browser` (виділена bridge-мережа). Установлюйте `bridge` лише тоді, коли вам явно потрібна глобальна зв’язність bridge.
- `cdpSourceRange` за потреби обмежує вхід до CDP на рівні контейнера діапазоном CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера sandbox. Якщо задано (включно з `[]`), цей параметр замінює `docker.binds` для браузерного контейнера.
- Типові параметри запуску визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для хостів із контейнерами:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (типово ввімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    типово ввімкнені, їх можна вимкнути за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо вони
    потрібні у вашому робочому процесі.
  - `--renderer-process-limit=2` можна змінити за допомогою
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - плюс `--no-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовими для образу контейнера; щоб змінити типові параметри контейнера,
    використовуйте власний образ браузера з власним entrypoint.

</Accordion>

Ізоляція браузера та `sandbox.docker.binds` підтримуються лише для Docker.

Зберіть образи:

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов’язковий образ браузера
```

### `agents.list` (перевизначення для окремого агента)

Використовуйте `agents.list[].tts`, щоб призначити агенту власного провайдера TTS, голос, модель,
стиль або режим автоматичного TTS. Блок агента глибоко зливається з глобальним
`messages.tts`, тому спільні облікові дані можна тримати в одному місці, а окремі
агенти перевизначатимуть лише потрібні їм поля голосу або провайдера. Перевизначення
активного агента застосовується до автоматичних озвучених відповідей, `/tts audio`, `/tts status`
та інструмента агента `tts`. Приклади провайдерів і пріоритети див. у [Перетворення тексту на мовлення](/uk/tools/tts#per-agent-voice-overrides).

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // або { primary, fallbacks }
        thinkingDefault: "high", // перевизначення рівня мислення для окремого агента
        reasoningDefault: "on", // перевизначення видимості reasoning для окремого агента
        fastModeDefault: false, // перевизначення швидкого режиму для окремого агента
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // перевизначає відповідні defaults.models params за ключами
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // замінює agents.defaults.skills, якщо задано
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: стабільний id агента (обов’язково).
- `default`: якщо задано кілька значень, перше має пріоритет (записується попередження). Якщо не задано жодного, типовим стає перший елемент списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні резервні значення). Завдання Cron, які перевизначають лише `primary`, усе одно успадковують типові резервні значення, якщо ви не задасте `fallbacks: []`.
- `params`: параметри потоку для окремого агента, що зливаються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних перевизначень агента, таких як `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `tts`: необов’язкові перевизначення перетворення тексту на мовлення для окремого агента. Цей блок глибоко зливається з `messages.tts`, тому спільні облікові дані провайдера й політику резервного переходу слід тримати в `messages.tts`, а тут задавати лише значення, специфічні для персони, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо параметр пропущено, агент успадковує `agents.defaults.skills`, коли його задано; явний список замінює типові значення, а не зливається з ними, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень мислення для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, якщо не задано перевизначення для окремого повідомлення або сесії. Вибраний профіль провайдера/моделі визначає, які значення є допустимими; для Google Gemini значення `adaptive` зберігає динамічне мислення під керуванням провайдера (`thinkingLevel` пропускається для Gemini 3/3.1, `thinkingBudget: -1` для Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість reasoning для окремого агента (`on | off | stream`). Застосовується, якщо не задано перевизначення reasoning для окремого повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення швидкого режиму для окремого агента (`true | false`). Застосовується, якщо не задано перевизначення швидкого режиму для окремого повідомлення або сесії.
- `agentRuntime`: необов’язкове перевизначення політики низькорівневого середовища виконання для окремого агента. Використовуйте `{ id: "codex" }`, щоб зробити один агент доступним лише через Codex, а інші агенти залишили типове резервне PI в режимі `auto`.
- `runtime`: необов’язковий дескриптор середовища виконання для окремого агента. Використовуйте `type: "acp"` із типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має за замовчуванням використовувати сесії harness ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених id агентів для `sessions_spawn` (`["*"]` = будь-який; типово: лише той самий агент).
- Захист успадкування sandbox: якщо сесія запитувача працює в sandbox, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: коли `true`, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (примушує явно вибирати профіль; типово: false).

---

## Маршрутизація кількох агентів

Запускайте кількох ізольованих агентів у межах одного Gateway. Див. [Кілька агентів](/uk/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Поля збігу прив’язки

- `type` (необов’язково): `route` для звичайної маршрутизації (за відсутності `type` типово використовується route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; якщо пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; залежить від каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок збігу:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (для всього каналу)
6. Типовий агент

У межах кожного рівня перший відповідний запис `bindings` має пріоритет.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище рівневий порядок прив’язок route.

### Профілі доступу для окремих агентів

<Accordion title="Повний доступ (без sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Інструменти та робочий простір лише для читання">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Без доступу до файлової системи (лише повідомлення)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Докладніше про пріоритети див. у [Sandbox і Tools для кількох агентів](/uk/tools/multi-agent-sandbox-tools).

---

## Сесія

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // пропустити відгалуження від батьківського потоку вище цього ліміту токенів (0 вимикає)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // тривалість або false
      maxDiskBytes: "500mb", // необов’язковий жорсткий бюджет
      highWaterBytes: "400mb", // необов’язкова ціль очищення
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // типове автоматичне зняття фокуса після неактивності в годинах (`0` вимикає)
      maxAgeHours: 0, // типова жорстка максимальна давність у годинах (`0` вимикає)
    },
    mainKey: "main", // застаріле (середовище виконання завжди використовує "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Докладніше про поля сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли спільний контекст справді потрібен).
- **`dmScope`**: спосіб групування особистих повідомлень.
  - `main`: усі особисті повідомлення використовують головну сесію.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для багатокористувацьких вхідних).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: мапа канонічних id до peer із префіксом провайдера для спільного використання сесії між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва, спрацьовує те, що закінчиться раніше. Актуальність для щоденного скидання визначається за `sessionStartedAt` запису сесії; актуальність для скидання за простоєм — за `lastInteractionAt`. Фонові/системні записи, як-от Heartbeat, пробудження Cron, сповіщення exec і службові записи gateway, можуть оновлювати `updatedAt`, але вони не підтримують актуальність щоденних/неактивних сесій.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застаріле `dm` приймається як псевдонім для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` батьківської сесії, допустиме під час створення відгалуженої сесії потоку (типово `100000`).
  - Якщо `totalTokens` батьківської сесії перевищує це значення, OpenClaw запускає нову сесію потоку замість успадкування історії транскрипту батьківської сесії.
  - Установіть `0`, щоб вимкнути цей захист і завжди дозволяти відгалуження від батьківської сесії.
- **`mainKey`**: застаріле поле. Середовище виконання завжди використовує `"main"` для основного кошика особистих чатів.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість відповідей у зворотному напрямку між агентами під час обміну агент-агент (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжки ping-pong.
- **`sendPolicy`**: збіг за `channel`, `chatType` (`direct|group|channel`, із застарілим псевдонімом `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона має пріоритет.
- **`maintenance`**: очищення сховища сесій і параметри зберігання.
  - `mode`: `warn` лише видає попередження; `enforce` застосовує очищення.
  - `pruneAfter`: поріг давності для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`).
  - `rotateBytes`: обертати `sessions.json`, коли він перевищує цей розмір (типово `10mb`).
  - `resetArchiveRetention`: термін зберігання архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет для каталогу сесій. У режимі `warn` записує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для можливостей сесій, прив’язаних до потоків.
  - `enabled`: головний перемикач за замовчуванням (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса після неактивності в годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типова жорстка максимальна давність у годинах (`0` вимикає; провайдери можуть перевизначати)

</Accordion>

---

## Повідомлення

```json5
{
  messages: {
    responsePrefix: "🦞", // або "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 вимикає
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Префікс відповіді

Перевизначення для каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Визначення (найспецифічніше має пріоритет): обліковий запис → канал → глобальне значення. `""` вимикає і зупиняє каскад. `"auto"` формує `[{identity.name}]`.

**Змінні шаблону:**

| Змінна           | Опис                         | Приклад                     |
| ---------------- | ---------------------------- | --------------------------- |
| `{model}`        | Коротка назва моделі         | `claude-opus-4-6`           |
| `{modelFull}`    | Повний ідентифікатор моделі  | `anthropic/claude-opus-4-6` |
| `{provider}`     | Назва провайдера             | `anthropic`                 |
| `{thinkingLevel}`| Поточний рівень мислення     | `high`, `low`, `off`        |
| `{identity.name}`| Назва ідентичності агента    | (те саме, що й `"auto"`)    |

Змінні нечутливі до регістру. `{think}` — псевдонім для `{thinkingLevel}`.

### Реакція-підтвердження

- Типово використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення з identity.
- Область дії: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в каналах, що підтримують реакції, таких як Slack, Discord, Telegram, WhatsApp і BlueBubbles.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо параметр не задано, реакції статусу залишаються ввімкненими, коли активні реакції-підтвердження.
  У Telegram для ввімкнення реакцій статусу життєвого циклу потрібно явно встановити `true`.

### Вхідний debounce

Об’єднує швидкі текстові повідомлення від одного відправника в один хід агента. Медіа/вкладення скидаються негайно. Команди керування обходять debounce.

### TTS (перетворення тексту на мовлення)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` керує типовим автоматичним режимом TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначити локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумовування.
- `modelOverrides` типово ввімкнено; `modelOverrides.allowProvider` типово дорівнює `false` (потрібне явне ввімкнення).
- API-ключі беруть резервні значення з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані провайдери мовлення належать Plugin. Якщо задано `plugins.allow`, включіть кожен Plugin провайдера TTS, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий id провайдера `edge` приймається як псевдонім для `microsoft`.
- `providers.openai.baseUrl` перевизначає кінцеву точку OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на кінцеву точку, відмінну від OpenAI, OpenClaw трактує її як сумісний із OpenAI сервер TTS і послаблює перевірку моделі/голосу.

---

## Talk

Типові параметри для режиму Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі пласкі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) існують лише для сумісності й автоматично мігруються в `talk.providers.<provider>`.
- Для voice ID використовуються резервні значення `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки відкритого тексту або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли не налаштовано API-ключ Talk.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник macOS MLX. Якщо параметр не задано, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення macOS MLX працює через вбудований помічник `openclaw-mlx-tts`, якщо він наявний, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `speechLocale` задає ідентифікатор локалі BCP 47, який використовується розпізнаванням мовлення Talk на iOS/macOS. Не задавайте параметр, щоб використовувати типову локаль пристрою.
- `silenceTimeoutMs` визначає, скільки режим Talk чекає після мовчання користувача, перш ніж надіслати транскрипт. Якщо параметр не задано, використовується типове вікно паузи платформи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Пов’язані матеріали

- [Довідник із конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
