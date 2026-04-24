---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Вам потрібна змінна середовища для API-ключа або вибір автентифікації через CLI
summary: Налаштування DeepSeek (автентифікація + вибір моделі)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:13:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) надає потужні AI-моделі з API, сумісним з OpenAI.

| Властивість | Значення                  |
| ----------- | ------------------------- |
| Постачальник | `deepseek`                |
| Автентифікація | `DEEPSEEK_API_KEY`      |
| API         | сумісний з OpenAI         |
| Base URL    | `https://api.deepseek.com` |

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Після цього буде запитано ваш API-ключ і встановлено `deepseek/deepseek-v4-flash` як модель за замовчуванням.

  </Step>
  <Step title="Переконайтеся, що моделі доступні">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Неінтерактивне налаштування">
    Для скриптових або headless-установок передайте всі прапорці безпосередньо:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `DEEPSEEK_API_KEY`
доступна цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
</Warning>

## Вбудований каталог

| Model ref                    | Назва             | Вхід | Контекст  | Макс. вивід | Примітки                                   |
| ---------------------------- | ----------------- | ---- | --------- | ----------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text | 1,000,000 | 384,000     | Модель за замовчуванням; поверхня V4 з підтримкою thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text | 1,000,000 | 384,000     | Поверхня V4 з підтримкою thinking          |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text | 131,072   | 8,192       | Поверхня DeepSeek V3.2 без thinking        |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072   | 65,536      | Поверхня V3.2 з підтримкою міркування      |

<Tip>
Моделі V4 підтримують параметр `thinking` від DeepSeek. OpenClaw також відтворює
`reasoning_content` DeepSeek на наступних ходах, тож сеанси thinking із викликами інструментів
можуть продовжуватися.
</Tip>

## Приклад конфігурації

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, model ref і поведінки перемикання на резервний варіант.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і постачальників.
  </Card>
</CardGroup>
