---
read_when:
    - أنت تغيّر وقت تشغيل الوكيل المضمّن أو سجل الحزام
    - أنت تسجّل حزام وكيل من Plugin مضمّن أو موثوق
    - أنت بحاجة إلى فهم كيفية ارتباط Plugin الخاص بـ Codex بمزوّدي النماذج
sidebarTitle: Agent Harness
summary: سطح SDK تجريبي لـ Plugins التي تستبدل المنفّذ المضمّن منخفض المستوى للوكيل
title: Plugins حزام الوكيل
x-i18n:
    generated_at: "2026-04-25T13:53:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

إن **حزام الوكيل** هو المنفّذ منخفض المستوى لدورة وكيل OpenClaw واحدة مُحضّرة.
وهو ليس مزوّد نموذج، وليس قناة، وليس سجل أدوات.
وللاطلاع على النموذج الذهني الموجّه للمستخدم، راجع [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes).

استخدم هذا السطح فقط مع Plugins الأصلية المضمّنة أو الموثوقة. ولا يزال العقد
تجريبيًا لأن أنواع المعلمات تعكس عمدًا المنفّذ المضمّن الحالي.

## متى تستخدم حزامًا

سجّل حزام وكيل عندما تكون لعائلة نماذج ما بيئة جلسة أصلية خاصة بها
ويكون نقل مزوّد OpenClaw العادي تجريدًا غير مناسب.

أمثلة:

- خادم coding-agent أصلي يملك threads وCompaction
- CLI أو daemon محلي يجب أن يبث أحداث الخطة/التفكير/الأدوات الأصلية
- وقت تشغيل نموذج يحتاج إلى resume id خاص به بالإضافة إلى
  transcript جلسة OpenClaw

**لا** تسجّل حزامًا لمجرد إضافة LLM API جديد. فبالنسبة إلى واجهات HTTP أو
WebSocket العادية للنماذج، ابنِ [Plugin مزوّد](/ar/plugins/sdk-provider-plugins).

## ما الذي لا تزال النواة تملكه

قبل اختيار الحزام، يكون OpenClaw قد حل بالفعل:

- المزوّد والنموذج
- حالة المصادقة في وقت التشغيل
- مستوى التفكير وميزانية السياق
- transcript/ملف الجلسة الخاص بـ OpenClaw
- مساحة العمل وsandbox وسياسة الأدوات
- نداءات رد القناة ونداءات البث
- سياسة الرجوع الاحتياطي للنموذج والتبديل الحي للنموذج

هذا الفصل مقصود. فالحزام يشغّل محاولة مُحضّرة؛ ولا يختار
المزوّدين، ولا يستبدل تسليم القناة، ولا يبدّل النماذج بصمت.

## تسجيل حزام

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

يختار OpenClaw حزامًا بعد حل المزوّد/النموذج:

1. يفوز معرّف الحزام المسجّل الخاص بجلسة موجودة، حتى لا تؤدي تغييرات الإعداد/البيئة
   إلى تبديل هذا transcript إلى وقت تشغيل آخر أثناء العمل.
2. يفرض `OPENCLAW_AGENT_RUNTIME=<id>` حزامًا مسجّلًا بهذا المعرّف على
   الجلسات غير المثبّتة بالفعل.
3. يفرض `OPENCLAW_AGENT_RUNTIME=pi` الحزام المضمّن PI.
4. يطلب `OPENCLAW_AGENT_RUNTIME=auto` من الأحزمة المسجّلة ما إذا كانت تدعم
   المزوّد/النموذج المحلول.
5. إذا لم يطابق أي حزام مسجّل، يستخدم OpenClaw ‏PI ما لم يكن الرجوع الاحتياطي إلى PI
   معطلًا.

تظهر إخفاقات أحزمة Plugin على أنها إخفاقات تشغيل. وفي وضع `auto`، لا يُستخدم الرجوع الاحتياطي إلى PI
إلا عندما لا يدعم أي حزام Plugin مسجّل المزوّد/النموذج
المحلول. وبمجرد أن يطالب حزام Plugin بتشغيل ما، لا يعيد OpenClaw
تشغيل الدورة نفسها عبر PI لأن ذلك قد يغير دلالات المصادقة/وقت التشغيل
أو يكرر الآثار الجانبية.

يُحفَظ معرّف الحزام المختار مع معرّف الجلسة بعد تشغيل مضمّن.
وتُعامَل الجلسات القديمة التي أُنشئت قبل تثبيت الحزام على أنها مثبتة على PI بمجرد
أن يصبح لها سجل transcript. استخدم جلسة جديدة/معاد تعيينها عند التبديل بين PI
وحزام Plugin أصلي. يعرض `/status` معرّفات الأحزمة غير الافتراضية مثل `codex`
إلى جانب `Fast`؛ بينما يبقى PI مخفيًا لأنه مسار التوافق الافتراضي.
وإذا بدا الحزام المختار غير متوقع، ففعّل تسجيل التصحيح `agents/harness`
وافحص السجل المنظَّم `agent harness selected` الخاص بـ gateway. فهو يتضمن
معرّف الحزام المختار، وسبب الاختيار، وسياسة وقت التشغيل/الرجوع الاحتياطي، و، في
وضع `auto`، نتيجة الدعم الخاصة بكل مرشح Plugin.

يسجّل Plugin ‏Codex المضمّن `codex` باعتباره معرّف الحزام. وتتعامل النواة مع ذلك
على أنه معرّف حزام Plugin عادي؛ أما الأسماء المستعارة الخاصة بـ Codex فتنتمي إلى Plugin
أو إعدادات المشغّل، وليس إلى محدد وقت التشغيل المشترك.

## الاقتران بين المزوّد والحزام

ينبغي لمعظم الأحزمة أن تسجّل مزوّدًا أيضًا. فالمزوّد يجعل مراجع النماذج،
وحالة المصادقة، وبيانات تعريف النماذج، واختيار `/model` مرئية لبقية
OpenClaw. ثم يطالب الحزام بهذا المزوّد في `supports(...)`.

ويتبع Plugin ‏Codex المضمّن هذا النمط:

- مراجع النماذج المفضلة للمستخدم: `openai/gpt-5.5` بالإضافة إلى
  `embeddedHarness.runtime: "codex"`
- مراجع التوافق: لا تزال مراجع `codex/gpt-*` القديمة مقبولة، لكن
  الإعدادات الجديدة يجب ألا تستخدمها كمراجع عادية من نوع provider/model
- معرّف الحزام: `codex`
- المصادقة: توفر مزوّد اصطناعي، لأن حزام Codex يملك
  تسجيل الدخول/الجلسة الأصلية لـ Codex
- طلب app-server: يرسل OpenClaw معرّف النموذج المجرّد إلى Codex ويترك
  الحزام يتحدث إلى بروتوكول app-server الأصلي

Plugin ‏Codex إضافي. وتستمر مراجع `openai/gpt-*` العادية في استخدام
مسار مزوّد OpenClaw العادي ما لم تفرض حزام Codex باستخدام
`embeddedHarness.runtime: "codex"`. أما مراجع `codex/gpt-*` الأقدم فما زالت تختار
مزوّد Codex وحزامه من أجل التوافق.

بالنسبة إلى إعداد المشغّل، وأمثلة بادئات النماذج، والإعدادات الخاصة بـ Codex فقط، راجع
[Codex Harness](/ar/plugins/codex-harness).

يتطلب OpenClaw إصدار Codex app-server ‏`0.118.0` أو أحدث. ويتحقق Plugin ‏Codex من
مصافحة التهيئة الخاصة بـ app-server ويحظر الخوادم الأقدم أو غير المرقمة حتى
لا يعمل OpenClaw إلا مقابل سطح البروتوكول الذي تم اختباره معه.

### وسيط نتائج الأدوات

يمكن للـ Plugins المضمّنة إرفاق وسيط نتائج أدوات محايد لوقت التشغيل عبر
`api.registerAgentToolResultMiddleware(...)` عندما يعلن manifest الخاص بها
معرّفات وقت التشغيل المستهدفة في `contracts.agentToolResultMiddleware`. وهذه
الوصلة الموثوقة مخصصة لتحويلات نتائج الأدوات غير المتزامنة التي يجب أن تعمل قبل أن يعيد PI أو Codex
تغذية خرج الأداة إلى النموذج.

ولا تزال Plugins المضمّنة القديمة تستطيع استخدام
`api.registerCodexAppServerExtensionFactory(...)` للوسيطات الخاصة بـ Codex app-server فقط،
لكن تحويلات النتائج الجديدة يجب أن تستخدم API المحايد لوقت التشغيل.
وقد أُزيل الخطاف `api.registerEmbeddedExtensionFactory(...)` الخاص بـ Pi فقط؛
ويجب أن تستخدم تحويلات نتائج أدوات Pi وسيطًا محايدًا لوقت التشغيل.

### وضع حزام Codex الأصلي

إن الحزام المضمّن `codex` هو وضع Codex الأصلي لدورات
وكيل OpenClaw المضمّنة. فعّل Plugin ‏`codex` المضمّن أولًا، وضمّن `codex` في
`plugins.allow` إذا كانت إعداداتك تستخدم قائمة سماح مقيِّدة. ويجب أن تستخدم إعدادات app-server الأصلية
القيمة `openai/gpt-*` مع `embeddedHarness.runtime: "codex"`.
واستخدم `openai-codex/*` لمصادقة Codex OAuth عبر PI بدلًا من ذلك. أما مراجع النماذج
القديمة `codex/*` فما تزال أسماء مستعارة للتوافق مع الحزام الأصلي.

عندما يعمل هذا الوضع، يملك Codex معرّف thread الأصلي، وسلوك الاستئناف،
وCompaction، وتنفيذ app-server. بينما يظل OpenClaw يملك قناة الدردشة،
ومرآة transcript المرئية، وسياسة الأدوات، والموافقات، وتسليم الوسائط، واختيار الجلسة.
استخدم `embeddedHarness.runtime: "codex"` من دون تجاوز لـ `fallback`
عندما تحتاج إلى إثبات أن مسار Codex app-server فقط هو الذي يمكنه المطالبة بالتشغيل.
فأوقات تشغيل Plugins الصريحة تُفشل بإغلاق افتراضي أصلًا. واضبط `fallback: "pi"`
فقط عندما تريد عمدًا أن يتولى PI معالجة غياب اختيار الحزام. أما إخفاقات Codex
app-server فتفشل مباشرة أصلًا بدل إعادة المحاولة عبر PI.

## تعطيل الرجوع الاحتياطي إلى PI

افتراضيًا، يشغّل OpenClaw الوكلاء المضمّنين مع ضبط `agents.defaults.embeddedHarness`
على `{ runtime: "auto", fallback: "pi" }`. وفي وضع `auto`، يمكن لأحزمة Plugin
المسجّلة المطالبة بزوج مزوّد/نموذج. وإذا لم يطابق أي منها، يعود OpenClaw إلى PI.

في وضع `auto`، اضبط `fallback: "none"` عندما تحتاج إلى أن يؤدي غياب اختيار حزام Plugin
إلى الفشل بدلًا من استخدام PI. أما أوقات تشغيل Plugins الصريحة مثل
`runtime: "codex"` فتفشل بإغلاق افتراضيًا أصلًا، ما لم تكن `fallback: "pi"` مضبوطة
في إعدادات النطاق نفسه أو تجاوز البيئة. وتفشل إخفاقات أحزمة Plugin المختارة
دائمًا بشكل صارم. وهذا لا يحظر `runtime: "pi"` الصريح أو
`OPENCLAW_AGENT_RUNTIME=pi`.

بالنسبة إلى التشغيلات المضمّنة الخاصة بـ Codex فقط:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

إذا كنت تريد أن تتمكن أي أحزمة Plugin مسجّلة من المطالبة بالنماذج المطابقة لكنك لا تريد أبدًا
أن يعود OpenClaw بصمت إلى PI، فأبقِ `runtime: "auto"` وعطّل
الرجوع الاحتياطي:

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

تستخدم تجاوزات كل وكيل الشكل نفسه:

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
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

لا يزال `OPENCLAW_AGENT_RUNTIME` يتجاوز وقت التشغيل المضبوط. واستخدم
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` لتعطيل الرجوع الاحتياطي إلى PI من
البيئة.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

عند تعطيل الرجوع الاحتياطي، تفشل الجلسة مبكرًا عندما لا يكون الحزام المطلوب
مسجّلًا، أو لا يدعم المزوّد/النموذج المحلول، أو يفشل قبل
إنتاج آثار جانبية للدورة. وهذا مقصود من أجل عمليات النشر الخاصة بـ Codex فقط
وللاختبارات الحية التي يجب أن تثبت أن مسار Codex app-server مستخدم فعليًا.

يتحكم هذا الإعداد فقط في حزام الوكيل المضمّن. وهو لا يعطّل
توجيه النماذج الخاصة بالصور، أو الفيديو، أو الموسيقى، أو TTS، أو PDF، أو غيرها من المسارات الخاصة بالمزوّد.

## الجلسات الأصلية ومرآة transcript

يمكن أن يحتفظ الحزام بمعرّف جلسة أصلي، أو معرّف thread، أو resume token
على جانب daemon.
أبقِ هذا الربط مرتبطًا صراحةً بجلسة OpenClaw، واستمر في
عكس خرج المساعد/الأداة المرئي للمستخدم داخل transcript الخاص بـ OpenClaw.

يظل transcript الخاص بـ OpenClaw طبقة التوافق من أجل:

- سجل الجلسة المرئي في القناة
- البحث في transcript وفهرسته
- التبديل عودةً إلى حزام PI المضمّن في دورة لاحقة
- السلوك العام لـ `/new`، و`/reset`، وحذف الجلسة

إذا كان الحزام لديك يخزن sidecar binding، فنفّذ `reset(...)` حتى يتمكن OpenClaw
من مسحه عندما تُعاد تعيين جلسة OpenClaw المالكة.

## نتائج الأدوات والوسائط

تبني النواة قائمة أدوات OpenClaw وتمررها إلى المحاولة المُحضّرة.
وعندما ينفذ الحزام استدعاء أداة ديناميكيًا، فأعد نتيجة الأداة عبر
شكل نتيجة الحزام بدلًا من إرسال وسائط القناة بنفسك.

وهذا يُبقي النص، والصورة، والفيديو، والموسيقى، وTTS، والموافقة، ومخرجات أدوات الرسائل
على مسار التسليم نفسه الذي تستخدمه التشغيلات المدعومة من PI.

## القيود الحالية

- مسار الاستيراد العام عام، لكن بعض الأسماء المستعارة لأنواع المحاولة/النتيجة لا تزال
  تحمل أسماء `Pi` من أجل التوافق.
- يظل تثبيت أحزمة الجهات الخارجية تجريبيًا. ويفضَّل استخدام Plugins المزوّد
  إلى أن تحتاج إلى وقت تشغيل جلسة أصلية.
- تبديل الحزام مدعوم عبر الدورات. ولا ينبغي تبديل الأحزمة في
  منتصف دورة بعد أن تكون الأدوات الأصلية، أو الموافقات، أو نص المساعد، أو عمليات إرسال الرسائل
  قد بدأت.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview)
- [مساعدات وقت التشغيل](/ar/plugins/sdk-runtime)
- [Plugins المزوّد](/ar/plugins/sdk-provider-plugins)
- [Codex Harness](/ar/plugins/codex-harness)
- [مزوّدو النماذج](/ar/concepts/model-providers)
