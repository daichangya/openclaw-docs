---
read_when:
    - ضبط الإعدادات الافتراضية للوكيل (النماذج، والتفكير، ومساحة العمل، وHeartbeat، والوسائط، وSkills)
    - تهيئة التوجيه متعدد الوكلاء والروابط
    - ضبط الجلسة، وتسليم الرسائل، وسلوك وضع Talk
summary: الإعدادات الافتراضية للوكيل، والتوجيه متعدد الوكلاء، والجلسة، والرسائل، وتهيئة Talk
title: التهيئة — الوكلاء
x-i18n:
    generated_at: "2026-04-25T13:46:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1601dc5720f6a82fb947667ed9c0b4612c5187572796db5deb7a28dd13be3528
    source_path: gateway/config-agents.md
    workflow: 15
---

مفاتيح التهيئة ذات نطاق الوكيل تحت `agents.*` و`multiAgent.*` و`session.*` و`messages.*` و`talk.*`. بالنسبة إلى القنوات، والأدوات، ووقت تشغيل Gateway، والمفاتيح الأخرى
في المستوى الأعلى، راجع [مرجع التهيئة](/ar/gateway/configuration-reference).

## الإعدادات الافتراضية للوكيل

### `agents.defaults.workspace`

الافتراضي: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

جذر مستودع اختياري يظهر في سطر Runtime ضمن system prompt. وإذا لم يكن معيّنًا، يكتشفه OpenClaw تلقائيًا بالصعود من مساحة العمل.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

قائمة سماح Skills افتراضية اختيارية للوكلاء الذين لا يعيّنون
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // يرث github, weather
      { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

- احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
- احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
- عيّن `agents.list[].skills: []` لعدم استخدام أي Skills.
- القائمة غير الفارغة في `agents.list[].skills` هي المجموعة النهائية لذلك الوكيل؛
  ولا تُدمج مع الإعدادات الافتراضية.

### `agents.defaults.skipBootstrap`

يعطّل الإنشاء التلقائي لملفات bootstrap في مساحة العمل (`AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

يتحكم في وقت حقن ملفات bootstrap لمساحة العمل داخل system prompt. الافتراضي: `"always"`.

- `"continuation-skip"`: تتخطى أدوار المتابعة الآمنة (بعد رد مكتمل من المساعد) إعادة حقن bootstrap لمساحة العمل، مما يقلل حجم الموجّه. وتظل عمليات Heartbeat وعمليات إعادة المحاولة بعد Compaction تعيد بناء السياق.
- `"never"`: يعطل حقن bootstrap لمساحة العمل وملفات السياق في كل دور. استخدم هذا فقط للوكلاء الذين يملكون دورة حياة الموجّه بالكامل (محركات سياق مخصصة، أو بيئات تشغيل أصلية تبني سياقها الخاص، أو سير عمل متخصصة من دون bootstrap). وتتخطى أيضًا أدوار Heartbeat واسترداد Compaction الحقن.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

الحد الأقصى للأحرف لكل ملف bootstrap في مساحة العمل قبل الاقتطاع. الافتراضي: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

الحد الأقصى الإجمالي للأحرف المحقونة عبر جميع ملفات bootstrap في مساحة العمل. الافتراضي: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

يتحكم في نص التحذير المرئي للوكيل عند اقتطاع سياق bootstrap.
الافتراضي: `"once"`.

- `"off"`: لا يحقن نص تحذير في system prompt مطلقًا.
- `"once"`: يحقن التحذير مرة واحدة لكل توقيع اقتطاع فريد (موصى به).
- `"always"`: يحقن التحذير في كل تشغيل عند وجود اقتطاع.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### خريطة ملكية ميزانية السياق

يحتوي OpenClaw على عدة ميزانيات كبيرة الحجم للموجّه/السياق، وهي
مقسّمة عمدًا حسب النظام الفرعي بدلًا من مرورها كلها عبر
مفتاح عام واحد.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  حقن bootstrap العادي لمساحة العمل.
- `agents.defaults.startupContext.*`:
  تمهيد بدء تشغيل لمرة واحدة لأوامر `/new` و`/reset`، بما في ذلك
  ملفات `memory/*.md` اليومية الحديثة.
- `skills.limits.*`:
  قائمة Skills المدمجة المحقونة في system prompt.
- `agents.defaults.contextLimits.*`:
  مقتطفات وقت تشغيل محدودة وكتل محقونة يملكها وقت التشغيل.
- `memory.qmd.limits.*`:
  مقتطفات بحث الذاكرة المفهرسة وحجم الحقن.

استخدم التجاوز المطابق لكل وكيل فقط عندما يحتاج وكيل واحد إلى
ميزانية مختلفة:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

يتحكم في تمهيد بدء التشغيل لأول دور والمحقون في عمليات `/new` و`/reset`
الفارغة.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

الإعدادات الافتراضية المشتركة لأسطح سياق وقت التشغيل المحدودة.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: الحد الافتراضي لمقتطف `memory_get` قبل إضافة
  بيانات تعريف الاقتطاع وإشعار المتابعة.
- `memoryGetDefaultLines`: نافذة الأسطر الافتراضية لـ `memory_get` عندما تكون `lines`
  غير مذكورة.
- `toolResultMaxChars`: الحد المباشر لنتائج الأدوات المستخدم للنتائج المحفوظة
  واسترداد الفائض.
- `postCompactionMaxChars`: حد مقتطف `AGENTS.md` المستخدم أثناء حقن التحديث
  بعد Compaction.

#### `agents.list[].contextLimits`

تجاوز لكل وكيل للمفاتيح المشتركة في `contextLimits`. وترث الحقول غير المذكورة
من `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

الحد العام لقائمة Skills المدمجة المحقونة في system prompt. وهذا
لا يؤثر في قراءة ملفات `SKILL.md` عند الطلب.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

تجاوز لكل وكيل لميزانية موجّه Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

الحد الأقصى لحجم البكسل لأطول ضلع في الصورة في كتل الصور الخاصة بالنص/الأداة قبل استدعاءات المزوّد.
الافتراضي: `1200`.

تقلل القيم الأقل عادةً من استخدام vision-token وحجم حمولة الطلب في العمليات التي تكثر فيها لقطات الشاشة.
وتحافظ القيم الأعلى على قدر أكبر من التفاصيل البصرية.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

المنطقة الزمنية لسياق system prompt (وليس الطوابع الزمنية للرسائل). ويرجع إلى المنطقة الزمنية للمضيف.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

تنسيق الوقت في system prompt. الافتراضي: `auto` (تفضيل نظام التشغيل).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // معلمات المزوّد الافتراضية العامة
      embeddedHarness: {
        runtime: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - صيغة السلسلة تعيّن النموذج الأساسي فقط.
  - صيغة الكائن تعيّن النموذج الأساسي بالإضافة إلى نماذج failover مرتبة.
- `imageModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة مسار أداة `image` كتهيئة نموذج الرؤية الخاص بها.
  - ويُستخدم أيضًا كتوجيه احتياطي عندما لا يستطيع النموذج المحدد/الافتراضي قبول إدخال الصور.
- `imageGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية إنشاء الصور المشتركة وأي سطح أداة/Plugin مستقبلي ينشئ الصور.
  - القيم النموذجية: `google/gemini-3.1-flash-image-preview` لإنشاء صور Gemini الأصلي، أو `fal/fal-ai/flux/dev` لـ fal، أو `openai/gpt-image-2` لـ OpenAI Images.
  - إذا اخترت مزودًا/نموذجًا مباشرة، فقم بتهيئة مصادقة المزود المطابقة أيضًا (على سبيل المثال `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ `google/*`، أو `OPENAI_API_KEY` أو OpenAI Codex OAuth لـ `openai/gpt-image-2`، أو `FAL_KEY` لـ `fal/*`).
  - إذا تم حذفه، فلا يزال بإمكان `image_generate` استنتاج مزود افتراضي مدعوم بالمصادقة. وهو يحاول أولًا المزود الافتراضي الحالي، ثم مزودي إنشاء الصور المسجلين المتبقين وفق ترتيب معرّف المزود.
- `musicGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية إنشاء الموسيقى المشتركة وأداة `music_generate` المضمنة.
  - القيم النموذجية: `google/lyria-3-clip-preview` أو `google/lyria-3-pro-preview` أو `minimax/music-2.6`.
  - إذا تم حذفه، فلا يزال بإمكان `music_generate` استنتاج مزود افتراضي مدعوم بالمصادقة. وهو يحاول أولًا المزود الافتراضي الحالي، ثم مزودي إنشاء الموسيقى المسجلين المتبقين وفق ترتيب معرّف المزود.
  - إذا اخترت مزودًا/نموذجًا مباشرة، فقم بتهيئة مصادقة/مفتاح API المطابق للمزوّد أيضًا.
- `videoGenerationModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة إمكانية إنشاء الفيديو المشتركة وأداة `video_generate` المضمنة.
  - القيم النموذجية: `qwen/wan2.6-t2v` أو `qwen/wan2.6-i2v` أو `qwen/wan2.6-r2v` أو `qwen/wan2.6-r2v-flash` أو `qwen/wan2.7-r2v`.
  - إذا تم حذفه، فلا يزال بإمكان `video_generate` استنتاج مزود افتراضي مدعوم بالمصادقة. وهو يحاول أولًا المزود الافتراضي الحالي، ثم مزودي إنشاء الفيديو المسجلين المتبقين وفق ترتيب معرّف المزود.
  - إذا اخترت مزودًا/نموذجًا مباشرة، فقم بتهيئة مصادقة/مفتاح API المطابق للمزوّد أيضًا.
  - يدعم مزود إنشاء الفيديو Qwen المضمّن حتى 1 فيديو ناتج، و1 صورة إدخال، و4 مقاطع فيديو إدخال، ومدة 10 ثوانٍ، وخيارات على مستوى المزوّد مثل `size` و`aspectRatio` و`resolution` و`audio` و`watermark`.
- `pdfModel`: يقبل إما سلسلة (`"provider/model"`) أو كائنًا (`{ primary, fallbacks }`).
  - يُستخدم بواسطة أداة `pdf` لتوجيه النموذج.
  - إذا تم حذفه، ترجع أداة PDF إلى `imageModel`، ثم إلى النموذج المحلول للجلسة/الافتراضي.
- `pdfMaxBytesMb`: حد حجم PDF الافتراضي لأداة `pdf` عندما لا يتم تمرير `maxBytesMb` وقت الاستدعاء.
- `pdfMaxPages`: الحد الأقصى الافتراضي للصفحات التي تؤخذ في الاعتبار بواسطة وضع الرجوع إلى الاستخراج في أداة `pdf`.
- `verboseDefault`: مستوى verbose الافتراضي للوكلاء. القيم: `"off"` أو `"on"` أو `"full"`. الافتراضي: `"off"`.
- `elevatedDefault`: مستوى المخرجات المرتفعة الافتراضي للوكلاء. القيم: `"off"` أو `"on"` أو `"ask"` أو `"full"`. الافتراضي: `"on"`.
- `model.primary`: التنسيق `provider/model` (مثل `openai/gpt-5.4` للوصول بمفتاح API أو `openai-codex/gpt-5.5` لـ Codex OAuth). إذا حذفت المزوّد، يحاول OpenClaw أولًا اسمًا مستعارًا، ثم تطابقًا فريدًا لمزوّد مهيأ لذلك مع معرّف النموذج الدقيق، وعندها فقط يرجع إلى المزوّد الافتراضي المهيأ (سلوك توافق قديم، لذا فضّل الصيغة الصريحة `provider/model`). وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيأ، يرجع OpenClaw إلى أول مزوّد/نموذج مهيأ بدلًا من إظهار افتراضي قديم لمزوّد تمت إزالته.
- `models`: كتالوج النماذج المهيأ وقائمة السماح الخاصة بـ `/model`. يمكن أن يتضمن كل إدخال `alias` (اختصار) و`params` (خاصة بالمزوّد، مثل `temperature` أو `maxTokens` أو `cacheRetention` أو `context1m` أو `responsesServerCompaction` أو `responsesCompactThreshold` أو `extra_body`/`extraBody`).
  - تعديلات آمنة: استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات. يرفض `config set` الاستبدالات التي قد تزيل إدخالات موجودة من قائمة السماح إلا إذا مررت `--replace`.
  - تقوم تدفقات التهيئة/الإعداد الأولي ذات نطاق المزوّد بدمج نماذج المزوّد المحددة في هذه الخريطة وتحافظ على المزوّدين الآخرين المهيئين غير المرتبطين.
  - بالنسبة إلى نماذج OpenAI Responses المباشرة، يتم تمكين Compaction على جانب الخادم تلقائيًا. استخدم `params.responsesServerCompaction: false` لإيقاف حقن `context_management`، أو `params.responsesCompactThreshold` لتجاوز العتبة. راجع [Compaction على جانب الخادم في OpenAI](/ar/providers/openai#server-side-compaction-responses-api).
- `params`: معلمات المزوّد الافتراضية العامة المطبقة على جميع النماذج. تُضبط في `agents.defaults.params` (مثل `{ cacheRetention: "long" }`).
- أولوية دمج `params` (في التهيئة): يتم تجاوز `agents.defaults.params` (الأساس العام) بواسطة `agents.defaults.models["provider/model"].params` (لكل نموذج)، ثم تتجاوز `agents.list[].params` (لمعرّف الوكيل المطابق) حسب المفتاح. راجع [Prompt Caching](/ar/reference/prompt-caching) للتفاصيل.
- `params.extra_body`/`params.extraBody`: JSON متقدم للتمرير المباشر يُدمج في أجسام طلبات `api: "openai-completions"` لوكلاء OpenAI المتوافقين. وإذا تعارض مع مفاتيح الطلب المولدة، فإن الجسم الإضافي يفوز؛ وتستمر المسارات غير الأصلية الخاصة بـ completions في إزالة `store` الخاص بـ OpenAI بعد ذلك.
- `embeddedHarness`: سياسة وقت التشغيل المضمن منخفضة المستوى الافتراضية للوكيل. يؤدي حذف runtime إلى استخدام OpenClaw Pi افتراضيًا. استخدم `runtime: "pi"` لفرض حزمة PI المضمنة، أو `runtime: "auto"` للسماح لـ plugin harnesses المسجلة بالاستحواذ على النماذج المدعومة، أو معرّف harness مسجل مثل `runtime: "codex"`. عيّن `fallback: "none"` لتعطيل الرجوع التلقائي إلى PI. تفشل runtimes الصريحة الخاصة بـ Plugin مثل `codex` فشلًا مغلقًا افتراضيًا ما لم تعيّن `fallback: "pi"` في نطاق التجاوز نفسه. احتفظ بمراجع النموذج بصيغة قانونية `provider/model`؛ واختر Codex وClaude CLI وGemini CLI وغيرها من خلفيات التنفيذ عبر تهيئة runtime بدلًا من بادئات مزودي runtime القديمة. راجع [Agent runtimes](/ar/concepts/agent-runtimes) لمعرفة الفرق بين هذا وبين اختيار المزوّد/النموذج.
- تقوم أدوات كتابة التهيئة التي تعدّل هذه الحقول (مثل `/models set` و`/models set-image` وأوامر إضافة/إزالة fallback) بحفظ الصيغة القانونية للكائن والحفاظ على قوائم fallback الموجودة عندما يكون ذلك ممكنًا.
- `maxConcurrent`: الحد الأقصى لعمليات تشغيل الوكيل المتوازية عبر الجلسات (مع بقاء كل جلسة متسلسلة). الافتراضي: 4.

### `agents.defaults.embeddedHarness`

يتحكم `embeddedHarness` في المنفّذ منخفض المستوى الذي يشغّل أدوار الوكيل المضمنة.
يجب أن تحتفظ معظم عمليات النشر بوقت تشغيل OpenClaw Pi الافتراضي.
استخدمه عندما يوفّر Plugin موثوق حزمة أصلية، مثل
حزمة خادم تطبيق Codex المضمنة. وللنموذج الذهني، راجع
[Agent runtimes](/ar/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: ‏`"auto"` أو `"pi"` أو معرّف harness مسجل لـ Plugin. يسجل Plugin Codex المضمّن `codex`.
- `fallback`: ‏`"pi"` أو `"none"`. في `runtime: "auto"`، تكون القيمة الافتراضية عند الحذف هي `"pi"` بحيث يمكن للتهيئات القديمة الاستمرار في استخدام PI عندما لا تستحوذ أي حزمة Plugin على التشغيل. وفي وضع runtime الصريح الخاص بـ Plugin، مثل `runtime: "codex"`، تكون القيمة الافتراضية عند الحذف هي `"none"` بحيث يفشل غياب الحزمة بدلًا من استخدام PI بصمت. لا ترث تجاوزات runtime قيمة fallback من نطاق أوسع؛ عيّن `fallback: "pi"` إلى جانب runtime الصريح عندما تريد عمدًا هذا الرجوع التوافقي. وتظهر دائمًا حالات فشل plugin harness المحددة مباشرة.
- تجاوزات البيئة: يقوم `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` بتجاوز `runtime`؛ ويقوم `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` بتجاوز fallback لتلك العملية.
- لعمليات النشر المعتمدة على Codex فقط، عيّن `model: "openai/gpt-5.5"` و`embeddedHarness.runtime: "codex"`. ويمكنك أيضًا تعيين `embeddedHarness.fallback: "none"` صراحةً من أجل الوضوح؛ فهي القيمة الافتراضية لـ runtimes الصريحة الخاصة بـ Plugin.
- يتم تثبيت اختيار harness لكل معرّف جلسة بعد أول تشغيل مضمن. تؤثر تغييرات التهيئة/البيئة في الجلسات الجديدة أو المعاد تعيينها، وليس في نص موجود. تُعامل الجلسات القديمة التي لها سجل نصي ولكن من دون تثبيت مسجل على أنها مثبتة على PI. يعرض `/status` runtime الفعلي، مثل `Runtime: OpenClaw Pi Default` أو `Runtime: OpenAI Codex`.
- يتحكم هذا فقط في chat harness المضمن. ولا تزال عمليات إنشاء الوسائط، والرؤية، وPDF، والموسيقى، والفيديو، وTTS تستخدم إعدادات المزوّد/النموذج الخاصة بها.

**اختصارات الأسماء المستعارة المضمنة** (تنطبق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

| الاسم المستعار       | النموذج                                            |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` أو Codex OAuth GPT-5.5 المهيأ     |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

تتغلب الأسماء المستعارة المهيأة لديك دائمًا على الإعدادات الافتراضية.

تقوم نماذج Z.AI GLM-4.x تلقائيًا بتمكين وضع thinking ما لم تعيّن `--thinking off` أو تحدد `agents.defaults.models["zai/<model>"].params.thinking` بنفسك.
وتفعّل نماذج Z.AI القيمة `tool_stream` افتراضيًا لبث استدعاءات الأدوات. عيّن `agents.defaults.models["zai/<model>"].params.tool_stream` إلى `false` لتعطيلها.
وتستخدم نماذج Anthropic Claude 4.6 قيمة thinking الافتراضية `adaptive` عندما لا يكون هناك مستوى thinking صريح معيّن.

### `agents.defaults.cliBackends`

خلفيات CLI اختيارية لعمليات الرجوع النصية فقط (من دون استدعاءات أدوات). وهي مفيدة كنسخة احتياطية عندما تفشل مزودات API.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // أو استخدم systemPromptFileArg عندما يقبل CLI علامة ملف موجّه.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- خلفيات CLI نصية أولًا؛ ويتم دائمًا تعطيل الأدوات.
- الجلسات مدعومة عند تعيين `sessionArg`.
- تمرير الصور مدعوم عندما يقبل `imageArg` مسارات الملفات.

### `agents.defaults.systemPromptOverride`

استبدال system prompt الكامل الذي يجمعه OpenClaw بسلسلة ثابتة. يُضبط على المستوى الافتراضي (`agents.defaults.systemPromptOverride`) أو لكل وكيل (`agents.list[].systemPromptOverride`). وتكون القيم الخاصة بكل وكيل ذات أولوية أعلى؛ ويتم تجاهل القيمة الفارغة أو التي تحتوي على مسافات فقط. وهو مفيد لتجارب الموجّه المضبوطة.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

طبقات موجّه مستقلة عن المزوّد تُطبّق حسب عائلة النموذج. وتتلقى معرّفات نماذج عائلة GPT-5 عقد السلوك المشترك عبر المزوّدين؛ ويتحكم `personality` فقط في طبقة أسلوب التفاعل الودود.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- يعمل `"friendly"` (الافتراضي) و`"on"` على تمكين طبقة أسلوب التفاعل الودود.
- يعطّل `"off"` الطبقة الودودة فقط؛ ويظل عقد سلوك GPT-5 المعلّم ممكّنًا.
- لا يزال يتم قراءة `plugins.entries.openai.config.personality` القديم عندما لا يكون هذا الإعداد المشترك معيّنًا.

### `agents.defaults.heartbeat`

عمليات Heartbeat دورية.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m يعطّل
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // الافتراضي: true؛ تعني false حذف قسم Heartbeat من system prompt
        lightContext: false, // الافتراضي: false؛ تعني true الإبقاء على HEARTBEAT.md فقط من ملفات bootstrap لمساحة العمل
        isolatedSession: false, // الافتراضي: false؛ تعني true تشغيل كل Heartbeat في جلسة جديدة (من دون سجل محادثة)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (الافتراضي) | block
        target: "none", // الافتراضي: none | الخيارات: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: سلسلة مدة (ms/s/m/h). الافتراضي: `30m` (لمصادقة مفتاح API) أو `1h` (لمصادقة OAuth). عيّنها إلى `0m` للتعطيل.
- `includeSystemPromptSection`: عند تعيينها إلى false، تحذف قسم Heartbeat من system prompt وتتخطى حقن `HEARTBEAT.md` في سياق bootstrap. الافتراضي: `true`.
- `suppressToolErrorWarnings`: عند تعيينها إلى true، تمنع حمولات تحذيرات أخطاء الأدوات أثناء عمليات Heartbeat.
- `timeoutSeconds`: أقصى وقت بالثواني مسموح به لدور وكيل Heartbeat قبل إجهاضه. اتركه غير معيّن لاستخدام `agents.defaults.timeoutSeconds`.
- `directPolicy`: سياسة التسليم المباشر/DM. تسمح `allow` (الافتراضي) بالتسليم إلى الهدف المباشر. وتمنع `block` التسليم إلى الهدف المباشر وتطلق `reason=dm-blocked`.
- `lightContext`: عند تعيينها إلى true، تستخدم عمليات Heartbeat سياق bootstrap خفيفًا وتُبقي فقط `HEARTBEAT.md` من ملفات bootstrap لمساحة العمل.
- `isolatedSession`: عند تعيينها إلى true، تعمل كل Heartbeat في جلسة جديدة من دون سجل محادثة سابق. وهو نمط العزل نفسه مثل `sessionTarget: "isolated"` في Cron. ويخفض تكلفة الرموز لكل Heartbeat من نحو 100 ألف رمز إلى نحو 2-5 آلاف رمز.
- لكل وكيل: عيّن `agents.list[].heartbeat`. عندما يعرّف أي وكيل `heartbeat`، **تعمل Heartbeat فقط لهؤلاء الوكلاء**.
- تُشغّل Heartbeat أدوار وكيل كاملة — والفواصل الأقصر تستهلك رموزًا أكثر.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // معرّف Plugin مزود Compaction مسجل (اختياري)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // تُستخدم عندما تكون identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] يعطّل إعادة الحقن
        model: "openrouter/anthropic/claude-sonnet-4-6", // تجاوز اختياري للنموذج خاص بـ Compaction فقط
        notifyUser: true, // إرسال إشعارات موجزة إلى المستخدم عند بدء Compaction واكتماله (الافتراضي: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: ‏`default` أو `safeguard` (تلخيص مُجزأ للسجلات الطويلة). راجع [Compaction](/ar/concepts/compaction).
- `provider`: معرّف Plugin مزود Compaction مسجل. عند تعيينه، يتم استدعاء `summarize()` الخاصة بالمزوّد بدلًا من تلخيص LLM المضمّن. ويرجع إلى المضمّن عند الفشل. ويؤدي تعيين مزود إلى فرض `mode: "safeguard"`. راجع [Compaction](/ar/concepts/compaction).
- `timeoutSeconds`: الحد الأقصى بالثواني المسموح به لعملية Compaction واحدة قبل أن يقوم OpenClaw بإجهاضها. الافتراضي: `900`.
- `keepRecentTokens`: ميزانية نقطة القطع الخاصة بـ Pi للاحتفاظ بأحدث ذيل للنص حرفيًا. يحترم `/compact` اليدوي هذا عند تعيينه صراحةً؛ وإلا فإن Compaction اليدوي يكون نقطة تحقق صارمة.
- `identifierPolicy`: ‏`strict` (الافتراضي) أو `off` أو `custom`. تضيف `strict` إرشادات مضمّنة للاحتفاظ بالمعرّفات المعتمة أثناء تلخيص Compaction.
- `identifierInstructions`: نص مخصص اختياري للحفاظ على المعرّفات يُستخدم عندما تكون `identifierPolicy=custom`.
- `qualityGuard`: فحوصات إعادة المحاولة عند المخرجات المشوهة لملخصات safeguard. وهي مفعّلة افتراضيًا في وضع safeguard؛ عيّن `enabled: false` لتخطي التدقيق.
- `postCompactionSections`: أسماء أقسام H2/H3 اختيارية من `AGENTS.md` لإعادة حقنها بعد Compaction. الإعداد الافتراضي هو `["Session Startup", "Red Lines"]`؛ عيّن `[]` لتعطيل إعادة الحقن. وعند عدم تعيينها أو تعيينها صراحةً إلى ذلك الزوج الافتراضي، تُقبل أيضًا عناوين `Every Session`/`Safety` الأقدم كرجوع قديم.
- `model`: تجاوز اختياري لـ `provider/model-id` خاص بتلخيص Compaction فقط. استخدم هذا عندما يجب أن تبقي الجلسة الرئيسية نموذجًا واحدًا بينما تعمل ملخصات Compaction على نموذج آخر؛ وعند عدم تعيينه، يستخدم Compaction النموذج الأساسي للجلسة.
- `notifyUser`: عند تعيينه إلى `true`، يرسل إشعارات موجزة إلى المستخدم عند بدء Compaction واكتماله (على سبيل المثال، "Compacting context..." و"Compaction complete"). وهو معطل افتراضيًا لإبقاء Compaction صامتًا.
- `memoryFlush`: دور وكيل صامت قبل Compaction التلقائي لتخزين الذكريات المستدامة. ويتم تخطيه عندما تكون مساحة العمل للقراءة فقط.

### `agents.defaults.contextPruning`

يقوم بتقليم **نتائج الأدوات القديمة** من السياق الموجود في الذاكرة قبل إرسالها إلى LLM. ولا **يعدّل** سجل الجلسة على القرص.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // مدة (ms/s/m/h)، وحدة الافتراضي: الدقائق
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="سلوك وضع cache-ttl">

- يفعّل `mode: "cache-ttl"` تمريرات التقليم.
- يتحكم `ttl` في مدى تكرار إمكانية تشغيل التقليم مرة أخرى (بعد آخر لمسة لذاكرة التخزين المؤقت).
- يقوم التقليم أولًا باقتطاع نتائج الأدوات كبيرة الحجم اقتطاعًا مرنًا، ثم يمسح نتائج الأدوات الأقدم مسحًا صارمًا إذا لزم الأمر.

**الاقتطاع المرن** يُبقي البداية + النهاية ويدرج `...` في الوسط.

**المسح الصارم** يستبدل نتيجة الأداة بالكامل بعنصر نائب.

ملاحظات:

- لا يتم اقتطاع/مسح كتل الصور مطلقًا.
- النِّسب تستند إلى الأحرف (تقريبية)، وليست إلى أعداد الرموز الدقيقة.
- إذا كان عدد رسائل المساعد أقل من `keepLastAssistants`، يتم تخطي التقليم.

</Accordion>

راجع [Session Pruning](/ar/concepts/session-pruning) لمعرفة تفاصيل السلوك.

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (استخدم minMs/maxMs)
    },
  },
}
```

- تتطلب القنوات غير Telegram تعيين `*.blockStreaming: true` صراحةً لتمكين ردود الكتل.
- تجاوزات القنوات: `channels.<channel>.blockStreamingCoalesce` (ومتغيرات كل حساب). وتكون القيم الافتراضية لـ Signal/Slack/Discord/Google Chat هي `minChars: 1500`.
- `humanDelay`: توقف عشوائي بين ردود الكتل. يعني `natural` = ‏800–2500ms. تجاوز لكل وكيل: `agents.list[].humanDelay`.

راجع [Streaming](/ar/concepts/streaming) لمعرفة تفاصيل السلوك + التجزئة.

### مؤشرات الكتابة

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- الإعدادات الافتراضية: `instant` للدردشات المباشرة/mentions، و`message` لدردشات المجموعات غير المذكورة.
- تجاوزات لكل جلسة: `session.typingMode` و`session.typingIntervalSeconds`.

راجع [Typing Indicators](/ar/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

وضع Sandboxing اختياري للوكيل المضمن. راجع [Sandboxing](/ar/gateway/sandboxing) للحصول على الدليل الكامل.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / المحتويات المضمنة مدعومة أيضًا:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="تفاصيل Sandbox">

**الخلفية:**

- `docker`: وقت تشغيل Docker محلي (الافتراضي)
- `ssh`: وقت تشغيل عام بعيد قائم على SSH
- `openshell`: وقت تشغيل OpenShell

عند اختيار `backend: "openshell"`، تنتقل الإعدادات الخاصة بوقت التشغيل إلى
`plugins.entries.openshell.config`.

**تهيئة خلفية SSH:**

- `target`: هدف SSH بصيغة `user@host[:port]`
- `command`: أمر عميل SSH (الافتراضي: `ssh`)
- `workspaceRoot`: الجذر البعيد المطلق المستخدم لمساحات العمل لكل نطاق
- `identityFile` / `certificateFile` / `knownHostsFile`: ملفات محلية موجودة تُمرَّر إلى OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: محتويات مضمنة أو SecretRefs يقوم OpenClaw بتحويلها إلى ملفات مؤقتة وقت التشغيل
- `strictHostKeyChecking` / `updateHostKeys`: مفاتيح سياسة مفاتيح المضيف في OpenSSH

**أولوية مصادقة SSH:**

- تتغلب `identityData` على `identityFile`
- تتغلب `certificateData` على `certificateFile`
- تتغلب `knownHostsData` على `knownHostsFile`
- يتم حل القيم `*Data` المدعومة بـ SecretRef من لقطة وقت تشغيل الأسرار النشطة قبل بدء جلسة Sandbox

**سلوك خلفية SSH:**

- يهيّئ مساحة العمل البعيدة مرة واحدة بعد الإنشاء أو إعادة الإنشاء
- ثم يُبقي مساحة عمل SSH البعيدة هي النسخة القانونية
- يوجّه `exec` وأدوات الملفات ومسارات الوسائط عبر SSH
- لا يزامن التغييرات البعيدة مرة أخرى إلى المضيف تلقائيًا
- لا يدعم حاويات متصفح Sandbox

**وصول مساحة العمل:**

- `none`: مساحة عمل Sandbox لكل نطاق تحت `~/.openclaw/sandboxes`
- `ro`: مساحة عمل Sandbox عند `/workspace`، ومساحة عمل الوكيل مركبة للقراءة فقط عند `/agent`
- `rw`: مساحة عمل الوكيل مركبة للقراءة والكتابة عند `/workspace`

**النطاق:**

- `session`: حاوية + مساحة عمل لكل جلسة
- `agent`: حاوية + مساحة عمل واحدة لكل وكيل (الافتراضي)
- `shared`: حاوية ومساحة عمل مشتركتان (من دون عزل بين الجلسات)

**تهيئة Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // اختياري
          gatewayEndpoint: "https://lab.example", // اختياري
          policy: "strict", // معرّف سياسة OpenShell اختياري
          providers: ["openai"], // اختياري
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**وضع OpenShell:**

- `mirror`: يهيّئ البعيد من المحلي قبل exec، ويزامن إلى الخلف بعد exec؛ وتظل مساحة العمل المحلية هي النسخة القانونية
- `remote`: يهيّئ البعيد مرة واحدة عند إنشاء Sandbox، ثم يُبقي مساحة العمل البعيدة هي النسخة القانونية

في وضع `remote`، لا تتم مزامنة التعديلات المحلية على المضيف التي تتم خارج OpenClaw إلى Sandbox تلقائيًا بعد خطوة التهيئة.
وسيلة النقل هي SSH إلى OpenShell Sandbox، لكن Plugin هو من يملك دورة حياة Sandbox والمزامنة المعكوسة الاختيارية.

يعمل **`setupCommand`** مرة واحدة بعد إنشاء الحاوية (عبر `sh -lc`). ويحتاج إلى خروج شبكي، وجذر قابل للكتابة، ومستخدم root.

**الحاويات تستخدم افتراضيًا `network: "none"`** — عيّنه إلى `"bridge"` (أو شبكة bridge مخصصة) إذا كان الوكيل يحتاج إلى وصول صادر.
يتم حظر `"host"`. ويتم حظر `"container:<id>"` افتراضيًا ما لم تعيّن صراحةً
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (حل كسر الزجاج).

**المرفقات الواردة** تُجهَّز ضمن `media/inbound/*` في مساحة العمل النشطة.

**`docker.binds`** يركّب أدلة مضيف إضافية؛ ويتم دمج binds العامة وتلك الخاصة بكل وكيل.

**متصفح Sandbox** (`sandbox.browser.enabled`): Chromium + CDP داخل حاوية. ويتم حقن عنوان URL لـ noVNC في system prompt. ولا يتطلب `browser.enabled` في `openclaw.json`.
ويستخدم وصول المراقب إلى noVNC مصادقة VNC افتراضيًا، ويطلق OpenClaw عنوان URL ذي token قصير العمر (بدلًا من كشف كلمة المرور في عنوان URL المشترك).

- يمنع `allowHostControl: false` (الافتراضي) الجلسات المعزولة من استهداف متصفح المضيف.
- تكون القيمة الافتراضية لـ `network` هي `openclaw-sandbox-browser` (شبكة bridge مخصصة). عيّنها إلى `bridge` فقط عندما تريد صراحةً اتصال bridge عامًا.
- يقوم `cdpSourceRange` اختياريًا بتقييد الدخول إلى CDP عند حافة الحاوية على نطاق CIDR (مثل `172.21.0.1/32`).
- يقوم `sandbox.browser.binds` بتركيب أدلة مضيف إضافية داخل حاوية متصفح Sandbox فقط. وعند تعيينه (بما في ذلك `[]`) فإنه يستبدل `docker.binds` لحاوية المتصفح.
- يتم تعريف إعدادات التشغيل الافتراضية في `scripts/sandbox-browser-entrypoint.sh` وضبطها لمضيفي الحاويات:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (مفعّل افتراضيًا)
  - تكون `--disable-3d-apis` و`--disable-software-rasterizer` و`--disable-gpu`
    مفعّلة افتراضيًا ويمكن تعطيلها باستخدام
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` إذا كان استخدام WebGL/3D يتطلب ذلك.
  - يعيد `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` تمكين الإضافات إذا كان سير عملك
    يعتمد عليها.
  - يمكن تغيير `--renderer-process-limit=2` باستخدام
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`؛ عيّن `0` لاستخدام
    حد العمليات الافتراضي في Chromium.
  - بالإضافة إلى `--no-sandbox` عند تمكين `noSandbox`.
  - الإعدادات الافتراضية هي خط أساس صورة الحاوية؛ استخدم صورة متصفح مخصصة مع
    entrypoint مخصص لتغيير الإعدادات الافتراضية للحاوية.

</Accordion>

يقتصر Sandboxing للمتصفح و`sandbox.docker.binds` على Docker فقط.

ابنِ الصور:

```bash
scripts/sandbox-setup.sh           # صورة Sandbox الرئيسية
scripts/sandbox-browser-setup.sh   # صورة المتصفح الاختيارية
```

### `agents.list` (تجاوزات لكل وكيل)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // أو { primary, fallbacks }
        thinkingDefault: "high", // تجاوز مستوى thinking لكل وكيل
        reasoningDefault: "on", // تجاوز ظهور reasoning لكل وكيل
        fastModeDefault: false, // تجاوز fast mode لكل وكيل
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // يتجاوز params المطابقة في defaults.models حسب المفتاح
        skills: ["docs-search"], // تستبدل agents.defaults.skills عند تعيينها
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: معرّف وكيل ثابت (مطلوب).
- `default`: عند تعيين أكثر من واحد، يفوز الأول (مع تسجيل تحذير). وإذا لم يُعيَّن أيٌّ منها، يكون أول إدخال في القائمة هو الافتراضي.
- `model`: صيغة السلسلة تتجاوز `primary` فقط؛ وصيغة الكائن `{ primary, fallbacks }` تتجاوز الاثنين معًا (`[]` يعطّل fallbackات العامة). وتظل مهام Cron التي تتجاوز `primary` فقط ترث fallbackات الافتراضية ما لم تعيّن `fallbacks: []`.
- `params`: params تدفق لكل وكيل تُدمج فوق إدخال النموذج المحدد في `agents.defaults.models`. استخدم هذا من أجل تجاوزات خاصة بالوكيل مثل `cacheRetention` أو `temperature` أو `maxTokens` من دون تكرار كتالوج النموذج بالكامل.
- `skills`: قائمة سماح Skills اختيارية لكل وكيل. وعند حذفها، يرث الوكيل `agents.defaults.skills` إذا كانت معينة؛ وتستبدل القائمة الصريحة الإعدادات الافتراضية بدل دمجها، وتعني `[]` عدم وجود Skills.
- `thinkingDefault`: مستوى thinking افتراضي اختياري لكل وكيل (`off | minimal | low | medium | high | xhigh | adaptive | max`). ويتجاوز `agents.defaults.thinkingDefault` لهذا الوكيل عندما لا يكون هناك تجاوز لكل رسالة أو جلسة. ويتحكم ملف تعريف المزوّد/النموذج المحدد في القيم الصالحة؛ وبالنسبة إلى Google Gemini، فإن `adaptive` يُبقي thinking الديناميكي المملوك للمزوّد (`thinkingLevel` محذوف في Gemini 3/3.1، و`thinkingBudget: -1` في Gemini 2.5).
- `reasoningDefault`: ظهور reasoning افتراضي اختياري لكل وكيل (`on | off | stream`). ويُطبّق عندما لا يكون هناك تجاوز reasoning لكل رسالة أو جلسة.
- `fastModeDefault`: افتراضي اختياري لكل وكيل لـ fast mode (`true | false`). ويُطبّق عندما لا يكون هناك تجاوز fast-mode لكل رسالة أو جلسة.
- `embeddedHarness`: تجاوز اختياري لكل وكيل لسياسة الحزمة منخفضة المستوى. استخدم `{ runtime: "codex" }` لجعل وكيل واحد يعتمد على Codex فقط بينما يحتفظ الوكلاء الآخرون بالرجوع الافتراضي إلى PI في وضع `auto`.
- `runtime`: واصف runtime اختياري لكل وكيل. استخدم `type: "acp"` مع القيم الافتراضية في `runtime.acp` (`agent` و`backend` و`mode` و`cwd`) عندما يجب أن يعتمد الوكيل افتراضيًا جلسات ACP harness.
- `identity.avatar`: مسار نسبي إلى مساحة العمل، أو عنوان URL بصيغة `http(s)`، أو URI بصيغة `data:`.
- تستنتج `identity` القيم الافتراضية: `ackReaction` من `emoji`، و`mentionPatterns` من `name`/`emoji`.
- `subagents.allowAgents`: قائمة سماح لمعرّفات الوكلاء من أجل `sessions_spawn` (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- حاجز وراثة Sandbox: إذا كانت جلسة الطالب معزولة، فإن `sessions_spawn` يرفض الأهداف التي ستعمل من دون عزل.
- `subagents.requireAgentId`: عند تعيينه إلى true، يمنع استدعاءات `sessions_spawn` التي تحذف `agentId` (يفرض اختيار ملف تعريف صريح؛ الافتراضي: false).

---

## التوجيه متعدد الوكلاء

شغّل عدة وكلاء معزولين داخل Gateway واحد. راجع [Multi-Agent](/ar/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### حقول مطابقة الربط

- `type` (اختياري): `route` للتوجيه العادي (ويفترض غياب النوع قيمة route)، و`acp` لروابط محادثات ACP المستدامة.
- `match.channel` (مطلوب)
- `match.accountId` (اختياري؛ `*` = أي حساب؛ وحذفه = الحساب الافتراضي)
- `match.peer` (اختياري؛ `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (اختياريان؛ خاصان بكل قناة)
- `acp` (اختياري؛ فقط لإدخالات `type: "acp"`): ‏`{ mode, label, cwd, backend }`

**ترتيب المطابقة الحتمي:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (مطابقة دقيقة، من دون peer/guild/team)
5. `match.accountId: "*"` (على مستوى القناة)
6. الوكيل الافتراضي

ضمن كل طبقة، يفوز أول إدخال مطابق في `bindings`.

بالنسبة إلى إدخالات `type: "acp"`، يقوم OpenClaw بالحل حسب هوية المحادثة الدقيقة (`match.channel` + الحساب + `match.peer.id`) ولا يستخدم ترتيب طبقات route binding أعلاه.

### ملفات تعريف الوصول لكل وكيل

<Accordion title="وصول كامل (من دون Sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="أدوات + مساحة عمل للقراءة فقط">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="لا وصول إلى نظام الملفات (مراسلة فقط)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

راجع [Sandbox & Tools للوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) لمعرفة تفاصيل الأولوية.

---

## الجلسة

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // تخطي fork سلسلة الأصل فوق هذا العدد من الرموز (0 يعطّل)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // مدة أو false
      maxDiskBytes: "500mb", // ميزانية صارمة اختيارية
      highWaterBytes: "400mb", // هدف تنظيف اختياري
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // الإلغاء التلقائي للتركيز بعد الخمول افتراضيًا بالساعات (`0` يعطّل)
      maxAgeHours: 0, // الحد الأقصى الصارم للعمر افتراضيًا بالساعات (`0` يعطّل)
    },
    mainKey: "main", // قديم (يستخدم وقت التشغيل دائمًا "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="تفاصيل حقول الجلسة">

- **`scope`**: استراتيجية تجميع الجلسات الأساسية لسياقات دردشة المجموعات.
  - `per-sender` (الافتراضي): يحصل كل مرسل على جلسة معزولة ضمن سياق القناة.
  - `global`: يشترك جميع المشاركين في سياق القناة في جلسة واحدة (استخدمه فقط عندما يكون السياق المشترك مقصودًا).
- **`dmScope`**: كيفية تجميع الرسائل المباشرة.
  - `main`: تشترك جميع الرسائل المباشرة في الجلسة الرئيسية.
  - `per-peer`: العزل حسب معرّف المرسل عبر القنوات.
  - `per-channel-peer`: العزل لكل قناة + مرسل (موصى به لصناديق الوارد متعددة المستخدمين).
  - `per-account-channel-peer`: العزل لكل حساب + قناة + مرسل (موصى به للحسابات المتعددة).
- **`identityLinks`**: خريطة المعرّفات القانونية إلى نظائر مسبوقة بالمزوّد من أجل مشاركة الجلسة عبر القنوات.
- **`reset`**: سياسة reset الأساسية. يقوم `daily` بإعادة التعيين عند `atHour` بالتوقيت المحلي؛ ويقوم `idle` بإعادة التعيين بعد `idleMinutes`. وعند تهيئة الاثنين، يفوز ما ينتهي أولًا.
- **`resetByType`**: تجاوزات حسب النوع (`direct` و`group` و`thread`). ويُقبل `dm` القديم كاسم مستعار لـ `direct`.
- **`parentForkMaxTokens`**: الحد الأقصى لـ `totalTokens` لجلسة الأصل المسموح به عند إنشاء جلسة سلسلة متفرعة (الافتراضي `100000`).
  - إذا كانت قيمة `totalTokens` للأصل أعلى من هذه القيمة، يبدأ OpenClaw جلسة سلسلة جديدة بدلًا من وراثة سجل نص الأصل.
  - عيّن `0` لتعطيل هذا الحاجز والسماح دائمًا بالتفرع من الأصل.
- **`mainKey`**: حقل قديم. يستخدم وقت التشغيل دائمًا `"main"` لدلو الدردشة المباشرة الرئيسي.
- **`agentToAgent.maxPingPongTurns`**: الحد الأقصى لأدوار الرد المتبادل بين الوكلاء أثناء تبادلات وكيل إلى وكيل (عدد صحيح، المدى: `0`–`5`). تعني `0` تعطيل تسلسل ping-pong.
- **`sendPolicy`**: المطابقة حسب `channel`، أو `chatType` (`direct|group|channel`، مع الاسم المستعار القديم `dm`)، أو `keyPrefix`، أو `rawKeyPrefix`. يفوز أول منع.
- **`maintenance`**: عناصر تنظيف مخزن الجلسات + التحكم في الاحتفاظ.
  - `mode`: ‏`warn` يطلق تحذيرات فقط؛ و`enforce` يطبق التنظيف.
  - `pruneAfter`: حد العمر للإدخالات القديمة (الافتراضي `30d`).
  - `maxEntries`: الحد الأقصى لعدد الإدخالات في `sessions.json` (الافتراضي `500`).
  - `rotateBytes`: تدوير `sessions.json` عندما يتجاوز هذا الحجم (الافتراضي `10mb`).
  - `resetArchiveRetention`: مدة الاحتفاظ بأرشيفات النصوص `*.reset.<timestamp>`. وتكون افتراضيًا مساوية لـ `pruneAfter`؛ عيّن `false` لتعطيلها.
  - `maxDiskBytes`: ميزانية قرص اختيارية لدليل الجلسات. في وضع `warn` يسجل تحذيرات؛ وفي وضع `enforce` يزيل أقدم العناصر/الجلسات أولًا.
  - `highWaterBytes`: هدف اختياري بعد تنظيف الميزانية. ويكون افتراضيًا `80%` من `maxDiskBytes`.
- **`threadBindings`**: القيم الافتراضية العامة لميزات الجلسات المرتبطة بسلاسل الرسائل.
  - `enabled`: مفتاح التشغيل الرئيسي الافتراضي (يمكن للمزوّدين تجاوزه؛ ويستخدم Discord القيمة `channels.discord.threadBindings.enabled`)
  - `idleHours`: الإلغاء التلقائي الافتراضي للتركيز بعد الخمول بالساعات (`0` يعطّل؛ ويمكن للمزوّدين تجاوزه)
  - `maxAgeHours`: الحد الأقصى الصارم الافتراضي للعمر بالساعات (`0` يعطّل؛ ويمكن للمزوّدين تجاوزه)

</Accordion>

---

## الرسائل

```json5
{
  messages: {
    responsePrefix: "🦞", // أو "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 يعطّل
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### بادئة الرد

تجاوزات لكل قناة/حساب: `channels.<channel>.responsePrefix` و`channels.<channel>.accounts.<id>.responsePrefix`.

الحل (الأكثر تحديدًا يفوز): الحساب → القناة → العام. تقوم `""` بالتعطيل وإيقاف التسلسل. ويشتق `"auto"` القيمة `[{identity.name}]`.

**متغيرات القالب:**

| المتغير          | الوصف                  | المثال                      |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | الاسم المختصر للنموذج  | `claude-opus-4-6`           |
| `{modelFull}`     | معرّف النموذج الكامل   | `anthropic/claude-opus-4-6` |
| `{provider}`      | اسم المزوّد            | `anthropic`                 |
| `{thinkingLevel}` | مستوى thinking الحالي  | `high` أو `low` أو `off`    |
| `{identity.name}` | اسم هوية الوكيل        | (مثل `"auto"` نفسه)         |

المتغيرات غير حساسة لحالة الأحرف. و`{think}` اسم مستعار لـ `{thinkingLevel}`.

### تفاعل الإقرار

- تكون القيمة الافتراضية هي `identity.emoji` للوكيل النشط، وإلا `"👀"`. عيّن `""` للتعطيل.
- تجاوزات لكل قناة: `channels.<channel>.ackReaction` و`channels.<channel>.accounts.<id>.ackReaction`.
- ترتيب الحل: الحساب → القناة → `messages.ackReaction` → الرجوع إلى identity.
- النطاق: `group-mentions` (الافتراضي)، أو `group-all`، أو `direct`، أو `all`.
- يقوم `removeAckAfterReply` بإزالة الإقرار بعد الرد على Slack وDiscord وTelegram.
- يقوم `messages.statusReactions.enabled` بتمكين تفاعلات حالة دورة الحياة على Slack وDiscord وTelegram.
  في Slack وDiscord، يؤدي عدم التعيين إلى إبقاء تفاعلات الحالة مفعّلة عندما تكون تفاعلات الإقرار نشطة.
  وفي Telegram، عيّنه صراحةً إلى `true` لتمكين تفاعلات حالة دورة الحياة.

### إزالة ارتداد الرسائل الواردة

يقوم بتجميع الرسائل النصية السريعة فقط من المرسل نفسه في دور وكيل واحد. وتؤدي الوسائط/المرفقات إلى التفريغ فورًا. وتتجاوز أوامر التحكم إزالة الارتداد.

### TTS (تحويل النص إلى كلام)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- يتحكم `auto` في وضع TTS التلقائي الافتراضي: `off` أو `always` أو `inbound` أو `tagged`. ويمكن للأمر `/tts on|off` تجاوز التفضيلات المحلية، ويعرض `/tts status` الحالة الفعلية.
- يتجاوز `summaryModel` قيمة `agents.defaults.model.primary` للملخص التلقائي.
- يكون `modelOverrides` مفعّلًا افتراضيًا؛ وتكون القيمة الافتراضية لـ `modelOverrides.allowProvider` هي `false` (اشتراك صريح).
- ترجع مفاتيح API إلى `ELEVENLABS_API_KEY`/`XI_API_KEY` و`OPENAI_API_KEY`.
- إن مزوّدي الكلام المضمنين مملوكون لـ Plugin. إذا تم تعيين `plugins.allow`، فأدرج كل Plugin مزوّد TTS تريد استخدامه، مثل `microsoft` لـ Edge TTS. ويُقبل معرّف المزوّد القديم `edge` كاسم مستعار لـ `microsoft`.
- تتجاوز `providers.openai.baseUrl` نقطة نهاية OpenAI TTS. ترتيب الحل هو: التهيئة، ثم `OPENAI_TTS_BASE_URL`، ثم `https://api.openai.com/v1`.
- عندما تشير `providers.openai.baseUrl` إلى نقطة نهاية ليست لـ OpenAI، يعاملها OpenClaw على أنها خادم TTS متوافق مع OpenAI ويخفف التحقق من النموذج/الصوت.

---

## Talk

الإعدادات الافتراضية لوضع Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- يجب أن تطابق `talk.provider` مفتاحًا في `talk.providers` عند تهيئة عدة مزودين لـ Talk.
- تكون مفاتيح Talk القديمة المسطحة (`talk.voiceId` و`talk.voiceAliases` و`talk.modelId` و`talk.outputFormat` و`talk.apiKey`) للتوافق فقط، ويتم ترحيلها تلقائيًا إلى `talk.providers.<provider>`.
- ترجع معرّفات الأصوات إلى `ELEVENLABS_VOICE_ID` أو `SAG_VOICE_ID`.
- تقبل `providers.*.apiKey` سلاسل نصية صريحة أو كائنات SecretRef.
- لا يُطبّق الرجوع إلى `ELEVENLABS_API_KEY` إلا عندما لا يكون مفتاح API الخاص بـ Talk مهيأ.
- تتيح `providers.*.voiceAliases` لتوجيهات Talk استخدام أسماء ودية.
- يحدد `providers.mlx.modelId` مستودع Hugging Face المستخدم بواسطة مساعد MLX المحلي على macOS. وإذا تم حذفه، يستخدم macOS القيمة `mlx-community/Soprano-80M-bf16`.
- يعمل تشغيل MLX على macOS عبر المساعد المضمّن `openclaw-mlx-tts` عندما يكون موجودًا، أو عبر ملف تنفيذي على `PATH`؛ ويقوم `OPENCLAW_MLX_TTS_BIN` بتجاوز مسار المساعد لأغراض التطوير.
- يتحكم `silenceTimeoutMs` في المدة التي ينتظرها وضع Talk بعد صمت المستخدم قبل أن يرسل النص. وتركه غير معيّن يُبقي نافذة التوقف الافتراضية الخاصة بالمنصة (`700 ms` على macOS وAndroid، و`900 ms` على iOS).

---

## ذو صلة

- [مرجع التهيئة](/ar/gateway/configuration-reference) — جميع مفاتيح التهيئة الأخرى
- [التهيئة](/ar/gateway/configuration) — المهام الشائعة والإعداد السريع
- [أمثلة التهيئة](/ar/gateway/configuration-examples)
