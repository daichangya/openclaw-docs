---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء اقتران Webhook وإصلاحها
    - تهيئة iMessage على macOS
summary: iMessage عبر خادم BlueBubbles على macOS (إرسال/استقبال عبر REST، والكتابة، والتفاعلات، والاقتران، والإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-22T04:20:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST على macOS)

الحالة: Plugin مضمّن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. **موصى به لتكامل iMessage** بسبب واجهته البرمجية الأكثر غنى وسهولة إعداده مقارنة بقناة imsg القديمة.

## Plugin المضمّن

تتضمن إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج الإصدارات المجمعة العادية
إلى خطوة `openclaw plugins install` منفصلة.

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- الموصى به/المختبر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ لكن التعديل معطل حاليًا على Tahoe، وقد تُبلغ تحديثات أيقونة المجموعة عن النجاح ولكنها لا تتزامن.
- يتواصل OpenClaw معه عبر REST API الخاصة به (`GET /api/v1/ping`، و`POST /message/text`، و`POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhook؛ أما الردود الصادرة ومؤشرات الكتابة وإيصالات القراءة وtapbacks فهي عبر استدعاءات REST.
- تُستوعَب المرفقات والملصقات كوسائط واردة (وتُعرَض للوكيل عند الإمكان).
- يعمل الاقتران/قائمة السماح بالطريقة نفسها كما في القنوات الأخرى (`/channels/pairing` وغيرها) باستخدام `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تظهر التفاعلات كأحداث نظام تمامًا مثل Slack/Telegram بحيث يمكن للوكلاء "الإشارة" إليها قبل الرد.
- الميزات المتقدمة: التعديل، وإلغاء الإرسال، وسلاسل الردود، وتأثيرات الرسائل، وإدارة المجموعات.

## البدء السريع

1. ثبّت خادم BlueBubbles على جهاز Mac الخاص بك (اتبع التعليمات على [bluebubbles.app/install](https://bluebubbles.app/install)).
2. في إعدادات BlueBubbles، فعّل Web API وحدد كلمة مرور.
3. شغّل `openclaw onboard` واختر BlueBubbles، أو قم بالتهيئة يدويًا:

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
5. ابدأ Gateway؛ وسيقوم بتسجيل معالج Webhook وبدء الاقتران.

ملاحظة أمان:

- احرص دائمًا على تعيين كلمة مرور لـ Webhook.
- مصادقة Webhook مطلوبة دائمًا. يرفض OpenClaw طلبات Webhook الخاصة بـ BlueBubbles ما لم تتضمن كلمة مرور/`guid` يطابق `channels.bluebubbles.password` (على سبيل المثال `?password=<password>` أو `x-password`)، بغض النظر عن بنية local loopback/proxy.
- يتم التحقق من مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook الكاملة.

## إبقاء Messages.app نشطًا (إعدادات VM / بدون واجهة)

قد تنتهي بعض إعدادات macOS VM / التشغيل الدائم إلى دخول Messages.app في حالة “خمول” (تتوقف الأحداث الواردة حتى يتم فتح التطبيق/إحضاره إلى الواجهة). أحد الحلول البسيطة هو **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

### 1) احفظ AppleScript

احفظه بهذا المسار:

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

احفظ هذا الملف في:

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
- قد يؤدي التشغيل الأول إلى ظهور مطالبات macOS الخاصة بـ **Automation** (`osascript` → Messages). وافق عليها في جلسة المستخدم نفسها التي تشغّل LaunchAgent.

قم بتحميله:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

يتوفر BlueBubbles ضمن Onboarding التفاعلي:

```
openclaw onboard
```

يطلب المعالج ما يلي:

- **عنوان URL للخادم** (مطلوب): عنوان خادم BlueBubbles (مثل `http://192.168.1.100:1234`)
- **كلمة المرور** (مطلوبة): كلمة مرور API من إعدادات BlueBubbles Server
- **مسار Webhook** (اختياري): القيمة الافتراضية `/bluebubbles-webhook`
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
- يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التفعيل داخل المجموعات عندما تكون `allowlist` مضبوطة.

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبًا ما تتضمن Webhook الخاصة بمجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا كنت تريد أن يُظهر سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلًا من ذلك، فيمكنك تفعيل إثراء Contacts المحلي على macOS:

- يفعّل `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` عملية البحث. القيمة الافتراضية: `false`.
- لا تُجرى عمليات البحث إلا بعد أن تسمح الرسالة عبر وصول المجموعة، وتفويض الأوامر، وبوابة الإشارة.
- يتم إثراء مشاركي الهاتف غير المسمّين فقط.
- تظل أرقام الهواتف الخام هي البديل عند عدم العثور على تطابق محلي.

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

يدعم BlueBubbles بوابة الإشارة للدردشات الجماعية، بما يتوافق مع سلوك iMessage/WhatsApp:

- يستخدم `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`) لاكتشاف الإشارات.
- عند تفعيل `requireMention` لمجموعة ما، لا يستجيب الوكيل إلا عند الإشارة إليه.
- تتجاوز أوامر التحكم من المرسلين المصرح لهم بوابة الإشارة.

تهيئة لكل مجموعة:

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
- يستخدم `allowFrom` و`groupAllowFrom` لتحديد تفويض الأوامر.
- يمكن للمرسلين المصرح لهم تشغيل أوامر التحكم حتى بدون إشارة في المجموعات.

### system prompt لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن هذه القيمة في system prompt الخاص بالوكيل في كل دورة تعالج رسالة ضمن تلك المجموعة، بحيث يمكنك تعيين شخصية أو قواعد سلوكية خاصة بكل مجموعة دون تعديل prompts الخاصة بالوكيل:

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

يطابق المفتاح أي قيمة يبلغ عنها BlueBubbles على أنها `chatGuid` / `chatIdentifier` / `chatId` رقمي للمجموعة، ويوفر الإدخال العام `"*"` قيمة افتراضية لكل مجموعة لا تحتوي على تطابق تام (وهو النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تتغلب التطابقات التامة دائمًا على الإدخال العام. تتجاهل الرسائل الخاصة هذا الحقل؛ استخدم بدلًا من ذلك تخصيص prompt على مستوى الوكيل أو الحساب.

#### مثال عملي: الردود المترابطة وتفاعلات tapback (Private API)

مع تفعيل BlueBubbles Private API، تصل الرسائل الواردة مع معرّفات رسائل قصيرة (مثل `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للرد ضمن رسالة معينة أو `action=react` لإضافة tapback. يُعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "عند الرد في هذه المجموعة، استخدم دائمًا action=reply مع",
            "messageId بصيغة [[reply_to:N]] من السياق لكي يظهر ردك",
            "ضمن سلسلة الرسالة المُشغِّلة. لا ترسل أبدًا رسالة جديدة غير مرتبطة.",
            "",
            "للتأكيدات القصيرة ('ok'، 'got it'، 'on it')، استخدم",
            "action=react مع tapback emoji مناسبة (❤️، 👍، 😂، ‼️، ❓)",
            "بدلًا من إرسال رد نصي.",
          ].join(" "),
        },
      },
    },
  },
}
```

تتطلب تفاعلات tapback والردود المترابطة كلتاهما BlueBubbles Private API؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) للاطلاع على الآلية الأساسية.

## ارتباطات محادثات ACP

يمكن تحويل دردشات BlueBubbles إلى مساحات عمل ACP دائمة دون تغيير طبقة النقل.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة الخاصة أو الدردشة الجماعية المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يُغلق `/acp close` جلسة ACP ويزيل الارتباط.

تُدعَم أيضًا الارتباطات الدائمة المهيأة عبر إدخالات `bindings[]` ذات المستوى الأعلى باستخدام `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن لـ `match.peer.id` استخدام أي صيغة هدف مدعومة في BlueBubbles:

- معرّف رسالة خاصة مُطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

لارتباطات المجموعات المستقرة، يُفضّل استخدام `chat_id:*` أو `chat_identifier:*`.

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

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسل تلقائيًا قبل وأثناء إنشاء الرد.
- **إيصالات القراءة**: يتحكم فيها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
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

يدعم BlueBubbles إجراءات الرسائل المتقدمة عند تفعيلها في الإعدادات:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (الافتراضي: true)
        edit: true, // تعديل الرسائل المرسلة (macOS 13+، معطل على macOS 26 Tahoe)
        unsend: true, // إلغاء إرسال الرسائل (macOS 13+)
        reply: true, // سلاسل الردود حسب message GUID
        sendWithEffect: true, // تأثيرات الرسائل (slam وloud وغيرها)
        renameGroup: true, // إعادة تسمية الدردشات الجماعية
        setGroupIcon: true, // تعيين أيقونة/صورة الدردشة الجماعية (غير مستقر على macOS 26 Tahoe)
        addParticipant: true, // إضافة مشاركين إلى المجموعات
        removeParticipant: true, // إزالة مشاركين من المجموعات
        leaveGroup: true, // مغادرة الدردشات الجماعية
        sendAttachment: true, // إرسال المرفقات/الوسائط
      },
    },
  },
}
```

الإجراءات المتاحة:

- **react**: إضافة/إزالة تفاعلات tapback (`messageId`، `emoji`، `remove`). مجموعة tapback الأصلية في iMessage هي `love` و`like` و`dislike` و`laugh` و`emphasize` و`question`. عندما يختار الوكيل رمزًا تعبيريًا خارج هذه المجموعة (مثل `👀`)، تعود أداة التفاعل إلى `love` حتى يستمر عرض tapback بدلًا من فشل الطلب بالكامل. أما تفاعلات التأكيد المهيأة فتظل تتحقق بشكل صارم وتُرجع خطأ عند القيم غير المعروفة.
- **edit**: تعديل رسالة مرسلة (`messageId`، `text`)
- **unsend**: إلغاء إرسال رسالة (`messageId`)
- **reply**: الرد على رسالة محددة (`messageId`، `text`، `to`)
- **sendWithEffect**: الإرسال مع تأثير iMessage (`text`، `to`، `effectId`)
- **renameGroup**: إعادة تسمية دردشة جماعية (`chatGuid`، `displayName`)
- **setGroupIcon**: تعيين أيقونة/صورة دردشة جماعية (`chatGuid`، `media`) — غير مستقر على macOS 26 Tahoe (قد تُرجع API نجاحًا لكن الأيقونة لا تتزامن).
- **addParticipant**: إضافة شخص إلى مجموعة (`chatGuid`، `address`)
- **removeParticipant**: إزالة شخص من مجموعة (`chatGuid`، `address`)
- **leaveGroup**: مغادرة دردشة جماعية (`chatGuid`)
- **upload-file**: إرسال وسائط/ملفات (`to`، `buffer`، `filename`، `asVoice`)
  - المذكرات الصوتية: اضبط `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يقوم BlueBubbles بتحويل MP3 → CAF عند إرسال المذكرات الصوتية.
- الاسم المستعار القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو اسم الإجراء الأساسي.

### معرّفات الرسائل (القصيرة مقابل الكاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1` و`2`) لتوفير الرموز.

- يمكن أن يكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- يحتوي `MessageSidFull` / `ReplyToIdFull` على معرّفات المزود الكاملة.
- المعرفات القصيرة موجودة في الذاكرة؛ ويمكن أن تنتهي صلاحيتها بعد إعادة التشغيل أو إخلاء الذاكرة المؤقتة.
- تقبل الإجراءات `messageId` القصير أو الكامل، لكن المعرّفات القصيرة ستُرجع خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة للأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`، `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [التهيئة](/ar/gateway/configuration) لمعرفة متغيرات القوالب.

## دمج الرسائل الخاصة المقسمة عند الإرسال (أمر + URL في إنشاء واحد)

عندما يكتب المستخدم أمرًا وURL معًا في iMessage — مثل `Dump https://example.com/article` — تقوم Apple بتقسيم الإرسال إلى **عمليتي تسليم Webhook منفصلتين**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

تصل رسالتا Webhook إلى OpenClaw بفاصل ~0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدورة 1، ويرد (غالبًا "أرسل لي الرابط")، ثم لا يرى URL إلا في الدورة 2 — وعندها يكون سياق الأمر قد فُقد بالفعل.

يتيح `channels.bluebubbles.coalesceSameSenderDms` لرسالة خاصة دمج Webhook المتتالية من المرسل نفسه في دورة وكيل واحدة. وتستمر الدردشات الجماعية في استخدام مفتاح لكل رسالة، بحيث يبقى هيكل الدورات متعدد المستخدمين محفوظًا.

### متى يجب التفعيل

فعّل هذا عندما:

- تشحن Skills تتوقع `command + payload` في رسالة واحدة (مثل dump وpaste وsave وqueue وغيرها).
- يلصق المستخدمون URLs أو صورًا أو محتوى طويلًا إلى جانب الأوامر.
- يمكنك تقبل زيادة كمون دورات الرسائل الخاصة (انظر أدناه).

اتركه معطلًا عندما:

- تحتاج إلى أقل كمون ممكن لأوامر الرسائل الخاصة ذات الكلمة الواحدة.
- تكون جميع التدفقات لديك أوامر منفردة بدون حمولات لاحقة.

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

عند تفعيل هذا الخيار، ومن دون تعيين صريح لـ `messages.inbound.byChannel.bluebubbles`، تتسع نافذة إزالة الاهتزاز إلى **2500 ms** (الافتراضي عند عدم الدمج هو 500 ms). هذه النافذة الأوسع مطلوبة — إذ إن وتيرة الإرسال المقسم من Apple التي تتراوح بين 0.8-2.0 ثانية لا تتناسب مع القيمة الافتراضية الأضيق.

لضبط النافذة بنفسك:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms يعمل مع معظم الإعدادات؛ ارفعه إلى 4000 ms إذا كان Mac بطيئًا
        // أو تحت ضغط ذاكرة (إذ قد يتجاوز الفاصل الملحوظ 2 ثانية عندها).
        bluebubbles: 2500,
      },
    },
  },
}
```

### المفاضلات

- **زيادة الكمون لأوامر التحكم في الرسائل الخاصة.** عند تفعيل هذا الخيار، تنتظر رسائل أوامر التحكم في الرسائل الخاصة (مثل `Dump` و`Save` وغيرها) الآن حتى نافذة إزالة الاهتزاز قبل الإرسال، تحسبًا لوصول Webhook حمولة. أما أوامر الدردشة الجماعية فتبقى فورية.
- **المخرجات المدمجة لها حدود** — يُحد النص المدمج عند 4000 حرف مع علامة `…[truncated]` صريحة؛ وتُحد المرفقات عند 20؛ وتُحد إدخالات المصدر عند 10 (يُحتفظ بالأول والأحدث بعد ذلك). ويصل كل `messageId` مصدر إلى inbound-dedupe بحيث يُتعرَّف على أي إعادة تشغيل لاحقة من MessagePoller لأي حدث فردي على أنها مكررة.
- **اختياري وعلى مستوى القناة.** لا تتأثر القنوات الأخرى (Telegram وWhatsApp وSlack و…).

### السيناريوهات وما الذي يراه الوكيل

| ما الذي ينشئه المستخدم                                                 | ما الذي تسلمه Apple        | عند تعطيل الخيار (الافتراضي)            | عند تفعيل الخيار + نافذة 2500 ms                                       |
| ---------------------------------------------------------------------- | -------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                                | 2 Webhook بفاصل ~1 ثانية   | دورتا وكيل: "Dump" وحدها، ثم URL         | دورة واحدة: نص مدمج `Dump https://example.com`                         |
| `Save this 📎image.jpg caption` (مرفق + نص)                             | 2 Webhook                  | دورتان                                   | دورة واحدة: نص + صورة                                                  |
| `/status` (أمر مستقل)                                                  | 1 Webhook                  | إرسال فوري                               | **انتظار حتى النافذة، ثم الإرسال**                                     |
| لصق URL وحده                                                           | 1 Webhook                  | إرسال فوري                               | إرسال فوري (إدخال واحد فقط في الحاوية)                                 |
| إرسال النص + URL كرسالتين منفصلتين عمدًا وبينهما دقائق                | 2 Webhook خارج النافذة     | دورتان                                   | دورتان (تنتهي النافذة بينهما)                                          |
| تدفق سريع (>10 رسائل خاصة صغيرة داخل النافذة)                          | N Webhook                  | N دورات                                  | دورة واحدة، مع مخرجات محدودة (الأول + الأحدث، مع تطبيق حدود النص/المرفقات) |

### استكشاف أخطاء دمج الإرسال المقسم وإصلاحها

إذا كان الخيار مفعّلًا وما زالت الرسائل المقسمة تصل على شكل دورتين، فتحقق من كل طبقة:

1. **تم تحميل الإعدادات فعليًا.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   ثم `openclaw gateway restart` — تتم قراءة هذا الخيار عند إنشاء debouncer-registry.

2. **نافذة إزالة الاهتزاز واسعة بما يكفي لإعدادك.** انظر إلى سجل خادم BlueBubbles في `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   قِس الفاصل بين إرسال النص بأسلوب `"Dump"` وبين إرسال `"https://..."; Attachments:` الذي يليه. ارفع `messages.inbound.byChannel.bluebubbles` بحيث يغطي هذا الفاصل بهامش مريح.

3. **الطوابع الزمنية في Session JSONL ≠ وقت وصول Webhook.** تعكس الطوابع الزمنية لأحداث الجلسة (`~/.openclaw/agents/<id>/sessions/*.jsonl`) الوقت الذي يسلّم فيه Gateway الرسالة إلى الوكيل، **وليس** وقت وصول Webhook. إذا وُسِمت رسالة ثانية في قائمة الانتظار بـ `[Queued messages while agent was busy]`، فهذا يعني أن الدورة الأولى كانت لا تزال قيد التنفيذ عند وصول Webhook الثانية — وكانت حاوية الدمج قد أُفرغت بالفعل. اضبط النافذة اعتمادًا على سجل خادم BB، وليس سجل الجلسة.

4. **ضغط الذاكرة يبطئ إرسال الردود.** على الأجهزة الأصغر (8 GB)، قد تستغرق دورات الوكيل وقتًا كافيًا بحيث تُفرغ حاوية الدمج قبل اكتمال الرد، ثم يصل URL كدورة ثانية في قائمة الانتظار. تحقق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ إذا كان Gateway يتجاوز ~500 MB من RSS وكان الضاغط نشطًا، فأغلق العمليات الثقيلة الأخرى أو استخدم مضيفًا أكبر.

5. **الإرسال باقتباس الرد مسار مختلف.** إذا ضغط المستخدم على `Dump` باعتبارها **ردًا** على فقاعة URL موجودة بالفعل (ويعرض iMessage شارة "1 Reply" على فقاعة Dump)، فإن URL توجد في `replyToBody`، وليس في Webhook ثانية. لا ينطبق الدمج هنا — فهذه مسألة Skills/prompt وليست مسألة debouncer.

## تدفق الكتل

تحكم فيما إذا كانت الردود تُرسل كرسالة واحدة أو تُبث على شكل كتل:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // تفعيل تدفق الكتل (معطل افتراضيًا)
    },
  },
}
```

## الوسائط + الحدود

- يتم تنزيل المرفقات الواردة وتخزينها في ذاكرة الوسائط المؤقتة.
- حد الوسائط عبر `channels.bluebubbles.mediaMaxMb` للوسائط الواردة والصادرة (الافتراضي: 8 MB).
- يُقسَّم النص الصادر عند `channels.bluebubbles.textChunkLimit` (الافتراضي: 4000 حرف).

## مرجع التهيئة

التهيئة الكاملة: [التهيئة](/ar/gateway/configuration)

خيارات المزود:

- `channels.bluebubbles.enabled`: تفعيل/تعطيل القناة.
- `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لـ BlueBubbles REST API.
- `channels.bluebubbles.password`: كلمة مرور API.
- `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (الافتراضي: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).
- `channels.bluebubbles.allowFrom`: قائمة السماح للرسائل الخاصة (المعرّفات، ورسائل البريد الإلكتروني، وأرقام E.164، و`chat_id:*`، و`chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (الافتراضي: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: قائمة السماح لمرسلي المجموعات.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء المشاركين غير المسمّين في المجموعات اختياريًا من Contacts المحلية بعد اجتياز البوابات. الافتراضي: `false`.
- `channels.bluebubbles.groups`: تهيئة لكل مجموعة (`requireMention` وغيرها).
- `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
- `channels.bluebubbles.blockStreaming`: تفعيل تدفق الكتل (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
- `channels.bluebubbles.textChunkLimit`: حجم التقسيم الصادر بالأحرف (الافتراضي: 4000).
- `channels.bluebubbles.sendTimeoutMs`: المهلة لكل طلب بالمللي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها على إعدادات macOS 26 حيث قد تتعطل عمليات إرسال iMessage عبر Private API لمدة 60+ ثانية داخل إطار عمل iMessage؛ مثلًا `45000` أو `60000`. ما تزال عمليات الفحص، وعمليات البحث عن الدردشات، والتفاعلات، والتعديلات، وفحوصات السلامة تستخدم افتراضيًا المهلة الأقصر البالغة 10 ثوانٍ؛ ومن المخطط توسيع ذلك ليشمل التفاعلات والتعديلات لاحقًا. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: تؤدي `length` (الافتراضي) إلى التقسيم فقط عند تجاوز `textChunkLimit`؛ بينما تؤدي `newline` إلى التقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.bluebubbles.mediaMaxMb`: الحد الأقصى للوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
- `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة للمجلدات المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. تُرفض عمليات إرسال المسارات المحلية افتراضيًا ما لم يتم إعداد هذا الخيار. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhook المتتالية للرسائل الخاصة من المرسل نفسه في دورة وكيل واحدة بحيث يصل الإرسال المقسم من Apple للنص + URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج الرسائل الخاصة المقسمة عند الإرسال](#coalescing-split-send-dms-command--url-in-one-composition) لمعرفة السيناريوهات وضبط النافذة والمفاضلات. ويوسع نافذة إزالة الاهتزاز الافتراضية للرسائل الواردة من 500 ms إلى 2500 ms عند تفعيله من دون تعيين صريح لـ `messages.inbound.byChannel.bluebubbles`.
- `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعات المستخدمة للسياق (يعطّل عند 0).
- `channels.bluebubbles.dmHistoryLimit`: حد سجل الرسائل الخاصة.
- `channels.bluebubbles.actions`: تفعيل/تعطيل إجراءات محددة.
- `channels.bluebubbles.accounts`: تهيئة متعددة الحسابات.

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## العناوين / أهداف التسليم

يُفضّل استخدام `chat_guid` من أجل توجيه مستقر:

- `chat_guid:iMessage;-;+15555550123` (مفضل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعرّفات المباشرة: `+15555550123`، `user@example.com`
  - إذا لم يكن للمعرّف المباشر دردشة رسائل خاصة موجودة، فسيقوم OpenClaw بإنشائها عبر `POST /api/v1/chat/new`. ويتطلب ذلك تفعيل BlueBubbles Private API.

### توجيه iMessage مقابل SMS

عندما يكون للمعرّف نفسه كلٌّ من دردشة iMessage ودردشة SMS على جهاز Mac (مثل رقم هاتف مسجل في iMessage ولكنه تلقى أيضًا رسائل احتياطية بالفقاعات الخضراء)، فإن OpenClaw يفضّل دردشة iMessage ولا يخفضها بصمت إلى SMS أبدًا. لفرض استخدام دردشة SMS، استخدم بادئة هدف صريحة `sms:` (مثل `sms:+15555550123`). أما المعرّفات التي لا تطابق دردشة iMessage فستُرسل عبر أي دردشة يبلغ عنها BlueBubbles.

## الأمان

- تتم مصادقة طلبات Webhook بمقارنة معاملات الاستعلام أو الرؤوس `guid`/`password` مع `channels.bluebubbles.password`.
- حافظ على سرية كلمة مرور API ونقطة نهاية Webhook (وتعامل معها كبيانات اعتماد).
- لا يوجد تجاوز localhost لمصادقة Webhook الخاصة بـ BlueBubbles. إذا كنت تمرر حركة Webhook عبر proxy، فاحتفظ بكلمة مرور BlueBubbles ضمن الطلب من طرف إلى طرف. لا يحل `gateway.trustedProxies` محل `channels.bluebubbles.password` هنا. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد الجدار الناري على خادم BlueBubbles إذا كنت ستعرضه خارج الشبكة المحلية.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات Webhook الخاصة بـ BlueBubbles وتأكد من أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles Private API (`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يوفّرها.
- يتطلب التعديل/إلغاء الإرسال macOS 13+ وإصدارًا متوافقًا من خادم BlueBubbles. على macOS 26 (Tahoe)، يكون التعديل معطلًا حاليًا بسبب تغييرات في Private API.
- قد تكون تحديثات أيقونات المجموعات غير مستقرة على macOS 26 (Tahoe): قد تُرجع API نجاحًا ولكن الأيقونة الجديدة لا تتزامن.
- يُخفي OpenClaw تلقائيًا الإجراءات المعروفة بأنها معطلة استنادًا إلى إصدار macOS الخاص بخادم BlueBubbles. إذا ظل التعديل ظاهرًا على macOS 26 (Tahoe)، فعطله يدويًا باستخدام `channels.bluebubbles.actions.edit=false`.
- إذا كان `coalesceSameSenderDms` مفعّلًا لكن الإرسالات المقسمة (مثل `Dump` + URL) ما تزال تصل على شكل دورتين، فراجع قائمة التحقق الخاصة بـ [استكشاف أخطاء دمج الإرسال المقسم وإصلاحها](#split-send-coalescing-troubleshooting) — من الأسباب الشائعة ضيق نافذة إزالة الاهتزاز، أو إساءة قراءة طوابع سجل الجلسة الزمنية على أنها وقت وصول Webhook، أو إرسال اقتباس رد (يستخدم `replyToBody` وليس Webhook ثانية).
- للحصول على معلومات الحالة/السلامة: `openclaw status --all` أو `openclaw status --deep`.

للاطلاع على مرجع تدفق القنوات العام، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
