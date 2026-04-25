---
read_when:
    - تشغيل أكثر من Gateway واحد على الجهاز نفسه
    - تحتاج إلى إعدادات/حالة/منافذ معزولة لكل Gateway
summary: تشغيل عدة Gateways من OpenClaw على مضيف واحد (العزل، والمنافذ، والملفات الشخصية)
title: عدة Gateways
x-i18n:
    generated_at: "2026-04-25T13:47:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

يجب أن تستخدم معظم الإعدادات Gateway واحدًا لأن Gateway واحدًا يمكنه التعامل مع عدة اتصالات مراسلة ووكلاء. إذا كنت تحتاج إلى عزل أقوى أو تكرار احتياطي (مثل بوت إنقاذ)، فشغّل Gateways منفصلة مع ملفات تعريف/منافذ معزولة.

## أفضل إعداد موصى به

بالنسبة إلى معظم المستخدمين، فإن أبسط إعداد لبوت الإنقاذ هو:

- الإبقاء على البوت الرئيسي على ملف التعريف الافتراضي
- تشغيل بوت الإنقاذ على `--profile rescue`
- استخدام بوت Telegram منفصل تمامًا لحساب الإنقاذ
- الإبقاء على بوت الإنقاذ على منفذ أساسي مختلف مثل `19789`

يحافظ هذا على عزل بوت الإنقاذ عن البوت الرئيسي بحيث يمكنه تصحيح الأخطاء أو تطبيق
تغييرات الإعدادات إذا كان البوت الأساسي متوقفًا. اترك ما لا يقل عن 20 منفذًا بين
المنافذ الأساسية حتى لا تتصادم المنافذ المشتقة الخاصة بـ browser/canvas/CDP أبدًا.

## بدء سريع لبوت الإنقاذ

استخدم هذا كمسار افتراضي ما لم يكن لديك سبب قوي للقيام بشيء
آخر:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

إذا كان البوت الرئيسي يعمل بالفعل، فهذا عادةً كل ما تحتاج إليه.

أثناء `openclaw --profile rescue onboard`:

- استخدم رمز بوت Telegram المنفصل
- احتفظ بملف التعريف `rescue`
- استخدم منفذًا أساسيًا أعلى بما لا يقل عن 20 من منفذ البوت الرئيسي
- اقبل مساحة عمل الإنقاذ الافتراضية ما لم تكن تدير واحدة بنفسك بالفعل

إذا كان الإعداد الأولي قد ثبّت خدمة الإنقاذ لك بالفعل، فلن تكون هناك حاجة إلى
`gateway install` النهائي.

## لماذا ينجح هذا

يبقى بوت الإنقاذ مستقلاً لأنه يملك ما يلي بشكل خاص به:

- ملف التعريف/الإعدادات
- دليل الحالة
- مساحة العمل
- المنفذ الأساسي (بالإضافة إلى المنافذ المشتقة)
- رمز بوت Telegram المميز

بالنسبة إلى معظم الإعدادات، استخدم بوت Telegram منفصلًا تمامًا لملف تعريف الإنقاذ:

- سهل الإبقاء عليه للمشغّل فقط
- رمز بوت وهوية منفصلان
- مستقل عن تثبيت القناة/التطبيق الخاص بالبوت الرئيسي
- مسار استرداد بسيط قائم على الرسائل الخاصة عندما يكون البوت الرئيسي معطلاً

## ما الذي يغيّره `--profile rescue onboard`

يستخدم `openclaw --profile rescue onboard` تدفق الإعداد الأولي العادي، لكنه
يكتب كل شيء في ملف تعريف منفصل.

عمليًا، هذا يعني أن بوت الإنقاذ يحصل على ما يلي بشكل خاص به:

- ملف إعدادات
- دليل حالة
- مساحة عمل (افتراضيًا `~/.openclaw/workspace-rescue`)
- اسم خدمة مُدارة

أما المطالبات فتبقى هي نفسها كما في الإعداد الأولي العادي.

## إعداد عام لعدة Gateways

إن تخطيط بوت الإنقاذ أعلاه هو الافتراضي الأسهل، لكن نمط العزل نفسه
ينجح مع أي زوج أو مجموعة من Gateways على مضيف واحد.

لإعداد أكثر عمومية، أعطِ كل Gateway إضافية ملف تعريف مسمى خاصًا بها ومنفذها
الأساسي الخاص بها:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

إذا كنت تريد أن تستخدم كلتا الـ Gateways ملفات تعريف مسماة، فهذا يعمل أيضًا:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

تتبع الخدمات النمط نفسه:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

استخدم البدء السريع لبوت الإنقاذ عندما تريد مسارًا احتياطيًا للمشغّل. واستخدم
نمط ملف التعريف العام عندما تريد عدة Gateways طويلة الأمد من أجل
قنوات أو مستأجرين أو مساحات عمل أو أدوار تشغيلية مختلفة.

## قائمة التحقق من العزل

اجعل هذه العناصر فريدة لكل نسخة Gateway:

- `OPENCLAW_CONFIG_PATH` — ملف إعدادات لكل نسخة
- `OPENCLAW_STATE_DIR` — جلسات، وبيانات اعتماد، وذاكرات تخزين مؤقت لكل نسخة
- `agents.defaults.workspace` — جذر مساحة عمل لكل نسخة
- `gateway.port` (أو `--port`) — فريد لكل نسخة
- منافذ browser/canvas/CDP المشتقة

إذا تمت مشاركة هذه العناصر، فستواجه حالات سباق في الإعدادات وتعارضات في المنافذ.

## تعيين المنافذ (المشتقة)

المنفذ الأساسي = `gateway.port` (أو `OPENCLAW_GATEWAY_PORT` / `--port`).

- منفذ خدمة التحكم في browser = الأساسي + 2 (على loopback فقط)
- يتم تقديم canvas host على خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`)
- يتم تخصيص منافذ CDP الخاصة بملفات تعريف Browser تلقائيًا من `browser.controlPort + 9 .. + 108`

إذا تجاوزت أيًا من هذه العناصر في الإعدادات أو البيئة، فيجب أن تبقيها فريدة لكل نسخة.

## ملاحظات Browser/CDP (مشكلة شائعة)

- **لا** تثبّت `browser.cdpUrl` على القيم نفسها في عدة نسخ.
- تحتاج كل نسخة إلى منفذ تحكم خاص بها في browser ونطاق CDP خاص بها (مشتق من منفذ gateway الخاص بها).
- إذا كنت تحتاج إلى منافذ CDP صريحة، فاضبط `browser.profiles.<name>.cdpPort` لكل نسخة.
- Chrome البعيد: استخدم `browser.profiles.<name>.cdpUrl` (لكل ملف تعريف، ولكل نسخة).

## مثال يدوي باستخدام env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## فحوصات سريعة

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

التفسير:

- يساعد `gateway status --deep` في اكتشاف خدمات launchd/systemd/schtasks القديمة من عمليات تثبيت أقدم.
- يكون نص التحذير في `gateway probe` مثل `multiple reachable gateways detected` متوقعًا فقط عندما تشغّل عمدًا أكثر من gateway معزولة واحدة.

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [قفل Gateway](/ar/gateway/gateway-lock)
- [الإعدادات](/ar/gateway/configuration)
