---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم Discord bot وإمكاناته وإعداده
title: Discord
x-i18n:
    generated_at: "2026-04-23T07:18:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0bee2c419651701f7ab57e46a4c0c473c83596eb9bd2156bac3c6117513236ab
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

الحالة: جاهز للرسائل الخاصة وقنوات الخوادم عبر بوابة Discord الرسمية.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل الخاصة في Discord وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وكتالوج الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيصات عبر القنوات وتدفق الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد يتضمن bot، وإضافة bot إلى خادمك، ثم إقرانه مع OpenClaw. نوصي بإضافة bot إلى خادمك الخاص. إذا لم يكن لديك واحد بعد، [فأنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وbot">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. امنحه اسمًا مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw الخاص بك.

  </Step>

  <Step title="تمكين الامتيازات الخاصة">
    وأنت لا تزال في صفحة **Bot**، مرر لأسفل إلى **Privileged Gateway Intents** وقم بتمكين ما يلي:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ ومطلوب لقوائم السماح الخاصة بالأدوار ولمطابقة الأسماء مع المعرّفات)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحالة)

  </Step>

  <Step title="نسخ رمز bot المميز">
    مرر للأعلى مرة أخرى في صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، فإن هذا يُنشئ أول رمز مميز لك — لا تتم «إعادة تعيين» أي شيء.
    </Note>

    انسخ الرمز المميز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء رابط دعوة وإضافة bot إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ رابط دعوة بالأذونات الصحيحة لإضافة bot إلى خادمك.

    مرر لأسفل إلى **OAuth2 URL Generator** وقم بتمكين:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** أدناه. قم بتمكين ما يلي على الأقل:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختياري)

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك تدفقات عمل قنوات المنتدى أو الوسائط التي تُنشئ سلسلة أو تتابعها، فقم أيضًا بتمكين **Send Messages in Threads**.
    انسخ الرابط الذي تم إنشاؤه في الأسفل، والصقه في المتصفح، وحدد خادمك، ثم انقر **Continue** للاتصال. ينبغي الآن أن ترى bot الخاص بك في خادم Discord.

  </Step>

  <Step title="تمكين وضع المطوّر وجمع المعرّفات الخاصة بك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تمكين وضع المطوّر حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجوار صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** بجانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الاقتران، يجب أن يسمح Discord لـ bot بإرسال رسالة خاصة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك bots) إرسال رسائل خاصة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام الرسائل الخاصة في Discord مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، فيمكنك تعطيل الرسائل الخاصة بعد الاقتران.

  </Step>

  <Step title="تعيين رمز bot المميز بأمان (لا ترسله في الدردشة)">
    إن رمز Discord bot المميز سرّي (مثل كلمة المرور). عيّنه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو عن طريق إيقاف عملية `openclaw gateway run` ثم تشغيلها مجددًا.

  </Step>

  <Step title="إعداد OpenClaw والاقتران">

    <Tabs>
      <Tab title="اطلب من وكيلك">
        تحدّث مع وكيل OpenClaw الخاص بك على أي قناة موجودة بالفعل (مثل Telegram) وأخبره بذلك. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد قمت بالفعل بتعيين رمز Discord bot المميز في الإعدادات. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / الإعدادات">
        إذا كنت تفضّل الإعداد المعتمد على الملفات، فاضبط ما يلي:

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

        الاحتياط إلى متغير البيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        قيم `token` النصية الصريحة مدعومة. كما أن قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر مزودي env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="الموافقة على أول اقتران عبر الرسائل الخاصة">
    انتظر حتى تعمل Gateway، ثم أرسل رسالة خاصة إلى bot في Discord. سيرد برمز اقتران.

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

    ينبغي الآن أن تتمكن من الدردشة مع وكيلك في Discord عبر الرسائل الخاصة.

  </Step>
</Steps>

<Note>
يعتمد حلّ الرمز المميز على الحساب. قيم الرمز المميز في الإعدادات تتغلب على الاحتياط إلى متغيرات البيئة. لا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
بالنسبة إلى الاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القنوات)، يتم استخدام `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال وإجراءات القراءة/الفحص مثل read/search/fetch/thread/pins/permissions. ولا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بمجرد أن تعمل الرسائل الخاصة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يُوصى بذلك للخوادم الخاصة التي تكون بينك وبين bot فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة سماح الخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس في الرسائل الخاصة فقط.

    <Tabs>
      <Tab title="اطلب من وكيلك">
        > "أضف Server ID الخاص بي في Discord وهو `<server_id>` إلى قائمة سماح الخوادم"
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
    افتراضيًا، لا يرد وكيلك في قنوات الخوادم إلا عند الإشارة إليه باستخدام @mention. بالنسبة إلى خادم خاص، ستحتاج على الأرجح إلى أن يرد على كل رسالة.

    <Tabs>
      <Tab title="اطلب من وكيلك">
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

  <Step title="التخطيط للذاكرة في قنوات الخادم">
    افتراضيًا، يتم تحميل الذاكرة طويلة الأمد (`MEMORY.md`) فقط في جلسات الرسائل الخاصة. لا تقوم قنوات الخادم بتحميل `MEMORY.md` تلقائيًا.

    <Tabs>
      <Tab title="اطلب من وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت بحاجة إلى سياق طويل الأمد من `MEMORY.md`."
      </Tab>
      <Tab title="يدوي">
        إذا كنت بحاجة إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنهما في كل جلسة). واحتفظ بالملاحظات طويلة الأمد في `MEMORY.md`، واطلبها عند الحاجة باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord الخاص بك وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلسة معزولة خاصة بها — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- تتولى Gateway اتصال Discord.
- توجيه الردود حتمي: الرسائل الواردة من Discord يعود الرد عليها إلى Discord.
- افتراضيًا (`session.dmScope=main`)، تشارك الدردشات المباشرة الجلسة الرئيسية للوكيل (`agent:main:main`).
- تكون قنوات الخادم مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل الرسائل الخاصة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في تمرير `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord إلا المشاركات ضمن السلاسل. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة تلقائيًا. يستخدم عنوان السلسلة أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة مباشرة. لا تمرر `--message-id` لقنوات المنتدى.

مثال: الإرسال إلى أصل المنتدى لإنشاء سلسلة

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "عنوان الموضوع\nنص المشاركة"
```

مثال: إنشاء سلسلة منتدى بشكل صريح

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "عنوان الموضوع" --message "نص المشاركة"
```

لا تقبل أصول المنتديات مكونات Discord. إذا كنت بحاجة إلى مكونات، فأرسل إلى السلسلة نفسها (`channel:<threadId>`).

## المكونات التفاعلية

يدعم OpenClaw حاويات المكونات v2 في Discord لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجَّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord الحالية لـ `replyToMode`.

الكتل المدعومة:

- `text` و`section` و`separator` و`actions` و`media-gallery` و`file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string` و`user` و`role` و`mentionable` و`channel`

افتراضيًا، تكون المكونات للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والقوائم والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو العلامات أو `*`). عند ضبط ذلك، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا مرئيًا لهم فقط.

يفتح الأمران `/model` و`/models` أداة اختيار تفاعلية للنموذج تتضمن قوائم منسدلة لمزود النموذج والنموذج نفسه مع خطوة Submit. ما لم يكن `commands.modelsWrite=false`، يدعم `/models add` أيضًا إضافة إدخال مزود/نموذج جديد من الدردشة، وتظهر النماذج المضافة حديثًا دون إعادة تشغيل Gateway. يكون رد أداة الاختيار مؤقتًا ومرئيًا فقط للمستخدم الذي استدعاه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media` أو `path` أو `filePath` (ملف واحد)؛ واستخدم `media-gallery` لعدة ملفات
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
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل الخاصة (الاسم القديم: `channels.discord.dm.policy`):

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`؛ الاسم القديم: `channels.discord.dm.allowFrom`)
    - `disabled`

    إذا لم تكن سياسة الرسائل الخاصة مفتوحة، فسيتم حظر المستخدمين غير المعروفين (أو مطالبتهم بالاقتران في وضع `pairing`).

    أولوية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا يكون `allowFrom` الخاص بها معيّنًا.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    تنسيق هدف الرسائل الخاصة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    تكون المعرّفات الرقمية المجردة ملتبسة ويتم رفضها ما لم يتم توفير نوع هدف صريح للمستخدم/القناة.

  </Tab>

  <Tab title="سياسة الخادم">
    يتم التحكم في التعامل مع الخوادم عبر `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضَّل `id`، ويُقبل الاسم المختصر)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم إعداد أي منهما، فسيُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق اضطراري
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرّفات أكثر أمانًا؛ ويحذّر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان لدى خادم ما إعداد `channels`، فسيتم رفض القنوات غير المدرجة
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

    إذا قمت فقط بتعيين `DISCORD_BOT_TOKEN` ولم تُنشئ كتلة `channels.discord`، فسيكون احتياط وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كان `channels.defaults.groupPolicy` هو `open`.

  </Tab>

  <Tab title="الإشارات والرسائل الخاصة الجماعية">
    تكون رسائل الخوادم مقيّدة بالإشارة افتراضيًا.

    يشمل اكتشاف الإشارة ما يلي:

    - إشارة صريحة إلى bot
    - أنماط الإشارة المُعدّة (`agents.list[].groupChat.mentionPatterns`، مع احتياط إلى `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على bot في الحالات المدعومة

    يتم إعداد `requireMention` لكل خادم/قناة على حدة (`channels.discord.guilds...`).
    أما `ignoreOtherMentions` فيُسقط اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر ولكن ليس إلى bot (باستثناء @everyone/@here).

    الرسائل الخاصة الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو الأسماء المختصرة)

  </Tab>
</Tabs>

### توجيه الوكيل المستند إلى الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خوادم Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل عمليات الربط المستندة إلى الأدوار معرّفات الأدوار فقط، ويتم تقييمها بعد عمليات الربط peer أو parent-peer وقبل عمليات الربط الخاصة بالخادم فقط. إذا كان الربط يضبط أيضًا حقول مطابقة أخرى (مثل `peer` + `guildId` + `roles`)، فيجب أن تتطابق جميع الحقول المُعدّة.

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
  <Accordion title="إنشاء التطبيق وbot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. انسخ رمز bot المميز

  </Accordion>

  <Accordion title="الامتيازات الخاصة">
    في **Bot -> Privileged Gateway Intents**، قم بتمكين:

    - Message Content Intent
    - Server Members Intent (موصى به)

    امتياز الحالة اختياري ولا يلزم إلا إذا كنت تريد تلقي تحديثات الحالة. لا يتطلب تعيين حالة bot (`setPresence`) تمكين تحديثات الحالة للأعضاء.

  </Accordion>

  <Accordion title="نطاقات OAuth والأذونات الأساسية">
    مولّد رابط OAuth:

    - النطاقات: `bot` و`applications.commands`

    الأذونات الأساسية المعتادة:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختياري)

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك تدفقات عمل قنوات المنتدى أو الوسائط التي تُنشئ سلسلة أو تتابعها، فقم أيضًا بتمكين **Send Messages in Threads**.
    تجنّب `Administrator` ما لم تكن هناك حاجة صريحة إليه.

  </Accordion>

  <Accordion title="نسخ المعرّفات">
    فعّل Discord Developer Mode، ثم انسخ:

    - Server ID
    - Channel ID
    - User ID

    يُفضَّل استخدام المعرّفات الرقمية في إعدادات OpenClaw لإجراء عمليات تدقيق وفحص موثوقة.

  </Accordion>
</AccordionGroup>

## الأوامر الأصلية وتفويض الأوامر

- القيمة الافتراضية لـ `commands.native` هي `"auto"` وهي مفعلة لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى إزالة أوامر Discord الأصلية المسجلة سابقًا بشكل صريح.
- يستخدم تفويض الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المخولين؛ لكن التنفيذ يظل يفرض تفويض OpenClaw ويُرجع "غير مخول".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزات

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ويتم التحكم فيها عبر `channels.discord.replyToMode`:

    - `off` (الافتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يؤدي `off` إلى تعطيل تسلسل الردود الضمني. ولا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.
    يقوم `first` دائمًا بإرفاق مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة في هذا الدور.
    ولا يقوم `batched` بإرفاق مرجع الرد الأصلي الضمني من Discord إلا عندما
    يكون الدور الوارد دفعة مؤجلة تضم رسائل متعددة. ويكون هذا مفيدًا
    عندما تريد الردود الأصلية أساسًا للمحادثات السريعة والملتبسة، وليس لكل
    دور يتضمن رسالة واحدة.

    تظهر معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتحريرها مع وصول النص.

    - يتحكم `channels.discord.streaming` في بث المعاينة (`off` | `partial` | `block` | `progress`، والافتراضي: `off`).
    - يبقى الافتراضي `off` لأن تعديلات المعاينة في Discord قد تصل إلى حدود المعدل بسرعة، خصوصًا عندما تتشارك عدة bots أو Gateways الحساب نفسه أو حركة مرور الخادم نفسها.
    - يتم قبول `progress` لاتساقه عبر القنوات ويجري تعيينه إلى `partial` في Discord.
    - `channels.discord.streamMode` اسم مستعار قديم ويتم ترحيله تلقائيًا.
    - يقوم `partial` بتحرير رسالة معاينة واحدة مع وصول الرموز.
    - يقوم `block` بإخراج مقاطع بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الانقسام).
    - تؤدي الردود الإعلامية والأخطاء والردود الصريحة النهائية إلى إلغاء تعديلات المعاينة المعلقة دون تفريغ مسودة مؤقتة قبل التسليم العادي.
    - يتحكم `streaming.preview.toolProgress` في ما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة مسودة المعاينة نفسها (الافتراضي: `true`). اضبطه على `false` للاحتفاظ برسائل أدوات/تقدم منفصلة.

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

    الإعدادات الافتراضية لتقسيم المقاطع في وضع `block` (مقيّدة بـ `channels.discord.textChunkLimit`):

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

    بث المعاينة مخصص للنص فقط؛ أما الردود الإعلامية فتعود إلى التسليم العادي.

    ملاحظة: بث المعاينة منفصل عن البث القائم على المقاطع. عندما يكون البث القائم على المقاطع مفعّلًا صراحةً
    لـ Discord، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك السلاسل">
    سياق سجل الخادم:

    - `channels.discord.historyLimit` الافتراضي `20`
    - الاحتياط: `messages.groupChat.historyLimit`
    - `0` يعطّل الميزة

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - يتم توجيه سلاسل Discord كجلسات قنوات
    - يمكن استخدام بيانات السلسلة الأصلية للربط بجلسة الأصل
    - يرث إعداد السلسلة إعداد القناة الأصل ما لم يوجد إدخال خاص بالسلسلة
    - يكون توارث السجل من الأصل إلى السلاسل التلقائية المنشأة حديثًا اختياريًا عبر `channels.discord.thread.inheritParent` (الافتراضي `false`). عندما تكون القيمة `false`، تبدأ جلسات سلاسل Discord المنشأة حديثًا معزولة عن سجل القناة الأصلية؛ وعندما تكون `true`، يُستخدم سجل القناة الأصلية كبذرة لجلسة السلسلة الجديدة
    - توجد تجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل الخاصة `user:<id>` بالإضافة إلى أهداف القنوات
    - يتم الحفاظ على `channels.discord.guilds.<guild>.channels.<channel>.requireMention: false` أثناء الاحتياط في مرحلة تفعيل الرد، بحيث تظل القنوات المضبوطة دائمًا قيد التشغيل دائمًا حتى عند تشغيل احتياط مرحلة الرد

    يتم حقن موضوعات القنوات كسياق **غير موثوق** (وليس كـ system prompt).
    ويظل سياق الرد والرسائل المقتبسة حاليًا كما تم استلامه.
    وتعمل قوائم السماح في Discord أساسًا على تقييد من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالسلاسل للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة بهدف جلسة بحيث تستمر الرسائل اللاحقة في تلك السلسلة في التوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` يربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` يزيل ربط السلسلة الحالية
    - `/agents` يعرض عمليات التشغيل النشطة وحالة الربط
    - `/session idle <duration|off>` يفحص/يحدّث إلغاء التركيز التلقائي عند عدم النشاط لعمليات الربط المركّزة
    - `/session max-age <duration|off>` يفحص/يحدّث الحد الأقصى الصلب للعمر لعمليات الربط المركّزة

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

    - يضبط `session.threadBindings.*` القيم الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يجب أن تكون `spawnSubagentSessions` بقيمة true لإنشاء/ربط السلاسل تلقائيًا لـ `sessions_spawn({ thread: true })`.
    - يجب أن تكون `spawnAcpSessions` بقيمة true لإنشاء/ربط السلاسل تلقائيًا لـ ACP (`/acp spawn ... --thread ...` أو `sessions_spawn({ runtime: "acp", thread: true })`).
    - إذا كانت عمليات ربط السلاسل معطلة لحساب ما، فلن تكون `/focus` وعمليات ربط السلاسل ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents) و[وكلاء ACP](/ar/tools/acp-agents) و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="عمليات ربط قنوات ACP الدائمة">
    لمساحات عمل ACP المستقرة «الدائمة التشغيل»، قم بإعداد عمليات ربط ACP مكتوبة على المستوى الأعلى تستهدف محادثات Discord.

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

    - يقوم `/acp spawn codex --bind here` بربط قناة Discord أو السلسلة الحالية في مكانها ويبقي الرسائل المستقبلية موجّهة إلى جلسة ACP نفسها.
    - قد يعني ذلك أيضًا «بدء جلسة Codex ACP جديدة»، لكنه لا ينشئ سلسلة Discord جديدة بحد ذاته. تبقى القناة الحالية هي سطح الدردشة.
    - قد يستمر Codex في العمل ضمن `cwd` الخاص به أو مساحة عمل backend الخاصة به على القرص. مساحة العمل هذه هي حالة وقت تشغيل، وليست سلسلة Discord.
    - يمكن لرسائل السلاسل أن ترث ربط ACP الخاص بالقناة الأصلية.
    - في قناة أو سلسلة مرتبطة، يقوم `/new` و`/reset` بإعادة تعيين جلسة ACP نفسها في مكانها.
    - لا تزال عمليات ربط السلاسل المؤقتة تعمل ويمكنها تجاوز حلّ الهدف أثناء نشاطها.
    - لا تكون `spawnAcpSessions` مطلوبة إلا عندما يحتاج OpenClaw إلى إنشاء/ربط سلسلة فرعية عبر `--thread auto|here`. وهي ليست مطلوبة لـ `/acp spawn ... --bind here` في القناة الحالية.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لمعرفة تفاصيل سلوك الربط.

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

    ترتيب الحلّ:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - الاحتياط إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية Unicode أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    تكون كتابات الإعدادات التي تبدأ من القناة مفعلة افتراضيًا.

    يؤثر هذا في تدفقات `/config set|unset` (عند تمكين ميزات الأوامر).

    التعطيل:

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
    وجّه حركة WebSocket الخاصة ببوابة Discord وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + حلّ قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    قم بتمكين حلّ PluralKit لربط الرسائل المُمرّرة بهوية عضو النظام:

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
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/الاسم المختصر فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل المُمرّرة كرسائل bot ويتم إسقاطها ما لم تكن `allowBots=true`

  </Accordion>

  <Accordion title="إعداد الحالة">
    يتم تطبيق تحديثات الحالة عند تعيين حقل status أو activity، أو عند تمكين auto presence.

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

    مثال على النشاط (custom status هو نوع النشاط الافتراضي):

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
    - 4: Custom (يستخدم نص النشاط كحالة status؛ والرمز التعبيري اختياري)
    - 5: Competing

    مثال على auto presence (إشارة سلامة وقت التشغيل):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "نفد الرمز المميز",
      },
    },
  },
}
```

    تربط auto presence توفر وقت التشغيل بحالة Discord: healthy => online، وdegraded أو unknown => idle، وexhausted أو unavailable => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="عمليات الموافقة في Discord">
    يدعم Discord معالجة الموافقة المستندة إلى الأزرار في الرسائل الخاصة ويمكنه اختياريًا نشر طلبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يحتاط إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter` و`sessionFilter` و`cleanupAfterResolve`

    يقوم Discord بتمكين موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير معيّنة أو `"auto"` ويمكن حلّ معتمِد واحد على الأقل، سواء من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord معتمدي التنفيذ من `allowFrom` الخاص بالقناة، أو `dm.allowFrom` القديم، أو `defaultTo` الخاص بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord كعميل موافقة أصلي بشكل صريح.

    عندما تكون `target` هي `channel` أو `both`، يكون طلب الموافقة مرئيًا في القناة. ولا يمكن إلا للمعتمِدين الذين تم حلّهم استخدام الأزرار؛ أما المستخدمون الآخرون فيتلقون رفضًا مؤقتًا مرئيًا لهم فقط. تتضمن طلبات الموافقة نص الأمر، لذا لا تقم بتمكين التسليم إلى القناة إلا في القنوات الموثوقة. وإذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يحتاط OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة المستخدمة بواسطة قنوات الدردشة الأخرى. يضيف مهايئ Discord الأصلي أساسًا توجيه الرسائل الخاصة للمعتمِدين والتوزيع على القنوات.
    عندما تكون هذه الأزرار موجودة، فهي الواجهة الأساسية للموافقة؛ ويجب على OpenClaw
    أن يضمّن أمر `/approve` اليدوي فقط عندما تشير نتيجة الأداة إلى أن
    موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    يستخدم تفويض Gateway لهذا المعالج عقد حلّ بيانات الاعتماد المشتركة نفسه المستخدم مع عملاء Gateway الآخرين:

    - تفويض محلي يبدأ بـ env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` ثم `gateway.auth.*`)
    - في الوضع المحلي، يمكن استخدام `gateway.remote.*` كاحتياط فقط عندما لا يكون `gateway.auth.*` معيّنًا؛ وتفشل قيم SecretRef المحلية المُعدّة ولكن غير المحلولة بشكل مغلق
    - دعم الوضع البعيد عبر `gateway.remote.*` عند الاقتضاء
    - تكون تجاوزات URL آمنة للتجاوز: تجاوزات CLI لا تعيد استخدام بيانات الاعتماد الضمنية، وتجاوزات env تستخدم بيانات اعتماد env فقط

    سلوك حلّ الموافقة:

    - يتم حلّ المعرّفات المسبوقة بـ `plugin:` عبر `plugin.approval.resolve`.
    - يتم حلّ المعرّفات الأخرى عبر `exec.approval.resolve`.
    - لا يجري Discord هنا قفزة احتياطية إضافية من exec إلى plugin؛ فبادئة
      المعرّف هي التي تحدد طريقة Gateway التي يستدعيها.

    تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا. إذا فشلت الموافقات مع
    معرّفات موافقة غير معروفة، فتحقق من حلّ المعتمِدين وتمكين الميزة
    وأن نوع معرّف الموافقة المُسلَّم يطابق الطلب المعلّق.

    الوثائق ذات الصلة: [موافقات التنفيذ](/ar/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord المراسلة، وإدارة القنوات، والإشراف، والحالة، وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage` و`readMessages` و`editMessage` و`deleteMessage` و`threadReply`
- التفاعلات: `react` و`reactions` و`emojiList`
- الإشراف: `timeout` و`kick` و`ban`
- الحالة: `setPresence`

يقبل الإجراء `event-create` معامل `image` اختياريًا (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات تحت `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                             | الافتراضي |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل     |
| roles                                                                                                                                                                        | معطّل     |
| moderation                                                                                                                                                                   | معطّل     |
| presence                                                                                                                                                                     | معطّل     |

## واجهة Components v2

يستخدم OpenClaw Discord components v2 لموافقات التنفيذ وعلامات السياق المتقاطع. ويمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكونات عبر أداة discord)، بينما لا تزال `embeds` القديمة متاحة ولكن لا يُنصح بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم بواسطة حاويات مكونات Discord (hex).
- اضبطه لكل حساب عبر `channels.discord.accounts.<id>.ui.components.accentColor`.
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

يمكن لـ OpenClaw الانضمام إلى القنوات الصوتية في Discord لإجراء محادثات فورية ومستمرة. وهذا منفصل عن مرفقات الرسائل الصوتية.

المتطلبات:

- قم بتمكين الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
- قم بإعداد `channels.discord.voice`.
- يحتاج bot إلى أذونات Connect وSpeak في القناة الصوتية المستهدفة.

استخدم الأمر الأصلي الخاص بـ Discord فقط `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع قواعد قائمة السماح وسياسة المجموعة نفسها مثل أوامر Discord الأخرى.

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

- يتجاوز `voice.tts` القيمة `messages.tts` لتشغيل الصوت فقط.
- تستمد أدوار الملكية في مقاطع التفريغ الصوتي من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصصة للمالكين فقط (مثل `gateway` و`cron`).
- تكون الميزة الصوتية مفعلة افتراضيًا؛ اضبط `channels.discord.voice.enabled=false` لتعطيلها.
- يتم تمرير `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- القيم الافتراضية في `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم يتم تعيينهما.
- يراقب OpenClaw أيضًا حالات فشل فك التشفير عند الاستقبال ويستعيد الحالة تلقائيًا عبر مغادرة القناة الصوتية وإعادة الانضمام إليها بعد تكرار حالات الفشل خلال نافذة زمنية قصيرة.
- إذا كانت سجلات الاستقبال تعرض بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`، فقد يكون هذا هو خلل الاستقبال في `@discordjs/voice` من المصدر العلوي والمتعقب في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## الرسائل الصوتية

تعرض الرسائل الصوتية في Discord معاينة لشكل الموجة وتتطلب صوت OGG/Opus بالإضافة إلى بيانات وصفية. ينشئ OpenClaw شكل الموجة تلقائيًا، لكنه يحتاج إلى توفر `ffmpeg` و`ffprobe` على مضيف Gateway لفحص ملفات الصوت وتحويلها.

المتطلبات والقيود:

- قدّم **مسار ملف محلي** (يتم رفض عناوين URL).
- احذف محتوى النص (لا يسمح Discord بالنص + الرسالة الصوتية في الحمولة نفسها).
- يتم قبول أي تنسيق صوتي؛ ويحوّل OpenClaw الملف إلى OGG/Opus عند الحاجة.

مثال:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تم استخدام امتيازات غير مسموح بها أو أن bot لا يرى رسائل الخوادم">

    - قم بتمكين Message Content Intent
    - قم بتمكين Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير الامتيازات

  </Accordion>

  <Accordion title="يتم حظر رسائل الخوادم بشكل غير متوقع">

    - تحقق من `groupPolicy`
    - تحقق من قائمة سماح الخوادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` للخادم موجودة، فلن يُسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="تم ضبط require mention على false ولكن لا يزال الحظر قائمًا">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` بدون قائمة سماح مطابقة للخادم/القناة
    - تم إعداد `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - تم حظر المرسل بواسطة قائمة السماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="تنتهي مهلة المعالجات طويلة التشغيل أو تظهر ردود مكررة">

    السجلات المعتادة:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    مفتاح ضبط ميزانية المستمع:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    مفتاح ضبط مهلة تشغيل العامل:

    - حساب واحد: `channels.discord.inboundWorker.runTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - الافتراضي: `1800000` (30 دقيقة)؛ اضبطه على `0` للتعطيل

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

    استخدم `eventQueue.listenerTimeout` لإعدادات المستمع البطيئة و`inboundWorker.runTimeoutMs`
    فقط إذا كنت تريد صمام أمان منفصلًا لأدوار الوكيل المدرجة في قائمة الانتظار.

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    تعمل فحوصات الأذونات في `channels status --probe` فقط مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد يظل التطابق في وقت التشغيل يعمل، لكن الفحص لا يمكنه التحقق من الأذونات بالكامل.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - الرسائل الخاصة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل الخاصة معطلة: `channels.discord.dmPolicy="disabled"` (الاسم القديم: `channels.discord.dm.policy`)
    - في انتظار الموافقة على الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات bot إلى bot">
    يتم تجاهل الرسائل التي يكتبها bot افتراضيًا.

    إذا قمت بتعيين `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارات وقائمة السماح لتجنب سلوك الحلقات.
    ويفضل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل bot التي تذكر bot فقط.

  </Accordion>

  <Accordion title="يسقط STT الصوتي مع DecryptionFailed(...)">

    - حافظ على تحديث OpenClaw (`openclaw update`) حتى يكون منطق استعادة استقبال الصوت في Discord موجودًا
    - تأكد من أن `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (القيمة الافتراضية من المصدر العلوي) واضبطها فقط عند الحاجة
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

- بدء التشغيل/التفويض: `enabled` و`token` و`accounts.*` و`allowBots`
- السياسة: `groupPolicy` و`dm.*` و`guilds.*` و`guilds.*.channels.*`
- الأوامر: `commands.native` و`commands.useAccessGroups` و`configWrites` و`slashCommand.*`
- قائمة انتظار الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع) و`eventQueue.maxQueueSize` و`eventQueue.maxConcurrency`
- العامل الوارد: `inboundWorker.runTimeoutMs`
- الرد/السجل: `replyToMode` و`historyLimit` و`dmHistoryLimit` و`dms.*.historyLimit`
- التسليم: `textChunkLimit` و`chunkMode` و`maxLinesPerMessage`
- البث: `streaming` (اسم مستعار قديم: `streamMode`) و`streaming.preview.toolProgress` و`draftChunk` و`blockStreaming` و`blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` و`retry`
  - يحدد `mediaMaxMb` الحد الأقصى للتحميلات الصادرة إلى Discord (الافتراضي: `100MB`)
- الإجراءات: `actions.*`
- الحالة: `activity` و`status` و`activityType` و`activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings` و`bindings[]` على المستوى الأعلى (`type: "acp"`) و`pluralkit` و`execApprovals` و`intents` و`agentComponents` و`heartbeat` و`responsePrefix`

## السلامة والعمليات

- تعامل مع رموز bot المميزة كأسرار (يفضّل `DISCORD_BOT_TOKEN` في البيئات المُدارة).
- امنح أقل قدر ممكن من أذونات Discord.
- إذا كانت حالة/نشر الأوامر قديمة، فأعد تشغيل Gateway وتحقق مرة أخرى باستخدام `openclaw channels status --probe`.

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [الأمان](/ar/gateway/security)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
