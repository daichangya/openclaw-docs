---
read_when:
    - تثبيت Plugins أو تهيئتها
    - فهم قواعد اكتشاف Plugins وتحميلها
    - العمل مع حزم Plugins المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت Plugins الخاصة بـ OpenClaw وتهيئتها وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-04-25T14:00:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

توسّع Plugins في OpenClaw بإمكانات جديدة: القنوات، وموفّري النماذج،
وagent harnesses، والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وweb fetch، وweb
search، وغير ذلك. بعض Plugins تكون **أساسية** (تُشحن مع OpenClaw)، وأخرى
**خارجية** (منشورة على npm بواسطة المجتمع).

## البدء السريع

<Steps>
  <Step title="اعرف ما الذي جرى تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ثبّت Plugin">
    ```bash
    # من npm
    openclaw plugins install @openclaw/voice-call

    # من دليل محلي أو أرشيف
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="أعد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    ثم قم بالتهيئة تحت `plugins.entries.\<id\>.config` في ملف الإعدادات.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي من الدردشة، ففعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

يستخدم مسار التثبيت محلِّل القرار نفسه الخاص بـ CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم fallback إلى npm).

إذا كانت الإعدادات غير صالحة، فإن التثبيت يفشل عادةً بشكل مغلق ويشير بك إلى
`openclaw doctor --fix`. والاستثناء الوحيد للاسترداد هو مسار ضيق لإعادة تثبيت Plugin مجمّع
لـ Plugins التي تختار
`openclaw.install.allowInvalidConfigRecovery`.

لا تقوم عمليات تثبيت OpenClaw المعبأة بتثبيت شجرة اعتماديات وقت التشغيل لكل Plugin مجمّع
مسبقًا. عندما يكون Plugin مجمّع ومملوك لـ OpenClaw نشطًا عبر
إعدادات Plugin، أو إعدادات القناة القديمة، أو manifest مفعّل افتراضيًا،
فإن بدء التشغيل يصلح فقط اعتماديات وقت التشغيل المعلنة لذلك Plugin قبل استيراده.
ويظل التعطيل الصريح هو الفائز: تمنع `plugins.entries.<id>.enabled: false`،
و`plugins.deny`، و`plugins.enabled: false`، و`channels.<id>.enabled: false`
الإصلاح التلقائي لاعتماديات وقت التشغيل المجمّعة لذلك Plugin/القناة.
أما Plugins الخارجية ومسارات التحميل المخصصة فما تزال بحاجة إلى التثبيت عبر
`openclaw plugins install`.

## أنواع Plugins

يتعرف OpenClaw على تنسيقين من Plugins:

| التنسيق     | كيف يعمل                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ يُنفَّذ داخل العملية       | Plugins الرسمية، وحزم npm المجتمعية               |
| **Bundle** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بإمكانات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما تحت `openclaw plugins list`. راجع [Plugin Bundles](/ar/plugins/bundles) لمعرفة تفاصيل الحزم.

إذا كنت تكتب Plugin أصليًا، فابدأ من [Building Plugins](/ar/plugins/building-plugins)
و[Plugin SDK Overview](/ar/plugins/sdk-overview).

## Plugins الرسمية

### قابلة للتثبيت (npm)

| Plugin          | الحزمة                | الوثائق                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ar/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ar/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ar/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ar/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ar/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ar/plugins/zalouser)   |

### أساسية (تُشحن مع OpenClaw)

<AccordionGroup>
  <Accordion title="موفّرو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث ذاكرة مجمّع (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد تُثبَّت عند الطلب مع auto-recall/capture ‏(اضبط `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="موفّرو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin متصفح مجمّع لأداة المتصفح، وCLI ‏`openclaw browser`، وطريقة Gateway ‏`browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` — جسر VS Code Copilot Proxy ‏(معطّل افتراضيًا)
  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins من جهات خارجية؟ راجع [Community Plugins](/ar/plugins/community).

## الإعدادات

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| الحقل            | الوصف                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | مفتاح تشغيل رئيسي (الافتراضي: `true`)                           |
| `allow`          | قائمة السماح للـ Plugin ‏(اختيارية)                               |
| `deny`           | قائمة الحظر للـ Plugin ‏(اختيارية؛ الحظر يفوز)                     |
| `load.paths`     | ملفات/أدلة إضافية للـ Plugin                            |
| `slots`          | محددات خانات حصرية (مثل `memory`, `contextEngine`) |
| `entries.\<id\>` | مفاتيح تشغيل + إعدادات لكل Plugin                               |

تتطلب تغييرات الإعدادات **إعادة تشغيل gateway**. إذا كانت Gateway تعمل مع
مراقبة الإعدادات + إعادة تشغيل داخل العملية مفعّلتين (وهو المسار الافتراضي `openclaw gateway`)،
فعادةً ما تُنفَّذ إعادة التشغيل تلك تلقائيًا بعد لحظة من وصول كتابة الإعدادات.
لا يوجد مسار hot-reload مدعوم لكود وقت تشغيل Plugin الأصلي أو hooks دورة الحياة؛
أعد تشغيل عملية Gateway التي تخدم القناة الحية قبل أن تتوقع تشغيل
كود `register(api)` المحدّث، أو hooks ‏`api.on(...)`، أو الأدوات، أو الخدمات، أو
hooks الموفّر/وقت التشغيل.

إن `openclaw plugins list` عبارة عن لقطة محلية من CLI/الإعدادات. ووجود Plugin بحالة `loaded`
هناك يعني أن Plugin قابل للاكتشاف والتحميل من الإعدادات/الملفات التي يراها
استدعاء CLI ذلك. لكنه لا يثبت أن Gateway فرعية بعيدة تعمل بالفعل
قد أعيد تشغيلها إلى كود Plugin نفسه. وفي إعدادات VPS/container ذات عمليات التغليف،
أرسل إعادة التشغيل إلى عملية `openclaw gateway run` الفعلية، أو استخدم
`openclaw gateway restart` على Gateway العاملة.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: يوجد Plugin لكن قواعد التمكين أوقفته. وتُحفَظ الإعدادات.
  - **مفقود**: تشير الإعدادات إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: يوجد Plugin لكن إعداداته لا تطابق المخطط المعلن.
</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و`\<<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و`~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المجمّعة">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضيًا (موفّرو النماذج، والكلام).
    وأخرى تتطلب تمكينًا صريحًا.
  </Step>
</Steps>

### قواعد التمكين

- `plugins.enabled: false` يعطّل جميع Plugins
- `plugins.deny` يفوز دائمًا على allow
- `plugins.entries.\<id\>.enabled: false` يعطّل ذلك Plugin
- Plugins القادمة من مساحة العمل تكون **معطلة افتراضيًا** (ويجب تمكينها صراحةً)
- تتبع Plugins المجمّعة مجموعة التفعيل الافتراضي المدمجة ما لم يُستبدل ذلك
- يمكن للخانات الحصرية أن تفرض تمكين Plugin المحدد لتلك الخانة
- تُفعَّل بعض Plugins المجمّعة الاختيارية تلقائيًا عندما تسمّي الإعدادات
  سطحًا يملكه Plugin، مثل مرجع نموذج موفّر، أو إعدادات قناة، أو وقت تشغيل harness
- تحافظ مسارات OpenAI-family Codex على حدود Plugins منفصلة:
  `openai-codex/*` ينتمي إلى Plugin الخاص بـ OpenAI، بينما يُختار Plugin
  app-server Codex المجمّع بواسطة `embeddedHarness.runtime: "codex"` أو مراجع نماذج
  `codex/*` القديمة

## استكشاف أخطاء hooks وقت التشغيل

إذا ظهر Plugin في `plugins list` لكن الآثار الجانبية لـ `register(api)` أو hooks
لا تعمل في حركة الدردشة الحية، فتحقق أولًا من هذه الأمور:

- شغّل `openclaw gateway status --deep --require-rpc` وأكّد أن
  عنوان Gateway، والملف التعريفي، ومسار الإعدادات، والعملية النشطة هي نفسها التي تعدّلها.
- أعد تشغيل Gateway الحية بعد تثبيت/إعداد/تغيير كود Plugin. وفي
  containers المغلّفة، قد تكون PID 1 مجرد supervisor؛ أعد تشغيل أو أرسل إشارة إلى
  العملية الفرعية `openclaw gateway run`.
- استخدم `openclaw plugins inspect <id> --json` لتأكيد تسجيلات hooks و
  التشخيصات. تحتاج hooks المحادثة غير المجمّعة مثل `llm_input`،
  و`llm_output`، و`agent_end` إلى
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- بالنسبة إلى تبديل النموذج، ففضّل `before_model_resolve`. فهي تعمل قبل
  تحليل النموذج لأدوار الوكيل؛ أما `llm_output` فلا تعمل إلا بعد أن تنتج محاولة نموذج
  خرج المساعد.
- للحصول على دليل على نموذج الجلسة الفعلي، استخدم `openclaw sessions` أو
  أسطح الجلسة/الحالة في Gateway، وعند تصحيح حمولات الموفّر، شغّل
  Gateway مع `--raw-stream --raw-stream-path <path>`.

## خانات Plugin ‏(فئات حصرية)

بعض الفئات حصرية (واحد فقط نشط في الوقت نفسه):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // أو "none" للتعطيل
      contextEngine: "legacy", // أو معرّف Plugin
    },
  },
}
```

| الخانة            | ما الذي تتحكم فيه      | الافتراضي             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin الذاكرة النشط  | `memory-core`       |
| `contextEngine` | محرك السياق النشط | `legacy` (مدمج) |

## مرجع CLI

```bash
openclaw plugins list                       # جرد مختصر
openclaw plugins list --enabled            # Plugins المحمّلة فقط
openclaw plugins list --verbose            # أسطر تفاصيل لكل Plugin
openclaw plugins list --json               # جرد قابل للقراءة آليًا
openclaw plugins inspect <id>              # تفاصيل معمّقة
openclaw plugins inspect <id> --json       # قابل للقراءة آليًا
openclaw plugins inspect --all             # جدول على مستوى الجميع
openclaw plugins info <id>                 # اسم بديل لـ inspect
openclaw plugins doctor                    # تشخيصات

openclaw plugins install <package>         # تثبيت (ClawHub أولًا، ثم npm)
openclaw plugins install clawhub:<pkg>     # تثبيت من ClawHub فقط
openclaw plugins install <spec> --force    # استبدال التثبيت الموجود
openclaw plugins install <path>            # تثبيت من مسار محلي
openclaw plugins install -l <path>         # ربط (من دون نسخ) للتطوير
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # تسجيل مواصفة npm المحلولة الدقيقة
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # تحديث Plugin واحد
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # تحديث الكل
openclaw plugins uninstall <id>          # إزالة سجلات الإعدادات/التثبيت
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تُشحن Plugins المجمّعة مع OpenClaw. ويكون كثير منها مفعّلًا افتراضيًا (على سبيل المثال
موفّرو النماذج المجمّعون، وموفّرو الكلام المجمّعون، وPlugin المتصفح
المجمّع). أما Plugins المجمّعة الأخرى فما تزال تحتاج إلى `openclaw plugins enable <id>`.

يؤدي `--force` إلى استبدال Plugin أو حزمة hooks المثبّتة الموجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية الخاصة بـ npm
Plugins المتتبعة. وهو غير مدعوم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبّت إلى قائمة السماح تلك قبل تمكينه، بحيث تصبح عمليات التثبيت
قابلة للتحميل مباشرةً بعد إعادة التشغيل.

ينطبق `openclaw plugins update <id-or-npm-spec>` على عمليات التثبيت المتتبعة. ويؤدي تمرير
مواصفة حزمة npm مع dist-tag أو إصدار دقيق إلى حل اسم الحزمة
إلى سجل Plugin المتتبع وتسجيل المواصفة الجديدة للتحديثات المستقبلية.
أما تمرير اسم الحزمة من دون إصدار فيعيد تثبيتًا دقيق التثبيت إلى
خط الإصدار الافتراضي للسجل. وإذا كان Plugin npm المثبّت يطابق بالفعل
الإصدار المحلول وهوية artifact المسجلة، فسيتخطى OpenClaw التحديث
من دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.

إن `--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن
عمليات التثبيت من marketplace تحفظ بيانات مصدر marketplace الوصفية بدلًا من مواصفة npm.

إن `--dangerously-force-unsafe-install` هو تجاوز لكسر الزجاج لحالات الإيجابيات الكاذبة
من ماسح الشيفرة الخطيرة المدمج. فهو يسمح لعمليات تثبيت Plugins
وتحديثات Plugins بالاستمرار بعد النتائج المدمجة من نوع `critical`، لكنه
ما يزال لا يتجاوز كتل سياسات `before_install` الخاصة بالـ Plugin أو حظر فشل الفحص.

ينطبق هذا العلم في CLI على تدفقات تثبيت/تحديث Plugins فقط. أما تثبيت اعتماديات
Skills المعتمدة على Gateway فتستخدم بدلًا من ذلك تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` هو تدفق تنزيل/تثبيت Skills المنفصل عبر ClawHub.

تشارك الحزم المتوافقة في تدفق list/inspect/enable/disable نفسه الخاص بالـ Plugin.
ويتضمن دعم وقت التشغيل الحالي Skills الخاصة بالحزم، وClaude command-skills،
وقيم Claude ‏`settings.json` الافتراضية، وClaude ‏`.lsp.json` والقيم الافتراضية
`lspServers` المعلنة في manifest، وCursor command-skills، وأدلة
hooks المتوافقة مع Codex.

يبلّغ `openclaw plugins inspect <id>` أيضًا عن إمكانات الحزمة المكتشفة بالإضافة إلى
إدخالات MCP وLSP server المدعومة أو غير المدعومة للـ Plugins المدعومة بالحزم.

يمكن أن تكون مصادر Marketplace اسم marketplace معروفًا لدى Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو
مسار `marketplace.json`، أو صيغة GitHub مختصرة مثل `owner/repo`، أو عنوان URL
لمستودع GitHub، أو عنوان URL لـ git. وبالنسبة إلى marketplaces البعيدة، يجب أن تبقى
إدخالات Plugins داخل مستودع marketplace المستنسخ وأن تستخدم
مصادر مسارات نسبية فقط.

راجع [مرجع CLI الخاص بـ `openclaw plugins`](/ar/cli/plugins) للاطلاع على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تصدّر Plugins الأصلية كائن إدخال يعرّض `register(api)`. قد تظل Plugins الأقدم
تستخدم `activate(api)` كاسم بديل قديم، لكن ينبغي للـ Plugins الجديدة أن
تستخدم `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

يقوم OpenClaw بتحميل كائن الإدخال واستدعاء `register(api)` أثناء
تفعيل Plugin. وما يزال المحمّل يعود إلى `activate(api)` في Plugins الأقدم،
لكن ينبغي أن تتعامل Plugins المجمّعة وPlugins الخارجية الجديدة مع
`register` باعتباره العقد العام.

يخبر `api.registrationMode` Plugin بسبب تحميل إدخاله:

| الوضع            | المعنى                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | تفعيل وقت التشغيل. سجّل الأدوات، وhooks، والخدمات، والأوامر، والمسارات، وغيرها من الآثار الجانبية الحية.                              |
| `discovery`     | اكتشاف إمكانات للقراءة فقط. سجّل الموفّرين والبيانات الوصفية؛ قد يُحمَّل كود إدخال Plugin الموثوق، لكن تخطَّ الآثار الجانبية الحية. |
| `setup-only`    | تحميل بيانات إعداد القناة الوصفية عبر إدخال إعداد خفيف.                                                                |
| `setup-runtime` | تحميل إعداد القناة الذي يحتاج أيضًا إلى إدخال وقت التشغيل.                                                                         |
| `cli-metadata`  | جمع بيانات CLI الوصفية فقط.                                                                                            |

ينبغي أن تحرس إدخالات Plugins التي تفتح sockets، أو قواعد بيانات، أو عمّالًا في الخلفية، أو عملاء
طويلي العمر هذه الآثار الجانبية بشرط `api.registrationMode === "full"`.
تُخزّن تحميلات الاكتشاف مؤقتًا بشكل منفصل عن تحميلات التفعيل ولا تستبدل
سجل Gateway العامل. الاكتشاف غير مُفعِّل، لكنه ليس خاليًا من الاستيراد:
قد يقيّم OpenClaw إدخال Plugin الموثوق أو وحدة Plugin القناة لبناء
اللقطة. أبقِ مستويات الوحدات العليا خفيفة ومن دون آثار جانبية، وانقل
عملاء الشبكة، والعمليات الفرعية، والمستمعين، وقراءات بيانات الاعتماد، وبدء الخدمة
إلى مسارات وقت التشغيل الكامل.

طرق التسجيل الشائعة:

| الطريقة                                  | ما الذي تسجله           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | موفّر نموذج (LLM)        |
| `registerChannel`                       | قناة دردشة                |
| `registerTool`                          | أداة وكيل                  |
| `registerHook` / `on(...)`              | hooks دورة الحياة             |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT        |
| `registerRealtimeTranscriptionProvider` | STT متدفق               |
| `registerRealtimeVoiceProvider`         | صوت فوري ثنائي الاتجاه       |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت        |
| `registerImageGenerationProvider`       | توليد الصور            |
| `registerMusicGenerationProvider`       | توليد الموسيقى            |
| `registerVideoGenerationProvider`       | توليد الفيديو            |
| `registerWebFetchProvider`              | موفّر web fetch / scrape |
| `registerWebSearchProvider`             | البحث على الويب                  |
| `registerHttpRoute`                     | نقطة نهاية HTTP               |
| `registerCommand` / `registerCli`       | أوامر CLI                |
| `registerContextEngine`                 | محرك السياق              |
| `registerService`                       | خدمة خلفية          |

سلوك الحراسة لـ hooks دورة الحياة ذات الأنواع المحددة:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات الأقل أولوية.
- `before_tool_call`: تكون `{ block: false }` بلا أثر ولا تمحو block سابقًا.
- `before_install`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات الأقل أولوية.
- `before_install`: تكون `{ block: false }` بلا أثر ولا تمحو block سابقًا.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ ويتم تخطي المعالجات الأقل أولوية.
- `message_sending`: تكون `{ cancel: false }` بلا أثر ولا تمحو cancel سابقًا.

تعيد تشغيلات Codex app-server الأصلية ربط أحداث الأدوات الأصلية لـ Codex مرة أخرى إلى
سطح hooks هذا. ويمكن للـ Plugins حظر أدوات Codex الأصلية عبر `before_tool_call`،
ومراقبة النتائج عبر `after_tool_call`، والمشاركة في موافقات
`PermissionRequest` الخاصة بـ Codex. ولا يعيد الجسر كتابة وسائط
الأدوات الأصلية لـ Codex حتى الآن. ويعيش الحد الدقيق لدعم وقت تشغيل Codex في
[عقد دعم Codex harness v1](/ar/plugins/codex-harness#v1-support-contract).

للاطلاع على السلوك الكامل ذي الأنواع المحددة للـ hooks، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [Building plugins](/ar/plugins/building-plugins) — أنشئ Plugin خاصًا بك
- [Plugin bundles](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [Plugin manifest](/ar/plugins/manifest) — مخطط manifest
- [Registering tools](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات وكيل داخل Plugin
- [Plugin internals](/ar/plugins/architecture) — نموذج الإمكانات ومسار التحميل
- [Community plugins](/ar/plugins/community) — قوائم الجهات الخارجية
