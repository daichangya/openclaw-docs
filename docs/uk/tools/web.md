---
read_when:
    - Ви хочете ввімкнути або налаштувати `web_search`
    - Ви хочете ввімкнути або налаштувати `x_search`
    - Вам потрібно вибрати провайдера пошуку
    - Ви хочете зрозуміти автовизначення та резервний вибір провайдера
sidebarTitle: Web Search
summary: '`web_search`, `x_search` і `web_fetch` — пошук у вебі, пошук дописів у X або отримання вмісту сторінки'
title: Web Search
x-i18n:
    generated_at: "2026-04-05T18:22:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8b9a5d641dcdcbe7c099c8862898f12646f43151b6c4152d69c26af9b17e0fa
    source_path: tools/web.md
    workflow: 15
---

# Web Search

Інструмент `web_search` виконує пошук у вебі за допомогою налаштованого провайдера й
повертає результати. Результати кешуються за запитом на 15 хвилин (можна налаштувати).

OpenClaw також містить `x_search` для дописів у X (раніше Twitter) і
`web_fetch` для полегшеного отримання URL. На цьому етапі `web_fetch` лишається
локальним, тоді як `web_search` і `x_search` можуть використовувати xAI Responses під капотом.

<Info>
  `web_search` — це легкий HTTP-інструмент, а не автоматизація браузера. Для
  сайтів із важким JS або входом у систему використовуйте [Web Browser](/tools/browser). Для
  отримання конкретного URL використовуйте [Web Fetch](/tools/web-fetch).
</Info>

## Швидкий старт

<Steps>
  <Step title="Виберіть провайдера">
    Виберіть провайдера й виконайте всі потрібні кроки налаштування. Деякі провайдери
    не потребують ключа, тоді як інші використовують API-ключі. Докладніше див. на сторінках провайдерів нижче.
  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    ```
    Це збереже провайдера й усі потрібні облікові дані. Ви також можете встановити env-
    змінну (наприклад `BRAVE_API_KEY`) і пропустити цей крок для провайдерів
    на основі API.
  </Step>
  <Step title="Використовуйте">
    Тепер агент може викликати `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Для дописів у X використовуйте:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Вибір провайдера

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tools/brave-search">
    Структуровані результати з фрагментами. Підтримує режим `llm-context`, фільтри країни/мови. Є безкоштовний тариф.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tools/duckduckgo-search">
    Резервний варіант без ключа. API-ключ не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/tools/exa-search">
    Нейронний + ключовий пошук із витягуванням вмісту (підсвічування, текст, підсумки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tools/firecrawl">
    Структуровані результати. Найкраще поєднується з `firecrawl_search` і `firecrawl_scrape` для глибокого витягування.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tools/gemini-search">
    Синтезовані ШІ відповіді з цитуванням через Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/tools/grok-search">
    Синтезовані ШІ відповіді з цитуванням через xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/tools/kimi-search">
    Синтезовані ШІ відповіді з цитуванням через Moonshot web search.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tools/minimax-search">
    Структуровані результати через API пошуку MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tools/ollama-search">
    Пошук без ключа через налаштований хост Ollama. Потрібен `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/tools/perplexity-search">
    Структуровані результати з керуванням витягуванням вмісту та фільтрацією доменів.
  </Card>
  <Card title="SearXNG" icon="server" href="/tools/searxng-search">
    Self-hosted метапошук. API-ключ не потрібен. Агрегує Google, Bing, DuckDuckGo тощо.
  </Card>
  <Card title="Tavily" icon="globe" href="/tools/tavily">
    Структуровані результати з глибиною пошуку, фільтрацією за темою та `tavily_extract` для витягування URL.
  </Card>
</CardGroup>

### Порівняння провайдерів

| Провайдер                                 | Стиль результатів          | Фільтри                                          | API-ключ                                                                         |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/tools/brave-search)              | Структуровані фрагменти    | Країна, мова, час, режим `llm-context`           | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/tools/duckduckgo-search)    | Структуровані фрагменти    | --                                               | Немає (без ключа)                                                                |
| [Exa](/tools/exa-search)                  | Структуровані + витягнуті  | Нейронний/ключовий режим, дата, витягування вмісту | `EXA_API_KEY`                                                                  |
| [Firecrawl](/tools/firecrawl)             | Структуровані фрагменти    | Через інструмент `firecrawl_search`              | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/tools/gemini-search)            | Синтезовані ШІ + цитування | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/tools/grok-search)                | Синтезовані ШІ + цитування | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/tools/kimi-search)                | Синтезовані ШІ + цитування | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/tools/minimax-search)   | Структуровані фрагменти    | Регіон (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/tools/ollama-search) | Структуровані фрагменти    | --                                               | Типово немає; потрібен `ollama signin`, можна повторно використовувати bearer auth провайдера Ollama |
| [Perplexity](/tools/perplexity-search)    | Структуровані фрагменти    | Країна, мова, час, домени, ліміти вмісту         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/tools/searxng-search)          | Структуровані фрагменти    | Категорії, мова                                  | Немає (self-hosted)                                                              |
| [Tavily](/tools/tavily)                   | Структуровані фрагменти    | Через інструмент `tavily_search`                 | `TAVILY_API_KEY`                                                                 |

## Автовизначення

## Нативний Codex web search

Моделі з підтримкою Codex можуть за потреби використовувати нативний інструмент Responses `web_search` від провайдера замість керованої функції `web_search` OpenClaw.

- Налаштовується в `tools.web.search.openaiCodex`
- Активується лише для моделей із підтримкою Codex (`openai-codex/*` або провайдерів, що використовують `api: "openai-codex-responses"`)
- Керований `web_search` і далі застосовується до моделей без підтримки Codex
- `mode: "cached"` — значення за замовчуванням і рекомендований варіант
- `tools.web.search.enabled: false` вимикає і керований, і нативний пошук

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Якщо нативний пошук Codex увімкнено, але поточна модель не підтримує Codex, OpenClaw зберігає звичайну поведінку керованого `web_search`.

## Налаштування web search

Списки провайдерів у документації та сценаріях налаштування подаються за абеткою. Автовизначення використовує окремий порядок пріоритету.

Якщо `provider` не задано, OpenClaw перевіряє провайдерів у такому порядку й використовує
першого, який готовий:

Спочатку провайдери на основі API:

1. **Brave** -- `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey` (порядок 20)
4. **Grok** -- `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey` (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)

Після цього резервні варіанти без ключа:

10. **DuckDuckGo** -- HTML-резервний варіант без ключа, без облікового запису чи API-ключа (порядок 100)
11. **Ollama Web Search** -- резервний варіант без ключа через налаштований хост Ollama; потрібна доступність Ollama і вхід через `ollama signin`, за потреби можна повторно використовувати bearer auth провайдера Ollama (порядок 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Якщо жодного провайдера не виявлено, використовується Brave як резервний варіант (ви отримаєте помилку про відсутній ключ
із підказкою налаштувати його).

<Note>
  Усі поля ключів провайдерів підтримують об’єкти SecretRef. У режимі автовизначення
  OpenClaw розв’язує лише ключ вибраного провайдера -- SecretRef невибраних
  провайдерів лишаються неактивними.
</Note>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Конфігурація для окремих провайдерів (API-ключі, base URL, режими) міститься в
`plugins.entries.<plugin>.config.webSearch.*`. Приклади див. на сторінках провайдерів.

Вибір резервного провайдера `web_fetch` виконується окремо:

- виберіть його через `tools.web.fetch.provider`
- або пропустіть це поле й дозвольте OpenClaw автоматично визначити першого готового провайдера `web-fetch` з доступних облікових даних
- наразі вбудованим провайдером `web-fetch` є Firecrawl, що налаштовується в
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон API Moonshot (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- стандартну модель Kimi для web-search (за замовчуванням `kimi-k2.5`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує
той самий резервний `XAI_API_KEY`, що й пошук Grok у вебі.
Застаріла конфігурація `tools.web.x_search.*` автоматично мігрується через `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`,
OpenClaw також може запропонувати необов’язкове налаштування `x_search` з тим самим ключем.
Це окремий додатковий крок усередині шляху Grok, а не окремий вибір провайдера
web-search верхнього рівня. Якщо ви виберете іншого провайдера, OpenClaw не
показуватиме запит для `x_search`.

### Зберігання API-ключів

<Tabs>
  <Tab title="Файл конфігурації">
    Виконайте `openclaw configure --section web` або задайте ключ безпосередньо:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Змінна середовища">
    Установіть env-змінну провайдера в середовищі процесу Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для інсталяції gateway додайте її до `~/.openclaw/.env`.
    Див. [Env vars](/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Параметр              | Опис                                                   |
| --------------------- | ------------------------------------------------------ |
| `query`               | Пошуковий запит (обов’язково)                          |
| `count`               | Результати для повернення (1-10, за замовчуванням: 5)  |
| `country`             | 2-літерний код країни ISO (наприклад "US", "DE")       |
| `language`            | Код мови ISO 639-1 (наприклад "en", "de")              |
| `search_lang`         | Код мови пошуку (лише Brave)                           |
| `freshness`           | Фільтр часу: `day`, `week`, `month` або `year`         |
| `date_after`          | Результати після цієї дати (YYYY-MM-DD)                |
| `date_before`         | Результати до цієї дати (YYYY-MM-DD)                   |
| `ui_lang`             | Код мови UI (лише Brave)                               |
| `domain_filter`       | Масив allowlist/denylist доменів (лише Perplexity)     |
| `max_tokens`          | Загальний бюджет вмісту, за замовчуванням 25000 (лише Perplexity) |
| `max_tokens_per_page` | Ліміт токенів на сторінку, за замовчуванням 2048 (лише Perplexity) |

<Warning>
  Не всі параметри працюють з усіма провайдерами. Режим Brave `llm-context`
  відхиляє `ui_lang`, `freshness`, `date_after` і `date_before`.
  Gemini, Grok і Kimi повертають одну синтезовану відповідь із цитуванням. Вони
  приймають `count` для сумісності спільного інструмента, але це не змінює
  форму grounded-відповіді.
  Perplexity поводиться так само, коли ви використовуєте шлях сумісності
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`).
  SearXNG приймає `http://` лише для довірених хостів приватної мережі або loopback;
  публічні кінцеві точки SearXNG мають використовувати `https://`.
  Firecrawl і Tavily підтримують через `web_search` лише `query` і `count`
  -- для розширених параметрів використовуйте їхні спеціалізовані інструменти.
</Warning>

## x_search

`x_search` виконує запити до дописів у X (раніше Twitter) через xAI та повертає
синтезовані ШІ відповіді з цитуванням. Він приймає запити природною мовою та
необов’язкові структуровані фільтри. OpenClaw вмикає вбудований інструмент xAI `x_search`
лише в запиті, який обслуговує цей виклик інструмента.

<Note>
  xAI документує `x_search` як інструмент, що підтримує пошук за ключовими словами, семантичний пошук, пошук користувачів
  і отримання тредів. Для статистики окремого допису, як-от reposts,
  replies, bookmarks або views, віддавайте перевагу цільовому запиту за точним URL допису
  або status ID. Широкі пошуки за ключовими словами можуть знайти потрібний допис, але повернути менш
  повні метадані для окремого допису. Хороший шаблон: спочатку знайти допис, а потім
  виконати другий запит `x_search`, зосереджений саме на цьому дописі.
</Note>

### Конфігурація x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### Параметри x_search

| Параметр                     | Опис                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Пошуковий запит (обов’язково)                          |
| `allowed_x_handles`          | Обмежити результати конкретними handle у X             |
| `excluded_x_handles`         | Виключити конкретні handle у X                         |
| `from_date`                  | Включати лише дописи в цю дату або пізніше (YYYY-MM-DD) |
| `to_date`                    | Включати лише дописи в цю дату або раніше (YYYY-MM-DD) |
| `enable_image_understanding` | Дозволити xAI аналізувати зображення, прикріплені до відповідних дописів |
| `enable_video_understanding` | Дозволити xAI аналізувати відео, прикріплене до відповідних дописів |

### Приклад x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Статистика окремого допису: за можливості використовуйте точний URL статусу або status ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Приклади

```javascript
// Базовий пошук
await web_search({ query: "OpenClaw plugin SDK" });

// Пошук із прив’язкою до Німеччини
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Нещодавні результати (за останній тиждень)
await web_search({ query: "AI developments", freshness: "week" });

// Діапазон дат
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Фільтрація доменів (лише Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Профілі інструментів

Якщо ви використовуєте профілі інструментів або allowlist, додайте `web_search`, `x_search` або `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Пов’язане

- [Web Fetch](/tools/web-fetch) -- отримання URL і витягування читабельного вмісту
- [Web Browser](/tools/browser) -- повна автоматизація браузера для сайтів із важким JS
- [Grok Search](/tools/grok-search) -- Grok як провайдер `web_search`
- [Ollama Web Search](/tools/ollama-search) -- вебпошук без ключа через ваш хост Ollama
