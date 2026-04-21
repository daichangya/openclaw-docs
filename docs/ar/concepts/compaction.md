---
read_when:
    - تريد فهم Compaction التلقائي و`/compact`
    - أنت تصحّح أخطاء الجلسات الطويلة التي تصطدم بحدود السياق
summary: كيف يلخّص OpenClaw المحادثات الطويلة للبقاء ضمن حدود النموذج
title: Compaction
x-i18n:
    generated_at: "2026-04-21T07:19:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

لكل نموذج نافذة سياق — وهي الحد الأقصى لعدد التوكنات التي يمكنه معالجتها.
عندما تقترب المحادثة من هذا الحد، يقوم OpenClaw بعمل **Compaction** للرسائل الأقدم
إلى ملخص حتى تتمكن الدردشة من الاستمرار.

## كيف يعمل

1. تُلخَّص أدوار المحادثة الأقدم في إدخال مضغوط.
2. يُحفَظ الملخص في سجل الجلسة.
3. تُحفَظ الرسائل الحديثة كما هي.

عندما يقسم OpenClaw السجل إلى مقاطع Compaction، فإنه يبقي استدعاءات أدوات
المساعد مقترنة بإدخالات `toolResult` المطابقة لها. وإذا وقعت نقطة التقسيم
داخل كتلة أداة، ينقل OpenClaw الحد بحيث تبقى الثنائية معًا
ويُحفَظ الذيل الحالي غير المُلخَّص.

يبقى السجل الكامل للمحادثة محفوظًا على القرص. يغيّر Compaction فقط ما
يراه النموذج في الدور التالي.

## Compaction التلقائي

يكون Compaction التلقائي مفعّلًا افتراضيًا. ويعمل عندما تقترب الجلسة من حد
السياق، أو عندما يعيد النموذج خطأ تجاوز السياق (وفي هذه الحالة
يقوم OpenClaw بعمل Compaction ثم يعيد المحاولة). تتضمن تواقيع التجاوز الشائعة
`request_too_large` و`context length exceeded` و`input exceeds the maximum
number of tokens` و`input token count exceeds the maximum number of input
tokens` و`input is too long for the model` و`ollama error: context length
exceeded`.

<Info>
قبل إجراء Compaction، يذكّر OpenClaw الوكيل تلقائيًا بحفظ الملاحظات المهمة
في ملفات [الذاكرة](/ar/concepts/memory). وهذا يمنع فقدان السياق.
</Info>

استخدم الإعداد `agents.defaults.compaction` في `openclaw.json` لتهيئة سلوك Compaction (الوضع، وعدد التوكنات المستهدف، وغير ذلك).
يحافظ تلخيص Compaction على المعرّفات المعتمة افتراضيًا (`identifierPolicy: "strict"`). ويمكنك تجاوز هذا باستخدام `identifierPolicy: "off"` أو توفير نص مخصص باستخدام `identifierPolicy: "custom"` و`identifierInstructions`.

يمكنك اختياريًا تحديد نموذج مختلف لتلخيص Compaction عبر `agents.defaults.compaction.model`. ويكون هذا مفيدًا عندما يكون نموذجك الأساسي نموذجًا محليًا أو صغيرًا وتريد أن تُنتَج ملخصات Compaction بواسطة نموذج أكثر قدرة. يقبل هذا التجاوز أي سلسلة `provider/model-id`:

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

عند عدم ضبطه، يستخدم Compaction النموذج الأساسي للوكيل.

## موفرو Compaction القابلون للتوصيل

يمكن لـ Plugin تسجيل موفر Compaction مخصص عبر `registerCompactionProvider()` في Plugin API. وعندما يكون الموفّر مسجلًا ومهيّأً، يفوّض OpenClaw التلخيص إليه بدلًا من مسار LLM المدمج.

لاستخدام موفّر مسجل، اضبط معرّف الموفّر في الإعدادات:

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

يؤدي ضبط `provider` تلقائيًا إلى فرض `mode: "safeguard"`. وتتلقى الموفّرات تعليمات Compaction نفسها وسياسة الحفاظ على المعرّفات نفسها كما في المسار المدمج، ويواصل OpenClaw أيضًا الحفاظ على سياق اللاحقة للأدوار الحديثة والأدوار المقسّمة بعد مخرجات الموفّر. وإذا فشل الموفّر أو أعاد نتيجة فارغة، يعود OpenClaw إلى تلخيص LLM المدمج.

## Compaction التلقائي (مفعّل افتراضيًا)

عندما تقترب جلسة من نافذة سياق النموذج أو تتجاوزها، يشغّل OpenClaw Compaction التلقائي وقد يعيد محاولة الطلب الأصلي باستخدام السياق المضغوط.

سترى:

- `🧹 Auto-compaction complete` في الوضع المطوّل
- يعرض `/status` القيمة `🧹 Compactions: <count>`

قبل Compaction، يمكن لـ OpenClaw تشغيل دور **تفريغ ذاكرة صامت** لتخزين
الملاحظات الدائمة على القرص. راجع [الذاكرة](/ar/concepts/memory) للتفاصيل والإعدادات.

## Compaction اليدوي

اكتب `/compact` في أي دردشة لفرض إجراء Compaction. وأضف تعليمات لتوجيه
الملخص:

```
/compact Focus on the API design decisions
```

## استخدام نموذج مختلف

افتراضيًا، يستخدم Compaction النموذج الأساسي لوكيلك. ويمكنك استخدام نموذج أكثر
قدرة للحصول على ملخصات أفضل:

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

افتراضيًا، يعمل Compaction بصمت. ولإظهار إشعارات موجزة عند بدء Compaction
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

عند التفعيل، يرى المستخدم رسائل حالة قصيرة حول كل تشغيل Compaction
(مثل "جارٍ ضغط السياق..." و"اكتمل Compaction").

## Compaction مقابل التقليص

|                  | Compaction                    | التقليص                         |
| ---------------- | ----------------------------- | -------------------------------- |
| **ما الذي يفعله** | يلخّص المحادثة الأقدم         | يقتطع نتائج الأدوات القديمة      |
| **هل يُحفَظ؟**   | نعم (في سجل الجلسة)           | لا (في الذاكرة فقط، لكل طلب)     |
| **النطاق**       | المحادثة كاملة                | نتائج الأدوات فقط                |

يُعد [تقليص الجلسة](/ar/concepts/session-pruning) مكمّلًا أخف وزنًا
يقتطع مخرجات الأدوات دون تلخيص.

## استكشاف الأخطاء وإصلاحها

**هل يحدث Compaction كثيرًا جدًا؟** قد تكون نافذة سياق النموذج صغيرة، أو قد
تكون مخرجات الأدوات كبيرة. جرّب تفعيل
[تقليص الجلسة](/ar/concepts/session-pruning).

**هل يبدو السياق قديمًا بعد Compaction؟** استخدم `/compact Focus on <topic>` من أجل
توجيه الملخص، أو فعّل [تفريغ الذاكرة](/ar/concepts/memory) حتى تبقى
الملاحظات محفوظة.

**هل تحتاج إلى بداية نظيفة؟** يبدأ `/new` جلسة جديدة دون إجراء Compaction.

للاطلاع على الإعدادات المتقدمة (توكنات الاحتياط، والحفاظ على المعرّفات، ومحركات
السياق المخصصة، وCompaction من جانب الخادم في OpenAI)، راجع
[التعمق في إدارة الجلسات وCompaction](/ar/reference/session-management-compaction).

## ذو صلة

- [الجلسة](/ar/concepts/session) — إدارة الجلسة ودورة حياتها
- [تقليص الجلسة](/ar/concepts/session-pruning) — اقتطاع نتائج الأدوات
- [السياق](/ar/concepts/context) — كيف يُبنى السياق لأدوار الوكيل
- [Hooks](/ar/automation/hooks) — Hooks دورة حياة Compaction ‏(before_compaction, after_compaction)
