---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات تراجعية لأخطاء النموذج/الموفّر
    - تصحيح سلوك Gateway + الوكيل
summary: 'عدة الاختبار: مجموعات unit/e2e/live، ومشغّلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-23T14:00:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاث مجموعات Vitest ‏(unit/integration، وe2e، وlive) ومجموعة صغيرة من مشغّلات Docker.

هذه الوثيقة هي دليل "كيف نختبر":

- ما الذي تغطيه كل مجموعة (وما الذي لا تغطيه عمدًا)
- الأوامر التي ينبغي تشغيلها في مهام العمل الشائعة (محليًا، قبل push، وتصحيح الأخطاء)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/الموفّرين
- كيفية إضافة اختبارات تراجعية لمشكلات النماذج/الموفّرين الواقعية

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع كامل للمجموعات محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- أصبح الاستهداف المباشر للملفات يوجّه الآن أيضًا مسارات extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- يُفضّل تشغيل الاستهدافات الضيقة أولًا عندما تكون تعمل على تكرار معالجة فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح موفّرين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (النماذج + فحوصات أدوات/صور Gateway): `pnpm test:live`
- استهداف ملف حي واحد بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- جولة نماذج حية في Docker: `pnpm test:docker:live-models`
  - تغطية CI: يستدعي كل من `OpenClaw Scheduled Live And E2E Checks` اليومي و
    `OpenClaw Release Checks` اليدوي سير العمل الحي/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن وظائف مصفوفة منفصلة للنماذج الحية في Docker
    ومجزأة حسب الموفّر.
  - لإعادات تشغيل CI المركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و`live_models_only: true`.
  - أضف أسرار الموفّرين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` وإلى
    مستدعيه المجدولين/الخاصين بالإصدار.
- فحص تكلفة Moonshot/Kimi: مع تعيين `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  بشكل معزول على `moonshot/kimi-k2.6`. تحقّق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  سجل المساعد يخزّن `usage.cost` مُطبّعًا.

نصيحة: عندما تحتاج فقط إلى حالة فاشلة واحدة، فالأفضل تضييق الاختبارات الحية باستخدام متغيرات بيئة allowlist الموضحة أدناه.

## مشغّلات خاصة بـ QA

تأتي هذه الأوامر إلى جانب مجموعات الاختبار الأساسية عندما تحتاج إلى واقعية qa-lab:

يشغّل CI معمل QA ضمن سيرات عمل مخصصة. يعمل `Parity gate` على الطلبات المطابقة
ومن خلال التشغيل اليدوي باستخدام موفّرين وهميين. ويعمل `QA-Lab - All Lanes` ليليًا على
`main` ومن خلال التشغيل اليدوي مع بوابة التكافؤ الوهمية، ومسار Matrix الحي، ومسار Telegram الحي
المدار بواسطة Convex بوصفها وظائف متوازية. كما يشغّل `OpenClaw Release Checks`
المسارات نفسها قبل اعتماد الإصدار.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المعتمدة على المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمّال gateway معزولين.
    يستخدم `qa-channel` درجة توازي افتراضية قدرها 4 (ومحدودة بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمّال،
    أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون رمز خروج فاشل.
  - يدعم أوضاع الموفّرين `live-frontier` و`mock-openai` و`aimock`.
    يقوم `aimock` بتشغيل خادم موفّر محلي مدعوم بـ AIMock لتغطية تجريبية
    للتركيبات الثابتة ومحاكاة البروتوكول، من دون استبدال مسار `mock-openai`
    الواعي بالسيناريوهات.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل آلة Linux افتراضية قابلة للتخلص منها من Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه كما في `qa suite` على المضيف.
  - يعيد استخدام العلامات نفسها لاختيار الموفّر/النموذج كما في `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح الموفّرين المعتمدة على env، ومسار إعداد موفّر QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى مجلدات الإخراج تحت جذر المستودع لكي يتمكن الضيف من الكتابة عائدًا عبر
    مساحة العمل المركّبة.
  - يكتب تقرير QA + الملخص المعتادين بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA على نمط المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني npm tarball من النسخة الحالية من المستودع، ويثبّته عالميًا في
    Docker، ويشغّل إعداد OpenAI بمفتاح API من دون تفاعل، ويضبط Telegram
    افتراضيًا، ويتحقق من أن تفعيل Plugin يثبّت تبعيات وقت التشغيل عند الطلب،
    ويشغّل doctor، ويشغّل دورة وكيل محلية واحدة على نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار
    التثبيت المحزّم نفسه مع Discord.
- `pnpm test:docker:bundled-channel-deps`
  - يحزّم ويثبّت بنية OpenClaw الحالية في Docker، ويبدأ Gateway
    مع ضبط OpenAI، ثم يفعّل channel/plugins المضمّنة عبر
    تعديلات config.
  - يتحقق من أن اكتشاف setup يترك تبعيات وقت تشغيل plugin غير المضبوطة
    غائبة، وأن أول تشغيل مضبوط لـ Gateway أو doctor يثبّت تبعيات
    وقت تشغيل كل plugin مضمّن عند الطلب، وأن إعادة التشغيل الثانية لا تعيد
    تثبيت التبعيات التي سبق تفعيلها.
  - كما يثبّت إصدار npm أقدم معروفًا، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن
    doctor بعد التحديث في الإصدار المرشح يصلح تبعيات وقت تشغيل القنوات المضمّنة
    من دون إصلاح postinstall من جهة أداة الاختبار.
- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم الموفّر المحلي AIMock لاختبار الدخان المباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم Tuwunel منزلي مدعوم بـ Docker وقابل للتخلص منه.
  - مضيف QA هذا خاص بالمستودع/التطوير فقط في الوقت الحالي. ولا تشحن تثبيتات OpenClaw المحزّمة
    `qa-lab`، لذا فهي لا تعرض `openclaw qa`.
  - تستخدم نسخ المستودع runner المضمّن مباشرة؛ ولا حاجة إلى خطوة منفصلة
    لتثبيت Plugin.
  - يوفّر ثلاثة مستخدمين مؤقتين لـ Matrix ‏(`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ عملية فرعية لـ QA gateway مع Plugin ‏Matrix الحقيقي بوصفه نقل SUT.
  - يستخدم صورة Tuwunel المستقرة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يعرّض Matrix علامات مصدر بيانات اعتماد مشتركة لأن المسار يوفّر مستخدمين مؤقتين محليًا.
  - يكتب تقرير QA لـ Matrix، وملخصًا، وartifact للأحداث المرصودة، وسجل إخراج stdout/stderr مدمج تحت `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رمزي bot الخاصين بالسائق وSUT من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ويجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع env افتراضيًا، أو عيّن `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` لاختيار الإيجارات المجمّعة.
  - يخرج برمز غير صفري عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون رمز خروج فاشل.
  - يتطلب botين مختلفين في المجموعة الخاصة نفسها، مع كشف bot الخاص بـ SUT عن اسم مستخدم Telegram.
  - لتحقيق ملاحظة مستقرة بين bot وآخر، فعّل وضع Bot-to-Bot Communication Mode في `@BotFather` لكلا botين وتأكد من أن bot السائق يستطيع ملاحظة حركة bot في المجموعة.
  - يكتب تقرير QA لـ Telegram، وملخصًا، وartifact للرسائل المرصودة تحت `.artifacts/qa-e2e/...`. وتتضمن سيناريوهات الرد RTT من طلب الإرسال الخاص بالسائق إلى الرد المرصود من SUT.

تشترك المسارات الحية للنقل في عقد قياسي واحد حتى لا تنجرف عمليات النقل الجديدة:

يبقى `qa-channel` مجموعة QA الاصطناعية الواسعة وليس جزءًا من مصفوفة تغطية
النقل الحي.

| المسار   | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex ‏(v1)

عندما يكون `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) مفعّلًا من أجل
`openclaw qa telegram`، يحصل qa-lab على إيجار حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat
لذلك الإيجار أثناء تشغيل المسار، ويحرر الإيجار عند الإيقاف.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` ‏(على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` من أجل `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` من أجل `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: ‏`--credential-role maintainer|ci`
  - القيمة الافتراضية في env: ‏`OPENCLAW_QA_CREDENTIAL_ROLE` ‏(القيمة الافتراضية `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات env اختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` ‏(الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` ‏(الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` ‏(الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` ‏(الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` ‏(الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` ‏(معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين Convex ‏`http://` الخاصة بـ loopback فقط للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` بروتوكول `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/سرد المجموعة) القيمة
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` للحصول على إخراج قابل للقراءة آليًا في السكربتات وأدوات CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - الاستنفاد/قابلية إعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - النجاح: `{ status: "ok" }` ‏(أو `2xx` فارغ)
- `POST /release`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - النجاح: `{ status: "ok" }` ‏(أو `2xx` فارغ)
- `POST /admin/add` ‏(سر المشرف فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` ‏(سر المشرف فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حاجز الإيجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` ‏(سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن تكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- تتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` وترفض الحمولات غير الصحيحة.

### إضافة channel إلى QA

تتطلب إضافة channel إلى نظام QA المعتمد على Markdown أمرين فقط بالضبط:

1. مُهايئ نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تُضف جذر أوامر QA جديدًا على مستوى علوي عندما يمكن للمضيف المشترك `qa-lab`
أن يتولى هذا التدفق.

يتولى `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- توازي العاملين
- كتابة artifacts
- إنشاء التقارير
- تنفيذ السيناريوهات
- الأسماء البديلة التوافقية لسيناريوهات `qa-channel` الأقدم

تتولى Plugins الخاصة بالمشغّل عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيفية ضبط gateway لهذا النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية ملاحظة الرسائل الصادرة
- كيفية كشف النصوص المنسوخة وحالة النقل المطبّعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى المطلوب لاعتماد قناة جديدة هو:

1. الإبقاء على `qa-lab` بوصفه مالك جذر `qa` المشترك.
2. تنفيذ transport runner على وصلة المضيف المشتركة `qa-lab`.
3. الإبقاء على الآليات الخاصة بالنقل داخل Plugin المشغّل أو حزمة القناة.
4. تركيب المشغّل بوصفه `openclaw qa <runner>` بدلًا من تسجيل جذر أوامر منافس.
   يجب على Plugins الخاصة بالمشغّل تعريف `qaRunners` في `openclaw.plugin.json` وتصدير مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   اجعل `runtime-api.ts` خفيفًا؛ ويجب أن تبقى CLI الكسولة وتنفيذ المشغّل خلف نقاط دخول منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown ضمن المجلدات ذات الطابع `qa/scenarios/`.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. الإبقاء على الأسماء البديلة التوافقية الحالية عاملة ما لم يكن المستودع ينفذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه داخل Plugin ذلك المشغّل أو حزمة Plugin.
- إذا احتاج السيناريو إلى قدرة جديدة يمكن لأكثر من قناة واحدة استخدامها، فأضف مساعدًا عامًا بدلًا من تفرّع خاص بقناة داخل `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بذلك النقل واجعل ذلك صريحًا في عقد السيناريو.

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

تظل الأسماء البديلة التوافقية متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم الأعمال الجديدة الخاصة بالقنوات أسماء المساعدات العامة.
توجد الأسماء البديلة التوافقية لتجنّب ترحيل جماعي دفعة واحدة، لا بوصفها النموذج
لتأليف السيناريوهات الجديدة.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات على أنها “تزيد واقعيةً” (وتزيد معها القابلية للتعطل/التكلفة):

### Unit / integration ‏(الافتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة الأجزاء `vitest.full-*.config.ts` وقد توسّع الأجزاء متعددة المشاريع إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: جرد core/unit ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts` واختبارات `ui` المدرجة المسموح بها والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة gateway، والتوجيه، والأدوات، والتحليل، والإعداد)
  - اختبارات تراجعية حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - يشغّل `pnpm test` غير المستهدف الآن اثني عشر إعداد جزء أصغر (`core-unit-fast` و`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية مشروع جذر أصلية واحدة ضخمة. وهذا يقلل ذروة RSS على الأجهزة المحمّلة ويتجنب أن تؤدي أعمال auto-reply/extension إلى تجويع المجموعات غير ذات الصلة.
  - لا يزال `pnpm test --watch` يستخدم مخطط المشاريع في الجذر الأصلي `vitest.config.ts`، لأن حلقة watch متعددة الأجزاء غير عملية.
  - يوجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/المجلدات الصريحة عبر المسارات الضيقة أولًا، لذلك فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب تكلفة بدء المشروع الجذري الكامل.
  - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى المسارات الضيقة نفسها عندما يمسّ الفرق فقط ملفات مصدر/اختبار قابلة للتوجيه؛ أما تعديلات config/setup فتعود إلى إعادة التشغيل الواسعة لمشروع الجذر.
  - يُعد `pnpm check:changed` بوابة محلية ذكية عادية للأعمال الضيقة. فهو يصنّف الفرق إلى core، واختبارات core، وextensions، واختبارات extension، وapps، وdocs، وبيانات الإصدار الوصفية، والأدوات، ثم يشغّل مسارات typecheck/lint/test المطابقة. وتشمل تغييرات Plugin SDK العامة وعقود plugin التحقق من extensions لأن extensions تعتمد على عقود core تلك. وتُجري زيادات الإصدار التي تمس بيانات الإصدار الوصفية فقط فحوصات موجهة للإصدار/config/تبعية الجذر بدلًا من المجموعة الكاملة، مع حاجز يرفض تغييرات الحزم خارج حقل الإصدار الأعلى مستوى.
  - تمر اختبارات unit الخفيفة الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدات auto-reply، و`plugin-sdk`، والمناطق النفعية الخالصة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات الثقيلة ذات الحالة/وقت التشغيل على المسارات الحالية.
  - كما تربط بعض ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` التشغيلات في وضع changed باختبارات شقيقة صريحة في تلك المسارات الخفيفة، حتى تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
  - أصبح `auto-reply` يملك الآن ثلاث سلال مخصصة: مساعدات core الأعلى مستوى، واختبارات integration الأعلى مستوى `reply.*`، والشجرة الفرعية `src/auto-reply/reply/**`. وهذا يبقي أثقل أعمال حزمة الرد بعيدًا عن اختبارات الحالة/الأجزاء/الرموز الرخيصة.
- ملاحظة المشغّل المضمّن:
  - عندما تغيّر مدخلات اكتشاف message-tool أو سياق وقت تشغيل Compaction،
    فاحرص على الإبقاء على مستويي التغطية كليهما.
  - أضف اختبارات تراجعية مركزة للمساعدات عند حدود التوجيه/التطبيع الخالصة.
  - واحرص أيضًا على بقاء مجموعات integration الخاصة بالمشغّل المضمّن سليمة:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
    و`src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه المجموعات من أن المعرّفات المقيّدة وسلوك Compaction لا يزالان يمران
    عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تُعد اختبارات المساعدات فقط
    بديلًا كافيًا عن مسارات integration تلك.
- ملاحظة التجميع:
  - أصبح إعداد Vitest الأساسي يستخدم `threads` افتراضيًا.
  - كما يثبّت إعداد Vitest المشترك `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر، وإعدادات e2e، وlive.
  - يحتفظ مسار UI الجذري بإعداد `jsdom` والمُحسّن الخاص به، لكنه يعمل الآن أيضًا على المشغّل المشترك غير المعزول.
  - يرث كل جزء من `pnpm test` الإعدادات الافتراضية نفسها `threads` + `isolate: false` من إعداد Vitest المشترك.
  - يضيف مشغّل `scripts/run-vitest.mjs` المشترك الآن أيضًا `--no-maglev` افتراضيًا إلى عمليات Node الفرعية الخاصة بـ Vitest لتقليل اضطراب ترجمة V8 أثناء التشغيلات المحلية الكبيرة. عيّن `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا احتجت إلى المقارنة مع سلوك V8 القياسي.
- ملاحظة التكرار المحلي السريع:
  - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
  - يشغّل خطاف pre-commit الأمر `pnpm check:changed --staged` بعد التنسيق/التحقق المرحليين، بحيث لا تدفع commits الخاصة بـ core فقط تكلفة اختبارات extension إلا إذا مست العقود العامة المواجهة لـ extension. وتبقى commits الخاصة ببيانات الإصدار الوصفية فقط على مسار الإصدار/config/تبعية الجذر الموجّه.
  - إذا كان قد تم بالفعل التحقق من مجموعة التغييرات المرحلية نفسها ببوابات مساوية أو أقوى، فاستخدم `scripts/committer --fast "<message>" <files...>` لتخطي إعادة تشغيل خطاف changed-scope فقط. ولا يزال التنسيق/التحقق المرحليان يعملان. اذكر البوابات المكتملة في التسليم. وهذا مقبول أيضًا بعد إعادة تشغيل فشل خطاف متقطع معزول ونجاحه مع دليل مقيّد.
  - يوجّه `pnpm test:changed` عبر المسارات الضيقة عندما تطابق المسارات المتغيرة مجموعة أصغر بوضوح.
  - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه نفسه، فقط مع حد أعلى للعاملين.
  - أصبح التوسّع التلقائي المحلي للعاملين متحفظًا عمدًا الآن ويتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تُحدث تشغيلات Vitest المتعددة المتزامنة ضررًا أقل افتراضيًا.
  - يعلّم إعداد Vitest الأساسي ملفات المشاريع/الإعدادات بصفتها `forceRerunTriggers` حتى تبقى إعادة التشغيلات في وضع changed صحيحة عندما يتغير ربط الاختبارات.
  - يُبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفات المدعومة؛ عيّن `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت موقع cache صريحًا واحدًا لأغراض التحليل المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى إخراج تفصيلات الاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض التحليل نفسه بالملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه والمسار الأصلي لمشروع الجذر لذلك الفرق الملتزم ويطبع زمن الجدار بالإضافة إلى أقصى RSS على macOS.
- يقيّم `pnpm test:perf:changed:bench -- --worktree` الشجرة الحالية غير النظيفة عبر توجيه قائمة الملفات المتغيرة من خلال `scripts/test-projects.mjs` وإعداد Vitest الجذري.
  - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي من أجل نفقات بدء تشغيل Vitest/Vite والتحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل من أجل مجموعة unit مع تعطيل توازي الملفات.

### Stability ‏(gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، ومفروض عليه عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا على loopback مع تفعيل diagnostics افتراضيًا
  - يدفع اضطرابًا اصطناعيًا في رسائل gateway والذاكرة والحمولات الكبيرة عبر مسار الحدث التشخيصي
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات حفظ حزمة استقرار diagnostics
  - يثبت أن المُسجّل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ولا يحتاج إلى مفاتيح
  - مسار ضيق لمتابعة تراجعات الاستقرار، وليس بديلًا عن مجموعة Gateway الكاملة

### E2E ‏(gateway smoke)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E الخاصة بالـ Plugins المضمّنة تحت `extensions/`
- إعدادات وقت التشغيل الافتراضية:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عاملين متكيّفين (في CI: حتى 2، ومحليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة الإدخال/الإخراج إلى وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العاملين (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل الإخراج التفصيلي إلى وحدة التحكم.
- النطاق:
  - سلوك Gateway من طرف إلى طرف عبر عدة مثيلات
  - أسطح WebSocket/HTTP، وإقران Node، وشبكات أثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في المسار)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: فحص دخان الواجهة الخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ OpenShell Gateway معزولًا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يختبر الواجهة الخلفية لـ OpenClaw الخاصة بـ OpenShell عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات المرجعي البعيد عبر جسر نظام ملفات sandbox
- التوقعات:
  - تشغيل اختياري فقط؛ وليس جزءًا من التشغيل الافتراضي `pnpm test:e2e`
  - يتطلب CLI ‏`openshell` محليًا بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر test gateway وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ثنائي CLI غير افتراضي أو سكربت wrapper

### Live ‏(موفّرون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات live الخاصة بالـ Plugins المضمّنة تحت `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` ‏(يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - “هل يعمل هذا الموفّر/النموذج فعليًا _اليوم_ مع بيانات اعتماد حقيقية؟”
  - اكتشاف تغيّرات تنسيق الموفّر، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقرة في CI بطبيعتها (شبكات حقيقية، وسياسات موفّرين حقيقية، وحصص، وانقطاعات)
  - تكلف مالًا / تستخدم حدود المعدل
  - يُفضَّل تشغيل مجموعات فرعية ضيقة بدلًا من “كل شيء”
- تستورد التشغيلات الحية الملف `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضيًا، ما تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد config/auth إلى home اختباري مؤقت حتى لا تتمكن fixtures الخاصة بـ unit من تعديل `~/.openclaw` الحقيقي لديك.
- عيّن `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل home الحقيقي لديك.
- يستخدم `pnpm test:live` الآن وضعًا أكثر هدوءًا افتراضيًا: فهو يُبقي على إخراج التقدم `[live] ...`، لكنه يحجب إشعار `~/.profile` الإضافي ويكتم سجلات إقلاع gateway وضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API ‏(خاص بكل موفّر): عيّن `*_API_KEYS` بصيغة فاصلة/فاصلة منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` ‏(مثلًا `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو استخدم تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ وتُعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- إخراج التقدم/Heartbeat:
  - تُصدر المجموعات الحية الآن أسطر تقدم إلى stderr بحيث تبقى استدعاءات الموفّر الطويلة مرئية النشاط حتى عندما يكون التقاط وحدة التحكم في Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest بحيث تتدفق أسطر تقدم الموفّر/gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat النماذج المباشرة بواسطة `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاص بـ gateway/probe بواسطة `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- عند تعديل المنطق/الاختبارات: شغّل `pnpm test` ‏(و`pnpm test:coverage` إذا غيّرت الكثير)
- عند لمس شبكات gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- عند تصحيح “البوت الخاص بي متوقف” / أعطال خاصة بالموفّر / استدعاء الأدوات: شغّل `pnpm test:live` ضيقًا

## Live: مسح قدرات Android Node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن عنه حاليًا** بواسطة Android Node متصل، وإثبات سلوك عقد الأمر.
- النطاق:
  - إعداد يدوي/مسبق الشروط (لا تثبّت المجموعة التطبيق أو تشغّله أو تقترنه).
  - التحقق أمرًا بأمر من `node.invoke` في gateway لـ Android Node المحدد.
- الإعداد المطلوب مسبقًا:
  - تطبيق Android متصل بالفعل + مقترن بالـ gateway.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/موافقات الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات هدف اختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [Android App](/ar/platforms/android)

## Live: فحص دخان النموذج ‏(مفاتيح الملف الشخصي)

تنقسم الاختبارات الحية إلى طبقتين حتى يمكننا عزل الأعطال:

- “النموذج المباشر” يخبرنا إن كان الموفّر/النموذج قادرًا على الرد أصلًا بالمفتاح المعطى.
- “فحص دخان Gateway” يخبرنا إن كان خط أنابيب gateway+agent الكامل يعمل لذلك النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال نموذج مباشر ‏(من دون gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - حصر النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات تراجعية مستهدفة عند الحاجة)
- كيفية التمكين:
  - `pnpm test:live` ‏(أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- عيّن `OPENCLAW_LIVE_MODELS=modern` ‏(أو `all`، وهو اسم بديل لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها للإبقاء على تركيز `pnpm test:live` على فحص دخان gateway
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` ‏(قائمة سماح مفصولة بفواصل)
  - تستخدم جولات modern/all افتراضيًا حدًا مُنتقى عالي الإشارة؛ عيّن `OPENCLAW_LIVE_MAX_MODELS=0` لجولة حديثة شاملة أو قيمة موجبة لحد أصغر.
- كيفية اختيار الموفّرين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` ‏(قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل env
  - عيّن `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملف الشخصي** فقط
- لماذا يوجد هذا:
  - يفصل بين “واجهة API الخاصة بالموفّر معطلة / المفتاح غير صالح” و“خط أنابيب وكيل gateway معطل”
  - يحتوي على اختبارات تراجعية صغيرة ومعزولة (مثال: OpenAI Responses/Codex Responses reasoning replay + تدفقات tool-call)

### الطبقة 2: فحص دخان Gateway + dev agent ‏(ما الذي يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` ‏(مع تجاوز النموذج لكل تشغيل)
  - التكرار عبر النماذج التي تملك مفاتيح وإثبات:
    - استجابة “ذات معنى” (من دون أدوات)
    - أن استدعاء أداة حقيقي يعمل (`read` probe)
    - اختبارات أدوات إضافية اختيارية (`exec+read` probe)
    - استمرار عمل مسارات OpenAI التراجعية (tool-call-only → follow-up)
- تفاصيل الفحص (حتى تتمكن من شرح الأعطال بسرعة):
  - فحص `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وإرجاع nonce.
  - فحص `exec+read`: يطلب الاختبار من الوكيل كتابة nonce عبر `exec` داخل ملف مؤقت، ثم `read` له مرة أخرى.
  - فحص الصورة: يرفق الاختبار ملف PNG مُولّدًا (قط + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التمكين:
  - `pnpm test:live` ‏(أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو عيّن `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` ‏(أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم جولات gateway الحديثة/الكلية افتراضيًا حدًا مُنتقى عالي الإشارة؛ عيّن `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لجولة حديثة شاملة أو قيمة موجبة لحد أصغر.
- كيفية اختيار الموفّرين (لتجنب “كل شيء في OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` ‏(قائمة سماح مفصولة بفواصل)
- تكون فحوصات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار الحي:
  - فحص `read` + فحص `exec+read` ‏(ضغط الأدوات)
  - يعمل فحص الصورة عندما يعلن النموذج دعمه لإدخال الصور
  - التدفق (عالي المستوى):
    - يولّد الاختبار ملف PNG صغيرًا يحوي “CAT” + رمزًا عشوائيًا (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` إلى `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` ‏(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - الإثبات: يحتوي الرد على `cat` + الرمز (سماحية OCR: يُسمح بأخطاء طفيفة)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: فحص دخان الواجهة الخلفية لـ CLI ‏(Claude أو Codex أو Gemini أو CLIs محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط أنابيب Gateway + agent باستخدام واجهة خلفية CLI محلية، من دون لمس الإعداد الافتراضي لديك.
- تعيش إعدادات فحص الدخان الافتراضية الخاصة بكل واجهة خلفية داخل تعريف `cli-backend.ts` للـ extension المالكة.
- التمكين:
  - `pnpm test:live` ‏(أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- القيم الافتراضية:
  - الموفّر/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/المعاملات/الصورة من بيانات Plugin الوصفية للواجهة الخلفية لـ CLI المالكة.
- تجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (يتم حقن المسارات في المطالبة).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كمعاملات CLI بدل حقنها في المطالبة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` ‏(أو `"list"`) للتحكم في كيفية تمرير معاملات الصور عند تعيين `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل فحص الاستمرارية الافتراضي ضمن الجلسة نفسها Claude Sonnet -> Opus ‏(اضبطه إلى `1` لفرض تفعيله عندما يدعم النموذج المحدد هدف تبديل).

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-cli-backend
```

وصفات Docker لموفّر واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد مشغّل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل فحص الدخان الحي للواجهة الخلفية لـ CLI داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذري.
- يحل بيانات فحص دخان CLI الوصفية من الـ extension المالكة، ثم يثبّت حزمة CLI المطابقة لـ Linux ‏(`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) داخل بادئة قابلة للكتابة ومخزنة مؤقتًا في `OPENCLAW_DOCKER_CLI_TOOLS_DIR` ‏(الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code عبر أحد الخيارين: `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. وهو يثبت أولًا نجاح `claude -p` المباشر داخل Docker، ثم يشغّل دورتين للواجهة الخلفية لـ Gateway CLI من دون الاحتفاظ بمتغيرات env الخاصة بمفتاح Anthropic API. ويعطّل مسار الاشتراك هذا افتراضيًا فحوصات Claude MCP/tool والصورة لأن Claude يوجّه استخدام التطبيقات الخارجية حاليًا عبر فوترة استخدام إضافي بدل حدود خطة الاشتراك العادية.
- يمارس فحص الدخان الحي للواجهة الخلفية لـ CLI الآن التدفق الكامل نفسه من طرف إلى طرف لكل من Claude وCodex وGemini: دورة نصية، ثم دورة تصنيف صور، ثم استدعاء أداة MCP ‏`cron` يتم التحقق منه عبر Gateway CLI.
- كما يقوم فحص Claude الافتراضي بترقيع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما زالت تتذكر ملاحظة سابقة.

## Live: فحص دخان ربط ACP ‏(`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة الحقيقي لـ ACP مع وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة synthetic message-channel في مكانها
  - إرسال متابعة عادية على تلك المحادثة نفسها
  - التحقق من أن المتابعة تصل إلى النص المنسوخ للجلسة المرتبطة في ACP
- التمكين:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- القيم الافتراضية:
  - وكلاء ACP في Docker: ‏`claude,codex,gemini`
  - وكيل ACP لأجل `pnpm test:live ...` المباشر: ‏`claude`
  - قناة synthetic: سياق محادثة على نمط الرسائل الخاصة في Slack
  - الواجهة الخلفية لـ ACP: ‏`acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- ملاحظات:
  - يستخدم هذا المسار سطح `chat.send` في gateway مع حقول originating-route synthetic خاصة بالإدارة فقط حتى تتمكن الاختبارات من إرفاق سياق message-channel من دون التظاهر بالتسليم الخارجي.
  - عندما تكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` غير معيّنة، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin ‏`acpx` من أجل وكيل ACP المحدد في الحزمة.

مثال:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-acp-bind
```

وصفات Docker لوكيل واحد:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

ملاحظات Docker:

- يوجد مشغّل Docker في `scripts/test-live-acp-bind-docker.sh`.
- يشغّل افتراضيًا فحص دخان ربط ACP على جميع وكلاء CLI الحية المدعومة بالتتابع: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يستورد `~/.profile`، ويجهّز مواد مصادقة CLI المطابقة داخل الحاوية، ويثبّت `acpx` في بادئة npm قابلة للكتابة، ثم يثبّت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان مفقودًا.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` حتى يُبقي acpx متغيرات env الخاصة بالموفّر من profile المستورد متاحة لـ CLI الحزمة الابنة.

## Live: فحص دخان حزمة Codex app-server

- الهدف: التحقق من حزمة Codex المملوكة للـ Plugin عبر طريقة
  `agent` العادية في gateway:
  - تحميل Plugin ‏`codex` المضمّن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال الدورة الأولى لوكيل gateway إلى `codex/gpt-5.4`
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن thread الخاص بـ app-server
    قادر على الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر gateway نفسه
  - اختياريًا تشغيل فحصي shell escalated تمت مراجعتهما من Guardian: أمر غير ضار
    يجب أن تتم الموافقة عليه، ورفع secret زائف يجب أن يتم رفضه
    لكي يطلب الوكيل تأكيدًا
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التمكين: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- فحص صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- فحص Guardian اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يضبط فحص الدخان القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا يتمكن
  خلل في حزمة Codex من النجاح بصمت عبر الرجوع إلى PI.
- المصادقة: `OPENAI_API_KEY` من shell/profile، بالإضافة إلى نسخ اختيارية من
  `~/.codex/auth.json` و`~/.codex/config.toml`

وصفة محلية:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

وصفة Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

ملاحظات Docker:

- يوجد مشغّل Docker في `scripts/test-live-codex-harness-docker.sh`.
- يستورد `~/.profile` المركّب، ويمرّر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبّت `@openai/codex` في بادئة npm مركّبة قابلة للكتابة،
  ويجهّز شجرة المصدر، ثم يشغّل فقط الاختبار الحي لحزمة Codex.
- يفعّل Docker افتراضيًا فحوصات الصورة وMCP/tool وGuardian. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل
  أضيق لتصحيح الأخطاء.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد
  الاختبار الحي حتى لا يتمكن الرجوع إلى `openai-codex/*` أو PI من إخفاء تراجع
  حزمة Codex.

### وصفات live الموصى بها

تكون قوائم السماح الضيقة والصريحة أسرع وأقل قابلية للتعطل:

- نموذج واحد، مباشر (من دون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، فحص دخان gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة موفّرين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google ‏(مفتاح Gemini API + Antigravity):
  - Gemini ‏(مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity ‏(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API ‏(مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth ‏(نقطة نهاية وكيل على نمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` CLI ‏Gemini المحلي على جهازك ‏(مع خصائص مختلفة للمصادقة والأدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP ‏(مصادقة عبر مفتاح API / الملف الشخصي)؛ وهذا هو ما يقصده معظم المستخدمين بعبارة “Gemini”.
  - CLI: يستدعي OpenClaw ثنائي `gemini` محليًا؛ وله مصادقة خاصة به وقد يتصرف بشكل مختلف (الدفق/دعم الأدوات/اختلاف الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد “قائمة نماذج CI” ثابتة (لأن live اختيارية)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير يملك مفاتيح.

### مجموعة الفحص الحديثة ‏(استدعاء الأدوات + الصور)

هذا هو تشغيل “النماذج الشائعة” الذي نتوقع أن يبقى عاملًا:

- OpenAI ‏(غير Codex): ‏`openai/gpt-5.4` ‏(اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: ‏`openai-codex/gpt-5.4`
- Anthropic: ‏`anthropic/claude-opus-4-6` ‏(أو `anthropic/claude-sonnet-4-6`)
- Google ‏(Gemini API): ‏`google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` ‏(تجنب نماذج Gemini 2.x الأقدم)
- Google ‏(Antigravity): ‏`google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI ‏(GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

شغّل فحص دخان gateway مع الأدوات + الصورة:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### الأساس: استدعاء الأدوات ‏(Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة موفّرين:

- OpenAI: ‏`openai/gpt-5.4` ‏(أو `openai/gpt-5.4-mini`)
- Anthropic: ‏`anthropic/claude-opus-4-6` ‏(أو `anthropic/claude-sonnet-4-6`)
- Google: ‏`google/gemini-3-flash-preview` ‏(أو `google/gemini-3.1-pro-preview`)
- Z.AI ‏(GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: ‏`xai/grok-4` ‏(أو أحدث إصدار متاح)
- Mistral: ‏`mistral/`… ‏(اختر نموذجًا واحدًا قادرًا على “الأدوات” ويكون مفعّلًا لديك)
- Cerebras: ‏`cerebras/`… ‏(إذا كان لديك وصول)
- LM Studio: ‏`lmstudio/`… ‏(محلي؛ واستدعاء الأدوات يعتمد على وضع API)

### الرؤية: إرسال الصور ‏(مرفق ← رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على التعامل مع الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` ‏(مثل Claude/Gemini/إصدارات OpenAI الداعمة للرؤية، وما إلى ذلك) لاختبار فحص الصورة.

### المجمّعات / Gateways البديلة

إذا كانت لديك مفاتيح مفعّلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: ‏`openrouter/...` ‏(مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات + الصور)
- OpenCode: ‏`opencode/...` لـ Zen و`opencode-go/...` لـ Go ‏(المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

موفّرون إضافيون يمكنك تضمينهم في مصفوفة live ‏(إذا كانت لديك بيانات اعتماد/config):

- مضمّنون: `openai` و`openai-codex` و`anthropic` و`google` و`google-vertex` و`google-antigravity` و`google-gemini-cli` و`zai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`groq` و`cerebras` و`mistral` و`github-copilot`
- عبر `models.providers` ‏(نقاط نهاية مخصصة): ‏`minimax` ‏(سحابي/API)، بالإضافة إلى أي proxy متوافق مع OpenAI/Anthropic ‏(مثل LM Studio وvLLM وLiteLLM وغيرها)

نصيحة: لا تحاول ترميز “كل النماذج” ترميزًا ثابتًا في المستندات. فالقائمة المرجعية هي ما يعيده `discoverModels(...)` على جهازك + المفاتيح المتاحة.

## بيانات الاعتماد (لا تقم بعمل commit مطلقًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يستخدمها CLI. والنتائج العملية:

- إذا كان CLI يعمل، فيجب أن تجد الاختبارات الحية المفاتيح نفسها.
- إذا قال اختبار حي “لا توجد بيانات اعتماد”، فقم بتصحيح ذلك بالطريقة نفسها التي تُصحّح بها `openclaw models list` / اختيار النموذج.

- ملفات المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ‏(وهذا ما تعنيه “مفاتيح الملف الشخصي” في الاختبارات الحية)
- الإعداد: `~/.openclaw/openclaw.json` ‏(أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` ‏(يتم نسخه إلى home الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح الملفات الشخصية الرئيسي)
- تقوم تشغيلات live المحلية بنسخ config النشط، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى home اختباري مؤقت افتراضيًا؛ كما تتخطى homes الحية المرحلية `workspace/` و`sandboxes/`، وتُزال تجاوزات المسار `agents.*.workspace` / `agentDir` حتى تبقى الفحوصات بعيدة عن مساحة عمل المضيف الحقيقية.

إذا أردت الاعتماد على مفاتيح env ‏(مثلًا المصدّرة في `~/.profile` لديك)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (فهي تستطيع تركيب `~/.profile` داخل الحاوية).

## Deepgram live ‏(نسخ الصوت)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التمكين: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- الاختبار: `extensions/byteplus/live.test.ts`
- التمكين: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز اختياري للنموذج: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر مسارات comfy المضمّنة الخاصة بالصور والفيديو و`music_generate`
  - يتخطى كل قدرة ما لم تكن `models.providers.comfy.<capability>` مضبوطة
  - مفيد بعد تغيير إرسال workflow في comfy أو polling أو التنزيلات أو تسجيل Plugin

## إنشاء الصور live

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحزمة: `pnpm test:live:media image`
- النطاق:
  - يحصر كل Plugin موفّر مُسجَّل لإنشاء الصور
  - يحمّل متغيرات env الخاصة بالموفّرين والمفقودة من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/الخاصة بـ env قبل ملفات المصادقة المخزّنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى الموفّرين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا
  - يشغّل متغيرات إنشاء الصور القياسية عبر قدرة وقت التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- الموفّرون المضمّنون الحاليون المشمولون:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملف الشخصي وتجاهل التجاوزات المعتمدة على env فقط

## إنشاء الموسيقى live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحزمة: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار موفّر إنشاء الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات env الخاصة بالموفّرين من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/الخاصة بـ env قبل ملفات المصادقة المخزّنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى الموفّرين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا
  - يشغّل وضعي وقت التشغيل المُعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد على المطالبة فقط
    - `edit` عندما يعلن الموفّر `capabilities.edit.enabled`
  - التغطية الحالية في المسار المشترك:
    - `google`: ‏`generate`، `edit`
    - `minimax`: ‏`generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذه الجولة المشتركة
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملف الشخصي وتجاهل التجاوزات المعتمدة على env فقط

## إنشاء الفيديو live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحزمة: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار موفّر إنشاء الفيديو المضمّن المشترك
  - يستخدم افتراضيًا مسار فحص دخان آمنًا للإصدار: موفّرون غير FAL، وطلب text-to-video واحد لكل موفّر، ومطالبة lobster لمدة ثانية واحدة، وحد عمليات لكل موفّر من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` ‏(`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الطابور عند جهة الموفّر قد يهيمن على زمن الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات env الخاصة بالموفّرين من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/الخاصة بـ env قبل ملفات المصادقة المخزّنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى الموفّرين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا صالحًا
  - يشغّل فقط `generate` افتراضيًا
  - عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المُعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن الموفّر `capabilities.imageToVideo.enabled` ويقبل الموفّر/النموذج المحدد إدخال صور محلية مدعومًا بمخزن مؤقت في الجولة المشتركة
    - `videoToVideo` عندما يعلن الموفّر `capabilities.videoToVideo.enabled` ويقبل الموفّر/النموذج المحدد إدخال فيديو محلي مدعومًا بمخزن مؤقت في الجولة المشتركة
  - الموفّرون الحاليون المعلنون لكن المتخطَّون في جولة `imageToVideo` المشتركة:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL بعيدًا للصورة
  - تغطية Vydra الخاصة بالموفّر:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` من نص إلى فيديو بالإضافة إلى مسار `kling` يستخدم fixture لعنوان URL بعيد للصورة افتراضيًا
  - التغطية الحية الحالية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - الموفّرون الحاليون المعلنون لكن المتخطَّون في جولة `videoToVideo` المشتركة:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بمخزن مؤقت، وهذا المسار غير مقبول في الجولة المشتركة
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة إلى inpaint/remix للفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل موفّر في الجولة الافتراضية، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد العملية لكل موفّر من أجل تشغيل فحص دخان أكثر شدة
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملف الشخصي وتجاهل التجاوزات المعتمدة على env فقط

## حزمة media الحية

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول أصلية واحدة في المستودع
  - يحمّل تلقائيًا متغيرات env الخاصة بالموفّرين والمفقودة من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة إلى الموفّرين الذين يملكون حاليًا مصادقة صالحة افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغّلات Docker ‏(فحوصات اختيارية من نوع "يعمل على Linux")

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف live المطابق لمفاتيح الملف الشخصي داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل config المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا كان مركبًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغّلات Docker الحية افتراضيًا حد فحص دخان أصغر حتى تبقى الجولة الكاملة في Docker عملية:
  يضبط `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`،
  ويضبط `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحةً الجولة الأكبر والأشمل.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين. كما يبني أيضًا صورة مشتركة واحدة `scripts/e2e/Dockerfile` عبر `test:docker:e2e-build` ويعيد استخدامها لمشغّلات smoke الحاوية الخاصة بـ E2E التي تختبر التطبيق المبني.

تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب أدلة مصادقة CLI المطلوبة فقط (أو جميع الأدلة المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى home داخل الحاوية قبل التشغيل حتى تتمكن OAuth الخاصة بـ CLI الخارجية من تحديث الرموز من دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` ‏(السكربت: `scripts/test-live-models-docker.sh`)
- فحص دخان ربط ACP: `pnpm test:docker:live-acp-bind` ‏(السكربت: `scripts/test-live-acp-bind-docker.sh`)
- فحص دخان الواجهة الخلفية لـ CLI: `pnpm test:docker:live-cli-backend` ‏(السكربت: `scripts/test-live-cli-backend-docker.sh`)
- فحص دخان حزمة Codex app-server: `pnpm test:docker:live-codex-harness` ‏(السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` ‏(السكربت: `scripts/test-live-gateway-models-docker.sh`)
- فحص دخان Open WebUI الحي: `pnpm test:docker:openwebui` ‏(السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج onboarding ‏(TTY، مع هيكلية كاملة): `pnpm test:docker:onboard` ‏(السكربت: `scripts/e2e/onboard-docker.sh`)
- فحص دخان onboarding/channel/agent لحزمة npm tarball: يقوم `pnpm test:docker:npm-onboard-channel-agent` بتثبيت OpenClaw tarball المحزّمة عالميًا في Docker، ويضبط OpenAI عبر onboarding مرجعي لـ env بالإضافة إلى Telegram افتراضيًا، ويتحقق من أن تفعيل Plugin يثبّت تبعيات وقت التشغيل عند الطلب، ويشغّل doctor، ويشغّل دورة وكيل OpenAI وهمية واحدة. أعد استخدام tarball مبنية مسبقًا مع `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة البناء على المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة عبر `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- شبكات Gateway ‏(حاويتان، مصادقة WS + health): ‏`pnpm test:docker:gateway-network` ‏(السكربت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار تراجعي بسيط لتفكير web_search في OpenAI Responses: ‏`pnpm test:docker:openai-web-search-minimal` ‏(السكربت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغّل خادم OpenAI وهميًا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط الموفّر ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر قناة MCP ‏(Gateway مُهيّأة مسبقًا + جسر stdio + فحص دخان raw Claude notification-frame): ‏`pnpm test:docker:mcp-channels` ‏(السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi ‏(خادم MCP حقيقي عبر stdio + فحص سماح/منع لملف Pi المضمّن): ‏`pnpm test:docker:pi-bundle-mcp-tools` ‏(السكربت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف MCP لـ Cron/subagent ‏(Gateway حقيقي + إنهاء child لـ MCP عبر stdio بعد تشغيلات cron معزولة وsubagent أحادية): ‏`pnpm test:docker:cron-mcp-cleanup` ‏(السكربت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins ‏(فحص دخان التثبيت + الاسم البديل `/plugin` + دلالات إعادة تشغيل حزمة Claude): ‏`pnpm test:docker:plugins` ‏(السكربت: `scripts/e2e/plugins-docker.sh`)
- فحص دخان عدم التغيير في تحديث Plugin: ‏`pnpm test:docker:plugin-update` ‏(السكربت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- فحص دخان بيانات reload الوصفية للإعداد: ‏`pnpm test:docker:config-reload` ‏(السكربت: `scripts/e2e/config-reload-source-docker.sh`)
- تبعيات وقت تشغيل Plugin المضمّنة: يبني `pnpm test:docker:bundled-channel-deps` افتراضيًا صورة مشغّل Docker صغيرة، ويبني OpenClaw ويحزّمه مرة واحدة على المضيف، ثم يركّب tarball تلك في كل سيناريو تثبيت على Linux. أعد استخدام الصورة مع `OPENCLAW_SKIP_DOCKER_BUILD=1`، أو تخطَّ إعادة البناء على المضيف بعد بناء محلي جديد باستخدام `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`، أو أشر إلى tarball موجودة عبر `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- ضيّق تبعيات وقت تشغيل Plugin المضمّنة أثناء التكرار عبر تعطيل السيناريوهات غير ذات الصلة، على سبيل المثال:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

للبناء المسبق وإعادة استخدام صورة التطبيق المبني المشتركة يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بالمجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` هي الأعلى أولوية عند تعيينها. وعندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تسحبها السكربتات إذا لم تكن موجودة محليًا بالفعل. وتحتفظ اختبارات Docker الخاصة بـ QR والمثبّت بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب النسخة الحالية من المستودع بوضع القراءة فقط
ثم تهيئتها داخل دليل عمل مؤقت داخل الحاوية. وهذا يُبقي صورة وقت التشغيل
صغيرة مع الاستمرار في تشغيل Vitest على المصدر/config المحلي الدقيق لديك.
وتتخطى خطوة التهيئة هذه caches المحلية الضخمة فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` ومجلدات `.build` المحلية للتطبيق أو
مجلدات إخراج Gradle حتى لا تقضي التشغيلات الحية في Docker دقائق في نسخ
artifacts خاصة بالجهاز.
كما تضبط أيضًا `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ الفحوصات الحية لـ gateway
عمّال قنوات حقيقيين مثل Telegram/Discord داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية gateway
الحية من مسار Docker هذا.
يُعد `test:docker:openwebui` فحص توافق أعلى مستوى: فهو يبدأ
حاوية OpenClaw gateway مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ثم يبدأ حاوية Open WebUI مثبتة الإصدار أمام ذلك gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` في Open WebUI.
وقد تكون أول عملية تشغيل أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI، وقد يحتاج Open WebUI إلى إنهاء إعداد التشغيل البارد الخاص به.
ويتوقع هذا المسار وجود مفتاح نموذج حي صالح، ويُعد `OPENCLAW_PROFILE_FILE`
‏(`~/.profile` افتراضيًا) الوسيلة الأساسية لتوفيره في التشغيلات المعبأة بـ Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
ويُعد `test:docker:mcp-channels` حتميًا عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يقلع
حاوية Gateway مُهيأة مسبقًا، ثم يبدأ حاوية ثانية تُشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءة النصوص المنسوخة، وبيانات المرفقات الوصفية،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات على نمط Claude عبر جسر MCP الحقيقي عبر stdio. ويفحص التحقق من الإشعارات
إطارات MCP الخام عبر stdio مباشرةً حتى يثبت فحص الدخان ما الذي يبثه الجسر
فعليًا، لا مجرد ما يعرضه SDK عميل معين من قبيل الصدفة.
ويُعد `test:docker:pi-bundle-mcp-tools` حتميًا ولا يحتاج إلى
مفتاح نموذج حي. فهو يبني صورة Docker الخاصة بالمستودع، ويبدأ خادم فحص MCP حقيقيًا عبر stdio
داخل الحاوية، ويجسّد ذلك الخادم عبر وقت تشغيل Pi bundle MCP المضمّن،
وينفذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما تقوم `minimal` و`tools.deny: ["bundle-mcp"]` بتصفيتها.
ويُعد `test:docker:cron-mcp-cleanup` حتميًا ولا يحتاج إلى مفتاح نموذج حي.
فهو يبدأ Gateway مُهيّأة مسبقًا مع خادم فحص MCP حقيقي عبر stdio، ويشغّل
دورة Cron معزولة ودورة child أحادية لـ `/subagents spawn`، ثم يتحقق
من أن عملية MCP الفرعية تنتهي بعد كل تشغيل.

فحص smoke يدوي بلغة ACP العادية للـ thread ‏(ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفِظ بهذا السكربت لتدفقات التراجع/تصحيح الأخطاء. فقد يلزم مرة أخرى للتحقق من توجيه ACP thread، لذا لا تقم بحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` ‏(الافتراضي: `~/.openclaw`) يُركَّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` ‏(الافتراضي: `~/.openclaw/workspace`) يُركَّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` ‏(الافتراضي: `~/.profile`) يُركَّب إلى `/home/node/.profile` ويُستورد قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات env فقط المستوردة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة config/workspace مؤقتة ومن دون أي تركيبات لمصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` ‏(الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يُركَّب إلى `/home/node/.npm-global` من أجل تثبيتات CLI مخزّنة مؤقتًا داخل Docker
- تُركَّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` بوضع القراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تركّب التشغيلات المضيّقة حسب الموفّر فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز ذلك يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية الموفّرين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة للتشغيلات المعادة التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن تأتي بيانات الاعتماد من مخزن الملف الشخصي (وليس env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه gateway من أجل فحص Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة التحقق من nonce المستخدمة في فحص Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## التحقق المنطقي من المستندات

شغّل فحوصات المستندات بعد تعديلات المستندات: `pnpm check:docs`.
شغّل التحقق الكامل من anchors في Mintlify عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبار تراجعي دون اتصال ‏(آمن لـ CI)

هذه اختبارات تراجعية لـ “خط أنابيب حقيقي” من دون موفّرين حقيقيين:

- استدعاء أدوات Gateway ‏(OpenAI وهمي، Gateway حقيقي + حلقة agent): ‏`src/gateway/gateway.test.ts` ‏(الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway ‏(‏`wizard.start`/`wizard.next` عبر WS، مع فرض كتابة config + auth): ‏`src/gateway/gateway.test.ts` ‏(الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل ‏(Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل “تقييمات موثوقية الوكيل”:

- استدعاء أدوات وهمية عبر Gateway حقيقي + حلقة agent ‏(`src/gateway/gateway.test.ts`).
- تدفقات معالج كاملة من طرف إلى طرف تتحقق من ربط الجلسات وتأثيرات config ‏(`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا بالنسبة إلى Skills ‏(راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في المطالبة، هل يختار الوكيل Skill الصحيح (أو يتجنب غير المناسب منها)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/المعاملات المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الدورات تثبت ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تظل التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم موفّرين وهميين لإثبات استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وربط الجلسات.
- مجموعة صغيرة من السيناريوهات المركزة على Skills ‏(الاستخدام مقابل التجنب، والبوابات، وحقن المطالبات).
- تقييمات live اختيارية ‏(مفعّلة اختياريًا، ومحكومة بـ env) فقط بعد وضع المجموعة الآمنة لـ CI.

## اختبارات العقد ‏(شكل Plugin وchannel)

تتحقق اختبارات العقد من أن كل Plugin وchannel مُسجَّلين يتوافقان مع
عقد الواجهة الخاصة بهما. فهي تتكرر على جميع Plugins المكتشفة وتُشغّل مجموعة من
إثباتات الشكل والسلوك. ويتخطى مسار `pnpm test` الافتراضي الخاص بـ unit عمدًا
هذه الملفات المشتركة الخاصة بالوصلات وفحوصات الدخان؛ لذا شغّل أوامر العقد صراحةً
عندما تلمس الأسطح المشتركة للقنوات أو الموفّرين.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود الموفّرين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

توجد في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي للـ Plugin ‏(المعرّف، والاسم، والقدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - التعامل مع الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرّف Thread
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة الموفّر

توجد في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود الموفّر

توجد في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل الموفّر
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب التشغيل

- بعد تغيير صادرات Plugin SDK أو المسارات الفرعية
- بعد إضافة Plugin قناة أو موفّر أو تعديلهما
- بعد إعادة هيكلة تسجيل Plugin أو الاكتشاف

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات تراجعية (إرشادات)

عندما تصلح مشكلة موفّر/نموذج اكتُشفت في live:

- أضف اختبارًا تراجعيًا آمنًا لـ CI إن أمكن (موفّر وهمي/مُبدّل، أو التقاط التحويل الدقيق لشكل الطلب)
- إذا كانت المشكلة بطبيعتها خاصة بـ live فقط (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا ومفعّلًا اختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب الموفّر → اختبار نماذج مباشر
  - خطأ في خط أنابيب جلسة/سجل/أدوات Gateway → فحص دخان live لـ gateway أو اختبار Gateway وهمي آمن لـ CI
- حاجز الحماية الخاص باجتياز SecretRef:
  - يقوم `src/secrets/exec-secret-ref-id-parity.test.ts` باشتقاق هدف مُعيَّن واحد لكل فئة SecretRef من بيانات السجل الوصفية (`listSecretTargetRegistryEntries()`)، ثم يثبت رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة هدف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.
