---
read_when:
    - تحتاج إلى فحص مخرجات النموذج الخام لرصد تسرّب الاستدلال
    - تريد تشغيل Gateway في وضع المراقبة أثناء التكرار
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، وتدفّقات النموذج الخام، وتتبع تسرّب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-04-23T07:25:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# تصحيح الأخطاء

تغطي هذه الصفحة مساعدات تصحيح الأخطاء لمخرجات البث، خاصة عندما
يمزج مزوّد ما الاستدلال في النص العادي.

## تجاوزات تصحيح الأخطاء في وقت التشغيل

استخدم `/debug` في الدردشة لضبط تجاوزات إعداد **خاصة بوقت التشغيل فقط** (في الذاكرة، لا على القرص).
يكون `/debug` معطّلًا افتراضيًا؛ فعّله عبر `commands.debug: true`.
وهذا مفيد عندما تحتاج إلى تبديل إعدادات نادرة من دون تعديل `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يقوم `/debug reset` بمسح جميع التجاوزات والعودة إلى الإعداد المخزَّن على القرص.

## مخرجات تتبّع الجلسة

استخدم `/trace` عندما تريد رؤية أسطر التتبع/تصحيح الأخطاء الخاصة بـ Plugin في جلسة واحدة
من دون تشغيل الوضع المفصل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات Plugins مثل ملخصات تصحيح أخطاء Active Memory.
واستمر في استخدام `/verbose` لمخرجات الحالة/الأدوات المفصلة العادية، واستمر في استخدام
`/debug` لتجاوزات الإعداد الخاصة بوقت التشغيل فقط.

## توقيت تصحيح أخطاء CLI المؤقت

يحتفظ OpenClaw بالملف `src/cli/debug-timing.ts` كمساعد صغير من أجل
التحقيق المحلي. وهو غير موصول عمدًا ببدء CLI، أو توجيه الأوامر،
أو أي أمر افتراضيًا. استخدمه فقط أثناء تصحيح خطأ في أمر بطيء، ثم
أزل الاستيراد والمقاطع قبل اعتماد تغيير السلوك.

استخدم هذا عندما يكون أمر ما بطيئًا وتحتاج إلى تفصيل سريع للمراحل قبل
تقرير ما إذا كنت ستستخدم محلل CPU أو ستصلح نظامًا فرعيًا محددًا.

### إضافة مقاطع مؤقتة

أضف المساعد قرب الشيفرة التي تتحقق منها. على سبيل المثال، أثناء تصحيح
`openclaw models list`، قد يبدو التصحيح المؤقت في
`src/commands/models/list.list-command.ts` كما يلي:

```ts
// للتصحيح المؤقت فقط. أزل هذا قبل الاعتماد.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

إرشادات:

- ابدأ أسماء المراحل المؤقتة بالبادئة `debug:`.
- أضف بضعة مقاطع فقط حول الأقسام المشتبه في بطئها.
- فضّل المراحل العامة مثل `registry` أو `auth_store` أو `rows` بدلًا من
  أسماء المساعدات.
- استخدم `time()` للعمل المتزامن و`timeAsync()` للوعود.
- حافظ على نظافة stdout. يكتب المساعد إلى stderr، لذلك يظل خرج JSON الخاص بالأمر قابلًا للتحليل.
- أزل الاستيرادات والمقاطع المؤقتة قبل فتح PR الإصلاح النهائي.
- ضمّن خرج التوقيت أو ملخصًا قصيرًا في المشكلة أو PR الذي يشرح التحسين.

### التشغيل مع خرج مقروء

الوضع المقروء هو الأفضل لتصحيح الأخطاء المباشر:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

مثال على خرج من تحقيق مؤقت في `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

نتائج مستخلصة من هذا الخرج:

| المرحلة                                   |      الزمن | ما الذي تعنيه                                                                                      |
| ----------------------------------------- | ---------: | -------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`            |      20.3s | تحميل مخزن auth-profile هو أكبر تكلفة ويجب التحقق منه أولًا.                                      |
| `debug:models:list:ensure_models_json`    |       5.0s | مزامنة `models.json` مكلفة بما يكفي لفحص التخزين المؤقت أو شروط التخطي.                           |
| `debug:models:list:load_model_registry`   |       5.9s | إنشاء السجل وعمل توفر المزوّدات تكاليف ذات شأن أيضًا.                                             |
| `debug:models:list:read_registry_models`  |       2.4s | قراءة جميع نماذج السجل ليست مجانية وقد تكون مهمة مع `--all`.                                      |
| مراحل إلحاق الصفوف                        | 3.2s إجمالًا | لا يزال بناء خمسة صفوف معروضة يستغرق عدة ثوانٍ، لذا يستحق مسار التصفية فحصًا أدق.                |
| `debug:models:list:print_model_table`     |       0ms  | العرض ليس عنق الزجاجة.                                                                             |

تكفي هذه النتائج لتوجيه التصحيح التالي من دون إبقاء شيفرة التوقيت في
مسارات الإنتاج.

### التشغيل مع خرج JSON

استخدم وضع JSON عندما تريد حفظ بيانات التوقيت أو مقارنتها:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

كل سطر في stderr هو كائن JSON واحد:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### التنظيف قبل الاعتماد

قبل فتح PR النهائي:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

يجب ألا يعيد الأمر أي مواقع استدعاء مؤقتة للأدوات إلا إذا كان PR
يضيف صراحةً سطح تشخيصات دائم. أما في إصلاحات الأداء العادية،
فاحتفظ فقط بتغيير السلوك، والاختبارات، وملاحظة قصيرة تتضمن أدلة التوقيت.

بالنسبة إلى النقاط الساخنة الأعمق في CPU، استخدم profiling في Node ‏(`--cpu-prof`) أو أداة
profiling خارجية بدلًا من إضافة المزيد من مغلفات التوقيت.

## وضع مراقبة Gateway

للتكرار السريع، شغّل Gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

يُعيَّن هذا إلى:

```bash
node scripts/watch-node.mjs gateway --force
```

يعيد المراقب التشغيل عند تغيّر الملفات ذات الصلة بالبناء ضمن `src/`، وملفات مصدر الامتدادات،
والملف `package.json` الخاص بالامتدادات وبيانات `openclaw.plugin.json` الوصفية، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تؤدي تغييرات بيانات الامتدادات الوصفية إلى إعادة تشغيل
gateway من دون فرض إعادة build لـ `tsdown`؛ أما تغييرات المصدر والإعداد فما تزال
تعيد بناء `dist` أولًا.

أضف أي علامات CLI خاصة بـ gateway بعد `gateway:watch` وسيتم تمريرها
في كل إعادة تشغيل. كما أن إعادة تشغيل أمر المراقبة نفسه لمجموعة المستودع/العلامات نفسها
تستبدل الآن المراقب الأقدم بدلًا من ترك عمليات أصلية مكررة للمراقب.

## ملف dev الشخصي + Gateway للتطوير (`--dev`)

استخدم ملف dev الشخصي لعزل الحالة وتشغيل إعداد آمن وقابل للتخلص منه
لتصحيح الأخطاء. توجد علامتا `--dev` **اثنتان**:

- **العلامة العامة `--dev` (ملف شخصي):** تعزل الحالة تحت `~/.openclaw-dev` وتضبط
  منفذ gateway افتراضيًا على `19001` (وتتغير المنافذ المشتقة معه).
- **`gateway --dev`:** يوجّه Gateway إلى إنشاء إعداد +
  مساحة عمل افتراضية تلقائيًا عند غيابهما (وتخطي `BOOTSTRAP.md`).

التدفق الموصى به (ملف dev الشخصي + bootstrap للتطوير):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

إذا لم يكن لديك تثبيت عام بعد، فشغّل CLI عبر `pnpm openclaw ...`.

ما الذي يفعله هذا:

1. **عزل الملف الشخصي** (العلامة العامة `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (ويتحول منفذ browser/canvas تبعًا لذلك)

2. **bootstrap للتطوير** (`gateway --dev`)
   - يكتب إعدادًا أدنى إذا كان مفقودًا (`gateway.mode=local`، وربط loopback).
   - يضبط `agent.workspace` على مساحة عمل dev.
   - يضبط `agent.skipBootstrap=true` (من دون `BOOTSTRAP.md`).
   - يزرع ملفات مساحة العمل إذا كانت مفقودة:
     `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md`.
   - الهوية الافتراضية: **C3‑PO** ‏(روبوت بروتوكول).
   - يتخطى مزوّدي القنوات في وضع dev ‏(`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة الضبط (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

ملاحظة: تمثل `--dev` علامة ملف شخصي **عامة** وقد تلتهمها بعض المشغلات.
إذا احتجت إلى كتابتها صراحةً، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

تقوم `--reset` بمسح الإعداد، وبيانات الاعتماد، والجلسات، ومساحة عمل dev (باستخدام
`trash`، لا `rm`)، ثم تعيد إنشاء إعداد dev الافتراضي.

نصيحة: إذا كانت Gateway غير dev تعمل بالفعل (عبر launchd/systemd)، فأوقفها أولًا:

```bash
openclaw gateway stop
```

## تسجيل البث الخام (OpenClaw)

يمكن لـ OpenClaw تسجيل **البث الخام للمساعد** قبل أي ترشيح/تنسيق.
وهذه أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل على هيئة فروق نصية صريحة
(أو ككتل تفكير منفصلة).

فعّله عبر CLI:

```bash
pnpm gateway:watch --raw-stream
```

تجاوز اختياري للمسار:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

متغيرات env المكافئة:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

الملف الافتراضي:

`~/.openclaw/logs/raw-stream.jsonl`

## تسجيل القطع الخام (pi-mono)

لالتقاط **قطع OpenAI-compat الخام** قبل تحليلها إلى كتل،
يوفّر pi-mono مسجّلًا منفصلًا:

```bash
PI_RAW_STREAM=1
```

مسار اختياري:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

الملف الافتراضي:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> ملاحظة: لا يصدر هذا إلا من العمليات التي تستخدم مزوّد
> `openai-completions` في pi-mono.

## ملاحظات الأمان

- قد تتضمن سجلات البث الخام المطالبات الكاملة، ومخرجات الأدوات، وبيانات المستخدم.
- احتفظ بالسجلات محليًا واحذفها بعد تصحيح الأخطاء.
- إذا شاركت السجلات، فاحذف الأسرار وPII أولًا.
