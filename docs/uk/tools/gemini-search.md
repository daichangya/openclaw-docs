---
read_when:
    - Потрібно використовувати Gemini для web_search
    - Потрібен `GEMINI_API_KEY`
    - Потрібен Google Search grounding
summary: Вебпошук Gemini з Google Search grounding
title: Пошук Gemini
x-i18n:
    generated_at: "2026-04-05T18:19:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Пошук Gemini

OpenClaw підтримує моделі Gemini із вбудованим
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding),
який повертає синтезовані AI відповіді, підкріплені живими результатами Google Search, із
цитуваннями.

## Отримання API key

<Steps>
  <Step title="Створіть ключ">
    Перейдіть у [Google AI Studio](https://aistudio.google.com/apikey) і створіть
    API key.
  </Step>
  <Step title="Збережіть ключ">
    Задайте `GEMINI_API_KEY` у середовищі Gateway або налаштуйте через:

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Альтернатива через середовище:** задайте `GEMINI_API_KEY` у середовищі Gateway.
Для встановлення gateway додайте його в `~/.openclaw/.env`.

## Як це працює

На відміну від традиційних провайдерів пошуку, які повертають список посилань і фрагментів,
Gemini використовує Google Search grounding, щоб створювати синтезовані AI відповіді з
вбудованими цитуваннями. Результати містять і синтезовану відповідь, і URL-адреси
джерел.

- URL-адреси цитувань із Gemini grounding автоматично розв’язуються з URL-адрес
  перенаправлення Google у прямі URL-адреси.
- Розв’язання перенаправлень використовує шлях захисту SSRF (HEAD + перевірки перенаправлень +
  валідація http/https) перед поверненням кінцевої URL-адреси цитування.
- Розв’язання перенаправлень використовує суворі типові налаштування SSRF, тому перенаправлення на
  приватні/внутрішні цілі блокуються.

## Підтримувані параметри

Пошук Gemini підтримує `query`.

`count` приймається для сумісності зі спільним `web_search`, але grounding Gemini
все одно повертає одну синтезовану відповідь із цитуваннями, а не список із N
результатів.

Специфічні для провайдера фільтри, такі як `country`, `language`, `freshness` і
`domain_filter`, не підтримуються.

## Вибір моделі

Типова модель — `gemini-2.5-flash` (швидка й економічна). Можна використовувати будь-яку модель Gemini,
яка підтримує grounding, через
`plugins.entries.google.config.webSearch.model`.

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери та автовиявлення
- [Brave Search](/tools/brave-search) -- структуровані результати з фрагментами
- [Perplexity Search](/tools/perplexity-search) -- структуровані результати + вилучення вмісту
