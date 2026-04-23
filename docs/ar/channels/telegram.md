---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم بوت Telegram، والإمكانات، والإعدادات
title: Telegram
x-i18n:
    generated_at: "2026-04-23T13:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

الحالة: جاهز للإنتاج للرسائل الخاصة للبوت + المجموعات عبر grammY. يُعد الاستطلاع الطويل الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل الخاصة الافتراضية لـ Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وإجراءات إصلاح.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعدادات القناة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وابدأ محادثة مع **@BotFather** (تأكد أن المعرّف هو `@BotFather` تمامًا).

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

    بديل متغير البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`; اضبط الرمز في config/env، ثم شغّل Gateway.

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
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يتوافق مع نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حل الرمز يراعي الحساب. عمليًا، قيم config تتقدم على بديل env، و`TELEGRAM_BOT_TOKEN` ينطبق فقط على الحساب الافتراضي.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، ما يحد من الرسائل الجماعية التي تستقبلها.

    إذا كان يجب على البوت رؤية كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا على المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة لكي يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة جميع رسائل المجموعة، وهذا مفيد للسلوك الجماعي الدائم.

  </Accordion>

  <Accordion title="خيارات مفيدة في BotFather">

    - `/setjoingroups` للسماح/منع الإضافة إلى المجموعات
    - `/setprivacy` لسلوك الرؤية داخل المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب وجود معرّف مُرسِل واحد على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram رقمية. وتُقبل البادئتان `telegram:` / `tg:` وتُطبّعان.
    يؤدي `dmPolicy: "allowlist"` مع `allowFrom` فارغ إلى حظر كل الرسائل الخاصة، ويتم رفضه من خلال التحقق من صحة config.
    يطلب الإعداد معرّفات مستخدم رقمية فقط.
    إذا قمت بالترقية وكان config لديك يحتوي على إدخالات allowlist من نوع `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ ويتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات allowlist الخاصة بمخزن الاقتران، فيمكن للأمر `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات allowlist (على سبيل المثال عندما لا يحتوي `dmPolicy: "allowlist"` بعد على معرّفات صريحة).

    بالنسبة إلى البوتات ذات المالك الواحد، يُفضّل استخدام `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على سياسة الوصول بشكل دائم داخل config (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    التباس شائع: الموافقة على اقتران الرسائل الخاصة لا تعني أن "هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران الوصول إلى الرسائل الخاصة فقط. أما تخويل المرسل داخل المجموعات فيأتي من قوائم السماح الصريحة في config.
    إذا كنت تريد "أن أكون مخوّلًا مرة واحدة وتعمل كل من الرسائل الخاصة وأوامر المجموعات"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    طريقة أكثر أمانًا (من دون بوت تابع لجهة خارجية):

    1. أرسل رسالة خاصة إلى بوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة طرف ثالث (خصوصية أقل): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    يُطبّق عنصران معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - لا يوجد config لـ `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز عمليات التحقق من معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات إلى أن تضيف إدخالات `groups` (أو `"*"`)
       - تم ضبط `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **ما المرسلون المسموح بهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. وإذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدم Telegram رقمية (تُطبَّع البادئتان `telegram:` / `tg:`).
    لا تضع معرّفات دردشات مجموعة Telegram أو supergroup داخل `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة تحت `channels.telegram.groups`.
    يتم تجاهل الإدخالات غير الرقمية لتخويل المرسل.
    حد الأمان (`2026.2.25+`): تخويل مرسل المجموعة لا يرث موافقات مخزن الاقتران الخاصة بالرسائل المباشرة.
    يظل الاقتران خاصًا بالرسائل الخاصة فقط. بالنسبة إلى المجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يتم ضبط `groupAllowFrom`، فإن Telegram يعود إلى `allowFrom` في config، وليس إلى مخزن الاقتران.
    نمط عملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فإن القيم الافتراضية وقت التشغيل تكون fail-closed مع `groupPolicy="allowlist"` ما لم يتم ضبط `channels.defaults.groupPolicy` صراحةً.

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

    مثال: السماح فقط لمستخدمين محددين داخل مجموعة محددة واحدة:

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
      خطأ شائع: `groupAllowFrom` ليس قائمة سماح لمجموعات Telegram.

      - ضع معرّفات مجموعات Telegram أو supergroup السالبة مثل `-1001234567890` تحت `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.
    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب ردود المجموعات الإشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية `@botusername`، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه الأوامر حالة الجلسة فقط. استخدم config للاستمرارية.

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
    - أو افحص Bot API `getUpdates`

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- Telegram مملوك لعملية Gateway.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبَّع الرسائل الواردة إلى مظروف القناة المشترك مع بيانات تعريف الرد وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. وتُضاف Forum topics على الشكل `:topic:<threadId>` للحفاظ على عزل الموضوعات.
- يمكن أن تحمل رسائل DM قيمة `message_thread_id`؛ يوجّهها OpenClaw باستخدام مفاتيح جلسات تراعي الخيوط ويحافظ على معرّف الخيط في الردود.
- يستخدم الاستطلاع الطويل grammY runner مع تسلسل لكل دردشة/لكل خيط. وتستخدم التزامنية العامة لمصب runner القيمة `agents.defaults.maxConcurrent`.
- تبدأ إعادة تشغيل مراقب الاستطلاع الطويل بعد 120 ثانية من دون حيوية `getUpdates` مكتملة افتراضيًا. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان النشر لديك لا يزال يشهد إعادات تشغيل خاطئة بسبب تعطل الاستطلاع أثناء الأعمال طويلة التشغيل. القيمة بالميلي ثانية ومسموح بها من `30000` إلى `600000`؛ وتتوفر تجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - تُربط `progress` بـ `partial` على Telegram (للتوافق مع التسمية عبر القنوات)
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأداة/التقدم ستعيد استخدام رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). اضبطه على `false` للإبقاء على رسائل أداة/تقدم منفصلة.
    - يتم ربط القيم القديمة `channels.telegram.streamMode` والقيم المنطقية `streaming` تلقائيًا

    للردود النصية فقط:

    - DM: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)
    - group/topic: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)

    للردود المعقدة (على سبيل المثال حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    يختلف بث المعاينة عن block streaming. عند تمكين block streaming صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    إذا كان نقل المسودة الأصلي غير متاح/مرفوضًا، يعود OpenClaw تلقائيًا إلى `sendMessage` + `editMessageText`.

    بث reasoning الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` reasoning إلى المعاينة المباشرة أثناء الإنشاء
    - يُرسل الجواب النهائي من دون نص reasoning

  </Accordion>

  <Accordion title="التنسيق والرجوع إلى HTML">
    يستخدم النص الصادر في Telegram القيمة `parse_mode: "HTML"`.

    - يُعرض النص الشبيه بـ Markdown على شكل HTML آمن لـ Telegram.
    - يتم تهريب HTML الخام الصادر عن النموذج لتقليل إخفاقات التحليل في Telegram.
    - إذا رفض Telegram HTML المحلَّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها عبر `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    الإعدادات الافتراضية للأوامر الأصلية:

    - يفعّل `commands.native: "auto"` الأوامر الأصلية لـ Telegram

    أضف إدخالات مخصصة إلى قائمة الأوامر:

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

    - تُطبّع الأسماء (إزالة `/` في البداية، وأحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات في القائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن أن تظل أوامر Plugin/Skills تعمل عند كتابتها حتى لو لم تظهر في قائمة Telegram

    إذا كانت الأوامر الأصلية معطلة، تتم إزالة الأوامر المضمنة. وقد تظل أوامر Plugin/المخصصة تُسجل إذا كانت مهيأة.

    حالات فشل الإعداد الشائعة:

    - تعني الرسالة `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما تزال تتجاوز الحد بعد التقليص؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل `channels.telegram.commands.native`.
    - تعني الرسالة `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر اقتران الجهاز (`device-pair` Plugin)

    عند تثبيت Plugin ‏`device-pair`:

    1. يقوم `/pair` بإنشاء رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` لأحدث طلب

    يحمل رمز الإعداد bootstrap token قصير العمر. يحافظ built-in bootstrap handoff على رمز Node الأساسي عند `scopes: []`؛ وأي رمز operator يتم تسليمه يظل مقيدًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون عمليات التحقق من نطاق bootstrap مسبوقة بالدور، لذلك فإن allowlist الخاصة بـ operator تلبّي طلبات operator فقط؛ وما زالت الأدوار غير operator تحتاج إلى نطاقات تحت بادئة الدور الخاصة بها.

    إذا أعاد جهاز المحاولة مع تغيّر في تفاصيل auth (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد قيمة `requestId` مختلفة. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الاقتران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمنة">
    اضبط نطاق inline keyboard:

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

    يتم ربط الصيغة القديمة `capabilities: ["inlineButtons"]` إلى `inlineButtons: "all"`.

    مثال لإجراء رسالة:

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

    تُمرر نقرات callback إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram ما يلي:

    - `sendMessage` (`to` و`content` و`mediaUrl` اختياري و`replyToMessageId` و`messageThreadId`)
    - `react` (`chatId` و`messageId` و`emoji`)
    - `deleteMessage` (`chatId` و`messageId`)
    - `editMessage` (`chatId` و`messageId` و`content`)
    - `createForumTopic` (`chatId` و`name` و`iconColor` اختياري و`iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماءً بديلة مريحة (`send` و`react` و`delete` و`edit` و`sticker` و`sticker-search` و`topic-create`).

    عناصر التحكم في البوابة:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل منفصلة ضمن `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال وقت التشغيل اللقطة النشطة من config/secrets ‏(بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef مخصصة لكل عملية إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تفرع الرد">
    يدعم Telegram وسوم تفرع الرد الصريحة في المخرجات المُنشأة:

    - `[[reply_to_current]]` للرد على الرسالة التي أدت إلى التشغيل
    - `[[reply_to:<id>]]` للرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    ملاحظة: يعطل `off` تفرع الرد الضمني. وما زالت الوسوم الصريحة `[[reply_to_*]]` محترمة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك الخيوط">
    مجموعات المنتدى الفائقة:

    - تُلحق مفاتيح جلسة الموضوع بـ `:topic:<threadId>`
    - تستهدف الردود وإجراءات الكتابة خيط الموضوع
    - مسار config الخاص بالموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة الموضوع العام الخاصة (`threadId=1`):

    - تُرسل الرسائل بدون `message_thread_id` (يرفض Telegram القيمة `sendMessage(...thread_id=1)`)
    - ما زالت إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention` و`allowFrom` و`skills` و`systemPrompt` و`enabled` و`groupPolicy`).
    يكون `agentId` خاصًا بالموضوع فقط ولا يرث من القيم الافتراضية للمجموعة.

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
                "5": { agentId: "coder" }      // مراجعة الكود → الوكيل coder
              }
            }
          }
        }
      }
    }
    ```

    يكون لكل موضوع بعد ذلك مفتاح جلسته الخاص: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط ACP دائم للموضوع**: يمكن لموضوعات المنتدى تثبيت جلسات ACP harness عبر روابط ACP مكتوبة على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بموضوع مثل `-1001234567890:topic:42`). النطاق الحالي يقتصر على موضوعات المنتدى في المجموعات/supergroups. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالخيط من الدردشة**: يقوم `/acp spawn <agent> --thread here|auto` بربط الموضوع الحالي بجلسة ACP جديدة؛ وتُوجَّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب ذلك `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يعرّض سياق القالب `MessageThreadId` و`IsForum`. وتحافظ دردشات DM التي تتضمن `message_thread_id` على توجيه DM لكنها تستخدم مفاتيح جلسات تراعي الخيوط.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوت
    - أضف الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية

    مثال لإجراء رسالة:

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

    مثال لإجراء رسالة:

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

    تُوصف الملصقات مرة واحدة (عند الإمكان) وتُخزَّن مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

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

    عند التمكين، يضيف OpenClaw أحداث نظام إلى قائمة الانتظار مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: ‏`off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: ‏`off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدم على الرسائل التي أرسلها البوت فقط (بأفضل جهد عبر ذاكرة تخزين مؤقت للرسائل المرسلة).
    - ما زالت أحداث التفاعل تحترم ضوابط الوصول في Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ ويُسقط المرسلون غير المخوّلين.
    - لا يوفّر Telegram معرّفات الخيوط في تحديثات التفاعل.
      - المجموعات غير المنتدى تُوجَّه إلى جلسة دردشة المجموعة
      - مجموعات المنتدى تُوجَّه إلى جلسة الموضوع العام للمجموعة (`:topic:1`) وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستطلاع/‏Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا `"👀"`)

    ملاحظات:

    - يتوقع Telegram رمز emoji موحدًا Unicode (مثل `"👀"`).
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات config من أحداث Telegram وأوامره">
    تكون كتابات config الخاصة بالقناة مفعلة افتراضيًا (`configWrites !== false`).

    تتضمن الكتابات التي يطلقها Telegram ما يلي:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلبان تمكين الأوامر)

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
    الوضع الافتراضي هو الاستطلاع الطويل. لاستخدام وضع Webhook اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ كما أن `webhookPath` و`webhookHost` و`webhookPort` اختيارية (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    يرتبط المستمع المحلي بالعنوان `127.0.0.1:8787`. وللوصول العام، إما أن تضع reverse proxy أمام المنفذ المحلي أو تضبط `webhookHost: "0.0.0.0"` عن قصد.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدد `channels.telegram.mediaMaxMb` (الافتراضي 100) الحد الأقصى لحجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُضبط، تُطبق القيمة الافتراضية لـ grammY).
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل تعطل الاستطلاع الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتؤدي القيمة `0` إلى التعطيل.
    - يُمرر السياق التكميلي للرد/الاقتباس/إعادة التوجيه حاليًا كما تم استلامه.
    - تتحكم قوائم السماح في Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل الرسائل الخاصة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على أدوات إرسال Telegram ‏(CLI/tools/actions) لأخطاء Telegram API الصادرة القابلة للاسترداد.

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

    - `--poll-duration-seconds` ‏(5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتدى (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبّت عندما يمكن للبوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من تحميلها كصور مضغوطة أو وسائط متحركة

    بوابة الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل الخاصة للموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصليين. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار config:

    - `channels.telegram.execApprovals.enabled` (يُفعّل تلقائيًا عند إمكانية حلّ موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالك الرقمية من `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: ‏`dm` (الافتراضي) | `channel` | `both`
    - `agentFilter` و`sessionFilter`

    يعرض التسليم عبر القناة نص الأمر في الدردشة؛ لا تفعّل `channel` أو `both` إلا في المجموعات/الموضوعات الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بسطح الهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة المسبوقة بـ `plugin:` عبر موافقات Plugin؛ أما غير ذلك فيُحل أولًا عبر موافقات exec.

    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا config التاليان في هذا السلوك:

| المفتاح                                 | القيم             | الافتراضي | الوصف                                                                                         |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | يرسل `reply` رسالة خطأ ودية إلى الدردشة. ويمنع `silent` ردود الأخطاء بالكامل. |
| `channels.telegram.errorCooldownMs` | رقم (مللي ثانية)       | `60000` | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع إغراق الأخطاء أثناء فترات الانقطاع.        |

تتوفر تجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس وراثة مفاتيح config الأخرى في Telegram).

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
  <Accordion title="البوت لا يستجيب لرسائل المجموعة التي لا تتضمن إشارة">

    - إذا كانت `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram برؤية كاملة.
      - BotFather: ‏`/setprivacy` -> تعطيل
      - ثم أزل البوت وأعد إضافته إلى المجموعة
    - يحذّر `openclaw channels status` عندما يتوقع config رسائل مجموعات من دون إشارة.
    - يمكن للأمر `openclaw channels status --probe` فحص معرّفات مجموعات رقمية صريحة؛ ولا يمكن فحص العضوية باستخدام wildcard `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقًا">

    - عند وجود `channels.telegram.groups`، يجب أن تكون المجموعة مدرجة (أو تتضمن `"*"`)
    - تحقّق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لأسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - خوّل هوية المُرسِل الخاصة بك (الاقتران و/أو `allowFrom` الرقمي)
    - ما زال تخويل الأوامر يُطبَّق حتى عندما تكون سياسة المجموعة `open`
    - تعني الرسالة `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - تشير الرسالة `setMyCommands failed` مع أخطاء الشبكة/`fetch` عادةً إلى مشكلات في الوصول إلى DNS/HTTPS الخاص بـ `api.telegram.org`

  </Accordion>

  <Accordion title="تعطل الاستطلاع أو عدم استقرار الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/proxy مخصص إلى سلوك إلغاء فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ ويمكن أن يتسبب خروج IPv6 المعطّل في إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الحالات باعتبارها أخطاء شبكة قابلة للاسترداد.
    - إذا تضمنت السجلات `Polling stall detected`، فإن OpenClaw يعيد تشغيل الاستطلاع ويعيد بناء ناقل Telegram بعد 120 ثانية من دون حيوية استطلاع طويل مكتملة افتراضيًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` طويلة التشغيل سليمة لكن مضيفك ما زال يبلغ عن إعادات تشغيل تعطل استطلاع إيجابية كاذبة. تشير حالات التعطل المستمرة عادةً إلى مشكلات proxy أو DNS أو IPv6 أو TLS في الخروج بين المضيف و`api.telegram.org`.
    - على مضيفات VPS ذات الخروج/TLS المباشر غير المستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2) و`dnsResultOrder=ipv4first`.
    - إذا كان مضيفك هو WSL2 أو كان يعمل بشكل أفضل صراحةً مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاقات قياس RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      افتراضيًا لتنزيلات وسائط Telegram. وإذا كان fake-IP موثوق أو
      proxy شفاف يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/ذي استخدام خاص أثناء تنزيلات الوسائط، فيمكنك
      تفعيل تجاوز Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر نفس التفعيل الاختياري لكل حساب في
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطلة أولًا. تسمح وسائط Telegram بالفعل بنطاق قياس RFC 2544
      افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل الحماية من SSRF الخاصة بوسائط Telegram.
      استخدمه فقط في بيئات proxy موثوقة يتحكم فيها المشغل
      مثل Clash أو Mihomo أو توجيه fake-IP في Surge عندما
      تُنشئ هذه الأدوات إجابات خاصة أو ذات استخدام خاص خارج نطاق قياس RFC 2544
      المرجعي. اتركه معطلًا لوصول Telegram العادي عبر الإنترنت العام.
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

## مؤشرات مرجع config الخاص بـ Telegram

المرجع الأساسي:

- `channels.telegram.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.telegram.botToken`: رمز البوت (BotFather).
- `channels.telegram.tokenFile`: قراءة الرمز من مسار ملف عادي. تُرفض الروابط الرمزية.
- `channels.telegram.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.telegram.allowFrom`: قائمة السماح للرسائل الخاصة (معرّفات مستخدمي Telegram الرقمية). يتطلب `allowlist` معرّف مُرسِل واحدًا على الأقل. ويتطلب `open` القيمة `"*"`. يمكن للأمر `openclaw doctor --fix` حل إدخالات `@username` القديمة إلى معرّفات، ويمكنه استعادة إدخالات قائمة السماح من ملفات مخزن الاقتران في تدفقات ترحيل allowlist.
- `channels.telegram.actions.poll`: تمكين أو تعطيل إنشاء استطلاعات Telegram (الافتراضي: مفعّل؛ وما زال يتطلب `sendMessage`).
- `channels.telegram.defaultTo`: هدف Telegram الافتراضي الذي يستخدمه CLI مع `--deliver` عندما لا يتم توفير `--reply-to` صريح.
- `channels.telegram.groupPolicy`: ‏`open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.telegram.groupAllowFrom`: قائمة سماح مرسلي المجموعات (معرّفات مستخدمي Telegram الرقمية). يمكن للأمر `openclaw doctor --fix` حل إدخالات `@username` القديمة إلى معرّفات. يتم تجاهل الإدخالات غير الرقمية وقت التخويل. لا يستخدم تخويل المجموعات الرجوع إلى مخزن الاقتران للرسائل الخاصة (`2026.2.25+`).
- أسبقية الحسابات المتعددة:
  - عند ضبط معرّفي حسابين أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا.
  - إذا لم يتم ضبط أي منهما، يعود OpenClaw إلى أول معرّف حساب مُطبَّع ويحذّر `openclaw doctor`.
  - تنطبق `channels.telegram.accounts.default.allowFrom` و`channels.telegram.accounts.default.groupAllowFrom` على الحساب `default` فقط.
  - ترث الحسابات المسمّاة `channels.telegram.allowFrom` و`channels.telegram.groupAllowFrom` عندما تكون القيم على مستوى الحساب غير مضبوطة.
  - لا ترث الحسابات المسمّاة `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: القيم الافتراضية لكل مجموعة + قائمة السماح (استخدم `"*"` للقيم الافتراضية العامة).
  - `channels.telegram.groups.<id>.groupPolicy`: تجاوز لكل مجموعة لـ groupPolicy ‏(`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: القيمة الافتراضية لبوابة الإشارة.
  - `channels.telegram.groups.<id>.skills`: مرشح Skills ‏(الحذف = كل Skills، الفارغ = لا شيء).
  - `channels.telegram.groups.<id>.allowFrom`: تجاوز قائمة سماح المرسلين لكل مجموعة.
  - `channels.telegram.groups.<id>.systemPrompt`: system prompt إضافي للمجموعة.
  - `channels.telegram.groups.<id>.enabled`: تعطيل المجموعة عندما تكون القيمة `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: تجاوزات لكل موضوع (حقول المجموعة + `agentId` الخاص بالموضوع فقط).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: توجيه هذا الموضوع إلى وكيل محدد (يتجاوز التوجيه على مستوى المجموعة والربط).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: تجاوز لكل موضوع لـ groupPolicy ‏(`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: تجاوز بوابة الإشارة لكل موضوع.
- `bindings[]` على المستوى الأعلى مع `type: "acp"` ومعرّف موضوع قانوني `chatId:topic:topicId` في `match.peer.id`: حقول ربط موضوع ACP الدائم (راجع [وكلاء ACP](/ar/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: توجيه موضوعات DM إلى وكيل محدد (نفس سلوك موضوعات المنتدى).
- `channels.telegram.execApprovals.enabled`: تمكين Telegram كعميل موافقات exec قائم على الدردشة لهذا الحساب.
- `channels.telegram.execApprovals.approvers`: معرّفات مستخدمي Telegram المسموح لهم بالموافقة على طلبات exec أو رفضها. اختياري عندما تكون `channels.telegram.allowFrom` أو `channels.telegram.defaultTo` المباشرة تحدد المالك بالفعل.
- `channels.telegram.execApprovals.target`: ‏`dm | channel | both` (الافتراضي: `dm`). تحافظ `channel` و`both` على موضوع Telegram الأصلي عند وجوده.
- `channels.telegram.execApprovals.agentFilter`: مرشح اختياري لمعرّف الوكيل لمطالبات الموافقة المعاد توجيهها.
- `channels.telegram.execApprovals.sessionFilter`: مرشح اختياري لمفتاح الجلسة (substring أو regex) لمطالبات الموافقة المعاد توجيهها.
- `channels.telegram.accounts.<account>.execApprovals`: تجاوز لكل حساب لتوجيه موافقات exec في Telegram وتخويل الموافقين.
- `channels.telegram.capabilities.inlineButtons`: ‏`off | dm | group | all | allowlist` (الافتراضي: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: تجاوز لكل حساب.
- `channels.telegram.commands.nativeSkills`: تمكين/تعطيل أوامر Skills الأصلية في Telegram.
- `channels.telegram.replyToMode`: ‏`off | first | all` (الافتراضي: `off`).
- `channels.telegram.textChunkLimit`: حجم التقسيم الصادر إلى أجزاء (أحرف).
- `channels.telegram.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.telegram.linkPreview`: تبديل معاينات الروابط للرسائل الصادرة (الافتراضي: true).
- `channels.telegram.streaming`: ‏`off | partial | block | progress` (معاينة البث المباشر؛ الافتراضي: `partial`؛ يتم ربط `progress` إلى `partial`؛ و`block` هو توافق مع وضع المعاينة القديم). يستخدم بث المعاينة في Telegram رسالة معاينة واحدة يتم تعديلها في مكانها.
- `channels.telegram.streaming.preview.toolProgress`: إعادة استخدام رسالة المعاينة المباشرة لتحديثات الأداة/التقدم عندما يكون بث المعاينة نشطًا (الافتراضي: `true`). اضبطه على `false` للإبقاء على رسائل أداة/تقدم منفصلة.
- `channels.telegram.mediaMaxMb`: الحد الأقصى لوسائط Telegram الواردة/الصادرة (MB، الافتراضي: 100).
- `channels.telegram.retry`: سياسة إعادة المحاولة لمساعدات إرسال Telegram ‏(CLI/tools/actions) عند أخطاء API الصادرة القابلة للاسترداد (المحاولات، minDelayMs، maxDelayMs، jitter).
- `channels.telegram.network.autoSelectFamily`: تجاوز Node autoSelectFamily ‏(true=تمكين، false=تعطيل). يكون مفعّلًا افتراضيًا على Node 22+، مع تعطيل افتراضي على WSL2.
- `channels.telegram.network.dnsResultOrder`: تجاوز ترتيب نتائج DNS ‏(`ipv4first` أو `verbatim`). يكون `ipv4first` افتراضيًا على Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: تفعيل خطير اختياري لبيئات fake-IP أو proxy الشفاف الموثوقة حيث تُحل تنزيلات وسائط Telegram ‏`api.telegram.org` إلى عناوين خاصة/داخلية/ذات استخدام خاص خارج السماح الافتراضي لنطاق القياس RFC 2544.
- `channels.telegram.proxy`: عنوان URL للـ proxy لاستدعاءات Bot API ‏(SOCKS/HTTP).
- `channels.telegram.webhookUrl`: تمكين وضع Webhook ‏(يتطلب `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: سر Webhook ‏(مطلوب عند ضبط webhookUrl).
- `channels.telegram.webhookPath`: مسار Webhook المحلي (الافتراضي `/telegram-webhook`).
- `channels.telegram.webhookHost`: مضيف ربط Webhook المحلي (الافتراضي `127.0.0.1`).
- `channels.telegram.webhookPort`: منفذ ربط Webhook المحلي (الافتراضي `8787`).
- `channels.telegram.actions.reactions`: بوابة تفاعلات أداة Telegram.
- `channels.telegram.actions.sendMessage`: بوابة إرسال رسائل أداة Telegram.
- `channels.telegram.actions.deleteMessage`: بوابة حذف رسائل أداة Telegram.
- `channels.telegram.actions.sticker`: بوابة إجراءات ملصقات Telegram — الإرسال والبحث (الافتراضي: false).
- `channels.telegram.reactionNotifications`: ‏`off | own | all` — التحكم في التفاعلات التي تطلق أحداث النظام (الافتراضي: `own` عند عدم الضبط).
- `channels.telegram.reactionLevel`: ‏`off | ack | minimal | extensive` — التحكم في قدرة الوكيل على التفاعل (الافتراضي: `minimal` عند عدم الضبط).
- `channels.telegram.errorPolicy`: ‏`reply | silent` — التحكم في سلوك رد الأخطاء (الافتراضي: `reply`). وتدعم التجاوزات لكل حساب/مجموعة/موضوع.
- `channels.telegram.errorCooldownMs`: الحد الأدنى بالمللي ثانية بين ردود الأخطاء إلى الدردشة نفسها (الافتراضي: `60000`). يمنع إغراق الأخطاء أثناء فترات الانقطاع.

- [مرجع الإعدادات - Telegram](/ar/gateway/configuration-reference#telegram)

حقول Telegram عالية الإشارة والخاصة به:

- بدء التشغيل/المصادقة: `enabled` و`botToken` و`tokenFile` و`accounts.*` ‏(`tokenFile` يجب أن يشير إلى ملف عادي؛ وتُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom` و`groups` و`groups.*.topics.*` و`bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات exec: ‏`execApprovals` و`accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native` و`commands.nativeSkills` و`customCommands`
- الخيوط/الردود: `replyToMode`
- البث: `streaming` (المعاينة) و`streaming.preview.toolProgress` و`blockStreaming`
- التنسيق/التسليم: `textChunkLimit` و`chunkMode` و`linkPreview` و`responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb` و`timeoutSeconds` و`pollingStallThresholdMs` و`retry` و`network.autoSelectFamily` و`network.dangerouslyAllowPrivateNetwork` و`proxy`
- Webhook: `webhookUrl` و`webhookSecret` و`webhookPath` و`webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons` و`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications` و`reactionLevel`
- الأخطاء: `errorPolicy` و`errorCooldownMs`
- الكتابات/السجل: `configWrites` و`historyLimit` و`dmHistoryLimit` و`dms.*.historyLimit`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القناة](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
