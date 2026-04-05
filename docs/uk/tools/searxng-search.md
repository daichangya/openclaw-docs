---
read_when:
    - Ви хочете self-hosted провайдера вебпошуку
    - Ви хочете використовувати SearXNG для `web_search`
    - Вам потрібен варіант пошуку з фокусом на приватність або для air-gapped середовища
summary: Вебпошук SearXNG — self-hosted, key-free метапошуковий провайдер
title: Пошук SearXNG
x-i18n:
    generated_at: "2026-04-05T18:20:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# Пошук SearXNG

OpenClaw підтримує [SearXNG](https://docs.searxng.org/) як **self-hosted,
key-free** провайдера `web_search`. SearXNG — це open-source метапошуковий рушій,
який агрегує результати з Google, Bing, DuckDuckGo та інших джерел.

Переваги:

- **Безкоштовно й без обмежень** -- не потрібні API-ключ чи комерційна підписка
- **Приватність / air-gap** -- запити ніколи не залишають вашу мережу
- **Працює будь-де** -- немає регіональних обмежень комерційних API пошуку

## Налаштування

<Steps>
  <Step title="Запустіть екземпляр SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Або використайте будь-яке наявне розгортання SearXNG, до якого у вас є доступ. Див.
    [документацію SearXNG](https://docs.searxng.org/) щодо розгортання у production.

  </Step>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Або встановіть env var і дозвольте автовизначенню знайти його:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Налаштування на рівні plugin-а для екземпляра SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Поле `baseUrl` також приймає об’єкти SecretRef.

Правила транспорту:

- `https://` працює для публічних або приватних хостів SearXNG
- `http://` приймається лише для довірених хостів у приватній мережі або loopback
- публічні хости SearXNG мають використовувати `https://`

## Змінна середовища

Установіть `SEARXNG_BASE_URL` як альтернативу конфігурації:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Коли `SEARXNG_BASE_URL` задано й явного провайдера не налаштовано, автовизначення
автоматично вибирає SearXNG (з найнижчим пріоритетом -- будь-який провайдер на основі API з
ключем має вищий пріоритет).

## Довідник конфігурації plugin-а

| Поле        | Опис                                                               |
| ----------- | ------------------------------------------------------------------ |
| `baseUrl`   | Базовий URL вашого екземпляра SearXNG (обов’язково)                |
| `categories` | Категорії, розділені комами, наприклад `general`, `news` або `science` |
| `language`  | Код мови для результатів, наприклад `en`, `de` або `fr`            |

## Примітки

- **JSON API** -- використовує нативний endpoint SearXNG `format=json`, а не HTML scraping
- **Без API-ключа** -- працює з будь-яким екземпляром SearXNG одразу
- **Валідація базового URL** -- `baseUrl` має бути коректним URL `http://` або `https://`;
  публічні хости мають використовувати `https://`
- **Порядок автовизначення** -- SearXNG перевіряється останнім (order 200) в
  автовизначенні. Спочатку запускаються провайдери на основі API з налаштованими ключами, потім
  DuckDuckGo (order 100), потім Ollama Web Search (order 110)
- **Self-hosted** -- ви керуєте екземпляром, запитами й upstream-пошуковими рушіями
- **Categories** типово дорівнює `general`, якщо не налаштовано

<Tip>
  Щоб JSON API SearXNG працював, переконайтеся, що у вашому екземплярі SearXNG увімкнено формат `json`
  у `settings.yml` в розділі `search.formats`.
</Tip>

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовизначення
- [Пошук DuckDuckGo](/tools/duckduckgo-search) -- ще один key-free резервний варіант
- [Пошук Brave](/tools/brave-search) -- структуровані результати з безкоштовним тарифом
