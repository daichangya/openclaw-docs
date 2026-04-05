---
read_when:
    - Ви хочете використовувати Perplexity Search для вебпошуку
    - Вам потрібно налаштувати `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
summary: Сумісність Perplexity Search API і Sonar/OpenRouter для `web_search`
title: Perplexity Search
x-i18n:
    generated_at: "2026-04-05T18:20:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d97498e26e5570364e1486cb75584ed53b40a0091bf0210e1ea62f62d562ea
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw підтримує Perplexity Search API як провайдера `web_search`.
Він повертає структуровані результати з полями `title`, `url` і `snippet`.

Для сумісності OpenClaw також підтримує застарілі конфігурації Perplexity Sonar/OpenRouter.
Якщо ви використовуєте `OPENROUTER_API_KEY`, ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey` або задаєте `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, провайдер перемикається на шлях chat-completions і повертає синтезовані ШІ відповіді з цитуванням замість структурованих результатів Search API.

## Отримання API-ключа Perplexity

1. Створіть обліковий запис Perplexity на [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Згенеруйте API-ключ на панелі керування
3. Збережіть ключ у конфігурації або встановіть `PERPLEXITY_API_KEY` у середовищі Gateway.

## Сумісність з OpenRouter

Якщо ви вже використовували OpenRouter для Perplexity Sonar, залиште `provider: "perplexity"` і встановіть `OPENROUTER_API_KEY` у середовищі Gateway або збережіть ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey`.

Необов’язкові елементи керування сумісністю:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Приклади конфігурації

### Нативний Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Сумісність OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Де задавати ключ

**Через конфігурацію:** виконайте `openclaw configure --section web`. Ключ буде збережено в
`~/.openclaw/openclaw.json` у `plugins.entries.perplexity.config.webSearch.apiKey`.
Це поле також приймає об’єкти SecretRef.

**Через середовище:** встановіть `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
у середовищі процесу Gateway. Для інсталяції gateway додайте його до
`~/.openclaw/.env` (або до середовища вашого сервісу). Див. [Змінні середовища](/help/faq#env-vars-and-env-loading).

Якщо налаштовано `provider: "perplexity"` і SecretRef ключа Perplexity не вдалося розв’язати без резервного env-значення, запуск/перезавантаження одразу завершується помилкою.

## Параметри інструмента

Ці параметри застосовуються до нативного шляху Perplexity Search API.

| Параметр              | Опис                                                 |
| --------------------- | ---------------------------------------------------- |
| `query`               | Пошуковий запит (обов’язково)                        |
| `count`               | Кількість результатів для повернення (1-10, за замовчуванням: 5) |
| `country`             | 2-літерний код країни ISO (наприклад, "US", "DE")    |
| `language`            | Код мови ISO 639-1 (наприклад, "en", "de", "fr")     |
| `freshness`           | Фільтр часу: `day` (24h), `week`, `month` або `year` |
| `date_after`          | Лише результати, опубліковані після цієї дати (YYYY-MM-DD) |
| `date_before`         | Лише результати, опубліковані до цієї дати (YYYY-MM-DD) |
| `domain_filter`       | Масив allowlist/denylist доменів (максимум 20)       |
| `max_tokens`          | Загальний бюджет вмісту (за замовчуванням: 25000, максимум: 1000000) |
| `max_tokens_per_page` | Ліміт токенів на сторінку (за замовчуванням: 2048)   |

Для застарілого шляху сумісності Sonar/OpenRouter:

- приймаються `query`, `count` і `freshness`
- `count` там лише для сумісності; відповідь усе одно є однією синтезованою
  відповіддю з цитуванням, а не списком із N результатів
- фільтри, доступні лише в Search API, такі як `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` і `max_tokens_per_page`,
  повертають явні помилки

**Приклади:**

```javascript
// Пошук із прив’язкою до країни та мови
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Нещодавні результати (за останній тиждень)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Пошук за діапазоном дат
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Фільтрація доменів (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Фільтрація доменів (denylist — префікс -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Більше витягування вмісту
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Правила фільтра `domain_filter`

- Максимум 20 доменів у фільтрі
- Не можна змішувати allowlist і denylist в одному запиті
- Для записів denylist використовуйте префікс `-` (наприклад, `["-reddit.com"]`)

## Примітки

- Perplexity Search API повертає структуровані результати вебпошуку (`title`, `url`, `snippet`)
- OpenRouter або явне `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` перемикає Perplexity назад на Sonar chat completions для сумісності
- Сумісність Sonar/OpenRouter повертає одну синтезовану відповідь із цитуванням, а не структуровані рядки результатів
- Результати кешуються на 15 хвилин за замовчуванням (можна налаштувати через `cacheTtlMinutes`)

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовизначення
- [Документація Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) -- офіційна документація Perplexity
- [Brave Search](/tools/brave-search) -- структуровані результати з фільтрами країни/мови
- [Exa Search](/tools/exa-search) -- нейронний пошук із витягуванням вмісту
