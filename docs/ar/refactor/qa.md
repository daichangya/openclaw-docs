---
x-i18n:
    generated_at: "2026-04-18T07:15:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbb2c70c82da7f6f12d90e25666635ff4147c52e8a94135e902d1de4f5cbccca
    source_path: refactor/qa.md
    workflow: 15
---

# إعادة هيكلة QA

الحالة: تم إنجاز الترحيل التأسيسي.

## الهدف

نقل QA في OpenClaw من نموذج تعريف منقسم إلى مصدر وحيد للحقيقة:

- بيانات وصفية للسيناريو
- المطالبات المرسلة إلى النموذج
- الإعداد والإنهاء
- منطق الحزام
- التأكيدات ومعايير النجاح
- الآثار وتلميحات التقرير

الحالة النهائية المطلوبة هي حزام QA عام يحمّل ملفات تعريف سيناريوهات قوية بدلًا من ترميز معظم السلوك بشكل ثابت في TypeScript.

## الحالة الحالية

المصدر الأساسي للحقيقة موجود الآن في `qa/scenarios/index.md` بالإضافة إلى ملف واحد لكل
سيناريو ضمن `qa/scenarios/<theme>/*.md`.

تم تنفيذ ما يلي:

- `qa/scenarios/index.md`
  - بيانات وصفية قانونية لحزمة QA
  - هوية المشغّل
  - مهمة الانطلاق
- `qa/scenarios/<theme>/*.md`
  - ملف Markdown واحد لكل سيناريو
  - بيانات وصفية للسيناريو
  - ارتباطات المعالِجات
  - ضبط تنفيذ خاص بالسيناريو
- `extensions/qa-lab/src/scenario-catalog.ts`
  - محلل حزمة Markdown + تحقق `zod`
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - تصيير الخطة من حزمة Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - يزرع ملفات توافق مولدة بالإضافة إلى `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - يختار السيناريوهات القابلة للتنفيذ عبر ارتباطات معالِجات معرّفة في Markdown
- بروتوكول ناقل QA + واجهة المستخدم
  - مرفقات مضمنة عامة لعرض الصور/الفيديو/الصوت/الملفات

الأسطح المنقسمة المتبقية:

- `extensions/qa-lab/src/suite.ts`
  - لا يزال يملك معظم منطق المعالِجات المخصصة القابلة للتنفيذ
- `extensions/qa-lab/src/report.ts`
  - لا يزال يشتق بنية التقرير من مخرجات وقت التشغيل

لذا فقد تم إصلاح انقسام مصدر الحقيقة، لكن التنفيذ لا يزال في معظمه مدعومًا بالمعالِجات بدلًا من أن يكون تصريحيًا بالكامل.

## كيف يبدو سطح السيناريو الحقيقي

تُظهر قراءة المجموعة الحالية عدة فئات مميزة من السيناريوهات.

### تفاعل بسيط

- خط أساس القناة
- خط أساس DM
- متابعة ضمن سلسلة
- تبديل النموذج
- متابعة الموافقة
- التفاعل/التحرير/الحذف

### تعديل الإعداد ووقت التشغيل

- تعطيل مهارة تصحيح الإعداد
- تطبيق الإعداد وإعادة التشغيل والاستيقاظ
- قلب قدرة إعادة تشغيل الإعداد
- فحص انجراف مخزون وقت التشغيل

### تأكيدات نظام الملفات والمستودع

- تقرير اكتشاف المصدر/الوثائق
- بناء Lobster Invaders
- البحث عن أثر صورة مولدة

### تنسيق الذاكرة

- استدعاء الذاكرة
- أدوات الذاكرة في سياق القناة
- الرجوع الاحتياطي عند فشل الذاكرة
- ترتيب ذاكرة الجلسة
- عزل ذاكرة السلسلة
- مسح Dreaming للذاكرة

### تكامل الأدوات وPlugin

- استدعاء أدوات MCP Plugin
- رؤية المهارات
- تثبيت المهارة السريع
- توليد الصور الأصلي
- دورة ذهاب وإياب للصورة
- فهم الصورة من المرفق

### متعدد الأدوار ومتعدد المنعطفات

- تسليم وكيل فرعي
- تجميع مخرجات الوكلاء الفرعيين
- تدفقات بأسلوب التعافي بعد إعادة التشغيل

هذه الفئات مهمة لأنها تحدد متطلبات DSL. فالقائمة المسطحة التي تحتوي على مطالبة + نص متوقع لا تكفي.

## الاتجاه

### مصدر وحيد للحقيقة

استخدم `qa/scenarios/index.md` بالإضافة إلى `qa/scenarios/<theme>/*.md` بوصفها
المصدر المؤلف للحقيقة.

ينبغي أن تظل الحزمة:

- قابلة للقراءة البشرية أثناء المراجعة
- قابلة للتحليل آليًا
- غنية بما يكفي لقيادة:
  - تنفيذ المجموعة
  - تمهيد مساحة عمل QA
  - بيانات وصفية لواجهة QA Lab
  - مطالبات الوثائق/الاكتشاف
  - توليد التقارير

### صيغة التأليف المفضلة

استخدم Markdown كصيغة عليا، مع YAML منظَّم داخله.

البنية الموصى بها:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - مراجع الوثائق
  - مراجع الشيفرة
  - تجاوزات النموذج/المزوّد
  - المتطلبات المسبقة
- أقسام نثرية
  - الهدف
  - ملاحظات
  - تلميحات تصحيح
- كتل YAML مسيجة
  - الإعداد
  - الخطوات
  - التأكيدات
  - التنظيف

يوفر هذا:

- قابلية قراءة أفضل في طلبات السحب من JSON الضخم
- سياقًا أغنى من YAML الصرف
- تحليلًا صارمًا وتحقق `zod`

يُقبل JSON الخام فقط بوصفه صيغة وسيطة مولدة.

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

# الهدف

تحقق من إعادة إرفاق الوسائط المولدة في المنعطف التالي.

# الإعداد

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

# الخطوات

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

# المتوقع

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

## قدرات المشغل التي يجب أن تغطيها DSL

استنادًا إلى المجموعة الحالية، يحتاج المشغل العام إلى أكثر من مجرد تنفيذ المطالبات.

### إجراءات البيئة والإعداد

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### إجراءات منعطفات الوكيل

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### إجراءات الإعداد ووقت التشغيل

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### إجراءات الملفات والآثار

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

## المتغيرات ومراجع الآثار

يجب أن تدعم DSL المخرجات المحفوظة والمراجع اللاحقة إليها.

أمثلة من المجموعة الحالية:

- إنشاء سلسلة، ثم إعادة استخدام `threadId`
- إنشاء جلسة، ثم إعادة استخدام `sessionKey`
- توليد صورة، ثم إرفاق الملف في المنعطف التالي
- توليد سلسلة علامة استيقاظ، ثم التأكد من ظهورها لاحقًا

القدرات المطلوبة:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- مراجع مكتوبة للأنواع للمسارات، ومفاتيح الجلسات، ومعرفات السلاسل، والعلامات، ومخرجات الأدوات

من دون دعم المتغيرات، سيظل الحزام يعيد تسريب منطق السيناريو إلى TypeScript.

## ما الذي ينبغي أن يبقى كمنافذ هروب

المشغل التصريحي النقي بالكامل غير واقعي في المرحلة 1.

بعض السيناريوهات بطبيعتها كثيفة التنسيق:

- مسح Dreaming للذاكرة
- تطبيق الإعداد وإعادة التشغيل والاستيقاظ
- قلب قدرة إعادة تشغيل الإعداد
- حل أثر الصورة المولدة حسب الطابع الزمني/المسار
- تقييم تقرير الاكتشاف

ينبغي أن تستخدم هذه السيناريوهات معالِجات مخصصة صريحة في الوقت الحالي.

القاعدة الموصى بها:

- 85-90% تصريحي
- خطوات `customHandler` صريحة للباقي الصعب
- معالِجات مخصصة مسماة وموثقة فقط
- لا شيفرة مضمنة مجهولة داخل ملف السيناريو

هذا يُبقي المحرك العام نظيفًا مع السماح بإحراز تقدم.

## التغيير المعماري

### الحالي

أصبح Markdown الخاص بالسيناريو الآن هو مصدر الحقيقة من أجل:

- تنفيذ المجموعة
- ملفات تمهيد مساحة العمل
- فهرس سيناريوهات واجهة QA Lab
- بيانات التقرير الوصفية
- مطالبات الاكتشاف

التوافق المولد:

- لا تزال مساحة العمل المزروعة تتضمن `QA_KICKOFF_TASK.md`
- لا تزال مساحة العمل المزروعة تتضمن `QA_SCENARIO_PLAN.md`
- كما أصبحت مساحة العمل المزروعة تتضمن أيضًا `QA_SCENARIOS.md`

## خطة إعادة الهيكلة

### المرحلة 1: المُحمِّل والمخطط

تمت.

- تمت إضافة `qa/scenarios/index.md`
- تم تقسيم السيناريوهات إلى `qa/scenarios/<theme>/*.md`
- تمت إضافة محلل لمحتوى حزمة Markdown YAML المسمّى
- تم التحقق باستخدام `zod`
- تم تحويل المستهلكين إلى الحزمة المحللة
- تمت إزالة `qa/seed-scenarios.json` و`qa/QA_KICKOFF_TASK.md` على مستوى المستودع

### المرحلة 2: المحرك العام

- تقسيم `extensions/qa-lab/src/suite.ts` إلى:
  - مُحمِّل
  - محرك
  - سجل إجراءات
  - سجل تأكيدات
  - معالِجات مخصصة
- الإبقاء على دوال المساعدة الحالية كعمليات للمحرك

الناتج المطلوب:

- ينفّذ المحرك سيناريوهات تصريحية بسيطة

ابدأ بالسيناريوهات التي هي غالبًا مطالبة + انتظار + تأكيد:

- متابعة ضمن سلسلة
- فهم الصورة من المرفق
- رؤية المهارة واستدعاؤها
- خط أساس القناة

الناتج المطلوب:

- أول سيناريوهات حقيقية معرّفة في Markdown تُشحن عبر المحرك العام

### المرحلة 4: ترحيل السيناريوهات المتوسطة

- دورة ذهاب وإياب لتوليد الصور
- أدوات الذاكرة في سياق القناة
- ترتيب ذاكرة الجلسة
- تسليم وكيل فرعي
- تجميع مخرجات الوكلاء الفرعيين

الناتج المطلوب:

- إثبات المتغيرات، والآثار، وتأكّدات الأدوات، وتأكّدات سجل الطلبات

### المرحلة 5: إبقاء السيناريوهات الصعبة على المعالِجات المخصصة

- مسح Dreaming للذاكرة
- تطبيق الإعداد وإعادة التشغيل والاستيقاظ
- قلب قدرة إعادة تشغيل الإعداد
- انجراف مخزون وقت التشغيل

الناتج المطلوب:

- نفس صيغة التأليف، ولكن مع كتل خطوات مخصصة صريحة عند الحاجة

### المرحلة 6: حذف خريطة السيناريوهات المرمزة

بمجرد أن تصبح تغطية الحزمة جيدة بما يكفي:

- إزالة معظم التفرعات الخاصة بكل سيناريو في TypeScript من `extensions/qa-lab/src/suite.ts`

## دعم Slack المزيف / الوسائط الغنية

ناقل QA الحالي يركّز على النص أولًا.

الملفات ذات الصلة:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

اليوم يدعم ناقل QA ما يلي:

- النص
- التفاعلات
- السلاسل

لكنه لا يصمّم بعد مرفقات الوسائط المضمنة.

### عقد النقل المطلوب

أضف نموذج مرفقات عام لناقل QA:

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

### لماذا العام أولًا

لا تبنِ نموذج وسائط خاصًا بـ Slack فقط.

بدلًا من ذلك:

- نموذج نقل QA عام واحد
- عدة مُصيّرات فوقه
  - دردشة QA Lab الحالية
  - ويب Slack مزيف مستقبلًا
  - أي عروض نقل مزيفة أخرى

هذا يمنع تكرار المنطق ويجعل سيناريوهات الوسائط مستقلة عن وسيلة النقل.

### أعمال واجهة المستخدم المطلوبة

حدّث واجهة QA لعرض:

- معاينة صورة مضمنة
- مشغل صوت مضمن
- مشغل فيديو مضمن
- شارة مرفق ملف

يمكن للواجهة الحالية بالفعل عرض السلاسل والتفاعلات، لذا ينبغي أن يندمج عرض المرفقات فوق نموذج بطاقة الرسالة نفسه.

### أعمال السيناريو التي يتيحها نقل الوسائط

بمجرد أن تتدفق المرفقات عبر ناقل QA، يمكننا إضافة سيناريوهات دردشة مزيفة أغنى:

- رد صورة مضمنة في Slack مزيف
- فهم مرفق صوتي
- فهم مرفق فيديو
- ترتيب مختلط للمرفقات
- رد ضمن سلسلة مع الاحتفاظ بالوسائط

## التوصية

يجب أن تكون الدفعة التالية من التنفيذ كما يلي:

1. إضافة مُحمِّل سيناريو Markdown + مخطط `zod`
2. توليد الفهرس الحالي من Markdown
3. ترحيل بعض السيناريوهات البسيطة أولًا
4. إضافة دعم مرفقات ناقل QA عام
5. تصيير صورة مضمنة في واجهة QA
6. ثم التوسع إلى الصوت والفيديو

هذا هو أصغر مسار يثبت كلا الهدفين:

- QA عام معرّف في Markdown
- أسطح مراسلة مزيفة أغنى

## أسئلة مفتوحة

- ما إذا كان ينبغي أن تسمح ملفات السيناريو بقوالب مطالبات Markdown مضمنة مع إقحام المتغيرات
- ما إذا كان ينبغي أن يكون الإعداد/التنظيف أقسامًا مسماة أو مجرد قوائم إجراءات مرتبة
- ما إذا كان ينبغي أن تكون مراجع الآثار مكتوبة بقوة في المخطط أو معتمدة على سلاسل نصية
- ما إذا كان ينبغي أن تعيش المعالِجات المخصصة في سجل واحد أو في سجلات لكل سطح
- ما إذا كان ينبغي أن يظل ملف توافق JSON المولَّد محفوظًا في المستودع أثناء الترحيل
