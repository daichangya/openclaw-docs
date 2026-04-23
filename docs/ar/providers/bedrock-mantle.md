---
read_when:
    - تريد استخدام نماذج OSS المستضافة على Bedrock Mantle مع OpenClaw
    - تحتاج إلى نقطة نهاية Mantle المتوافقة مع OpenAI لـ GPT-OSS أو Qwen أو Kimi أو GLM
summary: استخدم نماذج Amazon Bedrock Mantle المتوافقة مع OpenAI مع OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T14:01:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

يتضمن OpenClaw مزود **Amazon Bedrock Mantle** مدمجًا يتصل
بنقطة نهاية Mantle المتوافقة مع OpenAI. تستضيف Mantle نماذج مفتوحة المصدر
ونماذج تابعة لجهات خارجية (مثل GPT-OSS وQwen وKimi وGLM وما شابه) عبر
واجهة ` /v1/chat/completions ` قياسية مدعومة ببنية Bedrock التحتية.

| الخاصية        | القيمة                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------- |
| معرّف المزود   | `amazon-bedrock-mantle`                                                                        |
| API            | `openai-completions` (متوافق مع OpenAI) أو `anthropic-messages` (مسار Anthropic Messages)     |
| المصادقة       | `AWS_BEARER_TOKEN_BEDROCK` صريح أو إنشاء bearer token عبر سلسلة بيانات اعتماد IAM             |
| المنطقة الافتراضية | `us-east-1` (يمكن تجاوزها باستخدام `AWS_REGION` أو `AWS_DEFAULT_REGION`)                  |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Explicit bearer token">
    **الأفضل لـ:** البيئات التي لديك فيها بالفعل bearer token لـ Mantle.

    <Steps>
      <Step title="تعيين bearer token على مضيف Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        ويمكنك اختياريًا تعيين منطقة (الافتراضية هي `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="التحقق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```

        تظهر النماذج المكتشفة تحت المزود `amazon-bedrock-mantle`. ولا
        يلزم أي إعداد إضافي ما لم تكن تريد تجاوز القيم الافتراضية.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **الأفضل لـ:** استخدام بيانات اعتماد متوافقة مع AWS SDK (إعدادات مشتركة، أو SSO، أو web identity، أو أدوار المثيل أو المهمة).

    <Steps>
      <Step title="إعداد بيانات اعتماد AWS على مضيف Gateway">
        أي مصدر مصادقة متوافق مع AWS SDK يعمل:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="التحقق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```

        ينشئ OpenClaw bearer token لـ Mantle من سلسلة بيانات الاعتماد تلقائيًا.
      </Step>
    </Steps>

    <Tip>
    عندما لا يكون `AWS_BEARER_TOKEN_BEDROCK` مضبوطًا، ينشئ OpenClaw bearer token لك من سلسلة بيانات الاعتماد الافتراضية في AWS، بما في ذلك ملفات بيانات الاعتماد/الإعدادات المشتركة، وSSO، وweb identity، وأدوار المثيل أو المهمة.
    </Tip>

  </Tab>
</Tabs>

## الاكتشاف التلقائي للنموذج

عندما يكون `AWS_BEARER_TOKEN_BEDROCK` مضبوطًا، يستخدمه OpenClaw مباشرةً. وإلا،
يحاول OpenClaw إنشاء bearer token لـ Mantle من سلسلة بيانات الاعتماد
الافتراضية في AWS. ثم يكتشف نماذج Mantle المتاحة عبر الاستعلام عن
نقطة النهاية `/v1/models` الخاصة بالمنطقة.

| السلوك               | التفاصيل                 |
| -------------------- | ------------------------ |
| ذاكرة التخزين المؤقت للاكتشاف | تُخزَّن النتائج مؤقتًا لمدة ساعة |
| تحديث رمز IAM        | كل ساعة                  |

<Note>
bearer token هو نفسه `AWS_BEARER_TOKEN_BEDROCK` المستخدم من قبل مزود [Amazon Bedrock](/ar/providers/bedrock) القياسي.
</Note>

### المناطق المدعومة

`us-east-1` و`us-east-2` و`us-west-2` و`ap-northeast-1`،
`ap-south-1` و`ap-southeast-3` و`eu-central-1` و`eu-west-1` و`eu-west-2`،
`eu-south-1` و`eu-north-1` و`sa-east-1`.

## الإعداد اليدوي

إذا كنت تفضل الإعداد الصريح بدلًا من الاكتشاف التلقائي:

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
  <Accordion title="دعم الاستدلال">
    يُستنتج دعم الاستدلال من معرّفات النماذج التي تحتوي على أنماط مثل
    `thinking` أو `reasoner` أو `gpt-oss-120b`. ويضبط OpenClaw الخاصية `reasoning: true`
    تلقائيًا للنماذج المطابقة أثناء الاكتشاف.
  </Accordion>

  <Accordion title="عدم توفر نقطة النهاية">
    إذا كانت نقطة نهاية Mantle غير متاحة أو لم تُرجع أي نماذج، فسيتم
    تخطي المزود بصمت. ولا يُصدر OpenClaw خطأ؛ وتستمر المزودات
    الأخرى المُعدّة في العمل بشكل طبيعي.
  </Accordion>

  <Accordion title="Claude Opus 4.7 عبر مسار Anthropic Messages">
    يعرّض Mantle أيضًا مسار Anthropic Messages يحمل نماذج Claude عبر مسار البث نفسه الموثّق باستخدام bearer. ويمكن استدعاء Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) عبر هذا المسار مع بث مملوك للمزوّد، لذلك لا تُعامل bearer tokens الخاصة بـ AWS كما لو كانت مفاتيح Anthropic API.

    عندما تثبّت نموذج Anthropic Messages على مزود Mantle، يستخدم OpenClaw واجهة API `anthropic-messages` بدلًا من `openai-completions` لهذا النموذج. ولا تزال المصادقة تأتي من `AWS_BEARER_TOKEN_BEDROCK` (أو bearer token الخاص بـ IAM الذي تم إنشاؤه).

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

  </Accordion>

  <Accordion title="العلاقة بمزود Amazon Bedrock">
    يُعد Bedrock Mantle مزودًا منفصلًا عن مزود
    [Amazon Bedrock](/ar/providers/bedrock) القياسي. يستخدم Mantle
    واجهة `/v1` متوافقة مع OpenAI، بينما يستخدم مزود Bedrock القياسي
    Bedrock API الأصلي.

    يشترك كلا المزودين في بيانات الاعتماد نفسها `AWS_BEARER_TOKEN_BEDROCK`
    عند وجودها.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ar/providers/bedrock" icon="cloud">
    مزود Bedrock أصلي لـ Anthropic Claude وTitan ونماذج أخرى.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودات ومراجع النماذج وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
