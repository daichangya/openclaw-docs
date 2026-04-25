---
read_when:
    - تريد أتمتة معتمدة على الأحداث لأوامر `/new` و`/reset` و`/stop` وأحداث دورة حياة الوكيل
    - تريد إنشاء الخطافات أو تثبيتها أو تصحيحها
summary: 'الخطافات: الأتمتة المعتمدة على الأحداث للأوامر وأحداث دورة الحياة'
title: الخطافات
x-i18n:
    generated_at: "2026-04-25T13:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 437b8b8dc37e9ec9c10bbdddc4d63184ccc46e89bc532aea0c5bd176404186f6
    source_path: automation/hooks.md
    workflow: 15
---

الخطافات هي نصوص برمجية صغيرة تعمل عند حدوث شيء ما داخل Gateway. يمكن اكتشافها من الأدلة وفحصها باستخدام `openclaw hooks`. لا يحمّل Gateway الخطافات الداخلية إلا بعد تمكين الخطافات أو تهيئة إدخال خطاف واحد على الأقل، أو حزمة خطافات، أو معالج قديم، أو دليل خطافات إضافي.

يوجد نوعان من الخطافات في OpenClaw:

- **الخطافات الداخلية** (هذه الصفحة): تعمل داخل Gateway عند تشغيل أحداث الوكيل، مثل `/new` أو `/reset` أو `/stop` أو أحداث دورة الحياة.
- **Webhooks**: نقاط نهاية HTTP خارجية تتيح لأنظمة أخرى تشغيل الأعمال في OpenClaw. راجع [Webhooks](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تجميع الخطافات داخل Plugins. يعرض `openclaw hooks list` كلاً من الخطافات المستقلة والخطافات المُدارة بواسطة Plugin.

## البدء السريع

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## أنواع الأحداث

| الحدث                    | وقت تشغيله                                      |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | عند إصدار الأمر `/new`                         |
| `command:reset`          | عند إصدار الأمر `/reset`                       |
| `command:stop`           | عند إصدار الأمر `/stop`                        |
| `command`                | أي حدث أمر (مستمع عام)                         |
| `session:compact:before` | قبل أن يلخّص Compaction السجل                  |
| `session:compact:after`  | بعد اكتمال Compaction                          |
| `session:patch`          | عند تعديل خصائص الجلسة                         |
| `agent:bootstrap`        | قبل حقن ملفات تهيئة مساحة العمل                |
| `gateway:startup`        | بعد بدء القنوات وتحميل الخطافات                |
| `message:received`       | رسالة واردة من أي قناة                         |
| `message:transcribed`    | بعد اكتمال تفريغ الصوت إلى نص                  |
| `message:preprocessed`   | بعد اكتمال جميع عمليات فهم الوسائط والروابط    |
| `message:sent`           | عند تسليم الرسالة الصادرة                      |

## كتابة الخطافات

### بنية الخطاف

كل خطاف هو دليل يحتوي على ملفين:

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### تنسيق HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**حقول Metadata** (`metadata.openclaw`):

| الحقل      | الوصف                                                 |
| ---------- | ----------------------------------------------------- |
| `emoji`    | رمز تعبيري للعرض في CLI                               |
| `events`   | مصفوفة بالأحداث المطلوب الاستماع إليها                |
| `export`   | التصدير المسمى المطلوب استخدامه (الافتراضي هو `"default"`) |
| `os`       | المنصات المطلوبة (مثل `["darwin", "linux"]`)         |
| `requires` | مسارات `bins` أو `anyBins` أو `env` أو `config` المطلوبة |
| `always`   | تجاوز فحوصات الأهلية (قيمة منطقية)                    |
| `install`  | طرق التثبيت                                           |

### تنفيذ المعالج

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` (أضف إليها لإرسال رسالة إلى المستخدم) و`context` (بيانات خاصة بالحدث). يمكن أن تتضمن سياقات خطافات Plugin الخاصة بالوكيل والأداة أيضًا `trace`، وهو سياق تتبع تشخيصي للقراءة فقط ومتوافق مع W3C ويمكن لـ Plugins تمريره إلى السجلات المنظمة لربط OTEL.

### أبرز سياقات الأحداث

**أحداث الأوامر** (`command:new`, `command:reset`): `context.sessionEntry` و`context.previousSessionEntry` و`context.commandSource` و`context.workspaceDir` و`context.cfg`.

**أحداث الرسائل** (`message:received`): `context.from` و`context.content` و`context.channelId` و`context.metadata` (بيانات خاصة بالموفر تتضمن `senderId` و`senderName` و`guildId`).

**أحداث الرسائل** (`message:sent`): `context.to` و`context.content` و`context.success` و`context.channelId`.

**أحداث الرسائل** (`message:transcribed`): `context.transcript` و`context.from` و`context.channelId` و`context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المُثْرى) و`context.from` و`context.channelId`.

**أحداث التهيئة** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل) و`context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry` و`context.patch` (الحقول المتغيرة فقط) و`context.cfg`. لا يمكن إلا للعملاء ذوي الامتيازات تشغيل أحداث التصحيح.

**أحداث Compaction**: يتضمن `session:compact:before` القيم `messageCount` و`tokenCount`. ويضيف `session:compact:after` القيم `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

## اكتشاف الخطافات

يتم اكتشاف الخطافات من هذه الأدلة، بترتيب تصاعدي من حيث أولوية التجاوز:

1. **الخطافات المضمنة**: تُشحن مع OpenClaw
2. **خطافات Plugin**: خطافات مجمعة داخل Plugins المثبتة
3. **الخطافات المُدارة**: `~/.openclaw/hooks/` (مثبتة من قبل المستخدم ومشتركة عبر مساحات العمل). تشترك الأدلة الإضافية من `hooks.internal.load.extraDirs` في هذه الأولوية.
4. **خطافات مساحة العمل**: `<workspace>/hooks/` (لكل وكيل، ومعطلة افتراضيًا حتى يتم تمكينها صراحة)

يمكن لخطافات مساحة العمل إضافة أسماء خطافات جديدة، لكنها لا تستطيع تجاوز الخطافات المضمنة أو المُدارة أو المقدمة من Plugin إذا كان لها الاسم نفسه.

يتجاوز Gateway اكتشاف الخطافات الداخلية عند بدء التشغيل إلى أن يتم تكوين الخطافات الداخلية. قم بتمكين خطاف مضمن أو مُدار باستخدام `openclaw hooks enable <name>`، أو ثبّت حزمة خطافات، أو اضبط `hooks.internal.enabled=true` لتفعيلها. عند تمكين خطاف مُسمى واحد، يحمّل Gateway معالج ذلك الخطاف فقط؛ أما `hooks.internal.enabled=true`، وأدلة الخطافات الإضافية، والمعالجات القديمة فتفعّل الاكتشاف الشامل.

### حزم الخطافات

حزم الخطافات هي حزم npm تصدّر الخطافات عبر `openclaw.hooks` في `package.json`. ثبّتها باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

تقتصر مواصفات npm على السجل فقط (اسم الحزمة مع نسخة دقيقة اختيارية أو dist-tag). يتم رفض مواصفات Git/URL/file ونطاقات semver.

## الخطافات المضمنة

| الخطاف                | الأحداث                        | ما الذي يفعله                                           |
| --------------------- | ------------------------------ | ------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | يحفظ سياق الجلسة في `<workspace>/memory/`               |
| bootstrap-extra-files | `agent:bootstrap`              | يحقن ملفات تهيئة إضافية من أنماط glob                   |
| command-logger        | `command`                      | يسجل جميع الأوامر في `~/.openclaw/logs/commands.log`    |
| boot-md               | `gateway:startup`              | يشغّل `BOOT.md` عند بدء Gateway                         |

قم بتمكين أي خطاف مضمن:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

يستخرج آخر 15 رسالة مستخدم/مساعد، ويولّد slug وصفيًا لاسم الملف عبر LLM، ثم يحفظه في `<workspace>/memory/YYYY-MM-DD-slug.md`. يتطلب تكوين `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### إعداد bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

تُفسَّر المسارات نسبةً إلى مساحة العمل. لا يتم تحميل إلا أسماء ملفات التهيئة الأساسية المعروفة (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

يسجل كل أمر يبدأ بشرطة مائلة في `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### تفاصيل boot-md

يشغّل `BOOT.md` من مساحة العمل النشطة عند بدء Gateway.

## خطافات Plugin

يمكن لـ Plugins تسجيل خطافات Typed عبر Plugin SDK لتحقيق تكامل أعمق:
اعتراض استدعاءات الأدوات، وتعديل المطالبات، والتحكم في تدفق الرسائل، وغير ذلك.
استخدم خطافات Plugin عندما تحتاج إلى `before_tool_call` أو `before_agent_reply` أو `before_install` أو غيرها من خطافات دورة الحياة داخل العملية.

للاطلاع على المرجع الكامل لخطافات Plugin، راجع [Plugin hooks](/ar/plugins/hooks).

## الإعداد

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

متغيرات البيئة لكل خطاف:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

أدلة خطافات إضافية:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
لا يزال تنسيق إعداد المصفوفة القديم `hooks.internal.handlers` مدعومًا من أجل التوافق مع الإصدارات السابقة، لكن ينبغي أن تستخدم الخطافات الجديدة النظام المعتمد على الاكتشاف.
</Note>

## مرجع CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## أفضل الممارسات

- **أبقِ المعالجات سريعة.** تعمل الخطافات أثناء معالجة الأوامر. نفّذ الأعمال الثقيلة بأسلوب الإطلاق دون انتظار باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء بسلاسة.** لفّ العمليات المحفوفة بالمخاطر داخل try/catch؛ ولا تُطلق الأخطاء حتى تتمكن المعالجات الأخرى من العمل.
- **رشّح الأحداث مبكرًا.** عُد فورًا إذا لم يكن نوع الحدث/إجراؤه ذا صلة.
- **استخدم مفاتيح أحداث محددة.** فضّل `"events": ["command:new"]` على `"events": ["command"]` لتقليل الحمل.

## استكشاف الأخطاء وإصلاحها

### لم يتم اكتشاف الخطاف

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### الخطاف غير مؤهل

```bash
openclaw hooks info my-hook
```

تحقق من الثنائيات المفقودة (PATH)، أو متغيرات البيئة، أو قيم الإعداد، أو توافق نظام التشغيل.

### الخطاف لا يعمل

1. تحقق من أن الخطاف مُمكّن: `openclaw hooks list`
2. أعد تشغيل عملية Gateway حتى تُعاد تحميل الخطافات.
3. تحقق من سجلات Gateway: `./scripts/clawlog.sh | grep hook`

## ذو صلة

- [مرجع CLI: hooks](/ar/cli/hooks)
- [Webhooks](/ar/automation/cron-jobs#webhooks)
- [Plugin hooks](/ar/plugins/hooks) — خطافات دورة حياة Plugin داخل العملية
- [الإعداد](/ar/gateway/configuration-reference#hooks)
