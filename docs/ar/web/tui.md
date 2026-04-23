---
read_when:
    - تريد شرحًا سهلًا للمبتدئين حول TUI
    - تحتاج إلى القائمة الكاملة لميزات TUI وأوامرها واختصاراتها
summary: 'واجهة المستخدم الطرفية (TUI): الاتصال بـ Gateway أو التشغيل محليًا في الوضع المضمّن'
title: TUI
x-i18n:
    generated_at: "2026-04-23T07:35:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI (واجهة المستخدم الطرفية)

## بداية سريعة

### وضع Gateway

1. ابدأ Gateway.

```bash
openclaw gateway
```

2. افتح TUI.

```bash
openclaw tui
```

3. اكتب رسالة واضغط Enter.

Gateway بعيد:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

استخدم `--password` إذا كان Gateway لديك يستخدم مصادقة بكلمة مرور.

### الوضع المحلي

شغّل TUI من دون Gateway:

```bash
openclaw chat
# أو
openclaw tui --local
```

ملاحظات:

- `openclaw chat` و`openclaw terminal` هما اسمان مستعاران لـ `openclaw tui --local`.
- لا يمكن دمج `--local` مع `--url` أو `--token` أو `--password`.
- يستخدم الوضع المحلي وقت تشغيل الوكيل المضمّن مباشرة. وتعمل معظم الأدوات المحلية، لكن الميزات الخاصة بـ Gateway فقط تكون غير متاحة.

## ما الذي تراه

- الترويسة: عنوان URL الخاص بالاتصال، والوكيل الحالي، والجلسة الحالية.
- سجل الدردشة: رسائل المستخدم، وردود المساعد، وإشعارات النظام، وبطاقات الأدوات.
- سطر الحالة: حالة الاتصال/التشغيل (جارٍ الاتصال، قيد التشغيل، بث، خامل، خطأ).
- التذييل: حالة الاتصال + الوكيل + الجلسة + النموذج + think/fast/verbose/trace/reasoning + عدد tokens + deliver.
- الإدخال: محرر نصي مع إكمال تلقائي.

## النموذج الذهني: الوكلاء + الجلسات

- الوكلاء هم slugs فريدة (مثل `main` و`research`). ويكشف Gateway عن القائمة.
- تنتمي الجلسات إلى الوكيل الحالي.
- تُخزّن مفاتيح الجلسات بالشكل `agent:<agentId>:<sessionKey>`.
  - إذا كتبت `/session main`، يوسّعها TUI إلى `agent:<currentAgent>:main`.
  - إذا كتبت `/session agent:other:main`، فإنك تنتقل إلى جلسة ذلك الوكيل صراحةً.
- نطاق الجلسة:
  - `per-sender` (الافتراضي): لكل وكيل العديد من الجلسات.
  - `global`: تستخدم TUI دائمًا جلسة `global` (وقد يكون المحدد فارغًا).
- يظهر الوكيل + الجلسة الحاليان دائمًا في التذييل.

## الإرسال + التسليم

- تُرسل الرسائل إلى Gateway؛ ويكون التسليم إلى المزوّدات معطّلًا افتراضيًا.
- لتشغيل التسليم:
  - `/deliver on`
  - أو لوحة Settings
  - أو ابدأ باستخدام `openclaw tui --deliver`

## المحددات + الطبقات

- محدد النموذج: يسرد النماذج المتاحة ويضبط تجاوز الجلسة.
- محدد الوكيل: يختار وكيلًا مختلفًا.
- محدد الجلسة: يعرض فقط جلسات الوكيل الحالي.
- Settings: تبديل deliver، وتوسيع مخرجات الأدوات، وظهور thinking.

## اختصارات لوحة المفاتيح

- Enter: إرسال الرسالة
- Esc: إيقاف التشغيل النشط
- Ctrl+C: مسح الإدخال (اضغط مرتين للخروج)
- Ctrl+D: خروج
- Ctrl+L: محدد النموذج
- Ctrl+G: محدد الوكيل
- Ctrl+P: محدد الجلسة
- Ctrl+O: تبديل توسيع مخرجات الأدوات
- Ctrl+T: تبديل ظهور thinking (يعيد تحميل السجل)

## أوامر الشرطة المائلة

الأساسية:

- `/help`
- `/status`
- `/agent <id>` (أو `/agents`)
- `/session <key>` (أو `/sessions`)
- `/model <provider/model>` (أو `/models`)

عناصر التحكم في الجلسة:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (الاسم المستعار: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

دورة حياة الجلسة:

- `/new` أو `/reset` (إعادة تعيين الجلسة)
- `/abort` (إيقاف التشغيل النشط)
- `/settings`
- `/exit`

الوضع المحلي فقط:

- `/auth [provider]` يفتح تدفق المصادقة/تسجيل الدخول الخاص بالمزوّد داخل TUI.

تُمرر أوامر الشرطة المائلة الأخرى الخاصة بـ Gateway (مثل `/context`) إلى Gateway وتُعرض كمخرجات نظام. راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

## أوامر shell المحلية

- ابدأ السطر بالرمز `!` لتشغيل أمر shell محلي على مضيف TUI.
- تطلب TUI مرة واحدة لكل جلسة السماح بالتنفيذ المحلي؛ وإذا رفضت، يبقى `!` معطّلًا لتلك الجلسة.
- تُشغَّل الأوامر في shell جديدة وغير تفاعلية ضمن دليل عمل TUI (من دون `cd`/env دائمة).
- تتلقى أوامر shell المحلية القيمة `OPENCLAW_SHELL=tui-local` في بيئتها.
- يتم إرسال `!` وحدها كرسالة عادية؛ أما المسافات البادئة فلا تفعّل exec المحلي.

## إصلاح التهيئات من TUI المحلية

استخدم الوضع المحلي عندما تكون التهيئة الحالية صالحة بالفعل وتريد من
الوكيل المضمّن فحصها على الجهاز نفسه، ومقارنتها بالوثائق،
والمساعدة في إصلاح الانجراف من دون الاعتماد على Gateway قيد التشغيل.

إذا كان `openclaw config validate` يفشل بالفعل، فابدأ أولًا باستخدام `openclaw configure`
أو `openclaw doctor --fix`. لا يتجاوز `openclaw chat` حاجز
التهيئة غير الصالحة.

حلقة نموذجية:

1. ابدأ الوضع المحلي:

```bash
openclaw chat
```

2. اطلب من الوكيل ما الذي تريد التحقق منه، مثل:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. استخدم أوامر shell المحلية للحصول على دليل دقيق والتحقق:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. طبّق تغييرات ضيقة باستخدام `openclaw config set` أو `openclaw configure`، ثم أعد تشغيل `!openclaw config validate`.
5. إذا أوصى Doctor بترحيل أو إصلاح تلقائي، فراجعه ثم شغّل `!openclaw doctor --fix`.

نصائح:

- فضّل `openclaw config set` أو `openclaw configure` على التعديل اليدوي لـ `openclaw.json`.
- يقوم `openclaw docs "<query>"` بالبحث في فهرس الوثائق المباشر من الجهاز نفسه.
- يفيد `openclaw config validate --json` عندما تريد أخطاء schema وSecretRef/resolvability بشكل منظّم.

## مخرجات الأدوات

- تظهر استدعاءات الأدوات كبطاقات تحتوي على args + النتائج.
- يقوم Ctrl+O بالتبديل بين العرض المطوي/الموسّع.
- أثناء تشغيل الأدوات، تتدفق التحديثات الجزئية إلى البطاقة نفسها.

## ألوان الطرفية

- تُبقي TUI نص متن المساعد بلون foreground الافتراضي لطرفيتك حتى تظل الطرفيات الداكنة والفاتحة مقروءة.
- إذا كانت طرفيتك تستخدم خلفية فاتحة وكان الاكتشاف التلقائي خاطئًا، فاضبط `OPENCLAW_THEME=light` قبل تشغيل `openclaw tui`.
- ولإجبار اللوحة الداكنة الأصلية بدلًا من ذلك، اضبط `OPENCLAW_THEME=dark`.

## السجل + البث

- عند الاتصال، تحمل TUI أحدث سجل (الافتراضي 200 رسالة).
- يتم تحديث الردود المتدفقة في مكانها حتى يتم إنهاؤها.
- كما تستمع TUI أيضًا إلى أحداث أدوات الوكيل من أجل بطاقات أدوات أغنى.

## تفاصيل الاتصال

- تسجل TUI نفسها مع Gateway على أنها `mode: "tui"`.
- تُظهر إعادة الاتصال رسالة نظام؛ وتُعرض فجوات الأحداث في السجل.

## الخيارات

- `--local`: التشغيل مقابل وقت تشغيل الوكيل المحلي المضمّن
- `--url <url>`: عنوان URL الخاص بـ Gateway WebSocket (الافتراضي من التهيئة أو `ws://127.0.0.1:<port>`)
- `--token <token>`: token الخاص بـ Gateway (إذا لزم)
- `--password <password>`: كلمة مرور Gateway (إذا لزم)
- `--session <key>`: مفتاح الجلسة (الافتراضي: `main`، أو `global` عندما يكون النطاق عالميًا)
- `--deliver`: تسليم ردود المساعد إلى المزوّد (معطّل افتراضيًا)
- `--thinking <level>`: تجاوز مستوى التفكير لعمليات الإرسال
- `--message <text>`: إرسال رسالة أولية بعد الاتصال
- `--timeout-ms <ms>`: مهلة الوكيل بالمللي ثانية (الافتراضي `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: عدد إدخالات السجل المطلوب تحميلها (الافتراضي `200`)

ملاحظة: عند ضبط `--url`، لا تعود TUI إلى بيانات الاعتماد الموجودة في التهيئة أو البيئة.
مرّر `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأً.
وفي الوضع المحلي، لا تمرر `--url` أو `--token` أو `--password`.

## استكشاف الأخطاء وإصلاحها

لا توجد مخرجات بعد إرسال رسالة:

- شغّل `/status` في TUI للتأكد من أن Gateway متصل وخامل/مشغول.
- تحقق من سجلات Gateway: `openclaw logs --follow`.
- تأكد من أن الوكيل يمكنه التشغيل: `openclaw status` و`openclaw models status`.
- إذا كنت تتوقع رسائل في قناة دردشة، فقم بتمكين التسليم (`/deliver on` أو `--deliver`).

## استكشاف أخطاء الاتصال وإصلاحها

- `disconnected`: تأكد من أن Gateway يعمل وأن `--url/--token/--password` صحيحة.
- لا يوجد وكلاء في المحدد: تحقق من `openclaw agents list` ومن تهيئة التوجيه لديك.
- محدد الجلسة فارغ: قد تكون في نطاق global أو لا توجد جلسات بعد.

## ذو صلة

- [Control UI](/ar/web/control-ui) — واجهة التحكم المستندة إلى الويب
- [Config](/ar/cli/config) — فحص `openclaw.json` والتحقق منه وتحريره
- [Doctor](/ar/cli/doctor) — فحوصات إصلاح وترحيل إرشادية
- [مرجع CLI](/ar/cli) — المرجع الكامل لأوامر CLI
