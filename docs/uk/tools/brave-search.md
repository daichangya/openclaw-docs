---
read_when:
    - Ви хочете використовувати Brave Search для `web_search`
    - Вам потрібен `BRAVE_API_KEY` або відомості про тарифний план
summary: Налаштування Brave Search API для `web_search`
title: Brave Search
x-i18n:
    generated_at: "2026-04-05T18:18:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc026a69addf74375a0e407805b875ff527c77eb7298b2f5bb0e165197f77c0c
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw підтримує Brave Search API як провайдера `web_search`.

## Отримання API-ключа

1. Створіть обліковий запис Brave Search API на [https://brave.com/search/api/](https://brave.com/search/api/)
2. На панелі керування виберіть план **Search** і згенеруйте API-ключ.
3. Збережіть ключ у конфігурації або встановіть `BRAVE_API_KEY` у середовищі Gateway.

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

Специфічні для провайдера налаштування пошуку Brave тепер розташовані в `plugins.entries.brave.config.webSearch.*`.
Застарілий `tools.web.search.apiKey` усе ще завантажується через шар сумісності, але більше не є канонічним шляхом конфігурації.

`webSearch.mode` керує транспортом Brave:

- `web` (за замовчуванням): звичайний вебпошук Brave із заголовками, URL-адресами та фрагментами
- `llm-context`: API Brave LLM Context із попередньо витягнутими текстовими фрагментами та джерелами для обґрунтування

## Параметри інструмента

| Параметр      | Опис                                                                |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Пошуковий запит (обов’язково)                                       |
| `count`       | Кількість результатів для повернення (1-10, за замовчуванням: 5)    |
| `country`     | 2-літерний код країни ISO (наприклад, "US", "DE")                   |
| `language`    | Код мови ISO 639-1 для результатів пошуку (наприклад, "en", "de", "fr") |
| `search_lang` | Код мови пошуку Brave (наприклад, `en`, `en-gb`, `zh-hans`)         |
| `ui_lang`     | Код мови ISO для елементів інтерфейсу                               |
| `freshness`   | Фільтр часу: `day` (24h), `week`, `month` або `year`                |
| `date_after`  | Лише результати, опубліковані після цієї дати (YYYY-MM-DD)          |
| `date_before` | Лише результати, опубліковані до цієї дати (YYYY-MM-DD)             |

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
```

## Примітки

- OpenClaw використовує план Brave **Search**. Якщо у вас є застаріла підписка (наприклад, оригінальний план Free із 2 000 запитів на місяць), вона залишається чинною, але не включає новіші можливості, як-от LLM Context або вищі ліміти швидкості.
- Кожен план Brave включає **\$5/місяць безкоштовного кредиту** (з поновленням). План Search коштує \$5 за 1 000 запитів, тому кредит покриває 1 000 запитів на місяць. Установіть свій ліміт використання на панелі керування Brave, щоб уникнути неочікуваних витрат. Актуальні плани див. на [порталі Brave API](https://brave.com/search/api/).
- План Search включає кінцеву точку LLM Context і права на AI inference. Збереження результатів для навчання або налаштування моделей потребує плану з явними правами на збереження. Див. [Умови надання послуг](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Режим `llm-context` повертає обґрунтовані записи джерел замість звичайної форми фрагментів вебпошуку.
- Режим `llm-context` не підтримує `ui_lang`, `freshness`, `date_after` або `date_before`.
- `ui_lang` має містити регіональний підтег, наприклад `en-US`.
- Результати кешуються на 15 хвилин за замовчуванням (можна налаштувати через `cacheTtlMinutes`).

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовизначення
- [Perplexity Search](/tools/perplexity-search) -- структуровані результати з фільтрацією доменів
- [Exa Search](/tools/exa-search) -- нейронний пошук із витягуванням вмісту
