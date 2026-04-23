---
read_when:
    - تصحيح أحداث إكمال node exec المتكررة
    - العمل على إزالة التكرار في Heartbeat/حدث النظام
summary: ملاحظات التحقيق بشأن الحقن المكرر لإكمال exec غير المتزامن
title: التحقيق في التكرار المزدوج لإكمال Exec غير المتزامن
x-i18n:
    generated_at: "2026-04-23T07:32:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# التحقيق في التكرار المزدوج لإكمال Exec غير المتزامن

## النطاق

- الجلسة: `agent:main:telegram:group:-1003774691294:topic:1`
- العرَض: تم تسجيل إكمال exec غير المتزامن نفسه للجلسة/التشغيل `keen-nexus` مرتين في LCM كأدوار مستخدم.
- الهدف: تحديد ما إذا كان هذا على الأرجح حقنًا مكررًا في الجلسة أم مجرد إعادة محاولة عادية للتسليم الصادر.

## الخلاصة

الأرجح أن هذا هو **حقن مكرر في الجلسة**، وليس مجرد إعادة محاولة خالصة للتسليم الصادر.

أقوى فجوة على جانب gateway تقع في **مسار إكمال exec الخاص بـ node**:

1. يؤدي انتهاء exec على جانب node إلى إصدار `exec.finished` مع `runId` الكامل.
2. يقوم `server-node-events` في Gateway بتحويل ذلك إلى حدث نظام ويطلب Heartbeat.
3. يقوم تشغيل Heartbeat بحقن كتلة حدث النظام المصروفة في prompt الخاصة بالوكيل.
4. يقوم runner المدمج بحفظ تلك prompt كدور مستخدم جديد في transcript الخاصة بالجلسة.

إذا وصلت `exec.finished` نفسها إلى gateway مرتين لنفس `runId` لأي سبب (إعادة تشغيل، أو تكرار عند إعادة الاتصال، أو إعادة إرسال من جهة upstream، أو منتج مكرر)، فلا يملك OpenClaw حاليًا **أي فحص idempotency مفهرس بـ `runId`/`contextKey`** على هذا المسار. وستتحول النسخة الثانية إلى رسالة مستخدم ثانية بالمحتوى نفسه.

## المسار الدقيق في الشيفرة

### 1. المنتج: حدث إكمال exec في node

- `src/node-host/invoke.ts:340-360`
  - تقوم `sendExecFinishedEvent(...)` بإصدار `node.event` مع الحدث `exec.finished`.
  - تتضمن الحمولة `sessionKey` و`runId` الكامل.

### 2. استيعاب الأحداث في Gateway

- `src/gateway/server-node-events.ts:574-640`
  - يتعامل مع `exec.finished`.
  - يبني النص:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - ويضعه في الصف عبر:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - ثم يطلب الإيقاظ فورًا:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. ضعف إزالة التكرار في حدث النظام

- `src/infra/system-events.ts:90-115`
  - تقوم `enqueueSystemEvent(...)` فقط بمنع **النص المكرر المتتالي**:
    - `if (entry.lastText === cleaned) return false`
  - وهي تخزّن `contextKey`، لكنها **لا** تستخدم `contextKey` من أجل idempotency.
  - وبعد الصرف، تتم إعادة ضبط منع التكرار.

وهذا يعني أن إعادة تشغيل `exec.finished` بالقيمة نفسها `runId` يمكن قبولها مرة أخرى لاحقًا، رغم أن الشيفرة كانت تملك أصلًا مرشح idempotency ثابتًا (`exec:<runId>`).

### 4. التعامل مع الإيقاظ ليس هو المكرر الأساسي

- `src/infra/heartbeat-wake.ts:79-117`
  - يتم دمج عمليات الإيقاظ حسب `(agentId, sessionKey)`.
  - تنهار طلبات الإيقاظ المكررة للهدف نفسه إلى إدخال إيقاظ معلّق واحد.

وهذا يجعل **التعامل مع الإيقاظ المكرر وحده** تفسيرًا أضعف من استيعاب الحدث المكرر.

### 5. يستهلك Heartbeat الحدث ويحوّله إلى إدخال prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - يجري فحصًا مسبقًا للأحداث النظامية المعلّقة ويصنّف تشغيلات exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - تقوم `drainFormattedSystemEvents(...)` بصرف الصف الخاص بالجلسة.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - تُسبق كتلة حدث النظام المصروفة في متن prompt الخاصة بالوكيل.

### 6. نقطة الحقن في transcript

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - تقوم `activeSession.prompt(effectivePrompt)` بإرسال prompt الكاملة إلى جلسة PI المدمجة.
  - وهذه هي النقطة التي تتحول فيها prompt المشتقة من الإكمال إلى دور مستخدم محفوظ.

لذلك، بمجرد إعادة بناء حدث النظام نفسه في prompt مرتين، يصبح توقّع رسائل مستخدم مكررة في LCM أمرًا طبيعيًا.

## لماذا تكون إعادة محاولة التسليم الصادر الخالصة أقل ترجيحًا

يوجد بالفعل مسار إخفاق صادر حقيقي في Heartbeat runner:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - يتم توليد الرد أولًا.
  - ثم يحدث التسليم الصادر لاحقًا عبر `deliverOutboundPayloads(...)`.
  - ويعيد الإخفاق هناك القيمة `{ status: "failed" }`.

ومع ذلك، وبالنسبة إلى إدخال صف حدث النظام نفسه، فإن هذا وحده **غير كافٍ** لتفسير أدوار المستخدم المكررة:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - يتم بالفعل صرف صف أحداث النظام قبل التسليم الصادر.

لذلك فإن إعادة محاولة إرسال القناة وحدها لن تعيد إنشاء الحدث نفسه المصطف في الصف. وقد تفسر تسليمًا خارجيًا مفقودًا/فاشلًا، لكنها لا تفسر بمفردها رسالة مستخدم متطابقة ثانية في الجلسة.

## احتمال ثانوي أقل ثقة

توجد حلقة إعادة محاولة للتشغيل الكامل في runner الخاص بالوكيل:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - يمكن لبعض الإخفاقات العابرة أن تعيد محاولة التشغيل بالكامل وتعيد إرسال `commandBody` نفسه.

وقد يكرر ذلك prompt مستخدم محفوظة **ضمن تنفيذ الرد نفسه** إذا كانت prompt قد أُلحقت بالفعل قبل تحقق شرط إعادة المحاولة.

وأصنّف هذا الاحتمال أدنى من تكرار استيعاب `exec.finished` لأن:

- الفجوة المرصودة كانت نحو 51 ثانية، وهذا يبدو أكثر كأنه إيقاظ/دور ثانٍ لا إعادة محاولة داخل العملية؛
- كما أن التقرير يذكر أصلًا إخفاقات متكررة في إرسال الرسائل، ما يشير أكثر إلى دور منفصل لاحق بدل إعادة محاولة فورية للنموذج/وقت التشغيل.

## فرضية السبب الجذري

الفرضية الأعلى ثقة:

- جاء إكمال `keen-nexus` عبر **مسار حدث exec في node**.
- تم تسليم `exec.finished` نفسها إلى `server-node-events` مرتين.
- قبل Gateway كلا النسختين لأن `enqueueSystemEvent(...)` لا يزيل التكرار حسب `contextKey` / `runId`.
- أدى كل حدث مقبول إلى تشغيل Heartbeat وحُقن كدور مستخدم في transcript الخاصة بـ PI.

## إصلاح جراحي صغير مقترح

إذا كان المطلوب إصلاحًا، فإن أصغر تغيير ذي قيمة عالية هو:

- جعل idempotency الخاصة بـ exec/system-event تحترم `contextKey` ضمن أفق قصير، على الأقل لعمليات التكرار الدقيقة `(sessionKey, contextKey, text)`؛
- أو إضافة إزالة تكرار مخصصة في `server-node-events` لـ `exec.finished` مفهرسة بـ `(sessionKey, runId, event kind)`.

سيمنع ذلك مباشرةً التكرارات المعاد تشغيلها من `exec.finished` قبل أن تتحول إلى أدوار جلسة.
