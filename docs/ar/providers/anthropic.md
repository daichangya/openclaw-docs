---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T07:30:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e99e31bf58d08a18f526281b3bf5c3a5a96b2ff342adf3a6a193a076147a03
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

تطوّر Anthropic عائلة نماذج **Claude**. ويدعم OpenClaw مساري مصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude CLI موجود على المضيف نفسه

<Warning>
أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مجددًا، لذلك
يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان ما لم
تنشر Anthropic سياسة جديدة.

أما بالنسبة إلى مضيفي Gateway طويلَي العمر، فما تزال مفاتيح Anthropic API هي المسار الإنتاجي
الأوضح والأكثر قابلية للتنبؤ.

الوثائق العامة الحالية لـ Anthropic:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [نظرة عامة على Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [استخدام Claude Code مع خطة Pro أو Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [استخدام Claude Code مع خطة Team أو Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## البدء

<Tabs>
  <Tab title="API key">
    **الأفضل لـ:** وصول API القياسي والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API في [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard
        # اختر: Anthropic API key
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

    ### مثال على الإعدادات

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
      <Step title="تأكد من أن Claude CLI مثبت ومُسجَّل الدخول">
        تحقق باستخدام:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard
        # اختر: Claude CLI
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
    توجد تفاصيل الإعداد وبيئة التشغيل للواجهة الخلفية Claude CLI في [الواجهات الخلفية لـ CLI](/ar/gateway/cli-backends).
    </Note>

    <Tip>
    إذا كنت تريد أوضح مسار للفوترة، فاستخدم مفتاح Anthropic API بدلًا من ذلك. كما يدعم OpenClaw أيضًا خيارات بنمط الاشتراك من [OpenAI Codex](/ar/providers/openai) و[Qwen Cloud](/ar/providers/qwen) و[MiniMax](/ar/providers/minimax) و[Z.AI / GLM](/ar/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## افتراضات التفكير (Claude 4.6)

تستخدم نماذج Claude 4.6 وضع التفكير `adaptive` افتراضيًا في OpenClaw عندما لا يكون هناك مستوى تفكير صريح مضبوط.

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
- [التفكير الممتد](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt caching

يدعم OpenClaw ميزة Prompt caching الخاصة بـ Anthropic عند استخدام مصادقة مفتاح API.

| القيمة               | مدة cache | الوصف                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (الافتراضي) | 5 دقائق      | تُطبَّق تلقائيًا عند استخدام مصادقة مفتاح API |
| `"long"`            | ساعة واحدة         | cache ممتدة                         |
| `"none"`            | من دون cache     | تعطيل Prompt caching                 |

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
  <Accordion title="تجاوزات cache لكل وكيل">
    استخدم معاملات النموذج على أنها خط الأساس، ثم تجاوز وكلاء محددين عبر `agents.list[].params`:

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

    ترتيب دمج الإعدادات:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (مطابقة بحسب `id`، مع التجاوز حسب المفتاح)

    يتيح هذا لوكيل واحد الاحتفاظ بـ cache طويلة العمر، بينما يعطّل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة المرور المتقطعة/منخفضة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Claude على Bedrock">
    - تقبل نماذج Anthropic Claude على Bedrock (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند ضبطها.
    - تُفرض القيمة `cacheRetention: "none"` وقت التشغيل على نماذج Bedrock غير التابعة لـ Anthropic.
    - كما أن الافتراضات الذكية لمفتاح API تضبط `cacheRetention: "short"` تلقائيًا لمراجع Claude-on-Bedrock عند عدم وجود قيمة صريحة.
  </Accordion>
</AccordionGroup>

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم مفتاح `/fast` المشترك في OpenClaw حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

    | الأمر | يُطابِق |
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
    - لا يُحقن إلا للطلبات المباشرة إلى `api.anthropic.com`. أما مسارات proxy فتترك `service_tier` من دون تعديل.
    - تتجاوز معاملات `serviceTier` أو `service_tier` الصريحة إعداد `/fast` عندما يكون كلاهما مضبوطًا.
    - في الحسابات التي لا تملك سعة Priority Tier، قد تُحل `service_tier: "auto"` إلى `standard`.
    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    يسجل Plugin Anthropic المضمّن فهم الصور وPDF. ويقوم OpenClaw
    بحل قدرات الوسائط تلقائيًا من مصادقة Anthropic المضبوطة — من دون
    حاجة إلى إعدادات إضافية.

    | الخاصية       | القيمة                |
    | -------------- | -------------------- |
    | النموذج الافتراضي  | `claude-opus-4-6`    |
    | الإدخال المدعوم | الصور، ومستندات PDF |

    عند إرفاق صورة أو PDF بمحادثة، يقوم OpenClaw تلقائيًا
    بتوجيهها عبر مزوّد فهم الوسائط الخاص بـ Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M (بيتا)">
    نافذة سياق 1M من Anthropic محكومة ببوابة beta. فعّلها لكل نموذج:

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
    يتطلب هذا وصول السياق الطويل على بيانات اعتماد Anthropic لديك. وتُرفض مصادقة الرموز القديمة (`sk-ant-oat-*`) لطلبات سياق 1M — يسجل OpenClaw تحذيرًا ويعود إلى نافذة السياق القياسية.
    </Warning>

  </Accordion>

  <Accordion title="تطبيع سياق 1M في Claude Opus 4.7">
    يجري تطبيع Claude Opus 4.7 (`anthropic/claude-opus-4.7`) ومتغيره `claude-cli` إلى نافذة سياق 1M في بيانات بيئة التشغيل الوصفية المحلولة وفي تقارير الحالة/السياق للوكلاء النشطين. ولا تحتاج إلى `params.context1m: true` في Opus 4.7؛ فهو لم يعد يرث fallback القديم البالغ 200k.

    ويستخدم Compaction ومعالجة الفائض نافذة 1M تلقائيًا. أما نماذج Anthropic الأخرى فتبقي على حدودها المنشورة.

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / الرمز أصبح غير صالح فجأة">
    يمكن أن تنتهي صلاحية مصادقة رمز Anthropic أو تُلغى. بالنسبة إلى الإعدادات الجديدة، انتقل إلى مفتاح Anthropic API.
  </Accordion>

  <Accordion title='لم يتم العثور على مفتاح API للمزوّد "anthropic"'>
    المصادقة **لكل وكيل**. لا ترث الوكلاء الجدد مفاتيح الوكيل الرئيسي. أعد تشغيل الإعداد الأولي لذلك الوكيل، أو اضبط مفتاح API على مضيف gateway، ثم تحقق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد لملف التعريف "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف تعريف المصادقة النشط. أعد تشغيل الإعداد الأولي، أو اضبط مفتاح API لذلك المسار الخاص بملف التعريف.
  </Accordion>

  <Accordion title="لا يوجد ملف تعريف مصادقة متاح (الجميع في فترة تهدئة)">
    تحقق من `openclaw models status --json` لمعرفة `auth.unusableProfiles`. وقد تكون فترات تهدئة حد المعدل في Anthropic محصورة بالنموذج، لذلك قد يظل نموذج Anthropic شقيق قابلًا للاستخدام. أضف ملف تعريف Anthropic آخر أو انتظر حتى تنتهي فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الانتقال الاحتياطي.
  </Card>
  <Card title="الواجهات الخلفية لـ CLI" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد الواجهة الخلفية Claude CLI وتفاصيل بيئة التشغيل.
  </Card>
  <Card title="Prompt caching" href="/ar/reference/prompt-caching" icon="database">
    كيف يعمل Prompt caching عبر المزوّدين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
