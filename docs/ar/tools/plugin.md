---
read_when:
    - تثبيت الإضافات أو إعدادها
    - فهم اكتشاف الإضافات وقواعد التحميل
    - العمل مع حِزم الإضافات المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت وإعداد وإدارة إضافات OpenClaw
title: الإضافات
x-i18n:
    generated_at: "2026-04-24T15:21:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

توسّع الإضافات OpenClaw بإمكانات جديدة: القنوات، وموفّرو النماذج،
وأُطر تشغيل الوكلاء، والأدوات، وSkills، والصوت، والنسخ الفوري، والصوت
الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، والبحث
في الويب، وغير ذلك. بعض الإضافات **أساسية** (تأتي مع OpenClaw)، وأخرى
**خارجية** (ينشرها المجتمع على npm).

## البدء السريع

<Steps>
  <Step title="اعرض ما تم تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ثبّت إضافة">
    ```bash
    # من npm
    openclaw plugins install @openclaw/voice-call

    # من دليل محلي أو أرشيف
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="أعِد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    ثم اضبط الإعدادات ضمن `plugins.entries.\<id\>.config` في ملف الإعدادات الخاص بك.

  </Step>
</Steps>

إذا كنت تفضّل التحكّم عبر الدردشة، فعِّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

يستخدم مسار التثبيت نفس محلّل المسارات الذي تستخدمه CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم الرجوع إلى npm).

إذا كانت الإعدادات غير صالحة، فعادةً ما يفشل التثبيت بشكل آمن ويوجهك إلى
`openclaw doctor --fix`. الاستثناء الوحيد للاسترداد هو مسار ضيق لإعادة تثبيت
الإضافات المضمّنة للإضافات التي تختار
`openclaw.install.allowInvalidConfigRecovery`.

عمليات تثبيت OpenClaw المعبأة لا تثبّت بشكل مسبق شجرة تبعيات وقت التشغيل لكل إضافة
مضمّنة. عندما تكون إضافة مملوكة لـ OpenClaw ومضمّنة نشطة من خلال إعدادات
الإضافات، أو إعدادات القنوات القديمة، أو بيان مفعّل افتراضيًا، فإن إصلاحات
بدء التشغيل تصلح فقط تبعيات وقت التشغيل المعلنة لتلك الإضافة قبل استيرادها.
أما الإضافات الخارجية ومسارات التحميل المخصصة، فيجب تثبيتها عبر
`openclaw plugins install`.

## أنواع الإضافات

يتعرّف OpenClaw على تنسيقين للإضافات:

| التنسيق     | كيف يعمل                                                        | أمثلة                                                   |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **أصلي** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ يُنفَّذ داخل العملية       | الإضافات الرسمية، وحزم npm المجتمعية                  |
| **حزمة** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`، `.claude-plugin/`، `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [حِزم الإضافات](/ar/plugins/bundles) لمعرفة تفاصيل الحِزم.

إذا كنت تكتب إضافة أصلية، فابدأ من [بناء الإضافات](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## الإضافات الرسمية

### قابلة للتثبيت (npm)

| الإضافة          | الحزمة                 | الوثائق                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ar/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ar/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ar/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ar/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ar/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ar/plugins/zalouser)   |

### أساسية (تأتي مع OpenClaw)

<AccordionGroup>
  <Accordion title="موفّرو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="إضافات الذاكرة">
    - `memory-core` — بحث ذاكرة مضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد تُثبَّت عند الطلب مع الاستدعاء/الالتقاط التلقائي (عيّن `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="موفّرو الصوت (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — إضافة متصفح مضمّنة لأداة المتصفح، وواجهة CLI `openclaw browser`، والطريقة `browser.request` في Gateway، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّلة افتراضيًا؛ عطّلها قبل استبدالها)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطّل افتراضيًا)
  </Accordion>
</AccordionGroup>

هل تبحث عن إضافات من أطراف خارجية؟ راجع [إضافات المجتمع](/ar/plugins/community).

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

| الحقل            | الوصف                                                     |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | مفتاح تشغيل رئيسي (الافتراضي: `true`)                     |
| `allow`          | قائمة سماح للإضافات (اختياري)                             |
| `deny`           | قائمة حظر للإضافات (اختياري؛ الحظر له الأولوية)           |
| `load.paths`     | ملفات/أدلة إضافات إضافية                                  |
| `slots`          | محددات خانات حصرية (مثل `memory` و`contextEngine`)        |
| `entries.\<id\>` | مفاتيح تشغيل وتعطيل وإعدادات لكل إضافة                    |

تغييرات الإعدادات **تتطلب إعادة تشغيل Gateway**. إذا كان Gateway يعمل مع
مراقبة الإعدادات + إعادة تشغيل داخل العملية مفعّلتين (وهو المسار الافتراضي
لـ `openclaw gateway`)، فعادةً ما تُنفَّذ إعادة التشغيل تلقائيًا بعد لحظة
من وصول كتابة الإعدادات. لا يوجد مسار مدعوم لإعادة التحميل الفوري لشفرة وقت
تشغيل الإضافات الأصلية أو خطافات دورة الحياة؛ أعِد تشغيل عملية Gateway التي
تخدم القناة الحية قبل توقّع تشغيل شفرة `register(api)` المحدّثة، أو خطافات
`api.on(...)`، أو الأدوات، أو الخدمات، أو خطافات الموفّر/وقت التشغيل.

يمثل `openclaw plugins list` لقطة محلية من CLI/الإعدادات. وجود إضافة بحالة
`loaded` هناك يعني أن الإضافة قابلة للاكتشاف والتحميل من الإعدادات/الملفات
التي تراها عملية CLI تلك. لكنه لا يثبت أن عملية Gateway الفرعية البعيدة
العاملة حاليًا قد أُعيد تشغيلها إلى نفس شفرة الإضافة. في إعدادات VPS/الحاويات
التي تستخدم عمليات تغليف، أرسل إعادة التشغيل إلى العملية الفعلية
`openclaw gateway run`، أو استخدم `openclaw gateway restart` مع Gateway
قيد التشغيل.

<Accordion title="حالات الإضافات: معطّلة مقابل مفقودة مقابل غير صالحة">
  - **معطّلة**: الإضافة موجودة لكن قواعد التفعيل عطّلتها. يتم الاحتفاظ بالإعدادات.
  - **مفقودة**: تشير الإعدادات إلى معرّف إضافة لم يعثر عليه الاكتشاف.
  - **غير صالحة**: الإضافة موجودة لكن إعداداتها لا تطابق المخطط المعلن.
</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw الإضافات بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة.
  </Step>

  <Step title="إضافات مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="الإضافات العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="الإضافات المضمّنة">
    تأتي مع OpenClaw. كثير منها مفعّل افتراضيًا (موفّرو النماذج، والصوت).
    بينما يتطلب بعضها الآخر تفعيلًا صريحًا.
  </Step>
</Steps>

### قواعد التفعيل

- `plugins.enabled: false` يعطّل جميع الإضافات
- `plugins.deny` له الأولوية دائمًا على allow
- `plugins.entries.\<id\>.enabled: false` يعطّل تلك الإضافة
- الإضافات ذات المصدر من مساحة العمل تكون **معطّلة افتراضيًا** (ويجب تفعيلها صراحةً)
- تتبع الإضافات المضمّنة مجموعة التفعيل الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن للخانات الحصرية فرض تفعيل الإضافة المحددة لتلك الخانة
- بعض الإضافات المضمّنة التي تتطلب الاشتراك يتم تفعيلها تلقائيًا عندما تسمّي
  الإعدادات سطحًا تملكه الإضافة، مثل مرجع نموذج مزوّد، أو إعدادات قناة، أو
  وقت تشغيل harness
- تحتفظ مسارات Codex من عائلة OpenAI بحدود إضافات منفصلة:
  `openai-codex/*` ينتمي إلى إضافة OpenAI، بينما يتم اختيار إضافة خادم تطبيق
  Codex المضمّنة عبر `embeddedHarness.runtime: "codex"` أو مراجع النماذج
  القديمة `codex/*`

## استكشاف أخطاء خطافات وقت التشغيل وإصلاحها

إذا ظهرت إضافة في `plugins list` لكن التأثيرات الجانبية لـ `register(api)` أو
الخطافات لا تعمل في حركة الدردشة الحية، فتحقق أولًا من التالي:

- شغّل `openclaw gateway status --deep --require-rpc` وأكّد أن عنوان URL الخاص
  بـ Gateway النشط، والملف الشخصي، ومسار الإعدادات، والعملية هي نفسها التي
  تعدّلها.
- أعِد تشغيل Gateway الحي بعد تغييرات تثبيت الإضافة/الإعدادات/الشفرة. في
  الحاويات المغلّفة، قد يكون PID 1 مجرد مشرف؛ أعِد تشغيل أو أرسل إشارة إلى
  العملية الفرعية `openclaw gateway run`.
- استخدم `openclaw plugins inspect <id> --json` لتأكيد تسجيلات الخطافات
  والتشخيصات. تتطلب خطافات المحادثة غير المضمّنة مثل `llm_input`،
  و`llm_output`، و`agent_end` الإعداد
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- عند تبديل النموذج، فضّل `before_model_resolve`. فهو يعمل قبل حل النموذج في
  أدوار الوكيل؛ بينما لا يعمل `llm_output` إلا بعد أن تنتج محاولة نموذج
  مخرجات للمساعد.
- لإثبات النموذج الفعّال للجلسة، استخدم `openclaw sessions` أو أسطح جلسة/حالة
  Gateway، وعند تصحيح حمولات الموفّر، ابدأ Gateway مع
  `--raw-stream --raw-stream-path <path>`.

## خانات الإضافات (فئات حصرية)

بعض الفئات حصرية (لا يكون نشطًا إلا واحد فقط في كل مرة):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // أو "none" للتعطيل
      contextEngine: "legacy", // أو معرّف إضافة
    },
  },
}
```

| الخانة          | ما الذي تتحكم به       | الافتراضي           |
| --------------- | --------------------- | ------------------- |
| `memory`        | إضافة الذاكرة النشطة  | `memory-core`       |
| `contextEngine` | محرّك السياق النشط    | `legacy` (مدمج)     |

## مرجع CLI

```bash
openclaw plugins list                       # جرد موجز
openclaw plugins list --enabled            # الإضافات المحمّلة فقط
openclaw plugins list --verbose            # أسطر تفاصيل لكل إضافة
openclaw plugins list --json               # جرد قابل للقراءة آليًا
openclaw plugins inspect <id>              # تفاصيل معمّقة
openclaw plugins inspect <id> --json       # قابل للقراءة آليًا
openclaw plugins inspect --all             # جدول على مستوى المجموعة
openclaw plugins info <id>                 # اسم مستعار لـ inspect
openclaw plugins doctor                    # تشخيصات

openclaw plugins install <package>         # تثبيت (ClawHub أولًا، ثم npm)
openclaw plugins install clawhub:<pkg>     # تثبيت من ClawHub فقط
openclaw plugins install <spec> --force    # الكتابة فوق تثبيت موجود
openclaw plugins install <path>            # تثبيت من مسار محلي
openclaw plugins install -l <path>         # ربط (من دون نسخ) للتطوير
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # تسجيل مواصفة npm المحلولة الدقيقة
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # تحديث إضافة واحدة
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # تحديث الكل
openclaw plugins uninstall <id>          # إزالة سجلات الإعدادات/التثبيت
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تأتي الإضافات المضمّنة مع OpenClaw. كثير منها مفعّل افتراضيًا (على سبيل المثال
موفّرو النماذج المضمّنون، وموفّرو الصوت المضمّنون، وإضافة المتصفح
المضمّنة). بينما لا تزال إضافات مضمّنة أخرى تحتاج إلى
`openclaw plugins enable <id>`.

يقوم `--force` بالكتابة فوق إضافة أو حزمة خطافات مثبّتة موجودة في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لإضافات npm
المتعقبة. ولا يكون مدعومًا مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما يكون `plugins.allow` مضبوطًا بالفعل، فإن `openclaw plugins install`
يضيف معرّف الإضافة المثبّتة إلى قائمة السماح تلك قبل تفعيلها، بحيث تصبح
عمليات التثبيت قابلة للتحميل فورًا بعد إعادة التشغيل.

ينطبق `openclaw plugins update <id-or-npm-spec>` على عمليات التثبيت المتعقبة. إن
تمرير مواصفة حزمة npm مع dist-tag أو إصدار محدد يعيد حل اسم الحزمة إلى سجل
الإضافة المتعقّب ويسجّل المواصفة الجديدة للتحديثات المستقبلية. وتمرير اسم
الحزمة من دون إصدار يعيد التثبيت المثبّت بإصدار دقيق إلى خط الإصدار الافتراضي
في السجل. وإذا كانت إضافة npm المثبّتة تطابق بالفعل الإصدار المحلول وهوية
القطعة الأثرية المسجّلة، فإن OpenClaw يتخطى التحديث من دون تنزيل أو إعادة
تثبيت أو إعادة كتابة الإعدادات.

`--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن
عمليات التثبيت من marketplace تحتفظ ببيانات تعريف مصدر marketplace بدلًا من
مواصفة npm.

يمثل `--dangerously-force-unsafe-install` تجاوزًا اضطراريًا لحالات الإيجابيات
الكاذبة من ماسح الشيفرة الخطرة المدمج. فهو يسمح بمتابعة عمليات تثبيت
الإضافات وتحديثها رغم نتائج `critical` المدمجة، لكنه مع ذلك لا يتجاوز كتل
سياسات plugin `before_install` ولا حظر فشل الفحص.

ينطبق علم CLI هذا على تدفقات تثبيت/تحديث الإضافات فقط. أما عمليات تثبيت
تبعيات Skills المعتمدة على Gateway فتستخدم بدلًا من ذلك تجاوز الطلب المطابق
`dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` تدفق
تنزيل/تثبيت Skills منفصلًا من ClawHub.

تشارك الحِزم المتوافقة في نفس تدفق قائمة/فحص/تفعيل/تعطيل الإضافات. يتضمن دعم
وقت التشغيل الحالي Skills الخاصة بالحِزم، وClaude command-skills،
وافتراضيات Claude `settings.json`، وافتراضيات Claude `.lsp.json` و
`lspServers` المعلنة في البيان، وCursor command-skills، وأدلة خطافات
Codex المتوافقة.

يعرض `openclaw plugins inspect <id>` أيضًا إمكانات الحِزم المكتشفة بالإضافة إلى
إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة للإضافات المدعومة بالحِزم.

يمكن أن تكون مصادر Marketplace اسم marketplace معروفًا لـ Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو مسار
`marketplace.json`، أو صيغة GitHub مختصرة مثل `owner/repo`، أو عنوان URL
لمستودع GitHub، أو عنوان URL لـ git. وبالنسبة إلى marketplaces البعيدة، يجب أن
تبقى إدخالات الإضافات داخل مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات
نسبية فقط.

راجع [مرجع CLI للأمر `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تُصدّر الإضافات الأصلية كائن إدخال يوفّر `register(api)`. قد تظل الإضافات
القديمة تستخدم `activate(api)` كاسم مستعار قديم، لكن ينبغي للإضافات الجديدة
استخدام `register`.

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

يحمّل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء تفعيل الإضافة.
ولا يزال المُحمِّل يرجع إلى `activate(api)` للإضافات الأقدم، لكن ينبغي أن
تتعامل الإضافات المضمّنة والإضافات الخارجية الجديدة مع `register` باعتباره
العقد العام.

طرق التسجيل الشائعة:

| الطريقة                                  | ما الذي تسجّله            |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | موفّر نماذج (LLM)        |
| `registerChannel`                       | قناة دردشة                |
| `registerTool`                          | أداة وكيل                  |
| `registerHook` / `on(...)`              | خطافات دورة الحياة             |
| `registerSpeechProvider`                | تحويل النص إلى كلام / STT        |
| `registerRealtimeTranscriptionProvider` | STT متدفق               |
| `registerRealtimeVoiceProvider`         | صوت فوري ثنائي الاتجاه       |
| `registerMediaUnderstandingProvider`    | تحليل الصور/الصوت        |
| `registerImageGenerationProvider`       | توليد الصور            |
| `registerMusicGenerationProvider`       | توليد الموسيقى            |
| `registerVideoGenerationProvider`       | توليد الفيديو            |
| `registerWebFetchProvider`              | موفّر جلب / كشط الويب |
| `registerWebSearchProvider`             | البحث في الويب                  |
| `registerHttpRoute`                     | نقطة نهاية HTTP               |
| `registerCommand` / `registerCli`       | أوامر CLI                |
| `registerContextEngine`                 | محرّك السياق              |
| `registerService`                       | خدمة في الخلفية          |

سلوك حراسة الخطافات للخطافات المعيارية لدورة الحياة:

- `before_tool_call`: القيمة `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأقل.
- `before_tool_call`: القيمة `{ block: false }` لا تُحدث أي أثر ولا تزيل حظرًا سابقًا.
- `before_install`: القيمة `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأقل.
- `before_install`: القيمة `{ block: false }` لا تُحدث أي أثر ولا تزيل حظرًا سابقًا.
- `message_sending`: القيمة `{ cancel: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأقل.
- `message_sending`: القيمة `{ cancel: false }` لا تُحدث أي أثر ولا تزيل إلغاءً سابقًا.

للاطلاع على السلوك الكامل المعياري للخطافات، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [بناء الإضافات](/ar/plugins/building-plugins) — أنشئ الإضافة الخاصة بك
- [حِزم الإضافات](/ar/plugins/bundles) — التوافق مع حِزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات الوكيل داخل إضافة
- [الداخليات الخاصة بـ Plugin](/ar/plugins/architecture) — نموذج الإمكانات وخط أنابيب التحميل
- [إضافات المجتمع](/ar/plugins/community) — قوائم الأطراف الخارجية
