---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج LLM
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
summary: استخدم واجهة API الموحدة من OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:28:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

يوفر OpenRouter **واجهة API موحدة** توجّه الطلبات إلى العديد من النماذج خلف
نقطة نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذا تعمل معظم حزم SDK الخاصة بـ OpenAI بمجرد تبديل عنوان URL الأساسي.

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API على [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(اختياري) بدّل إلى نموذج محدد">
    يستخدم الإعداد الأولي افتراضيًا `openrouter/auto`. اختر نموذجًا محددًا لاحقًا:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## مثال على التكوين

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## مراجع النماذج

<Note>
تتبع مراجع النماذج النمط `openrouter/<provider>/<model>`. وللاطلاع على القائمة الكاملة
للمزوّدين والنماذج المتاحة، راجع [/concepts/model-providers](/ar/concepts/model-providers).
</Note>

أمثلة fallback المضمّنة:

| مرجع النموذج                            | ملاحظات                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | توجيه OpenRouter التلقائي  |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 عبر MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | مسار OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | مسار OpenRouter Hunter Alpha |

## المصادقة والترويسات

يستخدم OpenRouter ‏Bearer token مع مفتاح API الخاص بك في الخلفية.

في طلبات OpenRouter الحقيقية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
ترويسات إسناد التطبيق الموثقة في OpenRouter:

| الترويسة                    | القيمة                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
إذا أعدت توجيه مزوّد OpenRouter إلى proxy أو عنوان URL أساسي آخر، فلن يقوم OpenClaw
**بحقن** ترويسات OpenRouter الخاصة تلك أو علامات cache الخاصة بـ Anthropic.
</Warning>

## ملاحظات متقدمة

<AccordionGroup>
  <Accordion title="علامات cache الخاصة بـ Anthropic">
    في مسارات OpenRouter المتحقق منها، تحتفظ مراجع نماذج Anthropic بعلامات
    `cache_control` الخاصة بـ Anthropic في OpenRouter التي يستخدمها OpenClaw من أجل
    إعادة استخدام أفضل لـ prompt-cache في كتل prompt الخاصة بالنظام/المطور.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    في المسارات المدعومة غير `auto`، يربط OpenClaw مستوى التفكير المحدد
    بحمولات الاستدلال الخاصة بـ OpenRouter proxy. ويتم تخطي حقن هذا الاستدلال
    في تلميحات النماذج غير المدعومة وفي `openrouter/auto`.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاص بـ OpenAI فقط">
    ما زال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بأسلوب proxy، لذا
    لا يتم تمرير تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط مثل `serviceTier`، و`store` في Responses،
    وحمولات التوافق مع الاستدلال في OpenAI، وتلميحات prompt-cache.
  </Accordion>

  <Accordion title="المسارات المدعومة من Gemini">
    تبقى مراجع OpenRouter المدعومة من Gemini على مسار proxy-Gemini: ويحافظ OpenClaw
    هناك على تنقية thought-signature الخاصة بـ Gemini، لكنه لا يمكّن تحقق replay الأصلي لـ Gemini
    أو عمليات إعادة كتابة bootstrap.
  </Accordion>

  <Accordion title="البيانات الوصفية لتوجيه المزوّد">
    إذا مررت توجيه مزوّد OpenRouter ضمن معلمات النموذج، فسيقوم OpenClaw بتمريره
    كبيانات وصفية للتوجيه في OpenRouter قبل تشغيل أغلفة stream المشتركة.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لتكوين الوكلاء، والنماذج، والمزوّدين.
  </Card>
</CardGroup>
