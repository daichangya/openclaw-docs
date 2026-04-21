---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النموذج/المزوّد
    - تصحيح سلوك Gateway + الوكيل
summary: 'مجموعة الاختبارات: أجنحة unit/e2e/live، ومشغّلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-21T13:35:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3290113f28dab37f4b6ceb0bda6ced70c7d2b24ad3fccac6488b6aab1ad65e52
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاث مجموعات Vitest (unit/integration وe2e وlive) ومجموعة صغيرة من مشغّلات Docker.

هذا المستند هو دليل «كيف نختبر»:

- ما الذي تغطيه كل مجموعة اختبارات (وما الذي لا تغطيه عمدًا)
- ما الأوامر التي يجب تشغيلها لسير العمل الشائع (محليًا، قبل الدفع، تصحيح الأخطاء)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدين
- كيفية إضافة اختبارات انحدار لمشكلات النماذج/المزوّدين في العالم الحقيقي

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- استهداف ملف مباشر يوجّه الآن أيضًا مسارات plugin/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل أولًا التشغيلات المستهدفة عندما تكون تعمل على فشل واحد فقط.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بآلة Linux افتراضية: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تعدّل الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: `pnpm test:e2e`

عند تصحيح مزوّدين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (النماذج + فحوصات الأدوات/الصور في Gateway): `pnpm test:live`
- استهدف ملف live واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- فحص تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  بشكل معزول على `moonshot/kimi-k2.6`. تحقّق من أن JSON يبلّغ عن Moonshot/K2.6 وأن سجل المساعد يخزّن `usage.cost` الموحّد.

نصيحة: عندما تحتاج فقط إلى حالة فاشلة واحدة، ففضّل تضييق نطاق الاختبارات الحية عبر متغيرات بيئة قائمة السماح الموضحة أدناه.

## مشغّلات خاصة بـ QA

توجد هذه الأوامر إلى جانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية qa-lab:

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمّال Gateway معزولين. يستخدم `qa-channel` التزامن 4 افتراضيًا (ضمن عدد السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمّال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد المخرجات الفنية دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يقوم `aimock` بتشغيل خادم مزوّد محلي مدعوم بـ AIMock لتغطية تجريبية للتركيبات الثابتة ومحاكاة البروتوكول دون استبدال مسار `mock-openai` الواعي بالسيناريو.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل آلة Linux افتراضية مؤقتة عبر Multipass.
  - يحافظ على سلوك اختيار السيناريو نفسه مثل `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار المزوّد/النموذج نفسها مثل `qa suite`.
  - التشغيلات الحية تمرّر مدخلات مصادقة QA المدعومة التي تكون عملية للضيف:
    مفاتيح المزوّد المعتمدة على البيئة، ومسار إعداد مزوّد QA الحي، و`CODEX_HOME` عند وجوده.
  - يجب أن تبقى أدلة الإخراج ضمن جذر المستودع كي يتمكن الضيف من الكتابة إليها عبر مساحة العمل المركّبة.
  - يكتب تقرير QA والملخص المعتادين بالإضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm test:docker:bundled-channel-deps`
  - يحزم ويثبت بناء OpenClaw الحالي داخل Docker، ويبدأ Gateway مع تكوين OpenAI، ثم يفعّل Telegram وDiscord عبر تعديلات الإعداد.
  - يتحقق من أن أول إعادة تشغيل لـ Gateway تثبّت تبعيات وقت التشغيل لكل plugin قناة مضمّن عند الطلب، وأن إعادة التشغيل الثانية لا تعيد تثبيت التبعيات التي فُعّلت مسبقًا.
- `pnpm openclaw qa aimock`
  - يبدأ فقط خادم المزوّد AIMock المحلي لفحص البروتوكول المباشر.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix QA الحي مقابل خادم Tuwunel منزلي مؤقت ومدعوم بـ Docker.
  - مضيف QA هذا مخصص حاليًا للمستودع/التطوير فقط. لا تشحن تثبيتات OpenClaw المعبأة `qa-lab`، لذا فهي لا تعرض `openclaw qa`.
  - تستخدم نسخ المستودع مشغّلًا مضمّنًا مباشرة؛ لا حاجة إلى خطوة تثبيت plugin منفصلة.
  - يجهّز ثلاثة مستخدمين مؤقتين لـ Matrix (`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ عملية Gateway فرعية لـ QA مع plugin Matrix الحقيقي بوصفه ناقل SUT.
  - يستخدم صورة Tuwunel المستقرة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يعرّض Matrix علامات مصدر بيانات اعتماد مشتركة لأن المسار يجهّز مستخدمين مؤقتين محليًا.
  - يكتب تقرير Matrix QA وملخصًا ومخرجات observed-events وسجل خرج stdout/stderr الموحّد ضمن `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA الحي مقابل مجموعة خاصة حقيقية باستخدام رموز bot الخاصة بـ driver وSUT من البيئة.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. يجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المجمّعة المشتركة. استخدم وضع env افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` لاختيار التأجير من التجمع.
  - يخرج بقيمة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد المخرجات الفنية دون رمز خروج فاشل.
  - يتطلب botين مختلفين في المجموعة الخاصة نفسها، مع كشف bot الخاص بـ SUT عن اسم مستخدم Telegram.
  - لضمان ملاحظة مستقرة من bot إلى bot، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا الـ botين وتأكد من أن bot الخاص بـ driver يمكنه ملاحظة حركة bot داخل المجموعة.
  - يكتب تقرير Telegram QA وملخصًا ومخرجات observed-messages ضمن `.artifacts/qa-e2e/...`.

تشارك مسارات النقل الحية عقدًا قياسيًا واحدًا حتى لا تنحرف وسائل النقل الجديدة:

يبقى `qa-channel` مجموعة QA الاصطناعية الواسعة ولا يُعد جزءًا من مصفوفة تغطية النقل الحي.

| المسار | Canary | تقييد الإشارات | حظر قائمة السماح | ردّ المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة الخيط | عزل الخيط | ملاحظة التفاعلات | أمر المساعدة |
| ------ | ------ | -------------- | ---------------- | ------------------ | ------------------------- | ------------ | ---------- | ---------------- | ------------ |
| Matrix   | x      | x              | x                | x                  | x                         | x            | x          | x                |              |
| Telegram | x      |                |                  |                    |                           |              |            |                  | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex (الإصدار 1)

عند تفعيل `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) من أجل
`openclaw qa telegram`، يحصل QA lab على تأجير حصري من تجمع مدعوم بـ Convex، ويرسل Heartbeat
لهذا التأجير أثناء تشغيل المسار، ويحرر التأجير عند الإغلاق.

مرجع هيكل مشروع Convex:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` للدور `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` للدور `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: `--credential-role maintainer|ci`
  - الافتراضي من البيئة: `OPENCLAW_QA_CREDENTIAL_ROLE` (الافتراضي هو `ci` في CI و`maintainer` بخلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يتيح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` عناوين Convex من نوع `http://` على local loopback فقط للتطوير المحلي.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` الصيغة `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/سرد التجمع) تحديدًا
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` لإخراج قابل للقراءة آليًا في السكربتات وأدوات CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - الاستنفاد/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - حارس التأجير النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر maintainer فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

بنية الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن يكون `groupId` سلسلة تمثل معرّف دردشة Telegram رقميًا.
- يتحقق `admin/add` من هذه البنية عندما يكون `kind: "telegram"` ويرفض الحمولة غير الصحيحة.

### إضافة قناة إلى QA

تتطلب إضافة قناة إلى نظام QA المستند إلى Markdown أمرين فقط:

1. مهايئ نقل للقناة.
2. حزمة سيناريو تمارس عقد القناة.

لا تضف جذر أوامر QA جديدًا على المستوى الأعلى عندما يستطيع المضيف المشترك `qa-lab`
امتلاك هذا التدفق.

يمتلك `qa-lab` الآليات المشتركة للمضيف:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإيقافها
- تزامن العمّال
- كتابة المخرجات الفنية
- إنشاء التقارير
- تنفيذ السيناريوهات
- الأسماء المستعارة التوافقية لسيناريوهات `qa-channel` الأقدم

تمتلك Runner Plugins عقد النقل:

- كيف يتم تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيف يُضبط Gateway لهذا النقل
- كيف يتم التحقق من الجاهزية
- كيف تُحقن الأحداث الواردة
- كيف تُلاحظ الرسائل الصادرة
- كيف تُعرض السجلات النصية وحالة النقل الموحّدة
- كيف تُنفذ الإجراءات المدعومة بالنقل
- كيف تتم إعادة الضبط أو التنظيف الخاص بالنقل

الحد الأدنى المطلوب لاعتماد قناة جديدة هو:

1. إبقاء `qa-lab` مالكًا للجذر المشترك `qa`.
2. تنفيذ runner النقل على واجهة المضيف المشتركة `qa-lab`.
3. إبقاء آليات النقل الخاصة داخل Runner Plugin أو حاضنة القناة.
4. تركيب runner على أنه `openclaw qa <runner>` بدلًا من تسجيل جذر أوامر منافس.
   يجب أن تعلن Runner Plugins عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   اجعل `runtime-api.ts` خفيفًا؛ يجب أن يبقى التنفيذ الكسول لـ CLI وrunner خلف نقاط دخول منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown ضمن أدلة `qa/scenarios/` ذات الطابع المناسب.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. إبقاء الأسماء المستعارة التوافقية الحالية عاملة ما لم يكن المستودع ينفّذ ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا كان يمكن التعبير عن السلوك مرة واحدة داخل `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على ناقل قناة واحد، فأبقِه داخل Runner Plugin أو حاضنة plugin الخاصة به.
- إذا كان السيناريو يحتاج إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة داخل `suite.ts`.
- إذا كان السلوك ذا معنى فقط لناقل واحد، فأبقِ السيناريو خاصًا بذلك النقل واجعل ذلك صريحًا في عقد السيناريو.

الأسماء العامة المفضلة للمساعدات في السيناريوهات الجديدة هي:

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

يجب أن تستخدم أعمال القنوات الجديدة أسماء المساعدات العامة.
توجد الأسماء المستعارة التوافقية لتجنب ترحيل شامل في يوم واحد، لا كنموذج
لتأليف السيناريوهات الجديدة.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات على أنها «تزيد واقعيةً» (وتزيد معها القابلية للتذبذب/التكلفة):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: عشر تشغيلات شظايا متسلسلة (`vitest.full-*.config.ts`) عبر مشاريع Vitest الحالية محددة النطاق
- الملفات: مخزونات core/unit ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`، واختبارات `ui` الخاصة بـ node والمسموح بها التي يغطيها `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، الإعداد)
  - اختبارات انحدار حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - يشغّل `pnpm test` غير المستهدف الآن إحدى عشرة إعدادات شظايا أصغر (`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية واحدة ضخمة لمشروع جذري أصلي. هذا يقلل ذروة RSS على الأجهزة المحمّلة ويمنع أعمال auto-reply/extension من تجويع المجموعات غير ذات الصلة.
  - لا يزال `pnpm test --watch` يستخدم مخطط المشاريع الجذرية الأصلي `vitest.config.ts`، لأن حلقة مراقبة متعددة الشظايا ليست عملية.
  - تقوم `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` بتمرير أهداف الملفات/الأدلة الصريحة عبر المسارات محددة النطاق أولًا، لذا فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب كلفة بدء المشروع الجذري الكامل.
  - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى المسارات محددة النطاق نفسها عندما يلمس الفرق فقط ملفات مصدر/اختبار قابلة للتوجيه؛ أما تعديلات config/setup فتعود إلى إعادة تشغيل واسعة للمشروع الجذري.
  - يُعد `pnpm check:changed` البوابة المحلية الذكية المعتادة للأعمال الضيقة. فهو يصنّف الفرق إلى core واختبارات core وextensions واختبارات extension وapps وdocs وtooling، ثم يشغّل مسارات typecheck/lint/test المطابقة. تتضمن تغييرات Plugin SDK العامة وعقد plugin تحققًا من extensions لأن extensions تعتمد على عقود core هذه.
  - اختبارات unit الخفيفة الاستيراد من agents وcommands وplugins ومساعدات auto-reply و`plugin-sdk` والمناطق النفعية الخالصة المشابهة تمر عبر مسار `unit-fast` الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ أما الملفات ذات الحالة/الثقيلة وقت التشغيل فتبقى على المسارات الحالية.
  - تُطابِق بعض ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` أيضًا تشغيلات وضع changed مع اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
  - يملك `auto-reply` الآن ثلاث سلال مخصصة: مساعدات core ذات المستوى الأعلى، واختبارات integration ذات المستوى الأعلى `reply.*`، والشجرة الفرعية `src/auto-reply/reply/**`. هذا يُبقي أثقل أعمال حاضنة الرد بعيدًا عن اختبارات الحالة/القطع/الرموز الرخيصة.
- ملاحظة المشغّل المضمّن:
  - عندما تغيّر مدخلات اكتشاف أدوات الرسائل أو سياق وقت تشغيل Compaction،
    فحافظ على مستويي التغطية.
  - أضف اختبارات انحدار مركزة للمساعدات عند حدود التوجيه/التوحيد الخالصة.
  - كذلك أبقِ مجموعات integration الخاصة بالمشغّل المضمّن سليمة:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه المجموعات من أن المعرفات محددة النطاق وسلوك Compaction لا يزالان
    يمران عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تُعد اختبارات
    المساعدات وحدها بديلًا كافيًا عن مسارات integration هذه.
- ملاحظة التجمع:
  - أصبح إعداد Vitest الأساسي يستخدم `threads` افتراضيًا.
  - يثبت إعداد Vitest المشترك أيضًا `isolate: false` ويستخدم المشغّل غير المعزول عبر المشاريع الجذرية وe2e وإعدادات live.
  - يحتفظ مسار UI الجذري بإعداد `jsdom` والمُحسّن الخاصين به، لكنه يعمل الآن أيضًا على المشغّل غير المعزول المشترك.
  - ترث كل شظية من `pnpm test` الإعدادات الافتراضية نفسها `threads` + `isolate: false` من إعداد Vitest المشترك.
  - يضيف مشغّل التشغيل المشترك `scripts/run-vitest.mjs` الآن أيضًا `--no-maglev` افتراضيًا لعمليات Node الفرعية الخاصة بـ Vitest لتقليل اضطراب الترجمة في V8 أثناء التشغيلات المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت تحتاج إلى المقارنة مع سلوك V8 القياسي.
- ملاحظة التكرار المحلي السريع:
  - يوضح `pnpm changed:lanes` أي المسارات المعمارية يفعّلها الفرق.
  - يشغّل خطاف ما قبل الالتزام `pnpm check:changed --staged` بعد التنسيق/الـ lint للملفات المرحّلة، لذا لا تتحمل الالتزامات الخاصة بـ core فقط كلفة اختبارات extension ما لم تلمس عقودًا عامة موجهة إلى extension.
  - يمر `pnpm test:changed` عبر مسارات محددة النطاق عندما تطابق المسارات المتغيرة مجموعة أصغر بشكل نظيف.
  - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه نفسه، فقط مع حد أعلى أكبر للعمّال.
  - أصبح التحجيم التلقائي المحلي للعمّال متحفّظًا عمدًا الآن ويتراجع أيضًا عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تتسبب تشغيلات Vitest المتزامنة المتعددة بضرر أقل افتراضيًا.
  - يعلّم إعداد Vitest الأساسي ملفات المشاريع/الإعدادات على أنها `forceRerunTriggers` بحيث تبقى إعادة التشغيل في وضع changed صحيحة عندما تتغير توصيلات الاختبار.
  - يبقي الإعداد `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفات المدعومة؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد موقع cache صريحًا واحدًا لأغراض التحليل المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى خرج تفصيلي للاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` منظور التحليل نفسه إلى الملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه والمسار الأصلي للمشروع الجذري لذلك الفرق الملتزم، ويطبع زمن التنفيذ بالإضافة إلى macOS max RSS.
- يقيّم `pnpm test:perf:changed:bench -- --worktree` شجرة العمل المتسخة الحالية عبر تمرير قائمة الملفات المتغيرة إلى `scripts/test-projects.mjs` وإعداد Vitest الجذري.
  - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لزمن بدء Vitest/Vite وكلفة التحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap الخاصة بالمشغّل لمجموعة unit مع تعطيل التوازي على مستوى الملفات.

### E2E (فحص Gateway الدخاني)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- الإعدادات الافتراضية لوقت التشغيل:
  - يستخدم Vitest `threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمّالًا متكيّفين (CI: حتى 2، محليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمّال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تفعيل خرج وحدة التحكم التفصيلي.
- النطاق:
  - سلوك Gateway من طرف إلى طرف عبر عدة مثيلات
  - أسطح WebSocket/HTTP، واقتران Node، وشبكات أثقل
- التوقعات:
  - يعمل في CI (عند تفعيله في خط المعالجة)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: فحص OpenShell الخلفي الدخاني

- الأمر: `pnpm test:e2e:openshell`
- الملف: `test/openshell-sandbox.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يمارس الواجهة الخلفية OpenShell الخاصة بـ OpenClaw عبر `sandbox ssh-config` الحقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات القياسي البعيد عبر جسر نظام الملفات الخاص بـ sandbox
- التوقعات:
  - اشتراك اختياري فقط؛ ليس جزءًا من التشغيل الافتراضي `pnpm test:e2e`
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway الاختباري وsandbox
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو سكربت wrapper

### Live (مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - «هل يعمل هذا المزوّد/النموذج فعلًا _اليوم_ مع بيانات اعتماد حقيقية؟»
  - التقاط تغييرات تنسيق المزوّد، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقر على مستوى CI بحكم التصميم (شبكات حقيقية، وسياسات مزوّدين حقيقية، وحصص، وانقطاعات)
  - يكلّف مالًا / يستهلك حدود المعدل
  - يُفضَّل تشغيل مجموعات فرعية مضيّقة بدلًا من «كل شيء»
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضيًا، تظل التشغيلات الحية تعزل `HOME` وتنسخ مواد config/auth إلى مجلد رئيسي اختباري مؤقت حتى لا تتمكن تركيبات unit من تغيير `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية مجلدك الرئيسي الحقيقي.
- أصبح `pnpm test:live` يستخدم وضعًا أكثر هدوءًا افتراضيًا: فهو يبقي على خرج التقدم `[live] ...`، لكنه يخفي إشعار `~/.profile` الإضافي ويكتم سجلات إقلاع Gateway/ضوضاء Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات البدء الكاملة.
- تدوير مفاتيح API (خاص بالمزوّد): اضبط `*_API_KEYS` بتنسيق فاصلة/فاصلة منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (على سبيل المثال `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا لكل اختبار حي عبر `OPENCLAW_LIVE_*_KEY`؛ تعيد الاختبارات المحاولة عند استجابات حد المعدل.
- خرج التقدم/Heartbeat:
  - تُصدر المجموعات الحية الآن أسطر التقدم إلى stderr بحيث تبقى استدعاءات المزوّد الطويلة مرئية النشاط حتى عندما يكون التقاط وحدة التحكم في Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest بحيث تتدفق أسطر تقدم المزوّد/Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat للنموذج المباشر عبر `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاص بـ Gateway/probe عبر `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات Gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح «البوت الخاص بي متوقف» / الإخفاقات الخاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` ضمن نطاق مضيّق

## Live: مسح قدرات Node على Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلَن عنه حاليًا** بواسطة Android Node متصل، والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا تقوم المجموعة بتثبيت التطبيق أو تشغيله أو إقرانه).
  - تحقق `node.invoke` في Gateway أمرًا بأمر لعقدة Android المحددة.
- الإعداد المسبق المطلوب:
  - أن يكون تطبيق Android متصلًا ومقترنًا بالفعل مع Gateway.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع أن تنجح.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: فحص النماذج الدخاني (مفاتيح الملفات الشخصية)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- يوضح لنا «النموذج المباشر» ما إذا كان المزوّد/النموذج قادرًا على الرد أصلًا بالمفتاح المعطى.
- يوضح لنا «فحص Gateway الدخاني» ما إذا كان مسار Gateway+الوكيل الكامل يعمل لذلك النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال مباشر للنموذج (من دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات انحدار مستهدفة عند الحاجة)
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم مستعار لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها لإبقاء `pnpm test:live` مركزًا على فحص Gateway الدخاني
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم جولات modern/all افتراضيًا حدًا مُنسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لجولة modern شاملة، أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- لماذا هذا موجود:
  - يفصل بين «واجهة برمجة تطبيقات المزوّد معطلة / المفتاح غير صالح» و«مسار وكيل Gateway معطل»
  - يحتوي اختبارات انحدار صغيرة ومعزولة (مثال: OpenAI Responses/Codex Responses لإعادة تشغيل الاستدلال + تدفقات استدعاء الأدوات)

### الطبقة 2: فحص Gateway + وكيل dev الدخاني (ما الذي يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/تصحيح جلسة `agent:dev:*` (مع تجاوز النموذج لكل تشغيل)
  - التكرار عبر النماذج التي لديها مفاتيح والتحقق من:
    - استجابة «ذات معنى» (من دون أدوات)
    - نجاح استدعاء أداة حقيقية (فحص `read`)
    - فحوصات أدوات إضافية اختيارية (فحص `exec+read`)
    - استمرار عمل مسارات انحدار OpenAI (استدعاء-أداة-فقط ← متابعة)
- تفاصيل الفحص (حتى تتمكن من شرح الإخفاقات بسرعة):
  - فحص `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وإرجاع nonce.
  - فحص `exec+read`: يطلب الاختبار من الوكيل كتابة nonce عبر `exec` في ملف مؤقت، ثم `read` له مرة أخرى.
  - فحص الصورة: يرفق الاختبار ملف PNG مولدًا (قطة + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم جولات gateway modern/all افتراضيًا حدًا مُنسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لجولة modern شاملة، أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين (لتجنب «كل شيء عبر OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون فحوصات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار الحي:
  - فحص `read` + فحص `exec+read` (ضغط الأدوات)
  - يعمل فحص الصورة عندما يعلن النموذج دعمه لإدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولّد الاختبار ملف PNG صغيرًا مع “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: تحتوي الاستجابة على `cat` + الرمز (مع سماح OCR: الأخطاء البسيطة مقبولة)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: فحص CLI الخلفي الدخاني (Claude أو Codex أو Gemini أو غيرها من CLIs المحلية)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + الوكيل باستخدام واجهة CLI خلفية محلية، من دون المساس بإعدادك الافتراضي.
- توجد إعدادات الفحص الدخاني الافتراضية الخاصة بكل واجهة خلفية ضمن تعريف `cli-backend.ts` الخاص بـ extension المالكة.
- التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الإعدادات الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - سلوك الأمر/الوسائط/الصورة يأتي من بيانات تعريف واجهة CLI الخلفية الخاصة بـ plugin المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقية (تُحقن المسارات في الطلب).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في الطلب.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
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
- يشغّل فحص CLI الخلفي الحي داخل صورة Docker الخاصة بالمستودع بوصفه المستخدم غير الجذر `node`.
- يحلّ بيانات تعريف فحص CLI الدخاني من extension المالكة، ثم يثبّت حزمة Linux CLI المطابقة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth المحمولة لاشتراك Claude Code عبر أحد الخيارين: `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا نجاح `claude -p` المباشر داخل Docker، ثم يشغّل دورين لواجهة Gateway CLI الخلفية من دون الاحتفاظ بمتغيرات بيئة مفاتيح Anthropic API. يعطّل مسار الاشتراك هذا فحوصات Claude MCP/tool والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام التطبيقات الخارجية عبر فوترة استخدام إضافية بدلًا من حدود خطة الاشتراك العادية.
- يمارس فحص CLI الخلفي الحي الآن التدفق الكامل نفسه من طرف إلى طرف لكل من Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة MCP `cron` يتم التحقق منه عبر Gateway CLI.
- يقوم فحص Claude الافتراضي أيضًا بتصحيح الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## Live: فحص ربط ACP الدخاني (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة الحقيقي في ACP مع وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة synthetic message-channel في مكانها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من أن المتابعة تصل إلى سجل جلسة ACP المربوطة
- التمكين:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر عبر `pnpm test:live ...`: `claude`
  - القناة synthetic: سياق محادثة بأسلوب الرسائل الخاصة في Slack
  - واجهة ACP الخلفية: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- ملاحظات:
  - يستخدم هذا المسار سطح Gateway `chat.send` مع حقول originating-route synthetic مخصصة للمشرف فقط، بحيث تستطيع الاختبارات إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المدمج في plugin `acpx` المضمّنة لوكيل حاضنة ACP المحدد.

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
- افتراضيًا، يشغّل فحص ربط ACP الدخاني مقابل جميع وكلاء CLI الحية المدعومة بالتسلسل: `claude` ثم `codex` ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يستورد `~/.profile`، ويجهّز مواد مصادقة CLI المطابقة داخل الحاوية، ويثبت `acpx` في بادئة npm قابلة للكتابة، ثم يثبت واجهة CLI الحية المطلوبة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كانت مفقودة.
- داخل Docker، يضبط المشغّل `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` بحيث يحتفظ acpx بمتغيرات بيئة المزوّد من الملف الشخصي المستورد متاحة لواجهة CLI الفرعية الخاصة بالحاضنة.

## Live: فحص حاضنة Codex app-server الدخاني

- الهدف: التحقق من حاضنة Codex المملوكة لـ plugin عبر طريقة
  `agent` العادية في Gateway:
  - تحميل plugin المضمّنة `codex`
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دور وكيل في Gateway إلى `codex/gpt-5.4`
  - إرسال دور ثانٍ إلى جلسة OpenClaw نفسها والتحقق من أن خيط app-server
    يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أمر Gateway
    نفسه
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التمكين: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- فحص صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- يضبط الفحص الدخاني `OPENCLAW_AGENT_HARNESS_FALLBACK=none` بحيث لا يمكن
  لحاضنة Codex المعطلة أن تنجح عبر الرجوع الصامت إلى Pi.
- المصادقة: `OPENAI_API_KEY` من الصدفة/الملف الشخصي، بالإضافة إلى
  `~/.codex/auth.json` و`~/.codex/config.toml` المنسوخين اختياريًا

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
- يستورد `~/.profile` المركّب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبّت `@openai/codex` في بادئة npm مركّبة قابلة للكتابة،
  ويجهّز شجرة المصدر، ثم يشغّل فقط الاختبار الحي لحاضنة Codex.
- يفعّل Docker فحوصات الصورة وMCP/tool افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد
  الاختبار الحي حتى لا يتمكن الرجوع إلى `openai-codex/*` أو Pi من إخفاء
  انحدار في حاضنة Codex.

### الوصفات الحية الموصى بها

تكون قوائم السماح الضيقة والصريحة الأسرع والأقل تذبذبًا:

- نموذج واحد، مباشر (من دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، فحص Gateway دخاني:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز على Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلية على جهازك (مصادقة منفصلة وخصائص أدوات مختلفة).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مفتاح API / مصادقة الملف الشخصي)؛ وهذا ما يقصده معظم المستخدمين بكلمة “Gemini”.
  - CLI: يستدعي OpenClaw ملفًا ثنائيًا محليًا باسم `gemini`؛ وله مصادقته الخاصة ويمكن أن يتصرف بشكل مختلف (البث/دعم الأدوات/اختلاف الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد «قائمة نماذج CI» ثابتة (الاختبارات الحية اختيارية)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير يحوي مفاتيح.

### مجموعة الفحص الحديثة الدخانية (استدعاء الأدوات + الصور)

هذا هو تشغيل «النماذج الشائعة» الذي نتوقع أن يظل يعمل:

- OpenAI (غير Codex): `openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل فحص Gateway الدخاني مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة مزوّدين:

- OpenAI: `openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: `xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا يدعم “tools” ومفعّلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال الصور (مرفق ← رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل يدعم الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل Claude/Gemini/إصدارات OpenAI الداعمة للرؤية، إلخ) لتمرين فحص الصور.

### المجمعات / بوابات بديلة

إذا كانت لديك مفاتيح مفعّلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين يدعمون الأدوات + الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزيد من المزوّدين الذين يمكنك تضمينهم في المصفوفة الحية (إذا كانت لديك بيانات اعتماد/إعداد):

- مضمّنة: `openai` و`openai-codex` و`anthropic` و`google` و`google-vertex` و`google-antigravity` و`google-gemini-cli` و`zai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`groq` و`cerebras` و`mistral` و`github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي وكيل متوافق مع OpenAI/Anthropic (مثل LM Studio وvLLM وLiteLLM وغيرها)

نصيحة: لا تحاول تثبيت «كل النماذج» بشكل صلب في الوثائق. القائمة المعتمدة هي ما يعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تُضمَّن أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يفعلها CLI. الآثار العملية:

- إذا كان CLI يعمل، فيجب أن تجد الاختبارات الحية المفاتيح نفسها.
- إذا قال اختبار حي «لا توجد بيانات اعتماد»، فصحح المشكلة بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا ما تعنيه عبارة «مفاتيح الملف الشخصي» في الاختبارات الحية)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المجلد الرئيسي الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح الملف الشخصي الرئيسي)
- تنسخ التشغيلات المحلية الحية الإعداد النشط وملفات `auth-profiles.json` الخاصة بكل وكيل و`credentials/` القديمة وأدلة مصادقة CLI الخارجية المدعومة إلى مجلد رئيسي اختباري مؤقت افتراضيًا؛ وتتجاوز المجلدات الرئيسية الحية المرحلية `workspace/` و`sandboxes/`، كما تُزال تجاوزات المسار `agents.*.workspace` و`agentDir` حتى تبقى الفحوصات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح env (مثلًا المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (إذ يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram live (تفريغ الصوت)

- الاختبار: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- التمكين: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- الاختبار: `src/agents/byteplus.live.test.ts`
- التمكين: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- تجاوز نموذج اختياري: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يمارس مسارات comfy المضمّنة الخاصة بالصور والفيديو و`music_generate`
  - يتخطى كل قدرة ما لم يكن `models.providers.comfy.<capability>` مضبوطًا
  - مفيد بعد تغيير إرسال مهام comfy أو الاستطلاع أو التنزيلات أو تسجيل plugin

## Image generation live

- الاختبار: `src/image-generation/runtime.live.test.ts`
- الأمر: `pnpm test:live src/image-generation/runtime.live.test.ts`
- الحاضنة: `pnpm test:live:media image`
- النطاق:
  - يعدد كل plugin مزوّد لتوليد الصور مسجلة
  - يحمّل متغيرات env المفقودة للمزوّد من صدفة تسجيل الدخول (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا قابلًا للاستخدام
  - يشغّل متغيرات توليد الصور القياسية عبر قدرة وقت التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- المزوّدون المضمّنون المغطون حاليًا:
  - `openai`
  - `google`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحاضنة: `pnpm test:live:media music`
- النطاق:
  - يمارس مسار مزوّد توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات env للمزوّد من صدفة تسجيل الدخول (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا قابلًا للاستخدام
  - يشغّل وضعي وقت التشغيل المعلنين عند توفرهما:
    - `generate` مع إدخال يعتمد على prompt فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: `generate` و`edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحاضنة: `pnpm test:live:media video`
- النطاق:
  - يمارس المسار المشترك المضمّن لمزوّدات توليد الفيديو
  - يستخدم افتراضيًا مسار الفحص الدخاني الآمن للإصدار: مزوّدات غير FAL، وطلب text-to-video واحد لكل مزوّد، وprompt لوبستر لمدة ثانية واحدة، وحد عملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (الافتراضي `180000`)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الطابور لدى المزوّد قد يهيمن على زمن الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحة
  - يحمّل متغيرات env الخاصة بالمزوّد من صدفة تسجيل الدخول (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا قابلًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الصور المحلية المعتمد على buffer في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الفيديو المحلي المعتمد على buffer في المسح المشترك
  - مزوّدو `imageToVideo` المعلن عنهم حاليًا لكن المتخطَّون في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب URL صورة بعيدًا
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` لـ text-to-video بالإضافة إلى مسار `kling` يستخدم افتراضيًا fixture بعنوان URL صورة بعيد
  - التغطية الحية الحالية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزوّدو `videoToVideo` المعلن عنهم حاليًا لكن المتخطَّون في المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا معتمدًا على buffer وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات الوصول الخاصة بالمؤسسة لـ video inpaint/remix
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد كل عملية مزوّد لتشغيل فحص دخاني صارم
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## حاضنة media live

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل المجموعات الحية المشتركة للصور والموسيقى والفيديو عبر نقطة دخول واحدة أصلية للمستودع
  - يحمّل تلقائيًا متغيرات env المفقودة للمزوّد من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة إلى المزوّدين الذين لديهم حاليًا مصادقة قابلة للاستخدام افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مشغّلات Docker (اختبارات اختيارية من نوع "يعمل على Linux")

تنقسم مشغّلات Docker هذه إلى فئتين:

- مشغّلات النماذج الحية: `test:docker:live-models` و`test:docker:live-gateway` تشغّلان فقط ملف live المطابق لمفاتيح الملف الشخصي داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل الإعداد المحلي ومساحة العمل لديك (واستيراد `~/.profile` إذا تم تركيبه). نقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغّلات Docker الحية افتراضيًا حدًا أصغر للفحص الدخاني حتى يبقى مسح Docker الكامل عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحةً المسح الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها للمسارين الحيين في Docker.
- مشغّلات الفحص الدخاني للحاويات: `test:docker:openwebui` و`test:docker:onboard` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:plugins` تقلع حاوية واحدة أو أكثر حقيقية وتتحقق من مسارات integration أعلى مستوى.

تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب المجلدات الرئيسية للمصادقة الخاصة بـ CLI المطلوبة فقط (أو جميع المجلدات المدعومة عندما لا يكون التشغيل مضيّقًا)، ثم تنسخها إلى المجلد الرئيسي داخل الحاوية قبل التشغيل حتى يتمكن OAuth الخاص بالـ CLI الخارجي من تحديث الرموز دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` (السكربت: `scripts/test-live-models-docker.sh`)
- فحص ربط ACP الدخاني: `pnpm test:docker:live-acp-bind` (السكربت: `scripts/test-live-acp-bind-docker.sh`)
- فحص CLI الخلفي الدخاني: `pnpm test:docker:live-cli-backend` (السكربت: `scripts/test-live-cli-backend-docker.sh`)
- فحص حاضنة Codex app-server الدخاني: `pnpm test:docker:live-codex-harness` (السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل dev: `pnpm test:docker:live-gateway` (السكربت: `scripts/test-live-gateway-models-docker.sh`)
- فحص Open WebUI الحي الدخاني: `pnpm test:docker:openwebui` (السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج الإعداد الأولي (TTY، scaffolding كامل): `pnpm test:docker:onboard` (السكربت: `scripts/e2e/onboard-docker.sh`)
- شبكات Gateway (حاويتان، مصادقة WS + health): `pnpm test:docker:gateway-network` (السكربت: `scripts/e2e/gateway-network-docker.sh`)
- جسر قناة MCP (Gateway مهيأ مسبقًا + جسر stdio + فحص دخاني خام لإطار إشعارات Claude): `pnpm test:docker:mcp-channels` (السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (فحص تثبيت + الاسم المستعار `/plugin` + دلالات إعادة تشغيل Claude-bundle): `pnpm test:docker:plugins` (السكربت: `scripts/e2e/plugins-docker.sh`)

تقوم مشغّلات Docker الخاصة بالنماذج الحية أيضًا بتركيب النسخة الحالية من المستودع
للقراءة فقط وتجهيزها في workdir مؤقت داخل الحاوية. وهذا يبقي صورة وقت التشغيل
نحيفة بينما يظل يشغّل Vitest على المصدر/الإعداد المحلي المطابق لديك.
تتخطى خطوة التجهيز caches المحلية الكبيرة فقط ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` أو
مخرجات Gradle المحلية للتطبيق، بحيث لا تقضي تشغيلات Docker الحية دقائق في نسخ
القطع الأثرية الخاصة بالجهاز.
كما تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية عمّال
قنوات حقيقية مثل Telegram/Discord وغيرها داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر
`OPENCLAW_LIVE_GATEWAY_*` أيضًا عندما تحتاج إلى تضييق أو استبعاد تغطية
Gateway live من مسار Docker هذا.
يُعد `test:docker:openwebui` فحص توافقية دخانيًا أعلى مستوى: فهو يبدأ
حاوية Gateway لـ OpenClaw مع تفعيل نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبتة مقابل ذلك Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يعرض `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` الخاص بـ Open WebUI.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إنهاء إعداد البدء البارد الخاص به.
يتوقع هذا المسار مفتاح نموذج حيًا صالحًا، ويُعد `OPENCLAW_PROFILE_FILE`
(`~/.profile` افتراضيًا) الطريقة الأساسية لتوفيره في التشغيلات التي تستخدم Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
تم تصميم `test:docker:mcp-channels` ليكون حتميًا عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يقلع حاوية Gateway
مهيأة مسبقًا، ويبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءات السجل النصي، وبيانات المرفقات الوصفية،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. ويفحص التحقق من الإشعارات
إطارات stdio MCP الخام مباشرة، بحيث يتحقق الفحص الدخاني مما يصدره الجسر
فعليًا، لا فقط مما قد تعرضه مجموعة SDK لعميل معين.

فحص يدوي بلغة طبيعية لخيط ACP (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لأغراض الانحدار/التصحيح. فقد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذا لا تحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) يُركَّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) يُركَّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) يُركَّب إلى `/home/node/.profile` ويُستورد قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات env فقط المستوردة من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعداد/مساحة عمل مؤقتة ومن دون تركيبات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) يُركَّب إلى `/home/node/.npm-global` لتثبيتات CLI المخبأة داخل Docker
- تُركَّب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط ضمن `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - تشغّل المزوّدات المضيقة فقط الأدلة/الملفات المطلوبة المستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوزها يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة للتشغيلات المعادة التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن بيانات الاعتماد تأتي من مخزن الملفات الشخصية (وليس env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يعرضه Gateway لفحص Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt التحقق من nonce المستخدم بواسطة فحص Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## سلامة الوثائق

شغّل فحوصات الوثائق بعد تعديلات الوثائق: `pnpm check:docs`.
شغّل التحقق الكامل من anchors في Mintlify عندما تحتاج إلى فحوصات العناوين داخل الصفحة أيضًا: `pnpm docs:check-links:anchors`.

## اختبارات الانحدار دون اتصال (آمنة لـ CI)

هذه اختبارات انحدار لـ «مسار حقيقي» من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway (OpenAI وهمي، Gateway حقيقي + حلقة وكيل): `src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway (‏WS `wizard.start`/`wizard.next`، ويكتب config + auth بشكل مفروض): `src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل «تقييمات موثوقية الوكيل»:

- استدعاء أدوات وهمية عبر Gateway الحقيقي + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات معالج شاملة تتحقق من توصيل الجلسة وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا بالنسبة إلى Skills (راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في الطلب، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تتحقق من ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تظل التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم مزوّدين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وتوصيل الجلسة.
- مجموعة صغيرة من السيناريوهات المركزة على Skills (استخدام مقابل تجنب، البوابات، حقن الطلبات).
- تقييمات حية اختيارية (opt-in، ومقيّدة عبر env) فقط بعد وضع المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل plugin والقناة)

تتحقق اختبارات العقود من أن كل plugin وكل قناة مسجلة تتوافق مع
عقد الواجهة الخاص بها. فهي تكرّر على جميع plugins المكتشفة وتنفذ مجموعة من
تحققات الشكل والسلوك. يتخطى مسار unit الافتراضي `pnpm test` عمدًا هذه الملفات
المشتركة الخاصة بالحدود والفحوصات الدخانية؛ شغّل أوامر العقود صراحةً
عندما تلمس الأسطح المشتركة للقنوات أو المزوّدين.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي لـ plugin (المعرّف، الاسم، القدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - معالجة معرّف الخيط
- **directory** - واجهة برمجة تطبيقات الدليل/القائمة
- **group-policy** - فرض سياسة المجموعة

### عقود حالة المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّد

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة برمجة تطبيقات فهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب التشغيل

- بعد تغيير صادرات أو مسارات فرعية لـ plugin-sdk
- بعد إضافة plugin قناة أو مزوّد أو تعديلها
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافها

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات انحدار (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في live:

- أضف اختبار انحدار آمنًا لـ CI إن أمكن (مزوّد وهمي/بديل، أو التقط تحويل شكل الطلب الدقيق)
- إذا كانت المشكلة حية فقط بطبيعتها (حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب المزوّد → اختبار النماذج المباشرة
  - خطأ في مسار جلسة Gateway/السجل/الأدوات → فحص Gateway الحي الدخاني أو اختبار Gateway وهمي آمن لـ CI
- حاجز SecretRef لاجتياز المسار:
  - يستخرج `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا نموذجيًا واحدًا لكل فئة SecretRef من بيانات تعريف السجل (`listSecretTargetRegistryEntries()`)، ثم يتحقق من رفض معرّفات exec الخاصة بمقاطع الاجتياز.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند معرّفات الأهداف غير المصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.
