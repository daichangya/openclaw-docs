---
read_when:
    - Ви хочете використовувати Kimi для `web_search`
    - Вам потрібен `KIMI_API_KEY` або `MOONSHOT_API_KEY`
summary: Вебпошук Kimi через вебпошук Moonshot
title: Пошук Kimi
x-i18n:
    generated_at: "2026-04-05T18:20:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753757a5497a683c35b4509ed3709b9514dc14a45612675d0f729ae6668c82a5
    source_path: tools/kimi-search.md
    workflow: 15
---

# Пошук Kimi

OpenClaw підтримує Kimi як провайдера `web_search`, використовуючи вебпошук Moonshot
для створення синтезованих AI відповідей із цитуванням.

## Отримайте API-ключ

<Steps>
  <Step title="Створіть ключ">
    Отримайте API-ключ у [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Збережіть ключ">
    Установіть `KIMI_API_KEY` або `MOONSHOT_API_KEY` у середовищі Gateway або
    налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Коли ви вибираєте **Kimi** під час `openclaw onboard` або
`openclaw configure --section web`, OpenClaw також може запитати:

- регіон API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- типову модель вебпошуку Kimi (типово `kimi-k2.5`)

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
            model: "kimi-k2.5",
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

Якщо ви використовуєте хост China API для чату (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw повторно використовує той самий хост і для Kimi
`web_search`, коли `tools.web.search.kimi.baseUrl` не вказано, щоб ключі з
[platform.moonshot.cn](https://platform.moonshot.cn/) помилково не зверталися до
міжнародного endpoint-а (який часто повертає HTTP 401). Перевизначте
`tools.web.search.kimi.baseUrl`, якщо вам потрібен інший базовий URL для пошуку.

**Альтернатива через середовище:** установіть `KIMI_API_KEY` або `MOONSHOT_API_KEY` у
середовищі Gateway. Для встановлення gateway додайте його в `~/.openclaw/.env`.

Якщо `baseUrl` не вказано, OpenClaw типово використовує `https://api.moonshot.ai/v1`.
Якщо `model` не вказано, OpenClaw типово використовує `kimi-k2.5`.

## Як це працює

Kimi використовує вебпошук Moonshot для синтезу відповідей із вбудованими цитуваннями,
подібно до підходу grounded response у Gemini та Grok.

## Підтримувані параметри

Пошук Kimi підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але Kimi все одно
повертає одну синтезовану відповідь із цитуванням, а не список із N результатів.

Фільтри, специфічні для провайдера, наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовизначення
- [Moonshot AI](/uk/providers/moonshot) -- документація провайдера моделей Moonshot + Kimi Coding
- [Пошук Gemini](/tools/gemini-search) -- синтезовані AI відповіді через прив’язку до Google
- [Пошук Grok](/tools/grok-search) -- синтезовані AI відповіді через прив’язку xAI
