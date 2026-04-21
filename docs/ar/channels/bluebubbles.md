---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء اقتران Webhook وإصلاحها
    - تهيئة iMessage على macOS
summary: iMessage عبر خادم BlueBubbles على macOS (إرسال/استقبال عبر REST، الكتابة، التفاعلات، الاقتران، الإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T07:18:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3d8d617fc86ca1b191ff4dd2ae26b464e4d3f456a79c67b484a3a76d75de0d2
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles ‏(REST على macOS)

الحالة: Plugin مضمّن يتحدث إلى خادم BlueBubbles على macOS عبر HTTP. **موصى به لدمج iMessage** بسبب واجهة API الأكثر ثراءً وسهولة الإعداد مقارنةً بقناة imsg القديمة.

## Plugin مضمّن

تتضمن إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج البنيات المجمعة العادية
إلى خطوة `openclaw plugins install` منفصلة.

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- الموصى به/المختبَر: macOS Sequoia ‏(15). يعمل macOS Tahoe ‏(26)؛ التحرير معطل حاليًا على Tahoe، وقد تُبلّغ تحديثات أيقونات المجموعات عن النجاح لكنها لا تتزامن.
- يتواصل OpenClaw معه عبر واجهة REST API الخاصة به (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhook؛ أما الردود الصادرة ومؤشرات الكتابة وإيصالات القراءة وTapbacks فتتم عبر استدعاءات REST.
- تُستوعب المرفقات والملصقات كوسائط واردة (وتُعرض للوكيل عند الإمكان).
- يعمل الاقتران/قائمة السماح بالطريقة نفسها كما في القنوات الأخرى (`/channels/pairing` وما إلى ذلك) باستخدام `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تُعرَض التفاعلات كأحداث نظام تمامًا مثل Slack/Telegram حتى تتمكن الوكلاء من "ذكرها" قبل الرد.
- الميزات المتقدمة: التحرير، إلغاء الإرسال، الترابط في الردود، تأثيرات الرسائل، إدارة المجموعات.

## بدء سريع

1. ثبّت خادم BlueBubbles على جهاز Mac الخاص بك (اتبع التعليمات على [bluebubbles.app/install](https://bluebubbles.app/install)).
2. في إعداد BlueBubbles، فعّل web API واضبط كلمة مرور.
3. شغّل `openclaw onboard` واختر BlueBubbles، أو اضبطه يدويًا:

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

4. وجّه Webhook الخاصة بـ BlueBubbles إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. ابدأ Gateway؛ سيسجل معالج Webhook ويبدأ الاقتران.

ملاحظة أمنية:

- احرص دائمًا على تعيين كلمة مرور لـ Webhook.
- تكون مصادقة Webhook مطلوبة دائمًا. يرفض OpenClaw طلبات Webhook الخاصة بـ BlueBubbles ما لم تتضمن كلمة مرور/guid يطابق `channels.bluebubbles.password` (مثلًا `?password=<password>` أو `x-password`) بصرف النظر عن بنية loopback/proxy.
- يتم التحقق من مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook كاملةً.

## إبقاء Messages.app نشطًا (إعدادات VM / بدون واجهة)

يمكن أن تنتهي بعض إعدادات macOS VM / التشغيل الدائم إلى دخول Messages.app في حالة “خمول” (تتوقف الأحداث الواردة إلى أن يتم فتح التطبيق/جعله في الواجهة). أحد الحلول البسيطة هو **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

### 1) احفظ AppleScript

احفظ هذا الملف باسم:

- `~/Scripts/poke-messages.scpt`

مثال على script (غير تفاعلي؛ لا يسرق التركيز):

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

احفظ هذا الملف باسم:

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
- قد يؤدي التشغيل الأول إلى ظهور مطالبات **Automation** في macOS (`osascript` → Messages). وافق عليها في جلسة المستخدم نفسها التي تشغّل LaunchAgent.

حمّله:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## الإعداد التفاعلي

يتوفر BlueBubbles في الإعداد التفاعلي:

```
openclaw onboard
```

يعرض المعالج مطالبات لما يلي:

- **Server URL** ‏(مطلوب): عنوان خادم BlueBubbles (مثلًا `http://192.168.1.100:1234`)
- **Password** ‏(مطلوب): كلمة مرور API من إعدادات BlueBubbles Server
- **Webhook path** ‏(اختياري): القيمة الافتراضية هي `/bluebubbles-webhook`
- **سياسة الرسائل الخاصة**: pairing، أو allowlist، أو open، أو disabled
- **قائمة السماح**: أرقام الهواتف أو عناوين البريد الإلكتروني أو أهداف الدردشة

يمكنك أيضًا إضافة BlueBubbles عبر CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل الخاصة + المجموعات)

الرسائل الخاصة:

- الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ ويتم تجاهل الرسائل حتى تتم الموافقة عليهم (تنتهي صلاحية الرموز بعد ساعة واحدة).
- وافق عبر:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- الاقتران هو تبادل الرموز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)

المجموعات:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
- يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التفعيل في المجموعات عند ضبط `allowlist`.

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبًا ما تتضمن Webhook الخاصة بمجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا كنت تريد أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلًا من ذلك، فيمكنك تفعيل إثراء جهات الاتصال المحلية على macOS:

- يفعّل `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` البحث. الافتراضي: `false`.
- لا تُجرى عمليات البحث إلا بعد أن يسمح الوصول إلى المجموعة وتفويض الأوامر وبوابة الذكر بمرور الرسالة.
- يتم إثراء المشاركين الهاتفيين غير المسمّين فقط.
- تبقى أرقام الهواتف الخام كحل احتياطي عند عدم العثور على تطابق محلي.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### بوابة الذكر (المجموعات)

يدعم BlueBubbles بوابة الذكر لمحادثات المجموعات، بما يتوافق مع سلوك iMessage/WhatsApp:

- يستخدم `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`) لاكتشاف الإشارات.
- عند تفعيل `requireMention` لمجموعة ما، لا يرد الوكيل إلا عند ذكره.
- تتجاوز أوامر التحكم من المرسلين المخولين بوابة الذكر.

إعداد لكل مجموعة:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // الافتراضي لكل المجموعات
        "iMessage;-;chat123": { requireMention: false }, // تجاوز لمجموعة محددة
      },
    },
  },
}
```

### بوابة الأوامر

- تتطلب أوامر التحكم (مثل `/config` و`/model`) تفويضًا.
- تستخدم `allowFrom` و`groupAllowFrom` لتحديد تفويض الأوامر.
- يمكن للمرسلين المخولين تشغيل أوامر التحكم حتى دون ذكر في المجموعات.

### prompt نظام لكل مجموعة

تقبل كل قيمة ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن هذه القيمة في prompt النظام الخاصة بالوكيل في كل دور يعالج رسالة في تلك المجموعة، بحيث يمكنك ضبط شخصية أو قواعد سلوكية لكل مجموعة دون تعديل prompts الوكيل:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "اجعل الردود أقل من 3 جمل. وحاكِ النبرة العفوية للمجموعة.",
        },
      },
    },
  },
}
```

يطابق المفتاح أي قيمة يبلغ عنها BlueBubbles باعتبارها `chatGuid` / `chatIdentifier` / `chatId` رقميًا للمجموعة، وتوفر قيمة wildcard `"*"` افتراضيًا لكل مجموعة لا تحتوي على تطابق دقيق (وهو النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تتغلب المطابقات الدقيقة دائمًا على wildcard. تتجاهل الرسائل الخاصة هذا الحقل؛ استخدم بدلًا من ذلك تخصيص prompt على مستوى الوكيل أو الحساب.

#### مثال عملي: الردود المترابطة وتفاعلات tapback ‏(Private API)

عند تفعيل BlueBubbles Private API، تصل الرسائل الواردة مع معرّفات رسائل قصيرة (مثل `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للرد داخل سلسلة رسالة محددة أو `action=react` لإضافة tapback. يُعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "عند الرد في هذه المجموعة، استدعِ دائمًا action=reply مع",
            "messageId من النوع [[reply_to:N]] من السياق حتى يظهر ردك",
            "ضمن سلسلة الرسالة المُشغِّلة. لا ترسل أبدًا رسالة جديدة غير مرتبطة.",
            "",
            "بالنسبة إلى الإقرارات القصيرة ('ok' و'got it' و'on it')، استخدم",
            "action=react مع رمز tapback تعبيري مناسب (❤️, 👍, 😂, ‼️, ❓)",
            "بدلًا من إرسال رد نصي.",
          ].join(" "),
        },
      },
    },
  },
}
```

تتطلب تفاعلات Tapback والردود المترابطة كلتاهما BlueBubbles Private API؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) لمعرفة الآليات الأساسية.

## ارتباطات محادثات ACP

يمكن تحويل محادثات BlueBubbles إلى مساحات عمل ACP دائمة من دون تغيير طبقة النقل.

تدفق العمل السريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة الخاصة أو محادثة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يُغلق `/acp close` جلسة ACP ويزيل الارتباط.

تتوفر أيضًا الارتباطات الدائمة المُهيأة عبر إدخالات `bindings[]` من المستوى الأعلى باستخدام `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن أن يستخدم `match.peer.id` أي صيغة هدف مدعومة في BlueBubbles:

- معرّف DM مُطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

بالنسبة إلى ارتباطات المجموعات المستقرة، يُفضَّل `chat_id:*` أو `chat_identifier:*`.

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

راجع [وكلاء ACP](/ar/tools/acp-agents) لمعرفة سلوك ارتباطات ACP المشتركة.

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسَل تلقائيًا قبل إنشاء الرد وأثناءه.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
- **مؤشرات الكتابة**: يرسل OpenClaw أحداث بدء الكتابة؛ ويقوم BlueBubbles بمسح حالة الكتابة تلقائيًا عند الإرسال أو انتهاء المهلة (الإيقاف اليدوي عبر DELETE غير موثوق).

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

يدعم BlueBubbles إجراءات الرسائل المتقدمة عند تفعيلها في الإعداد:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks ‏(الافتراضي: true)
        edit: true, // تحرير الرسائل المرسلة (macOS 13+، معطل على macOS 26 Tahoe)
        unsend: true, // إلغاء إرسال الرسائل (macOS 13+)
        reply: true, // ترابط الردود حسب GUID الرسالة
        sendWithEffect: true, // تأثيرات الرسائل (slam، loud، إلخ)
        renameGroup: true, // إعادة تسمية محادثات المجموعات
        setGroupIcon: true, // تعيين أيقونة/صورة محادثة المجموعة (غير مستقر على macOS 26 Tahoe)
        addParticipant: true, // إضافة مشاركين إلى المجموعات
        removeParticipant: true, // إزالة مشاركين من المجموعات
        leaveGroup: true, // مغادرة محادثات المجموعات
        sendAttachment: true, // إرسال المرفقات/الوسائط
      },
    },
  },
}
```

الإجراءات المتاحة:

- **react**: إضافة/إزالة تفاعلات tapback ‏(`messageId`, `emoji`, `remove`)
- **edit**: تحرير رسالة مرسلة (`messageId`, `text`)
- **unsend**: إلغاء إرسال رسالة (`messageId`)
- **reply**: الرد على رسالة محددة (`messageId`, `text`, `to`)
- **sendWithEffect**: الإرسال مع تأثير iMessage ‏(`text`, `to`, `effectId`)
- **renameGroup**: إعادة تسمية محادثة مجموعة (`chatGuid`, `displayName`)
- **setGroupIcon**: تعيين أيقونة/صورة محادثة مجموعة (`chatGuid`, `media`) — غير مستقر على macOS 26 Tahoe (قد تُرجع API نجاحًا لكن الأيقونة لا تتزامن).
- **addParticipant**: إضافة شخص إلى مجموعة (`chatGuid`, `address`)
- **removeParticipant**: إزالة شخص من مجموعة (`chatGuid`, `address`)
- **leaveGroup**: مغادرة محادثة مجموعة (`chatGuid`)
- **upload-file**: إرسال وسائط/ملفات (`to`, `buffer`, `filename`, `asVoice`)
  - المذكرات الصوتية: اضبط `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يحول BlueBubbles ملفات MP3 → CAF عند إرسال المذكرات الصوتية.
- الاسم المستعار القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو اسم الإجراء الأساسي.

### معرّفات الرسائل (قصيرة مقابل كاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1` و`2`) لتوفير الرموز.

- يمكن أن تكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- تحتوي `MessageSidFull` / `ReplyToIdFull` على المعرّفات الكاملة لدى المزوّد.
- المعرفات القصيرة موجودة في الذاكرة؛ وقد تنتهي صلاحيتها عند إعادة التشغيل أو إخلاء cache.
- تقبل الإجراءات `messageId` القصير أو الكامل، لكن المعرّفات القصيرة ستُرجع خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة لعمليات الأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولة الواردة

راجع [الإعداد](/ar/gateway/configuration) لمتغيرات القوالب.

## بث الكتل

تحكم في ما إذا كانت الردود تُرسل كرسالة واحدة أو تُبث على شكل كتل:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // تفعيل بث الكتل (معطل افتراضيًا)
    },
  },
}
```

## الوسائط + الحدود

- تُنزَّل المرفقات الواردة وتُخزَّن في cache الوسائط.
- حد الوسائط عبر `channels.bluebubbles.mediaMaxMb` للوسائط الواردة والصادرة (الافتراضي: 8 MB).
- يُقسَّم النص الصادر إلى أجزاء وفق `channels.bluebubbles.textChunkLimit` (الافتراضي: 4000 حرف).

## مرجع الإعداد

الإعداد الكامل: [الإعداد](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.bluebubbles.enabled`: تفعيل/تعطيل القناة.
- `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لـ BlueBubbles REST API.
- `channels.bluebubbles.password`: كلمة مرور API.
- `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (الافتراضي: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: `pairing`).
- `channels.bluebubbles.allowFrom`: قائمة السماح للرسائل الخاصة (المعرّفات، والبريد الإلكتروني، وأرقام E.164، و`chat_id:*`، و`chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: ‏`open | allowlist | disabled` (الافتراضي: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: قائمة السماح لمرسلي المجموعات.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء المشاركين غير المسمّين في المجموعات من تطبيق Contacts المحلي بعد اجتياز البوابة. الافتراضي: `false`.
- `channels.bluebubbles.groups`: إعداد لكل مجموعة (`requireMention`، إلخ).
- `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
- `channels.bluebubbles.blockStreaming`: تفعيل بث الكتل (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
- `channels.bluebubbles.textChunkLimit`: حجم الجزء الصادر بالأحرف (الافتراضي: 4000).
- `channels.bluebubbles.sendTimeoutMs`: مهلة كل طلب بالمللي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها في إعدادات macOS 26 حيث قد تتوقف عمليات إرسال iMessage عبر Private API لمدة 60+ ثانية داخل إطار iMessage؛ مثلًا `45000` أو `60000`. لا تزال المجسات وعمليات بحث الدردشة والتفاعلات والتحريرات وفحوصات السلامة تستخدم افتراضيًا المهلة الأقصر البالغة 10 ثوانٍ؛ ومن المخطط توسيع التغطية لتشمل التفاعلات والتحريرات لاحقًا. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: القيمة `length` (الافتراضية) تقسّم فقط عند تجاوز `textChunkLimit`؛ أما `newline` فتقسم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.bluebubbles.mediaMaxMb`: حد الوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
- `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة للدلائل المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. تُرفض عمليات إرسال المسارات المحلية افتراضيًا ما لم يتم إعداد هذا الخيار. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعات في السياق (0 يعطّل ذلك).
- `channels.bluebubbles.dmHistoryLimit`: حد سجل الرسائل الخاصة.
- `channels.bluebubbles.actions`: تفعيل/تعطيل إجراءات محددة.
- `channels.bluebubbles.accounts`: إعداد متعدد الحسابات.

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## العنونة / أهداف التسليم

فضّل `chat_guid` للتوجيه المستقر:

- `chat_guid:iMessage;-;+15555550123` (المفضل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعرّفات المباشرة: `+15555550123`, `user@example.com`
  - إذا لم يكن للمعرّف المباشر محادثة DM موجودة، فسينشئ OpenClaw واحدة عبر `POST /api/v1/chat/new`. يتطلب ذلك تفعيل BlueBubbles Private API.

## الأمان

- تتم مصادقة طلبات Webhook بمقارنة معامِلات الاستعلام `guid`/`password` أو الرؤوس مع `channels.bluebubbles.password`.
- حافظ على سرية كلمة مرور API ونقطة نهاية Webhook (تعامل معها كبيانات اعتماد).
- لا يوجد تجاوز localhost لمصادقة Webhook في BlueBubbles. إذا كنت تمرر حركة Webhook عبر proxy، فاحتفظ بكلمة مرور BlueBubbles في الطلب من طرف إلى طرف. لا يحل `gateway.trustedProxies` محل `channels.bluebubbles.password` هنا. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد الجدار الناري على خادم BlueBubbles إذا كنت ستعرّضه خارج LAN الخاصة بك.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات Webhook الخاصة بـ BlueBubbles وتأكد من أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles private API ‏(`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يوفّرها.
- يتطلب التحرير/إلغاء الإرسال macOS 13+ وإصدارًا متوافقًا من خادم BlueBubbles. على macOS 26 ‏(Tahoe)، التعـرير معطل حاليًا بسبب تغييرات في private API.
- قد تكون تحديثات أيقونات المجموعات غير مستقرة على macOS 26 ‏(Tahoe): قد تُرجع API نجاحًا لكن الأيقونة الجديدة لا تتزامن.
- يُخفي OpenClaw تلقائيًا الإجراءات المعروفة بأنها معطلة بناءً على إصدار macOS الخاص بخادم BlueBubbles. إذا ظل التحرير ظاهرًا على macOS 26 ‏(Tahoe)، فعطّله يدويًا باستخدام `channels.bluebubbles.actions.edit=false`.
- للحصول على معلومات الحالة/السلامة: `openclaw status --all` أو `openclaw status --deep`.

للاطلاع على مرجع عام لسير عمل القنوات، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وبوابة الذكر
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
