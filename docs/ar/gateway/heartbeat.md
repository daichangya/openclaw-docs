---
read_when:
    - ضبط وتيرة Heartbeat أو رسائله
    - اتخاذ القرار بين Heartbeat وCron للمهام المجدولة
summary: رسائل استطلاع Heartbeat وقواعد الإشعارات
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:47:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat أم Cron؟** راجع [الأتمتة والمهام](/ar/automation) للحصول على إرشادات حول وقت استخدام كل منهما.

يشغّل Heartbeat **دورات وكيل دورية** في الجلسة الرئيسية بحيث يمكن للنموذج
إظهار أي شيء يحتاج إلى انتباه دون إغراقك بالرسائل.

Heartbeat هو دورة مجدولة في الجلسة الرئيسية — وهو **لا** ينشئ سجلات [مهام في الخلفية](/ar/automation/tasks).
فسجلات المهام مخصصة للعمل المنفصل (تشغيلات ACP، والوكلاء الفرعيين، ووظائف Cron المعزولة).

استكشاف الأخطاء وإصلاحها: [المهام المجدولة](/ar/automation/cron-jobs#troubleshooting)

## بدء سريع (للمبتدئين)

1. اترك Heartbeat مفعّلًا (الافتراضي هو `30m`، أو `1h` لمصادقة Anthropic عبر OAuth/token، بما في ذلك إعادة استخدام Claude CLI) أو اضبط وتيرتك الخاصة.
2. أنشئ قائمة تحقق صغيرة في `HEARTBEAT.md` أو كتلة `tasks:` في مساحة عمل الوكيل (اختياري لكنه موصى به).
3. قرر أين يجب أن تذهب رسائل Heartbeat (الافتراضي هو `target: "none"`؛ اضبط `target: "last"` للتوجيه إلى آخر جهة اتصال).
4. اختياري: فعّل تسليم reasoning الخاصة بـ Heartbeat من أجل الشفافية.
5. اختياري: استخدم سياق bootstrap خفيفًا إذا كانت تشغيلات Heartbeat تحتاج فقط إلى `HEARTBEAT.md`.
6. اختياري: فعّل الجلسات المعزولة لتجنب إرسال السجل الكامل للمحادثة في كل Heartbeat.
7. اختياري: قصر Heartbeat على الساعات النشطة (بالتوقيت المحلي).

مثال على التهيئة:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // تسليم صريح إلى آخر جهة اتصال (الافتراضي هو "none")
        directPolicy: "allow", // الافتراضي: السماح بالأهداف المباشرة/DM؛ اضبط "block" للحظر
        lightContext: true, // اختياري: حقن HEARTBEAT.md فقط من ملفات bootstrap
        isolatedSession: true, // اختياري: جلسة جديدة في كل تشغيل (بلا سجل محادثة)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // اختياري: إرسال رسالة `Reasoning:` منفصلة أيضًا
      },
    },
  },
}
```

## القيم الافتراضية

- الفترة: `30m` (أو `1h` عندما يكون وضع المصادقة المكتشف هو Anthropic OAuth/token، بما في ذلك إعادة استخدام Claude CLI). اضبط `agents.defaults.heartbeat.every` أو `agents.list[].heartbeat.every` لكل وكيل؛ واستخدم `0m` للتعطيل.
- نص prompt (قابل للتهيئة عبر `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- يتم إرسال prompt الخاصة بـ Heartbeat **كما هي حرفيًا** بوصفها رسالة المستخدم. وتتضمن
  system prompt قسم “Heartbeat” فقط عندما تكون Heartbeat مفعّلة للوكيل
  الافتراضي، ويتم وسم التشغيل داخليًا.
- عندما تُعطَّل Heartbeats باستخدام `0m`، تُحذف أيضًا `HEARTBEAT.md`
  من سياق bootstrap في التشغيلات العادية حتى لا يرى النموذج تعليمات Heartbeat فقط.
- يتم التحقق من الساعات النشطة (`heartbeat.activeHours`) في المنطقة الزمنية المهيأة.
  وخارج تلك النافذة، يتم تخطي Heartbeats حتى النبضة التالية داخل النافذة.

## الغرض من prompt الخاصة بـ Heartbeat

prompt الافتراضية واسعة عمدًا:

- **المهام الخلفية**: عبارة “Consider outstanding tasks” تدفع الوكيل إلى مراجعة
  المتابعات (البريد الوارد، والتقويم، والتذكيرات، والعمل المصطفّ) وإظهار أي شيء عاجل.
- **الاطمئنان على الإنسان**: عبارة “Checkup sometimes on your human during day time” تدفع إلى
  إرسال رسالة خفيفة عرضية مثل “هل تحتاج شيئًا؟”، لكنها تتجنب الإزعاج الليلي
  باستخدام منطقتك الزمنية المحلية المهيأة (راجع [/concepts/timezone](/ar/concepts/timezone)).

يمكن لـ Heartbeat التفاعل مع [المهام الخلفية](/ar/automation/tasks) المكتملة، لكن تشغيل Heartbeat نفسه لا ينشئ سجل مهمة.

إذا كنت تريد من Heartbeat أن يقوم بشيء محدد جدًا (مثل “فحص إحصاءات Gmail PubSub”
أو “التحقق من سلامة Gateway”)، فاضبط `agents.defaults.heartbeat.prompt` (أو
`agents.list[].heartbeat.prompt`) على نص مخصص (يُرسل حرفيًا).

## عقد الاستجابة

- إذا لم يكن هناك ما يحتاج إلى انتباه، فاردد بـ **`HEARTBEAT_OK`**.
- أثناء تشغيلات Heartbeat، يتعامل OpenClaw مع `HEARTBEAT_OK` كإقرار عندما تظهر
  في **بداية أو نهاية** الرد. ويتم تجريد الرمز وحذف الرد إذا كان
  المحتوى المتبقي **≤ `ackMaxChars`** (الافتراضي: 300).
- إذا ظهرت `HEARTBEAT_OK` في **منتصف** الرد، فلا يتم التعامل معها
  معاملة خاصة.
- بالنسبة إلى التنبيهات، **لا** تضمّن `HEARTBEAT_OK`؛ أعد فقط نص التنبيه.

خارج Heartbeats، يتم تجريد `HEARTBEAT_OK` العرضية في بداية/نهاية الرسالة
وتسجيلها؛ أما الرسالة التي تكون فقط `HEARTBEAT_OK` فيتم حذفها.

## التهيئة

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // الافتراضي: 30m (0m للتعطيل)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // الافتراضي: false (تسليم رسالة Reasoning: منفصلة عند توفرها)
        lightContext: false, // الافتراضي: false؛ القيمة true تُبقي فقط HEARTBEAT.md من ملفات bootstrap لمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ القيمة true تشغّل كل Heartbeat في جلسة جديدة (بلا سجل محادثة)
        target: "last", // الافتراضي: none | الخيارات: last | none | <channel id> (أساسي أو Plugin، مثل "bluebubbles")
        to: "+15551234567", // تجاوز اختياري خاص بالقناة
        accountId: "ops-bot", // معرّف قناة اختياري متعدد الحسابات
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // الحد الأقصى المسموح من الأحرف بعد HEARTBEAT_OK
      },
    },
  },
}
```

### النطاق والأولوية

- يضبط `agents.defaults.heartbeat` سلوك Heartbeat العام.
- يدمج `agents.list[].heartbeat` فوقه؛ وإذا كان لدى أي وكيل كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط** هم من يشغّلون Heartbeats.
- يضبط `channels.defaults.heartbeat` القيم الافتراضية للظهور في جميع القنوات.
- يتجاوز `channels.<channel>.heartbeat` قيم القناة الافتراضية.
- يتجاوز `channels.<channel>.accounts.<id>.heartbeat` (للقنوات متعددة الحسابات) إعدادات كل قناة.

### Heartbeats لكل وكيل

إذا تضمن أي إدخال في `agents.list[]` كتلة `heartbeat`، فإن **هؤلاء الوكلاء فقط**
هم من يشغّلون Heartbeats. وتندمج الكتلة لكل وكيل فوق `agents.defaults.heartbeat`
(بحيث يمكنك تعيين القيم المشتركة مرة واحدة وتجاوزها لكل وكيل).

مثال: وكيلان، والوكيل الثاني فقط هو الذي يشغّل Heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // تسليم صريح إلى آخر جهة اتصال (الافتراضي هو "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### مثال على الساعات النشطة

اقصر Heartbeats على ساعات العمل في منطقة زمنية محددة:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // تسليم صريح إلى آخر جهة اتصال (الافتراضي هو "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // اختياري؛ يستخدم userTimezone الخاصة بك إذا كانت مضبوطة، وإلا يستخدم منطقة المضيف الزمنية
        },
      },
    },
  },
}
```

خارج هذه النافذة (قبل التاسعة صباحًا أو بعد العاشرة مساءً بتوقيت الساحل الشرقي)، يتم تخطي Heartbeats. وستعمل النبضة المجدولة التالية داخل النافذة بشكل طبيعي.

### إعداد 24/7

إذا كنت تريد تشغيل Heartbeats طوال اليوم، فاستخدم أحد هذين النمطين:

- احذف `activeHours` بالكامل (بلا تقييد بنافذة زمنية؛ وهذا هو السلوك الافتراضي).
- عيّن نافذة يوم كامل: `activeHours: { start: "00:00", end: "24:00" }`.

لا تعيّن `start` و`end` على الوقت نفسه (مثل `08:00` إلى `08:00`).
إذ يُعامل ذلك على أنه نافذة بعرض صفري، وبالتالي يتم دائمًا تخطي Heartbeats.

### مثال متعدد الحسابات

استخدم `accountId` لاستهداف حساب محدد على القنوات متعددة الحسابات مثل Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // اختياري: التوجيه إلى topic/thread محدد
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### ملاحظات الحقول

- `every`: فترة Heartbeat (سلسلة مدة؛ وحدة القياس الافتراضية = الدقائق).
- `model`: تجاوز اختياري للنموذج أثناء تشغيلات Heartbeat (`provider/model`).
- `includeReasoning`: عند التمكين، يتم أيضًا تسليم رسالة `Reasoning:` المنفصلة عند توفرها (بالشكل نفسه كما في `/reasoning on`).
- `lightContext`: عندما تكون true، تستخدم تشغيلات Heartbeat سياق bootstrap خفيفًا وتحتفظ فقط بـ `HEARTBEAT.md` من ملفات bootstrap لمساحة العمل.
- `isolatedSession`: عندما تكون true، تعمل كل Heartbeat في جلسة جديدة دون أي سجل محادثة سابق. وتستخدم نمط العزل نفسه الذي يستخدمه Cron في `sessionTarget: "isolated"`. وهذا يقلل بشكل كبير تكلفة الرموز لكل Heartbeat. اجمعه مع `lightContext: true` لتحقيق أقصى توفير. ويستمر توجيه التسليم باستخدام سياق الجلسة الرئيسية.
- `session`: مفتاح جلسة اختياري لتشغيلات Heartbeat.
  - `main` (الافتراضي): الجلسة الرئيسية للوكيل.
  - مفتاح جلسة صريح (انسخه من `openclaw sessions --json` أو من [CLI الخاصة بالجلسات](/ar/cli/sessions)).
  - صيغ مفاتيح الجلسات: راجع [الجلسات](/ar/concepts/session) و[المجموعات](/ar/channels/groups).
- `target`:
  - `last`: التسليم إلى آخر قناة خارجية مستخدمة.
  - قناة صريحة: أي قناة أو معرّف Plugin مهيأ، مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`.
  - `none` (الافتراضي): تشغيل Heartbeat لكن **من دون تسليم** خارجي.
- `directPolicy`: يتحكم في سلوك التسليم المباشر/DM:
  - `allow` (الافتراضي): السماح بتسليم Heartbeat المباشر/DM.
  - `block`: حظر التسليم المباشر/DM (`reason=dm-blocked`).
- `to`: تجاوز اختياري للمستلم (معرّف خاص بالقناة، مثل E.164 لـ WhatsApp أو معرّف دردشة Telegram). وبالنسبة إلى topics/threads في Telegram، استخدم `<chatId>:topic:<messageThreadId>`.
- `accountId`: معرّف حساب اختياري للقنوات متعددة الحسابات. وعندما يكون `target: "last"`، ينطبق معرّف الحساب على القناة الأخيرة المحلولة إذا كانت تدعم الحسابات؛ وإلا فيتم تجاهله. وإذا لم يطابق معرّف الحساب حسابًا مهيأً للقناة المحلولة، فيتم تخطي التسليم.
- `prompt`: يتجاوز نص prompt الافتراضي (ولا يندمج معه).
- `ackMaxChars`: الحد الأقصى للأحرف المسموح بها بعد `HEARTBEAT_OK` قبل التسليم.
- `suppressToolErrorWarnings`: عندما تكون true، تحجب حمولات تحذير أخطاء الأدوات أثناء تشغيلات Heartbeat.
- `activeHours`: تقصر تشغيلات Heartbeat على نافذة زمنية. وهو كائن يحتوي على `start` (HH:MM، شامل؛ استخدم `00:00` لبداية اليوم)، و`end` (HH:MM غير شامل؛ ويُسمح بـ `24:00` لنهاية اليوم)، و`timezone` اختياري.
  - عند الحذف أو `"user"`: يستخدم `agents.defaults.userTimezone` الخاص بك إذا كان مضبوطًا، وإلا فيعود إلى المنطقة الزمنية لنظام المضيف.
  - `"local"`: يستخدم دائمًا المنطقة الزمنية لنظام المضيف.
  - أي معرّف IANA (مثل `America/New_York`): يُستخدم مباشرة؛ وإذا كان غير صالح، فيعود إلى سلوك `"user"` المذكور أعلاه.
  - يجب ألا يكون `start` و`end` متساويين في نافذة نشطة؛ إذ تُعامل القيم المتساوية على أنها عرض صفري (أي دائمًا خارج النافذة).
  - خارج النافذة النشطة، يتم تخطي Heartbeats حتى النبضة التالية داخل النافذة.

## سلوك التسليم

- تعمل Heartbeats في الجلسة الرئيسية للوكيل افتراضيًا (`agent:<id>:<mainKey>`)،
  أو في `global` عندما تكون `session.scope = "global"`. اضبط `session` لتجاوزه إلى
  جلسة قناة محددة (Discord/WhatsApp/إلخ).
- يؤثر `session` فقط في سياق التشغيل؛ أما التسليم فيتحكم فيه `target` و`to`.
- للتسليم إلى قناة/مستلم محدد، اضبط `target` + `to`. وعند استخدام
  `target: "last"`، يستخدم التسليم آخر قناة خارجية لتلك الجلسة.
- تسمح عمليات تسليم Heartbeat بالأهداف المباشرة/DM افتراضيًا. اضبط `directPolicy: "block"` لحظر الإرسال إلى الأهداف المباشرة مع الاستمرار في تشغيل دورة Heartbeat.
- إذا كانت قائمة الانتظار الرئيسية مشغولة، يتم تخطي Heartbeat وإعادة المحاولة لاحقًا.
- إذا تم حل `target` إلى عدم وجود وجهة خارجية، فلا يزال التشغيل يحدث لكن
  لا يتم إرسال أي رسالة صادرة.
- إذا كانت `showOk` و`showAlerts` و`useIndicator` جميعها معطلة، فيتم تخطي التشغيل مسبقًا مع `reason=alerts-disabled`.
- إذا كان تسليم التنبيهات فقط هو المعطل، فلا يزال بإمكان OpenClaw تشغيل Heartbeat، وتحديث الطوابع الزمنية للمهام المستحقة، واستعادة الطابع الزمني لخمول الجلسة، وحجب حمولة التنبيه الخارجية.
- إذا كان هدف Heartbeat المحلول يدعم الكتابة، فسيعرض OpenClaw حالة الكتابة أثناء
  تشغيل Heartbeat. ويستخدم هذا الهدف نفسه الذي كانت Heartbeat سترسل
  خرج الدردشة إليه، ويتم تعطيله بواسطة `typingMode: "never"`.
- الردود الخاصة بـ Heartbeat فقط **لا** تُبقي الجلسة حية؛ إذ تتم استعادة آخر `updatedAt`
  بحيث يعمل انتهاء الخمول بشكل طبيعي.
- يُخفي سجل Control UI وWebChat prompts الخاصة بـ Heartbeat وإقرارات
  OK فقط. ومع ذلك، قد يظل transcript الأساسي للجلسة يحتوي على تلك
  الدورات لأغراض التدقيق/إعادة التشغيل.
- يمكن لـ [المهام الخلفية](/ar/automation/tasks) المنفصلة وضع حدث نظام في قائمة الانتظار وإيقاظ Heartbeat عندما تحتاج الجلسة الرئيسية إلى ملاحظة شيء بسرعة. ولا يجعل هذا الإيقاظ تشغيل Heartbeat مهمةً في الخلفية.

## عناصر التحكم في الظهور

افتراضيًا، يتم حجب إقرارات `HEARTBEAT_OK` بينما يتم
تسليم محتوى التنبيهات. ويمكنك ضبط هذا لكل قناة أو لكل حساب:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # إخفاء HEARTBEAT_OK (الافتراضي)
      showAlerts: true # إظهار رسائل التنبيه (الافتراضي)
      useIndicator: true # إصدار أحداث المؤشر (الافتراضي)
  telegram:
    heartbeat:
      showOk: true # إظهار إقرارات OK على Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # حجب تسليم التنبيهات لهذا الحساب
```

الأولوية: لكل حساب ← لكل قناة ← القيم الافتراضية للقناة ← القيم الافتراضية المدمجة.

### ما الذي يفعله كل علم

- `showOk`: يرسل إقرار `HEARTBEAT_OK` عندما يعيد النموذج ردًا من نوع OK فقط.
- `showAlerts`: يرسل محتوى التنبيه عندما يعيد النموذج ردًا ليس من نوع OK.
- `useIndicator`: يصدر أحداث مؤشر لأسطح حالة UI.

إذا كانت **الثلاثة جميعًا** false، فإن OpenClaw يتخطى تشغيل Heartbeat بالكامل (دون استدعاء للنموذج).

### أمثلة لكل قناة مقابل لكل حساب

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # كل حسابات Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # حجب التنبيهات لحساب ops فقط
  telegram:
    heartbeat:
      showOk: true
```

### أنماط شائعة

| الهدف                                     | التهيئة                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| السلوك الافتراضي (OK صامتة، التنبيهات مفعّلة) | _(لا حاجة إلى تهيئة)_                                                                     |
| صامت بالكامل (لا رسائل، لا مؤشر)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| مؤشر فقط (بلا رسائل)                      | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| إظهار OK في قناة واحدة فقط                | `channels.telegram.heartbeat: { showOk: true }`                                           |

## `HEARTBEAT.md` (اختياري)

إذا وُجد ملف `HEARTBEAT.md` في مساحة العمل، فإن prompt الافتراضية تطلب من
الوكيل قراءته. فكر فيه على أنه “قائمة تحقق Heartbeat”: صغيرة وثابتة و
آمنة للإدراج كل 30 دقيقة.

في التشغيلات العادية، لا يتم حقن `HEARTBEAT.md` إلا عندما تكون إرشادات Heartbeat
مفعّلة للوكيل الافتراضي. أما تعطيل وتيرة Heartbeat باستخدام `0m` أو
ضبط `includeSystemPromptSection: false` فيحذفانه من سياق bootstrap
العادي.

إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط وعناوين Markdown
مثل `# Heading`)، فإن OpenClaw يتخطى تشغيل Heartbeat لتوفير استدعاءات API.
ويتم الإبلاغ عن هذا التخطي مع `reason=empty-heartbeat-file`.
أما إذا كان الملف مفقودًا، فستستمر Heartbeat في العمل ويقرر النموذج ما ينبغي فعله.

اجعله صغيرًا (قائمة تحقق قصيرة أو تذكيرات) لتجنب تضخم prompt.

مثال على `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### كتل `tasks:`

يدعم `HEARTBEAT.md` أيضًا كتلة `tasks:` صغيرة مهيكلة لفحوصات
قائمة على الفواصل الزمنية داخل Heartbeat نفسها.

مثال:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

السلوك:

- يقوم OpenClaw بتحليل كتلة `tasks:` والتحقق من كل مهمة مقابل `interval` الخاص بها.
- يتم تضمين المهام **المستحقة** فقط في prompt الخاصة بـ Heartbeat لتلك النبضة.
- إذا لم تكن هناك مهام مستحقة، يتم تخطي Heartbeat بالكامل (`reason=no-tasks-due`) لتجنب استدعاء نموذج غير لازم.
- يتم الاحتفاظ بالمحتوى غير المرتبط بالمهام في `HEARTBEAT.md` وإلحاقه كسياق إضافي بعد قائمة المهام المستحقة.
- تُخزَّن الطوابع الزمنية لآخر تشغيل للمهام في حالة الجلسة (`heartbeatTaskState`)، لذلك تظل الفواصل الزمنية محفوظة عبر عمليات إعادة التشغيل العادية.
- لا يتم تقديم الطوابع الزمنية للمهام إلا بعد أن يكمل تشغيل Heartbeat مسار الرد العادي. ولا تُعلَّم التشغيلات المتخطاة بسبب `empty-heartbeat-file` / `no-tasks-due` على أنها مكتملة.

يكون وضع المهام مفيدًا عندما تريد أن يحتوي ملف Heartbeat واحد على عدة فحوصات دورية دون أن تدفع تكلفة جميعها في كل نبضة.

### هل يمكن للوكيل تحديث `HEARTBEAT.md`؟

نعم — إذا طلبت منه ذلك.

إن `HEARTBEAT.md` مجرد ملف عادي في مساحة عمل الوكيل، لذا يمكنك أن تخبر
الوكيل (في دردشة عادية) بشيء مثل:

- “حدّث `HEARTBEAT.md` لإضافة فحص يومي للتقويم.”
- “أعد كتابة `HEARTBEAT.md` ليصبح أقصر وأكثر تركيزًا على متابعات البريد الوارد.”

وإذا أردت أن يحدث هذا بشكل استباقي، فيمكنك أيضًا تضمين سطر صريح في
prompt الخاصة بـ Heartbeat مثل: “إذا أصبحت قائمة التحقق قديمة، فحدّث HEARTBEAT.md
بنسخة أفضل.”

ملاحظة أمان: لا تضع أسرارًا (مفاتيح API، أو أرقام هواتف، أو رموزًا خاصة)
داخل `HEARTBEAT.md` — لأنه يصبح جزءًا من سياق prompt.

## إيقاظ يدوي (عند الطلب)

يمكنك وضع حدث نظام في قائمة الانتظار وتشغيل Heartbeat فورية باستخدام:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

إذا كانت عدة وكلاء مهيأة بـ `heartbeat`، فإن الإيقاظ اليدوي يشغّل Heartbeats
الخاصة بكل واحد من هؤلاء الوكلاء فورًا.

استخدم `--mode next-heartbeat` للانتظار حتى النبضة المجدولة التالية.

## تسليم reasoning (اختياري)

افتراضيًا، تسلّم Heartbeats حمولة “الإجابة” النهائية فقط.

إذا أردت الشفافية، فعّل:

- `agents.defaults.heartbeat.includeReasoning: true`

عند التمكين، ستسلّم Heartbeats أيضًا رسالة منفصلة مسبوقة بـ
`Reasoning:` (بالشكل نفسه كما في `/reasoning on`). وقد يكون هذا مفيدًا عندما يكون الوكيل
يدير عدة جلسات/codexes وتريد أن ترى لماذا قرر أن يرسل إليك تنبيهًا —
لكنه قد يكشف أيضًا تفاصيل داخلية أكثر مما تريد. لذا يُفضّل إبقاؤه
معطّلًا في دردشات المجموعات.

## مراعاة التكلفة

تشغّل Heartbeats دورات وكيل كاملة. والفواصل الأقصر تستهلك مزيدًا من الرموز. لتقليل التكلفة:

- استخدم `isolatedSession: true` لتجنب إرسال السجل الكامل للمحادثة (~100K رمز إلى ~2-5K لكل تشغيل).
- استخدم `lightContext: true` لقصر ملفات bootstrap على `HEARTBEAT.md` فقط.
- اضبط `model` أرخص (مثل `ollama/llama3.2:1b`).
- أبقِ `HEARTBEAT.md` صغيرًا.
- استخدم `target: "none"` إذا كنت تريد فقط تحديثات الحالة الداخلية.

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — نظرة سريعة على جميع آليات الأتمتة
- [المهام الخلفية](/ar/automation/tasks) — كيف يتم تتبع العمل المنفصل
- [المنطقة الزمنية](/ar/concepts/timezone) — كيف تؤثر المنطقة الزمنية في جدولة Heartbeat
- [استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting) — تصحيح أخطاء مشكلات الأتمتة
