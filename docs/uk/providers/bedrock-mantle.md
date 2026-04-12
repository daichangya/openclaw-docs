---
read_when:
    - Ви хочете використовувати OSS-моделі Bedrock Mantle, розміщені з OpenClaw
    - Вам потрібен сумісний з OpenAI ендпоінт Mantle для GPT-OSS, Qwen, Kimi або GLM
summary: Використовуйте моделі Amazon Bedrock Mantle (сумісні з OpenAI) з OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-12T10:22:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27e602b6f6a3ae92427de135cb9df6356e0daaea6b6fe54723a7542dd0d5d21e
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw містить вбудований провайдер **Amazon Bedrock Mantle**, який підключається до сумісного з OpenAI ендпоінта Mantle. Mantle розміщує моделі з відкритим кодом і сторонні моделі (GPT-OSS, Qwen, Kimi, GLM та подібні) через стандартну поверхню `/v1/chat/completions`, що працює на інфраструктурі Bedrock.

| Властивість     | Значення                                                                            |
| --------------- | ----------------------------------------------------------------------------------- |
| ID провайдера   | `amazon-bedrock-mantle`                                                             |
| API             | `openai-completions` (сумісний з OpenAI)                                            |
| Автентифікація  | Явний `AWS_BEARER_TOKEN_BEDROCK` або генерація bearer-токена через ланцюжок IAM-облікових даних |
| Регіон за замовчуванням | `us-east-1` (перевизначається через `AWS_REGION` або `AWS_DEFAULT_REGION`)                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="Явний bearer-токен">
    **Найкраще для:** середовищ, де у вас уже є bearer-токен Mantle.

    <Steps>
      <Step title="Задайте bearer-токен на хості Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        За потреби також задайте регіон (за замовчуванням `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі виявлено">
        ```bash
        openclaw models list
        ```

        Виявлені моделі з’являться під провайдером `amazon-bedrock-mantle`. Додаткова конфігурація не потрібна, якщо тільки ви не хочете перевизначити значення за замовчуванням.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM-облікові дані">
    **Найкраще для:** використання облікових даних, сумісних з AWS SDK (спільна конфігурація, SSO, web identity, ролі інстанса або завдання).

    <Steps>
      <Step title="Налаштуйте AWS-облікові дані на хості Gateway">
        Підійде будь-яке джерело автентифікації, сумісне з AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі виявлено">
        ```bash
        openclaw models list
        ```

        OpenClaw автоматично генерує bearer-токен Mantle з ланцюжка облікових даних.
      </Step>
    </Steps>

    <Tip>
    Коли `AWS_BEARER_TOKEN_BEDROCK` не задано, OpenClaw створює bearer-токен за вас з типовим ланцюжком облікових даних AWS, включно зі спільними профілями облікових даних/конфігурації, SSO, web identity, а також ролями інстанса або завдання.
    </Tip>

  </Tab>
</Tabs>

## Автоматичне виявлення моделей

Коли задано `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw використовує його напряму. В іншому разі OpenClaw намагається згенерувати bearer-токен Mantle з типового ланцюжка облікових даних AWS. Потім він виявляє доступні моделі Mantle, опитуючи ендпоінт `/v1/models` для відповідного регіону.

| Поведінка        | Деталі                  |
| ---------------- | ----------------------- |
| Кеш виявлення    | Результати кешуються на 1 годину |
| Оновлення IAM-токена | Щогодини                    |

<Note>
Bearer-токен — це той самий `AWS_BEARER_TOKEN_BEDROCK`, що використовується стандартним провайдером [Amazon Bedrock](/uk/providers/bedrock).
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
  <Accordion title="Підтримка міркування">
    Підтримка міркування визначається за ID моделі, які містять шаблони на кшталт `thinking`, `reasoner` або `gpt-oss-120b`. OpenClaw автоматично встановлює `reasoning: true` для відповідних моделей під час виявлення.
  </Accordion>

  <Accordion title="Недоступність ендпоінта">
    Якщо ендпоінт Mantle недоступний або не повертає жодної моделі, провайдер тихо пропускається. OpenClaw не повертає помилку; інші налаштовані провайдери продовжують працювати як звичайно.
  </Accordion>

  <Accordion title="Зв’язок із провайдером Amazon Bedrock">
    Bedrock Mantle є окремим провайдером від стандартного провайдера [Amazon Bedrock](/uk/providers/bedrock). Mantle використовує сумісну з OpenAI поверхню `/v1`, тоді як стандартний провайдер Bedrock використовує нативний API Bedrock.

    Обидва провайдери використовують ті самі облікові дані `AWS_BEARER_TOKEN_BEDROCK`, якщо вони задані.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/uk/providers/bedrock" icon="cloud">
    Нативний провайдер Bedrock для Anthropic Claude, Titan та інших моделей.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="OAuth та автентифікація" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
