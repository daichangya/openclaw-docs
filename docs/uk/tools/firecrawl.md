---
read_when:
    - Ви хочете використовувати web extraction на базі Firecrawl
    - Вам потрібен API-ключ Firecrawl
    - Ви хочете використовувати Firecrawl як провайдера `web_search`
    - Ви хочете використовувати anti-bot extraction для `web_fetch`
summary: Firecrawl search, scrape і резервний варіант для web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T18:19:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw може використовувати **Firecrawl** трьома способами:

- як провайдера `web_search`
- як явні інструменти plugin-а: `firecrawl_search` і `firecrawl_scrape`
- як резервний екстрактор для `web_fetch`

Це хостинговий сервіс для extraction/search, який підтримує обхід бот-захисту та кешування,
що допомагає із сайтами з важким JS або сторінками, які блокують звичайні HTTP-fetch запити.

## Отримайте API-ключ

1. Створіть обліковий запис Firecrawl і згенеруйте API-ключ.
2. Збережіть його в config або встановіть `FIRECRAWL_API_KEY` у середовищі gateway.

## Налаштування Firecrawl search

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Примітки:

- Вибір Firecrawl в onboarding або через `openclaw configure --section web` автоматично вмикає вбудований plugin Firecrawl.
- `web_search` із Firecrawl підтримує `query` і `count`.
- Для специфічних для Firecrawl елементів керування, як-от `sources`, `categories` або scraping результатів, використовуйте `firecrawl_search`.
- Перевизначення `baseUrl` мають залишатися на `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` — це спільний резервний env для base URL Firecrawl search і scrape.

## Налаштування Firecrawl scrape + резервного варіанта для web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Примітки:

- Спроби використання резервного варіанта Firecrawl виконуються лише тоді, коли доступний API-ключ (`plugins.entries.firecrawl.config.webFetch.apiKey` або `FIRECRAWL_API_KEY`).
- `maxAgeMs` визначає, наскільки старими можуть бути кешовані результати (мс). Значення за замовчуванням — 2 дні.
- Застаріла конфігурація `tools.web.fetch.firecrawl.*` автоматично мігрується через `openclaw doctor --fix`.
- Перевизначення Firecrawl scrape/base URL обмежені `https://api.firecrawl.dev`.

`firecrawl_scrape` повторно використовує ті самі налаштування `plugins.entries.firecrawl.config.webFetch.*` і env-змінні.

## Інструменти plugin-а Firecrawl

### `firecrawl_search`

Використовуйте це, якщо вам потрібні специфічні для Firecrawl елементи керування пошуком замість загального `web_search`.

Основні параметри:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Використовуйте це для сторінок із важким JS або захистом від ботів, де звичайний `web_fetch` працює слабо.

Основні параметри:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / обхід бот-захисту

Firecrawl надає параметр **proxy mode** для обходу бот-захисту (`basic`, `stealth` або `auto`).
OpenClaw завжди використовує `proxy: "auto"` разом із `storeInCache: true` для запитів Firecrawl.
Якщо `proxy` пропущено, Firecrawl типово використовує `auto`. У режимі `auto` повторна спроба виконується з stealth proxy, якщо базова спроба не вдається, що може використовувати більше credit-ів,
ніж scraping лише в режимі basic.

## Як `web_fetch` використовує Firecrawl

Порядок extraction у `web_fetch`:

1. Readability (локально)
2. Firecrawl (якщо вибрано або автоматично визначено як активний резервний провайдер web-fetch)
3. Базове очищення HTML (останній резервний варіант)

Параметр вибору — `tools.web.fetch.provider`. Якщо його не вказати, OpenClaw
автоматично визначає перший готовий провайдер web-fetch з доступних облікових даних.
Наразі вбудований провайдер — Firecrawl.

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовизначення
- [Web Fetch](/tools/web-fetch) -- інструмент `web_fetch` із резервним варіантом Firecrawl
- [Tavily](/tools/tavily) -- інструменти search + extract
