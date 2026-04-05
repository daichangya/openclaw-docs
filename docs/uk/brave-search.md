---
read_when:
    - Ви хочете використовувати Brave Search для web_search
    - Вам потрібен `BRAVE_API_KEY` або відомості про тарифний план
summary: Налаштування Brave Search API для web_search
title: Brave Search (застарілий шлях)
x-i18n:
    generated_at: "2026-04-05T17:56:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw підтримує Brave Search API як провайдер `web_search`.

## Отримання API-ключа

1. Створіть обліковий запис Brave Search API на [https://brave.com/search/api/](https://brave.com/search/api/)
2. На панелі керування виберіть план **Search** і згенеруйте API-ключ.
3. Збережіть ключ у конфігурації або задайте `BRAVE_API_KEY` у середовищі Gateway.

## Приклад конфігурації

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Специфічні для провайдера налаштування пошуку Brave тепер розміщені в `plugins.entries.brave.config.webSearch.*`.
Застарілий `tools.web.search.apiKey` усе ще завантажується через шар сумісності, але більше не є канонічним шляхом конфігурації.

`webSearch.mode` керує транспортом Brave:

- `web` (типово): звичайний вебпошук Brave із заголовками, URL-адресами та фрагментами
- `llm-context`: Brave LLM Context API з попередньо витягнутими текстовими фрагментами та джерелами для обґрунтування

## Параметри інструмента

| Параметр      | Опис                                                                |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Пошуковий запит (обов’язково)                                       |
| `count`       | Кількість результатів для повернення (1-10, типово: 5)              |
| `country`     | 2-літерний код країни ISO (наприклад, "US", "DE")                   |
| `language`    | Код мови ISO 639-1 для результатів пошуку (наприклад, "en", "de", "fr") |
| `search_lang` | Код мови пошуку Brave (наприклад, `en`, `en-gb`, `zh-hans`)         |
| `ui_lang`     | Код мови ISO для елементів інтерфейсу                               |
| `freshness`   | Часовий фільтр: `day` (24 год), `week`, `month` або `year`          |
| `date_after`  | Лише результати, опубліковані після цієї дати (YYYY-MM-DD)          |
| `date_before` | Лише результати, опубліковані до цієї дати (YYYY-MM-DD)             |

**Приклади:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Примітки

- OpenClaw використовує тарифний план Brave **Search**. Якщо у вас є застаріла підписка (наприклад, початковий безкоштовний план із 2 000 запитів на місяць), вона залишається дійсною, але не включає новіші можливості, як-от LLM Context або вищі ліміти частоти.
- Кожен тарифний план Brave включає **\$5/місяць безкоштовного кредиту** (з поновленням). План Search коштує \$5 за 1 000 запитів, тому кредит покриває 1 000 запитів на місяць. Встановіть ліміт використання на панелі керування Brave, щоб уникнути неочікуваних витрат. Актуальні плани див. на [порталі Brave API](https://brave.com/search/api/).
- План Search включає кінцеву точку LLM Context і права на AI inference. Збереження результатів для навчання або налаштування моделей вимагає плану з явними правами на зберігання. Див. [Умови надання послуг](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Режим `llm-context` повертає обґрунтовані записи джерел замість звичайної форми фрагментів вебпошуку.
- Режим `llm-context` не підтримує `ui_lang`, `freshness`, `date_after` або `date_before`.
- `ui_lang` має містити підтеґ регіону, наприклад `en-US`.
- Результати типово кешуються на 15 хвилин (можна налаштувати через `cacheTtlMinutes`).

Див. [Вебінструменти](/tools/web) для повної конфігурації `web_search`.
