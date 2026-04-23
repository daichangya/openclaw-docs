---
read_when:
    - أنت تغيّر وقت تشغيل الوكيل المضمّن أو سجل harness@endsection to=final code av不卡免费播放
    - أنت تسجّل agent harness من Plugin مضمّنة أو موثوقة
    - تحتاج إلى فهم كيفية ارتباط Plugin الخاصة بـ Codex بمزوّدي النماذج
sidebarTitle: Agent Harness
summary: سطح SDK تجريبي للـ Plugins التي تستبدل منفّذ الوكيل المضمّن منخفض المستوى
title: Plugins Agent Harness
x-i18n:
    generated_at: "2026-04-23T07:28:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugins Agent Harness

يمثل **agent harness** المنفّذ منخفض المستوى لدورة وكيل OpenClaw واحدة
تم إعدادها مسبقًا. وهو ليس مزوّد نماذج، وليس قناة، وليس سجل أدوات.

استخدم هذا السطح فقط مع Plugins الأصلية المضمّنة أو الموثوقة. ولا يزال هذا العقد
تجريبيًا لأن أنواع الوسائط تعكس عمدًا embedded runner الحالي.

## متى تستخدم harness

سجّل agent harness عندما تكون لعائلة نماذج ما بيئة جلسة أصلية خاصة بها
ويكون نقل المزوّد العادي في OpenClaw تجريدًا غير مناسب.

أمثلة:

- خادم وكيل برمجة أصلي يملك السلاسل وCompaction
- CLI أو daemon محلي يجب أن يبث أحداث الخطة/الاستدلال/الأدوات الأصلية
- وقت تشغيل نموذج يحتاج إلى resume id خاص به بالإضافة إلى
  النص الكامل لجلسة OpenClaw

**لا** تسجّل harness لمجرد إضافة API جديدة لـ LLM. بالنسبة إلى واجهات HTTP أو
WebSocket العادية الخاصة بالنماذج، ابنِ [Plugin مزوّد](/ar/plugins/sdk-provider-plugins).

## ما الذي تظل النواة مسؤولة عنه

قبل اختيار harness، يكون OpenClaw قد حدد بالفعل:

- المزوّد والنموذج
- حالة مصادقة وقت التشغيل
- مستوى التفكير وميزانية السياق
- النص الكامل/ملف الجلسة الخاص بـ OpenClaw
- مساحة العمل وsandbox وسياسة الأدوات
- نداءات الرد على القنوات ونداءات البث
- سياسة الاحتياط للنماذج والتبديل الحي للنموذج

هذا التقسيم مقصود. فـ harness يشغّل محاولة مُعدّة؛ ولا يختار
المزوّدين، ولا يستبدل تسليم القنوات، ولا يبدّل النماذج بصمت.

## تسجيل harness

**الاستيراد:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## سياسة الاختيار

يختار OpenClaw harness بعد حل المزوّد/النموذج:

1. تفرض `OPENCLAW_AGENT_RUNTIME=<id>` harness مسجلة بذلك المعرّف.
2. تفرض `OPENCLAW_AGENT_RUNTIME=pi` استخدام harness المضمّنة PI.
3. تطلب `OPENCLAW_AGENT_RUNTIME=auto` من harnesses المسجّلة ما إذا كانت تدعم
   المزوّد/النموذج المحدد.
4. إذا لم تُطابق أي harness مسجلة، يستخدم OpenClaw ‏PI ما لم يكن احتياط PI
   معطّلًا.

تظهر إخفاقات harness الخاصة بالـ Plugin على أنها إخفاقات تشغيل. وفي وضع `auto`،
لا يُستخدم احتياط PI إلا عندما لا تدعم أي Plugin harness مسجلة
المزوّد/النموذج المحدد. وبمجرد أن تطالب Plugin harness بتشغيل ما، لا يعيد
OpenClaw تشغيل الدورة نفسها عبر PI لأن ذلك قد يغيّر دلالات
المصادقة/وقت التشغيل أو يكرر الآثار الجانبية.

تسجّل Plugin المضمّنة الخاصة بـ Codex القيمة `codex` كمعرّف harness لها. وتعامل النواة ذلك
بوصفه معرّف Plugin harness عاديًا؛ أما الأسماء البديلة الخاصة بـ Codex فيجب أن تنتمي إلى Plugin
أو إلى إعدادات المشغّل، لا إلى محدد وقت التشغيل المشترك.

## إقران المزوّد مع harness

ينبغي لمعظم harnesses أيضًا تسجيل مزوّد. يجعل المزوّد مراجع النماذج،
وحالة المصادقة، وبيانات النموذج الوصفية، واختيار `/model` مرئية لبقية
OpenClaw. ثم تطالب harness بذلك المزوّد في `supports(...)`.

تتبع Plugin المضمّنة الخاصة بـ Codex هذا النمط:

- معرّف المزوّد: `codex`
- مراجع نماذج المستخدم: `codex/gpt-5.4` و`codex/gpt-5.2` أو نموذج آخر يعيده
  خادم تطبيق Codex
- معرّف harness: `codex`
- المصادقة: توفر مزوّد اصطناعي، لأن Codex harness تملك
  جلسة/تسجيل دخول Codex الأصليين
- طلب خادم التطبيق: يرسل OpenClaw معرّف النموذج المجرد إلى Codex ويترك
  harness تتحدث مع بروتوكول خادم التطبيق الأصلي

تمثل Plugin الخاصة بـ Codex إضافةً لا استبدالًا. وتظل مراجع `openai/gpt-*` العادية مراجع
مزوّد OpenAI وتستمر في استخدام مسار المزوّد العادي في OpenClaw. اختر `codex/gpt-*`
عندما تريد مصادقة مُدارة بواسطة Codex، واكتشاف نماذج Codex، وسلاسل أصلية،
وتنفيذ خادم تطبيق Codex. ويمكن لـ `/model` التبديل بين نماذج Codex التي يعيدها
خادم تطبيق Codex من دون الحاجة إلى بيانات اعتماد مزوّد OpenAI.

بالنسبة إلى إعداد المشغّل، وأمثلة بادئات النماذج، وإعدادات Codex فقط، راجع
[Codex Harness](/ar/plugins/codex-harness).

يتطلب OpenClaw الإصدار `0.118.0` أو أحدث من خادم تطبيق Codex. وتتحقق Plugin الخاصة بـ Codex من
مصافحة التهيئة لخادم التطبيق وتحظر الخوادم الأقدم أو غير المرقمة بالإصدار لكي
لا يعمل OpenClaw إلا مقابل سطح البروتوكول الذي اختُبر معه.

### برمجية Codex app-server الوسيطة لنتائج الأدوات

يمكن للـ Plugins المضمّنة أيضًا إرفاق برمجية `tool_result`
وسيطة خاصة بـ Codex app-server عبر `api.registerCodexAppServerExtensionFactory(...)` عندما
يعلن بيانها `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
وهذا هو الحد الفاصل للـ Plugins الموثوقة من أجل تحويلات نتائج الأدوات غير المتزامنة التي تحتاج
إلى التشغيل داخل Codex harness الأصلي قبل إعادة إسقاط خرج الأداة
إلى نص OpenClaw الكامل.

### وضع Codex harness الأصلي

يمثل `codex` harness المضمّن وضع Codex الأصلي لدورات وكيل OpenClaw
المضمّنة. فعّل أولًا Plugin المضمّنة `codex`، وأدرج `codex` في
`plugins.allow` إذا كان الإعداد لديك يستخدم قائمة سماح مقيّدة. وهو يختلف
عن `openai-codex/*`:

- يستخدم `openai-codex/*` ‏OAuth الخاص بـ ChatGPT/Codex عبر مسار
  المزوّد العادي في OpenClaw.
- يستخدم `codex/*` مزوّد Codex المضمّن ويوجّه الدورة عبر Codex
  app-server.

عند تشغيل هذا الوضع، تملك Codex معرّف السلسلة الأصلي، وسلوك الاستئناف،
وCompaction، وتنفيذ خادم التطبيق. بينما يظل OpenClaw مسؤولًا عن قناة الدردشة،
ونسخة النص الظاهرة، وسياسة الأدوات، والموافقات، وتسليم الوسائط، واختيار الجلسة.
استخدم `embeddedHarness.runtime: "codex"` مع
`embeddedHarness.fallback: "none"` عندما تحتاج إلى إثبات أن مسار Codex
app-server وحده يمكنه المطالبة بالتشغيل. وهذا الإعداد ليس سوى حارس اختيار:
فإخفاقات Codex app-server تفشل أصلًا مباشرة بدلًا من إعادة المحاولة عبر PI.

## تعطيل احتياط PI

افتراضيًا، يشغّل OpenClaw الوكلاء المضمّنين مع ضبط `agents.defaults.embeddedHarness`
على `{ runtime: "auto", fallback: "pi" }`. وفي وضع `auto`، تستطيع Plugin
harnesses المسجلة المطالبة بزوج مزوّد/نموذج. وإذا لم يطابق أيٌّ منها، يعود OpenClaw
إلى PI.

اضبط `fallback: "none"` عندما تحتاج إلى فشل اختيار Plugin harness المفقود
بدلًا من استخدام PI. أما إخفاقات Plugin harness المختارة فتفشل أصلًا بشكل نهائي.
ولا يمنع هذا `runtime: "pi"` الصريح أو `OPENCLAW_AGENT_RUNTIME=pi`.

بالنسبة إلى التشغيلات المضمّنة الخاصة بـ Codex فقط:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

إذا كنت تريد أن تطالب أي Plugin harness مسجلة بالنماذج المطابقة لكنك لا تريد
أن يعود OpenClaw بصمت إلى PI، فأبقِ `runtime: "auto"` وعطّل
الاحتياط:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

تستخدم التجاوزات لكل وكيل البنية نفسها:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

تظل `OPENCLAW_AGENT_RUNTIME` تتجاوز وقت التشغيل المضبوط. استخدم
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` لتعطيل احتياط PI من
البيئة.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

ومع تعطيل الاحتياط، تفشل الجلسة مبكرًا عندما لا تكون harness المطلوبة
مسجلة، أو لا تدعم المزوّد/النموذج المحدد، أو تفشل قبل
إنتاج آثار جانبية للدورة. وهذا مقصود في عمليات النشر الخاصة بـ Codex فقط
وفي الاختبارات الحية التي يجب أن تثبت أن مسار Codex app-server مستخدم فعلًا.

يتحكم هذا الإعداد فقط في agent harness المضمّنة. وهو لا يعطّل
توجيه النماذج الخاص بالمزوّد للصور أو الفيديو أو الموسيقى أو TTS أو PDF أو غيرها.

## الجلسات الأصلية ونسخة النص الكامل

قد تحتفظ harness بمعرّف جلسة أصلي، أو معرّف سلسلة، أو رمز استئناف
على جانب daemon. أبقِ هذا الربط مرتبطًا صراحةً بجلسة OpenClaw، واستمر
في عكس خرج المساعد/الأداة الظاهر للمستخدم إلى نص OpenClaw الكامل.

يظل نص OpenClaw الكامل طبقة التوافق من أجل:

- سجل الجلسة الظاهر على القناة
- البحث في النص الكامل وفهرسته
- العودة إلى PI harness المضمّنة في دورة لاحقة
- السلوك العام لـ `/new` و`/reset` وحذف الجلسة

إذا كانت harness الخاصة بك تخزّن ربطًا جانبيًا، فنفّذ `reset(...)` حتى يتمكن OpenClaw
من مسحه عند إعادة ضبط جلسة OpenClaw المالكة.

## نتائج الأدوات والوسائط

تنشئ النواة قائمة أدوات OpenClaw وتمررها إلى المحاولة المعدّة.
وعندما تنفذ harness استدعاء أداة ديناميكي، فأعد نتيجة الأداة عبر
بنية نتيجة harness بدلًا من إرسال وسائط القناة بنفسك.

وهذا يُبقي النص، والصورة، والفيديو، والموسيقى، وTTS، والموافقات، ومخرجات أدوات
المراسلة على مسار التسليم نفسه الذي تستخدمه التشغيلات المدعومة بـ PI.

## القيود الحالية

- مسار الاستيراد العام عام، لكن بعض الأسماء البديلة لأنواع المحاولة/النتيجة
  ما تزال تحمل أسماء `Pi` من أجل التوافق.
- لا يزال تثبيت harness من جهات خارجية تجريبيًا. وفضّل Plugins المزوّدين
  إلى أن تحتاج إلى وقت تشغيل جلسة أصلي.
- يُدعَم تبديل harnesses بين الدورات. ولا تبدّل harnesses في
  منتصف الدورة بعد أن تبدأ الأدوات الأصلية، أو الموافقات، أو نص المساعد، أو
  عمليات إرسال الرسائل.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview)
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins)
- [Codex Harness](/ar/plugins/codex-harness)
- [مزوّدو النماذج](/ar/concepts/model-providers)
