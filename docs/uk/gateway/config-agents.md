---
read_when:
    - Налаштування значень агента за замовчуванням (моделі, thinking, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації та прив’язок для кількох агентів
    - Налаштування поведінки сесій, доставки повідомлень і режиму talk
summary: Значення за замовчуванням для агента, маршрутизація кількох агентів, сесія, повідомлення та конфігурація talk
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-04-24T03:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

Ключі конфігурації на рівні агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, runtime Gateway та інших
ключів верхнього рівня див. [Configuration reference](/uk/gateway/configuration-reference).

## Значення агента за замовчуванням

### `agents.defaults.workspace`

Типово: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, який показується в рядку Runtime системного prompt. Якщо не задано, OpenClaw автоматично визначає його, підіймаючись угору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий allowlist Skills за замовчуванням для агентів, які не задають
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює значення за замовчуванням
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

- Не вказуйте `agents.defaults.skills`, щоб типово дозволити необмежені Skills.
- Не вказуйте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
- Установіть `agents.list[].skills: []`, щоб не було Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується зі значеннями за замовчуванням.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли робочого простору інжектуються в системний prompt. Типово: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторну інжекцію bootstrap робочого простору, зменшуючи розмір prompt. Запуски Heartbeat і повторні спроби після Compaction все одно перебудовують контекст.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на один bootstrap-файл робочого простору до усікання. Типово: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що інжектуються з усіх bootstrap-файлів робочого простору. Типово: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим агенту текстом попередження, коли bootstrap-контекст усічено.
Типово: `"once"`.

- `"off"`: ніколи не інжектувати текст попередження в системний prompt.
- `"once"`: інжектувати попередження один раз для кожного унікального сигнатурного усікання (рекомендовано).
- `"always"`: інжектувати попередження під час кожного запуску, коли є усікання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта власності бюджету контексту

OpenClaw має кілька великих бюджетів prompt/контексту, і вони
навмисно розділені за підсистемами, а не проходять через один загальний
перемикач.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайна інжекція bootstrap робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова стартова преамбула для `/new` і `/reset`, включно з недавніми щоденними
  файлами `memory/*.md`.
- `skills.limits.*`:
  компактний список Skills, інжектований у системний prompt.
- `agents.defaults.contextLimits.*`:
  обмежені runtime-уривки та інжектовані блоки, якими володіє runtime.
- `memory.qmd.limits.*`:
  розмір фрагментів і інжекції для індексованого пошуку по пам’яті.

Використовуйте відповідне перевизначення для конкретного агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою преамбулою першого ходу, яка інжектується під час запусків bare `/new` і `/reset`.

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

Спільні значення за замовчуванням для обмежених поверхонь runtime-контексту.

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

- `memoryGetMaxChars`: типовий ліміт уривка `memory_get` до додавання метаданих
  усікання та повідомлення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків для `memory_get`, коли `lines`
  не вказано.
- `toolResultMaxChars`: поточний ліміт результатів інструментів, який використовується для збережених результатів і відновлення після переповнення.
- `postCompactionMaxChars`: ліміт уривка AGENTS.md, який використовується під час інжекції оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення на рівні агента для спільних перемикачів `contextLimits`. Невказані поля успадковуються
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

Глобальний ліміт для компактного списку Skills, інжектованого в системний prompt. Це
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

Перевизначення на рівні агента для бюджету prompt Skills.

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

Максимальний розмір у пікселях для довшої сторони зображення в блоках зображень transcript/tool перед викликами провайдера.
Типово: `1200`.

Нижчі значення зазвичай зменшують використання vision-токенів і розмір payload запиту для запусків із великою кількістю знімків екрана.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного prompt (не для часових міток повідомлень). Якщо не задано, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному prompt. Типово: `auto` (налаштування ОС).

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
      params: { cacheRetention: "long" }, // глобальні параметри провайдера за замовчуванням
      embeddedHarness: {
        runtime: "auto", // auto | pi | зареєстрований id harness, наприклад codex
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
  - Форма об’єкта задає основну модель плюс упорядковані failover-моделі.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як конфігурація vision-моделі.
  - Також використовується як fallback-маршрутизація, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею tool/plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-2` для OpenAI Images.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2`, `FAL_KEY` для `fal/*`).
  - Якщо параметр пропущено, `image_generate` усе одно може вивести типове значення провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації зображень у порядку id провайдера.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.5+`.
  - Якщо параметр пропущено, `music_generate` усе одно може вивести типове значення провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації музики в порядку id провайдера.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію провайдера/API key.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо параметр пропущено, `video_generate` усе одно може вивести типове значення провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, потім решту зареєстрованих провайдерів генерації відео в порядку id провайдера.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію провайдера/API key.
  - Вбудований провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість до 10 секунд і параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` та `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделей.
  - Якщо параметр пропущено, інструмент PDF повертається до `imageModel`, а потім до визначеної моделі сесії/типової моделі.
- `pdfMaxBytesMb`: типовий ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, яку враховує режим fallback-витягування в інструменті `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Типово: `"off"`.
- `elevatedDefault`: типовий рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типово: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.4` для доступу через API key або `openai-codex/gpt-5.5` для Codex OAuth). Якщо ви не вкажете провайдера, OpenClaw спочатку спробує alias, потім унікальний збіг exact model id серед налаштованих провайдерів і лише після цього повернеться до налаштованого провайдера за замовчуванням (застаріла поведінка для сумісності, тому краще вказувати явний `provider/model`). Якщо цей провайдер більше не надає налаштовану модель за замовчуванням, OpenClaw повернеться до першої налаштованої пари provider/model замість того, щоб показувати застаріле типове значення від видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`).
  - Безпечне редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відмовляється від замін, які вилучили б наявні записи allowlist, якщо не передати `--replace`.
  - Потоки configure/onboarding на рівні провайдера об’єднують вибрані моделі провайдера в цю мапу та зберігають уже налаштованих непов’язаних провайдерів.
  - Для прямих моделей OpenAI Responses компакція на стороні сервера вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити інжекцію `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [OpenAI server-side compaction](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), потім `agents.list[].params` (для відповідного id агента) перевизначає за ключем. Докладніше див. [Prompt Caching](/uk/reference/prompt-caching).
- `embeddedHarness`: типова політика низькорівневого runtime вбудованого агента. Використовуйте `runtime: "auto"`, щоб дозволити зареєстрованим plugin harness брати на себе підтримувані моделі, `runtime: "pi"`, щоб примусово використовувати вбудований harness PI, або зареєстрований id harness, наприклад `runtime: "codex"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний fallback до PI.
- Засоби запису конфігурації, які змінюють ці поля (наприклад `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну форму об’єкта та, за можливості, зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агента між сесіями (кожна сесія все одно серіалізується). Типово: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` керує тим, який низькорівневий виконавець запускає ходи вбудованого агента.
У більшості розгортань слід залишити типове значення `{ runtime: "auto", fallback: "pi" }`.
Використовуйте це, коли довірений plugin надає нативний harness, наприклад вбудований
harness app-server Codex.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` або id зареєстрованого plugin harness. Вбудований plugin Codex реєструє `codex`.
- `fallback`: `"pi"` або `"none"`. `"pi"` зберігає вбудований harness PI як fallback для сумісності, коли не вибрано жодного plugin harness. `"none"` змушує відсутній або непідтримуваний вибір plugin harness завершуватися помилкою замість тихого використання PI. Збої вибраного plugin harness завжди показуються напряму.
- Перевизначення через середовище: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` вимикає fallback до PI для цього процесу.
- Для розгортань лише з Codex установіть `model: "openai/gpt-5.5"`, `embeddedHarness.runtime: "codex"` і `embeddedHarness.fallback: "none"`.
- Вибір harness фіксується для кожного id сесії після першого вбудованого запуску. Зміни config/env впливають на нові або скинуті сесії, але не на наявний transcript. Застарілі сесії з історією transcript, але без зафіксованого значення, вважаються прив’язаними до PI. `/status` показує id harness, відмінні від PI, наприклад `codex`, поруч із `Fast`.
- Це керує лише вбудованим harness чату. Генерація медіа, vision, PDF, музики, відео та TTS усе ще використовують свої налаштування provider/model.

**Вбудовані alias-скорочення** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Alias               | Модель                                             |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` або налаштований Codex OAuth GPT-5.5 |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

Ваші налаштовані alias завжди мають пріоритет над типовими.

Для моделей Z.AI GLM-4.x режим thinking вмикається автоматично, якщо ви не встановите `--thinking off` або самостійно не задасте `agents.defaults.models["zai/<model>"].params.thinking`.
Для моделей Z.AI за замовчуванням увімкнено `tool_stream` для потокового передавання викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути його.
Для моделей Anthropic Claude 4.6 за замовчуванням використовується thinking `adaptive`, якщо не задано явний рівень thinking.

### `agents.defaults.cliBackends`

Необов’язкові CLI backends для text-only fallback-запусків (без викликів інструментів). Корисно як резервний варіант, коли API-провайдери недоступні.

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
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backends орієнтовані насамперед на текст; інструменти завжди вимкнені.
- Сесії підтримуються, коли задано `sessionArg`.
- Передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний prompt, зібраний OpenClaw, фіксованим рядком. Задається на типовому рівні (`agents.defaults.systemPromptOverride`) або для конкретного агента (`agents.list[].systemPromptOverride`). Значення для конкретного агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із prompt.

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

Незалежні від провайдера накладки prompt, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний поведінковий контракт між провайдерами; `personality` керує лише дружнім шаром стилю взаємодії.

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

- `"friendly"` (типово) і `"on"` вмикають дружній шар стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений поведінковий контракт GPT-5 залишається ввімкненим.
- Застарілий `plugins.entries.openai.config.personality` усе ще читається, коли це спільне налаштування не задано.

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
        includeSystemPromptSection: true, // типово: true; false прибирає секцію Heartbeat із системного prompt
        lightContext: false, // типово: false; true залишає лише HEARTBEAT.md із bootstrap-файлів робочого простору
        isolatedSession: false, // типово: false; true запускає кожен Heartbeat у новій сесії (без історії розмови)
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

- `every`: рядок тривалості (ms/s/m/h). Типово: `30m` (автентифікація через API key) або `1h` (автентифікація через OAuth). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, прибирає секцію Heartbeat із системного prompt і пропускає інжекцію `HEARTBEAT.md` у bootstrap-контекст. Типово: `true`.
- `suppressToolErrorWarnings`: коли `true`, пригнічує payload попереджень про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента Heartbeat до його переривання. Залиште незаданим, щоб використовувати `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/доставки в приватні повідомлення. `allow` (типово) дозволяє доставку за прямою ціллю. `block` пригнічує доставку за прямою ціллю та виводить `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
- `isolatedSession`: коли `true`, кожен Heartbeat запускається в новій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у Cron `sessionTarget: "isolated"`. Зменшує вартість одного Heartbeat за токенами приблизно зі ~100K до ~2–5K токенів.
- Для окремого агента: задайте `agents.list[].heartbeat`. Якщо будь-який агент визначає `heartbeat`, Heartbeat запускаються **лише для цих агентів**.
- Heartbeat запускають повні ходи агента — коротші інтервали спалюють більше токенів.

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
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // використовується, коли identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторну інжекцію
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для Compaction
        notifyUser: true, // надсилати короткі сповіщення користувачу, коли Compaction починається і завершується (типово: false)
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

- `mode`: `default` або `safeguard` (підсумовування довгих історій частинами). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin провайдера Compaction. Якщо задано, замість вбудованого LLM-підсумовування викликається `summarize()` цього провайдера. У разі помилки відбувається fallback до вбудованого. Установлення провайдера примусово вмикає `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction до того, як OpenClaw перерве її. Типово: `900`.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст для збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `postCompactionSections`: необов’язкові назви секцій H2/H3 з AGENTS.md для повторної інжекції після Compaction. Типово `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторну інжекцію. Якщо значення не задано або явно встановлено цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий fallback.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основна сесія має залишатися на одній моделі, а підсумки Compaction — виконуватися на іншій; якщо не задано, Compaction використовує основну модель сесії.
- `notifyUser`: коли `true`, надсилає короткі сповіщення користувачу, коли Compaction починається і завершується (наприклад, "Compacting context..." і "Compaction complete"). Типово вимкнено, щоб Compaction залишався тихим.
- `memoryFlush`: тихий хід агента перед автоматичним Compaction для збереження довготривалої пам’яті. Пропускається, коли робочий простір доступний лише для читання.

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
- `ttl` визначає, як часто обрізання може запускатися знову (після останнього торкання кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім, за потреби, повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок і кінець та вставляє `...` посередині.

**Повне очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не обрізаються і не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точних кількостях токенів.
- Якщо повідомлень асистента менше, ніж `keepLastAssistants`, обрізання пропускається.

</Accordion>

Докладніше про поведінку див. [Session Pruning](/uk/concepts/session-pruning).

### Block streaming

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

- Для каналів, відмінних від Telegram, потрібне явне `*.blockStreaming: true`, щоб увімкнути відповіді блоками.
- Перевизначення для каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Для Signal/Slack/Discord/Google Chat типово `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоками відповіді. `natural` = 800–2500ms. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Докладніше про поведінку та розбиття див. [Streaming](/uk/concepts/streaming).

### Індикатори набору

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

- Типові значення: `instant` для прямих чатів/згадок, `message` для групових чатів без згадок.
- Перевизначення для окремих сесій: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова Sandbox-ізоляція для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

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

<Accordion title="Деталі Sandbox">

**Backend:**

- `docker`: локальний runtime Docker (типово)
- `ssh`: універсальний віддалений runtime через SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для runtime, переносяться в
`plugins.entries.openshell.config`.

**Конфігурація SSH backend:**

- `target`: ціль SSH у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь для робочих просторів за scope
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, які передаються до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRefs, які OpenClaw матеріалізує в тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data`, що використовують SecretRef, визначаються з активного знімка runtime секретів перед стартом Sandbox-сесії

**Поведінка SSH backend:**

- один раз засіває віддалений робочий простір після створення або повторного створення
- потім зберігає віддалений робочий простір SSH як канонічний
- маршрутизує `exec`, файлові інструменти й шляхи медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує browser-контейнери Sandbox

**Доступ до робочого простору:**

- `none`: робочий простір Sandbox за scope у `~/.openclaw/sandboxes`
- `ro`: робочий простір Sandbox у `/workspace`, робочий простір агента монтується лише для читання в `/agent`
- `rw`: робочий простір агента монтується для читання/запису в `/workspace`

**Scope:**

- `session`: окремий контейнер + робочий простір для кожної сесії
- `agent`: один контейнер + робочий простір на агента (типово)
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

- `mirror`: перед `exec` віддалений простір засівається з локального, після `exec` синхронізується назад; локальний робочий простір залишається канонічним
- `remote`: віддалений простір засівається один раз під час створення Sandbox, після чого канонічним залишається віддалений робочий простір

У режимі `remote` локальні редагування на хості, зроблені поза OpenClaw, не синхронізуються в Sandbox автоматично після кроку засівання.
Транспортом є SSH у Sandbox OpenShell, але Plugin керує життєвим циклом Sandbox і необов’язковою дзеркальною синхронізацією.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потребує вихідного доступу до мережі, кореневої файлової системи з можливістю запису та користувача root.

**Типово контейнери мають `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний режим).

**Вхідні вкладення** розміщуються у `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для окремого агента об’єднуються.

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC інжектується в системний prompt. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача через noVNC типово використовує автентифікацію VNC, і OpenClaw видає короткоживучий URL із токеном (замість того, щоб розкривати пароль у спільному URL).

- `allowHostControl: false` (типово) блокує націлювання з Sandbox-сесій на browser хоста.
- `network` типово має значення `openclaw-sandbox-browser` (окрема bridge-мережа). Установлюйте `bridge` лише тоді, коли вам явно потрібна глобальна зв’язність bridge.
- `cdpSourceRange` за бажанням обмежує вхідний доступ CDP на межі контейнера до діапазону CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер browser Sandbox. Якщо параметр задано (включно з `[]`), він замінює `docker.binds` для контейнера browser.
- Типові параметри запуску визначені в `scripts/sandbox-browser-entrypoint.sh` і налаштовані для контейнерних хостів:
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
    увімкнені типово й можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо для WebGL/3D це потрібно.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає extensions, якщо ваш workflow
    залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типовий ліміт процесів Chromium.
  - а також `--no-sandbox` і `--disable-setuid-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення — це базова конфігурація образу контейнера; використовуйте власний образ browser із власним
    entrypoint, щоб змінити типові значення контейнера.

</Accordion>

Sandbox-ізоляція browser і `sandbox.docker.binds` доступні лише для Docker.

Збірка образів:

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов’язковий образ browser
```

### `agents.list` (перевизначення для окремого агента)

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
        thinkingDefault: "high", // перевизначення рівня thinking для окремого агента
        reasoningDefault: "on", // перевизначення видимості reasoning для окремого агента
        fastModeDefault: false, // перевизначення fast mode для окремого агента
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // перевизначає за ключами відповідні params з defaults.models
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
- `default`: якщо задано кілька значень, перше має пріоритет (записується попередження в лог). Якщо не задано жодного, типовим буде перший елемент у списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні fallback). Cron-завдання, які перевизначають лише `primary`, усе ще успадковують типові fallback, якщо не встановити `fallbacks: []`.
- `params`: параметри потоку для окремого агента, які об’єднуються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для перевизначень на рівні агента, таких як `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `skills`: необов’язковий allowlist Skills для окремого агента. Якщо параметр пропущено, агент успадковує `agents.defaults.skills`, якщо його задано; явний список замінює типові значення замість злиття, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень thinking для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, якщо не задано перевизначення для повідомлення або сесії.
- `reasoningDefault`: необов’язкове типове значення видимості reasoning для окремого агента (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning для повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення fast mode для окремого агента (`true | false`). Застосовується, коли не задано перевизначення fast mode для повідомлення або сесії.
- `embeddedHarness`: необов’язкове перевизначення політики низькорівневого harness для окремого агента. Використовуйте `{ runtime: "codex", fallback: "none" }`, щоб зробити один агент лише Codex, тоді як інші агенти зберігатимуть типовий fallback до PI.
- `runtime`: необов’язковий дескриптор runtime для окремого агента. Використовуйте `type: "acp"` із типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сесії harness ACP.
- `identity.avatar`: шлях відносно робочого простору, `http(s)` URL або `data:` URI.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist id агентів для `sessions_spawn` (`["*"]` = будь-який; типово: лише той самий агент).
- Захист успадкування Sandbox: якщо сесія-ініціатор працює в Sandbox, `sessions_spawn` відхиляє цілі, які запускалися б без Sandbox.
- `subagents.requireAgentId`: коли `true`, блокує виклики `sessions_spawn`, які не містять `agentId` (примушує до явного вибору профілю; типово: false).

---

## Маршрутизація кількох агентів

Запускайте кілька ізольованих агентів у межах одного Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

### Поля відповідності binding

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутнє значення типово означає route), `acp` для постійних binding розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок відповідності:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Типовий агент

У межах кожного рівня перший відповідний запис у `bindings` має пріоритет.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує порядок рівнів route binding, наведений вище.

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

Докладніше про пріоритети див. [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

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
    parentForkMaxTokens: 100000, // пропустити fork батьківського thread вище цього ліміту токенів (0 вимикає)
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
      maxAgeHours: 0, // типовий жорсткий максимальний вік у годинах (`0` вимикає)
    },
    mainKey: "main", // застаріле (runtime завжди використовує "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Деталі полів сесії">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу ділять одну спільну сесію (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються приватні повідомлення.
  - `main`: усі приватні повідомлення використовують головну сесію.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для inbox із кількома користувачами).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для кількох облікових записів).
- **`identityLinks`**: мапа канонічних id до peer із префіксом провайдера для спільного використання сесій між каналами.
- **`reset`**: основна політика скидання. `daily` скидає в `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва, спрацьовує те, що спливе першим.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` у батьківській сесії, дозволене під час створення сесії fork для thread (типово `100000`).
  - Якщо значення `totalTokens` у батьківській сесії перевищує це число, OpenClaw починає нову сесію thread замість успадкування історії transcript батьківської сесії.
  - Установіть `0`, щоб вимкнути цей захист і завжди дозволяти fork від батьківської сесії.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для головного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість зворотних ходів між агентами під час обміну agent-to-agent (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжки ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перше правило deny має пріоритет.
- **`maintenance`**: очищення сховища сесій + керування retention.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`).
  - `rotateBytes`: ротація `sessions.json`, коли він перевищує цей розмір (типово `10mb`).
  - `resetArchiveRetention`: retention для архівів transcript `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий бюджет дискового простору для каталогу сесій. У режимі `warn` лише пише попередження в лог; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення за бюджетом. Типово `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив’язаних до thread.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса після неактивності в годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)

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

Визначення значення (найспецифічніше має пріоритет): обліковий запис → канал → глобальне. `""` вимикає й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна           | Опис                    | Приклад                     |
| ---------------- | ----------------------- | --------------------------- |
| `{model}`        | Коротка назва моделі    | `claude-opus-4-6`           |
| `{modelFull}`    | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`     | Назва провайдера        | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking | `high`, `low`, `off`        |
| `{identity.name}` | Ім’я identity агента   | (те саме, що й `"auto"`)    |

Змінні нечутливі до регістру. `{think}` — alias для `{thinkingLevel}`.

### Ack reaction

- Типово береться з `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → fallback до identity.
- Область дії: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє ack після відповіді в Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord незадане значення зберігає реакції статусу ввімкненими, коли активні ack reaction.
  У Telegram установіть це значення явно в `true`, щоб увімкнути реакції статусу життєвого циклу.

### Inbound debounce

Об’єднує швидку послідовність текстових повідомлень від одного відправника в один хід агента. Медіа/вкладення скидаються негайно. Керувальні команди обходять debounce.

### TTS (text-to-speech)

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
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` керує типовим режимом auto-TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначити локальні prefs, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` типово дорівнює `false` (потрібне явне ввімкнення).
- API keys повертаються до `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- `openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: config, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `openai.baseUrl` вказує на endpoint, що не належить OpenAI, OpenClaw вважає його OpenAI-сумісним TTS-сервером і послаблює валідацію model/voice.

---

## Talk

Типові значення для режиму Talk (macOS/iOS/Android).

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
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька провайдерів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) потрібні лише для сумісності й автоматично мігруються в `talk.providers.<provider>`.
- Voice ID повертаються до `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки відкритого тексту або об’єкти SecretRef.
- Fallback до `ELEVENLABS_API_KEY` застосовується лише тоді, коли API key Talk не налаштовано.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні імена.
- `silenceTimeoutMs` визначає, скільки режим Talk чекає після тиші користувача перед надсиланням transcript. Якщо не задано, зберігається типове вікно паузи для платформи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Пов’язане

- [Configuration reference](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Configuration](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Configuration examples](/uk/gateway/configuration-examples)
