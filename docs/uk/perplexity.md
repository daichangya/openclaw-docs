---
read_when:
    - Ви хочете використовувати пошук Perplexity для вебпошуку
    - Вам потрібно налаштувати `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
summary: API пошуку Perplexity та сумісність Sonar/OpenRouter для `web_search`
title: Пошук Perplexity (застарілий шлях)
x-i18n:
    generated_at: "2026-04-05T18:09:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba91e63e7412f3b6f889ee11f4a66563014932a1dc7be8593fe2262a4877b89b
    source_path: perplexity.md
    workflow: 15
---

# API пошуку Perplexity

OpenClaw підтримує API пошуку Perplexity як провайдера `web_search`.
Він повертає структуровані результати з полями `title`, `url` і `snippet`.

Для сумісності OpenClaw також підтримує застарілі конфігурації Perplexity Sonar/OpenRouter.
Якщо ви використовуєте `OPENROUTER_API_KEY`, ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey` або задаєте `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, провайдер перемикається на шлях chat-completions і повертає AI-синтезовані відповіді з цитуванням замість структурованих результатів API пошуку.

## Як отримати API ключ Perplexity

1. Створіть обліковий запис Perplexity на [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Згенеруйте API ключ у dashboard
3. Збережіть ключ у конфігурації або задайте `PERPLEXITY_API_KEY` у середовищі Gateway.

## Сумісність з OpenRouter

Якщо ви вже використовували OpenRouter для Perplexity Sonar, залиште `provider: "perplexity"` і задайте `OPENROUTER_API_KEY` у середовищі Gateway або збережіть ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey`.

Необов’язкові елементи керування сумісністю:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Приклади конфігурації

### Нативний API пошуку Perplexity

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
`~/.openclaw/openclaw.json` у полі `plugins.entries.perplexity.config.webSearch.apiKey`.
Це поле також приймає об’єкти SecretRef.

**Через середовище:** задайте `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
у середовищі процесу Gateway. Для інсталяції gateway додайте їх у
`~/.openclaw/.env` (або у середовище вашого сервісу). Див. [Env vars](/help/faq#env-vars-and-env-loading).

Якщо налаштовано `provider: "perplexity"` і SecretRef ключа Perplexity не розв’язується без fallback через env, startup/reload завершується помилкою одразу.

## Параметри інструмента

Ці параметри застосовуються до шляху нативного API пошуку Perplexity.

| Параметр              | Опис                                                     |
| --------------------- | -------------------------------------------------------- |
| `query`               | Пошуковий запит (обов’язково)                            |
| `count`               | Кількість результатів для повернення (1-10, типово: 5)   |
| `country`             | 2-літерний код країни ISO (наприклад, "US", "DE")        |
| `language`            | Код мови ISO 639-1 (наприклад, "en", "de", "fr")         |
| `freshness`           | Фільтр часу: `day` (24h), `week`, `month` або `year`     |
| `date_after`          | Лише результати, опубліковані після цієї дати (YYYY-MM-DD) |
| `date_before`         | Лише результати, опубліковані до цієї дати (YYYY-MM-DD)  |
| `domain_filter`       | Масив allowlist/denylist доменів (макс. 20)              |
| `max_tokens`          | Загальний бюджет контенту (типово: 25000, макс.: 1000000) |
| `max_tokens_per_page` | Ліміт токенів на сторінку (типово: 2048)                 |

Для застарілого шляху сумісності Sonar/OpenRouter:

- приймаються `query`, `count` і `freshness`
- `count` там потрібний лише для сумісності; відповідь усе одно залишається однією синтезованою
  відповіддю з цитуванням, а не списком із N результатів
- фільтри, доступні лише в Search API, як-от `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` і `max_tokens_per_page`,
  повертають явні помилки

**Приклади:**

```javascript
// Пошук для певної країни та мови
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Нещодавні результати (за минулий тиждень)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Пошук у діапазоні дат
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

// Більше витягування контенту
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Правила фільтрації доменів

- Максимум 20 доменів на один фільтр
- Не можна змішувати allowlist і denylist в одному запиті
- Використовуйте префікс `-` для елементів denylist (наприклад, `["-reddit.com"]`)

## Примітки

- API пошуку Perplexity повертає структуровані результати вебпошуку (`title`, `url`, `snippet`)
- OpenRouter або явні `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` перемикають Perplexity назад на Sonar chat completions для сумісності
- Сумісність Sonar/OpenRouter повертає одну синтезовану відповідь з цитуванням, а не структуровані рядки результатів
- Результати за замовчуванням кешуються на 15 хвилин (налаштовується через `cacheTtlMinutes`)

Див. [Web tools](/tools/web) для повної конфігурації `web_search`.
Див. [документацію API пошуку Perplexity](https://docs.perplexity.ai/docs/search/quickstart) для докладнішої інформації.
