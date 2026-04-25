---
read_when:
    - جدولة المهام الخلفية أو التنبيهات للاستيقاظ
    - ربط المشغّلات الخارجية (Webhooks، وGmail) بـ OpenClaw
    - اتخاذ القرار بين Heartbeat وCron للمهام المجدولة
summary: المهام المجدولة، وWebhooks، ومشغّلات Gmail PubSub لجدولة Gateway
title: المهام المجدولة
x-i18n:
    generated_at: "2026-04-25T13:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron هو المجدول المدمج في Gateway. فهو يحفظ المهام، ويوقظ الوكيل في الوقت المناسب، ويمكنه إعادة تسليم المخرجات إلى قناة دردشة أو نقطة نهاية Webhook.

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

## كيف يعمل Cron

- يعمل Cron **داخل** عملية Gateway (وليس داخل النموذج).
- يتم حفظ تعريفات المهام في `~/.openclaw/cron/jobs.json` حتى لا تؤدي إعادة التشغيل إلى فقدان الجداول.
- يتم حفظ حالة التنفيذ أثناء التشغيل بجواره في `~/.openclaw/cron/jobs-state.json`. إذا كنت تتعقب تعريفات cron في git، فتتبّع `jobs.json` وأضف `jobs-state.json` إلى `gitignore`.
- بعد هذا الفصل، يمكن لإصدارات OpenClaw الأقدم قراءة `jobs.json` لكنها قد تتعامل مع المهام على أنها جديدة لأن حقول وقت التشغيل أصبحت الآن موجودة في `jobs-state.json`.
- تنشئ جميع عمليات تنفيذ cron سجلات [مهام الخلفية](/ar/automation/tasks).
- تُحذف المهام ذات التنفيذ الواحد (`--at`) تلقائيًا بعد النجاح افتراضيًا.
- تحاول عمليات cron المعزولة، بأفضل جهد، إغلاق علامات تبويب/عمليات المتصفح المتعقبة الخاصة بجلسة `cron:<jobId>` عند اكتمال التشغيل، حتى لا تترك أتمتة المتصفح المنفصلة عمليات يتيمة خلفها.
- تحمي عمليات cron المعزولة أيضًا من ردود الإقرار القديمة. إذا
  كانت النتيجة الأولى مجرد تحديث حالة مؤقت (`on it`، `pulling everything
together`، وتلميحات مشابهة) ولم يعد أي تشغيل فرعي تابع
  مسؤولًا عن الإجابة النهائية، فإن OpenClaw يعيد إرسال مطالبة مرة واحدة للحصول على
  النتيجة الفعلية قبل التسليم.

<a id="maintenance"></a>

تسوية المهام الخاصة بـ cron مملوكة لوقت التشغيل: تظل مهمة cron النشطة حية ما دام
وقت تشغيل cron لا يزال يتتبع تلك المهمة على أنها قيد التشغيل، حتى إذا كان صف جلسة فرعية قديم لا يزال موجودًا.
وبمجرد أن يتوقف وقت التشغيل عن امتلاك المهمة وتنتهي مهلة السماح البالغة 5 دقائق، يمكن للصيانة
وضع علامة `lost` على المهمة.

## أنواع الجداول

| النوع    | راية CLI  | الوصف                                                   |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | طابع زمني لتنفيذ واحد (ISO 8601 أو قيمة نسبية مثل `20m`) |
| `every` | `--every` | فاصل زمني ثابت                                          |
| `cron`  | `--cron`  | تعبير cron من 5 حقول أو 6 حقول مع `--tz` اختياري        |

تُعامَل الطوابع الزمنية من دون منطقة زمنية على أنها UTC. أضف `--tz America/New_York` للجدولة حسب التوقيت المحلي الفعلي.

تُوزَّع تلقائيًا تعبيرات التكرار أعلى الساعة بما يصل إلى 5 دقائق لتقليل ذروات الحمل. استخدم `--exact` لفرض التوقيت الدقيق أو `--stagger 30s` لنافذة صريحة.

### يستخدم يوم الشهر ويوم الأسبوع منطق OR

تُحلَّل تعبيرات Cron بواسطة [croner](https://github.com/Hexagon/croner). عندما يكون كلٌّ من حقلي يوم الشهر ويوم الأسبوع غير عامّين، فإن croner يطابق عندما **يطابق أحد** الحقلين — وليس كلاهما. وهذا هو السلوك القياسي لـ Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

يؤدي هذا إلى التشغيل نحو 5-6 مرات شهريًا بدلًا من 0-1 مرة شهريًا. يستخدم OpenClaw هنا سلوك OR الافتراضي لـ Croner. لفرض الشرطين معًا، استخدم معدِّل يوم الأسبوع `+` الخاص بـ Croner (`0 9 15 * +1`) أو قم بالجدولة على أحد الحقلين وتحقق من الآخر داخل مطالبة المهمة أو أمرها.

## أنماط التنفيذ

| النمط           | قيمة `--session`     | يعمل في                 | الأنسب لـ                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| الجلسة الرئيسية | `main`              | دورة Heartbeat التالية   | التذكيرات، وأحداث النظام        |
| معزول           | `isolated`          | `cron:<jobId>` مخصصة     | التقارير، والمهام الخلفية       |
| الجلسة الحالية  | `current`           | يرتبط وقت الإنشاء        | الأعمال الدورية المعتمدة على السياق |
| جلسة مخصصة      | `session:custom-id` | جلسة مسماة دائمة         | سير العمل الذي يعتمد على السجل  |

تضيف مهام **الجلسة الرئيسية** حدث نظام إلى الطابور ويمكنها اختياريًا إيقاظ Heartbeat (`--wake now` أو `--wake next-heartbeat`). وتشغّل المهام **المعزولة** دورة وكيل مخصصة بجلسة جديدة. أما **الجلسات المخصصة** (`session:xxx`) فتحفظ السياق عبر عمليات التشغيل، مما يتيح سير عمل مثل الملخصات اليومية التي تُبنى على الملخصات السابقة.

بالنسبة إلى المهام المعزولة، فإن "جلسة جديدة" تعني معرّف transcript/session جديدًا لكل تشغيل. قد يحمل OpenClaw تفضيلات آمنة مثل إعدادات التفكير/السريع/المطوّل، والتسميات، وتجاوزات النموذج/المصادقة التي يحددها المستخدم صراحةً، لكنه لا يرث سياق المحادثة المحيط من صف cron أقدم: توجيه القناة/المجموعة، أو سياسة الإرسال أو الانتظار، أو التصعيد، أو الأصل، أو ربط وقت تشغيل ACP. استخدم `current` أو `session:<id>` عندما ينبغي لمهمة دورية أن تُبنى عمدًا على نفس سياق المحادثة.

بالنسبة إلى المهام المعزولة، يتضمن تفكيك وقت التشغيل الآن تنظيفًا، بأفضل جهد، للمتصفح الخاص بجلسة cron تلك. ويتم تجاهل إخفاقات التنظيف بحيث تظل النتيجة الفعلية لـ cron هي الحاسمة.

تتخلّص عمليات cron المعزولة أيضًا من أي مثيلات MCP runtime مضمّنة أُنشئت للمهمة عبر مسار تنظيف وقت التشغيل المشترك. وهذا يطابق طريقة إنهاء عملاء MCP في الجلسات الرئيسية والجلسات المخصصة، بحيث لا تؤدي مهام cron المعزولة إلى تسرّب عمليات stdio الفرعية أو اتصالات MCP طويلة الأمد عبر التشغيلات.

عندما تنسّق عمليات cron المعزولة وكلاء فرعيين، فإن التسليم يفضّل أيضًا
المخرج النهائي التابع على النص المؤقت القديم للوالد. وإذا كانت الوكلاء التابعة لا تزال
قيد التشغيل، فإن OpenClaw يحجب هذا التحديث الجزئي من الوالد بدلًا من إعلانه.

بالنسبة إلى أهداف الإعلان النصية فقط في Discord، يرسل OpenClaw النص
النهائي القياسي للمساعد مرة واحدة بدلًا من إعادة إرسال كل من حمولات النص
المتدفقة/الوسيطة والإجابة النهائية. أما حمولات Discord الخاصة بالوسائط والبيانات المنظمة
فلا تزال تُسلَّم كحمولات منفصلة حتى لا تُفقَد المرفقات والمكوّنات.

### خيارات الحمولة للمهام المعزولة

- `--message`: نص المطالبة (مطلوب للمهام المعزولة)
- `--model` / `--thinking`: تجاوزات النموذج ومستوى التفكير
- `--light-context`: تخطّي حقن ملف تهيئة مساحة العمل
- `--tools exec,read`: تقييد الأدوات التي يمكن للمهمة استخدامها

يستخدم `--model` النموذج المسموح المحدد لتلك المهمة. وإذا لم يكن النموذج المطلوب
مسموحًا به، فسيسجل cron تحذيرًا ويعود إلى اختيار النموذج الافتراضي/نموذج الوكيل لتلك المهمة بدلًا من ذلك.
ولا تزال سلاسل الرجوع الاحتياطي المهيأة سارية، لكن تجاوز
النموذج العادي من دون قائمة رجوع احتياطي صريحة لكل مهمة لم يعد يضيف النموذج الأساسي
للوكيل كهدف إعادة محاولة مخفي إضافي.

ترتيب أولوية اختيار النموذج للمهام المعزولة هو:

1. تجاوز نموذج ربط Gmail (عندما يكون التشغيل قد جاء من Gmail وكان هذا التجاوز مسموحًا)
2. `model` في حمولة كل مهمة
3. تجاوز النموذج المخزّن الذي اختاره المستخدم لجلسة cron
4. اختيار النموذج الافتراضي/نموذج الوكيل

ويتبع الوضع السريع أيضًا التحديد الحي الذي تم حسمه. إذا كانت إعدادات النموذج المحدد
تحتوي على `params.fastMode`، فإن cron المعزول يستخدم ذلك افتراضيًا. ولا يزال
تجاوز `fastMode` المخزّن للجلسة يتفوّق على الإعدادات في كلا الاتجاهين.

إذا واجه تشغيل معزول عملية تسليم بسبب تبديل حي للنموذج، فإن cron يعيد المحاولة باستخدام
المزوّد/النموذج الذي تم التبديل إليه ويحفظ هذا الاختيار الحي للتشغيل النشط
قبل إعادة المحاولة. وعندما يحمل التبديل أيضًا ملف مصادقة جديدًا، فإن cron يحفظ
هذا التجاوز لملف المصادقة للتشغيل النشط أيضًا. وتكون إعادة المحاولات محدودة:
فبعد المحاولة الأولية إضافةً إلى محاولتي تبديل، يوقف cron العملية بدلًا من التكرار إلى ما لا نهاية.

## التسليم والمخرجات

| الوضع     | ما الذي يحدث                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | تسليم النص النهائي احتياطيًا إلى الهدف إذا لم يرسله الوكيل        |
| `webhook`  | إرسال حمولة حدث الانتهاء عبر POST إلى عنوان URL                    |
| `none`     | لا يوجد تسليم احتياطي من المشغّل                                    |

استخدم `--announce --channel telegram --to "-1001234567890"` للتسليم إلى القناة. وبالنسبة إلى مواضيع منتديات Telegram، استخدم `-1001234567890:topic:123`. ويجب أن تستخدم أهداف Slack/Discord/Mattermost بادئات صريحة (`channel:<id>`، `user:<id>`).

بالنسبة إلى المهام المعزولة، يكون تسليم الدردشة مشتركًا. إذا كان مسار الدردشة متاحًا، فيمكن
للوكيل استخدام أداة `message` حتى عندما تستخدم المهمة `--no-deliver`. وإذا قام
الوكيل بالإرسال إلى الهدف المهيأ/الحالي، فإن OpenClaw يتخطى الإعلان الاحتياطي.
وخلاف ذلك، فإن `announce` و`webhook` و`none` تتحكم فقط في ما يفعله
المشغّل بالرد النهائي بعد دورة الوكيل.

تتبع إشعارات الفشل مسار وجهة منفصلًا:

- يحدد `cron.failureDestination` افتراضيًا عامًا لإشعارات الفشل.
- ويتجاوز `job.delivery.failureDestination` ذلك لكل مهمة.
- إذا لم يكن أيٌّ منهما مضبوطًا وكانت المهمة تسلّم أصلًا عبر `announce`، فإن إشعارات الفشل تعود الآن احتياطيًا إلى هدف الإعلان الأساسي هذا.
- لا يكون `delivery.failureDestination` مدعومًا إلا في المهام ذات `sessionTarget="isolated"` ما لم يكن وضع التسليم الأساسي هو `webhook`.

## أمثلة CLI

تذكير بتنفيذ واحد (الجلسة الرئيسية):

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

يمكن لـ Gateway عرض نقاط نهاية Webhook عبر HTTP للمشغّلات الخارجية. فعّلها في الإعدادات:

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

يجب أن يتضمن كل طلب رمز hook المميز عبر الترويسة:

- `Authorization: Bearer <token>` (موصى به)
- `x-openclaw-token: <token>`

تُرفَض الرموز المميزة في سلسلة الاستعلام.

### POST /hooks/wake

إضافة حدث نظام إلى طابور الجلسة الرئيسية:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (مطلوب): وصف الحدث
- `mode` (اختياري): `now` (الافتراضي) أو `next-heartbeat`

### POST /hooks/agent

تشغيل دورة وكيل معزولة:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

الحقول: `message` (مطلوب)، `name`، `agentId`، `wakeMode`، `deliver`، `channel`، `to`، `model`، `thinking`، `timeoutSeconds`.

### الخطافات المعيّنة (POST /hooks/\<name\>)

تُحل أسماء الخطافات المخصصة عبر `hooks.mappings` في الإعدادات. ويمكن أن تحوّل التعيينات الحمولات الاعتباطية إلى إجراءات `wake` أو `agent` باستخدام قوالب أو تحويلات برمجية.

### الأمان

- أبقِ نقاط نهاية hook خلف loopback، أو tailnet، أو reverse proxy موثوق.
- استخدم رمز hook مميزًا مخصصًا؛ لا تعِد استخدام رموز مصادقة gateway المميزة.
- أبقِ `hooks.path` على مسار فرعي مخصص؛ يتم رفض `/`.
- اضبط `hooks.allowedAgentIds` لتقييد التوجيه الصريح لـ `agentId`.
- أبقِ `hooks.allowRequestSessionKey=false` ما لم تكن تحتاج إلى جلسات يحددها المتصل.
- إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد أشكال مفاتيح الجلسات المسموح بها.
- تُغلَّف حمولات hook بحدود أمان افتراضيًا.

## تكامل Gmail PubSub

اربط مشغّلات صندوق وارد Gmail بـ OpenClaw عبر Google PubSub.

**المتطلبات المسبقة**: CLI ‏`gcloud`، و`gog` ‏(gogcli)، وتمكين خطافات OpenClaw، وTailscale لنقطة نهاية HTTPS العامة.

### إعداد المعالج (مستحسن)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

يكتب هذا إعداد `hooks.gmail`، ويفعّل الإعداد المسبق لـ Gmail، ويستخدم Tailscale Funnel لنقطة نهاية الدفع.

### التشغيل التلقائي لـ Gateway

عندما يكون `hooks.enabled=true` وتم ضبط `hooks.gmail.account`، يبدأ Gateway تشغيل `gog gmail watch serve` عند الإقلاع ويجدّد المراقبة تلقائيًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لإلغاء الاشتراك.

### إعداد يدوي لمرة واحدة

1. اختر مشروع GCP الذي يملك عميل OAuth المستخدم بواسطة `gog`:

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
- إذا كان النموذج مسموحًا به، يصل هذا المزوّد/النموذج المحدد نفسه إلى
  تشغيل الوكيل المعزول.
- إذا لم يكن مسموحًا به، يصدر cron تحذيرًا ويعود إلى اختيار
  نموذج الوكيل/النموذج الافتراضي للمهمة.
- لا تزال سلاسل الرجوع الاحتياطي المهيأة سارية، لكن تجاوز `--model` العادي من دون
  قائمة رجوع احتياطي صريحة لكل مهمة لم يعد ينتقل إلى النموذج الأساسي
  للوكيل كهدف إضافي صامت لإعادة المحاولة.

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

يُشتق الملف الجانبي لحالة وقت التشغيل من `cron.store`: إذ يستخدم مخزن `.json` مثل
`~/clawd/cron/jobs.json` الملف `~/clawd/cron/jobs-state.json`، بينما يُلحِق مسار المخزن
الذي لا ينتهي باللاحقة `.json` القيمة `-state.json`.

تعطيل cron: `cron.enabled: false` أو `OPENCLAW_SKIP_CRON=1`.

**إعادة محاولة التنفيذ الواحد**: تُعاد محاولة الأخطاء العابرة (تحديد المعدل، والتحميل الزائد، والشبكة، وخطأ الخادم) حتى 3 مرات مع تراجع أُسّي. أما الأخطاء الدائمة فتعطَّل فورًا.

**إعادة محاولة التنفيذ المتكرر**: تراجع أُسّي (من 30 ثانية إلى 60 دقيقة) بين المحاولات. ويُعاد ضبط التراجع بعد التشغيل الناجح التالي.

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

- تحقّق من `cron.enabled` ومن متغير البيئة `OPENCLAW_SKIP_CRON`.
- تأكّد من أن Gateway يعمل بشكل مستمر.
- بالنسبة إلى جداول `cron`، تحقّق من المنطقة الزمنية (`--tz`) مقارنةً بالمنطقة الزمنية للمضيف.
- تعني `reason: not-due` في مخرجات التشغيل أن التشغيل اليدوي تم التحقق منه باستخدام `openclaw cron run <jobId> --due` وأن المهمة لم يحِن موعدها بعد.

### تم تشغيل Cron لكن لم يحدث تسليم

- يعني وضع التسليم `none` أنه لا يُتوقع إرسال احتياطي من المشغّل. ولا يزال بإمكان الوكيل
  الإرسال مباشرةً باستخدام أداة `message` عندما يكون مسار الدردشة متاحًا.
- يعني غياب هدف التسليم أو عدم صلاحيته (`channel`/`to`) أنه تم تخطي الإرسال الخارجي.
- تعني أخطاء مصادقة القناة (`unauthorized`، `Forbidden`) أن التسليم قد حُظر بسبب بيانات الاعتماد.
- إذا أعاد التشغيل المعزول فقط الرمز الصامت (`NO_REPLY` / `no_reply`)،
  فإن OpenClaw يمنع التسليم الخارجي المباشر ويمنع أيضًا مسار الملخص
  الاحتياطي الموضوع في الطابور، لذلك لا يتم نشر أي شيء مرة أخرى إلى الدردشة.
- إذا كان من المفترض أن يراسل الوكيل المستخدم بنفسه، فتحقّق من أن المهمة لديها
  مسار قابل للاستخدام (`channel: "last"` مع دردشة سابقة، أو قناة/هدف صريح).

### ملاحظات مهمة حول المنطقة الزمنية

- يستخدم cron من دون `--tz` المنطقة الزمنية لمضيف gateway.
- تُعامل جداول `at` من دون منطقة زمنية على أنها UTC.
- يستخدم `activeHours` الخاص بـ Heartbeat دقة حل المنطقة الزمنية المهيأة.

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — نظرة عامة على جميع آليات الأتمتة
- [مهام الخلفية](/ar/automation/tasks) — سجل المهام لعمليات تنفيذ cron
- [Heartbeat](/ar/gateway/heartbeat) — دورات الجلسة الرئيسية الدورية
- [المنطقة الزمنية](/ar/concepts/timezone) — إعدادات المنطقة الزمنية
