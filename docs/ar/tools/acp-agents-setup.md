---
read_when:
    - تثبيت أو تهيئة acpx harness لـ Claude Code / Codex / Gemini CLI
    - تمكين جسر MCP الخاص بـ plugin-tools أو OpenClaw-tools
    - تهيئة أوضاع أذونات ACP
summary: 'إعداد وكلاء ACP: إعدادات acpx harness، وإعداد Plugin، والأذونات'
title: وكلاء ACP — الإعداد
x-i18n:
    generated_at: "2026-04-25T13:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

للاطلاع على النظرة العامة، ودليل التشغيل، والمفاهيم، راجع [وكلاء ACP](/ar/tools/acp-agents).

تغطي الأقسام أدناه إعدادات acpx harness، وإعداد Plugin لجسور MCP، وإعدادات الأذونات.

## دعم acpx harness (الحالي)

الأسماء المستعارة المدمجة الحالية لـ acpx harness:

- `claude`
- `codex`
- `copilot`
- `cursor` ‏(Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

عندما يستخدم OpenClaw الواجهة الخلفية acpx، ففضّل هذه القيم لـ `agentId` ما لم تكن إعدادات acpx لديك تعرّف أسماء مستعارة مخصصة للوكلاء.
إذا كان تثبيت Cursor المحلي لديك لا يزال يعرّض ACP على أنه `agent acp`، فاستبدل أمر الوكيل `cursor` في إعدادات acpx بدلًا من تغيير القيمة المدمجة الافتراضية.

يمكن أيضًا لاستخدام acpx CLI المباشر استهداف محوّلات عشوائية عبر `--agent <command>`، لكن منفذ الهروب الخام هذا هو ميزة في acpx CLI (وليس مسار `agentId` العادي في OpenClaw).

## الإعدادات المطلوبة

الخط الأساسي الأساسي لـ ACP:

```json5
{
  acp: {
    enabled: true,
    // اختياري. القيمة الافتراضية هي true؛ اضبطها على false لإيقاف إرسال ACP مؤقتًا مع إبقاء عناصر التحكم /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

إعدادات ربط الخيوط خاصة بمحوّل القناة. مثال لـ Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

إذا لم يعمل إنشاء ACP المرتبط بالخيط، فتحقق أولًا من علامة ميزة المحوّل:

- Discord: ‏`channels.discord.threadBindings.spawnAcpSessions=true`

لا تتطلب الارتباطات الخاصة بالمحادثة الحالية إنشاء خيط فرعي. وهي تتطلب سياق محادثة نشطًا ومحوّل قناة يعرّض ارتباطات محادثة ACP.

راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## إعداد Plugin للواجهة الخلفية acpx

تشحن عمليات التثبيت الجديدة Plugin وقت التشغيل المجمّع `acpx` مفعّلًا افتراضيًا، لذا
فإن ACP يعمل عادةً من دون خطوة تثبيت Plugin يدوية.

ابدأ بما يلي:

```text
/acp doctor
```

إذا كنت قد عطّلت `acpx`، أو منعته عبر `plugins.allow` / `plugins.deny`، أو كنت تريد
التحويل إلى نسخة سحب تطوير محلية، فاستخدم مسار Plugin الصريح:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

تثبيت مساحة عمل محلية أثناء التطوير:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

ثم تحقق من سلامة الواجهة الخلفية:

```text
/acp doctor
```

### إعدادات أمر acpx والإصدار

افتراضيًا، يستخدم Plugin `acpx` المجمّع ملفه التنفيذي المثبّت محليًا داخل Plugin ‏(`node_modules/.bin/acpx` داخل حزمة Plugin). عند بدء التشغيل، يُسجَّل أن الواجهة الخلفية غير جاهزة، وتتحقق مهمة خلفية من `acpx --version`؛ وإذا كان الملف التنفيذي مفقودًا أو لا يطابق الإصدار، فإنها تشغّل `npm install --omit=dev --no-save acpx@<pinned>` ثم تتحقق مرة أخرى. وتبقى Gateway غير حاجزية طوال ذلك.

استبدل الأمر أو الإصدار في إعدادات Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- يقبل `command` مسارًا مطلقًا، أو مسارًا نسبيًا (يُحل من مساحة عمل OpenClaw)، أو اسم أمر.
- يؤدي `expectedVersion: "any"` إلى تعطيل المطابقة الصارمة للإصدار.
- تؤدي مسارات `command` المخصصة إلى تعطيل التثبيت التلقائي المحلي للـ Plugin.

راجع [Plugins](/ar/tools/plugin).

### التثبيت التلقائي للاعتماديات

عندما تثبّت OpenClaw بشكل عام باستخدام `npm install -g openclaw`، تُثبَّت
اعتماديات وقت التشغيل الخاصة بـ acpx (الملفات التنفيذية الخاصة بالمنصة) تلقائيًا
عبر hook بعد التثبيت. وإذا فشل التثبيت التلقائي، فستبدأ Gateway
بشكل طبيعي وتبلّغ عن الاعتمادية المفقودة عبر `openclaw acp doctor`.

### جسر MCP لأدوات Plugin

افتراضيًا، لا تعرض جلسات ACPX **أدوات OpenClaw المسجلة بواسطة Plugins** إلى
ACP harness.

إذا كنت تريد أن تتمكن وكلاء ACP مثل Codex أو Claude Code من استدعاء
أدوات OpenClaw المثبتة مثل memory recall/store، ففعّل الجسر المخصص:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مدمجًا باسم `openclaw-plugin-tools` في
  تمهيد جلسة ACPX.
- يعرّض أدوات Plugins المسجلة بالفعل بواسطة Plugins OpenClaw
  المثبتة والمفعّلة.
- يُبقي هذه الميزة صريحة ومعطلة افتراضيًا.

ملاحظات الأمان والثقة:

- يؤدي هذا إلى توسيع سطح أدوات ACP harness.
- يحصل وكلاء ACP على وصول فقط إلى أدوات Plugins النشطة بالفعل في Gateway.
- تعامل مع هذا على أنه حدود الثقة نفسها التي تنطبق عند السماح لتلك Plugins بالتنفيذ داخل
  OpenClaw نفسه.
- راجع Plugins المثبتة قبل تفعيله.

تظل إعدادات `mcpServers` المخصصة تعمل كما كانت. جسر plugin-tools المدمج
هو وسيلة راحة إضافية اختيارية، وليس بديلًا عن إعداد خادم MCP العام.

### جسر MCP لأدوات OpenClaw

افتراضيًا، لا تعرض جلسات ACPX أيضًا أدوات OpenClaw المدمجة عبر
MCP. فعّل جسر الأدوات الأساسية المنفصل عندما يحتاج وكيل ACP إلى أدوات
مدمجة محددة مثل `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

ما الذي يفعله هذا:

- يحقن خادم MCP مدمجًا باسم `openclaw-tools` في تمهيد
  جلسة ACPX.
- يعرّض أدوات OpenClaw المدمجة المحددة. والخادم الأولي يعرّض `cron`.
- يُبقي عرض الأدوات الأساسية صريحًا ومعطلًا افتراضيًا.

### إعداد مهلة وقت التشغيل

يضبط Plugin `acpx` المجمّع أدوار وقت التشغيل المضمّنة افتراضيًا على
مهلة مقدارها 120 ثانية. وهذا يمنح harnesses الأبطأ مثل Gemini CLI وقتًا كافيًا لإكمال
بدء تشغيل ACP والتهيئة. استبدلها إذا كان المضيف لديك يحتاج إلى حد مختلف
لوقت التشغيل:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

### إعداد وكيل فحص السلامة

يفحص Plugin `acpx` المجمّع وكيل harness واحدًا أثناء تحديد ما إذا كانت
واجهة وقت التشغيل المضمّنة الخلفية جاهزة. إذا كانت `acp.allowedAgents` مضبوطة، فإنه يستخدم افتراضيًا
أول وكيل مسموح؛ وإلا فإنه يستخدم `codex` افتراضيًا. إذا كان النشر لديك
يتطلب وكيل ACP مختلفًا لفحوصات السلامة، فاضبط وكيل الفحص صراحةً:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

أعد تشغيل Gateway بعد تغيير هذه القيمة.

## إعدادات الأذونات

تعمل جلسات ACP بشكل غير تفاعلي — لا توجد TTY للموافقة على
مطالبات أذونات كتابة الملفات وتنفيذ shell أو رفضها. يوفّر Plugin acpx مفتاحي إعدادات يتحكمان
في كيفية التعامل مع الأذونات:

أذونات ACPX harness هذه منفصلة عن موافقات exec في OpenClaw ومنفصلة عن
أعلام تجاوز المورّد الخاصة بالواجهة الخلفية في CLI مثل Claude CLI ‏`--permission-mode bypassPermissions`. ويمثل `approve-all` في ACPX مفتاح كسر الزجاج على مستوى harness لجلسات ACP.

### `permissionMode`

يتحكم في العمليات التي يمكن لوكيل harness تنفيذها من دون مطالبة.

| القيمة           | السلوك                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | الموافقة التلقائية على جميع عمليات كتابة الملفات وأوامر shell.          |
| `approve-reads` | الموافقة التلقائية على عمليات القراءة فقط؛ أما الكتابة والتنفيذ فتتطلب مطالبات. |
| `deny-all`      | رفض جميع مطالبات الأذونات.                              |

### `nonInteractivePermissions`

يتحكم في ما يحدث عندما كان من المفترض إظهار مطالبة إذن لكن لا توجد TTY تفاعلية متاحة (وهو الحال دائمًا في جلسات ACP).

| القيمة  | السلوك                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | إجهاض الجلسة مع `AcpRuntimeError`. **(الافتراضي)**           |
| `deny` | رفض الإذن بصمت ومتابعة العمل (تدهور سلس). |

### الإعدادات

اضبطها عبر إعدادات Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

أعد تشغيل Gateway بعد تغيير هذه القيم.

> **مهم:** يستخدم OpenClaw حاليًا افتراضيًا `permissionMode=approve-reads` و`nonInteractivePermissions=fail`. في جلسات ACP غير التفاعلية، قد تفشل أي عملية كتابة أو تنفيذ تؤدي إلى مطالبة إذن مع الخطأ `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> إذا كنت بحاجة إلى تقييد الأذونات، فاضبط `nonInteractivePermissions` على `deny` حتى تتدهور الجلسات بسلاسة بدلًا من التعطل.

## ذو صلة

- [وكلاء ACP](/ar/tools/acp-agents) — النظرة العامة، ودليل التشغيل، والمفاهيم
- [الوكلاء الفرعيون](/ar/tools/subagents)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
