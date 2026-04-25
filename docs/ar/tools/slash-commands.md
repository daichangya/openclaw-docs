---
read_when:
    - استخدام أو تهيئة أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، والتهيئة، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-04-25T14:00:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

تتولى Gateway معالجة الأوامر. ويجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`.
أما أمر bash الخاص بالدردشة على المضيف فقط فيستخدم `! <cmd>` ‏(مع `\/bash <cmd>` كاسم بديل).

هناك نظامان مرتبطان:

- **الأوامر**: رسائل `/...` مستقلة.
- **التوجيهات**: ‏`/think` و`/fast` و`/verbose` و`/trace` و`/reasoning` و`/elevated` و`/exec` و`/model` و`/queue`.
  - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
  - في رسائل الدردشة العادية (وليست رسائل توجيهات فقط)، تُعامل على أنها “تلميحات مضمّنة” ولا **تستمر** كإعدادات للجلسة.
  - في رسائل التوجيهات فقط (أي عندما تحتوي الرسالة على توجيهات فقط)، تستمر في الجلسة وترد بإقرار.
  - لا تُطبَّق التوجيهات إلا على **المرسلين المخوّلين**. وإذا تم تعيين `commands.allowFrom`، فإنه يكون
    allowlist الوحيدة المستخدمة؛ وإلا فتأتي الصلاحية من allowlists/pairing الخاصة بالقناة بالإضافة إلى `commands.useAccessGroups`.
    ويرى المرسلون غير المخولين التوجيهات كنص عادي.

هناك أيضًا بعض **الاختصارات المضمّنة** ‏(للمرسلين الموجودين في allowlist/المخوّلين فقط): ‏`/help` و`/commands` و`/status` و`/whoami` ‏(`\/id`).
تُشغَّل هذه مباشرة، وتُزال قبل أن يراها النموذج، ويستمر النص المتبقي عبر التدفق العادي.

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

- `commands.text` ‏(الافتراضي `true`) يفعّل تحليل `/...` في رسائل الدردشة.
  - وعلى الأسطح التي لا تحتوي على أوامر أصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تستمر الأوامر النصية في العمل حتى لو ضبطت هذا على `false`.
- `commands.native` ‏(الافتراضي `"auto"`) يسجّل الأوامر الأصلية.
  - Auto: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack ‏(إلى أن تضيف slash commands)؛ ويتم تجاهله لدى الموفّرين الذين لا يملكون دعمًا أصليًا.
  - اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` لتجاوز ذلك لكل موفّر (قيمة منطقية أو `"auto"`).
  - تؤدي القيمة `false` إلى مسح الأوامر المسجلة مسبقًا على Discord/Telegram عند بدء التشغيل. أما أوامر Slack فتُدار في تطبيق Slack ولا تُزال تلقائيًا.
- `commands.nativeSkills` ‏(الافتراضي `"auto"`) يسجّل أوامر **Skills** بشكل أصلي عندما يكون ذلك مدعومًا.
  - Auto: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack ‏(إذ يتطلب Slack إنشاء slash command لكل Skill).
  - اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` لتجاوز ذلك لكل موفّر (قيمة منطقية أو `"auto"`).
- `commands.bash` ‏(الافتراضي `false`) يفعّل `! <cmd>` لتشغيل أوامر shell على المضيف (`\/bash <cmd>` اسم بديل؛ ويتطلب allowlists الخاصة بـ `tools.elevated`).
- يتحكم `commands.bashForegroundMs` ‏(الافتراضي `2000`) في مدة انتظار bash قبل التحول إلى وضع الخلفية (`0` يرسل إلى الخلفية فورًا).
- `commands.config` ‏(الافتراضي `false`) يفعّل `/config` ‏(لقراءة/كتابة `openclaw.json`).
- `commands.mcp` ‏(الافتراضي `false`) يفعّل `/mcp` ‏(لقراءة/كتابة تهيئة MCP التي يديرها OpenClaw تحت `mcp.servers`).
- `commands.plugins` ‏(الافتراضي `false`) يفعّل `/plugins` ‏(اكتشاف/حالة Plugins بالإضافة إلى عناصر التحكم في التثبيت + التمكين/التعطيل).
- `commands.debug` ‏(الافتراضي `false`) يفعّل `/debug` ‏(تجاوزات لوقت التشغيل فقط).
- `commands.restart` ‏(الافتراضي `true`) يفعّل `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل gateway.
- يضبط `commands.ownerAllowFrom` ‏(اختياري) allowlist الصريحة للمالك لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. وهذا منفصل عن `commands.allowFrom`.
- يجعل `channels.<channel>.commands.enforceOwnerForCommands` لكل قناة ‏(اختياري، الافتراضي `false`) الأوامر الخاصة بالمالك تتطلب **هوية المالك** للعمل على ذلك السطح. وعندما تكون `true`، يجب أن يطابق المرسل إما مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو بيانات مالك أصلية لدى الموفّر) أو أن يملك النطاق الداخلي `operator.admin` على قناة رسائل داخلية. ولا تكون قيمة wildcard في `allowFrom` الخاصة بالقناة، أو قائمة مرشحي المالك الفارغة/غير المحلولة، **كافية** — إذ تفشل الأوامر الخاصة بالمالك بشكل مغلق على تلك القناة. اترك هذا الخيار معطّلًا إذا كنت تريد أن تكون الأوامر الخاصة بالمالك محكومة فقط بواسطة `ownerAllowFrom` وallowlists الأوامر القياسية.
- يتحكم `commands.ownerDisplay` في كيفية ظهور معرّفات المالك في system prompt: ‏`raw` أو `hash`.
- يضبط `commands.ownerDisplaySecret` اختياريًا سر HMAC المستخدم عندما تكون `commands.ownerDisplay="hash"`.
- يضبط `commands.allowFrom` ‏(اختياري) allowlist لكل موفّر من أجل تفويض الأوامر. وعند تهيئته، فإنه يكون
  مصدر التفويض الوحيد للأوامر والتوجيهات (ويتم تجاهل allowlists/pairing الخاصة بالقناة و`commands.useAccessGroups`).
  استخدم `"*"` كافتراضي عام؛ وتتجاوز المفاتيح الخاصة بكل موفّر ذلك.
- يفرض `commands.useAccessGroups` ‏(الافتراضي `true`) allowlists/السياسات على الأوامر عندما لا يكون `commands.allowFrom` مضبوطًا.

## قائمة الأوامر

المصدر الحالي المعتمد:

- تأتي الأوامر الأساسية المدمجة من `src/auto-reply/commands-registry.shared.ts`
- تأتي dock commands المُولَّدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugins من استدعاءات `registerCommand()` الخاصة بالـ Plugin
- لا يزال التوفر الفعلي على Gateway لديك يعتمد على أعلام التهيئة، وسطح القناة، والـ Plugins المثبتة/المفعلة

### الأوامر الأساسية المدمجة

الأوامر المدمجة المتاحة حاليًا:

- `\/new [model]` يبدأ جلسة جديدة؛ و`/reset` هو الاسم البديل لإعادة الضبط.
- `\/reset soft [message]` يحتفظ بالـ transcript الحالية، ويحذف معرّفات جلسات CLI backend المعاد استخدامها، ويعيد تشغيل تحميل startup/system-prompt في مكانها.
- `\/compact [instructions]` يضغط سياق الجلسة. راجع [/concepts/compaction](/ar/concepts/compaction).
- `\/stop` يوقف التشغيل الحالي.
- `\/session idle <duration|off>` و`/session max-age <duration|off>` يديران انتهاء صلاحية ربط السلسلة.
- `\/think <level>` يضبط مستوى التفكير. تأتي الخيارات من ملف تعريف الموفّر الخاص بالنموذج النشط؛ والمستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` و`adaptive` و`max` أو `on` الثنائية فقط حيثما كانت مدعومة. الأسماء البديلة: `/thinking` و`/t`.
- `\/verbose on|off|full` يبدّل الإخراج المفصل. الاسم البديل: `/v`.
- `\/trace on|off` يبدّل إخراج trace الخاص بالـ Plugin للجلسة الحالية.
- `\/fast [status|on|off]` يعرض أو يضبط الوضع السريع.
- `\/reasoning [on|off|stream]` يبدّل ظهور reasoning. الاسم البديل: `/reason`.
- `\/elevated [on|off|ask|full]` يبدّل الوضع elevated. الاسم البديل: `/elev`.
- `\/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` يعرض أو يضبط قيم exec الافتراضية.
- `\/model [name|#|status]` يعرض أو يضبط النموذج.
- `\/models [provider] [page] [limit=<n>|size=<n>|all]` يسرد الموفّرين أو النماذج الخاصة بموفّر ما.
- `\/queue <mode>` يدير سلوك queue ‏(`steer` و`interrupt` و`followup` و`collect` و`steer-backlog`) بالإضافة إلى خيارات مثل `debounce:2s cap:25 drop:summarize`.
- `\/help` يعرض ملخص المساعدة القصير.
- `\/commands` يعرض فهرس الأوامر المُولَّد.
- `\/tools [compact|verbose]` يعرض ما الذي يستطيع الوكيل الحالي استخدامه الآن.
- `\/status` يعرض حالة التنفيذ/runtime، بما في ذلك تسميات `Execution`/`Runtime` واستخدام/حصة الموفّر عند توفرها.
- `\/crestodian <request>` يشغّل مساعد الإعداد والإصلاح Crestodian من رسالة خاصة خاصة بالمالك.
- `\/tasks` يسرد المهام الخلفية النشطة/الحديثة للجلسة الحالية.
- `\/context [list|detail|json]` يشرح كيفية تجميع السياق.
- `\/export-session [path]` يصدّر الجلسة الحالية إلى HTML. الاسم البديل: `/export`.
- `\/export-trajectory [path]` يصدّر [trajectory bundle](/ar/tools/trajectory) بصيغة JSONL للجلسة الحالية. الاسم البديل: `/trajectory`.
- `\/whoami` يعرض معرّف المرسل الخاص بك. الاسم البديل: `/id`.
- `\/skill <name> [input]` يشغّل Skill بالاسم.
- `\/allowlist [list|add|remove] ...` يدير إدخالات allowlist. نصي فقط.
- `\/approve <id> <decision>` يحسم مطالبات موافقة exec.
- `\/btw <question>` يطرح سؤالًا جانبيًا من دون تغيير سياق الجلسة المستقبلي. راجع [/tools/btw](/ar/tools/btw).
- `\/subagents list|kill|log|info|send|steer|spawn` يدير تشغيلات الوكلاء الفرعيين للجلسة الحالية.
- `\/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` يدير جلسات ACP وخيارات runtime.
- `\/focus <target>` يربط سلسلة Discord الحالية أو topic/conversation الخاصة بـ Telegram بهدف جلسة.
- `\/unfocus` يزيل الربط الحالي.
- `\/agents` يسرد الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
- `\/kill <id|#|all>` يوقف وكيلًا فرعيًا واحدًا أو جميع الوكلاء الفرعيين الجاري تشغيلهم.
- `\/steer <id|#> <message>` يرسل توجيهًا إلى وكيل فرعي قيد التشغيل. الاسم البديل: `/tell`.
- `\/config show|get|set|unset` يقرأ أو يكتب `openclaw.json`. للمالك فقط. ويتطلب `commands.config: true`.
- `\/mcp show|get|set|unset` يقرأ أو يكتب تهيئة خادم MCP الذي يديره OpenClaw تحت `mcp.servers`. للمالك فقط. ويتطلب `commands.mcp: true`.
- `\/plugins list|inspect|show|get|install|enable|disable` يفحص أو يغيّر حالة Plugins. و`/plugin` اسم بديل. الكتابة للمالك فقط. ويتطلب `commands.plugins: true`.
- `\/debug show|set|unset|reset` يدير تجاوزات التهيئة الخاصة بوقت التشغيل فقط. للمالك فقط. ويتطلب `commands.debug: true`.
- `\/usage off|tokens|full|cost` يتحكم في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محليًا.
- `\/tts on|off|status|provider|limit|summary|audio|help` يتحكم في TTS. راجع [/tools/tts](/ar/tools/tts).
- `\/restart` يعيد تشغيل OpenClaw عندما يكون مفعّلًا. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
- `\/activation mention|always` يضبط وضع تفعيل المجموعات.
- `\/send on|off|inherit` يضبط send policy. للمالك فقط.
- `\/bash <command>` يشغّل أمر shell على المضيف. نصي فقط. الاسم البديل: `! <command>`. ويتطلب `commands.bash: true` بالإضافة إلى allowlists الخاصة بـ `tools.elevated`.
- `!poll [sessionId]` يتحقق من مهمة bash خلفية.
- `!stop [sessionId]` يوقف مهمة bash خلفية.

### أوامر dock المُولَّدة

يتم توليد dock commands من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المجمّعة الحالية:

- `\/dock-discord` ‏(الاسم البديل: `\/dock_discord`)
- `\/dock-mattermost` ‏(الاسم البديل: `\/dock_mattermost`)
- `\/dock-slack` ‏(الاسم البديل: `\/dock_slack`)
- `\/dock-telegram` ‏(الاسم البديل: `\/dock_telegram`)

### أوامر Plugins المجمّعة

يمكن لـ Plugins المجمّعة إضافة مزيد من slash commands. الأوامر المجمّعة الحالية في هذا المستودع:

- `\/dreaming [on|off|status|help]` يبدّل Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- `\/pair [qr|status|pending|approve|cleanup|notify]` يدير تدفق اقتران/إعداد الأجهزة. راجع [الاقتران](/ar/channels/pairing).
- `\/phone status|arm <camera|screen|writes|all> [duration]|disarm` يفعّل مؤقتًا أوامر node الخاصة بالهاتف عالية الخطورة.
- `\/voice status|list [limit]|set <voiceId|name>` يدير تهيئة صوت Talk. وعلى Discord، يكون اسم الأمر الأصلي هو `/talkvoice`.
- `\/card ...` يرسل إعدادات LINE rich card الجاهزة. راجع [LINE](/ar/channels/line).
- `\/codex status|models|threads|resume|compact|review|account|mcp|skills` يفحص ويتحكم في Codex app-server harness المجمّع. راجع [Codex Harness](/ar/plugins/codex-harness).
- أوامر QQBot فقط:
  - `\/bot-ping`
  - `\/bot-version`
  - `\/bot-help`
  - `\/bot-upgrade`
  - `\/bot-logs`

### أوامر Skills الديناميكية

تُعرَّض Skills القابلة للاستدعاء من المستخدم أيضًا كـ slash commands:

- يعمل `\/skill <name> [input]` دائمًا كنقطة دخول عامة.
- وقد تظهر Skills أيضًا كأوامر مباشرة مثل `\/prose` عندما تسجلها الـ Skill/Plugin.
- يتم التحكم في التسجيل الأصلي لأوامر Skills عبر `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills`.

ملاحظات:

- تقبل الأوامر وجود `:` اختياري بين الأمر والوسائط (مثل `\/think: high` و`/send: on` و`/help:`).
- يقبل `\/new <model>` اسمًا بديلًا للنموذج، أو `provider/model`، أو اسم موفّر (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامل النص على أنه نص الرسالة.
- للحصول على تفصيل كامل لاستخدام الموفّر، استخدم `openclaw status --usage`.
- يتطلب `\/allowlist add|remove` القيمة `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
- في القنوات متعددة الحسابات، تحترم أيضًا الأوامر `\/allowlist --account <id>` و`/config set channels.<provider>.accounts.<id>...` الخاصة بالتهيئة قيمة `configWrites` الخاصة بالحساب المستهدف.
- يتحكم `\/usage` في تذييل الاستخدام لكل استجابة؛ ويطبع `\/usage cost` ملخص تكلفة محليًا من سجلات جلسة OpenClaw.
- يكون `\/restart` مفعّلًا افتراضيًا؛ اضبط `commands.restart: false` لتعطيله.
- يقبل `\/plugins install <spec>` مواصفات Plugin نفسها كما في `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
- يحدّث `\/plugins enable|disable` تهيئة Plugin وقد يطالب بإعادة التشغيل.
- أمر أصلي خاص بـ Discord فقط: ‏`\/vc join|leave|status` للتحكم في قنوات الصوت (غير متاح كنص). ويتطلب `join` وجود guild وقناة صوت/stage محددة. ويتطلب `channels.discord.voice` والأوامر الأصلية.
- تتطلب أوامر ربط سلاسل Discord ‏(`\/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) أن تكون thread bindings الفعالة مفعّلة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
- مرجع أمر ACP وسلوك runtime: ‏[وكلاء ACP](/ar/tools/acp-agents).
- يُقصد بـ `\/verbose` تصحيح الأخطاء وزيادة الظهور؛ أبقه **معطّلًا** في الاستخدام العادي.
- إن `\/trace` أضيق من `\/verbose`: فهو يكشف فقط أسطر trace/debug المملوكة للـ Plugin ويبقي ضوضاء الأدوات العادية خارج verbose معطّلة.
- يستمر `\/fast on|off` كتجاوز للجلسة. استخدم خيار `inherit` في واجهة Sessions لمسحه والعودة إلى افتراضيات التهيئة.
- `\/fast` خاص بالموفّر: فكل من OpenAI/OpenAI Codex يربطه بالقيمة `service_tier=priority` على نقاط نهاية Responses الأصلية، في حين أن طلبات Anthropic العامة المباشرة، بما في ذلك الحركة المصادق عليها عبر OAuth المرسلة إلى `api.anthropic.com`، تربطه بـ `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
- لا تزال ملخصات فشل الأدوات تُعرض عند الصلة، لكن نص الفشل التفصيلي لا يُضمَّن إلا عندما تكون `\/verbose` على `on` أو `full`.
- إن `\/reasoning` و`\/verbose` و`\/trace` خطيرة في إعدادات المجموعات: فقد تكشف reasoning داخلية أو مخرجات أدوات أو تشخيصات Plugins لم تقصد عرضها. ويفضَّل تركها معطّلة، خاصةً في دردشات المجموعات.
- يحتفظ `\/model` بالنموذج الجديد للجلسة فورًا.
- إذا كان الوكيل في حالة خمول، يستخدم التشغيل التالي النموذج مباشرة.
- وإذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw التحويل الحي كتحويل معلّق ولا يعيد البدء بالنموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأدوات أو خرج الرد قد بدأ بالفعل، فقد يبقى التحويل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو حتى دورة المستخدم التالية.
- في TUI المحلية، يعيد `\/crestodian [request]` المستخدم من TUI العادية للوكيل إلى
  Crestodian. وهذا منفصل عن وضع الإنقاذ في قنوات الرسائل ولا
  يمنح سلطة تهيئة عن بُعد.
- **المسار السريع:** تتم معالجة الرسائل التي تحتوي أوامر فقط من المرسلين الموجودين في allowlist فورًا (تتجاوز queue + النموذج).
- **حجب الإشارات في المجموعات:** تتجاوز الرسائل التي تحتوي أوامر فقط من المرسلين الموجودين في allowlist متطلبات الإشارة.
- **الاختصارات المضمّنة (للمرسلين الموجودين في allowlist فقط):** تعمل بعض الأوامر أيضًا عندما تكون مضمنة في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
  - مثال: `hey /status` يطلق ردًا بالحالة، ويستمر النص المتبقي عبر التدفق العادي.
- حاليًا: `\/help` و`\/commands` و`\/status` و`\/whoami` ‏(`\/id`).
- يتم تجاهل الرسائل التي تحتوي أوامر فقط من غير المخولين بصمت، وتُعامل رموز `/...` المضمنة على أنها نص عادي.
- **أوامر Skills:** تُعرَّض Skills ‏`user-invocable` كأوامر slash. وتُعقَّم الأسماء إلى `a-z0-9_` ‏(حد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية (مثل `_2`).
  - `\/skill <name> [input]` يشغّل Skill بالاسم (وهو مفيد عندما تمنع حدود الأوامر الأصلية وجود أوامر لكل Skill).
  - افتراضيًا، يتم تمرير أوامر Skills إلى النموذج كطلب عادي.
  - يمكن للـ Skills أن تعلن اختياريًا عن `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
  - مثال: `\/prose` ‏(Plugin OpenProse) — راجع [OpenProse](/ar/prose).
- **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وأزرار القوائم عندما تحذف الوسائط المطلوبة). أما Telegram وSlack فيعرضان قائمة أزرار عندما يدعم الأمر اختيارات وتحذف الوسيطة. وتُحل الاختيارات الديناميكية مقابل نموذج الجلسة المستهدف، لذلك تتبع الخيارات الخاصة بالنموذج مثل مستويات `\/think` تجاوز `\/model` لتلك الجلسة.

## `\/tools`

تجيب `\/tools` عن سؤال runtime، وليس عن سؤال تهيئة: **ما الذي يستطيع هذا الوكيل استخدامه الآن في
هذه المحادثة**.

- تكون `\/tools` الافتراضية مختصرة ومهيأة للفحص السريع.
- يضيف `\/tools verbose` أوصافًا قصيرة.
- تعرّض أسطح الأوامر الأصلية التي تدعم الوسائط مفتاح الوضع نفسه `compact|verbose`.
- تكون النتائج على مستوى الجلسة، لذلك يمكن أن يؤدي تغيير الوكيل أو القناة أو السلسلة أو تفويض المرسل أو النموذج إلى
  تغيير الخرج.
- تتضمن `\/tools` الأدوات التي يمكن الوصول إليها فعلًا أثناء runtime، بما في ذلك الأدوات الأساسية، و
  أدوات Plugins المتصلة، والأدوات المملوكة للقنوات.

بالنسبة إلى تحرير الملفات الشخصية والتجاوزات، استخدم لوحة Tools في Control UI أو أسطح التهيئة/الفهرس بدلًا
من التعامل مع `\/tools` على أنها فهرس ثابت.

## أسطح الاستخدام (ما الذي يظهر وأين)

- **استخدام/حصة الموفّر** ‏(مثال: “Claude 80% left”) يظهر في `\/status` بالنسبة إلى موفّر النموذج الحالي عندما
  يكون تتبع الاستخدام مفعّلًا. ويقوم OpenClaw بتطبيع نوافذ الموفّرين إلى `% left`; وبالنسبة إلى MiniMax، تُعكس حقول النسبة المئوية التي تعرض المتبقي فقط قبل العرض، كما أن استجابات `model_remains` تفضّل إدخال نموذج الدردشة مع تسمية خطة موسومة بالنموذج.
- **أسطر token/cache** في `\/status` يمكن أن تعود إلى أحدث إدخال استخدام في transcript عندما تكون لقطة الجلسة الحية متناثرة. وتظل القيم الحية غير الصفرية الموجودة هي الفائزة، كما يمكن fallback الخاصة بالـ transcript أن تستعيد أيضًا تسمية النموذج النشط في runtime بالإضافة إلى إجمالي أكبر موجه للـ prompt عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **التنفيذ مقابل runtime:** يبلّغ `\/status` عن `Execution` لمسار sandbox الفعّال و`Runtime` لمن يدير الجلسة فعليًا: ‏`OpenClaw Pi Default`، أو `OpenAI Codex`، أو CLI backend، أو ACP backend.
- **الرموز/التكلفة لكل استجابة** يتحكم بها `\/usage off|tokens|full` ‏(تُلحق بالردود العادية).
- تتعلق `\/model status` بـ **النماذج/auth/نقاط النهاية**، وليس بالاستخدام.

## اختيار النموذج (`\/model`)

يتم تنفيذ `\/model` كتوجيه.

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

- يعرض `\/model` و`\/model list` منتقيًا مدمجًا ومرقّمًا (عائلة النموذج + الموفّرون المتاحون).
- على Discord، يفتح `\/model` و`\/models` منتقيًا تفاعليًا مع قوائم منسدلة للموفّر والنموذج بالإضافة إلى خطوة Submit.
- يختار `\/model <#>` من ذلك المنتقي (ويفضّل الموفّر الحالي عندما يكون ذلك ممكنًا).
- يعرض `\/model status` العرض التفصيلي، بما في ذلك نقطة نهاية الموفّر المهيأة (`baseUrl`) ووضع API ‏(`api`) عند توفرهما.

## تجاوزات debug

تتيح لك `\/debug` تعيين تجاوزات تهيئة **لوقت التشغيل فقط** ‏(في الذاكرة، وليس على القرص). للمالك فقط. وهي معطّلة افتراضيًا؛ فعّلها عبر `commands.debug: true`.

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
- استخدم `\/debug reset` لمسح جميع التجاوزات والعودة إلى التهيئة الموجودة على القرص.

## خرج trace الخاص بالـ Plugin

يتيح لك `\/trace` تبديل **أسطر trace/debug الخاصة بالـ Plugin على مستوى الجلسة** من دون تشغيل verbose الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `\/trace` من دون وسيطة حالة trace الحالية للجلسة.
- يفعّل `\/trace on` أسطر trace الخاصة بالـ Plugin للجلسة الحالية.
- يعطّلها `\/trace off` مرة أخرى.
- قد تظهر أسطر trace الخاصة بالـ Plugin في `\/status` وكرسالة تشخيص متابعة بعد رد المساعد العادي.
- لا تستبدل `\/trace` الأمر `\/debug`; إذ لا تزال `\/debug` تدير تجاوزات التهيئة الخاصة بوقت التشغيل فقط.
- ولا تستبدل `\/trace` الأمر `\/verbose`; إذ لا يزال خرج الأدوات/الحالة العادي المفصل ينتمي إلى `\/verbose`.

## تحديثات التهيئة

يكتب `\/config` إلى التهيئة الموجودة على القرص (`openclaw.json`). للمالك فقط. وهو معطّل افتراضيًا؛ فعّله عبر `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

ملاحظات:

- يتم التحقق من التهيئة قبل الكتابة؛ وتُرفض التغييرات غير الصالحة.
- تستمر تحديثات `\/config` عبر عمليات إعادة التشغيل.

## تحديثات MCP

يكتب `\/mcp` تعريفات خوادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. وهو معطّل افتراضيًا؛ فعّله عبر `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

ملاحظات:

- يخزن `\/mcp` التهيئة في تهيئة OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi.
- تقرر محولات runtime أي وسائل النقل تكون قابلة للتنفيذ فعلًا.

## تحديثات Plugins

يتيح `\/plugins` للمشغّلين فحص Plugins المكتشفة وتبديل التمكين في التهيئة. ويمكن للتدفقات المخصصة للقراءة فقط استخدام `\/plugin` كاسم بديل. وهو معطّل افتراضيًا؛ فعّله عبر `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

ملاحظات:

- يستخدم `\/plugins list` و`\/plugins show` اكتشافًا حقيقيًا للـ Plugins مقابل مساحة العمل الحالية والتهيئة الموجودة على القرص.
- يحدّث `\/plugins enable|disable` تهيئة Plugin فقط؛ وهو لا يثبت أو يلغي تثبيت Plugins.
- بعد تغييرات enable/disable، أعد تشغيل gateway لتطبيقها.

## ملاحظات السطح

- **الأوامر النصية** تعمل في جلسة الدردشة العادية (تتشارك الرسائل الخاصة `main`، بينما تملك المجموعات جلساتها الخاصة).
- **الأوامر الأصلية** تستخدم جلسات معزولة:
  - Discord: ‏`agent:<agentId>:discord:slash:<userId>`
  - Slack: ‏`agent:<agentId>:slack:slash:<userId>` ‏(تكون البادئة قابلة للتهيئة عبر `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: ‏`telegram:slash:<userId>` ‏(تستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
- يستهدف **`\/stop`** جلسة الدردشة النشطة حتى يتمكن من إيقاف التشغيل الحالي.
- **Slack:** لا تزال `channels.slack.slashCommand` مدعومة من أجل أمر واحد بنمط `/openclaw`. وإذا فعّلت `commands.native`، فيجب إنشاء أمر slash واحد في Slack لكل أمر مدمج (بالأسماء نفسها مثل `/help`). ويتم تسليم قوائم وسائط الأوامر في Slack كأزرار Block Kit مؤقتة.
  - استثناء Slack الأصلي: سجّل `/agentstatus` ‏(وليس `/status`) لأن Slack تحتفظ بـ `/status`. ولا يزال النص `/status` يعمل في رسائل Slack.

## أسئلة BTW الجانبية

إن `\/btw` هو **سؤال جانبي** سريع حول الجلسة الحالية.

وخلافًا للدردشة العادية:

- فإنه يستخدم الجلسة الحالية كسياق خلفي،
- ويعمل كاستدعاء منفصل **من دون أدوات** لمرة واحدة،
- ولا يغيّر سياق الجلسة المستقبلي،
- ولا يُكتب إلى سجل transcript،
- ويُسلَّم كنتيجة جانبية حية بدلًا من رسالة مساعد عادية.

وهذا يجعل `\/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر
المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للاطلاع على السلوك الكامل وتفاصيل
تجربة العميل.

## ذو صلة

- [Skills](/ar/tools/skills)
- [تهيئة Skills](/ar/tools/skills-config)
- [إنشاء Skills](/ar/tools/creating-skills)
