---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم بوت Telegram، والإمكانات، والإعدادات
title: Telegram
x-i18n:
    generated_at: "2026-04-21T07:18:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c70775b55d4923a31ad8bae7f4c6e7cbae754c05c3a578180d63db2b59e39a
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

الحالة: جاهز للإنتاج للرسائل المباشرة الخاصة بالبوت + المجموعات عبر grammY. الاستطلاع الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية لـ Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وإجراءات إصلاح.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعداد القنوات الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد أن المعرّف هو بالضبط `@BotFather`).

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

    البديل عبر متغير البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ اضبط الرمز في الإعدادات/متغيرات البيئة، ثم ابدأ Gateway.

  </Step>

  <Step title="ابدأ Gateway ووافق على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="أضف البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و `groupPolicy` بما يطابق نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب تحديد الرمز يعتمد على الحساب. عمليًا، تفوز قيم الإعدادات على البديل عبر متغيرات البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، مما يقيّد الرسائل الجماعية التي تستقبلها.

    إذا كان يجب على البوت رؤية جميع رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة لكي يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    يتم التحكم في حالة المشرف ضمن إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة جميع رسائل المجموعة، وهذا مفيد للسلوك الجماعي الدائم التشغيل.

  </Accordion>

  <Accordion title="خيارات BotFather المفيدة">

    - `/setjoingroups` للسماح/المنع من الإضافة إلى المجموعات
    - `/setprivacy` لسلوك رؤية المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن تتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. ويتم قبول بادئات `telegram:` / `tg:` وتطبيعها.
    يؤدي `dmPolicy: "allowlist"` مع `allowFrom` فارغ إلى حظر جميع الرسائل المباشرة، ويتم رفضه من خلال التحقق من صحة الإعدادات.
    يطلب الإعداد معرّفات المستخدمين الرقمية فقط.
    إذا قمت بالترقية وكان إعدادك يحتوي على إدخالات قائمة سماح بصيغة `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ ويتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الاقتران، فيمكن للأمر `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (على سبيل المثال عندما لا يحتوي `dmPolicy: "allowlist"` بعد على أي معرّفات صريحة).

    بالنسبة إلى البوتات ذات المالك الواحد، يُفضّل استخدام `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على سياسة الوصول بشكل دائم في الإعدادات (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    التباس شائع: الموافقة على اقتران الرسائل المباشرة لا تعني "أن هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران وصول الرسائل المباشرة فقط. أما تخويل مرسلي المجموعة فلا يزال يأتي من قوائم السماح الصريحة في الإعدادات.
    إذا أردت "أن أكون مخوّلًا مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعات"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    الطريقة الأكثر أمانًا (بدون بوت خارجي):

    1. أرسل رسالة مباشرة إلى بوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة خارجية (خصوصية أقل): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    ينطبق عنصرَا تحكم معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - بدون إعداد `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات إلى `groups` (أو `"*"`)
       - عند ضبط `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **ما المرسلون المسموح بهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. وإذا لم يتم ضبطه، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (يتم تطبيع بادئات `telegram:` / `tg:`).
    لا تضع معرّفات دردشات مجموعة Telegram أو supergroup في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة إلى `channels.telegram.groups`.
    يتم تجاهل الإدخالات غير الرقمية عند تخويل المرسلين.
    الحد الأمني (`2026.2.25+`): لا يرث تخويل مرسلي المجموعات موافقات مخزن اقتران الرسائل المباشرة.
    يظل الاقتران مخصصًا للرسائل المباشرة فقط. بالنسبة إلى المجموعات، اضبط `groupAllowFrom` أو `allowFrom` على مستوى المجموعة/الموضوع.
    إذا لم يتم ضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في الإعدادات، وليس إلى مخزن الاقتران.
    النمط العملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فإن الإعدادات الافتراضية وقت التشغيل تكون `groupPolicy="allowlist"` مع الإغلاق الافتراضي ما لم يتم ضبط `channels.defaults.groupPolicy` صراحة.

    مثال: السماح لأي عضو في مجموعة واحدة محددة:

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

    مثال: السماح لمستخدمين محددين فقط داخل مجموعة واحدة محددة:

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

      - ضع معرّفات مجموعات Telegram أو supergroup السالبة مثل `-1001234567890` تحت `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها القادرين على تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.
    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب الردود في المجموعات الإشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة `@botusername` الأصلية، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    هذه تحدّث حالة الجلسة فقط. استخدم الإعدادات للاستمرار.

    مثال على إعداد دائم:

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
    - أو افحص Bot API `getUpdates`

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- Telegram مملوك لعملية Gateway.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (النموذج لا يختار القنوات).
- تُطبّع الرسائل الواردة إلى غلاف القناة المشترك مع بيانات تعريف الردود وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. وتلحق موضوعات المنتدى `:topic:<threadId>` للحفاظ على عزل الموضوعات.
- يمكن أن تحمل رسائل DM القيمة `message_thread_id`؛ ويقوم OpenClaw بتوجيهها باستخدام مفاتيح جلسات واعية بالخيوط ويحافظ على معرّف الخيط في الردود.
- يستخدم الاستطلاع الطويل grammY runner مع تسلسل لكل دردشة/لكل خيط. يستخدم تزامن مصبّ runner الإجمالي القيمة `agents.defaults.maxConcurrent`.
- يتم تشغيل عمليات إعادة بدء مراقب الاستطلاع الطويل بعد 120 ثانية بدون نشاط مكتمل لـ `getUpdates` افتراضيًا. قم بزيادة `channels.telegram.pollingStallThresholdMs` فقط إذا كان النشر لديك لا يزال يشهد عمليات إعادة تشغيل خاطئة بسبب توقّف الاستطلاع أثناء الأعمال طويلة التشغيل. القيمة بالميلي ثانية، ومسموح بها من `30000` إلى `600000`؛ كما أن التجاوزات لكل حساب مدعومة.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث الحي (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` يساوي `off | partial | block | progress` (الافتراضي: `partial`)
    - يتم تعيين `progress` إلى `partial` على Telegram (للتوافق مع التسمية متعددة القنوات)
    - يتم تعيين `channels.telegram.streamMode` القديم وقيم `streaming` المنطقية تلقائيًا

    بالنسبة إلى الردود النصية فقط:

    - DM: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (بدون رسالة ثانية)
    - المجموعة/الموضوع: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (بدون رسالة ثانية)

    بالنسبة إلى الردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن البث بالكتل. عند تمكين البث بالكتل صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    إذا كان نقل المسودة الأصلي غير متاح/مرفوضًا، يعود OpenClaw تلقائيًا إلى `sendMessage` + `editMessageText`.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة الحية أثناء الإنشاء
    - يُرسل الجواب النهائي بدون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والبديل HTML">
    يستخدم النص الصادر في Telegram القيمة `parse_mode: "HTML"`.

    - يتم عرض النص المشابه لـ Markdown على هيئة HTML آمن لـ Telegram.
    - يتم تهريب HTML الخام من النموذج لتقليل إخفاقات تحليل Telegram.
    - إذا رفض Telegram HTML المحلّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعّلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    إعدادات الأوامر الأصلية الافتراضية:

    - `commands.native: "auto"` يمكّن الأوامر الأصلية لـ Telegram

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

    - تُطبّع الأسماء (إزالة `/` من البداية، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`, `0-9`, `_`, والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفّذ السلوك تلقائيًا
    - لا تزال أوامر Plugin/Skills تعمل عند كتابتها حتى إذا لم تظهر في قائمة Telegram

    إذا تم تعطيل الأوامر الأصلية، تتم إزالة الأوامر المضمنة. قد تظل الأوامر المخصصة/أوامر Plugin تُسجَّل إذا تم ضبطها.

    إخفاقات الإعداد الشائعة:

    - تعني رسالة `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما تزال متجاوزة للحد بعد التقليص؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل `channels.telegram.commands.native`.
    - تعني رسالة `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محجوب.

    ### أوامر اقتران الجهاز (`device-pair` Plugin)

    عند تثبيت Plugin ‏`device-pair`:

    1. يقوم `/pair` بإنشاء رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يسرد `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` لأحدث طلب

    يحمل رمز الإعداد رمز bootstrap قصير العمر. يحافظ تسليم bootstrap المضمّن على رمز Node الأساسي عند `scopes: []`؛ وأي رمز operator يتم تسليمه يبقى مقيّدًا بـ `operator.approvals` و `operator.read` و `operator.talk.secrets` و `operator.write`. تكون فحوصات نطاق bootstrap مسبوقة بالدور، لذا فإن قائمة سماح operator هذه لا تلبّي إلا طلبات operator؛ أما الأدوار غير operator فلا تزال تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة مع تفاصيل مصادقة متغيّرة (مثل الدور/النطاقات/المفتاح العام)، يتم استبدال الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

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
    - `allowlist` (الافتراضي)

    يتم تعيين `capabilities: ["inlineButtons"]` القديم إلى `inlineButtons: "all"`.

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
    تتضمن إجراءات أداة Telegram:

    - `sendMessage` (`to`, `content`, واختياريًا `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, واختياريًا `iconColor`, `iconCustomEmojiId`)

    تكشف إجراءات رسائل القناة عن أسماء بديلة سهلة الاستخدام (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم في التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطل)

    ملاحظة: `edit` و `topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم عمليات الإرسال وقت التشغيل لقطة الإعدادات/الأسرار النشطة (البدء/إعادة التحميل)، لذا لا تنفّذ مسارات الإجراءات إعادة حل SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسوم تسلسل ردود صريحة في المخرجات المُنشأة:

    - `[[reply_to_current]]` للرد على الرسالة المُشغِّلة
    - `[[reply_to:<id>]]` للرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    ملاحظة: يعطّل `off` تسلسل الردود الضمني. ولا تزال الوسوم الصريحة `[[reply_to_*]]` محترمة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك الخيوط">
    مجموعات supergroup الخاصة بالمنتدى:

    - تلحق مفاتيح جلسات الموضوع `:topic:<threadId>`
    - تستهدف الردود وإجراءات الكتابة خيط الموضوع
    - مسار إعداد الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    الحالة الخاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوعات: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    يكون `agentId` خاصًا بالموضوع فقط ولا يرث من إعدادات المجموعة الافتراضية.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر ضبط `agentId` في إعداد الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // الموضوع العام → الوكيل main
                "3": { agentId: "zu" },        // موضوع التطوير → الوكيل zu
                "5": { agentId: "coder" }      // مراجعة الكود → الوكيل coder
              }
            }
          }
        }
      }
    }
    ```

    يمتلك كل موضوع بعد ذلك مفتاح جلسته الخاص: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط ACP دائم للموضوع**: يمكن لموضوعات المنتدى تثبيت جلسات harness الخاصة بـ ACP عبر روابط ACP typed على المستوى الأعلى:

    - `bindings[]` مع `type: "acp"` و `match.channel: "telegram"`

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

    هذا النطاق حاليًا مقتصر على موضوعات المنتدى في المجموعات وsupergroups.

    **إنشاء ACP مرتبط بالخيط من الدردشة**:

    - يمكن للأمر `/acp spawn <agent> --thread here|auto` ربط موضوع Telegram الحالي بجلسة ACP جديدة.
    - توجَّه رسائل الموضوع اللاحقة مباشرة إلى جلسة ACP المرتبطة (لا حاجة إلى `/acp steer`).
    - يثبّت OpenClaw رسالة تأكيد الإنشاء داخل الموضوع بعد نجاح الربط.
    - يتطلب `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يتضمن سياق القالب:

    - `MessageThreadId`
    - `IsForum`

    سلوك خيوط DM:

    - تحافظ الدردشات الخاصة التي تتضمن `message_thread_id` على توجيه DM لكنها تستخدم مفاتيح جلسات/أهداف رد واعية بالخيوط.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية

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

    يميّز Telegram بين ملفات الفيديو وملاحظات الفيديو.

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

    - WEBP ثابت: يتم تنزيله ومعالجته (عنصر نائب `<media:sticker>`)
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

    يتم وصف الملصقات مرة واحدة (عندما يكون ذلك ممكنًا) وتخزينها مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

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

    ابحث في الملصقات المخزنة مؤقتًا:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند التمكين، يضيف OpenClaw إلى قائمة الانتظار أحداث نظام مثل:

    - `تمت إضافة تفاعل Telegram: 👍 بواسطة Alice (@alice) على الرسالة 42`

    الإعدادات:

    - `channels.telegram.reactionNotifications`: ‏`off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: ‏`off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدم على الرسائل التي أرسلها البوت فقط (بأفضل جهد عبر ذاكرة التخزين المؤقت للرسائل المرسلة).
    - لا تزال أحداث التفاعل تحترم عناصر التحكم في وصول Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)؛ ويتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفر Telegram معرّفات خيوط في تحديثات التفاعل.
      - تُوجَّه المجموعات غير التابعة للمنتدى إلى جلسة دردشة المجموعة
      - تُوجَّه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` الخاصة بالاستطلاع/Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات التأكيد">
    يرسل `ackReaction` رمزًا تعبيريًا للتأكيد بينما يعالج OpenClaw رسالة واردة.

    ترتيب التحديد:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموز emoji موحدة unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات من أحداث Telegram والأوامر">
    تكون كتابات إعدادات القناة مفعّلة افتراضيًا (`configWrites !== false`).

    تشمل الكتابات التي يطلقها Telegram ما يلي:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و `/config unset` (يتطلب تمكين الأوامر)

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

  <Accordion title="الاستطلاع الطويل مقابل Webhook">
    الافتراضي: الاستطلاع الطويل.

    وضع Webhook:

    - اضبط `channels.telegram.webhookUrl`
    - اضبط `channels.telegram.webhookSecret` (مطلوب عند ضبط عنوان Webhook)
    - `channels.telegram.webhookPath` اختياري (الافتراضي `/telegram-webhook`)
    - `channels.telegram.webhookHost` اختياري (الافتراضي `127.0.0.1`)
    - `channels.telegram.webhookPort` اختياري (الافتراضي `8787`)

    يرتبط المستمع المحلي الافتراضي لوضع Webhook بالعنوان `127.0.0.1:8787`.

    إذا كانت نقطة النهاية العامة لديك مختلفة، فضع reverse proxy في الأمام ووجّه `webhookUrl` إلى العنوان العام.
    اضبط `webhookHost` (على سبيل المثال `0.0.0.0`) عندما تحتاج عمدًا إلى إدخال خارجي.

  </Accordion>

  <Accordion title="الحدود، وإعادة المحاولة، وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) من حجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يتم ضبطه، تُطبَّق القيمة الافتراضية لـ grammY).
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطه بين `30000` و `600000` فقط لحالات إعادة تشغيل توقّف الاستطلاع الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتؤدي القيمة `0` إلى التعطيل.
    - يتم حاليًا تمرير السياق التكميلي للرد/الاقتباس/إعادة التوجيه كما تم استلامه.
    - تتحكم قوائم سماح Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/tools/actions) لأخطاء API الصادرة القابلة للاسترداد.

    يمكن أن يكون هدف الإرسال في CLI معرّف دردشة رقميًا أو اسم مستخدم:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    تستخدم استطلاعات Telegram الأمر `openclaw message poll` وتدعم موضوعات المنتدى:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    علامات الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` (`5-600`)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتدى (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل المباشرة للموافقين ويمكنه اختياريًا نشر مطالبات الموافقة في الدردشة أو الموضوع الأصلي.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (اختياري؛ يعود إلى معرّفات المالك الرقمية المستنتجة من `allowFrom` و `defaultTo` المباشر عندما يكون ذلك ممكنًا)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`, `sessionFilter`

    يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية. يقوم Telegram بتمكين موافقات exec الأصلية تلقائيًا عندما يكون `enabled` غير مضبوط أو يساوي `"auto"` ويمكن حلّ موافق واحد على الأقل، إما من `execApprovals.approvers` أو من إعداد المالك الرقمي للحساب (`allowFrom` و `defaultTo` للرسائل المباشرة). اضبط `enabled: false` لتعطيل Telegram كعميل موافقة أصلي بشكل صريح. وإلا تعود طلبات الموافقة إلى مسارات الموافقة الأخرى المضبوطة أو إلى سياسة الرجوع لموافقة exec.

    يعرض Telegram أيضًا أزرار الموافقة المشتركة المستخدمة من قِبل قنوات الدردشة الأخرى. يضيف مُكيّف Telegram الأصلي أساسًا توجيه الرسائل المباشرة للموافقين، والتوزيع إلى القناة/الموضوع، وتلميحات الكتابة قبل التسليم.
    عندما تكون هذه الأزرار موجودة، فإنها تكون تجربة الاستخدام الأساسية للموافقة؛ ويجب على OpenClaw
    تضمين أمر `/approve` يدوي فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    قواعد التسليم:

    - يرسل `target: "dm"` مطالبات الموافقة فقط إلى الرسائل المباشرة للموافقين الذين تم حلّهم
    - يرسل `target: "channel"` المطالبة مرة أخرى إلى دردشة/موضوع Telegram الأصلي
    - يرسل `target: "both"` إلى الرسائل المباشرة للموافقين وإلى الدردشة/الموضوع الأصلي

    لا يمكن الموافقة أو الرفض إلا للموافقين الذين تم حلّهم. ولا يمكن لغير الموافقين استخدام `/approve` ولا استخدام أزرار موافقة Telegram.

    سلوك حل الموافقة:

    - تُحل دائمًا المعرّفات المسبوقة بـ `plugin:` من خلال موافقات Plugin.
    - تحاول معرّفات الموافقة الأخرى أولًا `exec.approval.resolve`.
    - إذا كان Telegram مخوّلًا أيضًا لموافقات Plugin وأشار Gateway إلى
      أن موافقة exec غير معروفة/منتهية الصلاحية، يعيد Telegram المحاولة مرة واحدة عبر
      `plugin.approval.resolve`.
    - لا تنتقل حالات رفض/أخطاء موافقة exec الحقيقية بصمت إلى حل
      موافقة Plugin.

    يُظهر التسليم عبر القناة نص الأمر في الدردشة، لذا فعّل `channel` أو `both` فقط في المجموعات/الموضوعات الموثوق بها. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لكل من مطالبة الموافقة والمتابعة بعد الموافقة. تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تعتمد أزرار الموافقة المضمنة أيضًا على سماح `channels.telegram.capabilities.inlineButtons` بسطح الهدف (`dm` أو `group` أو `all`).

    مستندات ذات صلة: [موافقات Exec](/ar/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو من المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                               | القيم             | الافتراضي | الوصف                                                                                         |
| ------------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`       | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى الدردشة. ويكتم `silent` ردود الأخطاء بالكامل.                 |
| `channels.telegram.errorCooldownMs`   | number (ms)       | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع سيل الأخطاء أثناء حالات الانقطاع. |

التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع مدعومة (بنفس الوراثة مثل مفاتيح إعداد Telegram الأخرى).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // كتم الأخطاء في هذه المجموعة
        },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="البوت لا يستجيب لرسائل المجموعات غير المذيلة بإشارة">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram بالرؤية الكاملة.
      - BotFather: ‏`/setprivacy` -> تعطيل
      - ثم أزل البوت وأعد إضافته إلى المجموعة
    - يحذّر `openclaw channels status` عندما تتوقع الإعدادات رسائل مجموعات بدون إشارة.
    - يمكن للأمر `openclaw channels status --probe` التحقق من معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص العضوية باستخدام wildcard `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعات إطلاقًا">

    - عند وجود `channels.telegram.groups`، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقّق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - خوّل هوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - لا يزال تخويل الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - تعني رسالة `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - تعني رسالة `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً وجود مشكلات في الوصول إلى DNS/HTTPS نحو `api.telegram.org`

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/proxy مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ ويمكن أن يتسبب خروج IPv6 المعطوب في إخفاقات متقطعة لـ Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الحالات باعتبارها أخطاء شبكة قابلة للاسترداد.
    - إذا تضمنت السجلات `Polling stall detected`، فإن OpenClaw يعيد تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية بدون نشاط مكتمل للاستطلاع الطويل افتراضيًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` الطويلة سليمة ولكن المضيف لديك لا يزال يبلغ عن عمليات إعادة تشغيل خاطئة بسبب توقّف الاستطلاع. تشير حالات التوقف المستمرة عادةً إلى مشكلات proxy أو DNS أو IPv6 أو خروج TLS بين المضيف و `api.telegram.org`.
    - على مضيفات VPS ذات الخروج/TLS المباشر غير المستقر، مرّر استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2) و `dnsResultOrder=ipv4first`.
    - إذا كان المضيف لديك هو WSL2 أو كان يعمل بشكل أفضل صراحةً مع سلوك IPv4-only، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إن الردود من نطاقات قياس RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      افتراضيًا لتنزيلات وسائط Telegram. إذا أعاد fake-IP موثوق أو
      proxy شفاف كتابة `api.telegram.org` إلى عنوان
      خاص/داخلي/خاص بالاستخدامات الخاصة مختلف أثناء تنزيلات الوسائط، فيمكنك
      التمكين في تجاوز Telegram-only:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر التمكين نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطِرة معطّلة أولًا. تسمح وسائط Telegram بالفعل بنطاق قياس RFC 2544
      افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية SSRF
      الخاصة بوسائط Telegram. استخدمه فقط في بيئات proxy موثوق بها وتحت تحكم المشغّل
      مثل Clash أو Mihomo أو توجيه fake-IP في Surge عندما تقوم
      بتركيب ردود خاصة أو خاصة بالاستخدامات الخاصة خارج نطاق قياس RFC 2544. اتركه
      معطّلًا لوصول Telegram العادي عبر الإنترنت العام.
    </Warning>

    - تجاوزات البيئة (مؤقتة):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - تحقّق من ردود DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

مزيد من المساعدة: [استكشاف أخطاء القناة وإصلاحها](/ar/channels/troubleshooting).

## مؤشرات مرجع إعداد Telegram

المرجع الأساسي:

- `channels.telegram.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.telegram.botToken`: رمز البوت (BotFather).
- `channels.telegram.tokenFile`: قراءة الرمز من مسار ملف عادي. يتم رفض الروابط الرمزية.
- `channels.telegram.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.telegram.allowFrom`: قائمة سماح DM (معرّفات مستخدمي Telegram الرقمية). يتطلب `allowlist` معرّف مرسل واحدًا على الأقل. ويتطلب `open` القيمة `"*"`. يمكن للأمر `openclaw doctor --fix` حل إدخالات `@username` القديمة إلى معرّفات، كما يمكنه استعادة إدخالات قائمة السماح من ملفات مخزن الاقتران في تدفقات ترحيل قائمة السماح.
- `channels.telegram.actions.poll`: تمكين أو تعطيل إنشاء استطلاعات Telegram (الافتراضي: مفعّل؛ وما يزال يتطلب `sendMessage`).
- `channels.telegram.defaultTo`: هدف Telegram الافتراضي الذي يستخدمه CLI مع `--deliver` عندما لا يتم توفير `--reply-to` صريح.
- `channels.telegram.groupPolicy`: ‏`open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.telegram.groupAllowFrom`: قائمة سماح مرسلي المجموعات (معرّفات مستخدمي Telegram الرقمية). يمكن للأمر `openclaw doctor --fix` حل إدخالات `@username` القديمة إلى معرّفات. يتم تجاهل الإدخالات غير الرقمية وقت التخويل. لا يستخدم تخويل المجموعات الرجوع إلى مخزن اقتران DM (`2026.2.25+`).
- أسبقية الحسابات المتعددة:
  - عند ضبط معرّفي حسابين أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا.
  - إذا لم يتم ضبط أيٍّ منهما، يعود OpenClaw إلى أول معرّف حساب مطبّع ويصدر `openclaw doctor` تحذيرًا.
  - ينطبق `channels.telegram.accounts.default.allowFrom` و `channels.telegram.accounts.default.groupAllowFrom` على الحساب `default` فقط.
  - ترث الحسابات المسماة `channels.telegram.allowFrom` و `channels.telegram.groupAllowFrom` عندما لا تكون القيم على مستوى الحساب مضبوطة.
  - لا ترث الحسابات المسماة `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: الإعدادات الافتراضية لكل مجموعة + قائمة السماح (استخدم `"*"` للإعدادات الافتراضية العامة).
  - `channels.telegram.groups.<id>.groupPolicy`: تجاوز لكل مجموعة لـ groupPolicy ‏(`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: الإعداد الافتراضي لتقييد الإشارة.
  - `channels.telegram.groups.<id>.skills`: عامل تصفية Skills ‏(الحذف = جميع Skills، والفارغ = لا شيء).
  - `channels.telegram.groups.<id>.allowFrom`: تجاوز قائمة سماح المرسلين لكل مجموعة.
  - `channels.telegram.groups.<id>.systemPrompt`: مطالبة نظام إضافية للمجموعة.
  - `channels.telegram.groups.<id>.enabled`: تعطيل المجموعة عندما تكون `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: تجاوزات لكل موضوع (حقول المجموعة + `agentId` الخاص بالموضوع فقط).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: توجيه هذا الموضوع إلى وكيل محدد (يتجاوز التوجيه على مستوى المجموعة والربط).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: تجاوز لكل موضوع لـ groupPolicy ‏(`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: تجاوز لكل موضوع لتقييد الإشارة.
- `bindings[]` على المستوى الأعلى مع `type: "acp"` ومعرّف الموضوع القياسي `chatId:topic:topicId` في `match.peer.id`: حقول ربط موضوع ACP الدائم (راجع [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: توجيه موضوعات DM إلى وكيل محدد (السلوك نفسه لموضوعات المنتدى).
- `channels.telegram.execApprovals.enabled`: تمكين Telegram كعميل موافقة exec قائم على الدردشة لهذا الحساب.
- `channels.telegram.execApprovals.approvers`: معرّفات مستخدمي Telegram المسموح لهم بالموافقة على طلبات exec أو رفضها. اختياري عندما يكون `channels.telegram.allowFrom` أو `channels.telegram.defaultTo` المباشر يحددان المالك بالفعل.
- `channels.telegram.execApprovals.target`: ‏`dm | channel | both` (الافتراضي: `dm`). يحافظ `channel` و `both` على موضوع Telegram الأصلي عند وجوده.
- `channels.telegram.execApprovals.agentFilter`: عامل تصفية اختياري لمعرّف الوكيل لمطالبات الموافقة المُعاد توجيهها.
- `channels.telegram.execApprovals.sessionFilter`: عامل تصفية اختياري لمفتاح الجلسة (سلسلة فرعية أو regex) لمطالبات الموافقة المُعاد توجيهها.
- `channels.telegram.accounts.<account>.execApprovals`: تجاوز لكل حساب لتوجيه موافقات exec في Telegram وتخويل الموافقين.
- `channels.telegram.capabilities.inlineButtons`: ‏`off | dm | group | all | allowlist` (الافتراضي: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: تجاوز لكل حساب.
- `channels.telegram.commands.nativeSkills`: تمكين/تعطيل أوامر Skills الأصلية في Telegram.
- `channels.telegram.replyToMode`: ‏`off | first | all` (الافتراضي: `off`).
- `channels.telegram.textChunkLimit`: حجم التقسيم الصادر (أحرف).
- `channels.telegram.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.telegram.linkPreview`: تبديل معاينات الروابط للرسائل الصادرة (الافتراضي: true).
- `channels.telegram.streaming`: ‏`off | partial | block | progress` (معاينة البث الحي؛ الافتراضي: `partial`؛ يتم تعيين `progress` إلى `partial`؛ و `block` للتوافق مع وضع المعاينة القديم). يستخدم بث المعاينة في Telegram رسالة معاينة واحدة يتم تعديلها في مكانها.
- `channels.telegram.mediaMaxMb`: الحد الأقصى لوسائط Telegram الواردة/الصادرة (MB، الافتراضي: 100).
- `channels.telegram.retry`: سياسة إعادة المحاولة لمساعدات إرسال Telegram (CLI/tools/actions) عند أخطاء API الصادرة القابلة للاسترداد (المحاولات، `minDelayMs`، `maxDelayMs`، `jitter`).
- `channels.telegram.network.autoSelectFamily`: تجاوز Node autoSelectFamily ‏(true=تمكين، false=تعطيل). يكون مفعّلًا افتراضيًا في Node 22+، مع تعطيله افتراضيًا في WSL2.
- `channels.telegram.network.dnsResultOrder`: تجاوز ترتيب نتائج DNS ‏(`ipv4first` أو `verbatim`). الافتراضي هو `ipv4first` في Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: تمكين خطِر لبيئات fake-IP الموثوقة أو proxy الشفاف حيث تحل تنزيلات وسائط Telegram `api.telegram.org` إلى عناوين خاصة/داخلية/خاصة بالاستخدامات الخاصة خارج سماح نطاق قياس RFC 2544 الافتراضي.
- `channels.telegram.proxy`: عنوان proxy لاستدعاءات Bot API ‏(SOCKS/HTTP).
- `channels.telegram.webhookUrl`: تمكين وضع Webhook ‏(يتطلب `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: سر Webhook ‏(مطلوب عند ضبط webhookUrl).
- `channels.telegram.webhookPath`: مسار Webhook المحلي (الافتراضي `/telegram-webhook`).
- `channels.telegram.webhookHost`: مضيف ربط Webhook المحلي (الافتراضي `127.0.0.1`).
- `channels.telegram.webhookPort`: منفذ ربط Webhook المحلي (الافتراضي `8787`).
- `channels.telegram.actions.reactions`: تقييد تفاعلات أدوات Telegram.
- `channels.telegram.actions.sendMessage`: تقييد إرسال رسائل أدوات Telegram.
- `channels.telegram.actions.deleteMessage`: تقييد حذف رسائل أدوات Telegram.
- `channels.telegram.actions.sticker`: تقييد إجراءات ملصقات Telegram — الإرسال والبحث (الافتراضي: false).
- `channels.telegram.reactionNotifications`: ‏`off | own | all` — التحكم في التفاعلات التي تطلق أحداث النظام (الافتراضي: `own` عند عدم الضبط).
- `channels.telegram.reactionLevel`: ‏`off | ack | minimal | extensive` — التحكم في قدرة الوكيل على التفاعل (الافتراضي: `minimal` عند عدم الضبط).
- `channels.telegram.errorPolicy`: ‏`reply | silent` — التحكم في سلوك ردود الأخطاء (الافتراضي: `reply`). التجاوزات لكل حساب/مجموعة/موضوع مدعومة.
- `channels.telegram.errorCooldownMs`: الحد الأدنى بالميلي ثانية بين ردود الأخطاء إلى الدردشة نفسها (الافتراضي: `60000`). يمنع سيل الأخطاء أثناء حالات الانقطاع.

- [مرجع الإعدادات - Telegram](/ar/gateway/configuration-reference#telegram)

حقول Telegram العالية الإشارة والمخصصة:

- البدء/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ ويتم رفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، و `bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات exec: `execApprovals`، `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- الخيوط/الردود: `replyToMode`
- البث: `streaming` (المعاينة)، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

## ذات صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
