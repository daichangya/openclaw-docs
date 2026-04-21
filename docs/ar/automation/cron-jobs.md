---
read_when:
    - جدولة المهام الخلفية أو عمليات التنبيه
    - ربط المشغلات الخارجية (عمليات Webhook وGmail) بـ OpenClaw
    - اتخاذ قرار بين Heartbeat وCron للمهام المجدولة
summary: المهام المجدولة، وعمليات Webhook، ومشغلات Gmail PubSub لجدولة Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-04-21T07:18:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# المهام المجدولة (Cron)

Cron هو المجدول المدمج في Gateway. فهو يحتفظ بالمهام، ويوقظ العامل في الوقت المناسب، ويمكنه إعادة تسليم المخرجات إلى قناة دردشة أو نقطة نهاية Webhook.

## البدء السريع

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## كيف يعمل cron

- يعمل Cron **داخل** عملية Gateway (وليس داخل النموذج).
- تستمر تعريفات المهام في `~/.openclaw/cron/jobs.json` بحيث لا تؤدي عمليات إعادة التشغيل إلى فقدان الجداول.
- تستمر حالة التنفيذ وقت التشغيل بجواره في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتعقب تعريفات cron في git، فتتبع `jobs.json` وأضف `jobs-state.json` إلى gitignore.
- بعد هذا الفصل، تستطيع الإصدارات الأقدم من OpenClaw قراءة `jobs.json`، لكنها قد تتعامل مع المهام على أنها جديدة لأن حقول وقت التشغيل أصبحت الآن موجودة في `jobs-state.json`.
- تنشئ جميع عمليات تنفيذ cron سجلات [مهام خلفية](/ar/automation/tasks).
- تُحذف المهام أحادية التشغيل (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- عند اكتمال التشغيل، تقوم عمليات cron المعزولة بإغلاق علامات تبويب/عمليات المتصفح المتعقبة لجلسة `cron:<jobId>` الخاصة بها بأفضل جهد، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- تحمي عمليات cron المعزولة أيضًا من ردود الإقرار القديمة. إذا كانت
  النتيجة الأولى مجرد تحديث حالة مؤقت (`on it`, `pulling everything
together`، وتلميحات مشابهة) ولم يعد أي تشغيل فرعي تابع
  مسؤولًا عن الإجابة النهائية، فسيقوم OpenClaw بإعادة الطلب مرة واحدة للحصول على
  النتيجة الفعلية قبل التسليم.

<a id="maintenance"></a>

تسوية المهام الخاصة بـ cron مملوكة لوقت التشغيل: تظل مهمة cron النشطة حية ما دام
وقت تشغيل cron لا يزال يتعقب تلك المهمة على أنها قيد التشغيل، حتى إذا كان لا يزال هناك صف جلسة فرعية قديم.
وبمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي مهلة السماح البالغة 5 دقائق، يمكن للصيانة
وضع علامة `lost` على المهمة.

## أنواع الجداول

| النوع    | علم CLI   | الوصف                                                      |
| ------- | --------- | ---------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني أحادي التشغيل (ISO 8601 أو نسبي مثل `20m`)      |
| `every` | `--every` | فاصل زمني ثابت                                             |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري          |

تُعامل الطوابع الزمنية التي لا تحتوي على منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة حسب التوقيت المحلي الفعلي.

تُوزَّع التعبيرات المتكررة التي تقع في بداية الساعة تلقائيًا بفارق يصل إلى 5 دقائق لتقليل ارتفاعات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون كل من حقلي يوم الشهر ويوم الأسبوع غير عامين، فإن croner يطابق عندما يطابق **أي** من الحقلين — وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

سيؤدي هذا إلى التشغيل تقريبًا 5–6 مرات في الشهر بدلًا من 0–1 مرة في الشهر. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لفرض الشرطين معًا، استخدم معدِّل يوم الأسبوع `+` الخاص بـ Croner (`0 9 15 * +1`) أو قم بالجدولة باستخدام أحد الحقلين وطبّق الحماية على الآخر داخل موجّه المهمة أو أمرها.

## أنماط التنفيذ

| النمط           | قيمة `--session`     | يعمل في                  | الأنسب لـ                        |
| --------------- | -------------------- | ------------------------ | -------------------------------- |
| الجلسة الرئيسية | `main`               | دورة Heartbeat التالية   | التذكيرات، وأحداث النظام         |
| معزول           | `isolated`           | `cron:<jobId>` مخصصة     | التقارير، والأعمال الخلفية       |
| الجلسة الحالية  | `current`            | مرتبط وقت الإنشاء        | العمل المتكرر المعتمد على السياق |
| جلسة مخصصة      | `session:custom-id`  | جلسة مسماة مستمرة        | سير العمل الذي يبني على السجل    |

تقوم مهام **الجلسة الرئيسية** بإدراج حدث نظام اختياريًا وإيقاظ heartbeat اختياريًا (`--wake now` أو `--wake next-heartbeat`). وتشغّل المهام **المعزولة** دورة عامل مخصصة بجلسة جديدة. أما **الجلسات المخصصة** (`session:xxx`) فتحتفظ بالسياق عبر عمليات التشغيل، ما يتيح تدفقات عمل مثل الاجتماعات اليومية المختصرة التي تبني على الملخصات السابقة.

بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيف المتصفح بأفضل جهد لتلك الجلسة الخاصة بـ cron. ويتم تجاهل إخفاقات التنظيف حتى تظل نتيجة cron الفعلية هي الفائزة.

عندما تنسق عمليات cron المعزولة عاملات فرعيات، يفضّل التسليم أيضًا
مخرجات التابع النهائية على النص المؤقت القديم للأصل. وإذا كانت التوابع لا تزال
قيد التشغيل، فسيقوم OpenClaw بكبت هذا التحديث الجزئي من الأصل بدلًا من إعلانه.

### خيارات الحمولة للمهام المعزولة

- `--message`: نص الموجّه (مطلوب للمهام المعزولة)
- `--model` / `--thinking`: تجاوزات النموذج ومستوى التفكير
- `--light-context`: تخطي حقن ملف تهيئة مساحة العمل
- `--tools exec,read`: تقييد الأدوات التي يمكن للمهمة استخدامها

يستخدم `--model` النموذج المسموح المحدد لتلك المهمة. وإذا لم يكن النموذج المطلوب
مسموحًا به، فسيسجل cron تحذيرًا ويعود إلى اختيار النموذج الافتراضي/نموذج العامل
لتلك المهمة بدلًا من ذلك. وتظل سلاسل الرجوع الاحتياطي المكوّنة مطبقة، لكن تجاوز
النموذج البسيط من دون قائمة رجوع احتياطي صريحة لكل مهمة لم يعد يضيف النموذج
الأساسي للعامل كهدف إعادة محاولة مخفي إضافي.

ترتيب أولوية اختيار النموذج للمهام المعزولة هو:

1. تجاوز نموذج Gmail hook (عندما تكون العملية قد جاءت من Gmail وكان هذا التجاوز مسموحًا)
2. `model` في حمولة كل مهمة
3. تجاوز نموذج جلسة cron المخزن
4. اختيار النموذج الافتراضي/نموذج العامل

يتبع الوضع السريع أيضًا الاختيار الحي المحسوم. إذا كانت تهيئة النموذج المحدد
تحتوي على `params.fastMode`، فستستخدم cron المعزولة ذلك افتراضيًا. ويظل تجاوز
`fastMode` المخزن في الجلسة هو الأعلى أولوية على التهيئة في كلا الاتجاهين.

إذا واجه تشغيل معزول عملية تسليم حية لتبديل النموذج، فسيعيد cron المحاولة باستخدام
المزوّد/النموذج المُبدّل ويحتفظ بذلك الاختيار الحي قبل إعادة المحاولة. وعندما
يحمل التبديل أيضًا ملف تعريف مصادقة جديدًا، يحتفظ cron بتجاوز ملف تعريف
المصادقة هذا أيضًا. وتكون إعادة المحاولات محدودة: بعد المحاولة الأولية إضافة إلى
إعادتَي محاولة بسبب التبديل، يوقف cron العملية بدلًا من الدوران إلى ما لا نهاية.

## التسليم والمخرجات

| الوضع      | ما الذي يحدث                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | يسلم النص النهائي إلى الهدف كخيار احتياطي إذا لم يرسله العامل     |
| `webhook`  | يرسل حمولة حدث الانتهاء إلى عنوان URL عبر POST                     |
| `none`     | لا يوجد تسليم احتياطي من المشغّل                                    |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى القناة. وبالنسبة إلى مواضيع منتديات Telegram، استخدم `-1001234567890:topic:123`. أما أهداف Slack/Discord/Mattermost فينبغي أن تستخدم بادئات صريحة (`channel:<id>`, `user:<id>`).

بالنسبة إلى المهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار الدردشة
متاحًا، يمكن للعامل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. وإذا
أرسل العامل إلى الهدف المكوَّن/الحالي، فسيتخطى OpenClaw الإعلان الاحتياطي.
وبخلاف ذلك، فإن `announce` و`webhook` و`none` تتحكم فقط فيما يفعله المشغّل
بالرد النهائي بعد دورة العامل.

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يعيّن `cron.failureDestination` افتراضيًا عامًا لإشعارات الفشل.
- يجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يكن أي منهما مضبوطًا وكانت المهمة تُسلَّم أصلًا عبر `announce`، فإن إشعارات الفشل تعود الآن إلى هذا الهدف الأساسي للإعلان.
- لا يكون `delivery.failureDestination` مدعومًا إلا في المهام ذات `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.

## أمثلة CLI

تذكير أحادي التشغيل (الجلسة الرئيسية):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

مهمة معزولة متكررة مع تسليم:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

مهمة معزولة مع تجاوز النموذج والتفكير:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhooks

يمكن لـ Gateway كشف نقاط نهاية HTTP Webhook للمشغلات الخارجية. فعّل ذلك في الإعدادات:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### المصادقة

يجب أن يتضمن كل طلب رمز hook المميز عبر ترويسة:

- `Authorization: Bearer <token>` (موصى به)
- `x-openclaw-token: <token>`

تُرفض الرموز المميزة في سلسلة الاستعلام.

### POST /hooks/wake

أدرج حدث نظام للجلسة الرئيسية في قائمة الانتظار:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (مطلوب): وصف الحدث
- `mode` (اختياري): `now` (الافتراضي) أو `next-heartbeat`

### POST /hooks/agent

شغّل دورة عامل معزولة:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

الحقول: `message` (مطلوب)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `thinking`، `timeoutSeconds`.

### عمليات hook المعينة (POST /hooks/\<name\>)

تُحل أسماء hook المخصصة عبر `hooks.mappings` في الإعدادات. ويمكن للتعيينات تحويل الحمولات الاعتباطية إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.

### الأمان

- أبقِ نقاط نهاية hook خلف loopback أو tailnet أو وكيل عكسي موثوق.
- استخدم رمز hook مميزًا مخصصًا؛ ولا تعد استخدام رموز مصادقة gateway المميزة.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ إذ إن `/` مرفوض.
- اضبط `hooks.allowedAgentIds` لتقييد التوجيه الصريح لـ `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يحددها المتصل.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلّف حمولات hook بحدود أمان افتراضيًا.

## تكامل Gmail PubSub

اربط مشغلات صندوق وارد Gmail بـ OpenClaw عبر Google PubSub.

**المتطلبات المسبقة**: CLI ‏`gcloud`، و`gog`‏ (`gogcli`)، وتمكين OpenClaw hooks، وTailscale لنقطة نهاية HTTPS العامة.

### إعداد المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعداد `hooks.gmail`، ويفعّل إعداد Gmail المسبق، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### التشغيل التلقائي لـ Gateway

عندما يكون `hooks.enabled=true` و`hooks.gmail.account` مضبوطًا، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

### إعداد يدوي لمرة واحدة

1. حدّد مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. أنشئ topic وامنح Gmail إذن الدفع:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. ابدأ المراقبة:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### تجاوز نموذج Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## إدارة المهام

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

ملاحظة حول تجاوز النموذج:

- يغيّر `openclaw cron add|edit --model ...` النموذج المحدد للمهمة.
- إذا كان النموذج مسموحًا به، فسيصل هذا المزوّد/النموذج المحدد نفسه إلى
  تشغيل العامل المعزول.
- وإذا لم يكن مسموحًا به، فسيصدر cron تحذيرًا ويعود إلى اختيار
  النموذج الافتراضي/نموذج العامل الخاص بالمهمة.
- تظل سلاسل الرجوع الاحتياطي المكوّنة مطبقة، لكن تجاوز `--model` العادي
  من دون قائمة رجوع احتياطي صريحة لكل مهمة لم يعد ينتقل إلى النموذج
  الأساسي للعامل كهدف إعادة محاولة إضافي صامت.

## الإعدادات

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

يُشتق ملف الحالة الجانبي لوقت التشغيل من `cron.store`: إذ يستخدم مخزن
بصيغة `.json` مثل `~/clawd/cron/jobs.json` الملف `~/clawd/cron/jobs-state.json`،
بينما يضيف مسار المخزن الذي لا يحتوي على اللاحقة `.json` اللاحقة `-state.json`.

تعطيل cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

**إعادة محاولة التشغيل الأحادي**: تُعاد محاولة الأخطاء العابرة (حد المعدل، والتحميل الزائد، والشبكة، وخطأ الخادم) حتى 3 مرات مع تراجع أسي. وتُعطَّل الأخطاء الدائمة فورًا.

**إعادة محاولة التشغيل المتكرر**: تراجع أسي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. ويُعاد ضبط التراجع بعد التشغيل الناجح التالي.

**الصيانة**: يقوم `cron.sessionRetention` (الافتراضي `24h`) بتقليم إدخالات جلسات التشغيل المعزولة. وتقوم `cron.runLog.maxBytes` / `cron.runLog.keepLines` بتقليم ملفات سجل التشغيل تلقائيًا.

## استكشاف الأخطاء وإصلاحها

### تسلسل الأوامر

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron لا يعمل

- تحقق من `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
- تأكد من أن Gateway يعمل باستمرار.
- بالنسبة إلى جداول `cron`، تحقق من المنطقة الزمنية (`--tz`) مقابل المنطقة الزمنية للمضيف.
- تعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي تم التحقق منه باستخدام `openclaw cron run <jobId> --due` وأن المهمة لم يحِن موعدها بعد.

### تم تشغيل Cron ولكن لم يحدث تسليم

- يعني وضع التسليم `none` أنه لا يُتوقع أي إرسال احتياطي من المشغّل. ولا يزال بإمكان العامل
  الإرسال مباشرة باستخدام أداة `message` عندما يكون مسار الدردشة متاحًا.
- يعني غياب هدف التسليم أو عدم صحته (`channel`/`to`) أنه تم تخطي الإرسال الخارجي.
- تعني أخطاء مصادقة القناة (`unauthorized`, `Forbidden`) أن التسليم قد حُظر بسبب بيانات الاعتماد.
- إذا أعاد التشغيل المعزول فقط الرمز الصامت (`NO_REPLY` / `no_reply`)،
  فسيقوم OpenClaw بكبت التسليم الخارجي المباشر وأيضًا بكبت مسار الملخص
  الموضوع في قائمة الانتظار احتياطيًا، لذلك لن يُنشر أي شيء مرة أخرى إلى الدردشة.
- إذا كان من المفترض أن يرسل العامل رسالة إلى المستخدم بنفسه، فتحقق من أن المهمة تحتوي على
  مسار قابل للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

### محاذير المنطقة الزمنية

- يستخدم Cron من دون `--tz` المنطقة الزمنية لمضيف gateway.
- تُعامل جداول `at` التي لا تحتوي على منطقة زمنية على أنها UTC.
- يستخدم `activeHours` في Heartbeat دقة المنطقة الزمنية المكوّنة.

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — نظرة سريعة على جميع آليات الأتمتة
- [المهام الخلفية](/ar/automation/tasks) — سجل المهام لعمليات تنفيذ cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعدادات المنطقة الزمنية
