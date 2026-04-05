---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Вам потрібна змінна середовища API key або варіант auth у CLI
summary: Налаштування DeepSeek (auth + вибір моделі)
x-i18n:
    generated_at: "2026-04-05T18:13:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) надає потужні AI-моделі через OpenAI-compatible API.

- Провайдер: `deepseek`
- Автентифікація: `DEEPSEEK_API_KEY`
- API: OpenAI-compatible
- Base URL: `https://api.deepseek.com`

## Швидкий старт

Установіть API key (рекомендовано: зберегти його для Gateway):

```bash
openclaw onboard --auth-choice deepseek-api-key
```

Буде запитано ваш API key і встановлено `deepseek/deepseek-chat` як типову модель.

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## Примітка щодо середовища

Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `DEEPSEEK_API_KEY`
доступна для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).

## Вбудований каталог

| Посилання на модель          | Назва             | Вхід  | Контекст | Макс. вивід | Примітки                                          |
| ---------------------------- | ----------------- | ----- | -------- | ----------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072  | 8,192       | Типова модель; поверхня DeepSeek V3.2 без thinking |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072  | 65,536      | Поверхня V3.2 з увімкненим reasoning              |

Обидві вбудовані моделі наразі вказують у вихідному коді сумісність із streaming usage.

Отримайте свій API key на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
