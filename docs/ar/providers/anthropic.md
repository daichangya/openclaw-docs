---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T14:01:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

تطوّر Anthropic عائلة نماذج **Claude**. يدعم OpenClaw مسارين للمصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (لنماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude CLI موجود على المضيف نفسه

<Warning>
أخبرنا فريق Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك
يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان ما لم
تنشر Anthropic سياسة جديدة.

وبالنسبة لمضيفي Gateway طويلة العمر، تظل مفاتيح Anthropic API هي المسار الإنتاجي
الأوضح والأكثر قابلية للتنبؤ.

الوثائق العامة الحالية من Anthropic:

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

    ### مثال على التكوين

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
      <Step title="تأكد من أن Claude CLI مثبت وتم تسجيل الدخول فيه">
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
    تفاصيل الإعداد ووقت التشغيل لواجهة Claude CLI الخلفية موجودة في [واجهات CLI الخلفية](/ar/gateway/cli-backends).
    </Note>

    <Tip>
    إذا كنت تريد مسار فوترة أوضح، فاستخدم مفتاح Anthropic API بدلًا من ذلك. يدعم OpenClaw أيضًا خيارات بأسلوب الاشتراك من [OpenAI Codex](/ar/providers/openai) و[Qwen Cloud](/ar/providers/qwen) و[MiniMax](/ar/providers/minimax) و[Z.AI / GLM](/ar/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## الإعدادات الافتراضية للتفكير (Claude 4.6)

تستخدم نماذج Claude 4.6 افتراضيًا التفكير `adaptive` في OpenClaw عندما لا يتم تعيين مستوى تفكير صريح.

يمكنك التجاوز لكل رسالة باستخدام `/think:<level>` أو في معاملات النموذج:

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
وثائق Anthropic ذات الصلة:
- [التفكير التكيفي](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [التفكير الموسّع](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## التخزين المؤقت للموجهات

يدعم OpenClaw ميزة التخزين المؤقت للموجهات الخاصة بـ Anthropic لمصادقة مفتاح API.

| القيمة               | مدة التخزين المؤقت | الوصف                                      |
| ------------------- | ------------------ | ------------------------------------------ |
| `"short"` (افتراضي) | 5 دقائق            | يُطبّق تلقائيًا لمصادقة مفتاح API          |
| `"long"`            | ساعة واحدة         | تخزين مؤقت ممتد                            |
| `"none"`            | بلا تخزين مؤقت     | تعطيل التخزين المؤقت للموجهات             |

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
  <Accordion title="تجاوزات التخزين المؤقت لكل agent">
    استخدم معاملات مستوى النموذج كخط أساس، ثم تجاوز agents محددين عبر `agents.list[].params`:

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

    ترتيب دمج التكوين:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (مطابقة حسب `id`، مع التجاوز حسب المفتاح)

    يتيح هذا لوكيل واحد الاحتفاظ بتخزين مؤقت طويل العمر بينما يعطّل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة المرور المتدفقة/منخفضة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Claude على Bedrock">
    - تقبل نماذج Anthropic Claude على Bedrock (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند ضبطه.
    - تُفرض قيمة `cacheRetention: "none"` وقت التشغيل على نماذج Bedrock غير التابعة لـ Anthropic.
    - كما تضبط الإعدادات الذكية الافتراضية لمفتاح API القيمة `cacheRetention: "short"` لمراجع Claude-on-Bedrock عندما لا تكون هناك قيمة صريحة مضبوطة.
  </Accordion>
</AccordionGroup>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم مفتاح التبديل المشترك `/fast` في OpenClaw حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

    | الأمر | يقابل |
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
    - يُحقن فقط لطلبات `api.anthropic.com` المباشرة. وتترك مسارات proxy قيمة `service_tier` دون تعديل.
    - تتجاوز معاملات `serviceTier` أو `service_tier` الصريحة `/fast` عند ضبط الاثنين معًا.
    - في الحسابات التي لا تتوفر فيها سعة Priority Tier، قد تُحل `service_tier: "auto"` إلى `standard`.
    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    يسجّل Plugin Anthropic المضمّن فهم الصور وملفات PDF. ويقوم OpenClaw
    بحل قدرات الوسائط تلقائيًا من مصادقة Anthropic المضبوطة — ولا
    حاجة إلى أي تكوين إضافي.

    | الخاصية       | القيمة                |
    | -------------- | -------------------- |
    | النموذج الافتراضي  | `claude-opus-4-6`    |
    | الإدخال المدعوم | الصور، مستندات PDF |

    عند إرفاق صورة أو ملف PDF بمحادثة، يقوم OpenClaw تلقائيًا
    بتوجيهه عبر موفر فهم الوسائط الخاص بـ Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M (تجريبية)">
    بوابة الإصدار التجريبي الخاصة بـ Anthropic لنافذة سياق 1M. فعّلها لكل نموذج:

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

    يربط OpenClaw هذا إلى `anthropic-beta: context-1m-2025-08-07` في الطلبات.

    <Warning>
    يتطلب ذلك وصول السياق الطويل في بيانات اعتماد Anthropic الخاصة بك. يتم رفض مصادقة الرموز القديمة (`sk-ant-oat-*`) لطلبات سياق 1M — ويسجل OpenClaw تحذيرًا ويعود إلى نافذة السياق القياسية.
    </Warning>

  </Accordion>

  <Accordion title="سياق 1M لـ Claude Opus 4.7">
    يملك `anthropic/claude-opus-4.7` ومتغير `claude-cli` الخاص به نافذة
    سياق 1M افتراضيًا — ولا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / أصبح الرمز غير صالح فجأة">
    قد تنتهي صلاحية مصادقة رموز Anthropic أو تُلغى. بالنسبة للإعدادات الجديدة، انتقل إلى مفتاح Anthropic API.
  </Accordion>

  <Accordion title='لم يتم العثور على مفتاح API للموفر "anthropic"'>
    تتم المصادقة **لكل agent**. لا ترث agents الجديدة مفاتيح agent الرئيسي. أعد تشغيل الإعداد الأولي لذلك agent، أو اضبط مفتاح API على مضيف gateway، ثم تحقق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد لملف التعريف "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف تعريف المصادقة النشط. أعد تشغيل الإعداد الأولي، أو اضبط مفتاح API لمسار ملف التعريف هذا.
  </Accordion>

  <Accordion title="لا يوجد ملف تعريف مصادقة متاح (الكل في فترة تهدئة)">
    تحقق من `openclaw models status --json` لمعرفة `auth.unusableProfiles`. قد تكون فترات التهدئة الخاصة بحدود معدل Anthropic مرتبطة بالنموذج، لذلك قد يظل نموذج Anthropic شقيق قابلًا للاستخدام. أضف ملف تعريف Anthropic آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="واجهات CLI الخلفية" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد الواجهة الخلفية لـ Claude CLI وتفاصيل وقت التشغيل.
  </Card>
  <Card title="التخزين المؤقت للموجهات" href="/ar/reference/prompt-caching" icon="database">
    كيف يعمل التخزين المؤقت للموجهات عبر الموفّرين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
