---
read_when:
    - أنت تريد نماذج Xiaomi MiMo في OpenClaw
    - تحتاج إلى إعداد `XIAOMI_API_KEY`
summary: استخدم نماذج Xiaomi MiMo مع OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T13:57:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo هي منصة API الخاصة بنماذج **MiMo**. يستخدم OpenClaw
نقطة النهاية المتوافقة مع OpenAI من Xiaomi مع مصادقة مفتاح API.

| الخاصية | القيمة                          |
| -------- | ------------------------------- |
| المزوّد  | `xiaomi`                        |
| المصادقة | `XIAOMI_API_KEY`                |
| API      | متوافقة مع OpenAI               |
| Base URL | `https://api.xiaomimimo.com/v1` |

## البدء

<Steps>
  <Step title="احصل على مفتاح API">
    أنشئ مفتاح API في [وحدة تحكم Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    أو مرّر المفتاح مباشرة:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="تحقق من أن النموذج متاح">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## الكتالوج المضمّن

| مرجع النموذج            | الإدخال      | السياق    | الحد الأقصى للإخراج | الاستدلال | ملاحظات          |
| ---------------------- | ------------ | --------- | ------------------- | --------- | ---------------- |
| `xiaomi/mimo-v2-flash` | نص           | 262,144   | 8,192               | لا        | النموذج الافتراضي |
| `xiaomi/mimo-v2-pro`   | نص           | 1,048,576 | 32,000              | نعم       | سياق كبير        |
| `xiaomi/mimo-v2-omni`  | نص، صورة     | 262,144   | 32,000              | نعم       | متعدد الوسائط    |

<Tip>
مرجع النموذج الافتراضي هو `xiaomi/mimo-v2-flash`. ويُحقن المزوّد تلقائيًا عند ضبط `XIAOMI_API_KEY` أو عند وجود ملف تعريف مصادقة.
</Tip>

## تحويل النص إلى كلام

يسجّل Plugin `xiaomi` المضمّن أيضًا Xiaomi MiMo كمزوّد كلام من أجل
`messages.tts`. ويستدعي عقد TTS الخاص بإكمالات الدردشة لدى Xiaomi مع النص بوصفه
رسالة `assistant`، ومع توجيه أسلوب اختياري بوصفه رسالة `user`.

| الخاصية | القيمة                                   |
| -------- | ---------------------------------------- |
| معرّف TTS | `xiaomi` (الاسم البديل `mimo`)          |
| المصادقة | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` مع `audio`   |
| الافتراضي | `mimo-v2.5-tts`، الصوت `mimo_default`   |
| الإخراج  | `MP3` افتراضيًا؛ و`WAV` عند الضبط       |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "نبرة مشرقة وطبيعية وحوارية.",
        },
      },
    },
  },
}
```

تشمل الأصوات المضمّنة المدعومة `mimo_default` و`default_zh` و`default_en`
و`Mia` و`Chloe` و`Milo` و`Dean`. كما أن `mimo-v2-tts` مدعوم للحسابات
الأقدم الخاصة بـ MiMo TTS؛ ويستخدم الافتراضي نموذج MiMo-V2.5 TTS الحالي. وبالنسبة إلى أهداف
الملاحظات الصوتية مثل Feishu وTelegram، يقوم OpenClaw بتحويل خرج Xiaomi إلى 48kHz
Opus باستخدام `ffmpeg` قبل التسليم.

## مثال على الإعداد

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="سلوك الحقن التلقائي">
    يُحقن المزوّد `xiaomi` تلقائيًا عندما يكون `XIAOMI_API_KEY` مضبوطًا في بيئتك أو عندما يوجد ملف تعريف مصادقة. لا تحتاج إلى ضبط المزوّد يدويًا إلا إذا كنت تريد تجاوز بيانات تعريف النموذج أو Base URL.
  </Accordion>

  <Accordion title="تفاصيل النماذج">
    - **mimo-v2-flash** — خفيف وسريع، ومثالي للمهام النصية العامة. لا يدعم الاستدلال.
    - **mimo-v2-pro** — يدعم الاستدلال مع نافذة سياق بحجم 1M token لأحمال العمل الخاصة بالمستندات الطويلة.
    - **mimo-v2-omni** — نموذج متعدد الوسائط مفعّل للاستدلال ويقبل مدخلات النص والصور معًا.

    <Note>
    تستخدم جميع النماذج البادئة `xiaomi/` (مثلًا `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - إذا لم تظهر النماذج، فتأكد من أن `XIAOMI_API_KEY` مضبوط وصالح.
    - عندما يعمل Gateway كخدمة، تأكد من أن المفتاح متاح لتلك العملية (مثلًا في `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Warning>
    المفاتيح المضبوطة فقط في الصدفة التفاعلية الخاصة بك لا تكون مرئية لعمليات Gateway المُدارة كخدمة. استخدم `~/.openclaw/.env` أو إعداد `env.shellEnv` للإتاحة الدائمة.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لإعداد OpenClaw.
  </Card>
  <Card title="وحدة تحكم Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    لوحة تحكم Xiaomi MiMo وإدارة مفاتيح API.
  </Card>
</CardGroup>
