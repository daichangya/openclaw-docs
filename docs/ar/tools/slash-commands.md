---
read_when:
    - استخدام أو تهيئة أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
summary: 'الأوامر المائلة: النصية مقابل الأصلية، والتهيئة، والأوامر المدعومة'
title: الأوامر المائلة
x-i18n:
    generated_at: "2026-04-22T04:29:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# الأوامر المائلة

تتولى Gateway معالجة الأوامر. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`.
ويستخدم أمر bash الخاص بالدردشة على المضيف فقط الصيغة `! <cmd>` (مع وجود `/bash <cmd>` كاسم مستعار).

هناك نظامان مرتبطان:

- **الأوامر**: رسائل مستقلة بصيغة `/...`.
- **التوجيهات**: `/think` و`/fast` و`/verbose` و`/trace` و`/reasoning` و`/elevated` و`/exec` و`/model` و`/queue`.
  - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
  - في رسائل الدردشة العادية (وليست الرسائل التي تحتوي على توجيهات فقط)، تُعامل على أنها “تلميحات مضمنة” ولا تُبقي إعدادات الجلسة.
  - في الرسائل التي تحتوي على توجيهات فقط (عندما تحتوي الرسالة على توجيهات فقط)، فإنها تُحفَظ في الجلسة وترد بإقرار.
  - لا تُطبَّق التوجيهات إلا على **المرسلين المصرح لهم**. وإذا كان `commands.allowFrom` مضبوطًا، فهو قائمة
    السماح الوحيدة المستخدمة؛ وإلا فإن التفويض يأتي من قوائم السماح/الاقتران الخاصة بالقناة بالإضافة إلى `commands.useAccessGroups`.
    أما المرسلون غير المصرح لهم فيُعاملون التوجيهات لديهم كنص عادي.

كما توجد بعض **الاختصارات المضمنة** (للمرسلين الموجودين في قائمة السماح/المصرح لهم فقط): `/help` و`/commands` و`/status` و`/whoami` (`/id`).
وهي تعمل فورًا، وتُزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

## التهيئة

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (الافتراضي `true`) يفعّل تحليل `/...` في رسائل الدردشة.
  - على الأسطح التي لا تدعم الأوامر الأصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل الأوامر النصية تعمل حتى إذا ضبطت هذا الخيار على `false`.
- `commands.native` (الافتراضي `"auto"`) يسجّل الأوامر الأصلية.
  - الوضع التلقائي: مفعّل لـ Discord/Telegram؛ ومعطل لـ Slack (حتى تضيف slash commands)؛ ويُتجاهل لدى المزودات التي لا تدعم الأوامر الأصلية.
  - اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل مزود (قيمة منطقية أو `"auto"`).
  - تؤدي القيمة `false` إلى مسح الأوامر المسجَّلة سابقًا على Discord/Telegram عند بدء التشغيل. أما أوامر Slack فتُدار داخل تطبيق Slack ولا تُزال تلقائيًا.
- `commands.nativeSkills` (الافتراضي `"auto"`) يسجّل أوامر **Skills** أصلية عند الدعم.
  - الوضع التلقائي: مفعّل لـ Discord/Telegram؛ ومعطل لـ Slack (إذ يتطلب Slack إنشاء slash command لكل Skill).
  - اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل مزود (قيمة منطقية أو `"auto"`).
- `commands.bash` (الافتراضي `false`) يفعّل `! <cmd>` لتشغيل أوامر shell على المضيف (`/bash <cmd>` اسم مستعار؛ ويتطلب قوائم سماح `tools.elevated`).
- `commands.bashForegroundMs` (الافتراضي `2000`) يتحكم في مدة انتظار bash قبل الانتقال إلى وضع الخلفية (`0` يرسله إلى الخلفية فورًا).
- `commands.config` (الافتراضي `false`) يفعّل `/config` (لقراءة/كتابة `openclaw.json`).
- `commands.mcp` (الافتراضي `false`) يفعّل `/mcp` (لقراءة/كتابة تهيئة MCP التي يديرها OpenClaw ضمن `mcp.servers`).
- `commands.plugins` (الافتراضي `false`) يفعّل `/plugins` (اكتشاف Plugins/حالته بالإضافة إلى عناصر تحكم التثبيت + التفعيل/التعطيل).
- `commands.debug` (الافتراضي `false`) يفعّل `/debug` (تجاوزات وقت runtime فقط).
- `commands.restart` (الافتراضي `true`) يفعّل `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل Gateway.
- `commands.ownerAllowFrom` (اختياري) يضبط قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. وهذا منفصل عن `commands.allowFrom`.
- يجعل `channels.<channel>.commands.enforceOwnerForCommands` لكل قناة (اختياري، الافتراضي `false`) الأوامر الخاصة بالمالك تتطلب **هوية المالك** للتشغيل على ذلك السطح. وعندما تكون القيمة `true`، يجب أن يطابق المرسل مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو بيانات تعريف مالك أصلية للمزود) أو أن يحمل النطاق الداخلي `operator.admin` على قناة رسائل داخلية. ولا يكون إدخال wildcard في `allowFrom` الخاصة بالقناة، أو قائمة مرشحي مالك فارغة/غير محلولة، **كافيًا** — إذ تفشل الأوامر الخاصة بالمالك إغلاقًا محكمًا على تلك القناة. اترك هذا الخيار معطلًا إذا كنت تريد أن تُقيَّد الأوامر الخاصة بالمالك فقط بواسطة `ownerAllowFrom` وقوائم السماح القياسية الخاصة بالأوامر.
- يتحكم `commands.ownerDisplay` في كيفية ظهور معرّفات المالك في system prompt: ‏`raw` أو `hash`.
- يضبط `commands.ownerDisplaySecret` اختياريًا سر HMAC المستخدم عندما يكون `commands.ownerDisplay="hash"`.
- يضبط `commands.allowFrom` (اختياري) قائمة سماح لكل مزود لتفويض الأوامر. وعند ضبطه، فإنه يكون
  مصدر التفويض الوحيد للأوامر والتوجيهات (ويتم تجاهل قوائم سماح القناة/الاقتران و`commands.useAccessGroups`).
  استخدم `"*"` كقيمة افتراضية عامة؛ وتقوم المفاتيح الخاصة بالمزود بالتجاوز عليه.
- يفرض `commands.useAccessGroups` (الافتراضي `true`) قوائم السماح/السياسات للأوامر عندما لا يكون `commands.allowFrom` مضبوطًا.

## قائمة الأوامر

مصدر الحقيقة الحالي:

- الأوامر الأساسية المضمّنة تأتي من `src/auto-reply/commands-registry.shared.ts`
- أوامر dock المولدة تأتي من `src/auto-reply/commands-registry.data.ts`
- أوامر Plugins تأتي من استدعاءات `registerCommand()` الخاصة بالـ Plugin
- ما يتوفر فعليًا على Gateway لديك ما يزال يعتمد على أعلام التهيئة، وسطح القناة، وPlugins المثبتة/المفعلة

### الأوامر الأساسية المضمّنة

الأوامر المضمّنة المتاحة اليوم:

- يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو الاسم المستعار لإعادة التعيين.
- يحتفظ `/reset soft [message]` بـ transcript الحالية، ويسقط معرّفات جلسة CLI backend المعاد استخدامها، ويعيد تشغيل تحميل startup/system-prompt في المكان نفسه.
- يضغط `/compact [instructions]` سياق الجلسة. راجع [/concepts/compaction](/ar/concepts/compaction).
- يوقف `/stop` التشغيل الحالي.
- يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط الخيوط.
- يضبط `/think <level>` مستوى التفكير. تأتي الخيارات من ملف تعريف المزود الخاص بالنموذج النشط؛ وتشمل المستويات الشائعة `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` و`adaptive` و`max` أو `on` الثنائي فقط حيث يوجد دعم. الأسماء المستعارة: `/thinking` و`/t`.
- يبدّل `/verbose on|off|full` المخرجات المفصلة. الاسم المستعار: `/v`.
- يبدّل `/trace on|off` مخرجات تتبع Plugin للجلسة الحالية.
- يعرض `/fast [status|on|off]` وضع السرعة أو يضبطه.
- يبدّل `/reasoning [on|off|stream]` إظهار الاستدلال. الاسم المستعار: `/reason`.
- يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم المستعار: `/elev`.
- يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` الإعدادات الافتراضية لـ exec أو يضبطها.
- يعرض `/model [name|#|status]` النموذج أو يضبطه.
- يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` المزودات أو نماذج مزود معيّن.
- يدير `/queue <mode>` سلوك قائمة الانتظار (`steer` و`interrupt` و`followup` و`collect` و`steer-backlog`) بالإضافة إلى خيارات مثل `debounce:2s cap:25 drop:summarize`.
- يعرض `/help` ملخص المساعدة القصير.
- يعرض `/commands` فهرس الأوامر المولد.
- يعرض `/tools [compact|verbose]` ما الذي يمكن للوكيل الحالي استخدامه الآن.
- يعرض `/status` حالة runtime، بما في ذلك استخدام/حصة المزود عند توفرها.
- يسرد `/tasks` المهام الخلفية النشطة/الأخيرة للجلسة الحالية.
- يشرح `/context [list|detail|json]` كيفية تجميع السياق.
- يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
- يعرض `/whoami` معرّف المرسل الخاص بك. الاسم المستعار: `/id`.
- يشغّل `/skill <name> [input]` Skill بالاسم.
- يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
- يحسم `/approve <id> <decision>` مطالبات الموافقة الخاصة بـ exec.
- يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. راجع [/tools/btw](/ar/tools/btw).
- يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
- يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات runtime.
- يربط `/focus <target>` خيط Discord الحالي أو موضوع/محادثة Telegram بهدف جلسة.
- يزيل `/unfocus` الربط الحالي.
- يسرد `/agents` الوكلاء المرتبطين بالخيوط للجلسة الحالية.
- يوقف `/kill <id|#|all>` وكيلًا فرعيًا واحدًا أو جميع الوكلاء الفرعيين الجاري تشغيلهم.
- يرسل `/steer <id|#> <message>` توجيهًا إلى وكيل فرعي قيد التشغيل. الاسم المستعار: `/tell`.
- يقرأ `/config show|get|set|unset` ملف `openclaw.json` أو يكتبه. للمالك فقط. ويتطلب `commands.config: true`.
- يقرأ `/mcp show|get|set|unset` تهيئة خادم MCP التي يديرها OpenClaw ضمن `mcp.servers` أو يكتبها. للمالك فقط. ويتطلب `commands.mcp: true`.
- يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يغيرها. و`/plugin` اسم مستعار. الكتابة للمالك فقط. ويتطلب `commands.plugins: true`.
- يدير `/debug show|set|unset|reset` تجاوزات التهيئة في runtime فقط. للمالك فقط. ويتطلب `commands.debug: true`.
- يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل رد أو يطبع ملخص تكلفة محليًا.
- يتحكم `/tts on|off|status|provider|limit|summary|audio|help` في TTS. راجع [/tools/tts](/ar/tools/tts).
- يعيد `/restart` تشغيل OpenClaw عند تفعيله. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
- يضبط `/activation mention|always` وضع التفعيل في المجموعات.
- يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.
- يشغّل `/bash <command>` أمر shell على المضيف. نصي فقط. الاسم المستعار: `! <command>`. ويتطلب `commands.bash: true` بالإضافة إلى قوائم سماح `tools.elevated`.
- يفحص `!poll [sessionId]` وظيفة bash تعمل في الخلفية.
- يوقف `!stop [sessionId]` وظيفة bash تعمل في الخلفية.

### أوامر dock المولدة

تُولّد أوامر Dock من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمّنة الحالية:

- `/dock-discord` (الاسم المستعار: `/dock_discord`)
- `/dock-mattermost` (الاسم المستعار: `/dock_mattermost`)
- `/dock-slack` (الاسم المستعار: `/dock_slack`)
- `/dock-telegram` (الاسم المستعار: `/dock_telegram`)

### أوامر Plugins المضمّنة

يمكن لـ Plugins المضمّنة إضافة المزيد من slash commands. الأوامر المضمّنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming الخاص بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق اقتران/إعداد الجهاز. راجع [الاقتران](/ar/channels/pairing).
- يقوم `/phone status|arm <camera|screen|writes|all> [duration]|disarm` بتسليح أوامر عقدة الهاتف عالية الخطورة مؤقتًا.
- يدير `/voice status|list [limit]|set <voiceId|name>` تهيئة Talk voice. وعلى Discord، يكون اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات LINE rich card المسبقة. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|account|mcp|skills` حزمة Codex app-server المضمّنة ويتحكم بها. راجع [Codex Harness](/ar/plugins/codex-harness).
- أوامر خاصة بـ QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرض Skills القابلة للاستدعاء من قِبل المستخدم أيضًا كأوامر مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة إدخال عامة.
- قد تظهر Skills أيضًا كأوامر مباشرة مثل `/prose` عندما تسجلها Skill/Plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.

ملاحظات:

- تقبل الأوامر وجود `:` اختياري بين الأمر والوسائط (مثل `/think: high` و`/send: on` و`/help:`).
- يقبل `/new <model>` اسمًا مستعارًا للنموذج، أو `provider/model`، أو اسم مزود (مطابقة ضبابية)؛ وإذا لم يوجد تطابق، يُعامل النص على أنه جسم الرسالة.
- للحصول على تفصيل كامل لاستخدام المزود، استخدم `openclaw status --usage`.
- يتطلب `/allowlist add|remove` القيمة `commands.config=true` ويلتزم بـ `configWrites` الخاصة بالقناة.
- في القنوات متعددة الحسابات، تلتزم أيضًا أوامر `/allowlist --account <id>` الموجهة للتهيئة و`/config set channels.<provider>.accounts.<id>...` بـ `configWrites` الخاصة بالحساب الهدف.
- يتحكم `/usage` في تذييل الاستخدام لكل رد؛ ويطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
- يكون `/restart` مفعّلًا افتراضيًا؛ اضبط `commands.restart: false` لتعطيله.
- يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
- يقوم `/plugins enable|disable` بتحديث تهيئة Plugin وقد يطلب إعادة تشغيل.
- أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في القنوات الصوتية (ويتطلب `channels.discord.voice` والأوامر الأصلية؛ وهو غير متاح كنص).
- تتطلب أوامر ربط خيوط Discord (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) تفعيل ربط الخيوط الفعلي (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
- مرجع أوامر ACP وسلوك runtime: [وكلاء ACP](/ar/tools/acp-agents).
- الغرض من `/verbose` هو التصحيح وزيادة الرؤية؛ لذا أبقه **معطلًا** في الاستخدام العادي.
- إن `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin ويُبقي ضوضاء الأدوات المفصلة العادية معطلة.
- يحفظ `/fast on|off` تجاوزًا على مستوى الجلسة. استخدم خيار `inherit` في واجهة Sessions لمسحه والرجوع إلى الإعدادات الافتراضية في التهيئة.
- إن `/fast` خاص بالمزود: إذ تربطه OpenAI/OpenAI Codex بـ `service_tier=priority` على نقاط النهاية الأصلية لـ Responses، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك الحركة المصادق عليها عبر OAuth والمرسلة إلى `api.anthropic.com`، بـ `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
- ما تزال ملخصات فشل الأدوات تُعرض عند الصلة، لكن نص الفشل التفصيلي لا يُضمَّن إلا عندما يكون `/verbose` على `on` أو `full`.
- تُعد `/reasoning` و`/verbose` و`/trace` خطيرة في إعدادات المجموعات: إذ قد تكشف الاستدلال الداخلي، أو مخرجات الأدوات، أو تشخيصات Plugin، وهي أمور قد لا تنوي كشفها. ويُفضّل إبقاؤها معطلة، خصوصًا في الدردشات الجماعية.
- يحفظ `/model` نموذج الجلسة الجديد فورًا.
- إذا كان الوكيل خاملًا، يستخدمه التشغيل التالي مباشرة.
- إذا كان تشغيل ما نشطًا بالفعل، يعلّم OpenClaw التبديل المباشر على أنه معلّق ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأدوات أو مخرجات الرد قد بدأ بالفعل، فقد يظل التبديل المعلّق في الانتظار حتى فرصة إعادة محاولة لاحقة أو حتى دور المستخدم التالي.
- **المسار السريع:** تُعالج الرسائل التي تحتوي على أوامر فقط من المرسلين الموجودين في قائمة السماح فورًا (تتجاوز قائمة الانتظار + النموذج).
- **بوابة الإشارة في المجموعات:** تتجاوز الرسائل التي تحتوي على أوامر فقط من المرسلين الموجودين في قائمة السماح متطلبات الإشارة.
- **الاختصارات المضمنة (للمرسلين الموجودين في قائمة السماح فقط):** تعمل بعض الأوامر أيضًا عندما تكون مضمنة في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
  - مثال: يؤدي `hey /status` إلى رد حالة، ويستمر النص المتبقي عبر التدفق العادي.
- المتاح حاليًا: `/help` و`/commands` و`/status` و`/whoami` (`/id`).
- يتم تجاهل الرسائل غير المصرح بها التي تحتوي على أوامر فقط بصمت، وتُعامل الرموز المضمنة `/...` كنص عادي.
- **أوامر Skills:** تُعرض Skills ذات `user-invocable` أيضًا كأوامر مائلة. تُنظَّف الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية (مثل `_2`).
  - يشغّل `/skill <name> [input]` Skill بالاسم (وهو مفيد عندما تمنع حدود الأوامر الأصلية أوامر لكل Skill).
  - افتراضيًا، تُمرَّر أوامر Skills إلى النموذج كطلب عادي.
  - يمكن لـ Skills اختياريًا إعلان `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
  - مثال: `/prose` (Plugin ‏OpenProse) — راجع [OpenProse](/ar/prose).
- **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عندما تُهمل الوسائط المطلوبة). ويعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر الخيارات وتُهمل الوسيطة.

## `/tools`

يجيب `/tools` عن سؤال في runtime، وليس عن سؤال تهيئة: **ما الذي يمكن لهذا الوكيل استخدامه الآن
في هذه المحادثة**.

- تكون القيمة الافتراضية لـ `/tools` مضغوطة ومُحسَّنة للمسح السريع.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تكشف أسطح الأوامر الأصلية التي تدعم الوسائط عن مفتاح الوضع نفسه على هيئة `compact|verbose`.
- تكون النتائج ضمن نطاق الجلسة، لذا فإن تغيير الوكيل أو القناة أو الخيط أو تفويض المرسل أو النموذج يمكن
  أن يغير المخرجات.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعليًا في runtime، بما في ذلك أدوات الأساس، والأدوات
  المتصلة من Plugins، والأدوات المملوكة للقنوات.

أما لتحرير الملفات الشخصية والتجاوزات، فاستخدم لوحة Tools في Control UI أو أسطح التهيئة/الفهرس بدلًا
من التعامل مع `/tools` على أنه فهرس ثابت.

## أسطح الاستخدام (ما الذي يظهر وأين)

- **استخدام/حصة المزود** (مثل: “Claude 80% left”) يظهر في `/status` لمزود النموذج الحالي عندما يكون تتبع الاستخدام مفعّلًا. ويطبّع OpenClaw نوافذ المزود إلى `% left`؛ أما بالنسبة إلى MiniMax، فتُعكس حقول النسبة المئوية المتبقية فقط قبل العرض، وتُفضّل استجابات `model_remains` إدخال نموذج الدردشة بالإضافة إلى تسمية خطة موسومة بالنموذج.
- يمكن أن تعود **أسطر الرموز/الذاكرة المؤقتة** في `/status` إلى أحدث إدخال استخدام في transcript عندما تكون لقطة الجلسة الحية قليلة البيانات. وتظل القيم الحية غير الصفرية الموجودة مسبقًا هي الفائزة، كما يمكن للرجوع الاحتياطي إلى transcript أن يستعيد أيضًا تسمية نموذج runtime النشط بالإضافة إلى إجمالي أكبر موجه نحو prompt عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- يتحكم `/usage off|tokens|full` في **الرموز/التكلفة لكل رد** (تُضاف إلى الردود العادية).
- يتعلق `/model status` بـ **النماذج/المصادقة/نقاط النهاية**، وليس بالاستخدام.

## اختيار النموذج (`/model`)

يُنفَّذ `/model` على أنه توجيه.

أمثلة:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

ملاحظات:

- يعرض `/model` و`/model list` منتقيًا مضغوطًا ومرقمًا (عائلة النموذج + المزودات المتاحة).
- على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للمزود والنموذج بالإضافة إلى خطوة Submit.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزود الحالي عند الإمكان).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزود المهيأة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح `/debug` تعيين تجاوزات تهيئة **في runtime فقط** (في الذاكرة، لا على القرص). للمالك فقط. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

ملاحظات:

- تُطبَّق التجاوزات فورًا على قراءات التهيئة الجديدة، لكنها **لا** تكتب إلى `openclaw.json`.
- استخدم `/debug reset` لمسح جميع التجاوزات والعودة إلى التهيئة الموجودة على القرص.

## مخرجات تتبع Plugin

يتيح `/trace` تبديل **أسطر تتبع/تصحيح Plugin ضمن نطاق الجلسة** دون تفعيل الوضع المفصل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` من دون وسيطة حالة التتبع الحالية للجلسة.
- يفعّل `/trace on` أسطر تتبع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبع Plugin في `/status` وكـرسالة تشخيصية لاحقة بعد رد المساعد العادي.
- لا يحل `/trace` محل `/debug`؛ فما يزال `/debug` يدير تجاوزات التهيئة في runtime فقط.
- لا يحل `/trace` محل `/verbose`؛ فما تزال مخرجات الأدوات/الحالة المفصلة العادية تابعة لـ `/verbose`.

## تحديثات التهيئة

يكتب `/config` إلى التهيئة الموجودة على القرص (`openclaw.json`). للمالك فقط. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

ملاحظات:

- يتم التحقق من صحة التهيئة قبل الكتابة؛ وتُرفض التغييرات غير الصالحة.
- تظل تحديثات `/config` محفوظة عبر إعادة التشغيل.

## تحديثات MCP

يكتب `/mcp` تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers`. للمالك فقط. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

ملاحظات:

- يخزن `/mcp` التهيئة في تهيئة OpenClaw، وليس في إعدادات مشروع مملوكة لـ Pi.
- تقرر مهايئات runtime وسائل النقل القابلة للتنفيذ فعليًا.

## تحديثات Plugins

يتيح `/plugins` للمشغلين فحص Plugins المكتشفة وتبديل التفعيل في التهيئة. ويمكن للتدفقات المخصصة للقراءة فقط استخدام `/plugin` كاسم مستعار. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

ملاحظات:

- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin الحقيقي مقابل workspace الحالية بالإضافة إلى التهيئة الموجودة على القرص.
- لا يقوم `/plugins enable|disable` إلا بتحديث تهيئة Plugin فقط؛ ولا يثبت Plugins أو يزيلها.
- بعد تغييرات التفعيل/التعطيل، أعد تشغيل Gateway لتطبيقها.

## ملاحظات الأسطح

- تعمل **الأوامر النصية** داخل جلسة الدردشة العادية (تتشارك الرسائل الخاصة `main`، وللمجموعات جلستها الخاصة).
- تستخدم **الأوامر الأصلية** جلسات معزولة:
  - Discord: ‏`agent:<agentId>:discord:slash:<userId>`
  - Slack: ‏`agent:<agentId>:slack:slash:<userId>` (يمكن تهيئة البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: ‏`telegram:slash:<userId>` (يستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
- يستهدف **`/stop`** جلسة الدردشة النشطة بحيث يمكنه إيقاف التشغيل الحالي.
- **Slack:** ما يزال `channels.slack.slashCommand` مدعومًا لأمر واحد بأسلوب `/openclaw`. وإذا فعّلت `commands.native`، فيجب عليك إنشاء أمر Slack مائل واحد لكل أمر مضمّن (بالأسماء نفسها مثل `/help`). وتُسلَّم قوائم وسائط الأوامر في Slack كأزرار Block Kit مؤقتة.
  - استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. وما يزال `/status` النصي يعمل في رسائل Slack.

## أسئلة BTW الجانبية

يُعد `/btw` **سؤالًا جانبيًا** سريعًا حول الجلسة الحالية.

وعلى خلاف الدردشة العادية:

- فهو يستخدم الجلسة الحالية كسياق خلفي،
- ويعمل كاستدعاء منفرد **بلا أدوات**،
- ولا يغيّر سياق الجلسة المستقبلي،
- ولا يُكتب في سجل transcript،
- ويُسلَّم كنتيجة جانبية مباشرة بدلًا من رسالة مساعد عادية.

وهذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر
المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) لمعرفة السلوك الكامل وتفاصيل
تجربة العميل.
