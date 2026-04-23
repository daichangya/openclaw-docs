---
read_when:
    - تريد استخدام Qwen مع OpenClaw
    - لقد استخدمت سابقًا Qwen OAuth
summary: استخدم Qwen Cloud عبر مزوّد qwen المضمّن في OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T07:31:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**تمت إزالة Qwen OAuth.** لم يعد تكامل OAuth الخاص بالمستوى المجاني
(`qwen-portal`) الذي كان يستخدم نقاط نهاية `portal.qwen.ai` متاحًا.
راجع [المشكلة #49557](https://github.com/openclaw/openclaw/issues/49557) للحصول على
الخلفية.

</Warning>

يتعامل OpenClaw الآن مع Qwen على أنها مزوّد مضمّن من الدرجة الأولى بمعرّف قياسي
`qwen`. ويستهدف المزوّد المضمّن نقاط نهاية Qwen Cloud / Alibaba DashScope و
Coding Plan ويحافظ على عمل معرّفات `modelstudio` القديمة باعتبارها
اسمًا مستعارًا للتوافق.

- المزوّد: `qwen`
- متغير env المفضّل: `QWEN_API_KEY`
- المقبول أيضًا للتوافق: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- نمط API: متوافق مع OpenAI

<Tip>
إذا كنت تريد `qwen3.6-plus`, ففضّل نقطة نهاية **Standard (الدفع حسب الاستخدام)**.
فقد يتأخر دعم Coding Plan عن الكتالوج العام.
</Tip>

## البدء

اختر نوع خطتك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Coding Plan (اشتراك)">
    **الأفضل لـ:** الوصول القائم على الاشتراك عبر Qwen Coding Plan.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        بالنسبة إلى نقطة النهاية **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        وبالنسبة إلى نقطة النهاية **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    ما تزال معرّفات `auth-choice` القديمة من نوع `modelstudio-*` ومراجع النماذج `modelstudio/...`
    تعمل كأسماء مستعارة للتوافق، لكن تدفقات الإعداد الجديدة ينبغي أن تفضّل المعرّفات القياسية
    `qwen-*` في `auth-choice` ومراجع النماذج `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (الدفع حسب الاستخدام)">
    **الأفضل لـ:** الوصول بالدفع حسب الاستخدام عبر نقطة نهاية Standard Model Studio، بما في ذلك نماذج مثل `qwen3.6-plus` التي قد لا تكون متاحة في Coding Plan.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        بالنسبة إلى نقطة النهاية **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        وبالنسبة إلى نقطة النهاية **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    ما تزال معرّفات `auth-choice` القديمة من نوع `modelstudio-*` ومراجع النماذج `modelstudio/...`
    تعمل كأسماء مستعارة للتوافق، لكن تدفقات الإعداد الجديدة ينبغي أن تفضّل المعرّفات القياسية
    `qwen-*` في `auth-choice` ومراجع النماذج `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## أنواع الخطط ونقاط النهاية

| الخطة                       | المنطقة | Auth choice                | نقطة النهاية                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (الدفع حسب الاستخدام)   | الصين  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (الدفع حسب الاستخدام)   | عالمي | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (اشتراك) | الصين  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (اشتراك) | عالمي | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

يختار المزوّد نقطة النهاية تلقائيًا بناءً على Auth choice الخاصة بك. وتستخدم الخيارات
القياسية عائلة `qwen-*`; بينما تبقى `modelstudio-*` للتوافق فقط.
ويمكنك التجاوز باستخدام `baseUrl` مخصصة في الإعدادات.

<Tip>
**إدارة المفاتيح:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**الوثائق:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## الكتالوج المضمّن

يشحن OpenClaw حاليًا كتالوج Qwen المضمّن هذا. ويكون الكتالوج المضبوط
مدركًا لنقطة النهاية: إذ تحذف إعدادات Coding Plan النماذج المعروفة بأنها تعمل
فقط على نقطة نهاية Standard.

| مرجع النموذج                   | الإدخال       | السياق   | ملاحظات                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | نص، صورة | 1,000,000 | النموذج الافتراضي                                      |
| `qwen/qwen3.6-plus`         | نص، صورة | 1,000,000 | فضّل نقاط نهاية Standard عندما تحتاج إلى هذا النموذج |
| `qwen/qwen3-max-2026-01-23` | نص        | 262,144   | سطر Qwen Max                                      |
| `qwen/qwen3-coder-next`     | نص        | 262,144   | برمجة                                             |
| `qwen/qwen3-coder-plus`     | نص        | 1,000,000 | برمجة                                             |
| `qwen/MiniMax-M2.5`         | نص        | 1,000,000 | التفكير مفعّل                                  |
| `qwen/glm-5`                | نص        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | نص        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | نص، صورة | 262,144   | Moonshot AI عبر Alibaba                            |

<Note>
قد يختلف التوفر مع ذلك بحسب نقطة النهاية وخطة الفوترة حتى عندما يكون النموذج
موجودًا في الكتالوج المضمّن.
</Note>

## الإضافات متعددة الوسائط

يكشف Plugin ‏`qwen` أيضًا قدرات متعددة الوسائط على نقاط نهاية DashScope **Standard**
(وليس على نقاط نهاية Coding Plan):

- **فهم الفيديو** عبر `qwen-vl-max-latest`
- **توليد فيديو Wan** عبر `wan2.6-t2v` (الافتراضي)، و`wan2.6-i2v`, و`wan2.6-r2v`, و`wan2.6-r2v-flash`, و`wan2.7-r2v`

لاستخدام Qwen بوصفه مزود الفيديو الافتراضي:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
راجع [توليد الفيديو](/ar/tools/video-generation) للحصول على معاملات الأدوات المشتركة، واختيار المزوّد، وسلوك الانتقال الاحتياطي.
</Note>

## متقدم

<AccordionGroup>
  <Accordion title="فهم الصور والفيديو">
    يسجل Plugin ‏Qwen المضمّن فهم الوسائط للصور والفيديو
    على نقاط نهاية DashScope **Standard** (وليس على نقاط نهاية Coding Plan).

    | الخاصية      | القيمة                 |
    | ------------- | --------------------- |
    | النموذج         | `qwen-vl-max-latest`  |
    | الإدخال المدعوم | الصور، الفيديو       |

    تُحل قدرات فهم الوسائط تلقائيًا من مصادقة Qwen المضبوطة — من دون
    حاجة إلى إعدادات إضافية. وتأكد من أنك تستخدم
    نقطة نهاية Standard (الدفع حسب الاستخدام) لدعم فهم الوسائط.

  </Accordion>

  <Accordion title="توفر Qwen 3.6 Plus">
    إن `qwen3.6-plus` متاح على نقاط نهاية Model Studio من نوع Standard (الدفع حسب الاستخدام):

    - الصين: `dashscope.aliyuncs.com/compatible-mode/v1`
    - عالمي: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    إذا أعادت نقاط نهاية Coding Plan خطأ "نموذج غير مدعوم" عند استخدام
    `qwen3.6-plus`, فانتقل إلى Standard (الدفع حسب الاستخدام) بدلًا من زوج
    نقطة النهاية/المفتاح الخاص بـ Coding Plan.

  </Accordion>

  <Accordion title="خطة القدرات">
    يجري وضع Plugin ‏`qwen` على أنها المنزل المورّد للسطح الكامل لـ Qwen
    Cloud، وليس فقط نماذج البرمجة/النص.

    - **نماذج النص/الدردشة:** مضمّنة الآن
    - **استدعاء الأدوات، والإخراج المنظّم، والتفكير:** موروثة من النقل المتوافق مع OpenAI
    - **توليد الصور:** مخطط له على مستوى Plugin الخاص بالمزوّد
    - **فهم الصور/الفيديو:** مضمّن الآن على نقطة نهاية Standard
    - **الكلام/الصوت:** مخطط له على مستوى Plugin الخاص بالمزوّد
    - **تضمينات/إعادة ترتيب الذاكرة:** مخطط لها عبر سطح embedding adapter
    - **توليد الفيديو:** مضمّن الآن عبر قدرة توليد الفيديو المشتركة

  </Accordion>

  <Accordion title="تفاصيل توليد الفيديو">
    بالنسبة إلى توليد الفيديو، يربط OpenClaw المنطقة المضبوطة لـ Qwen مع
    مضيف DashScope AIGC المطابق قبل إرسال المهمة:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - الصين: `https://dashscope.aliyuncs.com`

    وهذا يعني أن `models.providers.qwen.baseUrl` العادية التي تشير إلى أحد مضيفي
    Qwen من نوع Coding Plan أو Standard ستُبقي أيضًا توليد الفيديو على
    نقطة نهاية فيديو DashScope الإقليمية الصحيحة.

    حدود توليد الفيديو الحالية في Qwen المضمّنة:

    - حتى **1** فيديو خرج لكل طلب
    - حتى **1** صورة إدخال
    - حتى **4** فيديوهات إدخال
    - حتى **10 ثوانٍ** مدة
    - يدعم `size`, و`aspectRatio`, و`resolution`, و`audio`, و`watermark`
    - يتطلب وضع الصورة/الفيديو المرجعي حاليًا **عناوين URL بعيدة من نوع http(s)**. وتُرفض
      مسارات الملفات المحلية مسبقًا لأن نقطة نهاية فيديو DashScope لا
      تقبل رفع مخازن محلية لتلك المراجع.

  </Accordion>

  <Accordion title="توافق استخدام البث المتدفق">
    تعلن نقاط نهاية Model Studio الأصلية عن توافق استخدام البث المتدفق على
    النقل المشترك `openai-completions`. ويعتمد OpenClaw ذلك الآن على قدرات نقطة
    النهاية، لذلك ترث معرّفات المزوّدات المخصصة المتوافقة مع DashScope والتي تستهدف
    المضيفين الأصليين أنفسهم سلوك استخدام البث المتدفق نفسه بدلًا من
    اشتراط معرّف المزوّد المضمّن `qwen` على وجه التحديد.

    ينطبق توافق استخدام البث المتدفق الأصلي على كل من مضيفي Coding Plan
    ومضيفي Standard المتوافقين مع DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="مناطق نقاط النهاية متعددة الوسائط">
    تستخدم الأسطح متعددة الوسائط (فهم الفيديو وتوليد فيديو Wan) نقاط نهاية
    DashScope **Standard**، وليس نقاط نهاية Coding Plan:

    - عنوان URL الأساسي لـ Standard العالمي/الدولي: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - عنوان URL الأساسي لـ Standard في الصين: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="إعداد البيئة والخادم">
    إذا كانت Gateway تعمل كخادم (launchd/systemd)، فتأكد من أن `QWEN_API_KEY`
    متاح لتلك العملية (مثلًا في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الانتقال الاحتياطي.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/ar/providers/alibaba" icon="cloud">
    ملاحظات مزوّد ModelStudio القديم والهجرة.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء العام والأسئلة الشائعة.
  </Card>
</CardGroup>
