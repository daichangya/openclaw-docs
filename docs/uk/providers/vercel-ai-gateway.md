---
read_when:
    - Ви хочете використовувати Vercel AI Gateway з OpenClaw
    - Вам потрібна env var API-ключа або варіант auth для CLI
summary: Налаштування Vercel AI Gateway (auth + вибір моделі)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-05T18:15:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) надає уніфікований API для доступу до сотень моделей через єдиний endpoint.

- Провайдер: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- API: сумісний з Anthropic Messages
- OpenClaw автоматично виявляє каталог Gateway `/v1/models`, тому `/models vercel-ai-gateway`
  містить актуальні посилання на моделі, такі як `vercel-ai-gateway/openai/gpt-5.4`.

## Швидкий початок

1. Установіть API-ключ (рекомендовано: зберегти його для Gateway):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Установіть типову модель:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Примітка щодо середовища

Якщо Gateway працює як служба (launchd/systemd), переконайтеся, що `AI_GATEWAY_API_KEY`
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).

## Скорочений запис ID моделі

OpenClaw приймає скорочені посилання на моделі Claude для Vercel і нормалізує їх
під час runtime:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
