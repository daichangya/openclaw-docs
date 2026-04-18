---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح سلوك Gateway + الوكيل
summary: 'مجموعة الاختبار: أجنحة unit/e2e/live، ومشغّلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-18T07:14:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cdd2048ba58e606fd68703977c2b33000abdb1826b6589ce25a35c53468726a
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاثة أجنحة Vitest (unit/integration وe2e وlive) ومجموعة صغيرة من مشغّلات Docker.

هذا المستند هو دليل «كيف نختبر»:

- ما الذي يغطيه كل جناح (وما الذي لا يغطيه عمدًا)
- ما الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، تصحيح الأخطاء)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتحدد النماذج/المزوّدين
- كيفية إضافة اختبارات انحدار لمشكلات النموذج/المزوّد في العالم الحقيقي

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm test`
- تشغيل أسرع كامل الأجنحة محليًا على جهاز ذي موارد جيدة: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف الملفات مباشرة يوجّه الآن أيضًا مسارات الإضافات/القنوات: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكون تعمل على فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بـ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- جناح E2E: `pnpm test:e2e`

عند تصحيح مزوّدين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- الجناح الحي (فحوصات النماذج + Gateway للأدوات/الصور): `pnpm test:live`
- استهدف ملفًا حيًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

نصيحة: عندما تحتاج فقط إلى حالة فاشلة واحدة، ففضّل تضييق الاختبارات الحية عبر متغيرات البيئة allowlist الموصوفة أدناه.

## المشغّلات الخاصة بـ QA

توجد هذه الأوامر بجانب أجنحة الاختبار الرئيسية عندما تحتاج إلى واقعية qa-lab:

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المعتمدة على المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمّال Gateway معزولين، حتى 64 عاملًا أو عدد السيناريوهات المحدد. استخدم `--concurrency <count>` لضبط عدد العمّال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock لتغطية تجريبية للتركيبات الثابتة ومحاكاة البروتوكول دون استبدال مسار `mock-openai` الواعي بالسيناريوهات.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل جناح QA نفسه داخل Linux VM مؤقتة عبر Multipass.
  - يحافظ على سلوك اختيار السيناريو نفسه الذي يقدمه `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار المزوّد/النموذج نفسها التي يستخدمها `qa suite`.
  - التشغيلات الحية تمرّر مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد المعتمدة على env، ومسار إعداد مزوّد QA الحي، و`CODEX_HOME` عند وجوده.
  - يجب أن تبقى أدلة المخرجات ضمن جذر المستودع حتى يتمكن الضيف من الكتابة مرة أخرى عبر مساحة العمل الموصولة.
  - يكتب تقرير QA والملخص المعتادين بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لعمل QA بأسلوب المشغّل.
- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي لاختبار Smoke مباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل خادم Tuwunel منزلي مؤقت ومدعوم بـ Docker.
  - هذا المضيف QA مخصص حاليًا للمستودع/التطوير فقط. تثبيتات OpenClaw المعبأة لا تشحن `qa-lab`، لذلك لا تعرض `openclaw qa`.
  - نسخ المستودع تستخدم المشغّل المضمّن مباشرة؛ لا حاجة إلى خطوة تثبيت Plugin منفصلة.
  - يوفّر ثلاثة مستخدمين مؤقتين لـ Matrix (`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ عملية فرعية لـ QA gateway مع Plugin Matrix الحقيقي باعتباره نقل SUT.
  - يستخدم صورة Tuwunel المستقرة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. استبدلها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يوفّر Matrix علامات مشتركة لمصادر بيانات الاعتماد لأن المسار يوفّر مستخدمين مؤقتين محليًا.
  - يكتب تقرير QA لـ Matrix، والملخص، وartifact للأحداث المرصودة، وسجل مخرجات stdout/stderr المدمج تحت `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام رمزي bot الخاصين بـ driver وSUT من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع env افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في التأجير المجمّع.
  - يتطلب botين مختلفين في المجموعة الخاصة نفسها، مع قيام bot الخاص بـ SUT بعرض اسم مستخدم Telegram.
  - للحصول على مراقبة مستقرة بين bot وآخر، فعّل وضع Bot-to-Bot Communication Mode في `@BotFather` لكلا botين وتأكد من أن bot الخاص بـ driver يستطيع مراقبة حركة bot في المجموعة.
  - يكتب تقرير QA لـ Telegram، والملخص، وartifact للرسائل المرصودة تحت `.artifacts/qa-e2e/...`.

تتشارك مسارات النقل الحية عقدًا قياسيًا واحدًا حتى لا تنحرف وسائل النقل الجديدة:

يبقى `qa-channel` جناح QA التركيبي الواسع وليس جزءًا من مصفوفة تغطية
النقل الحي.

| المسار | Canary | تقييد الإشارة | حظر allowlist | الرد الأعلى مستوى | الاستئناف بعد إعادة التشغيل | متابعة الخيط | عزل الخيط | مراقبة التفاعل | أمر المساعدة |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex (v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لأمر
`openclaw qa telegram`، يحصل QA lab على تأجير حصري من تجمّع مدعوم بـ Convex، ويرسل Heartbeat
لهذا التأجير أثناء تشغيل المسار، ويطلق التأجير عند الإيقاف.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` من أجل `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` من أجل `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - env الافتراضي: `OPENCLAW_QA_CREDENTIAL_ROLE` (الافتراضي هو `maintainer`)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` يسمح بعناوين Convex من نوع `http://` على loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` الصيغة `https://` في التشغيل العادي.

أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/عرض التجمّع) تتطلب
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

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
  - الاستنفاد/القابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغة)
- `POST /release`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - النجاح: `{ status: "ok" }` (أو `2xx` فارغة)
- `POST /admin/add` (سر maintainer فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` (سر maintainer فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حماية التأجير النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر maintainer فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة معرّف دردشة Telegram رقمي.
- يتحقق `admin/add` من هذا الشكل عند `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

إضافة قناة إلى نظام QA المعتمد على Markdown تتطلب أمرين فقط بالضبط:

1. مكيّف نقل للقناة.
2. حزمة سيناريوهات تمارس عقد القناة.

لا تضف جذر أوامر QA جديدًا على المستوى الأعلى عندما يكون بإمكان المضيف المشترك `qa-lab`
امتلاك هذا التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء الجناح وإنهاؤه
- توازي العمّال
- كتابة الـ artifacts
- إنشاء التقارير
- تنفيذ السيناريوهات
- أسماء التوافق البديلة لسيناريوهات `qa-channel` الأقدم

تمتلك إضافات المشغّل عقد النقل:

- كيف يتم تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيف تتم تهيئة Gateway من أجل هذا النقل
- كيف يتم التحقق من الجاهزية
- كيف يتم حقن الأحداث الواردة
- كيف تتم مراقبة الرسائل الصادرة
- كيف يتم عرض النصوص المنسوخة transcript وحالة النقل المطبّعة
- كيف يتم تنفيذ الإجراءات المدعومة بالنقل
- كيف تتم معالجة إعادة الضبط أو التنظيف الخاصة بالنقل

الحد الأدنى المطلوب لاعتماد قناة جديدة هو:

1. إبقاء `qa-lab` مالكًا للجذر المشترك `qa`.
2. تنفيذ مشغّل النقل على واجهة المضيف المشتركة `qa-lab`.
3. إبقاء الآليات الخاصة بالنقل داخل Plugin المشغّل أو حزمة القناة.
4. تركيب المشغّل على هيئة `openclaw qa <runner>` بدلًا من تسجيل أمر جذر منافس.
   يجب أن تعلن إضافات المشغّل عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   اجعل `runtime-api.ts` خفيفًا؛ يجب أن يبقى تنفيذ CLI والمشغّل الكسول خلف نقاط دخول منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown تحت أدلة `qa/scenarios/` الموضوعية.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. إبقاء أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع ينفّذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه في Plugin المشغّل أو حزمة Plugin تلك.
- إذا كان السيناريو يحتاج إلى قدرة جديدة يمكن أن تستخدمها أكثر من قناة واحدة، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة داخل `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بذلك النقل وصرّح بذلك بوضوح في عقد السيناريو.

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

تبقى أسماء التوافق البديلة متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم الأعمال الجديدة الخاصة بالقنوات أسماء المساعدات العامة.
توجد أسماء التوافق البديلة لتجنب ترحيل شامل في يوم واحد، لا لتكون النموذج
لتأليف السيناريوهات الجديدة.

## أجنحة الاختبار (ما الذي يعمل وأين)

اعتبر الأجنحة على أنها «زيادة في الواقعية» (وزيادة في عدم الاستقرار/التكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: عشر تشغيلات shard متسلسلة (`vitest.full-*.config.ts`) عبر مشاريع Vitest المحددة الحالية
- الملفات: مخزونات core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts` واختبارات node المدرجة ضمن allowlist في `ui` والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات تكامل داخل العملية (مصادقة gateway، التوجيه، الأدوات، التحليل، الإعداد)
  - اختبارات انحدار حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة حول المشاريع:
  - أصبح `pnpm test` غير المستهدف يشغّل الآن أحد عشر إعداد shard أصغر (`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية root-project أصلية ضخمة واحدة. هذا يقلّل ذروة RSS على الأجهزة المزدحمة ويمنع أعمال auto-reply/extension من تجويع الأجنحة غير ذات الصلة.
  - لا يزال `pnpm test --watch` يستخدم مخطط المشاريع الأصلي في الجذر `vitest.config.ts`، لأن حلقة watch متعددة الـ shard ليست عملية.
  - يوجّه `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات المحددة أولًا، لذلك فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب تكلفة بدء تشغيل مشروع الجذر الكامل.
  - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى المسارات المحددة نفسها عندما يلمس الفرق فقط ملفات المصدر/الاختبار القابلة للتوجيه؛ أما تعديلات config/setup فتعود إلى إعادة التشغيل الواسعة لمشروع الجذر.
  - تُوجَّه اختبارات unit الخفيفة من حيث الاستيراد من الوكلاء والأوامر والإضافات ومساعدات auto-reply و`plugin-sdk` ومناطق الأدوات الخالصة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ وتبقى الملفات ذات الحالة/الثقيلة وقت التشغيل على المسارات الحالية.
  - كذلك تربط بعض ملفات المصدر المساعدة المختارة في `plugin-sdk` و`commands` تشغيلات وضع changed باختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل الجناح الثقيل الكامل لذلك الدليل.
  - أصبح لدى `auto-reply` الآن ثلاث حاويات مخصصة: مساعدات core العليا، واختبارات التكامل العليا `reply.*`، والشجرة الفرعية `src/auto-reply/reply/**`. وهذا يبقي أعمال حزمة reply الأثقل بعيدًا عن اختبارات status/chunk/token الرخيصة.
- ملاحظة حول المشغّل المضمن:
  - عندما تغيّر مدخلات اكتشاف message-tool أو سياق تشغيل Compaction،
    حافظ على مستويي التغطية معًا.
  - أضف اختبارات انحدار مركزة للمساعدات لحدود التوجيه/التطبيع الخالصة.
  - واحرص أيضًا على بقاء أجنحة تكامل المشغّل المضمن سليمة:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه الأجنحة من أن المعرّفات المحددة وسلوك Compaction لا يزالان يمران
    عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تكفي اختبارات المساعدات
    وحدها كبديل لهذه مسارات التكامل.
- ملاحظة حول الـ pool:
  - أصبح الإعداد الأساسي لـ Vitest يستخدم `threads` افتراضيًا.
  - كما يثبت إعداد Vitest المشترك `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر وتهيئات e2e وlive.
  - يحتفظ مسار UI في الجذر بإعداد `jsdom` والمحسّن الخاص به، لكنه يعمل الآن على المشغّل المشترك غير المعزول أيضًا.
  - يرث كل shard في `pnpm test` افتراضيات `threads` + `isolate: false` نفسها من إعداد Vitest المشترك.
  - يضيف مشغّل `scripts/run-vitest.mjs` المشترك الآن أيضًا `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest افتراضيًا لتقليل churn في ترجمة V8 أثناء التشغيلات المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت بحاجة إلى المقارنة مع سلوك V8 الافتراضي.
- ملاحظة حول التكرار المحلي السريع:
  - يوجّه `pnpm test:changed` عبر المسارات المحددة عندما تطابق المسارات المتغيرة جناحًا أصغر بوضوح.
  - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه نفسه، فقط مع حد أعلى أكبر للعمّال.
  - أصبح التوسيع التلقائي لعدد العمّال محليًا محافظًا عمدًا الآن ويتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تسبب عدة تشغيلات Vitest متزامنة ضررًا أقل افتراضيًا.
  - يعلّم إعداد Vitest الأساسي ملفات المشاريع/الإعدادات على أنها `forceRerunTriggers` حتى تظل إعادة التشغيل في وضع changed صحيحة عندما تتغير توصيلات الاختبار.
  - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفات المدعومة؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت موقع cache صريحًا واحدًا لإجراء profiling مباشر.
- ملاحظة حول تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى مخرجات تفصيل الاستيراد.
  - يحدد `pnpm test:perf:imports:changed` عرض profiling نفسه للملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه ومسار root-project الأصلي لذلك الفرق الملتزم ويطبع زمن التنفيذ بالإضافة إلى أقصى RSS على macOS.
- يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة المتسخة الحالية عبر توجيه قائمة الملفات المتغيرة من خلال `scripts/test-projects.mjs` وإعداد Vitest في الجذر.
  - يكتب `pnpm test:perf:profile:main` ملف CPU profile للخيط الرئيسي لكلفة بدء تشغيل Vitest/Vite والتحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات CPU+heap profile للمشغّل لجناح unit مع تعطيل التوازي على مستوى الملفات.

### E2E (gateway smoke)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`
- افتراضيات وقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمّالًا تكيفيين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل حمل إدخال/إخراج الطرفية.
- بدائل مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمّال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل مخرجات الطرفية التفصيلية.
- النطاق:
  - سلوك Gateway من طرف إلى طرف مع عدة مثيلات
  - أسطح WebSocket/HTTP، وإقران Node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: OpenShell backend smoke

- الأمر: `pnpm test:e2e:openshell`
- الملف: `test/openshell-sandbox.e2e.test.ts`
- النطاق:
  - يبدأ OpenShell gateway معزولًا على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمارس OpenShell backend في OpenClaw عبر `sandbox ssh-config` حقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات canonical البعيد عبر جسر sandbox fs
- التوقعات:
  - تفعيل اختياري فقط؛ ليس جزءًا من التشغيل الافتراضي `pnpm test:e2e`
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر test gateway وsandbox
- بدائل مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل جناح e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI binary غير افتراضي أو wrapper script

### Live (مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - «هل يعمل هذا المزوّد/النموذج فعليًا _اليوم_ باستخدام بيانات اعتماد حقيقية؟»
  - التقاط تغييرات تنسيق المزوّد، وخصوصيات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر في CI بطبيعته (شبكات حقيقية، وسياسات مزوّد حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستهلك حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية مضيقة بدلًا من «كل شيء»
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد config/auth إلى test home مؤقت حتى لا تتمكن تركيبات unit الثابتة من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل المنزل الحقيقي لديك.
- أصبح `pnpm test:live` افتراضيًا يعمل في وضع أهدأ: فهو يحتفظ بمخرجات التقدم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات bootstrap الخاصة بـ gateway وضجيج Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت سجلات البدء الكاملة مجددًا.
- تدوير مفاتيح API (خاص بالمزوّد): اضبط `*_API_KEYS` باستخدام صيغة الفاصلة/الفاصلة المنقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (على سبيل المثال `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو استخدم override لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات rate limit.
- مخرجات التقدم/Heartbeat:
  - تصدر الأجنحة الحية الآن أسطر التقدم إلى stderr بحيث يظهر أن استدعاءات المزوّد الطويلة نشطة حتى عندما يكون التقاط الطرفية في Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض الطرفية في Vitest بحيث تتدفق أسطر تقدم المزوّد/gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاص بـ gateway/probe باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ما الجناح الذي يجب أن أشغّله؟

استخدم جدول القرار هذا:

- عند تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- عند لمس شبكات gateway / بروتوكول WS / الإقران: أضف `pnpm test:e2e`
- عند تصحيح «تعطل bot الخاص بي» / الأعطال الخاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` بعد تضييقه

## Live: مسح قدرات Android Node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن عنه حاليًا** من Android Node متصل والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا يقوم الجناح بتثبيت التطبيق أو تشغيله أو إقرانه).
  - التحقق من `node.invoke` في Gateway أمرًا بأمر لـ Android Node المحدد.
- الإعداد المسبق المطلوب:
  - أن يكون تطبيق Android متصلًا ومقترنًا بالفعل مع gateway.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- بدائل الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: فحص Smoke للنموذج (مفاتيح profile)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- «النموذج المباشر» يخبرنا ما إذا كان المزوّد/النموذج قادرًا على الاستجابة أصلًا باستخدام المفتاح المعطى.
- «فحص Smoke للـ Gateway» يخبرنا ما إذا كان خط gateway+agent الكامل يعمل لهذا النموذج (الجلسات، السجل، الأدوات، سياسة sandbox، إلخ).

### الطبقة 1: إكمال النموذج المباشر (بدون gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات انحدار مستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذا الجناح فعليًا؛ وإلا فسيتخطاه للحفاظ على تركيز `pnpm test:live` على فحص Gateway smoke
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل allowlist الحديث (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لـ allowlist الحديث
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist مفصول بفواصل)
  - تستخدم عمليات المسح modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist مفصول بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن profile وبدائل env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن profile** فقط
- سبب وجود هذا:
  - يفصل بين «واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح» و«مسار gateway agent معطل»
  - يحتوي اختبارات انحدار صغيرة ومعزولة (مثال: OpenAI Responses/Codex Responses reasoning replay + تدفقات tool-call)

### الطبقة 2: Gateway + فحص Smoke لوكيل dev (ما الذي يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (مع override للنموذج في كل تشغيل)
  - تكرار models-with-keys والتحقق من:
    - استجابة «ذات معنى» (بدون أدوات)
    - نجاح استدعاء أداة حقيقي (فحص `read`)
    - فحوصات أدوات إضافية اختيارية (فحص `exec+read`)
    - استمرار عمل مسارات انحدار OpenAI (tool-call-only → follow-up)
- تفاصيل الفحص (حتى تتمكن من شرح الإخفاقات بسرعة):
  - فحص `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وإرجاع nonce.
  - فحص `exec+read`: يطلب الاختبار من الوكيل كتابة nonce عبر `exec` في ملف مؤقت، ثم `read` له مجددًا.
  - فحص الصورة: يرفق الاختبار ملف PNG مولدًا (قطة + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: allowlist الحديث (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لـ allowlist الحديث
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات مسح gateway modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
- كيفية اختيار المزوّدين (تجنب «كل شيء عبر OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist مفصول بفواصل)
- فحوصات الأدوات + الصور مفعلة دائمًا في هذا الاختبار الحي:
  - فحص `read` + فحص `exec+read` (إجهاد الأدوات)
  - يعمل فحص الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولد الاختبار ملف PNG صغيرًا يحتوي على “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: تحتوي الاستجابة على `cat` + الرمز (سماحية OCR: تُسمح الأخطاء الطفيفة)

نصيحة: لمعرفة ما الذي يمكنك اختباره على جهازك (ومعرفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: فحص Smoke للواجهة الخلفية CLI (Claude أو Codex أو Gemini أو غيرها من CLI المحلية)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + الوكيل باستخدام واجهة خلفية CLI محلية، دون المساس بإعدادك الافتراضي.
- توجد افتراضيات فحص Smoke الخاصة بكل واجهة خلفية مع تعريف `cli-backend.ts` الذي تملكه الإضافة المعنية.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصور من metadata الخاصة بـ Plugin الواجهة الخلفية CLI المالكة.
- التبديلات الاختيارية:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور بوصفها وسائط CLI بدلًا من حقنها في prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل فحص الاستمرارية الافتراضي للجلسة نفسها من Claude Sonnet إلى Opus (اضبطه إلى `1` لفرض تفعيله عندما يدعم النموذج المحدد هدف تبديل).

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

- يوجد مشغّل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل فحص Smoke للواجهة الخلفية CLI الحي داخل صورة Docker الخاصة بالمستودع باعتبار المستخدم غير الجذر `node`.
- يحل metadata الخاصة بفحص Smoke من الإضافة المالكة، ثم يثبّت حزمة Linux CLI المطابقة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في prefix قابل للكتابة ومخزن مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code عبر أحد الخيارين `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. وهو يثبت أولًا نجاح `claude -p` المباشر في Docker، ثم يشغّل دورتين للواجهة الخلفية CLI في Gateway من دون الاحتفاظ بمتغيرات بيئة مفتاح Anthropic API. يعطّل هذا المسار الخاص بالاشتراك فحوصات Claude MCP/tool والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام التطبيقات الخارجية عبر فوترة استخدام إضافي بدلًا من حدود خطة الاشتراك المعتادة.
- أصبح فحص Smoke للواجهة الخلفية CLI الحي الآن يمارس التدفق الكامل نفسه من طرف إلى طرف لكل من Claude وCodex وGemini: دورة نصية، ثم دورة تصنيف صورة، ثم استدعاء أداة MCP `cron` يتم التحقق منه عبر Gateway CLI.
- يقوم فحص Smoke الافتراضي لـ Claude أيضًا بترقيع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## Live: فحص Smoke لربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة ACP الحقيقي باستخدام وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل تركيبية في مكانها
  - إرسال متابعة عادية على نفس المحادثة
  - التحقق من أن المتابعة تصل إلى transcript جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الافتراضيات:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP لتشغيل `pnpm test:live ...` المباشر: `claude`
  - القناة التركيبية: سياق محادثة بأسلوب Slack DM
  - الواجهة الخلفية لـ ACP: `acpx`
- التبديلات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- ملاحظات:
  - يستخدم هذا المسار سطح Gateway `chat.send` مع حقول originating-route تركيبية مخصصة للمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم الخارجي.
  - عندما لا يتم ضبط `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`، يستخدم الاختبار سجل الوكلاء المضمن في Plugin `acpx` لاختيار وكيل harness ACP المحدد.

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
- افتراضيًا، يشغّل فحص Smoke لربط ACP مقابل جميع وكلاء CLI الأحياء المدعومين بالتسلسل: `claude` ثم `codex` ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يقوم بتحميل `~/.profile`، وتجهيز مواد مصادقة CLI المطابقة داخل الحاوية، وتثبيت `acpx` في npm prefix قابل للكتابة، ثم يثبّت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان مفقودًا.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` حتى يحتفظ acpx بمتغيرات بيئة المزوّد من profile المحمّل متاحةً لـ harness CLI الفرعي.

## Live: فحص Smoke لحزمة Codex app-server

- الهدف: التحقق من Codex harness المملوك للإضافة عبر الطريقة
  العادية `agent` في gateway:
  - تحميل Plugin `codex` المضمّن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة وكيل عبر gateway إلى `codex/gpt-5.4`
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن
    thread الخاص بـ app-server يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار
    أوامر gateway نفسه
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- فحص صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- يضبط فحص Smoke هذا `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا يتمكن
  Codex harness المعطل من النجاح عبر الرجوع الصامت إلى PI.
- المصادقة: `OPENAI_API_KEY` من shell/profile، بالإضافة إلى نسخ اختيارية من
  `~/.codex/auth.json` و`~/.codex/config.toml`

وصفة محلية:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
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
- يقوم بتحميل `~/.profile` الموصّل، ويمرّر `OPENAI_API_KEY`، وينسخ ملفات
  مصادقة Codex CLI عند وجودها، ويثبّت `@openai/codex` في npm prefix
  موصول وقابل للكتابة، ويجهّز شجرة المصدر، ثم يشغّل فقط الاختبار الحي
  لـ Codex-harness.
- يفعّل Docker فحوصات الصورة وMCP/tool افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` عندما تحتاج إلى تشغيل تصحيح
  أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد
  الاختبار الحي بحيث لا يمكن لـ `openai-codex/*` أو fallback إلى PI
  إخفاء اختبار انحدار في Codex harness.

### الوصفات الحية الموصى بها

تعد allowlist الضيقة والصريحة الأسرع والأقل عرضة لعدم الاستقرار:

- نموذج واحد، مباشر (بدون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، فحص Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- التركيز على Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- `google/...` يستخدم Gemini API (مفتاح API).
- `google-antigravity/...` يستخدم جسر Antigravity OAuth (نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- `google-gemini-cli/...` يستخدم Gemini CLI المحلي على جهازك (مصادقة منفصلة وخصائص أدوات مختلفة).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (بمصادقة مفتاح API / profile)؛ وهذا ما يقصده معظم المستخدمين عندما يقولون “Gemini”.
  - CLI: يستدعي OpenClaw ملف `gemini` المحلي؛ وله مصادقته الخاصة وقد يتصرف بشكل مختلف (البث، ودعم الأدوات، واختلاف الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد «قائمة نماذج CI» ثابتة (لأن live اختياري)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير يملك مفاتيح.

### مجموعة الفحص الحديثة (استدعاء الأدوات + الصورة)

هذا هو تشغيل «النماذج الشائعة» الذي نتوقع أن يظل يعمل:

- OpenAI (غير Codex): `openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): ‏`google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): ‏`google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI (GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

شغّل فحص Gateway smoke مع الأدوات + الصورة:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل لكل عائلة مزوّدين:

- OpenAI: `openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: ‏`xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: ‏`mistral/`… (اختر نموذجًا واحدًا قادرًا على “tools” لديك)
- Cerebras: ‏`cerebras/`… (إذا كان لديك وصول)
- LM Studio: ‏`lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### Vision: إرسال صورة (مرفق ← رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على التعامل مع الصور داخل `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل Claude/Gemini/OpenAI بالإصدارات القادرة على Vision، إلخ) لتمرير فحص الصورة.

### المجمّعات / بوابات بديلة

إذا كانت لديك مفاتيح مفعلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: ‏`openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: ‏`opencode/...` من أجل Zen و`opencode-go/...` من أجل Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزيد من المزوّدين الذين يمكنك تضمينهم في مصفوفة live (إذا كانت لديك بيانات اعتماد/إعدادات):

- مضمّنة: `openai` و`openai-codex` و`anthropic` و`google` و`google-vertex` و`google-antigravity` و`google-gemini-cli` و`zai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`groq` و`cerebras` و`mistral` و`github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي proxy متوافق مع OpenAI/Anthropic (مثل LM Studio وvLLM وLiteLLM، إلخ)

نصيحة: لا تحاول ترميز «كل النماذج» بشكل ثابت في المستندات. القائمة الموثوقة هي ما يعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تُضمَّن في commit أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي تعمل بها CLI. والنتائج العملية لذلك:

- إذا كانت CLI تعمل، فيجب أن تعثر الاختبارات الحية على المفاتيح نفسها.
- إذا قال اختبار حي «لا توجد بيانات اعتماد»، فقم بتصحيح المشكلة بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات auth profiles لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (وهذا ما تعنيه «profile keys» في الاختبارات الحية)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المنزل الحي المجهز عند وجوده، لكنه ليس مخزن مفاتيح profile الرئيسي)
- تقوم تشغيلات live المحلية بنسخ الإعداد النشط وملفات `auth-profiles.json` لكل وكيل و`credentials/` القديمة وأدلة مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت افتراضيًا؛ وتتخطى المنازل الحية المجهزة `workspace/` و`sandboxes/`، وتُزال تجاوزات المسار في `agents.*.workspace` و`agentDir` حتى تبقى الفحوصات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح env (على سبيل المثال المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (يمكنها وصل `~/.profile` داخل الحاوية).

## Deepgram live (نسخ الصوت إلى نص)

- الاختبار: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- الاختبار: `src/agents/byteplus.live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- تجاوز اختياري للنموذج: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يمارس مسارات الصورة والفيديو و`music_generate` المضمّنة الخاصة بـ comfy
  - يتخطى كل قدرة ما لم يتم ضبط `models.providers.comfy.<capability>`
  - مفيد بعد تعديل إرسال سير العمل في comfy أو polling أو التنزيلات أو تسجيل Plugin

## Image generation live

- الاختبار: `src/image-generation/runtime.live.test.ts`
- الأمر: `pnpm test:live src/image-generation/runtime.live.test.ts`
- الـ harness: `pnpm test:live:media image`
- النطاق:
  - يعدّد كل Plugin مزوّد image-generation مسجل
  - يحمّل متغيرات بيئة المزوّد الناقصة من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل auth profiles المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/‏profile/نموذجًا صالحًا
  - يشغّل متغيرات image-generation القياسية عبر قدرة وقت التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- المزوّدون المضمّنون الحاليون المشمولون:
  - `openai`
  - `google`
- التضييق الاختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل overrides المعتمدة على env فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الـ harness: `pnpm test:live:media music`
- النطاق:
  - يمارس مسار مزوّد music-generation المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات بيئة المزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل auth profiles المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/‏profile/نموذجًا صالحًا
  - يشغّل وضعي وقت التشغيل المعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد على prompt فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية في المسار المشترك:
    - `google`: ‏`generate`، `edit`
    - `minimax`: ‏`generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا المسح المشترك
- التضييق الاختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل overrides المعتمدة على env فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الـ harness: `pnpm test:live:media video`
- النطاق:
  - يمارس مسار مزوّد video-generation المضمّن المشترك
  - يستخدم افتراضيًا مسار فحص smoke آمنًا للإصدارات: مزوّدات غير FAL، وطلب text-to-video واحد لكل مزوّد، وprompt لوبستر لمدة ثانية واحدة، وحد عملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (الافتراضي `180000`)
  - يتخطى FAL افتراضيًا لأن زمن الانتظار في طابور المزوّد قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات بيئة المزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل auth profiles المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/‏profile/نموذجًا صالحًا
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الصور المحلية المعتمد على buffer في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الفيديو المحلي المعتمد على buffer في المسح المشترك
  - مزوّدو `imageToVideo` المعلن عنهم حاليًا لكن المتخطَّون في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب URL صورة بعيدًا
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` من text-to-video بالإضافة إلى مسار `kling` يستخدم افتراضيًا تركيبة URL صورة بعيدة
  - التغطية الحية الحالية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزوّدو `videoToVideo` المعلن عنهم حاليًا لكن المتخطَّون في المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا URLs مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا معتمدًا على buffer وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لـ video inpaint/remix
- التضييق الاختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل الحد الأقصى لعملية كل مزوّد من أجل تشغيل smoke صارم
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل overrides المعتمدة على env فقط

## Media live harness

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل أجنحة live المشتركة الخاصة بالصور والموسيقى والفيديو عبر نقطة دخول أصلية واحدة للمستودع
  - يحمّل تلقائيًا متغيرات بيئة المزوّد الناقصة من `~/.profile`
  - يضيّق تلقائيًا كل جناح إلى المزوّدين الذين لديهم حاليًا مصادقة صالحة افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغّلات Docker (فحوصات اختيارية من نوع "يعمل على Linux")

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات live-model: ‏`test:docker:live-models` و`test:docker:live-gateway` يشغّلان فقط ملف live المطابق الخاص بمفاتيح profile داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع وصل دليل config ومساحة العمل المحليين لديك (ومع تحميل `~/.profile` إن كان موصولًا). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغّلات Docker الحية افتراضيًا حد smoke أصغر حتى يبقى المسح الكامل عبر Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات البيئة هذه عندما
  تريد صراحةً المسح الشامل الأكبر.
- يقوم `test:docker:all` ببناء صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها للمسارين الحيين عبر Docker.
- مشغّلات smoke للحاويات: ‏`test:docker:openwebui` و`test:docker:onboard` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:plugins` تقلع حاوية واحدة أو أكثر حقيقية وتتحقق من مسارات تكامل أعلى مستوى.

تقوم مشغّلات Docker الخاصة بـ live-model أيضًا بوصل منازل مصادقة CLI المطلوبة فقط (أو جميع المنازل المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى منزل الحاوية قبل التشغيل حتى تتمكن OAuth الخاصة بـ CLI الخارجي من تحديث الرموز دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكريبت: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (السكريبت: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (السكريبت: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (السكريبت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل dev: `pnpm test:docker:live-gateway` (السكريبت: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (السكريبت: `scripts/e2e/openwebui-docker.sh`)
- معالج onboarding (TTY، بناء كامل): `pnpm test:docker:onboard` (السكريبت: `scripts/e2e/onboard-docker.sh`)
- شبكات Gateway (حاويتان، مصادقة WS + health): `pnpm test:docker:gateway-network` (السكريبت: `scripts/e2e/gateway-network-docker.sh`)
- جسر قناة MCP (Gateway مبدوء مسبقًا + جسر stdio + smoke خام لإطار إشعار Claude): `pnpm test:docker:mcp-channels` (السكريبت: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (install smoke + الاسم البديل `/plugin` + دلالات إعادة تشغيل Claude-bundle): `pnpm test:docker:plugins` (السكريبت: `scripts/e2e/plugins-docker.sh`)

تقوم مشغّلات Docker الخاصة بـ live-model أيضًا بوصل نسخة checkout الحالية للقراءة فقط
وتجهيزها داخل workdir مؤقت داخل الحاوية. هذا يُبقي صورة وقت التشغيل
نحيفة، مع الاستمرار في تشغيل Vitest على المصدر/الإعداد المحلي المطابق تمامًا.
تتخطى خطوة التجهيز الذاكرات المؤقتة المحلية الكبيرة فقط ومخرجات بناء التطبيق مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو
مخرجات Gradle، حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
artifacts خاصة بالجهاز.
كما أنها تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية
عمّال قنوات حقيقية مثل Telegram/Discord وغيرها داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذلك مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker هذا.
يُعد `test:docker:openwebui` فحص توافق أعلى مستوى: فهو يبدأ
حاوية OpenClaw gateway مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة مقابل ذلك gateway، ويسجل الدخول من خلال
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر proxy ‏`/api/chat/completions` في Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إكمال إعداد البدء البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حي صالحًا، ويُعد `OPENCLAW_PROFILE_FILE`
(الافتراضي `~/.profile`) الطريقة الأساسية لتوفيره في تشغيلات Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
يعد `test:docker:mcp-channels` حتميًا عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يقلع حاوية Gateway
مبدوءة مسبقًا، ثم يبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءة transcript، وmetadata الخاصة بالمرفقات،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات بأسلوب Claude عبر جسر MCP الحقيقي المعتمد على stdio. وتفحص عملية
التحقق من الإشعارات إطارات MCP الخام على stdio مباشرةً حتى يتحقق smoke مما
يبثه الجسر فعلًا، لا فقط مما تعرضه مجموعة SDK عميل معينة بالمصادفة.

فحص Smoke يدوي لخيط ACP باللغة الطبيعية (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكريبت من أجل سير عمل اختبار الانحدار/تصحيح الأخطاء. قد يلزم مجددًا للتحقق من توجيه خيوط ACP، لذلك لا تحذفه.

متغيرات البيئة المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يُوصَل إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يُوصَل إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) يُوصَل إلى `/home/node/.profile` ويُحمّل قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات البيئة المحمّلة فقط من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة config/workspace مؤقتة ومن دون أي وصل لمصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يُوصَل إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُوصَل أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط ضمن `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - التشغيلات المضيقة حسب المزوّد توصل فقط الأدلة/الملفات اللازمة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - يمكنك التجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لتشغيلات الإعادة التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن profile (وليس من env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرِضه gateway لفحص Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt التحقق من nonce المستخدم بواسطة Open WebUI smoke
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبت

## التحقق من سلامة المستندات

شغّل فحوصات المستندات بعد تعديلها: `pnpm check:docs`.
وشغّل التحقق الكامل لروابط Mintlify عندما تحتاج أيضًا إلى فحص العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## اختبار الانحدار دون اتصال (آمن لـ CI)

هذه اختبارات انحدار لـ «مسار حقيقي» دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (‏OpenAI وهمي، Gateway + حلقة وكيل حقيقية): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (‏WS `wizard.start`/`wizard.next`، يكتب config + auth مع فرضهما): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل «تقييمات موثوقية الوكيل»:

- استدعاء أدوات وهمية عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات المعالج الكاملة من طرف إلى طرف التي تتحقق من توصيل الجلسة وتأثيرات config (`src/gateway/gateway.test.ts`).

ما الذي لا يزال مفقودًا بالنسبة إلى Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في prompt، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تظل التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءة ملفات Skill، وتوصيل الجلسات.
- جناح صغير من السيناريوهات المركزة على Skills (الاستخدام مقابل التجنب، والبوابات، وحقن prompt).
- تقييمات حية اختيارية (opt-in، ومقيدة عبر env) فقط بعد وضع الجناح الآمن لـ CI.

## اختبارات العقد (شكل Plugin والقناة)

تتحقق اختبارات العقد من أن كل Plugin وقناة مسجلين يطابقان
عقد الواجهة الخاص بهما. فهي تكرر عبر جميع Plugins المكتشفة وتشغّل مجموعة من
التحققات الخاصة بالشكل والسلوك. يتخطى مسار unit الافتراضي `pnpm test`
عمدًا هذه الملفات المشتركة الخاصة بالواجهات وفحوص smoke؛ شغّل أوامر العقد صراحةً
عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدات فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (id، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - التعامل مع الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع معرّف الخيط
- **directory** - واجهة API للدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب تشغيلها

- بعد تغيير صادرات `plugin-sdk` أو المسارات الفرعية الخاصة بها
- بعد إضافة Plugin قناة أو مزوّد أو تعديل أحدهما
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات الانحدار (إرشادات)

عندما تصلح مشكلة في مزوّد/نموذج اكتُشفت في live:

- أضف اختبار انحدار آمنًا لـ CI إن أمكن (مزوّد وهمي/بديل stub، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت المشكلة حية فقط بطبيعتها (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب المزوّد → اختبار النماذج المباشرة
  - خطأ في مسار الجلسة/السجل/الأدوات في gateway → اختبار Gateway live smoke أو اختبار Gateway وهمي آمن لـ CI
- حاجز حماية لاجتياز SecretRef:
  - يقوم `src/secrets/exec-secret-ref-id-parity.test.ts` باشتقاق هدف نموذجي واحد لكل فئة SecretRef من metadata السجل (`listSecretTargetRegistryEntries()`)، ثم يتحقق من رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.
