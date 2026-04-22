---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع socket/HTTP في Slack
summary: إعداد Slack وسلوك وقت التشغيل (Socket Mode + عناوين URL لطلبات HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-22T04:20:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e80b1ff7dfe3124916f9a4334badc9a742a0d0843b37c77838ede9f830920ff7
    source_path: channels/slack.md
    workflow: 15
---

# Slack

الحالة: جاهز للإنتاج للرسائل المباشرة + القنوات عبر تكاملات تطبيق Slack. الوضع الافتراضي هو Socket Mode؛ كما أن عناوين URL لطلبات HTTP مدعومة أيضًا.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل المباشرة في Slack وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيصات المشتركة بين القنوات ودلائل الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Socket Mode (الافتراضي)">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [manifest المثال](#manifest-and-scope-checklist) من أدناه وتابع الإنشاء
        - أنشئ **App-Level Token** (`xapp-...`) باستخدام `connections:write`
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض
      </Step>

      <Step title="اضبط OpenClaw">

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

        احتياطي متغيرات البيئة (للحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="ابدأ gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="عناوين URL لطلبات HTTP">
    <Steps>
      <Step title="أنشئ تطبيق Slack جديدًا">
        في إعدادات تطبيق Slack اضغط زر **[Create New App](https://api.slack.com/apps/new)**:

        - اختر **from a manifest** وحدد مساحة عمل لتطبيقك
        - الصق [manifest المثال](#manifest-and-scope-checklist) وحدّث عناوين URL قبل الإنشاء
        - احفظ **Signing Secret** للتحقق من الطلبات
        - ثبّت التطبيق وانسخ **Bot Token** (`xoxb-...`) المعروض

      </Step>

      <Step title="اضبط OpenClaw">

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
        استخدم مسارات Webhook فريدة لـ HTTP متعدد الحسابات

        امنح كل حساب `webhookPath` مميزًا (الافتراضي `/slack/events`) حتى لا تتعارض عمليات التسجيل.
        </Note>

      </Step>

      <Step title="ابدأ gateway">

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

تكشف الميزات المختلفة التي توسّع الإعدادات الافتراضية أعلاه.

<AccordionGroup>
  <Accordion title="أوامر الشرطة المائلة الأصلية الاختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مُعد، مع بعض الفروق:

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
        "description": "List providers or models for a provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
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
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Reset the current session",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Stop the current run",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "List providers or models for a provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="نطاقات التأليف الاختيارية (عمليات الكتابة)">
    أضف نطاق bot ‏`chat:write.customize` إذا كنت تريد أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصين) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا كنت تستخدم أيقونة emoji، فإن Slack يتوقع صيغة `:emoji_name:`.
  </Accordion>
  <Accordion title="نطاقات user token الاختيارية (عمليات القراءة)">
    إذا قمت بإعداد `channels.slack.userToken`، فإن نطاقات القراءة المعتادة هي:

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

- يلزم `botToken` + `appToken` لوضع Socket Mode.
- يتطلب وضع HTTP كلًا من `botToken` + `signingSecret`.
- يقبل كل من `botToken` و`appToken` و`signingSecret` و`userToken` سلاسل
  نصية plaintext أو كائنات SecretRef.
- تتجاوز الرموز المميزة في الإعداد الاحتياطي من env.
- ينطبق الاحتياطي من env ‏`SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` على الحساب الافتراضي فقط.
- `userToken` ‏(`xoxp-...`) متاح في الإعداد فقط (من دون احتياطي env) ويكون افتراضيًا بسلوك للقراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقول `*Source` و`*Status`
  لكل بيانات اعتماد (`botToken` و`appToken` و`signingSecret` و`userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مُعد عبر SecretRef
  أو مصدر أسرار غير مضمن آخر، لكن مسار الأمر/وقت التشغيل الحالي
  لم يتمكن من حل القيمة الفعلية.
- في وضع HTTP، يتم تضمين `signingSecretStatus`؛ أما في Socket Mode، فإن
  الزوج المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل user token عند إعداده. بالنسبة إلى عمليات الكتابة، يظل bot token هو المفضل؛ ولا يُسمح بعمليات الكتابة باستخدام user token إلا عندما تكون `userTokenReadOnly: false` وbot token غير متاح.
</Tip>

## الإجراءات والقيود

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة   | الافتراضي |
| ---------- | --------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل المباشرة (القديم: `channels.slack.dm.policy`):

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.slack.allowFrom` القيمة `"*"`؛ القديم: `channels.slack.dm.allowFrom`)
    - `disabled`

    إشارات الرسائل المباشرة:

    - `dm.enabled` (الافتراضي true)
    - `channels.slack.allowFrom` (المفضل)
    - `dm.allowFrom` (قديم)
    - `dm.groupEnabled` (الرسائل المباشرة الجماعية افتراضيًا false)
    - `dm.groupChannels` (قائمة سماح MPIM اختيارية)

    أولوية الحسابات المتعددة:

    - ينطبق `channels.slack.accounts.default.allowFrom` على حساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا يكون لديها `allowFrom` خاص بها.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    يتحكم `channels.slack.groupPolicy` في التعامل مع القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة سماح القنوات ضمن `channels.slack.channels` ويجب أن تستخدم معرّفات قنوات مستقرة.

    ملاحظة وقت التشغيل: إذا كان `channels.slack` مفقودًا بالكامل (إعداد يعتمد على env فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

    تحليل الاسم/المعرّف:

    - يتم تحليل إدخالات قائمة سماح القنوات وإدخالات قائمة سماح الرسائل المباشرة عند بدء التشغيل عندما يسمح وصول الرمز المميز بذلك
    - يتم الاحتفاظ بإدخالات أسماء القنوات غير المحلولة كما هي مُعدة، لكنها تُتجاهل افتراضيًا في التوجيه
    - يعتمد التفويض الوارد وتوجيه القنوات على المعرّف أولًا افتراضيًا؛ وتتطلب المطابقة المباشرة لاسم المستخدم/slug تعيين `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="الإشارات ومستخدِمو القناة">
    تكون رسائل القنوات مقيّدة بالإشارات افتراضيًا.

    مصادر الإشارات:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - أنماط regex للإشارات (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك thread reply الضمني الموجّه إلى البوت (يُعطَّل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر التحليل وقت بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (قائمة سماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - صيغة مفتاح `toolsBySender`: ‏`id:` أو `e164:` أو `username:` أو `name:` أو wildcard ‏`"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة تُطابق `id:` فقط)

  </Tab>
</Tabs>

## Threads والجلسات وعلامات الرد

- تُوجَّه الرسائل المباشرة كـ `direct`؛ والقنوات كـ `channel`؛ وMPIMs كـ `group`.
- مع الإعداد الافتراضي `session.dmScope=main`، تندمج رسائل Slack المباشرة في الجلسة الرئيسية للوكيل.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- يمكن أن تُنشئ ردود thread لواحق جلسات thread ‏(`:thread:<threadTs>`) عند الاقتضاء.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل thread الموجودة التي يتم جلبها عند بدء جلسة thread جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون قيمته `true`، يتم منع الإشارات الضمنية في thread بحيث لا يستجيب البوت إلا لإشارات `@bot` الصريحة داخل threads، حتى عندما يكون البوت قد شارك بالفعل في thread. من دون ذلك، تتجاوز الردود في thread شارك فيه البوت تقييد `requireMention`.

عناصر التحكم في Reply threading:

- `channels.slack.replyToMode`: ‏`off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل من `direct|group|channel`
- الاحتياطي القديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

علامات الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

ملاحظة: يؤدي `replyToMode="off"` إلى تعطيل **كل** Reply threading في Slack، بما في ذلك علامات `[[reply_to_*]]` الصريحة. يختلف هذا عن Telegram، حيث لا تزال العلامات الصريحة محترمة في وضع `"off"`. يعكس هذا الاختلاف نماذج threading في المنصات: تخفي threads في Slack الرسائل عن القناة، بينما تظل ردود Telegram مرئية في تدفق الدردشة الرئيسي.

## تفاعلات Ack

يرسل `ackReaction` emoji للتأكيد بينما يعالج OpenClaw رسالة واردة.

ترتيب التحليل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- احتياطي emoji لهوية الوكيل (`agents.list[].identity.emoji`، وإلا `"👀"`)

ملاحظات:

- يتوقع Slack shortcodes (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو على المستوى العام.

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (افتراضي): استبدال نص المعاينة بآخر ناتج جزئي.
- `block`: إلحاق تحديثات المعاينة المجزأة.
- `progress`: عرض نص حالة التقدم أثناء الإنشاء، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عند تفعيل معاينة المسودة، يتم توجيه تحديثات الأداة/التقدم إلى رسالة المعاينة المعدلة نفسها (الافتراضي: `true`). عيّن القيمة `false` للإبقاء على رسائل الأداة/التقدم منفصلة.

يتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي في Slack عندما تكون قيمة `channels.slack.streaming.mode` هي `partial` (الافتراضي: `true`).

- يجب أن يكون Reply thread متاحًا حتى يظهر بث النص الأصلي وحالة Slack assistant thread. ويظل اختيار thread متبعًا لـ `replyToMode`.
- يمكن لجذور القنوات ودردشات المجموعات أن تستخدم معاينة المسودة العادية عندما لا يكون البث الأصلي متاحًا.
- تظل رسائل Slack المباشرة ذات المستوى الأعلى خارج threads افتراضيًا، لذلك لا تُظهر معاينة بنمط thread؛ استخدم ردود thread أو `typingReaction` إذا كنت تريد تقدمًا مرئيًا هناك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تؤدي النهايات النهائية للوسائط/الأخطاء إلى إلغاء تعديلات المعاينة المعلقة دون تفريغ مسودة مؤقتة؛ ولا يتم تفريغ النهايات النهائية النصية/الكتلية المؤهلة إلا عندما يمكنها تعديل المعاينة في مكانها.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدم معاينة المسودة بدلًا من بث النص الأصلي في Slack:

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

- يتم ترحيل `channels.slack.streamMode` ‏(`replace | status_final | append`) تلقائيًا إلى `channels.slack.streaming.mode`.
- يتم ترحيل `channels.slack.streaming` المنطقي تلقائيًا إلى `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- يتم ترحيل `channels.slack.nativeStreaming` القديم تلقائيًا إلى `channels.slack.streaming.nativeTransport`.

## الاحتياطي عبر تفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يعالج OpenClaw ردًا، ثم يزيله عند انتهاء التشغيل. وهذا مفيد أكثر خارج ردود thread، التي تستخدم مؤشر حالة افتراضيًا من نوع "is typing...".

ترتيب التحليل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack shortcodes (مثل `"hourglass_flowing_sand"`).
- يتم التعامل مع التفاعل بأفضل جهد، وتُحاوَل عملية التنظيف تلقائيًا بعد اكتمال الرد أو مسار الفشل.

## الوسائط والتقسيم والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزَّل مرفقات ملفات Slack من عناوين URL خاصة مستضافة لدى Slack (تدفق طلبات موثقة بالرمز المميز) وتُكتب إلى مخزن الوسائط عند نجاح الجلب والسماح بذلك ضمن حدود الحجم.

    يكون الحد الأقصى الافتراضي للحجم الوارد في وقت التشغيل هو `20MB` ما لم يتم تجاوزه عبر `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم مقاطع النص `channels.slack.textChunkLimit` (الافتراضي 4000)
    - يفعّل `channels.slack.chunkMode="newline"` التقسيم المعتمد على الفقرات أولًا
    - تستخدم عمليات إرسال الملفات واجهات Slack upload API ويمكن أن تتضمن ردود thread ‏(`thread_ts`)
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند إعداده؛ وإلا فتستخدم عمليات الإرسال إلى القنوات القيم الافتراضية حسب نوع MIME من مسار الوسائط
  </Accordion>

  <Accordion title="أهداف التسليم">
    الأهداف الصريحة المفضلة:

    - `user:<id>` للرسائل المباشرة
    - `channel:<id>` للقنوات

    تُفتح رسائل Slack المباشرة عبر Slack conversation APIs عند الإرسال إلى أهداف المستخدمين.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مُعد أو كعدة أوامر أصلية. اضبط `channels.slack.slashCommand` لتغيير القيم الافتراضية للأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات manifest إضافية](#additional-manifest-settings) في تطبيق Slack الخاص بك، ويتم تفعيلها باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في الإعدادات العامة بدلًا من ذلك.

- يكون الوضع التلقائي للأوامر الأصلية **معطّلًا** في Slack، لذا فإن `commands.native: "auto"` لا يفعّل أوامر Slack الأصلية.

```txt
/help
```

تستخدم قوائم الوسائط الأصلية للوسيطات استراتيجية عرض متكيفة تُظهر modal للتأكيد قبل إرسال قيمة الخيار المحدد:

- حتى 5 خيارات: كتل أزرار
- من 6 إلى 100 خيار: قائمة تحديد ثابتة
- أكثر من 100 خيار: تحديد خارجي مع تصفية غير متزامنة للخيارات عندما تكون معالجات خيارات interactivity متاحة
- عند تجاوز حدود Slack: تعود قيم الخيارات المرمّزة إلى الأزرار

```txt
/think
```

تستخدم جلسات الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>` وما تزال توجه تنفيذ الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم للردود التفاعلية التي يكتبها الوكيل، لكن هذه الميزة معطلة افتراضيًا.

فعّلها على المستوى العام:

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

تُحوَّل هذه التوجيهات إلى Slack Block Kit وتوجّه النقرات أو التحديدات مرة أخرى عبر مسار حدث Slack interaction الحالي.

ملاحظات:

- هذه واجهة مستخدم خاصة بـ Slack. ولا تترجم القنوات الأخرى توجيهات Slack Block Kit إلى أنظمة الأزرار الخاصة بها.
- قيم callback التفاعلية هي رموز opaque ينشئها OpenClaw، وليست قيمًا خامًا كتبها الوكيل.
- إذا كانت الكتل التفاعلية المولدة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة blocks غير صالحة.

## موافقات Exec في Slack

يمكن أن يعمل Slack كعميل موافقة أصلي مع أزرار وتفاعلات تفاعلية، بدلًا من الرجوع إلى Web UI أو الطرفية.

- تستخدم موافقات Exec المسار `channels.slack.execApprovals.*` للتوجيه الأصلي في الرسائل المباشرة/القنوات.
- لا تزال موافقات Plugin قادرة على التحليل عبر سطح أزرار Slack الأصلي نفسه عندما يصل الطلب بالفعل إلى Slack ويكون نوع معرّف الموافقة هو `plugin:`.
- لا يزال فرض تفويض المُوافق قائمًا: لا يمكن إلا للمستخدمين المحددين كموافقين الموافقة على الطلبات أو رفضها عبر Slack.

يستخدم هذا سطح أزرار الموافقة المشترك نفسه كما في القنوات الأخرى. عند تفعيل `interactivity` في إعدادات تطبيق Slack لديك، تُعرض مطالبات الموافقة كأزرار Block Kit مباشرةً داخل المحادثة.
وعند وجود هذه الأزرار، فإنها تكون تجربة المستخدم الأساسية للموافقة؛ ويجب على OpenClaw
ألا يضمّن أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار الإعداد:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` ‏(`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`، `sessionFilter`

يفعّل Slack موافقات exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` وعندما يتم تحليل مُوافق واحد على الأقل. عيّن `enabled: false` لتعطيل Slack كعميل موافقة أصلي بشكل صريح.
وعيّن `enabled: true` لفرض تفعيل الموافقات الأصلية عند تحليل المُوافقين.

السلوك الافتراضي دون أي إعداد صريح لموافقات Slack exec:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا تكون حاجة إلى إعداد Slack الأصلي الصريح إلا عندما تريد تجاوز المُوافقين أو إضافة عوامل تصفية أو
تفعيل التسليم إلى الدردشة الأصلية:

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
منفصل أيضًا؛ ولا تزال أزرار Slack الأصلية قادرة على تحليل موافقات plugin عندما تصل تلك الطلبات
إلى Slack بالفعل.

يعمل `/approve` داخل الدردشة نفسها أيضًا في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [Exec approvals](/ar/tools/exec-approvals) للحصول على نموذج توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوَّل عمليات تعديل الرسائل/حذفها/بث thread إلى أحداث نظام.
- تُحوَّل أحداث إضافة/إزالة التفاعلات إلى أحداث نظام.
- تُحوَّل أحداث انضمام/مغادرة الأعضاء وإنشاء/إعادة تسمية القنوات وإضافة/إزالة التثبيت إلى أحداث نظام.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح إعداد القنوات عندما تكون `configWrites` مفعلة.
- تُعامَل البيانات الوصفية لموضوع/غرض القناة على أنها سياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تتم تصفية بادئ thread وسياق التهيئة الأولي لسجل thread بواسطة قوائم سماح المرسلين المهيأة عند الاقتضاء.
- تصدر block actions وmodal interactions أحداث نظام منظمة من نوع `Slack interaction: ...` مع حقول حمولة غنية:
  - block actions: القيم المحددة والتسميات وقيم picker وبيانات `workflow_*` الوصفية
  - أحداث modal ‏`view_submission` و`view_closed` مع بيانات القناة الموجّهة وحقول إدخال النماذج

## مؤشرات مرجع الإعدادات

المرجع الأساسي:

- [مرجع الإعدادات - Slack](/ar/gateway/configuration-reference#slack)

  حقول Slack عالية الأهمية:
  - الوضع/المصادقة: `mode`، `botToken`، `appToken`، `signingSecret`، `webhookPath`، `accounts.*`
  - وصول الرسائل المباشرة: `dm.enabled`، `dmPolicy`، `allowFrom` (القديم: `dm.policy`، `dm.allowFrom`) و`dm.groupEnabled` و`dm.groupChannels`
  - مفتاح التوافق: `dangerouslyAllowNameMatching` (للحالات الطارئة؛ اتركه معطلًا ما لم تكن هناك حاجة)
  - وصول القنوات: `groupPolicy`، `channels.*`، `channels.*.users`، `channels.*.requireMention`
  - threading/السجل: `replyToMode` و`replyToModeByChatType` و`thread.*` و`historyLimit` و`dmHistoryLimit` و`dms.*.historyLimit`
  - التسليم: `textChunkLimit` و`chunkMode` و`mediaMaxMb` و`streaming` و`streaming.nativeTransport` و`streaming.preview.toolProgress`
  - العمليات/الميزات: `configWrites` و`commands.native` و`slashCommand.*` و`actions.*` و`userToken` و`userTokenReadOnly`

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقق بالترتيب مما يلي:

    - `groupPolicy`
    - قائمة سماح القنوات (`channels.slack.channels`)
    - `requireMention`
    - قائمة سماح `users` لكل قناة

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="يتم تجاهل رسائل DM">
    تحقق من:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو القديم `channels.slack.dm.policy`)
    - موافقات الاقتران / إدخالات قائمة السماح

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع Socket لا يتصل">
    تحقق من صحة bot token وapp token ومن تفعيل Socket Mode في إعدادات تطبيق Slack.

    إذا أظهر `openclaw channels status --probe --json` أن `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مُعد، لكن وقت التشغيل الحالي لم يتمكن من تحليل
    القيمة المدعومة بواسطة SecretRef.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقق من:

    - signing secret
    - مسار webhook
    - عناوين URL لطلبات Slack ‏(Events + Interactivity + Slash Commands)
    - `webhookPath` فريد لكل حساب HTTP

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات
    الحساب، فهذا يعني أن حساب HTTP مُعد ولكن وقت التشغيل الحالي لم يتمكن
    من تحليل signing secret المدعوم بواسطة SecretRef.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع تسجيل أوامر الشرطة المائلة المطابقة في Slack
    - أو وضع أمر الشرطة المائلة المفرد (`channels.slack.slashCommand.enabled: true`)

    تحقق أيضًا من `commands.useAccessGroups` وقوائم السماح الخاصة بالقناة/المستخدم.

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
