---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم بوت Telegram وإمكاناته وإعداداته
title: Telegram
x-i18n:
    generated_at: "2026-04-23T07:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2073245079eb48b599c4274cc620eb29211a64c5d396ffb355f7022fecec9a6
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

الحالة: جاهز للإنتاج لرسائل البوت المباشرة + المجموعات عبر grammY. يُعد الاستطلاع الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    أدوات تشخيص متعددة القنوات وأدلة إصلاح.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعدادات القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وابدأ محادثة مع **@BotFather** (تأكد من أن المعرّف هو `@BotFather` تمامًا).

    شغّل `/newbot`، واتبع المطالبات، واحفظ الرمز.

  </Step>

  <Step title="اضبط الرمز وسياسة الرسائل المباشرة">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    متغير البيئة الاحتياطي: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ اضبط الرمز في config/env، ثم ابدأ gateway.

  </Step>

  <Step title="ابدأ gateway ووافق على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="أضف البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يتوافق مع نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب تحديد الرمز يراعي الحساب. عمليًا، تتغلب قيم config على الاحتياطي من متغيرات البيئة، وينطبق `TELEGRAM_BOT_TOKEN` على الحساب الافتراضي فقط.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وإمكانية الرؤية في المجموعات">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، الذي يحد من الرسائل الجماعية التي تستقبلها.

    إذا كان يجب أن يرى البوت جميع رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تستقبل البوتات المشرفة جميع رسائل المجموعة، وهو ما يفيد في سلوك المجموعات الدائم.

  </Accordion>

  <Accordion title="إعدادات BotFather المفيدة">

    - `/setjoingroups` للسماح بإضافة المجموعات أو منعها
    - `/setprivacy` لسلوك الرؤية في المجموعات

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن تتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. وتُقبل البادئتان `telegram:` / `tg:` وتُطبّعان.
    يؤدي `dmPolicy: "allowlist"` مع `allowFrom` فارغة إلى حظر جميع الرسائل المباشرة ويُرفض عبر التحقق من صحة الإعدادات.
    يطلب الإعداد معرّفات مستخدم رقمية فقط.
    إذا كنت قد قمت بالترقية ويحتوي الإعداد لديك على إدخالات قائمة سماح `@username`، فشغّل `openclaw doctor --fix` لتحليلها (على أساس أفضل جهد؛ ويتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح الخاصة بمخزن الاقتران، فيمكن للأمر `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (على سبيل المثال عندما يكون `dmPolicy: "allowlist"` من دون معرّفات صريحة بعد).

    بالنسبة إلى البوتات ذات المالك الواحد، يُفضَّل استخدام `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على سياسة الوصول ثابتة في config (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    التباس شائع: لا تعني الموافقة على اقتران الرسائل المباشرة أن "هذا المرسل مخوَّل في كل مكان".
    يمنح الاقتران وصول الرسائل المباشرة فقط. أما تخويل المرسل في المجموعات فلا يزال يأتي من قوائم السماح الصريحة في config.
    إذا كنت تريد "أن أكون مخولًا مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعات"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    الطريقة الأكثر أمانًا (من دون بوت طرف ثالث):

    1. أرسل رسالة مباشرة إلى البوت.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة طرف ثالث (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    يُطبَّق عنصران معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - لا يوجد config لـ `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز عمليات فحص معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (افتراضي): تُحظر المجموعات حتى تضيف إدخالات إلى `groups` (أو `"*"`)
       - تم ضبط `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **ما المرسلون المسموح بهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. وإذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (وتُطبَّع البادئتان `telegram:` / `tg:`).
    لا تضع معرّفات دردشات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. فمعرّفات الدردشة السالبة مكانها تحت `channels.telegram.groups`.
    يتم تجاهل الإدخالات غير الرقمية عند تخويل المرسلين.
    حد الأمان (`2026.2.25+`): لا يرث تخويل مرسلي المجموعات موافقات مخزن اقتران الرسائل المباشرة.
    يظل الاقتران خاصًا بالرسائل المباشرة فقط. بالنسبة إلى المجموعات، اضبط `groupAllowFrom` أو `allowFrom` على مستوى كل مجموعة/موضوع.
    إذا لم يتم ضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في config، وليس إلى مخزن الاقتران.
    النمط العملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فإن الإعدادات الافتراضية في وقت التشغيل تكون fail-closed مع `groupPolicy="allowlist"` ما لم يتم ضبط `channels.defaults.groupPolicy` صراحة.

    مثال: السماح لأي عضو في مجموعة محددة واحدة:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    مثال: السماح لمستخدمين محددين فقط داخل مجموعة محددة واحدة:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      خطأ شائع: `groupAllowFrom` ليست قائمة سماح لمجموعات Telegram.

      - ضع معرّفات دردشات مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` تحت `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تقييد الأشخاص داخل المجموعة المسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.
    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب الردود في المجموعات إشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة `@botusername` أصلية، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه الجلسة فقط. استخدم config للاستمرارية.

    مثال على config دائم:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    الحصول على معرّف دردشة المجموعة:

    - أعد توجيه رسالة من المجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص `getUpdates` في Bot API

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- Telegram مملوك لعملية gateway.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (ولا يختار النموذج القنوات).
- تُطبَّع الرسائل الواردة إلى مغلف القناة المشترك مع بيانات الرد الوصفية وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات بحسب معرّف المجموعة. وتضيف مواضيع المنتدى اللاحقة `:topic:<threadId>` للحفاظ على عزل المواضيع.
- يمكن أن تحمل الرسائل المباشرة `message_thread_id`؛ ويوجهها OpenClaw باستخدام مفاتيح جلسات تراعي الخيوط ويحافظ على معرّف الخيط عند الرد.
- يستخدم الاستطلاع الطويل grammY runner مع تسلسل لكل دردشة/لكل خيط. ويستخدم تزامن sink العام للـ runner القيمة `agents.defaults.maxConcurrent`.
- يتم تشغيل عمليات إعادة تشغيل مراقب الاستطلاع الطويل بعد 120 ثانية من دون اكتمال liveness لـ `getUpdates` افتراضيًا. لا ترفع `channels.telegram.pollingStallThresholdMs` إلا إذا كانت عملية النشر لديك لا تزال ترى عمليات إعادة تشغيل خاطئة بسبب تعثر الاستطلاع أثناء العمل طويل المدة. القيمة بالمللي ثانية، ويُسمح بها من `30000` إلى `600000`؛ كما أن تجاوزات كل حساب مدعومة.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلب:

    - تكون قيمة `channels.telegram.streaming` هي `off | partial | block | progress` (الافتراضي: `partial`)
    - يتم ربط `progress` بـ `partial` على Telegram (للتوافق مع التسمية متعددة القنوات)
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدّم تعيد استخدام رسالة المعاينة المعدَّلة نفسها (الافتراضي: `true`). اضبطه على `false` للاحتفاظ برسائل أدوات/تقدّم منفصلة.
    - يتم ربط `channels.telegram.streamMode` القديم وقيم `streaming` المنطقية تلقائيًا

    بالنسبة إلى الردود النصية فقط:

    - الرسائل المباشرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)
    - المجموعة/الموضوع: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)

    بالنسبة إلى الردود المعقدة (مثل حمولة الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن block streaming. وعندما يتم تفعيل block streaming صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    إذا كان نقل المسودة الأصلي غير متاح/مرفوضًا، يعود OpenClaw تلقائيًا إلى `sendMessage` + `editMessageText`.

    بث الاستدلال الخاص بـ Telegram فقط:

    - `/reasoning stream` يرسل الاستدلال إلى المعاينة المباشرة أثناء التوليد
    - يُرسل الجواب النهائي من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع الاحتياطي إلى HTML">
    يستخدم النص الصادر من Telegram القيمة `parse_mode: "HTML"`.

    - يتم تحويل النص الشبيه بـ Markdown إلى HTML آمن لـ Telegram.
    - يتم تهريب HTML الخام الصادر من النموذج لتقليل إخفاقات تحليل Telegram.
    - إذا رفض Telegram HTML المحلَّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها عبر `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    الإعدادات الافتراضية للأوامر الأصلية:

    - يفعّل `commands.native: "auto"` الأوامر الأصلية لـ Telegram

    أضف إدخالات قائمة أوامر مخصصة:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "نسخ احتياطي Git" },
        { command: "generate", description: "إنشاء صورة" },
      ],
    },
  },
}
```

    القواعد:

    - تُطبّع الأسماء (إزالة `/` البادئة، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ فهي لا تنفذ السلوك تلقائيًا
- لا يزال بإمكان أوامر Plugin/Skills العمل عند كتابتها حتى إذا لم تكن ظاهرة في قائمة Telegram

إذا كانت الأوامر الأصلية معطلة، فستتم إزالة الأوامر المضمنة. وقد تظل الأوامر المخصصة/أوامر Plugin مسجلة إذا كانت مهيأة.

إخفاقات الإعداد الشائعة:

- تعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال متجاوزة للحد بعد التقليص؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل `channels.telegram.commands.native`.
- تعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

### أوامر اقتران الأجهزة (`device-pair` Plugin)

عندما يكون `device-pair` Plugin مثبتًا:

1. يقوم `/pair` بإنشاء رمز إعداد
2. الصق الرمز في تطبيق iOS
3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
4. وافق على الطلب:
   - `/pair approve <requestId>` للموافقة الصريحة
   - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
   - `/pair approve latest` لأحدث طلب

يحمل رمز الإعداد رمز bootstrap قصير العمر. وتحافظ عملية تسليم bootstrap المضمنة على رمز Node الأساسي عند `scopes: []`؛ وأي رمز operator يتم تسليمه يظل مقيدًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. وتكون عمليات التحقق من نطاق bootstrap مسبوقة بالدور، لذلك فإن قائمة السماح الخاصة بـ operator تلبي طلبات operator فقط؛ أما الأدوار غير operator فلا تزال تحتاج إلى نطاقات تحت بادئة الدور الخاصة بها.

إذا أعاد جهاز المحاولة مع تغيير تفاصيل المصادقة (مثل الدور/النطاقات/المفتاح العام)، فسيتم استبدال الطلب المعلق السابق ويستخدم الطلب الجديد قيمة `requestId` مختلفة. أعد تشغيل `/pair pending` قبل الموافقة.

مزيد من التفاصيل: [الاقتران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمنة">
    اضبط نطاق لوحة المفاتيح المضمنة:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    تجاوز لكل حساب:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    النطاقات:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (افتراضي)

    يتم ربط `capabilities: ["inlineButtons"]` القديم إلى `inlineButtons: "all"`.

    مثال إجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    يتم تمرير نقرات callback إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram ما يلي:

    - `sendMessage` (`to`, `content`, و`mediaUrl` و`replyToMessageId` و`messageThreadId` اختيارية)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, و`iconColor` و`iconCustomEmojiId` اختياريان)

    تكشف إجراءات رسائل القنوات أسماء مستعارة مريحة (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر تحكم التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطل)

    ملاحظة: إن `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل منفصلة في `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال في وقت التشغيل snapshot النشط من الإعدادات/الأسرار (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة تحليل مرتجلة لـ SecretRef لكل عملية إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تشعّب الردود">
    يدعم Telegram وسوم تشعّب الردود الصريحة في المخرجات المولدة:

    - `[[reply_to_current]]` للرد على الرسالة المشغِّلة
    - `[[reply_to:<id>]]` للرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    ملاحظة: يؤدي `off` إلى تعطيل تشعّب الردود الضمني. ومع ذلك لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك الخيوط">
    المجموعات الفائقة الخاصة بالمنتدى:

    - تضيف مفاتيح جلسات الموضوع اللاحقة `:topic:<threadId>`
    - تستهدف الردود وحالات الكتابة خيط الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    الحالة الخاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوعات: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    ويكون `agentId` خاصًا بالموضوع فقط ولا يرث من الإعدادات الافتراضية للمجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف من خلال ضبط `agentId` في إعدادات الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    يصبح لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط ACP المستمر للموضوع**: يمكن لموضوعات المنتدى تثبيت جلسات harness الخاصة بـ ACP عبر روابط ACP typed على المستوى الأعلى:

    - `bindings[]` مع `type: "acp"` و`match.channel: "telegram"`

    مثال:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    يقتصر هذا حاليًا على موضوعات المنتدى في المجموعات والمجموعات الفائقة.

    **إنشاء ACP مرتبط بالخيط من الدردشة**:

    - يمكن للأمر `/acp spawn <agent> --thread here|auto` ربط موضوع Telegram الحالي بجلسة ACP جديدة.
    - تُوجَّه رسائل الموضوع اللاحقة مباشرة إلى جلسة ACP المرتبطة (من دون الحاجة إلى `/acp steer`).
    - يثبّت OpenClaw رسالة تأكيد الإنشاء داخل الموضوع بعد نجاح الربط.
    - يتطلب `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يتضمن سياق القالب ما يلي:

    - `MessageThreadId`
    - `IsForum`

    سلوك خيوط الرسائل المباشرة:

    - تحتفظ الدردشات الخاصة التي تحتوي على `message_thread_id` بتوجيه الرسائل المباشرة لكنها تستخدم مفاتيح جلسات/أهداف رد تراعي الخيوط.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - ضع الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية

    مثال إجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### رسائل الفيديو

    يميز Telegram بين ملفات الفيديو وملاحظات الفيديو.

    مثال إجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ ويُرسل نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يُنزَّل ويُعالَج (عنصر نائب `<media:sticker>`)
    - TGS متحرك: يتم تخطيه
    - WEBM فيديو: يتم تخطيه

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف ذاكرة التخزين المؤقت للملصقات:

    - `~/.openclaw/telegram/sticker-cache.json`

    يتم وصف الملصقات مرة واحدة (عند الإمكان) وتخزينها مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

    فعّل إجراءات الملصقات:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    إجراء إرسال ملصق:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    البحث في الملصقات المخزنة مؤقتًا:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="إشعارات التفاعل">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند التفعيل، يُدرج OpenClaw أحداث نظام مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعدادات:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - يعني `own` تفاعلات المستخدم على الرسائل التي أرسلها البوت فقط (على أساس أفضل جهد عبر ذاكرة التخزين المؤقت للرسائل المرسلة).
    - لا تزال أحداث التفاعل تحترم عناصر التحكم في الوصول الخاصة بـ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)؛ ويتم إسقاط المرسلين غير المخولين.
    - لا يوفّر Telegram معرّفات الخيوط في تحديثات التفاعل.
      - تُوجَّه المجموعات غير الخاصة بالمنتدى إلى جلسة دردشة المجموعة
      - تُوجَّه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` للاستطلاع/‏Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات التأكيد">
    يرسل `ackReaction` رمزًا تعبيريًا للتأكيد بينما يعالج OpenClaw رسالة واردة.

    ترتيب التحليل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - احتياطي الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموز emoji موحدة Unicode (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابة الإعدادات من أحداث وأوامر Telegram">
    تكون عمليات كتابة إعدادات القناة مفعلة افتراضيًا (`configWrites !== false`).

    تتضمن عمليات الكتابة التي يشغلها Telegram ما يلي:

    - أحداث ترحيل المجموعات (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلبان تفعيل الأوامر)

    التعطيل:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="تخويل منتقي النموذج في المجموعات">
    تتطلب الأزرار المضمنة لمنتقي النموذج في المجموعات نفس التخويل الذي يتطلبه `/models`. ويمكن للمشاركين غير المخولين التصفح والنقر على الأزرار، لكن OpenClaw يرفض callback قبل تغيير نموذج الجلسة.
  </Accordion>

  <Accordion title="الاستطلاع الطويل مقابل Webhook">
    الافتراضي: الاستطلاع الطويل.

    وضع Webhook:

    - اضبط `channels.telegram.webhookUrl`
    - اضبط `channels.telegram.webhookSecret` (مطلوب عند ضبط عنوان URL لـ webhook)
    - `channels.telegram.webhookPath` اختياري (الافتراضي `/telegram-webhook`)
    - `channels.telegram.webhookHost` اختياري (الافتراضي `127.0.0.1`)
    - `channels.telegram.webhookPort` اختياري (الافتراضي `8787`)

    يرتبط المستمع المحلي الافتراضي لوضع Webhook على `127.0.0.1:8787`.

    إذا كانت نقطة النهاية العامة لديك مختلفة، فضع وكيلًا عكسيًا أمامها ووجّه `webhookUrl` إلى عنوان URL العام.
    اضبط `webhookHost` (مثل `0.0.0.0`) عندما تحتاج عمدًا إلى إدخال خارجي.

    يعيد callback الخاص بـ grammY webhook القيمة 200 خلال 5 ثوانٍ حتى لا يعيد Telegram محاولة التحديثات طويلة التشغيل باعتبارها مهلات قراءة؛ ويستمر العمل الأطول في الخلفية. تعيد عملية الاستطلاع بناء نقل HTTP بعد تعارضات `getUpdates` ذات الرمز 409، بحيث تستخدم المحاولات الجديدة اتصال TCP جديدًا بدلًا من الالتفاف على مقبس keep-alive أنهته Telegram.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) من حجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُضبط، تُطبَّق القيمة الافتراضية لـ grammY).
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط عند وجود عمليات إعادة تشغيل خاطئة بسبب تعثر الاستطلاع.
    - يستخدم سجل سياق المجموعات `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتؤدي القيمة `0` إلى التعطيل.
    - يُمرَّر حاليًا السياق الإضافي للرد/الاقتباس/إعادة التوجيه كما تم استلامه.
    - تتحكم قوائم السماح في Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - يُطبَّق إعداد `channels.telegram.retry` على أدوات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد.

    يمكن أن يكون هدف الإرسال في CLI معرّف دردشة رقميًا أو اسم مستخدم:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    تستخدم استطلاعات Telegram الأمر `openclaw message poll` وتدعم مواضيع المنتدى:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    علامات الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` (من 5 إلى 600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لمواضيع المنتدى (أو استخدم هدفًا بصيغة `:topic:`)

    يدعم الإرسال في Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما تسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يتمكن البوت من التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من الصور المضغوطة أو الوسائط المتحركة المرفوعة

    تقييد الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل المباشرة للموافقين ويمكنه اختياريًا نشر مطالبات الموافقة في الدردشة أو الموضوع الأصلي.

    مسار الإعدادات:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (اختياري؛ يعود إلى معرّفات المالك الرقمية المستنتجة من `allowFrom` و`defaultTo` المباشر عند الإمكان)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`

    يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية. يفعّل Telegram موافقات exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن تحليل موافق واحد على الأقل، سواء من `execApprovals.approvers` أو من إعدادات المالك الرقمية للحساب (`allowFrom` و`defaultTo` للرسائل المباشرة). اضبط `enabled: false` لتعطيل Telegram كعميل موافقة أصلي بشكل صريح. بخلاف ذلك، تعود طلبات الموافقة إلى مسارات الموافقة الأخرى المهيأة أو إلى سياسة الرجوع الاحتياطي لموافقة exec.

    كما يعرض Telegram أزرار الموافقة المشتركة المستخدمة من قنوات الدردشة الأخرى. ويضيف محول Telegram الأصلي أساسًا توجيه الرسائل المباشرة للموافقين، والتوزيع على القناة/الموضوع، وتلميحات الكتابة قبل التسليم.
    وعند وجود هذه الأزرار، فهي تجربة المستخدم الأساسية للموافقة؛ ولا
    ينبغي لـ OpenClaw أن يتضمن أمر `/approve` يدويًا إلا عندما تشير
    نتيجة الأداة إلى أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    قواعد التسليم:

    - `target: "dm"` يرسل مطالبات الموافقة فقط إلى الرسائل المباشرة للموافقين الذين تم تحليلهم
    - `target: "channel"` يرسل المطالبة مرة أخرى إلى دردشة/موضوع Telegram الأصلي
    - `target: "both"` يرسل إلى الرسائل المباشرة للموافقين وإلى الدردشة/الموضوع الأصلي

    لا يمكن الموافقة أو الرفض إلا من قبل الموافقين الذين تم تحليلهم. ولا يمكن لغير الموافقين استخدام `/approve` ولا استخدام أزرار الموافقة في Telegram.

    سلوك تحليل الموافقة:

    - تُحلّ المعرّفات المسبوقة بـ `plugin:` دائمًا عبر موافقات Plugin.
    - تحاول معرّفات الموافقة الأخرى أولًا `exec.approval.resolve`.
    - إذا كان Telegram مخولًا أيضًا لموافقات Plugin وقال gateway
      إن موافقة exec غير معروفة/منتهية الصلاحية، فإن Telegram يعيد المحاولة
      مرة واحدة عبر `plugin.approval.resolve`.
    - لا تنتقل حالات الرفض/الأخطاء الحقيقية في موافقات exec بصمت إلى تحليل
      موافقة Plugin.

    يعرض التسليم إلى القناة نص الأمر في الدردشة، لذا فعّل `channel` أو `both` فقط في المجموعات/المواضيع الموثوقة. وعندما تصل المطالبة إلى موضوع في منتدى، يحافظ OpenClaw على الموضوع لكل من مطالبة الموافقة والمتابعة اللاحقة للموافقة. وتنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تعتمد أزرار الموافقة المضمنة أيضًا على سماح `channels.telegram.capabilities.inlineButtons` بسطح الهدف (`dm` أو `group` أو `all`).

    المستندات ذات الصلة: [موافقات exec](/ar/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا إعدادات في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | يرسل `reply` رسالة خطأ ودية إلى الدردشة. ويكتم `silent` ردود الأخطاء بالكامل. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع إغراق الأخطاء أثناء الانقطاعات. |

تُدعَم تجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس وراثة مفاتيح إعدادات Telegram الأخرى).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="البوت لا يستجيب لرسائل المجموعات التي لا تحتوي على إشارة">

    - إذا كانت `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> تعطيل
      - ثم أزل البوت وأعد إضافته إلى المجموعة
    - يحذر `openclaw channels status` عندما تتوقع الإعدادات رسائل مجموعات من دون إشارة.
    - يمكن للأمر `openclaw channels status --probe` التحقق من معرّفات مجموعات رقمية صريحة؛ ولا يمكن فحص العضوية باستخدام المحرف العام `"*"`.
    - اختبار سريع للجلسة: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقًا">

    - عندما توجد `channels.telegram.groups`، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقّق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - خوّل هوية المرسل الخاصة بك (الاقتران و/أو `allowFrom` الرقمية)
    - لا يزال تخويل الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - تعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - تعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً وجود مشاكل في الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - قد تؤدي Node 22+ مع fetch/proxy مخصص إلى سلوك إيقاف فوري إذا كانت أنواع AbortSignal غير متطابقة.
    - تحلل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ وقد يسبب خروج IPv6 المعطوب إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الحالات باعتبارها أخطاء شبكة قابلة للاسترداد.
    - إذا تضمنت السجلات `Polling stall detected`، فإن OpenClaw يعيد تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية من دون اكتمال liveness الخاص بالاستطلاع الطويل افتراضيًا.
    - لا ترفع `channels.telegram.pollingStallThresholdMs` إلا عندما تكون استدعاءات `getUpdates` طويلة التشغيل سليمة لكن مضيفك لا يزال يبلغ عن عمليات إعادة تشغيل خاطئة بسبب تعثر الاستطلاع. وتشير حالات التعثر المستمرة عادةً إلى مشاكل في proxy أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - على مضيفات VPS ذات الخروج/TLS المباشر غير المستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - تستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2) و`dnsResultOrder=ipv4first`.
    - إذا كان مضيفك يعمل على WSL2 أو يعمل صراحةً بشكل أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - الإجابات ضمن نطاق القياس RFC 2544 (`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيًا. وإذا كان fake-IP موثوق أو
      proxy شفاف يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/مخصص الاستخدام أثناء تنزيل الوسائط، فيمكنك
      تفعيل تجاوز Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر التفعيل نفسه لكل حساب في
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحلل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطِرة معطلة أولًا. فوسائط Telegram تسمح بالفعل افتراضيًا
      بنطاق القياس RFC 2544.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل الحماية
      من SSRF الخاصة بوسائط Telegram. استخدمه فقط في بيئات proxy موثوقة
      يسيطر عليها المشغل مثل Clash أو Mihomo أو توجيه fake-IP في Surge عندما
      تولد هذه الأنظمة إجابات خاصة أو مخصصة الاستخدام خارج نطاق القياس
      RFC 2544. اتركه معطلًا للوصول العادي إلى Telegram عبر الإنترنت العام.
    </Warning>

    - تجاوزات متغيرات البيئة (مؤقتة):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - تحقق من إجابات DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

مزيد من المساعدة: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

## مؤشرات مرجع إعدادات Telegram

المرجع الأساسي:

- `channels.telegram.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.telegram.botToken`: رمز البوت (BotFather).
- `channels.telegram.tokenFile`: قراءة الرمز من مسار ملف عادي. تُرفض الروابط الرمزية.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.telegram.allowFrom`: قائمة سماح الرسائل المباشرة (معرّفات مستخدمي Telegram الرقمية). يتطلب `allowlist` معرّف مرسل واحدًا على الأقل. ويتطلب `open` القيمة `"*"`. ويمكن للأمر `openclaw doctor --fix` تحليل إدخالات `@username` القديمة إلى معرّفات كما يمكنه استعادة إدخالات قائمة السماح من ملفات مخزن الاقتران في تدفقات ترحيل قائمة السماح.
- `channels.telegram.actions.poll`: تفعيل أو تعطيل إنشاء استطلاعات Telegram (مفعّل افتراضيًا؛ ولا يزال يتطلب `sendMessage`).
- `channels.telegram.defaultTo`: هدف Telegram الافتراضي الذي يستخدمه CLI مع `--deliver` عند عدم توفير `--reply-to` صريح.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.telegram.groupAllowFrom`: قائمة سماح مرسلي المجموعات (معرّفات مستخدمي Telegram الرقمية). ويمكن للأمر `openclaw doctor --fix` تحليل إدخالات `@username` القديمة إلى معرّفات. ويتم تجاهل الإدخالات غير الرقمية وقت التخويل. ولا يستخدم تخويل المجموعات الرجوع الاحتياطي إلى مخزن اقتران الرسائل المباشرة (`2026.2.25+`).
- أولوية تعدد الحسابات:
  - عند ضبط معرّفي حسابين أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا.
  - إذا لم يتم ضبط أي منهما، يعود OpenClaw إلى أول معرّف حساب مطبّع ويصدر `openclaw doctor` تحذيرًا.
  - ينطبق `channels.telegram.accounts.default.allowFrom` و`channels.telegram.accounts.default.groupAllowFrom` على الحساب `default` فقط.
  - ترث الحسابات المسماة `channels.telegram.allowFrom` و`channels.telegram.groupAllowFrom` عندما لا تكون القيم على مستوى الحساب مضبوطة.
  - لا ترث الحسابات المسماة `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: الإعدادات الافتراضية لكل مجموعة + قائمة السماح (استخدم `"*"` للإعدادات الافتراضية العامة).
  - `channels.telegram.groups.<id>.groupPolicy`: تجاوز لكل مجموعة لـ groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: الإعداد الافتراضي لتقييد الإشارة.
  - `channels.telegram.groups.<id>.skills`: مرشح Skills (الحذف = كل Skills، والفارغ = لا شيء).
  - `channels.telegram.groups.<id>.allowFrom`: تجاوز قائمة سماح المرسلين لكل مجموعة.
  - `channels.telegram.groups.<id>.systemPrompt`: مطالبة نظام إضافية للمجموعة.
  - `channels.telegram.groups.<id>.enabled`: تعطيل المجموعة عندما تكون `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: تجاوزات لكل موضوع (حقول المجموعة + `agentId` الخاص بالموضوع فقط).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: توجيه هذا الموضوع إلى وكيل محدد (يتجاوز التوجيه على مستوى المجموعة والربط).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: تجاوز لكل موضوع لـ groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: تجاوز تقييد الإشارة لكل موضوع.
- `bindings[]` على المستوى الأعلى مع `type: "acp"` ومعرّف الموضوع القياسي `chatId:topic:topicId` في `match.peer.id`: حقول ربط موضوع ACP المستمر (راجع [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: توجيه موضوعات الرسائل المباشرة إلى وكيل محدد (السلوك نفسه لموضوعات المنتدى).
- `channels.telegram.execApprovals.enabled`: تفعيل Telegram كعميل موافقة exec قائم على الدردشة لهذا الحساب.
- `channels.telegram.execApprovals.approvers`: معرّفات مستخدمي Telegram المسموح لهم بالموافقة على طلبات exec أو رفضها. وهو اختياري عندما يحدّد `channels.telegram.allowFrom` أو `channels.telegram.defaultTo` المباشر المالك بالفعل.
- `channels.telegram.execApprovals.target`: ‏`dm | channel | both` (الافتراضي: `dm`). ويحافظ `channel` و`both` على موضوع Telegram الأصلي عند وجوده.
- `channels.telegram.execApprovals.agentFilter`: مرشح اختياري لمعرّف الوكيل لمطالبات الموافقة المُعاد توجيهها.
- `channels.telegram.execApprovals.sessionFilter`: مرشح اختياري لمفتاح الجلسة (سلسلة فرعية أو regex) لمطالبات الموافقة المُعاد توجيهها.
- `channels.telegram.accounts.<account>.execApprovals`: تجاوز لكل حساب لتوجيه موافقات exec في Telegram وتخويل الموافقين.
- `channels.telegram.capabilities.inlineButtons`: ‏`off | dm | group | all | allowlist` (الافتراضي: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: تجاوز لكل حساب.
- `channels.telegram.commands.nativeSkills`: تفعيل/تعطيل أوامر Skills الأصلية في Telegram.
- `channels.telegram.replyToMode`: ‏`off | first | all` (الافتراضي: `off`).
- `channels.telegram.textChunkLimit`: حجم المقاطع الصادرة (أحرف).
- `channels.telegram.chunkMode`: ‏`length` (افتراضي) أو `newline` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.telegram.linkPreview`: تبديل معاينات الروابط للرسائل الصادرة (الافتراضي: true).
- `channels.telegram.streaming`: ‏`off | partial | block | progress` (معاينة البث المباشر؛ الافتراضي: `partial`؛ وتُربط `progress` إلى `partial`؛ و`block` هو توافق قديم لوضع المعاينة). تستخدم معاينة البث في Telegram رسالة معاينة واحدة تُعدَّل في مكانها.
- `channels.telegram.streaming.preview.toolProgress`: إعادة استخدام رسالة المعاينة المباشرة لتحديثات الأدوات/التقدّم عندما تكون معاينة البث مفعلة (الافتراضي: `true`). اضبطه على `false` للاحتفاظ برسائل أدوات/تقدّم منفصلة.
- `channels.telegram.mediaMaxMb`: الحد الأقصى لوسائط Telegram الواردة/الصادرة (ميغابايت، الافتراضي: 100).
- `channels.telegram.retry`: سياسة إعادة المحاولة لمساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) عند أخطاء API الصادرة القابلة للاسترداد (عدد المحاولات، و`minDelayMs`، و`maxDelayMs`، و`jitter`).
- `channels.telegram.network.autoSelectFamily`: تجاوز `autoSelectFamily` في Node (true=تفعيل، false=تعطيل). يكون مفعّلًا افتراضيًا في Node 22+، مع تعطيله افتراضيًا في WSL2.
- `channels.telegram.network.dnsResultOrder`: تجاوز ترتيب نتائج DNS (`ipv4first` أو `verbatim`). يكون الافتراضي `ipv4first` في Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: تفعيل خطِر لبيئات fake-IP الموثوقة أو proxy الشفاف حيث تحلل تنزيلات وسائط Telegram العنوان `api.telegram.org` إلى عناوين خاصة/داخلية/مخصصة الاستخدام خارج السماح الافتراضي لنطاق القياس RFC 2544.
- `channels.telegram.proxy`: عنوان URL للـ proxy لاستدعاءات Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: تفعيل وضع Webhook (يتطلب `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: سر Webhook (مطلوب عند ضبط `webhookUrl`).
- `channels.telegram.webhookPath`: مسار Webhook المحلي (الافتراضي `/telegram-webhook`).
- `channels.telegram.webhookHost`: مضيف ربط Webhook المحلي (الافتراضي `127.0.0.1`).
- `channels.telegram.webhookPort`: منفذ ربط Webhook المحلي (الافتراضي `8787`).
- `channels.telegram.actions.reactions`: تقييد تفاعلات أداة Telegram.
- `channels.telegram.actions.sendMessage`: تقييد إرسال رسائل أداة Telegram.
- `channels.telegram.actions.deleteMessage`: تقييد حذف رسائل أداة Telegram.
- `channels.telegram.actions.sticker`: تقييد إجراءات ملصقات Telegram — الإرسال والبحث (الافتراضي: false).
- `channels.telegram.reactionNotifications`: ‏`off | own | all` — التحكم في التفاعلات التي تشغّل أحداث النظام (الافتراضي: `own` عند عدم الضبط).
- `channels.telegram.reactionLevel`: ‏`off | ack | minimal | extensive` — التحكم في قدرة الوكيل على التفاعل (الافتراضي: `minimal` عند عدم الضبط).
- `channels.telegram.errorPolicy`: ‏`reply | silent` — التحكم في سلوك ردود الأخطاء (الافتراضي: `reply`). تُدعَم تجاوزات لكل حساب/مجموعة/موضوع.
- `channels.telegram.errorCooldownMs`: الحد الأدنى بالمللي ثانية بين ردود الأخطاء إلى الدردشة نفسها (الافتراضي: `60000`). يمنع إغراق الأخطاء أثناء الانقطاعات.

- [مرجع الإعدادات - Telegram](/ar/gateway/configuration-reference#telegram)

الحقول الخاصة بـ Telegram ذات الإشارة العالية:

- البدء/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ وتُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، و`bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات exec: `execApprovals`، `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- الخيوط/الردود: `replyToMode`
- البث: `streaming` (المعاينة)، `streaming.preview.toolProgress`، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
