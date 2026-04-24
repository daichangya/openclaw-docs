---
read_when:
    - Ви хочете використовувати Brave Search для web_search
    - Вам потрібен `BRAVE_API_KEY` або деталі тарифного плану
summary: Налаштування API Brave Search для web_search
title: Brave search (застарілий шлях)
x-i18n:
    generated_at: "2026-04-24T04:11:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# API Brave Search

OpenClaw підтримує API Brave Search як провайдера `web_search`.

## Отримайте API-ключ

1. Створіть обліковий запис API Brave Search на [https://brave.com/search/api/](https://brave.com/search/api/)
2. На панелі керування виберіть тарифний план **Search** і згенеруйте API-ключ.
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
            mode: "web", // або "llm-context"
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

Специфічні для провайдера параметри пошуку Brave тепер розміщено в `plugins.entries.brave.config.webSearch.*`.
Застарілий шлях `tools.web.search.apiKey` і далі завантажується через shim сумісності, але він більше не є канонічним шляхом конфігурації.

`webSearch.mode` керує транспортом Brave:

- `web` (типово): звичайний вебпошук Brave із заголовками, URL-адресами та фрагментами
- `llm-context`: API LLM Context від Brave із попередньо витягнутими текстовими фрагментами та джерелами для grounding

## Параметри інструмента

| Параметр     | Опис                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| `query`      | Пошуковий запит (обов’язково)                                           |
| `count`      | Кількість результатів для повернення (1-10, типово: 5)                  |
| `country`    | Дволітерний код країни ISO (наприклад, "US", "DE")                      |
| `language`   | Код мови ISO 639-1 для результатів пошуку (наприклад, "en", "de", "fr") |
| `search_lang` | Код мови пошуку Brave (наприклад, `en`, `en-gb`, `zh-hans`)            |
| `ui_lang`    | Код мови ISO для елементів інтерфейсу                                    |
| `freshness`  | Часовий фільтр: `day` (24h), `week`, `month` або `year`                 |
| `date_after` | Лише результати, опубліковані після цієї дати (YYYY-MM-DD)              |
| `date_before` | Лише результати, опубліковані до цієї дати (YYYY-MM-DD)                |

**Приклади:**

```javascript
// Пошук із прив’язкою до країни та мови
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
```

## Примітки

- OpenClaw використовує тарифний план Brave **Search**. Якщо у вас є застаріла підписка (наприклад, початковий безкоштовний план із 2 000 запитів на місяць), вона залишається чинною, але не включає новіші можливості, як-от LLM Context або вищі ліміти швидкості.
- Кожен тарифний план Brave включає **\$5/місяць безкоштовного кредиту** (з поновленням). План Search коштує \$5 за 1 000 запитів, тож кредит покриває 1 000 запитів на місяць. Встановіть ліміт використання на панелі керування Brave, щоб уникнути неочікуваних витрат. Актуальні плани дивіться на [порталі API Brave](https://brave.com/search/api/).
- План Search включає endpoint LLM Context і права на AI inference. Зберігання результатів для навчання або донавчання моделей потребує плану з явними правами на зберігання. Див. [Умови надання послуг](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Режим `llm-context` повертає grounded записи джерел замість звичайної форми фрагментів вебпошуку.
- Режим `llm-context` не підтримує `ui_lang`, `freshness`, `date_after` або `date_before`.
- `ui_lang` має містити підтег регіону, як-от `en-US`.
- Результати кешуються на 15 хвилин типово (можна налаштувати через `cacheTtlMinutes`).

Повну конфігурацію `web_search` див. у [Веб-інструменти](/uk/tools/web).

## Пов’язане

- [Brave search](/uk/tools/brave-search)
