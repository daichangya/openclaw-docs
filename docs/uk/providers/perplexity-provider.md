---
read_when:
    - Ви хочете налаштувати Perplexity як провайдера вебпошуку
    - Вам потрібен API key Perplexity або налаштування проксі OpenRouter
summary: Налаштування провайдера вебпошуку Perplexity (API key, режими пошуку, фільтрація)
title: Perplexity (провайдер)
x-i18n:
    generated_at: "2026-04-05T18:14:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9082d15d6a36a096e21efe8cee78e4b8643252225520f5b96a0b99cf5a7a4b
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (провайдер вебпошуку)

Плагін Perplexity надає можливості вебпошуку через Search API Perplexity
або Perplexity Sonar через OpenRouter.

<Note>
Ця сторінка описує налаштування **провайдера** Perplexity. Для **інструмента**
Perplexity (як агент його використовує) див. [інструмент Perplexity](/tools/perplexity-search).
</Note>

- Тип: провайдер вебпошуку (не провайдер моделей)
- Автентифікація: `PERPLEXITY_API_KEY` (напряму) або `OPENROUTER_API_KEY` (через OpenRouter)
- Шлях конфігурації: `plugins.entries.perplexity.config.webSearch.apiKey`

## Швидкий старт

1. Установіть API key:

```bash
openclaw configure --section web
```

Або задайте його напряму:

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. Агент автоматично використовуватиме Perplexity для вебпошуку, якщо його налаштовано.

## Режими пошуку

Плагін автоматично вибирає транспорт за префіксом API key:

| Префікс ключа | Транспорт                   | Можливості                                      |
| ------------- | --------------------------- | ----------------------------------------------- |
| `pplx-`       | Нативний Search API Perplexity | Структуровані результати, фільтри доменів/мови/дати |
| `sk-or-`      | OpenRouter (Sonar)          | AI-синтезовані відповіді з цитуванням           |

## Фільтрація нативного API

При використанні нативного API Perplexity (ключ `pplx-`) пошук підтримує:

- **Країна**: дволітерний код країни
- **Мова**: код мови ISO 639-1
- **Діапазон дат**: день, тиждень, місяць, рік
- **Фільтри доменів**: allowlist/denylist (максимум 20 доменів)
- **Бюджет вмісту**: `max_tokens`, `max_tokens_per_page`

## Примітка щодо середовища

Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що
`PERPLEXITY_API_KEY` доступна для цього процесу (наприклад, у
`~/.openclaw/.env` або через `env.shellEnv`).
