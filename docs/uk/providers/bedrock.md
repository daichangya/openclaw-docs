---
read_when:
    - Ви хочете використовувати моделі Amazon Bedrock з OpenClaw
    - Вам потрібно налаштувати облікові дані AWS/регіон для викликів моделей
summary: Використання моделей Amazon Bedrock (Converse API) з OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T18:14:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: a751824b679a9340db714ee5227e8d153f38f6c199ca900458a4ec092b4efe54
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw може використовувати моделі **Amazon Bedrock** через потоковий провайдер **Bedrock Converse** з pi‑ai. Автентифікація Bedrock використовує **стандартний ланцюжок облікових даних AWS SDK**, а не API-ключ.

## Що підтримує pi-ai

- Провайдер: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Автентифікація: облікові дані AWS (змінні середовища, спільна конфігурація або роль екземпляра)
- Регіон: `AWS_REGION` або `AWS_DEFAULT_REGION` (за замовчуванням: `us-east-1`)

## Автоматичне виявлення моделей

OpenClaw може автоматично виявляти моделі Bedrock, які підтримують **потокову передачу**
та **текстовий вивід**. Для виявлення використовуються `bedrock:ListFoundationModels` і
`bedrock:ListInferenceProfiles`, а результати кешуються (за замовчуванням: 1 година).

Як вмикається неявний провайдер:

- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` має значення `true`,
  OpenClaw намагатиметься виконати виявлення навіть без маркера середовища AWS.
- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` не задано,
  OpenClaw автоматично додає
  неявний провайдер Bedrock лише тоді, коли бачить один із таких маркерів автентифікації AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` або `AWS_PROFILE`.
- Фактичний шлях автентифікації Bedrock під час виконання все одно використовує стандартний ланцюжок AWS SDK, тож
  спільна конфігурація, SSO та автентифікація роллю екземпляра через IMDS можуть працювати, навіть якщо для виявлення
  потрібно було явно увімкнути `enabled: true`.

Параметри config розміщені в `plugins.entries.amazon-bedrock.config.discovery`:

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          discovery: {
            enabled: true,
            region: "us-east-1",
            providerFilter: ["anthropic", "amazon"],
            refreshInterval: 3600,
            defaultContextWindow: 32000,
            defaultMaxTokens: 4096,
          },
        },
      },
    },
  },
}
```

Примітки:

- `enabled` за замовчуванням працює в автоматичному режимі. В автоматичному режимі OpenClaw вмикає
  неявний провайдер Bedrock лише тоді, коли бачить підтримуваний маркер середовища AWS.
- `region` за замовчуванням бере значення з `AWS_REGION` або `AWS_DEFAULT_REGION`, потім `us-east-1`.
- `providerFilter` відповідає назвам провайдерів Bedrock (наприклад, `anthropic`).
- `refreshInterval` задається в секундах; установіть `0`, щоб вимкнути кешування.
- `defaultContextWindow` (за замовчуванням: `32000`) і `defaultMaxTokens` (за замовчуванням: `4096`)
  використовуються для виявлених моделей (перевизначте їх, якщо знаєте ліміти своєї моделі).
- Для явних записів `models.providers["amazon-bedrock"]` OpenClaw усе одно може
  завчасно визначати автентифікацію Bedrock за маркерами середовища AWS, такими як
  `AWS_BEARER_TOKEN_BEDROCK`, без примусового повного завантаження runtime-автентифікації. Фактичний
  шлях автентифікації під час виклику моделі все одно використовує стандартний ланцюжок AWS SDK.

## Onboarding

1. Переконайтеся, що облікові дані AWS доступні на **gateway host**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Optional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Optional (Bedrock API key/bearer token):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Додайте провайдера Bedrock і модель до свого config (без `apiKey`):

```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
        api: "bedrock-converse-stream",
        auth: "aws-sdk",
        models: [
          {
            id: "us.anthropic.claude-opus-4-6-v1:0",
            name: "Claude Opus 4.6 (Bedrock)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
    },
  },
}
```

## Ролі екземплярів EC2

Коли OpenClaw працює на екземплярі EC2 із приєднаною роллю IAM, AWS SDK
може використовувати службу метаданих екземпляра (IMDS) для автентифікації. Для виявлення моделей Bedrock
OpenClaw автоматично вмикає неявний провайдер за маркерами середовища AWS
лише якщо ви явно не встановите
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Рекомендоване налаштування для хостів з IMDS:

- Установіть `plugins.entries.amazon-bedrock.config.discovery.enabled` у `true`.
- Установіть `plugins.entries.amazon-bedrock.config.discovery.region` (або експортуйте `AWS_REGION`).
- Вам **не** потрібен фіктивний API-ключ.
- `AWS_PROFILE=default` потрібен лише в тому разі, якщо вам спеціально потрібен маркер середовища
  для автоматичного режиму або поверхонь статусу.

```bash
# Recommended: explicit discovery enable + region
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Optional: add an env marker if you want auto mode without explicit enable
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Необхідні дозволи IAM** для ролі екземпляра EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (для автоматичного виявлення)
- `bedrock:ListInferenceProfiles` (для виявлення профілів інференсу)

Або приєднайте керовану політику `AmazonBedrockFullAccess`.

## Швидке налаштування (шлях AWS)

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Профілі інференсу

OpenClaw виявляє **регіональні та глобальні профілі інференсу** разом із
foundation-моделями. Коли профіль зіставляється з відомою foundation-моделлю,
профіль успадковує можливості цієї моделі (вікно контексту, max tokens,
reasoning, vision), а правильний регіон запиту Bedrock підставляється
автоматично. Це означає, що міжрегіональні профілі Claude працюють без ручного
перевизначення провайдера.

Ідентифікатори профілів інференсу мають вигляд `us.anthropic.claude-opus-4-6-v1:0` (регіональний)
або `anthropic.claude-opus-4-6-v1:0` (глобальний). Якщо базова модель уже
є в результатах виявлення, профіль успадковує повний набір її можливостей;
інакше застосовуються безпечні значення за замовчуванням.

Додаткове налаштування не потрібне. Якщо виявлення ввімкнене і суб’єкт IAM
має дозвіл `bedrock:ListInferenceProfiles`, профілі з’являються поруч із
foundation-моделями в `openclaw models list`.

## Примітки

- Bedrock вимагає ввімкненого **доступу до моделі** у вашому обліковому записі AWS/регіоні.
- Для автоматичного виявлення потрібні дозволи `bedrock:ListFoundationModels` і
  `bedrock:ListInferenceProfiles`.
- Якщо ви покладаєтеся на автоматичний режим, установіть один із підтримуваних маркерів середовища автентифікації AWS на
  gateway host. Якщо ви віддаєте перевагу автентифікації через IMDS/спільну конфігурацію без маркерів середовища, установіть
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw показує джерело облікових даних у такому порядку: `AWS_BEARER_TOKEN_BEDROCK`,
  потім `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, потім `AWS_PROFILE`, а далі
  стандартний ланцюжок AWS SDK.
- Підтримка reasoning залежить від моделі; перевіряйте картку моделі Bedrock на предмет
  актуальних можливостей.
- Якщо ви віддаєте перевагу керованому потоку ключів, ви також можете розмістити
  сумісний з OpenAI проксі перед Bedrock і натомість налаштувати його як провайдера OpenAI.

## Guardrails

Ви можете застосувати [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
до всіх викликів моделей Bedrock, додавши об’єкт `guardrail` до
config plugin `amazon-bedrock`. Guardrails дають змогу застосовувати фільтрацію контенту,
заборону тем, фільтри слів, фільтри чутливої інформації та перевірки
контекстного заземлення.

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // guardrail ID or full ARN
            guardrailVersion: "1", // version number or "DRAFT"
            streamProcessingMode: "sync", // optional: "sync" or "async"
            trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier` (обов’язковий) приймає ID guardrail (наприклад, `abc123`) або
  повний ARN (наприклад, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (обов’язковий) указує, яку опубліковану версію використовувати, або
  `"DRAFT"` для робочої чернетки.
- `streamProcessingMode` (необов’язковий) визначає, чи виконується оцінювання guardrail
  синхронно (`"sync"`) чи асинхронно (`"async"`) під час потокової передачі. Якщо
  не вказано, Bedrock використовує свою стандартну поведінку.
- `trace` (необов’язковий) вмикає трасування guardrail у відповіді API. Установіть
  `"enabled"` або `"enabled_full"` для налагодження; не вказуйте або встановіть `"disabled"` для
  production.

Суб’єкт IAM, який використовує gateway, повинен мати дозвіл `bedrock:ApplyGuardrail`
додатково до стандартних дозволів на виклик.
