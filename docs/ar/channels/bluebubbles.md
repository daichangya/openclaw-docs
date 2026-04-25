---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء اقتران Webhook وإصلاحها
    - تهيئة iMessage على macOS
summary: iMessage عبر خادم BlueBubbles على macOS (إرسال/استقبال عبر REST، الكتابة، التفاعلات، الاقتران، والإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-25T13:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5185202d668f56e5f2e22c1858325595eea7cca754b9b3a809c886c53ae68770
    source_path: channels/bluebubbles.md
    workflow: 15
---

الحالة: Plugin مضمّن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. **موصى به لتكامل iMessage** بفضل واجهة API الأغنى وسهولة الإعداد مقارنة بقناة imsg القديمة.

## Plugin مضمّن

تتضمن إصدارات OpenClaw الحالية BlueBubbles، لذا لا تحتاج الإصدارات المعبأة العادية إلى خطوة `openclaw plugins install` منفصلة.

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- الموصى به/المختبر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ لكن التحرير معطّل حاليًا على Tahoe، وقد تُبلّغ تحديثات أيقونة المجموعة عن النجاح لكنها لا تتزامن.
- يتواصل OpenClaw معه عبر REST API الخاصة به (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhooks؛ أما الردود الصادرة، ومؤشرات الكتابة، وإيصالات القراءة، وtapbacks فتكون عبر استدعاءات REST.
- يتم استيعاب المرفقات والملصقات كوسائط واردة (ويتم عرضها للوكيل عند الإمكان).
- يعمل الاقتران/قائمة السماح بالطريقة نفسها كما في القنوات الأخرى (`/channels/pairing` وغيرها) باستخدام `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تظهر التفاعلات كأحداث نظام تمامًا مثل Slack/Telegram بحيث يمكن للوكلاء "الإشارة" إليها قبل الرد.
- الميزات المتقدمة: التحرير، وإلغاء الإرسال، وتسلسل الردود، وتأثيرات الرسائل، وإدارة المجموعات.

## البدء السريع

1. ثبّت خادم BlueBubbles على جهاز Mac لديك (اتبع التعليمات على [bluebubbles.app/install](https://bluebubbles.app/install)).
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

4. وجّه Webhooks الخاصة بـ BlueBubbles إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. ابدأ Gateway؛ وسيقوم بتسجيل معالج Webhook وبدء الاقتران.

ملاحظة أمان:

- احرص دائمًا على تعيين كلمة مرور لـ Webhook.
- تكون مصادقة Webhook مطلوبة دائمًا. يرفض OpenClaw طلبات Webhook الخاصة بـ BlueBubbles ما لم تتضمن كلمة مرور/guid يطابق `channels.bluebubbles.password` (مثل `?password=<password>` أو `x-password`)، بغض النظر عن بنية loopback/proxy.
- يتم التحقق من مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook الكاملة.

## إبقاء Messages.app نشطًا (إعدادات VM / بدون واجهة)

قد تنتهي بعض إعدادات macOS VM / التشغيل الدائم إلى أن يصبح Messages.app في حالة “خمول” (تتوقف الأحداث الواردة إلى أن يتم فتح التطبيق/إبرازه). والحل البديل البسيط هو **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

### 1) احفظ AppleScript

احفظ هذا في:

- `~/Scripts/poke-messages.scpt`

مثال على البرنامج النصي (غير تفاعلي؛ لا يسرق التركيز):

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

احفظ هذا في:

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
- قد يؤدي التشغيل الأول إلى ظهور مطالبات macOS الخاصة بـ **Automation** (`osascript` → Messages). وافق عليها ضمن جلسة المستخدم نفسها التي تشغّل LaunchAgent.

قم بتحميله:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## الإعداد التوجيهي

يتوفر BlueBubbles ضمن الإعداد التوجيهي التفاعلي:

```bash
openclaw onboard
```

يطلب المعالج ما يلي:

- **عنوان URL للخادم** (مطلوب): عنوان خادم BlueBubbles (مثل `http://192.168.1.100:1234`)
- **كلمة المرور** (مطلوبة): كلمة مرور API من إعدادات BlueBubbles Server
- **مسار Webhook** (اختياري): القيمة الافتراضية هي `/bluebubbles-webhook`
- **سياسة الرسائل الخاصة**: pairing أو allowlist أو open أو disabled
- **قائمة السماح**: أرقام الهواتف أو عناوين البريد الإلكتروني أو أهداف الدردشة

يمكنك أيضًا إضافة BlueBubbles عبر CLI:

```bash
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل الخاصة + المجموعات)

الرسائل الخاصة:

- الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ ويتم تجاهل الرسائل حتى تتم الموافقة عليها (تنتهي صلاحية الرموز بعد ساعة واحدة).
- وافق عبر:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- الاقتران هو تبادل الرموز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)

المجموعات:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
- يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التفعيل داخل المجموعات عند تعيين `allowlist`.

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبًا ما تتضمن Webhooks الخاصة بمجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا أردت أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلًا من ذلك، فيمكنك تفعيل إثراء Contacts المحلي على macOS:

- يقوم `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` بتمكين البحث. القيمة الافتراضية: `false`.
- لا تُنفّذ عمليات البحث إلا بعد أن تسمح صلاحية الوصول للمجموعة، وتفويض الأوامر، وحجب الإشارات بمرور الرسالة.
- يتم إثراء المشاركين الهاتفيين غير المسمّين فقط.
- تبقى أرقام الهواتف الخام هي البديل الافتراضي عندما لا يتم العثور على تطابق محلي.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### حجب الإشارات (المجموعات)

يدعم BlueBubbles حجب الإشارات لمحادثات المجموعات، بما يطابق سلوك iMessage/WhatsApp:

- يستخدم `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`) لاكتشاف الإشارات.
- عند تمكين `requireMention` لمجموعة ما، لا يرد الوكيل إلا عند الإشارة إليه.
- تتجاوز أوامر التحكم من المرسلين المصرح لهم حجب الإشارات.

إعداد لكل مجموعة:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // الإعداد الافتراضي لكل المجموعات
        "iMessage;-;chat123": { requireMention: false }, // تجاوز لمجموعة محددة
      },
    },
  },
}
```

### حجب الأوامر

- تتطلب أوامر التحكم (مثل `/config` و`/model`) تفويضًا.
- يستخدم `allowFrom` و`groupAllowFrom` لتحديد تفويض الأوامر.
- يمكن للمرسلين المصرح لهم تشغيل أوامر التحكم حتى بدون الإشارة إليهم داخل المجموعات.

### System prompt لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. يتم حقن القيمة في system prompt الخاصة بالوكيل في كل دورة تعالج رسالة في تلك المجموعة، بحيث يمكنك تعيين شخصية أو قواعد سلوكية لكل مجموعة دون تعديل prompts الوكيل:

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

يطابق المفتاح أي قيمة يبلّغ عنها BlueBubbles كـ `chatGuid` / `chatIdentifier` / `chatId` رقمي للمجموعة، ويوفر الإدخال العام `"*"` قيمة افتراضية لكل مجموعة لا تملك تطابقًا دقيقًا (النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تتغلب المطابقات الدقيقة دائمًا على الإدخال العام. تتجاهل الرسائل الخاصة هذا الحقل؛ استخدم بدلًا من ذلك تخصيص prompt على مستوى الوكيل أو الحساب.

#### مثال عملي: الردود المتسلسلة وتفاعلات tapback (Private API)

مع تمكين BlueBubbles Private API، تصل الرسائل الواردة مع معرّفات رسائل قصيرة (مثل `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للربط برسالة محددة أو `action=react` لإضافة tapback. يعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "عند الرد في هذه المجموعة، استدعِ دائمًا action=reply مع",
            "messageId من النمط [[reply_to:N]] الموجود في السياق حتى يظهر ردك",
            "ضمن الرسالة المُشغِّلة. لا ترسل أبدًا رسالة جديدة غير مرتبطة.",
            "",
            "بالنسبة للتأكيدات القصيرة ('ok', 'got it', 'on it')، استخدم",
            "action=react مع tapback emoji مناسبة (❤️, 👍, 😂, ‼️, ❓)",
            "بدلًا من إرسال رد نصي.",
          ].join(" "),
        },
      },
    },
  },
}
```

تتطلب تفاعلات tapback والردود المتسلسلة كلتاهما BlueBubbles Private API؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) للاطلاع على الآلية الأساسية.

## روابط محادثات ACP

يمكن تحويل محادثات BlueBubbles إلى مساحات عمل ACP دائمة دون تغيير طبقة النقل.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل الرسائل الخاصة أو محادثة المجموعة المسموح بها.
- تُوجَّه الرسائل اللاحقة في محادثة BlueBubbles نفسها إلى جلسة ACP المنشأة.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

يتم دعم الروابط الدائمة المُعدّة أيضًا من خلال إدخالات `bindings[]` من المستوى الأعلى مع `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن أن يستخدم `match.peer.id` أي صيغة هدف مدعومة من BlueBubbles:

- معرّف DM مُطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

لروابط المجموعات المستقرة، يُفضَّل `chat_id:*` أو `chat_identifier:*`.

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

راجع [وكلاء ACP](/ar/tools/acp-agents) للاطلاع على سلوك ربط ACP المشترك.

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسل تلقائيًا قبل وأثناء توليد الرد.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (القيمة الافتراضية: `true`).
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

يدعم BlueBubbles إجراءات الرسائل المتقدمة عند تمكينها في الإعدادات:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (الافتراضي: true)
        edit: true, // تحرير الرسائل المرسلة (macOS 13+، معطّل على macOS 26 Tahoe)
        unsend: true, // إلغاء إرسال الرسائل (macOS 13+)
        reply: true, // تسلسل الردود حسب message GUID
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

- **react**: إضافة/إزالة تفاعلات tapback (`messageId`, `emoji`, `remove`). مجموعة tapback الأصلية في iMessage هي `love` و`like` و`dislike` و`laugh` و`emphasize` و`question`. عندما يختار الوكيل emoji خارج هذه المجموعة (مثل `👀`)، تعود أداة التفاعل إلى `love` حتى يستمر عرض tapback بدلًا من فشل الطلب بالكامل. أما تفاعلات التأكيد المهيأة فتظل تتحقق بشكل صارم وتُرجع خطأ عند القيم غير المعروفة.
- **edit**: تحرير رسالة مرسلة (`messageId`, `text`)
- **unsend**: إلغاء إرسال رسالة (`messageId`)
- **reply**: الرد على رسالة محددة (`messageId`, `text`, `to`)
- **sendWithEffect**: الإرسال مع تأثير iMessage (`text`, `to`, `effectId`)
- **renameGroup**: إعادة تسمية دردشة مجموعة (`chatGuid`, `displayName`)
- **setGroupIcon**: تعيين أيقونة/صورة دردشة مجموعة (`chatGuid`, `media`) — غير مستقر على macOS 26 Tahoe (قد تُرجع API نجاحًا لكن الأيقونة لا تتزامن).
- **addParticipant**: إضافة شخص إلى مجموعة (`chatGuid`, `address`)
- **removeParticipant**: إزالة شخص من مجموعة (`chatGuid`, `address`)
- **leaveGroup**: مغادرة دردشة مجموعة (`chatGuid`)
- **upload-file**: إرسال وسائط/ملفات (`to`, `buffer`, `filename`, `asVoice`)
  - المذكرات الصوتية: عيّن `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يقوم BlueBubbles بتحويل MP3 → CAF عند إرسال المذكرات الصوتية.
- الاسم البديل القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو الاسم القياسي للإجراء.

### معرّفات الرسائل (القصيرة مقابل الكاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1` و`2`) لتوفير الرموز.

- يمكن أن يكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- يحتوي `MessageSidFull` / `ReplyToIdFull` على المعرّفات الكاملة الخاصة بالموفّر.
- تكون المعرّفات القصيرة في الذاكرة؛ وقد تنتهي صلاحيتها عند إعادة التشغيل أو إخلاء الذاكرة المؤقتة.
- تقبل الإجراءات `messageId` قصيرًا أو كاملًا، لكن المعرّفات القصيرة ستُرجع خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة للأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [التهيئة](/ar/gateway/configuration) للاطلاع على متغيرات القوالب.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## دمج الرسائل الخاصة المنقسمة عند الإرسال (أمر + URL في تركيب واحد)

عندما يكتب المستخدم أمرًا وURL معًا في iMessage — مثل `Dump https://example.com/article` — تقوم Apple بتقسيم الإرسال إلى **تسليمين منفصلين عبر Webhook**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

تصل Webhooks الاثنتان إلى OpenClaw بفارق ~0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدورة 1، ويرد (غالبًا "أرسل لي الرابط")، ولا يرى URL إلا في الدورة 2 — وعندها يكون سياق الأمر قد فُقد بالفعل.

يتيح `channels.bluebubbles.coalesceSameSenderDms` لرسالة خاصة دمج Webhooks المتتالية من المرسل نفسه في دورة وكيل واحدة. وتستمر دردشات المجموعات في استخدام المفتاح لكل رسالة على حدة حتى يتم الحفاظ على بنية الأدوار متعددة المستخدمين.

### متى يجب التمكين

قم بالتمكين عندما:

- تشحن Skills تتوقع `command + payload` في رسالة واحدة (dump, paste, save, queue، إلخ).
- يلصق المستخدمون عناوين URL أو الصور أو محتوى طويلًا إلى جانب الأوامر.
- يمكنك قبول زمن الانتظار الإضافي لدورة الرسائل الخاصة (انظر أدناه).

اتركه معطّلًا عندما:

- تحتاج إلى أقل زمن تأخير ممكن لأوامر الرسائل الخاصة ذات الكلمة الواحدة.
- تكون جميع التدفقات لديك أوامر أحادية اللقطة دون حمولات لاحقة.

### التمكين

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // تفعيل اختياري (الافتراضي: false)
    },
  },
}
```

مع تشغيل هذا الخيار وغياب `messages.inbound.byChannel.bluebubbles` الصريح، تتسع نافذة إزالة الارتداد إلى **2500 ms** (الافتراضي لعدم الدمج هو 500 ms). هذه النافذة الأوسع مطلوبة — إذ إن وتيرة الإرسال المنقسم من Apple البالغة 0.8-2.0 ثانية لا تلائم القيمة الافتراضية الأضيق.

لضبط النافذة بنفسك:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // تعمل 2500 ms مع معظم الإعدادات؛ ارفعها إلى 4000 ms إذا كان جهاز Mac بطيئًا
        // أو تحت ضغط الذاكرة (قد يتجاوز الفارق الملحوظ 2 ثانية حينها).
        bluebubbles: 2500,
      },
    },
  },
}
```

### المقايضات

- **زمن انتظار إضافي لأوامر التحكم في الرسائل الخاصة.** عند تشغيل الخيار، تنتظر رسائل أوامر التحكم في الرسائل الخاصة (مثل `Dump` و`Save`، إلخ) الآن حتى نافذة إزالة الارتداد قبل الإرسال، تحسبًا لوصول Webhook حمولة. أما أوامر دردشات المجموعات فتظل تُرسل فورًا.
- **الناتج المدمج محدود** — يُحد النص المدمج عند 4000 حرف مع علامة صريحة `…[truncated]`؛ ويُحد عدد المرفقات عند 20؛ ويُحد عدد إدخالات المصدر عند 10 (يُحتفظ بالأول والأحدث بعد ذلك). يظل كل `messageId` مصدر يصل إلى inbound-dedupe بحيث يُتعرَّف على أي إعادة تشغيل لاحقة من MessagePoller لأي حدث فردي كنسخة مكررة.
- **تفعيل اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram وWhatsApp وSlack و…) بذلك.

### السيناريوهات وما الذي يراه الوكيل

| ما يكتبه المستخدم                                                      | ما تسلمه Apple            | الخيار معطّل (الافتراضي)                | الخيار مفعّل + نافذة 2500 ms                                              |
| ---------------------------------------------------------------------- | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                               | 2 Webhooks بفارق ~1 ثانية | دورتا وكيل: "Dump" وحدها، ثم URL        | دورة واحدة: نص مدمج `Dump https://example.com`                           |
| `Save this 📎image.jpg caption` (مرفق + نص)                            | 2 Webhooks                | دورتان                                  | دورة واحدة: نص + صورة                                                    |
| `/status` (أمر مستقل)                                                 | 1 Webhook                 | إرسال فوري                              | **ينتظر حتى النافذة، ثم يُرسل**                                          |
| لصق URL وحده                                                           | 1 Webhook                 | إرسال فوري                              | إرسال فوري (إدخال واحد فقط في الحاوية)                                   |
| إرسال نص + URL كرسالتين منفصلتين عمدًا بفاصل دقائق                    | 2 Webhooks خارج النافذة   | دورتان                                  | دورتان (تنتهي النافذة بينهما)                                             |
| تدفق سريع (>10 رسائل خاصة صغيرة داخل النافذة)                         | N Webhooks                | N دورات                                 | دورة واحدة، ناتج محدود (الأول + الأحدث، مع تطبيق حدود النص/المرفقات)     |

### استكشاف أخطاء دمج الإرسال المنقسم وإصلاحها

إذا كان الخيار مفعّلًا وما زالت الإرسالات المنقسمة تصل كدورتين، فتحقق من كل طبقة:

1. **تم تحميل الإعداد فعليًا.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   ثم شغّل `openclaw gateway restart` — إذ تتم قراءة الخيار عند إنشاء سجل debouncer.

2. **نافذة إزالة الارتداد واسعة بما يكفي لإعدادك.** انظر إلى سجل خادم BlueBubbles ضمن `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   قِس الفارق بين إرسال النص بنمط `"Dump"` والإرسال اللاحق بنمط `"https://..."; Attachments:`. ارفع `messages.inbound.byChannel.bluebubbles` ليغطي ذلك الفارق بشكل مريح.

3. **الطوابع الزمنية لـ Session JSONL ≠ وصول Webhook.** تعكس الطوابع الزمنية لأحداث الجلسة (`~/.openclaw/agents/<id>/sessions/*.jsonl`) وقت تسليم Gateway للرسالة إلى الوكيل، **وليس** وقت وصول Webhook. وتعني الرسالة الثانية المصطفة التي تحمل الوسم `[Queued messages while agent was busy]` أن الدورة الأولى كانت لا تزال قيد التنفيذ عند وصول Webhook الثانية — أي إن حاوية الدمج كانت قد أُفرغت بالفعل. اضبط النافذة استنادًا إلى سجل خادم BB، لا إلى سجل الجلسة.

4. **ضغط الذاكرة يبطئ إرسال الرد.** على الأجهزة الأصغر (8 GB)، قد تستغرق دورات الوكيل وقتًا كافيًا بحيث تُفرغ حاوية الدمج قبل اكتمال الرد، ويصل URL كدورة ثانية مصطفة. تحقق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ وإذا كان Gateway يتجاوز ~500 MB RSS وكان الضاغط نشطًا، فأغلق العمليات الثقيلة الأخرى أو انتقل إلى مضيف أكبر.

5. **إرسالات الاقتباس-الرد مسار مختلف.** إذا نقر المستخدم على `Dump` كـ **رد** على فقاعة URL موجودة (ويعرض iMessage شارة "1 Reply" على فقاعة Dump)، فإن URL يكون في `replyToBody`، وليس في Webhook ثانية. لا ينطبق الدمج هنا — فهذه مسألة تخص Skill/prompt وليست debouncer.

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

- تُنزَّل المرفقات الواردة وتُخزَّن في ذاكرة الوسائط المؤقتة.
- حد الوسائط عبر `channels.bluebubbles.mediaMaxMb` للوسائط الواردة والصادرة (الافتراضي: 8 MB).
- يُقسَّم النص الصادر إلى أجزاء وفق `channels.bluebubbles.textChunkLimit` (الافتراضي: 4000 حرف).

## مرجع التهيئة

التهيئة الكاملة: [التهيئة](/ar/gateway/configuration)

خيارات الموفّر:

- `channels.bluebubbles.enabled`: تمكين/تعطيل القناة.
- `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لـ BlueBubbles REST API.
- `channels.bluebubbles.password`: كلمة مرور API.
- `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (الافتراضي: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: `pairing`).
- `channels.bluebubbles.allowFrom`: قائمة السماح للرسائل الخاصة (المعرّفات، والبريد الإلكتروني، وأرقام E.164، و`chat_id:*`، و`chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: ‏`open | allowlist | disabled` (الافتراضي: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: قائمة السماح لمرسلي المجموعات.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء المشاركين غير المسمّين في المجموعة اختياريًا من Contacts المحلية بعد اجتياز القيود. الافتراضي: `false`.
- `channels.bluebubbles.groups`: إعداد لكل مجموعة (`requireMention`، وغيرها).
- `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
- `channels.bluebubbles.blockStreaming`: تمكين البث على شكل كتل (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
- `channels.bluebubbles.textChunkLimit`: حجم الجزء الصادر بالأحرف (الافتراضي: 4000).
- `channels.bluebubbles.sendTimeoutMs`: المهلة لكل طلب بالمللي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها على إعدادات macOS 26 حيث قد تتوقف رسائل iMessage عبر Private API لأكثر من 60 ثانية داخل إطار عمل iMessage؛ مثلًا `45000` أو `60000`. لا تزال probes، وعمليات بحث الدردشة، والتفاعلات، وعمليات التحرير، وفحوصات السلامة تستخدم حاليًا القيمة الافتراضية الأقصر وهي 10 ثوانٍ؛ ومن المخطط توسيع التغطية للتفاعلات والتحرير في متابعة لاحقة. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: ‏`length` (الافتراضي) يقسم فقط عند تجاوز `textChunkLimit`؛ أما `newline` فيقسم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.bluebubbles.mediaMaxMb`: حد الوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
- `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة بالأدلة المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. يتم رفض إرسال المسارات المحلية افتراضيًا ما لم يتم ضبط هذا الخيار. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhooks المتتالية للرسائل الخاصة من المرسل نفسه في دورة وكيل واحدة بحيث يصل الإرسال المنقسم من Apple للنص+URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج الرسائل الخاصة المنقسمة عند الإرسال](#coalescing-split-send-dms-command--url-in-one-composition) للاطلاع على السيناريوهات، وضبط النافذة، والمقايضات. يوسّع نافذة إزالة الارتداد الافتراضية للرسائل الواردة من 500 ms إلى 2500 ms عند التمكين بدون تعيين صريح لـ `messages.inbound.byChannel.bluebubbles`.
- `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعات في السياق (يعطّل عند 0).
- `channels.bluebubbles.dmHistoryLimit`: حد السجل للرسائل الخاصة.
- `channels.bluebubbles.actions`: تمكين/تعطيل إجراءات محددة.
- `channels.bluebubbles.accounts`: إعداد متعدد الحسابات.

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## العنونة / أهداف التسليم

يُفضَّل `chat_guid` للتوجيه المستقر:

- `chat_guid:iMessage;-;+15555550123` (مفضّل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعرّفات المباشرة: `+15555550123`, `user@example.com`
  - إذا لم يكن للمعرّف المباشر دردشة DM موجودة، فسيقوم OpenClaw بإنشائها عبر `POST /api/v1/chat/new`. ويتطلب ذلك تمكين BlueBubbles Private API.

### توجيه iMessage مقابل SMS

عندما يكون للمعرّف نفسه كل من دردشة iMessage ودردشة SMS على جهاز Mac (مثل رقم هاتف مسجّل في iMessage لكنه تلقى أيضًا رسائل fallback ذات الفقاعة الخضراء)، يفضّل OpenClaw دردشة iMessage ولا يخفض بصمت إلى SMS أبدًا. لفرض دردشة SMS، استخدم بادئة هدف `sms:` صريحة (مثل `sms:+15555550123`). أما المعرّفات التي لا تملك دردشة iMessage مطابقة فستُرسل عبر أي دردشة يبلّغ عنها BlueBubbles.

## الأمان

- تتم مصادقة طلبات Webhook بمقارنة معاملات الاستعلام `guid`/`password` أو الرؤوس مع `channels.bluebubbles.password`.
- حافظ على سرية كلمة مرور API ونقطة نهاية Webhook (وتعامل معهما كبيانات اعتماد).
- لا يوجد تجاوز localhost لمصادقة Webhook في BlueBubbles. إذا كنت تمرر حركة Webhook عبر proxy، فاحتفظ بكلمة مرور BlueBubbles على الطلب من البداية إلى النهاية. لا يحل `gateway.trustedProxies` محل `channels.bluebubbles.password` هنا. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد الجدار الناري على خادم BlueBubbles إذا كنت ستعرضه خارج LAN لديك.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات Webhook الخاصة بـ BlueBubbles وتأكد من أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles private API (`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يوفّرها.
- يتطلب edit/unsend نظام macOS 13+ وإصدارًا متوافقًا من خادم BlueBubbles. على macOS 26 (Tahoe)، يكون التحرير معطّلًا حاليًا بسبب تغييرات في Private API.
- قد تكون تحديثات أيقونة المجموعة غير مستقرة على macOS 26 (Tahoe): قد تُرجع API نجاحًا لكن الأيقونة الجديدة لا تتزامن.
- يخفي OpenClaw تلقائيًا الإجراءات المعروفة بأنها معطلة استنادًا إلى إصدار macOS الخاص بخادم BlueBubbles. إذا كان edit لا يزال يظهر على macOS 26 (Tahoe)، فعطّله يدويًا باستخدام `channels.bluebubbles.actions.edit=false`.
- إذا كان `coalesceSameSenderDms` مفعّلًا لكن الإرسالات المنقسمة (مثل `Dump` + URL) لا تزال تصل كدورتين، فراجع قائمة [استكشاف أخطاء دمج الإرسال المنقسم وإصلاحها](#split-send-coalescing-troubleshooting) — من الأسباب الشائعة ضيق نافذة إزالة الارتداد، أو قراءة طوابع سجل الجلسة الزمنية على أنها وقت وصول Webhook، أو إرسال reply-quote (الذي يستخدم `replyToBody`، وليس Webhook ثانية).
- لمعلومات الحالة/السلامة: `openclaw status --all` أو `openclaw status --deep`.

للاطلاع على مرجع سير العمل العام للقنوات، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وحجب الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
