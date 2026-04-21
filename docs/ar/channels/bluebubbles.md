---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء اقتران Webhook وإصلاحها
    - تهيئة iMessage على macOS
summary: iMessage عبر خادم BlueBubbles على macOS (إرسال/استقبال عبر REST، الكتابة، التفاعلات، الاقتران، الإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T13:35:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30ce50ae8a17140b42fa410647c367e0eefdffb1646b1ff92d8e1af63f2e1155
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles ‏(REST على macOS)

الحالة: Plugin مضمّن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. **موصى به لتكامل iMessage** بسبب واجهته البرمجية الأكثر غنى وسهولة إعداده مقارنةً بقناة imsg القديمة.

## Plugin المضمّن

تتضمن إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج الإصدارات المعبأة العادية
إلى خطوة `openclaw plugins install` منفصلة.

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- الموصى به/المختبَر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ لكن التعديل معطّل حاليًا على Tahoe، وقد تُبلّغ تحديثات أيقونة المجموعة عن النجاح لكنها لا تتزامن.
- يتواصل OpenClaw معه عبر واجهة REST API الخاصة به (`GET /api/v1/ping`، `POST /message/text`، `POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhooks؛ وتكون الردود الصادرة، ومؤشرات الكتابة، وإيصالات القراءة، وTapbacks عبر استدعاءات REST.
- تُستوعَب المرفقات والملصقات كوسائط واردة (وتُعرَض للوكيل عند الإمكان).
- يعمل الاقتران/قائمة السماح بالطريقة نفسها مثل القنوات الأخرى (`/channels/pairing` وما إلى ذلك) باستخدام `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تُعرَض التفاعلات كأحداث نظام تمامًا مثل Slack/Telegram لكي تتمكن الوكلاء من "الإشارة" إليها قبل الرد.
- الميزات المتقدمة: التعديل، وإلغاء الإرسال، وتسلسل الردود، وتأثيرات الرسائل، وإدارة المجموعات.

## البدء السريع

1. ثبّت خادم BlueBubbles على جهاز Mac الخاص بك (اتبع التعليمات على [bluebubbles.app/install](https://bluebubbles.app/install)).
2. في إعدادات BlueBubbles، فعّل web API واضبط كلمة مرور.
3. شغّل `openclaw onboard` واختر BlueBubbles، أو قم بالإعداد يدويًا:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. وجّه Webhooks الخاصة بـ BlueBubbles إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. ابدأ Gateway؛ إذ سيسجل معالج Webhook ويبدأ الاقتران.

ملاحظة أمنية:

- اضبط دائمًا كلمة مرور لـ Webhook.
- مصادقة Webhook مطلوبة دائمًا. يرفض OpenClaw طلبات BlueBubbles webhook ما لم تتضمن كلمة مرور/guid تطابق `channels.bluebubbles.password` (مثلًا `?password=<password>` أو `x-password`)، بغض النظر عن بنية local loopback/proxy.
- يتم التحقق من مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook الكاملة.

## إبقاء Messages.app نشطًا (إعدادات VM / بدون واجهة)

قد ينتهي الأمر في بعض إعدادات macOS VM / التشغيل الدائم بأن يدخل Messages.app في حالة “خمول” (تتوقف الأحداث الواردة حتى يتم فتح التطبيق/إحضاره إلى الواجهة). يوجد حل بديل بسيط وهو **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

### 1) احفظ AppleScript

احفظ هذا باسم:

- `~/Scripts/poke-messages.scpt`

مثال على السكربت (غير تفاعلي؛ لا يسرق التركيز):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) ثبّت LaunchAgent

احفظ هذا باسم:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

ملاحظات:

- يعمل هذا **كل 300 ثانية** و**عند تسجيل الدخول**.
- قد يؤدي التشغيل الأول إلى ظهور مطالبات **Automation** في macOS (`osascript` ← Messages). وافق عليها في جلسة المستخدم نفسها التي تشغّل LaunchAgent.

حمّله:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## الإعداد التوجيهي

يتوفر BlueBubbles في الإعداد التوجيهي التفاعلي:

```
openclaw onboard
```

سيطلب المعالج ما يلي:

- **Server URL** (مطلوب): عنوان خادم BlueBubbles (مثلًا `http://192.168.1.100:1234`)
- **Password** (مطلوب): كلمة مرور API من إعدادات BlueBubbles Server
- **Webhook path** (اختياري): القيمة الافتراضية هي `/bluebubbles-webhook`
- **DM policy**: pairing أو allowlist أو open أو disabled
- **Allow list**: أرقام الهواتف أو رسائل البريد الإلكتروني أو أهداف الدردشة

يمكنك أيضًا إضافة BlueBubbles عبر CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل الخاصة + المجموعات)

الرسائل الخاصة:

- الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ ويتم تجاهل الرسائل حتى تتم الموافقة عليها (تنتهي صلاحية الرموز بعد ساعة واحدة).
- وافق عبر:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- الاقتران هو تبادل الرمز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)

المجموعات:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
- يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التفعيل في المجموعات عند ضبط `allowlist`.

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبًا ما تتضمن Webhooks مجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا كنت تريد أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلًا من ذلك، فيمكنك تفعيل إثراء Contacts المحلي على macOS:

- يؤدي `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` إلى تمكين البحث. الافتراضي: `false`.
- لا تُجرى عمليات البحث إلا بعد أن يسمح وصول المجموعة، وتفويض الأوامر، وبوابة الإشارة بمرور الرسالة.
- يتم إثراء المشاركين الهاتفيين غير المسمّين فقط.
- تبقى أرقام الهواتف الخام كخيار احتياطي عند عدم العثور على تطابق محلي.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### بوابة الإشارة (المجموعات)

يدعم BlueBubbles بوابة الإشارة لمحادثات المجموعات، بما يطابق سلوك iMessage/WhatsApp:

- يستخدم `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`) لاكتشاف الإشارات.
- عند تمكين `requireMention` لمجموعة ما، لا يرد الوكيل إلا عند الإشارة إليه.
- تتجاوز أوامر التحكم من المرسلين المخوّلين بوابة الإشارة.

الإعداد لكل مجموعة:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // الافتراضي لجميع المجموعات
        "iMessage;-;chat123": { requireMention: false }, // تجاوز لمجموعة محددة
      },
    },
  },
}
```

### بوابة الأوامر

- تتطلب أوامر التحكم (مثل `/config` و`/model`) تفويضًا.
- تستخدم `allowFrom` و`groupAllowFrom` لتحديد تفويض الأوامر.
- يمكن للمرسلين المخوّلين تشغيل أوامر التحكم حتى بدون إشارة في المجموعات.

### Prompt نظام لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن هذه القيمة في Prompt نظام الوكيل في كل دور يعالج رسالة في تلك المجموعة، بحيث يمكنك ضبط شخصية أو قواعد سلوكية لكل مجموعة دون تعديل Prompts الوكيل:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "اجعل الردود أقل من 3 جمل. ووافق النبرة غير الرسمية للمجموعة.",
        },
      },
    },
  },
}
```

يطابق المفتاح أي قيمة يبلّغ عنها BlueBubbles على أنها `chatGuid` / `chatIdentifier` / `chatId` رقمي للمجموعة، ويوفر إدخال حرف البدل `"*"` قيمة افتراضية لكل مجموعة لا تملك تطابقًا دقيقًا (النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تتغلب التطابقات الدقيقة دائمًا على حرف البدل. تتجاهل الرسائل الخاصة هذا الحقل؛ استخدم بدلًا من ذلك تخصيص Prompt على مستوى الوكيل أو مستوى الحساب.

#### مثال عملي: الردود المترابطة وتفاعلات tapback (Private API)

عند تمكين BlueBubbles Private API، تصل الرسائل الواردة مع معرّفات رسائل قصيرة (مثل `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للرد ضمن رسالة محددة أو `action=react` لإسقاط tapback. يُعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "عند الرد في هذه المجموعة، استخدم دائمًا action=reply مع",
            "messageId من النوع [[reply_to:N]] من السياق لكي يأتي ردك مترابطًا",
            "تحت الرسالة المُشغِّلة. لا ترسل أبدًا رسالة جديدة غير مرتبطة.",
            "",
            "للتأكيدات القصيرة ('ok' و'got it' و'on it')، استخدم",
            "action=react مع tapback emoji مناسب (❤️, 👍, 😂, ‼️, ❓)",
            "بدلًا من إرسال رد نصي.",
          ].join(" "),
        },
      },
    },
  },
}
```

يتطلب كل من تفاعلات Tapback والردود المترابطة BlueBubbles Private API؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) لمعرفة الآلية الأساسية.

## روابط محادثات ACP

يمكن تحويل محادثات BlueBubbles إلى مساحات عمل ACP دائمة بدون تغيير طبقة النقل.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسائل الخاصة أو دردشة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

تتوفر أيضًا الروابط الدائمة المهيأة عبر إدخالات `bindings[]` من المستوى الأعلى مع `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن أن يستخدم `match.peer.id` أي صيغة هدف BlueBubbles مدعومة:

- معرّف DM مطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

للحصول على روابط مجموعات مستقرة، فضّل `chat_id:*` أو `chat_identifier:*`.

مثال:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

راجع [وكلاء ACP](/ar/tools/acp-agents) للاطلاع على سلوك روابط ACP المشتركة.

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسل تلقائيًا قبل وأثناء إنشاء الرد.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
- **مؤشرات الكتابة**: يرسل OpenClaw أحداث بدء الكتابة؛ ويقوم BlueBubbles بمسح الكتابة تلقائيًا عند الإرسال أو انتهاء المهلة (الإيقاف اليدوي عبر DELETE غير موثوق).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // تعطيل إيصالات القراءة
    },
  },
}
```

## الإجراءات المتقدمة

يدعم BlueBubbles إجراءات الرسائل المتقدمة عند تمكينها في الإعدادات:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (الافتراضي: true)
        edit: true, // تعديل الرسائل المرسلة (macOS 13+، معطّل على macOS 26 Tahoe)
        unsend: true, // إلغاء إرسال الرسائل (macOS 13+)
        reply: true, // تسلسل الردود حسب message GUID
        sendWithEffect: true, // الإرسال مع تأثير iMessage (slam وloud وما إلى ذلك)
        renameGroup: true, // إعادة تسمية دردشات المجموعات
        setGroupIcon: true, // تعيين أيقونة/صورة دردشة المجموعة (غير مستقر على macOS 26 Tahoe)
        addParticipant: true, // إضافة مشاركين إلى المجموعات
        removeParticipant: true, // إزالة مشاركين من المجموعات
        leaveGroup: true, // مغادرة دردشات المجموعات
        sendAttachment: true, // إرسال المرفقات/الوسائط
      },
    },
  },
}
```

الإجراءات المتاحة:

- **react**: إضافة/إزالة تفاعلات tapback (`messageId`، `emoji`، `remove`)
- **edit**: تعديل رسالة مُرسلة (`messageId`، `text`)
- **unsend**: إلغاء إرسال رسالة (`messageId`)
- **reply**: الرد على رسالة محددة (`messageId`، `text`، `to`)
- **sendWithEffect**: الإرسال مع تأثير iMessage (`text`، `to`، `effectId`)
- **renameGroup**: إعادة تسمية دردشة مجموعة (`chatGuid`، `displayName`)
- **setGroupIcon**: تعيين أيقونة/صورة دردشة مجموعة (`chatGuid`، `media`) — غير مستقر على macOS 26 Tahoe (قد تُرجع API نجاحًا لكن الأيقونة لا تتزامن).
- **addParticipant**: إضافة شخص إلى مجموعة (`chatGuid`، `address`)
- **removeParticipant**: إزالة شخص من مجموعة (`chatGuid`، `address`)
- **leaveGroup**: مغادرة دردشة مجموعة (`chatGuid`)
- **upload-file**: إرسال الوسائط/الملفات (`to`، `buffer`، `filename`، `asVoice`)
  - المذكرات الصوتية: اضبط `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يقوم BlueBubbles بتحويل MP3 → CAF عند إرسال المذكرات الصوتية.
- الاسم البديل القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو الاسم القياسي للإجراء.

### معرّفات الرسائل (القصيرة مقابل الكاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1` و`2`) لتوفير الرموز.

- يمكن أن يكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- يحتوي `MessageSidFull` / `ReplyToIdFull` على معرّفات المزوّد الكاملة.
- المعرّفات القصيرة موجودة في الذاكرة؛ وقد تنتهي صلاحيتها بعد إعادة التشغيل أو إخلاء الذاكرة المؤقتة.
- تقبل الإجراءات `messageId` القصير أو الكامل، لكن المعرّفات القصيرة ستؤدي إلى خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة لعمليات الأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`، `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [التهيئة](/ar/gateway/configuration) لمتغيرات القوالب.

## دمج رسائل DM المقسّمة عند الإرسال (أمر + URL في صياغة واحدة)

عندما يكتب المستخدم أمرًا وURL معًا في iMessage — مثل `Dump https://example.com/article` — تقسم Apple الإرسال إلى **عمليتي تسليم webhook منفصلتين**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

تصل العمليتان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. بدون الدمج، يتلقى الوكيل الأمر وحده في الدور 1، ويرد (غالبًا "أرسل لي الرابط")، ثم لا يرى URL إلا في الدور 2 — وعندها يكون سياق الأمر قد ضاع بالفعل.

يؤدي `channels.bluebubbles.coalesceSameSenderDms` إلى تمكين دمج webhooks المتتالية من المرسل نفسه في الرسائل الخاصة ضمن دور وكيل واحد. وتستمر دردشات المجموعات في الاعتماد على كل رسالة على حدة بحيث يتم الحفاظ على بنية الأدوار متعددة المستخدمين.

### متى يجب التمكين

قم بالتمكين عندما:

- تكون لديك Skills تتوقع `command + payload` في رسالة واحدة (dump، paste، save، queue، وما إلى ذلك).
- يلصق المستخدمون URLs أو صورًا أو محتوى طويلًا إلى جانب الأوامر.
- يمكنك قبول زمن التأخير الإضافي في أدوار الرسائل الخاصة (انظر أدناه).

اتركه معطّلًا عندما:

- تحتاج إلى أقل زمن تأخير ممكن لأوامر DM القصيرة جدًا.
- كل التدفقات لديك أوامر أحادية بدون حمولات لاحقة.

### التمكين

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // تمكين اختياري (الافتراضي: false)
    },
  },
}
```

مع تفعيل الخيار وعدم وجود `messages.inbound.byChannel.bluebubbles` صريح، تتسع نافذة إزالة الارتداد إلى **2500 ms** (الافتراضي لعدم الدمج هو 500 ms). النافذة الأوسع مطلوبة — لأن نمط الإرسال المقسّم في Apple بين 0.8-2.0 ثانية لا يناسب الافتراضي الأضيق.

لضبط النافذة بنفسك:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms يعمل في معظم الإعدادات؛ ارفعه إلى 4000 ms إذا كان Mac بطيئًا
        // أو تحت ضغط الذاكرة (إذ قد يمتد الفاصل المرصود حينها إلى أكثر من ثانيتين).
        bluebubbles: 2500,
      },
    },
  },
}
```

### المقايضات

- **زيادة زمن التأخير لأوامر التحكم في الرسائل الخاصة.** عند تفعيل الخيار، تنتظر رسائل أوامر التحكم في DM (مثل `Dump` و`Save` وما إلى ذلك) الآن حتى نافذة إزالة الارتداد قبل الإرسال، تحسبًا لوصول webhook حمولة. أما أوامر دردشات المجموعات فتبقى فورية.
- **المخرجات المدمجة لها حدود** — يُحدد النص المدمج بحد أقصى 4000 حرف مع علامة `…[truncated]` صريحة؛ وتُحدد المرفقات بحد 20؛ وتُحدد إدخالات المصدر بحد 10 (يتم الاحتفاظ بالأول بالإضافة إلى الأحدث بعد ذلك). يظل كل `messageId` من المصدر يصل إلى inbound-dedupe بحيث يتم التعرّف على أي إعادة تشغيل لاحقة من MessagePoller لأي حدث فردي كنسخة مكررة.
- **تمكين اختياري، لكل قناة.** القنوات الأخرى (Telegram وWhatsApp وSlack و…) غير متأثرة.

### السيناريوهات وما الذي يراه الوكيل

| ما يصوغه المستخدم                                                      | ما الذي تسلّمه Apple       | مع تعطيل الخيار (الافتراضي)            | مع تفعيل الخيار + نافذة 2500 ms                                          |
| ---------------------------------------------------------------------- | -------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (إرسال واحد)                               | 2 webhook بفاصل ~1 ثانية  | دوران للوكيل: "Dump" وحدها، ثم URL     | دور واحد: نص مدمج `Dump https://example.com`                            |
| `Save this 📎image.jpg caption` (مرفق + نص)                            | 2 webhook                  | دوران                                   | دور واحد: نص + صورة                                                     |
| `/status` (أمر مستقل)                                                  | 1 webhook                  | إرسال فوري                              | **ينتظر حتى النافذة، ثم يُرسل**                                         |
| لصق URL وحده                                                           | 1 webhook                  | إرسال فوري                              | إرسال فوري (إدخال واحد فقط في الحاوية)                                  |
| نص + URL أُرسلا كرسالتين منفصلتين عمدًا بفاصل دقائق                   | 2 webhook خارج النافذة     | دوران                                   | دوران (تنتهي النافذة بينهما)                                            |
| تدفق سريع (>10 رسائل DM صغيرة داخل النافذة)                           | N webhook                  | N أدوار                                 | دور واحد، بمخرجات محدودة (الأول + الأحدث، مع تطبيق حدود النص/المرفقات) |

### استكشاف أخطاء دمج الإرسال المقسّم وإصلاحها

إذا كان الخيار مفعّلًا وما زالت الإرسالات المقسّمة تصل على شكل دورين، فتحقق من كل طبقة:

1. **تم تحميل التهيئة فعلًا.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   ثم `openclaw gateway restart` — تتم قراءة الخيار عند إنشاء debouncer-registry.

2. **نافذة إزالة الارتداد واسعة بما يكفي لإعدادك.** انظر إلى سجل خادم BlueBubbles في `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   قِس الفاصل بين إرسال النص من نوع `"Dump"` والإرسال اللاحق من نوع `"https://..."; Attachments:`. ارفع `messages.inbound.byChannel.bluebubbles` بحيث يغطي هذا الفاصل بهامش مريح.

3. **الطوابع الزمنية لـ JSONL الخاصة بالجلسة ≠ وقت وصول webhook.** تعكس الطوابع الزمنية لأحداث الجلسة (`~/.openclaw/agents/<id>/sessions/*.jsonl`) وقت تسليم Gateway للرسالة إلى الوكيل، **وليس** وقت وصول webhook. إذا وُسمت رسالة ثانية في قائمة الانتظار بعبارة `[Queued messages while agent was busy]` فهذا يعني أن الدور الأول كان لا يزال قيد التشغيل عندما وصل webhook الثاني — وكانت حاوية الدمج قد أُفرغت بالفعل. اضبط النافذة بالاستناد إلى سجل خادم BB، لا سجل الجلسة.

4. **ضغط الذاكرة يبطئ إرسال الرد.** على الأجهزة الأصغر (8 GB)، قد تستغرق أدوار الوكيل وقتًا طويلًا بما يكفي لتُفرغ حاوية الدمج قبل اكتمال الرد، فتصل URL كدور ثانٍ في قائمة الانتظار. تحقّق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ وإذا كان Gateway يتجاوز ~500 MB RSS وكان الضاغط نشطًا، فأغلق العمليات الثقيلة الأخرى أو انتقل إلى مضيف أكبر.

5. **إرسالات الاقتباس-بالرد مسار مختلف.** إذا نقر المستخدم على `Dump` باعتباره **ردًا** على فقاعة URL موجودة (ويعرض iMessage شارة "1 Reply" على فقاعة Dump)، فإن URL يكون في `replyToBody` وليس في webhook ثانٍ. لا ينطبق الدمج هنا — فهذا أمر متعلق بـ skill/prompt وليس debouncer.

## البث على شكل كتل

تحكم في ما إذا كانت الردود تُرسل كرسالة واحدة أو تُبث على شكل كتل:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // تمكين البث على شكل كتل (معطّل افتراضيًا)
    },
  },
}
```

## الوسائط + الحدود

- يتم تنزيل المرفقات الواردة وتخزينها في ذاكرة الوسائط المؤقتة.
- حد الوسائط عبر `channels.bluebubbles.mediaMaxMb` للوسائط الواردة والصادرة (الافتراضي: 8 MB).
- يتم تقسيم النص الصادر إلى أجزاء بحسب `channels.bluebubbles.textChunkLimit` (الافتراضي: 4000 حرف).

## مرجع التهيئة

التهيئة الكاملة: [التهيئة](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.bluebubbles.enabled`: تمكين/تعطيل القناة.
- `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لـ BlueBubbles REST API.
- `channels.bluebubbles.password`: كلمة مرور API.
- `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (الافتراضي: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: `pairing`).
- `channels.bluebubbles.allowFrom`: قائمة السماح للرسائل الخاصة (المعرّفات، ورسائل البريد الإلكتروني، وأرقام E.164، و`chat_id:*`، و`chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: ‏`open | allowlist | disabled` (الافتراضي: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: قائمة السماح لمرسلي المجموعات.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء اختياري للمشاركين غير المسمّين في المجموعات من Contacts المحلي بعد اجتياز البوابات. الافتراضي: `false`.
- `channels.bluebubbles.groups`: إعدادات لكل مجموعة (`requireMention`، وما إلى ذلك).
- `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
- `channels.bluebubbles.blockStreaming`: تمكين البث على شكل كتل (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
- `channels.bluebubbles.textChunkLimit`: حجم الجزء الصادر بالأحرف (الافتراضي: 4000).
- `channels.bluebubbles.sendTimeoutMs`: مهلة كل طلب بالميلي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها في إعدادات macOS 26 حيث قد تتوقف عمليات إرسال iMessage عبر Private API لأكثر من 60 ثانية داخل إطار عمل iMessage؛ مثلًا `45000` أو `60000`. ما تزال الفحوصات، وعمليات البحث عن الدردشات، والتفاعلات، والتعديلات، وفحوصات السلامة تستخدم حاليًا الافتراضي الأقصر وهو 10 ثوانٍ؛ ومن المخطط توسيع التغطية لتشمل التفاعلات والتعديلات لاحقًا. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: ‏`length` (الافتراضي) يجزّئ فقط عند تجاوز `textChunkLimit`؛ أما `newline` فيجزّئ عند الأسطر الفارغة (حدود الفقرات) قبل التجزئة حسب الطول.
- `channels.bluebubbles.mediaMaxMb`: الحد الأقصى للوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
- `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة للمجلدات المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. تُرفض عمليات إرسال المسارات المحلية افتراضيًا ما لم تتم تهيئة هذا الخيار. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhooks متتالية من المرسل نفسه في الرسائل الخاصة ضمن دور وكيل واحد بحيث يصل الإرسال المقسّم من Apple للنص + URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج رسائل DM المقسّمة عند الإرسال](#coalescing-split-send-dms-command--url-in-one-composition) للاطلاع على السيناريوهات، وضبط النافذة، والمقايضات. يوسّع هذا نافذة إزالة الارتداد الافتراضية للرسائل الواردة من 500 ms إلى 2500 ms عند التمكين بدون `messages.inbound.byChannel.bluebubbles` صريح.
- `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعات في السياق (القيمة 0 تعطلها).
- `channels.bluebubbles.dmHistoryLimit`: حد سجل الرسائل الخاصة.
- `channels.bluebubbles.actions`: تمكين/تعطيل إجراءات محددة.
- `channels.bluebubbles.accounts`: تهيئة متعددة الحسابات.

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## العنونة / أهداف التسليم

فضّل `chat_guid` للتوجيه المستقر:

- `chat_guid:iMessage;-;+15555550123` (مفضّل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعرّفات المباشرة: `+15555550123`، `user@example.com`
  - إذا لم يكن للمعرّف المباشر دردشة DM موجودة، فسينشئ OpenClaw واحدة عبر `POST /api/v1/chat/new`. يتطلب ذلك تمكين BlueBubbles Private API.

## الأمان

- تتم مصادقة طلبات Webhook من خلال مقارنة معلمات الاستعلام أو الترويسات `guid`/`password` مع `channels.bluebubbles.password`.
- حافظ على سرية كلمة مرور API ونقطة نهاية Webhook (تعامل معهما كبيانات اعتماد).
- لا يوجد تجاوز localhost لمصادقة BlueBubbles webhook. إذا كنت تمرر حركة Webhook عبر proxy، فاحتفظ بكلمة مرور BlueBubbles ضمن الطلب من البداية إلى النهاية. لا يحل `gateway.trustedProxies` محل `channels.bluebubbles.password` هنا. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد جدار الحماية على خادم BlueBubbles إذا كنت ستكشفه خارج شبكتك المحلية.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات BlueBubbles webhook وتأكد من أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles private API (`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يوفّرها.
- يتطلب edit/unsend نظام macOS 13+ وإصدارًا متوافقًا من خادم BlueBubbles. على macOS 26 ‏(Tahoe)، يكون التعديل معطّلًا حاليًا بسبب تغييرات private API.
- قد تكون تحديثات أيقونة المجموعة غير مستقرة على macOS 26 ‏(Tahoe): فقد تُرجع API نجاحًا لكن الأيقونة الجديدة لا تتزامن.
- يقوم OpenClaw بإخفاء الإجراءات المعروفة بأنها معطّلة تلقائيًا استنادًا إلى إصدار macOS الخاص بخادم BlueBubbles. إذا ظل edit ظاهرًا على macOS 26 ‏(Tahoe)، فعطّله يدويًا باستخدام `channels.bluebubbles.actions.edit=false`.
- إذا كان `coalesceSameSenderDms` مفعّلًا لكن الإرسالات المقسّمة (مثل `Dump` + URL) ما زالت تصل على شكل دورين، فراجع قائمة التحقق في [استكشاف أخطاء دمج الإرسال المقسّم وإصلاحها](#split-send-coalescing-troubleshooting) — من الأسباب الشائعة نافذة إزالة ارتداد ضيقة جدًا، أو إساءة فهم الطوابع الزمنية في سجل الجلسة على أنها وقت وصول webhook، أو إرسال اقتباس-بالرد (الذي يستخدم `replyToBody` وليس webhook ثانيًا).
- للحصول على معلومات الحالة/السلامة: `openclaw status --all` أو `openclaw status --deep`.

للاطلاع على مرجع سير العمل العام للقنوات، راجع [نظرة عامة على القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وبوابة الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
