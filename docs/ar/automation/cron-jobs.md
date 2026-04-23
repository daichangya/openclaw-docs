---
read_when:
    - جدولة المهام الخلفية أو عمليات التنبيه
    - ربط المشغلات الخارجية (Webhook وGmail) بـ OpenClaw
    - اتخاذ قرار بين Heartbeat وCron للمهام المجدولة
summary: المهام المجدولة وعمليات Webhook ومشغلات Gmail PubSub لجدولة Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-04-23T07:18:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# المهام المجدولة (Cron)

يُعد Cron أداة الجدولة المدمجة في Gateway. فهو يحتفظ بالمهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه إعادة تسليم المخرجات إلى قناة دردشة أو نقطة نهاية Webhook.

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

## كيفية عمل cron

- يعمل Cron **داخل** عملية Gateway (وليس داخل النموذج).
- تستمر تعريفات المهام في `~/.openclaw/cron/jobs.json` لذلك لا تؤدي إعادة التشغيل إلى فقدان الجداول.
- تستمر حالة التنفيذ أثناء التشغيل بجواره في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتعقب تعريفات cron في git، فتتبع `jobs.json` وأضف `jobs-state.json` إلى `gitignore`.
- بعد هذا الفصل، يمكن لإصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تتعامل مع المهام على أنها جديدة لأن حقول وقت التشغيل أصبحت الآن موجودة في `jobs-state.json`.
- تنشئ جميع عمليات تنفيذ cron سجلات [مهام الخلفية](/ar/automation/tasks).
- تُحذف المهام ذات التنفيذ الواحد (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- تحاول تشغيلات cron المعزولة، على أساس أفضل جهد، إغلاق علامات تبويب/عمليات المتصفح المتتبعة الخاصة بجلسة `cron:<jobId>` عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- كما تحمي تشغيلات cron المعزولة من ردود الإقرار القديمة. إذا كانت
  النتيجة الأولى مجرد تحديث حالة مؤقت (`on it` و`pulling everything
together` وتلميحات مشابهة) ولم يعد أي تشغيل وكيل فرعي منحدر
  مسؤولًا عن الإجابة النهائية، فإن OpenClaw يعيد المطالبة مرة واحدة للحصول على
  النتيجة الفعلية قبل التسليم.

<a id="maintenance"></a>

تسوية المهام الخاصة بـ cron مملوكة لوقت التشغيل: تظل مهمة cron النشطة قائمة ما دام
وقت تشغيل cron لا يزال يتتبع تلك المهمة على أنها قيد التشغيل، حتى إذا كان لا يزال هناك صف جلسة فرعية قديم موجودًا.
وبمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي مهلة السماح البالغة 5 دقائق، يمكن للصيانة
وضع علامة `lost` على المهمة.

## أنواع الجداول

| النوع    | علامة CLI | الوصف |
| ------- | --------- | ----- |
| `at`    | `--at`    | طابع زمني لتنفيذ واحد (ISO 8601 أو قيمة نسبية مثل `20m`) |
| `every` | `--every` | فاصل زمني ثابت |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري |

تُعامل الطوابع الزمنية من دون منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة وفق التوقيت المحلي.

تُوزَّع تلقائيًا التعبيرات المتكررة التي تبدأ مع رأس الساعة على مدى يصل إلى 5 دقائق لتقليل ذروات الحمل. استخدم `--exact` لفرض توقيت دقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلَّل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون كلٌّ من حقلي يوم الشهر ويوم الأسبوع غير عامَّين، فإن croner يطابق عندما يطابق **أحد** الحقلين — وليس كلاهما. هذا هو سلوك Vixie cron القياسي.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

سيعمل هذا تقريبًا 5–6 مرات شهريًا بدلًا من 0–1 مرة شهريًا. يستخدم OpenClaw هنا سلوك OR الافتراضي في Croner. لطلب تحقق الشرطين معًا، استخدم مُعدِّل يوم الأسبوع `+` في Croner (`0 9 15 * +1`) أو جدولة أحد الحقلين والتحقق من الآخر داخل مطالبة المهمة أو أمرها.

## أنماط التنفيذ

| النمط          | قيمة `--session`     | يعمل في                 | الأنسب لـ |
| -------------- | -------------------- | ----------------------- | --------- |
| الجلسة الرئيسية | `main`               | دورة Heartbeat التالية  | التذكيرات، وأحداث النظام |
| معزول          | `isolated`           | `cron:<jobId>` مخصصة    | التقارير، والأعمال الخلفية |
| الجلسة الحالية  | `current`            | مرتبط وقت الإنشاء       | العمل المتكرر المعتمد على السياق |
| جلسة مخصصة     | `session:custom-id`  | جلسة مسماة مستمرة       | التدفقات التي تبني على السجل |

تُدرج مهام **الجلسة الرئيسية** حدث نظام ويمكنها اختياريًا إيقاظ Heartbeat (`--wake now` أو `--wake next-heartbeat`). تعمل المهام **المعزولة** على دورة وكيل مخصصة بجلسة جديدة. تحتفظ **الجلسات المخصصة** (`session:xxx`) بالسياق عبر التشغيلات، ما يتيح تدفقات مثل الملخصات اليومية التي تبني على الملخصات السابقة.

بالنسبة إلى المهام المعزولة، أصبح تفكيك وقت التشغيل يتضمن الآن تنظيفًا للمتصفح، على أساس أفضل جهد، لتلك الجلسة الخاصة بـ cron. يتم تجاهل إخفاقات التنظيف حتى تبقى نتيجة cron الفعلية هي المعتمدة.

كما تتخلص تشغيلات cron المعزولة أيضًا من أي مثيلات وقت تشغيل MCP المضمنة التي أُنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. وهذا يطابق الطريقة التي تُفكك بها عملاء MCP في الجلسة الرئيسية والجلسات المخصصة، بحيث لا تُسرّب مهام cron المعزولة عمليات stdio الفرعية أو اتصالات MCP طويلة العمر عبر التشغيلات.

عندما تنسق تشغيلات cron المعزولة وكلاء فرعيين، يفضّل التسليم أيضًا
المخرجات النهائية المنحدرة بدلًا من النص المؤقت القديم للأصل.
إذا كانت الوكلاء الفرعيون لا يزالون قيد التشغيل، فإن OpenClaw يمنع هذا
التحديث الجزئي من الأصل بدلًا من الإعلان عنه.

### خيارات الحمولة للمهام المعزولة

- `--message`: نص المطالبة (مطلوب للمهام المعزولة)
- `--model` / `--thinking`: تجاوزات النموذج ومستوى التفكير
- `--light-context`: تخطي حقن ملف تهيئة مساحة العمل
- `--tools exec,read`: تقييد الأدوات التي يمكن للمهمة استخدامها

يستخدم `--model` النموذج المسموح المحدد لتلك المهمة. إذا لم يكن النموذج المطلوب
مسموحًا به، يسجل cron تحذيرًا ويعود إلى اختيار النموذج الافتراضي/نموذج الوكيل لتلك المهمة بدلًا من ذلك. تظل سلاسل الرجوع الاحتياطي المكوّنة مطبقة، لكن تجاوز نموذج عاديًا من دون قائمة رجوع احتياطي صريحة لكل مهمة لم يعد يضيف النموذج الأساسي للوكيل كهدف إعادة محاولة مخفي إضافي.

ترتيب أولوية اختيار النموذج للمهام المعزولة هو:

1. تجاوز نموذج Gmail hook (عندما يكون التشغيل قد جاء من Gmail وكان هذا التجاوز مسموحًا)
2. `model` في حمولة كل مهمة
3. تجاوز النموذج المخزن لجلسة cron
4. اختيار النموذج الافتراضي/نموذج الوكيل

يتبع الوضع السريع اختيار live المحلول أيضًا. إذا كان إعداد النموذج المحدد
يحتوي على `params.fastMode`، فإن cron المعزول يستخدمه افتراضيًا. ويظل تجاوز
`fastMode` المخزن للجلسة هو صاحب الأولوية على الإعداد في كلا الاتجاهين.

إذا واجه تشغيل معزول عملية تسليم تبديل نموذج live، فإن cron يعيد المحاولة باستخدام
المزوّد/النموذج المُبدَّل ويحفظ هذا الاختيار live قبل إعادة المحاولة. وعندما
يحمل التبديل أيضًا ملف تعريف مصادقة جديدًا، فإن cron يحفظ تجاوز ملف تعريف المصادقة هذا أيضًا. إعادة المحاولات محدودة: بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل، يوقف cron التشغيل بدلًا من الاستمرار بلا نهاية.

## التسليم والمخرجات

| الوضع      | ما الذي يحدث |
| ---------- | ------------ |
| `announce` | تسليم احتياطي للنص النهائي إلى الهدف إذا لم يرسله الوكيل |
| `webhook`  | إرسال حمولة حدث مكتمل عبر POST إلى عنوان URL |
| `none`     | لا يوجد تسليم احتياطي من المشغّل |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى القناة. وبالنسبة إلى مواضيع منتدى Telegram، استخدم `-1001234567890:topic:123`. ويجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`, `user:<id>`).

بالنسبة إلى المهام المعزولة، يكون التسليم إلى الدردشة مشتركًا. إذا كان هناك مسار دردشة متاح،
فيمكن للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. وإذا قام
الوكيل بالإرسال إلى الهدف المهيأ/الحالي، فإن OpenClaw يتخطى الإعلان الاحتياطي.
وبخلاف ذلك، فإن `announce` و`webhook` و`none` تتحكم فقط في ما يفعله
المشغّل مع الرد النهائي بعد دورة الوكيل.

تتبع إشعارات الإخفاق مسار وجهة منفصلًا:

- يعيّن `cron.failureDestination` قيمة افتراضية عامة لإشعارات الإخفاق.
- تتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يُعيَّن أي منهما وكانت المهمة تُسلِّم أصلًا عبر `announce`، فإن إشعارات الإخفاق تعود الآن افتراضيًا إلى هدف الإعلان الأساسي هذا.
- لا يكون `delivery.failureDestination` مدعومًا إلا في المهام ذات `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.

## أمثلة CLI

تذكير لتنفيذ واحد (الجلسة الرئيسية):

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

مهمة معزولة مع تجاوز للنموذج والتفكير:

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

يمكن لـ Gateway كشف نقاط نهاية Webhook عبر HTTP للمشغلات الخارجية. فعّل ذلك في الإعدادات:

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

إدراج حدث نظام للجلسة الرئيسية:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (مطلوب): وصف الحدث
- `mode` (اختياري): `now` (افتراضي) أو `next-heartbeat`

### POST /hooks/agent

تشغيل دورة وكيل معزولة:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

الحقول: `message` (مطلوب)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `thinking`، `timeoutSeconds`.

### عمليات hook المعيّنة (POST /hooks/\<name\>)

تُحل أسماء hook المخصصة عبر `hooks.mappings` في الإعدادات. ويمكن لعمليات التعيين تحويل أي حمولة إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.

### الأمان

- أبقِ نقاط نهاية hook خلف loopback أو tailnet أو وكيل عكسي موثوق.
- استخدم رمز hook مميزًا مخصصًا؛ لا تعِد استخدام رموز مصادقة gateway.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- عيّن `hooks.allowedAgentIds` لتقييد التوجيه الصريح لـ `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يختارها المتصل.
- إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلّف حمولات hook بحدود أمان افتراضيًا.

## تكامل Gmail PubSub

اربط مشغلات صندوق بريد Gmail الوارد بـ OpenClaw عبر Google PubSub.

**المتطلبات المسبقة**: CLI الخاص بـ `gcloud`، و`gog` (`gogcli`)، وتفعيل OpenClaw hooks، وTailscale لنقطة نهاية HTTPS العامة.

### الإعداد عبر المعالج (موصى به)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعداد `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### التشغيل التلقائي لـ Gateway

عندما يكون `hooks.enabled=true` وتم تعيين `hooks.gmail.account`، يبدأ Gateway الأمر `gog gmail watch serve` عند الإقلاع ويجدد المراقبة تلقائيًا. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء ذلك.

### إعداد يدوي لمرة واحدة

1. حدّد مشروع GCP الذي يملك عميل OAuth المستخدم من قبل `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. أنشئ topic وامنح Gmail صلاحية الدفع:

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
- إذا كان النموذج مسموحًا به، فإن هذا المزوّد/النموذج المحدد يصل إلى تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا به، فإن cron يحذر ويعود إلى اختيار النموذج الافتراضي/نموذج الوكيل الخاص بالمهمة.
- تظل سلاسل الرجوع الاحتياطي المكوّنة مطبقة، لكن تجاوز `--model` العادي من دون قائمة رجوع احتياطي صريحة لكل مهمة لم يعد يمر إلى النموذج الأساسي للوكيل كهدف إعادة محاولة إضافي صامت.

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

يُشتق sidecar الخاص بحالة وقت التشغيل من `cron.store`: فمخزن `.json` مثل
`~/clawd/cron/jobs.json` يستخدم `~/clawd/cron/jobs-state.json`، بينما مسار المخزن
الذي لا يحتوي على اللاحقة `.json` تُضاف إليه اللاحقة `-state.json`.

لتعطيل cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

**إعادة المحاولة للتنفيذ الواحد**: تُعاد محاولة الأخطاء العابرة (حد المعدل، وزيادة الحمل، والشبكة، وخطأ الخادم) حتى 3 مرات مع تراجع أُسّي. تُعطَّل الأخطاء الدائمة فورًا.

**إعادة المحاولة للمهام المتكررة**: تراجع أُسّي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. يُعاد ضبط التراجع بعد التشغيل الناجح التالي.

**الصيانة**: يقوم `cron.sessionRetention` (الافتراضي `24h`) بتقليم إدخالات جلسات التشغيل المعزولة. ويقوم `cron.runLog.maxBytes` / `cron.runLog.keepLines` بتقليم ملفات سجل التشغيل تلقائيًا.

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

- تحقّق من `cron.enabled` ومتغير البيئة `OPENCLAW_SKIP_CRON`.
- تأكد من أن Gateway يعمل بشكل مستمر.
- بالنسبة إلى جداول `cron`، تحقّق من المنطقة الزمنية (`--tz`) مقارنة بالمنطقة الزمنية للمضيف.
- تعني `reason: not-due` في مخرجات التشغيل أنه تم فحص التشغيل اليدوي باستخدام `openclaw cron run <jobId> --due` وأن وقت المهمة لم يحن بعد.

### تم تشغيل Cron لكن لم يحدث تسليم

- يعني وضع التسليم `none` أنه لا يُتوقع إرسال احتياطي من المشغّل. ولا يزال بإمكان الوكيل
  الإرسال مباشرة باستخدام أداة `message` عندما يكون مسار الدردشة متاحًا.
- غياب هدف التسليم أو كونه غير صالح (`channel`/`to`) يعني أنه تم تخطي الإرسال الخارجي.
- تعني أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) أن التسليم حُظر بسبب بيانات الاعتماد.
- إذا أعاد التشغيل المعزول الرمز الصامت فقط (`NO_REPLY` / `no_reply`)،
  فإن OpenClaw يمنع التسليم الخارجي المباشر ويمنع أيضًا مسار
  الملخص الموضوع في قائمة الانتظار الاحتياطي، لذلك لا يتم نشر أي شيء مجددًا إلى الدردشة.
- إذا كان من المفترض أن يرسل الوكيل رسالة إلى المستخدم بنفسه، فتحقّق من أن المهمة لديها
  مسار قابل للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

### ملاحظات مهمة حول المنطقة الزمنية

- يستخدم Cron من دون `--tz` المنطقة الزمنية لمضيف gateway.
- تُعامل جداول `at` من دون منطقة زمنية على أنها UTC.
- يستخدم `activeHours` في Heartbeat دقة المنطقة الزمنية المهيأة.

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — نظرة عامة على جميع آليات الأتمتة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لعمليات تنفيذ cron
- [Heartbeat](/ar/gateway/heartbeat) — الدورات الدورية للجلسة الرئيسية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعدادات المنطقة الزمنية
