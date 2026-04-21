---
read_when:
    - إضافة ترحيلات doctor أو تعديلها
    - إدخال تغييرات جذرية على الإعدادات
summary: 'أمر Doctor: فحوصات السلامة، وترحيلات الإعدادات، وخطوات الإصلاح'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T07:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` هو أداة الإصلاح + الترحيل في OpenClaw. يقوم بإصلاح الإعدادات/الحالة
القديمة، وفحص السلامة، وتقديم خطوات إصلاح قابلة للتنفيذ.

## البدء السريع

```bash
openclaw doctor
```

### بدون واجهة / الأتمتة

```bash
openclaw doctor --yes
```

اقبل القيم الافتراضية دون مطالبة (بما في ذلك خطوات إصلاح إعادة التشغيل/الخدمة/العزل عند الاقتضاء).

```bash
openclaw doctor --repair
```

طبّق الإصلاحات الموصى بها دون مطالبة (الإصلاحات + إعادة التشغيل حيث يكون ذلك آمنًا).

```bash
openclaw doctor --repair --force
```

طبّق الإصلاحات القوية أيضًا (يستبدل إعدادات المشرف المخصصة).

```bash
openclaw doctor --non-interactive
```

شغّل دون مطالبات وطبّق فقط الترحيلات الآمنة (تطبيع الإعدادات + نقل الحالة على القرص). يتخطى إجراءات إعادة التشغيل/الخدمة/العزل التي تتطلب تأكيدًا بشريًا.
تُشغَّل ترحيلات الحالة القديمة تلقائيًا عند اكتشافها.

```bash
openclaw doctor --deep
```

افحص خدمات النظام بحثًا عن عمليات تثبيت Gateway إضافية (launchd/systemd/schtasks).

إذا كنت تريد مراجعة التغييرات قبل الكتابة، فافتح ملف الإعدادات أولًا:

```bash
cat ~/.openclaw/openclaw.json
```

## ما الذي يفعله (ملخص)

- تحديث اختياري قبل التشغيل لعمليات التثبيت عبر git (تفاعلي فقط).
- فحص حداثة بروتوكول واجهة المستخدم (يعيد بناء Control UI عندما يكون مخطط البروتوكول أحدث).
- فحص السلامة + مطالبة بإعادة التشغيل.
- ملخص حالة Skills (مؤهلة/مفقودة/محجوبة) وحالة Plugin.
- تطبيع الإعدادات للقيم القديمة.
- ترحيل إعدادات Talk من حقول `talk.*` القديمة المسطحة إلى `talk.provider` + `talk.providers.<provider>`.
- فحوصات ترحيل المتصفح لإعدادات Chrome extension القديمة وجاهزية Chrome MCP.
- تحذيرات تجاوز مزود OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- تحذيرات حجب Codex OAuth (`models.providers.openai-codex`).
- فحص متطلبات OAuth TLS لملفات OpenAI Codex OAuth التعريفية.
- ترحيل الحالة القديمة على القرص (sessions/agent dir/WhatsApp auth).
- ترحيل مفتاح عقد Plugin manifest القديم (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- ترحيل مخزن Cron القديم (`jobId`, `schedule.cron`, وحقول delivery/payload ذات المستوى الأعلى، و`provider` داخل payload، ووظائف Webhook الاحتياطية البسيطة `notify: true`).
- فحص ملف قفل الجلسة وتنظيف الأقفال القديمة.
- فحوصات سلامة الحالة والأذونات (sessions، والنصوص التفريغية، ودليل الحالة).
- فحوصات أذونات ملف الإعدادات (`chmod 600`) عند التشغيل محليًا.
- سلامة مصادقة النموذج: يفحص انتهاء OAuth، ويمكنه تحديث الرموز التي توشك على الانتهاء، ويبلّغ عن حالات التهدئة/التعطيل في ملف المصادقة.
- اكتشاف دليل مساحة عمل إضافي (`~/openclaw`).
- إصلاح صورة العزل عند تمكين العزل.
- ترحيل الخدمة القديمة واكتشاف Gateway إضافية.
- ترحيل الحالة القديمة لقناة Matrix (في وضع `--fix` / `--repair`).
- فحوصات وقت تشغيل Gateway (الخدمة مثبتة ولكنها غير قيد التشغيل؛ وسم launchd مخزن مؤقتًا).
- تحذيرات حالة القنوات (يتم فحصها من Gateway قيد التشغيل).
- تدقيق إعدادات المشرف (launchd/systemd/schtasks) مع إصلاح اختياري.
- فحوصات أفضل الممارسات لوقت تشغيل Gateway (Node مقابل Bun، ومسارات مدير الإصدارات).
- تشخيص تعارض منفذ Gateway (الافتراضي `18789`).
- تحذيرات أمان لسياسات الرسائل الخاصة المفتوحة.
- فحوصات مصادقة Gateway لوضع الرمز المحلي (يعرض إنشاء رمز عندما لا يوجد مصدر رمز؛ ولا يستبدل إعدادات SecretRef الخاصة بالرمز).
- اكتشاف مشكلات اقتران الأجهزة (طلبات الاقتران الأولى المعلقة، وترقيات الدور/النطاق المعلقة، وانحراف ذاكرة التخزين المؤقت المحلية القديمة لرمز الجهاز، وانحراف المصادقة في السجل المقترن).
- فحص systemd linger على Linux.
- فحص حجم ملف bootstrap لمساحة العمل (تحذيرات القص/الاقتراب من الحد لملفات السياق).
- فحص حالة إكمال الصدفة والتثبيت/الترقية التلقائية.
- فحص جاهزية مزود embedding لبحث الذاكرة (نموذج محلي، أو مفتاح API بعيد، أو QMD binary).
- فحوصات التثبيت من المصدر (عدم تطابق مساحة عمل pnpm، أو أصول UI مفقودة، أو binary `tsx` مفقود).
- يكتب الإعدادات المحدثة + بيانات المعالج الوصفية.

## الإكمال الرجعي وإعادة الضبط في Dreams UI

يتضمن مشهد Dreams في Control UI إجراءات **Backfill** و**Reset** و**Clear Grounded**
لسير عمل grounded dreaming. تستخدم هذه الإجراءات
طرائق RPC بأسلوب doctor في Gateway، لكنها **ليست** جزءًا من إصلاح/ترحيل
CLI الخاص بـ `openclaw doctor`.

ما الذي تفعله:

- **Backfill** يفحص ملفات `memory/YYYY-MM-DD.md` التاريخية في
  مساحة العمل النشطة، ويشغّل تمرير grounded REM diary، ويكتب إدخالات
  backfill قابلة للعكس داخل `DREAMS.md`.
- **Reset** يزيل فقط إدخالات diary الخاصة بـ backfill الموسومة من `DREAMS.md`.
- **Clear Grounded** يزيل فقط الإدخالات القصيرة الأجل staged ذات grounded-only
  التي جاءت من إعادة تشغيل تاريخية ولم تتراكم لديها بعد عمليات استدعاء مباشرة أو دعم يومي.

ما الذي لا تفعله بمفردها:

- لا تعدّل `MEMORY.md`
- لا تشغّل ترحيلات doctor الكاملة
- لا تقوم تلقائيًا بترحيل المرشحين grounded إلى مخزن الترقية القصير الأجل المباشر
  إلا إذا شغّلت صراحةً مسار CLI المرحلي أولًا

إذا كنت تريد أن تؤثر إعادة التشغيل التاريخية grounded في مسار الترقية العميقة
العادي، فاستخدم تدفق CLI بدلًا من ذلك:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

يؤدي ذلك إلى ترحيل المرشحين grounded الدائمين إلى مخزن dreaming القصير الأجل مع
الإبقاء على `DREAMS.md` كسطح للمراجعة.

## السلوك المفصل والمبررات

### 0) تحديث اختياري (عمليات التثبيت عبر git)

إذا كان هذا checkout عبر git وكان doctor يعمل بشكل تفاعلي، فإنه يعرض
التحديث (fetch/rebase/build) قبل تشغيل doctor.

### 1) تطبيع الإعدادات

إذا كانت الإعدادات تحتوي على أشكال قيم قديمة (على سبيل المثال `messages.ackReaction`
من دون تجاوز خاص بالقناة)، يقوم doctor بتطبيعها إلى
المخطط الحالي.

ويتضمن ذلك حقول Talk القديمة المسطحة. الإعداد العام الحالي لـ Talk هو
`talk.provider` + `talk.providers.<provider>`. يعيد doctor كتابة الأشكال القديمة
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` داخل خريطة المزود.

### 2) ترحيلات مفاتيح الإعدادات القديمة

عندما تحتوي الإعدادات على مفاتيح مهجورة، ترفض الأوامر الأخرى التشغيل
وتطلب منك تشغيل `openclaw doctor`.

سيقوم doctor بما يلي:

- شرح المفاتيح القديمة التي تم العثور عليها.
- عرض الترحيل الذي طبّقه.
- إعادة كتابة `~/.openclaw/openclaw.json` بالمخطط المحدّث.

كما يقوم Gateway أيضًا بتشغيل ترحيلات doctor تلقائيًا عند بدء التشغيل عندما يكتشف
تنسيق إعدادات قديمًا، بحيث يتم إصلاح الإعدادات القديمة دون تدخل يدوي.
تتم معالجة ترحيلات مخزن وظائف Cron بواسطة `openclaw doctor --fix`.

الترحيلات الحالية:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` في المستوى الأعلى
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` القديمة → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- بالنسبة إلى القنوات التي تحتوي على `accounts` مسماة ولكن لا تزال فيها قيم قناة أحادية الحساب في المستوى الأعلى، يتم نقل تلك القيم ذات النطاق الخاص بالحساب إلى الحساب المُرقّى المختار لتلك القناة (`accounts.default` لمعظم القنوات؛ ويمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي مطابق موجود)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- إزالة `browser.relayBindHost` (إعداد relay قديم خاص بالامتداد)

تتضمن تحذيرات doctor أيضًا إرشادات الحساب الافتراضي للقنوات متعددة الحسابات:

- إذا تم تكوين إدخالين أو أكثر في `channels.<channel>.accounts` من دون `channels.<channel>.defaultAccount` أو `accounts.default`، يحذّر doctor من أن التوجيه الاحتياطي قد يختار حسابًا غير متوقع.
- إذا تم ضبط `channels.<channel>.defaultAccount` على معرّف حساب غير معروف، يحذّر doctor ويسرد معرّفات الحسابات المكوّنة.

### 2b) تجاوزات مزود OpenCode

إذا أضفت `models.providers.opencode` أو `opencode-zen` أو `opencode-go`
يدويًا، فإن ذلك يتجاوز كتالوج OpenCode المدمج من `@mariozechner/pi-ai`.
وقد يفرض ذلك استخدام models على API خاطئ أو يصفّر التكاليف. يحذّر doctor كي تتمكن
من إزالة التجاوز واستعادة توجيه API + التكاليف لكل model.

### 2c) ترحيل المتصفح وجاهزية Chrome MCP

إذا كانت إعدادات المتصفح لديك لا تزال تشير إلى مسار Chrome extension الذي تمت إزالته، فإن doctor
يقوم بتطبيعها إلى نموذج الإرفاق المحلي الحالي لـ Chrome MCP:

- `browser.profiles.*.driver: "extension"` تصبح `"existing-session"`
- تتم إزالة `browser.relayBindHost`

كما يدقّق doctor مسار Chrome MCP المحلي على المضيف عندما تستخدم `defaultProfile:
"user"` أو ملف `existing-session` تعريفيًا مكوّنًا:

- يتحقق مما إذا كان Google Chrome مثبتًا على المضيف نفسه لملفات
  الاتصال التلقائي الافتراضية
- يتحقق من إصدار Chrome المكتشف ويحذّر عندما يكون أقل من Chrome 144
- يذكّرك بتمكين التصحيح عن بُعد في صفحة inspect الخاصة بالمتصفح (مثل
  `chrome://inspect/#remote-debugging` أو `brave://inspect/#remote-debugging`
  أو `edge://inspect/#remote-debugging`)

لا يستطيع doctor تمكين الإعداد من جهة Chrome نيابةً عنك. لا يزال Chrome MCP المحلي على المضيف
يتطلب ما يلي:

- متصفحًا مبنيًا على Chromium بإصدار 144+ على مضيف gateway/node
- أن يكون المتصفح قيد التشغيل محليًا
- تمكين التصحيح عن بُعد في ذلك المتصفح
- الموافقة على أول مطالبة موافقة على الإرفاق في المتصفح

الجاهزية هنا تتعلق فقط بمتطلبات الإرفاق المحلي. يحتفظ existing-session
بحدود المسارات الحالية في Chrome MCP؛ أما المسارات المتقدمة مثل `responsebody`، وتصدير PDF،
واعتراض التنزيلات، وإجراءات الدُفعات فلا تزال تتطلب
متصفحًا مُدارًا أو ملف CDP خام.

لا ينطبق هذا الفحص على تدفقات Docker أو العزل أو remote-browser أو أي تدفقات
بدون واجهة أخرى. فهي تواصل استخدام CDP الخام.

### 2d) متطلبات OAuth TLS

عند تكوين ملف OpenAI Codex OAuth تعريفي، يقوم doctor بفحص نقطة
تفويض OpenAI للتحقق من أن مكدس TLS المحلي لـ Node/OpenSSL يمكنه
التحقق من سلسلة الشهادات. إذا فشل الفحص بسبب خطأ في الشهادة (على
سبيل المثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، أو شهادة منتهية، أو شهادة موقعة ذاتيًا)،
فإن doctor يطبع إرشادات إصلاح خاصة بكل منصة. على macOS مع Node من Homebrew،
يكون الإصلاح غالبًا `brew postinstall ca-certificates`. ومع `--deep`، يعمل الفحص
حتى إذا كان Gateway سليمًا.

### 2c) تجاوزات مزود Codex OAuth

إذا كنت قد أضفت سابقًا إعدادات نقل OpenAI القديمة تحت
`models.providers.openai-codex`، فقد تحجب مسار مزود Codex OAuth
المدمج الذي تستخدمه الإصدارات الأحدث تلقائيًا. يحذّر doctor عندما يرى
إعدادات النقل القديمة تلك إلى جانب Codex OAuth حتى تتمكن من إزالة أو إعادة كتابة
تجاوز النقل القديم واستعادة سلوك التوجيه/البدائل المدمج.
لا تزال الوكلاء المخصصة وتجاوزات الرؤوس فقط مدعومة ولا تؤدي إلى هذا التحذير.

### 3) ترحيلات الحالة القديمة (تخطيط القرص)

يمكن لـ doctor ترحيل التخطيطات الأقدم على القرص إلى البنية الحالية:

- مخزن الجلسات + النصوص التفريغية:
  - من `~/.openclaw/sessions/` إلى `~/.openclaw/agents/<agentId>/sessions/`
- دليل الوكيل:
  - من `~/.openclaw/agent/` إلى `~/.openclaw/agents/<agentId>/agent/`
- حالة مصادقة WhatsApp ‏(Baileys):
  - من `~/.openclaw/credentials/*.json` القديمة (باستثناء `oauth.json`)
  - إلى `~/.openclaw/credentials/whatsapp/<accountId>/...` (معرّف الحساب الافتراضي: `default`)

هذه الترحيلات تُنفَّذ بأفضل جهد وهي idempotent؛ وسيصدر doctor تحذيرات عندما
يترك أي مجلدات قديمة خلفه كنسخ احتياطية. كما يقوم Gateway/CLI أيضًا بالترحيل التلقائي
للجلسات القديمة + دليل الوكيل عند بدء التشغيل بحيث تصل السجلات/المصادقة/models
إلى المسار الخاص بكل وكيل دون الحاجة إلى تشغيل doctor يدويًا. يتم ترحيل مصادقة WhatsApp
عن قصد فقط عبر `openclaw doctor`. ويقارن تطبيع مزود Talk/خريطة المزود الآن
بالمساواة البنيوية، لذلك لم تعد الفروقات الخاصة بترتيب المفاتيح فقط تؤدي إلى
تغييرات no-op متكررة عند `doctor --fix`.

### 3a) ترحيلات Plugin manifest القديمة

يفحص doctor جميع Plugin manifests المثبتة بحثًا عن
مفاتيح القدرات العليا المهجورة (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). وعند العثور عليها، يعرض نقلها إلى الكائن `contracts`
وإعادة كتابة ملف manifest في مكانه. هذا الترحيل idempotent؛
وإذا كان مفتاح `contracts` يحتوي بالفعل على القيم نفسها، تتم إزالة المفتاح القديم
من دون تكرار البيانات.

### 3b) ترحيلات مخزن Cron القديمة

يفحص doctor أيضًا مخزن وظائف Cron (`~/.openclaw/cron/jobs.json` افتراضيًا،
أو `cron.store` عند تجاوزه) بحثًا عن أشكال وظائف قديمة لا يزال
المجدول يقبلها من أجل التوافق.

تشمل عمليات تنظيف Cron الحالية ما يلي:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- حقول payload ذات المستوى الأعلى (`message`, `model`, `thinking`, ...) → `payload`
- حقول delivery ذات المستوى الأعلى (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- أسماء delivery المستعارة `provider` داخل payload → `delivery.channel` صريح
- وظائف Webhook الاحتياطية البسيطة القديمة `notify: true` → `delivery.mode="webhook"` صريح مع `delivery.to=cron.webhook`

لا يرحّل doctor وظائف `notify: true` تلقائيًا إلا عندما يستطيع القيام بذلك
من دون تغيير السلوك. إذا كانت الوظيفة تجمع بين notify الاحتياطية القديمة ووضع
delivery غير Webhook موجود بالفعل، يحذّر doctor ويترك تلك الوظيفة للمراجعة اليدوية.

### 3c) تنظيف قفل الجلسة

يفحص doctor كل دليل جلسات وكيل بحثًا عن ملفات أقفال كتابة قديمة — وهي الملفات التي تُترك
وراءها عندما تخرج جلسة بشكل غير طبيعي. ولكل ملف قفل يعثر عليه، يبلّغ عن:
المسار، وPID، وما إذا كان PID لا يزال حيًا، وعمر القفل، وما إذا كان
يُعتبر قديمًا (PID ميت أو أقدم من 30 دقيقة). في وضع `--fix` / `--repair`
يقوم بإزالة ملفات القفل القديمة تلقائيًا؛ وإلا فإنه يطبع ملاحظة
ويوجهك إلى إعادة التشغيل باستخدام `--fix`.

### 4) فحوصات سلامة الحالة (استمرارية الجلسة، والتوجيه، والأمان)

دليل الحالة هو جذع الدماغ التشغيلي. إذا اختفى، فإنك تفقد
الجلسات، وبيانات الاعتماد، والسجلات، والإعدادات (ما لم تكن لديك نسخ احتياطية في مكان آخر).

يفحص doctor ما يلي:

- **دليل الحالة مفقود**: يحذّر من فقدان كارثي للحالة، ويطلب إعادة إنشاء
  الدليل، ويذكّرك بأنه لا يستطيع استعادة البيانات المفقودة.
- **أذونات دليل الحالة**: يتحقق من قابلية الكتابة؛ ويعرض إصلاح الأذونات
  (ويصدر تلميح `chown` عند اكتشاف عدم تطابق في المالك/المجموعة).
- **دليل الحالة المتزامن عبر السحابة في macOS**: يحذّر عندما تُحل الحالة تحت iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) أو
  `~/Library/CloudStorage/...` لأن المسارات المدعومة بالمزامنة قد تسبب I/O أبطأ
  وسباقات في القفل/المزامنة.
- **دليل الحالة على SD أو eMMC في Linux**: يحذّر عندما تُحل الحالة إلى مصدر
  تحميل `mmcblk*`، لأن I/O العشوائي المدعوم بـ SD أو eMMC قد يكون أبطأ
  ويهترئ بشكل أسرع مع كتابات الجلسات وبيانات الاعتماد.
- **أدلة الجلسات مفقودة**: يلزم وجود `sessions/` ودليل مخزن الجلسات
  للاحتفاظ بالسجل وتجنب أعطال `ENOENT`.
- **عدم تطابق النص التفريغي**: يحذّر عندما تحتوي إدخالات الجلسات الحديثة على
  ملفات نص تفريغي مفقودة.
- **الجلسة الرئيسية “JSONL بسطر واحد”**: يضع علامة عندما يحتوي النص التفريغي الرئيسي على سطر واحد فقط
  (السجل لا يتراكم).
- **أدلة حالات متعددة**: يحذّر عند وجود عدة مجلدات `~/.openclaw` عبر
  أدلة home أو عندما يشير `OPENCLAW_STATE_DIR` إلى مكان آخر (قد ينقسم السجل
  بين عمليات التثبيت).
- **تذكير الوضع البعيد**: إذا كان `gateway.mode=remote`، يذكّرك doctor بتشغيله
  على المضيف البعيد (لأن الحالة تعيش هناك).
- **أذونات ملف الإعدادات**: يحذّر إذا كان `~/.openclaw/openclaw.json`
  قابلاً للقراءة من المجموعة/العامة ويعرض تشديده إلى `600`.

### 5) سلامة مصادقة النموذج (انتهاء OAuth)

يفحص doctor ملفات OAuth التعريفية في مخزن المصادقة، ويحذّر عندما تكون الرموز
على وشك الانتهاء/منتهية، ويمكنه تحديثها عندما يكون ذلك آمنًا. إذا كان ملف
Anthropic OAuth/token التعريفي قديمًا، فإنه يقترح Anthropic API key أو
مسار Anthropic setup-token.
لا تظهر مطالبات التحديث إلا عند التشغيل بشكل تفاعلي (TTY)؛ أما `--non-interactive`
فيتجاوز محاولات التحديث.

عندما يفشل تحديث OAuth بشكل دائم (على سبيل المثال `refresh_token_reused`،
أو `invalid_grant`، أو عندما يطلب منك المزوّد تسجيل الدخول مرة أخرى)، يبلّغ doctor
بأن إعادة المصادقة مطلوبة ويطبع أمر
`openclaw models auth login --provider ...`
الدقيق الذي يجب تشغيله.

كما يبلّغ doctor أيضًا عن ملفات المصادقة التعريفية غير القابلة للاستخدام مؤقتًا بسبب:

- فترات تهدئة قصيرة (حدود المعدل/المهلات/إخفاقات المصادقة)
- تعطيلات أطول (إخفاقات الفوترة/الرصيد)

### 6) التحقق من صحة model للـ hooks

إذا كان `hooks.gmail.model` مضبوطًا، يتحقق doctor من مرجع model مقابل
الكتالوج وقائمة السماح ويحذّر عندما لا يمكن حله أو يكون غير مسموح به.

### 7) إصلاح صورة العزل

عند تمكين العزل، يفحص doctor صور Docker ويعرض بناءها أو
التبديل إلى الأسماء القديمة إذا كانت الصورة الحالية مفقودة.

### 7b) تبعيات وقت التشغيل لـ Plugin المجمّعة

يتحقق doctor من تبعيات وقت التشغيل فقط لـ Plugins المجمّعة النشطة في
الإعدادات الحالية أو الممكّنة بواسطة القيمة الافتراضية في manifest المجمّع، مثل
`plugins.entries.discord.enabled: true` أو
`channels.discord.enabled: true` القديمة أو مزود مجمّع مفعّل افتراضيًا. إذا كان أي منها
مفقودًا، يبلّغ doctor عن الحزم ويثبّتها في وضع
`openclaw doctor --fix` / `openclaw doctor --repair`. أما Plugins الخارجية فلا تزال
تستخدم `openclaw plugins install` / `openclaw plugins update`؛ ولا يقوم doctor
بتثبيت تبعيات لمسارات Plugin عشوائية.

### 8) ترحيلات خدمة Gateway وتلميحات التنظيف

يكتشف doctor خدمات Gateway القديمة (`launchd`/`systemd`/`schtasks`) و
يعرض إزالتها وتثبيت خدمة OpenClaw باستخدام منفذ Gateway الحالي.
كما يمكنه أيضًا فحص خدمات إضافية شبيهة بـ Gateway وطباعة تلميحات للتنظيف.
وتُعد خدمات OpenClaw Gateway المسماة باسم profile من الدرجة الأولى ولا
تُعلَّم على أنها "إضافية".

### 8b) ترحيل Matrix عند بدء التشغيل

عندما يكون لدى حساب قناة Matrix ترحيل حالة قديم معلّق أو قابل للتنفيذ،
فإن doctor (في وضع `--fix` / `--repair`) ينشئ لقطة قبل الترحيل ثم
يشغّل خطوات الترحيل بأفضل جهد: ترحيل حالة Matrix القديمة وإعداد
الحالة المشفرة القديمة. كلتا الخطوتين غير قاتلتين؛ يتم تسجيل الأخطاء
ويستمر بدء التشغيل. أما في وضع القراءة فقط (`openclaw doctor` من دون `--fix`) فيتم
تخطي هذا الفحص بالكامل.

### 8c) اقتران الأجهزة وانحراف المصادقة

يفحص doctor الآن حالة اقتران الأجهزة كجزء من تمرير السلامة العادي.

ما الذي يبلّغ عنه:

- طلبات اقتران أول مرة المعلقة
- ترقيات الدور المعلقة للأجهزة المقترنة بالفعل
- ترقيات النطاق المعلقة للأجهزة المقترنة بالفعل
- إصلاحات عدم تطابق المفتاح العام عندما يظل معرّف الجهاز مطابقًا لكن
  هوية الجهاز لم تعد تطابق السجل الموافق عليه
- السجلات المقترنة التي تفتقد رمزًا نشطًا لدور معتمد
- الرموز المقترنة التي تنحرف نطاقاتها خارج خط الأساس المعتمد للاقتران
- إدخالات الرمز المحلي المخزنة مؤقتًا للجهاز الحالي التي تسبق
  تدوير الرمز من جهة Gateway أو تحمل بيانات نطاق وصفية قديمة

لا يوافق doctor تلقائيًا على طلبات الاقتران ولا يدوّر رموز الأجهزة تلقائيًا. بل
يطبع الخطوات التالية الدقيقة بدلًا من ذلك:

- افحص الطلبات المعلقة باستخدام `openclaw devices list`
- وافق على الطلب المحدد باستخدام `openclaw devices approve <requestId>`
- دوّر رمزًا جديدًا باستخدام `openclaw devices rotate --device <deviceId> --role <role>`
- أزل سجلًا قديمًا ثم أعد الموافقة عليه باستخدام `openclaw devices remove <deviceId>`

وهذا يغلق الثغرة الشائعة "مقترن بالفعل لكن لا يزال يتلقى pairing required":
إذ يميّز doctor الآن بين الاقتران لأول مرة وبين ترقيات الدور/النطاق
المعلقة وبين انحراف الرمز/هوية الجهاز القديم.

### 9) تحذيرات الأمان

يصدر doctor تحذيرات عندما يكون مزود ما مفتوحًا للرسائل الخاصة دون قائمة سماح، أو
عندما يتم تكوين سياسة بطريقة خطرة.

### 10) systemd linger ‏(Linux)

إذا كان يعمل كخدمة مستخدم systemd، فإن doctor يضمن تمكين lingering بحيث يظل
Gateway حيًا بعد تسجيل الخروج.

### 11) حالة مساحة العمل (Skills وPlugins والأدلة القديمة)

يطبع doctor ملخصًا لحالة مساحة العمل للوكيل الافتراضي:

- **حالة Skills**: يعدّ Skills المؤهلة، وتلك التي تفتقد المتطلبات، وتلك المحجوبة بقائمة السماح.
- **أدلة مساحة العمل القديمة**: يحذّر عند وجود `~/openclaw` أو أدلة مساحة عمل قديمة أخرى
  إلى جانب مساحة العمل الحالية.
- **حالة Plugin**: يعدّ Plugins المحمّلة/المعطّلة/التي بها أخطاء؛ ويسرد معرّفات Plugin لأي
  أخطاء؛ ويبلّغ عن قدرات Plugin المجمّعة.
- **تحذيرات توافق Plugin**: يضع علامة على Plugins التي لديها مشكلات توافق مع
  وقت التشغيل الحالي.
- **تشخيصات Plugin**: يعرض أي تحذيرات أو أخطاء وقت التحميل صادرة عن
  سجل Plugin.

### 11b) حجم ملف bootstrap

يفحص doctor ما إذا كانت ملفات bootstrap لمساحة العمل (مثل `AGENTS.md`،
أو `CLAUDE.md`، أو ملفات سياق محقونة أخرى) قريبة من ميزانية الأحرف
المكوّنة أو تتجاوزها. ويبلّغ لكل ملف عن عدد الأحرف الخام مقابل المحقونة، ونسبة الاقتطاع،
وسبب الاقتطاع (`max/file` أو `max/total`)، وإجمالي الأحرف المحقونة
كنسبة من إجمالي الميزانية. وعندما تكون الملفات مقتطعة أو قريبة من
الحد، يطبع doctor نصائح لضبط `agents.defaults.bootstrapMaxChars`
و`agents.defaults.bootstrapTotalMaxChars`.

### 11c) إكمال الصدفة

يفحص doctor ما إذا كان إكمال Tab مثبتًا للصدفة الحالية
(`zsh` أو `bash` أو `fish` أو `PowerShell`):

- إذا كان profile الصدفة يستخدم نمط إكمال ديناميكي بطيئًا
  (`source <(openclaw completion ...)`)، يقوم doctor بترقيته إلى
  متغير الملف المخزّن مؤقتًا الأسرع.
- إذا كان الإكمال مضبوطًا في profile ولكن ملف التخزين المؤقت مفقودًا،
  يعيد doctor إنشاء التخزين المؤقت تلقائيًا.
- إذا لم يكن هناك أي إكمال مضبوط إطلاقًا، يطلب doctor تثبيته
  (في الوضع التفاعلي فقط؛ ويتم التخطي مع `--non-interactive`).

شغّل `openclaw completion --write-state` لإعادة إنشاء التخزين المؤقت يدويًا.

### 12) فحوصات مصادقة Gateway (الرمز المحلي)

يفحص doctor جاهزية مصادقة رمز Gateway المحلي.

- إذا كان وضع الرمز يحتاج إلى رمز ولا يوجد مصدر للرمز، يعرض doctor إنشاء واحد.
- إذا كانت `gateway.auth.token` مُدارة بواسطة SecretRef ولكنها غير متاحة، يحذّر doctor ولا يستبدلها بنص صريح.
- يفرض `openclaw doctor --generate-gateway-token` الإنشاء فقط عندما لا يكون هناك SecretRef مكوّن للرمز.

### 12b) إصلاحات للقراءة فقط تراعي SecretRef

تحتاج بعض تدفقات الإصلاح إلى فحص بيانات الاعتماد المكوّنة دون إضعاف سلوك الفشل السريع في وقت التشغيل.

- يستخدم `openclaw doctor --fix` الآن نموذج الملخص نفسه للقراءة فقط والمراعي لـ SecretRef كما في أوامر عائلة status من أجل إصلاحات إعدادات مستهدفة.
- مثال: يحاول إصلاح `allowFrom` / `groupAllowFrom` الخاصة بـ Telegram عند استخدام `@username` الاستفادة من بيانات اعتماد البوت المكوّنة عند توفرها.
- إذا كان رمز Telegram bot مكوّنًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، فإن doctor يبلّغ بأن بيانات الاعتماد مكوّنة-لكن-غير-متاحة ويتخطى الحل التلقائي بدلًا من التعطل أو الإبلاغ خطأً بأن الرمز مفقود.

### 13) فحص سلامة Gateway + إعادة التشغيل

يشغّل doctor فحص سلامة ويعرض إعادة تشغيل Gateway عندما يبدو
غير سليم.

### 13b) جاهزية بحث الذاكرة

يفحص doctor ما إذا كان مزود embedding المكوّن لبحث الذاكرة جاهزًا
للوكيل الافتراضي. يعتمد السلوك على الواجهة الخلفية والمزود المكوّنين:

- **الواجهة الخلفية QMD**: يفحص ما إذا كان binary ‏`qmd` متاحًا وقابلًا للتشغيل.
  وإذا لم يكن كذلك، يطبع إرشادات إصلاح تتضمن حزمة npm وخيار مسار binary يدوي.
- **مزود محلي صريح**: يتحقق من وجود ملف model محلي أو
  URL معروف لنموذج بعيد/قابل للتنزيل. وإذا كان مفقودًا، يقترح التبديل إلى مزود بعيد.
- **مزود بعيد صريح** (`openai` أو `voyage` وما إلى ذلك): يتحقق من وجود API key
  في البيئة أو مخزن المصادقة. ويطبع تلميحات إصلاح قابلة للتنفيذ إذا كانت مفقودة.
- **المزود التلقائي**: يتحقق أولًا من توفر model المحلي، ثم يجرّب كل مزود بعيد
  وفق ترتيب الاختيار التلقائي.

عندما تكون نتيجة فحص Gateway متاحة (أي كان Gateway سليمًا وقت
الفحص)، يقارن doctor نتيجتها بالإعدادات المرئية من CLI ويشير
إلى أي اختلاف.

استخدم `openclaw memory status --deep` للتحقق من جاهزية embedding وقت التشغيل.

### 14) تحذيرات حالة القنوات

إذا كان Gateway سليمًا، يشغّل doctor فحص حالة القنوات ويبلّغ عن
التحذيرات مع إصلاحات مقترحة.

### 15) تدقيق إعدادات المشرف + الإصلاح

يفحص doctor إعدادات المشرف المثبتة (`launchd`/`systemd`/`schtasks`) بحثًا عن
قيم افتراضية مفقودة أو قديمة (مثل تبعيات `network-online` في systemd و
تأخير إعادة التشغيل). وعندما يجد عدم تطابق، يوصي بالتحديث ويمكنه
إعادة كتابة ملف الخدمة/المهمة إلى القيم الافتراضية الحالية.

ملاحظات:

- يطلب `openclaw doctor` التأكيد قبل إعادة كتابة إعدادات المشرف.
- يقبل `openclaw doctor --yes` مطالبات الإصلاح الافتراضية.
- يطبّق `openclaw doctor --repair` الإصلاحات الموصى بها دون مطالبات.
- يستبدل `openclaw doctor --repair --force` إعدادات المشرف المخصصة.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت/إصلاح خدمة doctor يتحقق من SecretRef لكنه لا يحفظ قيم الرمز الصريحة المحلولة داخل بيانات بيئة خدمة المشرف الوصفية.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان token SecretRef المكوّن غير محلول، فإن doctor يمنع مسار التثبيت/الإصلاح مع إرشادات قابلة للتنفيذ.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين بينما `gateway.auth.mode` غير مضبوط، فإن doctor يمنع التثبيت/الإصلاح حتى يتم ضبط mode صراحةً.
- بالنسبة إلى وحدات user-systemd على Linux، تتضمن فحوصات انحراف الرمز في doctor الآن كلا المصدرين `Environment=` و`EnvironmentFile=` عند مقارنة بيانات مصادقة الخدمة الوصفية.
- يمكنك دائمًا فرض إعادة كتابة كاملة عبر `openclaw gateway install --force`.

### 16) تشخيصات وقت تشغيل Gateway + المنفذ

يفحص doctor وقت تشغيل الخدمة (PID، وآخر حالة خروج) ويحذّر عندما تكون
الخدمة مثبتة ولكنها ليست قيد التشغيل فعليًا. كما يتحقق أيضًا من تعارضات المنافذ
على منفذ Gateway (الافتراضي `18789`) ويبلّغ عن الأسباب المحتملة (Gateway يعمل بالفعل،
أو نفق SSH).

### 17) أفضل الممارسات لوقت تشغيل Gateway

يحذّر doctor عندما تعمل خدمة Gateway على Bun أو على مسار Node مُدار بواسطة مدير إصدارات
(`nvm` أو `fnm` أو `volta` أو `asdf` وما إلى ذلك). تتطلب قنوات WhatsApp + Telegram استخدام Node،
كما أن مسارات مدير الإصدارات قد تتعطل بعد الترقيات لأن الخدمة لا
تقوم بتحميل تهيئة الصدفة الخاصة بك. يعرض doctor الترحيل إلى تثبيت Node نظامي عندما
يكون متاحًا (Homebrew/apt/choco).

### 18) كتابة الإعدادات + بيانات المعالج الوصفية

يحفظ doctor أي تغييرات في الإعدادات ويضع وسمًا لبيانات المعالج الوصفية لتسجيل
تشغيل doctor.

### 19) نصائح مساحة العمل (النسخ الاحتياطي + نظام الذاكرة)

يقترح doctor نظام ذاكرة لمساحة العمل عندما يكون مفقودًا ويطبع نصيحة للنسخ الاحتياطي
إذا لم تكن مساحة العمل موجودة بالفعل تحت git.

راجع [/concepts/agent-workspace](/ar/concepts/agent-workspace) للاطلاع على دليل كامل حول
بنية مساحة العمل والنسخ الاحتياطي عبر git (يوصى باستخدام GitHub أو GitLab خاص).
