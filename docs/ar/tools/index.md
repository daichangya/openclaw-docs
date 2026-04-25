---
read_when:
    - تريد أن تفهم ما الأدوات التي يوفرها OpenClaw
    - تحتاج إلى تهيئة الأدوات أو السماح بها أو منعها
    - أنت تقرر بين الأدوات المضمنة وSkills وPlugins
summary: 'نظرة عامة على أدوات OpenClaw وPlugins: ما الذي يمكن للـ agent فعله وكيفية توسيعه'
title: الأدوات وPlugins
x-i18n:
    generated_at: "2026-04-25T13:59:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

كل ما يفعله agent خارج توليد النص يحدث عبر **الأدوات**.
الأدوات هي الطريقة التي يقرأ بها agent الملفات، ويشغّل الأوامر، ويتصفح الويب، ويرسل
الرسائل، ويتفاعل مع الأجهزة.

## الأدوات وSkills وPlugins

يحتوي OpenClaw على ثلاث طبقات تعمل معًا:

<Steps>
  <Step title="الأدوات هي ما يستدعيه agent">
    الأداة هي دالة مكتوبة الأنواع يمكن للـ agent استدعاؤها (مثل `exec` و`browser`،
    و`web_search`، و`message`). يشحن OpenClaw مجموعة من **الأدوات المضمنة** ويمكن
    لـ Plugins تسجيل أدوات إضافية.

    يرى agent الأدوات على أنها تعريفات دوال منظمة تُرسل إلى API النموذج.

  </Step>

  <Step title="تعلم Skills الـ agent متى وكيف">
    الـ skill هو ملف markdown (`SKILL.md`) يُحقن في موجّه النظام.
    تمنح Skills الـ agent سياقًا، وقيودًا، وإرشادًا خطوة بخطوة من أجل
    استخدام الأدوات بفعالية. تعيش Skills في مساحة العمل الخاصة بك، أو في مجلدات
    مشتركة، أو تُشحن داخل Plugins.

    [مرجع Skills](/ar/tools/skills) | [إنشاء Skills](/ar/tools/creating-skills)

  </Step>

  <Step title="تجمع Plugins كل شيء معًا">
    الـ Plugin هو حزمة يمكنها تسجيل أي مزيج من الإمكانات:
    القنوات، وموفّرو النماذج، والأدوات، وSkills، والكلام، والنسخ الآني،
    والصوت الآني، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، والبحث على الويب، وغير ذلك. بعض Plugins **أساسية** (تُشحن مع
    OpenClaw)، وأخرى **خارجية** (ينشرها المجتمع على npm).

    [تثبيت Plugins وتهيئتها](/ar/tools/plugin) | [أنشئ Plugin خاصًا بك](/ar/plugins/building-plugins)

  </Step>
</Steps>

## الأدوات المضمنة

تُشحن هذه الأدوات مع OpenClaw وتكون متاحة من دون تثبيت أي Plugins:

| الأداة                                     | ما الذي تفعله                                                      | الصفحة                                                       |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `exec` / `process`                         | تشغيل أوامر shell، وإدارة العمليات في الخلفية                     | [Exec](/ar/tools/exec)، [موافقات Exec](/ar/tools/exec-approvals) |
| `code_execution`                           | تشغيل تحليل Python بعيد داخل sandbox                               | [Code Execution](/ar/tools/code-execution)                      |
| `browser`                                  | التحكم في متصفح Chromium (تنقل، نقر، لقطة شاشة)                   | [Browser](/ar/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | البحث في الويب، والبحث في منشورات X، وجلب محتوى الصفحة            | [الويب](/ar/tools/web)، [Web Fetch](/ar/tools/web-fetch)         |
| `read` / `write` / `edit`                  | إدخال/إخراج الملفات في مساحة العمل                                 |                                                              |
| `apply_patch`                              | رقع ملفات متعددة المقاطع                                           | [Apply Patch](/ar/tools/apply-patch)                            |
| `message`                                  | إرسال الرسائل عبر جميع القنوات                                     | [إرسال agent](/ar/tools/agent-send)                            |
| `canvas`                                   | تشغيل Canvas الخاصة بـ node ‏(عرض، eval، لقطة)                    |                                                              |
| `nodes`                                    | اكتشاف الأجهزة المقترنة واستهدافها                                  |                                                              |
| `cron` / `gateway`                         | إدارة الوظائف المجدولة؛ وفحص Gateway أو ترقيعه أو إعادة تشغيله أو تحديثه |                                                              |
| `image` / `image_generate`                 | تحليل الصور أو توليدها                                             | [توليد الصور](/ar/tools/image-generation)                      |
| `music_generate`                           | توليد مقاطع موسيقية                                                | [توليد الموسيقى](/ar/tools/music-generation)                   |
| `video_generate`                           | توليد الفيديوهات                                                   | [توليد الفيديو](/ar/tools/video-generation)                    |
| `tts`                                      | تحويل النص إلى كلام دفعة واحدة                                     | [TTS](/ar/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | إدارة الجلسات، والحالة، وتنسيق الـ sub-agent                       | [Sub-agents](/ar/tools/subagents)                               |
| `session_status`                           | قراءة خفيفة على نمط `/status` وتجاوز نموذج الجلسة                  | [أدوات الجلسة](/ar/concepts/session-tool)                      |

في أعمال الصور، استخدم `image` للتحليل و`image_generate` للتوليد أو التحرير. وإذا كنت تستهدف `openai/*` أو `google/*` أو `fal/*` أو موفر صور غير افتراضي آخر، فقم أولًا بتهيئة المصادقة/مفتاح API لذلك الموفّر.

في أعمال الموسيقى، استخدم `music_generate`. وإذا كنت تستهدف `google/*` أو `minimax/*` أو موفر موسيقى غير افتراضي آخر، فقم أولًا بتهيئة المصادقة/مفتاح API لذلك الموفّر.

في أعمال الفيديو، استخدم `video_generate`. وإذا كنت تستهدف `qwen/*` أو موفر فيديو غير افتراضي آخر، فقم أولًا بتهيئة المصادقة/مفتاح API لذلك الموفّر.

في توليد الصوت المعتمد على سير العمل، استخدم `music_generate` عندما يسجل Plugin مثل
ComfyUI هذه الأداة. وهذا منفصل عن `tts`، الذي يمثل تحويل النص إلى كلام.

تُعد `session_status` أداة الحالة/القراءة الخفيفة ضمن مجموعة الجلسات.
فهي تجيب عن أسئلة على نمط `/status` بشأن الجلسة الحالية ويمكنها
اختياريًا ضبط تجاوز نموذج لكل جلسة؛ حيث يؤدي `model=default` إلى مسح
ذلك التجاوز. وكما في `/status`، يمكنها استكمال عدادات الرموز/الذاكرة المؤقتة الشحيحة
وعلامة نموذج وقت التشغيل النشط من أحدث إدخال استخدام في النص المفرغ.

تمثل `gateway` أداة وقت التشغيل الخاصة بالمالك لعمليات Gateway:

- `config.schema.lookup` من أجل شجرة فرعية لإعدادات مقيّدة بمسار واحد قبل التحرير
- `config.get` من أجل لقطة الإعداد الحالية + hash
- `config.patch` من أجل تحديثات جزئية للإعداد مع إعادة تشغيل
- `config.apply` فقط من أجل استبدال التهيئة الكاملة
- `update.run` من أجل تحديث ذاتي صريح + إعادة تشغيل

بالنسبة إلى التغييرات الجزئية، فضّل `config.schema.lookup` ثم `config.patch`. استخدم
`config.apply` فقط عندما تقصد استبدال التهيئة بالكامل.
وترفض الأداة أيضًا تغيير `tools.exec.ask` أو `tools.exec.security`؛
إذ تُطبَّع الأسماء البديلة القديمة `tools.bash.*` إلى مسارات exec
المحمية نفسها.

### الأدوات التي توفرها Plugins

يمكن لـ Plugins تسجيل أدوات إضافية. بعض الأمثلة:

- [Diffs](/ar/tools/diffs) — عارض ومصيّر للفروق
- [LLM Task](/ar/tools/llm-task) — خطوة LLM تعتمد JSON فقط من أجل مخرجات منظمة
- [Lobster](/ar/tools/lobster) — وقت تشغيل سير عمل مكتوب الأنواع مع موافقات قابلة للاستئناف
- [توليد الموسيقى](/ar/tools/music-generation) — أداة `music_generate` مشتركة مع موفّرين مدعومين بسير العمل
- [OpenProse](/ar/prose) — تنسيق سير عمل يعتمد markdown أولًا
- [Tokenjuice](/ar/tools/tokenjuice) — ضغط النتائج المليئة بالضجيج لأداتي `exec` و`bash`

## تهيئة الأدوات

### قوائم السماح والمنع

تحكم في الأدوات التي يمكن للـ agent استدعاؤها عبر `tools.allow` / `tools.deny` في
التهيئة. ويحسم المنع دائمًا لصالحه.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

يفشل OpenClaw بشكل مغلق عندما تُحل قائمة سماح صريحة إلى عدم وجود أدوات قابلة للاستدعاء.
فعلى سبيل المثال، لا يعمل `tools.allow: ["query_db"]` إلا إذا كان Plugin محمّل
قد سجّل فعلًا `query_db`. وإذا لم تطابق قائمة السماح أي أداة مضمنة أو Plugin أو أداة MCP
مضمّنة محمّلة، يتوقف التشغيل قبل استدعاء النموذج بدلًا من الاستمرار
كتشغيل نصي فقط قد يهلوس نتائج أدوات.

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل تطبيق `allow`/`deny`.
والتجاوز لكل agent هو: `agents.list[].tools.profile`.

| ملف التعريف | ما الذي يتضمنه                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | بلا تقييد (مثل عدم التعيين)                                                                                                                       |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`music_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status`                                                         |
| `minimal`   | `session_status` فقط                                                                                                                             |

يسمح ملفا التعريف `coding` و`messaging` أيضًا بأدوات MCP المضمّنة المهيأة
تحت مفتاح Plugin ‏`bundle-mcp`. أضف `tools.deny: ["bundle-mcp"]` عندما
تريد أن يحتفظ ملف التعريف بأدواته المضمنة العادية لكنه يخفي جميع أدوات MCP المهيأة.
ولا يتضمن ملف التعريف `minimal` أدوات MCP المضمّنة.

### مجموعات الأدوات

استخدم اختصارات `group:*` في قوائم السماح/المنع:

| المجموعة          | الأدوات                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec، process، code_execution (يُقبل `bash` كاسم بديل لـ `exec`)                                         |
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
| `group:openclaw`   | جميع أدوات OpenClaw المضمنة (لا يشمل أدوات Plugins)                                                      |

تعيد `sessions_history` عرض استدعاء مقيدًا ومفلترًا من حيث السلامة. فهي تزيل
وسوم التفكير، وبنية `<relevant-memories>`،
وحمولات XML النصية العادية لاستدعاءات الأدوات (بما في ذلك
`<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`،
وكتل استدعاءات الأدوات المقتطعة)، وبنية استدعاءات الأدوات المخفّضة،
ورموز التحكم الخاصة بالنموذج المسرّبة بصيغة ASCII/العرض الكامل،
وXML استدعاءات أدوات MiniMax المشوّه من نص المساعد، ثم تطبق
الإخفاء/الاقتطاع، وربما عناصر نائبة لصفوف متضخمة بدلًا من العمل
كتفريغ نصي خام.

### قيود خاصة بالموفّر

استخدم `tools.byProvider` لتقييد الأدوات لموفّرين محددين من دون
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
