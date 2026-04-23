---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (`vitest`) ومتى تستخدم أوضاع force/coverage
title: الاختبارات
x-i18n:
    generated_at: "2026-04-23T14:02:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# الاختبارات

- مجموعة الاختبارات الكاملة (المجموعات، والاختبارات الحية، وDocker): [الاختبار](/ar/help/testing)

- `pnpm test:force`: ينهي أي عملية Gateway باقية تحتجز منفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة باستخدام منفذ Gateway معزول حتى لا تتعارض اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما يترك تشغيل سابق لـ Gateway المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة اختبارات الوحدات مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية لوحدات الملفات المحمّلة، وليست تغطية لكل ملفات المستودع. العتبات هي 70% للأسطر/الدوال/التعابير و55% للفروع. ولأن `coverage.all` تساوي false، فإن البوابة تقيس الملفات التي حمّلتها مجموعة تغطية الوحدات بدلًا من اعتبار كل ملف مصدر في المسارات المقسمة غير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدات فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: يوسّع مسارات git المتغيرة إلى مسارات Vitest محددة النطاق عندما يقتصر الفرق على ملفات المصدر/الاختبار القابلة للتوجيه. أما تغييرات الإعداد/التهيئة فتعود إلى تشغيل المشاريع الجذرية الأصلي حتى تعيد تعديلات التوصيل التشغيل على نطاق واسع عند الحاجة.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يُشغّلها الفرق مقارنةً بـ `origin/main`.
- `pnpm check:changed`: يشغّل بوابة التغييرات الذكية للفرق مقارنةً بـ `origin/main`. فهو يشغّل أعمال النواة مع مسارات اختبارات النواة، وأعمال الإضافات مع مسارات اختبارات الإضافات، والأعمال الخاصة بالاختبارات فقط مع فحص أنواع الاختبار/الاختبارات فقط، ويوسّع تغييرات Plugin SDK العامة أو `plugin-contract` إلى التحقق من الإضافات، ويبقي زيادات الإصدارات الخاصة ببيانات الإصدار فقط على فحوصات مستهدفة للإصدار/الإعداد/تبعيات الجذر.
- `pnpm test`: يوجّه أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. أما التشغيلات غير المستهدفة فتستخدم مجموعات shards ثابتة وتتوسع إلى إعدادات فرعية للتنفيذ المحلي المتوازي؛ وتتمدد مجموعة الإضافات دائمًا إلى إعدادات shards لكل إضافة بدلًا من عملية مشروع جذري واحدة ضخمة.
- تقوم تشغيلات المجموعة الكاملة ومجموعات shards الخاصة بالإضافات بتحديث بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم التشغيلات اللاحقة تلك التوقيتات لموازنة الـ shards البطيئة والسريعة. اضبط `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل ملف التوقيت المحلي.
- تُوجَّه بعض ملفات اختبار `plugin-sdk` و`commands` المحددة الآن عبر مسارات خفيفة مخصصة تُبقي فقط على `test/setup.ts`، مع إبقاء الحالات الثقيلة من حيث وقت التشغيل على مساراتها الحالية.
- كما تربط بعض ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` أمر `pnpm test:changed` باختبارات صريحة مجاورة في تلك المسارات الخفيفة، بحيث تتجنب التعديلات الصغيرة في المساعدات إعادة تشغيل المجموعات الثقيلة المدعومة بوقت التشغيل.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core` و`top-level` و`reply`) حتى لا يهيمن harness الخاص بالرد على اختبارات الحالة/الرمز/المساعد الأخف في المستوى الأعلى.
- يستخدم إعداد Vitest الأساسي الآن افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين المشغّل المشترك غير المعزول عبر إعدادات المستودع.
- يشغّل `pnpm test:channels` الملف `vitest.channels.config.ts`.
- يشغّل `pnpm test:extensions` و`pnpm test extensions` جميع shards الإضافات/Plugins. تعمل إضافات القنوات الثقيلة وOpenAI كـ shards مخصصة؛ بينما تبقى مجموعات الإضافات الأخرى مجمعة. استخدم `pnpm test extensions/<id>` لمسار Plugin مجمّع واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيلات الاستيراد في Vitest، مع الاستمرار في استخدام توجيه المسارات المحددة النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: نفس تحليل الاستيراد، لكن فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء مسار التغييرات الموجّه مقابل تشغيل المشاريع الجذرية الأصلي لنفس فرق git المُلتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات شجرة العمل الحالية دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU للخيط الرئيسي في Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدات (`.artifacts/vitest-runner-profile`).
- تكامل Gateway: تفعيل اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات smoke الشاملة لـ Gateway (إقران WS/HTTP/node متعدد النسخ). ويستخدم افتراضيًا `threads` + `isolate: false` مع عمّال متكيفين في `vitest.e2e.config.ts`؛ ويمكنك الضبط عبر `OPENCLAW_E2E_WORKERS=<n>` وتعيين `OPENCLAW_E2E_VERBOSE=1` للحصول على سجلات مفصلة.
- `pnpm test:live`: يشغّل اختبارات المزودات الحية (minimax/zai). ويتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاصة بالمزوّد) لإلغاء التخطي.
- `pnpm test:docker:all`: يبني صورة الاختبار الحي المشتركة وصورة Docker E2E مرة واحدة، ثم يشغّل مسارات Docker smoke مع `OPENCLAW_SKIP_DOCKER_BUILD=1` وبدرجة توازٍ افتراضية قدرها 4. اضبطها عبر `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`. ويوقف المشغّل جدولة مسارات جديدة في المجموعة بعد أول فشل ما لم يُضبط `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`، ولكل مسار مهلة 120 دقيقة يمكن تجاوزها باستخدام `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. تعمل المسارات الحساسة لبدء التشغيل أو المزوّد بشكل حصري بعد المجموعة المتوازية. وتُكتب سجلات كل مسار تحت `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI ضمن Docker، ويسجّل الدخول عبر Open WebUI، ويفحص `/api/models`، ثم يشغّل دردشة حقيقية عبر الوكيل من خلال `/api/chat/completions`. ويتطلب مفتاح نموذج حي صالحًا (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون مستقرًا في CI مثل مجموعات الوحدات/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مهيأة مسبقًا وحاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثة الموجّهة، وقراءات النصوص، وmetadata الخاصة بالمرفقات، وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. ويقرأ تأكيد إشعارات Claude إطارات stdio MCP الخام مباشرةً حتى يعكس smoke ما يصدره الجسر فعليًا.

## بوابة PR المحلية

لفحوصات البوابة/الهبوط المحلية الخاصة بـ PR، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا أصبح `pnpm test` غير مستقر على مضيف مثقل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزل الحالة باستخدام `pnpm test <path/to/test>`. وبالنسبة للمضيفات ذات الذاكرة المحدودة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## قياس زمن وصول النموذج (مفاتيح محلية)

البرنامج النصي: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات بيئة اختيارية: `MINIMAX_API_KEY` و`MINIMAX_BASE_URL` و`MINIMAX_MODEL` و`ANTHROPIC_API_KEY`
- الـ prompt الافتراضي: “Reply with a single word: ok. No punctuation or extra text.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- الوسيط في minimax هو 1279ms (الحد الأدنى 1114، الحد الأقصى 2431)
- الوسيط في opus هو 2454ms (الحد الأدنى 1224، الحد الأقصى 3170)

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

يتضمن الإخراج `sampleCount`، والمتوسط، وp50، وp95، والحد الأدنى/الأقصى، وتوزيع exit-code/signal، وملخصات أقصى RSS لكل أمر. ويكتب الخياران `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم القياس والتقاط ملفات التعريف harness نفسه.

اتفاقيات الإخراج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` ناتج smoke المستهدف في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` ناتج المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف baseline المثبت في `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

الملف المثبت في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بالملف باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E ‏(Docker)

يُعد Docker اختياريًا؛ وهذا مطلوب فقط لاختبارات smoke الخاصة بالتهيئة الأولى ضمن الحاويات.

تدفق بدء تشغيل كامل من الصفر داخل حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا البرنامج النصي المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات config/workspace/session، ثم يبدأ Gateway ويشغّل `openclaw health`.

## smoke لاستيراد QR ‏(Docker)

يضمن أن `qrcode-terminal` يُحمَّل ضمن بيئات Node المدعومة في Docker (الافتراضي Node 24، والمتوافق Node 22):

```bash
pnpm test:docker:qr
```
