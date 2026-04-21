---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم وضعي force وcoverage
title: الاختبارات
x-i18n:
    generated_at: "2026-04-21T07:26:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# الاختبارات

- مجموعة الاختبارات الكاملة (الأجنحة، والاختبارات الحية، وDocker): [الاختبار](/ar/help/testing)

- `pnpm test:force`: يوقف أي عملية gateway عالقة تحتفظ بمنفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة مع منفذ Gateway معزول حتى لا تتصادم اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما يترك تشغيل سابق لـ Gateway المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة الوحدات مع تغطية V8 (عبر `vitest.unit.config.ts`). وهذه بوابة تغطية لوحدات الملفات المحمّلة، وليست تغطية لجميع ملفات المستودع. والحدود الدنيا هي 70% للأسطر/الدوال/التعليمات و55% للفروع. ولأن `coverage.all` يساوي false، فإن البوابة تقيس الملفات التي تحمّلها مجموعة تغطية الوحدات بدلًا من اعتبار كل ملفات المصدر في المسارات المقسّمة غير مغطاة.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدات فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: يوسّع مسارات git المتغيرة إلى مسارات Vitest محددة النطاق عندما يلمس الفرق فقط ملفات مصدر/اختبار قابلة للتوجيه. أما تغييرات الإعداد/التهيئة فترجع إلى تشغيل مشاريع الجذر الأصلي حتى تؤدي تعديلات الربط إلى إعادة تشغيل واسعة عند الحاجة.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يطلقها الفرق مقارنةً بـ `origin/main`.
- `pnpm check:changed`: يشغّل بوابة التغييرات الذكية للفرق مقارنةً بـ `origin/main`. فهو يشغّل عمل النواة مع مسارات اختبارات النواة، وعمل extensions مع مسارات اختبارات extension، والعمل الخاص بالاختبارات فقط مع فحص أنواع الاختبار/الاختبارات فقط، ويوسّع تغييرات Plugin SDK العامة أو عقود Plugins إلى التحقق من extensions.
- `pnpm test`: يوجّه أهداف الملفات/المجلدات الصريحة عبر مسارات Vitest محددة النطاق. أما التشغيلات غير المستهدفة فتستخدم مجموعات شظايا ثابتة وتتوسع إلى إعدادات فرعية للتنفيذ المحلي المتوازي؛ كما أن مجموعة extension تتوسع دائمًا إلى إعدادات الشظايا لكل extension بدلًا من عملية واحدة ضخمة لمشاريع الجذر.
- تحدّث التشغيلات الكاملة وتشغيلات شظايا extension بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم التشغيلات اللاحقة هذه التوقيتات لموازنة الشظايا البطيئة والسريعة. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل أثر التوقيت المحلي.
- أصبحت ملفات اختبار `plugin-sdk` و`commands` المحددة تُوجَّه الآن عبر مسارات خفيفة مخصصة تحتفظ فقط بـ `test/setup.ts`، وتترك الحالات الثقيلة وقت التشغيل في مساراتها الحالية.
- كما أن ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` تربط `pnpm test:changed` باختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب التعديلات الصغيرة على المساعدات إعادة تشغيل المجموعات الثقيلة المدعومة بوقت التشغيل.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core`، و`top-level`، و`reply`) حتى لا يهيمن إطار الرد على اختبارات الحالة/الرمز/المساعدات الأخف في المستوى الأعلى.
- يستخدم إعداد Vitest الأساسي الآن افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين المشغّل المشترك غير المعزول عبر إعدادات المستودع.
- يشغّل `pnpm test:channels` الملف `vitest.channels.config.ts`.
- يشغّل `pnpm test:extensions` و`pnpm test extensions` جميع شظايا extension/Plugin. وتعمل extensions القنوات الثقيلة وOpenAI كشظايا مخصصة؛ بينما تبقى مجموعات extension الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيلات الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات المحددة النطاق لأهداف الملفات/المجلدات الصريحة.
- `pnpm test:perf:imports:changed`: نفس توصيف الاستيراد، لكن فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار وضع التغييرات الموجّه مقارنةً بتشغيل مشاريع الجذر الأصلي لنفس فرق git الملتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس مجموعة تغييرات مساحة العمل الحالية من دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي في Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدات (`.artifacts/vitest-runner-profile`).
- تكامل Gateway: الاشتراك اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات smoke الطرفية لـ gateway (إقران WS/HTTP/Node متعدد المثيلات). يستخدم افتراضيًا `threads` + `isolate: false` مع عمّال تكيفيين في `vitest.e2e.config.ts`؛ ويمكنك الضبط عبر `OPENCLAW_E2E_WORKERS=<n>` وتعيين `OPENCLAW_E2E_VERBOSE=1` لسجلات مطولة.
- `pnpm test:live`: يشغّل اختبارات الموفّرين الحية (minimax/zai). ويتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالموفّر) لإلغاء التخطي.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI داخل Docker، ويسجّل الدخول عبر Open WebUI، ويتحقق من `/api/models`، ثم يشغّل دردشة حقيقية عبر الوكيل من خلال `/api/chat/completions`. ويتطلب مفتاح نموذج حي صالحًا (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، وليس من المتوقع أن يكون ثابتًا في CI مثل مجموعات الوحدات/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مهيأة مسبقًا وحاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثة الموجّهة، وقراءات النصوص، وبيانات المرفقات الوصفية، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات على نمط Claude عبر جسر stdio الحقيقي. وتقرأ مطالبة إشعار Claude إطارات MCP الخام لـ stdio مباشرة حتى يعكس اختبار smoke ما يصدره الجسر فعليًا.

## بوابة PR المحلية

لإجراء فحوصات بوابة/إدراج PR محليًا، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا كان `pnpm test` غير مستقر على مضيف مثقل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزل المشكلة باستخدام `pnpm test <path/to/test>`. أما بالنسبة إلى المضيفات المقيّدة بالذاكرة، فاستخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## قياس زمن تأخر النموذج (مفاتيح محلية)

البرنامج النصي: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات البيئة الاختيارية: `MINIMAX_API_KEY`، و`MINIMAX_BASE_URL`، و`MINIMAX_MODEL`، و`ANTHROPIC_API_KEY`
- الموجّه الافتراضي: “Reply with a single word: ok. No punctuation or extra text.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

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

- `startup`: ‏`--version`، و`--help`، و`health`، و`health --json`، و`status --json`، و`status`
- `real`: ‏`health`، و`status`، و`status --json`، و`sessions`، و`sessions --json`، و`agents list --json`، و`gateway status`، و`gateway status --json`، و`gateway health --json`، و`config get gateway.port`
- `all`: كلا الإعدادين المسبقين

يتضمن الناتج `sampleCount`، وavg، وp50، وp95، والحدين الأدنى/الأقصى، وتوزيع exit-code/signal، وملخصات max RSS لكل أمر. وتكتب الخيارات الاختيارية `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل حتى يستخدم التقاط التوقيت وملف التعريف إطار العمل نفسه.

اصطلاحات الناتج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` أثر smoke المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` أثر المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف baseline الملتزم في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

الملف الملتزم:

- `test/fixtures/cli-startup-bench.json`
- حدّثه عبر `pnpm test:startup:bench:update`
- قارن النتائج الحالية بالملف عبر `pnpm test:startup:bench:check`

## Onboarding E2E ‏(Docker)

يُعد Docker اختياريًا؛ ولا يلزم هذا إلا لاختبارات smoke الخاصة بالتهيئة داخل الحاويات.

التدفق الكامل من بداية باردة داخل حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا البرنامج النصي المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات الإعداد/مساحة العمل/الجلسة، ثم يبدأ gateway ويشغّل `openclaw health`.

## Smoke لاستيراد QR ‏(Docker)

يضمن تحميل `qrcode-terminal` تحت بيئات Node المدعومة في Docker (Node 24 افتراضيًا، وNode 22 متوافقًا):

```bash
pnpm test:docker:qr
```
