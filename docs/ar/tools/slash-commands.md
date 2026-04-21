---
read_when:
    - استخدام أو ضبط أوامر الدردشة
    - تصحيح توجيه الأوامر أو الأذونات
summary: 'الأوامر المائلة: النصية مقابل الأصلية، والإعدادات، والأوامر المدعومة'
title: الأوامر المائلة
x-i18n:
    generated_at: "2026-04-21T13:36:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d90ddee54af7c05b7fdf486590561084581d750e42cd14674d43bbdc0984df5d
    source_path: tools/slash-commands.md
    workflow: 15
---

# الأوامر المائلة

تتم معالجة الأوامر بواسطة Gateway. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`.
ويستخدم أمر bash للدردشة على المضيف فقط الصيغة `! <cmd>` (مع `/bash <cmd>` كاسم بديل).

هناك نظامان مرتبطان:

- **الأوامر**: رسائل `/...` مستقلة.
- **التوجيهات**: `/think` و`/fast` و`/verbose` و`/trace` و`/reasoning` و`/elevated` و`/exec` و`/model` و`/queue`.
  - تُجرَّد التوجيهات من الرسالة قبل أن يراها النموذج.
  - في رسائل الدردشة العادية (وليست الرسائل التي تحتوي على توجيهات فقط)، تُعامَل باعتبارها "تلميحات مضمنة" ولا **تستمر** كإعدادات للجلسة.
  - في الرسائل التي تحتوي على توجيهات فقط (أي عندما تحتوي الرسالة على توجيهات فقط)، تستمر إلى الجلسة وتردّ بإقرار.
  - لا تُطبَّق التوجيهات إلا على **المرسلين المصرّح لهم**. إذا كان `commands.allowFrom` مضبوطًا، فهو قائمة السماح الوحيدة
    المستخدمة؛ وإلا فإن التفويض يأتي من قوائم السماح/الاقتران الخاصة بالقنوات بالإضافة إلى `commands.useAccessGroups`.
    ويرى المرسلون غير المصرّح لهم التوجيهات كنص عادي.

توجد أيضًا بعض **الاختصارات المضمنة** (للمرسلين المدرجين في قائمة السماح/المصرّح لهم فقط): `/help` و`/commands` و`/status` و`/whoami` (`/id`).
تعمل هذه فورًا، وتُجرَّد قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

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

- يفعّل `commands.text` (الافتراضي `true`) تحليل `/...` في رسائل الدردشة.
  - على الأسطح التي لا تدعم الأوامر الأصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل الأوامر النصية تعمل حتى إذا ضبطت هذا الخيار على `false`.
- يسجّل `commands.native` (الافتراضي `"auto"`) الأوامر الأصلية.
  - تلقائي: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack (إلى أن تضيف أوامر مائلة)؛ ويتم تجاهله لموفّري الخدمة الذين لا يدعمون الأوامر الأصلية.
  - اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل موفّر خدمة (قيمة منطقية أو `"auto"`).
  - تؤدي القيمة `false` إلى مسح الأوامر المسجّلة سابقًا على Discord/Telegram عند بدء التشغيل. وتُدار أوامر Slack داخل تطبيق Slack ولا تُزال تلقائيًا.
- يسجّل `commands.nativeSkills` (الافتراضي `"auto"`) أوامر **Skills** أصليةً عند توفر الدعم.
  - تلقائي: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack (يتطلب Slack إنشاء أمر مائل لكل Skill).
  - اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل موفّر خدمة (قيمة منطقية أو `"auto"`).
- يفعّل `commands.bash` (الافتراضي `false`) الصيغة `! <cmd>` لتشغيل أوامر shell على المضيف (وتُعد `/bash <cmd>` اسمًا بديلًا؛ ويتطلب ذلك قوائم السماح `tools.elevated`).
- يتحكم `commands.bashForegroundMs` (الافتراضي `2000`) في مدة انتظار bash قبل التحول إلى وضع الخلفية (القيمة `0` تنقلها إلى الخلفية فورًا).
- يفعّل `commands.config` (الافتراضي `false`) الأمر `/config` (لقراءة/كتابة `openclaw.json`).
- يفعّل `commands.mcp` (الافتراضي `false`) الأمر `/mcp` (لقراءة/كتابة إعدادات MCP التي يديرها OpenClaw تحت `mcp.servers`).
- يفعّل `commands.plugins` (الافتراضي `false`) الأمر `/plugins` (اكتشاف Plugin/الحالة بالإضافة إلى عناصر التحكم الخاصة بالتثبيت والتمكين/التعطيل).
- يفعّل `commands.debug` (الافتراضي `false`) الأمر `/debug` (تجاوزات وقت التشغيل فقط).
- يفعّل `commands.restart` (الافتراضي `true`) الأمر `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل Gateway.
- يضبط `commands.ownerAllowFrom` (اختياري) قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات المخصّصة للمالك فقط. وهذا منفصل عن `commands.allowFrom`.
- يتحكم `commands.ownerDisplay` في كيفية ظهور معرّفات المالك في موجّه النظام: `raw` أو `hash`.
- يضبط `commands.ownerDisplaySecret` اختياريًا سر HMAC المستخدم عندما تكون قيمة `commands.ownerDisplay="hash"`.
- يضبط `commands.allowFrom` (اختياري) قائمة سماح لكل موفّر خدمة لتفويض الأوامر. وعند ضبطه، يكون هو
  مصدر التفويض الوحيد للأوامر والتوجيهات (ويتم تجاهل قوائم سماح/اقتران القنوات و`commands.useAccessGroups`).
  استخدم `"*"` كإعداد افتراضي عام؛ وتقوم المفاتيح الخاصة بموفري الخدمة بتجاوزه.
- يفرض `commands.useAccessGroups` (الافتراضي `true`) قوائم السماح/السياسات على الأوامر عندما لا يكون `commands.allowFrom` مضبوطًا.

## قائمة الأوامر

المصدر المرجعي الحالي:

- تأتي الأوامر الأساسية المدمجة من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المُولَّدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` في Plugin
- لا يزال التوفر الفعلي على Gateway لديك يعتمد على علامات الإعدادات، وسطح القناة، وPlugins المثبّتة/المفعّلة

### الأوامر الأساسية المدمجة

الأوامر المدمجة المتاحة اليوم:

- يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو الاسم البديل لإعادة الضبط.
- يجري `/compact [instructions]` عملية Compaction لسياق الجلسة. راجع [/concepts/compaction](/ar/concepts/compaction).
- يوقف `/stop` التشغيل الحالي.
- يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط الخيط.
- يضبط `/think <level>` مستوى التفكير. تأتي الخيارات من ملف موفّر الخدمة الخاص بالنموذج النشط؛ وتشمل المستويات الشائعة `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` و`adaptive` و`max` أو الوضع الثنائي `on` فقط حيثما كان ذلك مدعومًا. الأسماء البديلة: `/thinking` و`/t`.
- يبدّل `/verbose on|off|full` مخرجات الإسهاب. الاسم البديل: `/v`.
- يبدّل `/trace on|off` مخرجات تتبّع Plugin للجلسة الحالية.
- يعرض `/fast [status|on|off]` الوضع السريع أو يضبطه.
- يبدّل `/reasoning [on|off|stream]` إمكانية رؤية الاستدلال. الاسم البديل: `/reason`.
- يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع الصلاحيات. الاسم البديل: `/elev`.
- يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` الإعدادات الافتراضية للتنفيذ أو يضبطها.
- يعرض `/model [name|#|status]` النموذج أو يضبطه.
- يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` موفّري الخدمة أو نماذج موفّر خدمة معيّن.
- يدير `/queue <mode>` سلوك الطابور (`steer` و`interrupt` و`followup` و`collect` و`steer-backlog`) بالإضافة إلى خيارات مثل `debounce:2s cap:25 drop:summarize`.
- يعرض `/help` ملخص المساعدة القصير.
- يعرض `/commands` فهرس الأوامر المُولَّد.
- يعرض `/tools [compact|verbose]` ما الذي يمكن للعامل الحالي استخدامه الآن.
- يعرض `/status` حالة وقت التشغيل، بما في ذلك استخدام/حصة موفّر الخدمة عند توفرها.
- يسرد `/tasks` المهام النشطة/الحديثة في الخلفية للجلسة الحالية.
- يشرح `/context [list|detail|json]` كيفية تجميع السياق.
- يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم البديل: `/export`.
- يعرض `/whoami` معرّف المرسل الخاص بك. الاسم البديل: `/id`.
- يشغّل `/skill <name> [input]` Skill حسب الاسم.
- يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
- يحسم `/approve <id> <decision>` مطالبات الموافقة على التنفيذ.
- يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. راجع [/tools/btw](/ar/tools/btw).
- يدير `/subagents list|kill|log|info|send|steer|spawn` عمليات الوكلاء الفرعيين للجلسة الحالية.
- يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
- يربط `/focus <target>` خيط Discord الحالي أو موضوع/محادثة Telegram بهدف جلسة.
- يزيل `/unfocus` الربط الحالي.
- يسرد `/agents` العوامل المرتبطة بالخيوط للجلسة الحالية.
- يوقف `/kill <id|#|all>` وكيلًا فرعيًا واحدًا أو جميع الوكلاء الفرعيين قيد التشغيل.
- يرسل `/steer <id|#> <message>` توجيهًا إلى وكيل فرعي قيد التشغيل. الاسم البديل: `/tell`.
- يقرأ `/config show|get|set|unset` أو يكتب `openclaw.json`. للمالك فقط. يتطلب `commands.config: true`.
- يقرأ `/mcp show|get|set|unset` أو يكتب إعدادات خادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. يتطلب `commands.mcp: true`.
- يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يغيّرها. و`/plugin` اسم بديل. عمليات الكتابة للمالك فقط. يتطلب `commands.plugins: true`.
- يدير `/debug show|set|unset|reset` تجاوزات الإعدادات الخاصة بوقت التشغيل فقط. للمالك فقط. يتطلب `commands.debug: true`.
- يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محليًا.
- يتحكم `/tts on|off|status|provider|limit|summary|audio|help` في TTS. راجع [/tools/tts](/ar/tools/tts).
- يعيد `/restart` تشغيل OpenClaw عند تفعيله. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
- يضبط `/activation mention|always` وضع التفعيل للمجموعة.
- يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.
- يشغّل `/bash <command>` أمر shell على المضيف. نصي فقط. الاسم البديل: `! <command>`. يتطلب `commands.bash: true` بالإضافة إلى قوائم السماح `tools.elevated`.
- يفحص `!poll [sessionId]` مهمة bash في الخلفية.
- يوقف `!stop [sessionId]` مهمة bash في الخلفية.

### أوامر dock المُولَّدة

تُولَّد أوامر Dock من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمنة الحالية:

- `/dock-discord` (الاسم البديل: `/dock_discord`)
- `/dock-mattermost` (الاسم البديل: `/dock_mattermost`)
- `/dock-slack` (الاسم البديل: `/dock_slack`)
- `/dock-telegram` (الاسم البديل: `/dock_telegram`)

### أوامر Plugins المضمنة

يمكن لـ Plugins المضمنة إضافة المزيد من الأوامر المائلة. الأوامر المضمنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق اقتران/إعداد الجهاز. راجع [الاقتران](/ar/channels/pairing).
- يفعّل `/phone status|arm <camera|screen|writes|all> [duration]|disarm` مؤقتًا أوامر Node الهاتفية عالية الخطورة.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعدادات صوت Talk. في Discord، يكون اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` قوالب البطاقات الغنية في LINE. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|account|mcp|skills` ويضبط حزمة Codex app-server المضمنة. راجع [Codex Harness](/ar/plugins/codex-harness).
- الأوامر الخاصة بـ QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرَض Skills التي يمكن للمستخدم استدعاؤها أيضًا كأوامر مائلة:

- تعمل `/skill <name> [input]` دائمًا كنقطة الدخول العامة.
- قد تظهر Skills أيضًا كأوامر مباشرة مثل `/prose` عندما يسجّلها Skill/Plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.

ملاحظات:

- تقبل الأوامر النقطتين `:` اختياريًا بين الأمر والوسيطات (مثل `/think: high` و`/send: on` و`/help:`).
- يقبل `/new <model>` اسمًا بديلًا للنموذج، أو `provider/model`، أو اسم موفّر خدمة (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامَل النص على أنه جسم الرسالة.
- للحصول على تفصيل كامل لاستخدام موفّر الخدمة، استخدم `openclaw status --usage`.
- يتطلب `/allowlist add|remove` ضبط `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
- في القنوات متعددة الحسابات، تحترم أيضًا الأوامر المستهدِفة للإعدادات مثل `/allowlist --account <id>` و`/config set channels.<provider>.accounts.<id>...` قيمة `configWrites` الخاصة بالحساب المستهدف.
- يتحكم `/usage` في تذييل الاستخدام لكل استجابة؛ ويطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
- يكون `/restart` مفعّلًا افتراضيًا؛ اضبط `commands.restart: false` لتعطيله.
- يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
- يحدّث `/plugins enable|disable` إعدادات Plugin وقد يطالب بإعادة تشغيل.
- أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في القنوات الصوتية (يتطلب `channels.discord.voice` والأوامر الأصلية؛ وغير متاح كنص).
- تتطلب أوامر ربط خيوط Discord (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) أن يكون تفعيل ربط الخيوط الفعّال مُمكّنًا (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
- مرجع أوامر ACP وسلوك وقت التشغيل: [عوامل ACP](/ar/tools/acp-agents).
- الغرض من `/verbose` هو التصحيح وزيادة الرؤية؛ أبقه **معطّلًا** في الاستخدام العادي.
- يكون `/trace` أضيق نطاقًا من `/verbose`: فهو يكشف فقط أسطر التتبّع/التصحيح المملوكة لـ Plugin ويُبقي ضجيج الأدوات المفصّل العادي معطّلًا.
- يستمر `/fast on|off` كتجاوز على مستوى الجلسة. استخدم خيار `inherit` في واجهة الجلسات لمسحه والرجوع إلى الإعدادات الافتراضية.
- يعتمد `/fast` على موفّر الخدمة: يربطه OpenAI/OpenAI Codex بالقيمة `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك الزيارات الموثقة عبر OAuth المرسلة إلى `api.anthropic.com`، بالقيمة `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
- لا تزال ملخصات فشل الأدوات تُعرض عند الحاجة، لكن نص الفشل التفصيلي لا يُضمَّن إلا عندما تكون قيمة `/verbose` هي `on` أو `full`.
- تُعد `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات: فقد تكشف استدلالًا داخليًا، أو مخرجات أدوات، أو تشخيصات Plugin لم تكن تنوي كشفها. يُفضَّل إبقاؤها معطّلة، خاصةً في الدردشات الجماعية.
- يُبقي `/model` النموذج الجديد للجلسة فورًا.
- إذا كان العامل في وضع الخمول، فإن التشغيل التالي يستخدمه مباشرة.
- إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw تبديلًا مباشرًا معلّقًا ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأدوات أو مخرجات الرد قد بدأ بالفعل، فقد يبقى التبديل المعلّق في الطابور حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
- **المسار السريع:** تُعالَج الرسائل التي تحتوي على أوامر فقط من مرسلين مدرجين في قائمة السماح فورًا (تتجاوز الطابور + النموذج).
- **حصر الإشارات في المجموعات:** تتجاوز الرسائل التي تحتوي على أوامر فقط من مرسلين مدرجين في قائمة السماح متطلبات الإشارة.
- **الاختصارات المضمنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل بعض الأوامر أيضًا عندما تكون مضمنة داخل رسالة عادية وتُجرَّد قبل أن يرى النموذج النص المتبقي.
  - مثال: يؤدي `hey /status` إلى تشغيل رد حالة، ويستمر النص المتبقي عبر التدفق العادي.
- حاليًا: `/help` و`/commands` و`/status` و`/whoami` (`/id`).
- تُتجاهل الرسائل غير المصرّح بها التي تحتوي على أوامر فقط بصمت، وتُعامَل رموز `/...` المضمنة كنص عادي.
- **أوامر Skills:** تُعرَض Skills ذات الخاصية `user-invocable` كأوامر مائلة أيضًا. تُنقّى الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية (مثل `_2`).
  - يشغّل `/skill <name> [input]` Skill حسب الاسم (ويفيد ذلك عندما تمنع حدود الأوامر الأصلية وجود أمر لكل Skill).
  - افتراضيًا، تُمرَّر أوامر Skill إلى النموذج كطلب عادي.
  - يمكن لـ Skills أن تعلن اختياريًا `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
  - مثال: `/prose` (Plugin OpenProse) — راجع [OpenProse](/ar/prose).
- **وسيطات الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عندما تُهمل الوسيطات المطلوبة). ويعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر خيارات وتُهمل الوسيط.

## `/tools`

يجيب `/tools` عن سؤال وقت تشغيل، وليس سؤال إعدادات: **ما الذي يمكن لهذا العامل استخدامه الآن في
هذه المحادثة**.

- يكون `/tools` افتراضيًا موجزًا ومحسّنًا للمراجعة السريعة.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تكشف الأسطح ذات الأوامر الأصلية التي تدعم الوسيطات عن مفتاح الوضع نفسه بالشكل `compact|verbose`.
- تكون النتائج ضمن نطاق الجلسة، لذا فإن تغيير العامل، أو القناة، أو الخيط، أو تفويض المرسل، أو النموذج يمكن
  أن يغيّر المخرجات.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعلًا في وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات Plugin
  المتصلة، والأدوات المملوكة للقناة.

لتحرير الملفات التعريفية والتجاوزات، استخدم لوحة الأدوات في واجهة التحكم أو أسطح الإعدادات/الفهرس بدلًا
من التعامل مع `/tools` كفهرس ثابت.

## أسطح الاستخدام (ما الذي يظهر وأين)

- **استخدام/حصة موفّر الخدمة** (مثال: "Claude 80% left") يظهر في `/status` لموفّر نموذج الجلسة الحالية عندما يكون تتبع الاستخدام مفعّلًا. يطبّع OpenClaw نوافذ موفّري الخدمة إلى `% left`؛ وبالنسبة إلى MiniMax، تُقلَب حقول النسبة المئوية التي تحتوي على المتبقي فقط قبل العرض، كما تفضّل استجابات `model_remains` إدخال نموذج الدردشة مع تسمية خطة مقيّدة بالنموذج.
- يمكن أن تعود **أسطر الرموز/الذاكرة المؤقتة** في `/status` إلى أحدث إدخال استخدام في النص المسجل عندما تكون اللقطة الحية للجلسة نادرة. وتبقى القيم الحية غير الصفرية الموجودة هي المرجّحة، كما يمكن أن يستعيد الرجوع إلى النص المسجل تسمية نموذج وقت التشغيل النشط بالإضافة إلى إجمالي أكبر موجّه نحو الموجّه عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- يتحكم `/usage off|tokens|full` في **الرموز/التكلفة لكل استجابة** (تُلحَق بالردود العادية).
- يتناول `/model status` **النماذج/التوثيق/نقاط النهاية**، وليس الاستخدام.

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

- يعرض `/model` و`/model list` منتقيًا موجزًا مرقّمًا (عائلة النموذج + موفّرو الخدمة المتاحون).
- في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة لموفّر الخدمة والنموذج بالإضافة إلى خطوة إرسال.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل موفّر الخدمة الحالي متى أمكن).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية موفّر الخدمة المضبوطة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح لك `/debug` ضبط تجاوزات إعدادات **لوقت التشغيل فقط** (في الذاكرة، لا على القرص). للمالك فقط. وهو معطّل افتراضيًا؛ فعّله عبر `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

ملاحظات:

- تُطبَّق التجاوزات فورًا على قراءات الإعدادات الجديدة، لكنها **لا** تكتب إلى `openclaw.json`.
- استخدم `/debug reset` لمسح جميع التجاوزات والعودة إلى الإعدادات الموجودة على القرص.

## مخرجات تتبّع Plugin

يتيح لك `/trace` تبديل **أسطر تتبّع/تصحيح Plugin ضمن نطاق الجلسة** دون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` دون وسيطة حالة التتبّع الحالية للجلسة.
- يفعّل `/trace on` أسطر تتبّع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبّع Plugin في `/status` وكـرسالة تشخيص متابعة بعد رد المساعد العادي.
- لا يحل `/trace` محل `/debug`؛ إذ يظل `/debug` مسؤولًا عن تجاوزات الإعدادات الخاصة بوقت التشغيل فقط.
- لا يحل `/trace` محل `/verbose`؛ إذ تظل مخرجات الأدوات/الحالة المفصّلة العادية ضمن `/verbose`.

## تحديثات الإعدادات

يكتب `/config` إلى إعداداتك الموجودة على القرص (`openclaw.json`). للمالك فقط. وهو معطّل افتراضيًا؛ فعّله عبر `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

ملاحظات:

- تُتحقَّق صحة الإعدادات قبل الكتابة؛ وتُرفَض التغييرات غير الصالحة.
- تستمر تحديثات `/config` عبر عمليات إعادة التشغيل.

## تحديثات MCP

يكتب `/mcp` تعريفات خوادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. وهو معطّل افتراضيًا؛ فعّله عبر `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

ملاحظات:

- يخزّن `/mcp` الإعدادات في إعدادات OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi.
- تحدد المحوّلات وقت التشغيلية أي وسائل نقل يمكن تنفيذها فعليًا.

## تحديثات Plugin

يتيح `/plugins` للمشغلين فحص Plugins المكتشفة وتبديل التمكين في الإعدادات. ويمكن للتدفقات للقراءة فقط استخدام `/plugin` كاسم بديل. وهو معطّل افتراضيًا؛ فعّله عبر `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

ملاحظات:

- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin حقيقيًا مقابل مساحة العمل الحالية بالإضافة إلى الإعدادات الموجودة على القرص.
- يحدّث `/plugins enable|disable` إعدادات Plugin فقط؛ ولا يثبت أو يزيل Plugins.
- بعد تغييرات التمكين/التعطيل، أعد تشغيل Gateway لتطبيقها.

## ملاحظات السطح

- تعمل **الأوامر النصية** في جلسة الدردشة العادية (تشترك الرسائل المباشرة في `main`، وللمجموعات جلستها الخاصة).
- تستخدم **الأوامر الأصلية** جلسات معزولة:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (يمكن ضبط البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (يستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
- يستهدف **`/stop`** جلسة الدردشة النشطة حتى يتمكن من إيقاف التشغيل الحالي.
- **Slack:** لا يزال `channels.slack.slashCommand` مدعومًا لأمر واحد بأسلوب `/openclaw`. وإذا فعّلت `commands.native`، فيجب إنشاء أمر Slack مائل واحد لكل أمر مدمج (بالأسماء نفسها مثل `/help`). وتُسلَّم قوائم وسائط الأوامر في Slack كأزرار Block Kit سريعة الزوال.
  - استثناء الأوامر الأصلية في Slack: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. ولا يزال النص `/status` يعمل في رسائل Slack.

## الأسئلة الجانبية BTW

يمثل `/btw` **سؤالًا جانبيًا** سريعًا حول الجلسة الحالية.

وعلى خلاف الدردشة العادية:

- فإنه يستخدم الجلسة الحالية كسياق خلفي،
- ويعمل كاستدعاء منفصل **بلا أدوات** لمرة واحدة،
- ولا يغيّر سياق الجلسة المستقبلي،
- ولا يُكتب في سجل النص المسجل،
- ويُسلَّم كنتيجة جانبية مباشرة بدلًا من رسالة مساعد عادية.

يجعل ذلك `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر
المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
```

راجع [الأسئلة الجانبية BTW](/ar/tools/btw) للاطلاع على السلوك الكامل وتفاصيل
تجربة العميل.
