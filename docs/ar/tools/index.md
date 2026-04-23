---
read_when:
    - تريد فهم الأدوات التي يوفرها OpenClaw
    - تحتاج إلى تكوين الأدوات أو السماح بها أو منعها
    - أنت تقرر بين الأدوات المضمنة وSkills وPlugins
summary: 'نظرة عامة على أدوات وPlugins في OpenClaw: ما الذي يمكن للوكيل فعله وكيفية توسيعه'
title: الأدوات وPlugins
x-i18n:
    generated_at: "2026-04-23T07:33:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# الأدوات وPlugins

كل ما يفعله الوكيل خارج توليد النص يحدث عبر **الأدوات**.
فالأدوات هي الطريقة التي يقرأ بها الوكيل الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وPlugins

يحتوي OpenClaw على ثلاث طبقات تعمل معًا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه الوكيل">
    الأداة هي دالة مطبوعة يمكن للوكيل استدعاؤها (مثل `exec` أو `browser` أو
    `web_search` أو `message`). يشحن OpenClaw مجموعة من **الأدوات المضمنة** ويمكن لـ
    Plugins تسجيل أدوات إضافية.

    يرى الوكيل الأدوات على شكل تعريفات دوال مهيكلة تُرسل إلى API الخاصة بالنموذج.

  </Step>

  <Step title="Skills تعلّم الوكيل متى وكيف">
    Skill هي ملف Markdown ‏(`SKILL.md`) يُحقن في system prompt.
    تمنح Skills الوكيل السياق، والقيود، والإرشاد خطوة بخطوة
    لاستخدام الأدوات بفعالية. وتوجد Skills في مساحة عملك، أو في مجلدات مشتركة،
    أو تُشحن داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="Plugins تجمع كل شيء معًا">
    Plugin هي حزمة يمكنها تسجيل أي توليفة من القدرات:
    القنوات، ومزوّدو النماذج، والأدوات، وSkills، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، وبحث الويب، وغير ذلك. بعض Plugins **أساسية** (تُشحن مع
    OpenClaw)، وبعضها الآخر **خارجية** (ينشرها المجتمع على npm).

    [تثبيت Plugins وتكوينها](/ar/tools/plugin) | [ابنِ Plugin الخاصة بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المضمنة

تشحن هذه الأدوات مع OpenClaw وتكون متاحة من دون تثبيت أي Plugins:

| الأداة                                       | ما الذي تفعله                                                          | الصفحة                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر shell وإدارة العمليات الخلفية                       | [Exec](/ar/tools/exec)، [موافقات Exec](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python معزول عن بُعد                                  | [تنفيذ الشيفرة](/ar/tools/code-execution)                      |
| `browser`                                  | التحكم في browser من نوع Chromium ‏(التنقل، النقر، لقطة الشاشة)              | [Browser](/ar/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحات                    | [الويب](/ar/tools/web)، [Web Fetch](/ar/tools/web-fetch)             |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                             |                                                              |
| `apply_patch`                              | ترقيعات ملفات متعددة المقاطع                                               | [Apply Patch](/ar/tools/apply-patch)                            |
| `message`                                  | إرسال الرسائل عبر جميع القنوات                                     | [إرسال الوكيل](/ar/tools/agent-send)                              |
| `canvas`                                   | تشغيل node Canvas ‏(present، eval، snapshot)                           |                                                              |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                    |                                                              |
| `cron` / `gateway`                         | إدارة المهام المجدولة؛ فحص Gateway أو ترقيعها أو إعادة تشغيلها أو تحديثها |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                            | [توليد الصور](/ar/tools/image-generation)                  |
| `music_generate`                           | توليد مقاطع موسيقية                                                 | [توليد الموسيقى](/ar/tools/music-generation)                  |
| `video_generate`                           | توليد الفيديوهات                                                       | [توليد الفيديو](/ar/tools/video-generation)                  |
| `tts`                                      | تحويل النص إلى كلام دفعة واحدة                                    | [TTS](/ar/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات، والحالة، وتنسيق الوكلاء الفرعيين               | [الوكلاء الفرعيون](/ar/tools/subagents)                               |
| `session_status`                           | قراءة خفيفة على نمط `/status` مع تجاوز نموذج الجلسة       | [أدوات الجلسات](/ar/concepts/session-tool)                      |

في الأعمال المتعلقة بالصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التعديل. وإذا كنت تستهدف `openai/*` أو `google/*` أو `fal/*` أو أي مزوّد صور غير افتراضي آخر، فقم أولًا بتكوين مصادقة/مفتاح API الخاص بذلك المزوّد.

في الأعمال المتعلقة بالموسيقى، استخدم `music_generate`. وإذا كنت تستهدف `google/*` أو `minimax/*` أو أي مزوّد موسيقى غير افتراضي آخر، فقم أولًا بتكوين مصادقة/مفتاح API الخاص بذلك المزوّد.

في الأعمال المتعلقة بالفيديو، استخدم `video_generate`. وإذا كنت تستهدف `qwen/*` أو أي مزوّد فيديو غير افتراضي آخر، فقم أولًا بتكوين مصادقة/مفتاح API الخاص بذلك المزوّد.

بالنسبة إلى توليد الصوت المعتمد على سير العمل، استخدم `music_generate` عندما تسجل Plugin مثل
ComfyUI هذه الأداة. وهذا منفصل عن `tts`، التي تُستخدم لتحويل النص إلى كلام.

تُعد `session_status` أداة الحالة/القراءة الخفيفة في مجموعة الجلسات.
فهي تجيب عن الأسئلة على نمط `/status` الخاصة بالجلسة الحالية، ويمكنها
اختياريًا ضبط تجاوز نموذج لكل جلسة؛ تؤدي `model=default` إلى مسح هذا
التجاوز. ومثل `/status`، يمكنها ملء عدادات الرموز/التخزين المؤقت الناقصة ووسم
النموذج النشط في وقت التشغيل من أحدث إدخال استخدام في النص.

تُعد `gateway` أداة وقت تشغيل مملوكة للمالك فقط لعمليات Gateway:

- `config.schema.lookup` لشجرة إعدادات فرعية واحدة محددة المسار قبل التعديلات
- `config.get` للحصول على لقطة الإعدادات الحالية + التجزئة
- `config.patch` لتحديثات الإعدادات الجزئية مع إعادة التشغيل
- `config.apply` فقط للاستبدال الكامل للإعدادات
- `update.run` للتحديث الذاتي الصريح + إعادة التشغيل

بالنسبة إلى التغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. واستخدم
`config.apply` فقط عندما تقصد استبدال الإعدادات بالكامل.
كما ترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`؛ وتُطبّع الأسماء البديلة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها.

### الأدوات المقدمة بواسطة Plugins

يمكن لـ Plugins تسجيل أدوات إضافية. بعض الأمثلة:

- [Diffs](/ar/tools/diffs) — عارض ومُصيّر الفروق
- [LLM Task](/ar/tools/llm-task) — خطوة LLM مخصصة لـ JSON فقط من أجل خرج مهيكل
- [Lobster](/ar/tools/lobster) — وقت تشغيل سير عمل مطبوع مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع مزوّدين مدعومين بسير العمل
- [OpenProse](/ar/prose) — تنسيق سير عمل يعتمد على Markdown أولًا
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط المخرجات المليئة بالضوضاء لأداتي `exec` و`bash`

## إعدادات الأدوات

### قوائم السماح والمنع

تحكم في الأدوات التي يمكن للوكيل استدعاؤها عبر `tools.allow` / `tools.deny` في
الإعدادات. ويفوز المنع دائمًا على السماح.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### ملفات تعريف الأدوات

تضبط `tools.profile` قائمة السماح الأساسية قبل تطبيق `allow`/`deny`.
التجاوز لكل وكيل: `agents.list[].tools.profile`.

| ملف التعريف     | ما الذي يتضمنه                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | بلا قيود (مثل غير المضبوط)                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` فقط                                                                                                                             |

يسمح ملفا التعريف `coding` و`messaging` أيضًا بأدوات MCP المجمّعة المضبوطة
تحت مفتاح Plugin ‏`bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد أن يحتفظ ملف التعريف بالأدوات المضمنة العادية الخاصة به لكنه يخفي جميع أدوات MCP المضبوطة.
أما ملف التعريف `minimal` فلا يتضمن أدوات MCP المجمّعة.

### مجموعات الأدوات

استخدم اختصارات `group:*` في قوائم السماح/المنع:

| المجموعة              | الأدوات                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec، process، code_execution ‏(`bash` مقبول كاسم بديل لـ `exec`)                                 |
| `group:fs`         | read، write، edit، apply_patch                                                                            |
| `group:sessions`   | sessions_list، sessions_history، sessions_send، sessions_spawn، sessions_yield، subagents، session_status |
| `group:memory`     | memory_search، memory_get                                                                                 |
| `group:web`        | web_search، x_search، web_fetch                                                                           |
| `group:ui`         | browser، canvas                                                                                           |
| `group:automation` | cron، gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image، image_generate، music_generate، video_generate، tts                                                |
| `group:openclaw`   | جميع أدوات OpenClaw المضمنة (باستثناء أدوات Plugin)                                                       |

تعيد `sessions_history` عرض استرجاع مقيدًا ومفلترًا للسلامة. فهي تزيل
وسوم التفكير، ودعامات `<relevant-memories>`, وحمولات XML النصية العادية الخاصة باستدعاء الأدوات
(بما في ذلك `<tool_call>...</tool_call>`,
و`<function_call>...</function_call>`, و`<tool_calls>...</tool_calls>`,
و`<function_calls>...</function_calls>`,
وكتل استدعاء الأدوات المقتطعة)، ودعامات استدعاء الأدوات المخففة،
ورموز التحكم في النموذج المسرّبة بصيغة ASCII/العريضة،
وXML الخاصة باستدعاء أدوات MiniMax غير الصحيحة من نص المساعد، ثم تطبق
التنقيح/الاقتطاع وعناصر نائبة محتملة للصفوف كبيرة الحجم بدلًا من العمل
كتفريغ خام للنص.

### القيود الخاصة بالمزوّد

استخدم `tools.byProvider` لتقييد الأدوات لمزوّدين محددين من دون
تغيير الإعدادات الافتراضية العامة:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
