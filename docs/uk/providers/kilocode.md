---
read_when:
    - Ви хочете один API key для багатьох LLM
    - Ви хочете запускати моделі через Kilo Gateway в OpenClaw
summary: Використовуйте уніфікований API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T18:14:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway надає **уніфікований API**, який маршрутизує запити до багатьох моделей через одну
кінцеву точку й API key. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни base URL.

## Отримання API key

1. Перейдіть на [app.kilo.ai](https://app.kilo.ai)
2. Увійдіть або створіть обліковий запис
3. Перейдіть до API Keys і згенеруйте новий ключ

## Налаштування CLI

```bash
openclaw onboard --auth-choice kilocode-api-key
```

Або задайте змінну середовища:

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## Фрагмент конфігурації

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Типова модель

Типова модель — `kilocode/kilo/auto`, модель зі smart routing, що належить провайдеру
та керується Kilo Gateway.

OpenClaw розглядає `kilocode/kilo/auto` як стабільне типове посилання, але не
публікує підтверджену вихідним кодом відповідність між завданнями та upstream-моделями для цього маршруту.

## Доступні моделі

OpenClaw динамічно виявляє доступні моделі з Kilo Gateway під час запуску. Використовуйте
`/models kilocode`, щоб побачити повний список моделей, доступних для вашого облікового запису.

Будь-яку модель, доступну на gateway, можна використовувати з префіксом `kilocode/`:

```
kilocode/kilo/auto              (типова - smart routing)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...і багато інших
```

## Примітки

- Посилання на моделі мають формат `kilocode/<model-id>` (наприклад, `kilocode/anthropic/claude-sonnet-4`).
- Типова модель: `kilocode/kilo/auto`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Вбудований резервний каталог завжди включає `kilocode/kilo/auto` (`Kilo Auto`) з
  `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`
  і `maxTokens: 128000`
- Під час запуску OpenClaw намагається виконати `GET https://api.kilo.ai/api/gateway/models` і
  об’єднує виявлені моделі перед статичним резервним каталогом
- Точна upstream-маршрутизація за `kilocode/kilo/auto` належить Kilo Gateway,
  а не жорстко закодована в OpenClaw
- Kilo Gateway задокументовано у вихідному коді як сумісний з OpenRouter, тому він залишається на
  проксі-шляху OpenAI-compatible, а не на нативному формуванні запитів OpenAI
- Посилання Kilo на основі Gemini залишаються на проксі-шляху Gemini, тому OpenClaw зберігає там
  очищення thought-signature Gemini без увімкнення нативної
  перевірки replay Gemini або переписування bootstrap.
- Спільна обгортка stream Kilo додає заголовок застосунку провайдера та нормалізує
  payload reasoning проксі для підтримуваних конкретних посилань на моделі. `kilocode/kilo/auto`
  та інші підказки, де reasoning проксі не підтримується, пропускають цю ін’єкцію reasoning.
- Більше варіантів моделей/провайдерів див. у [/concepts/model-providers](/uk/concepts/model-providers).
- Усередині Kilo Gateway використовує Bearer token з вашим API key.
