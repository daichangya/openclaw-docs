---
read_when:
    - Ви хочете використовувати Cloudflare AI Gateway з OpenClaw
    - Вам потрібен ID облікового запису, ID Gateway або змінна середовища API key
summary: Налаштування Cloudflare AI Gateway (автентифікація + вибір моделі)
title: Cloudflare AI gateway
x-i18n:
    generated_at: "2026-04-23T22:14:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway розташовується перед API провайдерів і дає змогу додавати аналітику, кешування та засоби контролю. Для Anthropic OpenClaw використовує Anthropic Messages API через ваш endpoint Gateway.

| Властивість   | Значення                                                                                |
| ------------- | --------------------------------------------------------------------------------------- |
| Провайдер     | `cloudflare-ai-gateway`                                                                 |
| Базовий URL   | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`             |
| Модель за замовчуванням | `cloudflare-ai-gateway/claude-sonnet-4-6`                                     |
| API key       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (ваш API key провайдера для запитів через Gateway)     |

<Note>
Для моделей Anthropic, маршрутизованих через Cloudflare AI Gateway, використовуйте свій **Anthropic API key** як ключ провайдера.
</Note>

## Початок роботи

<Steps>
  <Step title="Укажіть API key провайдера та дані Gateway">
    Запустіть онбординг і виберіть варіант автентифікації Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Буде запропоновано ввести ID вашого облікового запису, ID Gateway і API key.

  </Step>
  <Step title="Укажіть модель за замовчуванням">
    Додайте модель до конфігурації OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Неінтерактивний приклад

Для сценаріїв або налаштувань CI передайте всі значення в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Автентифіковані Gateway">
    Якщо ви ввімкнули автентифікацію Gateway у Cloudflare, додайте заголовок `cf-aig-authorization`. Це **додатково до** API key вашого провайдера.

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

    <Tip>
    Заголовок `cf-aig-authorization` автентифікує у самому Cloudflare Gateway, тоді як API key провайдера (наприклад, ваш ключ Anthropic) автентифікує у висхідного провайдера.
    </Tip>

  </Accordion>

  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `CLOUDFLARE_AI_GATEWAY_API_KEY` доступний цьому процесу.

    <Warning>
    Ключ, що зберігається лише в `~/.profile`, не допоможе демону launchd/systemd, якщо це середовище не буде також імпортовано туди. Укажіть ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес Gateway міг його прочитати.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
