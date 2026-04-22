---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم Discord bot والقدرات والإعدادات
title: Discord
x-i18n:
    generated_at: "2026-04-22T04:20:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613ae39bc4b8c5661cbaab4f70a57af584f296581c3ce54ddaef0feab44e7e42
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

الحالة: جاهز للرسائل الخاصة والقنوات داخل الخوادم عبر بوابة Discord الرسمية.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل الخاصة في Discord وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيص عبر القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد يتضمن bot، وإضافة bot إلى خادمك، ثم إقرانه مع OpenClaw. نوصي بإضافة bot إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [فأنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وbot">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. سمّه باسم مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تستخدمه لوكيل OpenClaw الخاص بك.

  </Step>

  <Step title="تفعيل intents ذات الامتيازات">
    وأنت لا تزال في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح الخاصة بالأدوار ولمطابقة الاسم بالمعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحالة)

  </Step>

  <Step title="نسخ token الخاص بـ bot">
    مرّر مجددًا إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، فهذا ينشئ أول token لك — ولا تتم هنا إعادة "تعيين" أي شيء.
    </Note>

    انسخ token واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة bot إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة مع الأذونات الصحيحة لإضافة bot إلى خادمك.

    مرّر لأسفل إلى **OAuth2 URL Generator** وفعّل:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** بالأسفل. فعّل:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (اختياري)

    انسخ عنوان URL الذي تم إنشاؤه في الأسفل، والصقه في المتصفح، وحدد خادمك، ثم انقر **Continue** للاتصال. يجب أن ترى الآن bot الخاص بك داخل خادم Discord.

  </Step>

  <Step title="تفعيل Developer Mode وجمع المعرّفات الخاصة بك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل Developer Mode حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجوار صورتك الرمزية) ← **Advanced** ← فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي ← **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** ← **Copy User ID**

    احفظ **Server ID** و**User ID** مع Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الاقتران، يجب أن يسمح Discord لـ bot الخاص بك بإرسال رسالة خاصة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** ← **Privacy Settings** ← فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك bots) إرسال رسائل خاصة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام الرسائل الخاصة في Discord مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، فيمكنك تعطيل الرسائل الخاصة بعد الاقتران.

  </Step>

  <Step title="تعيين token الخاص بـ bot بشكل آمن (لا ترسله في الدردشة)">
    token الخاص بـ Discord bot هو سر (مثل كلمة المرور). عيّنه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو عبر إيقاف عملية `openclaw gateway run` ثم تشغيلها من جديد.

  </Step>

  <Step title="تهيئة OpenClaw والاقتران">

    <Tabs>
      <Tab title="اطلب من وكيلك">
        تحدّث مع وكيل OpenClaw الخاص بك على أي قناة موجودة بالفعل (مثل Telegram) وأخبره بذلك. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد قمت بالفعل بتعيين Discord bot token في config. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضّل config قائمًا على الملفات، فاضبط:

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

        الاحتياط من env للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        قيم `token` النصية الصريحة مدعومة. كما أن قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر مزودي env/file/exec. راجع [Secrets Management](/ar/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="الموافقة على أول اقتران عبر الرسائل الخاصة">
    انتظر حتى تعمل Gateway، ثم أرسل رسالة خاصة إلى bot الخاص بك في Discord. سيرد عليك برمز اقتران.

    <Tabs>
      <Tab title="اطلب من وكيلك">
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

    يجب أن تتمكن الآن من التحدث مع وكيلك في Discord عبر الرسائل الخاصة.

  </Step>
</Steps>

<Note>
يتم حلّ token مع مراعاة الحساب. تكون قيم token في config لها الأولوية على الاحتياط من env. لا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
بالنسبة إلى الاستدعاءات الصادرة المتقدمة (أفعال أداة/قناة الرسائل)، يتم استخدام `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (على سبيل المثال read/search/fetch/thread/pins/permissions). تظل إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
</Note>

## موصى به: إعداد مساحة عمل على خادم

بمجرد أن تعمل الرسائل الخاصة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة بحيث تحصل كل قناة على جلسة وكيل خاصة بها وبسياقها الخاص. يوصى بهذا للخوادم الخاصة التي تقتصر عليك وعلى bot الخاص بك.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح الخاصة بالخوادم">
    يتيح ذلك لوكيلك الرد في أي قناة على خادمك، وليس فقط في الرسائل الخاصة.

    <Tabs>
      <Tab title="اطلب من وكيلك">
        > "أضف Server ID الخاص بـ Discord لديّ `<server_id>` إلى قائمة السماح الخاصة بالخوادم"
      </Tab>
      <Tab title="Config">

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
    بشكل افتراضي، لا يرد وكيلك في قنوات الخادم إلا عند الإشارة إليه بـ @mention. بالنسبة إلى خادم خاص، غالبًا ستريد منه أن يرد على كل رسالة.

    <Tabs>
      <Tab title="اطلب من وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى @mentioned"
      </Tab>
      <Tab title="Config">
        اضبط `requireMention: false` في config الخاص بالخادم:

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
    بشكل افتراضي، يتم تحميل الذاكرة طويلة الأمد (`MEMORY.md`) فقط في جلسات الرسائل الخاصة. لا يتم تحميل `MEMORY.md` تلقائيًا في قنوات الخادم.

    <Tabs>
      <Tab title="اطلب من وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا احتجت إلى سياق طويل الأمد من `MEMORY.md`."
      </Tab>
      <Tab title="يدوي">
        إذا كنت بحاجة إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (إذ يتم حقنهما في كل جلسة). واحتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord الخاص بك وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلسة معزولة خاصة بها — لذلك يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- تتولى Gateway اتصال Discord.
- توجيه الردود حتمي: الرسائل الواردة من Discord يعود الرد عليها إلى Discord.
- بشكل افتراضي (`session.dmScope=main`)، تشترك المحادثات المباشرة في الجلسة الرئيسية للوكيل (`agent:main:main`).
- قنوات الخادم هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل الرسائل الخاصة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord إلا المنشورات ضمن سلاسل المحادثات. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة محادثة تلقائيًا. يستخدم عنوان السلسلة أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة محادثة مباشرة. لا تمرر `--message-id` لقنوات المنتدى.

مثال: الإرسال إلى أصل المنتدى لإنشاء سلسلة محادثة

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء سلسلة محادثة في المنتدى بشكل صريح

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتدى مكوّنات Discord. إذا كنت بحاجة إلى مكوّنات، فأرسل إلى سلسلة المحادثة نفسها (`channel:<threadId>`).

## المكوّنات التفاعلية

يدعم OpenClaw حاويات Discord components v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. يتم توجيه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string`, `user`, `role`, `mentionable`, `channel`

بشكل افتراضي، تكون المكوّنات للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والقوائم والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` لذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا مرئيًا لهم فقط.

يفتح الأمران `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قائمتَي provider وmodel المنسدلتين بالإضافة إلى خطوة Submit. يكون رد المنتقي مؤقتًا ومرئيًا فقط للمستخدم الذي استدعاه، ولا يمكن استخدامه إلا من قبله.

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
        { type: "text", label: "مقدم الطلب" },
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
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل الخاصة (القديم: `channels.discord.dm.policy`):

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.discord.allowFrom` القيمة `"*"`؛ القديم: `channels.discord.dm.allowFrom`)
    - `disabled`

    إذا لم تكن سياسة الرسائل الخاصة مفتوحة، فسيتم حظر المستخدمين غير المعروفين (أو مطالبتهم بالاقتران في وضع `pairing`).

    أولوية تعدد الحسابات:

    - تنطبق `channels.discord.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    تنسيق هدف الرسائل الخاصة للتسليم:

    - `user:<id>`
    - الإشارة `<@id>`

    تكون المعرّفات الرقمية المجردة ملتبسة ويتم رفضها ما لم يتم توفير نوع هدف صريح للمستخدم/القناة.

  </Tab>

  <Tab title="سياسة الخادم">
    يتم التحكم في التعامل مع الخادم بواسطة `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسلين: `users` (يُنصح باستخدام معرّفات ثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم إعداد أي منهما، فيُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق طارئ
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرّفات أكثر أمانًا؛ ويحذّر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان لدى خادم ما `channels` مهيأة، فسيتم رفض القنوات غير المدرجة
    - إذا لم يكن لدى الخادم كتلة `channels`، فستُسمح جميع القنوات في ذلك الخادم المدرج في قائمة السماح

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

    إذا قمت فقط بتعيين `DISCORD_BOT_TOKEN` ولم تُنشئ كتلة `channels.discord`، فسيكون الاحتياط في وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` تساوي `open`.

  </Tab>

  <Tab title="الإشارات والرسائل الخاصة الجماعية">
    تكون رسائل الخادم مقيّدة بالإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة ما يلي:

    - إشارة صريحة إلى bot
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، مع احتياط `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على bot في الحالات المدعومة

    يتم إعداد `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يقوم `ignoreOtherMentions` اختياريًا بإسقاط الرسائل التي تشير إلى مستخدم/دور آخر ولكن ليس إلى bot (باستثناء @everyone/@here).

    الرسائل الخاصة الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو slugs)

  </Tab>
</Tabs>

### التوجيه إلى الوكلاء استنادًا إلى الدور

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل عمليات الربط القائمة على الدور معرّفات الأدوار فقط، ويتم تقييمها بعد عمليات الربط النظيرة أو النظير الأصل وقبل عمليات الربط الخاصة بالخادم فقط. إذا كان الربط يعيّن أيضًا حقول مطابقة أخرى (على سبيل المثال `peer` + `guildId` + `roles`) فيجب أن تتطابق جميع الحقول المهيأة.

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

  <Accordion title="intents ذات الامتيازات">
    في **Bot -> Privileged Gateway Intents**، فعّل:

    - Message Content Intent
    - Server Members Intent (موصى به)

    Intent الحالة اختياري ومطلوب فقط إذا كنت تريد تلقي تحديثات الحالة. لا يتطلب تعيين حالة bot (`setPresence`) تفعيل تحديثات الحالة للأعضاء.

  </Accordion>

  <Accordion title="نطاقات OAuth والأذونات الأساسية">
    مُولّد عنوان URL لـ OAuth:

    - النطاقات: `bot`, `applications.commands`

    الأذونات الأساسية المعتادة:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (اختياري)

    تجنب `Administrator` ما لم تكن هناك حاجة صريحة إليه.

  </Accordion>

  <Accordion title="نسخ المعرّفات">
    فعّل Discord Developer Mode، ثم انسخ:

    - معرّف الخادم
    - معرّف القناة
    - معرّف المستخدم

    يُفضّل استخدام المعرّفات الرقمية في config الخاص بـ OpenClaw للحصول على تدقيقات وفحوصات أكثر موثوقية.

  </Accordion>
</AccordionGroup>

## الأوامر الأصلية ومصادقة الأوامر

- القيمة الافتراضية لـ `commands.native` هي `"auto"` وهي مفعلة لـ Discord.
- تجاوز خاص بكل قناة: `channels.discord.commands.native`.
- يقوم `commands.native=false` بمسح أوامر Discord الأصلية المسجّلة سابقًا بشكل صريح.
- تستخدم مصادقة الأوامر الأصلية نفس قوائم السماح/السياسات الخاصة بـ Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ لكن التنفيذ يظل يفرض مصادقة OpenClaw ويُرجع "غير مصرح".

راجع [Slash commands](/ar/tools/slash-commands) للاطلاع على فهرس الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزات

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الردود في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم بذلك بواسطة `channels.discord.replyToMode`:

    - `off` (الافتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يؤدي `off` إلى تعطيل تسلسل الردود الضمني. ومع ذلك، لا تزال وسوم `[[reply_to_*]]` الصريحة مُحترمة.
    يقوم `first` دائمًا بإرفاق مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة في هذا الدور.
    يقوم `batched` بإرفاق مرجع الرد الأصلي الضمني الخاص بـ Discord فقط عندما
    يكون الدور الوارد عبارة عن دفعة مؤجلة من عدة رسائل. وهذا مفيد
    عندما تريد الردود الأصلية أساسًا للمحادثات السريعة والملتبسة، وليس لكل
    دور من رسالة واحدة.

    يتم إظهار معرّفات الرسائل في السياق/السجل حتى يتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث الردود الأولية عبر إرسال رسالة مؤقتة وتحريرها مع وصول النص.

    - يتحكم `channels.discord.streaming` في بث المعاينة (`off` | `partial` | `block` | `progress`، الافتراضي: `off`).
    - يبقى الافتراضي `off` لأن تعديلات معاينة Discord قد تصطدم بحدود المعدل بسرعة، خصوصًا عندما تتشارك عدة bots أو Gateways الحساب نفسه أو حركة مرور الخادم نفسه.
    - القيمة `progress` مقبولة للحفاظ على الاتساق عبر القنوات، ويتم ربطها بـ `partial` في Discord.
    - `channels.discord.streamMode` اسم بديل قديم ويتم ترحيله تلقائيًا.
    - يقوم `partial` بتحرير رسالة معاينة واحدة مع وصول الرموز.
    - يقوم `block` بإخراج أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الانقسام).
    - تؤدي الردود الإعلامية، وردود الأخطاء، والردود النهائية الصريحة إلى إلغاء تعديلات المعاينة المعلقة من دون تفريغ مسودة مؤقتة قبل التسليم العادي.
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأداة/التقدم ستعيد استخدام رسالة معاينة المسودة نفسها (الافتراضي: `true`). اضبطه على `false` للاحتفاظ برسائل أداة/تقدم منفصلة.

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

    الإعدادات الافتراضية لتجزئة وضع `block` (مقيدة إلى `channels.discord.textChunkLimit`):

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

    بث المعاينة نصّي فقط؛ أما ردود الوسائط فتعود إلى التسليم العادي.

    ملاحظة: بث المعاينة منفصل عن البث على شكل كتل. عند تفعيل
    البث على شكل كتل صراحةً لـ Discord، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك سلاسل المحادثات">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الاحتياط: `messages.groupChat.historyLimit`
    - القيمة `0` تعطل الميزة

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك سلاسل المحادثات:

    - يتم توجيه سلاسل محادثات Discord كجلسات قنوات
    - يمكن استخدام بيانات السلسلة الأصلية الوصفية للربط مع الجلسة الأصل
    - يرث config الخاص بالسلسلة config القناة الأصل ما لم توجد إدخالة خاصة بالسلسلة

    يتم حقن موضوعات القنوات كسياق **غير موثوق** (وليس كموجّه نظام).
    يظل سياق الردود والرسائل المقتبسة حاليًا كما تم استلامه.
    تعمل قوائم السماح في Discord أساسًا كبوابة تحدد من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بسلاسل المحادثات للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة محادثة بهدف جلسة بحيث تستمر الرسائل اللاحقة في تلك السلسلة بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة ربط السلسلة الحالية
    - `/agents` عرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` فحص/تحديث إلغاء التركيز التلقائي بسبب عدم النشاط لعمليات الربط المركزة
    - `/session max-age <duration|off>` فحص/تحديث الحد الأقصى الصارم للعمر لعمليات الربط المركزة

    Config:

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

    - يعيّن `session.threadBindings.*` الإعدادات الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يجب أن تكون `spawnSubagentSessions` مساوية لـ true لإنشاء/ربط السلاسل تلقائيًا لـ `sessions_spawn({ thread: true })`.
    - يجب أن تكون `spawnAcpSessions` مساوية لـ true لإنشاء/ربط السلاسل تلقائيًا لـ ACP (`/acp spawn ... --thread ...` أو `sessions_spawn({ runtime: "acp", thread: true })`).
    - إذا كانت عمليات ربط السلاسل معطلة لحساب ما، فلن تكون `/focus` وعمليات ربط السلاسل ذات الصلة متاحة.

    راجع [Sub-agents](/ar/tools/subagents) و[ACP Agents](/ar/tools/acp-agents) و[Configuration Reference](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="عمليات ربط قنوات ACP الدائمة">
    لمساحات عمل ACP المستقرة و"الدائمة التشغيل"، قم بتهيئة عمليات ربط ACP مكتوبة من المستوى الأعلى تستهدف محادثات Discord.

    مسار Config:

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

    - يقوم `/acp spawn codex --bind here` بربط قناة Discord الحالية أو سلسلة المحادثة الحالية في مكانها ويحافظ على توجيه الرسائل المستقبلية إلى جلسة ACP نفسها.
    - قد يعني ذلك أيضًا "بدء جلسة Codex ACP جديدة"، لكنه لا ينشئ سلسلة محادثة جديدة في Discord بحد ذاته. تبقى القناة الحالية هي واجهة الدردشة.
    - قد يظل Codex يعمل ضمن `cwd` الخاص به أو ضمن مساحة عمل backend الخاصة به على القرص. مساحة العمل هذه هي حالة وقت تشغيل، وليست سلسلة محادثة في Discord.
    - يمكن لرسائل سلاسل المحادثات أن ترث ربط ACP الخاص بالقناة الأصل.
    - في قناة أو سلسلة محادثة مرتبطة، يعيد `/new` و`/reset` تعيين جلسة ACP نفسها في مكانها.
    - لا تزال عمليات ربط سلاسل المحادثات المؤقتة تعمل ويمكنها تجاوز تحديد الهدف أثناء نشاطها.
    - تكون `spawnAcpSessions` مطلوبة فقط عندما يحتاج OpenClaw إلى إنشاء/ربط سلسلة محادثة فرعية عبر `--thread auto|here`. وهي غير مطلوبة لأجل `/acp spawn ... --bind here` في القناة الحالية.

    راجع [ACP Agents](/ar/tools/acp-agents) للاطلاع على تفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    وضع إشعارات التفاعلات لكل خادم:

    - `off`
    - `own` (الافتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    يتم تحويل أحداث التفاعل إلى أحداث نظام وإرفاقها بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="تفاعلات التأكيد">
    يرسل `ackReaction` رمزًا تعبيريًا للتأكيد بينما يعالج OpenClaw رسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - احتياط الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحدة unicode أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات Config">
    تكون كتابات config التي تبدأ من القناة مفعلة افتراضيًا.

    يؤثر ذلك في تدفقات `/config set|unset` (عند تفعيل ميزات الأوامر).

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
    وجّه حركة مرور WebSocket الخاصة بـ Discord gateway وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    فعّل حل PluralKit لربط الرسائل الممرّرة عبر الوكيل بهوية عضو النظام:

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
    - تتم مطابقة أسماء العرض الخاصة بالأعضاء حسب الاسم/slug فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلية وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، فسيتم التعامل مع الرسائل الممرّرة عبر الوكيل على أنها رسائل bot وسيتم إسقاطها ما لم تكن `allowBots=true`

  </Accordion>

  <Accordion title="تهيئة الحالة">
    يتم تطبيق تحديثات الحالة عندما تقوم بتعيين حقل حالة أو نشاط، أو عند تفعيل الحالة التلقائية.

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
      activity: "وقت التركيز",
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
    - 4: Custom (يستخدم نص النشاط كحالة؛ والرمز التعبيري اختياري)
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
        exhaustedText: "تم استهلاك token",
      },
    },
  },
}
```

    تربط الحالة التلقائية مدى توفر وقت التشغيل بحالة Discord: healthy => online، وdegraded أو unknown => idle، وexhausted أو unavailable => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المستندة إلى الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار Config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يستخدم الاحتياط `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    يقوم Discord بتفعيل موافقات exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويكون بالإمكان حل مُوافِق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord الموافقين على exec من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord كعميل موافقة أصلي بشكل صريح.

    عندما تكون `target` مساوية لـ `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. لا يمكن إلا للموافقين الذين تم حلهم استخدام الأزرار؛ أما المستخدمون الآخرون فيتلقون رفضًا مؤقتًا مرئيًا لهم فقط. تتضمن مطالبات الموافقة نص الأمر، لذا لا تفعّل التسليم عبر القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة المستخدمة من قنوات الدردشة الأخرى. يضيف المهايئ الأصلي لـ Discord أساسًا توجيه الرسائل الخاصة للموافقين والتوزيع إلى القنوات.
    عندما تكون هذه الأزرار موجودة، فإنها تشكل تجربة المستخدم الأساسية للموافقة؛ ويجب على OpenClaw
    أن يتضمن أمر `/approve` اليدوي فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    تستخدم مصادقة Gateway لهذا المعالج نفس عقد حل بيانات الاعتماد المشتركة الذي تستخدمه بقية عملاء Gateway:

    - مصادقة محلية تبدأ من env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` ثم `gateway.auth.*`)
    - في الوضع المحلي، يمكن استخدام `gateway.remote.*` كاحتياط فقط عندما لا تكون `gateway.auth.*` مضبوطة؛ وتفشل SecretRef المحلية المضبوطة ولكن غير المحلولة بشكل مغلق
    - دعم الوضع البعيد عبر `gateway.remote.*` عند الاقتضاء
    - تكون تجاوزات URL آمنة بالنسبة للتجاوز: لا تعيد تجاوزات CLI استخدام بيانات الاعتماد الضمنية، وتستخدم تجاوزات env بيانات اعتماد env فقط

    سلوك حل الموافقة:

    - يتم حل المعرّفات التي تبدأ بـ `plugin:` عبر `plugin.approval.resolve`.
    - يتم حل المعرّفات الأخرى عبر `exec.approval.resolve`.
    - لا يقوم Discord هنا بقفزة احتياط إضافية من exec إلى plugin؛ فبادئة
      المعرّف هي التي تحدد طريقة Gateway التي سيستدعيها.

    تنتهي صلاحية موافقات Exec بعد 30 دقيقة افتراضيًا. إذا فشلت الموافقات مع
    معرّفات موافقة غير معروفة، فتحقق من حل الموافقين، وتفعيل الميزة، و
    من أن نوع معرّف الموافقة الذي تم تسليمه يطابق الطلب المعلّق.

    المستندات ذات الصلة: [Exec approvals](/ar/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord إجراءات المراسلة، وإدارة القنوات، والإشراف، والحالة، وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- التفاعلات: `react`, `reactions`, `emojiList`
- الإشراف: `timeout`, `kick`, `ban`
- الحالة: `setPresence`

يقبل الإجراء `event-create` وسيط `image` اختياريًا (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                        | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل     |
| roles                                                                                                                                                                    | معطّل     |
| moderation                                                                                                                                                               | معطّل     |
| presence                                                                                                                                                                 | معطّل     |

## واجهة Components v2

يستخدم OpenClaw Discord components v2 لموافقات exec وعلامات السياق المتقاطع. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ ويتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما لا تزال `embeds` القديمة متاحة ولكن لا يُنصح بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم بواسطة حاويات مكوّنات Discord (hex).
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

## القنوات الصوتية

يمكن لـ OpenClaw الانضمام إلى قنوات Discord الصوتية لإجراء محادثات فورية ومستمرة. وهذا منفصل عن مرفقات الرسائل الصوتية.

المتطلبات:

- فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
- قم بتهيئة `channels.discord.voice`.
- يحتاج bot إلى أذونات Connect وSpeak في القناة الصوتية المستهدفة.

استخدم أمر Discord الأصلي فقط `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع قواعد قائمة السماح وسياسة المجموعة نفسها مثل أوامر Discord الأخرى.

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

- يتجاوز `voice.tts` قيمة `messages.tts` لتشغيل الصوت فقط.
- تستمد أدوار مالك نوبات النسخ الصوتي من Discord `allowFrom` (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصصة للمالك فقط (مثل `gateway` و`cron`).
- يكون الصوت مفعّلًا افتراضيًا؛ اضبط `channels.discord.voice.enabled=false` لتعطيله.
- يتم تمرير `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- تكون القيم الافتراضية في `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم يتم ضبطها.
- يراقب OpenClaw أيضًا حالات فشل فك التشفير أثناء الاستقبال ويجري استردادًا تلقائيًا عبر مغادرة القناة الصوتية ثم إعادة الانضمام إليها بعد تكرار حالات الفشل خلال نافذة زمنية قصيرة.
- إذا كانت سجلات الاستقبال تعرض بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`، فقد تكون هذه هي مشكلة الاستقبال في `@discordjs/voice` من المنبع والمتعقبة في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## الرسائل الصوتية

تعرض الرسائل الصوتية في Discord معاينة للشكل الموجي وتتطلب صوت OGG/Opus بالإضافة إلى بيانات وصفية. يُنشئ OpenClaw الشكل الموجي تلقائيًا، لكنه يحتاج إلى توفر `ffmpeg` و`ffprobe` على مضيف Gateway لفحص الملفات الصوتية وتحويلها.

المتطلبات والقيود:

- وفّر **مسار ملف محلي** (يتم رفض عناوين URL).
- احذف المحتوى النصي (لا يسمح Discord بالنص + الرسالة الصوتية في الحمولة نفسها).
- يتم قبول أي تنسيق صوتي؛ ويحوّل OpenClaw الملف إلى OGG/Opus عند الحاجة.

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

  <Accordion title="حظر رسائل الخادم بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة السماح الخاصة بالخادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالخادم موجودة، فلا يُسمح إلا بالقنوات المدرجة
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="القيمة require mention false ولكن لا يزال هناك حظر">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` بدون قائمة سماح مطابقة للخادم/القناة
    - تم إعداد `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو ضمن إدخال القناة)
    - تم حظر المرسل بواسطة قائمة السماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="تنتهي مهلة المعالجات طويلة التشغيل أو تتكرر الردود">

    السجلات المعتادة:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    عنصر ضبط ميزانية المستمع:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - عدة حسابات: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    عنصر ضبط مهلة تشغيل العامل:

    - حساب واحد: `channels.discord.inboundWorker.runTimeoutMs`
    - عدة حسابات: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - الافتراضي: `1800000` (30 دقيقة)؛ اضبطه على `0` لتعطيله

    الخط الأساسي الموصى به:

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
    فقط إذا كنت تريد صمام أمان منفصلًا لنوبات الوكيل الموضوعة في قائمة الانتظار.

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    لا تعمل فحوصات الأذونات في `channels status --probe` إلا مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد يظل التطابق في وقت التشغيل يعمل، لكن الفحص لا يمكنه التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - الرسائل الخاصة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل الخاصة معطلة: `channels.discord.dmPolicy="disabled"` (القديم: `channels.discord.dm.policy`)
    - انتظار الموافقة على الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات bot إلى bot">
    يتم تجاهل الرسائل التي يكتبها bot افتراضيًا.

    إذا قمت بتعيين `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارات وقائمة السماح لتجنب سلوك الحلقات.
    يُفضّل `channels.discord.allowBots="mentions"` لقبول رسائل bot التي تشير إلى bot فقط.

  </Accordion>

  <Accordion title="انقطاع STT الصوتي مع DecryptionFailed(...)">

    - حافظ على تحديث OpenClaw (`openclaw update`) حتى يكون منطق استرداد استقبال صوت Discord موجودًا
    - أكّد أن `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (الافتراضي من المنبع) واضبطه فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت حالات الفشل بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها مع [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## مؤشرات مرجعية للإعدادات

المرجع الأساسي:

- [المرجع الخاص بالإعدادات - Discord](/ar/gateway/configuration-reference#discord)

حقول Discord عالية الأهمية:

- بدء التشغيل/المصادقة: `enabled`، `token`، `accounts.*`، `allowBots`
- السياسة: `groupPolicy`، `dm.*`، `guilds.*`، `guilds.*.channels.*`
- الأوامر: `commands.native`، `commands.useAccessGroups`، `configWrites`، `slashCommand.*`
- قائمة انتظار الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`، `eventQueue.maxConcurrency`
- العامل الوارد: `inboundWorker.runTimeoutMs`
- الرد/السجل: `replyToMode`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
- التسليم: `textChunkLimit`، `chunkMode`، `maxLinesPerMessage`
- البث: `streaming` (الاسم البديل القديم: `streamMode`)، `streaming.preview.toolProgress`، `draftChunk`، `blockStreaming`، `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb`، `retry`
  - يحدد `mediaMaxMb` حدًا أقصى للتحميلات الصادرة إلى Discord (الافتراضي: `100MB`)
- الإجراءات: `actions.*`
- الحالة: `activity`، `status`، `activityType`، `activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`، `bindings[]` من المستوى الأعلى (`type: "acp"`)، `pluralkit`، `execApprovals`، `intents`، `agentComponents`، `heartbeat`، `responsePrefix`

## السلامة والعمليات

- تعامل مع bot tokens على أنها أسرار (يُفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord وفق أقل قدر من الامتيازات.
- إذا كانت حالة/نشر الأوامر قديمة، فأعد تشغيل Gateway وأعد التحقق باستخدام `openclaw channels status --probe`.

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [الأمان](/ar/gateway/security)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
- [Slash commands](/ar/tools/slash-commands)
