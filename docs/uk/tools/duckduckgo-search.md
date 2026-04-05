---
read_when:
    - Ви хочете провайдера веб-пошуку, якому не потрібен API-ключ
    - Ви хочете використовувати DuckDuckGo для web_search
    - Вам потрібен резервний пошук без налаштування
summary: Веб-пошук DuckDuckGo -- резервний провайдер без ключа (експериментальний, на основі HTML)
title: Пошук DuckDuckGo
x-i18n:
    generated_at: "2026-04-05T18:19:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# Пошук DuckDuckGo

OpenClaw підтримує DuckDuckGo як **провайдера `web_search` без ключа**. Не потрібні
ані API-ключ, ані обліковий запис.

<Warning>
  DuckDuckGo — це **експериментальна, неофіційна** інтеграція, яка отримує результати
  зі сторінок пошуку DuckDuckGo без JavaScript, а не з офіційного API. Можливі
  періодичні збої через сторінки bot challenge або зміни HTML.
</Warning>

## Налаштування

API-ключ не потрібен — просто вкажіть DuckDuckGo як свого провайдера:

<Steps>
  <Step title="Налаштуйте">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Необов’язкові налаштування рівня plugin для регіону та SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Параметри інструмента

| Параметр     | Опис                                                        |
| ------------ | ----------------------------------------------------------- |
| `query`      | Пошуковий запит (обов’язково)                               |
| `count`      | Кількість результатів для повернення (1-10, типово: 5)      |
| `region`     | Код регіону DuckDuckGo (наприклад, `us-en`, `uk-en`, `de-de`) |
| `safeSearch` | Рівень SafeSearch: `strict`, `moderate` (типово) або `off`  |

Регіон і SafeSearch також можна задати в конфігурації plugin (див. вище) — параметри
інструмента перевизначають значення конфігурації для кожного запиту.

## Примітки

- **Без API-ключа** — працює одразу, без налаштування
- **Експериментально** — збирає результати зі сторінок пошуку DuckDuckGo на HTML без JavaScript,
  а не з офіційного API чи SDK
- **Ризик bot challenge** — DuckDuckGo може показувати CAPTCHA або блокувати запити
  за інтенсивного чи автоматизованого використання
- **Парсинг HTML** — результати залежать від структури сторінки, яка може змінитися без
  попередження
- **Порядок автовизначення** — DuckDuckGo є першим резервним варіантом без ключа
  (порядок 100) в автовизначенні. Провайдери на базі API з налаштованими ключами запускаються
  першими, потім Ollama Web Search (порядок 110), потім SearXNG (порядок 200)
- **Типове значення SafeSearch — moderate**, якщо його не налаштовано

<Tip>
  Для використання у production розгляньте [Brave Search](/tools/brave-search) (доступний
  безкоштовний рівень) або іншого провайдера на базі API.
</Tip>

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовизначення
- [Brave Search](/tools/brave-search) -- структуровані результати з безкоштовним рівнем
- [Exa Search](/tools/exa-search) -- нейронний пошук із витягуванням вмісту
