---
read_when:
    - إضافة ترحيلات Doctor أو تعديلها
    - إدخال تغييرات إعداد غير متوافقة مع الإصدارات السابقة
summary: 'أمر Doctor: فحوصات الصحة، وترحيلات الإعداد، وخطوات الإصلاح'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:47:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` هو أداة الإصلاح + الترحيل في OpenClaw. فهو يصلح
الإعداد/الحالة القديمة، ويفحص الصحة، ويوفر خطوات إصلاح عملية.

## بداية سريعة

```bash
openclaw doctor
```

### دون واجهة / الأتمتة

```bash
openclaw doctor --yes
```

اقبل القيم الافتراضية من دون مطالبة (بما في ذلك خطوات إعادة التشغيل/الخدمة/إصلاح sandbox عند الاقتضاء).

```bash
openclaw doctor --repair
```

طبّق الإصلاحات الموصى بها من دون مطالبة (إصلاحات + إعادة تشغيل حيث يكون ذلك آمنًا).

```bash
openclaw doctor --repair --force
```

طبّق الإصلاحات القوية أيضًا (يستبدل إعدادات supervisor المخصصة).

```bash
openclaw doctor --non-interactive
```

شغّل من دون مطالبات وطبّق فقط الترحيلات الآمنة (تطبيع الإعداد + نقل الحالة على القرص). يتجاوز إجراءات إعادة التشغيل/الخدمة/sandbox التي تتطلب تأكيدًا بشريًا.
تعمل ترحيلات الحالة القديمة تلقائيًا عند اكتشافها.

```bash
openclaw doctor --deep
```

افحص خدمات النظام بحثًا عن عمليات تثبيت Gateway إضافية (launchd/systemd/schtasks).

إذا كنت تريد مراجعة التغييرات قبل الكتابة، فافتح ملف الإعداد أولًا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

- تحديث اختياري قبل التنفيذ لنسخ git المثبتة (في الوضع التفاعلي فقط).
- فحص حداثة بروتوكول UI (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
- فحص الصحة + مطالبة بإعادة التشغيل.
- ملخص حالة Skills ‏(مؤهلة/مفقودة/محظورة) وحالة Plugin.
- تطبيع الإعداد للقيم القديمة.
- ترحيل إعداد Talk من حقول `talk.*` المسطحة القديمة إلى `talk.provider` + `talk.providers.<provider>`.
- فحوصات ترحيل المتصفح لإعدادات Chrome extension القديمة وجهوزية Chrome MCP.
- تحذيرات تجاوز مزود OpenCode ‏(`models.providers.opencode` / `models.providers.opencode-go`).
- تحذيرات تظليل Codex OAuth ‏(`models.providers.openai-codex`).
- فحص المتطلبات المسبقة لـ OAuth TLS لملفات OpenAI Codex OAuth.
- ترحيل الحالة القديمة على القرص (الجلسات/دليل الوكيل/مصادقة WhatsApp).
- ترحيل مفاتيح عقود Plugin manifest القديمة (`speechProviders` و`realtimeTranscriptionProviders` و`realtimeVoiceProviders` و`mediaUnderstandingProviders` و`imageGenerationProviders` و`videoGenerationProviders` و`webFetchProviders` و`webSearchProviders` ← `contracts`).
- ترحيل مخزن Cron القديم (`jobId` و`schedule.cron` وحقول التسليم/الحمولة ذات المستوى الأعلى و`provider` في الحمولة ووظائف احتياط Webhook البسيطة من نوع `notify: true`).
- فحص ملفات قفل الجلسات وتنظيف الأقفال القديمة.
- فحوصات سلامة الحالة والأذونات (الجلسات، والنصوص، ودليل الحالة).
- فحوصات أذونات ملف الإعداد (`chmod 600`) عند التشغيل محليًا.
- صحة مصادقة النموذج: يفحص انتهاء صلاحية OAuth، ويمكنه تحديث الرموز التي توشك على الانتهاء، ويعرض حالات التهدئة/التعطيل لملفات تعريف المصادقة.
- اكتشاف أدلة مساحة عمل إضافية (`~/openclaw`).
- إصلاح صورة sandbox عند تمكين sandboxing.
- ترحيل الخدمة القديمة واكتشاف Gateways الإضافية.
- ترحيل حالة Matrix channel القديمة (في وضع `--fix` / `--repair`).
- فحوصات وقت تشغيل Gateway ‏(الخدمة مثبتة لكن لا تعمل؛ وlaunchd label مخزنة مؤقتًا).
- تحذيرات حالة القناة (يتم فحصها من Gateway العاملة).
- تدقيق إعداد supervisor ‏(launchd/systemd/schtasks) مع إصلاح اختياري.
- فحوصات أفضل ممارسات وقت تشغيل Gateway ‏(Node مقابل Bun، ومسارات مدير الإصدارات).
- تشخيص تضارب منفذ Gateway ‏(الافتراضي `18789`).
- تحذيرات الأمان لسياسات الرسائل المباشرة المفتوحة.
- فحوصات مصادقة Gateway لوضع الرمز المحلي (يوفر إنشاء رمز عندما لا يوجد مصدر رمز؛ ولا يستبدل إعدادات token SecretRef).
- اكتشاف مشكلات اقتران الأجهزة (طلبات الاقتران الأولى المعلقة، وترقيات الدور/النطاقات المعلقة، وانحراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانحراف مصادقة السجل المقترن).
- فحص systemd linger على Linux.
- فحص حجم ملفات bootstrap في مساحة العمل (تحذيرات الاقتطاع/الاقتراب من الحد لملفات السياق).
- فحص حالة shell completion والتثبيت/الترقية التلقائيين.
- فحص جاهزية مزود تضمين البحث في الذاكرة (نموذج محلي أو مفتاح API بعيد أو ملف QMD تنفيذي).
- فحوصات تثبيت المصدر (عدم تطابق مساحة عمل pnpm، أصول UI مفقودة، ملف tsx التنفيذي مفقود).
- يكتب الإعداد المحدّث + بيانات المعالج الوصفية.

## الإكمال الرجعي وإعادة الضبط في Dreams UI

تتضمن مشاهد Dreams في Control UI إجراءات **Backfill** و**Reset** و**Clear Grounded**
لسير عمل Dreaming المؤسس على grounding. تستخدم هذه الإجراءات
أساليب RPC على نمط doctor في Gateway، لكنها **ليست** جزءًا من إصلاح/ترحيل
CLI في `openclaw doctor`.

ما الذي تفعله:

- يقوم **Backfill** بفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في
  مساحة العمل النشطة، ويشغّل تمرير يوميات REM المؤسس، ويكتب إدخالات backfill
  قابلة للعكس في `DREAMS.md`.
- يزيل **Reset** فقط إدخالات اليوميات الخاصة بالـ backfill المعلّمة من `DREAMS.md`.
- يزيل **Clear Grounded** فقط الإدخالات القصيرة الأجل المؤسَّسة المرحلية
  التي جاءت من إعادة تشغيل تاريخية ولم تكن قد راكمت بعد استدعاءً حيًا أو
  دعمًا يوميًا.

ما الذي **لا** تفعله من تلقاء نفسها:

- لا تعدّل `MEMORY.md`
- لا تشغّل ترحيلات doctor الكاملة
- لا تهيئ تلقائيًا المرشحين المؤسسين إلى مخزن الترقية القصير الأجل الحي
  إلا إذا شغّلت أنت أولًا مسار CLI المرحلي صراحةً

إذا كنت تريد أن يؤثر التشغيل التاريخي المؤسس في مسار الترقية العميقة
العادي، فاستخدم تدفق CLI بدلًا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى تهيئة المرشحين الدائمين المؤسسين في مخزن Dreaming القصير الأجل مع
الإبقاء على `DREAMS.md` كسطح للمراجعة.

## السلوك المفصل والمبرر

### 0) تحديث اختياري (نسخ git المثبتة)

إذا كانت هذه نسخة git checkout وكان doctor يعمل في وضع تفاعلي، فإنه يعرض
إجراء تحديث (fetch/rebase/build) قبل تشغيل doctor.

### 1) تطبيع الإعداد

إذا كان الإعداد يحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction`
من دون تجاوز خاص بالقناة)، فإن doctor يطبعها إلى المخطط الحالي.

ويتضمن ذلك حقول Talk المسطحة القديمة. فإعداد Talk العام الحالي هو
`talk.provider` + `talk.providers.<provider>`. ويعيد doctor كتابة الأشكال القديمة
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` إلى خريطة المزوّد.

### 2) ترحيلات مفاتيح الإعداد القديمة

عندما يحتوي الإعداد على مفاتيح مهجورة، ترفض الأوامر الأخرى العمل وتطلب
منك تشغيل `openclaw doctor`.

سيقوم doctor بما يلي:

- شرح المفاتيح القديمة التي تم العثور عليها.
- عرض الترحيل الذي طبقه.
- إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدّث.

تقوم Gateway أيضًا بتشغيل ترحيلات doctor تلقائيًا عند بدء التشغيل عندما تكتشف
تنسيق إعداد قديمًا، بحيث يتم إصلاح الإعدادات القديمة من دون تدخل يدوي.
تتم معالجة ترحيلات مخزن وظائف Cron بواسطة `openclaw doctor --fix`.

الترحيلات الحالية:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` على المستوى الأعلى
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- القيم القديمة `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` ‏(`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` و`messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` و`messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` ‏(`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` ‏(`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` ‏(`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` و`plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` و`providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة مع بقاء قيم قنوات أحادية الحساب على المستوى الأعلى، انقل تلك القيم ذات نطاق الحساب إلى الحساب المُرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ ويمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي مطابق موجود)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` ‏(tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- إزالة `browser.relayBindHost` ‏(إعداد relay قديم لـ extension)

تتضمن تحذيرات doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

- إذا تم تكوين إدخالين أو أكثر في `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، فسيحذر doctor من أن التوجيه الاحتياطي قد يختار حسابًا غير متوقع.
- إذا كانت `channels.<channel>.defaultAccount` معيّنة إلى معرّف حساب غير معروف، فسيحذر doctor ويسرد معرّفات الحسابات المكوّنة.

### 2b) تجاوزات مزود OpenCode

إذا أضفت يدويًا `models.providers.opencode` أو `opencode-zen` أو `opencode-go`،
فإن ذلك يتجاوز فهرس OpenCode المدمج من `@mariozechner/pi-ai`.
وقد يفرض ذلك توجيه النماذج إلى API غير صحيحة أو يصفر التكاليف. ويحذّر doctor حتى
تتمكن من إزالة التجاوز واستعادة توجيه API + التكاليف لكل نموذج.

### 2c) ترحيل المتصفح وجهوزية Chrome MCP

إذا كان إعداد المتصفح لا يزال يشير إلى مسار Chrome extension الذي تمت إزالته، فإن doctor
يطبعّه إلى نموذج الإرفاق المحلي الحالي لـ Chrome MCP:

- `browser.profiles.*.driver: "extension"` تصبح `"existing-session"`
- تتم إزالة `browser.relayBindHost`

يقوم doctor أيضًا بتدقيق مسار Chrome MCP المحلي على المضيف عندما تستخدم
`defaultProfile: "user"` أو ملف تعريف `existing-session` مكوّنًا:

- يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات التعريف ذات الاتصال التلقائي الافتراضي
- يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
- يذكّرك بتمكين التصحيح عن بُعد في صفحة inspect الخاصة بالمتصفح (على
  سبيل المثال `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging`
  أو `edge://inspect/#remote-debugging`)

لا يمكن لـ doctor تمكين الإعداد على جانب Chrome نيابةً عنك. ولا يزال
Chrome MCP المحلي على المضيف يتطلب ما يلي:

- متصفحًا قائمًا على Chromium بإصدار 144+ على مضيف gateway/node
- أن يكون المتصفح قيد التشغيل محليًا
- تمكين التصحيح عن بُعد في ذلك المتصفح
- الموافقة على أول مطالبة موافقة على الإرفاق في المتصفح

الجهوزية هنا تتعلق فقط بالمتطلبات المسبقة للإرفاق المحلي. ولا يزال
existing-session يحتفظ بحدود مسار Chrome MCP الحالية؛ أما المسارات المتقدمة مثل
`responsebody` وتصدير PDF واعتراض التنزيل وإجراءات الدُفعات فلا تزال تتطلب
متصفحًا مُدارًا أو ملف تعريف raw CDP.

لا ينطبق هذا الفحص على Docker أو sandbox أو remote-browser أو
التدفقات الأخرى بدون واجهة. فهذه تستمر في استخدام raw CDP.

### 2d) المتطلبات المسبقة لـ OAuth TLS

عندما يكون ملف OpenAI Codex OAuth مكوّنًا، يفحص doctor نقطة نهاية
التخويل الخاصة بـ OpenAI للتحقق من أن حزمة TLS المحلية في Node/OpenSSL
قادرة على التحقق من سلسلة الشهادات. وإذا فشل الفحص بسبب خطأ في الشهادة (على
سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` أو شهادة منتهية الصلاحية أو شهادة موقعة ذاتيًا)،
فسيطبع doctor إرشادات إصلاح خاصة بالنظام الأساسي. وعلى macOS عند استخدام Node من Homebrew،
يكون الإصلاح عادةً `brew postinstall ca-certificates`. ومع `--deep`، يعمل الفحص
حتى إذا كانت Gateway سليمة.

### 2c) تجاوزات مزود Codex OAuth

إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI القديمة تحت
`models.providers.openai-codex`، فقد تقوم بتظليل مسار مزود Codex OAuth المدمج
الذي تستخدمه الإصدارات الأحدث تلقائيًا. ويحذّر doctor عندما يرى
إعدادات النقل القديمة هذه إلى جانب Codex OAuth حتى تتمكن من إزالة تجاوز النقل
القديم أو إعادة كتابته واستعادة سلوك التوجيه/الاحتياط المدمج.
ولا تزال الوكلاء المخصصة والتجاوزات التي تعتمد فقط على الرؤوس مدعومة ولا
تؤدي إلى هذا التحذير.

### 3) ترحيلات الحالة القديمة (تخطيط القرص)

يمكن لـ doctor ترحيل تخطيطات القرص القديمة إلى البنية الحالية:

- مخزن الجلسات + النصوص:
  - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
- دليل الوكيل:
  - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
- حالة مصادقة WhatsApp ‏(Baileys):
  - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
  - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` ‏(معرّف الحساب الافتراضي: `default`)

هذه الترحيلات تُنفَّذ بأفضل جهد وهي idempotent؛ وسيصدر doctor تحذيرات عندما
يترك أي مجلدات قديمة خلفه كنسخ احتياطية. كما تقوم Gateway/CLI أيضًا بترحيل
الجلسات القديمة + دليل الوكيل تلقائيًا عند بدء التشغيل بحيث تصل
السجل/المصادقة/النماذج إلى المسار الخاص بكل وكيل من دون تشغيل doctor يدويًا. أما مصادقة WhatsApp
فهي تُرحَّل عمدًا فقط عبر `openclaw doctor`. ويقارن تطبيع Talk provider/provider-map الآن
بالمساواة البنيوية، لذا فإن الفروق الناتجة فقط عن ترتيب المفاتيح لم تعد تؤدي
إلى تغييرات متكررة عديمة الأثر في `doctor --fix`.

### 3a) ترحيلات manifest القديمة للـ Plugin

يفحص doctor جميع manifest الخاصة بالـ Plugins المثبتة بحثًا عن مفاتيح القدرات
العليا المهجورة (`speechProviders` و`realtimeTranscriptionProviders` و
`realtimeVoiceProviders` و`mediaUnderstandingProviders` و
`imageGenerationProviders` و`videoGenerationProviders` و`webFetchProviders` و
`webSearchProviders`). وعند العثور عليها، يعرض نقلها إلى كائن `contracts`
وإعادة كتابة ملف manifest في مكانه. وهذا الترحيل idempotent؛
فإذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم
من دون تكرار البيانات.

### 3b) ترحيلات مخزن Cron القديمة

يتحقق doctor أيضًا من مخزن وظائف Cron ‏(`~/.openclaw/cron/jobs.json` افتراضيًا،
أو `cron.store` عند تجاوزه) بحثًا عن أشكال وظائف قديمة لا يزال المجدول
يقبلها للتوافق.

تشمل عمليات التنظيف الحالية لـ Cron ما يلي:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- حقول الحمولة ذات المستوى الأعلى (`message` و`model` و`thinking` و...) → `payload`
- حقول التسليم ذات المستوى الأعلى (`deliver` و`channel` و`to` و`provider` و...) → `delivery`
- أسماء التسليم المستعارة في `provider` داخل الحمولة → `delivery.channel` صريحة
- وظائف احتياط Webhook القديمة البسيطة من نوع `notify: true` → `delivery.mode="webhook"` صريحة مع `delivery.to=cron.webhook`

لا يقوم doctor بترحيل وظائف `notify: true` تلقائيًا إلا عندما يستطيع
القيام بذلك من دون تغيير السلوك. وإذا كانت وظيفة ما تجمع بين احتياط notify القديم
ووضع تسليم غير webhook موجود، فسيحذر doctor ويترك تلك الوظيفة للمراجعة اليدوية.

### 3c) تنظيف أقفال الجلسات

يفحص doctor كل دليل جلسات وكيل بحثًا عن ملفات قفل كتابة قديمة — وهي ملفات تُترك
عندما تخرج جلسة بشكل غير طبيعي. ولكل ملف قفل يعثر عليه، يعرض:
المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان
يُعد قديمًا (PID ميت أو أقدم من 30 دقيقة). وفي وضع `--fix` / `--repair`
يقوم بإزالة ملفات القفل القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة ويطلب
منك إعادة التشغيل باستخدام `--fix`.

### 4) فحوصات سلامة الحالة (استمرارية الجلسة، والتوجيه، والسلامة)

دليل الحالة هو الجذع التشغيلي الأساسي. وإذا اختفى، فإنك تفقد
الجلسات وبيانات الاعتماد والسجلات والإعداد (ما لم تكن لديك نسخ احتياطية في مكان آخر).

يفحص doctor ما يلي:

- **دليل الحالة مفقود**: يحذر من فقدان الحالة الكارثي، ويعرض إعادة إنشاء
  الدليل، ويذكّرك بأنه لا يستطيع استعادة البيانات المفقودة.
- **أذونات دليل الحالة**: يتحقق من إمكانية الكتابة؛ ويعرض إصلاح الأذونات
  (ويصدر تلميح `chown` عند اكتشاف عدم تطابق المالك/المجموعة).
- **دليل حالة macOS المتزامن مع السحابة**: يحذر عندما تُحل الحالة تحت iCloud Drive
  ‏(`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو
  `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تتسبب في بطء I/O
  وسباقات القفل/المزامنة.
- **دليل حالة Linux على SD أو eMMC**: يحذر عندما تُحل الحالة إلى مصدر ربط `mmcblk*`،
  لأن I/O العشوائي المعتمد على SD أو eMMC قد يكون أبطأ ويؤدي إلى تآكل أسرع
  تحت كتابات الجلسات وبيانات الاعتماد.
- **أدلة الجلسات مفقودة**: تتطلب `sessions/` ودليل مخزن الجلسات
  للحفاظ على السجل وتجنب أعطال `ENOENT`.
- **عدم تطابق النصوص**: يحذر عندما تحتوي إدخالات الجلسات الحديثة على
  ملفات نصوص مفقودة.
- **"JSONL بسطر واحد" للجلسة الرئيسية**: يضع علامة عندما يحتوي النص الرئيسي على سطر واحد فقط
  (ما يعني أن السجل لا يتراكم).
- **أدلة حالة متعددة**: يحذر عند وجود مجلدات `~/.openclaw` متعددة عبر
  أدلة home أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد ينقسم السجل بين التثبيتات).
- **تذكير الوضع البعيد**: إذا كانت `gateway.mode=remote`، يذكّرك doctor بتشغيله
  على المضيف البعيد (فالحالة تعيش هناك).
- **أذونات ملف الإعداد**: يحذر إذا كان `~/.openclaw/openclaw.json`
  قابلاً للقراءة من قبل المجموعة/العالم، ويعرض تشديده إلى `600`.

### 5) صحة مصادقة النموذج (انتهاء صلاحية OAuth)

يفحص doctor ملفات OAuth في مخزن المصادقة، ويحذر عندما تكون الرموز
على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. وإذا كان ملف
Anthropic OAuth/token قديمًا، فإنه يقترح استخدام مفتاح Anthropic API أو
مسار Anthropic setup-token.
ولا تظهر مطالبات التحديث إلا عند التشغيل التفاعلي (TTY)؛ أما `--non-interactive`
فيتجاوز محاولات التحديث.

عندما يفشل تحديث OAuth بشكل دائم (على سبيل المثال `refresh_token_reused` أو
`invalid_grant` أو عندما يطلب منك المزوّد تسجيل الدخول مجددًا)، يذكر doctor
أن إعادة المصادقة مطلوبة ويطبع الأمر الدقيق `openclaw models auth login --provider ...`
الذي يجب تشغيله.

كما يعرض doctor أيضًا ملفات المصادقة التي تكون غير قابلة للاستخدام مؤقتًا بسبب:

- فترات تهدئة قصيرة (حدود المعدل/المهلات/فشل المصادقة)
- تعطيلات أطول (فشل الفوترة/الرصيد)

### 6) التحقق من نموذج Hooks

إذا كانت `hooks.gmail.model` معيّنة، فإن doctor يتحقق من مرجع النموذج مقابل
الفهرس وقائمة السماح ويحذر عندما لا يمكن حله أو يكون غير مسموح به.

### 7) إصلاح صورة sandbox

عندما يكون sandboxing مفعّلًا، يفحص doctor صور Docker ويعرض إنشاءها أو
التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.

### 7b) تبعيات وقت التشغيل المضمّنة للـ Plugin

يتحقق doctor من تبعيات وقت التشغيل فقط للـ Plugins المضمّنة النشطة في
الإعداد الحالي أو المفعّلة بواسطة manifest المضمّن الافتراضي، مثل
`plugins.entries.discord.enabled: true` أو القيم القديمة
`channels.discord.enabled: true` أو مزوّد مضمّن مفعّل افتراضيًا. وإذا كانت أي تبعيات
مفقودة، يذكر doctor الحزم ويثبتها في وضع
`openclaw doctor --fix` / `openclaw doctor --repair`. أما الـ Plugins الخارجية فما تزال
تستخدم `openclaw plugins install` / `openclaw plugins update`؛ ولا يقوم doctor
بتثبيت التبعيات لمسارات Plugins عشوائية.

كما يمكن لـ Gateway وCLI المحلي أيضًا إصلاح تبعيات وقت التشغيل النشطة للـ Plugins المضمّنة
عند الطلب قبل استيراد Plugin مضمّن. وتكون عمليات التثبيت هذه
محصورة في جذر تثبيت وقت تشغيل Plugin، وتعمل مع تعطيل scripts، ولا
تكتب package lock، وتحرسها lock على جذر التثبيت حتى لا تقوم عمليات بدء CLI
أو Gateway المتزامنة بتعديل شجرة `node_modules` نفسها في الوقت نفسه.

### 8) ترحيلات خدمة Gateway وتلميحات التنظيف

يكتشف doctor خدمات Gateway القديمة (launchd/systemd/schtasks) و
يعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي.
كما يمكنه فحص الخدمات الإضافية الشبيهة بـ Gateway وطباعة تلميحات التنظيف.
وتُعد خدمات OpenClaw Gateway المسماة بحسب profile خدمات من الدرجة الأولى ولا
يتم تمييزها على أنها "إضافية".

### 8b) ترحيل Matrix عند بدء التشغيل

عندما يحتوي حساب Matrix channel على ترحيل حالة قديم معلّق أو قابل للتنفيذ،
فإن doctor (في وضع `--fix` / `--repair`) ينشئ لقطة قبل الترحيل ثم
يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وتحضير الحالة
المشفرة القديمة. وكلتا الخطوتين غير قاتلتين؛ يتم تسجيل الأخطاء ويستمر
بدء التشغيل. وفي وضع القراءة فقط (`openclaw doctor` من دون `--fix`) يتم
تجاوز هذا الفحص بالكامل.

### 8c) اقتران الأجهزة وانحراف المصادقة

يفحص doctor الآن حالة اقتران الأجهزة كجزء من تمرير الصحة المعتاد.

ما الذي يعرضه:

- طلبات اقتران أولية معلقة
- ترقيات أدوار معلقة للأجهزة المقترنة بالفعل
- ترقيات نطاقات معلقة للأجهزة المقترنة بالفعل
- إصلاحات عدم تطابق المفتاح العام عندما يظل معرّف الجهاز مطابقًا لكن
  هوية الجهاز لم تعد تطابق السجل الموافق عليه
- سجلات مقترنة تفتقد رمزًا نشطًا لدور معتمد
- رموز مقترنة تنحرف نطاقاتها خارج خط الأساس المعتمد للاقتران
- إدخالات رموز أجهزة مخزنة محليًا للجهاز الحالي تسبق دوران رمز
  على جانب gateway أو تحمل بيانات نطاقات قديمة

لا يقوم doctor بالموافقة التلقائية على طلبات الاقتران أو بتدوير رموز الأجهزة تلقائيًا. بل
يطبع الخطوات التالية الدقيقة بدلًا من ذلك:

- افحص الطلبات المعلقة باستخدام `openclaw devices list`
- وافق على الطلب الدقيق باستخدام `openclaw devices approve <requestId>`
- دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
- أزل سجلًا قديمًا وأعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

وهذا يسد الثغرة الشائعة "مقترن بالفعل لكن لا يزال يطلب الاقتران":
إذ يميز doctor الآن بين الاقتران الأولي وبين ترقيات الدور/النطاقات
المعلقة وبين انحراف الرمز/هوية الجهاز القديم.

### 9) تحذيرات الأمان

يصدر doctor تحذيرات عندما يكون مزوّد ما مفتوحًا للرسائل المباشرة من دون قائمة سماح، أو
عندما تكون سياسة ما مكوّنة بطريقة خطرة.

### 10) systemd linger ‏(Linux)

إذا كان يعمل كخدمة مستخدم systemd، فإن doctor يضمن تمكين lingering حتى
تبقى gateway حيّة بعد تسجيل الخروج.

### 11) حالة مساحة العمل (Skills وPlugins والأدلة القديمة)

يطبع doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

- **حالة Skills**: عدد Skills المؤهلة وتلك ذات المتطلبات المفقودة وتلك المحظورة بقائمة السماح.
- **أدلة مساحة العمل القديمة**: يحذر عندما توجد `~/openclaw` أو أدلة مساحة عمل قديمة أخرى
  إلى جانب مساحة العمل الحالية.
- **حالة Plugin**: عدد Plugins المحملة/المعطلة/التي بها أخطاء؛ ويسرد معرّفات Plugins التي بها
  أخطاء؛ ويعرض قدرات الـ Plugins المجمعة.
- **تحذيرات توافق Plugin**: يضع علامة على Plugins التي لديها مشكلات توافق مع
  وقت التشغيل الحالي.
- **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل التي يصدرها
  سجل Plugin.

### 11b) حجم ملف Bootstrap

يفحص doctor ما إذا كانت ملفات bootstrap الخاصة بمساحة العمل (مثل `AGENTS.md`،
و`CLAUDE.md`، أو ملفات السياق الأخرى المحقونة) قريبة من
ميزانية الأحرف المكوّنة أو متجاوزة لها. ويعرض لكل ملف عدد الأحرف الخام مقابل المحقونة، ونسبة
الاقتطاع، وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة
كنسبة من إجمالي الميزانية. وعندما يتم اقتطاع الملفات أو تقترب من
الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars`
و`agents.defaults.bootstrapTotalMaxChars`.

### 11c) إكمال shell

يفحص doctor ما إذا كان إكمال tab مثبتًا للـ shell الحالي
(zsh أو bash أو fish أو PowerShell):

- إذا كان ملف تعريف shell يستخدم نمط إكمال ديناميكي بطيء
  (`source <(openclaw completion ...)`)، فسيقوم doctor بترقيته إلى
  النسخة الأسرع المعتمدة على الملف المخزّن مؤقتًا.
- إذا كان الإكمال مكوّنًا في ملف التعريف لكن ملف التخزين المؤقت مفقود،
  فسيعيد doctor إنشاء التخزين المؤقت تلقائيًا.
- إذا لم يكن هناك أي إعداد للإكمال على الإطلاق، فسيعرض doctor تثبيته
  (في الوضع التفاعلي فقط؛ ويتم تخطيه مع `--non-interactive`).

شغّل `openclaw completion --write-state` لإعادة إنشاء التخزين المؤقت يدويًا.

### 12) فحوصات مصادقة Gateway ‏(الرمز المحلي)

يفحص doctor جاهزية مصادقة رمز Gateway المحلي.

- إذا كان وضع الرمز يحتاج إلى رمز ولم يوجد أي مصدر رمز، فسيعرض doctor إنشاء واحد.
- إذا كانت `gateway.auth.token` مُدارة عبر SecretRef لكنها غير متاحة، فسيحذر doctor ولن يستبدلها بنص صريح.
- يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون هناك token SecretRef مكوّن.

### 12b) إصلاحات للقراءة فقط مع مراعاة SecretRef

تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة من دون إضعاف
سلوك الفشل السريع في وقت التشغيل.

- يستخدم `openclaw doctor --fix` الآن نموذج الملخص للقراءة فقط نفسه الخاص بـ SecretRef كما في أوامر عائلة status لإجراء إصلاحات إعداد مستهدفة.
- مثال: يحاول إصلاح `allowFrom` / `groupAllowFrom` في Telegram باسم المستخدم `@username` استخدام بيانات اعتماد البوت المكوّنة عندما تكون متاحة.
- إذا كان رمز Telegram bot مكوّنًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، فسيذكر doctor أن بيانات الاعتماد مكوّنة لكنها غير متاحة ويتجاوز الحل التلقائي بدلًا من التعطل أو الإبلاغ الخاطئ عن أن الرمز مفقود.

### 13) فحص صحة Gateway + إعادة التشغيل

يشغّل doctor فحصًا للصحة ويعرض إعادة تشغيل gateway عندما تبدو
غير سليمة.

### 13b) جاهزية البحث في الذاكرة

يفحص doctor ما إذا كان مزود تضمين البحث في الذاكرة المكوّن جاهزًا
للوكيل الافتراضي. ويعتمد السلوك على الواجهة الخلفية والمزوّد المكوّنين:

- **واجهة خلفية QMD**: يفحص ما إذا كان الملف التنفيذي `qmd` متاحًا وقابلًا للتشغيل.
  وإذا لم يكن كذلك، يطبع إرشادات إصلاح تتضمن حزمة npm وخيارًا يدويًا لمسار الملف التنفيذي.
- **مزوّد محلي صريح**: يتحقق من وجود ملف نموذج محلي أو
  URL لنموذج بعيد/قابل للتنزيل معروف. وإذا كان مفقودًا، يقترح التبديل إلى مزوّد بعيد.
- **مزوّد بعيد صريح** (`openai` أو `voyage` أو غيرهما): يتحقق من وجود مفتاح API
  في البيئة أو في مخزن المصادقة. ويطبع تلميحات إصلاح عملية إذا كان مفقودًا.
- **مزوّد تلقائي**: يتحقق أولًا من توفر النموذج المحلي، ثم يحاول كل مزوّد بعيد
  حسب ترتيب الاختيار التلقائي.

عندما تكون نتيجة فحص Gateway متاحة (أي كانت gateway سليمة وقت
الفحص)، يراجع doctor نتيجتها مقابل الإعداد المرئي من CLI ويشير
إلى أي اختلاف.

استخدم `openclaw memory status --deep` للتحقق من جاهزية التضمين في وقت التشغيل.

### 14) تحذيرات حالة القناة

إذا كانت Gateway سليمة، يشغّل doctor فحصًا لحالة القناة ويعرض
تحذيرات مع إصلاحات مقترحة.

### 15) تدقيق إعداد supervisor + الإصلاح

يفحص doctor إعداد supervisor المثبت (launchd/systemd/schtasks) بحثًا عن
إعدادات افتراضية مفقودة أو قديمة (مثل تبعيات systemd الخاصة بـ network-online و
تأخير إعادة التشغيل). وعندما يجد عدم تطابق، فإنه يوصي بتحديث ويمكنه
إعادة كتابة ملف الخدمة/المهمة إلى الإعدادات الافتراضية الحالية.

ملاحظات:

- يطلب `openclaw doctor` الموافقة قبل إعادة كتابة إعداد supervisor.
- يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
- يطبّق `openclaw doctor --repair` الإصلاحات الموصى بها من دون مطالبات.
- يستبدل `openclaw doctor --repair --force` إعدادات supervisor المخصصة.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكانت `gateway.auth.token` مُدارة عبر SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز الصريح المحلولة في بيانات بيئة خدمة supervisor الوصفية.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان token SecretRef المكوّن غير محلول، فسيحظر doctor مسار التثبيت/الإصلاح مع إرشادات عملية.
- إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مكوّنتين وكانت `gateway.auth.mode` غير معيّنة، فسيحظر doctor التثبيت/الإصلاح حتى يتم تعيين الوضع صراحةً.
- بالنسبة إلى وحدات user-systemd على Linux، تتضمن فحوصات انحراف الرمز في doctor الآن كلاً من المصدرين `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
- يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

### 16) تشخيصات وقت تشغيل Gateway + المنفذ

يفحص doctor وقت تشغيل الخدمة (PID وآخر حالة خروج) ويحذر عندما
تكون الخدمة مثبتة لكنها لا تعمل فعليًا. كما يفحص أيضًا تضارب المنافذ
على منفذ gateway ‏(الافتراضي `18789`) ويعرض الأسباب المحتملة (gateway تعمل بالفعل،
أو نفق SSH).

### 17) أفضل الممارسات لوقت تشغيل Gateway

يحذر doctor عندما تعمل خدمة gateway على Bun أو على مسار Node مُدار عبر مدير إصدارات
(`nvm` أو `fnm` أو `volta` أو `asdf` أو غيرها). تتطلب قناتا WhatsApp وTelegram
بيئة Node، ويمكن أن تتعطل مسارات مديري الإصدارات بعد الترقيات لأن الخدمة لا
تحمّل تهيئة shell لديك. ويعرض doctor الترحيل إلى تثبيت Node على مستوى النظام
عندما يكون متاحًا (Homebrew/apt/choco).

### 18) كتابة الإعداد + بيانات المعالج الوصفية

يحفظ doctor أي تغييرات في الإعداد ويضع وسمًا في بيانات المعالج الوصفية لتسجيل
تشغيل doctor.

### 19) نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)

يقترح doctor نظام ذاكرة لمساحة العمل عندما يكون مفقودًا ويطبع نصيحة نسخة احتياطية
إذا لم تكن مساحة العمل تحت git بالفعل.

راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للحصول على دليل كامل عن
بنية مساحة العمل والنسخ الاحتياطي عبر git (يُوصى بمستودع GitHub أو GitLab خاص).

## ذو صلة

- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
- [دليل تشغيل Gateway](/ar/gateway)
