---
read_when:
    - التحقق من تغطية بيانات اعتماد SecretRef
    - مراجعة ما إذا كانت بيانات الاعتماد مؤهلة لـ `secrets configure` أو `secrets apply`
    - التحقق من سبب كون بيانات الاعتماد خارج السطح المدعوم
summary: السطح المعتمد القياسي لبيانات اعتماد SecretRef المدعومة مقابل غير المدعومة
title: سطح بيانات اعتماد SecretRef
x-i18n:
    generated_at: "2026-04-25T13:57:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50a4602939970d92831c0de9339e84b0f42b119c2e25ea30375925282f55d237
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

تحدد هذه الصفحة السطح القياسي لبيانات اعتماد SecretRef.

نية النطاق:

- ضمن النطاق: بيانات الاعتماد التي يقدّمها المستخدم بشكل صارم والتي لا يقوم OpenClaw بإصدارها أو تدويرها.
- خارج النطاق: بيانات الاعتماد التي تُصدر أثناء وقت التشغيل أو تُدوَّر، ومواد تحديث OAuth، والعناصر الشبيهة بالجلسات.

## بيانات الاعتماد المدعومة

### أهداف `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` عبر `serviceAccountRef` الشقيق (استثناء توافق)
- `channels.googlechat.accounts.*.serviceAccount` عبر `serviceAccountRef` الشقيق (استثناء توافق)

### أهداف `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; غير مدعوم عندما يكون `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; غير مدعوم عندما يكون `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

ملاحظات:

- تتطلب أهداف خطة ملف المصادقة `agentId`.
- تستهدف إدخالات الخطة `profiles.*.key` / `profiles.*.token` وتكتب المراجع الشقيقة (`keyRef` / `tokenRef`).
- تُدرج مراجع ملفات المصادقة في تغطية الحل أثناء وقت التشغيل والتدقيق.
- في `openclaw.json`، يجب أن تستخدم SecretRefs كائنات منظَّمة مثل `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. تُرفض سلاسل العلامات القديمة `secretref-env:<ENV_VAR>` على مسارات بيانات اعتماد SecretRef؛ شغّل `openclaw doctor --fix` لترحيل العلامات الصالحة.
- حاجز سياسة OAuth: لا يمكن دمج `auth.profiles.<id>.mode = "oauth"` مع مدخلات SecretRef لذلك الملف. يفشل بدء التشغيل/إعادة التحميل وحل ملف المصادقة بسرعة عند انتهاك هذه السياسة.
- بالنسبة إلى مزوّدي النماذج المُدارين بواسطة SecretRef، تستمر إدخالات `agents/*/agent/models.json` المُولّدة في حفظ علامات غير سرية (وليست قيمًا سرية محلولة) لأسطح `apiKey`/الرؤوس.
- يُعد حفظ العلامات معتمدًا على المصدر: يكتب OpenClaw العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، وليس من القيم السرية المحلولة أثناء وقت التشغيل.
- بالنسبة إلى البحث على الويب:
  - في وضع المزوّد الصريح (عند ضبط `tools.web.search.provider`)، يكون مفتاح المزوّد المحدد فقط نشطًا.
  - في الوضع التلقائي (عند عدم ضبط `tools.web.search.provider`)، يكون مفتاح المزوّد الأول فقط الذي يُحل بحسب الأسبقية نشطًا.
  - في الوضع التلقائي، تُعامل مراجع المزوّدين غير المحددين على أنها غير نشطة حتى يتم تحديدها.
  - ما تزال مسارات المزوّد القديمة `tools.web.search.*` تُحل خلال نافذة التوافق، لكن السطح القياسي لـ SecretRef هو `plugins.entries.<plugin>.config.webSearch.*`.

## بيانات الاعتماد غير المدعومة

تشمل بيانات الاعتماد الخارجة عن النطاق:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

المبرر:

- هذه بيانات اعتماد مُصدرة أو مُدوّرة أو حاملة للجلسات أو من فئات دائمة لـ OAuth لا تناسب حل SecretRef الخارجي للقراءة فقط.

## ذو صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics)
