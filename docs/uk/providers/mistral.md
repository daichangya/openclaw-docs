---
read_when:
    - Ви хочете використовувати моделі Mistral в OpenClaw
    - Вам потрібні онбординг API-ключа Mistral і посилання на моделі
summary: Використання моделей Mistral і транскрипції Voxtral з OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-05T18:14:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f61b9e0656dd7e0243861ddf14b1b41a07c38bff27cef9ad0815d14c8e34408
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw підтримує Mistral як для маршрутизації текстових/графічних моделей (`mistral/...`), так і для
аудіотранскрипції через Voxtral у media understanding.
Mistral також можна використовувати для memory embeddings (`memorySearch.provider = "mistral"`).

## Налаштування CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Фрагмент конфігурації (провайдер LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Вбудований каталог LLM

Наразі OpenClaw постачається з таким вбудованим каталогом Mistral:

| Посилання на модель               | Вхід       | Контекст | Макс. вивід | Примітки                    |
| --------------------------------- | ---------- | -------- | ----------- | --------------------------- |
| `mistral/mistral-large-latest`    | text, image | 262,144 | 16,384      | Типова модель               |
| `mistral/mistral-medium-2508`     | text, image | 262,144 | 8,192       | Mistral Medium 3.1          |
| `mistral/mistral-small-latest`    | text, image | 128,000 | 16,384      | Менша мультимодальна модель |
| `mistral/pixtral-large-latest`    | text, image | 128,000 | 32,768      | Pixtral                     |
| `mistral/codestral-latest`        | text        | 256,000 | 4,096       | Кодування                   |
| `mistral/devstral-medium-latest`  | text        | 262,144 | 32,768      | Devstral 2                  |
| `mistral/magistral-small`         | text        | 128,000 | 40,000      | Із підтримкою reasoning     |

## Фрагмент конфігурації (аудіотранскрипція з Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Примітки

- Для автентифікації Mistral використовується `MISTRAL_API_KEY`.
- Типовий базовий URL провайдера: `https://api.mistral.ai/v1`.
- Типова модель для онбордингу — `mistral/mistral-large-latest`.
- Типова аудіомодель media-understanding для Mistral — `voxtral-mini-latest`.
- Шлях для транскрипції медіа використовує `/v1/audio/transcriptions`.
- Шлях для memory embeddings використовує `/v1/embeddings` (типова модель: `mistral-embed`).
