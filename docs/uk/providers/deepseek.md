---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Вам потрібна змінна середовища ключа API або вибір автентифікації в CLI
summary: Налаштування DeepSeek (автентифікація + вибір моделі)
x-i18n:
    generated_at: "2026-04-12T10:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b439c4b4cf5445db891b81d03e99f6aef5be64623e79e818763de43a2823d6d
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) надає потужні моделі ШІ через API, сумісний з OpenAI.

| Властивість | Значення                  |
| ----------- | ------------------------- |
| Провайдер   | `deepseek`                |
| Автентифікація | `DEEPSEEK_API_KEY`     |
| API         | сумісний з OpenAI         |
| Базовий URL | `https://api.deepseek.com` |

## Початок роботи

<Steps>
  <Step title="Отримайте свій ключ API">
    Створіть ключ API на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Буде запитано ваш ключ API, а `deepseek/deepseek-chat` буде встановлено як модель за замовчуванням.

  </Step>
  <Step title="Переконайтеся, що моделі доступні">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Неінтерактивне налаштування">
    Для сценарних або headless-інсталяцій передайте всі прапорці безпосередньо:

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
доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
</Warning>

## Вбудований каталог

| Посилання на модель          | Назва             | Вхід  | Контекст | Макс. вивід | Примітки                                          |
| ---------------------------- | ----------------- | ----- | -------- | ----------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072  | 8,192       | Модель за замовчуванням; поверхня DeepSeek V3.2 без thinking |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072  | 65,536      | Поверхня V3.2 з підтримкою міркування             |

<Tip>
Обидві вбудовані моделі наразі вказують у вихідному коді сумісність із використанням потокової передачі.
</Tip>

## Приклад конфігурації

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного переключення.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
