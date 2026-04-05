---
read_when:
    - Ви хочете використовувати Grok для `web_search`
    - Вам потрібен `XAI_API_KEY` для вебпошуку
summary: Вебпошук Grok через відповіді xAI з прив’язкою до вебданих
title: Пошук Grok
x-i18n:
    generated_at: "2026-04-05T18:19:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Пошук Grok

OpenClaw підтримує Grok як провайдера `web_search`, використовуючи відповіді xAI з прив’язкою до вебданих
для створення синтезованих AI відповідей на основі результатів пошуку в реальному часі
з цитуванням.

Той самий `XAI_API_KEY` також можна використовувати для вбудованого інструмента `x_search` для пошуку дописів у X
(колишній Twitter). Якщо ви збережете ключ у
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw тепер повторно використовує його як
резервний варіант і для вбудованого провайдера моделей xAI.

Для метрик X на рівні допису, таких як reposts, replies, bookmarks або views, краще використовувати
`x_search` з точним URL допису або ID status замість широкого пошукового
запиту.

## Onboarding і налаштування

Якщо ви виберете **Grok** під час:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw може показати окремий наступний крок для ввімкнення `x_search` з тим самим
`XAI_API_KEY`. Цей наступний крок:

- з’являється лише після того, як ви виберете Grok для `web_search`
- не є окремим вибором провайдера вебпошуку верхнього рівня
- може за бажанням встановити модель `x_search` у межах того ж процесу

Якщо ви пропустите це, ви зможете ввімкнути або змінити `x_search` пізніше в конфігурації.

## Отримайте API-ключ

<Steps>
  <Step title="Створіть ключ">
    Отримайте API-ключ у [xAI](https://console.x.ai/).
  </Step>
  <Step title="Збережіть ключ">
    Установіть `XAI_API_KEY` у середовищі Gateway або налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Конфігурація

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Альтернатива через середовище:** установіть `XAI_API_KEY` у середовищі Gateway.
Для встановлення gateway додайте його в `~/.openclaw/.env`.

## Як це працює

Grok використовує відповіді xAI з прив’язкою до вебданих для синтезу відповідей із вбудованими
цитуваннями, подібно до підходу Google Search grounding у Gemini.

## Підтримувані параметри

Пошук Grok підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але Grok все одно
повертає одну синтезовану відповідь із цитуванням, а не список із N результатів.

Фільтри, специфічні для провайдера, наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовизначення
- [`x_search` у Web Search](/tools/web#x_search) -- першокласний пошук у X через xAI
- [Пошук Gemini](/tools/gemini-search) -- синтезовані AI відповіді через прив’язку до Google
