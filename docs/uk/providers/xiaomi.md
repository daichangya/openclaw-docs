---
read_when:
    - Ви хочете використовувати моделі Xiaomi MiMo в OpenClaw
    - Вам потрібно налаштувати `XIAOMI_API_KEY`
summary: Використання моделей Xiaomi MiMo з OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-23T23:06:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae61547fa5864f0cd3e19465a8a7d6ff843f9534ab9c2dd39a86a3593cafaa8d
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo — це API-платформа для моделей **MiMo**. OpenClaw використовує endpoint Xiaomi,
сумісний з OpenAI, з автентифікацією через API key.

| Властивість | Значення                        |
| ----------- | ------------------------------- |
| Провайдер   | `xiaomi`                        |
| Auth        | `XIAOMI_API_KEY`                |
| API         | Сумісний з OpenAI               |
| Base URL    | `https://api.xiaomimimo.com/v1` |

## Початок роботи

<Steps>
  <Step title="Отримайте API key">
    Створіть API key у [консолі Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Або передайте ключ напряму:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Вбудований catalog

| Посилання на модель    | Вхід        | Контекст  | Макс. вивід | Reasoning | Примітки       |
| ---------------------- | ----------- | --------- | ----------- | --------- | -------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192       | Ні        | Типова модель  |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000      | Так       | Великий контекст |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000      | Так       | Мультимодальна |

<Tip>
Типове посилання на модель — `xiaomi/mimo-v2-flash`. Провайдер автоматично додається, коли задано `XIAOMI_API_KEY` або існує auth profile.
</Tip>

## Приклад config

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

<AccordionGroup>
  <Accordion title="Поведінка автоін’єкції">
    Провайдер `xiaomi` автоматично додається, коли `XIAOMI_API_KEY` задано у вашому середовищі або існує auth profile. Вам не потрібно вручну налаштовувати провайдера, якщо тільки ви не хочете перевизначити метадані моделі або base URL.
  </Accordion>

  <Accordion title="Докладніше про моделі">
    - **mimo-v2-flash** — легка й швидка, ідеальна для загальних текстових завдань. Підтримка reasoning відсутня.
    - **mimo-v2-pro** — підтримує reasoning з контекстним вікном на 1M токенів для роботи з довгими документами.
    - **mimo-v2-omni** — мультимодальна модель із підтримкою reasoning, яка приймає і текст, і зображення.

    <Note>
    Усі моделі використовують префікс `xiaomi/` (наприклад `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Усунення проблем">
    - Якщо моделі не з’являються, переконайтеся, що `XIAOMI_API_KEY` задано й він валідний.
    - Коли Gateway працює як daemon, переконайтеся, що ключ доступний цьому процесу (наприклад у `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, задані лише в інтерактивному shell, не видимі процесам gateway, якими керує daemon. Для постійної доступності використовуйте `~/.openclaw/.env` або config `env.shellEnv`.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації OpenClaw.
  </Card>
  <Card title="Консоль Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Панель Xiaomi MiMo і керування API key.
  </Card>
</CardGroup>
