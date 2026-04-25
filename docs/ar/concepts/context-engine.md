---
read_when:
    - أنت تريد فهم كيفية قيام OpenClaw بتجميع سياق النموذج
    - أنت تقوم بالتبديل بين المحرك القديم ومحرك Plugin
    - أنت تقوم ببناء Plugin لمحرك السياق
summary: 'محرك السياق: تجميع سياق قابل للتوصيل، وCompaction، ودورة حياة الوكلاء الفرعيين'
title: محرك السياق
x-i18n:
    generated_at: "2026-04-25T13:45:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

يتحكم **محرك السياق** في كيفية قيام OpenClaw ببناء سياق النموذج لكل تشغيل:
ما الرسائل التي يجب تضمينها، وكيفية تلخيص السجل الأقدم، وكيفية إدارة
السياق عبر حدود الوكلاء الفرعيين.

يأتي OpenClaw مع محرك مدمج باسم `legacy` ويستخدمه افتراضيًا — معظم
المستخدمين لا يحتاجون أبدًا إلى تغيير هذا. قم بتثبيت محرك Plugin واختياره فقط عندما
تريد سلوكًا مختلفًا للتجميع، أو Compaction، أو الاستدعاء عبر الجلسات.

## بداية سريعة

تحقق من المحرك النشط:

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### تثبيت Plugin لمحرك السياق

يتم تثبيت Plugins محرك السياق مثل أي Plugin آخر في OpenClaw. قم بالتثبيت
أولًا، ثم اختر المحرك في الفتحة:

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

ثم فعّل Plugin واختره كمحرك نشط في إعداداتك:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // must match the plugin's registered engine id
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin-specific config goes here (see the plugin's docs)
      },
    },
  },
}
```

أعد تشغيل Gateway بعد التثبيت والإعداد.

للرجوع إلى المحرك المدمج، اضبط `contextEngine` على `"legacy"` (أو
احذف المفتاح بالكامل — `"legacy"` هو الافتراضي).

## كيف يعمل

في كل مرة يشغّل فيها OpenClaw مطالبة نموذج، يشارك محرك السياق في
أربع نقاط ضمن دورة الحياة:

1. **الاستيعاب** — يتم استدعاؤه عند إضافة رسالة جديدة إلى الجلسة. يمكن للمحرك
   تخزين الرسالة أو فهرستها في مخزن البيانات الخاص به.
2. **التجميع** — يتم استدعاؤه قبل كل تشغيل للنموذج. يعيد المحرك مجموعة
   مرتبة من الرسائل (مع `systemPromptAddition` اختياري) تتناسب مع
   ميزانية الرموز.
3. **Compaction** — يتم استدعاؤه عندما تمتلئ نافذة السياق، أو عندما يشغّل المستخدم
   `/compact`. يقوم المحرك بتلخيص السجل الأقدم لتحرير مساحة.
4. **بعد الدور** — يتم استدعاؤه بعد اكتمال التشغيل. يمكن للمحرك حفظ الحالة،
   أو تشغيل Compaction في الخلفية، أو تحديث الفهارس.

بالنسبة إلى حزمة Codex المدمجة غير التابعة لـ ACP، يطبّق OpenClaw دورة الحياة نفسها من خلال
إسقاط السياق المجمّع في تعليمات المطوّر الخاصة بـ Codex ومطالبة الدور الحالية. يظل Codex
مالكًا لسجل الخيوط الأصلي وآلية Compaction الأصلية الخاصة به.

### دورة حياة الوكيل الفرعي (اختياري)

يستدعي OpenClaw خطافين اختياريين لدورة حياة الوكيل الفرعي:

- **prepareSubagentSpawn** — يجهّز حالة السياق المشتركة قبل بدء تشغيل الطفل.
  يتلقى الخطاف مفاتيح جلسة الأصل/الطفل، و`contextMode`
  (`isolated` أو `fork`)، ومعرّفات/ملفات النصوص المتاحة، وTTL اختياري.
  إذا أعاد مقبض تراجع، فسيقوم OpenClaw باستدعائه عندما يفشل الإنشاء بعد
  نجاح التحضير.
- **onSubagentEnded** — ينظّف الحالة عند اكتمال جلسة وكيل فرعي أو عند تنظيفها.

### إضافة مطالبة النظام

يمكن للطريقة `assemble` أن تعيد سلسلة `systemPromptAddition`. يقوم OpenClaw
بإضافتها في مقدمة مطالبة النظام الخاصة بالتشغيل. يتيح ذلك للمحركات حقن
إرشادات استدعاء ديناميكية، أو تعليمات استرجاع، أو تلميحات
مدركة للسياق دون الحاجة إلى ملفات ثابتة في مساحة العمل.

## المحرك legacy

يحافظ المحرك المدمج `legacy` على السلوك الأصلي لـ OpenClaw:

- **الاستيعاب**: لا شيء (يتولى مدير الجلسة حفظ الرسائل مباشرة).
- **التجميع**: تمرير مباشر (يتولى خط الأنابيب الحالي sanitize → validate → limit
  في وقت التشغيل تجميع السياق).
- **Compaction**: يفوّض إلى Compaction التلخيص المدمج، الذي ينشئ
  ملخصًا واحدًا للرسائل الأقدم ويُبقي الرسائل الحديثة كما هي.
- **بعد الدور**: لا شيء.

لا يسجل المحرك legacy أدوات ولا يوفّر `systemPromptAddition`.

عندما لا يتم ضبط `plugins.slots.contextEngine` (أو يتم ضبطه على `"legacy"`)، يتم
استخدام هذا المحرك تلقائيًا.

## محركات Plugin

يمكن لـ Plugin تسجيل محرك سياق باستخدام API الخاص بـ Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

ثم قم بتمكينه في الإعدادات:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### الواجهة ContextEngine

الأعضاء المطلوبة:

| العضو              | النوع    | الغرض                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | خاصية    | معرّف المحرك، والاسم، والإصدار، وما إذا كان يملك Compaction |
| `ingest(params)`   | طريقة    | تخزين رسالة واحدة                                       |
| `assemble(params)` | طريقة    | بناء السياق لتشغيل نموذج (يعيد `AssembleResult`)         |
| `compact(params)`  | طريقة    | تلخيص/تقليل السياق                                      |

تعيد `assemble` قيمة `AssembleResult` تحتوي على:

- `messages` — الرسائل المرتبة التي سيتم إرسالها إلى النموذج.
- `estimatedTokens` (مطلوب، `number`) — تقدير المحرك لإجمالي
  الرموز في السياق المجمّع. يستخدم OpenClaw هذا لاتخاذ قرارات عتبة Compaction
  وللتقارير التشخيصية.
- `systemPromptAddition` (اختياري، `string`) — يُضاف في مقدمة مطالبة النظام.

الأعضاء الاختياريون:

| العضو                         | النوع  | الغرض                                                                                                            |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | طريقة  | تهيئة حالة المحرك لجلسة. تُستدعى مرة واحدة عند أول مرة يرى فيها المحرك جلسة (مثلًا استيراد السجل).            |
| `ingestBatch(params)`          | طريقة  | استيعاب دور مكتمل كدفعة. تُستدعى بعد اكتمال التشغيل، مع جميع رسائل ذلك الدور دفعة واحدة.                       |
| `afterTurn(params)`            | طريقة  | أعمال دورة الحياة بعد التشغيل (حفظ الحالة، تشغيل Compaction في الخلفية).                                      |
| `prepareSubagentSpawn(params)` | طريقة  | إعداد الحالة المشتركة لجلسة طفل قبل بدئها.                                                                     |
| `onSubagentEnded(params)`      | طريقة  | التنظيف بعد انتهاء وكيل فرعي.                                                                                   |
| `dispose()`                    | طريقة  | تحرير الموارد. تُستدعى أثناء إيقاف Gateway أو إعادة تحميل Plugin — وليس لكل جلسة.                              |

### ownsCompaction

يتحكم `ownsCompaction` في ما إذا كانت آلية Compaction التلقائية المدمجة الخاصة بـ Pi أثناء المحاولة
تظل مفعلة للتشغيل:

- `true` — يملك المحرك سلوك Compaction. يقوم OpenClaw بتعطيل
  Compaction التلقائي المدمج لـ Pi لذلك التشغيل، وتصبح عملية `compact()`
  الخاصة بالمحرك مسؤولة عن `/compact`، وCompaction استعادة الفائض، وأي Compaction
  استباقي يريد تنفيذه في `afterTurn()`. قد يظل OpenClaw يشغّل
  أمان الفائض قبل المطالبة؛ وعندما يتوقع أن النص الكامل سيفيض،
  يستدعي مسار الاستعادة `compact()` للمحرك النشط قبل
  إرسال مطالبة أخرى.
- `false` أو غير مضبوط — قد يظل Compaction التلقائي المدمج لـ Pi يعمل أثناء
  تنفيذ المطالبة، لكن طريقة `compact()` الخاصة بالمحرك النشط تظل تُستدعى من أجل
  `/compact` واستعادة الفائض.

لا يعني `ownsCompaction: false` أن OpenClaw يعود تلقائيًا إلى
مسار Compaction الخاص بالمحرك legacy.

وهذا يعني أن هناك نمطين صالحين لـ Plugin:

- **وضع التملك** — نفّذ خوارزمية Compaction خاصة بك واضبط
  `ownsCompaction: true`.
- **وضع التفويض** — اضبط `ownsCompaction: false` واجعل `compact()`
  تستدعي `delegateCompactionToRuntime(...)` من `openclaw/plugin-sdk/core` لاستخدام
  سلوك Compaction المدمج في OpenClaw.

إن وجود `compact()` لا تفعل شيئًا غير آمن لمحرك نشط غير مالك لأن ذلك
يعطّل المسار العادي لـ `/compact` وCompaction استعادة الفائض لذلك
المحرك في تلك الفتحة.

## مرجع الإعدادات

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

تكون الفتحة حصرية وقت التشغيل — يتم حل محرك سياق واحد مسجل فقط
لتشغيل أو عملية Compaction معينة. يمكن لبقية
Plugins من النوع `kind: "context-engine"` أن تستمر في التحميل وتشغيل
كود التسجيل الخاص بها؛ يحدد `plugins.slots.contextEngine` فقط أي معرّف محرك مسجل
يقوم OpenClaw بحله عندما يحتاج إلى محرك سياق.

## العلاقة مع Compaction والذاكرة

- **Compaction** هي إحدى مسؤوليات محرك السياق. يفوّض المحرك legacy
  إلى التلخيص المدمج في OpenClaw. ويمكن لمحركات Plugin تنفيذ
  أي استراتيجية Compaction (ملخصات DAG، والاسترجاع المتجهي، وما إلى ذلك).
- **Plugins الذاكرة** (`plugins.slots.memory`) منفصلة عن محركات السياق.
  توفر Plugins الذاكرة البحث/الاسترجاع؛ بينما تتحكم محركات السياق فيما
  يراه النموذج. ويمكن أن تعملا معًا — فقد يستخدم محرك سياق بيانات
  Plugin الذاكرة أثناء التجميع. ويجب على محركات Plugin التي تريد مسار
  مطالبة الذاكرة النشطة أن تفضّل `buildMemorySystemPromptAddition(...)` من
  `openclaw/plugin-sdk/core`، الذي يحوّل أقسام مطالبة الذاكرة النشطة
  إلى `systemPromptAddition` جاهزة للإضافة في المقدمة. وإذا احتاج محرك إلى
  تحكم منخفض المستوى، فلا يزال بإمكانه سحب الأسطر الخام من
  `openclaw/plugin-sdk/memory-host-core` عبر
  `buildActiveMemoryPromptSection(...)`.
- **تنظيف الجلسة** (قص نتائج الأدوات القديمة في الذاكرة) يظل يعمل
  بغض النظر عن محرك السياق النشط.

## نصائح

- استخدم `openclaw doctor` للتحقق من أن محركك يتم تحميله بشكل صحيح.
- إذا قمت بالتبديل بين المحركات، فستستمر الجلسات الحالية باستخدام سجلها الحالي.
  ويتولى المحرك الجديد التشغيلات المستقبلية.
- يتم تسجيل أخطاء المحرك وإظهارها في التشخيصات. إذا فشل محرك Plugin
  في التسجيل أو تعذر حل معرّف المحرك المحدد، فإن OpenClaw
  لا يعود تلقائيًا؛ بل تفشل التشغيلات حتى تصلح Plugin أو
  تعيد `plugins.slots.contextEngine` إلى `"legacy"`.
- لأغراض التطوير، استخدم `openclaw plugins install -l ./my-engine` لربط
  دليل Plugin محلي من دون نسخه.

راجع أيضًا: [Compaction](/ar/concepts/compaction)، [السياق](/ar/concepts/context)،
[Plugins](/ar/tools/plugin)، [بيان Plugin](/ar/plugins/manifest).

## ذو صلة

- [السياق](/ar/concepts/context) — كيفية بناء السياق لأدوار الوكيل
- [بنية Plugin](/ar/plugins/architecture) — تسجيل Plugins محرك السياق
- [Compaction](/ar/concepts/compaction) — تلخيص المحادثات الطويلة
