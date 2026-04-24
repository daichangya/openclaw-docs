---
read_when:
    - Вам потрібно використовувати пошук Perplexity для вебпошуку
    - Вам потрібно налаштувати `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
summary: API пошуку Perplexity та сумісність Sonar/OpenRouter для `web_search`
title: Пошук Perplexity (застарілий шлях)
x-i18n:
    generated_at: "2026-04-24T04:15:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# API пошуку Perplexity

OpenClaw підтримує API пошуку Perplexity як provider для `web_search`.
Він повертає структуровані результати з полями `title`, `url` і `snippet`.

Для сумісності OpenClaw також підтримує застарілі налаштування Perplexity Sonar/OpenRouter.
Якщо ви використовуєте `OPENROUTER_API_KEY`, ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey` або задаєте `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, provider перемикається на шлях chat-completions і повертає згенеровані ШІ відповіді з цитуваннями замість структурованих результатів API пошуку.

## Отримання API-ключа Perplexity

1. Створіть обліковий запис Perplexity на [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Згенеруйте API-ключ у панелі керування
3. Збережіть ключ у конфігурації або задайте `PERPLEXITY_API_KEY` у середовищі Gateway.

## Сумісність з OpenRouter

Якщо ви вже використовували OpenRouter для Perplexity Sonar, залиште `provider: "perplexity"` і задайте `OPENROUTER_API_KEY` у середовищі Gateway або збережіть ключ `sk-or-...` у `plugins.entries.perplexity.config.webSearch.apiKey`.

Необов’язкові параметри сумісності:

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

### Сумісність з OpenRouter / Sonar

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

## Де задати ключ

**Через конфігурацію:** запустіть `openclaw configure --section web`. Це зберігає ключ у
`~/.openclaw/openclaw.json` у полі `plugins.entries.perplexity.config.webSearch.apiKey`.
Це поле також приймає об’єкти SecretRef.

**Через середовище:** задайте `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
у середовищі процесу Gateway. Для встановленого gateway додайте його в
`~/.openclaw/.env` (або у середовище вашого сервісу). Див. [Змінні середовища](/uk/help/faq#env-vars-and-env-loading).

Якщо налаштовано `provider: "perplexity"` і SecretRef ключа Perplexity не вдається розв’язати без резервного варіанта з env, запуск/перезавантаження аварійно завершуються одразу.

## Параметри інструмента

Ці параметри застосовуються до нативного шляху API пошуку Perplexity.

| Параметр              | Опис                                                   |
| --------------------- | ------------------------------------------------------ |
| `query`               | Пошуковий запит (обов’язково)                          |
| `count`               | Кількість результатів для повернення (1–10, типово: 5) |
| `country`             | 2-літерний код країни ISO (наприклад, `"US"`, `"DE"`)  |
| `language`            | Код мови ISO 639-1 (наприклад, `"en"`, `"de"`, `"fr"`) |
| `freshness`           | Фільтр часу: `day` (24 год), `week`, `month` або `year` |
| `date_after`          | Лише результати, опубліковані після цієї дати (YYYY-MM-DD) |
| `date_before`         | Лише результати, опубліковані до цієї дати (YYYY-MM-DD) |
| `domain_filter`       | Масив allowlist/denylist доменів (макс. 20)            |
| `max_tokens`          | Загальний бюджет вмісту (типово: 25000, макс.: 1000000) |
| `max_tokens_per_page` | Ліміт токенів на сторінку (типово: 2048)               |

Для застарілого шляху сумісності Sonar/OpenRouter:

- приймаються `query`, `count` і `freshness`
- `count` там потрібен лише для сумісності; відповідь усе одно буде одним синтезованим
  результатом із цитуваннями, а не списком із N результатів
- фільтри лише для Search API, такі як `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` і `max_tokens_per_page`,
  повертають явні помилки

**Приклади:**

```javascript
// Пошук для конкретної країни й мови
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

### Правила фільтра доменів

- Максимум 20 доменів на фільтр
- Не можна змішувати allowlist і denylist в одному запиті
- Для елементів denylist використовуйте префікс `-` (наприклад, `["-reddit.com"]`)

## Примітки

- API пошуку Perplexity повертає структуровані результати вебпошуку (`title`, `url`, `snippet`)
- OpenRouter або явне задання `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` перемикає Perplexity назад на chat completions Sonar для сумісності
- Сумісність Sonar/OpenRouter повертає одну синтезовану відповідь із цитуваннями, а не структуровані рядки результатів
- Результати типово кешуються на 15 хвилин (налаштовується через `cacheTtlMinutes`)

Повну конфігурацію `web_search` дивіться в [Веб-інструменти](/uk/tools/web).
Докладніше див. [документацію API пошуку Perplexity](https://docs.perplexity.ai/docs/search/quickstart).

## Пов’язане

- [Пошук Perplexity](/uk/tools/perplexity-search)
- [Вебпошук](/uk/tools/web)
