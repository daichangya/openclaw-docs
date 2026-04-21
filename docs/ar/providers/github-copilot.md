---
read_when:
    - أنت تريد استخدام GitHub Copilot كمزوّد model
    - أنت بحاجة إلى تدفق `openclaw models auth login-github-copilot`
summary: تسجيل الدخول إلى GitHub Copilot من OpenClaw باستخدام تدفق الجهاز
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T07:25:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7faafbd3bdcd8886e75fb0d40c3eec66355df3fca6160ebbbb9a0018b7839fe
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot هو مساعد البرمجة بالذكاء الاصطناعي من GitHub. يوفّر الوصول إلى models الخاصة بـ Copilot
لحساب GitHub والخطة الخاصة بك. يمكن لـ OpenClaw استخدام Copilot كمزوّد model
بطريقتين مختلفتين.

## طريقتان لاستخدام Copilot في OpenClaw

<Tabs>
  <Tab title="المزوّد المدمج (github-copilot)">
    استخدم تدفق تسجيل الدخول الأصلي للجهاز للحصول على GitHub token، ثم بدّله إلى
    Copilot API tokens عند تشغيل OpenClaw. هذا هو المسار **الافتراضي** والأبسط
    لأنه لا يتطلب VS Code.

    <Steps>
      <Step title="تشغيل أمر تسجيل الدخول">
        ```bash
        openclaw models auth login-github-copilot
        ```

        سيُطلب منك زيارة عنوان URL وإدخال رمز لمرة واحدة. أبقِ
        الطرفية مفتوحة حتى يكتمل الأمر.
      </Step>
      <Step title="ضبط model افتراضي">
        ```bash
        openclaw models set github-copilot/claude-opus-4.6
        ```

        أو في الإعدادات:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.6" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    استخدم extension **Copilot Proxy** في VS Code كجسر محلي. يتحدث OpenClaw إلى
    نقطة النهاية `/v1` الخاصة بالوكيل ويستخدم قائمة models التي تضبطها هناك.

    <Note>
    اختر هذا إذا كنت تشغّل Copilot Proxy بالفعل في VS Code أو تحتاج إلى التوجيه
    عبره. يجب عليك تمكين Plugin والإبقاء على extension الخاص بـ VS Code قيد التشغيل.
    </Note>

  </Tab>
</Tabs>

## خيارات اختيارية

| الخيار | الوصف |
| --------------- | --------------------------------------------------- |
| `--yes`         | تخطي مطالبة التأكيد                        |
| `--set-default` | تطبيق model الافتراضي الموصى به من المزوّد أيضًا |

```bash
# تخطي التأكيد
openclaw models auth login-github-copilot --yes

# تسجيل الدخول وضبط model الافتراضي في خطوة واحدة
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="يتطلب TTY تفاعليًا">
    يتطلب تدفق تسجيل الدخول عبر الجهاز TTY تفاعليًا. شغّله مباشرةً في
    طرفية، وليس في سكربت غير تفاعلي أو خط CI.
  </Accordion>

  <Accordion title="يعتمد توفر model على خطتك">
    يعتمد توفر models في Copilot على خطة GitHub الخاصة بك. إذا تم
    رفض model ما، فجرّب معرّفًا آخر (مثل `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="اختيار النقل">
    تستخدم معرّفات Claude model نقل Anthropic Messages تلقائيًا. أما
    GPT وo-series وGemini فتبقي على نقل OpenAI Responses. يقوم OpenClaw
    باختيار النقل الصحيح استنادًا إلى مرجع model.
  </Accordion>

  <Accordion title="ترتيب أولوية حل متغيرات البيئة">
    يحل OpenClaw مصادقة Copilot من متغيرات البيئة وفق
    ترتيب الأولوية التالي:

    | الأولوية | المتغير              | الملاحظات                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | أعلى أولوية، خاص بـ Copilot |
    | 2        | `GH_TOKEN`            | GitHub CLI token (احتياطي)      |
    | 3        | `GITHUB_TOKEN`        | GitHub token القياسي (الأدنى)   |

    عند ضبط عدة متغيرات، يستخدم OpenClaw المتغير الأعلى أولوية.
    ويخزن تدفق تسجيل الدخول عبر الجهاز (`openclaw models auth login-github-copilot`)
    الرمز الخاص به في مخزن ملف المصادقة التعريفي ويأخذ الأولوية على جميع متغيرات
    البيئة.

  </Accordion>

  <Accordion title="تخزين الرمز">
    يخزن تسجيل الدخول GitHub token في مخزن ملف المصادقة التعريفي ثم يبدّله
    إلى Copilot API token عند تشغيل OpenClaw. لا تحتاج إلى إدارة
    الرمز يدويًا.
  </Accordion>
</AccordionGroup>

<Warning>
يتطلب TTY تفاعليًا. شغّل أمر تسجيل الدخول مباشرةً في طرفية، وليس
داخل سكربت بدون واجهة أو مهمة CI.
</Warning>

## Embeddings الخاصة ببحث الذاكرة

يمكن لـ GitHub Copilot أيضًا أن يعمل كمزوّد embedding من أجل
[بحث الذاكرة](/ar/concepts/memory-search). إذا كان لديك اشتراك Copilot و
سجلت الدخول، فيمكن لـ OpenClaw استخدامه من أجل embeddings دون مفتاح API منفصل.

### الاكتشاف التلقائي

عندما تكون `memorySearch.provider` هي `"auto"` (الافتراضي)، تتم تجربة GitHub Copilot
عند الأولوية 15 -- بعد embeddings المحلية ولكن قبل OpenAI والمزوّدات
المدفوعة الأخرى. وإذا كان GitHub token متاحًا، يكتشف OpenClaw
نماذج embedding المتاحة من Copilot API ويختار الأفضل تلقائيًا.

### إعدادات صريحة

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // اختياري: تجاوز model المكتشف تلقائيًا
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### كيف يعمل

1. يقوم OpenClaw بحل GitHub token الخاص بك (من متغيرات env أو ملف المصادقة التعريفي).
2. يبدّله إلى Copilot API token قصير العمر.
3. يستعلم عن نقطة النهاية `/models` الخاصة بـ Copilot لاكتشاف نماذج embedding المتاحة.
4. يختار أفضل model (يفضّل `text-embedding-3-small`).
5. يرسل طلبات embedding إلى نقطة النهاية `/embeddings` الخاصة بـ Copilot.

يعتمد توفر models على خطة GitHub الخاصة بك. وإذا لم تتوفر أي نماذج embedding،
يتخطى OpenClaw Copilot ويجرّب المزوّد التالي.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار model" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدات، ومراجع model، وسلوك الفشل الاحتياطي.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
