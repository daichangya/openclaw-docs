---
read_when:
    - تشغيل أكثر من Gateway على الجهاز نفسه
    - تحتاج إلى إعدادات/حالة/منافذ معزولة لكل Gateway
summary: شغّل عدة Gateways من OpenClaw على مضيف واحد (العزل والمنافذ والملفات الشخصية)
title: عدة Gateways
x-i18n:
    generated_at: "2026-04-21T19:20:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# عدة Gateways (على نفس المضيف)

يجب أن تستخدم معظم الإعدادات Gateway واحدًا لأن Gateway واحدًا يمكنه التعامل مع عدة اتصالات مراسلة وعدة وكلاء. إذا كنت تحتاج إلى عزل أقوى أو تكرار احتياطي (مثل rescue bot)، فشغّل Gateways منفصلة مع ملفات شخصية/منافذ معزولة.

## أفضل إعداد موصى به

بالنسبة لمعظم المستخدمين، يكون أبسط إعداد لـ rescue bot هو:

- إبقاء bot الأساسي على الملف الشخصي الافتراضي
- تشغيل rescue bot باستخدام `--profile rescue`
- استخدام Telegram bot منفصل تمامًا لحساب الإنقاذ
- إبقاء rescue bot على منفذ أساسي مختلف مثل `19789`

هذا يُبقي rescue bot معزولًا عن bot الأساسي بحيث يمكنه تصحيح المشكلات أو تطبيق
تغييرات الإعدادات إذا كان bot الأساسي متوقفًا. اترك ما لا يقل عن 20 منفذًا بين
المنافذ الأساسية حتى لا تتصادم منافذ browser/canvas/CDP المشتقة أبدًا.

## بدء سريع لـ Rescue-Bot

استخدم هذا كمسار افتراضي ما لم يكن لديك سبب قوي لفعل شيء
آخر:

```bash
# Rescue bot (Telegram bot منفصل، ملف شخصي منفصل، منفذ 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

إذا كان bot الأساسي يعمل بالفعل، فهذا عادةً كل ما تحتاجه.

أثناء `openclaw --profile rescue onboard`:

- استخدم رمز Telegram bot المنفصل
- أبقِ الملف الشخصي `rescue`
- استخدم منفذًا أساسيًا أعلى من bot الأساسي بما لا يقل عن 20
- اقبل مساحة عمل الإنقاذ الافتراضية ما لم تكن تدير واحدة بنفسك بالفعل

إذا كان onboarding قد ثبّت خدمة الإنقاذ لك بالفعل، فلن تكون هناك حاجة إلى
الأمر النهائي `gateway install`.

## لماذا ينجح هذا

يبقى rescue bot مستقلًا لأن لديه ما يلي خاصًا به:

- الملف الشخصي/الإعدادات
- دليل الحالة
- مساحة العمل
- المنفذ الأساسي (بالإضافة إلى المنافذ المشتقة)
- رمز Telegram bot

بالنسبة لمعظم الإعدادات، استخدم Telegram bot منفصلًا تمامًا لملف rescue الشخصي:

- سهل الإبقاء عليه مخصصًا للمشغّل فقط
- رمز bot وهوية منفصلان
- مستقل عن تثبيت القناة/التطبيق الخاص بـ bot الأساسي
- مسار استرداد بسيط قائم على الرسائل الخاصة عندما يكون bot الأساسي معطّلًا

## ما الذي يغيّره `--profile rescue onboard`

يستخدم `openclaw --profile rescue onboard` تدفق onboarding العادي، لكنه
يكتب كل شيء داخل ملف شخصي منفصل.

عمليًا، هذا يعني أن rescue bot يحصل على ما يلي خاصًا به:

- ملف إعدادات
- دليل حالة
- مساحة عمل (افتراضيًا `~/.openclaw/workspace-rescue`)
- اسم خدمة مُدارة

أما المطالبات فهي نفسها بخلاف ذلك كما في onboarding العادي.

## إعداد عام لعدة Gateways

يُعد تخطيط rescue bot أعلاه هو الإعداد الافتراضي الأسهل، لكن نمط العزل نفسه
يعمل مع أي زوج أو مجموعة من Gateways على مضيف واحد.

لإعداد أكثر عمومية، امنح كل Gateway إضافية ملفًا شخصيًا مسمّى خاصًا بها و
منفذًا أساسيًا خاصًا بها:

```bash
# main (الملف الشخصي الافتراضي)
openclaw setup
openclaw gateway --port 18789

# gateway إضافية
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

إذا كنت تريد أن تستخدم كلتا الـ Gateways ملفات شخصية مسمّاة، فهذا يعمل أيضًا:

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

استخدم البدء السريع لـ rescue bot عندما تريد مسارًا احتياطيًا للمشغّل. واستخدم
نمط الملفات الشخصية العام عندما تريد عدة Gateways طويلة التشغيل
لقنوات أو مستأجرين أو مساحات عمل أو أدوار تشغيلية مختلفة.

## قائمة تحقق العزل

أبقِ هذه العناصر فريدة لكل نسخة Gateway:

- `OPENCLAW_CONFIG_PATH` — ملف إعدادات لكل نسخة
- `OPENCLAW_STATE_DIR` — جلسات وبيانات اعتماد وذاكرات تخزين مؤقت لكل نسخة
- `agents.defaults.workspace` — جذر مساحة عمل لكل نسخة
- `gateway.port` (أو `--port`) — فريد لكل نسخة
- منافذ browser/canvas/CDP المشتقة

إذا كانت هذه مشتركة، فستواجه سباقات في الإعدادات وتعارضات في المنافذ.

## تعيين المنافذ (المشتقة)

المنفذ الأساسي = `gateway.port` (أو `OPENCLAW_GATEWAY_PORT` / `--port`).

- منفذ خدمة التحكم في browser = الأساسي + 2 (local loopback فقط)
- يتم تقديم canvas host على خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`)
- تُخصَّص منافذ Browser profile CDP تلقائيًا من `browser.controlPort + 9 .. + 108`

إذا قمت بتجاوز أي من هذه القيم في الإعدادات أو المتغيرات البيئية، فيجب أن تُبقيها فريدة لكل نسخة.

## ملاحظات browser/CDP (مشكلة شائعة)

- **لا** تثبّت `browser.cdpUrl` على القيم نفسها عبر عدة نسخ.
- تحتاج كل نسخة إلى منفذ تحكم browser خاص بها ونطاق CDP خاص بها (مشتق من منفذ gateway الخاص بها).
- إذا كنت تحتاج إلى منافذ CDP صريحة، فاضبط `browser.profiles.<name>.cdpPort` لكل نسخة.
- Chrome البعيد: استخدم `browser.profiles.<name>.cdpUrl` (لكل ملف شخصي، لكل نسخة).

## مثال env يدوي

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## تحققات سريعة

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

التفسير:

- يساعد `gateway status --deep` على اكتشاف خدمات launchd/systemd/schtasks القديمة المتبقية من عمليات تثبيت أقدم.
- يكون نص التحذير في `gateway probe` مثل `multiple reachable gateways detected` متوقعًا فقط عندما تشغّل عمدًا أكثر من gateway معزولة واحدة.
