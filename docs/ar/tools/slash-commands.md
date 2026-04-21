---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
summary: 'أوامر الشرطة المائلة: النص مقابل الأصلي، التكوين، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-04-21T17:45:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26923608329ba2aeece2d4bc8edfa40ae86e03719a9f590f26ff79f57d97521d
    source_path: tools/slash-commands.md
    workflow: 15
---

# أوامر الشرطة المائلة

تتم معالجة الأوامر بواسطة Gateway. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`.
يستخدم أمر bash للدردشة على المضيف فقط `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

يوجد نظامان مرتبطان:

- **الأوامر**: رسائل مستقلة من نوع `/...`.
- **التوجيهات**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - تتم إزالة التوجيهات من الرسالة قبل أن يراها النموذج.
  - في رسائل الدردشة العادية (وليست الرسائل التي تحتوي على توجيهات فقط)، يتم التعامل معها على أنها "تلميحات مضمنة" ولا **تُبقي** إعدادات الجلسة.
  - في الرسائل التي تحتوي على توجيهات فقط (الرسالة تحتوي على توجيهات فقط)، فإنها تُحفَظ في الجلسة وتردّ بإقرار.
  - لا يتم تطبيق التوجيهات إلا على **المرسلين المصرّح لهم**. إذا تم ضبط `commands.allowFrom`، فهي قائمة السماح الوحيدة
    المستخدمة؛ وإلا فإن التفويض يأتي من قوائم السماح/الاقتران الخاصة بالقناة بالإضافة إلى `commands.useAccessGroups`.
    يرى المرسلون غير المصرّح لهم التوجيهات كنص عادي.

توجد أيضًا بعض **الاختصارات المضمّنة** (للمرسلين المدرجين في قائمة السماح/المصرّح لهم فقط): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
تعمل فورًا، وتُزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

## التكوين

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
  - تلقائي: مفعّل في Discord/Telegram؛ ومعطّل في Slack (إلى أن تضيف أوامر الشرطة المائلة)؛ ويتم تجاهله لموفري الخدمة الذين لا يدعمون الأوامر الأصلية.
  - اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل موفر على حدة (قيمة منطقية أو `"auto"`).
  - تؤدي القيمة `false` إلى مسح الأوامر المسجّلة سابقًا على Discord/Telegram عند بدء التشغيل. تتم إدارة أوامر Slack داخل تطبيق Slack ولا تتم إزالتها تلقائيًا.
- `commands.nativeSkills` (الافتراضي `"auto"`) يسجّل أوامر **Skills** أصليةً عند الدعم.
  - تلقائي: مفعّل في Discord/Telegram؛ ومعطّل في Slack (يتطلب Slack إنشاء أمر slash لكل Skill).
  - اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل موفر على حدة (قيمة منطقية أو `"auto"`).
- `commands.bash` (الافتراضي `false`) يفعّل `! <cmd>` لتشغيل أوامر shell على المضيف (`/bash <cmd>` اسم مستعار؛ ويتطلب قوائم السماح `tools.elevated`).
- `commands.bashForegroundMs` (الافتراضي `2000`) يتحكم في مدة انتظار bash قبل التحويل إلى وضع الخلفية (`0` يرسله إلى الخلفية فورًا).
- `commands.config` (الافتراضي `false`) يفعّل `/config` (قراءة/كتابة `openclaw.json`).
- `commands.mcp` (الافتراضي `false`) يفعّل `/mcp` (قراءة/كتابة تكوين MCP الذي يديره OpenClaw تحت `mcp.servers`).
- `commands.plugins` (الافتراضي `false`) يفعّل `/plugins` (اكتشاف حالة Plugin بالإضافة إلى عناصر التحكم في التثبيت + التفعيل/التعطيل).
- `commands.debug` (الافتراضي `false`) يفعّل `/debug` (تجاوزات وقت التشغيل فقط).
- `commands.restart` (الافتراضي `true`) يفعّل `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل Gateway.
- `commands.ownerAllowFrom` (اختياري) يضبط قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات المخصصة للمالك فقط. هذا منفصل عن `commands.allowFrom`.
- يتحكم `commands.ownerDisplay` في كيفية ظهور معرّفات المالك في موجّه النظام: `raw` أو `hash`.
- يضبط `commands.ownerDisplaySecret` اختياريًا سر HMAC المستخدم عندما تكون `commands.ownerDisplay="hash"`.
- يضبط `commands.allowFrom` (اختياري) قائمة سماح لكل موفر لتفويض الأوامر. عند تكوينه، يكون هو
  مصدر التفويض الوحيد للأوامر والتوجيهات (يتم تجاهل قوائم السماح/الاقتران الخاصة بالقناة و `commands.useAccessGroups`).
  استخدم `"*"` كإعداد افتراضي عام؛ وتتجاوز المفاتيح الخاصة بالموفر هذا الإعداد.
- `commands.useAccessGroups` (الافتراضي `true`) يفرض قوائم/سياسات السماح على الأوامر عندما لا يكون `commands.allowFrom` مضبوطًا.

## قائمة الأوامر

مصدر الحقيقة الحالي:

- الأوامر الأساسية المضمنة تأتي من `src/auto-reply/commands-registry.shared.ts`
- أوامر dock المولدة تأتي من `src/auto-reply/commands-registry.data.ts`
- أوامر Plugin تأتي من استدعاءات `registerCommand()` في الـ Plugin
- يظل التوفر الفعلي على Gateway لديك معتمدًا على علامات التكوين وسطح القناة والـ Plugins المثبتة/المفعّلة

### الأوامر الأساسية المضمنة

الأوامر المضمنة المتاحة حاليًا:

- `/new [model]` يبدأ جلسة جديدة؛ و`/reset` هو الاسم المستعار لإعادة التعيين.
- `/reset soft [message]` يحتفظ بالنص الحالي للجلسة، ويسقط معرّفات جلسة خلفية CLI المعاد استخدامها، ويعيد تشغيل تحميل startup/system-prompt في مكانه.
- `/compact [instructions]` يطبّق Compaction على سياق الجلسة. راجع [/concepts/compaction](/ar/concepts/compaction).
- `/stop` يوقف التشغيل الحالي.
- `/session idle <duration|off>` و`/session max-age <duration|off>` يديران انتهاء صلاحية ربط سلسلة الرسائل.
- `/think <level>` يضبط مستوى التفكير. تأتي الخيارات من ملف تعريف موفر النموذج النشط؛ والمستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` و`adaptive` و`max` أو `on` الثنائي فقط حيثما كان ذلك مدعومًا. الأسماء المستعارة: `/thinking` و`/t`.
- `/verbose on|off|full` يبدّل المخرجات المفصلة. الاسم المستعار: `/v`.
- `/trace on|off` يبدّل مخرجات تتبع Plugin للجلسة الحالية.
- `/fast [status|on|off]` يعرض وضع السرعة أو يضبطه.
- `/reasoning [on|off|stream]` يبدّل إظهار الاستدلال. الاسم المستعار: `/reason`.
- `/elevated [on|off|ask|full]` يبدّل الوضع المرتفع. الاسم المستعار: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` يعرض الإعدادات الافتراضية للتنفيذ أو يضبطها.
- `/model [name|#|status]` يعرض النموذج أو يضبطه.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` يسرد الموفّرين أو النماذج الخاصة بموفر معيّن.
- `/queue <mode>` يدير سلوك قائمة الانتظار (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) بالإضافة إلى خيارات مثل `debounce:2s cap:25 drop:summarize`.
- `/help` يعرض ملخص المساعدة المختصر.
- `/commands` يعرض فهرس الأوامر المولّد.
- `/tools [compact|verbose]` يعرض ما يمكن للوكيل الحالي استخدامه الآن.
- `/status` يعرض حالة وقت التشغيل، بما في ذلك استخدام/حصة الموفّر عند توفرها.
- `/tasks` يسرد المهام النشطة/الحديثة في الخلفية للجلسة الحالية.
- `/context [list|detail|json]` يشرح كيفية تجميع السياق.
- `/export-session [path]` يصدّر الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
- `/whoami` يعرض معرّف المرسل الخاص بك. الاسم المستعار: `/id`.
- `/skill <name> [input]` يشغّل Skill بالاسم.
- `/allowlist [list|add|remove] ...` يدير إدخالات قائمة السماح. نصي فقط.
- `/approve <id> <decision>` يحسم مطالبات الموافقة على التنفيذ.
- `/btw <question>` يطرح سؤالًا جانبيًا من دون تغيير سياق الجلسة المستقبلي. راجع [/tools/btw](/ar/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` يدير عمليات الوكيل الفرعي للجلسة الحالية.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` يدير جلسات ACP وخيارات وقت التشغيل.
- `/focus <target>` يربط سلسلة رسائل Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
- `/unfocus` يزيل الربط الحالي.
- `/agents` يسرد الوكلاء المرتبطين بسلسلة الرسائل للجلسة الحالية.
- `/kill <id|#|all>` يوقف وكيلاً فرعيًا واحدًا أو جميع الوكلاء الجاري تشغيلهم.
- `/steer <id|#> <message>` يرسل توجيهًا إلى وكيل فرعي قيد التشغيل. الاسم المستعار: `/tell`.
- `/config show|get|set|unset` يقرأ `openclaw.json` أو يكتبه. للمالك فقط. يتطلب `commands.config: true`.
- `/mcp show|get|set|unset` يقرأ تكوين خادم MCP الذي يديره OpenClaw تحت `mcp.servers` أو يكتبه. للمالك فقط. يتطلب `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` يفحص حالة Plugin أو يغيّرها. `/plugin` اسم مستعار. الكتابة للمالك فقط. يتطلب `commands.plugins: true`.
- `/debug show|set|unset|reset` يدير تجاوزات التكوين الخاصة بوقت التشغيل فقط. للمالك فقط. يتطلب `commands.debug: true`.
- `/usage off|tokens|full|cost` يتحكم في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محليًا.
- `/tts on|off|status|provider|limit|summary|audio|help` يتحكم في TTS. راجع [/tools/tts](/ar/tools/tts).
- `/restart` يعيد تشغيل OpenClaw عندما يكون مفعّلًا. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
- `/activation mention|always` يضبط وضع التفعيل للمجموعات.
- `/send on|off|inherit` يضبط سياسة الإرسال. للمالك فقط.
- `/bash <command>` يشغّل أمر shell على المضيف. نصي فقط. الاسم المستعار: `! <command>`. يتطلب `commands.bash: true` بالإضافة إلى قوائم السماح `tools.elevated`.
- `!poll [sessionId]` يتحقق من مهمة bash تعمل في الخلفية.
- `!stop [sessionId]` يوقف مهمة bash تعمل في الخلفية.

### أوامر dock المولدة

يتم توليد أوامر dock من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمنة الحالية:

- `/dock-discord` (الاسم المستعار: `/dock_discord`)
- `/dock-mattermost` (الاسم المستعار: `/dock_mattermost`)
- `/dock-slack` (الاسم المستعار: `/dock_slack`)
- `/dock-telegram` (الاسم المستعار: `/dock_telegram`)

### أوامر Plugin المضمنة

يمكن أن تضيف Plugins المضمنة المزيد من أوامر الشرطة المائلة. أوامر الحزمة المضمنة الحالية في هذا المستودع:

- `/dreaming [on|off|status|help]` يبدّل Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` يدير تدفق اقتران/إعداد الجهاز. راجع [Pairing](/ar/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` يفعّل مؤقتًا أوامر Node الخاصة بالهاتف عالية المخاطر.
- `/voice status|list [limit]|set <voiceId|name>` يدير تكوين صوت Talk. في Discord، يكون اسم الأمر الأصلي هو `/talkvoice`.
- `/card ...` يرسل إعدادات بطاقات LINE الغنية المسبقة. راجع [LINE](/ar/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` يفحص ويتحكم في مسار التطبيق/الخادم Codex المضمّن. راجع [Codex Harness](/ar/plugins/codex-harness).
- أوامر QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

يتم أيضًا عرض Skills التي يمكن للمستخدم استدعاؤها كأوامر slash:

- `/skill <name> [input]` يعمل دائمًا كنقطة الدخول العامة.
- قد تظهر Skills أيضًا كأوامر مباشرة مثل `/prose` عندما يقوم Skill/Plugin بتسجيلها.
- يتم التحكم في تسجيل أوامر Skills الأصلية بواسطة `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills`.

ملاحظات:

- تقبل الأوامر `:` اختياريًا بين الأمر والوسائط (مثل `/think: high` و`/send: on` و`/help:`).
- يقبل `/new <model>` اسمًا مستعارًا للنموذج، أو `provider/model`، أو اسم موفر (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، فسيُعامل النص على أنه متن الرسالة.
- للحصول على تفصيل كامل لاستخدام الموفّر، استخدم `openclaw status --usage`.
- يتطلب `/allowlist add|remove` ضبط `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
- في القنوات متعددة الحسابات، فإن `/allowlist --account <id>` الموجّهة للتكوين و`/config set channels.<provider>.accounts.<id>...` يحترمان أيضًا `configWrites` الخاصة بالحساب المستهدف.
- يتحكم `/usage` في تذييل الاستخدام لكل استجابة؛ ويطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
- يكون `/restart` مفعّلًا افتراضيًا؛ اضبط `commands.restart: false` لتعطيله.
- يقبل `/plugins install <spec>` نفس مواصفات Plugin التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
- يقوم `/plugins enable|disable` بتحديث تكوين Plugin وقد يطلب إعادة تشغيل.
- أمر أصلي خاص بـ Discord فقط: `/vc join|leave|status` يتحكم في القنوات الصوتية (يتطلب `channels.discord.voice` والأوامر الأصلية؛ غير متاح كنص).
- تتطلب أوامر ربط سلاسل Discord (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) أن تكون روابط السلاسل الفعالة مفعّلة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
- مرجع أمر ACP وسلوك وقت التشغيل: [ACP Agents](/ar/tools/acp-agents).
- الغرض من `/verbose` هو التصحيح وزيادة الوضوح؛ أبقه **معطّلًا** في الاستخدام العادي.
- `/trace` أضيق نطاقًا من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة للـ Plugin ويُبقي ضجيج الأدوات المفصل العادي معطّلًا.
- يحفظ `/fast on|off` تجاوزًا على مستوى الجلسة. استخدم خيار `inherit` في واجهة Sessions لمسحه والرجوع إلى إعدادات التكوين الافتراضية.
- `/fast` خاص بالموفر: تقوم OpenAI/OpenAI Codex بربطه إلى `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تُربط طلبات Anthropic العامة المباشرة، بما في ذلك حركة المرور الموثّقة عبر OAuth والمرسلة إلى `api.anthropic.com`، إلى `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
- تظل ملخصات فشل الأدوات معروضة عند الاقتضاء، لكن نص الفشل التفصيلي لا يُضمَّن إلا عندما يكون `/verbose` على `on` أو `full`.
- تُعد `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات: فقد تكشف الاستدلال الداخلي أو مخرجات الأدوات أو تشخيصات Plugin التي لم تكن تنوي كشفها. يُفضّل إبقاؤها معطّلة، خاصة في دردشات المجموعات.
- يحفظ `/model` نموذج الجلسة الجديد فورًا.
- إذا كان الوكيل في وضع الخمول، فسيستخدمه التشغيل التالي مباشرة.
- إذا كان هناك تشغيل نشط بالفعل، فسيضع OpenClaw تبديلًا مباشرًا كحالة معلّقة ولن يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأدوات أو إخراج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو حتى دور المستخدم التالي.
- **المسار السريع:** تتم معالجة الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح فورًا (تتجاوز قائمة الانتظار + النموذج).
- **بوابة الإشارة في المجموعات:** الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح تتجاوز متطلبات الإشارة.
- **الاختصارات المضمّنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل بعض الأوامر أيضًا عند تضمينها في رسالة عادية، وتُزال قبل أن يرى النموذج النص المتبقي.
  - مثال: `hey /status` يفعّل رد حالة، ويستمر النص المتبقي عبر التدفق العادي.
- حاليًا: `/help` و`/commands` و`/status` و`/whoami` (`/id`).
- يتم تجاهل الرسائل غير المصرّح بها التي تحتوي على أوامر فقط بصمت، وتُعامل رموز `/...` المضمّنة كنص عادي.
- **أوامر Skills:** يتم عرض Skills ذات `user-invocable` كأوامر slash. تُنقّى الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية (مثل `_2`).
  - يقوم `/skill <name> [input]` بتشغيل Skill بالاسم (وهو مفيد عندما تمنع حدود الأوامر الأصلية وجود أمر لكل Skill).
  - افتراضيًا، تتم إعادة توجيه أوامر Skills إلى النموذج كطلب عادي.
  - يمكن للـ Skills اختياريًا إعلان `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بدون نموذج).
  - مثال: `/prose` (Plugin OpenProse) — راجع [OpenProse](/ar/prose).
- **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عند حذف الوسائط المطلوبة). يعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر خيارات وتقوم بحذف الوسيطة.

## `/tools`

يجيب `/tools` عن سؤال وقت تشغيل، وليس عن سؤال تكوين: **ما الذي يمكن لهذا الوكيل استخدامه الآن
في هذه المحادثة**.

- يكون `/tools` الافتراضي مضغوطًا ومحسّنًا للفحص السريع.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تعرض أسطح الأوامر الأصلية التي تدعم الوسائط نفس تبديل الوضع على شكل `compact|verbose`.
- تكون النتائج على مستوى الجلسة، لذا فإن تغيير الوكيل أو القناة أو السلسلة أو تفويض المرسل أو النموذج يمكن
  أن يغيّر المخرجات.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعليًا في وقت التشغيل، بما في ذلك الأدوات الأساسية، والأدوات المتصلة التابعة للـ Plugin، والأدوات المملوكة للقناة.

لتحرير ملف التعريف والتجاوزات، استخدم لوحة Tools في واجهة Control أو أسطح التكوين/الفهرس بدلًا
من التعامل مع `/tools` كفهرس ثابت.

## أسطح الاستخدام (ما الذي يظهر وأين)

- **استخدام/حصة الموفّر** (مثال: “Claude 80% left”) يظهر في `/status` لموفر النموذج الحالي عندما يكون تتبع الاستخدام مفعّلًا. يقوم OpenClaw بتوحيد نوافذ الموفّرين إلى `% left`؛ وبالنسبة إلى MiniMax، يتم عكس حقول النسبة المئوية الخاصة بالقيمة المتبقية فقط قبل العرض، وتفضّل استجابات `model_remains` إدخال نموذج الدردشة مع تسمية خطة مقيّدة بالنموذج.
- يمكن أن تعتمد **أسطر token/cache** في `/status` على أحدث إدخال لاستخدام النص عند ندرة لقطة الجلسة الحية. تظل القيم الحية غير الصفرية الموجودة هي المفضلة، ويمكن أن يستعيد الرجوع إلى النص أيضًا تسمية نموذج وقت التشغيل النشط بالإضافة إلى إجمالي أكبر موجّه إلى prompt عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- يتم التحكم في **tokens/cost لكل استجابة** بواسطة `/usage off|tokens|full` (تُلحق بالردود العادية).
- يدور `/model status` حول **النماذج/المصادقة/نقاط النهاية**، وليس الاستخدام.

## اختيار النموذج (`/model`)

يتم تنفيذ `/model` كتوجيه.

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

- يعرض `/model` و`/model list` منتقيًا مضغوطًا ومرقّمًا (عائلة النموذج + الموفّرون المتاحون).
- في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للموفّر والنموذج بالإضافة إلى خطوة Submit.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل الموفّر الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية الموفّر المكوّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يسمح لك `/debug` بضبط تجاوزات تكوين **خاصة بوقت التشغيل فقط** (في الذاكرة، وليس على القرص). للمالك فقط. يكون معطّلًا افتراضيًا؛ فعّله عبر `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

ملاحظات:

- تُطبّق التجاوزات فورًا على قراءات التكوين الجديدة، لكنها **لا** تكتب إلى `openclaw.json`.
- استخدم `/debug reset` لمسح جميع التجاوزات والعودة إلى التكوين الموجود على القرص.

## مخرجات تتبع Plugin

يتيح لك `/trace` تبديل **أسطر تتبع/تصحيح Plugin على مستوى الجلسة** من دون تشغيل الوضع المفصل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` بدون وسيطة حالة التتبع الحالية للجلسة.
- يفعّل `/trace on` أسطر تتبع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبع Plugin في `/status` وكmessage تشخيص متابعة بعد رد المساعد العادي.
- لا يستبدل `/trace` الأمر `/debug`؛ فما زال `/debug` يدير تجاوزات التكوين الخاصة بوقت التشغيل فقط.
- لا يستبدل `/trace` الأمر `/verbose`؛ فما زالت مخرجات الأدوات/الحالة المفصلة العادية تتبع `/verbose`.

## تحديثات التكوين

يكتب `/config` إلى التكوين الموجود على القرص لديك (`openclaw.json`). للمالك فقط. يكون معطّلًا افتراضيًا؛ فعّله عبر `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

ملاحظات:

- يتم التحقق من صحة التكوين قبل الكتابة؛ ويتم رفض التغييرات غير الصالحة.
- تستمر تحديثات `/config` بعد إعادة التشغيل.

## تحديثات MCP

يكتب `/mcp` تعريفات خادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. يكون معطّلًا افتراضيًا؛ فعّله عبر `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

ملاحظات:

- يخزّن `/mcp` التكوين في إعدادات OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi.
- تحدد محولات وقت التشغيل وسائل النقل القابلة للتنفيذ فعليًا.

## تحديثات Plugin

يسمح `/plugins` للمشغّلين بفحص Plugins المكتشفة وتبديل حالة التمكين في التكوين. يمكن لتدفقات القراءة فقط استخدام `/plugin` كاسم مستعار. يكون معطّلًا افتراضيًا؛ فعّله عبر `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

ملاحظات:

- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin الحقيقي مقابل مساحة العمل الحالية بالإضافة إلى التكوين الموجود على القرص.
- يقوم `/plugins enable|disable` بتحديث تكوين Plugin فقط؛ ولا يثبّت أو يزيل تثبيت Plugins.
- بعد تغييرات التمكين/التعطيل، أعد تشغيل Gateway لتطبيقها.

## ملاحظات السطح

- **الأوامر النصية** تعمل في جلسة الدردشة العادية (تشارك الرسائل الخاصة `main`، وللمجموعات جلستها الخاصة).
- **الأوامر الأصلية** تستخدم جلسات معزولة:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (يمكن ضبط البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (يستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
- يستهدف **`/stop`** جلسة الدردشة النشطة حتى يتمكن من إيقاف التشغيل الحالي.
- **Slack:** لا يزال `channels.slack.slashCommand` مدعومًا لأمر واحد بأسلوب `/openclaw`. إذا فعّلت `commands.native`، فيجب عليك إنشاء أمر slash واحد في Slack لكل أمر مضمّن (بنفس أسماء `/help`). يتم تسليم قوائم وسائط الأوامر في Slack كأزرار Block Kit سريعة الزوال.
  - استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. يظل `/status` النصي يعمل في رسائل Slack.

## الأسئلة الجانبية BTW

`/btw` هو **سؤال جانبي** سريع حول الجلسة الحالية.

بخلاف الدردشة العادية:

- يستخدم الجلسة الحالية كسياق خلفية،
- ويعمل كمكالمة منفصلة **بدون أدوات** لمرة واحدة،
- ولا يغيّر سياق الجلسة المستقبلي،
- ولا يُكتب في سجل النص،
- ويتم تسليمه كنتيجة جانبية مباشرة بدلًا من رسالة مساعد عادية.

وهذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر
المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
```

راجع [BTW Side Questions](/ar/tools/btw) لمعرفة السلوك الكامل وتفاصيل
تجربة المستخدم في العميل.
