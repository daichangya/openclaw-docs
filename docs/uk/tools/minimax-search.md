---
read_when:
    - Потрібно використовувати MiniMax для web_search
    - Потрібен ключ MiniMax Coding Plan
    - Потрібні вказівки щодо хоста пошуку MiniMax CN/global
summary: Пошук MiniMax через API пошуку Coding Plan
title: Пошук MiniMax
x-i18n:
    generated_at: "2026-04-05T18:20:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# Пошук MiniMax

OpenClaw підтримує MiniMax як провайдера `web_search` через API пошуку MiniMax
Coding Plan. Він повертає структуровані результати пошуку із заголовками, URL-адресами,
фрагментами та пов’язаними запитами.

## Отримання ключа Coding Plan

<Steps>
  <Step title="Створіть ключ">
    Створіть або скопіюйте ключ MiniMax Coding Plan у
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Збережіть ключ">
    Задайте `MINIMAX_CODE_PLAN_KEY` у середовищі Gateway або налаштуйте через:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw також приймає `MINIMAX_CODING_API_KEY` як псевдонім env. `MINIMAX_API_KEY`
і далі читається як резервний сумісний варіант, коли він уже вказує на токен coding-plan.

## Конфігурація

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Альтернатива через середовище:** задайте `MINIMAX_CODE_PLAN_KEY` у середовищі Gateway.
Для встановлення gateway додайте його в `~/.openclaw/.env`.

## Вибір регіону

Пошук MiniMax використовує такі кінцеві точки:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Якщо `plugins.entries.minimax.config.webSearch.region` не задано, OpenClaw визначає
регіон у такому порядку:

1. `tools.web.search.minimax.region` / власне для plugin `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Це означає, що онбординг CN або `MINIMAX_API_HOST=https://api.minimaxi.com/...`
також автоматично зберігає MiniMax Search на хості CN.

Навіть якщо ви автентифікували MiniMax через шлях OAuth `minimax-portal`,
вебпошук усе одно реєструється як provider id `minimax`; базова URL-адреса OAuth-провайдера
використовується лише як підказка щодо регіону для вибору хоста CN/global.

## Підтримувані параметри

Пошук MiniMax підтримує:

- `query`
- `count` (OpenClaw обрізає повернений список результатів до запитаної кількості)

Специфічні для провайдера фільтри наразі не підтримуються.

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовиявлення
- [MiniMax](/uk/providers/minimax) -- налаштування моделей, зображень, мовлення й автентифікації
