---
read_when:
    - Ви хочете використовувати Ollama для `web_search`
    - Ви хочете провайдера `web_search` без ключа
    - Вам потрібні вказівки з налаштування Ollama Web Search
summary: Ollama Web Search через ваш налаштований хост Ollama
title: Пошук в інтернеті Ollama
x-i18n:
    generated_at: "2026-04-05T18:20:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Пошук в інтернеті Ollama

OpenClaw підтримує **Ollama Web Search** як вбудованого провайдера `web_search`.
Він використовує експериментальний API вебпошуку Ollama і повертає структуровані результати
із заголовками, URL-адресами та фрагментами.

На відміну від провайдера моделей Ollama, це налаштування типово не потребує API-ключа.
Однак потрібні:

- хост Ollama, до якого OpenClaw може підключитися
- `ollama signin`

## Налаштування

<Steps>
  <Step title="Запустіть Ollama">
    Переконайтеся, що Ollama встановлено та запущено.
  </Step>
  <Step title="Увійдіть">
    Виконайте:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Виберіть Ollama Web Search">
    Виконайте:

    ```bash
    openclaw configure --section web
    ```

    Потім виберіть **Ollama Web Search** як провайдера.

  </Step>
</Steps>

Якщо ви вже використовуєте Ollama для моделей, Ollama Web Search повторно використовує
той самий налаштований хост.

## Конфігурація

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Необов’язкове перевизначення хоста Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Якщо явний базовий URL Ollama не задано, OpenClaw використовує `http://127.0.0.1:11434`.

Якщо ваш хост Ollama очікує bearer auth, OpenClaw також повторно використовує
`models.providers.ollama.apiKey` (або відповідну автентифікацію провайдера через env)
для запитів вебпошуку.

## Примітки

- Для цього провайдера не потрібне окреме поле API-ключа для вебпошуку.
- Якщо хост Ollama захищений автентифікацією, OpenClaw повторно використовує звичайний
  API-ключ провайдера Ollama, якщо він є.
- Під час налаштування OpenClaw попереджає, якщо Ollama недоступний або вхід не виконано, але
  не блокує вибір.
- Автовизначення під час виконання може переключитися на Ollama Web Search, якщо не налаштовано
  жодного провайдера з обліковими даними вищого пріоритету.
- Провайдер використовує експериментальний endpoint Ollama `/api/experimental/web_search`.

## Пов’язане

- [Огляд Web Search](/tools/web) -- усі провайдери й автовизначення
- [Ollama](/uk/providers/ollama) -- налаштування моделей Ollama та режими cloud/local
