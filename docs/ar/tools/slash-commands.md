---
read_when:
    - استخدام أو إعداد أوامر الدردشة
    - تصحيح توجيه الأوامر أو الأذونات
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، والإعداد، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-04-23T14:03:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# أوامر الشرطة المائلة

تتولى Gateway معالجة الأوامر. ويجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`.
ويستخدم أمر bash الخاص بالدردشة على المضيف فقط الصيغة `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

هناك نظامان مترابطان:

- **الأوامر**: رسائل مستقلة من الشكل `/...`.
- **التوجيهات**: `/think` و`/fast` و`/verbose` و`/trace` و`/reasoning` و`/elevated` و`/exec` و`/model` و`/queue`.
  - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
  - في رسائل الدردشة العادية (وليست الرسائل التي تحتوي على توجيهات فقط)، تُعامل على أنها "تلميحات مضمّنة" ولا **تستمر** كإعدادات للجلسة.
  - في الرسائل التي تحتوي على توجيهات فقط (أي تحتوي الرسالة على توجيهات فقط)، تستمر في الجلسة وترد بإقرار.
  - لا تُطبَّق التوجيهات إلا على **المرسلين المصرّح لهم**. وإذا كان `commands.allowFrom` مضبوطًا، فهو
    قائمة السماح الوحيدة المستخدمة؛ وإلا فتأتي المصادقة من قوائم السماح/الاقتران الخاصة بالقناة بالإضافة إلى `commands.useAccessGroups`.
    أما المرسلون غير المصرّح لهم فتُعامل التوجيهات لديهم كنص عادي.

وهناك أيضًا بعض **الاختصارات المضمّنة** (للمرسلين المدرجين في قائمة السماح/المصرّح لهم فقط): `/help` و`/commands` و`/status` و`/whoami` (`/id`).
فهي تعمل فورًا، وتُزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

## الإعداد

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

- يقوم `commands.text` (الافتراضي `true`) بتمكين تحليل `/...` في رسائل الدردشة.
  - على الأسطح التي لا تحتوي على أوامر أصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل الأوامر النصية تعمل حتى إذا ضبطت هذا على `false`.
- يقوم `commands.native` (الافتراضي `"auto"`) بتسجيل الأوامر الأصلية.
  - Auto: مفعّل في Discord/Telegram؛ ومعطّل في Slack (إلى أن تضيف slash commands)؛ ويتم تجاهله لمزوّدي الخدمة الذين لا يدعمون الأوامر الأصلية.
  - اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` لتجاوزه لكل مزوّد على حدة (قيمة منطقية أو `"auto"`).
  - تقوم القيمة `false` بمسح الأوامر المسجلة سابقًا في Discord/Telegram عند بدء التشغيل. أما أوامر Slack فتُدار في تطبيق Slack ولا تُزال تلقائيًا.
- يقوم `commands.nativeSkills` (الافتراضي `"auto"`) بتسجيل أوامر **Skills** بشكل أصلي عند الدعم.
  - Auto: مفعّل في Discord/Telegram؛ ومعطّل في Slack (يتطلب Slack إنشاء slash command لكل Skill).
  - اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` لتجاوزه لكل مزوّد على حدة (قيمة منطقية أو `"auto"`).
- يقوم `commands.bash` (الافتراضي `false`) بتمكين `! <cmd>` لتشغيل أوامر shell على المضيف (`/bash <cmd>` اسم مستعار؛ ويتطلب قوائم سماح `tools.elevated`).
- يتحكم `commands.bashForegroundMs` (الافتراضي `2000`) في المدة التي ينتظرها bash قبل التحول إلى وضع الخلفية (`0` ينقله إلى الخلفية فورًا).
- يقوم `commands.config` (الافتراضي `false`) بتمكين `/config` (قراءة/كتابة `openclaw.json`).
- يقوم `commands.mcp` (الافتراضي `false`) بتمكين `/mcp` (قراءة/كتابة إعداد MCP الذي يديره OpenClaw تحت `mcp.servers`).
- يقوم `commands.plugins` (الافتراضي `false`) بتمكين `/plugins` (اكتشاف الإضافات/الحالة بالإضافة إلى عناصر التحكم في التثبيت + التمكين/التعطيل).
- يقوم `commands.debug` (الافتراضي `false`) بتمكين `/debug` (تجاوزات وقت التشغيل فقط).
- يقوم `commands.restart` (الافتراضي `true`) بتمكين `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل Gateway.
- يضبط `commands.ownerAllowFrom` (اختياري) قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات المخصصة للمالك فقط. وهذا منفصل عن `commands.allowFrom`.
- يجعل الخيار لكل قناة `channels.<channel>.commands.enforceOwnerForCommands` (اختياري، والافتراضي `false`) الأوامر المخصصة للمالك فقط تتطلب **هوية المالك** للتشغيل على ذلك السطح. وعندما تكون قيمته `true`، يجب أن يطابق المرسل إما مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو metadata أصلية للمالك من المزوّد) أو أن يملك النطاق الداخلي `operator.admin` على قناة رسائل داخلية. لا يُعد إدخال wildcard في `allowFrom` الخاصة بالقناة، أو قائمة مرشحي مالك فارغة/غير محلولة، **كافيًا** — إذ تفشل الأوامر الخاصة بالمالك فقط بشكل مغلق على تلك القناة. اترك هذا الخيار معطّلًا إذا كنت تريد أن تُقيَّد الأوامر الخاصة بالمالك فقط بواسطة `ownerAllowFrom` وقوائم سماح الأوامر القياسية.
- يتحكم `commands.ownerDisplay` في كيفية ظهور معرّفات المالك في system prompt: ‏`raw` أو `hash`.
- يضبط `commands.ownerDisplaySecret` اختياريًا سر HMAC المستخدم عندما يكون `commands.ownerDisplay="hash"`.
- يضبط `commands.allowFrom` (اختياري) قائمة سماح لكل مزوّد من أجل تخويل الأوامر. وعند إعداده، يكون
  مصدر التخويل الوحيد للأوامر والتوجيهات (ويتم تجاهل قوائم السماح/الاقتران الخاصة بالقناة و`commands.useAccessGroups`).
  استخدم `"*"` كقيمة افتراضية عامة؛ وتتجاوز المفاتيح الخاصة بكل مزوّد هذه القيمة.
- يفرض `commands.useAccessGroups` (الافتراضي `true`) قوائم السماح/السياسات على الأوامر عندما لا يكون `commands.allowFrom` مضبوطًا.

## قائمة الأوامر

المصدر المرجعي الحالي:

- تأتي الأوامر الأساسية المضمنة من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المولّدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` في Plugin
- لا يزال التوفر الفعلي على Gateway لديك يعتمد على علامات الإعداد، وسطح القناة، والإضافات المثبتة/المفعّلة

### الأوامر الأساسية المضمنة

الأوامر المضمنة المتاحة اليوم:

- يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو الاسم المستعار لإعادة الضبط.
- يحتفظ `/reset soft [message]` بالنص الحالي، ويحذف معرّفات جلسات الواجهة الخلفية لـ CLI المعاد استخدامها، ويعيد تشغيل تحميل startup/system-prompt في المكان نفسه.
- يقوم `/compact [instructions]` بضغط سياق الجلسة. راجع [/concepts/compaction](/ar/concepts/compaction).
- يوقف `/stop` التشغيل الحالي.
- يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط الخيط.
- يضبط `/think <level>` مستوى التفكير. تأتي الخيارات من ملف تعريف المزوّد للنموذج النشط؛ والمستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` و`adaptive` و`max` أو القيمة الثنائية `on` فقط حيث تكون مدعومة. الأسماء المستعارة: `/thinking` و`/t`.
- يبدّل `/verbose on|off|full` المخرجات المطوّلة. الاسم المستعار: `/v`.
- يبدّل `/trace on|off` مخرجات تتبع Plugin للجلسة الحالية.
- يعرض `/fast [status|on|off]` الوضع السريع أو يضبطه.
- يبدّل `/reasoning [on|off|stream]` إظهار الاستدلال. الاسم المستعار: `/reason`.
- يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع الصلاحيات. الاسم المستعار: `/elev`.
- يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` الإعدادات الافتراضية للتنفيذ أو يضبطها.
- يعرض `/model [name|#|status]` النموذج أو يضبطه.
- يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` المزوّدات أو نماذج مزوّد معيّن.
- يدير `/queue <mode>` سلوك قائمة الانتظار (`steer` و`interrupt` و`followup` و`collect` و`steer-backlog`) بالإضافة إلى خيارات مثل `debounce:2s cap:25 drop:summarize`.
- يعرض `/help` ملخص المساعدة القصير.
- يعرض `/commands` فهرس الأوامر المولّد.
- يعرض `/tools [compact|verbose]` ما الذي يمكن للوكيل الحالي استخدامه الآن.
- يعرض `/status` حالة وقت التشغيل، بما في ذلك التسميات `Runtime`/`Runner` واستخدام المزوّد/الحصة عند توفرها.
- يسرد `/tasks` المهام الخلفية النشطة/الأخيرة للجلسة الحالية.
- يشرح `/context [list|detail|json]` كيفية تجميع السياق.
- يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
- يصدّر `/export-trajectory [path]` [حزمة trajectory](/ar/tools/trajectory) بصيغة JSONL للجلسة الحالية. الاسم المستعار: `/trajectory`.
- يعرض `/whoami` معرّف المرسل الخاص بك. الاسم المستعار: `/id`.
- يشغّل `/skill <name> [input]` Skill بالاسم.
- يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
- يحل `/approve <id> <decision>` طلبات الموافقة على exec.
- يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة في المستقبل. راجع [/tools/btw](/ar/tools/btw).
- يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
- يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
- يربط `/focus <target>` خيط Discord الحالي أو موضوع/محادثة Telegram بهدف جلسة.
- يزيل `/unfocus` الربط الحالي.
- يسرد `/agents` الوكلاء المرتبطين بالخيط للجلسة الحالية.
- يوقف `/kill <id|#|all>` وكيلًا فرعيًا واحدًا أو جميع الوكلاء الفرعيين قيد التشغيل.
- يرسل `/steer <id|#> <message>` توجيهًا إلى وكيل فرعي قيد التشغيل. الاسم المستعار: `/tell`.
- يقرأ `/config show|get|set|unset` الملف `openclaw.json` أو يكتبه. للمالك فقط. ويتطلب `commands.config: true`.
- يقرأ `/mcp show|get|set|unset` إعداد خادم MCP الذي يديره OpenClaw تحت `mcp.servers` أو يكتبه. للمالك فقط. ويتطلب `commands.mcp: true`.
- يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يغيّرها. و`/plugin` اسم مستعار. الكتابة للمالك فقط. ويتطلب `commands.plugins: true`.
- يدير `/debug show|set|unset|reset` تجاوزات الإعداد الخاصة بوقت التشغيل فقط. للمالك فقط. ويتطلب `commands.debug: true`.
- يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل رد أو يطبع ملخص تكلفة محليًا.
- يتحكم `/tts on|off|status|provider|limit|summary|audio|help` في TTS. راجع [/tools/tts](/ar/tools/tts).
- يعيد `/restart` تشغيل OpenClaw عندما يكون مفعّلًا. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
- يضبط `/activation mention|always` وضع التفعيل للمجموعة.
- يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.
- يشغّل `/bash <command>` أمر shell على المضيف. نصي فقط. الاسم المستعار: `! <command>`. ويتطلب `commands.bash: true` بالإضافة إلى قوائم سماح `tools.elevated`.
- يفحص `!poll [sessionId]` مهمة bash في الخلفية.
- يوقف `!stop [sessionId]` مهمة bash في الخلفية.

### أوامر dock المولّدة

تُولَّد أوامر Dock من إضافات القنوات التي تدعم الأوامر الأصلية. المجموعة المجمّعة الحالية:

- `/dock-discord` (الاسم المستعار: `/dock_discord`)
- `/dock-mattermost` (الاسم المستعار: `/dock_mattermost`)
- `/dock-slack` (الاسم المستعار: `/dock_slack`)
- `/dock-telegram` (الاسم المستعار: `/dock_telegram`)

### أوامر Plugin المجمّعة

يمكن للإضافات المجمّعة إضافة مزيد من أوامر الشرطة المائلة. أوامر الحزم المجمّعة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق اقتران/إعداد الأجهزة. راجع [الاقتران](/ar/channels/pairing).
- يقوم `/phone status|arm <camera|screen|writes|all> [duration]|disarm` بتسليح أوامر Node الهاتف عالية الخطورة مؤقتًا.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعدادات صوت Talk. في Discord، يكون اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` الإعدادات المسبقة للبطاقات الغنية في LINE. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|account|mcp|skills` ويضبط harness خادم التطبيق Codex المجمّع. راجع [Codex Harness](/ar/plugins/codex-harness).
- أوامر QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرَّض Skills القابلة للاستدعاء من المستخدم أيضًا كأوامر slash:

- يعمل `/skill <name> [input]` دائمًا كنقطة الدخول العامة.
- قد تظهر Skills أيضًا كأوامر مباشرة مثل `/prose` عندما يقوم الـ Skill/Plugin بتسجيلها.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.

ملاحظات:

- تقبل الأوامر وجود `:` اختياريًا بين الأمر والوسائط (مثل `/think: high` و`/send: on` و`/help:`).
- يقبل `/new <model>` اسمًا مستعارًا للنموذج، أو `provider/model`، أو اسم مزوّد (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، فسيُعامل النص على أنه متن الرسالة.
- للحصول على تفصيل كامل لاستخدام المزوّد، استخدم `openclaw status --usage`.
- يتطلب `/allowlist add|remove` القيمة `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
- في القنوات متعددة الحسابات، تحترم أيضًا الأوامر `/allowlist --account <id>` الموجّهة للإعداد و`/config set channels.<provider>.accounts.<id>...` قيمة `configWrites` الخاصة بالحساب المستهدف.
- يتحكم `/usage` في تذييل الاستخدام لكل رد؛ بينما يطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
- يكون `/restart` مفعّلًا افتراضيًا؛ اضبط `commands.restart: false` لتعطيله.
- يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
- يقوم `/plugins enable|disable` بتحديث إعداد Plugin وقد يطالب بإعادة تشغيل.
- أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في القنوات الصوتية (يتطلب `channels.discord.voice` والأوامر الأصلية؛ وغير متاح كنص).
- تتطلب أوامر ربط الخيوط في Discord (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) تفعيل ربط الخيوط الفعلي (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
- مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).
- الغرض من `/verbose` هو التصحيح وزيادة الوضوح؛ أبقه **معطّلًا** في الاستخدام العادي.
- `/trace` أضيق نطاقًا من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin ويُبقي ضجيج الأدوات العادي في الوضع المطوّل معطّلًا.
- يستمر `/fast on|off` كتجاوز على مستوى الجلسة. استخدم خيار `inherit` في واجهة Sessions لمسحه والعودة إلى إعدادات config الافتراضية.
- يكون `/fast` خاصًا بالمزوّد: حيث يربطه OpenAI/OpenAI Codex مع `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك الحركة الموثقة عبر OAuth المرسلة إلى `api.anthropic.com`، مع `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
- لا تزال ملخصات إخفاق الأدوات تُعرض عند الاقتضاء، لكن نص الإخفاق المفصل لا يُضمَّن إلا عندما يكون `/verbose` على `on` أو `full`.
- تُعد `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات: فقد تكشف عن الاستدلال الداخلي، أو مخرجات الأدوات، أو تشخيصات Plugin التي لم تكن تقصد كشفها. ومن الأفضل إبقاؤها معطلة، خصوصًا في دردشات المجموعات.
- يحفظ `/model` نموذج الجلسة الجديد فورًا.
- إذا كان الوكيل في وضع الخمول، فسيستخدمه التشغيل التالي مباشرة.
- إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw تبديلًا مباشرًا معلّقًا ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأداة أو مخرجات الرد قد بدأت بالفعل، فقد يظل التبديل المعلق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
- **المسار السريع:** تُعالج الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح فورًا (تتجاوز قائمة الانتظار + النموذج).
- **تقييد الإشارة في المجموعات:** تتجاوز الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح متطلبات الإشارة.
- **الاختصارات المضمّنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل بعض الأوامر أيضًا عندما تكون مضمنة في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
  - مثال: يؤدي `hey /status` إلى رد بالحالة، ويستمر النص المتبقي عبر التدفق العادي.
- حاليًا: `/help` و`/commands` و`/status` و`/whoami` (`/id`).
- تُتجاهل الرسائل التي تحتوي على أوامر فقط من غير المصرّح لهم بصمت، وتُعامل رموز `/...` المضمّنة كنص عادي.
- **أوامر Skills:** تُعرَض Skills التي تحمل `user-invocable` كأوامر slash. وتُنظَّف الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية (مثل `_2`).
  - يشغّل `/skill <name> [input]` Skill بالاسم (وهو مفيد عندما تمنع حدود الأوامر الأصلية وجود أوامر لكل Skill).
  - افتراضيًا، تُمرر أوامر Skills إلى النموذج كطلب عادي.
  - يمكن لـ Skills اختياريًا إعلان `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، دون نموذج).
  - مثال: `/prose` (Plugin OpenProse) — راجع [OpenProse](/ar/prose).
- **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عندما تحذف الوسائط المطلوبة). ويعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر اختيارات وتُسقط الوسيطة.

## `/tools`

يجيب `/tools` عن سؤال وقت تشغيل، لا عن سؤال إعداد: **ما الذي يمكن لهذا الوكيل استخدامه الآن
في هذه المحادثة**.

- يكون `/tools` الافتراضي موجزًا ومهيأً للمسح السريع.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تكشف الأسطح ذات الأوامر الأصلية التي تدعم الوسائط عن مفتاح الوضع نفسه بوصفه `compact|verbose`.
- تكون النتائج ضمن نطاق الجلسة، لذلك قد يؤدي تغيير الوكيل أو القناة أو الخيط أو تخويل المرسل أو النموذج إلى
  تغيير المخرجات.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعليًا وقت التشغيل، بما في ذلك الأدوات الأساسية، والأدوات المتصلة
  المملوكة لـ Plugin، والأدوات المملوكة للقنوات.

لتحرير ملفات التعريف والتجاوزات، استخدم لوحة Tools في Control UI أو أسطح config/catalog بدلًا
من التعامل مع `/tools` على أنه فهرس ثابت.

## أسطح الاستخدام (ما الذي يظهر وأين)

- **استخدام/حصة المزوّد** (مثال: “Claude 80% left”) يظهر في `/status` لمزوّد النموذج الحالي عندما يكون تتبع الاستخدام مفعّلًا. ويطبّع OpenClaw نوافذ المزوّدين إلى `% left`؛ وبالنسبة إلى MiniMax، تُعكس حقول النسبة المئوية التي تحتوي على المتبقي فقط قبل العرض، كما أن استجابات `model_remains` تفضّل إدخال نموذج الدردشة بالإضافة إلى تسمية الخطة الموسومة بالنموذج.
- قد تعود **أسطر الرمز/التخزين المؤقت** في `/status` إلى أحدث إدخال استخدام في النص عندما تكون لقطة الجلسة الحية فقيرة. وتظل القيم الحية غير الصفرية القائمة هي الفائزة، كما يمكن أن يستعيد الرجوع إلى النص أيضًا تسمية نموذج وقت التشغيل النشط بالإضافة إلى إجمالي أكبر موجه إلى prompt عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **وقت التشغيل مقابل المشغّل:** يبلّغ `/status` عن `Runtime` لمسار التنفيذ الفعلي وحالة sandbox، وعن `Runner` للجهة التي تشغّل الجلسة فعليًا: Pi المضمن، أو مزود مدعوم بـ CLI، أو harness/backend خاص بـ ACP.
- يتم التحكم في **الرموز/التكلفة لكل رد** بواسطة `/usage off|tokens|full` (تُلحق بالردود العادية).
- يتعلق `/model status` بـ **النماذج/المصادقة/نقاط النهاية**، وليس بالاستخدام.

## اختيار النموذج (`/model`)

يُنفَّذ `/model` كتوجيه.

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

- يعرض `/model` و`/model list` منتقيًا موجزًا مرقّمًا (عائلة النموذج + المزوّدات المتاحة).
- في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للمزوّد والنموذج بالإضافة إلى خطوة Submit.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزوّد الحالي عندما يكون ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزوّد المُعدّة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح `/debug` ضبط تجاوزات config **خاصة بوقت التشغيل فقط** (في الذاكرة، وليس على القرص). للمالك فقط. وهو معطّل افتراضيًا؛ قم بتمكينه باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

ملاحظات:

- تُطبّق التجاوزات فورًا على قراءات config الجديدة، لكنها لا تكتب إلى `openclaw.json`.
- استخدم `/debug reset` لمسح كل التجاوزات والعودة إلى config الموجود على القرص.

## مخرجات تتبع Plugin

يتيح لك `/trace` تبديل **أسطر تتبع/تصحيح Plugin ضمن نطاق الجلسة** دون تشغيل الوضع المطوّل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` دون وسيطة حالة التتبع الحالية للجلسة.
- يفعّل `/trace on` أسطر تتبع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبع Plugin في `/status` وكـ رسالة تشخيصية لاحقة بعد رد المساعد العادي.
- لا يستبدل `/trace` الأمر `/debug`؛ إذ يظل `/debug` مسؤولًا عن تجاوزات config الخاصة بوقت التشغيل فقط.
- لا يستبدل `/trace` الأمر `/verbose`؛ إذ تظل مخرجات الأدوات/الحالة العادية في الوضع المطوّل تابعة لـ `/verbose`.

## تحديثات الإعداد

يكتب `/config` إلى config الموجود على القرص (`openclaw.json`). للمالك فقط. وهو معطّل افتراضيًا؛ قم بتمكينه باستخدام `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

ملاحظات:

- يتم التحقق من صحة config قبل الكتابة؛ وتُرفض التغييرات غير الصالحة.
- تستمر تحديثات `/config` عبر عمليات إعادة التشغيل.

## تحديثات MCP

يكتب `/mcp` تعريفات خادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. وهو معطّل افتراضيًا؛ قم بتمكينه باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

ملاحظات:

- يخزن `/mcp` config في إعداد OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi.
- تحدد محولات وقت التشغيل وسائل النقل القابلة للتنفيذ فعليًا.

## تحديثات Plugin

يتيح `/plugins` للمشغلين فحص الإضافات المكتشفة وتبديل حالة التمكين في config. ويمكن لتدفقات القراءة فقط استخدام `/plugin` كاسم مستعار. وهو معطّل افتراضيًا؛ قم بتمكينه باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

ملاحظات:

- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin حقيقيًا مقابل مساحة العمل الحالية بالإضافة إلى config الموجود على القرص.
- يقوم `/plugins enable|disable` بتحديث config الخاص بـ Plugin فقط؛ ولا يثبت أو يزيل تثبيت الإضافات.
- بعد تغييرات التمكين/التعطيل، أعد تشغيل Gateway لتطبيقها.

## ملاحظات السطح

- تعمل **الأوامر النصية** في جلسة الدردشة العادية (تشارك الرسائل المباشرة `main`، وتمتلك المجموعات جلستها الخاصة).
- تستخدم **الأوامر الأصلية** جلسات معزولة:
  - Discord: ‏`agent:<agentId>:discord:slash:<userId>`
  - Slack: ‏`agent:<agentId>:slack:slash:<userId>` (يمكن ضبط البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: ‏`telegram:slash:<userId>` (يستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
- يستهدف **`/stop`** جلسة الدردشة النشطة حتى يتمكن من إيقاف التشغيل الحالي.
- **Slack:** لا يزال `channels.slack.slashCommand` مدعومًا لأمر واحد على نمط `/openclaw`. وإذا فعّلت `commands.native`، فيجب إنشاء أمر slash واحد في Slack لكل أمر مضمّن (بالأسماء نفسها مثل `/help`). وتُسلَّم قوائم وسائط الأوامر في Slack كأزرار Block Kit مؤقتة.
  - استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحتفظ بـ `/status`. ولا يزال `/status` النصي يعمل في رسائل Slack.

## أسئلة BTW الجانبية

يمثل `/btw` **سؤالًا جانبيًا** سريعًا حول الجلسة الحالية.

وعلى عكس الدردشة العادية:

- فهو يستخدم الجلسة الحالية كسياق خلفي،
- ويعمل كاستدعاء منفصل **من دون أدوات** لمرة واحدة،
- ولا يغيّر سياق الجلسة المستقبلي،
- ولا يُكتب في سجل النص،
- ويُسلَّم كنتيجة جانبية حية بدلًا من رسالة مساعد عادية.

وهذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر
المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للحصول على السلوك الكامل وتفاصيل
تجربة العميل.
