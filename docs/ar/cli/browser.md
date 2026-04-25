---
read_when:
    - أنت تستخدم `openclaw browser` وتريد أمثلة للمهام الشائعة
    - تريد التحكم في متصفح يعمل على جهاز آخر عبر مضيف node
    - تريد الإرفاق بمتصفح Chrome المحلي الذي تم تسجيل الدخول إليه عبر Chrome MCP
summary: مرجع CLI لـ `openclaw browser` (دورة الحياة، والملفات الشخصية، وعلامات التبويب، والإجراءات، والحالة، وتصحيح الأخطاء)
title: Browser
x-i18n:
    generated_at: "2026-04-25T13:43:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2157146e54c77fecafcc5e89dd65244bd7ebecc37f86b45921ccea025188a8
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

إدارة واجهة التحكم بالمتصفح في OpenClaw وتشغيل إجراءات المتصفح (دورة الحياة، والملفات الشخصية، وعلامات التبويب، واللقطات، ولقطات الشاشة، والتنقل، والإدخال، ومحاكاة الحالة، وتصحيح الأخطاء).

ذو صلة:

- أداة Browser وAPI: [أداة Browser](/ar/tools/browser)

## العلامات الشائعة

- `--url <gatewayWsUrl>`: عنوان URL لـ Gateway WebSocket (القيمة الافتراضية من الإعدادات).
- `--token <token>`: رمز Gateway المميز (إذا كان مطلوبًا).
- `--timeout <ms>`: مهلة الطلب (بالملي ثانية).
- `--expect-final`: الانتظار للحصول على استجابة Gateway نهائية.
- `--browser-profile <name>`: اختيار ملف شخصي للمتصفح (الافتراضي من الإعدادات).
- `--json`: خرج قابل للقراءة آليًا (حيثما كان مدعومًا).

## بدء سريع (محلي)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

يمكن للوكلاء تشغيل فحص الجاهزية نفسه باستخدام `browser({ action: "doctor" })`.

## استكشاف الأخطاء السريع وإصلاحها

إذا فشل `start` مع `not reachable after start`، فابدأ باستكشاف جاهزية CDP أولًا. إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فهذا يعني أن مستوى التحكم بالمتصفح سليم وأن الفشل يكون عادةً بسبب سياسة SSRF الخاصة بالتنقل.

تسلسل أدنى:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

إرشادات مفصلة: [استكشاف أخطاء Browser وإصلاحها](/ar/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## دورة الحياة

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

ملاحظات:

- بالنسبة إلى ملفات التعريف `attachOnly` وCDP البعيدة، يقوم `openclaw browser stop` بإغلاق
  جلسة التحكم النشطة ومسح تجاوزات المحاكاة المؤقتة حتى عندما
  لا يكون OpenClaw هو من شغّل عملية المتصفح بنفسه.
- بالنسبة إلى الملفات الشخصية المحلية المُدارة، يقوم `openclaw browser stop` بإيقاف
  عملية المتصفح التي تم تشغيلها.
- ينطبق `openclaw browser start --headless` على طلب البدء هذا فقط
  وفقط عندما يقوم OpenClaw بتشغيل متصفح محلي مُدار. وهو لا يعيد كتابة
  `browser.headless` أو إعدادات الملف الشخصي، ولا يفعل شيئًا إذا كان
  المتصفح قيد التشغيل بالفعل.
- على مضيفات Linux التي لا تحتوي على `DISPLAY` أو `WAYLAND_DISPLAY`، تعمل الملفات الشخصية المحلية المُدارة
  في وضع headless تلقائيًا ما لم يطلب `OPENCLAW_BROWSER_HEADLESS=0`،
  أو `browser.headless=false`، أو `browser.profiles.<name>.headless=false`
  صراحةً متصفحًا مرئيًا.

## إذا كان الأمر مفقودًا

إذا كان `openclaw browser` أمرًا غير معروف، فتحقق من `plugins.allow` في
`~/.openclaw/openclaw.json`.

عند وجود `plugins.allow`، يجب إدراج
Plugin المتصفح المضمّن صراحةً:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

لن تؤدي `browser.enabled=true` إلى استعادة الأمر الفرعي في CLI عندما
تستبعد قائمة السماح الخاصة بالإضافات `browser`.

ذو صلة: [أداة Browser](/ar/tools/browser#missing-browser-command-or-tool)

## الملفات الشخصية

الملفات الشخصية هي إعدادات توجيه مسماة للمتصفح. عمليًا:

- `openclaw`: يشغّل أو يرفق نسخة Chrome مخصصة مُدارة بواسطة OpenClaw (دليل بيانات مستخدم معزول).
- `user`: يتحكم في جلسة Chrome الحالية المسجّل الدخول إليها عبر Chrome DevTools MCP.
- ملفات تعريف CDP المخصصة: تشير إلى نقطة نهاية CDP محلية أو بعيدة.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

استخدم ملفًا شخصيًا محددًا:

```bash
openclaw browser --browser-profile work tabs
```

## علامات التبويب

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

يعرض `tabs` قيمة `suggestedTargetId` أولًا، ثم `tabId` الثابت مثل `t1`،
ثم التصنيف الاختياري، و`targetId` الخام. يجب على الوكلاء تمرير
`suggestedTargetId` مرة أخرى إلى `focus` و`close` واللقطات والإجراءات. يمكنك
تعيين تصنيف باستخدام `open --label` أو `tab new --label` أو `tab label`؛ كما أن التصنيفات،
ومعرّفات علامات التبويب، ومعرّفات الأهداف الخام، والبادئات الفريدة لمعرّف الهدف كلها مقبولة.

## اللقطة / لقطة الشاشة / الإجراءات

اللقطة:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

لقطة الشاشة:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

ملاحظات:

- `--full-page` مخصص لالتقاط الصفحات فقط؛ ولا يمكن دمجه مع `--ref`
  أو `--element`.
- تدعم الملفات الشخصية `existing-session` / `user` لقطات الشاشة للصفحات ولقطات `--ref`
  من خرج اللقطات، لكنها لا تدعم لقطات CSS `--element`.
- يضيف `--labels` تراكبًا للمراجع الحالية من اللقطة على لقطة الشاشة.
- يضيف `snapshot --urls` وجهات الروابط المكتشفة إلى لقطات AI حتى
  يتمكن الوكلاء من اختيار أهداف تنقل مباشرة بدلًا من التخمين من نص الرابط فقط.

التنقل/النقر/الكتابة (أتمتة واجهة مستخدم معتمدة على المرجع):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

مساعدات الملفات + مربعات الحوار:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

تحفظ ملفات تعريف Chrome المُدارة التنزيلات العادية الناتجة عن النقرات في دليل تنزيلات OpenClaw
(`/tmp/openclaw/downloads` افتراضيًا، أو جذر الملفات المؤقتة المُعدّ).
استخدم `waitfordownload` أو `download` عندما يحتاج الوكيل إلى انتظار
ملف محدد وإرجاع مساره؛ فعمليات الانتظار الصريحة هذه تتولى التنزيل التالي.

## الحالة والتخزين

منفذ العرض + المحاكاة:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

ملفات تعريف الارتباط + التخزين:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## تصحيح الأخطاء

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome الحالي عبر MCP

استخدم الملف الشخصي `user` المضمّن، أو أنشئ ملف `existing-session` خاصًا بك:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

هذا المسار خاص بالمضيف فقط. بالنسبة إلى Docker أو الخوادم headless أو Browserless أو الإعدادات البعيدة الأخرى، استخدم ملف CDP شخصيًا بدلًا من ذلك.

القيود الحالية لـ existing-session:

- تستخدم الإجراءات المعتمدة على اللقطات المراجع، وليس محددات CSS
- تضبط `browser.actionTimeoutMs` القيمة الافتراضية لطلبات `act` المدعومة على 60000 مللي ثانية عندما
  لا يمرر المستدعون `timeoutMs`؛ ولا تزال قيمة `timeoutMs` لكل استدعاء هي الأعلى أولوية.
- `click` للنقرة اليسرى فقط
- لا يدعم `type` الخيار `slowly=true`
- لا يدعم `press` الخيار `delayMs`
- ترفض `hover` و`scrollintoview` و`drag` و`select` و`fill` و`evaluate`
  تجاوزات المهلة لكل استدعاء
- يدعم `select` قيمة واحدة فقط
- لا يكون `wait --load networkidle` مدعومًا
- تتطلب عمليات رفع الملفات `--ref` / `--input-ref`، ولا تدعم CSS
  `--element`، وتدعم حاليًا ملفًا واحدًا في كل مرة
- لا تدعم خطافات مربعات الحوار `--timeout`
- تدعم لقطات الشاشة التقاط الصفحات و`--ref`، لكن ليس CSS `--element`
- لا تزال `responsebody` واعتراض التنزيلات وتصدير PDF والإجراءات المجمّعة
  تتطلب متصفحًا مُدارًا أو ملف CDP خامًا

## التحكم بالمتصفح البعيد (وكيل مضيف node)

إذا كانت Gateway تعمل على جهاز مختلف عن المتصفح، فشغّل **مضيف node** على الجهاز الذي يحتوي على Chrome أو Brave أو Edge أو Chromium. ستقوم Gateway بتمرير إجراءات المتصفح إلى تلك العقدة (ولا يلزم خادم منفصل للتحكم بالمتصفح).

استخدم `gateway.nodes.browser.mode` للتحكم في التوجيه التلقائي، واستخدم `gateway.nodes.browser.node` لتثبيت عقدة محددة إذا كان هناك عدة عقد متصلة.

الأمان + الإعداد البعيد: [أداة Browser](/ar/tools/browser)، [الوصول البعيد](/ar/gateway/remote)، [Tailscale](/ar/gateway/tailscale)، [الأمان](/ar/gateway/security)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Browser](/ar/tools/browser)
