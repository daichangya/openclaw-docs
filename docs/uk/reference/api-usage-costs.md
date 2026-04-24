---
read_when:
    - Ви хочете зрозуміти, які функції можуть викликати платні API
    - Потрібно провести аудит ключів, витрат і видимості використання
    - Ви пояснюєте звітування про витрати у /status або /usage
summary: Аудит того, що може витрачати гроші, які ключі використовуються та як переглядати використання
title: Використання API та витрати
x-i18n:
    generated_at: "2026-04-24T03:19:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Використання API та витрати

Цей документ перелічує **функції, які можуть використовувати API-ключі**, і де відображаються їхні витрати. Він зосереджений на
функціях OpenClaw, які можуть генерувати використання провайдерів або платні виклики API.

## Де відображаються витрати (чат + CLI)

**Знімок вартості для сесії**

- `/status` показує поточну модель сесії, використання контексту та токени останньої відповіді.
- Якщо модель використовує **автентифікацію API-ключем**, `/status` також показує **орієнтовну вартість** останньої відповіді.
- Якщо live-метадані сесії обмежені, `/status` може відновити лічильники
  токенів/кешу та мітку активної моделі середовища виконання з останнього запису
  використання в transcript. Наявні ненульові live-значення все ще мають пріоритет, а
  підсумки transcript розміру prompt можуть перемагати, коли збережені підсумки відсутні або менші.

**Нижній колонтитул вартості для повідомлення**

- `/usage full` додає нижній колонтитул використання до кожної відповіді, зокрема **орієнтовну вартість** (лише для API-ключів).
- `/usage tokens` показує лише токени; потоки OAuth/token і CLI у стилі підписки приховують вартість у доларах.
- Примітка щодо Gemini CLI: коли CLI повертає вивід JSON, OpenClaw читає використання з
  `stats`, нормалізує `stats.cached` у `cacheRead` і виводить вхідні токени з
  `stats.input_tokens - stats.cached`, коли це потрібно.

Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволено, тому OpenClaw розглядає повторне використання Claude CLI і використання `claude -p` як
санкціоновані для цієї інтеграції, якщо Anthropic не опублікує нову політику.
Anthropic усе ще не надає оцінку вартості в доларах для окремого повідомлення, яку OpenClaw міг би
показати в `/usage full`.

**Вікна використання CLI (квоти провайдерів)**

- `openclaw status --usage` і `openclaw channels list` показують **вікна використання** провайдерів
  (знімки квот, а не вартість окремих повідомлень).
- Вивід для людини нормалізовано до `X% left` для всіх провайдерів.
- Поточні провайдери вікон використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi і z.ai.
- Примітка щодо MiniMax: його сирі поля `usage_percent` / `usagePercent` означають
  залишок квоти, тому OpenClaw інвертує їх перед відображенням. Поля на основі лічильників
  усе ще мають пріоритет, коли вони присутні. Якщо провайдер повертає `model_remains`, OpenClaw надає перевагу
  запису chat-model, за потреби виводить мітку вікна з часових міток і
  включає назву моделі до мітки плану.
- Автентифікація використання для цих вікон квот надходить із хуків, специфічних для провайдерів, коли вони доступні;
  інакше OpenClaw повертається до зіставлення облікових даних OAuth/API-ключа
  з профілів автентифікації, середовища або конфігурації.

Докладніше та приклади див. у [Використання токенів і витрати](/uk/reference/token-use).

## Як виявляються ключі

OpenClaw може знаходити облікові дані з:

- **Профілів автентифікації** (для кожного agent, зберігаються в `auth-profiles.json`).
- **Змінних середовища** (наприклад `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Конфігурації** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), які можуть експортувати ключі в env процесу skill.

## Функції, які можуть витрачати ключі

### 1) Відповіді основної моделі (чат + інструменти)

Кожна відповідь або виклик інструмента використовує **поточного провайдера моделі** (OpenAI, Anthropic тощо). Це
основне джерело використання й витрат.

Сюди також входять hosted-провайдери у стилі підписки, які все одно виставляють рахунки поза
локальним UI OpenClaw, такі як **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** і
шлях Claude-login OpenClaw від Anthropic з увімкненим **Extra Usage**.

Див. [Models](/uk/providers/models) для конфігурації ціноутворення та [Використання токенів і витрати](/uk/reference/token-use) для відображення.

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

Генерація зображень може виводити типового провайдера з auth-backed, коли
`agents.defaults.imageGenerationModel` не задано. Генерація відео наразі
потребує явного `agents.defaults.videoGenerationModel`, наприклад
`qwen/wan2.6-t2v`.

Див. [Генерація зображень](/uk/tools/image-generation), [Qwen Cloud](/uk/providers/qwen)
і [Models](/uk/concepts/models).

### 4) Embedding пам’яті + семантичний пошук

Семантичний пошук у пам’яті використовує **API embedding**, коли налаштовано віддалених провайдерів:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "lmstudio"` → embedding LM Studio (локально/self-hosted)
- `memorySearch.provider = "ollama"` → embedding Ollama (локально/self-hosted; зазвичай без оплати hosted API)
- Необов’язковий резервний перехід до віддаленого провайдера, якщо локальні embedding не працюють

Ви можете залишити все локально з `memorySearch.provider = "local"` (без використання API).

Див. [Memory](/uk/concepts/memory).

### 5) Інструмент вебпошуку

`web_search` може спричиняти оплату використання залежно від вашого провайдера:

- **Brave Search API**: `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: типово без ключа, але потребує доступного хоста Ollama плюс `ollama signin`; також може повторно використовувати звичайну bearer-автентифікацію провайдера Ollama, коли хост її потребує
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: резервний варіант без ключа (без оплати API, але неофіційний і на основі HTML)
- **SearXNG**: `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (без ключа/self-hosted; без оплати hosted API)

Застарілі шляхи провайдера `tools.web.search.*` усе ще завантажуються через тимчасовий compatibility shim, але це більше не рекомендована поверхня конфігурації.

**Безкоштовний кредит Brave Search:** Кожен тариф Brave включає поновлюваний
безкоштовний кредит на \$5/місяць. Тариф Search коштує \$5 за 1 000 запитів, тож кредит покриває
1 000 запитів/місяць без оплати. Встановіть свій ліміт використання на панелі Brave,
щоб уникнути неочікуваних витрат.

Див. [Web tools](/uk/tools/web).

### 5) Інструмент web fetch (Firecrawl)

`web_fetch` може викликати **Firecrawl**, якщо присутній API-ключ:

- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webFetch.apiKey`

Якщо Firecrawl не налаштовано, інструмент повертається до прямого fetch + readability (без платного API).

Див. [Web tools](/uk/tools/web).

### 6) Знімки використання провайдера (status/health)

Деякі команди status викликають **кінцеві точки використання провайдера**, щоб показати вікна квот або стан автентифікації.
Зазвичай це виклики з невеликим обсягом, але вони все одно звертаються до API провайдера:

- `openclaw status --usage`
- `openclaw models status --json`

Див. [Models CLI](/uk/cli/models).

### 7) Захисне підсумовування Compaction

Захисний механізм compaction може підсумовувати історію сесії за допомогою **поточної моделі**, що
викликає API провайдера під час виконання.

Див. [Керування сесіями + Compaction](/uk/reference/session-management-compaction).

### 8) Сканування / перевірка моделей

`openclaw models scan` може перевіряти моделі OpenRouter і використовує `OPENROUTER_API_KEY`, коли
перевірку увімкнено.

Див. [Models CLI](/uk/cli/models).

### 9) Talk (мовлення)

Режим Talk може викликати **ElevenLabs**, якщо його налаштовано:

- `ELEVENLABS_API_KEY` або `talk.providers.elevenlabs.apiKey`

Див. [Режим Talk](/uk/nodes/talk).

### 10) Skills (сторонні API)

Skills можуть зберігати `apiKey` у `skills.entries.<name>.apiKey`. Якщо skill використовує цей ключ для зовнішніх
API, це може спричиняти витрати згідно з провайдером цього skill.

Див. [Skills](/uk/tools/skills).

## Пов’язане

- [Використання токенів і витрати](/uk/reference/token-use)
- [Кешування prompt](/uk/reference/prompt-caching)
- [Відстеження використання](/uk/concepts/usage-tracking)
