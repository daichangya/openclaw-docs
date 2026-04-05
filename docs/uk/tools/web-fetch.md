---
read_when:
    - Ви хочете отримати URL і витягти читабельний вміст
    - Вам потрібно налаштувати web_fetch або його резервний варіант Firecrawl
    - Ви хочете зрозуміти обмеження та кешування web_fetch
sidebarTitle: Web Fetch
summary: Інструмент web_fetch -- HTTP-отримання з витягуванням читабельного вмісту
title: Web Fetch
x-i18n:
    generated_at: "2026-04-05T18:21:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Web Fetch

Інструмент `web_fetch` виконує звичайний HTTP GET і витягує читабельний вміст
(HTML у markdown або text). Він **не** виконує JavaScript.

Для сайтів із великою залежністю від JS або сторінок, захищених входом,
замість цього використовуйте
[Web Browser](/tools/browser).

## Швидкий старт

`web_fetch` **увімкнено типово** -- додаткова конфігурація не потрібна. Агент може
викликати його одразу:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Параметри інструмента

| Параметр     | Тип      | Опис                                     |
| ------------- | -------- | ---------------------------------------- |
| `url`         | `string` | URL для отримання (обов’язковий, лише http/https) |
| `extractMode` | `string` | `"markdown"` (типово) або `"text"`       |
| `maxChars`    | `number` | Обрізати вивід до цієї кількості символів       |

## Як це працює

<Steps>
  <Step title="Отримання">
    Надсилає HTTP GET із User-Agent, схожим на Chrome, і заголовком
    `Accept-Language`. Блокує приватні/внутрішні імена хостів і повторно перевіряє перенаправлення.
  </Step>
  <Step title="Витягування">
    Запускає Readability (витягування основного вмісту) для HTML-відповіді.
  </Step>
  <Step title="Резервний варіант (необов’язково)">
    Якщо Readability не спрацьовує і Firecrawl налаштовано, повторює спробу через
    API Firecrawl у режимі обходу бот-захисту.
  </Step>
  <Step title="Кеш">
    Результати кешуються на 15 хвилин (налаштовується), щоб зменшити повторні
    отримання того самого URL.
  </Step>
</Steps>

## Конфігурація

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // типово: true
        provider: "firecrawl", // необов’язково; не вказуйте для автовизначення
        maxChars: 50000, // максимальна кількість символів у виводі
        maxCharsCap: 50000, // жорстке обмеження для параметра maxChars
        maxResponseBytes: 2000000, // максимальний розмір завантаження до обрізання
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // використовувати витягування Readability
        userAgent: "Mozilla/5.0 ...", // перевизначити User-Agent
      },
    },
  },
}
```

## Резервний варіант Firecrawl

Якщо витягування через Readability не вдається, `web_fetch` може перейти на
[Firecrawl](/tools/firecrawl) для обходу бот-захисту й кращого витягування:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // необов’язково; не вказуйте для автовизначення з доступних облікових даних
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // необов’язково, якщо задано FIRECRAWL_API_KEY
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // тривалість кешу (1 день)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` підтримує об’єкти SecretRef.
Застаріла конфігурація `tools.web.fetch.firecrawl.*` автоматично мігрується через `openclaw doctor --fix`.

<Note>
  Якщо Firecrawl увімкнено, а його SecretRef не розв’язано й немає
  резервного env `FIRECRAWL_API_KEY`, запуск gateway завершується помилкою одразу.
</Note>

<Note>
  Перевизначення Firecrawl `baseUrl` жорстко обмежені: вони мають використовувати `https://` і
  офіційний хост Firecrawl (`api.firecrawl.dev`).
</Note>

Поточна поведінка під час виконання:

- `tools.web.fetch.provider` явно вибирає резервного провайдера отримання.
- Якщо `provider` не вказано, OpenClaw автоматично визначає першого готового провайдера web-fetch
  з доступних облікових даних. Наразі вбудований провайдер — Firecrawl.
- Якщо Readability вимкнено, `web_fetch` одразу переходить до вибраного
  резервного провайдера. Якщо жоден провайдер недоступний, він завершується з fail-closed.

## Обмеження та безпека

- `maxChars` обмежується значенням `tools.web.fetch.maxCharsCap`
- Тіло відповіді обмежується `maxResponseBytes` до розбору; надто великі
  відповіді обрізаються з попередженням
- Приватні/внутрішні імена хостів блокуються
- Перенаправлення перевіряються й обмежуються через `maxRedirects`
- `web_fetch` працює за принципом best-effort -- для деяких сайтів потрібен [Web Browser](/tools/browser)

## Профілі інструментів

Якщо ви використовуєте профілі інструментів або allowlist-и, додайте `web_fetch` або `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // або: allow: ["group:web"]  (включає web_fetch, web_search і x_search)
  },
}
```

## Пов’язане

- [Web Search](/tools/web) -- пошук в інтернеті через кількох провайдерів
- [Web Browser](/tools/browser) -- повна автоматизація браузера для сайтів із великою залежністю від JS
- [Firecrawl](/tools/firecrawl) -- інструменти Firecrawl для пошуку та скрапінгу
