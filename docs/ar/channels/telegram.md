---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم Telegram bot وإمكاناته وإعداداته
title: Telegram
x-i18n:
    generated_at: "2026-04-22T04:21:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

الحالة: جاهز للإنتاج للرسائل المباشرة + المجموعات عبر grammY. يُعد long polling هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الإقران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وخطط إصلاح.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط إعدادات القنوات الكاملة والأمثلة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ bot token في BotFather">
    افتح Telegram وابدأ محادثة مع **@BotFather** (تأكد أن المعرّف هو بالضبط `@BotFather`).

    شغّل `/newbot`، واتبع التعليمات، واحفظ token.

  </Step>

  <Step title="اضبط token وسياسة الرسائل المباشرة">

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

    البديل عبر env: ‏`TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`; بل اضبط token في config/env، ثم ابدأ Gateway.

  </Step>

  <Step title="ابدأ Gateway ووافق على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الإقران بعد ساعة واحدة.

  </Step>

  <Step title="أضف bot إلى مجموعة">
    أضف bot إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` ليتوافقا مع نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حل token يعتمد على الحساب. عمليًا، تفوز قيم config على البديل عبر env، وينطبق `TELEGRAM_BOT_TOKEN` على الحساب الافتراضي فقط.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعات">
    تستخدم bots في Telegram افتراضيًا **Privacy Mode**، ما يقيّد رسائل المجموعات التي تستقبلها.

    إذا كان يجب على bot رؤية جميع رسائل المجموعات، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل bot مشرفًا على المجموعة.

    عند تبديل وضع الخصوصية، أزل bot ثم أعد إضافته في كل مجموعة حتى يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    يتم التحكم في حالة المشرف من إعدادات مجموعة Telegram.

    تستقبل bots المشرفة جميع رسائل المجموعات، وهو ما يفيد في سلوك المجموعات الدائم.

  </Accordion>

  <Accordion title="خيارات BotFather المفيدة">

    - `/setjoingroups` للسماح/المنع من الإضافة إلى المجموعات
    - `/setprivacy` لسلوك رؤية المجموعات

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

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. وتُقبل البوادئ `telegram:` / `tg:` ويتم تطبيعها.
    يؤدي `dmPolicy: "allowlist"` مع `allowFrom` فارغة إلى حظر جميع الرسائل المباشرة ويتم رفضه عبر التحقق من صحة config.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا قمت بالترقية وكان config لديك يحتوي على إدخالات قائمة سماح بصيغة `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ ويتطلب Telegram bot token).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الإقران، فيمكن لـ `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات allowlist (على سبيل المثال عندما تكون `dmPolicy: "allowlist"` بلا معرّفات صريحة بعد).

    بالنسبة إلى bots ذات المالك الواحد، يُفضّل استخدام `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية وصريحة لإبقاء سياسة الوصول ثابتة في config (بدلًا من الاعتماد على موافقات الإقران السابقة).

    من حالات الالتباس الشائعة: موافقة إقران الرسائل المباشرة لا تعني "هذا المرسل مخوّل في كل مكان".
    يمنح الإقران الوصول إلى الرسائل المباشرة فقط. أما تفويض مرسلي المجموعات فما يزال يأتي من قوائم السماح الصريحة في config.
    إذا كنت تريد "أن أُخوَّل مرة واحدة وتعمل الرسائل المباشرة وأوامر المجموعات معًا"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    الطريقة الأكثر أمانًا (من دون bot تابع لجهة خارجية):

    1. أرسل رسالة مباشرة إلى bot.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة جهة خارجية (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    يُطبّق عنصران معًا:

    1. **أي المجموعات مسموح بها** (`channels.telegram.groups`)
       - لا يوجد config لـ `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات إلى `groups` (أو `"*"`)
       - عند إعداد `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المرسلين مسموح بهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. وإذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (ويتم تطبيع البوادئ `telegram:` / `tg:`).
    لا تضع معرّفات دردشات مجموعة أو supergroup في Telegram داخل `groupAllowFrom`. فمعرّفات الدردشة السالبة تنتمي تحت `channels.telegram.groups`.
    يتم تجاهل الإدخالات غير الرقمية في تفويض المرسل.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسلي المجموعات موافقات مخزن إقران الرسائل المباشرة.
    يظل الإقران للرسائل المباشرة فقط. أما للمجموعات، فاضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يتم ضبط `groupAllowFrom`، فسيعود Telegram إلى `allowFrom` في config، وليس إلى مخزن الإقران.
    النمط العملي لbots ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فسيكون الافتراضي وقت التشغيل هو `groupPolicy="allowlist"` بوضع إغلاق آمن ما لم يتم ضبط `channels.defaults.groupPolicy` صراحةً.

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

      - ضع معرّفات مجموعات أو supergroup السالبة في Telegram مثل `-1001234567890` تحت `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل bot.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى bot.
    </Warning>

  </Tab>

  <Tab title="سلوك الإشارات">
    تتطلب الردود في المجموعات إشارة بشكل افتراضي.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية `@botusername`، أو
    - أنماط الإشارات في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    أوامر تبديل على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    هذه الأوامر تحدّث حالة الجلسة فقط. استخدم config للاستمرارية.

    مثال config دائم:

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

- يملك Telegram عملية Gateway.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram مرة أخرى إلى Telegram (ولا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى غلاف القناة المشترك مع بيانات الرد الوصفية وعناصر media النائبة.
- يتم عزل جلسات المجموعات بحسب معرّف المجموعة. وتضيف مواضيع المنتدى اللاحقة `:topic:<threadId>` للحفاظ على عزل المواضيع.
- يمكن أن تحمل رسائل DM القيمة `message_thread_id`؛ ويقوم OpenClaw بتوجيهها باستخدام مفاتيح جلسة واعية بالخيوط ويحافظ على معرّف الخيط للردود.
- يستخدم long polling المشغّل grammY runner مع تسلسل لكل دردشة/لكل خيط. وتستخدم درجة التزامن الإجمالية لمصرف runner القيمة `agents.defaults.maxConcurrent`.
- يتم تشغيل إعادة تشغيل مراقب long polling بعد 120 ثانية دون اكتمال حيوية `getUpdates` بشكل افتراضي. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كانت بيئتك لا تزال تشهد إعادة تشغيل زائفة بسبب توقف الاستطلاع أثناء العمل الطويل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ كما أن تجاوزات كل حساب مدعومة.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث الحي (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الحقيقي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - يتم تعيين `progress` إلى `partial` على Telegram (للتوافق مع التسمية عبر القنوات)
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم ستعيد استخدام رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). اضبطه على `false` للاحتفاظ برسائل منفصلة للأدوات/التقدم.
    - يتم تعيين `channels.telegram.streamMode` القديم وقيم `streaming` المنطقية تلقائيًا

    بالنسبة إلى الردود النصية فقط:

    - DM: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)
    - المجموعة/الموضوع: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)

    بالنسبة إلى الردود المعقدة (مثل حمولات media)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    يختلف بث المعاينة عن block streaming. وعندما يتم تمكين block streaming صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    إذا كان نقل المسودة الأصلي غير متاح/مرفوضًا، يعود OpenClaw تلقائيًا إلى `sendMessage` + `editMessageText`.

    بث reasoning خاص بـ Telegram:

    - يقوم `/reasoning stream` بإرسال reasoning إلى المعاينة الحية أثناء التوليد
    - يتم إرسال الإجابة النهائية من دون نص reasoning

  </Accordion>

  <Accordion title="التنسيق والبديل HTML">
    يستخدم النص الصادر في Telegram القيمة `parse_mode: "HTML"`.

    - يتم تحويل النص الشبيه بـ Markdown إلى HTML آمن لـ Telegram.
    - يتم تهريب HTML الخام من النموذج لتقليل حالات فشل التحليل في Telegram.
    - إذا رفض Telegram HTML المحلّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    القيم الافتراضية للأوامر الأصلية:

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

    - يتم تطبيع الأسماء (إزالة `/` في البداية، وأحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - لا تزال أوامر Plugin/Skills تعمل عند كتابتها حتى لو لم تظهر في قائمة Telegram

    إذا تم تعطيل الأوامر الأصلية، تتم إزالة الأوامر المضمنة. وقد تستمر الأوامر المخصصة/أوامر Plugin في التسجيل إذا تم إعدادها.

    حالات الإعداد الفاشلة الشائعة:

    - يشير `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` إلى أن قائمة Telegram ما تزال ممتلئة بعد التقليص؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل `channels.telegram.commands.native`.
    - يشير `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً إلى أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (`device-pair` Plugin)

    عند تثبيت Plugin ‏`device-pair`:

    1. يقوم `/pair` بإنشاء رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يقوم `/pair pending` بعرض الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد bootstrap token قصير العمر. ويُبقي التسليم المضمن لـ bootstrap primary node token عند `scopes: []`؛ بينما يظل أي operator token تم تسليمه مقيّدًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. وتكون فحوصات نطاق bootstrap مسبوقة بالدور، لذا فإن قائمة سماح operator هذه لا تلبّي إلا طلبات operator؛ أما الأدوار غير operator فما تزال تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة مع تفاصيل auth متغيرة (مثلًا الدور/النطاقات/المفتاح العام)، فسيتم استبدال الطلب المعلق السابق وسيستخدم الطلب الجديد قيمة `requestId` مختلفة. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الإقران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    مثال على إجراء رسالة:

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

    - `sendMessage` ‏(`to`, `content`, اختياريًا `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` ‏(`chatId`, `messageId`, `emoji`)
    - `deleteMessage` ‏(`chatId`, `messageId`)
    - `editMessage` ‏(`chatId`, `messageId`, `content`)
    - `createForumTopic` ‏(`chatId`, `name`, واختياريًا `iconColor`, `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماءً مستعارة سهلة الاستخدام (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم في التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطل)

    ملاحظة: `edit` و`topic-create` مفعّلان افتراضيًا حاليًا ولا يملكان مفاتيح تبديل منفصلة تحت `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال وقت التشغيل اللقطة النشطة من config/secrets ‏(بدء التشغيل/إعادة التحميل)، لذا لا تنفذ مسارات الإجراءات إعادة حلّ مخصصة لـ SecretRef لكل عملية إرسال.

    دلالات إزالة التفاعلات: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم ترابط الردود">
    يدعم Telegram وسومًا صريحة لترابط الردود في المخرجات المُولدة:

    - `[[reply_to_current]]` للرد على الرسالة المُشغِّلة
    - `[[reply_to:<id>]]` للرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في طريقة المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    ملاحظة: يؤدي `off` إلى تعطيل ترابط الردود الضمني. أما الوسوم الصريحة `[[reply_to_*]]` فلا تزال تُحترم.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك الخيوط">
    Forum supergroups:

    - تضيف مفاتيح جلسات المواضيع اللاحقة `:topic:<threadId>`
    - تستهدف الردود والكتابة خيط الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    الحالة الخاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (لأن Telegram يرفض `sendMessage(...thread_id=1)`)
    - بينما تتضمن إجراءات الكتابة `message_thread_id` مع ذلك

    وراثة الموضوعات: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    يكون `agentId` خاصًا بالموضوع فقط ولا يرث من إعدادات المجموعة الافتراضية.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر ضبط `agentId` في config الخاص بالموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // الموضوع العام → الوكيل الرئيسي
                "3": { agentId: "zu" },        // موضوع التطوير → الوكيل zu
                "5": { agentId: "coder" }      // مراجعة الشيفرة → الوكيل coder
              }
            }
          }
        }
      }
    }
    ```

    يصبح لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط ACP دائم للموضوع**: يمكن لمواضيع المنتدى تثبيت جلسات ACP harness عبر ACP bindings مكتوبة على المستوى الأعلى:

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

    هذا النطاق محصور حاليًا بمواضيع المنتدى في المجموعات وsupergroups.

    **إنشاء ACP مرتبط بالخيط من الدردشة**:

    - يمكن للأمر `/acp spawn <agent> --thread here|auto` ربط موضوع Telegram الحالي بجلسة ACP جديدة.
    - يتم توجيه رسائل الموضوع اللاحقة مباشرة إلى جلسة ACP المرتبطة (من دون الحاجة إلى `/acp steer`).
    - يثبّت OpenClaw رسالة تأكيد الإنشاء داخل الموضوع بعد نجاح الربط.
    - يتطلب `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يتضمن سياق القالب:

    - `MessageThreadId`
    - `IsForum`

    سلوك خيوط الرسائل المباشرة:

    - تحتفظ الدردشات الخاصة التي تحتوي على `message_thread_id` بتوجيه الرسائل المباشرة، لكنها تستخدم مفاتيح جلسات/أهداف ردود واعية بالخيوط.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram بين voice notes وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - أضف الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كـ voice note

    مثال على إجراء رسالة:

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

    يميّز Telegram بين ملفات الفيديو وvideo notes.

    مثال على إجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    لا تدعم video notes التسميات التوضيحية؛ ويتم إرسال نص الرسالة المقدَّم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - ‏WEBP ثابت: يتم تنزيله ومعالجته (عنصر نائب `<media:sticker>`)
    - ‏TGS متحرك: يتم تخطيه
    - ‏WEBM فيديو: يتم تخطيه

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف ذاكرة التخزين المؤقت للملصقات:

    - `~/.openclaw/telegram/sticker-cache.json`

    يتم وصف الملصقات مرة واحدة (عندما يكون ذلك ممكنًا) وتخزينها مؤقتًا لتقليل مكالمات الرؤية المتكررة.

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

  <Accordion title="إشعارات التفاعلات">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند التفعيل، يضيف OpenClaw إلى قائمة الانتظار أحداث نظام مثل:

    - `تمت إضافة تفاعل Telegram: 👍 بواسطة Alice (@alice) على الرسالة 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: ‏`off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: ‏`off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدمين على الرسائل التي أرسلها bot فقط (بأفضل جهد عبر ذاكرة تخزين مؤقت للرسائل المرسلة).
    - لا تزال أحداث التفاعل تحترم عناصر التحكم في الوصول الخاصة بـ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)؛ ويتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفّر Telegram معرّفات خيوط في تحديثات التفاعل.
      - يتم توجيه المجموعات غير التابعة للمنتديات إلى جلسة دردشة المجموعة
      - يتم توجيه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`) وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` الخاصة بالاستطلاع/‏Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    ترسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - البديل إلى emoji هوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموز emoji يونيكود (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات config من أحداث Telegram وأوامره">
    تكون كتابات إعدادات القناة مفعلة افتراضيًا (`configWrites !== false`).

    تشمل الكتابات التي يطلقها Telegram ما يلي:

    - أحداث ترحيل المجموعات (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلب تمكين الأوامر)

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

  <Accordion title="Long polling مقابل Webhook">
    الافتراضي: long polling.

    وضع Webhook:

    - اضبط `channels.telegram.webhookUrl`
    - اضبط `channels.telegram.webhookSecret` (مطلوب عند ضبط عنوان Webhook)
    - اختياري: `channels.telegram.webhookPath` (الافتراضي `/telegram-webhook`)
    - اختياري: `channels.telegram.webhookHost` (الافتراضي `127.0.0.1`)
    - اختياري: `channels.telegram.webhookPort` (الافتراضي `8787`)

    يرتبط المستمع المحلي الافتراضي لوضع Webhook إلى `127.0.0.1:8787`.

    إذا كانت نقطة النهاية العامة لديك مختلفة، فضع reverse proxy أمامها ووجّه `webhookUrl` إلى عنوان URL العام.
    اضبط `webhookHost` (مثلًا `0.0.0.0`) عندما تحتاج عمدًا إلى دخول خارجي.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدّ `channels.telegram.mediaMaxMb` (الافتراضي 100) من حجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يتم ضبطه، تُطبَّق القيمة الافتراضية لـ grammY).
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ قم بالضبط بين `30000` و`600000` فقط لحالات إعادة تشغيل توقف الاستطلاع الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعات `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله القيمة `0`.
    - يتم تمرير سياق الرد/الاقتباس/إعادة التوجيه الإضافي حاليًا كما تم استلامه.
    - تتحكم قوائم سماح Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات الإرسال في Telegram ‏(CLI/tools/actions) لأخطاء Telegram API الصادرة القابلة للاسترداد.

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

    - `--poll-duration-seconds` ‏(5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لمواضيع المنتدى (أو استخدم هدفًا بصيغة `:topic:`)

    يدعم الإرسال في Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبّت عندما يتمكن bot من التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر مطالبات الموافقة في الدردشة أو الموضوع الأصلي.

    مسار config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (اختياري؛ ويعود إلى معرّفات المالك الرقمية المستنتجة من `allowFrom` و`defaultTo` المباشر عندما يكون ذلك ممكنًا)
    - `channels.telegram.execApprovals.target` ‏(`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`, `sessionFilter`

    يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية. يقوم Telegram بتمكين موافقات exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن حلّ موافق واحد على الأقل، إما من `execApprovals.approvers` أو من إعداد المالك الرقمي للحساب (`allowFrom` و`defaultTo` للرسائل المباشرة). اضبط `enabled: false` لتعطيل Telegram كعميل موافقة أصلي صراحةً. وإلا فستعود طلبات الموافقة إلى مسارات الموافقة الأخرى المضبوطة أو إلى سياسة fallback لموافقة exec.

    يعرض Telegram أيضًا أزرار الموافقة المشتركة المستخدمة من قِبل قنوات الدردشة الأخرى. يضيف محول Telegram الأصلي بشكل أساسي توجيه الرسائل المباشرة للموافقين، والتوزيع على القنوات/المواضيع، وتلميحات الكتابة قبل التسليم.
    وعندما تكون هذه الأزرار موجودة، فإنها تكون واجهة تجربة الموافقة الأساسية؛ ويجب على OpenClaw
    أن يتضمن أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى أن
    موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    قواعد التسليم:

    - `target: "dm"` يرسل مطالبات الموافقة فقط إلى الرسائل المباشرة للموافقين الذين تم حلهم
    - `target: "channel"` يرسل المطالبة مرة أخرى إلى دردشة/موضوع Telegram الأصلي
    - `target: "both"` يرسل إلى الرسائل المباشرة للموافقين وإلى الدردشة/الموضوع الأصلي

    لا يمكن إلا للموافقين الذين تم حلهم الموافقة أو الرفض. لا يمكن لغير الموافقين استخدام `/approve` ولا استخدام أزرار الموافقة في Telegram.

    سلوك حلّ الموافقة:

    - تُحلّ المعرّفات المسبوقة بـ `plugin:` دائمًا عبر موافقات Plugin.
    - تحاول معرّفات الموافقة الأخرى أولًا `exec.approval.resolve`.
    - إذا كان Telegram مخوّلًا أيضًا لموافقات Plugin وقال Gateway إن
      موافقة exec غير معروفة/منتهية الصلاحية، فسيعيد Telegram المحاولة مرة واحدة عبر
      `plugin.approval.resolve`.
    - لا تتراجع حالات رفض/أخطاء exec الحقيقية بصمت إلى حل
      موافقات Plugin.

    يُظهر التسليم عبر القناة نص الأمر في الدردشة، لذا فعّل `channel` أو `both` فقط في المجموعات/المواضيع الموثوقة. وعندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لكل من مطالبة الموافقة والمتابعة بعد الموافقة. تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تعتمد أزرار الموافقة المضمنة أيضًا على سماح `channels.telegram.capabilities.inlineButtons` بالواجهة المستهدفة (`dm` أو `group` أو `all`).

    الوثائق ذات الصلة: [موافقات exec](/ar/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأً في التسليم أو من المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا config في هذا السلوك:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | ترسل `reply` رسالة خطأ ودية إلى الدردشة. بينما تمنع `silent` ردود الأخطاء بالكامل. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع إغراق الأخطاء أثناء الانقطاعات. |

تتوفر تجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس الوراثة المستخدمة مع مفاتيح Telegram الأخرى في config).

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
  <Accordion title="الـ bot لا يستجيب لرسائل المجموعات التي لا تحتوي على إشارة">

    - إذا كانت `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram برؤية كاملة.
      - BotFather: ‏`/setprivacy` -> تعطيل
      - ثم أزل bot وأعد إضافته إلى المجموعة
    - يحذّر `openclaw channels status` عندما يتوقع config رسائل مجموعات من دون إشارة.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص العضوية عبر wildcard `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="الـ bot لا يرى رسائل المجموعات إطلاقًا">

    - عندما تكون `channels.telegram.groups` موجودة، يجب أن تكون المجموعة مدرجة (أو تتضمن `"*"`)
    - تحقّق من عضوية bot في المجموعة
    - راجع السجلات: `openclaw logs --follow` لأسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - خوّل هوية المرسل الخاصة بك (الإقران و/أو `allowFrom` الرقمي)
    - يظل تفويض الأوامر مطبقًا حتى عندما تكون سياسة المجموعات `open`
    - يشير `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` إلى أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - يشير `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً إلى مشكلات في قابلية الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - قد يؤدي Node 22+ مع `fetch`/proxy مخصص إلى سلوك إلغاء فوري إذا كانت أنواع AbortSignal غير متطابقة.
    - تقوم بعض المضيفات أولًا بحل `api.telegram.org` إلى IPv6؛ وقد يسبب خروج IPv6 المعطّل أعطالًا متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن المحاولة مع هذه الحالات كأخطاء شبكة قابلة للاسترداد.
    - إذا تضمنت السجلات `Polling stall detected`، فسيعيد OpenClaw تشغيل الاستطلاع وإعادة بناء ناقل Telegram بعد 120 ثانية من دون اكتمال حيوية long-poll افتراضيًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` الطويلة سليمة لكن مضيفك لا يزال يبلغ عن إعادة تشغيل زائفة بسبب توقف الاستطلاع. وتشير حالات التوقف المستمرة عادةً إلى مشكلات proxy أو DNS أو IPv6 أو TLS في الخروج بين المضيف و`api.telegram.org`.
    - على مضيفات VPS ذات الخروج المباشر/TLS غير المستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2) و`dnsResultOrder=ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل بشكل أفضل صراحةً مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إن إجابات نطاقات القياس RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيًا. وإذا كانت fake-IP موثوقة أو
      كان proxy شفاف يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/ذو استخدام خاص أثناء تنزيلات الوسائط، فيمكنك
      تمكين هذا التجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر التمكين نفسه لكل حساب أيضًا تحت
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطلة أولًا. إذ يسمح Telegram media بالفعل بنطاق RFC 2544
      القياسي افتراضيًا.

    <Warning>
      يُضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` حماية SSRF لوسائط Telegram.
      استخدمه فقط في بيئات proxy موثوقة يتحكم فيها المشغّل
      مثل Clash أو Mihomo أو توجيه fake-IP في Surge عندما
      تُولّد إجابات خاصة أو ذات استخدام خاص خارج نطاق القياس RFC 2544.
      اتركه معطلًا للوصول العادي إلى Telegram عبر الإنترنت العام.
    </Warning>

    - تجاوزات البيئة (مؤقتة):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - تحقّق من إجابات DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

مزيد من المساعدة: [استكشاف أخطاء القناة وإصلاحها](/ar/channels/troubleshooting).

## مؤشرات مرجع إعدادات Telegram

المرجع الأساسي:

- `channels.telegram.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.telegram.botToken`: ‏bot token ‏(BotFather).
- `channels.telegram.tokenFile`: قراءة token من مسار ملف عادي. يتم رفض symlinks.
- `channels.telegram.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.telegram.allowFrom`: قائمة سماح الرسائل المباشرة (معرّفات مستخدمي Telegram الرقمية). تتطلب `allowlist` معرّف مرسل واحدًا على الأقل. وتتطلب `open` القيمة `"*"`. يمكن لـ `openclaw doctor --fix` حل إدخالات `@username` القديمة إلى معرّفات، ويمكنه استعادة إدخالات قائمة السماح من ملفات مخزن الإقران في تدفقات ترحيل allowlist.
- `channels.telegram.actions.poll`: تمكين أو تعطيل إنشاء استطلاعات Telegram (الافتراضي: مفعّل؛ وما يزال يتطلب `sendMessage`).
- `channels.telegram.defaultTo`: هدف Telegram الافتراضي الذي يستخدمه CLI ‏`--deliver` عندما لا يتم توفير `--reply-to` صريح.
- `channels.telegram.groupPolicy`: ‏`open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.telegram.groupAllowFrom`: قائمة سماح مرسلي المجموعات (معرّفات مستخدمي Telegram الرقمية). يمكن لـ `openclaw doctor --fix` حل إدخالات `@username` القديمة إلى معرّفات. يتم تجاهل الإدخالات غير الرقمية وقت المصادقة. لا تستخدم مصادقة المجموعات بديل مخزن إقران الرسائل المباشرة (`2026.2.25+`).
- أولوية تعدد الحسابات:
  - عند إعداد معرّفي حسابين أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا.
  - إذا لم يتم ضبط أي منهما، يعود OpenClaw إلى أول معرّف حساب مُطبَّع ويصدر `openclaw doctor` تحذيرًا.
  - ينطبق `channels.telegram.accounts.default.allowFrom` و`channels.telegram.accounts.default.groupAllowFrom` على الحساب `default` فقط.
  - ترث الحسابات المسماة `channels.telegram.allowFrom` و`channels.telegram.groupAllowFrom` عندما لا تكون القيم على مستوى الحساب مضبوطة.
  - لا ترث الحسابات المسماة `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: الإعدادات الافتراضية لكل مجموعة + قائمة السماح (استخدم `"*"` للإعدادات الافتراضية العامة).
  - `channels.telegram.groups.<id>.groupPolicy`: تجاوز لكل مجموعة لـ groupPolicy ‏(`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: القيمة الافتراضية لتقييد الإشارات.
  - `channels.telegram.groups.<id>.skills`: عامل تصفية Skills ‏(الحذف = جميع Skills، والفارغ = لا شيء).
  - `channels.telegram.groups.<id>.allowFrom`: تجاوز قائمة سماح المرسلين لكل مجموعة.
  - `channels.telegram.groups.<id>.systemPrompt`: ‏system prompt إضافي للمجموعة.
  - `channels.telegram.groups.<id>.enabled`: تعطيل المجموعة عندما تكون `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: تجاوزات لكل موضوع (حقول المجموعة + `agentId` الخاص بالموضوع فقط).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: توجيه هذا الموضوع إلى وكيل محدد (يتجاوز التوجيه على مستوى المجموعة وbindings).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: تجاوز لكل موضوع لـ groupPolicy ‏(`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: تجاوز تقييد الإشارات لكل موضوع.
- المستوى الأعلى `bindings[]` مع `type: "acp"` ومعرّف الموضوع الأساسي `chatId:topic:topicId` في `match.peer.id`: حقول ربط ACP الدائم للموضوع (راجع [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: توجيه مواضيع الرسائل المباشرة إلى وكيل محدد (نفس سلوك مواضيع المنتدى).
- `channels.telegram.execApprovals.enabled`: تمكين Telegram كعميل موافقة exec قائم على الدردشة لهذا الحساب.
- `channels.telegram.execApprovals.approvers`: معرّفات مستخدمي Telegram المسموح لهم بالموافقة على طلبات exec أو رفضها. اختياري عندما يعرّف `channels.telegram.allowFrom` أو `channels.telegram.defaultTo` المباشر المالك بالفعل.
- `channels.telegram.execApprovals.target`: ‏`dm | channel | both` (الافتراضي: `dm`). يحافظ `channel` و`both` على موضوع Telegram الأصلي عند وجوده.
- `channels.telegram.execApprovals.agentFilter`: عامل تصفية اختياري لمعرّف الوكيل لمطالبات الموافقة المعاد توجيهها.
- `channels.telegram.execApprovals.sessionFilter`: عامل تصفية اختياري لمفتاح الجلسة (substring أو regex) لمطالبات الموافقة المعاد توجيهها.
- `channels.telegram.accounts.<account>.execApprovals`: تجاوز لكل حساب لتوجيه موافقة exec في Telegram وتفويض الموافقين.
- `channels.telegram.capabilities.inlineButtons`: ‏`off | dm | group | all | allowlist` (الافتراضي: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: تجاوز لكل حساب.
- `channels.telegram.commands.nativeSkills`: تمكين/تعطيل أوامر Skills الأصلية في Telegram.
- `channels.telegram.replyToMode`: ‏`off | first | all` (الافتراضي: `off`).
- `channels.telegram.textChunkLimit`: حجم القطعة الصادرة (أحرف).
- `channels.telegram.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.telegram.linkPreview`: تبديل معاينات الروابط للرسائل الصادرة (الافتراضي: true).
- `channels.telegram.streaming`: ‏`off | partial | block | progress` (معاينة البث الحي؛ الافتراضي: `partial`؛ يتم تعيين `progress` إلى `partial`؛ و`block` هو توافق وضع المعاينة القديم). يستخدم بث المعاينة في Telegram رسالة معاينة واحدة يتم تعديلها في مكانها.
- `channels.telegram.streaming.preview.toolProgress`: إعادة استخدام رسالة المعاينة الحية لتحديثات الأدوات/التقدم عندما يكون بث المعاينة نشطًا (الافتراضي: `true`). اضبطه على `false` للاحتفاظ برسائل منفصلة للأدوات/التقدم.
- `channels.telegram.mediaMaxMb`: الحد الأقصى لوسائط Telegram الواردة/الصادرة (MB، الافتراضي: 100).
- `channels.telegram.retry`: سياسة إعادة المحاولة لمساعدات الإرسال في Telegram ‏(CLI/tools/actions) عند أخطاء API الصادرة القابلة للاسترداد (المحاولات، minDelayMs، maxDelayMs، jitter).
- `channels.telegram.network.autoSelectFamily`: تجاوز Node ‏autoSelectFamily ‏(true=تمكين، false=تعطيل). يكون مفعّلًا افتراضيًا على Node 22+، بينما يكون WSL2 معطلًا افتراضيًا.
- `channels.telegram.network.dnsResultOrder`: تجاوز ترتيب نتائج DNS ‏(`ipv4first` أو `verbatim`). الافتراضي هو `ipv4first` على Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: تمكين خطير اختياري لبيئات fake-IP أو transparent-proxy الموثوقة حيث تحل تنزيلات وسائط Telegram العنوان `api.telegram.org` إلى عناوين خاصة/داخلية/ذات استخدام خاص خارج السماح الافتراضي لنطاق القياس RFC 2544.
- `channels.telegram.proxy`: عنوان proxy URL لاستدعاءات Bot API ‏(SOCKS/HTTP).
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
- `channels.telegram.errorPolicy`: ‏`reply | silent` — التحكم في سلوك رد الخطأ (الافتراضي: `reply`). تجاوزات لكل حساب/مجموعة/موضوع مدعومة.
- `channels.telegram.errorCooldownMs`: الحد الأدنى بالمللي ثانية بين ردود الأخطاء إلى الدردشة نفسها (الافتراضي: `60000`). يمنع إغراق الأخطاء أثناء الانقطاعات.

- [مرجع الإعدادات - Telegram](/ar/gateway/configuration-reference#telegram)

حقول Telegram عالية الإشارة والخاصة به:

- بدء التشغيل/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` ‏(`tokenFile` يجب أن يشير إلى ملف عادي؛ ويتم رفض symlinks)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، والمستوى الأعلى `bindings[]` ‏(`type: "acp"`)
- موافقات exec: ‏`execApprovals`، `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- الخيوط/الردود: `replyToMode`
- البث: `streaming` ‏(المعاينة)، `streaming.preview.toolProgress`، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- Webhook: ‏`webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

## ذو صلة

- [الإقران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
