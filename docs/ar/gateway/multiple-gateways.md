---
read_when:
    - تشغيل أكثر من Gateway واحد على الجهاز نفسه
    - تحتاج إلى إعدادات/حالة/منافذ معزولة لكل Gateway
summary: شغّل عدة Gateways من OpenClaw على مضيف واحد (العزل والمنافذ والملفات الشخصية)
title: عدة Gateways
x-i18n:
    generated_at: "2026-04-21T17:45:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# عدة Gateways (على المضيف نفسه)

يجب أن تستخدم معظم الإعدادات Gateway واحدًا لأن Gateway واحدًا يمكنه التعامل مع عدة اتصالات مراسلة وعدة وكلاء. إذا كنت بحاجة إلى عزل أقوى أو تكرار احتياطي (مثل روبوت إنقاذ)، فشغّل Gateways منفصلة بملفات شخصية/منافذ معزولة.

## قائمة التحقق من العزل (مطلوب)

- `OPENCLAW_CONFIG_PATH` — ملف إعدادات لكل مثيل
- `OPENCLAW_STATE_DIR` — جلسات وبيانات اعتماد وذاكرات تخزين مؤقت لكل مثيل
- `agents.defaults.workspace` — جذر مساحة عمل لكل مثيل
- `gateway.port` (أو `--port`) — قيمة فريدة لكل مثيل
- يجب ألا تتداخل المنافذ المشتقة (browser/canvas)

إذا كانت هذه مشتركة، فستواجه تعارضات في الإعدادات وتضاربًا في المنافذ.

## الموصى به: استخدم الملف الشخصي الافتراضي للأساسي، وملفًا شخصيًا مسمى لروبوت الإنقاذ

تقوم الملفات الشخصية تلقائيًا بتحديد نطاق `OPENCLAW_STATE_DIR` و`OPENCLAW_CONFIG_PATH` وإضافة لاحقة إلى أسماء الخدمات. بالنسبة إلى
معظم إعدادات روبوتات الإنقاذ، أبقِ الروبوت الأساسي على الملف الشخصي الافتراضي وأعطِ فقط
روبوت الإنقاذ ملفًا شخصيًا مسمى مثل `rescue`.

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

الخدمات:

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

إذا كنت تريد أن يستخدم كلا الـ Gateways ملفات شخصية مسماة، فهذا يعمل أيضًا، لكنه ليس
مطلوبًا.

## دليل روبوت الإنقاذ

الإعداد الموصى به:

- أبقِ الروبوت الأساسي على الملف الشخصي الافتراضي
- شغّل روبوت الإنقاذ على `--profile rescue`
- استخدم روبوت Telegram منفصلًا تمامًا لحساب الإنقاذ
- أبقِ روبوت الإنقاذ على منفذ أساسي مختلف مثل `19001`

هذا يُبقي روبوت الإنقاذ معزولًا عن الروبوت الأساسي حتى يتمكن من تصحيح الأخطاء أو تطبيق
تغييرات الإعدادات إذا كان الروبوت الأساسي متوقفًا. اترك ما لا يقل عن 20 منفذًا بين
المنافذ الأساسية حتى لا تتصادم أبدًا منافذ browser/canvas/CDP المشتقة.

### قناة/حساب الإنقاذ الموصى به

بالنسبة إلى معظم الإعدادات، استخدم روبوت Telegram منفصلًا تمامًا لملف الإنقاذ الشخصي.

لماذا Telegram:

- من السهل إبقاؤه للمشغّل فقط
- رمز روبوت وهوية منفصلان
- مستقل عن تثبيت قناة/تطبيق الروبوت الأساسي
- مسار استرداد بسيط قائم على الرسائل الخاصة عندما يتعطل الروبوت الأساسي

الجزء المهم هو الاستقلال الكامل: حساب روبوت منفصل، وبيانات اعتماد منفصلة،
وملف شخصي منفصل في OpenClaw، ومساحة عمل منفصلة، ومنفذ منفصل.

### تدفق التثبيت الموصى به

استخدم هذا كإعداد افتراضي ما لم يكن لديك سبب قوي للقيام بشيء
آخر:

```bash
# Main bot (default profile, port 18789)
openclaw onboard
openclaw gateway install

# Rescue bot (separate Telegram bot, separate profile, port 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

أثناء `openclaw --profile rescue onboard`:

- استخدم رمز روبوت Telegram المنفصل
- أبقِ الملف الشخصي `rescue`
- استخدم منفذًا أساسيًا أعلى من منفذ الروبوت الأساسي بما لا يقل عن 20
- اقبل مساحة عمل الإنقاذ الافتراضية ما لم تكن تدير واحدة بنفسك بالفعل

إذا كان onboarding قد ثبّت خدمة الإنقاذ لك بالفعل، فلن تكون هناك حاجة إلى
`gateway install` النهائي.

### ما الذي يغيّره onboarding

يستخدم `openclaw --profile rescue onboard` تدفق onboarding العادي، لكنه
يكتب كل شيء في ملف شخصي منفصل.

عمليًا، هذا يعني أن روبوت الإنقاذ يحصل على ما يلي بشكل مستقل:

- ملف إعدادات
- دليل حالة
- مساحة عمل (افتراضيًا `~/.openclaw/workspace-rescue`)
- اسم خدمة مُدار

أما المطالبات فهي بخلاف ذلك مماثلة تمامًا لعملية onboarding العادية.

## تعيين المنافذ (المشتقة)

المنفذ الأساسي = `gateway.port` (أو `OPENCLAW_GATEWAY_PORT` / `--port`).

- منفذ خدمة التحكم في browser = الأساسي + 2 (على loopback المحلي فقط)
- يتم تقديم canvas host على خادم HTTP الخاص بـ Gateway (نفس منفذ `gateway.port`)
- تقوم منافذ CDP لملفات browser الشخصية بالتخصيص التلقائي بدءًا من `browser.controlPort + 9 .. + 108`

إذا تجاوزت أيًّا من هذه القيم في الإعدادات أو env، فيجب أن تُبقيها فريدة لكل مثيل.

## ملاحظات browser/CDP (مشكلة شائعة)

- **لا** تثبّت `browser.cdpUrl` على القيم نفسها عبر عدة مثيلات.
- يحتاج كل مثيل إلى منفذ تحكم browser خاص به ونطاق CDP خاص به (مشتق من منفذ Gateway الخاص به).
- إذا كنت بحاجة إلى منافذ CDP صريحة، فاضبط `browser.profiles.<name>.cdpPort` لكل مثيل.
- Chrome البعيد: استخدم `browser.profiles.<name>.cdpUrl` (لكل ملف شخصي، ولكل مثيل).

## مثال env يدوي

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
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

- يساعد `gateway status --deep` على اكتشاف خدمات launchd/systemd/schtasks القديمة المتبقية من عمليات تثبيت أقدم.
- يُتوقع ظهور نص تحذير `gateway probe` مثل `multiple reachable gateways detected` فقط عندما تشغّل عمدًا أكثر من Gateway معزول واحد.
