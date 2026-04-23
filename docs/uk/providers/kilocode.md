---
read_when:
    - Вам потрібен один API-ключ для багатьох LLM
    - Ви хочете запускати моделі через Kilo Gateway в OpenClaw
summary: Використовуйте уніфікований API Kilo Gateway для доступу до багатьох моделей в OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-23T19:26:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c0fa1c4949a76a353f76c47010510b75a6da6dc6d5b993f8e1f5e9b6fef53ce
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway надає **уніфікований API**, який маршрутизує запити до багатьох моделей через одну
кінцеву точку й один API-ключ. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

| Властивість | Значення                           |
| ----------- | ---------------------------------- |
| Провайдер   | `kilocode`                         |
| Автентифікація | `KILOCODE_API_KEY`              |
| API         | Сумісний з OpenAI                  |
| Base URL    | `https://api.kilo.ai/api/gateway/` |

## Початок роботи

<Steps>
  <Step title="Створіть обліковий запис">
    Перейдіть на [app.kilo.ai](https://app.kilo.ai), увійдіть або створіть обліковий запис, потім відкрийте API Keys і згенеруйте новий ключ.
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Або встановіть змінну середовища безпосередньо:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Типова модель

Типова модель — `kilocode/kilo/auto`, модель зі smart-routing, що належить провайдеру
та керується Kilo Gateway.

<Note>
OpenClaw розглядає `kilocode/kilo/auto` як стабільне типове посилання, але не
публікує відображення завдань на вихідні upstream-моделі для цього маршруту, підкріплене джерелом. Точна
маршрутизація upstream за `kilocode/kilo/auto` визначається Kilo Gateway, а не
жорстко закодована в OpenClaw.
</Note>

## Доступні моделі

OpenClaw динамічно виявляє доступні моделі з Kilo Gateway під час запуску. Використовуйте
`/models kilocode`, щоб побачити повний список моделей, доступних для вашого облікового запису.

Будь-яку модель, доступну в gateway, можна використовувати з префіксом `kilocode/`:

| Посилання на модель                    | Примітки                           |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Типово — smart routing             |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic через Kilo               |
| `kilocode/openai/gpt-5.5`              | OpenAI через Kilo                  |
| `kilocode/google/gemini-3-pro-preview` | Google через Kilo                  |
| ...and many more                       | Використовуйте `/models kilocode`, щоб переглянути всі |

<Tip>
Під час запуску OpenClaw виконує запит `GET https://api.kilo.ai/api/gateway/models` і об’єднує
виявлені моделі перед статичним резервним каталогом. Убудований резервний варіант завжди
містить `kilocode/kilo/auto` (`Kilo Auto`) з `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` і `maxTokens: 128000`.
</Tip>

## Приклад конфігурації

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

<AccordionGroup>
  <Accordion title="Транспорт і сумісність">
    Kilo Gateway задокументовано у вихідному коді як сумісний з OpenRouter, тому він залишається на
    proxy-style шляху, сумісному з OpenAI, а не на рідному форматуванні запитів OpenAI.

    - Посилання Kilo, підкріплені Gemini, залишаються на proxy-Gemini шляху, тому OpenClaw зберігає
      очищення thought-signature Gemini без увімкнення рідної
      перевірки повторного відтворення Gemini або переписування bootstrap.
    - Kilo Gateway використовує Bearer token з вашим API-ключем під капотом.

  </Accordion>

  <Accordion title="Обгортка потоку й reasoning">
    Спільна обгортка потоку Kilo додає заголовок застосунку провайдера й нормалізує
    proxy payload reasoning для підтримуваних конкретних посилань на моделі.

    <Warning>
    `kilocode/kilo/auto` та інші підказки, що не підтримують proxy-reasoning, пропускають впровадження reasoning.
    Якщо вам потрібна підтримка reasoning, використовуйте конкретне посилання на модель, наприклад
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Якщо виявлення моделі не вдається під час запуску, OpenClaw повертається до вбудованого статичного каталогу, що містить `kilocode/kilo/auto`.
    - Переконайтеся, що ваш API-ключ дійсний і що у вашому обліковому записі Kilo ввімкнено потрібні моделі.
    - Коли Gateway працює як демон, переконайтеся, що `KILOCODE_API_KEY` доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервування.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration" icon="gear">
    Повний довідник з конфігурації OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Панель керування Kilo Gateway, API-ключі та керування обліковим записом.
  </Card>
</CardGroup>
