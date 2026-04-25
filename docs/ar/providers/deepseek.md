---
read_when:
    - تريد استخدام DeepSeek مع OpenClaw
    - أنت بحاجة إلى متغير البيئة الخاص بمفتاح API أو خيار المصادقة عبر CLI
summary: إعداد DeepSeek (المصادقة + اختيار النموذج)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:56:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) يوفّر نماذج ذكاء اصطناعي قوية عبر API متوافق مع OpenAI.

| الخاصية | القيمة                     |
| -------- | -------------------------- |
| الموفّر | `deepseek`                 |
| المصادقة | `DEEPSEEK_API_KEY`         |
| API      | متوافق مع OpenAI          |
| Base URL | `https://api.deepseek.com` |

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API من [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    سيطلب هذا مفتاح API الخاص بك ويضبط `deepseek/deepseek-v4-flash` كنموذج افتراضي.

  </Step>
  <Step title="تحقق من أن النماذج متاحة">
    ```bash
    openclaw models list --provider deepseek
    ```

    لفحص الكتالوج الثابت المجمّع من دون الحاجة إلى Gateway قيد التشغيل،
    استخدم:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="إعداد غير تفاعلي">
    بالنسبة إلى عمليات التثبيت المكتوبة برمجيًا أو من دون واجهة، مرّر جميع العلامات مباشرةً:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
إذا كان Gateway يعمل كخدمة daemon ‏(launchd/systemd)، فتأكد من أن `DEEPSEEK_API_KEY`
متاح لهذه العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
`env.shellEnv`).
</Warning>

## الكتالوج المدمج

| مرجع النموذج                 | الاسم             | الإدخال | السياق    | الحد الأقصى للإخراج | ملاحظات                                     |
| ---------------------------- | ----------------- | ------- | --------- | ------------------- | ------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000             | النموذج الافتراضي؛ سطح V4 يدعم Thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000             | سطح V4 يدعم Thinking               |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072   | 8,192               | سطح DeepSeek V3.2 غير المفكّر        |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072   | 65,536              | سطح V3.2 مفعّل للاستدلال            |

<Tip>
تدعم نماذج V4 عنصر التحكم `thinking` الخاص بـ DeepSeek. كما يعيد OpenClaw أيضًا تشغيل
`reasoning_content` من DeepSeek في الأدوار اللاحقة، بحيث يمكن أن تستمر جلسات Thinking مع
استدعاءات الأدوات.
</Tip>

## Thinking والأدوات

تحتوي جلسات Thinking في DeepSeek V4 على عقد إعادة تشغيل أكثر صرامة من معظم
الموفّرين المتوافقين مع OpenAI: عندما تتضمن رسالة مساعد مفعّل فيها Thinking
استدعاءات أدوات، يتوقع DeepSeek أن يُعاد إرسال `reasoning_content` السابق للمساعد
في طلب المتابعة. يتولى OpenClaw هذا داخل Plugin الخاص بـ DeepSeek،
لذلك يعمل استخدام الأدوات العادي متعدد الأدوار مع `deepseek/deepseek-v4-flash` و
`deepseek/deepseek-v4-pro`.

إذا بدّلت جلسة موجودة من موفّر آخر متوافق مع OpenAI إلى
نموذج DeepSeek V4، فقد لا تحتوي الأدوار الأقدم لاستدعاء أدوات المساعد على
`reasoning_content` أصلي من DeepSeek. يملأ OpenClaw هذا الحقل المفقود لطلبات Thinking في DeepSeek V4
حتى يتمكن الموفّر من قبول سجل استدعاءات الأدوات المعاد تشغيله
من دون الحاجة إلى `/new`.

عند تعطيل Thinking في OpenClaw (بما في ذلك اختيار **None** في واجهة المستخدم)،
يرسل OpenClaw القيمة `thinking: { type: "disabled" }` إلى DeepSeek ويزيل
`reasoning_content` المعاد تشغيله من السجل الصادر. وهذا يُبقي
الجلسات المعطّل فيها Thinking على مسار DeepSeek غير المفكّر.

استخدم `deepseek/deepseek-v4-flash` للمسار السريع الافتراضي. واستخدم
`deepseek/deepseek-v4-pro` عندما تريد نموذج V4 الأقوى ويمكنك تقبّل
تكلفة أو زمن انتقال أعلى.

## الاختبار الحي

تتضمن مجموعة النماذج الحية المباشرة DeepSeek V4 ضمن مجموعة النماذج الحديثة. من أجل
تشغيل فحوصات النموذج المباشر الخاصة بـ DeepSeek V4 فقط:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

يتحقق هذا الفحص الحي من أن كلا نموذجي V4 يمكنهما الإكمال وأن أدوار
المتابعة الخاصة بـ Thinking/الأدوات تحافظ على حمولة إعادة التشغيل التي يتطلبها DeepSeek.

## مثال على الإعدادات

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل للإعدادات الخاصة بالوكلاء، والنماذج، والموفّرين.
  </Card>
</CardGroup>
