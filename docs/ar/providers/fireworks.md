---
read_when:
    - أنت تريد استخدام Fireworks مع OpenClaw
    - أنت تحتاج إلى متغير env الخاص بمفتاح Fireworks API أو معرّف النموذج الافتراضي
summary: إعداد Fireworks (المصادقة + اختيار النموذج)
title: Fireworks
x-i18n:
    generated_at: "2026-04-22T04:27:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

توفّر [Fireworks](https://fireworks.ai) نماذج مفتوحة الوزن ونماذج موجهة عبر API متوافقة مع OpenAI. يتضمن OpenClaw Plugin provider مجمّعًا لـ Fireworks.

| الخاصية      | القيمة                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| المصادقة      | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions متوافقة مع OpenAI                     |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| النموذج الافتراضي | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## البدء

<Steps>
  <Step title="أعد مصادقة Fireworks عبر onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    يخزن هذا مفتاح Fireworks الخاص بك في إعدادات OpenClaw ويضبط نموذج Fire Pass الابتدائي كنموذج افتراضي.

  </Step>
  <Step title="تحقق من توفر النموذج">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## مثال غير تفاعلي

في الإعدادات البرمجية أو إعدادات CI، مرّر جميع القيم عبر سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## الفهرس المضمّن

| مرجع النموذج                                              | الاسم                        | الإدخال      | السياق | الحد الأقصى للإخراج | ملاحظات                                                                                                                                               |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144    | أحدث نموذج Kimi على Fireworks. يتم تعطيل Thinking لطلبات Fireworks K2.6؛ وجّه الطلب مباشرة عبر Moonshot إذا كنت تحتاج إلى مخرجات Thinking الخاصة بـ Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | النموذج الابتدائي المجمّع الافتراضي على Fireworks                                                                                                    |

<Tip>
إذا نشرت Fireworks نموذجًا أحدث مثل إصدار جديد من Qwen أو Gemma، فيمكنك التبديل إليه مباشرة باستخدام معرّف نموذج Fireworks الخاص به دون انتظار تحديث الفهرس المجمّع.
</Tip>

## معرّفات نماذج Fireworks المخصصة

يقبل OpenClaw أيضًا معرّفات نماذج Fireworks الديناميكية. استخدم معرّف النموذج أو router المطابق تمامًا كما يظهر في Fireworks مع إضافة البادئة `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="كيف تعمل بادئة معرّف النموذج">
    يبدأ كل مرجع نموذج Fireworks في OpenClaw بالبادئة `fireworks/` متبوعةً بالمعرّف أو مسار router المطابق تمامًا من منصة Fireworks. على سبيل المثال:

    - نموذج Router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - نموذج مباشر: `fireworks/accounts/fireworks/models/<model-name>`

    يزيل OpenClaw البادئة `fireworks/` عند إنشاء طلب API ويرسل المسار المتبقي إلى نقطة نهاية Fireworks.

  </Accordion>

  <Accordion title="ملاحظة حول البيئة">
    إذا كان Gateway يعمل خارج shell التفاعلي لديك، فتأكد من أن `FIREWORKS_API_KEY` متاح لتلك العملية أيضًا.

    <Warning>
    لن يفيد وجود المفتاح في `~/.profile` فقط daemon يعمل عبر launchd/systemd ما لم تُستورد تلك البيئة هناك أيضًا. اضبط المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن عملية gateway يمكنها قراءته.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار providers ومراجع النماذج وسلوك failover.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء العام والأسئلة الشائعة.
  </Card>
</CardGroup>
