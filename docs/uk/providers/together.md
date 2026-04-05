---
read_when:
    - Ви хочете використовувати Together AI з OpenClaw
    - Вам потрібна змінна середовища API-ключа або варіант автентифікації CLI
summary: Налаштування Together AI (автентифікація + вибір моделі)
title: Together AI
x-i18n:
    generated_at: "2026-04-05T18:15:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22aacbaadf860ce8245bba921dcc5ede9da8fd6fa1bc3cc912551aecc1ba0d71
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) надає доступ до провідних моделей з відкритим кодом, зокрема Llama, DeepSeek, Kimi та інших, через уніфікований API.

- Провайдер: `together`
- Автентифікація: `TOGETHER_API_KEY`
- API: сумісний з OpenAI
- Base URL: `https://api.together.xyz/v1`

## Швидкий початок

1. Установіть API-ключ (рекомендовано: зберігайте його для Gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Установіть типову модель:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Це встановить `together/moonshotai/Kimi-K2.5` як типову модель.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `TOGETHER_API_KEY`
доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).

## Вбудований каталог

Зараз OpenClaw постачається з таким вбудованим каталогом Together:

| Посилання на модель                                          | Назва                                  | Вхідні дані | Контекст   | Примітки                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | text, image | 262,144    | Типова модель; reasoning увімкнено |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | text        | 202,752    | Текстова модель загального призначення |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Швидка модель для інструкцій     |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Мультимодальна                   |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Мультимодальна                   |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | text        | 131,072    | Текстова модель загального призначення |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | text        | 131,072    | Модель reasoning                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | text        | 262,144    | Додаткова текстова модель Kimi   |

Профіль onboarding встановлює `together/moonshotai/Kimi-K2.5` як типову модель.
