---
read_when:
    - Ви хочете використовувати Vercel AI Gateway з OpenClaw
    - Вам потрібна змінна середовища API key або варіант auth для CLI
summary: Налаштування Vercel AI Gateway (auth + вибір моделі)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-23T19:26:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 410dfb7c0f44337653906b661612d946ccf48716ae700a718a4f004b03bc1261
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) надає уніфікований API для
доступу до сотень моделей через єдиний endpoint.

| Властивість   | Значення                         |
| ------------- | -------------------------------- |
| Провайдер     | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | сумісний з Anthropic Messages    |
| Каталог моделей | автоматично виявляється через `/v1/models` |

<Tip>
OpenClaw автоматично виявляє каталог Gateway `/v1/models`, тому
`/models vercel-ai-gateway` включає актуальні посилання на моделі, зокрема
`vercel-ai-gateway/openai/gpt-5.5` і
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Початок роботи

<Steps>
  <Step title="Задайте API key">
    Запустіть онбординг і виберіть варіант auth AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Задайте модель за замовчуванням">
    Додайте модель до конфігурації OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Неінтерактивний приклад

Для сценаріїв або налаштувань CI передайте всі значення в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Скорочений запис id моделі

OpenClaw приймає скорочені посилання на моделі Vercel Claude і нормалізує їх під
час виконання:

| Скорочений ввід                     | Нормалізоване посилання на модель             |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
У конфігурації можна використовувати як скорочений запис, так і повне посилання
на модель. OpenClaw автоматично визначає канонічну форму.
</Tip>

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Змінна середовища для daemon-процесів">
    Якщо Gateway OpenClaw працює як daemon (launchd/systemd), переконайтеся, що
    `AI_GATEWAY_API_KEY` доступна для цього процесу.

    <Warning>
    Ключ, заданий лише в `~/.profile`, не буде видимий для daemon
    launchd/systemd, якщо це середовище не було явно імпортоване. Задайте ключ у
    `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг
    його прочитати.
    </Warning>

  </Accordion>

  <Accordion title="Маршрутизація провайдера">
    Vercel AI Gateway маршрутизує запити до провайдера upstream на основі префікса
    посилання на модель. Наприклад, `vercel-ai-gateway/anthropic/claude-opus-4.6` маршрутизується
    через Anthropic, тоді як `vercel-ai-gateway/openai/gpt-5.5` маршрутизується через
    OpenAI, а `vercel-ai-gateway/moonshotai/kimi-k2.6` — через
    MoonshotAI. Єдиний `AI_GATEWAY_API_KEY` обробляє автентифікацію для всіх
    провайдерів upstream.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
