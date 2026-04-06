---
read_when:
    - Ви хочете використовувати моделі Amazon Bedrock з OpenClaw
    - Вам потрібно налаштувати облікові дані AWS/регіон для викликів моделей
summary: Використовуйте моделі Amazon Bedrock (Converse API) з OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-06T00:33:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70bb29fe9199084b1179ced60935b5908318f5b80ced490bf44a45e0467c4929
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw може використовувати моделі **Amazon Bedrock** через потокового провайдера **Bedrock Converse** від pi‑ai. Автентифікація Bedrock використовує **стандартний ланцюжок облікових даних AWS SDK**, а не API-ключ.

## Що підтримує pi-ai

- Провайдер: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Автентифікація: облікові дані AWS (змінні середовища, спільна конфігурація або роль екземпляра)
- Регіон: `AWS_REGION` або `AWS_DEFAULT_REGION` (типово: `us-east-1`)

## Автоматичне виявлення моделей

OpenClaw може автоматично виявляти моделі Bedrock, які підтримують **streaming** і **text output**. Виявлення використовує `bedrock:ListFoundationModels` і `bedrock:ListInferenceProfiles`, а результати кешуються (типово: 1 година).

Як вмикається неявний провайдер:

- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` має значення `true`,
  OpenClaw спробує виконати виявлення, навіть якщо немає маркера середовища AWS.
- Якщо `plugins.entries.amazon-bedrock.config.discovery.enabled` не задано,
  OpenClaw автоматично додає
  неявний провайдер Bedrock лише тоді, коли бачить один із цих маркерів автентифікації AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` або `AWS_PROFILE`.
- Фактичний шлях автентифікації під час виконання Bedrock все одно використовує стандартний ланцюжок AWS SDK, тому
  спільна конфігурація, SSO та автентифікація ролі екземпляра через IMDS можуть працювати, навіть якщо для виявлення
  потрібно було явно ввімкнути `enabled: true`.

Параметри конфігурації розміщені в `plugins.entries.amazon-bedrock.config.discovery`:

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

- `enabled` типово працює в автоматичному режимі. В автоматичному режимі OpenClaw вмикає
  неявний провайдер Bedrock лише тоді, коли бачить підтримуваний маркер середовища AWS.
- `region` типово береться з `AWS_REGION` або `AWS_DEFAULT_REGION`, а потім `us-east-1`.
- `providerFilter` відповідає назвам провайдерів Bedrock (наприклад, `anthropic`).
- `refreshInterval` задається в секундах; установіть `0`, щоб вимкнути кешування.
- `defaultContextWindow` (типово: `32000`) і `defaultMaxTokens` (типово: `4096`)
  використовуються для виявлених моделей (перевизначте, якщо знаєте ліміти своєї моделі).
- Для явних записів `models.providers["amazon-bedrock"]` OpenClaw усе одно може
  завчасно визначати автентифікацію Bedrock за маркерами середовища AWS, такими як
  `AWS_BEARER_TOKEN_BEDROCK`, без примусового повного завантаження автентифікації під час виконання. Фактичний
  шлях автентифікації для викликів моделі все одно використовує стандартний ланцюжок AWS SDK.

## Початкове налаштування

1. Переконайтеся, що облікові дані AWS доступні на **хості шлюзу**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Необов’язково:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Необов’язково (API-ключ Bedrock/токен bearer):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Додайте провайдера Bedrock і модель до своєї конфігурації (`apiKey` не потрібен):

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

Під час запуску OpenClaw на екземплярі EC2 із приєднаною роллю IAM AWS SDK
може використовувати службу метаданих екземпляра (IMDS) для автентифікації. Для виявлення моделей Bedrock
OpenClaw автоматично вмикає неявний провайдер за маркерами середовища AWS
лише якщо ви явно не встановите
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Рекомендоване налаштування для хостів з IMDS:

- Установіть `plugins.entries.amazon-bedrock.config.discovery.enabled` у `true`.
- Установіть `plugins.entries.amazon-bedrock.config.discovery.region` (або експортуйте `AWS_REGION`).
- Вам **не** потрібен фіктивний API-ключ.
- Вам потрібен `AWS_PROFILE=default`, лише якщо ви спеціально хочете маркер середовища
  для автоматичного режиму або поверхонь статусу.

```bash
# Рекомендовано: явне ввімкнення виявлення + регіон
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Необов’язково: додайте маркер середовища, якщо хочете автоматичний режим без явного ввімкнення
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Потрібні дозволи IAM** для ролі екземпляра EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (для автоматичного виявлення)
- `bedrock:ListInferenceProfiles` (для виявлення профілів інференсу)

Або приєднайте керовану політику `AmazonBedrockFullAccess`.

## Швидке налаштування (шлях AWS)

```bash
# 1. Створіть роль IAM і профіль екземпляра
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

# 2. Приєднайте до свого екземпляра EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. На екземплярі EC2 явно ввімкніть виявлення
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Необов’язково: додайте маркер середовища, якщо хочете автоматичний режим без явного ввімкнення
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Перевірте, що моделі виявлено
openclaw models list
```

## Профілі інференсу

OpenClaw виявляє **регіональні та глобальні профілі інференсу** разом із
базовими моделями. Коли профіль зіставляється з відомою базовою моделлю,
профіль успадковує можливості цієї моделі (контекстне вікно, максимальну кількість токенів,
reasoning, vision), і правильний регіон запиту Bedrock підставляється
автоматично. Це означає, що міжрегіональні профілі Claude працюють без ручного
перевизначення провайдера.

Ідентифікатори профілів інференсу мають вигляд `us.anthropic.claude-opus-4-6-v1:0` (регіональний)
або `anthropic.claude-opus-4-6-v1:0` (глобальний). Якщо базова модель уже є
в результатах виявлення, профіль успадковує повний набір її можливостей;
інакше застосовуються безпечні типові значення.

Додаткова конфігурація не потрібна. Якщо виявлення ввімкнено і принципал IAM
має дозвіл `bedrock:ListInferenceProfiles`, профілі з’являються разом із
базовими моделями в `openclaw models list`.

## Примітки

- Bedrock вимагає, щоб у вашому обліковому записі/регіоні AWS було ввімкнено **доступ до моделей**.
- Автоматичне виявлення потребує дозволів `bedrock:ListFoundationModels` і
  `bedrock:ListInferenceProfiles`.
- Якщо ви покладаєтеся на автоматичний режим, установіть один із підтримуваних маркерів середовища автентифікації AWS на
  хості шлюзу. Якщо ви надаєте перевагу автентифікації через IMDS/спільну конфігурацію без маркерів середовища, установіть
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw показує джерело облікових даних у такому порядку: `AWS_BEARER_TOKEN_BEDROCK`,
  потім `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, потім `AWS_PROFILE`, а потім
  стандартний ланцюжок AWS SDK.
- Підтримка reasoning залежить від моделі; перевіряйте картку моделі Bedrock щодо
  актуальних можливостей.
- Якщо ви віддаєте перевагу керованому потоку ключів, ви також можете розмістити
  OpenAI‑сумісний проксі перед Bedrock і натомість налаштувати його як провайдера OpenAI.

## Guardrails

Ви можете застосовувати [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
до всіх викликів моделей Bedrock, додавши об’єкт `guardrail` до
конфігурації плагіна `amazon-bedrock`. Guardrails дають змогу застосовувати фільтрацію вмісту,
заборону тем, фільтри слів, фільтри чутливої інформації та перевірки
контекстного grounding.

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // ID guardrail або повний ARN
            guardrailVersion: "1", // номер версії або "DRAFT"
            streamProcessingMode: "sync", // необов’язково: "sync" або "async"
            trace: "enabled", // необов’язково: "enabled", "disabled" або "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier` (обов’язково) приймає ID guardrail (наприклад, `abc123`) або
  повний ARN (наприклад, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (обов’язково) указує, яку опубліковану версію використовувати, або
  `"DRAFT"` для робочої чернетки.
- `streamProcessingMode` (необов’язково) визначає, чи виконуватиметься перевірка guardrail
  синхронно (`"sync"`) чи асинхронно (`"async"`) під час streaming. Якщо
  параметр пропущено, Bedrock використовує свою стандартну поведінку.
- `trace` (необов’язково) вмикає виведення трасування guardrail у відповіді API. Установіть
  `"enabled"` або `"enabled_full"` для налагодження; у production пропустіть параметр або встановіть `"disabled"`.

Принципал IAM, який використовує шлюз, повинен мати дозвіл `bedrock:ApplyGuardrail`
на додачу до стандартних дозволів на виклик.

## Embeddings для пошуку в пам’яті

Bedrock також може виступати провайдером embeddings для
[пошуку в пам’яті](/uk/concepts/memory-search). Це налаштовується окремо від
провайдера інференсу — установіть `agents.defaults.memorySearch.provider` у `"bedrock"`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0", // типово
      },
    },
  },
}
```

Embeddings Bedrock використовують той самий ланцюжок облікових даних AWS SDK, що й інференс (ролі
екземплярів, SSO, ключі доступу, спільна конфігурація та web identity). API-ключ не
потрібен. Коли `provider` має значення `"auto"`, Bedrock визначається автоматично, якщо цей
ланцюжок облікових даних успішно розв’язується.

Підтримувані моделі embeddings включають Amazon Titan Embed (v1, v2), Amazon Nova
Embed, Cohere Embed (v3, v4) і TwelveLabs Marengo. Див.
[Довідник з конфігурації пам’яті — Bedrock](/uk/reference/memory-config#bedrock-embedding-config)
для повного списку моделей і параметрів розмірності.
