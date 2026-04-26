---
read_when:
    - Налаштування параметрів агента за замовчуванням (моделі, thinking, робочий простір, Heartbeat, медіа, Skills)
    - Налаштування маршрутизації та прив’язок для кількох агентів
    - Налаштування поведінки сеансу, доставки повідомлень і режиму talk
summary: Параметри агента за замовчуванням, маршрутизація між кількома агентами, сеанс, повідомлення та конфігурація talk
title: Конфігурація — агенти
x-i18n:
    generated_at: "2026-04-26T07:48:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

Ключі конфігурації з областю дії агента в `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` і `talk.*`. Для каналів, інструментів, runtime Gateway та інших
ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Параметри агента за замовчуванням

### `agents.defaults.workspace`

За замовчуванням: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, що показується в рядку Runtime системного промпту. Якщо не задано, OpenClaw автоматично визначає його, підіймаючись угору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий список дозволених навичок за замовчуванням для агентів, які не задають
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює значення за замовчуванням
      { id: "locked-down", skills: [] }, // без навичок
    ],
  },
}
```

- Не вказуйте `agents.defaults.skills`, щоб за замовчуванням Skills не були обмежені.
- Не вказуйте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
- Установіть `agents.list[].skills: []`, щоб не дозволяти жодних Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується зі значеннями за замовчуванням.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення файлів bootstrap робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли файли bootstrap робочого простору вбудовуються в системний промпт. За замовчуванням: `"always"`.

- `"continuation-skip"`: у безпечних ходах продовження (після завершеної відповіді асистента) повторне вбудовування bootstrap робочого простору пропускається, що зменшує розмір промпту. Запуски Heartbeat і повторні спроби після Compaction все одно перебудовують контекст.
- `"never"`: вимикає вбудовування bootstrap робочого простору та файлів контексту на кожному ході. Використовуйте це лише для агентів, які повністю керують власним життєвим циклом промпту (власні рушії контексту, нативні runtime, які самі формують контекст, або спеціалізовані потоки без bootstrap). Ходи Heartbeat і відновлення після Compaction також пропускають вбудовування.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на файл bootstrap робочого простору до обрізання. За замовчуванням: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна сумарна кількість символів, що вбудовуються з усіх файлів bootstrap робочого простору. За замовчуванням: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує текстом попередження, видимим агенту, коли bootstrap-контекст обрізається.
За замовчуванням: `"once"`.

- `"off"`: ніколи не вбудовувати текст попередження в системний промпт.
- `"once"`: вбудовувати попередження один раз для кожного унікального сигнатурного набору обрізання (рекомендовано).
- `"always"`: вбудовувати попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта відповідальності за бюджети контексту

OpenClaw має кілька великих бюджетів промпту/контексту, і вони
навмисно розділені між підсистемами, а не проходять через один загальний
перемикач.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вбудовування bootstrap робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова стартова преамбула для `/new` і `/reset`, зокрема нещодавні щоденні
  файли `memory/*.md`.
- `skills.limits.*`:
  компактний список Skills, вбудований у системний промпт.
- `agents.defaults.contextLimits.*`:
  обмежені runtime-уривки та вбудовані блоки, якими володіє runtime.
- `memory.qmd.limits.*`:
  уривок індексованого пошуку в пам’яті та розміри вбудовування.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою преамбулою першого ходу, яка вбудовується в звичайні запуски `/new` і `/reset`.

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

- `memoryGetMaxChars`: обмеження уривка `memory_get` за замовчуванням до додавання
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: вікно рядків `memory_get` за замовчуванням, коли `lines`
  не вказано.
- `toolResultMaxChars`: обмеження результатів інструментів у реальному часі, яке використовується для збережених результатів і
  відновлення при переповненні.
- `postCompactionMaxChars`: обмеження уривка AGENTS.md, що використовується під час вбудовування оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних параметрів `contextLimits`. Пропущені поля успадковуються
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

Глобальне обмеження для компактного списку Skills, вбудованого в системний промпт. Це
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

Перевизначення бюджету промпту Skills для окремого агента.

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

Максимальний розмір у пікселях для найдовшої сторони зображення в блоках зображень transcript/tool перед викликами провайдера.
За замовчуванням: `1200`.

Менші значення зазвичай зменшують використання vision-токенів і розмір payload запиту для запусків із великою кількістю знімків екрана.
Більші значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного промпту (не для часових міток повідомлень). Якщо не задано, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному промпті. За замовчуванням: `auto` (налаштування ОС).

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
      agentRuntime: {
        id: "pi", // pi | auto | ідентифікатор зареєстрованого harness, наприклад codex
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
  - Форма об’єкта задає основну модель і впорядковані резервні моделі для failover.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як конфігурація його vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструментів/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal, `openai/gpt-image-2` для OpenAI Images або `openai/gpt-image-1.5` для прозорого PNG/WebP-виводу OpenAI.
  - Якщо ви безпосередньо вибираєте provider/model, також налаштуйте відповідну автентифікацію провайдера (наприклад, `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` або OpenAI Codex OAuth для `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` для `fal/*`).
  - Якщо значення не задано, `image_generate` усе одно може вивести типове значення провайдера на основі доступної автентифікації. Спочатку він пробує поточного типового провайдера, а потім інші зареєстровані провайдери генерації зображень у порядку їхніх provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.6`.
  - Якщо значення не задано, `music_generate` усе одно може вивести типове значення провайдера на основі доступної автентифікації. Спочатку він пробує поточного типового провайдера, а потім інші зареєстровані провайдери генерації музики в порядку їхніх provider-id.
  - Якщо ви безпосередньо вибираєте provider/model, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо значення не задано, `video_generate` усе одно може вивести типове значення провайдера на основі доступної автентифікації. Спочатку він пробує поточного типового провайдера, а потім інші зареєстровані провайдери генерації відео в порядку їхніх provider-id.
  - Якщо ви безпосередньо вибираєте provider/model, також налаштуйте відповідну автентифікацію провайдера/API-ключ.
  - Вбудований провайдер генерації відео Qwen підтримує не більш як 1 вихідне відео, 1 вхідне зображення, 4 вхідні відео, тривалість до 10 секунд, а також параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо значення не задано, інструмент PDF повертається до `imageModel`, а потім — до визначеної моделі сеансу/типової моделі.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, які враховуються в режимі резервного видобування для інструмента `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. За замовчуванням: `"off"`.
- `elevatedDefault`: типовий рівень розширеного виводу для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. За замовчуванням: `"on"`.
- `model.primary`: формат `provider/model` (наприклад, `openai/gpt-5.5` для доступу через API-ключ або `openai-codex/gpt-5.5` для Codex OAuth). Якщо не вказати провайдера, OpenClaw спочатку намагається знайти alias, потім — унікальний збіг налаштованого провайдера для цього точного id моделі, і лише після цього повертається до налаштованого типового провайдера (застаріла поведінка для сумісності, тому краще явно вказувати `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого provider/model замість показу застарілого типового значення для видаленого провайдера.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Безпечні зміни: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відмовляється від замін, які видалили б наявні записи allowlist, якщо ви не передасте `--replace`.
  - Потоки configure/onboarding з областю дії провайдера об’єднують вибрані моделі провайдера в цю мапу та зберігають уже налаштованих сторонніх провайдерів без змін.
  - Для прямих моделей OpenAI Responses server-side Compaction вмикається автоматично. Використовуйте `params.responsesServerCompaction: false`, щоб припинити вбудовування `context_management`, або `params.responsesCompactThreshold`, щоб перевизначити поріг. Див. [OpenAI server-side compaction](/uk/providers/openai#server-side-compaction-responses-api).
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад, `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), а потім `agents.list[].params` (для відповідного id агента) перевизначає за ключем. Докладніше див. у [Prompt Caching](/uk/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: розширений pass-through JSON, що зливається з тілами запитів `api: "openai-completions"` для OpenAI-сумісних проксі. Якщо виникає конфлікт зі згенерованими ключами запиту, перемагає extra body; не нативні маршрути completions усе одно потім видаляють OpenAI-специфічний `store`.
- `params.chat_template_kwargs`: аргументи chat template для vLLM/OpenAI-сумісних реалізацій, які зливаються у верхньорівневі тіла запитів `api: "openai-completions"`. Для `vllm/nemotron-3-*` із вимкненим thinking OpenClaw автоматично надсилає `enable_thinking: false` і `force_nonempty_content: true`; явні `chat_template_kwargs` перевизначають ці значення за замовчуванням, а `extra_body.chat_template_kwargs` усе одно має остаточний пріоритет.
- `params.preserveThinking`: доступне лише для Z.AI опційне ввімкнення збереженого thinking. Коли увімкнено і thinking активний, OpenClaw надсилає `thinking.clear_thinking: false` і відтворює попередній `reasoning_content`; див. [Z.AI thinking and preserved thinking](/uk/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: типова політика низькорівневого runtime агента. Якщо `id` не задано, за замовчуванням використовується OpenClaw Pi. Використовуйте `id: "pi"`, щоб примусово ввімкнути вбудований harness PI, `id: "auto"`, щоб зареєстровані harness Plugin могли підхоплювати підтримувані моделі, зареєстрований id harness, наприклад `id: "codex"`, або підтримуваний alias CLI-бекенда, наприклад `id: "claude-cli"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід до PI. Явні runtime Plugin, такі як `codex`, за замовчуванням працюють у fail closed, якщо ви не задасте `fallback: "pi"` у тій самій області перевизначення. Зберігайте посилання на моделі в канонічному форматі `provider/model`; вибирайте Codex, Claude CLI, Gemini CLI та інші бекенди виконання через конфігурацію runtime, а не через застарілі префікси runtime-провайдера. Див. [Agent runtimes](/uk/concepts/agent-runtimes), щоб зрозуміти, чим це відрізняється від вибору provider/model.
- Засоби запису конфігурації, які змінюють ці поля (наприклад, `/models set`, `/models set-image` і команди додавання/видалення резервних значень), зберігають канонічну форму об’єкта й за можливості зберігають наявні списки резервних значень.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе одно серіалізується). За замовчуванням: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` керує тим, який низькорівневий виконавець обробляє ходи агента. У більшості
розгортань слід залишати типовий runtime OpenClaw Pi. Використовуйте його, коли довірений
Plugin надає нативний harness, наприклад вбудований harness app-server Codex,
або коли ви хочете підтримуваний CLI-бекенд, такий як Claude CLI. Для розуміння моделі
див. [Agent runtimes](/uk/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, id зареєстрованого harness Plugin або alias підтримуваного CLI-бекенда. Вбудований Plugin Codex реєструє `codex`; вбудований Plugin Anthropic надає CLI-бекенд `claude-cli`.
- `fallback`: `"pi"` або `"none"`. Для `id: "auto"` пропущене значення fallback за замовчуванням дорівнює `"pi"`, щоб старі конфігурації могли й надалі використовувати PI, коли жоден harness Plugin не бере запуск на себе. У режимі явного runtime Plugin, наприклад `id: "codex"`, пропущене значення fallback за замовчуванням дорівнює `"none"`, щоб відсутній harness спричиняв помилку, а не тихо перемикався на PI. Перевизначення runtime не успадковують fallback із ширшої області; задавайте `fallback: "pi"` разом із явним runtime, коли вам справді потрібен цей сумісний резервний варіант. Помилки вибраного harness Plugin завжди виводяться безпосередньо.
- Перевизначення через середовище: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` перевизначає fallback для цього процесу.
- Для розгортань лише з Codex установіть `model: "openai/gpt-5.5"` і `agentRuntime.id: "codex"`. Для наочності ви також можете явно вказати `agentRuntime.fallback: "none"`; це значення за замовчуванням для явних runtime Plugin.
- Для розгортань із Claude CLI віддавайте перевагу `model: "anthropic/claude-opus-4-7"` разом із `agentRuntime.id: "claude-cli"`. Застарілі посилання на моделі `claude-cli/claude-opus-4-7` усе ще працюють для сумісності, але в новій конфігурації вибір provider/model має залишатися канонічним, а бекенд виконання слід задавати в `agentRuntime.id`.
- Старіші ключі політики runtime переписуються до `agentRuntime` за допомогою `openclaw doctor --fix`.
- Вибір harness закріплюється за id сеансу після першого вбудованого запуску. Зміни конфігурації/середовища впливають на нові або скинуті сеанси, а не на наявну транскрипцію. Застарілі сеанси з історією транскрипції, але без зафіксованого значення, вважаються закріпленими за PI. `/status` показує ефективний runtime, наприклад `Runtime: OpenClaw Pi Default` або `Runtime: OpenAI Codex`.
- Це керує лише виконанням текстових ходів агента. Генерація медіа, vision, PDF, музика, відео й TTS і надалі використовують свої параметри provider/model.

**Вбудовані скорочення alias** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Alias               | Модель                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Ваші налаштовані alias завжди мають пріоритет над типовими.

Для моделей Z.AI GLM-4.x режим thinking вмикається автоматично, якщо ви не встановите `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI за замовчуванням вмикають `tool_stream` для потокової передачі викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 значенням thinking за замовчуванням є `adaptive`, якщо явний рівень thinking не задано.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як резервний варіант, коли API-провайдери не працюють.

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
          // Або використовуйте systemPromptFileArg, якщо CLI приймає прапорець файла промпту.
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
- Сеанси підтримуються, коли задано `sessionArg`.
- Передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний промпт, зібраний OpenClaw, фіксованим рядком. Задається на типовому рівні (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із промптом.

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

Незалежні від провайдера накладки промпту, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний контракт поведінки між провайдерами; `personality` керує лише дружнім шаром стилю взаємодії.

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

- `"friendly"` (за замовчуванням) і `"on"` вмикають дружній шар стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений контракт поведінки GPT-5 залишається ввімкненим.
- Застаріле `plugins.entries.openai.config.personality` усе ще читається, коли це спільне налаштування не задано.

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
        includeSystemPromptSection: true, // за замовчуванням: true; false прибирає розділ Heartbeat із системного промпту
        lightContext: false, // за замовчуванням: false; true залишає лише HEARTBEAT.md із bootstrap-файлів робочого простору
        isolatedSession: false, // за замовчуванням: false; true запускає кожен heartbeat у свіжому сеансі (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (за замовчуванням) | block
        target: "none", // за замовчуванням: none | варіанти: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). За замовчуванням: `30m` (автентифікація API-ключем) або `1h` (OAuth-автентифікація). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли `false`, прибирає розділ Heartbeat із системного промпту й пропускає вбудовування `HEARTBEAT.md` у bootstrap-контекст. За замовчуванням: `true`.
- `suppressToolErrorWarnings`: коли `true`, пригнічує payload попереджень про помилки інструментів під час запусків heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента heartbeat, після чого його буде перервано. Якщо не задано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/DM. `allow` (за замовчуванням) дозволяє доставку на прямі цілі. `block` пригнічує доставку на прямі цілі й видає `reason=dm-blocked`.
- `lightContext`: коли `true`, запуски heartbeat використовують полегшений bootstrap-контекст і залишають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
- `isolatedSession`: коли `true`, кожен heartbeat запускається в новому сеансі без попередньої історії розмови. Та сама схема ізоляції, що й у Cron `sessionTarget: "isolated"`. Зменшує вартість одного heartbeat у токенах приблизно зі ~100K до ~2-5K токенів.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, **лише ці агенти** запускають heartbeat.
- Heartbeat виконує повні ходи агента — коротші інтервали спалюють більше токенів.

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
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторне вбудовування
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для Compaction
        notifyUser: true, // надсилати короткі сповіщення, коли compaction починається й завершується (за замовчуванням: false)
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

- `mode`: `default` або `safeguard` (підсумовування шматками для довгої історії). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin провайдера Compaction. Якщо задано, викликається `summarize()` цього провайдера замість вбудованого LLM-підсумовування. У разі помилки повертається до вбудованого варіанта. Задання провайдера примусово встановлює `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, після чого OpenClaw її перериває. За замовчуванням: `900`.
- `keepRecentTokens`: бюджет точки відсікання Pi для збереження найсвіжішого хвоста транскрипції дослівно. Ручний `/compact` враховує це, коли значення явно задано; інакше ручний compaction є жорсткою контрольною точкою.
- `identifierPolicy`: `strict` (за замовчуванням), `off` або `custom`. `strict` додає вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст про збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `qualityGuard`: перевірки з повторною спробою для некоректно сформованого виводу підсумків safeguard. Увімкнено за замовчуванням у режимі safeguard; установіть `enabled: false`, щоб пропустити аудит.
- `postCompactionSections`: необов’язкові назви розділів H2/H3 з AGENTS.md для повторного вбудовування після Compaction. За замовчуванням `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторне вбудовування. Якщо значення не задано або явно задано цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основний сеанс має залишатися на одній моделі, а підсумки Compaction повинні виконуватися на іншій; якщо не задано, Compaction використовує основну модель сеансу.
- `notifyUser`: коли `true`, надсилає користувачеві короткі сповіщення, коли Compaction починається й завершується (наприклад, "Compacting context..." і "Compaction complete"). За замовчуванням вимкнено, щоб Compaction залишався тихим.
- `memoryFlush`: тихий агентний хід перед авто-Compaction для збереження довготривалих спогадів. Пропускається, коли робочий простір доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сеансу на диску.

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
- `ttl` керує тим, як часто обрізання може запускатися знову (після останнього торкання кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім, за потреби, повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок і кінець та вставляє `...` посередині.

**Повне очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо повідомлень assistant менше, ніж `keepLastAssistants`, обрізання пропускається.

</Accordion>

Докладніше про поведінку див. у [Session Pruning](/uk/concepts/session-pruning).

### Блокове потокове передавання

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

- Канали, відмінні від Telegram, потребують явного `*.blockStreaming: true`, щоб увімкнути блокові відповіді.
- Перевизначення для каналів: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Для Signal/Slack/Discord/Google Chat типовим є `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоковими відповідями. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Докладніше про поведінку та розбиття на частини див. у [Streaming](/uk/concepts/streaming).

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

- Значення за замовчуванням: `instant` для прямих чатів/згадок, `message` для групових чатів без згадок.
- Перевизначення для окремого сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Докладніше див. у [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкове пісочне середовище для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

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

<Accordion title="Докладно про sandbox">

**Бекенд:**

- `docker`: локальний Docker runtime (за замовчуванням)
- `ssh`: загальний віддалений runtime на основі SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для runtime, переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (за замовчуванням: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів у межах кожної області
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, які OpenClaw матеріалізує у тимчасові файли під час виконання
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет SSH-автентифікації:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef визначаються з активного знімка runtime секретів до початку sandbox-сеансу

**Поведінка SSH-бекенда:**

- один раз ініціалізує віддалений робочий простір після створення або повторного створення
- після цього підтримує віддалений робочий простір SSH як канонічний
- спрямовує `exec`, файлові інструменти та шляхи медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує sandbox-контейнери браузера

**Доступ до робочого простору:**

- `none`: робочий простір sandbox у межах області під `~/.openclaw/sandboxes`
- `ro`: робочий простір sandbox у `/workspace`, робочий простір агента монтується лише для читання в `/agent`
- `rw`: робочий простір агента монтується для читання й запису в `/workspace`

**Область дії:**

- `session`: окремий контейнер і робочий простір для кожного сеансу
- `agent`: один контейнер і робочий простір для кожного агента (за замовчуванням)
- `shared`: спільний контейнер і робочий простір (без ізоляції між сеансами)

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

- `mirror`: ініціалізує віддалене середовище з локального перед exec, синхронізує назад після exec; локальний робочий простір залишається канонічним
- `remote`: один раз ініціалізує віддалене середовище під час створення sandbox, після чого віддалений робочий простір залишається канонічним

У режимі `remote` локальні редагування на хості, зроблені поза OpenClaw, не синхронізуються в sandbox автоматично після кроку ініціалізації.
Транспорт — SSH до sandbox OpenShell, але життєвим циклом sandbox і необов’язковою синхронізацією mirror керує Plugin.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує вихідного мережевого доступу, доступного для запису кореня та користувача root.

**Контейнери за замовчуванням мають `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` заблоковано за замовчуванням, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний режим).

**Вхідні вкладення** розміщуються у `media/inbound/*` в активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для окремого агента об’єднуються.

**Sandbox-браузер** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вбудовується в системний промпт. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача noVNC за замовчуванням використовує VNC-автентифікацію, і OpenClaw видає URL із короткоживучим токеном (замість того, щоб показувати пароль у спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує націлювання sandbox-сеансів на браузер хоста.
- `network` за замовчуванням дорівнює `openclaw-sandbox-browser` (виділена bridge-мережа). Установлюйте `bridge` лише тоді, коли вам явно потрібна глобальна bridge-зв’язність.
- `cdpSourceRange` за потреби обмежує вхідний CDP-трафік на межі контейнера до діапазону CIDR (наприклад, `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер sandbox-браузера. Якщо задано (зокрема `[]`), це замінює `docker.binds` для контейнера браузера.
- Параметри запуску за замовчуванням визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для хостів із контейнерами:
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
  - `--disable-extensions` (увімкнено за замовчуванням)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    увімкнені за замовчуванням і можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього вимагає використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо вони
    потрібні для вашого робочого процесу.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - а також `--no-sandbox`, коли увімкнено `noSandbox`.
  - Типові значення — це базовий рівень образу контейнера; щоб змінити типові параметри контейнера,
    використовуйте власний образ браузера з власною entrypoint.

</Accordion>

Пісочне середовище браузера й `sandbox.docker.binds` доступні лише для Docker.

Зібрати образи:

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов’язковий образ браузера
```

### `agents.list` (перевизначення для окремого агента)

Використовуйте `agents.list[].tts`, щоб надати агенту власного TTS-провайдера, голос, модель,
стиль або режим автоматичного TTS. Блок агента виконує глибоке злиття поверх глобального
`messages.tts`, тому спільні облікові дані можуть залишатися в одному місці, а окремі
агенти перевизначатимуть лише потрібні їм поля голосу чи провайдера. Перевизначення
активного агента застосовується до автоматичних озвучених відповідей, `/tts audio`, `/tts status`
і до інструмента агента `tts`. Приклади провайдерів і пріоритетів див. у [Text-to-speech](/uk/tools/tts#per-agent-voice-overrides).

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
        fastModeDefault: false, // перевизначення швидкого режиму для окремого агента
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // перевизначає відповідні defaults.models params за ключем
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
- `default`: коли задано кілька, перший має пріоритет (записується попередження). Якщо не задано жодного, типовим є перший елемент списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва значення (`[]` вимикає глобальні резервні значення). Завдання Cron, які перевизначають лише `primary`, усе одно успадковують типові `fallbacks`, якщо ви не встановите `fallbacks: []`.
- `params`: параметри потоку для окремого агента, що зливаються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень, таких як `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `tts`: необов’язкові перевизначення text-to-speech для окремого агента. Цей блок виконує глибоке злиття поверх `messages.tts`, тому зберігайте спільні облікові дані провайдера та політику резервного переходу в `messages.tts`, а тут задавайте лише значення, специфічні для персони, як-от провайдер, голос, модель, стиль або автоматичний режим.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо не задано, агент успадковує `agents.defaults.skills`, якщо їх задано; явний список замінює типові значення замість злиття, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень thinking для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для окремого повідомлення або сеансу. Вибраний профіль provider/model визначає, які значення є припустимими; для Google Gemini `adaptive` зберігає динамічний thinking, керований провайдером (`thinkingLevel` пропускається в Gemini 3/3.1, `thinkingBudget: -1` у Gemini 2.5).
- `reasoningDefault`: необов’язкова типова видимість reasoning для окремого агента (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning для окремого повідомлення або сеансу.
- `fastModeDefault`: необов’язкове типове значення швидкого режиму для окремого агента (`true | false`). Застосовується, коли не задано перевизначення швидкого режиму для окремого повідомлення або сеансу.
- `agentRuntime`: необов’язкове перевизначення політики низькорівневого runtime для окремого агента. Використовуйте `{ id: "codex" }`, щоб зробити один агент лише для Codex, тоді як інші агенти зберігатимуть типовий резервний PI у режимі `auto`.
- `runtime`: необов’язковий дескриптор runtime для окремого агента. Використовуйте `type: "acp"` разом із типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має за замовчуванням використовувати ACP harness-сеанси.
- `identity.avatar`: шлях, відносний до робочого простору, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist id агентів для `sessions_spawn` (`["*"]` = будь-який; за замовчуванням: лише той самий агент).
- Захист успадкування sandbox: якщо сеанс запитувача працює в пісочному середовищі, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: коли `true`, блокує виклики `sessions_spawn`, які не містять `agentId` (примушує до явного вибору профілю; за замовчуванням: false).

---

## Маршрутизація між кількома агентами

Запускайте кілька ізольованих агентів в одному Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній `type` за замовчуванням означає route), `acp` для постійних ACP-прив’язок розмов.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; якщо не задано = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок збігу:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (для всього каналу)
6. Типовий агент

У межах кожного рівня перемагає перший відповідний запис `bindings`.

Для записів `type: "acp"` OpenClaw виконує зіставлення за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок рівнів прив’язок route.

### Профілі доступу для окремого агента

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

<Accordion title="Інструменти й робочий простір лише для читання">

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

Докладніше про пріоритети див. у [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

---

## Сеанс

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
    parentForkMaxTokens: 100000, // пропустити відгалуження від батьківського потоку понад цю кількість токенів (0 вимикає)
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
      idleHours: 24, // автоматичне зняття фокуса через неактивність у годинах за замовчуванням (`0` вимикає)
      maxAgeHours: 0, // жорсткий максимальний вік у годинах за замовчуванням (`0` вимикає)
    },
    mainKey: "main", // застаріле поле (runtime завжди використовує "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Докладно про поля сеансу">

- **`scope`**: базова стратегія групування сеансів для контекстів групового чату.
  - `per-sender` (за замовчуванням): кожен відправник отримує ізольований сеанс у межах контексту каналу.
  - `global`: усі учасники в контексті каналу ділять один спільний сеанс (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM поділяють головний сеанс.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція для кожної пари канал + відправник (рекомендовано для багатокористувацьких inbox).
  - `per-account-channel-peer`: ізоляція для кожної пари обліковий запис + канал + відправник (рекомендовано для кількох облікових записів).
- **`identityLinks`**: мапа канонічних id до peer із префіксом провайдера для спільного використання сеансу між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, перемагає той, що спливає раніше. Актуальність для щоденного скидання визначається через `sessionStartedAt` рядка сеансу; актуальність для скидання за бездіяльністю — через `lastInteractionAt`. Фонові/системні записи, як-от heartbeat, пробудження Cron, сповіщення exec і службовий облік Gateway, можуть оновлювати `updatedAt`, але вони не підтримують актуальність сеансів daily/idle.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальний `totalTokens` батьківського сеансу, дозволений під час створення сеансу потоку через відгалуження (за замовчуванням `100000`).
  - Якщо `totalTokens` батьківського сеансу перевищує це значення, OpenClaw запускає новий сеанс потоку замість успадкування історії транскрипції батьківського сеансу.
  - Установіть `0`, щоб вимкнути цей захист і завжди дозволяти відгалуження від батьківського сеансу.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для головного кошика прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів відповіді у відповідь між агентами під час обміну агент-до-агента (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжки ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перше deny має пріоритет.
- **`maintenance`**: очищення сховища сеансів і контроль утримання.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: поріг віку для застарілих записів (за замовчуванням `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (за замовчуванням `500`).
  - `rotateBytes`: ротує `sessions.json`, коли він перевищує цей розмір (за замовчуванням `10mb`).
  - `resetArchiveRetention`: строк зберігання архівів транскриптів `*.reset.<timestamp>`. За замовчуванням дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий дисковий бюджет для каталогу сеансів. У режимі `warn` це записує попередження; у режимі `enforce` спочатку видаляються найстаріші артефакти/сеанси.
  - `highWaterBytes`: необов’язкова ціль після очищення за бюджетом. За замовчуванням `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сеансу, прив’язаних до потоків.
  - `enabled`: головний типовий перемикач (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: автоматичне зняття фокуса через неактивність у годинах за замовчуванням (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: жорсткий максимальний вік у годинах за замовчуванням (`0` вимикає; провайдери можуть перевизначати)

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

Визначення значення (найспецифічніше перемагає): обліковий запис → канал → глобальне. `""` вимикає й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Шаблонні змінні:**

| Змінна            | Опис                         | Приклад                     |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі         | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера             | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking     | `high`, `low`, `off`        |
| `{identity.name}` | Назва ідентичності агента    | (те саме, що й `"auto"`)    |

Змінні нечутливі до регістру. `{think}` — це alias для `{thinkingLevel}`.

### Реакція підтвердження

- За замовчуванням використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення з identity.
- Область дії: `group-mentions` (за замовчуванням), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: прибирає реакцію підтвердження після відповіді в каналах, що підтримують реакції, таких як Slack, Discord, Telegram, WhatsApp і BlueBubbles.
- `messages.statusReactions.enabled`: вмикає реакції стану життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо значення не задано, реакції стану залишаються ввімкненими, коли активні реакції підтвердження.
  У Telegram, щоб увімкнути реакції стану життєвого циклу, явно встановіть `true`.

### Вхідний debounce

Групує швидкі текстові повідомлення від одного відправника в один хід агента. Медіа/вкладення скидаються негайно. Керувальні команди обходять debounce.

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

- `auto` керує типовим режимом автоматичного TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує ефективний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумовування.
- `modelOverrides` увімкнено за замовчуванням; `modelOverrides.allowProvider` за замовчуванням має значення `false` (опційне ввімкнення).
- API-ключі резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- Вбудовані мовні провайдери належать Plugin. Якщо задано `plugins.allow`, включіть кожен Plugin TTS-провайдера, який хочете використовувати, наприклад `microsoft` для Edge TTS. Застарілий id провайдера `edge` приймається як alias для `microsoft`.
- `providers.openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `providers.openai.baseUrl` вказує на endpoint, відмінний від OpenAI, OpenClaw трактує його як OpenAI-сумісний TTS-сервер і послаблює перевірку моделі/голосу.

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

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кілька Talk-провайдерів.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності й автоматично мігрують у `talk.providers.<provider>`.
- Ідентифікатори голосу резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки відкритим текстом або об’єкти SecretRef.
- Резервний варіант `ELEVENLABS_API_KEY` застосовується лише тоді, коли API-ключ Talk не налаштовано.
- `providers.*.voiceAliases` дає змогу директивам Talk використовувати дружні назви.
- `providers.mlx.modelId` вибирає репозиторій Hugging Face, який використовує локальний помічник macOS MLX. Якщо не задано, macOS використовує `mlx-community/Soprano-80M-bf16`.
- Відтворення MLX на macOS виконується через вбудований помічник `openclaw-mlx-tts`, якщо він присутній, або через виконуваний файл у `PATH`; `OPENCLAW_MLX_TTS_BIN` перевизначає шлях до помічника для розробки.
- `speechLocale` задає id локалі BCP 47, що використовується розпізнаванням мовлення Talk в iOS/macOS. Якщо не задано, використовується типова локаль пристрою.
- `silenceTimeoutMs` керує тим, як довго режим Talk чекає після мовчання користувача перед надсиланням транскрипту. Якщо не задано, зберігається типове вікно паузи платформи (`700 ms` на macOS і Android, `900 ms` на iOS).

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — усі інші ключі конфігурації
- [Конфігурація](/uk/gateway/configuration) — поширені завдання та швидке налаштування
- [Приклади конфігурації](/uk/gateway/configuration-examples)
