---
read_when:
    - تريد أتمتة معتمدة على الأحداث لـ `/new` و`/reset` و`/stop` وأحداث دورة حياة الوكيل
    - تريد إنشاء الخطافات أو تثبيتها أو تصحيحها
summary: 'الخطافات: الأتمتة المعتمدة على الأحداث للأوامر وأحداث دورة الحياة'
title: الخطافات
x-i18n:
    generated_at: "2026-04-21T07:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5269c3ca3a45d23d79232e041c0980ecaab93fd6f0f1e39e0b2a76cb4c8b5c8b
    source_path: automation/hooks.md
    workflow: 15
---

# الخطافات

الخطافات هي برامج نصية صغيرة تعمل عندما يحدث شيء ما داخل Gateway. يمكن اكتشافها من الأدلة وفحصها باستخدام `openclaw hooks`. يحمّل Gateway الخطافات الداخلية فقط بعد تفعيل الخطافات أو تهيئة إدخال خطاف واحد على الأقل، أو حزمة خطافات، أو معالج قديم، أو دليل خطافات إضافي.

يوجد نوعان من الخطافات في OpenClaw:

- **الخطافات الداخلية** (هذه الصفحة): تعمل داخل Gateway عند إطلاق أحداث الوكيل، مثل `/new` أو `/reset` أو `/stop` أو أحداث دورة الحياة.
- **Webhooks**: نقاط نهاية HTTP خارجية تتيح للأنظمة الأخرى تشغيل أعمال في OpenClaw. راجع [Webhooks](/ar/automation/cron-jobs#webhooks).

يمكن أيضًا تجميع الخطافات داخل plugins. يعرض `openclaw hooks list` كلاً من الخطافات المستقلة والخطافات التي تديرها plugins.

## البدء السريع

```bash
# عرض الخطافات المتاحة
openclaw hooks list

# تفعيل خطاف
openclaw hooks enable session-memory

# التحقق من حالة الخطاف
openclaw hooks check

# الحصول على معلومات مفصلة
openclaw hooks info session-memory
```

## أنواع الأحداث

| الحدث                    | وقت إطلاقه                                     |
| ------------------------ | ---------------------------------------------- |
| `command:new`            | عند إصدار الأمر `/new`                         |
| `command:reset`          | عند إصدار الأمر `/reset`                       |
| `command:stop`           | عند إصدار الأمر `/stop`                        |
| `command`                | أي حدث أمر (مستمع عام)                         |
| `session:compact:before` | قبل أن يقوم Compaction بتلخيص السجل             |
| `session:compact:after`  | بعد اكتمال Compaction                          |
| `session:patch`          | عند تعديل خصائص الجلسة                         |
| `agent:bootstrap`        | قبل حقن ملفات bootstrap الخاصة بمساحة العمل     |
| `gateway:startup`        | بعد بدء القنوات وتحميل الخطافات                |
| `message:received`       | رسالة واردة من أي قناة                         |
| `message:transcribed`    | بعد اكتمال النسخ الصوتي                        |
| `message:preprocessed`   | بعد اكتمال جميع عمليات فهم الوسائط والروابط     |
| `message:sent`           | تم تسليم الرسالة الصادرة                       |

## كتابة الخطافات

### بنية الخطاف

كل خطاف هو دليل يحتوي على ملفين:

```
my-hook/
├── HOOK.md          # البيانات الوصفية + التوثيق
└── handler.ts       # تنفيذ المعالج
```

### تنسيق HOOK.md

```markdown
---
name: my-hook
description: "وصف قصير لما يفعله هذا الخطاف"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# خطافي

يوضع هنا التوثيق المفصل.
```

**حقول البيانات الوصفية** (`metadata.openclaw`):

| الحقل      | الوصف                                                |
| ---------- | ---------------------------------------------------- |
| `emoji`    | رمز تعبيري للعرض في CLI                              |
| `events`   | مصفوفة بالأحداث المطلوب الاستماع إليها               |
| `export`   | التصدير المسمى المطلوب استخدامه (الافتراضي `"default"`) |
| `os`       | المنصات المطلوبة (مثل `["darwin", "linux"]`)         |
| `requires` | المسارات المطلوبة لـ `bins` أو `anyBins` أو `env` أو `config` |
| `always`   | تجاوز فحوصات الأهلية (قيمة منطقية)                   |
| `install`  | طرق التثبيت                                          |

### تنفيذ المعالج

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // منطقك هنا

  // إرسال رسالة إلى المستخدم اختياريًا
  event.messages.push("تم تنفيذ الخطاف!");
};

export default handler;
```

يتضمن كل حدث: `type` و`action` و`sessionKey` و`timestamp` و`messages` (أضف إليها للإرسال إلى المستخدم) و`context` (بيانات خاصة بالحدث).

### أبرز عناصر سياق الحدث

**أحداث الأوامر** (`command:new` و`command:reset`): `context.sessionEntry` و`context.previousSessionEntry` و`context.commandSource` و`context.workspaceDir` و`context.cfg`.

**أحداث الرسائل** (`message:received`): `context.from` و`context.content` و`context.channelId` و`context.metadata` (بيانات خاصة بالموفر تتضمن `senderId` و`senderName` و`guildId`).

**أحداث الرسائل** (`message:sent`): `context.to` و`context.content` و`context.success` و`context.channelId`.

**أحداث الرسائل** (`message:transcribed`): `context.transcript` و`context.from` و`context.channelId` و`context.mediaPath`.

**أحداث الرسائل** (`message:preprocessed`): `context.bodyForAgent` (النص النهائي المُثْرى) و`context.from` و`context.channelId`.

**أحداث Bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (مصفوفة قابلة للتعديل) و`context.agentId`.

**أحداث تصحيح الجلسة** (`session:patch`): `context.sessionEntry` و`context.patch` (الحقول المتغيرة فقط) و`context.cfg`. لا يمكن إلا للعملاء ذوي الامتيازات تشغيل أحداث التصحيح.

**أحداث Compaction**: يتضمن `session:compact:before` القيمتين `messageCount` و`tokenCount`. ويضيف `session:compact:after` القيم `compactedCount` و`summaryLength` و`tokensBefore` و`tokensAfter`.

## اكتشاف الخطافات

يتم اكتشاف الخطافات من هذه الأدلة، بترتيب تصاعدي في أولوية التجاوز:

1. **الخطافات المضمنة**: تأتي مع OpenClaw
2. **خطافات Plugin**: خطافات مجمعة داخل plugins المثبتة
3. **الخطافات المُدارة**: `~/.openclaw/hooks/` (مثبتة من المستخدم، ومشتركة بين مساحات العمل). تشترك الأدلة الإضافية من `hooks.internal.load.extraDirs` في هذه الأولوية.
4. **خطافات مساحة العمل**: `<workspace>/hooks/` (لكل وكيل على حدة، ومعطلة افتراضيًا حتى يتم تفعيلها صراحة)

يمكن لخطافات مساحة العمل إضافة أسماء خطافات جديدة، لكنها لا تستطيع تجاوز الخطافات المضمنة أو المُدارة أو المقدمة من plugin إذا كان لها الاسم نفسه.

يتجاوز Gateway اكتشاف الخطافات الداخلية عند بدء التشغيل إلى أن يتم تهيئة الخطافات الداخلية. فعّل خطافًا مضمنًا أو مُدارًا باستخدام `openclaw hooks enable <name>`، أو ثبّت حزمة خطافات، أو اضبط `hooks.internal.enabled=true` للاشتراك. عند تفعيل خطاف واحد مسمّى، يحمّل Gateway معالج ذلك الخطاف فقط؛ أما `hooks.internal.enabled=true`، وأدلة الخطافات الإضافية، والمعالجات القديمة، فتفعّل الاكتشاف الواسع.

### حزم الخطافات

حزم الخطافات هي حزم npm تصدّر الخطافات عبر `openclaw.hooks` في `package.json`. ثبّتها باستخدام:

```bash
openclaw plugins install <path-or-spec>
```

تقتصر مواصفات npm على السجل فقط (اسم الحزمة مع إصدار محدد اختياريًا أو dist-tag). يتم رفض مواصفات Git/URL/file ونطاقات semver.

## الخطافات المضمنة

| الخطاف                | الأحداث                        | ما الذي يفعله                                         |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | يحفظ سياق الجلسة في `<workspace>/memory/`             |
| bootstrap-extra-files | `agent:bootstrap`              | يحقن ملفات bootstrap إضافية من أنماط glob             |
| command-logger        | `command`                      | يسجل جميع الأوامر في `~/.openclaw/logs/commands.log`  |
| boot-md               | `gateway:startup`              | يشغّل `BOOT.md` عند بدء Gateway                       |

لتفعيل أي خطاف مضمن:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### تفاصيل session-memory

يستخرج آخر 15 رسالة من المستخدم/المساعد، وينشئ slug وصفيًا لاسم الملف عبر LLM، ثم يحفظه في `<workspace>/memory/YYYY-MM-DD-slug.md`. يتطلب تهيئة `workspace.dir`.

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

يتم حل المسارات نسبةً إلى مساحة العمل. لا يتم تحميل سوى أسماء ملفات bootstrap الأساسية المعروفة (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### تفاصيل command-logger

يسجل كل أمر مائل في `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### تفاصيل boot-md

يشغّل `BOOT.md` من مساحة العمل النشطة عند بدء Gateway.

## خطافات Plugin

يمكن لـ plugins تسجيل الخطافات عبر Plugin SDK لتحقيق تكامل أعمق: اعتراض استدعاءات الأدوات، وتعديل المطالبات، والتحكم في تدفق الرسائل، وغير ذلك. يوفّر Plugin SDK عدد 28 خطافًا تغطي تحليل النموذج، ودورة حياة الوكيل، وتدفق الرسائل، وتنفيذ الأدوات، وتنسيق الوكلاء الفرعيين، ودورة حياة Gateway.

للاطلاع على المرجع الكامل لخطافات plugin، بما في ذلك `before_tool_call` و`before_agent_reply` و`before_install` وجميع خطافات plugin الأخرى، راجع [Plugin Architecture](/ar/plugins/architecture#provider-runtime-hooks).

## التهيئة

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
لا يزال تنسيق التهيئة القديم `hooks.internal.handlers` المدعوم بالمصفوفات مدعومًا للتوافق مع الإصدارات السابقة، لكن ينبغي للخطافات الجديدة استخدام النظام القائم على الاكتشاف.
</Note>

## مرجع CLI

```bash
# عرض جميع الخطافات (أضف --eligible أو --verbose أو --json)
openclaw hooks list

# عرض معلومات مفصلة عن خطاف
openclaw hooks info <hook-name>

# عرض ملخص الأهلية
openclaw hooks check

# تفعيل/تعطيل
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## أفضل الممارسات

- **أبقِ المعالجات سريعة.** تعمل الخطافات أثناء معالجة الأوامر. شغّل الأعمال الثقيلة في الخلفية بطريقة fire-and-forget باستخدام `void processInBackground(event)`.
- **تعامل مع الأخطاء بسلاسة.** ضع العمليات المحفوفة بالمخاطر داخل try/catch؛ ولا ترمِ الأخطاء حتى تتمكن المعالجات الأخرى من العمل.
- **رشّح الأحداث مبكرًا.** أعد مباشرة إذا لم يكن نوع/إجراء الحدث ذا صلة.
- **استخدم مفاتيح أحداث محددة.** فضّل `"events": ["command:new"]` على `"events": ["command"]` لتقليل الحمل.

## استكشاف الأخطاء وإصلاحها

### لم يتم اكتشاف الخطاف

```bash
# التحقق من بنية الدليل
ls -la ~/.openclaw/hooks/my-hook/
# يجب أن يظهر: HOOK.md, handler.ts

# عرض جميع الخطافات المكتشفة
openclaw hooks list
```

### الخطاف غير مؤهل

```bash
openclaw hooks info my-hook
```

تحقق من وجود ملفات تنفيذية مفقودة (PATH)، أو متغيرات بيئة، أو قيم إعدادات، أو توافق نظام التشغيل.

### الخطاف لا يعمل

1. تحقق من أن الخطاف مفعّل: `openclaw hooks list`
2. أعد تشغيل عملية Gateway حتى تُعاد تحميل الخطافات.
3. تحقق من سجلات Gateway: `./scripts/clawlog.sh | grep hook`

## ذو صلة

- [مرجع CLI: hooks](/cli/hooks)
- [Webhooks](/ar/automation/cron-jobs#webhooks)
- [Plugin Architecture](/ar/plugins/architecture#provider-runtime-hooks) — المرجع الكامل لخطافات plugin
- [Configuration](/ar/gateway/configuration-reference#hooks)
