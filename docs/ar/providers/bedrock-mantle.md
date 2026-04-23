---
read_when:
    - تريد استخدام نماذج OSS المستضافة على Bedrock Mantle مع OpenClaw
    - تحتاج إلى نقطة نهاية Mantle المتوافقة مع OpenAI لـ GPT-OSS أو Qwen أو Kimi أو GLM
summary: استخدام نماذج Amazon Bedrock Mantle (المتوافقة مع OpenAI) مع OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T07:30:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b3ba0e0a6a175ca1159c0c8ac9cf13a43dfb59b7bb106089c635876c349c61
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

يتضمن OpenClaw مزود **Amazon Bedrock Mantle** مضمّنًا يتصل
بنقطة نهاية Mantle المتوافقة مع OpenAI. تستضيف Mantle نماذج مفتوحة المصدر
ونماذج من جهات خارجية (مثل GPT-OSS وQwen وKimi وGLM وما شابهها) عبر
سطح قياسي من نوع `/v1/chat/completions` مدعوم ببنية Bedrock التحتية.

| الخاصية       | القيمة                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| معرّف المزوّد    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (متوافق مع OpenAI) أو `anthropic-messages` (مسار Anthropic Messages) |
| المصادقة           | `AWS_BEARER_TOKEN_BEDROCK` صريح أو توليد bearer token من سلسلة بيانات اعتماد IAM         |
| المنطقة الافتراضية | `us-east-1` (يمكن تجاوزها باستخدام `AWS_REGION` أو `AWS_DEFAULT_REGION`)                            |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Explicit bearer token">
    **الأفضل لـ:** البيئات التي لديك فيها بالفعل Mantle bearer token.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        يمكنك اختياريًا ضبط منطقة (الافتراضي `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        تظهر النماذج المكتشفة تحت المزود `amazon-bedrock-mantle`. ولا
        يلزم أي إعداد إضافي ما لم تكن تريد تجاوز القيم الافتراضية.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **الأفضل لـ:** استخدام بيانات اعتماد متوافقة مع AWS SDK (التهيئة المشتركة، وSSO، وweb identity، أو أدوار المثيل أو المهمة).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        أي مصدر مصادقة متوافق مع AWS SDK يعمل:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        يقوم OpenClaw بتوليد Mantle bearer token من سلسلة بيانات الاعتماد تلقائيًا.
      </Step>
    </Steps>

    <Tip>
    عندما لا تكون `AWS_BEARER_TOKEN_BEDROCK` مضبوطة، يقوم OpenClaw بإصدار bearer token نيابةً عنك من سلسلة بيانات اعتماد AWS الافتراضية، بما في ذلك ملفات تعريف بيانات الاعتماد/التهيئة المشتركة، وSSO، وweb identity، وأدوار المثيل أو المهمة.
    </Tip>

  </Tab>
</Tabs>

## الاكتشاف التلقائي للنماذج

عندما تكون `AWS_BEARER_TOKEN_BEDROCK` مضبوطة، يستخدمها OpenClaw مباشرة. وإلا،
يحاول OpenClaw توليد Mantle bearer token من سلسلة بيانات اعتماد AWS
الافتراضية. ثم يكتشف نماذج Mantle المتاحة عبر الاستعلام من
نقطة النهاية `/v1/models` الخاصة بالمنطقة.

| السلوك          | التفاصيل                    |
| ----------------- | ------------------------- |
| cache الاكتشاف   | يتم تخزين النتائج مؤقتًا لمدة ساعة واحدة |
| تحديث IAM token | كل ساعة                    |

<Note>
إن bearer token هي نفسها `AWS_BEARER_TOKEN_BEDROCK` المستخدمة بواسطة المزود القياسي [Amazon Bedrock](/ar/providers/bedrock).
</Note>

### المناطق المدعومة

`us-east-1` و`us-east-2` و`us-west-2` و`ap-northeast-1`،
و`ap-south-1` و`ap-southeast-3` و`eu-central-1` و`eu-west-1` و`eu-west-2`،
و`eu-south-1` و`eu-north-1` و`sa-east-1`.

## التهيئة اليدوية

إذا كنت تفضل تهيئة صريحة بدلًا من الاكتشاف التلقائي:

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

## ملاحظات متقدمة

<AccordionGroup>
  <Accordion title="Reasoning support">
    يُستدل على دعم reasoning من معرّفات النماذج التي تحتوي على أنماط مثل
    `thinking` أو `reasoner` أو `gpt-oss-120b`. ويضبط OpenClaw القيمة `reasoning: true`
    تلقائيًا للنماذج المطابقة أثناء الاكتشاف.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    إذا كانت نقطة نهاية Mantle غير متاحة أو لم تُرجع أي نماذج، فسيتم
    تخطي المزود بصمت. ولا يصدر OpenClaw خطأ؛ وتستمر المزوّدات المهيأة
    الأخرى في العمل بشكل طبيعي.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    تكشف Mantle أيضًا عن مسار Anthropic Messages ينقل نماذج Claude عبر مسار البث نفسه الموثّق باستخدام bearer token. ويمكن استدعاء Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) عبر هذا المسار باستخدام البث المملوك للمزوّد، لذلك لا تُعامل AWS bearer tokens على أنها مفاتيح Anthropic API.

    عندما تثبّت نموذج Anthropic Messages على مزود Mantle، يستخدم OpenClaw سطح API من نوع `anthropic-messages` بدلًا من `openai-completions` لذلك النموذج. وتظل المصادقة قادمة من `AWS_BEARER_TOKEN_BEDROCK` (أو من IAM bearer token المُولَّد).

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

    تستخدم بيانات context-window الوصفية لنماذج Mantle المكتشفة الحدود المنشورة المعروفة عند توفرها، وتعود بشكل متحفظ للنماذج غير المدرجة، بحيث يتصرف كل من Compaction ومعالجة overflow بشكل صحيح مع الإدخالات الأحدث من دون المبالغة في النماذج غير المعروفة.

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    يُعد Bedrock Mantle مزودًا منفصلًا عن مزود
    [Amazon Bedrock](/ar/providers/bedrock) القياسي. يستخدم Mantle سطحًا
    متوافقًا مع OpenAI من نوع `/v1`، بينما يستخدم مزود Bedrock القياسي
    Bedrock API الأصلية.

    يشترك كلا المزودين في بيانات الاعتماد نفسها `AWS_BEARER_TOKEN_BEDROCK` عند
    توفرها.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ar/providers/bedrock" icon="cloud">
    مزود Bedrock الأصلي لنماذج Anthropic Claude وTitan ونماذج أخرى.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدات، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="OAuth and auth" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
