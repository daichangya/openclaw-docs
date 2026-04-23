---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - تصحيح توجيه الأوامر أو الأذونات
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، والإعدادات، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-04-23T07:34:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f6b454afa77cf02b2c307efcc99ef35d002cb560c427affaf03ac12b2b666e8
    source_path: tools/slash-commands.md
    workflow: 15
---

# أوامر الشرطة المائلة

تُعالَج الأوامر بواسطة Gateway. ويجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`.
أما أمر دردشة bash الخاص بالمضيف فقط فيستخدم `! <cmd>` ‏(مع وجود `/bash <cmd>` كاسم بديل).

هناك نظامان مترابطان:

- **الأوامر**: رسائل مستقلة من نوع `/...`.
- **التوجيهات**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
  - في رسائل الدردشة العادية (وليست رسائل توجيهات فقط)، تُعامل على أنها “تلميحات مضمّنة” ولا **تستمر** كإعدادات للجلسة.
  - في رسائل التوجيهات فقط (عندما تحتوي الرسالة على توجيهات فقط)، فإنها تستمر في الجلسة وترد بإقرار.
  - لا تُطبَّق التوجيهات إلا على **المرسلين المصرّح لهم**. إذا كانت `commands.allowFrom` مضبوطة، فهي قائمة
    السماح الوحيدة المستخدمة؛ وإلا تأتي المصادقة من قوائم السماح/الاقتران الخاصة بالقناة بالإضافة إلى `commands.useAccessGroups`.
    ويرى المرسلون غير المصرّح لهم التوجيهات على أنها نص عادي.

كما توجد بعض **الاختصارات المضمّنة** (للمرسلين المدرجين في قائمة السماح/المصرّح لهم فقط): `/help`, `/commands`, `/status`, `/whoami` ‏(`/id`).
تُشغَّل هذه فورًا، وتُزال قبل أن يراها النموذج، ويستمر النص المتبقي عبر التدفق العادي.

## الإعدادات

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

- `commands.text` ‏(الافتراضي `true`) يفعّل تحليل `/...` داخل رسائل الدردشة.
  - على الأسطح التي لا تدعم الأوامر الأصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، ستظل الأوامر النصية تعمل حتى إذا ضبطت هذه القيمة على `false`.
- `commands.native` ‏(الافتراضي `"auto"`) يسجل الأوامر الأصلية.
  - Auto: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack (حتى تضيف slash commands)؛ ويتم تجاهله للمزوّدين الذين لا يدعمون الأوامر الأصلية.
  - اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل مزوّد (قيمة منطقية أو `"auto"`).
  - تؤدي القيمة `false` إلى مسح الأوامر المسجلة سابقًا على Discord/Telegram عند بدء التشغيل. أما أوامر Slack فتُدار في تطبيق Slack ولا تُزال تلقائيًا.
- `commands.nativeSkills` ‏(الافتراضي `"auto"`) يسجل أوامر **Skills** بشكل أصلي عند الدعم.
  - Auto: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack (يتطلب Slack إنشاء slash command لكل Skill).
  - اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل مزوّد (قيمة منطقية أو `"auto"`).
- `commands.bash` ‏(الافتراضي `false`) يفعّل `! <cmd>` لتشغيل أوامر shell على المضيف (`/bash <cmd>` اسم بديل؛ ويتطلب قوائم سماح `tools.elevated`).
- يتحكم `commands.bashForegroundMs` ‏(الافتراضي `2000`) في مدة انتظار bash قبل التحول إلى الوضع الخلفي (`0` ينقله إلى الخلفية فورًا).
- `commands.config` ‏(الافتراضي `false`) يفعّل `/config` ‏(لقراءة/كتابة `openclaw.json`).
- `commands.mcp` ‏(الافتراضي `false`) يفعّل `/mcp` ‏(لقراءة/كتابة إعدادات MCP التي يديرها OpenClaw تحت `mcp.servers`).
- `commands.plugins` ‏(الافتراضي `false`) يفعّل `/plugins` ‏(اكتشاف Plugins/حالتها بالإضافة إلى عناصر التحكم في التثبيت + التمكين/التعطيل).
- `commands.debug` ‏(الافتراضي `false`) يفعّل `/debug` ‏(تجاوزات وقت التشغيل فقط).
- `commands.restart` ‏(الافتراضي `true`) يفعّل `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل gateway.
- `commands.ownerAllowFrom` ‏(اختياري) يضبط قائمة السماح الصريحة الخاصة بالمالك لأسطح الأوامر/الأدوات المخصصة للمالك فقط. وهذا منفصل عن `commands.allowFrom`.
- تجعل القيمة `channels.<channel>.commands.enforceOwnerForCommands` لكل قناة ‏(اختيارية، الافتراضي `false`) الأوامر الخاصة بالمالك فقط تتطلب **هوية المالك** للتشغيل على ذلك السطح. عندما تكون `true`، يجب أن يطابق المرسل إما مرشح مالك محلولًا (على سبيل المثال إدخالًا في `commands.ownerAllowFrom` أو بيانات مالك أصلية خاصة بالمزوّد) أو أن يحمل النطاق الداخلي `operator.admin` على قناة رسائل داخلية. ولا يكفي إدخال wildcard في `allowFrom` الخاصة بالقناة، أو قائمة مرشحي مالك فارغة/غير محلولة — إذ تفشل الأوامر الخاصة بالمالك فقط بشكل مغلق على تلك القناة. اترك هذا معطّلًا إذا كنت تريد أن تكون الأوامر الخاصة بالمالك فقط مقيّدة بـ `ownerAllowFrom` وقوائم السماح القياسية للأوامر فقط.
- يتحكم `commands.ownerDisplay` في كيفية ظهور معرّفات المالك في system prompt: ‏`raw` أو `hash`.
- يضبط `commands.ownerDisplaySecret` اختياريًا سر HMAC المستخدم عندما تكون `commands.ownerDisplay="hash"`.
- تضبط `commands.allowFrom` ‏(اختيارية) قائمة سماح لكل مزوّد لمصادقة الأوامر. عند تكوينها، تكون
  المصدر الوحيد للمصادقة بالنسبة إلى الأوامر والتوجيهات (ويتم تجاهل قوائم السماح/الاقتران الخاصة بالقناة و`commands.useAccessGroups`).
  استخدم `"*"` كافتراضي عام؛ وتتجاوز المفاتيح الخاصة بكل مزوّد هذا الافتراضي.
- تفرض `commands.useAccessGroups` ‏(الافتراضي `true`) قوائم السماح/السياسات على الأوامر عندما لا تكون `commands.allowFrom` مضبوطة.

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي الأوامر الأساسية المضمنة من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المولدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` الخاصة بالPlugin
- لا يزال التوفر الفعلي على Gateway الخاصة بك يعتمد على أعلام الإعدادات، وسطح القناة، وPlugins المثبتة/المفعّلة

### الأوامر الأساسية المضمنة

الأوامر المضمنة المتاحة اليوم:

- `/new [model]` يبدأ جلسة جديدة؛ و`/reset` هو الاسم البديل لإعادة التعيين.
- `/reset soft [message]` يحتفظ بالنص الحالي، ويسقط معرّفات جلسات الواجهة الخلفية لـ CLI المعاد استخدامها، ويعيد تشغيل تحميل startup/system-prompt في مكانه.
- `/compact [instructions]` يقوم بـ Compaction لسياق الجلسة. راجع [/concepts/compaction](/ar/concepts/compaction).
- `/stop` يوقف التشغيل الحالي.
- يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء ارتباط السلسلة.
- يضبط `/think <level>` مستوى التفكير. تأتي الخيارات من ملف تعريف المزوّد الخاص بالنموذج النشط؛ والمستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` و`adaptive` و`max` أو `on` الثنائي فقط حيثما كان ذلك مدعومًا. الأسماء البديلة: `/thinking`, `/t`.
- يبدّل `/verbose on|off|full` المخرجات المطولة. الاسم البديل: `/v`.
- يبدّل `/trace on|off` خرج تتبع Plugin للجلسة الحالية.
- يعرض `/fast [status|on|off]` الوضع السريع أو يضبطه.
- يبدّل `/reasoning [on|off|stream]` إظهار الاستدلال. الاسم البديل: `/reason`.
- يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم البديل: `/elev`.
- يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` إعدادات exec الافتراضية أو يضبطها.
- يعرض `/model [name|#|status]` النموذج أو يضبطه.
- يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` المزوّدين أو النماذج الخاصة بمزوّد ما.
- يدير `/queue <mode>` سلوك الطابور (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) بالإضافة إلى خيارات مثل `debounce:2s cap:25 drop:summarize`.
- يعرض `/help` ملخص المساعدة المختصر.
- يعرض `/commands` فهرس الأوامر المولّد.
- يعرض `/tools [compact|verbose]` ما الذي يمكن للوكيل الحالي استخدامه الآن.
- يعرض `/status` حالة وقت التشغيل، بما في ذلك استخدام المزوّد/الحصة عند توفرها.
- يسرد `/tasks` المهام الخلفية النشطة/الأخيرة للجلسة الحالية.
- يشرح `/context [list|detail|json]` كيفية تجميع السياق.
- يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم البديل: `/export`.
- يصدّر `/export-trajectory [path]` ‏[trajectory bundle](/ar/tools/trajectory) بصيغة JSONL للجلسة الحالية. الاسم البديل: `/trajectory`.
- يعرض `/whoami` معرّف المرسل الخاص بك. الاسم البديل: `/id`.
- يشغّل `/skill <name> [input]` Skill بالاسم.
- يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
- يحل `/approve <id> <decision>` مطالبات موافقة exec.
- يطرح `/btw <question>` سؤالًا جانبيًا من دون تغيير سياق الجلسة في المستقبل. راجع [/tools/btw](/ar/tools/btw).
- يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
- يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
- يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
- يزيل `/unfocus` الارتباط الحالي.
- يعرض `/agents` الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
- يوقف `/kill <id|#|all>` وكيلًا فرعيًا واحدًا أو جميع الوكلاء الفرعيين الجاري تشغيلهم.
- يرسل `/steer <id|#> <message>` توجيهًا إلى وكيل فرعي قيد التشغيل. الاسم البديل: `/tell`.
- يقرأ `/config show|get|set|unset` أو يكتب `openclaw.json`. للمالك فقط. ويتطلب `commands.config: true`.
- يقرأ `/mcp show|get|set|unset` أو يكتب إعدادات خادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. ويتطلب `commands.mcp: true`.
- يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يغيّرها. و`/plugin` اسم بديل. عمليات الكتابة للمالك فقط. ويتطلب `commands.plugins: true`.
- يدير `/debug show|set|unset|reset` تجاوزات الإعدادات الخاصة بوقت التشغيل فقط. للمالك فقط. ويتطلب `commands.debug: true`.
- يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محلي.
- يتحكم `/tts on|off|status|provider|limit|summary|audio|help` في TTS. راجع [/tools/tts](/ar/tools/tts).
- يعيد `/restart` تشغيل OpenClaw عند التمكين. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
- يضبط `/activation mention|always` وضع التفعيل في المجموعات.
- يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.
- يشغّل `/bash <command>` أمر shell على المضيف. نصي فقط. الاسم البديل: `! <command>`. ويتطلب `commands.bash: true` بالإضافة إلى قوائم سماح `tools.elevated`.
- يتحقق `!poll [sessionId]` من مهمة bash خلفية.
- يوقف `!stop [sessionId]` مهمة bash خلفية.

### أوامر dock المولّدة

تُولَّد أوامر Dock من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمنة الحالية:

- `/dock-discord` ‏(الاسم البديل: `/dock_discord`)
- `/dock-mattermost` ‏(الاسم البديل: `/dock_mattermost`)
- `/dock-slack` ‏(الاسم البديل: `/dock_slack`)
- `/dock-telegram` ‏(الاسم البديل: `/dock_telegram`)

### أوامر Plugins المضمنة

يمكن لـ Plugins المضمنة إضافة المزيد من slash commands. الأوامر المضمنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` memory dreaming. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق اقتران/إعداد الأجهزة. راجع [الاقتران](/ar/channels/pairing).
- يسلّح `/phone status|arm <camera|screen|writes|all> [duration]|disarm` أوامر node عالية الخطورة الخاصة بالهاتف مؤقتًا.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعدادات صوت Talk. وفي Discord يكون اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات LINE rich card المسبقة. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|account|mcp|skills` ويضبط Codex app-server harness المضمن. راجع [Codex Harness](/ar/plugins/codex-harness).
- أوامر خاصة بـ QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُكشف Skills القابلة للاستدعاء من المستخدم أيضًا كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- قد تظهر Skills أيضًا كأوامر مباشرة مثل `/prose` عندما تسجلها Skill/Plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.

ملاحظات:

- تقبل الأوامر وجود `:` اختياري بين الأمر والمعاملات (مثل `/think: high`, `/send: on`, `/help:`).
- يقبل `/new <model>` اسمًا بديلًا للنموذج، أو `provider/model`، أو اسم مزوّد (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامل النص على أنه جسم الرسالة.
- للحصول على تفصيل كامل لاستخدام المزوّد، استخدم `openclaw status --usage`.
- يتطلب `/allowlist add|remove` القيمة `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
- في القنوات متعددة الحسابات، تحترم أيضًا أوامر `/allowlist --account <id>` الموجهة للإعدادات و`/config set channels.<provider>.accounts.<id>...` قيمة `configWrites` الخاصة بالحساب الهدف.
- يتحكم `/usage` في تذييل الاستخدام لكل استجابة؛ ويطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
- يكون `/restart` مفعّلًا افتراضيًا؛ اضبط `commands.restart: false` لتعطيله.
- يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
- يحدّث `/plugins enable|disable` إعدادات Plugin وقد يطلب إعادة تشغيل.
- أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في القنوات الصوتية (ويتطلب `channels.discord.voice` والأوامر الأصلية؛ وليس متاحًا كنص).
- تتطلب أوامر ربط السلاسل في Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) أن تكون thread bindings الفعلية مفعّلة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
- مرجع أوامر ACP وسلوك وقت التشغيل: [ACP Agents](/ar/tools/acp-agents).
- الغرض من `/verbose` هو التصحيح وزيادة الرؤية؛ اتركه **معطّلًا** في الاستخدام العادي.
- يُعد `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin ويبقي ضوضاء الأدوات المطولة العادية معطلة.
- يؤدي `/fast on|off` إلى استمرار تجاوز على مستوى الجلسة. استخدم خيار `inherit` في واجهة الجلسات لمسحه والعودة إلى الإعدادات الافتراضية من الإعدادات.
- يُعد `/fast` خاصًا بالمزوّد: حيث تربطه OpenAI/OpenAI Codex بالقيمة `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك الحركة الموثقة عبر OAuth المرسلة إلى `api.anthropic.com`, بالقيمة `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
- لا تزال ملخصات فشل الأدوات تُعرض عند اللزوم، لكن نص الفشل التفصيلي لا يُضمَّن إلا عندما تكون `/verbose` على `on` أو `full`.
- تُعد `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات: فقد تكشف عن استدلال داخلي، أو مخرجات أدوات، أو تشخيصات Plugin لم تكن تنوي كشفها. يُفضّل تركها معطلة، خاصة في الدردشات الجماعية.
- يؤدي `/model` إلى استمرار نموذج الجلسة الجديد فورًا.
- إذا كان الوكيل في وضع الخمول، فسيستخدم التشغيل التالي هذا النموذج مباشرةً.
- إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw التبديل المباشر كحالة معلّقة ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأداة أو خرج الرد قد بدأ بالفعل، فقد يظل التبديل المعلّق في الطابور حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
- **المسار السريع:** تُعالَج الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح فورًا (تتجاوز الطابور + النموذج).
- **تقييد الإشارات في المجموعات:** تتجاوز الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح متطلبات الإشارة.
- **الاختصارات المضمّنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل بعض الأوامر أيضًا عند تضمينها داخل رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
  - مثال: تؤدي `hey /status` إلى تشغيل رد حالة، ويستمر النص المتبقي عبر التدفق العادي.
- حاليًا: `/help`, `/commands`, `/status`, `/whoami` ‏(`/id`).
- يتم تجاهل الرسائل التي تحتوي على أوامر فقط من غير المصرّح لهم بصمت، وتُعامل الرموز المضمّنة `/...` كنص عادي.
- **أوامر Skills:** تُكشف Skills ‏`user-invocable` كأوامر شرطة مائلة. وتُطهَّر الأسماء إلى `a-z0-9_` ‏(بحد أقصى 32 محرفًا)؛ وتحصل التصادمات على لاحقات رقمية (مثل `_2`).
  - يشغّل `/skill <name> [input]` Skill بالاسم (ويكون مفيدًا عندما تمنع حدود الأوامر الأصلية إنشاء أمر لكل Skill).
  - افتراضيًا، تُمرّر أوامر Skills إلى النموذج كطلب عادي.
  - يمكن لـ Skills أن تعلن اختياريًا `command-dispatch: tool` لتوجيه الأمر مباشرةً إلى أداة (حتمي، من دون نموذج).
  - مثال: `/prose` ‏(Plugin ‏OpenProse) — راجع [OpenProse](/ar/prose).
- **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عندما تُهمل المعاملات المطلوبة). أما Telegram وSlack فيعرضان قائمة أزرار عندما يدعم الأمر خيارات وتُهمل الوسيط.

## `/tools`

تجيب `/tools` عن سؤال وقت تشغيل، وليس سؤال إعدادات: **ما الذي يمكن لهذا الوكيل استخدامه الآن
في هذه المحادثة**.

- تكون `/tools` الافتراضية مختصرة ومهيأة للمسح السريع.
- تضيف `/tools verbose` أوصافًا قصيرة.
- تكشف أسطح الأوامر الأصلية التي تدعم الوسائط عن مفتاح الوضع نفسه `compact|verbose`.
- تكون النتائج محددة النطاق بالجلسة، لذا فإن تغيير الوكيل، أو القناة، أو السلسلة، أو تفويض المرسل، أو النموذج يمكن
  أن يغير الخرج.
- تتضمن `/tools` الأدوات التي يمكن الوصول إليها فعليًا في وقت التشغيل، بما في ذلك الأدوات الأساسية، و
  أدوات Plugin المتصلة، والأدوات المملوكة للقنوات.

وبالنسبة إلى تحرير الملفات التعريفية والتجاوزات، استخدم لوحة Tools في واجهة التحكم أو أسطح الإعدادات/الفهارس بدلًا
من معاملة `/tools` كفهرس ثابت.

## أسطح الاستخدام (ما الذي يظهر وأين)

- **استخدام المزوّد/الحصة** (مثل: “Claude 80% left”) يظهر في `/status` بالنسبة إلى مزوّد النموذج الحالي عندما يكون تتبع الاستخدام مفعّلًا. ويطبع OpenClaw نوافذ المزوّدين إلى `% left`؛ وبالنسبة إلى MiniMax، يتم عكس حقول النسبة المئوية المعتمدة على المتبقي فقط قبل العرض، وتفضّل استجابات `model_remains` إدخال نموذج الدردشة مع تسمية خطة موسومة بالنموذج.
- يمكن لأسطر **الرموز/التخزين المؤقت** في `/status` أن تعود إلى أحدث إدخال استخدام في النص عندما تكون لقطة الجلسة الحية قليلة المعلومات. ولا تزال القيم الحية غير الصفرية الموجودة تفوز، كما يمكن للاحتياط من النص أن يستعيد أيضًا تسمية النموذج النشط في وقت التشغيل بالإضافة إلى مجموع أكبر موجّه إلى prompt عندما تكون المجاميع المخزنة مفقودة أو أصغر.
- يتم التحكم في **الرموز/التكلفة لكل استجابة** عبر `/usage off|tokens|full` ‏(تُضاف إلى الردود العادية).
- يتعلق `/model status` بـ **النماذج/المصادقة/نقاط النهاية**، وليس بالاستخدام.

## اختيار النموذج (`/model`)

يُنفّذ `/model` كتوجيه.

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

- يعرض `/model` و`/model list` منتقيًا مضغوطًا ومرقّمًا (عائلة النموذج + المزوّدون المتاحون).
- في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يحتوي على قوائم منسدلة للمزوّد والنموذج بالإضافة إلى خطوة Submit.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزوّد الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزوّد المضبوطة (`baseUrl`) ووضع API ‏(`api`) عند التوفر.

## تجاوزات التصحيح

يسمح لك `/debug` بضبط تجاوزات إعدادات **وقت تشغيل فقط** (في الذاكرة، وليس على القرص). للمالك فقط. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

ملاحظات:

- تُطبّق التجاوزات فورًا على قراءات الإعدادات الجديدة، لكنها **لا** تكتب إلى `openclaw.json`.
- استخدم `/debug reset` لمسح جميع التجاوزات والعودة إلى الإعدادات الموجودة على القرص.

## خرج تتبع Plugin

يسمح لك `/trace` بتبديل **أسطر تتبع/تصحيح Plugins ذات النطاق الخاص بالجلسة** من دون تشغيل الوضع المطول الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` من دون وسيط حالة التتبع الحالية للجلسة.
- يؤدي `/trace on` إلى تفعيل أسطر تتبع Plugin للجلسة الحالية.
- يؤدي `/trace off` إلى تعطيلها مرة أخرى.
- يمكن أن تظهر أسطر تتبع Plugin في `/status` وكإرسالة تشخيص متابعة بعد رد المساعد العادي.
- لا يحل `/trace` محل `/debug`؛ إذ لا يزال `/debug` يدير تجاوزات الإعدادات الخاصة بوقت التشغيل فقط.
- لا يحل `/trace` محل `/verbose`؛ إذ يظل خرج الأدوات/الحالة المطول العادي تابعًا لـ `/verbose`.

## تحديثات الإعدادات

يكتب `/config` إلى الإعدادات الموجودة على القرص (`openclaw.json`). للمالك فقط. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

ملاحظات:

- يتم التحقق من الإعدادات قبل الكتابة؛ وتُرفض التغييرات غير الصالحة.
- تستمر تحديثات `/config` بعد إعادة التشغيل.

## تحديثات MCP

يكتب `/mcp` تعريفات خوادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

ملاحظات:

- يخزّن `/mcp` الإعدادات في إعدادات OpenClaw، وليس في إعدادات المشروع التي يملكها Pi.
- تقرر محولات وقت التشغيل أي وسائل نقل تكون قابلة للتنفيذ فعليًا.

## تحديثات Plugins

يسمح `/plugins` للمشغّلين بفحص Plugins المكتشفة وتبديل التمكين في الإعدادات. ويمكن للتدفقات المخصصة للقراءة فقط استخدام `/plugin` كاسم بديل. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

ملاحظات:

- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin الحقيقي مقابل مساحة العمل الحالية بالإضافة إلى الإعدادات الموجودة على القرص.
- يحدّث `/plugins enable|disable` إعدادات Plugin فقط؛ ولا يثبت أو يزيل Plugins.
- بعد تغييرات التمكين/التعطيل، أعد تشغيل gateway لتطبيقها.

## ملاحظات السطح

- **الأوامر النصية** تعمل داخل جلسة الدردشة العادية (تشارك الرسائل الخاصة `main`، وللمجموعات جلساتها الخاصة).
- **الأوامر الأصلية** تستخدم جلسات معزولة:
  - Discord: ‏`agent:<agentId>:discord:slash:<userId>`
  - Slack: ‏`agent:<agentId>:slack:slash:<userId>` ‏(يمكن ضبط البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: ‏`telegram:slash:<userId>` ‏(يستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
- يستهدف **`/stop`** جلسة الدردشة النشطة بحيث يمكنه إيقاف التشغيل الحالي.
- **Slack:** لا يزال `channels.slack.slashCommand` مدعومًا لأمر واحد على نمط `/openclaw`. إذا فعّلت `commands.native`، فيجب عليك إنشاء أمر شرطة مائلة واحد في Slack لكل أمر مضمن (بالأسماء نفسها مثل `/help`). تُسلَّم قوائم وسائط الأوامر الخاصة بـ Slack كأزرار Block Kit مؤقتة.
  - استثناء Slack الأصلي: سجّل `/agentstatus` ‏(وليس `/status`) لأن Slack يحجز `/status`. ولا يزال `/status` النصي يعمل في رسائل Slack.

## أسئلة BTW الجانبية

يُعد `/btw` **سؤالًا جانبيًا** سريعًا حول الجلسة الحالية.

وعلى عكس الدردشة العادية:

- فإنه يستخدم الجلسة الحالية كسياق خلفي،
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

راجع [أسئلة BTW الجانبية](/ar/tools/btw) لمعرفة السلوك الكامل وتفاصيل
تجربة المستخدم في العميل.
