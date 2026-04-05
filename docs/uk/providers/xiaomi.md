---
read_when:
    - Ви хочете використовувати моделі Xiaomi MiMo в OpenClaw
    - Вам потрібне налаштування `XIAOMI_API_KEY`
summary: Використання моделей Xiaomi MiMo з OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T18:15:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo — це API-платформа для моделей **MiMo**. OpenClaw використовує сумісний з OpenAI
endpoint Xiaomi з автентифікацією за API-ключем. Створіть свій API-ключ у
[консолі Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), а потім налаштуйте
вбудований провайдер `xiaomi` за допомогою цього ключа.

## Вбудований каталог

- Base URL: `https://api.xiaomimimo.com/v1`
- API: `openai-completions`
- Авторизація: `Bearer $XIAOMI_API_KEY`

| Посилання на модель     | Вхідні дані | Контекст  | Макс. вивід | Примітки                     |
| ----------------------- | ----------- | --------- | ----------- | ---------------------------- |
| `xiaomi/mimo-v2-flash`  | text        | 262,144   | 8,192       | Типова модель                |
| `xiaomi/mimo-v2-pro`    | text        | 1,048,576 | 32,000      | Reasoning увімкнено          |
| `xiaomi/mimo-v2-omni`   | text, image | 262,144   | 32,000      | Мультимодальна з reasoning   |

## Налаштування CLI

```bash
openclaw onboard --auth-choice xiaomi-api-key
# or non-interactive
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Фрагмент конфігурації

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## Примітки

- Типове посилання на модель: `xiaomi/mimo-v2-flash`.
- Додаткові вбудовані моделі: `xiaomi/mimo-v2-pro`, `xiaomi/mimo-v2-omni`.
- Провайдер додається автоматично, коли встановлено `XIAOMI_API_KEY` (або існує профіль автентифікації).
- Правила провайдерів див. у [/concepts/model-providers](/uk/concepts/model-providers).
