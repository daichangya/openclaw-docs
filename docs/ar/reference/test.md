---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم وضعي force/coverage
title: الاختبارات
x-i18n:
    generated_at: "2026-04-25T13:58:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- مجموعة الاختبار الكاملة (المجموعات، والاختبارات المباشرة، وDocker): [الاختبار](/ar/help/testing)

- `pnpm test:force`: يقتل أي عملية gateway عالقة تحتفظ بمنفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة بمنفذ gateway معزول حتى لا تتصادم اختبارات الخادم مع مثيل قيد التشغيل. استخدم هذا عندما يكون تشغيل gateway سابق قد ترك المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة unit مع تغطية V8 ‏(عبر `vitest.unit.config.ts`). وهذه بوابة تغطية unit للملفات المحمّلة، وليست تغطية لكل ملفات المستودع. والحدود هي 70% للأسطر/الدوال/التعليمات و55% للتفرعات. وبما أن `coverage.all` هي false، فإن البوابة تقيس الملفات التي تحملها مجموعة تغطية unit بدلًا من اعتبار كل ملفات المصدر في المسارات المقسّمة غير مغطاة.
- `pnpm test:coverage:changed`: يشغّل تغطية unit فقط للملفات المتغيرة منذ `origin/main`.
- `pnpm test:changed`: يوسّع مسارات git المتغيرة إلى مسارات Vitest محددة عندما يقتصر الفرق على ملفات المصدر/الاختبار القابلة للتوجيه. أما تغييرات التهيئة/الإعداد فتعود إلى تشغيل المشاريع الجذرية الأصلية بحيث تؤدي تعديلات الربط إلى إعادة تشغيل أوسع عند الحاجة.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقارنة بـ `origin/main`.
- `pnpm check:changed`: يشغّل بوابة التغييرات الذكية للفرق مقارنة بـ `origin/main`. وهو يشغّل العمل الأساسي مع مسارات اختبارات core، وعمل extensions مع مسارات اختبارات extension، والعمل الخاص بالاختبارات فقط مع typecheck/الاختبارات الخاصة بالاختبارات فقط، ويوسّع تغييرات Plugin SDK العامة أو عقود plugin إلى مرور تحقق واحد للـ extension، ويبقي زيادات الإصدارات التي تمس بيانات الإصدار الوصفية فقط على فحوصات موجّهة للإصدار/التهيئة/اعتماديات الجذر.
- `pnpm test`: يوجّه أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة. أما التشغيلات من دون أهداف فتستخدم مجموعات shard ثابتة وتتوسع إلى leaf configs من أجل التنفيذ المحلي المتوازي؛ وتتمدد مجموعة extension دائمًا إلى إعدادات shard لكل extension بدل عملية واحدة ضخمة لمشروع الجذر.
- تُحدِّث تشغيلات full وextension shard بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`; وتستخدم التشغيلات اللاحقة هذه التوقيتات لموازنة الأجزاء البطيئة والسريعة. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أثر التوقيت المحلي.
- يتم الآن توجيه ملفات اختبار `plugin-sdk` و`commands` المختارة عبر مسارات خفيفة مخصصة تبقي فقط `test/setup.ts`، مع إبقاء الحالات الثقيلة وقت التشغيل على مساراتها الحالية.
- كما تُربط ملفات المصدر المساعدة المختارة لـ `plugin-sdk` و`commands` بـ `pnpm test:changed` إلى اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب التعديلات الصغيرة على المساعدات إعادة تشغيل المجموعات الثقيلة المدعومة بـ runtime.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاث إعدادات مخصصة (`core` و`top-level` و`reply`) حتى لا تطغى reply harness على اختبارات الحالة/token/helper الأخف في المستوى الأعلى.
- أصبحت تهيئة Vitest الأساسية تستخدم افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين المشغّل المشترك غير المعزول عبر إعدادات المستودع.
- يشغّل `pnpm test:channels` الملف `vitest.channels.config.ts`.
- يشغّل `pnpm test:extensions` و`pnpm test extensions` جميع shards الخاصة بالـ extension/plugin. وتعمل Plugins القنوات الثقيلة، وPlugin المتصفح، وOpenAI كـ shards مخصصة؛ بينما تبقى مجموعات Plugins الأخرى مجمّعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مجمّعة واحدة.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفاصيل الاستيراد في Vitest، مع الاستمرار في استخدام التوجيه المحدد بالمسار للأهداف الصريحة من ملفات/أدلة.
- `pnpm test:perf:imports:changed`: التوصيف نفسه للاستيراد، لكن فقط للملفات التي تغيرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء المسار الموجّه في وضع changed مقابل تشغيل المشاريع الجذرية الأصلي للفرق الملتزم نفسه في git.
- `pnpm test:perf:changed:bench -- --worktree` يقيس مجموعة التغييرات الحالية في worktree دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف CPU profile للخيط الرئيسي لـ Vitest ‏(`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات CPU + heap profile لمشغّل unit ‏(`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: يشغّل كل leaf config في Vitest الخاصة بالمجموعة الكاملة بشكل تسلسلي ويكتب بيانات مدة مجمّعة بالإضافة إلى مخرجات JSON/سجلات لكل إعداد. ويستخدم Test Performance Agent هذا بوصفه baseline قبل محاولة إصلاح الاختبارات البطيئة.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: يقارن التقارير المجمّعة بعد تغيير يركّز على الأداء.
- تكامل Gateway: تفعيل اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات smoke شاملة لـ gateway ‏(WS/HTTP متعدد المثيلات/اقتران node). ويستخدم افتراضيًا `threads` + ‏`isolate: false` مع عمال متكيّفين في `vitest.e2e.config.ts`; ويمكن ضبطه عبر `OPENCLAW_E2E_WORKERS=<n>` وتعيين `OPENCLAW_E2E_VERBOSE=1` لسجلات مفصلة.
- `pnpm test:live`: يشغّل الاختبارات المباشرة للموفّرين (minimax/zai). ويتطلب مفاتيح API و`LIVE=1` ‏(أو `*_LIVE_TEST=1` الخاص بكل موفّر) لرفع التخطي.
- `pnpm test:docker:all`: يبني صورة live-test المشتركة وصورة Docker E2E مرة واحدة، ثم يشغّل مسارات smoke في Docker باستخدام `OPENCLAW_SKIP_DOCKER_BUILD=1` عبر مجدول موزون. يتحكم `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` في عدد خانات العمليات ويكون افتراضيًا 10؛ ويتحكم `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` في مجموعة tail الحساسة للموفّر ويكون افتراضيًا 10. تكون حدود المسارات الثقيلة افتراضيًا `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9` و`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` و`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; وتكون حدود الموفّرين افتراضيًا مسارًا ثقيلًا واحدًا لكل موفّر عبر `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` و`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. استخدم `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` أو `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` للمضيفات الأكبر. يتم تأخير بدايات المسارات بمقدار ثانيتين افتراضيًا لتجنب عواصف الإنشاء المحلية في Docker daemon؛ ويمكنك التجاوز عبر `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. يقوم المشغّل افتراضيًا بفحص Docker مسبقًا، وينظف حاويات OpenClaw E2E القديمة، ويصدر حالة المسارات النشطة كل 30 ثانية، ويشارك ذاكرات التخزين المؤقت لأدوات CLI الخاصة بالموفّرين بين المسارات المتوافقة، ويعيد محاولة حالات الفشل المباشرة العابرة للموفّرين مرة واحدة افتراضيًا (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`)، ويخزن توقيتات المسارات في `.artifacts/docker-tests/lane-timings.json` من أجل الترتيب من الأطول إلى الأقصر في التشغيلات اللاحقة. استخدم `OPENCLAW_DOCKER_ALL_DRY_RUN=1` لطباعة manifest الخاصة بالمسارات دون تشغيل Docker، أو `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` لضبط إخراج الحالة، أو `OPENCLAW_DOCKER_ALL_TIMINGS=0` لتعطيل إعادة استخدام التوقيتات. استخدم `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` للمسارات الحتمية/المحلية فقط أو `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` لمسارات الموفّرين المباشرة فقط؛ وتوجد أسماء حزم بديلة هي `pnpm test:docker:local:all` و`pnpm test:docker:live:all`. ويقوم وضع live-only بدمج المسارات المباشرة في main وtail ضمن مجموعة واحدة مرتبة من الأطول إلى الأقصر بحيث تتمكن حاويات الموفّرين من حزم أعمال Claude وCodex وGemini معًا. ويتوقف المشغّل عن جدولة مسارات جديدة بعد أول فشل ما لم يتم تعيين `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة fallback قدرها 120 دقيقة يمكن تجاوزها بـ `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; وتستخدم بعض مسارات live/tail المختارة حدودًا أشد لكل مسار. وتملك أوامر إعداد Docker الخاصة بواجهات CLI الخلفية مهلة منفصلة عبر `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` ‏(الافتراضي 180). وتُكتب سجلات كل مسار تحت `.artifacts/docker-tests/<run-id>/`.
- يمكن تشغيل فحوصات Docker المباشرة لواجهات CLI الخلفية كمسارات موجهة، مثل `pnpm test:docker:live-cli-backend:codex` أو `pnpm test:docker:live-cli-backend:codex:resume` أو `pnpm test:docker:live-cli-backend:codex:mcp`. ولدى Claude وGemini أسماء بديلة مطابقة لـ `:resume` و`:mcp`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw وOpen WebUI داخل Docker، ويسجل الدخول عبر Open WebUI، ويتحقق من `/api/models`، ثم يشغّل دردشة حقيقية ممررة عبر `/api/chat/completions`. ويتطلب مفتاح نموذج مباشر قابلًا للاستخدام (مثل OpenAI في `~/.profile`)، ويجلب صورة Open WebUI خارجية، ولا يُتوقع أن يكون مستقرًا في CI مثل مجموعات unit/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مهيأة مسبقًا وحاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات transcript، وبيانات المرفقات الوصفية، وسلوك قائمة الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. وتقرأ عملية التحقق من إشعارات Claude إطارات MCP الخام مباشرة من stdio حتى يعكس smoke ما يصدره الجسر فعلًا.

## بوابة PR المحلية

لفحوصات البوابة/الدمج المحلية الخاصة بـ PR، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا كان `pnpm test` متقلبًا على مضيف مثقل، فأعد تشغيله مرة واحدة قبل اعتباره انحدارًا، ثم اعزل المشكلة باستخدام `pnpm test <path/to/test>`. وبالنسبة إلى المضيفات المقيّدة بالذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## قياس كمون النموذج (مفاتيح محلية)

البرنامج النصي: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات env اختيارية: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- prompt الافتراضية: “Reply with a single word: ok. No punctuation or extra text.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- median الخاصة بـ minimax: ‏1279ms ‏(أدنى 1114، أعلى 2431)
- median الخاصة بـ opus: ‏2454ms ‏(أدنى 1224، أعلى 3170)

## قياس بدء تشغيل CLI

البرنامج النصي: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

الاستخدام:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

الإعدادات المسبقة:

- `startup`: ‏`--version` و`--help` و`health` و`health --json` و`status --json` و`status`
- `real`: ‏`health` و`status` و`status --json` و`sessions` و`sessions --json` و`agents list --json` و`gateway status` و`gateway status --json` و`gateway health --json` و`config get gateway.port`
- `all`: كلا الإعدادين المسبقين

يتضمن الإخراج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع exit-code/signal، وملخصات RSS القصوى لكل أمر. وتكتب الخيارات الاختيارية `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم الالتقاط الزمني وملفات التعريف الأداة نفسها.

اتفاقيات الإخراج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر smoke الموجّه في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف baseline المثبت في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

الملف المثبت في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية مع الملف باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E ‏(Docker)

يُعد Docker اختياريًا؛ ولا يلزم هذا إلا لاختبارات smoke الخاصة بـ onboarding داخل الحاويات.

تدفق cold-start كامل في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا البرنامج النصي المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات التهيئة/مساحة العمل/الجلسة، ثم يبدأ gateway ويشغّل `openclaw health`.

## QR import smoke ‏(Docker)

يضمن أن مساعد runtime الخاص بـ QR الذي تتم صيانته يتم تحميله تحت بيئات Node المدعومة في Docker ‏(Node 24 افتراضيًا، ومتوافق مع Node 22):

```bash
pnpm test:docker:qr
```

## ذو صلة

- [الاختبار](/ar/help/testing)
- [الاختبار المباشر](/ar/help/testing-live)
