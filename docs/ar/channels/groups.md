---
read_when:
    - تغيير سلوك الدردشة الجماعية أو تقييد الإشارات
summary: سلوك الدردشة الجماعية عبر الأسطح المختلفة (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-04-21T07:18:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbcdebd340a2ebb5898fe1eaf52258f65ba434bcf3be010d81b0e74af728aad4
    source_path: channels/groups.md
    workflow: 15
---

# المجموعات

يتعامل OpenClaw مع الدردشات الجماعية بشكل متسق عبر الأسطح المختلفة: Discord وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo.

## مقدمة للمبتدئين (دقيقتان)

يعيش OpenClaw على حسابات المراسلة الخاصة بك. لا يوجد مستخدم روبوت WhatsApp منفصل.
إذا كنت **أنت** موجودًا في مجموعة، فيمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تقم صراحةً بتعطيل تقييد الإشارات.

بمعنى آخر: يمكن للمرسلين الموجودين في قائمة السماح تشغيل OpenClaw عن طريق الإشارة إليه.

> باختصار
>
> - يتم التحكم في **الوصول إلى الرسائل الخاصة** بواسطة `*.allowFrom`.
> - يتم التحكم في **الوصول إلى المجموعات** بواسطة `*.groupPolicy` + قوائم السماح (`*.groups`, `*.groupAllowFrom`).
> - يتم التحكم في **تشغيل الردود** بواسطة تقييد الإشارات (`requireMention`, `/activation`).

التدفق السريع (ما الذي يحدث لرسالة مجموعة):

````
groupPolicy? disabled -> إسقاط
groupPolicy? allowlist -> هل المجموعة مسموح بها؟ لا -> إسقاط
requireMention? yes -> هل توجد إشارة؟ لا -> تخزين للسياق فقط
otherwise -> رد
````

## رؤية السياق وقوائم السماح

هناك عنصران مختلفان يدخلان في أمان المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy`, `groups`, `groupAllowFrom`, وقوائم السماح الخاصة بالقناة).
- **رؤية السياق**: ما السياق الإضافي الذي يتم حقنه في النموذج (نص الرد، الاقتباسات، سجل الخيط، بيانات إعادة التوجيه الوصفية).

بشكل افتراضي، يعطي OpenClaw الأولوية لسلوك الدردشة الطبيعي ويحافظ على السياق في الغالب كما تم استلامه. وهذا يعني أن قوائم السماح تحدد أساسًا من يمكنه تشغيل الإجراءات، وليست حدًا عامًا للإخفاء لكل مقتطف مقتبس أو تاريخي.

السلوك الحالي خاص بكل قناة:

- بعض القنوات تطبق بالفعل تصفية قائمة على المرسل على السياق الإضافي في مسارات محددة (على سبيل المثال، تهيئة خيوط Slack، وعمليات البحث عن الرد/الخيط في Matrix).
- قنوات أخرى لا تزال تمرر سياق الاقتباس/الرد/إعادة التوجيه كما تم استلامه.

اتجاه التقوية (مخطط له):

- `contextVisibility: "all"` (الافتراضي) يحافظ على السلوك الحالي كما تم استلامه.
- `contextVisibility: "allowlist"` يرشح السياق الإضافي إلى المرسلين الموجودين في قائمة السماح.
- `contextVisibility: "allowlist_quote"` هو `allowlist` بالإضافة إلى استثناء واحد صريح للاقتباس/الرد.

إلى أن يتم تنفيذ نموذج التقوية هذا بشكل متسق عبر القنوات، توقّع وجود اختلافات حسب السطح.

![تدفق رسائل المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف | ما الذي يجب ضبطه |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح بكل المجموعات ولكن الرد فقط عند @mentions | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل الردود في المجموعات | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط | `groups: { "<group-id>": { ... } }` (بدون مفتاح `"*"`)         |
| أنت فقط من يمكنه التشغيل داخل المجموعات | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## مفاتيح الجلسة

- تستخدم جلسات المجموعات مفاتيح جلسات بالشكل `agent:<agentId>:<channel>:group:<id>` (وتستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف موضوعات منتدى Telegram القيمة `:topic:<threadId>` إلى معرّف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم الدردشات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا تم تكوين ذلك).
- يتم تخطي Heartbeat لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## النمط: الرسائل الخاصة الشخصية + المجموعات العامة (وكيل واحد)

نعم — هذا يعمل جيدًا إذا كانت حركة المرور “الشخصية” لديك هي **الرسائل الخاصة** وكانت حركة المرور “العامة” لديك هي **المجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل الخاصة عادةً إلى مفتاح الجلسة **الرئيسية** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل باستخدام `mode: "non-main"`، فستعمل جلسات المجموعات تلك داخل الواجهة الخلفية للعزل المكوّنة، بينما تبقى جلسة الرسائل الخاصة الرئيسية لديك على المضيف. Docker هو الواجهة الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا “عقل” وكيل واحد (مساحة عمل + ذاكرة مشتركتان)، ولكن بوضعي تنفيذ:

- **الرسائل الخاصة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيّدة

> إذا كنت بحاجة إلى مساحات عمل/شخصيات منفصلة فعليًا (بحيث لا يجوز أبدًا خلط “الشخصي” و“العام”)، فاستخدم وكيلًا ثانيًا + bindings. راجع [التوجيه متعدد الوكلاء](/concepts/multi-agent).

مثال (الرسائل الخاصة على المضيف، والمجموعات داخل العزل + أدوات مراسلة فقط):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // المجموعات/القنوات غير رئيسية -> داخل العزل
        scope: "session", // أقوى عزل (حاوية واحدة لكل مجموعة/قناة)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // إذا كانت allow غير فارغة، فسيتم حظر كل شيء آخر (ولا يزال deny له الأولوية).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

هل تريد أن “تتمكن المجموعات فقط من رؤية المجلد X” بدلًا من “عدم الوصول إلى المضيف”؟ أبقِ `workspaceAccess: "none"` كما هو، وقم بتركيب المسارات الموجودة في قائمة السماح فقط داخل العزل:

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
- تصحيح سبب حظر أداة: [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل bind mounts: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عند توفره، بالتنسيق `<channel>:<token>`.
- `#room` مخصص للغرف/القنوات؛ أما الدردشات الجماعية فتستخدم `g-<slug>` (أحرف صغيرة، وتتحول المسافات إلى `-`، مع الاحتفاظ بـ `#@+._-`).

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
      groupAllowFrom: ["123456789"], // معرّف مستخدم Telegram رقمي (يمكن للمعالج resolve @username)
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
| `"open"`      | تتجاوز المجموعات قوائم السماح؛ ولا يزال تقييد الإشارات مطبقًا.      |
| `"disabled"`  | حظر كل رسائل المجموعات بالكامل.                           |
| `"allowlist"` | السماح فقط للمجموعات/الغرف التي تطابق قائمة السماح المكوّنة. |

ملاحظات:

- `groupPolicy` منفصلة عن تقييد الإشارات (الذي يتطلب @mentions).
- WhatsApp وTelegram وSignal وiMessage وMicrosoft Teams وZalo: استخدم `groupAllowFrom` (البديل الاحتياطي: `allowFrom` الصريح).
- تنطبق موافقات اقتران الرسائل الخاصة (إدخالات مخزن `*-allowFrom`) على الوصول إلى الرسائل الخاصة فقط؛ أما تفويض مرسل المجموعة فيظل صريحًا عبر قوائم سماح المجموعات.
- Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
- Slack: تستخدم قائمة السماح `channels.slack.channels`.
- Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرّفات الغرف أو الأسماء المستعارة؛ فالبحث عن أسماء الغرف المنضم إليها هو best-effort، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما أن قوائم السماح `users` لكل غرفة مدعومة أيضًا.
- يتم التحكم في Group DMs بشكل منفصل (`channels.discord.dm.*`, `channels.slack.dm.*`).
- يمكن لقائمة السماح في Telegram مطابقة معرّفات المستخدمين (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); prefixes غير حساسة لحالة الأحرف.
- القيمة الافتراضية هي `groupPolicy: "allowlist"`؛ وإذا كانت قائمة السماح للمجموعات فارغة، فسيتم حظر رسائل المجموعات.
- أمان وقت التشغيل: عندما تكون كتلة المزوّد مفقودة بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعات إلى وضع مغلق افتراضيًا وآمنًا (عادةً `allowlist`) بدلًا من وراثة `channels.defaults.groupPolicy`.

نموذج ذهني سريع (ترتيب التقييم لرسائل المجموعات):

1. `groupPolicy` ‏(open/disabled/allowlist)
2. قوائم سماح المجموعات (`*.groups`, `*.groupAllowFrom`, وقائمة السماح الخاصة بالقناة)
3. تقييد الإشارات (`requireMention`, `/activation`)

## تقييد الإشارات (الافتراضي)

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. تعيش القيم الافتراضية لكل نظام فرعي تحت `*.groups."*"`.

يُحتسب الرد على رسالة من البوت كإشارة ضمنية عندما تدعم القناة
بيانات الرد الوصفية. ويمكن أيضًا أن يُحتسب اقتباس رسالة من البوت كإشارة ضمنية
في القنوات التي تكشف بيانات الاقتباس الوصفية. تشمل الحالات المضمّنة الحالية
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

- `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ ويتم تجاهل الأنماط غير الصالحة وأشكال التكرار المتداخل غير الآمنة.
- الأسطح التي توفر إشارات صريحة تظل تعمل؛ والأنماط هي بديل احتياطي.
- تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما تشترك عدة وكلاء في مجموعة).
- لا يتم فرض تقييد الإشارات إلا عندما يكون اكتشاف الإشارة ممكنًا (إشارات أصلية أو عند تكوين `mentionPatterns`).
- تعيش القيم الافتراضية لـ Discord في `channels.discord.guilds."*"` (ويمكن تجاوزها لكل guild/channel).
- يتم تغليف سياق سجل المجموعة بشكل موحد عبر القنوات وهو **pending-only** (الرسائل التي تم تخطيها بسبب تقييد الإشارات)؛ استخدم `messages.groupChat.historyLimit` للقيمة الافتراضية العامة و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبط القيمة على `0` للتعطيل.

## قيود الأدوات على المجموعات/القنوات (اختياري)

بعض إعدادات القنوات تدعم تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح/المنع للأدوات على مستوى المجموعة بالكامل.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة.
  استخدم prefixes صريحة للمفاتيح:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, وبديل `"*"` العام.
  لا تزال المفاتيح القديمة غير المسبوقة مدعومة ويتم مطابقتها على أنها `id:` فقط.

ترتيب الحلّ (الأكثر تحديدًا يفوز):

1. تطابق `toolsBySender` للمجموعة/القناة
2. `tools` للمجموعة/القناة
3. تطابق `toolsBySender` الافتراضي (`"*"` )
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

- تُطبَّق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/أدوات الوكيل (ويظل `deny` هو الحاسم).
- تستخدم بعض القنوات بنية تداخل مختلفة للغرف/القنوات (مثل Discord `guilds.*.channels.*`، وSlack `channels.*`، وMicrosoft Teams `teams.*.channels.*`).

## قوائم السماح للمجموعات

عند تكوين `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في ضبط سلوك الإشارة الافتراضي.

التباس شائع: موافقة اقتران الرسائل الخاصة ليست هي نفسها تفويض المجموعة.
بالنسبة إلى القنوات التي تدعم اقتران الرسائل الخاصة، فإن مخزن الاقتران يفتح الرسائل الخاصة فقط. ولا تزال أوامر المجموعات تتطلب تفويضًا صريحًا لمرسل المجموعة من قوائم السماح في الإعدادات مثل `groupAllowFrom` أو البديل الاحتياطي الموثق في الإعدادات لتلك القناة.

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

3. السماح بكل المجموعات ولكن اشتراط الإشارة (بشكل صريح)

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

يتم تحديد المالك بواسطة `channels.whatsapp.allowFrom` (أو E.164 الخاص بالبوت نفسه إذا لم يكن مضبوطًا). أرسل الأمر كرسالة مستقلة. وتتجاهل الأسطح الأخرى حاليًا `/activation`.

## حقول السياق

تضبط الحمولات الواردة للمجموعات ما يلي:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفًا)
- `GroupMembers` (إذا كان معروفًا)
- `WasMentioned` (نتيجة تقييد الإشارات)
- تتضمن موضوعات منتدى Telegram أيضًا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقنوات:

- يمكن لـ BlueBubbles اختياريًا إثراء المشاركين غير المسمّين في مجموعات macOS من قاعدة بيانات جهات الاتصال المحلية قبل تعبئة `GroupMembers`. يكون هذا معطّلًا افتراضيًا ولا يعمل إلا بعد اجتياز تقييد المجموعات العادي.

يتضمن system prompt الخاص بالوكيل مقدمة خاصة بالمجموعة في أول دورة من جلسة مجموعة جديدة. وهي تذكّر النموذج بالرد كإنسان، وتجنب جداول Markdown، وتقليل الأسطر الفارغة، واتباع المسافات المعتادة في الدردشة، وتجنب كتابة تسلسلات `\n` الحرفية.

## تفاصيل خاصة بـ iMessage

- فضّل `chat_id:<id>` عند التوجيه أو الإدراج في قائمة السماح.
- عرض الدردشات: `imsg chats --limit 20`.
- تعود الردود في المجموعات دائمًا إلى `chat_id` نفسه.

## تفاصيل خاصة بـ WhatsApp

راجع [رسائل المجموعات](/ar/channels/group-messages) للاطلاع على سلوك WhatsApp فقط (حقن السجل، وتفاصيل التعامل مع الإشارات).
