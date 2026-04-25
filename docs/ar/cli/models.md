---
read_when:
    - تريد تغيير النماذج الافتراضية أو عرض حالة مصادقة المزوّد
    - تريد فحص النماذج/المزوّدين المتاحين وتصحيح أخطاء ملفات المصادقة الشخصية
summary: مرجع CLI لـ `openclaw models` (status/list/set/scan، والأسماء المستعارة، والرجوع الاحتياطي، والمصادقة)
title: النماذج
x-i18n:
    generated_at: "2026-04-25T13:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

اكتشاف النماذج وفحصها وضبطها (النموذج الافتراضي، وعمليات الرجوع الاحتياطي، وملفات المصادقة الشخصية).

ذو صلة:

- المزوّدون + النماذج: [النماذج](/ar/providers/models)
- مفاهيم اختيار النموذج + أمر الشرطة المائلة `/models`: [مفهوم النماذج](/ar/concepts/models)
- إعداد مصادقة المزوّد: [البدء](/ar/start/getting-started)

## الأوامر الشائعة

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

يعرض `openclaw models status` القيم الافتراضية/الرجوعات الاحتياطية المحلولة بالإضافة إلى نظرة عامة على المصادقة.
وعندما تكون لقطات استخدام المزوّد متاحة، فإن قسم حالة OAuth/API key يتضمن
نوافذ استخدام المزوّد ولقطات الحصة.
مزوّدو نوافذ الاستخدام الحاليون: Anthropic، وGitHub Copilot، وGemini CLI، وOpenAI
Codex، وMiniMax، وXiaomi، وz.ai. تأتي مصادقة الاستخدام من الخطافات الخاصة
بكل مزوّد عندما تكون متاحة؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد
OAuth/API key من ملفات المصادقة الشخصية أو البيئة أو الإعدادات.
في مخرجات `--json`، تكون `auth.providers` هي النظرة العامة على المزوّد
المراعية للبيئة/الإعدادات/المخزن، بينما تكون `auth.oauth` خاصة بصحة ملفات
مخزن المصادقة فقط.
أضف `--probe` لتشغيل اختبارات مصادقة حية على كل ملف مزوّد مُهيأ.
الاختبارات عبارة عن طلبات حقيقية (وقد تستهلك tokens وتؤدي إلى تفعيل حدود المعدل).
استخدم `--agent <id>` لفحص حالة النموذج/المصادقة لوكيل مُهيأ. وعند حذفه،
يستخدم الأمر `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` إذا كان مضبوطًا، وإلا
فسيستخدم الوكيل الافتراضي المُهيأ.
يمكن أن تأتي صفوف الاختبار من ملفات المصادقة، أو بيانات اعتماد البيئة، أو `models.json`.

ملاحظات:

- يقبل `models set <model-or-alias>` قيمة `provider/model` أو اسمًا مستعارًا.
- الأمر `models list` للقراءة فقط: فهو يقرأ الإعدادات وملفات المصادقة وكتالوج الحالة الحالي
  وصفوف الكتالوج المملوكة للمزوّد، لكنه لا يعيد كتابة
  `models.json`.
- يتضمن `models list --all` صفوف الكتالوج الثابتة المضمّنة والمملوكة للمزوّد حتى
  عندما لا تكون قد صادقت مع ذلك المزوّد بعد. ومع ذلك ستظل تلك الصفوف تظهر
  على أنها غير متاحة إلى أن تُضبط مصادقة مطابقة.
- يحافظ `models list` على فصل بيانات تعريف النموذج الأصلية عن حدود وقت التشغيل. في مخرجات
  الجدول، يعرض `Ctx` القيمة `contextTokens/contextWindow` عندما يختلف
  الحد الفعلي لوقت التشغيل عن نافذة السياق الأصلية؛ وتتضمن صفوف JSON `contextTokens`
  عندما يعرّض المزوّد هذا الحد.
- يرشّح `models list --provider <id>` حسب معرّف المزوّد، مثل `moonshot` أو
  `openai-codex`. وهو لا يقبل تسميات العرض من أدوات اختيار المزوّد التفاعلية،
  مثل `Moonshot AI`.
- يتم تحليل مراجع النموذج بالتقسيم عند **أول** `/`. إذا كان معرّف النموذج يتضمن `/` (بنمط OpenRouter)، فضمّن بادئة المزوّد (مثال: `openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، فسيحل OpenClaw الإدخال على أنه اسم مستعار أولًا، ثم
  على أنه تطابق فريد لمزوّد مُهيأ لذلك معرّف النموذج الدقيق، وبعدها فقط
  يعود إلى المزوّد الافتراضي المُهيأ مع تحذير من الإهمال.
  وإذا لم يعد ذلك المزوّد يعرّض النموذج الافتراضي المُهيأ، فإن OpenClaw
  يعود إلى أول مزوّد/نموذج مُهيأ بدلًا من إظهار قيمة افتراضية قديمة لمزوّد تمت إزالته.
- قد يعرض `models status` القيمة `marker(<value>)` في مخرجات المصادقة للعناصر النائبة غير السرية (مثل `OPENAI_API_KEY` أو `secretref-managed` أو `minimax-oauth` أو `oauth:chutes` أو `ollama-local`) بدلًا من إخفائها كأسرار.

### `models scan`

يقرأ `models scan` كتالوج `:free` العام الخاص بـ OpenRouter ويرتّب المرشحين
لاستخدامهم في الرجوع الاحتياطي. والكتالوج نفسه عام، لذلك لا تحتاج عمليات الفحص
التي تعتمد على البيانات الوصفية فقط إلى مفتاح OpenRouter.

افتراضيًا، يحاول OpenClaw اختبار دعم الأدوات والصور عبر استدعاءات نموذج حية.
إذا لم يكن مفتاح OpenRouter مضبوطًا، فسيعود الأمر إلى مخرجات تعتمد على البيانات الوصفية فقط
وسيوضح أن نماذج `:free` لا تزال تتطلب `OPENROUTER_API_KEY` من أجل
الاختبارات والاستدلال.

الخيارات:

- `--no-probe` (بيانات وصفية فقط؛ من دون بحث في الإعدادات/الأسرار)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (مهلة طلب الكتالوج ومهلة كل اختبار)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

يتطلب `--set-default` و`--set-image` اختبارات حية؛ أما نتائج الفحص
المعتمدة على البيانات الوصفية فقط فهي معلوماتية ولا تُطبَّق على الإعدادات.

### `models status`

الخيارات:

- `--json`
- `--plain`
- `--check` (الخروج 1=منتهي/مفقود، 2=قارب الانتهاء)
- `--probe` (اختبار حي لملفات المصادقة المُهيأة)
- `--probe-provider <name>` (اختبار مزوّد واحد)
- `--probe-profile <id>` (تكرار أو معرّفات ملفات مفصولة بفواصل)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (معرّف وكيل مُهيأ؛ يتجاوز `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

فئات حالة الاختبار:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

حالات التفاصيل/رموز الأسباب المتوقعة في الاختبار:

- `excluded_by_auth_order`: يوجد ملف مخزن، لكن
  `auth.order.<provider>` الصريح قد استثناه، لذلك يبلغ الاختبار عن الاستبعاد بدلًا
  من تجربته.
- `missing_credential`، و`invalid_expires`، و`expired`، و`unresolved_ref`:
  الملف موجود لكنه غير مؤهل/غير قابل للتحليل.
- `no_model`: توجد مصادقة مزوّد، لكن OpenClaw لم يتمكن من تحليل
  مرشح نموذج قابل للاختبار لذلك المزوّد.

## الأسماء المستعارة + الرجوعات الاحتياطية

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## ملفات المصادقة الشخصية

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

الأمر `models auth add` هو مساعد المصادقة التفاعلي. ويمكنه تشغيل تدفق مصادقة
للمزوّد (OAuth/API key) أو إرشادك إلى لصق token يدويًا، بحسب
المزوّد الذي تختاره.

يشغّل `models auth login` تدفق مصادقة Plugin خاصًا بمزوّد (OAuth/API key). استخدم
`openclaw plugins list` لمعرفة المزوّدين المثبّتين.

أمثلة:

```bash
openclaw models auth login --provider openai-codex --set-default
```

ملاحظات:

- يظل `setup-token` و`paste-token` أمرين عامّين للتعامل مع tokens للمزوّدين
  الذين يعرّضون أساليب مصادقة عبر token.
- يتطلب `setup-token` وجود TTY تفاعلي ويشغّل أسلوب مصادقة token الخاص بالمزوّد
  (مع استخدام الأسلوب `setup-token` لذلك المزوّد افتراضيًا عندما يعرّض
  واحدًا).
- يقبل `paste-token` سلسلة token أُنشئت في مكان آخر أو عبر الأتمتة.
- يتطلب `paste-token` الخيار `--provider`، ويطالب بقيمة token، ويكتبها
  إلى معرّف الملف الافتراضي `<provider>:manual` ما لم تمرر
  `--profile-id`.
- يخزّن `paste-token --expires-in <duration>` وقت انتهاء token مطلقًا مشتقًا من
  مدة نسبية مثل `365d` أو `12h`.
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذا يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مساران معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- لا يزال `setup-token` / `paste-token` الخاص بـ Anthropic متاحًا كمسار token مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [اختيار النموذج](/ar/concepts/model-providers)
- [فشل النموذج والرجوع الاحتياطي](/ar/concepts/model-failover)
