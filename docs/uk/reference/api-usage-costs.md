---
read_when:
    - Ви хочете зрозуміти, які функції можуть викликати платні API
    - Вам потрібно перевірити ключі, витрати та видимість використання
    - Ви пояснюєте звітування про витрати в /status або /usage
summary: Аудит того, що може витрачати гроші, які ключі використовуються та як переглядати використання
title: Використання API та витрати
x-i18n:
    generated_at: "2026-04-05T18:15:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71789950fe54dcdcd3e34c8ad6e3143f749cdfff5bbc2f14be4b85aaa467b14c
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Використання API та витрати

У цьому документі перелічено **функції, які можуть викликати API-ключі**, і де відображаються їхні витрати. Він зосереджений на
функціях OpenClaw, які можуть генерувати використання провайдера або платні виклики API.

## Де відображаються витрати (чат + CLI)

**Знімок вартості для сесії**

- `/status` показує поточну модель сесії, використання контексту та токени останньої відповіді.
- Якщо модель використовує **автентифікацію через API-ключ**, `/status` також показує **орієнтовну вартість** останньої відповіді.
- Якщо метаданих живої сесії недостатньо, `/status` може відновити лічильники
  токенів/кешу та мітку активної runtime-моделі з останнього запису використання в транскрипті.
  Наявні ненульові live-значення все одно мають пріоритет, а загальні значення транскрипту
  розміру prompt можуть перемагати, коли збережених загальних значень немає або вони менші.

**Футер витрат для повідомлення**

- `/usage full` додає футер використання до кожної відповіді, зокрема **орієнтовну вартість** (лише для API-ключа).
- `/usage tokens` показує лише токени; OAuth/token у стилі підписки та потоки CLI приховують грошову вартість.
- Примітка щодо Gemini CLI: коли CLI повертає JSON-вивід, OpenClaw зчитує використання з
  `stats`, нормалізує `stats.cached` у `cacheRead` і за потреби виводить вхідні токени
  з `stats.input_tokens - stats.cached`.

Примітка щодо Anthropic: у публічній документації Claude Code від Anthropic усе ще зазначено, що пряме використання Claude
Code у терміналі входить до лімітів планів Claude. Окремо Anthropic повідомила користувачам OpenClaw, що починаючи з **4 квітня 2026 року о 12:00 PT / 20:00 BST**, шлях входу Claude через **OpenClaw** вважається використанням через сторонню оболонку і
вимагає **Extra Usage**, що оплачується окремо від підписки. Anthropic
не надає оцінку вартості за повідомлення, яку OpenClaw міг би показувати в
`/usage full`.

**Вікна використання CLI (квоти провайдерів)**

- `openclaw status --usage` і `openclaw channels list` показують **вікна використання**
  провайдерів (знімки квот, а не витрати за повідомлення).
- Вивід для людини нормалізовано до формату `X% left` для всіх провайдерів.
- Поточні провайдери з вікнами використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi і z.ai.
- Примітка щодо MiniMax: його сирі поля `usage_percent` / `usagePercent` означають залишок
  квоти, тому OpenClaw інвертує їх перед відображенням. Поля на основі підрахунків усе одно мають пріоритет,
  якщо вони є. Якщо провайдер повертає `model_remains`, OpenClaw віддає перевагу запису chat-моделі,
  за потреби виводить мітку вікна з часових міток і включає назву моделі в мітку плану.
- Автентифікація для цих вікон квот надходить із хуків, специфічних для провайдера, коли вони доступні;
  інакше OpenClaw використовує резервний варіант із відповідними OAuth/API-ключами
  з auth profiles, env або config.

Докладніше та приклади див. у [Використання токенів і витрати](/reference/token-use).

## Як виявляються ключі

OpenClaw може підхоплювати облікові дані з:

- **Auth profiles** (для кожного агента, зберігаються в `auth-profiles.json`).
- **Змінних середовища** (наприклад, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), які можуть експортувати ключі в env процесу Skill.

## Функції, які можуть витрачати ключі

### 1) Відповіді основної моделі (чат + інструменти)

Кожна відповідь або виклик інструмента використовує **поточного провайдера моделі** (OpenAI, Anthropic тощо). Це
основне джерело використання та витрат.

Сюди також входять розміщені провайдери у стилі підписки, які все одно виставляють рахунки поза
локальним UI OpenClaw, як-от **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** і
шлях входу Claude в Anthropic через OpenClaw з увімкненим **Extra Usage**.

Щодо конфігурації цін див. [Моделі](/providers/models), а щодо відображення — [Використання токенів і витрати](/reference/token-use).

### 2) Розуміння медіа (аудіо/зображення/відео)

Вхідні медіа можуть бути підсумовані/транскрибовані до запуску відповіді. Для цього використовуються API моделей/провайдерів.

- Аудіо: OpenAI / Groq / Deepgram / Google / Mistral.
- Зображення: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Відео: Google / Qwen / Moonshot.

Див. [Розуміння медіа](/uk/nodes/media-understanding).

### 3) Генерація зображень і відео

Спільні можливості генерації також можуть витрачати ключі провайдерів:

- Генерація зображень: OpenAI / Google / fal / MiniMax
- Генерація відео: Qwen

Генерація зображень може виводити типового провайдера з автентифікацією, якщо
`agents.defaults.imageGenerationModel` не задано. Для генерації відео наразі
потрібна явна `agents.defaults.videoGenerationModel`, наприклад
`qwen/wan2.6-t2v`.

Див. [Генерація зображень](/tools/image-generation), [Qwen Cloud](/providers/qwen)
і [Моделі](/uk/concepts/models).

### 4) Memory embeddings + семантичний пошук

Семантичний пошук у пам’яті використовує **API embedding'ів**, коли налаштовано віддалених провайдерів:

- `memorySearch.provider = "openai"` → embedding'и OpenAI
- `memorySearch.provider = "gemini"` → embedding'и Gemini
- `memorySearch.provider = "voyage"` → embedding'и Voyage
- `memorySearch.provider = "mistral"` → embedding'и Mistral
- `memorySearch.provider = "ollama"` → embedding'и Ollama (локальні/self-hosted; зазвичай без тарифікації hosted API)
- Необов’язковий fallback на віддаленого провайдера, якщо локальні embedding'и не спрацюють

Ви можете залишити все локально з `memorySearch.provider = "local"` (без використання API).

Див. [Пам’ять](/uk/concepts/memory).

### 5) Інструмент web search

`web_search` може спричиняти витрати залежно від вашого провайдера:

- **Brave Search API**: `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: типово без ключа, але потребує доступного хоста Ollama плюс `ollama signin`; також може повторно використовувати звичайну Bearer-автентифікацію провайдера Ollama, коли хост цього вимагає
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback без ключа (без тарифікації API, але неофіційний і на основі HTML)
- **SearXNG**: `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/self-hosted; без тарифікації hosted API)

Застарілі шляхи провайдера `tools.web.search.*` усе ще завантажуються через тимчасовий compatibility shim, але вони більше не є рекомендованою поверхнею конфігурації.

**Безкоштовний кредит Brave Search:** Кожен план Brave включає поновлюваний
безкоштовний кредит \$5/місяць. План Search коштує \$5 за 1 000 запитів, тож кредит покриває
1 000 запитів/місяць без оплати. Установіть ліміт використання в панелі Brave,
щоб уникнути неочікуваних витрат.

Див. [Веб-інструменти](/tools/web).

### 5) Інструмент web fetch (Firecrawl)

`web_fetch` може викликати **Firecrawl**, якщо наявний API-ключ:

- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webFetch.apiKey`

Якщо Firecrawl не налаштовано, інструмент використовує fallback на прямий fetch + readability (без платного API).

Див. [Веб-інструменти](/tools/web).

### 6) Знімки використання провайдера (status/health)

Деякі команди status викликають **endpoint'и використання провайдера**, щоб показати вікна квот або стан автентифікації.
Зазвичай це виклики невеликого обсягу, але вони все одно звертаються до API провайдерів:

- `openclaw status --usage`
- `openclaw models status --json`

Див. [CLI моделей](/cli/models).

### 7) Підсумовування для safeguard компактизації

Safeguard компактизації може підсумовувати історію сесії за допомогою **поточної моделі**, що
викликає API провайдера під час виконання.

Див. [Керування сесіями + компактизація](/reference/session-management-compaction).

### 8) Сканування / probe моделей

`openclaw models scan` може виконувати probe моделей OpenRouter і використовує `OPENROUTER_API_KEY`, коли
probe увімкнено.

Див. [CLI моделей](/cli/models).

### 9) Talk (мовлення)

Режим Talk може викликати **ElevenLabs**, якщо налаштовано:

- `ELEVENLABS_API_KEY` або `talk.providers.elevenlabs.apiKey`

Див. [Режим Talk](/uk/nodes/talk).

### 10) Skills (сторонні API)

Skills можуть зберігати `apiKey` у `skills.entries.<name>.apiKey`. Якщо Skill використовує цей ключ для зовнішніх
API, це може спричиняти витрати відповідно до провайдера цього Skill.

Див. [Skills](/tools/skills).
