---
read_when:
    - إعداد Slack أو تصحيح وضع Socket/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (Socket Mode + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-23T07:19:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3daf52cd28998bf7d692190468b9d8330f1867f56e49fc69666e7e107d4ba47c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

الحالة: جاهز للإنتاج للرسائل الخاصة + القنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن عناوين URL لطلبات HTTP مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تكون الرسائل الخاصة في Slack افتراضيًا في وضع الاقتران.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [نموذج manifest](#manifest-and-scope-checklist) أدناه ثم تابع الإنشاء
        - أنشئ **App-Level Token** (`xapp-...`) مع `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض
      </Step>

      <Step title="إعداد OpenClaw">

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

      <Step title="بدء Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="عناوين URL لطلبات HTTP">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [نموذج manifest](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

      </Step>

      <Step title="إعداد OpenClaw">

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
        استخدم مسارات Webhook فريدة لبيئة HTTP متعددة الحسابات

        امنح كل حساب `webhookPath` مختلفًا (الافتراضي `/slack/events`) حتى لا تتعارض عمليات التسجيل.
        </Note>

      </Step>

      <Step title="بدء Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## قائمة التحقق من manifest والنطاقات

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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
        "description": "Send a message to OpenClaw",
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
    "description": "Slack connector for OpenClaw"
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
        "description": "Send a message to OpenClaw",
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

### إعدادات manifest إضافية

اعرض ميزات مختلفة توسّع الإعدادات الافتراضية أعلاه.

<AccordionGroup>
  <Accordion title="أوامر الشرطة المائلة الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مُعدّ مع بعض الفروق:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن إتاحة أكثر من 25 أمر شرطة مائلة في الوقت نفسه.

    استبدل قسم `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (الافتراضي)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
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
        "description": "بدء جلسة جديدة",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "إعادة تعيين الجلسة الحالية",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "ضغط سياق الجلسة",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "إيقاف التشغيل الحالي",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "إدارة انتهاء ارتباط السلسلة",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "ضبط مستوى التفكير",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "تبديل المخرجات المطولة",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "عرض الوضع السريع أو ضبطه",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "تبديل إظهار الاستدلال",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "تبديل الوضع المرتفع",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "عرض إعدادات exec الافتراضية أو ضبطها",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "عرض النموذج أو ضبطه",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "سرد المزوّدين أو النماذج الخاصة بمزوّد معيّن",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "عرض ملخص المساعدة المختصر",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "عرض فهرس الأوامر المُولَّد",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "عرض ما يمكن للوكيل الحالي استخدامه الآن",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "عرض حالة وقت التشغيل، بما في ذلك استخدام المزوّد/الحصة عند توفرها",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "سرد المهام الخلفية النشطة/الأخيرة للجلسة الحالية",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "شرح كيفية تجميع السياق",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "عرض هوية المرسل الخاصة بك",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "تشغيل Skill بالاسم",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "طرح سؤال جانبي دون تغيير سياق الجلسة",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "التحكم في تذييل الاستخدام أو عرض ملخص التكلفة",
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

    إذا استخدمت أيقونة emoji، يتوقع Slack صيغة `:emoji_name:`.

  </Accordion>
  <Accordion title="نطاقات user token الاختيارية (عمليات القراءة)">
    إذا قمت بتكوين `channels.slack.userToken`، فإن نطاقات القراءة المعتادة هي:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (إذا كنت تعتمد على قراءات بحث Slack)

  </Accordion>
</AccordionGroup>

## نموذج الرموز المميزة

- يتطلب Socket Mode كلا من `botToken` و`appToken`.
- يتطلب وضع HTTP كلا من `botToken` و`signingSecret`.
- تقبل `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل نصية صريحة
  أو كائنات SecretRef.
- تتجاوز الرموز المميزة في الإعدادات القيم الاحتياطية من البيئة.
- ينطبق الاحتياط من متغيرات البيئة `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` (`xoxp-...`) متاح في الإعدادات فقط (من دون احتياط من البيئة) ويكون افتراضيًا بسلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status`
  لكل بيانات اعتماد (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مُعدّ عبر SecretRef
  أو مصدر سري آخر غير مضمن، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من تحليل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ وفي Socket Mode، يكون الزوج
  المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة للإجراءات/قراءات الدليل، يمكن تفضيل user token عند تكوينه. بالنسبة للكتابات، يظل bot token هو المفضل؛ ولا يُسمح بعمليات الكتابة عبر user token إلا عندما تكون `userTokenReadOnly: false` وbot token غير متاح.
</Tip>

## الإجراءات والبوابات

تُدار إجراءات Slack بواسطة `channels.slack.actions.*`.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة   | الافتراضي |
| ---------- | ------- |
| الرسائل   | مفعّل |
| التفاعلات  | مفعّل |
| التثبيتات       | مفعّل |
| معلومات الأعضاء | مفعّل |
| قائمة emoji  | مفعّل |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل الخاصة (القديم: `channels.slack.dm.policy`):

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`؛ القديم: `channels.slack.dm.allowFrom`)
    - `disabled`

    أعلام الرسائل الخاصة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom` (المفضل)
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل الخاصة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أسبقية الحسابات المتعددة:

    - تنطبق `channels.slack.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    يستخدم الاقتران في الرسائل الخاصة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    يتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة السماح للقنوات تحت `channels.slack.channels` ويجب أن تستخدم معرّفات قنوات ثابتة.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودًا بالكامل (إعداد بالبيئة فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة).

    تحليل الاسم/المعرّف:

    - تُحل إدخالات قائمة السماح للقنوات وإدخالات قائمة السماح للرسائل الخاصة عند بدء التشغيل عندما يسمح وصول الرمز المميز بذلك
    - يتم الاحتفاظ بإدخالات أسماء القنوات غير المحلولة كما هي في الإعداد لكن يتم تجاهلها افتراضيًا في التوجيه
    - يعتمد التفويض الوارد وتوجيه القنوات على المعرّف أولًا افتراضيًا؛ وتتطلب مطابقة اسم المستخدم/الاسم المختصر مباشرةً `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="الإشارات ومستخدمي القناة">
    تكون رسائل القناة مقيّدة بالإشارة افتراضيًا.

    مصادر الإشارة:

    - إشارة صريحة للتطبيق (`<@botId>`)
    - أنماط regex للإشارات (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك السلسلة الضمني عند الرد على البوت (يُعطَّل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر التحليل عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - تنسيق مفتاح `toolsBySender`: ‏`id:` أو `e164:` أو `username:` أو `name:` أو wildcard `"*"`
      (المفاتيح القديمة غير المسبوقة لا تزال تُطابق `id:` فقط)

  </Tab>
</Tabs>

## السلاسل والجلسات وعلامات الرد

- تُوجَّه الرسائل الخاصة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- مع الإعداد الافتراضي `session.dmScope=main`، تُدمج الرسائل الخاصة في Slack ضمن الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن أن تنشئ ردود السلاسل لواحق جلسات سلاسل (`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل السلسلة الموجودة التي تُجلب عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون `true`، تُلغى الإشارات الضمنية في السلاسل بحيث لا يرد البوت إلا على إشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. من دون ذلك، تتجاوز الردود في سلسلة شارك فيها البوت تقييد `requireMention`.

عناصر التحكم في سلاسل الرد:

- `channels.slack.replyToMode`: ‏`off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل من `direct|group|channel`
- الاحتياط القديم للدردشات المباشرة: `channels.slack.dm.replyToMode`

علامات الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

ملاحظة: يؤدي `replyToMode="off"` إلى تعطيل **جميع** سلاسل الرد في Slack، بما في ذلك علامات `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث تظل العلامات الصريحة محترمة في وضع `"off"`. يعكس هذا الاختلاف نماذج السلاسل في المنصتين: تخفي سلاسل Slack الرسائل عن القناة، بينما تظل ردود Telegram مرئية في تدفق الدردشة الرئيسي.

تُوجَّه ردود سلاسل Slack المركزة عبر جلسة ACP المرتبطة بها عند وجودها، بدلًا من إعداد الرد مقابل الغلاف الافتراضي للوكيل. يحافظ ذلك على ارتباطات `/focus` و`/acp spawn ... --bind here` للرسائل اللاحقة في السلسلة.

## تفاعلات الإقرار

يرسل `ackReaction` رمز emoji للإقرار بينما يعالج OpenClaw رسالة واردة.

ترتيب التحليل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- احتياط emoji لهوية الوكيل (`agents.list[].identity.emoji`، وإلا `"👀"`)

ملاحظات:

- يتوقع Slack أسماء shortcodes (على سبيل المثال `"eyes"`).
- استخدم `""` لتعطيل التفاعل لهذا الحساب في Slack أو على مستوى عام.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث خرج جزئي.
- `block`: إلحاق تحديثات المعاينة المقطعة.
- `progress`: عرض نص حالة التقدم أثناء التوليد، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عند تفعيل معاينة المسودة، يتم توجيه تحديثات الأدوات/التقدم إلى رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). اضبطها على `false` للإبقاء على رسائل الأدوات/التقدم منفصلة.

يتحكم `channels.slack.streaming.nativeTransport` في البث النصي الأصلي في Slack عندما يكون `channels.slack.streaming.mode` مضبوطًا على `partial` (الافتراضي: `true`).

- يجب أن تكون سلسلة رد متاحة حتى يظهر البث النصي الأصلي وحالة سلسلة المساعد في Slack. لا يزال اختيار السلسلة يتبع `replyToMode`.
- لا يزال بإمكان جذور القنوات ودردشات المجموعات استخدام معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا.
- تظل الرسائل الخاصة العلوية في Slack خارج السلاسل افتراضيًا، لذلك لا تعرض معاينة بنمط السلسلة؛ استخدم ردود السلسلة أو `typingReaction` إذا أردت إظهار التقدم هناك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تؤدي النهايات النهائية الخاصة بالوسائط/الأخطاء إلى إلغاء تعديلات المعاينة المعلقة من دون تفريغ مسودة مؤقتة؛ أما النهايات النصية/الكتلية المؤهلة فلا تُفرغ إلا عندما يمكنها تعديل المعاينة في مكانها.
- إذا فشل البث أثناء الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.
- تعود قنوات Slack Connect التي ترفض بثًا قبل أن تفرغ SDK مخزنها المؤقت المحلي إلى ردود Slack العادية، حتى لا تُسقط الردود القصيرة بصمت أو يُبلّغ عنها على أنها سُلّمت قبل أن يؤكدها Slack.

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
- يتم ترحيل `channels.slack.nativeStreaming` القديم تلقائيًا إلى `channels.slack.streaming.nativeTransport`.

## احتياطي تفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يعالج OpenClaw ردًا، ثم يزيله عند انتهاء التشغيل. يكون هذا أكثر فائدة خارج ردود السلسلة، التي تستخدم مؤشر الحالة الافتراضي "is typing...".

ترتيب التحليل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack أسماء shortcodes (على سبيل المثال `"hourglass_flowing_sand"`).
- التفاعل هو أفضل جهد، وتتم محاولة التنظيف تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتقطيع والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    يتم تنزيل مرفقات ملفات Slack من عناوين URL خاصة مستضافة على Slack (تدفق طلبات موثّق بالرمز المميز) وكتابتها إلى مخزن الوسائط عندما ينجح الجلب وتسمح حدود الحجم بذلك.

    يكون الحد الأقصى لحجم الوارد أثناء وقت التشغيل افتراضيًا `20MB` ما لم يتم تجاوزه بواسطة `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم مقاطع النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم بحسب الفقرات أولًا
    - تستخدم عمليات إرسال الملفات واجهات Slack API للرفع ويمكن أن تتضمن ردود السلسلة (`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند تكوينه؛ وإلا فإن عمليات الإرسال عبر القناة تستخدم القيم الافتراضية بحسب نوع MIME من مسار الوسائط
  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل الخاصة
    - `channel:<id>` للقنوات

    تُفتح الرسائل الخاصة في Slack عبر واجهات Slack conversation API عند الإرسال إلى أهداف المستخدمين.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مكوَّن أو كعدة أوامر أصلية. قم بتكوين `channels.slack.slashCommand` لتغيير إعدادات الأوامر الافتراضية:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات manifest إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في الإعدادات العامة بدلًا من ذلك.

- يكون الوضع التلقائي للأوامر الأصلية **معطّلًا** في Slack، لذلك لا يؤدي `commands.native: "auto"` إلى تفعيل الأوامر الأصلية في Slack.

```txt
/help
```

تستخدم قوائم الوسائط الخاصة بالوسيطات الأصلية استراتيجية عرض تكيفية تعرض نافذة تأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- من 6 إلى 100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع تصفية خيارات غير متزامنة عندما تكون معالجات خيارات التفاعل متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المرمّزة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وما زالت توجه تنفيذات الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم رد تفاعلية منشأة بواسطة الوكيل، لكن هذه الميزة معطّلة افتراضيًا.

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

تُجمَّع هذه التوجيهات إلى Slack Block Kit وتُوجَّه النقرات أو التحديدات مرة أخرى عبر مسار أحداث التفاعل الحالي في Slack.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. لا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم الاستدعاء التفاعلي هي رموز معتمة يُنشئها OpenClaw، وليست قيمًا أولية منشأة مباشرة بواسطة الوكيل.
- إذا تجاوزت الكتل التفاعلية المولدة حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

## موافقات exec في Slack

يمكن لـ Slack أن يعمل كعميل موافقة أصلي بأزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- تستخدم موافقات Exec المسار `channels.slack.execApprovals.*` للتوجيه الأصلي في الرسائل الخاصة/القنوات.
- لا تزال موافقات Plugin تُحل عبر سطح أزرار Slack الأصلي نفسه عندما يصل الطلب بالفعل إلى Slack ويكون نوع معرّف الموافقة هو `plugin:`.
- لا يزال تفويض الموافقين مُطبقًا: يمكن فقط للمستخدمين المعرّفين كموافقين الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشتركة نفسه المستخدم في القنوات الأخرى. عندما يكون `interactivity` مفعّلًا في إعدادات تطبيق Slack الخاص بك، تُعرَض مطالبات الموافقة كأزرار Block Kit مباشرة في المحادثة.
عند وجود هذه الأزرار، تكون هي تجربة المستخدم الأساسية للموافقة؛ ويجب على OpenClaw
ألا يتضمن أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى أن
الموافقات عبر الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار الإعداد:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`, `sessionFilter`

يفعّل Slack تلقائيًا موافقات exec الأصلية عندما تكون `enabled` غير مضبوطة أو `"auto"` ويتم تحليل
موافق واحد على الأقل. اضبط `enabled: false` لتعطيل Slack كعميل موافقة أصلي بشكل صريح.
واضبط `enabled: true` لفرض تفعيل الموافقات الأصلية عندما يتم تحليل الموافقين.

السلوك الافتراضي من دون إعداد صريح لموافقات exec في Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم إعداد Slack الأصلي الصريح إلا عندما تريد تجاوز الموافقين، أو إضافة مرشحات، أو
تفعيل التسليم إلى دردشة المصدر:

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

يكون توجيه `approvals.exec` المشترك منفصلًا. استخدمه فقط عندما يجب أيضًا
توجيه مطالبات موافقة exec إلى دردشات أخرى أو أهداف صريحة خارج النطاق. كما أن توجيه `approvals.plugin` المشترك
منفصل أيضًا؛ ولا تزال أزرار Slack الأصلية قادرة على حل موافقات plugin عندما تصل هذه الطلبات بالفعل
إلى Slack.

يعمل أيضًا الأمر `/approve` في الدردشة نفسها ضمن قنوات Slack والرسائل الخاصة التي تدعم الأوامر بالفعل. راجع [موافقات Exec](/ar/tools/exec-approvals) للحصول على نموذج توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوَّل عمليات تعديل/حذف الرسائل وبث السلاسل إلى أحداث نظام.
- تُحوَّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوَّل أحداث انضمام/مغادرة الأعضاء، وإنشاء/إعادة تسمية القنوات، وإضافة/إزالة التثبيتات إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح إعدادات القناة عندما تكون `configWrites` مفعّلة.
- تُعامل بيانات وصف/غرض القناة الوصفية على أنها سياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية مُنشئ السلسلة وسياق سجل السلسلة الأولي المزروع بحسب قوائم سماح المرسلين المضبوطة عند الاقتضاء.
- تُصدر إجراءات الكتل والتفاعلات مع النوافذ أحداث نظام منظَّمة من نوع `Slack interaction: ...` مع حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم أدوات الاختيار، وبيانات `workflow_*` الوصفية
  - أحداث `view_submission` و`view_closed` الخاصة بالنوافذ مع بيانات القناة الموجَّهة ومدخلات النماذج

## مؤشرات مرجع الإعدادات

المرجع الأساسي:

- [مرجع الإعدادات - Slack](/ar/gateway/configuration-reference#slack)

  حقول Slack عالية الأهمية:
  - الوضع/المصادقة: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - وصول الرسائل الخاصة: `dm.enabled`, `dmPolicy`, `allowFrom` (القديم: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - مفتاح التوافق: `dangerouslyAllowNameMatching` (للطوارئ فقط؛ اتركه معطّلًا ما لم تكن بحاجة إليه)
  - وصول القنوات: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - السلاسل/السجل: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - العمليات/الميزات: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقّق، بالترتيب:

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

  <Accordion title="يتم تجاهل رسائل الرسائل الخاصة">
    تحقّق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode لا يتصل">
    تحقّق من صحة bot token وapp token ومن تفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` أن `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مُعدّ لكن وقت التشغيل الحالي لم يتمكن من تحليل
    القيمة المدعومة بواسطة SecretRef.

  </Accordion>

  <Accordion title="HTTP mode لا يستقبل الأحداث">
    تحقّق من:

    - signing secret
    - مسار webhook
    - عناوين URL لطلبات Slack ‏(Events + Interactivity + Slash Commands)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات
    الحساب، فهذا يعني أن حساب HTTP مُعدّ لكن وقت التشغيل الحالي لم يتمكن
    من تحليل signing secret المدعوم بواسطة SecretRef.

    يتم إرسال Webhookات Request URL المسجّلة عبر سجل المعالجات المشتركة نفسه المستخدم في إعداد Slack monitor، لذلك تستمر أحداث Slack في وضع HTTP في التوجيه عبر المسار المسجّل بدلًا من إرجاع 404 بعد تسجيل المسار بنجاح.

  </Accordion>

  <Accordion title="تنزيل الملفات باستخدام bot tokens مخصصة">
    يقوم المساعد `downloadFile` بتحليل bot token من إعدادات وقت التشغيل عندما يمرر المستدعي `cfg` من دون `token` صريح أو عميل مُنشأ مسبقًا، مما يحافظ على تنزيلات الملفات المعتمدة على cfg فقط خارج مسار وقت تشغيل الإجراء.
  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع تسجيل أوامر الشرطة المائلة المطابقة في Slack
    - أو وضع أمر شرطة مائلة واحد (`channels.slack.slashCommand.enabled: true`)

    تحقّق أيضًا من `commands.useAccessGroups` وقوائم السماح الخاصة بالقنوات/المستخدمين.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
- [الإعدادات](/ar/gateway/configuration)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
