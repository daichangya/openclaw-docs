---
read_when:
    - أنت تستخدم `openclaw browser` وتريد أمثلة للمهام الشائعة
    - تريد التحكم في browser يعمل على جهاز آخر عبر مضيف node
    - تريد الاتصال بـ Chrome المحلي الذي تم تسجيل الدخول إليه عبر Chrome MCP
summary: مرجع CLI لـ `openclaw browser` ‏(دورة الحياة، وملفات التعريف، وعلامات التبويب، والإجراءات، والحالة، وتصحيح الأخطاء)
title: browser
x-i18n:
    generated_at: "2026-04-23T07:21:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf1a5168e690121d4fc4eac984580c89bc50844f15558413ba6d8a635da2ed6
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

أدر سطح التحكم في browser الخاص بـ OpenClaw وشغّل إجراءات browser (دورة الحياة، وملفات التعريف، وعلامات التبويب، وSnapshots، ولقطات الشاشة، والتنقل، والإدخال، ومحاكاة الحالة، وتصحيح الأخطاء).

ذو صلة:

- أداة browser + API: [أداة Browser](/ar/tools/browser)

## العلامات الشائعة

- `--url <gatewayWsUrl>`: عنوان URL الخاص بـ Gateway WebSocket ‏(الافتراضي من الإعدادات).
- `--token <token>`: رمز Gateway ‏(إذا كان مطلوبًا).
- `--timeout <ms>`: مهلة الطلب (بالمللي ثانية).
- `--expect-final`: انتظر استجابة نهائية من Gateway.
- `--browser-profile <name>`: اختر ملف تعريف browser ‏(الافتراضي من الإعدادات).
- `--json`: خرج قابل للقراءة آليًا (عند الدعم).

## البدء السريع (محلي)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## استكشاف الأخطاء السريع وإصلاحها

إذا فشل `start` مع `not reachable after start`، فاستكشف جاهزية CDP أولًا. إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فهذا يعني أن طبقة التحكم في browser سليمة، وعادةً يكون الفشل بسبب سياسة SSRF الخاصة بالتنقل.

الحد الأدنى من التسلسل:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

إرشادات مفصلة: [استكشاف أخطاء Browser وإصلاحها](/ar/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## دورة الحياة

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

ملاحظات:

- بالنسبة إلى ملفات التعريف `attachOnly` وCDP البعيدة، يقوم `openclaw browser stop` بإغلاق
  جلسة التحكم النشطة ومسح تجاوزات المحاكاة المؤقتة حتى عندما
  لا يكون OpenClaw قد شغّل عملية browser بنفسه.
- بالنسبة إلى ملفات التعريف المحلية المُدارة، يقوم `openclaw browser stop` بإيقاف
  عملية browser التي تم تشغيلها.

## إذا كان الأمر مفقودًا

إذا كان `openclaw browser` أمرًا غير معروف، فتحقق من `plugins.allow` في
`~/.openclaw/openclaw.json`.

عندما تكون `plugins.allow` موجودة، يجب إدراج browser Plugin المضمّن
صراحةً:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

لن يؤدي `browser.enabled=true` إلى استعادة الأمر الفرعي CLI عندما
تستبعد قائمة السماح الخاصة بـ Plugin القيمة `browser`.

ذو صلة: [أداة Browser](/ar/tools/browser#missing-browser-command-or-tool)

## ملفات التعريف

ملفات التعريف هي إعدادات توجيه browser مسماة. عمليًا:

- `openclaw`: يشغّل أو يتصل بمثيل Chrome مخصص يُديره OpenClaw (دليل بيانات مستخدم معزول).
- `user`: يتحكم في جلسة Chrome الحالية المسجّل الدخول فيها عبر Chrome DevTools MCP.
- ملفات تعريف CDP المخصصة: تشير إلى نقطة نهاية CDP محلية أو بعيدة.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

استخدم ملف تعريف محددًا:

```bash
openclaw browser --browser-profile work tabs
```

## علامات التبويب

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / screenshot / الإجراءات

Snapshot:

```bash
openclaw browser snapshot
```

لقطة الشاشة:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

ملاحظات:

- `--full-page` مخصص فقط لالتقاط الصفحة؛ ولا يمكن دمجه مع `--ref`
  أو `--element`.
- تدعم ملفات التعريف `existing-session` / `user` لقطات شاشة الصفحة ولقطات
  الشاشة عبر `--ref` من خرج Snapshot، لكنها لا تدعم لقطات شاشة
  `--element` باستخدام CSS.

التنقل/النقر/الكتابة (أتمتة واجهة مستخدم تعتمد على ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
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

## الحالة والتخزين

Viewport + المحاكاة:

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

Cookies + التخزين:

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

استخدم ملف التعريف `user` المضمّن، أو أنشئ ملف تعريف `existing-session` خاصًا بك:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

هذا المسار خاص بالمضيف فقط. بالنسبة إلى Docker، أو الخوادم عديمة الواجهة، أو Browserless، أو الإعدادات البعيدة الأخرى، استخدم ملف تعريف CDP بدلًا من ذلك.

القيود الحالية لـ existing-session:

- تستخدم الإجراءات المعتمدة على Snapshot مراجع refs، وليس محددات CSS
- يدعم `click` النقر الأيسر فقط
- لا يدعم `type` الخيار `slowly=true`
- لا يدعم `press` الخيار `delayMs`
- ترفض `hover` و`scrollintoview` و`drag` و`select` و`fill` و`evaluate`
  تجاوزات المهلة لكل استدعاء
- يدعم `select` قيمة واحدة فقط
- لا يتم دعم `wait --load networkidle`
- تتطلب عمليات رفع الملفات `--ref` / `--input-ref`، ولا تدعم
  `--element` باستخدام CSS، وتدعم حاليًا ملفًا واحدًا في كل مرة
- لا تدعم أدوات ربط مربعات الحوار `--timeout`
- تدعم لقطات الشاشة التقاطات الصفحة و`--ref`، لكن ليس `--element` باستخدام CSS
- لا تزال `responsebody`، واعتراض التنزيلات، وتصدير PDF، والإجراءات المجمعة
  تتطلب browser مُدارًا أو ملف تعريف CDP خامًا

## التحكم في browser عن بُعد (وكيل مضيف node)

إذا كان Gateway يعمل على جهاز مختلف عن browser، فشغّل **node host** على الجهاز الذي يحتوي على Chrome/Brave/Edge/Chromium. سيقوم Gateway بتمرير إجراءات browser إلى تلك العقدة (من دون الحاجة إلى خادم تحكم منفصل لـ browser).

استخدم `gateway.nodes.browser.mode` للتحكم في التوجيه التلقائي و`gateway.nodes.browser.node` لتثبيت عقدة معينة إذا كانت هناك عدة عقد متصلة.

الأمان + الإعداد عن بُعد: [أداة Browser](/ar/tools/browser)، [الوصول عن بُعد](/ar/gateway/remote)، [Tailscale](/ar/gateway/tailscale)، [الأمان](/ar/gateway/security)
