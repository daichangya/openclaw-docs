---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس/وضع HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (Socket Mode + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-21T13:35:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fe3c3c344e1c20c09b29773f4f68d2790751e76d8bbaa3c6157e3ff75978acf
    source_path: channels/slack.md
    workflow: 15
---

# Slack

الحالة: جاهز للإنتاج للرسائل المباشرة + القنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن عناوين URL لطلبات HTTP مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل Slack المباشرة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيصات عبر القنوات وإجراءات الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack، اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [بيان المثال](#manifest-and-scope-checklist) أدناه وتابع الإنشاء
        - أنشئ **App-Level Token** (`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض
      </Step>

      <Step title="كوّن OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        متغيرات البيئة الاحتياطية (للحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="ابدأ Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="عناوين URL لطلبات HTTP">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack، اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [بيان المثال](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

      </Step>

      <Step title="كوّن OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        استخدم مسارات Webhook فريدة للـ HTTP متعدد الحسابات

        امنح كل حساب `webhookPath` مميزًا (الافتراضي `/slack/events`) حتى لا تتعارض التسجيلات.
        </Note>

      </Step>

      <Step title="ابدأ Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## قائمة التحقق من البيان والنطاقات

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "أرسل رسالة إلى OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Tab>

  <Tab title="عناوين URL لطلبات HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "أرسل رسالة إلى OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### إعدادات إضافية للبيان

اعرض ميزات مختلفة توسّع الإعدادات الافتراضية أعلاه.

<AccordionGroup>
  <Accordion title="أوامر الشرطة المائلة الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مكوَّن، مع بعض الفروق الدقيقة:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر شرطة مائلة في الوقت نفسه.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (الافتراضي)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "ابدأ جلسة جديدة",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "أعد تعيين الجلسة الحالية"
      },
      {
        "command": "/compact",
        "description": "نفّذ Compaction لسياق الجلسة",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "أوقف التشغيل الحالي"
      },
      {
        "command": "/session",
        "description": "أدر انتهاء ربط الخيط",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "حدّد مستوى التفكير",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "بدّل الإخراج التفصيلي",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "اعرض أو اضبط الوضع السريع",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "بدّل إظهار الاستدلال",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "بدّل الوضع المرتفع",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "اعرض أو اضبط القيم الافتراضية للتنفيذ",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "اعرض النموذج أو اضبطه",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "اعرض قائمة المزوّدين أو نماذج مزوّد معيّن",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "اعرض ملخص المساعدة القصير"
      },
      {
        "command": "/commands",
        "description": "اعرض فهرس الأوامر المُنشأ"
      },
      {
        "command": "/tools",
        "description": "اعرض ما الذي يمكن للوكيل الحالي استخدامه الآن",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "اعرض حالة وقت التشغيل، بما في ذلك استخدام المزوّد/الحصة عند توفرها"
      },
      {
        "command": "/tasks",
        "description": "اعرض المهام النشطة/الحديثة في الخلفية للجلسة الحالية"
      },
      {
        "command": "/context",
        "description": "اشرح كيفية تجميع السياق",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "اعرض هوية المرسل الخاصة بك"
      },
      {
        "command": "/skill",
        "description": "شغّل Skill بالاسم",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "اطرح سؤالًا جانبيًا دون تغيير سياق الجلسة",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "تحكم في تذييل الاستخدام أو اعرض ملخص التكلفة",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="عناوين URL لطلبات HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "ابدأ جلسة جديدة",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "أعد تعيين الجلسة الحالية",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "نفّذ Compaction لسياق الجلسة",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "أوقف التشغيل الحالي",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "أدر انتهاء ربط الخيط",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "حدّد مستوى التفكير",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "بدّل الإخراج التفصيلي",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "اعرض أو اضبط الوضع السريع",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "بدّل إظهار الاستدلال",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "بدّل الوضع المرتفع",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "اعرض أو اضبط القيم الافتراضية للتنفيذ",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "اعرض النموذج أو اضبطه",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "اعرض قائمة المزوّدين أو نماذج مزوّد معيّن",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "اعرض ملخص المساعدة القصير",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "اعرض فهرس الأوامر المُنشأ",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "اعرض ما الذي يمكن للوكيل الحالي استخدامه الآن",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "اعرض حالة وقت التشغيل، بما في ذلك استخدام المزوّد/الحصة عند توفرها",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "اعرض المهام النشطة/الحديثة في الخلفية للجلسة الحالية",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "اشرح كيفية تجميع السياق",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "اعرض هوية المرسل الخاصة بك",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "شغّل Skill بالاسم",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "اطرح سؤالًا جانبيًا دون تغيير سياق الجلسة",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "تحكم في تذييل الاستخدام أو اعرض ملخص التكلفة",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="نطاقات التأليف الاختيارية (عمليات الكتابة)">
    أضف نطاق البوت `chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا استخدمت أيقونة emoji، فإن Slack يتوقع صيغة `:emoji_name:`.
  </Accordion>
  <Accordion title="نطاقات user token الاختيارية (عمليات القراءة)">
    إذا قمت بتكوين `channels.slack.userToken`، فإن نطاقات القراءة المعتادة هي:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (إذا كنت تعتمد على قراءات البحث في Slack)

  </Accordion>
</AccordionGroup>

## نموذج الرموز المميزة

- `botToken` + `appToken` مطلوبان لـ Socket Mode.
- يتطلب وضع HTTP كلًا من `botToken` + `signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل
  نصية صريحة أو كائنات SecretRef.
- تتجاوز رموز التكوين المميزة الاحتياطي من متغيرات البيئة.
- ينطبق الاحتياطي من متغيرات البيئة `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) خاص بالتكوين فقط (من دون احتياطي من متغيرات البيئة) ويكون افتراضيًا بسلوك للقراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status`
  لكل بيانات اعتماد (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مُكوَّن عبر SecretRef
  أو مصدر أسرار آخر غير مضمن، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ أما في Socket Mode فالثنائي
  المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة للإجراءات/قراءات الدليل، يمكن تفضيل user token عند تكوينه. أما في عمليات الكتابة، فيبقى bot token هو المفضل؛ ولا يُسمح بعمليات الكتابة عبر user token إلا عندما تكون `userTokenReadOnly: false` ويكون bot token غير متاح.
</Tip>

## الإجراءات والقيود

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة   | الافتراضي |
| ---------- | --------- |
| messages   | مفعّل |
| reactions  | مفعّل |
| pins       | مفعّل |
| memberInfo | مفعّل |
| emojiList  | مفعّل |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    تتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل المباشرة (الإرث: `channels.slack.dm.policy`):

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`؛ الإرث: `channels.slack.dm.allowFrom`)
    - `disabled`

    علامات الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom` (المفضل)
    - `dm.allowFrom` (إرث)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أسبقية تعدد الحسابات:

    - تنطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    تتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات ضمن `channels.slack.channels` ويجب أن تستخدم معرّفات قنوات ثابتة.

    ملاحظة وقت التشغيل: إذا كانت `channels.slack` مفقودة بالكامل (إعداد عبر متغيرات البيئة فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

    حل الاسم/المعرّف:

    - يتم حل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز المميز بذلك
    - تُحتفظ بإدخالات أسماء القنوات غير المحلولة كما هي مُكوَّنة، لكن يتم تجاهلها للتوجيه افتراضيًا
    - يكون التفويض الوارد وتوجيه القنوات قائمين على المعرّف أولًا افتراضيًا؛ وتتطلب المطابقة المباشرة لاسم المستخدم/الاسم المختصر `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="الإشارات ومستخدِمو القنوات">
    تكون رسائل القنوات محكومة بالإشارات افتراضيًا.

    مصادر الإشارة:

    - إشارة صريحة للتطبيق (`<@botId>`)
    - أنماط regex للإشارات (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك ضمني للرد على خيط البوت (يُعطَّل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر الحل عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: `id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُطابق `id:` فقط)

  </Tab>
</Tabs>

## الخيوط والجلسات وعلامات الرد

- تُوجَّه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIM كـ `group`.
- مع الإعداد الافتراضي `session.dmScope=main`، تُدمج رسائل Slack المباشرة في الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن أن تنشئ ردود الخيوط لواحق جلسات للخيط (`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- تتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل الخيط الموجودة التي يتم جلبها عند بدء جلسة خيط جديدة (الافتراضي `20`؛ اضبطها على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، تُمنع الإشارات الضمنية في الخيوط بحيث لا يرد البوت إلا على إشارات `@bot` الصريحة داخل الخيوط، حتى عندما يكون البوت قد شارك بالفعل في الخيط. من دون هذا، تتجاوز الردود في خيط شارك فيه البوت قيود `requireMention`.

عناصر التحكم في خيوط الرد:

- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل من `direct|group|channel`
- الاحتياطي القديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

علامات الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

ملاحظة: يؤدي `replyToMode="off"` إلى تعطيل **كل** خيوط الرد في Slack، بما في ذلك علامات `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث لا تزال العلامات الصريحة محترمة في وضع `"off"`. يعكس هذا الاختلاف نماذج الخيوط في المنصات: إذ تُخفي خيوط Slack الرسائل عن القناة، بينما تظل ردود Telegram مرئية في تدفق الدردشة الرئيسي.

## تفاعلات التأكيد

ترسل `ackReaction` رمز emoji للتأكيد بينما يعالج OpenClaw رسالة واردة.

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- الاحتياطي من emoji هوية الوكيل (`agents.list[].identity.emoji`، وإلا `"👀"`)

ملاحظات:

- يتوقع Slack رموزًا قصيرة (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو على مستوى عام.

## البث النصي

تتحكم `channels.slack.streaming` في سلوك المعاينة الحية:

- `off`: عطّل البث الحي للمعاينة.
- `partial` (الافتراضي): استبدل نص المعاينة بآخر إخراج جزئي.
- `block`: ألحِق تحديثات المعاينة المقطعة.
- `progress`: اعرض نص حالة التقدم أثناء التوليد، ثم أرسل النص النهائي.

تتحكم `channels.slack.streaming.nativeTransport` في البث النصي الأصلي في Slack عندما يكون `channels.slack.streaming.mode` هو `partial` (الافتراضي: `true`).

- يجب أن يكون خيط الرد متاحًا حتى يظهر البث النصي الأصلي وحالة خيط مساعد Slack. ويظل اختيار الخيط خاضعًا لـ `replyToMode`.
- لا تزال جذور القنوات والدردشات الجماعية قادرة على استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا.
- تبقى رسائل Slack المباشرة ذات المستوى الأعلى خارج الخيوط افتراضيًا، لذا فهي لا تعرض معاينة بنمط الخيط؛ استخدم ردود الخيوط أو `typingReaction` إذا كنت تريد تقدمًا مرئيًا هناك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدم معاينة المسودة بدلًا من البث النصي الأصلي في Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

المفاتيح القديمة:

- يتم ترحيل `channels.slack.streamMode` (`replace | status_final | append`) تلقائيًا إلى `channels.slack.streaming.mode`.
- يتم ترحيل القيمة المنطقية `channels.slack.streaming` تلقائيًا إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يتم ترحيل المفتاح القديم `channels.slack.nativeStreaming` تلقائيًا إلى `channels.slack.streaming.nativeTransport`.

## احتياطي تفاعل الكتابة

تضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يعالج OpenClaw ردًا، ثم تزيله عند انتهاء التشغيل. ويكون هذا أكثر فائدة خارج ردود الخيوط، التي تستخدم مؤشر حالة افتراضي "is typing...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack رموزًا قصيرة (مثل `"hourglass_flowing_sand"`).
- هذا التفاعل يُنفذ على أساس أفضل جهد، وتُجرى محاولة تنظيفه تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتقطيع والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزَّل مرفقات ملفات Slack من عناوين URL خاصة مستضافة على Slack (تدفق طلبات موثّق بالرمز المميز) وتُكتب إلى مخزن الوسائط عند نجاح الجلب وضمن حدود الحجم المسموح بها.

    الحد الأقصى الافتراضي للحجم الوارد وقت التشغيل هو `20MB` ما لم يُستبدل عبر `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم على أساس الفقرات أولًا
    - تستخدم عمليات إرسال الملفات واجهات Slack API للتحميل ويمكن أن تتضمن ردود خيوط (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا تستخدم عمليات الإرسال عبر القنوات القيم الافتراضية حسب نوع MIME من مسار الوسائط
  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    تُفتح رسائل Slack المباشرة عبر واجهات Slack API للمحادثات عند الإرسال إلى أهداف المستخدمين.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك أوامر الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوَّن أو كأوامر أصلية متعددة. كوّن `channels.slack.slashCommand` لتغيير الإعدادات الافتراضية للأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات بيان إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، وتُفعّل باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في التكوينات العامة بدلًا من ذلك.

- يكون الوضع التلقائي للأوامر الأصلية **معطّلًا** في Slack، لذا فإن `commands.native: "auto"` لا يفعّل أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائط الأصلية للوسائط استراتيجية عرض تكيفية تُظهر نموذج تأكيد قبل إرسال قيمة الخيار المحددة:

- حتى 5 خيارات: كتل أزرار
- من 6 إلى 100 خيار: قائمة اختيار ثابتة
- أكثر من 100 خيار: اختيار خارجي مع تصفية غير متزامنة للخيارات عندما تكون معالجات خيارات التفاعل متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المُرمّزة إلى الأزرار

```txt
/think
```

تستخدم جلسات أوامر الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وتستمر في توجيه تنفيذ الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم الردود التفاعلية التي ينشئها الوكيل، لكن هذه الميزة تكون معطّلة افتراضيًا.

فعّلها على مستوى عام:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

أو فعّلها لحساب Slack واحد فقط:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

عند التفعيل، يمكن للوكلاء إصدار توجيهات رد خاصة بـ Slack فقط:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

تُترجم هذه التوجيهات إلى Slack Block Kit وتُعيد توجيه النقرات أو التحديدات عبر مسار أحداث تفاعل Slack الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. القنوات الأخرى لا تترجم توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم استدعاء التفاعل هي رموز معتمة يُنشئها OpenClaw، وليست قيمًا خامًا أنشأها الوكيل.
- إذا تجاوزت الكتل التفاعلية المُنشأة حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة blocks غير صالحة.

## موافقات Exec في Slack

يمكن أن يعمل Slack كعميل موافقة أصلي مع أزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec `channels.slack.execApprovals.*` للتوجيه الأصلي في الرسائل المباشرة/القنوات.
- لا تزال موافقات Plugin قادرة على الحل عبر سطح أزرار Slack الأصلي نفسه عندما يصل الطلب بالفعل إلى Slack ويكون نوع معرّف الموافقة `plugin:`.
- لا يزال تفويض الموافقين مُطبّقًا: لا يمكن الموافقة على الطلبات أو رفضها عبر Slack إلا للمستخدمين الذين تم تحديدهم كموافقين.

يستخدم هذا سطح أزرار الموافقة المشتركة نفسه المستخدم في القنوات الأخرى. عندما يكون `interactivity` مفعّلًا في إعدادات تطبيق Slack لديك، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
وعندما تكون هذه الأزرار موجودة، فإنها تكون تجربة الاستخدام الأساسية للموافقة؛ ويجب على OpenClaw
ألا يضمّن أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى أن
موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار التكوين:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack موافقات Exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويُحلّ موافق واحد على الأقل. اضبط `enabled: false` لتعطيل Slack كعميل موافقة أصلي بشكل صريح.
واضبط `enabled: true` لفرض تشغيل الموافقات الأصلية عندما يُحلّ الموافقون.

السلوك الافتراضي من دون أي تكوين صريح لموافقات Slack Exec:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم تكوين Slack الأصلي الصريح إلا عندما تريد تجاوز الموافقين أو إضافة عوامل تصفية أو
الاشتراك في التسليم إلى دردشة الأصل:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

يكون تمرير `approvals.exec` المشترك منفصلًا. استخدمه فقط عندما يجب أن تُوجَّه مطالبات موافقة Exec أيضًا
إلى دردشات أخرى أو أهداف صريحة خارج النطاق. كما أن تمرير `approvals.plugin` المشترك
منفصل أيضًا؛ ولا تزال أزرار Slack الأصلية قادرة على حل موافقات Plugin عندما تصل هذه الطلبات بالفعل
إلى Slack.

يعمل `/approve` في الدردشة نفسها أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للحصول على نموذج تمرير الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوَّل تعديلات الرسائل/حذفها/بث الخيوط إلى أحداث نظام.
- تُحوَّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوَّل أحداث انضمام/مغادرة الأعضاء وإنشاء/إعادة تسمية القنوات وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح تكوين القنوات عندما يكون `configWrites` مفعّلًا.
- تُعامل بيانات وصف/غرض القناة الوصفية على أنها سياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تُرشَّح بادئات الخيوط وسياق سجل الخيط الأولي المزروع بحسب قوائم سماح المرسلين المكوَّنة عند الاقتضاء.
- تصدر إجراءات الكتل وتفاعلات النماذج أحداث نظام منظَّمة من نوع `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة والتسميات وقيم المنتقي وبيانات `workflow_*` الوصفية
  - أحداث النموذج `view_submission` و`view_closed` مع بيانات القناة الموجّهة ومدخلات النماذج

## مؤشرات مرجعية للتكوين

المرجع الأساسي:

- [مرجع التكوين - Slack](/ar/gateway/configuration-reference#slack)

  حقول Slack عالية الإشارة:
  - الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - وصول الرسائل المباشرة: `dm.enabled`, `dmPolicy`, `allowFrom` (الإرث: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - مفتاح التوافق: `dangerouslyAllowNameMatching` (للطوارئ؛ اتركه معطّلًا ما لم تكن بحاجة إليه)
  - وصول القنوات: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - الخيوط/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`
  - العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقّق، بالترتيب، من:

    - `groupPolicy`
    - قائمة سماح القنوات (`channels.slack.channels`)
    - `requireMention`
    - قائمة السماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="تجاهل رسائل DM">
    تحقّق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو المفتاح القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode لا يتصل">
    تحقّق من صحة bot token وapp token ومن تفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` أن `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مكوَّن لكن وقت التشغيل الحالي لم يتمكن من حل القيمة
    المدعومة بـ SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقّق من:

    - signing secret
    - مسار webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعلية + أوامر الشرطة المائلة)
    - قيمة `webhookPath` فريدة لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات
    الحساب، فهذا يعني أن حساب HTTP مكوَّن لكن وقت التشغيل الحالي لم يتمكن من
    حل signing secret المدعوم بـ SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع تسجيل أوامر الشرطة المائلة المطابقة في Slack
    - أو وضع أمر الشرطة المائلة الواحد (`channels.slack.slashCommand.enabled: true`)

    تحقّق أيضًا من `commands.useAccessGroups` وقوائم سماح القنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
- [التكوين](/ar/gateway/configuration)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
