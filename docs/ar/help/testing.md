---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات تراجع لأخطاء النموذج/المزوّد
    - تصحيح سلوك Gateway + الوكيل
summary: 'عدة الاختبار: أجنحة unit/e2e/live، ومشغلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-21T07:21:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef5bf36f969a6334efd2e8373a0c8002f9e6461af53c4ff630b38ad8e37f73de
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاثة أجنحة Vitest ‏(unit/integration وe2e وlive) ومجموعة صغيرة من مشغلات Docker.

هذه الوثيقة هي دليل "كيف نختبر":

- ما الذي يغطيه كل جناح (وما الذي _لا_ يغطيه عمدًا)
- ما الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل push، تصحيح الأخطاء)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدين
- كيفية إضافة اختبارات تراجع لمشكلات النماذج/المزوّدين في العالم الحقيقي

## بدء سريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع محليًا للأجنحة الكاملة على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- يستهدف الاستدعاء المباشر للملفات الآن أيضًا مسارات extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل أولًا التشغيلات المستهدفة عندما تعمل على تكرار إصلاح فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بـ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- جناح E2E: `pnpm test:e2e`

عند تصحيح مزوّدين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- الجناح الحي (مجسات النماذج + أدوات Gateway/الصور): `pnpm test:live`
- استهدف ملف live واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- اختبار تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مع `moonshot/kimi-k2.6`. تحقّق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  سجل المساعد يخزّن `usage.cost` الموحّد.

نصيحة: عندما تحتاج إلى حالة فاشلة واحدة فقط، فافضّل تضييق نطاق اختبارات live عبر متغيرات env الخاصة بقائمة السماح الموضحة أدناه.

## مشغلات خاصة بـ QA

توجد هذه الأوامر بجانب أجنحة الاختبار الرئيسية عندما تحتاج إلى واقعية qa-lab:

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المعتمدة على المستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway معزولين. يستخدم `qa-channel` توازيًا افتراضيًا قدره 4 (مقيدًا بعدد السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يبدأ `aimock` خادم مزوّد محليًا مدعومًا بـ AIMock لتغطية تجريبية للـ fixtures
    ومحاكاة البروتوكول من دون استبدال مسار `mock-openai`
    الواعي بالسيناريو.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل جناح QA نفسه داخل Linux VM مؤقت عبر Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه الخاص بـ `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار المزوّد/النموذج نفسها الخاصة بـ `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد القائمة على env، ومسار إعداد مزوّد QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى مجلدات الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة مرة أخرى عبر
    مساحة العمل المركبة.
  - يكتب تقرير QA العادي + الملخص بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker للعمل التشغيلي بأسلوب QA.
- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم مزوّد AIMock المحلي لاختبار الدخان المباشر للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي الخاص بـ Matrix مقابل خادم Tuwunel مؤقت مدعوم بـ Docker.
  - مضيف QA هذا خاص بالمستودع/التطوير فقط حاليًا. لا تشحن تثبيتات OpenClaw المجمعة
    `qa-lab`، لذا فهي لا تعرض `openclaw qa`.
  - تحمّل سحوبات المستودع المشغل المضمّن مباشرة؛ ولا حاجة إلى خطوة تثبيت Plugin منفصلة.
  - يوفّر ثلاثة مستخدمين مؤقتين لـ Matrix (`driver`, `sut`, `observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ عملية فرعية لـ QA Gateway مع Plugin Matrix الحقيقي كنقل SUT.
  - يستخدم صورة Tuwunel الثابتة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يكشف Matrix علامات مصادر بيانات اعتماد مشتركة لأن المسار يوفّر مستخدمين مؤقتين محليًا.
  - يكتب تقرير QA لـ Matrix وملخصًا وartifact للأحداث الملحوظة وسجل إخراج stdout/stderr المجمّع تحت `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي الخاص بـ Telegram مقابل مجموعة خاصة حقيقية باستخدام driver وSUT bot tokens من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات اعتماد مشتركة مجمّعة. استخدم وضع env افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` لاختيار عقود الإعارة المجمّعة.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد artifacts من دون رمز خروج فاشل.
  - يتطلب روبوتين مختلفين في المجموعة الخاصة نفسها، مع كشف SUT bot عن اسم مستخدم Telegram.
  - لملاحظة مستقرة من روبوت إلى روبوت، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا الروبوتين وتأكد من أن driver bot يمكنه ملاحظة حركة روبوتات المجموعة.
  - يكتب تقرير QA لـ Telegram وملخصًا وartifact للرسائل الملحوظة تحت `.artifacts/qa-e2e/...`.

تشارك مسارات النقل الحية عقدًا قياسيًا واحدًا حتى لا تنحرف عمليات النقل الجديدة:

يبقى `qa-channel` جناح QA التركيبي الواسع وليس جزءًا من مصفوفة تغطية
النقل الحي.

| المسار   | Canary | بوابة الذكر | حظر قائمة السماح | رد علوي | استئناف بعد إعادة التشغيل | متابعة الخيط | عزل الخيط | ملاحظة التفاعل | أمر المساعدة |
| -------- | ------ | ----------- | ---------------- | ------- | ------------------------- | ------------ | ---------- | --------------- | ------------ |
| Matrix   | x      | x           | x                | x       | x                         | x            | x          | x               |              |
| Telegram | x      |             |                  |         |                           |              |            |                 | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex ‏(v1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) في
`openclaw qa telegram`، يحصل QA lab على عقد إعارة حصري من مجموعة مدعومة بـ Convex، ويرسل Heartbeat
لهذا العقد أثناء تشغيل المسار، ويحرر العقد عند الإيقاف.

هيكل مشروع Convex المرجعي:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (مثل `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` للدور `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` للدور `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: ‏`--credential-role maintainer|ci`
  - الافتراضي في env: ‏`OPENCLAW_QA_CREDENTIAL_ROLE` (الافتراضي `ci` في CI، و`maintainer` خلاف ذلك)

متغيرات env الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL الخاصة بـ Convex بصيغة `http://` على loopback فقط للتطوير المحلي.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` صيغة `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرف (إضافة/إزالة/عرض المجموعة) تحديدًا
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` لإخراج مقروء آليًا في scripts وأدوات CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - الاستنفاد/قابلية إعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - حماية العقد النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر maintainer فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن تكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

تتطلب إضافة قناة إلى نظام QA المعتمد على Markdown أمرين بالضبط:

1. مُهايئ نقل للقناة.
2. حزمة سيناريو تمارس عقد القناة.

لا تضف جذر أوامر QA علويًا جديدًا عندما يمكن لمضيف `qa-lab` المشترك
امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء الجناح وإنهاؤه
- توازي العمال
- كتابة artifacts
- إنشاء التقارير
- تنفيذ السيناريوهات
- أسماء التوافق البديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Runner Plugins عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيفية تهيئة Gateway لهذا النقل
- كيفية فحص الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية ملاحظة الرسائل الصادرة
- كيفية كشف السجلات وحالة النقل الموحّدة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاصة بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. أبقِ `qa-lab` مالكًا للجذر المشترك `qa`.
2. نفّذ transport runner على واجهة مضيف `qa-lab` المشتركة.
3. أبقِ الآليات الخاصة بالنقل داخل Runner Plugin أو harness الخاص بالقناة.
4. ركّب runner على شكل `openclaw qa <runner>` بدلًا من تسجيل جذر أوامر منافس.
   يجب أن تعلن Runner Plugins عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   أبقِ `runtime-api.ts` خفيفًا؛ ويجب أن تبقى عمليات التنفيذ الكسول لـ CLI وrunner خلف نقاط دخول منفصلة.
5. أنشئ أو عدّل سيناريوهات Markdown تحت أدلة `qa/scenarios/` ذات الطابع المناسب.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق البديلة الحالية عاملة ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على نقل قناة واحدة، فأبقِه في Runner Plugin ذلك أو harness الخاص بالـ Plugin.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة داخل `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بذلك النقل واذكر ذلك صراحة في عقد السيناريو.

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

تظل الأسماء البديلة المتوافقة متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم أعمال القنوات الجديدة أسماء المساعدات العامة.
توجد الأسماء البديلة المتوافقة لتجنب ترحيل شامل دفعة واحدة، وليس كنموذج
لتأليف سيناريوهات جديدة.

## أجنحة الاختبار (ما الذي يعمل وأين)

فكّر في الأجنحة على أنها "ازدياد في الواقعية" (وازدياد في عدم الاستقرار/التكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: عشر تشغيلات shards متسلسلة (`vitest.full-*.config.ts`) على مشاريع Vitest المحددة الموجودة
- الملفات: فهارس core/unit ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts` واختبارات `ui` الخاصة بـ node المسموح بها والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة Gateway، والتوجيه، والأدوات، والتحليل، والإعداد)
  - اختبارات تراجع حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - يشغّل `pnpm test` غير المستهدف الآن أحد عشر إعداد shard أصغر (`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية مشروع جذرية أصلية واحدة ضخمة. يؤدي ذلك إلى خفض ذروة RSS على الأجهزة المحمّلة ويمنع أعمال auto-reply/extension من تجويع الأجنحة غير ذات الصلة.
  - لا يزال `pnpm test --watch` يستخدم رسم مشاريع الجذر الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة الـ shards غير عملية.
  - يمرر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات المحددة أولًا، لذا فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب تكلفة بدء تشغيل مشروع الجذر الكامل.
  - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى المسارات المحددة نفسها عندما يلمس diff فقط ملفات المصدر/الاختبار القابلة للتوجيه؛ أما تعديلات الإعداد/التهيئة فتعود إلى إعادة تشغيل رسم مشروع الجذر الواسع.
  - يُعد `pnpm check:changed` بوابة محلية ذكية عادية للأعمال الضيقة. فهو يصنف diff إلى core، واختبارات core، وextensions، واختبارات extension، والتطبيقات، والوثائق، والأدوات، ثم يشغّل مسارات typecheck/lint/test المطابقة. تتضمن تغييرات Plugin SDK العامة وعقد الـ plugin التحقق من extensions لأن extensions تعتمد على عقود core هذه.
  - تُوجَّه اختبارات unit الخفيفة الاستيراد من الوكلاء، والأوامر، وplugins، ومساعدات auto-reply، و`plugin-sdk`، ومناطق الأدوات الخالصة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ أما الملفات الثقيلة من ناحية الحالة/وقت التشغيل فتبقى على المسارات الحالية.
  - تُعيّن أيضًا بعض ملفات المصدر المساعدة المحددة من `plugin-sdk` و`commands` تشغيلات وضع التغييرات إلى اختبارات الأشقاء الصريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل الجناح الثقيل الكامل لذلك الدليل.
  - يحتوي `auto-reply` الآن على ثلاث مجموعات مخصصة: مساعدات core من المستوى الأعلى، واختبارات integration العليا `reply.*`، والشجرة الفرعية `src/auto-reply/reply/**`. يحافظ هذا على أثقل أعمال harness الخاصة بالرد بعيدًا عن اختبارات الحالة/الجزء/token الرخيصة.
- ملاحظة embedded runner:
  - عندما تغيّر مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل Compaction،
    حافظ على مستويي التغطية كليهما.
  - أضف اختبارات تراجع مركزة للمساعدات على حدود التوجيه/التطبيع الخالصة.
  - واحرص أيضًا على بقاء أجنحة integration الخاصة بـ embedded runner سليمة:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه الأجنحة من أن المعرّفات المحددة وسلوك Compaction لا يزالان يتدفقان
    عبر مسارات `run.ts` / `compact.ts` الحقيقية؛ ولا تُعد اختبارات المساعدات وحدها
    بديلًا كافيًا عن مسارات integration هذه.
- ملاحظة التجميع:
  - يستخدم إعداد Vitest الأساسي الآن افتراضيًا `threads`.
  - يثبت إعداد Vitest المشترك أيضًا `isolate: false` ويستخدم المشغّل غير المعزول عبر مشاريع الجذر وإعدادات e2e وlive.
  - يحتفظ مسار UI الجذري بإعداد `jsdom` والمُحسِّن الخاص به، لكنه يعمل الآن أيضًا على المشغّل المشترك غير المعزول.
  - يرث كل shard في `pnpm test` الإعدادات الافتراضية نفسها `threads` + `isolate: false` من إعداد Vitest المشترك.
  - يضيف المشغّل المشترك `scripts/run-vitest.mjs` الآن أيضًا `--no-maglev` لعمليات Node الفرعية الخاصة بـ Vitest افتراضيًا لتقليل اضطراب الترجمة في V8 أثناء التشغيلات المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت تحتاج إلى المقارنة مع سلوك V8 الافتراضي.
- ملاحظة التكرار المحلي السريع:
  - يعرض `pnpm changed:lanes` المسارات المعمارية التي يطلقها diff.
  - يشغّل pre-commit hook الأمر `pnpm check:changed --staged` بعد تنسيق/lint الملفات المهيأة، بحيث لا تتحمل عمليات commit الخاصة بـ core فقط تكلفة اختبارات extension ما لم تلمس عقودًا عامة موجهة إلى extension.
  - يمر `pnpm test:changed` عبر المسارات المحددة عندما تُعيَّن المسارات المتغيرة بوضوح إلى جناح أصغر.
  - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه نفسه، فقط مع حد أعلى للعمال.
  - أصبح التحجيم التلقائي المحلي للعمال محافظًا عمدًا الآن ويتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تُلحق عدة تشغيلات Vitest متزامنة ضررًا أقل افتراضيًا.
  - يحدد إعداد Vitest الأساسي ملفات المشاريع/الإعداد كـ `forceRerunTriggers` بحيث تظل إعادة تشغيل وضع التغييرات صحيحة عندما تتغير أسلاك الاختبار.
  - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد موقع cache صريحًا واحدًا لغرض profiling المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة استيراد Vitest بالإضافة إلى إخراج تفصيل الاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض profiling نفسه على الملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه والمسار الأصلي لمشروع الجذر لذلك diff الملتزم ويطبع زمن التنفيذ بالإضافة إلى macOS max RSS.
- يقيس `pnpm test:perf:changed:bench -- --worktree` أداء الشجرة المتسخة الحالية عبر تمرير قائمة الملفات المتغيرة عبر `scripts/test-projects.mjs` وإعداد Vitest الجذري.
  - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي من أجل تكلفة بدء تشغيل Vitest/Vite والتحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap للمشغّل لجناح unit مع تعطيل توازي الملفات.

### E2E (اختبار دخان Gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- الإعدادات الافتراضية لوقت التشغيل:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمالًا متكيفين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل تكلفة I/O الخاصة بوحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل إخراج وحدة التحكم المفصل.
- النطاق:
  - سلوك Gateway من طرف إلى طرف متعدد المثيلات
  - أسطح WebSocket/HTTP، واقتران Node، وشبكات أثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في خط الأنابيب)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: اختبار دخان الواجهة الخلفية OpenShell

- الأمر: `pnpm test:e2e:openshell`
- الملف: `test/openshell-sandbox.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمارس الواجهة الخلفية لـ OpenClaw الخاصة بـ OpenShell عبر `sandbox ssh-config` + تنفيذ SSH حقيقيين
  - يتحقق من سلوك نظام الملفات القياسي البعيد عبر جسر fs الخاص بـ sandbox
- التوقعات:
  - مشاركة اختيارية فقط؛ ليست جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - تتطلب CLI محليًا لـ `openshell` بالإضافة إلى daemon Docker عامل
  - تستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم تدمّر Gateway الاختبار وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتفعيل الاختبار عند تشغيل جناح e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى CLI ثنائي غير افتراضي أو script wrapper

### Live (مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعلًا _اليوم_ مع بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق المزوّد، ومراوغات استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر في CI بطبيعته (شبكات حقيقية، وسياسات مزوّدين حقيقية، وحصص، وانقطاعات)
  - يكلف المال / يستهلك حدود المعدل
  - يُفضّل تشغيل مجموعات جزئية ضيقة بدلًا من "كل شيء"
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، تعزل التشغيلات الحية أيضًا `HOME` وتنسخ مواد الإعداد/المصادقة إلى home اختباري مؤقت حتى لا تستطيع fixtures الخاصة بـ unit تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل home الحقيقي لديك.
- يستخدم `pnpm test:live` الآن افتراضيًا وضعًا أكثر هدوءًا: فهو يحتفظ بإخراج التقدم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات إقلاع Gateway/ضوضاء Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت السجلات الكاملة لبدء التشغيل مجددًا.
- تدوير مفاتيح API (خاص بكل مزوّد): اضبط `*_API_KEYS` بتنسيق الفاصلة/الفاصلة المنقوطة أو `*_API_KEY_1`, `*_API_KEY_2` (مثل `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) أو تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ وتعيد الاختبارات المحاولة عند استجابات حد المعدل.
- إخراج التقدم/Heartbeat:
  - تصدر الأجنحة الحية الآن أسطر تقدم إلى stderr بحيث تبدو استدعاءات المزوّد الطويلة نشطة بوضوح حتى عندما يكون التقاط وحدة تحكم Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest بحيث تتدفق أسطر تقدم المزوّد/Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat للنموذج المباشر باستخدام `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاص بالـ gateway/probe باستخدام `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي جناح يجب أن أشغّل؟

استخدم جدول القرار هذا:

- عند تحرير المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- عند لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- عند تصحيح "الروبوت الخاص بي متوقف" / الأعطال الخاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` مضيق النطاق

## Live: مسح قدرات Android node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن عنه حاليًا** من Android node متصل والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا يثبت الجناح التطبيق ولا يشغله ولا يقترنه).
  - تحقق `node.invoke` في Gateway أمرًا بأمر لـ Android node المحدد.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل بـ Gateway.
  - إبقاء التطبيق في الواجهة.
  - منح الأذونات/الموافقة على الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات هدف اختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: اختبار دخان النماذج (مفاتيح profile)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- يخبرنا "النموذج المباشر" ما إذا كان المزوّد/النموذج يستطيع الرد أصلًا بالمفتاح المعطى.
- يخبرنا "اختبار دخان Gateway" ما إذا كان مسار gateway+agent الكامل يعمل لذلك النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، إلخ).

### الطبقة 1: إكمال النموذج المباشر (من دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات التراجع المستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذا الجناح فعليًا؛ وإلا فسيتم تخطيه لإبقاء `pnpm test:live` مركّزًا على اختبار دخان Gateway
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن profile وبدائل env الاحتياطية
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن profile** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح" و"مسار Gateway agent معطل"
  - يحتوي على اختبارات تراجع صغيرة ومعزولة (مثال: مسارات reasoning replay + tool-call الخاصة بـ OpenAI Responses/Codex Responses)

### الطبقة 2: اختبار دخان Gateway + وكيل dev (ما الذي يفعله "@openclaw" فعلًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (مع تجاوز النموذج في كل تشغيل)
  - التكرار على النماذج التي لها مفاتيح والتحقق من:
    - رد "ذي معنى" (من دون أدوات)
    - نجاح استدعاء أداة حقيقي (مجس `read`)
    - مجسات أدوات إضافية اختيارية (مجس `exec+read`)
    - استمرار عمل مسارات التراجع الخاصة بـ OpenAI (tool-call-only → follow-up)
- تفاصيل المجسات (حتى تتمكن من شرح الأعطال بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له ثم إعادة nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل كتابة nonce عبر `exec` في ملف مؤقت، ثم `read` له مجددًا.
  - مجس الصور: يرفق الاختبار ملف PNG مُنشأً (قط + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات المسح الحديثة/all الخاصة بالـ gateway افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين (لتجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون مجسات الأدوات + الصور مفعلة دائمًا في هذا الاختبار الحي:
  - مجس `read` + مجس `exec+read` (ضغط على الأدوات)
  - يعمل مجس الصور عندما يعلن النموذج دعم إدخال الصور
  - التدفق (على مستوى عالٍ):
    - ينشئ الاختبار ملف PNG صغيرًا يحتوي على “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` باستخدام `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (سماحية OCR: تُقبل الأخطاء الطفيفة)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: اختبار دخان الواجهة الخلفية CLI ‏(Claude أو Codex أو Gemini أو غيرها من أدوات CLI المحلية)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + agent باستخدام واجهة خلفية CLI محلية، من دون لمس الإعداد الافتراضي لديك.
- توجد الإعدادات الافتراضية لاختبار الدخان الخاصة بكل واجهة خلفية مع `cli-backend.ts` الخاص بالـ extension المالكة.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- القيم الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك command/args/image من بيانات Plugin الوصفية الخاصة بالواجهة الخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عندما يكون `IMAGE_ARG` مضبوطًا.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل مجس الاستمرارية الافتراضي داخل الجلسة نفسها من Claude Sonnet -> Opus (اضبطه إلى `1` لفرض تفعيله عندما يدعم النموذج المحدد هدف تحويل).

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
- يشغّل اختبار الدخان الحي للواجهة الخلفية CLI داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحلّ بيانات اختبار CLI الوصفية من الـ extension المالكة، ثم يثبت حزمة CLI المطابقة لنظام Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code عبر `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا نجاح `claude -p` المباشر داخل Docker، ثم يشغّل دورين لواجهة Gateway CLI-backend من دون الاحتفاظ بمتغيرات env الخاصة بمفتاح Anthropic API. يعطّل مسار الاشتراك هذا مجسات Claude MCP/tool والصور افتراضيًا لأن Claude يوجه حاليًا استخدام التطبيقات الخارجية عبر فوترة الاستخدام الإضافي بدل حدود خطة الاشتراك العادية.
- يمارس اختبار الدخان الحي للواجهة الخلفية CLI الآن التدفق الكامل نفسه من طرف إلى طرف لـ Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة `cron` عبر MCP والتحقق منه من خلال Gateway CLI.
- كما يرقّع اختبار الدخان الافتراضي لـ Claude الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما زالت تتذكر ملاحظة سابقة.

## Live: اختبار دخان ربط ACP ‏(`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي مع ACP agent حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل تركيبية في مكانها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من أن المتابعة تصل إلى سجل جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- القيم الافتراضية:
  - ACP agents في Docker: ‏`claude,codex,gemini`
  - ACP agent للاستدعاء المباشر `pnpm test:live ...`: ‏`claude`
  - القناة التركيبية: سياق محادثة بأسلوب Slack DM
  - الواجهة الخلفية ACP: ‏`acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- ملاحظات:
  - يستخدم هذا المسار سطح `chat.send` في Gateway مع حقول originating-route تركيبية للمشرف فقط، بحيث يمكن للاختبارات إرفاق سياق قناة الرسائل من دون الادعاء بإرسال خارجي.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المضمّن الخاص بـ Plugin `acpx` للوكيل المحدد في harness الخاص بـ ACP.

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
- افتراضيًا، يشغّل اختبار دخان ربط ACP مقابل كل CLI agents الحية المدعومة بالتتابع: `claude` ثم `codex` ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يقوم بتحميل `~/.profile`، وتجهيز مواد مصادقة CLI المطابقة داخل الحاوية، وتثبيت `acpx` في بادئة npm قابلة للكتابة، ثم يثبت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان مفقودًا.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` بحيث يحتفظ acpx بمتغيرات env الخاصة بالمزوّد من profile المحمّل متاحةً لـ CLI الفرعي الخاص بالـ harness.

## Live: اختبار دخان Codex app-server harness

- الهدف: التحقق من Codex harness المملوك للـ Plugin عبر الأسلوب العادي في Gateway
  `agent`:
  - تحميل Plugin `codex` المضمّن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دور Gateway agent إلى `codex/gpt-5.4`
  - إرسال دور ثانٍ إلى جلسة OpenClaw نفسها والتحقق من أن خيط
    app-server يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار
    أوامر Gateway نفسه
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- مجس صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- مجس MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- يضبط اختبار الدخان `OPENCLAW_AGENT_HARNESS_FALLBACK=none` بحيث لا يمكن
  لـ Codex harness المعطل أن ينجح عبر الرجوع بصمت إلى PI.
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
- يحمّل `~/.profile` المركّب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبت `@openai/codex` في بادئة npm قابلة للكتابة ومركّبة،
  ويجهّز شجرة المصدر، ثم يشغّل فقط الاختبار الحي لـ Codex-harness.
- يفعّل Docker مجسات الصور وMCP/tool افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أخطاء أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد
  الاختبار الحي بحيث لا يمكن لـ `openai-codex/*` أو الرجوع إلى PI
  إخفاء اختبار تراجع في Codex harness.

### وصفات live الموصى بها

تُعد قوائم السماح الضيقة والصريحة الأسرع والأقل عرضة للتعطل:

- نموذج واحد، مباشر (من دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار دخان Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google ‏(مفتاح API لـ Gemini + Antigravity):
  - Gemini ‏(مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity ‏(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API ‏(مفتاح API).
- يستخدم `google-antigravity/...` جسر OAuth الخاص بـ Antigravity ‏(نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- يستخدم `google-gemini-cli/...` أداة Gemini CLI المحلية على جهازك (مصادقة منفصلة + سلوكيات مختلفة للأدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP ‏(مصادقة بمفتاح API / profile)؛ وهذا هو ما يقصده معظم المستخدمين بـ "Gemini".
  - CLI: يستدعي OpenClaw ملف `gemini` الثنائي المحلي لديك؛ وله مصادقة خاصة به وقد يتصرف بشكل مختلف (الدفق/دعم الأدوات/اختلاف الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (لأن live اختياري)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير لديه مفاتيح.

### مجموعة الاختبار الحديثة السريعة (استدعاء الأدوات + الصور)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع أن يبقى عاملًا:

- OpenAI ‏(غير Codex): `openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google ‏(Gemini API): ‏`google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google ‏(Antigravity): ‏`google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI ‏(GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

شغّل اختبار دخان Gateway مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة مزوّدين:

- OpenAI: ‏`openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: ‏`anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: ‏`google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI ‏(GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: ‏`xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: ‏`mistral/`… (اختر نموذجًا واحدًا قادرًا على "tools" ومفعّلًا لديك)
- Cerebras: ‏`cerebras/`… (إذا كان لديك وصول)
- LM Studio: ‏`lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال الصور (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لممارسة مجس الصور.

### المجمعات / الـ Gateways البديلة

إذا كانت لديك مفاتيح مفعّلة، فإننا ندعم أيضًا الاختبار عبر:

- OpenRouter: ‏`openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: ‏`opencode/...` لـ Zen و`opencode-go/...` لـ Go ‏(المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزيد من المزوّدين الذين يمكنك تضمينهم في مصفوفة live ‏(إذا كانت لديك بيانات اعتماد/إعداد):

- مدمجون: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- عبر `models.providers` ‏(نقاط نهاية مخصصة): ‏`minimax` ‏(سحابي/API)، بالإضافة إلى أي proxy متوافق مع OpenAI/Anthropic ‏(LM Studio، وvLLM، وLiteLLM، إلخ)

نصيحة: لا تحاول ترميز "كل النماذج" مباشرة في الوثائق. فالقائمة المعتمدة هي ما يعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تُجرِ commit أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي تعمل بها CLI. ما يترتب عمليًا على ذلك:

- إذا كانت CLI تعمل، فيجب أن تعثر الاختبارات الحية على المفاتيح نفسها.
- إذا قال اختبار حي "لا توجد بيانات اعتماد"، فصحح المشكلة بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا هو المقصود بـ "مفاتيح profile" في الاختبارات الحية)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى home الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح profile الرئيسي)
- تنسخ تشغيلات live المحلية الإعداد النشط وملفات `auth-profiles.json` لكل وكيل و`credentials/` القديمة وأدلة مصادقة CLI الخارجية المدعومة إلى home اختباري مؤقت افتراضيًا؛ وتتخطى homes الحية المرحلية `workspace/` و`sandboxes/`، كما تُزال تجاوزات المسار `agents.*.workspace` / `agentDir` بحيث تبقى المجسات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح env ‏(مثلًا تلك المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (إذ يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram live ‏(تحويل الصوت إلى نص)

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
  - يمارس مسارات الصور والفيديو و`music_generate` المضمّنة الخاصة بـ comfy
  - يتخطى كل قدرة ما لم يتم إعداد `models.providers.comfy.<capability>`
  - مفيد بعد تغيير إرسال workflow الخاص بـ comfy أو polling أو التنزيلات أو تسجيل Plugin

## Image generation live

- الاختبار: `src/image-generation/runtime.live.test.ts`
- الأمر: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: ‏`pnpm test:live:media image`
- النطاق:
  - يعدد كل Plugin مزوّد لتوليد الصور مسجل
  - يحمّل متغيرات env الخاصة بالمزوّد الناقصة من login shell لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات auth profile المخزنة افتراضيًا، حتى لا تُخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/‏profile/نموذجًا صالحًا
  - يشغّل صيغ توليد الصور القياسية عبر قدرة وقت التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- المزوّدون المدمجون الحاليون المشمولون:
  - `openai`
  - `google`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل تجاوزات env فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: ‏`pnpm test:live:media music`
- النطاق:
  - يمارس المسار المشترك المضمّن لمزوّد توليد الموسيقى
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات env الخاصة بالمزوّد من login shell لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات auth profile المخزنة افتراضيًا، حتى لا تُخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/‏profile/نموذجًا صالحًا
  - يشغّل وضعي وقت التشغيل المعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد على prompt فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: ‏`generate`, `edit`
    - `minimax`: ‏`generate`
    - `comfy`: ملف Comfy live منفصل، وليس ضمن هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل تجاوزات env فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: ‏`pnpm test:live:media video`
- النطاق:
  - يمارس المسار المشترك المضمّن لمزوّد توليد الفيديو
  - يستخدم افتراضيًا مسار اختبار الدخان الآمن للإصدار: مزوّدون غير FAL، وطلب text-to-video واحد لكل مزوّد، وprompt لوبستر لمدة ثانية واحدة، وحد عملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن الانتظار في طوابير المزوّد قد يهيمن على زمن الإصدار؛ مرر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحة
  - يحمّل متغيرات env الخاصة بالمزوّد من login shell لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات auth profile المخزنة افتراضيًا، حتى لا تُخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/‏profile/نموذجًا صالحًا
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الصور المحلية المعتمد على buffer في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الفيديو المحلي المعتمد على buffer في المسح المشترك
  - المزوّدون الحاليون المعلنون لكن المتخطَّون في `imageToVideo` ضمن المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL بعيدًا للصورة
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف مسار `veo3` من text-to-video بالإضافة إلى مسار `kling` يستخدم fixture افتراضيًا بعنوان URL بعيد للصورة
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - المزوّدون الحاليون المعلنون لكن المتخطَّون في `videoToVideo` ضمن المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة بصيغة `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا معتمدًا على buffer وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لعمليات video inpaint/remix
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد العملية لكل مزوّد من أجل تشغيل اختبار دخان أكثر صرامة
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profile وتجاهل تجاوزات env فقط

## Media live harness

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل الأجنحة الحية المشتركة للصور والموسيقى والفيديو عبر نقطة دخول أصلية واحدة في المستودع
  - يحمّل تلقائيًا متغيرات env الخاصة بالمزوّد الناقصة من `~/.profile`
  - يضيّق تلقائيًا كل جناح إلى المزوّدين الذين يملكون حاليًا مصادقة قابلة للاستخدام افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يظل سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغلات Docker (اختبارات اختيارية من نوع "يعمل على Linux")

تنقسم مشغلات Docker هذه إلى فئتين:

- مشغلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف live المطابق المعتمد على مفاتيح profile داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل لديك (وتحميل `~/.profile` إذا كان مركبًا). ونقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker الحية افتراضيًا حدًا أصغر لاختبار الدخان حتى يبقى تشغيل Docker الكامل عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`،
  ويستخدم `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحة المسح الأكبر الشامل.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين.
- مشغلات اختبار دخان الحاويات: تقوم `test:docker:openwebui` و`test:docker:onboard` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:plugins` بتشغيل حاوية واحدة أو أكثر فعليًا والتحقق من مسارات integration ذات المستوى الأعلى.

تقوم مشغلات Docker للنماذج الحية أيضًا بتركيب homes مصادقة CLI المطلوبة فقط (أو كلها المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى home الحاوية قبل التشغيل بحيث يمكن لمصادقة OAuth الخاصة بأدوات CLI الخارجية تحديث tokens من دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- اختبار دخان ربط ACP: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`)
- اختبار دخان الواجهة الخلفية CLI: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- اختبار دخان Codex app-server harness: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل dev: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- اختبار دخان Open WebUI الحي: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، هيكل كامل): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- شبكات Gateway ‏(حاويتان، مصادقة WS + السلامة): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- جسر قناة MCP ‏(Gateway مُهيأ مسبقًا + جسر stdio + اختبار دخان إطار إشعارات Claude الخام): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins ‏(اختبار دخان التثبيت + الاسم البديل `/plugin` + دلالات إعادة تشغيل حزمة Claude): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)

تقوم مشغلات Docker للنماذج الحية أيضًا بتركيب السحب الحالي للشفرة للقراءة فقط
وتجهيزه في workdir مؤقت داخل الحاوية. وهذا يبقي صورة وقت التشغيل
نحيفة بينما لا يزال يشغّل Vitest على المصدر/الإعداد المحليين لديك بدقة.
تتخطى خطوة التجهيز caches المحلية الكبيرة فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` ومجلدات مخرجات
`.build` المحلية للتطبيقات أو Gradle، حتى لا تقضي تشغيلات Docker الحية
دقائق في نسخ artifacts خاصة بالجهاز.
كما تضبط أيضًا `OPENCLAW_SKIP_CHANNELS=1` بحيث لا تبدأ المجسات الحية لـ gateway
عمال قنوات حقيقية لـ Telegram/Discord/إلخ داخل الحاوية.
ولا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استبعاد تغطية gateway
الحية من مسار Docker هذا.
يُعد `test:docker:openwebui` اختبار دخان توافق ذي مستوى أعلى: فهو يبدأ
حاوية Gateway لـ OpenClaw مع تفعيل نقاط النهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة الإصدارة مقابل ذلك Gateway، ويسجل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يكشف `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر proxy ‏`/api/chat/completions` الخاص بـ Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI ولأن Open WebUI قد يحتاج إلى إكمال إعداد البدء البارد الخاص به.
يتوقع هذا المسار وجود مفتاح نموذج حي قابل للاستخدام، ويُعد `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) الوسيلة الأساسية لتوفيره في تشغيلات Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
أما `test:docker:mcp-channels` فهو حتمي عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يشغّل حاوية Gateway
مُهيأة مسبقًا، ويبدأ حاوية ثانية تستدعي `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءات السجل، وبيانات المرفقات الوصفية،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات بأسلوب Claude عبر جسر MCP الحقيقي المبني على stdio. ويفحص تحقق الإشعارات
إطارات MCP الخام عبر stdio مباشرةً بحيث يختبر اختبار الدخان ما
يصدره الجسر فعليًا، لا فقط ما تعرضه مكتبة SDK معينة للعميل.

اختبار ACP يدوي بخيط بلغة طبيعية بسيطة (ليس CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات عمل التراجع/تصحيح الأخطاء. فقد تكون هناك حاجة إليه مجددًا للتحقق من توجيه خيوط ACP، لذا لا تحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يُركب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يُركب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) يُركب إلى `/home/node/.profile` ويُحمّل قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات env التي تُحمّل من `OPENCLAW_PROFILE_FILE` فقط، باستخدام أدلة إعداد/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يُركب إلى `/home/node/.npm-global` لتثبيتات CLI المخزنة مؤقتًا داخل Docker
- تُركب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط ضمن `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - تركب التشغيلات المضيقة حسب المزوّد فقط الأدلة/الملفات اللازمة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة في التشغيلات المعادة التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن تأتي بيانات الاعتماد من مخزن profile ‏(وليس env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يكشفه Gateway لاختبار دخان Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt فحص nonce المستخدمة بواسطة اختبار دخان Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## التحقق السريع من الوثائق

شغّل فحوصات الوثائق بعد تعديلها: `pnpm check:docs`.
وشغّل التحقق الكامل من روابط Mintlify عند الحاجة إلى فحص العناوين داخل الصفحة أيضًا: `pnpm docs:check-links:anchors`.

## اختبار التراجع دون اتصال (آمن لـ CI)

هذه اختبارات تراجع لخط الأنابيب "الحقيقي" من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway ‏(mock OpenAI، وGateway + حلقة agent حقيقية): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway ‏(‏WS `wizard.start`/`wizard.next`، يكتب الإعداد + يفرض المصادقة): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمي عبر Gateway + حلقة agent الحقيقية (`src/gateway/gateway.test.ts`).
- تدفقات معالج كاملة من طرف إلى طرف تتحقق من ربط الجلسات وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما الذي لا يزال مفقودًا بالنسبة إلى Skills ‏(راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في prompt، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريو يستخدم مزوّدين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وربط الجلسات.
- جناح صغير من السيناريوهات المركزة على Skills ‏(الاستخدام مقابل التجنب، والبوابة، وحقن prompt).
- تقييمات live اختيارية (opt-in ومحكومة بـ env) فقط بعد توفر الجناح الآمن لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يلتزمان بعقد
الواجهة الخاص بهما. فهي تكرر على كل Plugins المكتشفة وتنفذ مجموعة
من عمليات التحقق الخاصة بالشكل والسلوك. ويتخطى مسار unit الافتراضي في `pnpm test`
عمدًا ملفات الدخان والواجهات المشتركة هذه؛ لذا شغّل أوامر العقود صراحةً
عندما تلمس أسطح القنوات أو المزوّدين المشتركة.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

توجد في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - شكل Plugin الأساسي (المعرّف، والاسم، والقدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف الخيط
- **directory** - واجهة API الخاصة بالدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

توجد في `src/plugins/contracts/*.contract.test.ts`.

- **status** - مجسات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّد

توجد في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API الخاصة بكتالوج النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى تُشغَّل

- بعد تغيير صادرات Plugin SDK أو المسارات الفرعية
- بعد إضافة Plugin قناة أو مزوّد أو تعديله
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافه

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات التراجع (إرشادات)

عندما تصلح مشكلة في مزوّد/نموذج اكتُشفت في live:

- أضف اختبار تراجع آمنًا لـ CI إن أمكن (مزوّد mock/stub، أو التقاط تحويل شكل الطلب الدقيق)
- إذا كانت المشكلة live-only بطبيعتها (حدود المعدل، وسياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا وopt-in عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ تحويل/إعادة تشغيل طلب المزوّد → اختبار النماذج المباشر
  - خطأ في مسار Gateway الخاص بالجلسة/السجل/الأداة → اختبار دخان Gateway الحي أو اختبار mock آمن لـ CI
- سياج حماية اجتياز SecretRef:
  - يشتق `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا نموذجيًا واحدًا لكل فئة SecretRef من بيانات registry الوصفية (`listSecretTargetRegistryEntries()`)، ثم يتحقق من رفض معرّفات exec لمقاطع الاجتياز.
  - إذا أضفت عائلة هدف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.
