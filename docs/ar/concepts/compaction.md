---
read_when:
    - تريد فهم Compaction التلقائي والأمر `/compact`
    - أنت تقوم بتصحيح أخطاء الجلسات الطويلة التي تصطدم بحدود السياق
summary: كيف يلخّص OpenClaw المحادثات الطويلة للبقاء ضمن حدود النموذج
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

لكل نموذج نافذة سياق — وهي الحد الأقصى لعدد الرموز المميزة التي يمكنه معالجتها.
عندما تقترب المحادثة من هذا الحد، يجري OpenClaw **Compaction** للرسائل الأقدم
في ملخص حتى تستمر الدردشة.

## كيف يعمل

1. تُلخَّص أدوار المحادثة الأقدم في إدخال مدمج.
2. يُحفَظ الملخص في transcript الجلسة.
3. تُحفَظ الرسائل الحديثة كما هي.

عندما يقسم OpenClaw السجل إلى مقاطع Compaction، فإنه يُبقي استدعاءات أدوات
المساعد مقترنة بإدخالات `toolResult` المطابقة لها. وإذا وقعت نقطة التقسيم
داخل كتلة أداة، ينقل OpenClaw الحد بحيث يبقى الزوج معًا
ويُحفَظ الذيل الحالي غير الملخّص.

يبقى السجل الكامل للمحادثة على القرص. لا يغيّر Compaction إلا ما
يراه النموذج في الدور التالي.

## Compaction التلقائي

يكون Compaction التلقائي مفعّلًا افتراضيًا. ويعمل عندما تقترب الجلسة من حد
السياق، أو عندما يعيد النموذج خطأ تجاوز السياق (وفي هذه الحالة
يجري OpenClaw عملية Compaction ثم يعيد المحاولة). تشمل تواقيع التجاوز المعتادة
`request_too_large` و`context length exceeded` و`input exceeds the maximum
number of tokens` و`input token count exceeds the maximum number of input
tokens` و`input is too long for the model` و`ollama error: context length
exceeded`.

<Info>
قبل تنفيذ Compaction، يذكّر OpenClaw الوكيل تلقائيًا بحفظ الملاحظات المهمة
في ملفات [memory](/ar/concepts/memory). وهذا يمنع فقدان السياق.
</Info>

استخدم الإعداد `agents.defaults.compaction` في ملف `openclaw.json` لتهيئة سلوك Compaction (الوضع، والرموز المميزة المستهدفة، وغير ذلك).
يحافظ تلخيص Compaction افتراضيًا على المعرفات المعتمة (`identifierPolicy: "strict"`). يمكنك تجاوز ذلك باستخدام `identifierPolicy: "off"` أو تقديم نص مخصص باستخدام `identifierPolicy: "custom"` و`identifierInstructions`.

يمكنك اختياريًا تحديد نموذج مختلف لتلخيص Compaction عبر `agents.defaults.compaction.model`. وهذا مفيد عندما يكون نموذجك الأساسي نموذجًا محليًا أو صغيرًا وتريد إنشاء ملخصات Compaction بواسطة نموذج أكثر قدرة. يقبل هذا التجاوز أي سلسلة `provider/model-id`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

ويعمل هذا أيضًا مع النماذج المحلية، مثل نموذج Ollama ثانٍ مخصص للتلخيص أو متخصص Compaction مضبوط بدقة:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

عند عدم تعيينه، يستخدم Compaction النموذج الأساسي للوكيل.

## موفرو Compaction القابلون للتوصيل

يمكن لـ Plugins تسجيل موفر Compaction مخصص عبر `registerCompactionProvider()` على Plugin API. وعندما يتم تسجيل موفر وتهيئته، يفوّض OpenClaw التلخيص إليه بدلًا من مسار LLM المضمن.

لاستخدام موفر مسجل، اضبط معرّف الموفر في إعدادك:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

يؤدي تعيين `provider` تلقائيًا إلى فرض `mode: "safeguard"`. تتلقى الموفّرات تعليمات Compaction نفسها وسياسة الحفاظ على المعرفات نفسها كما في المسار المضمن، ولا يزال OpenClaw يحافظ على سياق لاحقة الأدوار الحديثة والأدوار المنقسمة بعد خرج الموفر. إذا فشل الموفر أو أعاد نتيجة فارغة، يعود OpenClaw إلى تلخيص LLM المضمن.

## Compaction التلقائي (مفعّل افتراضيًا)

عندما تقترب الجلسة من نافذة سياق النموذج أو تتجاوزها، يشغّل OpenClaw Compaction تلقائيًا وقد يعيد محاولة الطلب الأصلي باستخدام السياق المضغوط.

سترى:

- `🧹 Auto-compaction complete` في الوضع المطوّل
- الأمر `/status` يعرض `🧹 Compactions: <count>`

قبل تنفيذ Compaction، يمكن لـ OpenClaw تشغيل دور **تفريغ memory صامت**
لتخزين الملاحظات الدائمة على القرص. راجع [Memory](/ar/concepts/memory) للاطلاع على التفاصيل والإعداد.

## Compaction اليدوي

اكتب `/compact` في أي دردشة لفرض تنفيذ Compaction. أضف تعليمات لتوجيه
الملخص:

```text
/compact Focus on the API design decisions
```

عند ضبط `agents.defaults.compaction.keepRecentTokens`، يحترم Compaction اليدوي
نقطة القطع الخاصة بـ Pi ويحافظ على الذيل الحديث في السياق المعاد بناؤه. ومن دون
ميزانية احتفاظ صريحة، يتصرف Compaction اليدوي كنقطة تحقق صارمة
ويتابع من الملخص الجديد وحده.

## استخدام نموذج مختلف

افتراضيًا، يستخدم Compaction النموذج الأساسي لوكيلك. ويمكنك استخدام نموذج
أكثر قدرة للحصول على ملخصات أفضل:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## إشعارات Compaction

افتراضيًا، يعمل Compaction بصمت. لإظهار إشعارات موجزة عند بدء Compaction
وعند اكتماله، فعّل `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

عند التمكين، يرى المستخدم رسائل حالة قصيرة حول كل تشغيل لـ Compaction
(مثل "Compacting context..." و"Compaction complete").

## Compaction مقابل Pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **ما الذي يفعله** | يلخص المحادثة الأقدم         | يقتطع نتائج الأدوات القديمة      |
| **هل يُحفَظ؟**    | نعم (في transcript الجلسة)   | لا (في الذاكرة فقط، لكل طلب)     |
| **النطاق**        | المحادثة بأكملها             | نتائج الأدوات فقط                |

إن [Session pruning](/ar/concepts/session-pruning) هو مكمّل أخف وزنًا
يقتطع خرج الأدوات من دون تلخيص.

## استكشاف الأخطاء وإصلاحها

**هل يتم تنفيذ Compaction كثيرًا؟** قد تكون نافذة سياق النموذج صغيرة، أو قد تكون
مخرجات الأدوات كبيرة. جرّب تمكين
[session pruning](/ar/concepts/session-pruning).

**هل يبدو السياق قديمًا بعد Compaction؟** استخدم `/compact Focus on <topic>` من أجل
توجيه الملخص، أو فعّل [memory flush](/ar/concepts/memory) حتى
تبقى الملاحظات محفوظة.

**هل تحتاج إلى بداية نظيفة؟** يبدأ `/new` جلسة جديدة من دون تنفيذ Compaction.

للاطلاع على الإعداد المتقدم (الرموز المميزة المحجوزة، والحفاظ على المعرفات، ومحركات
السياق المخصصة، وCompaction من جهة الخادم في OpenAI)، راجع
[التعمق في إدارة الجلسات](/ar/reference/session-management-compaction).

## ذو صلة

- [Session](/ar/concepts/session) — إدارة الجلسات ودورة حياتها
- [Session Pruning](/ar/concepts/session-pruning) — اقتطاع نتائج الأدوات
- [Context](/ar/concepts/context) — كيفية بناء السياق لأدوار الوكيل
- [Hooks](/ar/automation/hooks) — خطافات دورة حياة Compaction (`before_compaction`, `after_compaction`)
