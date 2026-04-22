---
read_when:
    - تغيير سلوك الدردشة الجماعية أو تقييد الإشارات
summary: سلوك الدردشة الجماعية عبر مختلف الواجهات (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-04-22T04:20:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86e202c7e990e040eb092aaef46bc856ee8d39b2e5fe1c733e24f1b35faa824
    source_path: channels/groups.md
    workflow: 15
---

# المجموعات

يتعامل OpenClaw مع الدردشات الجماعية بشكل متسق عبر مختلف الواجهات: Discord وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo.

## مقدمة للمبتدئين (دقيقتان)

يعمل OpenClaw من خلال حسابات المراسلة الخاصة بك. لا يوجد مستخدم bot منفصل على WhatsApp.
إذا كنت **أنت** ضمن مجموعة، فيمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تقم بتعطيل تقييد الإشارات صراحةً.

بمعنى آخر: يمكن للمرسلين المسموح بهم ضمن قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

> باختصار
>
> - يتم التحكم في **الوصول إلى الرسائل الخاصة** بواسطة `*.allowFrom`.
> - يتم التحكم في **الوصول إلى المجموعات** بواسطة `*.groupPolicy` + قوائم السماح (`*.groups`, `*.groupAllowFrom`).
> - يتم التحكم في **تشغيل الردود** بواسطة تقييد الإشارات (`requireMention`, `/activation`).

تدفق سريع (ما الذي يحدث لرسالة المجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## رؤية السياق وقوائم السماح

يوجد عنصران مختلفان يتحكمان في أمان المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy`, `groups`, `groupAllowFrom`, وقوائم السماح الخاصة بكل قناة).
- **رؤية السياق**: ما السياق الإضافي الذي يتم حقنه في النموذج (نص الرد، والاقتباسات، وسجل السلسلة، وبيانات إعادة التوجيه الوصفية).

افتراضيًا، يعطي OpenClaw الأولوية لسلوك الدردشة الطبيعي ويُبقي السياق في الغالب كما تم استلامه. وهذا يعني أن قوائم السماح تحدد أساسًا من يمكنه تشغيل الإجراءات، وليست حدًا شاملًا للتنقيح لكل مقتطف مقتبس أو تاريخي.

السلوك الحالي خاص بكل قناة:

- تطبق بعض القنوات بالفعل تصفية قائمة على المرسل للسياق الإضافي في مسارات محددة (على سبيل المثال، تهيئة سلاسل Slack، وعمليات البحث عن الرد/السلسلة في Matrix).
- بينما لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما تم استلامه.

اتجاه التحصين (مخطط له):

- `contextVisibility: "all"` (الافتراضي) يبقي السلوك الحالي كما تم استلامه.
- `contextVisibility: "allowlist"` يرشح السياق الإضافي إلى المرسلين المسموح بهم.
- `contextVisibility: "allowlist_quote"` هو `allowlist` مع استثناء واحد صريح للاقتباس/الرد.

إلى أن يتم تنفيذ نموذج التحصين هذا بشكل متسق عبر القنوات، توقع وجود اختلافات حسب الواجهة.

![تدفق رسالة المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف | ما الذي يجب ضبطه |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح بكل المجموعات لكن الرد فقط عند @mentions | `groups: { "*": { requireMention: true } }` |
| تعطيل جميع الردود في المجموعات | `groupPolicy: "disabled"` |
| مجموعات محددة فقط | `groups: { "<group-id>": { ... } }` (بدون المفتاح `"*"`) |
| أنت فقط من يمكنه التشغيل داخل المجموعات | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## مفاتيح الجلسات

- تستخدم جلسات المجموعات مفاتيح جلسات بصيغة `agent:<agentId>:<channel>:group:<id>` (أما الغرف/القنوات فتستخدم `agent:<agentId>:<channel>:channel:<id>`).
- تضيف مواضيع منتديات Telegram اللاحقة `:topic:<threadId>` إلى معرّف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم الدردشات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا تم ضبط ذلك).
- يتم تخطي Heartbeat لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## نمط: الرسائل الخاصة الشخصية + المجموعات العامة (وكيل واحد)

نعم — هذا يعمل جيدًا إذا كانت الحركة “الشخصية” لديك هي **الرسائل الخاصة** وكانت الحركة “العامة” لديك هي **المجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل الخاصة عادةً إلى مفتاح الجلسة **الرئيسي** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل باستخدام `mode: "non-main"`، فستعمل جلسات المجموعات تلك ضمن الواجهة الخلفية للعزل المضبوطة، بينما تبقى جلسة الرسائل الخاصة الرئيسية على المضيف. ويكون Docker هو الواجهة الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا “عقل” وكيل واحد (مساحة عمل + ذاكرة مشتركتان)، لكن مع وضعي تنفيذ مختلفين:

- **الرسائل الخاصة**: أدوات كاملة (على المضيف)
- **المجموعات**: عزل + أدوات مقيّدة

> إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة تمامًا (بحيث لا يجب أن تختلط “الشخصية” و“العامة” أبدًا)، فاستخدم وكيلًا ثانيًا + bindings. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent).

مثال (الرسائل الخاصة على المضيف، والمجموعات داخل العزل + أدوات مراسلة فقط):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

هل تريد أن “تستطيع المجموعات رؤية المجلد X فقط” بدلًا من “عدم الوصول إلى المضيف”؟ أبقِ `workspaceAccess: "none"` وقم بتركيب المسارات المسموح بها فقط داخل العزل:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

ذو صلة:

- مفاتيح الإعدادات والقيم الافتراضية: [إعدادات Gateway](/ar/gateway/configuration-reference#agentsdefaultssandbox)
- تصحيح سبب حظر أداة: [العزل مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل bind mounts: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عند توفره، بتنسيق `<channel>:<token>`.
- `#room` محجوز للغرف/القنوات؛ وتستخدم الدردشات الجماعية `g-<slug>` (أحرف صغيرة، والمسافات تتحول إلى `-`، مع الإبقاء على `#@+._-`).

## سياسة المجموعات

تحكم في كيفية التعامل مع رسائل المجموعات/الغرف لكل قناة:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| السياسة | السلوك |
| ------------- | ------------------------------------------------------------ |
| `"open"` | تتجاوز المجموعات قوائم السماح؛ ويظل تقييد الإشارات مطبقًا. |
| `"disabled"` | حظر جميع رسائل المجموعات بالكامل. |
| `"allowlist"` | السماح فقط للمجموعات/الغرف التي تطابق قائمة السماح المضبوطة. |

ملاحظات:

- `groupPolicy` منفصلة عن تقييد الإشارات (الذي يتطلب @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (والبديل: `allowFrom` الصريح).
- تنطبق موافقات إقران الرسائل الخاصة (إدخالات مخزن `*-allowFrom`) على الوصول إلى الرسائل الخاصة فقط؛ أما تفويض مرسلي المجموعات فيظل صريحًا ضمن قوائم السماح الخاصة بالمجموعات.
- Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
- Slack: تستخدم قائمة السماح `channels.slack.channels`.
- Matrix: تستخدم قائمة السماح `channels.matrix.groups`. يُفضّل استخدام معرّفات الغرف أو الأسماء المستعارة؛ ويكون البحث عن اسم الغرفة المنضم إليها بأفضل جهد، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما أن قوائم السماح `users` لكل غرفة مدعومة أيضًا.
- يتم التحكم في الرسائل الخاصة الجماعية بشكل منفصل (`channels.discord.dm.*`, `channels.slack.dm.*`).
- يمكن لقائمة سماح Telegram مطابقة معرّفات المستخدمين (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); وتكون البوادئ غير حساسة لحالة الأحرف.
- القيمة الافتراضية هي `groupPolicy: "allowlist"`؛ وإذا كانت قائمة سماح المجموعات لديك فارغة، فسيتم حظر رسائل المجموعات.
- أمان وقت التشغيل: عند غياب كتلة مزود بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعات إلى وضع إغلاق آمن افتراضي (عادةً `allowlist`) بدلًا من وراثة `channels.defaults.groupPolicy`.

نموذج ذهني سريع (ترتيب التقييم لرسائل المجموعات):

1. `groupPolicy` ‏(open/disabled/allowlist)
2. قوائم سماح المجموعات (`*.groups`, `*.groupAllowFrom`, وقائمة السماح الخاصة بكل قناة)
3. تقييد الإشارات (`requireMention`, `/activation`)

## تقييد الإشارات (افتراضي)

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. توجد القيم الافتراضية لكل نظام فرعي تحت `*.groups."*"`.

يُحتسب الرد على رسالة bot كإشارة ضمنية عندما تدعم القناة
بيانات الرد الوصفية. ويمكن أيضًا أن يُحتسب اقتباس رسالة bot كإشارة ضمنية
على القنوات التي تكشف بيانات الاقتباس الوصفية. وتشمل الحالات المضمنة الحالية
Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

ملاحظات:

- `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ ويتم تجاهل الأنماط غير الصالحة وصيغ التكرار المتداخل غير الآمنة.
- الواجهات التي توفر إشارات صريحة ستستمر بالمرور؛ والأنماط هي بديل احتياطي.
- تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما تشترك عدة وكلاء في مجموعة واحدة).
- لا يتم فرض تقييد الإشارات إلا عندما يكون كشف الإشارات ممكنًا (عبر الإشارات الأصلية أو عند إعداد `mentionPatterns`).
- توجد القيم الافتراضية لـ Discord تحت `channels.discord.guilds."*"` (وقابلة للتجاوز لكل guild/channel).
- يتم تغليف سياق سجل المجموعات بشكل موحد عبر القنوات وهو **pending-only** (الرسائل التي تم تخطيها بسبب تقييد الإشارات)؛ استخدم `messages.groupChat.historyLimit` للقيمة الافتراضية العامة و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبط القيمة على `0` للتعطيل.

## قيود الأدوات للمجموعة/القناة (اختياري)

تدعم بعض إعدادات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح/المنع للأدوات على مستوى المجموعة كلها.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة.
  استخدم بوادئ المفاتيح الصريحة:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, وبديل `"*"`.
  لا تزال المفاتيح القديمة غير المسبوقة ببادئة مقبولة، وتتم مطابقتها على أنها `id:` فقط.

ترتيب الحل (الأكثر تحديدًا يفوز):

1. تطابق `toolsBySender` للمجموعة/القناة
2. `tools` للمجموعة/القناة
3. تطابق `toolsBySender` الافتراضي (`"*"`)
4. `tools` الافتراضي (`"*"`)

مثال (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

ملاحظات:

- يتم تطبيق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/أدوات الوكيل (ويظل المنع هو الغالب).
- تستخدم بعض القنوات تداخلًا مختلفًا للغرف/القنوات (مثلًا Discord `guilds.*.channels.*`، وSlack `channels.*`، وMicrosoft Teams `teams.*.channels.*`).

## قوائم السماح للمجموعات

عند إعداد `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في ضبط سلوك الإشارات الافتراضي.

من نقاط الالتباس الشائعة: موافقة إقران الرسائل الخاصة ليست هي نفسها تفويض المجموعات.
بالنسبة للقنوات التي تدعم إقران الرسائل الخاصة، فإن مخزن الإقران يفتح الرسائل الخاصة فقط. أما أوامر المجموعات فلا تزال تتطلب تفويضًا صريحًا لمرسل المجموعة من قوائم السماح في الإعدادات مثل `groupAllowFrom` أو الإعداد الاحتياطي الموثق لتلك القناة.

النيات الشائعة (نسخ/لصق):

1. تعطيل جميع الردود في المجموعات

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. السماح بمجموعات محددة فقط (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. السماح بكل المجموعات لكن مع طلب إشارة (صراحةً)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. المالك فقط يمكنه التشغيل داخل المجموعات (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## التفعيل (للمالك فقط)

يمكن لمالكي المجموعات تبديل التفعيل لكل مجموعة:

- `/activation mention`
- `/activation always`

يتم تحديد المالك بواسطة `channels.whatsapp.allowFrom` (أو E.164 الخاص بالـ bot نفسه عند عدم ضبطه). أرسل الأمر كرسالة مستقلة. وتتجاهل الواجهات الأخرى حاليًا `/activation`.

## حقول السياق

تضبط الحمولات الواردة من المجموعات ما يلي:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفًا)
- `GroupMembers` (إذا كان معروفًا)
- `WasMentioned` (نتيجة تقييد الإشارات)
- تتضمن مواضيع منتديات Telegram أيضًا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقنوات:

- يمكن لـ BlueBubbles اختياريًا إثراء المشاركين غير المسمّين في مجموعات macOS من قاعدة بيانات Contacts المحلية قبل تعبئة `GroupMembers`. ويكون هذا معطلًا افتراضيًا ولا يعمل إلا بعد اجتياز تقييد المجموعات العادي.

يتضمن system prompt الخاص بالوكيل مقدمة للمجموعة في أول دور ضمن جلسة مجموعة جديدة. وهو يذكّر النموذج بالرد مثل إنسان، وتجنب جداول Markdown، وتقليل الأسطر الفارغة، واتباع تباعد الدردشة العادي، وتجنب كتابة تسلسلات `\n` حرفيًا.

## تفاصيل خاصة بـ iMessage

- يُفضّل استخدام `chat_id:<id>` عند التوجيه أو الإدراج في قائمة السماح.
- عرض الدردشات: `imsg chats --limit 20`.
- تعود الردود في المجموعات دائمًا إلى نفس `chat_id`.

## system prompts في WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) للاطلاع على القواعد الأساسية الخاصة بـ system prompt في WhatsApp، بما في ذلك معالجة prompts للمجموعات والرسائل المباشرة، وسلوك wildcard، ودلالات تجاوز الحساب.

## تفاصيل خاصة بـ WhatsApp

راجع [رسائل المجموعات](/ar/channels/group-messages) للاطلاع على السلوك الخاص بـ WhatsApp فقط (حقن السجل، وتفاصيل التعامل مع الإشارات).
