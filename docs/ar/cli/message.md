---
read_when:
    - إضافة إجراءات CLI للرسائل أو تعديلها
    - تغيير سلوك القنوات الصادرة
summary: مرجع CLI لـ `openclaw message` (الإرسال + إجراءات القناة)
title: رسالة
x-i18n:
    generated_at: "2026-04-23T07:22:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37b6f40b435326aee186dad1e6e060c24f2ef6d44b07fd85d4ce5cfd7f350b91
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

أمر صادر موحّد لإرسال الرسائل وإجراءات القناة
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## الاستخدام

```
openclaw message <subcommand> [flags]
```

اختيار القناة:

- يكون `--channel` مطلوبًا إذا كانت هناك أكثر من قناة واحدة مهيأة.
- إذا كانت هناك قناة واحدة فقط مهيأة، فإنها تصبح القناة الافتراضية.
- القيم: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (يتطلب Mattermost وجود plugin)

تنسيقات الهدف (`--target`):

- WhatsApp: رقم E.164 أو JID لمجموعة
- Telegram: معرّف دردشة أو `@username`
- Discord: ‏`channel:<id>` أو `user:<id>` (أو إشارة `<@id>`؛ وتُعامل المعرّفات الرقمية الخام على أنها قنوات)
- Google Chat: ‏`spaces/<spaceId>` أو `users/<userId>`
- Slack: ‏`channel:<id>` أو `user:<id>` (يُقبل معرّف القناة الخام)
- Mattermost (plugin): ‏`channel:<id>` أو `user:<id>` أو `@username` (وتُعامل المعرّفات المجرّدة على أنها قنوات)
- Signal: ‏`+E.164` أو `group:<id>` أو `signal:+E.164` أو `signal:group:<id>` أو `username:<name>`/`u:<name>`
- iMessage: معرّف جهة الاتصال، أو `chat_id:<id>` أو `chat_guid:<guid>` أو `chat_identifier:<id>`
- Matrix: ‏`@user:server` أو `!room:server` أو `#alias:server`
- Microsoft Teams: معرّف المحادثة (`19:...@thread.tacv2`) أو `conversation:<id>` أو `user:<aad-object-id>`

تحليل الأسماء:

- بالنسبة إلى المزوّدين المدعومين (Discord/Slack/إلخ)، تُحل أسماء القنوات مثل `Help` أو `#help` عبر ذاكرة التخزين المؤقت للدليل.
- عند عدم وجود تطابق في الذاكرة المؤقتة، سيحاول OpenClaw إجراء بحث مباشر في الدليل عندما يدعم المزوّد ذلك.

## العلامات الشائعة

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (القناة أو المستخدم الهدف للإرسال/الاستطلاع/القراءة/إلخ)
- `--targets <name>` (تكرار؛ للبث فقط)
- `--json`
- `--dry-run`
- `--verbose`

## سلوك SecretRef

- يقوم `openclaw message` بتحليل SecretRef للقنوات المدعومة قبل تنفيذ الإجراء المحدد.
- يكون التحليل مقيّدًا بهدف الإجراء النشط عندما يكون ذلك ممكنًا:
  - على مستوى القناة عندما يكون `--channel` مضبوطًا (أو مستنتجًا من الأهداف ذات البادئة مثل `discord:...`)
  - على مستوى الحساب عندما يكون `--account` مضبوطًا (عموميات القناة + أسطح الحساب المحدد)
  - عند حذف `--account`، لا يفرض OpenClaw نطاق SecretRef لحساب `default`
- لا تمنع SecretRef غير المحلولة في القنوات غير ذات الصلة تنفيذ إجراء رسالة موجّه.
- إذا كانت SecretRef للقناة/الحساب المحدد غير محلولة، يفشل الأمر بشكل مغلق لذلك الإجراء.

## الإجراءات

### أساسي

- `send`
  - القنوات: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - المطلوب: `--target`، بالإضافة إلى `--message` أو `--media` أو `--presentation`
  - اختياري: `--media`، `--presentation`، `--delivery`، `--pin`، `--reply-to`، `--thread-id`، `--gif-playback`، `--force-document`، `--silent`
  - حمولات العرض المشتركة: يرسل `--presentation` كتلًا دلالية (`text` و`context` و`divider` و`buttons` و`select`) يعرضها core عبر الإمكانات المعلنة للقناة المحددة. راجع [عرض الرسائل](/ar/plugins/message-presentation).
  - تفضيلات التسليم العامة: يقبل `--delivery` تلميحات تسليم مثل `{ "pin": true }`؛ ويُعد `--pin` اختصارًا للتسليم المثبّت عندما تدعم القناة ذلك.
  - Telegram فقط: `--force-document` (إرسال الصور وملفات GIF كمستندات لتجنب ضغط Telegram)
  - Telegram فقط: `--thread-id` (معرّف موضوع المنتدى)
  - Slack فقط: `--thread-id` (الطابع الزمني للخيط؛ ويستخدم `--reply-to` الحقل نفسه)
  - Telegram + Discord: ‏`--silent`
  - WhatsApp فقط: `--gif-playback`

- `poll`
  - القنوات: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - المطلوب: `--target`، `--poll-question`، `--poll-option` (متكرر)
  - اختياري: `--poll-multi`
  - Discord فقط: `--poll-duration-hours`، `--silent`، `--message`
  - Telegram فقط: `--poll-duration-seconds` (5-600)، `--silent`، `--poll-anonymous` / `--poll-public`، `--thread-id`

- `react`
  - القنوات: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - المطلوب: `--message-id`، `--target`
  - اختياري: `--emoji`، `--remove`، `--participant`، `--from-me`، `--target-author`، `--target-author-uuid`
  - ملاحظة: يتطلب `--remove` وجود `--emoji` (احذف `--emoji` لمسح تفاعلاتك حيثما كان ذلك مدعومًا؛ راجع /tools/reactions)
  - WhatsApp فقط: `--participant`، `--from-me`
  - تفاعلات مجموعات Signal: يتطلب `--target-author` أو `--target-author-uuid`

- `reactions`
  - القنوات: Discord/Google Chat/Slack/Matrix
  - المطلوب: `--message-id`، `--target`
  - اختياري: `--limit`

- `read`
  - القنوات: Discord/Slack/Matrix
  - المطلوب: `--target`
  - اختياري: `--limit`، `--before`، `--after`
  - Discord فقط: `--around`

- `edit`
  - القنوات: Discord/Slack/Matrix
  - المطلوب: `--message-id`، `--message`، `--target`

- `delete`
  - القنوات: Discord/Slack/Telegram/Matrix
  - المطلوب: `--message-id`، `--target`

- `pin` / `unpin`
  - القنوات: Discord/Slack/Matrix
  - المطلوب: `--message-id`، `--target`

- `pins` (قائمة)
  - القنوات: Discord/Slack/Matrix
  - المطلوب: `--target`

- `permissions`
  - القنوات: Discord/Matrix
  - المطلوب: `--target`
  - Matrix فقط: متاح عندما يكون تشفير Matrix مفعّلًا وتكون إجراءات التحقق مسموحًا بها

- `search`
  - القنوات: Discord
  - المطلوب: `--guild-id`، `--query`
  - اختياري: `--channel-id`، `--channel-ids` (متكرر)، `--author-id`، `--author-ids` (متكرر)، `--limit`

### الخيوط

- `thread create`
  - القنوات: Discord
  - المطلوب: `--thread-name`، `--target` (معرّف القناة)
  - اختياري: `--message-id`، `--message`، `--auto-archive-min`

- `thread list`
  - القنوات: Discord
  - المطلوب: `--guild-id`
  - اختياري: `--channel-id`، `--include-archived`، `--before`، `--limit`

- `thread reply`
  - القنوات: Discord
  - المطلوب: `--target` (معرّف الخيط)، `--message`
  - اختياري: `--media`، `--reply-to`

### الرموز التعبيرية

- `emoji list`
  - Discord: ‏`--guild-id`
  - Slack: لا توجد علامات إضافية

- `emoji upload`
  - القنوات: Discord
  - المطلوب: `--guild-id`، `--emoji-name`، `--media`
  - اختياري: `--role-ids` (متكرر)

### الملصقات

- `sticker send`
  - القنوات: Discord
  - المطلوب: `--target`، `--sticker-id` (متكرر)
  - اختياري: `--message`

- `sticker upload`
  - القنوات: Discord
  - المطلوب: `--guild-id`، `--sticker-name`، `--sticker-desc`، `--sticker-tags`، `--media`

### الأدوار / القنوات / الأعضاء / الصوت

- `role info` (Discord): ‏`--guild-id`
- `role add` / `role remove` (Discord): ‏`--guild-id`، `--user-id`، `--role-id`
- `channel info` (Discord): ‏`--target`
- `channel list` (Discord): ‏`--guild-id`
- `member info` (Discord/Slack): ‏`--user-id` (+ ‏`--guild-id` لـ Discord)
- `voice status` (Discord): ‏`--guild-id`، `--user-id`

### الأحداث

- `event list` (Discord): ‏`--guild-id`
- `event create` (Discord): ‏`--guild-id`، `--event-name`، `--start-time`
  - اختياري: `--end-time`، `--desc`، `--channel-id`، `--location`، `--event-type`

### الإشراف (Discord)

- `timeout`: ‏`--guild-id`، `--user-id` (اختياري `--duration-min` أو `--until`؛ احذفهما معًا لمسح timeout)
- `kick`: ‏`--guild-id`، `--user-id` (+ ‏`--reason`)
- `ban`: ‏`--guild-id`، `--user-id` (+ ‏`--delete-days`، `--reason`)
  - يدعم `timeout` أيضًا `--reason`

### البث

- `broadcast`
  - القنوات: أي قناة مهيأة؛ استخدم `--channel all` لاستهداف جميع المزوّدين
  - المطلوب: `--targets <target...>`
  - اختياري: `--message`، `--media`، `--dry-run`

## أمثلة

إرسال رد على Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

إرسال رسالة بأزرار دلالية:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

يعرض core حمولة `presentation` نفسها في مكوّنات Discord أو كتل Slack أو الأزرار المضمنة في Telegram أو خصائص Mattermost أو بطاقات Teams/Feishu بحسب إمكانات القناة. راجع [عرض الرسائل](/ar/plugins/message-presentation) للاطلاع على العقد الكامل وقواعد الرجوع الاحتياطي.

إرسال حمولة عرض أكثر ثراءً:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

إنشاء استطلاع Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

إنشاء استطلاع Telegram (إغلاق تلقائي خلال دقيقتين):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

إرسال رسالة Teams استباقية:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

إنشاء استطلاع Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

إضافة تفاعل في Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

إضافة تفاعل في مجموعة Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

إرسال أزرار Telegram مضمنة عبر العرض العام:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

إرسال بطاقة Teams عبر العرض العام:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

إرسال صورة Telegram كمستند لتجنب الضغط:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
