---
read_when:
    - Ви хочете увімкнути або налаштувати web_search
    - Ви хочете увімкнути або налаштувати x_search
    - Вам потрібно вибрати постачальника пошуку
    - Ви хочете зрозуміти авто-виявлення та резервне перемикання між постачальниками
sidebarTitle: Web Search
summary: web_search, x_search та web_fetch — пошук у вебі, пошук дописів у X або отримання вмісту сторінки
title: Вебпошук
x-i18n:
    generated_at: "2026-04-21T01:06:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e88a891ce28a5fe1baf4b9ce8565c59ba2d2695c63d77af232edd7f3fd2cd8a
    source_path: tools/web.md
    workflow: 15
---

# Вебпошук

Інструмент `web_search` виконує пошук у вебі за допомогою налаштованого вами постачальника та
повертає результати. Результати кешуються за запитом на 15 хвилин (це можна налаштувати).

OpenClaw також містить `x_search` для дописів у X (раніше Twitter) і
`web_fetch` для полегшеного отримання URL. На цьому етапі `web_fetch` лишається
локальним, тоді як `web_search` і `x_search` можуть використовувати xAI Responses під капотом.

<Info>
  `web_search` — це полегшений HTTP-інструмент, а не автоматизація браузера. Для
  сайтів із активним використанням JS або для входу в акаунт використовуйте [Web Browser](/uk/tools/browser). Для
  отримання конкретного URL використовуйте [Web Fetch](/uk/tools/web-fetch).
</Info>

## Швидкий старт

<Steps>
  <Step title="Виберіть постачальника">
    Виберіть постачальника та виконайте всі потрібні кроки налаштування. Деякі постачальники
    не потребують ключа, тоді як інші використовують API-ключі. Подробиці дивіться на сторінках постачальників нижче.
  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    ```
    Це збереже постачальника та всі потрібні облікові дані. Ви також можете встановити змінну середовища
    (наприклад, `BRAVE_API_KEY`) і пропустити цей крок для
    постачальників, що працюють через API.
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

## Вибір постачальника

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/uk/tools/brave-search">
    Структуровані результати зі сніпетами. Підтримує режим `llm-context`, фільтри країни/мови. Доступний безкоштовний тариф.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/uk/tools/duckduckgo-search">
    Резервний варіант без ключа. API-ключ не потрібен. Неофіційна інтеграція на основі HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/uk/tools/exa-search">
    Нейронний + ключовий пошук із витягуванням вмісту (підсвічування, текст, підсумки).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/uk/tools/firecrawl">
    Структуровані результати. Найкраще поєднується з `firecrawl_search` і `firecrawl_scrape` для глибокого витягування.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/uk/tools/gemini-search">
    Відповіді, синтезовані ШІ, із посиланнями через Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/uk/tools/grok-search">
    Відповіді, синтезовані ШІ, із посиланнями через xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/uk/tools/kimi-search">
    Відповіді, синтезовані ШІ, із посиланнями через вебпошук Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/uk/tools/minimax-search">
    Структуровані результати через API пошуку MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/uk/tools/ollama-search">
    Пошук без ключа через ваш налаштований хост Ollama. Потрібен `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/uk/tools/perplexity-search">
    Структуровані результати з керуванням витягуванням вмісту та фільтрацією доменів.
  </Card>
  <Card title="SearXNG" icon="server" href="/uk/tools/searxng-search">
    Самостійно розгорнутий метапошук. API-ключ не потрібен. Агрегує Google, Bing, DuckDuckGo та інші системи.
  </Card>
  <Card title="Tavily" icon="globe" href="/uk/tools/tavily">
    Структуровані результати з глибиною пошуку, фільтрацією за темою та `tavily_extract` для витягування URL.
  </Card>
</CardGroup>

### Порівняння постачальників

| Постачальник                              | Стиль результатів          | Фільтри                                          | API-ключ                                                                        |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/uk/tools/brave-search)              | Структуровані сніпети      | Країна, мова, час, режим `llm-context`           | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/uk/tools/duckduckgo-search)    | Структуровані сніпети      | --                                               | Немає (без ключа)                                                                |
| [Exa](/uk/tools/exa-search)                  | Структуровані + витягнуті  | Нейронний/ключовий режим, дата, витягування вмісту | `EXA_API_KEY`                                                                  |
| [Firecrawl](/uk/tools/firecrawl)             | Структуровані сніпети      | Через інструмент `firecrawl_search`              | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/uk/tools/gemini-search)            | Синтезовані ШІ + посилання | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/uk/tools/grok-search)                | Синтезовані ШІ + посилання | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/uk/tools/kimi-search)                | Синтезовані ШІ + посилання | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/uk/tools/minimax-search)   | Структуровані сніпети      | Регіон (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/uk/tools/ollama-search) | Структуровані сніпети      | --                                               | Немає за замовчуванням; потрібен `ollama signin`, можна повторно використати bearer auth постачальника Ollama |
| [Perplexity](/uk/tools/perplexity-search)    | Структуровані сніпети      | Країна, мова, час, домени, ліміти вмісту         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/uk/tools/searxng-search)          | Структуровані сніпети      | Категорії, мова                                  | Немає (самостійно розгорнутий)                                                   |
| [Tavily](/uk/tools/tavily)                   | Структуровані сніпети      | Через інструмент `tavily_search`                 | `TAVILY_API_KEY`                                                                 |

## Автовиявлення

## Власний вебпошук Codex

Моделі з підтримкою Codex за бажанням можуть використовувати власний інструмент Responses `web_search` постачальника замість керованої функції `web_search` OpenClaw.

- Налаштовується в `tools.web.search.openaiCodex`
- Активується лише для моделей із підтримкою Codex (`openai-codex/*` або постачальників, які використовують `api: "openai-codex-responses"`)
- Керований `web_search` і далі застосовується до моделей без підтримки Codex
- `mode: "cached"` — це стандартне та рекомендоване значення
- `tools.web.search.enabled: false` вимикає і керований, і власний пошук

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

Якщо власний пошук Codex увімкнено, але поточна модель не підтримує Codex, OpenClaw зберігає звичайну поведінку керованого `web_search`.

## Налаштування вебпошуку

Списки постачальників у документації та сценаріях налаштування впорядковано за абеткою. Автовиявлення використовує
окремий порядок пріоритету.

Якщо `provider` не задано, OpenClaw перевіряє постачальників у такому порядку й використовує
першого готового:

Спочатку постачальники з API:

1. **Brave** -- `BRAVE_API_KEY` або `plugins.entries.brave.config.webSearch.apiKey` (порядок 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` або `plugins.entries.minimax.config.webSearch.apiKey` (порядок 15)
3. **Gemini** -- `GEMINI_API_KEY` або `plugins.entries.google.config.webSearch.apiKey` (порядок 20)
4. **Grok** -- `XAI_API_KEY` або `plugins.entries.xai.config.webSearch.apiKey` (порядок 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` або `plugins.entries.moonshot.config.webSearch.apiKey` (порядок 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` або `plugins.entries.perplexity.config.webSearch.apiKey` (порядок 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` або `plugins.entries.firecrawl.config.webSearch.apiKey` (порядок 60)
8. **Exa** -- `EXA_API_KEY` або `plugins.entries.exa.config.webSearch.apiKey` (порядок 65)
9. **Tavily** -- `TAVILY_API_KEY` або `plugins.entries.tavily.config.webSearch.apiKey` (порядок 70)

Після цього — резервні варіанти без ключа:

10. **DuckDuckGo** -- HTML-резервний варіант без ключа, без акаунта чи API-ключа (порядок 100)
11. **Ollama Web Search** -- резервний варіант без ключа через ваш налаштований хост Ollama; вимагає, щоб Ollama був доступний і щоб ви виконали `ollama signin`, також може повторно використати bearer auth постачальника Ollama, якщо хост цього потребує (порядок 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl` (порядок 200)

Якщо не виявлено жодного постачальника, використовується Brave (ви отримаєте помилку
про відсутній ключ із підказкою налаштувати його).

<Note>
  Усі поля ключів постачальників підтримують об’єкти SecretRef. У режимі автовиявлення
  OpenClaw розв’язує лише ключ вибраного постачальника — SecretRef для невибраних
  постачальників лишаються неактивними.
</Note>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // типово: true
        provider: "brave", // або не вказуйте для автовиявлення
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Конфігурація, специфічна для постачальника (API-ключі, базові URL, режими), розміщується в
`plugins.entries.<plugin>.config.webSearch.*`. Приклади дивіться на сторінках постачальників.

Вибір резервного постачальника для `web_fetch` налаштовується окремо:

- виберіть його через `tools.web.fetch.provider`
- або не вказуйте це поле, і OpenClaw автоматично виявить першого готового постачальника
  `web_fetch` серед доступних облікових даних
- наразі вбудований постачальник `web_fetch` — це Firecrawl, налаштований у
  `plugins.entries.firecrawl.config.webFetch.*`

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон API Moonshot (`https://api.moonshot.ai/v1` або `https://api.moonshot.cn/v1`)
- типову модель Kimi для вебпошуку (типове значення — `kimi-k2.6`)

Для `x_search` налаштуйте `plugins.entries.xai.config.xSearch.*`. Він використовує
той самий резервний варіант `XAI_API_KEY`, що й вебпошук Grok.
Застарілу конфігурацію `tools.web.x_search.*` автоматично мігрує `openclaw doctor --fix`.
Коли ви вибираєте Grok під час `openclaw onboard` або `openclaw configure --section web`,
OpenClaw також може запропонувати необов’язкове налаштування `x_search` з тим самим ключем.
Це окремий наступний крок у межах сценарію Grok, а не окремий вибір постачальника
вебпошуку верхнього рівня. Якщо ви виберете іншого постачальника, OpenClaw не
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
    Установіть змінну середовища постачальника в середовищі процесу Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Для встановлення Gateway додайте її до `~/.openclaw/.env`.
    Див. [Змінні середовища](/uk/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Параметри інструмента

| Параметр              | Опис                                                          |
| --------------------- | ------------------------------------------------------------- |
| `query`               | Пошуковий запит (обов’язковий)                                |
| `count`               | Кількість результатів для повернення (1-10, типово: 5)        |
| `country`             | 2-літерний код країни ISO (наприклад, "US", "DE")             |
| `language`            | Код мови ISO 639-1 (наприклад, "en", "de")                    |
| `search_lang`         | Код мови пошуку (лише для Brave)                              |
| `freshness`           | Фільтр часу: `day`, `week`, `month` або `year`                |
| `date_after`          | Результати після цієї дати (YYYY-MM-DD)                       |
| `date_before`         | Результати до цієї дати (YYYY-MM-DD)                          |
| `ui_lang`             | Код мови інтерфейсу (лише для Brave)                          |
| `domain_filter`       | Масив дозволених/заборонених доменів (лише для Perplexity)    |
| `max_tokens`          | Загальний бюджет вмісту, типово 25000 (лише для Perplexity)   |
| `max_tokens_per_page` | Ліміт токенів на сторінку, типово 2048 (лише для Perplexity)  |

<Warning>
  Не всі параметри працюють з усіма постачальниками. Режим `llm-context` у Brave
  не приймає `ui_lang`, `freshness`, `date_after` і `date_before`.
  Gemini, Grok і Kimi повертають одну синтезовану ШІ відповідь із посиланнями. Вони
  приймають `count` для сумісності спільного інструмента, але це не змінює
  форму відповіді з grounding.
  Perplexity поводиться так само, коли ви використовуєте шлях сумісності
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` або `OPENROUTER_API_KEY`).
  SearXNG приймає `http://` лише для довірених хостів приватної мережі або local loopback;
  публічні кінцеві точки SearXNG мають використовувати `https://`.
  Firecrawl і Tavily через `web_search` підтримують лише `query` і `count`
  -- для розширених параметрів використовуйте їхні спеціалізовані інструменти.
</Warning>

## x_search

`x_search` виконує запити до дописів у X (раніше Twitter) за допомогою xAI і повертає
синтезовані ШІ відповіді з посиланнями. Він приймає запити природною мовою та
необов’язкові структуровані фільтри. OpenClaw вмикає вбудований інструмент xAI `x_search`
лише для запиту, який обслуговує цей виклик інструмента.

<Note>
  У документації xAI зазначено, що `x_search` підтримує пошук за ключовими словами, семантичний пошук, пошук користувачів
  і отримання тредів. Для статистики взаємодії окремого допису, як-от репости,
  відповіді, закладки або перегляди, краще використовувати цільовий пошук за точним URL допису
  або ID статусу. Широкі пошуки за ключовими словами можуть знайти потрібний допис, але повернути
  менш повні метадані для окремого допису. Хороший підхід такий: спочатку знайдіть допис, потім
  виконайте другий запит `x_search`, зосереджений саме на цьому дописі.
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

| Параметр                     | Опис                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| `query`                      | Пошуковий запит (обов’язковий)                               |
| `allowed_x_handles`          | Обмежити результати конкретними X-акаунтами                  |
| `excluded_x_handles`         | Виключити конкретні X-акаунти                                |
| `from_date`                  | Включати лише дописи на цю дату або пізніше (YYYY-MM-DD)     |
| `to_date`                    | Включати лише дописи на цю дату або раніше (YYYY-MM-DD)      |
| `enable_image_understanding` | Дозволити xAI аналізувати зображення, прикріплені до відповідних дописів |
| `enable_video_understanding` | Дозволити xAI аналізувати відео, прикріплені до відповідних дописів |

### Приклад x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Приклади

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Профілі інструментів

Якщо ви використовуєте профілі інструментів або списки дозволів, додайте `web_search`, `x_search` або `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Пов’язані матеріали

- [Web Fetch](/uk/tools/web-fetch) -- отримання URL і витягування придатного для читання вмісту
- [Web Browser](/uk/tools/browser) -- повна автоматизація браузера для сайтів із активним використанням JS
- [Grok Search](/uk/tools/grok-search) -- Grok як постачальник `web_search`
- [Ollama Web Search](/uk/tools/ollama-search) -- вебпошук без ключа через ваш хост Ollama
