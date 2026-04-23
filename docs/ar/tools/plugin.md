---
read_when:
    - تثبيت Plugins أو تهيئتها
    - فهم قواعد اكتشاف Plugin وتحميله
    - العمل مع حِزم Plugin المتوافقة مع Codex/Claude
sidebarTitle: Install and Configure
summary: ثبّت Plugins في OpenClaw وهيئها وأدرها
title: Plugins
x-i18n:
    generated_at: "2026-04-23T14:03:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدو النماذج،
والأدوات، وSkills، والصوت، والنسخ الفوري، والصوت الفوري،
وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب، وبحث الويب،
وغير ذلك. بعض Plugins تكون **أساسية** (تُشحن مع OpenClaw)، وأخرى
**خارجية** (تنشرها community على npm).

## البدء السريع

<Steps>
  <Step title="اطلع على ما تم تحميله">
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

    ثم اضبط الإعدادات تحت `plugins.entries.\<id\>.config` في ملف config الخاص بك.

  </Step>
</Steps>

إذا كنت تفضل التحكم الأصلي عبر الدردشة، فعّل `commands.plugins: true` واستخدم:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

يستخدم مسار التثبيت نفس أداة الحل مثل CLI: مسار/أرشيف محلي، أو
`clawhub:<pkg>` صريح، أو مواصفة حزمة مجردة (ClawHub أولًا، ثم الرجوع إلى npm).

إذا كان config غير صالح، فعادةً ما يفشل التثبيت بشكل مغلق ويشير بك إلى
`openclaw doctor --fix`. والاستثناء الوحيد للاسترداد هو مسار ضيق لإعادة تثبيت
Plugin مضمّن لـ Plugins التي تشترك في
`openclaw.install.allowInvalidConfigRecovery`.

لا تقوم تثبيتات OpenClaw المعبأة بتثبيت شجرة تبعيات وقت التشغيل لكل Plugin مضمّن
بشكل استباقي. وعندما يكون Plugin مضمّن ومملوك لـ OpenClaw نشطًا من خلال
config الخاص بالـ Plugin، أو config القناة القديم، أو manifest مفعّل افتراضيًا،
فإن إصلاحات بدء التشغيل تصلح فقط تبعيات وقت التشغيل المعلنة لذلك Plugin قبل استيراده.
أما Plugins الخارجية ومسارات التحميل المخصصة فما زالت تحتاج إلى التثبيت عبر
`openclaw plugins install`.

## أنواع Plugins

يتعرف OpenClaw على تنسيقي Plugin:

| التنسيق     | طريقة العمل                                                       | أمثلة                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + وحدة runtime؛ يُنفّذ داخل العملية       | Plugins الرسمية، وحزم npm من community               |
| **Bundle** | تخطيط متوافق مع Codex/Claude/Cursor؛ يُربط بميزات OpenClaw | `.codex-plugin/`، `.claude-plugin/`، `.cursor-plugin/` |

يظهر كلاهما ضمن `openclaw plugins list`. راجع [Plugin Bundles](/ar/plugins/bundles) لتفاصيل الحِزم.

إذا كنت تكتب Plugin Native، فابدأ من [بناء Plugins](/ar/plugins/building-plugins)
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

### أساسية (تُشحن مع OpenClaw)

<AccordionGroup>
  <Accordion title="مزودو النماذج (مفعّلون افتراضيًا)">
    `anthropic`، `byteplus`، `cloudflare-ai-gateway`، `github-copilot`، `google`،
    `huggingface`، `kilocode`، `kimi-coding`، `minimax`، `mistral`، `qwen`،
    `moonshot`، `nvidia`، `openai`، `opencode`، `opencode-go`، `openrouter`،
    `qianfan`، `synthetic`، `together`، `venice`،
    `vercel-ai-gateway`، `volcengine`، `xiaomi`، `zai`
  </Accordion>

  <Accordion title="Plugins الذاكرة">
    - `memory-core` — بحث الذاكرة المضمّن (الافتراضي عبر `plugins.slots.memory`)
    - `memory-lancedb` — ذاكرة طويلة الأمد تُثبّت عند الطلب مع auto-recall/capture (اضبط `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="مزودو الصوت (مفعّلون افتراضيًا)">
    `elevenlabs`، `microsoft`
  </Accordion>

  <Accordion title="أخرى">
    - `browser` — Plugin browser مضمّن لأداة browser، وCLI ‏`openclaw browser`، وطريقة Gateway ‏`browser.request`، وruntime الخاصة بالـ browser، وخدمة التحكم الافتراضية للـ browser (مفعّل افتراضيًا؛ عطّله قبل استبداله)
    - `copilot-proxy` — جسر VS Code Copilot Proxy ‏(معطّل افتراضيًا)
  </Accordion>
</AccordionGroup>

هل تبحث عن Plugins خارجية؟ راجع [Community Plugins](/ar/plugins/community).

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
| `enabled`        | مفتاح التبديل الرئيسي (الافتراضي: `true`)                           |
| `allow`          | قائمة سماح Plugins (اختياري)                               |
| `deny`           | قائمة حظر Plugins (اختياري؛ والحظر يتقدم)                     |
| `load.paths`     | ملفات/أدلة Plugin إضافية                            |
| `slots`          | محددات slots حصرية (مثل `memory` و`contextEngine`) |
| `entries.\<id\>` | مفاتيح تبديل + config لكل Plugin                               |

تتطلب تغييرات config **إعادة تشغيل gateway**. وإذا كانت Gateway تعمل مع
مراقبة config + إعادة تشغيل داخل العملية مفعّلتين (وهذا هو المسار الافتراضي `openclaw gateway`)،
فعادةً ما يتم تنفيذ إعادة التشغيل تلك تلقائيًا بعد لحظات من وصول كتابة config.

<Accordion title="حالات Plugin: معطّل مقابل مفقود مقابل غير صالح">
  - **معطّل**: Plugin موجود لكن قواعد التمكين عطّلته. ويتم الاحتفاظ بـ config.
  - **مفقود**: يشير config إلى معرّف Plugin لم يعثر عليه الاكتشاف.
  - **غير صالح**: Plugin موجود لكن config الخاص به لا يطابق schema المعلنة.
</Accordion>

## الاكتشاف والأسبقية

يفحص OpenClaw Plugins بهذا الترتيب (أول تطابق يفوز):

<Steps>
  <Step title="مسارات config">
    `plugins.load.paths` — مسارات ملفات أو أدلة صريحة.
  </Step>

  <Step title="Plugins مساحة العمل">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins العامة">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins المضمّنة">
    تُشحن مع OpenClaw. كثير منها مفعّل افتراضيًا (مزودو النماذج، الصوت).
    وأخرى تتطلب تمكينًا صريحًا.
  </Step>
</Steps>

### قواعد التمكين

- يؤدي `plugins.enabled: false` إلى تعطيل كل Plugins
- يتقدم `plugins.deny` دائمًا على allow
- يؤدي `plugins.entries.\<id\>.enabled: false` إلى تعطيل ذلك Plugin
- تكون Plugins ذات أصل مساحة العمل **معطّلة افتراضيًا** (ويجب تمكينها صراحةً)
- تتبع Plugins المضمّنة مجموعة التفعيل الافتراضية المدمجة ما لم يتم تجاوزها
- يمكن أن تفرض slots الحصرية تمكين Plugin المحدد لذلك slot

## Plugin slots (فئات حصرية)

بعض الفئات حصرية (واحد نشط فقط في كل مرة):

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

| الـ Slot            | ما الذي يتحكم فيه      | الافتراضي             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin الذاكرة النشط  | `memory-core`       |
| `contextEngine` | محرك السياق النشط | `legacy` (مضمّن) |

## مرجع CLI

```bash
openclaw plugins list                       # فهرس مضغوط
openclaw plugins list --enabled            # Plugins المحمّلة فقط
openclaw plugins list --verbose            # أسطر تفاصيل لكل Plugin
openclaw plugins list --json               # فهرس قابل للقراءة آليًا
openclaw plugins inspect <id>              # تفاصيل عميقة
openclaw plugins inspect <id> --json       # قابل للقراءة آليًا
openclaw plugins inspect --all             # جدول على مستوى الأسطول
openclaw plugins info <id>                 # اسم بديل لـ inspect
openclaw plugins doctor                    # تشخيصات

openclaw plugins install <package>         # تثبيت (ClawHub أولًا، ثم npm)
openclaw plugins install clawhub:<pkg>     # تثبيت من ClawHub فقط
openclaw plugins install <spec> --force    # الكتابة فوق التثبيت الموجود
openclaw plugins install <path>            # تثبيت من مسار محلي
openclaw plugins install -l <path>         # ربط (من دون نسخ) للتطوير
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # تسجيل مواصفة npm المحلولة الدقيقة
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # تحديث Plugin واحد
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # تحديث الكل
openclaw plugins uninstall <id>          # إزالة سجلات config/التثبيت
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

تُشحن Plugins المضمّنة مع OpenClaw. كثير منها مفعّل افتراضيًا (على سبيل المثال
مزودو النماذج المضمّنون، ومزودو الصوت المضمّنون، وPlugin
browser المضمّن). وما تزال Plugins مضمّنة أخرى تحتاج إلى `openclaw plugins enable <id>`.

يقوم `--force` بالكتابة فوق Plugin أو hook pack مثبت موجود في مكانه. استخدم
`openclaw plugins update <id-or-npm-spec>` للترقيات الروتينية لـ Plugins npm
المتتبعة. وهو غير مدعوم مع `--link`، الذي يعيد استخدام مسار المصدر بدلًا
من النسخ فوق هدف تثبيت مُدار.

عندما تكون `plugins.allow` مضبوطة بالفعل، يضيف `openclaw plugins install`
معرّف Plugin المثبّت إلى قائمة السماح تلك قبل تمكينه، بحيث تصبح عمليات التثبيت
قابلة للتحميل فورًا بعد إعادة التشغيل.

ينطبق `openclaw plugins update <id-or-npm-spec>` على التثبيتات المتتبعة. ويؤدي تمرير
مواصفة حزمة npm مع dist-tag أو إصدار دقيق إلى حل اسم الحزمة
مجدّدًا إلى سجل Plugin المتتبع وتسجيل المواصفة الجديدة للتحديثات المستقبلية.
ويؤدي تمرير اسم الحزمة من دون إصدار إلى إعادة تثبيت دقيق ومثبت إلى
خط الإصدار الافتراضي للسجل. وإذا كان Plugin npm المثبّت يطابق بالفعل
الإصدار المحلول وهوية artifact المسجلة، فإن OpenClaw يتخطى التحديث
من دون تنزيل أو إعادة تثبيت أو إعادة كتابة config.

`--pin` خاص بـ npm فقط. وهو غير مدعوم مع `--marketplace`، لأن
تثبيتات marketplace تحفظ بيانات مصدر marketplace الوصفية بدلًا من مواصفة npm.

`--dangerously-force-unsafe-install` هو تجاوز break-glass للحالات
الإيجابية الكاذبة من dangerous-code scanner المضمّن. وهو يسمح باستمرار
عمليات تثبيت Plugin وتحديثاته بعد نتائج `critical` المضمنة، لكنه
لا يتجاوز حظر السياسة `before_install` الخاصة بالـ Plugin أو الحظر الناتج عن فشل الفحص.

ينطبق هذا العلم في CLI على تدفقات تثبيت/تحديث Plugin فقط. أما عمليات تثبيت
تبعيات Skills المدعومة من Gateway فتستخدم التجاوز المطابق للطلب
`dangerouslyForceUnsafeInstall` بدلًا من ذلك، بينما يظل `openclaw skills install`
هو تدفق التنزيل/التثبيت المنفصل لـ Skills من ClawHub.

تشارك الحِزم المتوافقة في نفس تدفق list/inspect/enable/disable الخاص بالـ Plugin.
ويتضمن دعم runtime الحالي Skills الخاصة بالحِزم، وClaude command-skills،
وقيم Claude ‏`settings.json` الافتراضية، وقيم Claude ‏`.lsp.json` و
القيم الافتراضية `lspServers` المعلنة في manifest، وCursor command-skills،
وأدلة hooks المتوافقة مع Codex.

يبلغ `openclaw plugins inspect <id>` أيضًا عن إمكانات الحِزمة المكتشفة بالإضافة
إلى إدخالات خوادم MCP وLSP المدعومة أو غير المدعومة لـ Plugins
المدعومة بالحِزم.

يمكن أن تكون مصادر Marketplace اسم known-marketplace خاصًا بـ Claude من
`~/.claude/plugins/known_marketplaces.json`، أو جذر Marketplace محلي أو
مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub،
أو عنوان URL لـ git. وبالنسبة إلى Marketplaces البعيدة، يجب أن تبقى إدخالات Plugin داخل
مستودع Marketplace المستنسخ وأن تستخدم مصادر مسارات نسبية فقط.

راجع [مرجع CLI ‏`openclaw plugins`](/ar/cli/plugins) للاطلاع على التفاصيل الكاملة.

## نظرة عامة على Plugin API

تُصدّر Plugins Native كائن إدخال يعرّض `register(api)`. وما زالت
Plugins الأقدم قد تستخدم `activate(api)` كاسم بديل قديم، لكن Plugins الجديدة يجب
أن تستخدم `register`.

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
وما يزال loader يعود إلى `activate(api)` بالنسبة إلى Plugins الأقدم،
لكن يجب على Plugins المضمّنة وPlugins الخارجية الجديدة اعتبار `register`
العقد العام.

طرق التسجيل الشائعة:

| الطريقة                                  | ما الذي تسجله           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | مزود نماذج (LLM)        |
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
| `registerWebFetchProvider`              | مزود جلب / كشط ويب |
| `registerWebSearchProvider`             | بحث الويب                  |
| `registerHttpRoute`                     | نقطة نهاية HTTP               |
| `registerCommand` / `registerCli`       | أوامر CLI                |
| `registerContextEngine`                 | محرك السياق              |
| `registerService`                       | خدمة في الخلفية          |

سلوك hook guard بالنسبة إلى hooks دورة الحياة المكتوبة:

- `before_tool_call`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تكون `{ block: false }` بلا تأثير ولا تزيل block سابقًا.
- `before_install`: تكون `{ block: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `before_install`: تكون `{ block: false }` بلا تأثير ولا تزيل block سابقًا.
- `message_sending`: تكون `{ cancel: true }` نهائية؛ ويتم تخطي المعالجات ذات الأولوية الأدنى.
- `message_sending`: تكون `{ cancel: false }` بلا تأثير ولا تزيل cancel سابقًا.

للاطلاع على السلوك الكامل للـ hooks المكتوبة، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics).

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin خاصًا بك
- [Plugin Bundles](/ar/plugins/bundles) — توافق حِزم Codex/Claude/Cursor
- [Plugin Manifest](/ar/plugins/manifest) — مخطط manifest
- [تسجيل الأدوات](/ar/plugins/building-plugins#registering-agent-tools) — أضف أدوات الوكيل داخل Plugin
- [Plugin Internals](/ar/plugins/architecture) — نموذج الإمكانات ومسار التحميل
- [Community Plugins](/ar/plugins/community) — قوائم الجهات الخارجية
