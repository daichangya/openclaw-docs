---
read_when:
    - Ви хочете використовувати Ollama для `web_search`
    - Ви хочете постачальника `web_search` без ключа
    - Ви хочете використовувати розміщений вебпошук Ollama з `OLLAMA_API_KEY`
    - Вам потрібні вказівки з налаштування вебпошуку Ollama
summary: Вебпошук Ollama через локальний хост Ollama або розміщений API Ollama
title: вебпошук Ollama
x-i18n:
    generated_at: "2026-04-27T02:31:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw підтримує **вебпошук Ollama** як вбудований постачальник `web_search`. Він використовує API вебпошуку Ollama і повертає структуровані результати із заголовками, URL-адресами та фрагментами.

Для локального або самостійно розміщеного Ollama це налаштування типово не потребує API-ключа. Однак потрібні:

- хост Ollama, до якого OpenClaw може підключитися
- `ollama signin`

Для прямого розміщеного пошуку встановіть базову URL-адресу постачальника Ollama як `https://ollama.com` і вкажіть справжній `OLLAMA_API_KEY`.

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
  <Step title="Виберіть вебпошук Ollama">
    Виконайте:

    ```bash
    openclaw configure --section web
    ```

    Потім виберіть **вебпошук Ollama** як постачальника.

  </Step>
</Steps>

Якщо ви вже використовуєте Ollama для моделей, вебпошук Ollama повторно використовує той самий налаштований хост.

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
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Якщо ви вже налаштовуєте Ollama як постачальника моделей, постачальник вебпошуку може повторно використовувати цей хост:

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

Постачальник моделей Ollama використовує `baseUrl` як канонічний ключ. Постачальник вебпошуку також підтримує `baseURL` у `models.providers.ollama` для сумісності з прикладами конфігурації в стилі OpenAI SDK.

Якщо явну базову URL-адресу Ollama не задано, OpenClaw використовує `http://127.0.0.1:11434`.

Якщо ваш хост Ollama очікує bearer-автентифікацію, OpenClaw повторно використовує
`models.providers.ollama.apiKey` (або відповідну автентифікацію постачальника, підкріплену змінними середовища)
для запитів до цього налаштованого хоста.

Прямий розміщений вебпошук Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Примітки

- Для цього постачальника не потрібне окреме поле API-ключа саме для вебпошуку.
- Якщо хост Ollama захищено автентифікацією, OpenClaw повторно використовує звичайний
  API-ключ постачальника Ollama, якщо його задано.
- Якщо `baseUrl` дорівнює `https://ollama.com`, OpenClaw викликає
  `https://ollama.com/api/web_search` напряму й надсилає налаштований API-ключ Ollama
  як bearer-автентифікацію.
- Якщо налаштований хост не надає вебпошук і встановлено `OLLAMA_API_KEY`,
  OpenClaw може повернутися до `https://ollama.com/api/web_search`, не надсилаючи
  цей ключ змінної середовища на локальний хост.
- Під час налаштування OpenClaw попереджає, якщо Ollama недоступний або не виконано вхід,
  але це не блокує вибір.
- Автовизначення під час виконання може повернутися до вебпошуку Ollama, якщо не налаштовано
  жодного постачальника з вищим пріоритетом і обліковими даними.
- Локальні хости демона Ollama використовують локальну проксі-кінцеву точку
  `/api/experimental/web_search`, яка підписує та пересилає запити в Ollama Cloud.
- Хости `https://ollama.com` використовують публічну розміщену кінцеву точку
  `/api/web_search` напряму з bearer-автентифікацією API-ключем.

## Пов’язане

- [Огляд вебпошуку](/uk/tools/web) -- усі постачальники та автовизначення
- [Ollama](/uk/providers/ollama) -- налаштування моделі Ollama та хмарні/локальні режими
