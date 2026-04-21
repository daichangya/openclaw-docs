---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم bot في Discord، والإمكانات، والإعدادات
title: Discord
x-i18n:
    generated_at: "2026-04-21T17:45:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1681315a6c246c4b68347f5e22319e132f30ea4e29a19e7d1da9e83dce7b68d0
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

الحالة: جاهز للرسائل الخاصة والقنوات داخل الخادم عبر بوابة Discord الرسمية.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تكون الرسائل الخاصة في Discord في وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيصات عبر القنوات وتدفق الإصلاح.
  </Card>
</CardGroup>

## إعداد سريع

ستحتاج إلى إنشاء تطبيق جديد يحتوي على bot، ثم إضافة الـ bot إلى خادمك، ثم إقرانه مع OpenClaw. نوصي بإضافة الـ bot إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [فأنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وbot">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. سمّه باسم مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw الخاص بك.

  </Step>

  <Step title="تفعيل intents المميزة">
    وأنت لا تزال في صفحة **Bot**، مرّر إلى أسفل حتى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح الخاصة بالأدوار ولمطابقة الاسم إلى المعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحالة)

  </Step>

  <Step title="نسخ bot token الخاص بك">
    مرّر مرة أخرى إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، فهذا ينشئ أول token لك — ولا تتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الـ token واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء رابط دعوة وإضافة الـ bot إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ رابط دعوة بالأذونات الصحيحة لإضافة الـ bot إلى خادمك.

    مرّر إلى أسفل حتى **OAuth2 URL Generator** وفعّل:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** في الأسفل. فعّل:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (اختياري)

    انسخ الرابط المُنشأ في الأسفل، والصقه في متصفحك، وحدد خادمك، ثم انقر **Continue** للاتصال. ينبغي الآن أن ترى الـ bot في خادم Discord.

  </Step>

  <Step title="تفعيل Developer Mode وجمع المعرّفات الخاصة بك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل Developer Mode حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** إلى جانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الاقتران، يحتاج Discord إلى السماح لـ bot الخاص بك بإرسال رسالة خاصة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك bots) إرسال رسائل خاصة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام الرسائل الخاصة في Discord مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، فيمكنك تعطيل الرسائل الخاصة بعد الاقتران.

  </Step>

  <Step title="اضبط bot token الخاص بك بشكل آمن (لا ترسله في الدردشة)">
    إن Discord bot token الخاص بك سرّي (مثل كلمة المرور). اضبطه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو عبر إيقاف عملية `openclaw gateway run` ثم تشغيلها مجددًا.

  </Step>

  <Step title="إعداد OpenClaw والاقتران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw الخاص بك على أي قناة موجودة (مثل Telegram) وأبلغه بذلك. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد قمت بالفعل بضبط Discord bot token في الإعدادات. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضل الإعداد المستند إلى الملف، فاضبط:

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

        البديل عبر env للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        قيم `token` النصية الصريحة مدعومة. كما أن قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="الموافقة على أول اقتران عبر الرسائل الخاصة">
    انتظر حتى تعمل البوابة، ثم أرسل رسالة خاصة إلى bot في Discord. سيرد عليك برمز اقتران.

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

    ينبغي أن تتمكن الآن من التحدث مع وكيلك في Discord عبر الرسائل الخاصة.

  </Step>
</Steps>

<Note>
يتم حل الـ token على أساس الحساب. تمنح قيم token في الإعدادات الأولوية على البديل عبر env. لا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
بالنسبة للاتصالات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق ذلك على إجراءات الإرسال والقراءة/الفحص (مثل read/search/fetch/thread/pins/permissions). ولا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
</Note>

## موصى به: إعداد مساحة عمل على خادم

بمجرد أن تعمل الرسائل الخاصة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها وسياقها الخاص. يُوصى بهذا للخوادم الخاصة التي تكون أنت وbot الخاص بك فقط فيها.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح الخاصة بالخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس فقط في الرسائل الخاصة.

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

  <Step title="السماح بالردود دون @mention">
    بشكل افتراضي، لا يرد وكيلك في قنوات الخادم إلا عند عمل @mention له. بالنسبة لخادم خاص، فغالبًا ستريد أن يرد على كل رسالة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى عمل @mention له"
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

  <Step title="خطط للذاكرة في قنوات الخادم">
    بشكل افتراضي، لا يتم تحميل الذاكرة طويلة الأمد (`MEMORY.md`) إلا في جلسات الرسائل الخاصة. لا تقوم قنوات الخادم بتحميل `MEMORY.md` تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت بحاجة إلى سياق طويل الأمد من `MEMORY.md`."
      </Tab>
      <Tab title="يدوي">
        إذا كنت بحاجة إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنهما في كل جلسة). واحتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

الآن أنشئ بعض القنوات على خادم Discord الخاص بك وابدأ التحدث. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلسة معزولة خاصة بها — لذلك يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- تملك Gateway اتصال Discord.
- توجيه الردود حتمي: الرسائل الواردة من Discord تُعاد إلى Discord.
- بشكل افتراضي (`session.dmScope=main`)، تشارك المحادثات المباشرة الجلسة الرئيسية للوكيل (`agent:main:main`).
- قنوات الخادم مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل الرسائل الخاصة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord إلا منشورات الخيوط. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء خيط تلقائيًا. يستخدم عنوان الخيط أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء خيط مباشرة. لا تمرر `--message-id` لقنوات المنتدى.

مثال: الإرسال إلى أصل المنتدى لإنشاء خيط

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء خيط منتدى بشكل صريح

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتدى مكوّنات Discord. إذا كنت بحاجة إلى مكوّنات، فأرسل إلى الخيط نفسه (`channel:<threadId>`).

## المكوّنات التفاعلية

يدعم OpenClaw حاويات Discord components v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. يتم توجيه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text` و`section` و`separator` و`actions` و`media-gallery` و`file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string` و`user` و`role` و`mentionable` و`channel`

بشكل افتراضي، تكون المكوّنات للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والقوائم والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند الإعداد، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا مرئيًا لهم فقط.

يفتح الأمران `/model` و`/models` منتقي نماذج تفاعليًا يحتوي على قوائم منسدلة لموفر الخدمة والنموذج بالإضافة إلى خطوة Submit. يكون رد المنتقي مؤقتًا ومرئيًا فقط للمستخدم الذي استدعاه، ولا يمكن لغيره استخدامه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

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
  message: "نص احتياطي اختياري",
  components: {
    reusable: true,
    text: "اختر مسارًا",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "موافقة",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "رفض", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "اختر خيارًا",
          options: [
            { label: "الخيار A", value: "a" },
            { label: "الخيار B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "التفاصيل",
      triggerLabel: "فتح النموذج",
      fields: [
        { type: "text", label: "مقدّم الطلب" },
        {
          type: "select",
          label: "الأولوية",
          options: [
            { label: "منخفضة", value: "low" },
            { label: "مرتفعة", value: "high" },
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
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل الخاصة (قديمًا: `channels.discord.dm.policy`):

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`؛ قديمًا: `channels.discord.dm.allowFrom`)
    - `disabled`

    إذا لم تكن سياسة الرسائل الخاصة مفتوحة، فسيتم حظر المستخدمين غير المعروفين (أو مطالبتهم بالاقتران في وضع `pairing`).

    أولوية الحسابات المتعددة:

    - يطبَّق `channels.discord.accounts.default.allowFrom` على حساب `default` فقط.
    - ترث الحسابات المسمّاة `channels.discord.allowFrom` عندما لا تكون قيمة `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسمّاة `channels.discord.accounts.default.allowFrom`.

    تنسيق هدف الرسائل الخاصة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    تكون المعرّفات الرقمية المجردة ملتبسة ويتم رفضها ما لم يتم توفير نوع هدف مستخدم/قناة صريح.

  </Tab>

  <Tab title="سياسة الخادم">
    يتم التحكم في التعامل مع الخوادم بواسطة `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يفضَّل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى باستخدام المعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم إعداد أيٍّ منهما، فيُسمح للمرسلين عند مطابقتهم `users` أو `roles`
    - تكون المطابقة المباشرة للاسم/الوسم معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق طارئ
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

    إذا قمت فقط بتعيين `DISCORD_BOT_TOKEN` ولم تُنشئ كتلة `channels.discord`، فسيكون بديل وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى لو كانت قيمة `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="الإشارات والرسائل الخاصة الجماعية">
    تكون رسائل الخادم مقيّدة بالإشارات افتراضيًا.

    يشمل اكتشاف الإشارات:

    - إشارة صريحة إلى bot
    - أنماط الإشارة المُعدّة (`agents.list[].groupChat.mentionPatterns`، والبديل `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على bot في الحالات المدعومة

    يتم إعداد `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يقوم `ignoreOtherMentions` اختياريًا بإسقاط الرسائل التي تذكر مستخدمًا/دورًا آخر لكن ليس bot (باستثناء @everyone/@here).

    الرسائل الخاصة الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو slugs)

  </Tab>
</Tabs>

### التوجيه إلى الوكيل بالاعتماد على الدور

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل الارتباطات المعتمدة على الدور معرّفات الأدوار فقط ويتم تقييمها بعد ارتباطات النظير أو نظير الأصل وقبل الارتباطات الخاصة بالخادم فقط. إذا كان الارتباط يضبط أيضًا حقول مطابقة أخرى (مثل `peer` + `guildId` + `roles`)، فيجب أن تتطابق كل الحقول المضبوطة.

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
  <Accordion title="إنشاء تطبيق وbot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. انسخ bot token

  </Accordion>

  <Accordion title="intents المميزة">
    في **Bot -> Privileged Gateway Intents**، فعّل:

    - Message Content Intent
    - Server Members Intent (موصى به)

    يكون Presence intent اختياريًا ولا يكون مطلوبًا إلا إذا كنت تريد تلقي تحديثات الحالة. لا يتطلب تعيين حالة bot (`setPresence`) تفعيل تحديثات الحالة للأعضاء.

  </Accordion>

  <Accordion title="نطاقات OAuth والأذونات الأساسية">
    مولّد URL الخاص بـ OAuth:

    - النطاقات: `bot`، `applications.commands`

    الأذونات الأساسية المعتادة:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (اختياري)

    تجنب `Administrator` ما لم يكن مطلوبًا صراحة.

  </Accordion>

  <Accordion title="نسخ المعرّفات">
    فعّل Discord Developer Mode، ثم انسخ:

    - معرّف الخادم
    - معرّف القناة
    - معرّف المستخدم

    فضّل استخدام المعرّفات الرقمية في إعدادات OpenClaw من أجل تدقيقات وفحوصات أكثر موثوقية.

  </Accordion>
</AccordionGroup>

## الأوامر الأصلية ومصادقة الأوامر

- القيمة الافتراضية لـ `commands.native` هي `"auto"` وهي مفعّلة في Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى مسح أوامر Discord الأصلية المسجّلة سابقًا صراحةً.
- تستخدم مصادقة الأوامر الأصلية نفس قوائم السماح/السياسات الخاصة بـ Discord المستخدمة في معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرّح لهم؛ لكن التنفيذ يظل يفرض مصادقة OpenClaw ويعيد "غير مخوّل".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على فهرس الأوامر والسلوك.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزات

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم بها عبر `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يؤدي `off` إلى تعطيل ترابط الرد الضمني. ولا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.
    يقوم `first` دائمًا بإرفاق مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة في الدورة.
    يقوم `batched` بإرفاق مرجع الرد الأصلي الضمني في Discord فقط عندما
    تكون الدورة الواردة دفعة مؤجلة من عدة رسائل. وهذا مفيد
    عندما تريد الردود الأصلية أساسًا للمحادثات السريعة الملتبسة، وليس لكل
    دورة رسالة مفردة.

    يتم إظهار معرّفات الرسائل في السياق/السجل لكي تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث مسودات الردود عن طريق إرسال رسالة مؤقتة وتعديلها مع وصول النص.

    - يتحكم `channels.discord.streaming` في بث المعاينة (`off` | `partial` | `block` | `progress`، الافتراضي: `off`).
    - يبقى الافتراضي `off` لأن تعديلات معاينة Discord قد تصطدم بحدود المعدّل بسرعة، خاصة عندما تشارك عدة bots أو بوابات الحساب نفسه أو حركة خادم واحدة.
    - القيمة `progress` مقبولة لتحقيق الاتساق عبر القنوات ويتم ربطها إلى `partial` على Discord.
    - `channels.discord.streamMode` اسم بديل قديم ويتم ترحيله تلقائيًا.
    - يقوم `partial` بتعديل رسالة معاينة واحدة مع وصول التوكنات.
    - يصدر `block` كتلًا بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل).
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة معاينة المسودة نفسها (الافتراضي: `true`). اضبطها على `false` للاحتفاظ برسائل أداة/تقدم منفصلة.

    مثال:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    إعدادات تقطيع الوضع `block` الافتراضية (مقيّدة بالقيمة `channels.discord.textChunkLimit`):

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

    بث المعاينة خاص بالنص فقط؛ وتعود الردود التي تحتوي على وسائط إلى التسليم العادي.

    ملاحظة: بث المعاينة منفصل عن البث الكتلي. عند تفعيل
    البث الكتلي صراحةً لـ Discord، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك الخيوط">
    سياق سجل الخادم:

    - `channels.discord.historyLimit` الافتراضي `20`
    - البديل: `messages.groupChat.historyLimit`
    - القيمة `0` تعطل الميزة

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك الخيوط:

    - يتم توجيه خيوط Discord كجلسات قنوات
    - يمكن استخدام بيانات الخيط الأب الوصفية لربط جلسة الأصل
    - يرث إعداد الخيط إعداد القناة الأب ما لم يوجد إدخال خاص بالخيط

    يتم حقن مواضيع القنوات كسياق **غير موثوق** (وليس كـ system prompt).
    يبقى سياق الرد والرسالة المقتبسة حاليًا كما تم استلامه.
    تتحكم قوائم السماح في Discord أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالخيوط للوكلاء الفرعيين">
    يمكن لـ Discord ربط خيط بهدف جلسة بحيث تستمر الرسائل اللاحقة في ذلك الخيط في التوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط الخيط الحالي/الجديد بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة الربط الحالي للخيط
    - `/agents` عرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` فحص/تحديث إلغاء التركيز التلقائي بسبب عدم النشاط للارتباطات المركزة
    - `/session max-age <duration|off>` فحص/تحديث الحد الأقصى الصارم للعمر للارتباطات المركزة

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
        spawnSubagentSessions: false, // اشتراك اختياري
      },
    },
  },
}
```

    ملاحظات:

    - يضبط `session.threadBindings.*` الإعدادات الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يجب أن تكون `spawnSubagentSessions` بقيمة true لإنشاء/ربط الخيوط تلقائيًا لـ `sessions_spawn({ thread: true })`.
    - يجب أن تكون `spawnAcpSessions` بقيمة true لإنشاء/ربط الخيوط تلقائيًا لـ ACP (`/acp spawn ... --thread ...` أو `sessions_spawn({ runtime: "acp", thread: true })`).
    - إذا كانت ارتباطات الخيوط معطلة لحساب ما، فلن تكون `/focus` وعمليات ربط الخيوط ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="ارتباطات قنوات ACP الدائمة">
    لمساحات عمل ACP مستقرة "دائمة التشغيل"، قم بإعداد ارتباطات ACP مكتوبة على المستوى الأعلى تستهدف محادثات Discord.

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

    - يقوم `/acp spawn codex --bind here` بربط قناة Discord الحالية أو الخيط الحالي في مكانه، ويُبقي الرسائل المستقبلية موجّهة إلى جلسة ACP نفسها.
    - قد يعني ذلك أيضًا "بدء جلسة Codex ACP جديدة"، لكنه لا يُنشئ خيط Discord جديدًا بحد ذاته. تظل القناة الحالية هي سطح الدردشة.
    - قد يستمر Codex في العمل ضمن `cwd` أو مساحة عمل backend الخاصة به على القرص. مساحة العمل هذه هي حالة وقت تشغيل، وليست خيط Discord.
    - يمكن لرسائل الخيط أن ترث ارتباط ACP الخاص بالقناة الأصل.
    - في قناة أو خيط مرتبط، يقوم `/new` و`/reset` بإعادة تعيين جلسة ACP نفسها في مكانها.
    - لا تزال ارتباطات الخيوط المؤقتة تعمل ويمكنها تجاوز حل الهدف أثناء نشاطها.
    - لا تكون `spawnAcpSessions` مطلوبة إلا عندما يحتاج OpenClaw إلى إنشاء/ربط خيط فرعي عبر `--thread auto|here`. وهي ليست مطلوبة لـ `/acp spawn ... --bind here` في القناة الحالية.

    راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على تفاصيل سلوك الارتباط.

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    وضع إشعارات التفاعلات لكل خادم:

    - `off`
    - `own` (افتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    تتحول أحداث التفاعل إلى أحداث نظام وتُرفق بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للتأكيد بينما يعالج OpenClaw رسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - البديل من الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا `"👀"`)

    ملاحظات:

    - يقبل Discord الرموز التعبيرية unicode أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    تكون كتابات الإعدادات التي تبدأ من القناة مفعّلة افتراضيًا.

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
    وجّه حركة WebSocket الخاصة ببوابة Discord وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    فعّل حل PluralKit لربط الرسائل الممررة عبر الوكيل بهوية عضو النظام:

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
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/slug فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، فسيتم التعامل مع الرسائل الممررة عبر الوكيل كرسائل bot وسيتم إسقاطها ما لم تكن `allowBots=true`

  </Accordion>

  <Accordion title="إعداد الحالة">
    يتم تطبيق تحديثات الحالة عند تعيين حقل حالة أو نشاط، أو عند تفعيل الحالة التلقائية.

    مثال للحالة فقط:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    مثال للنشاط (حالة مخصصة هي نوع النشاط الافتراضي):

```json5
{
  channels: {
    discord: {
      activity: "وقت التركيز",
      activityType: 4,
    },
  },
}
```

    مثال للبث:

```json5
{
  channels: {
    discord: {
      activity: "برمجة مباشرة",
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

    مثال للحالة التلقائية (إشارة صحة وقت التشغيل):

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

    تربط الحالة التلقائية توافر وقت التشغيل بحالة Discord على النحو التالي: healthy => online، وdegraded أو unknown => idle، وexhausted أو unavailable => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المستندة إلى الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعدادات:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter` و`sessionFilter` و`cleanupAfterResolve`

    يفعّل Discord موافقات exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن حلّ مُوافِق واحد على الأقل، سواء من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord مُوافِقي exec من `allowFrom` الخاص بالقناة أو `dm.allowFrom` القديم أو `defaultTo` الخاص بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord كعميل موافقة أصلي صراحةً.

    عندما تكون قيمة `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. لا يمكن استخدام الأزرار إلا من قبل المُوافِقين الذين تم حلّهم؛ ويتلقى المستخدمون الآخرون رفضًا مؤقتًا مرئيًا لهم فقط. تتضمن مطالبات الموافقة نص الأمر، لذلك فعّل التسليم إلى القناة فقط في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف مُكيّف Discord الأصلي أساسًا توجيه الرسائل الخاصة للمُوافِقين والنشر إلى القناة.
    عندما تكون هذه الأزرار موجودة، فإنها تكون تجربة الاستخدام الأساسية للموافقات؛ ويجب على OpenClaw
    ألا يضمّن أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى
    أن الموافقات عبر الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    تستخدم مصادقة Gateway لهذا المعالج عقد حل بيانات الاعتماد المشترك نفسه المستخدم مع عملاء Gateway الآخرين:

    - مصادقة محلية تبدأ من env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` ثم `gateway.auth.*`)
    - في الوضع المحلي، يمكن استخدام `gateway.remote.*` كبديل فقط عندما لا تكون `gateway.auth.*` مضبوطة؛ وتفشل قيم SecretRef المحلية المُعدّة لكن غير المحلولة بشكل مغلق
    - دعم الوضع البعيد عبر `gateway.remote.*` عندما ينطبق ذلك
    - تكون تجاوزات URL آمنة من حيث التجاوز: لا تعيد تجاوزات CLI استخدام بيانات الاعتماد الضمنية، وتستخدم تجاوزات env بيانات اعتماد env فقط

    سلوك حل الموافقات:

    - يتم حل المعرّفات المسبوقة بـ `plugin:` عبر `plugin.approval.resolve`.
    - يتم حل المعرّفات الأخرى عبر `exec.approval.resolve`.
    - لا يقوم Discord هنا بقفزة بديلة إضافية من exec إلى plugin؛ إذ يحدد
      بادئة المعرّف طريقة Gateway التي يستدعيها.

    تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا. إذا فشلت الموافقات مع
    معرّفات موافقة غير معروفة، فتحقق من حل المُوافِقين وتفعيل الميزة
    وأن نوع معرّف الموافقة المُسلَّم يطابق الطلب المعلّق.

    المستندات ذات الصلة: [موافقات Exec](/ar/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord إجراءات المراسلة وإدارة القنوات والإشراف والحالة وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage` و`readMessages` و`editMessage` و`deleteMessage` و`threadReply`
- التفاعلات: `react` و`reactions` و`emojiList`
- الإشراف: `timeout` و`kick` و`ban`
- الحالة: `setPresence`

يقبل الإجراء `event-create` معامل `image` اختياريًا (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات تحت `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراء                                                                                                                                                           | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل     |
| roles                                                                                                                                                                    | معطّل     |
| moderation                                                                                                                                                               | معطّل     |
| presence                                                                                                                                                                 | معطّل     |

## واجهة Components v2

يستخدم OpenClaw Discord components v2 لموافقات exec وعلامات السياق المتقاطع. يمكن أن تقبل إجراءات رسائل Discord أيضًا `components` لواجهة مستخدم مخصصة (متقدم؛ ويتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تظل `embeds` القديمة متاحة ولكن لا يُوصى بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم بواسطة حاويات مكوّنات Discord (hex).
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

## القنوات الصوتية

يمكن لـ OpenClaw الانضمام إلى قنوات Discord الصوتية لإجراء محادثات فورية ومستمرة. وهذا منفصل عن مرفقات الرسائل الصوتية.

المتطلبات:

- فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
- اضبط `channels.discord.voice`.
- يحتاج bot إلى أذونات Connect + Speak في القناة الصوتية المستهدفة.

استخدم الأمر الأصلي الخاص بـ Discord فقط `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع قواعد قائمة السماح وسياسة الخادم نفسها مثل أوامر Discord الأخرى.

مثال للانضمام التلقائي:

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

- يتجاوز `voice.tts` القيمة `messages.tts` لتشغيل الصوت فقط.
- تستمد دورات تفريغ الصوت حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصّصة للمالك فقط (مثل `gateway` و`cron`).
- تكون الميزة الصوتية مفعّلة افتراضيًا؛ اضبط `channels.discord.voice.enabled=false` لتعطيلها.
- يتم تمرير `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام الخاصة بـ `@discordjs/voice`.
- القيم الافتراضية في `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم يتم ضبطها.
- يراقب OpenClaw أيضًا حالات فشل فك التشفير عند الاستقبال ويستعيد تلقائيًا عبر مغادرة القناة الصوتية ثم الانضمام إليها مجددًا بعد تكرار حالات الفشل خلال نافذة قصيرة.
- إذا كانت سجلات الاستقبال تعرض بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`، فقد يكون هذا خطأ الاستقبال من `@discordjs/voice` على مستوى المنبع والمتتبع في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## الرسائل الصوتية

تعرض الرسائل الصوتية في Discord معاينة للموجة الصوتية وتتطلب صوت OGG/Opus بالإضافة إلى بيانات وصفية. ينشئ OpenClaw الموجة الصوتية تلقائيًا، لكنه يحتاج إلى توفر `ffmpeg` و`ffprobe` على مضيف Gateway لفحص ملفات الصوت وتحويلها.

المتطلبات والقيود:

- قدّم **مسار ملف محليًا** (يتم رفض عناوين URL).
- احذف المحتوى النصي (لا يسمح Discord بالنص + رسالة صوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ ويحوّل OpenClaw الملفات إلى OGG/Opus عند الحاجة.

مثال:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استخدام intents غير مسموح بها أو أن bot لا يرى رسائل الخادم">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير intents

  </Accordion>

  <Accordion title="تم حظر رسائل الخادم بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة السماح الخاصة بالخادم تحت `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالخادم موجودة، فلن يُسمح إلا بالقنوات المدرجة
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="القيمة requireMention false لكن لا يزال الحظر قائمًا">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` بدون قائمة سماح مطابقة للخادم/القناة
    - تم إعداد `requireMention` في المكان الخطأ (يجب أن يكون تحت `channels.discord.guilds` أو ضمن إدخال القناة)
    - تم حظر المرسِل بواسطة قائمة السماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="تنتهي مهلة المعالجات طويلة التشغيل أو تتكرر الردود">

    سجلات نموذجية:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    مفتاح ميزانية المستمع:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    مفتاح مهلة تشغيل العامل:

    - حساب واحد: `channels.discord.inboundWorker.runTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - الافتراضي: `1800000` (30 دقيقة)؛ اضبط `0` للتعطيل

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

    استخدم `eventQueue.listenerTimeout` لإعداد المستمع البطيء و`inboundWorker.runTimeoutMs`
    فقط إذا كنت تريد صمام أمان منفصلًا لدورات الوكيل الموضوعة في قائمة الانتظار.

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    لا تعمل فحوصات الأذونات في `channels status --probe` إلا مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد يظل التطابق في وقت التشغيل يعمل، لكن الفحص لا يمكنه التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - الرسائل الخاصة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل الخاصة معطلة: `channels.discord.dmPolicy="disabled"` (قديمًا: `channels.discord.dm.policy`)
    - انتظار الموافقة على الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات bot إلى bot">
    يتم تجاهل الرسائل التي أنشأها bot افتراضيًا.

    إذا قمت بتعيين `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارات وقوائم السماح لتجنب سلوك الحلقات.
    ويفضّل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل bot التي تذكر bot فقط.

  </Accordion>

  <Accordion title="انقطاع STT الصوتي مع DecryptionFailed(...)">

    - أبقِ OpenClaw محدّثًا (`openclaw update`) حتى يكون منطق استعادة استقبال Discord الصوتي موجودًا
    - أكّد أن `channels.discord.voice.daveEncryption=true` (افتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (القيمة الافتراضية في المنبع) واضبطها فقط عند الحاجة
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

- بدء التشغيل/المصادقة: `enabled` و`token` و`accounts.*` و`allowBots`
- السياسة: `groupPolicy` و`dm.*` و`guilds.*` و`guilds.*.channels.*`
- الأوامر: `commands.native` و`commands.useAccessGroups` و`configWrites` و`slashCommand.*`
- قائمة انتظار الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع) و`eventQueue.maxQueueSize` و`eventQueue.maxConcurrency`
- العامل الوارد: `inboundWorker.runTimeoutMs`
- الرد/السجل: `replyToMode` و`historyLimit` و`dmHistoryLimit` و`dms.*.historyLimit`
- التسليم: `textChunkLimit` و`chunkMode` و`maxLinesPerMessage`
- البث: `streaming` (الاسم البديل القديم: `streamMode`) و`streaming.preview.toolProgress` و`draftChunk` و`blockStreaming` و`blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` و`retry`
  - يحدد `mediaMaxMb` الحد الأقصى لعمليات الرفع الصادرة إلى Discord (الافتراضي: `100MB`)
- الإجراءات: `actions.*`
- الحالة: `activity` و`status` و`activityType` و`activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings` و`bindings[]` على المستوى الأعلى (`type: "acp"`) و`pluralkit` و`execApprovals` و`intents` و`agentComponents` و`heartbeat` و`responsePrefix`

## السلامة والعمليات

- تعامل مع bot tokens على أنها أسرار (يُفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أقل قدر ممكن من أذونات Discord.
- إذا كانت حالة نشر الأوامر/الحالة قديمة، فأعد تشغيل Gateway ثم أعد التحقق باستخدام `openclaw channels status --probe`.

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [توجيه القناة](/ar/channels/channel-routing)
- [الأمان](/ar/gateway/security)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
