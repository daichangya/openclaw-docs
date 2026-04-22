---
read_when:
    - تشغيل الاختبارات أو إصلاحها
summary: كيفية تشغيل الاختبارات محليًا (vitest) ومتى تستخدم وضعي force/coverage
title: الاختبارات
x-i18n:
    generated_at: "2026-04-22T04:28:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# الاختبارات

- مجموعة الاختبارات الكاملة (المجموعات، والاختبارات المباشرة، وDocker): [الاختبار](/ar/help/testing)

- `pnpm test:force`: يوقف أي عملية Gateway عالقة تمسك بمنفذ التحكم الافتراضي، ثم يشغّل مجموعة Vitest الكاملة باستخدام منفذ Gateway معزول حتى لا تتعارض اختبارات الخادم مع نسخة قيد التشغيل. استخدم هذا عندما يترك تشغيل سابق لـ Gateway المنفذ 18789 مشغولًا.
- `pnpm test:coverage`: يشغّل مجموعة اختبارات الوحدات مع تغطية V8 (عبر `vitest.unit.config.ts`). هذه بوابة تغطية للوحدات للملفات المحمّلة، وليست تغطية لجميع ملفات المستودع. الحدود هي 70% للأسطر/الدوال/التعليمات و55% للفروع. وبما أن `coverage.all` يساوي false، تقيس البوابة الملفات التي حمّلتها مجموعة تغطية الوحدات بدلًا من اعتبار كل ملف مصدر في المسارات المقسمة غير مغطى.
- `pnpm test:coverage:changed`: يشغّل تغطية الوحدات فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:changed`: يوسّع مسارات git المتغيرة إلى مسارات Vitest محددة النطاق عندما يقتصر الفرق على ملفات المصدر/الاختبار القابلة للتوجيه. وتظل تغييرات الإعداد/التهيئة تعود إلى تشغيل المشاريع الجذرية الأصلية بحيث تُعاد تشغيل تعديلات الربط بشكل واسع عند الحاجة.
- `pnpm changed:lanes`: يعرض المسارات المعمارية التي يفعّلها الفرق مقابل `origin/main`.
- `pnpm check:changed`: يشغّل بوابة التغييرات الذكية للفرق مقابل `origin/main`. وهو يشغّل عمل النواة مع مسارات اختبارات النواة، وعمل الامتدادات مع مسارات اختبارات الامتدادات، والعمل الخاص بالاختبارات فقط مع typecheck/الاختبارات فقط، ويوسّع تغييرات Plugin SDK العامة أو عقود plugin إلى تحقق الامتدادات، ويحافظ على زيادات الإصدارات الخاصة ببيانات الإصدار فقط ضمن فحوصات موجّهة للإصدار/التكوين/اعتماديات الجذر.
- `pnpm test`: يوجّه أهداف الملفات/الأدلة الصريحة عبر مسارات Vitest محددة النطاق. أما التشغيلات غير المستهدفة فتستخدم مجموعات shards ثابتة وتتوسع إلى إعدادات نهائية للتنفيذ المحلي المتوازي؛ وتُوسّع مجموعة الامتدادات دائمًا إلى إعدادات shards لكل امتداد بدلًا من عملية مشروع جذري عملاقة واحدة.
- تقوم تشغيلات shards الكاملة وامتداداتها بتحديث بيانات التوقيت المحلية في `.artifacts/vitest-shard-timings.json`؛ وتستخدم التشغيلات اللاحقة هذه التوقيتات لموازنة shards البطيئة والسريعة. عيّن `OPENCLAW_TEST_PROJECTS_TIMINGS=0` لتجاهل عنصر التوقيت المحلي.
- يتم الآن توجيه ملفات اختبار `plugin-sdk` و`commands` المحددة عبر مسارات خفيفة مخصصة تُبقي فقط `test/setup.ts`، بينما تبقى الحالات الثقيلة وقت التشغيل في مساراتها الحالية.
- كما تُطابق ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` الأمر `pnpm test:changed` مع اختبارات شقيقة صريحة في تلك المسارات الخفيفة، بحيث تتجنب التعديلات الصغيرة على المساعدات إعادة تشغيل المجموعات الثقيلة المدعومة بوقت التشغيل.
- ينقسم `auto-reply` الآن أيضًا إلى ثلاثة إعدادات مخصصة (`core` و`top-level` و`reply`) حتى لا تهيمن عدة الرد على اختبارات الحالة/الرموز/المساعدات الأخف في المستوى الأعلى.
- يستخدم إعداد Vitest الأساسي الآن افتراضيًا `pool: "threads"` و`isolate: false`، مع تمكين المشغّل المشترك غير المعزول عبر إعدادات المستودع.
- يشغّل `pnpm test:channels` الملف `vitest.channels.config.ts`.
- يشغّل `pnpm test:extensions` و`pnpm test extensions` جميع shards الخاصة بالامتدادات/plugins. وتعمل امتدادات القنوات الثقيلة وOpenAI كـ shards مخصصة؛ بينما تبقى مجموعات الامتدادات الأخرى مجمّعة. استخدم `pnpm test extensions/<id>` لمسار plugin مضمّن واحد.
- `pnpm test:perf:imports`: يفعّل تقارير مدة الاستيراد + تفصيلات الاستيراد في Vitest، مع الاستمرار في استخدام التوجيه المحدد النطاق لأهداف الملفات/الأدلة الصريحة.
- `pnpm test:perf:imports:changed`: التنميط نفسه للاستيراد، ولكن فقط للملفات التي تغيّرت منذ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` يقيس أداء المسار الموجّه لوضع changed مقابل تشغيل المشروع الجذري الأصلي لنفس فرق git المُلتزم.
- `pnpm test:perf:changed:bench -- --worktree` يقيس أداء مجموعة تغييرات worktree الحالية دون الالتزام أولًا.
- `pnpm test:perf:profile:main`: يكتب ملف تعريف CPU لخيط Vitest الرئيسي (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: يكتب ملفات تعريف CPU + heap لمشغّل الوحدات (`.artifacts/vitest-runner-profile`).
- تكامل Gateway: اشتراك اختياري عبر `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` أو `pnpm test:gateway`.
- `pnpm test:e2e`: يشغّل اختبارات smoke شاملة لـ Gateway (إقران WS/HTTP/Node متعدد النسخ). يستخدم افتراضيًا `threads` + `isolate: false` مع عمّال متكيّفين في `vitest.e2e.config.ts`؛ اضبطه باستخدام `OPENCLAW_E2E_WORKERS=<n>` وعيّن `OPENCLAW_E2E_VERBOSE=1` للحصول على سجلات مفصلة.
- `pnpm test:live`: يشغّل اختبارات المزوّدات المباشرة (minimax/zai). يتطلب مفاتيح API و`LIVE=1` (أو `*_LIVE_TEST=1` الخاص بالمزوّد) لإلغاء التخطي.
- `pnpm test:docker:openwebui`: يبدأ OpenClaw + Open WebUI ضمن Docker، ويسجل الدخول عبر Open WebUI، ويتحقق من `/api/models`، ثم يشغّل دردشة حقيقية عبر proxy من خلال `/api/chat/completions`. ويتطلب مفتاح نموذج مباشر صالحًا (مثل OpenAI في `~/.profile`)، ويسحب صورة Open WebUI خارجية، ولا يُتوقع أن يكون مستقرًا في CI مثل مجموعات الوحدات/e2e العادية.
- `pnpm test:docker:mcp-channels`: يبدأ حاوية Gateway مزروعة وحاوية عميل ثانية تشغّل `openclaw mcp serve`، ثم يتحقق من اكتشاف المحادثات الموجّهة، وقراءات transcript، وبيانات attachment الوصفية، وسلوك طابور الأحداث المباشرة، وتوجيه الإرسال الصادر، وإشعارات القنوات + الأذونات بأسلوب Claude عبر جسر stdio الحقيقي. وتقرأ مطالبة إشعار Claude إطارات MCP الخام من stdio مباشرة حتى يعكس اختبار smoke ما يصدره الجسر فعلًا.

## بوابة PR المحلية

لفحوصات البوابة/الإرسال المحلية لـ PR، شغّل:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

إذا كان `pnpm test` غير مستقر على مضيف مثقل، فأعد تشغيله مرة واحدة قبل اعتباره تراجعًا، ثم اعزله باستخدام `pnpm test <path/to/test>`. وبالنسبة إلى المضيفات المقيّدة الذاكرة، استخدم:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## قياس زمن استجابة النموذج (مفاتيح محلية)

السكربت: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

الاستخدام:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- متغيرات بيئة اختيارية: `MINIMAX_API_KEY` و`MINIMAX_BASE_URL` و`MINIMAX_MODEL` و`ANTHROPIC_API_KEY`
- prompt الافتراضي: “Reply with a single word: ok. No punctuation or extra text.”

آخر تشغيل (2025-12-31، 20 تشغيلًا):

- median لـ minimax: ‏1279ms (الحد الأدنى 1114، الحد الأقصى 2431)
- median لـ opus: ‏2454ms (الحد الأدنى 1224، الحد الأقصى 3170)

## قياس بدء تشغيل CLI

السكربت: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

يتضمن الإخراج `sampleCount`، وavg، وp50، وp95، والحدين الأدنى/الأقصى، وتوزيع exit-code/signal، وملخصات RSS القصوى لكل أمر. وتكتب الخيارات `--cpu-prof-dir` / `--heap-prof-dir` ملفات تعريف V8 لكل تشغيل بحيث يستخدم التقاط التوقيت وملفات التعريف الأداة نفسها.

اصطلاحات الإخراج المحفوظ:

- يكتب `pnpm test:startup:bench:smoke` عنصر smoke الموجّه في `.artifacts/cli-startup-bench-smoke.json`
- يكتب `pnpm test:startup:bench:save` عنصر المجموعة الكاملة في `.artifacts/cli-startup-bench-all.json` باستخدام `runs=5` و`warmup=1`
- يحدّث `pnpm test:startup:bench:update` ملف baseline المثبّت في المستودع عند `test/fixtures/cli-startup-bench.json` باستخدام `runs=5` و`warmup=1`

الملف المثبّت في المستودع:

- `test/fixtures/cli-startup-bench.json`
- حدّثه باستخدام `pnpm test:startup:bench:update`
- قارن النتائج الحالية بالملف باستخدام `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

يُعد Docker اختياريًا؛ وهذا مطلوب فقط لاختبارات smoke الخاصة بالإعداد الأولي ضمن الحاويات.

التدفق الكامل لبدء التشغيل البارد في حاوية Linux نظيفة:

```bash
scripts/e2e/onboard-docker.sh
```

يقود هذا السكربت المعالج التفاعلي عبر pseudo-tty، ويتحقق من ملفات config/workspace/session، ثم يبدأ Gateway ويشغّل `openclaw health`.

## اختبار smoke لاستيراد QR (Docker)

يضمن تحميل `qrcode-terminal` ضمن بيئات Node المدعومة في Docker (Node 24 افتراضيًا، وNode 22 متوافق):

```bash
pnpm test:docker:qr
```
