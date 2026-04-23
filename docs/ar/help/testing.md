---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات تراجعية لأخطاء النماذج/المزوّدات
    - تصحيح سلوك Gateway + الوكيل
summary: 'عدة الاختبار: مجموعات unit/e2e/live، ومشغلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-23T07:26:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb3c7e0644b66e5ca8bce51ec52e874ac8c1dfe02193afa3b34d5e6b5e8a355
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاث مجموعات Vitest (unit/integration، وe2e، وlive) ومجموعة صغيرة من مشغلات Docker.

هذا المستند هو دليل "كيف نختبر":

- ما الذي تغطيه كل مجموعة (وما الذي **لا** تغطيه عمدًا)
- ما الأوامر التي يجب تشغيلها في سير العمل الشائعة (محليًا، قبل push، وتصحيح الأخطاء)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدات
- كيفية إضافة اختبارات تراجعية لمشكلات النماذج/المزوّدات في العالم الحقيقي

## بداية سريعة

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع محليًا للمجموعة الكاملة على جهاز بموارد واسعة: `pnpm test:max`
- حلقة watch مباشرة لـ Vitest: `pnpm test:watch`
- أصبح استهداف الملفات المباشر يوجّه الآن أيضًا مسارات extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل أولًا التشغيلات المستهدفة عندما تكون تعمل على تكرار لإخفاق واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بـ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح مزوّدات/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- مجموعة live (النماذج + probes أدوات/صور Gateway): `pnpm test:live`
- استهدف ملف live واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- اختبار تكلفة Moonshot/Kimi الدخاني: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  بشكل معزول على `moonshot/kimi-k2.6`. تحقق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  transcript الخاص بالمساعد يخزّن `usage.cost` المطبّع.

نصيحة: عندما تحتاج فقط إلى حالة واحدة فاشلة، ففضّل تضييق اختبارات live عبر متغيرات البيئة الخاصة بقائمة السماح الموضحة أدناه.

## مشغلات خاصة بـ QA

تأتي هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية qa-lab:

يشغّل CI مختبر QA في workflows مخصصة. يعمل `Parity gate` على طلبات PR المطابقة
ومن التشغيل اليدوي مع مزوّدات وهمية. ويعمل `QA-Lab - All Lanes` ليليًا على
`main` ومن التشغيل اليدوي مع مسار parity وهمي، ومسار Matrix live، و
مسار Telegram live المدار عبر Convex كمهام متوازية. ويشغّل `OpenClaw Release Checks`
المسارات نفسها قبل اعتماد الإصدار.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة من المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع workers معزولين
    للـ gateway. يستخدم `qa-channel` التزامن 4 افتراضيًا (ومقيّدًا بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد
    workers، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج بقيمة غير صفرية عندما يفشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون قيمة خروج فاشلة.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يقوم `aimock` بتشغيل خادم مزوّد محلي مدعوم بـ AIMock لتغطية
    تجريبية للتركيبات الوهمية والبروتوكول، من دون استبدال مسار `mock-openai`
    المعتمد على السيناريوهات.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل Linux VM مؤقتة عبر Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه الذي يقدمه `qa suite` على المضيف.
  - يعيد استخدام إشارات اختيار المزوّد/النموذج نفسها الخاصة بـ `qa suite`.
  - تمرّر تشغيلات live مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على env، ومسار تهيئة مزوّد QA live، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة المخرجات ضمن جذر المستودع حتى يتمكن الضيف من الكتابة عائدًا عبر
    مساحة العمل المركبة.
  - يكتب تقرير QA العادي + الملخص إضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني npm tarball من النسخة الحالية، ويثبته عالميًا داخل
    Docker، ويشغّل onboarding غير تفاعلي بمفتاح OpenAI API، ويهيئ Telegram
    افتراضيًا، ويتحقق من أن تمكين Plugin يثبت تبعيات التشغيل عند الطلب، ويشغّل doctor،
    ويشغّل دور وكيل محلي واحد على نقطة نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار التثبيت المعبأ نفسه
    مع Discord.
- `pnpm test:docker:bundled-channel-deps`
  - يعبّئ ويثبت البنية الحالية من OpenClaw داخل Docker، ويبدأ Gateway
    مع تهيئة OpenAI، ثم يفعّل القنوات/Plugins المضمنة عبر تعديلات تهيئة.
  - يتحقق من أن اكتشاف الإعداد يترك تبعيات تشغيل Plugin غير المهيأة
    غائبة، وأن أول تشغيل مهيأ للـ Gateway أو doctor يثبت تبعيات تشغيل
    كل Plugin مضمن عند الطلب، وأن إعادة التشغيل الثانية لا تعيد تثبيت التبعيات
    التي تم تفعيلها بالفعل.
  - يثبت أيضًا baseline npm أقدم معروفًا، ويُفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن
    doctor الخاص بالمرشح بعد التحديث يصلح تبعيات تشغيل القنوات المضمنة من دون
    إصلاح postinstall من جهة الحزمة الاختبارية.
- `pnpm openclaw qa aimock`
  - يشغّل فقط خادم المزوّد المحلي AIMock لاختبار البروتوكول الدخاني المباشر.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix QA live مقابل خادم منزلي Tuwunel مؤقت مدعوم بـ Docker.
  - مضيف QA هذا مخصص للمستودع/التطوير فقط حاليًا. لا تحتوي تثبيتات OpenClaw
    المعبأة على `qa-lab`، ولذلك لا تعرض `openclaw qa`.
  - تحمّل نسخ المستودع runner المضمن مباشرة؛ ولا حاجة إلى خطوة
    تثبيت Plugin منفصلة.
  - يوفّر ثلاثة مستخدمين مؤقتين في Matrix (`driver` و`sut` و`observer`) إضافة إلى غرفة خاصة واحدة، ثم يبدأ child gateway خاص بـ QA مع Plugin الحقيقي لـ Matrix كوسيلة نقل SUT.
  - يستخدم صورة Tuwunel الثابتة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يكشف Matrix عن إشارات مصدر بيانات الاعتماد المشتركة لأن المسار يوفّر مستخدمين مؤقتين محليًا.
  - يكتب تقرير Matrix QA، والملخص، وartifact الأحداث المرصودة، وسجل المخرجات الموحّد stdout/stderr تحت `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA live مقابل مجموعة خاصة حقيقية باستخدام tokens الروبوت الخاصة بـ driver وSUT من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات اعتماد مشتركة مجمّعة. استخدم وضع env افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` لتفعيل عقود الإيجار المجمعة.
  - يخرج بقيمة غير صفرية عندما يفشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون قيمة خروج فاشلة.
  - يتطلب روبوتين مختلفين في المجموعة الخاصة نفسها، مع كشف اسم مستخدم Telegram لروبوت SUT.
  - للحصول على مراقبة مستقرة من روبوت إلى روبوت، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا الروبوتين وتأكد من أن روبوت driver يستطيع مراقبة حركة الروبوتات في المجموعة.
  - يكتب تقرير Telegram QA، والملخص، وartifact الرسائل المرصودة تحت `.artifacts/qa-e2e/...`.

تشترك مسارات النقل الحية في عقد قياسي واحد حتى لا تنحرف وسائل النقل الجديدة:

يبقى `qa-channel` مجموعة QA تركيبية واسعة وليس جزءًا من مصفوفة تغطية
النقل الحي.

| المسار | Canary | بوابة الذكر | حظر قائمة السماح | رد المستوى الأعلى | الاستئناف بعد إعادة التشغيل | متابعة سلسلة الرسائل | عزل سلسلة الرسائل | مراقبة التفاعل | أمر help |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، يحصل مختبر QA على عقد إيجار حصري من مجمع مدعوم بـ Convex، ويرسل Heartbeat
لذلك العقد أثناء تشغيل المسار، ويحرر العقد عند الإيقاف.

الهيكل المرجعي لمشروع Convex:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (مثل `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` للدور `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` للدور `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - افتراضي env: `OPENCLAW_QA_CREDENTIAL_ROLE` (الافتراضي `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex من نوع `http://` على loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البروتوكول `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرف (إضافة/إزالة/سرد المجمع)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

أدوات CLI المساعدة للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` للحصول على مخرجات قابلة للقراءة آليًا في السكربتات وأدوات CI.

عقد نقاط النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - النفاد/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغة)
- `POST /release`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغة)
- `POST /admin/add` (سر المشرف فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` (سر المشرف فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حارس عقد الإيجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر المشرف فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولة غير الصحيحة.

### إضافة قناة إلى QA

تتطلب إضافة قناة إلى نظام QA المعتمد على Markdown أمرين فقط بالضبط:

1. محوّل نقل للقناة.
2. حزمة سيناريوهات تمارس عقد القناة.

لا تضف جذر أمر QA جديدًا في المستوى الأعلى عندما يكون بإمكان المضيف المشترك `qa-lab`
امتلاك التدفق.

يمتلك `qa-lab` الآليات المشتركة للمضيف:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- تزامن workers
- كتابة artifacts
- توليد التقارير
- تنفيذ السيناريوهات
- أسماء مستعارة للتوافق مع سيناريوهات `qa-channel` الأقدم

تمتلك Plugins الخاصة بالمشغّل عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت جذر `qa` المشترك
- كيفية تهيئة gateway لذلك النقل
- كيفية فحص الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية مراقبة الرسائل الصادرة
- كيفية كشف transcripts وحالة النقل المطبعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة التعيين أو التنظيف الخاصة بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. الإبقاء على `qa-lab` كمالك لجذر `qa` المشترك.
2. تنفيذ runner الخاص بالنقل على نقطة الوصل المضيفة المشتركة `qa-lab`.
3. إبقاء الآليات الخاصة بالنقل داخل Plugin الخاصة بالrunner أو حزمة channel harness.
4. تركيب runner على شكل `openclaw qa <runner>` بدلًا من تسجيل جذر أمر منافس.
   يجب أن تعلن Plugins الخاصة بالrunner عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   اجعل `runtime-api.ts` خفيفًا؛ ويجب أن يبقى تنفيذ CLI وrunner الكسول خلف نقاط دخول منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown تحت أدلة `qa/scenarios/` ذات الطابع المناسب.
6. استخدام أدوات السيناريو العامة المساعدة للسيناريوهات الجديدة.
7. الإبقاء على الأسماء المستعارة الحالية للتوافق عاملة ما لم يكن المستودع ينفّذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة داخل `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه داخل Plugin الخاصة بذلك runner أو داخل plugin harness.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن أن تستخدمها أكثر من قناة واحدة، فأضف أداة مساعدة عامة بدلًا من فرع خاص بقناة داخل `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بذلك النقل ووضّح ذلك صراحةً في عقد السيناريو.

أسماء الأدوات العامة المفضلة للسيناريوهات الجديدة هي:

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

وتظل أسماء التوافق المستعارة متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم الأعمال الجديدة الخاصة بالقنوات أسماء الأدوات العامة.
وتوجد أسماء التوافق المستعارة لتجنب ترحيل شامل دفعة واحدة، وليس كنموذج
لتأليف السيناريوهات الجديدة.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات على أنها "تزايد في الواقعية" (وتزايد في عدم الاستقرار/الكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- التهيئة: عشر تشغيلات shards تسلسلية (`vitest.full-*.config.ts`) على مشاريع Vitest الحالية ذات النطاق المحدد
- الملفات: جرد core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`، واختبارات `ui` الخاصة بـ node والمسموح بها والمشمولة في `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة gateway، والتوجيه، والأدوات، والتحليل، والتهيئة)
  - اختبارات تراجعية حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - يشغّل `pnpm test` غير المستهدف الآن أحد عشر إعداد shard أصغر (`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية واحدة ضخمة لمشروع الجذر الأصلي. وهذا يقلّل ذروة RSS على الأجهزة المحمّلة ويمنع أعمال auto-reply/extension من تجويع المجموعات غير ذات الصلة.
  - لا يزال `pnpm test --watch` يستخدم مخطط المشروع الجذري الأصلي `vitest.config.ts`، لأن حلقة watch متعددة shards غير عملية.
  - يقوم `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` بتوجيه أهداف الملفات/الأدلة الصريحة عبر مسارات محددة أولًا، لذلك فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب تكلفة بدء مشروع الجذر الكامل.
  - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى المسارات المحددة نفسها عندما لا يمس diff إلا ملفات source/test القابلة للتوجيه؛ أما تعديلات config/setup فتظل تعود إلى إعادة تشغيل المشروع الجذري الواسعة.
  - يُعد `pnpm check:changed` بوابة العمل المحلية الذكية المعتادة للأعمال الضيقة. فهو يصنف diff إلى core، واختبارات core، وextensions، واختبارات extension، وapps، وdocs، وبيانات الإصدار الوصفية، وtooling، ثم يشغّل مسارات typecheck/lint/test المطابقة. وتشتمل تغييرات Plugin SDK العامة وعقد Plugins على تحقق extensions لأن extensions تعتمد على تلك العقود الأساسية. وتشغّل زيادات الإصدارات الخاصة ببيانات الإصدار الوصفية فقط فحوصات مستهدفة للإصدار/التهيئة/تبعيات الجذر بدلًا من المجموعة الكاملة، مع حارس يرفض تغييرات الحزم خارج حقل الإصدار الأعلى مستوى.
  - تُوجَّه اختبارات unit الخفيفة الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدات auto-reply، و`plugin-sdk`، وغيرها من المناطق النفعية الخالصة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الحالية.
  - تُطابق أيضًا بعض ملفات مصدر المساعدات المحددة في `plugin-sdk` و`commands` تشغيلات الوضع المتغير مع اختبارات صريحة شقيقة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
  - أصبح لدى `auto-reply` الآن ثلاث حاويات مخصصة: مساعدات core في المستوى الأعلى، واختبارات integration من المستوى الأعلى `reply.*`، وشجرة `src/auto-reply/reply/**`. وهذا يبقي أعمال harness الخاصة بالرد، وهي الأثقل، بعيدًا عن اختبارات الحالة/التجزئة/token الرخيصة.
- ملاحظة runner المدمج:
  - عندما تغيّر مدخلات اكتشاف message-tool أو سياق التشغيل الخاص بـ Compaction،
    فاحتفظ بمستويَي التغطية كليهما.
  - أضف اختبارات تراجعية مركزة للمساعدات عند حدود التوجيه/التطبيع الخالصة.
  - واحتفظ أيضًا بسلامة مجموعات integration الخاصة بالrunner المدمج:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
    و`src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه المجموعات من أن المعرّفات ذات النطاق وسلوك Compaction لا يزالان
    يتدفقان عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تُعد الاختبارات
    الخاصة بالمساعدات وحدها بديلًا كافيًا عن تلك المسارات التكاملية.
- ملاحظة المجمّع:
  - أصبحت تهيئة Vitest الأساسية تستخدم `threads` افتراضيًا.
  - كما تثبّت تهيئة Vitest المشتركة `isolate: false` وتستخدم runner غير المعزول عبر مشاريع الجذر، وإعدادات e2e، وlive.
  - يحتفظ مسار UI الجذري بإعداد `jsdom` وoptimizer الخاص به، لكنه يعمل الآن أيضًا على runner المشترك غير المعزول.
  - يرث كل shard في `pnpm test` القيم الافتراضية نفسها `threads` + `isolate: false` من تهيئة Vitest المشتركة.
  - يضيف الآن launcher المشترك `scripts/run-vitest.mjs` أيضًا الخيار `--no-maglev` افتراضيًا إلى عمليات Node الفرعية الخاصة بـ Vitest لتقليل اهتزازات الترجمة في V8 أثناء التشغيلات المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت تحتاج إلى المقارنة مع سلوك V8 الافتراضي.
- ملاحظة التكرار المحلي السريع:
  - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها diff.
  - يشغّل pre-commit hook الأمر `pnpm check:changed --staged` بعد تنسيق/lint للملفات staged، لذلك لا تتحمل عمليات commit الخاصة بـ core فقط تكلفة اختبارات extension إلا إذا لامست عقودًا عامة تواجه extension. وتبقى عمليات commit الخاصة ببيانات الإصدار الوصفية فقط على مسار الإصدار/التهيئة/تبعيات الجذر المستهدف.
  - إذا تم بالفعل التحقق من مجموعة التغييرات staged نفسها ببوابات مساوية أو أقوى، فاستخدم `scripts/committer --fast "<message>" <files...>` لتخطي إعادة تشغيل hook الخاصة بالنطاق المتغير فقط. ولا يزال تنسيق/lint للملفات staged يعملان. اذكر البوابات المكتملة في التسليم. ويُقبل هذا أيضًا بعد إعادة تشغيل إخفاق hook متذبذب معزول ونجاحه مع دليل محدد النطاق.
  - يوجّه `pnpm test:changed` عبر مسارات محددة عندما تُطابق المسارات المتغيرة مجموعة أصغر بشكل نظيف.
  - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه نفسه، ولكن مع حد أعلى أكبر للعمال.
  - أصبح التوسيع التلقائي المحلي للعمال محافظًا عمدًا الآن، كما أنه يتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تتسبب التشغيلات المتزامنة المتعددة لـ Vitest بضرر أقل افتراضيًا.
  - تضع تهيئة Vitest الأساسية ملفات المشاريع/التهيئة كـ `forceRerunTriggers` حتى تبقى إعادة التشغيل في الوضع المتغير صحيحة عندما تتغير أسلاك الاختبار.
  - تحتفظ التهيئة بتمكين `OPENCLAW_VITEST_FS_MODULE_CACHE` على المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت موقع cache صريحًا واحدًا لأغراض profiling المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد الخاصة بـ Vitest بالإضافة إلى مخرجات تفصيل الاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض profiling نفسه على الملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه وبين مسار المشروع الجذري الأصلي لذلك diff الملتزم ويطبع زمن الجدار إضافة إلى أعلى RSS على macOS.
- يقيّم `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية عبر توجيه قائمة الملفات المتغيرة من خلال `scripts/test-projects.mjs` وتهيئة Vitest الجذرية.
  - يكتب `pnpm test:perf:profile:main` ملف CPU profile للخيط الرئيسي لتكلفة بدء Vitest/Vite والتحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات CPU+heap profile للـ runner لمجموعة unit مع تعطيل توازي الملفات.

### الاستقرار (gateway)

- الأمر: `pnpm test:stability:gateway`
- التهيئة: `vitest.gateway.config.ts`، مع فرض عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا على loopback مع تمكين التشخيصات افتراضيًا
  - يوجّه رسائل gateway تركيبية، وmemory، واهتزاز الحمولات الكبيرة عبر مسار الحدث التشخيصي
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات حفظ حزمة استقرار التشخيص
  - يؤكد أن المسجّل يبقى ضمن الحدود، وأن عينات RSS التركيبية تبقى تحت ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تعود إلى الصفر
- التوقعات:
  - آمن لـ CI ومن دون مفاتيح
  - مسار ضيق لمتابعة تراجعات الاستقرار، وليس بديلًا عن مجموعة Gateway الكاملة

### E2E (اختبار دخاني لـ gateway)

- الأمر: `pnpm test:e2e`
- التهيئة: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E الخاصة بـ Plugin المضمنة تحت `extensions/`
- القيم الافتراضية لوقت التشغيل:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة I/O في الطرفية.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين مخرجات الطرفية التفصيلية.
- النطاق:
  - سلوك gateway طرفي كامل متعدد المثيلات
  - أسطح WebSocket/HTTP، وإقران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: اختبار دخاني للخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ OpenShell gateway معزولًا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمارس الخلفية OpenShell الخاصة بـ OpenClaw عبر `sandbox ssh-config` + تنفيذ SSH حقيقي
  - يتحقق من سلوك نظام الملفات canonical البعيد عبر جسر نظام ملفات sandbox
- التوقعات:
  - تفعيل اختياري فقط؛ وليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` إضافة إلى Docker daemon يعمل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر gateway وsandbox الخاصين بالاختبار
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ثنائي CLI غير افتراضي أو سكربت wrapper

### Live (مزوّدات حقيقية + نماذج حقيقية)

- الأمر: `pnpm test:live`
- التهيئة: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات live الخاصة بـ Plugin المضمنة تحت `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغيّرات تنسيق المزوّد، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر لـ CI بطبيعته (شبكات حقيقية، وسياسات مزوّد حقيقية، وحصص، وانقطاعات)
  - يكلف مالًا / يستهلك حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية ضيقة بدلًا من "كل شيء"
- تستورد تشغيلات live الملف `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضيًا، تظل تشغيلات live تعزل `HOME` وتنسخ مواد التهيئة/المصادقة إلى home مؤقت للاختبار بحيث لا تتمكن fixtures الخاصة بـ unit من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم اختبارات live دليل home الحقيقي لديك.
- أصبح `pnpm test:live` يستخدم الآن افتراضيًا وضعًا أكثر هدوءًا: فهو يحتفظ بمخرجات التقدم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات bootstrap الخاصة بـ gateway وضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API (خاص بكل مزوّد): اضبط `*_API_KEYS` بصيغة فاصلة/فاصلة منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو استخدم تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ وتعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدم/Heartbeat:
  - تصدر مجموعات live الآن أسطر التقدم إلى stderr بحيث تظهر استدعاءات المزوّد الطويلة على أنها نشطة بوضوح حتى عندما يكون التقاط طرفية Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض طرفية Vitest بحيث تتدفق أسطر تقدم المزوّد/الـ gateway فورًا أثناء تشغيلات live.
  - اضبط Heartbeat الخاص بالنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاص بالـ gateway/probe باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّلها؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت كثيرًا)
- لمس شبكات gateway / بروتوكول WS / الإقران: أضف `pnpm test:e2e`
- تصحيح "الروبوت متوقف" / الإخفاقات الخاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` بشكل مقيّد

## Live: مسح قدرات Android node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر يتم الإعلان عنه حاليًا** بواسطة Android node متصل والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعدادات مسبقة/يدوية (لا تقوم المجموعة بتثبيت/تشغيل/إقران التطبيق).
  - تحقق `node.invoke` على مستوى gateway أمرًا بأمر لـ Android node المحدد.
- الإعداد المسبق المطلوب:
  - أن يكون تطبيق Android متصلًا ومقترنًا بالفعل بالـ gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/الموافقة على الالتقاط للقدرات التي تتوقع أن تنجح.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: اختبار دخاني للنموذج (مفاتيح profile)

تنقسم اختبارات live إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- "Direct model" يخبرنا ما إذا كان المزوّد/النموذج قادرًا على الإجابة أصلًا بالمفتاح المعطى.
- "Gateway smoke" يخبرنا ما إذا كان خط أنابيب gateway+agent الكامل يعمل لهذا النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال مباشر للنموذج (من دون gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي تملك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات تراجعية مستهدفة عند الحاجة)
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم مستعار لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها لإبقاء `pnpm test:live` مركزًا على gateway smoke
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all افتراضيًا حدًا منتقى عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدات:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: من مخزن profile والرجوع إلى env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن profile** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح" و"خط أنابيب gateway agent معطل"
  - يحتوي اختبارات تراجعية صغيرة ومعزولة (مثال: تدفقات replay الخاصة بالتفكير في OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: اختبار دخاني لـ Gateway + وكيل dev (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل gateway داخل العملية
  - إنشاء/تصحيح جلسة `agent:dev:*` (مع تجاوز النموذج لكل تشغيل)
  - تكرار النماذج التي لديها مفاتيح والتحقق من:
    - استجابة "ذات معنى" (من دون أدوات)
    - أن استدعاء أداة حقيقي يعمل (read probe)
    - probes إضافية اختيارية للأدوات (exec+read probe)
    - أن مسارات OpenAI التراجعية (tool-call-only → follow-up) ما تزال تعمل
- تفاصيل probe (حتى يمكنك شرح الإخفاقات بسرعة):
  - `read` probe: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له ثم إعادة nonce.
  - `exec+read` probe: يطلب الاختبار من الوكيل أن يكتب nonce عبر `exec` في ملف مؤقت، ثم يقرأه مرة أخرى.
  - image probe: يرفق الاختبار PNG مُولّدًا (قطة + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات المسح modern/all الخاصة بالـ gateway افتراضيًا حدًا منتقى عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدات (لتجنّب "OpenRouter لكل شيء"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون probes الأدوات + الصور مفعّلة دائمًا في هذا الاختبار live:
  - `read` probe + `exec+read` probe (ضغط على الأدوات)
  - يعمل image probe عندما يعلن النموذج دعمه لإدخال الصور
  - التدفق (عالي المستوى):
    - يولّد الاختبار PNG صغيرًا يحتوي على "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` باستخدام `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المدمج رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (مع سماحية OCR: أخطاء طفيفة مسموح بها)

نصيحة: لرؤية ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: اختبار دخاني لخلفية CLI (Claude أو Codex أو Gemini أو غيرها من CLIs المحلية)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط أنابيب Gateway + agent باستخدام خلفية CLI محلية، من دون لمس تهيئتك الافتراضية.
- توجد القيم الافتراضية الخاصة بالاختبار الدخاني لكل خلفية مع تعريف `cli-backend.ts` الخاص بالـ extension المالكة.
- التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- القيم الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصور من بيانات Plugin الخاصة بالخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عندما يتم ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل probe الافتراضي الخاص باستمرارية الجلسة نفسها من Claude Sonnet إلى Opus (اضبطه إلى `1` لفرض تشغيله عندما يدعم النموذج المحدد هدف تبديل).

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

وصفات Docker لمزوّد واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد Docker runner في `scripts/test-live-cli-backend-docker.sh`.
- وهو يشغّل الاختبار الدخاني لخلفية CLI الحية داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- ويحل بيانات الاختبار الدخاني الخاصة بـ CLI من الـ extension المالكة، ثم يثبت حزمة CLI المطابقة على Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth المحمولة لاشتراك Claude Code عبر إما `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. وهو يثبت أولًا نجاح `claude -p` مباشرة داخل Docker، ثم يشغّل دورين لخلفية Gateway CLI من دون الحفاظ على متغيرات env الخاصة بمفتاح Anthropic API. يعطّل مسار الاشتراك هذا probes أداة/صورة Claude MCP افتراضيًا لأن Claude يوجّه حاليًا استخدامات التطبيقات الخارجية عبر فوترة الاستخدام الإضافي بدل حدود خطة الاشتراك العادية.
- يمارس الاختبار الدخاني لخلفية CLI الحية الآن التدفق الطرفي الكامل نفسه لـ Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة `cron` الخاصة بـ MCP يتم التحقق منه عبر gateway CLI.
- كما يقوم الاختبار الافتراضي لـ Claude بتصحيح الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما تزال تتذكر ملاحظة سابقة.

## Live: اختبار دخاني لـ ACP bind (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثات ACP الحقيقي باستخدام وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة synthetic message-channel في مكانها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من أن المتابعة تصل إلى transcript جلسة ACP المرتبطة
- التمكين:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- القيم الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP لتشغيل `pnpm test:live ...` المباشر: `claude`
  - القناة التركيبية: سياق محادثة بأسلوب الرسائل المباشرة في Slack
  - خلفية ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- ملاحظات:
  - يستخدم هذا المسار سطح `chat.send` في gateway مع حقول originating-route تركيبية خاصة بالمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق message-channel من دون الادعاء بأنها تسلّم خارجيًا.
  - عندما تكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` غير مضبوطة، يستخدم الاختبار سجل الوكلاء المدمج الخاص بـ Plugin `acpx` المضمّن من أجل وكيل ACP harness المحدد.

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

- يوجد Docker runner في `scripts/test-live-acp-bind-docker.sh`.
- افتراضيًا، يشغّل اختبار ACP bind الدخاني مقابل جميع وكلاء CLI الحية المدعومة بالتتابع: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يستورد `~/.profile`، ويحضّر مواد مصادقة CLI المطابقة داخل الحاوية، ويثبت `acpx` في بادئة npm قابلة للكتابة، ثم يثبت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان مفقودًا.
- داخل Docker، يضبط runner القيمة `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` بحيث يبقي acpx متغيرات env الخاصة بالمزوّد من profile المستوردة متاحة لـ harness CLI الابن.

## Live: اختبار دخاني لـ Codex app-server harness

- الهدف: التحقق من harness الخاصة بـ Codex والمملوكة لـ Plugin عبر
  الطريقة العادية `agent` في gateway:
  - تحميل Plugin المضمنة `codex`
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دور وكيل في gateway إلى `codex/gpt-5.4`
  - إرسال دور ثانٍ إلى جلسة OpenClaw نفسها والتحقق من أن سلسلة
    app-server يمكنها الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر
    gateway نفسه
  - تشغيل اختياري لـ probes تصعيد shell مراجَعة من Guardian: أمر
    غير ضار يجب الموافقة عليه، وأمر رفع سر زائف يجب رفضه
    بحيث يطلب الوكيل ردًا
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التمكين: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- probe صور اختيارية: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe MCP/tool اختيارية: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe Guardian اختيارية: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يضبط الاختبار الدخاني القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا يتمكن
  harness معطّل لـ Codex من النجاح عبر الرجوع الصامت إلى PI.
- المصادقة: `OPENAI_API_KEY` من shell/profile، إضافة إلى نسخ اختيارية من
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

- يوجد Docker runner في `scripts/test-live-codex-harness-docker.sh`.
- يستورد `~/.profile` المركب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبت `@openai/codex` في بادئة npm مركبة قابلة للكتابة،
  ويحضّر شجرة المصدر، ثم يشغّل فقط اختبار Codex-harness الحي.
- يفعّل Docker probes الصور وMCP/tool وGuardian افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل
  تضييقٍ تصحيحي أكثر.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق تهيئة
  الاختبار الحي بحيث لا يتمكن fallback إلى `openai-codex/*` أو PI من إخفاء
  تراجع في Codex harness.

### وصفات live الموصى بها

تُعد قوائم السماح الضيقة والصريحة الأسرع والأقل عرضة للتذبذب:

- نموذج واحد، مباشر (من دون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار دخاني لـ gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدات:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة وخصائص أدوات مختلفة).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (بمصادقة مفتاح API / profile)؛ وهذا ما يقصده معظم المستخدمين بكلمة "Gemini".
  - CLI: ينفّذ OpenClaw shell إلى ثنائي `gemini` محلي؛ وله مصادقة خاصة به وقد يتصرف بشكل مختلف (دعم البث/الأدوات/اختلاف الإصدار).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (لأن live خيار تفعيله يدوي)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير يملك مفاتيح.

### مجموعة الاختبار الدخاني الحديثة (استدعاء الأدوات + الصور)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع أن يظل يعمل:

- OpenAI (غير Codex): `openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنّب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل اختبار gateway الدخاني مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة مزوّد:

- OpenAI: `openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد وجودها):

- xAI: `xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا قادرًا على `tools` ومفعّلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ دعم استدعاء الأدوات يعتمد على وضع API)

### الرؤية: إرسال الصور (مرفق ← رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (أشكال Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لممارسة image probe.

### المجمّعات / بوابات بديلة

إذا كانت لديك مفاتيح مفعّلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

المزيد من المزوّدات التي يمكنك تضمينها في مصفوفة live (إذا كانت لديك بيانات اعتماد/تهيئة):

- مضمّنة: `openai` و`openai-codex` و`anthropic` و`google` و`google-vertex` و`google-antigravity` و`google-gemini-cli` و`zai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`groq` و`cerebras` و`mistral` و`github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، إضافة إلى أي proxy متوافق مع OpenAI/Anthropic (مثل LM Studio وvLLM وLiteLLM وغيرها)

نصيحة: لا تحاول تثبيت "كل النماذج" بشكل hardcode في الوثائق. فالقائمة المرجعية المعتمدة هي كل ما يعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تقم بتثبيتها في Git أبدًا)

تكتشف اختبارات live بيانات الاعتماد بالطريقة نفسها التي يعمل بها CLI. والنتائج العملية:

- إذا كان CLI يعمل، فيجب أن تعثر اختبارات live على المفاتيح نفسها.
- إذا قال اختبار live "لا توجد بيانات اعتماد"، فقم بالتصحيح بالطريقة نفسها التي ستتبعها مع `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (وهذا ما تعنيه "profile keys" في اختبارات live)
- التهيئة: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى home الحي المجهز عند وجوده، لكنه ليس مخزن profile-key الرئيسي)
- تقوم تشغيلات live المحلية بنسخ التهيئة النشطة، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى home مؤقت للاختبار افتراضيًا؛ وتتخطى homes الحية المجهزة `workspace/` و`sandboxes/`، كما تُزال تجاوزات المسار `agents.*.workspace` / `agentDir` حتى تبقى probes بعيدة عن مساحة العمل الحقيقية على مضيفك.

إذا كنت تريد الاعتماد على مفاتيح env (مثل المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram live (نسخ الصوت)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التمكين: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- الاختبار: `extensions/byteplus/live.test.ts`
- التمكين: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز نموذج اختياري: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يمارس المسارات المضمنة الخاصة بالصور والفيديو و`music_generate` في comfy
  - يتخطى كل قدرة ما لم يكن `models.providers.comfy.<capability>` مهيأ
  - مفيد بعد تغيير إرسال workflow في comfy، أو polling، أو التنزيلات، أو تسجيل Plugin

## Image generation live

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحزمة الاختبارية: `pnpm test:live:media image`
- النطاق:
  - يعدّد كل Plugins مزوّدات توليد الصور المسجلة
  - يحمّل متغيرات env المفقودة الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل probe
  - يستخدم مفاتيح API الحية/من env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدات التي لا تملك مصادقة/ملف تعريف/نموذجًا صالحًا للاستخدام
  - يشغّل متغيرات توليد الصور القياسية عبر قدرة التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- المزوّدات المضمنة الحالية المغطاة:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل التجاوزات المعتمدة على env فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحزمة الاختبارية: `pnpm test:live:media music`
- النطاق:
  - يمارس المسار المشترك المضمن لمزوّدات توليد الموسيقى
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات env الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل probe
  - يستخدم مفاتيح API الحية/من env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدات التي لا تملك مصادقة/ملف تعريف/نموذجًا صالحًا للاستخدام
  - يشغّل كلا وضعي التشغيل المعلنين عندما يكونان متاحين:
    - `generate` مع إدخال prompt فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية في المسار المشترك:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy live منفصل، وليس ضمن هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل التجاوزات المعتمدة على env فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحزمة الاختبارية: `pnpm test:live:media video`
- النطاق:
  - يمارس المسار المشترك المضمن لمزوّدات توليد الفيديو
  - يستخدم افتراضيًا مسار الاختبار الدخاني الآمن للإصدار: مزوّدات غير FAL، وطلب text-to-video واحد لكل مزوّد، وprompt lobster بطول ثانية واحدة، وسقف عمليات لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (الافتراضي `180000`)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الطوابير من جهة المزوّد قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات env الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل probe
  - يستخدم مفاتيح API الحية/من env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدات التي لا تملك مصادقة/ملف تعريف/نموذجًا صالحًا للاستخدام
  - يشغّل فقط `generate` افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع transform المعلنة أيضًا عند التوفر:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الصور المحلية المدعوم بالمخزن المؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الفيديو المحلي المدعوم بالمخزن المؤقت في المسح المشترك
  - مزوّدو `imageToVideo` المعلنون حاليًا لكن المتخطون في المسح المشترك:
    - `vydra` لأن `veo3` المضمن نصي فقط و`kling` المضمن يتطلب عنوان URL لصورة بعيدة
  - تغطية Vydra الخاصة بكل مزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف مسار `veo3` text-to-video بالإضافة إلى مسار `kling` يستخدم fixture لعنوان URL صورة بعيدة افتراضيًا
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزوّدو `videoToVideo` المعلنون حاليًا لكن المتخطون في المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بالمخزن المؤقت وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لفيديو inpaint/remix
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل سقف عمليات كل مزوّد من أجل تشغيل دخاني شديد الاختصار
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل التجاوزات المعتمدة على env فقط

## الحزمة الاختبارية Media live

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول واحدة أصلية للمستودع
  - يحمّل تلقائيًا متغيرات env المفقودة للمزوّد من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة إلى المزوّدات التي لديها حاليًا مصادقة قابلة للاستخدام افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغلات Docker (اختيارية لفحوصات "تعمل على Linux")

تنقسم مشغلات Docker هذه إلى فئتين:

- مشغلات النماذج الحية: `test:docker:live-models` و`test:docker:live-gateway` تشغّل فقط ملف live المطابق لمفاتيح profile داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل التهيئة المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا تم تركيبه). ونقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker الحية افتراضيًا حدًا أصغر للاختبار الدخاني حتى يبقى المسح الكامل في Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحةً تشغيل المسح الأكبر والشامل.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين. كما يبني صورة مشتركة واحدة `scripts/e2e/Dockerfile` عبر `test:docker:e2e-build` ويعيد استخدامها لمشغلات الاختبار الدخاني للحاويات الخاصة بـ E2E التي تمارس التطبيق المبني.
- مشغلات الاختبار الدخاني للحاويات: `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:pi-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:config-reload` تشغّل حاوية أو أكثر حقيقية وتتحقق من مسارات تكامل أعلى مستوى.

كما تقوم مشغلات Docker الخاصة بالنماذج الحية بتركيب homes الخاصة بمصادقة CLI المطلوبة فقط (أو جميع المدعومة عندما لا يكون التشغيل مقيّدًا)، ثم تنسخها إلى home الحاوية قبل التشغيل حتى تتمكن OAuth الخاصة بـ CLI الخارجية من تحديث tokens من دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكريبت: `scripts/test-live-models-docker.sh`)
- اختبار ACP bind الدخاني: `pnpm test:docker:live-acp-bind` (السكريبت: `scripts/test-live-acp-bind-docker.sh`)
- اختبار CLI backend الدخاني: `pnpm test:docker:live-cli-backend` (السكريبت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار Codex app-server harness الدخاني: `pnpm test:docker:live-codex-harness` (السكريبت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل dev: `pnpm test:docker:live-gateway` (السكريبت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار Open WebUI الحي الدخاني: `pnpm test:docker:openwebui` (السكريبت: `scripts/e2e/openwebui-docker.sh`)
- معالج onboarding (TTY، إعداد كامل): `pnpm test:docker:onboard` (السكريبت: `scripts/e2e/onboard-docker.sh`)
- اختبار npm tarball onboarding/channel/agent الدخاني: يقوم `pnpm test:docker:npm-onboard-channel-agent` بتثبيت OpenClaw tarball المعبّأ عالميًا داخل Docker، ويهيئ OpenAI عبر onboarding مرجعي لـ env بالإضافة إلى Telegram افتراضيًا، ويتحقق من أن تمكين Plugin يثبت تبعيات التشغيل الخاصة بها عند الطلب، ويشغّل doctor، ثم يشغّل دور وكيل واحدًا وهميًا لـ OpenAI. أعد استخدام tarball مبني مسبقًا باستخدام `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة البناء على المضيف باستخدام `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة باستخدام `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- شبكات Gateway (حاويتان، مصادقة WS + health): `pnpm test:docker:gateway-network` (السكريبت: `scripts/e2e/gateway-network-docker.sh`)
- اختبار OpenAI Responses web_search الأدنى مع reasoning التراجعي: `pnpm test:docker:openai-web-search-minimal` (السكريبت: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغّل خادم OpenAI وهميًا عبر Gateway، ويتحقق من أن `web_search` يرفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض schema من المزوّد ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر قنوات MCP (Gateway مهيأ مسبقًا + جسر stdio + اختبار Claude notification-frame خام): `pnpm test:docker:mcp-channels` (السكريبت: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات Pi bundle MCP (خادم MCP حقيقي عبر stdio + اختبار السماح/المنع لملف Pi المدمج): `pnpm test:docker:pi-bundle-mcp-tools` (السكريبت: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/subagent MCP (Gateway حقيقي + إيقاف stdio MCP child بعد cron معزول وتشغيل subagent لمرة واحدة): `pnpm test:docker:cron-mcp-cleanup` (السكريبت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (اختبار تثبيت دخاني + الاسم المستعار `/plugin` + دلالات إعادة تشغيل Claude-bundle): `pnpm test:docker:plugins` (السكريبت: `scripts/e2e/plugins-docker.sh`)
- اختبار plugin update غير المتغير: `pnpm test:docker:plugin-update` (السكريبت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار config reload metadata الدخاني: `pnpm test:docker:config-reload` (السكريبت: `scripts/e2e/config-reload-source-docker.sh`)
- تبعيات تشغيل Plugin المضمنة: يقوم `pnpm test:docker:bundled-channel-deps` ببناء صورة Docker runner صغيرة افتراضيًا، ويبني ويعبّئ OpenClaw مرة واحدة على المضيف، ثم يركّب ذلك tarball في كل سيناريو تثبيت على Linux. أعد استخدام الصورة باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1`، أو تخطَّ إعادة البناء على المضيف بعد build محلي حديث باستخدام `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`، أو أشر إلى tarball موجود باستخدام `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- ضيّق تبعيات تشغيل Plugin المضمنة أثناء التكرار بتعطيل السيناريوهات غير ذات الصلة، مثل:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

لبناء صورة التطبيق المبني المشتركة مسبقًا وإعادة استخدامها يدويًا:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

تظل تجاوزات الصور الخاصة بكل مجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` هي المتقدمة عند ضبطها. وعندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تقوم السكربتات بسحبها إذا لم تكن موجودة محليًا بالفعل. وتحتفظ اختبارات QR والمثبّت في Docker بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزم/التثبيت بدلًا من runtime التطبيق المبني المشترك.

كما تقوم مشغلات Docker الخاصة بالنماذج الحية أيضًا بتركيب النسخة الحالية من المستودع للقراءة فقط
وتحضيرها إلى workdir مؤقت داخل الحاوية. وهذا يبقي صورة runtime
خفيفة مع الاستمرار في تشغيل Vitest مقابل المصدر/التهيئة المحليين الدقيقين لديك.
وتتخطى خطوة التحضير caches المحلية الكبيرة فقط ومخرجات build الخاصة بالتطبيق مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` ومجلدات `.build` المحلية للتطبيق أو
مخرجات Gradle حتى لا تقضي تشغيلات Docker live دقائق في نسخ
artifacts خاصة بالجهاز.
كما تضبط أيضًا `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ probes gateway live
عمال القنوات الحقيقية مثل Telegram/Discord وغيرها داخل الحاوية.
ولا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذلك مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استبعاد تغطية gateway
الحية من مسار Docker هذا.
ويُعد `test:docker:openwebui` اختبار توافق دخانيًا أعلى مستوى: فهو يبدأ
حاوية OpenClaw gateway مع تمكين نقاط النهاية HTTP المتوافقة مع OpenAI،
ثم يبدأ حاوية Open WebUI مثبتة مقابل ذلك gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يكشف `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر proxy الخاص بـ Open WebUI على `/api/chat/completions`.
وقد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد البدء البارد الخاص به.
ويتوقع هذا المسار مفتاح نموذج حي قابلًا للاستخدام، ويُعد `OPENCLAW_PROFILE_FILE`
(والافتراضي `~/.profile`) الوسيلة الأساسية لتوفيره في التشغيلات المعبأة بـ Docker.
وتطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
ويُعد `test:docker:mcp-channels` حتميًا عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يشغّل حاوية
Gateway مزروعة، ويبدأ حاوية ثانية تُشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجهة، وقراءة transcripts، وبيانات المرفقات الوصفية،
وسلوك طوابير الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. ويفحص تحقق الإشعارات
إطارات MCP الخام الخاصة بـ stdio مباشرة حتى يثبت الاختبار الدخاني ما
يصدره الجسر فعليًا، وليس فقط ما قد تكشفه SDK لعميل معين.
ويُعد `test:docker:pi-bundle-mcp-tools` حتميًا ولا يحتاج إلى
مفتاح نموذج حي. فهو يبني صورة Docker الخاصة بالمستودع، ويبدأ خادم probe حقيقيًا لـ MCP عبر stdio
داخل الحاوية، ثم يجسّد ذلك الخادم عبر runtime المضمن لـ Pi bundle
MCP، وينفّذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما يقوم `minimal` و`tools.deny: ["bundle-mcp"]` بتصفيتها.
ويُعد `test:docker:cron-mcp-cleanup` حتميًا ولا يحتاج إلى مفتاح نموذج حي.
فهو يبدأ Gateway مزروعًا مع خادم probe حقيقي لـ MCP عبر stdio، ويشغّل
دور cron معزولًا ودورًا تابعًا `/subagents spawn` لمرة واحدة، ثم يتحقق
من أن عملية MCP الابن تخرج بعد كل تشغيل.

اختبار thread smoke بلغة ACP الطبيعية يدويًا (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات العمل الخاصة بالتراجع/التصحيح. فقد يلزم مرة أخرى للتحقق من توجيه ACP thread، لذلك لا تحذفه.

متغيرات env المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) ويُركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) ويُركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) ويُركّب إلى `/home/node/.profile` ويُستورد قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات env فقط المستوردة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة تهيئة/مساحة عمل مؤقتة ومن دون تركيب أي مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) ويُركّب إلى `/home/node/.npm-global` لتخزين تثبيتات CLI مؤقتًا داخل Docker
- تُركّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط ضمن `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تقوم التشغيلات المضيقة على مزوّدات محددة بتركيب الأدلة/الملفات المطلوبة فقط كما يُستدل عليها من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدات داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لإعادة تشغيلات لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن profile (وليس من env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يكشفه gateway لاختبار Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt التحقق من nonce المستخدم في اختبار Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديلات docs: `pnpm check:docs`.
وشغّل التحقق الكامل من روابط Mintlify anchors عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبار تراجعي دون اتصال (آمن لـ CI)

هذه اختبارات تراجعية "لخط الأنابيب الحقيقي" من دون مزوّدات حقيقية:

- استدعاء أدوات Gateway (OpenAI وهمي، مع gateway + حلقة agent حقيقية): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (‏WS `wizard.start`/`wizard.next`، ويكتب config + auth enforced): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمي عبر gateway + حلقة agent حقيقيتين (`src/gateway/gateway.test.ts`).
- تدفقات معالج طرفية كاملة تتحقق من wiring الخاصة بالجلسة وتأثيرات التهيئة (`src/gateway/gateway.test.ts`).

ما الذي لا يزال مفقودًا لـ Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في prompt، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، ونقل سجل الجلسة، وحدود sandbox.

يجب أن تظل التقييمات المستقبلية حتمية أولًا:

- runner للسيناريوهات يستخدم مزوّدات وهمية لتأكيد استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وwiring الخاصة بالجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skill (استخدام مقابل تجنب، والبوابات، وحقن prompt).
- تقييمات live اختيارية (تفعيل يدوي، ومحكومة بـ env) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقد (شكل Plugin وchannel)

تتحقق اختبارات العقد من أن كل Plugin وchannel مسجلين يلتزمان
بعقد الواجهة الخاص بهما. فهي تكرّر على كل Plugins المكتشفة وتشغّل مجموعة من
تأكيدات الشكل والسلوك. ويتخطى مسار unit الافتراضي `pnpm test` عمدًا
هذه الملفات المشتركة الخاصة بالوصلات والاختبارات الدخانية؛ شغّل أوامر العقد صراحةً
عندما تلمس أسطح channel أو provider المشتركة.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدات فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (المعرّف، والاسم، والقدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف thread
- **directory** - واجهة برمجة Directory/roster
- **group-policy** - فرض سياسة المجموعات

### عقود حالة المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - probes حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّدات

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة برمجة كتالوج النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - runtime المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب تشغيلها

- بعد تغيير صادرات أو subpaths الخاصة بـ plugin-sdk
- بعد إضافة Plugin قناة أو مزوّد أو تعديلها
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافها

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات تراجعية (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في live:

- أضف اختبارًا تراجعيًا آمنًا لـ CI إن أمكن (مزوّد وهمي/Stub، أو التقاط تحويل شكل الطلب الدقيق)
- إذا كانت المشكلة بطبيعتها خاصة بـ live فقط (حدود المعدل، وسياسات المصادقة)، فأبقِ اختبار live ضيقًا ومفعّلًا اختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار النماذج المباشرة
  - خطأ في خط أنابيب الجلسة/السجل/الأداة في gateway → اختبار gateway live دخاني أو اختبار gateway mock آمن لـ CI
- حاجز حماية لاجتياز SecretRef:
  - يقوم `src/secrets/exec-secret-ref-id-parity.test.ts` باشتقاق هدف عيّنة واحد لكل فئة SecretRef من بيانات registry الوصفية (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. ويفشل الاختبار عمدًا على معرّفات الأهداف غير المصنفة حتى لا يتم تخطي الفئات الجديدة بصمت.
