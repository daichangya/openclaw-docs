---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح أخطاء سلوك Gateway + الوكيل
summary: 'مجموعة الاختبارات: أجنحة unit/e2e/live، ومشغلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-25T13:50:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

يحتوي OpenClaw على ثلاثة أجنحة Vitest (unit/integration، وe2e، وlive) ومجموعة صغيرة
من مشغلات Docker. هذا المستند هو دليل "كيف نختبر":

- ما الذي يغطيه كل جناح (وما الذي **لا** يغطيه عمدًا).
- الأوامر التي يجب تشغيلها لسيناريوهات العمل الشائعة (محليًا، قبل push، وتصحيح الأخطاء).
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدين.
- كيفية إضافة اختبارات انحدار لمشكلات النماذج/المزوّدين في العالم الحقيقي.

## بداية سريعة

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع لجميع الأجنحة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة watch مباشرة لـ Vitest: `pnpm test:watch`
- استهداف الملفات المباشر يوجّه الآن أيضًا مسارات extensions/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل أولًا التشغيلات المستهدفة عندما تكون تعمل على فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بـ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- جناح E2E: `pnpm test:e2e`

عند تصحيح أخطاء مزوّدين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- الجناح الحي (النماذج + فحوصات الأدوات/الصور في Gateway): `pnpm test:live`
- استهدف ملف live واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- اجتياح نماذج live عبر Docker: `pnpm test:docker:live-models`
  - يشغّل كل نموذج محدد الآن دورًا نصيًا بالإضافة إلى فحص صغير بأسلوب قراءة ملف.
    كما تشغّل النماذج التي تعلن بياناتها الوصفية عن إدخال `image` دور صورة صغيرًا أيضًا.
    عطّل الفحوصات الإضافية باستخدام `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل أعطال المزوّد.
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير عمل live/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن وظائف Docker live model منفصلة
    موزعة حسب المزوّد.
  - لإعادة تشغيل CI مركزة، نفّذ `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و`live_models_only: true`.
  - أضف أسرار المزوّدين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/المخصصين للإصدار.
- اختبار smoke أصلي لـ Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - يشغّل مسار Docker live ضد مسار خادم تطبيق Codex، ويربط DM صناعيًا في
    Slack باستخدام `/codex bind`، ويختبر `/codex fast` و
    `/codex permissions`، ثم يتحقق من أن الرد العادي ومسار مرفق الصورة
    يمران عبر ربط Plugin الأصلي بدلًا من ACP.
- اختبار smoke لأمر إنقاذ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - فحص اختياري إضافي لسطح أمر الإنقاذ في قناة الرسائل.
    يختبر `/crestodian status`، ويضع تغيير نموذج مستمر في الطابور،
    ويرد بـ `/crestodian yes`، ويتحقق من مسار التدقيق/كتابة التهيئة.
- اختبار smoke عبر Docker لمخطط Crestodian: `pnpm test:docker:crestodian-planner`
  - يشغّل Crestodian في حاوية بلا تهيئة مع Claude CLI زائف على `PATH`
    ويتحقق من أن الرجوع إلى المخطط الضبابي يترجم إلى كتابة تهيئة مدققة ومكتوبة.
- اختبار smoke لأول تشغيل لـ Crestodian عبر Docker: `pnpm test:docker:crestodian-first-run`
  - يبدأ من دليل حالة OpenClaw فارغ، ويوجه `openclaw` العاري إلى
    Crestodian، ويطبق كتابات setup/model/agent/Discord plugin + SecretRef،
    ويتحقق من التهيئة، ويتحقق من إدخالات التدقيق. كما تتم تغطية مسار إعداد
    Ring 0 نفسه أيضًا في QA Lab عبر
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- اختبار smoke للتكلفة لـ Moonshot/Kimi: عند تعيين `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  ضد `moonshot/kimi-k2.6`. وتحقق من أن JSON يبلغ عن Moonshot/K2.6 وأن
  نص المساعد يخزن `usage.cost` المطبّع.

نصيحة: عندما تحتاج فقط إلى حالة فشل واحدة، فضّل تضييق الاختبارات الحية باستخدام متغيرات بيئة قائمة السماح الموضحة أدناه.

## مشغلات خاصة بـ QA

توجد هذه الأوامر بجانب أجنحة الاختبارات الرئيسية عندما تحتاج إلى واقعية QA-lab:

يشغّل CI مختبر QA في سيرات عمل مخصصة. يعمل `Parity gate` على PRs المطابقة
ومن خلال التشغيل اليدوي باستخدام مزوّدين وهميين. ويعمل `QA-Lab - All Lanes` ليلًا على
`main` ومن خلال التشغيل اليدوي باستخدام بوابة التكافؤ الوهمية، ومسار Matrix الحي، و
مسار Telegram الحي المُدار عبر Convex كوظائف متوازية. ويشغّل `OpenClaw Release Checks`
المسارات نفسها قبل اعتماد الإصدار.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة من المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway معزولين.
    تستخدم `qa-channel` افتراضيًا تزامنًا مقداره 4 (مقيّدًا بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد
    العمال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - ينتهي برمز غير صفري عندما يفشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock من أجل تغطية
    تجريبية للمثبتات وبروتوكول المحاكاة، من دون استبدال
    مسار `mock-openai` المدرك للسيناريو.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل Linux VM مؤقتة من Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه كما في `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار المزوّد/النموذج نفسها مثل `qa suite`.
  - تمرر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية بالنسبة للضيف:
    مفاتيح المزوّد القائمة على env، ومسار تهيئة مزوّد QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة المخرجات تحت جذر المستودع حتى يتمكن الضيف من الكتابة
    مرة أخرى عبر مساحة العمل المركبة.
  - يكتب تقرير QA العادي + الملخص بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني npm tarball من checkout الحالية، ويثبته عمومًا داخل
    Docker، ويشغّل onboarding غير تفاعليًا باستخدام مفتاح OpenAI API، ويهيّئ Telegram
    افتراضيًا، ويتحقق من أن تمكين Plugin يثبت تبعيات وقت التشغيل عند
    الطلب، ويشغّل doctor، ويشغّل دور وكيل محلي واحد ضد نقطة نهاية
    OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار
    التثبيت المعبأ نفسه مع Discord.
- `pnpm test:docker:npm-telegram-live`
  - يثبت حزمة OpenClaw منشورة داخل Docker، ويشغّل
    onboarding للحزمة المثبتة، ويهيّئ Telegram من خلال CLI المثبت، ثم يعيد استخدام
    مسار Telegram QA الحي مع تلك الحزمة المثبتة بوصفها SUT Gateway.
  - يستخدم افتراضيًا `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - يستخدم بيانات اعتماد Telegram نفسها من env أو مصدر بيانات اعتماد Convex نفسه كما في
    `pnpm openclaw qa telegram`. بالنسبة إلى أتمتة CI/الإصدار، عيّن
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. إذا كانت
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex موجودين في CI،
    فإن غلاف Docker يختار Convex تلقائيًا.
  - يقوم `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` بتجاوز
    `OPENCLAW_QA_CREDENTIAL_ROLE` المشترك لهذا المسار فقط.
  - يكشف GitHub Actions هذا المسار كسير عمل صيانة يدوي
    `NPM Telegram Beta E2E`. ولا يعمل عند الدمج. يستخدم سير العمل بيئة
    `qa-live-shared` وعقود إيجار بيانات اعتماد CI من Convex.
- `pnpm test:docker:bundled-channel-deps`
  - يحزم ويثبت البنية الحالية لـ OpenClaw داخل Docker، ويبدأ Gateway
    مع تهيئة OpenAI، ثم يمكّن القنوات/Plugins المضمنة عبر
    تعديلات التهيئة.
  - يتحقق من أن اكتشاف setup يترك تبعيات وقت التشغيل الخاصة بـ Plugin غير المهيأة
    غائبة، وأن أول تشغيل مهيأ لـ Gateway أو doctor يثبت تبعيات وقت التشغيل
    لكل Plugin مضمّن عند الطلب، وأن إعادة التشغيل الثانية لا تعيد تثبيت التبعيات
    التي تم تفعيلها بالفعل.
  - ويثبت أيضًا خط أساس npm قديمًا معروفًا، ويمكّن Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن
    post-update doctor الخاص بالمرشح يصلح تبعيات وقت تشغيل القنوات المضمنة من دون
    إصلاح postinstall من جانب harness.
- `pnpm test:parallels:npm-update`
  - يشغّل اختبار smoke الأصلي لتحديث التثبيت المعبأ عبر ضيوف Parallels. كل
    منصة محددة تثبت أولًا حزمة خط الأساس المطلوبة، ثم تشغّل أمر
    `openclaw update` المثبت داخل الضيف نفسه، وتتحقق من الإصدار المثبت،
    وحالة التحديث، وجاهزية gateway، ودور وكيل محلي واحد.
  - استخدم `--platform macos` أو `--platform windows` أو `--platform linux` أثناء
    العمل التكراري على ضيف واحد. استخدم `--json` للحصول على مسار artifact الملخّص
    وحالة كل مسار.
  - لفّ التشغيلات المحلية الطويلة بمهلة على المضيف حتى لا تستهلك حالات تعليق
    نقل Parallels بقية نافذة الاختبار:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - يكتب السكربت سجلات مسارات متداخلة تحت `/tmp/openclaw-parallels-npm-update.*`.
    افحص `windows-update.log` أو `macos-update.log` أو `linux-update.log`
    قبل افتراض أن الغلاف الخارجي معلّق.
  - قد يقضي تحديث Windows من 10 إلى 15 دقيقة في post-update doctor/إصلاح
    تبعيات وقت التشغيل على ضيف بارد؛ ويظل ذلك سلوكًا سليمًا عندما يكون
    سجل npm debug المتداخل يتقدم.
  - لا تشغّل هذا الغلاف التجميعي بالتوازي مع مسارات smoke الفردية لـ Parallels
    على macOS أو Windows أو Linux. فهي تشترك في حالة VM وقد تتصادم في
    استعادة اللقطات، أو تقديم الحزم، أو حالة gateway داخل الضيف.
  - يثبت البرهان بعد التحديث السطح العادي لـ Plugin المضمن لأن
    واجهات الإمكانات مثل الكلام، وإنشاء الصور، وفهم الوسائط
    تُحمّل عبر APIs وقت تشغيل مضمّنة حتى عندما يتحقق دور الوكيل
    نفسه فقط من استجابة نصية بسيطة.

- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي من أجل اختبار smoke مباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix QA الحي ضد homeserver مؤقت مدعوم بـ Docker من Tuwunel.
  - هذا المضيف الخاص بـ QA مخصص اليوم للمستودع/التطوير فقط. لا تشحن
    تثبيتات OpenClaw المعبأة `qa-lab`، لذا فهي لا تكشف
    `openclaw qa`.
  - تقوم نسخ المستودع بتحميل المشغّل المضمّن مباشرة؛ ولا حاجة إلى خطوة
    تثبيت Plugin منفصلة.
  - يجهّز ثلاثة مستخدمين مؤقتين لـ Matrix (`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ عملية QA gateway فرعية مع Plugin Matrix الحقيقي كوسيلة نقل SUT.
  - يستخدم افتراضيًا صورة Tuwunel المستقرة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1`. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يكشف Matrix عن علامات مشتركة لمصدر بيانات الاعتماد لأن المسار يجهّز مستخدمين مؤقتين محليًا.
  - يكتب تقرير Matrix QA، وملخصًا، وartifact للأحداث المرصودة، وسجل مخرجات مجمّع stdout/stderr تحت `.artifacts/qa-e2e/...`.
  - يطلق التقدم افتراضيًا ويفرض مهلة تشغيل صارمة باستخدام `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (الافتراضي 30 دقيقة). ويكون التنظيف مقيّدًا بواسطة `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` وتتضمن حالات الفشل أمر الاستعادة `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA الحي ضد مجموعة خاصة حقيقية باستخدام tokens الروبوت الخاص بـ driver وSUT من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ويجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع env افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في عقود الإيجار المجمّعة.
  - ينتهي برمز غير صفري عندما يفشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون رمز خروج فاشل.
  - يتطلب روبوتين مختلفين داخل المجموعة الخاصة نفسها، مع كشف روبوت SUT لاسم مستخدم Telegram.
  - للحصول على مراقبة مستقرة بين الروبوتات، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا الروبوتين وتأكد من أن روبوت driver يمكنه مراقبة حركة الروبوتات داخل المجموعة.
  - يكتب تقرير Telegram QA، وملخصًا، وartifact للرسائل المرصودة تحت `.artifacts/qa-e2e/...`. وتتضمن سيناريوهات الرد RTT من طلب الإرسال الخاص بـ driver إلى رد SUT المرصود.

تشترك مسارات النقل الحية في عقد قياسي واحد بحيث لا تنحرف وسائل النقل الجديدة:

يظل `qa-channel` مجموعة QA الاصطناعية الواسعة وليس جزءًا من مصفوفة تغطية
النقل الحي.

| المسار   | Canary | تقييد mention | حظر allowlist | رد من المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة سلسلة الرسائل | عزل سلسلة الرسائل | مراقبة التفاعلات | أمر help |
| -------- | ------ | ------------- | ------------- | -------------------- | ------------------------- | -------------------- | ----------------- | ---------------- | -------- |
| Matrix   | x      | x             | x             | x                    | x                         | x                    | x                 | x                |          |
| Telegram | x      |               |               |                      |                           |                      |                   |                  | x        |

### بيانات اعتماد Telegram المشتركة عبر Convex (الإصدار 1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لأجل
`openclaw qa telegram`، يحصل QA lab على عقد إيجار حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat
لذلك العقد أثناء تشغيل المسار، ويحرر العقد عند الإغلاق.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` من أجل `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` من أجل `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: ‏`--credential-role maintainer|ci`
  - القيمة الافتراضية في env: ‏`OPENCLAW_QA_CREDENTIAL_ROLE` (تكون افتراضيًا `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات env الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL من Convex بصيغة `http://` الخاصة بـ loopback لأغراض التطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` الصيغة `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرف (إضافة/إزالة/إدراج المجموعة)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `doctor` قبل التشغيلات الحية لفحص عنوان URL لموقع Convex، وأسرار الوسيط،
وبادئة نقطة النهاية، ومهلة HTTP، وإمكانية وصول المسؤول/الإدراج من دون طباعة
قيم الأسرار. استخدم `--json` للحصول على مخرجات قابلة للقراءة آليًا في السكربتات
وأدوات CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - حالات النفاد/القابلة لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغ)
- `POST /release`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغ)
- `POST /admin/add` (سر maintainer فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` (سر maintainer فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حاجز عقد الإيجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر maintainer فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن تكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل عندما تكون `kind: "telegram"` ويرفض الحمولات المشوهة.

### إضافة قناة إلى QA

يتطلب إضافة قناة إلى نظام QA المبني على Markdown أمرين فقط بالضبط:

1. مكيّف نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أوامر QA جديدًا في المستوى الأعلى عندما يمكن للمضيف المشترك `qa-lab`
أن يملك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- تزامن العمال
- كتابة artifacts
- إنشاء التقارير
- تنفيذ السيناريوهات
- الأسماء المستعارة التوافقية لسيناريوهات `qa-channel` الأقدم

تمتلك Runner plugins عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيفية تهيئة الـ gateway لهذا النقل
- كيفية فحص الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية مراقبة الرسائل الصادرة
- كيفية كشف النصوص وحالة النقل المطبّعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع reset أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. إبقاء `qa-lab` مالكًا للجذر المشترك `qa`.
2. تنفيذ transport runner على طبقة المضيف المشتركة `qa-lab`.
3. إبقاء الآليات الخاصة بالنقل داخل Runner plugin أو channel harness.
4. تركيب Runner بوصفه `openclaw qa <runner>` بدلًا من تسجيل جذر أوامر منافس.
   يجب على Runner plugins التصريح بـ `qaRunners` في `openclaw.plugin.json` وتصدير مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   أبقِ `runtime-api.ts` خفيفًا؛ ويجب أن يبقى تنفيذ CLI وRunner الكسول خلف entrypoints منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown تحت أدلة `qa/scenarios/` ذات الموضوعات المحددة.
6. استخدام مساعدات السيناريوهات العامة للسيناريوهات الجديدة.
7. إبقاء الأسماء المستعارة التوافقية الحالية تعمل ما لم يكن المستودع ينفذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان من الممكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فاحتفظ به داخل Runner plugin أو Plugin harness لتلك القناة.
- إذا احتاج السيناريو إلى قدرة جديدة يمكن لأكثر من قناة واحدة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فاحتفظ بالسيناريو خاصًا بذلك النقل واجعل ذلك صريحًا في عقد السيناريو.

أسماء المساعدات العامة المفضلة للسيناريوهات الجديدة هي:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

تظل الأسماء المستعارة التوافقية متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن يستخدم العمل على القنوات الجديدة أسماء المساعدات العامة.
توجد الأسماء المستعارة التوافقية لتجنب ترحيل شامل دفعة واحدة، لا لتكون النموذج
لتأليف السيناريوهات الجديدة.

## أجنحة الاختبار (ما الذي يعمل وأين)

فكر في الأجنحة على أنها "واقعية متزايدة" (ومعها زيادة في الهشاشة/التكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- التهيئة: تستخدم التشغيلات غير المستهدفة مجموعة shard الخاصة بـ `vitest.full-*.config.ts` وقد توسّع شظايا المشاريع المتعددة إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: مخزونات core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts` واختبارات `ui` الخاصة بـ node المدرجة في القائمة المسموح بها والمشمولة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة gateway، والتوجيه، والأدوات، والتحليل، والتهيئة)
  - اختبارات انحدار حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة

<AccordionGroup>
  <Accordion title="المشاريع، والشظايا، والمسارات المقيّدة">

    - تشغّل `pnpm test` غير المستهدفة اثنتي عشرة تهيئة shard أصغر (`core-unit-fast` و`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية root-project أصلية عملاقة واحدة. وهذا يقلل ذروة RSS على الأجهزة المحمّلة ويتجنب أن يؤدي عمل auto-reply/extensions إلى تجويع الأجنحة غير المرتبطة.
    - لا يزال `pnpm test --watch` يستخدم مخطط المشروع الجذري الأصلي `vitest.config.ts`، لأن حلقة watch متعددة الشظايا غير عملية.
    - تقوم أوامر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أولًا بتوجيه أهداف الملفات/الأدلة الصريحة عبر مسارات مقيّدة، لذا فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب تكلفة بدء تشغيل المشروع الجذري الكامل.
    - يقوم `pnpm test:changed` بتوسيع مسارات git المتغيرة إلى المسارات المقيّدة نفسها عندما لا يلمس diff إلا ملفات source/test القابلة للتوجيه؛ وتظل تعديلات config/setup ترجع إلى إعادة تشغيل project-root الواسعة.
    - إن `pnpm check:changed` هو البوابة المحلية الذكية المعتادة للعمل الضيق. فهو يصنّف diff إلى core وcore tests وextensions وextension tests وapps وdocs وrelease metadata وtooling، ثم يشغّل مسارات typecheck/lint/test المطابقة. وتتضمن تغييرات Plugin SDK العامة وعقود plugin تمريرة تحقق واحدة للـ extension لأن extensions تعتمد على تلك العقود الأساسية. وتشغّل زيادات الإصدار التي تقتصر على release metadata فحوصات إصدار/تهيئة/تبعيات جذرية مستهدفة بدل المجموعة الكاملة، مع حاجز يرفض تغييرات الحزم خارج حقل الإصدار في المستوى الأعلى.
    - تُوجَّه اختبارات unit الخفيفة من حيث الاستيراد الخاصة بالوكلاء، والأوامر، وplugins، ومساعدات auto-reply، و`plugin-sdk`، ومناطق الأدوات الخالصة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات الثقيلة من حيث الحالة/وقت التشغيل على المسارات الحالية.
    - كما تقوم بعض ملفات المصدر المساعدة المختارة من `plugin-sdk` و`commands` بربط التشغيلات في وضع changed باختبارات أشقاء صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدين إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
    - يملك `auto-reply` ثلاث حاويات مخصصة: مساعدات core في المستوى الأعلى، واختبارات integration ذات المستوى الأعلى `reply.*`، وشجرة `src/auto-reply/reply/**`. وهذا يُبقي عمل reply harness الأثقل بعيدًا عن اختبارات status/chunk/token الرخيصة.

  </Accordion>

  <Accordion title="تغطية embedded runner">

    - عندما تغيّر مدخلات اكتشاف message-tool أو
      سياق runtime الخاص بـ Compaction، فاحرص على الإبقاء على مستويي التغطية.
    - أضف اختبارات انحدار مركّزة للمساعدين عند حدود التوجيه والتطبيع
      الخالصة.
    - حافظ على سلامة أجنحة integration الخاصة بـ embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      و`src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - تتحقق هذه الأجنحة من أن المعرّفات ذات النطاق المحدد وسلوك Compaction لا يزالان يتدفقان
      عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تُعد الاختبارات
      المعتمدة على المساعد فقط بديلًا كافيًا لتلك المسارات التكاملية.

  </Accordion>

  <Accordion title="Vitest pool والقيم الافتراضية للعزل">

    - يستخدم إعداد Vitest الأساسي القيمة الافتراضية `threads`.
    - يثبت إعداد Vitest المشترك القيمة `isolate: false` ويستخدم
      المشغّل غير المعزول عبر المشاريع الجذرية، وإعدادات e2e، وlive.
    - يحتفظ مسار UI الجذري بإعداد `jsdom` ومحسّنه، لكنه يعمل على
      المشغّل غير المعزول المشترك أيضًا.
    - ترث كل شظية من شظايا `pnpm test` القيم الافتراضية نفسها
      `threads` + `isolate: false` من إعداد Vitest المشترك.
    - يضيف `scripts/run-vitest.mjs` القيمة `--no-maglev` افتراضيًا لعمليات
      Node الفرعية الخاصة بـ Vitest لتقليل اضطراب الترجمة في V8 أثناء
      التشغيلات المحلية الكبيرة. عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة
      مع سلوك V8 القياسي.

  </Accordion>

  <Accordion title="العمل التكراري المحلي السريع">

    - يعرض `pnpm changed:lanes` المسارات المعمارية التي يطلقها diff.
    - إن hook ما قبل commit مخصص للتنسيق فقط. فهو يعيد staging للملفات المنسقة
      ولا يشغّل lint أو typecheck أو الاختبارات.
    - شغّل `pnpm check:changed` صراحةً قبل التسليم أو push عندما
      تحتاج إلى البوابة المحلية الذكية. وتتضمن تغييرات Plugin SDK العامة وعقود plugin
      تمريرة تحقق واحدة للـ extension.
    - يقوم `pnpm test:changed` بالتوجيه عبر المسارات المقيّدة عندما ترتبط المسارات المتغيرة
      بوضوح بمجموعة أصغر.
    - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه نفسه،
      ولكن بحد أعلى للعمال.
    - إن التوسّع التلقائي المحلي للعمال متحفظ عمدًا ويتراجع
      عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، لذا تُحدث تشغيلات
      Vitest المتزامنة المتعددة ضررًا أقل افتراضيًا.
    - يضع إعداد Vitest الأساسي المشاريع/ملفات التهيئة ضمن
      `forceRerunTriggers` بحيث تظل إعادة التشغيل في وضع changed صحيحة
      عندما تتغير أسلاك الاختبار.
    - يُبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على
      المضيفين المدعومين؛ عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد
      موقع cache صريحًا واحدًا لعمليات profiling المباشرة.

  </Accordion>

  <Accordion title="تصحيح أخطاء الأداء">

    - يفعّل `pnpm test:perf:imports` تقارير Vitest لمدة الاستيراد بالإضافة
      إلى مخرجات تفصيل الاستيراد.
    - يقيّد `pnpm test:perf:imports:changed` العرض التحليلي نفسه إلى
      الملفات المتغيرة منذ `origin/main`.
    - عندما يظل اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
      فأبقِ التبعيات الثقيلة خلف طبقة محلية ضيقة `*.runtime.ts` و
      حاكِ تلك الطبقة مباشرة بدل الاستيراد العميق لمساعدات runtime
      فقط لتمريرها عبر `vi.mock(...)`.
    - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين
      `test:changed` الموجّه وبين مسار root-project الأصلي لذلك diff المثبت
      ويطبع زمن الجدار بالإضافة إلى أقصى RSS على macOS.
    - يقوم `pnpm test:perf:changed:bench -- --worktree` بقياس أداء
      الشجرة الحالية غير النظيفة عبر توجيه قائمة الملفات المتغيرة من خلال
      `scripts/test-projects.mjs` وإعداد Vitest الجذري.
    - يكتب `pnpm test:perf:profile:main` ملف CPU profile للخيط الرئيسي
      لأعباء بدء تشغيل Vitest/Vite والتحويل.
    - يكتب `pnpm test:perf:profile:runner` ملفات CPU+heap profile الخاصة بالمشغّل
      لمجموعة unit مع تعطيل توازي الملفات.

  </Accordion>
</AccordionGroup>

### الاستقرار (Gateway)

- الأمر: `pnpm test:stability:gateway`
- التهيئة: `vitest.gateway.config.ts`، مع فرض عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا على loopback مع تفعيل التشخيصات افتراضيًا
  - يدفع تبدلات اصطناعية في رسائل gateway والذاكرة والحمولات الكبيرة عبر مسار الأحداث التشخيصي
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات استمرارية حزمة استقرار التشخيص
  - يؤكد أن المسجّل يظل محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق الطابور لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - مسار ضيق لمتابعة اختبارات انحدار الاستقرار، وليس بديلًا عن مجموعة Gateway الكاملة

### E2E (اختبار smoke للـ gateway)

- الأمر: `pnpm test:e2e`
- التهيئة: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E الخاصة بـ Plugin المضمّن تحت `extensions/`
- القيم الافتراضية لوقت التشغيل:
  - يستخدم Vitest بالقيمة `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمالًا تكيفيين (في CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة الإدخال/الإخراج في وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين مخرجات وحدة التحكم المفصلة.
- النطاق:
  - سلوك Gateway من النهاية إلى النهاية عبر عدة مثيلات
  - أسطح WebSocket/HTTP، وpairing للعُقد، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في المسار)
  - لا يحتاج إلى مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: اختبار smoke لخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ Gateway OpenShell معزولًا على المضيف عبر Docker
  - ينشئ Sandbox من Dockerfile محلي مؤقت
  - يختبر خلفية OpenShell الخاصة بـ OpenClaw عبر `sandbox ssh-config` + SSH exec حقيقيين
  - يتحقق من سلوك نظام الملفات القانوني البعيد عبر جسر fs الخاص بـ Sandbox
- التوقعات:
  - اشتراك صريح فقط؛ وليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمر Gateway الاختباري وSandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو wrapper script

### Live (مزودون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- التهيئة: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات live الخاصة بـ Plugin المضمّن تحت `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعليًا **اليوم** باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق المزوّد، وغرائب استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر لـ CI بطبيعته (شبكات حقيقية، وسياسات مزودين حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستهلك حدود المعدل
  - يُفضَّل تشغيل مجموعات فرعية ضيقة بدل "كل شيء"
- تقوم التشغيلات الحية بتحميل `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضيًا، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد التهيئة/المصادقة إلى home اختباري مؤقت حتى لا تتمكن مثبتات unit من تعديل `~/.openclaw` الحقيقي لديك.
- عيّن `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل home الحقيقي الخاص بك.
- يستخدم `pnpm test:live` الآن افتراضيًا وضعًا أكثر هدوءًا: فهو يُبقي مخرجات التقدم `[live] ...`، لكنه يمنع إشعار `~/.profile` الإضافي ويكتم سجلات bootstrap الخاصة بـ gateway وضجيج Bonjour. عيّن `OPENCLAW_LIVE_TEST_QUIET=0` إذا كنت تريد استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بالمزوّد): عيّن `*_API_KEYS` بصيغة الفاصلة/الفاصلة المنقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (على سبيل المثال `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ وتعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدم/Heartbeat:
  - تطلق الأجنحة الحية الآن أسطر تقدم إلى stderr بحيث تظل استدعاءات المزوّد الطويلة نشطة بوضوح حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يقوم `vitest.live.config.ts` بتعطيل اعتراض وحدة التحكم في Vitest بحيث تتدفق أسطر التقدم الخاصة بالمزوّد/الـ gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeatات النموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeatات الـ gateway/probe باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي جناح يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات الـ gateway / بروتوكول WS / pairing: أضف `pnpm test:e2e`
- تصحيح "الروبوت الخاص بي متوقف" / أعطال خاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` مضيقًا

## الاختبارات الحية (التي تلمس الشبكة)

بالنسبة إلى مصفوفة النماذج الحية، واختبارات smoke لخلفية CLI، واختبارات smoke لـ ACP، و
Codex app-server harness، وجميع اختبارات live لمزودي الوسائط (Deepgram وBytePlus وComfyUI وimage و
music وvideo وmedia harness) — بالإضافة إلى التعامل مع بيانات الاعتماد للتشغيلات الحية — راجع
[الاختبار — الأجنحة الحية](/ar/help/testing-live).

## مشغلات Docker (فحوصات اختيارية "تعمل على Linux")

تنقسم مشغلات Docker هذه إلى فئتين:

- مشغلات live-model: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف live المطابق لمفتاح profile الخاص بهما داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل التهيئة المحلي ومساحة العمل لديك (ومع تحميل `~/.profile` إذا تم تركيبه). أما نقاط الدخول المحلية المطابقة فهي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker الحية افتراضيًا حد smoke أصغر حتى يظل الاجتياح الكامل عبر Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز هذه المتغيرات في env عندما
  تريد صراحةً المسح الأكبر الشامل.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها في مسارات Docker الحية. كما يبني صورة مشتركة واحدة لـ `scripts/e2e/Dockerfile` عبر `test:docker:e2e-build` ويعيد استخدامها لمشغلات smoke الحاوية الخاصة بـ E2E التي تختبر التطبيق المبني. يستخدم التجميع مجدولًا محليًا موزونًا: يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM` في فتحات العمليات، بينما تمنع حدود الموارد بدء جميع المسارات الثقيلة الحية ومسارات تثبيت npm ومسارات الخدمات المتعددة في الوقت نفسه. القيم الافتراضية هي 10 فتحات، و`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`، و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`، و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`؛ ولا تضبط `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` إلا عندما يكون لدى مضيف Docker سعة أكبر. ينفّذ المشغّل فحص Docker preflight افتراضيًا، ويزيل حاويات OpenClaw E2E القديمة، ويطبع الحالة كل 30 ثانية، ويخزن أزمنة المسارات الناجحة في `.artifacts/docker-tests/lane-timings.json`، ويستخدم هذه الأزمنة لبدء المسارات الأطول أولًا في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة بيان المسارات الموزون من دون بناء أو تشغيل Docker.
- مشغلات smoke للحاويات: تقوم `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:agents-delete-shared-workspace` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:pi-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:config-reload` بتشغيل حاوية حقيقية واحدة أو أكثر والتحقق من مسارات integration ذات مستوى أعلى.

كما تقوم مشغلات live-model في Docker بتركيب أدلة مصادقة CLI اللازمة فقط (أو جميع الأدلة المدعومة عندما لا يكون التشغيل مقيّدًا)، ثم تنسخها إلى home الحاوية قبل التشغيل بحيث يمكن لـ OAuth الخاص بـ CLI الخارجي تحديث tokens من دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكريبت: `scripts/test-live-models-docker.sh`)
- اختبار smoke لربط ACP: ‏`pnpm test:docker:live-acp-bind` (السكريبت: `scripts/test-live-acp-bind-docker.sh`؛ يغطي Claude وCodex وGemini افتراضيًا، مع تغطية OpenCode الصارمة عبر `pnpm test:docker:live-acp-bind:opencode`)
- اختبار smoke لخلفية CLI: ‏`pnpm test:docker:live-cli-backend` (السكريبت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار smoke لحزمة Codex app-server: ‏`pnpm test:docker:live-codex-harness` (السكريبت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل dev: ‏`pnpm test:docker:live-gateway` (السكريبت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار smoke حي لـ Open WebUI: ‏`pnpm test:docker:openwebui` (السكريبت: `scripts/e2e/openwebui-docker.sh`)
- معالج Onboarding (TTY، مع scaffolding كامل): ‏`pnpm test:docker:onboard` (السكريبت: `scripts/e2e/onboard-docker.sh`)
- اختبار smoke لـ Npm tarball onboarding/channel/agent: يقوم `pnpm test:docker:npm-onboard-channel-agent` بتثبيت OpenClaw tarball المعبأ تثبيتًا عامًا داخل Docker، ويهيّئ OpenAI عبر onboarding قائم على env-ref بالإضافة إلى Telegram افتراضيًا، ويتحقق من أن doctor يصلح تبعيات وقت تشغيل Plugin المفعّلة، ويشغّل دور وكيل واحدًا وهميًا لـ OpenAI. أعد استخدام tarball مبني مسبقًا عبر `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة البناء على المضيف عبر `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة عبر `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- اختبار smoke للتثبيت العام عبر Bun: ‏`bash scripts/e2e/bun-global-install-smoke.sh` يحزم الشجرة الحالية، ويثبتها باستخدام `bun install -g` داخل home معزول، ويتحقق من أن `openclaw infer image providers --json` يعيد مزوّدي الصور المضمنين بدل أن يتوقف. أعد استخدام tarball مبني مسبقًا عبر `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف عبر `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية عبر `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار smoke لتثبيت Docker: ‏`bash scripts/test-install-sh-docker.sh` يشارك cache npm واحدة عبر حاويات root وupdate وdirect-npm. ويستخدم اختبار update افتراضيًا npm `latest` بوصفه خط الأساس المستقر قبل الترقية إلى tarball المرشح. وتحتفظ فحوصات المُثبِّت غير الجذرية بـ cache npm معزولة حتى لا تخفي إدخالات cache المملوكة لـ root سلوك التثبيت المحلي للمستخدم. عيّن `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام cache الخاصة بـ root/update/direct-npm عبر إعادة التشغيلات المحلية.
- يتخطى Install Smoke في CI التحديث العام المباشر المكرر لـ npm عبر `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل السكريبت محليًا من دون هذا env عندما تكون تغطية `npm install -g` المباشرة مطلوبة.
- اختبار smoke لـ CLI الخاص بحذف مساحة العمل المشتركة للوكلاء: ‏`pnpm test:docker:agents-delete-shared-workspace` (السكريبت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) يبني صورة Dockerfile الجذرية افتراضيًا، ويزرع وكيلين مع مساحة عمل واحدة داخل home حاوية معزولة، ويشغّل `agents delete --json`، ويتحقق من JSON صالح ومن سلوك الاحتفاظ بمساحة العمل. أعد استخدام صورة install-smoke عبر `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- شبكات Gateway (حاويتان، ومصادقة WS + الصحة): ‏`pnpm test:docker:gateway-network` (السكريبت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار انحدار OpenAI Responses web_search بالحد الأدنى من reasoning: ‏`pnpm test:docker:openai-web-search-minimal` (السكريبت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغّل خادم OpenAI وهميًا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط المزوّد ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP (Gateway مزروع + جسر stdio + اختبار smoke لإطار الإشعار الخام الخاص بـ Claude): ‏`pnpm test:docker:mcp-channels` (السكريبت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi (خادم MCP حقيقي عبر stdio + اختبار smoke للسماح/المنع في profile الخاصة بـ Pi المضمن): ‏`pnpm test:docker:pi-bundle-mcp-tools` (السكريبت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف MCP الخاص بـ Cron/subagent (Gateway حقيقي + تفكيك child حقيقي لـ MCP عبر stdio بعد تشغيلات Cron المعزولة وتشغيلات subagent لمرة واحدة): ‏`pnpm test:docker:cron-mcp-cleanup` (السكريبت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (اختبار smoke للتثبيت + الاسم المستعار `/plugin` + دلالات إعادة تشغيل Claude-bundle): ‏`pnpm test:docker:plugins` (السكريبت: `scripts/e2e/plugins-docker.sh`)
- اختبار smoke لعدم تغير Plugin update: ‏`pnpm test:docker:plugin-update` (السكريبت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار smoke لبيانات التعريف الخاصة بـ Config reload: ‏`pnpm test:docker:config-reload` (السكريبت: `scripts/e2e/config-reload-source-docker.sh`)
- تبعيات وقت تشغيل Plugin المضمن: يقوم `pnpm test:docker:bundled-channel-deps` افتراضيًا ببناء صورة مشغّل Docker صغيرة، ويبني OpenClaw ويحزمه مرة واحدة على المضيف، ثم يركّب ذلك tarball داخل كل سيناريو تثبيت على Linux. أعد استخدام الصورة عبر `OPENCLAW_SKIP_DOCKER_BUILD=1`، أو تخطَّ إعادة البناء على المضيف بعد بناء محلي حديث عبر `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`، أو وجّه إلى tarball موجود عبر `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. يقوم التجميع الكامل لـ Docker بحزم هذا tarball مسبقًا مرة واحدة، ثم يوزع فحوصات القنوات المضمنة إلى مسارات مستقلة، بما في ذلك مسارات update منفصلة لـ Telegram وDiscord وSlack وFeishu وmemory-lancedb وACPX. استخدم `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` لتضييق مصفوفة القنوات عند تشغيل المسار المضمن مباشرة، أو `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` لتضييق سيناريو update. كما يتحقق المسار أيضًا من أن `channels.<id>.enabled=false` و`plugins.entries.<id>.enabled=false` يمنعان إصلاح doctor/تبعيات وقت التشغيل.
- ضيّق تبعيات وقت تشغيل Plugin المضمن أثناء التكرار عبر تعطيل السيناريوهات غير المرتبطة، على سبيل المثال:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

لبناء صورة التطبيق المبني المشتركة وإعادة استخدامها يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

لا تزال تجاوزات الصور الخاصة بكل جناح مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` تتغلب عند تعيينها. وعندما تشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تقوم السكريبتات بسحبها إذا لم تكن موجودة محليًا بالفعل. وتحتفظ اختبارات Docker الخاصة بـ QR والمثبّت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

كما تقوم مشغلات Docker الحية للنماذج بتركيب checkout الحالية للقراءة فقط
وتهيئتها داخل دليل عمل مؤقت داخل الحاوية. وهذا يُبقي صورة runtime
نحيفة مع الاستمرار في تشغيل Vitest ضد source/config المحلية الدقيقة لديك.
تتخطى خطوة التهيئة caches المحلية الكبيرة فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو
مخرجات Gradle حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
artifacts خاصة بالجهاز.
كما أنها تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية
عمال قنوات حقيقية مثل Telegram/Discord وغيرها داخل الحاوية.
ولا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker هذا.
ويُعد `test:docker:openwebui` اختبار smoke للتوافق على مستوى أعلى: فهو يبدأ
حاوية Gateway من OpenClaw مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة ضد ذلك الـ Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يكشف `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد البدء البارد الخاص به.
ويتوقع هذا المسار وجود مفتاح نموذج حي صالح، ويُعد `OPENCLAW_PROFILE_FILE`
(الذي يكون افتراضيًا `~/.profile`) الوسيلة الأساسية لتوفيره في التشغيلات عبر Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
ويُعد `test:docker:mcp-channels` حتميًا عمدًا ولا يحتاج إلى حساب
Telegram أو Discord أو iMessage حقيقي. فهو يشغّل حاوية Gateway مزروعة،
ويبدأ حاوية ثانية تُشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءات النصوص، وبيانات تعريف المرفقات،
وسلوك طابور الأحداث الحي، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. ويفحص فحص الإشعارات
إطارات stdio MCP الخام مباشرةً بحيث يتحقق اختبار smoke مما يطلقه الجسر
فعليًا، وليس فقط مما يكشفه SDK عميل معيّن.
ويُعد `test:docker:pi-bundle-mcp-tools` حتميًا ولا يحتاج إلى
مفتاح نموذج حي. فهو يبني صورة Docker الخاصة بالمستودع، ويبدأ خادم probe حقيقيًا عبر stdio MCP
داخل الحاوية، ويحقق هذا الخادم عبر runtime الخاص بـ Pi bundle MCP
المضمن، وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما تقوم `minimal` و`tools.deny: ["bundle-mcp"]` بتصفيتها.
ويُعد `test:docker:cron-mcp-cleanup` حتميًا ولا يحتاج إلى مفتاح نموذج حي.
فهو يبدأ Gateway مزروعًا مع خادم probe حقيقي عبر stdio MCP، ويشغّل دور Cron
معزولًا ودورًا فرعيًا لمرة واحدة عبر `/subagents spawn`، ثم يتحقق
من أن عملية MCP الفرعية تنتهي بعد كل تشغيل.

اختبار smoke يدوي لخيط ACP بلغة طبيعية عادية (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكريبت لأغراض workflows الخاصة بالانحدار/تصحيح الأخطاء. فقد يلزم مرة أخرى للتحقق من توجيه خيوط ACP، لذا لا تحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يُركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يُركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) يُركّب إلى `/home/node/.profile` ويُحمّل قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات env المأخوذة فقط من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة تهيئة/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يُركّب إلى `/home/node/.npm-global` من أجل تثبيتات CLI المخبأة داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تقوم التشغيلات المضيقة للمزوّد بتركيب الأدلة/الملفات اللازمة فقط والمستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة من أجل إعادة التشغيلات التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن profile (وليس من env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يكشفه الـ gateway في اختبار smoke الخاص بـ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز موجه فحص nonce المستخدم في اختبار smoke الخاص بـ Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## التحقق من سلامة المستندات

شغّل فحوصات المستندات بعد تعديلات المستندات: `pnpm check:docs`.
وشغّل التحقق الكامل من روابط وعناوين Mintlify عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبارات الانحدار دون اتصال (آمنة لـ CI)

هذه اختبارات انحدار لـ "المسار الحقيقي" من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (WS ‏`wizard.start`/`wizard.next`، يكتب config + auth بشكل مفروض): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمية عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج كاملة من البداية إلى النهاية تتحقق من wiring الجلسة وتأثيرات التهيئة (`src/gateway/gateway.test.ts`).

ما يزال ينقصنا بالنسبة إلى Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في الموجّه، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/المعاملات المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، وانتقال سجل الجلسة، وحدود Sandbox.

يجب أن تظل التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وwiring الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skill (استخدام مقابل تجنب، والتقييد، وحقن الموجّه).
- تقييمات حية اختيارية (اشتراك صريح، ومقيّدة عبر env) فقط بعد اكتمال المجموعة الآمنة لـ CI.

## اختبارات العقد (شكل Plugin والقناة)

تتحقق اختبارات العقد من أن كل Plugin وقناة مسجلين يلتزمان
بعقد الواجهة الخاصة بهما. فهي تمر على جميع plugins المكتشفة وتشغّل مجموعة من
التحققات الخاصة بالشكل والسلوك. وتتخطى مسار unit الافتراضي في `pnpm test`
عمدًا هذه الملفات المشتركة الخاصة بالحواف واختبارات smoke؛ شغّل أوامر العقد صراحةً
عندما تلمس الأسطح المشتركة للقنوات أو المزوّدين.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (id وname وcapabilities)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف سلسلة الرسائل
- **directory** - API الدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القنوات
- **registry** - شكل سجل Plugin

### عقود المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API كتالوج النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب تشغيلها

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة أو تعديل قناة أو Plugin مزوّد
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات انحدار (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في live:

- أضف اختبار انحدار آمنًا لـ CI إذا أمكن (مزود وهمي/مستبدل، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت المشكلة حية بطبيعتها فقط (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واشتراكيًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشر
  - خطأ في مسار الجلسة/السجل/الأدوات في الـ gateway → اختبار smoke حي للـ gateway أو اختبار gateway وهمي آمن لـ CI
- حاجز حماية لاجتياز SecretRef:
  - تستخلص `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا نموذجيًا واحدًا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم تؤكد رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. ويتعمد الاختبار الفشل مع معرّفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [الاختبار الحي](/ar/help/testing-live)
- [CI](/ar/ci)
