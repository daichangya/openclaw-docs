---
read_when:
    - تريد استخدام GitHub Copilot كموفّر نماذج
    - تحتاج إلى تدفّق `openclaw models auth login-github-copilot`
summary: سجّل الدخول إلى GitHub Copilot من OpenClaw باستخدام تدفّق الجهاز
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T19:20:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5169839322f64b24b194302b61c5bad67c6cb6595989f9a1ef65867d8b68659
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot هو مساعد GitHub البرمجي المدعوم بالذكاء الاصطناعي. يوفّر الوصول إلى
نماذج Copilot لحسابك وخطتك على GitHub. يمكن لـ OpenClaw استخدام Copilot كموفّر
نماذج بطريقتين مختلفتين.

## طريقتان لاستخدام Copilot في OpenClaw

<Tabs>
  <Tab title="الموفّر المدمج (github-copilot)">
    استخدم تدفّق تسجيل الدخول الأصلي عبر الجهاز للحصول على رمز GitHub مميّز، ثم بدّله
    برموز Copilot API مميّزة عند تشغيل OpenClaw. هذا هو المسار **الافتراضي** والأبسط
    لأنه لا يتطلب VS Code.

    <Steps>
      <Step title="شغّل أمر تسجيل الدخول">
        ```bash
        openclaw models auth login-github-copilot
        ```

        سيُطلب منك زيارة عنوان URL وإدخال رمز لمرة واحدة. أبقِ
        الطرفية مفتوحة حتى يكتمل الإجراء.
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        أو في الإعدادات:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin وكيل Copilot (copilot-proxy)">
    استخدم إضافة VS Code **Copilot Proxy** كجسر محلي. يتواصل OpenClaw مع
    نقطة النهاية `/v1` الخاصة بالوكيل ويستخدم قائمة النماذج التي تهيئها هناك.

    <Note>
    اختر هذا الخيار عندما تكون تشغّل Copilot Proxy بالفعل في VS Code أو تحتاج إلى
    التوجيه عبره. يجب عليك تفعيل الـ Plugin والإبقاء على إضافة VS Code قيد التشغيل.
    </Note>

  </Tab>
</Tabs>

## العلامات الاختيارية

| Flag            | الوصف                                                  |
| --------------- | ------------------------------------------------------ |
| `--yes`         | تخطَّ مطالبة التأكيد                                   |
| `--set-default` | طبّق أيضًا النموذج الافتراضي الموصى به من قِبل الموفّر |

```bash
# تخطَّ التأكيد
openclaw models auth login-github-copilot --yes

# سجّل الدخول وعيّن النموذج الافتراضي في خطوة واحدة
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="يتطلب TTY تفاعليًا">
    يتطلب تدفّق تسجيل الدخول عبر الجهاز TTY تفاعليًا. شغّله مباشرةً في
    طرفية، وليس داخل برنامج نصي غير تفاعلي أو مسار CI.
  </Accordion>

  <Accordion title="يعتمد توفّر النماذج على خطتك">
    يعتمد توفّر نماذج Copilot على خطتك في GitHub. إذا تم
    رفض نموذج، فجرّب معرّفًا آخر بدلًا منه (على سبيل المثال `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="اختيار النقل">
    تستخدم معرّفات نماذج Claude نقل Anthropic Messages تلقائيًا. أما نماذج GPT،
    وo-series، وGemini فتبقى على نقل OpenAI Responses. يحدّد OpenClaw
    النقل الصحيح استنادًا إلى مرجع النموذج.
  </Accordion>

  <Accordion title="ترتيب أولوية تحليل متغيرات البيئة">
    يحدّد OpenClaw مصادقة Copilot من متغيرات البيئة وفق
    ترتيب الأولوية التالي:

    | Priority | Variable               | Notes                                   |
    | -------- | ---------------------- | --------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | أعلى أولوية، ومخصّص لـ Copilot          |
    | 2        | `GH_TOKEN`             | رمز GitHub CLI المميّز (احتياطي)        |
    | 3        | `GITHUB_TOKEN`         | رمز GitHub المميّز القياسي (أدنى أولوية) |

    عند ضبط عدة متغيرات، يستخدم OpenClaw الأعلى أولوية بينها.
    يخزّن تدفّق تسجيل الدخول عبر الجهاز (`openclaw models auth login-github-copilot`)
    رمزه المميّز في مخزن ملفات تعريف المصادقة، وتكون له الأولوية على جميع متغيرات
    البيئة.

  </Accordion>

  <Accordion title="تخزين الرمز المميّز">
    يخزّن تسجيل الدخول رمز GitHub مميّزًا في مخزن ملفات تعريف المصادقة ويبدّله
    برمز Copilot API مميّز عند تشغيل OpenClaw. لا تحتاج إلى إدارة
    الرمز المميّز يدويًا.
  </Accordion>
</AccordionGroup>

<Warning>
يتطلب TTY تفاعليًا. شغّل أمر تسجيل الدخول مباشرةً في طرفية، وليس
داخل برنامج نصي بلا واجهة أو مهمة CI.
</Warning>

## تضمينات البحث في الذاكرة

يمكن لـ GitHub Copilot أيضًا أن يعمل كموفّر تضمينات من أجل
[البحث في الذاكرة](/ar/concepts/memory-search). إذا كان لديك اشتراك Copilot وكنت
قد سجّلت الدخول، فيمكن لـ OpenClaw استخدامه للتضمينات من دون مفتاح API منفصل.

### الاكتشاف التلقائي

عندما تكون `memorySearch.provider` هي `"auto"` (الافتراضي)، تتم تجربة GitHub Copilot
بأولوية 15 -- بعد التضمينات المحلية ولكن قبل OpenAI والموفّرين
المدفوعين الآخرين. إذا كان رمز GitHub مميّزًا متاحًا، يكتشف OpenClaw
نماذج التضمين المتاحة من Copilot API ويختار الأفضل تلقائيًا.

### إعداد صريح

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // اختياري: تجاوز النموذج المكتشف تلقائيًا
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### كيف يعمل

1. يحدّد OpenClaw رمز GitHub المميّز الخاص بك (من متغيرات البيئة أو ملف تعريف المصادقة).
2. يبدّله برمز Copilot API مميّز قصير العمر.
3. يستعلم عن نقطة النهاية `/models` الخاصة بـ Copilot لاكتشاف نماذج التضمين المتاحة.
4. يختار أفضل نموذج (مع تفضيل `text-embedding-3-small`).
5. يرسل طلبات التضمين إلى نقطة النهاية `/embeddings` الخاصة بـ Copilot.

يعتمد توفّر النماذج على خطتك في GitHub. إذا لم تكن أي نماذج تضمين
متاحة، يتخطى OpenClaw خدمة Copilot ويجرّب الموفّر التالي.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
