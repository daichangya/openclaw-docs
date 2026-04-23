---
read_when:
    - تثبيت Plugins أو تهيئتها
    - فهم قواعد اكتشاف Plugin وتحميلها
    - العمل مع حزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins الخاصة بـ OpenClaw وهيئها وأدرها
title: Plugins
x-i18n:
    generated_at: "2026-04-23T07:33:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc944b53654552ca5cf6132c6ef16c71745a7bffc249daccaee40c513e04209c
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

توسّع Plugins قدرات OpenClaw بإضافة إمكانات جديدة: القنوات، ومزوّدي النماذج،
والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، وبحث الويب،
وغير ذلك. بعض Plugins تكون **أساسية** (تأتي مع OpenClaw)، وأخرى
**خارجية** (تنشرها المجتمع على npm).

## البدء السريع

<Steps>
  <Step title="اعرف ما الذي تم تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ثبّت Plugin">
    ```bash
    # من npm
    openclaw plugins install @openclaw/voice-call

    # من دليل أو أرشيف محلي
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="أعد تشغيل Gateway">
    ```bash
    openclaw gateway restart
    ```

    ثم قم بالتهيئة تحت `plugins.entries.\<id\>.config` في ملف الإعدادات لديك.

  </Step>
</Steps>

إذا كنت تفضّل التحكم الأصلي عبر الدردشة، فعطّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

يستخدم مسار التثبيت المحلل نفسه الموجود في CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم العودة إلى npm).

إذا كانت الإعدادات غير صالحة، فإن التثبيت يفشل عادةً بشكل مغلق ويوجهك إلى
`openclaw doctor --fix`. والاستثناء الوحيد للاستعادة هو مسار ضيق لإعادة تثبيت Plugin
مضمّنة تختار الاشتراك في
`openclaw.install.allowInvalidConfigRecovery`.

لا تقوم عمليات تثبيت OpenClaw المجمّعة بتثبيت شجرة تبعيات وقت التشغيل لكل Plugin مضمّنة
بشكل مسبق. وعندما تكون Plugin مضمّنة مملوكة لـ OpenClaw نشطة من
إعدادات Plugin، أو من إعدادات قنوات قديمة، أو من manifest مفعّل افتراضيًا، فإن
إصلاحات بدء التشغيل تصلح فقط تبعيات وقت التشغيل المعلنة لذلك Plugin قبل استيرادها.
أما Plugins الخارجية ومسارات التحميل المخصصة فلا تزال بحاجة إلى التثبيت عبر
`openclaw plugins install`.

## أنواع Plugin

يتعرف OpenClaw على نوعين من صيغ Plugin:

| الصيغة     | كيف تعمل                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **أصلية** | `openclaw.plugin.json` + وحدة runtime؛ تُنفَّذ داخل العملية       | Plugins رسمية، وحزم npm من المجتمع               |
| **Bundle** | تخطيط متوافق مع Codex/Claude/Cursor؛ ويُربط بميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

يظهر كلاهما تحت `openclaw plugins list`. راجع [حزم Plugin](/ar/plugins/bundles) للحصول على تفاصيل الحزم.

إذا كنت تكتب Plugin أصلية، فابدأ من [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

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

### أساسية (تأتي مع OpenClaw)

<AccordionGroup>
  <Accordion title="موفرو النماذج (مفعّلون افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث ذاكرة مضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد بتثبيت عند الطلب مع الاستدعاء/الالتقاط التلقائيين (اضبط `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="موفرو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin متصفح مضمّنة لأداة المتصفح، وCLI ‏`openclaw browser`, وطريقة gateway ‏`browser.request`, وبيئة تشغيل المتصفح، وخدمة التحكم في المتصفح الافتراضية (مفعلة افتراضيًا؛ عطّلها قبل استبدالها)
    - `copilot-proxy` — جسر VS Code Copilot Proxy (معطل افتراضيًا)
  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins خارجية؟ راجع [Plugins المجتمع](/ar/plugins/community).

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
| `enabled`        | المفتاح الرئيسي (الافتراضي: `true`)                           |
| `allow`          | قائمة سماح Plugin (اختياري)                               |
| `deny`           | قائمة حظر Plugin (اختيارية؛ الحظر يتغلب)                     |
| `load.paths`     | ملفات/أدلة Plugin إضافية                            |
| `slots`          | محددات الخانات الحصرية (مثل `memory`, `contextEngine`) |
| `entries.\<id\>` | مفاتيح تفعيل + إعدادات لكل Plugin                               |

تتطلب تغييرات الإعدادات **إعادة تشغيل gateway**. وإذا كانت Gateway تعمل مع
مراقبة الإعدادات + إعادة التشغيل داخل العملية مفعّلتين (وهو المسار الافتراضي `openclaw gateway`)،
فعادةً ما تُنفذ إعادة التشغيل هذه تلقائيًا بعد لحظة من وصول كتابة الإعدادات.

<Accordion title="حالات Plugin: معطلة مقابل مفقودة مقابل غير صالحة">
  - **معطلة**: الـ Plugin موجودة لكن قواعد التفعيل عطلتها. وتظل الإعدادات محفوظة.
  - **مفقودة**: تشير الإعدادات إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالحة**: الـ Plugin موجودة لكن إعداداتها لا تطابق المخطط المعلن.
</Accordion>

## الاكتشاف والأولوية

يفحص OpenClaw Plugins بهذا الترتيب (أول تطابق هو الفائز):

<Steps>
  <Step title="مسارات الإعدادات">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و`\<_workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و`~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تأتي مع OpenClaw. كثير منها مفعّل افتراضيًا (موفرو النماذج، والكلام).
    ويتطلب بعضها الآخر تفعيلًا صريحًا.
  </Step>
</Steps>

### قواعد التفعيل

- `plugins.enabled: false` يعطل جميع Plugins
- تتغلب `plugins.deny` دائمًا على allow
- `plugins.entries.\<id\>.enabled: false` يعطل تلك الـ Plugin
- Plugins ذات أصل مساحة العمل تكون **معطلة افتراضيًا** (ويجب تفعيلها صراحةً)
- تتبع Plugins المضمّنة مجموعة التفعيل الافتراضية المدمجة ما لم يتم تجاوزها
- يمكن للخانات الحصرية فرض تفعيل Plugin المحددة لتلك الخانة

## خانات Plugin (فئات حصرية)

بعض الفئات حصرية (يمكن أن تكون واحدة فقط نشطة في كل مرة):

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

| الخانة            | ما الذي تتحكم به      | الافتراضي             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin الذاكرة النشطة  | `memory-core`       |
| `contextEngine` | محرك السياق النشط | `legacy` (مدمج) |

## مرجع CLI

```bash
openclaw plugins list                       # جرد مضغوط
openclaw plugins list --enabled            # Plugins المحمّلة فقط
openclaw plugins list --verbose            # أسطر تفاصيل لكل Plugin
openclaw plugins list --json               # جرد قابل للقراءة الآلية
openclaw plugins inspect <id>              # تفاصيل عميقة
openclaw plugins inspect <id> --json       # قابل للقراءة الآلية
openclaw plugins inspect --all             # جدول على مستوى الأسطول
openclaw plugins info <id>                 # اسم مستعار لـ inspect
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # تثبيت (ClawHub أولًا، ثم npm)
openclaw plugins install clawhub:<pkg>     # تثبيت من ClawHub فقط
openclaw plugins install <spec> --force    # الكتابة فوق تثبيت موجود
openclaw plugins install <path>            # تثبيت من مسار محلي
openclaw plugins install -l <path>         # ربط (من دون نسخ) للتطوير
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # تسجيل مواصفة npm المحلولة الدقيقة
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # تحديث Plugin واحدة
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # تحديث الكل
openclaw plugins uninstall <id>          # إزالة سجلات الإعداد/التثبيت
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تأتي Plugins المضمّنة مع OpenClaw. وكثير منها مفعّل افتراضيًا (مثل
موفري النماذج المضمّنين، وموفري الكلام المضمّنين، وPlugin المتصفح
المضمّنة). أما Plugins المضمّنة الأخرى فما تزال بحاجة إلى `openclaw plugins enable <id>`.

يقوم `--force` بالكتابة فوق Plugin أو حزمة hook مثبّتة موجودة بالفعل في مكانها. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات المعتادة لـ Plugins npm
المتتبعة. ولا يُدعم هذا الخيار مع `--link`, الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبعة. ويؤدي تمرير
مواصفة حزمة npm مع dist-tag أو إصدار دقيق إلى حل اسم الحزمة
إلى سجل Plugin المتتبَّع وتسجيل المواصفة الجديدة لأجل التحديثات المستقبلية.
أما تمرير اسم الحزمة من دون إصدار فيعيد تثبيتًا دقيقًا مثبتًا إلى
خط الإصدار الافتراضي في السجل. وإذا كانت Plugin npm المثبتة تطابق بالفعل
الإصدار المحلول وهوية العنصر المسجلة، فإن OpenClaw يتجاوز التحديث
من دون تنزيل أو إعادة تثبيت أو إعادة كتابة الإعدادات.

إن `--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`, لأن
تثبيتات marketplace تحفظ بيانات وصفية لمصدر marketplace بدلًا من مواصفة npm.

إن `--dangerously-force-unsafe-install` هو تجاوز كسر زجاج للحالات الإيجابية
الخاطئة من ماسح الشيفرة الخطرة المدمج. فهو يسمح لتثبيتات Plugin
وتحديثاتها بالاستمرار رغم وجود نتائج `critical` من الفحص المدمج، لكنه
ما يزال لا يتجاوز كتل سياسة `before_install` الخاصة بـ Plugin أو منع فشل الفحص.

ينطبق هذا الخيار في CLI على تدفقات تثبيت/تحديث Plugin فقط. أما تثبيتات تبعيات Skill
المدعومة بـ Gateway فتستخدم بدلًا من ذلك تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`,
بينما يبقى `openclaw skills install` تدفق تنزيل/تثبيت Skills منفصلًا من ClawHub.

تشارك الحزم المتوافقة في التدفق نفسه لـ list/inspect/enable/disable الخاص بالـ Plugin.
ويشمل دعم بيئة التشغيل الحالي Skills الحزمة، وClaude command-skills,
وقيم Claude الافتراضية في `settings.json`, وClaude `.lsp.json` و
القيم الافتراضية `lspServers` المعلنة في manifest, وCursor command-skills،
وأدلة hook المتوافقة مع Codex.

ويُبلغ `openclaw plugins inspect <id>` أيضًا عن قدرات الحزمة المكتشفة إضافةً إلى
إدخالات MCP وLSP server المدعومة أو غير المدعومة الخاصة بالـ Plugins المدعومة بالحزم.

يمكن أن تكون مصادر Marketplace اسم marketplace معروفًا لـ Claude من
`~/.claude/plugins/known_marketplaces.json`, أو جذر marketplace محليًا، أو
مسار `marketplace.json`, أو صيغة GitHub مختصرة مثل `owner/repo`, أو عنوان URL لمستودع GitHub،
أو عنوان URL لـ git. وبالنسبة إلى marketpaces البعيدة، يجب أن تبقى إدخالات Plugin داخل
مستودع marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI للأمر `openclaw plugins`](/ar/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تُصدّر Plugins الأصلية كائن إدخال يعرض `register(api)`. وقد
تستخدم Plugins الأقدم ما يزال `activate(api)` كاسم مستعار قديم، لكن Plugins الجديدة ينبغي أن
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

يحمّل OpenClaw كائن الإدخال ويستدعي `register(api)` أثناء تفعيل Plugin.
وما يزال المحمّل يعود إلى `activate(api)` بالنسبة إلى Plugins الأقدم،
لكن يجب أن تتعامل Plugins المضمّنة وPlugins الخارجية الجديدة مع `register` على أنها العقد العام.

أساليب التسجيل الشائعة:

| الطريقة                                  | ما الذي تسجله           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | مزوّد نموذج (LLM)        |
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
| `registerWebFetchProvider`              | مزوّد جلب / كشط الويب |
| `registerWebSearchProvider`             | بحث الويب                  |
| `registerHttpRoute`                     | نقطة نهاية HTTP               |
| `registerCommand` / `registerCli`       | أوامر CLI                |
| `registerContextEngine`                 | محرك سياق              |
| `registerService`                       | خدمة في الخلفية          |

سلوك حواجز hook الخاصة بـ hooks دورة الحياة المtyped:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تكون `{ block: false }` بلا تأثير ولا تمسح block سابقة.
- `before_install`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تكون `{ block: false }` بلا تأثير ولا تمسح block سابقة.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تكون `{ cancel: false }` بلا تأثير ولا تمسح cancel سابقة.

للاطلاع على السلوك الكامل للـ hooks المtyped، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاصة بك
- [حزم Plugin](/ar/plugins/bundles) — توافق حزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) — مخطط manifest
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات الوكيل في Plugin
- [الداخليات الخاصة بـ Plugin](/ar/plugins/architecture) — نموذج القدرات ومسار التحميل
- [Plugins المجتمع](/ar/plugins/community) — قوائم الطرف الثالث
