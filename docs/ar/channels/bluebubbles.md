---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء اقتران Webhook وإصلاحها
    - تهيئة iMessage على macOS
summary: iMessage عبر خادم BlueBubbles على macOS (إرسال/استقبال عبر REST، والكتابة، والتفاعلات، والاقتران، والإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T07:18:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

الحالة: Plugin مضمّن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. **موصى به لدمج iMessage** بسبب واجهته البرمجية الأغنى وسهولة إعداده مقارنة بقناة imsg القديمة.

## Plugin مضمّن

تتضمن إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج الإصدارات المجمعة العادية
إلى خطوة منفصلة لتشغيل `openclaw plugins install`.

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- الموصى به/المختبَر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ لكن التعديل معطل حاليًا على Tahoe، وقد تُبلّغ تحديثات أيقونة المجموعة عن النجاح من دون أن تتم مزامنتها.
- يتواصل OpenClaw معه عبر واجهة REST API الخاصة به (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhook؛ أما الردود الصادرة ومؤشرات الكتابة وإيصالات القراءة وtapbacks فهي استدعاءات REST.
- تُستوعَب المرفقات والملصقات كوسائط واردة (وتُعرَض للوكيل عند الإمكان).
- يعمل الاقتران/قائمة السماح بالطريقة نفسها كما في القنوات الأخرى (`/channels/pairing` وغيرها) باستخدام `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تظهر التفاعلات كأحداث نظام تمامًا مثل Slack/Telegram حتى تتمكن الوكلاء من "ذكرها" قبل الرد.
- الميزات المتقدمة: التعديل، وإلغاء الإرسال، والردود المترابطة، وتأثيرات الرسائل، وإدارة المجموعات.

## البدء السريع

1. ثبّت خادم BlueBubbles على جهاز Mac الخاص بك (اتبع التعليمات في [bluebubbles.app/install](https://bluebubbles.app/install)).
2. في إعدادات BlueBubbles، فعّل Web API وحدد كلمة مرور.
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
5. ابدأ تشغيل Gateway؛ وسيقوم بتسجيل معالج Webhook وبدء الاقتران.

ملاحظة أمنية:

- احرص دائمًا على تعيين كلمة مرور لـ Webhook.
- مصادقة Webhook مطلوبة دائمًا. يرفض OpenClaw طلبات Webhook الخاصة بـ BlueBubbles ما لم تتضمن كلمة مرور/`guid` يطابق `channels.bluebubbles.password` (مثل `?password=<password>` أو `x-password`)، بغض النظر عن بنية local loopback/proxy.
- يتم التحقق من مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook بالكامل.

## إبقاء Messages.app نشطًا (إعدادات VM / بدون واجهة)

قد تنتهي بعض إعدادات macOS VM / التشغيل الدائم إلى أن يصبح Messages.app في حالة "خمول" (تتوقف الأحداث الواردة حتى يُفتح التطبيق/يوضع في الواجهة الأمامية). يتمثل حل بسيط في **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

### 1) احفظ AppleScript

احفظ هذا الملف باسم:

- `~/Scripts/poke-messages.scpt`

نموذج للسكربت (غير تفاعلي؛ لا يسرق التركيز):

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

- يتم تشغيل هذا **كل 300 ثانية** و**عند تسجيل الدخول**.
- قد يؤدي التشغيل الأول إلى ظهور مطالبات macOS الخاصة بـ **Automation** (`osascript` → Messages). وافق عليها في جلسة المستخدم نفسها التي تشغل LaunchAgent.

حمّله:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## الإعداد الأولي

يتوفر BlueBubbles ضمن الإعداد التفاعلي:

```
openclaw onboard
```

يطلب المعالج ما يلي:

- **Server URL** (مطلوب): عنوان خادم BlueBubbles (مثل `http://192.168.1.100:1234`)
- **Password** (مطلوب): كلمة مرور API من إعدادات BlueBubbles Server
- **Webhook path** (اختياري): القيمة الافتراضية هي `/bluebubbles-webhook`
- **DM policy**: pairing، أو allowlist، أو open، أو disabled
- **Allow list**: أرقام هواتف أو عناوين بريد إلكتروني أو أهداف دردشة

يمكنك أيضًا إضافة BlueBubbles عبر CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل الخاصة + المجموعات)

الرسائل الخاصة:

- الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ ويتم تجاهل الرسائل حتى تتم الموافقة عليهم (تنتهي صلاحية الرموز بعد ساعة واحدة).
- الموافقة عبر:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- الاقتران هو آلية تبادل الرموز الافتراضية. التفاصيل: [الاقتران](/ar/channels/pairing)

المجموعات:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
- يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التفعيل داخل المجموعات عند ضبط `allowlist`.

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبًا ما تتضمن Webhook الخاصة بمجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا كنت تريد أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلًا من ذلك، فيمكنك تفعيل إثراء جهات الاتصال المحلية على macOS:

- يفعّل `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` عملية البحث. الافتراضي: `false`.
- لا تُجرى عمليات البحث إلا بعد أن تسمح الرسالة بمرور التحقق من وصول المجموعة، وتخويل الأوامر، وبوابة الذكر.
- يتم إثراء المشاركين الهاتفيين غير المسمّين فقط.
- تبقى أرقام الهواتف الخام هي البديل عند عدم العثور على تطابق محلي.

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

يدعم BlueBubbles بوابة الذكر لمحادثات المجموعات، بما يطابق سلوك iMessage/WhatsApp:

- يستخدم `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`) لاكتشاف الإشارات.
- عند تفعيل `requireMention` لمجموعة ما، لا يرد الوكيل إلا عند ذكره.
- تتجاوز أوامر التحكم من المرسلين المصرح لهم بوابة الذكر.

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

- تتطلب أوامر التحكم (مثل `/config` و`/model`) تخويلًا.
- يستخدم `allowFrom` و`groupAllowFrom` لتحديد تخويل الأوامر.
- يمكن للمرسلين المصرح لهم تشغيل أوامر التحكم حتى من دون ذكر في المجموعات.

### مطالبة نظام لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. يتم حقن القيمة في مطالبة النظام الخاصة بالوكيل في كل دورة تعالج رسالة في تلك المجموعة، بحيث يمكنك ضبط شخصية أو قواعد سلوكية خاصة بكل مجموعة من دون تعديل مطالبات الوكيل:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "اجعل الردود أقل من 3 جمل. وحاكِ النبرة غير الرسمية للمجموعة.",
        },
      },
    },
  },
}
```

يطابق المفتاح ما يبلّغ عنه BlueBubbles كـ `chatGuid` / `chatIdentifier` / `chatId` رقمي للمجموعة، ويوفر إدخال حرف البدل `"*"` قيمة افتراضية لكل مجموعة لا تملك تطابقًا دقيقًا (وهو النمط نفسه المستخدم مع `requireMention` وسياسات الأدوات لكل مجموعة). تتغلب التطابقات الدقيقة دائمًا على حرف البدل. تتجاهل الرسائل الخاصة هذا الحقل؛ استخدم بدلًا من ذلك تخصيص المطالبة على مستوى الوكيل أو الحساب.

#### مثال عملي: الردود المترابطة وتفاعلات tapback (Private API)

مع تفعيل BlueBubbles Private API، تصل الرسائل الواردة ومعها معرّفات رسائل قصيرة (مثل `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للرد ضمن سلسلة رسالة محددة أو `action=react` لإضافة tapback. تُعد `systemPrompt` الخاصة بكل مجموعة طريقة موثوقة للحفاظ على اختيار الوكيل للأداة الصحيحة:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "عند الرد في هذه المجموعة، استدعِ دائمًا action=reply مع",
            "messageId من النوع [[reply_to:N]] من السياق حتى يأتي ردك ضمن السلسلة",
            "تحت الرسالة المُفعِّلة. لا ترسل أبدًا رسالة جديدة غير مرتبطة.",
            "",
            "بالنسبة لرسائل الإقرار القصيرة ('ok' و'got it' و'on it')، استخدم",
            "action=react مع tapback emoji مناسب (❤️, 👍, 😂, ‼️, ❓)",
            "بدلًا من إرسال رد نصي.",
          ].join(" "),
        },
      },
    },
  },
}
```

تتطلب تفاعلات tapback والردود المترابطة كلاهما BlueBubbles Private API؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) للاطلاع على الآليات الأساسية.

## ارتباطات محادثات ACP

يمكن تحويل دردشات BlueBubbles إلى مساحات عمل ACP دائمة من دون تغيير طبقة النقل.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة الخاصة أو دردشة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

تدعم الارتباطات الدائمة المُعدّة أيضًا عبر إدخالات `bindings[]` من المستوى الأعلى باستخدام `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن أن يستخدم `match.peer.id` أي صيغة هدف BlueBubbles مدعومة:

- معرّف DM مُطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

بالنسبة إلى ارتباطات المجموعات الثابتة، يُفضّل استخدام `chat_id:*` أو `chat_identifier:*`.

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

راجع [وكلاء ACP](/ar/tools/acp-agents) للاطلاع على سلوك ارتباط ACP المشترك.

## مؤشرات الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسل تلقائيًا قبل إنشاء الرد وأثناءه.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
- **مؤشرات الكتابة**: يرسل OpenClaw أحداث بدء الكتابة؛ ويقوم BlueBubbles بمسح حالة الكتابة تلقائيًا عند الإرسال أو عند انتهاء المهلة (الإيقاف اليدوي عبر DELETE غير موثوق).

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

يدعم BlueBubbles إجراءات الرسائل المتقدمة عند تفعيلها في الإعدادات:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (الافتراضي: true)
        edit: true, // تعديل الرسائل المرسلة (macOS 13+، معطل على macOS 26 Tahoe)
        unsend: true, // إلغاء إرسال الرسائل (macOS 13+)
        reply: true, // الردود المترابطة حسب message GUID
        sendWithEffect: true, // تأثيرات الرسائل (slam, loud, إلخ)
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

- **react**: إضافة/إزالة تفاعلات tapback (`messageId`, `emoji`, `remove`). مجموعة tapback الأصلية في iMessage هي `love` و`like` و`dislike` و`laugh` و`emphasize` و`question`. عندما يختار الوكيل emoji خارج هذه المجموعة (مثل `👀`)، تعود أداة التفاعل إلى `love` حتى يستمر عرض tapback بدلًا من فشل الطلب بالكامل. أما تفاعلات الإقرار المُعدّة فتظل تتحقق بدقة وتُرجع خطأ عند القيم غير المعروفة.
- **edit**: تعديل رسالة مرسلة (`messageId`, `text`)
- **unsend**: إلغاء إرسال رسالة (`messageId`)
- **reply**: الرد على رسالة محددة (`messageId`, `text`, `to`)
- **sendWithEffect**: الإرسال مع تأثير iMessage (`text`, `to`, `effectId`)
- **renameGroup**: إعادة تسمية دردشة مجموعة (`chatGuid`, `displayName`)
- **setGroupIcon**: تعيين أيقونة/صورة دردشة مجموعة (`chatGuid`, `media`) — غير مستقر على macOS 26 Tahoe (قد تُرجع API نجاحًا لكن لا تتم مزامنة الأيقونة).
- **addParticipant**: إضافة شخص إلى مجموعة (`chatGuid`, `address`)
- **removeParticipant**: إزالة شخص من مجموعة (`chatGuid`, `address`)
- **leaveGroup**: مغادرة دردشة مجموعة (`chatGuid`)
- **upload-file**: إرسال وسائط/ملفات (`to`, `buffer`, `filename`, `asVoice`)
  - المذكرات الصوتية: اضبط `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يحوّل BlueBubbles صيغة MP3 إلى CAF عند إرسال المذكرات الصوتية.
- الاسم المستعار القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو اسم الإجراء القياسي.

### معرّفات الرسائل (القصيرة مقابل الكاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1` و`2`) لتوفير عدد الرموز.

- يمكن أن يكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- يحتوي `MessageSidFull` / `ReplyToIdFull` على المعرّفات الكاملة لدى المزوّد.
- المعرفات القصيرة تكون في الذاكرة؛ وقد تنتهي صلاحيتها عند إعادة التشغيل أو عند إخلاء cache.
- تقبل الإجراءات `messageId` القصير أو الكامل، لكن المعرفات القصيرة ستُرجع خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة للأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [التهيئة](/ar/gateway/configuration) لمتغيرات القوالب.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## دمج الرسائل الخاصة المقسّمة عند الإرسال (أمر + URL في عملية كتابة واحدة)

عندما يكتب المستخدم أمرًا وURL معًا في iMessage — مثل `Dump https://example.com/article` — تقوم Apple بتقسيم الإرسال إلى **عمليتي تسليم Webhook منفصلتين**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

تصل عمليتا Webhook إلى OpenClaw بفاصل يقارب ~0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدورة 1، ويرد (غالبًا "أرسل لي URL")، ثم لا يرى URL إلا في الدورة 2 — وعندها يكون سياق الأمر قد فُقد بالفعل.

يؤدي `channels.bluebubbles.coalesceSameSenderDms` إلى ضم Webhook المتتالية من المرسل نفسه في الرسائل الخاصة ضمن دورة وكيل واحدة. وتستمر دردشات المجموعات في الاعتماد على كل رسالة على حدة حتى يبقى هيكل الأدوار متعدد المستخدمين محفوظًا.

### متى ينبغي التفعيل

فعّل هذا عندما:

- تنشر Skills تتوقع `command + payload` في رسالة واحدة (dump، paste، save، queue، إلخ).
- يلصق المستخدمون URL أو صورًا أو محتوى طويلًا إلى جانب الأوامر.
- يمكنك تقبل زيادة زمن الانتظار في دور الرسائل الخاصة (انظر أدناه).

اتركه معطلًا عندما:

- تحتاج أقل زمن انتظار ممكن لأوامر الرسائل الخاصة القصيرة من كلمة واحدة.
- كل التدفقات لديك هي أوامر أحادية اللقطة من دون حمولات لاحقة.

### التفعيل

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // تفعيل اختياري (الافتراضي: false)
    },
  },
}
```

عند تفعيل هذا الخيار، ومن دون ضبط صريح لـ `messages.inbound.byChannel.bluebubbles`، تتسع نافذة debounce إلى **2500 ms** (الافتراضي في حالة عدم الدمج هو 500 ms). هذه النافذة الأوسع مطلوبة — لأن نمط الإرسال المقسّم من Apple بين 0.8 و2.0 ثانية لا ينسجم مع الافتراضي الأضيق.

لضبط النافذة يدويًا:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms تعمل في معظم الإعدادات؛ ارفعها إلى 4000 ms إذا كان Mac بطيئًا
        // أو تحت ضغط الذاكرة (إذ يمكن أن يمتد الفاصل المرصود إلى أكثر من ثانيتين حينها).
        bluebubbles: 2500,
      },
    },
  },
}
```

### المقايضات

- **زيادة زمن الانتظار لأوامر التحكم في الرسائل الخاصة.** عند تفعيل هذا الخيار، تنتظر رسائل أوامر التحكم في الرسائل الخاصة (مثل `Dump` و`Save` وما إلى ذلك) الآن حتى نهاية نافذة debounce قبل الإرسال، تحسبًا لوصول Webhook حمولة لاحقة. أما أوامر دردشات المجموعات فتظل تُرسل فورًا.
- **الناتج المدمج محدود** — يُحد النص المدمج عند 4000 حرف مع علامة `…[truncated]` صريحة؛ وتُحد المرفقات عند 20؛ وتُحد إدخالات المصدر عند 10 (مع الاحتفاظ بالأول والأحدث بعد ذلك). يظل كل `messageId` من المصدر يصل إلى inbound-dedupe بحيث يُتعرّف على أي إعادة تشغيل لاحقة لأي حدث فردي من MessagePoller على أنها مكررة.
- **خيار تفعيل لكل قناة.** لا تتأثر القنوات الأخرى (Telegram وWhatsApp وSlack و…) بذلك.

### السيناريوهات وما الذي يراه الوكيل

| ما يكتبه المستخدم                                                      | ما تسلّمه Apple            | عند تعطيل الخيار (الافتراضي)           | عند التفعيل + نافذة 2500 ms                                              |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                              | 2 Webhook بفاصل ~1 ثانية     | دورتا وكيل: "Dump" وحدها، ثم URL | دورة واحدة: نص مدمج `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (مرفق + نص)                | 2 Webhook                | دورتان                               | دورة واحدة: نص + صورة                                                  |
| `/status` (أمر مستقل)                                     | 1 Webhook                 | إرسال فوري                        | **انتظار حتى نهاية النافذة، ثم الإرسال**                                    |
| لصق URL وحده                                                   | 1 Webhook                 | إرسال فوري                        | إرسال فوري (إدخال واحد فقط في bucket)                             |
| نص + URL أُرسلا كرسالتين منفصلتين عمدًا وبينهما دقائق | 2 Webhook خارج النافذة | دورتان                               | دورتان (تنتهي النافذة بينهما)                                 |
| تدفق سريع (>10 رسائل خاصة صغيرة داخل النافذة)                          | N Webhook                | N دورات                                 | دورة واحدة، ناتج محدود (مع تطبيق حدود الأول + الأحدث وحدود النص/المرفقات) |

### استكشاف أخطاء دمج الإرسال المقسّم وإصلاحها

إذا كان الخيار مفعّلًا وما زالت الإرسالات المقسّمة تصل كدورتين، فتحقق من كل طبقة:

1. **تم تحميل الإعداد فعليًا.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   ثم `openclaw gateway restart` — إذ يُقرأ هذا الخيار عند إنشاء سجل debouncer.

2. **نافذة debounce واسعة بما يكفي لإعدادك.** انظر إلى سجل خادم BlueBubbles تحت `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   قِس الفاصل بين إرسال النص من نوع `"Dump"` والإرسال اللاحق من نوع `"https://..."; Attachments:`. ارفع قيمة `messages.inbound.byChannel.bluebubbles` بحيث تغطي هذا الفاصل بهامش مريح.

3. **الطوابع الزمنية في JSONL للجلسة ≠ وقت وصول Webhook.** تعكس طوابع أحداث الجلسة (`~/.openclaw/agents/<id>/sessions/*.jsonl`) وقت تسليم Gateway للرسالة إلى الوكيل، **وليس** وقت وصول Webhook. وتعني الرسالة الثانية الموضوعة في قائمة الانتظار مع الوسم `[Queued messages while agent was busy]` أن الدورة الأولى كانت لا تزال قيد التنفيذ عند وصول Webhook الثانية — أي أن bucket الدمج كانت قد أُفرغت بالفعل. اضبط النافذة بالاستناد إلى سجل خادم BB، لا إلى سجل الجلسة.

4. **ضغط الذاكرة يبطئ إرسال الرد.** على الأجهزة الأصغر (8 GB)، قد تستغرق دورات الوكيل وقتًا طويلًا بما يكفي لإفراغ bucket الدمج قبل اكتمال الرد، ثم يصل URL كدورة ثانية موضوعة في قائمة الانتظار. تحقق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ فإذا كان Gateway يتجاوز ~500 MB RSS وكان الضغط/الضغط التجميعي نشطًا، فأغلق العمليات الثقيلة الأخرى أو انتقل إلى مضيف أكبر.

5. **الإرسال عبر الاقتباس-رد مسار مختلف.** إذا نقر المستخدم على `Dump` كـ **رد** على فقاعة URL موجودة مسبقًا (يعرض iMessage شارة "1 Reply" على فقاعة Dump)، فإن URL يكون في `replyToBody` وليس في Webhook ثانية. لا ينطبق الدمج هنا — فهذه مسألة Skills/مطالبات وليست مسألة debouncer.

## بث الكتل

تحكم فيما إذا كانت الردود تُرسل كرسالة واحدة أو تُبث على شكل كتل:

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

## مرجع الإعدادات

الإعدادات الكاملة: [التهيئة](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.bluebubbles.enabled`: تفعيل/تعطيل القناة.
- `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لـ REST API الخاصة بـ BlueBubbles.
- `channels.bluebubbles.password`: كلمة مرور API.
- `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (الافتراضي: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).
- `channels.bluebubbles.allowFrom`: قائمة السماح للرسائل الخاصة (المعرّفات، ورسائل البريد الإلكتروني، وأرقام E.164، و`chat_id:*`، و`chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (الافتراضي: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: قائمة السماح لمرسلي المجموعات.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء المشاركين غير المسمّين في المجموعات اختياريًا من جهات الاتصال المحلية بعد اجتياز البوابات. الافتراضي: `false`.
- `channels.bluebubbles.groups`: إعدادات لكل مجموعة (`requireMention`، إلخ).
- `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
- `channels.bluebubbles.blockStreaming`: تفعيل بث الكتل (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
- `channels.bluebubbles.textChunkLimit`: حجم الجزء الصادر بالأحرف (الافتراضي: 4000).
- `channels.bluebubbles.sendTimeoutMs`: مهلة لكل طلب بالمللي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها على إعدادات macOS 26 حيث قد تتعطل عمليات إرسال iMessage عبر Private API لمدة تزيد على 60 ثانية داخل إطار عمل iMessage؛ مثلًا `45000` أو `60000`. لا تزال عمليات الفحص، وعمليات البحث عن الدردشات، والتفاعلات، والتعديلات، وفحوصات السلامة تستخدم افتراضيًا المهلة الأقصر البالغة 10 ثوانٍ؛ ومن المخطط توسيع التغطية لتشمل التفاعلات والتعديلات في متابعة لاحقة. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: القيمة `length` (الافتراضية) تقسم فقط عند تجاوز `textChunkLimit`؛ أما `newline` فتقسم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.bluebubbles.mediaMaxMb`: الحد الأقصى للوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
- `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة للمجلدات المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. تُرفض عمليات الإرسال من المسارات المحلية افتراضيًا ما لم يتم ضبط هذا الخيار. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhook المتتالية للرسائل الخاصة من المرسل نفسه ضمن دورة وكيل واحدة حتى يصل الإرسال المقسم من Apple للنص+URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج الرسائل الخاصة المقسّمة عند الإرسال](#coalescing-split-send-dms-command--url-in-one-composition) للاطلاع على السيناريوهات وضبط النافذة والمقايضات. يوسّع نافذة debounce الافتراضية للرسائل الواردة من 500 ms إلى 2500 ms عند تفعيله من دون ضبط صريح لـ `messages.inbound.byChannel.bluebubbles`.
- `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعات في السياق (القيمة 0 تعطلها).
- `channels.bluebubbles.dmHistoryLimit`: حد سجل الرسائل الخاصة.
- `channels.bluebubbles.actions`: تفعيل/تعطيل إجراءات محددة.
- `channels.bluebubbles.accounts`: إعدادات متعددة الحسابات.

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## العنونة / أهداف التسليم

يُفضَّل استخدام `chat_guid` من أجل توجيه ثابت:

- `chat_guid:iMessage;-;+15555550123` (مفضّل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعرّفات المباشرة: `+15555550123`, `user@example.com`
  - إذا لم يكن لدى معرّف مباشر دردشة DM موجودة، فسينشئ OpenClaw واحدة عبر `POST /api/v1/chat/new`. ويتطلب هذا تفعيل BlueBubbles Private API.

### توجيه iMessage مقابل SMS

عندما يكون للمعرّف نفسه كل من دردشة iMessage ودردشة SMS على جهاز Mac (مثل رقم هاتف مسجّل في iMessage ولكنه تلقى أيضًا بدائل الفقاعة الخضراء)، يفضّل OpenClaw دردشة iMessage ولا يخفضها بصمت إلى SMS. لفرض دردشة SMS، استخدم بادئة هدف `sms:` صريحة (مثل `sms:+15555550123`). أما المعرّفات التي لا تملك دردشة iMessage مطابقة فستُرسل عبر أي دردشة يبلّغ عنها BlueBubbles.

## الأمان

- تتم مصادقة طلبات Webhook عبر مقارنة معاملات الاستعلام أو الرؤوس `guid`/`password` مع `channels.bluebubbles.password`.
- حافظ على سرية كلمة مرور API ونقطة نهاية Webhook (وتعامل معهما على أنهما بيانات اعتماد).
- لا يوجد تجاوز localhost لمصادقة Webhook في BlueBubbles. إذا كنت تستخدم proxy لحركة Webhook، فأبقِ كلمة مرور BlueBubbles ضمن الطلب من طرف إلى طرف. لا يحل `gateway.trustedProxies` محل `channels.bluebubbles.password` هنا. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد الجدار الناري على خادم BlueBubbles إذا كنت ستكشفه خارج شبكتك المحلية.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات Webhook في BlueBubbles وتأكد من أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles private API (`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يوفّرها.
- يتطلب edit/unsend نظام macOS 13+ وإصدارًا متوافقًا من خادم BlueBubbles. على macOS 26 (Tahoe)، يكون edit معطلًا حاليًا بسبب تغييرات في Private API.
- قد تكون تحديثات أيقونات المجموعات غير مستقرة على macOS 26 (Tahoe): قد تُرجع API نجاحًا لكن لا تتم مزامنة الأيقونة الجديدة.
- يقوم OpenClaw بإخفاء الإجراءات المعطلة المعروفة تلقائيًا استنادًا إلى إصدار macOS الخاص بخادم BlueBubbles. إذا كان edit لا يزال ظاهرًا على macOS 26 (Tahoe)، فعطّله يدويًا عبر `channels.bluebubbles.actions.edit=false`.
- إذا كان `coalesceSameSenderDms` مفعّلًا لكن الإرسالات المقسّمة (مثل `Dump` + URL) لا تزال تصل كدورتين: راجع قائمة التحقق [لاستكشاف أخطاء دمج الإرسال المقسّم وإصلاحها](#split-send-coalescing-troubleshooting) — تشمل الأسباب الشائعة نافذة debounce ضيقة جدًا، أو سوء فهم الطوابع الزمنية لسجل الجلسة على أنها وقت وصول Webhook، أو إرسالًا عبر الاقتباس-رد (يستخدم `replyToBody`، وليس Webhook ثانية).
- للحصول على معلومات الحالة/السلامة: `openclaw status --all` أو `openclaw status --deep`.

للاطلاع على مرجع عام لسير عمل القنوات، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وبوابة الذكر
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
