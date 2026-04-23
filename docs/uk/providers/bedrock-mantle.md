---
read_when:
    - Ви хочете використовувати розміщені в Bedrock Mantle OSS-моделі з OpenClaw
    - Вам потрібен сумісний з OpenAI endpoint Mantle для GPT-OSS, Qwen, Kimi або GLM
summary: Використовуйте моделі Amazon Bedrock Mantle (сумісні з OpenAI) з OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T06:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b3ba0e0a6a175ca1159c0c8ac9cf13a43dfb59b7bb106089c635876c349c61
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw містить вбудований провайдер **Amazon Bedrock Mantle**, який підключається
до сумісного з OpenAI endpoint Mantle. Mantle розміщує open-source і
сторонні моделі (GPT-OSS, Qwen, Kimi, GLM тощо) через стандартну
поверхню `/v1/chat/completions`, що працює на інфраструктурі Bedrock.

| Властивість   | Значення                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------ |
| ID провайдера | `amazon-bedrock-mantle`                                                                    |
| API           | `openai-completions` (сумісне з OpenAI) або `anthropic-messages` (маршрут Anthropic Messages) |
| Auth          | Явний `AWS_BEARER_TOKEN_BEDROCK` або генерація bearer token через ланцюжок IAM-облікових даних |
| Регіон за замовчуванням | `us-east-1` (перевизначається через `AWS_REGION` або `AWS_DEFAULT_REGION`)           |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Явний bearer token">
    **Найкраще для:** середовищ, де у вас уже є bearer token Mantle.

    <Steps>
      <Step title="Задайте bearer token на хості gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        За потреби задайте регіон (за замовчуванням `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі виявляються">
        ```bash
        openclaw models list
        ```

        Виявлені моделі з’являться під провайдером `amazon-bedrock-mantle`. Додаткова
        конфігурація не потрібна, якщо тільки ви не хочете перевизначити стандартні значення.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM-облікові дані">
    **Найкраще для:** використання облікових даних, сумісних з AWS SDK (спільна конфігурація, SSO, web identity, ролі інстанса або задачі).

    <Steps>
      <Step title="Налаштуйте AWS-облікові дані на хості gateway">
        Працює будь-яке джерело автентифікації, сумісне з AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі виявляються">
        ```bash
        openclaw models list
        ```

        OpenClaw автоматично генерує bearer token Mantle з ланцюжка облікових даних.
      </Step>
    </Steps>

    <Tip>
    Коли `AWS_BEARER_TOKEN_BEDROCK` не задано, OpenClaw створює bearer token за вас на основі стандартного ланцюжка облікових даних AWS, зокрема спільних профілів credentials/config, SSO, web identity, а також ролей інстанса чи задачі.
    </Tip>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

Коли задано `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw використовує його напряму. Інакше
OpenClaw намагається згенерувати bearer token Mantle зі стандартного
ланцюжка AWS-облікових даних. Потім він виявляє доступні моделі Mantle, звертаючись до
endpoint `/v1/models` для відповідного регіону.

| Поведінка           | Деталі                     |
| ------------------- | -------------------------- |
| Кеш виявлення       | Результати кешуються на 1 годину |
| Оновлення IAM token | Щогодини                   |

<Note>
Bearer token — це той самий `AWS_BEARER_TOKEN_BEDROCK`, який використовується стандартним провайдером [Amazon Bedrock](/uk/providers/bedrock).
</Note>

### Підтримувані регіони

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Ручна конфігурація

Якщо ви віддаєте перевагу явній конфігурації замість автоматичного виявлення:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Підтримка reasoning">
    Підтримка reasoning визначається з ID моделі, що містять шаблони на кшталт
    `thinking`, `reasoner` або `gpt-oss-120b`. OpenClaw автоматично задає `reasoning: true`
    для відповідних моделей під час виявлення.
  </Accordion>

  <Accordion title="Недоступність endpoint">
    Якщо endpoint Mantle недоступний або не повертає моделей, провайдер
    тихо пропускається. OpenClaw не видає помилку; інші налаштовані провайдери
    продовжують працювати як звичайно.
  </Accordion>

  <Accordion title="Claude Opus 4.7 через маршрут Anthropic Messages">
    Mantle також надає маршрут Anthropic Messages, який передає моделі Claude через той самий потік streaming з bearer-auth. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) можна викликати через цей маршрут із streaming, що належить провайдеру, тому AWS bearer tokens не розглядаються як Anthropic API keys.

    Коли ви фіксуєте модель Anthropic Messages на провайдері Mantle, OpenClaw використовує для цієї моделі поверхню API `anthropic-messages` замість `openai-completions`. Auth і далі надходить з `AWS_BEARER_TOKEN_BEDROCK` (або згенерованого IAM bearer token).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

    Метадані вікна контексту для виявлених моделей Mantle використовують відомі опубліковані обмеження, коли вони доступні, і обережно повертаються до резервних значень для не включених до списку моделей, щоб Compaction і обробка переповнення працювали коректно для новіших записів без завищення можливостей невідомих моделей.

  </Accordion>

  <Accordion title="Зв’язок із провайдером Amazon Bedrock">
    Bedrock Mantle — це окремий провайдер від стандартного
    провайдера [Amazon Bedrock](/uk/providers/bedrock). Mantle використовує
    сумісну з OpenAI поверхню `/v1`, тоді як стандартний провайдер Bedrock використовує
    нативний API Bedrock.

    Обидва провайдери використовують ті самі облікові дані `AWS_BEARER_TOKEN_BEDROCK`, якщо
    вони наявні.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/uk/providers/bedrock" icon="cloud">
    Нативний провайдер Bedrock для Anthropic Claude, Titan та інших моделей.
  </Card>
  <Card title="Вибір моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="OAuth і auth" href="/uk/gateway/authentication" icon="key">
    Подробиці auth і правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення проблем" href="/uk/help/troubleshooting" icon="wrench">
    Типові проблеми та способи їх вирішення.
  </Card>
</CardGroup>
