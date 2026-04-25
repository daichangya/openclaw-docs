---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج LLM
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
summary: استخدم واجهة OpenRouter API الموحدة للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T13:57:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

يوفر OpenRouter **واجهة API موحدة** توجّه الطلبات إلى العديد من النماذج عبر نقطة
نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذا تعمل معظم حِزم OpenAI SDK
بمجرد تبديل عنوان URL الأساسي.

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

## مثال على الإعداد

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
تتبع مراجع النماذج النمط `openrouter/<provider>/<model>`. للاطلاع على القائمة الكاملة
للمزودين والنماذج المتاحة، راجع [/concepts/model-providers](/ar/concepts/model-providers).
</Note>

أمثلة على التبديل الاحتياطي المضمّن:

| Model ref                            | ملاحظات                         |
| ------------------------------------ | ------------------------------- |
| `openrouter/auto`                    | التوجيه التلقائي في OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 عبر MoonshotAI        |
| `openrouter/openrouter/healer-alpha` | مسار OpenRouter Healer Alpha    |
| `openrouter/openrouter/hunter-alpha` | مسار OpenRouter Hunter Alpha    |

## توليد الصور

يمكن لـ OpenRouter أيضًا تشغيل أداة `image_generate`. استخدم نموذج صور من OpenRouter ضمن `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

يرسل OpenClaw طلبات الصور إلى واجهة API الخاصة بإكمالات الدردشة للصور في OpenRouter باستخدام `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة عبر `image_config` الخاص بـ OpenRouter.

## تحويل النص إلى كلام

يمكن أيضًا استخدام OpenRouter كمزوّد TTS من خلال نقطة النهاية
المتوافقة مع OpenAI وهي `/audio/speech`.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

إذا تم حذف `messages.tts.providers.openrouter.apiKey`، فسيُعاد استخدام
`models.providers.openrouter.apiKey`، ثم `OPENROUTER_API_KEY`.

## المصادقة والترويسات

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك داخليًا.

في طلبات OpenRouter الفعلية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
ترويسات إسناد التطبيق الموثقة من OpenRouter:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
إذا أعدت توجيه مزوّد OpenRouter إلى وكيل آخر أو عنوان URL أساسي مختلف، فإن OpenClaw
**لا** يحقن تلك الترويسات الخاصة بـ OpenRouter ولا علامات Anthropic الخاصة بالتخزين المؤقت.
</Warning>

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="علامات التخزين المؤقت الخاصة بـ Anthropic">
    في المسارات التي تم التحقق منها في OpenRouter، تحتفظ مراجع نماذج Anthropic
    بعلامات `cache_control` الخاصة بـ Anthropic في OpenRouter التي يستخدمها OpenClaw من أجل
    إعادة استخدام أفضل لذاكرة التخزين المؤقت للموجّهات في كتل موجّهات system/developer.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    في المسارات المدعومة غير `auto`، يطابق OpenClaw مستوى التفكير المحدد مع
    حمولات الاستدلال الخاصة بوكيل OpenRouter. يتم تخطي هذا الحقن للاستدلال في
    تلميحات النماذج غير المدعومة و`openrouter/auto`.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاص بـ OpenAI فقط">
    لا يزال OpenRouter يعمل عبر المسار المتوافق مع OpenAI بأسلوب الوكيل، لذا
    لا يتم تمرير تشكيلات الطلبات الأصلية الخاصة بـ OpenAI فقط مثل `serviceTier` و`store`
    في Responses وحمولات التوافق مع الاستدلال في OpenAI وتلميحات ذاكرة التخزين المؤقت للموجّهات.
  </Accordion>

  <Accordion title="المسارات المعتمدة على Gemini">
    تبقى مراجع OpenRouter المعتمدة على Gemini على مسار Gemini الوكيل: يحتفظ OpenClaw
    هناك بتنقية توقيع التفكير الخاصة بـ Gemini، لكنه لا يفعّل التحقق الأصلي من إعادة التشغيل في Gemini
    أو إعادة كتابة التهيئة الأولية.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه المزود">
    إذا مرّرت توجيه مزوّد OpenRouter ضمن معلمات النموذج، فسيقوم OpenClaw بتمريره
    كبيانات تعريف توجيه OpenRouter قبل تشغيل أغلفة البث المشتركة.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لإعدادات الوكلاء والنماذج والمزودين.
  </Card>
</CardGroup>
