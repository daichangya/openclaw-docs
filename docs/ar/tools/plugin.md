---
read_when:
    - تثبيت Plugins أو تهيئتها
    - فهم اكتشاف Plugins وقواعد تحميلها
    - العمل مع حِزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: تثبيت Plugins في OpenClaw، وتهيئتها، وإدارتها
title: Plugins
x-i18n:
    generated_at: "2026-04-21T07:27:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

توسّع Plugins إمكانات OpenClaw بقدرات جديدة: القنوات، ومزوّدو النماذج،
والأدوات، وSkills، والكلام، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وإنشاء الصور، وإنشاء الفيديو، وجلب الويب، وweb
search، وغير ذلك. بعض Plugins **أساسية** (تُشحن مع OpenClaw)، وأخرى
**خارجية** (ينشرها المجتمع على npm).

## البدء السريع

<Steps>
  <Step title="اطّلع على ما تم تحميله">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ثبّت Plugin">
    ```bash
    # من npm
    openclaw plugins install @openclaw/voice-call

    # من دليل محلي أو archive
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

إذا كنت تفضّل التحكم الأصلي عبر الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

يستخدم مسار التثبيت المُحلِّل نفسه الخاص بـ CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم الرجوع إلى npm).

إذا كانت الإعدادات غير صالحة، يفشل التثبيت عادةً بإغلاق افتراضي ويوجّهك إلى
`openclaw doctor --fix`. واستثناء الاسترداد الوحيد هو مسار ضيق لإعادة تثبيت
Plugin مضمّن للـ Plugins التي تختار
`openclaw.install.allowInvalidConfigRecovery`.

لا تقوم تثبيتات OpenClaw المعبّأة بتثبيت شجرة اعتماديات وقت التشغيل
لكل Plugin مضمّن بشكل مبكر. عندما يكون Plugin مضمّن مملوك لـ OpenClaw نشطًا عبر
إعداد Plugin، أو إعداد قناة قديم، أو manifest مفعّل افتراضيًا، فإن بدء التشغيل
يصلح فقط اعتماديات وقت التشغيل المعلنة لذلك Plugin قبل استيراده.
أما Plugins الخارجية ومسارات التحميل المخصصة، فما تزال بحاجة إلى التثبيت عبر
`openclaw plugins install`.

## أنواع Plugins

يتعرف OpenClaw على صيغتي Plugin:

| الصيغة | كيف تعمل | أمثلة |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + وحدة وقت تشغيل؛ تُنفَّذ داخل العملية | Plugins الرسمية، وحزم npm المجتمعية |
| **Bundle** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُعيَّن إلى ميزات OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

تظهر كلتاهما تحت `openclaw plugins list`. راجع [حِزم Plugin](/ar/plugins/bundles) لمعرفة تفاصيل الحِزم.

إذا كنت تكتب Plugin أصليًا، فابدأ من [بناء Plugins](/ar/plugins/building-plugins)
و[نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## Plugins الرسمية

### قابلة للتثبيت (npm)

| Plugin | الحزمة | الوثائق |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix | `@openclaw/matrix` | [Matrix](/ar/channels/matrix) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/ar/channels/msteams) |
| Nostr | `@openclaw/nostr` | [Nostr](/ar/channels/nostr) |
| Voice Call | `@openclaw/voice-call` | [Voice Call](/ar/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/ar/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/ar/plugins/zalouser) |

### أساسية (تُشحن مع OpenClaw)

<AccordionGroup>
  <Accordion title="مزودو النماذج (مفعّلة افتراضيًا)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث الذاكرة المضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة المدى تُثبَّت عند الطلب مع auto-recall/capture (اضبط `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="مزودو الكلام (مفعّلون افتراضيًا)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin المتصفح المضمّن لأداة المتصفح، وCLI ‏`openclaw browser`، وطريقة Gateway ‏`browser.request`، ووقت تشغيل المتصفح، وخدمة التحكم الافتراضية في المتصفح (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` — جسر VS Code Copilot Proxy ‏(معطّل افتراضيًا)
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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| الحقل | الوصف |
| ---------------- | --------------------------------------------------------- |
| `enabled` | مفتاح تشغيل رئيسي (الافتراضي: `true`) |
| `allow` | قائمة سماح Plugins (اختيارية) |
| `deny` | قائمة حظر Plugins (اختيارية؛ والحظر يفوز) |
| `load.paths` | ملفات/أدلة Plugins إضافية |
| `slots` | محددات slots حصرية (مثل `memory`, `contextEngine`) |
| `entries.\<id\>` | مفاتيح تشغيل + إعدادات لكل Plugin |

تتطلب تغييرات الإعدادات **إعادة تشغيل Gateway**. وإذا كان Gateway يعمل مع
مراقبة الإعدادات + إعادة تشغيل داخل العملية مفعّلة (وهو مسار `openclaw gateway`
الافتراضي)، فغالبًا ما تُجرى إعادة التشغيل هذه تلقائيًا بعد لحظة من وصول كتابة الإعدادات.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: يوجد Plugin لكن قواعد التمكين أوقفته. ويتم الحفاظ على الإعدادات.
  - **مفقود**: تشير الإعدادات إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: يوجد Plugin لكن إعداداته لا تطابق المخطط المعلن.
</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw Plugins بهذا الترتيب (أول تطابق يفوز):

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

  <Step title="Plugins المضمّنة">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضيًا (مزوّدو النماذج، والكلام).
    وأخرى تتطلب تمكينًا صريحًا.
  </Step>
</Steps>

### قواعد التمكين

- يؤدي `plugins.enabled: false` إلى تعطيل كل Plugins
- يفوز `plugins.deny` دائمًا على allow
- يؤدي `plugins.entries.\<id\>.enabled: false` إلى تعطيل ذلك Plugin
- تكون Plugins ذات أصل مساحة العمل **معطّلة افتراضيًا** (ويجب تمكينها صراحةً)
- تتبع Plugins المضمّنة مجموعة التفعيل الافتراضي المدمجة ما لم يتم تجاوزها
- يمكن للـ slots الحصرية أن تفرض تمكين Plugin المحدد لذلك slot

## slots الخاصة بـ Plugin (فئات حصرية)

بعض الفئات حصرية (واحدة فقط نشطة في كل مرة):

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

| slot | ما الذي يتحكم فيه | الافتراضي |
| --------------- | --------------------- | ------------------- |
| `memory` | Plugin الذاكرة النشط | `memory-core` |
| `contextEngine` | محرك السياق النشط | `legacy` (مدمج) |

## مرجع CLI

```bash
openclaw plugins list                       # جرد مضغوط
openclaw plugins list --enabled            # Plugins المحمّلة فقط
openclaw plugins list --verbose            # أسطر تفاصيل لكل Plugin
openclaw plugins list --json               # جرد قابل للقراءة آليًا
openclaw plugins inspect <id>              # تفاصيل عميقة
openclaw plugins inspect <id> --json       # قابل للقراءة آليًا
openclaw plugins inspect --all             # جدول على مستوى الأسطول
openclaw plugins info <id>                 # اسم مستعار لـ inspect
openclaw plugins doctor                    # تشخيصات

openclaw plugins install <package>         # تثبيت (ClawHub أولًا، ثم npm)
openclaw plugins install clawhub:<pkg>     # تثبيت من ClawHub فقط
openclaw plugins install <spec> --force    # الكتابة فوق تثبيت موجود
openclaw plugins install <path>            # تثبيت من مسار محلي
openclaw plugins install -l <path>         # ربط (بدون نسخ) للتطوير
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # تسجيل مواصفة npm المحلولة الدقيقة
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # تحديث Plugin واحد
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # تحديث الكل
openclaw plugins uninstall <id>          # إزالة سجلات الإعداد/التثبيت
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تُشحن Plugins المضمّنة مع OpenClaw. وكثير منها مفعّل افتراضيًا (على سبيل المثال
مزوّدو النماذج المضمّنون، ومزوّدو الكلام المضمّنون، وPlugin المتصفح
المضمّن). أما Plugins المضمّنة الأخرى فما تزال تحتاج إلى `openclaw plugins enable <id>`.

يكتب `--force` فوق Plugin أو حزمة hook مثبتة موجودة في مكانها.
وهو غير مدعوم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا من
النسخ فوق هدف تثبيت مُدار.

إن `--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن
تثبيتات marketplace تحفظ بيانات وصفية لمصدر marketplace بدلًا من مواصفة npm.

يمثل `--dangerously-force-unsafe-install` تجاوزًا طارئًا للحالات الإيجابية الكاذبة
من ماسح الكود الخطير المدمج. وهو يسمح لمتابعة تثبيتات Plugins
وتحديثاتها بعد نتائج `critical` المدمجة، لكنه ما يزال
لا يتجاوز كتل سياسة Plugin من نوع `before_install` أو الحظر الناتج عن فشل الفحص.

تنطبق علامة CLI هذه على تدفقات تثبيت/تحديث Plugin فقط. أما تثبيتات اعتماديات Skills
المدعومة بواسطة Gateway فتستخدم تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall` بدلًا من ذلك، بينما يبقى `openclaw skills install` تدفقًا منفصلًا لتنزيل/تثبيت Skills من ClawHub.

تشارك الحِزم المتوافقة في تدفق `list/inspect/enable/disable`
نفسه. يشمل دعم وقت التشغيل الحالي Skills الحِزم، وClaude command-skills،
وإعدادات Claude الافتراضية في `settings.json`، وافتراضيات Claude ‏`.lsp.json` و
`lspServers` المعلنة في manifest، وCursor command-skills، وأدلة hook المتوافقة مع Codex.

كما يبلغ `openclaw plugins inspect <id>` عن إمكانات الحِزم المكتشفة بالإضافة إلى
إدخالات MCP وLSP server المدعومة أو غير المدعومة بالنسبة إلى Plugins المدعومة بالحِزم.

يمكن أن تكون مصادر marketplace اسم marketplace معروفًا لـ Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر marketplace محليًا أو
مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان GitHub repo
URL، أو عنوان git URL. وبالنسبة إلى marketplaces البعيدة، يجب أن تبقى إدخالات Plugin
داخل repo الخاص بـ marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI ‏`openclaw plugins`](/cli/plugins) للحصول على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تُصدّر Plugins الأصلية كائن إدخال يكشف `register(api)`. وقد تظل Plugins الأقدم
تستخدم `activate(api)` كاسم مستعار قديم، لكن ينبغي على Plugins الجديدة
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

يقوم OpenClaw بتحميل كائن الإدخال واستدعاء `register(api)` أثناء
تفعيل Plugin. ولا يزال المُحمِّل يعود إلى `activate(api)` للـ Plugins الأقدم،
لكن يجب على Plugins المضمّنة وPlugins الخارجية الجديدة التعامل مع `register`
بوصفه العقد العام.

طرق التسجيل الشائعة:

| الطريقة | ما الذي تسجله |
| --------------------------------------- | --------------------------- |
| `registerProvider` | مزود نموذج (LLM) |
| `registerChannel` | قناة دردشة |
| `registerTool` | أداة وكيل |
| `registerHook` / `on(...)` | hookات دورة الحياة |
| `registerSpeechProvider` | تحويل النص إلى كلام / STT |
| `registerRealtimeTranscriptionProvider` | STT متدفق |
| `registerRealtimeVoiceProvider` | صوت فوري ثنائي الاتجاه |
| `registerMediaUnderstandingProvider` | تحليل الصور/الصوت |
| `registerImageGenerationProvider` | إنشاء الصور |
| `registerMusicGenerationProvider` | إنشاء الموسيقى |
| `registerVideoGenerationProvider` | إنشاء الفيديو |
| `registerWebFetchProvider` | مزود web fetch / scrape |
| `registerWebSearchProvider` | web search |
| `registerHttpRoute` | نقطة نهاية HTTP |
| `registerCommand` / `registerCli` | أوامر CLI |
| `registerContextEngine` | محرك سياق |
| `registerService` | خدمة خلفية |

سلوك حارس hookات دورة الحياة typed:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأقل.
- `before_tool_call`: تكون `{ block: false }` بلا تأثير ولا تمسح block سابقًا.
- `before_install`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأقل.
- `before_install`: تكون `{ block: false }` بلا تأثير ولا تمسح block سابقًا.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأقل.
- `message_sending`: تكون `{ cancel: false }` بلا تأثير ولا تمسح cancel سابقًا.

للاطلاع على السلوك الكامل للـ hookات typed، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin خاصًا بك
- [حِزم Plugin](/ar/plugins/bundles) — توافق حِزم Codex/Claude/Cursor
- [بيان Plugin](/ar/plugins/manifest) — مخطط manifest
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات وكيل في Plugin
- [الداخلية الخاصة بـ Plugin](/ar/plugins/architecture) — نموذج الإمكانات ومسار التحميل
- [Plugins المجتمع](/ar/plugins/community) — قوائم الجهات الخارجية
