---
read_when:
    - Ви хочете зрозуміти, які функції можуть викликати платні API
    - Вам потрібно перевірити ключі, витрати та видимість використання
    - Ви пояснюєте звітність про витрати у /status або /usage
summary: Перевірте, що може витрачати гроші, які ключі використовуються та як переглянути використання
title: Використання API та витрати
x-i18n:
    generated_at: "2026-04-24T20:38:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Використання API та витрати

У цьому документі перелічено **функції, які можуть викликати API-ключі**, і де відображаються їхні витрати. Він зосереджений на
функціях OpenClaw, які можуть генерувати використання провайдера або платні виклики API.

## Де відображаються витрати (чат + CLI)

**Знімок витрат за сесію**

- `/status` показує поточну модель сесії, використання контексту та токени останньої відповіді.
- Якщо модель використовує **автентифікацію API-ключем**, `/status` також показує **орієнтовну вартість** останньої відповіді.
- Якщо метадані live-сесії неповні, `/status` може відновити лічильники токенів/кешу
  та мітку активної runtime-моделі з останнього запису використання в транскрипті.
  Наявні ненульові live-значення все одно мають пріоритет, а підсумки транскрипту
  розміру prompt можуть мати перевагу, коли збережені підсумки відсутні або менші.

**Нижній колонтитул витрат для кожного повідомлення**

- `/usage full` додає нижній колонтитул використання до кожної відповіді, включно з **орієнтовною вартістю** (лише для API-ключа).
- `/usage tokens` показує лише токени; OAuth/token-потоки у стилі підписки та CLI-потоки приховують вартість у доларах.
- Примітка Gemini CLI: коли CLI повертає JSON-вивід, OpenClaw зчитує використання з
  `stats`, нормалізує `stats.cached` у `cacheRead` і за потреби виводить вхідні токени
  з `stats.input_tokens - stats.cached`.

Примітка Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI
у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI
та використання `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
Anthropic усе ще не надає оцінку вартості в доларах для кожного повідомлення, яку OpenClaw міг би
показувати в `/usage full`.

**Вікна використання CLI (квоти провайдера)**

- `openclaw status --usage` і `openclaw channels list` показують **вікна використання**
  провайдера (знімки квот, а не витрати на кожне повідомлення).
- Зрозумілий для людини вивід нормалізується до `X% left` для всіх провайдерів.
- Поточні провайдери з вікнами використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi та z.ai.
- Примітка MiniMax: його сирі поля `usage_percent` / `usagePercent` означають квоту, що
  залишилася, тому OpenClaw інвертує їх перед відображенням. Поля на основі лічильників
  усе одно мають пріоритет, якщо вони присутні. Якщо провайдер повертає `model_remains`,
  OpenClaw надає перевагу запису chat-моделі, за потреби виводить мітку вікна з часових міток
  і включає назву моделі до мітки плану.
- Автентифікація використання для цих вікон квот надходить із provider-specific hooks, коли вони
  доступні; інакше OpenClaw повертається до відповідних OAuth/API-key
  облікових даних з auth profiles, змінних середовища або config.

Див. [Використання токенів і витрати](/uk/reference/token-use) для подробиць і прикладів.

## Як виявляються ключі

OpenClaw може підхоплювати облікові дані з:

- **Профілів автентифікації** (для кожного агента, зберігаються в `auth-profiles.json`).
- **Змінних середовища** (наприклад, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), які можуть експортувати ключі до env процесу skill.

## Функції, які можуть витрачати ключі

### 1) Відповіді основної моделі (чат + інструменти)

Кожна відповідь або виклик інструмента використовує **поточного провайдера моделі** (OpenAI, Anthropic тощо). Це
основне джерело використання та витрат.

Сюди також входять хостингові провайдери у стилі підписки, які все одно виставляють рахунки поза
локальним UI OpenClaw, такі як **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** та
шлях входу Anthropic OpenClaw Claude з увімкненим **Extra Usage**.

Див. [Моделі](/uk/providers/models) для config ціноутворення та [Використання токенів і витрати](/uk/reference/token-use) для відображення.

### 2) Розуміння медіа (аудіо/зображення/відео)

Вхідні медіа можуть бути підсумовані/транскрибовані до виконання відповіді. Для цього використовуються API моделі/провайдера.

- Аудіо: OpenAI / Groq / Deepgram / Google / Mistral.
- Зображення: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Відео: Google / Qwen / Moonshot.

Див. [Розуміння медіа](/uk/nodes/media-understanding).

### 3) Генерація зображень і відео

Спільні можливості генерації також можуть витрачати ключі провайдера:

- Генерація зображень: OpenAI / Google / fal / MiniMax
- Генерація відео: Qwen

Генерація зображень може виводити auth-backed provider за замовчуванням, якщо
`agents.defaults.imageGenerationModel` не задано. Генерація відео наразі
вимагає явного `agents.defaults.videoGenerationModel`, наприклад
`qwen/wan2.6-t2v`.

Див. [Генерація зображень](/uk/tools/image-generation), [Qwen Cloud](/uk/providers/qwen)
та [Моделі](/uk/concepts/models).

### 4) Ембедінги пам’яті + семантичний пошук

Семантичний пошук у пам’яті використовує **API ембедінгів**, коли налаштований для віддалених провайдерів:

- `memorySearch.provider = "openai"` → ембедінги OpenAI
- `memorySearch.provider = "gemini"` → ембедінги Gemini
- `memorySearch.provider = "voyage"` → ембедінги Voyage
- `memorySearch.provider = "mistral"` → ембедінги Mistral
- `memorySearch.provider = "lmstudio"` → ембедінги LM Studio (локально/self-hosted)
- `memorySearch.provider = "ollama"` → ембедінги Ollama (локально/self-hosted; зазвичай без тарифікації hosted API)
- Необов’язковий fallback до віддаленого провайдера, якщо локальні ембедінги не працюють

Ви можете залишити це локальним за допомогою `memorySearch.provider = "local"` (без використання API).

Див. [Пам’ять](/uk/concepts/memory).

### 5) Інструмент вебпошуку

`web_search` може спричиняти плату за використання залежно від вашого провайдера:

- **Brave Search API**: `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: за замовчуванням без ключа, але потребує доступного хоста Ollama плюс `ollama signin`; також може повторно використовувати звичайну bearer-автентифікацію провайдера Ollama, якщо хост її вимагає
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback без ключа (без тарифікації API, але неофіційний і на основі HTML)
- **SearXNG**: `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/self-hosted; без тарифікації hosted API)

Застарілі шляхи провайдера `tools.web.search.*` усе ще завантажуються через тимчасовий shim сумісності, але вони більше не є рекомендованою поверхнею config.

**Безплатний кредит Brave Search:** кожен тарифний план Brave включає кредит
\$5/місяць, який поновлюється. Тариф Search коштує \$5 за 1 000 запитів, тож кредит покриває
1 000 запитів/місяць без оплати. Установіть ліміт використання в панелі керування Brave,
щоб уникнути неочікуваних витрат.

Див. [Вебінструменти](/uk/tools/web).

### 5) Інструмент отримання вебсторінок (Firecrawl)

`web_fetch` може викликати **Firecrawl**, якщо присутній API-ключ:

- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webFetch.apiKey`

Якщо Firecrawl не налаштований, інструмент повертається до прямого fetch разом із вбудованим plugin `web-readability` (без платного API). Вимкніть `plugins.entries.web-readability.enabled`, щоб пропустити локальне вилучення Readability.

Див. [Вебінструменти](/uk/tools/web).

### 6) Знімки використання провайдера (status/health)

Деякі команди status викликають **ендпоїнти використання провайдера**, щоб показати вікна квот або стан автентифікації.
Зазвичай це виклики з невеликим обсягом, але вони все одно звертаються до API провайдера:

- `openclaw status --usage`
- `openclaw models status --json`

Див. [CLI моделей](/uk/cli/models).

### 7) Захисне підсумовування Compaction

Захисний механізм Compaction може підсумовувати історію сесії за допомогою **поточної моделі**, що
викликає API провайдера під час виконання.

Див. [Керування сесією + Compaction](/uk/reference/session-management-compaction).

### 8) Сканування / probe моделей

`openclaw models scan` може виконувати probe моделей OpenRouter і використовує `OPENROUTER_API_KEY`, коли
probe увімкнено.

Див. [CLI моделей](/uk/cli/models).

### 9) Talk (мовлення)

Режим Talk може викликати **ElevenLabs**, якщо налаштований:

- `ELEVENLABS_API_KEY` або `talk.providers.elevenlabs.apiKey`

Див. [Режим Talk](/uk/nodes/talk).

### 10) Skills (сторонні API)

Skills можуть зберігати `apiKey` у `skills.entries.<name>.apiKey`. Якщо skill використовує цей ключ для зовнішніх
API, це може спричиняти витрати відповідно до провайдера цього skill.

Див. [Skills](/uk/tools/skills).

## Пов’язане

- [Використання токенів і витрати](/uk/reference/token-use)
- [Кешування prompt](/uk/reference/prompt-caching)
- [Відстеження використання](/uk/concepts/usage-tracking)
