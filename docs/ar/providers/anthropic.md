---
read_when:
    - أنت تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-25T13:55:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

تطوّر Anthropic عائلة نماذج **Claude**. يدعم OpenClaw مسارين للمصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude CLI موجود على المضيف نفسه

<Warning>
أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مجددًا، لذلك
يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مسموحان ما لم
تنشر Anthropic سياسة جديدة.

بالنسبة إلى مضيفي Gateway طويلي العمر، تظل مفاتيح Anthropic API هي المسار الأوضح
والأكثر قابلية للتنبؤ في بيئات الإنتاج.

مستندات Anthropic العامة الحالية:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [نظرة عامة على Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [استخدام Claude Code مع خطة Pro أو Max الخاصة بك](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [استخدام Claude Code مع خطة Team أو Enterprise الخاصة بك](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## البدء

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** وصول API القياسي والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API في [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### مثال على التهيئة

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Claude CLI موجود من دون مفتاح API منفصل.

    <Steps>
      <Step title="تأكد من أن Claude CLI مثبت وتم تسجيل الدخول إليه">
        تحقق باستخدام:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        يكتشف OpenClaw بيانات اعتماد Claude CLI الموجودة ويعيد استخدامها.
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    توجد تفاصيل الإعداد ووقت التشغيل الخاصة بخلفية Claude CLI في [خلفيات CLI](/ar/gateway/cli-backends).
    </Note>

    <Tip>
    إذا كنت تريد أوضح مسار للفوترة، فاستخدم مفتاح Anthropic API بدلًا من ذلك. يدعم OpenClaw أيضًا خيارات بنمط الاشتراك من [OpenAI Codex](/ar/providers/openai) و[Qwen Cloud](/ar/providers/qwen) و[MiniMax](/ar/providers/minimax) و[Z.AI / GLM](/ar/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## الإعدادات الافتراضية لـ thinking ‏(Claude 4.6)

تستخدم نماذج Claude 4.6 القيمة الافتراضية `adaptive` لـ thinking في OpenClaw عندما لا يكون هناك مستوى thinking صريح معيّن.

يمكنك التجاوز لكل رسالة باستخدام `/think:<level>` أو في params الخاصة بالنموذج:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
مستندات Anthropic ذات الصلة:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt caching

يدعم OpenClaw ميزة Prompt caching الخاصة بـ Anthropic لمصادقة مفتاح API.

| القيمة               | مدة التخزين المؤقت | الوصف                                  |
| ------------------- | ------------------ | -------------------------------------- |
| `"short"` (الافتراضي) | 5 دقائق            | تُطبّق تلقائيًا لمصادقة مفتاح API      |
| `"long"`            | ساعة واحدة         | تخزين مؤقت ممتد                        |
| `"none"`            | بلا تخزين مؤقت     | تعطيل Prompt caching                   |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="تجاوزات التخزين المؤقت لكل وكيل">
    استخدم params على مستوى النموذج كخط أساس، ثم تجاوز الوكلاء المحددين عبر `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    ترتيب دمج التهيئة:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (المطابقة لـ `id`، وتتجاوز حسب المفتاح)

    يتيح هذا لوكيل واحد الاحتفاظ بتخزين مؤقت طويل العمر بينما يعطّل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة المرور المتقطعة/منخفضة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Claude على Bedrock">
    - تقبل نماذج Anthropic Claude على Bedrock ‏(`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند تهيئتها.
    - تُفرض على نماذج Bedrock غير التابعة لـ Anthropic القيمة `cacheRetention: "none"` وقت التشغيل.
    - كما تزرع الإعدادات الافتراضية الذكية لمفتاح API القيمة `cacheRetention: "short"` تلقائيًا لمراجع Claude-on-Bedrock عندما لا تكون هناك قيمة صريحة معينة.
  </Accordion>
</AccordionGroup>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم مفتاح التبديل المشترك `/fast` في OpenClaw حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

    | الأمر | يُحوَّل إلى |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - يُحقن فقط لطلبات `api.anthropic.com` المباشرة. وتترك مسارات proxy قيمة `service_tier` من دون تغيير.
    - تتغلب params الصريحة `serviceTier` أو `service_tier` على `/fast` عند تعيين الاثنين معًا.
    - في الحسابات التي لا تملك سعة Priority Tier، قد تُحل `service_tier: "auto"` إلى `standard`.
    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    يسجل Plugin Anthropic المضمن دعم فهم الصور وPDF. ويقوم OpenClaw
    بحل قدرات الوسائط تلقائيًا من مصادقة Anthropic المهيأة — ولا
    حاجة إلى تهيئة إضافية.

    | الخاصية       | القيمة                |
    | -------------- | -------------------- |
    | النموذج الافتراضي  | `claude-opus-4-6`    |
    | الإدخال المدعوم | الصور، ومستندات PDF |

    عند إرفاق صورة أو PDF بمحادثة، يوجّه OpenClaw ذلك تلقائيًا
    عبر مزوّد فهم الوسائط الخاص بـ Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M (تجريبية)">
    تخضع نافذة سياق 1M الخاصة بـ Anthropic لبوابة بيتا. فعّلها لكل نموذج:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    يحوّل OpenClaw هذا إلى `anthropic-beta: context-1m-2025-08-07` في الطلبات.

    <Warning>
    يتطلب ذلك وصول long-context على بيانات اعتماد Anthropic الخاصة بك. يتم رفض مصادقة token القديمة (`sk-ant-oat-*`) لطلبات سياق 1M — ويسجل OpenClaw تحذيرًا ويرجع إلى نافذة السياق القياسية.
    </Warning>

  </Accordion>

  <Accordion title="سياق 1M في Claude Opus 4.7">
    يستخدم `anthropic/claude-opus-4.7` ومتغيره `claude-cli` نافذة سياق
    1M افتراضيًا — ولا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / أصبح token غير صالح فجأة">
    تنتهي صلاحية مصادقة token الخاصة بـ Anthropic ويمكن إلغاؤها. بالنسبة إلى الإعدادات الجديدة، استخدم مفتاح Anthropic API بدلًا من ذلك.
  </Accordion>

  <Accordion title='لم يتم العثور على مفتاح API للمزوّد "anthropic"'>
    مصادقة Anthropic هي **لكل وكيل** — لا ترث الوكلاء الجدد مفاتيح الوكيل الرئيسي. أعد تشغيل الإعداد الأولي لذلك الوكيل (أو هيئ مفتاح API على مضيف gateway)، ثم تحقق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد لملف التعريف "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف تعريف المصادقة النشط. أعد تشغيل الإعداد الأولي، أو هيئ مفتاح API لهذا المسار الخاص بملف التعريف.
  </Accordion>

  <Accordion title="لا يوجد ملف تعريف مصادقة متاح (جميعها في فترة تهدئة)">
    افحص `openclaw models status --json` للحصول على `auth.unusableProfiles`. يمكن أن تكون فترات تهدئة حدود المعدل في Anthropic خاصة بالنموذج، لذلك قد يظل نموذج Anthropic آخر شقيق صالحًا للاستخدام. أضف ملف تعريف Anthropic آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="خلفيات CLI" href="/ar/gateway/cli-backends" icon="terminal">
    تفاصيل إعداد ووقت تشغيل خلفية Claude CLI.
  </Card>
  <Card title="Prompt caching" href="/ar/reference/prompt-caching" icon="database">
    كيف يعمل Prompt caching عبر المزوّدين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
