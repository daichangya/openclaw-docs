---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم روبوت Discord، والإمكانات، والإعدادات
title: Discord
x-i18n:
    generated_at: "2026-04-25T13:40:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 685dd2dce8a299233b14e7bdd5f502ee92f740b7dbb3104e86e0c2f36aabcfe1
    source_path: channels/discord.md
    workflow: 15
---

جاهز للرسائل الخاصة وقنوات الخوادم عبر Discord gateway الرسمي.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل الخاصة في Discord وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وكتالوج الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيصات عبر القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد يتضمن بوتًا، وإضافة البوت إلى خادمك، ثم إقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [فأنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. سمّه مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw الخاص بك.

  </Step>

  <Step title="تمكين النوايا المميّزة">
    وأنت لا تزال في صفحة **Bot**، مرّر إلى قسم **Privileged Gateway Intents** وقم بتمكين:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ ومطلوب لقوائم السماح الخاصة بالأدوار ولمطابقة الأسماء مع المعرّفات)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحالة)

  </Step>

  <Step title="نسخ رمز البوت المميز">
    مرّر مرة أخرى إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، فإن هذا يُنشئ رمزك الأول — لا تتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء رابط دعوة وإضافة البوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستُنشئ رابط دعوة بالأذونات الصحيحة لإضافة البوت إلى خادمك.

    مرّر إلى **OAuth2 URL Generator** وقم بتمكين:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** في الأسفل. قم بتمكين ما يلي على الأقل:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختياري)

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير العمل في قنوات المنتدى أو الوسائط الذي ينشئ سلسلة أو يواصلها، فقم أيضًا بتمكين **Send Messages in Threads**.
    انسخ الرابط المُنشأ في الأسفل، والصقه في متصفحك، واختر خادمك، ثم انقر على **Continue** للاتصال. ينبغي أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تمكين Developer Mode وجمع المعرّفات الخاصة بك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تمكين Developer Mode حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجوار صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الفأرة الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الفأرة الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** مع Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الاقتران، يحتاج Discord إلى السماح للبوت بإرسال رسالة خاصة إليك. انقر بزر الفأرة الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل خاصة إليك. أبقِ هذا الخيار مفعّلًا إذا كنت تريد استخدام الرسائل الخاصة في Discord مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، فيمكنك تعطيل الرسائل الخاصة بعد الاقتران.

  </Step>

  <Step title="عيّن رمز البوت المميز بأمان (لا ترسله في الدردشة)">
    رمز بوت Discord المميز هو سر (مثل كلمة المرور). عيّنه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو بإيقاف عملية `openclaw gateway run` ثم تشغيلها مجددًا.

  </Step>

  <Step title="إعداد OpenClaw والاقتران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدث مع وكيل OpenClaw الخاص بك على أي قناة موجودة بالفعل (مثل Telegram) وأخبره بذلك. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد قمت بالفعل بتعيين Discord bot token في الإعدادات. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضّل إعدادات قائمة على الملفات، فاضبط:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        الرجوع إلى متغير البيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        القيم النصية الصريحة لـ `token` مدعومة. كما أن قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر مزوّدي env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="الموافقة على أول اقتران عبر الرسائل الخاصة">
    انتظر حتى تصبح Gateway قيد التشغيل، ثم أرسل رسالة خاصة إلى البوت في Discord. سيرد برمز اقتران.

    <Tabs>
      <Tab title="اسأل وكيلك">
        أرسل رمز الاقتران إلى وكيلك على قناتك الحالية:

        > "وافق على رمز اقتران Discord هذا: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

    ينبغي أن تتمكن الآن من الدردشة مع وكيلك في Discord عبر الرسائل الخاصة.

  </Step>
</Steps>

<Note>
يأخذ تحليل الرموز المميزة الحسابَ في الاعتبار. تفوز قيم token الموجودة في الإعدادات على الرجوع إلى متغيرات البيئة. لا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
بالنسبة إلى الاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يتم استخدام `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق ذلك على إجراءات الإرسال والقراءة/التحقق مثل (على سبيل المثال read/search/fetch/thread/pins/permissions). تظل إعدادات سياسة الحساب/إعادة المحاولة مأخوذة من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل على الخادم

بعد أن تعمل الرسائل الخاصة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة بحيث تحصل كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يُوصى بهذا للخوادم الخاصة التي لا تضم سوى أنت والبوت.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح الخاصة بالخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس في الرسائل الخاصة فقط.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "أضف Discord Server ID الخاص بي `<server_id>` إلى قائمة السماح الخاصة بالخوادم"
      </Tab>
      <Tab title="الإعدادات">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="السماح بالردود بدون @mention">
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند الإشارة إليه باستخدام @. في الخادم الخاص، من المرجح أنك تريد منه الرد على كل رسالة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى الإشارة إليه باستخدام @"
      </Tab>
      <Tab title="الإعدادات">
        اضبط `requireMention: false` في إعدادات الخادم الخاصة بك:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="خطط للذاكرة في قنوات الخادم">
    افتراضيًا، يتم تحميل الذاكرة طويلة الأمد (MEMORY.md) فقط في جلسات الرسائل الخاصة. لا تقوم قنوات الخادم بتحميل MEMORY.md تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت تحتاج إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="يدوي">
        إذا كنت تحتاج إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (إذ يتم حقنهما في كل جلسة). واحتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord الخاص بك وابدأ الدردشة. يستطيع وكيلك رؤية اسم القناة، وتحصل كل قناة على جلسة معزولة خاصة بها — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- تمتلك Gateway اتصال Discord.
- توجيه الردود حتمي: ترد الرسائل الواردة من Discord إلى Discord.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة الجلسة الرئيسية للوكيل (`agent:main:main`).
- قنوات الخادم هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل الرسائل الخاصة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات Cron/Heartbeat النصية فقط إلى Discord الإجابة النهائية المرئية للمساعد مرة واحدة. وتظل حمولات الوسائط والمكوّنات المنظّمة متعددة الرسائل عندما يُصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord إلا المنشورات ضمن السلاسل. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة تلقائيًا. يستخدم عنوان السلسلة أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة مباشرة. لا تمرر `--message-id` لقنوات المنتدى.

مثال: الإرسال إلى أصل المنتدى لإنشاء سلسلة

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء سلسلة منتدى بشكل صريح

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتدى مكوّنات Discord. إذا كنت تحتاج إلى مكوّنات، فأرسل إلى السلسلة نفسها (`channel:<threadId>`).

## المكوّنات التفاعلية

يدعم OpenClaw حاويات Discord components v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. يتم توجيه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text` و`section` و`separator` و`actions` و`media-gallery` و`file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string` و`user` و`role` و`mentionable` و`channel`

افتراضيًا، تكون المكوّنات للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والقوائم والنماذج عدة مرات حتى انتهاء صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو العلامات أو `*`). عند الإعداد، يتلقى المستخدمون غير المطابقين رفضًا سريع الزوال.

يفتح الأمران `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة لمزوّد الخدمة والنموذج وبيئات التشغيل المتوافقة بالإضافة إلى خطوة Submit. أصبح `/models add` مهملًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من الدردشة. يكون رد المنتقي سريع الزوال ولا يمكن استخدامه إلا من قبل المستخدم الذي استدعاه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما ينبغي أن يطابق مرجع المرفق

النماذج المنبثقة:

- أضف `components.modal` بما يصل إلى 5 حقول
- أنواع الحقول: `text` و`checkbox` و`radio` و`select` و`role-select` و`user-select`
- يضيف OpenClaw زر تشغيل تلقائيًا

مثال:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل الخاصة (الإصدار القديم: `channels.discord.dm.policy`):

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.discord.allowFrom` القيمة `"*"`؛ الإصدار القديم: `channels.discord.dm.allowFrom`)
    - `disabled`

    إذا لم تكن سياسة الرسائل الخاصة مفتوحة، فسيتم حظر المستخدمين غير المعروفين (أو مطالبتهم بالاقتران في وضع `pairing`).

    أولوية تعدد الحسابات:

    - ينطبق `channels.discord.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون قيمة `allowFrom` الخاصة بها معيّنة.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    تنسيق هدف الرسائل الخاصة للتسليم:

    - `user:<id>`
    - الإشارة `<@id>`

    تكون المعرّفات الرقمية المجردة ملتبسة ويتم رفضها ما لم يتم توفير نوع هدف مستخدم/قناة صريح.

  </Tab>

  <Tab title="سياسة الخادم">
    يتم التحكم في معالجة الخادم بواسطة `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل الاسم المختصر)
    - قوائم السماح الاختيارية للمرسلين: `users` (يُنصح باستخدام المعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم إعداد أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق للطوارئ
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرّفات أكثر أمانًا؛ يحذّر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان لدى الخادم `channels` مُعدّة، فسيتم رفض القنوات غير المدرجة
    - إذا لم يكن لدى الخادم كتلة `channels`، فسيُسمح بجميع القنوات في ذلك الخادم المدرج في قائمة السماح

    مثال:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    إذا قمت فقط بتعيين `DISCORD_BOT_TOKEN` ولم تُنشئ كتلة `channels.discord`، فسيكون الرجوع في وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى لو كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="الإشارات والرسائل الخاصة الجماعية">
    تكون رسائل الخادم مقيّدة بالإشارة افتراضيًا.

    يشمل اكتشاف الإشارة ما يلي:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المُعدّة (`agents.list[].groupChat.mentionPatterns`، مع الرجوع إلى `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني إلى البوت في الحالات المدعومة

    يتم إعداد `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    ويقوم `ignoreOtherMentions` اختياريًا بإسقاط الرسائل التي تشير إلى مستخدم/دور آخر ولكن ليس إلى البوت (باستثناء @everyone/@here).

    الرسائل الخاصة الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو الأسماء المختصرة)

  </Tab>
</Tabs>

### توجيه الوكيل المستند إلى الدور

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل عمليات الربط المستندة إلى الدور معرّفات الأدوار فقط، ويتم تقييمها بعد عمليات الربط النظيرة أو النظير الأصل وقبل عمليات الربط الخاصة بالخادم فقط. إذا كان الربط يعيّن أيضًا حقول مطابقة أخرى (مثل `peer` + `guildId` + `roles`)، فيجب أن تتطابق جميع الحقول المُعدّة.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## الأوامر الأصلية ومصادقة الأوامر

- القيمة الافتراضية لـ `commands.native` هي `"auto"` ويتم تمكينها لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يقوم `commands.native=false` بمسح أوامر Discord الأصلية المسجّلة سابقًا بشكل صريح.
- تستخدم مصادقة الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ لكن التنفيذ لا يزال يفرض مصادقة OpenClaw ويُرجع "غير مخوّل".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للحصول على كتالوج الأوامر والسلوك.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزات

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الردود في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم فيها بواسطة `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يؤدي `off` إلى تعطيل ترابط الردود الضمني. ومع ذلك، لا تزال وسوم `[[reply_to_*]]` الصريحة مُحترمة.
    يقوم `first` دائمًا بإرفاق مرجع الرد الأصلي الضمني بالرسالة الأولى الصادرة إلى Discord في ذلك الدور.
    لا يقوم `batched` بإرفاق مرجع الرد الأصلي الضمني في Discord إلا عندما يكون
    الدور الوارد دفعة مؤجّلة من رسائل متعددة. ويكون هذا مفيدًا
    عندما تريد الردود الأصلية أساسًا للمحادثات السريعة الملتبسة، وليس لكل
    دور مكوّن من رسالة واحدة.

    تظهر معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتعديلها مع وصول النص. يقبل `channels.discord.streaming` القيم `off` (افتراضي) | `partial` | `block` | `progress`. ويتم تعيين `progress` إلى `partial` على Discord؛ و`streamMode` اسم بديل قديم وتتم ترقيته تلقائيًا.

    تبقى القيمة الافتراضية `off` لأن تعديلات المعاينة في Discord تصطدم بسرعة بحدود المعدّل عندما تشترك عدة بوتات أو بوابات في حساب واحد.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - يقوم `partial` بتعديل رسالة معاينة واحدة مع وصول الرموز.
    - يصدر `block` أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييدها إلى `textChunkLimit`).
    - تؤدي الردود الإعلامية، والأخطاء، والردود الصريحة النهائية إلى إلغاء تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيًا `true`) فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.

    بث المعاينة نصّي فقط؛ أما ردود الوسائط فترجع إلى التسليم العادي. عند تمكين بث `block` صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل، والسياق، وسلوك السلاسل">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الرجوع إلى: `messages.groupChat.historyLimit`
    - يؤدي `0` إلى التعطيل

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - يتم توجيه سلاسل Discord كجلسات قنوات وترث إعدادات القناة الأصل ما لم يتم تجاوزها.
    - يُدخل `channels.discord.thread.inheritParent` (الافتراضي `false`) السلاسل التلقائية الجديدة في التهيئة من نص القناة الأصل. توجد التجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل الخاصة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء الرجوع في مرحلة الرد للتفعيل.

    يتم حقن مواضيع القنوات كسياق **غير موثوق**. تتحكم قوائم السماح في من يمكنه تشغيل الوكيل، لكنها ليست حدًا كاملًا لتنقيح السياق الإضافي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالسلاسل للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة بهدف جلسة بحيث تستمر الرسائل اللاحقة في تلك السلسلة في التوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` لربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` لإزالة ربط السلسلة الحالية
    - `/agents` لعرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` لفحص/تحديث إلغاء التركيز التلقائي بسبب عدم النشاط لعمليات الربط المركّزة
    - `/session max-age <duration|off>` لفحص/تحديث الحد الأقصى الصارم للعمر لعمليات الربط المركّزة

    الإعدادات:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    ملاحظات:

    - يحدد `session.threadBindings.*` الإعدادات الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يجب أن تكون `spawnSubagentSessions` بقيمة true لإنشاء/ربط السلاسل تلقائيًا من أجل `sessions_spawn({ thread: true })`.
    - يجب أن تكون `spawnAcpSessions` بقيمة true لإنشاء/ربط السلاسل تلقائيًا من أجل ACP (`/acp spawn ... --thread ...` أو `sessions_spawn({ runtime: "acp", thread: true })`).
    - إذا كانت عمليات ربط السلاسل معطلة لحساب ما، فلن تكون `/focus` والعمليات ذات الصلة بربط السلاسل متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="عمليات ربط قناة ACP الدائمة">
    لمساحات عمل ACP الثابتة "الدائمة التشغيل"، قم بإعداد عمليات ربط ACP مكتوبة على المستوى الأعلى تستهدف محادثات Discord.

    مسار الإعداد:

    - `bindings[]` مع `type: "acp"` و`match.channel: "discord"`

    مثال:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    ملاحظات:

    - يربط `/acp spawn codex --bind here` القناة الحالية أو السلسلة الحالية في مكانها ويحافظ على الرسائل المستقبلية ضمن جلسة ACP نفسها. وترث رسائل السلاسل ربط القناة الأصل.
    - في قناة أو سلسلة مرتبطة، يعيد `/new` و`/reset` تعيين جلسة ACP نفسها في مكانها. ويمكن لعمليات ربط السلاسل المؤقتة تجاوز تحليل الهدف أثناء نشاطها.
    - لا تكون `spawnAcpSessions` مطلوبة إلا عندما يحتاج OpenClaw إلى إنشاء/ربط سلسلة فرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على تفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعل">
    وضع إشعارات التفاعل لكل خادم:

    - `off`
    - `own` (افتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    يتم تحويل أحداث التفاعل إلى أحداث نظام وإرفاقها بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="تفاعلات التأكيد">
    يرسل `ackReaction` رمزًا تعبيريًا للتأكيد بينما يعالج OpenClaw رسالة واردة.

    ترتيب التحليل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحدة أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    تكون كتابات الإعدادات التي تبدأ من القناة مفعّلة افتراضيًا.

    يؤثر هذا في تدفقات `/config set|unset` (عند تمكين ميزات الأوامر).

    للتعطيل:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="وكيل Gateway">
    وجّه حركة WebSocket الخاصة بـ Discord gateway وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + تحليل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    تجاوز لكل حساب:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="دعم PluralKit">
    فعّل تحليل PluralKit لربط الرسائل الممرَّرة بهوية عضو النظام:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // اختياري؛ مطلوب للأنظمة الخاصة
      },
    },
  },
}
```

    ملاحظات:

    - يمكن أن تستخدم قوائم السماح `pk:<memberId>`
    - تتم مطابقة أسماء عرض الأعضاء حسب الاسم/الاسم المختصر فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الممرَّرة كرسائل بوت ويتم إسقاطها ما لم تكن `allowBots=true`

  </Accordion>

  <Accordion title="إعداد الحالة">
    يتم تطبيق تحديثات الحالة عند تعيين حقل حالة أو نشاط، أو عند تمكين الحالة التلقائية.

    مثال على الحالة فقط:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    مثال على النشاط (الحالة المخصصة هي نوع النشاط الافتراضي):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    مثال على البث:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    خريطة أنواع النشاط:

    - 0: Playing
    - 1: Streaming (يتطلب `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (يستخدم نص النشاط كحالة الحالة؛ والرمز التعبيري اختياري)
    - 5: Competing

    مثال على الحالة التلقائية (إشارة سلامة وقت التشغيل):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    تربط الحالة التلقائية توفر وقت التشغيل بحالة Discord: سليم => online، متدهور أو غير معروف => idle، مستنفد أو غير متاح => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المعتمدة على الأزرار في الرسائل الخاصة ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يرجع إلى `commands.ownerAllowFrom` عند الإمكان)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter` و`sessionFilter` و`cleanupAfterResolve`

    يقوم Discord بتمكين موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير معيّنة أو `"auto"` ويمكن تحليل مُوافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord مُوافقات التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord كعميل موافقة أصلي بشكل صريح.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. لا يمكن استخدام الأزرار إلا من قبل المُوافقين الذين تم تحليلهم؛ ويتلقى المستخدمون الآخرون رفضًا سريع الزوال. تتضمن مطالبات الموافقة نص الأمر، لذا لا تمكّن التسليم عبر القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يرجع OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف مهايئ Discord الأصلي أساسًا توجيه الرسائل الخاصة للمُوافقين والتوزيع على القناة.
    وعندما تكون هذه الأزرار موجودة، فإنها تكون تجربة المستخدم الأساسية للموافقة؛ ويجب على OpenClaw
    تضمين أمر `/approve` يدوي فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    تتبع مصادقة Gateway وتحليل الموافقة عقد عميل Gateway المشترك (`plugin:` IDs يتم تحليلها عبر `plugin.approval.resolve`؛ والمعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord المراسلة، وإدارة القنوات، والإشراف، والحالة، وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage` و`readMessages` و`editMessage` و`deleteMessage` و`threadReply`
- التفاعلات: `react` و`reactions` و`emojiList`
- الإشراف: `timeout` و`kick` و`ban`
- الحالة: `setPresence`

يقبل إجراء `event-create` معلمة `image` اختيارية (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                             | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل  |
| roles                                                                                                                                                                    | معطّل |
| moderation                                                                                                                                                               | معطّل |
| presence                                                                                                                                                                 | معطّل |

## واجهة Components v2

يستخدم OpenClaw Discord components v2 لموافقات التنفيذ وعلامات السياق المتقاطع. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

- يعيّن `channels.discord.ui.components.accentColor` لون التمييز المستخدم بواسطة حاويات مكوّنات Discord (سداسي عشري).
- عيّنه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتم تجاهل `embeds` عند وجود components v2.

مثال:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## الصوت

يحتوي Discord على سطحين صوتيين منفصلين: **القنوات الصوتية** اللحظية (المحادثات المستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة الموجة). وتدعم Gateway كلاهما.

### القنوات الصوتية

قائمة التحقق من الإعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح الخاصة بالأدوار/المستخدمين.
3. ادعُ البوت باستخدام النطاقين `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في القناة الصوتية المستهدفة.
5. فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
6. اضبط `channels.discord.voice`.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع قواعد قائمة السماح وسياسة المجموعة نفسها التي تتبعها أوامر Discord الأخرى.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

مثال على الانضمام التلقائي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

ملاحظات:

- يتجاوز `voice.tts` قيمة `messages.tts` لتشغيل الصوت فقط.
- يتجاوز `voice.model` نموذج LLM المستخدم لردود القنوات الصوتية في Discord فقط. اتركه غير معيّن ليرث نموذج الوكيل الموجّه.
- يستخدم STT القيمة `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- تستمد أدوار النصوص الصوتية حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصصة للمالك فقط (مثل `gateway` و`cron`).
- يكون الصوت مفعّلًا افتراضيًا؛ اضبط `channels.discord.voice.enabled=false` لتعطيله.
- يتم تمرير `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام الخاصة بـ `@discordjs/voice`.
- القيم الافتراضية لـ `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تُعيّن.
- يراقب OpenClaw أيضًا حالات فشل فك التشفير عند الاستقبال ويستعيد تلقائيًا عبر مغادرة القناة الصوتية وإعادة الانضمام إليها بعد تكرار حالات الفشل خلال نافذة قصيرة.
- إذا كانت سجلات الاستقبال تعرض بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير التبعيات والسجلات. يتضمن السطر المضمّن لـ `@discordjs/voice` إصلاح الحشو من المصدر العلوي من discord.js PR #11449، والذي أغلق المشكلة discord.js issue #11419.

مسار القناة الصوتية:

- يتم تحويل التقاط Discord PCM إلى ملف WAV مؤقت.
- تتولى `tools.media.audio` عملية STT، مثل `openai/gpt-4o-mini-transcribe`.
- يتم إرسال النص المنسوخ عبر مسار دخول Discord والتوجيه العاديين.
- عندما يكون `voice.model` معيّنًا، فإنه يتجاوز فقط LLM الخاص بالاستجابة لهذا الدور في القناة الصوتية.
- يتم دمج `voice.tts` فوق `messages.tts`؛ ويتم تشغيل الصوت الناتج في القناة التي تم الانضمام إليها.

يتم تحليل بيانات الاعتماد لكل مكوّن: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`.

### الرسائل الصوتية

تعرض الرسائل الصوتية في Discord معاينة موجية وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- قدّم **مسار ملف محليًا** (يتم رفض عناوين URL).
- احذف المحتوى النصي (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يتم قبول أي تنسيق صوتي؛ ويحوّل OpenClaw الملف إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تم استخدام intents غير مسموح بها أو أن البوت لا يرى رسائل الخادم">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على تحليل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير intents

  </Accordion>

  <Accordion title="تم حظر رسائل الخادم بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة السماح للخادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالخادم موجودة، فلن يُسمح إلا بالقنوات المدرجة
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    عمليات تحقق مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="تم تعيين require mention إلى false لكنه لا يزال محظورًا">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة للخادم/القناة
    - تم إعداد `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو ضمن إدخال القناة)
    - تم حظر المرسل بواسطة قائمة السماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="تنتهي مهلة المعالجات طويلة التشغيل أو تتكرر الردود">

    السجلات المعتادة:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    مقبض ميزانية المستمع:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    مقبض مهلة تشغيل العامل:

    - حساب واحد: `channels.discord.inboundWorker.runTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - الافتراضي: `1800000` (30 دقيقة)؛ اضبطه إلى `0` للتعطيل

    خط الأساس الموصى به:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    استخدم `eventQueue.listenerTimeout` لإعدادات المستمع البطيئة، واستخدم `inboundWorker.runTimeoutMs`
    فقط إذا كنت تريد صمام أمان منفصلًا لأدوار الوكيل الموضوعة في قائمة الانتظار.

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    تعمل فحوصات الأذونات في `channels status --probe` فقط مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد يظل التطابق وقت التشغيل يعمل، لكن probe لا يمكنه التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - تم تعطيل الرسائل الخاصة: `channels.discord.dm.enabled=false`
    - تم تعطيل سياسة الرسائل الخاصة: `channels.discord.dmPolicy="disabled"` (الإصدار القديم: `channels.discord.dm.policy`)
    - بانتظار الموافقة على الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات البوت إلى البوت">
    افتراضيًا، يتم تجاهل الرسائل التي أنشأها البوت.

    إذا قمت بتعيين `channels.discord.allowBots=true`، فاستخدم قواعد إشارة وقائمة سماح صارمة لتجنب سلوك الحلقات.
    ويفضّل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل البوت التي تشير إلى البوت فقط.

  </Accordion>

  <Accordion title="فقدان STT الصوتي مع DecryptionFailed(...)">

    - أبقِ OpenClaw محدّثًا (`openclaw update`) حتى يكون منطق استرداد استقبال الصوت في Discord موجودًا
    - أكّد أن `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (القيمة الافتراضية من المصدر العلوي) واضبط فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت حالات الفشل بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE من المصدر العلوي في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Discord](/ar/gateway/config-channels#discord).

<Accordion title="حقول Discord عالية الإشارة">

- بدء التشغيل/المصادقة: `enabled` و`token` و`accounts.*` و`allowBots`
- السياسة: `groupPolicy` و`dm.*` و`guilds.*` و`guilds.*.channels.*`
- الأوامر: `commands.native` و`commands.useAccessGroups` و`configWrites` و`slashCommand.*`
- قائمة انتظار الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع) و`eventQueue.maxQueueSize` و`eventQueue.maxConcurrency`
- العامل الوارد: `inboundWorker.runTimeoutMs`
- الرد/السجل: `replyToMode` و`historyLimit` و`dmHistoryLimit` و`dms.*.historyLimit`
- التسليم: `textChunkLimit` و`chunkMode` و`maxLinesPerMessage`
- البث: `streaming` (الاسم البديل القديم: `streamMode`) و`streaming.preview.toolProgress` و`draftChunk` و`blockStreaming` و`blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحد من الرفع الصادر إلى Discord، الافتراضي `100MB`) و`retry`
- الإجراءات: `actions.*`
- الحالة: `activity` و`status` و`activityType` و`activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings` و`bindings[]` من المستوى الأعلى (`type: "acp"`) و`pluralkit` و`execApprovals` و`intents` و`agentComponents` و`heartbeat` و`responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوت المميزة كأسرار (يُفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أقل قدر ممكن من أذونات Discord.
- إذا كانت حالة/نشر الأوامر قديمة، فأعد تشغيل Gateway وأعد التحقق باستخدام `openclaw channels status --probe`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقتران مستخدم Discord مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك الدردشة الجماعية وقائمة السماح.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="توجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط الخوادم والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي.
  </Card>
</CardGroup>
