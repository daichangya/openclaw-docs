---
read_when:
    - أنت تقوم بربط سلوك دورة حياة محرك السياق داخل Codex harness
    - تحتاج إلى أن يعمل lossless-claw أو أي Plugin آخر لمحرك السياق مع جلسات `codex/*` الخاصة بـ embedded harness
    - أنت تقارن سلوك السياق بين PI المضمن وCodex app-server
summary: مواصفة لجعل Codex harness المضمن لخادم التطبيق يحترم Plugins الخاصة بمحرك السياق في OpenClaw
title: نقل محرك السياق لـ Codex Harness
x-i18n:
    generated_at: "2026-04-25T13:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## الحالة

مواصفة تنفيذ مسودة.

## الهدف

جعل Codex harness المضمن لخادم التطبيق يحترم عقد دورة حياة
محرك السياق نفسه في OpenClaw الذي تحترمه أدوار PI المضمنة بالفعل.

يجب أن تظل الجلسة التي تستخدم `agents.defaults.embeddedHarness.runtime: "codex"` أو
نموذج `codex/*` تسمح لـ Plugin محرك السياق المحدد، مثل
`lossless-claw`، بالتحكم في تجميع السياق، والاستيعاب بعد الدور، والصيانة،
وسياسة Compaction على مستوى OpenClaw بقدر ما تسمح به حدود Codex app-server.

## الأهداف غير المقصودة

- لا تُعد تنفيذًا جديدًا لآليات Codex app-server الداخلية.
- لا تجعل Compaction الأصلي لخيط Codex ينتج ملخصًا من lossless-claw.
- لا تطلب من النماذج غير التابعة لـ Codex استخدام Codex harness.
- لا تغيّر سلوك جلسات ACP/acpx. هذه المواصفة تخص فقط
  مسار embedded agent harness غير التابع لـ ACP.
- لا تجعل Plugins الجهات الخارجية تسجل مصانع امتدادات لـ Codex app-server؛
  إذ تبقى حدود الثقة الحالية الخاصة بـ Plugin المضمن كما هي.

## البنية الحالية

تحل حلقة التشغيل المضمنة محرك السياق المكوَّن مرة واحدة لكل تشغيل قبل
اختيار harness منخفض المستوى فعلي:

- `src/agents/pi-embedded-runner/run.ts`
  - يهيئ Plugins محرك السياق
  - يستدعي `resolveContextEngine(params.config)`
  - يمرر `contextEngine` و`contextTokenBudget` إلى
    `runEmbeddedAttemptWithBackend(...)`

يفوض `runEmbeddedAttemptWithBackend(...)` إلى agent harness المحدد:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

يتم تسجيل Codex app-server harness بواسطة Codex plugin المضمن:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

يتلقى تنفيذ Codex harness القيم نفسها من `EmbeddedRunAttemptParams` كما في محاولات PI:

- `extensions/codex/src/app-server/run-attempt.ts`

وهذا يعني أن نقطة الربط المطلوبة موجودة في كود يتحكم فيه OpenClaw. أما
الحد الخارجي فهو بروتوكول Codex app-server نفسه: يمكن لـ OpenClaw التحكم في
ما يرسله إلى `thread/start` و`thread/resume` و`turn/start`، ويمكنه
مراقبة الإشعارات، لكنه لا يستطيع تغيير مخزن الخيوط الداخلي لـ Codex أو
آلية Compaction الأصلية فيه.

## الفجوة الحالية

تستدعي محاولات PI المضمنة دورة حياة محرك السياق مباشرة:

- bootstrap/الصيانة قبل المحاولة
- assemble قبل استدعاء النموذج
- `afterTurn` أو `ingest` بعد المحاولة
- الصيانة بعد دور ناجح
- Compaction خاصة بمحرك السياق للمحركات التي تملك Compaction

كود PI ذي الصلة:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

أما محاولات Codex app-server فتشغّل حاليًا الخطافات العامة لـ agent-harness وتُجري
نسخًا مطابقًا لـ transcript، لكنها لا تستدعي
`params.contextEngine.bootstrap` أو `params.contextEngine.assemble` أو
`params.contextEngine.afterTurn` أو `params.contextEngine.ingestBatch` أو
`params.contextEngine.ingest` أو `params.contextEngine.maintain`.

كود Codex ذي الصلة:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## السلوك المطلوب

بالنسبة إلى أدوار Codex harness، يجب أن يحافظ OpenClaw على دورة الحياة التالية:

1. قراءة transcript الجلسة المنسوخ في OpenClaw.
2. تنفيذ bootstrap لمحرك السياق النشط عندما يكون ملف الجلسة السابق موجودًا.
3. تشغيل صيانة bootstrap عند توفرها.
4. تجميع السياق باستخدام محرك السياق النشط.
5. تحويل السياق المجمّع إلى مدخلات متوافقة مع Codex.
6. بدء أو استئناف خيط Codex بتعليمات مطور تتضمن أي
   `systemPromptAddition` من محرك السياق.
7. بدء دور Codex باستخدام prompt المجمّع المواجه للمستخدم.
8. عكس نتيجة Codex مرة أخرى إلى transcript في OpenClaw.
9. استدعاء `afterTurn` إذا كان منفذًا، وإلا استخدام `ingestBatch`/`ingest` باستخدام لقطة transcript المنسوخة.
10. تشغيل صيانة الدور بعد الأدوار الناجحة غير المجهضة.
11. الحفاظ على إشارات Compaction الأصلية لـ Codex وخطافات Compaction في OpenClaw.

## قيود التصميم

### يبقى Codex app-server المرجع المعتمد لحالة الخيط الأصلية

يمتلك Codex خيطه الأصلي وأي سجل موسع داخلي. يجب ألا يحاول OpenClaw
تعديل السجل الداخلي لـ app-server إلا من خلال استدعاءات البروتوكول المدعومة.

يبقى transcript المنسوخ في OpenClaw هو المصدر لميزات OpenClaw:

- سجل الدردشة
- البحث
- أعمال `/new` و`/reset`
- التبديل المستقبلي للنموذج أو harness
- حالة Plugin محرك السياق

### يجب إسقاط تجميع محرك السياق إلى مدخلات Codex

تعيد واجهة محرك السياق `AgentMessage[]` الخاصة بـ OpenClaw، وليس تصحيحًا لخيط Codex. يقبل `turn/start` في Codex app-server
مدخل مستخدم حاليًا، بينما يقبل `thread/start` و`thread/resume`
تعليمات مطور.

ولذلك يحتاج التنفيذ إلى طبقة إسقاط. يجب أن تتجنب النسخة الآمنة الأولى
الادعاء بأنها تستطيع استبدال السجل الداخلي لـ Codex. بل يجب أن تحقن
السياق المجمّع بوصفه مادة prompt/تعليمات مطور حتمية حول
الدور الحالي.

### استقرار Prompt cache مهم

بالنسبة إلى محركات مثل lossless-claw، يجب أن يكون السياق المجمّع حتميًا
عند عدم تغير المدخلات. لا تضف طوابع زمنية أو معرفات عشوائية أو
ترتيبًا غير حتمي إلى نص السياق المولّد.

### لا تتغير دلالات التراجع في PI

يبقى اختيار harness كما هو:

- `runtime: "pi"` يفرض PI
- `runtime: "codex"` يختار Codex harness المسجل
- `runtime: "auto"` يتيح لـ plugin harnesses المطالبة بالموفّرين المدعومين
- `fallback: "none"` يعطّل التراجع إلى PI عندما لا يتطابق أي plugin harness

يغيّر هذا العمل ما يحدث بعد اختيار Codex harness.

## خطة التنفيذ

### 1. تصدير أو نقل مساعدات محاولات محرك السياق القابلة لإعادة الاستخدام

اليوم تعيش مساعدات دورة الحياة القابلة لإعادة الاستخدام تحت PI runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

لا ينبغي لـ Codex أن يستورد من مسار تنفيذ يوحي اسمه بـ PI إذا
استطعنا تجنب ذلك.

أنشئ وحدة محايدة بالنسبة إلى harness، مثلًا:

- `src/agents/harness/context-engine-lifecycle.ts`

انقل أو أعد تصدير:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- غلافًا صغيرًا حول `runContextEngineMaintenance`

أبقِ واردات PI تعمل إما بإعادة التصدير من الملفات القديمة أو بتحديث مواقع استدعاء PI
في PR نفسه.

يجب ألا تذكر أسماء المساعدات المحايدة PI.

الأسماء المقترحة:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. إضافة مساعد إسقاط سياق لـ Codex

أضف وحدة جديدة:

- `extensions/codex/src/app-server/context-engine-projection.ts`

المسؤوليات:

- قبول `AgentMessage[]` المجمّعة، والسجل الأصلي المنسوخ، وprompt الحالي.
- تحديد أي سياق ينتمي إلى تعليمات المطور مقابل مدخل المستخدم الحالي.
- الحفاظ على prompt المستخدم الحالي بوصفه الطلب التنفيذي النهائي.
- عرض الرسائل السابقة بصيغة مستقرة وصريحة.
- تجنب البيانات الوصفية المتقلبة.

واجهة API المقترحة:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

الإسقاط الأول الموصى به:

- ضع `systemPromptAddition` في تعليمات المطور.
- ضع سياق transcript المجمّع قبل prompt الحالي في `promptText`.
- سمّه بوضوح على أنه سياق مجمّع من OpenClaw.
- أبقِ prompt الحالي في النهاية.
- استبعد prompt المستخدم الحالي المكرر إذا كان يظهر بالفعل في الذيل.

شكل prompt المثال:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

هذا أقل أناقة من جراحة سجل Codex الأصلية، لكنه قابل للتنفيذ
داخل OpenClaw ويحافظ على دلالات محرك السياق.

تحسين مستقبلي: إذا كشف Codex app-server عن بروتوكول لاستبدال
أو دعم سجل الخيط، فاستبدل طبقة الإسقاط هذه لاستخدام تلك الواجهة.

### 3. ربط bootstrap قبل بدء خيط Codex

في `extensions/codex/src/app-server/run-attempt.ts`:

- اقرأ سجل الجلسة المنسوخ كما هو اليوم.
- حدّد ما إذا كان ملف الجلسة موجودًا قبل هذا التشغيل. ويفضل استخدام مساعد
  يتحقق من `fs.stat(params.sessionFile)` قبل عمليات كتابة النسخ المطابق.
- افتح `SessionManager` أو استخدم مهيئًا ضيقًا لـ session manager إذا
  كان المساعد يتطلب ذلك.
- استدعِ المساعد المحايد لـ bootstrap عندما يوجد `params.contextEngine`.

التدفق الشبهّي:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

استخدم اصطلاح `sessionKey` نفسه كما في Codex tool bridge وtranscript
المنسوخ. يحسب Codex اليوم القيمة `sandboxSessionKey` من `params.sessionKey` أو
`params.sessionId`؛ استخدم ذلك باستمرار ما لم يكن هناك سبب للحفاظ على `params.sessionKey` الخام.

### 4. ربط assemble قبل `thread/start` / `thread/resume` و`turn/start`

في `runCodexAppServerAttempt`:

1. ابنِ الأدوات الديناميكية أولًا، حتى يرى محرك السياق أسماء الأدوات
   المتاحة الفعلية.
2. اقرأ سجل الجلسة المنسوخ.
3. شغّل `assemble(...)` لمحرك السياق عندما يوجد `params.contextEngine`.
4. أسقط النتيجة المجمّعة إلى:
   - إضافة تعليمات مطور
   - نص prompt لـ `turn/start`

يجب أن يصبح استدعاء الخطاف الحالي:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

مدركًا للسياق:

1. احسب تعليمات المطور الأساسية باستخدام `buildDeveloperInstructions(params)`
2. طبّق تجميع/إسقاط محرك السياق
3. شغّل `before_prompt_build` مع prompt/تعليمات المطور بعد الإسقاط

يتيح هذا الترتيب لخطافات prompt العامة رؤية prompt نفسه الذي سيتلقاه Codex. وإذا
احتجنا إلى تطابق صارم مع PI، فشغّل تجميع محرك السياق قبل تركيب الخطافات،
لأن PI يطبّق `systemPromptAddition` الخاصة بمحرك السياق على system prompt
النهائي بعد مسار prompt الخاص به. والثابت المهم هو أن يحصل كل من
محرك السياق والخطافات على ترتيب حتمي وموثق.

الترتيب الموصى به للتنفيذ الأول:

1. `buildDeveloperInstructions(params)`
2. `assemble()` لمحرك السياق
3. إلحاق/إضافة `systemPromptAddition` قبل/بعد تعليمات المطور
4. إسقاط الرسائل المجمّعة إلى نص prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. تمرير تعليمات المطور النهائية إلى `startOrResumeThread(...)`
7. تمرير نص prompt النهائي إلى `buildTurnStartParams(...)`

يجب ترميز المواصفة في الاختبارات حتى لا تعيد التغييرات المستقبلية
ترتيبها عن طريق الخطأ.

### 5. الحفاظ على تنسيق مستقر لـ Prompt cache

يجب أن ينتج مساعد الإسقاط خرجًا ثابت البايتات عند المدخلات المتطابقة:

- ترتيب رسائل مستقر
- تسميات أدوار مستقرة
- لا طوابع زمنية مولّدة
- لا تسرب لترتيب مفاتيح الكائنات
- لا فواصل عشوائية
- لا معرفات لكل تشغيل

استخدم فواصل ثابتة وأقسامًا صريحة.

### 6. ربط ما بعد الدور بعد النسخ المطابق لـ transcript

يبني `CodexAppServerEventProjector` في Codex القيمة `messagesSnapshot` المحلية لـ
الدور الحالي. وتكتب `mirrorTranscriptBestEffort(...)` هذه اللقطة في النسخة المطابقة من transcript في OpenClaw.

بعد نجاح النسخ المطابق أو فشله، استدعِ المُنهِي الخاص بمحرك السياق باستخدام
أفضل لقطة رسائل متاحة:

- فَضِّل سياق الجلسة الكامل المنسوخ بعد الكتابة، لأن `afterTurn`
  يتوقع لقطة الجلسة، وليس الدور الحالي فقط.
- ارجع إلى `historyMessages + result.messagesSnapshot` إذا تعذر إعادة فتح ملف الجلسة.

التدفق الشبهّي:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

إذا فشل النسخ المطابق، فاستدعِ `afterTurn` مع ذلك باستخدام اللقطة الاحتياطية، لكن
سجّل أن محرك السياق يستوعب من بيانات الدور الاحتياطية.

### 7. توحيد سياق وقت التشغيل للاستخدام وPrompt cache

تتضمن نتائج Codex استخدامًا موحّدًا من إشعارات الرموز الخاصة بـ app-server عند
توفرها. مرّر هذا الاستخدام إلى سياق وقت تشغيل محرك السياق.

إذا كشف Codex app-server في النهاية عن تفاصيل قراءة/كتابة cache، فقم بتعيينها إلى
`ContextEnginePromptCacheInfo`. وحتى ذلك الحين، احذف `promptCache` بدلًا من
اختراع قيم صفرية.

### 8. سياسة Compaction

يوجد نظامان لـ Compaction:

1. `compact()` الخاصة بمحرك السياق في OpenClaw
2. `thread/compact/start` الأصلي في Codex app-server

لا تدمجهما ضمنيًا بصمت.

#### `/compact` وCompaction الصريحة في OpenClaw

عندما يكون لدى محرك السياق المحدد القيمة `info.ownsCompaction === true`، يجب أن
تفضّل Compaction الصريحة في OpenClaw نتيجة `compact()` الخاصة بمحرك السياق من أجل
النسخة المطابقة من transcript في OpenClaw وحالة Plugin.

وعندما يكون لدى Codex harness المحدد ربط خيط أصلي، يجوز لنا بالإضافة إلى ذلك
طلب Compaction الأصلية في Codex للحفاظ على صحة خيط app-server، لكن يجب
الإبلاغ عن ذلك بوصفه إجراء backend منفصلًا ضمن التفاصيل.

السلوك الموصى به:

- إذا كانت `contextEngine.info.ownsCompaction === true`:
  - استدعِ `compact()` الخاصة بمحرك السياق أولًا
  - ثم استدعِ Compaction الأصلية في Codex بأفضل جهد عندما يوجد ربط خيط
  - أعد نتيجة محرك السياق بوصفها النتيجة الأساسية
  - ضمّن حالة Compaction الأصلية في Codex في `details.codexNativeCompaction`
- إذا كان محرك السياق النشط لا يملك Compaction:
  - فاحتفظ بسلوك Compaction الأصلي الحالي في Codex

من المرجح أن يتطلب هذا تغيير `extensions/codex/src/app-server/compact.ts` أو
تغليفه من مسار Compaction العام، بحسب الموضع الذي
يُستدعى فيه `maybeCompactAgentHarnessSession(...)`.

#### أحداث `contextCompaction` الأصلية أثناء الدور في Codex

قد يصدر Codex أحداث عنصر `contextCompaction` أثناء الدور. أبقِ
إصدار خطافات Compaction قبل/بعد الحالية في `event-projector.ts`، لكن لا تعامل
ذلك على أنه Compaction مكتملة لمحرك السياق.

بالنسبة إلى المحركات التي تملك Compaction، أصدِر تشخيصًا صريحًا عندما ينفذ Codex
Compaction الأصلية على أي حال:

- اسم stream/event: stream الحالية `compaction` مقبولة
- التفاصيل: `{ backend: "codex-app-server", ownsCompaction: true }`

وهذا يجعل الانقسام قابلًا للتدقيق.

### 9. سلوك إعادة ضبط الجلسة والربط

يقوم `reset(...)` الحالي في Codex harness بمسح ربط Codex app-server من
ملف جلسة OpenClaw. حافظ على هذا السلوك.

وتأكد أيضًا من أن تنظيف حالة محرك السياق يستمر عبر مسارات دورة حياة الجلسة
الحالية في OpenClaw. لا تضف تنظيفًا خاصًا بـ Codex إلا إذا كانت دورة حياة
محرك السياق تفوّت حاليًا أحداث reset/delete لجميع harnesses.

### 10. معالجة الأخطاء

اتبع دلالات PI:

- إخفاقات bootstrap تُصدر تحذيرًا وتستمر
- إخفاقات assemble تُصدر تحذيرًا وتعود إلى رسائل/Prompt المسار غير المجمّع
- إخفاقات `afterTurn`/`ingest` تُصدر تحذيرًا وتضع علامة على أن إنهاء ما بعد الدور غير ناجح
- لا تعمل الصيانة إلا بعد أدوار ناجحة وغير مجهضة وغير yield
- يجب ألا يُعاد تجربة أخطاء Compaction على أنها Prompts جديدة

إضافات خاصة بـ Codex:

- إذا فشل إسقاط السياق، فأصدر تحذيرًا وارجع إلى Prompt الأصلي.
- إذا فشل النسخ المطابق لـ transcript، فحاول مع ذلك إنهاء محرك السياق باستخدام
  الرسائل الاحتياطية.
- إذا فشلت Compaction الأصلية في Codex بعد نجاح Compaction الخاصة بمحرك السياق،
  فلا تفشل Compaction الكاملة في OpenClaw عندما يكون محرك السياق هو الأساسي.

## خطة الاختبار

### اختبارات الوحدات

أضف اختبارات تحت `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - يستدعي Codex `bootstrap` عندما يكون ملف الجلسة موجودًا.
   - يستدعي Codex `assemble` مع الرسائل المنسوخة، وميزانية الرموز،
     وأسماء الأدوات، ووضع citations، ومعرّف النموذج، وprompt.
   - يتم تضمين `systemPromptAddition` في تعليمات المطور.
   - تُسقط الرسائل المجمّعة داخل Prompt قبل الطلب الحالي.
   - يستدعي Codex `afterTurn` بعد النسخ المطابق لـ transcript.
   - من دون `afterTurn`، يستدعي Codex `ingestBatch` أو `ingest` لكل رسالة.
   - تعمل صيانة الدور بعد الأدوار الناجحة.
   - لا تعمل صيانة الدور عند خطأ prompt أو الإجهاض أو yield abort.

2. `context-engine-projection.test.ts`
   - خرج مستقر للمدخلات المتطابقة
   - لا تكرار لـ prompt الحالي عندما يتضمن السجل المجمّع ذلك
   - يتعامل مع سجل فارغ
   - يحافظ على ترتيب الأدوار
   - يتضمن إضافة system prompt في تعليمات المطور فقط

3. `compact.context-engine.test.ts`
   - تفوز النتيجة الأساسية لمحرك السياق المالك
   - تظهر حالة Compaction الأصلية في Codex داخل التفاصيل عند تجربتها أيضًا
   - لا يؤدي فشل Codex الأصلي إلى فشل Compaction الخاصة بمحرك السياق المالك
   - يحتفظ محرك السياق غير المالك بسلوك Compaction الأصلي الحالي

### الاختبارات الحالية المطلوب تحديثها

- `extensions/codex/src/app-server/run-attempt.test.ts` إذا كانت موجودة، وإلا
  فأقرب اختبارات تشغيل لـ Codex app-server.
- `extensions/codex/src/app-server/event-projector.test.ts` فقط إذا تغيرت تفاصيل
  أحداث Compaction.
- لا ينبغي أن تحتاج `src/agents/harness/selection.test.ts` إلى تغييرات ما لم يتغير
  سلوك الإعداد؛ ويجب أن تبقى مستقرة.
- يجب أن تستمر اختبارات محرك السياق في PI بالنجاح من دون تغيير.

### اختبارات التكامل / الاختبارات الحية

أضف أو وسّع اختبارات smoke الحية لـ Codex harness:

- هيّئ `plugins.slots.contextEngine` إلى محرك اختبار
- هيّئ `agents.defaults.model` إلى نموذج `codex/*`
- هيّئ `agents.defaults.embeddedHarness.runtime = "codex"`
- أثبت أن محرك الاختبار لاحظ:
  - bootstrap
  - assemble
  - afterTurn أو ingest
  - maintenance

تجنب طلب lossless-claw في اختبارات OpenClaw الأساسية. استخدم
Plugin صغيرًا مزيفًا لمحرك السياق داخل المستودع.

## قابلية الملاحظة

أضف سجلات debug حول استدعاءات دورة حياة محرك السياق في Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` مع السبب
- `codex native compaction completed alongside context-engine compaction`

تجنب تسجيل Prompts كاملة أو محتويات transcript.

أضف حقولًا منظمة عند الفائدة:

- `sessionId`
- `sessionKey` منقّح أو محذوف وفق ممارسة التسجيل الحالية
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## الترحيل / التوافق

يجب أن يكون هذا متوافقًا مع الإصدارات السابقة:

- إذا لم يتم تكوين محرك سياق، فيجب أن يكون سلوك محرك السياق القديم
  مكافئًا لسلوك Codex harness الحالي.
- إذا فشل `assemble` الخاص بمحرك السياق، فيجب أن يتابع Codex باستخدام
  مسار Prompt الأصلي.
- يجب أن تبقى روابط خيوط Codex الحالية صالحة.
- يجب ألا تتضمن بصمة الأداة الديناميكية خرج محرك السياق؛ وإلا فقد
  يفرض كل تغير في السياق خيط Codex جديدًا. يجب أن يؤثر كتالوج الأدوات فقط
  في البصمة الديناميكية للأدوات.

## أسئلة مفتوحة

1. هل يجب حقن السياق المجمّع بالكامل في Prompt المستخدم، أم بالكامل
   في تعليمات المطور، أم تقسيمه؟

   التوصية: تقسيمه. ضع `systemPromptAddition` في تعليمات المطور؛
   وضع سياق transcript المجمّع في غلاف Prompt المستخدم. وهذا يطابق على أفضل وجه
   بروتوكول Codex الحالي من دون تعديل سجل الخيط الأصلي.

2. هل يجب تعطيل Compaction الأصلية في Codex عندما يملك محرك السياق
   Compaction؟

   التوصية: لا، ليس في البداية. فقد تبقى Compaction الأصلية في Codex
   ضرورية للحفاظ على خيط app-server حيًا. لكن يجب الإبلاغ عنها بوصفها
   Compaction أصلية من Codex، لا بوصفها Compaction لمحرك السياق.

3. هل يجب تشغيل `before_prompt_build` قبل أو بعد تجميع محرك السياق؟

   التوصية: بعد إسقاط محرك السياق في Codex، حتى ترى خطافات harness العامة
   Prompt/تعليمات المطور الفعلية التي سيتلقاها Codex. وإذا تطلبت مساواة PI
   العكس، فقم بترميز الترتيب المختار في الاختبارات ووثّقه
   هنا.

4. هل يمكن لـ Codex app-server قبول تجاوز سياق/سجل منظم في المستقبل؟

   غير معروف. وإذا كان ذلك ممكنًا، فاستبدل طبقة الإسقاط النصية بتلك الواجهة
   مع إبقاء استدعاءات دورة الحياة من دون تغيير.

## معايير القبول

- يستدعي دور `codex/*` في embedded harness دورة حياة `assemble`
  الخاصة بمحرك السياق المحدد.
- تؤثر `systemPromptAddition` الخاصة بمحرك السياق في تعليمات المطور في Codex.
- يؤثر السياق المجمّع في مدخل دور Codex بشكل حتمي.
- تستدعي أدوار Codex الناجحة `afterTurn` أو التراجع إلى ingest.
- تشغّل أدوار Codex الناجحة صيانة دور محرك السياق.
- لا تشغّل الأدوار الفاشلة/المجهضة/yield-aborted صيانة الدور.
- تبقى Compaction المملوكة لمحرك السياق هي الأساسية لحالة OpenClaw/Plugin.
- تبقى Compaction الأصلية في Codex قابلة للتدقيق بوصفها سلوكًا أصليًا لـ Codex.
- يبقى سلوك محرك السياق الحالي في PI من دون تغيير.
- يبقى سلوك Codex harness الحالي من دون تغيير عندما لا يتم تحديد محرك سياق غير قديم
  أو عندما تفشل assemble.
