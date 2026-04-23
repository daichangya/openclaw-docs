---
read_when:
    - إعادة هيكلة تعريفات سيناريوهات QA أو شيفرة Harness الخاصة بـ qa-lab
    - نقل سلوك QA بين سيناريوهات Markdown ومنطق Harness المكتوب بـ TypeScript
summary: خطة إعادة هيكلة QA لفهرس السيناريوهات ودمج Harness
title: إعادة هيكلة QA
x-i18n:
    generated_at: "2026-04-23T07:32:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# إعادة هيكلة QA

الحالة: تم اعتماد ترحيل تأسيسي.

## الهدف

نقل QA في OpenClaw من نموذج تعريف منقسم إلى مصدر حقيقة واحد:

- البيانات الوصفية للسيناريو
- Prompts المرسلة إلى النموذج
- الإعداد والتنظيف
- منطق Harness
- التأكيدات ومعايير النجاح
- العناصر الناتجة وتلميحات التقارير

الحالة النهائية المطلوبة هي Harness عام لـ QA يحمّل ملفات تعريف سيناريوهات قوية بدلًا من ترميز معظم السلوك بشكل صلب في TypeScript.

## الحالة الحالية

يوجد مصدر الحقيقة الأساسي الآن في `qa/scenarios/index.md` بالإضافة إلى ملف واحد لكل
سيناريو تحت `qa/scenarios/<theme>/*.md`.

تم تنفيذ ما يلي:

- `qa/scenarios/index.md`
  - البيانات الوصفية المرجعية لحزمة QA
  - هوية المشغّل
  - مهمة الانطلاق
- `qa/scenarios/<theme>/*.md`
  - ملف Markdown واحد لكل سيناريو
  - البيانات الوصفية للسيناريو
  - ارتباطات المعالجات
  - إعدادات التنفيذ الخاصة بالسيناريو
- `extensions/qa-lab/src/scenario-catalog.ts`
  - محلل حزم Markdown + تحقق zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - عرض الخطة من حزمة Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - يزرع ملفات التوافق المولدة بالإضافة إلى `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - يختار السيناريوهات القابلة للتنفيذ من خلال ارتباطات المعالجات المعرّفة في Markdown
- بروتوكول QA bus + واجهة المستخدم
  - مرفقات مضمنة عامة لعرض الصور/الفيديو/الصوت/الملفات

الأسطح المنقسمة المتبقية:

- `extensions/qa-lab/src/suite.ts`
  - لا يزال يملك معظم منطق المعالجات المخصصة القابلة للتنفيذ
- `extensions/qa-lab/src/report.ts`
  - لا يزال يشتق بنية التقرير من مخرجات وقت التشغيل

إذًا تم إصلاح انقسام مصدر الحقيقة، لكن التنفيذ لا يزال يعتمد غالبًا على المعالجات بدلًا من أن يكون تصريحيًا بالكامل.

## كيف يبدو سطح السيناريو الحقيقي

تُظهر قراءة suite الحالية بضع فئات مميزة من السيناريوهات.

### تفاعل بسيط

- خط أساس القناة
- خط أساس الرسائل الخاصة
- متابعة ضمن سلسلة
- تبديل النموذج
- متابعة الموافقة
- تفاعل/تعديل/حذف

### تعديل الإعدادات ووقت التشغيل

- تعطيل Skill عبر config patch
- config apply مع إيقاظ بعد إعادة التشغيل
- قلب قدرة إعادة تشغيل الإعدادات
- فحص انجراف inventory في وقت التشغيل

### تأكيدات نظام الملفات والمستودع

- تقرير اكتشاف source/docs
- بناء Lobster Invaders
- البحث عن العنصر الناتج للصورة المولدة

### تنسيق الذاكرة

- استرجاع الذاكرة
- أدوات الذاكرة في سياق القناة
- احتياط فشل الذاكرة
- ترتيب ذاكرة الجلسة
- عزل ذاكرة السلسلة
- memory dreaming sweep

### تكامل الأدوات وPlugin

- استدعاء أدوات MCP Plugin
- إظهار Skill
- تثبيت Skill سريع
- توليد صور أصلي
- دورة كاملة للصورة
- فهم الصورة من المرفق

### أدوار متعددة وجهات فاعلة متعددة

- تمرير Subagent
- fanout synthesis لـ Subagent
- تدفقات بأسلوب التعافي بعد إعادة التشغيل

هذه الفئات مهمة لأنها تقود متطلبات DSL. فالقائمة المسطحة من prompt + نص متوقع ليست كافية.

## الاتجاه

### مصدر حقيقة واحد

استخدم `qa/scenarios/index.md` بالإضافة إلى `qa/scenarios/<theme>/*.md` كمصدر
الحقيقة المؤلف.

يجب أن تبقى الحزمة:

- قابلة للقراءة البشرية في المراجعة
- قابلة للتحليل آليًا
- غنية بما يكفي لتشغيل:
  - تنفيذ suite
  - تهيئة مساحة عمل QA
  - البيانات الوصفية لفهرس QA Lab UI
  - Prompts التوثيق/الاكتشاف
  - توليد التقارير

### تنسيق التأليف المفضل

استخدم Markdown كتنسيق علوي، مع YAML مهيكل داخله.

الشكل الموصى به:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - تجاوزات النموذج/المزوّد
  - المتطلبات المسبقة
- أقسام نثرية
  - objective
  - notes
  - debugging hints
- كتل YAML مسيجة
  - setup
  - steps
  - assertions
  - cleanup

يوفر هذا:

- قابلية قراءة أفضل في PR من JSON الضخم
- سياقًا أغنى من YAML الخالص
- تحليلًا صارمًا وتحققًا عبر zod

يُقبل JSON الخام فقط بوصفه شكلًا وسيطًا مولدًا.

## الشكل المقترح لملف السيناريو

مثال:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## قدرات المشغّل التي يجب أن تغطيها DSL

استنادًا إلى suite الحالية، يحتاج المشغّل العام إلى أكثر من مجرد تنفيذ prompt.

### إجراءات البيئة والإعداد

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### إجراءات دور الوكيل

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### إجراءات الإعدادات ووقت التشغيل

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### إجراءات الملفات والعناصر الناتجة

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### إجراءات الذاكرة وCron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### إجراءات MCP

- `mcp.callTool`

### التأكيدات

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## المتغيرات ومراجع العناصر الناتجة

يجب أن تدعم DSL حفظ المخرجات واستخدامها لاحقًا كمراجع.

أمثلة من suite الحالية:

- إنشاء سلسلة ثم إعادة استخدام `threadId`
- إنشاء جلسة ثم إعادة استخدام `sessionKey`
- توليد صورة ثم إرفاق الملف في الدور التالي
- توليد سلسلة wake marker ثم التأكد من ظهورها لاحقًا

القدرات المطلوبة:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- مراجع مطبوعة للمسارات، ومفاتيح الجلسات، ومعرّفات السلاسل، والعلامات، ومخرجات الأدوات

من دون دعم المتغيرات، سيستمر Harness في تسريب منطق السيناريو مرة أخرى إلى TypeScript.

## ما الذي يجب أن يبقى كمخارج هروب

إن مشغّلًا تصريحيًا خالصًا بالكامل ليس واقعيًا في المرحلة الأولى.

بعض السيناريوهات بطبيعتها كثيفة التنسيق:

- memory dreaming sweep
- config apply مع إيقاظ بعد إعادة التشغيل
- قلب قدرة إعادة تشغيل الإعدادات
- حل العناصر الناتجة للصورة المولدة بحسب الطابع الزمني/المسار
- تقييم تقرير الاكتشاف

يجب أن تستخدم هذه معالجات مخصصة صريحة في الوقت الحالي.

القاعدة الموصى بها:

- 85-90% تصريحي
- خطوات `customHandler` صريحة للباقي الصعب
- معالجات مخصصة مسماة وموثقة فقط
- لا توجد شيفرة مضمنة مجهولة داخل ملف السيناريو

يبقي هذا المحرك العام نظيفًا مع السماح بالتقدم.

## التغيير المعماري

### الحالي

أصبح Markdown الخاص بالسيناريو هو بالفعل مصدر الحقيقة لكل من:

- تنفيذ suite
- ملفات تهيئة مساحة العمل
- فهرس السيناريوهات في QA Lab UI
- البيانات الوصفية للتقارير
- Prompts الاكتشاف

التوافق المولّد:

- لا تزال مساحة العمل المزروعة تتضمن `QA_KICKOFF_TASK.md`
- لا تزال مساحة العمل المزروعة تتضمن `QA_SCENARIO_PLAN.md`
- كما تتضمن مساحة العمل المزروعة الآن أيضًا `QA_SCENARIOS.md`

## خطة إعادة الهيكلة

### المرحلة 1: أداة التحميل والمخطط

تمت.

- أُضيف `qa/scenarios/index.md`
- قُسمت السيناريوهات إلى `qa/scenarios/<theme>/*.md`
- أُضيف محلل لمحتوى حزم YAML المسمّى داخل Markdown
- تم التحقق باستخدام zod
- تم تحويل المستهلكين إلى الحزمة المحللة
- أُزيل `qa/seed-scenarios.json` و`qa/QA_KICKOFF_TASK.md` على مستوى المستودع

### المرحلة 2: المحرك العام

- تقسيم `extensions/qa-lab/src/suite.ts` إلى:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- الإبقاء على الدوال المساعدة الحالية كعمليات للمحرك

الناتج المتوقع:

- ينفذ المحرك سيناريوهات تصريحية بسيطة

ابدأ بالسيناريوهات التي تكون غالبًا prompt + wait + assert:

- متابعة ضمن سلسلة
- فهم الصورة من المرفق
- إظهار Skill واستدعاؤها
- خط أساس القناة

الناتج المتوقع:

- أول سيناريوهات حقيقية معرّفة عبر Markdown تُشحن عبر المحرك العام

### المرحلة 4: ترحيل السيناريوهات المتوسطة

- دورة كاملة لتوليد الصور
- أدوات الذاكرة في سياق القناة
- ترتيب ذاكرة الجلسة
- تمرير Subagent
- subagent fanout synthesis

الناتج المتوقع:

- إثبات المتغيرات، والعناصر الناتجة، وتأكيدات الأدوات، وتأكيدات request-log

### المرحلة 5: إبقاء السيناريوهات الصعبة على المعالجات المخصصة

- memory dreaming sweep
- config apply مع إيقاظ بعد إعادة التشغيل
- قلب قدرة إعادة تشغيل الإعدادات
- runtime inventory drift

الناتج المتوقع:

- تنسيق تأليف مماثل، لكن مع كتل خطوات مخصصة صريحة عند الحاجة

### المرحلة 6: حذف خريطة السيناريوهات المرمّزة صلبًا

بمجرد أن تصبح تغطية الحزمة جيدة بما يكفي:

- إزالة معظم التفرعات الخاصة بالسيناريو من `extensions/qa-lab/src/suite.ts`

## دعم Fake Slack / الوسائط الغنية

الـ QA bus الحالي يركّز على النص أولًا.

الملفات ذات الصلة:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

اليوم يدعم QA bus:

- النص
- التفاعلات
- السلاسل

لكنه لا يمثّل بعد مرفقات الوسائط المضمنة.

### عقد النقل المطلوب

أضف نموذج مرفقات عام لـ QA bus:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

ثم أضف `attachments?: QaBusAttachment[]` إلى:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### لماذا الشكل العام أولًا

لا تبنِ نموذج وسائط خاصًا بـ Slack فقط.

بل استخدم:

- نموذج نقل QA عام واحد
- عدة عارضات فوقه
  - دردشة QA Lab الحالية
  - fake Slack web مستقبلًا
  - أي عروض نقل مزيفة أخرى

يمنع هذا تكرار المنطق ويسمح لسيناريوهات الوسائط بأن تبقى غير مرتبطة بوسيلة نقل محددة.

### الأعمال المطلوبة في UI

حدّث QA UI لعرض:

- معاينة صورة مضمنة
- مشغل صوت مضمن
- مشغل فيديو مضمن
- شارة مرفق ملف

يمكن لواجهة المستخدم الحالية بالفعل عرض السلاسل والتفاعلات، لذلك يجب أن يتراكب عرض المرفقات فوق نموذج بطاقة الرسائل نفسه.

### الأعمال الخاصة بالسيناريو التي يتيحها نقل الوسائط

بمجرد أن تتدفق المرفقات عبر QA bus، يمكننا إضافة سيناريوهات دردشة مزيفة أغنى:

- رد صورة مضمنة في fake Slack
- فهم مرفق صوتي
- فهم مرفق فيديو
- ترتيب مختلط للمرفقات
- رد سلسلة مع الاحتفاظ بالوسائط

## التوصية

يجب أن تكون الدفعة التنفيذية التالية هي:

1. إضافة أداة تحميل سيناريوهات Markdown + مخطط zod
2. توليد الفهرس الحالي من Markdown
3. ترحيل بعض السيناريوهات البسيطة أولًا
4. إضافة دعم مرفقات عام لـ QA bus
5. عرض صورة مضمنة في QA UI
6. ثم التوسع إلى الصوت والفيديو

هذا هو أصغر مسار يثبت كلا الهدفين:

- QA عامة معرّفة عبر Markdown
- أسطح مراسلة مزيفة أغنى

## أسئلة مفتوحة

- ما إذا كانت ملفات السيناريو يجب أن تسمح بقوالب prompt مضمنة بصيغة Markdown مع استيفاء المتغيرات
- ما إذا كان يجب أن يكون setup/cleanup قسمين مسمّيين أم مجرد قوائم إجراءات مرتبة
- ما إذا كان يجب أن تكون مراجع العناصر الناتجة مطبوعة بقوة في المخطط أم معتمدة على السلاسل النصية
- ما إذا كان يجب أن تعيش المعالجات المخصصة في سجل واحد أم في سجلات لكل سطح
- ما إذا كان يجب أن يظل ملف JSON التوافقي المولد محفوظًا في المستودع أثناء الترحيل
