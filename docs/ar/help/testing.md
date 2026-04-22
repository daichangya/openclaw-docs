---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات تراجعية لأخطاء النموذج/المزوّد
    - تصحيح سلوك Gateway والوكيل
summary: 'عدة الاختبار: مجموعات unit/e2e/live، وDocker runners، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-22T04:23:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7309f596dc0fd8b6dac936be74af1c8b4aa1dccc98e169a6b6934206547a0ca
    source_path: help/testing.md
    workflow: 15
---

# الاختبار

يحتوي OpenClaw على ثلاث مجموعات Vitest ‏(unit/integration وe2e وlive) ومجموعة صغيرة من Docker runners.

هذه الوثيقة هي دليل "كيف نختبر":

- ما الذي تغطيه كل مجموعة (وما الذي **لا** تغطيه عمدًا)
- ما الأوامر التي يجب تشغيلها في سير العمل الشائع (محلي، قبل الدفع، التصحيح)
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/المزوّدين
- كيفية إضافة اختبارات تراجعية لمشكلات النماذج/المزوّدين في العالم الحقيقي

## بداية سريعة

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل الدفع): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة مراقبة Vitest مباشرة: `pnpm test:watch`
- يستهدف التوجيه المباشر للملفات الآن أيضًا مسارات extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل التشغيلات المستهدفة أولًا عندما تكون تعمل على تكرار فشل واحد.
- موقع QA مدعوم بـ Docker: ‏`pnpm qa:lab:up`
- مسار QA مدعوم بـ Linux VM: ‏`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة Coverage: ‏`pnpm test:coverage`
- مجموعة E2E: ‏`pnpm test:e2e`

عند تصحيح مزوّدين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (النماذج + فحوصات أدوات/صور Gateway): ‏`pnpm test:live`
- استهدف ملف live واحدًا بهدوء: ‏`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- فحص تكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  بشكل معزول على `moonshot/kimi-k2.6`. وتحقق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  transcript الخاص بالمساعد يخزن `usage.cost` المُطبّع.

نصيحة: عندما تحتاج إلى حالة فاشلة واحدة فقط، ففضّل تضييق الاختبارات الحية عبر متغيرات البيئة الخاصة بقائمة السماح الموضحة أدناه.

## Runner خاصة بـ QA

توجد هذه الأوامر بجانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرة على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال Gateway معزولين. ويستخدم `qa-channel` افتراضيًا تزامنًا بقيمة 4 (ضمن حد عدد السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال، أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج بحالة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد artifacts من دون رمز خروج فاشل.
  - يدعم أوضاع المزوّد `live-frontier` و`mock-openai` و`aimock`.
    يقوم `aimock` بتشغيل خادم مزوّد محلي مدعوم بـ AIMock لتغطية تجريبية للتركيبات الثابتة ومحاكاة البروتوكول من دون استبدال مسار `mock-openai` الواعي بالسيناريو.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل Linux VM مؤقتة عبر Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه الموجود في `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار المزوّد/النموذج نفسها الموجودة في `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح المزوّد القائمة على env، ومسار إعدادات مزوّد QA الحي، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة الإخراج تحت جذر المستودع حتى يتمكن الضيف من الكتابة
    عبر مساحة العمل المركبة.
  - تكتب تقرير QA العادي + الملخص بالإضافة إلى سجلات Multipass تحت
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA بأسلوب المشغّل.
- `pnpm test:docker:bundled-channel-deps`
  - يعبّئ ويثبّت build الحالي لـ OpenClaw داخل Docker، ويبدأ Gateway
    مع إعداد OpenAI، ثم يفعّل Telegram وDiscord عبر تعديلات config.
  - يتحقق من أن أول إعادة تشغيل لـ Gateway تثبّت تبعيات وقت التشغيل لكل Plugin قناة مضمّنة عند الطلب، وأن إعادة التشغيل الثانية لا تعيد تثبيت
    التبعيات التي تم تفعيلها بالفعل.
  - يثبّت أيضًا baseline قديمًا معروفًا من npm، ويفعّل Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ويتحقق من أن
    doctor الخاص بالمرشح بعد التحديث يصلح تبعيات وقت تشغيل القنوات المضمنة دون
    إصلاح postinstall من جهة harness.
- `pnpm openclaw qa aimock`
  - يشغّل فقط خادم المزوّد المحلي AIMock لفحص البروتوكول مباشرة.
- `pnpm openclaw qa matrix`
  - يشغّل مسار QA الحي لـ Matrix مقابل homeserver مؤقت مدعوم بـ Docker من Tuwunel.
  - مضيف QA هذا مخصص حاليًا للمستودع/التطوير فقط. لا تشحن تثبيتات OpenClaw المعبأة
    `qa-lab`، لذا فهي لا تعرض `openclaw qa`.
  - تحمّل عمليات سحب المستودع runner المضمّن مباشرة؛ ولا حاجة إلى
    خطوة تثبيت Plugin منفصلة.
  - يوفّر ثلاثة مستخدمين مؤقتين لـ Matrix ‏(`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ child خاصًا بـ QA gateway مع Plugin Matrix الحقيقي كناقل SUT.
  - يستخدم صورة Tuwunel المستقرة المثبّتة `ghcr.io/matrix-construct/tuwunel:v1.5.1` افتراضيًا. تجاوزها باستخدام `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يوفّر Matrix علامات مشتركة لمصدر بيانات الاعتماد لأن المسار يوفّر مستخدمين مؤقتين محليًا.
  - يكتب تقرير QA لـ Matrix، وملخصًا، وartifact للأحداث المرصودة، وسجل إخراج stdout/stderr مدمج تحت `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار QA الحي لـ Telegram مقابل مجموعة خاصة حقيقية باستخدام driver وSUT bot token من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ويجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram رقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمّعة. استخدم وضع env افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` لاختيار عقود التأجير المجمعة.
  - يخرج بحالة غير صفرية عند فشل أي سيناريو. استخدم `--allow-failures` عندما تريد artifacts من دون رمز خروج فاشل.
  - يتطلب botين مختلفين في المجموعة الخاصة نفسها، مع كشف SUT bot عن اسم مستخدم Telegram.
  - لمراقبة مستقرة بين bot وآخر، فعّل Bot-to-Bot Communication Mode في `@BotFather` لكلا botين وتأكد من أن driver bot يمكنه مراقبة حركة bot داخل المجموعة.
  - يكتب تقرير QA لـ Telegram، وملخصًا، وartifact للرسائل المرصودة تحت `.artifacts/qa-e2e/...`.

تشارك المسارات الحية للنقل عقدًا قياسيًا واحدًا حتى لا تنحرف وسائل النقل الجديدة:

يبقى `qa-channel` مجموعة QA الاصطناعية الواسعة وليس جزءًا من مصفوفة تغطية النقل الحي.

| المسار | Canary | تقييد الإشارات | حظر قائمة السماح | رد على المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة الخيط | عزل الخيط | مراقبة التفاعلات | أمر المساعدة |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex ‏(v1)

عند تمكين `--credential-source convex` (أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) لـ
`openclaw qa telegram`، تحصل QA lab على عقد إيجار حصري من مجمع مدعوم بـ Convex، وترسل Heartbeat
لهذا العقد أثناء تشغيل المسار، ثم تطلقه عند الإيقاف.

مرجع هيكل مشروع Convex:

- `qa/convex-credential-broker/`

متغيرات env المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` (مثل `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` للدور `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` للدور `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: ‏`--credential-role maintainer|ci`
  - env الافتراضي: ‏`OPENCLAW_QA_CREDENTIAL_ROLE` (الافتراضي `ci` في CI، و`maintainer` بخلاف ذلك)

متغيرات env الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين URL لـ Convex من نوع `http://` على local loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البروتوكول `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بـ maintainer ‏(إضافة/إزالة/عرض المجمع)
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` للحصول على إخراج قابل للقراءة آليًا في النصوص البرمجية وأدوات CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - نفاد/قابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - حارس عقد إيجار نشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (سر maintainer فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن تكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل لـ `kind: "telegram"` ويرفض الحمولات غير الصحيحة.

### إضافة قناة إلى QA

تتطلب إضافة قناة إلى نظام QA المعتمد على Markdown أمرين فقط:

1. محول نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أوامر QA جديدًا على المستوى الأعلى عندما يمكن لمضيف `qa-lab` المشترك
امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- تزامن العمال
- كتابة artifacts
- إنشاء التقارير
- تنفيذ السيناريوهات
- أسماء التوافق البديلة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins الخاصة بـ runner عقد النقل:

- كيفية تركيب `openclaw qa <runner>` تحت الجذر المشترك `qa`
- كيفية إعداد Gateway لهذا النقل
- كيفية فحص الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية مراقبة الرسائل الصادرة
- كيفية كشف transcripts وحالة النقل المُطبّعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة الضبط أو التنظيف الخاصة بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. أبقِ `qa-lab` مالكًا لجذر `qa` المشترك.
2. نفّذ transport runner على واجهة المضيف المشتركة `qa-lab`.
3. أبقِ الآليات الخاصة بالنقل داخل Plugin الخاصة بـ runner أو harness الخاص بالقناة.
4. اربط runner تحت `openclaw qa <runner>` بدلًا من تسجيل أمر جذر منافس.
   يجب أن تعلن Plugins الخاصة بـ runner عن `qaRunners` في `openclaw.plugin.json` وأن تصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   اجعل `runtime-api.ts` خفيفًا؛ ويجب أن يبقى تنفيذ CLI وrunner الكسول خلف نقاط دخول منفصلة.
5. اكتب أو عدّل سيناريوهات Markdown تحت الأدلة ذات الطابع `qa/scenarios/`.
6. استخدم مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. أبقِ أسماء التوافق البديلة الحالية تعمل ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على transport قناة واحدة، فأبقِه في Plugin الخاصة بـ runner أو harness الخاص بذلك Plugin.
- إذا كان السيناريو يحتاج قدرة جديدة يمكن أن تستخدمها أكثر من قناة واحدة، فأضف مساعدًا عامًا بدلًا من فرع خاص بقناة في `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بذلك النقل ووضّح ذلك صراحةً في عقد السيناريو.

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

تظل أسماء التوافق البديلة متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم أعمال القنوات الجديدة أسماء المساعدات العامة.
توجد أسماء التوافق البديلة لتجنب ترحيل شامل دفعة واحدة، وليست النموذج
المطلوب لتأليف السيناريوهات الجديدة.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات باعتبارها "واقعية متزايدة" (وتذبذبًا/تكلفة متزايدين):

### Unit / integration (الافتراضي)

- الأمر: `pnpm test`
- الإعداد: عشرة تشغيلات shard متسلسلة (`vitest.full-*.config.ts`) على مشاريع Vitest المقيّدة الحالية
- الملفات: مخزونات core/unit تحت `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts`، واختبارات `ui` المسموح بها والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة Gateway، التوجيه، الأدوات، التحليل، config)
  - اختبارات تراجعية حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تحتاج إلى مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
- ملاحظة المشاريع:
  - يشغّل `pnpm test` غير المستهدف الآن أحد عشر إعداد shard أصغر (`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية root-project أصلية ضخمة واحدة. وهذا يقلل ذروة RSS على الأجهزة المحمّلة ويمنع أعمال auto-reply/extension من تجويع المجموعات غير ذات الصلة.
  - لا يزال `pnpm test --watch` يستخدم مخطط المشروع الأصلي root `vitest.config.ts`، لأن حلقة watch متعددة الـ shards غير عملية.
  - توجّه أوامر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أهداف الملفات/الأدلة الصريحة عبر المسارات المقيّدة أولًا، لذا فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب تكلفة بدء root project الكاملة.
  - يوسّع `pnpm test:changed` مسارات git المتغيرة إلى المسارات المقيّدة نفسها عندما يلمس diff فقط ملفات المصدر/الاختبار القابلة للتوجيه؛ بينما تعود تعديلات config/setup إلى إعادة التشغيل الواسعة لـ root-project.
  - يُعد `pnpm check:changed` البوابة المحلية الذكية العادية للأعمال الضيقة. فهو يصنف diff إلى core، واختبارات core، وextensions، واختبارات extension، وapps، وdocs، وبيانات الإصدار الوصفية، وtooling، ثم يشغّل مسارات typecheck/lint/test المطابقة. وتشمل تغييرات Plugin SDK العامة وعقود Plugin التحقق من extensions لأن extensions تعتمد على هذه العقود الأساسية. وتنفّذ تغييرات بيانات الإصدار الوصفية فقط فحوصات مستهدفة للإصدار/config/اعتماديات الجذر بدلًا من المجموعة الكاملة، مع حارس يرفض تغييرات package خارج حقل الإصدار الأعلى.
  - تُوجَّه اختبارات unit الخفيفة في الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدات auto-reply، و`plugin-sdk`، والمناطق الخدمية الخالصة المشابهة عبر مسار `unit-fast`، الذي يتخطى `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات الثقيلة من حيث الحالة/وقت التشغيل على المسارات الحالية.
  - تُعيَّن أيضًا بعض ملفات المصدر المساعدة المحددة ضمن `plugin-sdk` و`commands` في تشغيلات الوضع المتغير إلى اختبارات أشقاء صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل.
  - يحتوي `auto-reply` الآن على ثلاث سلال مخصصة: مساعدات core من المستوى الأعلى، واختبارات integration من المستوى الأعلى `reply.*`، والشجرة الفرعية `src/auto-reply/reply/**`. وهذا يبقي أعمال harness الأثقل للردود بعيدًا عن اختبارات الحالة/التجزئة/الرموز الرخيصة.
- ملاحظة runner المضمّن:
  - عندما تغيّر مدخلات اكتشاف message-tool أو سياق وقت تشغيل Compaction،
    فأبقِ مستويي التغطية معًا.
  - أضف اختبارات تراجعية مركزة للمساعدات الخاصة بحدود التوجيه/التطبيع الخالصة.
  - وأبقِ أيضًا مجموعات integration الخاصة بـ embedded runner سليمة:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - تتحقق هذه المجموعات من أن المعرّفات المقيّدة وسلوك Compaction ما زالا يتدفقان
    عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تُعد اختبارات المساعدات وحدها
    بديلًا كافيًا لهذه المسارات التكاملية.
- ملاحظة مجموعة التنفيذ:
  - يعتمد config الأساسي لـ Vitest الآن على `threads` افتراضيًا.
  - كما يثبت config المشترك لـ Vitest أيضًا `isolate: false` ويستخدم runner غير المعزول عبر مشاريع الجذر وإعدادات e2e وlive.
  - يحتفظ مسار UI الجذري بإعداد `jsdom` والمُحسِّن الخاص به، لكنه يعمل الآن على runner المشترك غير المعزول أيضًا.
  - يرث كل shard في `pnpm test` الإعدادات الافتراضية نفسها `threads` + `isolate: false` من config المشترك لـ Vitest.
  - يضيف المشغّل المشترك `scripts/run-vitest.mjs` الآن أيضًا `--no-maglev` إلى عمليات Node التابعة لـ Vitest افتراضيًا لتقليل تقلبات التجميع في V8 أثناء التشغيلات المحلية الكبيرة. اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` إذا كنت تحتاج إلى المقارنة مع سلوك V8 القياسي.
- ملاحظة التكرار المحلي السريع:
  - يعرض `pnpm changed:lanes` المسارات المعمارية التي يطلقها diff.
  - يشغّل hook الخاص بما قبل commit الأمر `pnpm check:changed --staged` بعد تنسيق/lint للملفات staged، لذا لا تدفع commits الخاصة بـ core فقط تكلفة اختبارات extension إلا إذا كانت تلمس عقودًا عامة موجهة إلى extension. وتبقى commits الخاصة ببيانات الإصدار الوصفية فقط على مسار الإصدار/config/اعتماديات الجذر المستهدف.
  - يمرر `pnpm test:changed` عبر المسارات المقيّدة عندما تتطابق المسارات المتغيرة بوضوح مع مجموعة أصغر.
  - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بالسلوك التوجيهي نفسه، فقط مع حد أعلى للعمال.
  - أصبح الضبط التلقائي المحلي للعمال محافظًا عمدًا الآن، كما أنه يتراجع عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تتسبب تشغيلات Vitest المتزامنة المتعددة بضرر أقل افتراضيًا.
  - يحدد config الأساسي لـ Vitest ملفات المشاريع/config كـ `forceRerunTriggers` بحيث تبقى إعادة التشغيل في الوضع المتغير صحيحة عند تغيير wiring الاختبارات.
  - يبقي config على `OPENCLAW_VITEST_FS_MODULE_CACHE` مفعّلًا على المضيفات المدعومة؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا أردت موقع cache صريحًا واحدًا للتحليل المباشر.
- ملاحظة تصحيح الأداء:
  - يفعّل `pnpm test:perf:imports` تقارير مدة استيراد Vitest بالإضافة إلى مخرجات تفصيل الاستيراد.
  - يقيّد `pnpm test:perf:imports:changed` عرض التحليل نفسه إلى الملفات المتغيرة منذ `origin/main`.
- يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين `test:changed` الموجّه والمسار الأصلي لـ root-project لذلك diff الملتزم ويطبع وقت التنفيذ وmacOS max RSS.
- يقيس `pnpm test:perf:changed:bench -- --worktree` الشجرة الحالية غير النظيفة عبر توجيه قائمة الملفات المتغيرة من خلال `scripts/test-projects.mjs` وconfig الجذر لـ Vitest.
  - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي لوقت بدء Vitest/Vite وتكلفة التحويل.
  - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap الخاصة بـ runner لمجموعة unit مع تعطيل التوازي على مستوى الملفات.

### E2E (فحص Gateway دخاني)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- الإعدادات الافتراضية لوقت التشغيل:
  - يستخدم Vitest ‏`threads` مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمالًا متكيفين (CI: حتى 2، ومحليًا: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل كلفة إدخال/إخراج وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين إخراج وحدة التحكم التفصيلي.
- النطاق:
  - سلوك Gateway من طرف إلى طرف متعدد المثيلات
  - أسطح WebSocket/HTTP، وإقران Node، وشبكات أثقل
- التوقعات:
  - يعمل في CI (عند تمكينه في خط الأنابيب)
  - لا يحتاج إلى مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit (وقد يكون أبطأ)

### E2E: فحص OpenShell backend دخاني

- الأمر: `pnpm test:e2e:openshell`
- الملف: `test/openshell-sandbox.e2e.test.ts`
- النطاق:
  - يبدأ Gateway معزولًا لـ OpenShell على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يختبر OpenShell backend في OpenClaw عبر `sandbox ssh-config` الحقيقي + تنفيذ SSH
  - يتحقق من سلوك نظام الملفات canonical عن بُعد عبر جسر sandbox fs
- التوقعات:
  - اختياري فقط؛ وليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عامل
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر Gateway وsandbox الخاصين بالاختبار
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي أو script wrapper غير افتراضي

### Live (مزوّدون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts`
- الافتراضي: **مفعّل** عبر `pnpm test:live` (يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا المزوّد/النموذج فعلًا _اليوم_ ببيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق المزوّد، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقرة في CI بطبيعتها (شبكات حقيقية، وسياسات مزوّدين حقيقية، وحصص، وانقطاعات)
  - تكلف مالًا / تستهلك حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية ضيقة بدلًا من "كل شيء"
- تستورد التشغيلات الحية الملف `~/.profile` لالتقاط مفاتيح API الناقصة.
- افتراضيًا، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد config/auth إلى home اختباري مؤقت حتى لا تتمكن تركيبات unit الثابتة من تعديل `~/.openclaw` الحقيقي لديك.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تحتاج عمدًا إلى أن تستخدم الاختبارات الحية دليل home الحقيقي لديك.
- يعتمد `pnpm test:live` الآن وضعًا أكثر هدوءًا افتراضيًا: فهو يبقي مخرجات التقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي ويسكت سجلات bootstrap الخاصة بـ Gateway وضوضاء Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا أردت استعادة سجلات بدء التشغيل الكاملة.
- تدوير مفاتيح API ‏(خاص بكل مزوّد): اضبط `*_API_KEYS` بتنسيق فاصلة/فاصلة منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` (مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو استخدم تجاوزًا لكل live عبر `OPENCLAW_LIVE_*_KEY`؛ وتعيد الاختبارات المحاولة عند استجابات حدود المعدل.
- مخرجات التقدم/Heartbeat:
  - تصدر المجموعات الحية الآن أسطر التقدم إلى stderr بحيث تكون مكالمات المزوّد الطويلة مرئية كنشاط حتى عندما يكون التقاط وحدة التحكم في Vitest هادئًا.
  - يعطّل `vitest.live.config.ts` اعتراض وحدة التحكم في Vitest بحيث تتدفق أسطر تقدم المزوّد/‏Gateway فورًا أثناء التشغيلات الحية.
  - اضبط Heartbeat النماذج المباشرة بواسطة `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط Heartbeat الخاصة بـ Gateway/probe بواسطة `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` (وأيضًا `pnpm test:coverage` إذا غيّرت الكثير)
- عند لمس شبكات Gateway / بروتوكول WS / الإقران: أضف `pnpm test:e2e`
- عند تصحيح "bot الخاص بي متوقف" / الأعطال الخاصة بالمزوّد / استدعاء الأدوات: شغّل `pnpm test:live` بشكل مقيّد

## Live: فحص شامل لقدرات Android node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن عنه حاليًا** بواسطة Android node متصل، والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد يدوي/مسبق الشرط (لا تقوم المجموعة بتثبيت التطبيق أو تشغيله أو إقرانه).
  - التحقق من `node.invoke` في Gateway لكل أمر على Android node المحدد.
- الإعداد المطلوب مسبقًا:
  - أن يكون تطبيق Android متصلًا ومقترنًا بالفعل مع Gateway.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## Live: فحص النموذج الدخاني (مفاتيح profile)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الأعطال:

- يخبرنا "النموذج المباشر" ما إذا كان المزوّد/النموذج يستطيع الرد أصلًا باستخدام المفتاح المعطى.
- يخبرنا "فحص Gateway الدخاني" ما إذا كان خط أنابيب Gateway+agent الكامل يعمل لهذا النموذج (الجلسات، السجل، الأدوات، سياسة sandbox، إلخ).

### الطبقة 1: إكمال مباشر للنموذج (من دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات تراجعية مستهدفة عند الحاجة)
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها لإبقاء `pnpm test:live` مركزًا على فحص Gateway الدخاني
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن profiles وبدائل env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن profiles** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح" و"خط أنابيب Gateway agent معطل"
  - يحتوي اختبارات تراجعية صغيرة ومعزولة (مثال: OpenAI Responses/Codex Responses مع إعادة تشغيل reasoning + تدفقات استدعاء الأدوات)

### الطبقة 2: فحص Gateway + dev agent الدخاني (ما الذي يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/تصحيح جلسة `agent:dev:*` (مع تجاوز النموذج لكل تشغيل)
  - التكرار على النماذج التي لها مفاتيح والتحقق من:
    - استجابة "ذات معنى" (من دون أدوات)
    - نجاح استدعاء أداة حقيقي (فحص `read`)
    - فحوصات أدوات إضافية اختيارية (فحص `exec+read`)
    - استمرار عمل مسارات OpenAI التراجعية (استدعاء أداة فقط ← متابعة)
- تفاصيل الفحوصات (حتى تتمكن من تفسير الأعطال بسرعة):
  - فحص `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل أن `read` له ويعيد nonce.
  - فحص `exec+read`: يطلب الاختبار من الوكيل أن يكتب nonce عبر `exec` إلى ملف مؤقت، ثم `read` له مرة أخرى.
  - فحص الصورة: يرفق الاختبار ملف PNG مولدًا (قطة + رمز عشوائي) ويتوقع من النموذج أن يعيد `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.x + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات gateway الحديثة/all افتراضيًا حدًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
- كيفية اختيار المزوّدين (لتجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون فحوصات الأدوات + الصور مفعلة دائمًا في هذا الاختبار الحي:
  - فحص `read` + فحص `exec+read` (ضغط الأدوات)
  - يعمل فحص الصورة عندما يعلن النموذج دعمه لإدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولد الاختبار PNG صغيرًا مع "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` باستخدام `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` ‏(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (سماحية OCR: الأخطاء الطفيفة مسموح بها)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## Live: فحص CLI backend الدخاني (Claude أو Codex أو Gemini أو CLI محلي آخر)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط أنابيب Gateway + agent باستخدام CLI backend محلي، من دون لمس config الافتراضي لديك.
- توجد إعدادات الفحص الدخاني الافتراضية الخاصة بكل backend مع تعريف `cli-backend.ts` الخاص بالـ extension المالكة.
- التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الإعدادات الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/المعاملات/الصورة من بيانات وصف CLI backend الخاصة بالـ Plugin المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (يتم حقن المسارات في prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عندما يتم ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل فحص الاستمرارية الافتراضي داخل الجلسة نفسه Claude Sonnet -> Opus (اضبطه على `1` لفرض تشغيله عندما يدعم النموذج المحدد هدف تحويل).

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
- يشغّل فحص CLI-backend الحي داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحل بيانات وصف فحص CLI من الـ extension المالكة، ثم يثبت حزمة Linux CLI المطابقة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth المحمولة لاشتراك Claude Code عبر أحد الخيارين: `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا نجاح `claude -p` المباشر داخل Docker، ثم يشغّل دورين من Gateway CLI-backend من دون الحفاظ على متغيرات env الخاصة بمفتاح Anthropic API. يعطل مسار الاشتراك هذا فحوصات Claude MCP/tool والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام التطبيقات الخارجية عبر فوترة استخدام إضافي بدل حدود خطة الاشتراك العادية.
- يختبر فحص CLI-backend الحي الآن التدفق الكامل نفسه من طرف إلى طرف لـ Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة `cron` الخاصة بـ MCP مع التحقق عبر Gateway CLI.
- يقوم الفحص الافتراضي لـ Claude أيضًا بتصحيح الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما تزال تتذكر ملاحظة سابقة.

## Live: فحص ACP bind الدخاني (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من التدفق الحقيقي لربط محادثة ACP مع ACP agent حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة synthetic message-channel في مكانها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من وصول المتابعة إلى transcript جلسة ACP المرتبطة
- التمكين:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
  - وكلاء ACP في Docker: ‏`claude,codex,gemini`
  - وكيل ACP للاستخدام المباشر مع `pnpm test:live ...`: ‏`claude`
  - القناة synthetic: سياق محادثة بأسلوب Slack DM
  - ACP backend: ‏`acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- ملاحظات:
  - يستخدم هذا المسار واجهة Gateway ‏`chat.send` مع حقول originating-route synthetic مخصصة للمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق message-channel من دون التظاهر بالتسليم الخارجي.
  - عندما لا تكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطة، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin ‏`acpx` للوكيل المحدد من ACP harness.

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
- افتراضيًا، يشغّل فحص ACP bind الدخاني مقابل جميع وكلاء CLI الحية المدعومة بالتتابع: `claude` ثم `codex` ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يقوم بتحميل `~/.profile`، وتجهيز مواد مصادقة CLI المطابقة داخل الحاوية، وتثبيت `acpx` في بادئة npm قابلة للكتابة، ثم يثبت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كان مفقودًا.
- داخل Docker، يضبط runner القيمة `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` حتى يحتفظ acpx بمتغيرات env الخاصة بالمزوّد من profile المحمّل والمتاحة إلى harness CLI الابن.

## Live: فحص Codex app-server harness الدخاني

- الهدف: التحقق من Codex harness المملوك للـ Plugin عبر المسار الطبيعي
  للطريقة `agent` في Gateway:
  - تحميل Plugin ‏`codex` المضمّن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دور لوكيل Gateway إلى `codex/gpt-5.4`
  - إرسال دور ثانٍ إلى جلسة OpenClaw نفسها والتحقق من أن خيط app-server
    يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر Gateway نفسه
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التمكين: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `codex/gpt-5.4`
- فحص صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- يضبط الفحص الدخاني `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا يتمكن
  Codex harness المعطّل من النجاح عبر الرجوع بصمت إلى PI.
- المصادقة: `OPENAI_API_KEY` من shell/profile، بالإضافة إلى نسخ اختيارية
  لـ `~/.codex/auth.json` و`~/.codex/config.toml`

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

- يوجد Docker runner في `scripts/test-live-codex-harness-docker.sh`.
- يقوم بتحميل `~/.profile` المركّب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبت `@openai/codex` في بادئة npm قابلة للكتابة ومركّبة،
  ويجهّز شجرة المصدر، ثم يشغّل فقط الاختبار الحي لـ Codex-harness.
- يفعّل Docker فحوصات الصورة وMCP/tool افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق
  إعداد الاختبار الحي بحيث لا يستطيع الرجوع إلى `openai-codex/*` أو PI
  إخفاء تراجع في Codex harness.

### وصفات live الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتذبذب:

- نموذج واحد، مباشر (من دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، فحص Gateway دخاني:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء أدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google ‏(مفتاح Gemini API + Antigravity):
  - Gemini ‏(مفتاح API): ‏`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity ‏(OAuth): ‏`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` ‏Gemini API ‏(مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth ‏(نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- يستخدم `google-gemini-cli/...` ‏Gemini CLI المحلي على جهازك (مصادقة منفصلة وخصائص tooling مختلفة).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP ‏(مصادقة مفتاح API / profile)؛ وهذا ما يقصده معظم المستخدمين بعبارة “Gemini”.
  - CLI: يستدعي OpenClaw ملفًا ثنائيًا محليًا `gemini`; وله مصادقة خاصة به ويمكن أن يتصرف بشكل مختلف (دعم البث/الأدوات/اختلاف الإصدارات).

## Live: مصفوفة النماذج (ما الذي نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (لأن live اختيارية)، لكن هذه هي النماذج **الموصى بها** للتغطية بانتظام على جهاز تطوير يملك مفاتيح.

### مجموعة الفحص الحديثة (استدعاء الأدوات + الصور)

هذه هي مجموعة "النماذج الشائعة" التي نتوقع استمرار عملها:

- OpenAI ‏(غير Codex): ‏`openai/gpt-5.4` (اختياري: `openai/gpt-5.4-mini`)
- OpenAI Codex: ‏`openai-codex/gpt-5.4`
- Anthropic: ‏`anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google ‏(Gemini API): ‏`google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google ‏(Antigravity): ‏`google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI ‏(GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

شغّل فحص Gateway الدخاني مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة مزوّد:

- OpenAI: ‏`openai/gpt-5.4` (أو `openai/gpt-5.4-mini`)
- Anthropic: ‏`anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: ‏`google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI ‏(GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (جيدة إن توفرت):

- xAI: ‏`xai/grok-4` (أو الأحدث المتاح)
- Mistral: ‏`mistral/`… (اختر نموذجًا واحدًا قادرًا على "tools" ومفعّلًا لديك)
- Cerebras: ‏`cerebras/`… (إذا كان لديك وصول)
- LM Studio: ‏`lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### Vision: إرسال صورة (مرفق ← رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على التعامل مع الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (مثل Claude/Gemini/متغيرات OpenAI الداعمة للرؤية، إلخ) لاختبار فحص الصورة.

### Aggregators / بوابات بديلة

إذا كانت لديك مفاتيح مفعّلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: ‏`openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات + الصور)
- OpenCode: ‏`opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزوّدون إضافيون يمكنك ضمّهم إلى مصفوفة live (إذا كانت لديك بيانات اعتماد/إعدادات):

- مضمّنون: `openai` و`openai-codex` و`anthropic` و`google` و`google-vertex` و`google-antigravity` و`google-gemini-cli` و`zai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`groq` و`cerebras` و`mistral` و`github-copilot`
- عبر `models.providers` ‏(نقاط نهاية مخصصة): `minimax` ‏(سحابي/API)، بالإضافة إلى أي proxy متوافق مع OpenAI/Anthropic ‏(مثل LM Studio وvLLM وLiteLLM وغيرها)

نصيحة: لا تحاول تثبيت "كل النماذج" ضمن الوثائق. القائمة المرجعية هي ما يعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة لديك.

## بيانات الاعتماد (لا تقم أبدًا بعمل commit لها)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يستخدمها CLI. والنتائج العملية:

- إذا كان CLI يعمل، فيجب أن تجد الاختبارات الحية المفاتيح نفسها.
- إذا قال اختبار حي "لا توجد بيانات اعتماد"، فقم بالتصحيح بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- profiles المصادقة لكل وكيل: ‏`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا هو المقصود بـ "profile keys" في الاختبارات الحية)
- Config: ‏`~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: ‏`~/.openclaw/credentials/` (يتم نسخه إلى home الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح profile الرئيسي)
- تنسخ التشغيلات الحية المحلية config النشط وملفات `auth-profiles.json` لكل وكيل و`credentials/` القديمة وأدلة مصادقة CLI الخارجية المدعومة إلى home اختباري مؤقت افتراضيًا؛ وتتخطى homes الحية المرحلية `workspace/` و`sandboxes/`، كما تُزال تجاوزات المسار `agents.*.workspace` / `agentDir` حتى تبقى الفحوصات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح env (مثلًا المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم Docker runners أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram live (نسخ الصوت)

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
  - يختبر مسارات comfy المضمّنة للصور والفيديو و`music_generate`
  - يتخطى كل قدرة ما لم يتم إعداد `models.providers.comfy.<capability>`
  - مفيد بعد تغيير إرسال workflow في comfy أو polling أو التنزيلات أو تسجيل Plugin

## Image generation live

- الاختبار: `src/image-generation/runtime.live.test.ts`
- الأمر: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: ‏`pnpm test:live:media image`
- النطاق:
  - يعدّد كل Plugin مزوّد مسجّل لتوليد الصور
  - يحمّل متغيرات env المفقودة الخاصة بالمزوّد من login shell ‏(`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل profiles المصادقة المخزنة افتراضيًا، بحيث لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات الاعتماد الحقيقية من shell
  - يتخطى المزوّدين الذين ليس لديهم مصادقة/‏profile/‏model قابلة للاستخدام
  - يشغّل متغيرات توليد الصور القياسية عبر قدرة runtime المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- المزوّدون المضمّنون الحاليون المغطّون:
  - `openai`
  - `google`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profiles وتجاهل تجاوزات env فقط

## Music generation live

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: ‏`pnpm test:live:media music`
- النطاق:
  - يختبر مسار مزوّد توليد الموسيقى المضمّن والمشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات env الخاصة بالمزوّد من login shell ‏(`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل profiles المصادقة المخزنة افتراضيًا، بحيث لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات الاعتماد الحقيقية من shell
  - يتخطى المزوّدين الذين ليس لديهم مصادقة/‏profile/‏model قابلة للاستخدام
  - يشغّل وضعي runtime المعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد فقط على prompt
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: ‏`generate`، `edit`
    - `minimax`: ‏`generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profiles وتجاهل تجاوزات env فقط

## Video generation live

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: ‏`pnpm test:live:media video`
- النطاق:
  - يختبر مسار مزوّد توليد الفيديو المضمّن والمشترك
  - يستخدم افتراضيًا مسار الفحص الدخاني الآمن للإصدار: مزوّدات غير FAL، وطلب text-to-video واحد لكل مزوّد، وprompt لوبستر لمدة ثانية واحدة، وحدًّا أقصى للعملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` ‏(الافتراضي `180000`)
  - يتخطى FAL افتراضيًا لأن زمن الانتظار في طوابير المزوّد قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات env الخاصة بالمزوّد من login shell ‏(`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل profiles المصادقة المخزنة افتراضيًا، بحيث لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات الاعتماد الحقيقية من shell
  - يتخطى المزوّدين الذين ليس لديهم مصادقة/‏profile/‏model قابلة للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صورة محلية مدعومة بـ buffer في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محلي مدعوم بـ buffer في المسح المشترك
  - مزوّدو `imageToVideo` المعلن عنهم حاليًا لكن المتخطّون في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` ‏text-to-video بالإضافة إلى مسار `kling` يستخدم تركيبة ثابتة بعنوان URL لصورة بعيدة افتراضيًا
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزوّدو `videoToVideo` المعلن عنهم حاليًا لكن المتخطّون في المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بـ buffer وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول video inpaint/remix الخاصة بكل مؤسسة
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل الحد الأقصى لكل عملية مزوّد من أجل تشغيل دخاني أكثر شدة
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن profiles وتجاهل تجاوزات env فقط

## Media live harness

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات live المشتركة للصور والموسيقى والفيديو عبر نقطة دخول أصلية واحدة للمستودع
  - يحمّل تلقائيًا متغيرات env الناقصة الخاصة بالمزوّدين من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة إلى المزوّدين الذين لديهم حاليًا مصادقة قابلة للاستخدام افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker runners (فحوصات اختيارية من نوع "يعمل على Linux")

تنقسم Docker runners هذه إلى فئتين:

- Live-model runners: ‏`test:docker:live-models` و`test:docker:live-gateway` يشغّلان فقط ملف live المطابق لمفاتيح profile داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تركيب دليل config المحلي ومساحة العمل لديك (ومع تحميل `~/.profile` إذا تم تركيبه). ونقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم Docker live runners افتراضيًا حدًا دخانيًا أصغر حتى يبقى المسح الكامل عبر Docker عمليًا:
  يضبط `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، بينما
  يضبط `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحةً المسح الشامل الأكبر.
- يبني `test:docker:all` صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين.
- Container smoke runners: ‏`test:docker:openwebui` و`test:docker:onboard` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:plugins` تقلع حاوية حقيقية واحدة أو أكثر وتتحقق من مسارات integration ذات المستوى الأعلى.

تقوم Docker runners الخاصة بالنماذج الحية أيضًا بتركيب homes المصادقة الخاصة بـ CLI المطلوبة فقط (أو جميع المدعومة عندما لا يكون التشغيل مقيّدًا)، ثم تنسخها إلى home داخل الحاوية قبل التشغيل حتى تتمكن OAuth الخاصة بـ CLI الخارجي من تحديث الرموز من دون تعديل مخزن المصادقة على المضيف:

- نماذج مباشرة: `pnpm test:docker:live-models` ‏(السكربت: `scripts/test-live-models-docker.sh`)
- فحص ACP bind الدخاني: `pnpm test:docker:live-acp-bind` ‏(السكربت: `scripts/test-live-acp-bind-docker.sh`)
- فحص CLI backend الدخاني: `pnpm test:docker:live-cli-backend` ‏(السكربت: `scripts/test-live-cli-backend-docker.sh`)
- فحص Codex app-server harness الدخاني: `pnpm test:docker:live-codex-harness` ‏(السكربت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: ‏`pnpm test:docker:live-gateway` ‏(السكربت: `scripts/test-live-gateway-models-docker.sh`)
- فحص Open WebUI الحي الدخاني: `pnpm test:docker:openwebui` ‏(السكربت: `scripts/e2e/openwebui-docker.sh`)
- معالج onboarding ‏(TTY، مع scaffolding كامل): ‏`pnpm test:docker:onboard` ‏(السكربت: `scripts/e2e/onboard-docker.sh`)
- شبكات Gateway ‏(حاويتان، مصادقة WS + فحص صحة): ‏`pnpm test:docker:gateway-network` ‏(السكربت: `scripts/e2e/gateway-network-docker.sh`)
- جسر قناة MCP ‏(Gateway مهيأ مسبقًا + جسر stdio + فحص دخاني لإطار إشعارات Claude الخام): ‏`pnpm test:docker:mcp-channels` ‏(السكربت: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins ‏(فحص التثبيت + الاسم البديل `/plugin` + دلالات إعادة تشغيل Claude-bundle): ‏`pnpm test:docker:plugins` ‏(السكربت: `scripts/e2e/plugins-docker.sh`)

تقوم Docker runners الخاصة بالنماذج الحية أيضًا بتركيب النسخة الحالية للمستودع بوضع القراءة فقط
وتجهيزها في workdir مؤقت داخل الحاوية. وهذا يبقي صورة وقت التشغيل
خفيفة بينما لا يزال يشغّل Vitest على المصدر/config المحليين بدقة.
تتخطى خطوة التجهيز وحدات cache المحلية الكبيرة ومخرجات بناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` ومجلدات `.build` أو
مخرجات Gradle المحلية للتطبيقات حتى لا تقضي تشغيلات Docker الحية دقائق في نسخ
artifacts خاصة بالجهاز.
كما أنها تضبط `OPENCLAW_SKIP_CHANNELS=1` حتى لا تبدأ فحوصات Gateway الحية
عمال قنوات Telegram/Discord/... الحقيقيين داخل الحاوية.
لا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استبعاد تغطية Gateway
الحية من مسار Docker هذا.
يُعد `test:docker:openwebui` فحص توافق أعلى مستوى: فهو يبدأ
حاوية Gateway لـ OpenClaw مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI،
ويبدأ حاوية Open WebUI مثبّتة مقابل ذلك Gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` يكشف عن `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر proxy الخاص بـ Open WebUI عند `/api/chat/completions`.
قد يكون التشغيل الأول أبطأ بشكل ملحوظ لأن Docker قد يحتاج إلى سحب
صورة Open WebUI وقد يحتاج Open WebUI إلى إكمال إعداد البداية الباردة الخاص به.
يتوقع هذا المسار مفتاح نموذج حي قابلًا للاستخدام، ويُعد `OPENCLAW_PROFILE_FILE`
(الافتراضي `~/.profile`) الطريقة الأساسية لتوفيره في التشغيلات داخل Docker.
تطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
يُعد `test:docker:mcp-channels` متعمدًا أن يكون حتميًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يقلع حاوية Gateway
مهيأة مسبقًا، ويبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءات transcript، وبيانات المرفقات الوصفية،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات +
الأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. ويفحص فحص الإشعارات
إطارات stdio MCP الخام مباشرة بحيث يتحقق الفحص الدخاني مما يبثه
الجسر فعليًا، وليس فقط مما قد تُظهره SDK معينة للعميل.

فحص ACP اليدوي للخيط بلغة بسيطة (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا السكربت لتدفقات العمل الخاصة بالاختبارات التراجعية/التصحيح. فقد تكون هناك حاجة إليه مرة أخرى للتحقق من توجيه خيوط ACP، لذا لا تحذفه.

متغيرات env المفيدة:

- `OPENCLAW_CONFIG_DIR=...` (الافتراضي: `~/.openclaw`) ويُركّب إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (الافتراضي: `~/.openclaw/workspace`) ويُركّب إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (الافتراضي: `~/.profile`) ويُركّب إلى `/home/node/.profile` ويُحمّل قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات env فقط التي تم تحميلها من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة config/workspace مؤقتة ومن دون أي تركيبات لمصادقة CLI الخارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`) ويُركّب إلى `/home/node/.npm-global` لتخزين تثبيتات CLI مؤقتًا داخل Docker
- يتم تركيب أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` بوضع القراءة فقط تحت `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تقوم التشغيلات المضيقة حسب المزوّد بتركيب الأدلة/الملفات المطلوبة فقط والمستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوز يدويًا باستخدام `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية المزوّدين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة لتشغيلات الإعادة التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن تأتي بيانات الاعتماد من مخزن profiles ‏(وليس من env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي يكشفه Gateway لفحص Open WebUI الدخاني
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز prompt فحص nonce المستخدم في فحص Open WebUI الدخاني
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبت

## فحوصات الوثائق

شغّل فحوصات الوثائق بعد تعديلها: `pnpm check:docs`.
وشغّل التحقق الكامل من روابط Mintlify وanchors عندما تحتاج إلى فحص عناوين داخل الصفحة أيضًا: `pnpm docs:check-links:anchors`.

## اختبار تراجعي دون اتصال (آمن لـ CI)

هذه اختبارات تراجعية لـ "خط أنابيب حقيقي" من دون مزوّدين حقيقيين:

- استدعاء أدوات Gateway ‏(OpenAI وهمي، Gateway حقيقي + حلقة agent): ‏`src/gateway/gateway.test.ts` (الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway ‏(WS ‏`wizard.start`/`wizard.next`، كتابة config + فرض auth): ‏`src/gateway/gateway.test.ts` (الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمية عبر Gateway الحقيقي + حلقة agent ‏(`src/gateway/gateway.test.ts`).
- تدفقات معالج من طرف إلى طرف تتحقق من wiring الجلسة وتأثيرات config ‏(`src/gateway/gateway.test.ts`).

ما لا يزال مفقودًا بالنسبة إلى Skills ‏(راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تكون Skills مدرجة في prompt، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/المعاملات المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، واستمرار سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- Scenario runner يستخدم مزوّدين وهميين للتحقق من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وwiring الجلسة.
- مجموعة صغيرة من السيناريوهات التي تركز على Skills ‏(استخدام مقابل تجنب، التقييد، حقن prompt).
- تقييمات live اختيارية (اختيارية وتعمل عبر env) فقط بعد وجود المجموعة الآمنة لـ CI.

## اختبارات العقود (شكل Plugin والقناة)

تتحقق اختبارات العقود من أن كل Plugin وقناة مسجلين يطابقان
عقد الواجهة الخاص بهما. فهي تتكرر على كل Plugins المكتشفة وتشغّل مجموعة من
تحققات الشكل والسلوك. ويتخطى مسار unit الافتراضي في `pnpm test` عمدًا
هذه الملفات المشتركة الخاصة بالواجهات والفحوصات الدخانية؛ لذا شغّل أوامر العقود صراحةً
عندما تلمس الواجهات المشتركة للقنوات أو المزوّدين.

### الأوامر

- كل العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود المزوّدين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

موجودة في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي للـ Plugin ‏(id، name، capabilities)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - معالجة الرسائل الواردة
- **actions** - معالجات إجراءات القناة
- **threading** - التعامل مع Thread ID
- **directory** - API الدليل/القائمة
- **group-policy** - فرض سياسة المجموعات

### عقود حالة المزوّد

موجودة في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود المزوّد

موجودة في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - API فهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل المزوّد
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يتم تشغيلها

- بعد تغيير exports أو subpaths الخاصة بـ plugin-sdk
- بعد إضافة أو تعديل Plugin قناة أو مزوّد
- بعد إعادة هيكلة تسجيل Plugin أو الاكتشاف

تعمل اختبارات العقود في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات تراجعية (إرشادات)

عندما تصلح مشكلة مزوّد/نموذج اكتُشفت في live:

- أضف اختبارًا تراجعيًا آمنًا لـ CI إن أمكن (مزوّد mock/stub، أو التقاط تحويل شكل الطلب الدقيق)
- إذا كانت المشكلة بطبيعتها live-only ‏(حدود المعدل، سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب المزوّد → اختبار نماذج مباشرة
  - خطأ في خط أنابيب جلسة/سجل/أدوات Gateway → فحص Gateway live دخاني أو اختبار Gateway وهمي آمن لـ CI
- حاجز حماية SecretRef traversal:
  - يقوم `src/secrets/exec-secret-ref-id-parity.test.ts` باشتقاق هدف نموذجي واحد لكل فئة SecretRef من بيانات وصف السجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec الخاصة بمقاطع traversal.
  - إذا أضفت عائلة هدف SecretRef جديدة من `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. يفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة حتى لا يمكن تخطي الفئات الجديدة بصمت.
