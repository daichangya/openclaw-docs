---
read_when:
    - العمل على ميزات Telegram أو Webhookات
summary: حالة دعم بوت Telegram، والإمكانات، والإعدادات
title: Telegram
x-i18n:
    generated_at: "2026-04-21T17:45:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 816238b53942b319a300843db62ec1d4bf8d84bc11094010926ac9ad457c6d3d
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

الحالة: جاهز للإنتاج للرسائل الخاصة للبوت + المجموعات عبر grammY. يكون الاستطلاع الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل الخاصة الافتراضية لـ Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعدادات القناة الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وابدأ محادثة مع **@BotFather** (تأكد أن المعرّف هو بالضبط `@BotFather`).

    شغّل `/newbot`، واتبع المطالبات، واحفظ الرمز.

  </Step>

  <Step title="اضبط الرمز وسياسة الرسائل الخاصة">

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

    بديل env: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ اضبط الرمز في config/env، ثم شغّل Gateway.

  </Step>

  <Step title="شغّل Gateway ووافق على أول رسالة خاصة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="أضف البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و `groupPolicy` بما يتوافق مع نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حل الرمز يعتمد على الحساب. عمليًا، تفوز قيم config على بديل env، و`TELEGRAM_BOT_TOKEN` ينطبق فقط على الحساب الافتراضي.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعات">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، ما يقيّد الرسائل الجماعية التي تتلقاها.

    إذا كان يجب أن يرى البوت جميع رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا على المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أضِفه مجددًا في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    يتم التحكم في حالة المشرف من إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة جميع رسائل المجموعة، وهذا مفيد للسلوك الجماعي الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح تبديل مفيدة في BotFather">

    - `/setjoingroups` للسماح/المنع من الإضافة إلى المجموعات
    - `/setprivacy` لسلوك رؤية المجموعات

  </Accordion>
</AccordionGroup>

## التحكم بالوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب وجود معرّف مُرسل واحد على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. يتم قبول البادئتين `telegram:` / `tg:` وتطبيعهما.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` الفارغ جميع الرسائل الخاصة ويتم رفضه بواسطة التحقق من صحة config.
    يطلب الإعداد معرّفات مستخدم رقمية فقط.
    إذا قمت بالترقية وكان config لديك يحتوي على إدخالات قائمة سماح من نوع `@username`، فشغّل `openclaw doctor --fix` لحلّها (بأفضل جهد؛ ويتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة سماح متجر الاقتران، يمكن للأمر `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات allowlist (على سبيل المثال عندما يكون `dmPolicy: "allowlist"` بدون معرّفات صريحة حتى الآن).

    بالنسبة إلى البوتات ذات المالك الواحد، يُفضَّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على سياسة الوصول ثابتة في config (بدلاً من الاعتماد على موافقات الاقتران السابقة).

    التباس شائع: الموافقة على اقتران الرسائل الخاصة لا تعني "أن هذا المُرسل مصرّح له في كل مكان".
    يمنح الاقتران وصول الرسائل الخاصة فقط. أما تفويض مُرسل المجموعة فيأتي من قوائم السماح الصريحة في config.
    إذا كنت تريد "أن أكون مصرّحًا مرة واحدة وتعمل الرسائل الخاصة وأوامر المجموعة معًا"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    الطريقة الأكثر أمانًا (من دون بوت طرف ثالث):

    1. أرسل رسالة خاصة إلى البوت.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة طرف ثالث (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    يُطبَّق عنصرَا التحكم هذان معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - لا يوجد config لـ `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - عند ضبط `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المُرسلين مسموح لهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. إذا لم يتم ضبطه، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (وتُطبّع البادئتان `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعة Telegram أو supergroup في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة تحت `channels.telegram.groups`.
    يتم تجاهل الإدخالات غير الرقمية في تفويض المُرسلين.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مُرسل المجموعة موافقات متجر اقتران الرسائل الخاصة.
    يبقى الاقتران خاصًا بالرسائل الخاصة فقط. بالنسبة إلى المجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يتم ضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في config، وليس إلى متجر الاقتران.
    نمط عملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فإن الإعدادات الافتراضية وقت التشغيل تكون `groupPolicy="allowlist"` بشكل مغلق افتراضيًا ما لم يتم ضبط `channels.defaults.groupPolicy` صراحةً.

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
      خطأ شائع: `groupAllowFrom` ليس قائمة سماح لمجموعة Telegram.

      - ضع معرّفات مجموعات Telegram أو supergroup السالبة مثل `-1001234567890` تحت `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.
    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب الردود في المجموعات الإشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية `@botusername`، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه الأوامر حالة الجلسة فقط. استخدم config للاستمرارية.

    مثال إعداد دائم:

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
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبَّع الرسائل الواردة إلى غلاف القناة المشترك مع بيانات تعريف الرد وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. وتُلحق موضوعات المنتدى `:topic:<threadId>` للحفاظ على عزل الموضوعات.
- يمكن أن تحمل رسائل DM القيمة `message_thread_id`؛ ويقوم OpenClaw بتوجيهها باستخدام مفاتيح جلسة واعية بالخيوط ويحافظ على معرّف الخيط للردود.
- يستخدم الاستطلاع الطويل grammY runner مع تسلسل لكل دردشة/لكل خيط. ويستخدم تزامن sink الإجمالي في runner القيمة `agents.defaults.maxConcurrent`.
- تُفعَّل إعادة تشغيل مراقب الاستطلاع الطويل بعد 120 ثانية من دون اكتمال نشاط `getUpdates` افتراضيًا. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كانت بيئة النشر لديك لا تزال تشهد إعادات تشغيل خاطئة لتوقف الاستطلاع أثناء الأعمال الطويلة. القيمة بالميلي ثانية ومسموح بها من `30000` إلى `600000`؛ وتتوفر تجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - تكون `channels.telegram.streaming` هي `off | partial | block | progress` (الافتراضي: `partial`)
    - يتم تعيين `progress` إلى `partial` على Telegram (للتوافق مع التسمية متعددة القنوات)
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأداة/التقدم ستعيد استخدام رسالة المعاينة المعدّلة نفسها (الافتراضي: `true`). اضبطها إلى `false` للاحتفاظ برسائل أداة/تقدم منفصلة.
    - يتم تعيين `channels.telegram.streamMode` القديم وقيم `streaming` المنطقية تلقائيًا

    بالنسبة إلى الردود النصية فقط:

    - DM: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)
    - المجموعة/الموضوع: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)

    بالنسبة إلى الردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظّف رسالة المعاينة.

    بث المعاينة منفصل عن block streaming. عند تمكين block streaming صراحةً لـ Telegram، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

    إذا كان نقل المسودة الأصلي غير متاح/تم رفضه، يعود OpenClaw تلقائيًا إلى `sendMessage` + `editMessageText`.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة المباشرة أثناء التوليد
    - يُرسَل الجواب النهائي من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع إلى HTML">
    يستخدم النص الصادر في Telegram القيمة `parse_mode: "HTML"`.

    - يُعرَض النص الشبيه بـ Markdown بصيغة HTML آمنة لـ Telegram.
    - يتم تهريب HTML الخام من النموذج لتقليل إخفاقات تحليل Telegram.
    - إذا رفض Telegram HTML المحلَّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعّلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    الإعدادات الافتراضية للأوامر الأصلية:

    - `commands.native: "auto"` يمكّن الأوامر الأصلية لـ Telegram

    أضف إدخالات مخصصة إلى قائمة الأوامر:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "نسخ احتياطي لـ Git" },
        { command: "generate", description: "إنشاء صورة" },
      ],
    },
  },
}
```

    القواعد:

    - تُطبَّع الأسماء (إزالة `/` البادئة، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفّذ السلوك تلقائيًا
    - لا تزال أوامر Plugin/Skills تعمل عند كتابتها حتى إن لم تظهر في قائمة Telegram

    إذا تم تعطيل الأوامر الأصلية، فستُزال الأوامر المضمنة. وقد تظل أوامر Plugin/المخصصة تُسجَّل إذا تم إعدادها.

    حالات فشل الإعداد الشائعة:

    - تعني رسالة `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما تزال ممتلئة أكثر من اللازم بعد التقليص؛ قلّل أوامر Plugin/Skills/المخصصة أو عطّل `channels.telegram.commands.native`.
    - تعني رسالة `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً أن اتصال DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر اقتران الجهاز (`device-pair` Plugin)

    عند تثبيت Plugin ‏`device-pair`:

    1. يولّد `/pair` رمز الإعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يوجد طلب معلق واحد فقط
       - `/pair approve latest` لأحدث طلب

    يحمل رمز الإعداد رمز bootstrap قصير العمر. يُبقي تسليم bootstrap المضمّن رمز الـ Node الأساسي عند `scopes: []`؛ وأي رمز operator تم تسليمه يبقى محصورًا في `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق bootstrap مسبوقة بالدور، لذا فإن قائمة سماح operator هذه لا تلبّي إلا طلبات operator؛ أما الأدوار غير operator فما تزال تحتاج إلى نطاقات تحت بادئة الدور الخاصة بها.

    إذا أعاد جهاز ما المحاولة مع تفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، فسيتم استبدال الطلب المعلق السابق وسيستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الاقتران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمّنة">
    اضبط نطاق لوحة المفاتيح المضمّنة:

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
  message: "اختر خيارًا:",
  buttons: [
    [
      { text: "نعم", callback_data: "yes" },
      { text: "لا", callback_data: "no" },
    ],
    [{ text: "إلغاء", callback_data: "cancel" }],
  ],
}
```

    يتم تمرير نقرات callback إلى العامل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للعوامل والأتمتة">
    تتضمن إجراءات أداة Telegram ما يلي:

    - `sendMessage` (`to`, `content`, واختياريًا `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, واختياريًا `iconColor`, `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماءً مستعارة مريحة (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم في التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطّل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم عمليات الإرسال وقت التشغيل اللقطة النشطة لـ config/secrets (بدء التشغيل/إعادة التحميل)، لذا لا تنفّذ مسارات الإجراءات إعادة تحليل `SecretRef` مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم خيوط الرد">
    يدعم Telegram وسوم خيوط الرد الصريحة في المخرجات المُولَّدة:

    - `[[reply_to_current]]` يرد على الرسالة المُشغِّلة
    - `[[reply_to:<id>]]` يرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في طريقة المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    ملاحظة: يعطّل `off` خيوط الرد الضمنية. وما تزال وسوم `[[reply_to_*]]` الصريحة مُحترمة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك الخيوط">
    مجموعات المنتدى الفائقة:

    - تُلحَق مفاتيح جلسات الموضوع بـ `:topic:<threadId>`
    - تستهدف الردود وإجراءات الكتابة خيط الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    الحالة الخاصة للموضوع العام (`threadId=1`):

    - تُرسِل الرسائل بدون `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - ما تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوعات: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من الإعدادات الافتراضية للمجموعة.

    **توجيه العامل لكل موضوع**: يمكن لكل موضوع التوجيه إلى عامل مختلف عبر ضبط `agentId` في إعدادات الموضوع. يمنح ذلك كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // الموضوع العام → العامل main
                "3": { agentId: "zu" },        // موضوع التطوير → العامل zu
                "5": { agentId: "coder" }      // مراجعة الشيفرة → العامل coder
              }
            }
          }
        }
      }
    }
    ```

    يصبح لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط ACP دائم للموضوع**: يمكن لموضوعات المنتدى تثبيت جلسات ACP harness عبر روابط ACP مكتوبة من المستوى الأعلى:

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

    هذا النطاق يقتصر حاليًا على موضوعات المنتدى في المجموعات والمجموعات الفائقة.

    **إنشاء ACP مرتبط بالخيط من الدردشة**:

    - يمكن للأمر `/acp spawn <agent> --thread here|auto` ربط موضوع Telegram الحالي بجلسة ACP جديدة.
    - تُوجَّه رسائل الموضوع اللاحقة مباشرةً إلى جلسة ACP المرتبطة (من دون الحاجة إلى `/acp steer`).
    - يثبّت OpenClaw رسالة تأكيد الإنشاء داخل الموضوع بعد نجاح الربط.
    - يتطلب `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يتضمن سياق القالب:

    - `MessageThreadId`
    - `IsForum`

    سلوك خيط DM:

    - تحافظ الدردشات الخاصة التي تحتوي على `message_thread_id` على توجيه DM لكنها تستخدم مفاتيح جلسة وأهداف رد واعية بالخيوط.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد العامل لفرض الإرسال كملاحظة صوتية

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

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ ويُرسَل نص الرسالة المقدَّم بشكل منفصل.

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

    عند التمكين، يضع OpenClaw في قائمة الانتظار أحداث نظام مثل:

    - `تمت إضافة تفاعل Telegram: 👍 بواسطة Alice (@alice) على الرسالة 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: ‏`off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: ‏`off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدم على الرسائل التي أرسلها البوت فقط (بأفضل جهد عبر ذاكرة التخزين المؤقت للرسائل المرسلة).
    - ما تزال أحداث التفاعل تحترم عناصر التحكم في الوصول في Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ ويتم إسقاط المُرسلين غير المصرّح لهم.
    - لا يوفّر Telegram معرّفات الخيوط في تحديثات التفاعل.
      - المجموعات غير المنتدى تُوجَّه إلى جلسة دردشة المجموعة
      - مجموعات المنتدى تُوجَّه إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` للاستطلاع/Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات التأكيد">
    يرسل `ackReaction` رمزًا تعبيريًا للتأكيد بينما يعالج OpenClaw رسالة واردة.

    ترتيب التحليل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بديل الرمز التعبيري لهوية العامل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموز emoji موحدة (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات config من أحداث Telegram وأوامره">
    تكون كتابات config الخاصة بالقناة مفعلة افتراضيًا (`configWrites !== false`).

    تتضمن الكتابات التي يطلقها Telegram ما يلي:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
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

  <Accordion title="الاستطلاع الطويل مقابل Webhook">
    الافتراضي: الاستطلاع الطويل.

    وضع Webhook:

    - اضبط `channels.telegram.webhookUrl`
    - اضبط `channels.telegram.webhookSecret` (مطلوب عند ضبط عنوان Webhook)
    - `channels.telegram.webhookPath` اختياري (الافتراضي `/telegram-webhook`)
    - `channels.telegram.webhookHost` اختياري (الافتراضي `127.0.0.1`)
    - `channels.telegram.webhookPort` اختياري (الافتراضي `8787`)

    يرتبط المستمع المحلي الافتراضي لوضع Webhook بالعنوان `127.0.0.1:8787`.

    إذا كانت نقطة النهاية العامة لديك مختلفة، فضع reverse proxy أمامها ووجّه `webhookUrl` إلى عنوان URL العام.
    اضبط `webhookHost` (على سبيل المثال `0.0.0.0`) عندما تحتاج عمدًا إلى ingress خارجي.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدد `channels.telegram.mediaMaxMb` (الافتراضي 100) الحد الأقصى لحجم وسائط Telegram الواردة والصادرة.
    - يجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يتم ضبطه، تُطبَّق القيمة الافتراضية لـ grammY).
    - تكون القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل توقف الاستطلاع الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتقوم القيمة `0` بالتعطيل.
    - يتم حاليًا تمرير سياق الرد/الاقتباس/إعادة التوجيه الإضافي كما تم استلامه.
    - تتحكم قوائم السماح في Telegram أساسًا في من يمكنه تشغيل العامل، وليست حدًا كاملًا لتنقيح السياق الإضافي.
    - عناصر التحكم في سجل DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق config الخاص بـ `channels.telegram.retry` على مساعدات إرسال Telegram ‏(CLI/tools/actions) لأخطاء API الصادرة القابلة للاسترداد.

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

    خيارات الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` ‏(5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتدى (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--buttons` للوحات المفاتيح المضمّنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من تحميلات الصور المضغوطة أو الوسائط المتحركة

    تقييد الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل الخاصة الخاصة بالموافقين، ويمكنه اختياريًا نشر مطالبات الموافقة في الدردشة أو الموضوع الأصلي.

    مسار config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (اختياري؛ يعود إلى معرّفات المالك الرقمية المستنتجة من `allowFrom` و`defaultTo` المباشر عند الإمكان)
    - `channels.telegram.execApprovals.target` ‏(`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`

    يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية. يفعّل Telegram تلقائيًا موافقات exec الأصلية عندما تكون `enabled` غير مضبوطة أو `"auto"` ويوجد على الأقل موافق واحد يمكن حله، إما من `execApprovals.approvers` أو من config المالك الرقمي للحساب (`allowFrom` و`defaultTo` للرسائل المباشرة). اضبط `enabled: false` لتعطيل Telegram كعميل موافقة أصلي بشكل صريح. بخلاف ذلك، تعود طلبات الموافقة إلى مسارات الموافقة الأخرى المضبوطة أو إلى سياسة fallback الخاصة بموافقة exec.

    يعرض Telegram أيضًا أزرار الموافقة المشتركة المستخدمة من قنوات الدردشة الأخرى. ويضيف مهايئ Telegram الأصلي أساسًا توجيه الرسائل الخاصة للموافقين، وتوزيع القناة/الموضوع، وتلميحات الكتابة قبل التسليم.
    عندما تكون هذه الأزرار موجودة، فإنها تمثل تجربة المستخدم الأساسية للموافقة؛ ويجب على OpenClaw
    أن يضمّن أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    قواعد التسليم:

    - يرسل `target: "dm"` مطالبات الموافقة إلى الرسائل الخاصة للموافقين المحلولين فقط
    - يرسل `target: "channel"` المطالبة مرة أخرى إلى دردشة/موضوع Telegram الأصلي
    - يرسل `target: "both"` إلى الرسائل الخاصة للموافقين وإلى الدردشة/الموضوع الأصلي

    لا يمكن إلا للموافقين المحلولين الموافقة أو الرفض. لا يمكن لغير الموافقين استخدام `/approve` ولا استخدام أزرار الموافقة في Telegram.

    سلوك حل الموافقة:

    - يتم دائمًا حل المعرّفات التي تبدأ بـ `plugin:` عبر موافقات Plugin.
    - تحاول معرّفات الموافقة الأخرى أولًا `exec.approval.resolve`.
    - إذا كان Telegram مصرّحًا أيضًا لموافقات Plugin وأشارت Gateway إلى
      أن موافقة exec غير معروفة/منتهية الصلاحية، فإن Telegram يعيد المحاولة مرة واحدة عبر
      `plugin.approval.resolve`.
    - لا تنتقل حالات الرفض/الأخطاء الحقيقية في موافقة exec بصمت إلى حل
      موافقة Plugin.

    يُظهر تسليم القناة نص الأمر في الدردشة، لذا لا تفعّل `channel` أو `both` إلا في المجموعات/الموضوعات الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لكل من مطالبة الموافقة والمتابعة بعد الموافقة. تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تعتمد أزرار الموافقة المضمّنة أيضًا على سماح `channels.telegram.capabilities.inlineButtons` بالسطح المستهدف (`dm` أو `group` أو `all`).

    وثائق ذات صلة: [موافقات Exec](/ar/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه العامل خطأ في التسليم أو المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا config في هذا السلوك:

| المفتاح                                 | القيم             | الافتراضي | الوصف                                                                                         |
| ----------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | يرسل `reply` رسالة خطأ ودية إلى الدردشة. ويكتم `silent` ردود الأخطاء بالكامل. |
| `channels.telegram.errorCooldownMs` | رقم (ms)       | `60000` | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع سيل رسائل الأخطاء أثناء الانقطاعات.        |

تتوفر تجاوزات لكل حساب ولكل مجموعة ولكل موضوع (بنفس الوراثة الخاصة بمفاتيح config الأخرى في Telegram).

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
  <Accordion title="البوت لا يستجيب لرسائل المجموعة التي لا تحتوي على إشارة">

    - إذا كانت `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة.
      - BotFather: ‏`/setprivacy` -> تعطيل
      - ثم أزل البوت وأعد إضافته إلى المجموعة
    - يحذّر `openclaw channels status` عندما يتوقع config رسائل مجموعة غير مذكور فيها البوت.
    - يمكن للأمر `openclaw channels status --probe` التحقق من معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص العضوية للرمز العام `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة مطلقًا">

    - عندما يكون `channels.telegram.groups` موجودًا، يجب أن تكون المجموعة مُدرجة (أو تتضمن `"*"`)
    - تحقّق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لأسباب التجاوز

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل مطلقًا">

    - صرّح لهوية المُرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - ما يزال تفويض الأوامر يُطبَّق حتى عندما تكون سياسة المجموعة `open`
    - تعني رسالة `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/المخصصة أو عطّل القوائم الأصلية
    - تشير رسالة `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً إلى مشكلات في الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - يمكن أن يتسبب Node 22+ + fetch/proxy مخصص في سلوك إلغاء فوري إذا لم تتطابق أنواع AbortSignal.
    - تقوم بعض المضيفات بحل `api.telegram.org` إلى IPv6 أولًا؛ وقد يؤدي خروج IPv6 المعطّل إلى أعطال متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الحالات كأخطاء شبكة قابلة للاسترداد.
    - إذا تضمنت السجلات `Polling stall detected`، فإن OpenClaw يعيد تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية من دون اكتمال نشاط الاستطلاع الطويل افتراضيًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` الطويلة سليمة لكن المضيف ما يزال يبلغ عن إعادات تشغيل خاطئة لتوقف الاستطلاع. تشير حالات التوقف المستمرة عادةً إلى مشكلات في proxy أو DNS أو IPv6 أو TLS الصادر بين المضيف و`api.telegram.org`.
    - على مضيفات VPS ذات الخروج المباشر/TLS غير المستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2) و`dnsResultOrder=ipv4first`.
    - إذا كان مضيفك هو WSL2 أو كان يعمل بشكل أفضل صراحةً بسلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إن إجابات نطاق اختبارات RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      افتراضيًا لتنزيلات وسائط Telegram. إذا كان fake-IP موثوق أو
      transparent proxy يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/ذو استخدام خاص أثناء تنزيلات الوسائط، فيمكنك تفعيل
      تجاوز Telegram-only:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر التفعيل نفسه لكل حساب في
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطّلة أولًا. إذ إن وسائط Telegram تسمح بالفعل بنطاق
      اختبارات RFC 2544 افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` حماية SSRF
      الخاصة بوسائط Telegram. استخدمه فقط مع بيئات proxy موثوقة يسيطر عليها المشغّل
      مثل Clash أو Mihomo أو Surge fake-IP routing عندما تقوم
      بتركيب إجابات خاصة أو ذات استخدام خاص خارج نطاق اختبارات RFC 2544.
      اتركه معطّلًا لوصول Telegram العادي عبر الإنترنت العام.
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

## مؤشرات مرجع config الخاصة بـ Telegram

المرجع الأساسي:

- `channels.telegram.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.telegram.botToken`: رمز البوت (BotFather).
- `channels.telegram.tokenFile`: قراءة الرمز من مسار ملف عادي. تُرفض الروابط الرمزية.
- `channels.telegram.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.telegram.allowFrom`: قائمة سماح DM (معرّفات مستخدمي Telegram رقمية). يتطلب `allowlist` وجود معرّف مُرسل واحد على الأقل. ويتطلب `open` القيمة `"*"`. يمكن للأمر `openclaw doctor --fix` حل إدخالات `@username` القديمة إلى معرّفات، ويمكنه استعادة إدخالات قائمة السماح من ملفات متجر الاقتران في تدفقات ترحيل allowlist.
- `channels.telegram.actions.poll`: تمكين أو تعطيل إنشاء استطلاعات Telegram (الافتراضي: مفعّل؛ وما يزال يتطلب `sendMessage`).
- `channels.telegram.defaultTo`: هدف Telegram الافتراضي الذي يستخدمه CLI مع `--deliver` عندما لا يتم توفير `--reply-to` صريح.
- `channels.telegram.groupPolicy`: ‏`open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.telegram.groupAllowFrom`: قائمة سماح مُرسلي المجموعات (معرّفات مستخدمي Telegram رقمية). يمكن للأمر `openclaw doctor --fix` حل إدخالات `@username` القديمة إلى معرّفات. يتم تجاهل الإدخالات غير الرقمية وقت التفويض. لا يستخدم تفويض المجموعات fallback لمتجر اقتران DM ‏(`2026.2.25+`).
- أسبقية الحسابات المتعددة:
  - عند ضبط معرّفي حسابين أو أكثر، اضبط `channels.telegram.defaultAccount` (أو أدرج `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا.
  - إذا لم يتم ضبط أي منهما، يعود OpenClaw إلى أول معرّف حساب مطبّع ويصدر `openclaw doctor` تحذيرًا.
  - ينطبق `channels.telegram.accounts.default.allowFrom` و`channels.telegram.accounts.default.groupAllowFrom` على الحساب `default` فقط.
  - ترث الحسابات المسماة `channels.telegram.allowFrom` و`channels.telegram.groupAllowFrom` عندما لا يتم ضبط القيم على مستوى الحساب.
  - لا ترث الحسابات المسماة `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: الإعدادات الافتراضية لكل مجموعة + قائمة السماح (استخدم `"*"` للإعدادات الافتراضية العامة).
  - `channels.telegram.groups.<id>.groupPolicy`: تجاوز لكل مجموعة لـ groupPolicy ‏(`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: الإعداد الافتراضي لتقييد الإشارة.
  - `channels.telegram.groups.<id>.skills`: مرشح Skills ‏(الحذف = كل Skills، الفارغ = لا شيء).
  - `channels.telegram.groups.<id>.allowFrom`: تجاوز قائمة سماح المُرسلين لكل مجموعة.
  - `channels.telegram.groups.<id>.systemPrompt`: system prompt إضافي للمجموعة.
  - `channels.telegram.groups.<id>.enabled`: تعطيل المجموعة عندما تكون `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: تجاوزات لكل موضوع (حقول المجموعة + `agentId` الخاص بالموضوع فقط).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: توجيه هذا الموضوع إلى عامل محدد (يتجاوز التوجيه على مستوى المجموعة والربط).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: تجاوز لكل موضوع لـ groupPolicy ‏(`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: تجاوز تقييد الإشارة لكل موضوع.
- `bindings[]` على المستوى الأعلى مع `type: "acp"` ومعرّف الموضوع القياسي `chatId:topic:topicId` في `match.peer.id`: حقول ربط موضوع ACP الدائم (انظر [عوامل ACP](/ar/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: توجيه موضوعات DM إلى عامل محدد (السلوك نفسه لموضوعات المنتدى).
- `channels.telegram.execApprovals.enabled`: تمكين Telegram كعميل موافقة exec قائم على الدردشة لهذا الحساب.
- `channels.telegram.execApprovals.approvers`: معرّفات مستخدمي Telegram المسموح لهم بالموافقة على طلبات exec أو رفضها. اختياري عندما يكون `channels.telegram.allowFrom` أو `channels.telegram.defaultTo` المباشر يحددان المالك بالفعل.
- `channels.telegram.execApprovals.target`: ‏`dm | channel | both` (الافتراضي: `dm`). يحافظ `channel` و`both` على موضوع Telegram الأصلي عند وجوده.
- `channels.telegram.execApprovals.agentFilter`: مرشح اختياري لمعرّف العامل لمطالبات الموافقة المُعاد توجيهها.
- `channels.telegram.execApprovals.sessionFilter`: مرشح اختياري لمفتاح الجلسة (سلسلة جزئية أو regex) لمطالبات الموافقة المُعاد توجيهها.
- `channels.telegram.accounts.<account>.execApprovals`: تجاوز لكل حساب لتوجيه موافقات exec في Telegram وتفويض الموافقين.
- `channels.telegram.capabilities.inlineButtons`: ‏`off | dm | group | all | allowlist` (الافتراضي: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: تجاوز لكل حساب.
- `channels.telegram.commands.nativeSkills`: تمكين/تعطيل أوامر Skills الأصلية في Telegram.
- `channels.telegram.replyToMode`: ‏`off | first | all` (الافتراضي: `off`).
- `channels.telegram.textChunkLimit`: حجم الأجزاء الصادرة (أحرف).
- `channels.telegram.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.telegram.linkPreview`: تبديل معاينات الروابط للرسائل الصادرة (الافتراضي: true).
- `channels.telegram.streaming`: ‏`off | partial | block | progress` (معاينة بث مباشر؛ الافتراضي: `partial`؛ يتم تعيين `progress` إلى `partial`؛ و`block` هو توافق وضع المعاينة القديم). يستخدم بث المعاينة في Telegram رسالة معاينة واحدة تُعدَّل في مكانها.
- `channels.telegram.streaming.preview.toolProgress`: إعادة استخدام رسالة المعاينة المباشرة لتحديثات الأداة/التقدم عندما يكون بث المعاينة نشطًا (الافتراضي: `true`). اضبطها إلى `false` للاحتفاظ برسائل أداة/تقدم منفصلة.
- `channels.telegram.mediaMaxMb`: الحد الأقصى لوسائط Telegram الواردة/الصادرة (MB، الافتراضي: 100).
- `channels.telegram.retry`: سياسة إعادة المحاولة لمساعدات إرسال Telegram ‏(CLI/tools/actions) عند أخطاء API الصادرة القابلة للاسترداد (attempts وminDelayMs وmaxDelayMs وjitter).
- `channels.telegram.network.autoSelectFamily`: تجاوز Node autoSelectFamily ‏(true=تمكين، false=تعطيل). يكون مفعّلًا افتراضيًا في Node 22+، مع كون WSL2 معطّلًا افتراضيًا.
- `channels.telegram.network.dnsResultOrder`: تجاوز ترتيب نتائج DNS ‏(`ipv4first` أو `verbatim`). الافتراضي هو `ipv4first` في Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: تفعيل خطير اختياري لبيئات fake-IP الموثوقة أو transparent-proxy حيث تقوم تنزيلات وسائط Telegram بحل `api.telegram.org` إلى عناوين خاصة/داخلية/ذات استخدام خاص خارج السماح الافتراضي لنطاق اختبارات RFC 2544.
- `channels.telegram.proxy`: عنوان URL لـ proxy لاستدعاءات Bot API ‏(SOCKS/HTTP).
- `channels.telegram.webhookUrl`: تمكين وضع Webhook (يتطلب `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: سر Webhook ‏(مطلوب عند ضبط webhookUrl).
- `channels.telegram.webhookPath`: مسار Webhook المحلي (الافتراضي `/telegram-webhook`).
- `channels.telegram.webhookHost`: مضيف ربط Webhook المحلي (الافتراضي `127.0.0.1`).
- `channels.telegram.webhookPort`: منفذ ربط Webhook المحلي (الافتراضي `8787`).
- `channels.telegram.actions.reactions`: تقييد تفاعلات أداة Telegram.
- `channels.telegram.actions.sendMessage`: تقييد إرسال رسائل أداة Telegram.
- `channels.telegram.actions.deleteMessage`: تقييد حذف رسائل أداة Telegram.
- `channels.telegram.actions.sticker`: تقييد إجراءات ملصقات Telegram — الإرسال والبحث (الافتراضي: false).
- `channels.telegram.reactionNotifications`: ‏`off | own | all` — التحكم في التفاعلات التي تطلق أحداث النظام (الافتراضي: `own` عند عدم الضبط).
- `channels.telegram.reactionLevel`: ‏`off | ack | minimal | extensive` — التحكم في قدرة العامل على التفاعل (الافتراضي: `minimal` عند عدم الضبط).
- `channels.telegram.errorPolicy`: ‏`reply | silent` — التحكم في سلوك ردود الأخطاء (الافتراضي: `reply`). تتوفر تجاوزات لكل حساب/مجموعة/موضوع.
- `channels.telegram.errorCooldownMs`: الحد الأدنى بالميلي ثانية بين ردود الأخطاء إلى الدردشة نفسها (الافتراضي: `60000`). يمنع سيل رسائل الأخطاء أثناء الانقطاعات.

- [مرجع الإعدادات - Telegram](/ar/gateway/configuration-reference#telegram)

حقول Telegram الخاصة عالية الإشارة:

- بدء التشغيل/المصادقة: `enabled` و`botToken` و`tokenFile` و`accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ وتُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom` و`groups` و`groups.*.topics.*` و`bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات exec: ‏`execApprovals` و`accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native` و`commands.nativeSkills` و`customCommands`
- الخيوط/الردود: `replyToMode`
- البث: `streaming` (المعاينة) و`streaming.preview.toolProgress` و`blockStreaming`
- التنسيق/التسليم: `textChunkLimit` و`chunkMode` و`linkPreview` و`responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb` و`timeoutSeconds` و`pollingStallThresholdMs` و`retry` و`network.autoSelectFamily` و`network.dangerouslyAllowPrivateNetwork` و`proxy`
- Webhook: ‏`webhookUrl` و`webhookSecret` و`webhookPath` و`webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons` و`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications` و`reactionLevel`
- الأخطاء: `errorPolicy` و`errorCooldownMs`
- الكتابات/السجل: `configWrites` و`historyLimit` و`dmHistoryLimit` و`dms.*.historyLimit`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد العوامل](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
