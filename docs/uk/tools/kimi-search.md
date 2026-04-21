---
read_when:
    - Ви хочете використовувати Kimi для `web_search`
    - Вам потрібен `KIMI_API_KEY` або `MOONSHOT_API_KEY`
summary: Вебпошук Kimi через вебпошук Moonshot
title: Пошук Kimi
x-i18n:
    generated_at: "2026-04-21T01:06:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Пошук Kimi

OpenClaw підтримує Kimi як постачальника `web_search`, використовуючи вебпошук Moonshot
для створення синтезованих ШІ відповідей із цитуваннями.

## Отримання API-ключа

<Steps>
  <Step title="Створіть ключ">
    Отримайте API-ключ у [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Збережіть ключ">
    Встановіть `KIMI_API_KEY` або `MOONSHOT_API_KEY` у середовищі Gateway або
    налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Коли ви обираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- типову модель вебпошуку Kimi (типове значення — `kimi-k2.6`)

## Конфігурація

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Якщо ви використовуєте хост API Китаю для чату (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw повторно використовує цей самий хост для Kimi
`web_search`, коли `tools.web.search.kimi.baseUrl` пропущено, тому ключі з
[platform.moonshot.cn](https://platform.moonshot.cn/) помилково не звертаються до
міжнародної кінцевої точки (яка часто повертає HTTP 401). Перевизначте
`tools.web.search.kimi.baseUrl`, якщо вам потрібна інша базова URL-адреса пошуку.

**Альтернатива через середовище:** встановіть `KIMI_API_KEY` або `MOONSHOT_API_KEY` у
середовищі Gateway. Для встановлення gateway додайте його до `~/.openclaw/.env`.

Якщо ви пропустите `baseUrl`, OpenClaw типово використовуватиме `https://api.moonshot.ai/v1`.
Якщо ви пропустите `model`, OpenClaw типово використовуватиме `kimi-k2.6`.

## Як це працює

Kimi використовує вебпошук Moonshot для синтезу відповідей із вбудованими цитуваннями,
подібно до підходу обґрунтованих відповідей у Gemini та Grok.

## Підтримувані параметри

Пошук Kimi підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але Kimi все одно
повертає одну синтезовану відповідь із цитуваннями, а не список із N результатів.

Фільтри, специфічні для постачальника, наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/uk/tools/web) -- усі постачальники та авто-виявлення
- [Moonshot AI](/uk/providers/moonshot) -- документація постачальника моделей Moonshot + Kimi Coding
- [Пошук Gemini](/uk/tools/gemini-search) -- синтезовані ШІ відповіді через обґрунтування Google
- [Пошук Grok](/uk/tools/grok-search) -- синтезовані ШІ відповіді через обґрунтування xAI
