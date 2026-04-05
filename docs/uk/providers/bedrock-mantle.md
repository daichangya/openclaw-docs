---
read_when:
    - Ви хочете використовувати розміщені в Bedrock Mantle OSS-моделі з OpenClaw
    - Вам потрібна OpenAI-compatible кінцева точка Mantle для GPT-OSS, Qwen, Kimi або GLM
summary: Використання моделей Amazon Bedrock Mantle (OpenAI-compatible) з OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-05T18:13:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2efe61261fbb430f63be9f5025c0654c44b191dbe96b3eb081d7ccbe78458907
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw містить вбудованого провайдера **Amazon Bedrock Mantle**, який підключається до
OpenAI-compatible кінцевої точки Mantle. Mantle розміщує open-source та
сторонні моделі (GPT-OSS, Qwen, Kimi, GLM та подібні) через стандартну
поверхню `/v1/chat/completions`, що працює на інфраструктурі Bedrock.

## Що підтримує OpenClaw

- Провайдер: `amazon-bedrock-mantle`
- API: `openai-completions` (OpenAI-compatible)
- Автентифікація: bearer token через `AWS_BEARER_TOKEN_BEDROCK`
- Регіон: `AWS_REGION` або `AWS_DEFAULT_REGION` (типово: `us-east-1`)

## Автоматичне виявлення моделей

Коли задано `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw автоматично виявляє
доступні моделі Mantle, опитуючи кінцеву точку `/v1/models` для відповідного регіону.
Результати виявлення кешуються на 1 годину.

Підтримувані регіони: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Задайте bearer token на **хості gateway**:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Необов’язково (типово us-east-1):
export AWS_REGION="us-west-2"
```

2. Переконайтеся, що моделі виявляються:

```bash
openclaw models list
```

Виявлені моделі з’являються під провайдером `amazon-bedrock-mantle`. Жодної
додаткової конфігурації не потрібно, якщо тільки ви не хочете перевизначити типові значення.

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

## Примітки

- Mantle наразі вимагає bearer token. Звичайних облікових даних IAM (ролі інстансів,
  SSO, ключі доступу) недостатньо без токена.
- Bearer token — це той самий `AWS_BEARER_TOKEN_BEDROCK`, що використовується стандартним
  провайдером [Amazon Bedrock](/providers/bedrock).
- Підтримка reasoning визначається за ідентифікаторами моделей, що містять шаблони на кшталт
  `thinking`, `reasoner` або `gpt-oss-120b`.
- Якщо кінцева точка Mantle недоступна або не повертає моделей, провайдер
  тихо пропускається.
