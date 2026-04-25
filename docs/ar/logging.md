---
read_when:
    - أنت بحاجة إلى نظرة عامة سهلة للمبتدئين حول التسجيل
    - أنت تريد تهيئة مستويات السجل أو تنسيقاته
    - أنت تستكشف الأخطاء وإصلاحها وتحتاج إلى العثور على السجلات بسرعة
summary: 'نظرة عامة على التسجيل: سجلات الملفات، ومخرجات وحدة التحكم، وتتبع CLI، وControl UI'
title: نظرة عامة على التسجيل
x-i18n:
    generated_at: "2026-04-25T13:50:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# التسجيل

يحتوي OpenClaw على سطحين رئيسيين للسجلات:

- **سجلات الملفات** (JSON lines) التي يكتبها Gateway.
- **مخرجات وحدة التحكم** المعروضة في الطرفيات وواجهة Gateway Debug UI.

يقوم تبويب **Logs** في Control UI بتتبع ملف سجل الـ Gateway. تشرح هذه الصفحة مكان وجود
السجلات، وكيفية قراءتها، وكيفية تهيئة مستويات السجل وتنسيقاته.

## مكان وجود السجلات

يكتب Gateway افتراضيًا ملف سجل متجددًا تحت:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

ويستخدم التاريخ المنطقة الزمنية المحلية لمضيف Gateway.

يمكنك تجاوز ذلك في `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## كيفية قراءة السجلات

### CLI: تتبع مباشر (موصى به)

استخدم CLI لتتبع ملف سجل Gateway عبر RPC:

```bash
openclaw logs --follow
```

خيارات حالية مفيدة:

- `--local-time`: عرض الطوابع الزمنية بمنطقتك الزمنية المحلية
- `--url <url>` / `--token <token>` / `--timeout <ms>`: علامات Gateway RPC القياسية
- `--expect-final`: علامة انتظار الاستجابة النهائية لـ RPC المدعوم بالوكيل (مقبولة هنا عبر طبقة العميل المشتركة)

أوضاع الإخراج:

- **جلسات TTY**: أسطر سجلات جميلة وملونة ومهيكلة.
- **الجلسات غير TTY**: نص عادي.
- `--json`: JSON محدد بالأسطر (حدث سجل واحد في كل سطر).
- `--plain`: فرض النص العادي في جلسات TTY.
- `--no-color`: تعطيل ألوان ANSI.

عند تمرير `--url` صريح، لا يطبق CLI تلقائيًا بيانات الاعتماد من التهيئة أو
البيئة؛ أضف `--token` بنفسك إذا كان Gateway الهدف
يتطلب مصادقة.

في وضع JSON، يصدر CLI كائنات موسومة بالحقل `type`:

- `meta`: بيانات تعريف البث (الملف، والمؤشر، والحجم)
- `log`: إدخال سجل محلل
- `notice`: تلميحات الاقتطاع / التدوير
- `raw`: سطر سجل غير محلل

إذا طلب Gateway المحلي على local loopback الاقتران، يعود `openclaw logs` إلى
ملف السجل المحلي المهيأ تلقائيًا. ولا تستخدم أهداف `--url` الصريحة هذا البديل.

إذا كان Gateway غير قابل للوصول، يطبع CLI تلميحًا قصيرًا لتشغيل:

```bash
openclaw doctor
```

### Control UI (الويب)

يقوم تبويب **Logs** في Control UI بتتبع الملف نفسه باستخدام `logs.tail`.
راجع [/web/control-ui](/ar/web/control-ui) لمعرفة كيفية فتحه.

### سجلات القناة فقط

لتصفية نشاط القناة (WhatsApp/Telegram/إلخ)، استخدم:

```bash
openclaw channels logs --channel whatsapp
```

## تنسيقات السجل

### سجلات الملفات (JSONL)

كل سطر في ملف السجل هو كائن JSON. ويقوم CLI وControl UI بتحليل هذه
الإدخالات لعرض مخرجات مهيكلة (الوقت، والمستوى، والنظام الفرعي، والرسالة).

### مخرجات وحدة التحكم

تكون سجلات وحدة التحكم **مدركة لـ TTY** ومهيأة لتسهيل القراءة:

- بادئات الأنظمة الفرعية (مثل `gateway/channels/whatsapp`)
- تلوين المستويات (info/warn/error)
- وضع compact أو JSON اختياري

يتم التحكم في تنسيق وحدة التحكم بواسطة `logging.consoleStyle`.

### سجلات Gateway WebSocket

يحتوي `openclaw gateway` أيضًا على تسجيل WebSocket على مستوى البروتوكول لحركة RPC:

- الوضع العادي: النتائج المهمة فقط (الأخطاء، وأخطاء التحليل، والاستدعاءات البطيئة)
- `--verbose`: كل حركة الطلب/الاستجابة
- `--ws-log auto|compact|full`: اختر نمط العرض المفصل
- `--compact`: اسم مستعار لـ `--ws-log compact`

أمثلة:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## تهيئة التسجيل

توجد جميع إعدادات التسجيل تحت `logging` في `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### مستويات السجل

- `logging.level`: مستوى **سجلات الملفات** (JSONL).
- `logging.consoleLevel`: مستوى verbosity الخاص **بوحدة التحكم**.

يمكنك تجاوز كليهما عبر متغير البيئة **`OPENCLAW_LOG_LEVEL`** (مثل `OPENCLAW_LOG_LEVEL=debug`). ولهذا المتغير أولوية على ملف التهيئة، لذا يمكنك رفع درجة verbosity لتشغيل واحد من دون تعديل `openclaw.json`. ويمكنك أيضًا تمرير خيار CLI العام **`--log-level <level>`** (على سبيل المثال، `openclaw --log-level debug gateway run`) الذي يتجاوز متغير البيئة لهذا الأمر.

يؤثر `--verbose` فقط في مخرجات وحدة التحكم ودرجة verbosity الخاصة بسجل WS؛ ولا يغيّر
مستويات سجلات الملفات.

### أنماط وحدة التحكم

`logging.consoleStyle`:

- `pretty`: مناسب للبشر، وملون، ومع طوابع زمنية.
- `compact`: مخرجات أكثر إحكامًا (الأفضل للجلسات الطويلة).
- `json`: JSON في كل سطر (لمعالجات السجلات).

### التنقيح

يمكن أن تقوم ملخصات الأدوات بتنقيح الرموز الحساسة قبل أن تصل إلى وحدة التحكم:

- `logging.redactSensitive`: ‏`off` | `tools` (الافتراضي: `tools`)
- `logging.redactPatterns`: قائمة سلاسل regex لتجاوز المجموعة الافتراضية

يؤثر التنقيح في **مخرجات وحدة التحكم فقط** ولا يغير سجلات الملفات.

## التشخيصات + OpenTelemetry

التشخيصات هي أحداث مهيكلة وقابلة للقراءة آليًا لتشغيلات النماذج **و**
Telemetry تدفق الرسائل (Webhook، والاصطفاف، وحالة الجلسة). وهي **لا**
تستبدل السجلات؛ بل توجد لتغذية المقاييس، وtraces، وغير ذلك من المصدّرات.

تُصدر أحداث التشخيص داخل العملية، ولكن لا تُرفق المصدّرات إلا عندما
تكون التشخيصات + Plugin المصدّر مفعّلة.

### OpenTelemetry مقابل OTLP

- **OpenTelemetry (OTel)**: نموذج البيانات + SDKs الخاصة بـ traces، والمقاييس، والسجلات.
- **OTLP**: بروتوكول النقل المستخدم لتصدير بيانات OTel إلى مُجمِّع/واجهة خلفية.
- يصدّر OpenClaw عبر **OTLP/HTTP (protobuf)** اليوم.

### الإشارات المُصدَّرة

- **المقاييس**: عدادات + مخططات تكرارية (استخدام الرموز، وتدفق الرسائل، والاصطفاف).
- **Traces**: spans لاستخدام النموذج + معالجة Webhook/الرسائل.
- **السجلات**: تُصدّر عبر OTLP عند تمكين `diagnostics.otel.logs`. وقد يكون
  حجم السجل مرتفعًا؛ لذا ضع `logging.level` ومرشحات المصدّر في الاعتبار.

### كتالوج أحداث التشخيص

استخدام النموذج:

- `model.usage`: الرموز، والتكلفة، والمدة، والسياق، والمزوّد/النموذج/القناة، ومعرّفات الجلسات.

تدفق الرسائل:

- `webhook.received`: دخول Webhook لكل قناة.
- `webhook.processed`: معالجة Webhook + المدة.
- `webhook.error`: أخطاء معالج Webhook.
- `message.queued`: إدراج الرسالة في طابور المعالجة.
- `message.processed`: النتيجة + المدة + خطأ اختياري.
- `message.delivery.started`: بدء محاولة التسليم الصادر.
- `message.delivery.completed`: انتهاء محاولة التسليم الصادر + المدة/عدد النتائج.
- `message.delivery.error`: فشل محاولة التسليم الصادر + المدة/فئة الخطأ المحدودة.

الطابور + الجلسة:

- `queue.lane.enqueue`: إدراج مسار طابور الأوامر + العمق.
- `queue.lane.dequeue`: إزالة من مسار طابور الأوامر + وقت الانتظار.
- `session.state`: انتقال حالة الجلسة + السبب.
- `session.stuck`: تحذير جلسة عالقة + العمر.
- `run.attempt`: بيانات تعريف إعادة المحاولة/المحاولة.
- `diagnostic.heartbeat`: عدادات مجمعة (webhooks/queue/session).

Exec:

- `exec.process.completed`: نتيجة عملية exec النهائية، والمدة، والهدف، والوضع،
  ورمز الخروج، ونوع الفشل. ولا يتم
  تضمين نص الأمر وأدلة العمل.

### تمكين التشخيصات (بدون مصدّر)

استخدم هذا إذا كنت تريد إتاحة أحداث التشخيص للـ Plugins أو المصارف المخصصة:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### علامات التشخيص (سجلات مستهدفة)

استخدم العلامات لتشغيل سجلات تصحيح إضافية وموجهة من دون رفع `logging.level`.
العلامات غير حساسة لحالة الأحرف وتدعم أحرفًا عامة (مثل `telegram.*` أو `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

تجاوز بيئي (لمرة واحدة):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

ملاحظات:

- تذهب سجلات العلامات إلى ملف السجل القياسي (نفس `logging.file`).
- لا يزال الإخراج منقحًا وفقًا لـ `logging.redactSensitive`.
- الدليل الكامل: [/diagnostics/flags](/ar/diagnostics/flags).

### التصدير إلى OpenTelemetry

يمكن تصدير التشخيصات عبر Plugin ‏`diagnostics-otel` ‏(OTLP/HTTP). ويعمل هذا
مع أي مُجمّع/واجهة خلفية OpenTelemetry تقبل OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

ملاحظات:

- يمكنك أيضًا تمكين Plugin باستخدام `openclaw plugins enable diagnostics-otel`.
- يدعم `protocol` حاليًا `http/protobuf` فقط. ويتم تجاهل `grpc`.
- تتضمن المقاييس استخدام الرموز، والتكلفة، وحجم السياق، ومدة التشغيل، وعدادات/مخططات تدفق الرسائل
  (webhooks، والاصطفاف، وحالة الجلسة، وعمق/انتظار الطابور).
- يمكن تبديل traces/المقاييس عبر `traces` / `metrics` (الافتراضي: مفعّل). وتتضمن Traces
  spans استخدام النموذج بالإضافة إلى spans معالجة Webhook/الرسائل عند التمكين.
- لا يتم تصدير محتوى النموذج/الأداة الخام افتراضيًا. استخدم
  `diagnostics.otel.captureContent` فقط عندما تكون سياسة المُجمّع والاحتفاظ لديك
  معتمدة لنصوص التلقين أو الاستجابة أو الأداة أو system prompt.
- اضبط `headers` عندما يتطلب المُجمّع مصادقة.
- متغيرات البيئة المدعومة: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  و`OTEL_SERVICE_NAME`, و`OTEL_EXPORTER_OTLP_PROTOCOL`.
- اضبط `OPENCLAW_OTEL_PRELOADED=1` عندما يكون preload آخر أو عملية مضيف قد
  سجلت بالفعل OpenTelemetry SDK العام. وفي هذا الوضع لا يبدأ Plugin
  SDK الخاص به ولا يغلقه، لكنه لا يزال يربط مستمعي تشخيص OpenClaw
  ويحترم `diagnostics.otel.traces` و`metrics` و`logs`.

### المقاييس المُصدَّرة (الأسماء + الأنواع)

استخدام النموذج:

- `openclaw.tokens` (عداد، السمات: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (عداد، السمات: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (مخطط تكراري، السمات: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (مخطط تكراري، السمات: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

تدفق الرسائل:

- `openclaw.webhook.received` (عداد، السمات: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (عداد، السمات: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مخطط تكراري، السمات: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (عداد، السمات: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (عداد، السمات: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (مخطط تكراري، السمات: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (عداد، السمات: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مخطط تكراري، السمات:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

الطوابير + الجلسات:

- `openclaw.queue.lane.enqueue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.depth` (مخطط تكراري، السمات: `openclaw.lane` أو
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مخطط تكراري، السمات: `openclaw.lane`)
- `openclaw.session.state` (عداد، السمات: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (عداد، السمات: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (مخطط تكراري، السمات: `openclaw.state`)
- `openclaw.run.attempt` (عداد، السمات: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (مخطط تكراري، السمات: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### spans المُصدَّرة (الأسماء + السمات الأساسية)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` ‏(`input/output/cache_read/cache_write/total`)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

عند تمكين التقاط المحتوى صراحةً، يمكن أن تتضمن spans الخاصة بالنموذج/الأداة أيضًا
سمات `openclaw.content.*` محدودة ومنقحة لفئات المحتوى المحددة
التي وافقت على تضمينها.

### أخذ العينات + التفريغ

- أخذ عينات trace: ‏`diagnostics.otel.sampleRate` ‏(0.0–1.0، للجذور فقط).
- فاصل تصدير المقاييس: ‏`diagnostics.otel.flushIntervalMs` ‏(حد أدنى 1000ms).

### ملاحظات البروتوكول

- يمكن ضبط نقاط نهاية OTLP/HTTP عبر `diagnostics.otel.endpoint` أو
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- إذا كانت نقطة النهاية تحتوي بالفعل على `/v1/traces` أو `/v1/metrics`، فسيتم استخدامها كما هي.
- إذا كانت نقطة النهاية تحتوي بالفعل على `/v1/logs`، فسيتم استخدامها كما هي للسجلات.
- يعيد `OPENCLAW_OTEL_PRELOADED=1` استخدام OpenTelemetry SDK مسجل خارجيًا
  للـ traces/المقاييس بدلًا من بدء NodeSDK مملوك لـ Plugin.
- يفعّل `diagnostics.otel.logs` تصدير سجلات OTLP لمخرجات المسجل الرئيسي.

### سلوك تصدير السجل

- تستخدم سجلات OTLP السجلات المهيكلة نفسها المكتوبة إلى `logging.file`.
- احترم `logging.level` ‏(مستوى سجل الملف). ولا ينطبق تنقيح وحدة التحكم
  على سجلات OTLP.
- ينبغي للتثبيتات ذات الحجم الكبير أن تفضل أخذ العينات/التصفية في مُجمِّع OTLP.

## نصائح لاستكشاف الأخطاء وإصلاحها

- **يتعذر الوصول إلى Gateway؟** شغّل `openclaw doctor` أولًا.
- **السجلات فارغة؟** تحقق من أن Gateway يعمل ويكتب إلى مسار الملف
  الموجود في `logging.file`.
- **تحتاج إلى مزيد من التفاصيل؟** اضبط `logging.level` على `debug` أو `trace` ثم أعد المحاولة.

## ذو صلة

- [الأساسيات الداخلية لتسجيل Gateway](/ar/gateway/logging) — أنماط سجل WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [التشخيصات](/ar/gateway/configuration-reference#diagnostics) — تصدير OpenTelemetry وتهيئة cache trace
