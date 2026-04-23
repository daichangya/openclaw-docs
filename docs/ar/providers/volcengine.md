---
read_when:
    - تريد استخدام Volcano Engine أو نماذج Doubao مع OpenClaw
    - تحتاج إلى إعداد مفتاح API الخاص بـ Volcengine
summary: إعداد Volcano Engine ‏(نماذج Doubao ونقاط النهاية العامة ونقاط نهاية البرمجة)
title: Volcengine ‏(Doubao)
x-i18n:
    generated_at: "2026-04-23T07:32:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

يتيح مزوّد Volcengine الوصول إلى نماذج Doubao والنماذج التابعة لجهات خارجية
المستضافة على Volcano Engine، مع نقاط نهاية منفصلة لأحمال العمل العامة
وأحمال عمل البرمجة.

| التفاصيل | القيمة                                               |
| -------- | ---------------------------------------------------- |
| المزوّدون | `volcengine` ‏(عام) + `volcengine-plan` ‏(برمجة)     |
| المصادقة | `VOLCANO_ENGINE_API_KEY`                             |
| API      | متوافقة مع OpenAI                                    |

## البدء

<Steps>
  <Step title="ضبط مفتاح API">
    شغّل الإعداد الأوّلي التفاعلي:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    يسجّل هذا كلاً من المزوّد العام (`volcengine`) ومزوّد البرمجة (`volcengine-plan`) من مفتاح API واحد.

  </Step>
  <Step title="ضبط نموذج افتراضي">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="التحقق من أن النموذج متاح">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
بالنسبة إلى الإعداد غير التفاعلي (CI أو النصوص البرمجية)، مرّر المفتاح مباشرةً:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## المزوّدون ونقاط النهاية

| المزوّد            | نقطة النهاية                              | حالة الاستخدام    |
| ------------------ | ----------------------------------------- | ----------------- |
| `volcengine`       | `ark.cn-beijing.volces.com/api/v3`        | النماذج العامة    |
| `volcengine-plan`  | `ark.cn-beijing.volces.com/api/coding/v3` | نماذج البرمجة     |

<Note>
يتم إعداد كلا المزوّدين من مفتاح API واحد. ويقوم الإعداد بتسجيلهما تلقائيًا.
</Note>

## النماذج المتاحة

<Tabs>
  <Tab title="عام (volcengine)">
    | مرجع النموذج                                  | الاسم                            | الإدخال      | السياق   |
    | -------------------------------------------- | -------------------------------- | ------------ | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                  | نص، صورة     | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028  | نص، صورة     | 256,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                        | نص، صورة     | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                          | نص، صورة     | 200,000  |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                    | نص، صورة     | 128,000  |
  </Tab>
  <Tab title="برمجة (volcengine-plan)">
    | مرجع النموذج                                       | الاسم                     | الإدخال | السياق   |
    | -------------------------------------------------- | ------------------------- | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                  | Ark Coding Plan           | نص      | 256,000  |
    | `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code          | نص      | 256,000  |
    | `volcengine-plan/glm-4.7`                          | GLM 4.7 Coding            | نص      | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                 | Kimi K2 Thinking          | نص      | 256,000  |
    | `volcengine-plan/kimi-k2.5`                        | Kimi K2.5 Coding          | نص      | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028`  | Doubao Seed Code Preview  | نص      | 256,000  |
  </Tab>
</Tabs>

## ملاحظات متقدمة

<AccordionGroup>
  <Accordion title="النموذج الافتراضي بعد الإعداد الأوّلي">
    يضبط `openclaw onboard --auth-choice volcengine-api-key` حاليًا
    النموذج الافتراضي `volcengine-plan/ark-code-latest` مع تسجيل
    كتالوج `volcengine` العام أيضًا.
  </Accordion>

  <Accordion title="سلوك الاحتياط في منتقي النماذج">
    أثناء اختيار النموذج في onboarding/configure، يفضّل خيار مصادقة Volcengine
    كلاً من الصفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن هذه النماذج
    محمّلة بعد، فإن OpenClaw يعود إلى الكتالوج غير المصفّى بدلًا من عرض
    منتقٍ فارغ محصور بالمزوّد.
  </Accordion>

  <Accordion title="متغيرات البيئة لعمليات daemon">
    إذا كانت Gateway تعمل كـ daemon ‏(launchd/systemd)، فتأكد من أن
    `VOLCANO_ENGINE_API_KEY` متاح لتلك العملية (مثلًا في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
عند تشغيل OpenClaw كخدمة في الخلفية، لا تُورَّث متغيرات البيئة المضبوطة في
shell التفاعلي تلقائيًا. راجع ملاحظة daemon أعلاه.
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الاحتياط.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل للوكلاء، والنماذج، والمزوّدين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات تصحيح الأخطاء.
  </Card>
  <Card title="الأسئلة الشائعة" href="/ar/help/faq" icon="circle-question">
    الأسئلة الشائعة حول إعداد OpenClaw.
  </Card>
</CardGroup>
