---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord، والقدرات، والإعدادات
title: Discord
x-i18n:
    generated_at: "2026-04-23T13:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

الحالة: جاهز للرسائل الخاصة والقنوات داخل الخوادم عبر بوابة Discord الرسمية.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تُستخدم الرسائل الخاصة في Discord افتراضيًا في وضع الاقتران.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيص عبر القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد يتضمن بوتًا، ثم إضافة البوت إلى خادمك، ثم إقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [فأنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. امنحه اسمًا مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw الخاص بك.

  </Step>

  <Step title="تفعيل النوايا المميزة">
    لا تزال في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ ومطلوب لقوائم السماح المستندة إلى الأدوار ولمطابقة الاسم بالمعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحالة)

  </Step>

  <Step title="نسخ رمز البوت">
    مرّر مرة أخرى إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم التسمية، فإن هذا ينشئ أول رمز لك — ولا تتم «إعادة تعيين» أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء رابط دعوة وإضافة البوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ رابط دعوة بالأذونات الصحيحة لإضافة البوت إلى خادمك.

    مرّر لأسفل إلى **OAuth2 URL Generator** وفعّل:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** بالأسفل. فعّل على الأقل:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختياري)

    هذه هي المجموعة الأساسية للقنوات النصية العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير العمل في قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضًا **Send Messages in Threads**.
    انسخ الرابط الذي تم إنشاؤه في الأسفل، والصقه في المتصفح، واختر خادمك، ثم انقر على **Continue** للاتصال. ينبغي الآن أن ترى البوت في خادم Discord.

  </Step>

  <Step title="تفعيل Developer Mode وجمع المعرّفات">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل Developer Mode حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجوار صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** إلى جانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الاقتران، يجب أن يسمح Discord للبوت بإرسال رسالة خاصة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بمن فيهم البوتات) إرسال رسائل خاصة إليك. أبقِ هذا الخيار مفعّلًا إذا كنت تريد استخدام الرسائل الخاصة في Discord مع OpenClaw. وإذا كنت تخطط لاستخدام قنوات الخادم فقط، فيمكنك تعطيل الرسائل الخاصة بعد الاقتران.

  </Step>

  <Step title="ضبط رمز البوت بشكل آمن (لا ترسله في الدردشة)">
    رمز بوت Discord الخاص بك سرّي (مثل كلمة المرور). اضبطه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو عبر إيقاف عملية `openclaw gateway run` ثم تشغيلها من جديد.

  </Step>

  <Step title="إعداد OpenClaw والاقتران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw الخاص بك على أي قناة موجودة بالفعل (مثل Telegram) وأخبره بذلك. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد ضبطت بالفعل رمز بوت Discord في الإعدادات. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضّل الإعداد القائم على الملفات، فاضبط:

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

        الاحتياط البيئي للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        قيم `token` النصية الصريحة مدعومة. كما أن قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر مزودي env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="الموافقة على أول اقتران عبر الرسائل الخاصة">
    انتظر حتى تعمل البوابة، ثم أرسل رسالة خاصة إلى البوت على Discord. سيرد عليك برمز اقتران.

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

    ينبغي الآن أن تكون قادرًا على التحدث مع وكيلك في Discord عبر الرسائل الخاصة.

  </Step>
</Steps>

<Note>
تحليل الرمز يراعي الحساب. قيم الرمز الموجودة في الإعدادات تتقدّم على الاحتياط البيئي. لا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
وبالنسبة للاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص مثل read/search/fetch/thread/pins/permissions. وتظل إعدادات سياسة الحساب/إعادة المحاولة مأخوذة من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
</Note>

## موصى به: إعداد مساحة عمل على الخادم

بمجرد أن تعمل الرسائل الخاصة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة بحيث تحصل كل قناة على جلسة وكيل مستقلة بسياقها الخاص. يوصى بهذا للخوادم الخاصة التي تضمك أنت والبوت فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح الخاصة بالخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس فقط في الرسائل الخاصة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "أضف Server ID الخاص بي في Discord `<server_id>` إلى قائمة السماح الخاصة بالخوادم"
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
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند الإشارة إليه عبر @mention. بالنسبة إلى خادم خاص، فغالبًا ستريد أن يرد على كل رسالة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى @mentioned"
      </Tab>
      <Tab title="الإعدادات">
        اضبط `requireMention: false` في إعدادات الخادم لديك:

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

  <Step title="خطّط للذاكرة في قنوات الخادم">
    افتراضيًا، لا يتم تحميل الذاكرة طويلة الأمد (`MEMORY.md`) إلا في جلسات الرسائل الخاصة. ولا يتم تحميل `MEMORY.md` تلقائيًا في قنوات الخادم.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت بحاجة إلى سياق طويل الأمد من `MEMORY.md`."
      </Tab>
      <Tab title="يدويًا">
        إذا كنت تحتاج إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (إذ يتم حقنهما في كل جلسة). واحتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord وابدأ الدردشة. يستطيع وكيلك رؤية اسم القناة، وتحصل كل قناة على جلسة مستقلة خاصة بها — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- تدير Gateway اتصال Discord.
- توجيه الردود حتمي: الرسائل الواردة من Discord يُرد عليها في Discord.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة الجلسة الرئيسية للوكيل (`agent:main:main`).
- قنوات الخادم تستخدم مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- تُتجاهل الرسائل الخاصة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية ضمن جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاحتفاظ بـ `CommandTargetSessionKey` لجلسة المحادثة الموجّهة.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord إلا المنشورات ضمن سلاسل. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة تلقائيًا. يستخدم عنوان السلسلة أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة مباشرة. لا تمرّر `--message-id` لقنوات المنتدى.

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

لا تقبل أصول المنتديات مكوّنات Discord. إذا كنت بحاجة إلى مكوّنات، فأرسل إلى السلسلة نفسها (`channel:<threadId>`).

## المكوّنات التفاعلية

يدعم OpenClaw حاويات المكوّنات v2 في Discord لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجَّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية، وتتبع إعدادات Discord الحالية في `replyToMode`.

الكتل المدعومة:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string`, `user`, `role`, `mentionable`, `channel`

افتراضيًا، تكون المكوّنات للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والقوائم والنماذج عدة مرات حتى انتهاء صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` لذلك الزر (معرّفات مستخدمي Discord أو العلامات أو `*`). وعند تهيئته، يتلقى المستخدمون غير المطابقين رفضًا سريع الزوال.

يفتح الأمران `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة لمزوّد الخدمة والنموذج بالإضافة إلى خطوة Submit. ما لم يكن `commands.modelsWrite=false`، يدعم `/models add` أيضًا إضافة إدخال مزوّد/نموذج جديد من الدردشة، وتظهر النماذج المضافة حديثًا دون الحاجة إلى إعادة تشغيل البوابة. يكون رد المنتقي سريع الزوال ولا يمكن استخدامه إلا من قبل المستخدم الذي استدعاه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ واستخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

النماذج المنبثقة:

- أضف `components.modal` بما يصل إلى 5 حقول
- أنواع الحقول: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل الخاصة (الاسم القديم: `channels.discord.dm.policy`):

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`؛ الاسم القديم: `channels.discord.dm.allowFrom`)
    - `disabled`

    إذا لم تكن سياسة الرسائل الخاصة مفتوحة، فسيتم حظر المستخدمين غير المعروفين (أو مطالبتهم بالاقتران في وضع `pairing`).

    أسبقية تعدد الحسابات:

    - ينطبق `channels.discord.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسمّاة `channels.discord.allowFrom` عندما لا يكون `allowFrom` الخاص بها مضبوطًا.
    - لا ترث الحسابات المسمّاة `channels.discord.accounts.default.allowFrom`.

    تنسيق هدف الرسائل الخاصة للتسليم:

    - `user:<id>`
    - الإشارة `<@id>`

    المعرّفات الرقمية المجردة ملتبسة ويتم رفضها ما لم يتم توفير نوع هدف مستخدم/قناة صريح.

  </Tab>

  <Tab title="سياسة الخوادم">
    يتم التحكم في التعامل مع الخوادم بواسطة `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضَّل `id`، ويُقبل slug)
    - قوائم السماح الاختيارية للمرسلين: `users` (يوصى بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم ضبط أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون المطابقة المباشرة بالاسم/الوسم معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق طارئ
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرّفات أكثر أمانًا؛ ويحذّر `openclaw security audit` عند استخدام إدخالات اسم/وسم
    - إذا كان لدى خادم ما `channels` مضبوطة، فسيتم رفض القنوات غير المدرجة
    - إذا لم يكن لدى الخادم كتلة `channels`، فسيُسمح بجميع القنوات في ذلك الخادم الموجود في قائمة السماح

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

    إذا قمت فقط بضبط `DISCORD_BOT_TOKEN` ولم تُنشئ كتلة `channels.discord`، فإن الاحتياط في وقت التشغيل سيكون `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى لو كانت `channels.defaults.groupPolicy` تساوي `open`.

  </Tab>

  <Tab title="الإشارات والرسائل الخاصة الجماعية">
    تكون رسائل الخوادم مقيدة بالإشارة افتراضيًا.

    يشتمل اكتشاف الإشارة على:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المضبوطة (`agents.list[].groupChat.mentionPatterns`، والاحتياط `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على البوت في الحالات المدعومة

    يتم ضبط `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    ويقوم `ignoreOtherMentions` اختياريًا بإسقاط الرسائل التي تشير إلى مستخدم/دور آخر ولكن ليس إلى البوت (باستثناء @everyone/@here).

    الرسائل الخاصة الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو slugs)

  </Tab>
</Tabs>

### التوجيه إلى الوكيل استنادًا إلى الدور

استخدم `bindings[].match.roles` لتوجيه أعضاء خوادم Discord إلى وكلاء مختلفين بحسب معرّف الدور. تقبل عمليات الربط المستندة إلى الدور معرّفات الأدوار فقط، ويتم تقييمها بعد عمليات الربط peer أو parent-peer وقبل عمليات الربط الخاصة بالخادم فقط. إذا كانت عملية الربط تضبط أيضًا حقول مطابقة أخرى (مثل `peer` + `guildId` + `roles`)، فيجب أن تتطابق جميع الحقول المضبوطة.

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

## إعداد Developer Portal

<AccordionGroup>
  <Accordion title="إنشاء تطبيق وبوت">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. انسخ رمز البوت

  </Accordion>

  <Accordion title="النوايا المميزة">
    في **Bot -> Privileged Gateway Intents**، فعّل:

    - Message Content Intent
    - Server Members Intent (موصى به)

    Presence intent اختياري ولا يلزم إلا إذا كنت تريد تلقي تحديثات الحالة. لا يتطلب ضبط حالة البوت (`setPresence`) تفعيل تحديثات الحالة للأعضاء.

  </Accordion>

  <Accordion title="نطاقات OAuth والأذونات الأساسية">
    مولّد عنوان URL لـ OAuth:

    - النطاقات: `bot`, `applications.commands`

    الأذونات الأساسية المعتادة:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختياري)

    هذه هي المجموعة الأساسية للقنوات النصية العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير العمل في قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضًا **Send Messages in Threads**.
    تجنّب `Administrator` ما لم تكن هناك حاجة صريحة إليه.

  </Accordion>

  <Accordion title="نسخ المعرّفات">
    فعّل Discord Developer Mode، ثم انسخ:

    - معرّف الخادم
    - معرّف القناة
    - معرّف المستخدم

    يُفضّل استخدام المعرّفات الرقمية في إعدادات OpenClaw لإجراء تدقيقات وفحوصات موثوقة.

  </Accordion>
</AccordionGroup>

## الأوامر الأصلية وتوثيق الأوامر

- القيمة الافتراضية لـ `commands.native` هي `"auto"` وهي مفعّلة لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى إزالة أوامر Discord الأصلية المسجّلة سابقًا بشكل صريح.
- يستخدم توثيق الأوامر الأصلية نفس قوائم السماح/السياسات في Discord المستخدمة لمعالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرّح لهم؛ لكن التنفيذ يظل يفرض توثيق OpenClaw ويُرجع "غير مصرّح".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على فهرس الأوامر والسلوك.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزات

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الردود في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ويتم التحكم فيها بواسطة `channels.discord.replyToMode`:

    - `off` (الافتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يؤدي `off` إلى تعطيل سلاسل الردود الضمنية. ومع ذلك، تظل وسوم `[[reply_to_*]]` الصريحة محترمة.
    يقوم `first` دائمًا بإرفاق مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة في هذا الدور.
    ويقوم `batched` بإرفاق مرجع الرد الأصلي الضمني في Discord فقط عندما
    يكون الدور الوارد عبارة عن دفعة مؤجّلة من عدة رسائل. ويكون ذلك مفيدًا
    عندما تريد الردود الأصلية أساسًا للمحادثات المتدفقة والملتبسة، وليس لكل
    دور مكوّن من رسالة واحدة.

    يتم إظهار معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="المعاينة الحية للبث">
    يمكن لـ OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتحريرها مع وصول النص. تقبل `channels.discord.streaming` القيم `off` (الافتراضي) | `partial` | `block` | `progress`. ويتم تعيين `progress` إلى `partial` على Discord؛ و`streamMode` اسم بديل قديم تتم هجرته تلقائيًا.

    تظل القيمة الافتراضية `off` لأن تعديلات المعاينة في Discord تصل سريعًا إلى حدود المعدل عندما تشترك عدة بوتات أو بوابات في حساب واحد.

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

    - يقوم `partial` بتحرير رسالة معاينة واحدة مع وصول التوكنات.
    - يقوم `block` بإخراج أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييدها إلى `textChunkLimit`).
    - تؤدي الرسائل النهائية الخاصة بالوسائط والأخطاء والردود الصريحة إلى إلغاء أي تعديلات معاينة معلّقة.
    - يتحكم `streaming.preview.toolProgress` (الافتراضي `true`) في ما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة.

    يقتصر بث المعاينة على النصوص فقط؛ وتعود ردود الوسائط إلى التسليم العادي. وعندما يكون بث `block` مفعّلًا صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك السلاسل">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الاحتياط: `messages.groupChat.historyLimit`
    - `0` يعطّلها

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - يتم توجيه سلاسل Discord كجلسات قنوات وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - يتيح `channels.discord.thread.inheritParent` (الافتراضي `false`) للسلاسل التلقائية الجديدة البدء من النص الأصلي للقناة الأب. توجد التجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل تحليل أهداف الرسائل الخاصة بصيغة `user:<id>`.
    - تتم المحافظة على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء احتياط تفعيل مرحلة الرد.

    يتم حقن مواضيع القنوات كسياق **غير موثوق**. تتحكم قوائم السماح فيمن يمكنه تشغيل الوكيل، لكنها ليست حدًا كاملًا لتنقيح السياق الإضافي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالسلاسل للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة بهدف جلسة بحيث تستمر الرسائل اللاحقة في تلك السلسلة في التوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` لربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` لإزالة الربط من السلسلة الحالية
    - `/agents` لعرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` لفحص/تحديث إلغاء التركيز التلقائي عند عدم النشاط للروابط المركّزة
    - `/session max-age <duration|off>` لفحص/تحديث الحد الأقصى الصارم للعمر للروابط المركّزة

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

    - يضبط `session.threadBindings.*` القيم الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يجب أن تكون `spawnSubagentSessions` مساوية لـ true لإنشاء/ربط السلاسل تلقائيًا مع `sessions_spawn({ thread: true })`.
    - يجب أن تكون `spawnAcpSessions` مساوية لـ true لإنشاء/ربط السلاسل تلقائيًا مع ACP (`/acp spawn ... --thread ...` أو `sessions_spawn({ runtime: "acp", thread: true })`).
    - إذا كانت روابط السلاسل معطلة لحساب ما، فلن تكون `/focus` وعمليات ربط السلاسل المرتبطة بها متاحة.

    راجع [الوكلاء الفرعيين](/ar/tools/subagents) و[وكلاء ACP](/ar/tools/acp-agents) و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="روابط قنوات ACP المستمرة">
    لمساحات عمل ACP مستقرة و«دائمة التشغيل»، اضبط روابط ACP مكتوبة على المستوى الأعلى تستهدف محادثات Discord.

    مسار الإعدادات:

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

    - يقوم `/acp spawn codex --bind here` بربط القناة أو السلسلة الحالية في مكانها ويحافظ على الرسائل المستقبلية في جلسة ACP نفسها. وترث رسائل السلسلة ربط القناة الأب.
    - في قناة أو سلسلة مرتبطة، يعيد `/new` و`/reset` ضبط جلسة ACP نفسها في مكانها. ويمكن لروابط السلاسل المؤقتة تجاوز تحليل الهدف ما دامت نشطة.
    - لا تكون `spawnAcpSessions` مطلوبة إلا عندما يحتاج OpenClaw إلى إنشاء/ربط سلسلة فرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على تفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    وضع إشعارات التفاعلات لكل خادم:

    - `off`
    - `own` (الافتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    يتم تحويل أحداث التفاعلات إلى أحداث نظام وإرفاقها بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="تفاعلات التأكيد">
    يرسل `ackReaction` رمزًا تعبيريًا للتأكيد بينما يعالج OpenClaw رسالة واردة.

    ترتيب التحليل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - الاحتياط إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحدة Unicode أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    تكون كتابات الإعدادات التي تبدأ من القناة مفعلة افتراضيًا.

    يؤثر هذا في تدفقات `/config set|unset` (عند تفعيل ميزات الأوامر).

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
    مرّر حركة مرور WebSocket الخاصة ببوابة Discord وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + تحليل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    فعّل تحليل PluralKit لربط الرسائل الممررة بهوية عضو النظام:

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

    - يمكن لقوائم السماح استخدام `pk:<memberId>`
    - تتم مطابقة أسماء العرض للأعضاء بالاسم/slug فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الممررة على أنها رسائل بوت وتُسقط ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="إعداد الحالة">
    يتم تطبيق تحديثات الحالة عندما تضبط حقل حالة أو نشاط، أو عندما تفعّل الحالة التلقائية.

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
    - 4: Custom (يستخدم نص النشاط كحالة؛ والرمز التعبيري اختياري)
    - 5: Competing

    مثال على الحالة التلقائية (إشارة صحة وقت التشغيل):

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

    تقوم الحالة التلقائية بربط توفر وقت التشغيل بحالة Discord: سليم => online، ومتدهور أو غير معروف => idle، ومنهك أو غير متاح => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المستندة إلى الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعدادات:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ ويعود إلى `commands.ownerAllowFrom` عند الإمكان)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    يقوم Discord تلقائيًا بتفعيل موافقات التنفيذ الأصلية عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن تحليل مُوافِق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. ولا يستنتج Discord الموافقين على التنفيذ من `allowFrom` الخاص بالقناة، أو `dm.allowFrom` القديم، أو `defaultTo` الخاص بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord كعميل موافقة أصلي بشكل صريح.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. ولا يمكن استخدام الأزرار إلا من قبل الموافقين الذين تم تحليلهم؛ ويتلقى المستخدمون الآخرون رفضًا سريع الزوال. وتتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم في القناة إلا في القنوات الموثوقة. وإذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة المستخدمة من قنوات الدردشة الأخرى. ويضيف محول Discord الأصلي أساسًا توجيه رسائل الموافقة الخاصة بالموافقين والتوزيع على القنوات.
    وعندما تكون هذه الأزرار موجودة، فإنها تكون تجربة الاستخدام الأساسية للموافقة؛ ويجب على OpenClaw
    أن يضمّن أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    يتبع توثيق Gateway وتحليل الموافقات عقد عميل Gateway المشترك (`plugin:` IDs تُحل عبر `plugin.approval.resolve`؛ والمعرّفات الأخرى عبر `exec.approval.resolve`). وتنتهي صلاحية الموافقات افتراضيًا بعد 30 دقيقة.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord إجراءات المراسلة وإدارة القنوات والإشراف والحالة وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- التفاعلات: `react`, `reactions`, `emojiList`
- الإشراف: `timeout`, `kick`, `ban`
- الحالة: `setPresence`

يقبل الإجراء `event-create` وسيطة `image` اختيارية (URL أو مسار ملف محلي) لضبط صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات تحت `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                         | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل     |
| roles                                                                                                                                                                    | معطّل     |
| moderation                                                                                                                                                               | معطّل     |
| presence                                                                                                                                                                 | معطّل     |

## واجهة Components v2

يستخدم OpenClaw Discord components v2 لموافقات التنفيذ وعلامات السياق المتقاطع. ويمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مخصصة (متقدم؛ ويتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تظل `embeds` القديمة متاحة ولكن لا يُوصى بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكوّنات Discord (hex).
- اضبطه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
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

لدى Discord سطحان صوتيان مختلفان: **قنوات صوتية** آنية (محادثات مستمرة) و**مرفقات رسائل صوتية** (تنسيق معاينة الموجة الصوتية). وتدعم البوابة كليهما.

### القنوات الصوتية

المتطلبات:

- فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
- اضبط `channels.discord.voice`.
- يحتاج البوت إلى أذونات Connect + Speak في القناة الصوتية المستهدفة.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع نفس قواعد قائمة السماح وسياسة المجموعات مثل أوامر Discord الأخرى.

مثال على الانضمام التلقائي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
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
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

ملاحظات:

- تتجاوز `voice.tts` القيمة `messages.tts` لتشغيل الصوت فقط.
- تستمد أدوار نصوص الصوت حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصصة للمالك فقط (مثل `gateway` و`Cron`).
- يكون الصوت مفعّلًا افتراضيًا؛ اضبط `channels.discord.voice.enabled=false` لتعطيله.
- يتم تمرير `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- القيم الافتراضية في `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم يتم ضبطهما.
- يراقب OpenClaw أيضًا فشل فك التشفير عند الاستقبال ويقوم بالاسترداد التلقائي عبر مغادرة القناة الصوتية ثم إعادة الانضمام إليها بعد تكرر حالات الفشل خلال نافذة قصيرة.
- إذا كانت سجلات الاستقبال تعرض بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`، فقد يكون هذا هو خلل الاستقبال في `@discordjs/voice` من المصدر العلوي والمتابع في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### الرسائل الصوتية

تعرض الرسائل الصوتية في Discord معاينة للموجة الصوتية وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة الصوتية تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف البوابة للفحص والتحويل.

- وفّر **مسار ملف محلي** (يتم رفض عناوين URL).
- احذف المحتوى النصي (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يتم قبول أي تنسيق صوتي؛ ويحوّل OpenClaw الملف إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تم استخدام نوايا غير مسموح بها أو أن البوت لا يرى رسائل الخادم">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على تحليل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير النوايا

  </Accordion>

  <Accordion title="تم حظر رسائل الخادم بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة السماح الخاصة بالخادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالخادم موجودة، فلن يُسمح إلا بالقنوات المدرجة
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="تم ضبط Require mention على false لكنه لا يزال محظورًا">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة للخادم/القناة
    - تم ضبط `requireMention` في المكان الخطأ (يجب أن يكون تحت `channels.discord.guilds` أو ضمن إدخال القناة)
    - تم حظر المرسل بواسطة قائمة السماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="تنتهي مهلة المعالجات طويلة التشغيل أو تتكرر الردود">

    السجلات النموذجية:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    عنصر التحكم في ميزانية المستمع:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    عنصر التحكم في مهلة تشغيل العامل:

    - حساب واحد: `channels.discord.inboundWorker.runTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - الافتراضي: `1800000` (30 دقيقة)؛ اضبطه على `0` للتعطيل

    خط أساس موصى به:

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

    استخدم `eventQueue.listenerTimeout` لإعداد المستمع البطيء، واستخدم `inboundWorker.runTimeoutMs`
    فقط إذا كنت تريد صمام أمان منفصلًا لأدوار الوكيل الموضوعة في قائمة الانتظار.

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    لا تعمل فحوصات الأذونات في `channels status --probe` إلا مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد يظل التطابق وقت التشغيل يعمل، لكن الفحص لا يمكنه التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - الرسائل الخاصة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل الخاصة معطلة: `channels.discord.dmPolicy="disabled"` (الاسم القديم: `channels.discord.dm.policy`)
    - بانتظار الموافقة على الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات بوت إلى بوت">
    يتم تجاهل الرسائل التي يكتبها البوت افتراضيًا.

    إذا قمت بضبط `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارة وقوائم السماح لتجنب سلوك الحلقات.
    ويفضّل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل البوت التي تشير إلى البوت فقط.

  </Accordion>

  <Accordion title="يسقط STT الصوتي مع DecryptionFailed(...)">

    - أبقِ OpenClaw محدّثًا (`openclaw update`) حتى يكون منطق الاسترداد الخاص باستقبال صوت Discord موجودًا
    - أكّد أن `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (الافتراضي من المصدر العلوي) واضبطه فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت حالات الفشل بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها مع [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## مؤشرات مرجع الإعدادات

المرجع الأساسي:

- [مرجع الإعدادات - Discord](/ar/gateway/configuration-reference#discord)

حقول Discord عالية الأهمية:

- بدء التشغيل/التوثيق: `enabled`, `token`, `accounts.*`, `allowBots`
- السياسة: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- الأمر: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- قائمة انتظار الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- العامل الوارد: `inboundWorker.runTimeoutMs`
- الرد/السجل: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- البث: `streaming` (الاسم البديل القديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb`, `retry`
  - يحدد `mediaMaxMb` الحد الأقصى لعمليات الرفع الصادرة إلى Discord (الافتراضي: `100MB`)
- الإجراءات: `actions.*`
- الحالة: `activity`, `status`, `activityType`, `activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`, المستوى الأعلى `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## السلامة والعمليات

- تعامل مع رموز البوت على أنها أسرار (ويُفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أقل قدر ممكن من أذونات Discord.
- إذا كانت حالة نشر الأوامر/الحالة قديمة، فأعد تشغيل Gateway ثم أعد التحقق باستخدام `openclaw channels status --probe`.

## ذي صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [الأمان](/ar/gateway/security)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
