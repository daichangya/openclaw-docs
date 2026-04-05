---
read_when:
    - Ви хочете використовувати Cloudflare AI Gateway з OpenClaw
    - Вам потрібні ID облікового запису, ID шлюзу або env var API-ключа
summary: Налаштування Cloudflare AI Gateway (auth + вибір моделі)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-05T18:13:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway працює перед API провайдерів і дає змогу додавати аналітику, кешування та засоби контролю. Для Anthropic OpenClaw використовує Anthropic Messages API через ваш endpoint Gateway.

- Провайдер: `cloudflare-ai-gateway`
- Базова URL-адреса: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Типова модель: `cloudflare-ai-gateway/claude-sonnet-4-5`
- API-ключ: `CLOUDFLARE_AI_GATEWAY_API_KEY` (ваш API-ключ провайдера для запитів через Gateway)

Для моделей Anthropic використовуйте свій API-ключ Anthropic.

## Швидкий початок

1. Установіть API-ключ провайдера та дані Gateway:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Установіть типову модель:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Автентифіковані шлюзи

Якщо ви ввімкнули автентифікацію Gateway у Cloudflare, додайте заголовок `cf-aig-authorization` (це додатково до вашого API-ключа провайдера).

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## Примітка щодо середовища

Якщо Gateway працює як служба (launchd/systemd), переконайтеся, що `CLOUDFLARE_AI_GATEWAY_API_KEY` доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).
