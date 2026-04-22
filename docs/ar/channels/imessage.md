---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء الإرسال/الاستقبال في iMessage
summary: دعم iMessage القديم عبر imsg ‏(JSON-RPC عبر stdio). يجب أن تستخدم الإعدادات الجديدة BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-22T04:20:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9cc5a0bd4fbc7ff6f792e737bc4302a67f9ab6aa8231ff6f751fe6d732ca5d
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (القديم: imsg)

<Warning>
بالنسبة لعمليات نشر iMessage الجديدة، استخدم <a href="/ar/channels/bluebubbles">BlueBubbles</a>.

يُعد تكامل `imsg` قديمًا وقد تتم إزالته في إصدار مستقبلي.
</Warning>

الحالة: تكامل CLI خارجي قديم. يقوم Gateway بتشغيل `imsg rpc` ويتواصل عبر JSON-RPC على stdio (من دون daemon/منفذ منفصل).

<CardGroup cols={3}>
  <Card title="BlueBubbles (موصى به)" icon="message-circle" href="/ar/channels/bluebubbles">
    مسار iMessage المفضل للإعدادات الجديدة.
  </Card>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل المباشرة في iMessage وضع الاقتران افتراضيًا.
  </Card>
  <Card title="مرجع الإعدادات" icon="settings" href="/ar/gateway/configuration-reference#imessage">
    المرجع الكامل لحقول iMessage.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Mac محلي (المسار السريع)">
    <Steps>
      <Step title="ثبّت imsg وتحقق منه">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="اضبط OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="ابدأ gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="وافق على أول اقتران للرسائل المباشرة (dmPolicy الافتراضي)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    لا يتطلب OpenClaw سوى `cliPath` متوافق مع stdio، لذلك يمكنك توجيه `cliPath` إلى نص wrapper برمجي يستخدم SSH للاتصال بـ Mac بعيد وتشغيل `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    الإعداد الموصى به عند تمكين المرفقات:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // يُستخدم لجلب المرفقات عبر SCP
      includeAttachments: true,
      // اختياري: تجاوز جذور المرفقات المسموح بها.
      // تتضمن القيم الافتراضية /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    إذا لم يتم تعيين `remoteHost`، يحاول OpenClaw اكتشافه تلقائيًا عبر تحليل نص wrapper البرمجي الخاص بـ SSH.
    يجب أن تكون قيمة `remoteHost` بصيغة `host` أو `user@host` (من دون مسافات أو خيارات SSH).
    يستخدم OpenClaw التحقق الصارم من مفتاح المضيف في SCP، لذلك يجب أن يكون مفتاح مضيف relay موجودًا بالفعل في `~/.ssh/known_hosts`.
    يتم التحقق من مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب أن يكون تطبيق Messages قد سُجّل الدخول إليه على Mac الذي يشغّل `imsg`.
- يتطلب الأمر Full Disk Access لسياق العملية الذي يشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.

<Tip>
تُمنح الأذونات لكل سياق عملية على حدة. إذا كان gateway يعمل بلا واجهة (LaunchAgent/SSH)، فشغّل أمرًا تفاعليًا لمرة واحدة في السياق نفسه لتحفيز ظهور المطالبات:

```bash
imsg chats --limit 1
# أو
imsg send <handle> "test"
```

</Tip>

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يمكن أن تكون إدخالات قائمة السماح handles أو أهداف دردشة (`chat_id:*` و`chat_guid:*` و`chat_identifier:*`).

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في التعامل مع المجموعات:

    - `allowlist` (افتراضيًا عند الإعداد)
    - `open`
    - `disabled`

    قائمة سماح مرسلي المجموعات: `channels.imessage.groupAllowFrom`.

    الاحتياط وقت التشغيل: إذا لم يتم تعيين `groupAllowFrom`، فإن فحوصات مرسلي مجموعات iMessage تعود إلى `allowFrom` عند توفره.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

    تقييد الإشارات للمجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للإشارات
    - يَستخدم اكتشاف الإشارات أنماط regex (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - إذا لم تكن هناك أنماط مُعدة، فلا يمكن فرض تقييد الإشارات

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز تقييد الإشارات داخل المجموعات.

  </Tab>

  <Tab title="الجلسات والردود الحتمية">
    - تستخدم الرسائل المباشرة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع الإعداد الافتراضي `session.dmScope=main`، تندمج الرسائل المباشرة في iMessage ضمن الجلسة الرئيسية للوكيل.
    - تكون جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - يتم توجيه الردود مرة أخرى إلى iMessage باستخدام البيانات الوصفية للقناة/الهدف الأصلية.

    سلوك السلاسل الشبيهة بالمجموعات:

    قد تصل بعض سلاسل iMessage متعددة المشاركين مع `is_group=false`.
    إذا كان هذا `chat_id` مُعدًا صراحةً ضمن `channels.imessage.groups`، فسيتعامل OpenClaw معه على أنه حركة مرور مجموعة (تقييد مجموعات + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## ربط المحادثات بـ ACP

يمكن أيضًا ربط محادثات iMessage القديمة بجلسات ACP.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد كل من `/new` و`/reset` تعيين جلسة ACP المربوطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

تكون عمليات الربط الدائمة المُعدة مدعومة من خلال إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id` ما يلي:

- handle مُطبع للرسائل المباشرة مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>` (موصى به لعمليات ربط المجموعات المستقرة)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

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
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

راجع [ACP Agents](/ar/tools/acp-agents) لمعرفة سلوك ربط ACP المشترك.

## أنماط النشر

<AccordionGroup>
  <Accordion title="مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)">
    استخدم Apple ID ومستخدم macOS مخصصين بحيث تكون حركة مرور البوت معزولة عن ملف Messages الشخصي الخاص بك.

    التدفق المعتاد:

    1. أنشئ مستخدم macOS مخصصًا وسجّل الدخول إليه.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت ضمن ذلك المستخدم.
    3. ثبّت `imsg` لذلك المستخدم.
    4. أنشئ wrapper عبر SSH حتى يتمكن OpenClaw من تشغيل `imsg` ضمن سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف ذلك المستخدم الشخصي.

    قد يتطلب التشغيل الأول موافقات GUI (Automation + Full Disk Access) في جلسة مستخدم البوت.

  </Accordion>

  <Accordion title="Mac بعيد عبر Tailscale (مثال)">
    البنية الشائعة:

    - يعمل gateway على Linux/VM
    - يعمل iMessage و`imsg` على Mac داخل tailnet الخاص بك
    - يستخدم wrapper الخاص بـ `cliPath` SSH لتشغيل `imsg`
    - يتيح `remoteHost` جلب المرفقات عبر SCP

    مثال:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    استخدم مفاتيح SSH بحيث يعمل كل من SSH وSCP بدون تفاعل.
    تأكد من الوثوق بمفتاح المضيف أولًا (مثلًا `ssh bot@mac-mini.tailnet-1234.ts.net`) بحيث يتم ملء `known_hosts`.

  </Accordion>

  <Accordion title="نمط الحسابات المتعددة">
    يدعم iMessage الإعداد لكل حساب على حدة ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح الخاصة بجذور المرفقات.

  </Accordion>
</AccordionGroup>

## الوسائط والتقسيم وأهداف التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - يكون استيعاب المرفقات الواردة اختياريًا: `channels.imessage.includeAttachments`
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند تعيين `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP التحقق الصارم من مفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)
  </Accordion>

  <Accordion title="تقسيم الرسائل الصادرة">
    - حد تقسيم النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التقسيم: `channels.imessage.chunkMode`
      - `length` (افتراضي)
      - `newline` (تقسيم يعتمد على الفقرات أولًا)
  </Accordion>

  <Accordion title="صيغ العنونة">
    الأهداف الصريحة المفضلة:

    - `chat_id:123` (موصى به للتوجيه المستقر)
    - `chat_guid:...`
    - `chat_identifier:...`

    كما أن أهداف handles مدعومة أيضًا:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## عمليات كتابة الإعدادات

يسمح iMessage افتراضيًا بعمليات كتابة الإعدادات التي تبدأها القناة (لأجل `/config set|unset` عندما تكون `commands.config: true`).

للتعطيل:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تعذر العثور على imsg أو RPC غير مدعوم">
    تحقق من الملف التنفيذي ودعم RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    إذا أفاد probe بأن RPC غير مدعوم، فقم بتحديث `imsg`.

  </Accordion>

  <Accordion title="يتم تجاهل الرسائل المباشرة">
    تحقق من:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - موافقات الاقتران (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعات">
    تحقق من:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - سلوك قائمة السماح في `channels.imessage.groups`
    - إعداد أنماط الإشارات (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="تفشل المرفقات البعيدة">
    تحقق من:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - مصادقة مفاتيح SSH/SCP من مضيف gateway
    - وجود مفتاح المضيف في `~/.ssh/known_hosts` على مضيف gateway
    - قابلية قراءة المسار البعيد على Mac الذي يشغّل Messages

  </Accordion>

  <Accordion title="تم تفويت مطالبات أذونات macOS">
    أعد التشغيل في طرفية GUI تفاعلية ضمن سياق المستخدم/الجلسة نفسه ووافق على المطالبات:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    تأكد من منح Full Disk Access وAutomation لسياق العملية الذي يشغّل OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## مؤشرات مرجع الإعدادات

- [مرجع الإعدادات - iMessage](/ar/gateway/configuration-reference#imessage)
- [إعدادات Gateway](/ar/gateway/configuration)
- [الاقتران](/ar/channels/pairing)
- [BlueBubbles](/ar/channels/bluebubbles)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — المصادقة على الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتحصين
